---
title: "Logback in Spring Boot"
search: false
category:
  - java
  - spring-boot
last_modified_at: 2023-06-12T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [SLF4J(Simple Logging Facade for Java)][simple-logging-facade-for-java-link]

## 0. 들어가면서

스프링 부트(Spring Boot) 프레임워크는 기본(default) 로거로 `logback`을 사용하고 있습니다. 
다양한 로깅 프레임워크가 존재하지만, 스프링에서 기본으로 채택한 `logback`의 사용 방법을 이번 포스트를 먼저 정리해보겠습니다. 

## 1. Logback Architecture

`logback`은 세 개의 모듈로 나뉩니다. 

* logback-core
    * classic, access 두 모듈의 기초가 되는 범용 모듈입니다.
* logback-classic
    * core 모듈을 확장한 모듈입니다.
    * SLF4J API를 구현하였으며 이를 통해 log4j, JUL(java.util.logging) 같은 로깅 프레임워크를 대체합니다.
* logback-access
    * 제티(Jetty) 혹은 톰캣(Tomcat) 같은 서블릿 컨테이너와 통합되어 HTTP 액세스(access) 로그 기능을 제공합니다.

<p align="center">
    <img src="/images/logback-in-spring-boot-1.JPG" width="60%" class="image__border">
</p>

아래 주요 세 개 클래스들은 함께 동작하면서 개발자들이 결정한 로그 타입, 레벨, 메세지 포맷 등에 맞게 로그를 출력합니다.

* Logger
    * logback-classic 모듈에 속합니다.
    * 로깅 이벤트를 캡처하여 어펜더(Appender)에게 전달합니다.
* Appender
    * logback-core 모듈에 속합니다
    * 로그를 어디에 기록할지 결정하며 포멧에 맞는 메세지 생성은 레이아웃(Layout)에게 의존합니다.
    * ConsoleAppender, OutputStreamAppender, FileAppender, RollingFileAppender, SocketAppender, SSLSocketAppender, SMTPAppender, DBAppender, SyslogAppender, SiftingAppender, AsyncAppender 등 다양한 어펜더들을 제공합니다.
    * <https://logback.qos.ch/manual/appenders.html>
* Layout
    * logback-core 모듈에 속합니다.
    * 어펜더는 레이아웃에 의존하여 로깅 이벤트를 포맷에 맞는 문자열로 변환하고 기록합니다.
    * logback 0.9.19 버전 이후부터 FileAppender 및 하위 클래스는 인코더(Encoder)를 사용하며 더 이상 레이아웃을 사용하지 않는다고 합니다.
    * <https://logback.qos.ch/manual/encoders.html>

## 2. Log Level and Log Inheritance

### 2.1. Basic Selection Rule

`logback`은 5가지 로그 레벨을 가지고 있습니다. 
높은 로그 레벨 값을 가질수록 중요도가 높습니다. 

* ERROR 
    * 애플리케이션에 치명적일 수 있는 에러 이벤트입니다.
    * 예상하지 못한 문제나 예외 등을 출력합니다.
    * 중요도 1위입니다.
* WARN 
    * 잠재적으로 위험할 수 있는 상황을 나타내는 메세지입니다.
    * 예상 가능한 예외 처리 등을 출력합니다.
    * 중요도 2위입니다.
* INFO 
    * 애플리케이션의 전반적인 흐름을 나타내는 정보성 메시지입니다.
    * 운영 중 어플리케이션의 중요한 비즈니스 프로세스를 로깅합니다.
    * 중요도 3위입니다.
* DEBUG 
    * 중요도가 낮은 정보성 메시지입니다.
    * 개발 단계에서 디버깅을 위한 로깅을 의미합니다.
    * 중요도 4위입니다.
* TRACE 
    * 중요도가 매우 낮은 정보성 메시지입니다.
    * 모든 레벨에 대한 로깅이 추적되므로 개발 단계에서만 사용합니다.
    * 중요도 5위입니다.

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

로거(Logger)는 적용된 로그 레벨에 따라 요청 받은 로깅 이벤트를 출력할지 안할지를 선택합니다. 
적용된 로그 레벨보다 우선 순위가 높거나 같은 경우에만 로그를 출력합니다. 

> A log request of level p issued to a logger having an effective level q, is enabled if p >= q. 

* 적용된 로그 레벨인 TRACE인 경우
    * 모든 로그 요청이 출력됩니다.
* 적용된 로그 레벨이 DEBUG인 경우
    * TRACE를 제외한 로그 요청이 출력됩니다.
* 적용된 로그 레벨이 INFO인 경우
    * TRACE, DEBUG를 제외한 로그 요청이 출력됩니다.
* 적용된 로그 레벨이 WARN인 경우
    * WARN, ERROR 로그 요청만 출력됩니다.
