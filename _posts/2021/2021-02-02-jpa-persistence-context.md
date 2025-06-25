---
title: "영속성 컨텍스트(persistent context)와 엔티티(entity) 생명주기"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2025-06-25T20:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [JPA(Java Persistence API)][java-persistence-api-link]

## 1. EntityManager 

`JPA`는 내부적으로 ORM(object relation mapping) 프레임워크인 하이버네이트(hibernate)를 사용한다. 하이버네이트 같은 ORM 프레임워크는 데이터를 저장하기 위해 엔티티(entity) 클래스를 사용한다. ORM 프레임워크를 사용할 때 클래스, 객체와 관계형 데이터베이스 사이의 관계를 다음처럼 단순하게 정리할 수 있다.

- 엔티티 클래스 - 테이블
- 엔티티 객체 - 데이터 한 행(row)
- 엔티티 객체의 필드와 상태 값 - 데이터 한 행의 열(column)과 값 

데이터 저장을 위해 사용되는 엔티티는 `EntityManager`를 통해 관리된다. 

- 모든 엔티티는 자신을 식별할 수 있도록 `@Id` 애너테이션을 이용한다.
- EntityManager는 엔티티의 `@Id` 애너테이션으로 정의된 필드들의 값을 통해 엔티티를 구분한다.
- 엔티티는 생명주기에 따라 적절한 상태를 부여받고, 상태에 맞는 적절한 쿼리를 통해 데이터베이스에 저장된다. 

## 2. Persistence Context

`영속성 컨텍스트(Persistence Context)`는 엔티티를 영구히 저장하는 환경을 의미한다. 영속성 컨텍스트의 구현체는 영속성 프레임워크가 제공한다. EntityManager는 엔티티의 식별 키를 기준으로 엔티티를 영속성 컨텍스트에 저장한다. 

EntityManager는 호출되는 메소드에 따라 엔티티 객체의 생명주기 상태를 변경한다. 트랜잭션 마지막에는 엔티티의 생명주기 상태를 기준으로 저장, 변경, 삭제할 수 있는 쿼리를 만들어 엔티티의 모습을 데이터베이스의 데이터로 반영한다. 

<div align="center">
  <img src="/images/posts/2021/jpa-persistence-context-01.png" width="80%" class="image__border">
</div>

## 3. Entity Lifecycle

엔티티는 관리 대상인지, 관리 대상이 아닌지, 제거할 대상인지에 따라 EntityManager에게 적절한 상태를 부여받는다. 이를 엔티티의 생명주기(lifecycle)라고 하며 다음과 같은 상태들이 존재한다. 

- New
- Managed
- Detached
- Removed

각 생명주기 상태가 어떤 식으로 반영, 변경되는지 살펴보자. 엔티티 라이프사이클의 흐름은 다음과 같다.

- 각 상태에서 다른 상태로 이동할 수 있는 방향이 화살표로 표시되어 있다.
- 각 상태에서 다른 상태로 이동하기 위한 EntityManager의 메소드가 표시되어 있다.

<div align="center">
  <img src="/images/posts/2021/jpa-persistence-context-02.png" width="60%" class="image__border">
</div>
<center>https://gunlog.dev/JPA-Persistence-Context/</center>

<br/>

지금부터 JPA에서 말하는 엔티티의 상태와 EntityManager의 메소드를 호출에 따라 엔티티 상태가 어떻게 변경되는지 살펴보자. 먼저 비영속(new/transient) 상태를 살펴보자.

- 엔티티 객체를 새로 생성한 상태이다.
- 어플리케이션 메모리에만 존재하는 상태이며 EntityManager에 의해 별도로 관리되지 않는다. 

```java
    Member member = new Member();
    member.setId("010-1234-1234");
    member.setName("Junhyunny");
```

다음은 영속(managed) 상태에 대해 살펴보자.

- 엔티티 객체를 EntityManager가 관리하고 있는 상태이다.
  - 영속성 컨텍스트에 저장된 상태이다.
- 엔티티는 다음과 같은 시점에 영속 상태가 된다. 
  - 엔티티가 `persist` 메소드를 통해 영속성 컨텍스트에 저장되는 시점
  - EntityManager가 데이터베이스에서 데이터를 조회하는 시점
  - 상태 관리에서 제외된 엔티티가 `merge` 메소드를 통해 영속성 컨텍스트로 복귀하는 시점

