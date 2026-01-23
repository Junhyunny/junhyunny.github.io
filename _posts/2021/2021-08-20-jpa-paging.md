---
title: "JPA 페이징(paging) 처리"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2025-12-24T12:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [테이블 페이징(paging) 처리 구현 (feat. Spring Boot, Vue.js)][spring-boot-vue-js-paging-table-link]

## 0. 들어가면서

JPA를 사용하면서 편해졌다고 느끼는 부분은 페이징(paging) 처리 방법이다. 간단한 예제 코드를 통해 사용 방법에 대해 알아보자. 

## 1. Pageable 인터페이스

`Pageable` 인터페이스 구현체를 JpaRepository 메서드에 파라미터로 넘겨주면 자동으로 페이징 처리가 된다. Pageable 인터페이스에는 JPA가 페이징 처리를 위해 필요한 기능들이 명세되어 있다. 주요 메서드들을 살펴보자.

- getPageNumber 메서드 
  - 현재 페이지 번호를 반환
- getPageSize 메서드
  - 한 페이지에서 보여줄 항목들의 개수를 반환
- getOffset 메서드
  - 페이지 크기에 따라 취할 오프셋을 반환
- next 메서드
  - 다음 페이지를 조회할 때 사용하는 Pageable 인스턴스를 반환
- first 메서드
  - 첫번째 페이지를 조회할 때 사용하는 Pageable 인스턴스를 반환
- previousOrFirst 메서드
  - 이전 페이지를 조회할 때 사용하는 Pageable 인스턴스를 반환
  - 가장 첫 페이지인 경우에는 첫 페이지를 위한 Pageable 인스턴스를 반환

```java
public interface Pageable {

    // ... 

    int getPageNumber();

    int getPageSize();

    long getOffset();

    Pageable next();

    Pageable previousOrFirst();

    Pageable first();
}
```

## 2. PageRequest 클래스

페이징 처리를 할 수 있도록 Pageable 인스턴스를 JpaRepository 인스턴스에게 전달해야 한다. 스프링 프레임워크에서는 Pageable 인스턴스를 쉽게 생성할 수 있도록 `PageRequest` 클래스를 제공한다. PageRequest 클래스의 of 메서드를 살펴보자. of 메서드에 들어간 파라미터를 기준으로 설명했다.

- `Sort.by(Direction.DESC, "testValue")` - "testValue 필드 값으로 정렬한 항목(row)들을"
- `100` - "100개씩 하나의 페이지로 만들었을 때"
- `0` - "0번째 페이지를 조회하기 위한 Pageable 인스턴스를 만들어"
    
```java
Pageable pageable = PageRequest.of(0, 100, Sort.by(Direction.DESC, "testValue"));
```

## 3. Page<T> 클래스

페이징 처리가 되어 반환되는 결과는 `Page<T>` 클래스에 담겨 반환된다. `Page<T>` 클래스는 다음과 같은 정보를 지니고 있다.

- getPageable 메서드
  - 페이징 처리에서 사용한 Pageable 인터페이스 구현체 정보
- getContent 메서드
  - 해당 페이지에 해당되는 항목(row) 리스트
- getTotalElements 메서드
  - 조회 조건에 일치하는 총 항목 수
- getTotalPages 메서드
  - 총 페이지 개수

PageRequest 클래스 of 메서드를 통해 얻은 Pageable 구현체는 아래 코드처럼 사용할 수 있다. JapRepository에서 기본적으로 제공하는 findAll 메서드를 이용하였다. 

```java
Pageable pageable = PageRequest.of(0, 10, Sort.by(Direction.DESC, "testValue"));
Page<TestEntity> testEntities = testRepository.findAll(pageable);
```

## 4. 테스트 코드

간단한 테스트 코드를 통해 JPA 페이징 처리 방법을 알아보자. 세 가지 방법으로 구현했다.

- JpaRepository 메서드 이름 규칙을 활용한 findBy- 메서드 사용
- @Query 애너테이션 with JPQL
- @Query 애너테이션 with Native Query

