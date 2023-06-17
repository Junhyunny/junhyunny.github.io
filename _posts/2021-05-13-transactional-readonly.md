---
title: "readOnly Attribute in @Transactional"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-09-01T02:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Features of EntityManager][persistence-context-advantages-link]

## 1. @Transactional readOnly Attribute

먼저 `javadoc`을 살펴봤습니다. 

* 트랜잭션이 읽기 전용인 경우 true 값으로 설정하는 플래그이다.
* 런타임 시 해당 트랜잭션을 최적화한다.
* 트랜잭션 하위 시스템에 대한 힌트 역할을 수행한다.
* 반드시 쓰기 액세스 시도 실패를 야기하지 않는다.
* 읽기 전용 힌트를 해석할 수 없는 트랜잭션 매니저는 예외를 던지지 않고 힌트는 무시한다. 

```java
    /**
     * A boolean flag that can be set to {@code true} if the transaction is
     * effectively read-only, allowing for corresponding optimizations at runtime.
     * <p>Defaults to {@code false}.
     * <p>This just serves as a hint for the actual transaction subsystem;
     * it will <i>not necessarily</i> cause failure of write access attempts.
     * A transaction manager which cannot interpret the read-only hint will
     * <i>not</i> throw an exception when asked for a read-only transaction
     * but rather silently ignore the hint.
     * @see org.springframework.transaction.interceptor.TransactionAttribute#isReadOnly()
     * @see org.springframework.transaction.support.TransactionSynchronizationManager#isCurrentTransactionReadOnly()
     */
    boolean readOnly() default false;
```

어떤 뉘앙스인지 알 것 같지만, 기능에 대한 정확한 이해를 원했습니다. 
검색 중 백기선님의 댓글을 발견했습니다. 

> readOnly는 현재 해당 그 트랜잭션 내에서 데이터를 읽기만 할건지 설정하는 겁니다. 이걸 설정하면 DB 중에 read 락(lock)과 write 락을 따로 쓰는 경우 해당 트랜잭션에서 의도치 않게 데이터를 변경하는 일을 막아줄 뿐 아니라, 하이버네이트를 사용하는 경우에는 FlushMode를 Manual로 변경하여 dirty checking을 생략하게 해준다거나 DB에 따라 DataSource의 Connection 레벨에도 설정되어 약간의 최적화가 가능합니다.

관련된 내용들을 바탕으로 다시 정리해봤습니다. 

* 의도지 않게 데이터를 변경하는 것을 막아준다. 
* 하이버네이트(hibernate)를 사용하는 경우에는 플러시 모드를 매뉴얼(manual)로 변경한다.
    * 오염 감지(dirty checking) 과정을 생략하면서 속도 향상 효과를 얻는다.
* 데이터베이스에 따라 데이터 소스 연결 수준에서 약간의 최적화가 가능하다.

## 2. Practice

데이터 소스 연결 설정에 관련된 내용을 제외하고 요약한 내용들을 확인할 수 있는 테스트 코드를 작성해봤습니다. 

### 2.1. application.yml

* 로그 확인을 위해 로그 하이버네이트 로그 레벨을 트레이스(trace)로 변경합니다.

```yml
server:
  port: 8081
spring:
  mvc:
    view:
      prefix: /WEB-INF/jsp/
      suffix: .jsp
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/test?characterEncoding=UTF-8&serverTimezone=UTC
    username: root
    password: 1234
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    show-sql: true
    database-platform: org.hibernate.dialect.MySQL5InnoDBDialect
    hibernate:
      ddl-auto: create
logging:
  level:
    org:
      springframework:
        orm:
          jpa: DEBUG
      hibernate:
        persister:
          entity: TRACE
```

### 2.1. 의도지 않은 데이터 변경 방지 테스트

다음과 같은 시나리오를 생각해보았습니다.

- @Transactional 애너테이션에 **`readOnly=true`** 설정
- 해당 메소드 내부에서 saveAndFlush 메소드 호출
- 에러 메세지 기대

#### 2.1.1. OrderService 클래스

```java
package blog.in.action.transcation.service;


import blog.in.action.transcation.entity.Orders;
import blog.in.action.transcation.repository.OrderRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Log4j2
@Component
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public Orders createOrderWithReadOnlyTrue(Orders order) {
        return orderRepository.saveAndFlush(order);
    }

    // ...
}
```

#### 2.1.2. 테스트 코드

```java
@Log4j2
@SpringBootTest
public class TransactionalReadOnlyTest {

    // ... 기타 다른 코드

    @Test
    @DisplayName("READ ONLY TRUE")
    public void test_withReadOnlyTrue() {
        try {
            Orders order = new Orders("123");
            orderService.createOrderWithReadOnlyTrue(order);
        } catch (Exception e) {
            log.warn(e.getMessage(), e);
        } finally {
            log.info("READ ONLY TRUE");
        }
    }
}
```

