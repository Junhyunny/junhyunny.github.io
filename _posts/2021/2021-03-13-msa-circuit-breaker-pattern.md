---
title: "Circuit Breaker Pattern"
search: false
category:
  - spring-boot
  - spring-cloud
  - msa
  - design-pattern
last_modified_at: 2021-08-24T12:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [마이크로서비스 아키텍처][microservice-architecture-link]

## 1. MicroService Architecture

마이크로서비스 아키텍처(MSA, MicroService Architecture)는 한가지 일만 잘하는 서비스들이 협업하는 아키텍처입니다. 
서비스들은 서로 협업을 위해 이벤트 혹은 `REST` 통신을 수행합니다. 
`REST` 통신은 동기식 처리이기 때문에 한 서비스에서 에러가 발생하거나 느려지면 다른 서비스들로 장애가 전파됩니다. 

* `서비스F`에서 발생한 예외가 이를 의존하는 서비스들로 전파됩니다.
* 장애 전파를 막기 위해 다음과 같은 것들을 고려해야 합니다.
    * 마이크로서비스 아키텍처는 스스로 회복성(resilience)를 가지도록 설계되어야 합니다.
    * 장애가 다른 서비스로 전파되지 않도록 장애를 격리해야 합니다.

<p align="center">
    <img src="/images/msa-circuit-breaker-pattern-1.gif" width="55%">
</p>

## 2. Circuit Breaker Pattern

한 서비스가 느려지면 응답을 받지 못한 서비스의 스레드가 대기하게 되면서 사용 가능한 스레드가 줄기 때문에 장애가 전파됩니다. 
혹은 예외(exception) 처리가 미흡하면 예외가 다른 서비스로 전달되면서 장애가 전파됩니다. 
마이크로서비스 아키텍처는 장애 전파를 막기 위해 회로 차단기(circuit breaker) 패턴을 사용합니다. 
회로 차단기 패턴은 이름처럼 회로 차단기 역할을 수행하는 모듈(module)이 예외가 발생하는 경로를 차단합니다. 

### 2.1. How to work circuit breaker?

클라이언트(client), 공급자(supplier) 모두 서비스입니다. 
다른 서비스의 기능이 필요해 요청을 하는 서비스가 클라이언트, 클라이언트 서비스의 요청을 처리하는 서비스가 공급자입니다.

1. 클라이언트가 공급자로 요청을 수행합니다.
1. 장애가 없다면 회로 차단기는 요청을 그대로 전달합니다.
    * 회로가 닫혀 있다고 표현합니다.(circuit closed)
1. 공급자 서비스에 문제가 발생하면 회로 차단기는 공급자 서비스로 요청하는 경로를 차단합니다.
    * 회로가 열렸다고 표현합니다.(circuit open)
1. 회로가 열린 경우 대체 계획(fallback plan)으로 지정한 응답을 클라이언트 서비스에게 대신 전달합니다.

<p align="center">
    <img src="/images/msa-circuit-breaker-pattern-2.JPG" width="55%" class="image__border">
</p>
<center>https://martinfowler.com/bliki/CircuitBreaker.html</center>

## 3. Practice

`netflix-hystrix` 의존성을 사용해 회로 차단기 패턴을 적용시켜보았습니다. 

### 3.1. Context of Practice

다음과 같은 실습 환경을 구축하였습니다. 

* JUnit 프레임워크로 작성한 테스트 코드를 통해 API 요청을 수행합니다.
* `/post/{id}` 경로로 API 요청을 수행하며 `id`의 범위에 따라 `서비스A`는 다음과 같은 응답을 전달합니다.
    * `0 ~ 24` 범위의 경우 정상 응답을 전달합니다.
    * `25 ~ 49` 범위의 경우 임의로 1초 대기 후 정상 응답을 전달합니다.
    * `50 ~ 74` 범위의 경우 임의로 런타임 예외(runtime exception)를 던집니다.
    * `75 ~ 99` 범위의 경우 다시 정상 응답을 전달합니다.

<p align="center">
    <img src="/images/msa-circuit-breaker-pattern-3.JPG" width="80%" class="image__border">
</p>

### 3.2. pom.xml 

* `netflix-hystrix` 관련 의존성을 추가합니다.

