---
title: "JPA GROUP BY 사용 시 ConverterNotFoundException 발생"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-06-22T04:00:00
---

<br>

통계성 데이터를 보여줄 때 가장 먼저 찾는 방법은 SQL의 `GROUP BY` 입니다. 
대부분의 데이터 처리를 SQL이 아닌 비즈니스 로직에서 해결하지만 통계성 데이터는 역시 SQL을 이용하는 것이 여러모로 편리한 것 같습니다. 
JPA를 사용하고 처음으로 `GROUP BY` 키워드가 들어간 SQL을 사용했을 때 이런 Exception을 마주쳤습니다. 

```
org.springframework.core.convert.ConverterNotFoundException: No converter found capable of converting from type [org.springframework.data.jpa.repository.query.AbstractJpaQuery$TupleConverter$TupleBackedMap] to type [com.geneuin.ksystem.common.domain.vo.ContainerGroupByItemGroup]
```

음...🧐 딱 보았을 때 spring-data-jpa 에서 반환하는 타입이 제가 지정한 타입으로 자동 변환되지 않는 듯 합니다. 
에러를 해결하기 위한 방법이 세 가지 존재합니다. 
관련된 내용들을 정리해보겠습니다.

## Error 발생 상황
`GROUP BY` 키워드가 들어간 쿼리를 사용할 때 반환 타입으로 클래스를 사용하면 에러가 발생합니다. 상황을 재현해보았습니다. 

##### ItemNameGroupVo 클래스

```java
@Getter
@Setter
@NoArgsConstructor
@ToString
class ItemNameGroupVo {

    long aCount;
    long bCount;
    long cCount;
    long dCount;
    long eCount;
}
```

##### ItemRepository 인터페이스

```java
interface ItemRepository extends JpaRepository<Item, Long> {

    @Query(value = "SELECT SUM(CASE WHEN NAME = 'A' THEN 1 ELSE 0 END) AS aCount, "
        + " SUM(CASE WHEN NAME = 'B' THEN 1 ELSE 0 END) AS bCount, "
        + " SUM(CASE WHEN NAME = 'C' THEN 1 ELSE 0 END) AS cCount, "
        + " SUM(CASE WHEN NAME = 'D' THEN 1 ELSE 0 END) AS dCount, "
        + " SUM(CASE WHEN NAME = 'E' THEN 1 ELSE 0 END) AS eCount"
        + " FROM TB_ITEM GROUP BY NAME", nativeQuery = true)
    List<ItemNameGroupVo> findItemNameGroupUsingClass();
}
```

##### 테스트 코드 
- ConverterNotFoundException이 감지되는지 확인하기 위해 assertThrows 메소드를 사용합니다.

```java
@Log4j2
@SpringBootTest
public class GroupByTest {

    @Autowired
    private ItemRepository itemRepository;

    @BeforeEach
    public void beforeEach() {
        itemRepository.deleteAll();
        for (int index = 0; index < 20; index++) {
            itemRepository.save(new Item(String.valueOf((char) ('A' + new Random().nextInt(5)))));
        }
    }

    @Test
    public void test_throwException_usingClass() {
        assertThrows(ConverterNotFoundException.class, () -> itemRepository.findItemNameGroupUsingClass());
    }
}
```

##### 테스트 결과
- 테스트가 통과하여 findItemNameGroupUsingClass 메소드 수행 시 ConverterNotFoundException이 정상적으로 발생하였음을 알 수 있습니다.

<p align="left"><img src="/images/spring-data-jpa-group-by-1.JPG" width="45%"></p>

## Use Object[]

> JPA queries typically produce their results as instances of a mapped entity. 
> However, queries with aggregation functions normally return the result as Object[].

JPA 쿼리는 Entity 객체를 결과로 만들지만 집계 함수가 있는 쿼리의 경우 Object 배열을 반환한다고 합니다. 
Object 배열을 반환하는 메소드와 테스크 코드를 작성해보았습니다. 

##### ItemRepository 인터페이스

```java
interface ItemRepository extends JpaRepository<Item, Long> {

    // ...

    @Query(value = "SELECT SUM(CASE WHEN NAME = 'A' THEN 1 ELSE 0 END) AS aCount, "
        + " SUM(CASE WHEN NAME = 'B' THEN 1 ELSE 0 END) AS bCount, "
        + " SUM(CASE WHEN NAME = 'C' THEN 1 ELSE 0 END) AS cCount, "
        + " SUM(CASE WHEN NAME = 'D' THEN 1 ELSE 0 END) AS dCount, "
        + " SUM(CASE WHEN NAME = 'E' THEN 1 ELSE 0 END) AS eCount"
        + " FROM TB_ITEM GROUP BY NAME", nativeQuery = true)
    List<Object[]> findItemNameGroupUsingObjectArray();
}
```

