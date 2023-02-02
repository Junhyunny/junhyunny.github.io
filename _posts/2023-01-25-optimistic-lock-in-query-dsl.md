---
title: "Optimistic Lock in QueryDSL"
search: false
category:
  - java
  - spring-boot
  - query-dsl
  - jpa
last_modified_at: 2023-01-25T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Lock Mechanism][lock-mechanism-link]
* [Optimistic Lock in JPA][jpa-optimistic-lock-link]

## 0. 들어가면서

JPA(java persistence api)는 `@Version` 애너테이션으로 낙관적 락(optimistic lock) 기능을 제공합니다. 
`spring-data-jpa`는 `save` 메소드로 추가(insert), 업데이트(update) 기능을 제공하면서 내부에 버전 확인 로직이 있기 때문에 쉽게 낙관적 락 기능을 사용할 수 있습니다. 

반면에 `QueryDSL`은 업데이트에 낙관적인 락 방식이 자동으로 적용되지 않습니다. 
다음과 같은 방법으로 낙관적인 락 기능을 사용할 수 있습니다.

* 조회 쿼리와 엔티티의 오염 확인(dirty check)
    * 조회 쿼리에 락 타입(lock type)을 지정합니다.
    * 조회된 엔티티를 변경하고, 엔티티의 오염 여부를 확인하는 과정을 통해 업데이트가 수행됩니다.
    * 업데이트를 수행할 때 버전 정보를 증가시킵니다.
    * 다른 트랜잭션(transaction)에 의해 업데이트가 되었다면 버전이 달라지므로 낙관적 락 예외를 발생합니다.
* 업데이트 쿼리 사용
    * 업데이트 쿼리 조건에 버전 정보를 추가합니다.
    * 업데이트에 실패하면 버전 정보를 제외한 조회 조건으로 엔티티를 탐색합니다.
    * 엔티티 존재함에도 업데이트가 실패했다면 버전 차이로 인식하여 낙관적 락 예외를 발생합니다.

## 1. Using LockType and Dirty Check

엔티티 오염 확인을 통한 업데이트에서 낙관적 락을 발생시키는 방법에 대해 먼저 정리하였습니다. 

### 1.1. Context for Test

다음과 같은 테스트를 수행합니다. 

* `트랜잭션-1`은 다음과 같이 동작합니다.
    * 엔티티를 조회합니다.
    * 엔티티 필드 값을 변경합니다.
    * 1초 대기합니다.
    * 트랜잭션 종료 시 버전 정보가 맞지 않음을 확인합니다.
    * 다른 트랜잭션에 의해 해당 엔티티가 업데이트 되었다고 인지하고, 커밋을 실패시키고 예외를 던집니다.
* `트랜잭션-2`은 다음과 같이 동작합니다.
    * 엔티티를 조회합니다.
    * 엔티티 필드 값을 변경합니다.
    * 정상적으로 커밋이 수행되고 엔티티 버전이 증가합니다.

<p align="center">
    <img src="/images/optimistic-lock-in-query-dsl-1.JPG" width="55%" class="image__border">
</p>

### 1.2. Implementation Code

* `updateEntityWithLongTransaction` 메소드
    * 엔티티를 조회합니다.
    * 조회 쿼리의 락 모드를 `OPTIMISTIC`으로 지정합니다.
    * 엔티티의 값을 변경합니다.
    * 1초 대기합니다.
* `updateEntity` 메소드
    * 엔티티를 조회합니다.
    * 조회 쿼리의 락 모드를 `OPTIMISTIC`으로 지정합니다.
    * 엔티티의 값을 변경합니다.

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

### 1.3. Test Code

* 테스트를 위한 엔티티를 하나 생성합니다.
* 각 트랜잭션 별로 스레드를 만들어 업데이트를 수행합니다.
    * `tx1` - 중간에 대기 시간이 1초 있는 업데이트가 수행됩니다.
    * `tx2` - 일반적인 업데이트가 수행됩니다.
* `tx1` 처리 중간에 `OptimisticLockException` 예외가 발생할 것을 예상합니다.
* `tx1`, `tx2`이 모두 종료된 후 저장된 모습은 `tx2`의 처리 결과 모습임을 확인합니다.

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

##### Result of Test 

* 업데이트 이전에 엔티티 조회 쿼리가 실행됩니다.
* 업데이트 쿼리의 조건으로 ID, 버전 정보를 사용합니다.
* 변경한 필드 값들 이 외에도 버전 정보를 업데이트합니다.

```
Hibernate: call next value for hibernate_sequence
Hibernate: insert into post_entity (contents, title, version_no, id) values (?, ?, ?, ?)
Hibernate: select postentity0_.id as id1_0_, postentity0_.contents as contents2_0_, postentity0_.title as title3_0_, postentity0_.version_no as version_4_0_ from post_entity postentity0_ where postentity0_.id=?
Hibernate: select postentity0_.id as id1_0_, postentity0_.contents as contents2_0_, postentity0_.title as title3_0_, postentity0_.version_no as version_4_0_ from post_entity postentity0_ where postentity0_.id=?
Hibernate: update post_entity set contents=?, title=?, version_no=? where id=? and version_no=?
Hibernate: select version_no as version_ from post_entity where id =?
Hibernate: update post_entity set contents=?, title=?, version_no=? where id=? and version_no=?
```