TestEntity 클래스는 다음과 같이 정의한다.

```java
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "TB_TABLE")
class TestEntity {

    public TestEntity(String value) {
        this.testValue = value;
    }

    @Id
    @GeneratedValue
    private long id;

    @Column(name = "TEST_VALUE")
    private String testValue;

    @Column(name = "CREATED_AT", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "id: " + id + ", testValue: " + testValue + ", createdAt: " + createdAt;
    }
}
```

beforeEach 메서드를 통해 테스마다 각 테스트마다 데이터를 초기화한다.

- 모든 데이터를 삭제하고 250개의 데이터를 추가한다.
- TestEntity 객체의 testValue 필드 값으로 랜덤한 문자열을 지정한다.

```java
    @BeforeEach
    public void beforeEach() {
        testRepository.deleteAll();
        for (int index = 0; index < 250; index++) {
            testRepository.save(new TestEntity(UUID.randomUUID() + "-" + index));
        }
    }
```

먼저 findBy- 메서드로 페이징 처리를 해보자.

- testValue 필드 값을 내림차순(desc)으로 정렬한다.
- 페이지 당 항목 수를 10개씩 0, 1번 페이지를 조회한다.
- testValue 필드 값이 'A'로 시작되는 데이터를 조회한다.
- 문자열의 대소문자를 구분하지 않는다. (case not sensitive)

```java
@Log4j2
@SpringBootTest
public class JpaPagingTest {

    // ...

    @Test
    public void testUsingFindBy() {
        for (int pageIndex = 0; pageIndex < 2; pageIndex++) {
            Pageable pageable = PageRequest.of(pageIndex, 10, Sort.by(Direction.DESC, "testValue"));
            Page<TestEntity> testEntities = testRepository.findByTestValueStartsWith("A", pageable);
            log.info("전체 페이지 수: " + testEntities.getTotalPages());
            log.info("현재 페이지 번호: " + testEntities.getPageable().getPageNumber());
            log.info("페이지 별 사이즈: " + testEntities.getPageable().getPageSize());
            log.info("조건 일치 총 항목 수: " + testEntities.getTotalElements());
            testEntities.forEach(testEntity -> {
                log.info(testEntity);
            });
        }
    }
}

interface TestRepository extends JpaRepository<TestEntity, Long> {

    // ...

    Page<TestEntity> findByTestValueStartsWith(String testValue, Pageable pageable);
}
```

실행 결과를 로그로 확인해보자.

- 조회 시 사용된 쿼리 로그를 보면 `order by testentity0_.test_value desc limit ?` 조건이 추가되었다.
- 페이징 처리를 위한 count 쿼리가 추가 수행되었다.

