---
title: "Problem of deserialization in GenericJackson2JsonRedisSerializer class"
search: false
category:
  - java
  - spring-boot
  - redis
  - test-container
last_modified_at: 2024-03-23T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [TestContainer for Database][test-container-for-database-link]

## 0. 들어가면서

레디스 템플릿(redis template)으로 데이터를 캐싱할 때 역직렬화하는 과정에서 발생한 에러에 대해 정리했다. 이번 글에선 테스트 컨테이너를 사용해 상황을 재현했다. 테스트 컨테이너에 대한 개념을 모른다면 이전 글을 참고하길 바란다. 

## 1. Problem Context

API 요청으로 조회한 데이터를 레디스 캐시에 저장했다. 캐시에 저장할 땐 문제가 없었지만, 저장한 데이터를 캐시에서 꺼낼 때 문제가 발생했다. 아래 테스트 코드를 살펴보자. 

1. `list` 객체를 조회한 데이터 리스트라고 가정한다.
2. 리스트 객체에 담긴 아이템들의 아이디로 구성된 리스트를 레디스에 저장한다.
3. 레디스에서 데이터를 꺼낼 때 SerializationException 예외가 발생한다.

```java
package blog.in.action;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.SerializationException;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

import static org.junit.Assert.assertThrows;

@Testcontainers
@SpringBootTest
class ActionInBlogApplicationTests {

    @Container
    @ServiceConnection
    static GenericContainer<?> redisContainer = new GenericContainer<>(DockerImageName.parse("redis:latest")).withExposedPorts(6379);

    @Autowired
    RedisTemplate<String, Object> sut;

    @Test
    void setListFromStream_throwsSerializationException() {
        var KEY = "LIST_FROM_STREAM";
        var list = new ArrayList<Item>(); // 1
        list.add(new Item(1, "Hello"));
        list.add(new Item(2, "World"));
        sut.opsForValue().set(
                KEY,
                list.stream()
                        .map(Item::id)
                        .toList() // 2
        );


        var throwable = assertThrows(SerializationException.class, () -> sut.opsForValue().get(KEY)); // 3
        System.out.println(throwable.getMessage());
    }
}

record Item(int id, String value) {
}
```

예외 객체의 메세지를 로그로 출력하면 다음과 같은 메세지를 볼 수 있다. 

```
Could not read JSON:Could not resolve type id '1' as a subtype of `java.lang.Object`: no such class found
 at [Source: (byte[])"[1,2]"; line: 1, column: 4] 
```

## 2. Solve the problem

문제의 원인을 살펴보자. 

### 2.1. Cause of the problem

필자는 레디스 템플릿의 직렬화, 역직렬화 모듈로 `GenericJackson2JsonRedisSerializer` 클래스를 사용했다. 

```java
package blog.in.action.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class AppConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }
}
```

GenericJackson2JsonRedisSerializer 클래스는 원시(primitive) 타입이나 문자열은 값만 직렬화한다. 문자열 값을 직렬화한 바이트 배열을 문자열로 만들면 다음과 같다.

```
""Hello""
```

정수를 직렬화한 바이트 배열을 문자열로 만들면 다음과 같다.

```
"1"
```

객체가 직렬 대상인 경우 대상 객체의 타입이나 클래스 이름을 힌트로 함께 바이트 배열에 담긴다. 먼저 ArrayList 객체를 살펴보자.

```
"["java.util.ArrayList",[1,2,3]]"
```

HashSet 객체는 다음과 같이 직렬화된다.

```
"["java.util.HashSet",[1,2,3]]"
```

일반적인 객체는 다음과 같이 직렬화된다.

```
"{"@class":"blog.in.action.Item","id":1,"value":"Hello"}"
```

위 예시들은 역직렬화하는 과정에서 문제가 없지만, 배열의 경우 문제가 발생한다. `new int[]{1, 2, 3, 4, 5}` 같은 배열 객체를 직렬화하면 다음과 같은 값을 가진다. 

```
"[1,2,3,4,5]"
```

타입 정보 없이 직렬화 된 객체는 역직렬화할 때 문제가 발생한다. 스트림(stream)의 컬렉터(collector) 기능이나 List, Set 인터페이스의 `of` 정적 팩토리 메소드를 사용하면 AbstractImmutableCollection 구현체 클래스들이 사용된다. 이 객체들이 직접 직렬화되면 배열과 동일한 모습을 갖는다. 다음과 같은 케이스들은 모두 역직렬화되는 시점에 에러가 발생한다.

