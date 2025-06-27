---
title: "EntityManagerFactory 클래스"
search: false
category:
  - spring-boot
  - jpa
last_modified_at: 2022-12-20T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [영속성 컨텍스트(persistent context)와 엔티티(entity) 생명주기][jpa-persistence-context-link]
* [Features of EntityManager][persistence-context-advantages-link]

## 0. 들어가면서

`엔티티 매니저(EntityManager)`는 스레드 안전(thread safety)하지 않습니다. 
내부 영속성 컨텍스트(persistence context)에 1차 캐시를 관리하기 때문에 하나의 엔티티 매니저에 다중 스레드가 접근하면 동시성 문제가 발생할 수 있습니다. 
동시성 문제를 해결하려면 각 스레드 별로 고유한 엔티티 매니저를 사용해야 합니다. 
이번 포스트에선 동시성 문제가 발생하지 않도록 엔티티 매니저를 사용하는 방법 중 하나인 `EntityManagerFactory`에 대해 살펴보겠습니다.

## 1. EntityManagerFactory 클래스

스레드에 안전하지 않은 엔티티 매니저는 매번 만들어 사용해야 합니다. 
`EntityManagerFactory` 클래스를 사용하면 엔티티 매니저를 만들 수 있습니다. 
`EntityManagerFactory` 클래스는 생성할 때 비용이 비싸기 때문에 어플리케이션 전역에 하나만 만들어 사용하는 것이 좋습니다. 
`@PersistenceUnit` 애너테이션을 사용하면 `EntityManagerFactory` 빈(bean)을 주입 받을 수 있습니다.

```java
    @PersistenceUnit
    private EntityManagerFactory factory;
```

## 2. Create EntityManager

`createEntityManager` 메소드를 통해 엔티티 매니저를 생성할 수 있습니다. 
엔티티 매니저는 매번 새로운 객체를 생성합니다. 
새로 생성될 때마다 세션을 매번 새롭게 맺기 때문에 비즈니스 로직을 하나의 트랜잭션으로 관리하고 싶다면 하나의 엔티티 매니저를 같이 사용해야 합니다. 

```java
    @Test
    @DisplayName("EntityManagerFactory는 EntityManager를 매번 새롭게 만든다.")
    void create_entity_manager() {
        EntityManager firstEntityManager = factory.createEntityManager();
        EntityManager secondEntityManager = factory.createEntityManager();

        assertThat(firstEntityManager == secondEntityManager, equalTo(false));
        assertThat(firstEntityManager.equals(secondEntityManager), equalTo(false));
    }
```

## 3. Example

`EntityManagerFactory`를 사용하면 `@Transactional` 애너테이션을 통해 트랜잭션 관리가 불가능합니다. 
트랜잭션 관리 프로세스를 직접 만들어야 합니다. 
간단하게 트랜잭션 관리 프로세스를 구현한 코드를 적용한 예시 코드를 살펴보겠습니다. 

### 3.1. AbstractFactoryService 클래스

* 외부에서 전달한 함수를 트랜잭션 내부에서 실행합니다. 
* `readonly` 여부에 따라 비즈니스 로직 처리 후 롤백(rollback) 혹은 커밋(commit)을 수행합니다.
* 예외(exception)가 발생하면 롤백 처리합니다.

```java
package action.in.blog.factory;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.EntityTransaction;
import javax.persistence.PersistenceUnit;

public abstract class AbstractFactoryService {

    @PersistenceUnit
    private EntityManagerFactory factory;

    protected <V> V transaction(EntityManagerCallable<V> callable) {
        return transaction(callable, false);
    }

    protected <V> V transaction(EntityManagerCallable<V> callable, boolean readonly) {
        EntityManager em = factory.createEntityManager();
        EntityTransaction transaction = em.getTransaction();
        transaction.begin();
        try {
            V ret = callable.run(em);
            if (readonly) {
                transaction.rollback();
            } else {
                transaction.commit();
            }
            return ret;
        } catch (Throwable e) {
            if (transaction.isActive()) {
                transaction.rollback();
            }
            throw new RuntimeException(e);
        } finally {
            em.close();
        }
    }

    protected interface EntityManagerCallable<V> {
        V run(EntityManager em);
    }
}
```

