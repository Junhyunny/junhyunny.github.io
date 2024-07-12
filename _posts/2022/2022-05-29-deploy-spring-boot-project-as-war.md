---
title: "Deploy war package when using spring boot framework"
search: false
category:
  - spring-boot
  - server
last_modified_at: 2022-05-29T23:55:00
---

<br/>

## 0. 들어가면서

현재 프로젝트에서 레거시 시스템의 기술 스택을 변경하고 있다.

- `JSP`를 `Vue`로 전환
- `Spring MVC`를 `Spring Boot`로 전환

애플리케이션의 프레임워크는 변경했지만, 배포 환경까지 바꾸진 못 했다. 여전히 톰캣 서버에 war 패키지로 배포한다. 스프링 부트는 기본적으로 실행 가능한 jar(executable jar)로 패키징 되므로 war 파일로 패키징 하려면 별도 작업이 필요하다. 이번 글은 스프링 부트 프레임워크를 war 파일로 패키징하는 방법에 대해 정리했다.

## 1. pom XML

메이븐 프로젝트이기 때문에 `pom.xml`을 사용한다. 스프링 부트 프레임워크는 임베디드 톰캣(embedded tomcat)을 사용하기 때문에 jar 패키지로 애플리케이션을 즉시 실행 가능하다. 톰캣 서버 위에서 스프링 부트 애플리케이션을 실행하려면 연결 고리를 만들어줘야 한다. 다음 의존성을 필요하다.

- spring-boot-starter-tomcat 의존성
- `provided` 스코프를 사용한다.
  - 컴파일 시 제공하고, 런타임 시점엔 JDK 혹은 컨테이너가 제공합니다.

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-tomcat</artifactId>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

패키징 방법을 변경한다. `jar`가 기본이기 때문에 `war`를 명시적으로 표시한다. 

```xml
    <groupId>action.in.blog</groupId>
    <artifactId>action-in-blog</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>action-in-blog</name>
    <packaging>war</packaging> <!-- this line -->
    <description>action-in-blog</description>
```

## 2. Extends SpringBootServletInitializer Class

오래된 코드들을 보면 configure 메소드를 오버라이드 하지만, 현재는 필요하지 않다. configure 메소드를 오버라이딩 하지 않는다.

```java
package action.in.blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
public class ActionInBlogApplication extends SpringBootServletInitializer {

    public static void main(String[] args) {
        SpringApplication.run(ActionInBlogApplication.class, args);
    }

    // 정상적으로 배포되지 않는 경우 해당 주석을 풀어보길 바란다.
    // @Override
    // protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
    //     return builder.sources(ActionInBlogApplication.class);
    // }
}
```

## 3. Packaging and deploy

프로젝트를 패키징한다. `mvn package` 명령어를 사용한다.

```
$ mvn package

[INFO] Scanning for projects...
[INFO] 
[INFO] -------------------< action.in.blog:action-in-blog >--------------------
[INFO] Building action-in-blog 0.0.1-SNAPSHOT
[INFO] --------------------------------[ war ]---------------------------------
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:resources (default-resources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] Copying 1 resource
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.10.1:compile (default-compile) @ action-in-blog ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:testResources (default-testResources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] skip non existing resourceDirectory /Users/junhyunk/Desktop/workspace/blog-in-action/2022-05-30-deploy-spring-boot-project-as-war/action-in-blog/src/test/resources
[INFO] 
[INFO] --- maven-compiler-plugin:3.10.1:testCompile (default-testCompile) @ action-in-blog ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-surefire-plugin:2.22.2:test (default-test) @ action-in-blog ---
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running action.in.blog.ActionInBlogApplicationTests

...

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v2.7.0)

2022-05-30 03:52:22.960  INFO 67971 --- [           main] a.in.blog.ActionInBlogApplicationTests   : Starting ActionInBlogApplicationTests using Java 17.0.1 on junhyunk-a01.vmware.com with PID 67971 (started by junhyunk in /Users/junhyunk/Desktop/workspace/blog-in-action/2022-05-30-deploy-spring-boot-project-as-war/action-in-blog)
2022-05-30 03:52:22.961  INFO 67971 --- [           main] a.in.blog.ActionInBlogApplicationTests   : No active profile set, falling back to 1 default profile: "default"
2022-05-30 03:52:23.903  INFO 67971 --- [           main] a.in.blog.ActionInBlogApplicationTests   : Started ActionInBlogApplicationTests in 1.223 seconds (JVM running for 1.973)
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.829 s - in action.in.blog.ActionInBlogApplicationTests
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] 
[INFO] --- maven-war-plugin:3.3.2:war (default-war) @ action-in-blog ---
[INFO] Packaging webapp
[INFO] Assembling webapp [action-in-blog] in [/Users/junhyunk/Desktop/workspace/blog-in-action/2022-05-30-deploy-spring-boot-project-as-war/action-in-blog/target/action-in-blog-0.0.1-SNAPSHOT]
[INFO] Processing war project
[INFO] Building war: /Users/junhyunk/Desktop/workspace/blog-in-action/2022-05-30-deploy-spring-boot-project-as-war/action-in-blog/target/action-in-blog-0.0.1-SNAPSHOT.war
[INFO] 
[INFO] --- spring-boot-maven-plugin:2.7.0:repackage (repackage) @ action-in-blog ---
[INFO] Replacing main artifact with repackaged archive
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  4.625 s
[INFO] Finished at: 2022-05-30T03:52:25+09:00
[INFO] ------------------------------------------------------------------------
```

