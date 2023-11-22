---
title: "Concurrency Problem - Update wrong data"
search: false
category:
  - java
  - spring-boot
  - jpa
last_modified_at: 2023-11-21T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Transaction Isolation][transcation-isolation-link]
- [Pessimistic Lock in JPA][jpa-pessimitic-lock-link]
- [Thread Pool in Java][thread-pool-in-java-link]

## 0. 들어가면서

최근 프로젝트에서 겪었던 동시성 문제들 중 한 사례를 [Concurrency Problem - Insert same rows][concurrency-problem-insert-same-rows-link] 글로 정리했습니다. 이번 글은 같은 프로젝트에서 발생했던 또 다른 문제를 해결하는 방법에 대해 일부 각색하여 정리했습니다.

## 1. Problem Context

사용자들이 QR 스캔으로 수집한 카드에 "좋아요(like)"를 누르거나 취소하는 기능을 개발했습니다. 동시에 많은 사람들이 하나의 카드에 대해 "좋아요", "좋아요 취소"를 누르면서 두 가지 동시성 문제가 있었습니다. 문제가 발생한 원인을 잘 이해할 수 있도록 도메인 엔티티(domain entity)와 서비스 코드를 먼저 살펴보겠습니다. 

##### CardLikeEntity Class

- 카드 아이디가 기본 키(primary key)입니다.
- 사용자들이 누르는 "좋아요", "좋아요 취소" 버튼에 따라 카운트 값이 증감합니다.
    - 이번 글에선 "좋아요" 버튼 기능만 다룹니다.

```java
package action.in.blog.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class CardLikeEntity {

    @Id
    private String cardId;
    private int count;

    public CardLikeEntity() {
    }

    public CardLikeEntity(String cardId) {
        this.cardId = cardId;
        this.count = 1;
    }

    public void increase() {
        count++;
    }
}
```

##### DefaultCardLikeService Class

- 카드 아이디에 해당하는 데이터가 있는지 확인합니다.
- 데이터가 존재하지 않는 경우 새로운 데이터를 추가합니다. 
- 데이터가 존재하는 경우 카운트 수를 증가시킵니다.

```java
package action.in.blog.service;

import action.in.blog.domain.CardLikeEntity;
import action.in.blog.repository.CardLikeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DefaultCardLikeService implements CardLikeService {

    private final CardLikeRepository cardLikeRepository;

    public DefaultCardLikeService(CardLikeRepository cardLikeRepository) {
        this.cardLikeRepository = cardLikeRepository;
    }

    @Transactional
    @Override
    public void increaseLikeCount(String cardId) {
        var cardLikeOptional = cardLikeRepository.findById(cardId);
        if (cardLikeOptional.isEmpty()) {
            cardLikeRepository.save(new CardLikeEntity(cardId));
            return;
        }
        var cardLike = cardLikeOptional.get();
        cardLike.increase();
    }
}
```

### 1.1. Insert Problem

처음 데이터가 추가되는 시점에 동시에 시작된 트랜잭션이 있다면 하나만 성공합니다. 데이터가 존재하는지 확인하는 코드가 있더라도 거의 동시에 시작한 트랜잭션들은 데이터가 존재하지 않는 것으로 판단하기 때문에 삽입(insert) 쿼리를 수행합니다. 카드 아이디가 기본 키이기 때문에 동일한 키로 데이터를 추가한 다른 트랜잭션들은 모두 실패합니다.

1. 1번 트랜잭션 데이터를 조회하지만, 존재하지 않으므로 추가 쿼리를 수행합니다. 하지만 아직 커밋(commit)을 수행하진 못 헀습니다.
1. 거의 동시에 시작한 2번 트랜잭션이 데이터를 조회하지만, 존재하지 않으므로 추가 쿼리를 수행합니다. 
1. 1번 트랜잭션이 먼저 커밋하면 2번 트랜잭션은 기본 키 제약 조건에 의해 예외가 발생하고 트랜잭션을 실패합니다.

<p align="center">
    <img src="/images/concurrency-problem-missing-count-01.png" width="80%" class="image__border">
</p>

##### cURL Result

