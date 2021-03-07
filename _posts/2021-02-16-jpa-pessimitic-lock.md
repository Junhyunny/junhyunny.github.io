---
title: "JPA Pessimistic Lock 구현"
search: false
category:
  - spring
  - database
  - lock
  - jpa
  - junit
last_modified_at: 2021-02-16T00:00:00
---

<br>

[Lock Mechanism][lock-mechanism-blogLink] 포스트에서 언급한 Pessimistic Lock 방법을 구현해보도록 하겠습니다. 
Pessimistic Lock이 어떤 Locking 방법인지 궁금하신 분들은 지난 포스트를 참고해주시기 바랍니다. 
Pessimistic Lock에 대한 핵심 내용만 다시 정리하고, 글 작성을 이어나가도록 하겠습니다. 

##### **`Pessimistic Lock`**
> 트랜잭션 충돌을 예상하고 미리 데이터에 대한 LOCK을 점유하는 비관적인 LOCK<br>
> 트랜잭션이 데이터에 대한 LOCK을 선점하기 때문에 다른 트랜잭션들의 지연(WAIT)을 유발할 수 있습니다.

## JPA는 Pessimistic Lock을 어떻게 제공하는가?
짧은 시간 차이로 서로 다른 트랜잭션이 동일 데이터에 대해 업데이트하는 테스트 코드를 작성하였습니다. 
테스트는 JpaRepository Interface와 EntityManager를 사용한 두 가지 방법을 준비하였습니다. 

두 테스트의 시나리오는 동일하며 아래와 같습니다.
1. test() 메소드에서 2개의 스레드를 만들어 실행
1. 각 스레드 별로 대기하는 시간을 다르게 부여
1. LOCK을 먼저 선점한 트랜잭션이 끝날때까지 후순 트랜잭션의 데이터 조회가 지연되는지 확인 
1. 후순 트랜잭션으로 업데이트 된 결과가 데이터베이스에 반영되었는지 확인

### Lock Modes
세가지 모드가 있으며, 일반적으로 생각하는 Pessimistic Lock은 **PESSIMISTIC_WRITE** 모드입니다. 
- **PESSIMISTIC_READ** – allows us to obtain a shared lock and prevent the data from being updated or deleted
- **PESSIMISTIC_WRITE** – allows us to obtain an exclusive lock and prevent the data from being read, updated or deleted
- **PESSIMISTIC_FORCE_INCREMENT** – works like PESSIMISTIC_WRITE and it additionally increments a version attribute of a versioned entity

### JpaRepository 인터페이스 사용
JpaRepository 인터페이스에 조회용 메소드를 하나 선언합니다. 
해당 메소드를 사용하는 경우 Pessimistic Lock 기능이 동작하도록 @Lock 애너테이션을 선언합니다. 
JpaRepository 인터페이스 메소드 이름 규칙이 무시되도록 @Query 애너테이션과 JPQL을 함께 작성해줍니다. 

##### PostRepository 인터페이스
```java
package blog.in.action.domain.post;

import java.util.Optional;

import javax.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(value = "select p from Post p where p.id = :id")
    public Optional<Post> findByIdForUpdate(@Param("id") Long id);
}
```

**@Lock(LockModeType.PESSIMISTIC_WRITE) 애너테이션이 붙은 메소드 호츨은 JPA 트랜잭션 내부에서 동작해야 합니다.** 
JpaRepository 인터페이스를 사용하는 경우 entityManager.getTransaction().begin() 메소드를 사용할 수 없으니 @Transactional 애너테이션을 사용합니다. 
@Transactional 애너테이션이 영역(scope) 밖에서 @Lock(LockModeType.PESSIMISTIC_WRITE) 애너테이션이 붙은 조회 메소드를 호출하면 다음과 같은 에러를 만나게 됩니다. 

##### InvalidDataAccessApiUsageException, no transaction is in progress
<p align="left"><img src="/images/jpa-pessimistic-lock-1.JPG"></p>

