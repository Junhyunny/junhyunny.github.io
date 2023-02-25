---
title: "@RestClientTest Annotation"
search: false
category:
  - spring-boot
  - test-driven-development
last_modified_at: 2023-02-25T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Spring Request Date Format][spring-request-date-format-link]

## 0. 들어가면서

스프링 부트(spring boot) 프레임워크를 사용하면 `RestTemplate` 클래스를 통해 별도의 의존성 없이도 쉽게 API 요청을 수행할 수 있습니다. 
이번 포스트는 `RestTemplate`을 테스트하는 방법에 대해서 정리하였습니다.

## 1. @RestClientTest Annotation

`@DataJpaTest` 애너테이션이 쉬운 `JPA` 테스트를 돕듯이 `@RestClientTest` 애너테이션은 `RestTemplate` 테스트를 돕습니다. 
`@RestClientTest` 애너테이션을 사용한 테스트를 잘 활용하려면 다음 사항들을 알아야 합니다. 

* 테스트 대상 객체를 지정할 수 있습니다.
    * 테스트를 위한 최소한의 컨텍스트가 준비됩니다. 
* `MockRestServiceServer` 객체를 주입 받아 사용할 수 있습니다.
    * 해당 객체를 통해 `RestTemplate` 객체가 외부 서버로부터 받을 응답 값을 스텁(stub)할 수 있습니다.
* JSON 형식을 지원하므로 `Jackson` 라이브러리의 `ObjectMapper` 객체를 `MockRestServiceServer`의 응답 값을 반환할 때 사용합니다.

## 1.1. Why do we need API test?

외부 API 호출을 수행하는 코드를 단위 테스트하는 방법은 보통 테스트 더블(test double)을 사용합니다. 
스파이(spy) 객체를 사용해 외부 API 호출을 적절하게 수행하였는지 확인합니다. 
이런 테스트 방법은 검증의 한계가 있습니다. 

`LocalDateTime` 클래스를 간단한 예시로 들 수 있습니다. 
JSON 응답의 날짜, 시간을 `yyyy-MM-dd HH:mm:ss` 포맷 데이터로 받을 때 자료형이 `LocalDateTime` 클래스인 경우 다음과 같은 에러를 만나게 됩니다. 

##### Response JSON

```json
{
  "message" : "Hello World",
  "createdAt" : "2023-02-24 11:30:25"
}
```

##### Response Data Transfer Object

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

##### Error Logs and Pain Point

* 스프링에서 JSON 요청, 응답을 위해 사용하는 `Jackson` 라이브러리는 자료형이 `LocalDateTime` 클래스인 경우 기본적으로 `yyyy-MM-dd'T'HH:mm:ss` 포맷 데이터를 지원합니다. 
* `yyyy-MM-dd HH:mm:ss` 형태의 데이터를 요청, 응답을 하는 경우 발생하는 파싱(parsing) 에러는 런타임에서 발견될 확률이 높습니다.

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

## 2. Practice

`@RestClientTest` 애너테이션을 사용해 요청과 응답이 정상적인지 확인하는 간단한 테스트 코드를 살펴보겠습니다. 
다음과 같은 빈(bean)들을 기본적으로 주입 받을 수 있습니다. 

* RestTemplateBuilder
* MockRestServiceServer
* ObjectMapper

### 2.1. Autowired RestTemplateBuilder Class

`RestTemplateBuilder`를 주입 받아 테스트하는 경우입니다. 
이 경우 `MockRestServiceServer` 객체를 만들면서 테스트 할 `RestTemplate` 객체를 직접 바인딩시켜야 정상적으로 테스트가 동작합니다. 
해당 테스트를 통해 다음과 같은 것들을 확인할 수 있습니다.

* 요청 `URL`이 정상적으로 매칭되었는지 확인합니다.
* 요청 쿼리가 정상적으로 만들어졌는지 확인합니다.
* `2023-02-24 11:30:25` 값으로 응답 받을 때 정상적으로 파싱되었는지 확인합니다.

