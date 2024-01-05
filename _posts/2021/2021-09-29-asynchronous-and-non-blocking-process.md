---
title: "비동기(Asynchronous) 논블로킹(Non-Blocking) 처리 방식"
search: false
category:
  - information
  - java
last_modified_at: 2021-09-29T23:55:00
---

<br/>

## 0. 들어가면서
최근 기술 스택을 공부하다보면 비동기(Asynchronous) 논블로킹(Non-Blocking) 처리 방식에 대한 이야기를 많이 볼 수 있습니다. 
어떤 내용인지 찾아 읽어보긴 했지만, 명확하게 이해하진 못 했었습니다.

그러다 최근에 접해본 `Spring Cloud Gateway`가 논블로킹 처리를 수행하는 네티(Netty) 기반으로 동작한다는 글을 보았습니다. 
관심이 가는 기술 스택에 대해 공부하기 이전에 근본적인 개념에 대해 먼저 정리하는 것이 좋을 것 같아 포스트로 작성하였습니다. 

> Spring Doc - Spring Cloud Gateway<br/>
> Spring Cloud Gateway requires the Netty runtime provided by Spring Boot and Spring Webflux. 
> It does not work in a traditional Servlet Container or when built as a WAR. 

## 1. 블로킹(Blocking) / 논블로킹(Non-Blocking) 방식
우선 블로킹(Blocking)과 논블로킹(Non-Blocking) 방식에 대해 정리해보았습니다. 
블로킹 방식은 어떤 일을 누군가에게 요청하고, 결과 혹은 응답이 오기를 계속 기다리는 것을 의미합니다. 
전통적인 서버 요청 방식이나 일반적인 함수 호출을 예로 들 수 있습니다.

##### 블로킹(Blocking) 방식

<p align="center"><img src="/images/asynchronous-and-non-blocking-process-1.gif" width="50%"></p>

논블로킹 방식은 말 그대로 `막히지 않는다. 멈추지 않는다.`라고 생각할 수 있습니다.
어떤 일을 누군가에게 요청한 후 결과를 기다리지 않고 자신의 일을 계속 수행해나가는 처리 방식을 의미합니다. 

##### 논블로킹(Non-Blocking) 방식

<p align="center"><img src="/images/asynchronous-and-non-blocking-process-2.gif" width="50%"></p>

## 2. 동기(Synchronous) / 비동기(Asynchronous) 처리
이번엔 동기(Synchronous)와 비동기(Asynchronous) 처리에 대해 정리해보겠습니다. 
동기 방식과 비동기 방식의 차이는 스레드(thread)로 인해 발생하는 동시 실행 유무로 생각하고 있었는데, 예외인 경우가 존재합니다.
예외 케이스(case) 때문에 어렵게 생각했던 `블로킹 방식` 개념보다 더 헷갈렸습니다. 

예외 케이스에 대한 예를 들어보겠습니다. 
특정 일(work) `A`와 `B`가 있다고 가정합니다. 
동시에 실행하더라도 둘 사이에 어떤 인과 관계 때문에 항상 `A`가 종료된 뒤에야 `B`가 종료될 수 있다면 이는 동기 처리로 볼 수 있습니다. 
예를 들어, `B`라는 사람의 일은 `A`라는 사람이 일을 잘하는지 감시하는 것이라고 합니다. 
그렇다면 `A`, `B` 모두 동시에 일을 하고는 있지만 필연적으로 `A`가 일을 마친 후에야 `B`의 일이 종료됩니다. 

##### 싱글/멀티 스레드 환경 동기(Synchronous) 처리

<p align="center"><img src="/images/asynchronous-and-non-blocking-process-3.gif"></p>

## 3. 상황 별 코드 (feat. Java)
블로킹, 논블로킹 방식과 동기식, 비동기식 처리에 대한 용어를 혼합하여 사용하면서 혼돈을 일으키고 있는 것 같습니다. 
각 상황을 코드 수준으로 정리하면 좋을 것 같아서 구현해보았습니다. 
`동기 논블로킹 처리 방식`에 대한 구현은 추후 업데이트하겠습니다. 

### 3.1. 동기 블록킹 처리 방식
- `WorkerA`는 자신이 해야하는 일과 `WorkerB`가 해야하는 일을 모두 가지고 있습니다. 
- `WorkerA`는 `WorkerB`에게 일을 건내면, `WorkerB`은 전달받은 일을 수행합니다. 
- `WorkerA`는 `WorkerB`가 일을 마친 후에 자신의 일을 수행합니다.

