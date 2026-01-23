---
title: "Call Real Method of MockedStatic Test Double"
search: false
category:
  - java
  - spring-boot
  - test-driven-development
last_modified_at: 2022-07-21T23:55:00
---

<br/>

## 1. 문제 상황

새로운 기능을 위해 테스트를 추가하면서 다음과 같은 문제 상황이 발생했습니다.

* MockedStatic 클래스를 이용해 LocalDate 클래스의 정적(static) 메서드들을 테스트 더블(Test Double)로 만들었습니다. 
* 의도하지 않은 곳에서 스터빙(stubbing)되지 않은 정적 메서드가 호출되어 에러가 발생하였습니다.

### 1.1. 기존 코드

간단하게 재구성한 예시 코드를 통해 문제 현상을 살펴보도록 하겠습니다.
사용자들은 4월, 8월에 80% 저렴한 이벤트 가격으로 제품을 구매할 수 있습니다.

#### 1.1.1. 테스트 코드

* 4월, 8월에 할인된 가격을 `getEventPrice` 메서드를 통해 획득합니다.
* `LocalDate` 클래스의 `now` 정적 메서드가 각 테스트 별로 적당한 값을 반환하도록 스터빙합니다.
    * 각 테스트 별로 4월, 8월을 반환합니다.

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
    void users_can_get_80_percent_cheaper_price_on_April() {

        mockLocalDate.when(LocalDate::now).thenReturn(onApril);

        assertThat(service.getEventPrice(1000), equalTo(800));
    }

    @Test
    void users_can_get_80_percent_cheaper_price_on_August() {

        mockLocalDate.when(LocalDate::now).thenReturn(onAugust);

        assertThat(service.getEventPrice(1000), equalTo(800));
    }
}
```

#### 1.1.2. 실행 코드

* 4월과 8월은 전달받은 가격을 이벤트 가격으로 변경하여 반환합니다.

```java
package action.in.blog.service;

import java.time.LocalDate;
import java.time.Month;

import static java.time.Month.*;

public class StaticMethodService {

    public int getEventPrice(int price) {
        Month month = LocalDate.now().getMonth();
        if (APRIL.equals(month) || AUGUST.equals(month)) {
            return (int) (price * 0.8);
        }
        return price;
    }
}
```

#### 1.1.3. 테스트 결과

* 정상적으로 테스트가 통과합니다.

<p align="left">
    <img src="/images/real-static-method-call-when-using-mock-1.JPG" width="95%" class="image__border">
</p>

### 1.2. 사용자 스토리 추가

사용자 스토리가 추가되었습니다. 
4월, 8월뿐만 아니라 만 나이가 10대인 사람들은 모두 이벤트 가격을 얻을 수 있습니다.

#### 1.2.1. 테스트 코드

* 만 나이가 10대인 사람들만 할인을 받는지 경계 조건을 테스트합니다.
* 하루 차이로 9세, 10세와 19세, 20세 나이를 파라미터로 전달합니다.

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
import static org.mockito.Mockito.*;

public class StaticMethodServiceTests {

    LocalDate onApril = LocalDate.of(2022, 4, 1);
    LocalDate onAugust = LocalDate.of(2022, 8, 1);

    LocalDate nineteenYears = LocalDate.of(2002, 4, 2);
    LocalDate twentyYears = LocalDate.of(2002, 4, 1);
    LocalDate nineYears = LocalDate.of(2012, 4, 2);
    LocalDate tenYears = LocalDate.of(2012, 4, 1);

    MockedStatic<LocalDate> mockLocalDate;

    StaticMethodService service;

    @BeforeEach
    void setUp() {
        service = new StaticMethodService();
        mockLocalDate = mockStatic(LocalDate.class);
    }

    @AfterEach
    void afterEach() {
        mockLocalDate.close();
    }

    // ... other tests

    @Test
    void users_who_teenager_can_get_80_percent_cheaper_price() {

        mockLocalDate.when(LocalDate::now).thenReturn(onApril);

        assertThat(service.getEventPrice(nineteenYears, 1000), equalTo(800));
        assertThat(service.getEventPrice(twentyYears, 1000), equalTo(1000));
        assertThat(service.getEventPrice(tenYears, 1000), equalTo(800));
        assertThat(service.getEventPrice(nineYears, 1000), equalTo(1000));
    }
}
```

#### 1.2.2. 구현 코드

* `Period` 클래스 `between` 메서드를 사용하여 두 날짜 사이의 년도 차이를 구합니다.
* 10대에 속하는 경우 할인 가격을 반환합니다.

```java
package action.in.blog.service;

import java.time.LocalDate;
import java.time.Month;
import java.time.Period;

import static java.time.Month.*;

public class StaticMethodService {

    // ... other codes

    public int getEventPrice(LocalDate birthDate, int price) {
        int age = Period.between(birthDate, LocalDate.now()).getYears();
        if(10 <= age && age < 20) {
            return (int) (price * 0.8);
        }
        return price;
    }
}
```

