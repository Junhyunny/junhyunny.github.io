---
title: "JPA Persistence Context"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-08-22T01:00:00
---

<br>

⚠️ 해당 포스트는 2021년 8월 18일에 재작성되었습니다. (불필요 코드 제거)

👉 해당 포스트를 읽는데 도움을 줍니다.
- [JPA(Java Persistence API)][jpa-blog-link]

👉 이어서 읽기를 추천합니다.
- [영속성 컨텍스트(Persistence Context) 장점][persistence-context-advantages-link]
- [JPA Flush][jpa-flush-link]
- [JPA Clear][jpa-clear-link]

## 0. 들어가면서

JPA는 EntityManager를 통해 엔티티(Entity)를 관리합니다. 
**EntityManager는 @Id 필드를 이용해 엔티티를 구분짓고 이들을 관리합니다.** 
ORM(Object-Relation Mapping) 개념상 @Id 필드는 데이터베이스의 PK를 의미하므로 @Id 값이 다른 경우에는 다른 데이터임을 보장합니다. 
EntityManager가 엔티티를 어떤 방식으로 구분짓는지 알았으니 어떤 방법으로 관리하는지 알아보도록 하겠습니다.

## 1. 영속성 컨텍스트(Persistence Context)

> 엔티티(Entity)를 영구히 저장하는 환경

영속성 컨텍스트는 EntityManager를 통해 접근이 가능합니다. 
엔티티 객체를 만든 후 EntityManager의 **`persist(E)`** 메소드를 호출하여 생성한 엔티티를 영속성 컨텍스트에 저장합니다. 
당연히 엔티티 객체를 영속성 컨텍스트에서 제거하는 방법도 존재합니다. 
JPA가 엔티티를 어떻게 관리하는지 Entity Lifecycle을 통해 더 자세히 알아보도록 하겠습니다. 

## 2. Entity Lifecycle

새로운 기술을 공부할때마다 접하는 라이프사이클(lifecycle)에 대한 개념은 언제나 흥미롭습니다. 

### 2.1. Entity Lifecycle 흐름
<p align="center"><img src="/images/jpa-persistence-context-1.JPG" width="60%"></p>
<center>이미지 출처, https://gunlog.dev/JPA-Persistence-Context/</center><br>

- 비영속(new/transient)
    - 엔티티 객체를 새로 생성하였지만 EntityManager에 의해 관리되고 있지 않는 상태
    - 영속성 컨텍스트와 전혀 관계가 없는 상태
    - 엔티티 객체에서 발생하는 데이터 변경은 전혀 알 수 없습니다.

```java
    Member member = new Member();
    member.setId("01012341234");
    member.setPassword("1234");
    List<String> authorities = new ArrayList<>();
    authorities.add("ADMIN");
    member.setAuthroities(authorities);
    member.setMemberName("Junhyunny");
    member.setMemberEmail("kang3966@naver.com");
```

- 영속(managed)
    - 엔티티 객체가 EntityManager에 의해 관리되고 있는 상태
    - 엔티티 객체가 영속성 컨텍스트에 저장되어 상태
    - **`entityManager.persist(E)`** 메소드를 통해 영속성 컨텍스트에 저장됩니다.
    - persist 메소드가 수행되는 동시에 데이터가 데이터베이스에 저장되지는 않습니다.

```java
    Member member = new Member();
    member.setId("01012341234");
    member.setPassword("1234");
    List<String> authorities = new ArrayList<>();
    authorities.add("ADMIN");
    member.setAuthroities(authorities);
    member.setMemberName("Junhyunny");
    member.setMemberEmail("kang3966@naver.com");
    // persistence context에 등록
    entityManager.persist(member);
```

- 준영속(detached)
    - 엔티티를 영속성 컨텍스트에서 분리된 상태
    - **`entityManager.detach(E)`** 메소드를 통해 영속성 컨텍스트에 분리됩니다.
    - 엔티티가 영속성 컨텍스트에서 분리된 상태이므로 EntityManager가 변경을 감지하지 못합니다.
    - 영속성 컨텍스트에서만 분리되었을 뿐 실제 데이터가 삭제되지는 않습니다.

