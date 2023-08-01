---
title: "volatile in Java"
search: false
category:
  - information
  - java
last_modified_at: 2021-09-03T02:00:00
---

<br/>

## 1. volatile Keyword

> The Java volatile keyword guarantees visibility of changes to variables across threads. 

`volatile` 키워드는 스레드들 사이에서 변수에 저장된 값을 변경하는 것에 대한 가시성(visibility)을 보장합니다. 
가시성이라는 단어가 어려움을 느끼게 하지만, 말처럼 `데이터가 보인다.`라는 의미입니다. 
CPU는 성능상의 이유로 메인 메모리에 저장된 데이터를 직접 사용하지 않습니다. 
데이터에 조금 더 빠르게 접근하기 위해 위해 CPU 캐시를 사용합니다. 

##### Using Cache in Multi CPU

* 여러 개의 CPU를 사용하는 멀티 스레드 환경에서 데이터 동기화 문제가 발생합니다.  
* 각 CPU들이 각자의 스레드를 실행합니다.
* 어플리케이션의 같은 변수를 사용하지만, CPU 캐시에 데이터를 로딩해서 사용합니다.

<p align="center">
    <img src="/images/java-volatile-1.JPG" width="50%" class="image__border image__padding">
</p>
<center>http://tutorials.jenkov.com/java-concurrency/volatile.html</center>


### 1.1. Data not matched between main memory and cpu cache

* CPU1은 Thread1을 실행합니다.
* CPU2는 Thread2를 실행합니다.
* CPU1은 Thread1을 수행하면서 count 변수를 읽어 증가시키면서 작업을 수행합니다.
* CPU2는 Thread2를 수행하면서 값의 변경은 없이 사용합니다.
* 같은 변수를 다른 값으로 사용하게 되면서 로직 상의 문제가 발생합니다.

<p align="center">
    <img src="/images/java-volatile-2.JPG" width="50%" class="image__border image__padding">
</p>
<center>http://tutorials.jenkov.com/java-concurrency/volatile.html</center>

## 2. Misconcepts of volatile keyword 

위와 같은 문제를 해결하기 위해 volatile 키워드를 사용합니다. 
volatile 키워드를 사용하면 CPU 캐시가 아닌 메인 메모리에 저장된 데이터를 사용합니다. 
데이터 불일치 문제는 해결할 수 있지만, 캐시를 사용하지 않는 만큼 성능이 떨어질 수 있습니다. 

Java는 멀티 스레드 환경에서 스레드 안전한 프로그래밍을 위해 다음과 같은 기능들을 제공합니다. 

* synchronized
* Atomic classes
* volatile

데이터 동기화는 volatile 키워드만으로 불가능하므로 synchronized 키워드나 Atomic 클래스를 함께 사용해야 합니다. 

## 3. Practice

간단한 테스트 코드를 통해 volatile 키워드만 적용되었을 때 데이터 동기화가 잘 이뤄지는지 살펴보겠습니다. 

* 두 개의 스레드가 NormalInteger 객체를 공유합니다.
    * NormalInteger 객체에서 관리하는 value 데이터는 volatile 키워드가 적용되어 있습니다.
* 각 스레드는 값을 증가, 감소시키는 연산을 수행합니다.

```java
package blog.in.action.volatilekeyword;

import lombok.Getter;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CompletableFuture;

@Getter
class NormalInteger {
    private volatile int value;

    public NormalInteger(int value) {
        this.value = value;
    }

    public void increase() {
        this.value++;
    }

    public void decrease() {
        this.value--;
    }
}

@Log4j2
public class VolatileTest {

    int limit = Integer.MAX_VALUE / 10;

    @Test
    public void test() {

        var start = System.currentTimeMillis();
        var normalInteger = new NormalInteger(0);

        var firstThread = CompletableFuture.runAsync(() -> {
            for (int index = 0; index < limit; index++) {
                normalInteger.increase();
            }
        });
        var secondThread = CompletableFuture.runAsync(() -> {
            for (int index = 0; index < limit; index++) {
                normalInteger.decrease();
            }
        });

        firstThread.join();
        secondThread.join();

        var end = System.currentTimeMillis();
        log.info("operation time: {}, value: {}", (end - start), normalInteger.getValue());
    }
}
```

##### Result

* 데이터 동기화가 정상적으로 이뤄지지 않습니다.

```
07:44:46.102 [main] INFO blog.in.action.volatilekeyword.VolatileTest - operation time: 9566, value: 216466
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-06-14-java-volatile>

#### RECOMMEND NEXT POSTS

* [Atomic Classes in Java][java-atomic]

#### REFERENCE

* <http://tutorials.jenkov.com/java-concurrency/volatile.html>

[java-atomic-link]: https://junhyunny.github.io/information/java/java-atomic/