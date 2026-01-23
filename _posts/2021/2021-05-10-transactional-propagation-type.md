---
title: "Propagation in @Transactional Annotation"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-08-29T01:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [트랜잭션(transaction) ACID][transaction-acid-link]

## 0. 들어가면서

데이터베이스 트랜잭션은 기본적으로 원자성(atomic)을 만족해야합니다. 

> 트랜잭션의 작업이 부분적으로 실행되거나 중단되지 않는 것을 보장합니다.<br/>
> `All or Noting` 개념으로서 작업 단위의 일부분만 실행하지 않는다는 것을 의미합니다.

스프링(spring) 프레임워크는 `@Transactional` 애너테이션을 통해 트랜잭션 원자성을 보장합니다. 
`@Transactional` 애너테이션은 전파 타입(propagation type) 속성을 통해 메서드 단위 트랜잭션들의 연결과 끊음을 결정할 수 있습니다. 
이번 포스트를 통해 자세한 내용을 살펴보겠습니다. 

## 1. @Transactional Annotation

스프링 프레임워크는 관점 지향 프로그래밍(AOP, Aspect Oriented Programming)을 지원합니다. 
개발이 진행되면서 로깅, 보안, 트랜잭션 같은 부가적이지만 공통적으로 사용되는 기능들이 시스템 곳곳에 퍼지기 마련입니다. 
관점 지향 프로그래밍은 공통적인 기능을 모듈화하는 메커니즘입니다. 

스프링 프레임워크는 트랜잭션 관리를 `@Transactional` 애너테이션을 통해 제공합니다. 
메서드나 클래스 위에 `@Transactional` 애너테이션을 붙임으로써 복잡한 트랜잭션 처리가 AOP 기능에 의해 수행됩니다. 
개발자는 손쉽게 커밋(commit)이나 롤백(rollback) 처리를 구현할 수 있습니다. 

`@Transactional` 애너테이션의 기능은 스프링 컨텍스트에 빈(bean)으로 등록되어야지 정상적으로 동작합니다. 
생성자를 통해 만들어진 객체는 `@Transactional` 애너테이션이 붙었더라도 정상적인 트랜잭션 처리가 이뤄지지 않습니다. 

##### Call method with @Transactional when instance is bean

* `orderSerivce` 객체가 빈으로 등록되었고 `createOrder` 메서드 위에 @Transactional 애너테이션이 붙은 경우입니다.
* `createOrder` 메서드가 호출되면 실제 비즈니스 로직 전후에 트랜잭션 처리를 위한 AOP 기능이 호출됩니다.

<p align="center">
    <img src="/images/transactional-propagation-type-1.jpg" width="80%" class="image__border">
</p>

##### Call method with @Transactional when instance is not bean

* `orderSerivce` 객체를 생성자를 통해 만들었고 `createOrder` 메서드 위에 @Transactional 애너테이션이 붙은 경우입니다.
* `createOrder` 메서드가 호출되면 실제 비즈니스 로직이 바로 호출됩니다. 

<p align="center">
    <img src="/images/transactional-propagation-type-2.jpg" width="80%" class="image__border">
</p>

## 2. Propagation Type in @Transactional

트랜잭션 전파 타입은 트랜잭션을 어떻게 진행할지에 관련된 설정입니다. 
기존에 시작된 트랜잭션이 있는지 없는지 여부에 따라 동작 방식이 다릅니다. 

* REQUIRED
    * Support a current transaction, create a new one if none exists.
    * 현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 새로 만듭니다.
* SUPPORTS
    * Support a current transaction, execute non-transactionally if none exists.
    * 현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 트랜잭션을 만들지 않습니다. 
* MANDATORY
    * Support a current transaction, throw an exception if none exists.
    * 현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 exception을 던집니다.
* REQUIRES_NEW
    * Create a new transaction, and suspend the current transaction if one exists.
    * 새로운 트랜잭션을 만듭니다. 진행 중인 트랜잭션이 있다면 이를 일시 중단합니다.
* NOT_SUPPORTED
    * Execute non-transactionally, suspend the current transaction if one exists.
    * 트랜잭션 없이 수행합니다. 진행 중인 트랜잭션이 있다면 이를 일시 중단합니다.
* NEVER
    * Execute non-transactionally, throw an exception if a transaction exists.
    * 트랜잭션 없이 수행합니다. 진행 중인 트랜잭션이 있다면 exception을 던집니다.
* NESTED
    * Execute within a nested transaction if a current transaction exists, behave like {@code REQUIRED} otherwise.
    * 현재 트랜잭션이 있으면 중첩 트랜잭션 내에서 실행하고, 그렇지 않으면 REQUIRED 처럼 동작합니다.

### 2.1. Test Enviroment

간단한 테스트 코드를 통해 각 전파 타입 별 결과와 로그를 살펴보고 동작 방식을 이해해보겠습니다. 테스트에는 JpaRepository 인터페이스를 사용했습니다. 결과를 이해하려면 다음과 같은 배경 지식이 필요합니다. 

* JpaRepository 인터페이스 사용
    * 상위 인터페이스들에 @Transactional 애너테이션이 이미 적용되어 있습니다.
    * save, saveAndFlush 메서드는 `REQUIRED` 전파 타입이 적용됩니다. 
    * 진행 중인 트랜잭션이 없다면 save, saveAndFlush 메서드가 완료됨과 동시에 커밋됩니다.
    * 쓰기 지연 특징으로 인해 삽입(insert) 쿼리가 나중에 실행되므로 테스트에선 saveAndFlush 메서드를 사용합니다. 
* @DataJpaTest 애너테이션 사용
    * JPA 관련 컨텍스트만 사용하기 위해 @DataJpaTest 애너테이션을 사용하였습니다.
    * @DataJpaTest 애너테이션은 테스트 후 롤백을 위해 자동으로 @Transactional 애너테이션이 적용됩니다.
    * 커밋과 롤백에 대한 정확한 테스트를 위해 트랜잭션 전파 타입을 `NOT_SUPPORTED`으로 재정의합니다. 

상세한 로그 내용을 살펴보기 위해 `org.springframewor.orm.jpa` 패키지 관련 로그 레벨을 디버그(debug)로 지정합니다.

```yml
logging:
  level:
    org:
      springframework:
        orm:
          jpa: DEBUG
```

### 2.2. REQUIRED 

> 현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 새로 만듭니다. 

