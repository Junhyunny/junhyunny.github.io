---
title: "Spring Session with Redis"
search: false
category:
  - information
  - spring-boot
  - redis
last_modified_at: 2022-11-21T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Cookie and Session][cookie-and-session-link]
* [Deep dive into cookie][cookie-attributes-link]
* [Spring Session with JDBC][spring-session-link]
* [Embedded Redis Server][embedded-redis-server-link]

## 0. 들어가면서

[Spring Session with JDBC][spring-session-link] 포스트에선 데이터베이스와 `Spring Session`를 통해 다중 인스턴스 환경에서 세션을 공유하는 방법에 대해 다뤘습니다. 
이번 포스트에선 레디스(redis)와 `Spring Session`을 사용해 세션을 공유하는 방법에 대해 정리하였습니다. 
[Embedded Redis Server][embedded-redis-server-link] 포스트에서 사용한 예제 프로젝트를 확장하였으며 다음과 같은 방식으로 세션의 공유 여부를 확인하였습니다. 

* 도커 컴포즈(compose)를 사용해 백엔드 서비스 2개와 레디스 서비스 1개를 실행합니다.
    * backend-1 - exposed port number 8080
    * backend-2 - exposed port number 8081
    * redis-server - exposed port number 6379
* 사용자 브라우저로 두 백엔드 서비스에 번갈아 접근합니다.
    * `localhost:8080/session`, `localhost:8081/session` 주소에 접근합니다.
    * 세션 정보를 식별할 때 사용하는 아이디(id)는 쿠키에 함께 전달됩니다.
    * `SameSite`인 경우 쿠키를 공유하므로 두 요청은 동일한 세션을 사용하게 됩니다. 
    * `SameSite` 기준에 따라 포트 번호는 상관하지 않습니다.
    * [Deep dive into cookie][cookie-attributes-link]
* 세션 접근 카운트가 증가하는지 확인합니다.
    * 동일한 세션 정보를 사용한다면 세션 접근 카운트는 이어지면서 증가할 것 입니다.

<p align="center">
    <img src="/images/spring-session-with-redis-1.JPG" width="80%" class="image__border">
</p>

## 1. Spring Session 의존성 추가

다음과 같은 의존성들을 추가합니다.

```xml
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.session</groupId>
        <artifactId>spring-session-data-redis</artifactId>
    </dependency>
```

## 2. application-dev.yml

* 레디스 접속 정보를 다음과 같이 설정합니다.
    * host - 도커 컴포즈 파일의 레디스 컨테이너의 이름
    * password - 레디스 어플리케이션 접속 비밀번호 (임의 지정)
    * port - 레디스 어플리케이션 포트 번호
* 세션 저장소 타입을 `redis`로 설정합니다.

```yml
spring:
  redis:
    host: redis-server
    password: some-password
    port: 6379
  session:
    store-type: redis
```

## 3. SessionFilter 클래스

* 세션 정보를 조회할 때 파라미터를 `false`인 경우 세션을 새롭게 생성하지 않고, 존재하는 세션을 반환합니다.
* 세션 생성 URL 호출 시 해당 요청을 계속 진행합니다.
* 세션 생성 URL이 아닌 경우 다음과 같이 수행합니다.
    * 세션이 없는 경우 세션을 생성하는 경로로 리다이렉트(redirect)합니다.
    * 세션이 있는 경우 해당 요청을 계속 진행합니다.

```java
package action.in.blog.filter;

import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;

public class SessionFilter extends OncePerRequestFilter {

    private final String sessionCreationUri = "/session/creation";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        if (sessionCreationUri.equals(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }
        HttpSession httpSession = request.getSession(false);
        if (httpSession == null) {
            response.sendRedirect(sessionCreationUri);
            return;
        }
        filterChain.doFilter(request, response);
    }
}
```

## 4. SessionController 클래스

* 세션 정보를 조회할 때 파라미터가 없는 경우 세션 존재 여부에 따라 필요한 경우 새로운 세션을 생성 후 반환합니다.
* `/session/creation` 경로 접근
    * 기존 세션이 존재하는 경우 존재하는 세션을 획득합니다.
    * 기존 세션이 존재하지 않다면 새로운 세션을 생성 후 획득합니다.
    * `accessCount`를 키(key)로 세션에 초기 값 `0`을 저장합니다.
* `/session` 경로 접근
    * `accessCount`를 키로 세션 정보에 저장된 데이터를 찾습니다.
    * 저장된 데이터에 1을 더하여 세션에 다시 저장합니다.
    * 현재 조회한 데이터를 사용해 응답 문자열을 만들어 번환합니다.

