---
title: "스위프트 비동기 처리 아키텍처(Swift Asynchronous Task Architecture) "
search: false
category:
  - swift
  - asnyc-await
  - task
  - executor
  - thread
last_modified_at: 2026-09-21T00:37:18+09:00
---

<br/>

## 0. 들어가면서

SwiftUI를 공부하다 보니 자연스럽게 스위프트(Swift)의 비동기 처리 방식을 이해할 필요가 생겼다. [파이썬(Python)][python-global-intpreter-lock-and-asynchronous-link]이나 [자바스크립트(JavaScript)][how-to-work-javascript-async-link] 같은 다른 언어의 비동기 처리 방식과 비슷할 것이라고 생각했는데, 구조가 전혀 달라서 놀랐다. 이번 글에서는 스위프트의 비동기 처리 방식을 정리한다.

## 1. Swift Asynchronous Task Architecture

스위프트는 어떤 아키텍처로 비동기 처리를 지원하는지 살펴보자. 스위프트의 동시성 런타임(Swift Concurrency Runtime)은 내가 알고 있던 다른 언어의 비동기 처리와 달리 이벤트 루프(event loop) 방식이 아니다. `태스크(Task)-실행자(Executor)-스레드(Thread) 구조`를 따른다. 이 구조를 이해하는 데 필요한 개념은 다음과 같다.

- 태스크(Task) - 비동기 작업 전체에 대한 논리적 단위
- 잡(Job) - 실행자가 실제로 실행할 수 있는 태스크의 일부 작업
- 실행자(Executor) - 잡을 실행하도록 스케줄링하는 서비스
- 스레드(Thread) - 실제로 CPU에서 명령어(instruction)를 실행하는 OS 실행 단위

예제 코드와 함께 하나씩 살펴보자. 먼저 하나의 태스크를 만든다.

```swift
Task {
    print("in Task")
    let nameInTask = await fetchName()
    print(nameInTask)
}
```

태스크 중간에 `await` 키워드가 있다. `await` 키워드는 이 위치에서 태스크가 서스펜드(suspend) 상태가 될 수 있다는 표시다. fetchName 함수 내부에서 실제로 서스펜션이 발생하면 현재 태스크의 실행이 중단되고, 이후 실행을 재개하는 데 필요한 상태가 continuation 형태로 보존된다. 나중에 fetchName 함수의 결과가 준비되면 continuation이 재개(resume)된다. 태스크의 나머지 작업은 다시 실행 가능(runnable) 상태가 되어 실행자에 의해 스케줄링된다.

중간에 서스펜션이 발생하면 이후 로직은 다른 잡으로 구분된다. 아래 그림처럼 두 개의 잡으로 나뉜다. 잡은 실행을 위한 논리적 단위이며, 실제 실행 정보는 continuation 객체에 담긴다.

```
                   하나의 Task

       Job 1                          Job 2
┌────────────────────┐       ┌────────────────────┐
│ print("in Task")   │       │ print(nameInTask)  │
│ call fetchName()   │       │ ...                │
└──────────┬─────────┘       └─────────▲──────────┘
           │                           │
         await                         │
           │                           │
    실제 suspension                     │
           │                           │
           ▼                           │
 continuation state 저장                │
           │                           │
      Task suspended                   │
           │                           │
    fetchName 완료                      │
           │                           │
 continuation resume ──────────────────┘
```

실행 가능한 태스크(또는 잡)는 실행자에 의해 스케줄링(scheduling)된다. 스케줄링은 사용 가능한 실행 자원에 태스크(실행 가능한 잡)를 배치하는 것이다.

```
Task
  ↓
runnable Job
  ↓
Executor
  ↓
사용 가능한 worker thread
  ↓
CPU에서 실행
```

실행자는 다음과 같이 구분할 수 있다.

- Global / Generic Executor
  - 특정 액터 격리(actor isolation)와 관계없는 동시성 처리를 위해 사용
- Serial Executor
  - 액터 격리를 통해 상태(state)를 안전하게 보호하면서 동시성 처리를 하기 위해 사용
- MainActor Executor
  - 메인 액터 격리를 통해 UI/메인 상태를 보호하면서 동시성 처리를 하기 위해 사용
  - 애플 플랫폼에서는 메인 디스패치 큐(main dispatch queue), 메인 스레드(main thread)와 통합

액터 개념까지 다루기엔 글이 길어지므로 다음에 살펴보자. 우선 실행자는 실행 가능한 작업이 들어오면 사용 가능한 스레드에 배정한다는 사실만 기억하면 된다.

