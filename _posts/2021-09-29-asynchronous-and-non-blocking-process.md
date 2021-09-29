---
title: "비동기(Asynchronous) 논블로킹(Non-Blocking) 처리 방식"
search: false
category:
  - information
  - java
last_modified_at: 2021-09-29T23:55:00
---

<br>

## 0. 들어가면서
기술 스택을 공부하다보니 비동기(Asynchronous) 논블로킹(Non-Blocking) 처리 방식에 대한 이야기가 많이 보입니다. 
어떤 내용인지 찾아 읽어보긴 했지만, 명확하게 이해하진 못 했습니다.
그러다 최근 `Spring Cloud Gateway`에 대한 `Spring Document`에서 논블로킹 처리를 수행하는 네티(Netty)가 필요하다는 글을 읽었습니다. 
기술 스택 사용 이전에 근본적인 개념에 대해 먼저 정립하는 것이 좋을 것 같아 포스트로 정리했습니다.

> Spring Doc - Spring Cloud Gateway<br>
> Spring Cloud Gateway requires the Netty runtime provided by Spring Boot and Spring Webflux. 
> It does not work in a traditional Servlet Container or when built as a WAR. 

## 1. 블로킹(Blocking) / 논블로킹(Non-Blocking) 방식
우선 블로킹(Blocking)과 논블로킹(Non-Blocking) 방식에 대해 정리해보았습니다. 
블로킹 방식은 어떤 일을 누군가에게 요청하고, 결과 혹은 응답이 오기를 계속 기다리는 것을 의미합니다. 
전통적인 서버 요청 방식이나 함수 호출을 예로 들 수 있습니다.

##### 블로킹(Blocking) 방식

<p align="center"><img src="/images/asynchronous-and-non-blocking-process-1.gif"></p>

논블로킹 방식은 말 그대로 `막히지 않는다. 멈추지 않는다.`라고 생각할 수 있습니다.
어떤 일을 누군가에게 요청한 후 결과를 기다리지 않고 자신의 일을 계속 수행해나가는 처리 방식을 의미합니다. 

##### 논블로킹(Non-Blocking) 방식

<p align="center"><img src="/images/asynchronous-and-non-blocking-process-2.gif"></p>

## 2. 동기(Synchronous) / 비동기(Asynchronous) 처리
이번엔 동기(Synchronous)와 비동기(Asynchronous) 처리에 대해 정리해보겠습니다. 
어렵게 생각했던 블로킹 방식보다 오히려 더 헷갈렸습니다. 
동기 방식과 비동기 방식의 차이는 스레드(thread)로 인해 발생하는 동시 실행 유무로 생각하고 있었는데, 예외적인 경우도 존재합니다.

특정 일(work) `A`와 `B`가 있다고 가정합니다. 
동시에 실행하더라도 둘 사이에 어떤 인과 관계 때문에 항상 `A`가 종료된 뒤에야 `B`가 종료될 수 있다면 이는 동기 처리로 볼 수 있습니다. 
예를 들어, `B`라는 사람의 일은 `A`라는 사람이 일을 잘하는지 감시하는 것이라고 합니다. 
그렇다면 `A`, `B` 모두 동시에 일을 하고는 있지만 필연적으로 `A`가 일을 마친 후에야 `B`의 일이 종료됩니다. 

##### 동기(Synchronous) 처리

<p align="center"><img src="/images/asynchronous-and-non-blocking-process-3.gif"></p>

## 3. 상황 별 코드 (feat. Java)
블로킹, 논블로킹 방식과 동기식, 비동기식 처리에 대한 용어를 혼합하여 사용하면서 혼돈을 일으키고 있는 것 같습니다. 
각 상황을 코드 수준으로 정리하면 좋을 것 같아서 구현해보았습니다. 
구현이 난해한 `비동기 블로킹 처리 방식`이나 `동기 논블로킹 처리 방식`에 대한 구현은 가능하다면 이후 업데이트하겠습니다. 

