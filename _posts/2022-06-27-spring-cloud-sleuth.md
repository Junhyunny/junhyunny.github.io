---
title: "Spring Cloud Sleuth"
search: false
category:
    - spring-boot
    - spring-cloud
last_modified_at: 2022-06-27T23:55:00
---

<br>

## 1. Spring Cloud Sleuth

> Spring Cloud Sleuth API Reference<br>
> Spring Cloud Sleuth provides Spring Boot auto-configuration for distributed tracing.

`Micro Service Architecture`를 지원하는 Spring Cloud 프로젝트 중 하나입니다. 
서비스들 사이에 발생하는 요청과 응답들 사이의 연결 고리를 쉽게 추적할 수 있도록 돕는 라이브러리입니다. 
다음과 같은 역할을 수행합니다.

* TRACE, SPAN ID를 Slf4j MDC에 추가하여, TRACE 혹은 SPAN_ID를 로그에 출력하여 연결된 요청 정보를 추출해낼 수 있습니다.
* 스프링 어플리케이션의 일반적인 수신 및 송신 지점을 계측합니다.
    * servlet filter
    * rest template
    * scheduled actions
    * message channels
    * feign client
* `spring-cloud-sleuth-zipkin` 라이브러리를 사용 가능하다면 zipkin 서비스를 통해 추적 리포트를 만들 수 있습니다.

## 2. Sleuth 동작 과정

`Sleuth`를 사용하면 서비스들 사이에 다음과 같은 일들이 일어납니다. 

* 사용자 요청은 다음과 같은 흐름으로 진행됩니다.
    * CLIENT > SERVICE1 > SERVICE2 > SERVICE3 > SERVICE2 > SERVICE4 > SERVICE2 > SERVICE1 > CLIENT
* 사용자 요청이 처음 SERVICE1에 도달하면 TRACE_ID와 SPAN_ID가 생성됩니다.
    * TRACE_ID - X
    * SPAN_ID - A
* SERVICE1에서 SERVICE2로 요청할 때 새로운 SPAN_ID를 만들어 전달합니다.
    * TRACE_ID - X
    * SPAN_ID - B
* SERVICE2는 TRACE_ID는 유지하면서 새로운 SPAN_ID를 사용합니다.
    * TRACE_ID - X
    * SPAN_ID - C
* SERVICE2에서 SERVICE3로 요청할 때 새로운 SPAN_ID를 만들어 전달합니다.
    * TRACE_ID - X
    * SPAN_ID - D
* SERVICE3는 TRACE_ID는 유지하면서 새로운 SPAN_ID를 사용합니다.
    * TRACE_ID - X
    * SPAN_ID - E
* 서비스를 이동할 때마다 위와 같은 과정이 반복됩니다.
* 클라이언트의 첫 요청 시에 생성되는 TRACE_ID는 여러 서비스를 거치더라도 변경되지 않습니다.
* 각 서비스 별로 SPAN_ID는 변경됩니다.

<p align="center">
    <img src="/images/spring-cloud-sleuth-1.JPG" width="100%" class="image__border">
</p>
<center>https://docs.spring.io/spring-cloud-sleuth/docs/current/reference/html/getting-started.html#getting-started-terminology</center>


## 3. Sleuth 라이브러리 테스트

### 3.1. 테스트 시나리오

Sleuth 라이브러리 적용을 다음과 같은 시나리오로 테스트하였습니다.

* 터미널에서 cURL 호출을 클라이언트 요청으로 가정합니다.
    * 다음과 같은 요청 파라미터를 전달합니다.
    * 하나의 터미널에서는 `key=allow` 값을 전달합니다.
    * 또 다른 터미널에서는 `key=deny` 값을 전달합니다.
* A-SERVICE는 요청을 전달 받고 5초 후에 B-SERVICE로 요청을 전달합니다.
* B-SERVICE는 요청을 전달 받고 5초 후에 key 값이 `deny`라면 예외(exception)을 던집니다.

<p align="center">
    <img src="/images/spring-cloud-sleuth-2.JPG" width="80%" class="image__border">
</p>

### 3.2. 어플리케이션 코드

각 서비스의 컨트롤러 코드를 살펴보겠습니다.

#### 3.2.1. A-SERVICE의 AController 클래스

* 반복문을 5회 수행하며, 1회 수행마다 1초씩 기다립니다.
* `processing...` 로그가 비즈니스 로직이라고 가정하겠습니다.
* 5회 반복 수행이 끝나면 `RestTemplate`를 이용하여 B-SERVICE로 파리미터와 함께 요청을 전달합니다.

