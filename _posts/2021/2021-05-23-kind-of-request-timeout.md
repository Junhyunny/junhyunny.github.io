---
title: "클라이언트 요청 타임아웃(request timeout)"
search: false
category:
  - information
last_modified_at: 2025-10-03T00:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [HTTP(HyperText Transfer Protocol)][http-blog-link]

## 1. Request Timeout Types

개발하면서 자주 만나는 타임아웃(timeout)에 대해 알아보자. 타임아웃은 클라이언트 요청이 특정 시간 내에 성공적으로 수행되지 않아서 진행을 중단하는 것을 의미한다. 클라이언트가 서버의 응답을 무한정 기다릴 수 없기 때문에 시간을 정하고 이를 초과하면 적절한 예외 처리를 수행한다. 

연결 타임아웃(connection timeout)은 클라이언트가 서버와 연결을 맺지 못하는 경우 발생한다. 클라이언트가 서버와 연결하는데 소요되는 시간의 임계치다. TCP 소켓 통신에서 클라이언트와 서버가 연결되는 과정을 3-Way 핸드쉐이크(handshake)라고 한다. 핸드세이크가 정상적으로 완료되어야 연결이 되었다고 말할 수 있다. 연결 타임아웃은 3-Way 핸드세이크가 정상적으로 수행되기까지 소요되는 시간이다.

<div align="center">
  <img src="/images/posts/2021/kind-of-request-timeout-01.png" width="80%" class="image__border">
</div>

<br/>

클라이언트와 서버가 정상적으로 연결된 이후에 발생한다. 서버는 클라이언트에게 응답 메시지를 전달할 때 하나의 메시지를 여러 개의 패킷(packet)으로 나누어 전달한다. 각 패킷 사이의 시간 차이가 있다. 이 패킷 사이의 시간 차이를 소켓 타임아웃(socket timeout)이라고 한다.

<div align="center">
  <img src="/images/posts/2021/kind-of-request-timeout-02.png" width="80%" class="image__border">
</div>

<br/>

읽기 타임아웃(read timeout)도 소켓 타임아웃과 마찬가지로 서버와 정상적인 연결 이후에 발생한다. 서버에서 I/O 작업이 길어지거나 락이 걸리는 등의 요청 처리 시간이 길어지면 클라이언트 측에서 발생한다. 클라이언트가 특정 시간 동안 서버로부터 요청에 대한 응답을 받지 못하는 경우이다. `java.net` 패키지의 모듈들은 소켓 타임아웃과 읽기 타임아웃을 혼용하여 사용한다.

<div align="center">
  <img src="/images/posts/2021/kind-of-request-timeout-03.png" width="80%" class="image__border">
</div>

## 2. Practice

간단한 실습을 통해 클라이언트에서 발생하는 타임아웃을 살펴보자. 우선 서버의 처리 능력을 제한하기 위해 application YAML 파일를 아래와 같이 설정한다.

- 스프링(spring) 프레임워크에서 사용하는 내장 톰캣(embedded tomcat)의 자원을 극소로 한정한다.
- `server.tomcat.connection-timeout`
  - 최초 연결이 허용되고 요청 URI를 제출할 때까지 커넥터(connector)가 기다리는 시간
- `server.tomcat.accept-count`
  - 모든 스레드가 사용 중일 때 들어온 요청에 대기하는 최대 큐의 길이
  - 일반적인 상황에서 이미 모든 스레드가 사용 중이라면 장애일 가능성이 높다.
  - 큐의 길이가 너무 길다면 응답 시간만 늦어지며 장애 상황을 인지하는게 늦어질 수 있다.
- `server.tomcat.max-connections`
  - 서버가 유지할 수 있는 최대 연결 수
- `server.tomcat.threads.max`
  - 최대 실행 가능한 스레드 수
- `server.tomcat.threads.min-spare`
  - 항상 대기 중인 최소 스레드 수

```yml
server:
  tomcat:
    connection-timeout: 1
    accept-count: 1
    max-connections: 1
    threads:
      max: 1
      min-spare: 1
```

테스트를 위한 /foo 엔드포인트를 만든다. /foo 요청 시 5초 대기 후 응답한다.

```java
package action.in.blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    private void sleep() {
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    @GetMapping("/foo")
    public String foo() {
        sleep();
        return "foo";
    }
}
```

