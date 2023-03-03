---
title: "Incompatible FallbackFactory Instance Exception"
search: false
category:
  - spring-boot
  - spring-cloud
  - exception
last_modified_at: 2021-08-24T01:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Spring Cloud Netflix Hystrix][hystrix-link]

## 1. Occurred Exception

[Spring Cloud Netflix Hystrix][hystrix-link] 포스트를 작성하면서 다음과 같은 예외(exception)를 만났습니다. 

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

로그 내용을 살펴보면 `BlogClientFallbackFactory` 객체를 `org.springframework.cloud.openfeign.FallbackFactory` 인터페이스에 할당할 수 없다는 메세지를 볼 수 있습니다.
이번 포스트에선 해당 예외가 발생한 원인을 분석해보고, 이를 해결하는 방법에 대해 정리하였습니다. 

## 2. Analysis of Problem

설정에 맞지 않은 팩토리(factory) 클래스를 사용하면 문제가 발생합니다. 
다음과 같이 설정하면 해당 예외를 만나게 됩니다.

### 2.1. Wrong Usage

#### 2.1.1. application.yml 

* `feign.circuitbreaker.enabled=true` 설정을 사용합니다.
* `circuitbreaker` 설정은 내부적으로 `org.springframework.cloud.openfeign.FallbackFactory` 인터페이스를 상속한 팩토리 클래스를 사용하도록 구현되어 있습니다. 

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

#### 2.1.2. BlogClientFallbackFactory Class

* `feign.hystrix.FallbackFactory` 클래스를 확장한 팩토리 클래스를 만들어 사용합니다.

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

### 2.2. Solving the problem

* `feign.hystrix.FallbackFactory` 인터페이스를 `org.springframework.cloud.openfeign.FallbackFactory`로 변경합니다.

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

Github에 관련된 질문을 올리니 다음과 같은 답변을 얻을 수 있었습니다. 

> feign.circuitbreaker.* is for enabling support for Spring Cloud CircuitBreaker. It does not use Hystrix. You should use Spring Cloud CircuitBreaker as Hystrix is removed in the 2020.0.x release.

`2020.0.x` 릴리즈부터 `Spring Cloud CircuitBreaker`로 `Hystrix`를 대체한다고 합니다. 
`feign.circuitbreaker.*` 설정을 통해 `Spring Cloud CircuitBreaker` 지원을 활성화하라고 합니다. 

##### Question

<p align="left">
    <img src="/images/incompatible-fallback-factory-instance-1.JPG" width="100%" class="image__border">
</p>

##### Answer

<p align="left">
    <img src="/images/incompatible-fallback-factory-instance-2.JPG" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-03-13-spring-cloud-netflix-hystrix>

#### RECOMMEND NEXT POSTS

* <https://github.com/spring-cloud/spring-cloud-openfeign/issues/516>

## CLOSING

[Spring Cloud Netflix Hystrix][hystrix-link] 포스트를 다시 작성하면서 불필요한 코드나 의존성을 제거하다보니 추가적으로 몇 가지 사실을 발견했습니다. 

* 해당 문제는 `spring-cloud-starter-netflix-eureka-client` 의존성을 함께 사용하면 발생합니다.
    * `Spring Cloud CircuitBreaker` 의존성은 `spring-cloud-starter-netflix-eureka-client`을 통해 적용됩니다.
* `spring-cloud-starter-netflix-eureka-client` 의존성을 빼는 경우 `feign.hystrix.enabled` 설정을 사용해야지 정상적인 회로 차단기가 동작합니다.
    * `OpenFeign` 의존성만 사용하는 경우 `feign.hystrix.enabled`를 통해 회로 차단기를 활성화시켜야 합니다.
    * 폴백(fallback) 팩토리도 `feign.hystrix.FallbackFactory`를 사용해야 합니다.

[hystrix-link]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/junit/spring-cloud-netflix-hystrix/
