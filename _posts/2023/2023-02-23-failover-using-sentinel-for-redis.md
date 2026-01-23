---
title: "Failover Using Sentinel for Redis"
search: false
category:
  - spring-boot
  - redis
last_modified_at: 2023-02-23T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Replication in Redis][replication-in-redis-link]

## 0. 들어가면서

[Replication in Redis][replication-in-redis-link] 포스트에서 설명했듯이 레디스 레플리케이션(replication)은 완벽한 고가용성(HA, high availability)을 책임지지 않습니다. 
레디스에는 장애 극복(failover) 기능을 향상시키기 위한 센티널(sentinel)이 존재합니다. 
이번 포스트에선 센티널을 활용한 레디스의 장애 극복 기능을 살펴보겠습니다. 

## 1. Redis Sentinel

> High availability for non-clustered Redis

센티널은 레디스 클러스터(cluster)를 구축하지 않고도 레디스의 고가용성을 제공합니다. 
센티널은 모니터링, 알림 같은 작업들을 수행하며 다음과 같이 정리할 수 있습니다.

* 모니터링(Monitoring)
    * 마스터(master), 슬레이브(slave) 인스턴스들이 정상적으로 동작하는지 확인합니다.
* 알림(Notification)
    * 시스템 관리자나 컴퓨터 프로그램에게 모니터링하는 인스턴스에 문제가 발생하였음을 API 호출을 통해 알립니다.
* 자동적인 장애 극복(Automatic failover)
    * 마스터 인스턴스가 정상적으로 동작하지 않는 경우 센티널은 장애 극복 프로세스를 수행합니다.
    * 레플리케이션 인스턴스들 중 하나를 마스터로 승격시킵니다.
    * 새로운 마스터 인스턴스가 결정되면 레디스를 사용하는 애플리케이션들에게 연결할 새로운 주소를 전달합니다.
* 제공자 식별(Configuration provider)
    * 클라이언트 서비스들은 현재 마스터의 주소를 센티널에게 물어봅니다. 
    * 장애 극복 기능이 완료되었으면 센티널은 클라이언트들에게 새로운 주소를 보고합니다.

<p align="center">
    <img src="/images/failover-using-sentinel-for-redis-1.JPG" width="80%" class="image__border">
</p>
<center>Redis Sentinel — High Availability</center>

## 2. Practice

### 2.1. Context of Practice

간단한 시나리오를 바탕으로 애플리케이션 구현과 레디스 센티널을 사용한 고가용성 시스템을 구축해보겠습니다. 
[Replication in Redis][replication-in-redis-link] 포스트의 예제에서 3개의 센티널들을 연결하였습니다.

* 애플리케이션 화면을 통해 간단한 메시지를 전송합니다.
* 전송한 메시지는 레디스 마스터 인스턴스의 리스트(list)에 저장됩니다.
* 리스트는 두 종류가 있습니다.
    * 읽지 않은 메시지들을 저장하는 리스트
    * 읽은 메시지들을 저장하는 리스트
* 메인 화면에서 API 호출을 통해 읽지 않은 메시지가 몇 개인지 확인할 수 있습니다.
* 리스트 별 메시지 현황을 볼 수 있는 화면에서 각 리스트에 담긴 메시지를 확인할 수 있습니다.
    * 왼쪽은 읽지 않은 메시지 리스트입니다.
    * 오른쪽은 읽은 메시지 리스트입니다.
    * 해당 화면을 새로고침하거나 메인 화면에서 다시 진입하면 읽은 메시지들은 모두 오른쪽으로 이동합니다.

<p align="center">
    <img src="/images/failover-using-sentinel-for-redis-2.JPG" width="100%" class="image__border">
</p>

### 2.2. Focus this point

테스트를 통해 다음 내용을 유의 깊게 살펴봅니다. 
읽기 기능은 리스트의 상태를 바꾸지 않는 연산입니다. 
반대로 쓰기 기능은 리스트의 상태를 바꾸는 연산입니다. 

