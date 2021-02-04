---
title: "영속성 컨텍스트(Persistence Context) 사용시 이점"
search: false
category:
  - spring
  - jpa
  - database
last_modified_at: 2021-02-04T00:00:00
---

# 영속성 컨텍스트(Persistence Context) 사용시 이점<br>

지난 [JPA Persistence Context][persistence-context-blogLink]글을 통해 영속성 컨텍스트 개념에 대해 알아보았습니다. 
Entity Lifecycle 개념을 통해 어떤 식으로 엔티티가 저장, 변경, 삭제되는지 알아보았습니다.<br>
이번 글에서는 **`영속성 컨텍스트`**라는 별도의 영역을 통해 얻을 수 있는 이점을 영속성 컨텍스트가 지원하는 기능에 대한 설명을 통해 알아보도록 하겠습니다. 
테스트 코드를 작성하여 영속성 컨텍스트가 지원하는 기능의 이해도를 높여보도록 하겠습니다.

## 영속성 컨텍스트 지원 기능
### 1차 캐싱과 엔티티 동일성 보장
영속성 컨텍스트 내부에는 캐시가 존재합니다. 
영속 상태의 엔티티는 모두 이곳에 저장됩니다. 
영속 상태의 엔티티를 식별하기 위한 키로 @Id 애너테이션이 선언된 필드를 사용합니다. 
동일 트랜잭션에서 캐싱된 엔티티를 반환하기 때문에 엔티티의 동일성이 함께 보장됩니다. 

- 장점
  - 동일 트랜잭션 내 캐싱을 통해 성능이 향상됩니다.<br>
  - **동일 트랜잭션 내 엔티티의 동일성은 `Repeatable Read` 수준의 트랜잭션 격리 수준이 보장합니다.**([트랜잭션 격리성(Transaction Isolation)][transaction-isolation-blogLink])

#### [캐싱된 엔티티 조회 시나리오]
1. 식별자 값을 이용해 엔티티를 조회합니다.
1. 캐싱된 엔티티가 있으므로 이를 반환합니다.
<p align="center"><img src="/images/persistence-context-advantages-1.JPG" width="550"></p>
<center>이미지 출처, conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2</center><br>

#### [캐싱되지 않은 엔티티 조회 시나리오]
1. 식별자 값을 이용해 엔티티를 조회합니다.
1. 캐싱된 엔티티가 존재하지 않으므로 데이터베이스를 조회합니다.
1. 조회된 데이터를 신규 엔티티를 생성하여 캐싱합니다.
1. 신규 엔티리를 반환합니다.
<p align="center"><img src="/images/persistence-context-advantages-2.JPG" width="550"></p>
<center>이미지 출처, conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2</center><br>

#### 1차 캐싱 테스트
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
- Junit 테스트 통과 및 관련 로그
<p align="left"><img src="/images/persistence-context-advantages-3.JPG" width="550"></p>
<p align="center"><img src="/images/persistence-context-advantages-4.JPG"></p>

### 쓰기 지연(transactional write-behind)
EntityManager는 commit 직전까지 insert, update, delete 쿼리를 수행하지 않습니다. 
내부 `쓰기 지연 SQL 저장소`에 수행할 쿼리들을 모아두고 commit 시점에 모아둔 쿼리들을 데이터베이스로 전달하여 데이터를 저장합니다. 
이를 `트랜잭션을 지원하는 쓰기 지연(transactional write-behind)`이라고 합니다.

- 장점
  - 쓰기 지연은 모아둔 쿼리를 데이터베이스에 한 번에 전달해서 성능을 최적화할 수 있는 장점이 있습니다. 

#### 쓰기 지연 시나리오(insert)
1. memberA 객체를 영속성 컨텍스트에 저장합니다.
1. 이때 memberA 엔티티는 1차 캐싱, insert 쿼리는 쓰기 지연 SQL 저장소에 저장됩니다.
1. memberB 객체를 영속성 컨텍스트에 저장합니다.
1. 이때 memberB 엔티티는 1차 캐싱, insert 쿼리는 쓰기 지연 SQL 저장소에 저장됩니다.
1. commit 수행 시 쓰기 지연 SQL 저장소에 담긴 쿼리들을 데이터베이스로 전달하여 데이터를 저장합니다.

##### entityManager.persist(memberA) 수행
<p align="center"><img src="/images/persistence-context-advantages-5.JPG" width="550"></p>
<center>이미지 출처, conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2</center><br>

