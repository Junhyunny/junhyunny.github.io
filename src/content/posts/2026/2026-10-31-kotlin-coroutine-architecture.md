---
title: "코틀린 코루틴 아키텍처 (Kotlin Coroutine Architecture)"
publishedAt: "2026-10-31"
updatedAt: "2026-10-31T23:30:18+09:00"
canonicalPath: "/kotlin/coroutine/asynchronous/architecture/kotlin-coroutine-architecture/"
categories:
  - "kotlin"
  - "coroutine"
  - "asynchronous"
  - "architecture"
summary: "CoroutineScope에서 Dispatcher와 Job까지, 코틀린 코루틴이 비동기 작업을 실행하고 관리하는 구조를 정리했다."
---

## 0. 들어가면서

강한 네이티브 역량이 필요한 프로젝트에 참여하게 되면서 iOS, 안드로이드 프레임워크 내부에 숨겨진 동작들을 이해하기 위해 많은 노력과 시간을 사용하고 있다. 이전에 SwiftUI와 관련된 내용들만 다뤘는데, 이제부터 안드로이드와 코틀린에 대한 내용들을 하나씩 정리해보려 한다.

## 1. Introduction Coroutine

애플리케이션은 사용자 입력에 응답하거나, 데이터를 불러오거나, 화면을 업데이트하는 등 여러 작업을 동시에 수행하는 경우가 많다. 이를 지원하기 위해 동시성(concurrency)을 활용한다. 동시성은 여러 작업이 서로 차단하지 않고 독립적으로 실행될 수 있도록 하는 개념이다. 

가장 일반적인 방법은 스레드(thread)를 사용하는 것이지만, 상대적으로 많은 시스템 자원을 사용한다. 지나치게 많은 스레드를 생성하면 성능 문제가 발생할 수 있다. 코틀린은 효율적인 동시성 처리를 위해 코루틴(coroutine)을 기반으로 하는 비동기 프로그래밍을 지원한다. 

- 코루틴은 일시 중단(suspending) 함수를 통해 비동기 코드를 순차적인 방식으로 작성할 수 있다. 
- 코루틴은 스레드를 차단하지 않고 실행을 일시 중단할 수 있다.

코루틴과 관련된 대부분의 기능은 `kotlinx.coroutines` 라이브러리에서 제공된다. 이 라이브러리에는 코루틴 실행, 동시성 제어, 비동기 스트림 처리 등을 위한 다양한 도구가 포함되어 있다.

JVM 환경에서 코루틴을 비롯한 모든 동시성 코드는 운영체제가 관리하는 스레드 위에서 실행된다. 코루틴은 스레드를 차단하는 대신 자신의 실행을 일시 중단할 수 있다. 이를 통해 코루틴은 다른 코루틴과 동시에 실행될 수 있으며, 경우에 따라 병렬(parallel)로 실행될 수 있다. 이런 방식은 시스템 자원을 효율적으로 활용할 수 있도록 한다. 예를 들면, 하나의 코루틴이 데이터가 도착하기를 기다리는 동안 실행을 일시 중단하고, 다른 코루틴이 동일한 스레드에서 실행될 수 있다.

<div class="block-break">
  <div align="center">
    <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2026/main/kotlin-coroutine-architecture-01.svg" width="100%" class="image__border">
  </div>
  <center>https://kotlinlang.org/docs/coroutines-basics.html</center>
</div>

코루틴은 JVM에서 스레드와 마찬가지로 코드를 동시에 실행할 수 있는 일시 중단 가능한 연산 단위이지만, 내부적으로 동작하는 방식에 차이가 있다. 둘 사이에는 어떤 차이점이 있을까?

스레드는 운영체제에 의해 관리된다. 스레드는 여러 CPU 코어에서 작업을 병렬로 실행할 수 있으며, JVM에서 동시성을 구현하는 일반적인 방법이다. 스레드를 생성하면 운영체제에 해당 스레드의 스택을 위한 메모리를 할당하고, 커널을 통해 스레드 간 전환을 수행한다. 이런 특성 덕분에 스레드는 강력한 실행 수단이지만, 동시에 많은 시스템 자원을 소비한다. 일반적으로 각 스레드는 수 MB의 메모리를 필요로 하며, JVM에서 동시에 처리할 수 있는 스레드의 수는 보통 수천 개 수준으로 제한된다.

