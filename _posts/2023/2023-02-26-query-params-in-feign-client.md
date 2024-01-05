---
title: "Query Params in FeignClient"
search: false
category:
  - spring-boot
  - spring-cloud
last_modified_at: 2023-02-26T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Spring Cloud Openfeign][spring-cloud-openfeign-link]
* [WireMock for FeignClient Test][wire-mock-for-feign-client-test-link]

## 0. 들어가면서

`FeignClient`를 사용하면서 느낀 장점들은 다음과 같습니다.

* 애너테이션과 인터페이스 선언만으로 API 요청을 수행할 수 있는 객체를 만들 수 있습니다.
* `@GetMapping`, `@PostMapping` 같은 애너테이션으로 요청 메소드를 지정할 수 있습니다.
* `@RequestHeader`, `@RequestBody`, `@RequestParam` 같은 애너테이션으로 요청 시 필요한 데이터를 지정할 수 있습니다.

컨트롤러(controller)를 만드는 규칙과 동일하기 때문에 더 쉽게 사용할 수 있습니다. 
클라이언트로써 필요한 요청 정보들을 선언만 하면 됩니다. 
요청 URL에 포함되는 쿼리(query) 파라미터는 `@RequestParam` 애너테이션을 통해 지정할 수 있습니다. 
다만, 항목이 많아질수록 코드의 가독성은 떨어지고, 개발자가 파라미터의 순서를 맞추는 과정에서 실수가 일어날 확률이 높아집니다.

이번 포스트에선 쿼리 파라미터 수가 많은 경우 DTO(data transfer object) 객체로 대체하는 방법을 정리하였습니다. 
`FeignClient`의 사용법이나 테스트 방법은 이번 포스트에서 자세히 다루지 않았습니다. 
이전 포스트를 참고하시길 바랍니다. 

## 1. @RequestParam Annotation

일반적으로 URL 쿼리를 만들 때 사용하는 애너테이션입니다. 
`FeignClient`를 적용한 인터페이스와 테스트 코드를 살펴보겠습니다. 

### 1.1. Implementation

* 클라이언트가 요청할 URL은 설정 파일에 `blog-server.url` 키의 값으로 지정합니다.
* getBlogResponsesWithParams 메소드
    * `@GetMapping` 애너테이션으로 `/search` 경로에 GET 요청을 수행할 것을 명시합니다.
    * `name`, `age`, `address` 파라미터를 사용해 URL 쿼리를 만듭니다.
    * `?name=jun&age=20&address=Seoul` 쿼리 요청이 생성될 것을 예상합니다.

```java
package action.in.blog.client;

import action.in.blog.domain.BlogQuery;
import action.in.blog.domain.BlogResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.cloud.openfeign.SpringQueryMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "blog-client", url = "${blog-server.url}")
public interface BlogClient {

    @GetMapping("/search")
    List<BlogResponse> getBlogResponsesWithParams(
            @RequestParam String name,
            @RequestParam int age,
            @RequestParam String address
    );

}
```

### 1.2. Test

* `action.in.blog.client` 패키지에서 발생하는 디버그(debug) 로깅(logging) 레벨을 활성화합니다.
* `FeignClient` 요청 시 발생하는 로그를 모두 보기 위해 로거 레벨을 `FULL` 레벨로 지정합니다.
* `WireMock` 객체를 사용해 가상 서버를 구축하여 테스트를 수행합니다.
    * 스터빙(stubbing)한 값에 맞는 요청이 들어왔는지 확인합니다.
    * 적절한 요청을 받은 경우 미리 지정한 응답을 반환합니다.
* `FeignClient` 응답 데이터를 검증합니다.