톰캣 서버가 필요하다. 설치 방법에 대한 설명은 생략한다. 톰캣 실행 파일 디렉토리에서 `startup.sh` 파일을 실행한다. 윈도우즈(windows)인 경우 `.bat` 파일을 사용한다.

```
$ sh ~/apache-tomcat-8.5.79/bin/startup.sh

Using CATALINA_BASE:   /Users/junhyunk/apache-tomcat-8.5.79
Using CATALINA_HOME:   /Users/junhyunk/apache-tomcat-8.5.79
Using CATALINA_TMPDIR: /Users/junhyunk/apache-tomcat-8.5.79/temp
Using JRE_HOME:        /Library/Java/JavaVirtualMachines/jdk-11.0.13.jdk/Contents/Home
Using CLASSPATH:       /Users/junhyunk/apache-tomcat-8.5.79/bin/bootstrap.jar:/Users/junhyunk/apache-tomcat-8.5.79/bin/tomcat-juli.jar
Using CATALINA_OPTS:
Tomcat started.
```

위에서 패키징 한 war 파일을 톰캣 서버의 `webapps` 디렉토리로 옮기면 애플리케이션이 호스팅된다. war 파일 이름은 `ROOT`를 지정한다. 톰캣 서버는 ROOT 폴더 내 자원을 서비스하기 때문에 별다른 설정이 없다면 반드시 `ROOT`를 사용해야 한다.

- 톰캣 서버 webapps 디렉토리에 ROOT 폴더를 삭제한다.

```
$ rm -rf ~/apache-tomcat-8.5.79/webapps/ROOT
```

- 스프링 부트 프로젝트의 target 경로에 생성된 `.war` 파일을 `${TOMCAT_HOME}/webapp` 경로로 이동한다.
  - 파일 이름은 `ROOT.war`을 사용한다.
- 시간이 지나면 ROOT.war 파일이 자동으로 언패키징(unpackaging)된다.
  - ROOT 폴더가 생성된다.

```
$ mv target/action-in-blog-0.0.1-SNAPSHOT.war ~/apache-tomcat-8.5.79/webapps/ROOT.war
```

이제 서버 로그를 살펴보자. 톰캣 서버의 logs 폴더 `catalina.out` 파일에서 실행 로그를 확인할 수 있다.

```
$ tail -f -n 100 ~/apache-tomcat-8.5.79/logs/catalina.out

NOTE: Picked up JDK_JAVA_OPTIONS:  --add-opens=java.base/java.lang=ALL-UNNAMED --add-opens=java.base/java.io=ALL-UNNAMED --add-opens=java.base/java.util=ALL-UNNAMED --add-opens=java.base/java.util.concurrent=ALL-UNNAMED --add-opens=java.rmi/sun.rmi.transport=ALL-UNNAMED
30-May-2022 04:10:14.180 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 서버 버전 이름:    Apache Tomcat/8.5.79
30-May-2022 04:10:14.183 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log Server 빌드 시각:  May 16 2022 15:36:23 UTC
30-May-2022 04:10:14.184 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log Server 버전 번호:  8.5.79.0
30-May-2022 04:10:14.184 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 운영체제 이름:     Mac OS X
30-May-2022 04:10:14.184 INFO [main] org.apache.catalina.startup.VersionLoggerListener.log 운영체제 버전:     11.3

...


  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v2.7.0)

2022-05-30 04:10:16.080  INFO 75699 --- [ost-startStop-1] action.in.blog.ActionInBlogApplication   : Starting ActionInBlogApplication v0.0.1-SNAPSHOT using Java 11.0.13 on junhyunk-a01.vmware.com with PID 75699 (/Users/junhyunk/apache-tomcat-8.5.79/webapps/ROOT/WEB-INF/classes started by junhyunk in /Users/junhyunk)

...

30-May-2022 04:10:17.379 INFO [main] org.apache.coyote.AbstractProtocol.start 프로토콜 핸들러 ["http-nio-8080"]을(를) 시작합니다.
30-May-2022 04:10:17.388 INFO [main] org.apache.catalina.startup.Catalina.start Server startup in 3134 ms
2022-05-30 04:10:20.415  INFO 75699 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : Initializing Servlet 'dispatcherServlet'
2022-05-30 04:10:20.416  INFO 75699 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : Completed initialization in 1 ms
```

서비스가 준비되면 브라우저에서 실행 모습을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2022/deploy-spring-boot-project-as-war-01.gif" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-05-30-deploy-spring-boot-project-as-war>

#### RECOMMEND NEXT POSTS

- [Not Found(404) when react application is hosted on Tomcat][not-found-when-hosting-react-app-on-tomcat-link]

#### REFERENCE

- <https://oingdaddy.tistory.com/344>
- <https://oingdaddy.tistory.com/346>
- <https://recordsoflife.tistory.com/392>

[not-found-when-hosting-react-app-on-tomcat-link]: https://junhyunny.github.io/spring-boot/react/tomcat/not-found-when-hosting-react-app-on-tomcat/