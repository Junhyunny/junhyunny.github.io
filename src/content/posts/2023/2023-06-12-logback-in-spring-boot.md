---
title: "스프링 부트 Logback 설정"
publishedAt: "2023-06-12"
updatedAt: "2026-11-12T16:19:33+09:00"
canonicalPath: "/java/spring-boot/logback-in-spring-boot/"
categories:
  - "java"
  - "spring-boot"
summary: "Logback의 아키텍처와 로그 레벨 상속 규칙을 설명하고, 스프링 부트에서 환경별로 콘솔과 롤링 파일 어펜더를 나눠 설정하는 방법을 정리했다."
recommendedPosts:
  - title: "SLF4J(Simple Logging Facade for Java)"
    href: "https://junhyunny.github.io/java/simple-logging-facade-for-java/"
---

## 0. 들어가면서

스프링 부트(Spring Boot) 프레임워크는 기본(default) 로거로 `logback`을 사용한다. 다양한 로깅 프레임워크가 있지만, 이번 글에서는 스프링이 기본으로 채택한 `logback`의 사용 방법을 먼저 정리했다.

## 1. Logback Architecture

`logback`은 세 개의 모듈로 나뉜다.

- logback-core는 클래식(classic), 액세스(access) 두 모듈의 기초가 되는 범용 모듈이다.
- logback-classic은 코어(core)를 확장(extends)하고 SLF4J API를 구현(implements)한 모듈이다. SLF4J API는 클래식 모듈을 통해 `logback` 로깅 프레임워크 기능을 호출한다.
- logback-access는 제티(Jetty) 혹은 톰캣(Tomcat) 같은 서블릿 컨테이너와 통합되어 HTTP 액세스 로그 기능을 제공한다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/logback-in-spring-boot-01.png" width="60%" class="image__border">
</div>

아래 세 주요 클래스는 함께 동작하면서 개발자가 결정한 로그 타입, 레벨, 메시지 포맷 등에 맞게 로그를 출력한다.

- Logger 클래스는 logback-classic 모듈에 속한다. 로깅 이벤트를 캡처해 어펜더(Appender)에 전달한다.
- Appender 클래스는 logback-core 모듈에 속한다. 로그를 어디에 기록할지 결정하며, 포맷에 맞는 메시지 생성은 레이아웃(Layout)에 의존한다. ConsoleAppender, OutputStreamAppender, FileAppender, RollingFileAppender, SocketAppender, SSLSocketAppender, SMTPAppender, DBAppender, SyslogAppender, SiftingAppender, AsyncAppender 등 다양한 어펜더를 제공한다.
  - <https://logback.qos.ch/manual/appenders.html>
- Layout 클래스는 logback-core 모듈에 속한다. 어펜더는 레이아웃에 의존해 로깅 이벤트를 포맷에 맞는 문자열로 변환하고 기록한다. logback 0.9.19 버전 이후부터 FileAppender와 하위 클래스는 인코더(Encoder)를 사용하며 더 이상 레이아웃을 사용하지 않는다고 한다.
  - <https://logback.qos.ch/manual/encoders.html>

## 2. Log Level and Log Inheritance

### 2.1. Basic Selection Rule

`logback`에는 5가지 로그 레벨이 있다. 로그 레벨 값이 높을수록 중요도가 높다. 중요도가 높은 순서대로 살펴보면 다음과 같다.

- ERROR는 애플리케이션에 치명적일 수 있는 에러 이벤트다. 예상하지 못한 문제나 예외 등을 출력한다.
- WARN은 잠재적으로 위험할 수 있는 상황을 나타내는 메시지다. 예상 가능한 예외 처리 등을 출력한다.
- INFO는 애플리케이션의 전반적인 흐름을 나타내는 정보성 메시지다. 운영 중인 애플리케이션의 중요한 비즈니스 프로세스를 로깅한다.
- DEBUG는 중요도가 낮은 정보성 메시지다. 개발 단계에서 디버깅을 위한 로깅을 의미한다.
- TRACE는 중요도가 매우 낮은 정보성 메시지다. 모든 레벨의 로깅이 추적되므로 개발 단계에서만 사용한다.