```java
    Member member = entityManager.find(Member.class, "01012341234");
    // persistence context에서 분리
    entityManager.detach(member);
```

- 삭제(removed)
    - 엔티티에 해당하는 데이터를 데이터베이스에서 삭제된 상태
    - **`entityManager.remove(E)`** 메소드를 통해 영속성 컨텍스트에 삭제됩니다.

```java
    Member member = entityManager.find(Member.class, "01012341234");
    // 데이터베이스에서 삭제
    entityManager.remove(member);
```

## 3. 테스트 코드

### 3.1. 패키지 구조

```
./
`-- action-in-blog-back
    |-- README.md
    |-- action-in-blog.iml
    |-- images
    |   |-- a.jpg
    |   `-- b.JPG
    |-- mvnw
    |-- mvnw.cmd
    |-- pom.xml
    `-- src
        |-- main
        |   |-- java
        |   |   `-- blog
        |   |       `-- in
        |   |           `-- action
        |   |               |-- ActionInBlogApplication.java
        |   |               |-- converter
        |   |               |   `-- StringListConverter.java
        |   |               `-- entity
        |   |                   `-- Member.java
        |   `-- resources
        |       `-- application.yml
        `-- test
            `-- java
                `-- blog
                    `-- in
                        `-- action
                            `-- lifecycle
                                |-- DetachTest.java
                                |-- PersistTest.java
                                `-- RemoveTest.java
```

### 3.2. application.yml

```yml
server:
  port: 8081
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/test?characterEncoding=UTF-8&serverTimezone=UTC
    username: root
    password: 1234
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    show-sql: true
    database-platform: org.hibernate.dialect.MySQL5InnoDBDialect
    hibernate:
      ddl-auto: update
```

### 3.3. pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.4.1</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>

    <groupId>blog.in.action</groupId>
    <artifactId>action-in-blog</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>action-in-blog</name>

    <properties>
        <java.version>11</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
            <exclusions>
                <exclusion>
                    <groupId>org.junit.vintage</groupId>
                    <artifactId>junit-vintage-engine</artifactId>
                </exclusion>
            </exclusions>
        </dependency>

        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <scope>provided</scope>
        </dependency>

        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
```

### 3.4. persist 테스트

해당 테스트는 두 번 수행합니다. 
처음 실행 결과와 두번째 실행한 결과가 다릅니다. 

```java
package blog.in.action.lifecycle;