현재 트랜잭션은 유지되고 자식 트랜잭션까지 하나로 묶이기 때문에 자식 트랜잭션에서 예외(exception)가 발생하면 부모 트랜잭션까지 함께 롤백됩니다. 
현재 진행 중인 트랜잭션이 없다면 새로운 트랜잭션을 실행합니다.

<p align="center">
    <img src="/images/transactional-propagation-type-3.jpg" width="80%" class="image__border">
</p>
<center>https://www.nextree.co.kr/p3180/</center>

#### 2.2.1. ChildService Class

* 데이터를 저장하고 ChildException 예외를 던집니다.

```java
package blog.in.action.service;

import blog.in.action.domain.Child;
import blog.in.action.exception.ChildException;
import blog.in.action.repository.ChildRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChildService {

    private final ChildRepository repository;

    @Transactional
    public void createRequired(String id) {
        repository.saveAndFlush(new Child(id));
        throw new ChildException();
    }

    // ...
}
```

#### 2.2.2. ParentService Class

* 데이터를 저장하고 자식 서비스를 호출합니다.
* 자식 서비스에서 예외를 던지더라도 부모 서비스에서 예외 전파를 차단합니다.

```java
package blog.in.action.service;

import blog.in.action.domain.Parent;
import blog.in.action.exception.ChildException;
import blog.in.action.repository.ParentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParentService {

    private final ParentRepository repository;
    private final ChildService childService;

    void skipExceptionPropagation(Runnable runnable) {
        try {
            runnable.run();
        } catch (ChildException childException) {
            log.error("skip propagation exception");
        }
    }

    @Transactional
    public void createRequiredAndChildRequired(String id) {
        repository.saveAndFlush(new Parent(id));
        skipExceptionPropagation(() -> childService.createRequired(id));
    }

    public void createWithoutTransactionAndChildRequired(String id) {
        repository.saveAndFlush(new Parent(id));
        skipExceptionPropagation(() -> childService.createRequired(id));
    }

    // ...
}
```

#### 2.2.3. RequiredTests Class

* 부모와 자식이 모두 `REQUIRED` 전파 타입으로 지정한 경우
    * 부모에서부터 트랜잭션을 시작하였으므로 자식에서 예외가 발생하면 모든 트랜잭션이 롤백될 것을 예상합니다.
    * 부모와 자식은 하나의 트랜잭션으로 연결되어 있기 때문에 자식에서 예외가 발생했다면, 부모는 커밋 수행 중에 `UnexpectedRollbackException` 예외를 던지고 트랜잭션을 롤백합니다.
* 부모는 트랜잭션을 시작하지 않고, 자식은 `REQUIRED` 전파 타입으로 지정한 경우
    * 부모는 트랜잭션을 시작하지 않았으므로 saveAndFlush 메서드를 호출하면 JpaRepositry 인터페이스 트랜잭션에 의해 커밋됩니다. 
    * 자식에서 예외가 발생하면 자식 서비스의 트랜잭셔만 롤백될 것을 예상합니다.

```java
package blog.in.action.transcation;

import blog.in.action.domain.Child;
import blog.in.action.domain.Parent;
import blog.in.action.repository.ChildRepository;
import blog.in.action.repository.ParentRepository;
import blog.in.action.service.ChildService;
import blog.in.action.service.ParentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.UnexpectedRollbackException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@Import(value = {ParentService.class, ChildService.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public class RequiredTests {

    @Autowired
    ParentService parentService;
    @Autowired
    ParentRepository parentRepository;
    @Autowired
    ChildService childService;
    @Autowired
    ChildRepository childRepository;

    @Test
    void all_transaction_rollback_when_parent_and_child_are_required() {

        final String id = "required-id";


        assertThrows(UnexpectedRollbackException.class, () -> parentService.createRequiredAndChildRequired(id));


        Optional<Parent> parentResult = parentRepository.findById(id);
        Optional<Child> childResult = childRepository.findById(id);
        assertThat(parentResult.isPresent(), equalTo(false));
        assertThat(childResult.isPresent(), equalTo(false));
    }

    @Test
    void rollback_child_transaction_when_parent_without_transactional_and_child_is_required() {

        final String id = "required-id-without-parent-transaction";


        parentService.createWithoutTransactionAndChildRequired(id);


        Optional<Parent> parentResult = parentRepository.findById(id);
        Optional<Child> childResult = childRepository.findById(id);
        assertThat(parentResult.isPresent(), equalTo(true));
        assertThat(childResult.isPresent(), equalTo(false));
    }
}
```

##### Test Result

* 부모와 자식이 모두 `REQUIRED` 전파 타입으로 지정한 경우
    * 테스트는 정상적으로 통과합니다.
    * 부모 서비스 트랜잭션에서 생성된 `1127171622` 세션 객체를 통해 기존 트랜잭션을 이어가는 것을 확인할 수 있습니다.

```
2023-05-06 00:54:47.043 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.service.ParentService.createRequiredAndChildRequired]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2023-05-06 00:54:47.043 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1127171622<open>)] for JPA transaction
2023-05-06 00:54:47.048 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@72ec16f8]
2023-05-06 00:54:47.065 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1127171622<open>)] for JPA transaction
2023-05-06 00:54:47.065 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
Hibernate: insert into parent (id) values (?)
2023-05-06 00:54:47.111 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1127171622<open>)] for JPA transaction
2023-05-06 00:54:47.111 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
2023-05-06 00:54:47.119 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1127171622<open>)] for JPA transaction
2023-05-06 00:54:47.120 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select child0_.id as id1_0_0_ from child child0_ where child0_.id=?
Hibernate: insert into child (id) values (?)
2023-05-06 00:54:47.123 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating transaction failed - marking existing transaction as rollback-only
2023-05-06 00:54:47.123 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Setting JPA transaction on EntityManager [SessionImpl(1127171622<open>)] rollback-only
2023-05-06 00:54:47.123 ERROR 57819 --- [           main] blog.in.action.service.ParentService     : skip propagation exception
2023-05-06 00:54:47.123 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 00:54:47.123 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1127171622<open>)]
2023-05-06 00:54:47.125 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1127171622<open>)] after transaction
2023-05-06 00:54:47.126 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 00:54:47.127 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(956958624<open>)] for JPA transaction
2023-05-06 00:54:47.128 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@43ee1cf7]
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
2023-05-06 00:54:47.133 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 00:54:47.133 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(956958624<open>)]
2023-05-06 00:54:47.133 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(956958624<open>)] after transaction
2023-05-06 00:54:47.134 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 00:54:47.134 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(2114487283<open>)] for JPA transaction
2023-05-06 00:54:47.134 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@4ba1c1a2]
Hibernate: select child0_.id as id1_0_0_ from child child0_ where child0_.id=?
2023-05-06 00:54:47.136 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 00:54:47.136 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(2114487283<open>)]
2023-05-06 00:54:47.136 DEBUG 57819 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(2114487283<open>)] after transaction
```

