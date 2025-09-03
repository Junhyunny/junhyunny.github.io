---
title: "TransientPropertyValueException by @Version Annotation"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-09-04T03:30:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [영속성 컨텍스트(persistent context)와 엔티티(entity) 생명주기][jpa-persistence-context-link]
* [JPA 낙관적 락(optimistic lock)][jpa-optimistic-lock-link]

## 0. 들어가면서

동시성 문제를 해결하기 위해 낙관적인 락(optimistic lock) 방식으로 구현한 코드에서 문제가 발생했습니다. 
JPA 구현체가 엔티티(entity)를 영속성 컨텍스트에 저장하고 인스턴스를 반환하는 과정에서 몇 가지 조건들에 의해 의도와 다르게 동작하면서 예외가 발생했습니다. 

## 1. Problem Context

문제가 발생한 코드와 상황을 최대한 유사하게 재현하였습니다. 

### 1.1. ParentEntity Class

* 낙관적 락을 위해 versionNo 필드를 추가합니다.
    * 타입은 Long 래퍼(wrapper) 클래스를 사용합니다.
    * 낙관적 락이 동작하도록 @Version 애너테이션을 추가합니다.
    * 기본 값을 0으로 설정합니다.

```java
package blog.in.action.domain;

import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
public class ParentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private String state;
    @Version
    private Long versionNo = 0L;

    public ParentEntity() {
        state = "CREATED";
    }
}
```

### 1.2. ChildEntity Class

* 부모 객체를 일대일 관계로써 참조하고 있습니다.

```java
package blog.in.action.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor(staticName = "create")
@Entity
public class ChildEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private String state;
    @OneToOne
    private ParentEntity parentEntity;

    public void update() {
        state = "UPDATED";
    }
}
```

### 1.3. Run Test

* @Transactional(propagation = Propagation.NOT_SUPPORTED)
    * @DataJpaTest 애너테이션에 적용된 트랜잭션으로부터 테스트 로직의 트랜잭션을 분리하기 위해 추가합니다.
* 부모 엔티티를 저장합니다.
* 자식 엔티티에 전달하여 둘 사이의 관계를 연결합니다.
* 자식 엔티티의 상태를 변경합니다.
* 자식 엔티티를 저장합니다.
    * InvalidDataAccessApiUsageException 예외가 발생합니다.
    * 원인은 TransientPropertyValueException 예외입니다.
* 부모 엔티티의 아이디 값이 널(null) 입니다.

```java
package blog.in.action;

import blog.in.action.domain.ChildEntity;
import blog.in.action.domain.ParentEntity;
import blog.in.action.repository.ChildRepository;
import blog.in.action.repository.ParentRepository;
import org.hibernate.TransientPropertyValueException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(
        properties = {"spring.jpa.hibernate.ddl-auto=create-drop"}
)
public class ActionInBlogTest {

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private ChildRepository childRepository;

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    @Test
    void zeroDefaultValueForVersionNo_throwTransientPropertyValueException() {

        var parentEntity = new ParentEntity();
        parentRepository.save(parentEntity);


        var childEntity = ChildEntity.create(null, "CREATED", parentEntity);
        childEntity.update();


        var throwable = assertThrows(InvalidDataAccessApiUsageException.class, () -> childRepository.save(childEntity));
        assertInstanceOf(TransientPropertyValueException.class, throwable.getRootCause());
        assertNull(parentEntity.getId());
    }
}
```

##### Test Result

* 자식 엔티티에 대한 insert 쿼리가 수행되지 않습니다.

```
Hibernate: select next value for parent_entity_seq
Hibernate: insert into parent_entity (state,version_no,id) values (?,?,?)
Hibernate: select next value for child_entity_seq
```

## 2. Problem Analysis

엔티티에 필드를 하나 추가하면서 정상적으로 동작하던 비즈니스 로직들에서 예외가 발생하기 시작했습니다. 
원인을 살펴보기 전에 엔티티의 라이프사이클(lifecycle)에 대해 간단히 정리할 필요가 있습니다. 

* New
    * 엔티티를 새로 생성한 상태
    * 어플리케이션 메모리에만 존재하며 엔티티 매니저에 의해 관리되지 않습니다.
* Managed
    * 엔티티 매니저에 의해 영속성 컨텍스트에서 관리되는 상태입니다. 
* Detached
    * 엔티티 매니저에 의해 관리되다가 영속성 컨텍스트에서 제외된 상태입니다.
* Removed
    * 엔티티를 데이터베이스에서 삭제하겠다고 표시한 상태입니다. 

<p align="center">
    <img src="/images/version-annotation-warning-1.JPG" width="60%" class="image__border">
</p>
<center>https://gunlog.dev/JPA-Persistence-Context/</center>

### 2.1. SimpleJpaRepository Class

이제 어떤 요소가 에러를 유발했는지 연관된 코드를 살펴보겠습니다. 
먼저 SimpleJpaRepository 클래스를 살펴보겠습니다. 

* 전달 받은 엔티티 객체가 new 상태라면 영속화(persist)합니다.
    * 영속화 후 전달받은 객체를 그대로 반환합니다.
* 전달 받은 엔티티 객체가 관리 중인 상태라면 영속성 컨텍스트에 병합(merge)합니다.
    * 병합 후 결과를 반환합니다.

```java
@Repository
@Transactional(
    readOnly = true
)
public class SimpleJpaRepository<T, ID> implements JpaRepositoryImplementation<T, ID> {

    @Transactional
    public <S extends T> S save(S entity) {
        Assert.notNull(entity, "Entity must not be null");
        if (this.entityInformation.isNew(entity)) {
            this.em.persist(entity);
            return entity;
        } else {
            return this.em.merge(entity);
        }
    }
}
```

