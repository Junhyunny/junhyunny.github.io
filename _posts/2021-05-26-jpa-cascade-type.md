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

#### RECOMMEND POSTS BEFORE THIS

* [JPA(Java Persistence API)][java-persistence-api-link]
* [PersistenceContext and Entity Lifecycle][jpa-persistence-context-link]

## 1. Entity Lifecycle

JPA(Java Persistence API)의 `CascadeType`를 정리하기 전에 엔티티 라이프사이클(entity lifecycle)를 먼저 살펴보겠습니다. 

* 비영속(new/transient)
    * 엔티티 객체를 새로 생성하였지만 엔티티 매니저(entity manager)에 의해 관리되고 있지 않는 상태입니다.
    * 엔티티 객체가 영속성 컨텍스트와 전혀 관계가 없는 상태입니다.
* 영속(managed)
    * 엔티티 객체가 엔티티 매니저에 의해 관리되고 있는 상태입니다.
    * 엔티티 객체가 영속성 컨텍스트에 저장되어 상태입니다.
    * persist(E) 메소드를 통해 영속성 컨텍스트에 저장됩니다.
* 준영속(detached)
    * 엔티티 객체가 영속성 컨텍스트에서 분리된 상태입니다.
    * 엔티티 객체가 영속성 컨텍스트에서 분리된 상태이므로 엔티티 매니저는 객체의 변화를 감지하지 못합니다.
    * detach(E) 메소드를 통해 영속성 컨텍스트에서 분리됩니다.
* 삭제(removed)
    * 엔티티 객체를 영속성 컨텍스트에서 삭제하는 행위입니다.
    * remove(E) 메소드를 통해 영속성 컨텍스트에서 삭제됩니다.

<p align="center">
    <img src="/images/jpa-cascade-type-1.JPG" width="60%" class="image__border">
</p>
<center>https://gunlog.dev/JPA-Persistence-Context/</center>

## 2. Cascade in JPA 

JPA에서 `Casecade`는 영속성이 전이를 위해 사용합니다.

> 영속성 전이는 엔티티의 영속성 상태 변화를 연관된 엔티티에도 함께 적용하는 것이다. 예를 들어, 엔티티를 저장할 때 연관된 엔티티도 함께 저장하고, 엔티티를 삭제할 때 연관된 엔티티도 함께 삭제하는 것이 영속성 전이이다.

엔티티들 사이의 관계는 @OneToOne, @OneToMany, @ManyToOne, @ManyToMany 애너테이션을 사용하여 정의합니다. 
이 애너테이션들의 `cascade` 속성(attribute)를 사용하면 연관 관계가 맺어진 엔티티들 사이의 전이 여부와 시점을 지정할 수 있습니다. 
다음은 각 `CascadeType`에 따라 영속성 전이가 이루어지는 시점입니다.
 
* PERSIST 
    * 엔티티 객체가 `new` 상태에서 `managed` 상태로 변경되는 시점
* REMOVE 
    * 엔티티 객체가 `managed` 상태에서 `removed` 상태로 변경되는 시점
* DETACH 
    * 엔티티 객체가 `managed` 상태에서 `detached` 상태로 변경되는 시점
* MERGE 
    * 엔티티 객체가 `detached` 상태에서 `managed` 상태로 변경되는 시점
* REFRESH 
    * 엔티티 매니저의 refresh(E) 메소드 호출 시점
* ALL 
    * 모든 상태 변화에 대해 종속된 엔티티들의 영속 상태를 함께 반영

## 3. Practice

간단한 테스트 코드를 통해 실습하기 전 위 내용을 간략하게 정리해보면 다음과 같습니다. 

* 특정 엔티티 객체의 영속 상태가 변경될 때 종속된 엔티티 객체들도 함께 반영되는 것을 영속성 전이라고 한다.
* JPA는 관계를 맺는 애너테이션을 사용해 영속성 전이를 일으킬 수 있다.
* 영속성 전이가 일어나는 시점은 `CascadeType`으로 지정할 수 있다.

### 3.1. Entity Relationship Diagram

* 부모 엔티티는 `Post` 클래스입니다.
* 종속된 엔티티는 `Comment` 클래스입니다.

<p align="left">
    <img src="/images/jpa-cascade-type-2.JPG" width="20%" class="image__border">
</p>


### 3.2. Entities

