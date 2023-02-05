---
title: "FeignClient with Eureka"
search: false
category:
  - spring-boot
  - spring-cloud
  - msa
  - junit
last_modified_at: 2021-08-23T11:30:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Micro Service Architecture][microservice-architecture-link]
* [Spring Cloud Openfeign][spring-cloud-openfeign]
* [Spring Cloud Netflix Eureka][spring-cloud-netflix-eureka]

## 1. Practice

`FeignClient`와 `Eureka`를 함께 사용하는 예제입니다. 
`Eureka` 서버와 클라이언트를 만들어 연결하는 예제는 [Spring Cloud Netflix Eureka][spring-cloud-netflix-eureka] 포스트를 참고하시기 바랍니다. 

### 1.1. Context for Practice

다음과 같은 연습 환경을 구축하였습니다.

* `Eureka` 서버가 클라이언트 서비스들을 관리합니다. 
    * `서비스A` 인스턴스 1개, `서비스B` 인스턴스 2개를 관리합니다.
* 클라이언트 서비스들은 서로 간의 통신을 위해 `FeignClient`를 사용합니다.
* 사용자는 `서비스A`로 API 요청을 수행합니다. 
    * 사용자 역할은 `JUnit` 프레임워크를 사용한 테스트 코드로 대체합니다.
    * 100회 API 요청을 반복 수행합니다.
* `서비스A`는 요청을 처리하는 과정 중간에 `서비스B`에게 API 요청을 수행합니다.
    * `서비스B`는 자신의 포트(port) 정보와 상태를 응답합니다.
* `서비스A`는 응답 받은 `서비스B`의 상태와 자신의 상태를 사용자에게 함께 전달합니다.

<p align="center">
    <img src="/images/feignclient-with-eureka-1.JPG" width="80%" class="image__border">
</p>

### 1.2. Setup Service A

다음 작업들은 `서비스A` 모듈에서 수행합니다.

#### 1.2.1. application.yml

* 포트 번호는 8080으로 고정합니다.
* `Eureka` 클라이언트로써 `a-service-as-client` 이름을 사용합니다.

```yml
server:
  port: 8080
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

#### 1.2.2. HealthClient Interface

* `FeignClient` 이름을 `Eureka` 서버에 등록된 클라이언트 이름으로 지정합니다.
* 해당 이름을 가진 `Eureka` 클라이언트에게 API 요청을 수행합니다.
    * `Eureka` 클라이언트 이름을 사용하면 별도의 URL 정보가 필요 없습니다.
* 해당 `FeignClient`를 사용하면 자동으로 `b-service-as-client` 서비스에게 요청을 수행합니다.

```java
package cloud.in.action.client;

import cloud.in.action.domain.Health;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "b-service-as-client")
public interface HealthClient {

    @GetMapping(path = "/health")
    Health health();
}
```

#### 1.2.3. HealthController Class

* 현재 자신의 상태와 클라이언트로부터 받은 `서비스B` 상태를 함께 전달합니다.

```java
package cloud.in.action.controller;

import cloud.in.action.client.HealthClient;
import cloud.in.action.domain.Health;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
public class HealthController {

    private final Environment environment;
    private final HealthClient healthClient;

    public HealthController(Environment environment, HealthClient healthClient) {
        this.environment = environment;
        this.healthClient = healthClient;
    }

    @GetMapping("/health")
    public List<Health> health() {
        int port = Integer.parseInt(environment.getProperty("local.server.port"));
        Health healthOfServiceA = Health.builder()
                .serviceName("SERVICE-A")
                .port(port)
                .status("OK")
                .build();
        Health healthOfServiceB = healthClient.health();
        return Arrays.asList(healthOfServiceA, healthOfServiceB);
    }
}
```

#### 1.2.3. AServiceApplication Class

* `FeignClient`를 사용하기 위해 `@EnableFeignClients` 애너테이션을 추가합니다.
* `Eureka` 서버에 등록하기 위해 `@EnableEurekaClient` 애너테이션을 추가합니다.

```java
package cloud.in.action;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@EnableFeignClients
@EnableEurekaClient
@SpringBootApplication
public class AServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(AServiceApplication.class, args);
	}

}
```

### 1.3. Setup Service B

다음 작업들은 `서비스B` 모듈에서 수행합니다.

#### 1.3.1. application.yml

* `0`으로 지정하여 임의의 포트 번호를 사용합니다.
* `Eureka` 클라이언트로써 `b-service-as-client` 이름을 사용합니다.

```yml
server:
  port: 0
spring:
  application:
    name: b-service-as-client
eureka:
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: http://eureka-service:8761/eureka/
```

#### 1.3.2. HealthController Class

* 현재 자신의 상태를 전달합니다.

```java
package cloud.in.action.controller;