#### 2.1.3. 테스트 결과 로그
- Connection is read-only. Queries leading to data modification are not allowed, 메세지 출력
- Participating transaction failed - marking existing transaction as rollback-only, 롤백 수행
- could not execute statement, GenericJDBCException 발생
- 실제 데이터베이스를 확인해보면 insert 된 데이터가 존재하지 않습니다.

```
2021-05-13 03:38:57.240 DEBUG 10876 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.transcation.service.OrderService.createOrderWithReadOnlyTrue]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2021-05-13 03:38:57.240 DEBUG 10876 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(2011442367<open>)] for JPA transaction
2021-05-13 03:38:57.242 DEBUG 10876 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@2972b493]
2021-05-13 03:38:57.242 DEBUG 10876 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(2011442367<open>)] for JPA transaction
2021-05-13 03:38:57.242 DEBUG 10876 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
2021-05-13 03:38:57.242 TRACE 10876 --- [           main] o.h.p.entity.AbstractEntityPersister     : Fetching entity: [blog.in.action.transcation.entity.Orders#123]
Hibernate: select orders0_.id as id1_1_0_, orders0_.value as value2_1_0_ from orders orders0_ where orders0_.id=?
2021-05-13 03:38:57.242 TRACE 10876 --- [           main] o.h.p.entity.AbstractEntityPersister     : Inserting entity: [blog.in.action.transcation.entity.Orders#123]
Hibernate: insert into orders (value, id) values (?, ?)
2021-05-13 03:38:57.242 TRACE 10876 --- [           main] o.h.p.entity.AbstractEntityPersister     : Dehydrating entity: [blog.in.action.transcation.entity.Orders#123]
2021-05-13 03:38:57.252  WARN 10876 --- [           main] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Error: 0, SQLState: S1009
2021-05-13 03:38:57.252 ERROR 10876 --- [           main] o.h.engine.jdbc.spi.SqlExceptionHelper   : Connection is read-only. Queries leading to data modification are not allowed
2021-05-13 03:38:57.252 DEBUG 10876 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating transaction failed - marking existing transaction as rollback-only
2021-05-13 03:38:57.252 DEBUG 10876 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Setting JPA transaction on EntityManager [SessionImpl(2011442367<open>)] rollback-only
2021-05-13 03:38:57.252 DEBUG 10876 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction rollback
2021-05-13 03:38:57.252 DEBUG 10876 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Rolling back JPA transaction on EntityManager [SessionImpl(2011442367<open>)]
2021-05-13 03:38:57.252 DEBUG 10876 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(2011442367<open>)] after transaction
2021-05-13 03:38:57.260  WARN 10876 --- [           main] b.i.a.t.r.TransactionalReadOnlyTest      : could not execute statement; nested exception is org.hibernate.exception.GenericJDBCException: could not execute statement

org.springframework.orm.jpa.JpaSystemException: could not execute statement; nested exception is org.hibernate.exception.GenericJDBCException: could not execute statement
    at org.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(HibernateJpaDialect.java:353) ~[spring-orm-5.2.4.RELEASE.jar:5.2.4.RELEASE]
    at org.springframework.orm.jpa.vendor.HibernateJpaDialect.translateExceptionIfPossible(HibernateJpaDialect.java:255) ~[spring-orm-5.2.4.RELEASE.jar:5.2.4.RELEASE]
```

### 2.2. Hibernate 사용 시 DIRTY CHECKING 생략 가능 여부 테스트
다음과 같은 시나리오를 생각해보았습니다.
- 모든 데이터 조회 후 id 값을 value 값에 set 합니다.
- 조회된 엔티티(entity) 들은 JPA Lifecycle 중 **`managed`** 상태입니다.
- 관리되는(managed) 엔티티들은 변경이 발생하는 경우 DIRTY CHECKING에 의해서 감지되고 업데이트 됩니다.
- 다음과 같이 가정해보았습니다.
    - DIRTY CHECKING이 동작한다면 트랜잭션 종료 시 업데이트가 수행됩니다.
    - DIRTY CHECKING이 동작하지 않는다면 트랜잭션 종료 시 업데이트가 수행되지 않습니다.
- DIRTY CHECKING 관련 포스트 ()

#### 2.2.1. OrderService 클래스(readOnly=true)

