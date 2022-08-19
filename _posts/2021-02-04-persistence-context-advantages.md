---
title: "영속성 컨텍스트(Persistence Context) 장점"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-08-22T01:30:00
---

<br>

⚠️ 해당 포스트는 2021년 8월 19일에 재작성되었습니다. (불필요 코드 제거)

👉 해당 포스트를 읽는데 도움을 줍니다.
- [트랜잭션 격리성(Transaction Isolation)][transaction-isolation-link]
- [JPA(Java Persistence API)][java-persistence-api-link]
- [JPA Persistence Context][jpa-persistence-context-link]

👉 이어서 읽기를 추천합니다.
- [JPA Flush][jpa-flush-link]
- [JPA Clear][jpa-clear-link]

## 0. 들어가면서

이번 글에서는 **`영속성 컨텍스트`**라는 별도의 영역을 통해 얻을 수 있는 이점이 무엇인지 영속성 컨텍스트가 지원하는 기능과 연관지어 알아보겠습니다. 
테스트 코드를 통해 포스트의 이해도를 함께 높여보겠습니다.

## 1. 1차 캐싱과 엔티티 동일성 보장
영속성 컨텍스트 내부에는 캐시가 존재합니다. 
영속 상태의 엔티티는 모두 이곳에 저장됩니다. 
영속 상태의 엔티티를 식별하기 위한 키로 @Id 애너테이션이 선언된 필드를 사용합니다. 
동일 트랜잭션 내에서 캐싱된 엔티티를 반환하기 때문에 엔티티의 동일성이 함께 보장됩니다. 

- 장점
    - 동일 트랜잭션 내 캐싱을 통해 성능이 향상됩니다.
    - **동일 트랜잭션 내 엔티티의 동일성은 `Repeatable Read` 수준의 트랜잭션 격리 수준이 보장됩니다.** ([트랜잭션 격리성(Transaction Isolation)][transaction-isolation-link])

### 1.1. 캐싱된 엔티티 조회 시나리오
1. 식별자 값을 이용해 엔티티를 조회합니다.
1. 캐싱된 엔티티가 있으므로 이를 반환합니다.

<p align="center"><img src="/images/persistence-context-advantages-1.JPG" width="75%"></p>
<center>conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2</center>

### 1.2. 캐싱되지 않은 엔티티 조회 시나리오
1. 식별자 값을 이용해 엔티티를 조회합니다.
1. 캐싱된 엔티티가 존재하지 않으므로 데이터베이스를 조회합니다.
1. 조회된 데이터를 신규 엔티티를 생성하여 캐싱합니다.
1. 신규 엔티티를 반환합니다.

<p align="center"><img src="/images/persistence-context-advantages-2.JPG" width="75%"></p>
<center>conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2</center>

### 1.3. 1차 캐싱 테스트
동일한 식별자(@Id, PK)를 가진 데이터를 조회하여 반환된 엔티티 객체가 동일한 메모리 주소를 가지는지 확인합니다.

```java
package blog.in.action.advantages;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import blog.in.action.entity.Member;
import lombok.extern.log4j.Log4j2;

@Log4j2
@SpringBootTest
public class CachingTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @BeforeEach
    private void beforeEach() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = em.find(Member.class, "01012341234");
            if (member == null) {
                member = new Member();
                member.setId("01012341234");
                member.setPassword("1234");
                List<String> authorities = new ArrayList<>();
                authorities.add("ADMIN");
                member.setAuthorities(authorities);
                member.setMemberName("Junhyunny");
                member.setMemberEmail("kang3966@naver.com");
                em.persist(member);
            }
            em.getTransaction().commit();
        } catch (Exception ex) {
            em.getTransaction().rollback();
            log.error("exception occurs", ex);
        } finally {
            em.close();
        }
    }

    @Test
    public void test() {
        EntityManager em = factory.createEntityManager();
        try {
            Member member = em.find(Member.class, "01012341234");
            Member cachedMember = em.find(Member.class, "01012341234");
            log.info("member 주소: " + System.identityHashCode(member) + ", cachedMember 주소: " + System.identityHashCode(cachedMember));
            assertTrue(member == cachedMember);
        } catch (Exception ex) {
            em.getTransaction().rollback();
            log.error("exception occurs", ex);
        } finally {
            em.close();
        }
    }
}
```

##### 1차 캐싱 테스트 결과

<p align="left"><img src="/images/persistence-context-advantages-3.JPG"></p>

```
Hibernate: select member0_.id as id1_0_0_, member0_.authorities as authorit2_0_0_, member0_.member_email as member_e3_0_0_, member0_.member_name as member_n4_0_0_, member0_.password as password5_0_0_ from tb_member member0_ where member0_.id=?
Hibernate: select member0_.id as id1_0_0_, member0_.authorities as authorit2_0_0_, member0_.member_email as member_e3_0_0_, member0_.member_name as member_n4_0_0_, member0_.password as password5_0_0_ from tb_member member0_ where member0_.id=?
2021-08-19 08:29:42.828  INFO 7224 --- [           main] blog.in.action.advantages.CachingTest    : member 주소: 415297573, cachedMember 주소: 415297573
```

