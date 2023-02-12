---
title: "SimpleDateFormat is not thread-safe"
search: false
category:
  - java
last_modified_at: 2023-02-12T23:55:00
---

<br/>

## 0. 들어가면서

`Java`에서 스레드 안정성(thread-safe)을 이야기하면 항상 문제가 있다고 거론되는 클래스들이 있습니다.

* `java.util.Date`
* `java.text.SimpleDateFormat`

이번 포스트에선 간단한 예시 코드를 통해 `SimpleDateFormat` 클래스를 스레드 안전하게 사용하는 방법에 대해 살펴보겠습니다. 

## 1. Why is SimpleDateFormat class not thread-safe? 

원인은 완벽하게 캡슐화(encapsulation) 되지 않은 객체가 여러 스레드에 의해 사용되었기 때문입니다. 
스레드 안정성이 깨지는 일은 다음과 같은 조건들에 의해 발생합니다.

* 객체는 상태(state)를 가지고 있습니다.
    * 객체의 상태란 클래스의 필드를 의미합니다.
* 객체의 상태를 외부에서 변경할 수 있습니다.
* 캡슐화가 되지 않은 객체가 여러 스레드에 의해 사용됩니다.

##### applyPattern of SimpleDateFormat Class

`applyPattern` 메소드를 통해 `SimpleDateFormat` 클래스의 문제점을 살펴보겠습니다.

* `SimpleDateFormat` 클래스는 `compiledPattern`, `pattern`라는 상태를 가집니다.
* `applyPattern` 메소드는 내부에서 `compiledPattern`, `pattern` 상태를 변경합니다.

```java
public class SimpleDateFormat extends DateFormat {
    
    private String pattern;

    private transient char[] compiledPattern;

    // ...

    public void applyPattern(String pattern) {
        applyPatternImpl(pattern);
    }

    private void applyPatternImpl(String pattern) {
        compiledPattern = compile(pattern);
        this.pattern = pattern;
    }
}
```

## 2. Using Not Thread-Safely SimpleDateFormat Class

다음은 다른 스레드의 간섭으로 원치 않는 결과를 얻는 테스트 코드입니다.

* `ThreadNotSafeSimpleDateFormat` 객체를 생성합니다.
* 해당 객체에 `HH:mm:ss.sss` 패턴을 적용합니다.
* `CompletableFuture` 클래스를 통해 두 개의 스레드를 실행합니다.
    * 먼저 실행한 스레드에서 적용 패턴을 `yyyy-MM-dd`으로 변경합니다.
    * 다음 실행한 스레드에서 날짜를 적용된 포맷으로 출력합니다.

```java
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.CompletableFuture;

class ThreadNotSafeSimpleDateFormat {

    SimpleDateFormat simpleDateFormat = new SimpleDateFormat();

    void applyPattern(String format) {
        simpleDateFormat.applyPattern(format);
    }

    String getFormattedDate(Date date) {
        return simpleDateFormat.format(date);
    }
}

public class ThreadNotSafeSimpleDateFormatTest {

    static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            System.out.println(e.getMessage());
        }
    }

    public static void main(String[] args) {

        Date date = new Date();
        ThreadNotSafeSimpleDateFormat threadNotSafeSimpleDateFormat = new ThreadNotSafeSimpleDateFormat();
        threadNotSafeSimpleDateFormat.applyPattern("HH:mm:ss.sss");


        CompletableFuture<Void> thread1 = CompletableFuture.runAsync(() -> {
            threadNotSafeSimpleDateFormat.applyPattern("yyyy-MM-dd");
        });
        CompletableFuture.runAsync(() -> {
            sleep(500);
            System.out.printf("result of formatting - %s", threadNotSafeSimpleDateFormat.getFormattedDate(date));
        }).join();
        thread1.join();
    }
}
```

##### Result of Test

* 먼저 실행된 스레드에서 변경한 포맷으로 결과가 출력됩니다.

```
result of formatting - 2023-02-12
```

## 3. Using Thread-Safely SimpleDateFormat Class

다음은 다른 스레드의 간섭에도 영향을 받지 않고 원하는 결과를 얻는 테스트 코드입니다.

* `HH:mm:ss.sss` 패턴을 적용한 `ThreadSafeSimpleDateFormat` 객체를 생성합니다.
* `CompletableFuture` 클래스를 통해 두 개의 스레드를 실행합니다.
    * 먼저 실행한 스레드에서 적용 패턴을 `yyyy-MM-dd`으로 변경합니다.
    * 다음 실행한 스레드에서 날짜를 적용된 포맷으로 출력합니다.

