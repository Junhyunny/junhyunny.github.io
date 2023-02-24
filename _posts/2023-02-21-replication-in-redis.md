---
title: "Replication in Redis"
search: false
category:
  - spring-boot
  - redis
last_modified_at: 2023-02-21T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Embedded Redis Server][embedded-redis-server-link]
* [Using RedisTemplate on Spring Boot][using-redis-template-on-spring-boot-link]
* [Patterns for Cache][patterns-for-cache-link]

## 0. 들어가면서

레디스(redis) 같은 캐시 서비스를 사용할 때 고가용성(high availability)에 대한 고민이 필요합니다. 
단일 인스턴스로 구성된 캐시 서버에 잠깐이라도 장애가 발생하면 전체 시스템이 마비될 수 있습니다. 

* 예기치 서비스 인프라 장애가 발생하더라도 사용자에게 중단 없이 서비스를 제공할 수 있습니다. 
* 특정 서비스의 장애가 시스템 전체로 전파되는 위험을 최소화합니다.

## 1. Replication in Redis

레플리케이션(replication)은 레디스의 고가용성 구축을 위한 전략 중 하나입니다. 

* 마스터(master) 인스턴스와 슬레이브(slave) 인스턴스들로 구성됩니다.
* 클라이언트(client)는 마스터 인스턴스를 통해 읽기(read), 쓰기(write)가 가능합니다.
* 마스터 인스턴스에 저장된 데이터는 슬레이브 인스턴스에 주기적으로 동기화(syncronize)됩니다.
* 마스터 인스턴스에 문제가 발생하는 경우 이를 슬레이브 인스턴스가 대체합니다.
    * 슬레이브 인스턴스는 읽기 연산에 대해서만 정상적인 동작을 보장합니다.

<p align="center">
    <img src="/images/replication-in-redis-1.JPG" width="80%" class="image__border">
</p>
<center>https://www.vinsguru.com/redis-master-slave-with-spring-boot/</center>

## 2. Practice

### 2.1. Context of Practice

간단한 시나리오를 바탕으로 어플리케이션 구현과 레디스 레플리케이션을 구축해보겠습니다.

* 어플리케이션 화면을 통해 간단한 메세지를 전송합니다.
* 전송한 메세지는 레디스 리스트(list)에 저장됩니다.
* 레디스 리스트는 두 개 존재합니다.
    * 읽지 않은 메세지들을 저장하는 리스트
    * 읽은 메세지들을 저장하는 리스트
* 메인 화면에서 API 호출을 통해 읽지 않은 메세지가 몇 개인지 확인할 수 있습니다.
* 리스트 별 메세지 현황을 볼 수 있는 화면에서 각 리스트에 담긴 메세지를 확인할 수 있습니다.
    * 왼쪽은 읽지 않은 메세지 리스트입니다.
    * 오른쪽은 읽은 메세지 리스트입니다.
    * 해당 화면을 새로고침하거나 메인 화면에서 다시 진입하면 읽은 메세지들은 모두 오른쪽으로 이동합니다.

<p align="center">
    <img src="/images/replication-in-redis-2.JPG" width="100%" class="image__border">
</p>

### 2.2. Focus this point

테스트를 통해 다음 내용을 유의 깊게 살펴봅니다. 
읽기 기능은 리스트의 상태를 바꾸지 않는 연산입니다. 
반대로 쓰기 기능은 리스트의 상태를 바꾸는 연산입니다. 

* 메인 화면에서 읽지 않은 메세지 개수를 조회하는 기능은 읽기입니다.
* 새로운 메세지를 작성하는 기능은 쓰기 연산입니다.
* 메시지 리스트 현황 화면으로 이동할 때 쓰기 연산이 발생합니다.
    * 읽지 않은 메시지 리스트에서 메세지들을 모두 꺼내어(pop) 읽은 메세지 리스트로 이동합니다.
* 마스터 인스턴스를 중지시켰을 때 다음 내용들을 예상합니다.
    * 읽기 연산이 가능한 메인 화면 새로고침은 정상적으로 동작합니다.
    * 새로운 메세지를 작성 후 전송 버튼을 누르면 쓰기 연산이므로 정상 동작하지 않습니다.
    * 리스트 상황 페이지로 이동하면 쓰기 연산이 발생하므로 정상 동작하지 않습니다.
