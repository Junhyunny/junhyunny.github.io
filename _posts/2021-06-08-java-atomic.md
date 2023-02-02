---
title: "Java Atomic"
search: false
category:
  - information
  - java
last_modified_at: 2021-09-03T02:00:00
---

<br/>

## 0. 들어가면서

Java는 멀티 스레드 환경에서 thread-safe 한 개발을 할 수 있도록 `Atomic`이라는 키워드가 붙은 클래스를 제공합니다. 
멀티 스레드 프로그램을 지원하는 클래스이므로 `java.util.concurrent.atomic` 패키지에 위치합니다. 
이름에 `Atomic`이라는 키워드가 붙은 이유가 무엇일까요? 
아마도 컴퓨터의 원자적인 연산(Atomic operation)이라는 개념과 연관이 있어보입니다. 
우선 원자적인 연산이 무엇인지 알아보겠습니다.

## 1. 원자적인 연산(Atomic operation)

> 원자성(atomicity) - Wiki<br/>
> 어떤 것이 더 이상 쪼개질 수 없는 성질을 말한다. 

원자성의 사전적 의미를 바탕으로 보면 `원자적인 연산`이라는 것은 `'더는 쪼개질 수 없는 연산'`을 뜻합니다. 
사실 Java에서 코드 한 줄이 컴퓨터 입장에서 `'Atomic'` 한 연산은 아닙니다. 
가장 대표적으로 예를 드는 것이 `++` 단항 연산자입니다. 

##### 단항 연산자 > 기계어 변경 시 수행 내용
<p align="center"><img src="/images/java-atomic-1.JPG" width="50%"></p>
<center>[JAVA] concurrent programming - Atomic(원자성)</center>

기계어로 변경되어 원자적이지 않은 연산이 된 코드는 수행할 때 다른 스레드에 데이터의 변형이 발생할 수 있습니다. 
프로세스 내 스레드 사이에는 변수를 이용하여 데이터를 공유할 수 있기 때문입니다. 
Java는 이런 동시성 문제를 제어하기 위한 기능을 제공하는데 그 중 한가지가 `Atomic` 키워드가 붙은 클래스들입니다. 
`Atomic` 키워드가 붙은 클래스들 중 대표적으로 AtomicInteger를 살펴보도록 하겠습니다. 

##### AtomicInteger 클래스
- volatile 키워드가 붙은 value 변수를 사용합니다.
- volatile 키워드가 붙어있기 때문에 CPU 캐시가 아닌 메인 메모리에서 데이터를 가져옵니다. 

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

## 2. CAS(Compare-And-Swap)

Java AtomicInteger 클래스는 compareAndSet() 이라는 이름의 메소드를 제공합니다. 
compareAndSet() 메소드는 Atomic 클래스들의 핵심 기능이라고 소개해도 과언이 아닙니다. 
Java의 메소드 명은 compareAndSet() 이지만 관련된 내용을 찾아보면 CAS(Compare-And-Swap) 매커니즘을 구현한 듯 합니다. 
자세한 내용을 알아보도록 하겠습니다. 

> CAS(Compare-And-Swap) - Wiki<br/>
> In computer science, compare-and-swap (CAS) is an atomic instruction used in multithreading to achieve synchronization.
> It compares the contents of a memory location with a given value and, only if they are the same, modifies the contents of that memory location to a new given value.

직역하자면 CAS(Compare-And-Swap)는 멀티 스레드 환경에서 직렬화를 이루기 위한 원자적인 연산입니다. 
이전 값(old value)과 새로운 값(new value)을 전달한 후 이전 값과 현재 메모리에 있는 데이터가 같은 경우에 새로운 값으로 해당 메모리 위치의 값을 변경합니다. 
변경 성공 여부에 따라 true, false를 반환합니다. 
CAS 알고리즘을 구현하고 있는 Java 코드를 살펴보겠습니다. 

### 2.1. AtomicInteger 클래스 주요 메소드
- getAndSet() 메소드는 이전 값을 반환하고 새로운 값을 메모리에 업데이트합니다.
- compareAndSet() 메소드는 이전 값을 새로운 값으로 변경하고 성공 여부를 반환합니다. 
    - 메모리에 있는 값과 expectedValue 변수의 값이 같은 경우에 수행됩니다.
- 두 메소드 모두 U(Unsafe 객체)에게 역할을 위임하고 있습니다.

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

### 2.2. Unsafe 클래스 주요 메소드
- native 메소드이며 원자적인 업데이트를 수행한다는 설명을 볼 수 있습니다.
- getAndSetInt() 메소드는 compareAndSet 메소드를 반복 수행하여 변경에 성공하면 이전 값을 반환합니다.

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

## 3. synchronized 키워드, Atomic 클래스 성능 비교  

`'Java는 synchronized 키워드를 이용해 이미 동시성 제어가 가능한데 Atomic 클래스를 왜 제공하는거지?'🤨`

관련된 글들을 찾아보던 중에 흥미로운 내용이 있었습니다. 
synchronized 키워드와 Atomic 클래스를 이용하였을 때 성능을 비교한 글인데 저도 비슷한 코드를 작성해보았습니다. 

