---
title: "JPA Repository findBy- method error (feat. @Version)"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-09-04T16:00:00
---

<br/>

## 0. 들어가면서

`spring-data-jpa` 의존성을 사용하면 저는 메서드 이름 규칙에 따라 쿼리를 생성해주는 JpaRepository 인터페이스의 기능을 즐겨 사용합니다. 
Optimistic lock 기능을 사용하기 위해 `@Version` 애너테이션을 추가하면서 예기치 않게 만난 에러를 정리하였습니다. 
이전에 작성한 [@Version 사용 시 주의사항][version-annotation-link] 포스트는 추가(insert) 기능과 관련된 내용이었다면 이번 포스트는 조회(find) 기능에 대한 내용입니다. 

## 1. TransientObjectException 발생
단순한 조회에서 아래와 같은 에러가 발생하였습니다.

```
org.springframework.dao.InvalidDataAccessApiUsageException: org.hibernate.TransientObjectException: object references an unsaved transient instance - save the transient instance before flushing: blog.in.action.findby.ParentEntity; nested exception is java.lang.IllegalStateException: org.hibernate.TransientObjectException: object references an unsaved transient instance - save the transient instance before flushing: blog.in.action.findby.ParentEntity

    at org.springframework.orm.jpa.EntityManagerFactoryUtils.convertJpaAccessExceptionIfPossible(EntityManagerFactoryUtils.java:371)
    at org.springframework.orm.jpa.vendor.HibernateJpaDialect.translateExceptionIfPossible(HibernateJpaDialect.java:257)
    at org.springframework.orm.jpa.AbstractEntityManagerFactoryBean.translateExceptionIfPossible(AbstractEntityManagerFactoryBean.java:528)
    at org.springframework.dao.support.ChainedPersistenceExceptionTranslator.translateExceptionIfPossible(ChainedPersistenceExceptionTranslator.java:61)
    at org.springframework.dao.support.DataAccessUtils.translateIfNecessary(DataAccessUtils.java:242)
    at org.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:153)
    at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
  ...
```

에러 로그를 살펴보면 몇 가지 힌트를 얻을 수 있습니다. 
- object references an unsaved transient instance - 객체가 저장되지 않은 임시 인스턴스를 참조한다.
- save the transient instance before flushing - flushing 전에 임시 객체를 저장한다.
- blog.in.action.findby.ParentEntity - 객체 클래스는 `ParentEntity` 이다.

[@Version 사용 시 주의사항][version-annotation-link] 포스트에서도 유사한 에러 로그를 보았기 때문에 `@Version` 애너테이션이 문제가 되는 것임을 직감하였습니다. 
테스트 코드를 통해 비슷한 상황을 연출하고 해결 방법을 정리해보았습니다.

## 2. 테스트 코드

### 2.1. ParentEntityRepository 인터페이스 / ParentEntity 클래스
- ChildEntity 클래스와 1:1 연관 관계를 가지는 ParentEntity 클래스를 생성합니다.
- 테스트 데이터를 쉽게 생성하기 위해 `CascadeType.ALL` 모드로 ChildEntity 클래스와 관계를 맺습니다.

```java
interface ParentEntityRepository extends JpaRepository<ParentEntity, String> {

}

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "TB_PARENT")
class ParentEntity {

    public ParentEntity(String id) {
        this.id = id;
    }

    @Id
    private String id;

    @OneToOne(mappedBy = "parentEntity", cascade = CascadeType.ALL)
    private ChildEntity childEntity;

    @Version
    private Long versionNo;
}
```

### 2.2. ChildEntityRepository 인터페이스 / ChildEntity 클래스
- ParentEntity 클래스와 1:1 연관 관계를 가지는 ChildEntity 클래스를 생성합니다.
- JpaRepository 인터페이스에 ParentEntity를 이용하여 조회하는 메서드를 추가합니다.

```java
interface ChildEntityRepository extends JpaRepository<ChildEntity, String> {

    Optional<ChildEntity> findByParentEntity(ParentEntity parentEntity);
}

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "TB_CHILD")
class ChildEntity {

    public ChildEntity(String id, ParentEntity parentEntity) {
        this.id = id;
        this.parentEntity = parentEntity;
    }

    @Id
    private String id;

    @OneToOne
    private ParentEntity parentEntity;

    @Version
    private Long versionNo;
}
```

### 2.3. 테스트 데이터 생성
- `@BeforeEach` 애너테이션을 통해 매 테스트마다 데이터를 초기화합니다.
- `parentKey` 값을 PK로 갖는 데이터와 `childKey` 값을 데이터로 갖는 데이터를 각각 하나씩 생성합니다.

