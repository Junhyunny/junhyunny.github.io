---
title: "Incompatible FallbackFactory 인스턴스 예외"
search: false
category:
  - spring-boot
  - spring-cloud
  - exception
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [스프링 클라우드 넷플릭스 히스트릭스(Spring Cloud Netflix Hystrix)][hystrix-link]

## 1. Context of problem

[스프링 클라우드 히스트릭스에 관련된 글][hystrix-link]을 작성하면서 다음과 같은 예외(exception)를 만났다.

```
Caused by: java.lang.IllegalStateException: Incompatible fallbackFactory instance. Fallback/fallbackFactory of type class cloud.in.action.proxy.BlogClientFallbackFactory is not assignable to interface org.springframework.cloud.openfeign.FallbackFactory for feign client blog-client
    at org.springframework.cloud.openfeign.FeignCircuitBreakerTargeter.getFromContext(FeignCircuitBreakerTargeter.java:83) ~[spring-cloud-openfeign-core-2.2.7.RELEASE.jar:2.2.7.RELEASE]
    at org.springframework.cloud.openfeign.FeignCircuitBreakerTargeter.targetWithFallbackFactory(FeignCircuitBreakerTargeter.java:58) ~[spring-cloud-openfeign-core-2.2.7.RELEASE.jar:2.2.7.RELEASE]
    at org.springframework.cloud.openfeign.FeignCircuitBreakerTargeter.target(FeignCircuitBreakerTargeter.java:49) ~[spring-cloud-openfeign-core-2.2.7.RELEASE.jar:2.2.7.RELEASE]
    at org.springframework.cloud.openfeign.FeignClientFactoryBean.getTarget(FeignClientFactoryBean.java:391) ~[spring-cloud-openfeign-core-2.2.7.RELEASE.jar:2.2.7.RELEASE]
    at org.springframework.cloud.openfeign.FeignClientFactoryBean.getObject(FeignClientFactoryBean.java:347) ~[spring-cloud-openfeign-core-2.2.7.RELEASE.jar:2.2.7.RELEASE]
    at org.springframework.cloud.openfeign.FeignClientsRegistrar.lambda$registerFeignClient$0(FeignClientsRegistrar.java:240) ~[spring-cloud-openfeign-core-2.2.7.RELEASE.jar:2.2.7.RELEASE]
  ...
```

로그 내용을 살펴보면 `BlogClientFallbackFactory` 객체를 `org.springframework.cloud.openfeign.FallbackFactory` 인터페이스에 할당할 수 없다는 메시지를 볼 수 있다. 이번 글에선 해당 예외가 발생한 원인을 분석해보고, 이를 해결하는 방법에 대해 정리했다.

먼저 문제 상황을 재현해보자. 설정에 맞지 않은 팩토리(factory) 클래스를 사용하면 문제가 발생한다. 다음과 같은 설정과 인터페이스를 함께 사용하면 에러가 발생한다.

- feign.circuitbreaker.enabled 설정
- feign.hystrix.FallbackFactory 인터페이스

application YAML 파일에 다음과 같은 설정을 한다.

- `feign.circuitbreaker.enabled=true` 설정

```yml
feign:
  circuitbreaker:
    enabled: true
  client:
    config:
      default:
        connect-timeout: 5000
        read-timeout: 5000
```

BlogClientFallbackFactory 클래스를 선언할 때 `feign.hystrix` 패키지의 `FallbackFactory` 인터페이스를 확장한 팩토리 클래스를 만들어 사용한다.

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

## 2. Solve the problem

`circuitbreaker` 설정은 내부적으로 `org.springframework.cloud.openfeign.FallbackFactory` 인터페이스를 상속한 팩토리 클래스를 사용하도록 구현되어 있다. 적절한 인터페이스를 사용하도록 코드를 변경하면 정상적으로 동작한다.

- `org.springframework.cloud.openfeign` 패키지의 `FallbackFactory` 인터페이스를 사용하도록 코드를 변경한다.

```java
package cloud.in.action.proxy;

import lombok.extern.log4j.Log4j2;
import org.springframework.cloud.openfeign.FallbackFactory;
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

## 3. Issue Report

깃허브(Github)에 관련된 질문을 올렸다.

<div align="left">
  <img src="{{ site.image_url_2021 }}/incompatible-fallback-factory-instance-01.png" width="100%" class="image__border">
</div>

<br/>

다음과 같은 답변을 얻었다.

> feign.circuitbreaker.* is for enabling support for Spring Cloud CircuitBreaker. It does not use Hystrix. You should use Spring Cloud CircuitBreaker as Hystrix is removed in the 2020.0.x release.

`2020.0.x` 릴리즈부터 Spring Cloud CircuitBreaker로 `Hystrix`를 대체한다고 한다. `feign.circuitbreaker.*` 설정을 통해 Spring Cloud CircuitBreaker 지원을 활성화하라고 한다.

<divp align="left">
  <img src="{{ site.image_url_2021 }}/incompatible-fallback-factory-instance-02.png" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-03-13-spring-cloud-netflix-hystrix>

#### RECOMMEND NEXT POSTS

- <https://github.com/spring-cloud/spring-cloud-openfeign/issues/516>

## CLOSING

[스프링 클라우드 히스트릭스에 관련된 글][hystrix-link]을 다시 정리하면서 불필요한 코드나 의존성을 제거하다보니 추가적으로 몇 가지 사실을 발견했다.

- `spring-cloud-starter-netflix-eureka-client` 의존성을 사용하면 해당 문제가 발생한다.
  - Spring Cloud CircuitBreaker 의존성은 `spring-cloud-starter-netflix-eureka-client`을 통해 적용된다.
- `spring-cloud-starter-netflix-eureka-client` 의존성을 사용하지 않으면 `feign.hystrix.enabled` 설정을 사용한다.
  - OpenFeign 의존성만 사용하는 경우 `feign.hystrix.enabled` 설정으로 회로 차단기를 활성화시킨다.
  - `feign.hystrix.FallbackFactory`로 팩토리를 사용한다.

[hystrix-link]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/junit/spring-cloud-netflix-hystrix/
