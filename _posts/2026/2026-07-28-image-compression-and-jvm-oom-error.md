---
title: "PNG 이미지 압축 방식과 JVM OOM(Out Of Memory) 에러"
search: false
category:
  - information
  - jvm
  - spring-boot
  - out-of-memory-error
last_modified_at: 2026-07-29T22:34:50+09:00
---

<br/>

## 0. 들어가면서

최근 프로젝트에서 S3 이미지를 리사이즈(resize)해 마이그레이션하는 과정에서 발생한 에러와 이를 해결하기 위해 트러블 슈팅하며 배운 내용을 글로 정리했다.

## 1. Problem context

최근 프로젝트는 API 서버를 경유해 S3 버킷에서 이미지를 가져오고 있었다. API 서버를 경유한 이유는 사내 보안 이슈와 프로젝트 초반에는 오버 엔지니어링이라는 판단이 있었기 때문일 것이다.

다만, 모든 이미지를 API 서버를 경유해 가져오고 있었기 때문에 API 서버의 부하가 컸다. 특히, 원본 이미지만 저장한 뒤 이미지를 읽을 때마다 썸네일을 만들어 반환하는 로직 때문에 서버 메모리가 불안정했다.

이 문제를 해결하기 위해 다음과 같은 로직으로 리팩토링이 필요했다.

1. 이미지를 업로드하는 시점에 썸네일 이미지를 생성해 S3 버킷에 저장한다.
2. 이미지를 읽을 때는 S3 버킷에 사전에 저장된 썸네일 이미지를 그대로 사용한다.

이미 운영 중인 시스템이었기에 기존 원본 이미지들의 썸네일도 필요했다. 이를 위해 원본 이미지를 썸네일로 리사이즈한 후 특정 디렉터리에 업로드하는 마이그레이션(migration) 작업을 수행했다. 마이그레이션 과정에서 일부 이미지를 썸네일로 리사이즈하는 데 실패했다. 실패한 프로세스의 에러 로그를 살펴보면 다음과 같은 메시지를 볼 수 있었다.

```
java.lang.OutOfMemoryError: Java heap space
  at java.desktop/java.awt.image.DataBufferByte.<init>(Unknown Source) ~[na:na]
  at java.desktop/java.awt.image.Raster.createInterleavedRaster(Unknown Source) ~[na:na]
  at java.desktop/java.awt.image.BufferedImage.<init>(Unknown Source) ~[na:na]
  at net.coobird.thumbnailator.builders.BufferedImageBuilder.build(Unknown Source) ~[thumbnailator-0.4.21.jar!/:0.4.21]
  at net.coobird.thumbnailator.resizers.ProgressiveBilinearResizer.resize(Unknown Source) ~[thumbnailator-0.4.21.jar!/:0.4.21]
...
```

처음에는 하나의 프로세스에서 버킷에 저장된 모든 원본 이미지의 썸네일 리사이즈를 수행했기 때문에 OOM(OutOfMemory) 에러가 발생한 이유를 정확하게 진단하지 못했다.

- AWS ECS 태스크(task)를 사용했다. 태스크를 실행할 때 사양은 CPU 2개, 메모리 4GB였다.
- 가장 큰 원본 이미지도 10MB밖에 되지 않았다.

