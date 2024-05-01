---
title: "Out of memory error when Direct Buffer Memory allocation"
search: false
category:
  - java
  - jvm
  - spring-boot
last_modified_at: 2024-04-30T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Direct Memory in Java][direct-memory-in-java-link]

## 0. 들어가면서

[Direct Memory in Java][direct-memory-in-java-link] 글 도입부에 언급했듯이 최근 OOME(Out of Memory Error)를 만났다. 해당 에러가 발생한 원인과 해결 방법을 정리해본다. 

## 1. Problem Context

사용자가 촬영한 비디오를 업로드하는 과정에서 에러가 발생했다. AWS 클라우드 와치(CloudWatch)에서 다음과 같은 에러 로그를 확인했다. 

- 약 5MB 정도의 메모리를 다이렉트 버퍼 메모리에서 할당 받을 수 없다.
- 최대 10MB 메모리 중 8.8MB 정도가 할당되어 있는 상태이다.

<p align="center">
  <img src="/images/posts/2024/out-of-memory-error-case-study-in-jvm-01.png" width="100%" class="image__border">
</p>

<br/><br/>

스택 트레이스(stack trace)를 거슬러 올라가면 업로드 데이터가 담긴 MultipartFile 인스턴스의 `getBytes` 메소드로 바이트 배열을 꺼낼 때 에러가 발생한 것을 볼 수 있다.

- StandardMultipartFile 객체의 getBytes 메소드가 스택 트레이스에 포함되어 있다.
- FileChannelImpl 객체를 통해 파일이나 소켓과 통신할 채널을 만든다.
- DirectByteBuffer 객체에 메모리를 할당할 때 에러가 발상한다. 

```
java.lang.OutOfMemoryError: Cannot reserve 10498677 bytes of direct buffer memory (allocated: 40960, limit: 10485760)
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
...
```

문제를 정확하게 진단하려면 JVM [다이렉트 메모리(direct memory)][direct-memory-in-java-link]에 대한 개념을 알아야 한다. 다이렉트 메모리에 대한 개념이 없다면 이전 글을 참고하길 바란다. 간략하게 설명하자면 Java I/O 속도를 개선하기 위해 NIO(new I/O)가 도입될 때 네이티브 메모리(native memory)에 데이터를 읽고 쓸 수 있는 DirectByteBuffer 클래스가 추가됐다. 그리고 DirectByteBuffer 객체가 사용하는 메모리 영역이 다이렉트 메모리다. 

## 2. Cause of the problem

JDK 제공사에서 설명할 때 다이렉트 메모리에 제한이 없는데 어디서 문제가 발생한 것일까? 애플리케이션 시작 로그에서 힌트를 찾을 수 있었다. 

- `-XX:MaxDirectMemorySize=N` 옵션을 통해 다이렉트 메모리 사이즈가 10MB로 제한되어 있었다.

<p align="center">
  <img src="/images/posts/2024/out-of-memory-error-case-study-in-jvm-02.png" width="100%" class="image__border">
</p>

<br/><br/>

IBM, 이클립스(eclipse) 문서를 살펴보면 다이렉트 메모리에 대한 사이즈 제한은 별도로 없다. 자바 버전이나 벤더(vendor)에 따라 다르겠지만, 최대 힙 메모리 사이즈까지 허용하는 한 사용할 수 있는 것으로 보인다.

> Eclipse Open J9 - Start of content that applies to Java 11 plus.<br/> 
> By default, the amount of native memory used for Direct Byte Buffers is limited to the maximum heap size.

