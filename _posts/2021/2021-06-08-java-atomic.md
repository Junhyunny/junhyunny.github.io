---
title: "Atomic Classes in Java"
search: false
category:
  - information
  - java
last_modified_at: 2021-09-03T02:00:00
---

<br/>

## 0. 들어가면서

Java는 멀티 스레드 환경에서 스레드 안전(thread-safe)를 위해 `Atomic` 키워드가 붙은 클래스를 제공합니다. 
java.util.concurrent.atomic 패키지에 위치합니다. 
`Atomic`이라는 키워드가 붙은 것처럼 원자적 연산(atomic operation)이라는 개념과 연관있어 보입니다. 
이 개념에 대해 먼저 살펴보겠습니다. 

## 1. Atomic Operation

> 원자성(atomicity) - 어떤 것이 더 이상 쪼개질 수 없는 성질을 말한다. 

원자적인 연산은 "더는 쪼개질 수 없는 연산"을 의미합니다. 
코드가 한 줄이더라도 원자적인 연산은 아닙니다. 
가장 대표적인 예시가 단항 연산자 `++` 입니다.

##### ++ 단항 연산자 

* 코드 한 줄이더라도 기계어로 변경되면 원자적이지 않은 연산이 될 수 있습니다.
* 현상의 원인은 프로세스 내 스레드들이 변수를 사용해 데이터를 공유하기 때문입니다. 

<p align="center">
    <img src="/images/java-atomic-1.JPG" width="80%" class="image__border image__padding">
</p>
<center>[JAVA] concurrent programming</center>

## 2. Atomic Classes

Java는 동시성 문제를 해결하기 위한 기능들을 제공합니다. 
그 중 하나가 `Atomic` 클래스들이며 이번 포스트에서는 대표적인 AtomicInteger 클래스를 살펴보겠습니다. 

##### AtomicInteger 클래스

* volatile 키워드가 붙은 value 변수에 데이터를 저장합니다.
    * volatile 키워드가 붙었기 때문에 CPU 캐시가 아닌 메인 메모리에서 직접 데이터를 읽습니다.

```java
public class AtomicInteger extends Number implements java.io.Serializable {

    private static final long serialVersionUID = 6214790243416807050L;

    /*
     * This class intended to be implemented using VarHandles, but there
     * are unresolved cyclic startup dependencies.
     */
    private static final jdk.internal.misc.Unsafe U = jdk.internal.misc.Unsafe.getUnsafe();
    private static final long VALUE = U.objectFieldOffset(AtomicInteger.class, "value");

    private volatile int value;

    // ...

    /**
     * Atomically sets the value to {@code newValue}
     * if the current value {@code == expectedValue},
     * with memory effects as specified by {@link VarHandle#compareAndSet}.
     *
     * @param expectedValue the expected value
     * @param newValue the new value
     * @return {@code true} if successful. False return indicates that
     * the actual value was not equal to the expected value.
     */
    public final boolean compareAndSet(int expectedValue, int newValue) {
        return U.compareAndSetInt(this, VALUE, expectedValue, newValue);
    }
    
    // ...
}
```

### 2.1. CAS(Compare-And-Swap)

`Atomic` 클래스가 어떻게 원자성을 보장하는지 이해하려면 CAS(compare and swap) 메커니즘에 대해 이해해야 합니다. 
위키(wiki)는 다음과 같이 정의하고 있습니다. 

> CAS(Compare-And-Swap)<br/>
> In computer science, compare-and-swap (CAS) is an atomic instruction used in multithreading to achieve synchronization. It compares the contents of a memory location with a given value and, only if they are the same, modifies the contents of that memory location to a new given value.

단순하게 설명하면 다음과 같이 동작합니다. 

* 이전 값(old value)과 새로운 값(new value)을 전달합니다. 
* 이전 값과 현재 메모리에 저장된 데이터가 같은 경우에 새로운 값으로 메모리의 데이터를 변경합니다.
* 성공 여부에 따라 true, false 값을 반환합니다.