```xml
    <properties>
        <spring-cloud.version>Hoxton.SR10</spring-cloud.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-hystrix-dashboard</artifactId>
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

### 3.3. PostController Class

* 회로 차단기 테스트를 위해 `id` 범위에 따른 응답을 전달합니다.

```java
package cloud.in.action.controller;

import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.Random;

@Log4j2
@RestController
public class PostController {

    private void sleep(int milli) {
        try {
            Thread.sleep(milli);
        } catch (Exception e) {
            log.error(e.getMessage());
        }
    }

    @GetMapping(value = "/post/{id}")
    public String getPost(@PathVariable(name = "id") Integer id) {
        boolean execution = new Random().nextBoolean();
        String result = String.format("POST(id: %s)", id);
        if (25 <= id && id < 50 && execution) {
            sleep(1000);
        } else if (50 <= id && id < 75 && execution) {
            throw new RuntimeException("occur intentional exception");
        }
        return result;
    }
}
```

## 4. Test

테스트 코드를 실행하기에 앞서 이전 단계에서 준비한 서비스를 실행합니다.

### 4.1. Properties for Circuit Breaker

회로 차단기가 적용된 서비스 객체를 준비합니다. 
적절한 회로 차단을 위해 다음과 같이 설정합니다.

* 회로 차단기를 설정할 메소드 위에 `@HystrixCommand` 애너테이션을 추가합니다.
* fallbackMethod 속성 
    * 정상적인 응답을 받지 못하는 경우 대체 계획을 지정합니다.
* commandProperties 속성
    * 회로 차단기를 위한 설정들을 추가합니다.
* `@HystrixProperty` 애너테이션을 통해 다음과 같은 설정들을 지정할 수 있습니다.
    * `execution.isolation.thread.timeoutInMilliseconds` 
        * 메소드 호출 이후 모니터링하는 시간입니다.
        * 해당 시간이 지나면 `fallbackMethod`로 지정한 메소드를 실행합니다.
        * 기본값 1000ms
    * `metrics.rollingStats.timeInMilliseconds`
        * 요청을 시작한 시점부터 요청에 대한 오류 감지를 수행하는 시간입니다. 
        * 측정되는 시간동안 오류가 발생한 비율에 따라 회로의 개폐 여부가 결정됩니다.
        * 기본값 10000ms
    * `circuitBreaker.requestVolumeThreshold`
        * 오류 감지 시간동안 최소 요청 회수를 설정할 수 있습니다.
        * 최소 요청 회수를 달성하면 요청 실패에 대한 통계를 내어 설정 값보다 높으면 회로를 차단합니다.
        * 이후 요청은 모두 실패로 간주하고 `fallbackMethod`로 지정한 메소드를 실행합니다.
        * 기본값 20회
    * `circuitBreaker.errorThresholdPercentage`
        * 오류 감지 시간, 최소 요청 회수를 모두 만족할 때 요청 실패에 대한 통계를 냅니다.
        * 이 설정 값보다 실패 확률이 높은 경우 회로를 차단합니다.
        * 이후 요청은 모두 실패로 간주하고 `fallbackMethod`로 지정한 메소드를 실행합니다.
        * 기본값 50%
    * `circuitBreaker.sleepWindowInMilliseconds`
        * 회로 차단기가 다른 서비스의 회복 상태를 확인하기까지 대기하는 시간입니다.
        * 해당 설정 시간만큼 기다린 후에 재요청을 해보고 서비스 정상 여부를 확인합니다.
        * 기본값 5000ms
* 기타 설정들 
    * <https://github.com/Netflix/Hystrix/wiki/Configuration#execution.isolation.strategy>

```java
@Service
class CircuitBreakerService {

    private final RestTemplate restTemplate = new RestTemplate();

    private String fallbackPlan(int index) {
        return "fallback plan";
    }

