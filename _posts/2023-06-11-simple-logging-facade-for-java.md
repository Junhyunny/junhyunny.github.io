---
title: "SLF4J(Simple Logging Facade for Java)"
search: false
category:
  - java
last_modified_at: 2023-06-11T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Adapter Pattern][adapter-pattern-link]
* [Facade Pattern][facade-pattern-link]

## 0. 들어가면서

시스템을 구축이 끝나면 운영으로 넘어가기 전에 로깅(logging) 시스템 구축이 반드시 필요합니다. 
동작 중인 어플리케이션은 디버거(debugger)가 없기 때문에 시스템 운영자는 장애나 문제 상황을 로그를 통해 확인해야합니다. 
예전 회사는 공통 컴포넌트 팀에서 로깅을 맡아줬지만, 현재 팀은 직접 구축해야하기 때문에 관련된 지식을 탐구했습니다. 
이번엔 Java 진영에서 많이 사용되는 로깅 프레임워크에 대한 이야기입니다. 

## 1. SLF4J(Simple Logging Facade for Java)

> The Simple Logging Facade for Java (SLF4J) serves as a simple facade or abstraction for various logging frameworks (e.g. java.util.logging, logback, log4j) allowing the end user to plug in the desired logging framework at deployment time. 

`SLF4J`는 퍼사드(facade) 패턴을 통해 다양한 로깅 프레임워크를 지원하는 추상화 라이브러리입니다. 
별도의 추상화 계층은 개발자가 코드 수정 없이도 원하는 로깅 시스템을 실행하는 시점에 선택할 수 있도록 돕습니다. 

* `SLF4J`을 직접 구현하거나 어댑터를 사용하는 등 구현체로 연결되는 방법이 다르기 때문에 대문(Façade)이라는 용어가 사용된 것 같습니다.
    * 어떤 프레임워크는 `SLF4J`의 로거(logger) 인터페이스를 직접 구현하였습니다.
    * 어떤 프레임워크는 `SLF4J`의 로거 인터페이스를 구현한 어댑터(adapter) 클래스를 사용합니다.
* `SLF4J` 추상 레이어를 통해 사용할 수 있는 로깅 프레임워크들은 다음과 같습니다.
    * logback, reload4j, log4j, log4j2, JUL(Java Util Logging), JCL(Jakarta Commons Logging) 등

<p align="center">
    <img src="/images/logging-framework-in-java-1.JPG" width="80%" class="image__border">
</p>

## 2. Modules

`SLF4J`은 세 가지 모듈을 제공합니다. 
이를 통해 여러 개의 로깅 프레임워크를 하나로 통합하여 사용할 수 있습니다. 

* Bridge Module
    * 브릿지(bridge)는 다른 로깅 프레임워크를 `SLF4J`로 연결하기 위해 사용합니다.
    * 레거시 코드나 외부 라이브러리에서 다른 로깅 프레임워크을 호출하는 경우 이를 `SLF4J`로 연결해줍니다. 
    * jcl-over-slf4j.jar, log4j-over-slf4j.jar, jul-to-slf4j.jar 라이브러리 등이 있습니다.

<p align="center">
    <img src="/images/logging-framework-in-java-2.JPG" width="80%" class="image__border">
</p>

* API Module
    * 로깅에 대한 추상 레이어(인터페이스)를 제공합니다.
    * API를 사용하는 클라이언트(client)는 실제 로깅을 제공하는 구현체를 모릅니다.

<p align="center">
    <img src="/images/logging-framework-in-java-3.JPG" width="80%" class="image__border image__padding">
</p>

* Binding Module
    * 바인딩(binding)은 `SLF4J` API와 로깅 프레임워크의 실제 구현체를 연결하는 어댑터 역할을 수행합니다.
    * logback-classic.jar, logback-core.jar, slf4j-reload4j.jar, slf4j-jdk14.jar, slf4j-simple.jar 라이브러리 등이 있습니다.

<p align="center">
    <img src="/images/logging-framework-in-java-4.JPG" width="80%" class="image__border image__padding">
