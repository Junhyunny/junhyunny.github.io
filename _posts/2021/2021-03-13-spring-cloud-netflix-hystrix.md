---
title: "스프링 클라우드 넷플릭스 히스트릭스(Spring Cloud Netflix Hystrix)"
search: false
category:
  - spring-boot
  - spring-cloud
  - msa
  - junit
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [마이크로서비스 아키텍처][microservice-architecture-link]
- [스프링 클라우드(spring cloud) OpenFeign][spring-cloud-openfeign-link]
- [서킷 브레이커 패턴(Circuit Breaker Pattern)][circuitbreaker-link]

## 1. Netflix Hystrix

마이크로서비스 아키텍처(microservice architecture)를 성공적으로 구축한 넷플릭스(netflix)가 제공하는 OSS(open source software)이다. `Hystrix` 컴포넌트는 애너테이션과 설정만으로 손쉽게 회로 차단기(circuit breaker) 패턴을 적용할 수 있다. 서비스 사이에 전파되는 장애를 차단하여 서비스 일부가 망가지더라도 시스템은 정상적 혹은 부분적으로 운영할 수 있도록 돕는다.

## 2. Practice

`FeignClient`와 함께 연동한 실습을 수행하였다. `FeignClient` 내부엔 다음과 같은 의존성이 존재하여 별도로 `Hystrix` 컴포넌트에 대한 의존성을 추가하지 않아도 된다.

```xml
    <dependency>
        <groupId>io.github.openfeign</groupId>
        <artifactId>feign-hystrix</artifactId>
        <version>10.10.1</version>
        <scope>compile</scope>
    </dependency>
```

다음과 같은 실습 환경을 구축하였다.

- 클라이언트(client) 역할은 `JUnit` 테스트 코드가 수행한다.
- `서비스A`는 회로 차단기가 적용되어 있다.
- `서비스A`가 `서비스B`로 API 요청을 수행한다.
  - 두 경로로 요청을 수행한다.
  - `/timeout` - `서비스B`는 스레드를 정지시켜 의도적으로 타임아웃(timeout)을 발생시킨다.
  - `/exception` - `서비스B`는 의도적으로 예외를 던진다.
- `서비스A`는 예외를 전달받지만 이를 대체할 응답(fallback plan)을 대신 클라이언트에게 전달한다.
- 클라이언트는 예외 대신 `서비스A`가 전달한 대체 응답을 전달받는다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/spring-cloud-netflix-hystrix-01.png" width="80%" class="image__border">
</div>

### 2.1. Implemantation of Service A

지금부터 살펴보는 코드는 서비스A 프로젝트의 코드다. application YAML 파일에 다음과 같은 설정을 추가한다.

- `feign.hystrix.enabled=true` 설정을 추가한다.
- 타임아웃이 발생하기 쉽게 기다리는 시간을 5초로 설정한다.

```yml
feign:
  hystrix:
    enabled: true
  client:
    config:
      default:
        connect-timeout: 5000
        read-timeout: 5000
```

BlogController 클래스에 테스트를 위한 엔드포인트를 만든다. 요청을 그대로 `서비스B`에게 전달한다.

```java
package cloud.in.action.controller;

import cloud.in.action.proxy.BlogClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BlogController {

    private final BlogClient blogClient;

    public BlogController(BlogClient blogClient) {
        this.blogClient = blogClient;
    }

    @GetMapping(value = "/timeout")
    public String requestWithTimeoutException() {
        return blogClient.requestWithTimeoutException();
    }

    @GetMapping(value = "/exception")
    public String requestWithIntentionalException() {
        return blogClient.requestWithIntentionalException();
    }
}
```

BlogClient 인터페이스에 회로 차단을 위한 폴백(fallback) 기능을 추가한다. `feign.hystrix.*` 패키지에 속한 `FallbackFactory` 클래스를 사용해야 한다. 자세한 내용은 [Incompatible FallbackFactory 인스턴스 예외를 다룬 글][incompatible-fallback-factory-instance-link]을 참조한다.

- `BlogClient`는 `서비스B`에게 API 요청을 수행한다.
- `서비스B`에 문제가 발생하여 회로 차단기가 회로를 열면 대체 응답이 반환된다.
- 대체 응답에 대한 책임은 `BlogClientFallbackFactory`를 통해 생성된 객체에게 위임한다.
- `BlogClientFallbackFactory`는 `BlogClient`에 문제가 생겼을 때를 대비한 `BlogClientFallbackPlan` 객체를 생성한다. `BlogClientFallbackPlan` 클래스는 `BlogClient` 인터페이스를 구현하여 에러 발생 시 각 메서드별 적절한 응답을 반환한다.

