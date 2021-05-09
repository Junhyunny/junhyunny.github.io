---
title: "@Transactional Propagtaion Type"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-05-10T00:00:00
---

<br>

기본적으로 트랜잭션은 [ACID 특징][transaction-acid-link]을 만족해야합니다. 
> 트랜잭션 ACID 특징 중 원자성(Atomic)<br>
> 트랜잭션의 작업이 부분적으로 실행되거나 중단되지 않는 것을 보장합니다.<br>
> All or Noting의 개념으로서 작업 단위의 일부분만 실행하지 않는다는 것을 의미합니다.

Spring Boot 프레임워크은 어플리케이션이 트랜잭션 원자성을 만족시킬 수 있도록 **`@Transactional`** 애너테이션을 제공합니다. 
**`@Transactional`** 애너테이션이 제공하는 기능과 트랜잭션 전파 타입(propagation type)에 대해 정리해보았습니다.  

## @Transactional 애너테이션
Spring 프레임워크는 AOP(Aspect Oriented Programming) 기능을 지원합니다. 
AOP 기능이란 특정 시점의 동작을 가로채어 해당하는 동작의 앞, 뒤로 필요한 기능을 수행하는 프로그래밍 방식입니다. 
Spring 프레임워크는 개발자가 트랜잭션에 대한 제어를 쉽게 처리할 수 있도록 AOP 기능과 애너테이션을 이용합니다. 

##### AOP 기능을 이용한 트랜잭션 처리 개념도
<p align="center"><img src="/images/transactional-propagation-type-1.jpg" width="80%"></p>

##### @Transactional 애너테이션 적용 메소드 호출 시 Call Stack
- 디버그를 통해 확인
<p align="center"><img src="/images/transactional-propagation-type-2.jpg" width="80%"></p>

### @Transactional 애너테이션 사용 시 주의사항
주의사항으로 AOP 기능은 Spring 프레임워크에서 관리하는 빈(Bean)에게만 적용할 수 있습니다. 
new 키워드를 이용해 만든 객체의 메소드에 @Transactional 애너테이션이 붙어 있더라도 정상적으로 동작하지 않습니다. 
가능한 방법이 있는 듯 하지만 이번 포스트에서는 다루지 않겠습니다. 

##### 빈(Bean)이 아닌 객체 @Transactional 애너테이션 적용 시 
<p align="center"><img src="/images/transactional-propagation-type-3.jpg" width="80%"></p>

##### 빈(Bean)이 아닌 객체 @Transactional 애너테이션 적용 메소드 호출 시 Call Stack
- 디버그를 통해 확인
<p align="center"><img src="/images/transactional-propagation-type-4.jpg" width="80%"></p>

### @Transactional 애너테이션 적용 가능 위치
@Transactional 애너테이션을 살펴보면 @Target이 TYPE, METHOD 임을 확인할 수 있습니다. 
각 타입 별 적용 가능 범위입니다.
- ElementType.TYPE - Class, interface (including annotation type), or enum declaration
- ElementType.METHOD - Method declaration

메소드에 @Transactional 애너테이션을 적용하는 경우는 명확합니다. 
클래스에 적용하는 경우에는 어떻게 트랜잭션 처리 기능이 제공되는지 모호합니다. 
관련되 내용을 찾아본 결과 클래스에 @Transactional 애너테이션을 추가하는 경우 모든 public 메소드에는 적용되지만, private, protected 메소드에는 적용되지 않는다는 내용을 확인하였습니다. 

> StackOverflow<br>
> Spring applies the class-level annotation to all public methods of this class that we did not annotate with @Transactional. 
> However, if we put the annotation on a private or protected method, Spring will ignore it without an error.

##### @Transactional 애너테이션 코드
```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface Transactional {
  ...
}
```

## 트랜잭션 전파 타입(Propagation Type)
트랜잭션의 전파 타입은 어떤 메소드에서 다른 메소드 호출 시 트랜잭션을 이어나갈 것인지에 대한 설정입니다. 
총 7개 존재하며 각 타입 별로 기능에 대해 정리하였습니다. 
- REQUIRED
  - Support a current transaction, create a new one if none exists.
  - 현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 새로 만듭니다.
- SUPPORTS
  - Support a current transaction, execute non-transactionally if none exists.
  - 현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 트랜잭션을 만들지 않습니다. 
- MANDATORY
  - Support a current transaction, throw an exception if none exists.
  - 현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 exception을 던집니다.
- REQUIRES_NEW
  - Create a new transaction, and suspend the current transaction if one exists.
  - 새로운 트랜잭션을 만듭니다. 진행 중인 트랜잭션이 있다면 이를 일시 중단합니다.
- NOT_SUPPORTED
  - Execute non-transactionally, suspend the current transaction if one exists.
  - 트랜잭션 없이 수행합니다. 진행 중인 트랜잭션이 있다면 이를 일시 중단합니다.
- NEVER
  - Execute non-transactionally, throw an exception if a transaction exists.
  - 트랜잭션 없이 수행합니다. 진행 중인 트랜잭션이 있다면 exception을 던집니다.
- NESTED
  - Execute within a nested transaction if a current transaction exists, behave like {@code REQUIRED} otherwise.
  - 현재 트랜잭션이 있으면 중첩 트랜잭션 내에서 실행하고, 그렇지 않으면 REQUIRED 처럼 동작합니다.

역시 글로만 정리하면 이해가 어렵습니다. 
각 전파 타입 별로 간단한 테스트 코드와 이미지를 이용해 이해도를 높혀보겠습니다. 
설명의 편이성을 위해 메소드 A 에서 메소드 B를 호출하는 경우 A 메소드를 부모, B 메소드를 자식으로 표현하였습니다. 
JpaRepository 인터페이스를 이용하여 테스트를 진행하였으며 다음과 같은 배경 지식이 필요합니다. 
- JpaRepository 인터페이스에서 제공하는 메소드는 @Transactional 애너테이션이 붙은채로 동작합니다.
- 부모 메소드에서 트랜잭션을 시작하지 않는 경우 바로 commit 됩니다. 
- JPA 특징인 **`쓰기 지연`**으로 인해 insert 쿼리가 나중에 수행되므로 rollback 여부 확인을 위해 즉각 flush를 수행합니다. 

##### application.yml
- 테스트 로그를 확인하기 위해 JPA 패키지 로그 레벨을 DEBUG로 조정하였습니다.
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
```

### REQUIRED
현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 새로 만듭니다. 
@Transactional 애너테이션 전파 타입의 디폴트 값입니다. 
부모 메소드에서 트랜잭션을 시작하였더라도 자식 메소드에서 exception이 발생한다면 전체 트랜잭션이 롤백됩니다. 
이는 동일한 트랜잭션으로 묶이기 때문입니다. 

<p align="center"><img src="/images/transactional-propagation-type-5.jpg" width="80%"></p>
<center>이미지 출처, https://www.nextree.co.kr/p3180/</center><br>

#### 부모 메소드 REQUIRED - 자식 메소드 REQUIRED
- 부모 메소드에서 데이터 INSERT 후 FLUSH
- 자식 메소드 호출 및 데이터 INSERT 후 FLUSH
- 자식 메소드 exception throw
- 부모 메소드에서 catch 수행
- 롤백 여부 확인

##### 테스트 코드
- 중복되는 코드가 많으므로 메소드만 정리하였습니다.

```java
@Log4j2
@SpringBootTest
public class TransactionalTest {