* Post 클래스입니다.
* @OneToMany 애너테이션의 cascade 속성을 사용해 영속성 전이 시점을 바꿔가면서 테스트합니다.

```java
package blog.in.action.cascade.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;

import java.util.List;

@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Post {

    @Id
    @GeneratedValue
    private long id;

    @Column
    private String content;

    @OneToMany(cascade = {})
    private List<Comment> comments;
}
```

* Comment 클래스입니다.

```java
package blog.in.action.cascade.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.*;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Comment {

    @Id
    @GeneratedValue
    private long id;

    @Setter
    @Column
    private String content;
}
```

### 3.3. CascadeType.PERSIST

* 다음과 같이 Post 클래스를 변경합니다.

```java
    @OneToMany(cascade = {CascadeType.PERSIST})
    private List<Comment> commentList;
```

* Post 엔티티와 Comment 엔티티 객체를 생성합니다.
* 두 엔티티 객체를 연결합니다.
* persit(E) 메소드를 통해 영속성 컨텍스트에 저장합니다.
* 영속성 컨텍스트 내용을 데이터베이스에 반영하고 비웁니다.
* 데이터베이스에 데이터가 저장되었는지 확인합니다.

```java
package blog.in.action.cascade;

import blog.in.action.cascade.entity.Comment;
import blog.in.action.cascade.entity.Post;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import jakarta.persistence.EntityManager;

import java.util.Collections;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@DataJpaTest
public class PersistTest {

    @PersistenceContext
    private EntityManager sut;

    @Test
    public void cascade_when_persist() {

        var comment = Comment.builder()
                .content("This is comment")
                .build();
        var comments = Collections.singletonList(comment);
        var post = Post.builder()
                .content("Hello World")
                .comments(comments)
                .build();


        sut.persist(post);
        sut.flush();
        sut.clear();


        var postId = post.getId();
        var commentId = comment.getId();
        var resultPost = sut.find(Post.class, postId);
        var resultComment = sut.find(Comment.class, commentId);
        assertThat(resultPost.getContent(), equalTo("Hello World"));
        assertThat(resultComment.getContent(), equalTo("This is comment"));
    }
}
```

##### Result Log

* Post, Comment 엔티티 모두 데이터베이스에 삽입(insert)됩니다.
* 중간 매핑(mapping)을 위한 post_comments 테이블에 데이터가 삽입됩니다. 

```
Hibernate: select next value for post_seq
Hibernate: select next value for comment_seq
Hibernate: insert into post (content,id) values (?,?)
Hibernate: insert into comment (content,id) values (?,?)
Hibernate: insert into post_comments (post_id,comments_id) values (?,?)
Hibernate: select p1_0.id,p1_0.content from post p1_0 where p1_0.id=?
Hibernate: select c1_0.id,c1_0.content from comment c1_0 where c1_0.id=?
```

### 3.4. CascadeType.REMOVE

* 다음과 같이 Post 클래스를 변경합니다.

```java
    @OneToMany(cascade = {CascadeType.REMOVE})
    private List<Comment> comments;
```

* beforeEach 메소드를 통해 테스트 실행 전 데이터를 미리 삽입합니다
* Post 엔티티 객체를 조회합니다.
* remove(E) 메소드를 사용해 영속성 컨텍스트에서 제거합니다.
* 데이터베이스를 다시 조회했을 때 데이터가 없을 것으로 예상합니다.

```java
package blog.in.action.cascade;

import blog.in.action.cascade.entity.Comment;
import blog.in.action.cascade.entity.Post;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import jakarta.persistence.*;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.SpringBootTest;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@DataJpaTest
public class RemoveTest {

    @PersistenceContext
    private EntityManager sut;

    @BeforeEach
    public void beforeEach() {
        var comment = Comment.builder()
                .content("This is comment")
                .build();
        var comments = Collections.singletonList(comment);
        var post = Post.builder()
                .content("Hello World")
                .comments(comments)
                .build();
        sut.persist(post);
        sut.persist(comment);
        sut.flush();
        sut.clear();
    }

    @Test
    public void cascade_when_remove() {

        String findByContent = "SELECT p FROM Post p where p.content = ?1";
        TypedQuery<Post> selectQuery = sut.createQuery(findByContent, Post.class);
        selectQuery.setParameter(1, "Hello World");
        var post = selectQuery.getSingleResult();
        var postId = post.getId();
        var commentId = post.getComments()
                .get(0)
                .getId();


        sut.remove(post);
        sut.flush();
        sut.clear();


        var resultPost = sut.find(Post.class, postId);
        var resultComment = sut.find(Comment.class, commentId);
        assertThat(resultPost == null, equalTo(true));
        assertThat(resultComment == null, equalTo(true));
    }
}
```

