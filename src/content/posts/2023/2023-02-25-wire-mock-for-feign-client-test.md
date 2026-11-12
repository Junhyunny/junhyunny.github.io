---
title: "FeignClient 테스트를 위한 WireMock"
publishedAt: "2023-02-25"
updatedAt: "2026-11-12T16:17:28+09:00"
canonicalPath: "/spring-boot/spring-cloud/test-driven-development/wire-mock-for-feign-client-test/"
categories:
  - "spring-boot"
  - "spring-cloud"
  - "test-driven-development"
summary: "외부 API를 호출하는 FeignClient를 WireMock 서버로 스텁(stub)하고 @SpringBootTest 결합 테스트로 응답 디코딩까지 검증하는 방법을 정리했다."
recommendedPosts:
  - title: "스프링 클라우드(spring cloud) OpenFeign"
    href: "https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/"
---

## 0. 들어가면서

외부 API 호출에 사용하는 `FeignClient`를 테스트하는 방법을 정리했다.

## 1. Spring Cloud OpenFeign

Spring Cloud OpenFeign은 스프링 클라우드(spring cloud) 프로젝트 중 하나로, API 요청을 쉽게 수행할 수 있는 기능을 제공한다. 애너테이션(annotation)과 인터페이스를 사용해 쉽게 `FeignClient`를 구현할 수 있다.

> Feign is a declarative web service client.
> It makes writing web service clients easier.

## 2. WireMock

`FeignClient`가 클라이언트로서 정상적으로 동작하는지 테스트하려면 서버가 필요하다. 테스트마다 실제 서버를 준비할 수는 없으므로 `WireMock`이라는 가상의 웹 서버를 사용한다. `WireMock`을 사용하면 스텁(stub)과 목(mock)을 통해 클라이언트가 원하는 요청과 응답을 준비할 수 있다.

> WireMock is a library for stubbing and mocking web services.
> It constructs an HTTP server that we can connect to as we would to an actual web service.

`WireMock`을 사용한 테스트는 다음과 같은 장점이 있다.

- 서비스를 실행하지 않은 상태로 실제 API 요청을 수행할 수 있다.
  - API 요청 시 발생할 수 있는 포맷 변경을 테스트할 수 있다.
- JUnit 프레임워크와 함께 사용해 테스트를 자동화할 수 있다.
- 다양한 예외 케이스를 테스트할 수 있다.

### 2.1. Why do we need API test?

외부 API를 호출하는 코드를 단위 테스트할 때는 보통 테스트 더블(test double)을 사용한다. 스파이(spy) 객체를 사용해 외부 API 호출을 적절하게 수행했는지 확인한다. 이런 테스트 방법은 검증에 한계가 있다. 간단한 예를 들어 보자. 다음과 같이 JSON 응답의 날짜와 시간을 `yyyy-MM-dd HH:mm:ss` 포맷(format)으로 받는다.

```json
{
  "message" : "Hello World",
  "createdAt" : "2023-02-24 11:30:25"
}
```

응답을 받는 데이터 전송 객체(data transfer object)의 `createdAt` 필드 자료형은 `LocalDateTime` 클래스다.

```java
package action.in.blog;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class BlogResponse {

    private String message;
    private LocalDateTime createdAt;
}
```

스프링에서 JSON 요청과 응답에 사용하는 `Jackson` 라이브러리는 자료형이 `LocalDateTime` 클래스인 경우 기본적으로 `yyyy-MM-dd'T'HH:mm:ss` 포맷 데이터를 지원한다. 그래서 이 응답을 받으면 다음과 같은 에러가 발생한다.

```
Caused by: com.fasterxml.jackson.databind.exc.InvalidFormatException: Cannot deserialize value of type `java.time.LocalDateTime` from String "2023-02-24 11:30:25": Failed to deserialize java.time.LocalDateTime: (java.time.format.DateTimeParseException) Text '2023-02-24 11:30:25' could not be parsed at index 10
 at [Source: (org.springframework.util.StreamUtils$NonClosingInputStream); line: 1, column: 14] (through reference chain: action.in.blog.BlogResponse["createdAt"])
    at app//com.fasterxml.jackson.databind.exc.InvalidFormatException.from(InvalidFormatException.java:67)
  ...

Caused by: java.time.format.DateTimeParseException: Text '2023-02-24 11:30:25' could not be parsed at index 10
    at java.base/java.time.format.DateTimeFormatter.parseResolved0(DateTimeFormatter.java:2052)
    at java.base/java.time.format.DateTimeFormatter.parse(DateTimeFormatter.java:1954)
    at java.base/java.time.LocalDateTime.parse(LocalDateTime.java:494)
  ...
```