```java
package action.in.blog.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
public class AController {

    private final Logger logger = LoggerFactory.getLogger(AController.class);

    private final RestTemplate restTemplate;

    public AController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    private void sleep() {
        try {
            Thread.sleep(1000);
        } catch (Exception e) {
            logger.warn(e.getMessage());
        }
    }

    @GetMapping(path = {"", "/"})
    public void index(@RequestHeader Map<String, Object> headers, @RequestParam("key") String key) {
        logger.info("header: " + headers + ", key: " + key);
        for (int index = 0; index < 5; index++) {
            logger.info("processing...");
            sleep();
        }
        restTemplate.getForObject("http://b-service:8081?key=" + key, String.class);
    }
}

@Configuration
class Config {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

#### 3.2.2. B-SERVICE의 BController 클래스

* 반복문을 5회 수행하며, 1회 수행마다 1초씩 기다립니다.
* `processing...` 로그가 비즈니스 로직이라고 가정하겠습니다.
* 5회 반복 수행이 끝나면 전달받은 파라미터에 따라 의도적으로 예외를 발생시킵니다.
    * 전달 받은 파라미터가 `deny`인 경우 `RuntimeException`을 던집니다.

```java
package action.in.blog.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class BController {

    private final Logger logger = LoggerFactory.getLogger(BController.class);

    private void sleep() {
        try {
            Thread.sleep(1000);
        } catch (Exception e) {
            logger.warn(e.getMessage());
        }
    }

    private void throwException(String key) {
        if ("deny".equals(key)) {
            throw new RuntimeException("throw error");
        }
    }

    @GetMapping(path = {"", "/"})
    public void index(@RequestHeader Map<String, Object> headers, @RequestParam("key") String key) {
        logger.info("header: " + headers + ", key: " + key);
        for (int index = 0; index < 5; index++) {
            logger.info("processing...");
            sleep();
        }
        throwException(key);
    }
}
```

### 3.3. 테스트 하기

로그를 한 눈에 보기 쉽도록 `docker-compose`를 사용하여 attatch 모드로 서비스를 실행하였습니다. 

#### 3.3.1. 서비스 별 application.yml

##### A-SERVICE's application.yml

```yml
server:
  port: 8080
spring:
  application:
    name: a-service
```

##### B-SERVICE's application.yml

```yml
server:
  port: 8081
spring:
  application:
    name: b-service
```

#### 3.3.2. 프로젝트 별 Dockerfile

* a-service, b-service 프로젝트에 `Dockerfile`을 하나씩 만듭니다.
* 전반적인 `Dockerfile` 내용은 동일하며, `EXPOSE` 키워드로 노출하는 포트 번호만 다릅니다.
    * a-service's dockerfile - `EXPOSE 8080`
    * b-service's dockerfile - `EXPOSE 8081`

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

#### 3.3.3. docker-compose.yml

* `docker-compose.yml` 파일을 통해 두 서비스를 실행합니다.
* a-service는 8080 포트로 노출합니다.
* b-service는 외부에 노출될 필요가 없으므로 별도로 포트를 매칭하지 않습니다.

```yml
version: '3.8'
services:
  a-service:
    container_name: a-service
    build: ./a-service
    ports:
      - '8080:8080'
  b-service:
    container_name: b-service
    build: ./b-service
