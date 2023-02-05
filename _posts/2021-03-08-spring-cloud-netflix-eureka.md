---
title: "Spring Cloud Netflix Eureka"
search: false
category:
  - spring-boot
  - spring-cloud
  - msa
last_modified_at: 2021-08-23T09:30:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [MicroService Architecture][microservice-architecture-link]
* [Spring Cloud Openfeign][openfeign-link]
* [Change URI with Openfeign when Runtime][dynamic-uri-using-openfeign-link]

## 1. Spring Cloud Netflix Eureka

클라우드 환경의 서비스들은 수시로 생성, 소멸되면서 IP, 포트(port)가 변경됩니다. 
클러스터(cluster) 내 서비스 컨테이너들을 관리해주는 `K8S` 같은 환경이 아니라면 서비스들의 정보를 별도로 관리할 필요가 있습니다. 
마이크로서비스 아키텍처를 성공적으로 구축한 기업인 넷플릭스(Netflix)는 Netflix OSS(open source software)를 만들고 이를 공개합니다. 
클라우드 환경에서 마이크로서비스 아키텍처를 구축하는데 도움이 되는 다양한 기술들이 존재합니다. 

> Spring Cloud Netflix provides Netflix OSS integrations for Spring Boot apps through autoconfiguration and binding to the Spring Environment and other Spring programming model idioms.

Netflix OSS 컴포넌트 중에서 `Eureka`는 클러스터 내 다른 서비스들의 정보를 관리합니다. 
이전 포스트에서 다룬 `FeignClient`는 `spring-cloud` 생태계를 구성하는 `Eureka` 컴포넌트와 함께 사용하면 더 강력합니다. 
`Eureka` 컴포넌트는 서비스 등록(registration)과 식별(discovery) 기능들을 제공합니다.

* 시스템을 구성하는 서비스는 `Eureka` 서비스의 클라이언트(client)로써 자신의 상태를 등록합니다.
* 특정 서비스가 다른 서비스의 연결 정보가 필요한 경우 `Eureka` 서비스에게 요청합니다.

<p align="center">
    <img src="/images/spring-cloud-netflix-eureka-1.JPG" width="50%" class="image__border">
</p>
<center>https://medium.com/@aqibbutt3078/microservices-using-spring-cloud-a4cbe640e14d</center>

## 2. Structure of Eureka

* `Eureka`는 서버와 클라이언트로 구성됩니다.
* 서버는 서비스 등록과 식별 기능을 제공합니다.
* 클라이언트는 자신의 IP, 포트를 서버에 등록합니다.
* 클라이언트는 다른 서비스 정보가 필요하면 서버로부터 전달 받습니다. 

<p align="center">
    <img src="/images/spring-cloud-netflix-eureka-2.JPG" width="80%" class="image__border">
</p>
<center>https://wonit.tistory.com/497</center>

## 3. Practice

1개의 서버와 2개의 클라이언트를 구성합니다. 

### 3.1. Eureka Server

우선 서버를 구현합니다. 
프로젝트 내 `Eureka` 모듈에서 작업을 수행합니다.

#### 3.1.1. pom.xml for Eureka

다음과 같은 의존성을 추가합니다.

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

#### 3.1.2. application.yml for Eureka

다음과 같은 설정을 추가합니다.

* eureka.client.register-with-eureka
    * 자신을 Eureka 서버에 등록할지 여부입니다.
* eureka.client.fetch-registry
    * 서버로부터 전달받은 서비스 리스트 정보를 로컬에 캐싱할지 여부입니다.

```yml
server:
  port: 8761
eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
```

#### 3.1.3. EurekaApplication Class

* `@EnableEurekaServer` 애너테이션을 추가하면 서버 역할을 수행하는 서비스로 동작합니다.

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

다음 클라이언트를 구현합니다. 
프로젝트 내 `a-service`, `b-service` 모듈에서 작업을 수행합니다. 
아래 설명은 `a-service` 모듈을 기준으로 작성하였으며 `b-service` 모듈에서도 동일한 작업이 필요합니다.