```
                         Executor

          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼

 Generic Executor     Actor Serial       MainActor
                      Executor           Executor

actor에 관계없는       actor state를       UI/main state를
concurrent work        안전하게 보호       보호

          │                 │                 │
          └──────────┬──────┘                 │
                     │                        │
                     ▼                        ▼

           Cooperative Thread Pool        Main Thread
```

위 이미지에서 볼 수 있듯이 스레드는 두 종류로 나뉜다. 메인 액터의 작업은 메인 스레드가 처리하고, 그 외의 작업은 워커 스레드가 처리한다.

- 메인 스레드(main thread)
  - 보통 앱 프로세스가 시작될 때부터 존재하는 대표 스레드
  - 애플의 UI 프레임워크에서는 UI와 이벤트(event) 처리를 담당
- 워커 스레드(worker thread)
  - 여러 워커 스레드를 미리 만들어 협력 스레드 풀(cooperative thread pool)에서 관리
  - 작업(job)이 생기면 워커 스레드를 재사용

메인 스레드는 메인 액터의 작업만 도맡아 처리하므로 구조가 단순하다. 실행자는 스레드 풀에서 유휴 워커 스레드를 찾아 잡을 배치한다. 예를 들어 아래처럼 협력 스레드 풀에 워커 스레드가 있다고 가정해 보자. 1번, 2번, 4번 워커 스레드는 각자 잡을 실행 중이고 3번 워커 스레드만 사용할 수 있다면, 실행자는 실행 가능한 잡을 3번 워커 스레드에 배치한다.

```
Cooperative Thread Pool

Worker Thread 1  ← Job A 실행 중
Worker Thread 2  ← Job B 실행 중
Worker Thread 3  ← 비어 있음
Worker Thread 4  ← Job C 실행 중
```

스위프트 비동기 처리의 전반적인 실행 흐름을 살펴봤다. 이제 스위프트가 비동기 처리를 어떻게 효율적으로 설계했는지 스레드와 메모리 관점에서 살펴보자.

## 2. Swift Concurrency, Thread and Memory

