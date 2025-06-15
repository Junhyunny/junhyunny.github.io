---
title: "Features of EntityManager"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-08-22T01:30:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Transaction Isolation][transaction-isolation-link]
* [JPA(Java Persistence API)][java-persistence-api-link]
* [PersistenceContext and Entity Lifecycle][jpa-persistence-context-link]

## 0. 들어가면서

> `EntityManager`를 통해 엔티티들을 관리하는 이유는 무엇일까?<br/>
> `EntityManager`는 영속성 컨텍스트라는 별도 영역을 만들어 사용할까?

이번 포스트에선 `EntityManager`와 영속성 컨텍스트의 특징들과 이로 인해 생기는 장점들에 대해 정리하였습니다. 

## 1. 1차 캐싱(Caching)

영속성 컨텍스트는 내부적으로 자신이 관리하는 엔티티들을 저장하기 위해 맵(map) 자료구조를 가지는 변수를 지니고 있습니다. 
해당 변수에 자신이 관리 중인 엔티티를 보관하고, 필요한 경우 동일한 트랜잭션 내에선 꺼내어 재사용합니다. 
고유한 엔티티 여부를 파악하기 위해 `EntityKey` 클래스를 만들어 사용합니다. 
`EntityKey` 클래스는 `@Id` 애너테이션으로 표시한 엔티티의 필드들을 사용하여 만듭니다. 

캐싱 기능을 통해 다음과 같은 이점을 얻을 수 있습니다. 

* 캐싱을 사용하여 성능이 향상됩니다.
* 동일 트랜잭션 내에서 엔티티의 동일성은 `Repeatable Read` 수준의 트랜잭션 격리 수준이 보장됩니다.

### 1.1. Process of Finding Cached Entity

1. 식별자 값을 이용해 엔티티를 조회합니다.
1. 캐싱된 엔티티가 있으므로 이를 반환합니다.

<p align="center">
    <img src="/images/persistence-context-advantages-1.JPG" width="75%" class="image__border">
</p>
<center>conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2</center>

### 1.2. Process of Finding Not Cached Entity

1. 식별자 값을 이용해 엔티티를 조회합니다.
1. 캐싱된 엔티티가 존재하지 않으므로 데이터베이스를 조회합니다.
1. 조회된 데이터를 신규 엔티티를 생성하여 캐싱합니다.
1. 신규 엔티티를 반환합니다.

<p align="center">
    <img src="/images/persistence-context-advantages-2.JPG" width="75%" class="image__border">
</p>
<center>conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2</center>

### 1.3. 1차 캐싱 테스트

동일한 식별자를 가진 엔티티를 두 번 조회했을 때 같은 객체인지 주소와 참조 값 비교를 통해 확인합니다.

* `member` 객체와 재조회한 `cachedMember` 객체의 참조 값이 같은지 확인합니다.
* `member` 객체와 재조회한 `cachedMember` 객체가 같은지 확인합니다.
* `member` 객체와 재조회한 `cachedMember` 객체의 주소 값이 같은지 확인합니다.

```java
package blog.in.action.advantages;

import blog.in.action.entity.Member;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@Log4j2
@SpringBootTest(properties = {"spring.jpa.show-sql=true"})
public class CachingTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @BeforeEach
    private void beforeEach() {
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
    public void two_members_are_same_object() {
        EntityManager em = factory.createEntityManager();
        try {

            Member member = em.find(Member.class, "010-1234-1234");
            Member cachedMember = em.find(Member.class, "010-1234-1234");

            assertThat(member == cachedMember, equalTo(true));
            assertThat(member, equalTo(cachedMember));
            assertThat(System.identityHashCode(member), equalTo(System.identityHashCode(cachedMember)));

        } catch (Exception ex) {
            em.getTransaction().rollback();
            throw new RuntimeException(ex);
        } finally {
            em.close();
        }
    }
}
```

##### 테스트 결과

테스트는 정상적으로 통과하며, 다음과 같은 로그를 확인할 수 있습니다. 

* 테스트를 위한 데이터를 테스트 시작 전에 `insert` 합니다. 
* 처음 엔티티만 조회하므로 `select` 쿼리는 1회 수행됩니다.