```java
package ch.qos.logback.classic;

// import ...

public final class Level implements java.io.Serializable {

    public static final int OFF_INT = Integer.MAX_VALUE;
    public static final int ERROR_INT = 40000;
    public static final int WARN_INT = 30000;
    public static final int INFO_INT = 20000;
    public static final int DEBUG_INT = 10000;
    public static final int TRACE_INT = 5000;
    public static final int ALL_INT = Integer.MIN_VALUE;

    // ... other codes
}
```

로거(Logger)는 적용된 로그 레벨에 따라 요청받은 로깅 이벤트를 출력할지 결정한다. 적용된 로그 레벨보다 우선순위가 높거나 같은 경우에만 로그를 출력한다.

> A log request of level p issued to a logger having an effective level q, is enabled if p >= q.

- 적용된 로그 레벨이 TRACE면 모든 로그 요청이 출력된다.
- 적용된 로그 레벨이 DEBUG면 TRACE를 제외한 로그 요청이 출력된다.
- 적용된 로그 레벨이 INFO면 TRACE, DEBUG를 제외한 로그 요청이 출력된다.
- 적용된 로그 레벨이 WARN이면 WARN, ERROR 로그 요청만 출력된다.
- 적용된 로그 레벨이 ERROR면 ERROR 로그 요청만 출력된다.

| Level of Request \\ Effective Level | TRACE | DEBUG | INFO | WARN | ERROR | OFF |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| TRACE | YES | NO | NO | NO | NO | NO |
| DEBUG | YES | YES | NO | NO | NO | NO |
| INFO | YES | YES | YES | NO | NO | NO |
| WARN | YES | YES | YES | YES | NO | NO |
| ERROR | YES | YES | YES | YES | YES | NO |

### 2.2. Level Inheritance

로거는 로거 컨텍스트(logger context)라는 고유한 공간을 가지며 이름으로 상속 계층이 결정된다. 예를 들어 "com.foo"라는 이름의 로거는 "com.foo.Bar"라는 이름의 로거의 부모다. 상속 계층 최상단에는 루트(root) 로거가 있으며, 루트 로거로 기본 로그 레벨을 부여할 수 있다. 로그 레벨은 로거의 상속 계층을 따라 하위로 적용된다.

#### 2.2.1. Example 1

루트 로거의 로그 레벨이 `debug`다. 하위 로거들은 로그 레벨이 지정되어 있지 않으므로 루트를 따라 `debug` 레벨이 적용된다.

| Logger Name | Assigned Level | Effective Level |
|:-:|:-:|:-:|
| root | DEBUG | DEBUG |
| X | none | DEBUG |
| X.Y | none | DEBUG |
| X.Y.Z | none | DEBUG |

#### 2.2.2. Example 2

루트 로거의 로그 레벨이 `error`다. X, X.Y, X.Y.Z 로거에는 각각 `info`, `debug`, `warn` 로그 레벨이 지정되어 있으므로 각 로거에는 지정한 로그 레벨이 그대로 적용된다.

| Logger Name | Assigned Level | Effective Level |
|:-:|:-:|:-:|
| root | ERROR | ERROR |
| X | INFO | INFO |
| X.Y | DEBUG | DEBUG |
| X.Y.Z | WARN | WARN |

#### 2.2.3. Example 3

루트 로거의 로그 레벨이 `debug`다. X 로거에는 `info` 로그 레벨이 지정되어 `info`가 적용된다. X.Y 로거는 로그 레벨이 지정되어 있지 않으므로 부모를 따라 `info` 레벨이 적용된다. X.Y.Z 로거에는 `error` 로그 레벨이 지정되어 `error`가 적용된다.

| Logger Name | Assigned Level | Effective Level |
|:-:|:-:|:-:|
| root | DEBUG | DEBUG |
| X | INFO | INFO |
| X.Y | none | INFO |
| X.Y.Z | ERROR | ERROR |

## 3. Practice

다음과 같은 간단한 요구 사항을 만족하는 로깅 환경을 구성해 보자.

- 로컬 환경은 DEBUG 로그 레벨을 기본으로 지정하고, 모든 로그를 콘솔로 출력한다.
- 개발 환경은 DEBUG 로그 레벨을 기본으로 지정한다. ERROR 레벨 로그는 별도 파일로 저장하고, 모든 로그는 콘솔로 출력한다.
- 운영 환경은 INFO 로그 레벨을 기본으로 지정한다. ERROR 레벨 로그는 별도 파일로 저장하고, 모든 로그는 콘솔과 파일로 출력한다.

실습 프로젝트 구성은 다음과 같다.

