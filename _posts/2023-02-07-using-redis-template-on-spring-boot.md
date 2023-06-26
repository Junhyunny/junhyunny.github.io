---
title: "Using RedisTemplate on Spring Boot"
search: false
category:
  - spring-boot
  - redis
last_modified_at: 2023-02-06T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Embedded Redis Server][embedded-redis-server-link]

## 0. 들어가면서

현재 진행 중인 프로젝트의 특정 비즈니스에서 데이터를 저장할 수 있는 큐(queue)가 필요했습니다. 
다음과 같은 옵션이 있었습니다. 

* `Transactional Outbox Pattern`처럼 데이터베이스를 메세지 큐로 사용
* 사용자 세션(session)을 관리하는 레디스(redis)를 메세지 큐로 사용

데이터 크기가 작고, 엄격한 트랜잭션 관리가 필요 없기 때문에 레디스를 메세지 큐로 사용해보려고 합니다. 
이번 포스트는 간단한 시나리오를 토대로 레디스의 자료 구조 중 하나인 리스트(list)를 큐로 사용하는 예제를 다뤘습니다. 
 
## 1. Practice

### 1.1. Context of Practice

다음과 같은 실습 환경을 구축하였습니다. 

* 사용자는 서비스를 통해 다른 사용자를 초대(inviation)할 수 있습니다.
    * `/invitation` 경로
    * 초대 이벤트가 발생하면 초대받은 사람에게 메세지가 전송됩니다.
* 사용자는 자신이 다른 사용자를 초대했던 내용을 취소할 수 있습니다.
    * `/invitation/cancel` 경로
    * 초대 이벤트가 발생하면 초대받은 사람에게 메세지가 전송됩니다.
* 사용자는 자신 앞으로 전송된 메세지를 볼 수 있습니다.
    * `/user/messages/{userId}` 경로
    * 읽은 메세지들은 삭제됩니다.
* 사용자 역할은 터미널의 `cURL` 명령어로 대체하였습니다.

<p align="center">
    <img src="/images/using-redis-template-on-spring-boot-1.JPG" width="100%" class="image__border">
</p>

### 1.2. Structure of Package

다음과 같은 패키지 구조를 가집니다. 

```
./
├── Dockerfile
├── docker-compose.yml
├── mvnw
├── mvnw.cmd
├── pom.xml
├── run.sh
└── src
    ├── main
    │   ├── java
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               ├── ActionInBlogApplication.java
    │   │               ├── client
    │   │               │   ├── InvitationEventClient.java
    │   │               │   └── RedisInvitationEventClient.java
    │   │               ├── config
    │   │               │   ├── EmbeddedRedisServerConfig.java
    │   │               │   └── RedisTemplateConfig.java
    │   │               ├── controller
    │   │               │   ├── InvitationController.java
    │   │               │   └── UserController.java
    │   │               ├── domain
    │   │               │   ├── Invitation.java
    │   │               │   ├── InvitationMessage.java
    │   │               │   ├── InvitationStatus.java
    │   │               │   └── QueueChannel.java
    │   │               └── proxy
    │   │                   ├── EmbbededRedisUserMessageProxy.java
    │   │                   ├── RedisUserMessageProxy.java
    │   │                   └── UserMessageProxy.java
    │   └── resources
    │       ├── application-dev.yml
    │       ├── application-local.yml
    │       └── application.yml
    └── test
        └── java
            └── action
                └── in
                    └── blog
                        └── app
                            └── ActionInBlogApplicationTests.java
```

### 1.3. pom.xml

레디스를 사용하기 위해 다음과 같은 의존성들을 추가합니다. 

* `spring-boot-starter-data-redis` 의존성
    * 레디스의 클라이언트(client) 기능을 사용할 수 있습니다.
* `embedded-redis` 의존성
    * 레디스 컨테이너 없이 개발자 로컬 컴퓨터에서 어플리케이션과 함께 실행되는 임시 메모리 레디스 서비스를 사용할 수 있습니다.  

```xml
    <dependencies>
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
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
    </dependencies>
```

### 1.4. application-dev.yml

어플리케이션이 레디스 서버에 붙기 위한 접속 정보입니다. 