    // 기타 다른 코드

    @Test
    @DisplayName("PARENT REQUIRED - CHILD REQUIRED")
    public void test_parentRequired_childRequired() {
        try {
            Orders order = new Orders("123");
            orderService.createOrderWithRequiredChildRequired(order);
        } catch (Exception e) {
            log.warn(e.getMessage());
        } finally {
            log.info("PARENT REQUIRED - CHILD REQUIRED END");
        }
    }
}

@Component
@RequiredArgsConstructor
class DeliveryService {

    private final DeliveryRepository deliveryRepository;

    private boolean isOk() {
        return false;
    }

    // 기타 다른 코드

    @Transactional(propagation = Propagation.REQUIRED)
    public Delivery createDeliveryWithRequired(Delivery delivery) {
        deliveryRepository.saveAndFlush(delivery);
        if (!isOk()) {
            throw new RuntimeException();
        }
        return delivery;
    }
}

@Component
@RequiredArgsConstructor
class OrderService {

    private final OrderRepository orderRepository;

    private final DeliveryService deliveryService;

    // 기타 다른 코드

    @Transactional(propagation = Propagation.REQUIRED)
    public Orders createOrderWithRequiredChildRequired(Orders order) {
        orderRepository.saveAndFlush(order);
        try {
            deliveryService.createDeliveryWithRequired(new Delivery(order.getId()));
        } catch (Exception e) {
            log.warn(e.getMessage(), e);
        }
        return order;
    }
}
```

##### 테스트 실행 결과 로그
- **`Creating new transaction with name`** 로그를 통해 OrderService.createOrderWithRequiredChildRequired 메소드를 통해 트랜잭션이 시작됨을 알 수 있습니다.
- **`Participating in existing transaction`** 로그를 통해 기존 트랜잭션에 합류하는 것을 확인할 수 있습니다.
- **`Rolling back JPA transaction on EntityManager`** 로그를 통해 트랜잭션 롤백이 수행되었음을 확인할 수 있습니다. 

```
2021-05-10 01:51:45.682 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 01:51:45.682 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1806382908<open>)]
2021-05-10 01:51:45.684 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1806382908<open>)] after transaction
2021-05-10 01:51:45.684 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.transcation.OrderService.createOrderWithRequiredChildRequired]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2021-05-10 01:51:45.684 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1210315984<open>)] for JPA transaction
2021-05-10 01:51:45.684 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@75f316df]
2021-05-10 01:51:45.684 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1210315984<open>)] for JPA transaction
2021-05-10 01:51:45.684 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select orders0_.id as id1_1_0_ from orders orders0_ where orders0_.id=?
Hibernate: insert into orders (id) values (?)
2021-05-10 01:51:45.717 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1210315984<open>)] for JPA transaction
2021-05-10 01:51:45.717 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
2021-05-10 01:51:45.721 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1210315984<open>)] for JPA transaction
2021-05-10 01:51:45.721 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select delivery0_.id as id1_0_0_ from delivery delivery0_ where delivery0_.id=?
Hibernate: insert into delivery (id) values (?)
2021-05-10 01:51:45.724 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating transaction failed - marking existing transaction as rollback-only
2021-05-10 01:51:45.724 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Setting JPA transaction on EntityManager [SessionImpl(1210315984<open>)] rollback-only
2021-05-10 01:51:45.727  WARN 17924 --- [           main] blog.in.action.transcation.OrderService  : null

java.lang.RuntimeException: null
	at blog.in.action.transcation.DeliveryService.createDeliveryWithRequired(TransactionalTest.java:161) ~[test-classes/:na]
	at blog.in.action.transcation.DeliveryService$$FastClassBySpringCGLIB$$fad91b92.invoke(<generated>) ~[test-classes/:na]
	at org.springframework.cglib.proxy.MethodProxy.invoke(MethodProxy.java:218) ~[spring-core-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.invokeJoinpoint(CglibAopProxy.java:769) ~[spring-aop-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163) ~[spring-aop-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.proceed(CglibAopProxy.java:747) ~[spring-aop-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:366) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]

2021-05-10 01:51:45.728 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 01:51:45.728 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1210315984<open>)]
2021-05-10 01:51:45.731 DEBUG 17924 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1210315984<open>)] after transaction
2021-05-10 01:51:45.731  WARN 17924 --- [           main] b.i.a.transcation.TransactionalTest      : Transaction silently rolled back because it has been marked as rollback-only
2021-05-10 01:51:45.731  INFO 17924 --- [           main] b.i.a.transcation.TransactionalTest      : PARENT REQUIRED - CHILD REQUIRED END
```

##### 데이터베이스 테이블 확인
- 부모와 자식 메소드 모두 롤백되어 데이터가 존재하지 않습니다.
- 자식 메소드에서 exception을 throw 하였고 부모 메소드에서 catch 하였음에도 모두 롤백되었습니다.
- 이는 동일 트랜잭션으로 취급되었기 때문에 트랜잭션 자식 메소드에서 찍힌 rollback flag에 의해 부모 메소드도 함께 롤백 처리됩니다.
- <https://woowabros.github.io/experience/2019/01/29/exception-in-transaction.html>

<p align="left"><img src="/images/transactional-propagation-type-6.jpg" width="35%"></p>

#### 부모 메소드 X - 자식 메소드 REQUIRED
- 부모 메소드에서 데이터 INSERT 후 FLUSH
- 자식 메소드 호출 및 데이터 INSERT 후 FLUSH
- 자식 메소드 exception throw
- 롤백 여부 확인

##### 테스트 코드
- 중복되는 코드가 많으므로 메소드만 정리하였습니다.

```java
@Log4j2
@SpringBootTest
public class TransactionalTest {

    // 기타 다른 코드

    @Test
    @DisplayName("PARENT X - CHILD REQUIRED")
    public void test_childRequired() {
        try {
            Orders order = new Orders("123");
            orderService.createOrderChildRequired(order);
        } catch (Exception e) {
            log.warn(e.getMessage());
        } finally {
            log.info("PARENT X - CHILD REQUIRED END");
        }
    }
}

@Component
@RequiredArgsConstructor
class DeliveryService {

    private final DeliveryRepository deliveryRepository;

    private boolean isOk() {
        return false;
    }

    // 기타 다른 코드

    @Transactional(propagation = Propagation.REQUIRED)
    public Delivery createDeliveryWithRequired(Delivery delivery) {
        deliveryRepository.saveAndFlush(delivery);
        if (!isOk()) {
            throw new RuntimeException();
        }
        return delivery;
    }
}

@Component
@RequiredArgsConstructor
class OrderService {

    private final OrderRepository orderRepository;

    private final DeliveryService deliveryService;

