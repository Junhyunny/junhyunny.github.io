---
title: "Race Condition"
search: false
category:
  - information
  - operating-system
  - junit
last_modified_at: 2021-08-22T12:30:00
---

<br>

#### RECOMMEND POSTS BEFORE THIS

* [Proccess and Thread][process-vs-thread-link]

## 1. What is Race Condition?

> Wikipedia<br>
> 공유 자원에 대해 여러 개의 프로세스가 동시에 접근을 시도할 때 접근의 타이밍이나 순서 등이 결과 값에 영향을 줄 수 있는 상태

공유되는 자원(resource)을 둘 이상의 프로세스가 동시에 접근해 사용하는 경우 발생합니다. 
자원을 변경하지 않는 안전한 연산일 경우엔 문제가 되지 않습니다. 
하지만 자원을 변경하는 연산을 수행할 때 접근하는 순서, 프로세스의 실행 시간 등에 영향을 받아 매번 실행 결과가 달라질 수 있습니다. 

### 1.1. Simple Case of Race Condition

아래 시나리오를 통해 해당 개념을 쉽게 알아보도록 하겠습니다.

1. 두 프로세스 `P1`, `P2`가 존재합니다. 
1. 두 프로세스의 수행 시간은 동일합니다.
1. 두 프로세스의 연산은 각기 다릅니다.
1. 동일한 공유 데이터 상태를 읽어 각자 다른 연산을 수행하여 이를 저장합니다.
    * `P1` 프로세스가 먼저 수행한 경우에는 -100이 저장됩니다.
    * `P2` 프로세스가 먼저 수행한 경우에는 +100이 저장됩니다.

<p align="center">
    <img src="/images/race-condition-1.JPG" width="80%">
</p>

## 2. Critical Section

경쟁 상태를 자세히 들여다보기 전에 임계 영역(Critical Section)이 무엇인지 먼저 알아보겠습니다. 

> Operating System Concepts 9th<br/>
> Each process has a segment of code, called a critical section, in which the process may be changing common variables, updating a table, writing a fle, and so on.

간단하게 설명하면 프로그램에서 공유 자원을 사용하는 코드 영역을 의미합니다. 
임계 영역 내부에서 둘 이상의 프로세스가 공유 자원을 사용하면 에측할 수 없는 결과를 만들게 됩니다. 
그렇기 때문에 임계 영역에 대한 프로세스들의 동시적인 접근 문제를 잘 제어한다면 경쟁 상태를 해결할 수 있습니다. 

### 2.1. Solve the problem of Critical Section

임계 영역 문제를 해결하기 위해선 다음과 같은 조건들이 필요합니다.

#### 2.1.1. Mutual exclusion

* 프로세스의 임계 영역 접근을 상호 배제(mutual exclusion)합니다. 
* 임계 영역 내에서 한 프로세스가 일을 수행 중이라면 다른 프로세스들은 임계 영역 내에서 일을 할 수 없습니다.
* 뮤텍스(Mutex), 세마포어(Semaphore) 같은 lock 메커니즘을 통해 구현할 수 있습니다.

<p align="center">
    <img src="/images/race-condition-2.JPG" width="80%" class="image__border">
</p>

#### 2.1.2. Progress

* 프로세스의 임계 영역 접근을 진행(progress)합니다. 
* 임계 영역 내에 일하는 프로세스가 없다면, 대기 중인 프로세스 중에서 다음으로 일을 수행할 프로세스를 선택합니다.

<p align="center">
    <img src="/images/race-condition-3.JPG" width="80%" class="image__border">
</p>

#### 2.1.3. Bounded Waiting

* 프로세스들을 무한정 대기시키지 않습니다. 
* 제한되는 대기 시간을 가집니다.

<p align="center">
    <img src="/images/race-condition-4.JPG" width="80%" class="image__border">
</p>

## 3. Practice

위 설명은 프로세스를 기준으로 정리되었지만, 스레드(thread)도 마찬가지로 작은 실행 흐름으로써 공유 자원에 대한 경쟁 상태를 가질 수 있습니다. 
스레드들끼린 메모리를 공유할 수 있으며, 이번 포스트에선 하나의 객체를 공유하는 스레드들 사이에 발생하는 경쟁 상태를 간단한 코드로 재현하였습니다. 

* 동일한 객체를 두 스레드가 동시에 접근합니다.
    * 공유 자원의 초기 값은 0입니다.
* `스레드1`은 다음과 같은 작업을 수행합니다.
    * 공유 자원의 상태를 1씩 증가시킵니다.
    * 이를 100회 반복합니다. 
* `스레드2`은 다음과 같은 작업을 수행합니다.
    * 공유 자원의 상태를 1씩 감소시킵니다.
    * 이를 100회 반복합니다.
