---
title: "Using Database Column without Underscore on JPA"
search: false
category:
  - spring-boot
  - jpa
  - hibernate
last_modified_at: 2023-02-11T23:55:00
---

<br/>

## 1. Context of Problem

테이블 컬럼 이름을 변경하는 작업을 수행하면서 문제가 발생했습니다. 
간단하게 정리하면 다음과 같습니다. 

* 실제 데이터베이스에 생성된 테이블의 컬럼명들은 카멜 방식(camelCase)으로 생성되어 있습니다.
* 엔티티(entity)의 `@Column` 애너테이션을 사용하여 이름을 스네이크 방식(snake_case)으로 지정합니다.
* 런타임(runtime) 혹은 테스트 코드 실행 시 컬럼을 찾을 수 없다는 에러가 발생합니다.

간단하게 문제가 발생한 상황을 재현해보았습니다.

### 1.1. Table Schema

실제 데이터베이스에 테이블은 다음과 같이 생성되어 있습니다. 

* 컬럼이 카멜 방식으로 선언되어 있습니다.

```sql
create table post (postId bigint not null, postContent varchar(255), postTitle varchar(255), postTp varchar(255), primary key (postId))
```

### 1.2. Entity

`JPA` 엔티티는 다음과 같이 설정합니다.

* 각 필드들 위에 `@Column` 애너테이션을 추가하여 이름을 카멜 방식으로 변경합니다.

```java
package action.in.blog.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Post {

    @Id
    @Column(name = "postId")
    @GeneratedValue(strategy = GenerationType.AUTO)
    private long id;
    @Column(name = "postTitle")
    private String title;
    @Column(name = "postTp")
    private String type;
    @Column(name = "postContent")
    private String content;
}
```

### 1.3. Runtime Error

간단한 테스트 코드를 통해 문제 상황을 재현하였습니다. 

* 데이터베이스 스키마는 `shcema.sql`을 통해 초기화합니다.
    * 테이블은 위에서 정의한 모습과 동일합니다.
* 신규 엔티티를 추가하고 ID를 사용해 조회하는 간단한 테스트입니다.

```java
package action.in.blog;

import action.in.blog.domain.Post;
import action.in.blog.repository.PostRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@DataJpaTest
@TestPropertySource(
        properties = {
                "spring.sql.init.mode=embedded",
                "spring.sql.init.schema-locations=classpath:db/schema.sql",
                "spring.jpa.hibernate.ddl-auto=none",
                "spring.jpa.defer-datasource-initialization=true"
        }
)
class ActionInBlogApplicationTests {

    @Autowired
    PostRepository postRepository;

    @Test
    void select_post_by_id() {
        Post post = Post.builder()
                .title("first post")
                .type("essay")
                .content("this is my first essay.")
                .build();
        postRepository.save(post);
        postRepository.flush();


        Post result = postRepository.findFirstByTitle("first post");


        assertThat(result.getTitle(), equalTo("first post"));
        assertThat(result.getType(), equalTo("essay"));
        assertThat(result.getContent(), equalTo("this is my first essay."));
    }
}
```

##### Result of Test

테스트 코드를 실행하면 다음과 같은 에러를 만납니다.

* 실행된 쿼리를 살펴보면 스네이크 방식을 따르는 컬럼 이름을 사용하였습니다.
    * 테이블 컬럼명은 카멜 방식이지만, 실행된 쿼리의 컬럼명은 스네이크 방식이므로 에러가 발생합니다.
    * SQL Error: 42122, SQLState: 42S22
    * Column "POST_CONTENT" not found

```
Hibernate: call next value for hibernate_sequence
Hibernate: insert into post (post_content, post_title, post_tp, post_id) values (?, ?, ?, ?)
2023-02-11 19:14:51.134  WARN 24080 --- [    Test worker] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Error: 42122, SQLState: 42S22
2023-02-11 19:14:51.134 ERROR 24080 --- [    Test worker] o.h.engine.jdbc.spi.SqlExceptionHelper   : Column "POST_CONTENT" not found; SQL statement:
insert into post (post_content, post_title, post_tp, post_id) values (?, ?, ?, ?) [42122-214]
```