    // 기타 다른 코드

    public Orders createOrderChildRequired(Orders order) {
        orderRepository.saveAndFlush(order);
        deliveryService.createDeliveryWithRequired(new Delivery(order.getId()));
        return order;
    }
}
```

##### 테스트 실행 결과 로그
- **`Creating new transaction with name`** 로그를 보면 SimpleJpaRepository.saveAndFlush 메소드를 통해 트랜잭션이 생성됩니다. 
- **`Initiating transaction commit`** 로그를 통해 기존 트랜잭션에 참가하지 않고 새로운 트랜잭션을 수행함을 알 수 있습니다. 
- **`Rolling back JPA transaction on EntityManager`** 로그를 통해 트랜잭션 롤백이 수행되었음을 확인할 수 있습니다. 

```
2021-05-10 01:02:47.632 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 01:02:47.632 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1844498480<open>)]
2021-05-10 01:02:47.632 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1844498480<open>)] after transaction
2021-05-10 01:02:47.642 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.saveAndFlush]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2021-05-10 01:02:47.642 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(730815140<open>)] for JPA transaction
2021-05-10 01:02:47.642 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@7d0e46dd]
Hibernate: select orders0_.id as id1_1_0_ from orders orders0_ where orders0_.id=?
Hibernate: insert into orders (id) values (?)
2021-05-10 01:02:47.671 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 01:02:47.671 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(730815140<open>)]
2021-05-10 01:02:47.673 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(730815140<open>)] after transaction
2021-05-10 01:02:47.673 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.transcation.DeliveryService.createDeliveryWithRequired]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2021-05-10 01:02:47.673 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(397262543<open>)] for JPA transaction
2021-05-10 01:02:47.673 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@59eb987a]
2021-05-10 01:02:47.673 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(397262543<open>)] for JPA transaction
2021-05-10 01:02:47.673 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select delivery0_.id as id1_0_0_ from delivery delivery0_ where delivery0_.id=?
Hibernate: insert into delivery (id) values (?)
2021-05-10 01:02:47.673 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction rollback
2021-05-10 01:02:47.673 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Rolling back JPA transaction on EntityManager [SessionImpl(397262543<open>)]
2021-05-10 01:02:47.673 DEBUG 12040 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(397262543<open>)] after transaction
2021-05-10 01:02:47.673  WARN 12040 --- [           main] b.i.a.transcation.TransactionalTest      : null
2021-05-10 01:02:47.673  INFO 12040 --- [           main] b.i.a.transcation.TransactionalTest      : PARENT X - CHILD REQUIRED END
```

##### 데이터베이스 테이블 확인
- 자식 메소드만 롤백되어 데이터가 존재하지 않습니다.
- 부모 메소드는 트랜잭션 처리에 대한 애너테이션이 없었기에 JpaRepository 레벨에서 수행 후 commit 처리됩니다.

<p align="left"><img src="/images/transactional-propagation-type-7.jpg" width="35%"></p>

### SUPPORTS
현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 트랜잭션을 만들지 않습니다. 
부모 메소드에서 트랜잭션을 시작하였다면 트랜잭션이 이어지지만 없다면 트랜잭션 없이 진행됩니다. 
자식 메소드에서 exception이 발생한다면 부모 메소드에서 실행한 트랜잭션이 있는지 여부에 따라 롤백 여부가 결정됩니다. 

<p align="center"><img src="/images/transactional-propagation-type-8.jpg" width="80%"></p>
<center>이미지 출처, https://www.nextree.co.kr/p3180/</center><br>

#### 부모 REQUIRED - 자식 SUPPORTS
- 부모 메소드에서 데이터 INSERT 후 FLUSH
- 자식 메소드 호출 및 데이터 INSERT 후 FLUSH
- 자식 메소드 exception throw
- 롤백 여부 확인

##### 테스트 코드
- 중복되는 코드가 많으므로 메소드만 정리하였습니다.

```java
@Log4j2
@SpringBootTest
public class TransactionalTest {

    // 기타 다른 코드

    @Test
    @DisplayName("PARENT REQUIRED - CHILD SUPPORTS")
    public void test_parentRequired_childSupports() {
        try {
            Orders order = new Orders("123");
            orderService.createOrderWithRequiredChildSupports(order);
        } catch (Exception e) {
            log.warn(e.getMessage());
        } finally {
            log.info("PARENT REQUIRED - CHILD SUPPORTS END");
        }
    }
}

@Component
@RequiredArgsConstructor
class DeliveryService {

    private final DeliveryRepository deliveryRepository;

    private boolean isOk() {
        return false;
    }

    // 기타 다른 코드

    @Transactional(propagation = Propagation.SUPPORTS)
    public Delivery createDeliveryWithSupports(Delivery delivery) {
        deliveryRepository.saveAndFlush(delivery);
        if (!isOk()) {
            throw new RuntimeException();
        }
        return delivery;
    }
}

@Component
@RequiredArgsConstructor
class OrderService {

    private final OrderRepository orderRepository;

    private final DeliveryService deliveryService;

    // 기타 다른 코드

    @Transactional(propagation = Propagation.REQUIRED)
    public Orders createOrderWithRequiredChildSupports(Orders order) {
        orderRepository.saveAndFlush(order);
        deliveryService.createDeliveryWithSupports(new Delivery(order.getId()));
        return order;
    }
}
```

##### 테스트 실행 결과 로그
- **`Creating new transaction with name`** 로그를 보면 OrderService.createOrderWithRequiredChildSupports 메소드를 통해 트랜잭션이 생성됩니다. 
- **`Participating in existing transaction`** 로그를 통해 기존 트랜잭션에 합류하는 것을 확인할 수 있습니다.
- **`Rolling back JPA transaction on EntityManager`** 로그를 통해 트랜잭션 롤백이 수행되었음을 확인할 수 있습니다. 

```
2021-05-10 01:25:59.507 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 01:25:59.507 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1952021559<open>)]
2021-05-10 01:25:59.509 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1952021559<open>)] after transaction
2021-05-10 01:25:59.509 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.transcation.OrderService.createOrderWithRequiredChildSupports]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2021-05-10 01:25:59.509 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1700257002<open>)] for JPA transaction
2021-05-10 01:25:59.509 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@76e4df53]
2021-05-10 01:25:59.509 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1700257002<open>)] for JPA transaction
2021-05-10 01:25:59.509 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select orders0_.id as id1_1_0_ from orders orders0_ where orders0_.id=?
Hibernate: insert into orders (id) values (?)
2021-05-10 01:25:59.539 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1700257002<open>)] for JPA transaction
2021-05-10 01:25:59.539 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
2021-05-10 01:25:59.539 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1700257002<open>)] for JPA transaction
2021-05-10 01:25:59.539 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select delivery0_.id as id1_0_0_ from delivery delivery0_ where delivery0_.id=?
Hibernate: insert into delivery (id) values (?)
2021-05-10 01:25:59.547 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating transaction failed - marking existing transaction as rollback-only
2021-05-10 01:25:59.547 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Setting JPA transaction on EntityManager [SessionImpl(1700257002<open>)] rollback-only
2021-05-10 01:25:59.547 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction rollback
2021-05-10 01:25:59.547 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Rolling back JPA transaction on EntityManager [SessionImpl(1700257002<open>)]
2021-05-10 01:25:59.549 DEBUG 3076 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1700257002<open>)] after transaction
2021-05-10 01:25:59.549  WARN 3076 --- [           main] b.i.a.transcation.TransactionalTest      : null
2021-05-10 01:25:59.549  INFO 3076 --- [           main] b.i.a.transcation.TransactionalTest      : PARENT REQUIRED - CHILD SUPPORTS END
```

##### 데이터베이스 테이블 확인
- 부모와 자식 메소드 모두 롤백되어 데이터가 존재하지 않습니다.
- 이미지는 생략하였습니다.

#### 부모 X - 자식 SUPPORTS
- 부모 메소드에서 데이터 INSERT 후 FLUSH
- 자식 메소드 호출 및 데이터 INSERT 후 FLUSH
- 자식 메소드 exception throw
- 롤백 여부 확인

##### 테스트 코드
- 중복되는 코드가 많으므로 메소드만 정리하였습니다.

```java
@Log4j2
@SpringBootTest
public class TransactionalTest {

