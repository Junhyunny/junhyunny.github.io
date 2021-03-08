---
title: "Spring Cloud Netflix Eureka"
search: false
category:
  - spring
  - spring cloud
  - msa
  - netflix-oss
last_modified_at: 2021-03-08T00:00:00
---

<br>

> [Spring Cloud Openfeign][openfeign-blogLink] 포스트의 OPINION<br>
> 무엇보다 FeignClient는 Service Registration, Discovery 기능을 제공하는 Eureka 서비스와 함께 사용될 때 더 빛을 바랍니다.

오늘은 FeignClient를 더 효율적으로 사용할 수 있도록 돕는 Eureka에 대한 내용을 포스트하도록 하겠습니다. 
우선 Eureka가 등장하게 된 배경인 MSA 환경에 대한 이야기를 먼저해보도록 하겠습니다. 

## MSA(Micro Service Architecture) 환경에 대한 이해
MSA(Micro Service Architecture)는 비즈니스 도메인을 중심으로 여러 종류로 나뉘어진 서비스들이 협업하는 아키텍처입니다. 
MSA 기반의 시스템은 신속한 개발과 배포, 서비스 확장 등의 이점을 가져가기 위해 클라우드 기반의 Paas(Platform as a Service) 환경 위에 구축됩니다. 

Paas 환경에서는 서비스 부하 증감에 따라 서비스 인스턴스들의 수가 조절되는 Auto-Scaling이 발생합니다. 
각 서비스 별로 인스턴스 수가 동적으로 변경되면서 인스턴스들의 IP, PORT 정보에 대한 변경이 잦아지게 되었습니다. 
IP, PORT가 시간에 따라 달라진다면 Rest API 같은 HTTP 기반의 통신은 사용이 불가능해집니다. 
고정적인 IP, PORT를 사용하지 못하는 문제점은 각 인스턴스들의 IP, PORT 정보 관리에 대한 필요성으로 이어지게 됩니다.

## Service Registration, Discovery
특정 서비스(Service Regsitry)가 클라우드에서 동작하는 인스턴스들의 IP, PORT 정보를 관리하도록 하여 이 문제를 해결합니다. 
인스턴스가 새로이 생성되는 인스턴스는 자신의 IP, PORT 정보를 Service Registry에 등록합니다. 
특정 서비스와 통신하고 싶은 서비스는 Service Registry로부터 해당 서비스의 IP, PORT 정보를 획득하여 사용합니다. 

<p align="center"><img src="/images/spring-cloud-netflix-eureka-1.JPG" width="750"></p>

## Spring Cloud Netflix Eureka
MSA를 잘 활용한 대표적인 기업인 Netflix는 쉬운 MSA 구축을 돕는 다양한 기술들과 이슈에 대한 해결책들을 Netflix OSS(open source software)를 통해 제공합니다. 
Spring Cloud 프로젝트에서는 Netflix에서 제공하는 대표적인 컴포넌트들을 Spring 프레임워크에서 쉽게 사용할 수 있도록 Spring Cloud Netflix를 제공합니다.

> Spring Cloud Netflix provides Netflix OSS integrations for Spring Boot apps through autoconfiguration 
> and binding to the Spring Environment and other Spring programming model idioms.

### Spring Cloud Netflix Components
- Eureka - Service Discovery & Registry
- Hystrix - Fault Tolerance Library(Circuit Breaker) 
- Zuul- API Gateway  
- Ribbon - Client Side Loadbalancer

이번 포스트의 주제인 Eureka 컴포넌트의 구조에 대해 알아보고 이를 구축, 테스트해보도록 하겠습니다. 

### Eureka 컴포넌트 구조
- Eureka 서버와 Eureka 클라이언트로 구성됩니다.
- Eureka 서버는 Service Registration, Discovery 기능을 제공합니다.
- Eureka 클라이언트는 Eureka 서버에 자신의 IP, PORT 정보를 등록하고 Service Discovery 기능을 활용합니다.
<p align="center"><img src="/images/spring-cloud-netflix-eureka-2.JPG" width="750"></p>

### Eureka 서버 구축
우선 Eureka 서버를 구축해보도록 하겠습니다. 
간단한 애너테이션과 설정만으로 Eureka 서버 구축이 가능합니다.  

#### pom.xml
- spring-cloud-starter-netflix-eureka-server dependency 추가

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.2.7.RELEASE</version>
        <relativePath /> <!-- lookup parent from repository -->
    </parent>
    <groupId>cloud.in.action</groupId>
    <artifactId>Eureka</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>Eureka</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>11</java.version>
        <spring-cloud.version>Hoxton.SR10</spring-cloud.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
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

#### application.yml
- port를 8761로 지정합니다.
- eureka.client.register-with-eureka, 자신을 Eureka 서버에 등록할지 여부
- eureka.client.fetch-registry, 서버로부터 전달받은 서비스 리스트 정보를 로컬에 캐싱할지 여부