</p>

## 3. Practice

간단한 실습 코드를 통해 관련된 내용을 살펴보겠습니다. 
예제 코드를 통해 다음과 같은 환경을 구성합니다. 

* 세 가지 종류의 로거를 사용해 로그를 출력합니다.
    * JUL(Java Util Logging) 
    * JCL(Jakarta Commons Logging) 
    * SLF4J
* JUL, JCL은 브릿지를 통해 SLF4J API로 연결합니다.
* 바인딩을 통해 실제 구현체인 Logback 로깅 프레임워크로 연결합니다.

<p align="center">
    <img src="/images/logging-framework-in-java-5.JPG" width="80%" class="image__border">
</p>


### 3.1. Dependencies

* JCL 라이브러리를 추가합니다.
    * commons-logging:commons-logging:1.2
* Bridge 모듈을 추가합니다.
    * org.slf4j:jcl-over-slf4j:2.0.7
    * org.slf4j:jul-to-slf4j:2.0.7
* API 모듈을 추가합니다.
    * org.slf4j:slf4j-api:2.0.7
* Binding 모듈을 추가합니다.
    * ch.qos.logback:logback-core:1.4.7
    * ch.qos.logback:logback-classic:1.4.7

```gradle
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

* logback 의존성을 추가하지 않는 경우 다음과 같은 에러를 만나게 됩니다.
    * `SLF4J` 구현체를 찾을 수 없어서 발생합니다.

```
SLF4J: No SLF4J providers were found.
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See https://www.slf4j.org/codes.html#noProviders for further details.
```

### 3.2. ActionInBlogApplication Class

* 각 로거 별로 "Hello World" 문자열과 로그를 출력하는 인스턴스의 클래스 이름을 함께 출력합니다.

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

##### Result of Practice

* `slf4jLogger` 인스턴스의 구현체 클래스 이름은 `ch.qos.logback.classic.Logger` 입니다.
* `javaUtilLogger` 인스턴스의 부모 로거의 핸들러 이름은 `org.slf4j.bridge.SLF4JBridgeHandler` 입니다.
    * JUL 로거는 내부적으로 핸들러를 사용해 로그를 출력합니다.
    * 내부 코드를 살펴보면 부모 로거의 핸들러까지 탐색하여 로그를 출력합니다.
* `apacheCommonsLogger` 인스턴스의 구현체 클래스 이름은 `org.apache.commons.logging.impl.SLF4JLocationAwareLog` 입니다.

```
> Task :ActionInBlogApplication.main()
22:41:31.375 [main] INFO action.in.blog.ActionInBlogApplication -- Hello World ch.qos.logback.classic.Logger
22:41:31.379 [main] INFO action.in.blog.ActionInBlogApplication -- Hello World org.slf4j.bridge.SLF4JBridgeHandler
22:41:31.379 [main] INFO action.in.blog.ActionInBlogApplication -- Hello World org.apache.commons.logging.impl.SLF4JLocationAwareLog
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-06-11-simple-logging-facade-for-java>

#### RECOMMEND NEXT POSTS

* [Logback in Spring Boot][logback-in-spring-boot-link]

#### REFERENCE

* <https://www.youtube.com/watch?v=1MD5xbwznlI>
* <https://www.youtube.com/watch?v=JqZzy7RyudI>
* <https://www.slf4j.org/legacy.html>
* <https://www.slideshare.net/whiteship/ss-47273947>
* <https://stackoverflow.com/questions/9117030/jul-to-slf4j-bridge>
* <https://stackoverflow.com/questions/69938358/logging-library-implementation-to-use-with-slf4j-wrapper>

[adapter-pattern-link]: https://junhyunny.github.io/information/design-pattern/adapter-pattern/
[facade-pattern-link]: https://junhyunny.github.io/information/design-pattern/facade-pattern/
[logback-in-spring-boot-link]: https://junhyunny.github.io/java/spring-boot/logback-in-spring-boot/