```
Hibernate: insert into tb_member (name, id) values (?, ?)
Hibernate: select member0_.id as id1_0_0_, member0_.name as name2_0_0_ from tb_member member0_ where member0_.id=?
```

## 2. 쓰기 지연(transactional write-behind)

`EntityManager`는 커밋(commit) 직전까지 `insert`, `update`, `delete` 쿼리를 수행하지 않습니다. 
내부에 수행할 쿼리들을 모아두고 커밋 시점에 모아둔 쿼리들을 데이터베이스로 전달하여 데이터를 저장합니다. 
`쓰기 지연 SQL 저장소`는 `ActionQueue` 클래스 타입의 변수이며, 그림 표현과 다르게 영속성 컨텍스트가 아닌 `Hibernate`가 제공하는 `EntityManager` 구현체 클래스에서 직접 관리합니다.  

* org.hibernate.internal.SessionImpl 클래스 참조

커밋하는 시점까지 쓰기 연산을 지연하면 다음과 같은 이점을 얻을 수 있습니다. 

* 쓰기 지연은 모아둔 쿼리를 데이터베이스에 한 번에 전달해서 성능을 최적화할 수 있는 장점이 있습니다. 

### 2.1. Process of Write Behind

1. 클라이언트가 `memberA` 객체를 영속성 컨텍스트에 저장합니다.
1. `memberA` 엔티티는 1차 캐싱, insert 쿼리는 쓰기 지연 SQL 저장소에 저장됩니다.
1. 클라이언트가 `memberB` 객체를 영속성 컨텍스트에 저장합니다.
1. `memberB` 엔티티는 1차 캐싱, insert 쿼리는 쓰기 지연 SQL 저장소에 저장됩니다.
1. 커밋 수행 시 쓰기 지연 SQL 저장소에 담긴 쿼리들을 데이터베이스로 전달하여 데이터를 저장합니다.

<p align="center">
    <img src="/images/persistence-context-advantages-4.JPG" width="100%" class="image__border">
</p>
<center>conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2</center>

### 2.2. 쓰기 지연 테스트

검증(assert) 방법이 애매하여 쉽게 로그를 통해 확인하였습니다. 

* `before commit` 로그와 `after commit` 로그 사이에 `insert` 쿼리가 2회 실행되는 것을 확인합니다.

```java
package blog.in.action.advantages;

import blog.in.action.entity.Member;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;

@Log4j2
@SpringBootTest(properties = {"spring.jpa.show-sql=true"})
public class WriteBehindTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @Test
    public void test() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();

            Member junhyunny = new Member();
            junhyunny.setId("010-1234-1234");
            junhyunny.setName("Junhyunny");

            Member jua = new Member();
            jua.setId("010-1235-1235");
            jua.setName("Jua");

            em.persist(junhyunny);
            em.persist(jua);

            log.info("before commit");
            em.getTransaction().commit();
            log.info("after commit");

        } catch (Exception ex) {
            em.getTransaction().rollback();
            throw new RuntimeException(ex);
        } finally {
            em.close();
        }
    }
}
```

##### 테스트 결과

테스트는 정상적으로 통과하며, 다음과 같은 로그를 확인할 수 있습니다. 

* 커밋 시작 전, 후에 찍은 로그 사이에 `insert` 쿼리가 2회 실행됩니다.

```
2022-09-27 01:47:00.018  INFO 69048 --- [           main] b.in.action.advantages.WriteBehindTest   : before commit
Hibernate: insert into tb_member (name, id) values (?, ?)
Hibernate: insert into tb_member (name, id) values (?, ?)
2022-09-27 01:47:00.037  INFO 69048 --- [           main] b.in.action.advantages.WriteBehindTest   : after commit
```

## 3. 변경 감지(dirty checking)

`EntityManager`가 관리 중인 엔티티의 상태가 변경되면, 트랜잭션을 커밋할 때 자동으로 `update` 쿼리가 수행됩니다. 
`EntityManager`가 `FlushEventListener` 구현체를 통해 플러시(flush) 작업을 수행하는 시점에 `EntityPersister` 구현체 클래스를 통해 변경 감지가 발생합니다. 

* org.hibernate.persister.entity.EntityPersister 인터페이스 findDirty 메소드의 오버라이드 참조