* 적용된 로그 레벨이 ERROR인 경우
    * ERROR 로그 요청만 출력됩니다.

| Level of Request \\ Effective Level | TRACE | DEBUG | INFO | WARN | ERROR | OFF |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| TRACE | YES | NO | NO | NO | NO | NO |
| DEBUG | YES | YES | NO | NO | NO | NO |
| INFO | YES | YES | YES | NO | NO | NO |
| WARN | YES | YES | YES | YES | NO | NO |
| ERROR | YES | YES | YES | YES | YES | NO |

### 2.2. Level Inheritance

로거는 로거 컨텍스트(logger context)라는 고유한 공간을 가지며 이름을 통해 상속 계층이 결정됩니다. 
간단한 예시로 "com.foo" 이름을 가진 로거는 "com.foo.Bar"라는 이름을 가진 로거의 부모입니다. 
상속 계층 최상단에는 루트(root) 로거가 존재하며 루트 로거를 통해 기본적인 로그 레벨을 부여할 수 있습니다. 
로그 레벨은 로거의 상속 계층을 따라 하위로 적용됩니다. 

#### 2.2.1. Example 1

* 루트 로거의 로그 레벨이 `debug`입니다.
* 하위 로거들의 로그 레벨이 지정되어 있지 않으므로 루트를 따라 `debug` 레벨이 적용됩니다.

| Logger Name | Assigned Level | Effective Level |
|:-:|:-:|:-:|
| root | DEBUG | DEBUG |
| X | none | DEBUG |
| X.Y | none | DEBUG |
| X.Y.Z | none | DEBUG |

#### 2.2.2. Example 2

* 루트 로거의 로그 레벨이 `error`입니다.
* X 이름을 가진 로거의 로그 레벨이 `info`로 지정합니다.
    * 해당 로거에 적용되는 로그 레벨은 `info`입니다.
* X.Y 이름을 가진 로거의 로그 레벨이 `debug`로 지정합니다.
    * 해당 로거에 적용되는 로그 레벨은 `debug`입니다.
* X.Y.Z 이름을 가진 로거의 로그 레벨이 `warn`으로 지정합니다.
    * 해당 로거의 적용되는 로그 레벨은 `warn`입니다.

| Logger Name | Assigned Level | Effective Level |
|:-:|:-:|:-:|
| root | ERROR | ERROR |
| X | INFO | INFO |
| X.Y | DEBUG | DEBUG |
| X.Y.Z | WARN | WARN |

#### 2.2.3. Example 3

* 루트 로거의 로그 레벨이 `debug`입니다.
* X 이름을 가진 로거의 로그 레벨이 `info`로 지정합니다.
    * 해당 로거에 적용되는 로그 레벨은 `info`입니다.
* X.Y 이름을 가진 로거눈 로그 레벨이 지정되어 있지 않으므로 부모를 따라 `info` 레벨이 적용됩니다.
* X.Y.Z 이름을 가진 로거의 로그 레벨이 `error`으로 지정합니다.
    * 해당 로거의 적용되는 로그 레벨은 `error`입니다.

| Logger Name | Assigned Level | Effective Level |
|:-:|:-:|:-:|
| root | DEBUG | DEBUG |
| X | INFO | INFO |
| X.Y | none | INFO |
| X.Y.Z | ERROR | ERROR |

## 3. Practice

간단한 요구 사항을 만족하는 로깅 환경을 구성해보겠습니다. 

* 로컬 환경
    * 기본 DUBUG 로그 레벨을 지정합니다.
    * 모든 로그는 콘솔로 출력합니다.
* 개발 환경
    * 기본 DEBUG 로그 레벨을 지정합니다.
    * ERROR 로그 레벨 출력은 별도로 파일로 저장합니다.
    * 모든 로그는 콘솔로 출력합니다.
* 운영 환경
    * 기본 INFO 로그 레벨을 지정합니다.
    * ERROR 로그 레벨 출력은 별도로 파일로 저장합니다.
    * 모든 로그는 콘솔과 파일로 출력합니다.

실습 프로젝트 구성은 다음과 같습니다.

```
./
├── HELP.md
├── build.gradle
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
├── settings.gradle
└── src
    ├── main
    │   ├── java
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               └── ActionInBlogApplication.java
    │   └── resources
    │       ├── appender
    │       │   ├── console-appender.xml
    │       │   ├── error-rolling-file-appender.xml
    │       │   └── rolling-file-appender.xml
    │       ├── application.yml
    │       ├── logback-spring.xml
    │       ├── static
    │       └── templates
    └── test
        └── java
            └── action
                └── in
                    └── blog
                        └── ActionInBlogApplicationTests.java
```

### 3.1. application.yml

* 각 환경 별로 설정을 분리합니다.
    * 실습 편의상 하나의 파일에 모든 설정을 추가하였습니다. 
