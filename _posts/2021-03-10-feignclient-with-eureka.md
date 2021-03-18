---
title: "FeignClient with Eureka"
search: false
category:
  - spring-boot
  - spring-cloud
  - msa
  - junit
last_modified_at: 2021-03-12T00:00:00
---

<br>

[Spring Cloud Netflix Eureka][eureka-blogLink] 포스트를 통해 Eureka가 제공해주는 기능에 대해 알아보았습니다. 
이번 포스트는 Ereka 서버가 클라이언트 서비스들을 관리하는 환경에서 FeignClient를 사용해보도록 하겠습니다. 

## 테스트 시나리오
- Eureka 서버를 기동합니다.
- Enreka 클라이언트 서비스인 a-service(1 instance), b-service(2 instances)를 기동합니다.
- junit 테스트를 통해 a-service로 b-service 정보를 요청합니다. 
- a-service에서 b-service를 호출합니다. a-service의 FeignClient는 b-service의 서비스 이름만 알고 있습니다.
- b-service는 자신의 IP, PORT 정보를 반환합니다.
- b-service는 두 개의 인스턴스를 기동시켜 어느 서비스가 요청을 받았는지 확인합니다.

##### 테스트 시나리오 구성도
<p align="center"><img src="/images/feignclient-with-eureka-1.JPG" width="550"></p>

##### 실제 서비스 기동 정보
<p align="center"><img src="/images/feignclient-with-eureka-2.JPG"></p>
<p align="center"><img src="/images/feignclient-with-eureka-3.JPG"></p>

## a-service 구현

### 패키지 구조

<p align="left"><img src="/images/feignclient-with-eureka-4.JPG" width="350"></p>

### BServiceFeinClient 인터페이스
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

### AServiceController 클래스
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

## b-service 구현

### 패키지 구조

<p align="left"><img src="/images/feignclient-with-eureka-5.JPG" width="350"></p>

### BServiceController 클래스
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

## 테스트 코드
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

<p align="center"><img src="/images/feignclient-with-eureka-6.JPG"></p>

## OPINION
Eureka와 FeignClient를 이용하여 서비스 요청 테스트를 진행해보았습니다. 
단순하게 b-service로 API 요청하는 테스트를 구현해도 되지만 다음 주제로 load balancing에 대한 이야기를 하고 싶어 두 개의 b-service 인스턴스를 사용하였습니다. 
터미널로 여러 개의 서비스를 띄우기보다는 쿠버네티스(kubernetes)를 활용하였다면 더 좋은 글이 되었을 것 같습니다. 
이후에 도커, 쿠버네티스 관련된 글을 포스팅하고 클라우드 환경을 구축하여 테스트해보도록 하겠습니다. 

테스트 코드는 아래 링크를 통해 확인이 가능합니다.
- [eureka server][eureka-server-link]
- [a-service][a-service-link]
- [b-service][b-service-link]

#### REFERENCE
- <https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/>
- <https://junhyunny.github.io/spring-boot/spring-cloud/msa/spring-cloud-netflix-eureka/>

[eureka-blogLink]: https://junhyunny.github.io/spring-boot/spring-cloud/msa/spring-cloud-netflix-eureka/
[eureka-server-link]: https://github.com/Junhyunny/eureka/tree/05aba484ca1fb35aedaff2f16cb225088a278b52
[a-service-link]: https://github.com/Junhyunny/a-service/tree/8062a2650a3e76bcfd1b77f7f576ff3fc6f035b5
[b-service-link]: https://github.com/Junhyunny/b-service/tree/8c3e08ec7031ec634f3ae83c9d97e9f6f938255b