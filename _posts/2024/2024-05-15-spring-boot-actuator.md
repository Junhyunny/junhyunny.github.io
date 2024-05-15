---
title: "Spring Boot Actuator"
search: false
category:
  - spring-boot
last_modified_at: 2024-05-15T23:55:00
---

<br/>

## 0. 들어가면서

OOM(out of memory) 에러를 만났을 때 스프링 애플리케이션 메트릭(metric) 정보를 확인하기 위해 스프링 액추에이터(spring actuator)를 추가했다. 프로젝트마다 매번 설정 방법을 검색하는 것이 번거로워 블로그 글로 기록했다. 

## 1. Spring Actuator

애플리케이션의 전반적인 상태를 메트릭이라고 한다. 메트릭은 서비스를 운영함에 있어 추적할 필요가 있는 다음과 같은 정보들을 의미한다.

- CPU 사용률
- 메모리 사용률
- 스레드 사용률

액추에이터는 애플리케이션 메트릭 정보를 HTTP 엔드-포인트(end-point)를 통해 노출시킬 수 있다. 그라파나(grafana), 데이터독(datadog)이나 엘라스틱 서치(elastic search) 같은 애플리케이션 성능 모니터링 도구들은 노출된 HTTP 엔드-포인트를 통해 수집한 데이터를 바탕으로 애플리케이션의 상태를 그래프나 테이블 형태로 시각화 한다.

## 2. Practice

간단한 실습을 통해 액추에이터에서 제공하는 몇 가지 기능들을 정리해보자. 스프링 부트 3.2.5 버전 환경에서 실습을 진행하고 사용한 의존성은 다음과 같다.

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.5'
    id 'io.spring.dependency-management' version '1.1.4'
}

group = 'action.in.blog'
version = '0.0.1-SNAPSHOT'