* 위 작업을 100회 반복 수행하여 공유 자원의 상태가 0으로 끝나는 횟수가 몇 번인지 확인합니다.

### 3.1. Race Condition

```java
package blog.in.action.raceccondition;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@Log4j2
@SpringBootTest
public class NotSynchronizedTest {

    class Resource {

        int data = 0;

        public void add(int value) {
            data += value;
        }

        public void substract(int value) {
            data -= value;
        }
    }

    class T1 extends Thread {

        int time;
        Resource resource;

        public T1(int time, Resource resource) {
            this.time = time;
            this.resource = resource;
        }

        @Override
        public void run() {
            // 1번 스레드의 임계 영역
            for (int index = 0; index < time; index++) {
                resource.add(1);
            }
        }
    }

    class T2 extends Thread {

        int time;
        Resource resource;

        public T2(int time, Resource resource) {
            this.time = time;
            this.resource = resource;
        }

        @Override
        public void run() {
            // 2번 스레드의 임계 영역
            for (int index = 0; index < time; index++) {
                resource.substract(1);
            }
        }
    }

    @Test
    public void test() throws InterruptedException {
        int result = 0;
        int times = 1000;
        for (int index = 0; index < times; index++) {
            Resource sharedResource = new Resource();
            T1 t1 = new T1(100, sharedResource);
            T2 t2 = new T2(100, sharedResource);
            t1.start();
            t2.start();
            t1.join();
            t2.join();
            if (sharedResource.data == 0) {
                result++;
            }
        }
        log.info("정상적인 결과 / 총 테스트 시도 = " + result + " / " + times);
    }
}
```

##### 임계 영역에 대한 동기화가 없는 CASE 결과

- 총 1000 건의 테스트 중에서 일부 케이스의 결과가 0이 아닌 것을 로그를 통해 확인할 수 있습니다.

```
2021-08-22 16:40:25.433  INFO 14848 --- [           main] b.i.a.r.NotSynchronizedTest              : 정상적인 결과 / 총 테스트 시도 = 994 / 1000
```

### 3.2. 임계 영역에 대한 동기화가 있는 CASE
- Java `synchronized` 키워드를 이용하여 스레드의 동시 접근을 제어하였습니다.

```java
package blog.in.action.raceccondition;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import lombok.extern.log4j.Log4j2;

@Log4j2
@SpringBootTest
public class SynchronizedTest {

    class Resource {

        int data = 0;

        public void add(int value) {
            data += value;
        }

        public void substract(int value) {
            data -= value;
        }
    }

    class T1 extends Thread {

        int time;
        Resource resource;

        public T1(int time, Resource resource) {
            this.time = time;
            this.resource = resource;
        }

        @Override
        public void run() {
            // 1번 스레드의 임계 영역에 대한 동시 접근 제어
            synchronized (resource) {
                for (int index = 0; index < time; index++) {
                    resource.add(1);
                }
            }
        }
    }

    class T2 extends Thread {

        int time;
        Resource resource;

        public T2(int time, Resource resource) {
            this.time = time;
            this.resource = resource;
        }

        @Override
        public void run() {
            // 2번 스레드의 임계 영역에 대한 동시 접근 제어
            synchronized (resource) {
                for (int index = 0; index < time; index++) {
                    resource.substract(1);
                }
            }
        }
    }

    @Test
    public void test() throws InterruptedException {
        int result = 0;
        int times = 1000;
        for (int index = 0; index < times; index++) {
            Resource sharedResource = new Resource();
            T1 t1 = new T1(100, sharedResource);
            T2 t2 = new T2(100, sharedResource);
            t1.start();
            t2.start();
            t1.join();
            t2.join();
            if (sharedResource.data == 0) {
                result++;
            }
        }
        log.info("정상적인 결과 / 총 테스트 시도 = " + result + " / " + times);
    }

}
```

##### 임계 영역에 대한 동기화가 있는 CASE 결과

- 총 1000 건의 테스트 모두 정상적으로 수행되었음을 로그를 통해 확인할 수 있습니다.

```
2021-08-22 16:42:34.312  INFO 16736 --- [           main] b.i.a.raceccondition.SynchronizedTest    : 정상적인 결과 / 총 테스트 시도 = 1000 / 1000
```

#### TEST CODE REPOSITORY
* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-02-26-race-condition>

#### RECOMMEND NEXT POSTS

* [Deadlock][deadlock-blog-link]

#### REFERENCE

* Operating System Concepts 9th
* <https://junhyunny.blogspot.com/2020/02/race-condition.html>

[deadlock-blog-link]: https://junhyunny.github.io/information/operating-system/dead-lock/
[process-vs-thread-link]: https://junhyunny.github.io/information/operating-system/process-vs-thread/