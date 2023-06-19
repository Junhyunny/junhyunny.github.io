---
title: "CascadeType in JPA"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-09-02T03:00:00
---

<br/>

## 1. Entity Lifecycle

JPA CascadeType과 관계가 깊은 JPA 엔티티(entity) 라이프사이클(lifecycle)과 영속성(Persistenc)에 대해 다시 정리해보겠습니다. 

> **영속성(Persistence)**<br/>
> **'특정 데이터를 생성한 프로그램이 종료되더라도 해당 데이터는 사라지지 않는다.'**는 데이터 특성을 의미합니다. 
> 영속성을 지니지 못한 데이터는 메모리에만 존재하기 때문에 프로그램이 종료되면 그 즉시 소멸됩니다. 
> 반대로 영속성을 지닌 데이터는 어플리케이션이 종료되더라도 삭제되지 않고 남아있습니다. 

##### Entity Lifecycle 흐름
<p align="center"><img src="/images/jpa-cascade-type-1.JPG" width="60%"></p>
<center>https://gunlog.dev/JPA-Persistence-Context/</center>

- 비영속(new/transient)
    - 엔티티 객체를 새로 생성하였지만 EntityManager에 의해 관리되고 있지 않는 상태
    - 영속성 컨텍스트와 전혀 관계가 없는 상태
    - 엔티티 객체에서 발생하는 데이터 변경은 전혀 알 수 없습니다.

- 영속(managed)
    - 엔티티 객체가 EntityManager에 의해 관리되고 있는 상태
    - 엔티티 객체가 영속성 컨텍스트에 저장되어 상태
    - **`entityManager.persist(E)`** 메소드를 통해 영속성 컨텍스트에 저장됩니다.
    - persist 메소드가 수행되는 동시에 데이터가 데이터베이스에 저장되지는 않습니다.

- 준영속(detached)
    - 엔티티를 영속성 컨텍스트에서 분리된 상태
    - **`entityManager.detach(E)`** 메소드를 통해 영속성 컨텍스트에 분리됩니다.
    - 엔티티가 영속성 컨텍스트에서 분리된 상태이므로 EntityManager가 변경을 감지하지 못합니다.
    - 영속성 컨텍스트에서만 분리되었을 뿐 실제 데이터가 삭제되지는 않습니다.

- 삭제(removed)
    - 엔티티에 해당하는 데이터를 데이터베이스에서 삭제된 상태
    - **`entityManager.remove(E)`** 메소드를 통해 영속성 컨텍스트에 삭제됩니다.

## 2. JPA Cascade
이제 본격적으로 JPA Cascade에 관련된 내용을 정리해보겠습니다. 
우선 `Casecade` 라는 용어가 무슨 의미인지 알아보았습니다.  

> Cascade<br/>
> 1. 작은 폭포<br/>
> 2. 폭포처럼 쏟아지는 물<br/>
> 3. 폭포처럼 흐르다<br/>
> 4. (정보통신) 종속, 연속, 직렬<br/>

음...🤔 의미만 봐서는 정확한 기능을 유추해내기 쉽지 않습니다. 
`(정보통신) 종속, 연속, 직렬` 이라는 의미가 그나마 오늘 주제와 어울리는 의미 같습니다. 
JPA Cascade와 관련된 포스트들을 보면 Cascade라는 단어는 주로 `영속성(Persistence) 전이`라는 의미로 사용됩니다.  

> 영속성(Persistence) 전이<br/>
> 영속성 전이는 엔티티의 영속성 상태 변화를 연관된 엔티티에도 함께 적용하는 것이다. 
> 예를 들어, 엔티티를 저장할 때 연관된 엔티티도 함께 저장하고, 엔티티를 삭제할 때 연관된 엔티티도 함께 삭제하는 것이 영속성 전이이다.

영속성 전이가 일어나는 시점을 엔티티들 사이의 관계를 맺을 때 정할 수 있습니다. 
JPA에서 테이블 사이의 관계를 맺어주는 방법으로 @OneToOne, @OneToMany, @ManyToOne, @ManyToMany 등을 사용합니다. 
해당 애너테이션들을 이용해 엔티티 사이의 관계를 맺을 때 `cascade` 라는 속성을 통해 CascadeType을 함께 정의해줄 수 있습니다. 
지정된 CascadeType에 따라 엔티티의 변경 상태를 반영하는 시점을 지정할 수 있습니다. 

