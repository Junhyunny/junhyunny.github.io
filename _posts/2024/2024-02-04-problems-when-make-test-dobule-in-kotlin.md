---
title: "Problems when make test double in Kotlin"
search: false
category:
  - kotlin
  - mockito
last_modified_at: 2024-02-04T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Test Double][test-double-link]

## 0. 들어가면서

코틀린(kotlin)은 자바(java)를 기반으로 만든 언어이기 때문에 서로 호환된다. 하지만 엄밀히 같은 언어는 아니기 때문에 완벽하게 호환되진 않는다. 이번 글은 테스트 코드를 작성할 때 자바와 다르게 에러가 발생한 부분에 대해 정리했다.

## 1. Problem Context

문제가 발생한 상황은 다음과 같다.

- 코틀린을 사용한다.
- 테스트 도구로 모키토(mockito)를 사용한다.
- spy 메소드로 테스트 더블을 만든다. 

자바를 사용할 때 전혀 문제를 못 느꼈는데, 코틀린으로 작성할 때 에러가 발생한 부분이다. 예시를 위해 간단한 클래스가 필요하다. 다음과 같은 TodoService 클래스가 존재한다.

```kotlin
package blog.`in`.action.service

import org.springframework.stereotype.Service
import java.time.LocalDate

@Service
class TodoService {

    fun getTodos(): List<String> {
        return listOf("Hello", "World")
    }

    fun getTodo(id: Long): String {
        return "Hello"
    }

    fun getTodosInToday(localDate: LocalDate): List<String> {
        return listOf("Hello", "World", localDate.toString())
    }

    fun getFilteredTodosInToday(ids: List<Long>, localDate: LocalDate): List<String> {
        return listOf("Hello", "World", ids.size.toString(), localDate.toString())
    }
}
```

인스턴스 파라미터를 받는 getTodosInToday, getFilteredTodosInToday 메소드의 테스트 코드를 작성할 때 문제가 발생했다. 예를 들어 다음과 같은 테스트 코드를 실행하면 에러가 발생한다.

```kotlin
class TodoServiceTest {

    lateinit var todoService: TodoService

    @BeforeEach
    fun setUp() {
        todoService = spy(TodoService::class.java)
    }

    @Test
    fun doReturnWithInstanceParameter_wrappedEq() {

        val now = LocalDate.now()
        Mockito.doReturn(listOf("Stub"))
            .`when`(todoService)
            .getTodosInToday(eq(now))


        val result = todoService.getTodosInToday(now)


        assertEquals(result, listOf("Stub"))
    }
}
```

NullPointerException 예외가 발생한다. 

```
java.lang.NullPointerException: eq(...) must not be null
    at blog.in.action.TodoServiceTest.doReturnWithInstanceParameter_wrappedEq(TodoServiceTest.kt:98)
    at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
    at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)
...
```

## 2. Solve the problem

예외 메시지를 보고 상당히 혼란스러웠다. `eq(...)`가 포함된 예외 메시지 때문에 처음엔 모키토가 자바 언어를 주로 서포트하기 때문에 코틀린과 호환이 잘 안되는 문제인 줄 알았다. 몇 가지 케이스들을 더 만들어 비교하다보니 코틀린 언어의 구조적인 문제라고 결론 지었다. 먼저 eq 메소드를 살펴보자.

- 전달 받은 파라미터를 매처(matcher)로 등록한다.
- 파라미터가 null 값인 경우 null 값을 반환한다.
- 파라미터가 null 값이 아닌 경우 원시 타입인지 확인 후 기본 값을 반환한다.

```java
    public static <T> T eq(T value) {
        reportMatcher(new Equals(value));
        return value == null ? null : Primitives.defaultValue(value.getClass());
    }
```

위에서 살펴본 테스트의 경우 파라미터 타입이 LocalDate 클래스이기 때문에 eq 메소드 실행 결과는 null 값이다. 여기서 코틀린과 충돌하는 부분이 생긴다. 결국 반환된 null 값은 TodoService 객체에 getTodosInToday 메소드에 전달된다. getTodosInToday 메소드 시그니처(signature)를 다시 살펴보자. 

```kotlin
    fun getTodosInToday(localDate: LocalDate): List<String> {
        return listOf("Hello", "World", localDate.toString())
    }
```

자바라면 문제가 되지 않지만, 코틀린은 파라미터 타입이 문제가 된다. 문제를 한 눈에 파악했다면 당신은 코틀린이 익숙한 사람일게 분명하다. 코틀린은 옵셔널(optional) 처리를 하지 않은 경우 null 값을 가질 수 없다. eq 메소드를 반환된 null 값과 코틀린 메소드 시그니처가 충돌한 것이다. 이 문제를 해결하려면 다음과 같은 두 가지 옵션을 선택할 수 있다.

- 테스트 코드에서 eq 메소드 사용하지 않기
- 구현체 메소드 시그니처를 옵셔널로 변경하기

