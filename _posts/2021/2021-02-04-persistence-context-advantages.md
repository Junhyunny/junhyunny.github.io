---
title: "EntityManager 특징과 영속성 컨텍스트 장점"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2025-06-27T21:30:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [트랜잭션 격리성(transaction isolation) 특징][transaction-isolation-link]
- [JPA(Java Persistence API)][java-persistence-api-link]
- [영속성 컨텍스트(persistent context)와 엔티티(entity) 생명주기][jpa-persistence-context-link]

## 0. 들어가면서

이번 글에서는 `EntityManager`와 영속성 컨텍스트의 특징들로 인해 생기는 장점들에 대해 정리하였다. 

## 1. 1차 캐싱(Caching)

영속성 컨텍스트는 내부적으로 자신이 관리하는 엔티티들을 저장하기 위해 맵(map) 자료구조를 갖는다. 해당 변수에 자신이 관리 중인 엔티티를 보관하고, 동일한 트랜잭션 내에서는 필요한 경우 꺼내어 재사용한다. 고유한 엔티티 여부를 파악하기 위해 `EntityKey` 클래스를 만들어 사용한다. EntityKey 클래스는 `@Id` 애너테이션으로 표시한 엔티티의 필드들을 사용하여 만든다.  

캐싱 기능을 통해 다음과 같은 이점을 얻을 수 있다.  

- 캐싱을 사용하여 성능이 향상된다.
- 동일 트랜잭션 내에서 엔티티의 동일성은 `Repeatable Read` 수준의 트랜잭션 격리 수준이 보장된다.

다음과 같은 과정을 통해 캐싱된 엔티티를 찾는다.

1. 식별자 값을 이용해 엔티티를 조회한다.
2. 캐싱된 엔티티가 있으므로 이를 반환한다.

<div align="center">
  <img src="/images/posts/2021/persistence-context-advantages-01.png" width="80%" class="image__border">
</div>
<center>conatuseus님 블로그 - [JPA] 영속성 컨텍스트 #2</center>

<br/>

캐싱된 엔티티가 아닌 경우엔 다음과 같은 과정을 통해 엔티티를 찾는다.

1. 식별자 값을 이용해 엔티티를 조회한다.
2. 캐싱된 엔티티가 존재하지 않으므로 데이터베이스를 조회한다.
3. 조회된 데이터를 신규 엔티티로 생성하여 캐싱한다.
4. 신규 엔티티를 반환한다.

<div align="center">
  <img src="/images/posts/2021/persistence-context-advantages-02.png" width="80%" class="image__border">
</div>
<center>conatuseus님 블로그 - [JPA] 영속성 컨텍스트 #2</center>

<br/>

실제로 1차 캐싱이 잘 동작하는지 테스트를 통해 확인해보자. 동일한 식별자를 가진 엔티티를 두 번 조회했을 때 같은 객체인지 주소와 참조 값 비교를 통해 확인한다.

- `member` 객체와 재조회한 `cachedMember` 객체의 참조 값이 같은지 확인한다.
- `member` 객체와 재조회한 `cachedMember` 객체가 같은지 확인한다.
- `member` 객체와 재조회한 `cachedMember` 객체의 주소 값이 같은지 확인한다.

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

테스트는 정상적으로 통과하며, 다음과 같은 로그를 확인할 수 있다.  

- 테스트를 위한 데이터를 테스트 시작 전에 `insert` 한다. 
- 처음 엔티티만 조회하므로 `select` 쿼리는 1회 수행된다.

```
Hibernate: insert into tb_member (name, id) values (?, ?)
Hibernate: select member0_.id as id1_0_0_, member0_.name as name2_0_0_ from tb_member member0_ where member0_.id=?
```

## 2. 쓰기 지연(transactional write-behind)

EntityManager는 커밋(commit) 직전까지 `insert`, `update`, `delete` 쿼리를 수행하지 않는다. 내부에 수행할 쿼리들을 모아두고, 커밋 시점에 모아둔 쿼리들을 실행하여 데이터를 저장한다. `쓰기 지연 SQL 저장소`는 ActionQueue 클래스 타입의 변수이며, 그림 표현과 다르게 영속성 컨텍스트가 아닌 `Hibernate`가 제공하는 EntityManager 구현체 클래스에서 직접 관리한다.(`org.hibernate.internal.SessionImpl` 클래스 참조) 커밋하는 시점까지 쓰기 연산을 지연하면 쓰기 지연은 모아둔 쿼리를 데이터베이스에 한 번에 전달해서 성능을 최적화할 수 있다.

쓰기 지연 작업은 다음과 같은 과정을 통해 수행된다.

1. 클라이언트가 `memberA` 객체를 영속성 컨텍스트에 저장한다.
2. `memberA` 엔티티는 1차 캐싱되며, insert 쿼리는 쓰기 지연 SQL 저장소에 저장된다.
3. 클라이언트가 `memberB` 객체를 영속성 컨텍스트에 저장한다.
4. `memberB` 엔티티는 1차 캐싱되며, insert 쿼리는 쓰기 지연 SQL 저장소에 저장된다.
5. 커밋 수행 시 쓰기 지연 SQL 저장소에 담긴 쿼리들을 데이터베이스로 전달하여 데이터를 저장한다.