#### 3.2.1. pom.xml for Clients

다음과 같은 의존성을 추가합니다.

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

#### 3.2.2. application.yml for Clients

다음과 같은 설정을 추가합니다.

* server.port
    * `0`은 임의의 포트 번호를 의미합니다.
* spring.application.name
    * 서비스 이름을 지정합니다.
    * `Eureka` 서버에 등록되는 이름으로 사용됩니다.
* eureka.client.register-with-eureka
    * 자신을 `Eureka` 서버에 등록할지 여부입니다.
* eureka.client.fetch-registry
    * 서버로부터 전달받은 서비스 리스트 정보를 로컬에 캐싱할지 여부입니다.
* eureka.client.service-url.defaultZone
    * `Eureka` 서버 정보입니다.

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

#### 3.2.3. ACloudServiceApplication Class

- `@EnableEurekaClient` 애너테이션을 추가합니다.

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

도커 컴포즈(docker compose)로 테스트 환경을 구축합니다.

### 4.1. docker-compose.yml

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

### 4.2. Run Docker Compose

```
$ docker-compose up -d
[+] Building 358.9s (31/31) FINISHED
 => [2021-03-08-spring-cloud-netflix-eureka-a-service internal] load build definition from Dockerfile                                                                                              0.0s
 => => transferring dockerfile: 392B                                                                                                                                                               0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-b-service internal] load build definition from Dockerfile                                                                                              0.0s
 => => transferring dockerfile: 392B                                                                                                                                                               0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service internal] load build definition from Dockerfile                                                                                         0.0s 
 => => transferring dockerfile: 392B                                                                                                                                                               0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-a-service internal] load .dockerignore                                                                                                                 0.0s 
 => => transferring context: 2B                                                                                                                                                                    0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service internal] load .dockerignore                                                                                                            0.0s
 => => transferring context: 2B                                                                                                                                                                    0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-b-service internal] load .dockerignore                                                                                                                 0.0s 
 => => transferring context: 2B                                                                                                                                                                    0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-b-service internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                     4.6s 
 => [2021-03-08-spring-cloud-netflix-eureka-a-service internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                             4.5s 
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55  0.0s
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service internal] load build context                                                                                                            0.1s
 => => transferring context: 3.29kB                                                                                                                                                                0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215      0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-a-service internal] load build context                                                                                                                 0.0s 
 => => transferring context: 3.41kB                                                                                                                                                                0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-b-service internal] load build context                                                                                                                 0.1s 
 => => transferring context: 3.41kB                                                                                                                                                                0.0s 
 => CACHED [2021-03-08-spring-cloud-netflix-eureka-b-service maven_build 2/6] WORKDIR /build                                                                                                       0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-a-service maven_build 3/6] COPY pom.xml .                                                                                                              0.1s 
 => [2021-03-08-spring-cloud-netflix-eureka-b-service maven_build 3/6] COPY pom.xml .                                                                                                              0.1s 
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service maven_build 3/6] COPY pom.xml .                                                                                                         0.1s 
 => [2021-03-08-spring-cloud-netflix-eureka-a-service maven_build 4/6] RUN mvn dependency:go-offline                                                                                               301.1s 
 => [2021-03-08-spring-cloud-netflix-eureka-b-service maven_build 4/6] RUN mvn dependency:go-offline                                                                                               294.8s 
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service maven_build 4/6] RUN mvn dependency:go-offline                                                                                          335.4s 
 => [2021-03-08-spring-cloud-netflix-eureka-b-service maven_build 5/6] COPY src ./src                                                                                                              0.1s 
 => [2021-03-08-spring-cloud-netflix-eureka-b-service maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                                      14.3s 
 => [2021-03-08-spring-cloud-netflix-eureka-a-service maven_build 5/6] COPY src ./src                                                                                                              0.1s 
 => [2021-03-08-spring-cloud-netflix-eureka-a-service maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                                      16.9s 
 => CACHED [2021-03-08-spring-cloud-netflix-eureka-eureka-service stage-1 2/3] WORKDIR /app                                                                                                        0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-b-service stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                           0.1s 
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service] exporting to image                                                                                                                     0.7s
 => => exporting layers                                                                                                                                                                            0.2s 
 => => writing image sha256:c971e4d18a667cfb1a78573031e641776b4be554ba094d61edc34a954763ef0e                                                                                                       0.0s 
 => => naming to docker.io/library/2021-03-08-spring-cloud-netflix-eureka-b-service                                                                                                                0.0s 
 => => writing image sha256:55a35f21edd75a45f3f58d71dfe807184b2f6cc04e243610abef2cdd7f6b6b84                                                                                                       0.0s 
 => => naming to docker.io/library/2021-03-08-spring-cloud-netflix-eureka-a-service                                                                                                                0.0s 
 => => writing image sha256:c45f0e1fc9ae655643cd937215ccecb4e5703b984ba30860e1e236c97e2b26ad                                                                                                       0.0s 
 => => naming to docker.io/library/2021-03-08-spring-cloud-netflix-eureka-eureka-service                                                                                                           0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-a-service stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                           0.1s 
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service maven_build 5/6] COPY src ./src                                                                                                         0.1s 
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                                 17.6s 
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                      0.1s 
[+] Running 4/4
 - Network 2021-03-08-spring-cloud-netflix-eureka_default             Created                                                                                                                      0.0s 
 - Container 2021-03-08-spring-cloud-netflix-eureka-eureka-service-1  Started                                                                                                                      1.0s 
 - Container 2021-03-08-spring-cloud-netflix-eureka-a-service-1       Started                                                                                                                      0.6s 
 - Container 2021-03-08-spring-cloud-netflix-eureka-b-service-1       Started                                                                                                                      0.8s 
```

