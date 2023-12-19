---
title: "Information in HttpServletRequest"
search: false
category:
  - information
  - java
  - spring-boot
last_modified_at: 2023-12-19T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Deploy War Package for Spring Boot Project][deploy-spring-boot-project-as-war-link]
- [Virtual Host in Tomcat][virtual-host-in-tomcat-link]

## 1. Information in HttpServletRequest

서버 애플리케이션을 개발하다보면 주소, 경로 정보 등을 사용하는 경우가 많다. 공통적인 처리를 수행하는 필터(filter)를 만들 때 필자는 보통 HttpServletRequest 객체의 getServletPath 혹은 getRequestURI 메소드를 사용했다. 여러 시스템을 개발해보니 어떤 상황에선 같은 값인데, 다른 환경에선 다른 값이어서 혼란을 겪었던 기억이 난다. 매우 기본적인 정보들이지만, 매번 헷갈리기도 하고 최근 글을 쓰다가 궁금증이 생겨서 포스트로 정리했다. 

## 2. URI, URL in HttpServletRequest

서블릿 패스(servlet path)와 요청 URI의 차이점을 알아보기 전에 HttpServletRequest 객체은 URL 정보를 반환하는 getRequestURL 메소드가 있다. 서블릿 컨테이너에서 URI, URL 정보를 어떻게 구분하는지 궁금했다. 둘 사이의 차이점을 살펴보자.

먼저 URI, URL 의미를 정확하게 알고 싶었다. [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) 인터넷 표준에서 정의한 URI, URL의 정의를 참조했다. 통합 자원 식별자(uniform resource identifier, URI)는 숫자, 문자, 기호의 짧은 문자열을 사용해 문서를 식별하는 표준이다. URI는 다음과 같이 표현한다.

```
URI         = scheme ":" hier-part [ "?" query ] [ "#" fragment ]
hier-part   = "//" authority path-abempty
            / path-absolute
            / path-rootless
            / path-empty
```

표준에 정의된 URI 예시는 다음과 같다.

```
The following are two example URIs and their component parts:

  foo://example.com:8042/over/there?name=ferret#nose
  \_/   \______________/\_________/ \_________/ \__/
   |           |            |            |        |
scheme     authority       path        query   fragment
   |   _____________________|__
  / \ /                        \
  urn:example:animal:ferret:nose
```

통합 자원 지시자(uniform resource locator, URL)은 URI의 한 유형이다. **모든 URL은 URI이다.** 이름에서 알 수 있듯이 리소스의 구체적인 위치를 가리킨다. 리소스가 어디에 있는지 어떻게 접근할 수 있는지 알려준다. 예를 들면 다음과 같이 평소 우리가 자주 보는 값들을 의미한다. txt, html 파일 리소스의 위치를 가리킨다. 우리는 브라우저를 통해 아래 URL에 접근하여 해당 리소스를 볼 수 있는 것이다.

- http://www.example.com/index.html
- http://www.ietf.org/rfc/rfc2396.txt
- https://github.com/Junhyunny

URI, URL을 "주소만 표시되었다.", "식별자까지 포함되었다." 등의 기준으로 구분 지으려는 일은 무의미해 보인다. 어떤 식으로 표현하면 URI, 어떤 식으로 표현하면 URL이 아니기 때문이다. URI는 리소스의 고유한 식별자, URL은 리소스 위치를 표현한다고 정리하고 넘어간다.

이번 글의 주제로 다시 돌아와 스프링 애플리케이션에서 HttpServletRequest 객체의 getRequestURI, getRequestURL 메소드에 저장된 값을 출력하면 어떤 값이 출력될까? 다음과 같은 컨트롤러를 만들고 로그를 통해 확인해봤다.

```java
package blog.in.action.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    private final static Logger logger = LoggerFactory.getLogger(HomeController.class);

    @GetMapping("/home")
    public String home(HttpServletRequest httpServletRequest) {
        logger.info("requestURI - {}", httpServletRequest.getRequestURI());
        logger.info("requestURL - {}", httpServletRequest.getRequestURL());
        return "home";
    }
}

```

애플리케이션을 실행하고, cURL 명령어를 수행한다.

```
$ curl -v "http://localhost:8080/home?hello=world"
```

로그 결과는 다음과 같다.

- requestURI - /home
- requestURL - http://localhost:8080/home

```
2023-12-19T10:59:51.237+09:00  INFO 10977 --- [nio-8080-exec-1] b.in.action.controller.HomeController    : requestURI - /home
2023-12-19T10:59:51.238+09:00  INFO 10977 --- [nio-8080-exec-1] b.in.action.controller.HomeController    : requestURL - http://localhost:8080/home
```

로그를 통해 서블릿 컨테이너에서 요청 URI과 URL의 의미를 다음과 같이 정리할 수 있다.

- 요청 URI는 요청 경로를 의미한다.
- 요청 URL은 스키마, 호스트, 포트 번호까지 모두 포함된 리소스 위치를 의미한다. 

## 3. Context Path, Servlet Path, Request URI in HttpServletRequest