- 초기 데이터가 없는 상태에서 cURL 명령어로 동시에 3회 "좋아요" 요청을 수행합니다.
- 커밋이 성공한 첫 트랜잭션을 제외한 두 요청은 예외가 발생하고 500 상태 코드를 반환합니다.

```
$ curl -X POST -v http://localhost:8080/api/cards/card-01/likes &\
  curl -X POST -v http://localhost:8080/api/cards/card-01/likes &\
  curl -X POST -v http://localhost:8080/api/cards/card-01/likes

[1] 53122
[2] 53123
*   Trying 127.0.0.1:8080...
*   Trying 127.0.0.1:8080...
*   Trying 127.0.0.1:8080...
* Connected to localhost (127.0.0.1) port 8080 (#0)
* Connected to localhost (127.0.0.1) port 8080 (#0)
* Connected to localhost (127.0.0.1) port 8080 (#0)
> > POST /api/cards/card-01/likes HTTP/1.1
POST /api/cards/card-01/likes HTTP/1.1
> > Host: localhost:8080
Host: localhost:8080
> > User-Agent: curl/8.1.2
User-Agent: curl/8.1.2
> > Accept: */*
Accept: */*
> > 

> POST /api/cards/card-01/likes HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/8.1.2
> Accept: */*
> 
< HTTP/1.1 200 
< Content-Length: 0
< Date: Tue, 21 Nov 2023 17:49:06 GMT
< 
* Connection #0 to host localhost left intact
< < HTTP/1.1 500                                                                                                                                                                                    
HTTP/1.1 500 
< < Content-Type: application/json
Content-Type: application/json
< < Transfer-Encoding: chunked
Transfer-Encoding: chunked
< < Date: Tue, 21 Nov 2023 17:49:06 GMT
Date: Tue, 21 Nov 2023 17:49:06 GMT
< < Connection: close
Connection: close
< < 

* Closing connection 0
{"timestamp":"2023-11-21T17:49:06.534+00:00","status":500,"error":"Internal Server Error","path":"/api/cards/card-01/likes"}* Closing connection 0
{"timestamp":"2023-11-21T17:49:06.534+00:00","status":500,"error":"Internal Server Error","path":"/api/cards/card-01/likes"}[1]  - 53122 done       curl -X POST -v http://localhost:8080/api/cards/card-01/likes
[2]  + 53123 done       curl -X POST -v http://localhost:8080/api/cards/card-01/likes
```

##### Database Result

데이터를 조회합니다.

- 좋아요 카운트 값이 1인 상태입니다.
- 첫 트랜잭션만 성공하고 나머지 트랜잭션은 실패합니다.

<p align="center">
    <img src="/images/concurrency-problem-missing-count-02.png" width="80%" class="image__border">
</p>

### 1.2. Update Problem

이미 데이터베이스에 추가한 데이터가 존재하는 경우에도 동시성 문제가 발생합니다. 동시에 시작한 트랜잭션이 바라보는 데이터의 모습은 같습니다. 

1. 1번 트랜잭션은 "좋아요" 카운트 값이 1인 데이터를 조회합니다.
1. 거의 동시에 시작한 2번 트랜잭션도 "좋아요" 카운트 값이 1인 데이터를 조회합니다.
1. 두 트랜잭션은 조회한 엔티티의 카운트 값을 증가시킨 후 업데이트합니다.
    - "좋아요" 카운트 값이 2인 데이터로 업데이트됩니다.

<p align="center">
    <img src="/images/concurrency-problem-missing-count-03.png" width="80%" class="image__border">
</p>

##### cURL Result

- 초기 데이터가 있는 상태에서 cURL 명령어로 동시에 3회 "좋아요" 요청을 수행합니다.
- 모든 요청이 성공하고 200 상태 코드를 반환합니다.

