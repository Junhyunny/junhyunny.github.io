---
title: "JPA Persistence Context"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-02-03T09:00:00
---

<br>

JPA는 EntityManager를 통해 엔티티(Entity)를 관리합니다. 
**EntityManager는 @Id 필드를 이용해 엔티티를 구분짓고 이들을 관리합니다.** 
ORM(Object-Relation Mapping) 개념상 @Id 필드는 데이터베이스의 PK를 의미하므로 @Id 값이 다른 경우에는 다른 데이터임을 보장합니다. 
EntityManager가 엔티티를 어떤 방식으로 구분짓는지 알았으니 어떤 방법으로 관리하는지 알아보도록 하겠습니다.

## 영속성 컨텍스트(Persistence Context)

> 엔티티(Entity)를 영구히 저장하는 환경

영속성 컨텍스트는 EntityManager를 통해 접근이 가능합니다. 
엔티티 객체를 만든 후 EntityManager의 **`persist(E)`** 메소드를 호출하여 생성한 엔티티를 영속성 컨텍스트에 저장합니다. 
당연히 엔티티 객체를 영속성 컨텍스트에서 제거하는 방법도 존재합니다. 
JPA가 엔티티를 어떻게 관리하는지 Entity Lifecycle을 통해 더 자세히 알아보도록 하겠습니다. 

### Entity Lifecycle

새로운 기술을 공부할때마다 접하는 라이프사이클(lifecycle)에 대한 개념은 언제나 흥미롭습니다. 

##### Entity Lifecycle 흐름
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

## 테스트

테스트는 간단하게 JUnit을 이용하여 진행하였습니다.

### 테스트 패키지 구조

<p align="left"><img src="/images/jpa-persistence-context-2.JPG" width="30%"></p>

### application.yml
```yml
server:
  port: 8081
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/mysqldb?characterEncoding=UTF-8&serverTimezone=UTC
    username: root
    password: 1234
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    show-sql: true
    database-platform: org.hibernate.dialect.MySQL5InnoDBDialect
    hibernate:
      ddl-auto: update
```

### pom.xml
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
        <relativePath /> <!-- lookup parent from repository -->
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
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
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
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>org.springframework.security.oauth</groupId>
            <artifactId>spring-security-oauth2</artifactId>
            <version>2.3.3.RELEASE</version>
        </dependency>

        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-jwt</artifactId>
            <version>1.0.10.RELEASE</version>
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

### persist 테스트

해당 테스트는 2번 테스트를 수행하면 됩니다. 
1차 수행했을 때와 2차 수행했을 때 valuCheckTest 테스트에서 결과가 달라집니다.

```java
package blog.in.action.lifecycle;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;

import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.springframework.boot.test.context.SpringBootTest;

import blog.in.action.entity.Member;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@TestMethodOrder(OrderAnnotation.class)
@SpringBootTest
public class PersistTest {

    @PersistenceUnit
    private EntityManagerFactory factory;

    @Test
    @Order(value = 0)
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
                member.setAuthroities(authorities);
            } else {
                // 새로운 객체 생성
                log.info("새로운 객체를 생성합니다.");
                member = new Member();
                member.setId("01012341234");
                member.setPassword("1234");
                List<String> authorities = new ArrayList<>();
                authorities.add("ADMIN");
                member.setAuthroities(authorities);
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

    @Test
    @Order(value = 1)
    void valuCheckTest() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = em.find(Member.class, "01012341234");
            if (member != null) {
                String actual = member.getAuthroities().get(0);
                assertEquals("ADMIN", actual);
                assertEquals("MEMBER", actual);
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

#### 1차 수행
- em.getTransaction().begin() 메소드를 통해 트랜잭션 시작합니다.
- 데이터가 존재하지 않으므로 em.find() 메소드 수행시 member 객체는 null 입니다.
- 새로운 객체를 생성합니다.(new/transient)
- em.perist(E) 메소드를 통해 생성한 객체를 영속성 컨텍스트에 추가합니다.(managed)
- em.getTransaction().commit() 메소드를 통해 트랜잭션을 commit 합니다.
- 영속성 컨텍스트에 저장된 member 엔티티 정보를 데이터베이스에 반영됩니다.(insert)

##### 1차 수행시 데이터베이스
- 데이터가 추가되었음을 확인할 수 있습니다.
<p align="left"><img src="/images/jpa-persistence-context-3.JPG"></p>

##### 1차 수행시 valuCheckTest 메소드 수행 결과
- assertEquals 메소드 수행시 예상 값이 "MEMBER"인 경우 실패
<p align="center"><img src="/images/jpa-persistence-context-4.JPG"></p>

#### 2차 수행
- em.getTransaction().begin() 메소드를 통해 트랜잭션 시작합니다.
- 이전 수행에서 저장된 데이터가 있으므로 em.find() 메소드를 수행시 member 객체가 반환됩니다.(managed)
- member 객체의 값을 변경합니다.
- em.getTransaction().commit() 메소드를 통해 트랜잭션을 commit 합니다.
- 영속성 컨텍스트에 저장된 member 엔티티의 변경 정보를 데이터베이스에 반영됩니다.(update)

##### 2차 수행시 데이터베이스
- 데이터가 변경되었음을 확인할 수 있습니다.
<p align="left"><img src="/images/jpa-persistence-context-5.JPG"></p>

##### 2차 수행시 valuCheckTest 메소드 수행 결과
- 데이터가 변경되었음을 확인할 수 있습니다.
- assertEquals 메소드 수행시 예상 값이 "ADMIN"인 경우 실패
<p align="center"><img src="/images/jpa-persistence-context-6.JPG"></p>

### detach 테스트

`persist 테스트`에서 영속성 컨텍스트에 저장된 객체의 값을 변경하면 데이터가 업데이트되는 것을 확인하였습니다. 
이번 테스트에서는 영속성 컨텍스트에 저장된 객체를 datch 메소드를 통해 분리한 후 데이터 변경하였을 때 어떤 결과가 나오는지 valuCheckTest 테스트를 통해 확인해보겠습니다. 
동시에 datch 메소드를 통해 영속성 컨텍스트에서 분리한 엔티티 객체를 삭제하면 어떤 결과가 나오는지 detachRemoveTest 테스트를 통해 알아보겠습니다.

```java
package blog.in.action.lifecycle;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.boot.test.context.SpringBootTest;

