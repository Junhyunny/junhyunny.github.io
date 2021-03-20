---
title: "Spring Cloud Netflix Hystrix"
search: false
category:
  - spring-boot
  - spring-cloud
  - msa
  - junit
last_modified_at: 2021-03-21T00:00:00
---

<br>

## Netflix Hystrix
MSA를 성공적으로 구축한 대표적인 기업인 Netflix는 쉬운 MSA 구축을 돕는 다양한 기술들과 이슈에 대한 해결책들을 Netflix OSS(open source software)를 통해 제공합니다. 
Hystrix도 Eureka와 마찬가지로 Netflix가 제공하는 컴포넌트 중 하나입니다. 
Hystrix 컴포넌트는 Circuit Breaker 패턴을 이용하여 서비스가 장애 내성, 지연 내성을 갖도록 도와줄 뿐만 아니라 모니터링 기능까지 제공합니다. 
Spring Cloud 프로젝트에서는 Netflix에서 제공하는 대표적인 컴포넌트들을 Spring 프레임워크에서 쉽게 사용할 수 있도록 Spring Cloud Netflix를 제공합니다.

### Spring Cloud Netflix Components
- Eureka - Service Discovery & Registry
- Hystrix - Fault Tolerance Library(Circuit Breaker) 
- Zuul- API Gateway  
- Ribbon - Client Side Loadbalancer

## FeignClient - Hystrix 연동 테스트
FeignClient와 Hystrix 기능을 함께 사용한 테스트를 진행해보도록 하겠습니다.

### 테스트 시나리오
- Junit 테스트를 이용해 a-service의 **`/timeout, /exception`** 경로로 API 요청을 수행합니다.
- a-service는 이를 바로 b-service로 전달합니다.
- b-service의 **`/timeout`** 경로에는 10초 딜레이 코드가 존재합니다.
- b-service의 **`/exception`** 경로에는 의도적인 exception 코드가 존재합니다.
- a-service에서 timeout과 exception이 발생했을 때 hystrix의 Fallback 기능이 어떻게 동작하는지 확인합니다.

<p align="center"><img src="/images/spring-cloud-netflix-hystrix-1.JPG" width="550"></p>

### a-service 구현
#### application.yml
- **`feign.circuitbreaker.enabled=true`** 설정을 추가합니다.

```yml
server:
  port: 8000
spring:
  application:
    name: a-service
eureka:
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: http://127.0.0.1:8761/eureka/
feign:
  circuitbreaker:
    enabled: true
```

#### AServiceController 클래스
- Junit 테스트의 요청을 받아 b-service로 전달하는 컨트롤러입니다.

```java
package cloud.in.action.controller;

import java.util.Random;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import cloud.in.action.proxy.BServiceFeinClient;
import lombok.extern.log4j.Log4j2;

@Log4j2
@RestController
public class AServiceController {

    private final BServiceFeinClient client;

    public AServiceController(BServiceFeinClient client) {
        this.client = client;
    }

    @GetMapping(value = "/timeout")
    public String requestWithTimeout() {
        return client.requestWithTimeout();
    }

    @GetMapping(value = "/exception")
    public String requestWithException() {
        return client.requestWithException();
    }

    @GetMapping(value = "/hystrix-test/{index}")
    public String requestHystrixTest(@PathVariable(name = "index") Integer index) {
        if (index < 10) {
            return "success";
        } else if (index >= 10 && index < 40 && new Random().nextBoolean()) {
            try {
                Thread.sleep(1000);
            } catch (Exception e) {
                log.error(e.getMessage(), e);
            }
        } else if (index >= 40 && index < 70 && new Random().nextBoolean()) {
            throw new RuntimeException("exception occur");
        }
        return "success";
    }
}
```

#### BServiceFeinClient 인터페이스
- b-service 호출을 위한 BServiceFeinClient를 생성합니다.
- Circuit Breaker에 의해 회로가 차단되었을 때 동작할 FallbackFactory를 함께 생성합니다.
- create 메소드를 오버라이딩하여 b-service로부터 어떤 장애가 발생했는지 확인하는 로그를 작성합니다.
- BServiceFeinClient을 구현한 BServiceFallback 객체를 반환합니다.
- BServiceFallback 클래스는 BServiceFeinClient의 메소드를 오버라이딩하여 각 호출 별로 반환할 값을 지정합니다.

```java
package cloud.in.action.proxy;

import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;

import lombok.extern.log4j.Log4j2;

@FeignClient(name = "b-service", fallbackFactory = BServiceFallbackFactory.class)
public interface BServiceFeinClient {

    @GetMapping(path = "/timeout")
    String requestWithTimeout();

    @GetMapping(path = "/exception")
    String requestWithException();
}

@Log4j2
@Component
class BServiceFallbackFactory implements FallbackFactory<BServiceFeinClient> {

    @Override
    public BServiceFeinClient create(Throwable cause) {
        log.error(cause.getMessage(), cause);
        return new BServiceFallback();
    }

    class BServiceFallback implements BServiceFeinClient {

        @Override
        public String requestWithTimeout() {
            return "time out fallback";
        }

        @Override
        public String requestWithException() {
            return "exception fallback";
        }
    };
}
```

