---
title: "[IllegalStateException] Incompatible fallbackFactory instance."
search: false
category:
  - spring-boot
  - spring-cloud
  - exception
last_modified_at: 2021-03-17T00:00:00
---

<br>

[Spring Cloud Netflix Hystrix][hystrix-blogLink] 포스트를 작성하던 중에 발생한 에러입니다. 

##### Run 실패 로그

<p align="center"><img src="/images/incompatible-fallback-factory-instance-1.JPG"></p>

## 발생 에러

> **IllegalStateException 발생**<br>
> Incompatible fallbackFactory instance. 
> Fallback/fallbackFactory of type class cloud.in.action.proxy.BServiceFeinClient$BServiceFallbackFactory is not assignable 
> to interface org.springframework.cloud.openfeign.FallbackFactory for feign client b-service

이상합니다. **`예전에 사용할 때는 정상적으로 동작했는데..?`**
버전이 변경되면서 사용법이 바뀐 줄 알고 찾아봤지만 관련된 내용은 찾아볼 수 없습니다. 
하는 수 없이 정상적으로 동작되는 예제들을 찾아 차이점을 확인해보았습니다. 

## 발생 원인

특정 설정과 클래스를 같이 사용하면 문제가 됩니다. 
디버그를 통해 원인을 확인하였고 간단히 정리해보도록 하겠습니다. 

### **`feign.circuitbreaker.enabled=true`** 설정 사용시
- **`feign.hystrix.FallbackFactory`** 클래스를 사용시 문제 발생
- **`org.springframework.cloud.openfeign.FallbackFactory`** 클래스를 사용시 정상 동작

##### application.yml
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

### **`feign.hystrix.enabled=true`** 설정 사용시
- **`feign.hystrix.FallbackFactory`** 클래스를 사용시 정상 동작
- **`org.springframework.cloud.openfeign.FallbackFactory`** 클래스를 사용시 정상 동작

##### application.yml
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
  hystrix:
    enabled: true
```

### 문제 발생 지점 확인 내용
**`feign.circuitbreaker.enabled=true`** 설정 사용시에는 circuitBreakerFeignTargeter 라는 빈(Bean)을 만듭니다. 
빈(Bean) 내부에서 fallbackFactory를 만들때 org.springframework.cloud.openfeign.FallbackFactory 클래스를 상속받는 클래스만 사용이 가능하도록 되어있습니다. 

##### circuitBreakerFeignTargeter 빈(Bean) 생성
<p align="center"><img src="/images/incompatible-fallback-factory-instance-2.JPG"></p>

##### FeignCircuitBreakerTargeter 클래스 getFromContext 메소드
- isAssignableFrom 메소드를 통해 org.springframework.cloud.openfeign.FallbackFactory 상속 여부를 확인합니다.
<p align="center"><img src="/images/incompatible-fallback-factory-instance-3.JPG"></p>

## OPINION
잘 알고 있다고 생각했는데 크게 한방 먹었습니다. 
**`feign.circuitbreaker.enabled=true`** 설정을 사용하는 경우 CircuitBreakerFactory 클래스를 명시적으로 만들게 되면서 문제가 발생하는 것으로 보입니다. 
**`feign.circuitbreaker.enabled`** 설정과 **`feign.hystrix.enabled`** 설정의 차이점에 대해 정확히 알고 싶은데 관련된 reference를 구하는게 쉽지 않습니다. 

그래서 차이점에 대한 정확한 내용을 Spring Cloud Openfeign 이슈로 등록 후 확인해보겠습니다.

[What is difference between feign.circuitbreaker.enabled option and feign.circuitbreaker.enabled option ?][git-issueLink]

[hystrix-blogLink]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/junit/spring-cloud-netflix-hystrix/
[git-issueLink]: https://github.com/spring-cloud/spring-cloud-openfeign/issues/516