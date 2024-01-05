---
title: "Logging for FeignClient"
search: false
category:
  - spring-boot
  - spring-cloud
last_modified_at: 2023-03-02T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Spring Cloud Openfeign][spring-cloud-openfeign-link]
* [WireMock for FeignClient Test][wire-mock-for-feign-client-test-link]

## 1. Logging Level

로그 레벨은 다음과 같이 정의할 수 있습니다. 

> TRACE < DEBUG < INFO < WARN < ERROR < FATAL

오른쪽으로 갈수록 로그 레벨이 높습니다. 
어플리케이션은 로그 레벨이 지정되면 그보다 높은 레벨을 가진 로그들만 출력합니다. 
예를 들어 어플리케이션 로그 레벨이 `INFO`인 경우 `WARN`, `ERROR`, `FATAL` 로그를만 볼 수 있습니다. 

스프링(spring) 어플리케이션의 기본적인 로그 레벨은 `INFO`이기 때문에 `TRACE`, `DEBUG` 레벨은 보이지 않습니다. 
`FeignClient`의 `DEBUG` 로그들을 살펴보기 위해선 로깅 관련 설정이 필요합니다. 
몇 가지 설정을 적용하면 `FeignClient` API 통신 과정에서 발생하는 정보들을 로그로 확인할 수 있습니다.

### 1.1. application.yml 

`FeignClient` 기능을 사용하는 패키지의 로그 레벨을 지정합니다. 
`application.yml` 파일에서 특정 패키지의 로깅 레벨을 변경할 수 있습니다.

* 특정 클래스 이름, 패키지 이름을 사용해 로그 레벨을 지정할 수 있습니다.
* 패키지 이름을 지정한 경우 하위 패키지 객체들의 로그 레벨에 모두 적용됩니다.
    * 프로젝트 최상위 패키지인 `action.in.blog`를 `DEBUG`로 지정합니다.

```yml
logging:
  level:
    action.in.blog: DEBUG
```

## 2. Spring Bean Configuration

설정 빈(bean)을 통해 `FeignClient`의 로거 레벨을 지정할 수 있습니다. 

* NONE
    * 기본(default) 설정이며 로깅을 보여주지 않습니다.
* BASIC
    * 요청 메소드, URL, 응답 코드, 실행 시간 등을 볼 수 있습니다.
* HEADERS
    * `BASIC` 설정에 추가적으로 요청, 응답에 대한 헤더(header) 정보를 볼 수 있습니다.
* FULL
    * `HEADERS` 설정에 추가적으로 요청, 응답에 대한 바디(body), 메타데이터(metadata) 정보를 볼 수 있습니다.

```java
package action.in.blog.config;

import feign.Logger;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignLoggerConfig {

    @Bean
    Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }
}
```

## 3. Test

간단한 테스트 코드를 통해 출력되는 로그를 살펴보겠습니다.

### 3.1. BlogClient Interface

* 다음과 같은 메소드들을 수행할 때 출력되는 로그를 살펴보겠습니다.
    * `GET` 요청
    * `GET` 요청 - 파라미터 추가
    * `POST` 요청 - 바디 추가

```java
package action.in.blog.client;

import action.in.blog.domain.Post;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "blog-client", url = "${server-url}")
public interface BlogClient {

    @GetMapping("/health")
    String health();

    @GetMapping("/search")
    String search(@RequestParam String keyword);

    @PostMapping("/post")
    Post createPost(@RequestBody Post post);
}
```

### 3.2. Run Test Code

각 메소드 별로 호출 시 출력되는 로그를 살펴보겠습니다.

#### 3.2.1. health method

