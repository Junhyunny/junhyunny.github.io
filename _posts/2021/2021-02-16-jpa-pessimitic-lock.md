---
title: "Pessimistic Lock in JPA"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-08-22T03:30:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [데이터베이스 락(Database Lock)][lock-mechanism-link]

## 0. 들어가면서

비관적인 락(pessimistic lock) 개념을 다시 정리 후 글을 이어가겠습니다. 

> 비관적인 락(pessimistic lock)<br/>
> 트랜잭션 충돌을 예상하고 미리 데이터에 대한 락을 선점하는 비관적인 락 방식입니다. 
> 비관적인 락은 특정 트랜잭션이 데이터에 대한 락을 선점하기 때문에 다른 트랜잭션들의 지연을 유발할 수 있습니다. 

## 1. How to use pessimistic lock in JPA?

### 1.1. LockModeType

잠금 모드를 지정하는 방식으로 비관적인 락 기능을 사용할 수 있습니다. 
다음과 같은 모드들이 존재합니다.

* `LockModeType.PESSIMISTIC_READ`
    * allows us to obtain a shared lock and prevent the data from being updated or deleted
    * `shared lock`이란 데이터 읽기 잠금이라고도 합니다.
    * `shared lock`이 걸린 데이터는 다른 트랜잭션들에서 읽는 것이 가능합니다. 
* `LockModeType.PESSIMISTIC_WRITE`
    * allows us to obtain an exclusive lock and prevent the data from being read, updated or deleted
    * `exclusive lock`이란 데이터를 변경할 때 사용합니다.
    * `exclusive lock`이 걸린 데이터는 해제될 때까지 다른 트랜잭션(읽기 포함)들에서 접근할 수 없습니다.
* `LockModeType.PESSIMISTIC_FORCE_INCREMENT`
    * works like PESSIMISTIC_WRITE and it additionally increments a version attribute of a versioned entity
    * `exclusive lock`과 동일하며 추가적으로 버전 자동 증가 수행합니다.

`PESSIMISTIC_READ`을 지원하지 않는 데이터베이스도 있지만, 그런 경우엔 `PESSIMISTIC_WRITE`으로 대체된다고 합니다. 
이번 포스트에선 `PESSIMISTIC_WRITE` 모드에 대해서만 다뤘습니다. 

### 1.2. @Lock Annotation

`spring-data-jpa` 라이브러리의 `JpaRepository` 인터페이스를 사용하는 경우 `@Lock` 애너테이션으로 잠금 모드를 설정합니다. 

```java
interface PostRepository extends JpaRepository<Post, Long> {

    @Lock(value = LockModeType.PESSIMISTIC_WRITE)
    Post findByTitle(String title);
}
```

## 2. Practice

다음은 비관적인 락 기능 동작을 확인하기 위한 테스트 코드입니다. 
먼저 한 트랜잭션이 데이터 조회와 동시에 락을 선점합니다. 
다른 트랜잭션은 락이 풀려 데이터를 조회할 수 있기를 기다립니다. 
긴 시간동안 데이터를 조회할 수 없다면 예외를 던집니다. 

테스트 코드를 잘 이해하기 위해선 다음과 같은 내용을 미리 알면 좋습니다. 

* `@Import` 애너테이션을 통한 빈(bean) 주입
* `@TestPropertySource` 애너테이션을 통한 테스트 환경 설정
* `@DataJpaTest` 애너테이션의 기본적인 트랜잭션 처리
* 전파 타입(propagation type)에 따른 트랜잭션 동작

테스트를 위한 데이터를 `data.sql` 파일에 준비합니다. 

```sql
insert into Post (ID, TITLE, CONTENTS, VERSION_NO) values (1, 'Hello World', 'This is new contents', 0);
```

### 2.1. Use JpaRepository Interface

먼저 `JpaRepository` 인터페이스를 사용한 테스트입니다. 
`AsyncTransaction` 빈을 사용해 테스트에 필요한 새로운 비동기 트랜잭션을 생성합니다. 
`Propagation.REQUIRES_NEW` 속성을 지정하여 진행 중인 트랜잭션을 잠시 멈추고 새로운 트랜잭션을 만들어 냅니다. 
이를 통해 잠깐의 시간 차이가 발생하는 두 개의 트랜잭션을 실행합니다.

