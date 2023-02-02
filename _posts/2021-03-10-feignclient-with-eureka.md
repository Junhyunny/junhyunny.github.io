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

⚠️ 해당 포스트는 2021년 8월 23일에 재작성되었습니다. (불필요 코드 제거)

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Micro Service Architecture][microservice-architecture-link]
- [Spring Cloud Openfeign][spring-cloud-openfeign]
- [Spring Cloud Netflix Eureka][spring-cloud-netflix-eureka]

👉 이어서 읽기를 추천합니다.
- [Spring Cloud Netflix Ribbon][spring-cloud-netflix-ribbon-link]

## 1. 테스트 시나리오
Ereka 서버가 클라이언트 서비스들을 관리하는 환경에서 FeignClient를 사용해보도록 하겠습니다. 
- Eureka 서버를 기동합니다.
- Enreka 클라이언트 서비스인 a-service(1 instance), b-service(2 instances)를 기동합니다.
- junit 테스트를 통해 a-service로 b-service 정보를 요청합니다. 
- a-service에서 b-service를 호출합니다. a-service의 FeignClient는 b-service의 서비스 이름만 알고 있습니다.
- b-service는 자신의 IP, PORT 정보를 반환합니다.
- b-service는 두 개의 인스턴스를 기동시켜 어느 서비스가 요청을 받았는지 확인합니다.

##### 테스트 시나리오 구성도
<p align="center"><img src="/images/feignclient-with-eureka-1.JPG" width="65%"></p>

##### 실제 서비스 기동 정보

<p align="center"><img src="/images/feignclient-with-eureka-2.JPG"></p>

<p align="center"><img src="/images/feignclient-with-eureka-3.JPG"></p>

## 2. a-service 구현 코드

### 2.1. 패키지 구조

```
./
|-- a-service.iml
|-- mvnw
|-- mvnw.cmd
|-- pom.xml
`-- src
    |-- main
    |   |-- java
    |   |   `-- cloud
    |   |       `-- in
    |   |           `-- action
    |   |               |-- AServiceApplication.java
    |   |               |-- controller
    |   |               |   `-- AServiceController.java
    |   |               `-- proxy
    |   |                   `-- BServiceFeinClient.java
    |   `-- resources
    |       `-- application.yml
    `-- test
        `-- java
            `-- cloud
                `-- in
                    `-- action
                        `-- AServiceApplicationTests.java
```

### 2.2. BServiceFeinClient 인터페이스
- b-service를 호출할 때 사용할 FeignClient를 작성합니다.
- URL 정보 없이 호출할 서비스의 이름만 제공합니다.

```java
package cloud.in.action.proxy;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "b-service")
public interface BServiceFeinClient {

    @GetMapping(path = "/information")
    String requestInformation();
}
```

### 2.3. AServiceController 클래스
- **`/call-b-service`** path는 junit 테스트로부터 요청을 받는 endpoint 입니다.
- 추가적인 전달받은 요청을 b-service로 by-pass 합니다.

```java
package cloud.in.action.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import cloud.in.action.proxy.BServiceFeinClient;

@RestController
public class AServiceController {

    private final BServiceFeinClient client;

    public AServiceController(BServiceFeinClient client) {
        this.client = client;
    }

    @GetMapping(path = "/call-b-service")
    public String requestCallBService() {
        return client.requestInformation();
    }
}
```

## 3. b-service 구현 코드

### 3.1. 패키지 구조

```
./
|-- b-service.iml
|-- mvnw
|-- mvnw.cmd
|-- pom.xml
`-- src
    |-- main
    |   |-- java
    |   |   `-- cloud
    |   |       `-- in
    |   |           `-- action
    |   |               |-- BServiceApplication.java
    |   |               `-- controller
    |   |                   `-- BServiceController.java
    |   `-- resources
    |       `-- application.yml
    `-- test
        `-- java
            `-- cloud
                `-- in
                    `-- action
                        `-- BServiceApplicationTests.java
```

### 3.2. BServiceController 클래스
- 서비스에게 처리 부하를 주기 위해 Thread.sleep(50)을 수행합니다.
- 자신의 IP 주소와 PORT 번호를 응답으로 전달합니다.

```java
package cloud.in.action.controller;

import java.net.InetAddress;
import java.net.UnknownHostException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.log4j.Log4j2;

@Log4j2
@RestController
public class BServiceController {

    @Autowired
    private Environment environment;

    @GetMapping(value = "/information")
    public String requestInformation() {
        String host = null;
        try {
            Thread.sleep(50);
            host = InetAddress.getLocalHost().getHostAddress();
        } catch (UnknownHostException e) {
            log.error(e.getMessage(), e);
        } catch (InterruptedException e) {
            log.error(e.getMessage(), e);
        }
        return "host: " + host + ", port: " + environment.getProperty("local.server.port");
    }
}
```

## 4. 테스트 코드
- a-service로 1000회의 API 요청을 수행합니다.
- 응답으로 전달받은 b-service의 정보가 각각 어느 인스턴스로부터 전달받았는지 로그를 통해 확인합니다.

```java
package cloud.in.action;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import com.google.gson.GsonBuilder;

import lombok.extern.log4j.Log4j2;

@FeignClient(name = "a-service")
interface ASerivceClient {

    @GetMapping(path = "/call-b-service")
    String requestCallBService();
}

@Log4j2
@SpringBootTest
class AServiceApplicationTests {

    @Autowired
    private ASerivceClient client;

    @Test
    void test() {
        Map<String, Integer> result = new HashMap<>();
        for (int index = 0; index < 1000; index++) {
            String response = client.requestCallBService();
            if (result.containsKey(response)) {
                result.put(response, result.get(response) + 1);
            } else {
                result.put(response, Integer.valueOf(1));
            }
        }
        log.info("result: " + new GsonBuilder().setPrettyPrinting().create().toJson(result));
    }

}
```

##### 테스트 수행 로그
- b-service, 9000 포트를 가진 인스턴스로 500회 응답받았습니다.
- b-service, 50032 포트를 가진 인스턴스로 500회 응답받았습니다.

<p align="center"><img src="/images/feignclient-with-eureka-4.JPG"></p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-03-10-feignclient-with-eureka>

#### REFERENCE
- <https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/>
- <https://junhyunny.github.io/spring-boot/spring-cloud/msa/spring-cloud-netflix-eureka/>

[microservice-architecture-link]: https://junhyunny.github.io/information/msa/microservice-architecture/
[spring-cloud-openfeign]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/
[spring-cloud-netflix-eureka]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/spring-cloud-netflix-eureka/

[spring-cloud-netflix-ribbon-link]:https://junhyunny.github.io/spring-boot/spring-cloud/msa/spring-cloud-netflix-ribbon/