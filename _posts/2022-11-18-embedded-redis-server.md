---
title: "Embedded Redis Server"
search: false
category:
  - spring-boot
  - redis
last_modified_at: 2022-11-18T23:55:00
---

<br/>

## 0. 들어가면서

레디스(redis)과 연결이 필요한 어플리케이션을 개발할 때 다음과 같은 에러를 만날 수 있습니다.

```
Caused by: org.springframework.data.redis.RedisConnectionFailureException: Unable to connect to Redis; nested exception is io.lettuce.core.RedisConnectionException: Unable to connect to localhost:6379
    at org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory$ExceptionTranslatingConnectionProvider.translateException(LettuceConnectionFactory.java:1689) ~[spring-data-redis-2.7.5.jar:2.7.5]
    at org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory$ExceptionTranslatingConnectionProvider.getConnection(LettuceConnectionFactory.java:1597) ~[spring-data-redis-2.7.5.jar:2.7.5]
    at org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory$SharedConnection.getNativeConnection(LettuceConnectionFactory.java:1383) ~[spring-data-redis-2.7.5.jar:2.7.5]
```

로그에서 확인할 수 있듯이 레디스 서비스와 연결하지 못해 발생하는 문제입니다. 
서비스 가동 환경이라면 당연히 레디스 서비스와 연결해야 하지만, 개발자의 로컬 환경이라면 굉장히 불편한 상황입니다. 
이번 포스트에선 개발자가 어플리케이션을 테스트하기 위해 매번 레디스 서비스를 띄워야하는 불편함을 해소할 수 있는 임베디드 레디스(embedded reids)에 대해 살펴보겠습니다.

## 1. Embedded Reids

내장 레디스를 지원하는 라이브러리인 `kstyrc/embedded-redis`은 2018년 9월 17일이 마지막 커밋(commit)입니다. 
이번 포스트에선 이를 포크(fork)하여 2020년 6월 11일까지 업데이트했었던 `ozimov/embedded-redis` 라이브러리를 사용하였습니다. 

### 1.1. Add Depedency

다음과 같은 정보를 `pom.xml` 파일에 추가합니다.

```xml
    <dependency>
        <groupId>it.ozimov</groupId>
        <artifactId>embedded-redis</artifactId>
        <version>0.7.3</version>
    </dependency>
```

### 1.2. 설정 파일

어플리케이션이 운영되는 환경에 맞도록 설정 파일을 분할합니다.

### 1.2.1. application.yml

```yml
spring:
  profiles:
    active: local
```

### 1.2.2. application-local.yml

```yml
spring:
  redis:
    port: 6370
```


### 1.3. Create Embedded Redis Server

로컬 환경에서만 사용할 수 있도록 프로파일을 `local`로 지정합니다.

```java
package action.in.blog.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import redis.embedded.RedisServer;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

@Profile("local")
@Component
public class EmbeddedRedisServer {

    private final RedisServer redisServer;

    public EmbeddedRedisServer(@Value("${spring.redis.port}") int redisPort) {
        this.redisServer = new RedisServer(redisPort);
    }

    @PostConstruct
    public void postConstruct() {
        redisServer.start();
    }

    @PreDestroy
    public void preDestroy() {
        redisServer.stop();
    }
}
```

## 2. Solve the problems

내장 레디스 서버를 사용하면 다음과 같은 에러 로그를 만날 수 있습니다.

```
SLF4J: Class path contains multiple SLF4J bindings.
SLF4J: Found binding in [jar:file:/Users/junhyunk/.m2/repository/ch/qos/logback/logback-classic/1.2.11/logback-classic-1.2.11.jar!/org/slf4j/impl/StaticLoggerBinder.class]
SLF4J: Found binding in [jar:file:/Users/junhyunk/.m2/repository/org/slf4j/slf4j-simple/1.7.36/slf4j-simple-1.7.36.jar!/org/slf4j/impl/StaticLoggerBinder.class]
SLF4J: See http://www.slf4j.org/codes.html#multiple_bindings for an explanation.
SLF4J: Actual binding is of type [ch.qos.logback.classic.util.ContextSelectorStaticBinder]
```

`SLF4J` 클래스가 중복으로 정의되어 발생하는 문제입니다. 
`ozimov/embedded-redis` 라이브러리 내부에서 사용하는 `slf4j-simple` 의존성을 빌드 대상에서 제외하여 해당 문제를 해결합니다.

```xml
    <dependency>
        <groupId>it.ozimov</groupId>
        <artifactId>embedded-redis</artifactId>
        <version>0.7.3</version>
        <exclusions>
            <exclusion>
                <groupId>org.slf4j</groupId>
                <artifactId>slf4j-simple</artifactId>
            </exclusion>
        </exclusions>
    </dependency>
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-11-18-embedded-redis-server>

#### REFERENCE

* <https://github.com/kstyrc/embedded-redis>
* <https://github.com/ozimov/embedded-redis>
* [Embedded Redis 를 쓰면서 겪은 문제와 해결방안][embedded-redis-problems-link]

[embedded-redis-problems-link]: https://rogal.tistory.com/entry/Embedded-Redis-%EB%A5%BC-%EC%93%B0%EB%A9%B4%EC%84%9C-%EA%B2%AA%EC%9D%80-%EB%AC%B8%EC%A0%9C%EC%99%80-%ED%95%B4%EA%B2%B0%EB%B0%A9%EC%95%88