* `트랜잭션1`는 다음과 같은 작업을 수행합니다.
    * 제목(title)이 `Hello World`인 포스트(post) 엔티티를 찾습니다.
    * 데이터 조회만으로 데이터 락을 점유합니다.
    * 내용를 변경합니다.
    * 7초 대기합니다.
    * 오염 감지(dirty check)를 통해 변경 사항이 업데이트됩니다.
* `트랜잭션2`는 다음과 같은 작업을 수행합니다.
    * 제목이 `Hello World`인 포스트 엔티티를 찾습니다.
    * 내용를 변경합니다.
* `트랜잭션2` 처리 과정에서 예외가 발생하는 것을 예상합니다.
    * 다른 트랜잭션에 락이 걸린 데이터를 조회하지 못하고 타임아웃(timeout) 예외가 발생합니다.
    * `CompletionException` 예외가 발생합니다.
    * `CompletionException` 예외의 원인은 `PessimisticLockingFailureException`입니다.
    * `PessimisticLockingFailureException` 예외의 원인은 `PessimisticLockException`입니다.
    * `PessimisticLockException` 예외의 원인은 `JdbcSQLTimeoutException`입니다.
* 포스트 엔티티는 커밋을 성공한 `트랜잭션1`의 업데이트 모습일 것으로 예상합니다.

```java
package blog.in.action;

import lombok.extern.log4j.Log4j2;
import org.h2.jdbc.JdbcSQLTimeoutException;
import org.hibernate.PessimisticLockException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Component;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.LockModeType;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.instanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;

interface PostRepository extends JpaRepository<Post, Long> {

    @Lock(value = LockModeType.PESSIMISTIC_WRITE)
    Post findByTitle(String title);
}

@Component
class AsyncTransaction {

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void run(Runnable runnable) {
        runnable.run();
    }
}

@Log4j2
@Import(AsyncTransaction.class)
@DataJpaTest
@TestPropertySource(
        properties = {
                "spring.sql.init.mode=embedded",
                "spring.sql.init.schema-locations=classpath:db/schema.sql",
                "spring.sql.init.data-locations=classpath:db/data.sql",
                "spring.jpa.defer-datasource-initialization=true"
        }
)
public class RepositoryTest {

    @Autowired
    private AsyncTransaction asyncTransaction;
    @Autowired
    private PostRepository postRepository;

    void sleep(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    public void pessimistic_lock_with_repository() {
        CompletableFuture<Void> tx = CompletableFuture.runAsync(() -> asyncTransaction.run(() -> {
            Post post = postRepository.findByTitle("Hello World");
            post.setContents("This is tx1.");
            log.info("This is tx1 before sleep");
            sleep(7000);
            log.info("This is tx1 after sleep");
        }));
        sleep(500);
        Throwable throwable = assertThrows(Exception.class, () -> {
            CompletableFuture.runAsync(() -> asyncTransaction.run(() -> {
                Post post = postRepository.findByTitle("Hello World");
                post.setContents("This is tx2.");
                log.info("This is tx2");
            })).join();
        });
        tx.join();


        Throwable pessimisticLockingFailure = throwable.getCause();
        Throwable pessimisticLock = pessimisticLockingFailure.getCause();
        Throwable jdbcSQLTimeout = pessimisticLock.getCause();
        Post result = postRepository.findByTitle("Hello World");

        assertThat(throwable, instanceOf(CompletionException.class));
        assertThat(pessimisticLockingFailure, instanceOf(PessimisticLockingFailureException.class));
        assertThat(pessimisticLock, instanceOf(PessimisticLockException.class));
        assertThat(jdbcSQLTimeout, instanceOf(JdbcSQLTimeoutException.class));
        assertThat(result.getContents(), equalTo("This is tx1."));
    }
}
```

##### Test Result

* 제목으로 조회하는 쿼리
    * `where post0_.title=? for update`
    * `트랜잭션1`, `트랜잭션2`가 제목으로 포스트 엔티티를 조회합니다.
    * 데이터 조회와 동시에 데이터에 락을 설정합니다.
    * 늦게 시작한 `트랜잭션2`는 락이 풀려 조회가 가능해지길 기다립니다.
