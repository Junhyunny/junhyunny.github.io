---
title: "Spring Cloud Openfeign"
search: false
category:
  - spring-boot
  - spring-cloud
last_modified_at: 2021-08-22T20:30:00
---

<br>

⚠️ 해당 포스트는 2021년 8월22일에 재작성되었습니다.(불필요 코드 제거)

> Spring Cloud Openfeign API Reference<br>
> Feign is a declarative web service client. It makes writing web service clients easier.

Micro Service Architecture를 지원하는 Spring Cloud 프로젝트 중 하나입니다. 
서비스들간에 보다 쉬운 API 요청을 지원하는 라이브러리입니다. 
Eureka 서비스와 함께 동작한다면 별도의 URL 없이도 클러스터(cluster)를 형성하는 서비스들로 API 요청이 가능합니다. 
우선 이번 포스트에서는 간단한 테스트를 통해 Openfiegn 사용법에 대해 알아보도록 하겠습니다. 

## 1. 테스트 시나리오
- action-in-blog 서비스에서 action-in-blog 서비스의 /api/cors/health 경로로 API 요청
- SimpleClient는 테스트 패키지에 존재하며 JUnit 테스트를 통해 API 요청 수행

<p align="center"><img src="/images/spring-cloud-openfeign-1.JPG" width="45%"></p>

## 2. 예제 코드

### 2.1. pom.xml 의존성(dependency) 추가
- spring-cloud-starter-openfeign 의존성을 추가합니다.

```xml
      <dependency>
          <groupId>org.springframework.cloud</groupId>
          <artifactId>spring-cloud-starter-openfeign</artifactId>
          <version>2.2.7.RELEASE</version>
      </dependency>
```

### 2.2. HealthController 클래스
- Feign Client 요청을 받아줄 컨트롤러(controller) 클래스를 하나 만듭니다.

```java
package blog.in.action.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/health")
    public String health() {
        return "health";
    }
}
```

### 2.3. @EnableFeignClients 애너테이션
- FeignClient를 사용하기 위해 main 메소드가 작성된 클래스 위에 @EnableFeignClients 애너테이션을 선언합니다.

```java
package blog.in.action;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@EnableFeignClients
@SpringBootApplication
public class ActionInBlogApplication {

    public static void main(String[] args) {
        SpringApplication.run(ActionInBlogApplication.class, args);
    }

}
```

### 2.4. FeignClient 만들기
- name은 필수입니다. name이 지정되어 있지 않다면 에러가 발생합니다.
- 요청을 받아줄 url을 지정합니다.
- 메소드를 하나 만들고 그 위에 어떤 HTTP 메소드, 어느 경로로 API 요청을 수행할지 정의된 애너테이션을 추가합니다.

```java
@FeignClient(name = "simple-client", url = "http://localhost:8080")
interface SimpleClient {

    @GetMapping(path = "/health")
    String health();
}
```

## 3. 테스트 코드

```java
package blog.in.action.openfeign.simple;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "simple-client", url = "http://localhost:8080")
interface SimpleClient {

    @GetMapping(path = "/health")
    String health();
}

@Log4j2
@SpringBootTest
public class SimpleClientTest {

    @Autowired
    private SimpleClient simpleClient;

    @Test
    public void test() {
        try {
            String response = simpleClient.health();
            log.info("response from simpleClient: " + response);
        } catch (Exception e) {
            log.error("error while using feignclient", e);
        }
    }
}
```

### 3.1. action-in-blog 서비스 기동
- JUnit 테스트 실행 전에 API 요청을 받아줄 action-in-blog 서비스를 기동합니다.

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::        (v2.2.7.RELEASE)

2021-08-22 20:14:51.486  INFO 21392 --- [           main] blog.in.action.ActionInBlogApplication   : No active profile set, falling back to default profiles: default
2021-08-22 20:14:51.781  INFO 21392 --- [           main] o.s.cloud.context.scope.GenericScope     : BeanFactory id=5d603a03-c38b-3ad5-9c8b-aa98b5432c8a
2021-08-22 20:14:51.970  INFO 21392 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2021-08-22 20:14:51.970  INFO 21392 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2021-08-22 20:14:51.970  INFO 21392 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.34]
2021-08-22 20:14:52.058  INFO 21392 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
2021-08-22 20:14:52.058  INFO 21392 --- [           main] o.s.web.context.ContextLoader            : Root WebApplicationContext: initialization completed in 560 ms
2021-08-22 20:14:52.096  WARN 21392 --- [           main] o.s.c.n.a.ArchaiusAutoConfiguration      : No spring.application.name found, defaulting to 'application'
2021-08-22 20:14:52.096  WARN 21392 --- [           main] c.n.c.sources.URLConfigurationSource     : No URLs will be polled as dynamic configuration sources.
2021-08-22 20:14:52.096  INFO 21392 --- [           main] c.n.c.sources.URLConfigurationSource     : To enable URLs as dynamic configuration sources, define System property archaius.configurationSource.additionalUrls or make config.properties available on classpath.
2021-08-22 20:14:52.096  WARN 21392 --- [           main] c.n.c.sources.URLConfigurationSource     : No URLs will be polled as dynamic configuration sources.
2021-08-22 20:14:52.096  INFO 21392 --- [           main] c.n.c.sources.URLConfigurationSource     : To enable URLs as dynamic configuration sources, define System property archaius.configurationSource.additionalUrls or make config.properties available on classpath.
2021-08-22 20:14:52.196  INFO 21392 --- [           main] o.s.s.concurrent.ThreadPoolTaskExecutor  : Initializing ExecutorService 'applicationTaskExecutor'
2021-08-22 20:14:52.599  INFO 21392 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2021-08-22 20:14:52.861  INFO 21392 --- [           main] blog.in.action.ActionInBlogApplication   : Started ActionInBlogApplication in 2.64 seconds (JVM running for 3.487)
```

### 3.2. 테스트 수행 로그
- JUnit 테스트를 수행하여 API 응답을 로그로 확인합니다.
- "health" 응답을 통해 정상적으로 API 요청이 수행되었음을 알 수 있습니다. 

```
2021-08-22 20:16:25.502  INFO 8312 --- [           main] b.i.a.openfeign.simple.SimpleClientTest  : response from simpleClient: health
```

## CLOSING
FeignClient는 JpaRepository 인터페이스를 처음 접하였을 때처럼 매우 신선한 충격을 주었습니다. 
옛 코드들을 살펴보면 유틸리티(Utility)성 클래스에서 HttpURLConnection, I/O Stream 등을 사용하여 매우 길고 불편하게 API 요청을 수행합니다. 
이와 반대로 FeignClient은 인터페이스와 몇 개의 애너테이션을 통해 개발자가 매우 쉽게 API 요청을 수행할 수 있도록 도와줍니다. 

무엇보다 FeignClient는 Service Registration, Discovery 기능을 제공하는 Eureka 서비스와 함께 사용될 때 더 빛을 바랍니다. 
다음 포스트는 Eureka 서비스를 구축하여 서비스 등록과 서비스 이름을 이용한 FeignClient API 요청을 주제로 글을 작성하도록 하겠습니다.

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-03-04-spring-cloud-openfeign>

#### REFERENCE
- <https://woowabros.github.io/experience/2019/05/29/feign.html>
- <https://supawer0728.github.io/2018/03/11/Spring-Cloud-Feign/>
