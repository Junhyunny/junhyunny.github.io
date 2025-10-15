---
title: "개틀링(gatling) 부하 테스트 예제"
search: false
category:
  - gatling
  - load-test
last_modified_at: 2025-03-09T23:55:00
---

<br/>

## 0. 들어가면서

최근 다른 프로젝트를 서포트 하게 되었는 데, 그 곳에선 부하 테스트 도구로 개틀링(gatling)을 사용하고 있었다. 부하 테스트를 돕긴 했지만, 파라미터 정도만 튜닝해보는 수준이었다. 처음 사용해보는 도구라 상당히 흥미로웠기 때문에 더 자세히 알고 싶어졌다. 이 글에 개틀링의 개념과 초기 셋업을 하는 과정을 정리했다.

## 1. Gatling

개틀링은 한 IT 컨설팅 팀이 CI/CD 파이프라인에서 사용할 적절한 부하 테스트 도구가 없어서 만들었다고 한다. `Load Test As Code`를 위해 태어났다. [위키피디아](https://en.wikipedia.org/wiki/Gatling_(software))에 따르면 개틀링은 스칼라(scala), Akka, 네티(netty) 기반으로 동작하는 부하(퍼포먼스) 테스팅 프레임워크다. 다음과 같은 특징을 갖는다.

- 네티(netty) 기반의 비동기 이벤트 기반 아키텍처를 사용하기 때문에 높은 동시성을 효율적으로 시뮬레이션할 수 있다.
- 부하 테스트에 대한 결과를 HTML 리포트로 만들어 제공한다.
- 개발자가 친숙한 DSL(domain specific language)을 제공한다.
- Jenkins, Github Actions, Gitlab CI/CD 같은 파이프라인에 부하 테스트를 작성하기 용이하다.

## 2. Glossary

개틀링의 동작 과정을 이해하기 위해 몇 가지 용어들에 대해 정리한다. 우선 가상 사용자(virtual user)라는 개념이 있다. 개틀링은 가상 사용자를 각자 고유한 데이터를 가진 채 탐색 경로가 다를 수 있는 사용자로써 처리할 수 있다. 다른 도구들은 가상 사용자를 스레드로 구현했지만, 개틀링은 가상 사용자를 비동기 이벤트 처리 방식의 메시지(message)로 처리한다. 스레드 방식은 가상 사용자마다 CPU, 메모리를 사용하기 때문에 운영 체제의 스레드 한계에 의해 처리할 수 있는 가상 사용자 수가 제한된다. 개틀링은 비동기 이벤트 처리 방식을 사용하기 때문에 매우 많은 수의 사용자를 처리할 수 있는 확장성이 뛰어나다. 

시나리오(senario)에는 사용자의 행동이나 테스터가 측정하고 싶은 내용을 정의한다. 테스터는 개틀링이 제공하는 스크립트(script)로 시나리오를 작성해야 한다. 시나리오는 부하 테스트의 의미 있는 결과를 얻기 위해 생성해야 한다. 아래 에시와 같이 시나리오를 코드로 작성한다. 

- 일반 사용자가 깃허브 사이트에 2회 GET 요청을 보낸다. 사용자는 각 요청 이후에 잠시 동안 기다린다. 

```java
scenario("Standard User")
  .exec(
    http("Access Github").get("https://github.com"),
    pause(2, 3),
    http("Search for 'gatling'").get("https://github.com/search?q=gatling"),
    pause(2)
  );
```

부하 테스트를 위해선 가상의 사용자를 시나리오에 유입(injection)해야 한다. 오픈 시스템(open system)인 클로즈 시스템(close system)인지 구분하여 사용자를 유입한다. 사용자를 유입하는 방법은 매우 다양하니 [문서](https://docs.gatling.io/reference/script/core/injection/)를 참고하길 바란다. 아래는 사용자를 시나리오에 유입하는 간단한 예제 코드이다. 

```java
// open model
setUp(
  scn.injectOpen(
    // first ramp the arrival rate to 100 users/s in 1 minute
    rampUsersPerSec(0).to(100).during(Duration.ofMinutes(1)),
    // then keep a steady rate of 100 users/s during 10 minutes
    constantUsersPerSec(100).during(Duration.ofMinutes(10))
  )
);

// closed model
setUp(
  scn.injectClosed(
    // first ramp the number of concurrent users to 100 users in 1 minute
    rampConcurrentUsers(0).to(100).during(Duration.ofMinutes(1)),
    // then keep a steady number of concurrent users of 100 users during 10 minutes
    constantConcurrentUsers(100).during(Duration.ofMinutes(10))
  )
);
```

부하 생성기(load generator)는 트래픽을 생성하는 가상 사용자를 시뮬레이션한다. 부하 발생기는 특정 수준의 부하를 부과하여 실제 시나리오를 테스트한다. 시스템과 상호작용을 시뮬레이션하여 요청을 전송하고 응답을 수신한다. 응답은 수집, 저장, 정렬되어 부하 테스트 보고서로 만들어진다. 부하 생성기는 인젝터(injector), 로드 에이전트(load agent), 러너(runner)라고 한다. 

시뮬레이션(simulation)은 부하 테스트에 대한 설명이다. 여러 사용자 집단이 실행되는 방식, 즉 어떤 시나리오를 실행하고 새로운 가상 사용자를 어떻게 유입할지 설명한다. 다음과 같이 여러 시나리오들과 사용자 유입 방식을 셋업 함수를 통해 시뮬레이션으로 정의한다.

```java
ScenarioBuilder stdUser = scenario("Standard User");
ScenarioBuilder admUser = scenario("Admin User");
ScenarioBuilder advUser = scenario("Advanced User");

setUp(
  stdUser.injectOpen(atOnceUsers(2000)),
  admUser.injectOpen(nothingFor(60), rampUsers(5).during(400)),
  advUser.injectOpen(rampUsers(500).during(200))
);
```

세션(session)은 가상 사용자의 상태 정보로 기본적으로 맵(map) 객체다. 피더(feeder)나 check, saveAs 메소드를 통해 세션 정보를 저장할 수 있다. 피더는 테스터가 외부 소스의 데이터를 가상 사용자 세션에 주입할 수 있는 편리한 API이다. 프로그래밍을 통해 개발자가 랜덤한 데이터를 만들어주거나 CSV 파일을 사용자 데이터로 주입하는 것도 가능하다. check, saveAs 메소드는 테스트 타겟 서버로부터 받은 응답을 분석할 때 사용한다. 응답의 일부를 세션에 저장할 수 있다.

어설션(assertion)은 응답 시간이나 실패한 요청 수와 같은 글로벌 통계가 전체 시뮬레이션에 대한 예상과 일치하는지 확인하는데 사용한다. 예를 들면 다음과 같이 어설션을 등록한다.

- 모든 요청(global 스코프)에 대한 최대 응답 속도가 50ms 미만이길 예상한다.
- 모든 요청에 대한 응답 성고률이 95% 초과이길 예상한다.

```java
setUp(scn.injectOpen(injectionProfile))
  .assertions(
    global().responseTime().max().lt(50),
    global().successfulRequests().percent().gt(95.0)
  );
```

마지막으로 리포트(reports)는 시뮬레이션이 끝나면 자동으로 생성되는 HTML 파일을 의미한다. 실행하면 브라우저에서 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2025/gatling-load-test-example-01.png" width="100%" class="image__border">
</div>
<center>https://docs.gatling.io/reference/stats/reports/oss/</center>

## 3. Example

간단한 부하 테스트 코드를 작성해보자. 부하 테스트를 수행하기 위한 프로젝트와 테스트 대상 서비스 프로젝트 두 개가 필요하다. 먼저 테스트 대상 서비스를 살펴본다.

### 3.1. Test target service 

테스트 대상 서비스의 엔드포인트를 살펴보자. 테스트 대상 엔드포인트는 80% 확률로 성공한다. 성공하는 경우 파라미터로 전달 받는 username 정보와 UUID 값을 함께 반환한다. 실패하는 경우 RuntimeException이 발생하지만, @Retryable 애너테이션에 의해 기본적으로 재시도를 수행한다. 재시도 백오프(backoff) 시간은 기본 값인 1초를 사용한다.

```java
package action.in.blog.controller;

import org.springframework.retry.annotation.Retryable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

record GeneratedKeyResponse(String username, UUID key) {
}

@RestController
public class TargetController {

    private boolean is80PercentSuccess() {
        return Math.random() < 0.8;
    }

    @Retryable(retryFor = RuntimeException.class)
    @GetMapping("/target")
    public GeneratedKeyResponse generate(@RequestParam String username) {
        if (is80PercentSuccess()) {
            return new GeneratedKeyResponse(
                    username,
                    UUID.randomUUID()
            );
        } else {
            throw new RuntimeException("Something went wrong");
        }
    }
}
```

### 3.2. Load test with gatling

[이 페이지](https://docs.gatling.io/tutorials/scripting-intro/#install-gatling)에서 개틀링 코드를 다운로드 받을 수 있다. 메이븐(maven) 프로젝트로 제공한다. 기본적인 예제 코드를 함께 제공하기 때문에 이를 테스트 시나리오에 맞게 변경하면 된다. 우선 Simulation 추상 클래스를 상속 받는 클래스가 필요하다.

```java
package computerdatabase;

import io.gatling.javaapi.core.ChainBuilder;
import io.gatling.javaapi.core.FeederBuilder;
import io.gatling.javaapi.core.ScenarioBuilder;
import io.gatling.javaapi.core.Simulation;
import io.gatling.javaapi.http.HttpProtocolBuilder;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.http;
import static io.gatling.javaapi.http.HttpDsl.status;

public class SimpleCustomSimulator extends Simulation {

  // ...
}
```

다음 HTTP 요청을 위한 프로토콜 객체를 만든다. 테스트 대상 서비스의 주소를 기본 URL로 지정한다.

```java
public class SimpleCustomSimulator extends Simulation {

    HttpProtocolBuilder httpProtocol =
            http.baseUrl("http://localhost:8080")
                    .acceptHeader("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .acceptLanguageHeader("en-US,en;q=0.5")
                    .acceptEncodingHeader("gzip, deflate")
                    .userAgentHeader(
                            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/119.0"
                    );
  
    ...
}
```

시나리오를 만든다. 간단하게 테스트 대상 엔드포인트로 요청을 보낸다. 

- 피드를 사용해 사용자 정보를 전달한다. csv 피드를 사용하고, csv 파일에 담긴 정보를 랜덤하게 사용한다.
- 응답 상태 코드가 200일 것으로 예상한다.
- 실행 체인을 시나리오에 등록한다.

```java
public class SimpleCustomSimulator extends Simulation {

    FeederBuilder<String> feeder = csv("search.csv").random();

    ChainBuilder generateKey = exec(
            feed(feeder),
            http("Home")
                    .get("/target?username=${username}")
                    .check(
                            status().is(200)
                    )
    );

    ScenarioBuilder generateKeyScenario = scenario("GenerateKey").exec(generateKey);

    ...
}
```

`search.csv` 파일에는 다음과 같은 데이터가 저장되어 있다.

```
username
junhyunny
tangerine
jua
sia
```

setup 블럭에 시뮬레이션을 정의한다. 

- 시나리오에 ramp 방식으로 사용자를 유입한다. 10초동안 10명 사용자까지 늘려나간다.
- 부하 테스트 성공 여부는 최대 응답 시간이 1초 미만, 성공적인 요청이 95%를 초과해야 한다.

```java
public class SimpleCustomSimulator extends Simulation {

    ...
  
    {
        setUp(
                generateKeyScenario.injectOpen(rampUsers(10).during(10))
        ).assertions(
                global().responseTime().max().lt(1000),
                global().successfulRequests().percent().gt(95.0)
        ).protocols(httpProtocol);
    }
}
```

## 4. Verify

개틀링을 실행한다. 메이븐 프로젝트이기 때문에 다음과 같은 명령어를 사용한다. 그레이들(gradle) 프로젝트인 경우 명령어가 다르다.

```
$ ./mvnw gatling:test
```

위 명령어를 실행하면 높은 확률로 실패한다. 리트라이 확률이 20%나 되고 리트라이 백오프 시간이 1초이기 때문에 어설션의 첫번째 조건을 만족하지 못할 확률이 높다. 어설션 조건을 만족하지 못하면 개틀링 테스트가 실패한다.

```
...

Simulation computerdatabase.SimpleCustomSimulator started...

========================================================================================================================
2025-03-08 15:53:39 GMT                                                                               5s elapsed
---- Requests -----------------------------------------------------------------------|---Total---|-----OK----|----KO----
> Global                                                                             |         5 |         5 |         0
> Home                                                                               |         5 |         5 |         0

---- GenerateKey -------------------------------------------------------------------------------------------------------
[########################################################                                                        ]   50%
          waiting:         5 / active:         0  / done:         5
========================================================================================================================


========================================================================================================================
2025-03-08 15:53:43 GMT                                                                               9s elapsed
---- Requests -----------------------------------------------------------------------|---Total---|-----OK----|----KO----
> Global                                                                             |        10 |        10 |         0
> Home                                                                               |        10 |        10 |         0

---- GenerateKey -------------------------------------------------------------------------------------------------------
[################################################################################################################]  100%
          waiting:         0 / active:         0  / done:        10
========================================================================================================================

Parsing log file(s)...
Parsing log file(s) done in 0s.
Generating reports...

========================================================================================================================
---- Global Information -------------------------------------------------------------|---Total---|-----OK----|----KO----
> request count                                                                      |        10 |        10 |         0
> min response time (ms)                                                             |         5 |         5 |         -
> max response time (ms)                                                             |     2,040 |     2,040 |         -
> mean response time (ms)                                                            |       413 |       413 |         -
> response time std deviation (ms)                                                   |       671 |       671 |         -
> response time 50th percentile (ms)                                                 |         9 |         9 |         -
> response time 75th percentile (ms)                                                 |     1,009 |     1,009 |         -
> response time 95th percentile (ms)                                                 |     2,040 |     2,040 |         -
> response time 99th percentile (ms)                                                 |     2,040 |     2,040 |         -
> mean throughput (rps)                                                              |         1 |         1 |         -
---- Response Time Distribution ----------------------------------------------------------------------------------------
> OK: t < 800 ms                                                                                              7    (70%)
> OK: 800 ms <= t < 1200 ms                                                                                   2    (20%)
> OK: t >= 1200 ms                                                                                            1    (10%)
> KO                                                                                                          0     (0%)
========================================================================================================================

Reports generated, please open the following file: file:///Users/junhyunny/Desktop/2025-03-09-gatling-load-test-example/gatling/target/gatling/simplecustomsimulator-20250308155333406/index.html
Global: max of response time is less than 1000.0 : false (actual : 2040.0)
Global: percentage of successful events is greater than 95.0 : true (actual : 100.0)
[INFO] ------------------------------------------------------------------------
[INFO] BUILD FAILURE
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  13.052 s
[INFO] Finished at: 2025-03-09T00:53:43+09:00
[INFO] ------------------------------------------------------------------------
```

개틀링 테스트가 성공하든 실패하든 리포트는 생성된다. 실행 결과 마지막에 표시된 리포트 파일 경로를 열면 브라우저 화면에서 테스트 결과를 확인할 수 있다.

- 응답 시간 조건이 충족되지 못 했다는 것과 얼마나 많은 사용자가 느린 응답을 받았는지 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2025/gatling-load-test-example-02.png" width="100%" class="image__border">
</div>

## CLOSING

리포트를 보면 더 자세한 내용들을 확인할 수 있다. 

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-03-09-gatling-load-test-example>

#### REFERENCE

- <https://en.wikipedia.org/wiki/Gatling_%28software%29?utm_source=chatgpt.com>
- <https://github.com/gatling/gatling>
- <https://docs.gatling.io/tutorials/scripting-intro/>
- <https://docs.gatling.io/reference/glossary/>
- [Gatling으로 하는 부하테스트 튜토리얼](https://monday9pm.com/gatling%EC%9C%BC%EB%A1%9C-%ED%95%98%EB%8A%94-%EB%B6%80%ED%95%98%ED%85%8C%EC%8A%A4%ED%8A%B8-%ED%8A%9C%ED%86%A0%EB%A6%AC%EC%96%BC-f5b95ddc4c2a)