    // 기타 다른 코드

    @Test
    @DisplayName("PARENT X - CHILD SUPPORTS")
    public void test_childSupports() {
        try {
            Orders order = new Orders("123");
            orderService.createOrderChildSupports(order);
        } catch (Exception e) {
            log.warn(e.getMessage());
        } finally {
            log.info("PARENT X - CHILD SUPPORTS END");
        }
    }
}

@Component
@RequiredArgsConstructor
class DeliveryService {

    private final DeliveryRepository deliveryRepository;

    private boolean isOk() {
        return false;
    }

    // 기타 다른 코드

    @Transactional(propagation = Propagation.SUPPORTS)
    public Delivery createDeliveryWithSupports(Delivery delivery) {
        deliveryRepository.saveAndFlush(delivery);
        if (!isOk()) {
            throw new RuntimeException();
        }
        return delivery;
    }
}

@Component
@RequiredArgsConstructor
class OrderService {

    private final OrderRepository orderRepository;

    private final DeliveryService deliveryService;

    // 기타 다른 코드

    public Orders createOrderChildSupports(Orders order) {
        orderRepository.saveAndFlush(order);
        deliveryService.createDeliveryWithSupports(new Delivery(order.getId()));
        return order;
    }
}
```

##### 테스트 실행 결과 로그
- **`Creating new transaction with name`** 로그를 보면 SimpleJpaRepository.saveAndFlush 메소드를 통해 트랜잭션이 생성됩니다. 
- **`Initiating transaction commit`** 로그를 통해 기존 트랜잭션에 참가하지 않고 새로운 트랜잭션을 수행함을 알 수 있습니다. 
- 롤백과 관련된 로그가 확인되지 않습니다.

```
2021-05-10 01:30:22.654 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 01:30:22.654 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(215600758<open>)]
2021-05-10 01:30:22.654 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(215600758<open>)] after transaction
2021-05-10 01:30:22.664 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.saveAndFlush]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2021-05-10 01:30:22.664 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(2127390817<open>)] for JPA transaction
2021-05-10 01:30:22.664 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@6557dcea]
Hibernate: select orders0_.id as id1_1_0_ from orders orders0_ where orders0_.id=?
Hibernate: insert into orders (id) values (?)
2021-05-10 01:30:22.692 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 01:30:22.692 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(2127390817<open>)]
2021-05-10 01:30:22.694 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(2127390817<open>)] after transaction
2021-05-10 01:30:22.694 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.saveAndFlush]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2021-05-10 01:30:22.694 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(994419686<open>)] for JPA transaction
2021-05-10 01:30:22.694 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@7927209f]
Hibernate: select delivery0_.id as id1_0_0_ from delivery delivery0_ where delivery0_.id=?
Hibernate: insert into delivery (id) values (?)
2021-05-10 01:30:22.694 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 01:30:22.694 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(994419686<open>)]
2021-05-10 01:30:22.702 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(994419686<open>)] after transaction
2021-05-10 01:30:22.702 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Resuming suspended transaction after completion of inner transaction
2021-05-10 01:30:22.702 DEBUG 7860 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Should roll back transaction but cannot - no transaction available
2021-05-10 01:30:22.702  WARN 7860 --- [           main] b.i.a.transcation.TransactionalTest      : null
2021-05-10 01:30:22.702  INFO 7860 --- [           main] b.i.a.transcation.TransactionalTest      : PARENT X - CHILD SUPPORTS END
```

##### 데이터베이스 테이블 확인
- 부모, 자식 메소드 모두 롤백되지 않아 데이터가 존재합니다.
- 자식 메소드에서 exception을 throw 하였지만 롤백이 수행되지 않았음을 확인할 수 있습니다.
- 두 메소드 모두 트랜잭션 처리에 대한 코드가 없으므로 JpaRepository 레벨에서 commit이 수행됩니다.

<p align="left"><img src="/images/transactional-propagation-type-9.jpg" width="35%"></p>

### MANDATORY
현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 exception을 던집니다. 
부모 메소드에서 트랜잭션을 시작하였다면 트랜잭션이 이어지지만 없다면 exception을 전달합니다. 
부모에서 트랜재션을 시작하지 않은 케이스에 대해서만 테스트를 진행하였습니다. 

<p align="center"><img src="/images/transactional-propagation-type-10.jpg" width="80%"></p>
<center>이미지 출처, https://www.nextree.co.kr/p3180/</center><br>

#### 부모 X - 자식 MANDATORY
- 부모 메소드에서 데이터 INSERT 후 FLUSH
- 자식 메소드 호출 시 exception 발생 여부 확인

##### 테스트 코드
- 중복되는 코드가 많으므로 메소드만 정리하였습니다.

```java
@Log4j2
@SpringBootTest
public class TransactionalTest {

    // 기타 다른 코드

    @Test
    @DisplayName("PARENT X - CHILD MANDATORY")
    public void test_childMandatory() {
        try {
            Orders order = new Orders("123");
            orderService.createOrderChildMandatory(order);
        } catch (Exception e) {
            log.warn(e.getMessage(), e);
        } finally {
            log.info("PARENT X - CHILD MANDATORY END");
        }
    }
}

@Component
@RequiredArgsConstructor
class DeliveryService {

    private final DeliveryRepository deliveryRepository;

    private boolean isOk() {
        return false;
    }

    // 기타 다른 코드

    @Transactional(propagation = Propagation.MANDATORY)
    public Delivery createDeliveryWithMandatory(Delivery delivery) {
        deliveryRepository.saveAndFlush(delivery);
        if (!isOk()) {
            throw new RuntimeException();
        }
        return delivery;
    }
}

@Component
@RequiredArgsConstructor
class OrderService {

    private final OrderRepository orderRepository;

    private final DeliveryService deliveryService;

    // 기타 다른 코드