## 2. 쓰기 지연(transactional write-behind)
EntityManager는 commit 직전까지 insert, update, delete 쿼리를 수행하지 않습니다. 
내부 `쓰기 지연 SQL 저장소`에 수행할 쿼리들을 모아두고 commit 시점에 모아둔 쿼리들을 데이터베이스로 전달하여 데이터를 저장합니다. 
이를 `트랜잭션을 지원하는 쓰기 지연(transactional write-behind)`이라고 합니다.

- 장점
    - 쓰기 지연은 모아둔 쿼리를 데이터베이스에 한 번에 전달해서 성능을 최적화할 수 있는 장점이 있습니다. 

### 2.1. 쓰기 지연 시나리오(insert)
1. memberA 객체를 영속성 컨텍스트에 저장합니다.
1. 이때 memberA 엔티티는 1차 캐싱, insert 쿼리는 쓰기 지연 SQL 저장소에 저장됩니다.
1. memberB 객체를 영속성 컨텍스트에 저장합니다.
1. 이때 memberB 엔티티는 1차 캐싱, insert 쿼리는 쓰기 지연 SQL 저장소에 저장됩니다.
1. commit 수행 시 쓰기 지연 SQL 저장소에 담긴 쿼리들을 데이터베이스로 전달하여 데이터를 저장합니다.

##### entityManager.persist(memberA) 수행

<p align="center"><img src="/images/persistence-context-advantages-5.JPG" width="75%"></p>
<center>conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2</center>

##### entityManager.persist(memberB) 수행

<p align="center"><img src="/images/persistence-context-advantages-6.JPG" width="75%"></p>
<center>conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2</center>

##### entityManager.getTransaction().commit() 수행

<p align="center"><img src="/images/persistence-context-advantages-7.JPG" width="75%"></p>
<center>conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2</center>

### 2.2. 쓰기 지연 테스트
persist 메소드 수행 전과 commit 이전, 이후에 로그를 남겨 insert 쿼리가 어느 시점에 수행되는지 확인해보겠습니다.

```java
package blog.in.action.advantages;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import blog.in.action.entity.Member;
import lombok.extern.log4j.Log4j2;

@Log4j2
@SpringBootTest
public class WriteBehindTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @BeforeEach
    private void beforeEach() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = em.find(Member.class, "01012341235");
            if (member != null) {
                em.remove(member);
            }
            member = em.find(Member.class, "01012341236");
            if (member != null) {
                em.remove(member);
            }
            em.getTransaction().commit();
        } catch (Exception ex) {
            em.getTransaction().rollback();
            log.error("exception occurs", ex);
        } finally {
            em.close();
        }
    }

    @Test
    public void test() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();

            // memberA 등록
            Member memberA = new Member();
            memberA.setId("01012341235");
            memberA.setPassword("1234");
            List<String> authorities = new ArrayList<>();
            authorities.add("ADMIN");
            memberA.setAuthorities(authorities);
            memberA.setMemberName("Junhyunny");
            memberA.setMemberEmail("kang3966@naver.com");

            log.info("memberA persist 수행");
            em.persist(memberA);

            // memberB 등록
            Member memberB = new Member();
            memberB.setId("01012341236");
            memberB.setPassword("1234");
            authorities = new ArrayList<>();
            authorities.add("MEMBER");
            memberB.setAuthorities(authorities);
            memberB.setMemberName("Inkyungee");
            memberB.setMemberEmail("inkyungee@naver.com");

            log.info("memberB persist 수행");
            em.persist(memberB);

            log.info("commit 수행 전");
            em.getTransaction().commit();
            log.info("commit 수행 후");

        } catch (Exception ex) {
            em.getTransaction().rollback();
            log.error("exception occurs", ex);
        } finally {
            em.close();
        }
    }
}
```

##### 쓰기 지연 테스트 결과

```
Hibernate: select member0_.id as id1_0_0_, member0_.authorities as authorit2_0_0_, member0_.member_email as member_e3_0_0_, member0_.member_name as member_n4_0_0_, member0_.password as password5_0_0_ from tb_member member0_ where member0_.id=?
Hibernate: select member0_.id as id1_0_0_, member0_.authorities as authorit2_0_0_, member0_.member_email as member_e3_0_0_, member0_.member_name as member_n4_0_0_, member0_.password as password5_0_0_ from tb_member member0_ where member0_.id=?
2021-08-19 08:32:08.078  INFO 2072 --- [           main] b.in.action.advantages.WriteBehindTest   : memberA persist 수행
2021-08-19 08:32:08.098  INFO 2072 --- [           main] b.in.action.advantages.WriteBehindTest   : memberB persist 수행
2021-08-19 08:32:08.098  INFO 2072 --- [           main] b.in.action.advantages.WriteBehindTest   : commit 수행 전
Hibernate: insert into tb_member (authorities, member_email, member_name, password, id) values (?, ?, ?, ?, ?)
Hibernate: insert into tb_member (authorities, member_email, member_name, password, id) values (?, ?, ?, ?, ?)
2021-08-19 08:32:08.116  INFO 2072 --- [           main] b.in.action.advantages.WriteBehindTest   : commit 수행 후
```