### 2.2. JpaMetamodelEntityInformation Class

JpaMetamodelEntityInformation 클래스의 isNew 메소드를 살펴보겠습니다. 

* 버전 관련된 필드가 있는지 확인합니다.
* 버전 관련된 필드가 있다면 해당 타입이 원시(primitive) 타입인지 확인합니다.
    * 원시 타입이 아니라면 해당 값이 `null`이어야 `true`를 반환합니다.
    * 원시 타입이라면 부모 클래스의 isNew 메소드를 호출합니다. 
* 부모 클래스의 isNew 메소드는 `@Id` 애너테이션이 붙은 필드의 값을 확인합니다.

```java
public class JpaMetamodelEntityInformation<T, ID> extends JpaEntityInformationSupport<T, ID> {

    public boolean isNew(T entity) {
        if (!this.versionAttribute.isEmpty() && !(Boolean)this.versionAttribute.map(Attribute::getJavaType).map(Class::isPrimitive).orElse(false)) {
            BeanWrapper wrapper = new DirectFieldAccessFallbackBeanWrapper(entity);
            return (Boolean)this.versionAttribute.map((it) -> {
                return wrapper.getPropertyValue(it.getName()) == null;
            }).orElse(true);
        } else {
            return super.isNew(entity);
        }
    }
}
```

### 2.3. Summary

위에서 살펴본 코드를 정리하면 다음과 같습니다. 

1. 영속성 컨텍스트에 새로 저장할 엔티티 객체인지 판단하는 로직이 다음과 같은 우선 순위를 가진다. 
    1. 버전 관련된 필드가 존재하고 원시 타입이 아닌 경우 해당 필드 값의 null 여부
    1. 버전 관련된 필드가 존재하더라도 원시 타입이라면 엔티티 아이디 필드 값의 null 여부
    1. 버전 관련된 필드가 없다면 엔티티 아이디 필드 값의 null 여부
1. new 상태의 객체라면 영속화하고 전달받은 파라미터를 반환한다.
1. new 상태의 객체가 아니라면 병합하고 결과 객체를 새로 만들어 반환한다.

문제를 유발을 하는 코드들을 쭉 살펴보고 원인을 요약하면 다음과 같습니다. 

1. 엔티티에 버전 관련된 필드가 래퍼 클래스 타입으로 추가되었다.
1. 버전 관련된 필드의 값이 `null`이 아니기 때문에 새로 생성한 객체임에도 병합 작업이 진행됩니다.
    * 영속화 작업에선 전달받은 엔티티를 변경하고, 해당 엔티티 객체를 결과로 반환합니다.
    * 병합 작업에선 전달받은 엔티티를 변경하지 않고 쿼리 수행 결과를 새로운 엔티티 객체로 만들어 반환합니다.

##### AS-IS

버전 필드를 추가하기 전 문제가 되지 않는 코드의 흐름입니다. 

<p align="center">
    <img src="/images/version-annotation-warning-2.JPG" width="80%" class="image__border">
</p>

##### TO-BE

버전 필드가 추가된 후 문제가 발생한 코드의 흐름입니다. 

<p align="center">
    <img src="/images/version-annotation-warning-3.JPG" width="80%" class="image__border">
</p>

## 3. Solve the problem

엔티티 클래스에 추가된 버전 필드의 디폴트 값을 제거하거나 원시 타입을 사용합니다. 

```java
package blog.in.action.domain;

import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
public class ParentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    private String state;
    @Version
    private Long versionNo; // ok

    public ParentEntity() {
        state = "CREATED";
    }
}
```

### 3.1. Run Test

* @Transactional(propagation = Propagation.NOT_SUPPORTED)
    * @DataJpaTest 애너테이션에 적용된 트랜잭션으로부터 테스트 로직의 트랜잭션을 분리하기 위해 추가합니다.
* 부모 엔티티를 저장합니다.
* 자식 엔티티에 전달하여 둘 사이의 관계를 연결합니다.
* 자식 엔티티의 상태를 변경합니다.
* 자식 엔티티를 저장합니다.
    * 정상적으로 동작합니다.
* 부모 엔티티의 아이디가 널 값이 아닙니다.

```java
package blog.in.action;

import blog.in.action.domain.ChildEntity;
import blog.in.action.domain.ParentEntity;
import blog.in.action.repository.ChildRepository;
import blog.in.action.repository.ParentRepository;
import org.hibernate.TransientPropertyValueException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(
        properties = {"spring.jpa.hibernate.ddl-auto=create-drop"}
)
public class ActionInBlogTest {

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private ChildRepository childRepository;

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    @Test
    void defaultValueIsNullForVersionNo_updateStatus() {

        var parentEntity = new ParentEntity();
        parentRepository.save(parentEntity);


        var childEntity = ChildEntity.create(null, "CREATED", parentEntity);
        childEntity.update();


        var result = childRepository.save(childEntity);
        assertEquals("UPDATED", result.getState());
        assertNotNull(parentEntity.getId());
    }
}
```

##### Test Result

* 자식 엔티티에 대한 insert 쿼리가 정상적으로 수행됩니다.

```
Hibernate: select next value for parent_entity_seq
Hibernate: insert into parent_entity (state,version_no,id) values (?,?,?)
Hibernate: select next value for child_entity_seq
Hibernate: insert into child_entity (parent_entity_id,state,id) values (?,?,?)
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-06-28-version-annotation-warning>

[jpa-persistence-context-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-persistence-context/
[jpa-optimistic-lock-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-optimistic-lock/