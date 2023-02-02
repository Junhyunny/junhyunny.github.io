---
title: "Java static method stubbing"
search: false
category:
  - java
  - spring-boot
  - test-driven-development
last_modified_at: 2022-04-11T23:55:00
---

<br/>

## 1. 문제 현상

테스트 코드를 작성하다보면 static 메소드를 스터빙(stubbing)할 필요가 생깁니다. 
먼저 간단한 예시 코드를 통해 문제점을 살펴보겠습니다. 

### 1.1. 구현 코드

- 4월, 8월, 12월인 경우에는 20% 할인된 가격을 반환하는 메소드를 테스트하고 싶습니다.
- 오늘 날짜가 4월, 8월, 12월인 경우에는 20% 할인된 가격이 반환됩니다.
- 기타 다른 월인 경우에는 기본 가격이 그대로 반환됩니다.

```java
package action.in.blog.service;

import java.time.LocalDate;
import java.time.Month;

import static java.time.Month.*;

public class StaticMethodService {

    public int getEventPrice(int price) {
        Month month = LocalDate.now().getMonth();
        if (APRIL.equals(month) || AUGUST.equals(month) || DECEMBER.equals(month)) {
            return (int) (price * 0.8);
        }
        return price;
    }
}
```

### 1.2. 테스트 코드

- 해당 테스트 코드는 4월, 8월, 12월인 경우에만 통과합니다.

```java
package action.in.blog.service;

import org.junit.jupiter.api.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

public class StaticMethodServiceTests {

    @Test
    void given1000_whenGetEventPrice_thenReturn800() {

        StaticMethodService service = new StaticMethodService();

        assertThat(service.getEventPrice(1000), equalTo(800));
    }
}
```

## 2. 문제 해결

위의 테스트 코드는 특정 월에만 통과합니다. 
이벤트 기간마다 테스트를 통과시키기 위해 테스트 코드를 수정할 수는 없습니다. 
이 경우 `LocalDate` 클래스의 `now` 메소드를 특정 날짜로 스터빙할 필요가 있습니다. 
`now` 메소드는 static 메소드이기 때문에 일반적인 방법으로 스터빙이 불가능합니다.

##### static 메소드 잘못된 스터빙

```java
    Mockito.when(LocalDate.now()).thenReturn(onApril);
```

##### 에러 메세지

- 위 코드를 실행시키면 `mock` 객체의 메소드를 `when` 메소드에 전달하라는 에러 메세지를 받습니다.
- `LocalDate` 클래스 자체는 `mock` 객체가 될 수 없습니다.

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

### 2.1. mockito-inline 의존성 사용하기 

`Mockito` 클래스를 보면 static 메소드 테스트와 연관있어 보이는 `mockStatic` 메소드가 존재합니다. 
해당 메소드를 실행시키면 다음과 같은 에러가 발생합니다.

##### mockStatic 메소드 호출 시 에러 메세지

- `mockito-inline` 아티팩트(artifact)로 변경하면 테스트가 가능할 것 같습니다.

```
org.mockito.exceptions.base.MockitoException: 
The used MockMaker SubclassByteBuddyMockMaker does not support the creation of static mocks

Mockito's inline mock maker supports static mocks based on the Instrumentation API.
You can simply enable this mock mode, by placing the 'mockito-inline' artifact where you are currently using 'mockito-core'.
Note that Mockito's inline mock maker is not supported on Android.
```

##### 의존성 추가하기 - pom.xml

- 아래 의존성을 `pom.xml` 파일에 추가합니다.

```xml
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-inline</artifactId>
    <version>4.4.0</version>
    <scope>test</scope>
</dependency>
```

### 2.2. 테스트 코드

- `mockito-inline` 의존성을 추가했다면 다음과 같이 테스트 코드를 변경합니다.
- `LocalDate` 클래스를 `static mock`으로 대체하기 전에 4월 1일 날짜를 미리 만듭니다.
    - `Mockito.mockStatic(LocalDate.class)` 실행 이후 `LocalDate` 클래스의 static 메소드 호출 시 에러 발생
- `MockedStatic` 인스턴스를 이용해 `LocalDate` 클래스 `now` 메소드를 스터빙합니다.

```java
package action.in.blog.service;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.time.LocalDate;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

public class StaticMethodServiceTests {

    @Test
    void given1000AndAprilDate_whenGetEventPrice_thenReturn800() {

        LocalDate onApril = LocalDate.of(2022, 4, 1);
        MockedStatic<LocalDate> mockLocalDate = Mockito.mockStatic(LocalDate.class);
        mockLocalDate.when(LocalDate::now).thenReturn(onApril);

        StaticMethodService service = new StaticMethodService();

        assertThat(service.getEventPrice(1000), equalTo(800));
    }
}
```

##### 테스트 통과

<p align="left">
  <img src="/images/how-to-stub-java-static-method-1.JPG" width="45%" class="image__border">
</p>

## 3. static method stubbing 주의 사항

