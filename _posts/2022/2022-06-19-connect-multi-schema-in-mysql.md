---
title: "MySQL 데이터베이스 JPA 다중 스키마 사용"
search: false
category:
  - spring-boot
  - jpa
  - database
last_modified_at: 2022-06-19T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [데이터베이스 스키마(schema)와 카탈로그(catalog)][database-schema-and-catalog-link]

## 0. 들어가면서

프로젝트 중간에 다른 스키마(schema)에 존재하는 테이블에 연결해야하는 상황이 발생했다. 애플리케이션의 책임을 줄이기 위해 한 개의 스키마를 사용하면 좋겠지만, 규정 등의 사유로 다른 스키마를 바라봐야 하는 상황이었다. JPA(Java Persistence API) `@Table` 애너테이션의 `schema` 속성 값 부여만으로 쉽게 해결될 줄 알았지만, 문제가 해소되진 않았다. 이번 글에선 관련된 문제와 해결 과정을 정리했다. 

이번 글의 예제 코드를 실행하기 위해선 다음과 같은 DDL 쿼리가 필요하다.

- `hello` 데이터베이스를 생성하고, `hello` 데이터베이스에 `tb_member` 테이블을 생성한다.
- `world` 데이터베이스를 생성하고, `world` 데이터베이스에 `tb_friend` 테이블을 생성한다.

```sql
create database hello;
create table hello.tb_member
(
    id        varchar(255) not null,
    nick_name varchar(255),
    primary key (id)
) engine = InnoDB;

create database world;
create table world.tb_friend
(
    id        varchar(255) not null,
    nick_name varchar(255),
    primary key (id)
) engine = InnoDB;
```

## 1. Problem Context

문제 현상에 대한 이해를 돕기 위한 코드이므로 일부를 각색했다. 먼저 application YAML 설정을 살펴보자.

- 로컬 호스트 MySQL 데이터베이스 서버의 hello 스키마에 접속한다.

```yml
server:
  port: 8080
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/hello?characterEncoding=UTF-8&serverTimezone=UTC
    username: root
    password: 1234
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    properties:
      hibernate:
        show_sql: true
        format_sql: true
    show-sql: true
    database-platform: org.hibernate.dialect.MySQL5InnoDBDialect
    hibernate:
      ddl-auto: none
```

world 스키마에 연결하기 위해 신규 엔티티(entity) 클래스를 준비한다. world 스키마에 존재하는 `TB_FRIEND` 테이블을 사용하기 위해 Friend 클래스를 만든다.

- 스키마 정보 없이 `@Table` 애너테이션을 통해 테이블 이름만 지정한다.

```java
package blog.in.action.world;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "TB_FRIEND")
public class Friend {

    @Id
    private String id;
    private String nickName;
}
```

해당 엔티티를 기준으로 데이터베이스에 접근하기 위한 JpaRepository 인스턴스를 준비한다. 

```java
package blog.in.action.world;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FriendRepository extends JpaRepository<Friend, String> {
}
```

다중 스키마에 실제로 접근할 수 있는지 테스트 코드를 통해 검증한다.

- `@AutoConfigureTestDatabase` 애너테이션의 AutoConfigureTestDatabase.Replace.NONE 설정을 통해 H2 메모리 데이터베이스가 아닌 실제 MySQL 데이터베이스를 사용한다.
- FriendRepository 인스턴스로 `TB_FRIEND` 테이블에 `count` 쿼리를 수행한다.

```java
package blog.in.action;

import blog.in.action.world.FriendRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class MultiSchemaTests {

    @Autowired
    FriendRepository friendRepository;

    @Test
    void countFromFriendTable() {
        assertThat(friendRepository.count(), greaterThanOrEqualTo(0L));
    }
}
```

테스트를 수행하면 실패한다.

<div align="center">
  <img src="/images/posts/2022/connect-multi-schema-in-mysql-01.png" width="100%" class="image__border">
</div>

<br/>

실패 로그를 보면 다음과 같은 `hello` 스키마에 `tb_friend` 테이블을 찾지 못 한다는 중요한 힌트를 확인할 수 있다. 

- Table 'hello.tb_friend' doesn't exist

```
Hibernate: 
    select
        count(*) as col_0_0_ 
    from
        tb_friend friend0_
2022-06-19 23:51:19.771  WARN 11801 --- [           main] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Error: 1146, SQLState: 42S02
2022-06-19 23:51:19.771 ERROR 11801 --- [           main] o.h.engine.jdbc.spi.SqlExceptionHelper   : Table 'hello.tb_friend' doesn't exist

...

org.springframework.dao.InvalidDataAccessResourceUsageException: could not extract ResultSet; SQL [n/a]; nested exception is org.hibernate.exception.SQLGrammarException: could not extract ResultSet

    at org.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(HibernateJpaDialect.java:259)
    at org.springframework.orm.jpa.vendor.HibernateJpaDialect.translateExceptionIfPossible(HibernateJpaDialect.java:233)
    at org.springframework.orm.jpa.AbstractEntityManagerFactoryBean.translateExceptionIfPossible(AbstractEntityManagerFactoryBean.java:551)
    at org.springframework.dao.support.ChainedPersistenceExceptionTranslator.translateExceptionIfPossible(ChainedPersistenceExceptionTranslator.java:61)
    ...
```

