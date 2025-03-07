---
title: "Spring Cloud Netflix Hystrix"
search: false
category:
  - spring-boot
  - spring-cloud
  - msa
  - junit
last_modified_at: 2021-08-24T01:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [마이크로서비스 아키텍처][microservice-architecture-link]
* [Spring Cloud Openfeign][spring-cloud-openfeign-link]
* [MSA Circuit Breaker Pattern][circuitbreaker-link]

## 1. Netflix Hystrix

마이크로서비스 아키텍처(microservice architecture)를 성공적으로 구축한 넷플릭스(netflix)가 제공하는 OSS(open source software)입니다. 
`Hystrix` 컴포넌트는 애너테이션과 설정만으로 손쉽게 회로 차단기(circuit breaker) 패턴을 적용할 수 있습니다. 
서비스 사이에 전파되는 장애를 차단하여 서비스 일부가 망가지더라도 시스템은 정상적 혹은 부분적으로 운영할 수 있도록 돕습니다. 

## 2. Practice

`FeignClient`와 함께 연동한 실습을 수행하였습니다. 
`FeignClient` 내부엔 다음과 같은 의존성이 존재하여 별도로 `Hystrix` 컴포넌트에 대한 의존성을 추가하지 않아도 됩니다.

```xml
    <dependency>
        <groupId>io.github.openfeign</groupId>
        <artifactId>feign-hystrix</artifactId>
        <version>10.10.1</version>
        <scope>compile</scope>
    </dependency>
```

### 2.1. Context of Practice

다음과 같은 실습 환경을 구축하였습니다.

* 클라이언트(client) 역할은 `JUnit` 테스트 코드가 수행합니다.
* `서비스A`는 회로 차단기가 적용되어 있습니다.
* `서비스A`가 `서비스B`로 API 요청을 수행합니다.
    * 두 경로로 요청을 수행합니다.
    * `/timeout` - `서비스B`는 스레드를 정지시켜 의도적으로 타임아웃(timeout)을 발생시킵니다.
    * `/exception` - `서비스B`는 의도적으로 예외를 던집니다.
* `서비스A`는 예외를 전달 받지만 이를 대체할 응답(fallback plan)을 대신 클라이언트에게 전달합니다.
* 클라이언트는 예외 대신 `서비스A`가 전달한 대체 응답을 전달 받습니다.

<p align="center">
    <img src="/images/spring-cloud-netflix-hystrix-1.JPG" width="80%" class="image__border">
</p>

### 2.2. Implemantation of Service A

#### 2.2.1. application.yml

* `feign.hystrix.enabled=true` 설정을 추가합니다.
* 타임아웃이 발생하기 쉽게 기다리는 시간을 5초로 설정합니다.

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

#### 2.2.2. BlogController Class

* 요청을 그대로 `서비스B`에게 전달합니다.

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

#### 2.2.3. BlogClient Interface and Fallback

`feign.hystrix.*` 패키지에 속한 `FallbackFactory` 클래스를 사용해야 합니다. 
자세한 내용은 [Incompatible FallbackFactory Instance Exception][incompatible-fallback-factory-instance-link] 포스트를 참조하시길 바랍니다. 

* `BlogClient`는 `서비스B`에게 API 요청을 수행합니다.
* `서비스B`에 문제가 발생하여 회로 차단기가 회로를 열면 대체 응답이 반환됩니다.
* 대체 응답에 대한 책임은 `BlogClientFallbackFactory`를 통해 생성된 객체에게 위임합니다.
* `BlogClientFallbackFactory`는 `BlogClient`에 문제가 생겼을 때를 대비한 `BlogClientFallbackPlan` 객체를 생성합니다.
    * `BlogClientFallbackPlan` 클래스는 `BlogClient` 인터페이스를 구현하여 에러 발생 시 각 메소드 별 적절한 응답을 반환합니다.

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

### 2.3. Implemantation of Service B

#### 2.3.1. BlogController Class

* 고의적으로 예외를 발생시키는 컨트롤러입니다.
    * `/timeout` 경로는 10초 간 스레드를 정지하여 타임아웃 예외를 발생시킵니다.
    * `/exception` 경로는 일부러 런타임 예외를 발생시킵니다.

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

도커 컴포즈(docker compose)로 테스트 환경을 구축합니다.

### 3.1. docker-compose.yml

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

### 3.2. Run Docker Compose