    public Orders createOrderChildMandatory(Orders order) {
        orderRepository.saveAndFlush(order);
        deliveryService.createDeliveryWithMandatory(new Delivery(order.getId()));
        return order;
    }
}
```

##### 테스트 실행 결과 로그
- **`Creating new transaction with name`** 로그를 보면 SimpleJpaRepository.saveAndFlush 메소드를 통해 트랜잭션이 생성됩니다. 
- **`Initiating transaction commit`** 로그를 통해 기존 트랜잭션에 참가하지 않고 새로운 트랜잭션을 수행함을 알 수 있습니다.
- **`No existing transaction found for transaction marked with propagation 'mandatory'`**, IllegalTransactionStateException이 발생합니다.

```
2021-05-10 01:38:54.981 DEBUG 17696 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 01:38:54.981 DEBUG 17696 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1109132666<open>)]
2021-05-10 01:38:54.981 DEBUG 17696 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1109132666<open>)] after transaction
2021-05-10 01:38:54.991 DEBUG 17696 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.saveAndFlush]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2021-05-10 01:38:54.991 DEBUG 17696 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1700257002<open>)] for JPA transaction
2021-05-10 01:38:54.991 DEBUG 17696 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@76e4df53]
Hibernate: select orders0_.id as id1_1_0_ from orders orders0_ where orders0_.id=?
Hibernate: insert into orders (id) values (?)
2021-05-10 01:38:55.022 DEBUG 17696 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 01:38:55.022 DEBUG 17696 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1700257002<open>)]
2021-05-10 01:38:55.025 DEBUG 17696 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1700257002<open>)] after transaction
2021-05-10 01:38:55.030  WARN 17696 --- [           main] b.i.a.transcation.TransactionalTest      : No existing transaction found for transaction marked with propagation 'mandatory'

org.springframework.transaction.IllegalTransactionStateException: No existing transaction found for transaction marked with propagation 'mandatory'
	at org.springframework.transaction.support.AbstractPlatformTransactionManager.getTransaction(AbstractPlatformTransactionManager.java:362) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.transaction.interceptor.TransactionAspectSupport.createTransactionIfNecessary(TransactionAspectSupport.java:572) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:360) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.transaction.interceptor.TransactionInterceptor.invoke(TransactionInterceptor.java:99) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186) ~[spring-aop-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.proceed(CglibAopProxy.java:747) ~[spring-aop-5.2.4.RELEASE.jar:5.2.4.RELEASE]

2021-05-10 01:38:55.030  INFO 17696 --- [           main] b.i.a.transcation.TransactionalTest      : PARENT X - CHILD MANDATORY END
```

##### 데이터베이스 테이블 확인
- 부모 메소드는 트랜잭션 처리가 없으므로 commit 처리되어 데이터가 존재합니다.
- 자식 메소드는 수행되지 않았습니다.
- 이미지는 별도로 추가하지 않았습니다. 

### REQUIRES_NEW
새로운 트랜잭션을 만듭니다. 진행 중인 트랜잭션이 있다면 이를 일시 중단합니다. 
부모 메소드에서 트랜잭션을 시작했더라도 자식 메소드는 별도의 트랜잭션으로 분리합니다. 
자식 메소드에서 발생하는 트랜잭션 롤백은 부모 메소드에서 시작한 트랜잭션과 상관이 없습니다. 

<p align="center"><img src="/images/transactional-propagation-type-11.jpg" width="80%"></p>
<center>이미지 출처, https://www.nextree.co.kr/p3180/</center><br>

#### 부모 REQUIRED - 자식 REQUIRES_NEW
- 부모 메소드에서 데이터 INSERT 후 FLUSH
- 자식 메소드 호출 및 데이터 
- 자식 메소드 exception throw
- 부모 메소드에서 catch 수행
- 롤백 여부 확인

##### 테스트 코드
- 중복되는 코드가 많으므로 메소드만 정리하였습니다.

```java
@Log4j2
@SpringBootTest
public class TransactionalTest {

    // 기타 다른 코드

    @Test
    @DisplayName("PARENT REQUIRED - CHILD REQUIRES_NEW")
    public void test_parentRequired_childRequiresNew() {
        try {
            Orders order = new Orders("123");
            orderService.createOrderWithRequiredChildRequiresNew(order);
        } catch (Exception e) {
            log.warn(e.getMessage(), e);
        } finally {
            log.info("PARENT REQUIRED - CHILD REQUIRES_NEW END");
        }
    }
}

@Component
@RequiredArgsConstructor
class DeliveryService {

    private final DeliveryRepository deliveryRepository;

    private boolean isOk() {
        return false;
    }

    // 기타 다른 코드

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Delivery createDeliveryWithRequiresNew(Delivery delivery) {
        deliveryRepository.saveAndFlush(delivery);
        if (!isOk()) {
            throw new RuntimeException();
        }
        return delivery;
    }
}

@Component
@RequiredArgsConstructor
class OrderService {

    private final OrderRepository orderRepository;

    private final DeliveryService deliveryService;

    // 기타 다른 코드

    @Transactional(propagation = Propagation.REQUIRED)
    public Orders createOrderWithRequiredChildRequiresNew(Orders order) {
        orderRepository.saveAndFlush(order);
        try {
            deliveryService.createDeliveryWithRequiresNew(new Delivery(order.getId()));
        } catch (Exception e) {
            log.warn(e.getMessage(), e);
        }
        return order;
    }
}
```

##### 테스트 실행 결과 로그
- **`Creating new transaction with name`** 로그를 보면 OrderService.createOrderWithRequiredChildRequiresNew 메소드를 통해 트랜잭션이 생성됩니다. 
- **`Suspending current transaction, creating new transaction with name`** 로그를 통해 기존 트랜잭션에 참가하지 않고 DeliveryService.createDeliveryWithRequiresNew 메소드를 새로운 트랜잭션을 생성함을 알 수 있습니다. 
- **`Rolling back JPA transaction on EntityManager`** 로그를 통해 롤백이 수행되었음이 확인됩니다.

```
2021-05-10 01:58:16.451 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 01:58:16.451 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(2146222703<open>)]
2021-05-10 01:58:16.451 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(2146222703<open>)] after transaction
2021-05-10 01:58:16.451 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.transcation.OrderService.createOrderWithRequiredChildRequiresNew]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2021-05-10 01:58:16.451 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(552085610<open>)] for JPA transaction
2021-05-10 01:58:16.451 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@4d408746]
2021-05-10 01:58:16.461 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(552085610<open>)] for JPA transaction
2021-05-10 01:58:16.461 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select orders0_.id as id1_1_0_ from orders orders0_ where orders0_.id=?
Hibernate: insert into orders (id) values (?)
2021-05-10 01:58:16.492 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(552085610<open>)] for JPA transaction
2021-05-10 01:58:16.492 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Suspending current transaction, creating new transaction with name [blog.in.action.transcation.DeliveryService.createDeliveryWithRequiresNew]
2021-05-10 01:58:16.492 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1909501184<open>)] for JPA transaction
2021-05-10 01:58:16.492 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@56c7e2d1]
2021-05-10 01:58:16.492 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1909501184<open>)] for JPA transaction
2021-05-10 01:58:16.500 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select delivery0_.id as id1_0_0_ from delivery delivery0_ where delivery0_.id=?
Hibernate: insert into delivery (id) values (?)
2021-05-10 01:58:16.502 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction rollback
2021-05-10 01:58:16.502 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Rolling back JPA transaction on EntityManager [SessionImpl(1909501184<open>)]
2021-05-10 01:58:16.504 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1909501184<open>)] after transaction
2021-05-10 01:58:16.504 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Resuming suspended transaction after completion of inner transaction
2021-05-10 01:58:16.504  WARN 7364 --- [           main] blog.in.action.transcation.OrderService  : null