```java
    Member member = new Member();
    member.setId("010-1234-1234");
    member.setName("Junhyunny");
    entityManager.persist(member);
```

다음은 준영속(detached) 상태이다.

- EntityManager에 의해 관리되다가 영속성 컨텍스트에서 제외된 상태이다.
- `detach` 메소드를 통해 영속성 컨텍스트에서 분리된다. 
- 준영속 상태 객체의 상태 변화는 EntityManager가 감지하지 못하여 데이터베이스에 반영되지 않는다. 
- EntityManager에 의해 관리되지 않을 뿐 데이터베이스에서 삭제되진 않는다. 

```java
    Member member = entityManager.find(Member.class, "01012341234");
    entityManager.detach(member);
```

마지막으로 삭제(removed) 상태이다.

- 엔티티를 삭제하겠다고 표시된 상태이다. 
- `remove` 메소드에 의해 삭제 상태로 변경된다. 

```java
    Member member = entityManager.find(Member.class, "01012341234");
    entityManager.remove(member);
```

## 3. Tests for EntityManager methods

간단한 테스트 코드들을 통해 EntityManager 메소드 동작 결과들을 살펴보자. 처음은 `persist` 메소드이다.

1. 새로 생성한 객체를 persist 메소드를 통해 영속성 컨텍스트에 저장한다.
2. 트랜잭션을 커밋(commit)하고, 영속성 컨텍스트를 모두 정리한다.
3. find 메소드로 엔티티를 데이터베이스에서 조회한다.
4. 조회한 엔티티의 상태 값을 확인한다. 
  - ID 값은 "010-1234-1234" 이다.
  - 이름 값은 "Junhyunny" 이다.

```java
package blog.in.action.lifecycle;

import blog.in.action.entity.Member;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@Slf4j
@SpringBootTest(properties = {
        "spring.jpa.show-sql=true",
})
public class PersistTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    void persistAndClear(EntityManager em, Member member) {
        em.getTransaction().begin();
        em.persist(member);
        em.getTransaction().commit();
        em.clear();
    }

    @Test
    void find_member_after_persist() {
        EntityManager em = factory.createEntityManager();
        try {
            Member member = new Member();
            member.setId("010-1234-1234");
            member.setName("Junhyunny");
            persistAndClear(em, member);

            member = em.find(Member.class, "010-1234-1234");

            assertThat(member.getId(), equalTo("010-1234-1234"));
            assertThat(member.getName(), equalTo("Junhyunny"));
        } catch (Exception ex) {
            em.getTransaction().rollback();
            throw new RuntimeException(ex);
        } finally {
            em.close();
        }
    }
}
```

테스트는 정상적으로 통과하며, 다음과 같은 수행 로그를 남긴다.

- 트랜잭션이 커밋되는 시점에 `insert` 쿼리가 수행된다.
- `find` 메소드를 통해 엔티티 조회 시 `select` 쿼리가 수행된다.

```
Hibernate: insert into tb_member (name, id) values (?, ?)
Hibernate: select member0_.id as id1_0_0_, member0_.name as name2_0_0_ from tb_member member0_ where member0_.id=?
```

다음은 `detach` 메소드를 테스트해본다. 두 가지를 테스트한다.

- 준영속 상태 엔티티를 변경하면 데이터베이스에 반영되는가?
- 준영속 상태 엔티티를 제거(remove)하면 무슨 현상이 발생하는가?

먼저 준영속 상태 엔티티를 변경했을 때 데이터베이스에 반영이되는지 확인하는 테스트를 살펴보자.

1. 조회한 엔티티를 detach 메소드를 통해 준영속 상태로 만든다.
2. 객체 이름을 "Jua"로 변경한다.
3. 트랜잭션을 커밋하고, 영속성 컨텍스트를 모두 정리한다.
4. find 메소드로 엔티티를 데이터베이스에서 다시 조회한다.
5. 조회한 엔티티의 이름 값이 "Junhyunny"인지 확인한다.