* 타임아웃 에러
    * Timeout trying to lock table {0}; SQL statement: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_ from post post0_ where post0_.title=? for update [50200-214]
    * 데이터 조회를 위해 대기하는 중 시간이 초과되어 타임아웃 예외가 발생합니다.
    * 해당 예외는 `트랜잭션2`에서 발생한 것으로 예상합니다.
* 업데이트 쿼리 
    * `트랜잭션1`은 7초 대기 후에 업데이트를 수행합니다.
    * `This is tx1 before sleep`, `This is tx1 after sleep` 로그 사이의 시간 차이는 약 7초입니다.
* 제목으로 조회하는 쿼리
    * `where post0_.title=? for update`
    * 검증을 위한 조회 쿼리가 수행됩니다.

```
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_ from post post0_ where post0_.title=? for update
2023-01-29 18:10:12.721  INFO 17396 --- [onPool-worker-1] blog.in.action.RepositoryTest            : This is tx1 before sleep
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_ from post post0_ where post0_.title=? for update
2023-01-29 18:10:17.088  WARN 17396 --- [onPool-worker-2] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Error: 50200, SQLState: HYT00
2023-01-29 18:10:17.089 ERROR 17396 --- [onPool-worker-2] o.h.engine.jdbc.spi.SqlExceptionHelper   : Timeout trying to lock table {0}; SQL statement:
select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_ from post post0_ where post0_.title=? for update [50200-214]
2023-01-29 18:10:19.729  INFO 17396 --- [onPool-worker-1] blog.in.action.RepositoryTest            : This is tx1 after sleep
Hibernate: update post set contents=?, title=? where id=?
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_ from post post0_ where post0_.title=? for update
```

### 2.2. Use EntityManager

다음 `EntityManager`를 사용한 테스트입니다. 
위 테스트와 마찬가지로 각기 다른 트랜잭션을 만들어 실행하고 이를 커밋합니다. 

* `트랜잭션1`는 다음과 같은 작업을 수행합니다.
    * 제목이 `Hello World`인 포스트 엔티티를 찾습니다.
    * 데이터 조회만으로 데이터 락을 점유합니다.
    * 내용를 변경합니다.
    * 7초 대기합니다.
    * 오염 감지를 통해 변경 사항이 업데이트됩니다.
* `트랜잭션2`는 다음과 같은 작업을 수행합니다.
    * 제목이 `Hello World`인 포스트 엔티티를 찾습니다.
    * 내용를 변경합니다.
* `트랜잭션2` 처리 과정에서 예외가 발생하는 것을 예상합니다.
    * 다른 트랜잭션에 락이 걸린 데이터를 조회하지 못하고 타임아웃(timeout) 예외가 발생합니다.
    * `CompletionException` 예외가 발생합니다.
    * `CompletionException` 예외의 원인은 `PessimisticLockException`입니다.
    * `PessimisticLockException` 예외의 원인은 `org.hibernate.PessimisticLockException`입니다.
    * `org.hibernate.PessimisticLockException` 예외의 원인은 `JdbcSQLTimeoutException`입니다.
* 포스트 엔티티는 커밋을 성공한 `트랜잭션1`의 업데이트 모습일 것으로 예상합니다.