```yml
server:
  port: 8761
eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
```

#### EurekaApplication 클래스
- @EnableEurekaServer 애너테이션을 추가합니다.

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

### Eureka 클라이언트 구현
다음으로 Eureka 클라이언트를 만들어보도록 하겠습니다. 
간단한 애너테이션과 설정만으로 Eureka 클라이언트 구현이 가능합니다. 
a-service를 Erueka 클라이언트로 구현한 방법에 대해 설명하였지만 같은 방법으로 b-service도 구현하였습니다. 

#### pom.xml
- spring-cloud-starter-netflix-eureka-client dependency 추가

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.2.7.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>cloud.in.action</groupId>
    <artifactId>a-service</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>a-service</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>11</java.version>
        <spring-cloud.version>Hoxton.SR10</spring-cloud.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
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

#### application.yml
- port를 0으로 지정합니다. 임의의 숫자를 port로 지정받습니다.
- spring.application.name, 서버의 이름을 지정합니다. Eureka 서비스 이름으로 서버 리스트에 등록됩니다.
- eureka.client.register-with-eureka, 자신을 Eureka 서버에 등록할지 여부
- eureka.client.fetch-registry, 서버로부터 전달받은 서비스 리스트 정보를 로컬에 캐싱할지 여부
- eureka.client.service-url.defaultZone, eureka 서버 정보

```yml
server:
  port: 0
spring:
  application:
    name: a-service
eureka:
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: http://127.0.0.1:8761/eureka/
```

#### ACloudServiceApplication 클래스
- @EnableEurekaClient 애너테이션을 추가합니다.

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

##### 서비스 등록 확인
- Eureka 서버를 먼저 기동시킵니다.
- a-service, b-service를 기동시킵니다.
- <http://localhost:8761>로 접속하여 등록된 서비스 정보를 확인합니다. 
<p align="center"><img src="/images/spring-cloud-netflix-eureka-3.JPG"></p>
<p align="center"><img src="/images/spring-cloud-netflix-eureka-4.JPG"></p>

## OPINION
MSA 환경에서 필요한 Service Registration, Discovery 기능을 제공하는 Eureka 컴포넌트에 대해 정리해봤습니다. 
Eureka 클라이언트 구현과 관련된 정보를 찾다보니 @EnableDiscoveryClient 애너테이션 혹은 @EnableEurekaClient 애너테이션을 사용하였습니다. 
어떤 조건으로 두 애너테이션을 구분하여 사용하는지 차이점을 찾아보았습니다. 
> @EnableDiscoveryClient, @EnableEurekaClient 차이점<br>
> Service Discovery 라이브러리는 유레카 외에도 주키퍼, 컨설 등이 존재합니다. 
> @EnableDiscoveryClient 애너테이션은 모든 라이브러리를 지원하며 @EnableEurekaClient 애너테이션은 유레카 라이브러리만을 지원합니다.

Eureka 서버 구축이 되었으니 Service Discovery 기능을 이용한 FeignClient 사용과 관련된 글을 작성해보려고 합니다. 
Spring Cloud와 관련된 내용을 정리하다 보니 아직 갈 길이 멀다고 느껴집니다. 
앞으로 feign, eureka, ribbon, hystrix, zuul과 관련된 글들을 정리하면서 Spring 프레임워크가 MSA 생태계를 어떻게 지원하는지 알아보겠습니다.

테스트 코드는 아래 링크를 통해 확인이 가능합니다.
- [eureka server][eureka-server-link]
- [a-service][a-service-link]
- [b-service][b-service-link]

#### REFERENCE
- <https://bcho.tistory.com/1252>
- [spring cloud - eureka 기본 설정!][eureka-reference-link]
- <https://spring.io/guides/gs/service-registration-and-discovery/>

[openfeign-blogLink]: https://junhyunny.github.io/spring/spring%20cloud/openfeign/spring-cloud-openfeign/
[eureka-server-link]: https://github.com/Junhyunny/eureka/tree/05aba484ca1fb35aedaff2f16cb225088a278b52
[a-service-link]: https://github.com/Junhyunny/a-service/tree/7472c21c74aa906ac8d41308840563b5a05a434e
[b-service-link]: https://github.com/Junhyunny/b-service/tree/12f7af0e5c4852ab428a6aba83eabaf9bf5e9774
[eureka-reference-link]: https://kouzie.github.io/spring/%EC%8A%A4%ED%94%84%EB%A7%81-%ED%81%B4%EB%9D%BC%EC%9A%B0%EB%93%9C-eureka-%EA%B8%B0%EB%B3%B8%EC%84%A4%EC%A0%95/#eureka-%ED%81%B4%EB%9D%BC%EC%9D%B4%EC%96%B8%ED%8A%B8-%EC%84%A4%EC%A0%95