<div align="center">
  <img src="/images/posts/2021/persistence-context-advantages-04.png" width="100%" class="image__border">
</div>
<center>conatuseus님 블로그 - [JPA] 영속성 컨텍스트 #2</center>

<br/>

1차 캐싱과 동일하게 테스트 코드를 작성한다. 검증(assert) 방법은 애매하기 때문에 로그를 통해 결과를 확인하였다. `before commit` 로그와 `after commit` 로그 사이에 `insert` 쿼리가 2회 실행되는 것을 확인한다.

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

테스트는 정상적으로 통과하며, 다음과 같은 로그를 확인할 수 있다.  

- 커밋 시작 전, 후에 찍은 로그 사이에 `insert` 쿼리가 2회 실행된다.

```
2022-09-27 01:47:00.018  INFO 69048 --- [           main] b.in.action.advantages.WriteBehindTest   : before commit
Hibernate: insert into tb_member (name, id) values (?, ?)
Hibernate: insert into tb_member (name, id) values (?, ?)
2022-09-27 01:47:00.037  INFO 69048 --- [           main] b.in.action.advantages.WriteBehindTest   : after commit
```

## 3. 변경 감지(dirty checking)

EntityManager가 관리 중인 엔티티의 상태가 변경되면, 트랜잭션을 커밋할 때 자동으로 `update` 쿼리가 수행된다. EntityManager가 `FlushEventListener` 구현체를 통해 플러시(flush) 작업을 수행하는 시점에 `EntityPersister` 구현체 클래스를 통해 변경 감지가 발생한다. 커밋 시점에 변경이 감지된 엔티티들의 업데이트 이벤트는 ActionQueue 객체에 담겨 마지막에 모두 실행된다. 변경 감지를 수행하면 지속적으로 바뀌는 비즈니스 요건 사항에 따라 매번 SQL을 변경할 필요가 없다.

변경 감지는 다음과 같은 과정을 통해 수행된다.

1. 영속성 컨텍스트는 데이터베이스에서 조회할 때 엔티티의 모습을 스냅샷(snapshot) 형태로 저장해 둔다.
2. flush 메소드 호출 시 캐싱에 저장된 엔티티와 스냅샷에 저장된 엔티티의 모습이 다른 엔티티를 찾아 업데이트 쿼리를 만든다.  
3. 업데이트 쿼리는 쓰기 지연 SQL 저장소로 전달된다.
4. 쓰기 지연 SQL에 저장된 쿼리들을 데이터베이스로 전달하여 데이터를 저장한다.

<div align="center">
  <img src="/images/posts/2021/persistence-context-advantages-05.png" width="80%" class="image__border">
</div>
<center>conatuseus님 블로그 - [JPA] 영속성 컨텍스트 #2</center>

아래 테스트 코드를 통해 변경 감지가 잘 수행되는지 확인한다.

- 기존에 존재하는 테스트 데이터를 조회한다.
- 이름(name) 필드 값을 변경한다.
- 트랜잭션을 커밋하고 영속성 컨텍스트에 저장된 데이터를 정리한다.
- 해당 데이터를 다시 조회했을 때 이름이 `Jua`로 바뀌어 있는지 검증한다.

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

테스트는 정상적으로 통과하며, 다음과 같은 로그를 확인할 수 있다.  

- 테스트를 위한 멤버를 추가하기 위해 `insert` 쿼리를 수행한다.
- 기존에 저장된 데이터 조회를 위해 `select` 쿼리를 수행한다.
- 엔티티의 변경을 확인한 후 `update` 쿼리를 수행한다.
- 검증문을 위해 객체를 다시 조회한다.

```
Hibernate: insert into tb_member (name, id) values (?, ?)
Hibernate: select member0_.id as id1_0_0_, member0_.name as name2_0_0_ from tb_member member0_ where member0_.id=?
Hibernate: update tb_member set name=? where id=?
Hibernate: select member0_.id as id1_0_0_, member0_.name as name2_0_0_ from tb_member member0_ where member0_.id=?
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-02-04-persistence-context-advantages>

#### RECOMMEND NEXT POSTS

- [JPA 플러쉬(flush)][jpa-flush-link]
- [JPA 클리어(clear)][jpa-clear-link]

#### REFERENCE

- [conatuseus님 블로그 - [JPA] 영속성 컨텍스트 #2][reference-blog-link]

[reference-blog-link]: https://velog.io/@conatuseus/%EC%98%81%EC%86%8D%EC%84%B1-%EC%BB%A8%ED%85%8D%EC%8A%A4%ED%8A%B8-2-ipk07xrnoe
[transaction-isolation-link]: https://junhyunny.github.io/information/transcation-isolation/
[java-persistence-api-link]: https://junhyunny.github.io/spring-boot/jpa/java-persistence-api/
[jpa-persistence-context-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-persistence-context/
[jpa-flush-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-flush/
[jpa-clear-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-clear/