```java
package action.in.blog;

import action.in.blog.client.BlogClient;
import action.in.blog.domain.BlogResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.client.WireMock;
import feign.Logger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.springframework.cloud.contract.spec.internal.MediaTypes.APPLICATION_JSON;

@TestConfiguration
class FeignLoggingConfig {
    @Bean
    Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }
}

@Import({FeignLoggingConfig.class})
@SpringBootTest
@AutoConfigureWireMock(port = 0)
@TestPropertySource(
        properties = {
                "blog-server.url=http://localhost:${wiremock.server.port}",
                "logging.level.action.in.blog.client=DEBUG"
        })
public class ActionInBlogApplicationTests {

    @Autowired
    BlogClient sut;

    @Test
    void query_params_with_params() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        List<BlogResponse> blogResponses = Arrays.asList(
                BlogResponse.builder()
                        .name("junny")
                        .age(21)
                        .address("Seoul")
                        .build(),
                BlogResponse.builder()
                        .name("junhyunny")
                        .age(22)
                        .address("Seoul")
                        .build()
        );
        String expectedResult = objectMapper.writeValueAsString(blogResponses);
        stubFor(get(urlPathEqualTo("/search"))
                .withQueryParams(
                        Map.of(
                                "name", WireMock.equalTo("jun"),
                                "age", WireMock.equalTo("20"),
                                "address", WireMock.equalTo("Seoul")
                        )
                ).willReturn(
                        aResponse().withStatus(200)
                                .withHeader("Content-Type", APPLICATION_JSON)
                                .withBody(expectedResult)
                )
        );


        List<BlogResponse> result = sut.getBlogResponsesWithParams("jun", 20, "Seoul");


        assertThat(result.size(), equalTo(2));
        BlogResponse firstItem = result.get(0);
        assertThat(firstItem.getName(), equalTo("junny"));
        assertThat(firstItem.getAge(), equalTo(21));
        assertThat(firstItem.getAddress(), equalTo("Seoul"));
        BlogResponse secondItem = result.get(1);
        assertThat(secondItem.getName(), equalTo("junhyunny"));
        assertThat(secondItem.getAge(), equalTo(22));
        assertThat(secondItem.getAddress(), equalTo("Seoul"));
    }

}
```

##### Test Result

* GET 메소드 요청이 수행됩니다.
* 요청 URL이 `http://localhost:11962/search?name=jun&age=20&address=Seoul` 입니다.

```
2023-02-26T23:54:06.134+09:00 DEBUG 704 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithParams] ---> GET http://localhost:11962/search?name=jun&age=20&address=Seoul HTTP/1.1
2023-02-26T23:54:06.134+09:00 DEBUG 704 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithParams] ---> END HTTP (0-byte body)
2023-02-26T23:54:06.258+09:00 DEBUG 704 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithParams] <--- HTTP/1.1 200 OK (124ms)
2023-02-26T23:54:06.258+09:00 DEBUG 704 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithParams] content-type: application/json
2023-02-26T23:54:06.259+09:00 DEBUG 704 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithParams] matched-stub-id: 5ca86bde-dbd3-4cf3-a8fd-27c55e48b10c
2023-02-26T23:54:06.259+09:00 DEBUG 704 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithParams] transfer-encoding: chunked
2023-02-26T23:54:06.259+09:00 DEBUG 704 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithParams] vary: Accept-Encoding, User-Agent
2023-02-26T23:54:06.259+09:00 DEBUG 704 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithParams] 
2023-02-26T23:54:06.260+09:00 DEBUG 704 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithParams] [{"name":"junny","age":21,"address":"Seoul"},{"name":"junhyunny","age":22,"address":"Seoul"}]
2023-02-26T23:54:06.260+09:00 DEBUG 704 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithParams] <--- END HTTP (93-byte body)
BUILD SUCCESSFUL in 4s
```

### 1.3. Pain Point 

쿼리 파라미터가 많지 않다면 문제가 없습니다. 
다만, 파라미터 수가 많아지면 가독성을 떨어뜨리고, 실수를 유발합니다. 
예를 들어 다음과 같이 요청 파라미터가 5개라고 가정해보겠습니다. 

```java
package action.in.blog.client;

import action.in.blog.domain.BlogQuery;
import action.in.blog.domain.BlogResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.cloud.openfeign.SpringQueryMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "blog-client", url = "${blog-server.url}")
public interface BlogClient {

    @GetMapping("/search")
    List<BlogResponse> getBlogResponsesWithParams(
            @RequestParam int age,
            @RequestParam String name,
            @RequestParam String bestFriendName,
            @RequestParam String parentName,
            @RequestParam String address
    );

}
```