```yml
spring:
  redis:
    host: redis-server
    password:
    port: 6379
```

## 2. Implementation

실제 구현 코드를 살펴보겠습니다. 
인터페이스를 통해 추상화한 코드도 있지만, 설명은 제외하였습니다. 
서비스 구현체와 도메인 객체들에 대해 주로 설명하였습니다. 

### 2.1. RedisTemplateConfig Class

* `RedisTemplate` 빈(bean) 객체를 생성합니다. 
* 레디스 커낵션(connection)을 생성하는 팩토리 빈을 생성합니다.
    * `LettuceConnectionFactory` 클래스를 사용합니다.
    * [Jedis 보다 Lettuce 를 쓰자][redis-connection-pool-performance-link]
* 레디스에 객체를 `JSON` 형태로 저장할 수 있도록 `ValueSerializer` 빈을 생성합니다.
    * `GenericJackson2JsonRedisSerializer` 클래스를 사용합니다.

```java
package action.in.blog.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
@EnableRedisRepositories
public class RedisTemplateConfig {

    @Value("${spring.redis.host}")
    private String host;
    @Value("${spring.redis.port}")
    private int port;

    @Bean
    public RedisSerializer<Object> springSessionDefaultRedisSerializer() {
        return new GenericJackson2JsonRedisSerializer();
    }

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory(host, port);
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(
            RedisConnectionFactory connectionFactory,
            RedisSerializer<Object> springSessionDefaultRedisSerializer
    ) {
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(connectionFactory);
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        redisTemplate.setValueSerializer(springSessionDefaultRedisSerializer);
        return redisTemplate;
    }
}
```

### 2.2. InvitationController Class

* `/invitation` 경로
    * 초대 요청을 받으면 해당 이벤트 메세지를 `InvitationEventClient`를 통해 전달합니다. 
* `/invitation/cancel` 경로
    * 초대 취소 요청을 받으면 해당 이벤트 메세지를 `InvitationEventClient`를 통해 전달합니다. 

```java
package action.in.blog.controller;

import action.in.blog.client.InvitationEventClient;
import action.in.blog.domain.Invitation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
public class InvitationController {

    private final InvitationEventClient invitationEventClient;

    @PostMapping("/invitation")
    public void createPost(@RequestBody Invitation invitation) {
        invitationEventClient.pushInvitationMessage(invitation);
    }

    @PostMapping("/invitation/cancel")
    public void updatePost(@RequestBody Invitation invitation) {
        invitationEventClient.pushInvitationCancelMessage(invitation);
    }
}
```

#### 2.2.1. Invitation Class

초대(invitation)에는 초대자, 초대 받는 사람 정보가 존재합니다.

```java
package action.in.blog.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class Invitation {

    private String inviter;
    private String invitee;
}
```

### 2.3. RedisInvitationEventClient Class

초대 이벤트를 전달하는 클라이언트 클래스를 살펴보겠습니다.

* `pushInvitationMessage` 메소드
    * 초대자, 초대 상태 정보를 메세지에 담습니다.
    * `RedisTemplate`을 통해 초대 메세지를 전달합니다.
    * 키 값은 채널명과 초대받는 사람 정보를 조합합니다.
* `pushInvitationCancelMessage` 메소드
    * 초대자, 초대 취소 상태 정보를 메세지에 담습니다.
    * `RedisTemplate`을 통해 초대 메세지를 전달합니다.
    * 키 값은 채널명과 초대받는 사람 정보를 조합합니다.

```java
package action.in.blog.client;

import action.in.blog.domain.Invitation;
import action.in.blog.domain.InvitationMessage;
import action.in.blog.domain.InvitationStatus;
import action.in.blog.domain.QueueChannel;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RedisInvitationEventClient implements InvitationEventClient {

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void pushInvitationMessage(Invitation invitation) {
        String key = invitation.getInvitee();
        InvitationMessage message = InvitationMessage.builder()
                .inviter(invitation.getInviter())
                .status(InvitationStatus.INVITATION)
                .build();
        redisTemplate.opsForList().rightPush(QueueChannel.INVITATION.of(key), message);
    }

    @Override
    public void pushInvitationCancelMessage(Invitation invitation) {
        String key = invitation.getInvitee();
        InvitationMessage message = InvitationMessage.builder()
                .inviter(invitation.getInviter())
                .status(InvitationStatus.INVITATION_CANCEL)
                .build();
        redisTemplate.opsForList().rightPush(QueueChannel.INVITATION.of(key), message);
    }
}
```