### 1.4. Considerations

해당 기능을 사용할 때 다음과 같은 것들을 고려해야 합니다. 

* 테스트가 어렵습니다.
    * 트랜잭션의 경합을 테스트하기 때문에 각 스레드를 만들고 트랜잭션을 커밋해야 합니다.
    * H2 같은 임베디드(embedded) 데이터베이스를 사용하지 못하면 데이터베이스를 오염시킵니다.
* 엔티티 객체의 캡슐화가 깨집니다.
    * 엔티티의 오염 확인은 영속성 컨텍스트에서 관리 중인 엔티티를 기준으로 일어납니다.
    * 필드 변경을 위해 엔티티에 `setter` 메소드를 만들어야 합니다. 
* 트랜잭션 경합이 발생하지 않는다면 낙관적인 락 메커니즘이 동작하지 않습니다.
    * 트랜잭션 경합이 거의 발생하지 느슨한 상황이라면 매 트랜잭션마다 조회한 엔티티를 기준으로 업데이트합니다.

## 2. Update Query and Presence Check

`QueryDSL` 업데이트 쿼리를 사용하면서 자체적으로 낙관적인 락 메커니즘을 구현합니다. 

### 2.1. Context for Test

* `트랜잭션-1`은 다음과 같이 동작합니다.
    * 해당 ID, 버전 정보를 가지는 엔티티를 업데이트합니다.
    * 업데이트 시 버전 정보를 현재보다 1 증가시킵니다.
* `트랜잭션-2`은 다음과 같이 동작합니다.
    * 해당 ID, 버전 정보를 가지는 엔티티를 업데이트합니다.
    * 업데이트 시 버전 정보를 현재보다 1 증가시킵니다.
    * 업데이트가 정상적으로 수행되지 않은 경우 이를 확인하고 예외를 던집니다.

<p align="center">
    <img src="/images/optimistic-lock-in-query-dsl-2.JPG" width="55%" class="image__border">
</p>

### 2.2. Implementation Code

* 조회 조건을 만족하는 엔티티를 업데이트합니다.
    * 버전 정보 확인을 제외한 다른 조회 조건은 `BooleanExpression` 객체로 만듭니다.
* 업데이트 된 데이터가 0건이 아니라면 해당 로직을 종료합니다.
* 업데이트 된 데이터가 0건인 경우 다음과 같이 동작합니다.
    * 버전 정보를 제외한 조건으로 데이터를 존재합니다.
    * 해당 데이터가 존재하는 경우 다른 트랜잭션에 의한 엔티티 변경이므로 `OptimisticLockException` 예외를 던집니다.
    * 해당 데이터가 존재하지 않는 경우 `EntityNotFoundException` 예외를 던집니다.

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

### 2.3. Test Code

* 하나의 트랜잭션에서 2회 업데이트를 수행합니다.
* 1차 업데이트는 정상적인 버전 정보를 지닌 엔티티로 업데이트를 수행합니다.
* 2차 업데이트는 이전 버전 정보를 지닌 엔티티로 업데이트를 수행합니다.
* 2차 업데이트에서 `OptimisticLockException` 예외가 발생할 것을 예상합니다.
* 테이블에 저장된 모습은 1차 업데이트의 수행 결과일 것으로 예상합니다.

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

##### Result of Test 

* 업데이트 쿼리의 조건으로 ID, 버전 정보를 사용합니다.
    * 업데이트 수행 시 엔티티의 버전을 함께 증가시킵니다.
* 업데이트가 성공한다면 조회 쿼리를 수행하지 않습니다.
* 업데이트가 실패한다면 조회 쿼리를 수행하고, 해당 결과에 따른 예외를 전달합니다.

```
Hibernate: call next value for hibernate_sequence
Hibernate: insert into post_entity (contents, title, version_no, id) values (?, ?, ?, ?)
Hibernate: update post_entity set title=?, contents=?, version_no=? where id=? and version_no=?
Hibernate: update post_entity set title=?, contents=?, version_no=? where id=? and version_no=?
Hibernate: select postentity0_.id as id1_0_, postentity0_.contents as contents2_0_, postentity0_.title as title3_0_, postentity0_.version_no as version_4_0_ from post_entity postentity0_ where postentity0_.id=? limit ?
```

### 2.4. Considerations

해당 기능을 사용할 때 다음과 같은 것들을 고려해야 합니다. 

* 테스트가 단순해집니다.
    * 테스트를 위해 트랜잭션 별로 스레드를 만들 필요가 없습니다.
    * 테스트 중간에 트랜잭션을 커밋할 필요가 없습니다.
* 데이터 정합성을 위한 업데이트를 하고자 엔티티의 버전 정보를 항상 들고 다녀야 합니다.
* 업데이트 쿼리를 직접 작성하기 때문에 엔티티의 캡슐화를 깰 필요가 없습니다.
* 낙관적인 락에 대한 비즈니스 로직을 개발자가 직접 작성해야 합니다.  

## CLOSING

두 가지 방법에 대한 각 고려 사항들과 비즈니스를 고민하여 적절한 방법으로 구현합니다. 

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-01-25-optimistic-lock-in-query-dsl>

#### REFERENCE

[lock-mechanism-link]: https://junhyunny.github.io/information/lock-mechanism/
[jpa-optimistic-lock-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-optimistic-lock/