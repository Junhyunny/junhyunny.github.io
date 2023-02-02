---
title: "Spring Cloud Gateway"
search: false
category:
  - information
  - spring-boot
  - spring-cloud
last_modified_at: 2021-10-05T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [MSA API Gateway][msa-gateway-link]
- [비동기(Asynchronous) 논블로킹(Non-Blocking) 처리 방식][async-nonblocking-link]
- [Spring Session with JDBC][spring-session-link]

## 0. 들어가면서
[Spring Session with JDBC][spring-session-link] 포스트의 테스트를 구현할 때 포트(port)를 바꿔가며 요청하는 것이 번거롭다는 생각이 들었습니다. 
그래서 `Spring Cloud Gateway`를 사용하여 간단한 기능을 제공하는 게이트웨이(gateway)를 적용해볼 생각이었는데, 생각보다 구현이 어려웠습니다. 

이번 포스트는 엄청 간단한 게이트웨이를 구현하고 이를 테스트한 내용을 공유할 생각입니다. 
이 포스트를 읽기 전에 미리 [MSA API Gateway][msa-gateway-link] 글에서 게이트웨이가 무엇인지 읽어보실 것을 추천드립니다. 

## 1. Spring Cloud Gateway
`Spring Cloud` 측에서는 쉬운 마이크로 서비스 아키텍처 구현을 위한 여러 가지 컴포넌트(component)들을 제공해주고 있습니다. 
`Spring Cloud Gateway`도 그 중 하나입니다. 
마이크로 서비스 아키텍처에서 입구 역할을 해주는 게이트웨이(gateway)를 간단한 설정 혹은 빈(bean) 주입을 통해 구현할 수 있습니다.

### 1.1. Spring Cloud Gateway 주요 용어
`Spring Cloud Gateway`를 이해하기 위해선 몇 가지 용어들에 대한 정의를 알아야 합니다.
- Route
	- 게이트웨이를 구성하는 기본 블록
	- 특정 ID를 통해 정의하며, 목적 URI, `predicate` 집합, `filter` 집합으로 구성되어 있습니다.
	- `predicate` 집합의 결과가 참(true)인 경우에만 경로가 매치됩니다.
- Predicate
	- `Java 8`의 함수형 인터페이스를 의미합니다. 1 개의 입력 값과 `boolean` 반환 타입을 가지는 함수를 의미합니다.
	- 입력 타입은 Spring 프레임워크의 `ServerWebExchange`입니다.
	- HTTP 요청에 있는 파라미터(parameter) 혹은 헤더(header)를 사용하여 매칭할 수 있도록 돕습니다.
	- 경로 매칭을 위한 조건으로 생각할 수 있습니다.
- Filter
	- Spring 프레임워크의 `GatewayFilter` 구현체입니다.
	- 특별한 `Factory` 클래스를 통해 생성됩니다.
	- 다운스트림(downstream) 요청을 보내기 전이나 후에 요청, 응답 정보를 변경할 수 있습니다.

### 1.1. Spring Cloud Gateway 구조
`Spring Cloud Gateway`는 논블로킹 방식으로 동작하는 `Spring Webflux`를 기반으로 동작합니다. 
해당 개념을 모르는 경우 다소 어려움을 겪을 수 있습니다. 
기존에 사용하던 서블릿(servlet)과 동작하는 방법이 다릅니다. 

클라이언트가 `Spring Cloud Gateway`로 요청합니다. 
요청을 처음 받는 `Gateway Handler Mapping`은 요청이 매칭되는 경로가 있다면 `Gateway Web Handler`에게 전달합니다. 
핸들러(handler)는 특정 필터 체인(filter chain)으로 요청을 전달합니다. 
필터 체인은 요청을 받을 때와 응답을 보내기 전에 각각 수행되므로 총 2회 수행됩니다. 

<p align="center"><img src="/images/spring-cloud-gateway-1.JPG" width="45%"></p>
<center>https://docs.spring.io/spring-cloud-gateway/docs/2.2.9.RELEASE/reference/html/</center>

