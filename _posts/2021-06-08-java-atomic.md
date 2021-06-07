---
title: "Java Atomic"
search: false
category:
  - information
  - java
last_modified_at: 2021-06-08T09:00:00
---

<br>

Java는 멀티 스레드 환경에서 thread-safe 한 개발을 할 수 있도록 `Atomic`이라는 키워드가 붙은 클래스를 제공합니다. 
멀티 스레드 프로그램을 지원하는 클래스이므로 `java.util.concurrent.atomic` 패키지에 위치합니다. 
이름에 `Atomic`이라는 키워드가 붙은 이유가 무엇일까요? 
제 느낌상 컴퓨터의 원자적인 연산(Atomic operation)이라는 개념과 연관이 있어 보입니다. 
우선 원자적인 연산이 무엇인지 알아보겠습니다.

## 원자적인 연산(Atomic operation)

> 원자성(atomicity) - Wiki<br>
> 어떤 것이 더 이상 쪼개질 수 없는 성질을 말한다. 

원자성의 사전적 의미를 바탕으로 보면 `원자적인 연산`이라는 것은 `'더는 쪼개질 수 없는 연산'`을 뜻합니다. 
사실 Java에서 코드 한 줄이 컴퓨터 입장에서 `'Atomic'` 한 연산은 아닙니다. 
가장 대표적으로 예를 드는 것이 `++` 단항 연산자입니다. 

##### 단항 연산자 > 기계어 변경 시 수행 내용
<p align="center"><img src="/images/java-atomic-1.JPG" width="50%"></p>
<center>이미지 출처, [JAVA] concurrent programming - Atomic(원자성)</center><br>

기계어로 변경되어 원자적이지 않은 연산이 된 코드는 수행할 때 다른 스레드에 데이터의 변형이 발생할 수 있습니다. 
프로세스 내 스레드 사이에는 변수를 이용하여 데이터를 공유할 수 있기 때문입니다. 
Java는 이런 동시성 문제를 제어하기 위한 기능을 제공하는데 그 중 한가지가 `Atomic` 키워드가 붙은 클래스들입니다. 
`Atomic` 키워드가 붙은 클래스들 중 대표적으로 AtomicInteger를 살펴보도록 하겠습니다. 

## AtomicInteger 클래스
- volatile 키워드가 붙은 value 값을 지니고 있습니다. 
- volatile 키워드를 통해 CPU 캐시가 아닌 메인 메모리에서 데이터를 가져옵니다. 
- 단순한 getter, setter 메소드를 제공합니다.
- getAndSetInt, compareAndSet 이라는 이름의 메소드를 제공합니다.

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

    /**
     * Returns the current value,
     * with memory effects as specified by {@link VarHandle#getVolatile}.
     *
     * @return the current value
     */
    public final int get() {
        return value;
    }

    /**
     * Sets the value to {@code newValue},
     * with memory effects as specified by {@link VarHandle#setVolatile}.
     *
     * @param newValue the new value
     */
    public final void set(int newValue) {
        value = newValue;
    }

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
    public final boolean compareAndSet(int expectedValue, int newValue) {
        return U.compareAndSetInt(this, VALUE, expectedValue, newValue);
    }

    // ...
}
```

Java AtomicInteger 클래스는 단순한 getter, setter 이 외에도 compareAndSet() 메소드를 제공합니다. 
compareAndSet() 메소드는 Atomic 클래스들의 핵심 기능이라고 소개해도 과언이 아닙니다. 
자세히 알아보도록 하겠습니다. 

### CAS(Compare-And-Swap) 알고리즘

> CAS(Compare-And-Swap) - Wiki<br>
> In computer science, compare-and-swap (CAS) is an atomic instruction used in multithreading to achieve synchronization.
> It compares the contents of a memory location with a given value and, only if they are the same, modifies the contents of that memory location to a new given value.

직역하자면 CAS, Compare_And_Swap 알고리즘은 메모리에 있는 데이터와 주어진 느린 데이터를 하여 값을

## synchronized 키워드, Atomic 클래스 성능 비교  
관련된 글을 보던 중 아주 흥미로운 글을 보았습니다. 
synchronized 키워드와 Atomic 클래스를 이용하였을 때 성능을 비교한 글인데 비슷한 코드를 작성해보았습니다. 

## OPINION
작성 중 입니다.

#### REFERENCE
- [[JAVA] concurrent programming - Atomic(원자성)][java-blog-link]
- <https://mygumi.tistory.com/111>
- <https://happyourlife.tistory.com/142>

[java-blog-link]: https://rightnowdo.tistory.com/entry/JAVA-concurrent-programming-Atomic%EC%9B%90%EC%9E%90%EC%84%B1 