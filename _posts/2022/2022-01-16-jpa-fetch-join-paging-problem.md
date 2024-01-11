---
title: "JPA Fetch 조인(join)과 페이징(paging) 처리"
search: false
category:
  - spring-boot
  - jpa
last_modified_at: 2022-01-16T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [JPA 페이징(paging) 처리][jpa-paging-link]
- [JPA N+1 Problem][jpa-one-plus-n-problem-link]

## 0. 들어가면서

[JPA N+1 Problem][jpa-one-plus-n-problem-link] 포스트에선 `JPA`를 사용할 때 발생하는 N+1 문제와 이를 해결하기 위한 방법을 다뤘습니다. 
이번엔 N+1 문제의 해결 방법인 fetch 조인(join)과 페이징(paging) 처리를 동시에 하면 발생하는 문제에 대해 알아보고 해결법을 정리하였습니다. 

## 1. fetch 조인(join)시 페이징(paging) 처리 문제

JPA는 Pageable 인터페이스를 통해 쉬운 페이징 처리 기능을 제공합니다. 
하지만 N+1 문제 회피를 위해 사용하는 fetch 조인과 함께 사용한다면 문제가 될 수 있습니다. 

### 1.1. 문제 발생 상황

Post 엔티티와 Reply 엔티티는 일대다 관계를 가집니다. 
코드와 ERD(Entity Relationship Diagram)을 먼저 살펴보도록 하겠습니다. 

##### Post 엔티티

```java
package blog.in.action.post;

import blog.in.action.reply.Reply;
import lombok.*;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private long id;

    @Column
    private String title;

    @Column
    private String content;

    @OneToMany(mappedBy = "post")
    private List<Reply> replies;

    public void addReply(Reply reply) {
        if (replies == null) {
            replies = new ArrayList<>();
        }
        replies.add(reply);
    }
}
```

##### Reply 엔티티

```java
package blog.in.action.reply;

import blog.in.action.post.Post;
import lombok.*;

import javax.persistence.*;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Reply {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private long id;

    @Column
    private String content;

    @ManyToOne
    @JoinColumn(name = "post_id")
    private Post post;
}
```

##### 엔티티 관계 다이어그램 (ERD, Entity Relationship Diagram)

<p align="left"><img src="/images/jpa-fetch-join-paging-problem-1.JPG" width="20%"></p>

### 1.2. 문제 상황 확인

간단한 테스트 코드를 통해 문제 상황을 확인해보겠습니다.

#### 1.2.1. 테스트 코드

```java
package blog.in.action.post;

import blog.in.action.reply.Reply;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import javax.persistence.EntityManager;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
public class PostRepositoryTest {

    @Autowired
    private EntityManager em;

    @Autowired
    private PostRepository postRepository;

    Post getPost(String title, String content) {
        return Post.builder()
                .title(title)
                .content(content)
                .build();
    }

    void insertReply(Post post, String content) {
        for (int index = 0; index < 10; index++) {
            Reply reply = Reply.builder()
                    .content(content + index)
                    .post(post)
                    .build();
            post.addReply(reply);
            em.persist(reply);
        }
    }

    @BeforeEach
    public void setup() {

        for (int index = 0; index < 10; index++) {
            Post post = getPost(index + " post", "this is the " + index + " post.");
            postRepository.save(post);
            insertReply(post, index + "-reply-");
        }

        em.flush();
        em.clear();
    }

    @Test
    public void whenFindByContentLikeFetchJoin_thenOutOfMemoryWarningMessage() {

        Pageable pageable = PageRequest.of(1, 5);

        Page<Post> postPage = postRepository.findByContentLikeFetchJoin("post", pageable);

        List<Post> posts = postPage.getContent();
        Set<Reply> replies = posts.stream()
                .map(post -> post.getReplies())
                .flatMap(repliesStream -> repliesStream.stream())
                .collect(Collectors.toSet());

        assertThat(replies.size()).isEqualTo(50);
    }
}
```

#### 1.2.2. 구현 코드
- `findByContentLikeFetchJoin` 메소드
    - fetch 조인 처리를 수행합니다.
    - Pageable 객체를 통해 페이징 처리를 수행합니다.
    - 페이징 처리된 결과를 반환합니다.