* 메인 화면에서 읽지 않은 메시지 개수를 조회하는 기능은 읽기입니다.
* 새로운 메시지를 작성하는 기능은 쓰기 연산입니다.
* 메시지 리스트 현황 화면으로 이동할 때 쓰기 연산이 발생합니다.
    * 읽지 않은 메시지 리스트에서 메시지들을 모두 꺼내어(pop) 읽은 메시지 리스트로 이동합니다.
* 마스터 인스턴스를 중지시켰을 때 다음 내용들을 예상합니다.
    * 잠깐의 지연이 발생할 수 있지만, 모든 기능이 정상적으로 동작합니다. 
    * 슬레이브 인스턴스의 설정 파일이 변경되는 것을 확인할 수 있습니다. 
* 슬레이브 인스턴스를 중지시켰을 때 모든 기능이 정상적으로 동작하는 것을 예상합니다.

## 3. Implementation

[Replication in Redis][replication-in-redis-link] 포스트의 구현과 거의 유사하지만, 중복되는 내용이더라도 이 포스트를 먼저 접한 분들이 쉽게 따라할 수 있도록 중요한 내용은 모두 작성하였습니다. 
사용자 화면은 타임리프(thymeleaf) 템플릿 엔진을 사용하였습니다. 

### 3.1. Packages

```
./
├── Dockerfile
├── conf
│   ├── redis-master.conf
│   ├── redis-slave-1.conf
│   ├── redis-slave-2.conf
│   └── redis.conf
├── docker-compose.yml
├── mvnw
├── mvnw.cmd
├── pom.xml
├── shell
│   └── redis-sentinel.sh
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
    │   │               │   ├── RedisTemplateConfig.java
    │   │               │   └── SentinelConfiguration.java
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

* 센티널 인스턴스 정보를 추가합니다.
    * 호스트 정보는 도커 컴포즈(docker compose)에 의해 자동으로 생성되는 호스트 이름을 사용합니다.
    * 도커 컴포즈는 호스트 이름을 별도로 지정하지 않으면 `{directoryName}-{specification}-{numbering}`으로 짓습니다.

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
  sentinels:
    - host: action-in-blog-redis-sentinel-1
      port: 26379
    - host: action-in-blog-redis-sentinel-2
      port: 26379
    - host: action-in-blog-redis-sentinel-3
      port: 26379
```

### 3.4. SentinelConfiguration Class

* 센티널 설정 값을 주입받는 빈(bean) 객체입니다.

```java
package action.in.blog.config;

import io.lettuce.core.models.role.RedisInstance;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Getter
@Setter
class SentinelInstance {

    private String host;
    private int port;
}

@Setter
@Getter
@Configuration
@ConfigurationProperties(prefix = "redis")
public class SentinelConfiguration {

    private List<SentinelInstance> sentinels;
}
```

### 3.5. RedisTemplateConfig Class

* `application.yml` 파일에 정의한 센티널 설정 값을 사용해 `RedisConnectionFactory` 빈을 생성합니다.
* 센티널들은 `mymaster`라는 이름의 마스터 세트(master set)를 관리합니다.
    * 마스터 세트는 마스터와 이에 연결된 레플리케이션 인스턴스들을 의미합니다.