##### Result of Test

* `http://localhost:8761`으로 접속합니다.
* 등록된 서비스 정보를 확인합니다.

<p align="center">
    <img src="/images/spring-cloud-netflix-eureka-3.JPG" width="100%" class="image__border">
</p>

## CLOSING

여러 레퍼런스들을 찾아보면 `Eureka` 클라이언트를 구현할 때 사용하는 애너테이션이 두 개 존재합니다.

* `@EnableDiscoveryClient`
    * `Eureka` 이 외에 서비스 식별을 위한 라이브러리인 `ZooKeeper`, `Consul` 등을 지원합니다.
* `@EnableEurekaClient`
    * `Eureka` 라이브러리만 지원합니다.

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-03-08-spring-cloud-netflix-eureka>

#### RECOMMEND NEXT POSTS

* [FeignClient with Eureka][feignclient-with-eureka-link]

#### REFERENCE

* <https://spring.io/guides/gs/service-registration-and-discovery/>
* <https://bcho.tistory.com/1252>
* <https://medium.com/@aqibbutt3078/microservices-using-spring-cloud-a4cbe640e14d>
* <https://wonit.tistory.com/497>
* [spring cloud - eureka 기본 설정!][eureka-reference-link]

[eureka-reference-link]: https://kouzie.github.io/spring/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%81%B4%EB%9D%BC%EC%9A%B0%EB%93%9C-eureka-%EA%B8%B0%EB%B3%B8%EC%84%A4%EC%A0%95/#eureka-%ED%81%B4%EB%9D%BC%EC%9D%B4%EC%96%B8%ED%8A%B8-%EC%84%A4%EC%A0%95

[microservice-architecture-link]: https://junhyunny.github.io/information/msa/microservice-architecture/
[openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/
[dynamic-uri-using-openfeign-link]: https://junhyunny.github.io/spring-boot/spring-cloud/junit/dynamic-uri-using-openfeign/
[feignclient-with-eureka-link]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/junit/feignclient-with-eureka/