```java

    private static final String parentKey = "parentKey";
    private static final String childKey = "childKey";

    @BeforeEach
    public void beforeEach() {
        parentEntityRepository.deleteAll();
        childEntityRepository.deleteAll();
        ParentEntity parentEntity = new ParentEntity(parentKey);
        parentEntity.setChildEntity(new ChildEntity(childKey, parentEntity));
        parentEntityRepository.saveAndFlush(parentEntity);
    }
```

### 2.4. 에러 발생 테스트 코드
- `parentKey` 값을 가지는 부모 객체를 만든 후 이를 이용해 조회를 수행합니다.
- `InvalidDataAccessApiUsageException` exception을 예상합니다.

```java
    @Test
    public void test_withoutVersionNo_throwException() {
        ParentEntity parentEntity = new ParentEntity(parentKey);
        assertThrows(InvalidDataAccessApiUsageException.class, () -> childEntityRepository.findByParentEntity(parentEntity));
    }
```

### 2.5. 에러 해결 테스트 코드
- 부모 객체를 생성하는데 `parentKey` 값뿐만 아니라 `versionNo` 필드의 값을 임시로 추가하여 전달합니다. 
- `versionNo` 필드에 추가하는 값은 정확하게 데이터베이스에 저장된 데이터가 아니여도 좋습니다.
    - `@Version` 애너테이션이 붙은 필드가 `null` 값을 가지지 않으면 됩니다.

```java
    @Test
    public void test_withVersionNo_isPresent() {
        ParentEntity parentEntity = new ParentEntity(parentKey);
        parentEntity.setVersionNo(99L);
        Assertions.assertThat(childEntityRepository.findByParentEntity(parentEntity).isPresent()).isTrue();
    }
```

##### 테스트 결과
- 두 테스트 모두 정상적으로 통과하였습니다.

<p align="left"><img src="/images/jpa-repository-find-by-error-1.JPG" width="35%"></p>

## 3. 원인 분석
에러가 발생한 원인은 저장되지 않은 객체를 이용해 조회를 수행하였기 때문입니다. 
분명히 저장된 데이터이지만, `@Version` 애너테이션이 사용되는 경우 저장 여부를 판단하는데 버전 관리에 사용되는 값의 null 여부를 함께 확인하기 때문에 이런 문제가 발생한 것으로 생각됩니다. 
에러가 발생한 CallStack을 추적해보면 AbstractEntityPersister 클래스의 isTransient 메서드에서 버전 관리 유무에 따른 임시 객체 판단이 이루어지는 것을 확인할 수 있습니다.

- this.isVersioned() 메서드를 통해 버전 관리가 되는 엔티티인지 확인합니다.
- 버전 관리가 되는 엔티티는 버전 값 여부를 추가적으로 확인합니다.

```java
public abstract class AbstractEntityPersister implements OuterJoinLoadable, Queryable, ClassMetadata, UniqueKeyLoadable, SQLLoadable, LazyPropertyInitializer, PostInsertIdentityPersister, Lockable {

    // ...

    public Boolean isTransient(Object entity, SharedSessionContractImplementor session) throws HibernateException {
        Serializable id;
        if (this.canExtractIdOutOfEntity()) {
            id = this.getIdentifier(entity, session);
        } else {
            id = null;
        }
        if (id == null) {
            return Boolean.TRUE;
        } else {
            Object version = this.getVersion(entity);
            Boolean result;
            if (this.isVersioned()) {
                result = this.entityMetamodel.getVersionProperty().getUnsavedValue().isUnsaved(version);
                if (result != null) {
                    return result;
                }
            }
            result = this.entityMetamodel.getIdentifierProperty().getUnsavedValue().isUnsaved(id);
            if (result != null) {
                return result;
            } else {
                if (session.getCacheMode().isGetEnabled() && this.canReadFromCache()) {
                    EntityDataAccess cache = this.getCacheAccessStrategy();
                    Object ck = cache.generateCacheKey(id, this, session.getFactory(), session.getTenantIdentifier());
                    Object ce = CacheHelper.fromSharedCache(session, ck, this.getCacheAccessStrategy());
                    if (ce != null) {
                        return Boolean.FALSE;
                    }
                }
                return null;
            }
        }
    }
}
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-08-13-jpa-repository-find-by-error>

#### REFERENCE
- <https://junhyunny.github.io/spring-boot/jpa/junit/version-annotation-warning/>

[version-annotation-link]: https://junhyunny.github.io/spring-boot/jpa/junit/version-annotation-warning/