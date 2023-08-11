---
title: "ConverterNotFoundException when GROUP BY in JPA"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-09-04T06:00:00
---

<br/>

## 0. 들어가면서

통계성 데이터를 만들 때 보통 `GROUP BY`가 포함된 SQL을 사용합니다. 
다음과 같은 상황에서 GROUP BY 키워드가 들어간 쿼리를 사용하니 아래와 같은 에러가 발생하였습니다.  

* `spring-boot-starter-data-jpa` 의존성을 사용
* JpaRepository 인터페이스와 @Query 애너테이션을 통해 `GROUP BY` 키워드가 들어간 쿼리 작성

```
org.springframework.core.convert.ConverterNotFoundException: No converter found capable of converting from type [org.springframework.data.jpa.repository.query.AbstractJpaQuery$TupleConverter$TupleBackedMap] to type [com.geneuin.ksystem.common.domain.vo.ContainerGroupByItemGroup]
```

## 1. The Context of Problem

로그를 살펴보면 지정한 타입으로 쿼리 수행 결과를 변환하지 못하는 문제가 있는 것으로 유추됩니다. 
이번 포스트는 이 문제를 해결할 수 있는 방법들에 대해 정리하였습니다. 
먼저 간단한 예제 코드를 통해 문제 상황을 재현해보겠습니다. 

### 1.1. ItemNameGroupVo Class

쿼리 결과를 다음과 같은 모습의 객체에 담고 싶었습니다.  

```java
package blog.in.action.domain;

import lombok.*;

@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class ItemNameCountVO {
    private long aCount;
    private long bCount;
    private long cCount;
    private long dCount;
}
```

### 1.2. ItemRepository Interface

* 각 이름 별로 통계 결과를 집계합니다.

```java
package blog.in.action.repository;

import blog.in.action.domain.ItemEntity;
import blog.in.action.domain.ItemNameCountProjection;
import blog.in.action.domain.ItemNameCountVO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ItemRepository extends JpaRepository<ItemEntity, Long> {

    @Query(value = """
            SELECT SUM(CASE WHEN item.name = 'A' THEN 1 ELSE 0 END) AS aCount,
                SUM(CASE WHEN item.name = 'B' THEN 1 ELSE 0 END) AS bCount,
                SUM(CASE WHEN item.name = 'C' THEN 1 ELSE 0 END) AS cCount,
                SUM(CASE WHEN item.name = 'D' THEN 1 ELSE 0 END) AS dCount
            FROM ItemEntity item GROUP BY item.name
            """)
    List<ItemNameCountVO> findEachCountGroupByItemName();
}
```

### 1.3. Exception when runtime

해당 쿼리를 실행하면 에러가 발생하는지 확인합니다.

* 테스트는 정상적으로 통과합니다.
* 해당 쿼리 실행 시 ConverterNotFoundException 예외가 발생합니다.

```java
package blog.in.action;

import blog.in.action.domain.ItemEntity;
import blog.in.action.repository.ItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.core.convert.ConverterNotFoundException;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
public class GroupByFailTest {

    @Autowired
    ItemRepository sut;

    @BeforeEach
    void setup() {
        for (int index = 0; index < 20; index++) {
            sut.save(
                    ItemEntity.builder()
                            .name(Character.toString('A' + (index % 4)))
                            .build()
            );
        }
    }

    @Test
    void test() {

        Throwable result = assertThrows(ConverterNotFoundException.class, () -> {
            sut.findEachCountGroupByItemName();
        });


        assertTrue(
                result.getMessage()
                        .contains("No converter found capable of converting from type [org.springframework.data.jpa.repository.query.")
        );
    }
}
```

## 2. Solving the problem

해당 쿼리를 정상적으로 실행시킬 수 있는 방법은 3가지 있습니다. 
하나씩 살펴보겠습니다. 

### 2.1. Using Object Array

> JPA queries typically produce their results as instances of a mapped entity. However, queries with aggregation functions normally return the result as Object[].

JPA 쿼리에 집계 함수가 있는 경우 Object 객체 배열을 반환합니다. 

#### 2.1.1. ItemRepository Interface

