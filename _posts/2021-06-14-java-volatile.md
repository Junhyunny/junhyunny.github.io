---
title: "Java volatile"
search: false
category:
  - information
  - java
last_modified_at: 2021-09-03T02:00:00
---

<br/>

## 1. volatile 키워드

> The Java volatile keyword guarantees visibility of changes to variables across threads. 

Java volatile 키워드는 스레드 간의 변수 값 변경에 대한 가시성(visibility)을 보장합니다. 
가시성이라는 단어로 인해 어렵게 느껴질 수 있지만 말 그대로 `'데이터가 보인다.'`는 의미입니다. 
CPU는 성능상의 이유로 메인 메모리에 저장된 데이터를 직접 사용하지 않습니다. 
데이터에 조금 더 빠른 접근을 위해 CPU 캐시를 사용합니다. 

##### CPU 캐시 사용(Multi CPU 환경)

<p align="center"><img src="/images/java-volatile-1.JPG" width="50%"></p>
<center>http://tutorials.jenkov.com/java-concurrency/volatile.html</center>

N개의 CPU, 멀티 스레드 환경의 경우 데이터 동기화 문제가 발생합니다.  
다른 CPU가 각자의 스레드를 실행하면서 같은 변수를 사용하게 되는 경우가 그런 경우입니다. 

### 1.1. 메인 메모리와 CPU 캐시 간의 데이터 불일치 시나리오
- CPU1은 Thread1을 실행합니다.
- CPU2는 Thread2를 실행합니다.
- CPU1은 Thread1을 수행하면서 count 변수를 읽어 증가시키면서 작업을 수행합니다.
- CPU2는 Thread2를 수행하면서 값의 변경은 없이 사용합니다.
- 같은 변수를 다른 값으로 사용하게 되면서 로직 상의 문제가 발생합니다.

<p align="center"><img src="/images/java-volatile-2.JPG" width="50%"></p>
<center>http://tutorials.jenkov.com/java-concurrency/volatile.html</center>

이런 문제를 해결하기 위해 volatile 키워드를 사용합니다. 
volatile 키워드를 사용하면 CPU 캐시가 아닌 메인 메모리에 저장된 데이터를 사용합니다.
volatile 키워드는 데이터 불일치 문제는 해결할 수 있지만, 성능을 위해 캐시를 사용하는만큼 성능의 차이가 발생할 수 있습니다. 

## 2. volatile 키워드에 대한 오해
Java 멀티 스레드 환경 프로그래밍에 대한 대표적인 키워드를 꼽으면 `synchronized, Atomic class, volatile` 입니다. 
volatile 키워드는 스레드 간 데이터 동기화가 아닌 저장 공간이 다름으로 인해 발생하는 데이터 불일치를 해결합니다. 
멀티 스레드 환경에서 데이터 동기화는 volatile 키워드만으로 해결되지는 않습니다. 
`synchronized`, `Atomic 키워드 클래스`를 사용하여 데이터 동기화를 보장해야합니다.  

### 2.1. 데이터 불일치 테스트
- addTh, subTh Thread 객체가 NomalInteger 객체를 공유합니다.
- addTh, subTh 스레드는 각자 동일한 횟수만큼 데이터를 증감시킵니다.
- NormalInteger 객체의 멤버 변수인 value는 volatile 키워드를 붙혀 메인 메모리에서 데이터를 읽고 저장합니다.
- 결과를 확인합니다.

```java
package blog.in.action.volatilekeyword;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;

@Log4j2
public class VolatileTest {

    class NormalInteger {

        volatile int value;

        NormalInteger(int value) {
            this.value = value;
        }
    }

    class SynchronizedThread extends Thread {

        boolean operation;

        VolatileTest.NormalInteger normalInteger;

        public SynchronizedThread(boolean operation, VolatileTest.NormalInteger normalInteger) {
            this.operation = operation;
            this.normalInteger = normalInteger;
        }

        void add() {
            normalInteger.value++;
        }

        void subtract() {
            normalInteger.value--;
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

    @Test
    public void synchronized_test() throws InterruptedException {
        long start = System.currentTimeMillis();
        VolatileTest.NormalInteger integer = new VolatileTest.NormalInteger(0);
        Thread addTh = new VolatileTest.SynchronizedThread(true, integer);
        Thread subTh = new VolatileTest.SynchronizedThread(false, integer);
        addTh.start();
        subTh.start();
        addTh.join();
        subTh.join();
        long end = System.currentTimeMillis();
        log.info("operation time: " + (end - start) + ", value: " + integer.value);
    }
}
```

##### 결과 로그
- 조회된 데이터의 값이 7979137이므로 정상적인 데이터 동기화가 이루어지지 않았음을 확인합니다.

```
00:17:16.098 [main] INFO blog.in.action.volatilekeyword.VolatileTest - operation time: 7784, value: 7979137
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-06-14-java-volatile>

#### REFERENCE
- <http://tutorials.jenkov.com/java-concurrency/volatile.html>

[java-atomic-link]: https://junhyunny.github.io/information/java/java-atomic/