### 3.1. 동기 블록킹 처리
- `WorkerA`는 자신이 해야하는 일과 `WorkerB`가 해야하는 일을 모두 가지고 있습니다. 
- `WorkerA`는 `WorkerB`에게 일을 건냅니다. 
- `WorkerB`는 일을 시작합니다.
- `WorkerA`는 `WorkerB`가 일을 마친 후에 자신의 일을 수행합니다.

```java
package blog.in.action;

import java.util.function.Consumer;

public class SyncBlockingTest {

    static class WorkerA {

        Consumer<String> workForA = (message) -> {
            for (int index = 0; index < 3; index++) {
                for (int subIndex = 0; subIndex < 100000000; subIndex++) {
                }
                System.out.println("A doing something.");
            }
            System.out.println(message);
        };

        Consumer<String> workForB = (message) -> {
            for (int index = 0; index < 3; index++) {
                for (int subIndex = 0; subIndex < 100000000; subIndex++) {
                }
                System.out.println("B doing something.");
            }
            System.out.println(message);
        };

        void doMyWork() {
            workForA.accept("I'm worker A. And I'm done.");
        }

        Consumer<String> giveWorkToB() {
            return workForB;
        }
    }

    static class WorkerB {

        Consumer<String> myWork;

        void takeMyWork(Consumer<String> myWork) {
            this.myWork = myWork;
        }

        void doMyWork() {
            myWork.accept("I'm worker B. And I'm done.");
        }
    }

    public static void main(String[] args) {
        WorkerA a = new WorkerA();
        WorkerB b = new WorkerB();
        b.takeMyWork(a.giveWorkToB());
        b.doMyWork();
        a.doMyWork();
    }
}
```

##### 결과 로그

```
B doing something.
B doing something.
B doing something.
I'm worker B. And I'm done.
A doing something.
A doing something.
A doing something.
I'm worker A. And I'm done.
```

### 3.2. 비동기 논블로킹 처리
- `WorkerA`는 자신이 해야하는 일과 `WorkerB`가 해야하는 일을 모두 가지고 있습니다. 
- `WorkerA`는 `WorkerB`에게 일을 건냅니다. 
- `WorkerB`는 `WorkerA`에게 즉각 응답을 준 후 자신의 일을 시작합니다.,
- `WorkerA`는 응답을 받았으니 자신의 일을 수행합니다.

```java
package blog.in.action;

import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

public class AsyncNonBlockingTest {

    static class WorkerA {

        Consumer<String> workForA = (message) -> {
            for (int index = 0; index < 3; index++) {
                for (int subIndex = 0; subIndex < 100000000; subIndex++) {
                }
                System.out.println("A doing something.");
            }
            System.out.println(message);
        };


        Consumer<String> workForB = (message) -> {
            for (int index = 0; index < 3; index++) {
                for (int subIndex = 0; subIndex < 100000000; subIndex++) {
                }
                System.out.println("B doing something.");
            }
            System.out.println(message);
        };

        void doMyWork() {
            workForA.accept("I'm worker A. And I'm done.");
        }

        Consumer<String> getWorkForB() {
            return workForB;
        }
    }

    static class WorkerB {

        Consumer<String> myWork;

        void takeMyWork(Consumer<String> myWork) {
            this.myWork = myWork;
        }

        void doMyWork() {
            CompletableFuture.runAsync(() -> myWork.accept("I'm worker B. And I'm done."));
        }
    }

    public static void main(String[] args) {
        WorkerA a = new WorkerA();
        WorkerB b = new WorkerB();
        b.takeMyWork(a.getWorkForB());
        b.doMyWork();
        a.doMyWork();
    }
}
```

##### 결과 로그
- `WorkerA`와 `WorkerB`가 동시에 일하는 구간이 생깁니다.

```
A doing something.
B doing something.
A doing something.
A doing something.
I'm worker A. And I'm done.
B doing something.
B doing something.
I'm worker B. And I'm done.
```

#### REFERENCE
- <https://hamait.tistory.com/930>