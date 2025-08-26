---
title: "@PersistenceContext 애너테이션"
search: false
category:
  - spring-boot
  - jpa
last_modified_at: 2022-12-25T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [프록시 패턴(proxy pattern)][proxy-pattern-link]
* [영속성 컨텍스트(persistent context)와 엔티티(entity) 생명주기][jpa-persistence-context-link]
* [EntityManager 특징과 영속성 컨텍스트 장점][persistence-context-advantages-link]
* [EntityManagerFactory 클래스][entity-manager-with-entity-manager-factory-link]

## 0. 들어가면서

[EntityManagerFactory 클래스][entity-manager-with-entity-manager-factory-link] 포스트에선 스레드 안전(thread safe)하지 않은 엔티티 매니저(EntityManager)를 안전하게 사용하는 방법들 중 한 가지인 `EntityManagerFactory` 클래스에 대해 정리하였습니다. 
이번엔 `@PersistenceContext` 애너테이션을 통해 엔티티 매니저의 스레드 안전성을 도모하는 방법에 대해 정리해보았습니다. 

## 1. @PersistenceContext 애너테이션

`@Autowired` 애너테이션을 통해 빈(bean)을 주입 받듯이 `@PersistenceContext` 애너테이션을 사용하면 `EntityManager` 빈을 주입 받을 수 있습니다. 
`EntityManager`의 실제 구현 클래스의 객체가 아닌 프록시(proxy) 객체를 주입 받습니다. 

##### EntityManagerProxy 인터페이스

```java
package org.springframework.orm.jpa;

import javax.persistence.EntityManager;

public interface EntityManagerProxy extends EntityManager {


    EntityManager getTargetEntityManager() throws IllegalStateException;

}
```

##### @PersistenceContext 애너테이션을 통한 빈 주입

<p align="center">
    <img src="/images/entity-manager-with-persistence-context-annotation-1.JPG" width="100%" class="image__border">
</p>

## 2. SharedEntityManagerInvocationHandler 클래스

주입 받은 엔티티 매니저를 호출하면 프록시 내부에 `invocationHandler` 객체로 등록된 `SharedEntityManagerInvocationHandler` 인스턴스를 사용합니다. 
`SharedEntityManagerInvocationHandler` 인스턴스의 `invoke` 메소드를 살펴보면 다음과 같은 내용을 확인할 수 있습니다. 

* `EntityManagerFactoryUtils.doGetTransactionalEntityManager` 호출 라인
    * 해당 스레드에 트랜잭션이 시작된 엔티티 매니저가 있다면 이를 반환합니다.
    * 해당 스레드에 엔티티 매니저가 없다면 새로운 엔티티 매니저를 생성 후 반환합니다.
* `Object result = method.invoke(target, args)` 호출 라인
    * 획득한 엔티티 매니저(target)로 프록시 외부에서 호출한 메소드를 실행합니다. 

```java
    @Override
    @Nullable
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        
        // ...

        // Determine current EntityManager: either the transactional one managed by the factory or a temporary one for the given invocation.
        EntityManager target = EntityManagerFactoryUtils.doGetTransactionalEntityManager(
                this.targetFactory, this.properties, this.synchronizedWithTransaction);

        switch (method.getName()) {
            case "getTargetEntityManager":
                if (target == null) {
                    throw new IllegalStateException("No transactional EntityManager available");
                }
                return target;
            case "unwrap":
                Class<?> targetClass = (Class<?>) args[0];
                if (targetClass == null) {
                    return (target != null ? target : proxy);
                }
                if (target == null) {
                    throw new IllegalStateException("No transactional EntityManager available");
                }
                break;
        }

        // ...

        // Invoke method on current EntityManager.
        try {
            Object result = method.invoke(target, args);
            if (result instanceof Query) {
                Query query = (Query) result;
                if (isNewEm) {
                    Class<?>[] ifcs = cachedQueryInterfaces.computeIfAbsent(query.getClass(), key ->
                            ClassUtils.getAllInterfacesForClass(key, this.proxyClassLoader));
                    result = Proxy.newProxyInstance(this.proxyClassLoader, ifcs,
                            new DeferredQueryInvocationHandler(query, target));
                    isNewEm = false;
                }
                else {
                    EntityManagerFactoryUtils.applyTransactionTimeout(query, this.targetFactory);
                }
            }
            return result;
        } catch (InvocationTargetException ex) {
            throw ex.getTargetException();
        } finally {
            if (isNewEm) {
                EntityManagerFactoryUtils.closeEntityManager(target);
            }
        }
    }
```

## 3. Example

`EntityManagerFactory` 클래스를 직접 사용하면 `@Transactional` 애너테이션을 통한 트랜잭션 처리가 불가능합니다. 
반면에 `@PersistenceContext` 애너테이션을 통해 주입 받은 엔티티 매니저를 사용하면 `@Transactional` 애너테이션을 통한 트랜잭션 처리가 가능합니다. 
간단한 예시 코드를 통해 확인해보겠습니다. 

### 3.1. PcAnnotationService 클래스

* 데이터 생성 후 조회하는 간단한 비즈니스 로직을 트랜잭션 처리합니다.
* 롤백을 유도하기 위해 플래그(flag) 값으로 의도적인 예외를 던집니다. 