각 CascadeType 별로 영속성 전이가 이루어지는 시점입니다. 
- PERSIST - 대상(target) 엔티티가 new 상태에서 managed 상태로 변경되는 시점
- REMOVE - 대상 엔티티가 managed 상태에서 removed 상태로 변경되는 시점
- DETACH - 대상 엔티티가 managed 상태에서 detached 상태로 변경되는 시점
- MERGE - 대상 엔티티가 detached 상태에서 managed 상태로 변경되는 시점
- REFRESH - 엔티티 매니저의 refresh() 메소드 호출 시점
- ALL - 모든 상태 변화에 대해 종속된 엔티티들의 영속 상태를 함께 반영

제가 이해하기 쉽게 다시 정의해보았습니다. 
- 특정 엔티티의 영속 상태가 변경되었을 때 종속된 엔티티들의 영속 상태가 대상 엔티티를 따라 함께 반영되는 것을 `영속성 전이`라고 합니다. 
- Cascade 기능을 이용하면 종속된 엔티티의 영속 상태가 함께 반영되는 시점을 지정할 수 있다. 

개념은 어느 정도 이해가 되지만 역시 테스트를 통해 눈으로 확인하지 않으면 완벽하게 이해했다고 말할 수 없습니다. 
이해된 개념을 바탕으로 테스트 시나리오를 구상하여 원하는대로 동작하는지 확인해보겠습니다.

## 3. 테스트 코드

### 3.1. 엔티티 구성
<p align="left"><img src="/images/jpa-cascade-type-2.JPG" width="20%"></p>

### 3.2. Post 클래스
- Post 클래스와 Comment 클래스의 관계를 @OneToMany 애너테이션을 통해 지정합니다.
- @OneToMany 애너테이션의 cascade 값을 변경해가면서 테스트를 진행합니다.

```java
package blog.in.action.cascade.entity;

import java.util.List;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;

@Log4j2
@Getter
@Setter
@NoArgsConstructor
@Entity
public class Post {

    @Id
    @GeneratedValue
    private Long id;

    @Column
    private String title;

    @Column
    private String contents;

    @OneToMany(mappedBy = "post")
    private List<Comment> commentList;
}
```

### 3.3. Comment 클래스

```java
package blog.in.action.cascade.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.log4j.Log4j2;

@Log4j2
@Getter
@Setter
@NoArgsConstructor
@Entity
public class Comment {

    @Id
    @GeneratedValue
    private Long id;

    @Column
    private String comment;

    @ManyToOne(targetEntity = Post.class)
    @JoinColumn(name = "POST_ID")
    private Post post;
}
```

## 4. 테스트 수행

### 4.1. CascadeType.PERSIST 테스트

#### 4.1.1. Post 클래스 cascade 값 변경
- 아래와 같이 변경합니다.

```java
    @OneToMany(mappedBy = "post", cascade = {CascadeType.PERSIST})
    private List<Comment> commentList;
```

#### 4.1.2. 테스트 코드
- Post 객체를 새로 생성합니다.(new, transient 상태)
- Comment 객체를 새로 생성합니다.(new, transient 상태)
- Post 객체에 Comment 객체 리스트를 setting 합니다.
- Post 객체를 em.persist(E) 메소드를 통해 managed 상태로 변경합니다.
- 결과를 확인합니다.

