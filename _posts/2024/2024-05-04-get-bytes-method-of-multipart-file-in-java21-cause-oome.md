---
title: "getBytes method of MultipartFile cause out of memory in Java 21"
search: false
category:
  - java
  - jvm
  - spring-boot
last_modified_at: 2024-05-04T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [ThreadLocal Class][thread-local-class-in-java-link]
- [Out of memory error when Direct Buffer Memory allocation][out-of-memory-error-case-study-in-jvm-link]

## 0. 들어가면서

[Out of memory error when Direct Buffer Memory allocation][out-of-memory-error-case-study-in-jvm-link] 글에서 잠깐 언급했지만, 글의 주제를 벗어나거나 이야기가 길어질 것 같아 자세한 부분까지 함께 정리하지 못 했다. 이전 글에서 다루지 못 했던 디테일에 대해 이야기해 보려 한다. 간단한 예제 코드와 함께 확인해보자.

## 1. Problem Context

문제가 발생했을 때 JVM 애플리케이션 환경은 다음과 같다.

- Java 21
- 최대 다이렉트 메모리 사이즈 10MB
- 최대 힙 메모리 사이즈 2.8GB 

비디오를 업로드하는 기능이고, 문제가 발생한 코드는 다음과 같다.

- 업로드 파일 데이터가 담긴 MultipartFile 인스턴스로부터 데이터를 복사한다.

```java
    private File convertToFile(MultipartFile multipartFile) {
        File copiedFile = new File(Objects.requireNonNull(multipartFile.getOriginalFilename()));
        try (OutputStream os = new FileOutputStream(copiedFile)) {
            os.write(multipartFile.getBytes());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return copiedFile;
    }
```

비디오 사이즈는 10MB 미만 정도로 그렇게 크지 않지만, 파일을 몇 개 업로드 하면 다음과 같은 에러를 만나면서 해당 기능이 완전 고장난다.

```
java.lang.OutOfMemoryError: Cannot reserve 6234342 bytes of direct buffer memory (allocated: 6267110, limit: 10485760)
	at java.base/java.nio.Bits.reserveMemory(Bits.java:178) ~[na:na]
	at java.base/java.nio.DirectByteBuffer.<init>(DirectByteBuffer.java:111) ~[na:na]
	at java.base/java.nio.ByteBuffer.allocateDirect(ByteBuffer.java:360) ~[na:na]
	at java.base/sun.nio.ch.Util.getTemporaryDirectBuffer(Util.java:242) ~[na:na]
	at java.base/sun.nio.ch.IOUtil.read(IOUtil.java:303) ~[na:na]
	at java.base/sun.nio.ch.IOUtil.read(IOUtil.java:283) ~[na:na]
	at java.base/sun.nio.ch.FileChannelImpl.read(FileChannelImpl.java:234) ~[na:na]
	at java.base/sun.nio.ch.ChannelInputStream.read(ChannelInputStream.java:74) ~[na:na]
	at java.base/sun.nio.ch.ChannelInputStream.read(ChannelInputStream.java:103) ~[na:na]
	at java.base/sun.nio.ch.ChannelInputStream.readAllBytes(ChannelInputStream.java:133) ~[na:na]
	at org.springframework.util.FileCopyUtils.copyToByteArray(FileCopyUtils.java:149) ~[spring-core-6.1.6.jar:6.1.6]
	at org.springframework.web.multipart.support.StandardMultipartHttpServletRequest$StandardMultipartFile.getBytes(StandardMultipartHttpServletRequest.java:255) ~[spring-web-6.1.6.jar:6.1.6]
	at action.in.blog.controller.FileController.convertToFile(FileController.java:17) ~[main/:na]
	at action.in.blog.controller.FileController.uploadFile(FileController.java:54) ~[main/:na]
  ... 
```

## 2. Java Memory Profiling 

필자는 여러 프로젝트 경험이 있지만, 파일을 업로드하는 기능을 개발할 때 이런 에러는 처음 만났다. [이전 글][out-of-memory-error-case-study-in-jvm-link]에서 이야기 했듯이 처음엔 빌드팩(buildpack)에서 제한하는 다이렉트 메모리가 너무 작은 것이 문제라고 생각했다. 일시적으로 해결된 것처럼 보였지만, 혹시나 하는 생각에 Java 버전을 17로 낮춰 테스트해 봤다. 동일한 메모리 제약 사항에도 Java 21 버전과 다르게 OOM(out of memory) 에러가 발생하지 않았다. 