```
$ curl -X POST -v http://localhost:8080/api/cards/card-01/likes &\
  curl -X POST -v http://localhost:8080/api/cards/card-01/likes &\
  curl -X POST -v http://localhost:8080/api/cards/card-01/likes

[1] 55571
[2] 55572
*   Trying 127.0.0.1:8080...
* Connected to localhost (127.0.0.1) port 8080 (#0)
> POST /api/cards/card-01/likes HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/8.1.2
> Accept: */*
> 
*   Trying 127.0.0.1:8080...
* Connected to localhost (127.0.0.1) port 8080 (#0)
> POST /api/cards/card-01/likes HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/8.1.2
> Accept: */*
> 
*   Trying 127.0.0.1:8080...
* Connected to localhost (127.0.0.1) port 8080 (#0)
> POST /api/cards/card-01/likes HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/8.1.2
> Accept: */*
> 
< HTTP/1.1 200 
< Content-Length: 0
< Date: Tue, 21 Nov 2023 17:57:09 GMT
< 
* Connection #0 to host localhost left intact
< HTTP/1.1 200 
< Content-Length: 0
< Date: Tue, 21 Nov 2023 17:57:09 GMT
< < HTTP/1.1 200 

< Content-Length: 0
* < Connection #0 to host localhost left intact
Date: Tue, 21 Nov 2023 17:57:09 GMT
< 
* Connection #0 to host localhost left intact
[2]  + 55572 done       curl -X POST -v http://localhost:8080/api/cards/card-01/likes
[1]  + 55571 done       curl -X POST -v http://localhost:8080/api/cards/card-01/likes
```

##### Database Result

데이터를 조회합니다.

- "좋아요" 카운트 값은 4를 예상했지만, 2인 상태입니다. 
- 모든 트랜잭션이 성공했지만, 동시성 문제로 인해 정상적인 값으로 업데이트되지 않았습니다.

<p align="center">
    <img src="/images/concurrency-problem-missing-count-04.png" width="80%" class="image__border">
</p>

## 2. Solve the problem

두 개의 동시성 문제를 해결하기 위해 다음과 같이 설계합니다. 

- 초기 데이터가 존재하지 않은 경우
    - 여러 트랜잭션들이 동시에 데이터를 추가하면서 예외가 발생하면 재시도(retry)합니다. 
- 이미 데이터가 존재하는 경우
    - 여러 트랜잭션들이 동시에 업데이트하면서 발생하는 동시성 문제는 [비관적인 락(pessimistic lock)][jpa-pessimitic-lock-link]을 통해 트랜잭션들이 순차적으로 실행되도록 만듭니다. 
    - 비관적인 락 방식은 요청이 많은 경우 트랜잭션이 길어지면서 타임아웃(timeout) 예외가 발생할 수 있습니다.
    - 타임아웃 예외가 발생하면 재시도합니다.

비관적인 락 방식은 타임아웃 시간이 너무 길지 않도록 주의해야 합니다. 타임아웃 시간이 너무 길면 요청이 많을 때 스레드가 오랜 시간 대기하게 됩니다. 스프링 프레임워크(spring framework)의 디폴트 서블릿 컨테이너인 톰캣은 스레드-퍼-리퀘스트(thread-per-request) 모델을 사용하기 때문에 요청을 처리하는 스레드가 스레드 풀(thread pool)에 오랜 시간 동안 반환되지 않는 것은 심각한 문제를 일으킬 수 있습니다. 이번 글에서는 JPA에서 지원하는 비관적인 락의 기본 타임아웃 시간인 5초를 사용했습니다. 

"좋아요" 요청이 누락되지 않도록 큐(queue)를 사용합니다. 재시도가 필요한 요청은 큐에 담습니다. 서블릿 스레드가 오랜 시간 반환되지 않는 문제를 해결하기 위해서 풀 사이즈가 고정된 별도 스레드 풀을 통해 비동기 처리로 재시도합니다. 

다음과 같은 두 곳에서 예외 처리가 필요합니다. 

- 컨트롤러 레이어 예외 처리
    - 데이터 동시 추가로 인해 발생하는 예외는 @Transactional 애너테이션으로 트랜잭션을 처리하기 때문에 서비스 레이어에서 잡을 수 없습니다.
    - 컨트롤러 레이어에서 예외 처리를 수행하면 데이터베이스 제약 조건으로 인해 발생하는 예외와 비관적 락의 타임아웃으로 발생하는 예외를 동일하게 처리할 수 있습니다. 
    - 예외가 발생하면 재시도 핸들러에게 해당 카드 아이디를 전달합니다.