```java
package blog.in.action.cascade;

import blog.in.action.cascade.entity.Comment;
import blog.in.action.cascade.entity.Post;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@Log4j2
@SpringBootTest
public class CascadeTypePersistTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @Test
    public void test_persist() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            String deleteComment = "DELETE FROM TB_COMMENT";
            String deletePost = "DELETE FROM TB_POST";
            em.createNativeQuery(deleteComment).executeUpdate();
            em.createNativeQuery(deletePost).executeUpdate();
            Post post = new Post();
            post.setTitle("Title at test");
            post.setContents("Contents at test");
            List<Comment> commentList = new ArrayList<>();
            for (int index = 0; index < 3; index++) {
                Comment comment = new Comment();
                comment.setComment("Comment at test, " + index);
                comment.setPost(post);
                commentList.add(comment);
            }
            post.setCommentList(commentList);
            em.persist(post);
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

##### 테스트 결과 로그
- Post 객체를 new 상태에서 managed 상태로 변경 후 commit을 수행하므로 해당 데이터가 insert 됩니다.
- 별도로 persist를 수행하지 않은 Comment 객체들이 insert 되는 것을 확인할 수 있습니다. 

```
2021-05-26 00:15:04.230  INFO 12068 --- [           main] b.i.a.cascade.CascadeTypeDetachTest      : Started CascadeTypeDetachTest in 5.621 seconds (JVM running for 6.944)
Hibernate: DELETE FROM TB_COMMENT
Hibernate: DELETE FROM TB_POST
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: insert into tb_post (contents, title, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
2021-05-26 00:15:04.454  INFO 12068 --- [extShutdownHook] o.s.s.concurrent.ThreadPoolTaskExecutor  : Shutting down ExecutorService 'applicationTaskExecutor'
2021-05-26 00:15:04.456  INFO 12068 --- [extShutdownHook] j.LocalContainerEntityManagerFactoryBean : Closing JPA EntityManagerFactory for persistence unit 'default'
```

##### 테스트 결과 이미지
- 테스트 수행 후 각 테이블 별 데이터 상태입니다.
- CascadeType.PERSIST, CascadeType.ALL을 제외한 나머지 타입은 TB_COMMENT 테이블에 데이터가 insert 되지 않습니다. 

<p align="center"><img src="/images/jpa-cascade-type-3.JPG" width="50%"></p>

### 4.2. CascadeType.REMOVE 테스트

#### 4.2.1. Post 클래스 cascade 값 변경
- 아래와 같이 변경합니다.

```java
    @OneToMany(mappedBy = "post", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    private List<Comment> commentList;
```

#### 4.2.2. 테스트 코드
- @BeforeEach 애너테이션을 통해 테스트 수행 전 데이터를 초기화합니다.
- Post 객체를 조회합니다.(managed 상태)
- Post 객체를 em.remove(E) 메소드를 통해 removed 상태로 변경합니다.
- 결과를 확인합니다.

```java
package blog.in.action.cascade;

import blog.in.action.cascade.entity.Comment;
import blog.in.action.cascade.entity.Post;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@Log4j2
@SpringBootTest
public class CascadeTypeRemoveTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @BeforeEach
    public void beforeEach() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            String deleteComment = "DELETE FROM TB_COMMENT";
            String deletePost = "DELETE FROM TB_POST";
            em.createNativeQuery(deleteComment).executeUpdate();
            em.createNativeQuery(deletePost).executeUpdate();
            Post post = new Post();
            post.setTitle("Title at test");
            post.setContents("Contents at test");
            List<Comment> commentList = new ArrayList<>();
            for (int index = 0; index < 3; index++) {
                Comment comment = new Comment();
                comment.setComment("Comment at test, " + index);
                comment.setPost(post);
                commentList.add(comment);
            }
            post.setCommentList(commentList);
            em.persist(post);
            em.getTransaction().commit();
        } catch (Exception ex) {
            em.getTransaction().rollback();
            log.error("exception occurs", ex);
        } finally {
            em.close();
        }
    }

    @Test
    public void test_remove() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            String findPost = "SELECT * FROM TB_POST WHERE TITLE ='Title at test'";
            Post post = (Post) em.createNativeQuery(findPost, Post.class).getSingleResult();
            em.remove(post);
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

##### 테스트 결과 로그
- Post 객체를 managed 상태에서 removed 상태로 변경 후 commit을 수행하므로 해당 데이터가 삭제됩니다.
- 별도로 em.remove(E) 메소드를 수행하지 않은 Comment 객체들이 먼저 삭제되는 것을 확인할 수 있습니다. 

