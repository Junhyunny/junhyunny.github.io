---
title: Redis Publisher and Subscriber with Spring Boot"
search: false
category:
  - java
  - spring-boot
  - redis
last_modified_at: 2024-02-10T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Redis Pub/Sub][redis-pub-sub-link]

## 0. 들어가면서

[레디스 Pub/Sub][redis-pub-sub-link] 글에서 구독/발행 패턴을 구현할 수 있는 레디스의 메시지 브로커 기능에 대해 정리했다. 이번 글은 스프링 부트 프레임워크에서 구독자, 발행자를 구현하는 방법에 대해 정리한다. 이번 실습은 구독자, 발행자에 상관 없이 다음과 같은 의존성이 필요하다.

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.2'
    id 'io.spring.dependency-management' version '1.1.4'
}

group = 'blog.in.action'
version = '0.0.1-SNAPSHOT'

java {
    sourceCompatibility = '17'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

실습 시나리오는 다음과 같다. 

1. 터미널에서 발행자 서비스로 API 요청을 수행한다.
2. 발행자 서비스는 레디스로 이벤트 로그를 전달한다.
3. 구독자 서비스는 레디스로부터 이벤트 로그를 전달받는다.

<p align="center">
  <img src="/images/posts/2024/redis-publisher-and-subscriber-spring-boot-01.png" width="80%" class="image__border">
</p>

## 1. Implement Publisher Service

발행자 서비스를 구현한다. 

### 1.1. application.yml 

레디스 접속 정보를 정의한다.

- 도커 컴포즈(docker compose) 환경이므로 컨테이너 이름을 사용한다.

```yml
spring:
  data:
    redis:
      host: redis-container
      password:
      port: 6379
```

### 1.2. AppConfig Class

RedisTemplate 객체를 스프링 빈(bean)으로 등록한다. RedisTemplate 객체를 사용하면 발행 기능을 쉽게 구현할 수 있다. 

```java
package blog.in.action.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class AppConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }
}
```

### 1.3. EventLogPublisher Class

RedisTemplate 클래스의 convertAndSend 메소드를 사용한다. 채널 이름과 이벤트 객체를 전달한다.

```java
package blog.in.action.publisher;

import blog.in.action.domain.Channel;
import blog.in.action.domain.EventLog;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class EventLogPublisher {

    private final RedisTemplate<String, Object> redisTemplate;

    public EventLogPublisher(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void publish(Channel channel, EventLog event) {
        try {
            redisTemplate.convertAndSend(channel.name(), event);
        } catch (Exception e) {
            System.err.println(e.getMessage());
        }
    }
}
```

### 1.4. Channel enum

다음과 같이 4개 채널을 사용한다.

```java
package blog.in.action.domain;

public enum Channel {
    TODO_READ,
    TODO_INSERT,
    TODO_UPDATE,
    TODO_DELETE
}
```

### 1.5. TodoController Class

TODO CRUD 기능을 제공하는 간단한 컨트롤러 클래스다. 

- 각 API 엔드-포인트(end-point)마다 다른 채널에 이벤트를 발행한다.
- 이벤트 객체에는 요청 IP 주소를 담아서 전달한다.

```java
package blog.in.action.controller;

import blog.in.action.domain.Channel;
import blog.in.action.domain.EventLog;
import blog.in.action.publisher.EventLogPublisher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/todos")
public class TodoController {

    private static final AtomicLong key = new AtomicLong(0);
    private static final Map<Long, String> data = new ConcurrentHashMap<>();

    static {
        data.put(key.incrementAndGet(), "Hello");
        data.put(key.incrementAndGet(), "Redis");
        data.put(key.incrementAndGet(), "World");
    }

    private final EventLogPublisher eventLogPublisher;

    public TodoController(EventLogPublisher eventLogPublisher) {
        this.eventLogPublisher = eventLogPublisher;
    }

    @GetMapping
    public List<Map.Entry<Long, String>> todos(HttpServletRequest request) {
        eventLogPublisher.publish(Channel.TODO_READ, new EventLog(request.getRemoteAddr()));
        return data.entrySet()
                .stream()
                .sorted(Map.Entry.comparingByKey())
                .toList();
    }

    @PostMapping
    public void todos(HttpServletRequest request, @RequestBody String requestBody) {
        eventLogPublisher.publish(Channel.TODO_INSERT, new EventLog(request.getRemoteAddr()));
        data.put(key.incrementAndGet(), requestBody);
    }

    @PutMapping("/{id}")
    public void todos(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody String requestBody
    ) {
        eventLogPublisher.publish(Channel.TODO_UPDATE, new EventLog(request.getRemoteAddr()));
        data.put(id, requestBody);
    }

    @DeleteMapping("/{id}")
    public void todos(HttpServletRequest request, @PathVariable Long id) {
        eventLogPublisher.publish(Channel.TODO_DELETE, new EventLog(request.getRemoteAddr()));
        data.remove(id);
    }
}
```

## 2. Implement Subscriber Service

이번엔 구독자 서비스 기능을 구현해보자.

### 2.1. application.yml

레디스 접속 정보를 정의한다. 발행자 서비스에 정의한 application.yml 정보와 동일하다.

```yml
spring:
  data:
    redis:
      host: redis-container
      password:
      port: 6379
```

### 2.2. EventSubscriber Interface and Implementation Classes

EventSubscriber 인터페이스와 각 이벤트를 처리할 수 있는 구현 클래스들을 살펴보자. 스프링 프레임워크에서 레디스로부터 메시지를 수신하려면 다음 인터페이스를 구현해야 된다. 

```java
package org.springframework.data.redis.connection;

import org.springframework.lang.Nullable;

@FunctionalInterface
public interface MessageListener {
    void onMessage(Message message, @Nullable byte[] pattern);
}
```

단순히 구현 클래스를 만드는 것은 단순하지만, 구독하는 비즈니스 케이스의 확장을 고려해 다음과 같은 구조로 설계하였다. 

- MessageListener 인터페이스를 확장한 EventSubscriber 인터페이스를 정의힌다.
- EventSubscriber 인터페이스에는 channelName 메소드가 존재하며 구독자 객체가 구독할 채널 이름을 제공한다.
- 각 채널 별로 비즈니스 로직을 처리하기 위한 구독자 구현 클래스들이 존재한다.

<p align="center">
  <img src="/images/posts/2024/redis-publisher-and-subscriber-spring-boot-02.png" width="80%" class="image__border">
</p>

### 2.2.1. EventSubscriber Interface

- channelName 메소드는 해당 인스턴스가 관심을 갖는 채널 이름을 반환한다.

```java
package blog.in.action.subscriber;

import org.springframework.data.redis.connection.MessageListener;

public interface EventSubscriber extends MessageListener {

    String channelName();
}
```

### 2.2.2. ReadEventSubscriber Class

총 4개 구현 클래스가 존재하지만, 코드가 크게 다르지 않기 때문에 하나만 대표로 살펴본다.

- channelName 메소드는 자신이 담당하는 채널 이름을 반환한다.
- onMessage 메소드에서 구독 중인 채널을 통해 전달 받은 메시지를 처리한다.

```java
package blog.in.action.subscriber.impl;

import blog.in.action.domain.Channel;
import blog.in.action.subscriber.EventSubscriber;
import org.springframework.data.redis.connection.Message;
import org.springframework.stereotype.Component;

@Component
public class ReadEventSubscriber implements EventSubscriber {

    @Override
    public String channelName() {
        return Channel.TODO_READ.name();
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        System.out.printf("ReadEventSubscriber channel - %s%n", new String(message.getChannel()));
        System.out.printf("body - %s%n", new String(message.getBody()));
    }
}
```

### 2.3. RedisConfig Class

구독자 인스턴스들을 리스트로 전달 받아 RedisMessageListenerContainer 인스턴스에 메시지 리스너로 등록한다. 

- EventSubscriber 인터페이스 구현체 인스턴스가 여러 개인 경우 해당 인스턴스들이 리스트로 주입된다. 
- 구독자 인스턴스들은 각자 자신의 담당 채널 이름과 함께 자기 자신을 리스너로 등록한다.

```java
package blog.in.action.config;

import blog.in.action.subscriber.EventSubscriber;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

import java.util.List;

@Configuration
public class RedisConfig {

    public final List<EventSubscriber> redisMessageSubscribers;

    public RedisConfig(List<EventSubscriber> redisMessageSubscribers) {
        this.redisMessageSubscribers = redisMessageSubscribers;
    }

    @Bean
    public RedisMessageListenerContainer redisListenerContainer(
            RedisConnectionFactory connectionFactory
    ) {
        var container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        for (var eventSubscriber : redisMessageSubscribers) {
            container.addMessageListener(
                    new MessageListenerAdapter(eventSubscriber),
                    new ChannelTopic(eventSubscriber.channelName())
            );
        }
        return container;
    }
}
```

## 3. Run Application

도커 컴포즈로 두 개의 서비스와 레디스를 실행한다. 다음과 같은 프로젝트 구조를 갖는다.

```
./
├── docker-compose.yml
├── publisher
│   ├── Dockerfile
│   ├── HELP.md
│   ├── build.gradle
│   ├── settings.gradle
│   └── src
│       └── main
│           ├── java
│           │   └── blog
│           │       └── in
│           │           └── action
│           │               ├── PublisherApplication.java
│           │               ├── config
│           │               │   └── AppConfig.java
│           │               ├── controller
│           │               │   └── TodoController.java
│           │               ├── domain
│           │               │   ├── Channel.java
│           │               │   └── EventLog.java
│           │               └── publisher
│           │                   └── EventLogPublisher.java
│           └── resources
│               └── application.yml
└── subscriber
    ├── Dockerfile
    ├── HELP.md
    ├── build.gradle
    ├── settings.gradle
    └── src
        └── main
            ├── java
            │   └── blog
            │       └── in
            │           └── action
            │               ├── SubscriberApplication.java
            │               ├── config
            │               │   └── RedisConfig.java
            │               ├── domain
            │               │   └── Channel.java
            │               └── subscriber
            │                   ├── EventSubscriber.java
            │                   └── impl
            │                       ├── DeleteEventSubscriber.java
            │                       ├── InsertEventSubscriber.java
            │                       ├── ReadEventSubscriber.java
            │                       └── UpdateEventSubscriber.java
            └── resources
                └── application.yml
```

### 3.1. docker-compose.yml

다음과 같은 설정 파일을 사용한다.

- publisher-container
  - 발행자 서비스 컨테이너
- subscriber-container
  - 구독자 서비스 컨테이너
- redis-container
  - 레디스 컨테이너

```yml
version: '3.8'
services:
  publisher:
    build: ./publisher
    container_name: publisher-container
    ports:
      - '8080:8080'
  subsriber:
    build: ./subscriber
    container_name: subscriber-container
    ports:
      - '8081:8080'
  redis:
    image: redis:latest
    container_name: redis-container
    ports:
      - "6379:6379"
```

### 3.2. Run Container

도커 컴포즈 명령어로 설정 파일에 정의된 컨테이너들을 실행한다.

```
$ docker-compose up -d

[+] Running 3/4
 ⠇ Network action-in-blog_default  Created                               0.9s
 ✔ Container subscriber-container  Started                               0.8s
 ✔ Container redis-container       Started                               0.8s
 ✔ Container publisher-container   Started                               0.8s
```

### 3.3. Test Using cURL

두 개 터미널을 실행한다. 

- 하나의 터미널에선 발행자 서비스로 API 요청을 수행한다.
- 또 다른 터미널에선 구독자 서비스 컨테이너의 로그를 확인한다.

<p align="center">
  <img src="/images/posts/2024/redis-publisher-and-subscriber-spring-boot-03.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-02-10-redis-publisher-and-subscriber-spring-boot>

#### RECOMMEND NEXT POSTS

- <https://docs.spring.io/spring-data/redis/reference/redis/pubsub.html>

#### REFERENCE

[redis-pub-sub-link]: https://junhyunny.github.io/redis/redis-pub-sub/