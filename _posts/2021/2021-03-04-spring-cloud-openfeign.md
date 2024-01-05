---
title: "Spring Cloud Openfeign"
search: false
category:
  - spring-boot
  - spring-cloud
last_modified_at: 2021-08-22T20:30:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [MicroService Architecture][microservice-architecture-link]

## 1. Spring Cloud Openfeign

> Spring Cloud Openfeign API Reference<br/>
> Feign is a declarative web service client. It makes writing web service clients easier.

MSA(MicroService Architecture)를 지원하는 스프링 클라우드(spring cloud) 프로젝트들 중 하나입니다. 
서비스들 사이의 API 요청, 응답을 쉽게 할 수 있도록 돕는 라이브러리입니다. 
간단한 예제 코드를 통해 사용 방법을 살펴보겠습니다. 

## 2. Practice

### 2.1. Context of Practice

다음과 같은 상황을 만들어 사용해보았습니다. 

1. 사용자는 `서비스A`의 `/health` 경로로 API 요청을 수행합니다. 
1. `서비스A`는 `/health` 요청을 받으면 `서비스B`로 API 요청을 수행합니다.
1. `서비스B`는 자신의 상태를 응답합니다.
1. `서비스A`는 `서비스B` 응답과 자신의 상태를 함께 응답합니다.
1. 사용자는 `서비스A`로부터 결과를 응답 받습니다.

<p align="center">
    <img src="/images/spring-cloud-openfeign-1.JPG" width="80%" class="image__border">
</p>

### 2.2. pom.xml

* `spring-cloud-starter-openfeign` 의존성을 추가합니다.

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

### 2.3. HealthClient for ServiceA

`ServiceA` 프로젝트에서 작업을 수행합니다.

* `서비스B`에게 API 요청하기 위한 클라이언트를 만듭니다.
* 이름과 URL을 지정합니다.
    * 이름은 필수 값입니다.
    * 테스트를 위해 도커 컴포즈(docker compose) 파일에 명시된 서비스 이름을 작성합니다.
* GET 요청이므로 `@GetMapping` 애너테이션을 사용합니다.
    * `서비스B`에는 요청을 받기 위한 `/health` 경로가 존재합니다.

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

### 2.4. HealthController Class for ServiceA

`ServiceA` 프로젝트에서 작업을 수행합니다.

* 요청을 받을 수 있도록 `/health` 경로 생성합니다.

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

### 2.5. AServiceApplication Class for ServiceA

`ServiceA` 프로젝트에서 작업을 수행합니다.

* `@FeignClient` 사용을 위해 `@EnableFeignClients` 애너테이션을 추가합니다.

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

### 2.6. HealthController Class for ServiceB

`ServiceB` 프로젝트에서 작업을 수행합니다.

* 요청을 받을 수 있도록 `/health` 경로 생성합니다.

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

도커 컴포즈로 테스트 환경을 구축합니다.

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
$ docker-compose build 
[+] Building 0.0s (0/0)
[+] Building 0.1s (1/2)
 => [internal] load build definition from Dockerfile                                                                                                      0.0s
[+] Building 0.2s (2/4)
 => [internal] load build definition from Dockerfile                                                                                                      0.0s
 => => transferring dockerfile: 32B                                                                                                                       0.0s 
 => [internal] load .dockerignore                                                                                                                         0.0s
[+] Building 4.6s (15/15) FINISHED
 => [internal] load build definition from Dockerfile                                                                                                      0.0s 
 => => transferring dockerfile: 32B                                                                                                                       0.0s 
 => [internal] load .dockerignore                                                                                                                         0.0s
 => => transferring context: 2B                                                                                                                           0.0s 
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                             4.3s 
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                                     4.4s 
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215                   0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55               0.0s 
 => [internal] load build context                                                                                                                         0.0s 
 => => transferring context: 953B                                                                                                                         0.0s 
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                                     0.0s 
 => CACHED [maven_build 2/6] WORKDIR /build                                                                                                               0.0s 
 => CACHED [maven_build 3/6] COPY pom.xml .                                                                                                               0.0s 
 => CACHED [maven_build 4/6] RUN mvn dependency:go-offline                                                                                                0.0s 
[+] Building 4.7s (15/15) FINISHED                                                                                                                        
 => [internal] load build definition from Dockerfile                                                                                                      0.0s 
 => => transferring dockerfile: 32B                                                                                                                       0.0s 
 => [internal] load .dockerignore                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                           0.0s 
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                             4.3s 
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                                     4.4s 
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215                   0.0s
 => [internal] load build context                                                                                                                         0.0s 
 => => transferring context: 825B                                                                                                                         0.0s 
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55               0.0s 
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                                     0.0s 
 => CACHED [maven_build 2/6] WORKDIR /build                                                                                                               0.0s 
 => CACHED [maven_build 3/6] COPY pom.xml .                                                                                                               0.0s 
 => CACHED [maven_build 4/6] RUN mvn dependency:go-offline                                                                                                0.0s 
 => CACHED [maven_build 5/6] COPY src ./src                                                                                                               0.0s 
 => CACHED [maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                                       0.0s 
 => CACHED [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                            0.0s 
 => exporting to image                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                   0.0s 
 => => writing image sha256:a5a64359c420aacc54dbfced07a7ea4f7c5e46faa43e3c58e49031361466831e                                                              0.0s 
 => => naming to docker.io/library/2021-03-04-spring-cloud-openfeign-backend                                                                              0.0s

$  docker-compose up -d
[+] Running 2/2
 - Container 2021-03-04-spring-cloud-openfeign-a-service-1  Started                                                                                       0.8s 
 - Container 2021-03-04-spring-cloud-openfeign-b-service-1  Started
```

##### Test Result

사용자 터미널에서 `cURL` 명령어를 통해 테스트를 수행합니다.

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

유틸성 클래스를 만들어 HTTP 요청을 다루는 코드를 오래된 시스템에서 종종 보았습니다. 
`HttpURLConnection`, `I/O Stream` 클래스를 사용해 불필요한 코드가 많았는데, `FeignClient`는 인터페이스와 애너테이션을 통해 비즈니스와 관련 없는 코드들을 최대한 단순화시킵니다. 
`spring-cloud` 생태계를 조성하는 다른 컴포넌트들과 함께 사용하면 더욱 좋습니다. 

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-03-04-spring-cloud-openfeign>

#### RECOMMEND NEXT POSTS

* [Change URI with Openfeign when Runtime][dynamic-uri-using-openfeign-link]
* [Spring Cloud Netflix Eureka][spring-cloud-netflix-eureka-link]
* [FeignClient with Eureka][feignclient-with-eureka-link]

#### REFERENCE

* <https://woowabros.github.io/experience/2019/05/29/feign.html>
* <https://supawer0728.github.io/2018/03/11/Spring-Cloud-Feign/>

[microservice-architecture-link]: https://junhyunny.github.io/information/msa/microservice-architecture/
[dynamic-uri-using-openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/junit/dynamic-uri-using-openfeign/
[spring-cloud-netflix-eureka-link]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/spring-cloud-netflix-eureka/
[feignclient-with-eureka-link]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/junit/feignclient-with-eureka/