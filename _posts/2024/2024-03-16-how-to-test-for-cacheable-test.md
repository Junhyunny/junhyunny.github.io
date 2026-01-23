---
title: "How to test for @Cacheable annotation"
search: false
category:
  - kotlin
  - spring-boot
last_modified_at: 2024-03-16T23:55:00
---

<br/>

## 0. 들어가면서

비즈니스 로직 중 빈번하게 호출되는 쿼리(query)가 있었고, 성능 향상을 위해 캐시를 적용하기로 했다. 스프링 부트(spring boot)는 기본적으로 캐시 기능을 제공한다. @EnableCaching, @Cacheable 애너테이션을 사용하면 쉽게 적용할 수 있다. 이번 글은 @Cacheable 애너테이션을 사용했을 때 캐시가 정상적으로 동작하는지 확인할 수 있는 테스트 방법에 대해 정리했다. 프레임워크가 제공하는 캐시 기능을 테스트하는 코드가 의미가 있는지 없는지 의문이 들지만, 이번 프로젝트에선 테스트 코드를 작성하기로 결정했고 관련된 내용을 기록하기 위해 글로 정리했다. 

## 1. Business Logic

코드는 실제 비즈니스를 다른 도메인으로 각색했다. 다음과 같은 카테고리, 서브 카테고리 아이디를 사용해 관련 상품들을 조회하는 비즈니스 로직이 있다. 자주 검색되는 카테고리 상품 리스트는 캐시를 통해 재사용한다.

- 캐시 이름은 `items`을 사용한다.
- 캐시 키는 카테고리, 서브 카테고리 아이디를 조합해서 사용한다.

```kotlin
package blog.`in`.action.store

import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Repository

@Repository
class ItemStore(private val itemRepository: ItemRepository) {

    @Cacheable(value = ["items"], key = "{#categoryId, #subCategoryId}")
    fun items(categoryId: Int, subCategoryId: Int) = itemRepository.findByCategoryIdAndSubCategoryId(categoryId, subCategoryId)
}
```

## 2. Tests

@Cacheable 애너테이션를 단위 테스트하는 것은 불가능하다. AOP(Aspect Oriented Programming) 내부에서 동작하고 캐시 매니저는 스프링 빈으로 관리되기 때문에 스프링 프레임워크의 지원을 받아야 정상적인 테스트가 가능하다. 그렇기 때문에 다음과 같은 결합 테스트를 준비한다.

- @SpringBootTest 애너테이션을 사용한다.
  - itemStore, cacheManager 인스턴스는 실제 빈을 사용한다.
  - itemRepository 인스턴스는 목(mock) 빈을 사용한다.
- 다른 테스트에서 만든 캐시가 각 테스트에 영향을 주지 않도록 테스트 실행 이전에 캐시를 초기화한다.

```kotlin
package blog.`in`.action.store

import blog.`in`.action.domain.ItemEntity
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.cache.CacheManager

@SpringBootTest
class ItemStoreTest {

    @Autowired
    lateinit var cacheManager: CacheManager

    @MockBean
    lateinit var itemRepository: ItemRepository

    @Autowired
    lateinit var itemStore: ItemStore

    @BeforeEach
    fun setUp() {
        cacheManager.getCache("items")?.clear()
    }

  // ...tests

}
```

다음과 같은 두 개 관점에서 테스트한다.

- 실제로 캐시에 저장되는가?
- 캐시 히트가 일어나면 값을 재사용하는가?

### 2.1. Save Result in Cache

실제로 캐시에 저장되는지 확인하는 테스트 코드이다.

- itemRepository 빈을 스텁(stub)으로 사용한다.
- itemStore 빈을 호출한다.
- 캐시에서 꺼낸 값이 스텁에서 반환한 엔티티와 동일한지 확인한다.

```kotlin
@SpringBootTest
class ItemStoreTest {

    @Autowired
    lateinit var cacheManager: CacheManager

    @MockBean
    lateinit var itemRepository: ItemRepository

    @Autowired
    lateinit var itemStore: ItemStore

    @BeforeEach
    fun setUp() {
        cacheManager.getCache("items")?.clear()
    }

    @Test
    fun saveInCache() {
        `when`(itemRepository.findByCategoryIdAndSubCategoryId(1, 2))
            .thenReturn(listOf(ItemEntity(id = 1, name = "Candy", categoryId = 1, subCategoryId = 2)))


        val result = itemStore.items(1, 2)


        val cache = cacheManager.getCache("items")!!
        val resultInCache = cache.get(listOf(1, 2))?.get() as List<ItemEntity>
        assertEquals(result.size, resultInCache.size)
        assertEquals(result[0].id, resultInCache[0].id)
        assertEquals(result[0].name, resultInCache[0].name)
        assertEquals(result[0].categoryId, resultInCache[0].categoryId)
        assertEquals(result[0].subCategoryId, resultInCache[0].subCategoryId)
    }
}
```

### 2.2. Reuse Result in Cache

캐시 히트가 일어나면 값을 재사용하는지 확인하는 테스트 코드이다.

- itemRepository 빈을 목으로 사용한다.
- itemStore 빈을 2회 호출한다.
- itemRepository 객체의 findByCategoryIdAndSubCategoryId 메서드가 1회만 호출되었는지 확인한다.

```kotlin
@SpringBootTest
class ItemStoreTest {

    @Autowired
    lateinit var cacheManager: CacheManager

    @MockBean
    lateinit var itemRepository: ItemRepository

    @Autowired
    lateinit var itemStore: ItemStore

    @BeforeEach
    fun setUp() {
        cacheManager.getCache("items")?.clear()
    }

    @Test
    fun reuseCache() {
        `when`(itemRepository.findByCategoryIdAndSubCategoryId(1, 2))
            .thenReturn(listOf(ItemEntity(id = 1, name = "Candy", categoryId = 1, subCategoryId = 2)))


        itemStore.items(1, 2)
        itemStore.items(1, 2)


        verify(itemRepository, times(1)).findByCategoryIdAndSubCategoryId(1, 2)
    }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-03-16-how-to-test-for-cacheable-test>

#### REFERENCE

- <https://adjh54.tistory.com/165>
