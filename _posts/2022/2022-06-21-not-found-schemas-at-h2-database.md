---
title: "Not found schemas at H2 database"
search: false
category:
  - spring-boot
  - jpa
  - database
last_modified_at: 2022-06-21T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.

* [MySQL 환경 JPA 다중 스키마 사용하기][connect-multi-schema-in-mysql-link]

## 0. 들어가면서

JPA를 통해 여러 스키마에 접근하도록 구현하니 로컬 호스트에서 서비스가 정상적으로 동작하지 않았습니다. 
로컬 호스트에서 실행시키는 서비스는 H2 데이터베이스를 사용하도록 구성했는데, 스키마를 찾을 수 없다는 에러 로그를 만났습니다. 
`spring.jpa.hibernate.ddl-auto` 설정 값을 `create`, `create-drop`, `update` 등으로 지정해도 문제가 해결되지 않았습니다. 
H2 데이터베이스를 초기화하는 방법을 찾아보니 URL에 간단한 질의를 추가하여 문제 해결이 가능했고, 관련된 내용을 이번 포스트를 통해 정리하였습니다. 

## 1. 문제 현상

MySQL 데이터베이스 환경에서 다중 스키마에 접근하기 위해 엔티티에 스키마 정보를 추가하였습니다. 
`@Table` 애너테이션의 `catalog` 속성을 사용하였습니다. 

### 1.1. Member 클래스

- MySQL 데이터베이스의 `hello` 스키마에 접근하기 위한 정보를 추가하였습니다.

```java
package blog.in.action.hello;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "TB_MEMBER", catalog = "hello")
public class Member {

    @Id
    private String id;
    private String nickName;
}
```

### 1.2. Friend 클래스

- MySQL 데이터베이스의 `world` 스키마에 접근하기 위한 정보를 추가하였습니다.

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

### 1.3. application-local.yml

- 로컬에서 사용한 설정 정보입니다. 
- H2 메모리 데이터베이스를 사용하였습니다.
- `spring.jpa.hibernate.ddl-auto` 설정을 `create` 값으로 두어 데이터베이스, 테이블 생성과 관련된 DDL 쿼리를 매번 실행합니다.

```yml
spring:
  datasource:
    url: jdbc:h2:mem:test
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    properties:
      hibernate:
        show_sql: true
        format_sql: true
    hibernate:
      ddl-auto: create
```

### 1.4. 에러 로그 확인

위와 같은 상태에서 서비스를 실행시키면 다음과 같은 에러 로그를 확인할 수 있습니다.

```
Caused by: org.h2.jdbc.JdbcSQLSyntaxErrorException: Schema "HELLO" not found; SQL statement:

    create table hello.tb_member (
       id varchar(255) not null,
        nick_name varchar(255),
        primary key (id)
    ) [90079-200]
    at org.h2.message.DbException.getJdbcSQLException(DbException.java:576) ~[h2-1.4.200.jar:1.4.200]
    at org.h2.message.DbException.getJdbcSQLException(DbException.java:429) ~[h2-1.4.200.jar:1.4.200]
    at org.h2.message.DbException.get(DbException.java:205) ~[h2-1.4.200.jar:1.4.200]
    at org.h2.message.DbException.get(DbException.java:181) ~[h2-1.4.200.jar:1.4.200]
    ...
    
Caused by: org.h2.jdbc.JdbcSQLSyntaxErrorException: Schema "WORLD" not found; SQL statement:

    create table world.tb_friend (
       id varchar(255) not null,
        nick_name varchar(255),
        primary key (id)
    ) [90079-200]
    at org.h2.message.DbException.getJdbcSQLException(DbException.java:576) ~[h2-1.4.200.jar:1.4.200]
    at org.h2.message.DbException.getJdbcSQLException(DbException.java:429) ~[h2-1.4.200.jar:1.4.200]
    at org.h2.message.DbException.get(DbException.java:205) ~[h2-1.4.200.jar:1.4.200]
    at org.h2.message.DbException.get(DbException.java:181) ~[h2-1.4.200.jar:1.4.200]
    ...
```

## 2. 해결 방법

`spring.jpa.hibernate.ddl-auto` 설정을 `create`, `create-drop`, `update` 등을 사용하거나 `schema.sql` 파일을 이용해도 에러가 해결되지 않았습니다. 
H2 데이터베이스의 경우 스키마 정보를 초기화하는 방법이 따로 존재하며 다음과 같습니다. 

### 2.1. application-local.yml

- 다음과 같은 설정을 datasource URL 뒤에 추가합니다.
    - `INIT=CREATE SCHEMA IF NOT EXISTS HELLO\;CREATE SCHEMA IF NOT EXISTS WORLD`
- 설정을 추가하면 서비스가 정상적으로 실행됩니다. 

```yml
spring:
  datasource:
    url: jdbc:h2:mem:test;INIT=CREATE SCHEMA IF NOT EXISTS HELLO\;CREATE SCHEMA IF NOT EXISTS WORLD
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    properties:
      hibernate:
        show_sql: true
        format_sql: true
    hibernate:
      ddl-auto: create
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-06-21-not-found-schemas-at-h2-database>

#### REFERENCE
- <https://stackoverflow.com/questions/52939085/h2-database-how-to-init-multiple-schema-yml>

[connect-multi-schema-in-mysql-link]: https://junhyunny.github.io/spring-boot/jpa/database/connect-multi-schema-in-mysql/