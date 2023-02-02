---
title: "Date and Calendar in Java"
search: false
category:
  - java
last_modified_at: 2022-11-14T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [GMT and UTC][gmt-and-utc-link]
* [Handling Timezone on JavaScript][handling-timezone-on-javascript-link]

## 0. 들어가면서

요즘 시간에 예민한 어플리케이션을 개발하면서 시간 도메인에 대해 공부하는 중 입니다. 
이전 포스트에선 프론트엔드에서 시간을 다루는 방법에 대해 정리하였습니다. 
이번 포스트에선 `JDK 8` 버전 전에 사용하던 날짜, 시간과 관련 API 기능들과 몇 가지 문제점들에 대해 살펴보려고 합니다. 

## 1. java.util.Date

`JDK 1.0`부터 사용한 시간, 날짜 관련 클래스입니다. 
이전 버전과 호환성을 위해 계속 제공하는 것 같지만, 현재 대부분의 기능이 더 이상 사용되지 않습니다. 
`Calendar` 클래스의 기능으로 대부분 대체되었습니다.

* 내부적으로 UNIX 시간을 관리합니다.
    * GMT 1970년 1월 1일 0시 0분 0초를 기준으로 지난 시간을 ms(밀리 세컨드)로 측정한 값입니다.
* `Date` 클래스는 UTC 시간을 반영하지만, JVM 호스트 환경에 따라 정확하지 않을 수 있습니다.
    * 윤초(leap second) 계산이 정확하게 이뤄지지 않습니다.
* 시간을 문자열로 변경하거나 문자열을 시간으로 파싱(parsing)할 수 있습니다.
* 내부적으로 로컬 타임존에 따라 시간이 계산됩니다.
* 메소드 대부분이 `deprecated` 되었습니다.
    * <https://docs.oracle.com/javase/8/docs/api/java/util/Date.html>

## 2. Pain Points of Date Class

`Date` 클래스는 다음과 같은 문제점들을 가지고 있습니다. 

### 2.1. Thread Not Safe

* 해당 테스트 코드는 항상 성공하지 않습니다.
* `Date` 객체는 동시성에 취약합니다.
    * 캡슐화 실패로 `Date` 객체 내부에서 관리하는 UNIX 시간을 외부에서 변경할 수 있습니다.
* 객체의 멤버 변수로 사용하는 것은 위험합니다.

```java
    @Test
    @DisplayName("Date 객체는 다중 스레드에 의해 변경되는 경우 정상적인 값을 얻지 못한다.")
    void date_instance_is_not_thread_safe() {

        final Date date = new Date();
        
        long unixTime = date.getTime();

        List<CompletableFuture> tasks = new ArrayList<>();
        tasks.add(CompletableFuture.runAsync(() -> {
            for (int index = 0; index < 100; index++) {
                date.setTime(date.getTime() - 1);
            }
        }));
        tasks.add(CompletableFuture.runAsync(() -> {
            for (int index = 0; index < 100; index++) {
                date.setTime(date.getTime() + 1);
            }
        }));
        tasks.stream().forEach(task -> task.join());


        assertThat(unixTime, equalTo(date.getTime()));
    }
```

### 2.2. Year starts based on 1900

* 생성자에 년도 파라미터에 122 값을 전달하면 2022년이 반환됩니다.
* 코드 내부를 확인하지 않으면 년도를 1900에 더해서 사용한다는 사실을 모릅니다.

```java
    @Test
    @DisplayName("Date 의 년도는 1900을 기준으로 더하거나 빼서 사용한다.")
    void year_of_date_starts_based_on_1900() {

        Date date = new Date(122, 10, 14, 4, 30, 00);
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");


        assertThat(simpleDateFormat.format(date), equalTo("2022-11-14 04:30:00"));
    }
```

### 2.2. Month starts from zero

* 1월의 값은 0부터 시작하여 12월의 값은 11 입니다.

```java
    @Test
    @DisplayName("Date 의 달(month)은 0부터 시작이다.")
    void month_of_date_starts_from_zero() {

        Date date = new Date(122, 11, 14, 4, 30, 00);
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");


        assertThat(simpleDateFormat.format(date), equalTo("2022-12-14 04:30:00"));
    }
```

## 3. java.util.Calendar

`JDK 1.1`에 생긴 시간, 날짜 관련 추상 클래스입니다. 
추상 클래스이므로 생성자가 아닌 팩토리 메소드 패턴이 적용된 `getInstance` 메소드를 사용해 객체를 생성합니다. 

* 내부적으로 UNIX 시간을 관리합니다.
* 지역에 따라 적절한 구현체를 `getInstance` 메소드를 통해 생성합니다.
    * 사용하는 언어에 맞는 적절한 날짜 포맷 제공 (ex, Japanese-Gregorian, Japanese-Traditional)
    * BuddhistCalendar 클래스 - 불교력으로 캄보디아, 라오스 미얀마, 인도, 태국 등에서 사용하는 달력 체계를 지원
    * JapaneseImperialCalendar 클래스 - 일본 황실력
    * GregorianCalendar 클래스 - 전 세계적으로 통용되는 태양력
* 타임존(timezone)을 지원합니다.

## 4. Pain Points of Calendar Class

`Calendar` 클래스는 다음과 같은 문제점들을 가지고 있습니다.

### 4.1. Thread Not Safe

