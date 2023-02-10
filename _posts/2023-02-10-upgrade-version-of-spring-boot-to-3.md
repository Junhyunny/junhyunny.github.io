---
title: "Upgrade Version of Spring Boot to 3.0.X"
search: false
category:
  - spring-boot
  - spring-cloud
  - jpa
  - query-dsl
last_modified_at: 2023-02-10T23:55:00
---

<br/>

## 0. 들어가면서

`spring-boot-starter-parent` 2.7.4 버전에서 3.0.2 버전으로 업그레이드하면서 마주친 에러들에 대해 정리하였습니다. 
문제가 발생한 것들은 다음과 같습니다. 

* JDK version
* JPA QueryDSL
* Spring Cloud

## 1. JDK17 is requirement

2018년 2월 28일부터 약 4년동안 운영된 2.X 버전이 3.X 버전으로 업그레이드 되었습니다. 
2022년 11월 릴리즈로 계획된 3.X 버전은 `JDK17`를 필수로 사용합니다. 
`java.*` 패키지의 확장 기능이 모인 `javax.*` 패키지는 `jakarta.*` 패키지로 대체되었습니다. 

> This next major revision will be based on Spring Framework 6.0 and will require Java 17 or above. 
> It will also be the first version of Spring Boot that makes use of Jakarta EE 9 APIs (jakarta.*) instead of EE 8 (javax.*).

해당 문제로 다음과 같은 작업들을 수행하였습니다.

* IDE(integrated development environment)의 JDK 컴파일러(compiler) 버전을 변경합니다.
    * from `JDK8` to `JDK17`
* `pom.xml` 파일의 `java.version` 변경합니다.
    * from `1.8` to `17`

```xml
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.0.2</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    ...
    <properties>
        <java.version>17</java.version>
        <spring-cloud.version>2021.0.3</spring-cloud.version>
    </properties>
```

* `Dockerfile`에서 사용하는 이미지를 변경합니다.
    * from `maven:3.8.6-jdk-8` to `maven:3.8.3-openjdk-17`
    * from `openjdk:8` to `openjdk:17-alpine`

```dockerfile
# Maven Build
FROM maven:3.8.3-openjdk-17 as MAVEN_BUILD

WORKDIR /build

COPY pom.xml .

RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline

COPY src ./src

RUN --mount=type=cache,target=/root/.m2 mvn package -Dmaven.test.skip=true

# Run
FROM openjdk:17-alpine

WORKDIR /app

ARG JAR_FILE=*.jar

COPY --from=MAVEN_BUILD /build/target/${JAR_FILE} ./app.jar

EXPOSE 8080

ENTRYPOINT exec java -jar ./app.jar
```

* `javax.*` 패키지 의존성을 `jakarta.*`로 변경합니다.
    * from `javax.servlet.*` to `jakarta.servlet.*`
    * from `javax.persistence.*` to `jakarta.persistence.*`

## 2. JPA QueryDSL Compatibility

`JPA`와 `QueryDSL`을 사용할 때 `JDK17` 버전으로 변경됨에 따라 호환이 되지 않는 문제가 발생합니다. 
`EntityManager`가 `javax.persistence.*` 패키지에 속해 있기 때문에 기존 `JPAQueryFactory` 클래스에서 컴파일 에러가 발생합니다. 
`pom.xml` 파일의 `QueryDSL` 관련 의존성에 식별자를 추가합니다.

```xml
    <dependency>
        <groupId>com.querydsl</groupId>
        <artifactId>querydsl-apt</artifactId>
        <version>${querydsl.version}</version>
        <classifier>jakarta</classifier>
        <scope>provided</scope>
    </dependency>
    <dependency>
        <groupId>com.querydsl</groupId>
        <artifactId>querydsl-jpa</artifactId>
        <version>${querydsl.version}</version>
        <classifier>jakarta</classifier>
    </dependency>
```

## 3. Substitution for spring-cloud-starter-sleuth

스프링 부트를 `3.0.X` 버전으로 업그레이드 되었으므로 이에 맞는 스프링 클라우드 버전을 사용합니다. 
스프링 클라우드 공식 홈페이지에 릴리즈 트레인이 표로 정리되어 있습니다. 

| Release Train | Release Train |
|:---:|:---|
| 2022.0.x aka Kilburn | 3.0.x |
| 2021.0.x aka Jubilee | 2.6.x, 2.7.x (Starting with 2021.0.3) |
| 2020.0.x aka Ilford | 2.4.x, 2.5.x (Starting with 2020.0.3) |
| Hoxton | 2.2.x, 2.3.x (Starting with SR5) |
| Greenwich | 2.1.x |
| Finchley | 2.0.x |
| Edgware | 1.5.x |
| Dalston | 1.5.x |

다음과 같이 `pom.xml` 파일의 스프링 클라우드 버전을 변경합니다.

* from `2021.0.3` to `2022.0.1`

```xml
    <properties>
        <java.version>17</java.version>
        <spring-cloud.version>2022.0.1</spring-cloud.version>
    </properties>
```

스프링 클라우드 버전을 변경 후 컴파일을 수행하면 다음과 같은 에러를 만나게 됩니다. 

```
org.springframework.cloud:spring-cloud-starter-sleuth:jar:unknown was not found in https://repo.maven.apache.org/maven2 during a previous attempt. This failure was cached in the local repository and resolution is not reattempted until the update interval of central has elapsed or updates are forced
```

클라우드 환경에서 트랜잭션 추적을 위해 사용했던 `Spring Cloud Sleuth`는 릴리즈 체인에서 제외되었습니다. 
대신 `Micrometer Tracing` 프로젝트에서 관리하는 의존성으로 대체되었습니다. 