문제가 됬던 서블릿 패스와 요청 URI 차이를 살펴보자. 컨트롤러 코드를 다음과 같이 변경한다. 

```java
package blog.in.action.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    private final static Logger logger = LoggerFactory.getLogger(HomeController.class);

    @GetMapping("/home")
    public String home(HttpServletRequest httpServletRequest) {
        logger.info("requestURI - {}", httpServletRequest.getRequestURI());
        logger.info("getServletPath - {}", httpServletRequest.getServletPath());
        return "home";
    }
}
```

애플리케이션을 재실행하고, cURL 명령어를 수행한다.

```
$ curl -v "http://localhost:8080/home?hello=world"
```

로그 결과는 다음과 같다.

- requestURI - /home
- getServletPath - /home

```
2023-12-19T11:13:02.109+09:00  INFO 13529 --- [nio-8080-exec-1] b.in.action.controller.HomeController    : requestURI - /home
2023-12-19T11:13:02.110+09:00  INFO 13529 --- [nio-8080-exec-1] b.in.action.controller.HomeController    : getServletPath - /home
```

로그로 본 두 값은 같지만, 엄밀히 말하면 따지면 컨텍스트 패스(context path) 정보가 비어있기 때문에 같은 값을 가지는 것이다. 두 정보 사이의 차이점은 다음과 같다.

- 요청 URI는 클라이언트가 서버로 요청을 보낼 때 사용한 경로이다. 
- 서블릿 패스는 컨텍스트 패스 정보를 제외한 서블릿 컨테이너가 받은 경로이다.

대표적인 서블릿 컨테이너인 톰캣은 설정을 통해 하나의 호스트로 여러 개의 컨텍스트를 서비스할 수 있다. 서블릿 컨테이너는 서로 다른 기능을 하는 서비스 자원들을 컨텍스트라는 개념을 통해 디렉토리로 구분할 수 있다. 간단하게 톰캣 서버 설정을 변경 후 애플리케이션을 톰캣 서버에서 호스팅해보자.

### 3.1. Tomcat Server Config

설정 파일을 변경하기 전에 톰캣 서버는 디폴트 설정에 대해 먼저 정리한다. 

- 톰캣 서버는 기본적으로 8080 포트에서 서비스한다.
- 해당 서비스를 수행하는 호스트의 별도 컨텍스트 설정이 없다면 루트 컨텍스트를 사용한다.
- 별도 컨텍스트 설정이 없는 경우 루트(root, /) 컨텍스트는 webapps/ROOT 폴더의 자원을 사용한다.

아파치 톰캣 서버 디렉토리에서 conf/server.xml 파일을 열어 다음과 같이 수정한다. 

- 8080 포트를 사용하는 카탈리나 서비스의 호스트 내부에 두 개의 컨텍스트를 추가한다. 컨텍스트 경로는 다음과 같다.
  - /app
  - /admin
- 두 컨텍스트 경로로 접근하는 경우 webapps/ROOT 폴더의 자원을 사용하도록 설정한다.
  - 컨텍스트 경로 별로 다른 디렉토리를 설정하는 것이 기본 사용 방법이다.
  - 테스트 편의를 위해 루트 컨텍스트와 동일한 자원을 사용한다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Server port="8005" shutdown="SHUTDOWN">
  <Listener className="org.apache.catalina.startup.VersionLoggerListener" />
  <Listener className="org.apache.catalina.core.AprLifecycleListener" SSLEngine="on" />
  <Listener className="org.apache.catalina.core.JreMemoryLeakPreventionListener" />
  <Listener className="org.apache.catalina.mbeans.GlobalResourcesLifecycleListener" />
  <Listener className="org.apache.catalina.core.ThreadLocalLeakPreventionListener" />

  <GlobalNamingResources>
    <Resource name="UserDatabase" auth="Container"
              type="org.apache.catalina.UserDatabase"
              description="User database that can be updated and saved"
              factory="org.apache.catalina.users.MemoryUserDatabaseFactory"
              pathname="conf/tomcat-users.xml" />
  </GlobalNamingResources>

  <Service name="Catalina">
    <Connector port="8080" protocol="HTTP/1.1"
               connectionTimeout="20000"
               redirectPort="8443"
               maxParameterCount="1000" />
    
    <Engine name="Catalina" defaultHost="localhost">

      <Realm className="org.apache.catalina.realm.LockOutRealm">
        <Realm className="org.apache.catalina.realm.UserDatabaseRealm" resourceName="UserDatabase"/>
      </Realm>

      <Host name="localhost" appBase="webapps" unpackWARs="true" autoDeploy="true">

        <Valve className="org.apache.catalina.valves.AccessLogValve" directory="logs"
               prefix="localhost_access_log" suffix=".txt"
               pattern="%h %l %u %t &quot;%r&quot; %s %b" />
               
        <Context path="/app" docBase="./ROOT" reloadable="true"></Context>
        <Context path="/admin" docBase="./ROOT" reloadable="true"></Context>

      </Host>
    </Engine>
  </Service>
</Server>
```

톰캣 서버 설정이 끝났으면 톰캣 서비스를 실행한다.

```
$ sh bin/startup.sh