```

#### 3.3.4. 서비스 실행

* `docker-compose up` 명령어로 서비스를 실행합니다.
    * docker-compose.yml 파일이 위치한 디렉토리에서 실행합니다.
    * `--build` 옵션 - 매번 이미지를 새로 빌드합니다.

```
$  docker-compose up --build
Creating network "2022-06-27-spring-cloud-sleuth_default" with the default driver
Building a-service
[+] Building 230.1s (15/15) FINISHED
 => [internal] load build definition from Dockerfile                                                                                              0.0s
 => => transferring dockerfile: 37B                                                                                                               0.0s
 => [internal] load .dockerignore                                                                                                                 0.0s
 => => transferring context: 2B                                                                                                                   0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                     1.2s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                             1.1s
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:35d9b4c76cece0781cec2a0cd92a11694d7af01adb758779266d8cf1173a34e0           0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:72816c4c23395f37a31b3637cabb62a290cb9063e7fbcec492ceec56efd5548d       0.0s
 => [internal] load build context                                                                                                                 0.0s
 => => transferring context: 3.04kB                                                                                                               0.0s
 => CACHED [maven_build 2/6] WORKDIR /build                                                                                                       0.0s
 => [maven_build 3/6] COPY pom.xml .                                                                                                              0.0s
 => [maven_build 4/6] RUN mvn dependency:go-offline                                                                                             221.3s
 => [maven_build 5/6] COPY src ./src                                                                                                              0.0s
 => [maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                                      7.1s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                             0.0s
 => [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                           0.0s
 => exporting to image                                                                                                                            0.1s
 => => exporting layers                                                                                                                           0.1s
 => => writing image sha256:50282c8a353adda8208fd21e7837aafb9cc92c69c923fef38d67f20d3bf4a721                                                      0.0s
 => => naming to docker.io/library/2022-06-27-spring-cloud-sleuth_a-service                                                                       0.0s
Building b-service
[+] Building 228.7s (17/17) FINISHED
 => [internal] load build definition from Dockerfile                                                                                              0.0s
 => => transferring dockerfile: 37B                                                                                                               0.0s
 => [internal] load .dockerignore                                                                                                                 0.0s
 => => transferring context: 2B                                                                                                                   0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                     2.5s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                             2.5s
 => [auth] library/openjdk:pull token for registry-1.docker.io                                                                                    0.0s
 => [auth] library/maven:pull token for registry-1.docker.io                                                                                      0.0s
 => [internal] load build context                                                                                                                 0.0s
 => => transferring context: 3.00kB                                                                                                               0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:72816c4c23395f37a31b3637cabb62a290cb9063e7fbcec492ceec56efd5548d       0.0s
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:35d9b4c76cece0781cec2a0cd92a11694d7af01adb758779266d8cf1173a34e0           0.0s
 => CACHED [maven_build 2/6] WORKDIR /build                                                                                                       0.0s
 => [maven_build 3/6] COPY pom.xml .                                                                                                              0.0s
 => [maven_build 4/6] RUN mvn dependency:go-offline                                                                                             218.6s
 => [maven_build 5/6] COPY src ./src                                                                                                              0.0s
 => [maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                                      7.1s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                             0.0s
 => [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                           0.1s
 => exporting to image                                                                                                                            0.1s
 => => exporting layers                                                                                                                           0.1s
 => => writing image sha256:5fd16ee8844f7e8c2dca3c2417ddecf2d8a612fb7bb7ca830ef7ae0d5486f88f                                                      0.0s
 => => naming to docker.io/library/2022-06-27-spring-cloud-sleuth_b-service                                                                       0.0s
Creating a-service ... done
Creating b-service ... done
Attaching to b-service, a-service
b-service    | 
b-service    |   .   ____          _            __ _ _
b-service    |  /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
b-service    | ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
b-service    |  \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
b-service    |   '  |____| .__|_| |_|_| |_\__, | / / / /
b-service    |  =========|_|==============|___/=/_/_/_/
b-service    |  :: Spring Boot ::                (v2.7.1)
b-service    | 
a-service    | 
a-service    |   .   ____          _            __ _ _
a-service    |  /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
a-service    | ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
a-service    |  \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
a-service    |   '  |____| .__|_| |_|_| |_\__, | / / / /
a-service    |  =========|_|==============|___/=/_/_/_/
a-service    |  :: Spring Boot ::                (v2.7.1)
a-service    | 
```

#### 3.3.5. cURL 서비스 호출

* 두 개의 터미널을 통해 a-service를 호출합니다.
    * 한 터미널에서는 파라미터 값을 `allow`로 전달합니다.
    * 다른 터미널에서는 파라미터 값을 `deny`로 전달합니다.

```
$ curl "http://localhost:8080?key=allow"

$ curl "http://localhost:8080?key=deny"
{"timestamp":"2022-06-27T08:04:32.337+00:00","status":500,"error":"Internal Server Error","path":"/"}%
```

#### 3.3.6. Spring Cloud Sleuth 미적용 시 로그

* Spring Cloud Sleuth 미적용 시 a-service, b-service의 로그입니다.
* 어떤 요청인 경우에 예외가 발생했는지 추적이 어렵습니다.
* 서비스 사이에서 발생하는 API 호출의 연결 고리 파악이 쉽지 않습니다.

```
a-service    | 
a-service    |   .   ____          _            __ _ _
a-service    |  /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
a-service    | ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
a-service    |  \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
a-service    |   '  |____| .__|_| |_|_| |_\__, | / / / /
a-service    |  =========|_|==============|___/=/_/_/_/
a-service    |  :: Spring Boot ::                (v2.7.1)
a-service    | 
b-service    | 
b-service    |   .   ____          _            __ _ _
b-service    |  /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
b-service    | ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
b-service    |  \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
b-service    |   '  |____| .__|_| |_|_| |_\__, | / / / /
b-service    |  =========|_|==============|___/=/_/_/_/
b-service    |  :: Spring Boot ::                (v2.7.1)
b-service    | 
a-service    | 2022-06-27 08:12:23.920  INFO 1 --- [           main] action.in.blog.AServiceApplication       : Starting AServiceApplication v0.0.1-SNAPSHOT using Java 11.0.15 on 415d2a554888 with PID 1 (/app/app.jar started by root in /app)
a-service    | 2022-06-27 08:12:23.922  INFO 1 --- [           main] action.in.blog.AServiceApplication       : No active profile set, falling back to 1 default profile: "default"
b-service    | 2022-06-27 08:12:24.014  INFO 1 --- [           main] action.in.blog.BServiceApplication       : Starting BServiceApplication v0.0.1-SNAPSHOT using Java 11.0.15 on c1f9c6ba61fd with PID 1 (/app/app.jar started by root in /app)
b-service    | 2022-06-27 08:12:24.017  INFO 1 --- [           main] action.in.blog.BServiceApplication       : No active profile set, falling back to 1 default profile: "default"
a-service    | 2022-06-27 08:12:24.893  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
a-service    | 2022-06-27 08:12:24.906  INFO 1 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
a-service    | 2022-06-27 08:12:24.906  INFO 1 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.64]
a-service    | 2022-06-27 08:12:24.983  INFO 1 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
a-service    | 2022-06-27 08:12:24.983  INFO 1 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 1006 ms
b-service    | 2022-06-27 08:12:24.991  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8081 (http)
b-service    | 2022-06-27 08:12:25.002  INFO 1 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
b-service    | 2022-06-27 08:12:25.002  INFO 1 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.64]
b-service    | 2022-06-27 08:12:25.089  INFO 1 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
b-service    | 2022-06-27 08:12:25.089  INFO 1 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 1017 ms
a-service    | 2022-06-27 08:12:25.354  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
a-service    | 2022-06-27 08:12:25.364  INFO 1 --- [           main] action.in.blog.AServiceApplication       : Started AServiceApplication in 1.956 seconds (JVM running for 2.342)
b-service    | 2022-06-27 08:12:25.425  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8081 (http) with context path ''
b-service    | 2022-06-27 08:12:25.435  INFO 1 --- [           main] action.in.blog.BServiceApplication       : Started BServiceApplication in 2.028 seconds (JVM running for 2.418)
a-service    | 2022-06-27 08:12:29.029  INFO 1 --- [nio-8080-exec-1] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring DispatcherServlet 'dispatcherServlet'
a-service    | 2022-06-27 08:12:29.030  INFO 1 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : Initializing Servlet 'dispatcherServlet'
a-service    | 2022-06-27 08:12:29.031  INFO 1 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : Completed initialization in 1 ms
a-service    | 2022-06-27 08:12:29.087  INFO 1 --- [nio-8080-exec-1] action.in.blog.controller.AController    : header: {host=localhost:8080, user-agent=curl/7.79.1, accept=*/*}, key: allow
a-service    | 2022-06-27 08:12:29.087  INFO 1 --- [nio-8080-exec-1] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:12:29.640  INFO 1 --- [nio-8080-exec-2] action.in.blog.controller.AController    : header: {host=localhost:8080, user-agent=curl/7.79.1, accept=*/*}, key: deny
a-service    | 2022-06-27 08:12:29.640  INFO 1 --- [nio-8080-exec-2] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:12:30.087  INFO 1 --- [nio-8080-exec-1] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:12:30.641  INFO 1 --- [nio-8080-exec-2] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:12:31.088  INFO 1 --- [nio-8080-exec-1] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:12:31.642  INFO 1 --- [nio-8080-exec-2] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:12:32.088  INFO 1 --- [nio-8080-exec-1] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:12:32.644  INFO 1 --- [nio-8080-exec-2] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:12:33.089  INFO 1 --- [nio-8080-exec-1] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:12:33.644  INFO 1 --- [nio-8080-exec-2] action.in.blog.controller.AController    : processing...
b-service    | 2022-06-27 08:12:34.161  INFO 1 --- [nio-8081-exec-1] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring DispatcherServlet 'dispatcherServlet'
b-service    | 2022-06-27 08:12:34.161  INFO 1 --- [nio-8081-exec-1] o.s.web.servlet.DispatcherServlet        : Initializing Servlet 'dispatcherServlet'
b-service    | 2022-06-27 08:12:34.163  INFO 1 --- [nio-8081-exec-1] o.s.web.servlet.DispatcherServlet        : Completed initialization in 1 ms
b-service    | 2022-06-27 08:12:34.200  INFO 1 --- [nio-8081-exec-1] action.in.blog.controller.BController    : header: {accept=text/plain, application/json, application/*+json, */*, user-agent=Java/11.0.15, host=b-service:8081, connection=keep-alive}, key: allow
b-service    | 2022-06-27 08:12:34.200  INFO 1 --- [nio-8081-exec-1] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:12:34.649  INFO 1 --- [nio-8081-exec-2] action.in.blog.controller.BController    : header: {accept=text/plain, application/json, application/*+json, */*, user-agent=Java/11.0.15, host=b-service:8081, connection=keep-alive}, key: deny
b-service    | 2022-06-27 08:12:34.649  INFO 1 --- [nio-8081-exec-2] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:12:35.201  INFO 1 --- [nio-8081-exec-1] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:12:35.650  INFO 1 --- [nio-8081-exec-2] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:12:36.202  INFO 1 --- [nio-8081-exec-1] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:12:36.650  INFO 1 --- [nio-8081-exec-2] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:12:37.202  INFO 1 --- [nio-8081-exec-1] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:12:37.651  INFO 1 --- [nio-8081-exec-2] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:12:38.203  INFO 1 --- [nio-8081-exec-1] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:12:38.652  INFO 1 --- [nio-8081-exec-2] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:12:39.662 ERROR 1 --- [nio-8081-exec-2] o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed; nested exception is java.lang.RuntimeException: throw error] with root cause
b-service    | 
b-service    | java.lang.RuntimeException: throw error
b-service    |  at action.in.blog.controller.BController.throwException(BController.java:27) ~[classes!/:0.0.1-SNAPSHOT]
b-service    |  at action.in.blog.controller.BController.index(BController.java:38) ~[classes!/:0.0.1-SNAPSHOT]
b-service    |  at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[na:na]
b-service    |  at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62) ~[na:na]
b-service    |  at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43) ~[na:na]
b-service    |  at java.base/java.lang.reflect.Method.invoke(Method.java:566) ~[na:na]
b-service    |  at org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:205) ~[spring-web-5.3.21.jar!/:5.3.21]
b-service    |  at org.springframework.web.method.support.InvocableHandlerMethod.invokeForRequest(InvocableHandlerMethod.java:150) ~[spring-web-5.3.21.jar!/:5.3.21]
b-service    |  at org.springframework.web.servlet.mvc.method.annotation.ServletInvocableHandlerMethod.invokeAndHandle(ServletInvocableHandlerMethod.java:117) ~[spring-webmvc-5.3.21.jar!/:5.3.21]
b-service    |  at org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter.invokeHandlerMethod(RequestMappingHandlerAdapter.java:895) ~[spring-webmvc-5.3.21.jar!/:5.3.21]
b-service    |  ...
b-service    | 
a-service    | 2022-06-27 08:12:39.715 ERROR 1 --- [nio-8080-exec-2] o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed; nested exception is org.springframework.web.client.HttpServerErrorException$InternalServerError: 500 : "{"timestamp":"2022-06-27T08:12:39.669+00:00","status":500,"error":"Internal Server Error","path":"/"}"] with root cause
a-service    | 
a-service    | org.springframework.web.client.HttpServerErrorException$InternalServerError: 500 : "{"timestamp":"2022-06-27T08:12:39.669+00:00","status":500,"error":"Internal Server Error","path":"/"}"
a-service    |  at org.springframework.web.client.HttpServerErrorException.create(HttpServerErrorException.java:100) ~[spring-web-5.3.21.jar!/:5.3.21]
a-service    |  at org.springframework.web.client.DefaultResponseErrorHandler.handleError(DefaultResponseErrorHandler.java:170) ~[spring-web-5.3.21.jar!/:5.3.21]
a-service    |  at org.springframework.web.client.DefaultResponseErrorHandler.handleError(DefaultResponseErrorHandler.java:122) ~[spring-web-5.3.21.jar!/:5.3.21]
a-service    |  at org.springframework.web.client.ResponseErrorHandler.handleError(ResponseErrorHandler.java:63) ~[spring-web-5.3.21.jar!/:5.3.21]
a-service    |  at org.springframework.web.client.RestTemplate.handleResponse(RestTemplate.java:819) ~[spring-web-5.3.21.jar!/:5.3.21]
a-service    |  at org.springframework.web.client.RestTemplate.doExecute(RestTemplate.java:777) ~[spring-web-5.3.21.jar!/:5.3.21]
a-service    |  at org.springframework.web.client.RestTemplate.execute(RestTemplate.java:711) ~[spring-web-5.3.21.jar!/:5.3.21]
a-service    |  at org.springframework.web.client.RestTemplate.getForObject(RestTemplate.java:334) ~[spring-web-5.3.21.jar!/:5.3.21]
a-service    |  at action.in.blog.controller.AController.index(AController.java:41) ~[classes!/:0.0.1-SNAPSHOT]
a-service    |  at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[na:na]
a-service    |  ...
```

#### 3.3.4. Spring Cloud Sleuth 적용

##### pom.xml

* 다음과 같은 의존성을 추가하면 `Spring Cloud Sleuth`가 자동으로 적용됩니다.

```xml
    <dependencies>
        ...
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-sleuth</artifactId>
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

