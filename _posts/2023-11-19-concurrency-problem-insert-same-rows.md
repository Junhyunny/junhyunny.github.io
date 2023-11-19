---
title: "Concurrency Problem - Insert same rows"
search: false
category:
  - java
  - spring-boot
  - jpa
last_modified_at: 2023-11-19T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Transaction Isolation][transcation-isolation-link]
- [Pessimistic Lock in JPA][jpa-pessimitic-lock-link]
- [Optimistic Lock in JPA][jpa-optimistic-lock-link]

## 0. 들어가면서

동시성 문제는 서버 개발자 커리어를 시작했던 MES(Manufacturing Execution System) 개발 및 운영할 때 처음 경험했었습니다. 크레인, 트레일러, 컨베이어 벨트에 설치된 센서들에서 밀리초(ms) 단위로 메세지를 수신하면서 트랜잭션 경합이 너무 심하게 발생했습니다. 데이터베이스 락(lock) 메커니즘을 이용한 비관적인 락(pessimistic lock) 방식이나 애플리케이션에서 제어하는 낙관적인 락(optimistic lock) 방식을 통해 데이터 정합성을 지키기 위한 코드를 많이 작성했었습니다. 

동시성 문제는 대규모 트랜잭션이 존재하는 시스템에서만 발생하는 줄 알았지만, 여러 경험을 쌓다보니 반드시 큰 시스템에서만 동시성 이슈가 발생했던 것은 아닌 것 같습니다. 최근 개발 중인 애플리케이션에서도 두 종류의 문제가 발생했었습니다. 이번 글은 첫번째 사례와 해결 방법을 조금 각색하여 정리한 내용입니다. 

## 1. Problem Context

사용자들이 모바일 웹 애플리케이션에 구현된 QR 스캔을 통해 카드 정보를 수집하는 기능을 개발했습니다. 웹 카메라를 통해 정보를 수집하는 속도가 너무 빨라서 비즈니스 로직에 중복 확인을 위한 코드가 있었음에도 불구하고 같은 정보가 동시에 여러 개 저장되는 문제가 있었습니다.  트랜잭션 격리 수준에 따라 거의 동시에 시작한 애플리케이션의 트랜잭션들이 서로의 모습을 확인할 수 없는 것이 문제의 원인입니다. 

1. 1번 트랜잭션 데이터를 조회하지만, 존재하지 않으므로 insert 쿼리를 수행합니다. 하지만 아직 커밋(commit)을 수행하진 못 헀습니다.
1. 거의 동시에 시작한 2번 트랜잭션이 데이터를 조회하지만, 존재하지 않으므로 insert 쿼리를 수행합니다. 
1. 두 트랜잭션이 커밋을 수행하면 동일한 두 개의 데이터가 추가됩니다.

<p align="center">
    <img src="/images/concurrency-problem-insert-same-rows-01.png" width="80%" class="image__border">
</p>

## 2. Solve the problem

수집 정보는 시퀀스(sequence)를 기본 키(PK, primary key)로 사용했기 때문에 처음 데이터가 생성될 때 트랜잭션 경합으로 인해 발생하는 동시성 문제를 비관적인 락이나 낙관적인 락 방식으로 제어하기 어려웠습니다. 

```java
package action.in.blog.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class CollectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String userId;
    private String cardId;


    public CollectEntity() {
    }

    public CollectEntity(String userId, String cardId) {
        this.userId = userId;
        this.cardId = cardId;
    }
}
```

락을 사용하기보단 테이블에 제약 조건(constraint)을 추가하는 방법을 통해 문제를 해결했습니다.

- 사용자 아이디와 카드 아이디 조합을 유니크 키(unique key)로 만들어 중복 insert 쿼리 동작을 실패시킨다.
- 중복 데이터 추가에 대한 예외(exception)를 던지고 클라이언트와의 프로토콜을 전역 예외 핸들러(exception handler)에 정의한다.

### 2.1. CollectEntity Class

@Table 애너테이션을 통해 유니크 키 제약 조건을 명시합니다. 개발, 스테이지, 운영 환경 데이터베이스에 테이블이 존재했기 때문에 제약 조건 추가는 DDL(Data Definition Language)을 통해 직접 변경하였습니다.

- cardId, userId 컬럼을 조합하여 유니크 키를 생성합니다.

```java
package action.in.blog.domain;

import jakarta.persistence.*;

@Entity
@Table(uniqueConstraints = {@UniqueConstraint(columnNames = {"cardId", "userId"})})
public class CollectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String userId;
    private String cardId;


    public CollectEntity() {
    }

    public CollectEntity(String userId, String cardId) {
        this.userId = userId;
        this.cardId = cardId;
    }
}
```

### 2.2. CardService Class