### 3.2. FactoryService 클래스

* 데이터 생성 후 조회하는 간단한 비즈니스 로직을 `transaction` 메소드에 전달합니다.
* 롤백을 유도하기 위해 플래그(flag) 값으로 의도적인 예외를 던집니다. 

```java
package action.in.blog.factory;

import org.springframework.stereotype.Service;

@Service
public class FactoryService extends AbstractFactoryService {

    private final FactoryStore factoryStore;

    public FactoryService(FactoryStore factoryStore) {
        this.factoryStore = factoryStore;
    }

    public FactoryEntity findEntityAfterInsert(String name, boolean intentionallyException) {
        return transaction((em) -> {
            factoryStore.createFactoryEntity(em, name);
            if (intentionallyException) {
                throw new RuntimeException("throw intentionallyException");
            }
            return factoryStore.findByName(em, name);
        });
    }
}
```

### 3.3. FactoryStore 클래스

* 데이터 추가, 조회 기능을 제공합니다.

```java
package action.in.blog.factory;

import org.springframework.stereotype.Repository;

import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;

@Repository
public class FactoryStore {

    public void createFactoryEntity(EntityManager em, String name) {
        em.persist(FactoryEntity.builder()
                .name(name)
                .build());
    }

    public FactoryEntity findByName(EntityManager em, String name) {
        TypedQuery<FactoryEntity> query = em.createQuery("select f from FactoryEntity f where f.name = :name", FactoryEntity.class);
        query.setParameter("name", name);
        return query.getSingleResult();
    }
}
```

## 4. Tests

* 예외가 발생하지 않는 경우 
    * 데이터가 정상적으로 추가됩니다.
    * 추가된 데이터를 DB에서 발급받은 ID로 조회할 수 있습니다.
* 예외가 발생하는 경우
    * 데이터가 정상적으로 추가되지 않습니다.
    * 데이터 검색 시 `NoResultException` 예외가 발생합니다.

```java
package action.in.blog.factory;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceUnit;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
public class FactoryServiceIT {

    @PersistenceUnit
    EntityManagerFactory factory;

    @Autowired
    FactoryService sut;

    @Test
    @DisplayName("정상 처리되면 데이터베이스에 데이터가 저장된다.")
    void find_entity_with_exception_after_insert() {
        EntityManager entityManager = factory.createEntityManager();


        FactoryEntity factoryEntity = sut.findEntityAfterInsert("Hello Word", false);


        FactoryEntity result = entityManager.find(FactoryEntity.class, factoryEntity.getId());
        assertThat(result.getName(), equalTo(factoryEntity.getName()));
    }

    @Test
    @DisplayName("비즈니스 로직 중간에 예외가 발생하는 경우 데이터가 롤백된다.")
    void rollback_data_with_exception_after_insert() {
        EntityManager entityManager = factory.createEntityManager();


        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            sut.findEntityAfterInsert("Hello World", true);
        });
        assertThat(exception.getMessage(), equalTo("java.lang.RuntimeException: throw intentionallyException"));
        assertThrows(NoResultException.class, () -> {
            FactoryStore store = new FactoryStore();
            store.findByName(entityManager, "Hello World");
        });
    }
}
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-12-20-entity-manager-with-entity-manager-factory>

#### REFERENCE

* <https://stackoverflow.com/questions/74724044/thread-safety-of-entitymanager-when-dependency-injection>

[jpa-persistence-context-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-persistence-context/
[persistence-context-advantages-link]: https://junhyunny.github.io/spring-boot/jpa/junit/persistence-context-advantages/