* 슬레이브 인스턴스를 중지시켰을 때 모든 기능이 정상적으로 동작하는 것을 예상합니다.

## 3. Implementation

사용자 화면은 타임리프(thymeleaf) 템플릿 엔진을 사용하였습니다. 
지금부터 구현 코드와 설정들을 살펴보겠습니다. 
모든 클래스들을 살펴보진 않고, 중요한 기능들만 살펴보겠습니다.

### 3.1. Packages

```
./
├── Dockerfile
├── conf
│   ├── redis-master.conf
│   ├── redis-slave-1.conf
│   ├── redis-slave-2.conf
│   └── redis.conf
├── docker-compose-replication.yml
├── mvnw
├── mvnw.cmd
├── pom.xml
├── shell
│   └── redis-replication.sh
└── src
    ├── main
    │   ├── java
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               ├── ActionInBlogApplication.java
    │   │               ├── client
    │   │               │   ├── MessageClient.java
    │   │               │   └── RedisMessageClient.java
    │   │               ├── config
    │   │               │   ├── RedisConfiguration.java
    │   │               │   └── RedisTemplateConfig.java
    │   │               ├── controller
    │   │               │   └── RedisController.java
    │   │               └── domain
    │   │                   ├── Message.java
    │   │                   ├── MessageGroup.java
    │   │                   └── Queue.java
    │   └── resources
    │       ├── application.yml
    │       └── templates
    │           ├── index.html
    │           └── messages.html
    └── test
        └── java
            └── action
                └── in
                    └── blog
                        └── ActionInBlogApplicationTests.java
```

### 3.2. pom.xml

* 레디스, 타임리프 관련 의존성을 추가합니다.

```xml
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-thymeleaf</artifactId>
    </dependency>
```

### 3.3. application.yml

* 마스터, 슬레이브 인스턴스 정보를 추가합니다.
    * 호스트 정보는 도커 컴포즈(docker compose) 파일에 정의된 호스트 이름을 사용합니다.

```yml
spring:
  mvc:
    static-path-pattern: /static/**
  thymeleaf:
    prefix: classpath:templates/
    check-template-location: true
    suffix: .html
    mode: HTML5
    cache: false
redis:
  master:
    host: redis-master
    port: 6379
  slaves:
    - host: redis-slave-1
      port: 6379
    - host: redis-slave-2
      port: 6379
```

### 3.4. RedisConfiguration Class

* 마스터, 슬레이브 설정 값을 주입받는 빈(bean) 객체입니다.

```java
package action.in.blog.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Getter
@Setter
class RedisInstance {

    private String host;
    private int port;
}

@Setter
@Getter
@Configuration
@ConfigurationProperties(prefix = "redis")
public class RedisConfiguration {

    private RedisInstance master;
    private List<RedisInstance> slaves;
}
```

### 3.5. RedisTemplateConfig Class

* `application.yml` 파일에 정의한 마스터, 슬레이브 설정 값을 사용해 `RedisConnectionFactory` 빈을 생성합니다.