```java
package action.in.blog.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;

@RestController
public class SessionController {

    private final String key = "accessCount";

    @GetMapping("/session/creation")
    public void createSession(HttpServletRequest servletRequest, HttpServletResponse servletResponse) throws IOException {
        HttpSession session = servletRequest.getSession();
        session.setAttribute(key, 0);
        servletResponse.sendRedirect("/session");
    }

    @GetMapping("/session")
    public String getSession(HttpSession session) throws IOException {
        int data = (int) session.getAttribute(key);
        session.setAttribute(key, data + 1);
        return "Current Data in Session - " + data;
    }
}
```

## 5. BaseConfig 클래스

### 5.1. 직렬화 방법 부재 시 문제점

별도로 `직렬화(serialize)` 방법을 정의해주지 않고, 데이터를 저장하면 다음과 같은 알아보기 힘든 데이터가 저장됩니다. 

* 기본적으로 `JdkSerializationRedisSerializer`를 사용합니다.

```
$ docker exec -it redis-server /bin/sh

# redis-cli
127.0.0.1:6379> auth some-password
OK

127.0.0.1:6379> keys *
1) "spring:session:sessions:a6b82253-4e7c-4579-82fb-9733989ba3b1"
2) "spring:session:sessions:expires:a6b82253-4e7c-4579-82fb-9733989ba3b1"
3) "spring:session:expirations:1669046940000"

127.0.0.1:6379> hgetall spring:session:sessions:a6b82253-4e7c-4579-82fb-9733989ba3b1
1) "sessionAttr:accessCount"
2) "\xac\xed\x00\x05sr\x00\x11java.lang.Integer\x12\xe2\xa0\xa4\xf7\x81\x878\x02\x00\x01I\x00\x05valuexr\x00\x10java.lang.Number\x86\xac\x95\x1d\x0b\x94\xe0\x8b\x02\x00\x00xp\x00\x00\x00\x01"
3) "creationTime"
4) "\xac\xed\x00\x05sr\x00\x0ejava.lang.Long;\x8b\xe4\x90\xcc\x8f#\xdf\x02\x00\x01J\x00\x05valuexr\x00\x10java.lang.Number\x86\xac\x95\x1d\x0b\x94\xe0\x8b\x02\x00\x00xp\x00\x00\x01\x84\x9a\xd7\x80\xdd"
5) "maxInactiveInterval"
6) "\xac\xed\x00\x05sr\x00\x11java.lang.Integer\x12\xe2\xa0\xa4\xf7\x81\x878\x02\x00\x01I\x00\x05valuexr\x00\x10java.lang.Number\x86\xac\x95\x1d\x0b\x94\xe0\x8b\x02\x00\x00xp\x00\x00\a\b"
7) "lastAccessedTime"
8) "\xac\xed\x00\x05sr\x00\x0ejava.lang.Long;\x8b\xe4\x90\xcc\x8f#\xdf\x02\x00\x01J\x00\x05valuexr\x00\x10java.lang.Number\x86\xac\x95\x1d\x0b\x94\xe0\x8b\x02\x00\x00xp\x00\x00\x01\x84\x9a\xd7\x81;"
```

### 5.2. 직렬화 방법 추가

* 레디스에 저장되는 값들을 알아보기 쉬운 데이터로 직렬화하는 빈(bean)을 생성합니다.

```java
package action.in.blog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializer;

@Configuration
public class BaseConfig {

    @Bean
    public RedisSerializer<Object> springSessionDefaultRedisSerializer() {
        return new GenericJackson2JsonRedisSerializer();
    }
}
```

## 6. 테스트 

도커 컴포즈를 사용해 서비스를 실행 후 다음과 같은 내용들을 확인합니다.

* 브라우저를 통해 세션이 공유되는지 확인합니다. 
* redis-server 컨테이너에 접근 후 `redis-cli` 커맨드를 통해 저장된 데이터를 확인합니다. 

##### Dockerfile

* 실행 환경을 `dev`로 주입 받습니다.

```dockerfile
FROM maven:3.8.6-jdk-11 as MAVEN_BUILD

WORKDIR /build

COPY pom.xml .

RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline

COPY src ./src

RUN --mount=type=cache,target=/root/.m2 mvn package -Dmaven.test.skip=true

FROM openjdk:11-jdk-slim-buster

WORKDIR /app

ARG JAR_FILE=*.jar

COPY --from=MAVEN_BUILD /build/target/${JAR_FILE} ./app.jar

EXPOSE 8080

ENV RUN_ENV dev

CMD ["java", "-Dspring.profiles.active=${RUN_ENV}", "-jar", "app.jar"]
```

##### docker-compose.yml

* 테스트를 위해 다음과 같은 yml 파일을 실행합니다.