- 중복하는 데이터가 존재하는 경우 DuplicatedCollectException 예외를 던진다.
- save 메소드를 실행할 때 유니크 키 제약 조건으로 인해 실패하는 경우도 동일하게 DuplicatedCollectException 예외를 던진다.

```java
package action.in.blog.service;

import action.in.blog.domain.CollectEntity;
import action.in.blog.exception.DuplicatedCollectException;
import action.in.blog.repository.CollectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DefaultCollectService implements CollectService {

    private final CollectRepository collectRepository;

    public DefaultCollectService(CollectRepository collectRepository) {
        this.collectRepository = collectRepository;
    }

    @Transactional
    @Override
    public void collect(String userId, String cardId) {
        var exists = collectRepository.existsByUserIdAndCardId(userId, cardId);
        if (exists) {
            throw new DuplicatedCollectException();
        }
        try {
            collectRepository.save(new CollectEntity(userId, cardId));
        } catch (Exception e) {
            throw new DuplicatedCollectException();
        }
    }
}
```

#### Test Code

트랜잭션 경합으로 인한 DuplicatedCollectException 예외를 재현하기 위해 CompletableFuture 클래스를 사용해 비동기 처리를 수행합니다. 

- 테스트 스레드에서 collect 메소드를 수행합니다.
- CompletableFuture 스레드에서 collect 메소드를 수행합니다.
    - join 메소드를 통해 해당 스레드가 끝나길 기다립니다.
    - 비동기 처리 내부에서 예외가 발생하면 CompletionException 예외로 묶여 전달됩니다.
    - CompletionException 예외의 원인을 다시 던집니다.
- 다음과 같은 케이스를 모두 커버합니다.
    - 중복 확인으로 DuplicatedCollectException 예외가 발생하는 경우
    - 유니크 키 제약 조건으로 인해 DuplicatedCollectException 예외가 발생하는 경우
    - 테스트 스레드에서 DuplicatedCollectException 예외가 발생하는 경우
    - CompletableFuture 스레드에서 DuplicatedCollectException 예외가 발생하는 경우

```java
package action.in.blog.service;

import action.in.blog.exception.DuplicatedCollectException;
import action.in.blog.repository.CollectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
class DefaultCollectServiceTest {

    @Autowired
    CollectRepository collectRepository;
    CollectService sut;

    @BeforeEach
    void setUp() {
        sut = new DefaultCollectService(collectRepository);
    }

    @Test
    void throwDuplicatedCollectException() {

        assertThrows(DuplicatedCollectException.class, () -> {
            sut.collect("junhyunny", "card-01");
            try {
                CompletableFuture
                        .runAsync(() -> sut.collect("junhyunny", "card-01"))
                        .join();
            } catch (CompletionException e) {
                throw e.getCause();
            }
        });
    }
}
```

### 2.3. GlobalExceptionHandler Class

DuplicatedCollectException 예외를 처리할 핸들러를 정의합니다. 프론트엔드와 프로토콜을 정의합니다. 이번 글에선 600 상태 코드와 예외 메세지를 전달합니다. 

```java
package action.in.blog.handler;

import action.in.blog.exception.DuplicatedCollectException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(value = DuplicatedCollectException.class)
    public ResponseEntity<String> duplicatedCollectException(DuplicatedCollectException exception) {
        return ResponseEntity.status(600)
                .body(exception.getMessage());
    }
}
```

#### Test Code

@WebMvcTest 애너테이션을 사용합니다. 컨트롤러를 지정하여 테스트 컨텍스트 스코프를 최소화합니다.

- CollectService 스프링 빈(bean)을 @MockBean 애너테이션을 통해 주입받습니다.
    - collect 메소드 호출 시 DuplicatedCollectException 예외를 던지는 스텁(stub)으로 만듭니다.
- `/api/cards/A-01` 경로 호출 시 전역 예외 핸들러에서 정의한 상태 코드와 에러 메세지를 응답 받는지 확인합니다.

```java
package action.in.blog.handler;

import action.in.blog.controller.CollectController;
import action.in.blog.exception.DuplicatedCollectException;
import action.in.blog.service.CollectService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {
        CollectController.class
})
class GlobalExceptionHandlerTest {

    @MockBean
    CollectService collectService;

    @Autowired
    MockMvc sut;

    @Test
    void handleDuplicatedCollectException() throws Exception {

        doThrow(new DuplicatedCollectException())
                .when(collectService)
                .collect(any(), any());


        sut.perform(post("/api/cards/A-01"))
                .andExpect(status().is(600))
                .andExpect(content().string("Already collected card"));
    }
}
```

## 3. Result 

cURL 명령어를 통해 카드 수집 API 경로를 동시에 3회 호출합니다. 원하는 에러 코드와 메세지가 반환되는지 확인합니다. 

