---
title: "자바(Java) volatile 키워드"
search: false
category:
  - information
  - java
last_modified_at: 2026-04-28T17:21:21+09:00
---

<br/>

## 1. volatile Keyword

> The Java volatile keyword guarantees visibility of changes to variables across threads.

`volatile` 키워드는 스레드 사이에서 변수 변경의 가시성(visibility)을 보장한다. 가시성이라는 단어가 어렵지만, 간단히 설명하면 `데이터가 보인다`라는 의미이다. CPU는 성능상의 이유로 메인 메모리에 저장된 데이터를 직접 사용하지 않고, 데이터에 조금 더 빠르게 접근하기 위해 CPU 캐시를 사용한다. 속도는 빨라지지만, 문제가 발생할 수 있다.

- 각 CPU가 각자 스레드를 실행한다. 각 스레드는 CPU 캐시에서 데이터를 불러와 사용한다.
- 다중 CPU를 사용하면 멀티 스레드 환경에서 데이터 동기화 문제가 발생한다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/java-volatile-01.png" width="50%" class="image__border image__padding">
</div>
<center>http://tutorials.jenkov.com/java-concurrency/volatile.html</center>

<br/>

CPU마다 다른 캐시가 연결되어 있기 때문에 서로 다른 스레드에서 같은 객체의 같은 변수를 사용하더라도 다른 값을 읽어 사용할 수 있다.

- CPU1은 Thread1을 실행한다.
- CPU2는 Thread2를 실행한다.
- CPU1은 Thread1을 수행하면서 count 변수를 읽어 증가시키면서 작업을 수행한다.
- CPU2는 Thread2를 수행하면서 값의 변경 없이 사용한다.
- 같은 변수를 다른 값으로 사용하게 되면서 로직상의 문제가 발생한다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/java-volatile-02.png" width="50%" class="image__border image__padding">
</div>
<center>http://tutorials.jenkov.com/java-concurrency/volatile.html</center>

<br/>

위와 같은 문제를 해결하기 위해 **volatile 키워드를 사용**한다. volatile 키워드를 사용하면 CPU 캐시가 아닌 메인 메모리에 저장된 데이터를 사용한다. 데이터 불일치 문제는 해결할 수 있지만, 캐시를 사용하지 않는 만큼 성능이 떨어질 수 있다. 자바는 volatile 키워드 이외에도 멀티 스레드 환경에서 스레드 안전한 프로그래밍을 위해 다음과 같은 기능을 제공한다.

- volatile 키워드
- synchronized 키워드
- Atomic 클래스

synchronized 키워드나 Atomic 클래스는 동기화를 지원하지만, volatile 키워드는 가시성을 보장할 뿐 동기화를 지원하지 않는다. 데이터 동기화를 위해서는 synchronized 키워드나 Atomic 클래스를 사용해야 한다.

## 2. Practice

간단한 테스트 코드를 통해 volatile 키워드만 적용되었을 때 데이터 동기화가 잘 이루어지는지 살펴보겠다. 두 개의 스레드가 NormalInteger 객체를 공유한다.

- NormalInteger 객체에서 관리하는 value 데이터는 volatile 키워드가 적용되어 있다.
- 각 스레드는 값을 증가시키거나 감소시키는 연산을 수행한다.

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

실행 로그를 보면 데이터 동기화가 정상적으로 이루어지지 않는다. volatile 키워드만으로는 데이터를 동기화할 수 없음을 확인할 수 있다.

```
07:44:46.102 [main] INFO blog.in.action.volatilekeyword.VolatileTest - operation time: 9566, value: 216466
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-06-14-java-volatile>

#### RECOMMEND NEXT POSTS

- [Java Atomic 클래스][java-atomic-link]

#### REFERENCE

- <http://tutorials.jenkov.com/java-concurrency/volatile.html>

[java-atomic-link]: https://junhyunny.github.io/information/java/java-atomic/