java.lang.RuntimeException: null
	at blog.in.action.transcation.DeliveryService.createDeliveryWithRequiresNew(TransactionalTest.java:188) ~[test-classes/:na]
	at blog.in.action.transcation.DeliveryService$$FastClassBySpringCGLIB$$fad91b92.invoke(<generated>) ~[test-classes/:na]
	at org.springframework.cglib.proxy.MethodProxy.invoke(MethodProxy.java:218) ~[spring-core-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.invokeJoinpoint(CglibAopProxy.java:769) ~[spring-aop-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163) ~[spring-aop-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.proceed(CglibAopProxy.java:747) ~[spring-aop-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:366) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]

2021-05-10 01:58:16.510 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 01:58:16.510 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(552085610<open>)]
2021-05-10 01:58:16.512 DEBUG 7364 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(552085610<open>)] after transaction
2021-05-10 01:58:16.512  INFO 7364 --- [           main] b.i.a.transcation.TransactionalTest      : PARENT REQUIRED - CHILD REQUIRES_NEW END
```

##### 데이터베이스 테이블 확인
- 자식 메소드에서 던진 exception은 자식 메소드에서 수행한 트랜잭션만 롤백합니다. 
- 던져진 exception은 부모 메소드에서 catch 되었으므로 부모 메소드의 트랜잭션을 정상 수행됩니다.
- 동일한 트랜잭션으로 처리되는 **`PARENT REQUIRED - CHILD REQUIRED`** 테스트와는 대조적입니다. 

<p align="left"><img src="/images/transactional-propagation-type-12.jpg" width="35%"></p>

### NOT_SUPPORTED
트랜잭션 없이 수행합니다. 진행 중인 트랜잭션이 있다면 이를 일시 중단합니다. 
부모 메소드에서 트랜잭션을 시작했더라도 자식 메소드에서는 트랜잭션 처리를 수행하지 않습니다. 

<p align="center"><img src="/images/transactional-propagation-type-13.jpg" width="80%"></p>
<center>이미지 출처, https://www.nextree.co.kr/p3180/</center><br>

#### 부모 REQUIRED - 자식 NOT_SUPPORTED
- 부모 메소드에서 데이터 INSERT 후 FLUSH
- 자식 메소드 호출 및 데이터 INSERT 후 FLUSH
- 자식 메소드 exception throw
- 롤백 여부 확인

##### 테스트 코드
- 중복되는 코드가 많으므로 메소드만 정리하였습니다.

```java
@Log4j2
@SpringBootTest
public class TransactionalTest {

    // 기타 다른 코드

    @Test
    @DisplayName("PARENT REQUIRED - CHILD NOT_SUPPORTED")
    public void test_parentRequired_childNotSupported() {
        try {
            Orders order = new Orders("123");
            orderService.createOrderWithRequiredChildNotSupported(order);
        } catch (Exception e) {
            log.warn(e.getMessage(), e);
        } finally {
            log.info("PARENT REQUIRED - CHILD NOT_SUPPORTED END");
        }
    }
}

@Component
@RequiredArgsConstructor
class DeliveryService {

    private final DeliveryRepository deliveryRepository;

    private boolean isOk() {
        return false;
    }

    // 기타 다른 코드

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public Delivery createDeliveryWithNotSupported(Delivery delivery) {
        deliveryRepository.saveAndFlush(delivery);
        if (!isOk()) {
            throw new RuntimeException();
        }
        return delivery;
    }
}

@Component
@RequiredArgsConstructor
class OrderService {

    private final OrderRepository orderRepository;

    private final DeliveryService deliveryService;

    // 기타 다른 코드

    @Transactional(propagation = Propagation.REQUIRED)
    public Orders createOrderWithRequiredChildNotSupported(Orders order) {
        orderRepository.saveAndFlush(order);
        deliveryService.createDeliveryWithNotSupported(new Delivery(order.getId()));
        return order;
    }
}
```

##### 테스트 실행 결과 로그
- **`Creating new transaction with name`** 로그를 보면 OrderService.createOrderWithRequiredChildNotSupported 메소드를 통해 트랜잭션이 생성됩니다. 
- **`Suspending current transaction`** 로그를 통해 기존 트랜잭션에 참가하지 않음을 알 수 있습니다.
- **`Rolling back JPA transaction on EntityManager`** 로그를 통해 롤백이 수행되었음을 알 수 있습니다.

```
2021-05-10 02:14:46.896 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 02:14:46.896 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1570860758<open>)]
2021-05-10 02:14:46.896 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1570860758<open>)] after transaction
2021-05-10 02:14:46.912 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.transcation.OrderService.createOrderWithRequiredChildNotSupported]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2021-05-10 02:14:46.912 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1271355282<open>)] for JPA transaction
2021-05-10 02:14:46.912 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@2a0d8df8]
2021-05-10 02:14:46.912 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1271355282<open>)] for JPA transaction
2021-05-10 02:14:46.912 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select orders0_.id as id1_1_0_ from orders orders0_ where orders0_.id=?
Hibernate: insert into orders (id) values (?)
2021-05-10 02:14:46.943 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1271355282<open>)] for JPA transaction
2021-05-10 02:14:46.943 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Suspending current transaction
2021-05-10 02:14:46.943 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.saveAndFlush]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2021-05-10 02:14:46.943 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1517228866<open>)] for JPA transaction
2021-05-10 02:14:46.943 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@650d5a3d]
Hibernate: select delivery0_.id as id1_0_0_ from delivery delivery0_ where delivery0_.id=?
Hibernate: insert into delivery (id) values (?)
2021-05-10 02:14:46.943 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 02:14:46.943 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1517228866<open>)]
2021-05-10 02:14:46.954 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1517228866<open>)] after transaction
2021-05-10 02:14:46.954 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Resuming suspended transaction after completion of inner transaction
2021-05-10 02:14:46.954 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Should roll back transaction but cannot - no transaction available
2021-05-10 02:14:46.954 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Resuming suspended transaction after completion of inner transaction
2021-05-10 02:14:46.954 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction rollback
2021-05-10 02:14:46.954 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Rolling back JPA transaction on EntityManager [SessionImpl(1271355282<open>)]
2021-05-10 02:14:46.954 DEBUG 7240 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1271355282<open>)] after transaction
2021-05-10 02:14:46.954  WARN 7240 --- [           main] b.i.a.transcation.TransactionalTest      : null