##### Result Log

* Post 엔티티 객체를 영속성 컨테이너에서 제거함으로써 Comment 엔티티 객체도 함께 삭제되는 것을 확인할 수 있습니다.
* 두 엔티티를 연결하는 매핑 테이블, Comment 테이블, Post 테이블 순으로 데이터가 삭제됩니다.

```
Hibernate: select next value for post_seq
Hibernate: select next value for comment_seq
Hibernate: insert into post (content,id) values (?,?)
Hibernate: insert into comment (content,id) values (?,?)
Hibernate: insert into post_comments (post_id,comments_id) values (?,?)
Hibernate: select p1_0.id,p1_0.content from post p1_0 where p1_0.content=?
Hibernate: select c1_0.post_id,c1_1.id,c1_1.content from post_comments c1_0 join comment c1_1 on c1_1.id=c1_0.comments_id where c1_0.post_id=?
Hibernate: delete from post_comments where post_id=?
Hibernate: delete from comment where id=?
Hibernate: delete from post where id=?
Hibernate: select p1_0.id,p1_0.content from post p1_0 where p1_0.id=?
Hibernate: select c1_0.id,c1_0.content from comment c1_0 where c1_0.id=?
```

### 3.5. CascadeType.DETACH

* 다음과 같이 Post 클래스를 변경합니다.

```java
    @OneToMany(cascade = {CascadeType.DETACH})
    private List<Comment> comments;
```

* beforeEach 메소드를 통해 테스트 실행 전 데이터를 미리 삽입합니다
* Post 엔티티 객체를 조회합니다.
* Comment 엔티티 객체의 상태를 변경합니다.
* Post 엔티티 객체를 detach(E) 메소드를 사용해 영속성 컨텍스트가 관리하지 않는 상태로 변경합니다.
* Comment 엔티티 객체의 상태 변경에 대한 오염 감지(dirty checking)이 동작하지 않을 것을 예상합니다.

```java
package blog.in.action.cascade;

import blog.in.action.cascade.entity.Comment;
import blog.in.action.cascade.entity.Post;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Collections;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@DataJpaTest
public class DetachTest {

    @PersistenceContext
    private EntityManager sut;

    @BeforeEach
    public void beforeEach() {
        var comment = Comment.builder()
                .content("This is comment")
                .build();
        var comments = Collections.singletonList(comment);
        var post = Post.builder()
                .content("Hello World")
                .comments(comments)
                .build();
        sut.persist(post);
        sut.persist(comment);
        sut.flush();
        sut.clear();
    }

    @Test
    public void cascade_when_detach() {

        String findByContent = "SELECT p FROM Post p where p.content = ?1";
        TypedQuery<Post> selectQuery = sut.createQuery(findByContent, Post.class);
        selectQuery.setParameter(1, "Hello World");
        var post = selectQuery.getSingleResult();
        var comment = post.getComments().get(0);
        var commentId = comment.getId();


        comment.setContent("This is new comment");
        sut.detach(post);
        sut.flush();
        sut.clear();


        var resultComment = sut.find(Comment.class, commentId);
        assertThat(resultComment.getContent(), equalTo("This is comment"));
    }
}
```

##### Result Log

* Post 엔티티 객체를 준영속 상태로 변경하였기 때문에 Comment 엔티티 객체도 함께 준영속 상태가 됩니다.
* Comment 엔티티 객체의 상태 변경이 데이터베이스에 반영되지 않습니다.
    * detach(E) 메소드 실행 라인을 주석하면 오염 감지가 수행되어 값이 변경됩니다.

```
Hibernate: select next value for post_seq
Hibernate: select next value for comment_seq
Hibernate: insert into post (content,id) values (?,?)
Hibernate: insert into comment (content,id) values (?,?)
Hibernate: insert into post_comments (post_id,comments_id) values (?,?)
Hibernate: select p1_0.id,p1_0.content from post p1_0 where p1_0.content=?
Hibernate: select c1_0.post_id,c1_1.id,c1_1.content from post_comments c1_0 join comment c1_1 on c1_1.id=c1_0.comments_id where c1_0.post_id=?
Hibernate: select c1_0.id,c1_0.content from comment c1_0 where c1_0.id=?
```