#### 1.2.3. 테스트 결과

* `NullPointException`가 발생하여 테스트가 실패합니다.

<p align="left">
    <img src="/images/real-static-method-call-when-using-mock-2.JPG" width="95%" class="image__border">
</p>

#### 1.2.4. 예외 발생 코드

* `LocalDate` 클래스 `until` 메서드에서 에러가 발생합니다.
* `LocalDate` 클래스 `from` 정적 메서드가 스터빙되지 않아 `null`을 반환합니다.
* 다음 라인에서 `end` 객체를 참조하는 시점에 `NullPointException`이 발생합니다.

```java
    @Override
    public Period until(ChronoLocalDate endDateExclusive) {
        LocalDate end = LocalDate.from(endDateExclusive);
        long totalMonths = end.getProlepticMonth() - this.getProlepticMonth();  // safe
        int days = end.day - this.day;
        if (totalMonths > 0 && days < 0) {
            totalMonths--;
            LocalDate calcDate = this.plusMonths(totalMonths);
            days = (int) (end.toEpochDay() - calcDate.toEpochDay());  // safe
        } else if (totalMonths < 0 && days > 0) {
            totalMonths++;
            days -= end.lengthOfMonth();
        }
        long years = totalMonths / 12;  // safe
        int months = (int) (totalMonths % 12);  // safe
        return Period.of(Math.toIntExact(years), months, days);
    }
```

## 2. 문제 해결

`MockedStatic` 클래스로 정적 메서드들이 모두 모킹(mocking)되어 정상적인 동작이 불가능했습니다. 
특정 메서드들만 스터빙을 하고 싶고, 나머지 정적 메서드들은 모두 원래대로 사용하고 싶었습니다. 

### 2.1. Mockito.CALLS_REAL_METHODS 사용

`LocalDate` 클래스의 모킹할 때 `Mockito.CALLS_REAL_METHODS`을 함께 전달합니다. 
이럴 경우 스터빙하지 않은 다른 메서드들은 모두 원래대로 동작합니다.

#### 2.1.1. 테스트 코드

* `mockLocalDate` 객체를 만들 때 `CALLS_REAL_METHODS`을 두 번째 파라미터로 함께 전달합니다.
    * 정적 메서드를 따로 스터빙하지 않는 경우 모두 원래 기능대로 동작합니다.

```java
package action.in.blog.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.time.LocalDate;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.mockito.Mockito.CALLS_REAL_METHODS;
import static org.mockito.Mockito.mockStatic;

public class StaticMethodServiceTests {

    LocalDate onApril = LocalDate.of(2022, 4, 1);
    LocalDate onAugust = LocalDate.of(2022, 8, 1);

    MockedStatic<LocalDate> mockLocalDate;

    StaticMethodService service;

    @BeforeEach
    void setUp() {
        service = new StaticMethodService();
        mockLocalDate = mockStatic(LocalDate.class, CALLS_REAL_METHODS);
    }

    @AfterEach
    void afterEach() {
        mockLocalDate.close();
    }

    @Test
    void users_can_get_80_percent_cheaper_price_on_April() {

        mockLocalDate.when(LocalDate::now).thenReturn(onApril);

        assertThat(service.getEventPrice(1000), equalTo(800));
    }

    @Test
    void users_can_get_80_percent_cheaper_price_on_August() {

        mockLocalDate.when(LocalDate::now).thenReturn(onAugust);

        assertThat(service.getEventPrice(1000), equalTo(800));
    }

    @Test
    void users_who_teenager_can_get_80_percent_cheaper_price() {

        LocalDate nineteenYears = LocalDate.of(2002, 4, 2);
        LocalDate twentyYears = LocalDate.of(2002, 4, 1);
        LocalDate nineYears = LocalDate.of(2012, 4, 2);
        LocalDate tenYears = LocalDate.of(2012, 4, 1);

        mockLocalDate.when(LocalDate::now).thenReturn(onApril);

        assertThat(service.getEventPrice(nineteenYears, 1000), equalTo(800));
        assertThat(service.getEventPrice(twentyYears, 1000), equalTo(1000));
        assertThat(service.getEventPrice(tenYears, 1000), equalTo(800));
        assertThat(service.getEventPrice(nineYears, 1000), equalTo(1000));
    }
}
```

#### 2.1.2. 테스트 결과

<p align="left">
    <img src="/images/real-static-method-call-when-using-mock-3.JPG" width="95%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-07-21-real-static-method-call-when-using-mock>

#### REFERENCE

* <https://stackoverflow.com/questions/63840898/how-to-mock-just-one-static-method-in-a-class-using-mockito>