```java
package blog.in.action;

import lombok.extern.log4j.Log4j2;
import org.h2.jdbc.JdbcSQLTimeoutException;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import javax.persistence.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.function.Consumer;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.instanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;

@Log4j2
@DataJpaTest
@TestPropertySource(
        properties = {
                "spring.sql.init.mode=embedded",
                "spring.sql.init.schema-locations=classpath:db/schema.sql",
                "spring.sql.init.data-locations=classpath:db/data.sql",
                "spring.jpa.defer-datasource-initialization=true"
        }
)
public class EntityManagerTest {

    String selectQuery = "select p from Post p where p.title= 'Hello World'";

    @PersistenceUnit
    EntityManagerFactory factory;

    CompletableFuture<Void> transactionAsyncWithCommit(Consumer<EntityManager> consumer) {
        return CompletableFuture.runAsync(() -> {
            EntityManager entityManager = factory.createEntityManager();
            EntityTransaction transaction = entityManager.getTransaction();
            transaction.begin();
            try {
                consumer.accept(entityManager);
            } catch (Exception ex) {
                throw ex;
            } finally {
                transaction.commit();
                entityManager.close();
            }
        });
    }

    void sleep(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    public void pessimistic_lock_with_entity_manager() {
        CompletableFuture<Void> tx = transactionAsyncWithCommit(entityManager -> {
            TypedQuery<Post> typedQuery = entityManager.createQuery(selectQuery, Post.class);
            typedQuery.setLockMode(LockModeType.PESSIMISTIC_WRITE);
            Post post = typedQuery.getSingleResult();
            post.setContents("This is pessimistic tx1.");
            log.info("This is tx1 before sleep");
            sleep(7000);
            log.info("This is tx1 after sleep");
        });
        sleep(500);
        Throwable throwable = assertThrows(Exception.class, () -> {
            transactionAsyncWithCommit(entityManager -> {
                TypedQuery<Post> typedQuery = entityManager.createQuery(selectQuery, Post.class);
                typedQuery.setLockMode(LockModeType.PESSIMISTIC_WRITE);
                Post post = typedQuery.getSingleResult();
                post.setContents("This is pessimistic tx2.");
                log.info("This is tx2");
            }).join();
        });
        tx.join();


        Throwable pessimisticLock = throwable.getCause();
        Throwable hibernatePessimisticLock = pessimisticLock.getCause();
        Throwable jdbcSQLTimeout = hibernatePessimisticLock.getCause();
        EntityManager entityManager = factory.createEntityManager();
        Post result = entityManager.createQuery(selectQuery, Post.class).getSingleResult();

        assertThat(throwable, instanceOf(CompletionException.class));
        assertThat(pessimisticLock, instanceOf(PessimisticLockException.class));
        assertThat(hibernatePessimisticLock, instanceOf(org.hibernate.PessimisticLockException.class));
        assertThat(jdbcSQLTimeout, instanceOf(JdbcSQLTimeoutException.class));
        assertThat(result.getContents(), equalTo("This is pessimistic tx1."));
    }
}
```

##### Test Result

* 제목으로 조회하는 쿼리
    * `where post0_.title='Hello World' for update`
    * `트랜잭션1`, `트랜잭션2`가 제목으로 포스트 엔티티를 조회합니다.
    * 데이터 조회와 동시에 데이터에 락을 설정합니다.
    * 늦게 시작한 `트랜잭션2`는 락이 풀려 조회가 가능해지길 기다립니다.
* 타임아웃 에러
    * Timeout trying to lock table {0}; SQL statement: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_ from post post0_ where post0_.title='Hello World' for update [50200-214]
    * 데이터 조회를 위해 대기하는 중 시간이 초과되어 타임아웃 예외가 발생합니다.
    * 해당 예외는 `트랜잭션2`에서 발생한 것으로 예상합니다.
* 업데이트 쿼리 
    * `update post set contents=?, title=? where id=?`
    * `트랜잭션1`은 7초 대기 후에 업데이트를 수행합니다.
    * `This is tx1 before sleep`, `This is tx1 after sleep` 로그의 시간 차이는 약 7초입니다.
* 제목으로 조회하는 쿼리
    * `where post0_.title='Hello World`
    * 검증을 위한 조회 쿼리가 수행됩니다.

```
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_ from post post0_ where post0_.title='Hello World' for update
2023-01-29 20:01:44.852  INFO 6236 --- [onPool-worker-1] blog.in.action.EntityManagerTest         : This is tx1 before sleep
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_ from post post0_ where post0_.title='Hello World' for update
2023-01-29 20:01:49.293  WARN 6236 --- [onPool-worker-2] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Error: 50200, SQLState: HYT00
2023-01-29 20:01:49.293 ERROR 6236 --- [onPool-worker-2] o.h.engine.jdbc.spi.SqlExceptionHelper   : Timeout trying to lock table {0}; SQL statement:
select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_ from post post0_ where post0_.title='Hello World' for update [50200-214]
2023-01-29 20:01:51.859  INFO 6236 --- [onPool-worker-1] blog.in.action.EntityManagerTest         : This is tx1 after sleep
Hibernate: update post set contents=?, title=? where id=?
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_ from post post0_ where post0_.title='Hello World'
```