간단한 테스트 코드를 통해 발생하는 타임아웃을 살펴보자. 테스트를 실행하기 전 애플리케이션은 미리 실행시켜둔다. throw_connection_timeout 테스트는 연결 타임아웃을 확인한다. 하나의 요청이 먼저 서버의 모든 스레드를 점유하므로 다른 요청은 연결을 맺을 수 없다.

```java
package action.in.blog;

import org.apache.http.client.HttpClient;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.impl.client.HttpClientBuilder;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.core.IsEqual.equalTo;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TimeoutTests {

    void sleep(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void throw_connection_timeout() {

        RestTemplate restTemplate = new RestTemplateBuilder()
                .setConnectTimeout(Duration.ofSeconds(1))
                .build();
        CompletableFuture.runAsync(() -> {
            restTemplate.getForObject("http://localhost:8080/foo", String.class);
        });


        RuntimeException throwable = assertThrows(RuntimeException.class, () -> {
            sleep(1000);
            restTemplate.getForObject("http://localhost:8080/foo", String.class);
        });


        assertThat(throwable instanceof ResourceAccessException, equalTo(true));
        assertThat(throwable.getCause() instanceof SocketTimeoutException, equalTo(true));
        assertThat(throwable.getMessage(), equalTo("I/O error on GET request for \"http://localhost:8080/foo\": Connect timed out"));
    }
    
    ...
}
```

throw_socket_timeout 테스트에선 소켓 타임아웃 시간을 지정한다. 위 테스트와 마찬가지로 하나의 요청이 먼저 서버의 모든 스레드를 점유하므로 클라이언트는 응답을 받을 수 없다. 커넥션 타임아웃을 설정하지 않았으므로 소켓 타임아웃 에러가 발생한다. 하지만, 실제 원인은 위와 동일하게 연결 타임아웃으로 보여진다. 예외 원인은 "Read timed out"으로 표시된다.

```java
class TimeoutTests {

    void sleep(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    ...

    @Test
    void throw_socket_timeout() {

        RequestConfig requestConfig = RequestConfig.custom()
                .setSocketTimeout(1000)
                .build();
        HttpClient httpClient = HttpClientBuilder.create()
                .setDefaultRequestConfig(requestConfig)
                .build();
        HttpUriRequest httpUriRequest = new HttpGet(URI.create("http://localhost:8080/foo"));


        CompletableFuture.runAsync(() -> {
            try {
                httpClient.execute(httpUriRequest);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });


        SocketTimeoutException throwable = assertThrows(SocketTimeoutException.class, () -> {
            sleep(1000);
            httpClient.execute(httpUriRequest);
        });


        assertThat(throwable.getMessage(), equalTo("Read timed out"));
    }
    
    ...
}
```

throw_read_timeout 테스트에선 읽기 타임아웃을 설정한다. 1초 이내로 서버로부터 응답을 받지 못 했기 때문에 읽기 타임아웃이 발생한다.

```java
class TimeoutTests {

    void sleep(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    ...
    
    @Test
    void throw_read_timeout() {

        RestTemplate restTemplate = new RestTemplateBuilder()
                .setReadTimeout(Duration.ofSeconds(1))
                .build();
        RuntimeException throwable = assertThrows(RuntimeException.class, () -> {
            restTemplate.getForObject("http://localhost:8080/foo", String.class);
        });


        assertThat(throwable instanceof ResourceAccessException, equalTo(true));
        assertThat(throwable.getCause() instanceof SocketTimeoutException, equalTo(true));
        assertThat(throwable.getMessage(), equalTo("I/O error on GET request for \"http://localhost:8080/foo\": Read timed out"));
    }
}
```

## CLOSING

타임아웃은 서버가 정상적이지 않은 경우 클라이언트 측에서 이를 기다리지 못하고 발생시키는 예외 상황이다. 클라이언트는 발생할 수 있는 타임아웃에 다음과 같은 것들을 고려해야한다.

- 타임아웃 시간
- 적절한 예외 처리

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-05-23-kind-of-request-timeout>

#### REFERENCE

* <https://cornswrold.tistory.com/401>
* <https://tomining.tistory.com/164>
* <https://tyrionlife.tistory.com/790>
* <https://kim-oriental.tistory.com/47>

[http-blog-link]: https://junhyunny.github.io/information/http/