반면, 코루틴은 특정 스레드에 종속되지 않는다. 하나의 스레드에서 실행을 일시 중단한 후 다른 스레드에서 실행을 재개할 수 있다. 여러 코루틴이 동일한 스레드 풀을 공유할 수 있다. 코루틴이 일시 중단되더라도 해당 스레드는 차단되지 않으며, 다른 작업을 실행하는 데 사용할 수 있다. 

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2026/main/kotlin-coroutine-architecture-02.svg" width="100%" class="image__border">
</div>
<center>https://kotlinlang.org/docs/coroutines-basics.html</center>

## 2. Coroutine Task Architecture

코틀린은 비동기 처리를 위한 코루틴 아키텍처를 어떻게 구현했을까? 코루틴 비동기 아키텍처의 중요한 개념들을 살펴보자.

- CoroutineScope - 코루틴의 생명주기와 실행 범위
- CoroutineContext - 실행 환경 정보
- CoroutineDispatcher - 코루틴을 어떤 스레드에서 실행할지 결정
- Job - 생명주기 및 취소
- 코루틴 (coroutine) - 중단과 재개가 가능한 실제 비동기 작업

간단한 예시 코드를 통해 이 5개 컴포넌트 사이의 관계를 살펴보자. 다음과 같은 코드가 있다.

```kotlin
val scope = CoroutineScope(
    SupervisorJob() + Dispatchers.Default
)

val job1 = scope.launch {
    delay(1000)
}

val job2 = scope.launch {
    delay(2000)
}
```

위 코드를 실행하면 다음과 같은 객체들이 생성되고, 다음과 같이 연결된다.

- CoroutineScope는 CoroutineContext를 소유한다.
- CoroutineContext는 SupervisorJob과 CoroutineDispatcher(Dispatchers.Default)를 소유한다.
- CoroutineScope의 launch 함수를 실행하면 새로운 Job이 생성된다. 새로운 Job은 SupervisorJob의 자식으로 포함되며, 이는 SupervisorJob이 새로 생긴 Job 객체에 대한 참조를 가지고 있다는 의미이다.
- 새로 생성된 자식 Job들은 부모 Job에 대한 참조를 갖고 있어서 부모-자식 사이에 순환 참조가 존재하고, 형제 사이엔 참조가 없다.

```
scope: CoroutineScope 객체
    |
    +-- coroutineContext: CoroutineContext
            |
            +-- Job: SupervisorJob 객체 (Parent)
            |       |
            |       +-- job1: StandaloneCoroutine 객체 (Child Job)
            |       |       |
            |       |       +-- parent: SupervisorJob 객체 (상위 객체 참조)
            |       |       |
            |       |       +-- children: 없음
            |       |       |
            |       |       +-- 실행 코드: delay(1000)
            |       |
            |       +-- job2: StandaloneCoroutine 객체 (Child Job)
            |               |
            |               +-- parent: SupervisorJob 객체 (상위 객체 참조)
            |               |
            |               +-- children: 없음
            |               |
            |               +-- 실행 코드: delay(2000)
            |
            +-- ContinuationInterceptor: Dispatchers.Default
```

전반적인 구조를 살펴봤으니 하나씩 자세히 들여다보자. 

### 2.1. Coroutine Scope

위 그림에서 볼 수 있듯이 CoroutineScope는 CoroutineContext를 제공하며, 이 CoroutineContext에 포함된 부모 Job(SupervisorJob)을 통해 CoroutineScope에서 생성한 자식 코루틴들의 생명주기가 관리된다. CoroutineScope가 취소되면, 부모 Job이 취소되고, 하위 자식 Job들은 재귀적으로 함께 취소된다. CoroutineScope의 자식 Job들은 parent 프로퍼티를 통해 자신의 부모 Job을 참조한다. 순환 참조가 발생하지만, 자식 Job은 자신의 취소를 부모 객체에 즉시 보고할 수 있다.

간단한 예시 코드를 통해 CoroutineScope 객체를 취소(cancel)하면 자식 Job 객체들이 어떻게 되는지 살펴보자.