```
./
├── HELP.md
├── build.gradle
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
├── settings.gradle
└── src
    ├── main
    │   ├── java
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               └── ActionInBlogApplication.java
    │   └── resources
    │       ├── appender
    │       │   ├── console-appender.xml
    │       │   ├── error-rolling-file-appender.xml
    │       │   └── rolling-file-appender.xml
    │       ├── application.yml
    │       ├── logback-spring.xml
    │       ├── static
    │       └── templates
    └── test
        └── java
            └── action
                └── in
                    └── blog
                        └── ActionInBlogApplicationTests.java
```

### 3.1. application.yml

`application.yml` 파일에서 환경별로 설정을 분리한다. 실습 편의상 하나의 파일에 모든 설정을 추가했다. 현재 활성화된 환경은 `local`이다. 환경마다 로그를 저장하는 경로를 지정하는데, 개발 환경은 `./dev-logs`, 운영 환경은 `./prod-logs`이다.

```xml
spring:
  profiles:
    active: local
---
spring:
  config:
    activate:
      on-profile: dev
log:
  path: ./dev-logs
---
spring:
  config:
    activate:
      on-profile: prod
log:
  path: ./prod-logs
```

### 3.2. console-appender.xml

`console-appender.xml` 파일은 특정 패턴의 로그를 콘솔에 출력하는 어펜더를 정의한다.

```xml
<included>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>[%d{yyyy-MM-dd HH:mm:ss}:%-3relative][%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
</included>
```

### 3.3. error-rolling-file-appender.xml

`error-rolling-file-appender.xml` 파일은 특정 패턴의 로그를 파일에 출력하는 어펜더를 정의한다. 설정 내용은 다음과 같다.

- LevelFilter 클래스를 사용해 ERROR 레벨 로그만 기록한다.
- 파일 크기가 10KB를 넘으면 `history-%d-%i.log` 파일로 아카이브(archive)하고 새로운 파일에 저장한다. 실습을 위해 용량을 작게 설정했다.
- 7일 동안 파일을 보관하며 오래된 파일은 지워진다.

```xml
<included>
    <appender name="ERROR_ROLLING_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${LOG_PATH}/errors/real-time-${LOG_DATE}.log</file>
        <filter class="ch.qos.logback.classic.filter.LevelFilter">
            <level>ERROR</level>
            <onMatch>ACCEPT</onMatch>
            <onMismatch>DENY</onMismatch>
        </filter>
        <encoder>
            <pattern>[%d{yyyy-MM-dd HH:mm:ss}:%-3relative][%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>${LOG_PATH}/errors/history-%d-%i.log</fileNamePattern>
            <maxFileSize>10KB</maxFileSize>
            <maxHistory>7</maxHistory>
        </rollingPolicy>
    </appender>
</included>
```

### 3.4. rolling-file-appender.xml

`rolling-file-appender.xml` 파일도 특정 패턴의 로그를 파일에 출력하는 어펜더를 정의한다. 파일 크기가 10KB를 넘으면 `history-%d-%i.log` 파일로 아카이브하고 새로운 파일에 저장한다. 7일 동안 파일을 보관하며 오래된 파일은 지워진다.

```xml
<included>
    <appender name="ROLLING_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${LOG_PATH}/logs/real-time-${LOG_DATE}.log</file>
        <encoder>
            <pattern>[%d{yyyy-MM-dd HH:mm:ss}:%-3relative][%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>${LOG_PATH}/logs/history-%d-%i.log</fileNamePattern>
            <maxFileSize>10KB</maxFileSize>
            <maxHistory>7</maxHistory>
        </rollingPolicy>
    </appender>
</included>
```

### 3.5. logback-spring.xml

`logback-spring.xml` 파일은 스프링 부트 프레임워크가 로그 설정을 초기화할 때 사용하는 파일이다. `logback`은 xml, groovy 확장자를 가지는 설정 파일을 사용한다. 스프링 부트에서는 `-spring` 접미사가 붙은 파일(logback-spring.xml, logback-spring.groovy)을 사용하는 것이 좋다. 표준 로그 설정 파일(logback.xml, logback.groovy)을 사용하면 완전히 초기화할 수 없다. 설정 내용은 다음과 같다.

