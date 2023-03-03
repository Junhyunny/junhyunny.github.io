---
title: "Custom Feign Decoder"
search: false
category:
  - spring-boot
  - spring-cloud
last_modified_at: 2023-03-03T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Spring Cloud Openfeign][spring-cloud-openfeign-link]
* [WireMock for FeignClient Test][wire-mock-for-feign-client-test-link]

## 0. 들어가면서

최근 프로젝트에서 레거시 서버와 연결하면서 응답 메세지에 다음과 같은 문제가 있었습니다. 

* 홑따옴표(')로 묶인 키(key), 값(value)로 구성된 JSON 형식
* 홑따옴표는 이스케이핑(escaping) 처리

예를 들면 다음과 같은 메세지를 응답 받았습니다.

```
[{&#39;id&#39;: &#39;0001&#39;, &#39;title&#39;: &#39;hello world&#39;, &#39;content&#39;: &#39;this is post test for feign client&#39;}]
```

`FeignClient`를 사용하고 있었고, 두 가지 옵션을 생각했습니다. 

* 프록시(proxy) 객체를 만들고, 프록시 내부에서 관련된 언이스케이프(unescape) 처리 및 객체 생성
* 커스텀 `SpringDecoder`를 만들고, 해당 `FeignClient` 객체에 주입

스프링(spring) 프레임워크의 기능이 필요하지만, 관심사를 분리하자는 차원에서 `SpringDecoder` 기능을 확장하였습니다. 
이번 포스트에선 커스텀 `SpringDecoder` 객체를 적용하는 방법에 대해 정리하였습니다.

## 1. Encoding and Decoding

인코딩(encoding)과 디코딩(decoding)에 대한 개념을 먼저 살펴보겠습니다. 
어플리케이션에서 사용하는 객체들은 서비스들 사이의 통신에서 그대로 사용하지 못 합니다. 
서비스들 사이에 실제 통신은 바이트 배열(byte array)을 통해 이뤄집니다. 
어플리케이션의 객체와 바이트 배열 사이의 변환이 필요한 데 이런 과정을 인코딩, 디코딩이라 합니다.

* 인코딩(encoding)
    * 메세지를 담은 객체를 바이트 배열로 변경합니다.
* 디코딩(decoding)
    * 바이트 배열을 메시지를 담은 객체로 변경합니다.

<p align="center">
    <img src="/images/custom-feign-decoder-1.JPG" width="80%" class="image__border">
</p>

## 2. Implementation 

간단한 예제 코드를 구현하고, 테스트해보겠습니다. 
디코딩 과정은 다음 과정을 거칩니다.

* 메세지 언이스케이프
* 홑따옴표로 구성된 JSON 메세지 객체화

### 2.1. build.gradle

실습을 위해서 다음과 같은 의존성들이 필요합니다.

```gradle

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.cloud:spring-cloud-starter-openfeign'
    implementation group: 'commons-io', name: 'commons-io', version: '2.11.0'
    implementation group: 'org.apache.commons', name: 'commons-lang3', version: '3.12.0'
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.cloud:spring-cloud-starter-contract-stub-runner'
}
```

### 2.2. UnescapingHtml4Decoder Class

* 언이스케이핑 처리를 위한 디코더 클래스입니다.
* `SpringDecoder` 클래스를 확장합니다.
* `decode` 메소드 기능을 확장합니다.
    * `IOUtils` 클래스를 통해 응답(response body)에서 메세지를 추출합니다.
    * `StringEscapeUtils` 클래스를 통해 메세지를 언이스케이프 처리합니다. 

```java
package action.in.blog.config;

import feign.FeignException;
import feign.Response;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringEscapeUtils;
import org.springframework.beans.factory.ObjectFactory;
import org.springframework.boot.autoconfigure.http.HttpMessageConverters;
import org.springframework.cloud.openfeign.support.SpringDecoder;

import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;

public class UnescapingHtml4Decoder extends SpringDecoder {

    public UnescapingHtml4Decoder(ObjectFactory<HttpMessageConverters> messageConverters) {
        super(messageConverters);
    }

    @Override
    public Object decode(Response response, Type type) throws IOException, FeignException {
        Response.Body body = response.body();
        String responseValue = IOUtils.toString(body.asReader(StandardCharsets.UTF_8));
        return super.decode(
                Response.builder()
                        .status(response.status())
                        .request(response.request())
                        .headers(response.headers())
                        .body(StringEscapeUtils.unescapeHtml4(responseValue), StandardCharsets.UTF_8)
                        .build(),
                type);
    }
}
```

### 2.3. BlogClientConfig Class

* 홑따옴표로 구성된 JSON 메세지를 객체로 변경할 수 있는 컨버터를 만듭니다. 
* `ObjectMapper` 객체에 `ALLOW_SINGLE_QUOTES` 설정을 추가합니다.
* `MappingJackson2HttpMessageConverter` 메세지 컨버터(converter) 객체를 생성합니다.
    * 메세지 컨버터 내부에서 사용하는 모듈은 `ObjectMapper` 객체입니다.
    * 메세지 컨버터가 지원하는 메세지 포맷을 지정합니다.
* `ObjectFactory` 객체를 만들어 `UnescapingHtml4Decoder`에 주입합니다.

```java
package action.in.blog.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.ObjectFactory;
import org.springframework.boot.autoconfigure.http.HttpMessageConverters;
import org.springframework.cloud.openfeign.support.SpringDecoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

import static java.util.Arrays.asList;
import static org.springframework.http.MediaType.*;


@Configuration
public class BlogClientConfig {

    @Bean
    public SpringDecoder springDecoder() {
        final ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.configure(JsonParser.Feature.ALLOW_SINGLE_QUOTES, true);
        final MappingJackson2HttpMessageConverter jacksonConverter = new MappingJackson2HttpMessageConverter(objectMapper);
        jacksonConverter.setSupportedMediaTypes(asList(APPLICATION_JSON, APPLICATION_OCTET_STREAM, APPLICATION_JSON_UTF8));
        final ObjectFactory<HttpMessageConverters> objectFactory = () -> new HttpMessageConverters(jacksonConverter);
        return new UnescapingHtml4Decoder(objectFactory);
    }
}
```

### 2.4. BlogClient Interface

* 통신에 사용하는 `FeignClient` 객체가 사용할 수 있도록 설정 빈 객체를 지정합니다.

```java
package action.in.blog.client;

import action.in.blog.config.BlogClientConfig;
import action.in.blog.domain.Post;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@FeignClient(name = "blog-client", url = "${server-url}", configuration = {BlogClientConfig.class})
public interface BlogClient {

    @GetMapping("/posts")
    List<Post> getPosts();
}
```

### 3. Test

* `WireMock`을 사용해 테스트를 수행합니다. 
    * 이스케이핑 된 메세지를 준비하고, 특정 경로에 대한 응답으로 이를 반환합니다. 
* 정상적으로 값이 매칭된 객체를 응답받는지 확인합니다.

```java
package action.in.blog;

import action.in.blog.client.BlogClient;
import action.in.blog.domain.Post;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;
import org.springframework.test.context.TestPropertySource;

import java.util.List;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

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
    void contextLoads() {
        String expectResponse = "[{&#39;id&#39;: &#39;0001&#39;, &#39;title&#39;: &#39;hello world&#39;, &#39;content&#39;: &#39;this is post test for feign client&#39;}]";
        stubFor(get("/posts")
                .willReturn(
                        aResponse().withBody(expectResponse)
                ));


        List<Post> result = sut.getPosts();


        assertThat(result.size(), equalTo(1));
        Post post = result.get(0);
        assertThat(post.getId(), equalTo("0001"));
        assertThat(post.getTitle(), equalTo("hello world"));
        assertThat(post.getContent(), equalTo("this is post test for feign client"));
    }
}
```

##### Result of Test

```
BUILD SUCCESSFUL in 12s
4 actionable tasks: 3 executed, 1 up-to-date
1:09:51 PM: Execution finished ':test --tests "action.in.blog.ActionInBlogApplicationTests.contextLoads"'.
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-03-03-custom-feign-decoder>

#### REFERENCE

* <https://docs.spring.io/spring-cloud-openfeign/docs/current/reference/html/>
* <https://velog.io/@haron/Feign-client-%EC%A0%81%EC%9A%A9%EA%B8%B0>
* <https://sabarada.tistory.com/116>
* <https://gist.github.com/Darguelles/d9f76f29a74e7ed6e8c305098ea3469b>
* <https://www.educative.io/answers/how-to-parse-single-quotes-json-using-jackson-in-java>

[spring-cloud-openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/
[wire-mock-for-feign-client-test-link]: https://junhyunny.github.io/spring-boot/spring-cloud/test-driven-development/wire-mock-for-feign-client-test/