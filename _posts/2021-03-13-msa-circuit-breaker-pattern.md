---
title: "MSA Circuit Breaker Pattern"
search: false
category:
  - spring
  - spring cloud
  - msa
  - circuit-breaker
  - netflix-oss
last_modified_at: 2021-03-16T00:00:00
---

<br>

마이크로 서비스 아키텍처(MSA, Micro Service Architecture)는 한가지 일만 잘하는 서비스들이 협업하는 아키텍처입니다. 
서비스들은 Rest API 같은 동기식 처리 방법을 통해 협업을 수행합니다. 
동기식 처리 방식의 문제점은 한 서비스에서 에러가 발생하거나 느려지면 이를 호출하는 다른 서비스들로 장애가 전파된다는 것입니다. 

##### 마이크로 서비스 아키텍처 장애 전파
<p align="center"><img src="/images/msa-circuit-breaker-pattern-1.gif" width="500"></p>

그렇기 때문에 마이크로 서비스 아키텍처는 스스로 회복성(Resilience)를 가지도록 구성되어야 합니다.([Micro Service Architecture][msa-blogLink]) 
> **Micro Service Architecture 핵심 원칙, 회복성(Resilience)**<br>
> 마이크로 서비스는 자연스러운 메커니즘을 통해 장애를 격리시킵니다.

이번 포스트는 마이크로 서비스 아키텍처에서 장애를 격리시켜 전파를 막는 방법에 대해 알아보도록 하겠습니다.

## Circuit Breaker Pattern
요청을 처리하는 서비스가 느려지는 경우 장애가 전파되는 이유는 응답을 받지 못한 서비스의 스레드가 대기하게 되면서 사용 가능한 스레드가 줄어들기 때문입니다. 
요청을 처리하는 서비스에 에러가 발생하면 exception이 발생하면서 장애가 전파됩니다. 

마이크로 서비스 아키텍처는 장애 전파를 막기 위해 **`Circuit Breaker 패턴`**을 사용합니다. 
Circuit Breaker 패턴은 이름처럼 회로 차단기 역할을 수행합니다. 
서비스와 서비스 사이에 API 요청을 차단할 수 있는 circuit breaker를 추가합니다. 

##### Circuit Breaker 동작
1. client 서비스에서 supplier 서비스로 요청을 수행합니다.
1. 장애가 없다면 circuit breaker는 요청은 이상없이 전달됩니다.(circuit close)
1. supplier 서비스에 문제가 발생하면 circuit breaker는 supplier 서비스로의 요청을 차단합니다.(circuit open)
1. Fall back으로 지정한 응답을 client 서비스로 전달합니다.

<p align="center"><img src="/images/msa-circuit-breaker-pattern-2.JPG"></p>
<center>이미지 출처, https://martinfowler.com/bliki/CircuitBreaker.html</center><br>

위 이미지는 circuit breaker가 서비스로 보일 수 있으니 조금 수정해보았습니다. 
circuit breaker는 실제로 client 서비스에 추가되어 있습니다. 

<p align="center"><img src="/images/msa-circuit-breaker-pattern-3.JPG"></p>

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

## Hystrix를 사용한 Circuit Breaker 패턴 적용하기
간단한 테스트 코드를 통해 Circuit Breaker 패턴을 적용시켜보도록 하겠습니다. 

### Circuit Breaker 테스트 시나리오
- 테스트 코드를 이용해 a-service의 **`/hystrix-test/{index}`** 경로로 API 요청을 수행합니다.
- API 요청을 100회 반복하며 hystrix 설정에 따라 회로(circuit)이 정상적으로 개폐(open/close) 되는지 확인합니다.

### pom.xml
- spring-cloud-starter-netflix-hystrix 의존성을 추가합니다.

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
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-openfeign</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-hystrix-dashboard</artifactId>
        </dependency>

        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <scope>provided</scope>
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

### application.yml
```yml
server:
  port: 8000
spring:
  application:
    name: a-service
```

### AServiceController 클래스
- **`/hystrix-test/{index}`** 경로로 API 요청을 전달받습니다.
- index가 10 미만인 경우에는 정상적인 응답을 전달합니다.
- 10 이상 40 미만인 경우에는 임의로 1초 대기를 수행합니다.(서비스 성능 지연 발생)
- 40 이상 70 미만인 경우에는 임의로 exception을 발생시킵니다.(서비스 장애 발생)
- 70 이상부터는 정상적인 응답을 전달합니다.(정상)

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