* 부모는 트랜잭션을 시작하지 않고, 자식은 `REQUIRED` 전파 타입으로 지정한 경우
    * 테스트는 정상적으로 통과합니다.
    * 부모 서비스 트랜잭션에서 `480975330` 세션 객체, 자식 서비스 트랜잭션에서 `273401463` 세션 객체를 각각 따로 사용합니다.

```
2023-05-06 00:55:02.683 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.saveAndFlush]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2023-05-06 00:55:02.684 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(480975330<open>)] for JPA transaction
2023-05-06 00:55:02.688 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@424a152f]
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
Hibernate: insert into parent (id) values (?)
2023-05-06 00:55:02.732 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 00:55:02.733 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(480975330<open>)]
2023-05-06 00:55:02.734 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(480975330<open>)] after transaction
2023-05-06 00:55:02.735 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.service.ChildService.createRequired]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2023-05-06 00:55:02.735 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(273401463<open>)] for JPA transaction
2023-05-06 00:55:02.736 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@3dd591b9]
2023-05-06 00:55:02.743 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(273401463<open>)] for JPA transaction
2023-05-06 00:55:02.743 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select child0_.id as id1_0_0_ from child child0_ where child0_.id=?
Hibernate: insert into child (id) values (?)
2023-05-06 00:55:02.747 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction rollback
2023-05-06 00:55:02.747 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Rolling back JPA transaction on EntityManager [SessionImpl(273401463<open>)]
2023-05-06 00:55:02.749 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(273401463<open>)] after transaction
2023-05-06 00:55:02.749 ERROR 57834 --- [           main] blog.in.action.service.ParentService     : skip propagation exception
2023-05-06 00:55:02.751 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 00:55:02.752 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1460265227<open>)] for JPA transaction
2023-05-06 00:55:02.753 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@756200d1]
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
2023-05-06 00:55:02.760 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 00:55:02.760 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1460265227<open>)]
2023-05-06 00:55:02.760 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1460265227<open>)] after transaction
2023-05-06 00:55:02.761 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 00:55:02.761 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(159089828<open>)] for JPA transaction
2023-05-06 00:55:02.761 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@70bc3a9c]
Hibernate: select child0_.id as id1_0_0_ from child child0_ where child0_.id=?
2023-05-06 00:55:02.763 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 00:55:02.763 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(159089828<open>)]
2023-05-06 00:55:02.763 DEBUG 57834 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(159089828<open>)] after transaction
```

### 2.3. SUPPORTS

> 현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 트랜잭션을 만들지 않습니다. 

현재 트랜잭션이 존재한다면 `REQUIRED` 전파 타입과 동일하게 동작합니다. 
현재 진행 중인 트랜잭션이 없다면 새롭게 만들지 않습니다.

<p align="center">
    <img src="/images/transactional-propagation-type-4.jpg" width="80%" class="image__border">
</p>
<center>https://www.nextree.co.kr/p3180/</center>

#### 2.3.1. ChildService Class

* 데이터를 저장하고 ChildException 예외를 던집니다.

```java
package blog.in.action.service;

import blog.in.action.domain.Child;
import blog.in.action.exception.ChildException;
import blog.in.action.repository.ChildRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChildService {

    private final ChildRepository repository;

    @Transactional(propagation = Propagation.SUPPORTS)
    public void createSupports(String id) {
        repository.saveAndFlush(new Child(id));
        throw new ChildException();
    }

    // ...
}
```

#### 2.3.2. ParentService Class

* 데이터를 저장하고 자식 서비스를 호출합니다.
* 자식 서비스에서 예외를 던지더라도 부모 서비스에서 예외 전파를 차단합니다.

```java
package blog.in.action.service;

import blog.in.action.domain.Parent;
import blog.in.action.exception.ChildException;
import blog.in.action.repository.ParentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParentService {

    private final ParentRepository repository;
    private final ChildService childService;

    void skipExceptionPropagation(Runnable runnable) {
        try {
            runnable.run();
        } catch (ChildException childException) {
            log.error("skip propagation exception");
        }
    }

    @Transactional
    public void createRequiredAndChildSupports(String id) {
        repository.saveAndFlush(new Parent(id));
        skipExceptionPropagation(() -> childService.createSupports(id));
    }

    public void createWithoutTransactionAndChildSupports(String id) {
        repository.saveAndFlush(new Parent(id));
        skipExceptionPropagation(() -> childService.createSupports(id));
    }

    // ...
}
```

#### 2.3.3. SupportsTests Class

* 부모는 `REQUIRED`, 자식은 `SUPPORTS` 전파 타입으로 지정한 경우
    * 부모에서부터 트랜잭션을 시작하였으므로 자식에서 예외가 발생하면 모든 트랜잭션이 롤백될 것을 예상합니다.
    * 부모와 자식은 하나의 트랜잭션으로 연결되어 있기 때문에 자식에서 예외가 발생했다면, 부모는 커밋 수행 중에 `UnexpectedRollbackException` 예외를 던지고 트랜잭션을 롤백합니다.
* 부모는 트랜잭션을 시작하지 않고, 자식은 `SUPPORTS` 전파 타입으로 지정한 경우
    * 부모는 트랜잭션을 시작하지 않았으므로 saveAndFlush 메서드를 호출하면 JpaRepositry 인터페이스 트랜잭션에 의해 커밋됩니다. 
    * 자식 서비스는 트랜잭션을 새로 만들지 않습니다.
    * 자식 서비스에서 saveAndFlush 메서드 호출 후 예외를 던졌기 때문에 JpaRepositry 인터페이스 트랜잭션에 의해 데이터가 저장됩니다.

