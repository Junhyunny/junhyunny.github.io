---
title: "Problem to serialize instance with class info in Kotlin ObjectMapper"
search: false
category:
  - spring-boot
  - redis
  - session
last_modified_at: 2025-01-31T23:55:00
---

<br/>

## 0. 들어가면서

자바(java) 애플리케이션은 Json 객체로 직렬화를 수행할 때 `ObjectMapper`를 사용한다. ObjectMapper는 기본적으로 직렬화(serialize)를 수행할 때 클래스 정보를 함께 직렬화하지 않는다. 하지만 역직렬화(deserialize) 할 때 클래스 정보가 필요하다면 직렬화 할 때 클래스 정보를 함께 직렬화해야 하는 경우도 생긴다. 세션을 통해 서로 다른 서비스 간 정보를 공유하는 경우를 대표적인 예로 들 수 있다. 

ObjectMapper는 인스턴스 직렬화를 수행할 때 명시적인 타입 정보를 포함시키는 방법으로 `activateDefaultTyping()` 메소드를 제공한다. 자바에선 정상적으로 클래스 정보가 포함되었는데, 코틀린(kotlin)은 동일한 코드에서 클래스 정보가 포함되지 않았다. 이번 글은 해당 내용에 대해 정리했다.

## 1. Problem Context

간단한 테스트 코드로 ObjectMapper 객체가 동작하는 모습을 살펴보자. 우선 자바 코드를 확인해본다. 아래 코드를 보면 알 수 있듯이 ObjectMapper 객체는 클래스 정보 없이 객체를 Json 객체로 직렬화한다.

```java
package action.in.blog;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class User {

    public User() {
    }
    
    public User(String name) {
        this.name = name;
    }

    private String name;

    public String getName() {
        return name;
    }
}

public class JavaObjectMapperSerializeTest {

    @Test
    void serialize() throws JsonProcessingException {
        var sut = new ObjectMapper();


        var result = sut.writeValueAsString(
                new User("junhyunny") 
        );


        assertEquals(
                """
                {"name":"junhyunny"}""",
                result
        );
    }
}
```

activateDefaultTyping() 메소드를 사용하면 클래스 정보를 함께 직렬화 할 수 있다.

```java
public class JavaObjectMapperSerializeTest {

    // ...

    @Test
    void serializeWithClass() throws JsonProcessingException {
        var sut = new ObjectMapper();
        sut.activateDefaultTyping(
                BasicPolymorphicTypeValidator.builder()
                        .allowIfBaseType(Object.class)
                        .build(),
                ObjectMapper.DefaultTyping.NON_FINAL
        );


        var result = sut.writeValueAsString(
                new User("junhyunny")
        );


        assertEquals(
                """
                ["action.in.blog.User",{"name":"junhyunny"}]""",
                result
        );
    }
}
```

이제 코틀린 코드를 살펴본다. 자바와 동일한 코드이지만, 아래 테스트 코드는 실패한다.

```kotlin
package action.`in`.blog

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

class User(val name: String) {
    constructor() : this("")
}

class KotlinObjectMapperSerializeTest {

    @Test
    fun serializeWithClass() {
        val sut = ObjectMapper()
        sut.activateDefaultTyping(
            BasicPolymorphicTypeValidator.builder()
                .allowIfBaseType(Any::class.java)
                .build(),
            ObjectMapper.DefaultTyping.NON_FINAL
        )


        val result = sut.writeValueAsString(
            User("junhyunny")
        )


        Assertions.assertEquals(
            """
                ["action.in.blog.User",{"name":"junhyunny"}]
            """.trimIndent(),
            result
        )
    }
}
```

테스트 실패의 원인은 아래와 같다.

```
Expected :["action.in.blog.User",{"name":"junhyunny"}]
Actual   :{"name":"junhyunny"}
```

## 2. Solve the problem

코틀린이 익숙한 사용자라면 어디서 문제가 발생하는지 금새 짐작할 수 있다. 나는 코틀린이라는 언어를 깊이 공부하지 않았기 때문에 이 문제의 원인을 짐작하는데 많은 시간이 소요된 것 같다. 라이브러리 문제라고 판단하고 관련된 이슈를 뒤지는 등 헛짓거리를 많이 한 것 같다. 그 대단한 ChatGPT도 계속 잘못된 답변을 내줬다. 

