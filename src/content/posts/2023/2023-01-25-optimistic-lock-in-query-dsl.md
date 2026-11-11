---
title: "QueryDSL에서 낙관적 락 사용하기"
publishedAt: "2023-01-25"
updatedAt: "2026-11-11T23:23:42+09:00"
canonicalPath: "/java/spring-boot/query-dsl/jpa/optimistic-lock-in-query-dsl/"
categories:
  - "java"
  - "spring-boot"
  - "query-dsl"
  - "jpa"
summary: "낙관적 락이 자동으로 적용되지 않는 QueryDSL에서 락 타입 지정과 오염 확인, 업데이트 쿼리 결과 확인이라는 두 가지 방법으로 낙관적 락을 구현하고 고려 사항을 정리했다."
recommendedPosts:
  - title: "데이터베이스 락(Database Lock)"
    href: "https://junhyunny.github.io/information/database/database-lock/lock-mechanism/"
  - title: "JPA 낙관적 락(optimistic lock)"
    href: "https://junhyunny.github.io/spring-boot/jpa/junit/jpa-optimistic-lock/"
---

## 0. 들어가면서

JPA(java persistence api)는 `@Version` 애너테이션으로 낙관적 락(optimistic lock) 기능을 제공한다. `spring-data-jpa`는 `save` 메서드 하나로 추가(insert)와 업데이트(update)를 처리하고 내부에서 버전을 확인하기 때문에, 낙관적 락 기능을 쉽게 사용할 수 있다.

반면에 `QueryDSL`로 업데이트할 때는 낙관적 락이 자동으로 적용되지 않는다. 다음과 같은 방법으로 낙관적 락 기능을 사용할 수 있다.

- 조회 쿼리와 엔티티의 오염 확인(dirty check)
  - 조회 쿼리에 락 타입(lock type)을 지정한다.
  - 조회된 엔티티를 변경하고, 엔티티의 오염 여부를 확인하는 과정에서 업데이트가 수행된다.
  - 업데이트를 수행할 때 버전 정보를 증가시킨다.
  - 다른 트랜잭션(transaction)에 의해 업데이트됐다면 버전이 달라지므로 낙관적 락 예외를 발생시킨다.
- 업데이트 쿼리 사용
  - 업데이트 쿼리 조건에 버전 정보를 추가한다.
  - 업데이트에 실패하면 버전 정보를 제외한 조회 조건으로 엔티티를 탐색한다.
  - 엔티티가 존재하는데도 업데이트에 실패했다면 버전 차이로 인식하여 낙관적 락 예외를 발생시킨다.

## 1. Using LockType and Dirty Check

엔티티 오염 확인을 통한 업데이트에 낙관적 락을 적용하는 방법부터 알아보자. 다음과 같은 테스트를 수행한다.

- `트랜잭션-1`은 다음과 같이 동작한다.
  - 엔티티를 조회한다.
  - 엔티티 필드 값을 변경한다.
  - 1초 대기한다.
  - 트랜잭션 종료 시 버전 정보가 맞지 않음을 확인한다.
  - 다른 트랜잭션에 의해 해당 엔티티가 업데이트됐다고 인지하고, 커밋을 실패시키고 예외를 던진다.
- `트랜잭션-2`는 다음과 같이 동작한다.
  - 엔티티를 조회한다.
  - 엔티티 필드 값을 변경한다.
  - 정상적으로 커밋이 수행되고 엔티티 버전이 증가한다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/optimistic-lock-in-query-dsl-01.png" width="55%" class="image__border">
</div>

`DirtyCheckPostStore` 구현 클래스를 살펴보자. 주요 메서드는 다음과 같다.

- `updateEntityWithLongTransaction` 메서드
  - 엔티티를 조회한다.
  - 조회 쿼리의 락 모드를 `OPTIMISTIC`으로 지정한다.
  - 엔티티의 값을 변경한다.
  - 1초 대기한다.
- `updateEntity` 메서드
  - 엔티티를 조회한다.
  - 조회 쿼리의 락 모드를 `OPTIMISTIC`으로 지정한다.
  - 엔티티의 값을 변경한다.

