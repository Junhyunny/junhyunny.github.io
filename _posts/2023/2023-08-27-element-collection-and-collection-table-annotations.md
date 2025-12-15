---
title: "@ElementCollection과 @CollectionTable 애너테이션"
search: false
category:
  - spring-boot
  - jpa
last_modified_at: 2025-12-15T23:55:00
---

<br/>

## 1. @ElementCollection Annotation

JPA @ElementCollection 애너테이션은 일대다 관계 매핑(mapping) 기능을 제공한다. 엔티티(entity)가 아닌 객체를 대상으로 일대다 관계 매핑을 지원한다는 것이 @OneToMany 애너테이션과 차이점이다.

다음과 같은 타입의 멤버 변수가 적용 대상이다.

- @Embeddable 애너테이션이 붙은 클래스의 인스턴스(instance)
- String, Integer, Long 같은 단순 값 객체

@ElementCollection 애너테이션을 사용해 관계를 맺는 경우 다음과 같은 특징을 가진다.

- 부모 엔티티와 연관 관계를 가진다.
- 부모 엔티티 객체와 함께 저장, 삭제되므로 CascadeType.ALL 동작과 동일하다.
- 생성되는 테이블에 자동적으로 부모 엔티티의 ID 컬럼이 추가된다.
- 식별자(@Id) 개념이 없어서 컬렉션의 변경이 발생하면 전체 삭제 후 새로 추가한다.

## 2. @CollectionTable Annotation

@CollectionTable 애너테이션은 @ElementCollection 애너테이션을 사용해 맺은 일대다 관계에 대한 테이블 정보를 추가할 수 있다.

- 테이블 이름
- 컬럼 이름
- 조인(join)에 사용한 FK 이름

## 3. Project Setup

다음과 같은 테이블 관계를 가진 엔티티를 만들고 몇 가지 기능을 테스트해보자.

<div align="left">
  <img src="/images/posts/2023/element-collection-and-collection-table-annotations-01.png" width="50%" class="image__border">
</div>

### 3.1. UserEntity Class

먼저 UserEntity 엔티티 클래스를 만든다.

- 사용자 테이블 이름은 `TB_USER` 이다.
- 좋아하는 포스트(post) 테이블 이름은 `TB_FAVORITE_POSTS` 이다.
  - 외래 키(forign key) 이름은 user_id 이다.
  - user_id, post_id 컬럼을 조합한 유니크 키(unique key) 제약 조건을 추가한다.
- addFavoritePosts 메소드
  - 전달 받은 리스트를 추가한다.
- removeFavoritePosts 메소드
  - 전달 받은 리스트를 제거한다.
- updateFavoritePost 메소드
  - 전달 받은 포스트와 동일한 데이터의 리마크(remark) 정보를 업데이트한다.

```java
package action.in.blog.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "TB_USER")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String name;
    
    @ElementCollection
    @CollectionTable(
            name = "TB_FAVORITE_POSTS",
            joinColumns = {@JoinColumn(name = "user_id")},
            uniqueConstraints = {
                    @UniqueConstraint(columnNames = {"user_id", "post_id"})
            }
    )
    private List<FavoritePost> favoritePosts;

    public void addFavoritePosts(List<FavoritePost> favoritePosts) {
        if (this.favoritePosts == null) {
            this.favoritePosts = new ArrayList<>();
        }
        this.favoritePosts.addAll(favoritePosts);
    }

    public void removeFavoritePosts(List<FavoritePost> favoritePosts) {
        final var postIds = favoritePosts.stream()
                .map(FavoritePost::getPostId)
                .collect(Collectors.toSet());
        this.favoritePosts.removeIf(favoritePost -> postIds.contains(favoritePost.getPostId()));
    }

    public void updateFavoritePost(FavoritePost favoritePost) {
        this.favoritePosts.stream()
                .filter(item -> item.getPostId() == favoritePost.getPostId())
                .forEach(item -> item.setRemark(favoritePost.getRemark()));
    }
}
```