```java
package action.in.blog.annotation;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PcAnnotationService {

    private final PcAnnotationStore pcAnnotationStore;

    public PcAnnotationService(PcAnnotationStore pcAnnotationStore) {
        this.pcAnnotationStore = pcAnnotationStore;
    }

    @Transactional
    public PcAnnotationEntity findEntityAfterInsert(String name, boolean intentionallyException) {
        pcAnnotationStore.createFactoryEntity(name);
        if (intentionallyException) {
            throw new RuntimeException("throw intentionallyException");
        }
        return pcAnnotationStore.findByName(name);
    }
}
```

### 3.2. PcAnnotationStore 클래스

* 엔티티 매니저를 `@PersistenceContext` 애너테이션을 통해 주입 받습니다.
* 데이터 추가, 조회 기능을 제공합니다.

```java
package action.in.blog.annotation;

import org.springframework.stereotype.Repository;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;

@Repository
public class PcAnnotationStore {

    @PersistenceContext
    private EntityManager em;

    public void createFactoryEntity(String name) {
        em.persist(PcAnnotationEntity.builder()
                .name(name)
                .build());
    }

    public PcAnnotationEntity findByName(String name) {
        TypedQuery<PcAnnotationEntity> query = em.createQuery("select pc from PcAnnotationEntity pc where pc.name = :name", PcAnnotationEntity.class);
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
    * 데이터 검색 시 NoResultException 예외가 발생합니다.

```java
package action.in.blog.annotation;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.persistence.*;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
public class PcAnnotationServiceIT {

    @PersistenceUnit
    EntityManagerFactory factory;

    @Autowired
    PcAnnotationService sut;

    @Test
    @DisplayName("정상 처리되면 데이터베이스에 데이터가 저장된다.")
    void find_entity_with_exception_after_insert() {

        EntityManager entityManager = factory.createEntityManager();


        PcAnnotationEntity pcAnnotationEntity = sut.findEntityAfterInsert("Hello Word", false);


        PcAnnotationEntity result = entityManager.find(PcAnnotationEntity.class, pcAnnotationEntity.getId());
        assertThat(result.getName(), equalTo(pcAnnotationEntity.getName()));
    }

    @Test
    @DisplayName("비즈니스 로직 중간에 예외가 발생하는 경우 데이터가 롤백된다.")
    void rollback_data_with_exception_after_insert() {
        EntityManager entityManager = factory.createEntityManager();


        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            sut.findEntityAfterInsert("Hello World", true);
        });
        assertThat(exception.getMessage(), equalTo("throw intentionallyException"));
        assertThrows(NoResultException.class, () -> {
            TypedQuery<PcAnnotationEntity> query = entityManager.createQuery("select pc from PcAnnotationEntity pc where pc.name = :name", PcAnnotationEntity.class);
            query.setParameter("name", "Hello World");
            query.getSingleResult();
        });
    }
}
```

## 5. Dependency Injection with @Autowired

위에서 다룬 내용들을 요약하면 다음과 같습니다.

* `@PersistenceContext` 애너테이션을 사용하면 엔티티 매니저 프록시 객체를 주입 받아서 사용합니다. 
* 프록시 객체를 통해 스레드 별로 엔티티 매니저를 생성하고 사용하기 때문에 스레드 안정성을 보장합니다.

일반적으로 `@Autowired` 애너테이션을 통해 빈을 주입 받으면 어플리케이션 전역에서 사용 중인 객체를 전달받습니다. 
때문에 엔티티 매니저를 `@Autowired` 애너테이션을 통해 주입 받는 것은 위험해보입니다. 
하지만, 실제로 `@Autowired` 애너테이션으로 엔티티 매니저를 주입 받으면 `@PersistenceContext` 애너테이션과 동일하게 프록시 객체를 주입받습니다. 
생성자 주입(constructor injection)을 통해 전달 받는 엔티티 매니저도 동일합니다. 

##### @Autowired 애너테이션을 통한 빈 주입

<p align="center">
    <img src="/images/entity-manager-with-persistence-context-annotation-2.JPG" width="100%" class="image__border">
</p>

### 5.1. @PersistenceContext is same with @Autowired

예전엔 반드시 `@PersistenceContext` 애너테이션을 사용해야 했지만, 특정 버전 이상부터는 `@Autowired` 애너테이션도 동일한 기능을 제공하는 것으로 보입니다. 
공식 문서에선 확인하지 못 했지만, 관련된 내용을 `StackOverflow`에 문의한 결과 다음과 같은 답변을 받을 수 있었습니다. 

* 두 방법은 동일하지만, `@PersistenceContext` 애너테이션을 사용하는 것이 명시적이고, 표준 JPA 사용 방법이다.

<p align="center">
    <img src="/images/entity-manager-with-persistence-context-annotation-3.JPG" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-12-22-entity-manager-with-persistence-context-annotation>

#### REFERENCE

* <https://stackoverflow.com/questions/74724044/thread-safety-of-entitymanager-when-dependency-injection>
* <https://stackoverflow.com/questions/31335211/autowired-vs-persistencecontext-for-entitymanager-bean>
* <https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#jpa.misc.jpa-context>

[proxy-pattern-link]: https://junhyunny.github.io/information/design-pattern/proxy-pattern/
[jpa-persistence-context-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-persistence-context/
[persistence-context-advantages-link]: https://junhyunny.github.io/spring-boot/jpa/junit/persistence-context-advantages/
[entity-manager-with-entity-manager-factory-link]: https://junhyunny.github.io/spring-boot/jpa/entity-manager-with-entity-manager-factory/