##### 어플리케이션 로그

* 적용 후 어플리케이션 로그를 살펴보면 다음과 같은 정보가 추가됩니다.
    * [APPLICATION_NAME, TRACE_ID, SPAN_ID]
    * ex) [a-service,a8c3719def75eb27,a8c3719def75eb27]
* `b-service`에서 확인된 에러 로그의 `TRACE_ID`인 `59447c50de81e252`로 요청 정보를 추적합니다. 
* `a-service`의 어떤 요청이 해당 예외를 유발시켰는지 쉽게 확인이 가능합니다.  

```
b-service    | 
b-service    |   .   ____          _            __ _ _
b-service    |  /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
b-service    | ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
b-service    |  \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
b-service    |   '  |____| .__|_| |_|_| |_\__, | / / / /
b-service    |  =========|_|==============|___/=/_/_/_/
b-service    |  :: Spring Boot ::                (v2.7.1)
b-service    | 
a-service    | 
a-service    |   .   ____          _            __ _ _
a-service    |  /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
a-service    | ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
a-service    |  \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
a-service    |   '  |____| .__|_| |_|_| |_\__, | / / / /
a-service    |  =========|_|==============|___/=/_/_/_/
a-service    |  :: Spring Boot ::                (v2.7.1)
a-service    | 
b-service    | 2022-06-27 08:19:34.981  INFO [b-service,,] 1 --- [           main] action.in.blog.BServiceApplication       : Starting BServiceApplication v0.0.1-SNAPSHOT using Java 11.0.15 on 81a7981709e3 with PID 1 (/app/app.jar started by root in /app)
b-service    | 2022-06-27 08:19:34.984  INFO [b-service,,] 1 --- [           main] action.in.blog.BServiceApplication       : No active profile set, falling back to 1 default profile: "default"
a-service    | 2022-06-27 08:19:35.045  INFO [a-service,,] 1 --- [           main] action.in.blog.AServiceApplication       : Starting AServiceApplication v0.0.1-SNAPSHOT using Java 11.0.15 on 4cff3c34052e with PID 1 (/app/app.jar started by root in /app)
a-service    | 2022-06-27 08:19:35.048  INFO [a-service,,] 1 --- [           main] action.in.blog.AServiceApplication       : No active profile set, falling back to 1 default profile: "default"
b-service    | 2022-06-27 08:19:35.802  INFO [b-service,,] 1 --- [           main] o.s.cloud.context.scope.GenericScope     : BeanFactory id=ecc11721-3014-3c26-9b7e-557ffb30cefc
a-service    | 2022-06-27 08:19:35.887  INFO [a-service,,] 1 --- [           main] o.s.cloud.context.scope.GenericScope     : BeanFactory id=811c3f2d-6b23-3962-88a9-2326a6e70bdd
b-service    | 2022-06-27 08:19:36.336  INFO [b-service,,] 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8081 (http)
b-service    | 2022-06-27 08:19:36.347  INFO [b-service,,] 1 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
b-service    | 2022-06-27 08:19:36.347  INFO [b-service,,] 1 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.64]
b-service    | 2022-06-27 08:19:36.413  INFO [b-service,,] 1 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
b-service    | 2022-06-27 08:19:36.413  INFO [b-service,,] 1 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 1361 ms
a-service    | 2022-06-27 08:19:36.419  INFO [a-service,,] 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
a-service    | 2022-06-27 08:19:36.430  INFO [a-service,,] 1 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
a-service    | 2022-06-27 08:19:36.430  INFO [a-service,,] 1 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.64]
a-service    | 2022-06-27 08:19:36.497  INFO [a-service,,] 1 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
a-service    | 2022-06-27 08:19:36.497  INFO [a-service,,] 1 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 1377 ms
b-service    | 2022-06-27 08:19:37.407  INFO [b-service,,] 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8081 (http) with context path ''
b-service    | 2022-06-27 08:19:37.420  INFO [b-service,,] 1 --- [           main] action.in.blog.BServiceApplication       : Started BServiceApplication in 2.977 seconds (JVM running for 3.414)
a-service    | 2022-06-27 08:19:37.504  INFO [a-service,,] 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
a-service    | 2022-06-27 08:19:37.518  INFO [a-service,,] 1 --- [           main] action.in.blog.AServiceApplication       : Started AServiceApplication in 3.035 seconds (JVM running for 3.479)
a-service    | 2022-06-27 08:20:09.569  INFO [a-service,a8c3719def75eb27,a8c3719def75eb27] 1 --- [nio-8080-exec-1] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring DispatcherServlet 'dispatcherServlet'
a-service    | 2022-06-27 08:20:09.569  INFO [a-service,a8c3719def75eb27,a8c3719def75eb27] 1 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : Initializing Servlet 'dispatcherServlet'
a-service    | 2022-06-27 08:20:09.571  INFO [a-service,a8c3719def75eb27,a8c3719def75eb27] 1 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : Completed initialization in 2 ms
a-service    | 2022-06-27 08:20:09.612  INFO [a-service,a8c3719def75eb27,a8c3719def75eb27] 1 --- [nio-8080-exec-1] action.in.blog.controller.AController    : header: {host=localhost:8080, user-agent=curl/7.79.1, accept=*/*}, key: allow
a-service    | 2022-06-27 08:20:09.612  INFO [a-service,a8c3719def75eb27,a8c3719def75eb27] 1 --- [nio-8080-exec-1] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:20:09.992  INFO [a-service,59447c50de81e252,59447c50de81e252] 1 --- [nio-8080-exec-2] action.in.blog.controller.AController    : header: {host=localhost:8080, user-agent=curl/7.79.1, accept=*/*}, key: deny
a-service    | 2022-06-27 08:20:09.992  INFO [a-service,59447c50de81e252,59447c50de81e252] 1 --- [nio-8080-exec-2] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:20:10.613  INFO [a-service,a8c3719def75eb27,a8c3719def75eb27] 1 --- [nio-8080-exec-1] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:20:10.992  INFO [a-service,59447c50de81e252,59447c50de81e252] 1 --- [nio-8080-exec-2] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:20:11.613  INFO [a-service,a8c3719def75eb27,a8c3719def75eb27] 1 --- [nio-8080-exec-1] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:20:11.993  INFO [a-service,59447c50de81e252,59447c50de81e252] 1 --- [nio-8080-exec-2] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:20:12.614  INFO [a-service,a8c3719def75eb27,a8c3719def75eb27] 1 --- [nio-8080-exec-1] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:20:12.994  INFO [a-service,59447c50de81e252,59447c50de81e252] 1 --- [nio-8080-exec-2] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:20:13.616  INFO [a-service,a8c3719def75eb27,a8c3719def75eb27] 1 --- [nio-8080-exec-1] action.in.blog.controller.AController    : processing...
a-service    | 2022-06-27 08:20:13.995  INFO [a-service,59447c50de81e252,59447c50de81e252] 1 --- [nio-8080-exec-2] action.in.blog.controller.AController    : processing...
b-service    | 2022-06-27 08:20:14.736  INFO [b-service,a8c3719def75eb27,4248dac991ff2062] 1 --- [nio-8081-exec-1] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring DispatcherServlet 'dispatcherServlet'
b-service    | 2022-06-27 08:20:14.737  INFO [b-service,a8c3719def75eb27,4248dac991ff2062] 1 --- [nio-8081-exec-1] o.s.web.servlet.DispatcherServlet        : Initializing Servlet 'dispatcherServlet'
b-service    | 2022-06-27 08:20:14.739  INFO [b-service,a8c3719def75eb27,4248dac991ff2062] 1 --- [nio-8081-exec-1] o.s.web.servlet.DispatcherServlet        : Completed initialization in 2 ms
b-service    | 2022-06-27 08:20:14.777  INFO [b-service,a8c3719def75eb27,4248dac991ff2062] 1 --- [nio-8081-exec-1] action.in.blog.controller.BController    : header: {accept=text/plain, application/json, application/*+json, */*, x-b3-traceid=a8c3719def75eb27, x-b3-spanid=4248dac991ff2062, x-b3-parentspanid=a8c3719def75eb27, x-b3-sampled=0, user-agent=Java/11.0.15, host=b-service:8081, connection=keep-alive}, key: allow
b-service    | 2022-06-27 08:20:14.777  INFO [b-service,a8c3719def75eb27,4248dac991ff2062] 1 --- [nio-8081-exec-1] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:20:15.000  INFO [b-service,59447c50de81e252,e80b00875dcbca39] 1 --- [nio-8081-exec-2] action.in.blog.controller.BController    : header: {accept=text/plain, application/json, application/*+json, */*, x-b3-traceid=59447c50de81e252, x-b3-spanid=e80b00875dcbca39, x-b3-parentspanid=59447c50de81e252, x-b3-sampled=0, user-agent=Java/11.0.15, host=b-service:8081, connection=keep-alive}, key: deny
b-service    | 2022-06-27 08:20:15.000  INFO [b-service,59447c50de81e252,e80b00875dcbca39] 1 --- [nio-8081-exec-2] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:20:15.778  INFO [b-service,a8c3719def75eb27,4248dac991ff2062] 1 --- [nio-8081-exec-1] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:20:15.980  INFO [b-service,59447c50de81e252,e80b00875dcbca39] 1 --- [nio-8081-exec-2] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:20:16.758  INFO [b-service,a8c3719def75eb27,4248dac991ff2062] 1 --- [nio-8081-exec-1] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:20:16.981  INFO [b-service,59447c50de81e252,e80b00875dcbca39] 1 --- [nio-8081-exec-2] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:20:17.759  INFO [b-service,a8c3719def75eb27,4248dac991ff2062] 1 --- [nio-8081-exec-1] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:20:17.981  INFO [b-service,59447c50de81e252,e80b00875dcbca39] 1 --- [nio-8081-exec-2] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:20:18.759  INFO [b-service,a8c3719def75eb27,4248dac991ff2062] 1 --- [nio-8081-exec-1] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:20:18.982  INFO [b-service,59447c50de81e252,e80b00875dcbca39] 1 --- [nio-8081-exec-2] action.in.blog.controller.BController    : processing...
b-service    | 2022-06-27 08:20:19.989 ERROR [b-service,59447c50de81e252,e80b00875dcbca39] 1 --- [nio-8081-exec-2] o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed; nested exception is java.lang.RuntimeException: throw error] with root cause
b-service    | 
b-service    | java.lang.RuntimeException: throw error
b-service    |  at action.in.blog.controller.BController.throwException(BController.java:27) ~[classes!/:0.0.1-SNAPSHOT]
b-service    |  at action.in.blog.controller.BController.index(BController.java:38) ~[classes!/:0.0.1-SNAPSHOT]
b-service    |  at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[na:na]
b-service    |  at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62) ~[na:na]
b-service    |  at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43) ~[na:na]
b-service    |  at java.base/java.lang.reflect.Method.invoke(Method.java:566) ~[na:na]
b-service    |  ...
b-service    | 
a-service    | 2022-06-27 08:20:20.046 ERROR [a-service,59447c50de81e252,59447c50de81e252] 1 --- [nio-8080-exec-2] o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed; nested exception is org.springframework.web.client.HttpServerErrorException$InternalServerError: 500 : "{"timestamp":"2022-06-27T08:20:19.997+00:00","status":500,"error":"Internal Server Error","path":"/"}"] with root cause
a-service    | 
a-service    | org.springframework.web.client.HttpServerErrorException$InternalServerError: 500 : "{"timestamp":"2022-06-27T08:20:19.997+00:00","status":500,"error":"Internal Server Error","path":"/"}"
a-service    |  at org.springframework.web.client.HttpServerErrorException.create(HttpServerErrorException.java:100) ~[spring-web-5.3.21.jar!/:5.3.21]
a-service    |  at org.springframework.web.client.DefaultResponseErrorHandler.handleError(DefaultResponseErrorHandler.java:170) ~[spring-web-5.3.21.jar!/:5.3.21]
a-service    |  at org.springframework.web.client.DefaultResponseErrorHandler.handleError(DefaultResponseErrorHandler.java:122) ~[spring-web-5.3.21.jar!/:5.3.21]
a-service    |  at org.springframework.web.client.ResponseErrorHandler.handleError(ResponseErrorHandler.java:63) ~[spring-web-5.3.21.jar!/:5.3.21]
a-service    |  at org.springframework.web.client.RestTemplate.handleResponse(RestTemplate.java:819) ~[spring-web-5.3.21.jar!/:5.3.21]
a-service    |  at org.springframework.web.client.RestTemplate.doExecute(RestTemplate.java:777) ~[spring-web-5.3.21.jar!/:5.3.21]
a-service    |  at org.springframework.web.client.RestTemplate.execute(RestTemplate.java:711) ~[spring-web-5.3.21.jar!/:5.3.21]
a-service    |  at org.springframework.web.client.RestTemplate.getForObject(RestTemplate.java:334) ~[spring-web-5.3.21.jar!/:5.3.21]
a-service    |  at action.in.blog.controller.AController.index(AController.java:41) ~[classes!/:0.0.1-SNAPSHOT]
a-service    |  ...
```

## CLOSE

`Spring Cloud Sleuth`는 마이크로 서비스 아키텍처 같은 분산 시스템의 로그 추적성을 향상시키기 위한 라이브러리입니다. 
더불어 특정 요청을 쉽게 필터링하여 조회할 수 있다는 관점에서 모놀리식 서비스에서 사용해도 큰 이점이 있을 것 같습니다. 
시간이 된다면 `log4j2.xml` 파일의 로그 레이아웃(layout)을 변경하여 좀 더 보기 쉬운 로그를 구성하는 방법에 대해 정리해보겠습니다.

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-06-27-spring-cloud-sleuth>

#### REFERENCE

* <https://docs.spring.io/spring-cloud-sleuth/docs/current/reference/html/getting-started.html#getting-started-terminology>