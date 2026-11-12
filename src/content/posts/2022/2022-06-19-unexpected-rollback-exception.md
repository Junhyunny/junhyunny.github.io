---
title: "@Transactional 애너테이션과 UnexpectedRollbackException 발생"
publishedAt: "2022-06-19"
updatedAt: "2026-11-12T16:18:19+09:00"
canonicalPath: "/spring-boot/jpa/exception/unexpected-rollback-exception/"
categories:
  - "spring-boot"
  - "jpa"
  - "exception"
summary: "@Transactional 메서드 안에서 잡은 예외가 UnexpectedRollbackException으로 전파된 원인을 분석하고, 트랜잭션 메서드 밖에서 예외를 처리해 해결한 과정을 기록했다."
recommendedPosts:
  - title: "@Transactional 애너테이션의 전파 타입(PropagationType)"
    href: "https://junhyunny.github.io/spring-boot/jpa/junit/transactional-propagation-type/"
---

## 0. 들어가면서

이번 프로젝트에는 사용자 접근 이력 정보를 저장하는 로직이 있었다. 예외(exception)가 발생하더라도 주요 비즈니스 흐름에는 영향을 주지 않도록 `try-catch` 블록으로 예외를 처리했다.

그런데 개발계에 배포하자 개발계 데이터베이스에 테이블이 준비되지 않아 이 로직에서 에러가 발생했고, 예상과 달리 예외가 처리되지 않고 프론트엔드 서비스까지 전파됐다. 에러 로그의 스택 트레이스(stack trace)를 보고 아차 싶었다. 관련 코드 일부를 각색해 현상과 원인을 정리했다.

## 1. 문제 현상

### 1.1. 문제 코드

먼저 코드를 살펴보자.

AccessHistoryEntity 클래스는 접근 이력 정보를 저장한다. 사용자 아이디와 접근 경로를 저장하며, 두 값에 `NOT NULL` 제약 조건을 부여한다.

```java
package blog.in.action.history;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class AccessHistoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String accessUserId;

    @Column(nullable = false)
    private String accessPath;
}
```

AccessHistoryService 클래스는 접근 경로와 사용자 아이디를 전달받아 저장한다. `save` 메서드 호출을 `try-catch` 블록으로 감싸 예외가 발생하면 에러 로그를 출력하고 로직을 종료한다. 또 `@Transactional` 애너테이션으로 n개의 접근 이력 `insert` 로직을 하나의 트랜잭션으로 처리하므로, n번의 `save` 메서드 호출 중 하나라도 실패하면 이전 `insert` 쿼리를 모두 롤백한다.

```java
package blog.in.action.history;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Log4j2
@RequiredArgsConstructor
@Service
public class AccessHistoryService {

    private final AccessHistoryRepository repository;

    @Transactional
    public void createAccessHistories(List<String> paths, String userId) {
        try {
            for (String path : paths) {
                AccessHistoryEntity entity = AccessHistoryEntity.builder()
                        .accessPath(path)
                        .accessUserId(userId)
                        .build();
                repository.save(entity);
            }
        } catch (Exception e) {
            log.error(e.getMessage());
        }
    }
}
```

### 1.2. 테스트 코드 - 에러 핸들링 실패 확인

이 로직은 정상적으로 트랜잭션 처리가 되므로 n번의 `save` 메서드 호출 중 하나라도 실패하면 이전 쿼리를 모두 롤백한다. `createAccessHistories` 메서드 내부에서 예외를 처리했기 때문에 외부로 `exception`이 전파되지 않을 줄 알았지만, 실제로는 컨트롤러(controller)의 예외 핸들러(exception handler)까지 전파됐다.

간단한 테스트 코드로 예외 발생과 롤백 여부를 확인해 보자. 테스트는 다음 순서로 진행한다.

1. 내부에서 `save` 메서드를 호출할 때 예외가 발생하도록 `paths` 리스트 중간에 `null` 값을 추가한다.
2. `createAccessHistories` 메서드를 호출하면 `UnexpectedRollbackException`을 던질 것으로 예상한다.
3. `createAccessHistories` 메서드를 호출할 때 발생한 `throwable` 객체의 스택 트레이스를 확인한다.
4. `count` 메서드를 호출해 모두 롤백되어 테이블의 데이터가 0건인지 확인한다.