    @HystrixCommand(
            fallbackMethod = "fallbackPlan",
            commandProperties = {
                    @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "500"),
                    @HystrixProperty(name = "metrics.rollingStats.timeInMilliseconds", value = "10000"),
                    @HystrixProperty(name = "circuitBreaker.errorThresholdPercentage", value = "20"),
                    @HystrixProperty(name = "circuitBreaker.requestVolumeThreshold", value = "5"),
                    @HystrixProperty(name = "circuitBreaker.sleepWindowInMilliseconds", value = "3000")
            }
    )
    public String getPost(int index) {
        String url = String.format("http://localhost:8000/post/%s", index);
        return restTemplate.getForObject(url, String.class);
    }
}
```

### 4.2. Test Circuit Breaker

다음과 같은 테스트를 수행합니다. 

* `/post/{id}` 경로로 API 요청을 수행합니다.
    * 0.1초 간격으로 100회 반복 요청하며 각 인덱스가 호출 시 사용하는 `id` 값입니다.
* `@SpringBootTest` 애너테이션 추가하여 통합 테스트를 수행합니다.
* `@EnableCircuitBreaker` 애너테이션을 추가하여 회로 차단기를 활성화시킵니다. 

```java
package cloud.in.action.hystrix;

import com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand;
import com.netflix.hystrix.contrib.javanica.annotation.HystrixProperty;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.client.circuitbreaker.EnableCircuitBreaker;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

// ... CircuitBreakerService Class

@Log4j2
@EnableCircuitBreaker
@SpringBootTest
public class CircuitBreakerTest {

    @Autowired
    private CircuitBreakerService circuitBreakerService;

    void sleep(int milli) {
        try {
            Thread.sleep(milli);
        } catch (Exception e) {
            log.error(e.getMessage());
        }
    }

    @Test
    public void circuit_close_open() {
        for (int index = 0; index < 100; index++) {
            sleep(100);
            String result = circuitBreakerService.getPost(index);
            log.info(result);
        }
    }
}
```

##### Test Result

테스트 결과를 `id` 범위에 맞춰 나눠 살펴보겠습니다.

* 요청을 받은 서비스는 `0 ~ 24` 범위동안 정상적인 응답을 합니다.

```
2023-02-05 23:35:40.610  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 0)(response time: 252)
2023-02-05 23:35:40.720  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 1)(response time: 3)
2023-02-05 23:35:40.829  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 2)(response time: 3)
2023-02-05 23:35:40.938  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 3)(response time: 2)
2023-02-05 23:35:41.047  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 4)(response time: 2)
...
2023-02-05 23:35:42.794  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 20)(response time: 1)
2023-02-05 23:35:42.903  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 21)(response time: 2)
2023-02-05 23:35:43.013  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 22)(response time: 2)
2023-02-05 23:35:43.122  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 23)(response time: 2)
2023-02-05 23:35:43.230  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 24)(response time: 2)
```

* 요청을 받은 서비스는 `25 ~ 49` 범위동안 임의로 1초 대기 후 응답합니다. 
    * 현재 타임아웃(timeout) 에러 기준은 500ms이므로 요청을 받은 서비스의 스레드가 1초 멈추는 경우 에러입니다.
    * 응답 대기를 약 500ms정도 수행 후 에러로 판단하여 `fallback plan` 문자열을 반환합니다.

```
2023-02-05 23:35:43.339  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 25)(response time: 2)
2023-02-05 23:35:43.447  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 26)(response time: 2)
2023-02-05 23:35:44.072  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : fallback plan(response time: 519)
2023-02-05 23:35:44.179  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 28)(response time: 2)
2023-02-05 23:35:44.288  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 29)(response time: 2)
...
2023-02-05 23:35:49.605  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : fallback plan(response time: 511)
2023-02-05 23:35:49.715  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 46)(response time: 1)
2023-02-05 23:35:49.824  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 47)(response time: 2)
2023-02-05 23:35:49.930  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 48)(response time: 1)
2023-02-05 23:35:50.549  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : fallback plan(response time: 510)
```

* 요청을 받은 서비스는 `50 ~ 75` 범위동안 임의로 런타임 예외를 던집니다.
    * 지정한 10초 동안 5회 이상 에러가 발생하면 발생 확률에 따라 회로를 차단합니다.
    * 회로가 차단된 경우 응답 대기 시간 없이 `fallback plan` 문자열을 반환합니다.
    * 상대 서비스가 정상화 됐는지 확인하기 위해 1초마다 회로를 잠시 연결하여 실제로 API 요청을 수행합니다.

```
2023-02-05 23:35:50.661  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 50)(response time: 1)
2023-02-05 23:35:50.770  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 51)(response time: 1)
2023-02-05 23:35:50.879  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 52)(response time: 2)
2023-02-05 23:35:50.991  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : fallback plan(response time: 8)
2023-02-05 23:35:51.092  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : fallback plan(response time: 0)
...
2023-02-05 23:35:51.853  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : fallback plan(response time: 0)
2023-02-05 23:35:51.961  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : fallback plan(response time: 0)
2023-02-05 23:35:52.070  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : fallback plan(response time: 0)
2023-02-05 23:35:52.183  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 64)(response time: 4)
2023-02-05 23:35:52.289  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 65)(response time: 2)
2023-02-05 23:35:52.402  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : fallback plan(response time: 5)
...
2023-02-05 23:35:53.046  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : fallback plan(response time: 0)
2023-02-05 23:35:53.153  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : fallback plan(response time: 0)
2023-02-05 23:35:53.261  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : fallback plan(response time: 0)
```

* 요청을 받은 서비스는 `75 ~ 99` 범위동안 정상 응답합니다.
    * 상대 서비스가 정상화 됐는지 확인하기 위해 1초마다 회로를 잠시 연결하여 실제로 API 요청을 수행합니다.
    * 응답이 정상적으로 오는 것을 확인하면 회로를 다시 연결합니다.

```
2023-02-05 23:35:53.370  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : fallback plan(response time: 0)
2023-02-05 23:35:53.481  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : fallback plan(response time: 0)
2023-02-05 23:35:53.588  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : fallback plan(response time: 0)
2023-02-05 23:35:53.697  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : fallback plan(response time: 0)
2023-02-05 23:35:53.808  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 79)(response time: 3)
2023-02-05 23:35:53.917  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 80)(response time: 2)
...
2023-02-05 23:35:55.645  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 96)(response time: 1)
2023-02-05 23:35:55.755  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 97)(response time: 2)
2023-02-05 23:35:55.862  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 98)(response time: 1)
2023-02-05 23:35:55.972  INFO 20692 --- [           main] c.in.action.hystrix.CircuitBreakerTest   : POST(id: 99)(response time: 2)
```

## CLOSING

`netflix-hystrix` 의존성은 간단한 모니터링 기능도 함께 제공합니다. 
다음과 같은 의존성을 `pom.xml` 파일에 추가합니다.

```xml
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-hystrix-dashboard</artifactId>
    </dependency>