<p align="center">
    <img src="/images/concurrency-problem-missing-count-05.png" width="80%" class="image__border">
</p>

- 재시도 핸들러 예외 처리
    - 재시도 요청이 들어오면 카드 아이디를 큐에 담은 후 스레드 풀에게 재시도 작업을 요청합니다.
    - 스레드 풀은 재시도 큐에 담긴 카드 아이디가 모두 비워질 때까지 반복 수행합니다.
    - 타임아웃 예외가 발생하면 해당 카드 아이디를 다시 재시도 큐에 담습니다.

<p align="center">
    <img src="/images/concurrency-problem-missing-count-06.png" width="80%" class="image__border">
</p>

### 2.1. CardLikeRepository Interface

- @Lock 애너테이션을 통해 비관적인 락 방식을 설정합니다.
    - `PESSIMISTIC_WRITE` 설정으로 늦게 시작한 트랜잭션들은 락이 풀리기 전까지 해당 데이터에 접근할 수 없도록 합니다.
    - 데이터를 먼저 조회한 트랜잭션이 해당 데이터를 선점합니다.
- 카드 아이디로 조회합니다.

```java
package action.in.blog.repository;

import action.in.blog.domain.CardLikeEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface CardLikeRepository extends JpaRepository<CardLikeEntity, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(value = "select cl from CardLikeEntity cl where cl.cardId = :cardId")
    Optional<CardLikeEntity> findByIdWithLock(String cardId);
}
```

### 2.2. DefaultCardLikeService Class

- findById 메소드를 findByIdWithLock 메소드로 변경합니다.
- 데이터가 존재하는 경우 데이터를 먼저 선점한 트랜잭션만 이후 로직을 진행할 수 있습니다.

```java
package action.in.blog.service;

import action.in.blog.domain.CardLikeEntity;
import action.in.blog.repository.CardLikeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DefaultCardLikeService implements CardLikeService {

    private final CardLikeRepository cardLikeRepository;

    public DefaultCardLikeService(CardLikeRepository cardLikeRepository) {
        this.cardLikeRepository = cardLikeRepository;
    }

    @Transactional
    @Override
    public void increaseLikeCount(String cardId) {
        var cardLikeOptional = cardLikeRepository.findByIdWithLock(cardId);
        if (cardLikeOptional.isEmpty()) {
            cardLikeRepository.save(new CardLikeEntity(cardId));
            return;
        }
        var cardLike = cardLikeOptional.get();
        cardLike.increase();
    }
}
```

##### Test Code

테스트 코드에서 필요한 데이터를 준비하기 위해 `data.sql` 파일에 아래와 같은 스크립트를 작성합니다.

```sql
insert into card_like_entity (count, card_id) values (1, 'card-01');
```

동시성 문제로 인해 서비스 레이어에서 예외가 발생하는 테스트 케이스만 다뤘습니다. @DataJpaTest 애너테이션은 기본적으로 @Transactional 애너테이션을 사용하기 때문에 테스트 메소드를 실행하는 동안 동일한 트랜잭션이 적용됩니다. 각 스레드에 새로운 트랜잭션을 지정하기 위해 AsyncTransaction 컴포넌트를 사용합니다.

- insert_same_data_in_the_same_time_then_throw_sql_exception 메소드
    - 두 스레드가 동시에 새로운 데이터를 추가합니다.
    - DataIntegrityViolationException 예외가 발생할 것을 예상합니다.
- other_transaction_exists_then_throw_timeout_exception 메소드
    - 먼저 시작한 트랜잭션이 이미 존재하는 데이터를 업데이트하기 위해 오랜 시간 락을 걸고 있는 경우를 확인합니다.
    - 늦게 시작한 트랜잭션이 타임아웃 예외가 발생하는지 확인합니다.
    - PessimisticLockingFailureException 예외가 발생할 것을 예상합니다.