java.lang.RuntimeException: null
	at blog.in.action.transcation.DeliveryService.createDeliveryWithNotSupported(TransactionalTest.java:210) ~[test-classes/:na]
	at blog.in.action.transcation.DeliveryService$$FastClassBySpringCGLIB$$fad91b92.invoke(<generated>) ~[test-classes/:na]
	at org.springframework.cglib.proxy.MethodProxy.invoke(MethodProxy.java:218) ~[spring-core-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.invokeJoinpoint(CglibAopProxy.java:769) ~[spring-aop-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163) ~[spring-aop-5.2.4.RELEASE.jar:5.2.4.RELEASE]

2021-05-10 02:14:46.954  INFO 7240 --- [           main] b.i.a.transcation.TransactionalTest      : PARENT REQUIRED - CHILD NOT_SUPPORTED END
```

##### 데이터베이스 테이블 확인
- 자식 메소드에서 던진 exception이 부모 메소드까지 전파되어 부모 메소드에서 시작한 트랜잭션만 롤백됩니다. 
- 자식 메소드는 부모 메소드에서 시작한 트랜잭션에 참여하지 않았기에 JpaRepository 트랜잭션이 새로 생성되어 commit 처리됩니다.

<p align="left"><img src="/images/transactional-propagation-type-14.jpg" width="35%"></p>

### NEVER
부모 메소드에서 트랜잭션 시작했다면 자식 메소드에서 excepton이 발생합니다. 

<p align="center"><img src="/images/transactional-propagation-type-15.jpg" width="80%"></p>
<center>이미지 출처, https://www.nextree.co.kr/p3180/</center><br>

#### 부모 REQUIRED - 자식 NEVER
- 부모 메소드에서 데이터 INSERT 후 FLUSH
- 자식 메소드 호출 시 exception 발생 여부 확인
- 롤백 여부 확인

##### 테스트 코드
- 중복되는 코드가 많으므로 메소드만 정리하였습니다.

```java
@Log4j2
@SpringBootTest
public class TransactionalTest {

    // 기타 다른 코드

    @Test
    @DisplayName("PARENT REQUIRED - CHILD NEVER")
    public void test_parentRequired_childNever() {
        try {
            Orders order = new Orders("123");
            orderService.createOrderWithRequiredChildNever(order);
        } catch (Exception e) {
            log.warn(e.getMessage(), e);
        } finally {
            log.info("PARENT REQUIRED - CHILD NEVER END");
        }
    }
}

@Component
@RequiredArgsConstructor
class DeliveryService {

    private final DeliveryRepository deliveryRepository;

    private boolean isOk() {
        return false;
    }

    // 기타 다른 코드

    @Transactional(propagation = Propagation.NEVER)
    public Delivery createDeliveryWithNever(Delivery delivery) {
        deliveryRepository.saveAndFlush(delivery);
        if (!isOk()) {
            throw new RuntimeException();
        }
        return delivery;
    }
}

@Component
@RequiredArgsConstructor
class OrderService {

    private final OrderRepository orderRepository;

    private final DeliveryService deliveryService;

    // 기타 다른 코드

    @Transactional(propagation = Propagation.REQUIRED)
    public Orders createOrderWithRequiredChildNever(Orders order) {
        orderRepository.saveAndFlush(order);
        deliveryService.createDeliveryWithNever(new Delivery(order.getId()));
        return order;
    }
}
```

##### 테스트 실행 결과 로그
- **`Creating new transaction with name`** 로그를 보면 OrderService.createOrderWithRequiredChildNever 메소드를 통해 트랜잭션이 생성됩니다. 
- **`Existing transaction found for transaction marked with propagation 'never'`**, IllegalTransactionStateException이 발생합니다.

```
2021-05-10 02:23:51.914 DEBUG 16928 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 02:23:51.915 DEBUG 16928 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1210315984<open>)]
2021-05-10 02:23:51.915 DEBUG 16928 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1210315984<open>)] after transaction
2021-05-10 02:23:51.918 DEBUG 16928 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.transcation.OrderService.createOrderWithRequiredChildNever]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2021-05-10 02:23:51.918 DEBUG 16928 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(502047593<open>)] for JPA transaction
2021-05-10 02:23:51.918 DEBUG 16928 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@2d0ce8a1]
2021-05-10 02:23:51.922 DEBUG 16928 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(502047593<open>)] for JPA transaction
2021-05-10 02:23:51.922 DEBUG 16928 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select orders0_.id as id1_1_0_ from orders orders0_ where orders0_.id=?
Hibernate: insert into orders (id) values (?)
2021-05-10 02:23:51.940 DEBUG 16928 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(502047593<open>)] for JPA transaction
2021-05-10 02:23:51.940 DEBUG 16928 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction rollback
2021-05-10 02:23:51.940 DEBUG 16928 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Rolling back JPA transaction on EntityManager [SessionImpl(502047593<open>)]
2021-05-10 02:23:51.954 DEBUG 16928 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(502047593<open>)] after transaction
2021-05-10 02:23:51.954  WARN 16928 --- [           main] b.i.a.transcation.TransactionalTest      : Existing transaction found for transaction marked with propagation 'never'

org.springframework.transaction.IllegalTransactionStateException: Existing transaction found for transaction marked with propagation 'never'
	at org.springframework.transaction.support.AbstractPlatformTransactionManager.handleExistingTransaction(AbstractPlatformTransactionManager.java:413) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.transaction.support.AbstractPlatformTransactionManager.getTransaction(AbstractPlatformTransactionManager.java:352) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.transaction.interceptor.TransactionAspectSupport.createTransactionIfNecessary(TransactionAspectSupport.java:572) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:360) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]

2021-05-10 02:23:51.954  INFO 16928 --- [           main] b.i.a.transcation.TransactionalTest      : PARENT REQUIRED - CHILD NEVER END
```

##### 데이터베이스 테이블 확인
- 자식 메소드는 수행되지 않았습니다.
- 부모 메소드는 자식 메소드가 던진 exception에 의해 롤백 처리됩니다.
- 별도의 이미지는 참조하지 않았습니다. 

### NESTED
현재 트랜잭션이 있으면 중첩 트랜잭션 내에서 실행하고, 그렇지 않으면 REQUIRED 처럼 동작합니다. 
중첩된 트랜잭션을 지원하는 WAS에서만 사용이 가능합니다. 
부모 메소드에서 시작한 트랜잭션이 있으면, 자식 메소드에서 중첩된 트랜잭션을 실행합니다. 
자식 메소드에서 commit 되기 전까지 부모 메소드에서는 자식 메소드에서 처리하는 내용이 보이지 않습니다. 
자식 메소드의 트랜잭션은 자체적으로 commit, rollback이 가능합니다. 

<p align="center"><img src="/images/transactional-propagation-type-16.jpg" width="80%"></p>
<center>이미지 출처, https://www.nextree.co.kr/p3180/</center><br>

#### 부모 REQUIRED - 자식 NESTED
- 부모 메소드에서 데이터 INSERT 후 FLUSH
- 자식 메소드 호출 및 데이터 INSERT 후 FLUSH
- 부모 메소드에서 수행한 내용이 보이는지 확인
- 자식 메소드 exception throw
- 부모 메소드에 catch 수행
- 롤백 여부 확인

##### 테스트 코드
- 중복되는 코드가 많으므로 메소드만 정리하였습니다.

```java
@Log4j2
@SpringBootTest
public class TransactionalTest {

