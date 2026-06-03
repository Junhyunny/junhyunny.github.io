---
title: 스프링 클라우드 게이트웨이(Spring Cloud Gateway)
search: false
category:
  - information
  - spring-boot
  - spring-cloud
last_modified_at: 2026-06-04T01:07:57+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [MSA API 게이트웨이(gateway)][msa-gateway-link]
- [비동기 논블로킹(Asynchronous Non-Blocking) 처리][async-nonblocking-link]
- [JDBC 스프링 세션(Spring Session with JDBC)][spring-session-link]

## 0. 들어가면서

[JDBC 스프링 세션(Spring Session with JDBC) 글][spring-session-link]의 테스트를 구현할 때 포트(port)를 바꿔가며 요청하는 것이 번거롭다는 생각이 들었다. 그래서 `스프링 클라우드 게이트웨이(Spring Cloud Gateway)`를 사용하여 간단한 기능을 제공하는 게이트웨이를 구성해봤다. 생각보다 구현이 어려웠다. 이번 글은 간단한 게이트웨이를 구현하고 이를 테스트한 내용을 다룬다. 이 글을 읽기 전에 미리 [MSA API 게이트웨이(gateway)][msa-gateway-link]에서 게이트웨이가 무엇인지 읽어보길 추천한다.

## 1. Spring Cloud Gateway

`스프링 클라우드(Spring Cloud)` 팀은 마이크로서비스 아키텍처 구현을 위한 여러 가지 컴포넌트(component)를 제공한다. `스프링 클라우드 게이트웨이`도 그중 하나이다. 마이크로서비스 아키텍처에서 입구 역할을 해주는 게이트웨이를 간단한 설정 혹은 빈(bean) 주입을 통해 구현할 수 있다. 스프링 클라우드 게이트웨이를 구현하기 전 몇 가지 용어에 대한 정의를 알아야 한다.

- Route
  - 게이트웨이를 구성하는 기본 블록이다.
  - 특정 ID를 통해 정의하며, 목적 URI, `predicate` 집합, `filter` 집합으로 구성되어 있다.
  - `predicate` 집합의 결과가 참(true)인 경우에만 경로가 일치한다.
- Predicate
  - `Java 8`의 함수형 인터페이스를 의미한다. 1개의 입력 값과 `boolean` 반환 타입을 가지는 함수를 의미한다.
  - 입력 타입은 Spring 프레임워크의 `ServerWebExchange`이다.
  - HTTP 요청에 있는 파라미터(parameter) 혹은 헤더(header)를 사용하여 매칭할 수 있도록 돕는다.
  - 경로 매칭을 위한 조건으로 생각할 수 있다.
- Filter
  - Spring 프레임워크의 `GatewayFilter` 구현체이다.
  - 특별한 `Factory` 클래스를 통해 생성된다.
  - 다운스트림(downstream) 요청을 보내기 전이나 후에 요청, 응답 정보를 변경할 수 있다.

스프링 클라우드 게이트웨이는 논블로킹 방식으로 동작하는 `웹플럭스(webflux)` 기반으로 동작한다. 해당 개념을 모르는 경우 다소 어려움을 겪을 수 있다. 일반적으로 사용하는 톰캣 서블릿(servlet)과 동작 방식이 다르다. 어떤 점이 다를까?

1. 클라이언트가 스프링 클라우드 게이트웨이로 요청한다.
2. `Gateway Handler Mapping` 컴포넌트가 요청을 처음 받는다. 매칭되는 경로가 있다면 `Gateway Web Handler`에게 전달한다.
3. `Gateway Web Handler` 컴포넌트는 특정 필터 체인(filter chain)으로 요청을 전달한다. 필터 체인은 요청을 받을 때와 응답을 보내기 전에 각각 수행되므로 총 2회 수행된다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/spring-cloud-gateway-01.png" width="45%" class="image__border">
</div>
<center>https://docs.spring.io/spring-cloud-gateway/docs/2.2.9.RELEASE/reference/html/</center>

## 2. Spring Cloud Gateway 구현하기

요청 경로(request path)를 통한 API 라우팅 기능을 구현했다. 스프링 클라우드 게이트웨이를 구현하기 전에 어떤 역할을 수행할 것인지 구상해봤다.

- 클라이언트 측인 브라우저(browser)에서 버튼을 누를 때 무작위로 `/a-service/index`, `/b-service/index` 경로로 페이지를 요청한다.
- 게이트웨이는 요청을 전달받아 적절한 서비스로 라우팅(routing)한다.
- 요청을 실제로 전달받은 서비스는 적절한 응답을 반환한다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/spring-cloud-gateway-02.png" width="100%" class="image__border">
</div>

<br/>

패키지 구조를 살펴보자.