```
2021-05-26 00:29:05.937  INFO 13296 --- [           main] b.i.a.cascade.CascadeTypeRemoveTest      : Started CascadeTypeRemoveTest in 4.468 seconds (JVM running for 5.39)
Hibernate: DELETE FROM TB_COMMENT
Hibernate: DELETE FROM TB_POST
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: insert into tb_post (contents, title, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: SELECT * FROM TB_POST WHERE TITLE ='Title at test'
Hibernate: select commentlis0_.post_id as post_id3_2_0_, commentlis0_.id as id1_2_0_, commentlis0_.id as id1_2_1_, commentlis0_.comment as comment2_2_1_, commentlis0_.post_id as post_id3_2_1_ from tb_comment commentlis0_ where commentlis0_.post_id=?
Hibernate: delete from tb_comment where id=?
Hibernate: delete from tb_comment where id=?
Hibernate: delete from tb_comment where id=?
Hibernate: delete from tb_post where id=?
2021-05-26 00:29:06.151  INFO 13296 --- [extShutdownHook] o.s.s.concurrent.ThreadPoolTaskExecutor  : Shutting down ExecutorService 'applicationTaskExecutor'
```

##### CascadeType.REMOVE 제거 후 테스트 결과 로그
- 연관된 테이블의 데이터를 삭제하지 않고 TB_POST 테이블의 데이터를 지우려했기 때문에 제약 조건 위반입니다.
- SQL 제약 조건과 관련된 Exception을 확인할 수 있습니다.

```
2021-05-26 00:33:50.023  INFO 1540 --- [           main] b.i.a.cascade.CascadeTypeRemoveTest      : Started CascadeTypeRemoveTest in 5.001 seconds (JVM running for 6.234)
Hibernate: DELETE FROM TB_COMMENT
Hibernate: DELETE FROM TB_POST
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: insert into tb_post (contents, title, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: SELECT * FROM TB_POST WHERE TITLE ='Title at test'
Hibernate: delete from tb_post where id=?
2021-05-26 00:33:50.221  WARN 1540 --- [           main] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Error: 1451, SQLState: 23000
2021-05-26 00:33:50.222 ERROR 1540 --- [           main] o.h.engine.jdbc.spi.SqlExceptionHelper   : Cannot delete or update a parent row: a foreign key constraint fails (`test`.`tb_comment`, CONSTRAINT `FKebak8c8m45519djplq0wanuj3` FOREIGN KEY (`post_id`) REFERENCES `tb_post` (`id`))
2021-05-26 00:33:50.222  INFO 1540 --- [           main] o.h.e.j.b.internal.AbstractBatchImpl     : HHH000010: On release of batch it still contained JDBC statements
2021-05-26 00:33:50.230 ERROR 1540 --- [           main] b.i.a.cascade.CascadeTypeRemoveTest      : exception occurs

javax.persistence.RollbackException: Error while committing the transaction
    at org.hibernate.internal.ExceptionConverterImpl.convertCommitException(ExceptionConverterImpl.java:81) ~[hibernate-core-5.4.12.Final.jar:5.4.12.Final]
    at org.hibernate.engine.transaction.internal.TransactionImpl.commit(TransactionImpl.java:104) ~[hibernate-core-5.4.12.Final.jar:5.4.12.Final]
    at blog.in.action.cascade.CascadeTypeRemoveTest.test_removeTargetEntity_cascadeType_remove(CascadeTypeRemoveTest.java:65) ~[test-classes/:na]
    at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[na:na]
  ...

2021-05-26 00:33:50.245  INFO 1540 --- [extShutdownHook] o.s.s.concurrent.ThreadPoolTaskExecutor  : Shutting down ExecutorService 'applicationTaskExecutor'
2021-05-26 00:33:50.247  INFO 1540 --- [extShutdownHook] j.LocalContainerEntityManagerFactoryBean : Closing JPA EntityManagerFactory for persistence unit 'default'
```

### 4.3. CascadeType.DETACH 테스트

#### 4.3.1. Post 클래스 cascade 값 변경
- 아래와 같이 변경합니다.

```java
    @OneToMany(mappedBy = "post", cascade = {CascadeType.PERSIST, CascadeType.DETACH})
    private List<Comment> commentList;
```

#### 4.3.2. 테스트 코드
- @BeforeEach 애너테이션을 통해 테스트 수행 전 데이터를 초기화합니다.
- Post 객체를 조회합니다.(managed 상태)
- Comment 객체를 Lazy Loading을 통해 획득한 후 값을 변경합니다.(managed 상태)
- Post 객체를 em.detach(E) 메소드를 통해 detached 상태로 변경합니다.
- 결과를 확인합니다.