다음과 같이 반환 타입을 Object 객체 배열로 변환합니다.

```java
package blog.in.action.repository;

import blog.in.action.domain.ItemEntity;
import blog.in.action.domain.ItemNameCountProjection;
import blog.in.action.domain.ItemNameCountVO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ItemRepository extends JpaRepository<ItemEntity, Long> {

    // ...
    
    @Query(value = """
            SELECT SUM(CASE WHEN item.name = 'A' THEN 1 ELSE 0 END) AS aCount,
                SUM(CASE WHEN item.name = 'B' THEN 1 ELSE 0 END) AS bCount,
                SUM(CASE WHEN item.name = 'C' THEN 1 ELSE 0 END) AS cCount,
                SUM(CASE WHEN item.name = 'D' THEN 1 ELSE 0 END) AS dCount
            FROM ItemEntity item GROUP BY item.name
            """)
    List<Object[]> findEachCountGroupByItemNameWithObjectArray();
}
```

#### 2.1.2. Run Test

쿼리 수행 결과를 확인하고 로그를 출력합니다.

```java
package blog.in.action;

import blog.in.action.domain.ItemEntity;
import blog.in.action.repository.ItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
public class GroupByObjectArrayTest {

    @Autowired
    ItemRepository sut;

    @BeforeEach
    void setup() {
        for (int index = 0; index < 20; index++) {
            sut.save(
                    ItemEntity.builder()
                            .name(Character.toString('A' + (index % 4)))
                            .build()
            );
        }
    }

    void print(List<Object[]> result) {
        for (Object[] array : result) {
            System.out.println(Arrays.stream(array).toList());
        }
    }

    @Test
    void test() {

        var result = sut.findEachCountGroupByItemNameWithObjectArray();


        assertEquals(4, result.size());

        var firstGroupBy = result.get(0);
        assertEquals(5L, firstGroupBy[0]);
        assertEquals(0L, firstGroupBy[1]);
        assertEquals(0L, firstGroupBy[2]);
        assertEquals(0L, firstGroupBy[3]);

        var secondGroupBy = result.get(1);
        assertEquals(0L, secondGroupBy[0]);
        assertEquals(5L, secondGroupBy[1]);
        assertEquals(0L, secondGroupBy[2]);
        assertEquals(0L, secondGroupBy[3]);

        var thirdGroupBy = result.get(2);
        assertEquals(0L, thirdGroupBy[0]);
        assertEquals(0L, thirdGroupBy[1]);
        assertEquals(5L, thirdGroupBy[2]);
        assertEquals(0L, thirdGroupBy[3]);

        var fourthGroupBy = result.get(3);
        assertEquals(0L, fourthGroupBy[0]);
        assertEquals(0L, fourthGroupBy[1]);
        assertEquals(0L, fourthGroupBy[2]);
        assertEquals(5L, fourthGroupBy[3]);

        print(result);
    }
}
```

##### Result of Test

* 다음과 같은 실행 결과를 얻습니다.

```
OpenJDK 64-Bit Server VM warning: Sharing is only supported for boot loader classes because bootstrap classpath has been appended
Hibernate: select next value for tb_item_seq
Hibernate: select next value for tb_item_seq
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: select sum(case when i1_0.name='A' then 1 else 0 end),sum(case when i1_0.name='B' then 1 else 0 end),sum(case when i1_0.name='C' then 1 else 0 end),sum(case when i1_0.name='D' then 1 else 0 end) from tb_item i1_0 group by i1_0.name
[5, 0, 0, 0]
[0, 5, 0, 0]
[0, 0, 5, 0]
[0, 0, 0, 5]
```

### 2.2. Using Custom Class

JPQL(Java Persistence Query Language) 문법을 사용하면 사용자가 원하는 클래스를 사용할 수 있습니다. 
반환 타입으로 Object 배열을 사용하지 않으므로 코드의 가독성이 높아집니다. 

#### 2.2.1. ItemRepository Interface

```java
package blog.in.action.repository;

import blog.in.action.domain.ItemEntity;
import blog.in.action.domain.ItemNameCountProjection;
import blog.in.action.domain.ItemNameCountVO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ItemRepository extends JpaRepository<ItemEntity, Long> {

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

#### 2.2.2. Run Test 

```java
package blog.in.action;