```java
package cloud.in.action.proxy;

import feign.hystrix.FallbackFactory;
import lombok.extern.log4j.Log4j2;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(
        name = "blog-client",
        url = "http://b-service:8080",
        fallbackFactory = BlogClientFallbackFactory.class
)
public interface BlogClient {

    @GetMapping(path = "/timeout")
    String requestWithTimeoutException();

    @GetMapping(path = "/exception")
    String requestWithIntentionalException();
}

@Log4j2
@Component
class BlogClientFallbackFactory implements FallbackFactory<BlogClient> {

    @Override
    public BlogClient create(Throwable cause) {
        log.error(cause.getMessage(), cause);
        return new BlogClientFallbackPlan();
    }

    class BlogClientFallbackPlan implements BlogClient {

        @Override
        public String requestWithTimeoutException() {
            return "timeout fallback";
        }

        @Override
        public String requestWithIntentionalException() {
            return "implicit exception fallback";
        }
    }
}
```

### 2.2. Implemantation of Service B

지금부터는 서비스B의 구현 코드다. 테스트를 위해 BlogController 클래스에 엔드포인트를 만든다. 이 컨트롤러는 고의적으로 예외를 발생시킨다.

- `/timeout` 경로는 10초간 스레드를 정지하여 타임아웃 예외를 발생시킨다.
- `/exception` 경로는 일부러 런타임 예외를 발생시킨다.

```java
package cloud.in.action.controller;

import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Log4j2
@RestController
public class BlogController {

    @GetMapping(value = "/timeout")
    public String requestWithTimeoutException() {
        try {
            Thread.sleep(10000);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
        return "no time out occur";
    }

    private boolean implementationException() {
        return true;
    }

    @GetMapping(value = "/exception")
    public String requestWithIntentionalException() {
        if (implementationException()) {
            throw new RuntimeException("exception occur");
        }
        return "no exception occur";
    }
}
```

## 3. Test

도커 컴포즈(docker compose)로 테스트 환경을 구축한다. 도커 컴포즈 YAML 파일은 다음과 같이 정의되어 있다.

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

도커 컨테이너들을 실행한다.

```
$ docker-compose up
...
[+] Running 3/3
 - Network 2021-03-13-spring-cloud-netflix-hystrix_default        Created                         0.0s 
 - Container 2021-03-13-spring-cloud-netflix-hystrix-a-service-1  Created                         0.1s
 - Container 2021-03-13-spring-cloud-netflix-hystrix-b-service-1  Created                         0.1s 
```

이제 모든 준비가 완료됬다. 테스트 코드를 실행해보자. 테스트 코드는 `서비스A` 모듈에 존재한다.

- 테스트에서 타임아웃이 발생하지 않도록 `connectTimeout`, `readTimeout`을 100초씩 설정한다.
- 테스트를 위한 `FeignClient` 사용 시 회로 차단기가 동작하지 않도록 설정한다.

```java
package cloud.in.action;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "test-client", url = "http://localhost:8080")
interface TestClient {

    @GetMapping(path = "/timeout")
    String requestWithTimeoutException();

    @GetMapping(path = "/exception")
    String requestWithIntentionalException();
}

@Log4j2
@SpringBootTest(value = {
        "feign.hystrix.enabled=false",
        "feign.client.config.default.connect-timeout=100000",
        "feign.client.config.default.read-timeout=100000"
})
class AServiceApplicationTests {

    @Autowired
    private TestClient testClient;

    @Test
    void request_api_expect_without_exception() {
        log.info(testClient.requestWithTimeoutException());
        log.info(testClient.requestWithIntentionalException());
    }
}
```

위 테스트 코드를 실행하면 다음과 같은 로그를 확인할 수 있다.

- `서비스A`로 요청한 두 경로 모두 `BlogClientFallbackPlan` 객체에 의해 대체된 응답을 전달받는다.

```
2023-02-16 00:39:10.921  INFO 22208 --- [           main] c.in.action.AServiceApplicationTests     : timeout fallback
2023-02-16 00:39:11.000  INFO 22208 --- [           main] c.in.action.AServiceApplicationTests     : implicit exception fallback
```

서비스A와 서비스B에 출력된 로그를 살펴보자.

