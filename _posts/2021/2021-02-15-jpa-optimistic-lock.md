---
title: "Optimistic Lock in JPA"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-08-22T03:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Lock Mechanism][lock-mechanism-link]
* [Propagation in @Transactional Annotation][transactional-propagation-type-link]
* [@Import, @ImportAutoConfiguration 애너테이션][import-auto-configuration-annotation-link]

## 0. 들어가면서

낙관적인 락(optimistic lock) 개념을 다시 정리 후 글을 이어가겠습니다. 

> 낙관적인 락(optimistic lock)<br/>
> 트랜잭션 충돌이 발생하지 않는다고 가정한 낙관적인 락 방식입니다. 
> 트랜잭션 충돌에 대한 감지는 조회한 데이터의 버전(version)을 통해 이루어집니다. 

## 1. How to use optimistic lock in JPA?

`JPA`에서 낙관적인 락을 어떤 방식으로 제공하는지 살펴보겠습니다. 

### 1.1. LockModeType

락 모드를 지정하는 방식으로 낙관적인 락 기능을 사용할 수 있습니다. 
다음과 같은 방식이 존재합니다.

* `LockModeType.OPTIMISTIC`
    * `LockModeType.READ` 옵션과 동일합니다.
    * 해당 옵션으로 조회된 엔티티가 변경되면 업데이트 시점에 버전 값이 증가합니다.
    * 해당 옵션으로 조회된 엔티티의 변경이 없다면 버전 값은 증가하지 않습니다.
* `LockModeType.OPTIMISTIC_FORCE_INCREMENT`
    * `LockModeType.WRITE` 옵션과 동일합니다.
    * 해당 옵션으로 조회된 엔티티가 변경되면 업데이트 시점에 버전 값이 증가합니다.
    * 해당 옵션으로 조회된 엔티티의 변경이 없더라도 버전 값이 증가합니다.
    * 엔티티의 변경이 있다면 버전 값은 2 증가합니다.
    * 엔티티의 변경이 없다면 버전 값은 1 증가합니다.
    * 해당 옵션은 조회만으로 다른 트랜잭션의 변경을 방지합니다.

### 1.2. @Version Annotation

엔티티(entity) 필드에 버전 정보임을 알려주는 `@Version` 애너테이션을 붙힙니다. 
`@Version` 애너테이션이 붙은 필드를 가진 엔티티는 자동으로 낙관적인 락이 적용됩니다. 
버전으로 사용할 수 있는 타입은 int, Integer, long, Long, short, Short, java.sql.Timestamp 등이 있습니다. 

```java
package blog.in.action.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private String title;
    private String contents;
    @Version
    private Long versionNo;
}
```

## 2. Practice

다음은 낙관적인 락 기능 동작을 확인하기 위한 테스트 코드입니다. 
서로 다른 트랜잭션이 짧은 시간 차이로 동일한 데이터를 업데이트합니다. 
업데이트가 나중에 처리되는 트랜잭션은 실패 예외를 던집니다. 

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
    * 내용를 변경합니다.
    * 0.5초 대기합니다.
    * 오염 감지(dirty check)를 통해 변경 사항이 업데이트됩니다.
* `트랜잭션2`는 다음과 같은 작업을 수행합니다.
    * 제목이 `Hello World`인 포스트 엔티티를 찾습니다.
    * 내용를 변경합니다.
    * 1초 대기합니다.
    * 오염 감지를 통해 변경 사항이 업데이트됩니다.
* `트랜잭션2` 처리 과정에서 예외가 발생하는 것을 예상합니다.
    * 해당 예외의 원인은 `ObjectOptimisticLockingFailureException` 입니다.
* 포스트 엔티티는 커밋을 성공한 `트랜잭션1`의 업데이트 모습일 것으로 예상합니다.
* 포스트 엔티티의 버전 값이 1만큼 증가 하였음을 예상합니다.

```java
package blog.in.action;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Component;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.CompletableFuture;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.instanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;

interface PostRepository extends JpaRepository<Post, Long> {

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
    public void optimistic_lock_with_repository() {
        CompletableFuture<Void> tx = CompletableFuture.runAsync(() -> asyncTransaction.run(() -> {
            Post post = postRepository.findByTitle("Hello World");
            post.setContents("This is tx1.");
            sleep(500);
        }));
        Throwable throwable = assertThrows(Exception.class, () -> {
            CompletableFuture.runAsync(() -> asyncTransaction.run(() -> {
                Post post = postRepository.findByTitle("Hello World");
                post.setContents("This is tx2.");
                sleep(1000);
            })).join();
        });
        tx.join();


        Post post = postRepository.findByTitle("Hello World");
        assertThat(post.getContents(), equalTo("This is tx1."));
        assertThat(post.getVersionNo(), equalTo(1L));
        assertThat(throwable.getCause(), instanceOf(ObjectOptimisticLockingFailureException.class));
    }
}
```