```java
package action.in.blog.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisSentinelConfiguration;
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
    private final SentinelConfiguration sentinelConfiguration;

    @Bean
    public RedisSerializer<Object> springSessionDefaultRedisSerializer() {
        return new GenericJackson2JsonRedisSerializer();
    }

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisSentinelConfiguration redisSentinelConfiguration = new RedisSentinelConfiguration().master("mymaster");
        sentinelConfiguration.getSentinels().forEach(sentinel -> {
            redisSentinelConfiguration.sentinel(sentinel.getHost(), sentinel.getPort());
        });
        return new LettuceConnectionFactory(redisSentinelConfiguration);
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
    * 현재 읽지 않은 메시지 리스트 사이즈를 모델에 담아 반환합니다.
* `/message` 경로
    * 신규 메시지를 생성합니다.
    * 현재 읽지 않은 메시지 리스트 사이즈를 모델에 담아 반환합니다.
* `/unread-list/size`
    * 현재 읽지 않은 메시지 리스트 사이즈를 모델에 담아 반환합니다.
* `/messages` 경로
    * 현재 두 리스트의 담긴 메시지들을 보여줍니다. 
* `/messages/flush` 경로
    * 읽지 않은 리스트에 담긴 메시지들을 읽은 리스트로 옮깁니다.

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

* 각 메서드 별 기능은 다음과 같습니다.
* getUnreadMessagesSize 메서드
    * `UNREAD` 리스트의 사이즈를 반환합니다.
* pushMessage 메서드
    * `UNREAD` 리스트에 새로운 메시지를 추가합니다.
* readMessageGroup 메서드
    * `UNREAD` 리스트와 `READ` 리스트에 담긴 메시지들을 반환합니다.
* flushUnreadMessages 메서드
    * `UNREAD` 리스트에 담긴 메시지들을 `READ` 리스트로 옮깁니다.

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
* `redis-sentinel` 컨테이너
    * 마스터 인스턴스의 정보를 환경 설정 값으로 주입합니다.
    * 마스터 세트의 이름을 `mymaster`로 지정합니다.
    * 센티널들이 새로운 마스터를 뽑기 위한 의사 결정을 하는데 필요한 정족수(quorum)를 2로 지정합니다.
    * 예를 들어 정족수가 2인 경우 3개 센티널 중 2개가 마스터 인스턴스 다운(down)을 인식하면 새로운 마스터를 뽑습니다. 

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
  redis-sentinel:
    image: 'bitnami/redis-sentinel:latest'
    environment:
      - REDIS_SENTINEL_DOWN_AFTER_MILLISECONDS=3000
      - REDIS_MASTER_HOST=redis-master
      - REDIS_MASTER_PORT_NUMBER=6379
      - REDIS_MASTER_SET=mymaster
      - REDIS_SENTINEL_QUORUM=2
    depends_on:
      - redis-master
      - redis-slave-1
      - redis-slave-2
  backend:
    build: .
    ports:
      - '8080:8080'
    environment:
      - RUN_ENV=sentinel
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
쉘 스크립트를 살펴보면 `--scale` 옵션으로 센티널 인스턴스 3개를 실행시킵니다.

```
$  sh shell/redis-sentinel.sh
[+] Running 8/7
 ⠿ Container action-in-blog-backend-1         Removed                                                                                          0.0s
 ⠿ Container action-in-blog-redis-sentinel-2  Removed                                                                                          0.0s
 ⠿ Container action-in-blog-redis-sentinel-3  Removed                                                                                          0.0s
 ⠿ Container action-in-blog-redis-sentinel-1  Removed                                                                                          0.0s
 ⠿ Container redis-slave-2                    Removed                                                                                          0.0s
 ⠿ Container redis-slave-1                    Removed                                                                                          0.0s
 ⠿ Container redis-master                     Removed                                                                                          0.0s
 ⠿ Network action-in-blog_default             Removed                                                                                          0.1s
