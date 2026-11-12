---
title: "SLF4J(Simple Logging Facade for Java)"
publishedAt: "2023-06-11"
updatedAt: "2026-11-12T16:19:33+09:00"
canonicalPath: "/java/simple-logging-facade-for-java/"
categories:
  - "java"
summary: "자바 로깅 프레임워크의 퍼사드인 SLF4J의 개념과 브릿지, API, 바인딩 모듈 구조를 설명하고, JUL과 JCL 로그를 SLF4J를 거쳐 Logback으로 출력하는 예제를 정리했다."
recommendedPosts:
  - title: "어댑터 패턴(Adapter Pattern)"
    href: "https://junhyunny.github.io/information/design-pattern/adapter-pattern/"
  - title: "퍼사드 패턴(Facade Pattern)"
    href: "https://junhyunny.github.io/information/design-pattern/facade-pattern/"
  - title: "Logback in Spring Boot"
    href: "https://junhyunny.github.io/java/spring-boot/logback-in-spring-boot/"
---

## 0. 들어가면서

시스템 구축이 끝나면 운영으로 넘어가기 전에 반드시 로깅(logging) 시스템을 구축해야 한다. 동작 중인 애플리케이션에는 디버거(debugger)가 없기 때문에 시스템 운영자는 장애나 문제 상황을 로그로 확인해야 한다.

예전 회사는 공통 컴포넌트 팀에서 로깅을 맡아 줬지만, 현재 팀은 직접 구축해야 하기 때문에 관련 지식을 탐구했다. 이번 글은 Java 진영에서 많이 사용하는 로깅 프레임워크에 대한 이야기다.

## 1. SLF4J(Simple Logging Facade for Java)

> The Simple Logging Facade for Java (SLF4J) serves as a simple facade or abstraction for various logging frameworks (e.g. java.util.logging, logback, log4j) allowing the end user to plug in the desired logging framework at deployment time. 

`SLF4J`는 퍼사드(facade) 패턴으로 다양한 로깅 프레임워크를 지원하는 추상화 라이브러리다. 별도의 추상화 계층 덕분에 개발자는 코드를 수정하지 않고도 원하는 로깅 시스템을 실행 시점에 선택할 수 있다.

어떤 프레임워크는 `SLF4J`의 로거(logger) 인터페이스를 직접 구현했고, 어떤 프레임워크는 `SLF4J`의 로거 인터페이스를 구현한 어댑터(adapter) 클래스를 사용한다. 이처럼 구현체로 연결되는 방법이 다르기 때문에 대문(Façade)이라는 용어를 사용한 것 같다. `SLF4J` 추상 레이어로 사용할 수 있는 로깅 프레임워크에는 logback, reload4j, log4j, log4j2, JUL(Java Util Logging), JCL(Jakarta Commons Logging) 등이 있다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/logging-framework-in-java-01.png" width="100%" class="image__border">
</div>

## 2. Modules

`SLF4J`는 세 가지 모듈을 제공한다. 이 모듈들로 여러 로깅 프레임워크를 하나로 통합해 사용할 수 있다.

먼저 브릿지(bridge) 모듈은 다른 로깅 프레임워크를 `SLF4J`로 연결할 때 사용한다. 레거시 코드나 외부 라이브러리에서 다른 로깅 프레임워크를 호출하면 이를 `SLF4J`로 연결해 준다. jcl-over-slf4j.jar, log4j-over-slf4j.jar, jul-to-slf4j.jar 라이브러리 등이 있다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/logging-framework-in-java-02.png" width="100%" class="image__border">
</div>

API 모듈은 로깅에 대한 추상 레이어(인터페이스)를 제공한다. API를 사용하는 클라이언트(client)는 실제 로깅을 제공하는 구현체를 모른다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/logging-framework-in-java-03.png" width="100%" class="image__border image__padding">
</div>

바인딩(binding) 모듈은 `SLF4J` API와 로깅 프레임워크의 실제 구현체를 연결하는 어댑터 역할을 한다. logback-classic.jar, logback-core.jar, slf4j-reload4j.jar, slf4j-jdk14.jar, slf4j-simple.jar 라이브러리 등이 있다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/logging-framework-in-java-04.png" width="100%" class="image__border image__padding">
</div>

## 3. Practice

간단한 실습 코드로 관련 내용을 살펴보자. 예제 코드로 다음과 같은 환경을 구성한다.

- JUL(Java Util Logging), JCL(Jakarta Commons Logging), SLF4J 세 가지 로거를 사용해 로그를 출력한다.
- JUL, JCL은 브릿지를 통해 SLF4J API로 연결한다.
- 바인딩을 통해 실제 구현체인 Logback 로깅 프레임워크로 연결한다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/logging-framework-in-java-05.png" width="100%" class="image__border">
</div>