### 3.2. FavoritePost Class

자식 클래스인 FavoritePost 클래스는 다음과 같다.

- @Embeddable 애너테이션을 통해 데이터베이스에서 관리가 필요한 대상 객체임을 표시한다.
- @Column 애너테이션으로 유니크 키 생성에서 필요한 컬럼을 명시한다.

```java
package action.in.blog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

@Builder
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class FavoritePost {
    @Column(name = "post_id")
    private long postId;
    @Setter
    private String remark;
}
```

### 3.3. UserRepository Interface

UserRepository 인터페이스에는 다음과 같은 메소드를 작성한다.

- findByName 메소드
  - 이름으로 사용자 정보를 조회한다.
- deleteFavoritePosts 메소드
  - 해당되는 이름을 가진 유저의 좋아하는 포스트를 삭제한다. 

```java
package action.in.blog.repository;

import action.in.blog.domain.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    UserEntity findByName(String name);

    @Modifying
    @Query(value = """
            delete from tb_favorite_posts 
            where user_id = (select id from tb_user where name = :userName)
              and post_id in :favoritePosts
            """,
            nativeQuery = true)
    void deleteFavoritePosts(String userName, List<Long> favoritePosts);
}
```

## 4. Practice

조회를 제외한 추가, 삭제, 업데이트 기능을 확인한다.

### 4.1. application.yml

테스트 경로에 위치한 리소스(resource)에 다음과 같은 설정 파일을 추가한다.

- 데이터 초기화를 위해 data.sql 파일을 사용한다.

```yml
spring:
  sql:
    init:
      mode: embedded
      data-locations: classpath:data.sql
  jpa:
    hibernate:
      ddl-auto: create
    show-sql: true
    defer-datasource-initialization: true
```

### 4.2. data.sql

다음 SQL 스크립트를 통해 테스트에 필요한 사용자 정보를 준비한다.

```sql
insert into TB_USER (name) values ('Junhyunny');
```

### 4.3. Helper Class

@DataJpaTest 애너테이션을 사용한 테스트를 작성한다. @DataJpaTest 애너테이션은 내부에 @Transactional 애너테이션이 적용되어 있어 추가, 삭제, 업데이트 수행 결과가 데이터베이스에 반영되었는지 확인하는 것이 어렵다. 새로운 트랜잭션을 만드는 도우미 클래스를 하나 생성한다.

- 트랜잭션 적용을 위한 빈(bean) 생성을 위해 컴포넌트로 선언한다.
- 트랜잭션 전파 타입은 `REQUIRES_NEW`로 선언하여 기존 트랜잭션이 있더라도 새로운 트랜잭션을 시작한다.

```java
package action.in.blog;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
public class Helper {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void transaction(Runnable runnable) {
        runnable.run();
    }
}
```

### 4.4. Add Favoirte Posts

조회한 사용자 객체에 좋아하는 포스트 객체들을 추가한다.

- 새로 추가한 포스트 객체들이 데이터베이스에 추가되는 것을 예상한다.
  - 오염 감지(dirty check) 기능을 사용한다.
- 새로운 트랜잭션에서 데이터를 추가한다.
  - 별도의 트랜잭션으로 분리한 이유는 데이터베이스에 실제로 저장되는지 확인하기 위함이다.
- 테스트 트랜잭션에서 수행한 조회 결과가 영속성 컨텍스트가 아닌 데이터베이스에서 얻을 수 있도록 플러시(flush), 클리어(clear)를 수행한다.