```java
package action.in.blog.config;

import io.lettuce.core.ReadFrom;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStaticMasterReplicaConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@RequiredArgsConstructor
@Configuration
@EnableRedisRepositories
public class RedisTemplateConfig {

    private final RedisConfiguration redisConfiguration;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
                .readFrom(ReadFrom.REPLICA_PREFERRED)
                .build();
        RedisStaticMasterReplicaConfiguration staticMasterReplicaConfiguration = new RedisStaticMasterReplicaConfiguration(
                redisConfiguration.getMaster().getHost(),
                redisConfiguration.getMaster().getPort()
        );
        redisConfiguration.getSlaves().forEach(slave -> staticMasterReplicaConfiguration.addNode(slave.getHost(), slave.getPort()));
        return new LettuceConnectionFactory(staticMasterReplicaConfiguration, clientConfig);
    }

    @Bean
    public RedisSerializer<Object> springSessionDefaultRedisSerializer() {
        return new GenericJackson2JsonRedisSerializer();
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

### 3.6. RedisController Class

* 각 경로 별 기능은 다음과 같습니다.
* `/` 경로
    * 기본 페이지를 반환합니다.
    * 현재 읽지 않은 메세지 리스트 사이즈를 모델에 담아 반환합니다.
* `/message` 경로
    * 신규 메세지를 생성합니다.
    * 현재 읽지 않은 메세지 리스트 사이즈를 모델에 담아 반환합니다.
* `/unread-list/size`
    * 현재 읽지 않은 메세지 리스트 사이즈를 모델에 담아 반환합니다.
* `/messages` 경로
    * 현재 두 리스트의 담긴 메세지들을 보여줍니다. 
* `/messages/flush` 경로
    * 읽지 않은 리스트에 담긴 메세지들을 읽은 리스트로 옮깁니다.

```java
package action.in.blog.controller;

import action.in.blog.client.MessageClient;
import action.in.blog.domain.MessageGroup;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@RequiredArgsConstructor
@Controller
public class RedisController {

    private final MessageClient messageClient;

    @GetMapping(value = {"", "/"})
    public String index(Model model) {
        model.addAttribute("unreadListSize", messageClient.getUnreadMessagesSize());
        return "index";
    }

    @PostMapping("/message")
    public String createMessage(Model model, @ModelAttribute("message") String message) {
        messageClient.pushMessage(message);
        model.addAttribute("unreadListSize", messageClient.getUnreadMessagesSize());
        return "index :: fragment";
    }

    @GetMapping("/unread-list/size")
    public String getUnreadListSize(Model model) {
        model.addAttribute("unreadListSize", messageClient.getUnreadMessagesSize());
        return "index :: fragment";
    }

    @GetMapping("/messages")
    public String messages(Model model) {
        MessageGroup messageGroup = messageClient.readMessageGroup();
        model.addAttribute("readMessages", messageGroup.getReadMessages());
        model.addAttribute("unreadMessages", messageGroup.getUnreadMessages());
        return "messages";
    }

    @PostMapping("/messages/flush")
    @ResponseBody
    public void flushMessages() {
        messageClient.flushUnreadMessages();
    }
}
```

### 3.7. RedisMessageClient Class

* 각 메소드 별 기능은 다음과 같습니다.
* getUnreadMessagesSize 메소드
    * `UNREAD` 리스트의 사이즈를 반환합니다.
* pushMessage 메소드
    * `UNREAD` 리스트에 새로운 메세지를 추가합니다.
* readMessageGroup 메소드
    * `UNREAD` 리스트와 `READ` 리스트에 담긴 메세지들을 반환합니다.
* flushUnreadMessages 메소드
    * `UNREAD` 리스트에 담긴 메세지들을 `READ` 리스트로 옮깁니다.

```java
package action.in.blog.client;

import action.in.blog.domain.Message;
import action.in.blog.domain.MessageGroup;
import action.in.blog.domain.Queue;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CachePut;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Component
public class RedisMessageClient implements MessageClient {

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public long getUnreadMessagesSize() {
        return redisTemplate.opsForList().size(Queue.UNREAD.name());
    }

    @Override
    public void pushMessage(String message) {
        Message body = Message.builder()
                .id(UUID.randomUUID().toString())
                .message(message)
                .build();
        redisTemplate.opsForList().rightPush(Queue.UNREAD.name(), body);
    }

    @Override
    public MessageGroup readMessageGroup() {

        long unreadQueueSize = redisTemplate.opsForList().size(Queue.UNREAD.name());
        List<Message> unreadMessages = (List) redisTemplate.opsForList().range(Queue.UNREAD.name(), 0, unreadQueueSize);

        long readQueueSize = redisTemplate.opsForList().size(Queue.READ.name());
        List<Message> readMessages = (List) redisTemplate.opsForList().range(Queue.READ.name(), 0, readQueueSize);

        return MessageGroup.builder()
                .unreadMessages(unreadMessages)
                .readMessages(readMessages)
                .build();
    }