클라이언트 코드를 작성할 때 위치가 헷갈려 파라미터 값을 정확하게 넣지 못할 수 있습니다. 

* 예시 코드는 사람 이름이 3개 들어갑니다.
* 어떤 순서로 파라미터에 자기 이름, 친한 친구 이름, 부모님 이름이 들어가야 하는지 선언된 인터페이스를 비교해봐야 합니다. 

```java
    List<BlogResponse> result = sut.getBlogResponsesWithParams(
            20,
            "jua",
            "minsu",
            "jun",
            "Seoul"
    );
```

## 2. @SpringQueryMap Annotation

이런 불편한 점을 개선하기 위해 `@SpringQueryMap` 애너테이션을 사용할 수 있습니다. 
해당 애너테이션을 통해 DTO 객체를 사용해 URL 요청을 만들 수 있습니다.

### 2.1. Implementation

* 쿼리 파라미터를 담은 DTO 객체를 메소드 파라미터로 받습니다.
* `@SpringQueryMap` 애너테이션을 메소드 파리미터 앞에 추가합니다.

```java
package action.in.blog.client;

import action.in.blog.domain.BlogQuery;
import action.in.blog.domain.BlogResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.cloud.openfeign.SpringQueryMap;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@FeignClient(name = "blog-client", url = "${blog-server.url}")
public interface BlogClient {

    @GetMapping("/search")
    List<BlogResponse> getBlogResponsesWithDto(@SpringQueryMap BlogQuery query);

}
```

### 2.2. Test

요청 시 `BlogQuery` 객체를 사용하는 것을 제외하곤 이전에 수행한 테스트와 동일합니다. 

* `action.in.blog.client` 패키지에서 발생하는 디버그(debug) 로깅(logging) 레벨을 활성화합니다.
* `FeignClient` 요청 시 발생하는 로그를 모두 보기 위해 로거 레벨을 `FULL` 레벨로 지정합니다.
* `FeignClient` 요청 시 빌더 패턴(builder pattern)으로 `BlogQuery` 객체를 만들어 파라미터로 전달합니다.
    * `FeignClient` 메소드의 파라미터가 1개 이상 늘어날 필요가 없습니다.
    * URL 요청을 만들 때 어떤 키에 어떤 값이 매칭되는지 확인하기 좋습니다.
* `WireMock` 객체를 사용해 가상 서버를 구축하여 테스트를 수행합니다.
* `FeignClient` 응답을 통해 받은 데이터를 검증합니다.

```java
package action.in.blog;

import action.in.blog.client.BlogClient;
import action.in.blog.domain.BlogQuery;
import action.in.blog.domain.BlogResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.client.WireMock;
import feign.Logger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.springframework.cloud.contract.spec.internal.MediaTypes.APPLICATION_JSON;

@TestConfiguration
class FeignLoggingConfig {
    @Bean
    Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }
}

@Import({FeignLoggingConfig.class})
@SpringBootTest
@AutoConfigureWireMock(port = 0)
@TestPropertySource(
        properties = {
                "blog-server.url=http://localhost:${wiremock.server.port}",
                "logging.level.action.in.blog.client=DEBUG"
        })
public class ActionInBlogApplicationTests {

    @Autowired
    BlogClient sut;

    @Test
    void query_params_with_dto() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        List<BlogResponse> blogResponses = Arrays.asList(
                BlogResponse.builder()
                        .name("junny")
                        .age(21)
                        .address("Seoul")
                        .build(),
                BlogResponse.builder()
                        .name("junhyunny")
                        .age(22)
                        .address("Seoul")
                        .build()
        );
        String expectedResult = objectMapper.writeValueAsString(blogResponses);
        stubFor(get(urlPathEqualTo("/search"))
                .withQueryParams(
                        Map.of(
                                "name", WireMock.equalTo("jun"),
                                "age", WireMock.equalTo("20"),
                                "address", WireMock.equalTo("Seoul")
                        )
                ).willReturn(
                        aResponse().withStatus(200)
                                .withHeader("Content-Type", APPLICATION_JSON)
                                .withBody(expectedResult)
                )
        );


        List<BlogResponse> result = sut.getBlogResponsesWithDto(
                BlogQuery.builder()
                        .name("jun")
                        .age(20)
                        .address("Seoul")
                        .build()
        );


        assertThat(result.size(), equalTo(2));
        BlogResponse firstItem = result.get(0);
        assertThat(firstItem.getName(), equalTo("junny"));
        assertThat(firstItem.getAge(), equalTo(21));
        assertThat(firstItem.getAddress(), equalTo("Seoul"));
        BlogResponse secondItem = result.get(1);
        assertThat(secondItem.getName(), equalTo("junhyunny"));
        assertThat(secondItem.getAge(), equalTo(22));
        assertThat(secondItem.getAddress(), equalTo("Seoul"));
    }
}
```

