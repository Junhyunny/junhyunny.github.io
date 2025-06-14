---
title: "Make static method as stub in Kotlin"
search: false
category:
  - kotlin
  - mockito
last_modified_at: 2024-02-01T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Test Double][test-double-link]
- [Make static method as stub in Java][how-to-stub-java-static-method-link]
- [Call Real Method of MockedStatic Test Double][test-double-link]

## 0. 들어가면서

현재 프로젝트는 코틀린(kotlin)을 사용한다. 자바(java)만큼 익숙하지 않은 탓에 종종 단순한 문제임에도 시간을 버리곤 한다. 이번 포스트는 테스트 코드를 작성할 때 정적 메소드를 스텁(stub)으로 만들면서 겪은 문제에 대해 정리했다. 테스트 코드를 작성한 프로젝트 환경은 다음과 같다.

```groovy
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id 'org.springframework.boot' version '3.2.2'
    id 'io.spring.dependency-management' version '1.1.4'
    id 'org.jetbrains.kotlin.jvm' version '1.9.22'
    id 'org.jetbrains.kotlin.plugin.spring' version '1.9.22'
}

group = 'blog.in.action'
version = '0.0.1-SNAPSHOT'

java {
    sourceCompatibility = '17'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter'
    implementation 'org.jetbrains.kotlin:kotlin-reflect'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.withType(KotlinCompile) {
    kotlinOptions {
        freeCompilerArgs += '-Xjsr305=strict'
        jvmTarget = '17'
    }
}

tasks.named('test') {
    useJUnitPlatform()
}
```

## 1. Make stub for Java class static method

자바 클래스인 경우 모키토(mockito) mockStatic 메소드를 사용하면 쉽게 정적 메소드를 스텁으로 만들 수 있다. 현재 스프링 버전은 [Make static method as stub in Java][how-to-stub-java-static-method-link] 글의 설명처럼 별도로 `mockito-inline` 의존성을 추가하지 않더라도 mockStatic 메소드를 사용할 수 있다. 테스트가 끝나면 테스트 더블을 해제해주는 것도 중요하다. 제대로 해제하지 않으면 다른 테스트에 영향을 준다. 각 테스트 메소드는 서로 격리시키는 것이 중요하다. 

```kotlin
package blog.`in`.action

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mockStatic
import java.time.LocalDateTime

class LocalDateTimeTest {

    @Test
    fun makeStub() {

        val localDateTime = LocalDateTime.of(2024, 2, 1, 12, 0)
        val mockedLocalDateTime = mockStatic(LocalDateTime::class.java)
        mockedLocalDateTime.`when`<LocalDateTime> { LocalDateTime.now() }.thenReturn(localDateTime)


        val result = LocalDateTime.now()


        assertEquals(localDateTime, result)
        mockedLocalDateTime.close()
    }
}
```

## 2. Make stub for Kotlin class static method

LocalDateTime 클래스의 특정 정적 메소드를 직접 스텁으로 만들면 테스트 코드가 동작할 때 다른 LocalDateTime 메소드들도 함께 먹통이 된다. 정확한 원인은 모르지만, 클래스 객체 자체를 테스트 더블로 만들어버리기 때문에 다른 메소드가 동작하지 않는 것이라고 예상하고 있다. 이런 문제를 해결하기 위해 시간 관련된 로직을 정적 메소드로 제공하는 유틸 클래스를 만들 수 있다. 이 클래스를 테스트 더블로 만들 때 적지 않은 시간을 허비했다.

### 2.1. Use Companion Object

코틀린에서 정적 메소드를 선언하는 방법으로 보통 동반 객체(companion object)을 사용한다. 동반 객체에 선언한 정적 메소드는 스텁으로 잘 만들어지지 않는다. 다음과 같은 테스트를 작성해 실행하면 @JvmStatic 애너테이션 존재 유무와 상관 없이 에러가 발생한다.

```kotlin
package blog.`in`.action

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mockStatic
import java.time.LocalDateTime

class CompanionObjectTimeProviderTest {

    @Test
    fun makeStub() {

        val localDateTime = LocalDateTime.of(2024, 2, 1, 12, 0)
        val mockedLocalDateTime = mockStatic(CompanionObjectTimeProvider::class.java)
        mockedLocalDateTime.`when`<LocalDateTime> { CompanionObjectTimeProvider.currentDateTime() }.thenReturn(localDateTime)


        val result = CompanionObjectTimeProvider.currentDateTime()


        assertEquals(localDateTime, result)
        mockedLocalDateTime.close()
    }
}

class CompanionObjectTimeProvider {
    companion object {
        @JvmStatic
        fun currentDateTime(): LocalDateTime = LocalDateTime.now()
    }
}
```

다음과 같은 에러 메시지를 볼 수 있다.

