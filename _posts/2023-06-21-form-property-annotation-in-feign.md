---
title: "@FormProperty Annotation for FeignClient"
search: false
category:
  - spring-boot
  - spring-cloud
last_modified_at: 2023-06-21T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Spring Cloud Openfeign][spring-cloud-openfeign-link]
* [WireMock for FeignClient Test][wire-mock-for-feign-client-test-link]
* [Logging for FeignClient][logging-for-feign-client-link]
* [Content-Type and Spring Boot Annotation][content-type-and-spring-annotation-link]

## 1. Problem 

현재 개발 중인 서비스는 다른 시스템과 통신이 필요합니다. 
이를 위해 스프링 클라우드(spring cloud)의 페인 클라이언트(feign client)를 사용하고 있습니다. 
페인 클라이언트는 인터페이스와 POJO(Plain Old Java Object) 객체를 사용해 쉬운 API 통신이 가능하도록 돕는 라이브러리입니다. 

현재 문제를 일으키는 요인은 다음과 같습니다.

* 현재 개발 중인 시스템의 이름 규칙(naming convention)과 맞지 않는 필드명을 사용합니다.
* `Content-Type`이 `application/x-www-form-urlencoded`을 사용합니다.

저희 도메인 객체는 단어를 조합한 카멜 케이스(camelCase) 형식의 필드명을 사용합니다. 
반대로 상대 시스템은 약어를 조합한 스네이크 케이스(snake_case) 형식으로 요청 파라미터를 원했습니다. 
`application/x-www-form-urlencoded` 컨텐트 타입(content type)이 필요한 요청에서는 @JsonProperty 애너테이션을 사용할 수 없었습니다. 

<p align="center">
    <img src="/images/form-property-annotation-in-feign-1.JPG" width="80%" class="image__border">
</p>

## 2. Solve the problem

페인 클라이언트 측에서 폼 데이터(form data)를 보낼 때 프로퍼티 이름을 정해줄 수 있는 @FormProperty 애너테이션을 제공합니다. 
이를 통해 우리 서비스 도메인 객체의 프로퍼티 이름과 상대편 서비스가 원하는 데이터 양식 모두를 만족시킬 수 있었습니다. 
간단한 테스트 코드를 통해 사용 방법을 알아보겠습니다. 

### 2.1. PostClient Interface

다음과 같은 페인 클라이언트를 사용합니다.

* POST 요청을 수행합니다. 
* `application/x-www-form-urlencoded` 컨텐트 타입을 소비하는 엔드-포인트(end-point)로 요청을 보냅니다.
* Todo 객체를 요청 메세지로 사용합니다.

```java
package action.in.blog.client;

import action.in.blog.domain.Todo;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "todo-client", url = "${todo-service.url}")
public
interface TodoClient {

    @PostMapping(
            value = "/todo",
            consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE
    )
    long createTodo(@RequestBody Todo todo);
}
```

### 2.2. Todo Class

현재 도메인에서 사용하는 Todo 클래스입니다. 

* 비즈니스 로직에서 content라는 이름으로 사용합니다.
* 페인 클라이언트를 사용해 데이터를 전송할 때 `todo_ctnt`라는 이름으로 변경하여 전달합니다. 

```java
package action.in.blog.domain;

import feign.form.FormProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
public
class Todo {
    private String title;
    @FormProperty("todo_ctnt")
    private String content;
}
```

### 2.3. FormDataFeignTest Class

[WireMock][wire-mock-for-feign-client-test-link]의 도움을 받아 요청과 응답에 대한 테스트를 수행합니다. 
이번 테스트는 페인 클라이언트가 Todo 객체를 다른 서비스가 원하는 적절한 형식의 요청 메세지로 변환 후 전달하는지를 검증합니다. 

* 요청과 응답 과정에 전달되는 메세지를 확인하기 위해 페인 클라이언트의 로깅 레벨을 FULL 값으로 지정합니다.
* 사용하는 로거(logger)의 로그 레벨을 DEBUG 값으로 지정합니다.