#### 2.3.1. InvitationMessage Class

초대 메세지(invitation message)에는 초대자, 초대 상태 정보가 존재합니다.

```java
package action.in.blog.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class InvitationMessage {
    private String inviter;
    private InvitationStatus status;
}
```

#### 2.3.2. QueueChannel Enum

레디스 리스트의 키 값을 안정적으로 사용하기 위해 `enum` 객체를 사용합니다. 
비즈니스에 맞는 채널 명칭과 특정 키 값을 조합하여 채널 이름을 생성합니다.

```java
package action.in.blog.domain;

public enum QueueChannel {

    INVITATION;

    public String of(String key) {
        return String.format("%s-%s", INVITATION.name(), key);
    }
}
```

### 2.4. UserController Class

사용자는 ID를 사용해 자신에게 전달된 메세지를 볼 수 있습니다. 

```java
package action.in.blog.controller;

import action.in.blog.domain.InvitationMessage;
import action.in.blog.proxy.UserMessageProxy;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequiredArgsConstructor
@RestController
public class UserController {

    private final UserMessageProxy userMessageProxy;

    @GetMapping("/user/messages/{userId}")
    public List<InvitationMessage> getInvitationMessage(@PathVariable("userId") String userId) {
        return userMessageProxy.getInvitationMessage(userId);
    }
}
```

### 2.4. RedisUserMessageProxy Class

* `ID`에 해당하는 메세지를 수신합니다.
* 메세지를 꺼냄과 동시에 레디스 리스트에서 제거하기 위해 `leftPop` 메소드를 사용합니다.

```java
package action.in.blog.proxy;

import action.in.blog.domain.InvitationMessage;
import action.in.blog.domain.QueueChannel;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Profile("!local")
@Component
@RequiredArgsConstructor
public class RedisUserMessageProxy implements UserMessageProxy {

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public List<InvitationMessage> getInvitationMessage(String userId) {
        String channel = QueueChannel.INVITATION.of(userId);
        long size = redisTemplate.opsForList().size(channel);
        return (List) redisTemplate.opsForList().leftPop(channel, size);
    }
}
```

## 3. Test

도커 컴포즈(docker compose)로 테스트 환경을 구축합니다.

### 3.1. docker-compose.yml

```yml
version: "3.9"
services:
  redis:
    image: redis
    command: redis-server --port 6379
    container_name: redis-server
    ports:
      - '6379:6379'
  backend:
    build: .
    ports:
      - '8080:8080'
    depends_on:
      - redis
    restart: on-failure
```

### 3.2. Run Docker Compose

```
$ docker-compose up -d          
[+] Running 0/1
 ⠼ redis Pulling                                                                                                                      2.5s 
[+] Running 7/7                                                                                                                            
 ⠿ redis Pulled                                                                                                                      16.7s
   ⠿ 01b5b2efb836 Pull complete                                                                                                      11.4s
   ⠿ 038563e09193 Pull complete                                                                                                      11.5s
   ⠿ 09e93db1172f Pull complete                                                                                                      11.5s
   ⠿ 33dc85c1365d Pull complete                                                                                                      11.8s
   ⠿ a94300c1bc96 Pull complete                                                                                                      11.8s
   ⠿ 94c06f943e48 Pull complete                                                                                                      11.9s
[+] Building 1.4s (15/15) FINISHED                                                                                                         
 => [internal] load build definition from Dockerfile                                                                                  0.0s
 => => transferring dockerfile: 32B                                                                                                   0.0s
 => [internal] load .dockerignore                                                                                                     0.0s
 => => transferring context: 2B                                                                                                       0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                         1.0s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                 1.3s
 => [internal] load build context                                                                                                     0.0s
 => => transferring context: 2.18kB                                                                                                   0.0s
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa  0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9  0.0s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                 0.0s
 => CACHED [maven_build 2/6] WORKDIR /build                                                                                           0.0s
 => CACHED [maven_build 3/6] COPY pom.xml .                                                                                           0.0s
 => CACHED [maven_build 4/6] RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline                                        0.0s
 => CACHED [maven_build 5/6] COPY src ./src                                                                                           0.0s
 => CACHED [maven_build 6/6] RUN --mount=type=cache,target=/root/.m2 mvn package -Dmaven.test.skip=true                               0.0s
 => CACHED [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                        0.0s
 => exporting to image                                                                                                                0.0s
 => => exporting layers                                                                                                               0.0s
 => => writing image sha256:6773770f70cde26efb40cf2a2d0b9d1198cbe7003f7accf94c33f482e0d915c9                                          0.0s
 => => naming to docker.io/library/action-in-blog-backend                                                                             0.0s
[+] Running 2/2
 ⠿ Container redis-server              Started                                                                                        0.5s
 ⠿ Container action-in-blog-backend-1  Started                                                                                        0.6s
```

