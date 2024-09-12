---
title: "@Transactional 애너테이션과 UnexpectedRollbackException 발생"
search: false
category:
  - spring-boot
  - jpa
  - exception
last_modified_at: 2022-06-19T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Propagation in @Transactional Annotation][transactional-propagation-type-link]

## 0. 들어가면서

이번 프로젝트에서 사용자 접근 이력 정보를 저장하는 로직이 있었습니다. 
예외(exception)가 발생하더라도 주요 비즈니스 흐름에는 영향을 주지 않도록 `try-catch` 블록으로 예외 처리를 해주었습니다. 
실제 개발계에 배포했을 때 개발계 데이터베이스에 테이블이 준비되지 않아서 해당 로직에서 에러가 발생했는데, 
예상했던 것과 다르게 예외가 핸들링 되지 않고 프론트엔드 서비스까지 전파되었습니다. 
에러 로그의 스택 트레이스(stack trace)를 보고 아차 싶었는데, 관련된 내용의 일부 코드를 각색하여 현상과 원인에 대해 정리하였습니다. 

## 1. 문제 현상

### 1.1. 문제 코드

우선 코드를 먼저 살펴보겠습니다. 

#### 1.1.1. AccessHistoryEntity 클래스

- 접근 이력 정보를 저장합니다. 
- 사용자 아이디와 접근 경로를 저장하며, `NOT NULL` 제약 조건을 부여합니다.

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

#### 1.1.2. AccessHistoryService 클래스

- 접근 경로와 사용자 아이디를 전달 받아서 이를 저장합니다.
- `save` 메소드 호출을 `try-catch` 블록으로 감싸서 발생한 예외를 핸들링합니다.
    - 에러 로그를 출력하고 해당 로직을 종료합니다.
- `@Transactional` 애너테이션을 통해 n 개의 접근 이력 `insert` 로직을 하나의 트랜잭션으로 처리합니다. 
    - n 번의 `save` 메소드 호출 중 하나라도 실패하면 이전 `insert` 쿼리를 모두 롤백합니다. 

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

해당 로직은 정상적으로 트랜잭션 처리가 되므로 n 번의 `save` 메소드 호출 중 하나라도 실패하면 이전 모두 롤백 처리합니다. 
`createAccessHistories` 메소드 내부에서 예외를 처리했기 때문에 외부까지 `exception`이 전파되지 않을 줄 알았지만, 
실제론 컨트롤러(controller)의 예외 핸들러(exception handler)까지 전파되었습니다. 

#### 1.2.1. 테스트 코드

간단한 테스트 코드를 통해 예외 발생과 롤백 여부를 확인해보겠습니다.
- 내부에서 `save` 메소드 호출 시 예외가 발생할 수 있도록 `paths` 리스트에 `null` 값을 중간에 추가합니다.
- `createAccessHistories` 메소드 호출 시 `UnexpectedRollbackException`를 던질 것으로 예상합니다.
- `createAccessHistories` 메소드 호출 시 발생한 `throwable` 객체의 스택 트레이스를 확인합니다. 
- `count` 메소드를 호출하여 모두 롤백되어 테이블의 데이터가 0건인지 확인합니다. 

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

#### 1.2.2. 테스트 실행 결과 및 로그 확인

##### 테스트 실행 결과

- 예상했던 `UnexpectedRollbackException` 예외가 발생합니다.
- `exception` 발생으로 이전 쿼리가 롤백되어 확인한 테이블에 저장된 데이터는 0건입니다.

<p align="left">
    <img src="/images/unexpected-rollback-exception-1.JPG" width="80%" class="image__border">
</p>

##### 에러 로그

- 첫 `save` 메소드는 정상적으로 동작합니다.
- not-null property references a null or transient value : blog.in.action.history.AccessHistoryEntity.accessPath
    - `NOT NULL`을 예상한 `AccessHistoryEntity` 객체의 `accessPath` 필드에 `NULL` 값이 삽입되어 에러가 발생합니다. 

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

`@Transactional` 애너테이션이 붙은 메소드는 트랜잭션 처리를 위한 AOP 로직이 메소드 앞, 뒤로 추가됩니다. 
마찬가지로 `createAccessHistories` 메소드도 `@Transactional` 애너테이션으로 인해 AOP 로직이 추가되는데, 마지막 커밋(commit)을 진행하는 과정에서 예상치 않은 롤백이 있었다는 예외를 던지게 됩니다.  