그렇다면 어디서 다이렉트 메모리 사이즈를 제한하는 것일까? 지금 프로젝트는 필자의 회사에서 메인테이닝(maintaining)하는 파케토 빌드팩(paketo buildpack)을 사용하고 있다. 위 로그를 보면 빌드팩에서 어떤 공식으로 메모리를 할당하는지 확인할 수 있는 [링크]((https://paketo.io/docs/reference/java-reference/#memory-calculator))를 제공하고 있다. 해당 링크를 들어가보면 파케토 빌드팩은 컨테이너 환경에서 실행되는 자바 애플리케이션의 최적화를 위해 메모리 제한하는 메모리 계산기(Java Memory Calculator)를 사용한다는 설명을 볼 수 있다.

> The Java Memory Calculator is a tool used by the Paketo Java Buildpack to provide an optimized memory configuration for Java applications running in containers with enforced memory limits.

계산식을 하나씩 짚고 넘어가보자. 힙 메모리는 다음과 같이 계사한다.

```
Heap = (Total Container Memory) - (Non-Heap) - (Headroom)
```

논-힙 메모리는 다음과 같이 계산한다.

```
Non-Heap = (Direct Memory) + (Metaspace) + (Reserved Code Cache) + (Thread Stack * Thread Count)
```

헤드룸(Headroom) 메모리는 JVM이 아닌 작업을 위해 남겨두는 메모리로 백분율 단위를 사용하며 기본적으로 0 값을 사용하므로 자세한 내용은 살펴보지 않는다. 공식 문서를 보면 논-힙 메모리에 포함된 다이렉트 메모리의 기본 값은 10MB이다. 발생한 문제의 로그와 동일한 값인 것으로 미뤄볼 때 기본 값이 너무 작아 OOM 에러가 발생한 것으로 보인다.

<p align="center">
  <img src="/images/posts/2024/out-of-memory-error-case-study-in-jvm-03.png" width="60%" class="image__border">
</p>

## 3. Solve the problem

표면적으론 다이렉트 메모리가 충분하지 않아서 에러가 발생한 것처럼 보이지만, 실상은 그렇지 않다. 몇 가지 조건들이 맞물리면서 문제가 발생했다. 일단 문제가 발생한 [다이렉트 메모리][direct-memory-in-java-link]에 관련된 공부를 위해 딥-다이브(deep dive) 해보길 잘했다. 관련된 내용을 파고들지 않았다면 해결 방법을 찾는데 많은 시간을 허비했을 것 같다. 

이 글에선 문제를 해결하기 위해 접근한 두 가지 접근 방법에 대해 모두 정리했다. 실제 프로덕트 코드가 아닌 간단한 예제로 다시 OOM 에러를 재현했다. 파일 업로드를 위해 사용할 샘플 비디오는 이 [링크](https://archive.org/details/big-bunny-sample-video) 다운로드 받을 수 있다. 

### 3.1. First Approach

첫 번째 시도한 해결 방법은 `-XX:MaxDirectMemorySize=N` 옵션으로 다이렉트 메모리 사이즈를 늘렸다. 빌드팩을 사용하기 때문에 컨테이너 이미지를 실행할 때 아래와 같은 방법으로 JVM 옵션을 주입할 수 있다. 먼저 빌드팩을 사용해 이미지를 빌드한다.

```
$ pack build application/spring-boot --env BP_JVM_VERSION=21
```

JAVA_TOOL_OPTIONS 컨테이너 환경 변수를 통해 JVM 옵션을 주입한다.

```
$ docker run\
  -d\
  -p 8080:8080\
  --env JAVA_TOOL_OPTIONS='-XX:MaxDirectMemorySize=100M'\
  --name demo\
  application/spring-boot
```

`-XX:MaxDirectMemorySize=100M` 설정이 잘 주입됬는지 로그로 확인한다.

```
$ docker logs demo

Setting Active Processor Count to 16
Calculating JVM memory based on 19692352K available memory
For more information on this calculation, see https://paketo.io/docs/reference/java-reference/#memory-calculator
Calculated JVM Memory Configuration: -Xmx19007621K -XX:MaxMetaspaceSize=80570K -XX:ReservedCodeCacheSize=240M -Xss1M (Total Memory: 19692352K, Thread Count: 250, Loaded Class Count: 11811, Headroom: 0%)
Enabling Java Native Memory Tracking
Adding 137 container CA certificates to JVM truststore
Picked up JAVA_TOOL_OPTIONS: -XX:MaxDirectMemorySize=100M -Djava.security.properties=/layers/paketo-buildpacks_bellsoft-liberica/java-security-properties/java-security.properties -XX:+ExitOnOutOfMemoryError -XX:ActiveProcessorCount=16 -Xmx19007621K -XX:MaxMetaspaceSize=80570K -XX:ReservedCodeCacheSize=240M -Xss1M -XX:+UnlockDiagnosticVMOptions -XX:NativeMemoryTracking=summary -XX:+PrintNMTStatistics

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.2.5)

2024-04-30T06:12:14.776Z  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : Starting ActionInBlogApplication v0.0.1-SNAPSHOT using Java 21.0.2 with PID 1 (/workspace/action-in-blog-0.0.1-SNAPSHOT.jar started by cnb in /workspace)
2024-04-30T06:12:14.781Z  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : No active profile set, falling back to 1 default profile: "default"
2024-04-30T06:12:16.097Z  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port 8080 (http)
2024-04-30T06:12:16.112Z  INFO 1 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2024-04-30T06:12:16.112Z  INFO 1 --- [           main] o.apache.catalina.core.StandardEngine    : Starting Servlet engine: [Apache Tomcat/10.1.20]
2024-04-30T06:12:16.148Z  INFO 1 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
2024-04-30T06:12:16.149Z  INFO 1 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 1248 ms
2024-04-30T06:12:16.285Z  INFO 1 --- [           main] o.s.b.a.w.s.WelcomePageHandlerMapping    : Adding welcome page template: index
2024-04-30T06:12:16.533Z  WARN 1 --- [           main] o.thymeleaf.templatemode.TemplateMode    : [THYMELEAF][main] Unknown Template Mode 'HTML5'. Must be one of: 'HTML', 'XML', 'TEXT', 'JAVASCRIPT', 'CSS', 'RAW'. Using default Template Mode 'HTML'.
2024-04-30T06:12:16.618Z  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port 8080 (http) with context path ''
2024-04-30T06:12:16.643Z  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : Started ActionInBlogApplication in 2.419 seconds (process running for 3.008)
```

### 3.2. Second Approach

실제 프로젝트에선 100MB보다 더 큰 값을 설정했다. 일시적으로 문제가 해결된 듯 보였으나 시간이 지나면서 다시 OOM 문제를 만났다. 이 문제는 Java 17 버전에선 발생하지 않고 Java 21 버전 이상부터 발생한다. Java 21 버전 이상부터 발생하는 이 문제를 분석한 내용은 글의 주제를 벗어나기 때문에 다른 글에서 다룰 예정이다. 

문제가 발생한 예제 코드를 살펴보자 파일 업로드를 위해 MultipartFile 인스턴스를 File 객체로 변환하는 작업을 수행한다. MultipartFile 인스턴스의 getBytes 메소드로 파일 데이터를 모두 읽으면 시간이 지나 다이렉트 메모리가 다시 고갈된다. 

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

아파치 제이미터(apache jmeter)를 사용해 톰캣 서블릿 컨테이너의 기본 최대 스레드 수인 200개 정도의 요청을 5초 동안 빠르게 보내면 OOM 에러가 발생한다. 

- 최대 다이렉트 메모리 사이즈가 100MB이다.
- 아파치 제이미터를 사용해 사용자 스레드 200개로 5초동안 파일 업로드 요청을 보낸다.

<p align="center">
  <img src="/images/posts/2024/out-of-memory-error-case-study-in-jvm-04.gif" width="100%" class="image__border">
</p>

<br/><br/>

다시 자세한 글로 정리할 예정이지만, 원인을 몇 줄로 요약하면 다음과 같다. 

- NIO 패키지 내부에서 스레드 별로 다이렉트 메모리를 사용하는 DirectByteBuffer 객체를 캐시하여 사용한다.
  - 캐시의 키(key)는 필요한 바이트 버퍼 사이즈를 사용한다.
  - 캐시의 값(value)는 DirectByteBuffer 객체가 담겨 있다.
- 스레드가 종료될 때 DirectByteBuffer 객체를 해제하지만, 서블릿 컨테이너인 톰캣은 스레드 풀을 사용하기 때문에 DirectByteBuffer 객체의 메모리 자원이 해제되지 않는다. 
- 서블릿 컨테이너 스레드 풀에 담긴 일정 수의 스레드들이 다이렉트 메모리를 모두 차지하면 OOM 에러가 발생한다.

Java 21에선 캐시 키로 사용되는 바이트 버퍼 사이즈가 다른 방식으로 결정되면서 문제가 발생한다. 이 문제를 해결하려면 캐시 키를 고정할 수 있도록 데이터를 읽을 때 일정 사이즈의 버퍼를 사용하면 된다. 버퍼 사이즈를 얼마나 사용하면 좋을까? 다이렉트 메모리 사이즈를 100MB 정도로 제한했기 때문에 상당히 여유가 있지만, 해제되지 않는 메모리를 너무 과다하게 사용하지 않도록 다음과 같이 변경했다. 

> 10,240 Byte(read buffer size) X 200(tomcat thread count) = 2,048,000 Byte = 2MB

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

일정 사이즈의 버퍼로 데이터를 읽으면 OOM 에러가 발생하지 않는다. 스레드 풀의 모든 스레드가 버퍼를 사용하더라도 2MB 정도 밖에 하지 않으므로 다시 최대 다이렉트 메모리 사이즈를 10MB로 줄이더라도 문제가 발생하지 않는다. 

- 최대 다이렉트 메모리 사이즈가 10MB이다.
- 아파치 제이미터를 사용해 사용자 스레드 200개로 5초동안 파일 업로드 요청을 보낸다.

<p align="center">
  <img src="/images/posts/2024/out-of-memory-error-case-study-in-jvm-05.gif" width="100%" class="image__border">
</p>

## CLOSING

Java 21 부터 발생하는 OOME 문제는 새로운 글로 정리할 예정이다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-05-01-out-of-memory-error-case-study-in-jvm>

#### REFERENCE

- <https://paketo.io/docs/reference/java-reference/#memory-calculator>
- <https://eclipse.dev/openj9/docs/xxmaxdirectmemorysize/>
- <https://www.ibm.com/docs/en/sdk-java-technology/8?topic=options-xxmaxdirectmemorysize>

[direct-memory-in-java-link]: https://junhyunny.github.io/java/jvm/direct-memory-in-java/