import blog.in.action.domain.ItemEntity;
import blog.in.action.domain.ItemNameCountVO;
import blog.in.action.repository.ItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
public class GroupByCustomClassTest {

    @Autowired
    ItemRepository sut;

    @BeforeEach
    void setup() {
        for (int index = 0; index < 20; index++) {
            sut.save(
                    ItemEntity.builder()
                            .name(Character.toString('A' + (index % 4)))
                            .build()
            );
        }
    }

    void print(List<ItemNameCountVO> result) {
        for (ItemNameCountVO vo : result) {
            System.out.println(vo);
        }
    }

    @Test
    void test() {

        var result = sut.findEachCountGroupByItemNameWithCustomClass();


        assertEquals(4, result.size());

        var firstItem = result.get(0);
        assertEquals(5L, firstItem.getACount());
        assertEquals(0L, firstItem.getBCount());
        assertEquals(0L, firstItem.getCCount());
        assertEquals(0L, firstItem.getDCount());

        var secondItem = result.get(1);
        assertEquals(0L, secondItem.getACount());
        assertEquals(5L, secondItem.getBCount());
        assertEquals(0L, secondItem.getCCount());
        assertEquals(0L, secondItem.getDCount());

        var thirdItem = result.get(2);
        assertEquals(0L, thirdItem.getACount());
        assertEquals(0L, thirdItem.getBCount());
        assertEquals(5L, thirdItem.getCCount());
        assertEquals(0L, thirdItem.getDCount());

        var fourthItem = result.get(3);
        assertEquals(0L, fourthItem.getACount());
        assertEquals(0L, fourthItem.getBCount());
        assertEquals(0L, fourthItem.getCCount());
        assertEquals(5L, fourthItem.getDCount());

        print(result);
    }
}
```

##### Result of Test

* 다음과 같은 실행 결과를 얻습니다.

```
OpenJDK 64-Bit Server VM warning: Sharing is only supported for boot loader classes because bootstrap classpath has been appended
Hibernate: select next value for tb_item_seq
Hibernate: select next value for tb_item_seq
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: select sum(case when i1_0.name='A' then 1 else 0 end),sum(case when i1_0.name='B' then 1 else 0 end),sum(case when i1_0.name='C' then 1 else 0 end),sum(case when i1_0.name='D' then 1 else 0 end) from tb_item i1_0 group by i1_0.name
ItemNameCountVO(aCount=5, bCount=0, cCount=0, dCount=0)
ItemNameCountVO(aCount=0, bCount=5, cCount=0, dCount=0)
ItemNameCountVO(aCount=0, bCount=0, cCount=5, dCount=0)
ItemNameCountVO(aCount=0, bCount=0, cCount=0, dCount=5)
```

### 2.3. Using Projection Interface

프로젝션을 위한 인터페이스를 선언하는 방법이 있습니다. 
인터페이스에 접근자 함수(getter)만 선언되어 있으면 해당 값에 접근할 수 있습니다. 
다만 쿼리 결과 컬럼들에 별칭(alias)를 맞춰서 작성해야합니다. 

#### 2.3.1. ItemNameCountProjection Interface

* 결과 값 출력을 위한 string() 함수를 정의합니다. 

```java
package blog.in.action.domain;

public interface ItemNameCountProjection {
    long getACount();

    long getBCount();

    long getCCount();

    long getDCount();

    default String string() {
        return String.format(
                "ItemNameCountProjection(%s, %s, %s, %s)",
                this.getACount(),
                this.getBCount(),
                this.getCCount(),
                this.getDCount()
        );
    }
}
```

#### 2.3.2. ItemRepository Interface

```java
package blog.in.action.repository;