import blog.in.action.entity.Member;
import lombok.extern.slf4j.Slf4j;

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
                member.setAuthroities(authorities);
                member.setMemberName("Junhyunny");
                member.setMemberEmail("kang3966@naver.com");
                em.persist(member);
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
                log.info("detach한 이후 객체의 값을 변경합니다.");
                em.detach(member);
                List<String> authorities = new ArrayList<>();
                authorities.add("DETACHED_ADMIN");
                member.setAuthroities(authorities);
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
    void valuCheckTest() {
        EntityManager em = factory.createEntityManager();
        try {
            em.getTransaction().begin();
            Member member = em.find(Member.class, "01012341234");
            if (member != null) {
                String actual = member.getAuthroities().get(0);
                assertEquals("ADMIN", actual);
                assertEquals("DETACHED_ADMIN", actual);
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
                log.info("detach한 이후 객체를 삭제합니다.");
                em.detach(member);
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

##### valuCheckTest 메소드 수행 결과
- 데이터가 변경되지 않았음을 확인할 수 있습니다.
- assertEquals 메소드 수행시 예상 값이 "DETACHED_ADMIN"인 경우 실패
<p align="center"><img src="/images/jpa-persistence-context-7.JPG"></p>

##### detachRemoveTest 메소드 수행 결과
- 영속성 컨텍스트에서 분리된 객체는 삭제하지 못합니다.
- detach 이후 데이터 삭제시 IllegalArgumentException이 발생
- Exception Mesage, Removing a detached instance blog.in.action.entity.Member#01012341234
<p align="center"><img src="/images/jpa-persistence-context-8.JPG"></p>

### remove 테스트 코드

이번 테스트에서는 영속성 컨텍스트에 저장된 데이터를 remove 메소드를 통해 제거할 시 실제 데이터도 삭제가 되는지 확인해보겠습니다.

```java
package blog.in.action.lifecycle;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import blog.in.action.entity.Member;
import lombok.extern.slf4j.Slf4j;

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
                member.setAuthroities(authorities);
                member.setMemberName("Junhyunny");
                member.setMemberEmail("kang3966@naver.com");
                em.persist(member);
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
- 데이터가 삭제되었음을 확인할 수 있습니다.
- 데이터베이스 조회 결과 및 관련 로그
<p align="left"><img src="/images/jpa-persistence-context-9.JPG"></p>
<p align="center"><img src="/images/jpa-persistence-context-10.JPG"></p>

## OPINION
영속성 컨텍스트가 무엇인지, 이를 통해 JPA EntityManager가 엔티티를 어떻게 관리하고 데이터를 저장하는지에 대해 알아보았습니다. 
별도로 이 영역을 만들어서 어떤 이점을 얻을 수 있는지 다음 글에서 영속성 컨텍스트가 제공해주는 기능을 정리하면서 알아보도록 하겠습니다. 

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action>

#### REFERENCE
- <https://gunlog.dev/JPA-Persistence-Context/>
- <https://gmlwjd9405.github.io/2019/08/06/persistence-context.html>