```java
package action.in.blog.repository;

import action.in.blog.Helper;
import action.in.blog.domain.FavoritePost;
import action.in.blog.domain.UserEntity;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@Import(Helper.class)
@DataJpaTest
class AddFavoritePostsTest {

    @Autowired
    Helper helper;
    @Autowired
    EntityManager entityManager;
    @Autowired
    UserRepository sut;

    @BeforeEach
    void beforeEach() {
        helper.transaction(
                () -> entityManager
                        .createNativeQuery("delete from tb_favorite_posts")
                        .executeUpdate()
        );
    }

    void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }

    private FavoritePost createFavoritePost(long postId, String remark) {
        return FavoritePost.builder()
                .postId(postId)
                .remark(remark)
                .build();
    }

    @Test
    void addFavoritePosts() {

        helper.transaction(() -> {
            var user = sut.findByName("Junhyunny");
            user.addFavoritePosts(
                    List.of(
                            createFavoritePost(1L, "Hello"),
                            createFavoritePost(2L, "World")
                    )
            );
        });


        flushAndClear();
        var result = entityManager
                .createQuery("select ue from UserEntity ue where ue.name = 'Junhyunny'", UserEntity.class)
                .getSingleResult();
        var favoritePosts = result.getFavoritePosts();
        assertEquals(2, favoritePosts.size());
        assertEquals(1L, favoritePosts.get(0).getPostId());
        assertEquals("Hello", favoritePosts.get(0).getRemark());
        assertEquals(2L, favoritePosts.get(1).getPostId());
        assertEquals("World", favoritePosts.get(1).getRemark());
    }
}
```

테스트 결과는 로그를 통해 확인한다.

- insert 쿼리가 2회 수행된다.
- user_id 필드는 FavoritePost 클래스에 존재하지 않지만, 사용자의 ID를 기준으로 값이 추가된다.

```
Hibernate: select u1_0.id,u1_0.name from tb_user u1_0 where u1_0.name=?
Hibernate: select f1_0.user_id,f1_0.post_id,f1_0.remark from tb_favorite_posts f1_0 where f1_0.user_id=?
Hibernate: insert into tb_favorite_posts (user_id,post_id,remark) values (?,?,?)
Hibernate: insert into tb_favorite_posts (user_id,post_id,remark) values (?,?,?)
Hibernate: select u1_0.id,u1_0.name from tb_user u1_0 where u1_0.name='Junhyunny'
Hibernate: select f1_0.user_id,f1_0.post_id,f1_0.remark from tb_favorite_posts f1_0 where f1_0.user_id=?
```

### 4.5. Update Favorite Post

사용자의 좋아하는 포스트들 중에서 특정 아이디에 해당하는 포스트의 리마크 정보를 업데이트한다.

- 해당 아이디를 가진 포스트의 리마크 정보가 "Spring"으로 바뀌는 것을 예상한다.
  - 오염 감지 기능을 사용한다.
- 새로운 트랜잭션에서 데이터를 업데이트한다.
  - 별도의 트랜잭션으로 분리한 이유는 업데이트 결과가 데이터베이스에 실제로 반영되는지 확인하기 위함이다.
- 테스트 트랜잭션에서 수행한 조회 쿼리 결과가 영속성 컨텍스트가 아닌 데이터베이스에서 얻을 수 있도록 플러시, 클리어를 수행한다.

```java
package action.in.blog.repository;

import action.in.blog.Helper;
import action.in.blog.domain.FavoritePost;
import action.in.blog.domain.UserEntity;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@Import(Helper.class)
@DataJpaTest
class UpdateFavoritePostTest {

    @Autowired
    Helper helper;
    @Autowired
    EntityManager entityManager;
    @Autowired
    UserRepository sut;

    @BeforeEach
    void beforeEach() {
        helper.transaction(
                () -> entityManager
                        .createNativeQuery("delete from tb_favorite_posts")
                        .executeUpdate()
        );
    }

    void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }

    private FavoritePost createFavoritePost(long postId, String remark) {
        return FavoritePost.builder()
                .postId(postId)
                .remark(remark)
                .build();
    }

    @Test
    void updateFavoritePosts() {

        helper.transaction(() -> {
            var user = sut.findByName("Junhyunny");
            user.addFavoritePosts(
                    List.of(
                            createFavoritePost(1L, "Hello"),
                            createFavoritePost(2L, "World")
                    )
            );
        });


        helper.transaction(() -> {
            var user = sut.findByName("Junhyunny");
            user.updateFavoritePost(createFavoritePost(2L, "Spring"));
        });


        flushAndClear();
        var result = entityManager
                .createQuery("select ue from UserEntity ue where ue.name = 'Junhyunny'", UserEntity.class)
                .getSingleResult();
        var favoritePosts = result.getFavoritePosts();
        assertEquals(2, favoritePosts.size());
        assertEquals(1L, favoritePosts.get(0).getPostId());
        assertEquals("Hello", favoritePosts.get(0).getRemark());
        assertEquals(2L, favoritePosts.get(1).getPostId());
        assertEquals("Spring", favoritePosts.get(1).getRemark());
    }
}
```