`Atomic` 클래스들은 compareAndSet 이라는 메서드를 사용합니다. 
이름에서 볼 수 있듯이 CAS 메커니즘을 구현했을 것이라 예상할 수 있습니다. 
AtomicInteger 클래스를 기준으로 내부 메서드를 탐험해보겠습니다. 

#### 2.1.1. AtomicInteger Class

* getAndSet 메서드는 이전 값을 반환하고 새로운 값을 메모리에 업데이트합니다.
* compareAndSet 메서드는 이전 값을 새로운 값으로 변경하고 성공 여부를 반환합니다.
    * 메모리에 저장된 값과 expectedValue 변수의 값이 같은 경우에만 수행 완료됩니다.
* 두 메서드 모두 Unsafe 객체에게 동작을 위임합니다. 

```java
public class AtomicInteger extends Number implements java.io.Serializable {

    // ...

    /**
     * Atomically sets the value to {@code newValue} and returns the old value,
     * with memory effects as specified by {@link VarHandle#getAndSet}.
     *
     * @param newValue the new value
     * @return the previous value
     */
    public final int getAndSet(int newValue) {
        return U.getAndSetInt(this, VALUE, newValue);
    }

    /**
     * Atomically sets the value to {@code newValue}
     * if the current value {@code == expectedValue},
     * with memory effects as specified by {@link VarHandle#compareAndSet}.
     *
     * @param expectedValue the expected value
     * @param newValue the new value
     * @return {@code true} if successful. False return indicates that
     * the actual value was not equal to the expected value.
     */
    public final boolean compareAndSet(int expectedValue, int newValue) {`
        return U.compareAndSetInt(this, VALUE, expectedValue, newValue);
    }

    // ...
}
```

#### 2.1.2. Unsafe Class

* compareAndSetInt 메서드
    * 네이티브(native) 기능입니다.
    * 내부적으로 원자적인 업데이트를 수행합니다.
* getAndSetInt 메서드
    * compareAndSet 메서드를 반복 수행하여 변경에 성공하면 이전 값을 반환합니다.

```java
public final class Unsafe {
  
    // ...

    /**
     * Atomically exchanges the given value with the current value of
     * a field or array element within the given object {@code o}
     * at the given {@code offset}.
     *
     * @param o object/array to update the field/element in
     * @param offset field/element offset
     * @param newValue new value
     * @return the previous value
     * @since 1.8
     */
    @HotSpotIntrinsicCandidate
    public final int getAndSetInt(Object o, long offset, int newValue) {
        int v;
        do {
            v = getIntVolatile(o, offset);
        } while (!weakCompareAndSetInt(o, offset, v, newValue));
        return v;
    }

    /**
     * Atomically updates Java variable to {@code x} if it is currently
     * holding {@code expected}.
     *
     * <p>This operation has memory semantics of a {@code volatile} read
     * and write.  Corresponds to C11 atomic_compare_exchange_strong.
     *
     * @return {@code true} if successful
     */
    @HotSpotIntrinsicCandidate
    public final native boolean compareAndSetInt(Object o, long offset,
                                                 int expected,
                                                 int x);
    // ...
}
```

### 2.2. Performance Betwwen synchronized keyword and Atomic classes

Java는 동시성을 제어하기 위해 synchronized 키워드를 제공합니다. 
이미 동시성 제어 기능이 있음에도 `Atomic` 클래스들을 제공하는 이유는 성능 때문이라는 글을 읽은 기억이 납니다. 
관련된 내용을 직접 구현을 통해 살펴보겠습니다. 

* 19년형 Macbook
* 2.4 GHz 8코어 Intel Core i9
* 32GB 2667 MHz DDR4

#### 2.2.1. Using synchronized keyword

다음과 같은 코드를 작성합니다. 

* NormalInteger 클래스를 생성합니다.
* CompletableFuture 클래스를 사용해 두 개의 스레드를 경합시킵니다.
    * 한 스레드는 값을 증가, 한 스레드는 값을 감소시킵니다.
* 총 소요되는 시간과 최종 값을 확인합니다.

```java
package blog.in.action;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CompletableFuture;

