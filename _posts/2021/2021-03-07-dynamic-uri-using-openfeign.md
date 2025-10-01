---
title: "Change URI with Openfeign when Runtime"
search: false
category:
  - spring-boot
  - spring-cloud
  - junit
last_modified_at: 2021-08-23T00:30:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [스프링 클라우드(spring cloud) OpenFeign][openfeign-link]

## 1. Dynamic URI FeignClient when Runtime

`FeignClient`를 사용한 코드를 살펴보면 일반적으로 `URL`이 고정되어 있습니다. 
유연한 사용이 불가능한 것처럼 보이지만, `FeignClient`는 `URL`을 런타임에 바꿀 수 있도록 설계되어 있습니다.  

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

스택 오버플로우에서 관련된 답변을 찾을 수 있었습니다.

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

[스프링 클라우드(spring cloud) OpenFeign][openfeign-link] 포스트 예제를 변경하였습니다. 
변경한 일부 코드만 살펴보겠습니다.

### 3.1. HealthClient Interface

* 기본 URL 정보는 지정합니다.
    * `http://placeholder-url`
* 메소드의 매개 변수로 URI 객체를 전달합니다.

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

### 3.2. HealthController Class

* URI 객체를 생성합니다.
    * `http://b-service:8080`
* 클라이언트 객체에게 URI를 전달합니다.

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

### 4.1. Run Docker Compose

도커 컴포즈(docker compose)로 테스트 환경을 구축합니다.

```
$ docker-compose up -d
[+] Building 3.8s (23/23) FINISHED
 => [2021-03-07-dynamic-uri-using-openfeign-a-service internal] load build definition from Dockerfile                                                                                         0.0s
 => => transferring dockerfile: 32B                                                                                                                                                           0.0s
 => [2021-03-07-dynamic-uri-using-openfeign-b-service internal] load build definition from Dockerfile                                                                                         0.0s
 => => transferring dockerfile: 32B                                                                                                                                                           0.0s
 => [2021-03-07-dynamic-uri-using-openfeign-a-service internal] load .dockerignore                                                                                                            0.0s
 => => transferring context: 2B                                                                                                                                                               0.0s
 => [2021-03-07-dynamic-uri-using-openfeign-b-service internal] load .dockerignore                                                                                                            0.0s
 => => transferring context: 2B                                                                                                                                                               0.0s
 => [2021-03-07-dynamic-uri-using-openfeign-b-service internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                3.5s
 => [2021-03-07-dynamic-uri-using-openfeign-b-service internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                        3.5s
 => [2021-03-07-dynamic-uri-using-openfeign-b-service maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215      0.0s
 => [2021-03-07-dynamic-uri-using-openfeign-b-service stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55  0.0s
 => [2021-03-07-dynamic-uri-using-openfeign-a-service internal] load build context                                                                                                            0.0s 
 => => transferring context: 953B                                                                                                                                                             0.0s 
 => [2021-03-07-dynamic-uri-using-openfeign-b-service internal] load build context                                                                                                            0.0s 
 => => transferring context: 825B                                                                                                                                                             0.0s 
 => CACHED [2021-03-07-dynamic-uri-using-openfeign-a-service stage-1 2/3] WORKDIR /app                                                                                                        0.0s 
 => CACHED [2021-03-07-dynamic-uri-using-openfeign-a-service maven_build 2/6] WORKDIR /build                                                                                                  0.0s 
 => CACHED [2021-03-07-dynamic-uri-using-openfeign-b-service maven_build 3/6] COPY pom.xml .                                                                                                  0.0s 
 => CACHED [2021-03-07-dynamic-uri-using-openfeign-b-service maven_build 4/6] RUN mvn dependency:go-offline                                                                                   0.0s 
 => CACHED [2021-03-07-dynamic-uri-using-openfeign-b-service maven_build 5/6] COPY src ./src                                                                                                  0.0s 
 => CACHED [2021-03-07-dynamic-uri-using-openfeign-b-service maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                          0.0s 
 => CACHED [2021-03-07-dynamic-uri-using-openfeign-b-service stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                               0.0s 
 => [2021-03-07-dynamic-uri-using-openfeign-a-service] exporting to image                                                                                                                     0.1s 
 => => exporting layers                                                                                                                                                                       0.0s 
 => => writing image sha256:fbe6b2b0aefec38c7f5e01684663449508358c3985c674026daa49d8c750e1c0                                                                                                  0.0s 
 => => naming to docker.io/library/2021-03-07-dynamic-uri-using-openfeign-b-service                                                                                                           0.0s 
 => => writing image sha256:4df954c8cbac0d7b7900fe98bdaae3757ca1470307213ed556ef455bcaebacc5                                                                                                  0.0s 
 => => naming to docker.io/library/2021-03-07-dynamic-uri-using-openfeign-a-service                                                                                                           0.0s 
 => CACHED [2021-03-07-dynamic-uri-using-openfeign-a-service maven_build 3/6] COPY pom.xml .                                                                                                  0.0s 
 => CACHED [2021-03-07-dynamic-uri-using-openfeign-a-service maven_build 4/6] RUN mvn dependency:go-offline                                                                                   0.0s 
 => CACHED [2021-03-07-dynamic-uri-using-openfeign-a-service maven_build 5/6] COPY src ./src                                                                                                  0.0s 
 => CACHED [2021-03-07-dynamic-uri-using-openfeign-a-service maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                          0.0s 
 => CACHED [2021-03-07-dynamic-uri-using-openfeign-a-service stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                               0.0s 
[+] Running 2/2
 - Container 2021-03-07-dynamic-uri-using-openfeign-a-service-1  Started                                                                                                                      0.8s 
 - Container 2021-03-07-dynamic-uri-using-openfeign-b-service-1  Started                                                                                                                      0.7s
```

##### Test Result

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

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-03-07-dynamic-uri-using-openfeign>

#### REFERENCE

* <https://stackoverflow.com/questions/43733569/how-can-i-change-the-feign-url-during-the-runtime>

[openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/