##### 테스트 코드
- 테스트 수행 시 출력되는 로그와 데이터베이스에 저장된 데이터를 비교해보겠습니다. 

```java
@Log4j2
@SpringBootTest
public class GroupByTest {

    @Autowired
    private ItemRepository itemRepository;

    @BeforeEach
    public void beforeEach() {
        itemRepository.deleteAll();
        for (int index = 0; index < 20; index++) {
            itemRepository.save(new Item(String.valueOf((char) ('A' + new Random().nextInt(5)))));
        }
    }

    // ...

    @Test
    public void test_doesNotThrowException_usingObjectArray() {
        assertDoesNotThrow(() -> itemRepository.findItemNameGroupUsingObjectArray());
        itemRepository.findItemNameGroupUsingObjectArray().stream().forEach(objects -> {
            StringBuffer buffer = new StringBuffer("[");
            for (Object obj : objects) {
                buffer.append(obj).append(", ");
            }
            log.info(buffer.append("]"));
        });
    }
}
```

##### 테스트 결과
- 결과 값으로 반환되는 Object 배열에는 GROUP BY 된 결과가 저장되어 있음을 확인할 수 있습니다.

<p align="left"><img src="/images/spring-data-jpa-group-by-2.JPG" width="45%"></p>

```
2021-06-21 22:22:53.468  INFO 18172 --- [           main] blog.in.action.groupby.GroupByTest       : [3, 0, 0, 0, 0, ]
2021-06-21 22:22:53.468  INFO 18172 --- [           main] blog.in.action.groupby.GroupByTest       : [0, 4, 0, 0, 0, ]
2021-06-21 22:22:53.468  INFO 18172 --- [           main] blog.in.action.groupby.GroupByTest       : [0, 0, 3, 0, 0, ]
2021-06-21 22:22:53.468  INFO 18172 --- [           main] blog.in.action.groupby.GroupByTest       : [0, 0, 0, 5, 0, ]
2021-06-21 22:22:53.468  INFO 18172 --- [           main] blog.in.action.groupby.GroupByTest       : [0, 0, 0, 0, 5, ]
```

## Custom Class With JPQL
JPQL(Java Persistence Query Language) 문법을 이용하면 사용자가 원하는 클래스를 사용할 수 있습니다. 
JpaRepository 메소드의 반환 타입으로는 위 테스트에서 사용한 ItemNameGroupVo 클래스를 그대로 이용하였습니다. 
반환 타입으로 Object 배열이 아닌 구체적인 타입을 받아서 사용하니 코드 가독성이 향상됩니다.

##### ItemRepository 인터페이스

```java
interface ItemRepository extends JpaRepository<Item, Long> {

    // ...

    @Query("SELECT new blog.in.action.groupby.ItemNameGroupVo("
        + " SUM(CASE WHEN i.name = 'A' THEN 1 ELSE 0 END), "
        + " SUM(CASE WHEN i.name = 'B' THEN 1 ELSE 0 END), "
        + " SUM(CASE WHEN i.name = 'C' THEN 1 ELSE 0 END), "
        + " SUM(CASE WHEN i.name = 'D' THEN 1 ELSE 0 END), "
        + " SUM(CASE WHEN i.name = 'E' THEN 1 ELSE 0 END)) "
        + " FROM Item i GROUP BY i.name")
    List<ItemNameGroupVo> findItemNameGroupUsingClassWithJpql();
}
```

##### 테스트 코드 
- ConverterNotFoundException이 감지되는지 확인하기 위해 assertThrows 메소드를 사용합니다.

```java
@Log4j2
@SpringBootTest
public class GroupByTest {

    @Autowired
    private ItemRepository itemRepository;

    @BeforeEach
    public void beforeEach() {
        itemRepository.deleteAll();
        for (int index = 0; index < 20; index++) {
            itemRepository.save(new Item(String.valueOf((char) ('A' + new Random().nextInt(5)))));
        }
    }
    
    // ...

    @Test
    public void test_getResult_usingClassWithJpql() {
        itemRepository.findItemNameGroupUsingClassWithJpql().stream().forEach(itemNameGroupVo -> {
            StringBuffer buffer = new StringBuffer("[");
            buffer.append(itemNameGroupVo).append(", ");
            log.info(buffer.append("]"));
        });
    }
}
```

##### 테스트 결과