조회에서 업데이트까지 하나의 트랜잭션으로 처리될 수 있도록 PostService @Bean 내부에 @Transactional 애너테이션을 붙힌 메소드를 하나 만들어줍니다. 
**@Transactional 애너테이션은 @Bean인 객체에만 적용되니 주의해야 합니다. 일반 객체의 메소드에 작성하여도 정상적으로 동작하지 않습니다.**

##### PostService 클래스
```java
package blog.in.action.domain.post;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import blog.in.action.domain.member.Member;
import lombok.extern.log4j.Log4j2;

@Log4j2
@Service
public class PostService {

    @Autowired
    private PostRepository repo;

    public Post registPost(Post entity) {
        return repo.save(entity);
    }

    public Post updatePost(Post entity) {
        return repo.save(entity);
    }

    public Post findById(Long id) {
        Optional<Post> option = repo.findById(id);
        if (!option.isPresent()) {
            throw new RuntimeException("POST를 찾을 수 없습니다.");
        }
        return option.get();
    }

    public Page<Post> findByMember(Member member, Pageable pageable) {
        Example<Post> example = Example.of(new Post(member));
        return repo.findAll(example, pageable);
    }

    public Page<Post> findByTitlePost(String postTitle, Pageable pageable) {
        Example<Post> example = Example.of(new Post(postTitle));
        return repo.findAll(example, pageable);
    }

    @Transactional
    public void test(Long postId, int waitingTime) throws InterruptedException {
        long start = System.currentTimeMillis();
        Optional<Post> option = repo.findByIdForUpdate(postId);
        if (!option.isPresent()) {
            throw new RuntimeException("POST를 찾을 수 없습니다.");
        }
        log.info("포스트 조회에 걸린 시간: " + (System.currentTimeMillis() - start) + "ms");
        Post post = option.get();
        post.setPostContents("JPA는 어떤 방식으로 Pessimitic Lock을 제공하는지 정리하였습니다. " + Thread.currentThread().getName() + "에 의해 업데이트되었습니다.");
        updatePost(post);
        log.info(waitingTime + "ms 동안 대기합니다.");
        Thread.sleep(waitingTime);
    }
}
```

##### RepositoryUseTest 클래스
```java
package blog.in.action.lock.pessimistic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;

import blog.in.action.domain.member.Member;
import blog.in.action.domain.post.Post;
import blog.in.action.domain.post.PostService;
import lombok.extern.log4j.Log4j2;

@Log4j2
@SpringBootTest
public class RepositoryUseTest {

    @Autowired
    private PostService postService;

    @BeforeEach
    private void beforeEach() {
        Page<Post> page = postService.findByTitlePost("Pessimitic Lock", PageRequest.of(0, 10, Sort.by(Direction.DESC, "postTitle")));
        if (page.isEmpty()) {
            Post post = new Post(new Member("01012341234"));
            post.setPostTitle("Pessimitic Lock");
            post.setPostContents("JPA는 어떤 방식으로 Pessimitic Lock을 제공하는지 정리하였습니다.");
            post.setVersionNo(Long.valueOf(0L));
            postService.registPost(post);
        } else {
            Post post = page.getContent().get(0);
            post.setPostContents("JPA는 어떤 방식으로 Pessimitic Lock을 제공하는지 정리하였습니다.");
            postService.updatePost(post);
        }
    }

    @Test
    public void test() {
        Page<Post> page = postService.findByTitlePost("Pessimitic Lock", PageRequest.of(0, 10, Sort.by(Direction.DESC, "postTitle")));
        if (!page.isEmpty()) {
            Post post = page.getContent().get(0);
            Thread tx1 = new Thread(new UpdatePostTask(post.getId(), 1500));
            Thread tx2 = new Thread(new UpdatePostTask(post.getId(), 2000));
            tx1.setName("1.5 초 대기 스레드");
            tx2.setName("2.0 초 대기 스레드");
            tx1.start();
            tx2.start();
            try {
                Thread.sleep(5000);
            } catch (Exception e) {
                log.error("main thread sleep error", e);
            }
        }
    }

    private class UpdatePostTask implements Runnable {

        private Long postId;

        private Integer waitingTime;

        public UpdatePostTask(Long postId, Integer waitingTime) {
            this.postId = postId;
            this.waitingTime = waitingTime;
        }

        @Override
        public void run() {
            try {
                postService.test(postId, waitingTime);
            } catch (Exception e) {
                log.error("update thread sleep error", e);
            }
        }
    }
}
```