```java
package blog.in.action.history;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.UnexpectedRollbackException;

import java.util.Arrays;
import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertThrows;

@AutoConfigureTestDatabase
@SpringBootTest
public class AccessHistoryIT {

    @Autowired
    AccessHistoryRepository repository;

    @Autowired
    AccessHistoryService service;

    @Test
    void test() {
        List<String> paths = Arrays.asList("/hello", null, "/world");

        Throwable throwable = assertThrows(UnexpectedRollbackException.class, () -> {
            service.createAccessHistories(paths, "Junhyunny");
        });
        throwable.printStackTrace();

        assertThat(repository.count(), equalTo(0L));
    }
}
```

테스트를 실행하면 예상대로 `UnexpectedRollbackException` 예외가 발생한다. `exception` 발생으로 이전 쿼리가 롤백되어 테이블에 저장된 데이터는 0건이다.

<div class="block-break" align="left">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/unexpected-rollback-exception-01.png" width="100%" class="image__border">
</div>

에러 로그를 보면 첫 `save` 메서드는 정상적으로 동작한다. 이후 `NOT NULL`을 예상한 `AccessHistoryEntity` 객체의 `accessPath` 필드에 `NULL` 값이 삽입되어 다음 에러가 발생한다.

- not-null property references a null or transient value : blog.in.action.history.AccessHistoryEntity.accessPath

```
Hibernate:
    insert
    into
        access_history_entity
        (id, access_path, access_user_id)
    values
        (null, ?, ?)
2022-06-19 15:54:52.505 ERROR 88796 --- [           main] b.i.action.history.AccessHistoryService  : not-null property references a null or transient value : blog.in.action.history.AccessHistoryEntity.accessPath; nested exception is org.hibernate.PropertyValueException: not-null property references a null or transient value : blog.in.action.history.AccessHistoryEntity.accessPath
org.springframework.transaction.UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only
    at org.springframework.transaction.support.AbstractPlatformTransactionManager.processCommit(AbstractPlatformTransactionManager.java:752)
    at org.springframework.transaction.support.AbstractPlatformTransactionManager.commit(AbstractPlatformTransactionManager.java:711)
    at org.springframework.transaction.interceptor.TransactionAspectSupport.commitTransactionAfterReturning(TransactionAspectSupport.java:654)
    at org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:407)
    at org.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:119)
    at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
    at org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.proceed(CglibAopProxy.java:753)
    at org.springframework.aop.framework.CglibAopProxy$DynamicAdvisedInterceptor.intercept(CglibAopProxy.java:698)
    at blog.in.action.history.AccessHistoryService$$EnhancerBySpringCGLIB$$a017440d.createAccessHistories(<generated>)
    ...

Hibernate:
    select
        count(*) as col_0_0_
    from
        access_history_entity accesshist0_
```

## 2. 문제 원인

`@Transactional` 애너테이션이 붙은 메서드에는 트랜잭션 처리를 위한 AOP 로직이 메서드 앞뒤로 추가된다. `createAccessHistories` 메서드도 `@Transactional` 애너테이션 때문에 AOP 로직이 추가되는데, 마지막 커밋(commit)을 진행하는 과정에서 예상치 못한 롤백이 있었다는 예외를 던진다.

위 테스트 수행 로그에서 예외가 발생한 지점을 보면 힌트를 얻을 수 있다. `createAccessHistories` 메서드를 호출한 뒤 `AbstractPlatformTransactionManager` 클래스의 `processCommit` 메서드를 실행하는 과정에서 `UnexpectedRollbackException` 예외가 발생한다.

```
org.springframework.transaction.UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only
    at org.springframework.transaction.support.AbstractPlatformTransactionManager.processCommit(AbstractPlatformTransactionManager.java:752)
    at org.springframework.transaction.support.AbstractPlatformTransactionManager.commit(AbstractPlatformTransactionManager.java:711)
    at org.springframework.transaction.interceptor.TransactionAspectSupport.commitTransactionAfterReturning(TransactionAspectSupport.java:654)
    ...
    at blog.in.action.history.AccessHistoryService$$EnhancerBySpringCGLIB$$a017440d.createAccessHistories(<generated>)
```