`yyyy-MM-dd HH:mm:ss` 형태의 데이터를 주고받을 때 발생하는 파싱(parsing) 에러는 런타임에 발견될 확률이 높다. 배포한 뒤 발생한 런타임 에러 때문에 정상적으로 응답하지 못하면 서비스의 신뢰도가 떨어진다.

## 3. Practice

간단한 테스트 코드로 사용 방법을 알아보자. 먼저 `build.gradle` 파일에 `FeignClient`를 위한 spring-cloud-starter-openfeign 의존성과 `WireMock`을 위한 spring-cloud-starter-contract-stub-runner 의존성을 추가한다.

```groovy
ext {
    set('springCloudVersion', "2022.0.1")
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.cloud:spring-cloud-starter-openfeign'
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'

    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.cloud:spring-cloud-starter-contract-stub-runner'
}

dependencyManagement {
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-dependencies:${springCloudVersion}"
    }
}
```

`BlogClient` 인터페이스는 `FeignClient`로 선언한다. 이름은 `blog-client`이고, URL은 설정을 통해 주입받는다. `/search` 경로로 GET 요청을 수행하며, 요청 파라미터의 키로 `key`를 사용한다.

```java
package action.in.blog.client;

import action.in.blog.domain.BlogResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "blog-client", url = "${blog-server.url}")
public interface BlogClient {

    @GetMapping("/search")
    BlogResponse getBlogResponse(@RequestParam("key") String key);
}
```

`FeignClient`를 사용하기 위해 `ActionInBlogApplication` 클래스에 `@EnableFeignClients` 애너테이션을 추가한다.

```java
package action.in.blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@EnableFeignClients
@SpringBootApplication
public class ActionInBlogApplication {

    public static void main(String[] args) {
        SpringApplication.run(ActionInBlogApplication.class, args);
    }

}
```

## 4. Test

`BlogClientIT` 클래스는 `@SpringBootTest` 애너테이션으로 결합 테스트(integration test)를 수행한다. 결합 테스트는 비용이 큰 만큼 적을수록 좋지만, 최대한 적은 컨텍스트를 로딩(loading)하는 방법은 찾지 못했다. 테스트 코드에 사용한 애너테이션과 검증 내용은 다음과 같다.

- `@SpringBootTest` 애너테이션
  - 결합 테스트를 수행한다.
  - 스프링 애플리케이션의 모든 의존성을 컨텍스트에 로딩한다.
- `@AutoConfigureWireMock` 애너테이션
  - `WireMock` 서버를 준비한다.
  - 포트 번호를 0으로 지정해 랜덤한 값을 사용한다.
- `@TestPropertySource` 애너테이션
  - `FeignClient`에서 필요한 URL 정보를 지정한다.
  - `wiremock.server.port` 설정 값으로 `WireMock` 서버의 포트 번호를 추가한다.
- `/search?key=hello` 경로로 요청했을 때 원하는 포맷으로 응답을 받는지 테스트 코드로 확인한다.

```java
package action.in.blog;

import action.in.blog.client.BlogClient;
import action.in.blog.domain.BlogResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.client.WireMock;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;
import org.springframework.test.context.TestPropertySource;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.springframework.cloud.contract.spec.internal.MediaTypes.APPLICATION_JSON;

@SpringBootTest
@AutoConfigureWireMock(port = 0)
@TestPropertySource(
        properties = {
                "blog-server.url=http://localhost:${wiremock.server.port}"
        }
)
public class BlogClientIT {

    @Autowired
    BlogClient sut;

    @Test
    void get_blog_response_from_wiremock_server_using_feign() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        String dateTime = "2023-02-24 11:30:25";
        LocalDateTime now = LocalDateTime.parse(dateTime, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String expectedResponse = objectMapper.writeValueAsString(
                Map.of(
                        "message", "Hello World",
                        "createdAt", dateTime
                )
        );
        stubFor(get(urlPathEqualTo("/search"))
                .withQueryParam("key", WireMock.equalTo("hello"))
                .willReturn(
                        aResponse().withStatus(200)
                                .withHeader("Content-Type", APPLICATION_JSON)
                                .withBody(expectedResponse)
                ));


        BlogResponse result = sut.getBlogResponse("hello");


        assertThat(result.getMessage(), equalTo("Hello World"));
        assertThat(result.getCreatedAt(), equalTo(now));
    }
}
```

테스트를 실행하면 실패한다. JSON 응답을 디코딩(decoding)할 때, 즉 `2023-02-24 11:30:25` 값을 `yyyy-MM-dd HH:mm:ss` 포맷으로 변환할 때 에러가 발생한다.