```java
package blog.in.action.post;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Query(value = "SELECT DISTINCT p FROM Post p JOIN FETCH p.replies WHERE p.content LIKE %:content%",
            countQuery = "SELECT COUNT(DISTINCT p) FROM Post p INNER JOIN p.replies WHERE p.content LIKE %:content%")
    Page<Post> findByContentLikeFetchJoin(String content, Pageable pageable);
}
```

#### 1.2.4. 경고 메시지 및 수행 쿼리

##### 경고 메시지
- 쿼리 수행 결과를 모두 어플리케이션 메모리에 올려서 페이징 처리를 수행했다는 의미입니다.
- OOM(Out Of Memory) 문제를 유발할 수 있으므로 치명적입니다.

```
2022-01-16 12:37:18.309  WARN 39536 --- [           main] o.h.h.internal.ast.QueryTranslatorImpl   : HHH000104: firstResult/maxResults specified with collection fetch; applying in memory!
```

##### 수행 쿼리
- 실제 수행 쿼리를 보면 `limit`, `rownum` 같은 키워드 없이 데이터를 조회합니다.
- 조회 조건에 매칭되는 결과가 10만 건이면 모두 어플리케이션 메모리에 올리게 됩니다.

```sql
select distinct post0_.id         as id1_0_0_,
                replies1_.id      as id1_1_1_,
                post0_.content    as content2_0_0_,
                post0_.title      as title3_0_0_,
                replies1_.content as content2_1_1_,
                replies1_.post_id as post_id3_1_1_,
                replies1_.post_id as post_id3_1_0__,
                replies1_.id      as id1_1_0__
from post post0_ inner join reply replies1_ on post0_.id = replies1_.post_id
where post0_.content like ?
```

## 2. 문제 해결 방법

### 2.1. 기본 페이징 처리 및 default_batch_fetch_size 설정 사용

`@OneToMany` 애너테이션으로 관계가 맺어져 있는 경우 조인과 페이징 처리를 동시에 처리하기 어려웠습니다. 
`join fetch`를 `inner join`으로 변경하더라도 페이징 처리는 되지만, 지연 로딩(lazy loading)으로 N+1 문제가 다시 발생합니다. 

**그래서 해결 방법으로 조인을 제거하였습니다.** 
일반적은 페이징 처리 후 발생하는 N+1 문제는 `default_batch_fetch_size` 설정을 통해 해결하였습니다. 
관련된 설정은 application.yml 파일에 추가하면 됩니다.

##### application.yml 설정 추가

```yml
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 1000
```

### 2.2. 테스트 코드

```java
package blog.in.action.post;

import blog.in.action.reply.Reply;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import javax.persistence.EntityManager;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(
        properties = {"spring.jpa.properties.hibernate.default_batch_fetch_size=1000"}
)
public class PostRepositoryTest {

    @Autowired
    private EntityManager em;

    @Autowired
    private PostRepository postRepository;

    Post getPost(String title, String content) {
        return Post.builder()
                .title(title)
                .content(content)
                .build();
    }

    void insertReply(Post post, String content) {
        for (int index = 0; index < 10; index++) {
            Reply reply = Reply.builder()
                    .content(content + index)
                    .post(post)
                    .build();
            post.addReply(reply);
            em.persist(reply);
        }
    }

    @BeforeEach
    public void setup() {

        for (int index = 0; index < 10; index++) {
            Post post = getPost(index + " post", "this is the " + index + " post.");
            postRepository.save(post);
            insertReply(post, index + "-reply-");
        }

        em.flush();
        em.clear();
    }

    @Test
    public void whenFindByContentLike_thenPagingWithInQuery() {

        Pageable pageable = PageRequest.of(1, 5);

        Page<Post> postPage = postRepository.findByContentLike("post", pageable);

        List<Post> posts = postPage.getContent();
        Set<Reply> replies = posts.stream()
                .map(post -> post.getReplies())
                .flatMap(repliesStream -> repliesStream.stream())
                .collect(Collectors.toSet());

        assertThat(replies.size()).isEqualTo(50);
    }
}
```

### 2.3. 구현 코드