- job1 코루틴은 1초 대기 후 "Job 1 completed" 로그를 출력
- job2 코루틴은 2초 대기 후 "Job 2 completed" 로그를 출력
- CoroutineScope는 0.5초 대기 후 취소

```kotlin
@Test
fun example_02() = runTest {
    val scope = CoroutineScope(
        SupervisorJob() + Dispatchers.Default
    )
    val job1 = scope.launch {
        try {
            delay(1000.milliseconds)
            println("Job 1 completed")
        } finally {
            println("Job 1 cancelled")
        }
    }
    val job2 = scope.launch {
        try {
            delay(2000.milliseconds)
            println("Job 2 completed")
        } finally {
            println("Job 2 cancelled")
        }
    }

    delay(500.milliseconds)

    scope.cancel()

    joinAll(job1, job2)
}
```

위 코드를 실행하면 아래 로그처럼 "completed" 로그가 아니라 둘 모두 "cancelled" 로그가 출력된다.

```
Job 2 cancelled
Job 1 cancelled
```

### 2.2. Coroutine Context

CoroutineContext는 코루틴 실행에 필요한 CoroutineDispatcher, Job, CoroutineExceptionHandler 등의 요소를 하나의 실행 환경으로 구성하고 관리하기 위해 사용된다. CoroutineContext를 사용하면 실행 환경을 하나로 구성하고, 이를 재사용하거나 상속하면서 필요한 요소만 변경할 수 있다. 

간단한 예시 코드를 통해 살펴보자. 

- CoroutineExceptionHandler, SupervisorJob, CoroutineDispatcher(Dispatchers.Default), CoroutineName을 + 연산자를 통해 하나의 CoroutineContext로 합친다.
- CoroutineScope 객체를 만들 때 CoroutineContext를 전달한다. 

```kotlin
@Test
fun example_03() {
    val handler = CoroutineExceptionHandler { _, exception ->
        println("Error: $exception")
    }
    val context =
        SupervisorJob() +
                Dispatchers.Default +
                CoroutineName("Worker") +
                handler
    val scope = CoroutineScope(context)

    scope.launch {
        print("first job")
    }

    scope.launch {
        print("second job")
    }
}
```

사전에 만든 CoroutineContext에서 필요한 요소만 변경하는 방법은 다음과 같다. CoroutineScope의 launch 함수를 실행할 때 변경이 필요한 요소만 파라미터로 전달한다. 기존 CoroutineContext 요소들 중 실행 시점에 새로 추가된 요소만 바뀐 CoroutineContext로 코루틴이 실행된다. 2번째 launch 함수를 실행할 때 CoroutineName을 "SpecialWorker"로 변경한다.

```kotlin
@Test
fun example_04() = runTest {
    val scope = CoroutineScope(
        SupervisorJob() +
                Dispatchers.Default +
                CoroutineName("Worker")
    )

    val job1 = scope.launch {
        println("first job - ${coroutineContext[CoroutineName]?.name}")
    }
    val job2 = scope.launch(CoroutineName("SpecialWorker")) {
        println("second job - ${coroutineContext[CoroutineName]?.name}")
    }
    joinAll(job1, job2)
}
```

서로 다른 타입, 예를 들어 CoroutineExceptionHandler, CoroutineDispatcher, CoroutineName 같은 것들을 plus(+) 연산을 통해 한 번에 합쳐서 하나로 관리할 수 있는 이유는 모든 컴포넌트가 CoroutineContext.Element 인터페이스를 구현하고 있기 때문이다. 모든 객체는 CoroutineContext.Element 타입으로 추상화할 수 있다.

```
                  <<interface>>
                CoroutineContext
                       △
                       |
                       | extends
                       |
                  <<interface>>
             CoroutineContext.Element
                       △
                       |
          +------------+-------------+------------------+
          |            |             |                  |
          |            |             |                  |
     <<interface>> <<interface>>  <<class>>         <<interface>>
         Job      Continuation   CoroutineName      Coroutine
                      Interceptor                    ExceptionHandler
          △            △
          |            |
          |            |
      <<class>>     <<abstract>>
      JobSupport  CoroutineDispatcher
          △            △
          |            |
          |       +----+----------------+
          |       |                     |
          |   Dispatchers.Default   Dispatchers.IO
          |
    <<abstract>>
   AbstractCoroutine
          △
          |
      <<class>>
  StandaloneCoroutine
```