- 세 번의 호출 중 하나는 200, 나머지는 600 상태 코드를 응답 받습니다.
- `Already collected card` 예외 메세지를 응답 받습니다. 

```
$ curl -X POST -v http://localhost:8080/api/cards/card-01 &\
  curl -X POST -v http://localhost:8080/api/cards/card-01 &\
  curl -X POST -v http://localhost:8080/api/cards/card-01

[1] 98592
[2] 98593
*   Trying 127.0.0.1:8080...
*   Trying 127.0.0.1:8080...
*   Trying 127.0.0.1:8080...
* Connected to localhost (127.0.0.1) port 8080 (#0)
* Connected to localhost (127.0.0.1) port 8080 (#0)
> POST /api/cards/card-01 HTTP/1.1
> Host: localhost:8080
* > Connected to localhost (127.0.0.1) port 8080 (#0)
> POST /api/cards/card-01 HTTP/1.1
User-Agent: curl/8.1.2
> Accept: */*
> 
> Host: localhost:8080
> User-Agent: curl/8.1.2
> Accept: */*
> 
> POST /api/cards/card-01 HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/8.1.2
> Accept: */*
> 
< HTTP/1.1 600 
< Content-Type: text/plain;charset=UTF-8
< Content-Length: 22
< HTTP/1.1 600 
< Content-Type: text/plain;charset=UTF-8
< Content-Length: 22
< Date: Sun, 19 Nov 2023 04:05:58 GMT
< 
< Date: Sun, 19 Nov 2023 04:05:58 GMT
* Connection #0 to host localhost left intact
< 
Already collected card* Connection #0 to host localhost left intact
Already collected card< HTTP/1.1 200 
< Content-Length: 0
< Date: Sun, 19 Nov 2023 04:05:58 GMT
< 
* Connection #0 to host localhost left intact
[2]  + 98593 done       curl -X POST -v http://localhost:8080/api/cards/card-01
[1]  + 98592 done       curl -X POST -v http://localhost:8080/api/cards/card-01    
```

데이터베이스를 확인하면 정상적으로 하나의 로우만 추가된 것을 확인할 수 있습니다. 

<p align="center">
    <img src="/images/concurrency-problem-insert-same-rows-02.png" width="80%" class="image__border">
</p>

## CLOSING

엔티티의 유니크 키 제약 조건 없이 cURL 명령어를 동시에 실행하면 엔티티가 여러 개 추가되는 것을 확인할 수 있습니다. 

- 세 번의 호출 모두 200 상태 코드를 응답 받습니다. 

```
$ curl -X POST -v http://localhost:8080/api/cards/card-01 &\
  curl -X POST -v http://localhost:8080/api/cards/card-01 &\
  curl -X POST -v http://localhost:8080/api/cards/card-01

[1] 98734
[2] 98735
*   Trying 127.0.0.1:8080...
*   Trying 127.0.0.1:8080...
* Connected to localhost (127.0.0.1) port 8080 (#0)
*   Trying 127.0.0.1:8080...
* Connected to localhost (127.0.0.1) port 8080 (#0)
> > POST /api/cards/card-01 HTTP/1.1
POST /api/cards/card-01 HTTP/1.1
> > Host: localhost:8080
Host: localhost:8080
> > User-Agent: curl/8.1.2
User-Agent: curl/8.1.2
> > Accept: */*
Accept: */*
> > 

* Connected to localhost (127.0.0.1) port 8080 (#0)
> POST /api/cards/card-01 HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/8.1.2
> Accept: */*
> 
< < HTTP/1.1 200 
HTTP/1.1 200 
< < Content-Length: 0
Content-Length: 0
< < Date: Sun, 19 Nov 2023 04:07:26 GMT
< < Date: Sun, 19 Nov 2023 04:07:26 GMT

< 
HTTP/1.1 200 
* Connection #0 to host localhost left intact
< * Content-Length: 0
Connection #0 to host localhost left intact
< Date: Sun, 19 Nov 2023 04:07:26 GMT
< 
* Connection #0 to host localhost left intact
[2]  + 98735 done       curl -X POST -v http://localhost:8080/api/cards/card-01
[1]  + 98734 done       curl -X POST -v http://localhost:8080/api/cards/card-01
```

데이터베이스를 확인하면 세 개의 로우가 모두 추가된 것을 확인할 수 있습니다. 

<p align="center">
    <img src="/images/concurrency-problem-insert-same-rows-03.png" width="80%" class="image__border">
</p>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-11-19-concurrency-problem-insert-same-rows>

[transcation-isolation-link]: https://junhyunny.github.io/information/transcation-isolation/
[jpa-pessimitic-lock-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-pessimitic-lock/
[jpa-optimistic-lock-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-optimistic-lock/