```java
package blog.in.action.post;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Query(value = "SELECT p FROM Post p WHERE p.content LIKE %:content%",
            countQuery = "SELECT COUNT(p) FROM Post p WHERE p.content LIKE %:content%")
    Page<Post> findByContentLike(String content, Pageable pageable);
}
```

### 2.4. 결과 쿼리
- 쿼리 수행시 `limit`, `offset`으로 페이징 처리합니다.
- 지연 로딩으로 인한 N+1 문제는 default_batch_fetch_size 설정으로 `in (...)` 처리합니다.

```sql
-- limit, offset 쿼리
select post0_.id as id1_0_, post0_.content as content2_0_, post0_.title as title3_0_
from post post0_
where post0_.content like ?
limit ? offset ?

-- count 쿼리
select count(post0_.id) as col_0_0_
from post post0_
where post0_.content like ?

-- default_batch_fetch_size 설정을 통해 N+1 문제를 IN 쿼리로 변경
select replies0_.post_id as post_id3_1_1_,
       replies0_.id      as id1_1_1_,
       replies0_.id      as id1_1_0_,
       replies0_.content as content2_1_0_,
       replies0_.post_id as post_id3_1_0_
from reply replies0_
where replies0_.post_id in (?, ?, ?, ?, ?)
```

## 3. 그 외 관련 테스트 사항

`@OneToMany`, `@ManyToOne` 애너테이션에 따라 페이징 방식과 결과가 다른 것 같습니다. 
일부 엔티티 관계를 고려하지 않은 테스트 코드들이 섞여 있는 것으로 보입니다. 
참고한 내용들을 보면 한 눈에 확인하기 어려운 것 같아서 관련된 테스트 결과를 정리하였습니다. 

### 3.1. @OneToMany 애너테이션과 일반 조인 사용
- 쿼리에서 distnict 처리가 필요합니다.
- 쿼리에서 limit, offset 처리를 수행합니다.
- 지연 로딩 발생으로 인해 N+1 문제를 default_batch_fetch_size 설정으로 처리할 필요가 있습니다.

#### 3.1.1. 테스트 코드

```java
    @Test
    public void whenFindByContentLikeInnerJoin_thenSeeLimitKeywordButNPlusOne() {

        Pageable pageable = PageRequest.of(1, 5);

        Page<Post> postPage = postRepository.findByContentLikeInnerJoin("post", pageable);

        List<Post> posts = postPage.getContent();
        Set<Reply> replies = posts.stream()
                .map(post -> post.getReplies())
                .flatMap(repliesStream -> repliesStream.stream())
                .collect(Collectors.toSet());

        assertThat(replies.size()).isEqualTo(50);
    }
```

#### 3.1.2. 구현 코드

```java
public interface PostRepository extends JpaRepository<Post, Long> {

    @Query(value = "SELECT DISTINCT p FROM Post p INNER JOIN p.replies WHERE p.content LIKE %:content%",
            countQuery = "SELECT COUNT(DISTINCT p) FROM Post p INNER JOIN p.replies WHERE p.content LIKE %:content%")
    Page<Post> findByContentLikeInnerJoin(String content, Pageable pageable);
}
```

#### 3.1.3. SQL 로그

```sql
-- limit, offset 쿼리
select distinct post0_.id      as id1_0_,
                post0_.content as content2_0_,
                post0_.title   as title3_0_
from post post0_
         inner join reply replies1_ on post0_.id = replies1_.post_id
where post0_.content like ?
limit ? offset ?

-- count 쿼리
select count(distinct post0_.id) as col_0_0_
from post post0_
         inner join reply replies1_ on post0_.id = replies1_.post_id
where post0_.content like ?

-- default_batch_fetch_size 설정을 통해 N+1 문제를 IN 쿼리로 변경
select replies0_.post_id as post_id3_1_1_,
       replies0_.id      as id1_1_1_,
       replies0_.id      as id1_1_0_,
       replies0_.content as content2_1_0_,
       replies0_.post_id as post_id3_1_0_
from reply replies0_
where replies0_.post_id in (?, ?, ?, ?, ?)
```

### 3.2. @OneToMany 애너테이션과 @EntityGraph 애너테이션 사용
- OOM 경고 메시지가 출력됩니다.
    - HHH000104: firstResult/maxResults specified with collection fetch; applying in memory!