## 2. Solve the problem

처음엔 @Table 애너테이션 schema 속성 사용해봤다. TB_FRIEND 테이블은 world 스키마에 존재하므로 @Table 애너테이션에 해당 스키마 정보를 추가한다.

- `schema` 속성을 통해 해당 엔티티가 어느 스키마에 해당하는지 표시한다.

```java
package blog.in.action.world;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "TB_FRIEND", schema = "world")
public class Friend {

    @Id
    private String id;
    private String nickName;
}
```

위 설정 후 테스트를 수행하더라도 동일한 에러로 실패한다. 이전 테스트와 마찬가지로 해당되는 테이블을 찾지 못하며, 여전히 `hello` 스키마에서 테이블을 탐색한다.

```
Hibernate: 
    select
        count(*) as col_0_0_ 
    from
        tb_friend friend0_
2022-06-20 00:22:47.023  WARN 20622 --- [           main] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Error: 1146, SQLState: 42S02
2022-06-20 00:22:47.023 ERROR 20622 --- [           main] o.h.engine.jdbc.spi.SqlExceptionHelper   : Table 'hello.tb_friend' doesn't exist

...

org.springframework.dao.InvalidDataAccessResourceUsageException: could not extract ResultSet; SQL [n/a]; nested exception is org.hibernate.exception.SQLGrammarException: could not extract ResultSet

    at org.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(HibernateJpaDialect.java:259)
    at org.springframework.orm.jpa.vendor.HibernateJpaDialect.translateExceptionIfPossible(HibernateJpaDialect.java:233)
    at org.springframework.orm.jpa.AbstractEntityManagerFactoryBean.translateExceptionIfPossible(AbstractEntityManagerFactoryBean.java:551)
    at org.springframework.dao.support.ChainedPersistenceExceptionTranslator.translateExceptionIfPossible(ChainedPersistenceExceptionTranslator.java:61)
    ...
```

다음으로 @Table 애너테이션의 catalog 속성을 사용했다. 카탈로그(catalog)는 스키마보다 상위 개념으로 데이터베이스 시스템 내의 모든 객체에 대한 정의와 명세를 저장하고 있다. 데이터베이스 종류에 따라 다른 구조를 가지며, 데이터베이스 관리 시스템(DBMS, database management system)에 의해 스스로 생성되고 유지된다. 카탈로그는 보통 데이터베이스와 동의어로 사용된다.

- `catalog` 속성을 이용하여 해당 엔티티가 어느 데이터베이스에 해당하는지 표시한다.

```java
package blog.in.action.world;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "TB_FRIEND", catalog = "world")
public class Friend {

    @Id
    private String id;
    private String nickName;
}
```

위 설정 후 테스트를 수행하면 정상적으로 처리된다.

<div align="center">
  <img src="/images/posts/2022/connect-multi-schema-in-mysql-02.png" width="100%" class="image__border">
</div>

<br/>

쿼리의 수행 로그를 보면 `world` 스키마에서 `tb_friend` 테이블을 탐색한다.

```
Hibernate: 
    select
        count(*) as col_0_0_ 
    from
        world.tb_friend friend0_
```

hello 스키마에 위치한 테이블과 연결하기 위한 기존 엔티티의 정상 동작 여부를 확인해보자. Member 엔티티 클래스는 다음과 같다.

- 기존 `hello` 스키마의 `TB_MEMBER` 테이블과 연결된 `Member` 엔티티는 별도 변경 없이 사용한다.

```java
package blog.in.action.hello;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "TB_MEMBER")
public class Member {

    @Id
    private String id;
    private String nickName;
}
```

Member, Freind 엔티티를 통해 서로 다른 스키마에서 데이터를 찾는 테스트를 동시에 실행해보자.

- `MemberRepository` 인스턴스로 `TB_MEMBER` 테이블에 `count` 쿼리를 수행하는 테스트를 추가한다. 

```java
package blog.in.action;

import blog.in.action.hello.MemberRepository;
import blog.in.action.world.FriendRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class MultiSchemaTests {

    @Autowired
    FriendRepository friendRepository;

    @Autowired
    MemberRepository memberRepository;

    @Test
    void countFromFriendTable() {
        assertThat(friendRepository.count(), greaterThanOrEqualTo(0L));
    }

    @Test
    void countFromMemberTable() {
        assertThat(memberRepository.count(), greaterThanOrEqualTo(0L));
    }
}
```

