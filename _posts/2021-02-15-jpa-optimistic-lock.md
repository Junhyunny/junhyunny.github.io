---
title: "JPA Optimistic Lock 구현"
search: false
category:
  - spring
  - database
  - lock
  - jpa
  - junit
last_modified_at: 2021-02-16T00:00:00
---

# JPA Optimistic Lock 구현<br>

[Lock Mechanism][lock-mechanism-blogLink] 포스트에서 언급한 Optimistic Lock 방법을 구현해보도록 하겠습니다. 
Optimistic Lock이 어떤 LOCK 방법인지 궁금하신 분들은 지난 포스트를 참고해주시기 바랍니다. 
Optimistic Lock에 대한 핵심 내용만 다시 정리하고, 글 작성을 이어나가도록 하겠습니다. 

##### **`Optimistic Lock`**
> 트랜잭션 충돌이 발생하지 않는다고 가정한 낙관적인 LOCK<br>
> 트랜잭션 충돌에 대한 감지는 조회한 데이터의 VERSION 값을 통해 이루어집니다. 

## JPA는 Optimistic Lock을 어떻게 제공하는가?
짧은 시간 차이로 서로 다른 트랜잭션이 동일 데이터에 대해 업데이트하는 테스트 코드를 작성하였습니다. 
테스트는 JpaRepository Interface @Bean과 EntityManager를 사용한 두 가지 방법을 준비하였습니다. 

두 테스트의 시나리오는 동일하며 아래와 같습니다.
1. test() 메소드에서 2개의 스레드를 만들어 실행
1. 각 스레드 별로 대기하는 시간을 다르게 부여하여 업데이트 시간 차이를 부여
1. 늦게 업데이트를 수행한 스레드가 Optimistic Lock과 관련된 Exception이 발생하는지 확인

### JpaRepository 인터페이스 사용
```java
package blog.in.action.lock.optimistic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.OptimisticLockingFailureException;
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
        Page<Post> page = postService.findByTitlePost("Optimistic Lock", PageRequest.of(0, 10, Sort.by(Direction.DESC, "postTitle")));
        if (page.isEmpty()) {
            Post post = new Post(new Member("01012341234"));
            post.setPostTitle("Optimistic Lock");
            post.setPostContents("JPA는 어떤 방식으로 Optimistic Lock을 제공하는지 정리하였습니다.");
            post.setVersionNo(Long.valueOf(0L));
            postService.registPost(post);
        } else {
            Post post = page.getContent().get(0);
            post.setPostContents("JPA는 어떤 방식으로 Optimistic Lock을 제공하는지 정리하였습니다.");
            postService.updatePost(post);
        }
    }

    @Test
    public void test() {
        Page<Post> page = postService.findByTitlePost("Optimistic Lock", PageRequest.of(0, 10, Sort.by(Direction.DESC, "postTitle")));
        if (!page.isEmpty()) {
            Post post = page.getContent().get(0);
            Thread tx1 = new Thread(new UpdatePostTask(post.getId(), 1100));
            Thread tx2 = new Thread(new UpdatePostTask(post.getId(), 1000));
            tx1.setName("1.1 초 대기 스레드");
            tx2.setName("1.0 초 대기 스레드");
            tx1.start();
            tx2.start();
            try {
                Thread.sleep(2000);
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
            Post post = null;
            try {
                post = postService.findById(postId);
                post.setPostContents("JPA는 어떤 방식으로 Optimistic Lock을 제공하는지 정리하였습니다. " + Thread.currentThread().getName() + "에 의해 업데이트되었습니다.");
                Thread.sleep(waitingTime);
                postService.updatePost(post);
            } catch (OptimisticLockingFailureException optEx) {
                log.error(post.getPostTitle() + " 포스트는 다른 트랜잭션에 의해 업데이트되었습니다.", optEx);
            } catch (Exception e) {
                log.error("update thread sleep error", e);
            }
        }
    }
}
```

##### JpaRepository 인터페이스 사용 테스트 결과
- 테스트 로그, 수행된 결과 데이터
<p align="left"><img src="/images/jpa-optimistic-lock-1.JPG"></p>
<p align="left"><img src="/images/jpa-optimistic-lock-2.JPG"></p>

### EntityManager 사용
```java
package blog.in.action.lock.optimistic;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
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
            query.setParameter("postTitle", "Optimistic Lock");
            Post post = query.getSingleResult();
            if (post == null) {
                post = new Post(new Member("01012341234"));
                post.setPostTitle("Optimistic Lock");
                post.setPostContents("JPA는 어떤 방식으로 Optimistic Lock을 제공하는지 정리하였습니다.");
                post.setVersionNo(Long.valueOf(0L));
                em.persist(post);
            } else {
                post.setPostContents("JPA는 어떤 방식으로 Optimistic Lock을 제공하는지 정리하였습니다.");
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
        query.setParameter("postTitle", "Optimistic Lock");
        Post post = query.getSingleResult();
        if (post != null) {
            Thread tx1 = new Thread(new UpdatePostTask(post.getId(), 1100));
            Thread tx2 = new Thread(new UpdatePostTask(post.getId(), 1000));
            tx1.setName("1.1 초 대기 스레드");
            tx2.setName("1.0 초 대기 스레드");
            tx1.start();
            tx2.start();
            try {
                Thread.sleep(2000);
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
                post = em.find(Post.class, postId);
                post.setPostContents("JPA는 어떤 방식으로 Optimistic Lock을 제공하는지 정리하였습니다. " + Thread.currentThread().getName() + "에 의해 업데이트되었습니다.");
                // em.lock(post, LockModeType.OPTIMISTIC);
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
- RollbackException이 발생하고, 원인이 OptimisticLockException임을 확인할 수 있습니다.
<p align="left"><img src="/images/jpa-optimistic-lock-3.JPG"></p>
<p align="left"><img src="/images/jpa-optimistic-lock-4.JPG"></p>

## OPINION
EntityManager를 사용한 테스트에서 entityManager.lock() 메소드를 사용하지 않더라도 OptimisticLockException이 발생하는 것을 확인하였습니다. 
entityManager.lock() 메소드를 사용하지 않아도 Optimistic Lock 기능이 정상적으로 동작하는 것이 이상하여 관련된 내용들을 찾아보았습니다. 

StackOverflow에서 다음과 같은 글을 발견하였습니다. 
3.2 버전부터는 @Version 애너테이션 필드만 있어도 Optimistic Lock 기능이 가능하다고 합니다. 
> 3.2 Version Attributes<br><br>
> The Version field or property is used by the persistence provider to perform optimistic locking. 
> It is accessed and/or set by the persistence provider in the course of performing lifecycle operations on the entity instance. 
> **An entity is automatically enabled for optimistic locking if it has a property or field mapped with a Version mapping.**

다음 글은 JPA가 Pessimistic Lock 기능을 어떻게 제공하는지 알아보도록 하겠습니다. 
테스트 코드는 [github link][github-link]에서 확인하실 수 있습니다.

#### 참조글
- <https://www.baeldung.com/jpa-optimistic-locking>
- <https://stackoverflow.com/questions/13568475/jpa-and-default-locking-mode>

[lock-mechanism-blogLink]: https://junhyunny.github.io/information/database/lock/lock-mechanism/
[github-link]: https://github.com/Junhyunny/action-in-blog/tree/2c09107b51b127f2e6296b6d1e698b73f1f3580a