```java
package action.in.blog.service;

import action.in.blog.repository.CardLikeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;

@Component
class AsyncTransaction {

    @Transactional
    public void run(Runnable runnable) {
        runnable.run();
    }
}

@Import(AsyncTransaction.class)
@DataJpaTest(properties = {
        "spring.sql.init.data-locations=classpath:db/data.sql",
        "spring.jpa.defer-datasource-initialization=true"
})
class CardLikeServiceTest {

    @Autowired
    AsyncTransaction asyncTransaction;
    @Autowired
    CardLikeRepository cardLikeRepository;
    CardLikeService sut;

    @BeforeEach
    void setUp() {
        sut = new DefaultCardLikeService(cardLikeRepository);
    }

    void sleep(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void insert_same_data_in_the_same_time_then_throw_sql_exception() {

        var throwable = assertThrows(RuntimeException.class, () -> {
            var tx1 = CompletableFuture.runAsync(() -> asyncTransaction.run(() -> sut.increaseLikeCount("card-02")));
            var tx2 = CompletableFuture.runAsync(() -> asyncTransaction.run(() -> sut.increaseLikeCount("card-02")));
            tx1.join();
            tx2.join();
        });


        assertInstanceOf(DataIntegrityViolationException.class, throwable.getCause());
    }

    @Test
    void other_transaction_exists_then_throw_timeout_exception() {

        var tx1 = CompletableFuture.runAsync(() -> asyncTransaction.run(() -> {
            sut.increaseLikeCount("card-01");
            sleep(7000);
        }));
        sleep(1000);


        var throwable = assertThrows(RuntimeException.class, () -> sut.increaseLikeCount("card-01"));


        tx1.join();
        assertInstanceOf(PessimisticLockingFailureException.class, throwable);
    }
}
```

- insert_same_data_in_the_same_time_then_throw_sql_exception 메소드 실행 로그
    - 두 트랜잭션 모두 `for update` 키워드와 함께 데이터를 조회합니다.
    - 두 트랜잭션 모두 데이터를 찾지 못 했기 때문에 insert 쿼리를 수행합니다. 
    - 두 트랜잭션 중 하나는 실패합니다.

```
Hibernate: select c1_0.card_id,c1_0.count from card_like_entity c1_0 where c1_0.card_id=? for update
Hibernate: select c1_0.card_id,c1_0.count from card_like_entity c1_0 where c1_0.card_id=? for update
Hibernate: select c1_0.card_id,c1_0.count from card_like_entity c1_0 where c1_0.card_id=?
Hibernate: select c1_0.card_id,c1_0.count from card_like_entity c1_0 where c1_0.card_id=?
Hibernate: insert into card_like_entity (count,card_id) values (?,?)
Hibernate: insert into card_like_entity (count,card_id) values (?,?)
2023-11-23T00:04:19.035+09:00  WARN 42045 --- [onPool-worker-1] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Error: 23505, SQLState: 23505
2023-11-23T00:04:19.035+09:00 ERROR 42045 --- [onPool-worker-1] o.h.engine.jdbc.spi.SqlExceptionHelper   : Unique index or primary key violation: "PUBLIC.PRIMARY_KEY_D ON PUBLIC.CARD_LIKE_ENTITY(CARD_ID) VALUES ( /* 3 */ 'card-02' )"; SQL statement:
insert into card_like_entity (count,card_id) values (?,?) [23505-214]
```

- other_transaction_exists_then_throw_timeout_exception 메소드 실행 로그
    - 두 트랜잭션 모두 `for update` 키워드와 함께 데이터를 조회합니다.
    - 먼저 시작한 트랜잭션이 7초 동안 끝나지 않습니다.
    - 늦게 시작한 트랜잭션에서 락을 점유하지 못하고 타임아웃 예외가 발생합니다.

```
Hibernate: select c1_0.card_id,c1_0.count from card_like_entity c1_0 where c1_0.card_id=? for update
Hibernate: select c1_0.card_id,c1_0.count from card_like_entity c1_0 where c1_0.card_id=? for update
2023-11-23T00:05:30.326+09:00  WARN 42079 --- [    Test worker] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Error: 50200, SQLState: HYT00
2023-11-23T00:05:30.326+09:00 ERROR 42079 --- [    Test worker] o.h.engine.jdbc.spi.SqlExceptionHelper   : Timeout trying to lock table {0}; SQL statement:
select c1_0.card_id,c1_0.count from card_like_entity c1_0 where c1_0.card_id=? for update [50200-214]
Hibernate: update card_like_entity set count=? where card_id=?
```