```java
package blog.in.action.transcation.service;


import blog.in.action.transcation.entity.Orders;
import blog.in.action.transcation.repository.OrderRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Log4j2
@Component
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;

    // ...

    @Transactional(readOnly = true)
    public void updateAllWithReadOnlyTrue() {
        List<Orders> orders = orderRepository.findAll();
        for (Orders order : orders) {
            order.setValue(order.getId());
        }
    }

    @Transactional
    public void updateAllWithReadOnlyFalse() {
        List<Orders> orders = orderRepository.findAll();
        for (Orders order : orders) {
            order.setValue(order.getId());
        }
    }
}
```

#### 2.2.2. 테스트 코드

```java
@Log4j2
@SpringBootTest
public class TransactionalReadOnlyTest {

    // ... 

    @Test
    @DisplayName("FIND ALL READ ONLY TRUE")
    public void test_findAllWithReadOnlyTrue() {
        try {
            long start = System.currentTimeMillis();
            orderService.updateAllWithReadOnlyTrue();
            long end = System.currentTimeMillis();
            log.info((end - start) + " ms");
        } catch (Exception e) {
            log.warn(e.getMessage());
        } finally {
            log.info("FIND ALL READ ONLY TRUE");
        }
    }

    @Test
    @DisplayName("FIND ALL READ ONLY FALSE")
    public void test_findAllWithReadOnlyFalse() {
        try {
            long start = System.currentTimeMillis();
            orderService.updateAllWithReadOnlyFalse();
            long end = System.currentTimeMillis();
            log.info((end - start) + " ms");
        } catch (Exception e) {
            log.warn(e.getMessage());
        } finally {
            log.info("FIND ALL READ ONLY FALSE");
        }
    }
}
```

#### 2.2.2. updateAllWithReadOnlyTrue 메소드 테스트 결과 로그, **`readOnly = true`**
- 특이한 로그는 확인되지 않습니다.
- 12 ms 소요되었습니다.

```
2021-05-13 03:50:43.136 DEBUG 1988 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.transcation.service.OrderService.updateAllWithReadOnlyTrue]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2021-05-13 03:50:43.138 DEBUG 1988 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(2058293002<open>)] for JPA transaction
2021-05-13 03:50:43.138 DEBUG 1988 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@7234db3]
2021-05-13 03:50:43.138 DEBUG 1988 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(2058293002<open>)] for JPA transaction
2021-05-13 03:50:43.138 DEBUG 1988 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select orders0_.id as id1_1_, orders0_.value as value2_1_ from orders orders0_
2021-05-13 03:50:43.146 TRACE 1988 --- [           main] o.h.p.entity.AbstractEntityPersister     : Hydrating entity: [blog.in.action.transcation.entity.Orders#0]
2021-05-13 03:50:43.146 TRACE 1988 --- [           main] o.h.p.entity.AbstractEntityPersister     : Hydrating entity: [blog.in.action.transcation.entity.Orders#1]
...
2021-05-13 03:50:43.148 TRACE 1988 --- [           main] o.h.p.entity.AbstractEntityPersister     : Hydrating entity: [blog.in.action.transcation.entity.Orders#97]
2021-05-13 03:50:43.148 TRACE 1988 --- [           main] o.h.p.entity.AbstractEntityPersister     : Hydrating entity: [blog.in.action.transcation.entity.Orders#98]
2021-05-13 03:50:43.148 TRACE 1988 --- [           main] o.h.p.entity.AbstractEntityPersister     : Hydrating entity: [blog.in.action.transcation.entity.Orders#99]
2021-05-13 03:50:43.148 DEBUG 1988 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-13 03:50:43.148 DEBUG 1988 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(2058293002<open>)]
2021-05-13 03:50:43.148 DEBUG 1988 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(2058293002<open>)] after transaction
2021-05-13 03:50:43.156  INFO 1988 --- [           main] b.i.a.t.r.TransactionalReadOnlyTest      : 12 ms
2021-05-13 03:50:43.156  INFO 1988 --- [           main] b.i.a.t.r.TransactionalReadOnlyTest      : FIND ALL READ ONLY TRUE
```

#### 2.2.3. updateAllWithReadOnlyTrue 메소드 테스트 결과
- DIRTY CHECKING이 수행되지 않았으므로 데이터 업데이트가 발생하지 않았습니다.

<p align="left"><img src="/images/transactional-readonly-1.JPG" width="15%"></p>