```java
package blog.in.action.lifecycle;

import blog.in.action.entity.Member;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertThrows;

@Slf4j
@SpringBootTest(properties = {
        "spring.jpa.show-sql=true",
})
public class DetachTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @BeforeEach
    void beforeEach() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = new Member();
            member.setId("010-1234-1234");
            member.setName("Junhyunny");
            em.persist(member);
            em.getTransaction().commit();
        } catch (Exception ex) {
            em.getTransaction().rollback();
            throw new RuntimeException(ex);
        } finally {
            em.close();
        }
    }

    @Test
    void detached_entity_is_not_updated() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = em.find(Member.class, "010-1234-1234");
            em.detach(member);
            member.setName("Jua");
            em.getTransaction().commit();
            em.clear();


            member = em.find(Member.class, "010-1234-1234");
            assertThat(member.getName(), equalTo("Junhyunny"));
        } catch (Exception ex) {
            em.getTransaction().rollback();
            throw new RuntimeException(ex);
        } finally {
            em.close();
        }
    }

    // ...
}
```

테스트는 정상적으로 통과하며, 다음과 같은 수행 로그를 남긴다.

- 테스트 시작 전 테스트 데이터를 삽입하면서 `insert` 쿼리가 수행된다.
- 테스트 초반에 `find` 메소드로 엔티티를 조회하면서 `select` 쿼리가 수행된다.
- 준영속 상태 엔티티 변화는 데이터베이스에 반영되지 않으므로 `update` 쿼리가 수행되지 않는다.
- `find` 메소드로 다시 엔티티를 조회할 때 `select` 쿼리가 수행된다. 

```
Hibernate: insert into tb_member (name, id) values (?, ?)
Hibernate: select member0_.id as id1_0_0_, member0_.name as name2_0_0_ from tb_member member0_ where member0_.id=?
Hibernate: select member0_.id as id1_0_0_, member0_.name as name2_0_0_ from tb_member member0_ where member0_.id=?
```

다음은 준영속 상태 엔티티를 제거하면 무슨 현상이 발생하는지 확인하는 테스트다.

1. 조회한 엔티티를 detach 메소드를 통해 준영속 상태로 만든다.
2. 준영속 상태 객체를 remove 메소드를 통해 제거 대상으로 만든다.
3. IllegalArgumentException 예외가 발생하는지 확인한다.
4. 발생한 예외의 메시지를 로그로 확인한다.

```java
package blog.in.action.lifecycle;

import blog.in.action.entity.Member;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertThrows;

@Slf4j
@SpringBootTest(properties = {
        "spring.jpa.show-sql=true",
})
public class DetachTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @BeforeEach
    void beforeEach() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = new Member();
            member.setId("010-1234-1234");
            member.setName("Junhyunny");
            em.persist(member);
            em.getTransaction().commit();
        } catch (Exception ex) {
            em.getTransaction().rollback();
            throw new RuntimeException(ex);
        } finally {
            em.close();
        }
    }

    // ...

    @Test
    void throw_exception_when_remove_detached_entity() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = em.find(Member.class, "010-1234-1234");
            em.detach(member);

            Throwable throwable = assertThrows(IllegalArgumentException.class, () -> em.remove(member));
            log.warn(throwable.getMessage());
        } catch (Exception ex) {
            em.getTransaction().rollback();
            throw new RuntimeException(ex);
        } finally {
            em.close();
        }
    }
}
```

테스트는 정상적으로 통과하며, 다음과 같은 수행 로그를 남긴다.

- 테스트 시작 전 테스트 데이터를 삽입하면서 `insert` 쿼리가 수행된다.
- 테스트 초반에 `find` 메소드로 엔티티를 조회하면서 `select` 쿼리가 수행된다.
- 영속성 컨텍스트에서 관리되지 않는 엔티티가 `remove` 메소드에 전달된다.
  - 영속성 컨텍스트에 관리되지 않는 엔티티이므로 데이터베이스에 해당 엔티티가 존재하는지 확인하고자 `select` 쿼리가 수행된다.
  - 비영속 엔티티를 사용해도 `select` 쿼리가 동일하게 발생한다.
- `IllegalArgumentException` 예외가 발생하면서 다음과 같은 에러 메시지를 출력한다. 
  - Removing a detached instance blog.in.action.entity.Member#010-1234-1234