```java
package action.in.blog;

import action.in.blog.client.TodoClient;
import action.in.blog.domain.Todo;
import com.github.tomakehurst.wiremock.matching.ContainsPattern;
import feign.Logger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import wiremock.org.eclipse.jetty.util.MultiMap;
import wiremock.org.eclipse.jetty.util.UrlEncoded;

import java.nio.charset.StandardCharsets;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@Configuration
class FeignLoggingConfig {

    @Bean
    public Logger.Level getLoggerLevel() {
        return Logger.Level.FULL;
    }
}


@AutoConfigureWireMock(port = 0)
@SpringBootTest(
        properties = {
                "todo-service.url=http://localhost:${wiremock.server.port}",
                "logging.level.action.in.blog=DEBUG"
        }
)
public class FormDataFeignTest {

    @Autowired
    TodoClient todoClient;

    @Test
    void createTodo() {

        var requestBody = new MultiMap<String>();
        requestBody.put("todo_ctnt", "This is a new todo");
        requestBody.put("title", "Hello World");
        stubFor(post("/todo")
                .withRequestBody(
                        new ContainsPattern(
                                UrlEncoded.encode(
                                        requestBody,
                                        StandardCharsets.UTF_8,
                                        true
                                )
                        )
                )
                .willReturn(
                        aResponse().withStatus(200)
                                .withHeader(
                                        "Content-Type", MediaType.APPLICATION_JSON_VALUE
                                )
                                .withBody("1000")
                )
        );


        var result = todoClient.createTodo(
                Todo.builder()
                        .title("Hello World")
                        .content("This is a new todo")
                        .build()
        );


        assertThat(result, equalTo(1000L));
    }
}
```

##### Result Log

```
2023-06-22T05:39:55.525+09:00 DEBUG 16970 --- [    Test worker] action.in.blog.TodoClient                : [TodoClient#createTodo] ---> POST http://localhost:10073/todo HTTP/1.1
2023-06-22T05:39:55.525+09:00 DEBUG 16970 --- [    Test worker] action.in.blog.TodoClient                : [TodoClient#createTodo] Content-Length: 46
2023-06-22T05:39:55.525+09:00 DEBUG 16970 --- [    Test worker] action.in.blog.TodoClient                : [TodoClient#createTodo] Content-Type: application/x-www-form-urlencoded; charset=UTF-8
2023-06-22T05:39:55.526+09:00 DEBUG 16970 --- [    Test worker] action.in.blog.TodoClient                : [TodoClient#createTodo] 
2023-06-22T05:39:55.526+09:00 DEBUG 16970 --- [    Test worker] action.in.blog.TodoClient                : [TodoClient#createTodo] todo_ctnt=This+is+a+new+todo&title=Hello+World
2023-06-22T05:39:55.526+09:00 DEBUG 16970 --- [    Test worker] action.in.blog.TodoClient                : [TodoClient#createTodo] ---> END HTTP (46-byte body)
2023-06-22T05:39:55.626+09:00 DEBUG 16970 --- [    Test worker] action.in.blog.TodoClient                : [TodoClient#createTodo] <--- HTTP/1.1 200 OK (100ms)
2023-06-22T05:39:55.626+09:00 DEBUG 16970 --- [    Test worker] action.in.blog.TodoClient                : [TodoClient#createTodo] content-type: application/json
2023-06-22T05:39:55.627+09:00 DEBUG 16970 --- [    Test worker] action.in.blog.TodoClient                : [TodoClient#createTodo] matched-stub-id: a44f5a64-05f2-41aa-8a46-e89316025f0e
2023-06-22T05:39:55.627+09:00 DEBUG 16970 --- [    Test worker] action.in.blog.TodoClient                : [TodoClient#createTodo] transfer-encoding: chunked
2023-06-22T05:39:55.627+09:00 DEBUG 16970 --- [    Test worker] action.in.blog.TodoClient                : [TodoClient#createTodo] vary: Accept-Encoding, User-Agent
2023-06-22T05:39:55.627+09:00 DEBUG 16970 --- [    Test worker] action.in.blog.TodoClient                : [TodoClient#createTodo] 
2023-06-22T05:39:55.628+09:00 DEBUG 16970 --- [    Test worker] action.in.blog.TodoClient                : [TodoClient#createTodo] 1000
2023-06-22T05:39:55.628+09:00 DEBUG 16970 --- [    Test worker] action.in.blog.TodoClient                : [TodoClient#createTodo] <--- END HTTP (4-byte body)
```

## CLOSING

타 시스템의 비즈니스를 위해 우리 도메인 객체들을 오염시키고 싶지 않아 @JsonProperty 애너테이션을 자주 사용했습니다. 
OpenFeign 측에서 `application/x-www-form-urlencoded` 컨텐트 타입을 지원하는 @FormProperty 애너테이션을 지원해서 다행입니다.

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-06-21-form-property-annotation-in-feign>

#### REFERENCE

* <https://www.baeldung.com/spring-cloud-post-form-url-encoded-data>

[spring-cloud-openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/
[wire-mock-for-feign-client-test-link]: https://junhyunny.github.io/spring-boot/spring-cloud/test-driven-development/wire-mock-for-feign-client-test/
[logging-for-feign-client-link]: https://junhyunny.github.io/spring-boot/spring-cloud/logging-for-feign-client/
[content-type-and-spring-annotation-link]: https://junhyunny.github.io/information/spring-boot/javascript/content-type-and-spring-annotation/