## 2. Solution of Problem 

스프링 부트 `JPA`의 기본적인 컬럼 이름 규칙은 `lower_snake_case`입니다. 
암시적이거나 물리적인 방법으로 지정한 이름들은 모두 스네이크 방식으로 변경됩니다.

* 암시적인 명칭 전략(implicit naming strategy)
    * 명시적으로 이름이 지정되지 않은 엔티티들의 이름을 만드는 방식입니다.
    * `ImplicitNamingStrategy` 인터페이스를 구현하여 적용하면 커스텀한 명칭 전략을 세울 수 있습니다.
    * 스프링 부트는 `SpringImplicitNamingStrategy` 클래스에 정의된 전략을 따릅니다.
* 물리적인 명칭 전략(physical naming strategy)
    * `@Table`, `@Column` 등의 애너테이션으로 명칭을 지정하는 방식입니다.
    * `PhysicalNamingStrategy` 인터페이스를 구현하여 적용하면 커스텀한 명칭 전략을 세울 수 있습니다.
    * 스프링 부트는 `CamelCaseToUnderscoresNamingStrategy` 클래스에 정의된 전략을 따릅니다.
    * 물리적인 명칭 전략은 항상 마지막으로 적용되기 때문에 엔티티는 해당 전략으로 지정한 이름을 가지게 됩니다.

해당 문제를 해결하기 위해선 적합한 물리적인 명칭 전략을 사용하면 됩니다. 
다음과 같은 설정을 통해 변경할 수 있습니다.

```yml
spring:
  jpa:
    hibernate:
      naming:
        physical-strategy: org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
```

##### PhysicalNamingStrategyStandardImpl Class

* 해당 이름 규칙 전략을 살펴보면 전달 받은 이름을 그대로 사용하는 것을 확인할 수 있습니다.

```java
package org.hibernate.boot.model.naming;

import java.io.Serializable;

import org.hibernate.engine.jdbc.env.spi.JdbcEnvironment;

public class PhysicalNamingStrategyStandardImpl implements PhysicalNamingStrategy, Serializable {

	public static final PhysicalNamingStrategyStandardImpl INSTANCE = new PhysicalNamingStrategyStandardImpl();

	@Override
	public Identifier toPhysicalCatalogName(Identifier name, JdbcEnvironment context) {
		return name;
	}

	@Override
	public Identifier toPhysicalSchemaName(Identifier name, JdbcEnvironment context) {
		return name;
	}

	@Override
	public Identifier toPhysicalTableName(Identifier name, JdbcEnvironment context) {
		return name;
	}

	@Override
	public Identifier toPhysicalSequenceName(Identifier name, JdbcEnvironment context) {
		return name;
	}

	@Override
	public Identifier toPhysicalColumnName(Identifier name, JdbcEnvironment context) {
		return name;
	}
}
```

###### Result of Test

* 명시적으로 지정한 이름을 따라 `insert` 쿼리가 실행됩니다.

```
Hibernate: call next value for hibernate_sequence
Hibernate: insert into Post (postContent, postTitle, postTp, postId) values (?, ?, ?, ?)
Hibernate: select post0_.postId as postid1_0_, post0_.postContent as postcont2_0_, post0_.postTitle as posttitl3_0_, post0_.postTp as posttp4_0_ from Post post0_ where post0_.postTitle=? limit ?
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-02-11-using-database-column-without-underscore-on-jpa>

#### REFERENCE

* <https://stackoverflow.com/questions/29087626/entity-class-name-is-transformed-into-sql-table-name-with-underscores>
* <https://velog.io/@mumuni/Hibernate5-Naming-Strategy-%EA%B0%84%EB%8B%A8-%EC%A0%95%EB%A6%AC>