문제의 원인은 코틀린의 클래스 특징에 있었다. 코틀린의 클래스는 기본적으로 `final`이다. 불필요한 상속을 막기 위해 모든 클래스를 final 클래스로 만든다. 

> By default, Kotlin classes are final – they can't be inherited. To make a class inheritable, mark it with the open keyword:

아래 코틀린 코드를 자바 코드로 디컴파일해보자.

```kotlin
class User(val name: String) {
    constructor() : this("")
}
```

아래와 같이 final 클래스로 만들어지는 것을 확인할 수 있다.

```java
@Metadata(
   mv = {1, 9, 0},
   k = 1,
   xi = 48,
   d1 = {"\u0000\u0014\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0004\u0018\u00002\u00020\u0001B\u0007\b\u0016¢\u0006\u0002\u0010\u0002B\r\u0012\u0006\u0010\u0003\u001a\u00020\u0004¢\u0006\u0002\u0010\u0005R\u0011\u0010\u0003\u001a\u00020\u0004¢\u0006\b\n\u0000\u001a\u0004\b\u0006\u0010\u0007¨\u0006\b"},
   d2 = {"Laction/in/blog/User;", "", "()V", "name", "", "(Ljava/lang/String;)V", "getName", "()Ljava/lang/String;", "action-in-blog_test"}
)
public final class User {
   @NotNull
   private final String name;

   public User(@NotNull String name) {
      Intrinsics.checkNotNullParameter(name, "name");
      super();
      this.name = name;
   }

   @NotNull
   public final String getName() {
      return this.name;
   }

   public User() {
      this("");
   }
}
```

이 문제는 단순하게 직렬화 대상 객체의 클래스를 `non final`로 만들면 해결된다. ObjectMapper 객체를 사용해 직렬화 할 때 명시적인 타입 정보를 적용하는 방식이 `DefaultTyping.NON_FINAL`이기 때문에 `final` 타입의 정보는 직렬화에서 제외된다. 그렇기 때문에 User 클래스에 `open` 키워드를 붙이면 테스트가 통과한다.

```kotlin
open class User(val name: String) {
    constructor() : this("")
}

class KotlinObjectMapperSerializeTest {

    @Test
    fun serializeWithClass() {
        val sut = ObjectMapper()
        sut.activateDefaultTyping(
            BasicPolymorphicTypeValidator.builder()
                .allowIfBaseType(Any::class.java)
                .build(),
            ObjectMapper.DefaultTyping.NON_FINAL
        )


        val result = sut.writeValueAsString(
            User("junhyunny")
        )


        Assertions.assertEquals(
            """
                ["action.in.blog.User",{"name":"junhyunny"}]
            """.trimIndent(),
            result
        )
    }
}
```

## 3. How to handle final classes?

자바는 JDK16부터 불변 클래스인 [레코드(record)][record-in-java-link]를 정식 지원하고, 코틀린도 `데이터 클래스(data class)`를 많이 사용한다. 자바의 레코드나 코틀린의 데이터 클래스는 final 클래스이기 때문에 직렬화 할 때 타입 정보가 제외된다. 이 객체들의 직렬화 된 데이터에 타입 정보를 명시하고 싶다면 어떻게 해야 할까? `DefaultTyping.EVERYTHING`을 사용하면 된다.

자바 코드는 다음과 같다.

```java
public class JavaObjectMapperSerializeTest {

    ...

    @Test
    void recordSerializeWithClass() throws JsonProcessingException {
        record RecordUser(String name) {
        }
        var sut = new ObjectMapper();
        sut.activateDefaultTyping(
                BasicPolymorphicTypeValidator.builder()
                        .allowIfBaseType(Object.class)
                        .build(),
                ObjectMapper.DefaultTyping.EVERYTHING
        );


        var result = sut.writeValueAsString(
                new RecordUser("junhyunny")
        );


        assertEquals(
                """
                        ["action.in.blog.JavaObjectMapperSerializeTest$1RecordUser",{"name":"junhyunny"}]""",
                result
        );
    }
}
```

코틀린 코드는 다음과 같다.