import blog.in.action.domain.ItemEntity;
import blog.in.action.domain.ItemNameCountProjection;
import blog.in.action.domain.ItemNameCountVO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ItemRepository extends JpaRepository<ItemEntity, Long> {

    // ...

    @Query(value = """
            SELECT SUM(CASE WHEN item.name = 'A' THEN 1 ELSE 0 END) AS aCount,
               SUM(CASE WHEN item.name = 'B' THEN 1 ELSE 0 END) AS bCount,
               SUM(CASE WHEN item.name = 'C' THEN 1 ELSE 0 END) AS cCount,
               SUM(CASE WHEN item.name = 'D' THEN 1 ELSE 0 END) AS dCount
            FROM TB_ITEM item GROUP BY item.name
            """, nativeQuery = true)
    List<ItemNameCountProjection> findEachCountGroupByItemNameWithProjection();
}
```

#### 2.3.3. Run Test

```java
package blog.in.action;

import blog.in.action.domain.ItemEntity;
import blog.in.action.domain.ItemNameCountProjection;
import blog.in.action.repository.ItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
public class GroupByProjectionInterfaceTest {

    @Autowired
    ItemRepository sut;

    @BeforeEach
    void setup() {
        for (int index = 0; index < 20; index++) {
            sut.save(
                    ItemEntity.builder()
                            .name(Character.toString('A' + (index % 4)))
                            .build()
            );
        }
    }

    void print(List<ItemNameCountProjection> result) {
        for (ItemNameCountProjection projection : result) {
            System.out.println(projection.string());
        }
    }

    @Test
    void test() {

        var result = sut.findEachCountGroupByItemNameWithProjection();


        assertEquals(4, result.size());

        var firstItem = result.get(0);
        assertEquals(5L, firstItem.getACount());
        assertEquals(0L, firstItem.getBCount());
        assertEquals(0L, firstItem.getCCount());
        assertEquals(0L, firstItem.getDCount());

        var secondItem = result.get(1);
        assertEquals(0L, secondItem.getACount());
        assertEquals(5L, secondItem.getBCount());
        assertEquals(0L, secondItem.getCCount());
        assertEquals(0L, secondItem.getDCount());

        var thirdItem = result.get(2);
        assertEquals(0L, thirdItem.getACount());
        assertEquals(0L, thirdItem.getBCount());
        assertEquals(5L, thirdItem.getCCount());
        assertEquals(0L, thirdItem.getDCount());

        var fourthItem = result.get(3);
        assertEquals(0L, fourthItem.getACount());
        assertEquals(0L, fourthItem.getBCount());
        assertEquals(0L, fourthItem.getCCount());
        assertEquals(5L, fourthItem.getDCount());

        print(result);
    }
}
```

##### Result of Test

```
OpenJDK 64-Bit Server VM warning: Sharing is only supported for boot loader classes because bootstrap classpath has been appended
Hibernate: select next value for tb_item_seq
Hibernate: select next value for tb_item_seq
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: insert into tb_item (name,id) values (?,?)
Hibernate: SELECT SUM(CASE WHEN item.name = 'A' THEN 1 ELSE 0 END) AS aCount,
   SUM(CASE WHEN item.name = 'B' THEN 1 ELSE 0 END) AS bCount,
   SUM(CASE WHEN item.name = 'C' THEN 1 ELSE 0 END) AS cCount,
   SUM(CASE WHEN item.name = 'D' THEN 1 ELSE 0 END) AS dCount
FROM TB_ITEM item GROUP BY item.name

ItemNameCountProjection(5, 0, 0, 0)
ItemNameCountProjection(0, 5, 0, 0)
ItemNameCountProjection(0, 0, 5, 0)
ItemNameCountProjection(0, 0, 0, 5)
```

## CLOSING

QueryDSL 같은 라이브러리를 사용하면 더 쉽게 쿼리를 작성할 수 있습니다. 
쿼리가 점점 복잡해진다면 이를 고려해봐도 좋을 것 같습니다. 

또 JDK13부터 텍스트 블록(""") 기능을 제공하여 쿼리를 작성하는 작업이 더 용이해졌습니다. 
이를 활용하는 것도 복잡한 쿼리를 작성하는데 큰 도움을 줄 것으로 보입니다. 

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-06-22-spring-data-jpa-group-by>

#### REFERENCE

* <https://algorithmstudy-mju.tistory.com/153>
* <https://www.baeldung.com/jpa-queries-custom-result-with-aggregation-functions>   