### 2.1. Do not use eq method

메소드 시그니처를 변경하지 않더라도 다음과 같은 테스트는 정상적으로 통과한다. 

- 동일한 파라미터를 직접 전달한다.
- 반드시 동일한 인스턴스일 필요는 없다. 
  - equals 메소드로 비교했을 때 같다고 판정된다면 다른 인스턴스여도 상관 없다. 

```kotlin
    @Test
    fun doReturnWithInstanceParameter() {

        val now = LocalDate.now()
        Mockito.doReturn(listOf("Stub"))
            .`when`(todoService)
            .getTodosInToday(now)


        val result = todoService.getTodosInToday(now)


        assertEquals(result, listOf("Stub"))
    }
```

### 2.2. Change method signature

구현체 클래스 메소드 시그니처를 옵셔널로 변경하면 테스트가 정상적으로 통과한다. 

```kotlin
    fun getTodosInToday(localDate: LocalDate?): List<String> {
        return listOf("Hello", "World", localDate.toString())
    }
```

테스트 코드는 문제 상황과 마찬가지로 eq 메소드를 사용하고 있다.

```kotlin
    @Test
    fun doReturnWithInstanceParameter_wrappedEq() {

        val now = LocalDate.now()
        Mockito.doReturn(listOf("Stub"))
            .`when`(todoService)
            .getTodosInToday(eq(now))


        val result = todoService.getTodosInToday(now)


        assertEquals(result, listOf("Stub"))
    }
```

필자는 메소드 시그니처를 옵셔널로 변경하는 것이 바람직하다고 생각하지 않지만, 위처럼 eq 메소드를 사용할 수 밖에 없는 상황도 발생한다. any, anyList 메소드처럼 파라미터를 신경쓰지 않는 매처 메소드를 사용할 땐 다른 파라미터들도 모두 eq 메소드로 감싸야만 한다. 그렇지 않은 경우 다음과 같은 에러 메시지를 볼 수 있다. 

```
org.mockito.exceptions.misusing.InvalidUseOfMatchersException: 
Invalid use of argument matchers!
2 matchers expected, 1 recorded:
-> at blog.in.action.TodoServiceTest.doReturnWithInstanceTwoParameters(TodoServiceTest.kt:128)

This exception may occur if matchers are combined with raw values:
    //incorrect:
    someMethod(any(), "raw String");
When using matchers, all arguments have to be provided by matchers.
For example:
    //correct:
    someMethod(any(), eq("String by matcher"));

For more info see javadoc for Matchers class.

    at blog.in.action.service.TodoService.getFilteredTodosInToday(TodoService.kt:22)
    at blog.in.action.TodoServiceTest.doReturnWithInstanceTwoParameters(TodoServiceTest.kt:128)
    at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
...
```

그런 경우 어쩔 수 없이 구현체 메소드 시그니처를 옵셔널로 변경한다. 구현체 클래스의 getFilteredTodosInToday 메소드를 예시로 살펴보자. 

- 두 번째 파라미터 타입을 옵셔널로 변경한다.

```kotlin
@Service
class TodoService {

    fun getFilteredTodosInToday(ids: List<Long>, localDate: LocalDate?): List<String> {
        return listOf("Hello", "World", ids.size.toString(), localDate.toString())
    }
}
```

다음 테스트가 정상적으로 통과한다.

```kotlin
    @Test
    fun doReturnWithInstanceTwoParameters() {

        val now = LocalDate.now()
        Mockito.doReturn(listOf("Stub"))
            .`when`(todoService)
            .getFilteredTodosInToday(anyList(), eq(now))


        val result = todoService.getFilteredTodosInToday(listOf(1L), now)


        assertEquals(result, listOf("Stub"))
    }
```

## CLOSING

비즈니스적으로 null 값을 가질 일이 없기 때문에 파라미터를 옵셔널로 받지 않는 메소드 시그니처를 테스트를 위해 변경하는 것은 불합리한 것 같다. 테스트 코드 때문에 비즈니스 로직에 불필요한 옵셔널 처리가 들어가는 것보다 파라미터를 특정하여 테스트를 작성하는 것이 더 바람직하다고 보여진다. 추가적으로 eq 메소드 외에도 다음과 같은 any, isA 메소드들도 null 값을 반환하므로 주의하기 바란다.

```java
    public static <T> T any() {
        reportMatcher(Any.ANY);
        return null;
    }

    public static <T> T any(Class<T> type) {
        reportMatcher(new InstanceOf(type, "<any " + type.getCanonicalName() + ">"));
        return Primitives.defaultValue(type);
    }

    public static <T> T isA(Class<T> type) {
        reportMatcher(new InstanceOf(type));
        return Primitives.defaultValue(type);
    }
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-02-05-problems-when-make-test-dobule-in-kotlin>

[test-double-link]: https://junhyunny.github.io/information/test-driven-development/test-double/