@Getter
class NormalInteger {
    private volatile int value;

    NormalInteger(int value) {
        this.value = value;
    }

    public synchronized void increase() {
        value++;
    }

    public synchronized void decrease() {
        value--;
    }
}

@Slf4j
public class SynchronizeTest {

    final int limit = Integer.MAX_VALUE / 10;
    NormalInteger normalInteger;

    @Test
    void test() {
        normalInteger = new NormalInteger(0);

        long start = System.currentTimeMillis();

        var increaseThread = CompletableFuture.runAsync(() -> {
            for (int index = 0; index < limit; index++) {
                normalInteger.increase();
            }
        });
        var decreaseThread = CompletableFuture.runAsync(() -> {
            for (int index = 0; index < limit; index++) {
                normalInteger.decrease();
            }
        });

        increaseThread.join();
        decreaseThread.join();
        long end = System.currentTimeMillis();
        log.info("operation time: {}", (end - start));
        log.info("value: {}", normalInteger.getValue());
    }
}
```

##### Result

* 총 소요되는 시간은 16393 입니다.
* 최종 값은 0으로 정상적인 동기화가 이뤄졌음을 확인할 수 있습니다.

```
21:26:57.557 [main] INFO blog.in.action.SynchronizeTest - operation time: 16393
21:26:57.559 [main] INFO blog.in.action.SynchronizeTest - value: 0
```

#### 2.2.2. Using AtomicInteger class

다음과 같이 코드를 작성합니다.

* AtomicInteger 클래스를 사용합니다.
* CompletableFuture 클래스를 사용해 두 개의 스레드를 경합시킵니다.
    * 한 스레드는 값을 증가, 한 스레드는 값을 감소시킵니다.
* 총 소요되는 시간과 최종 값을 확인합니다.

```java
package blog.in.action;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicInteger;

@Log4j2
public class AtomicIntegerTest {

    final int limit = Integer.MAX_VALUE / 10;
    AtomicInteger atomicInteger;

    @Test
    void test() {
        atomicInteger = new AtomicInteger(0);

        long start = System.currentTimeMillis();

        var increaseThread = CompletableFuture.runAsync(() -> {
            for (int index = 0; index < limit; index++) {
                atomicInteger.incrementAndGet();
            }
        });
        var decreaseThread = CompletableFuture.runAsync(() -> {
            for (int index = 0; index < limit; index++) {
                atomicInteger.decrementAndGet();
            }
        });

        increaseThread.join();
        decreaseThread.join();
        long end = System.currentTimeMillis();
        log.info("operation time: {}", (end - start));
        log.info("value: {}", atomicInteger.get());
    }
}
```

##### Result

* 총 소요되는 시간은 8862 입니다.
    * synchronized 키워드를 사용했을 때보다 2배 정도 빠름을 확인할 수 있습니다.
* 최종 값은 0으로 정상적인 동기화가 이뤄졌음을 확인할 수 있습니다.

```
21:29:46.742 [main] INFO blog.in.action.AtomicIntegerTest - operation time: 8862
21:29:46.744 [main] INFO blog.in.action.AtomicIntegerTest - value: 0
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-06-08-java-atomic>

#### RECOMMEND NEXT POSTS

* [volatile in Java][java-volatile-link]

#### REFERENCE

* [[JAVA] concurrent programming - Atomic(원자성)][java-blog-link]
* <https://mygumi.tistory.com/111>
* <https://happyourlife.tistory.com/142>

[java-volatile-link]: https://junhyunny.github.io/information/java/java-volatile/
[java-blog-link]: https://rightnowdo.tistory.com/entry/JAVA-concurrent-programming-Atomic%EC%9B%90%EC%9E%90%EC%84%B1 