#### 2.2.4. updateAllWithReadOnlyFalse 메소드 테스트 결과 로그, **`readOnly = false`**
- blog.in.action.transcation.entity.Orders.value is dirty, DIRTY CHECKING 관련 로그가 출력됩니다.
- Updating entity: [blog.in.action.transcation.entity.Orders#0], 업데이트 수행이 확인됩니다.
- 60 ms 소요되었습니다.

```

2021-05-13 03:53:14.503 DEBUG 17128 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.transcation.service.OrderService.updateAllWithReadOnlyFalse]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2021-05-13 03:53:14.503 DEBUG 17128 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1670055419<open>)] for JPA transaction
2021-05-13 03:53:14.503 DEBUG 17128 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@77e42cbf]
2021-05-13 03:53:14.511 DEBUG 17128 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1670055419<open>)] for JPA transaction
2021-05-13 03:53:14.511 DEBUG 17128 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select orders0_.id as id1_1_, orders0_.value as value2_1_ from orders orders0_
2021-05-13 03:53:14.511 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : Hydrating entity: [blog.in.action.transcation.entity.Orders#0]
2021-05-13 03:53:14.511 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : Hydrating entity: [blog.in.action.transcation.entity.Orders#1]
...
2021-05-13 03:53:14.523 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : blog.in.action.transcation.entity.Orders.value is dirty
2021-05-13 03:53:14.523 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : blog.in.action.transcation.entity.Orders.value is dirty
2021-05-13 03:53:14.523 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : blog.in.action.transcation.entity.Orders.value is dirty
...
2021-05-13 03:53:14.533 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : blog.in.action.transcation.entity.Orders.value is dirty
2021-05-13 03:53:14.533 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : blog.in.action.transcation.entity.Orders.value is dirty
2021-05-13 03:53:14.533 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : Updating entity: [blog.in.action.transcation.entity.Orders#0]
Hibernate: update orders set value=? where id=?
2021-05-13 03:53:14.533 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : Dehydrating entity: [blog.in.action.transcation.entity.Orders#0]
2021-05-13 03:53:14.533 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : Updating entity: [blog.in.action.transcation.entity.Orders#1]
Hibernate: update orders set value=? where id=?
2021-05-13 03:53:14.533 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : Dehydrating entity: [blog.in.action.transcation.entity.Orders#1]
2021-05-13 03:53:14.533 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : Updating entity: [blog.in.action.transcation.entity.Orders#10]
Hibernate: update orders set value=? where id=?
...
2021-05-13 03:53:14.563 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : Dehydrating entity: [blog.in.action.transcation.entity.Orders#97]
2021-05-13 03:53:14.563 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : Updating entity: [blog.in.action.transcation.entity.Orders#98]
Hibernate: update orders set value=? where id=?
2021-05-13 03:53:14.563 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : Dehydrating entity: [blog.in.action.transcation.entity.Orders#98]
2021-05-13 03:53:14.563 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : Updating entity: [blog.in.action.transcation.entity.Orders#99]
Hibernate: update orders set value=? where id=?
2021-05-13 03:53:14.563 TRACE 17128 --- [           main] o.h.p.entity.AbstractEntityPersister     : Dehydrating entity: [blog.in.action.transcation.entity.Orders#99]
2021-05-13 03:53:14.563 DEBUG 17128 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1670055419<open>)] after transaction
2021-05-13 03:53:14.563  INFO 17128 --- [           main] b.i.a.t.r.TransactionalReadOnlyTest      : 60 ms
2021-05-13 03:53:14.571  INFO 17128 --- [           main] b.i.a.t.r.TransactionalReadOnlyTest      : FIND ALL READ ONLY FALSE
```

#### 2.2.5. updateAllWithReadOnlyFalse 메소드 테스트 결과
- DIRTY CHECKING이 수행되었으므로 value 컬럼에 id 컬럼과 동일한 값이 업데이트 되었습니다.

<p align="left"><img src="/images/transactional-readonly-2.JPG" width="15%"></p>

## CLOSING
이전 [Features of EntityManager][persistence-context-advantages-link] 포스트를 정리하면서 
DIRTY CHECKING을 수행하는 위치가 궁금해 정리해둔 것이 이번 포스트에 큰 도움을 줬습니다. 
DIRTY CHECKING 관련 로그를 출력할 수 있어서 실제 동작 여부에 대한 검증을 쉽게 성공할 수 있었습니다. 

또, 관련된 포스트들을 확인하니 데이터베이스 제품에 따라 readOnly 기능 제공 여부가 다르다고 합니다. 
특정 버전 이후부터 가능하다는데 다행히도 제가 가진 MySQL에서는 정상적으로 동작하였습니다. 
관련된 내용은 아래 참조 링크를 열어보시면 확인이 가능합니다. 

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-05-13-transactional-readonly>

#### REFERENCE

* <https://www.inflearn.com/questions/7185>
* <http://wonwoo.ml/index.php/post/839>
* <https://kwonnam.pe.kr/wiki/springframework/transaction>

[persistence-context-advantages-link]: https://junhyunny.github.io/spring-boot/jpa/junit/persistence-context-advantages/