- `서비스A`는 `netflix-hystrix-a-service`이다.
- `서비스B`는 `netflix-hystrix-b-service`이다.
- `서비스A`는 `서비스B`의 요청을 기다리다 타임아웃이 발생한다.
  - 해당 예외는 `HystrixTimeoutException`으로 전달된다.
- `서비스B`는 의도적인 예외를 반환한다.
  - 로그 내용 - java.lang.RuntimeException: exception occur
- `서비스A`는 `서비스B`의 예외를 전달받고 관련 로그를 출력한다.
  - 로그 내용 - feign.FeignException$InternalServerError: [500] during [GET] to [http://b-service:8080/exception]
  - 해당 예외 처리 스택을 보면 `Hystrix` 컴포넌트가 상위 메서드에 있음을 알 수 있다.

```
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  | com.netflix.hystrix.exception.HystrixTimeoutException: null
...
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  | 2023-02-15 15:39:10.940 ERROR 1 --- [nio-8080-exec-2] o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed; nested exception is java.lang.RuntimeException: exception occur] with root cause
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  |
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  | java.lang.RuntimeException: exception occur
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  |  at cloud.in.action.controller.BlogController.requestWithIntentionalException(BlogController.java:28) ~[classes!/:0.0.1-SNAPSHOT]
...
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  | 2023-02-15 15:39:10.995 ERROR 1 --- [x-blog-client-2] c.i.a.proxy.BlogClientFallbackFactory    : [500] during [GET] to [http://b-service:8080/exception] [BlogClient#requestWithIntentionalException()]: [{"timestamp":"2023-02-15T15:39:10.948+0000","status":500,"error":"Internal Server Error","message":"exception occur","path":"/exception"}]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  | feign.FeignException$InternalServerError: [500] during [GET] to [http://b-service:8080/exception] [BlogClient#requestWithIntentionalException()]: [{"timestamp":"2023-02-15T15:39:10.948+0000","status":500,"error":"Internal Server Error","message":"exception occur","path":"/exception"}]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at feign.FeignException.serverErrorStatus(FeignException.java:231) ~[feign-core-10.10.1.jar!/:na]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at feign.FeignException.errorStatus(FeignException.java:180) ~[feign-core-10.10.1.jar!/:na]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at feign.FeignException.errorStatus(FeignException.java:169) ~[feign-core-10.10.1.jar!/:na]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at feign.codec.ErrorDecoder$Default.decode(ErrorDecoder.java:92) ~[feign-core-10.10.1.jar!/:na]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at feign.AsyncResponseHandler.handleResponse(AsyncResponseHandler.java:96) ~[feign-core-10.10.1.jar!/:na]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at feign.SynchronousMethodHandler.executeAndDecode(SynchronousMethodHandler.java:138) ~[feign-core-10.10.1.jar!/:na]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at feign.SynchronousMethodHandler.invoke(SynchronousMethodHandler.java:89) ~[feign-core-10.10.1.jar!/:na]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at feign.hystrix.HystrixInvocationHandler$1.run(HystrixInvocationHandler.java:109) ~[feign-hystrix-10.10.1.jar!/:na]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at com.netflix.hystrix.HystrixCommand$2.call(HystrixCommand.java:302) ~[hystrix-core-1.5.18.jar!/:1.5.18]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at com.netflix.hystrix.HystrixCommand$2.call(HystrixCommand.java:298) ~[hystrix-core-1.5.18.jar!/:1.5.18]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at rx.internal.operators.OnSubscribeDefer.call(OnSubscribeDefer.java:46) ~[rxjava-1.3.8.jar!/:1.3.8]
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-03-13-spring-cloud-netflix-hystrix>

#### RECOMMEND NEXT POSTS

- [Incompatible FallbackFactory 인스턴스 예외][incompatible-fallback-factory-instance-link]

#### REFERENCE

- <https://supawer0728.github.io/2018/03/11/Spring-Cloud-Feign/>
- <https://twowinsh87.github.io/etc/2019/01/19/etc-springboot-circuitbreaker/>
- <https://junhyunny.github.io/spring-boot/spring-cloud/msa/design-pattern/msa-circuit-breaker-pattern/>

[microservice-architecture-link]: https://junhyunny.github.io/information/msa/microservice-architecture/
[spring-cloud-openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/
[circuitbreaker-link]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/design-pattern/msa-circuit-breaker-pattern/
[incompatible-fallback-factory-instance-link]: https://junhyunny.github.io/spring-boot/spring-cloud/exception/incompatible-fallback-factory-instance/