```
Hibernate: select testentity0_.id as id1_0_, testentity0_.created_at as created_2_0_, testentity0_.test_value as test_val3_0_ from tb_table testentity0_ where testentity0_.test_value like ? escape ? order by testentity0_.test_value desc limit ?
Hibernate: select count(testentity0_.id) as col_0_0_ from tb_table testentity0_ where testentity0_.test_value like ? escape ?
2021-08-20 11:15:57.285  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : 전체 페이지 수: 2
2021-08-20 11:15:57.286  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : 현재 페이지 번호: 0
2021-08-20 11:15:57.286  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : 페이지 별 사이즈: 10
2021-08-20 11:15:57.287  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : 조건 일치 총 항목 수: 14
2021-08-20 11:15:57.295  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 5566, testValue: af758df2-60d5-4d0d-bf27-cdc069f5513f-215, createdAt: 2021-08-20T11:15:57
2021-08-20 11:15:57.295  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 5500, testValue: ace32ac5-9a1e-4edc-a667-2e63c5b21483-149, createdAt: 2021-08-20T11:15:56
2021-08-20 11:15:57.295  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 5408, testValue: ac144914-342e-4e59-86f5-2042f7cfa84a-57, createdAt: 2021-08-20T11:15:56
2021-08-20 11:15:57.295  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 5351, testValue: a845584a-0e3d-438e-a224-cea256396b87-0, createdAt: 2021-08-20T11:15:56
2021-08-20 11:15:57.295  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 5562, testValue: a79b524d-7e23-49f6-bb3c-e011a66d58fa-211, createdAt: 2021-08-20T11:15:57
2021-08-20 11:15:57.295  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 5515, testValue: a7479998-6f81-48da-9025-71ad04aae002-164, createdAt: 2021-08-20T11:15:56
2021-08-20 11:15:57.295  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 5461, testValue: a687ec1d-6a7f-49b3-99fc-d8851c67cbab-110, createdAt: 2021-08-20T11:15:56
2021-08-20 11:15:57.295  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 5499, testValue: a6709387-6012-43b1-b9fc-51a7c1d121d5-148, createdAt: 2021-08-20T11:15:56
2021-08-20 11:15:57.295  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 5488, testValue: a6251825-c5e4-4010-aa27-9fb37cfa1e25-137, createdAt: 2021-08-20T11:15:56
2021-08-20 11:15:57.295  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 5478, testValue: a60177c2-456b-4887-bf33-650c9660801e-127, createdAt: 2021-08-20T11:15:56
Hibernate: select testentity0_.id as id1_0_, testentity0_.created_at as created_2_0_, testentity0_.test_value as test_val3_0_ from tb_table testentity0_ where testentity0_.test_value like ? escape ? order by testentity0_.test_value desc limit ?, ?
2021-08-20 11:15:57.298  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : 전체 페이지 수: 2
2021-08-20 11:15:57.298  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : 현재 페이지 번호: 1
2021-08-20 11:15:57.298  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : 페이지 별 사이즈: 10
2021-08-20 11:15:57.298  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : 조건 일치 총 항목 수: 14
2021-08-20 11:15:57.298  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 5438, testValue: a5f4c326-0ac1-4252-8d4e-f4f86c573e50-87, createdAt: 2021-08-20T11:15:56
2021-08-20 11:15:57.298  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 5520, testValue: a21eb79e-ce3a-4e27-b420-2336e486ae6f-169, createdAt: 2021-08-20T11:15:56
2021-08-20 11:15:57.298  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 5536, testValue: a1aa868e-a3b8-430e-961b-9e9661d32ec5-185, createdAt: 2021-08-20T11:15:56
2021-08-20 11:15:57.298  INFO 10968 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 5474, testValue: a020c2e1-ca7b-4259-a7b6-a094d37e5315-123, createdAt: 2021-08-20T11:15:56
```

다음은 @Query 애너테이션과 JPQL 쿼리를 통해 페이징 처리를 해보자.

- testValue 필드 값을 내림차순(desc)으로 정렬한다.
- 페이지 당 항목 수를 10개씩 0, 1번 페이지를 조회한다.
- testValue 필드 값이 'A'로 시작되는 데이터를 조회한다.
- 문자열의 대소문자를 구분하지 않는다. (case not sensitive)

```java
@Log4j2
@SpringBootTest
public class JpaPagingTest {

    // ...

    @Test
    public void testUsingJpql() {
        for (int pageIndex = 0; pageIndex < 2; pageIndex++) {
            Pageable pageable = PageRequest.of(pageIndex, 10, Sort.by(Direction.DESC, "testValue"));
            Page<TestEntity> testEntities = testRepository.findByValueStartsWithUsingJpql("A", pageable);
            log.info("전체 페이지 수: " + testEntities.getTotalPages());
            log.info("현재 페이지 번호: " + testEntities.getPageable().getPageNumber());
            log.info("페이지 별 사이즈: " + testEntities.getPageable().getPageSize());
            log.info("조건 일치 총 항목 수: " + testEntities.getTotalElements());
            testEntities.forEach(testEntity -> {
                log.info(testEntity);
            });
        }
    }
}

interface TestRepository extends JpaRepository<TestEntity, Long> {
    
    // ...

    @Query(value = "SELECT t FROM TestEntity t WHERE t.testValue LIKE :testValue%", countQuery = "SELECT COUNT(t) FROM TestEntity t WHERE t.testValue LIKE :testValue%")
    Page<TestEntity> findByValueStartsWithUsingJpql(@Param("testValue") String testValue, Pageable pageable);
}
```