##### Test Result

* GET 메소드 요청이 수행됩니다.
* 요청 URL이 `http://localhost:11962/search?name=jun&age=20&address=Seoul` 입니다.

```
2023-02-27T00:26:08.592+09:00 DEBUG 9644 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithDto] ---> GET http://localhost:11820/search?address=Seoul&name=jun&age=20 HTTP/1.1
2023-02-27T00:26:08.592+09:00 DEBUG 9644 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithDto] ---> END HTTP (0-byte body)
2023-02-27T00:26:08.708+09:00 DEBUG 9644 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithDto] <--- HTTP/1.1 200 OK (115ms)
2023-02-27T00:26:08.708+09:00 DEBUG 9644 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithDto] content-type: application/json
2023-02-27T00:26:08.708+09:00 DEBUG 9644 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithDto] matched-stub-id: e94ccfe2-c981-4703-840f-c3874dcbfb28
2023-02-27T00:26:08.708+09:00 DEBUG 9644 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithDto] transfer-encoding: chunked
2023-02-27T00:26:08.708+09:00 DEBUG 9644 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithDto] vary: Accept-Encoding, User-Agent
2023-02-27T00:26:08.708+09:00 DEBUG 9644 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithDto] 
2023-02-27T00:26:08.710+09:00 DEBUG 9644 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithDto] [{"name":"junny","age":21,"address":"Seoul"},{"name":"junhyunny","age":22,"address":"Seoul"}]
2023-02-27T00:26:08.710+09:00 DEBUG 9644 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#getBlogResponsesWithDto] <--- END HTTP (93-byte body)
BUILD SUCCESSFUL in 4s
```

## CLOSING

`OpenFeign`은 객체를 사용해 쿼리를 만드는 방식을 `@QueryMap` 애너테이션으로 제공하고 있었습니다. 
하지만 `@QueryMap` 애너테이션은 스프링(spring) 프레임워크에선 사용하지 못 하기 때문에 `@SpringQueryMap`으로 이 기능을 대체하고 있습니다. 

> The OpenFeign @QueryMap annotation provides support for POJOs to be used as GET parameter maps. Unfortunately, the default OpenFeign QueryMap annotation is incompatible with Spring because it lacks a value property. <br/>
> Spring Cloud OpenFeign provides an equivalent @SpringQueryMap annotation, which is used to annotate a POJO or Map parameter as a query parameter map.

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-02-26-query-params-in-feign-client>

#### REFERENCE

* <https://honeyinfo7.tistory.com/324>
* <https://cloud.spring.io/spring-cloud-static/spring-cloud-openfeign/2.1.0.RELEASE/multi/multi_spring-cloud-feign.html#_feign_querymap_support>
* <https://www.baeldung.com/java-feign-logging>

[spring-cloud-openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/
[wire-mock-for-feign-client-test-link]: https://junhyunny.github.io/spring-boot/spring-cloud/test-driven-development/wire-mock-for-feign-client-test/