```java
package action.in.blog.dsl;

import action.in.blog.dsl.entity.PostEntity;
import action.in.blog.dsl.entity.QPostEntity;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.LockModeType;

@Slf4j
@Repository
public class DirtyCheckPostStore {

    private final JPAQueryFactory jpaQueryFactory;

    public DirtyCheckPostStore(EntityManager entityManager) {
        this.jpaQueryFactory = new JPAQueryFactory(entityManager);
    }

    private void waitMillis(int millis) {
        try {
            Thread.sleep(millis);
        } catch (Exception e) {
            log.error(e.getMessage());
        }
    }

    @Transactional
    public void updateEntityWithLongTransaction(PostEntity entity) {
        updateEntity(entity);
        waitMillis(1000);
    }

    @Transactional
    public void updateEntity(PostEntity entity) {
        QPostEntity postEntity = QPostEntity.postEntity;
        PostEntity targetEntity = jpaQueryFactory
                .selectFrom(postEntity)
                .where(postEntity.id.eq(entity.getId()))
                .setLockMode(LockModeType.OPTIMISTIC)
                .fetchOne();
        targetEntity.setTitle(entity.getTitle());
        targetEntity.setContents(entity.getContents());
    }
}
```

위에서 살펴본 `DirtyCheckPostStore` 클래스의 동작을 확인할 수 있는 테스트 코드를 작성한다.

1. 트랜잭션별로 스레드를 만들어 업데이트를 수행한다.
  - `tx1` - 중간에 대기 시간이 1초 있는 업데이트가 수행된다.
  - `tx2` - 일반적인 업데이트가 수행된다.
2. `tx1` 처리 중간에 `OptimisticLockException` 예외가 발생할 것을 예상한다.
3. `tx1`, `tx2`가 모두 종료된 후 저장된 데이터가 `tx2`의 처리 결과인지 확인한다.

```java
package action.in.blog.dsl;

import action.in.blog.dsl.entity.PostEntity;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import javax.persistence.*;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
public class DirtyCheckPostStoreIT {

    @PersistenceUnit
    EntityManagerFactory factory;

    void transactionCommit(Consumer<EntityManager> consumer) {
        EntityManager em = factory.createEntityManager();
        EntityTransaction transaction = em.getTransaction();
        transaction.begin();
        try {
            consumer.accept(em);
        } catch (Exception ex) {
            throw ex;
        } finally {
            transaction.commit();
            em.close();
        }
    }

    CompletableFuture<Void> transactionAsyncWithCommit(Consumer<EntityManager> consumer) {
        return CompletableFuture.runAsync(() -> {
            EntityManager em = factory.createEntityManager();
            EntityTransaction transaction = em.getTransaction();
            transaction.begin();
            try {
                consumer.accept(em);
            } catch (Exception ex) {
                throw ex;
            } finally {
                transaction.commit();
                em.close();
            }
        });
    }

    @Test
    void optimistic_lock_with_select_query_and_lock_type() {
        PostEntity entity = PostEntity.builder()
                .title("Hello World Title")
                .contents("This is Contents")
                .build();
        transactionCommit(em -> {
            em.persist(entity);
        });


        CompletableFuture<Void> tx1 = transactionAsyncWithCommit((em) -> {
            DirtyCheckPostStore sut = new DirtyCheckPostStore(em);
            sut.updateEntityWithLongTransaction(
                    PostEntity.builder()
                            .id(entity.getId())
                            .title("Changed title with long transaction")
                            .contents("Changed contents with long transaction")
                            .build()
            );
        }).exceptionally(exception -> {
            Throwable throwable = exception.getCause();
            assertThat(throwable.getCause()).isInstanceOf(OptimisticLockException.class);
            return null;
        });
        CompletableFuture<Void> tx2 = transactionAsyncWithCommit((em) -> {
            DirtyCheckPostStore sut = new DirtyCheckPostStore(em);
            sut.updateEntity(
                    PostEntity.builder()
                            .id(entity.getId())
                            .title("Changed title with short transaction")
                            .contents("Changed contents with short transaction")
                            .build()
            );
        });
        tx1.join();
        tx2.join();


        transactionCommit(em -> {
            PostEntity result = em.find(PostEntity.class, entity.getId());
            assertThat(result.getTitle()).isEqualTo("Changed title with short transaction");
            assertThat(result.getContents()).isEqualTo("Changed contents with short transaction");
            assertThat(result.getVersionNo()).isEqualTo(1);
        });
    }
}
```

테스트 결과 로그를 살펴보자.

- 업데이트 이전에 엔티티 조회 쿼리가 실행된다.
- 업데이트 쿼리의 조건으로 ID, 버전 정보를 사용한다.
- 변경한 필드 값들 이외에도 버전 정보를 업데이트한다.