```
2021-06-22 03:32:06.507  INFO 15176 --- [           main] blog.in.action.groupby.GroupByTest       : [ItemNameGroupVo(aCount=4, bCount=0, cCount=0, dCount=0, eCount=0), ]
2021-06-22 03:32:06.508  INFO 15176 --- [           main] blog.in.action.groupby.GroupByTest       : [ItemNameGroupVo(aCount=0, bCount=4, cCount=0, dCount=0, eCount=0), ]
2021-06-22 03:32:06.508  INFO 15176 --- [           main] blog.in.action.groupby.GroupByTest       : [ItemNameGroupVo(aCount=0, bCount=0, cCount=5, dCount=0, eCount=0), ]
2021-06-22 03:32:06.508  INFO 15176 --- [           main] blog.in.action.groupby.GroupByTest       : [ItemNameGroupVo(aCount=0, bCount=0, cCount=0, dCount=4, eCount=0), ]
2021-06-22 03:32:06.508  INFO 15176 --- [           main] blog.in.action.groupby.GroupByTest       : [ItemNameGroupVo(aCount=0, bCount=0, cCount=0, dCount=0, eCount=3), ]
```

## Interface With Native Query
Native Query를 사용하면서 명시적이고 가독성 높은 코드를 작성하고 싶었습니다. 
문제를 해결하기 위해 이 방법을 사용했습니다. 
구체적인 클래스가 아닌 인터페이스를 사용하지만 집계 정보를 보여주는 조회성 화면이기 때문에 단순한 Getter만 있어도 사용에는 문제가 없었습니다. 

##### ItemNameGroup 인터페이스

```java
@Getter
@Setter
@NoArgsConstructor
@ToString
class ItemNameGroupVo {

    long aCount;
    long bCount;
    long cCount;
    long dCount;
    long eCount;
}
```

##### ItemRepository 인터페이스

```java
interface ItemRepository extends JpaRepository<Item, Long> {

    // ..

    @Query(value = "SELECT SUM(CASE WHEN NAME = 'A' THEN 1 ELSE 0 END) AS aCount, "
        + " SUM(CASE WHEN NAME = 'B' THEN 1 ELSE 0 END) AS bCount, "
        + " SUM(CASE WHEN NAME = 'C' THEN 1 ELSE 0 END) AS cCount, "
        + " SUM(CASE WHEN NAME = 'D' THEN 1 ELSE 0 END) AS dCount, "
        + " SUM(CASE WHEN NAME = 'E' THEN 1 ELSE 0 END) AS eCount"
        + " FROM TB_ITEM GROUP BY NAME", nativeQuery = true)
    List<ItemNameGroup> findItemNameGroupUsingInterfaceWithNative();
}
```

##### 테스트 코드 

```java
@Log4j2
@SpringBootTest
public class GroupByTest {

    @Autowired
    private ItemRepository itemRepository;

    @BeforeEach
    public void beforeEach() {
        itemRepository.deleteAll();
        for (int index = 0; index < 20; index++) {
            itemRepository.save(new Item(String.valueOf((char) ('A' + new Random().nextInt(5)))));
        }
    }

    // ..

    @Test
    public void test_getResult_usingInterfaceWithNative() {
        assertDoesNotThrow(() -> itemRepository.findItemNameGroupUsingInterfaceWithNative());
        itemRepository.findItemNameGroupUsingInterfaceWithNative().stream().forEach(itemNameGroup -> {
            StringBuffer buffer = new StringBuffer("[");
            buffer.append(itemNameGroup.getACount()).append(", ");
            buffer.append(itemNameGroup.getBCount()).append(", ");
            buffer.append(itemNameGroup.getCCount()).append(", ");
            buffer.append(itemNameGroup.getDCount()).append(", ");
            buffer.append(itemNameGroup.getECount()).append("");
            log.info(buffer.append("]"));
        });
    }
}
```

##### 테스트 결과

```
2021-06-22 03:48:23.324  INFO 13756 --- [           main] blog.in.action.groupby.GroupByTest       : [4, 0, 0, 0, 0]
2021-06-22 03:48:23.325  INFO 13756 --- [           main] blog.in.action.groupby.GroupByTest       : [0, 4, 0, 0, 0]
2021-06-22 03:48:23.325  INFO 13756 --- [           main] blog.in.action.groupby.GroupByTest       : [0, 0, 5, 0, 0]
2021-06-22 03:48:23.326  INFO 13756 --- [           main] blog.in.action.groupby.GroupByTest       : [0, 0, 0, 2, 0]
2021-06-22 03:48:23.326  INFO 13756 --- [           main] blog.in.action.groupby.GroupByTest       : [0, 0, 0, 0, 5]
```

## OPINION
테스트 결과는 매번 랜덤한 값이 사용되기 때문에 테스트 결과는 다를 수 있습니다. 
이번 포스트를 통해 정리한 JPA의 새로운 기능에 대한 내용은 시간이 될 때 팀원들에게 공유해야겠습니다.  

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action>

#### REFERENCE
- <https://algorithmstudy-mju.tistory.com/153>
- <https://www.baeldung.com/jpa-queries-custom-result-with-aggregation-functions>