스위프트의 동시성을 이해하는 데는 [이 영상](https://developer.apple.com/videos/play/wwdc2021/10254)이 도움이 된다. 이 글에서는 영상의 내용을 내가 이해한 수준에서 정리한다.

스위프트의 각 스레드는 스택 메모리를 가지고 있다. 현재 실행 컨텍스트는 스택에 저장된다. 간단한 예제 코드를 살펴보자.

```swift
func update() {
    let value = add(10, 20)
    print(value)
}

func add(_ a: Int, _ b: Int) -> Int {
    let result = save(a + b)
    return result
}

func save(_ value: Int) -> Int {
    return value * 2
}

update()
```

update 함수를 호출하면 내부적으로 add 함수와 save 함수를 호출한다. save 함수까지 호출되었을 때 이 스레드의 스택 메모리는 다음과 같은 모습이다.

- 일반적으로 스레드는 함수를 호출하면 자기 스택에 스택 프레임(stack frame)을 올린다.
- 스택 프레임에는 로컬 변수, 반환 주소 등 현재 함수 실행에 필요한 정보가 저장된다.

```
┌──────────────────────┐
│ save                 │
│                      │
│ value = 30           │
│ return address       │
├──────────────────────┤
│ add                  │
│ a = 10               │
│ b = 20               │
│ return address       │
├──────────────────────┤
│ update               │
│ return address       │
└──────────────────────┘
```

그렇다면 여기서 의문이 생긴다. 실행 중인 컨텍스트가 스택에 쌓이는데 어떻게 중간에 비동기 처리를 할 수 있을까? 서스펜션이 발생한 후 중단된 작업은 어떻게 다시 실행을 이어 갈 수 있을까? 스위프트는 스택 프레임(stack frame)과 비동기 프레임(async frame)을 구분해 이를 해결한다. 이제 서스펜션이 발생하는 비동기 로직이 포함된 예제 코드의 콜 스택을 살펴보자.

```swift
func updateDatabase(...) async {
    ...
    await feed.add(newArticles)
    ...
}

extension Feed {
    func add(_ newArticles: [Article]) async {
        for article in newArticles {
            let id = article.id
            ...
        }

        let ids = await save(newArticles)

        let pairs = zip(newArticles, ids)
        ...
    }
}
```

먼저 updateDatabase() 함수를 실행한다. 일반적으로 updateDatabase() 함수의 실행 정보는 스택 프레임 형태로 스레드의 스택에 올라간다. 그런데 updateDatabase()는 비동기 함수이기 때문에 서스펜션 이후에도 유지해야 하는 정보를 별도의 비동기 프레임에 담아 힙 메모리에 보관한다.

```
Thread Stack                 Heap
┌───────────────────┐       ┌────────────────────┐
│ updateDatabase    │       │ updateDatabase     │
│ stack frame       │       │ async frame        │
└───────────────────┘       └────────────────────┘
```

스레드가 updateDatabase() 함수를 실행하는 중에 Feed.add(_:)를 호출한다. 이때 최상단 스택 프레임은 add() 함수의 프레임이 된다. add() 함수도 비동기 함수(async function)이기 때문에 힙 메모리에 비동기 프레임을 만든다.

```
Thread Stack                 Heap
┌───────────────────┐       ┌────────────────────┐
│ add stack frame   │       │ add async frame    │
├───────────────────┤       ├────────────────────┤
│ updateDatabase    │       │ updateDatabase     │
└───────────────────┘       │ async frame        │
                            └────────────────────┘
```

다시 add() 함수를 살펴보자.

```swift
    func add(_ newArticles: [Article]) async {
        for article in newArticles {
            let id = article.id
            ...
        }

        let ids = await save(newArticles)

        let pairs = zip(newArticles, ids)
        ...
    }
```

add() 함수의 id, article처럼 suspension point 이후까지 유지할 필요가 없는 값은 스택 프레임에 둘 수 있다. 하지만 newArticles 매개변수는 await save(...) 함수 이후에도 다시 사용된다. 따라서 서스펜션이 발생한 이후에도 유지되어야 한다. 그렇기 때문에 newArticles 같은 매개변수는 add() 함수의 비동기 프레임에 저장된다.

```
Heap
┌─────────────────────────┐
│ add async frame         │
│                         │
│ newArticles ─────────── │
│ resume information      │
│ ...                     │
└─────────────────────────┘
```

add() 함수 내부에서 save() 비동기 함수가 실행된다. 일반 동기 함수라면 아래처럼 스택 프레임에 쌓인다.

```
Thread Stack
┌──────────────────┐
│ save             │
├──────────────────┤
│ add              │
├──────────────────┤
│ updateDatabase   │
└──────────────────┘
```

하지만 스위프트 비동기 함수는 최상단 스택 프레임을 대체할 수 있다고 한다. 이후에 필요한 값은 이미 비동기 프레임에 저장되어 있기 때문이다. 그래서 실제 스택 메모리와 힙 메모리에는 아래와 같이 스택 프레임과 비동기 프레임이 저장된다.

```
Thread Stack                            Heap
┌──────────────────────┐              ┌──────────────────────┐
│ save                 │              │ save async frame     │
├──────────────────────┤              ├──────────────────────┤
│ updateDatabase       │              │ add async frame      │
└──────────────────────┘              │ newArticles          │
                                      ├──────────────────────┤
                                      │ updateDatabase frame │
                                      └──────────────────────┘
```

save() 함수가 데이터베이스 작업을 기다린다고 가정해 보자. 이때 실제로 서스펜션이 발생하지만 스레드는 기다리지 않는다. 해당 스레드는 유휴 상태가 되어 즉시 다른 태스크(또는 잡)를 이어받을 수 있다.

필요한 실행 상태는 힙 메모리의 비동기 프레임에 저장되어 있으므로 스레드의 스택에는 현재 태스크(A)와 관련된 스택 프레임이 남지 않는다. 이 스레드는 잠시 다른 태스크(B)의 작업을 맡아 이어 나갈 수 있다. 이때 스레드의 스택에는 다른 태스크의 스택 프레임이 담긴다.

```
Thread Stack                            Heap
┌──────────────────────┐              ┌──────────────────────┐
│ processImage         │              │ Task A               │
├──────────────────────┤              │ save async frame     │
│ Task B runtime       │              │ resume state         │
└──────────────────────┘              ├──────────────────────┤
                                      │ add async frame      │
                                      │ newArticles          │
                                      ├──────────────────────┤
                                      │ updateDatabase frame │
                                      └──────────────────────┘
```

태스크 B가 완료되면 관련 스택 프레임도 정리된다. 태스크 A는 여전히 서스펜드 상태다. DB 저장 결과가 준비되었다고 가정해 보자. 해당 태스크의 continuation을 재개하면 태스크 A는 실행 가능한 상태가 되고, 이후 실행자에 의해 워커 스레드에 할당된다. 반드시 이전 스레드에 할당되는 것은 아니다. 유휴 스레드 중 하나에 배치된다.

힙 메모리에 저장된 비동기 프레임 전체가 스레드의 스택으로 복사되는 것은 아니다. 힙에 보존되어 있던 비동기 상태를 참조해 실행을 이어 나간다. continuation은 태스크 재개에 필요한 비동기 실행 상태를 가리키므로 비동기 프레임과 resume 정보를 이용해 작업을 이어 나간다.

```
Thread 3 Stack                          Heap
┌──────────────────────┐              ┌──────────────────────┐
│ save resumed         │ ◀──────────  │ save async frame     │
├──────────────────────┤              │ result = ids         │
│ runtime              │              │ resume state         │
└──────────────────────┘              ├──────────────────────┤
                                      │ add async frame      │
                                      │ newArticles          │
                                      ├──────────────────────┤
                                      │ updateDatabase frame │
                                      └──────────────────────┘
```

save() 함수가 ids 값을 반환하면 add() 함수가 재개된다.

```
Thread 3 Stack                          Heap
┌──────────────────────┐              ┌──────────────────────┐
│ add resumed          │ ◀──────────  │ add async frame      │
├──────────────────────┤              │ newArticles          │
│ runtime              │              │ ids                  │
└──────────────────────┘              ├──────────────────────┤
                                      │ updateDatabase frame │
                                      └──────────────────────┘
```

이어서 다음 코드가 실행된다. zip() 함수는 동기 함수이므로 일반 스택 프레임이 생성된다.

```
Thread 3 Stack                          Heap
┌──────────────────────┐              ┌──────────────────────┐
│ zip                  │              │ add async frame      │
├──────────────────────┤              │ newArticles          │
│ add resumed          │              │ ids                  │
├──────────────────────┤              ├──────────────────────┤
│ runtime              │              │ updateDatabase frame │
└──────────────────────┘              └──────────────────────┘
```

이후 zip() 함수와 add() 함수가 완료되면 updateDatabase() 함수가 재개된다. 앞에서 살펴본 과정을 반복한다.

이 구조에서는 블로킹(blocking)이 발생해도 스레드가 해당 태스크의 완료를 기다리지 않는다. 작업에 서스펜션이 발생하면 스레드는 즉시 유휴 상태로 돌아가고, 다른 태스크가 있다면 이를 이어받아 처리할 수 있다. 이는 스위프트 동시성 모델의 큰 장점이다. 많은 태스크를 처리하기 위해 태스크 수만큼 스레드를 만들 필요가 없다.

> 많은 동시성 태스크들이 적은 수의 워커 스레드 위에 멀티플렉싱(multiplexing)할 수 있다. 

내가 주로 사용했던 자바(Java)에서는 작업 중간에 Thread.sleep() 메서드에 의해 블로킹된 스레드가 다시 재개되기까지 다른 일을 하지 못한다. 그래서 많은 스레드를 만든 후 스레드 풀에 담아 관리한다. 스프링 프레임워크가 기본적으로 사용하는 톰캣(tomcat)은 스레드 풀의 기본 크기가 200개다. 200개 이상의 요청이 동시에 몰리고 블로킹되는 로직이 있다면 서버 부하가 커지는 단점이 있다.

## CLOSING

이번 글에서는 스위프트의 다양한 비동기 코드 패턴을 정리할 생각이었다. 하지만 동시성을 구현한 아키텍처를 살펴보다 보니 글로 정리하면서 개념을 이해하고 싶어졌다. 혼자 알아봤다면 시간이 많이 걸렸을 텐데, AI에게 질문을 이어 가며 공부하다 보니 아키텍처를 빠르게 정리할 수 있었다. 지식을 습득하는 속도가 정말 빨라졌다.

#### REFERENCE

- <https://developer.apple.com/videos/play/wwdc2021/10254/>
- <https://developer.apple.com/videos/play/wwdc2025/268/>
- <https://developer.apple.com/documentation/Swift/Actor?changes=_3>
- <https://github.com/swiftlang/swift-evolution/blob/main/proposals/0296-async-await.md?#suspension-points>
- <https://github.com/swiftlang/swift-evolution/blob/main/proposals/0300-continuation.md>
- <https://github.com/swiftlang/swift-evolution/blob/main/proposals/0392-custom-actor-executors.md>
- <https://github.com/swiftlang/swift-evolution/blob/main/proposals/0417-task-executor-preference.md>

[python-global-intpreter-lock-and-asynchronous-link]: https://junhyunny.github.io/python/generator-function/async-await/asynchronous-task/python-global-intpreter-lock-and-asynchronous/
[how-to-work-javascript-async-link]: https://junhyunny.github.io/information/javascript/how-to-work-javascript-async/