```yml
version: "3.9"
services:
  redis:
    image: redis
    command: redis-server --requirepass some-password --port 6379
    container_name: redis-server
    ports:
      - '6379:6379'
  backend-1:
    build: .
    ports:
      - '8080:8080'
    depends_on:
      - redis
    restart: on-failure
  backend-2:
    build: .
    ports:
      - '8081:8080'
    depends_on:
      - redis
    restart: on-failure
```

##### 실행 로그

```
$ docker-compose up     

WARN[0000] Found orphan containers ([action-in-blog-backend-1]) for this project. If you removed or renamed this service in your compose file, you can run this command with the --remove-orphans flag to clean it up. 
[+] Running 4/4
 ⠿ Network action-in-blog_default        Created                                                                                                                                                                                                                                           0.0s
 ⠿ Container redis-server                Created                                                                                                                                                                                                                                           0.0s
 ⠿ Container action-in-blog-backend-2-1  Created                                                                                                                                                                                                                                           0.0s
 ⠿ Container action-in-blog-backend-1-1  Created                                                                                                                                                                                                                                           0.0s
Attaching to action-in-blog-backend-1-1, action-in-blog-backend-2-1, redis-server
redis-server                | 1:C 21 Nov 2022 15:49:29.329 # oO0OoO0OoO0Oo Redis is starting oO0OoO0OoO0Oo
redis-server                | 1:C 21 Nov 2022 15:49:29.329 # Redis version=7.0.5, bits=64, commit=00000000, modified=0, pid=1, just started
redis-server                | 1:C 21 Nov 2022 15:49:29.329 # Configuration loaded
redis-server                | 1:M 21 Nov 2022 15:49:29.330 * monotonic clock: POSIX clock_gettime
redis-server                | 1:M 21 Nov 2022 15:49:29.330 * Running mode=standalone, port=6379.
redis-server                | 1:M 21 Nov 2022 15:49:29.330 # Server initialized
redis-server                | 1:M 21 Nov 2022 15:49:29.331 * Ready to accept connections
action-in-blog-backend-1-1  | 
action-in-blog-backend-1-1  |   .   ____          _            __ _ _
action-in-blog-backend-1-1  |  /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
action-in-blog-backend-1-1  | ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
action-in-blog-backend-1-1  |  \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
action-in-blog-backend-1-1  |   '  |____| .__|_| |_|_| |_\__, | / / / /
action-in-blog-backend-1-1  |  =========|_|==============|___/=/_/_/_/
action-in-blog-backend-1-1  |  :: Spring Boot ::                (v2.7.5)
action-in-blog-backend-1-1  | 
action-in-blog-backend-2-1  | 
action-in-blog-backend-2-1  |   .   ____          _            __ _ _
action-in-blog-backend-2-1  |  /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
action-in-blog-backend-2-1  | ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
action-in-blog-backend-2-1  |  \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
action-in-blog-backend-2-1  |   '  |____| .__|_| |_|_| |_\__, | / / / /
action-in-blog-backend-2-1  |  =========|_|==============|___/=/_/_/_/
action-in-blog-backend-2-1  |  :: Spring Boot ::                (v2.7.5)
action-in-blog-backend-2-1  | 
action-in-blog-backend-1-1  | 2022-11-21 15:49:30.669  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : Starting ActionInBlogApplication v0.0.1-SNAPSHOT using Java 11.0.16 on d98a6e0d04fe with PID 1 (/app/app.jar started by root in /app)
action-in-blog-backend-1-1  | 2022-11-21 15:49:30.672  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : The following 1 profile is active: "dev"
action-in-blog-backend-2-1  | 2022-11-21 15:49:30.754  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : Starting ActionInBlogApplication v0.0.1-SNAPSHOT using Java 11.0.16 on 71d5f16faf75 with PID 1 (/app/app.jar started by root in /app)
action-in-blog-backend-2-1  | 2022-11-21 15:49:30.757  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : The following 1 profile is active: "dev"
action-in-blog-backend-1-1  | 2022-11-21 15:49:31.423  INFO 1 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Multiple Spring Data modules found, entering strict repository configuration mode
action-in-blog-backend-1-1  | 2022-11-21 15:49:31.426  INFO 1 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Bootstrapping Spring Data Redis repositories in DEFAULT mode.
action-in-blog-backend-1-1  | 2022-11-21 15:49:31.468  INFO 1 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Finished Spring Data repository scanning in 7 ms. Found 0 Redis repository interfaces.
action-in-blog-backend-2-1  | 2022-11-21 15:49:31.510  INFO 1 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Multiple Spring Data modules found, entering strict repository configuration mode
action-in-blog-backend-2-1  | 2022-11-21 15:49:31.513  INFO 1 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Bootstrapping Spring Data Redis repositories in DEFAULT mode.
action-in-blog-backend-2-1  | 2022-11-21 15:49:31.562  INFO 1 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Finished Spring Data repository scanning in 6 ms. Found 0 Redis repository interfaces.
action-in-blog-backend-1-1  | 2022-11-21 15:49:31.991  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
action-in-blog-backend-1-1  | 2022-11-21 15:49:32.004  INFO 1 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
action-in-blog-backend-1-1  | 2022-11-21 15:49:32.005  INFO 1 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.68]
action-in-blog-backend-2-1  | 2022-11-21 15:49:32.096  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
action-in-blog-backend-1-1  | 2022-11-21 15:49:32.099  INFO 1 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
action-in-blog-backend-1-1  | 2022-11-21 15:49:32.099  INFO 1 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 1366 ms
action-in-blog-backend-2-1  | 2022-11-21 15:49:32.111  INFO 1 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
action-in-blog-backend-2-1  | 2022-11-21 15:49:32.112  INFO 1 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.68]
action-in-blog-backend-2-1  | 2022-11-21 15:49:32.198  INFO 1 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
action-in-blog-backend-2-1  | 2022-11-21 15:49:32.198  INFO 1 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 1356 ms
action-in-blog-backend-1-1  | 2022-11-21 15:49:33.640  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
action-in-blog-backend-1-1  | 2022-11-21 15:49:33.744  INFO 1 --- [           main] s.a.ScheduledAnnotationBeanPostProcessor : No TaskScheduler/ScheduledExecutorService bean found for scheduled processing
action-in-blog-backend-1-1  | 2022-11-21 15:49:33.753  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : Started ActionInBlogApplication in 3.686 seconds (JVM running for 4.125)
action-in-blog-backend-2-1  | 2022-11-21 15:49:33.755  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
action-in-blog-backend-2-1  | 2022-11-21 15:49:33.843  INFO 1 --- [           main] s.a.ScheduledAnnotationBeanPostProcessor : No TaskScheduler/ScheduledExecutorService bean found for scheduled processing
action-in-blog-backend-2-1  | 2022-11-21 15:49:33.852  INFO 1 --- [           main] action.in.blog.ActionInBlogApplication   : Started ActionInBlogApplication in 3.761 seconds (JVM running for 4.187)
```

