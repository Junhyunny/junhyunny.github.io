---
title: "장애 극복을 위한 Redis 센티널(Sentinel)"
search: false
category:
  - spring-boot
  - redis
last_modified_at: 2026-05-30T01:01:23+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Redis 레플리케이션(Replication)][replication-in-redis-link]

## 0. 들어가면서

[Redis 레플리케이션(Replication) 글][replication-in-redis-link]에서 설명했듯이 레디스 레플리케이션은 완벽한 고가용성(HA, high availability)을 책임지지 않는다. 레디스에는 장애 극복(failover) 기능을 향상하기 위한 센티널(sentinel)이 존재한다. 이번 글에서는 센티널을 활용한 레디스의 장애 극복 기능을 살펴보겠다.

## 1. Redis Sentinel

> High availability for non-clustered Redis

센티널은 레디스 클러스터(cluster)를 구축하지 않고도 레디스의 고가용성을 제공한다. 센티널은 모니터링, 알림 같은 작업을 수행하며 다음과 같이 정리할 수 있다.

- 모니터링(Monitoring)
  - 마스터(master), 슬레이브(slave) 인스턴스들이 정상적으로 동작하는지 확인한다.
- 알림(Notification)
  - 시스템 관리자나 컴퓨터 프로그램에 모니터링 중인 인스턴스에 문제가 발생했음을 API 호출을 통해 알린다.
- 자동적인 장애 극복(Automatic failover)
  - 마스터 인스턴스가 정상적으로 동작하지 않으면 센티널은 장애 극복 프로세스를 수행한다.
  - 레플리케이션 인스턴스들 중 하나를 마스터로 승격시킨다.
  - 새로운 마스터 인스턴스가 결정되면 레디스를 사용하는 애플리케이션들에게 연결할 새로운 주소를 전달한다.
- 제공자 식별(Configuration provider)
  - 클라이언트 서비스들은 현재 마스터의 주소를 센티널에게 물어본다.
  - 장애 극복 기능이 완료되면 센티널은 클라이언트들에게 새로운 주소를 보고한다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/failover-using-sentinel-for-redis-01.png" width="80%" class="image__border">
</div>
<center>Redis Sentinel — High Availability</center>

## 2. Practice

간단한 시나리오를 바탕으로 애플리케이션 구현과 레디스 센티널을 사용한 고가용성 시스템을 구축해 보자. [Redis 레플리케이션(Replication)][replication-in-redis-link] 글의 시나리오와 동일하다.

1. 사용자가 애플리케이션 화면을 통해 간단한 메시지를 전송한다.
2. 전송한 메시지는 레디스 마스터 인스턴스의 리스트(list)에 저장된다. 리스트는 두 종류가 있다.
   - 읽지 않은 메시지를 저장하는 리스트
   - 읽은 메시지를 저장하는 리스트
3. 사용자는 메인 화면에서 읽지 않은 메시지가 몇 개인지 확인할 수 있다.
4. 리스트별 메시지 현황을 볼 수 있는 화면에서 각 리스트에 담긴 메시지를 확인할 수 있다.
   - 왼쪽은 읽지 않은 메시지 리스트이다.
   - 오른쪽은 읽은 메시지 리스트이다.
5. 해당 화면을 새로 고침하거나 메인 화면에서 다시 진입하면 읽은 메시지는 모두 오른쪽으로 이동한다.

시스템 구성도를 보면 다음과 같다. 클러스터에 포함된 레디스 인스턴스들과 3개의 센티널을 연결했다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/failover-using-sentinel-for-redis-02.png" width="100%" class="image__border">
</div>

<br/>

읽기 기능은 리스트의 상태를 바꾸지 않는 연산이다. 반대로 쓰기 기능은 리스트의 상태를 바꾸는 연산이다. 앞서 말했듯 마스터 인스턴스는 리스트의 상태를 바꿀 수 있지만, 슬레이브는 리스트의 상태를 읽는 것만 가능하다. 우선 위 시나리오에서 읽기 연산과 쓰기 연산을 분리해서 살펴보자.

- 메인 화면에서 읽지 않은 메시지 개수를 조회하는 기능은 `읽기` 연산이다.
- 메인 화면에서 새로운 메시지를 작성하는 기능은 `쓰기` 연산이다.
- 메시지 리스트 현황 화면에서 읽지 않은 메시지와 읽은 메시지를 표시하는 작업은 `읽기` 연산이다.
- 메시지 리스트 현황 화면에서 읽지 않은 메시지를 모두 꺼내어(pop) 읽은 메시지 리스트로 이동하는 `쓰기` 연산이 발생한다.

위 내용을 바탕으로 마스터 인스턴스를 중지시켰을 때 시스템은 어떻게 동작할까? 예상되는 동작을 정리해 보자.