```java
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.CompletableFuture;

class ThreadSafeSimpleDateFormat {

    private final SimpleDateFormat simpleDateFormat;

    public ThreadSafeSimpleDateFormat(SimpleDateFormat simpleDateFormat) {
        this.simpleDateFormat = simpleDateFormat;
    }

    static ThreadSafeSimpleDateFormat applyPattern(String format) {
        SimpleDateFormat simpleDateFormat = new SimpleDateFormat();
        simpleDateFormat.applyPattern(format);
        return new ThreadSafeSimpleDateFormat(simpleDateFormat);
    }

    String getFormattedDate(Date date) {
        return simpleDateFormat.format(date);
    }
}

public class ThreadSafeSimpleDateFormatTest {

    static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            System.out.println(e.getMessage());
        }
    }

    public static void main(String[] args) {

        Date date = new Date();
        ThreadSafeSimpleDateFormat threadSafeSimpleDateFormat = ThreadSafeSimpleDateFormat.applyPattern("HH:mm:ss.sss");


        CompletableFuture<Void> thread1 = CompletableFuture.runAsync(() -> {
            threadSafeSimpleDateFormat.applyPattern("yyyy-MM-dd");
        });
        CompletableFuture.runAsync(() -> {
            sleep(500);
            System.out.printf("result of formatting - %s", threadSafeSimpleDateFormat.getFormattedDate(date));
        }).join();
        thread1.join();
    }
}
```

##### Result of Test

* 먼저 실행된 스레드에서 포맷을 변경하였지만, 처음 설정한 포맷에 맞는 결과가 출력됩니다.

```
result of formatting - 02:08:58.058
```

## 4. What is Difference Between Two Tests?

스레드 안전한 방법을 살펴보면 객체의 상태를 변경하는 동작을 수행할 땐 `SimpleDateFormat` 객체를 새로 생성하여 처리했습니다. 
객체의 상태를 바꾸는 행위는 다중 스레드 환경에서 불안정하기 때문에 가능하다면 복제하거나 새로 만드는 것이 좋습니다. 

### 4.1. Another Example of Not Thread-Safely Using

`SimpleDateFormat` 클래스의 `parse` 메소드는 수행 중간에 상태가 변경되므로 스레드 사이에 공유되면 위험한 코드입니다.

```java
import java.text.SimpleDateFormat;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SimpleDateFormatParseTest {

    public static void main(String[] args) {

        SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
        ExecutorService executorService = Executors.newFixedThreadPool(10);

        for (int index = 0; index < 100; index++) {
            executorService.submit(() -> {
                try {
                    System.out.printf("Successfully Parsing - %s%n", simpleDateFormat.parse("2023-02-12T02:35:00"));
                } catch (Exception e) {
                    System.out.printf("Parse Error - %s%n", e.getMessage());
                }
            });
        }

        executorService.shutdown();
    }
}
```

##### Result of Test

* 일부 스레드에서 에러가 발생합니다.

```
Successfully Parsing - Thu Feb 12 00:00:00 KST 1970
Parse Error - multiple points
Parse Error - multiple points
Successfully Parsing - Sun Feb 12 02:35:00 KST 2023
Successfully Parsing - Sun Feb 12 02:35:00 KST 2023
Successfully Parsing - Wed Aug 06 02:35:00 KST 3214
Parse Error - For input string: "3535E235"
Parse Error - For input string: "3535E"
Parse Error - For input string: ""
Parse Error - For input string: ".22302320232023E4.22302320232023E4"
Parse Error - For input string: ""
Successfully Parsing - Thu Feb 12 00:00:00 KST 1970
Successfully Parsing - Sun Feb 12 02:35:00 KST 2023
...
```

##### Using Thread-Safely SimpleDateFormat

객체의 상태가 변경되기 때문에 마찬가지로 매 스레드마다 새로 생성하여 사용합니다.

```java
import java.text.SimpleDateFormat;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SimpleDateFormatParseTest {

    public static void main(String[] args) {

        // SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
        ExecutorService executorService = Executors.newFixedThreadPool(10);

        for (int index = 0; index < 100; index++) {
            executorService.submit(() -> {
                try {
                    SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
                    System.out.printf("Successfully Parsing - %s%n", simpleDateFormat.parse("2023-02-12T02:35:00"));
                } catch (Exception e) {
                    System.out.printf("Parse Error - %s%n", e.getMessage());
                }
            });
        }

        executorService.shutdown();
    }
}
```

## CLOSING

`JDK1.8`부터 제공된 `DateTimeFormatter` 클래스를 사용하는 것이 좋습니다. 

* `java.time.DateTimeFormatter`
    * `java.time.*` 패키지에 대한 형식 변환합니다.
    * 날짜를 텍스트로 변경하거나 텍스트를 날짜로 변경합니다.

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-02-12-simple-data-format-is-not-thread-safe>

#### REFERENCE

* <https://www.callicoder.com/java-simpledateformat-thread-safety-issues/>
* <https://jmlim.github.io/java/2018/12/13/java8-datetime-example/>
* [이펙티브 자바 3/E][effective-java-book-link]

[effective-java-book-link]: https://www.kyobobook.co.kr/product/detailViewKor.laf?ejkGb=KOR&mallGb=KOR&barcode=9788966262281&orderClick=LAG&Kc=