java {
    sourceCompatibility = '17'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

스프링 액추에이터 의존성이 추가된 상태에서 애플리케이션을 실행하면 액추에이터가 기본으로 제공하는 엔드-포인트를 확인할 수 있다.

- 액추에이터가 제공하는 엔드-포인트는 `/actuator` 경로에서 확인할 수 있다.
- `templated` 플래그로 엔드-포인트가 템플릿 형태인지 구분할 수 있다.
  - 템플릿 형태는 엔드-포인트 경로 중간에 변수가 존재하여 동적으로 변경될 수 있다는 의미이다. 

```
$ curl http://localhost:8080/actuator | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   243    0   243    0     0  71115      0 --:--:-- --:--:-- --:--:-- 81000
{
  "_links": {
    "self": {
      "href": "http://localhost:8080/actuator",
      "templated": false
    },
    "health-path": {
      "href": "http://localhost:8080/actuator/health/{*path}",
      "templated": true
    },
    "health": {
      "href": "http://localhost:8080/actuator/health",
      "templated": false
    }
  }
}
```

### 2.1. Expose Endpoints

간단한 확인을 위해 액추에이터가 제공하는 모든 엔드-포인트를 노출해보자. application.yml 파일을 다음과 같이 설정한다.

- 웹에서 노출할 정보에 '*'(애스터리스크)를 지정한다.

```yml
management:
  endpoints:
    web:
      exposure:
        include: '*'
```

액추에이터가 /actuator 경로를 통해 제공하는 정보를 확인해보자.

- 총 20개 엔드-포인트를 통해 애플리케이션 상태를 제공한다.
- 각 엔드-포인트들이 제공하는 정보는 이 [문서](https://docs.spring.io/spring-boot/docs/current/actuator-api/pdf/spring-boot-actuator-web-api.pdf)에 잘 정리되어 있다.

```
$ curl http://localhost:8080/actuator | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  1680    0  1680    0     0  18310      0 --:--:-- --:--:-- --:--:-- 18260
{
  "_links": {
    "self": {
      "href": "http://localhost:8080/actuator",
      "templated": false
    },
    "beans": {
      "href": "http://localhost:8080/actuator/beans",
      "templated": false
    },
    "caches": {
      "href": "http://localhost:8080/actuator/caches",
      "templated": false
    },
    "caches-cache": {
      "href": "http://localhost:8080/actuator/caches/{cache}",
      "templated": true
    },
    "health": {
      "href": "http://localhost:8080/actuator/health",
      "templated": false
    },
    "health-path": {
      "href": "http://localhost:8080/actuator/health/{*path}",
      "templated": true
    },
    "info": {
      "href": "http://localhost:8080/actuator/info",
      "templated": false
    },
    "conditions": {
      "href": "http://localhost:8080/actuator/conditions",
      "templated": false
    },
    "configprops-prefix": {
      "href": "http://localhost:8080/actuator/configprops/{prefix}",
      "templated": true
    },
    "configprops": {
      "href": "http://localhost:8080/actuator/configprops",
      "templated": false
    },
    "env-toMatch": {
      "href": "http://localhost:8080/actuator/env/{toMatch}",
      "templated": true
    },
    "env": {
      "href": "http://localhost:8080/actuator/env",
      "templated": false
    },
    "loggers-name": {
      "href": "http://localhost:8080/actuator/loggers/{name}",
      "templated": true
    },
    "loggers": {
      "href": "http://localhost:8080/actuator/loggers",
      "templated": false
    },
    "heapdump": {
      "href": "http://localhost:8080/actuator/heapdump",
      "templated": false
    },
    "threaddump": {
      "href": "http://localhost:8080/actuator/threaddump",
      "templated": false
    },
    "metrics-requiredMetricName": {
      "href": "http://localhost:8080/actuator/metrics/{requiredMetricName}",
      "templated": true
    },
    "metrics": {
      "href": "http://localhost:8080/actuator/metrics",
      "templated": false
    },
    "scheduledtasks": {
      "href": "http://localhost:8080/actuator/scheduledtasks",
      "templated": false
    },
    "mappings": {
      "href": "http://localhost:8080/actuator/mappings",
      "templated": false
    }
  }
}
```

각 엔드-포인트마다 제공하는 정보가 다르다. 예를 들어 애플리케이션 메트릭 정보를 요청해보자. 

- 액추에이터가 제공하는 메트릭 정보의 종류를 리스트로 보여준다.

```
$ curl http://localhost:8080/actuator/metrics | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  1489    0  1489    0     0   440k      0 --:--:-- --:--:-- --:--:--  484k
{
  "names": [
    "application.ready.time",
    "application.started.time",
    "disk.free",
    "disk.total",
    "executor.active",
    "executor.completed",
    "executor.pool.core",
    "executor.pool.max",
    "executor.pool.size",
    "executor.queue.remaining",
    "executor.queued",
    "hikaricp.connections",
    "hikaricp.connections.acquire",
    "hikaricp.connections.active",
    "hikaricp.connections.creation",
    "hikaricp.connections.idle",
    "hikaricp.connections.max",
    "hikaricp.connections.min",
    "hikaricp.connections.pending",
    "hikaricp.connections.timeout",
    "hikaricp.connections.usage",
    "http.server.requests",
    "http.server.requests.active",
    "jdbc.connections.active",
    "jdbc.connections.idle",
    "jdbc.connections.max",
    "jdbc.connections.min",
    "jvm.buffer.count",
    "jvm.buffer.memory.used",
    "jvm.buffer.total.capacity",
    "jvm.classes.loaded",
    "jvm.classes.unloaded",
    "jvm.compilation.time",
    "jvm.gc.live.data.size",
    "jvm.gc.max.data.size",
    "jvm.gc.memory.allocated",
    "jvm.gc.memory.promoted",
    "jvm.gc.overhead",
    "jvm.gc.pause",
    "jvm.info",
    "jvm.memory.committed",
    "jvm.memory.max",
    "jvm.memory.usage.after.gc",
    "jvm.memory.used",
    "jvm.threads.daemon",
    "jvm.threads.live",
    "jvm.threads.peak",
    "jvm.threads.started",
    "jvm.threads.states",
    "logback.events",
    "process.cpu.usage",
    "process.files.max",
    "process.files.open",
    "process.start.time",
    "process.uptime",
    "system.cpu.count",
    "system.cpu.usage",
    "system.load.average.1m",
    "tomcat.sessions.active.current",
    "tomcat.sessions.active.max",
    "tomcat.sessions.alive.max",
    "tomcat.sessions.created",
    "tomcat.sessions.expired",
    "tomcat.sessions.rejected"
  ]
}
```

액추에이터가 제공하는 메트릭 중 JVM 메모리 사용량을 살펴보자.

- 해당 엔드-포인트에서 제공하는 정보에 대한 설명을 볼 수 있다.
  - 어느 정도 사용 중인지 바이트 단위로 알 수 있다.
  - 어느 메모리 영역의 사용량인지 알 수 있다.

```
$ curl http://localhost:8080/actuator/metrics/jvm.memory.used | jq . 
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   330    0   330    0     0  90065      0 --:--:-- --:--:-- --:--:--  107k
{
  "name": "jvm.memory.used",
  "description": "The amount of used memory",
  "baseUnit": "bytes",
  "measurements": [
    {
      "statistic": "VALUE",
      "value": 118935248
    }
  ],
  "availableTags": [
    {
      "tag": "area",
      "values": [
        "heap",
        "nonheap"
      ]
    },
    {
      "tag": "id",
      "values": [
        "G1 Survivor Space",
        "Compressed Class Space",
        "Metaspace",
        "CodeCache",
        "G1 Old Gen",
        "G1 Eden Space"
      ]
    }
  ]
}
```

위에서 살펴본 것처럼 액추에이터는 애플리케이션의 상태에서부터 민감한 정보까지 제공한다. 그렇기에 불필요한 엔드-포인트들까지 노출하는 것은 문제가 될 수 있다. 다음과 같이 설정하면 필요한 엔드-포인트들만 노출할 수 있다. 

```yml
management:
  endpoints:
    web:
      exposure:
        include: health, heapdump, threaddump, metrics
```

액추에이터가 /actuator 경로를 통해 제공하는 정보를 다시 확인해보자.

```
$ curl http://localhost:8080/actuator | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   602    0   602    0     0   4023      0 --:--:-- --:--:-- --:--:--  4013
{
  "_links": {
    "self": {
      "href": "http://localhost:8080/actuator",
      "templated": false
    },
    "health": {
      "href": "http://localhost:8080/actuator/health",
      "templated": false
    },
    "health-path": {
      "href": "http://localhost:8080/actuator/health/{*path}",
      "templated": true
    },
    "heapdump": {
      "href": "http://localhost:8080/actuator/heapdump",
      "templated": false
    },
    "threaddump": {
      "href": "http://localhost:8080/actuator/threaddump",
      "templated": false
    },
    "metrics-requiredMetricName": {
      "href": "http://localhost:8080/actuator/metrics/{requiredMetricName}",
      "templated": true
    },
    "metrics": {
      "href": "http://localhost:8080/actuator/metrics",
      "templated": false
    }
  }
}
```

### 2.2. Change port and API path

액추에이터는 많이 사용되는 라이브러리이기 때문에 잘 알려진 포트(port)나 기본 API 경로를 사용하지 않고 변경하여 사용하는 것이 안전하다. 다음과 같은 설정하면 액추에이터 포트 번호와 앤드-포인트 경로를 변경할 수 있다.

```yml
management:
  endpoints:
    web:
      exposure:
        include: health, heapdump, threaddump, metrics
      base-path: /custom-actuator
  server:
    port: 9090
```

애플리케이션을 실행하면 다음과 같은 로그를 볼 수 있다.

- 톰캣 서버가 9090 포트를 활성화한다.
- /custom-actuator 하위 경로에 액추에이터가 제공하는 정보들이 노출되어 있다.

```
2024-05-14T22:16:26.641+09:00  INFO 5048 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port 8080 (http) with context path ''
2024-05-14T22:16:26.704+09:00  INFO 5048 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port 9090 (http)
2024-05-14T22:16:26.705+09:00  INFO 5048 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2024-05-14T22:16:26.705+09:00  INFO 5048 --- [           main] o.apache.catalina.core.StandardEngine    : Starting Servlet engine: [Apache Tomcat/10.1.20]
2024-05-14T22:16:26.719+09:00  INFO 5048 --- [           main] o.a.c.c.C.[Tomcat-1].[localhost].[/]     : Initializing Spring embedded WebApplicationContext
2024-05-14T22:16:26.719+09:00  INFO 5048 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 75 ms
2024-05-14T22:16:26.732+09:00  INFO 5048 --- [           main] o.s.b.a.e.web.EndpointLinksResolver      : Exposing 4 endpoint(s) beneath base path '/custom-actuator'
2024-05-14T22:16:26.766+09:00  INFO 5048 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port 9090 (http) with context path ''
2024-05-14T22:16:26.780+09:00  INFO 5048 --- [           main] action.in.blog.ActionInBlogApplication   : Started ActionInBlogApplication in 4.527 seconds (process running for 5.307)
```

다음과 같은 cURL 명령어로 애플리케이션 정보를 획득할 수 있다.

- 9090 포트 번호로 요청을 보낸다.
- /custom-actuator 하위 경로에서 필요한 정보를 획득할 수 있다. 

```
$ curl http://localhost:9090/custom-actuator | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   651    0   651    0     0   7158      0 --:--:-- --:--:-- --:--:--  7233
{
  "_links": {
    "self": {
      "href": "http://localhost:9090/custom-actuator",
      "templated": false
    },
    "health-path": {
      "href": "http://localhost:9090/custom-actuator/health/{*path}",
      "templated": true
    },
    "health": {
      "href": "http://localhost:9090/custom-actuator/health",
      "templated": false
    },
    "heapdump": {
      "href": "http://localhost:9090/custom-actuator/heapdump",
      "templated": false
    },
    "threaddump": {
      "href": "http://localhost:9090/custom-actuator/threaddump",
      "templated": false
    },
    "metrics": {
      "href": "http://localhost:9090/custom-actuator/metrics",
      "templated": false
    },
    "metrics-requiredMetricName": {
      "href": "http://localhost:9090/custom-actuator/metrics/{requiredMetricName}",
      "templated": true
    }
  }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-05-15-spring-boot-actuator>

#### REFERENCE

- <https://docs.spring.io/spring-boot/docs/current/actuator-api/htmlsingle/>
- <https://docs.spring.io/spring-boot/docs/current/actuator-api/pdf/spring-boot-actuator-web-api.pdf>
- <https://stackoverflow.com/questions/76794560/what-does-templated-false-mean-for-spring-boot-actuator>
- <https://incheol-jung.gitbook.io/docs/study/srping-in-action-5th/chap-16.>