```java
package blog.in.action;

import java.util.function.Consumer;

public class SyncBlockingTest {

    static class WorkerA {

        Consumer<String> workForA = (message) -> {
            for (int index = 0; index < 5; index++) {
                for (int subIndex = 0; subIndex < Integer.MAX_VALUE; subIndex++) {
                }
                System.out.println("A: doing something.");
            }
            System.out.println("A: " + message);
        };

        Consumer<String> workForB = (message) -> {
            for (int index = 0; index < 5; index++) {
                for (int subIndex = 0; subIndex < Integer.MAX_VALUE; subIndex++) {
                }
                System.out.println("B: doing something.");
            }
            System.out.println("B: " + message);
        };

        void doMyWork() {
            workForA.accept("I'm worker A. And I'm done.");
        }

        Consumer<String> giveWorkToB() {
            return workForB;
        }
    }

    static class WorkerB {

        void takeMyWorkAndDoMyWork(Consumer<String> myWork) {
            myWork.accept("I'm worker B. And I'm done.");
        }
    }

    public static void main(String[] args) {
        WorkerA a = new WorkerA();
        WorkerB b = new WorkerB();
        b.takeMyWorkAndDoMyWork(a.giveWorkToB());
        a.doMyWork();
    }
}
```

##### 결과 로그
- 항상 `WorkerB`가 일을 마친 뒤 `WorkerA`가 일을 수행합니다.

```
B: doing something.
B: doing something.
B: doing something.
B: doing something.
B: doing something.
B: I'm worker B. And I'm done.
A: doing something.
A: doing something.
A: doing something.
A: doing something.
A: doing something.
A: I'm worker A. And I'm done.
```

### 3.2. 동기 논블로킹 처리 방식
위에서 언급한 예외 케이스입니다. 
전달한 일은 논블로킹으로 처리되지만, 전달한 일이 끝났는지 확인 후 자신의 업무를 진행하므로 동기 처리가 됩니다.

- `WorkerA`는 `WorkerB`에게 업무를 전달합니다.
- `WorkerB`는 즉각 응답 후 자신의 일을 수행합니다.
    - CompletableFuture.runAsync() 메소드를 통해 새로운 스레드가 `WorkerB`의 일을 수행합니다.
- `WorkerA`는 `WorkerB`의 일이 끝났는지 지속적으로 확인합니다.
- `WorkerB`의 일이 끝나지 않았다면 일정 시간 대기 후 다시 확인합니다.
- `WorkerB`의 일이 끝났다면 자신의 남은 업무를 수행합니다.

```java
package blog.in.action;

import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

public class SyncNonBlockingTest {

    static class WorkerA {

        Consumer<String> ownJob = (message) -> {
            for (int index = 0; index < 3; index++) {
                for (int subIndex = 0; subIndex < 300000; subIndex++) {
                }
                System.out.println("A: doing something.");
            }
            System.out.println("A: " + message);
        };

        Consumer<String> workForB = (message) -> {
            for (int index = 0; index < 3; index++) {
                for (int subIndex = 0; subIndex < 300000; subIndex++) {
                }
                System.out.println("B: doing something.");
            }
            System.out.println("B: " + message);
        };

        void doMyWork() {
            ownJob.accept("I'm worker A. And I'm done.");
        }

        public Consumer<String> getWorkForB() {
            return workForB;
        }

        void isWorkForBFinished(CompletableFuture<Void> joinPoint) {
            while (!joinPoint.isDone()) {
                try {
                    Thread.sleep(2);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println("A: Worker B is still working. Continue check what B is finished.");
            }
            System.out.println("A: Worker B is done. Im gonna doing my work.");
        }
    }

    static class WorkerB {

        CompletableFuture<Void> doMyWork(Consumer<String> myWork) {
            return CompletableFuture.runAsync(() -> myWork.accept("I'm worker B. And I'm done."));
        }
    }

    public static void main(String[] args) {
        WorkerA a = new WorkerA();
        WorkerB b = new WorkerB();
        Consumer<String> workForB = a.getWorkForB();
        CompletableFuture<Void> joinPoint = b.doMyWork(workForB);
        a.isWorkForBFinished(joinPoint);
        a.doMyWork();
    }
}
```