이게 어찌된 일인가? 먼저 필자가 프로파일링 한 내용들을 살펴보자. 테스트를 위해 사용한 JDK(Java Development Kit)는 다음과 같다.

- temurin-17
- temurin-21

JVM 애플리케이션 옵션은 다음과 같다. 

- `-XX:NativeMemoryTracking=summary` 
  - `jcmd` 도구로 네이티브 메모리 사용을 추적하기 위해 추가한다.
- `-Xmx2G` 
  - 최대 힙 메모리 사이즈는 2GB로 제한한다.

짧은 시간동안 많은 요청을 보내기 위해 아파치 제이미터(apache jmeter)를 사용했다. 스레드 그룹은 다음과 같이 설정했다.

- 스레드 수는 `200`개로 지정한다.
- 램프-업(ramp-up) 시간은 3초로 지정한다.
- 5초 동안 지속한다.

힙 메모리 사용량을 확인하기 위해 비주얼VM(VisualVM)과 jcmd 도구를 함께 사용했다. 테스트를 위해 사용한 비디오 파일 사이즈는 17.6MB이다. 샘플 비디오는 해당 [링크](https://videos.pexels.com/video-files/5532767/5532767-uhd_2160_4096_25fps.mp4)에서 다운로드 받을 수 있다.

JVM 애플리케이션에 다음과 같은 엔드-포인트(end-point)를 만든다.

```java
package action.in.blog.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Objects;

@RestController
public class FileController {

    private File convertToFile(MultipartFile multipartFile) {
        File copiedFile = new File(Objects.requireNonNull(multipartFile.getOriginalFilename()));
        try (OutputStream os = new FileOutputStream(copiedFile)) {
            os.write(multipartFile.getBytes());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return copiedFile;
    }

    @PostMapping("/file")
    public String uploadFile(@RequestParam("file") MultipartFile file) {
        var result = convertToFile(file);
        System.out.printf("file size: %s bytes\n", result.length());
        return "ok";
    }
}
```

### 2.1. Profiling in Java 17

Java 17 환경에서 실행한 애플리케이션의 동작을 확인해보자. `-XX:MaxDirectMemorySize=20M` 옵션을 사용해 최대 다이렉트 메모리 사이즈를 20MB으로 제한한 상태에서 아파치 제이미터로 요청을 보낸다.

- 최대 힙 메모리 사이즈까지 메모리 사용량은 계속 늘어나지만, OOM 에러는 발생하지 않는다.

<div align="center">
  <img src="/images/posts/2024/get-bytes-method-of-multipart-file-in-java21-cause-oome-01.gif" width="100%" class="image__border">
</div>

<br/>

jcmd 도구로 네이티브 메모리 사용량을 추적해보자. 다이렉트 메모리가 약 2MB(1984KB) 증가했다. 많은 글에서 jcmd 도구로 다이렉트 메모리 사용량을 측정할 때 `Internal` 항목을 확인하지만, 필자가 직접 테스트해 본 결과 `Other` 영역의 메모리가 증가한다. Java 버전마다 다른 것일 수 있다. jcmd 도구로 다이렉트 메모리 측정하는 방법은 다른 글로 정리할 예정이다. 

```
$ jcmd 50887 VM.native_memory summary.diff

Native Memory Tracking:

... 

- Other (reserved=2034KB +1984KB, committed=2034KB +1984KB)
        (malloc=2034KB +1984KB #405 +398)
```

### 2.2. Profiling in Java 21

#### 2.2.1. With Max Direct Memory Size Limit

이번엔 Java 21 환경에서 실행한 애플리케이션의 동작을 확인해보자. 위 테스트와 동일하게 `-XX:MaxDirectMemorySize=20M` 옵션을 사용해 최대 다이렉트 메모리 사이즈를 20MB으로 제한한 상태에서 아파치 제이미터로 요청을 보낸다.

- 모든 요청 중 하나의 요청을 제외하고 모두 실패한다.
- 실패한 요청은 모두 OOM 에러가 발생했다.

<div align="center">
  <img src="/images/posts/2024/get-bytes-method-of-multipart-file-in-java21-cause-oome-02.gif" width="100%" class="image__border">
</div>

<br/>

마찬가지로 jcmd 도구로 네이티브 메모리 사용량을 추적해본다. 다이렉트 메모리가 약 18MB(18292KB) 증가했다. 최대 다이렉트 메모리 사용량을 20MB로 제한했기 때문에 그 이상은 할당 받지 못 했다.

```
$ jcmd 51766 VM.native_memory summary.diff

Native Memory Tracking:

...

- Other (reserved=18342KB +18292KB, committed=18342KB +18292KB)
        (malloc=18342KB +18292KB #408 +401)
```

#### 2.2.2. Without Max Direct Memory Size Limit

이번엔 최대 다이렉트 메모리 사이즈에 대한 제한을 없애 봤다. 최대 다이렉트 메모리 제한이 없는 경우 자바 버전이나 벤더(vendor)에 따라 다르겠지만, 최대 힙 메모리 사이즈까지 허용하는 한 사용할 수 있는 것으로 보인다. IBM, 이클립스(eclipse) 공식 문서를 보면 이를 확인할 수 있다. 

> Eclipse Open J9 - Start of content that applies to Java 11 plus.<br/>
> By default, the amount of native memory used for Direct Byte Buffers is limited to the maximum heap size.

최대 다이렉트 메모리 사이즈 제한이 없는 정확한 공식 문서를 찾진 못 했지만, 위 정보를 바탕으로 유추해보면 힙 메모리까지 다이렉트 메모리로 사용하는 것처럼 보여진다. 제이미터를 사용해 요청을 보내면 다음과 같은 결과를 얻는다.

- 요청의 일부는 성공하지만, 어느 수준에 도달하면 요청들이 실패한다.

<div align="center">
  <img src="/images/posts/2024/get-bytes-method-of-multipart-file-in-java21-cause-oome-03.gif" width="100%" class="image__border">
</div>

<br/>

jcmd 도구로 다이렉트 메모리 사용량을 확인해보자. 다이렉트 메모리가 약 2GB(2084419KB) 증가했다. 최대 다이렉트 메모리 제한이 없기 때문에 최대 힙 메모리 제한 영역까지 다이렉트 메모리를 늘려 사용한 것으로 보여진다.

```
$ jcmd 53249 VM.native_memory summary.diff

Native Memory Tracking:

...

- Other (reserved=2084469KB +2084419KB, committed=2084469KB +2084419KB)
        (malloc=2084469KB +2084419KB #406 +399)
```

## 3. What is the difference between 17 and 21?

이제 원인을 살펴보자. 어떤 변화가 이런 차이점을 만들었을까? 필자의 분석으론 몇 가지 조건들이 맞물리면서 이 문제가 발생했다.

### 3.1. Cooperation of Instances

MultipartFile 인스턴스의 getBytes 메소드를 호출했을 때 데이터를 읽는 과정에 참여하는 객체들의 협력 관계를 살펴보자. Java 17, 21 모두 데이터를 읽기 위해 협력하는 객체들은 동일하다. 클래스 이름 하단 괄호는 해당 클래스가 위치한 패키지를 의미한다.

- MultipartFile 인스턴스는 FileCopyUtils 클래스의 정적 메소드를 사용한다.
- FileCopyUtils 클래스의 정적 메소드는 ChannelInputStream 객체를 사용한다.
- ChannelInputStream 객체는 FileChannelImpl 객체를 사용한다.
- FileChannelImpl 객체는 IOUtil 클래스의 정적 메소드를 사용한다.
- IOUtil 클래스는 캐시(cache)를 사용한다.
  - 캐시 히트(cache hit)가 발생하면 캐시에 저장된 버퍼 객체를 재사용한다.
  - 캐시 히트가 실패하면 요청 받은 사이즈의 새로운 DirectByteBuffer 객체를 생성한다.

<div align="center">
  <img src="/images/posts/2024/get-bytes-method-of-multipart-file-in-java21-cause-oome-04.png" width="80%" class="image__border">
</div>

### 3.2. BufferCache Instance

필자는 아무래도 객체를 재사용하는 캐시 객체가 의심스러웠다. 캐시 관련된 로직을 살펴봤다. 

- 캐시의 키는 버퍼 사이즈, 값은 ByteBuffer 인스턴스이다. 
- 요청 받은 사이즈를 커버할 수 있는 용량을 갖는 ByteBuffer 인스턴스를 찾아서 반환한다. 
- 찾을 수 없는 경우 null 값을 반환한다.

```java
package sun.nio.ch;

public class Util {

    private static class BufferCache {

        ByteBuffer get(int size) {
            assert !isBufferTooLarge(size);

            if (count == 0)
                return null;  

            ByteBuffer[] buffers = this.buffers;
            ByteBuffer buf = buffers[start];
            if (buf.capacity() < size) {
                buf = null;
                int i = start;
                while ((i = next(i)) != start) {
                    ByteBuffer bb = buffers[i];
                    if (bb == null)
                        break;
                    if (bb.capacity() >= size) {
                        buf = bb;
                        break;
                    }
                }
                if (buf == null)
                    return null;
                buffers[i] = buffers[start];
            }

            buffers[start] = null;
            start = next(start);
            count--;

            buf.rewind();
            buf.limit(size);
            return buf;
        }
    }
}
```

BufferCache 객체의 캐시 히트 로직은 크게 문제 없어 보인다. 문제는 BufferCache 객체가 저장되는 장소이다. BufferCache 객체는 TerminatingThreadLocal 클래스를 통해 저장된다. TerminatingThreadLocal 클래스는 ThreadLocal 클래스의 한 종류로 스레드가 생성되거나 제거될 때 오버라이드 한 메소드가 호출되는 특징이 있다. 캐시에 저장된 버퍼 객체의 메모리를 해제하는 작업은 threadTerminated 메소드에서 수행된다.

```java
package sun.nio.ch;

public class Util {

    private static TerminatingThreadLocal<BufferCache> bufferCache = new TerminatingThreadLocal<>() {
        @Override
        protected BufferCache initialValue() {
            return new BufferCache();
        }
        @Override
        protected void threadTerminated(BufferCache cache) { 
            while (!cache.isEmpty()) {
                ByteBuffer bb = cache.removeFirst();
                free(bb);
            }
        }
    };
}
```

이 구조로 인해 문제를 일으킬 수 있는 조건들이 갖춰진다.

- 서블릿 컨테이너는 스레드 풀을 사용한다.
  - 스레드 풀에 담긴 애플리케이션 생명 주기 동안 종료되지 않는다.
- ThreadLocal 객체를 통해 저장된 객체들은 모두 스레드 객체 내부 테이블에 저장된다.
  - ThreadLocal 클래스에 대한 자세한 개념은 [링크 글][thread-local-class-in-java-link]을 참고하길 바란다.

요청을 처리하는 서블릿 컨테이너 스레드들이 캐싱을 위해 할당 받은 버퍼 객체들의 메모리는 애플리케이션이 종료되기 전까지 해제되지 않는다. 

### 3.3. Overrided readAllBytes method in ChannelInputStream class

그렇다면 왜 Java 21 버전부터 문제가 발생했을까? Java 17과 Java 21 환경에서 콜 스택을 비교해보면 다음과 같은 차이점을 찾을 수 있다. 

- Java 17
  - FileCopyUtils 클래스는 InputStream 인스턴스의 readAllBytes 메소드를 호출한다. 
- Java 21
  - FileCopyUtils 클래스는 ChannelInputStream 객체의 readAllBytes 메소드를 호출한다.

<div align="center">
  <img src="/images/posts/2024/get-bytes-method-of-multipart-file-in-java21-cause-oome-05.png" width="80%" class="image__border">
</div>

<br/>

[2021년 10월 2일 OpenJDK 커밋(commit)](https://github.com/openjdk/jdk/commit/0786d8b7b367e3aa3ffa54a3e339572938378dca)을 보면 ChannelInputStream 클래스에 readAllBytes 메소드가 새롭게 추가된다. 이 커밋은 `JDK 18+17`과 `JDK 18+18` 태그 사이에 위치하기 때문에 JDK 18에서부터 이 문제가 발생할 것으로 예상된다. 이 변경은 다음과 같은 구조를 만든다. 

- Java 17
  - ChannelInputStream 객체가 런타임에 데이터 읽기에 참여한다.
  - InputStream 인스턴스의 readAllBytes 메소드를 사용한다. 
- Java 21
  - ChannelInputStream 객체가 런타임에 데이터 읽기에 참여한다.
  - 자신의 readAllBytes 메소드를 사용한다. 

<div align="center">
  <img src="/images/posts/2024/get-bytes-method-of-multipart-file-in-java21-cause-oome-06.png" width="80%" class="image__border">
</div>

<br/>

이제 거의 다 왔다. 두 메소드엔 어떤 차이점이 있을까? InputStream 추상 클래스의 readAllBytes 메소드를 먼저 살펴보자. 

- 데이터를 읽을 때 요청 받은 사이즈와 기본 버퍼 사이즈 중 작은 값을 사용한다.

```java
package java.io;

public abstract class InputStream implements Closeable {

    private static final int DEFAULT_BUFFER_SIZE = 8192;

    public byte[] readNBytes(int len) throws IOException {
        if (len < 0) {
            throw new IllegalArgumentException("len < 0");
        }
        List<byte[]> bufs = null;
        byte[] result = null;
        int total = 0;
        int remaining = len;
        int n;
        do {
            byte[] buf = new byte[Math.min(remaining, DEFAULT_BUFFER_SIZE)]; // this line
            int nread = 0;
            while ((n = read(
                            buf, 
                            nread, 
                            Math.min(buf.length - nread, remaining) // this line
                        )) > 0) { 
                nread += n;
                remaining -= n;
            }
            // ...
        } while (n >= 0 && remaining > 0);
        // ...
        return result;
    }
}
```

다음 ChannelInputStream 추상 클래스의 readAllBytes 메소드를 살펴보자. 

- 데이터를 읽을 때 요청 받은 사이즈를 사용한다.

```java
package sun.nio.ch;

class ChannelInputStream extends InputStream {

    @Override
    public byte[] readAllBytes() throws IOException {
      
        if (!(ch instanceof SeekableByteChannel sbc))
            return super.readAllBytes();

        long length = sbc.size();
        long position = sbc.position();
        long size = length - position;

        if (length <= 0 || size <= 0)
            return super.readAllBytes();

        if (size > (long) Integer.MAX_VALUE) {
            String msg = String.format(
                "Required array size too large: %d = %d - %d", 
                size, length, position
            );
            throw new OutOfMemoryError(msg);
        }

        int capacity = (int)size; // this line
        byte[] buf = new byte[capacity];
        int nread = 0;
        int n;
        for (;;) {
            while ((n = read(buf, nread, capacity - nread)) > 0) // this line
                nread += n;

            if (n < 0 || (n = read()) < 0)
                break;

            capacity = Math.max(
                          ArraysSupport.newLength(capacity, 1, capacity), 
                          DEFAULT_BUFFER_SIZE
                      );
            buf = Arrays.copyOf(buf, capacity);
            buf[nread++] = (byte)n;
        }

        return (capacity == nread) ? buf : Arrays.copyOf(buf, nread);
    }
}
```

### 3.4. Conclusion

확인한 정보를 바탕으로 문제를 분석한 내용을 그림으로 표현하면 다음과 같은 모습이 된다. 이번 글 예제에서 사용한 17.6MB 사이즈 비디오를 기준으로 설명한다.

- 요청을 받으면 버퍼 객체가 BufferCache 객체에 담긴다. 
- BufferCache 객체는 ThreadLocal 객체에 의해 스레드 객체 내부에 저장된다.
- 요청을 처리하는 스레드는 서블릿 컨테이너 스레드 풀에 저장되므로 캐시에 담긴 버퍼 객체의 메모리는 해제되지 않는다.
- Java 17 버전일 때 캐시에 담긴 버퍼 사이즈가 8192Byte 이다.
- Java 21 버전일 때 캐시에 담긴 버퍼 사이즈가 17.6MB 이다.
- 스프링 프레임워크에서 사용하는 스레드 풀의 스레드 최대 개수는 디폴트 200개이다.
  - Java 17 버전일 때 필요한 다이렉트 메모리는 1.6MB(= 8192Byte X 200)이다.
  - Java 21 버전일 때 필요한 다이렉트 메모리는 3.5GB(= 17.6MB X 200)이다.

<div align="center">
  <img src="/images/posts/2024/get-bytes-method-of-multipart-file-in-java21-cause-oome-07.png" width="80%" class="image__border">
</div>

## 4. To avoid out of memory error in Java 21

결론을 바탕으로 JVM 애플리케이션 프로파일링 결과를 다시 살펴보자. 완전 정확하진 않지만, 필자의 계산과 얼추 맞아 떨어진다. 

- Java 17, 다이렉트 메모리 사이즈 20MB 제한
  - 모든 스레드가 8KB 정도 다이렉트 메모리를 할당 받으므로 1.6MB 정도를 사용한다.
  - jcmd 측정 시 증가한 다이렉트 메모리 사이즈는 약 2MB 정도이다.
- Java 21, 다이렉트 메모리 사이즈 20MB 제한
  - 17.6MB 비디오 사이즈만큼의 버퍼를 할당 받은 스레드 하나만 요청 처리에 성공한다.
  - 스레드 하나만 17.6MB 정도 다이렉트 메모리를 할당 받는다.
  - jcmd 측정 시 증가한 다이렉트 메모리 사이즈는 약 18MB 정도이다.
- Java 21, 최대 힙 메모리 사이즈 2GB 제한
  - 17.6MB 비디오 사이즈만큼의 버퍼를 할당 받은 스레드 하나만 요청 처리에 성공한다.
  - 약 113(= 2GB / 17.6MB) 개 스레드만 요청 처리에 성공할 수 있다.
  - jcmd 측정 시 증가한 다이렉트 메모리 사이즈는 약 2GB 정도이다.

정확한 원인을 분석하진 않았지만, Java 21 버전에서 최대 다이렉트 메모리 제한이 테스트했을 때 발생한 OOM 에러는 힙 메모리가 부족해서 발생한 것으로 보인다. 우리는 앞으로 Java 17 버전에 머무를 수 없다. 이 문제를 피할 수 있는 방법은 무엇이 있을까? 

- 바이트를 읽을 때 사이즈를 고정한다.
- 파일을 복사할 때 MultipartFile 인스턴스의 transferTo 메소드를 사용한다.

Java 21 환경에서 JVM 옵션을 다음과 같이 지정하여 동일한 테스트를 진행한다. 

- `-Xmx2G` 
  - 최대 힙 메모리 사이즈는 2GB로 제한한다
- `-XX:MaxDirectMemorySize=20M`
  - 최대 다이렉트 메모리 사이즈는 20MB로 제한한다.

아파치 제이미터 스레드 그룹 설정은 다음과 같다.

- 스레드 수는 `200`개로 지정한다.
- 램프-업(ramp-up) 시간은 3초로 지정한다.
- 5초 동안 지속한다.

### 4.1. Fixed buffer size for read

애플리케이션 코드는 다음과 같다.

- 10KB 고정된 사이즈로 데이터를 읽는다.
- 단순히 계산해보면 2MB(= 10KB X 200) 크기의 다이렉트 버퍼 사이즈가 필요하다.

```java
package action.in.blog.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.Objects;

@RestController
public class FileController {

    private File convertToFile(MultipartFile multipartFile) {
        File copiedFile = new File(Objects.requireNonNull(multipartFile.getOriginalFilename()));
        try (
                InputStream is = multipartFile.getInputStream();
                OutputStream os = new FileOutputStream(copiedFile)
        ) {
            byte[] buffer = new byte[10240];
            int read;
            while ((read = is.read(buffer)) > 0) {
                os.write(buffer, 0, read);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return copiedFile;
    }

    @PostMapping("/file")
    public String uploadFile(@RequestParam("file") MultipartFile file) {
        var result = convertToFile(file);
        System.out.printf("file size: %s bytes\n", result.length());
        return "ok";
    }
}
```

비주얼VM으로 메모리 사용량을 확인해봤다. 필자의 예상과는 다르게 힙 메모리도 잔잔했다. InputStream 인스턴스를 통해 고정된 사이즈의 버퍼를 사용하는 경우 내부에서 이전에 만든 버퍼를 재사용하기 때문에 힙 메모리 사용량도 크게 증가하지 않는 것으로 보여진다. 

<div align="center">
  <img src="/images/posts/2024/get-bytes-method-of-multipart-file-in-java21-cause-oome-08.gif" width="100%" class="image__border">
</div>

<br/>

jcmd 도구로 다이렉트 메모리 사용량을 측정해 보니 약 2.4MB(2400KB) 정도 다이렉트 메모리가 증가했다. 

```
$ jcmd 98667 VM.native_memory summary.diff

Native Memory Tracking:

... 

- Other (reserved=2434KB +2400KB, committed=2434KB +2400KB)
        (malloc=2434KB +2400KB #405 +400)
```

### 4.2.transferTo method in MultipartFile instance

애플리케이션 코드는 다음과 같다.

- MultipartFile 인스턴스가 제공하는 transferTo 메소드를 사용한다.

```java
package action.in.blog.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Objects;

@RestController
public class FileController {

    private File convertToFile(MultipartFile multipartFile) {
        File copiedFile = new File(Objects.requireNonNull(multipartFile.getOriginalFilename()));
        try {
            multipartFile.transferTo(copiedFile.toPath());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return copiedFile;
    }

    @PostMapping("/file")
    public String uploadFile(@RequestParam("file") MultipartFile file) {
        var result = convertToFile(file);
        System.out.printf("file size: %s bytes\n", result.length());
        return "ok";
    }
}
```

비주얼VM으로 메모리 사용량을 확인해봤다. 위 테스트와 마찬가지로 힙 메모리가 잔잔했다. 코드 내부를 살펴보진 않았지만, 또 다른 방식으로 데이터를 읽어 복사하는 것으로 보여진다. 

<div align="center">
  <img src="/images/posts/2024/get-bytes-method-of-multipart-file-in-java21-cause-oome-09.gif" width="100%" class="image__border">
</div>

<br/>

jcmd 도구로 다이렉트 메모리 사용량을 측정해 보니 약 2MB(1992KB) 정도 다이렉트 메모리가 증가했다. 메모리 효율이 가장 좋았다. 

```
$ jcmd 109 VM.native_memory summary.diff

Native Memory Tracking:

... 

- Other (reserved=2034KB +1992KB, committed=2034KB +1992KB)
        (malloc=2034KB +1992KB #405 +399)
```

## CLOSING

이 글의 결론은 Java 18 버전부터 MultipartFile 인스턴스의 getBytes 메소드를 호출하는 것은 다이렉트 메모리 영역에서 OOM 에러가 발생할 수 있으니 조심해야 한다는 것이다. Java 17 버전도 getBytes 메소드를 사용했을 때 에러는 발생하지 않지만, 힙 메모리가 요동치는 것을 보니 얼마나 비효율적인지 확인할 수 있었다. 힙 메모리 사용량이 증가할수록 GC(garbage collection)을 계속 유발하고 이는 애플리케이션 전체 성능의 악영향을 주게 되니 주의하자.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-05-04-get-bytes-method-of-multipart-file-in-java21-cause-oome>

#### REFERENCE

- <https://homoefficio.github.io/2020/08/10/Java-NIO-FileChannel-%EA%B3%BC-DirectByteBuffer/>
- <https://homoefficio.github.io/2020/04/09/Java-Native-Memory-Tracking/>
- <https://github.com/openjdk/jdk/commit/0786d8b7b367e3aa3ffa54a3e339572938378dca>

[thread-local-class-in-java-link]: https://junhyunny.github.io/java/thread-local-class-in-java/
[out-of-memory-error-case-study-in-jvm-link]: https://junhyunny.github.io/java/jvm/spring-boot/out-of-memory-error-case-study-in-jvm/