오염 감지 기능을 통해 특정 데이터에 대한 업데이트 쿼리가 실행될 것을 예상하였지만, 모든 데이터를 삭제하고 필요한 데이터만 다시 추가한다.

- 사용자 ID에 해당하는 모든 포스트 데이터를 삭제하는 delete 쿼리가 1회 수행된다.
- 두 개의 포스트 데이터를 다시 추가하는 insert 쿼리가 2회 수행된다.

```
Hibernate: select u1_0.id,u1_0.name from tb_user u1_0 where u1_0.name=?
Hibernate: select f1_0.user_id,f1_0.post_id,f1_0.remark from tb_favorite_posts f1_0 where f1_0.user_id=?
Hibernate: insert into tb_favorite_posts (user_id,post_id,remark) values (?,?,?)
Hibernate: insert into tb_favorite_posts (user_id,post_id,remark) values (?,?,?)
Hibernate: select u1_0.id,u1_0.name from tb_user u1_0 where u1_0.name=?
Hibernate: select f1_0.user_id,f1_0.post_id,f1_0.remark from tb_favorite_posts f1_0 where f1_0.user_id=?
Hibernate: delete from tb_favorite_posts where user_id=?
Hibernate: insert into tb_favorite_posts (user_id,post_id,remark) values (?,?,?)
Hibernate: insert into tb_favorite_posts (user_id,post_id,remark) values (?,?,?)
Hibernate: select u1_0.id,u1_0.name from tb_user u1_0 where u1_0.name='Junhyunny'
Hibernate: select f1_0.user_id,f1_0.post_id,f1_0.remark from tb_favorite_posts f1_0 where f1_0.user_id=?
```

### 4.6. Remove Favorite Posts

좋아하는 포스트들 중 하나를 삭제한다.

- 특정 아이디를 가진 포스트를 리스트에서 제거한다.
  - 오염 감지 기능을 사용한다.
- 새로운 트랜잭션에서 데이터를 삭제한다.
  - 별도의 트랜잭션으로 분리한 이유는 삭제 실행 결과가 데이터베이스에서 실제로 반영되는지 확인하기 위함이다.
- 테스트 트랜잭션에서 수행한 조회 쿼리 결과가 영속성 컨텍스트가 아닌 데이터베이스에서 얻을 수 있도록 플러시, 클리어를 수행한다.