##### 테스트 결과
- "B: doing something." - 일을 전달받은 `WorkerB`는 즉각 응답 후 자신의 일을 수행합니다.
- "A: Worker B is still working. Continue check what B is finished." - `WorkerA`는 자신의 일을 수행하지 않고 `WorkerB`의 일이 끝났는지 지속적으로 확인합니다.
- "B: I'm worker B. And I'm done." - `WorkerB`의 일이 끝났습니다.
- "A: Worker B is done. Im gonna doing my work." - `WorkerA`는 `WorkerB`의 일이 끝났음을 확인 후 자신의 업무를 수행합니다.
- "A: I'm worker A. And I'm done." - `WorkerA`는 자신의 업무를 마무리 짓습니다.
- 논블로킹 형태로 `WorkerA`와 `WorkerB`는 동시에 일을 수행하지만, 업무 관계상 필연적으로 `WorkerA`는 `WorkerB`의 일이 마치면 자신의 일을 마무리합니다.

```
A: Worker B is still working. Continue check what B is finished.
B: doing something.
A: Worker B is still working. Continue check what B is finished.
B: doing something.
B: doing something.
A: Worker B is still working. Continue check what B is finished.
A: Worker B is still working. Continue check what B is finished.
A: Worker B is still working. Continue check what B is finished.
A: Worker B is still working. Continue check what B is finished.
B: I'm worker B. And I'm done.
A: Worker B is still working. Continue check what B is finished.
A: Worker B is done. Im gonna doing my work.
A: doing something.
A: doing something.
A: doing something.
A: I'm worker A. And I'm done.
```

### 3.3. 비동기 블로킹 처리 방식
- `WorkerA`는 자신의 일을 수행하기 전에 `WorkerB`에게 callBack 메소드를 전달합니다.
- callBack 메소드는 `WorkerB`가 자신의 일을 일부 마치면 `WorkerA`에게 이를 알리는 용도로 사용됩니다.
- `WorkerA`와 `WorkerB` 모두 각자 자신의 일을 수행합니다.
    - CompletableFuture.runAsync() 메소드를 통해 새로운 스레드가 `WorkerB`의 일을 수행합니다.
- `WorkerA`는 업무를 수행 중에 `WorkerB`의 일이 끝나기를 기다리는 구간이 존재합니다. **블로킹 구간입니다.**
- `WorkerB`는 자신의 업무 일부가 종료되면 callBack 메소드를 통해 `workerA`에게 이를 알리고, 자신의 업무를 마저 진행합니다. 
- 블로킹 되어있던 `WorkerA`는 `WorkerB`의 업무 일부가 종료되는 시점부터 자신의 남은 업무를 수행합니다.

```java
package blog.in.action;

import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

public class AsyncBlockingTest {

    static class WorkerA {

        boolean isWorkBFinished;

        Consumer<String> ownJob = (message) -> {
            for (int index = 0; index < 5; index++) {
                for (int subIndex = Integer.MIN_VALUE; subIndex < Integer.MAX_VALUE; subIndex++) {
                }
                System.out.println("A: doing something.");
            }
            System.out.println("A: " + message);
        };

        Consumer<Void> callMeLater = (Void) -> {
            isWorkBFinished = true;
            System.out.println("B: Hey, Worker A. I'm done.");
        };

        void waitWorkBFinished() {
            while (!isWorkBFinished) {
                System.out.println("A: Waiting for Worker B.");
                for (int subIndex = 0; subIndex < 1000; subIndex++) {
                }
            }
        }

        void doMyWork() {
            ownJob.accept("I'm worker A. And I'm done my first job.");
            waitWorkBFinished();
            ownJob.accept("I'm worker A. And I'm done my second job.");
        }

        Consumer<Void> getCallMeLater() {
            return callMeLater;
        }
    }

    static class WorkerB {

        Consumer<String> ownJob = (message) -> {
            for (int index = 0; index < 5; index++) {
                for (int subIndex = Integer.MIN_VALUE; subIndex < Integer.MAX_VALUE; subIndex++) {
                }
                System.out.println("B: doing something.");
            }
            System.out.println("B: " + message);
        };

        CompletableFuture<Void> doWorkAndCallToALater(Consumer<Void> callBack) {
            return CompletableFuture.runAsync(() -> {
                ownJob.accept("I'm worker B. And I'm my first job.");
                callBack.accept(null);
                ownJob.accept("I'm worker B. And I'm my second job.");
            });
        }
    }

    public static void main(String[] args) {
        WorkerA a = new WorkerA();
        WorkerB b = new WorkerB();
        CompletableFuture<Void> joinPoint = b.doWorkAndCallToALater(a.getCallMeLater());
        a.doMyWork();
        // WorkerB가 일을 마치지 않았는데 메인(main) 스레드가 종료되는 경우 어플리케이션이 종료되므로 이런 현상을 방지하는 코드 추가
        joinPoint.join();
        System.out.println("All workers done.");
    }
}
```