##### Test Result

* 제목으로 조회하는 쿼리
    * `where post0_.title=?`
    * `트랜잭션1`, `트랜잭션2`가 제목으로 포스트 엔티티를 조회합니다.
* 아이디로 조회하는 쿼리 
    * `where post0_.id=?`
    * 현재 엔티티의 버전을 확인하기 위한 조회 쿼리로 예상됩니다.
* 업데이트 쿼리 
    * `update post set contents=?, title=?, version_no=? where id=? and version_no=?` 
    * 버전이 일치하는 경우 업데이트를 수행합니다.
    * `WHERE` 절에 버전 정보를 확인하는 조건이 존재합니다.
    * 업데이트 쿼리가 1회 실행된 것으로 보아 `트랜잭션2`는 엔티티 버전이 달라 업데이트를 시도하지 않은 것으로 예상됩니다.
* 제목으로 조회하는 쿼리
    * `where post0_.title=?`
    * 검증(assert)을 위한 조회 쿼리가 수행됩니다.

```
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_, post0_.version_no as version_4_0_ from post post0_ where post0_.title=?
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_, post0_.version_no as version_4_0_ from post post0_ where post0_.title=?
Hibernate: select post0_.id as id1_0_0_, post0_.contents as contents2_0_0_, post0_.title as title3_0_0_, post0_.version_no as version_4_0_0_ from post post0_ where post0_.id=?
Hibernate: update post set contents=?, title=?, version_no=? where id=? and version_no=?
Hibernate: select post0_.id as id1_0_0_, post0_.contents as contents2_0_0_, post0_.title as title3_0_0_, post0_.version_no as version_4_0_0_ from post post0_ where post0_.id=?
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_, post0_.version_no as version_4_0_ from post post0_ where post0_.title=?
```

### 2.2. Use EntityManager

다음 `EntityManager`를 사용한 테스트입니다. 
위 테스트와 마찬가지로 각기 다른 트랜잭션을 만들어 실행하고 이를 커밋합니다. 
이를 통해 잠깐의 시간 차이가 발생하는 두 개의 트랜잭션을 실행합니다. 
각 모드 별로 테스트 코드와 결과를 살펴보겠습니다. 

#### 2.2.1. LockModeType.OPTIMISTIC

* 테스트 실행 전 데이터 버전 값을 초기화합니다. 
* `트랜잭션1`는 다음과 같은 작업을 수행합니다.
    * 제목(title)이 `Hello World`인 포스트(post) 엔티티를 찾습니다.
    * 내용를 변경합니다.
    * 0.5초 대기합니다.
    * 오염 감지를 통해 변경 사항이 업데이트됩니다.
* `트랜잭션2`는 다음과 같은 작업을 수행합니다.
    * 제목이 `Hello World`인 포스트 엔티티를 찾습니다.
    * 내용를 변경합니다.
    * 1초 대기합니다.
    * 오염 감지를 통해 변경 사항이 업데이트됩니다.
* `트랜잭션2` 처리 과정에서 예외가 발생하는 것을 예상합니다.
    * 해당 예외의 원인은 `RollbackException` 입니다.
    * `RollbackException` 예외의 원인은 `OptimisticLockException` 입니다.
* 포스트 엔티티는 커밋을 성공한 `트랜잭션1`의 업데이트 모습일 것으로 예상합니다.
* 포스트 엔티티의 버전 값이 1만큼 증가 하였음을 예상합니다.

