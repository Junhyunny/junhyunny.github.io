---
title: "Spring Actuator 외부 컴포넌트 헬스 체크(Health Check)"
search: false
category:
  - spring-boot
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Spring Boot Actuator][spring-boot-actuator-link]

## 0. 들어가면서

스프링 액추에이터(spring actuator) 사용법을 정리하다보니 액추에이터가 제공하는 헬스 체크(health check) 기능을 확장하는 방법이 생각보다 복잡했다. 별도 주제로 관련된 내용을 정리했다. 

## 1. Default Health Check in Actuator

액추에이터가 기본으로 제공하는 애플리케이션 헬스 체크를 수행하면 다음과 같은 응답을 받는다. 이 헬스 체크 결과는 액추에이터 의존성을 추가하기만 해도 얻을 수 있다.

- 상태(status) 키에 "UP"이라는 값을 응답으로 받는다.

```
$ curl http://localhost:8080/actuator/health | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    15    0    15    0     0    122      0 --:--:-- --:--:-- --:--:--   122
{
  "status": "UP"
}
```

## 2. Health check for external components

서버 애플리케이션은 데이터베이스(database), 캐시(cache) 혹은 다른 서비스 같은 외부 컴포넌트들과 협력한다. 액추에이터는 서버 애플리케이션이 협력하는 외부 컴포넌트들의 헬스 체크까지 함께 수행할 수 있다. 다음과 같은 연결 구조를 갖는 애플리케이션의 액추에이터를 통해 외부 컴포넌트들의 헬스 체크를 해본다. 도커 컴포즈(docker compose)를 사용해 테스트 애플리케이션과 컴포넌트들 사이의 연결 고리를 만든다.

- Postgres 데이터베이스를 사용한다.
- 레디스(redis) 세션을 사용한다.
- 외부 서비스와 통신한다.

<div align="center">
  <img src="{{ site.image_url_2024 }}/health-check-for-external-components-in-actuator-01.png" width="80%" class="image__border">
</div>

### 2.1. build.gradle

먼저 의존성을 확인해보자. Postgres 데이터베이스와 레디스 세션을 사용하기 때문에 다음과 같은 의존성이 필요하다.

- postgresql - Postgres 데이터베이스 드라이버
- spring-session-data-redis - 레디스 세션
  - lettuce-core - Lettuce 커넥션 생성 시 레디스 클라이언트

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
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    implementation 'org.springframework.session:spring-session-data-redis'
    implementation 'io.lettuce:lettuce-core:6.3.2.RELEASE'
    runtimeOnly 'org.postgresql:postgresql'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

### 2.2. application.yml

데이터베이스, 레디스 그리고 액추에이터에 대한 설정을 추가한다.

- 데이터베이스 연결 타임 아웃 시간을 5초로 설정한다.
  - 기본 연결 타임 아웃 시간이 30초다.
  - 헬스 체크 요청이 30초 동안 대기(pending)하는 것을 5초로 줄인다.
- `management.endpoint.health.show-details` 속성을 `always` 값으로 설정한다.
  - 데이터베이스와 디스크는 상태 확인은 기본적으로 포함된다.
  - 레디스, 외부 서비스 상태 확인은 별도 컴포넌트로 구현해야 한다.

```yml
spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/test
    username: pgadmin
    password: pgadmin-password
    driver-class-name: org.postgresql.Driver
    hikari:
      connection-timeout: 5000
  data:
    redis:
      host: redis
      password:
      port: 6379
management:
  endpoint:
    health:
      show-details: always
  endpoints:
    web:
      exposure:
        include: health
```

### 2.3. AppConfig Class

액추에이터는 외부 컴포넌트의 헬스 체크를 위해 HealthIndicator 인터페이스를 제공한다. 외부 컴포넌트와 헬스 체크가 필요한 경우 HealthIndicator 인터페이스를 확장한다.

1. 레디스 연결 상태를 확인하기 위해 RedisHealthIndicator 객체를 스프링 빈(bean)으로 등록한다. 
  - RedisHealthIndicator 클래스는 액추에이터에서 제공한다. 
2. 레디스 연결 확인을 위한 LettuceConnectionFactory 객체를 스프링 빈으로 등록한다. 
3. LettuceClientConfiguration 객체를 생성할 때 커맨드 타임 아웃을 5초로 설정한다. 
  - 데이터베이스 연결 타임 아웃과 마찬가지로 헬스 체크 요청이 오랜 시간 대기하는 것을 5초로 단축시킨다.