[+] Building 3.4s (15/15) FINISHED         
 => [internal] load build definition from Dockerfile                                                                                           0.0s
 => => transferring dockerfile: 32B                                                                                                            0.0s
 => [internal] load .dockerignore                                                                                                              0.0s
 => => transferring context: 2B                                                                                                                0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                  3.2s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                          3.0s
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215        0.0s
 => [internal] load build context                                                                                                              0.0s
 => => transferring context: 1.68kB                                                                                                            0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55    0.0s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                          0.0s
 => CACHED [maven_build 2/6] WORKDIR /build                                                                                                    0.0s
 => CACHED [maven_build 3/6] COPY pom.xml .                                                                                                    0.0s
 => CACHED [maven_build 4/6] RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline                                                 0.0s
 => CACHED [maven_build 5/6] COPY src ./src                                                                                                    0.0s
 => CACHED [maven_build 6/6] RUN --mount=type=cache,target=/root/.m2 mvn package -Dmaven.test.skip=true                                        0.0s
 => CACHED [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                 0.0s
 => exporting to image                                                                                                                         0.0s
 => => exporting layers                                                                                                                        0.0s
 => => writing image sha256:3e761b546e8ad71bd9ae910299ac4cfa9f836f0e0f3adc1542e7c575518b1cbb                                                   0.0s
 => => naming to docker.io/library/action-in-blog-backend                                                                                      0.0s
[+] Running 8/8
 ⠿ Network action-in-blog_default             Created                                                                                          0.0s
 ⠿ Container redis-master                     Created                                                                                          0.1s
 ⠿ Container redis-slave-1                    Created                                                                                          0.1s
 ⠿ Container redis-slave-2                    Created                                                                                          0.1s
 ⠿ Container action-in-blog-backend-1         Created                                                                                          0.1s
 ⠿ Container action-in-blog-redis-sentinel-3  Created                                                                                          0.1s
 ⠿ Container action-in-blog-redis-sentinel-1  Created                                                                                          0.1s
 ⠿ Container action-in-blog-redis-sentinel-2  Created                                                                                          0.1s
```

##### When Stop Master Node

* 도커 데스크탑(docker desktop)을 사용해 마스터 인스턴스를 실행 중지합니다.
* 센티널이 새로운 마스터 승격을 준비하는 잠깐의 시간동안 딜레이가 발생합니다.
* 슬레이브 중 하나가 마스터로 승격되면 정상적으로 시스템이 동작합니다.

<p align="center">
    <img src="/images/failover-using-sentinel-for-redis-3.gif" width="100%" class="image__border">
</p>

##### Automatically changed config file when failover

장애 극복 기능이 동작하면 레디스 설정 파일이 변경됩니다. 
`bind-mount` 방식의 도커 볼륨으로 마스터, 슬레이브의 설정 파일을 적용했기 때문에 센티널에 의해 설정이 변경되는 것을 확인할 수 있습니다. 
마스터 인스턴스를 다운시키면 두 슬레이브 노드의 설정 값이 다음과 같이 변경됩니다.

* 1번 슬레이브 인스턴스의 설정인 `redis-slave-1.conf` 파일입니다.
* 별도로 레플리케이션이 설정되지 않은 것으로 보아 해당 슬레이브가 마스터로 승격되었습니다.

```
port 6379

# Generated by CONFIG REWRITE
dir "/data"
latency-tracking-info-percentiles 50 99 99.9
save 3600 1
save 300 100
save 60 10000
user default on nopass ~* &* +@all
```

* 2번 슬레이브 인스턴스의 설정인 `redis-slave-2.conf` 파일입니다.
* 1번 슬레이브 인스턴스의 레플리케이션으로 설정되었습니다.

```
port 6379
replicaof 172.23.0.3 6379

# Generated by CONFIG REWRITE
dir "/data"
save 3600 1
save 300 100
save 60 10000
latency-tracking-info-percentiles 50 99 99.9
user default on nopass ~* &* +@all
```

## CLOSING

레디스 인스턴스들을 올리고, 내리면서 테스트해 본 결과 장애 극복을 완벽하게 해내진 못 했습니다. 
관련된 내용을 찾아보니 마스터와 슬레이브가 죽는 순서에 따라 정상적으로 장애 극복 기능이 동작하지 않는 케이스가 있다고 합니다. 
자동으로 슬레이브 인스턴스가 마스터로 승격되지 않는 현상인데, 자세한 내용은 아래 링크를 참조하시길 바랍니다. 

* <http://redisgate.jp/redis/sentinel/sentinel.php>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-02-23-failover-using-sentinel-for-redis>

#### REFERENCE

* <https://co-de.tistory.com/14>
* <https://co-de.tistory.com/15>
* <https://brunch.co.kr/@springboot/151>
* <https://redis.io/docs/management/sentinel/>
* <http://redisgate.jp/redis/sentinel/sentinel.php>
* [Redis Sentinel — High Availability][redis-sentinel-high-availability-link]

[replication-in-redis-link]: https://junhyunny.github.io/spring-boot/redis/replication-in-redis/
[redis-sentinel-high-availability-link]: https://medium.com/@amila922/redis-sentinel-high-availability-everything-you-need-to-know-from-dev-to-prod-complete-guide-deb198e70ea6