- 메인 화면에서 새로 고침 기능은 정상적으로 동작한다. (읽기)
- 메인 화면에서 새로운 메시지를 작성한 후 전송 버튼을 누르면 쓰기 연산이므로 잠시 지연이 발생하지만, 잠시 후 모든 기능이 정상적으로 동작한다. (쓰기)
- 리스트 현황 페이지에서 리스트 현황을 보는 것은 정상적으로 동작한다. (읽기)
- 리스트 현황 페이지로 이동했을 때 읽지 않은 메시지를 읽은 메시지로 이동하는 동작은 쓰기 연산이므로 잠시 지연이 발생하지만, 잠시 후 모든 기능이 정상적으로 동작한다. (쓰기)

## 3. Implementation

[이전 글][replication-in-redis-link]의 구현 코드와 거의 유사하다. 사용자 화면은 타임리프(thymeleaf) 템플릿 엔진을 사용하였다. 패키지 구조는 다음과 같다.

```
./
├── Dockerfile
├── conf
│   ├── redis-master.conf
│   ├── redis-slave-1.conf
│   ├── redis-slave-2.conf
│   └── redis.conf
├── docker-compose.yml
├── mvnw
├── mvnw.cmd
├── pom.xml
├── shell
│   └── redis-sentinel.sh
└── src
    ├── main
    │   ├── java
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               ├── ActionInBlogApplication.java
    │   │               ├── client
    │   │               │   ├── MessageClient.java
    │   │               │   └── RedisMessageClient.java
    │   │               ├── config
    │   │               │   ├── RedisTemplateConfig.java
    │   │               │   └── SentinelConfiguration.java
    │   │               ├── controller
    │   │               │   └── RedisController.java
    │   │               └── domain
    │   │                   ├── Message.java
    │   │                   ├── MessageGroup.java
    │   │                   └── Queue.java
    │   └── resources
    │       ├── application.yml
    │       └── templates
    │           ├── index.html
    │           └── messages.html
    └── test
        └── java
            └── action
                └── in
                    └── blog
                        └── ActionInBlogApplicationTests.java
```

`pom.xml` 파일에 레디스, 타임리프 관련 의존성을 추가한다.

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

`application.yml` 설정 파일에 센티널 인스턴스 정보를 추가한다. 호스트 정보는 도커 컴포즈(docker compose) 파일에 정의된 호스트 이름을 사용한다.

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

SentinelConfiguration 클래스에 센티널 설정값을 주입받는 빈(bean) 객체를 만든다.

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

RedisTemplateConfig 클래스에 `application.yml` 파일에 정의한 센티널 설정값을 사용해 `RedisConnectionFactory` 빈을 생성하는 코드를 작성한다. 센티널들은 `mymaster`라는 이름의 마스터 세트(master set)를 관리한다. 마스터 세트는 마스터와 이에 연결된 레플리케이션 인스턴스들을 의미한다.

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

RedisController 클래스에 아래와 같은 엔드포인트를 생성한다. 각 경로의 기능은 다음과 같다.

- `/` 경로
  - 기본 페이지를 반환한다.
  - 현재 읽지 않은 메시지 리스트 크기를 모델에 담아 반환한다.
- `/message` 경로
  - 신규 메시지를 생성한다.
  - 현재 읽지 않은 메시지 리스트 크기를 모델에 담아 반환한다.
- `/unread-list/size`
  - 현재 읽지 않은 메시지 리스트 크기를 모델에 담아 반환한다.
- `/messages` 경로
  - 현재 두 리스트에 담긴 메시지들을 보여준다.
- `/messages/flush` 경로
  - 읽지 않은 리스트에 담긴 메시지들을 읽은 리스트로 옮긴다.

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

RedisMessageClient 클래스에 아래와 같은 메서드들을 구현한다.

- getUnreadMessagesSize 메서드
  - `UNREAD` 리스트의 크기를 반환한다.
- pushMessage 메서드
  - `UNREAD` 리스트에 새로운 메시지를 추가한다.
- readMessageGroup 메서드
  - `UNREAD` 리스트와 `READ` 리스트에 담긴 메시지들을 반환한다.
- flushUnreadMessages 메서드
  - `UNREAD` 리스트에 담긴 메시지들을 `READ` 리스트로 옮긴다.

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

도커 컴포즈로 테스트 환경을 구축했다. 도커 컴포즈 파일의 주요 설정을 살펴보자.

- `redis-master` 컨테이너
  - 볼륨을 사용해 프로젝트 폴더 내부에 레디스 설정 경로를 컨테이너 내부 설정 디렉토리로 연결한다.
  - 마스터 인스턴스 설정을 사용해 레디스를 실행한다.
  - 환경 변수를 사용해 복제 모드는 마스터, 비밀번호는 필요 없음으로 설정한다.