```java
    @Test
    void setListFromStream_throwsSerializationException() {
        var KEY = "LIST_FROM_STREAM";
        var list = new ArrayList<Item>();
        list.add(new Item(1, "Hello"));
        list.add(new Item(2, "World"));
        sut.opsForValue().set(
                KEY,
                list.stream()
                        .map(Item::id)
                        .toList()
        );


        var throwable = assertThrows(SerializationException.class, () -> sut.opsForValue().get(KEY));
        System.out.println(throwable.getMessage());
    }

    @Test
    void setArray_throwsSerializationException() {
        var KEY = "ARRAY";
        sut.opsForValue().set(KEY, new int[]{1, 2, 3, 4, 5});


        var throwable = assertThrows(SerializationException.class, () -> sut.opsForValue().get(KEY));
        System.out.println(throwable.getMessage());
    }

    @Test
    void setIntegerList_throwsSerializationException() {
        var KEY = "INTEGER_LIST";
        sut.opsForValue().set(KEY, List.of(1, 2, 3, 4, 5));


        var throwable = assertThrows(SerializationException.class, () -> sut.opsForValue().get(KEY));
        System.out.println(throwable.getMessage());
    }

    @Test
    void setItemList_throwsSerializationException() {
        var KEY = "ITEM_LIST";
        sut.opsForValue().set(KEY, List.of(new Item(1, "Hello"), new Item(2, "World")));


        var throwable = assertThrows(SerializationException.class, () -> sut.opsForValue().get(KEY));
        System.out.println(throwable.getMessage());
    }
```

### 2.2. Wrap array object

배열을 다른 객체로 감싸면 문제가 해결된다. 다음과 같은 래핑 클래스를 만든다. 

```java
record WrappedList<T>(List<T> items) {
}
```

of 메소드로 생성한 리스트를 래핑 클래스 객체로 감싸서 캐시에 저장하고 꺼내 확인한다.

```java
    @Test
    void setWrappedList() {
        var KEY = "WRAPPED_LIST";
        sut.opsForValue().set(KEY, new WrappedList<>(List.of(1, 2, 3, 4, 5)));


        var result = sut.opsForValue().get(KEY);
        Assertions.assertEquals(new WrappedList<>(List.of(1, 2, 3, 4, 5)), result);
    }
```

직렬화 된 모습은 다음과 같다. 래핑 클래스 정보와 해당 리스트 객체의 타입 정보도 함께 직렬화 된 것을 확인할 수 있다.

```
"{"@class":"blog.in.action.WrappedList","items":["java.util.ImmutableCollections$ListN",[1,2,3,4,5]]}"
```

래핑 클래스를 만들지 않고 리스트를 그대로 캐시에 저장하고 사용하려면 ArrayList 클래스의 생성자를 사용하는 것도 가능하다.

```java
    @Test
    void setIntegerArrayList() {
        var KEY = "INTEGER_ARRAYLIST";
        sut.opsForValue().set(KEY, new ArrayList<>(List.of(1, 2, 3, 4, 5)));


        var result = sut.opsForValue().get(KEY);
        Assertions.assertEquals(new ArrayList<>(List.of(1, 2, 3, 4, 5)), result);
    }
```

배열도 래핑 클래스를 사용하면 역직렬화 문제가 발생하지 않는다. 다음과 같은 래핑 클래스를 만든다.

```java
record WrappedArray(int[] items) {
}
```

정수 배열을 래핑 객체에 감싸 캐시에 저장하고 꺼내 확인한다.

```java
    @Test
    void setWrappedArray() {
        var KEY = "WRAPPED_ARRAY";
        sut.opsForValue().set(KEY, new WrappedArray(new int[]{1, 2, 3, 4, 5}));


        var result = (WrappedArray) sut.opsForValue().get(KEY);
        assert result != null;
        Assertions.assertArrayEquals(new int[]{1, 2, 3, 4, 5}, result.items());
    }
```

직렬화 된 모습은 다음과 같다. 배열에 대한 타입 정보는 없지만, 정상적으로 역직렬화를 수행한다.

```
"{"@class":"blog.in.action.WrappedArray","items":[1,2,3,4,5]}"
```

## CLOSING

GenericJackson2JsonRedisSerializer 클래스를 직렬화 모듈로 사용하는 경우 발생하는 이슈이기 때문에 레디스 템플릿을 직접 사용하는 경우 뿐만 아니라 @Cacheable 애너테이션처럼 레디스를 캐시로 사용하는 기능에도 동일한 문제가 발생하는 것으로 보인다. 참고 링크를 보면 24년 3월 현재 깃허브 `spring-data-redis` 레포지토리 이슈에서 이 문제를 논의 중인 것으로 보인다. 

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-03-23-redis-generic-jackson-serializer-error>

#### REFERENCE

- <https://github.com/spring-projects/spring-data-redis/issues/2697>
- <https://bcp0109.tistory.com/384>

[test-container-for-database-link]: https://junhyunny.github.io/post-format/test-container-for-database/