## CLOSING

##### Error when use JpaRepository Interface

비관적 락 모드는 JPA 트랜잭션 중에만 사용 가능합니다. 
`JpaRepository` 인터페이스를 사용하는 경우 직접 트랜잭션 제어가 안 되기 때문에 `@Transactional` 애너테이션을 사용합니다. 
적절한 서비스 빈(bean)을 만들고 필요한 기능들을 하나의 트랜잭션으로 묶는 작업이 필요합니다. 
만일 트랜잭션을 시작하지 않고, 해당 메소드를 사용하면 다음과 같은 에러를 만나게 됩니다. 

```
org.springframework.dao.InvalidDataAccessApiUsageException: no transaction is in progress; nested exception is javax.persistence.TransactionRequiredException: no transaction is in progress
    at org.springframework.orm.jpa.EntityManagerFactoryUtils.convertJpaAccessExceptionIfPossible(EntityManagerFactoryUtils.java:403) ~[spring-orm-5.2.4.RELEASE.jar:5.2.4.RELEASE]
    at org.springframework.orm.jpa.vendor.HibernateJpaDialect.translateExceptionIfPossible(HibernateJpaDialect.java:257) ~[spring-orm-5.2.4.RELEASE.jar:5.2.4.RELEASE]
    at org.springframework.orm.jpa.AbstractEntityManagerFactoryBean.translateExceptionIfPossible(AbstractEntityManagerFactoryBean.java:528) ~[spring-orm-5.2.4.RELEASE.jar:5.2.4.RELEASE]
    at org.springframework.dao.support.ChainedPersistenceExceptionTranslator.translateExceptionIfPossible(ChainedPersistenceExceptionTranslator.java:61) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]
    at org.springframework.dao.support.DataAccessUtils.translateIfNecessary(DataAccessUtils.java:242) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]
    ...
```

##### Performance Issue

비관적인 락 기능을 사용한 동시성 제어의 문제점은 스레드 대기로 인한 성능 지연이라고 생각합니다. 
락을 선점한 트랜잭션이 길어지는 경우 해당 락이 풀리길 기다리는 트랜잭션들도 모두 함께 정지됩니다. 
타임아웃이나 데드락(deadlock)으로 인해 시스템 장애가 발생할 수 있습니다. 

이런 문제를 해결하기 위해 락 점유를 위해 일정 시간 대기하고, 점유하지 못하면 해당 트랜잭션을 실패 처리할 필요가 있습니다. 
`SELECT - FOR UPDATE WAIT #{waitTime}` 같은 쿼리를 수행하면 락 점유를 위해 일정 시간만 대기하고, 실패 시 예외를 던집니다. 
데이터베이스에 따라 해당 기능을 지원하지 않을 수 있습니다. 

`JPA`는 타임아웃 설정을 지원하지만, 해당 기능에 대한 테스트는 이번 포스트에서 다루지 않았습니다. 
간단하게 사용 방법만 정리하고 이번 포스트를 마무리하겠습니다. 

##### @QueryHints Annotations for JpaRepository

```java
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({@QueryHint(name = "javax.persistence.lock.timeout", value ="5000")})
    Optional<Post> findById(Long id)
```

##### Properties Map for EntityManager

```java
   Map<String,Object> properties = new HashMap();
   properties.put("javax.persistence.query.timeout", 5000);
   EntityManager entityManager = entityManagerFactory.createEntityManager(properties);
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-02-16-jpa-pessimitic-lock>

#### RECOMMEND NEXT POSTS

* [Optimistic Lock in JPA][jpa-optimistic-lock-link]

#### REFERENCE

* <https://www.baeldung.com/jpa-pessimistic-locking>
* <https://sabarada.tistory.com/121>
* <https://jeong-pro.tistory.com/94>
* <https://velog.io/@lsb156/JPA-Optimistic-Lock-Pessimistic-Lock>

[lock-mechanism-link]: https://junhyunny.github.io/information/database/database-lock/lock-mechanism/
[jpa-optimistic-lock-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-optimistic-lock/
