---
title: "JPA N+1 Problem"
search: false
category:
  - spring-boot
  - jpa
last_modified_at: 2022-01-15T23:55:00
---

<br/>

👉 이어서 읽기를 추천합니다.
- [JPA Fetch 조인(join)과 페이징(paging) 처리][jpa-fetch-join-paging-problem-link]

## 0. 들어가면서

`클린 코드`를 읽다보니 이런 문구가 있었습니다. 

> 우리 모두는 자신이 짠 쓰레기 코드를 쳐다보며 나중에 손보겠다고 생각한 경험이 있다. 
> 우리 모두는 대충 짠 프로그램이 돌아간다는 사실에 안도감을 느끼며 그래도 안 돌아가는 프로그램보다 돌아가는 쓰레기가 좋다고 스스로를 위로한 경험이 있다. 
> 다시 돌아와 나중에 정리하겠다고 다짐했었다. 
> 물론 그 시절 우리는 르블랑의 법칙(leblanc's law)을 몰랐다. 
> **`나중은 결코 오지 않는다.`**

책을 읽고 나니 이전 프로젝트에서 JPA N+1 현상으로 인해 성능 문제가 있었던 코드가 생각났습니다. 
갑자기 이를 너무 개선하고 싶어졌습니다. 

문제가 있는 코드에 대한 테스트를 작성해나가면서 관련된 기능을 천천히 고쳐나가는 일은 생각보다 재밌었습니다. 
성능을 개선하는 과정을 통해 몇 가지를 배웠는데, 우선 JPA N+1 현상과 관련된 내용을 정리해놓질 않았기 때문에 공부할 겸 포스트로 정리하였습니다. 
이번 포스트에선 `@OneToMany`, `@ManyToOne` 애너테이션을 기준으로 이야기를 진행하겠습니다.

## 1. JPA N+1 Problem

`@OneToOne`, `@OneToMany`, `@ManyToOne` 같은 애너테이션으로 엔티티 사이에 관계가 형성되어 있을 때 불필요한 쿼리가 더 수행되는 현상을 의미합니다. 

##### N+1 문제 현상
- 아래 이미지를 보면 Post 엔티티와 Reply 엔티티는 1 대 N 관계입니다.

<p align="left"><img src="/images/jpa-one-plus-n-problem-1.JPG" width="20%"></p>

- JPA `findBy-` 메소드를 사용하여 1개의 Post 엔티티를 조회하면, 쿼리가 총 2회 수행됩니다.
    - 지연 로딩(lazy loading)인 경우 해당 객체를 사용했다고 가정합니다.
    - Post 엔티티를 조회하는 쿼리 1회
    - Reply 엔티티들을 조회하는 쿼리 1회

```
Hibernate: select post0_.id as id1_0_, post0_.content as content2_0_, post0_.title as title3_0_ from post post0_ where post0_.title=? limit ?
Hibernate: select replies0_.post_id as post_id3_1_0_, replies0_.id as id1_1_0_, replies0_.id as id1_1_1_, replies0_.content as content2_1_1_, replies0_.post_id as post_id3_1_1_ from reply replies0_ where replies0_.post_id=?
```

- 만약, 2개의 Post 엔티티를 조회하면, 쿼리는 총 3회 수행됩니다.
    - 지연 로딩(lazy loading)인 경우 해당 객체를 사용했다고 가정합니다.
    - 2개의 Post 엔티티들을 조회하는 쿼리 1회
    - (각 Post 엔티티 별로 Reply 엔티티들을 조회하는 쿼리 1회) * (Post 엔티티 갯수 2개) = 2회

```
Hibernate: select post0_.id as id1_0_, post0_.content as content2_0_, post0_.title as title3_0_ from post post0_
Hibernate: select replies0_.post_id as post_id3_1_0_, replies0_.id as id1_1_0_, replies0_.id as id1_1_1_, replies0_.content as content2_1_1_, replies0_.post_id as post_id3_1_1_ from reply replies0_ where replies0_.post_id=?
Hibernate: select replies0_.post_id as post_id3_1_0_, replies0_.id as id1_1_0_, replies0_.id as id1_1_1_, replies0_.content as content2_1_1_, replies0_.post_id as post_id3_1_1_ from reply replies0_ where replies0_.post_id=?
```

- 만약, N개의 Post 엔티티를 조회하면, 쿼리는 총 N+1회 수행됩니다.

## 2. N+1 문제 해결하기

N+1 문제에 대해 알아보았으니 이를 해결할 수 있는 방법을 찾아보겠습니다. 
우선 테스트에 사용될 엔티티들을 살펴보고, 다음으로 해결 방법들을 알아보겠습니다. 

## 2.1. 테스트에 사용한 엔티티

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

### 2.2. join fetch 키워드 사용하기

`@Query` 애너테이션과 JPQL(Java Persistence Query Language)를 사용하여 fetch 조인(join) 쿼리를 작성합니다. 
fetch 조인은 inner join 처리됩니다.

#### 2.2.1. 테스트 코드

```java
package blog.in.action.post;

import blog.in.action.reply.Reply;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import javax.persistence.EntityManager;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

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

        Post post = getPost("first post", "this is the first post.");
        Post secondPost = getPost("second post", "this is the second post.");

        postRepository.save(post);
        postRepository.save(secondPost);

        insertReply(post, "first-reply-");
        insertReply(secondPost, "second-reply-");

        em.flush();
        em.clear();
    }

    @Test
    public void whenFindDistinctByTitleFetchJoin_thenJustOneQuery() {

        List<Post> posts = postRepository.findDistinctByTitleFetchJoin("first post");

        List<String> replyContents = posts
                .stream()
                .map(post -> post.getReplies())
                .flatMap(replies -> replies.stream())
                .map(reply -> reply.getContent())
                .collect(Collectors.toList());

        assertThat(replyContents.size()).isEqualTo(10);
    }

    @Test
    public void whenFindByTitleFetchJoin_thenJustOneQuery() {

        Set<Post> posts = postRepository.findByTitleFetchJoin("first post");

        List<String> replyContents = posts
                .stream()
                .map(post -> post.getReplies())
                .flatMap(replies -> replies.stream())
                .map(reply -> reply.getContent())
                .collect(Collectors.toList());

        assertThat(replyContents.size()).isEqualTo(10);
    }
}
```

#### 2.2.2. 구현 코드
- `findDistinctByTitleFetchJoin` 메소드
    - 반환 타입이 `List`
    - 쿼리 결과 DISTINCT 처리
- `findByTitleFetchJoin` 메소드
    - 반환 타입이 `Set`

```java
package blog.in.action.post;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Set;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Query(value = "SELECT DISTINCT p FROM Post p JOIN FETCH p.replies WHERE p.title = :title")
    List<Post> findDistinctByTitleFetchJoin(String title);

    @Query(value = "SELECT p FROM Post p JOIN FETCH p.replies WHERE p.title = :title")
    Set<Post> findByTitleFetchJoin(String title);
}
```

#### 2.2.3. 테스트 수행 결과
- `whenFindDistinctByTitleFetchJoin_thenJustOneQuery` 테스트 수행 쿼리

```sql
-- inner join 쿼리가 수행되면서 한번에 Reply 엔티티 정보를 조회합니다. 
select distinct post0_.id         as id1_0_0_,
                replies1_.id      as id1_1_1_,
                post0_.content    as content2_0_0_,
                post0_.title      as title3_0_0_,
                replies1_.content as content2_1_1_,
                replies1_.post_id as post_id3_1_1_,
                replies1_.post_id as post_id3_1_0__,
                replies1_.id      as id1_1_0__
from post post0_
         inner join reply replies1_ on post0_.id = replies1_.post_id
where post0_.title = ?
```

- `whenFindByTitleFetchJoin_thenJustOneQuery` 테스트 수행 쿼리

```sql
-- inner join 쿼리가 수행되면서 한번에 Reply 엔티티 정보를 조회합니다. 
select post0_.id         as id1_0_0_,
       replies1_.id      as id1_1_1_,
       post0_.content    as content2_0_0_,
       post0_.title      as title3_0_0_,
       replies1_.content as content2_1_1_,
       replies1_.post_id as post_id3_1_1_,
       replies1_.post_id as post_id3_1_0__,
       replies1_.id      as id1_1_0__
from post post0_
         inner join reply replies1_ on post0_.id = replies1_.post_id
where post0_.title = ?
```

### 2.3. @EntityGraph 애너테이션 사용

`@EntityGraph` 애너테이션을 사용하여 조인할 대상 필드를 지정합니다. 
해당 애너테이션에 포함된 필드는 쿼리시 `left outer join` 대상 테이블이 됩니다. 

#### 2.3.1. 테스트 코드

```java
package blog.in.action.post;

import blog.in.action.reply.Reply;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import javax.persistence.EntityManager;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

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

        Post post = getPost("first post", "this is the first post.");
        Post secondPost = getPost("second post", "this is the second post.");

        postRepository.save(post);
        postRepository.save(secondPost);

        insertReply(post, "first-reply-");
        insertReply(secondPost, "second-reply-");

        em.flush();
        em.clear();
    }

    @Test
    public void whenFindDistinctByTitleEntityGraph_thenJustOneQuery() {

        List<Post> posts = postRepository.findDistinctByTitleEntityGraph("first post");

        List<String> replyContents = posts
                .stream()
                .map(post -> post.getReplies())
                .flatMap(replies -> replies.stream())
                .map(reply -> reply.getContent())
                .collect(Collectors.toList());

        assertThat(posts.size()).isEqualTo(1);
        assertThat(replyContents.size()).isEqualTo(10);
    }

    @Test
    public void whenFindByTitleEntityGraph_thenJustOneQuery() {

        Set<Post> posts = postRepository.findByTitleEntityGraph("first post");

        List<String> replyContents = posts
                .stream()
                .map(post -> post.getReplies())
                .flatMap(replies -> replies.stream())
                .map(reply -> reply.getContent())
                .collect(Collectors.toList());

        assertThat(posts.size()).isEqualTo(1);
        assertThat(replyContents.size()).isEqualTo(10);
    }
}
```

#### 2.3.2. 구현 코드
- `findDistinctByTitleEntityGraph` 메소드
    - 반환 타입이 `List`
    - 쿼리 결과 DISTINCT 처리
    - `@EntityGraph` 애너테이션에 함께 조회할 엔티티 정보 표시
- `findByTitleEntityGraph` 메소드
    - 반환 타입이 `Set`
    - `@EntityGraph` 애너테이션에 함께 조회할 엔티티 정보 표시

```java
public interface PostRepository extends JpaRepository<Post, Long> {

    @EntityGraph(attributePaths = {"replies"})
    @Query(value = "SELECT DISTINCT p FROM Post p WHERE p.title = :title")
    List<Post> findDistinctByTitleEntityGraph(String title);

    @EntityGraph(attributePaths = {"replies"})
    @Query(value = "SELECT p FROM Post p WHERE p.title = :title")
    Set<Post> findByTitleEntityGraph(String title);
}
```

#### 2.3.3. 테스트 수행 결과

- `whenFindDistinctByTitleEntityGraph_thenJustOneQuery` 테스트 수행 쿼리

```sql
-- left outer join 쿼리가 수행되면서 한번에 Reply 엔티티 정보를 조회합니다. 
select distinct post0_.id         as id1_0_0_,
                replies1_.id      as id1_1_1_,
                post0_.content    as content2_0_0_,
                post0_.title      as title3_0_0_,
                replies1_.content as content2_1_1_,
                replies1_.post_id as post_id3_1_1_,
                replies1_.post_id as post_id3_1_0__,
                replies1_.id      as id1_1_0__
from post post0_
         left outer join reply replies1_ on post0_.id = replies1_.post_id
where post0_.title = ?
```

- `whenFindByTitleEntityGraph_thenJustOneQuery` 테스트 수행 쿼리

```sql
-- left outer join 쿼리가 수행되면서 한번에 Reply 엔티티 정보를 조회합니다. 
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
where post0_.title = ?
```

## 3. 주의사항

### 3.1. SQL 데이터 조회 결과

테스트를 보면 fetch 조인과 `@EntityGraph` 애너테이션을 사용하면 `inner join`과 `left outer join` 방식을 사용한 쿼리로 데이터를 조회합니다. 
두 조인 방식 모두 일대다 관계에서 `"일"`인 테이블을 기준으로 데이터를 조회하면 중복되는 데이터가 발생합니다. 

##### Post 테이블 조회 쿼리 수행 및 결과

```sql
select * from test.post;
```

| post.id | post.content | post.title |
|---|---|---|
| 1 | this is the first post. | first post |

##### Reply 테이블 조회 쿼리 수행 및 결과

```sql
select * from test.reply;
```

| reply.id | reply.content | reply.post_id |
|---|---|---|
| 1 | first-reply-1 | 1 |
| 2 | first-reply-2 | 1 |
| 3 | first-reply-3 | 1 |
| 4 | first-reply-4 | 1 |
| 5 | first-reply-5 | 1 |
| 6 | first-reply-6 | 1 |
| 7 | first-reply-7 | 1 |
| 8 | first-reply-8 | 1 |
| 9 | first-reply-9 | 1 |
| 10 | first-reply-10 | 1 |

##### inner join 쿼리 수행시 결과

```sql
select *
from test.post inner join test.reply on test.post.id = test.reply.post_id;
```

| post.id | post.content | post.title | reply.id | reply.content | reply.post_id |
|---|---|---|---|---|---|
| 1 | this is the first post. | first post | 1 | first-reply-1 | 1 |
| 1 | this is the first post. | first post | 2 | first-reply-2 | 1 |
| 1 | this is the first post. | first post | 3 | first-reply-3 | 1 |
| 1 | this is the first post. | first post | 4 | first-reply-4 | 1 |
| 1 | this is the first post. | first post | 5 | first-reply-5 | 1 |
| 1 | this is the first post. | first post | 6 | first-reply-6 | 1 |
| 1 | this is the first post. | first post | 7 | first-reply-7 | 1 |
| 1 | this is the first post. | first post | 8 | first-reply-8 | 1 |
| 1 | this is the first post. | first post | 9 | first-reply-9 | 1 |
| 1 | this is the first post. | first post | 10 | first-reply-10 | 1 |

### 3.2. JPA 엔티티 중복 처리 미수행 조회 결과

위처럼 중복되는 데이터 행(row)의 모습은 JPA를 이용한 엔티티 조회에서도 반영됩니다. 
이런 중복 현상을 없애기 위해선 메소드의 리턴 타입을 `Set`으로 지정하거나 쿼리 내부에 `DISTINCT` 키워드를 붙혀야 합니다. 
중복을 없애기 위한 처리를 하지 않으면 아래와 같은 결과를 확인할 수 있습니다. 

##### 중복 데이터 조회
- 리턴 타입은 `List`이며, 쿼리 내부에 `DISTINCT` 키워드를 붙히지 않은 경우입니다.
- 결과 리스트에 주소가 같은 엔티티 객체가 10개 담겨서 반환됩니다.

<p align="left"><img src="/images/jpa-one-plus-n-problem-2.JPG"></p>

## CLOSING

`@NamedEntityGraphs` 애너테이션을 이용한 해결 방법도 있지만, 참고한 이동욱님 블로그를 보면 다음과 같은 내용을 볼 수 있습니다. 

> NamedEntityGraphs의 경우 Entity에 관련해서 모든 설정 코드를 추가해야하는데, 개인적으론 Entity가 해야하는 책임에 포함되지 않는다고 생각합니다. 
> A 로직에서는 Fetch전략을 어떻게 가져가야 한다는 것은 해당 로직의 책임이지, Entity의 책임이 아니라고 생각합니다. 
> Entity에선 실제 도메인에 관련 된 코드만 작성하고, 상황에 따라 유동적인 Fetch 전략을 가져가는 것은 전적으로 서비스/레파지토리에서 결정해야하는 일이라고 생각됩니다.

저도 마찬가지 의견을 가지고 있기 때문에 추가적인 정리는 하지 않았습니다. 
혹시 나중에 사용할 일이 생긴다면 그때 관련된 내용을 정리해보도록 하겠습니다.

추가적으로 `@EntityGraph` 애너테이션을 사용하면 데이터 중복 현상을 없애기 위한 처리 없이도 정상적으로 엔티티가 조회됩니다. 
리턴 타입을 `Set`으로 지정하거나 쿼리 내부에 `DISTINCT` 키워드가 없어도 중복되지 않은 엔티티 리스트가 반환됩니다. 
GitHub `spring-data-jpa` 레포지토리 이슈와 `StackOverflow` 질문으로 `@EntityGraph` 애너테이션을 사용할 때 왜 중복 현상이 발생하지 않는지 문의하였습니다. 

##### GitHub 이슈
- [Why does not @EntityGraph annotation in JPA need to use "distinct" keyword or "Set" data structure?][github-issue-link]

##### StackOverflow 질문
- [Why does not @EntityGraph annotation in JPA need to use "distinct" keyword or "Set" data structure?][stack-overflow-question-link]

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-01-15-jpa-one-plus-n-problem>

#### REFERENCE
- <https://jojoldu.tistory.com/165>

[jpa-fetch-join-paging-problem-link]: https://junhyunny.github.io/spring-boot/jpa/jpa-fetch-join-paging-problem/

[github-issue-link]: https://github.com/spring-projects/spring-data-jpa/issues/2430
[stack-overflow-question-link]: https://stackoverflow.com/questions/70988649/why-does-not-entitygraph-annotation-in-jpa-need-to-use-distinct-keyword-or-s