```
Error while extracting response for type [class action.in.blog.domain.BlogResponse] and content type [application/json]
feign.codec.DecodeException: Error while extracting response for type [class action.in.blog.domain.BlogResponse] and content type [application/json]
    at app//feign.InvocationContext.proceed(InvocationContext.java:40)
    at app//feign.ResponseHandler.decode(ResponseHandler.java:122)
    at app//feign.ResponseHandler.handleResponse(ResponseHandler.java:73)
...
Caused by: org.springframework.web.client.RestClientException: Error while extracting response for type [class action.in.blog.domain.BlogResponse] and content type [application/json]
    at app//org.springframework.web.client.HttpMessageConverterExtractor.extractData(HttpMessageConverterExtractor.java:118)
    at app//org.springframework.cloud.openfeign.support.SpringDecoder.decode(SpringDecoder.java:75)
...
Caused by: org.springframework.http.converter.HttpMessageNotReadableException: JSON parse error: Cannot deserialize value of type `java.time.LocalDateTime` from String "2023-02-24 11:30:25": Failed to deserialize java.time.LocalDateTime: (java.time.format.DateTimeParseException) Text '2023-02-24 11:30:25' could not be parsed at index 10
    at app//org.springframework.http.converter.json.AbstractJackson2HttpMessageConverter.readJavaType(AbstractJackson2HttpMessageConverter.java:406)
    at app//org.springframework.http.converter.json.AbstractJackson2HttpMessageConverter.read(AbstractJackson2HttpMessageConverter.java:354)
...
Caused by: java.time.format.DateTimeParseException: Text '2023-02-24 11:30:25' could not be parsed at index 10
    at java.base/java.time.format.DateTimeFormatter.parseResolved0(DateTimeFormatter.java:2052)
    at java.base/java.time.format.DateTimeFormatter.parse(DateTimeFormatter.java:1954)
...
Disconnected from the target VM, address: 'localhost:57046', transport: 'socket'
BlogClientIT > get_blog_response_from_wiremock_server_using_feign() FAILED
    feign.codec.DecodeException at BlogClientIT.java:55
        Caused by: org.springframework.web.client.RestClientException at BlogClientIT.java:55
            Caused by: org.springframework.http.converter.HttpMessageNotReadableException at BlogClientIT.java:55
                Caused by: com.fasterxml.jackson.databind.exc.InvalidFormatException at BlogClientIT.java:55
                    Caused by: java.time.format.DateTimeParseException at BlogClientIT.java:55

```

테스트를 통과하도록 `BlogResponse` 클래스에 `@JsonFormat` 애너테이션을 추가해 `LocalDateTime` 필드의 포맷을 지정한다.

```java
package action.in.blog.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class BlogResponse {

    private String message;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
```

다시 테스트를 수행하면 정상적으로 통과한다.

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.0.3)

2023-02-26T02:24:38.463+09:00  INFO 53948 --- [    Test worker] action.in.blog.BlogClientIT              : Starting BlogClientIT using Java 17.0.6 with PID 53948 (started by junhyunk in /Users/junhyunk/Desktop/action-in-blog)
2023-02-26T02:24:38.464+09:00  INFO 53948 --- [    Test worker] action.in.blog.BlogClientIT              : No active profile set, falling back to 1 default profile: "default"
2023-02-26T02:24:39.133+09:00  INFO 53948 --- [    Test worker] o.s.cloud.context.scope.GenericScope     : BeanFactory id=b7ac1ebd-d14b-3aa3-9269-4d8b6ada9d50
2023-02-26T02:24:40.135+09:00  INFO 53948 --- [    Test worker] action.in.blog.BlogClientIT              : Started BlogClientIT in 1.885 seconds (process running for 2.769)
BUILD SUCCESSFUL in 4s
4 actionable tasks: 2 executed, 2 up-to-date
2:24:40 AM: Execution finished ':test --tests "action.in.blog.BlogClientIT.get_blog_response_from_wiremock_server_using_feign"'.
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-02-25-wire-mock-for-feign-client-test>

#### REFERENCE

- <https://www.baeldung.com/introduction-to-wiremock>
- <https://www.baeldung.com/spring-cloud-feign-integration-tests>
- <https://docs.spring.io/spring-cloud-contract/docs/current/reference/html/project-features.html#features-wiremock>
- <https://cloud.spring.io/spring-cloud-contract/1.1.x/multi/multi__spring_cloud_contract_wiremock.html>
- <https://ktko.tistory.com/entry/Spring-Boot-Test-%EB%B0%A9%EB%B2%95>
- <https://syaku.tistory.com/387>