> Spring Cloud Sleuth<br/>
> This project has been removed from the release train. 
> The core of this project has moved to Micrometer Tracing project and the instrumentations will be moved to Micrometer and all respective projects(no longer all instrumentations will be done in a single repository).

### 3.1. Setup for micrometer-tracing in pom.xml

`pom.xml` 파일에 다음과 같은 의존성들을 추가하는 작업을 수행합니다. 

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>io.micrometer</groupId>
            <artifactId>micrometer-tracing-bom</artifactId>
            <version>${micrometer-tracing.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
<!-- have to remove sleuth dependency -->
<!--<dependency>-->
<!--    <groupId>org.springframework.cloud</groupId>-->
<!--    <artifactId>spring-cloud-starter-sleuth</artifactId>-->
<!--</dependency>-->
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-tracing</artifactId>
    </dependency>
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-tracing-bridge-brave</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
</dependencies>
```

### 3.2. Make logging pattern for TraceID and SpanID in application.yml

`application.yml` 파일에 다음과 같은 다음과 같은 작업을 수행합니다. 

```yml
spring:
  application:
    name: action-in-blog
logging:
  pattern:
    level: "%5p [${spring.application.name:},%X{traceId:-},%X{spanId:-}]"
```

##### TraceID and SpanID in Log

위 작업을 수행하면 다음과 같은 로그를 볼 수 있습니다.

```
2023-02-10T22:53:18.240+09:00  INFO [action-in-blog,63e64c4e61be68dfce5b35b5ebe3cf4d,ce5b35b5ebe3cf4d] 17484 --- [nio-8080-exec-1] a.in.blog.controller.BlogController      : health
2023-02-10T22:53:19.836+09:00  INFO [action-in-blog,63e64c4f25832747b013fc32f0a099f7,b013fc32f0a099f7] 17484 --- [nio-8080-exec-2] a.in.blog.controller.BlogController      : health
```

## CLOSING

일부 개발자 컴퓨터에선 `FeignClient` 빈(bean)을 만들 때 에러가 발생하였습니다. 
모든 컴퓨터에서 발생하지 않았으므로 글 마지막에 추가 내용으로 정리하였습니다. 
다음과 같은 문제가 발생하였으며, 해결 방법은 바로 아래서 확인할 수 있습니다. 

* 질의(query)를 만드는 과정에서 이름이 없어서 에러가 발생합니다. 

```
Caused by: java.lang.IllegalArgumentException: name is required.
	at feign.template.QueryTemplate.create(QueryTemplate.java:78) ~[feign-core-12.1.jar:na]
	at feign.RequestTemplate.lambda$appendQuery$1(RequestTemplate.java:659) ~[feign-core-12.1.jar:na]
	at java.base/java.util.HashMap.compute(HashMap.java:1316) ~[na:na]
	at feign.RequestTemplate.appendQuery(RequestTemplate.java:657) ~[feign-core-12.1.jar:na]
	at feign.RequestTemplate.query(RequestTemplate.java:621) ~[feign-core-12.1.jar:na]
	at java.base/java.util.LinkedHashMap.forEach(LinkedHashMap.java:721) ~[na:na]
	at feign.RequestTemplate.extractQueryTemplates(RequestTemplate.java:1024) ~[feign-core-12.1.jar:na]
	at feign.RequestTemplate.uri(RequestTemplate.java:469) ~[feign-core-12.1.jar:na]
	at org.springframework.cloud.openfeign.support.SpringMvcContract.processAnnotationOnMethod(SpringMvcContract.java:227) ~[spring-cloud-openfeign-core-4.0.1.jar:4.0.1]
	at feign.Contract$BaseContract.parseAndValidateMetadata(Contract.java:110) ~[feign-core-12.1.jar:na]
	at org.springframework.cloud.openfeign.support.SpringMvcContract.parseAndValidateMetadata(SpringMvcContract.java:193) ~[spring-cloud-openfeign-core-4.0.1.jar:4.0.1]
    ...
```

* `@RequestParam` 애너테이션에 명시적으로 키 이름을 지정합니다.

```java
package action.in.blog.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "blog-client", url = "http://placeholder-service.com")
public interface BlogClient {

    @GetMapping("/health")
    String health(@RequestParam(name = "id") String id);
}
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-02-10-upgrade-version-of-spring-boot-to-3>

#### REFERENCE

* <https://spring.io/blog/2022/05/24/preparing-for-spring-boot-3-0>
* <https://spring.io/projects/spring-cloud>
* <https://github.com/spring-cloud/spring-cloud-release/wiki/Spring-Cloud-2022.0-Release-Notes>
* <https://micrometer.io/>
* <https://micrometer.io/docs/tracing>
* <https://github.com/micrometer-metrics/micrometer>
* <https://github.com/micrometer-metrics/tracing/wiki/Spring-Cloud-Sleuth-3.1-Migration-Guide>
* <https://github.com/spring-cloud/spring-cloud-openfeign/issues/803>
* <https://stackoverflow.com/questions/727844/javax-vs-java-package>
* <https://marrrang.tistory.com/m/105>
* [자카르타 EE](https://ko.wikipedia.org/wiki/%EC%9E%90%EC%B9%B4%EB%A5%B4%ED%83%80_EE)
* [Java EE에서 Jakarta EE로의 전환](https://s-core.co.kr/insight/view/java-ee%EC%97%90%EC%84%9C-jakarta-ee%EB%A1%9C%EC%9D%98-%EC%A0%84%ED%99%98/)