### 2.3. CardLikeController Class

- 서비스 레이어에서 예외가 발생하는 경우 핸들러를 통해 재시도를 수행합니다.

```java
package action.in.blog.controller;

import action.in.blog.handler.CardLikeRetryHandler;
import action.in.blog.service.CardLikeService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CardLikeController {

    private final CardLikeService cardLikeService;
    private final CardLikeRetryHandler cardLikeRetryHandler;

    public CardLikeController(CardLikeService cardLikeService, CardLikeRetryHandler cardLikeRetryHandler) {
        this.cardLikeService = cardLikeService;
        this.cardLikeRetryHandler = cardLikeRetryHandler;
    }

    @PostMapping("/cards/{cardId}/likes")
    public void increase(@PathVariable String cardId) {
        try {
            cardLikeService.increaseLikeCount(cardId);
        } catch (Exception e) {
            cardLikeRetryHandler.retry(cardId);
        }
    }
}
```

##### Test Code

- 서비스 레이어에서 예외가 발생했을 때 재시도 핸들러가 해당 카드 아이디로 재시도를 수행하는지 확인합니다.

```java
package action.in.blog.controller;

import action.in.blog.handler.CardLikeRetryHandler;
import action.in.blog.service.CardLikeService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

class CardLikeControllerTest {

    @Test
    void retry_when_increase_like_throw_exception() throws Exception {

        var cardLikeService = mock(CardLikeService.class);
        var cardLikeRetryHandler = mock(CardLikeRetryHandler.class);
        var sut = MockMvcBuilders.standaloneSetup(
                new CardLikeController(cardLikeService, cardLikeRetryHandler)
        ).build();
        doThrow(new RuntimeException()).when(cardLikeService).increaseLikeCount("card-01");


        sut.perform(
                post("/api/cards/card-01/likes")
        );


        verify(cardLikeRetryHandler, times(1)).retry("card-01");
    }
}
```

### 2.4. CardLikeRetryHandler Class

- 풀 사이즈가 1개로 고정된 스레드 풀을 사용합니다.
- 동시성 문제가 발생하지 않도록 ConcurrentLinkedDeque 클래스를 사용합니다.
- retry 메소드
    - 재시도 요청이 필요한 카드 아이디를 큐에 추가합니다.
    - 스레드 풀에 재시도 태스크(task)를 전달합니다.
- handle 메소드
    - 재시도 태스크를 정의한 메소드입니다.
    - 재시도 큐에서 카드 아이디를 하나씩 꺼내서 실행합니다.
    - 재시도 큐가 비워질 때까지 수행합니다.
    - 예외가 발생한 카드 아이디는 다시 큐에 전달합니다.

```java
package action.in.blog.handler;

import action.in.blog.service.CardLikeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

@Component
public class CardLikeRetryHandler {

    private final Logger logger = LoggerFactory.getLogger(CardLikeRetryHandler.class);
    private final CardLikeService cardLikeService;
    private final Queue<String> retryQueue;
    private final ExecutorService retryHandler;

    public CardLikeRetryHandler(CardLikeService cardLikeService) {
        this.cardLikeService = cardLikeService;
        this.retryQueue = new ConcurrentLinkedDeque<>();
        this.retryHandler = Executors.newFixedThreadPool(1);
    }

    private void handle() {
        while (!retryQueue.isEmpty()) {
            logger.warn("queue size - {}", retryQueue.size());
            var id = retryQueue.poll();
            try {
                cardLikeService.increaseLikeCount(id);
            } catch (Exception e) {
                logger.warn("exception cause - {}", e.getMessage());
                retryQueue.add(id);
            }
        }
    }

    public Future<?> retry(String cardId) {
        retryQueue.add(cardId);
        return retryHandler.submit(this::handle);
    }
}
```

##### Test Code

- 테스트 더블(test double)이 "card-01" 카드 아이디로 호출되는 경우 최초 1회만 예외를 발생시킵니다.
    - 이 후 호출에선 예외가 발생하지 않습니다.