    @Override
    public void flushUnreadMessages() {
        long unreadQueueSize = redisTemplate.opsForList().size(Queue.UNREAD.name());
        List<Message> unreadMessages = (List) redisTemplate.opsForList().rightPop(Queue.UNREAD.name(), unreadQueueSize);
        if (unreadMessages.size() != 0) {
            redisTemplate.opsForList().rightPushAll(Queue.READ.name(), unreadMessages.toArray());
        }
    }
}
```

## 4. Test

도커 컴포즈로 테스트 환경을 구축합니다. 

### 4.1. docker-compose.yml

* 주요 설정들을 살펴보겠습니다.
* `redis-master` 컨테이너
    * 볼륨을 사용해 프로젝트 폴더 내부에 레디스 설정 경로를 컨테이너 내부 설정 디렉토리로 연결합니다.
    * 마스터 인스턴스 설정을 사용해 레디스를 실행합니다.
    * 환경 변수를 사용해 복제 모드는 마스터, 비밀번호는 필요 없음으로 설정합니다.
* `redis-slave-1` 컨테이너
    * 볼륨을 사용해 프로젝트 폴더 내부에 레디스 설정 경로를 컨테이너 내부 설정 디렉토리로 연결합니다.
    * 슬레이브 인스턴스 설정을 사용해 레디스를 실행합니다.
    * 환경 변수를 사용해 복제 모드는 마스터, 비밀번호는 필요 없음으로 설정합니다.
    * `redis-slave-2` 컨테이너도 동일한 방법으로 실행합니다.

```yml
version: "3.9"
services:
  redis-master:
    hostname: redis-master
    container_name: redis-master
    image: redis
    volumes:
      - ./conf:/usr/local/etc/redis/
    command: redis-server /usr/local/etc/redis/redis-master.conf
    environment:
      - REDIS_REPLICATION_MODE=master
      - ALLOW_EMPTY_PASSWORD=yes
  redis-slave-1:
    hostname: redis-slave-1
    container_name: redis-slave-1
    image: redis
    volumes:
      - ./conf:/usr/local/etc/redis/
    command: redis-server /usr/local/etc/redis/redis-slave-1.conf
    environment:
      - REDIS_REPLICATION_MODE=slave
      - REDIS_MASTER_HOST=redis-master
      - ALLOW_EMPTY_PASSWORD=yes
    depends_on:
      - redis-master
  redis-slave-2:
    hostname: redis-slave-2
    container_name: redis-slave-2
    image: redis
    volumes:
      - ./conf:/usr/local/etc/redis/
    command: redis-server /usr/local/etc/redis/redis-slave-2.conf
    environment:
      - REDIS_REPLICATION_MODE=slave
      - REDIS_MASTER_HOST=redis-master
      - ALLOW_EMPTY_PASSWORD=yes
    depends_on:
      - redis-master
      - redis-slave-1
  backend:
    build: .
    ports:
      - '8080:8080'
    depends_on:
      - redis-master
      - redis-slave-1
      - redis-slave-2
    restart: on-failure
```

### 4.2. redis config files

* 마스터 인스턴스 설정 파일은 다음과 같습니다.

```conf
port 6379
```

* 슬레이브 인스턴스 설정 파일은 다음과 같습니다.
* 복제할 마스터 인스턴스 정보를 추가합니다.
    * 4.X 버전까진 `slaveof`였으며 5.X 버전부터 `replicaof`로 변경되었습니다.

```conf
port 6379
replicaof redis-master 6379
```

### 4.3. Run Docker Compose

다음 명령어를 통해 컨테이너를 실행합니다. 
프로젝트에 미리 작성한 쉘(shell) 스크립트를 실행합니다.

```
$ sh shell/redis-replication.sh            
[+] Running 5/5
 ⠿ Container action-in-blog-backend-1  Removed                                                                                                0.0s
 ⠿ Container redis-slave-2             Removed                                                                                                0.0s
 ⠿ Container redis-slave-1             Removed                                                                                                0.0s
 ⠿ Container redis-master              Removed                                                                                                0.0s
 ⠿ Network action-in-blog_default      Removed                                                                                                0.1s