```java
package blog.in.action.cascade;

import blog.in.action.cascade.entity.Comment;
import blog.in.action.cascade.entity.Post;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@Log4j2
@SpringBootTest
public class CascadeTypeDetachTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @BeforeEach
    public void beforeEach() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            String deleteComment = "DELETE FROM TB_COMMENT";
            String deletePost = "DELETE FROM TB_POST";
            em.createNativeQuery(deleteComment).executeUpdate();
            em.createNativeQuery(deletePost).executeUpdate();
            Post post = new Post();
            post.setTitle("Title at test");
            post.setContents("Contents at test");
            List<Comment> commentList = new ArrayList<>();
            for (int index = 0; index < 3; index++) {
                Comment comment = new Comment();
                comment.setComment("Comment at test, " + index);
                comment.setPost(post);
                commentList.add(comment);
            }
            post.setCommentList(commentList);
            em.persist(post);
            em.getTransaction().commit();
        } catch (Exception ex) {
            em.getTransaction().rollback();
            log.error("exception occurs", ex);
        } finally {
            em.close();
        }
    }

    @Test
    public void test_detach() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            String findPost = "SELECT * FROM TB_POST WHERE TITLE ='Title at test'";
            Post post = (Post) em.createNativeQuery(findPost, Post.class).getSingleResult();
            List<Comment> commentList = post.getCommentList();
            commentList.get(0).setComment("change comment at second test");
            em.detach(post);
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

##### 테스트 결과 로그
- Post 객체를 managed 상태에서 detached 상태로 변경 후 commit을 수행합니다.
- Post 객체가 detached 상태로 변경되면서 Comment 객체들도 함께 detatched 상태로 변경됩니다.
- Comment 객체 변경 상태가 데이터베이스에 반영되지 않습니다.(dirty checking 실패)

```
2021-05-26 00:42:38.823  INFO 8580 --- [           main] b.i.a.cascade.CascadeTypeDetachTest      : Started CascadeTypeDetachTest in 4.407 seconds (JVM running for 5.349)
Hibernate: DELETE FROM TB_COMMENT
Hibernate: DELETE FROM TB_POST
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: insert into tb_post (contents, title, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: SELECT * FROM TB_POST WHERE TITLE ='Title at test'
Hibernate: select commentlis0_.post_id as post_id3_2_0_, commentlis0_.id as id1_2_0_, commentlis0_.id as id1_2_1_, commentlis0_.comment as comment2_2_1_, commentlis0_.post_id as post_id3_2_1_ from tb_comment commentlis0_ where commentlis0_.post_id=?
2021-05-26 00:42:39.025  INFO 8580 --- [extShutdownHook] o.s.s.concurrent.ThreadPoolTaskExecutor  : Shutting down ExecutorService 'applicationTaskExecutor'
```

##### 테스트 결과 이미지
- 테스트 수행 후 각 테이블 별 데이터 상태입니다.

<p align="center"><img src="/images/jpa-cascade-type-4.JPG" width="50%"></p>

##### CascadeType.DETACH 제거 후 테스트 결과 로그
- Post 객체를 managed 상태에서 detached 상태로 변경 후 commit을 수행합니다.
- Post 객체가 detached 상태로 변경되지만 Comment 객체들은 함께 detatched 상태로 변경되지 않습니다.(managed 상태)
- Comment 객체 변경 상태가 데이터베이스에 반영됩니다.(dirty checking 성공)

```
2021-05-26 00:48:52.239  INFO 16756 --- [           main] b.i.a.cascade.CascadeTypeDetachTest      : Started CascadeTypeDetachTest in 4.896 seconds (JVM running for 6.065)
Hibernate: DELETE FROM TB_COMMENT
Hibernate: DELETE FROM TB_POST
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: insert into tb_post (contents, title, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: SELECT * FROM TB_POST WHERE TITLE ='Title at test'
Hibernate: select commentlis0_.post_id as post_id3_2_0_, commentlis0_.id as id1_2_0_, commentlis0_.id as id1_2_1_, commentlis0_.comment as comment2_2_1_, commentlis0_.post_id as post_id3_2_1_ from tb_comment commentlis0_ where commentlis0_.post_id=?
Hibernate: update tb_comment set comment=?, post_id=? where id=?
2021-05-26 00:48:52.471  INFO 16756 --- [extShutdownHook] o.s.s.concurrent.ThreadPoolTaskExecutor  : Shutting down ExecutorService 'applicationTaskExecutor'
2021-05-26 00:48:52.471  INFO 16756 --- [extShutdownHook] j.LocalContainerEntityManagerFactoryBean : Closing JPA EntityManagerFactory for persistence unit 'default'
```

##### CascadeType.DETACH 제거 후 테스트 결과 이미지
- 테스트 수행 후 각 테이블 별 데이터 상태입니다.

<p align="center"><img src="/images/jpa-cascade-type-5.JPG" width="60%"></p>

### 4.4. CascadeType.MERGE 테스트

#### 4.4.1. Post 클래스 cascade 값 변경
- 아래와 같이 변경합니다.

```java
    @OneToMany(mappedBy = "post", cascade = {CascadeType.PERSIST, CascadeType.DETACH, CascadeType.MERGE})
    private List<Comment> commentList;
```

#### 4.4.2. 테스트 코드
- @BeforeEach 애너테이션을 통해 테스트 수행 전 데이터를 초기화합니다.
- Post 객체를 조회합니다.(managed 상태)
- Comment 객체를 Lazy Loading을 통해 획득한 후 값을 변경합니다.(managed 상태)
- Post 객체를 em.detach(E) 메소드를 통해 detached 상태로 변경합니다.
- Post 객체를 em.merege(E) 메소드를 통해 다시 managed 상태로 변경합니다.
- 결과를 확인합니다.

```java
package blog.in.action.cascade;

import blog.in.action.cascade.entity.Comment;
import blog.in.action.cascade.entity.Post;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@Log4j2
@SpringBootTest
public class CascadeTypeMergeTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @BeforeEach
    public void beforeEach() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            String deleteComment = "DELETE FROM TB_COMMENT";
            String deletePost = "DELETE FROM TB_POST";
            em.createNativeQuery(deleteComment).executeUpdate();
            em.createNativeQuery(deletePost).executeUpdate();
            Post post = new Post();
            post.setTitle("Title at test");
            post.setContents("Contents at test");
            List<Comment> commentList = new ArrayList<>();
            for (int index = 0; index < 3; index++) {
                Comment comment = new Comment();
                comment.setComment("Comment at test, " + index);
                comment.setPost(post);
                commentList.add(comment);
            }
            post.setCommentList(commentList);
            em.persist(post);
            em.getTransaction().commit();
        } catch (Exception ex) {
            em.getTransaction().rollback();
            log.error("exception occurs", ex);
        } finally {
            em.close();
        }
    }

    @Test
    public void test_merge() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            String findPost = "SELECT * FROM TB_POST WHERE TITLE ='Title at test'";
            Post post = (Post) em.createNativeQuery(findPost, Post.class).getSingleResult();
            List<Comment> commentList = post.getCommentList();
            commentList.get(0).setComment("change comment at second test");
            em.detach(post);
            em.merge(post);
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