```java
package blog.in.action.transcation;

import blog.in.action.domain.Child;
import blog.in.action.domain.Parent;
import blog.in.action.repository.ChildRepository;
import blog.in.action.repository.ParentRepository;
import blog.in.action.service.ChildService;
import blog.in.action.service.ParentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.UnexpectedRollbackException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@Import(value = {ParentService.class, ChildService.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public class SupportsTests {

    @Autowired
    ParentService parentService;
    @Autowired
    ParentRepository parentRepository;
    @Autowired
    ChildService childService;
    @Autowired
    ChildRepository childRepository;

    @Test
    void all_transaction_rollback_when_parent_is_required_child_is_supports() {

        final String id = "supports-id";


        assertThrows(UnexpectedRollbackException.class, () -> parentService.createRequiredAndChildSupports(id));


        Optional<Parent> parentResult = parentRepository.findById(id);
        Optional<Child> childResult = childRepository.findById(id);
        assertThat(parentResult.isPresent(), equalTo(false));
        assertThat(childResult.isPresent(), equalTo(false));
    }

    @Test
    void all_transaction_commit_when_parent_without_transactional_and_child_is_supports() {

        final String id = "supports-id-without-parent-transaction";


        parentService.createWithoutTransactionAndChildSupports(id);


        Optional<Parent> parentResult = parentRepository.findById(id);
        Optional<Child> childResult = childRepository.findById(id);
        assertThat(parentResult.isPresent(), equalTo(true));
        assertThat(childResult.isPresent(), equalTo(true));
    }
}
```

##### Test Result

* 부모는 `REQUIRED`, 자식은 `SUPPORTS` 전파 타입으로 지정한 경우
    * 테스트는 정상적으로 통과합니다.
    * 부모 서비스 트랜잭션에서 생성된 `1127171622` 세션 객체를 통해 기존 트랜잭션을 이어가는 것을 확인할 수 있습니다.

```
2023-05-06 01:16:06.556 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.service.ParentService.createRequiredAndChildSupports]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2023-05-06 01:16:06.557 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1127171622<open>)] for JPA transaction
2023-05-06 01:16:06.561 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@72ec16f8]
2023-05-06 01:16:06.584 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1127171622<open>)] for JPA transaction
2023-05-06 01:16:06.584 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
Hibernate: insert into parent (id) values (?)
2023-05-06 01:16:06.639 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1127171622<open>)] for JPA transaction
2023-05-06 01:16:06.640 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
2023-05-06 01:16:06.648 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1127171622<open>)] for JPA transaction
2023-05-06 01:16:06.648 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select child0_.id as id1_0_0_ from child child0_ where child0_.id=?
Hibernate: insert into child (id) values (?)
2023-05-06 01:16:06.652 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating transaction failed - marking existing transaction as rollback-only
2023-05-06 01:16:06.652 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Setting JPA transaction on EntityManager [SessionImpl(1127171622<open>)] rollback-only
2023-05-06 01:16:06.653 ERROR 62816 --- [           main] blog.in.action.service.ParentService     : skip propagation exception
2023-05-06 01:16:06.653 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:16:06.653 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1127171622<open>)]
2023-05-06 01:16:06.655 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1127171622<open>)] after transaction
2023-05-06 01:16:06.657 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 01:16:06.658 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(956958624<open>)] for JPA transaction
2023-05-06 01:16:06.660 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@43ee1cf7]
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
2023-05-06 01:16:06.666 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:16:06.666 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(956958624<open>)]
2023-05-06 01:16:06.667 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(956958624<open>)] after transaction
2023-05-06 01:16:06.667 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 01:16:06.667 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(2114487283<open>)] for JPA transaction
2023-05-06 01:16:06.668 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@4ba1c1a2]
Hibernate: select child0_.id as id1_0_0_ from child child0_ where child0_.id=?
2023-05-06 01:16:06.669 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:16:06.670 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(2114487283<open>)]
2023-05-06 01:16:06.670 DEBUG 62816 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(2114487283<open>)] after transaction
```

* 부모는 트랜잭션을 시작하지 않고, 자식은 `SUPPORTS` 전파 타입으로 지정한 경우
    * 테스트는 정상적으로 통과합니다.
    * 부모 서비스 트랜잭션에서 `222122132` 세션 객체, 자식 서비스 트랜잭션에서 `684660636` 세션 객체를 각각 따로 사용합니다.

```
2023-05-06 01:16:37.345 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.saveAndFlush]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2023-05-06 01:16:37.345 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(222122132<open>)] for JPA transaction
2023-05-06 01:16:37.350 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@2792c28]
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
Hibernate: insert into parent (id) values (?)
2023-05-06 01:16:37.394 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:16:37.394 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(222122132<open>)]
2023-05-06 01:16:37.395 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(222122132<open>)] after transaction
2023-05-06 01:16:37.406 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.saveAndFlush]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2023-05-06 01:16:37.406 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(684660636<open>)] for JPA transaction
2023-05-06 01:16:37.406 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@4ce18cec]
Hibernate: select child0_.id as id1_0_0_ from child child0_ where child0_.id=?
Hibernate: insert into child (id) values (?)
2023-05-06 01:16:37.410 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:16:37.410 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(684660636<open>)]
2023-05-06 01:16:37.411 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(684660636<open>)] after transaction
2023-05-06 01:16:37.411 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Resuming suspended transaction after completion of inner transaction
2023-05-06 01:16:37.411 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Should roll back transaction but cannot - no transaction available
2023-05-06 01:16:37.411 ERROR 62925 --- [           main] blog.in.action.service.ParentService     : skip propagation exception
2023-05-06 01:16:37.414 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 01:16:37.414 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1460265227<open>)] for JPA transaction
2023-05-06 01:16:37.415 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@756200d1]
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
2023-05-06 01:16:37.424 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:16:37.424 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1460265227<open>)]
2023-05-06 01:16:37.425 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1460265227<open>)] after transaction
2023-05-06 01:16:37.425 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 01:16:37.425 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(159089828<open>)] for JPA transaction
2023-05-06 01:16:37.426 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@70bc3a9c]
Hibernate: select child0_.id as id1_0_0_ from child child0_ where child0_.id=?
2023-05-06 01:16:37.428 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:16:37.428 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(159089828<open>)]
2023-05-06 01:16:37.428 DEBUG 62925 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(159089828<open>)] after transaction
```


### 2.4. MANDATORY

> 현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 exception을 던집니다.

현재 트랜잭션이 존재한다면 `REQUIRED` 전파 타입과 동일하게 동작합니다. 
현재 진행 중인 트랜잭션이 없다면 예외를 던집니다. 

<p align="center">
    <img src="/images/transactional-propagation-type-5.jpg" width="80%" class="image__border">
</p>
<center>https://www.nextree.co.kr/p3180/</center>

#### 2.4.1. ChildService Class

* 데이터를 저장하고 별도의 예외는 던지지 않습니다.