### 3.3. Run Shell Script

다음과 같은 명령어를 터미널에서 수행합니다. 
초대, 초대 취소를 각각 1회씩 요청합니다.

```
$ curl -X POST\
  -H "Content-Type: application/json"\
  -d '{"inviter": "Junhyunny", "invitee": "Jua"}'\
  http://localhost:8080/invitation

$ curl -X POST\
  -H "Content-Type: application/json"\
  -d '{"inviter": "Junhyunny", "invitee": "Jua"}'\
  http://localhost:8080/invitation/cancel
```

##### Result of Test

메세지 조회 명령어를 수행합니다. 
2회 수행하면 빈 리스트가 오는 것을 확인할 수 있습니다. 

```
$ curl http://localhost:8080/user/messages/Jua | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   100    0   100    0     0   2025      0 --:--:-- --:--:-- --:--:--  2380
[
  {
    "inviter": "Junhyunny",
    "status": "INVITATION"
  },
  {
    "inviter": "Junhyunny",
    "status": "INVITATION_CANCEL"
  }
]

$ curl http://localhost:8080/user/messages/Jua | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100     2    0     2    0     0    135      0 --:--:-- --:--:-- --:--:--   250
[]
```

## CLOSING

개발자 로컬 컴퓨터에서 서비스를 실행할 때마다 매번 레디스 컨테이너를 띄우는 일은 매우 번거롭습니다. 
내장(embedded) 레디스를 사용하면 별도 컨테이너 없이도 레디스 서버를 이용할 수 있습니다. 
내장 레디스 서버는 해당 어플리케이션이 실행될 때 함께 실행됩니다. 

한 가지 문제점은 실제 레디스 컨테이너는 아니기 때문에 `RedisTemplate`을 사용하는 특정 메소드에서 에러가 날 수 있습니다. 
이번 포스트의 경우 `leftPop` 기능이 내장 레디스 서버에선 에러가 발생하기 때문에 다른 방식을 사용하였습니다. 

```java
package action.in.blog.proxy;

import action.in.blog.domain.InvitationMessage;
import action.in.blog.domain.QueueChannel;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Profile("local")
@Component
@RequiredArgsConstructor
public class EmbbededRedisUserMessageProxy implements UserMessageProxy {

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public List<InvitationMessage> getInvitationMessage(String userId) {
        String channel = QueueChannel.INVITATION.of(userId);
        long size = redisTemplate.opsForList().size(channel);
        List<InvitationMessage> result = (List) redisTemplate.opsForList().range(channel, 0, size);
        redisTemplate.delete(channel);
        return result;
    }
}
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-02-07-using-redis-template-on-spring-boot>

#### REFERENCE

* <https://sarc.io/index.php/cloud/1944-msa-transactional-outbox-pattern>
* <https://jojoldu.tistory.com/418>

[embedded-redis-server-link]: https://junhyunny.github.io/spring-boot/redis/embedded-redis-server/
[redis-connection-pool-performance-link]: https://jojoldu.tistory.com/418