```
org.mockito.exceptions.misusing.MissingMethodInvocationException: 
when() requires an argument which has to be 'a method call on a mock'.
For example:
    when(mock.getArticles()).thenReturn(articles);

Also, this error might show up because:
1. you stub either of: final/private/equals()/hashCode() methods.
   Those methods *cannot* be stubbed/verified.
   Mocking methods declared on non-public parent classes is not supported.
2. inside when() you don't call method on mock but on some other object.
```

### 2.2. Use Object 

object 키워드와 @JvmStatic 애너테이션을 사용해도 정적 메소드를 선언할 수 있다. 이 경우 정상적으로 테스트 더블이 동작한다.

```kotlin
package blog.`in`.action

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mockStatic
import java.time.LocalDateTime

class ObjectTimeProviderTest {

    @Test
    fun makeStub() {

        val localDateTime = LocalDateTime.of(2024, 2, 1, 12, 0)
        val mockedLocalDateTime = mockStatic(ObjectTimeProvider::class.java)
        mockedLocalDateTime.`when`<LocalDateTime> { ObjectTimeProvider.currentDateTime() }.thenReturn(localDateTime)


        val result = ObjectTimeProvider.currentDateTime()


        assertEquals(localDateTime, result)
        mockedLocalDateTime.close()
    }
}

object ObjectTimeProvider {

    @JvmStatic
    fun currentDateTime(): LocalDateTime = LocalDateTime.now()
}
```

### 2.3. Difference between Companion Object and Object

겉으로 보기엔 같은 정적 메소드인데 왜 이런 차이점이 발생한지 궁금했다. 각 클래스를 인텔리제이(intellij)의 도움을 받아 디컴파일(decompile)하면 서로 약간 다른 모습을 하고 있다. 먼저 동반 객체에서 @JvmStatic 애너테이션이 있는 경우 디컴파일하면 다음과 같은 모습을 하고 있다. 

- Companion 정적 멤버 변수로 Companion 인스턴스를 참조한다.
- CompanionObjectTimeProvider 클래스에 currentDateTime 정적 메소드가 선언되어 있다.
- CompanionObjectTimeProvider.Companion 클래스에 currentDateTime 인스턴스 메소드가 선언되어 있다.

```java
public final class CompanionObjectTimeProvider {

    @NotNull
    public static final Companion Companion = new Companion((DefaultConstructorMarker)null);

    @JvmStatic
    @NotNull
    public static final LocalDateTime currentDateTime() {
        return Companion.currentDateTime();
    }

    public static final class Companion {

        @JvmStatic
        @NotNull
        public final LocalDateTime currentDateTime() {
           LocalDateTime var10000 = LocalDateTime.now();
           Intrinsics.checkNotNullExpressionValue(var10000, "LocalDateTime.now()");
           return var10000;
        }

        private Companion() {
        }

        public Companion(DefaultConstructorMarker $constructor_marker) {
           this();
        }
    }
}
```

다음 동반 객체에서 @JvmStatic 애너테이션을 사용하지 않는 경우 디컴파일하면 다음과 같은 모습을 갖는다.

- Companion 정적 멤버 변수로 Companion 인스턴스를 참조한다.
- CompanionObjectTimeProvider.Companion 클래스에 currentDateTime 인스턴스 메소드가 선언되어 있다.

```java
public final class CompanionObjectTimeProvider {

    @NotNull
    public static final Companion Companion = new Companion((DefaultConstructorMarker)null);

    public static final class Companion {
        @NotNull
        public final LocalDateTime currentDateTime() {
            LocalDateTime var10000 = LocalDateTime.now();
            Intrinsics.checkNotNullExpressionValue(var10000, "LocalDateTime.now()");
            return var10000;
        }

        private Companion() {
        }

        public Companion(DefaultConstructorMarker $constructor_marker) {
            this();
        }
    }
}
```

@JvmStatic 애너테이션이 존재하든 존재하지 않든 동반 객체 내부에 선언한 메소드를 호출하는 행위는 CompanionObjectTimeProvider 클래스 내부에 정적 필드 변수로 참조되는 Companion 인스턴스의 메소드를 호출하는 것과 동일하다. 정적 필드로 참조되는 인스턴스의 메소드를 호출하는 것은 겉으로 보기엔 정적 메소드를 호출하는 것처럼 보일 뿐이다. 즉, 아래 두 코드는 동일하다.

```kotlin
    CompanionObjectTimeProvider.Companion.currentDateTime()
    CompanionObjectTimeProvider.currentDateTime()
```

다시 모키토의 에러 메시지를 살펴보자 에러가 발생할 수 있는 두 번째 예시를 살펴보면 다음과 같은 내용을 확인할 수 있다. 

> inside when() you don't call method on mock but on some other object.