```java
package blog.in.action.service;

import blog.in.action.domain.Child;
import blog.in.action.exception.ChildException;
import blog.in.action.repository.ChildRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChildService {

    private final ChildRepository repository;

    @Transactional(propagation = Propagation.MANDATORY)
    public void createMandatory(String id) {
        repository.saveAndFlush(new Child(id));
    }

    // ...
}
```

#### 2.4.2. ParentService Class

* 데이터를 저장하고 자식 서비스를 호출합니다.

```java
package blog.in.action.service;

import blog.in.action.domain.Parent;
import blog.in.action.exception.ChildException;
import blog.in.action.repository.ParentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParentService {

    private final ParentRepository repository;
    private final ChildService childService;

    public void createWithoutTransactionAndChildMandatory(String id) {
        repository.saveAndFlush(new Parent(id));
        childService.createMandatory(id);
    }

    // ...
}

```

#### 2.4.3. MandatoryTests Class

* 부모는 트랜잭션을 시작하지 않고, 자식은 `MANDATORY` 전파 타입으로 지정한 경우
    * `IllegalTransactionStateException` 예외를 던질 것으로 예상합니다.
    * 부모 서비스는 트랜잭션을 시작하지 않았으므로 JpaRepositry 인터페이스 트랜잭션에 의해 데이터가 저장됩니다.
    * 자식 서비스는 예외 발생으로 비즈니스 로직이 실행되지 못하면서 데이터가 저장되지 않습니다.

```java
package blog.in.action.transcation;

import blog.in.action.domain.Child;
import blog.in.action.domain.Parent;
import blog.in.action.repository.ChildRepository;
import blog.in.action.repository.ParentRepository;
import blog.in.action.service.ChildService;
import blog.in.action.service.ParentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@Import(value = {ParentService.class, ChildService.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public class MandatoryTests {

    @Autowired
    ParentService parentService;
    @Autowired
    ParentRepository parentRepository;
    @Autowired
    ChildService childService;
    @Autowired
    ChildRepository childRepository;

    @Test
    void throws_exception_when_parent_without_transaction_child_is_mandatory() {

        final String id = "mandatory-id";


        assertThrows(IllegalTransactionStateException.class, () -> parentService.createWithoutTransactionAndChildMandatory(id));


        Optional<Parent> parentResult = parentRepository.findById(id);
        Optional<Child> childResult = childRepository.findById(id);
        assertThat(parentResult.isPresent(), equalTo(true));
        assertThat(childResult.isPresent(), equalTo(false));
    }
}
```

##### Test Result

* 자식 서비스에서 조회하거나 데이터를 추가(insert)하는 쿼리가 실행되지 않습니다.

```
2023-05-06 01:29:03.555 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.saveAndFlush]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2023-05-06 01:29:03.556 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(222122132<open>)] for JPA transaction
2023-05-06 01:29:03.561 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@2792c28]
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
Hibernate: insert into parent (id) values (?)
2023-05-06 01:29:03.613 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:29:03.613 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(222122132<open>)]
2023-05-06 01:29:03.614 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(222122132<open>)] after transaction
2023-05-06 01:29:03.618 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 01:29:03.618 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1289850092<open>)] for JPA transaction
2023-05-06 01:29:03.620 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@51c008fd]
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
2023-05-06 01:29:03.630 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:29:03.630 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1289850092<open>)]
2023-05-06 01:29:03.630 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1289850092<open>)] after transaction
2023-05-06 01:29:03.631 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 01:29:03.631 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(207766759<open>)] for JPA transaction
2023-05-06 01:29:03.632 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@3292eff7]
Hibernate: select child0_.id as id1_0_0_ from child child0_ where child0_.id=?
2023-05-06 01:29:03.634 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:29:03.634 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(207766759<open>)]
2023-05-06 01:29:03.635 DEBUG 65818 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(207766759<open>)] after transaction
```

### 2.5. REQURIES_NEW

> 새로운 트랜잭션을 만듭니다. 진행 중인 트랜잭션이 있다면 이를 일시 중단합니다. 

기존에 진행 중인 트랜잭션이 있더라도 새로운 트랜잭션을 시작합니다. 

<p align="center">
    <img src="/images/transactional-propagation-type-6.jpg" width="80%" class="image__border">
</p>
<center>https://www.nextree.co.kr/p3180/</center>

#### 2.5.1. ChildService Class

* 데이터를 저장하고 ChildException 예외를 던집니다.

```java
package blog.in.action.service;

import blog.in.action.domain.Child;
import blog.in.action.exception.ChildException;
import blog.in.action.repository.ChildRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChildService {

    private final ChildRepository repository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createRequiresNew(String id) {
        repository.saveAndFlush(new Child(id));
        throw new ChildException();
    }

    // ...
}
```

#### 2.5.2. ParentService Class

* 데이터를 저장하고 자식 서비스를 호출합니다.
* 자식 서비스에서 예외를 던지더라도 부모 서비스에서 예외 전파를 차단합니다.

```java
package blog.in.action.service;

import blog.in.action.domain.Parent;
import blog.in.action.exception.ChildException;
import blog.in.action.repository.ParentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParentService {

    private final ParentRepository repository;
    private final ChildService childService;

    void skipExceptionPropagation(Runnable runnable) {
        try {
            runnable.run();
        } catch (ChildException childException) {
            log.error("skip propagation exception");
        }
    }

    @Transactional
    public void createRequiredAndChildRequiresNew(String id) {
        repository.saveAndFlush(new Parent(id));
        skipExceptionPropagation(() -> childService.createRequiresNew(id));
    }

    // ...
}
```

#### 2.5.3. RequiresNewTests Class

* 부모는 `REQUIRED`, 자식은 `REQURIES_NEW` 전파 타입으로 지정한 경우
    * 부모 서비스는 데이터가 저장될 것을 예상합니다.
    * 자식 서비스는 데이터가 롤백되는 것을 예상합니다.
* 부모 서비스의 비즈니스 로직은 동일하지만, 부모, 자식 모두 `REQUIRED` 전파 타입으로 지정한 경우와 결과가 사뭇 다릅니다.
    * `UnexpectedRollbackException` 예외가 발생하지 않습니다.
    * 부모 트랜잭션은 정상적으로 데이터가 저장됩니다.