```java
package blog.in.action;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import javax.persistence.*;
import java.util.concurrent.CompletableFuture;
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

    @BeforeEach
    public void beforeEach() {
        EntityManager entityManager = factory.createEntityManager();
        EntityTransaction transaction = entityManager.getTransaction();
        transaction.begin();
        entityManager.createQuery("update Post p set p.versionNo = 0 where p.id = 1").executeUpdate();
        transaction.commit();
    }

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
    public void optimistic_lock_with_entity_manager() {
        CompletableFuture<Void> tx = transactionAsyncWithCommit(entityManager -> {
            TypedQuery<Post> typedQuery = entityManager.createQuery(selectQuery, Post.class);
            typedQuery.setLockMode(LockModeType.OPTIMISTIC);
            Post post = typedQuery.getSingleResult();
            post.setContents("This is optimistic tx1.");
            sleep(500);
        });
        Throwable throwable = assertThrows(Exception.class, () -> {
            transactionAsyncWithCommit(entityManager -> {
                TypedQuery<Post> typedQuery = entityManager.createQuery(selectQuery, Post.class);
                typedQuery.setLockMode(LockModeType.OPTIMISTIC);
                Post post = typedQuery.getSingleResult();
                post.setContents("This is optimistic tx2.");
                sleep(1000);
            }).join();
        });
        tx.join();


        Throwable cause = throwable.getCause();
        EntityManager entityManager = factory.createEntityManager();
        Post result = entityManager.createQuery(selectQuery, Post.class).getSingleResult();
        assertThat(result.getContents(), equalTo("This is optimistic tx1."));
        assertThat(result.getVersionNo(), equalTo(1L));
        assertThat(cause, instanceOf(RollbackException.class));
        assertThat(cause.getCause(), instanceOf(OptimisticLockException.class));
    }
}
```

##### Test Result

* 버전 값을 0으로 업데이트하는 쿼리
    * `update post set version_no=0 where id=1`
    * 테스트를 위해 데이터의 버전 값을 0으로 초기화합니다.
* 제목으로 조회하는 쿼리
    * `where post0_.title=?`
    * `트랜잭션1`, `트랜잭션2`가 제목으로 포스트 엔티티를 조회합니다.
* 업데이트 쿼리 
    * `update post set contents=?, title=?, version_no=? where id=? and version_no=?` 
    * 버전이 일치하는 경우 업데이트를 수행합니다.
    * `WHERE` 절에 버전 정보를 확인하는 조건이 존재합니다.
* 버전 정보만 조회하는 쿼리
    * `select version_no as version_ from post where id =?`
    * 업데이트 이후 엔티티의 버전을 확인하려는 것으로 예상됩니다. 
    * 해당 쿼리가 1회 실행된 것으로 보아 `트랜잭션2`는 업데이트에 실패하여 버전 조회를 시도하지 않은 것으로 예상됩니다.
* 제목으로 조회하는 쿼리
    * `where post0_.title=?`
    * 검증을 위한 조회 쿼리가 수행됩니다.

```
Hibernate: update post set version_no=0 where id=1
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_, post0_.version_no as version_4_0_ from post post0_ where post0_.title='Hello World'
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_, post0_.version_no as version_4_0_ from post post0_ where post0_.title='Hello World'
Hibernate: update post set contents=?, title=?, version_no=? where id=? and version_no=?
Hibernate: select version_no as version_ from post where id =?
Hibernate: update post set contents=?, title=?, version_no=? where id=? and version_no=?
2023-01-29 13:24:45.058  INFO 16124 --- [onPool-worker-2] o.h.e.j.b.internal.AbstractBatchImpl     : HHH000010: On release of batch it still contained JDBC statements
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_, post0_.version_no as version_4_0_ from post post0_ where post0_.title='Hello World'
```

#### 2.2.2. LockModeType.OPTIMISTIC_FORCE_INCREMENT

* `OPTIMISTIC` 모드 테스트와 결과가 동일하지만, 증가한 버전 값이 다릅니다. 
* 버전 값이 2만큼 증가 하였음을 예상합니다.
    * 오염 감지를 통해 업데이트가 수행되면서 버전 값이 증가합니다.
    * `OPTIMISTIC_FORCE_INCREMENT` 모드이므로 별도로 버전 값을 증가시킵니다.

```java
    @Test
    public void optimistic_force_increment_lock_with_entity_manager() {
        CompletableFuture<Void> tx = transactionAsyncWithCommit(entityManager -> {
            TypedQuery<Post> typedQuery = entityManager.createQuery(selectQuery, Post.class);
            typedQuery.setLockMode(LockModeType.OPTIMISTIC_FORCE_INCREMENT);
            Post post = typedQuery.getSingleResult();
            post.setContents("This is optimistic force increment tx1.");
            sleep(500);
        });
        Throwable throwable = assertThrows(Exception.class, () -> {
            transactionAsyncWithCommit(entityManager -> {
                TypedQuery<Post> typedQuery = entityManager.createQuery(selectQuery, Post.class);
                typedQuery.setLockMode(LockModeType.OPTIMISTIC_FORCE_INCREMENT);
                Post post = typedQuery.getSingleResult();
                post.setContents("This is optimistic force increment tx2.");
                sleep(1000);
            }).join();
        });
        tx.join();


        Throwable cause = throwable.getCause();
        EntityManager entityManager = factory.createEntityManager();
        Post result = entityManager.createQuery(selectQuery, Post.class).getSingleResult();
        assertThat(result.getContents(), equalTo("This is optimistic force increment tx1."));
        assertThat(result.getVersionNo(), equalTo(2L));
        assertThat(cause, instanceOf(RollbackException.class));
        assertThat(cause.getCause(), instanceOf(OptimisticLockException.class));
    }
```