```java
package action.in.blog;

import action.in.blog.client.BlogClient;
import action.in.blog.domain.Post;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.client.WireMock;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;
import org.springframework.test.context.TestPropertySource;

import java.util.HashMap;
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.springframework.cloud.contract.spec.internal.MediaTypes.APPLICATION_JSON;

@SpringBootTest
@AutoConfigureWireMock(port = 0)
@TestPropertySource(
        properties = {
                "server-url=http://localhost:${wiremock.server.port}"
        }
)
class ActionInBlogApplicationTests {

    @Autowired
    BlogClient sut;

    @Test
    void get_method() {
        stubFor(get(urlPathEqualTo("/health"))
                .willReturn(
                        aResponse().withStatus(200).withBody("OK")
                ));


        String result = sut.health();


        assertThat(result, equalTo("OK"));
    }
}
```

##### Test Result

```
2023-03-02T20:52:40.484+09:00 DEBUG 14705 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#health] ---> GET http://localhost:10405/health HTTP/1.1
2023-03-02T20:52:40.484+09:00 DEBUG 14705 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#health] ---> END HTTP (0-byte body)
2023-03-02T20:52:40.595+09:00 DEBUG 14705 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#health] <--- HTTP/1.1 200 OK (110ms)
2023-03-02T20:52:40.595+09:00 DEBUG 14705 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#health] matched-stub-id: 203f3195-d999-4a3d-b4dd-c912e21a45c6
2023-03-02T20:52:40.595+09:00 DEBUG 14705 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#health] transfer-encoding: chunked
2023-03-02T20:52:40.596+09:00 DEBUG 14705 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#health] vary: Accept-Encoding, User-Agent
2023-03-02T20:52:40.596+09:00 DEBUG 14705 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#health] 
2023-03-02T20:52:40.597+09:00 DEBUG 14705 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#health] OK
2023-03-02T20:52:40.597+09:00 DEBUG 14705 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#health] <--- END HTTP (2-byte body)
```

#### 3.2.2. search method

```java
package action.in.blog;

import action.in.blog.client.BlogClient;
import action.in.blog.domain.Post;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.client.WireMock;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;
import org.springframework.test.context.TestPropertySource;

import java.util.HashMap;
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.springframework.cloud.contract.spec.internal.MediaTypes.APPLICATION_JSON;

@SpringBootTest
@AutoConfigureWireMock(port = 0)
@TestPropertySource(
        properties = {
                "server-url=http://localhost:${wiremock.server.port}"
        }
)
class ActionInBlogApplicationTests {

    @Autowired
    BlogClient sut;

    @Test
    void get_method_with_request_param() {
        stubFor(get(urlPathEqualTo("/search"))
                .withQueryParam("keyword", WireMock.equalTo("hello"))
                .willReturn(
                        aResponse().withStatus(200).withBody("OK")
                ));


        String result = sut.search("hello");


        assertThat(result, equalTo("OK"));
    }
}
```

##### Test Result

```
2023-03-02T20:54:15.074+09:00 DEBUG 14847 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#search] ---> GET http://localhost:11900/search?keyword=hello HTTP/1.1
2023-03-02T20:54:15.074+09:00 DEBUG 14847 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#search] ---> END HTTP (0-byte body)
2023-03-02T20:54:15.192+09:00 DEBUG 14847 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#search] <--- HTTP/1.1 200 OK (118ms)
2023-03-02T20:54:15.193+09:00 DEBUG 14847 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#search] matched-stub-id: e1f8c07c-95a2-4d30-a3a2-413e1d0c12a2
2023-03-02T20:54:15.193+09:00 DEBUG 14847 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#search] transfer-encoding: chunked
2023-03-02T20:54:15.193+09:00 DEBUG 14847 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#search] vary: Accept-Encoding, User-Agent
2023-03-02T20:54:15.193+09:00 DEBUG 14847 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#search] 
2023-03-02T20:54:15.194+09:00 DEBUG 14847 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#search] OK
2023-03-02T20:54:15.194+09:00 DEBUG 14847 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#search] <--- END HTTP (2-byte body)
```

