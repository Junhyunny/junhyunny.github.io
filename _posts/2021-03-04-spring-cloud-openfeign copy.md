---
title: "Spring Cloud Openfeign"
search: false
category:
  - spring
  - spring cloud
last_modified_at: 2021-03-04T00:00:00
---

<br>

> Spring Cloud Openfeign API Reference<br>
> Feign is a declarative web service client. It makes writing web service clients easier.

Micro Service Architecture를 지원하는 Spring Cloud 프로젝트 중 하나입니다. 
서비스들 사이의 보다 쉬운 API를 지원하는 라이브러리입니다. 
Discovery 서비스와 함께 사용하는 경우 별도의 URL 없이도 클러스터(cluseter)를 형성하는 서비스들로 API 요청이 가능합니다. 
간단한 테스트 코드를 통해 Openfiegn 사용법을 알아보도록 하겠습니다. 

## 패키지 구조
<p align="left"><img src="/images/-1.JPG"></p>

## application.yml
```yml
spring:
  h2:
    console:
      enabled: true
      path: /h2-console
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password: 123
```

## pom.xml
```xml
```




## OPINION
작성 중입니다.

#### 참조글
- <https://woowabros.github.io/experience/2019/05/29/feign.html>