- `redis-slave-1`, `redis-slave-2` 컨테이너
  - 볼륨을 사용해 프로젝트 폴더 내부에 레디스 설정 경로를 컨테이너 내부 설정 디렉토리로 연결한다.
  - 슬레이브 인스턴스 설정을 사용해 레디스를 실행한다.
  - 환경 변수를 사용해 복제 모드는 슬레이브, 비밀번호는 필요 없음으로 설정한다.
- `redis-sentinel` 컨테이너
  - 마스터 인스턴스의 정보를 환경 설정값으로 주입한다.
  - 마스터 세트의 이름을 `mymaster`로 지정한다.
  - 센티널들이 새로운 마스터를 뽑기 위한 의사 결정을 하는 데 필요한 정족수(quorum)를 2로 지정한다.
  - 예를 들어 정족수가 2인 경우 3개 센티널 중 2개가 마스터 인스턴스 다운(down)을 인식하면 새로운 마스터를 뽑는다.

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

`redis-master.conf` 설정 파일에 포트 번호를 지정한다.

```conf
port 6379
```

슬레이브 인스턴스를 위한 설정 파일인 `redis-slave-1.conf`, `redis-slave-2.conf`에는 아래와 같이 복제할 마스터 인스턴스 정보를 추가한다.

- 복제할 마스터 인스턴스 정보를 추가한다. 4.X 버전까지는 `slaveof`였으며 5.X 버전부터 `replicaof`로 변경되었다.

```conf
port 6379
replicaof redis-master 6379
```

다음 명령어로 컨테이너를 실행한다. 프로젝트에 미리 작성한 셸(shell) 스크립트를 실행한다. 셸 스크립트를 살펴보면 `--scale` 옵션으로 센티널 인스턴스 3개를 실행한다.

```
$  sh shell/redis-sentinel.sh

...

[+] Running 8/8
 ⠿ Network action-in-blog_default             Created             0.0s
 ⠿ Container redis-master                     Created             0.1s
 ⠿ Container redis-slave-1                    Created             0.1s
 ⠿ Container redis-slave-2                    Created             0.1s
 ⠿ Container action-in-blog-backend-1         Created             0.1s
 ⠿ Container action-in-blog-redis-sentinel-3  Created             0.1s
 ⠿ Container action-in-blog-redis-sentinel-1  Created             0.1s
 ⠿ Container action-in-blog-redis-sentinel-2  Created             0.1s
```

컨테이너가 모두 실행되었다면 마스터 인스턴스가 멈췄을 때 어떻게 동작하는지 살펴보자. 도커 데스크톱(docker desktop)을 사용해 마스터 인스턴스를 실행 중지한다.

- 센티널이 새로운 마스터 승격을 준비하는 잠깐의 시간 동안 딜레이가 발생한다.
- 슬레이브 중 하나가 마스터로 승격되면 정상적으로 시스템이 동작한다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/failover-using-sentinel-for-redis-03.gif" width="100%" class="image__border">
</div>

<br/>

장애 극복 기능이 동작하면 레디스 설정 파일이 변경된다. `bind-mount` 방식의 도커 볼륨으로 마스터, 슬레이브의 설정 파일을 적용했기 때문에 센티널에 의해 설정이 변경되는 것을 확인할 수 있다. 마스터 인스턴스를 다운시키면 두 슬레이브 노드의 설정값이 다음과 같이 변경된다.

아래 코드는 1번 슬레이브 인스턴스의 설정인 `redis-slave-1.conf` 파일이다. 별도로 레플리케이션이 설정되지 않은 것으로 보아 해당 슬레이브가 마스터로 승격되었다.

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

아래 코드는 2번 슬레이브 인스턴스의 설정인 `redis-slave-2.conf` 파일이다. 1번 슬레이브 인스턴스의 레플리케이션으로 설정되었다.

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

레디스 인스턴스들을 올리고 내리면서 테스트해 본 결과 장애 극복을 완벽하게 해내지는 못했다. 관련된 내용을 찾아보니 마스터와 슬레이브가 종료되는 순서에 따라 장애 극복 기능이 정상적으로 동작하지 않는 경우가 있다고 한다. 자동으로 슬레이브 인스턴스가 마스터로 승격되지 않는 현상인데, 자세한 내용은 [이 링크](http://redisgate.jp/redis/sentinel/sentinel.php)를 참고하길 바란다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-02-23-failover-using-sentinel-for-redis>

#### REFERENCE

- <https://co-de.tistory.com/14>
- <https://co-de.tistory.com/15>
- <https://brunch.co.kr/@springboot/151>
- <https://redis.io/docs/management/sentinel/>
- <http://redisgate.jp/redis/sentinel/sentinel.php>
- [Redis Sentinel — High Availability][redis-sentinel-high-availability-link]

[replication-in-redis-link]: https://junhyunny.github.io/spring-boot/redis/replication-in-redis/
[redis-sentinel-high-availability-link]: https://medium.com/@amila922/redis-sentinel-high-availability-everything-you-need-to-know-from-dev-to-prod-complete-guide-deb198e70ea6