import blog.in.action.entity.Member;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@Slf4j
@SpringBootTest
public class PersistTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @Test
    void persistTest() {
        EntityManager em = factory.createEntityManager();
        log.info("entityManager properties : " + em.getProperties());
        try {
            // 트랜잭션 시작
            em.getTransaction().begin();
            // 조회
            Member member = em.find(Member.class, "01012341234");
            if (member != null) {
                // 영속된 객체 값 변경
                log.info("영속된 객체의 값을 변경합니다.");
                List<String> authorities = new ArrayList<>();
                authorities.add("MEMBER");
                member.setAuthorities(authorities);
            } else {
                // 새로운 객체 생성
                log.info("새로운 객체를 생성합니다.");
                member = new Member();
                member.setId("01012341234");
                member.setPassword("1234");
                List<String> authorities = new ArrayList<>();
                authorities.add("ADMIN");
                member.setAuthorities(authorities);
                member.setMemberName("Junhyunny");
                member.setMemberEmail("kang3966@naver.com");
                // persistence context에 등록
                em.persist(member);
            }
            // 트랜잭션 종료
            em.getTransaction().commit();
        } catch (Exception ex) {
            // 트랜잭션 롤백
            em.getTransaction().rollback();
            log.error("exception occurs", ex);
        } finally {
            em.close();
        }
    }
}
```

#### 3.4.1. 1차 수행
- em.getTransaction().begin() 메소드를 통해 트랜잭션 시작합니다.
- 데이터가 존재하지 않으므로 em.find() 메소드 수행 시 member 객체는 null 입니다.
- 새로운 객체를 생성합니다.(new/transient)
- em.perist(E) 메소드를 통해 생성한 객체를 영속성 컨텍스트에 추가합니다.(managed)
- em.getTransaction().commit() 메소드를 통해 트랜잭션을 커밋(commit) 합니다.
- 영속성 컨텍스트에 저장된 member 엔티티 정보를 데이터베이스에 반영됩니다.(insert)

##### 1차 수행 시 로그

```
2021-08-18 19:53:40.298  INFO 6672 --- [           main] blog.in.action.lifecycle.PersistTest     : entityManager properties : {org.hibernate.flushMode=AUTO, javax.persistence.lock.timeout=-1, javax.persistence.cache.retrieveMode=USE, javax.persistence.lock.scope=EXTENDED, javax.persistence.cache.storeMode=USE}
Hibernate: select member0_.id as id1_0_0_, member0_.authorities as authorit2_0_0_, member0_.member_email as member_e3_0_0_, member0_.member_name as member_n4_0_0_, member0_.password as password5_0_0_ from tb_member member0_ where member0_.id=?
2021-08-18 19:53:40.326  INFO 6672 --- [           main] blog.in.action.lifecycle.PersistTest     : 새로운 객체를 생성합니다.
Hibernate: insert into tb_member (authorities, member_email, member_name, password, id) values (?, ?, ?, ?, ?)
```

##### 1차 수행 시 데이터베이스
- 새로운 데이터가 추가되었습니다.

<p align="left"><img src="/images/jpa-persistence-context-2.JPG"></p>

#### 3.4.2. 2차 수행
- em.getTransaction().begin() 메소드를 통해 트랜잭션 시작합니다.
- 이전 수행에서 저장된 데이터가 있으므로 em.find() 메소드를 수행 시 member 객체가 반환됩니다.(managed)
- member 객체의 값을 변경합니다.
- em.getTransaction().commit() 메소드를 통해 트랜잭션을 커밋(commit) 합니다.
- 영속성 컨텍스트에 저장된 member 엔티티의 변경 정보를 데이터베이스에 반영됩니다.(update)

##### 2차 수행 시 로그

```
2021-08-18 19:54:47.978  INFO 21324 --- [           main] blog.in.action.lifecycle.PersistTest     : entityManager properties : {org.hibernate.flushMode=AUTO, javax.persistence.lock.timeout=-1, javax.persistence.cache.retrieveMode=USE, javax.persistence.lock.scope=EXTENDED, javax.persistence.cache.storeMode=USE}
Hibernate: select member0_.id as id1_0_0_, member0_.authorities as authorit2_0_0_, member0_.member_email as member_e3_0_0_, member0_.member_name as member_n4_0_0_, member0_.password as password5_0_0_ from tb_member member0_ where member0_.id=?
2021-08-18 19:54:48.012  INFO 21324 --- [           main] blog.in.action.lifecycle.PersistTest     : 영속된 객체의 값을 변경합니다.
Hibernate: update tb_member set authorities=?, member_email=?, member_name=?, password=? where id=?
```

##### 2차 수행 시 데이터베이스
- 데이터가 변경되었습니다.

<p align="left"><img src="/images/jpa-persistence-context-3.JPG"></p>

### 3.5. detach 테스트

`persist 테스트`에서 영속성 컨텍스트에 저장된 객체의 값을 변경하면 데이터가 업데이트 되는 것을 확인하였습니다. 
이번 테스트에서는 영속성 컨텍스트에 저장된 객체를 detach 메소드를 통해 영속성 컨텍스트에서 분리하면 어떤 동작을 하는지 정리하겠습니다. 
- detachTest 메소드 - detach 후 데이터 변경 테스트
- valuCheckTest 메소드 - 특정 데이터가 변경되어 데이터베이스에 반영되었는지 확인
- detachRemoveTest 메소드 - detach 후 엔티티 제거 테스트

```java
package blog.in.action.lifecycle;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import blog.in.action.entity.Member;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.boot.test.context.SpringBootTest;