### 테스트 코드
- @EnableCircuitBreaker 애너테이션을 통해 CircuitBreaker 패턴을 적용합니다.
- 테스트 코드에서 0.1 초 간격으로 API 요청을 수행합니다.
- API 요청을 수행하는 getHystrixTest 메소드 위에 @HystrixCommand 애너테이션을 추가합니다.
- API 응답 결과를 로그로 출력하여 정상적인 응답인지 fallback 메소드로부터 전달받은 응답인지 확인합니다.

#### @HystrixCommand 애너테이션 설정
- 자세한 설정은 <https://github.com/Netflix/Hystrix/wiki/Configuration#execution.isolation.strategy> 참조
- fallbackMethod, fallback 메소드를 지정합니다. 동일 클래스에 위치해야하며 파라미터가 동일해야합니다.
- commandProperties, circuit breaker를 적용하는데 필요한 설정들을 추가합니다.
- execution.isolation.thread.timeoutInMilliseconds 
  - 메소드 호출 이후 모니터링하는 시간입니다.
  - 해당 시간이 지나면 fallback 메소드를 수행합니다.
  - 기본 값 1000ms
- metrics.rollingStats.timeInMilliseconds
  - 요청이 들어오는 시점부터 요청에 대한 오류 감지를 수행하는 시간을 설정합니다.
  - 측정되는 시간동안 오류가 발생한 비율이 얼마나 되느냐에 따라 회로의 개폐 여부가 결정됩니다.
  - 기본 값 10000ms
- circuitBreaker.requestVolumeThreshold
  - 오류 감지 시간동안 최소 요청 회수를 설정할 수 있습니다.
  - 최소 요청 회수를 달성하면 요청 실패에 대한 통계를 내어 설정 값보다 높으면 회로를 차단합니다.
  - 이후 요청은 모두 실패로 간주하고 fallback을 전달합니다. 
  - 기본 값 20회
- circuitBreaker.errorThresholdPercentage
  - 오류 감지 시간, 최소 요청 회수를 모두 만족할 때 요청 실패에 대한 통계를 냅니다.
  - 이 설정 값보다 실패 확률이 높은 경우 회로를 차단하고 이후 요청은 모두 실패로 간주하고 fallback을 전달합니다. 
  - 기본 값 50%
- circuitBreaker.sleepWindowInMilliseconds
  - hystrix가 서비스의 회복 상태를 확인할 때까지 대기하는 시간입니다.
  - 해당 설정 시간만큼 기다린 후에 재요청을 해보고 서비스 정상 여부를 확인합니다.
  - 기본 값 5000ms

```java
package cloud.in.action.hystrix;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.client.circuitbreaker.EnableCircuitBreaker;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand;
import com.netflix.hystrix.contrib.javanica.annotation.HystrixProperty;

import lombok.extern.log4j.Log4j2;

@Service
class HystrixTestService {

    @HystrixCommand(fallbackMethod = "fallbackHystrixTest",
            commandProperties = { @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "500"),
                    @HystrixProperty(name = "metrics.rollingStats.timeInMilliseconds", value = "10000"),
                    @HystrixProperty(name = "circuitBreaker.errorThresholdPercentage", value = "20"),
                    @HystrixProperty(name = "circuitBreaker.requestVolumeThreshold", value = "5"),
                    @HystrixProperty(name = "circuitBreaker.sleepWindowInMilliseconds", value = "3000") })
    public String getHystrixTest(int index) {
        return new RestTemplate().getForObject("http://localhost:8000/hystrix-test/" + index, String.class);
    }

    public String fallbackHystrixTest(int index) {
        return "fallback hystrix test";
    }
}

@Log4j2
@EnableCircuitBreaker
@SpringBootTest
public class HystrixTest {

    @Autowired
    private HystrixTestService service;

    @Test
    public void test() {
        for (int index = 0; index < 100; index++) {
            try {
                Thread.sleep(100);
            } catch (Exception e) {
                log.error(e.getMessage(), e);
            }
            long start = System.currentTimeMillis();
            String response = service.getHystrixTest(index);
            long end = System.currentTimeMillis();
            log.info("index: " + index + ", waiting time: " + (end - start) + " ms, response: " + response);
        }
    }
}
```

### 테스트 결과
a-service를 기동시킨 상태에서 테스트를 수행합니다. 

##### 서비스 정상인 상태
- 9번 인덱스까지 정상적으로 API 요청을 수행하였습니다.
<p align="center"><img src="/images/msa-circuit-breaker-pattern-4.JPG"></p>

