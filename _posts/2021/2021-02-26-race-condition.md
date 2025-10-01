---
title: "경쟁 상태(race condition)"
search: false
category:
  - information
  - operating-system
  - junit
last_modified_at: 2025-10-01T00:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Proccess and Thread][process-vs-thread-link]

## 1. What is Race Condition?

> Wikipedia<br/>
> 공유 자원에 대해 여러 개의 프로세스가 동시에 접근을 시도할 때 접근의 타이밍이나 순서 등이 결과 값에 영향을 줄 수 있는 상태

공유되는 자원(resource)을 둘 이상의 프로세스가 동시에 접근해 사용하는 경우 발생한다. 자원을 변경하지 않는 안전한 연산일 경우엔 문제가 되지 않는다. 하지만 자원을 변경하는 연산을 수행할 때 접근하는 순서, 프로세스의 실행 시간 등에 영향을 받아 매번 실행 결과가 달라질 수 있다. 

아래 시나리오를 통해 해당 개념을 쉽게 알아보자.

1. 두 프로세스 `P1`, `P2`가 존재한다.
2. 두 프로세스의 수행 시간은 동일하다.
3. 두 프로세스의 연산은 각기 다르다.
4. 동일한 공유 데이터 상태를 읽어 각자 다른 연산을 수행하여 이를 저장한다.
  - `P1` 프로세스가 먼저 수행한 경우에는 -100이 저장된다.
  - `P2` 프로세스가 먼저 수행한 경우에는 +100이 저장된다.

<div align="center">
  <img src="/images/posts/2021/race-condition-01.png" width="80%">
</div>

## 2. Critical Section

경쟁 상태를 자세히 들여다보기 전에 임계 영역(Critical Section)이 무엇인지 먼저 알아보자.

> Operating System Concepts 9th<br/>
> Each process has a segment of code, called a critical section, in which the process may be changing common variables, updating a table, writing a fle, and so on.

간단하게 설명하면 프로그램에서 공유 자원을 사용하는 코드 영역을 의미한다. 임계 영역 내부에서 둘 이상의 프로세스가 공유 자원을 사용하면 예측할 수 없는 결과를 만들게 된다. 그렇기 때문에 임계 영역에 대한 프로세스들의 동시적인 접근 문제를 잘 제어한다면 경쟁 상태를 해결할 수 있다. 

임계 영역 문제를 해결하기 위해선 우선 상호 배제(mutual exclusion)가 필요하다.

- 프로세스의 임계 영역 접근을 상호 배제한다.
- 임계 영역 내에서 한 프로세스가 일을 수행 중이라면 다른 프로세스들은 임계 영역 내에서 일을 할 수 없다.
- 뮤텍스(Mutex), 세마포어(Semaphore) 같은 lock 메커니즘을 통해 구현할 수 있다.

<div align="center">
  <img src="/images/posts/2021/race-condition-02.png" width="80%" class="image__border">
</div>

<br/>

임계 영역에 대한 상호 배제를 수행했다면 진행(process)을 가능하도록 만든다.

- 프로세스의 임계 영역 접근을 진행한다.
- 임계 영역 내에 일하는 프로세스가 없다면, 대기 중인 프로세스 중에서 다음으로 일을 수행할 프로세스를 선택한다.

<div align="center">
  <img src="/images/posts/2021/race-condition-03.png" width="80%" class="image__border">
</div>

<br/>

특정 프로세스가 진행이 가능하다면, 다른 프로세스들이 무제한 기다려선 안 된다. 대기하는 시간을 제한(bounded waiting)한다.

- 프로세스들을 무한정 대기시키지 않는다.
- 제한되는 대기 시간을 가진다.

<div align="center">
  <img src="/images/posts/2021/race-condition-04.png" width="80%" class="image__border">
</div>

## 3. Practice

위 설명은 프로세스를 기준으로 정리되었지만, 스레드(thread)도 마찬가지로 작은 실행 흐름으로써 공유 자원에 대한 경쟁 상태를 가질 수 있다. 스레드들끼리는 메모리를 공유할 수 있으며, 이번 포스트에선 하나의 객체를 공유하는 스레드들 사이에 발생하는 경쟁 상태를 간단한 코드로 재현해보자. 