### 2.3. Dispatcher

CoroutineDispatcher는 코루틴을 어떤 스레드 또는 실행 환경에서 실행하고 재개할지 결정하는 스케줄러다. 코루틴이 생성되거나 일시 중단 후 재개될 때, CoroutineDispatcher는 코루틴의 실행 작업을 적절한 스레드에 배치하는 역할을 한다. 다음과 같은 주요 CoroutineDispatcher 구현체들이 있다.

| Dispatcher | 역할 | 사용 사례 |
| :-: | :-: | :-: | 
| Dispatchers.Default | CPU 연산에 적합한 공유 스레드 풀 사용 | 데이터 가공, 정렬, 복잡한 계산 |
| Dispatchers.IO | 블로킹 I/O 작업에 적합한 공유 스레드 풀 사용 | 파일 읽기, JDBC, 블로킹 네트워크 호출 |
| Dispatchers.Main | 메인(UI) 스레드에서 실행 | Android UI 업데이트 |
| Dispatchers.Unconfined | 특정 스레드에 실행을 고정하지 않음 | 특수한 상황, 내부 동작 및 테스트 |

Dispatchers.Default와 Dispatchers.IO는 완전히 분리된 스레드 풀이 아니라, 내부적으로 스레드를 공유한다. 다만 작업을 스케줄링하는 정책과 병렬 실행 제한이 다르다.

| 구분 | Dispatchers.Default | Dispatchers.IO |
| - | - | - |
| 주요 목적 | CPU 연산 | 블로킹 I/O 작업 |
| 스레드 풀 | 공유 스케줄러 사용 | Default와 스레드 자원 공유 |
| 병렬 실행 제한 | 일반적으로 CPU 코어 수 기준 (최소 2) | 기본적으로 max(64, CPU 코어 수) |
| 스레드 확장 | CPU 작업 병렬도 중심 | 블로킹 작업을 수용하도록 추가 스레드 사용 가능 |

Dispatchers.Default를 기준으로 내부를 살펴보자. 

- CoroutineScheduler - JVM의 Executor 인터페이스를 구현한 스레드 풀 기반 스케줄러로, 작업 큐와 워커(worker) 스레드를 관리
- GlobalQueue - CoroutineScheduler.dispatch() 함수에 의해 전달된 Task 인스턴스를 담는 큐
- ResizableAtomicArray<Worker> - 워커(worker) 스레드들을 담아 관리하는 배열
- Worker - Task 인스턴스를 담는 로컬 작업 큐를 갖고, Thread 클래스를 상속받아 실제로 Task 인스턴스를 실행하는 주체

```
Dispatchers.Default [object - 싱글턴]
    |
    +-- DefaultScheduler [SchedulerCoroutineDispatcher 상속 - Dispatcher 싱글턴]
            |
            +-- CoroutineScheduler [Executor 구현 - 스레드 풀 기반 스케줄러]
                    |
                    +-- GlobalQueue [LockFreeTaskQueue<Task> 상속 - 작업 대기 큐]
                    |
                    +-- ResizableAtomicArray<Worker> [Worker 관리 배열]
                            |
                            +-- Worker 1 [Thread 상속 - 실제 실행 스레드]
                            |       +-- WorkQueue [로컬 작업 큐]
                            |
                            +-- Worker 2 [Thread 상속 - 실제 실행 스레드]
                            |       +-- WorkQueue [로컬 작업 큐]
                            |
                            +-- Worker 3 [Thread 상속 - 실제 실행 스레드]
                                    +-- WorkQueue [로컬 작업 큐]
```

좀 더 깊게 파보면 글로벌 CPU 큐와 글로벌 블로킹(blocking) 큐가 분리되어 있다든지, 특정 워커가 처리하고 있는 태스크에 연관된 태스크는 워커의 로컬 큐로 들어간다든지, 워커 스레드가 처리할 일이 없으면 다른 워커 스레드의 일을 가져오는 워크 스틸링(work stealing)이라든지 복잡한 스케줄링에 관련된 이야기가 많을 것 같다. 우선 전반적인 구조를 파악하는 선에서 설명을 마무리한다.