커밋 시점에 변경이 감지된 엔티티들의 업데이트 이벤트는 `ActionQueue` 객체에 담겨 마지막에 모두 실행됩니다. 
변경 감지를 통해 다음과 같은 이점을 얻을 수 있습니다. 

* 지속적으로 바뀌는 비즈니스 요건 사항을 따라 매번 SQL을 변경할 필요가 없습니다.

### 3.1. Process of Dirty Checking

1. 영속성 컨텍스트는 데이터베이스에서 조회할 때 엔티티의 모습을 스냅샷(snapshot) 형태로 저장해둡니다.
1. flush 메소드 호출 시 캐싱에 저장된 엔티티와 스냅샷에 저장된 엔티티의 모습이 다른 엔티티를 찾아 업데이트 쿼리를 만듭니다. 
1. 업데이트 쿼리는 쓰기 지연 SQL 저장소로 전달됩니다.
1. 쓰기 지연 SQL에 저장된 쿼리들을 데이터베이스로 전달하여 데이터를 저장합니다.

<p align="center">
    <img src="/images/persistence-context-advantages-5.JPG" width="75%" class="image__border">
</p>
<center>conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2</center>

### 3.2. 변경 감지 테스트

변경 감지 테스트는 다음과 같이 수행하였습니다. 

* 매 테스트마다 테스팅을 위한 멤버를 추가합니다.
* 기존에 존재하는 테스트 데이터를 조회합니다.
* 이름(name) 필드 값을 변경합니다.
* 트랜잭션을 커밋하고 영속성 컨텍스트에 저장된 데이터를 정리합니다.
* 해당 데이터를 다시 조회했을 때 이름이 `Jua`로 바뀌어 있는지 검증합니다.

```java
package blog.in.action.advantages;

import blog.in.action.entity.Member;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@Log4j2
@SpringBootTest(properties = {"spring.jpa.show-sql=true"})
public class DirtyCheckingTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @BeforeEach
    private void beforeEach() {
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
    public void member_name_is_changed_because_of_dirty_check() {
        EntityManager em = factory.createEntityManager();
        try {

            em.getTransaction().begin();
            Member member = em.find(Member.class, "010-1234-1234");
            member.setName("Jua");
            em.getTransaction().commit();
            em.clear();

            Member target = em.find(Member.class, "010-1234-1234");
            assertThat(target.getName(), equalTo("Jua"));

        } catch (Exception ex) {
            em.getTransaction().rollback();
            throw new RuntimeException(ex);
        } finally {
            em.close();
        }
    }
}
```

##### 테스트 결과

테스트는 정상적으로 통과하며, 다음과 같은 로그를 확인할 수 있습니다. 

* 테스트를 위한 멤버를 추가하기 위해 `insert` 쿼리를 합니다.
* 기존에 저장된 데이터 조회를 위해 `select` 쿼리를 수행 합니다.
* 엔티티의 변경을 확인한 후 `update` 쿼리를 수행합니다.
* 검증문을 위해 객체를 다시 조회합니다.

```
Hibernate: insert into tb_member (name, id) values (?, ?)
Hibernate: select member0_.id as id1_0_0_, member0_.name as name2_0_0_ from tb_member member0_ where member0_.id=?
Hibernate: update tb_member set name=? where id=?
Hibernate: select member0_.id as id1_0_0_, member0_.name as name2_0_0_ from tb_member member0_ where member0_.id=?
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-02-04-persistence-context-advantages>

#### RECOMMEND NEXT POSTS

* [JPA 플러쉬(flush)][jpa-flush-link]
* [JPA Clear][jpa-clear-link]

#### REFERENCE

* [conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2][reference-blog-link]

[reference-blog-link]: https://velog.io/@conatuseus/%EC%98%81%EC%86%8D%EC%84%B1-%EC%BB%A8%ED%85%8D%EC%8A%A4%ED%8A%B8-2-ipk07xrnoe

[transaction-isolation-link]: https://junhyunny.github.io/information/transcation-isolation/
[java-persistence-api-link]: https://junhyunny.github.io/spring-boot/jpa/java-persistence-api/
[jpa-persistence-context-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-persistence-context/

[jpa-flush-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-flush/
[jpa-clear-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-clear/