### 3.1. Dependencies

`build.gradle` 파일에 다음 의존성을 추가한다.

- JCL 라이브러리: commons-logging:commons-logging:1.2
- Bridge 모듈: org.slf4j:jcl-over-slf4j:2.0.7, org.slf4j:jul-to-slf4j:2.0.7
- API 모듈: org.slf4j:slf4j-api:2.0.7
- Binding 모듈: ch.qos.logback:logback-core:1.4.7, ch.qos.logback:logback-classic:1.4.7

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.1.0'
    id 'io.spring.dependency-management' version '1.1.0'
}

group = 'action.in.blog'
version = '0.0.1-SNAPSHOT'
sourceCompatibility = '17'

repositories {
    mavenCentral()
}

dependencies {
    implementation 'commons-logging:commons-logging:1.2'
    implementation 'org.slf4j:jcl-over-slf4j:2.0.7'
    implementation 'org.slf4j:jul-to-slf4j:2.0.7'
    implementation 'org.slf4j:slf4j-api:2.0.7'
    implementation 'ch.qos.logback:logback-core:1.4.7'
    implementation('ch.qos.logback:logback-classic:1.4.7') {
        exclude group: 'org.slf4j', module: 'slf4j-api'
        exclude group: 'ch.qos.logback', module: 'logback-core'
    }
}

tasks.named('test') {
    useJUnitPlatform()
}
```

logback 의존성을 추가하지 않으면 `SLF4J` 구현체를 찾을 수 없어서 다음과 같은 에러가 발생한다.

```
SLF4J: No SLF4J providers were found.
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See https://www.slf4j.org/codes.html#noProviders for further details.
```

### 3.2. ActionInBlogApplication 클래스

ActionInBlogApplication 클래스는 로거마다 "Hello World" 문자열과 로그를 출력하는 인스턴스의 클래스 이름을 함께 출력한다.

```java
package action.in.blog;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.bridge.SLF4JBridgeHandler;

public class ActionInBlogApplication {

    public static void main(String[] args) {
        SLF4JBridgeHandler.removeHandlersForRootLogger();
        SLF4JBridgeHandler.install();

        
        Logger slf4jLogger = LoggerFactory.getLogger(ActionInBlogApplication.class);
        java.util.logging.Logger javaUtilLogger = java.util.logging.Logger.getLogger("action.in.blog.ActionInBlogApplication");
        org.apache.commons.logging.Log apacheCommonsLogger = org.apache.commons.logging.LogFactory.getLog(ActionInBlogApplication.class);


        java.util.logging.Logger parentJavaUtilLogger = javaUtilLogger.getParent();
        java.util.logging.Handler handlerInJavaUtilLogger = parentJavaUtilLogger.getHandlers()[0];


        slf4jLogger.info("Hello World {}", slf4jLogger.getClass().getName());
        javaUtilLogger.info("Hello World " + handlerInJavaUtilLogger.getClass().getName());
        apacheCommonsLogger.info("Hello World " + apacheCommonsLogger.getClass().getName());
    }
}
```

실행 결과는 다음과 같다.

- `slf4jLogger` 인스턴스의 구현체 클래스 이름은 `ch.qos.logback.classic.Logger`이다.
- `javaUtilLogger` 인스턴스의 부모 로거의 핸들러 이름은 `org.slf4j.bridge.SLF4JBridgeHandler`이다. JUL 로거는 내부적으로 핸들러를 사용해 로그를 출력하는데, 내부 코드를 살펴보면 부모 로거의 핸들러까지 탐색해 로그를 출력한다.
- `apacheCommonsLogger` 인스턴스의 구현체 클래스 이름은 `org.apache.commons.logging.impl.SLF4JLocationAwareLog`이다.

```
> Task :ActionInBlogApplication.main()
22:41:31.375 [main] INFO action.in.blog.ActionInBlogApplication -- Hello World ch.qos.logback.classic.Logger
22:41:31.379 [main] INFO action.in.blog.ActionInBlogApplication -- Hello World org.slf4j.bridge.SLF4JBridgeHandler
22:41:31.379 [main] INFO action.in.blog.ActionInBlogApplication -- Hello World org.apache.commons.logging.impl.SLF4JLocationAwareLog
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-06-11-simple-logging-facade-for-java>

#### REFERENCE

- <https://www.youtube.com/watch?v=1MD5xbwznlI>
- <https://www.youtube.com/watch?v=JqZzy7RyudI>
- <https://www.slf4j.org/legacy.html>
- <https://www.slideshare.net/whiteship/ss-47273947>
- <https://stackoverflow.com/questions/9117030/jul-to-slf4j-bridge>
- <https://stackoverflow.com/questions/69938358/logging-library-implementation-to-use-with-slf4j-wrapper>