```

다음과 같은 애너테이션을 추가하여 대시 보드 기능을 활성화 할 수 있습니다.

```java
package cloud.in.action;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.hystrix.dashboard.EnableHystrixDashboard;

@EnableHystrixDashboard
@SpringBootApplication
public class ActionInBlogApplication {

    public static void main(String[] args) {
        SpringApplication.run(ActionInBlogApplication.class, args);
    }

}
```

##### Hystrix Monitroing Screen

* 서비스의 `/hystrix` 경로로 접근합니다.

<p align="center">
    <img src="/images/msa-circuit-breaker-pattern-4.JPG" width="100%" class="image__border">
</p>

##### @EnableHystrix and @EnableCircuitBreaker

회로 차단기를 활성화시키는 애너테이션은 두 개 존재합니다. 
각 애너테이션의 차이점은 다음과 같습니다.

* `@EnableHystrix`
    * `hystrix`를 사용하겠다는 의미로 내부에 `@EnableCircuitBreaker` 애너테이션이 추가되어 있습니다.
    * `hystrix`를 사용한 회로 차단기 패턴이 적용됩니다.
* `@EnableCircuitBreaker`
    * 회로 차단기 패턴을 구현한 라이브러리를 활성화시킵니다.
    * `hystrix` 이 외에 다른 의존성을 사용할 수 있습니다.

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-03-13-msa-circuit-breaker-pattern>

#### RECOMMEND NEXT POSTS

* [Spring Cloud Netflix Hystrix][spring-cloud-netflix-hystrix-link]

#### REFERENCE

* <https://martinfowler.com/bliki/CircuitBreaker.html>
* <https://bcho.tistory.com/1247>
* <https://sup2is.github.io/2020/04/12/spring-cloud-hystrix-circuit-breaker-with-fallback.html>
* <https://github.com/Netflix/Hystrix/wiki/Configuration#execution.isolation.strategy>

[microservice-architecture-link]: https://junhyunny.github.io/information/msa/microservice-architecture/
[spring-cloud-netflix-hystrix-link]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/junit/spring-cloud-netflix-hystrix/