```
Hibernate: call next value for hibernate_sequence
Hibernate: insert into post_entity (contents, title, version_no, id) values (?, ?, ?, ?)
Hibernate: select postentity0_.id as id1_0_, postentity0_.contents as contents2_0_, postentity0_.title as title3_0_, postentity0_.version_no as version_4_0_ from post_entity postentity0_ where postentity0_.id=?
Hibernate: select postentity0_.id as id1_0_, postentity0_.contents as contents2_0_, postentity0_.title as title3_0_, postentity0_.version_no as version_4_0_ from post_entity postentity0_ where postentity0_.id=?
Hibernate: update post_entity set contents=?, title=?, version_no=? where id=? and version_no=?
Hibernate: select version_no as version_ from post_entity where id =?
Hibernate: update post_entity set contents=?, title=?, version_no=? where id=? and version_no=?
```

이 방법을 사용할 때는 다음 사항을 고려해야 한다.

- 테스트가 어렵다.
  - 트랜잭션의 경합을 테스트하기 때문에 트랜잭션마다 스레드를 만들고 커밋해야 한다.
  - H2 같은 임베디드(embedded) 데이터베이스를 사용하지 못하면 테스트가 데이터베이스를 오염시킨다.
- 엔티티 객체의 캡슐화가 깨진다.
  - 엔티티의 오염 확인은 영속성 컨텍스트에서 관리 중인 엔티티를 기준으로 일어난다.
  - 필드 변경을 위해 엔티티에 `setter` 메서드를 만들어야 한다.
- 트랜잭션 경합이 발생하지 않는다면 낙관적 락 메커니즘이 동작하지 않는다.
  - 트랜잭션 경합이 거의 발생하지 않는 느슨한 상황이라면 트랜잭션마다 조회한 엔티티를 기준으로 업데이트한다.

## 2. Update Query and Presence Check

이번에는 `QueryDSL` 업데이트 쿼리로 낙관적 락 메커니즘을 직접 구현한다.

- `트랜잭션-1`은 다음과 같이 동작한다.
  - 해당 ID, 버전 정보를 가지는 엔티티를 업데이트한다.
  - 업데이트 시 버전 정보를 현재보다 1 증가시킨다.
- `트랜잭션-2`는 다음과 같이 동작한다.
  - 해당 ID, 버전 정보를 가지는 엔티티를 업데이트한다.
  - 업데이트 시 버전 정보를 현재보다 1 증가시킨다.
  - 업데이트가 정상적으로 수행되지 않은 경우 이를 확인하고 예외를 던진다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/optimistic-lock-in-query-dsl-02.png" width="55%" class="image__border">
</div>

`UpdateQueryPostStore` 구현 클래스 코드를 살펴보자.

1. 조회 조건을 만족하는 엔티티를 업데이트한다. 버전 정보 확인을 제외한 다른 조회 조건은 `BooleanExpression` 객체로 만든다.
2. 업데이트 결과에 따라 다음과 같이 분기 처리한다.
  - 업데이트된 데이터가 0건이 아니라면 로직을 종료한다.
  - 업데이트된 데이터가 0건이면 버전 정보를 제외한 조건으로 데이터를 탐색한다. 데이터가 존재하면 다른 트랜잭션이 엔티티를 변경한 것이므로 `OptimisticLockException` 예외를, 존재하지 않으면 `EntityNotFoundException` 예외를 던진다.

```java
package action.in.blog.dsl;

import action.in.blog.dsl.entity.PostEntity;
import action.in.blog.dsl.entity.QPostEntity;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.EntityNotFoundException;
import javax.persistence.OptimisticLockException;

@Repository
public class UpdateQueryPostStore {

    private final JPAQueryFactory jpaQueryFactory;

    public UpdateQueryPostStore(EntityManager entityManager) {
        this.jpaQueryFactory = new JPAQueryFactory(entityManager);
    }

    private boolean isNotExisted(BooleanExpression whereClause) {
        QPostEntity postEntity = QPostEntity.postEntity;
        return jpaQueryFactory
                .selectFrom(postEntity)
                .where(whereClause)
                .fetchFirst() == null;
    }

    @Transactional
    public void updateEntity(PostEntity entity) {
        QPostEntity postEntity = QPostEntity.postEntity;
        BooleanExpression whereClause = postEntity.id.eq(entity.getId());
        long result = jpaQueryFactory
                .update(postEntity)
                .set(postEntity.title, entity.getTitle())
                .set(postEntity.contents, entity.getContents())
                .set(postEntity.versionNo, entity.getVersionNo() + 1)
                .where(whereClause, postEntity.versionNo.eq(entity.getVersionNo()))
                .execute();
        if (result != 0) {
            return;
        }
        if (isNotExisted(whereClause)) {
            throw new EntityNotFoundException("entity is not existed");
        } else {
            throw new OptimisticLockException("entity should be updated by other transaction");
        }
    }
}
```