### b-service 구현
#### BServiceController
- a-service로부터 전달받은 요청에 대해 고의적인 장애를 발생시키는 컨트롤러입니다.

```java
package cloud.in.action.controller;

import java.util.Random;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.log4j.Log4j2;

@Log4j2
@RestController
public class BServiceController {

    @GetMapping(value = "/timeout")
    public String requestWithTimeout() {
        try {
            Thread.sleep(10000);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
        return "no time out occur";
    }

    @GetMapping(value = "/exception")
    public String requestWithException() {
        if (new Random().nextBoolean()) {
            throw new RuntimeException("exception occur");
        }
        return "no exception occur";
    }
}
```

### 테스트 코드
- a-service의 **`/timeout, /exception`** 경로로 API 요청을 수행합니다.
- 전달받은 응답을 로그로 확인합니다.
- a-service 로그에서는 어떤 에러가 발생하였는지 로그를 확인합니다.
- **`feign.circuitbreaker.enabled`** 옵션이 true이므로 @SpringBootTest 애너테이션을 이용해 이 테스트에 한해서만 false로 변경합니다.

```java
package cloud.in.action;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import lombok.extern.log4j.Log4j2;

@FeignClient(name = "a-service")
interface ASerivceClient {

    @GetMapping(path = "/timeout")
    String requestWithTimeout();

    @GetMapping(path = "/exception")
    String requestWithException();
}

@Log4j2
@SpringBootTest(value = { "spring.application.name=a-service-test",
        "feign.circuitbreaker.enabled=false",
        "feign.client.config.default.connectTimeout=100000",
        "feign.client.config.default.readTimeout=100000" })
class AServiceApplicationTests {

    @Autowired
    private ASerivceClient client;

    @Test
    void test() {
        log.info("requestWithTimeout response: " + client.requestWithTimeout());
        log.info("requestWithException response: " + client.requestWithException());
    }
}
```

### 테스트 결과
- ereka 서버, a-service, b-service를 순차적으로 동작시킵니다.
- Junit 테스트를 수행 후 로그를 확인합니다.

##### a-service **`/timeout`** 요청 시 에러 로그
<p align="center"><img src="/images/spring-cloud-netflix-hystrix-2.JPG"></p>

##### a-service **`/exception`** 요청 시 에러 로그
<p align="center"><img src="/images/spring-cloud-netflix-hystrix-3.JPG"></p>

##### Junit 테스트 결과
<p align="left"><img src="/images/spring-cloud-netflix-hystrix-4.JPG"></p>

## OPINION
Circuit Breaker 패턴을 적용한 Hystrix 컴포넌트를 FeignClient와 함께 사용한 테스트 코드를 작성해보았습니다. 
**`feign.circuitbreaker.enabled`** 옵션을 사용하면서 몇 가지 이슈들이 있었는데 이 내용은 [[IllegalStateException] Incompatible fallbackFactory instance.][exception-blogLink] 포스트에서 확인 가능합니다. 
FeignClient는 FallbackFactory 없이 Fallback을 사용할 수 있지만 어떤 클라이언트에서 문제를 일으키는지 확인이 힘들다고 합니다.([[Spring boot] Circuit Breaker][reference-blogLink])

테스트 코드는 아래 링크를 통해 확인이 가능합니다.
- [eureka server][eureka-server-link]
- [a-service][a-service-link]
- [b-service][b-service-link]

#### REFERENCE
- <https://supawer0728.github.io/2018/03/11/Spring-Cloud-Feign/>
- <https://twowinsh87.github.io/etc/2019/01/19/etc-springboot-circuitbreaker/>
- <https://junhyunny.github.io/spring-boot/spring-cloud/msa/design-pattern/msa-circuit-breaker-pattern/>
- <https://junhyunny.github.io/spring-boot/spring-cloud/exception/incompatible-fallback-factory-instance/>

[exception-blogLink]: https://junhyunny.github.io/spring-boot/spring-cloud/exception/incompatible-fallback-factory-instance/
[reference-blogLink]: https://twowinsh87.github.io/etc/2019/01/19/etc-springboot-circuitbreaker/
[eureka-server-link]: https://github.com/Junhyunny/eureka/tree/05aba484ca1fb35aedaff2f16cb225088a278b52
[a-service-link]: https://github.com/Junhyunny/a-service/tree/aa5b7b005ade47d8ec05d1f4db43cc496b992aa1
[b-service-link]: https://github.com/Junhyunny/b-service/tree/6d3da3ba21208fa8beb7499c0f4cde7cfcb4be76