##### JpaRepository 인터페이스 사용 테스트 결과
- 테스트 로그, 수행된 결과 데이터
- `1.5 초 대기 스레드` 트랜잭션은 먼저 LOCK을 선점한 트랜잭션이 종료되기까지 2127ms 동안 데이터 조회를 대기하였습니다.
- 데이터베이스에 마지막으로 반영된 데이터는 `1.5 초 대기 스레드`의 트랜잭션 결과임을 확인할 수 있습니다.
<p align="left"><img src="/images/jpa-pessimistic-lock-2.JPG"></p>
<p align="left"><img src="/images/jpa-pessimistic-lock-3.JPG"></p>

### EntityManager 사용
EntityManager를 사용하는 경우 트랜잭션 처리를 개발자가 제어할 수 있으므로 Thread 클래스의 run() 메소드에 테스트 코드를 작성하였습니다. 
Pessimistic Lock 기능 사용을 위해 entityManager.find() 메소드에 LockModeType.PESSIMISTIC_WRITE을 함께 전달하였습니다. 
```java
package blog.in.action.lock.pessimistic;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.LockModeType;
import javax.persistence.PersistenceUnit;
import javax.persistence.RollbackException;
import javax.persistence.TypedQuery;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import blog.in.action.domain.member.Member;
import blog.in.action.domain.post.Post;
import lombok.extern.log4j.Log4j2;

@Log4j2
@SpringBootTest
public class EntityManagerUseTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @BeforeEach
    private void beforeEach() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            TypedQuery<Post> query = em.createQuery("select p from Post p where p.postTitle = :postTitle", Post.class);
            query.setParameter("postTitle", "Pessimitic Lock");
            Post post = query.getSingleResult();
            if (post == null) {
                post = new Post(new Member("01012341234"));
                post.setPostTitle("Pessimitic Lock");
                post.setPostContents("JPA는 어떤 방식으로 Pessimitic Lock을 제공하는지 정리하였습니다.");
                post.setVersionNo(Long.valueOf(0L));
                em.persist(post);
            } else {
                post.setPostContents("JPA는 어떤 방식으로 Pessimitic Lock을 제공하는지 정리하였습니다.");
            }
            em.getTransaction().commit();
        } catch (Exception e) {
            log.error("beforeEach thread error", e);
            em.getTransaction().rollback();
        }
    }

    @Test
    public void test() {
        EntityManager em = factory.createEntityManager();
        TypedQuery<Post> query = em.createQuery("select p from Post p where p.postTitle = :postTitle", Post.class);
        query.setParameter("postTitle", "Pessimitic Lock");
        Post post = query.getSingleResult();
        if (post != null) {
            Thread tx1 = new Thread(new UpdatePostTask(post.getId(), 1500));
            Thread tx2 = new Thread(new UpdatePostTask(post.getId(), 2000));
            tx1.setName("1.5 초 대기 스레드");
            tx2.setName("2.0 초 대기 스레드");
            tx1.start();
            tx2.start();
            try {
                Thread.sleep(5000);
            } catch (Exception e) {
                log.error("main thread sleep error", e);
            }
        }
    }

    private class UpdatePostTask implements Runnable {

        private Long postId;

        private Integer waitingTime;

        public UpdatePostTask(Long postId, Integer waitingTime) {
            this.postId = postId;
            this.waitingTime = waitingTime;
        }

        @Override
        public void run() {
            EntityManager em = factory.createEntityManager();
            Post post = null;
            try {
                em.getTransaction().begin();
                long start = System.currentTimeMillis();
                post = em.find(Post.class, postId, LockModeType.PESSIMISTIC_WRITE);
                log.info("포스트 조회에 걸린 시간: " + (System.currentTimeMillis() - start) + "ms");
                post.setPostContents("JPA는 어떤 방식으로 Pessimitic Lock을 제공하는지 정리하였습니다. " + Thread.currentThread().getName() + "에 의해 업데이트되었습니다.");
                log.info(waitingTime + "ms 동안 대기합니다.");
                Thread.sleep(waitingTime);
                em.getTransaction().commit();
            } catch (RollbackException rollbackEx) {
                log.error(post.getPostTitle() + " 포스트는 다른 트랜잭션에 의해 업데이트되었습니다.", rollbackEx);
                em.getTransaction().rollback();
            } catch (Exception e) {
                log.error("update thread sleep error", e);
                em.getTransaction().rollback();
            }
        }
    }
}
```