##### 테스트 결과
- `WorkerA`와 `WorkerB`가 동시에 업무를 진행합니다.
- "A: Waiting for Worker B." - `WorkerA`가 `WorkerB`의 첫 업무 종료를 기다립니다.
- "B: Hey, Worker A. I'm done." - `WorkerB`가 `WorkerA`에게 자신의 첫 업무 종료를 알립니다.
- `WorkerA`와 `WorkerB`가 동시에 업무를 마무리합니다.
- 최종적으로 업무를 종료하는 순서는 실행시마다 달라질 수 있습니다.

```
B: doing something.
A: doing something.
B: doing something.
B: doing something.
B: doing something.
B: doing something.
A: doing something.
A: doing something.
A: doing something.
A: doing something.
A: I'm worker A. And I'm done my first job.
A: Waiting for Worker B.
A: Waiting for Worker B.
A: Waiting for Worker B.
A: Waiting for Worker B.
A: Waiting for Worker B.
B: I'm worker B. And I'm my first job.
A: Waiting for Worker B.
B: Hey, Worker A. I'm done.
A: doing something.
A: doing something.
A: doing something.
A: doing something.
A: doing something.
B: doing something.
B: doing something.
B: doing something.
B: doing something.
B: doing something.
A: I'm worker A. And I'm done my second job.
B: I'm worker B. And I'm my second job.
All workers done.
```

### 3.4. 비동기 논블로킹 처리 방식
- `WorkerA`는 자신이 해야하는 일과 `WorkerB`가 해야하는 일을 모두 가지고 있습니다. 
- `WorkerA`는 `WorkerB`에게 일을 건내면, `WorkerB`는 전달받은 일을 수행합니다.
    - CompletableFuture.runAsync() 메소드에 의해 새로운 스레드가 `WorkerB`의 일을 수행합니다.
- `WorkerA`는 `WorkerB`의 일이 끝나는 것을 기다리지 않고 자신의 일을 수행합니다.

```java
package blog.in.action;

import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

public class AsyncNonBlockingTest {

    static class WorkerA {

        Consumer<String> workForA = (message) -> {
            for (int index = 0; index < 5; index++) {
                for (int subIndex = Integer.MIN_VALUE; subIndex < Integer.MAX_VALUE; subIndex++) {
                }
                System.out.println("A: doing something.");
            }
            System.out.println("A: " + message);
        };

        Consumer<String> workForB = (message) -> {
            for (int index = 0; index < 5; index++) {
                for (int subIndex = Integer.MIN_VALUE; subIndex < Integer.MAX_VALUE; subIndex++) {
                }
                System.out.println("B: doing something.");
            }
            System.out.println("B: " + message);
        };

        void doMyWork() {
            workForA.accept("I'm worker A. And I'm done.");
        }

        Consumer<String> getWorkForB() {
            return workForB;
        }
    }

    static class WorkerB {

        CompletableFuture<Void> takeMyWorkAndDoMyWork(Consumer<String> myWork) {
            return CompletableFuture.runAsync(() -> myWork.accept("I'm worker B. And I'm done."));
        }
    }

    public static void main(String[] args) {
        WorkerA a = new WorkerA();
        WorkerB b = new WorkerB();
        CompletableFuture<Void> joinPoint = b.takeMyWorkAndDoMyWork(a.getWorkForB());
        a.doMyWork();
        // WorkerB가 일을 마치지 않았는데 메인(main) 스레드가 종료되는 경우 어플리케이션이 종료되므로 이런 현상을 방지하는 코드 추가
        joinPoint.join();
        System.out.println("All workers done.");
    }
}
```

##### 결과 로그
- `WorkerA`와 `WorkerB`가 동시에 일하는 구간이 생깁니다.
- 여러 번 실행시 업무를 먼저 마치는 Worker가 매번 바뀝니다.

```
A: doing something.
B: doing something.
A: doing something.
A: doing something.
A: doing something.
A: doing something.
B: doing something.
B: doing something.
B: doing something.
B: doing something.
A: I'm worker A. And I'm done.
B: I'm worker B. And I'm done.
All workers done.
```

```
A: doing something.
B: doing something.
B: doing something.
B: doing something.
B: doing something.
B: doing something.
B: I'm worker B. And I'm done.
A: doing something.
A: doing something.
A: doing something.
A: doing something.
A: I'm worker A. And I'm done.
All workers done.
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-09-29-asynchronous-and-non-blocking-process>

#### REFERENCE
- <https://hamait.tistory.com/930>