##### 서비스 응답 지연인 상태
- 10번 인덱스부터는 API 요청 실패가 발생합니다.
- API 요청 실패를 하더라도 500ms 대기합니다.
- 15번 인덱스에서 일정 횟수 API 요청 실패로 인해 회로를 차단합니다. 대기 없이 빠르게 실패합니다.(open)
<p align="center"><img src="/images/msa-circuit-breaker-pattern-5.JPG"></p>

##### 서비스 정상 여부 확인
- circuitBreaker.sleepWindowInMilliseconds 설정에 맞게 3초 대기 후 재요청을 수행하였습니다.
- API 요청이 성공하여 몇 차례 더 수행하지만 성공 확률이 낮아 다시 회로를 차단합니다.(open)
<p align="center"><img src="/images/msa-circuit-breaker-pattern-6.JPG"></p>

##### 서비스 정상
- 약 3초 대기 후 재요청을 수행합니다.
- API 요청이 성공하여 지속적으로 API 요청을 수행합니다.
- 회로가 다시 닫혔습니다.(close)
<p align="center"><img src="/images/msa-circuit-breaker-pattern-7.JPG"></p>

## Hystrix Monitoring 기능 사용
dependency와 애너테이션만 추가하면 간단히 모니터링 기능을 사용할 수 있습니다. 

### Hystrix monitoring dependency
```xml
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-hystrix-dashboard</artifactId>
    </dependency>
```

### application.yml
```yml
server:
  port: 8000
spring:
  application:
    name: a-service
```

### AServiceApplication 클래스
```java
package cloud.in.action;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.hystrix.dashboard.EnableHystrixDashboard;
import org.springframework.cloud.openfeign.EnableFeignClients;

@EnableFeignClients
@EnableHystrixDashboard
@SpringBootApplication
public class AServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AServiceApplication.class, args);
    }

}
```

##### Hystrix Monitroing 화면
- http://localhost:8000/hystrix로 접속하면 아래와 같은 화면이 나옵니다.
<p align="center"><img src="/images/msa-circuit-breaker-pattern-8.JPG"></p>

## OPINION
MSA에서 장애 전파를 방지하기 위해 어떤 메커니즘을 사용하는지 정리해보았습니다. 
Circuit Breaker 패턴을 구현한 Hystrix 컴포넌트와 간단한 테스트 코드를 통해 Circuit Breaker 패턴의 동작 방식도 확인해보았습니다. 
이번 포스트에서 Hystrix 컴포넌트를 사용한 방법은 코드의 구현을 복잡하게 만드는 불편한 방식이었습니다. 
다음 포스트에서 Spring Cloud Netflix Hystrix에 대해 정리하면서 FeignClient와 함께 사용하는 간단한  방법에 대해 정리해보도록 하겠습니다.

테스트 코드는 [a-service][a-service-link]를 통해 확인이 가능합니다.

글을 작성하다 보니 @EnableHystrix, @EnableCircuitBreaker 두 애너테이션의 차이점이 궁금하여 추가적으로 정리해보았습니다.
> **@EnableHystrix, @EnableCircuitBreaker 차이점**<br>
> @EnableHystrix 애너테이션은 Hystrix를 사용하겠다는 의미로 내부에 @EnableCircuitBreaker 애너테이션이 추가되어 있습니다. 
> Hystrix를 이용한 Circuit Breaker 패턴이 적용됩니다. 
> @EnableCircuitBreaker 애너테이션은 Circuit Breaker 패턴을 구현한 라이브러리가 있다면 패턴이 적용됩니다. 
> Hystrix를 이 외에 다른 의존성을 사용할 수 있습니다.

#### REFERENCE
- <https://martinfowler.com/bliki/CircuitBreaker.html>
- <https://bcho.tistory.com/1247>
- <https://sup2is.github.io/2020/04/12/spring-cloud-hystrix-circuit-breaker-with-fallback.html>
- <https://github.com/Netflix/Hystrix/wiki/Configuration#execution.isolation.strategy>

[msa-blogLink]: https://junhyunny.github.io/information/msa/microservice-architecture/
[eureka-blogLink]: https://junhyunny.github.io/spring/spring%20cloud/msa/netflix-oss/spring-cloud-netflix-eureka/
[a-service-link]: https://github.com/Junhyunny/a-service/tree/34529445b58cac8eb34f7bf971ccc5396b9a5474