이전과 마찬가지로 로그를 통해 테스트 실행 결과를 확인해보자.

- 조회 시 사용된 쿼리 로그를 보면 `order by testentity0_.test_value desc limit ?` 조건이 추가되었다.
- 페이징 처리를 위한 count 쿼리가 추가 수행되었다.

```
Hibernate: select testentity0_.id as id1_0_, testentity0_.created_at as created_2_0_, testentity0_.test_value as test_val3_0_ from tb_table testentity0_ where testentity0_.test_value like ? order by testentity0_.test_value desc limit ?
Hibernate: select count(testentity0_.id) as col_0_0_ from tb_table testentity0_ where testentity0_.test_value like ?
2021-08-20 11:27:05.846  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : 전체 페이지 수: 3
2021-08-20 11:27:05.846  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : 현재 페이지 번호: 0
2021-08-20 11:27:05.846  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : 페이지 별 사이즈: 10
2021-08-20 11:27:05.846  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : 조건 일치 총 항목 수: 23
2021-08-20 11:27:05.846  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6309, testValue: afe657c8-c044-4d06-a241-608d9dd14c93-208, createdAt: 2021-08-20T11:27:05
2021-08-20 11:27:05.846  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6115, testValue: afa732ad-21a2-46fa-b18d-950315e46f14-14, createdAt: 2021-08-20T11:27:04
2021-08-20 11:27:05.846  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6174, testValue: af7756a2-2082-494b-92d1-544e48324557-73, createdAt: 2021-08-20T11:27:04
2021-08-20 11:27:05.846  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6286, testValue: aefa2b83-b40f-41ef-bfab-cb3df5d14d6e-185, createdAt: 2021-08-20T11:27:05
2021-08-20 11:27:05.846  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6350, testValue: aeea05c3-697f-4dbd-9cfe-7bfae9d7be55-249, createdAt: 2021-08-20T11:27:05
2021-08-20 11:27:05.846  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6133, testValue: ad86241b-b39a-4960-b16f-80f90cd1bce2-32, createdAt: 2021-08-20T11:27:04
2021-08-20 11:27:05.846  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6322, testValue: ad0c9579-81d1-4826-b9b9-56a78af05c34-221, createdAt: 2021-08-20T11:27:05
2021-08-20 11:27:05.846  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6242, testValue: ac177f63-211a-48c1-a5b7-7979cc49e036-141, createdAt: 2021-08-20T11:27:05
2021-08-20 11:27:05.846  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6204, testValue: aafed5be-39a1-4262-be96-7a66047321ea-103, createdAt: 2021-08-20T11:27:05
2021-08-20 11:27:05.846  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6189, testValue: a9c06f12-532f-4889-b49c-7718ea65e2cb-88, createdAt: 2021-08-20T11:27:05
Hibernate: select testentity0_.id as id1_0_, testentity0_.created_at as created_2_0_, testentity0_.test_value as test_val3_0_ from tb_table testentity0_ where testentity0_.test_value like ? order by testentity0_.test_value desc limit ?, ?
Hibernate: select count(testentity0_.id) as col_0_0_ from tb_table testentity0_ where testentity0_.test_value like ?
2021-08-20 11:27:05.862  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : 전체 페이지 수: 3
2021-08-20 11:27:05.862  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : 현재 페이지 번호: 1
2021-08-20 11:27:05.862  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : 페이지 별 사이즈: 10
2021-08-20 11:27:05.862  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : 조건 일치 총 항목 수: 23
2021-08-20 11:27:05.862  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6137, testValue: a903e76f-5d6a-40fb-937b-00e8dcd70633-36, createdAt: 2021-08-20T11:27:04
2021-08-20 11:27:05.862  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6328, testValue: a88d8230-e141-40ba-a421-8c77db9e111b-227, createdAt: 2021-08-20T11:27:05
2021-08-20 11:27:05.862  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6109, testValue: a822eff7-b34a-490b-ab34-53e204904c30-8, createdAt: 2021-08-20T11:27:04
2021-08-20 11:27:05.862  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6306, testValue: a7f3dfd9-c593-4919-ac08-072b6ade467b-205, createdAt: 2021-08-20T11:27:05
2021-08-20 11:27:05.862  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6255, testValue: a65bdf76-edab-47ab-a880-a02154846bf8-154, createdAt: 2021-08-20T11:27:05
2021-08-20 11:27:05.862  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6203, testValue: a47ed531-46d7-4c1f-bb42-0103f4ac7b25-102, createdAt: 2021-08-20T11:27:05
2021-08-20 11:27:05.862  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6290, testValue: a462d57f-dafc-4056-9cac-7c5d6ca8b513-189, createdAt: 2021-08-20T11:27:05
2021-08-20 11:27:05.862  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6250, testValue: a401b479-5107-40d4-a05c-603dad74d390-149, createdAt: 2021-08-20T11:27:05
2021-08-20 11:27:05.862  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6317, testValue: a3cbbde6-368e-4257-a675-397b083121b4-216, createdAt: 2021-08-20T11:27:05
2021-08-20 11:27:05.862  INFO 19416 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6129, testValue: a1c1e5cc-dbf0-4360-8b14-b172576352d5-28, createdAt: 2021-08-20T11:27:04
```