##### 브라우저 테스트

<p align="center">
    <img src="/images/spring-session-with-redis-2.gif" width="100%" class="image__border">
</p>

##### redis-cli 데이터 확인

```
$ docker exec -it redis-server /bin/sh

# redis-cli

127.0.0.1:6379> auth some-password
OK

127.0.0.1:6379> keys *
1) "spring:session:expirations:1669048200000"
2) "spring:session:sessions:008dbd11-cf0d-4333-b63c-a649a3acd605"
3) "spring:session:sessions:expires:008dbd11-cf0d-4333-b63c-a649a3acd605"

127.0.0.1:6379> hgetall spring:session:sessions:008dbd11-cf0d-4333-b63c-a649a3acd605
1) "lastAccessedTime"
2) "1669046346018"
3) "maxInactiveInterval"
4) "1800"
5) "creationTime"
6) "1669046318008"
7) "sessionAttr:accessCount"
8) "23"
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-11-21-spring-session-with-redis>

#### REFERENCE

* <https://minholee93.tistory.com/entry/ERROR-NOAUTH-Authentication-required>
* [Redis & Spring Session 연동 + Spring Session Redis \xac\xed\x00\x05sr\x00\x0ejava.lang.Long 해결법][redis-session-serializer-link]
* [Redis 내부에 session 저장/삭제][redis-session-save-delete-link]
* <https://deveric.tistory.com/76>

[cookie-and-session-link]: https://junhyunny.github.io/information/cookie-and-session/
[cookie-attributes-link]: https://junhyunny.github.io/information/security/cookie-attributes/
[spring-session-link]: https://junhyunny.github.io/information/spring-boot/spring-session/
[embedded-redis-server-link]: https://junhyunny.github.io/spring-boot/redis/embedded-redis-server/

[redis-session-serializer-link]: https://velog.io/@jungh00ns/Spring-Boot-Redis-Spring-Session-%EC%97%B0%EB%8F%99-Redis-%EB%A3%AC%EB%AC%B8%EC%9E%90-%ED%95%B4%EC%84%9D
[redis-session-save-delete-link]: https://velog.io/@sileeee/Redis%EB%82%B4%EB%B6%80%EC%97%90-session-%EC%A0%80%EC%9E%A5%EC%82%AD%EC%A0%9C