```java
package action.in.blog;

import action.in.blog.client.BlogClient;
import action.in.blog.domain.Post;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.client.WireMock;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;
import org.springframework.test.context.TestPropertySource;

import java.util.HashMap;
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.springframework.cloud.contract.spec.internal.MediaTypes.APPLICATION_JSON;

@SpringBootTest
@AutoConfigureWireMock(port = 0)
@TestPropertySource(
        properties = {
                "server-url=http://localhost:${wiremock.server.port}"
        }
)
class ActionInBlogApplicationTests {

    @Autowired
    BlogClient sut;

    @Test
    void post_method_with_request_body() throws JsonProcessingException {
        ObjectMapper objectMapper = new ObjectMapper();
        Map<String, String> request = new HashMap<>();
        request.put("id", null);
        request.putAll(Map.of(
                "title", "hello world",
                "content", "this is post test for feign client"
        ));
        String requestJson = objectMapper.writeValueAsString(request);
        String expectedResponse = objectMapper.writeValueAsString(
                Map.of(
                        "id", "0001",
                        "title", "hello world",
                        "content", "this is post test for feign client"
                )
        );
        stubFor(post(urlPathEqualTo("/post"))
                .withHeader("Content-Type", WireMock.equalTo(APPLICATION_JSON))
                .withRequestBody(equalToJson(requestJson))
                .willReturn(
                        aResponse().withStatus(200)
                                .withHeader("Content-Type", APPLICATION_JSON)
                                .withBody(expectedResponse)
                ));


        Post result = sut.createPost(
                Post.builder()
                        .title("hello world")
                        .content("this is post test for feign client")
                        .build()
        );


        assertThat(result.getId(), equalTo("0001"));
        assertThat(result.getTitle(), equalTo("hello world"));
        assertThat(result.getContent(), equalTo("this is post test for feign client"));
    }
}
```

##### Test Result

```
2023-03-02T20:54:36.774+09:00 DEBUG 14877 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#createPost] ---> POST http://localhost:11659/post HTTP/1.1
2023-03-02T20:54:36.775+09:00 DEBUG 14877 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#createPost] Content-Length: 80
2023-03-02T20:54:36.775+09:00 DEBUG 14877 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#createPost] Content-Type: application/json
2023-03-02T20:54:36.775+09:00 DEBUG 14877 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#createPost] 
2023-03-02T20:54:36.775+09:00 DEBUG 14877 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#createPost] {"id":null,"title":"hello world","content":"this is post test for feign client"}
2023-03-02T20:54:36.775+09:00 DEBUG 14877 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#createPost] ---> END HTTP (80-byte body)
2023-03-02T20:54:36.891+09:00 DEBUG 14877 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#createPost] <--- HTTP/1.1 200 OK (116ms)
2023-03-02T20:54:36.892+09:00 DEBUG 14877 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#createPost] content-type: application/json
2023-03-02T20:54:36.892+09:00 DEBUG 14877 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#createPost] matched-stub-id: b1717773-b1e8-4c53-a1ed-243717a2c6fe
2023-03-02T20:54:36.892+09:00 DEBUG 14877 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#createPost] transfer-encoding: chunked
2023-03-02T20:54:36.892+09:00 DEBUG 14877 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#createPost] vary: Accept-Encoding, User-Agent
2023-03-02T20:54:36.892+09:00 DEBUG 14877 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#createPost] 
2023-03-02T20:54:36.893+09:00 DEBUG 14877 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#createPost] {"content":"this is post test for feign client","id":"0001","title":"hello world"}
2023-03-02T20:54:36.893+09:00 DEBUG 14877 --- [    Test worker] action.in.blog.client.BlogClient         : [BlogClient#createPost] <--- END HTTP (82-byte body)
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-03-02-logging-for-feign-client>

#### REFERENCE

* <https://www.baeldung.com/java-feign-logging>
* <https://howtodoinjava.com/spring-boot2/logging/configure-logging-application-yml/>
* <https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=2zino&logNo=221641662104>

[spring-cloud-openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/
[wire-mock-for-feign-client-test-link]: https://junhyunny.github.io/spring-boot/spring-cloud/test-driven-development/wire-mock-for-feign-client-test/