마지막으로 @Query 애너테이션과 네이티브 쿼리를 통해 페이징 처리를 수행한다.

- TEST_VALUE 컬럼 값을 내림차순(desc)으로 정렬한다.
- 페이지 당 항목 수를 10개씩 0, 1번 페이지를 조회한다.
- TEST_VALUE 컬럼 값이 'A'로 시작되는 데이터를 조회한다.
- 문자열의 대소문자를 구분하지 않는다. (case not sensitive)
- Native Query를 사용하기 때문에 Sort.by 메서드에 "testValue" 값을 전달하면 에러가 발생한다.  

```java
@Log4j2
@SpringBootTest
public class JpaPagingTest {

    // ...
    
    @Test
    public void testUsingNative() {
        for (int pageIndex = 0; pageIndex < 2; pageIndex++) {
            Pageable pageable = PageRequest.of(pageIndex, 10, Sort.by(Direction.DESC, "TEST_VALUE"));
            Page<TestEntity> testEntities = testRepository.findByValueStartsWithUsingNative("A", pageable);
            log.info("전체 페이지 수: " + testEntities.getTotalPages());
            log.info("현재 페이지 번호: " + testEntities.getPageable().getPageNumber());
            log.info("페이지 별 사이즈: " + testEntities.getPageable().getPageSize());
            log.info("조건 일치 총 항목 수: " + testEntities.getTotalElements());
            testEntities.forEach(testEntity -> {
                log.info(testEntity);
            });
        }
    }
}

interface TestRepository extends JpaRepository<TestEntity, Long> {

    // ...

    @Query(value = "SELECT * FROM TB_TABLE t WHERE TEST_VALUE LIKE :testValue%", countQuery = "SELECT COUNT(*) FROM TB_TABLE t WHERE t.TEST_VALUE LIKE :testValue%", nativeQuery = true)
    Page<TestEntity> findByValueStartsWithUsingNative(@Param("testValue") String testValue, Pageable pageable);
}
```

마찬가지로 로그를 통해 실행 결과를 확인한다.

- 조회 시 사용된 쿼리 로그를 보면 `order by t.TEST_VALUE desc limit ?` 조건이 추가되었다.
- 페이징 처리를 위한 count 쿼리가 추가 수행되었다.
- 조건에 일치하는 항목(row) 수가 7개이므로 두번째 페이지 요청에 대해서는 데이터가 조회되지 않는다.

