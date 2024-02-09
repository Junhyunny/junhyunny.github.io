---
title: "Redis Pub/Sub"
search: false
category:
  - redis
last_modified_at: 2024-02-08T23:55:00
---

<br/>

## 0. 들어가면서

하나의 프로젝트를 일반 사용자, 관리자를 위한 애플리케이션으로 나눴다. 두 개의 애플리케이션으로 나뉘면서 데이터 소유권도 분할했다. 이 과정에서 다음과 같은 문제가 생겼다. 

- 일반 사용자 애플리케이션에서 사용자 행동을 이벤트 로그로 저장한다.
- 사용자 이벤트 데이터는 관리자만 볼 수 있기 때문에 관리자 애플리케이션에서 관리한다.

시작은 클라이언트 애플리케이션이고 종착지는 관리자 애플리케이션이다보니 둘 사이에 메시지 큐(message queue)를 두어 결합도 낮은 연결 고리를 만들고자 했다. 마침 세션으로 레디스(redis)를 사용하고 있었기 때문에 이를 메시지 큐로 사용했다. 이번 글은 구현에 대한 이야기가 아니라 구독/발행 패턴 적용할 수 있도록 메시지 큐 기능을 제공하는 레디스에 대한 내용을 정리했다.

## 1. Redis as a Message Broker

레디스 공식 홈페이지에선 메시지 브로커 기능을 할 수 있는 레디스의 세 가지 피처(feature)를 언급힌다.

- Redis Streams
  - 지속적인 데이터를 위한 로그와 같은 데이터 구조를 가지므로 이벤트 소싱을 위해 사용한다.
- Redis Pub/Sub
  - 초경량 메시지 프로토콜이다. 
  - 짧은 지연 시간과 엄청난 처리량이 중요할 때 짧은 수명의 메시지를 전파하는데 사용된다.
- Redis Lists and Redis Sorted Sets
  - 메시지 큐를 구현하기 위한 기본 자료 구조이다.

필자가 Redis Pub/Sub 기능을 선택한 이유는 다음과 같다.

- 관리자 애플리케이션에서 데이터 획득을 위해 복잡한 비즈니스 로직을 구현하고 싶지 않다.
- 이벤트가 발생한 시점에 즉시 해당 정보를 전달 받고 싶다.
- 일부 데이터를 유실해도 크게 문제가 없다.

### 1.1. Types of Messaging Semantics

메시지 브로커는 보통 메시지 전달 보증 수준이 있다. 

- At most once
  - 메시지를 최대 1회만 전송하고 상대방이 받았는지 확인하지 않는다. 
  - 재전송을 하지 않는다. 
  - 메시지는 중복되지 않지만, 상실될 가능성이 있다.
- At least once
  - 메시지를 최소 1회만 전송하고 상대방으로부터 메시지를 받았는지 확인 받는다.
  - 메시지를 재전송한다.
  - 메시지가 중복될 가능성은 있지만, 상실되지 않는다. 
- Exactly once
  - 메시지를 정확하게 한 번만 전송한다.
  - 누락과 중복 없이 메시지를 전달할 수 있다. 
  - 상대방으로부터 메시지를 받았는지 처리를 완료했는지 확인 받는다.

레디스 Pub/Sub은 at-most-once 메시징 시스템이다. 상대방이 메시지를 받았는지 확인하는 작업이 없기 떄문에 속도가 빠르다. 하지만 일부 메시지가 누락될 수 있다. 

### 1.2. Do not persistence message

레디스 Pub/Sub은 메시지 지속성이 없다. 간략하게 특징들을 정리해보자.

- 레디스는 메시지를 구독자에게 전달한 후 해당 메시지를 삭제한다.
- 구독자가 없는 경우 해당 메시지를 버린다.
- 위와 같은 특징 때문에 구독자는 구독하기 이전 메시지를 받을 수 없다. 

레디스 Pub/Sub 기능을 메시지 브로커로 사용하려면 다음과 같은 특징을 이해하고 있어야 한다.

## 2. Test with Command Line Interface

레디스 컨테이너와 `redis-cli`를 사용해 간단하게 컨셉을 확인해볼 수 있다. 

- 레디스 컨테이너가 메시지 브로커 역할을 수행한다.
- redis-cli 명령어를 실행한 터미널이 구독자, 발행자 역할을 수행한다.

<p align="center">
  <img src="/images/posts/2024/redis-pub-sub-01.png" width="80%" class="image__border">
</p>

### 2.1. Run Redis Container

다음 명령어를 사용해 레디스 컨테이너를 실행한다. 

```
$ docker run -d --name redis -p 6379:6379 redis
```

### 2.2. Run redis-cli

로컬 호스트에 설치해도 되지만, 이번 글에선 컨테이너에 설치된 redis-cli를 사용한다. 발행자, 구독자 역할을 수행할 터미널을 두 개 실행한다. 각 터미널에 다음 명령어를 실행하면 실습을 위한 준비가 완료된다.

```
$ docker exec -it redis redis-cli
```

<p align="center">
  <img src="/images/posts/2024/redis-pub-sub-02.png" width="80%" class="image__border">
</p>

### 2.3. Subscribe Channels and Publish Message

구독자 터미널에서 subscribe 명령어를 실행한다. 명령어를 사용하는 방법은 다음과 같다.

```
subscribe [channels...]
```

subscribe 명령어와 채널 이름을 나열하면 구독을 시작한다. 다음 두 개의 채널을 구독한다.

- channel01
- ch:00

```
127.0.0.1:6379> subscribe channel01 ch:00

1) "subscribe"
2) "channel01"
3) (integer) 1
1) "subscribe"
2) "ch:00"
3) (integer) 2
```

발행자 터미널에서 간단하게 메시지를 전송해보자. 명령어를 사용하는 방법은 다음과 같다.

```
publish [channel] [message]
```

각 채널에 메시지를 하나씩 전송해본다. 

- 발행자는 메시지 전송이 성공한 경우 1을 응답 받는다.
- 메시지 전송이 실패한 경우 0을 응답 받는다.
  - 잘못된 채널 이름을 작성해 메시지 전송이 실패한다.

<p align="center">
  <img src="/images/posts/2024/redis-pub-sub-03.gif" width="100%" class="image__border">
</p>

### 2.4. Pattern Subscribe and Publish Message

패턴을 사용하면 다수의 채널을 구독할 수 있다. 명령어를 사용하는 방법은 다음과 같다.

```
psubscribe [patterns ...]
```

다음과 같은 패턴을 적용한 채널을 구독해보자.

- 접두어가 `logs.`인 채널로부터 메시지를 수신받는다. 

```
127.0.0.1:6379> psubscribe logs.*
1) "psubscribe"
2) "logs.*"
3) (integer) 1
```

발행자 터미널에서 간단하게 메시지를 전송해보자. 채널 접두어가 `logs.`인 경우 모두 메시지가 전송된다.

<p align="center">
  <img src="/images/posts/2024/redis-pub-sub-04.gif" width="100%" class="image__border">
</p>

#### REFERENCE

- <https://redis.com/solutions/use-cases/messaging/>
- <https://redis.io/docs/interact/pubsub/>
- <https://redis.com/solutions/use-cases/message-broker-pattern-for-microservices-interservice-communication/>
- <https://brunch.co.kr/@springboot/374>
- <https://mentha2.tistory.com/259>