static 메소드를 스터빙하면 다른 테스트 코드에서 문제가 발생합니다. 
인스턴스를 `mock`으로 만든 것이 아니기 때문에 일회성으로 사용되는 것이 아니라 다음 테스트들까지 영향을 미칩니다. 
8월에도 가격이 정상적으로 할인되는지 테스트 코드를 하나 추가해보았습니다. 

### 3.1. 8월 이벤트 할인 금액 확인 테스트 코드 추가

```java
package action.in.blog.service;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.time.LocalDate;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

public class StaticMethodServiceTests {

    @Test
    void given1000AndAprilDate_whenGetEventPrice_thenReturn800() {

        LocalDate onApril = LocalDate.of(2022, 4, 1);
        MockedStatic<LocalDate> mockLocalDate = Mockito.mockStatic(LocalDate.class);
        mockLocalDate.when(LocalDate::now).thenReturn(onApril);

        StaticMethodService service = new StaticMethodService();

        assertThat(service.getEventPrice(1000), equalTo(800));
    }

    @Test
    void given1000AndAugustDate_whenGetEventPrice_thenReturn800() {

        LocalDate onAugust = LocalDate.of(2022, 8, 1);
        MockedStatic<LocalDate> mockLocalDate = Mockito.mockStatic(LocalDate.class);
        mockLocalDate.when(LocalDate::now).thenReturn(onAugust);

        StaticMethodService service = new StaticMethodService();

        assertThat(service.getEventPrice(1000), equalTo(800));
    }
}
```

##### 테스트 실패

<p align="left">
  <img src="/images/how-to-stub-java-static-method-2.JPG" width="45%" class="image__border">
</p>

##### 에러 메세지

```
org.mockito.exceptions.base.MockitoException: 
For java.time.LocalDate, static mocking is already registered in the current thread

To create a new mock, the existing static mock registration must be deregistered

	at action.in.blog.service.StaticMethodServiceTests.given1000AndAprilDate_whenGetEventPrice_thenReturn800(StaticMethodServiceTests.java:18)
	at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
	at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
    ...
```

### 3.2. 테스트 충돌 문제 해결

- 테스트마다 사용한 클래스 `static mock`을 해제합니다.

```java
package action.in.blog.service;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.time.LocalDate;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

public class StaticMethodServiceTests {

    @Test
    void given1000AndAprilDate_whenGetEventPrice_thenReturn800() {

        LocalDate onApril = LocalDate.of(2022, 4, 1);
        MockedStatic<LocalDate> mockLocalDate = Mockito.mockStatic(LocalDate.class);
        mockLocalDate.when(LocalDate::now).thenReturn(onApril);

        StaticMethodService service = new StaticMethodService();

        assertThat(service.getEventPrice(1000), equalTo(800));

        mockLocalDate.close();
    }

    @Test
    void given1000AndAugustDate_whenGetEventPrice_thenReturn800() {

        LocalDate onAugust = LocalDate.of(2022, 8, 1);
        MockedStatic<LocalDate> mockLocalDate = Mockito.mockStatic(LocalDate.class);
        mockLocalDate.when(LocalDate::now).thenReturn(onAugust);

        StaticMethodService service = new StaticMethodService();

        assertThat(service.getEventPrice(1000), equalTo(800));

        mockLocalDate.close();
    }
}
```

##### 테스트 성공

<p align="left">
  <img src="/images/how-to-stub-java-static-method-3.JPG" width="45%" class="image__border">
</p>


### 3.3. 테스트 코드 정리

- 테스트 코드를 정리하였습니다. 
- 필요한 날짜들은 미리 만듭니다.
- 테스트 실행 전 `LocalDate` 클래스를 `static mock`으로 만듭니다.
- 테스트 코드마다 필요한 결과 값을 스터빙합니다.
- 테스트 종료 후 사용한 `static mock`을 해제합니다.

```java
package action.in.blog.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.time.LocalDate;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

public class StaticMethodServiceTests {

    LocalDate onApril = LocalDate.of(2022, 4, 1);
    LocalDate onAugust = LocalDate.of(2022, 8, 1);

    MockedStatic<LocalDate> mockLocalDate;

    StaticMethodService service;

    @BeforeEach
    void setUp() {
        mockLocalDate = Mockito.mockStatic(LocalDate.class);
        service = new StaticMethodService();
    }

    @AfterEach
    void afterEach() {
        mockLocalDate.close();
    }

    @Test
    void given1000AndAprilDate_whenGetEventPrice_thenReturn800() {

        mockLocalDate.when(LocalDate::now).thenReturn(onApril);

        assertThat(service.getEventPrice(1000), equalTo(800));
    }

    @Test
    void given1000AndAugustDate_whenGetEventPrice_thenReturn800() {

        mockLocalDate.when(LocalDate::now).thenReturn(onAugust);

        assertThat(service.getEventPrice(1000), equalTo(800));
    }
}
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-04-11-how-to-stub-java-static-method>