```java
package action.in.blog.repository;

import action.in.blog.Helper;
import action.in.blog.domain.FavoritePost;
import action.in.blog.domain.UserEntity;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@Import(Helper.class)
@DataJpaTest
class RemoveFavoritePostsTest {

    @Autowired
    Helper helper;
    @Autowired
    EntityManager entityManager;
    @Autowired
    UserRepository sut;

    @BeforeEach
    void beforeEach() {
        helper.transaction(
                () -> entityManager
                        .createNativeQuery("delete from tb_favorite_posts")
                        .executeUpdate()
        );
    }

    void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }

    private FavoritePost createFavoritePost(long postId, String remark) {
        return FavoritePost.builder()
                .postId(postId)
                .remark(remark)
                .build();
    }

    @Test
    void removeFavoritePosts() {

        helper.transaction(() -> {
            var user = sut.findByName("Junhyunny");
            user.addFavoritePosts(
                    List.of(
                            createFavoritePost(1L, "Hello"),
                            createFavoritePost(2L, "Spring"),
                            createFavoritePost(3L, "World")
                    )
            );
        });


        helper.transaction(() -> {
            var user = sut.findByName("Junhyunny");
            user.removeFavoritePosts(
                    List.of(
                            createFavoritePost(2L, "Spring")
                    )
            );
        });


        flushAndClear();
        var result = entityManager
                .createQuery("select ue from UserEntity ue where ue.name = 'Junhyunny'", UserEntity.class)
                .getSingleResult();
        var favoritePosts = result.getFavoritePosts();
        assertEquals(2, favoritePosts.size());
        assertEquals(1L, favoritePosts.get(0).getPostId());
        assertEquals("Hello", favoritePosts.get(0).getRemark());
        assertEquals(3L, favoritePosts.get(1).getPostId());
        assertEquals("World", favoritePosts.get(1).getRemark());
    }
}
```

오염 감지 기능을 통해 특정 데이터만 삭제하는 쿼리가 실행될 것을 예상하였지만, 모든 데이터를 삭제하고 필요한 데이터를 다시 추가한다.

- 사용자 ID에 해당하는 모든 포스트 데이터를 삭제하는 delete 쿼리가 1회 수행된다.
- 두 개의 포스트 데이터를 다시 추가하는 insert 쿼리가 2회 수행된다.

```
Hibernate: delete from tb_favorite_posts
Hibernate: select u1_0.id,u1_0.name from tb_user u1_0 where u1_0.name=?
Hibernate: select f1_0.user_id,f1_0.post_id,f1_0.remark from tb_favorite_posts f1_0 where f1_0.user_id=?
Hibernate: insert into tb_favorite_posts (user_id,post_id,remark) values (?,?,?)
Hibernate: insert into tb_favorite_posts (user_id,post_id,remark) values (?,?,?)
Hibernate: insert into tb_favorite_posts (user_id,post_id,remark) values (?,?,?)
Hibernate: select u1_0.id,u1_0.name from tb_user u1_0 where u1_0.name=?
Hibernate: select f1_0.user_id,f1_0.post_id,f1_0.remark from tb_favorite_posts f1_0 where f1_0.user_id=?
Hibernate: delete from tb_favorite_posts where user_id=?
Hibernate: insert into tb_favorite_posts (user_id,post_id,remark) values (?,?,?)
Hibernate: insert into tb_favorite_posts (user_id,post_id,remark) values (?,?,?)
Hibernate: select u1_0.id,u1_0.name from tb_user u1_0 where u1_0.name='Junhyunny'
Hibernate: select f1_0.user_id,f1_0.post_id,f1_0.remark from tb_favorite_posts f1_0 where f1_0.user_id=?
```

### 4.7. Remove Favorite Posts with Query

업데이트와 삭제 테스트에서 살펴봤듯 @ElementCollection 애너테이션을 통해 맺은 관계인 경우 부모 객체와 연관된 모든 데이터를 삭제하고, 필요한 데이터를 다시 추가한다. 이는 리스트에 담긴 데이터가 많을수록 쿼리를 과도하게 수행시킨다. 예를 들어 100개의 좋아하는 포스트 중 1개를 삭제했다면 100개의 데이터를 삭제하고 새로운 데이터 99개를 추가하는 쿼리를 수행할 것이다.

비합리적인 쿼리 수행을 줄이려면 특정 데이터만 다루는 쿼리를 직접 작성한다. 다만 @ElementCollection 애너테이션은 엔티티를 다루지 않기 때문에 JPQL(Java Persistence Query Language) 작성이 어렵다. 네이티브 쿼리(native query)를 사용해 이를 처리한다. 