### 2.4. Job & Coroutine

위 CoroutineScope의 설명 예시를 보면 launch 함수를 통해 반환된 객체를 Job이라고 불렀지만, 실제로는 코루틴 객체(StandaloneCoroutine)다. 코루틴을 Job이라 불러도 되는 걸까? 가능하다. kotlinx.coroutines의 일반적인 코루틴 빌더로 생성되는 코루틴 객체는 Job 인터페이스를 구현한다. 따라서 이러한 코루틴은 Job의 일종이지만, 모든 Job이 코루틴인 것은 아니다.

아래 클래스 다이어그램을 보면 StandaloneCoroutine 클래스가 Job 인터페이스를 구현하고 있는 것을 볼 수 있다.

```
                  +------------------+
                  |   <<interface>>  |
                  |       Job        |
                  +------------------+
                           ^
                           |
                  +------------------+
                  |    <<abstract>>  |
                  |    JobSupport    |
                  +------------------+
                           ^
                           |
               +-----------+-----------+
               |                       |
    +------------------+    +----------------------+
    |      JobImpl     |    |     <<abstract>>     |
    |      Class       |    | AbstractCoroutine<T> |
    +------------------+    +----------------------+
                                       ^
                                       |
                            +----------------------+
                            | StandaloneCoroutine  |
                            |        Class         |
                            +----------------------+
```

Job은 작업의 생명주기와 취소를 관리하는 인터페이스다. 반면 코루틴은 실제 suspend 코드를 실행하는 단위이며, Job 기능을 통해 생명주기도 관리한다. 코루틴의 일시 중단과 재개는 컴파일러가 생성하는 Continuation 기반 상태 머신을 통해 이루어진다. AbstractCoroutine 역시 Continuation 인터페이스를 구현하지만, 이는 주로 코루틴 본문의 실행 결과를 전달받아 완료 상태를 처리하기 위한 것이다.

```
    +----------------------+    +----------------------+
    |    <<interface>>     |    |    <<interface>>     |
    |   Continuation<T>    |    |    CoroutineScope    |
    +----------------------+    +----------------------+
               ^                           ^
               :                           :
               +-------------+-------------+
                             :
                  AbstractCoroutine<T>
```

위에서 CoroutineScope를 만들 때 부모 Job으로 SupervisorJob 클래스를 사용했다. 안드로이드에서 ViewModel 추상 클래스를 상속한 ViewModel 객체에서 사용하는 viewModelScope 객체도 SupervisorJob 클래스를 루트 Job 객체로 만들어 사용한다.

SupervisorJob 클래스는 일반 Job 클래스와 차이점이 있다. 

- SupervisorJob - 자식 코루틴 하나가 예외로 실패해도 부모 Job과 형제 코루틴은 영향을 받지 않는다.
- Job - 자식 코루틴 하나가 예외로 실패하면 부모 Job도 취소되고, 형제 코루틴까지 취소된다.

예제 코드를 통해 살펴보자. 먼저 SupervisorJob 객체를 루트 Job으로 사용하면 두 개의 자식 코루틴 중 하나가 실패해도 형제 코루틴이 계속 진행되는지 살펴보자.

```kotlin
@Test
fun example_05() = runBlocking {
    val parentJob = SupervisorJob()
    val scope = CoroutineScope(parentJob + Dispatchers.Default)

    val job1 = scope.launch {
        delay(500.milliseconds)
        throw RuntimeException("Job 1 failed")
    }

    val job2 = scope.launch {
        try {
            delay(1000.milliseconds)
            println("Job 2 completed")
        } finally {
            if (!isActive) {
                println("Job 2 cancelled")
            }
        }
    }

    joinAll(job1, job2)
    println("Parent active: ${parentJob.isActive}")
}
```

위 코드를 실행하면 다음과 같은 로그를 볼 수 있다.

- job1 코루틴에서 예외가 발생했다.
- job2 코루틴은 취소되지 않고 제대로 완료(completed)되었다.
- 부모 Job은 활성화(active) 상태를 유지한다.