### 3.6. CascadeType.MERGE

* 다음과 같이 Post 클래스를 변경합니다.

```java
    @OneToMany(cascade = {CascadeType.MERGE})
    private List<Comment> comments;
```

* beforeEach 메소드를 통해 테스트 실행 전 데이터를 미리 삽입합니다
* Post 엔티티 객체를 조회합니다.
* Post, Comment 엔티티 객체를 detach(E) 메소드를 사용해 영속성 컨텍스트가 관리하지 않는 상태로 변경합니다.
* Comment 엔티티 객체의 상태를 변경하고 Post 엔티티 객체만 영속성 컨텍스트가 관리하는 상태로 다시 변경합니다.
* Comment 엔티티 객체 상태 변경에 대한 오염 감지를 통해 데이터베이스 상태가 변경됨을 기대합니다.

```java
package blog.in.action.cascade;

import blog.in.action.cascade.entity.Comment;
import blog.in.action.cascade.entity.Post;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Collections;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@DataJpaTest
public class MergeTest {

    @PersistenceContext
    private EntityManager sut;

    @BeforeEach
    public void beforeEach() {
        var comment = Comment.builder()
                .content("This is comment")
                .build();
        var comments = Collections.singletonList(comment);
        var post = Post.builder()
                .content("Hello World")
                .comments(comments)
                .build();
        sut.persist(post);
        sut.persist(comment);
        sut.flush();
        sut.clear();
    }

    @Test
    public void cascade_when_merge() {

        String findByContent = "SELECT p FROM Post p where p.content = ?1";
        TypedQuery<Post> selectQuery = sut.createQuery(findByContent, Post.class);
        selectQuery.setParameter(1, "Hello World");
        var post = selectQuery.getSingleResult();
        var comment = post.getComments().get(0);
        var commentId = comment.getId();
        sut.detach(post);
        sut.detach(comment);


        comment.setContent("This is new comment");
        sut.merge(post);
        sut.flush();
        sut.clear();


        var resultComment = sut.find(Comment.class, commentId);
        assertThat(resultComment.getContent(), equalTo("This is new comment"));
    }
}
```

##### Result Log

* Comment 엔티티 객체의 상태 변경으로 인해 오염 감지 기능이 동작합니다.
    * update comment set content=? where id=?

```
Hibernate: select next value for post_seq
Hibernate: select next value for comment_seq
Hibernate: insert into post (content,id) values (?,?)
Hibernate: insert into comment (content,id) values (?,?)
Hibernate: insert into post_comments (post_id,comments_id) values (?,?)
Hibernate: select p1_0.id,p1_0.content from post p1_0 where p1_0.content=?
Hibernate: select c1_0.post_id,c1_1.id,c1_1.content from post_comments c1_0 join comment c1_1 on c1_1.id=c1_0.comments_id where c1_0.post_id=?
Hibernate: select p1_0.id,c1_0.post_id,c1_1.id,c1_1.content,p1_0.content from post p1_0 left join (post_comments c1_0 join comment c1_1 on c1_1.id=c1_0.comments_id) on p1_0.id=c1_0.post_id where p1_0.id=?
Hibernate: update comment set content=? where id=?
Hibernate: select c1_0.id,c1_0.content from comment c1_0 where c1_0.id=?
```

### 4.5. CascadeType.REFRESH

* 다음과 같이 Post 클래스를 변경합니다.

```java
    @OneToMany(cascade = {CascadeType.REFRESH})
    private List<Comment> comments;
```

* beforeEach 메소드를 통해 테스트 실행 전 데이터를 미리 삽입합니다
* Post 엔티티 객체를 조회합니다.
    * Post, Comment 엔티티 객체를 미리 영속성 컨텍스트에서 관리합니다.
* 업데이트 쿼리를 통해 Comment 테이블의 데이터를 직접 변경합니다.
* refresh(E) 메소드를 통해 영속성 컨테이너 내부의 Post 엔티티 객체와 데이터베이스를 동기화합니다.
* 미리 조회한 Comment 엔티티 객체의 상태가 데이터베이스와 동일한 것을 기대합니다.