```
$ docker-compose up 
[+] Building 301.1s (23/23) FINISHED
 => [2021-03-13-spring-cloud-netflix-hystrix-b-service internal] load build definition from Dockerfile                                                                                          0.0s
 => => transferring dockerfile: 392B                                                                                                                                                            0.0s
 => [2021-03-13-spring-cloud-netflix-hystrix-a-service internal] load build definition from Dockerfile                                                                                          0.0s
 => => transferring dockerfile: 392B                                                                                                                                                            0.0s
 => [2021-03-13-spring-cloud-netflix-hystrix-b-service internal] load .dockerignore                                                                                                             0.0s
 => => transferring context: 2B                                                                                                                                                                 0.0s
 => [2021-03-13-spring-cloud-netflix-hystrix-a-service internal] load .dockerignore                                                                                                             0.0s
 => => transferring context: 2B                                                                                                                                                                 0.0s
 => [2021-03-13-spring-cloud-netflix-hystrix-a-service internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                 4.9s
 => [2021-03-13-spring-cloud-netflix-hystrix-a-service internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                         4.8s
 => [2021-03-13-spring-cloud-netflix-hystrix-a-service stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55   0.0s
 => [2021-03-13-spring-cloud-netflix-hystrix-a-service maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215       0.0s
 => [2021-03-13-spring-cloud-netflix-hystrix-b-service internal] load build context                                                                                                             0.1s
 => => transferring context: 4.10kB                                                                                                                                                             0.0s
 => [2021-03-13-spring-cloud-netflix-hystrix-a-service internal] load build context                                                                                                             0.0s
 => => transferring context: 6.62kB                                                                                                                                                             0.0s
 => CACHED [2021-03-13-spring-cloud-netflix-hystrix-b-service maven_build 2/6] WORKDIR /build                                                                                                   0.0s
 => [2021-03-13-spring-cloud-netflix-hystrix-a-service maven_build 3/6] COPY pom.xml .                                                                                                          0.1s
 => [2021-03-13-spring-cloud-netflix-hystrix-b-service maven_build 3/6] COPY pom.xml .                                                                                                          0.1s
 => [2021-03-13-spring-cloud-netflix-hystrix-b-service maven_build 4/6] RUN mvn dependency:go-offline                                                                                         263.9s
 => [2021-03-13-spring-cloud-netflix-hystrix-a-service maven_build 4/6] RUN mvn dependency:go-offline                                                                                         284.9s
 => [2021-03-13-spring-cloud-netflix-hystrix-b-service maven_build 5/6] COPY src ./src                                                                                                          0.1s
 => [2021-03-13-spring-cloud-netflix-hystrix-b-service maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                                  3.4s
 => CACHED [2021-03-13-spring-cloud-netflix-hystrix-b-service stage-1 2/3] WORKDIR /app                                                                                                         0.0s
 => [2021-03-13-spring-cloud-netflix-hystrix-b-service stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                       0.1s 
 => [2021-03-13-spring-cloud-netflix-hystrix-a-service] exporting to image                                                                                                                      0.4s 
 => => exporting layers                                                                                                                                                                         0.2s 
 => => writing image sha256:542d91290686251ebcfd804bdb4b544399941fa94fdcac65d79cffec43aef94f                                                                                                    0.0s 
 => => naming to docker.io/library/2021-03-13-spring-cloud-netflix-hystrix-b-service                                                                                                            0.0s 
 => => writing image sha256:84a68c227190b100af3037c0519cd5eb39cc9b705c3ca8d8f070cdf91555ffe9                                                                                                    0.0s 
 => => naming to docker.io/library/2021-03-13-spring-cloud-netflix-hystrix-a-service                                                                                                            0.0s 
 => [2021-03-13-spring-cloud-netflix-hystrix-a-service maven_build 5/6] COPY src ./src                                                                                                          0.1s 
 => [2021-03-13-spring-cloud-netflix-hystrix-a-service maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                                 10.3s 
 => [2021-03-13-spring-cloud-netflix-hystrix-a-service stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                       0.1s 
[+] Running 3/3
 - Network 2021-03-13-spring-cloud-netflix-hystrix_default        Created                                                                                                                       0.0s 
 - Container 2021-03-13-spring-cloud-netflix-hystrix-a-service-1  Created                                                                                                                       0.1s
 - Container 2021-03-13-spring-cloud-netflix-hystrix-b-service-1  Created                                                                                                                       0.1s 
```

### 3.3. Run Test Code

테스트 코드는 `서비스A` 모듈에 존재합니다. 

* 테스트에서 타임아웃이 발생하지 않도록 `connectTimeout`, `readTimeout`을 100초씩 설정합니다.
* 테스트를 위한 `FeignClient` 사용 시 회로 차단기가 동작하지 않도록 설정합니다.

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

##### Test Result

* `서비스A`로 요청한 두 경로 모두 `BlogClientFallbackPlan` 객체에 의해 대체된 응답을 전달 받습니다.

```
2023-02-16 00:39:10.921  INFO 22208 --- [           main] c.in.action.AServiceApplicationTests     : timeout fallback
2023-02-16 00:39:11.000  INFO 22208 --- [           main] c.in.action.AServiceApplicationTests     : implicit exception fallback
```

##### Error Log in Service A and Service B

