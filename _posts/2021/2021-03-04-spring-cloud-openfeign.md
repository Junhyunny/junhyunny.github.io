---
title: "스프링 클라우드(spring cloud) OpenFeign"
search: false
category:
  - spring-boot
  - spring-cloud
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [마이크로서비스 아키텍처][microservice-architecture-link]

## 1. Spring Cloud Openfeign

> Spring Cloud Openfeign API Reference<br/>
> Feign is a declarative web service client. It makes writing web service clients easier.

MSA(MicroService Architecture)를 지원하는 스프링 클라우드(spring cloud) 프로젝트들 중 하나다. 서비스들 사이의 API 요청, 응답을 쉽게 할 수 있도록 돕는 라이브러리다. 간단한 예제 코드를 통해 사용 방법을 살펴보자.

## 2. Practice

간단한 예제를 통해 동작을 살펴보자. 다음과 같은 API 호출이 필요하다.

1. 사용자는 `서비스A`의 `/health` 경로로 API 요청을 수행한다.
2. `서비스A`는 `/health` 요청을 받으면 `서비스B`로 API 요청을 수행한다.
3. `서비스B`는 자신의 상태를 응답한다.
4. `서비스A`는 `서비스B` 응답과 자신의 상태를 함께 응답한다.
5. 사용자는 `서비스A`로부터 결과를 응답 받는다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/spring-cloud-openfeign-01.png" width="80%" class="image__border">
</div>

pom.xml 파일에 `spring-cloud-starter-openfeign` 의존성을 추가한다.

```xml
    <properties>
        <spring-cloud.version>2021.0.5</spring-cloud.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-openfeign</artifactId>
        </dependency>
    </dependencies>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
```

이 작업은 `ServiceA` 프로젝트에서 작업을 수행한다.

- `서비스B`에게 API 요청하기 위한 클라이언트를 만든다.
- 이름과 URL을 지정한다. 이름은 필수 값이다. 테스트를 위해 도커 컴포즈(docker compose) 파일에 명시된 서비스 이름을 작성한다.
- GET 요청이므로 `@GetMapping` 애너테이션을 사용한다. `서비스B`에는 요청을 받기 위한 `/health` 경로가 존재한다.

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

`ServiceA` 프로젝트에 요청을 받을 수 있도록 `/health` 경로 생성한다.

```java
package action.in.blog.controller;

import action.in.blog.client.HealthClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final HealthClient healthClient;

    public HealthController(HealthClient healthClient) {
        this.healthClient = healthClient;
    }

    @GetMapping("/health")
    public String health() {
        return String.format("ServiceA's Health - OK / ServiceB's Health - %s", healthClient.health());
    }
}
```

`ServiceA` 프로젝트에 `@FeignClient` 사용을 위해 `@EnableFeignClients` 애너테이션을 추가한다.

```java
package action.in.blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@EnableFeignClients
@SpringBootApplication
public class AServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AServiceApplication.class, args);
    }

}
```

`ServiceB` 프로젝트에 요청을 받기 위한 `/health` 경로 생성한다.

```java
package action.in.blog.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}
```

## 3. Test

도커 컴포즈로 테스트 환경을 구축한다.

### 3.1. Dockerfile

```dockerfile
FROM maven:3.8.6-jdk-11 as MAVEN_BUILD

WORKDIR /build

COPY pom.xml .

RUN mvn dependency:go-offline

COPY src ./src

RUN mvn package -Dmaven.test.skip=true

FROM openjdk:11-jdk-slim-buster

WORKDIR /app

ARG JAR_FILE=*.jar

COPY --from=MAVEN_BUILD /build/target/${JAR_FILE} ./app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
```

### 3.2. docker-compose.yml

```yml
version: "3.9"
services:
  a-service:
    build: ./a-service
    ports:
      - "8080:8080"
  b-service:
    build: ./b-service
    ports:
      - "8081:8080"
```

### 3.3. Run Docker Compose

```
$ docker-compose up -d
...
[+] Running 2/2
 - Container 2021-03-04-spring-cloud-openfeign-a-service-1  Started                            0.8s 
 - Container 2021-03-04-spring-cloud-openfeign-b-service-1  Started
```

테스트 결과를 확인하기 위해 사용자 터미널에서 `cURL` 명령어를 통해 테스트를 수행한다.

```
$ curl http://localhost:8080/health
                        

StatusCode        : 200
StatusDescription :
Content           : ServiceA's Health - OK / ServiceB's Health - OK
RawContent        : HTTP/1.1 200
                    Keep-Alive: timeout=60
                    Connection: keep-alive
                    Content-Length: 47
                    Content-Type: text/plain;charset=UTF-8
                    Date: Sat, 04 Feb 2023 12:43:58 GMT

                    ServiceA's Health - OK / ServiceB's He...
Forms             : {}
Headers           : {[Keep-Alive, timeout=60], [Connection, keep-alive], [Content-Length, 47], [Content-Type, text/plain;charset=UTF-8]...}
Images            : {}
InputFields       : {}
Links             : {}
ParsedHtml        : mshtml.HTMLDocumentClass
RawContentLength  : 47
```

## CLOSING

유틸성 클래스를 만들어 HTTP 요청을 다루는 코드를 오래된 시스템에서 종종 보았다. `HttpURLConnection`, `I/O Stream` 클래스를 사용해 불필요한 코드가 많았는데, `FeignClient`는 인터페이스와 애너테이션을 통해 비즈니스와 관련 없는 코드들을 최대한 단순화시킨다. `spring-cloud` 생태계를 조성하는 다른 컴포넌트들과 함께 사용하면 더욱 좋다. 

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-03-04-spring-cloud-openfeign>

#### RECOMMEND NEXT POSTS

- [런타임 시 OpenFeign URI 동적 변경][dynamic-uri-using-openfeign-link]
- [스프링 클라우드 넷플릭스 유레카(Spring Cloud Netflix Eureka)][spring-cloud-netflix-eureka-link]
- [FeignClient with Eureka][feignclient-with-eureka-link]

#### REFERENCE

- <https://woowabros.github.io/experience/2019/05/29/feign.html>
- <https://supawer0728.github.io/2018/03/11/Spring-Cloud-Feign/>

[microservice-architecture-link]: https://junhyunny.github.io/information/msa/microservice-architecture/
[dynamic-uri-using-openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/junit/dynamic-uri-using-openfeign/
[spring-cloud-netflix-eureka-link]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/spring-cloud-netflix-eureka/
[feignclient-with-eureka-link]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/junit/feignclient-with-eureka/