##### EntityManager 사용 테스트 결과
- 테스트 로그, 수행된 결과 데이터
- `2.0 초 대기 스레드` 트랜잭션은 먼저 LOCK을 선점한 트랜잭션이 종료되기까지 1528ms 동안 데이터 조회를 대기하였습니다.
- 데이터베이스에 마지막으로 반영된 데이터는 `2.0 초 대기 스레드`의 트랜잭션 결과임을 확인할 수 있습니다.
<p align="left"><img src="/images/jpa-pessimistic-lock-4.JPG"></p>
<p align="left"><img src="/images/jpa-pessimistic-lock-5.JPG"></p>

## OPINION
### JpaRepository 사용시 트랜잭션 처리
지난 [JPA Optimistic Lock 구현][jpa-optimistic-lock-blogLink] 포스트와 다르게 테스트 케이스를 만드는데 애를 먹었습니다. 
**그 이유는 JpaRepository 인터페이스 테스트 코드를 처음 작성할 때 조회와 업데이트를 하나의 트랜잭션으로 처리하지 않아 원하는 결과를 얻지 못했기 때문입니다.** 
JpaRepository 인터페이스 사용시 트랜잭션 처리에 필요한 @Transactional 애너테이션의 전파 방법, 격리성 모드 등을 공부를 할 예정입니다.

##### 후순 트랜잭션이 Lock 점유가 가능할때까지 대기하지 않는 현상 발생
- 각 트랜잭션이 조회에 걸리는 시간이 40ms 수준임을 확인할 수 있습니다.
<p align="left"><img src="/images/jpa-pessimistic-lock-6.JPG"></p>

### 성능 지연의 문제
**Pessimistic Lock 기능을 사용한 트랜잭션 동시성 제어의 문제점은 스레드 대기로 인한 성능 지연이라고 생각합니다.** 
Lock을 선점한 트랜잭션에 문제가 발생하는 경우 대기 중인 트랜잭션도 모두 함께 정지되므로 시스템 장애가 유발될 수 있습니다. 

이런 문제를 해결하려면 Lock 점유를 위해 일정 시간 대기하고, 점유하지 못하면 해다 트랜잭션을 실패 처리하는 `FOR UPDATE WAIT #{waitTime}` 기능이 필요합니다. 
해당 기능까지 함께 구현하고 싶었지만 정상적으로 수행되지 않아 해당 포스트에선 제외하였습니다.(아마도 DBMS 종류에 따른 문제로 생각됩니다.) 
해결하지 못하였으니 관련된 코드만 메모하고, 포스팅은 다음 숙제로 남겨두록 하겠습니다. 
테스트 코드는 [github link][github-link]에서 확인하실 수 있습니다.

##### JpaRepository 인터페이스 사용시 @QueryHints 애너테이션 사용
```java
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({@QueryHint(name = "javax.persistence.lock.timeout", value ="5000")})
    Optional<Post> findById(Long id)
```

##### EntityManager 사용시 property 전달
```java
   Map<String,Object> properties = new HashMap();
   properties.put("javax.persistence.query.timeout", 5000);
   EntityManager entityManager = entityManagerFactory.createEntityManager(properties);
```

#### REFERENCE
- <https://www.baeldung.com/jpa-pessimistic-locking>

[lock-mechanism-blogLink]: https://junhyunny.github.io/information/database/lock/lock-mechanism/
[jpa-optimistic-lock-blogLink]: https://junhyunny.github.io/spring/database/lock/jpa/junit/jpa-optimistic-lock/ 
[github-link]: https://github.com/Junhyunny/action-in-blog/tree/1fd167ad0d03f06d8ef2fd0a8c26fb17549efae8