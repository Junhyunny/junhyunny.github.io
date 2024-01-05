---
title: "DayOfYear Exceeding Error in Java"
search: false
category:
  - java
last_modified_at: 2023-01-09T23:55:00
---

<br/>

## 0. 들어가면서

날짜를 원하는 문자열 형식으로 변경하는 코드에서 다음과 같은 에러를 만났습니다. 
이번 포스트에선 에러의 원인을 살펴보겠습니다. 

```
Field DayOfYear cannot be printed as the value 359 exceeds the maximum print width of 2
java.time.DateTimeException: Field DayOfYear cannot be printed as the value 359 exceeds the maximum print width of 2
    at java.time.format.DateTimeFormatterBuilder$NumberPrinterParser.format(DateTimeFormatterBuilder.java:2559)
    at java.time.format.DateTimeFormatterBuilder$CompositePrinterParser.format(DateTimeFormatterBuilder.java:2190)
    at java.time.format.DateTimeFormatter.formatTo(DateTimeFormatter.java:1746)
    at java.time.format.DateTimeFormatter.format(DateTimeFormatter.java:1720)
    at java.time.ZonedDateTime.format(ZonedDateTime.java:2143)
  ...
```

## 1. 문제 발생 코드

* 2022년 12월 25일 날짜 객체를 생성합니다. 
* ZonedDateTime 클래스를 사용해 원하는 타임존(timezone)의 시간으로 변경합니다. 
* 시간을 `yyyy-MM-DD` 문자열 형식으로 표현합니다.

```java
package action.in.blog;

import org.junit.jupiter.api.Test;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ActionInBlogApplicationTests {

    @Test
    void date_of_year_exceeding_error() {

        String locale = "Asia/Seoul";
        ZoneId zoneId = ZoneId.of(locale);

        Calendar calendar = Calendar.getInstance();
        calendar.setTimeZone(TimeZone.getTimeZone(locale));
        calendar.set(2022, 11, 25);
        Date date = calendar.getTime();
        Instant instant = Instant.ofEpochMilli(date.getTime());


        Throwable throwable = assertThrows(DateTimeException.class, () -> {
            ZonedDateTime.ofInstant(instant, zoneId).format(DateTimeFormatter.ofPattern("yyyy-MM-DD"));
        });
        assertThat(throwable.getMessage(), equalTo("Field DayOfYear cannot be printed as the value 359 exceeds the maximum print width of 2"));
    }
}
```

## 2. 문제 원인

잘못된 형식을 사용했습니다. 

* `D`는 Day of Year 값이므로 년 중 몇 번째 날인지 표현합니다.
* `d`는 Day of Month 값으로 월 중 몇 번째 날인지 표현합니다.

2022년 11월 25일은 년 중 359일인데, 이를 표현하는데 `DD`로 두 자리로만 지정했기 때문에 에러가 발생하였습니다. 

##### Date Time Symbol Format in Java

* 아래 표는 Java에서 사용하는 날짜 포맷들입니다.
* 자세한 설명은 다음 링크에서 확인할 수 있습니다. 
    * [Date Field Symbol Table][date-time-symbol-table-link]

<p align="center">
    <img src="/images/date-of-year-exceeding-error-in-java-1.JPG" width="65%">
</p>
<center>https://jenkov.com/tutorials/java-internationalization/simpledateformat.html</center>

## 3. 해결 코드

* `dd` 형식으로 Day of Month 값을 표현합니다.
* `DDD` 형식으로 Day of Year 값을 표현합니다. 

```java
package action.in.blog;

import org.junit.jupiter.api.Test;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ActionInBlogApplicationTests {

    // ...

    @Test
    void format_date() {

        String locale = "Asia/Seoul";
        ZoneId zoneId = ZoneId.of(locale);

        Calendar calendar = Calendar.getInstance();
        calendar.setTimeZone(TimeZone.getTimeZone(locale));
        calendar.set(2022, 11, 25);
        Date date = calendar.getTime();
        Instant instant = Instant.ofEpochMilli(date.getTime());


        String result = ZonedDateTime.ofInstant(instant, zoneId).format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        String dayOfYearResult = ZonedDateTime.ofInstant(instant, zoneId).format(DateTimeFormatter.ofPattern("DDD"));


        assertThat(result, equalTo("2022-12-25"));
        assertThat(dayOfYearResult, equalTo("359"));
    }
}
```

## CLOSING

해당 DateTimeException 예외는 JDK 1.8을 사용하면 발생합니다. 
JDK 11을 사용하면 예외가 발생하진 않지만, 개발자가 의도치 않은 데이터일 수 있으므로 적절한 테스트 코드를 통해 검증해야 합니다. 

```java
    @Test
    void without_error_when_using_jdk_11() {

        String locale = "Asia/Seoul";
        ZoneId zoneId = ZoneId.of(locale);

        Calendar calendar = Calendar.getInstance();
        calendar.setTimeZone(TimeZone.getTimeZone(locale));
        calendar.set(2022, 11, 25);
        Date date = calendar.getTime();
        Instant instant = Instant.ofEpochMilli(date.getTime());


        String dayOfYearResult = ZonedDateTime.ofInstant(instant, zoneId).format(DateTimeFormatter.ofPattern("D"));


        assertThat(dayOfYearResult, equalTo("359"));
    }
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-01-09-date-of-year-exceeding-error-in-java>

#### REFERENCE

* <https://jenkov.com/tutorials/java-internationalization/simpledateformat.html>
* <https://www.unicode.org/reports/tr35/tr35-31/tr35-dates.html#Date_Field_Symbol_Table>
* <https://stackoverflow.com/questions/63537849/convert-date-to-string-shows-error-field-dayofyear-cannot-be-printed-as-the-valu>

[date-time-symbol-table-link]: https://www.unicode.org/reports/tr35/tr35-31/tr35-dates.html#Date_Field_Symbol_Table