```java
package blog.in.action.transcation;

import blog.in.action.domain.Child;
import blog.in.action.domain.Parent;
import blog.in.action.repository.ChildRepository;
import blog.in.action.repository.ParentRepository;
import blog.in.action.service.ChildService;
import blog.in.action.service.ParentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@DataJpaTest
@Import(value = {ParentService.class, ChildService.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public class RequiresNewTests {

    @Autowired
    ParentService parentService;
    @Autowired
    ParentRepository parentRepository;
    @Autowired
    ChildService childService;
    @Autowired
    ChildRepository childRepository;

    @Test
    void rollback_only_child_transaction_when_parent_is_required_and_child_is_requires_new() {

        final String id = "requires-new-id";


        parentService.createRequiredAndChildRequiresNew(id);


        Optional<Parent> parentResult = parentRepository.findById(id);
        Optional<Child> childResult = childRepository.findById(id);
        assertThat(parentResult.isPresent(), equalTo(true));
        assertThat(childResult.isPresent(), equalTo(false));
    }
}
```

##### Test Result

* 테스트는 정상적으로 통과합니다.
* 부모 서비스 트랜잭션에서 `1254589807` 세션 객체, 자식 서비스 트랜잭션에서 `456897159` 세션 객체를 각각 따로 사용합니다.

```
2023-05-06 01:41:58.701 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.service.ParentService.createRequiredAndChildRequiresNew]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2023-05-06 01:41:58.701 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1254589807<open>)] for JPA transaction
2023-05-06 01:41:58.705 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@7d5a0b14]
2023-05-06 01:41:58.724 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1254589807<open>)] for JPA transaction
2023-05-06 01:41:58.725 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
Hibernate: insert into parent (id) values (?)
2023-05-06 01:41:58.772 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1254589807<open>)] for JPA transaction
2023-05-06 01:41:58.772 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Suspending current transaction, creating new transaction with name [blog.in.action.service.ChildService.createRequiresNew]
2023-05-06 01:41:58.773 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(456897159<open>)] for JPA transaction
2023-05-06 01:41:58.773 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@188bf4d8]
2023-05-06 01:41:58.781 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(456897159<open>)] for JPA transaction
2023-05-06 01:41:58.781 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select child0_.id as id1_0_0_ from child child0_ where child0_.id=?
Hibernate: insert into child (id) values (?)
2023-05-06 01:41:58.785 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction rollback
2023-05-06 01:41:58.785 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Rolling back JPA transaction on EntityManager [SessionImpl(456897159<open>)]
2023-05-06 01:41:58.788 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(456897159<open>)] after transaction
2023-05-06 01:41:58.788 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Resuming suspended transaction after completion of inner transaction
2023-05-06 01:41:58.788 ERROR 71028 --- [           main] blog.in.action.service.ParentService     : skip propagation exception
2023-05-06 01:41:58.788 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:41:58.788 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1254589807<open>)]
2023-05-06 01:41:58.789 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1254589807<open>)] after transaction
2023-05-06 01:41:58.791 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 01:41:58.792 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1313602972<open>)] for JPA transaction
2023-05-06 01:41:58.793 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@4a29fe2e]
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
2023-05-06 01:41:58.804 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:41:58.804 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1313602972<open>)]
2023-05-06 01:41:58.804 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1313602972<open>)] after transaction
2023-05-06 01:41:58.805 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 01:41:58.806 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(2046959433<open>)] for JPA transaction
2023-05-06 01:41:58.806 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@626df173]
Hibernate: select child0_.id as id1_0_0_ from child child0_ where child0_.id=?
2023-05-06 01:41:58.808 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:41:58.808 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(2046959433<open>)]
2023-05-06 01:41:58.808 DEBUG 71028 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(2046959433<open>)] after transaction
```

### 2.6. NOT_SUPPORTED

> 트랜잭션 없이 수행합니다. 진행 중인 트랜잭션이 있다면 이를 일시 중단합니다. 

<p align="center">
    <img src="/images/transactional-propagation-type-7.jpg" width="80%" class="image__border">
</p>
<center>https://www.nextree.co.kr/p3180/</center>

#### 2.6.1. ChildService Class

* 데이터를 저장하고, ChildException 예외를 던집니다.

```java
package blog.in.action.service;

import blog.in.action.domain.Child;
import blog.in.action.exception.ChildException;
import blog.in.action.repository.ChildRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChildService {

    private final ChildRepository repository;

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void createNotSupported(String id) {
        repository.saveAndFlush(new Child(id));
        throw new ChildException();
    }

    // ...
}
```

#### 2.6.2. ParentService Class

* 데이터를 저장하고 자식 서비스를 호출합니다.
* 자식 서비스에서 예외를 던지더라도 부모 서비스에서 예외 전파를 차단합니다.

```java
package blog.in.action.service;

import blog.in.action.domain.Parent;
import blog.in.action.exception.ChildException;
import blog.in.action.repository.ParentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParentService {

    private final ParentRepository repository;
    private final ChildService childService;

    void skipExceptionPropagation(Runnable runnable) {
        try {
            runnable.run();
        } catch (ChildException childException) {
            log.error("skip propagation exception");
        }
    }

    @Transactional
    public void createRequiredAndChildNotSupported(String id) {
        repository.saveAndFlush(new Parent(id));
        skipExceptionPropagation(() -> childService.createNotSupported(id));
    }

    // ...
}
```

#### 2.6.3. NotSupportedTests Class

* 부모는 `REQUIRED`, 자식은 `NOT_SUPPORTED` 전파 타입으로 지정한 경우
    * 자식 서비스는 트랜잭션을 이어나가지 않습니다.
    * 자식 서비스에서 saveAndFlush 메서드 호출 후 예외를 던졌기 때문에 JpaRepositry 인터페이스 트랜잭션에 의해 데이터가 저장됩니다.
    * 자식 서비스에서 트랜잭션을 이어나가지 않은 상태에서 예외를 던졌기 때문에 부모 서비스가 예외를 상위로 던지지 않는다면 트랜잭션은 정상적으로 커밋됩니다.

```java
package blog.in.action.transcation;

import blog.in.action.domain.Child;
import blog.in.action.domain.Parent;
import blog.in.action.repository.ChildRepository;
import blog.in.action.repository.ParentRepository;
import blog.in.action.service.ChildService;
import blog.in.action.service.ParentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@DataJpaTest
@Import(value = {ParentService.class, ChildService.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public class NotSupportedTests {

    @Autowired
    ParentService parentService;
    @Autowired
    ParentRepository parentRepository;
    @Autowired
    ChildService childService;
    @Autowired
    ChildRepository childRepository;

    @Test
    void all_transaction_commit_when_parent_is_required_and_child_is_not_supported() {

        final String id = "not-supported-id";


        parentService.createRequiredAndChildNotSupported(id);


        Optional<Parent> parentResult = parentRepository.findById(id);
        Optional<Child> childResult = childRepository.findById(id);
        assertThat(parentResult.isPresent(), equalTo(true));
        assertThat(childResult.isPresent(), equalTo(true));
    }
}
```