* 해당 테스트 코드는 항상 성공하지 않습니다.
* `Calendar` 객체는 동시성에 취약합니다.
    * 캡슐화 실패로 `Calendar` 객체 내부에서 관리하는 UNIX 시간을 외부에서 변경할 수 있습니다.
* 객체의 멤버 변수로 사용하는 것은 위험합니다.

```java
    @Test
    @DisplayName("Calendar 객체는 다중 스레드에 의해 변경되는 경우 정상적인 값을 얻지 못한다.")
    void calendar_instance_is_not_thread_safe() {

        Calendar calendar = Calendar.getInstance();

        long unixTime = calendar.getTimeInMillis();

        List<CompletableFuture> tasks = new ArrayList<>();
        tasks.add(CompletableFuture.runAsync(() -> {
            for (int index = 0; index < 100; index++) {
                calendar.setTimeInMillis(calendar.getTimeInMillis() - 1);
            }
        }));
        tasks.add(CompletableFuture.runAsync(() -> {
            for (int index = 0; index < 100; index++) {
                calendar.setTimeInMillis(calendar.getTimeInMillis() + 1);
            }
        }));
        tasks.stream().forEach(task -> task.join());


        assertThat(unixTime, equalTo(calendar.getTimeInMillis()));
    }
```

### 4.2. Integer Constants

* 정수로 정의된 상수를 사용합니다.
    * `DATE`의 정수 값은 5 입니다.
    * `THURSDAY`의 정수 값은 5 입니다.
* 같은 상수 값을 사용하는 경우엔 컴파일 시점에 에러를 잡지 못 합니다.
* 아래 코드는 일 기준으로 1일을 더하고, 목요일 기준으로 1일을 더하는 로직으로 보입니다.
* 실제로 일(date) 기준으로 2일이 더해진 값이 반환됩니다.

```java
    @Test
    @DisplayName("Calendar 클래스는 무분별한 정수형 상수들을 제공하기 때문에 코드가 직관적이지 않다.")
    void calendar_class_provides_too_many_integer_constants() {

        Calendar calendar = Calendar.getInstance();
        calendar.set(2022, 10, 15);


        calendar.add(Calendar.DATE, 1);
        calendar.add(Calendar.THURSDAY, 1);


        assertThat(calendar.get(Calendar.DATE), equalTo(17));
    }
```

### 4.3. Month starts from zero

* `Date` 클래스의 0부터 달을 지정하는 방식을 유지하였습니다.
*  코드는 10월 객체를 생성한 것 같지만, 실제로 11월 객체를 생성합니다.

```java
    @Test
    @DisplayName("Calendar 클래스는 월 지정을 0부터 시작한다.")
    void calendar_class_starts_zero_when_setup_month() {

        Calendar calendar = Calendar.getInstance();
        calendar.set(2022, 10, 15);

        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd");

        assertThat(simpleDateFormat.format(calendar.getTimeInMillis()), equalTo("2022-11-15"));
    }
```

### 4.4. Do not throw exception setting timezone

* 타임존을 지정할 때 잘못된 값을 사용해도 에러가 발생하지 않습니다.
    * 존재하지 않는 `Seoul/Asia` 타임존 ID를 지정하면 `GMT`를 사용합니다.

```java
    @Test
    @DisplayName("Calendar 클래스는 타임 존 지정 시 오류가 나지 않는다.")
    void calendar_class_do_not_throw_exception_when_setup_timezone() {

        Calendar calendar = Calendar.getInstance();
        calendar.setTimeZone(TimeZone.getTimeZone("Seoul/Asia"));


        assertThat(calendar.getTimeZone(), equalTo(TimeZone.getTimeZone("GMT")));
    }
```

## 3. java.time Packages since JDK 8

`JDK 8`이 릴리즈되기 전엔 기본으로 제공되는 날짜, 시간 API 기능을 대체할 수 있는 라이브러리를 사용했다고 합니다.

* [Joda-Time](http://www.joda.org/joda-time)
* [Time and Money Code Library](http://timeandmoney.sourceforge.net)
* [CalendarDate](http://calendardate.sourceforge.net)
* [date4j](http://www.date4j.net)

`JDK 8`부터 날짜와 시간과 관련된 API 기능들이 많이 개선되었고, 관련된 클래스들은 `java.time` 패키지에 위치합니다. 

* java.time.chrono 
    * ISO-8601에 정의된 표준 달력 이외의 달력 시스템을 사용할 때 필요한 클래스들
* java.time.format 
    * 날짜와 시간에 대한 데이터를 구문분석하고 형식화하는 데 사용되는 클래스들
* java.time.temporal 
    * 날짜와 시간에 대한 데이터를 연산하는 데 사용되는 보조 클래스들
* java.time.zone 
    * 타임 존(time-zone)과 관련된 클래스들

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-11-15-date-and-calendar-in-java>

#### REFERENCE

* <https://docs.oracle.com/javase/tutorial/datetime/iso/overview.html>
* <https://docs.oracle.com/javase/8/docs/api/java/util/Date.html>
* <https://docs.oracle.com/javase/8/docs/api/java/util/Calendar.html>
* <https://d2.naver.com/helloworld/645609>
* <https://stackoverflow.com/questions/1969442/whats-wrong-with-java-date-time-api>
* <https://bangu4.tistory.com/200>

[gmt-and-utc-link]: https://junhyunny.github.io/information/gmt-and-utc/
[handling-timezone-on-javascript-link]: https://junhyunny.github.io/javascript/handling-timezone-on-javascript/