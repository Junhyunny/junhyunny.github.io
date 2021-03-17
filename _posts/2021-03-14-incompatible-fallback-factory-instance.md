---
title: "[IllegalStateException] Incompatible fallbackFactory instance."
search: false
category:
  - spring
  - spring cloud
  - msa
  - circuit-breaker
  - hystrix
  - netflix-oss
  - exception
last_modified_at: 2021-03-17T00:00:00
---

<br>

[Spring Cloud Netflix Hystrix][hystrix-blogLink] 포스트를 작성하던 중에 발생한 에러입니다. 

##### Run 실패 로그

<p align="left"><img src="/images/incompatible-fallback-factory-instance-1.JPG"></p>

## 발생 에러

> **IllegalStateException 발생**<br>
> Incompatible fallbackFactory instance. 
> Fallback/fallbackFactory of type class cloud.in.action.proxy.BServiceFeinClient$BServiceFallbackFactory is not assignable 
> to interface org.springframework.cloud.openfeign.FallbackFactory for feign client b-service

BServiceFeinClient$BServiceFallbackFactory를 feign client b-service에게 호출할 수 없다. 
이상합니다. 예전에 사용할 때는 정상적으로 동작했는데, 버전이 바뀌면서 사용 방법이 바뀌었는지 찾아봤지만 


## 발생 원인

문제 원인은 간단했습니다. 
잘못된 클래스를 사용하고 있었습니다.(import 문제) 

##### 에러 발생 FallbackFactory
```java
import feign.hystrix.FallbackFactory; // 에러 발생

```
##### 정상적인 FallbackFactory
```java
import org.springframework.cloud.openfeign.FallbackFactory; // 정상 동작
```

## OPINION

작성 중입니다.

[hystrix-blogLink]: https://junhyunny.github.io/spring/spring%20cloud/msa/circuit-breaker/hystrix/netflix-oss/spring-cloud-netflix-hystrix/