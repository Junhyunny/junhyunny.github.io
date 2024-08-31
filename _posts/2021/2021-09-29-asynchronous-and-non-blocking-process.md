---
title: "Asynchronous Non-Blocking Handling"
search: false
category:
  - information
  - java
last_modified_at: 2021-09-29T23:55:00
---

<br/>

## 0. 들어가면서

최근 웹플럭스(webflux) 같은 기술 스택이 인기가 많아지면서 비동기(asynchronous), 논-블로킹(non-blocking) 관련된 내용들이 눈에 많이 띈다. 이 글은 비동기, 논-블로킹 처리에 대한 개념을 정리했다. 전적으로 이 [글](https://hamait.tistory.com/930)을 참고했다. 

## 1. Blocking and Non-Blocking

먼저 블로킹(blocking)과 논-블로킹(non-blocking)은 기술적으로 명확하다. 어떤 일을 요청하고 결과(혹은 응답)을 기다리는지 아닌지에 따라 블로킹, 논-블로킹이 구분된다. 먼저 블로킹은 요청을 보낸 후 응답을 기다린다. 예를 들면 서버 요청/응답 방식이나 일반적인 함수 호출을 예로 들 수 있다.

<div align="center">
  <img src="/images/posts/2021/asynchronous-and-non-blocking-process-01.gif" width="50%">
</div>

<br/>

논-블로킹 방식은 요청을 보낸 후 응답을 기다리지 않는다. 응답을 기다리기 위해 자신이 수행하는 일을 멈추지 않는다. 멀티 스레드(multi-thread) 같은 기술을 통해 구현할 수 있다.

<div align="center">
  <img src="/images/posts/2021/asynchronous-and-non-blocking-process-02.gif" width="50%">
</div>

## 2. Synchronous and Asynchronous

동기(synchronous)와 비동기(asynchronous)식 처리는 행위가 순차적으로 진행되는냐 아닌가에 대한 정의이다. 멀티 스레드인지 아닌지에 따라 구분되는 것이 아니다. 어떤 작업들이 순차적으로 진행되었는지 아닌지에 대한 이야기다. 

이해를 돕기 위한 예시를 위해 `작업자A`, `작업자B`가 있다고 가정한다. 작업자A는 `A1`, `A2` 업무를 해야 한다. 작업자B는 `AB`, `B1` 업무를 할 수 있다. 동기식 방식은 일이 순차적으로 작동하는 것이다. 

1. 작업자A는 A1 업무를 마친다.
2. 작업자A는 작업자B에게 AB 업무를 요청하고 결과를 기다린다.
3. 작업자B는 AB 업무를 마치고 결과를 작업자A에게 전달한다.
4. 작업자A는 AB 결과를 받고 A2 업무를 시작한다.

작업 A1, AB, A2는 항상 순서대로 진행되기 때문에 동기식으로 처리된 것이다. 이번엔 비동기식 방식에 대해 알아보자. 비동기식 방식은 작업이 작업 순서가 순차적인 것을 보장하지 않는다. 

1. 작업자A는 A1 업무를 진행하는 중이다.
2. 작업자A는 작업자B에게 AB 업무를 요청하고 A1 업무를 이어서 진행한다.
3. 작업자B는 상황에 따라 다르게 동작한다.
  - 한가해서 즉시 AB 업무를 시작할 수 있다.
  - B1 업무를 하는 중이기 때문에 바로 AB 업무를 시작하지 못한다.
4. 작업자A는 A1 업무가 끝나면 A2 업무를 시작한다.

작업자B의 AB 업무는 즉시 시작할 수도 있고, B1 업무가 끝나고 시작될 수 있다. B1 업무량에 따라 금새 시작할 수도 있고, 늦게 시작할수도 있다. A1, A2, AB의 작업 순서는 보장할 수 없다. 작업자B 상황에 따라 A1, A2, AB 순서대로 진행될 수도 있고, A1, AB, A2 순서대로 진행될 수도 있다. A1과 AB 작업이 혹은 A2과 AB 작업이 병렬적으로 진행될 수도 있다. 작업자B의 상황에 따라 작업들의 순서가 뒤죽박죽이다. 

## 3. Combine situations

블로킹, 논-블로킹, 동기, 비동기 개념은 서로 조합되어 이야기된다. 자연스러운 조합도 있지만, 직관적인 이해가 어려운 조합도 있다.

<div align="center">
  <img src="/images/posts/2021/asynchronous-and-non-blocking-process-03.png" width="80%" class="image__border">
</div>
<center>https://hamait.tistory.com/930</center>

<br/>

블로킹과 동기식 처리에 조합은 자연스럽다. 요청을 보내고 결과를 기다린다. 자연스럽게 모든 행위가 동기식으로 처리된다. 논-블로킹과 비동기 조합도 자연스럽다. 요청을 보낸 후 결과를 기다리지 않고 각자 일을 처리하기 때문에 행위들의 순서가 보장되지 않는다. 블로킹과 동기식 조합과 논-블로킹과 비동기식 조합은 너무 자연스럽기 때문에 각 조합의 용어들이 혼용되어 사용된다. 

직관적인 이해가 어려운 경우도 있다. 블로킹과 비동기식 처리의 조합이다. 작업이 블로킹되는데 왜 순서가 보장되지 않는가? 혹은 논-블로킹과 동기식 처리의 조합이다. 기다리지 않는데 작업의 순서가 어떻게 보장되는가? 자연스럽지 않은 상황에 대한 설명은 내가 [참고한 글](https://hamait.tistory.com/930)의 각 시나리오를 읽어보길 바란다. 

## 4. Examples

직관적으로 이해가 쉬운 `블로킹/동기식`, `논-블로킹/비동기` 조합에 대한 예제 코드를 살펴보자. 

### 4.1. Blocking and Synchronous Combination

먼저 블로킹/동기식 조합에 대한 예제 코드를 살펴보자. `WorkerA`, `WorkerB` 객체가 있다. 

1. WorkerA 객체는 WorkerB 객체에게 필요한 작업을 요청한다.
  - WorkerB 객체는 즉시 요청을 처리한다.
2. WorkerB 객체의 작업이 끝나면 WorkerA 객체가 작업을 시작한다.

```java
package blog.in.action;

import java.util.function.BiConsumer;

public class SyncBlockingTest {

    public static void main(String[] args) {
        WorkerA a = new WorkerA();
        WorkerB b = new WorkerB();


        b.takeRequest(a.giveRequest()); // 1
        a.doWork(); // 2
        System.out.println("All workers finish the works.");
    }

    static class WorkerA {

        BiConsumer<String, String> work = (name, message) -> {
            for (int index = 0; index < 5; index++) {
                for (int subIndex = 0; subIndex < Integer.MAX_VALUE; subIndex++) {
                }
                System.out.printf("%s: doing something for my work.\n", name);
            }
            System.out.printf("%s: %s\n", name, message);
        };

        void doWork() {
            work.accept("A", "I'm worker A. And I'm done.");
        }

        BiConsumer<String, String> giveRequest() {
            return (name, message) -> {
                for (int index = 0; index < 5; index++) {
                    for (int subIndex = 0; subIndex < Integer.MAX_VALUE; subIndex++) {
                    }
                    System.out.printf("%s: doing something for request.\n", name);
                }
                System.out.printf("%s: %s\n", name, message);
            };
        }
    }

    static class WorkerB {

        void takeRequest(BiConsumer<String, String> request) {
            request.accept("B", "I'm worker B. And I'm done.");
        }
    }
}
```

실행 로그를 보면 항상 WorkerB 객체가 일을 마친 후 WorkerA 객체가 일을 수행한다.

```
B: doing something for request.
B: doing something for request.
B: doing something for request.
B: doing something for request.
B: doing something for request.
B: I'm worker B. And I'm done.
A: doing something for my work.
A: doing something for my work.
A: doing something for my work.
A: doing something for my work.
A: doing something for my work.
A: I'm worker A. And I'm done.
All workers finish the works.
```

### 4.2. Non-Blocking and Asynchronous Combination

이번엔 논-블로킹/비동기식 조합에 대한 예제 코드를 살펴보자. `WorkerA`, `WorkerB` 객체가 있다. WorkerB 객체가 전달 받은 요청을 비동기식으로 처리하는 부분만 다르다. CompletableFuture 클래스를 사용해 멀티 스레드 방식으로 처리했다. 

1. WorkerA 객체는 WorkerB 객체에게 필요한 작업을 요청한다.
2. WorkerB 객체는 비동기식으로 요청을 처리한다.
3. WorkerA 객체는 WorkerB 객체의 작업이 끝나길 기다리지 않고 바로 작업을 시작한다.

```java
package blog.in.action;

import java.util.concurrent.CompletableFuture;
import java.util.function.BiConsumer;

public class AsyncNonBlockingTest {

    public static void main(String[] args) {
        WorkerA a = new WorkerA();
        WorkerB b = new WorkerB();


        CompletableFuture<Void> joinPoint = b.takeRequest(a.giveRequest()); // 1
        a.doWork(); // 3
        joinPoint.join();
        System.out.println("All workers finish the works.");
    }

    static class WorkerA {

        BiConsumer<String, String> work = (name, message) -> {
            for (int index = 0; index < 5; index++) {
                for (int subIndex = Integer.MIN_VALUE; subIndex < Integer.MAX_VALUE; subIndex++) {
                }
                System.out.printf("%s: doing something for my work.\n", name);
            }
            System.out.printf("%s: %s\n", name, message);
        };

        void doWork() {
            work.accept("A", "I 'm worker A. And I' m done.");
        }

        BiConsumer<String, String> giveRequest() {
            return (name, message) -> {
                for (int index = 0; index < 5; index++) {
                    for (int subIndex = Integer.MIN_VALUE; subIndex < Integer.MAX_VALUE; subIndex++) {
                    }
                    System.out.printf("%s: doing something for request.\n", name);
                }
                System.out.printf("%s: %s\n", name, message);
            };
        }
    }

    static class WorkerB {

        CompletableFuture<Void> takeRequest(BiConsumer<String, String> myWork) {
            return CompletableFuture.runAsync( // 2
                    () -> myWork.accept("B", "I'm worker B. And I'm done.")
            );
        }
    }
}
```

WorkerA 객체와 WorkerB 객체가 동시에 일하는 구간이 생긴다. 여러 번 실행하다 보면 업무를 먼저 끝나는 객체가 바뀌기도 한다.

```
A: doing something for my work.
B: doing something for request.
A: doing something for my work.
A: doing something for my work.
A: doing something for my work.
A: doing something for my work.
A: I 'm worker A. And I' m done.
B: doing something for request.
B: doing something for request.
B: doing something for request.
B: doing something for request.
B: I'm worker B. And I'm done.
All workers finish the works.
```

```
A: doing something for my work.
B: doing something for request.
A: doing something for my work.
A: doing something for my work.
B: doing something for request.
B: doing something for request.
B: doing something for request.
B: doing something for request.
A: doing something for my work.
A: doing something for my work.
A: I 'm worker A. And I' m done.
B: I'm worker B. And I'm done.
All workers finish the works.
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-09-29-asynchronous-and-non-blocking-process>

#### REFERENCE

- <https://hamait.tistory.com/930>