```java
package blog.in.action.cascade;

import blog.in.action.cascade.entity.Comment;
import blog.in.action.cascade.entity.Post;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.TypedQuery;
import org.hamcrest.MatcherAssert;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Collections;

import static org.hamcrest.Matchers.equalTo;

@DataJpaTest
public class RefreshTest {

    @PersistenceContext
    private EntityManager sut;

    @BeforeEach
    public void beforeEach() {
        var comment = Comment.builder()
                .content("This is comment")
                .build();
        var comments = Collections.singletonList(comment);
        var post = Post.builder()
                .content("Hello World")
                .comments(comments)
                .build();
        sut.persist(post);
        sut.persist(comment);
        sut.flush();
        sut.clear();
    }

    @Test
    public void cascade_when_refresh() {

        String findByContent = "SELECT p FROM Post p where p.content = ?1";
        TypedQuery<Post> selectQuery = sut.createQuery(findByContent, Post.class);
        selectQuery.setParameter(1, "Hello World");
        var post = selectQuery.getSingleResult();
        var comment = post.getComments().get(0);
        var commentId = comment.getId();

        String updateComment = "UPDATE Comment c SET c.content = 'This is new comment' where c.id = ?1";
        Query updateQuery = sut.createQuery(updateComment);
        updateQuery.setParameter(1, commentId);
        updateQuery.executeUpdate();


        sut.refresh(post);


        MatcherAssert.assertThat(comment.getContent(), equalTo("This is new comment"));
    }
}
```

##### Result Log

* refresh(E) 메소드를 통해 영속성 컨테이너와 데이터베이스를 동기화합니다.
    * select c1_0.id,c1_0.content from comment c1_0 where c1_0.id=?
    * select p1_0.id,c1_0.post_id,c1_1.id,c1_1.content,p1_0.content from post p1_0 left join (post_comments c1_0 join comment c1_1 on c1_1.id=c1_0.comments_id) on p1_0.id=c1_0.post_id where p1_0.id=?
* 미리 조회한 Comment 엔티티 객체를 직접 동기화하지 않았음에도 데이터베이스와 동일한 데이터를 가지는 것을 알 수 있습니다.
    * Post 엔티티 객체를 동기화하는 코드 라인을 주석하면 테스트가 실패합니다.

```
Hibernate: select next value for post_seq
Hibernate: select next value for comment_seq
Hibernate: insert into post (content,id) values (?,?)
Hibernate: insert into comment (content,id) values (?,?)
Hibernate: insert into post_comments (post_id,comments_id) values (?,?)
Hibernate: select p1_0.id,p1_0.content from post p1_0 where p1_0.content=?
Hibernate: select c1_0.post_id,c1_1.id,c1_1.content from post_comments c1_0 join comment c1_1 on c1_1.id=c1_0.comments_id where c1_0.post_id=?
Hibernate: update comment set content='This is new comment' where id=?
Hibernate: select c1_0.id,c1_0.content from comment c1_0 where c1_0.id=?
Hibernate: select p1_0.id,c1_0.post_id,c1_1.id,c1_1.content,p1_0.content from post p1_0 left join (post_comments c1_0 join comment c1_1 on c1_1.id=c1_0.comments_id) on p1_0.id=c1_0.post_id where p1_0.id=?
```

## CLOSING

영속성 전이에 대해 공부하면서 `고아(Orphan) 객체`라는 개념을 접했습니다. 
관련된 내용을 메모해두고 다음 포스트에 정리해보겠습니다. 

> 부모 엔티티와 연관관계가 끊어진 자식 엔티티를 자동으로 삭제 하는 기능을 고아 객체 라고 합니다. 

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-05-26-jpa-cascade-type>

#### REFERENCE

* <https://joel-dev.site/90>
* <https://parkhyeokjin.github.io/jpa/2019/11/06/JPA-chap8.html>
* [JPA 프로그래밍 입문 - Chapter11 영속성 전이][cascade-blog-link]

[cascade-blog-link]: https://gunju-ko.github.io/jpa/2019/05/21/JPA-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D-%EC%9E%85%EB%AC%B8-chapter11-%EC%98%81%EC%86%8D%EC%84%B1-%EC%A0%84%EC%9D%B4.html


[java-persistence-api-link]: https://junhyunny.github.io/spring-boot/jpa/java-persistence-api/
[jpa-persistence-context-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-persistence-context/