```
Hibernate: insert into tb_member (name, id) values (?, ?)
Hibernate: select member0_.id as id1_0_0_, member0_.name as name2_0_0_ from tb_member member0_ where member0_.id=?
Hibernate: select member_.id, member_.name as name2_0_ from tb_member member_ where member_.id=?
2022-09-25 02:40:02.340  WARN 55106 --- [           main] blog.in.action.lifecycle.DetachTest      : Removing a detached instance blog.in.action.entity.Member#010-1234-1234
```

마지막으로 `remove` 메소드에 대한 테스트를 수행한다. remove 메소드를 통해 엔티티를 삭제 상태로 만들고, 데이터베이스에서 삭제되는지 확인한다. 

1. 조회한 엔티티를 remove 메소드를 통해 삭제 상태로 만든다.
2. 트랜잭션을 커밋하고, 영속성 컨텍스트를 모두 정리한다.
3. find 메소드로 엔티티를 데이터베이스에서 다시 조회한다.
4. 조회된 엔티티가 없음을 확인한다.

```java
package blog.in.action.lifecycle;

import blog.in.action.entity.Member;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@Slf4j
@SpringBootTest(properties = {
        "spring.jpa.show-sql=true",
})
public class RemoveTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @BeforeEach
    void beforeEach() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = new Member();
            member.setId("010-1234-1234");
            member.setName("Junhyunny");
            em.persist(member);
            em.getTransaction().commit();
        } catch (Exception ex) {
            em.getTransaction().rollback();
            throw new RuntimeException(ex);
        } finally {
            em.close();
        }
    }

    void removeByIdAndClear(EntityManager em, String id) {
        em.getTransaction().begin();
        Member member = em.find(Member.class, id);
        em.remove(member);
        em.getTransaction().commit();
        em.clear();
    }

    @Test
    void entity_is_null_when_find_removed_entity() {
        EntityManager em = factory.createEntityManager();
        try {
            removeByIdAndClear(em, "010-1234-1234");

            Member member = em.find(Member.class, "010-1234-1234");

            assertThat(member, equalTo(null));
        } catch (Exception ex) {
            em.getTransaction().rollback();
            throw new RuntimeException(ex);
        } finally {
            em.close();
        }
    }
}
```

테스트는 정상적으로 통과하며, 다음과 같은 수행 로그를 남긴다.

- 테스트 시작 전 테스트 데이터를 삽입하면서 `insert` 쿼리가 수행된다.
- 테스트 초반에 `find` 메소드로 엔티티를 조회하면서 `select` 쿼리가 수행된다.
- `remove` 메소드로 엔티티를 삭제 상태로 만들고, 트랜잭션을 커밋하면 `delete` 쿼리가 수행된다.
- `find` 메소드로 다시 엔티티를 조회할 때 `select` 쿼리가 수행된다. 

```
Hibernate: insert into tb_member (name, id) values (?, ?)
Hibernate: select member0_.id as id1_0_0_, member0_.name as name2_0_0_ from tb_member member0_ where member0_.id=?
Hibernate: delete from tb_member where id=?
Hibernate: select member0_.id as id1_0_0_, member0_.name as name2_0_0_ from tb_member member0_ where member0_.id=?
```

## CLOSING

persist 메소드와 remove 메소드 호출 시점에 쿼리가 수행되지 않는 현상은 `JPA` 지연 쓰기(write-behind) 기능 때문이다. 관련된 내용은 다음 포스트에서 자세히 다룬다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-02-02-jpa-persistence-context>

#### RECOMMEND NEXT POSTS

- [Features of EntityManager][persistence-context-advantages-link]
- [JPA 플러쉬(flush)][jpa-flush-link]
- [JPA Clear][jpa-clear-link]

#### REFERENCE

- <https://gunlog.dev/JPA-Persistence-Context/>
- <https://gmlwjd9405.github.io/2019/08/06/persistence-context.html>

[java-persistence-api-link]: https://junhyunny.github.io/spring-boot/jpa/java-persistence-api/

[persistence-context-advantages-link]: https://junhyunny.github.io/spring-boot/jpa/junit/persistence-context-advantages/
[jpa-flush-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-flush/
[jpa-clear-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-clear/