위에서 살펴본 `UpdateQueryPostStore` 클래스를 검증하는 테스트 코드를 작성한다.

1. 하나의 트랜잭션에서 2회 업데이트를 수행한다.
2. 1차 업데이트는 정상적인 버전 정보를 지닌 엔티티로 업데이트를 수행한다.
3. 2차 업데이트는 이전 버전 정보를 지닌 엔티티로 업데이트를 수행한다.
4. 2차 업데이트에서 `OptimisticLockException` 예외가 발생할 것을 예상한다.
5. 테이블에 저장된 데이터는 1차 업데이트의 결과일 것으로 예상한다.

```java
package action.in.blog.dsl;

import action.in.blog.dsl.entity.PostEntity;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import javax.persistence.*;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
public class UpdateQueryPostStoreIT {

    @PersistenceUnit
    EntityManagerFactory factory;

    void transaction(Consumer<EntityManager> consumer) {
        EntityManager em = factory.createEntityManager();
        EntityTransaction transaction = em.getTransaction();
        transaction.begin();
        try {
            consumer.accept(em);
        } catch (Exception ex) {
            throw ex;
        } finally {
            transaction.rollback();
            em.close();
        }
    }

    void flushAndClear(EntityManager em) {
        em.flush();
        em.clear();
    }

    @Test
    void optimistic_lock_with_update_query() {
        transaction((em) -> {
            PostEntity entity = PostEntity.builder()
                    .title("Hello World Title")
                    .contents("This is Contents")
                    .build();
            em.persist(entity);
            flushAndClear(em);

            long obsoleteVersionNo = entity.getVersionNo();
            UpdateQueryPostStore sut = new UpdateQueryPostStore(em);


            sut.updateEntity(
                    PostEntity.builder()
                            .id(entity.getId())
                            .title("Changed title by first transaction")
                            .contents("Changed contents by first transaction")
                            .versionNo(entity.getVersionNo())
                            .build()
            );
            assertThrows(OptimisticLockException.class, () -> {
                sut.updateEntity(
                        PostEntity.builder()
                                .id(entity.getId())
                                .title("Changed title by second transaction")
                                .contents("Changed contents by second transaction")
                                .versionNo(obsoleteVersionNo)
                                .build()
                );
            });


            PostEntity result = em.find(PostEntity.class, entity.getId());
            assertThat(result.getTitle()).isEqualTo("Changed title by first transaction");
            assertThat(result.getContents()).isEqualTo("Changed contents by first transaction");
            assertThat(result.getVersionNo()).isEqualTo(1);
        });
    }
}
```

테스트 결과 로그는 다음과 같다.

- 업데이트 쿼리의 조건으로 ID, 버전 정보를 사용한다. 업데이트 수행 시 엔티티의 버전을 함께 증가시킨다.
- 업데이트가 성공한다면 조회 쿼리를 수행하지 않는다.
- 업데이트가 실패한다면 조회 쿼리를 수행하고, 조회 결과에 따라 예외를 던진다.

```
Hibernate: call next value for hibernate_sequence
Hibernate: insert into post_entity (contents, title, version_no, id) values (?, ?, ?, ?)
Hibernate: update post_entity set title=?, contents=?, version_no=? where id=? and version_no=?
Hibernate: update post_entity set title=?, contents=?, version_no=? where id=? and version_no=?
Hibernate: select postentity0_.id as id1_0_, postentity0_.contents as contents2_0_, postentity0_.title as title3_0_, postentity0_.version_no as version_4_0_ from post_entity postentity0_ where postentity0_.id=? limit ?
```

이 방법을 사용할 때는 다음 사항을 고려해야 한다.

- 테스트가 단순해진다.
  - 테스트를 위해 트랜잭션별로 스레드를 만들 필요가 없다.
  - 테스트 중간에 트랜잭션을 커밋할 필요가 없다.
- 정합성을 지키며 업데이트하려면 엔티티의 버전 정보를 항상 들고 다녀야 한다.
- 업데이트 쿼리를 직접 작성하기 때문에 엔티티의 캡슐화를 깰 필요가 없다.
- 낙관적 락에 대한 비즈니스 로직을 개발자가 직접 작성해야 한다.

## CLOSING

두 방법의 고려 사항과 비즈니스 상황을 함께 고민해 적절한 방법을 선택하면 된다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-01-25-optimistic-lock-in-query-dsl>
