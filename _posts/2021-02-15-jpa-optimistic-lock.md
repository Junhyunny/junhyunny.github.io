---
title: "JPA Optimistic Lock 구현"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-08-22T03:00:00
---

<br>

⚠️ 해당 포스트는 2021년 8월 22일에 재작성되었습니다.(불필요 코드 제거)

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Lock Mechanism][lock-mechanism-link]

Optimistic Lock에 대한 핵심 내용만 다시 정리하고, 글 작성을 이어나가도록 하겠습니다. 

> **`Optimistic Lock`**<br>
> 트랜잭션 충돌이 발생하지 않는다고 가정한 낙관적인 LOCK<br>
> 트랜잭션 충돌에 대한 감지는 조회한 데이터의 VERSION 값을 통해 이루어집니다. 

## 1. JPA는 Optimistic Lock을 어떻게 제공하는가?
짧은 시간 차이로 서로 다른 트랜잭션이 동일 데이터에 대해 업데이트하는 테스트 코드를 작성하였습니다. 
테스트는 JpaRepository Interface와 EntityManager를 사용한 두 가지 방법을 준비하였습니다. 

두 테스트의 시나리오는 동일하며 아래와 같습니다.
1. test() 메소드에서 2개의 스레드를 만들어 실행
1. 각 스레드 별로 대기하는 시간을 다르게 부여하여 업데이트 시간 차이를 부여
1. 늦게 업데이트를 수행한 스레드가 Optimistic Lock과 관련된 Exception이 발생하는지 확인

## 2. 테스트 코드

### 2.1. JpaRepository 인터페이스 사용

```java
package blog.in.action.lock.optimistic;

import blog.in.action.domain.post.Post;
import blog.in.action.domain.post.PostRepository;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;

@Log4j2
@SpringBootTest
public class RepositoryUseTest {

    @Autowired
    private PostRepository postRepository;

    @BeforeEach
    private void beforeEach() {
        Page<Post> page = postRepository.findByTitle("Optimistic Lock", PageRequest.of(0, 10, Sort.by(Direction.DESC, "title")));
        if (page.isEmpty()) {
            Post post = new Post();
            post.setTitle("Optimistic Lock");
            post.setContents("JPA는 어떤 방식으로 Optimistic Lock을 제공하는지 정리하였습니다.");
            post.setVersionNo(Long.valueOf(0L));
            postRepository.save(post);
        } else {
            Post post = page.getContent().get(0);
            post.setContents("JPA는 어떤 방식으로 Optimistic Lock을 제공하는지 정리하였습니다.");
            postRepository.save(post);
        }
    }

    @Test
    public void test() {
        Page<Post> page = postRepository.findByTitle("Optimistic Lock", PageRequest.of(0, 10, Sort.by(Direction.DESC, "title")));
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
                post = postRepository.findById(postId).get();
                post.setContents("JPA는 어떤 방식으로 Optimistic Lock을 제공하는지 정리하였습니다. " + Thread.currentThread().getName() + "에 의해 업데이트되었습니다.");
                Thread.sleep(waitingTime);
                postRepository.save(post);
            } catch (OptimisticLockingFailureException optEx) {
                log.error(post.getTitle() + " 포스트는 다른 트랜잭션에 의해 업데이트되었습니다.", optEx);
            } catch (Exception e) {
                log.error("update thread sleep error", e);
            }
        }
    }
}
```

##### JpaRepository 인터페이스 사용 테스트 결과
- ObjectOptimisticLockingFailureException 예외가 발생하는 것을 볼 수 있습니다.

<p align="left"><img src="/images/jpa-optimistic-lock-1.JPG"></p>