```java
package action.in.blog.repository;

import action.in.blog.Helper;
import action.in.blog.domain.FavoritePost;
import action.in.blog.domain.UserEntity;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@Import(Helper.class)
@DataJpaTest
class RemoveFavoritePostsWithQueryTest {

    @Autowired
    Helper helper;
    @Autowired
    EntityManager entityManager;
    @Autowired
    UserRepository sut;

    @BeforeEach
    void beforeEach() {
        helper.transaction(
                () -> entityManager
                        .createNativeQuery("delete from tb_favorite_posts")
                        .executeUpdate()
        );
    }

    void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }

    private FavoritePost createFavoritePost(long postId, String remark) {
        return FavoritePost.builder()
                .postId(postId)
                .remark(remark)
                .build();
    }

    @Test
    void removeFavoritePostsWithQuery() {

        helper.transaction(() -> {
            var user = sut.findByName("Junhyunny");
            user.addFavoritePosts(
                    List.of(
                            createFavoritePost(1L, "Hello"),
                            createFavoritePost(2L, "Spring"),
                            createFavoritePost(3L, "World")
                    )
            );
        });


        helper.transaction(() -> {
            sut.deleteFavoritePosts("Junhyunny", List.of(2L));
        });


        flushAndClear();
        var result = entityManager
                .createQuery("select ue from UserEntity ue where ue.name = 'Junhyunny'", UserEntity.class)
                .getSingleResult();
        var favoritePosts = result.getFavoritePosts();
        assertEquals(2, favoritePosts.size());
        assertEquals(1L, favoritePosts.get(0).getPostId());
        assertEquals("Hello", favoritePosts.get(0).getRemark());
        assertEquals(3L, favoritePosts.get(1).getPostId());
        assertEquals("World", favoritePosts.get(1).getRemark());
    }
}
```

좋아하는 포스트 테이블에서 데이터를 삭제하는 delete 쿼리를 1회 수행한다.

```
Hibernate: delete from tb_favorite_posts
Hibernate: select u1_0.id,u1_0.name from tb_user u1_0 where u1_0.name=?
Hibernate: select f1_0.user_id,f1_0.post_id,f1_0.remark from tb_favorite_posts f1_0 where f1_0.user_id=?
Hibernate: insert into tb_favorite_posts (user_id,post_id,remark) values (?,?,?)
Hibernate: insert into tb_favorite_posts (user_id,post_id,remark) values (?,?,?)
Hibernate: insert into tb_favorite_posts (user_id,post_id,remark) values (?,?,?)
Hibernate: delete from tb_favorite_posts
where user_id = (select id from tb_user where name = ?)
  and post_id in (?)

Hibernate: select u1_0.id,u1_0.name from tb_user u1_0 where u1_0.name='Junhyunny'
Hibernate: select f1_0.user_id,f1_0.post_id,f1_0.remark from tb_favorite_posts f1_0 where f1_0.user_id=?
```

## CLOSING

@ElementCollection과 @CollectionTable 애너테이션에 관련된 내용을 정리하면서 얻은 인사이트(insight)는 다음과 같다.

- 데이터 수정, 삭제 시 불필요한 쿼리가 수행된다.
- 특정 데이터만 다루는 쿼리를 작성하는 것이 까다롭다.

JPA를 사용할 때 테이블로 관리해야한다면 엔티티를 만드는 것이 더 바람직할 것 같다. 데이터 변경이 별로 없는 비즈니스라면 @ElementCollection과 @CollectionTable 애너테이션을 사용해도 괜찮을 것 같다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-08-27-element-collection-and-collection-table-annotations>

#### REFERENCE

- <https://en.wikibooks.org/wiki/Java_Persistence/ElementCollection>
- <https://prohannah.tistory.com/133>
- <https://stackoverflow.com/questions/8969059/difference-between-onetomany-and-elementcollection>