```java
package action.in.blog;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.client.RestClientTest;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestToUriTemplate;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@RestClientTest
class RestTemplateBuilderTest {

    @Autowired
    RestTemplateBuilder restTemplateBuilder;
    @Autowired
    ObjectMapper objectMapper;

    @Test
    void get_something_from_server_using_rest_template() throws JsonProcessingException {
        String uri = "http://blog-in-action.com/search?key={key}";
        String dateTime = "2023-02-24 11:30:25";
        LocalDateTime now = LocalDateTime.parse(dateTime, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String expectedResponse = objectMapper.writeValueAsString(
                Map.of(
                        "message", "Hello World",
                        "createdAt", dateTime
                )
        );
        RestTemplate sut = restTemplateBuilder.build();
        MockRestServiceServer server = MockRestServiceServer.bindTo(sut).build();
        server.expect(requestToUriTemplate(uri, "hello"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(expectedResponse, MediaType.APPLICATION_JSON));


        BlogResponse result = sut.getForObject(uri, BlogResponse.class, "hello");


        assertThat(result.getMessage(), equalTo("Hello World"));
        assertThat(result.getCreatedAt(), equalTo(now));
    }
}
```

### 2.2. Autowired Custom Bean

직접 만든 빈 객체에서 `RestTemplate`을 사용하는 경우 테스트를 위한 `MockRestServiceServer` 객체를 주입 받을 수 있습니다. 
`@RestClientTest` 애너테이션에 어떤 빈을 테스트할 것인지 명시해줍니다. 
해당 테스트를 통해 다음과 같은 것들을 확인할 수 있습니다.

* 요청 `URL`이 정상적으로 매칭되었는지 확인합니다.
* 요청 쿼리가 정상적으로 만들어졌는지 확인합니다.
* `2023-02-24 11:30:25` 값으로 응답 받을 때 정상적으로 파싱되었는지 확인합니다.

```java
package action.in.blog;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.client.RestClientTest;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestToUriTemplate;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;


@Service
class BlogProxy {

    private final String baseURI = "http://blog-in-action.com";

    private final RestTemplate restTemplate;

    BlogProxy(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    public BlogResponse getBlogResponse(String key) {
        return restTemplate.getForObject(baseURI.concat("/search?key={key}"), BlogResponse.class, key);
    }
}

@RestClientTest(BlogProxy.class)
public class BlogProxyTest {

    @Autowired
    BlogProxy sut;
    @Autowired
    MockRestServiceServer server;
    @Autowired
    ObjectMapper objectMapper;

    @Test
    void get_something_from_server_using_rest_template() throws JsonProcessingException {
        String dateTime = "2023-02-24 11:30:25";
        LocalDateTime now = LocalDateTime.parse(dateTime, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String expectedResponse = objectMapper.writeValueAsString(
                Map.of(
                        "message", "Hello World",
                        "createdAt", dateTime
                )
        );
        server.expect(requestToUriTemplate("http://blog-in-action.com/search?key={key}", "hello"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(expectedResponse, MediaType.APPLICATION_JSON));


        BlogResponse result = sut.getBlogResponse("hello");


        assertThat(result.getMessage(), equalTo("Hello World"));
        assertThat(result.getCreatedAt(), equalTo(now));
    }
}
```

### 2.3. BlogResponse Class

테스트가 실패하는 것을 확인하면 `@JsonFormat` 애너테이션으로 `LocalDateTime`에 대한 포맷을 지정합니다. 
이후 테스트를 재실행하여 통과하는 것을 확인합니다.

```java
package action.in.blog;

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

## CLOSING

`FeignClient`의 단위 테스트 방법을 찾다가 `@RestClientTest` 애너테이션을 발견했습니다. 
`@RestClientTest` 애너테이션은 아쉽게도 `RestTemplate`만 지원하는 것으로 보입니다. 
공식 문서를 살펴보면 다음과 같은 내용이 있습니다.

> Annotation for a Spring rest client test that focuses `only` on beans that use RestTemplateBuilder. 
> ...
> If you are testing a bean that doesn't use RestTemplateBuilder but instead injects a RestTemplate directly, you can add @AutoConfigureWebClient(registerRestTemplate=true). 

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-02-25-rest-client-test-annotation>

#### REFERENCE

* <https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/autoconfigure/web/client/RestClientTest.html>
* <https://www.baeldung.com/restclienttest-in-spring-boot>
* <https://www.jvt.me/posts/2022/02/01/resttemplate-integration-test/>
* <https://jojoldu.tistory.com/341>
* <https://sup2is.tistory.com/105>

[spring-request-date-format-link]: https://junhyunny.github.io/spring-boot/spring-request-date-format/