- `include` 태그로 필요한 어펜더를 추가한다.
- `springProperty` 태그로 필요한 설정을 `application.yml` 파일에서 주입받는다.
- `springProfile` 태그로 실행 환경별로 다른 어펜더를 적용한다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>

    <timestamp key="LOG_DATE" datePattern="yyyy-MM-dd"/>
    <springProperty name="LOG_PATH" source="log.path" defaultValue="./local-logs"/>
    <include resource="appender/console-appender.xml" />
    <include resource="appender/error-rolling-file-appender.xml" />
    <include resource="appender/rolling-file-appender.xml" />

    <springProfile name="local">
        <root level="DEBUG">
            <appender-ref ref="STDOUT"/>
        </root>
    </springProfile>

    <springProfile name="dev">
        <root level="DEBUG">
            <appender-ref ref="STDOUT"/>
            <appender-ref ref="ERROR_ROLLING_FILE"/>
        </root>
    </springProfile>

    <springProfile name="prod">
        <root level="INFO">
            <appender-ref ref="STDOUT"/>
            <appender-ref ref="ROLLING_FILE"/>
            <appender-ref ref="ERROR_ROLLING_FILE"/>
        </root>
    </springProfile>
</configuration>
```

### 3.6. ActionInBlogApplication 클래스

ActionInBlogApplication 클래스는 애플리케이션이 실행되면 로그 레벨별로 문자열을 출력한다.

```java
package action.in.blog;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.stream.IntStream;

@Slf4j
@SpringBootApplication
public class ActionInBlogApplication implements CommandLineRunner {

    public static void main(String[] args) {
        SpringApplication.run(ActionInBlogApplication.class, args);
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void run(String... args) throws Exception {
        IntStream.range(0, Integer.MAX_VALUE)
                .forEach(number -> {
                    log.trace("Hello Trace World {}", number);
                    log.debug("Hello Debug World {}", number);
                    log.info("Hello Info World {}", number);
                    log.warn("Hello Warn World {}", number);
                    log.error("Hello Error World {}", number);
                    sleep(100);
                });
    }
}
```

### 3.7. Run Application

실행 환경별로 애플리케이션을 실행하고 생성되는 로그를 확인한다. 애플리케이션을 실행하기 위해 jar 파일로 빌드한다.

```
$ ./gradlew :bootJar                                      

BUILD SUCCESSFUL in 1s
4 actionable tasks: 4 executed
```

#### 3.7.1. Local Profile

다음 명령어로 로컬 환경에서 애플리케이션을 실행한다.

```
$ java -jar action-in-blog-0.0.1-SNAPSHOT.jar
```

로그 레벨이 DEBUG이므로 TRACE를 제외한 모든 로그가 콘솔에 출력되고, 별도 파일로 저장되지 않는다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/logback-in-spring-boot-02.gif" width="100%" class="image__border">
</div>

#### 3.7.2. Dev Profile

다음 명령어로 개발 환경에서 애플리케이션을 실행한다.

```
$ java -jar -Dspring.profiles.active=dev action-in-blog-0.0.1-SNAPSHOT.jar
```

로그 레벨이 DEBUG이므로 TRACE를 제외한 모든 로그가 콘솔에 출력된다. ERROR 로그는 `./dev-logs/errors` 경로에 파일로 저장된다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/logback-in-spring-boot-03.gif" width="100%" class="image__border">
</div>

#### 3.7.3. Prod Profile

다음 명령어로 운영 환경에서 애플리케이션을 실행한다.

```
$ java -jar -Dspring.profiles.active=prod action-in-blog-0.0.1-SNAPSHOT.jar
```

로그 레벨이 INFO이므로 TRACE, DEBUG를 제외한 모든 로그가 콘솔에 출력된다. ERROR 로그는 `./prod-logs/errors` 경로에, 출력된 모든 로그는 `./prod-logs/logs` 경로에 파일로 저장된다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/logback-in-spring-boot-04.gif" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-06-12-logback-in-spring-boot>

#### REFERENCE

- <https://logback.qos.ch/manual/index.html>
- <https://www.baeldung.com/logback>
- <https://www.baeldung.com/spring-boot-logging>
- <https://junroot.github.io/programming/Logging/>
- <https://luvstudy.tistory.com/133>
- <https://jeong-pro.tistory.com/154>
- <https://meetup.nhncloud.com/posts/149>
- <https://tecoble.techcourse.co.kr/post/2021-08-07-logback-tutorial/>
- <https://www.raegon.com/logback-rolling-policy>