```java
package action.in.blog.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.data.redis.RedisHealthIndicator;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;

import java.time.Duration;

@Configuration
public class AppConfig {

    @Bean
    public RedisConnectionFactory redisConnectionFactory(
            @Value("${spring.data.redis.host}") String host,
            @Value("${spring.data.redis.port}") int port
    ) {
        var clientConfig = LettuceClientConfiguration
                .builder()
                .commandTimeout(Duration.ofMillis(5000L)) // 3
                .build();
        return new LettuceConnectionFactory(new RedisStandaloneConfiguration(host, port), clientConfig); // 2
    }

    @Bean
    public HealthIndicator redisHealthIndicator(RedisConnectionFactory connectionFactory) {
        return new RedisHealthIndicator(connectionFactory); // 1
    }
}
```

### 2.4. ExternalServiceHealthIndicator Class

외부 서비스의 헬스 체크를 위한 ExternalServiceHealthIndicator 클래스를 생성한다. 외부 서비스도 액추에이터를 사용하고 있다고 가정하고 RestTemplate 객체와 협업한다. 

1. HTTP 요청을 통해 외부 서비스의 헬스 체크를 수행한다.
2. 정상적으로 응답을 받고 상태가 "UP"인 경우 "UP" 상태를 반환한다.
3. HTTP 요청이 실패하거나 응답이 "UP" 상태가 아닌 경우 "DOWN" 상태를 반환한다.

```java
package action.in.blog.component;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

record HealthCheck(String status) {
}

@Component
public class ExternalServiceHealthIndicator implements HealthIndicator {

    private static final String EXTERNAL_SERVICE_URL = "http://external-service:8080/actuator/health";
    private static final String HEALTH_STATUS_UP = "UP";

    private final RestTemplate restTemplate;

    public ExternalServiceHealthIndicator() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public Health health() {
        try {
            var response = restTemplate.getForObject(EXTERNAL_SERVICE_URL, HealthCheck.class); // 1
            if (response != null && HEALTH_STATUS_UP.equalsIgnoreCase(response.status())) { 
                return Health.up().build(); // 2
            }
        } catch (Exception e) {
            return Health.down().build(); // 3
        }
        return Health.down().build();
    }
}
```

### 3. Run Example

이 예제는 여러 시스템 컴포넌트들을 연결해야 하기 때문에 손쉬운 연결을 위해 도커 컴포즈를 사용한다. 다음과 같은 docker-compose.yml 파일을 작성한다.

- action-service
  - 테스트 대상 컨테이너
- external-service
  - 외부 서비스 컨테이너
- redis
  - 레디스 컨테이너
- postgres
  - Postgres 데이터베이스 컨테이너

```yml
services:
  action-service:
    build:
      context: ./action-in-blog
    ports:
      - 8080:8080
    depends_on:
      - postgres
      - redis
    restart: on-failure
  external-service:
    build:
      context: ./demo
  redis:
    image: redis:latest
  postgres:
    image: postgres:latest
    environment:
      - POSTGRES_USER=pgadmin
      - POSTGRES_PASSWORD=pgadmin-password
      - POSTGRES_DB=test
```

도커 컴포즈를 실행한다.

```
$ docker-compose up -d

...

[+] Running 5/5
 ✔ Network 2024-05-16-health-check-for-external-components-in-actuator_default               Created     0.0s 
 ✔ Container 2024-05-16-health-check-for-external-components-in-actuator-redis-1             Started     0.4s 
 ✔ Container 2024-05-16-health-check-for-external-components-in-actuator-external-service-1  Started     0.4s 
 ✔ Container 2024-05-16-health-check-for-external-components-in-actuator-postgres-1          Started     0.4s 
 ✔ Container 2024-05-16-health-check-for-external-components-in-actuator-action-service-1    Started     0.6s 
```

### 3.3. Health Check

컨테이너까지 실행했으면 모든 준비가 완료됐다. 테스트 대상 애플리케이션에 헬스 체크를 요청해보자.

- db
  - 데이터베이스 상태를 확인한다.
- diskSpace
  - 디스크 상태를 확인한다.
- externalService
  - 외부 시스템 상태를 확인한다.
- redis
  - 레디스 상태를 확인한다.

```
$ curl localhost:8080/actuator/health | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   354    0   354    0     0    501      0 --:--:-- --:--:-- --:--:--   501
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 62671097856,
        "free": 12864925696,
        "threshold": 10485760,
        "path": "/.",
        "exists": true
      }
    },
    "externalService": {
      "status": "UP"
    },
    "ping": {
      "status": "UP"
    },
    "redis": {
      "status": "UP",
      "details": {
        "version": "7.2.4"
      }
    }
  }
}
```