```kotlin
class KotlinObjectMapperSerializeTest {

    ... 

    @Test
    fun recordSerializeWithClass() {
        data class DataClassUser(val name: String)
        val sut = ObjectMapper()
        sut.activateDefaultTyping(
            BasicPolymorphicTypeValidator.builder()
                .allowIfBaseType(Any::class.java)
                .build(),
            ObjectMapper.DefaultTyping.EVERYTHING
        )


        val result = sut.writeValueAsString(
            DataClassUser("junhyunny")
        )


        Assertions.assertEquals(
            """
                ["action.in.blog.KotlinObjectMapperSerializeTest${'$'}recordSerializeWithClass${'$'}RecordUser",{"name":"junhyunny"}]
                """.trimIndent(),
            result
        )
    }
}
```

주의 사항으로 `DefaultTyping.EVERYTHING`은 3.0 버전에 삭제될 예정이다. JavaDoc 주석에 해당 옵션에 설명을 볼 있다. 

```java
    /**
     * Value that means that default typing will be used for
     * all types, with exception of small number of
     * "natural" types (String, Boolean, Integer, Double) that
     * can be correctly inferred from JSON, and primitives (which
     * can not be polymorphic either).
     * Typing is also enabled for all array types.
     *<p>
     * WARNING: most of the time this is <b>NOT</b> the setting you want
     * as it tends to add Type Ids everywhere, even in cases
     * where type can not be anything other than declared (for example
     * if declared value type of a property is {@code final} -- for example,
     * properties of type {@code long} (or wrapper {@code Long}).
     *<p>
     * Note that this is rarely the option you should use as it results
     * in adding type information in many places where it should not be needed:
     * make sure you understand its behavior.
     * The only known use case for this setting is for serialization
     * when passing instances of final class, and base type is not
     * separately specified.
     *
     * @since 2.10
     * @deprecated Since 2.17 and removed from 3.0 --see {@link #NON_FINAL_AND_ENUMS} for Enum-related usage.
     */
    @Deprecated
    EVERYTHING
```

요약하자면 다음과 같다.

- 모든 타입에 대해 기본 타입 적용이 활성화된다.
- 다만 다음과 같은 "자연 타입"과 원시 타입(primitive)에는 적용되지 않는다.
  - String, Boolean, Integer, Double, 원시 타입 (long, int 등)
- 이 설정은 대개 적절하지 않다. 대부분의 경우 타입 정보를 불필요하게 추가하기 때문에 신중하게 사용해야 한다.
- 버전 2.10부터 도입했고 버전 2.17 이후 사용 중단한다. 3.0부터는 삭제한다.
- 열거형 관련 사용 시 `NON_FINAL_AND_ENUMS`로 대체 권장한다.

## CLOSING

마지막으로 내용을 요약하면서 이 글을 마무리한다.

- ObjectMapper 객체를 사용해 직렬화 할 때 타입 정보를 함께 직렬화하고 싶다면 `activateDefaultTyping()` 메소드를 사용한다.
- `NON_FINAL` 옵션을 사용하는 경우 final 타입들은 직렬화 시 타입 정보가 직렬화 대상에서 제외된다.
- 코틀린의 클래스는 기본적으로 final 클래스이기 때문에 직렬화 시 타입 정보를 명시하고 싶다면 open 키워드를 대상 클래스에 추가한다.
- 자바의 레코드 클래스와 코틀린의 데이터 클래스는 final 클래스이고 이는 변경될 수 없다. `EVERYTHING` 옵션을 사용하면 직렬화 할 때 타입 정보를 함께 직렬화하지만, 과도한 정보 제공 문제로 앞으로 삭제될 예정이다.

ObjectMapper 객체를 사용해 직렬화, 역직렬화 시 타입 정보가 필요하다면 위 사항들을 고려한 설계를 하면 될 것 같다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-01-31-object-mapper-active-default-type-error>

#### RECOMMEND NEXT POSTS

- [Record Keyword in Java][record-in-java-link]

#### REFERENCE

- <https://kotlinlang.org/docs/inheritance.html>
- <https://unluckyjung.github.io/kotlin/intellij/2022/06/06/kotlin-decompile/>

[record-in-java-link]: https://junhyunny.github.io/java/record-in-java/