##### entityManager.persist(memberB) 수행
<p align="center"><img src="/images/persistence-context-advantages-6.JPG" width="550"></p>
<center>이미지 출처, conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2</center><br>

##### entityManager.getTransaction().commit() 수행
<p align="center"><img src="/images/persistence-context-advantages-7.JPG" width="550"></p>
<center>이미지 출처, conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2</center><br>

#### 쓰기 지연 테스트
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
- 관련 로그
<p align="center"><img src="/images/persistence-context-advantages-8.JPG"></p>

### 변경 감지(dirty checking)
지난 [JPA Persistence Context][persistence-context-blogLink]글에서 영속성 컨텍스트에 저장된 객체의 멤버 변수 값들을 변경하기만 하였음에도 데이터가 변경되는 결과를 확인할 수 있었습니다. 
이는 영속성 컨텍스트가 지원하는 변경 감지(dirty checking) 기능 덕분입니다. 
영속성 컨텍스트에 저장된 엔티티들의 변경 사항을 감지하여 데이터베이스에 이를 자동으로 반영합니다. 

- 장점
  - 지속적으로 바뀌는 비즈니스 요건 사항을 따라 매번 SQL을 변경할 필요가 없습니다.

#### 변경 감지 시나리오
1. 영속성 컨텍스트는 데이터베이스에서 조회할 때 엔티티의 모습을 스냅샷(snapshot) 형태로 저장해둡니다.
1. flush 메소드 호출 시 캐싱에 저장된 엔티티와 스냅샷에 저장된 엔티티의 모습이 다른 엔티티를 찾아 업데이트 쿼리를 만듭니다. 
1. 업데이트 쿼리는 쓰기 지연 SQL 저장소로 전달됩니다.
1. 쓰기 지연 SQL에 저장된 쿼리들을 데이터베이스로 전달하여 데이터를 저장합니다.
<p align="center"><img src="/images/persistence-context-advantages-9.JPG" width="550"></p>
<center>이미지 출처, conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2</center><br>

#### 변경 감지 테스트

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
- 데이터베이스 쿼리 조회 결과
<p align="left"><img src="/images/persistence-context-advantages-10.JPG" width="550"></p>

#### 변경 감지 디버깅
변경 감지(dirty checking)과 관련하여 어떤 메커니즘을 통해 변경된 데이터를 탐색하는지 디버깅해보았습니다. 

##### dirty field 탐색
- FlushEntityEvent 객체를 만드는 시점에 dirty field 탐색을 수행
- SingleTableEntityPersister 클래스 findDirty 메소드
- 해당 메소드에서 변경된 필드의 인덱스 번호를 반환합니다.
<p align="center"><img src="/images/persistence-context-advantages-11.JPG"></p>

##### session의 actionQueue에 EntityUpdateAction 객체 추가
- DefaultFlushEntityEventListener 클래스 scheduleUpdate 메소드
- 변경된 값이 있으므로 업데이트를 수행할 수 있도록 session의 actionQueue에 Action 추가
<p align="center"><img src="/images/persistence-context-advantages-12.JPG"></p>

##### ActionQueue.ExecutableList에 담긴 Action 수행
- actionQueue 객체는 수행해야할 ExecutableList를 지니고 있습니다.
- ExecutableList에 담긴 EntityUpdateAction을 수행합니다.
- ActionQueue 클래스 executeActions 메소드
<p align="center"><img src="/images/persistence-context-advantages-13.JPG"></p>

## OPINION
영속성 컨텍스트의 기능과 이를 통해 얻을 수 있는 장점에 대해서 이야기해보았습니다. 
마지막에 변경 감지(dirty chekcing)가 어떤 식으로 이루어지는지 궁금하여 디버깅한 결과까지 함께 첨부하였습니다. 
해당 테스트 코드는 [github link][github-link]에서 확인하실 수 있습니다.

#### 참조글
- [conatuseus님 블로그-[JPA] 영속성 컨텍스트 #2][reference-blogLink]

[reference-blogLink]: https://velog.io/@conatuseus/%EC%98%81%EC%86%8D%EC%84%B1-%EC%BB%A8%ED%85%8D%EC%8A%A4%ED%8A%B8-2-ipk07xrnoe
[persistence-context-blogLink]: https://junhyunny.github.io/spring/jpa/database/junit/jpa-persistence-context/
[transaction-isolation-blogLink]: https://junhyunny.github.io/information/database/transcation-isolation/
[github-link]: https://github.com/Junhyunny/action-in-blog/tree/82f8467916fe49549f2b98952fd6548ab567661d