- 쿼리에서 limit, offset 처리를 미수행합니다.

#### 3.2.1. 테스트 코드

```java
    @Test
    public void whenFindByContentLikeEntityGraph_thenPagingWithInQuery() {

        Pageable pageable = PageRequest.of(1, 5);

        Page<Post> postPage = postRepository.findByContentLikeEntityGraph("post", pageable);

        List<Post> posts = postPage.getContent();
        Set<Reply> replies = posts.stream()
                .map(post -> post.getReplies())
                .flatMap(repliesStream -> repliesStream.stream())
                .collect(Collectors.toSet());

        assertThat(replies.size()).isEqualTo(50);
    }
```

#### 3.2.2. 구현 코드

```java
public interface PostRepository extends JpaRepository<Post, Long> {

    @EntityGraph(attributePaths = {"replies"})
    @Query(value = "SELECT p FROM Post p WHERE p.content LIKE %:content%",
            countQuery = "SELECT COUNT(p) FROM Post p WHERE p.content LIKE %:content%")
    Page<Post> findByContentLikeEntityGraph(String content, Pageable pageable);
}
```

#### 3.2.3. SQL 로그

```sql
-- limit, offset 처리되지 않은 쿼리
select post0_.id         as id1_0_0_,
       replies1_.id      as id1_1_1_,
       post0_.content    as content2_0_0_,
       post0_.title      as title3_0_0_,
       replies1_.content as content2_1_1_,
       replies1_.post_id as post_id3_1_1_,
       replies1_.post_id as post_id3_1_0__,
       replies1_.id      as id1_1_0__
from post post0_
         left outer join reply replies1_ on post0_.id = replies1_.post_id
where post0_.content like ?

-- count 쿼리
select count(post0_.id) as col_0_0_
from post post0_
where post0_.content like ?
```

### 3.3. @ManyToOne 애너테이션과 fetch 조인 사용
- 쿼리에서 limit, offset 처리를 수행합니다.

#### 3.3.1. 테스트 코드

```java
    @Test
    public void whenFindByPostIdFetchJoin_thenNothingWarning() {

        Pageable pageable = PageRequest.of(1, 5);

        Page<Reply> replyPage = replyRepository.findByContentLikeFetchJoin("0-reply-", pageable);

        assertThat(replyPage.getContent().size()).isEqualTo(5);
    }
```

#### 3.3.2. 구현 코드

```java
public interface ReplyRepository extends JpaRepository<Reply, Long> {

    @Query(value = "SELECT r FROM Reply r JOIN FETCH r.post WHERE r.content LIKE %:content%",
            countQuery = "SELECT COUNT(r) FROM Reply r INNER JOIN r.post WHERE r.content LIKE %:content%")
    Page<Reply> findByContentLikeFetchJoin(String content, Pageable pageable);
}
```

#### 3.3.3. SQL 로그

```sql
-- limit, offset, fetch 처리된 쿼리
select reply0_.id      as id1_1_0_,
       post1_.id       as id1_0_1_,
       reply0_.content as content2_1_0_,
       reply0_.post_id as post_id3_1_0_,
       post1_.content  as content2_0_1_,
       post1_.title    as title3_0_1_
from reply reply0_
         inner join post post1_ on reply0_.post_id = post1_.id
where reply0_.content like ?
limit ? offset ?

-- count 쿼리
select count(reply0_.id) as col_0_0_
from reply reply0_
         inner join post post1_ on reply0_.post_id = post1_.id
where reply0_.content like ?
```

### 3.4. @ManyToOne 애너테이션과 일반 조인 사용
- 쿼리에서 limit, offset 처리를 수행합니다.
- fetch 조인이 아니므로 Post 엔티티 정보를 조회하지 않습니다. 
- 별도 Post 엔티티 조회 쿼리를 수행합니다.

#### 3.4.1. 테스트 코드

```java
    @Test
    public void whenFindByPostIdInnerJoin_thenNothingWarning() {

        Pageable pageable = PageRequest.of(1, 5);

        Page<Reply> replyPage = replyRepository.findByContentLikeInnerJoin("0-reply-", pageable);

        assertThat(replyPage.getContent().size()).isEqualTo(5);
    }
```