    // 기타 다른 코드

    @Test
    @DisplayName("PARENT REQUIRED - CHILD NESTED")
    public void test_parentRequired_childNested() {
        try {
            Orders order = new Orders("123");
            orderService.createOrderWithRequiredChildNested(order);
        } catch (Exception e) {
            log.warn(e.getMessage(), e);
        } finally {
            log.info("PARENT REQUIRED - CHILD NESTED END");
        }
    }
}

@Component
@RequiredArgsConstructor
class DeliveryService {

    private final DeliveryRepository deliveryRepository;

    private boolean isOk() {
        return false;
    }

    // 기타 다른 코드

    @Transactional(propagation = Propagation.NESTED)
    public Delivery createDeliveryWithNested(Delivery delivery) {
        deliveryRepository.saveAndFlush(delivery);
        if (!isOk()) {
            throw new RuntimeException();
        }
        return delivery;
    }
}

@Component
@RequiredArgsConstructor
class OrderService {

    private final OrderRepository orderRepository;

    private final DeliveryService deliveryService;

    // 기타 다른 코드

    @Transactional(propagation = Propagation.REQUIRED)
    public Orders createOrderWithRequiredChildNested(Orders order) {
        orderRepository.saveAndFlush(order);
        try {
            deliveryService.createDeliveryWithNested(new Delivery(order.getId()));
        } catch (Exception e) {
            log.warn(e.getMessage(), e);
        }
        return order;
    }
}
```

##### 테스트 실행 결과 로그
- **`Creating new transaction with name`** 로그를 보면 OrderService.createOrderWithRequiredChildNested 메소드를 통해 트랜잭션이 생성됩니다. 
- **`Creating nested transaction with name`** 로그를 보면 DeliveryService.createDeliveryWithNested 메소드로 중첩된 트랜잭션을 생성하려고 합니다.
- **`JpaDialect does not support savepoints - check your JPA provider's capabilities`**, NestedTransactionNotSupportedException이 발생합니다. 
- **`JpaDialect does not support savepoints`** 로그를 통해 savepoint 기능을 수행하려는 모습이 보이지만 지원되지 않는 WAS이므로 exception이 발생합니다. 

```
2021-05-10 02:30:12.044 DEBUG 18720 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 02:30:12.044 DEBUG 18720 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(552085610<open>)]
2021-05-10 02:30:12.044 DEBUG 18720 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(552085610<open>)] after transaction
2021-05-10 02:30:12.044 DEBUG 18720 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.transcation.OrderService.createOrderWithRequiredChildNested]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2021-05-10 02:30:12.044 DEBUG 18720 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(747909318<open>)] for JPA transaction
2021-05-10 02:30:12.044 DEBUG 18720 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@66978c15]
2021-05-10 02:30:12.052 DEBUG 18720 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(747909318<open>)] for JPA transaction
2021-05-10 02:30:12.052 DEBUG 18720 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select orders0_.id as id1_1_0_ from orders orders0_ where orders0_.id=?
Hibernate: insert into orders (id) values (?)
2021-05-10 02:30:12.074 DEBUG 18720 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(747909318<open>)] for JPA transaction
2021-05-10 02:30:12.074 DEBUG 18720 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating nested transaction with name [blog.in.action.transcation.DeliveryService.createDeliveryWithNested]
2021-05-10 02:30:12.082  WARN 18720 --- [           main] blog.in.action.transcation.OrderService  : JpaDialect does not support savepoints - check your JPA provider's capabilities

org.springframework.transaction.NestedTransactionNotSupportedException: JpaDialect does not support savepoints - check your JPA provider's capabilities
	at org.springframework.orm.jpa.JpaTransactionManager$JpaTransactionObject.getSavepointManager(JpaTransactionManager.java:734) ~[spring-orm-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.orm.jpa.JpaTransactionManager$JpaTransactionObject.createSavepoint(JpaTransactionManager.java:713) ~[spring-orm-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.transaction.support.AbstractTransactionStatus.createAndHoldSavepoint(AbstractTransactionStatus.java:140) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.transaction.support.AbstractPlatformTransactionManager.handleExistingTransaction(AbstractPlatformTransactionManager.java:457) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.transaction.support.AbstractPlatformTransactionManager.getTransaction(AbstractPlatformTransactionManager.java:352) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.transaction.interceptor.TransactionAspectSupport.createTransactionIfNecessary(TransactionAspectSupport.java:572) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]
	at org.springframework.transaction.interceptor.TransactionAspectSupport.invokeWithinTransaction(TransactionAspectSupport.java:360) ~[spring-tx-5.2.4.RELEASE.jar:5.2.4.RELEASE]

2021-05-10 02:30:12.084 DEBUG 18720 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2021-05-10 02:30:12.084 DEBUG 18720 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(747909318<open>)]
2021-05-10 02:30:12.087 DEBUG 18720 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(747909318<open>)] after transaction
2021-05-10 02:30:12.087  INFO 18720 --- [           main] b.i.a.transcation.TransactionalTest      : PARENT REQUIRED - CHILD NESTED END
```

##### 데이터베이스 테이블 확인
- 자식 메소드는 기능이 지원되지 않는 WAS에 의해 수행되지 않았습니다.
- 부모 메소드에서 catch를 수행하였기에 부모 메소드는 롤백되지 않았습니다. 
- 이는 동일 트랜잭션으로 처리하지 않았다는 것을 의미합니다. 
- 동일한 트랜잭션으로 처리되는 **`PARENT REQUIRED - CHILD REQUIRED`** 테스트와는 대조적입니다. 
- 별도의 이미지는 참조하지 않았습니다. 

## OPINION
테스트 코드와 개념을 정리하는데 상당한 시간이 소요되었습니다. 
그래도 포스트를 작성하고 나니 기분은 좋습니다. 
대부분 디폴트인 **`REQUIRED`** 만으로도 충분하지만, 기능에 대해 정확하게 알고 사용하는 것이 개발자의 필수 덕목이라 생각합니다. 

테스트 코드는 [blog-in-action 저장소][github-link]에서 확인하실 수 있습니다.

#### REFERENCE
- <https://www.nextree.co.kr/p3180/>
- <https://woowabros.github.io/experience/2019/01/29/exception-in-transaction.html>
- <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/Propagation.html>
- <https://stackoverflow.com/questions/23132822/what-is-the-difference-between-defining-transactional-on-class-vs-method>

[transaction-acid-link]: https://junhyunny.github.io/information/transcation-acid/
[github-link]: https://github.com/Junhyunny/blog-in-action/tree/65859757f696724513ce017beef9bef33e53f5ef