@Slf4j
@TestMethodOrder(OrderAnnotation.class)
@SpringBootTest
public class DetachTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @BeforeEach
    void beforeEach() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = em.find(Member.class, "01012341234");
            if (member == null) {
                member = new Member();
                member.setId("01012341234");
                member.setPassword("1234");
                List<String> authorities = new ArrayList<>();
                authorities.add("ADMIN");
                member.setAuthorities(authorities);
                member.setMemberName("Junhyunny");
                member.setMemberEmail("kang3966@naver.com");
                em.persist(member);
            } else {
                List<String> authorities = new ArrayList<>();
                authorities.add("ADMIN");
                member.setAuthorities(authorities);
            }
            em.getTransaction().commit();
        } catch (Exception ex) {
            em.getTransaction().rollback();
            log.error("exception occurs", ex);
        } finally {
            em.close();
        }
    }

    @Test
    @Order(value = 0)
    void detachTest() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = em.find(Member.class, "01012341234");
            if (member != null) {
                // 영속된 객체를 detached 상태로 변경 후 값 변경
                log.info("detach 이후 객체의 값을 변경합니다.");
                em.detach(member);
                List<String> authorities = new ArrayList<>();
                authorities.add("DETACHED_ADMIN");
                member.setAuthorities(authorities);
            }
            em.getTransaction().commit();
        } catch (Exception ex) {
            em.getTransaction().rollback();
            log.error("exception occurs", ex);
        } finally {
            em.close();
        }
    }

    @Test
    @Order(value = 1)
    void valueCheckTest() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = em.find(Member.class, "01012341234");
            if (member != null) {
                String actual = member.getAuthorities().get(0);
                assertEquals("ADMIN", actual);
            }
            em.getTransaction().commit();
        } catch (Exception ex) {
            em.getTransaction().rollback();
            log.error("exception occurs", ex);
        } finally {
            em.close();
        }
    }

    @Test
    @Order(value = 2)
    void detachRemoveTest() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = em.find(Member.class, "01012341234");
            if (member != null) {
                // 영속된 객체를 detached 상태로 변경 후 remove
                log.info("detach 이후 객체를 삭제합니다.");
                em.detach(member);
                assertThrows(IllegalArgumentException.class, () -> em.remove(member));
            }
        } catch (Exception ex) {
            em.getTransaction().rollback();
            log.error("exception occurs", ex);
        } finally {
            em.close();
        }
    }
}
```

##### detachTest 메소드 수행 결과
- 로그를 보면 `detach 이후 객체의 값을 변경합니다.` 메세지 이후에 별도 업데이트 쿼리가 수행되지 않았습니다.

```
Hibernate: select member0_.id as id1_0_0_, member0_.authorities as authorit2_0_0_, member0_.member_email as member_e3_0_0_, member0_.member_name as member_n4_0_0_, member0_.password as password5_0_0_ from tb_member member0_ where member0_.id=?
Hibernate: select member0_.id as id1_0_0_, member0_.authorities as authorit2_0_0_, member0_.member_email as member_e3_0_0_, member0_.member_name as member_n4_0_0_, member0_.password as password5_0_0_ from tb_member member0_ where member0_.id=?
2021-08-19 06:07:29.815  INFO 7828 --- [           main] blog.in.action.lifecycle.DetachTest      : detach 이후 객체의 값을 변경합니다.
```

##### valuCheckTest 메소드 수행 결과
- assertEquals 메소드 수행 시 예상 값 "ADMIN" 인 경우에 성공합니다.
- 데이터가 변경되지 않았음을 확인할 수 있습니다.

<p align="left"><img src="/images/jpa-persistence-context-4.JPG"></p>

##### detachRemoveTest 메소드 수행 결과
- 영속성 컨텍스트에서 분리된 객체는 삭제하지 못합니다.
- detach 이후 데이터 삭제 시 IllegalArgumentException이 발생하는 것을 assertThrows 메소드를 통해 확인할 수 있습니다.

```
Hibernate: select member0_.id as id1_0_0_, member0_.authorities as authorit2_0_0_, member0_.member_email as member_e3_0_0_, member0_.member_name as member_n4_0_0_, member0_.password as password5_0_0_ from tb_member member0_ where member0_.id=?
Hibernate: select member0_.id as id1_0_0_, member0_.authorities as authorit2_0_0_, member0_.member_email as member_e3_0_0_, member0_.member_name as member_n4_0_0_, member0_.password as password5_0_0_ from tb_member member0_ where member0_.id=?
2021-08-19 06:10:52.526  INFO 10528 --- [           main] blog.in.action.lifecycle.DetachTest      : detach 이후 객체를 삭제합니다.
Hibernate: select member_.id, member_.authorities as authorit2_0_, member_.member_email as member_e3_0_, member_.member_name as member_n4_0_, member_.password as password5_0_ from tb_member member_ where member_.id=?
```

<p align="left"><img src="/images/jpa-persistence-context-5.JPG"></p>

### 3.6. remove 테스트 코드

이번 테스트에서는 영속성 컨텍스트에 저장된 엔티티를 remove 메소드를 통해 제거할 시 실제 데이터도 삭제가 되는지 확인해보았습니다.

```java
package blog.in.action.lifecycle;