##### Test Result

* `Suspending current transaction` 로그를 통해 `308998656` 세션 객체로 진행되던 트랜잭션은 멈췄음을 알 수 있습니다. 
* `Resuming suspended transaction after completion of inner transaction` 로그를 통해 트랜잭션이 다시 시작됨을 알 수 있습니다.

```
2023-05-06 01:57:22.950 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.service.ParentService.createRequiredAndChildNotSupported]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2023-05-06 01:57:22.950 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(308998656<open>)] for JPA transaction
2023-05-06 01:57:22.954 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@1ba7db2a]
2023-05-06 01:57:22.976 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(308998656<open>)] for JPA transaction
2023-05-06 01:57:22.977 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
Hibernate: insert into parent (id) values (?)
2023-05-06 01:57:23.024 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(308998656<open>)] for JPA transaction
2023-05-06 01:57:23.024 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Suspending current transaction
2023-05-06 01:57:23.032 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.saveAndFlush]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2023-05-06 01:57:23.032 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1650415378<open>)] for JPA transaction
2023-05-06 01:57:23.033 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@6528d339]
Hibernate: select child0_.id as id1_0_0_ from child child0_ where child0_.id=?
Hibernate: insert into child (id) values (?)
2023-05-06 01:57:23.037 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:57:23.037 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1650415378<open>)]
2023-05-06 01:57:23.038 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1650415378<open>)] after transaction
2023-05-06 01:57:23.038 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Resuming suspended transaction after completion of inner transaction
2023-05-06 01:57:23.038 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Should roll back transaction but cannot - no transaction available
2023-05-06 01:57:23.038 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Resuming suspended transaction after completion of inner transaction
2023-05-06 01:57:23.038 ERROR 73753 --- [           main] blog.in.action.service.ParentService     : skip propagation exception
2023-05-06 01:57:23.038 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:57:23.038 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(308998656<open>)]
2023-05-06 01:57:23.039 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(308998656<open>)] after transaction
2023-05-06 01:57:23.041 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 01:57:23.041 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(332750956<open>)] for JPA transaction
2023-05-06 01:57:23.042 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@4af84a76]
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
2023-05-06 01:57:23.050 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:57:23.050 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(332750956<open>)]
2023-05-06 01:57:23.051 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(332750956<open>)] after transaction
2023-05-06 01:57:23.051 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 01:57:23.051 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1836406440<open>)] for JPA transaction
2023-05-06 01:57:23.052 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@7e0883f3]
Hibernate: select child0_.id as id1_0_0_ from child child0_ where child0_.id=?
2023-05-06 01:57:23.054 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 01:57:23.054 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1836406440<open>)]
2023-05-06 01:57:23.054 DEBUG 73753 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1836406440<open>)] after transaction
```

### 2.7. NEVER

> 부모 메서드에서 트랜잭션 시작했다면 자식 메서드에서 excepton이 발생합니다.

<p align="center">
    <img src="/images/transactional-propagation-type-8.jpg" width="80%" class="image__border">
</p>
<center>https://www.nextree.co.kr/p3180/</center>

#### 2.7.1. ChildService Class

* 데이터를 저장하고 별도의 예외는 던지지 않습니다.

```java
package blog.in.action.service;

import blog.in.action.domain.Child;
import blog.in.action.exception.ChildException;
import blog.in.action.repository.ChildRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChildService {

    private final ChildRepository repository;

    @Transactional(propagation = Propagation.NEVER)
    public void createNever(String id) {
        repository.saveAndFlush(new Child(id));
    }

    // ...
}
```

#### 2.7.2. ParentService Class

* 데이터를 저장하고 자식 서비스를 호출합니다.

```java
package blog.in.action.service;

import blog.in.action.domain.Parent;
import blog.in.action.exception.ChildException;
import blog.in.action.repository.ParentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParentService {

    private final ParentRepository repository;
    private final ChildService childService;

    @Transactional
    public void createRequiredAndChildNever(String id) {
        repository.saveAndFlush(new Parent(id));
        childService.createNever(id);
    }

    // ...
}
```

#### 2.7.3. NeverTests Class

* 부모는 `REQUIRED`, 자식은 `NEVER` 전파 타입으로 지정한 경우
    * `IllegalTransactionStateException` 예외를 던질 것으로 예상합니다.
    * 부모 서비스는 정상적으로 데이터가 저장됩니다.
    * 자식 서비스는 예외 발생으로 비즈니스 로직이 실행되지 못하면서 데이터가 저장되지 않습니다.

```java
package blog.in.action.transcation;

import blog.in.action.domain.Child;
import blog.in.action.domain.Parent;
import blog.in.action.repository.ChildRepository;
import blog.in.action.repository.ParentRepository;
import blog.in.action.service.ChildService;
import blog.in.action.service.ParentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@Import(value = {ParentService.class, ChildService.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public class NeverTests {

    @Autowired
    ParentService parentService;
    @Autowired
    ParentRepository parentRepository;
    @Autowired
    ChildService childService;
    @Autowired
    ChildRepository childRepository;

    @Test
    void throws_exception_when_parent_is_required_child_is_never() {

        final String id = "never-id";


        assertThrows(IllegalTransactionStateException.class, () -> parentService.createRequiredAndChildNever(id));


        Optional<Parent> parentResult = parentRepository.findById(id);
        Optional<Child> childResult = childRepository.findById(id);
        assertThat(parentResult.isPresent(), equalTo(false));
        assertThat(childResult.isPresent(), equalTo(false));
    }
}
```

##### Test Result

* 자식 서비스에서 조회하거나 데이터를 추가(insert)하는 쿼리가 실행되지 않습니다.