import cloud.in.action.domain.Health;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final Environment environment;

    public HealthController(Environment environment) {
        this.environment = environment;
    }

    @GetMapping("/health")
    public Health health() {
        int port = Integer.parseInt(environment.getProperty("local.server.port"));
        return Health.builder()
                .serviceName("SERVICE-B")
                .port(port)
                .status("OK")
                .build();
    }
}
```

#### 1.3.3. BServiceApplication Class

* `Eureka` 서버에 등록하기 위해 `@EnableEurekaClient` 애너테이션을 추가합니다.

```java
package cloud.in.action;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;

@EnableEurekaClient
@SpringBootApplication
public class BServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(BServiceApplication.class, args);
	}

}
```

## 2. Test

도커 컴포즈를 사용해 테스트 환경을 구축합니다.

### 2.1. docker-compose.yml

```yml
version: "3.9"
services:
  eureka-service:
    build: ./eureka
    ports:
      - "8761:8761"
  a-service:
    build: ./a-service
    ports:
      - "8080:8080"
  b-service:
    build: ./b-service
```

### 2.2. Run Docker Compose

`서비스B`는 두 개의 인스턴스가 필요합니다. 
`--scale` 옵션을 사용합니다.

```
$ docker-compose up -d --scale b-service=2
[+] Building 19.9s (31/31) FINISHED
 => [2021-03-08-spring-cloud-netflix-eureka-b-service internal] load build definition from Dockerfile                                                                                             0.0s
 => => transferring dockerfile: 32B                                                                                                                                                               0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service internal] load build definition from Dockerfile                                                                                        0.0s
 => => transferring dockerfile: 32B                                                                                                                                                               0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-a-service internal] load build definition from Dockerfile                                                                                             0.0s 
 => => transferring dockerfile: 32B                                                                                                                                                               0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-b-service internal] load .dockerignore                                                                                                                0.0s 
 => => transferring context: 2B                                                                                                                                                                   0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-a-service internal] load .dockerignore                                                                                                                0.0s
 => => transferring context: 2B                                                                                                                                                                   0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service internal] load .dockerignore                                                                                                           0.0s 
 => => transferring context: 2B                                                                                                                                                                   0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-b-service internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                    4.5s 
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                       4.4s 
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55 0.0s
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215     0.0s
 => [2021-03-08-spring-cloud-netflix-eureka-eureka-service internal] load build context                                                                                                           0.0s 
 => => transferring context: 674B                                                                                                                                                                 0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-a-service internal] load build context                                                                                                                0.0s 
 => => transferring context: 2.52kB                                                                                                                                                               0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-b-service internal] load build context                                                                                                                0.1s 
 => => transferring context: 945B                                                                                                                                                                 0.0s 
 => CACHED [2021-03-08-spring-cloud-netflix-eureka-a-service stage-1 2/3] WORKDIR /app                                                                                                            0.0s 
 => CACHED [2021-03-08-spring-cloud-netflix-eureka-b-service maven_build 2/6] WORKDIR /build                                                                                                      0.0s 
 => CACHED [2021-03-08-spring-cloud-netflix-eureka-eureka-service maven_build 3/6] COPY pom.xml .                                                                                                 0.0s 
 => CACHED [2021-03-08-spring-cloud-netflix-eureka-eureka-service maven_build 4/6] RUN mvn dependency:go-offline                                                                                  0.0s 
 => CACHED [2021-03-08-spring-cloud-netflix-eureka-eureka-service maven_build 5/6] COPY src ./src                                                                                                 0.0s 
 => CACHED [2021-03-08-spring-cloud-netflix-eureka-eureka-service maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                         0.0s 
 => CACHED [2021-03-08-spring-cloud-netflix-eureka-eureka-service stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                              0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-a-service] exporting to image                                                                                                                         0.3s 
 => => exporting layers                                                                                                                                                                           0.2s 
 => => writing image sha256:c45f0e1fc9ae655643cd937215ccecb4e5703b984ba30860e1e236c97e2b26ad                                                                                                      0.0s 
 => => naming to docker.io/library/2021-03-08-spring-cloud-netflix-eureka-eureka-service                                                                                                          0.0s 
 => => writing image sha256:d222a99bf00bccbe8e45860be7c56b3de1280bba9ce2ddf2ef1ef94b27178bc0                                                                                                      0.0s 
 => => naming to docker.io/library/2021-03-08-spring-cloud-netflix-eureka-b-service                                                                                                               0.0s 
 => => writing image sha256:24df9e5960e463d73f59d6acba48838f5d4c3816eeaf07471b1301282b882376                                                                                                      0.0s 
 => => naming to docker.io/library/2021-03-08-spring-cloud-netflix-eureka-a-service                                                                                                               0.0s 
 => CACHED [2021-03-08-spring-cloud-netflix-eureka-a-service maven_build 3/6] COPY pom.xml .                                                                                                      0.0s 
 => CACHED [2021-03-08-spring-cloud-netflix-eureka-a-service maven_build 4/6] RUN mvn dependency:go-offline                                                                                       0.0s 
 => CACHED [2021-03-08-spring-cloud-netflix-eureka-b-service maven_build 3/6] COPY pom.xml .                                                                                                      0.0s 
 => CACHED [2021-03-08-spring-cloud-netflix-eureka-b-service maven_build 4/6] RUN mvn dependency:go-offline                                                                                       0.0s 
 => CACHED [2021-03-08-spring-cloud-netflix-eureka-b-service maven_build 5/6] COPY src ./src                                                                                                      0.0s 
 => CACHED [2021-03-08-spring-cloud-netflix-eureka-b-service maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                              0.0s 
 => CACHED [2021-03-08-spring-cloud-netflix-eureka-b-service stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                   0.0s 
 => [2021-03-08-spring-cloud-netflix-eureka-a-service maven_build 5/6] COPY src ./src                                                                                                             0.1s 
 => [2021-03-08-spring-cloud-netflix-eureka-a-service maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                                     14.2s
 => [2021-03-08-spring-cloud-netflix-eureka-a-service stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                          0.1s 
[+] Running 4/4
 - Container 2021-03-08-spring-cloud-netflix-eureka-b-service-2       Started                                                                                                                     1.6s 
 - Container 2021-03-08-spring-cloud-netflix-eureka-eureka-service-1  Started                                                                                                                     0.9s 
 - Container 2021-03-08-spring-cloud-netflix-eureka-a-service-1       Started                                                                                                                     1.1s 
 - Container 2021-03-08-spring-cloud-netflix-eureka-b-service-1       Started                                                                                                                     0.7s 
```

### 2.3. JUnit Test

다음과 같은 내용을 확인합니다.

* `서비스A`에게 상태 정보를 100회 요청합니다.
* 응답 정보를 서비스 이름, 포트 정보로 그룹핑(grouping)합니다.
* 각 서비스로부터 몇 번 응답 받았는지 로그를 통해 확인합니다.

```java
package cloud.in.action;

import cloud.in.action.domain.Health;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@FeignClient(name = "test-client", url = "http://localhost:8080")
interface TestClient {

    @GetMapping(path = "/health")
    List<Health> health();
}

@Slf4j
@SpringBootTest
class AServiceApplicationTests {

    @Autowired
    TestClient testClient;

    @Test
    void health_check() {

        List<Health> healthList = new ArrayList<>();
        for (int index = 0; index < 100; index++) {
            healthList.addAll(testClient.health());
        }

        Map<String, List<Health>> result = healthList.stream()
                .collect(
                        Collectors.groupingBy(
                                (health) -> String.format("%s:%s", health.getServiceName(), health.getPort())
                        )
                );

        result.entrySet()
                .stream()
                .forEach((entry) -> {
                    log.info(String.format("Response count from (%s) - %s", entry.getKey(), entry.getValue().size()));
                });
    }
}
```

##### Result of Test

* `서비스A`로부터 100회 응답을 받습니다.
* 두 개의 `서비스B`로부터 각 50회씩 응답을 받습니다.
    * 포트 번호를 통해 서로 다른 인스턴스로부터 응답 받았음을 확인합니다.

```
2023-02-05 11:26:59.818  INFO 12080 --- [           main] c.in.action.AServiceApplicationTests     : Response count from (SERVICE-B:43283) - 50
2023-02-05 11:26:59.818  INFO 12080 --- [           main] c.in.action.AServiceApplicationTests     : Response count from (SERVICE-B:44105) - 50
2023-02-05 11:26:59.818  INFO 12080 --- [           main] c.in.action.AServiceApplicationTests     : Response count from (SERVICE-A:8080) - 100
```

## CLOSING

상태 정보에 포트 정보를 추가한 이유는 자동으로 이뤄지는 부하 분산(load balance)에 대해 이야기하고 싶었기 때문입니다. 
테스트 수행 결과를 보면 `서비스A`는 두 개의 `서비스B`에게 고르게 요청을 분산한 것을 볼 수 있습니다. 
이는 `FeignClient`와 `Eureka` 컴포넌트를 함께 사용하면 자동으로 부하 분산이 이뤄지기 때문입니다. 

* `FeignClient`는 내부에 `Ribbon`이라는 클라이언트 사이드 로드 밸런서 라이브러리를 사용하고 있습니다. 
* `Ribbon` 라이브러리는 `Eureka` 서버를 통해 각 서비스로의 요청 횟수를 판단할 수 있습니다.

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-03-10-feignclient-with-eureka>

#### RECOMMEND NEXT POSTS

* [Spring Cloud Netflix Ribbon][spring-cloud-netflix-ribbon-link]

#### REFERENCE

* <https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/>
* <https://junhyunny.github.io/spring-boot/spring-cloud/msa/spring-cloud-netflix-eureka/>
* <https://stackoverflow.com/questions/39663096/docker-compose-creating-multiple-instances-for-the-same-image>

[microservice-architecture-link]: https://junhyunny.github.io/information/msa/microservice-architecture/
[spring-cloud-openfeign]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/
[spring-cloud-netflix-eureka]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/spring-cloud-netflix-eureka/
[spring-cloud-netflix-ribbon-link]:https://junhyunny.github.io/spring-boot/spring-cloud/msa/spring-cloud-netflix-ribbon/