import blog.in.action.entity.Member;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@Slf4j
@SpringBootTest
public class RemoveTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @BeforeEach
    void beforeEach() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = em.find(Member.class, "01012341234");
            if (member == null) {
                member = new Member();
                member.setId("01012341234");
                member.setPassword("1234");
                List<String> authorities = new ArrayList<>();
                authorities.add("ADMIN");
                member.setAuthorities(authorities);
                member.setMemberName("Junhyunny");
                member.setMemberEmail("kang3966@naver.com");
                em.persist(member);
            } else {
                List<String> authorities = new ArrayList<>();
                authorities.add("ADMIN");
                member.setAuthorities(authorities);
            }
            em.getTransaction().commit();
        } catch (Exception ex) {
            em.getTransaction().rollback();
            log.error("exception occurs", ex);
        } finally {
            em.close();
        }
    }

    @Test
    void removeTest() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = em.find(Member.class, "01012341234");
            if (member != null) {
                em.remove(member);
            }
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

##### removeTest 메소드 수행 결과
- delete 쿼리가 수행되었음을 로그를 통해 확인할 수 있습니다.

```
Hibernate: select member0_.id as id1_0_0_, member0_.authorities as authorit2_0_0_, member0_.member_email as member_e3_0_0_, member0_.member_name as member_n4_0_0_, member0_.password as password5_0_0_ from tb_member member0_ where member0_.id=?
Hibernate: select member0_.id as id1_0_0_, member0_.authorities as authorit2_0_0_, member0_.member_email as member_e3_0_0_, member0_.member_name as member_n4_0_0_, member0_.password as password5_0_0_ from tb_member member0_ where member0_.id=?
Hibernate: delete from tb_member where id=?
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-02-02-jpa-persistence-context>

#### REFERENCE
- <https://gunlog.dev/JPA-Persistence-Context/>
- <https://gmlwjd9405.github.io/2019/08/06/persistence-context.html>

[jpa-blog-link]: https://junhyunny.github.io/spring-boot/jpa/java-persistence-api/

[persistence-context-advantages-link]: https://junhyunny.github.io/spring-boot/jpa/junit/persistence-context-advantages/
[jpa-flush-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-flush/
[jpa-clear-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-clear/