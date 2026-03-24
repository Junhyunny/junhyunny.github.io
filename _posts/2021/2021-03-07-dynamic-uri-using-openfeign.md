---
title: "런타임 시 OpenFeign URI 동적 변경"
search: false
category:
  - spring-boot
  - spring-cloud
  - junit
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [스프링 클라우드(spring cloud) OpenFeign][openfeign-link]

## 1. Dynamic URI FeignClient when Runtime

`FeignClient`를 사용한 코드를 살펴보면 일반적으로 `URL`이 고정되어 있다. 유연한 사용이 불가능한 것처럼 보이지만, FeignClient는 URL을 런타임에 바꿀 수 있도록 설계되어 있다.

```java
package action.in.blog.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "health-client", url = "http://b-service:8080")
public interface HealthClient {

    @GetMapping(path = "/health")
    String health();
}
```

## 2. Change URL when Runtime

스택 오버플로우에서 관련된 답변을 찾을 수 있었다.

> StackOverflow<br/>
> You can add an unannotated URI parameter (that can potentially be determined at runtime) and that will be the base path that will be used for the request. E.g.:

```java
@FeignClient(name = "dummy-name", url = "https://this-is-a-placeholder.com")
public interface MyClient {
    @PostMapping(path = "/create")
    UserDto createUser(URI baseUrl, @RequestBody UserDto userDto);
}
```

## 3. Practice

[스프링 클라우드(spring cloud) OpenFeign][openfeign-link] 글의 예제를 변경하였다. 변경한 일부 코드만 살펴보겠다.

FeignClient 객체로 사용될 HealthClient 인터페이스를 살펴보자.

- 기본 플레이스홀더 URL 정보를 `http://placeholder-url`으로 지정한다.
- 메서드의 매개변수로 URI 객체를 전달한다.

```java
package action.in.blog.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.net.URI;

@FeignClient(name = "health-client", url = "http://placeholder-url")
public interface HealthClient {

    @GetMapping(path = "/health")
    String health(URI baseUri);
}
```

테스트를 위한 HealthController 컨트롤러 클래스를 살펴보자.

- URI 객체를 생성한다. http://b-service:8080 주소를 사용한다.
- 클라이언트 객체에게 URI를 전달한다.

```java
package action.in.blog.controller;

import action.in.blog.client.HealthClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
public class HealthController {

    private final HealthClient healthClient;

    public HealthController(HealthClient healthClient) {
        this.healthClient = healthClient;
    }

    @GetMapping("/health")
    public String health() {
        URI baseUri = URI.create("http://b-service:8080");
        return String.format("ServiceA's Health - OK / ServiceB's Health - %s", healthClient.health(baseUri));
    }
}
```

## 4. Test

도커 컴포즈(docker compose)로 테스트 환경을 구축했다.

```
$ docker-compose up -d
...
[+] Running 2/2
 - Container 2021-03-07-dynamic-uri-using-openfeign-a-service-1  Started                              0.8s 
 - Container 2021-03-07-dynamic-uri-using-openfeign-b-service-1  Started                              0.7s
```

위에서 정의한 컨트롤러 엔드포인트로 요청을 보내면 정상적인 응답을 받을 수 있다.

```
$  curl http://localhost:8080/health

StatusCode        : 200
StatusDescription : 
Content           : ServiceA's Health - OK / ServiceB's Health - OK
RawContent        : HTTP/1.1 200 
                    Keep-Alive: timeout=60
                    Connection: keep-alive
                    Content-Length: 47
                    Content-Type: text/plain;charset=UTF-8
                    Date: Sat, 04 Feb 2023 14:06:50 GMT
                    
                    ServiceA's Health - OK / ServiceB's He...
Forms             : {}
Headers           : {[Keep-Alive, timeout=60], [Connection, keep-alive], [Content-Length, 47], [Content-Type, text/plain;charset=UTF-8]...}
Images            : {}
InputFields       : {}
Links             : {}
ParsedHtml        : mshtml.HTMLDocumentClass
RawContentLength  : 47
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-03-07-dynamic-uri-using-openfeign>

#### REFERENCE

- <https://stackoverflow.com/questions/43733569/how-can-i-change-the-feign-url-during-the-runtime>

[openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/