##### 테스트 결과 로그
- Post 객체를 em.detatch(E) 메소드를 통해 managed 상태에서 detached 상태로 변경합니다.
- Post 객체를 em.merge(E) 메소드를 통해 detached 상태에서 managed 상태로 변경합니다.
- Comment 객체들은 함께 managed 상태로 변경됩니다.
- Comment 객체 변경 상태가 데이터베이스에 반영됩니다.(dirty checking 성공)

```
2021-05-26 00:55:41.693  INFO 13020 --- [           main] b.i.action.cascade.CascadeTypeMergeTest  : Started CascadeTypeMergeTest in 4.43 seconds (JVM running for 5.36)
Hibernate: DELETE FROM TB_COMMENT
Hibernate: DELETE FROM TB_POST
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: insert into tb_post (contents, title, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: SELECT * FROM TB_POST WHERE TITLE ='Title at test'
Hibernate: select commentlis0_.post_id as post_id3_2_0_, commentlis0_.id as id1_2_0_, commentlis0_.id as id1_2_1_, commentlis0_.comment as comment2_2_1_, commentlis0_.post_id as post_id3_2_1_ from tb_comment commentlis0_ where commentlis0_.post_id=?
Hibernate: select post0_.id as id1_3_1_, post0_.contents as contents2_3_1_, post0_.title as title3_3_1_, commentlis1_.post_id as post_id3_2_3_, commentlis1_.id as id1_2_3_, commentlis1_.id as id1_2_0_, commentlis1_.comment as comment2_2_0_, commentlis1_.post_id as post_id3_2_0_ from tb_post post0_ left outer join tb_comment commentlis1_ on post0_.id=commentlis1_.post_id where post0_.id=?
Hibernate: update tb_comment set comment=?, post_id=? where id=?
2021-05-26 00:55:41.908  INFO 13020 --- [extShutdownHook] o.s.s.concurrent.ThreadPoolTaskExecutor  : Shutting down ExecutorService 'applicationTaskExecutor'
2021-05-26 00:55:41.908  INFO 13020 --- [extShutdownHook] j.LocalContainerEntityManagerFactoryBean : Closing JPA EntityManagerFactory for persistence unit 'default'
```