```
2023-05-06 02:05:19.841 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.service.ParentService.createRequiredAndChildNever]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2023-05-06 02:05:19.841 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1843272693<open>)] for JPA transaction
2023-05-06 02:05:19.846 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@3245efdb]
2023-05-06 02:05:19.865 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1843272693<open>)] for JPA transaction
2023-05-06 02:05:19.865 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
Hibernate: insert into parent (id) values (?)
2023-05-06 02:05:19.912 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1843272693<open>)] for JPA transaction
2023-05-06 02:05:19.913 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction rollback
2023-05-06 02:05:19.913 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Rolling back JPA transaction on EntityManager [SessionImpl(1843272693<open>)]
2023-05-06 02:05:19.915 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1843272693<open>)] after transaction
2023-05-06 02:05:19.918 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 02:05:19.919 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1914077784<open>)] for JPA transaction
2023-05-06 02:05:19.920 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@6d7bb5cc]
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
2023-05-06 02:05:19.926 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 02:05:19.926 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1914077784<open>)]
2023-05-06 02:05:19.926 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1914077784<open>)] after transaction
2023-05-06 02:05:19.927 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 02:05:19.927 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(474324008<open>)] for JPA transaction
2023-05-06 02:05:19.928 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@4a3509b0]
Hibernate: select child0_.id as id1_0_0_ from child child0_ where child0_.id=?
2023-05-06 02:05:19.930 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 02:05:19.930 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(474324008<open>)]
2023-05-06 02:05:19.931 DEBUG 75939 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(474324008<open>)] after transaction
```

### 2.8. NESTED

> 현재 트랜잭션이 있으면 중첩 트랜잭션 내에서 실행하고, 그렇지 않으면 REQUIRED 처럼 동작합니다. 

중첩된 트랜잭션을 지원하는 미들웨어(middleware)에서만 사용 가능하다고 합니다. 
이미 진행 중인 트랜잭션이 있으면 이 트랜잭션은 유지하면서 새로운 트랜잭션을 시작합니다. 
자식 트랜잭션에서 커밋하기 전까지 처리 중인 내용이 부모 트랜잭션에서 보이지 않습니다. 
자식 트랜잭션은 자체적으로 커밋과 롤백이 가능합니다.

<p align="center">
    <img src="/images/transactional-propagation-type-9.jpg" width="80%" class="image__border">
</p>
<center>https://www.nextree.co.kr/p3180/</center>

#### 2.8.1. NestedTests Class

* 중첩 트랜잭션이 지원 안되는 관계로 부모, 자식 사이에 중첩된 트랜잭션으로 인해 발생하는 현상들은 이번 포스트에서 확인하지 못 했습니다. 
* 부모는 `REQUIRED`, 자식은 `NESTED` 전파 타입으로 지정한 경우
    * `NestedTransactionNotSupportedException` 예외가 발생합니다.

```java
package blog.in.action.transcation;

import blog.in.action.domain.Child;
import blog.in.action.domain.Parent;
import blog.in.action.repository.ChildRepository;
import blog.in.action.repository.ParentRepository;
import blog.in.action.service.ChildService;
import blog.in.action.service.ParentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.NestedTransactionNotSupportedException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@Import(value = {ParentService.class, ChildService.class})
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public class NestedTests {

    @Autowired
    ParentService parentService;
    @Autowired
    ParentRepository parentRepository;
    @Autowired
    ChildService childService;
    @Autowired
    ChildRepository childRepository;

    @Test
    void throws_exception_when_parent_is_required_child_is_nested() {

        final String id = "nested-id";


        assertThrows(NestedTransactionNotSupportedException.class, () -> parentService.createRequiredAndChildNested(id));


        Optional<Parent> parentResult = parentRepository.findById(id);
        Optional<Child> childResult = childRepository.findById(id);
        assertThat(parentResult.isPresent(), equalTo(false));
        assertThat(childResult.isPresent(), equalTo(false));
    }
}
```

##### Test Result

* 자식 서비스에서 조회하거나 데이터를 추가(insert)하는 쿼리가 실행되지 않습니다.

```
2023-05-06 02:13:52.334 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [blog.in.action.service.ParentService.createRequiredAndChildNested]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT
2023-05-06 02:13:52.334 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1263973655<open>)] for JPA transaction
2023-05-06 02:13:52.338 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@2f0e7fa8]
2023-05-06 02:13:52.356 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1263973655<open>)] for JPA transaction
2023-05-06 02:13:52.356 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Participating in existing transaction
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
Hibernate: insert into parent (id) values (?)
2023-05-06 02:13:52.402 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Found thread-bound EntityManager [SessionImpl(1263973655<open>)] for JPA transaction
2023-05-06 02:13:52.402 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating nested transaction with name [blog.in.action.service.ChildService.createNested]
2023-05-06 02:13:52.402 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction rollback
2023-05-06 02:13:52.403 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Rolling back JPA transaction on EntityManager [SessionImpl(1263973655<open>)]
2023-05-06 02:13:52.406 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1263973655<open>)] after transaction
2023-05-06 02:13:52.409 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 02:13:52.410 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1257785974<open>)] for JPA transaction
2023-05-06 02:13:52.411 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@756200d1]
Hibernate: select parent0_.id as id1_1_0_ from parent parent0_ where parent0_.id=?
2023-05-06 02:13:52.417 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 02:13:52.417 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1257785974<open>)]
2023-05-06 02:13:52.417 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1257785974<open>)] after transaction
2023-05-06 02:13:52.418 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Creating new transaction with name [org.springframework.data.jpa.repository.support.SimpleJpaRepository.findById]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly
2023-05-06 02:13:52.418 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Opened new EntityManager [SessionImpl(1878900463<open>)] for JPA transaction
2023-05-06 02:13:52.419 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Exposing JPA transaction as JDBC [org.springframework.orm.jpa.vendor.HibernateJpaDialect$HibernateConnectionHandle@3d7314b3]
Hibernate: select child0_.id as id1_0_0_ from child child0_ where child0_.id=?
2023-05-06 02:13:52.421 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Initiating transaction commit
2023-05-06 02:13:52.421 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Committing JPA transaction on EntityManager [SessionImpl(1878900463<open>)]
2023-05-06 02:13:52.421 DEBUG 78351 --- [           main] o.s.orm.jpa.JpaTransactionManager        : Closing JPA EntityManager [SessionImpl(1878900463<open>)] after transaction
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-05-10-transactional-propagation-type>

#### RECOMMEND NEXT POSTS

* [@Transactional 애너테이션과 UnexpectedRollbackException 발생][unexpected-rollback-exception-link]

#### REFERENCE

* <https://www.nextree.co.kr/p3180/>
* <https://woowabros.github.io/experience/2019/01/29/exception-in-transaction.html>
* <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/Propagation.html>
* <https://stackoverflow.com/questions/23132822/what-is-the-difference-between-defining-transactional-on-class-vs-method>

[transaction-acid-link]: https://junhyunny.github.io/information/database/acid/transaction/transcation-acid/
[unexpected-rollback-exception-link]: https://junhyunny.github.io/spring-boot/jpa/exception/unexpected-rollback-exception/