- 스레드 풀에 전달된 태스크가 종료될 때까지 대기 후 예상 결과를 확인합니다.
    - 예외가 발생한 "card-01" 아이디로 3회 호출되는 것을 기대합니다.
    - 예외가 발생하지 않는 "card-02" 아이디로 1회 호출되는 것을 기대합니다.

```java
package action.in.blog.handler;

import action.in.blog.service.CardLikeService;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.*;

class CardLikeRetryHandlerTest {

    @Test
    void retry() {

        var cardLikeService = mock(CardLikeService.class);
        var sut = new CardLikeRetryHandler(cardLikeService);
        doThrow(new RuntimeException())
                .doNothing()
                .when(cardLikeService)
                .increaseLikeCount("card-01");


        sut.retry("card-01");
        sut.retry("card-02");
        var future = sut.retry("card-01");


        while(!future.isDone());
        verify(cardLikeService, times(1)).increaseLikeCount("card-02");
        verify(cardLikeService, times(3)).increaseLikeCount("card-01");
    }
}
```

## 3. Result 

애플리케이션을 실행 후 cURL 명령어를 통해 동시에 3개의 요청들을 4회 전달합니다. 요청 횟수에 맞게 "좋아요" 카운트가 12회로 업데이트 되었는지 확인합니다.

- 1차 3회 요청
    - 3회 요청 모두 200 응답을 받습니다.  
    - 최초 요청만 성공하고 나머지 두 요청은 재시도 핸들러에 의해 처리되는 것을 로그의 큐 사이즈를 통해 확인할 수 있습니다.
- 2차 3회 요청
    - 첫 요청은 빠르게 200 응답을 받지만, 나머지 두 요청은 약간의 시간이 지난 후 200 응답을 받습니다.
    - 최초 요청만 성공하고 나머지 두 요청은 재시도 핸들러에 의해 처리되는 것을 로그의 큐 사이즈를 통해 확인할 수 있습니다.
- 3차, 4차 3회 요청 
    - SQL 콘솔에서 미리 업데이트 쿼리를 수행하고 커밋을 수행하지 않습니다. 
    - 6회 요청 모두 약간의 시간이 지난 후 200 응답을 받습니다.
    - 6회 요청 모두 재시도 핸들러에 의해 처리되는 것을 로그의 큐 사이즈를 통해 확인할 수 있습니다.
    - SQL 콘솔에서 커밋을 수행하지 않으면 재시도 핸들러에서 타임아웃 예외가 계속 발생하는 것을 확인할 수 있습니다.
    - SQL 콘솔에서 커밋을 수행하면 재시도 핸들러의 큐가 빠르게 소진되는 것을 로그를 통해 확인할 수 있습니다.
- "좋아요" 카운트가 총 12회 되었음을 확인할 수 있습니다.

<p align="center">
    <img src="/images/concurrency-problem-missing-count-07.gif" width="100%" class="image__border">
</p>

## CLOSING

실제 프로젝트에선 도메인 설계가 조금 달랐기 때문에 다른 방법으로 문제를 해결했습니다. 이 글에서 다룬 시나리오는 지인이 겪고 있던 동시성 문제와 제가 프로젝트에서 겪었던 동시성 문제를 조합한 내용입니다. 작은 애플리케이션이라도 동시성 문제를 겪을 수 있다는 사실을 새삼 느꼈습니다. 주변 백엔드 개발자 지인들이 이직할 때 받았던 과제들을 보면 동시성 문제에 대해 고민한 설계를 요청 받는데, 이 글이 동일한 고민을 하시는 분들께 도움이 되길 바랍니다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-11-22-concurrency-problem-update-wrong-data>

#### RECOMMEND NEXT POSTS

- [Concurrency Problem - Insert same rows][concurrency-problem-insert-same-rows-link]

[transcation-isolation-link]: https://junhyunny.github.io/information/transcation-isolation/
[jpa-pessimitic-lock-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-pessimitic-lock/
[thread-pool-in-java-link]: https://junhyunny.github.io/java/thread-pool-in-java/

[concurrency-problem-insert-same-rows-link]: https://junhyunny.github.io/java/spring-boot/jpa/concurrency-problem-insert-same-rows/