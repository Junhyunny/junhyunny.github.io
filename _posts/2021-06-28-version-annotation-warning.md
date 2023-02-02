---
title: "@Version 사용 시 주의사항"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-09-04T03:30:00
---

<br/>

## 0. 들어가면서
여러 사용자에 의한 특정 데이터 동시 수정 문제를 해결하기 위해 @Version 애너테이션을 사용하였습니다. 
간단한 테스트를 수행하는데 여기 저기서 에러가 터져나오기 시작했습니다. 
딱 코드 한 줄만 추가하였는데 여파가 무시무시했습니다. 
영향도에 대한 충분한 확인 없이 코드를 올리는 일은 주의해야겠습니다. 

## 1. 기존 코드
프로젝트에서 개발 중인 코드는 노출이 불가능하므로 문제가 발생한 코드 부분과 비슷한 테스트 코드를 작성하였습니다.

### 1.1. 기존 코드 실행 흐름
1. 신규 A 엔티티 객체 생성, A 엔티티 new
1. JpaRepository save 메소드 수행, A 엔티티 persist
1. save 메소드의 파라미터로 전달한 객체를 지속해서 사용
1. A 엔티티의 자식 엔티티 save 메소드 수행, A 자식 엔티티 persist 

### 1.2. 테스트 코드 

```java
    @Test
    public void test_nonTransientEntity_throwException() {
        // 신규 엔티티 생성, new
        DefaultVersionEntity versionEntity = new DefaultVersionEntity();
        versionEntity.setValue("DefaultVersionEntity");
        versionEntity.setChildEntity(new ChildEntity(versionEntity));
        // 엔티티 save, persist
        defaultVersionEntityRepository.save(versionEntity);
        // 자식 엔티티, persist
        assertThrows(Exception.class, () -> childEntityRepository.save(versionEntity.getChildEntity()));
    }
```

### 1.3. 에러 로그
- 기존에 발생하지 않던 InvalidDataAccessApiUsageException 감지 

```
org.springframework.dao.InvalidDataAccessApiUsageException: org.hibernate.TransientPropertyValueException: object references an unsaved transient instance - save the transient instance before flushing
```

## 2. 에러 발생 원인 탐색
Jpa Entity Manager는 기본적으로 save 메소드에 파라미터로 전달한 객체를 영속성 컨텍스트(persistence context)에서 관리합니다. 
save 메소드를 통해 저장한 객체와 save 메소드를 통해 반환되는 객체가 동일한 객체입니다.(주소가 동일) 
그렇기 때문에 기존에 코드의 실행 흐름은 크게 문제가 없었습니다. 

하지만 @Version 애너테이션을 추가하면서 save 메소드에 파라미터로 전달한 객체가 영속성 컨텍스트에 담기지 않는 현상이 발견되었습니다. 
이런 현상은 영속성 컨텍스트에서 관리되지 않는 부모 엔티티를 참조하는 자식 엔티티를 save 하도록 만들기 때문에 에러가 발생합니다. 
정확히 어느 위치에서 이런 현상을 유발시키는지 확인해보았습니다. 

### 2.1. SimpleJpaRepository 클래스
- SimpleJpaRepository 클래스의 save 메소드를 보면 전달받은 엔티티가 new 상태인지 아닌지 확인합니다.
- new 상태의 엔티티인 경우에는 엔티티를 영속성 컨텍스트 영역에 추가하고 엔티티 객체를 반환합니다.

```java
@Repository
@Transactional(readOnly = true)
public class SimpleJpaRepository<T, ID> implements JpaRepositoryImplementation<T, ID> {

    // ... 

    /*
     * (non-Javadoc)
     * @see org.springframework.data.repository.CrudRepository#save(java.lang.Object)
     */
    @Transactional
    @Override
    public <S extends T> S save(S entity) {

        if (entityInformation.isNew(entity)) {
            em.persist(entity);
            return entity;
        } else {
            return em.merge(entity);
        }
    }

    // ...
}
```

### 2.2. JpaMetamodelEntityInformation 클래스
- version 관리를 위한 항목이 존재하는지 확인합니다.
- version 관리 항목이 존재하지 않거나 해당 field가 primitive 타입인 경우에는 부모 클래스의 isNew 메소드를 수행합니다.
- version 관리 항목이 null 인 경우에는 new 상태이고, null 이 아닌 경우에는 new 상태가 아닙니다.