## 2. Spring Cloud Gatewy 구현하기
요청 경로(request path)를 통한 API routing 기능을 구현하였습니다.

### 2.1. 테스트 시나리오
`Spring Cloud Gateway`를 구현하기 전에 어떤 역할을 수행할 것인지 구상해보았습니다.
- 클라이언트 측인 브라우저(browser)에서 버튼을 누를 때 랜덤하게 `/a-service/index`, `/b-service/index` 경로로 페이지를 요청합니다.
- 게이트웨이는 요청을 전달받아 적절한 서비스로 라우팅(routing)합니다.
- 요청을 실제로 전달받은 서비스는 적절한 응답을 반환합니다.

<p align="center"><img src="/images/spring-cloud-gateway-2.JPG" width="85%"></p>

### 2.2. 패키지 구조

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

### 2.3. pom.xml
- `spring-cloud-starter-gateway` 의존성을 추가합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.2.9.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>

    <groupId>blog.in.action</groupId>
    <artifactId>spring-cloud-gateway</artifactId>
    <version>1.0-SNAPSHOT</version>

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


    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### 2.4. 루트(route) 정보 추가하기
루트 정보는 `application.yml` 설정 파일이나 Java 코드로 작성된 Spring 빈(bean)으로 제공할 수 있습니다. 
동일한 기능을 수행하는 루트 정보를 두 가지 방법 모두를 통해 구현해보겠습니다. 
둘 중 한가지만 적용해도 정상적으로 동작합니다.  

#### 2.4.1 application.yml 사용
`Spring Cloud Gateway`에서 사용하는 루트(route) 정보들을 `routes` 설정 하위에 정의합니다.
- `id` - route 정보를 식별하는 키, 개발자 임의로 지정
- `uri` - 최종 목적지 URI
- `predicates` - 요청을 최종 목적지 URI에게 매칭시킬 조건
	- 경로에 특정 키워드가 들어가는 경우 목적지 URI가 달라지도록 변경하였습니다.
- `filters` - 요청 정보나 응답을 변경하는 방법
	- 요청 경로를 변경하는 필터를 사용하였습니다. 
	- 예로 들어 게이트웨이가 받은 요청 경로가 `/a-service/index`인 경우 `/index`로 변경하여 `http://localhost:8081`에게 전달합니다.

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

#### 2.4.2. Spring 빈(bean) 사용
위 `application.yml` 파일을 이용해 설정한 것과 동일한 결과를 가집니다. 
메소드로 구현하였지만, 빌더 패턴(builder pattern)을 사용하여 설정처럼 가독성이 높습니다.

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
`A-SERVICE`, `B-SERVICE`는 [Spring Session with JDBC][spring-session-link] 포스트에서 사용한 서비스입니다. 
- 테스트를 위해 `A-SERVICE`, `B-SERVICE`, 게이트웨이 서비스 모두 동작시킵니다. 
- 버튼을 누를 때마다 `http://localhost:8080/a-service/index` 혹은 `http://localhost:8080/b-service/index`로 요청합니다.
- 게이트웨이는 경로(path) 중간에 위치한 정보를 이용해 요청을 각 서비스로 라우팅합니다. 
- 요청을 전달받은 `A-SERVICE`, `B-SERVICE`는 응답을 보내고, 브라우저는 게이트웨이를 통해 응답을 전달받습니다. 

##### 테스트 결과

<p align="center"><img src="/images/spring-cloud-gateway-3.gif"></p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-10-05-spring-cloud-gateway>

#### REFERENCE
- <https://cloud.spring.io/spring-cloud-gateway/reference/html/>
- <https://docs.spring.io/spring-cloud-gateway/docs/2.2.9.RELEASE/reference/html/>
- <https://cheese10yun.github.io/spring-cloud-gateway/>

[msa-gateway-link]: https://junhyunny.github.io/msa/msa-api-gateway/
[async-nonblocking-link]: https://junhyunny.github.io/information/java/asynchronous-and-non-blocking-process/
[spring-session-link]: https://junhyunny.github.io/information/spring-boot/spring-session/