```
Hibernate: SELECT * FROM TB_TABLE t WHERE TEST_VALUE LIKE ? order by t.TEST_VALUE desc limit ?
2021-08-20 11:30:15.484  INFO 7932 --- [           main] blog.in.action.paging.JpaPagingTest      : 전체 페이지 수: 1
2021-08-20 11:30:15.484  INFO 7932 --- [           main] blog.in.action.paging.JpaPagingTest      : 현재 페이지 번호: 0
2021-08-20 11:30:15.485  INFO 7932 --- [           main] blog.in.action.paging.JpaPagingTest      : 페이지 별 사이즈: 10
2021-08-20 11:30:15.488  INFO 7932 --- [           main] blog.in.action.paging.JpaPagingTest      : 조건 일치 총 항목 수: 7
2021-08-20 11:30:15.497  INFO 7932 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6753, testValue: adc8bb52-0148-4a4c-96ca-4720d82ee84f-152, createdAt: 2021-08-20T11:30:14
2021-08-20 11:30:15.497  INFO 7932 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6800, testValue: ac25344b-23a0-4e74-af9c-0d3600dfb0ad-199, createdAt: 2021-08-20T11:30:15
2021-08-20 11:30:15.497  INFO 7932 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6719, testValue: a5c8f099-20d7-421d-8d35-8f64bf0101b2-118, createdAt: 2021-08-20T11:30:14
2021-08-20 11:30:15.497  INFO 7932 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6744, testValue: a483f2b1-260b-43b1-a749-d094f464ded7-143, createdAt: 2021-08-20T11:30:14
2021-08-20 11:30:15.497  INFO 7932 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6727, testValue: a47f9b9a-90a8-4738-a913-0e36724f69df-126, createdAt: 2021-08-20T11:30:14
2021-08-20 11:30:15.497  INFO 7932 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6606, testValue: a427d95d-69ae-4534-a985-8cade8fcc346-5, createdAt: 2021-08-20T11:30:14
2021-08-20 11:30:15.497  INFO 7932 --- [           main] blog.in.action.paging.JpaPagingTest      : id: 6839, testValue: a2d33b8a-ae08-4ba6-9c58-b2b66b897f87-238, createdAt: 2021-08-20T11:30:15
Hibernate: SELECT * FROM TB_TABLE t WHERE TEST_VALUE LIKE ? order by t.TEST_VALUE desc limit ?, ?
Hibernate: SELECT COUNT(*) FROM TB_TABLE t WHERE t.TEST_VALUE LIKE ?
2021-08-20 11:30:15.503  INFO 7932 --- [           main] blog.in.action.paging.JpaPagingTest      : 전체 페이지 수: 1
2021-08-20 11:30:15.503  INFO 7932 --- [           main] blog.in.action.paging.JpaPagingTest      : 현재 페이지 번호: 1
2021-08-20 11:30:15.503  INFO 7932 --- [           main] blog.in.action.paging.JpaPagingTest      : 페이지 별 사이즈: 10
2021-08-20 11:30:15.503  INFO 7932 --- [           main] blog.in.action.paging.JpaPagingTest      : 조건 일치 총 항목 수: 7
```

## CLOSING

조회 조건으로 대문자 "A"를 주었지만 소문자 "a"로 시작하는 값들이 조회되는 것이 이상하다. 관련된 내용을 찾아보니 MySQL 데이터베이스는 VARCHAR 타입의 대소문자를 구분하지 않는다고 한다. 대소문자 구분을 위해선 `BINARY` 키워드를 추가해야 한다고 하니 참조하길 바란다. 

> [Controlling Case Sensitivity in String Comparisons][case-insensitive-ref-link]<br/>
> String comparisons in MySQL are not case sensitive by default:<br/>
> ...<br/>
> To make a string comparison case sensitive that normally would not be, cast (convert) one of the strings to binary form by using the BINARY keyword. 

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-08-18-jpa-paging>

#### REFERENCE

- <https://www.baeldung.com/spring-jpa-like-queries>
- <https://www.oreilly.com/library/view/mysql-cookbook/0596001452/ch04s10.html>

[case-insensitive-ref-link]: https://www.oreilly.com/library/view/mysql-cookbook/0596001452/ch04s10.html
[spring-boot-vue-js-paging-table-link]: https://junhyunny.github.io/spring-boot/vue.js/spring-boot-vue-js-paging-table/