##### 에러 로그를 통한 힌트 확인
- 위 테스트 수행 로그를 보고, 예외가 발생한 지점을 통해 힌트를 얻을 수 있습니다. 
- `createAccessHistories` 메소드를 호출하고, `AbstractPlatformTransactionManager` 클래스의 `processCommit` 메소드를 실행하는 과정에서 `UnexpectedRollbackException` 예외가 발생합니다.

```
org.springframework.transaction.UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only
    at org.springframework.transaction.support.AbstractPlatformTransactionManager.processCommit(AbstractPlatformTransactionManager.java:752)
    at org.springframework.transaction.support.AbstractPlatformTransactionManager.commit(AbstractPlatformTransactionManager.java:711)
    at org.springframework.transaction.interceptor.TransactionAspectSupport.commitTransactionAfterReturning(TransactionAspectSupport.java:654)
    ...
    at blog.in.action.history.AccessHistoryService$$EnhancerBySpringCGLIB$$a017440d.createAccessHistories(<generated>)
```

##### 미흡한 예외 처리로 인한 Exception 전파 과정

다음과 같은 과정을 통해 `exception`이 컨트롤러의 예외 핸들러까지 전파되었습니다.

1. 하이버네이트 내부에서 NULL 여부를 체크하는 과정에서 `PropertyValueException` 발생
1. `save` 메소드의 트랜잭션 AOP 로직에서 rollbackonly 마크 처리
1. `createAccessHistories` 메소드에서 발생한 예외에 대한 에러 메시지 로깅 후 종료
1. `createAccessHistories` 메소드 트랜잭션 AOP 로직의 커밋 과정에서 이미 롤백된 것을 보고 `UnexpectedRollbackException` 발생
1. `createAccessHistories` 메소드를 호출 시 별도의 예외 처리 부재로 인한 `exception` 전파
1. 컨트롤러의 예외 핸들러까지 `exception` 전파

<p align="center">
    <img src="/images/unexpected-rollback-exception-2.JPG" width="100%" class="image__border">
</p>

## 3. 해결 방법

해결 방법은 단순합니다. 
`@Transactional` 애너테이션이 붙은 메소드 외부에서 예외 핸들링을 수행합니다. 
이번 케이스의 경우 `createAccessHistories` 메소드 호출 지점들을 `try-catch` 블록으로 감싸지 않고, 
`JpaRepository` 인터페이스의 `saveAll` 메소드에 이미 `@Transactional` 애너테이션이 붙어있음을 이용하여 내부 로직을 변경하였습니다. 

### 3.1. AccessHistoryService 클래스 createAccessHistories 메소드 수정

- `@Transactional` 애너테이션을 제거합니다.
- `saveAll` 메소드로 `AccessHistoryEntity` 객체들을 저장하는 로직을 하나의 트랜잭션으로 묶습니다.

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

- `paths` 리스트 중간에 `null`을 전달하여 에러를 유발합니다.
- 별도의 예외가 발생하지 않으므로 `assertThrows`를 수행하지 않습니다.
- `createAccessHistories` 메소드를 호출 후 정상적으로 롤백 되었는지 `count` 메소드를 통해 확인합니다.

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

## CLOSE

당시엔 작성된 단위 테스트들이 모두 통과해서 별 생각없이 코드를 올렸는데, 개발계 데이터베이스 작업은 미흡한 상태여서 개발계 배포 후 이런 버그를 발견했습니다. 
에러 현상을 확인 후 조치하면서 이런 생각이 들었습니다. 
- 이런 케이스를 커버할 수 있는 단위 테스트를 작성할 수 있을까?
- 단위 테스트로 커버할 수 없는 상황을 대비하여 로컬에서 동작시킨 후 코드를 올리는 습관을 가지자.
- JPA 트랜잭션 처리와 관련된 글들을 작성하면서 많은 공부를 했지만, 아직 갈 길이 멀구나.

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-06-19-unexpected-rollback-exception>

[transactional-propagation-type-link]: https://junhyunny.github.io/spring-boot/jpa/junit/transactional-propagation-type/