"모의 객체가 아닌 다른 객체의 메소드를 호출하는 경우 에러가 발생한다."라고 설명이다. 결론을 이야기하면 필자는 테스트 코드에서 CompanionObjectTimeProvider 클래스 객체를 모의 객체로 만들었지만, when 메소드 안에선 CompanionObjectTimeProvider 클래스의 정적 멤버인 Companion 인스턴스의 currentDateTime 메소드를 호출했기 때문에 에러가 발생한 것이다.

마지막으로 object 객체를 살펴보자. 다음과 같은 모습으로 디컴파일된다. 

- INSTANCE 정적 멤버 변수로 ObjectTimeProvider 인스턴스를 참조한다.
- ObjectTimeProvider 클래스에 currentDateTime 정적 메소드가 선언되어 있다.

```java
public final class ObjectTimeProvider {

    @NotNull
    public static final ObjectTimeProvider INSTANCE;

    @JvmStatic
    @NotNull
    public static final LocalDateTime currentDateTime() {
        LocalDateTime var10000 = LocalDateTime.now();
        Intrinsics.checkNotNullExpressionValue(var10000, "LocalDateTime.now()");
        return var10000;
    }

    private ObjectTimeProvider() {
    }

    static {
        ObjectTimeProvider var0 = new ObjectTimeProvider();
        INSTANCE = var0;
    }
}
```

ObjectTimeProvider 클래스의 currentDateTime 정적 메소드를 호출하는 행위는 자바와 동일하게 실제 정적 메소드를 호출하는 것과 동일하기 때문에 결론적으로 mockStatic 메소드를 통해 스텁을 만드는 것이 가능하다. 

## CLOSING

정적 메소드를 테스트 더블로 만드는 것은 쉬워 보이지만, 상당히 테스트를 어렵게 만든다. 특히 시간 관련된 LocalDate, LocalDateTime, System 클래스들의 정적 메소드들을 스텁으로 만들면 동시에 여러 테스트를 돌릴 때 다른 테스트들이 깨지기도 한다. 그나마 테스트가 순차적으로 동작하고, 테스트 더블로 만든 클래스 자원들을 테스트가 끝날 때 꼼꼼히 릴리즈(release)한다면 사용해볼만 하다. 

필자는 보통 정적 메소드를 직접 테스트 더블로 만들지 않는다. 별도 클래스를 만들고 인스턴스 메소드로 정적 메소드를 감싼다. 해당 인스턴스를 위한 테스트 더블을 만들어 테스트 대상 객체에게 주입하는 방식으로 이런 문제를 해결한다. 정적 메소드를 스텁으로 만들기 위해 이 글을 찾아 들어 왔다면 이런 방법도 있으니 고려해보길 바란다. 

```kotlin
package blog.`in`.action

import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import java.time.DayOfWeek
import java.time.LocalDateTime

class InstanceTimeProviderTest {

    @Test
    fun makeStub() {

        val localDateTime = LocalDateTime.of(2024, 2, 1, 12, 0)
        val mockTimeProvider = mock(InstanceTimeProvider::class.java)
        val sut = SystemUnderTest(mockTimeProvider)
        `when`(mockTimeProvider.currentDateTime()).thenReturn(localDateTime)


        val result = sut.getDayOfTheWeek()


        Assertions.assertEquals("Thursday", result)
    }
}

class InstanceTimeProvider {

    fun currentDateTime(): LocalDateTime = LocalDateTime.now()
}

class SystemUnderTest(private val timeProvider: InstanceTimeProvider) {
    fun getDayOfTheWeek(): String = when (timeProvider.currentDateTime().dayOfWeek) {
        DayOfWeek.MONDAY -> "Monday"
        DayOfWeek.TUESDAY -> "Tuesday"
        DayOfWeek.WEDNESDAY -> "Wednesday"
        DayOfWeek.THURSDAY -> "Thursday"
        DayOfWeek.FRIDAY -> "Friday"
        DayOfWeek.SATURDAY -> "Saturday"
        DayOfWeek.SUNDAY -> "Sunday"
    }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-02-01-make-static-method-as-stub-in-kotlin>

#### REFERENCE

- <https://medium.com/depayse/kotlin-%ED%81%B4%EB%9E%98%EC%8A%A4-10-object-%ED%82%A4%EC%9B%8C%EB%93%9C%EC%9D%98-%EC%82%AC%EC%9A%A9-d7fe736a3dcb>
- <https://ijeee.tistory.com/22>
- <https://github.com/occidere/TIL/issues/156>

[test-double-link]: https://junhyunny.github.io/information/test-driven-development/test-double/
[how-to-stub-java-static-method-link]: https://junhyunny.github.io/java/spring-boot/test-driven-development/how-to-stub-java-static-method/
[real-static-method-call-when-using-mock-link]: https://junhyunny.github.io/java/spring-boot/test-driven-development/real-static-method-call-when-using-mock/