* 현재 활성화 된 환경은 `local`입니다.
* 각 환경 별로 로그를 저장하는 경로를 지정합니다.
    * 개발 환경은 `./dev-logs`입니다.
    * 운영 환경은 `./prod-logs`입니다.

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

* 특정 패턴의 로그를 콘솔에 출력합니다.

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

* 특정 패턴의 로그를 파일에 출력합니다.
* LevelFilter 클래스를 사용해 ERROR 레벨 로그만 기록합니다.
* 파일 사이즈가 10KB가 넘어가면 새로운 파일로 저장합니다.
    * 실습을 위해 용량을 작게 설정하였습니다.
    * 10KB가 넘어가면 `history-%d-%i.log` 파일로 아카이브(archive)됩니다. 
* 7일 동안 파일을 보관하며 오래된 파일은 지워집니다.

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

* 특정 패턴의 로그를 파일에 출력합니다.
* 파일 사이즈가 10KB가 넘어가면 새로운 파일로 저장합니다.
    * 실습을 위해 용량을 작게 설정하였습니다.
    * 10KB가 넘어가면 `history-%d-%i.log` 파일로 아카이브됩니다.
* 7일 동안 파일을 보관하며 오래된 파일은 지워집니다.

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

* 스프링 부트 프레임워크에서 로그 설정을 초기화할 때 사용하는 파일입니다.
    * `logback`은 xml, groovy 확장자를 가지는 설정 파일을 사용합니다.
    * `-spring` 접미사가 붙은 파일을 사용하는 것이 좋습니다.
        * logback-spring.xml, logback-spring.groovy
    * 표준 로그 설정 파일을 사용하는 경우 완전한 초기화를 할 수 없습니다.
        * logback.xml, logback.groovy
* `include` 태그를 통해 필요한 어펜더들을 추가합니다.
* `springProperty` 태그를 통해 필요한 설정은 `application.yml` 파일에서 주입받습니다.
* `springProfile` 태그를 통해 실행 환경 별로 다른 어펜더들을 적용합니다.

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

### 3.6. ActionInBlogApplication Class

* 어플리케이션을 실행하면 각 로그 레벨 별로 문자열을 출력합니다.

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

각 실행 환경 별로 어플리케이션을 실행하고, 생성되는 로그를 확인합니다. 
어플리케이션을 실행하기 위해 jar 파일로 빌드합니다. 

```
$ ./gradlew :bootJar                                      

BUILD SUCCESSFUL in 1s
4 actionable tasks: 4 executed
```

#### 3.7.1. Local Profile

```
$ java -jar action-in-blog-0.0.1-SNAPSHOT.jar
```

##### Result

* 로그 레벨이 DEBUG이므로 TRACE를 제외한 모든 로그가 콘솔에 출력됩니다.
* 별도 파일로 저장되지 않습니다.

<p align="center">
    <img src="/images/logback-in-spring-boot-2.gif" width="100%" class="image__border">
</p>

#### 3.7.2. Dev Profile

```
$ java -jar -Dspring.profiles.active=dev action-in-blog-0.0.1-SNAPSHOT.jar
```

##### Result

* 로그 레벨이 DEBUG이므로 TRACE를 제외한 모든 로그가 콘솔에 출력됩니다.
* ERROR 로그들은 `./dev-logs/errors` 경로에 파일로 저장됩니다.

<p align="center">
    <img src="/images/logback-in-spring-boot-3.gif" width="100%" class="image__border">
</p>

#### 3.7.3. Prod Profile

```
$ java -jar -Dspring.profiles.active=prod action-in-blog-0.0.1-SNAPSHOT.jar
```

##### Result

* 로그 레벨이 INFO이므로 TRACE, DEBUG를 제외한 모든 로그가 콘솔에 출력됩니다.
* ERROR 로그들은 `./prod-logs/errors` 경로에 파일로 저장됩니다.
* 출력된 모든 로그들은 `./prod-logs/logs` 경로에 파일로 저장됩니다.

<p align="center">
    <img src="/images/logback-in-spring-boot-4.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-06-12-logback-in-spring-boot>

#### REFERENCE

* <https://logback.qos.ch/manual/index.html>
* <https://www.baeldung.com/logback>
* <https://www.baeldung.com/spring-boot-logging>
* <https://junroot.github.io/programming/Logging/>
* <https://luvstudy.tistory.com/133>
* <https://jeong-pro.tistory.com/154>
* <https://meetup.nhncloud.com/posts/149>
* <https://tecoble.techcourse.co.kr/post/2021-08-07-logback-tutorial/>
* <https://www.raegon.com/logback-rolling-policy>

[simple-logging-facade-for-java-link]: https://junhyunny.github.io/java/simple-logging-facade-for-java/