다음과 같은 과정을 거쳐 `exception`이 컨트롤러의 예외 핸들러까지 전파됐다.

1. 하이버네이트 내부에서 NULL 여부를 체크하는 과정에서 `PropertyValueException` 발생
2. `save` 메서드의 트랜잭션 AOP 로직에서 rollback-only 마크 처리
3. `createAccessHistories` 메서드에서 발생한 예외의 에러 메시지 로깅 후 종료
4. `createAccessHistories` 메서드 트랜잭션 AOP 로직의 커밋 과정에서 이미 롤백 표시된 것을 보고 `UnexpectedRollbackException` 발생
5. `createAccessHistories` 메서드를 호출하는 곳에 별도의 예외 처리가 없어 `exception` 전파
6. 컨트롤러의 예외 핸들러까지 `exception` 전파

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/unexpected-rollback-exception-02.png" width="100%" class="image__border">
</div>

## 3. 해결 방법

해결 방법은 단순하다. `@Transactional` 애너테이션이 붙은 메서드 바깥에서 예외를 처리하면 된다. 이번 경우에는 `createAccessHistories` 메서드 호출 지점을 `try-catch` 블록으로 감싸지 않고, `JpaRepository` 인터페이스의 `saveAll` 메서드에 이미 `@Transactional` 애너테이션이 붙어 있다는 점을 이용해 내부 로직을 바꿨다.

### 3.1. AccessHistoryService 클래스 createAccessHistories 메서드 수정

`createAccessHistories` 메서드에서 `@Transactional` 애너테이션을 제거하고, `saveAll` 메서드로 `AccessHistoryEntity` 객체를 저장하는 로직을 하나의 트랜잭션으로 묶는다.

```java
package blog.in.action.history;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Log4j2
@RequiredArgsConstructor
@Service
public class AccessHistoryService {

    private final AccessHistoryRepository repository;

    public void createAccessHistories(List<String> paths, String userId) {
        try {
            List<AccessHistoryEntity> entities = paths.stream()
                    .map(path -> AccessHistoryEntity.builder()
                            .accessPath(path)
                            .accessUserId(userId)
                            .build())
                    .collect(Collectors.toList());

            repository.saveAll(entities);
        } catch (Exception e) {
            log.error(e.getMessage());
        }
    }
}
```

### 3.2. AccessHistoryIT 클래스 테스트

테스트에서는 `paths` 리스트 중간에 `null`을 전달해 에러를 유발한다. 별도의 예외가 발생하지 않으므로 `assertThrows`는 수행하지 않고, `createAccessHistories` 메서드를 호출한 뒤 정상적으로 롤백됐는지 `count` 메서드로 확인한다.

```java
package blog.in.action.history;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Arrays;
import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@AutoConfigureTestDatabase
@SpringBootTest
public class AccessHistoryIT {

    @Autowired
    AccessHistoryRepository repository;

    @Autowired
    AccessHistoryService service;

    @Test
    void test() {
        List<String> paths = Arrays.asList("/hello", null, "/world");

        service.createAccessHistories(paths, "Junhyunny");

        assertThat(repository.count(), equalTo(0L));
    }
}
```

## CLOSING

당시에는 작성한 단위 테스트가 모두 통과해서 별생각 없이 코드를 올렸는데, 개발계 데이터베이스 작업이 미흡한 상태여서 개발계 배포 후에 이런 버그를 발견했다. 에러 현상을 확인하고 조치하면서 이런 생각이 들었다.

- 이런 케이스를 커버할 수 있는 단위 테스트를 작성할 수 있을까?
- 단위 테스트로 커버할 수 없는 상황에 대비해 로컬에서 동작시킨 후 코드를 올리는 습관을 가지자.
- JPA 트랜잭션 처리와 관련된 글들을 작성하면서 많은 공부를 했지만, 아직 갈 길이 멀구나.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-06-19-unexpected-rollback-exception>