## 3. 변경 감지(dirty checking)
지난 [JPA Persistence Context][jpa-persistence-context-link] 포스트를 통해 영속성 컨텍스트에 저장된 객체의 멤버 값을 변경하였을 때 데이터베이스의 데이터가 변경되는 결과를 확인할 수 있었습니다. 
이는 영속성 컨텍스트가 지원하는 변경 감지(dirty checking) 기능 덕분입니다. 
영속성 컨텍스트에 저장된 엔티티들의 변경사항을 감지하여 데이터베이스에 이를 자동으로 반영합니다. 

- 장점
  - 지속적으로 바뀌는 비즈니스 요건 사항을 따라 매번 SQL을 변경할 필요가 없습니다.

### 3.1. 변경 감지 시나리오
1. 영속성 컨텍스트는 데이터베이스에서 조회할 때 엔티티의 모습을 스냅샷(snapshot) 형태로 저장해둡니다.
1. flush 메소드 호출 시 캐싱에 저장된 엔티티와 스냅샷에 저장된 엔티티의 모습이 다른 엔티티를 찾아 업데이트 쿼리를 만듭니다. 
1. 업데이트 쿼리는 쓰기 지연 SQL 저장소로 전달됩니다.
1. 쓰기 지연 SQL에 저장된 쿼리들을 데이터베이스로 전달하여 데이터를 저장합니다.

<p align="center"><img src="/images/persistence-context-advantages-8.JPG" width="75%"></p>
<center>conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2</center>

### 3.2. 변경 감지 테스트

```java
package blog.in.action.advantages;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import blog.in.action.entity.Member;
import lombok.extern.log4j.Log4j2;

@Log4j2
@SpringBootTest
public class DirtyCheckingTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @BeforeEach
    private void beforeEach() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = em.find(Member.class, "01012341234");
            if (member == null) {
                member = new Member();
                member.setId("01012341234");
                member.setPassword("1234");
                List<String> authorities = new ArrayList<>();
                authorities.add("ADMIN");
                member.setAuthorities(authorities);
                member.setMemberName("Junhyunny");
                member.setMemberEmail("kang3966@naver.com");
                em.persist(member);
            }
            em.getTransaction().commit();
        } catch (Exception ex) {
            em.getTransaction().rollback();
            log.error("exception occurs", ex);
        } finally {
            em.close();
        }
    }

    @Test
    public void test() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = em.find(Member.class, "01012341234");
            if (member != null) {
                // 권한 변경
                List<String> authorities = new ArrayList<>(member.getAuthorities());
                authorities.add("MEMBER");
                authorities.add("TESTER");
                member.setAuthorities(authorities);
            }
            em.getTransaction().commit();
        } catch (Exception ex) {
            em.getTransaction().rollback();
            log.error("exception occurs", ex);
        } finally {
            em.close();
        }
    }
}
```

##### 변경 감지 테스트 결과
- 멤버 변수의 값을 변경함으로 데이터베이스에 저장된 데이터가 함께 변경됩니다.

<p align="left"><img src="/images/persistence-context-advantages-9.JPG"></p>

### 3.3. 변경 감지 디버깅
변경 감지(dirty checking)과 관련하여 어떤 메커니즘을 통해 변경된 데이터를 탐색하는지 디버깅해보았습니다. 

#### 3.3.1. dirty field 탐색
- FlushEntityEvent 객체를 만드는 시점에 dirty field 탐색을 수행
- SingleTableEntityPersister 클래스 findDirty 메소드
- 해당 메소드에서 변경된 필드의 인덱스 번호를 반환합니다.

<p align="center"><img src="/images/persistence-context-advantages-10.JPG"></p>

#### 3.3.2. session의 actionQueue에 EntityUpdateAction 객체 추가
- DefaultFlushEntityEventListener 클래스 scheduleUpdate 메소드
- 변경된 값이 있을 때 업데이트를 수행할 수 있도록 session의 actionQueue에 Action 추가

<p align="center"><img src="/images/persistence-context-advantages-11.JPG"></p>

#### 3.3.3. ActionQueue.ExecutableList에 담긴 Action 수행
- actionQueue 객체는 수행해야할 ExecutableList를 지니고 있습니다.
- ExecutableList에 담긴 EntityUpdateAction을 수행합니다.
- ActionQueue 클래스 executeActions 메소드

<p align="center"><img src="/images/persistence-context-advantages-12.JPG"></p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-02-04-persistence-context-advantages>

#### REFERENCE
- [conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2][reference-blog-link]

[reference-blog-link]: https://velog.io/@conatuseus/%EC%98%81%EC%86%8D%EC%84%B1-%EC%BB%A8%ED%85%8D%EC%8A%A4%ED%8A%B8-2-ipk07xrnoe

[transaction-isolation-link]: https://junhyunny.github.io/information/transcation-isolation/
[java-persistence-api-link]: https://junhyunny.github.io/spring-boot/jpa/java-persistence-api/
[jpa-persistence-context-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-persistence-context/

[jpa-flush-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-flush/
[jpa-clear-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-clear/