---
title: "Openfeign 런타임(runtime) 시 URI 변경"
search: false
category:
  - spring-boot
  - spring-cloud
  - junit
last_modified_at: 2021-03-07T09:00:00
---

<br>

[Spring Cloud Openfeign][openfeign-blogLink] 포스트에서 다음 주제로 예고한 **`Eureka 서비스 구축 및 관련 API 요청 테스트`**에 대한 글을 작성하기 전에 간단한 기능을 먼저 소개하려고 합니다. 
지난 포스트에서 사용한 FeignClient 코드를 보면 직관적으로 URL이 고정되어 있다고 느낄 수 있습니다. 

##### Spring Cloud Openfeign 포스트에서 사용한 SimpleClient 인터페이스
```java
@FeignClient(name = "simple-client", url = "http://localhost:8081")
interface SimpleClient {

    @GetMapping(path = "/api/cors/health")
    String health();
}
```

사실 FeignClient는 보다 더 유연한 프로그램 개발을 위해 런타임(runtime) 시 URL을 변경하는 기능을 제공하고 있습니다. 
관련된 내용을 stack overflow 답변에서 확인할 수 있었습니다.

> stack overflow<br>
> You can add an unannotated URI parameter (that can potentially be determined at runtime) and that will be the base path that will be used for the request. E.g.:

```java
@FeignClient(name = "dummy-name", url = "https://this-is-a-placeholder.com")
public interface MyClient {
    @PostMapping(path = "/create")
    UserDto createUser(URI baseUrl, @RequestBody UserDto userDto);
}
```

설명을 보아하니 애너테이션이 붙어있지 않은 URI 파라미터를 추가하면 해당 URI로 요청을 보낸다는 내용 같습니다. 
유사한 방법으로 테스트 코드를 작성해보았습니다. 

## 테스트 코드
```java
package blog.in.action.openfeign.dynamic;

import java.net.URI;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import feign.Response;
import lombok.extern.log4j.Log4j2;

@FeignClient(name = "dynamic-url-client", url = "any-value")
interface DynamicUrlClient {

    @GetMapping(path = "/")
    Response getMethod(URI uri);
}

@Log4j2
@SpringBootTest
public class DynamicUrlTest {

    @Autowired
    private DynamicUrlClient dynamicUrlClient;

    @Test
    public void test() {
        try {
            Response response = dynamicUrlClient.getMethod(new URI("https://www.naver.com"));
            log.info("response from naver: " + response.body());
            response = dynamicUrlClient.getMethod(new URI("https://www.google.com"));
            log.info("response from google: " + response.body());
        } catch (Exception e) {
            log.error("error while using feignclient", e);
        }
    }
}
```

## 테스트 수행
- **`https://www.naver.com`** 주소를 가진 URI 객체를 getMethod() 메소드의 매개변수로 전달합니다.
- **`https://www.google.com`** 주소를 가진 URI 객체를 getMethod() 메소드의 매개변수로 전달합니다.
- 각 결과를 확인합니다.

##### https://www.naver.com 요청 결과
<p align="center"><img src="/images/dynamic-uri-using-openfeign-1.JPG"></p>

##### https://www.google.com 요청 결과
<p align="center"><img src="/images/dynamic-uri-using-openfeign-2.JPG"></p>

## OPINION
Openfeign을 사용하는 프로젝트에서 유용한 정보일 것 같습니다. 
간단한 테스트 코드와 기능 설명으로 짧은 글을 작성할 수 있을 것 같아서 해당 주제를 먼저 포스트하였습니다. 

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action>

#### REFERENCE
- <https://stackoverflow.com/questions/43733569/how-can-i-change-the-feign-url-during-the-runtime>

[openfeign-blogLink]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/