이미지 크기가 그리 크지 않다 보니 메모리 이슈의 원인이 라이브러리에 있다고 판단했다. 기존 비즈니스 로직에서 썸네일 이미지를 생성하기 위해 [Thumbnailator](https://github.com/coobird/thumbnailator)라는 라이브러리를 사용하고 있었다. 이 라이브러리의 이슈를 살펴보면 메모리 누수(leak)나 OOM 에러와 관련된 내용이 제법 있었기 때문에 더 헷갈렸던 것 같다.

- [OutOfMemoryErrors (memory leak) when using latest versions of Java 6 and 7](https://github.com/coobird/thumbnailator/issues/42)
- [Memory Leak using Thumbnails asBufferedImage()](https://github.com/coobird/thumbnailator/issues/44)
- [JVM memory becomes high when generating thumbnails](https://github.com/coobird/thumbnailator/issues/222)

라이브러리의 메모리 누수 문제라면 하나의 프로세스에서 모든 이미지를 처리하지 않고 이미지마다 썸네일 리사이징 ECS 태스크를 실행하는 것이 가장 쉬운 해결 방법이라고 생각했다. 다음과 같이 리사이징 프로세스를 변경했다.

1. 원본 이미지를 특정 디렉터리로 복사한다.
2. 원본 이미지 복사가 끝나면 해당 이벤트를 트리거로 썸네일 리사이즈 ECS 태스크를 실행한다.
3. 실행된 ECS 태스크는 원본 이미지를 받아 썸네일로 리사이즈한 후 S3 버킷에 업로드한다.
4. 프로세스가 종료된다.

하나의 이미지만 썸네일로 리사이즈한 후 프로세스가 종료되도록 변경했음에도 OOM 에러가 발생했다. 내 예상과 달리 메모리 누수 문제가 아니었다. 지금부터 문제가 발생한 원인을 정리해 보자.

## 2. Cause of the problem

문제가 되는 이미지들은 하나만 JVM 메모리에 올려도 큰 공간을 차지했다. 간단한 예제 코드로 문제를 일으키는 이미지가 메모리에 올라올 때 어느 정도의 공간을 차지하는지 살펴보자. 다음과 같은 코드를 사용했다.

- 프로젝트 리소스 경로에서 이미지를 읽은 후 Thumbnailator 라이브러리를 사용해서 이미지를 리사이즈한다.
- 대상 파일 이름은 파라미터로 전달받는다.

```java
package action.in.blog.controller;

import net.coobird.thumbnailator.Thumbnails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
public class ThumbnailController {

    private static final int THUMBNAIL_MAX_SIZE = 200;
    private static final double THUMBNAIL_QUALITY = 0.7;

    @GetMapping("/thumbnails")
    public void thumbnails(@RequestParam String filename) throws IOException {
        String projectRoot = System.getProperty("user.dir");
        Path inputPath = Paths.get(projectRoot, "src", "main", "resources", "static", filename);
        try (InputStream inputStream = Files.newInputStream(inputPath)) {
            Thumbnails.of(inputStream)
                    .size(THUMBNAIL_MAX_SIZE, THUMBNAIL_MAX_SIZE)
                    .keepAspectRatio(true)
                    .outputFormat("JPEG")
                    .outputQuality(THUMBNAIL_QUALITY)
                    .toOutputStream(new ByteArrayOutputStream());
        }
    }
}
```

위 메서드가 실행될 때 메모리를 얼마나 차지하는지 살펴보자. 테스트에 사용한 이미지는 다음과 같다.

- 8000 × 8000 해상도, 266KB 크기의 이미지
- 12000 × 12000 해상도, 582KB 크기의 이미지
- 16000 × 16000 해상도, 995KB 크기의 이미지

<div align="center">
  <img src="{{ site.image_url_2026 }}/image-compression-and-jvm-oom-error-01.png" width="100%" class="image__border">
</div>

<br/>

테스트에 사용한 이미지들은 크기가 1MB도 되지 않지만 해상도는 매우 높다. 각 이미지를 JVM 애플리케이션에 올렸을 때 힙(heap) 메모리가 어떻게 변하는지 살펴보자.

8000 × 8000 해상도, 266KB 크기의 이미지를 메모리에 올리면 힙 메모리를 537MB 정도 사용한다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/image-compression-and-jvm-oom-error-02.png" width="100%" class="image__border">
</div>

<br/>

12000 × 12000 해상도, 582KB 크기의 이미지를 메모리에 올리면 힙 메모리를 1.18GB 정도 사용한다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/image-compression-and-jvm-oom-error-03.png" width="100%" class="image__border">
</div>

<br/>

16000 × 16000 해상도, 995KB 크기의 이미지를 메모리에 올리면 힙 메모리를 2GB 정도 사용한다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/image-compression-and-jvm-oom-error-04.png" width="100%" class="image__border">
</div>

<br/>

이미지 크기는 작은데 JVM 메모리에 올리면 왜 이렇게 많은 메모리를 사용할까? 이는 이미지 압축 방식과 JVM 애플리케이션이 이미지를 로딩하는 방식에 연관이 있다.

이번에 문제를 일으켰던 PNG 이미지의 압축 방식을 간략하게 살펴보자. PNG 이미지는 무손실 압축 방법을 사용해 크기를 작게 만든다. 압축을 해제하면 원래 픽셀 값을 완전히 동일하게 복원할 수 있다. PNG 이미지는 크게 다음 두 단계를 거쳐 압축된다.

1. **필터링(filtering)**: 압축하기 쉬운 형태로 데이터를 변환한다.
2. **디플레이트(deflate)**: 반복 패턴과 데이터 출현 빈도를 이용해서 데이터 크기를 줄인다.

디플레이트는 `LZ77`과 `허프만 코딩(Huffman Coding)`이라는 두 가지 기술이 결합되어 작동한다.

- **LZ77**: 데이터 내에 반복되는 바이트열(중복 문자열)이 있는지 찾아내 길이와 거리로 표현한다.
- **허프만 코딩(Huffman Coding)**: LZ77 작업 이후 만들어진 리터럴, 길이, 거리 등의 기호를 가변 길이 비트 코드로 표현한다.

간단한 예시를 통해 이해해보자. 어떤 이미지를 바이트(byte)로 표현하면 다음과 같은 데이터라고 가정해보자.

```
120 121 122 123 124
120 121 122 123 124
125 126 127 128 129
```

위 이미지에 Sub 필터를 적용시키면 다음과 같은 데이터로 변경된다. Sub 필터는 현재 바이트에서 이전 픽셀의 대응하는 바이트를 뺀 값을 기록하는 방식이다.

- 첫 번째 바이트는 왼쪽에 값이 없으므로 원래 값이 남는다.
- 두 번째 바이트는 121에서 120을 뺀 `1`로 표현한다.
- 세 번째 바이트는 122에서 121을 뺀 `1`로 표현한다.
- 네 번째 바이트는 123에서 122를 뺀 `1`로 표현한다.
- 다섯 번째 바이트는 124에서 123을 뺀 `1`로 표현한다.

```
120 1 1 1 1
120 1 1 1 1
125 1 1 1 1
```

실제 PNG 압축 입력에는 각 행 앞에 Sub 필터를 의미하는 필터 타입 1이 추가된다.

```
1 120 1 1 1 1
1 120 1 1 1 1
1 125 1 1 1 1
```

디플레이트 과정은 실제 압축 과정이다. 필터링된 스캔라인을 디플레이트 알고리즘으로 압축한다. 먼저 LZ77로 반복되는 바이트열을 참조로 바꾼다. 첫 번째 행은 이전 데이터가 없으므로 리터럴로 기록한다. 두 번째 행은 바로 앞의 6바이트와 완전히 같으므로 이를 길이와 거리 참조로 표현할 수 있다.

- 현재 위치에서 6바이트 뒤로 이동한 다음, 그 위치부터 6바이트를 복사하라.

```
리터럴 1
리터럴 120
리터럴 1
리터럴 1
리터럴 1
리터럴 1

<길이 6, 거리 6>

리터럴 1
리터럴 125
리터럴 1
리터럴 1
리터럴 1
리터럴 1
```

다음으로 허프만 코딩을 통해 자주 쓰이는 기호에 짧은 코드를 부여한다. LZ77 처리가 끝난 결과는 다음과 같은 기호로 구성된다.

- 원본 바이트를 나타내는 리터럴
- 복사 길이를 나타내는 길이 기호
- 뒤로 이동할 거리를 나타내는 거리 기호
- 압축 블록의 끝을 나타내는 기호

디플레이트는 이 기호들을 허프만 코딩으로 비트열로 변환한다. 허프만 코딩은 모든 기호에 같은 길이의 코드를 사용하는 대신, 자주 등장하는 기호에는 짧은 코드를, 드물게 등장하는 기호에는 긴 코드를 부여한다.

예를 들어 앞에서 살펴본 LZ77 처리 결과에서 다음과 같은 빈도가 나타났다고 가정하자.

```
리터럴 1: 1,000회
길이 기호 L6: 300회
리터럴 120: 20회
리터럴 125: 10회
그 밖의 기호: 소수
```

위 기호를 다음과 같이 변경한다.

```
리터럴 1 → 0
길이 기호 L6 → 10
리터럴 120 → 110
리터럴 125 → 1110
기타 기호 → 11110, 11111, ...
```

위 변경에서 가장 자주 사용하는 `리터럴 1`은 1비트(bit)만 사용한다. 상대적으로 드물게 등장하는 `리터럴 125`는 더 긴 코드를 사용한다. `리터럴 1`을 실제 값 그대로 표현했다면 00000001(8비트)이지만, 1비트로 표현했기 때문에 크기가 7비트 줄어드는 효과를 얻을 수 있다.

지금까지 PNG 압축 과정을 살펴봤다. 해상도가 큰 이미지라도 비슷한 색상이 반복되는 이미지이거나 비슷한 색상으로 이루어진 이미지라면 압축 효과가 뛰어나기 때문에 이미지 용량은 극적으로 줄어든다.

압축 효과가 크더라도 해상도가 매우 큰 이미지를 JVM에 올리면 어떻게 될까? JVM은 압축된 PNG 이미지를 사용하는 것이 아니라 압축을 모두 해제한 픽셀 배열(raster)을 메모리에 올린다. 그렇기에 메모리 사용량은 다음과 같이 유추할 수 있다.

```
메모리 사용량 ≈ 가로 × 세로 × 픽셀당 바이트(Byte)
```

예를 들어 보자. RGB 채널 이미지의 픽셀 하나는 24비트를 사용한다.

- RED 8비트
- GREEN 8비트
- BLUE 8비트

투명도까지 포함된 RGBA 채널 이미지는 32비트를 사용한다. 픽셀 하나를 표현하기 위해 32비트를 사용하는 것이다. 테스트에서 사용한 8000 × 8000 해상도의 이미지는 64,000,000개의 픽셀로 이루어져 있다. 픽셀 하나에 32비트를 사용한다면 해당 이미지의 메모리 사용량은 256MB 정도다. 앞에서 살펴본 다른 이미지들의 메모리 사용량은 어떨까?

- 12000 × 12000 해상도 이미지는 576MB 정도의 메모리가 필요하다.
- 16000 × 16000 해상도 이미지는 1GB(1024MB) 정도의 메모리가 필요하다.

위 계산은 단순히 이미지가 JVM 힙 메모리를 어느 정도 차지할지 계산한 것이다. 실제 썸네일 이미지 리사이징 과정에서 JVM이 필요로 하는 힙 메모리는 더 클 가능성이 높다.

- 원본 이미지 BufferedImage 객체
- 인코딩, 디코딩 버퍼 객체
- 임시 버퍼 객체
- 리사이즈 이미지 BufferedImage 객체


## CLOSING

작은 이미지도 JVM 메모리에 올릴 때 서버에 얼마나 큰 부하를 줄 수 있는지 배웠다. 프로젝트에서 문제를 일으킨 이미지는 피그잼(FigJam) 보드를 저장한 것이었다. 이미지의 배경 색상이 대부분 같고 곳곳에 스티키(sticky)가 있었다. 보드가 매우 커서 해상도는 높았지만, PNG 압축률이 좋아 이미지 크기는 작았던 것으로 보인다. 로컬 환경에서 리사이징해 보니 힙 메모리를 약 5.5GB 사용했다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/image-compression-and-jvm-oom-error-05.png" width="100%" class="image__border">
</div>

<br/>

개인적으로 [Thumbnailator](https://github.com/coobird/thumbnailator) 라이브러리에 실제로 메모리 누수가 있는지 확인해 봤다. 결론적으로 메모리 누수는 없는 것 같다. 로컬 환경에서 Thumbnailator 라이브러리로 리사이즈 작업을 반복해서 수행하고 JVM 메모리 상태를 모니터링해 봤다.

- 반복되는 이미지 리사이징 작업이 있음에도 가비지 컬렉션은 정상적으로 이뤄졌다.
- 사용 중인 메모리에 대한 가비지 컬렉션이 제대로 이뤄지지 않아 메모리가 누적되는 현상은 없었다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/image-compression-and-jvm-oom-error-06.png" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-07-28-image-compression-and-jvm-oom-error>

#### REFERENCE

- <https://github.com/coobird/thumbnailator>
- <https://visualvm.github.io/>
- <https://www.libpng.org/pub/png/book/chapter09.html>
- <https://www.w3.org/TR/PNG-Filters.html>
- <https://www.rfc-editor.org/info/rfc1951/>