Using CATALINA_BASE:   /Users/junhyunk/Desktop/workspace/apache-tomcat
Using CATALINA_HOME:   /Users/junhyunk/Desktop/workspace/apache-tomcat
Using CATALINA_TMPDIR: /Users/junhyunk/Desktop/workspace/apache-tomcat/temp
Using JRE_HOME:        /Users/junhyunk/.sdkman/candidates/java/current
Using CLASSPATH:       /Users/junhyunk/Desktop/workspace/apache-tomcat/bin/bootstrap.jar:/Users/junhyunk/Desktop/workspace/apache-tomcat/bin/tomcat-juli.jar
Using CATALINA_OPTS:
Tomcat started.
```

### 3.2. Deploy Application

애플리케이션을 war 파일로 패키징(packaging)하여 톰캣 서버에 배포한다. 애플리케이션을 배포하는 방법은 [Deploy War Package for Spring Boot Project][deploy-spring-boot-project-as-war-link] 포스트를 참고하길 바란다. 

컨트롤러 코드를 다음과 같이 변경한다. HttpServletRequest 객체에 어떤 정보가 들어있는지 브라우저를 통해 확인하기 위해 다음과 같은 응답을 만든다.

```java
package blog.in.action.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/home")
    public String home(HttpServletRequest httpServletRequest) {
        return String.format("""
                            method - %s<br/>
                            scheme - %s<br/>
                            serverName - %s<br/>
                            serverPort - %s<br/>
                            contextPath - %s<br/>
                            servletPath - %s<br/>
                            requestURI - %s<br/>
                            requestURL - %s<br/>
                            queryString - %s
                        """,
                httpServletRequest.getMethod(),
                httpServletRequest.getScheme(),
                httpServletRequest.getServerName(),
                httpServletRequest.getServerPort(),
                httpServletRequest.getContextPath(),
                httpServletRequest.getServletPath(),
                httpServletRequest.getRequestURI(),
                httpServletRequest.getRequestURL(),
                httpServletRequest.getQueryString()
        );
    }
}
```

war 파일로 패키징한다.

```
$ ./gradlew war                                                      

Welcome to Gradle 8.5!

Here are the highlights of this release:
 - Support for running on Java 21
 - Faster first use with Kotlin DSL
 - Improved error and warning messages

For more details see https://docs.gradle.org/8.5/release-notes.html

Starting a Gradle Daemon, 1 incompatible Daemon could not be reused, use --status for details

BUILD SUCCESSFUL in 7s
3 actionable tasks: 2 executed, 1 up-to-date
```

패키징한 파일의 이름을 `ROOT.war`로 변경하여 톰캣 서버 webapps 경로로 배포한다. 

```
$ cp build/libs/action-in-blog-0.0.1-SNAPSHOT-plain.war ~/Desktop/workspace/apache-tomcat/webapps/ROOT.war
```

### 3.3. Test

톰캣 서버는 프로젝트 경로를 모니터링하다 ROOT.war 파일이 변경되면 패키징을 해제한다. 파일을 이동시킨 후 잠시 기다리면 브라우저를 통해 확인할 수 있다. 

#### 3.3.1. ROOT path

컨텍스트 경로가 루트인 경우 다음과 같은 결과를 볼 수 있다.

- 컨텍스트 경로는 빈 문자열이다.
- 서블릿 경로는 /home 이다.
- 요청 URI는 /home 이다.

<p align="center">
  <img src="/images/information-in-http-servlet-request-01.png" width="100%" class="image__border">
</p>

#### 3.3.2. /app path

컨텍스트 경로가 /app인 경우 다음과 같은 결과를 볼 수 있다.

- 컨텍스트 경로는 /app 이다.
- 서블릿 경로는 /home 이다.
- 요청 URI는 /app/home 이다.

<p align="center">
  <img src="/images/information-in-http-servlet-request-02.png" width="100%" class="image__border">
</p>

#### 3.3.3. /admin path

컨텍스트 경로가 /admin인 경우 다음과 같은 결과를 볼 수 있다.

- 컨텍스트 경로는 /admin 이다.
- 서블릿 경로는 /home 이다.
- 요청 URI는 /admin/home 이다.

<p align="center">
  <img src="/images/information-in-http-servlet-request-03.png" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-12-19-information-in-http-servlet-request>

#### REFERENCE

- <https://www.rfc-editor.org/rfc/rfc3986>
- <https://en.wikipedia.org/wiki/Uniform_Resource_Identifier>
- <https://en.wikipedia.org/wiki/URL>
- <https://en.wikipedia.org/wiki/Uniform_Resource_Name>
- <https://stackoverflow.com/questions/176264/what-is-the-difference-between-a-uri-a-url-and-a-urn>
- <https://enjoydevelop.tistory.com/111>
- <https://kingofbackend.tistory.com/153>
- <https://mygumi.tistory.com/139>

[deploy-spring-boot-project-as-war-link]: https://junhyunny.github.io/spring-boot/server/deploy-spring-boot-project-as-war/
[virtual-host-in-tomcat-link]: https://junhyunny.github.io/spring-boot/tomcat/virtual-host-in-tomcat/