도커 데스크탑(docker desktop) 등을 사용해 데이터베이스를 멈추고 요청을 보내면 다음과 같은 응답을 받는다.

- 5초 뒤에 데이터베이스 컴포넌트 상태가 `DOWN`이라고 응답 받는다.
- 에러가 발생한 원인은 CannotGetJdbcConnectionException 이다.
- 테스트 대상 애플리케이션 상태가 `DOWN`이라고 응답 받는다.
  - 컴포넌트 중 하나라도 `DOWN` 상태인 경우 해당 애플리케이션 상태는 `DOWN`이다.

```
$ curl localhost:8080/actuator/health | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   406    0   406    0     0     80      0 --:--:--  0:00:05 --:--:--   106
{
  "status": "DOWN",
  "components": {
    "db": {
      "status": "DOWN",
      "details": {
        "error": "org.springframework.jdbc.CannotGetJdbcConnectionException: Failed to obtain JDBC Connection"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 62671097856,
        "free": 12864856064,
        "threshold": 10485760,
        "path": "/.",
        "exists": true
      }
    },
    "externalService": {
      "status": "UP"
    },
    "ping": {
      "status": "UP"
    },
    "redis": {
      "status": "UP",
      "details": {
        "version": "7.2.4"
      }
    }
  }
}
```

데이터베이스를 멈춘 상태를 유지하고 레디스를 멈추고 다시 헬스 체크를 요청한다.

- 10초 뒤에 데이터베이스, 레디스 컴포넌트 상태가 `DOWN`이라고 응답 받는다.
  - 데이터베이스 5초, 레디스 5초 타임아웃을 순차적으로 기다린 것으로 보인다.
  - 헬스 체크가 동기적으로 이뤄지는 것으로 예상된다.
- 데이터베이스 에러 원인은 CannotGetJdbcConnectionException 이다.
- 레디스 에러 원인은 QueryTimeoutException 이다.
- 테스트 대상 애플리케이션 상태가 `DOWN`이라고 응답 받는다.

```
$ curl localhost:8080/actuator/health | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   471    0   471    0     0     47      0 --:--:--  0:00:10 --:--:--   124
{
  "status": "DOWN",
  "components": {
    "db": {
      "status": "DOWN",
      "details": {
        "error": "org.springframework.jdbc.CannotGetJdbcConnectionException: Failed to obtain JDBC Connection"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 62671097856,
        "free": 12864835584,
        "threshold": 10485760,
        "path": "/.",
        "exists": true
      }
    },
    "externalService": {
      "status": "UP"
    },
    "ping": {
      "status": "UP"
    },
    "redis": {
      "status": "DOWN",
      "details": {
        "error": "org.springframework.dao.QueryTimeoutException: Redis command timed out"
      }
    }
  }
}
```

마지막으로 데이터베이스, 레디스 컨테이너는 다시 실행하고 외부 서비스를 멈춘 상태에서 헬스 체크 요청을 보낸다.

- 외부 서비스 상태가 `DOWN`이라고 응답 받는다.
- 테스트 대상 애플리케이션 상태가 `DOWN`이라고 응답 받는다.

```
$ curl localhost:8080/actuator/health | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   358    0   358    0     0  12018      0 --:--:-- --:--:-- --:--:-- 12344
{
  "status": "DOWN",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 62671097856,
        "free": 12864884736,
        "threshold": 10485760,
        "path": "/.",
        "exists": true
      }
    },
    "externalService": {
      "status": "DOWN"
    },
    "ping": {
      "status": "UP"
    },
    "redis": {
      "status": "UP",
      "details": {
        "version": "7.2.4"
      }
    }
  }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-05-16-health-check-for-external-components-in-actuator>

#### REFERENCE

- <https://docs.spring.io/spring-boot/docs/current/actuator-api/htmlsingle/>
- <https://www.baeldung.com/spring-boot-health-indicators>
- <https://toss.tech/article/how-to-work-health-check-in-spring-boot-actuator>
- <https://incheol-jung.gitbook.io/docs/study/srping-in-action-5th/chap-16.>
- <https://medium.com/sjk5766/spring-health-check-%EC%84%A4%EC%A0%95-%EB%B0%8F-%EC%BB%A4%EC%8A%A4%ED%84%B0%EB%A7%88%EC%9D%B4%EC%A7%95-a123261d79bc>

[spring-boot-actuator-link]: https://junhyunny.github.io/spring-boot/spring-boot-actuator/