```
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_, post0_.version_no as version_4_0_ from tb_post post0_ where post0_.title=? order by post0_.title desc limit ?
Hibernate: select post0_.id as id1_0_0_, post0_.contents as contents2_0_0_, post0_.title as title3_0_0_, post0_.version_no as version_4_0_0_ from tb_post post0_ where post0_.id=?
Hibernate: update tb_post set contents=?, title=?, version_no=? where id=? and version_no=?
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_, post0_.version_no as version_4_0_ from tb_post post0_ where post0_.title=? order by post0_.title desc limit ?
Hibernate: select post0_.id as id1_0_0_, post0_.contents as contents2_0_0_, post0_.title as title3_0_0_, post0_.version_no as version_4_0_0_ from tb_post post0_ where post0_.id=?
Hibernate: select post0_.id as id1_0_0_, post0_.contents as contents2_0_0_, post0_.title as title3_0_0_, post0_.version_no as version_4_0_0_ from tb_post post0_ where post0_.id=?
Hibernate: select post0_.id as id1_0_0_, post0_.contents as contents2_0_0_, post0_.title as title3_0_0_, post0_.version_no as version_4_0_0_ from tb_post post0_ where post0_.id=?
Hibernate: update tb_post set contents=?, title=?, version_no=? where id=? and version_no=?
Hibernate: select post0_.id as id1_0_0_, post0_.contents as contents2_0_0_, post0_.title as title3_0_0_, post0_.version_no as version_4_0_0_ from tb_post post0_ where post0_.id=?
2021-08-22 03:10:09.140 ERROR 6892 --- [   1.1 초 대기 스레드] b.i.a.lock.optimistic.RepositoryUseTest  : Optimistic Lock 포스트는 다른 트랜잭션에 의해 업데이트되었습니다.

org.springframework.orm.ObjectOptimisticLockingFailureException: Object of class [blog.in.action.domain.post.Post] with identifier [1191]: optimistic locking failed; nested exception is org.hibernate.StaleObjectStateException: Row was updated or deleted by another transaction (or unsaved-value mapping was incorrect) : [blog.in.action.domain.post.Post#1191]
    at org.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(HibernateJpaDialect.java:315) ~[spring-orm-5.3.2.jar:5.3.2]
    at org.springframework.orm.jpa.vendor.HibernateJpaDialect.translateExceptionIfPossible(HibernateJpaDialect.java:233) ~[spring-orm-5.3.2.jar:5.3.2]
    at org.springframework.orm.jpa.AbstractEntityManagerFactoryBean.translateExceptionIfPossible(AbstractEntityManagerFactoryBean.java:551) ~[spring-orm-5.3.2.jar:5.3.2]
    at org.springframework.dao.support.ChainedPersistenceExceptionTranslator.translateExceptionIfPossible(ChainedPersistenceExceptionTranslator.java:61) ~[spring-tx-5.3.2.jar:5.3.2]
    at org.springframework.dao.support.DataAccessUtils.translateIfNecessary(DataAccessUtils.java:242) ~[spring-tx-5.3.2.jar:5.3.2]
    at org.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:152) ~[spring-tx-5.3.2.jar:5.3.2]
    ...
```

### 2.2. EntityManager 사용

```java
package blog.in.action.lock.optimistic;

import blog.in.action.domain.post.Post;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;
import javax.persistence.RollbackException;
import javax.persistence.TypedQuery;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

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
            TypedQuery<Post> query = em.createQuery("select p from Post p where p.title = :title", Post.class);
            query.setParameter("title", "Optimistic Lock");
            Post post = query.getSingleResult();
            if (post == null) {
                post = new Post();
                post.setTitle("Optimistic Lock");
                post.setContents("JPA는 어떤 방식으로 Optimistic Lock을 제공하는지 정리하였습니다.");
                post.setVersionNo(Long.valueOf(0L));
                em.persist(post);
            } else {
                post.setContents("JPA는 어떤 방식으로 Optimistic Lock을 제공하는지 정리하였습니다.");
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
        TypedQuery<Post> query = em.createQuery("select p from Post p where p.title = :title", Post.class);
        query.setParameter("title", "Optimistic Lock");
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
                post.setContents("JPA는 어떤 방식으로 Optimistic Lock을 제공하는지 정리하였습니다. " + Thread.currentThread().getName() + "에 의해 업데이트되었습니다.");
                // em.lock(post, LockModeType.OPTIMISTIC);
                Thread.sleep(waitingTime);
                em.getTransaction().commit();
            } catch (RollbackException rollbackEx) {
                log.error(post.getTitle() + " 포스트는 다른 트랜잭션에 의해 업데이트되었습니다.", rollbackEx);
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
- RollbackException이 발생하고, 원인이 OptimisticLockException임을 확인할 수 있습니다.

<p align="left"><img src="/images/jpa-optimistic-lock-2.JPG"></p>

```
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_, post0_.version_no as version_4_0_ from tb_post post0_ where post0_.title=?
Hibernate: update tb_post set contents=?, title=?, version_no=? where id=? and version_no=?
Hibernate: select post0_.id as id1_0_, post0_.contents as contents2_0_, post0_.title as title3_0_, post0_.version_no as version_4_0_ from tb_post post0_ where post0_.title=?
Hibernate: select post0_.id as id1_0_0_, post0_.contents as contents2_0_0_, post0_.title as title3_0_0_, post0_.version_no as version_4_0_0_ from tb_post post0_ where post0_.id=?
Hibernate: select post0_.id as id1_0_0_, post0_.contents as contents2_0_0_, post0_.title as title3_0_0_, post0_.version_no as version_4_0_0_ from tb_post post0_ where post0_.id=?
Hibernate: update tb_post set contents=?, title=?, version_no=? where id=? and version_no=?
Hibernate: update tb_post set contents=?, title=?, version_no=? where id=? and version_no=?
Hibernate: select post0_.id as id1_0_0_, post0_.contents as contents2_0_0_, post0_.title as title3_0_0_, post0_.version_no as version_4_0_0_ from tb_post post0_ where post0_.id=?
2021-08-22 03:12:29.830 ERROR 15408 --- [   1.1 초 대기 스레드] b.i.a.l.optimistic.EntityManagerUseTest  : Optimistic Lock 포스트는 다른 트랜잭션에 의해 업데이트되었습니다.