#### 3.4.2. 구현 코드

```java

public interface ReplyRepository extends JpaRepository<Reply, Long> {

    @Query(value = "SELECT r FROM Reply r INNER JOIN r.post WHERE r.content LIKE %:content%",
            countQuery = "SELECT COUNT(r) FROM Reply r INNER JOIN r.post WHERE r.content LIKE %:content%")
    Page<Reply> findByContentLikeInnerJoin(String content, Pageable pageable);
}
```

#### 3.4.3. SQL 로그

```sql
-- limit, offset 쿼리
select reply0_.id      as id1_1_,
       reply0_.content as content2_1_,
       reply0_.post_id as post_id3_1_
from reply reply0_
         inner join post post1_ on reply0_.post_id = post1_.id
where reply0_.content like ?
limit ? offset ?

-- Fetch 타입 Eager로 인한 데이터 조회
select post0_.id      as id1_0_0_,
       post0_.content as content2_0_0_,
       post0_.title   as title3_0_0_
from post post0_
where post0_.id = ?

-- count 쿼리
select count(reply0_.id) as col_0_0_
from reply reply0_
         inner join post post1_ on reply0_.post_id = post1_.id
where reply0_.content like ?
```

### 3.5. @ManyToOne 애너테이션과 @EntityGraph 애너테이션 사용
- 쿼리에서 limit, offset 처리를 수행합니다.

#### 3.5.1. 테스트 코드

```java
    @Test
    public void whenFindByPostIdEntityGraph_thenNothingWarning() {

        Pageable pageable = PageRequest.of(1, 5);

        Page<Reply> replyPage = replyRepository.findByContentLikeEntityGraph("0-reply-", pageable);

        assertThat(replyPage.getContent().size()).isEqualTo(5);
    }
```

#### 3.5.2. 구현 코드

```java
public interface ReplyRepository extends JpaRepository<Reply, Long> {

    @EntityGraph(attributePaths = {"post"})
    @Query(value = "SELECT r FROM Reply r WHERE r.content LIKE %:content%",
            countQuery = "SELECT COUNT(r) FROM Reply r LEFT OUTER JOIN r.post WHERE r.content LIKE %:content%")
    Page<Reply> findByContentLikeEntityGraph(String content, Pageable pageable);
}
```

#### 3.6.3. SQL 로그

```sql
-- limit, offset, fetch 처리된 쿼리
select reply0_.id      as id1_1_0_,
       post1_.id       as id1_0_1_,
       reply0_.content as content2_1_0_,
       reply0_.post_id as post_id3_1_0_,
       post1_.content  as content2_0_1_,
       post1_.title    as title3_0_1_
from reply reply0_
         left outer join post post1_ on reply0_.post_id = post1_.id
where reply0_.content like ?
limit ? offset ?

-- count 쿼리
select count(reply0_.id) as col_0_0_
from reply reply0_
         left outer join post post1_ on reply0_.post_id = post1_.id
where reply0_.content like ?
```

## CLOSING

인프런에 김영한님이 달아주신 답변을 보면 다음과 같이 정리할 수 있습니다.
- `-ToOne` 애너테이션을 통해 형성된 관계인 경우 테이블 조인에 따라 데이터 수가 변경되지 않으므로 페이징 처리가 잘됩니다.
- `-ToMany` 애너테이션을 통해 형성된 관계인 경우 테이블 조인에 따라 데이터가 변경되어 페이징 처리와 페치 조인이 동시에 불가능합니다.

<p align="center">
    <img src="/images/jpa-fetch-join-paging-problem-2.JPG" width="80%" class="image__border">
</p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-01-16-jpa-fetch-join-paging-problem>

#### REFERENCE
- <https://bcp0109.tistory.com/304>
- <https://velog.io/@rainmaker007/jpa-fetch-join>
- <https://tecoble.techcourse.co.kr/post/2020-10-21-jpa-fetch-join-paging/>

[jpa-paging-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-paging/
[jpa-one-plus-n-problem-link]: https://junhyunny.github.io/spring-boot/jpa/jpa-one-plus-n-problem/