```java
public class JpaMetamodelEntityInformation<T, ID> extends JpaEntityInformationSupport<T, ID> {

    // ...

    /*
     * (non-Javadoc)
     * @see org.springframework.data.repository.core.support.AbstractEntityInformation#isNew(java.lang.Object)
     */
    @Override
    public boolean isNew(T entity) {

        if (!versionAttribute.isPresent()
                || versionAttribute.map(Attribute::getJavaType).map(Class::isPrimitive).orElse(false)) {
            return super.isNew(entity);
        }

        BeanWrapper wrapper = new DirectFieldAccessFallbackBeanWrapper(entity);

        return versionAttribute.map(it -> wrapper.getPropertyValue(it.getName()) == null).orElse(true);
    }

    // ...

}
```

## 3. 에러 유발 원인
JPA 내부 코드를 살펴보니 에러 유발하는 범인이 밝혀졌습니다. 
엔티티 버전 관리의 불편함을 덜기 위해 default 값을 지정한 것이 문제가 되었습니다. 

### 3.1. 에러 유발 코드

```java
    // ...
    @Version
    private Long versionNo = 0L;
```

## 4. 테스트를 통한 점검
간단한 테스트 코드를 통해 @Version 애너테이션의 에러 유발 케이스를 다시 정리해보았습니다. 

### 4.1. 엔티티 구현
- DefaultVersionEntity - versionNo default 값 사용 
- NonDefaultVersionEntity - versionNo default 값 미사용

```java
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "TB_DEFAULT_VERSION")
class DefaultVersionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name = "VALUE")
    private String value;

    @OneToOne(mappedBy = "defaultVersionEntity", cascade = CascadeType.ALL)
    private ChildEntity childEntity;

    @Version
    private Long versionNo = 0L;
}

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "TB_NON_DEFAULT_VERSION")
class NonDefaultVersionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name = "VALUE")
    private String value;

    @OneToOne(mappedBy = "nonDefaultVersionEntity", cascade = CascadeType.ALL)
    private ChildEntity childEntity;

    @Version
    private Long versionNo;
}
```

### 4.2. 테스트 코드
- save 메소드에게 파라미터로 전달한 엔티티와 반환된 엔티티가 동일한지 확인
- test_registerEntity_isEqualWithReturned - NonDefaultVersionEntity 사용
    - 파라미터 엔티티와 반환된 엔티티가 동일함을 예상
- test_registerEntity_isNotEqualWithReturned - DefaultVersionEntity 사용
    - 파라미터 엔티티와 반환된 엔티티가 동일하지 않음을 예상

```java
@SpringBootTest
public class VersionNoTest {

    @Autowired
    private DefaultVersionEntityRepository defaultVersionEntityRepository;

    @Autowired
    private NonDefaultVersionEntityRepository nonDefaultVersionEntityRepository;

    @Autowired
    private ChildEntityRepository childEntityRepository;

    @BeforeEach
    public void beforeEach() {
        defaultVersionEntityRepository.deleteAll();
        nonDefaultVersionEntityRepository.deleteAll();
        childEntityRepository.deleteAll();
    }

    // ...

    @Test
    public void test_registerEntity_isEqualWithReturned() {
        NonDefaultVersionEntity nonVersionEntity = new NonDefaultVersionEntity();
        nonVersionEntity.setValue("NonDefaultVersionEntity");
        nonVersionEntity.setChildEntity(new ChildEntity(nonVersionEntity));
        NonDefaultVersionEntity returnedEntity = nonDefaultVersionEntityRepository.save(nonVersionEntity);
        assertThat(nonVersionEntity).isEqualTo(returnedEntity);
    }

    @Test
    public void test_registerEntity_isNotEqualWithReturned() {
        DefaultVersionEntity versionEntity = new DefaultVersionEntity();
        versionEntity.setValue("DefaultVersionEntity");
        versionEntity.setChildEntity(new ChildEntity(versionEntity));
        DefaultVersionEntity returnedEntity = defaultVersionEntityRepository.save(versionEntity);
        assertThat(versionEntity).isNotEqualTo(returnedEntity);
    }
}
```

##### 테스트 결과

<p align="left"><img src="/images/version-annotation-warning-1.JPG" width="50%"></p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-06-28-version-annotation-warning>