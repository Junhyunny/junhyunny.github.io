---
title: "스프링 클라우드 넷플릭스 유레카(Spring Cloud Netflix Eureka)"
search: false
category:
  - spring-boot
  - spring-cloud
  - msa
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [마이크로서비스 아키텍처][microservice-architecture-link]
- [스프링 클라우드(spring cloud) OpenFeign][openfeign-link]
- [런타임 시 OpenFeign URI 동적 변경][dynamic-uri-using-openfeign-link]

## 1. Spring Cloud Netflix Eureka

클라우드 환경의 서비스들은 수시로 생성, 소멸되면서 IP, 포트(port)가 변경된다. 클러스터(cluster) 내 서비스 컨테이너들을 관리해주는 `K8S` 같은 환경이 아니라면 서비스들의 정보를 별도로 관리할 필요가 있다. 마이크로서비스 아키텍처를 성공적으로 구축한 기업인 넷플릭스(Netflix)는 Netflix OSS(open source software)를 만들고 이를 공개했다. 클라우드 환경에서 마이크로서비스 아키텍처를 구축하는 데 도움이 되는 다양한 기술들이 존재한다.

> Spring Cloud Netflix provides Netflix OSS integrations for Spring Boot apps through autoconfiguration and binding to the Spring Environment and other Spring programming model idioms.

Netflix OSS 컴포넌트 중에서 `Eureka`는 클러스터 내 다른 서비스들의 정보를 관리한다. 이전 글에서 다룬 `FeignClient`는 `spring-cloud` 생태계를 구성하는 `Eureka` 컴포넌트와 함께 사용하면 더 강력하다. `Eureka` 컴포넌트는 서비스 등록(registration)과 식별(discovery) 기능들을 제공한다.

- 시스템을 구성하는 서비스는 `Eureka` 서비스의 클라이언트(client)로서 자신의 상태를 등록한다.
- 특정 서비스가 다른 서비스의 연결 정보가 필요한 경우 `Eureka` 서비스에게 요청한다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/spring-cloud-netflix-eureka-01.png" width="50%" class="image__border">
</div>
<center>https://medium.com/@aqibbutt3078/microservices-using-spring-cloud-a4cbe640e14d</center>

## 2. Structure of Eureka

유레카 컴포넌트를 사용하는 마이크로서비스 아키텍처의 구조는 다음과 같다.

- `Eureka`는 서버와 클라이언트로 구성된다.
- 서버는 서비스 등록과 식별 기능을 제공한다.
- 클라이언트는 자신의 IP, 포트를 서버에 등록한다.
- 클라이언트는 다른 서비스 정보가 필요하면 서버로부터 전달받는다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/spring-cloud-netflix-eureka-02.png" width="80%" class="image__border">
</div>
<center>https://wonit.tistory.com/497</center>

## 3. Practice

1개의 서버와 2개의 클라이언트를 구성한다.

### 3.1. Eureka Server

우선 서버를 구현한다. 프로젝트 내 `Eureka` 모듈에서 작업을 수행한다. pom.xml 파일에 다음과 같이 유레카 서버 관련 의존성을 추가한다.

```xml
    <properties>
        <spring-cloud.version>Hoxton.SR10</spring-cloud.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
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
```

application YAML 설정 파일에 다음과 같은 설정을 추가한다.

- eureka.client.register-with-eureka
  - 자신을 Eureka 서버에 등록할지 여부이다.
- eureka.client.fetch-registry
  - 서버로부터 전달받은 서비스 리스트 정보를 로컬에 캐싱할지 여부이다.

```yml
server:
  port: 8761
eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
```

애플리케이션 메인 클래스에 `@EnableEurekaServer` 애너테이션을 추가하면 서버 역할을 수행하는 서비스로 동작한다.

```java
package cloud.in.action;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@EnableEurekaServer
@SpringBootApplication
public class EurekaApplication {

    public static void main(String[] args) {
        SpringApplication.run(EurekaApplication.class, args);
    }

}
```

### 3.2. Eureka Client

다음 클라이언트를 구현한다. 프로젝트 내 `a-service`, `b-service` 모듈에서 작업을 수행한다. 아래 설명은 `a-service` 모듈을 기준으로 작성하였으며 `b-service` 모듈에서도 동일한 작업이 필요하다. 클라이언트 애플리케이션을 위한 의존성을 pom.xml 파일에 등록한다.