위 두 개의 테스트를 동시에 실행하더라도 정상적으로 통과한다.

<div align="center">
  <img src="/images/posts/2022/connect-multi-schema-in-mysql-03.png" width="100%" class="image__border">
</div>

## 3. @Table annotaion's schema attribute

해당 문제의 원인은 [데이터베이스 스키마(schema)와 카탈로그(catalog)][database-schema-and-catalog-link] 글에 정리했다. 정확한 원인 파악은 아니지만, 스키마와 카탈로그의 차이점을 정리해나가면서, 추측할 수 있는 몇 가지 근거들을 찾아 정리했다. 이번 글을 먼저 접하는 사람들을 위해 관련 내용을 이 글 마지막에 가볍게 정리해본다. MySQL 데이터베이스는 3계층 구조이다.

- `인스턴스`는 DBMS 서비스를 의미한다. 서버 혹은 서버 프로세스를 의미한다.
- 데이터베이스가 존재하지 않고 바로 스키마가 위치한다. 이 구조의 경우 데이터베이스와 스키마를 동의어로 사용한다.
- 3계층 데이터베이스의 대표적인 예로 MySQL를 들 수 있으며, 이런 경우에는 데이터베이스와 스키마를 혼동하여 사용하는 경우가 발생한다.

<div align="center">
  <img src="/images/posts/2022/connect-multi-schema-in-mysql-04.png" width="80%" class="image__border">
</div>
<center>https://hue9010.github.io/db/mysql_schema/</center>

<br/>

[MySQL 공식 문서](https://dev.mysql.com/doc/connector-odbc/en/connector-odbc-usagenotes-functionality-catalog-schema.html)를 읽으면 다음과 같은 내용을 찾을 수 있다.

> 8.1.3 Configuring Catalog and Schema Support<br/>
> Generally, catalogs are collections of schemas, so the fully qualified name would look like catalog.schema.table.column. 
> Historically with MySQL ODBC Driver, CATALOG and DATABASE were two names used for the same thing. 
> At the same time SCHEMA was often used as a synonym for MySQL Database. 
> This would suggest that CATALOG equals a SCHEMA, which is incorrect, but in MySQL Server context they would be the same thing.<br/>
> ...<br/>
> The Connector/ODBC driver does not allow using catalog and schema functionality at the same time because it would cause unsupported naming.

요약하자면 일반적으로 `카탈로그`와 `스키마`는 같은 개념이 아니지만, `MySQL`에서는 동일한 개념으로 사용한다. MySQL에선 시스템 구조상 `스키마`와 `데이터베이스`는 동의어로 사용된다. 결과적으로 `MySQL`에서 `카탈로그 = 데이터베이스 = 스키마`라는 의미가 된다. 

MySQL ODBC(Open Database Connectivity) 드라이버는 카탈로그와 데이터베이스를 동일한 것으로 취급한다. 동시에 스키마와 데이터베이스는 동의어이므로 MySQL 서버 컨텍스트에선 카탈로그와 스키마가 동일한 것으로 취급된다. ODBC 드라이버에서 스키마와 카탈로그는 데이터베이스 객체들을 테이블로서 참조하기 위해 사용되기 때문에 두 컨셉을 동시에 사용하지 못하도록 아래와 같은 설정이 존 한다. 

- NO_CATALOG, NO_SCHEMA 설정에 따라 드라이버에서 카탈로그와 스키마를 사용할지 여부를 선택한다.

<div align="center">
  <img src="/images/posts/2022/connect-multi-schema-in-mysql-05.png" width="80%" class="image__border">
</div>
<center>https://dev.mysql.com/doc/connector-odbc/en/connector-odbc-usagenotes-functionality-catalog-schema.html</center>

<br/>

결론을 정리하자면 `MySQL`에선 시스템 구조상 `카탈로그 = 스키마 = 데이터베이스`이므로 `MySQL`의 `ODBC` 드라이버는 카탈로그와 스키마를 같은 의미로 취급한다. 동시에 사용할 순 없어서 둘 중 하나를 사용하는데 `NO_CATALOG`, `NO_SCHEMA` 옵션을 통해 이를 설정한다. 디폴트 설정이 어떤 것인지는 확인하진 못 했지만, 옵션 설정에 따라 카탈로그를 사용한 것이라 예상된다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-06-19-connect-multi-schema-in-mysql>

#### REFERENCE

- <https://dev.mysql.com/doc/connector-odbc/en/connector-odbc-usagenotes-functionality-catalog-schema.html>
- <https://stackoverflow.com/questions/11184025/what-are-the-jpa-table-annotation-catalog-and-schema-variables-used-for>

[database-schema-and-catalog-link]: https://junhyunny.github.io/database/database-schema-and-catalog/