##### Test Result

* 버전 값을 0으로 업데이트하는 쿼리
    * `update post set version_no=0 where id=1`
    * 테스트를 위해 데이터의 버전 값을 0으로 초기화합니다.
* 제목으로 조회하는 쿼리
    * `where post0_.title=?`
    * `트랜잭션1`, `트랜잭션2`가 제목으로 포스트 엔티티를 조회합니다.
* 업데이트 쿼리 
    * `update post set contents=?, title=?, version_no=? where id=? and version_no=?` 
    * 버전이 일치하는 경우 업데이트를 수행합니다.
    * `WHERE` 절에 버전 정보를 확인하는 조건이 존재합니다.
* 버전 정보만 조회하는 쿼리
    * `select version_no as version_ from post where id =?`
    * 업데이트 이후 엔티티의 버전을 확인하려는 것으로 예상됩니다. 
    * 해당 쿼리가 1회 실행된 것으로 보아 `트랜잭션2`는 업데이트에 실패하여 버전 조회를 시도하지 않은 것으로 예상됩니다.
* 제목으로 조회하는 쿼리
    * `where post0_.title=?`
    * 검증을 위한 조회 쿼리가 수행됩니다.

```
Hibernate: update post set version_no=0 where id=1
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_, post0_.version_no as version_4_0_ from post post0_ where post0_.title='Hello World'
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_, post0_.version_no as version_4_0_ from post post0_ where post0_.title='Hello World'
Hibernate: update post set contents=?, title=?, version_no=? where id=? and version_no=?
Hibernate: update post set version_no=? where id=? and version_no=?
Hibernate: update post set contents=?, title=?, version_no=? where id=? and version_no=?
2023-01-29 13:24:46.101  INFO 16124 --- [onPool-worker-1] o.h.e.j.b.internal.AbstractBatchImpl     : HHH000010: On release of batch it still contained JDBC statements
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_, post0_.version_no as version_4_0_ from post post0_ where post0_.title='Hello World'
```

## CLOSING

사실 락 모드를 설정하지 않아도 낙관적인 락 메커니즘이 잘 동작합니다. 
3.2 버전부터는 `@Version` 애너테이션만으로 낙관적인 락이 가능하다고 합니다. 

> 3.2 Version Attributes<br/><br/>
> The Version field or property is used by the persistence provider to perform optimistic locking. 
> It is accessed and/or set by the persistence provider in the course of performing lifecycle operations on the entity instance. 
> **An entity is automatically enabled for optimistic locking if it has a property or field mapped with a Version mapping.**

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-02-15-jpa-optimistic-lock>

#### RECOMMEND NEXT POSTS

* [Pessimistic Lock in JPA][jpa-pessimitic-lock-link]
* [Optimistic Lock in QueryDSL][optimistic-lock-in-query-dsl-link]

#### REFERENCE

* <https://www.baeldung.com/jpa-optimistic-locking>
* <https://www.logicbig.com/tutorials/java-ee-tutorial/jpa/optimistic-lock-force-increment-use-case.html>
* <https://vitriol95.github.io/posts/optimistic/>
* <https://stackoverflow.com/questions/13568475/jpa-and-default-locking-mode>
* <https://stackoverflow.com/questions/15293275/semantic-of-jpa-2-0-optimistic-force-increment>

[lock-mechanism-link]: https://junhyunny.github.io/information/lock-mechanism/
[transactional-propagation-type-link]: https://junhyunny.github.io/spring-boot/jpa/junit/transactional-propagation-type/
[import-auto-configuration-annotation-link]: https://junhyunny.github.io/spring-boot/import-auto-configuration-annotation/
[jpa-pessimitic-lock-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-pessimitic-lock/
[optimistic-lock-in-query-dsl-link]: https://junhyunny.github.io/java/spring-boot/query-dsl/jpa/optimistic-lock-in-query-dsl/