```xml
    <properties>
        <spring-cloud.version>Hoxton.SR10</spring-cloud.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
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
```

application YAML 파일에 클라이언트를 위한 설정을 추가한다.

- server.port
  - `0`은 임의의 포트 번호를 의미한다.
- spring.application.name
  - 서비스 이름을 지정한다.
  - `Eureka` 서버에 등록되는 이름으로 사용된다.
- eureka.client.register-with-eureka
  - 자신을 `Eureka` 서버에 등록할지 여부이다.
- eureka.client.fetch-registry
  - 서버로부터 전달받은 서비스 리스트 정보를 로컬에 캐싱할지 여부이다.
- eureka.client.service-url.defaultZone
  - `Eureka` 서버 정보이다.

```yml
server:
  port: 0
spring:
  application:
    name: a-service-as-client
eureka:
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: http://eureka-service:8761/eureka/
```

서버와 마찬가지로 서비스를 실행하는 메인 함수가 포함된 클래스 위에 `@EnableEurekaClient` 애너테이션을 추가한다.

```java
package cloud.in.action;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;

@EnableEurekaClient
@SpringBootApplication
public class AServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AServiceApplication.class, args);
    }

}
```

## 4. Test

도커 컴포즈(docker compose)로 테스트 환경을 구축한다. 다음과 같은 도커 컴포즈 YAML 파일을 만든다.

```yml
version: "3.9"
services:
  eureka-service:
    build: ./eureka
    ports:
      - "8761:8761"
  a-service:
    build: ./a-service
  b-service:
    build: ./b-service
```

도커 컴포즈를 실행한다.

```
$ docker-compose up -d
...
[+] Running 4/4
 - Network 2021-03-08-spring-cloud-netflix-eureka_default             Created                          0.0s 
 - Container 2021-03-08-spring-cloud-netflix-eureka-eureka-service-1  Started                          1.0s 
 - Container 2021-03-08-spring-cloud-netflix-eureka-a-service-1       Started                          0.6s 
 - Container 2021-03-08-spring-cloud-netflix-eureka-b-service-1       Started                          0.8s 
```

실행 결과를 확인해보자. 유레카 서버인 `http://localhost:8761`으로 접속하면 등록된 서비스들 정보를 확인할 수 있다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/spring-cloud-netflix-eureka-03.png" width="100%" class="image__border">
</div>

## CLOSING

여러 레퍼런스들을 찾아보면 `Eureka` 클라이언트를 구현할 때 사용하는 애너테이션이 두 개 존재한다.

- `@EnableDiscoveryClient`
  - `Eureka` 이 외에 서비스 식별을 위한 라이브러리인 `ZooKeeper`, `Consul` 등을 지원한다.
- `@EnableEurekaClient`
  - `Eureka` 라이브러리만 지원한다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-03-08-spring-cloud-netflix-eureka>

#### RECOMMEND NEXT POSTS

- [유레카(Eureka) 서버/클라이언트와 FeignClient 연동하기][feignclient-with-eureka-link]

#### REFERENCE

- <https://spring.io/guides/gs/service-registration-and-discovery/>
- <https://bcho.tistory.com/1252>
- <https://medium.com/@aqibbutt3078/microservices-using-spring-cloud-a4cbe640e14d>
- <https://wonit.tistory.com/497>
- [spring cloud - eureka 기본 설정!][eureka-reference-link]

[eureka-reference-link]: https://kouzie.github.io/spring/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%81%B4%EB%9D%BC%EC%9A%B0%EB%93%9C-eureka-%EA%B8%B0%EB%B3%B8%EC%84%A4%EC%A0%95/#eureka-%ED%81%B4%EB%9D%BC%EC%9D%B4%EC%96%B8%ED%8A%B8-%EC%84%A4%EC%A0%95

[microservice-architecture-link]: https://junhyunny.github.io/information/msa/microservice-architecture/
[openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/
[dynamic-uri-using-openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/junit/dynamic-uri-using-openfeign/
[feignclient-with-eureka-link]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/junit/feignclient-with-eureka/