javax.persistence.RollbackException: Error while committing the transaction
    at org.hibernate.internal.ExceptionConverterImpl.convertCommitException(ExceptionConverterImpl.java:81) ~[hibernate-core-5.4.25.Final.jar:5.4.25.Final]
    at org.hibernate.engine.transaction.internal.TransactionImpl.commit(TransactionImpl.java:104) ~[hibernate-core-5.4.25.Final.jar:5.4.25.Final]
    at blog.in.action.lock.optimistic.EntityManagerUseTest$UpdatePostTask.run(EntityManagerUseTest.java:87) ~[test-classes/:na]
    at java.base/java.lang.Thread.run(Thread.java:834) ~[na:na]
Caused by: javax.persistence.OptimisticLockException: Row was updated or deleted by another transaction (or unsaved-value mapping was incorrect) : [blog.in.action.domain.post.Post#1191]
    at org.hibernate.internal.ExceptionConverterImpl.wrapStaleStateException(ExceptionConverterImpl.java:226) ~[hibernate-core-5.4.25.Final.jar:5.4.25.Final]
    at org.hibernate.internal.ExceptionConverterImpl.convert(ExceptionConverterImpl.java:93) ~[hibernate-core-5.4.25.Final.jar:5.4.25.Final]
    at org.hibernate.internal.ExceptionConverterImpl.convert(ExceptionConverterImpl.java:181) ~[hibernate-core-5.4.25.Final.jar:5.4.25.Final]
    at org.hibernate.internal.ExceptionConverterImpl.convertCommitException(ExceptionConverterImpl.java:65) ~[hibernate-core-5.4.25.Final.jar:5.4.25.Final]
    ... 3 common frames omitted
Caused by: org.hibernate.StaleObjectStateException: Row was updated or deleted by another transaction (or unsaved-value mapping was incorrect) : [blog.in.action.domain.post.Post#1191]
    at org.hibernate.persister.entity.AbstractEntityPersister.check(AbstractEntityPersister.java:2651) ~[hibernate-core-5.4.25.Final.jar:5.4.25.Final]
    at org.hibernate.persister.entity.AbstractEntityPersister.update(AbstractEntityPersister.java:3495) ~[hibernate-core-5.4.25.Final.jar:5.4.25.Final]
    at org.hibernate.persister.entity.AbstractEntityPersister.updateOrInsert(AbstractEntityPersister.java:3358) ~[hibernate-core-5.4.25.Final.jar:5.4.25.Final]
    ...
```

## CLOSING
EntityManager를 사용한 테스트에서 entityManager.lock() 메소드를 사용하지 않더라도 OptimisticLockException이 발생하는 것을 확인하였습니다. 
entityManager.lock() 메소드를 사용하지 않아도 Optimistic Lock 기능이 정상적으로 동작하는 것이 이상하여 관련된 내용들을 찾아보았습니다. 

StackOverflow에서 다음과 같은 글을 발견하였습니다. 
3.2 버전부터는 @Version 애너테이션 필드만 있어도 Optimistic Lock 기능이 가능하다고 합니다. 
> 3.2 Version Attributes<br><br>
> The Version field or property is used by the persistence provider to perform optimistic locking. 
> It is accessed and/or set by the persistence provider in the course of performing lifecycle operations on the entity instance. 
> **An entity is automatically enabled for optimistic locking if it has a property or field mapped with a Version mapping.**

다음 글은 JPA가 Pessimistic Lock 기능을 어떻게 제공하는지 알아보도록 하겠습니다. 

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-02-15-jpa-optimistic-lock>

#### REFERENCE
- <https://www.baeldung.com/jpa-optimistic-locking>
- <https://stackoverflow.com/questions/13568475/jpa-and-default-locking-mode>

[lock-mechanism-link]: https://junhyunny.github.io/information/lock-mechanism/