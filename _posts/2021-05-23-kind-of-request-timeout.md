---
title: "Request Timeout Types"
search: false
category:
  - information
last_modified_at: 2021-09-02T03:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [HTTP(HyperText Transfer Protocol)][http-blog-link]

## 1. Request Timeout Types

개발하면서 자주 만나는 타임아웃(timeout)에 대해 알아보겠습니다. 
타임아웃은 클라이언트에서 특정 시간 내에 성공적으로 수행되지 않아서 진행이 자동적으로 중단되는 것을 의미합니다. 
클라이언트가 서버의 응답을 무한정 기다릴 수 없기 때문에 시간을 정하고 이를 초과하면 적절한 예외 처리를 수행합니다. 

### 1.1. Connection Timeout

연결 타임아웃(connection timeout)은 클라이언트가 서버와 연결을 맺지 못하는 경우 발생합니다. 
클라이언트가 서버와 연결하는데 소요되는 시간의 임계치입니다. 

TCP 소켓 통신에서 클라이언트와 서버가 연결되는 과정을 3-Way 핸드쉐이크(handshake)라고 합니다. 
핸드세이크가 정상적으로 완료되어야 연결이 되었다고 말할 수 있습니다. 
연결 타임아웃은 3-Way 핸드세이크가 정상적으로 수행되기까지 소요되는 시간입니다. 

<p align="center">
    <img src="/images/kind-of-request-timeout-1.jpg" width="80%" class="image__border">
</p>

### 1.2. Socket Timeout

클라이언트와 서버가 정상적으로 연결된 이후에 발생합니다. 
서버는 클라이언트에게 응답 메세지를 전달할 때 하나의 메세지를 여러 개의 패킷(packet)으로 나누어 전달합니다. 
각 패킷 사이의 시간 차이가 있습니다. 
이 패킷 사이의 시간 차이를 소켓 타임아웃(socket timeout)이라고 합니다. 

<p align="center">
    <img src="/images/kind-of-request-timeout-2.jpg" width="80%" class="image__border">
</p>

### 1.3. Read Timeout

읽기 타임아웃(read timeout)도 소켓 타임아웃과 마찬가지로 서버와 정상적인 연결 이후에 발생합니다. 
서버에서 I/O 작업이 길어지거나 락이 걸리는 등의 요청 처리 시간이 길어지면 클라이언트 측에서 발생합니다. 
클라이언트가 특정 시간 동안 서버로부터 요청에 대한 응답을 받지 못하는 경우입니다. 
`java.net` 패키지의 모듈들은 소켓 타임아웃과 읽기 타임아웃을 혼용하여 사용합니다. 

<p align="center">
    <img src="/images/kind-of-request-timeout-3.jpg" width="80%" class="image__border">
</p>

## 4. Practice

간단한 실습을 통해 클라이언트에서 발생하는 타임아웃을 살펴보겠습니다. 

### 4.1. application.yml

* 스프링(spring) 프레임워크에서 사용하는 내장 톰캣(embedded tomcat)의 자원을 극소로 한정합니다.
* `server.tomcat.connection-timeout`
    * 최초 연결이 허용되고 요청 URI를 제출할 때까지 커넥터(connector)가 기다리는 시간
* `server.tomcat.accept-count`
    * 모든 스레드가 사용 중일 때 들어온 요청에 대기하는 최대 큐의 길이
    * 일반적인 상황에서 이미 모든 스레드가 사용 중이라면 장애일 가능성이 높다.
    * 큐의 길이가 너무 길다면 응답 시간만 늦어지며 장애 상황을 인지하는게 늦어질 수 있다.
* `server.tomcat.max-connections`
    * 서버가 유지할 수 있는 최대 연결 수
* `server.tomcat.threads.max`
    * 최대 실행 가능한 스레드 수
* `server.tomcat.threads.min-spare`
    * 항상 대기 중인 최소 스레드 수

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

### 4.2. Application Class

* 쉬운 테스트를 위해 어플리케이션 실행 코드에 컨트롤러 기능을 추가합니다.
* /foo 요청 시 5초 대기 후 응답합니다.

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

### 4.3. TimeoutTests Class

간단한 테스트 코드를 통해 발생하는 타임아웃을 살펴보겠습니다.

* 테스트를 위해 어플리케이션을 미리 실행시켜둡니다. 
* throw_connection_timeout 테스트
    * 연결 타임아웃이 발생합니다.
* throw_socket_timeout 테스트
    * 소켓 타임아웃 시간을 지정했지만, 읽기 타임아웃이 발생합니다.
* throw_read_timeout 테스트
    * 읽기 타임아웃이 발생합니다.

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

타임아웃은 서버가 정상적이지 않은 경우 클라이언트 측에서 이를 기다리지 못하고 발생시키는 예외 상황입니다. 
클라이언트는 발생할 수 있는 타임아웃에 다음과 같은 것들을 고려해야합니다.

* 타임아웃 시간
* 적절한 폴백(fallback) 응답

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-05-23-kind-of-request-timeout>

#### REFERENCE

* <https://cornswrold.tistory.com/401>
* <https://tomining.tistory.com/164>
* <https://tyrionlife.tistory.com/790>
* <https://kim-oriental.tistory.com/47>

[http-blog-link]: https://junhyunny.github.io/information/http/