### 3.1. synchronized 키워드를 이용한 동시성 제어

#### 3.1.1. NormalInteger 클래스
- 테스트를 위한 NormalInteger 클래스를 작성합니다.

```java
    class NormalInteger {

        volatile int value;

        NormalInteger(int value) {
            this.value = value;
        }
    }

```
#### 3.1.2. SynchronizedThread 클래스
- Thread 클래스를 상속받습니다.
- 외부에서 전달받은 normalInteger 객체의 값을 변경합니다.
- operation 변수 값에 따라 증감 연산을 수행합니다.
- 각 스레드 별로 Integer.MAX_VALUE / 10 회 반복 수행합니다.

```java
    class SynchronizedThread extends Thread {

        boolean operation;

        NormalInteger normalInteger;

        public SynchronizedThread(boolean operation, NormalInteger normalInteger) {
            this.operation = operation;
            this.normalInteger = normalInteger;
        }

        void add() {
            synchronized (normalInteger) {
                normalInteger.value++;
            }
        }

        void subtract() {
            synchronized (normalInteger) {
                normalInteger.value--;
            }
        }

        @Override
        public void run() {
            int limit = Integer.MAX_VALUE / 10;
            for (int index = 0; index < limit; index++) {
                if (operation) {
                    add();
                } else {
                    subtract();
                }
            }
        }
    }
```

#### 3.1.3. 테스트 수행
- 데이터를 공유할 integer 객체를 생성합니다.
- 증가시키는 연산을 수행하는 addTh 객체를 생성합니다.
- 감소시키는 연산을 수행하는 subTh 객체를 생성합니다.
- 수행 후 연산에 걸리는 시간과 동시성 제어에 성공하였는지 확인합니다.

```java
    @Test
    public void synchronized_test() throws InterruptedException {
        long start = System.currentTimeMillis();
        NormalInteger integer = new NormalInteger(0);
        Thread addTh = new SynchronizedThread(true, integer);
        Thread subTh = new SynchronizedThread(false, integer);
        addTh.start();
        subTh.start();
        addTh.join();
        subTh.join();
        long end = System.currentTimeMillis();
        log.info("operation time: " + (end - start) + ", value: " + integer.value);
    }
```

##### synchronized 키워드를 이용한 동시성 제어 수행 결과
- 수행에 걸리는 시간 - 15583ms

```
06:25:01.928 [main] INFO blog.in.action.atomic.AtomicIntegerTest - operation time: 15583, value: 0
```

### 3.2. Atomic 클래스를 이용한 동시성 제어

#### 3.2.1. AtomicThread 클래스
- AtomicInteger 객체를 사용했다는 것을 제외하면 SynchronizedThread 클래스 구현과 동일합니다.

```java
    class AtomicThread extends Thread {

        boolean operation;

        AtomicInteger atomicInteger;

        public AtomicThread(boolean operation, AtomicInteger atomicInteger) {
            this.operation = operation;
            this.atomicInteger = atomicInteger;
        }

        void add() {
            atomicInteger.incrementAndGet();
        }

        void subtract() {
            atomicInteger.decrementAndGet();
        }

        @Override
        public void run() {
            int limit = Integer.MAX_VALUE / 10;
            for (int index = 0; index < limit; index++) {
                if (operation) {
                    add();
                } else {
                    subtract();
                }
            }
        }
    }
```

#### 3.2.2. 테스트 수행
- AtomicInteger 객체를 사용했다는 것을 제외하면 synchronized_test 메소드 구현과 동일합니다.

```java
    @Test
    public void atomic_test() throws InterruptedException {
        long start = System.currentTimeMillis();
        AtomicInteger integer = new AtomicInteger(0);
        Thread addTh = new AtomicThread(true, integer);
        Thread subTh = new AtomicThread(false, integer);
        addTh.start();
        subTh.start();
        addTh.join();
        subTh.join();
        long end = System.currentTimeMillis();
        log.info("operation time: " + (end - start) + ", value: " + integer.get());
    }
```

##### Atomic 클래스를 이용한 동시성 제어 수행 결과
- 수행에 걸리는 시간 - 6407ms

```
06:25:35.780 [main] INFO blog.in.action.atomic.AtomicIntegerTest - operation time: 6407, value: 0
```

## CLOSING
흥미로운 사실은 synchronized 키워드를 제거하고 수행한 결과의 속도도 Atomic 클래스를 사용한 테스트보다 느리다는 점입니다. 
물론 동시성 제어도 실패하였습니다. 

##### synchronized 키워드를 제거한 synchronized_test 메소드 수행 결과
- PC 환경 탓이 있겠지만 값의 차이가 매우 크게 나타납니다. 

```
06:26:54.011 [main] INFO blog.in.action.atomic.AtomicIntegerTest - operation time: 7204, value: 5661441
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-06-08-java-atomic>

#### REFERENCE
- [[JAVA] concurrent programming - Atomic(원자성)][java-blog-link]
- <https://mygumi.tistory.com/111>
- <https://happyourlife.tistory.com/142>

[java-blog-link]: https://rightnowdo.tistory.com/entry/JAVA-concurrent-programming-Atomic%EC%9B%90%EC%9E%90%EC%84%B1 