##### 테스트 결과 이미지
- 테스트 수행 후 각 테이블 별 데이터 상태입니다.

<p align="center"><img src="/images/jpa-cascade-type-6.JPG" width="60%"></p>

### 4.5. CascadeType.REFRESH 테스트

#### 4.5.1. Post 클래스 cascade 값 변경
- 아래와 같이 변경합니다.

```java
    @OneToMany(mappedBy = "post", cascade = {CascadeType.PERSIST, CascadeType.REFRESH})
    private List<Comment> commentList;
```

#### 4.5.2. 테스트 코드
- @BeforeEach 애너테이션을 통해 테스트 수행 전 데이터를 초기화합니다.
- Post 객체를 조회합니다.(managed 상태)
- Comment 객체를 Lazy Loading을 통해 획득합니다.(managed 상태)
- UPDATE 쿼리를 이용해 TB_COMMENT 테이블의 데이터를 변경합니다.
- em.refresh(E) 수행 전 Comment 객체의 comment 값이 'TEST'가 아님을 확인합니다.
- em.refresh(E) 메소드를 수행하여 Post 객체를 데이터베이스와 동기화시킵니다.
- em.refresh(E) 수행 전 Comment 객체의 comment 값이 'TEST'임을 확인합니다.

```java
package blog.in.action.cascade;

import static org.assertj.core.api.Assertions.assertThat;
import blog.in.action.cascade.entity.Comment;
import blog.in.action.cascade.entity.Post;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.FlushModeType;
import javax.persistence.PersistenceUnit;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@Log4j2
@SpringBootTest
public class CascadeTypeRefreshTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @BeforeEach
    public void beforeEach() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            String deleteComment = "DELETE FROM TB_COMMENT";
            String deletePost = "DELETE FROM TB_POST";
            em.createNativeQuery(deleteComment).executeUpdate();
            em.createNativeQuery(deletePost).executeUpdate();
            Post post = new Post();
            post.setTitle("Title at test");
            post.setContents("Contents at test");
            List<Comment> commentList = new ArrayList<>();
            for (int index = 0; index < 3; index++) {
                Comment comment = new Comment();
                comment.setComment("Comment at test, " + index);
                comment.setPost(post);
                commentList.add(comment);
            }
            post.setCommentList(commentList);
            em.persist(post);
            em.getTransaction().commit();
        } catch (Exception ex) {
            em.getTransaction().rollback();
            log.error("exception occurs", ex);
        } finally {
            em.close();
        }
    }

    @Test
    public void test_refresh() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            String findPost = "SELECT * FROM TB_POST WHERE TITLE ='Title at test'";
            String updateComment = "UPDATE TB_COMMENT SET COMMENT = 'TEST' WHERE POST_ID = ";
            Post post = (Post) em.createNativeQuery(findPost, Post.class).getSingleResult();
            Comment comment = post.getCommentList().get(0);
            em.createNativeQuery(updateComment + post.getId()).executeUpdate();
            assertThat(comment.getComment()).isNotEqualTo("TEST");
            log.info("========= comment before refresh: " + comment.getComment());
            em.refresh(post);
            log.info("========= comment after refresh: " + comment.getComment());
            assertThat(comment.getComment()).isEqualTo("TEST");
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

##### 테스트 결과 로그
- Post 객체를 em.refresh(E) 메소드를 통해 데이터베이스와 값을 동기화시킵니다.
- Comment 객체에 대해 em.refresh(E) 메소드를 수행하지 않았음에도 데이터베이스와 동기화 되었음을 알 수 있습니다.

```
2021-05-26 01:24:21.687  INFO 3852 --- [           main] b.i.a.cascade.CascadeTypeRefreshTest     : Started CascadeTypeRefreshTest in 4.61 seconds (JVM running for 5.559)
Hibernate: DELETE FROM TB_COMMENT
Hibernate: DELETE FROM TB_POST
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: select next_val as id_val from hibernate_sequence for update
Hibernate: update hibernate_sequence set next_val= ? where next_val=?
Hibernate: insert into tb_post (contents, title, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: insert into tb_comment (comment, post_id, id) values (?, ?, ?)
Hibernate: SELECT * FROM TB_POST WHERE TITLE ='Title at test'
Hibernate: select commentlis0_.post_id as post_id3_2_0_, commentlis0_.id as id1_2_0_, commentlis0_.id as id1_2_1_, commentlis0_.comment as comment2_2_1_, commentlis0_.post_id as post_id3_2_1_ from tb_comment commentlis0_ where commentlis0_.post_id=?
Hibernate: UPDATE TB_COMMENT SET COMMENT = 'TEST' WHERE POST_ID = 155
2021-05-26 01:24:21.918  INFO 3852 --- [           main] b.i.a.cascade.CascadeTypeRefreshTest     : ========= comment before refresh: Comment at test, 0
Hibernate: select comment0_.id as id1_2_0_, comment0_.comment as comment2_2_0_, comment0_.post_id as post_id3_2_0_ from tb_comment comment0_ where comment0_.id=?
Hibernate: select comment0_.id as id1_2_0_, comment0_.comment as comment2_2_0_, comment0_.post_id as post_id3_2_0_ from tb_comment comment0_ where comment0_.id=?
Hibernate: select comment0_.id as id1_2_0_, comment0_.comment as comment2_2_0_, comment0_.post_id as post_id3_2_0_ from tb_comment comment0_ where comment0_.id=?
Hibernate: select post0_.id as id1_3_1_, post0_.contents as contents2_3_1_, post0_.title as title3_3_1_, commentlis1_.post_id as post_id3_2_3_, commentlis1_.id as id1_2_3_, commentlis1_.id as id1_2_0_, commentlis1_.comment as comment2_2_0_, commentlis1_.post_id as post_id3_2_0_ from tb_post post0_ left outer join tb_comment commentlis1_ on post0_.id=commentlis1_.post_id where post0_.id=?
2021-05-26 01:24:21.934  INFO 3852 --- [           main] b.i.a.cascade.CascadeTypeRefreshTest     : ========= comment after refresh: TEST
2021-05-26 01:24:21.950  INFO 3852 --- [extShutdownHook] o.s.s.concurrent.ThreadPoolTaskExecutor  : Shutting down ExecutorService 'applicationTaskExecutor'
```

## CLOSING
예전에 JPA를 주제로 작성한 포스트들을 다시 한번 훑어볼 수 있어서 유익한 시간이었습니다. 
`CascadeType.ALL`의 경우 모든 케이스에 대한 적용이므로 별도의 테스트 코드를 작성하지는 않았습니다. 
영속성 전이와 관련한 포스트들을 읽어보는 중 `고아(Orphan) 객체`라는 용어를 발견했습니다. 
처음 들어보는 용어라 관련된 내용에 대한 개념만 메모해두도록 하겠습니다. 
자세한 내용은 다음에 포스트로 다뤄보겠습니다. 

> **고아(Orphan) 객체**<br/>
> 부모 엔티티와 연관관계가 끊어진 자식 엔티티를 자동으로 삭제 하는 기능을 고아 객체 라고 합니다. 

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-05-26-jpa-cascade-type>

#### REFERENCE

- <https://junhyunny.github.io/spring-boot/jpa/java-persistence-api/>
- <https://junhyunny.github.io/spring-boot/jpa/junit/jpa-persistence-context/>
* <https://joel-dev.site/90>
- <https://parkhyeokjin.github.io/jpa/2019/11/06/JPA-chap8.html>
- [JPA 프로그래밍 입문 - Chapter11 영속성 전이][cascade-blog-link-1]

[cascade-blog-link-1]: https://gunju-ko.github.io/jpa/2019/05/21/JPA-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D-%EC%9E%85%EB%AC%B8-chapter11-%EC%98%81%EC%86%8D%EC%84%B1-%EC%A0%84%EC%9D%B4.html