```
Exception in thread "DefaultDispatcher-worker-1 @coroutine#2" java.lang.RuntimeException: Job 1 failed
	at com.example.myapplication.ExampleUnitTest$example_05$1$job1$1.invokeSuspend(ExampleUnitTest.kt:109)
	at kotlin.coroutines.jvm.internal.BaseContinuationImpl.resumeWith(ContinuationImpl.kt:33)
	at kotlinx.coroutines.DispatchedTask.run(DispatchedTask.kt:101)
	at kotlinx.coroutines.scheduling.CoroutineScheduler.runSafely(CoroutineScheduler.kt:589)
	at kotlinx.coroutines.scheduling.CoroutineScheduler$Worker.executeTask(CoroutineScheduler.kt:832)
	at kotlinx.coroutines.scheduling.CoroutineScheduler$Worker.runWorker(CoroutineScheduler.kt:720)
	at kotlinx.coroutines.scheduling.CoroutineScheduler$Worker.run(CoroutineScheduler.kt:707)
	Suppressed: kotlinx.coroutines.internal.DiagnosticCoroutineContextException: [CoroutineId(2), "coroutine#2":StandaloneCoroutine{Cancelling}@5a37bc59, Dispatchers.Default]
Job 2 completed
Parent active: true
```

그러면 이번엔 완전히 동일한 로직에서 SupervisorJob 객체 대신 일반 Job 객체를 사용해 보자.

```kotlin
@Test
fun example_06() = runBlocking {
    val parentJob = Job()
    val scope = CoroutineScope(parentJob + Dispatchers.Default)

    val job1 = scope.launch {
        delay(500.milliseconds)
        throw RuntimeException("Job 1 failed")
    }

    val job2 = scope.launch {
        try {
            delay(1000.milliseconds)
            println("Job 2 completed")
        } finally {
            if (!isActive) {
                println("Job 2 cancelled")
            }
        }
    }

    joinAll(job1, job2)
    println("Parent active: ${parentJob.isActive}")
}
```

이번엔 이전과 다르게 job2 코루틴도 취소되고, 부모도 활성 상태가 아닌 것을 볼 수 있다. job1 코루틴의 실패가 부모를 통해 형제까지 전달됐다.

```
Exception in thread "DefaultDispatcher-worker-1 @coroutine#2" java.lang.RuntimeException: Job 1 failed
	at com.example.myapplication.ExampleUnitTest$example_06$1$job1$1.invokeSuspend(ExampleUnitTest.kt:135)
	at kotlin.coroutines.jvm.internal.BaseContinuationImpl.resumeWith(ContinuationImpl.kt:33)
	at kotlinx.coroutines.DispatchedTask.run(DispatchedTask.kt:101)
	at kotlinx.coroutines.scheduling.CoroutineScheduler.runSafely(CoroutineScheduler.kt:589)
	at kotlinx.coroutines.scheduling.CoroutineScheduler$Worker.executeTask(CoroutineScheduler.kt:832)
	at kotlinx.coroutines.scheduling.CoroutineScheduler$Worker.runWorker(CoroutineScheduler.kt:720)
	at kotlinx.coroutines.scheduling.CoroutineScheduler$Worker.run(CoroutineScheduler.kt:707)
	Suppressed: kotlinx.coroutines.internal.DiagnosticCoroutineContextException: [CoroutineId(2), "coroutine#2":StandaloneCoroutine{Cancelling}@51d7471d, Dispatchers.Default]
Job 2 cancelled
Parent active: false
```

## CLOSING

Continuation 기반의 상태 머신을 통해 코루틴의 중단과 재개가 어떻게 이뤄지는지는 다음 글을 통해 정리해볼 생각이다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-10-31-kotlin-coroutine-architecture>

#### REFERENCE

- <https://kotlinlang.org/docs/coroutines-overview.html>
- <https://kotlinlang.org/docs/coroutines-basics.html>
- <https://kotlinlang.org/docs/coroutines-guide.html>
- <https://kotlinlang.org/docs/coroutine-context-and-dispatchers.html>
- <https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-default.html>
- <https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-dispatchers/-i-o.html>
- <https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/>
- <https://developer.android.com/kotlin/coroutines/coroutines-adv>
- <https://github.com/Kotlin/kotlinx.coroutines/blob/master/kotlinx-coroutines-core/common/src/AbstractCoroutine.kt>