- 공유 자원 객체를 생성한다.
- 동일한 객체를 두 스레드가 동시에 접근한다.
  - 공유 자원의 초기 값은 0이다.
- `스레드1`은 다음과 같은 작업을 수행한다.
  - 공유 자원의 상태를 1씩 증가시킨다.
  - 이를 100회 반복한다.
- `스레드2`은 다음과 같은 작업을 수행한다.
  - 공유 자원의 상태를 1씩 감소시킨다.
  - 이를 100회 반복한다.
- 위 작업을 100000회 반복 수행하여 공유 자원의 상태가 초기 값 0이 아닌 상태로 끝나는 횟수를 확인한다.

```java
package blog.in.action;

import org.junit.jupiter.api.Test;

import java.util.concurrent.CompletableFuture;

class SharedResource {
    int state;

    void increase() {
        this.state++;
    }

    void decrease() {
        this.state--;
    }

    void initialize() {
        this.state = 0;
    }

    boolean isCorrupted() {
        return this.state != 0;
    }
}

public class RaceConditionTest {

    @Test
    void race_condition() {
        int corruptedStateCount = 0;
        SharedResource sharedResource = new SharedResource();
        for (int index = 0; index < 100000; index++) {
            sharedResource.initialize();
            CompletableFuture<Void> thread1 = CompletableFuture.runAsync(() -> {
                for (int subIndex = 0; subIndex < 100; subIndex++) {
                    sharedResource.increase();
                }
            });
            CompletableFuture<Void> thread2 = CompletableFuture.runAsync(() -> {
                for (int subIndex = 0; subIndex < 100; subIndex++) {
                    sharedResource.decrease();
                }
            });
            thread1.join();
            thread2.join();
            if (sharedResource.isCorrupted()) {
                corruptedStateCount++;
            }
        }
        System.out.println(String.format("Corrupted shared resource count - %s", corruptedStateCount));
    }

}
```

해당 코드를 실행하면 다음과 같은 결과를 얻는다.

```
Corrupted shared resource count - 17
```

### 3.2. Race Condition with synchronized Keyword

`Java`는 임계 영역에 대한 동시성 제어를 `synchronized` 키워드를 통해 수행한다. 이를 사용하면 공유 자원을 안전하게 변경 가능하다. 

- 위와 동일한 방법으로 테스트를 수행하였다.
- `synchronized` 키워드를 사용해 공유 자원에 대한 각 스레드 접근을 동기화시킨다.

```java
    @Test
    void race_condition_with_synchronized() {
        int corruptedStateCount = 0;
        SharedResource sharedResource = new SharedResource();
        for (int index = 0; index < 100000; index++) {
            sharedResource.initialize();
            CompletableFuture<Void> thread1 = CompletableFuture.runAsync(() -> {
                for (int subIndex = 0; subIndex < 100; subIndex++) {
                    synchronized (sharedResource) {
                        sharedResource.increase();
                    }
                }
            });
            CompletableFuture<Void> thread2 = CompletableFuture.runAsync(() -> {
                for (int subIndex = 0; subIndex < 100; subIndex++) {
                    synchronized (sharedResource) {
                        sharedResource.decrease();
                    }
                }
            });
            thread1.join();
            thread2.join();
            if (sharedResource.isCorrupted()) {
                corruptedStateCount++;
            }
        }
        System.out.println(String.format("Corrupted shared resource count - %s", corruptedStateCount));
    }
```

코드 실행 결과는 다음과 같다.

```
Corrupted shared resource count - 0
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-02-26-race-condition>

#### RECOMMEND NEXT POSTS

- [교착 상태(deadlock)][deadlock-blog-link]

#### REFERENCE

- Operating System Concepts 9th
- <https://junhyunny.blogspot.com/2020/02/race-condition.html>

[deadlock-blog-link]: https://junhyunny.github.io/information/operating-system/dead-lock/
[process-vs-thread-link]: https://junhyunny.github.io/information/operating-system/process-vs-thread/