* `서비스A`는 `netflix-hystrix-a-service` 입니다.
* `서비스B`는 `netflix-hystrix-b-service` 입니다.
* `서비스A`는 `서비스B`의 요청을 기다리다 타임아웃이 발생합니다.
    * 해당 예외는 `HystrixTimeoutException`으로 전달됩니다.
* `서비스B`는 의도적인 예외를 반환합니다.
    * 로그 내용 - java.lang.RuntimeException: exception occur  
* `서비스A`는 `서비스B`의 예외를 전달 받고 관련 로그를 출력합니다.
    * 로그 내용 - feign.FeignException$InternalServerError: [500] during [GET] to [http://b-service:8080/exception]
    * 해당 예외 처리 스택을 보면 `Hystrix` 컴포넌트가 상위 메소드에 있음을 알 수 있습니다.

```
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  | 2023-02-15 15:39:10.891 ERROR 1 --- [ HystrixTimer-1] c.i.a.proxy.BlogClientFallbackFactory    : null
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  | com.netflix.hystrix.exception.HystrixTimeoutException: null
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at com.netflix.hystrix.AbstractCommand$HystrixObservableTimeoutOperator$1.run(AbstractCommand.java:1142) ~[hystrix-core-1.5.18.jar!/:1.5.18]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at com.netflix.hystrix.strategy.concurrency.HystrixContextRunnable$1.call(HystrixContextRunnable.java:41) ~[hystrix-core-1.5.18.jar!/:1.5.18]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at com.netflix.hystrix.strategy.concurrency.HystrixContextRunnable$1.call(HystrixContextRunnable.java:37) ~[hystrix-core-1.5.18.jar!/:1.5.18]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at com.netflix.hystrix.strategy.concurrency.HystrixContextRunnable.run(HystrixContextRunnable.java:57) ~[hystrix-core-1.5.18.jar!/:1.5.18]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at com.netflix.hystrix.AbstractCommand$HystrixObservableTimeoutOperator$2.tick(AbstractCommand.java:1159) ~[hystrix-core-1.5.18.jar!/:1.5.18]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at com.netflix.hystrix.util.HystrixTimer$1.run(HystrixTimer.java:99) ~[hystrix-core-1.5.18.jar!/:1.5.18]
2021-03-13-spring-cloud-netflix-hystrix-a-service-1  |  at java.base/java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:515) ~[na:na]
...
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  | 2023-02-15 15:39:10.940 ERROR 1 --- [nio-8080-exec-2] o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed; nested exception is java.lang.RuntimeException: exception occur] with root cause
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  |
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  | java.lang.RuntimeException: exception occur
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  |  at cloud.in.action.controller.BlogController.requestWithIntentionalException(BlogController.java:28) ~[classes!/:0.0.1-SNAPSHOT]
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  |  at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[na:na]
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  |  at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62) ~[na:na]
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  |  at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43) ~[na:na]
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  |  at java.base/java.lang.reflect.Method.invoke(Method.java:566) ~[na:na]
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  |  at org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:190) ~[spring-web-5.2.6.RELEASE.jar!/:5.2.6.RELEASE]
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  |  at org.springframework.web.method.support.InvocableHandlerMethod.invokeForRequest(InvocableHandlerMethod.java:138) ~[spring-web-5.2.6.RELEASE.jar!/:5.2.6.RELEASE]
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  |  at org.springframework.web.servlet.mvc.method.annotation.ServletInvocableHandlerMethod.invokeAndHandle(ServletInvocableHandlerMethod.java:105) ~[spring-webmvc-5.2.6.RELEASE.jar!/:5.2.6.RELEASE]
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  |  at org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter.invokeHandlerMethod(RequestMappingHandlerAdapter.java:879) ~[spring-webmvc-5.2.6.RELEASE.jar!/:5.2.6.RELEASE]
2021-03-13-spring-cloud-netflix-hystrix-b-service-1  |  at org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter.handleInternal(RequestMappingHandlerAdapter.java:793) ~[spring-webmvc-5.2.6.RELEASE.jar!/:5.2.6.RELEASE]
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

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-03-13-spring-cloud-netflix-hystrix>

#### RECOMMEND NEXT POSTS

* [Incompatible FallbackFactory Instance Exception][incompatible-fallback-factory-instance-link]

#### REFERENCE

* <https://supawer0728.github.io/2018/03/11/Spring-Cloud-Feign/>
* <https://twowinsh87.github.io/etc/2019/01/19/etc-springboot-circuitbreaker/>
* <https://junhyunny.github.io/spring-boot/spring-cloud/msa/design-pattern/msa-circuit-breaker-pattern/>

[microservice-architecture-link]: https://junhyunny.github.io/information/msa/microservice-architecture/
[spring-cloud-openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/
[circuitbreaker-link]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/design-pattern/msa-circuit-breaker-pattern/
[incompatible-fallback-factory-instance-link]: https://junhyunny.github.io/spring-boot/spring-cloud/exception/incompatible-fallback-factory-instance/