[+] Building 1.4s (15/15) FINISHED
 => [internal] load build definition from Dockerfile                                                                                          0.0s
 => => transferring dockerfile: 32B                                                                                                           0.0s
 => [internal] load .dockerignore                                                                                                             0.0s
 => => transferring context: 2B                                                                                                               0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                 1.0s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                         1.3s
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215       0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55   0.0s
 => [internal] load build context                                                                                                             0.0s
 => => transferring context: 1.68kB                                                                                                           0.0s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                         0.0s
 => CACHED [maven_build 2/6] WORKDIR /build                                                                                                   0.0s
 => CACHED [maven_build 3/6] COPY pom.xml .                                                                                                   0.0s
 => CACHED [maven_build 4/6] RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline                                                0.0s
 => CACHED [maven_build 5/6] COPY src ./src                                                                                                   0.0s
 => CACHED [maven_build 6/6] RUN --mount=type=cache,target=/root/.m2 mvn package -Dmaven.test.skip=true                                       0.0s
 => CACHED [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                0.0s
 => exporting to image                                                                                                                        0.0s
 => => exporting layers                                                                                                                       0.0s
 => => writing image sha256:678771cbe87a7acb2d7db828dbc4d618ef65339a202638da5603632eda89690a                                                  0.0s
 => => naming to docker.io/library/action-in-blog-backend                                                                                     0.0s
[+] Running 5/4
 ⠿ Network action-in-blog_default      Created                                                                                                0.0s
 ⠿ Container redis-master              Created                                                                                                0.1s
 ⠿ Container redis-slave-1             Created                                                                                                0.1s
 ⠿ Container redis-slave-2             Created                                                                                                0.0s
 ⠿ Container action-in-blog-backend-1  Created                                                                                                0.1s
```

##### When Stop Master Node

* 도커 데스크탑을 사용해 마스터 인스턴스를 실행 중지합니다.
* 마스터 인스턴스를 중지시킨 후 읽기 연산은 정상적으로 동작합니다.
    * 새로 고침에 따라 리스트 사이즈 조회는 가능합니다.
* 마스터 인스턴스를 중지시킨 후 쓰기 연산이 정상적으로 동작하지 않습니다.
    * 메세지 생성 불가능
    * 읽지 않은 메세지 리스트 비우기 불가능

<p align="center">
    <img src="/images/replication-in-redis-3.gif" width="100%" class="image__border">
</p>

##### When Stop Slave Node

* 도커 데스크탑을 사용해 모든 슬레이브 인스턴스들을 실행 중지합니다.
* 정상적으로 동작합니다.

<p align="center">
    <img src="/images/replication-in-redis-4.gif" width="100%" class="image__border">
</p>

## CLOSING

레디스의 레플리케이션만으로 완벽한 고가용성 시스템을 구축하지 못 합니다. 
마스터 인스턴스가 정지됨과 시스템 대부분의 기능이 정상 동작하지 않았습니다. 
보다 나은 고가용성 시스템을 구축하기 위해 센티널(sentinel) 컴포넌트를 함께 사용합니다. 
센티널은 마스터, 슬레이브 인스턴스들의 상태를 모니터링하면서 마스터 인스턴스가 죽었을 때 다른 슬레이브 인스턴스를 다시 마스터 인스턴스로 승격시킵니다. 
다음 포스트에서 센티널을 적용과 관련된 내용을 정리할 예정입니다.

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-02-21-replication-in-redis>

#### RECOMMEND NEXT POSTS

* [Failover Using Sentinel for Redis][failover-using-sentinel-for-redis-link]

#### REFERENCE

* <https://www.vinsguru.com/redis-master-slave-with-spring-boot/>

[embedded-redis-server-link]: https://junhyunny.github.io/spring-boot/redis/embedded-redis-server/
[using-redis-template-on-spring-boot-link]: https://junhyunny.github.io/spring-boot/redis/using-redis-template-on-spring-boot/
[patterns-for-cache-link]: https://junhyunny.github.io/design-pattern/patterns-for-cache/
[failover-using-sentinel-for-redis-link]: https://junhyunny.github.io/spring-boot/redis/failover-using-sentinel-for-redis/