```
./
|-- pom.xml
|-- spring-cloud-gateway.iml
`-- src
    `-- main
        |-- java
        |   `-- blog
        |       `-- in
        |           `-- action
        |               |-- GatewayApplication.java
        |               `-- config
        |                   `-- GatewayConfiguration.java
        `-- resources
            `-- application.yml
```

pom.xml 파일에 `spring-cloud-starter-gateway` 의존성을 추가한다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    ...

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <spring-cloud.version>Hoxton.RELEASE</spring-cloud.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-gateway</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webflux</artifactId>
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

    ...
  
</project>
```

라우트 정보는 `application.yml` 설정 파일이나 자바(Java) 코드로 작성된 스프링 빈 객체로 제공할 수 있다. 동일한 기능을 수행하는 라우트 정보를 두 가지 방법으로 모두 구현해보자. 둘 중 한 가지만 적용해도 정상적으로 동작한다. 먼저 application.yml 파일을 사용하는 방법을 살펴보자. 스프링 클라우드 게이트웨이에서 사용하는 라우트(route) 정보들을 `routes` 설정 하위에 정의한다.

- `id`
  - route 정보를 식별하는 키, 개발자가 임의로 지정
- `uri`
  - 최종 목적지 URI
- `predicates`
  - 요청을 최종 목적지 URI와 매칭시킬 조건
  - 경로에 특정 키워드가 들어가는 경우 목적지 URI가 달라지도록 변경하였다.
- `filters`
  - 요청 정보나 응답을 변경하는 방법
  - 요청 경로를 변경하는 필터를 사용하였다.
  - 예를 들어 게이트웨이가 받은 요청 경로가 `/a-service/index`인 경우 `/index`로 변경하여 `http://localhost:8081`에게 전달한다.

```yml
spring:
  application:
    name: spring-cloud-gateway
  cloud:
    gateway:
      routes:
        - id: a-service
          uri: http://localhost:8081
          predicates:
            - Path=/a-service/**
          filters:
            - RewritePath=/a-service/(?<path>.*),/$\{path}
        - id: b-service
          uri: http://localhost:8082
          predicates:
            - Path=/b-service/**
          filters:
            - RewritePath=/b-service/(?<path>.*),/$\{path}
```

다음은 스프링 빈 객체로 라우트 정보를 제공해보자. 위에서 살펴본 `application.yml` 파일을 이용해 설정한 것과 동일한 결과를 가진다. 메서드로 구현하였지만, 빌더 패턴(builder pattern)을 사용하여 설정처럼 가독성이 높다.

```java
package blog.in.action.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfiguration {

    @Bean
    public RouteLocator gatewayRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
            .route(r -> r.path("/a-service/**")
                .filters(f -> f.rewritePath("/a-service/(?<path>.*)", "/${path}"))
                .uri("http://localhost:8081")
            )
            .route(r -> r.path("/b-service/**")
                .filters(f -> f.rewritePath("/b-service/(?<path>.*)", "/${path}"))
                .uri("http://localhost:8082")
            )
            .build();
    }
}
```

## 3. 테스트

`A-SERVICE`, `B-SERVICE`는 [JDBC 스프링 세션(Spring Session with JDBC) 글][spring-session-link]에서 사용한 서비스들이다. 테스트를 위해 `A-SERVICE`, `B-SERVICE`, 게이트웨이 서비스를 모두 동작시킨다. 브라우저는 게이트웨이로만 요청을 전달한다. 게이트웨이는 라우트 규칙에 따라 경로를 보고 해당 요청을 특정 서비스로 라우팅한다. 게이트웨이로부터 요청을 전달받은 `A-SERVICE`, `B-SERVICE`가 응답을 반환한다. 브라우저에서 `A-SERVICE`, `B-SERVICE`로부터 응답을 받는지 살펴보자.

- 브라우저는 버튼을 누를 때마다 `http://localhost:8080/a-service/index` 혹은 `http://localhost:8080/b-service/index`로 요청한다.
- 게이트웨이는 경로(path) 중간에 위치한 정보를 이용해 요청을 각 서비스로 라우팅한다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/spring-cloud-gateway-03.gif">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-10-05-spring-cloud-gateway>

#### REFERENCE

- <https://cloud.spring.io/spring-cloud-gateway/reference/html/>
- <https://docs.spring.io/spring-cloud-gateway/docs/2.2.9.RELEASE/reference/html/>
- <https://cheese10yun.github.io/spring-cloud-gateway/>

[msa-gateway-link]: https://junhyunny.github.io/msa/msa-api-gateway/
[async-nonblocking-link]: https://junhyunny.github.io/information/java/asynchronous-and-non-blocking-process/
[spring-session-link]: https://junhyunny.github.io/information/spring-boot/spring-session/
