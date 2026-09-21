---
title: "SwiftUI 액터(Actor)와 격리 도메인(isolation domain)"
search: false
category:
  - swift
  - actor
  - main-actor
  - async-await
  - asynchronous-task
last_modified_at: 2026-09-21T16:33:35+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [스위프트 비동기 처리 아키텍처(Swift Asynchronous Task Architecture)][swift-asynchronous-task-architecture-link]

## 0. 들어가면서

[이전 글][swift-asynchronous-task-architecture-link]에서는 스위프트(Swift)의 비동기 아키텍처를 살펴봤다. 이번 글에서는 액터(actor)와 격리 도메인(isolation domain)을 살펴본다.

## 1. Swift Actor

액터는 여러 동시 작업이 공유 상태에 동시에 접근하지 못하도록 직렬화해 경쟁 상태(race condition)를 방지하는 참조 타입이다. 변경 가능한 상태(mutable state)를 격리해 한 번에 하나의 태스크만 안전하게 접근하도록 보장한다.

현대 iOS 애플리케이션은 네트워크, 타이머, 파일 I/O, 웹소켓, 태스크 같은 많은 비동기 작업이 동시에 진행된다. 이 비동기 작업이 같은 상태를 변경할 수 있기 때문에 격리가 필요하다. 간단한 예제를 통해 살펴보자.

1. UnsafeCounter 객체를 만든다. UnsafeCounter 객체는 내부에 value 프로퍼티를 갖고 있다.
2. 10만 개의 태스크가 UnsafeCounter 객체의 value 프로퍼티를 1씩 증가시킨다.
3. 모든 태스크의 작업이 완료되면 UnsafeCounter 객체의 변경된 상태를 로그로 확인한다.
4. 위 과정을 5회 수행한다.

```swift
import Foundation
import Playgrounds

final class UnsafeCounter: @unchecked Sendable {
    var value = 0
}

func runRaceTest() async {
    for round in 1...5 {
        let counter = UnsafeCounter()
        await withTaskGroup(of: Void.self) { group in
            for _ in 0..<100_000 {
                group.addTask {
                    counter.value += 1
                }
            }
        }
        print("\(round)회차: \(counter.value) / 100000")
    }
}

#Playground("Data Race") {
    await runRaceTest()
}
```

위 코드를 실행하면 다음과 같은 로그를 볼 수 있다. 데이터 경합으로 상태 변경이 일부 누락된다.

- 5차례 모두 10만 개의 태스크가 정상적으로 상태를 변경하지 못했다.
- 데이터가 유실되는 비율이 매번 다르다.

```
1회차: 99911 / 100000
2회차: 99912 / 100000
3회차: 99948 / 100000
4회차: 99936 / 100000
5회차: 99934 / 100000
```

이처럼 경쟁 상태로 데이터가 유실되는 것을 방지하기 위해 스위프트는 액터를 사용한다. 위 예제 코드의 클래스를 액터로 변경해 실행해 보자.

액터의 변경 가능한 프로퍼티(mutable property)는 외부에서 읽을 수 있지만 직접 수정할 수는 없다. 또한 액터 밖에서는 격리된 프로퍼티에 동기적으로 직접 접근할 수 없으므로 내부에 메서드를 정의하고 외부에서 `await` 키워드와 함께 호출한다.

1. SafeCounter 객체를 만든다. SafeCounter 객체는 내부에 value 프로퍼티를 갖고 있다.
2. 10만 개의 태스크가 SafeCounter 객체의 increment 함수를 호출해 value 프로퍼티를 1씩 증가시킨다.
3. 모든 태스크의 작업이 완료되면 SafeCounter 객체의 변경된 상태를 로그로 확인한다.
4. 위 과정을 5회 수행한다.

```swift
actor SafeCounter {
    private var value = 0

    func increment() {
        value += 1
    }

    func currentValue() -> Int {
        value
    }
}

func runActorTest() async {
    for round in 1...5 {
        let counter = SafeCounter()
        await withTaskGroup(of: Void.self) { group in
            for _ in 0..<100_000 {
                group.addTask {
                    await counter.increment()
                }
            }
        }
        print("\(round)회차: \(await counter.currentValue()) / 100000")
    }
}

#Playground("Actor") {
    await runActorTest()
}
```

5차례 모두 10만 개의 태스크가 정상적으로 상태를 변경했다.

```
1회차: 100000 / 100000
2회차: 100000 / 100000
3회차: 100000 / 100000
4회차: 100000 / 100000
5회차: 100000 / 100000
```

데이터 경합은 대부분 잘 동작하다가 가끔 문제가 발생하는 버그 유형이다. 크래시가 발생할 수도 있고, 값이 조용히 틀리거나 특정 기기에서만 문제가 드러날 수도 있다. 실행할 때마다 결과가 달라지므로 테스트가 있더라도 발견하기 어렵고 불안정한(flaky) 테스트가 된다. 스위프트는 액터를 통해 이러한 데이터 경합 문제를 런타임이 아닌 컴파일 타임으로 옮겼다.

2021년 `Swift 5.5`에 `async/await`, `Task`, `actor`, `structured concurrency`가 도입되면서 현대 스위프트 동시성(Swift Concurrency) 모델이 시작됐다. 스위프트 동시성이 등장하기 전에는 GCD(Grand Central Dispatch)가 표준 동시성 도구였다. 내가 잠시 참여했던 iOS 프로젝트에서도 이런 코드를 많이 본 기억이 난다.

```swift
DispatchQueue.global(qos: .background).async {
    let data = heavyWork() // 백그라운드
    DispatchQueue.main.async {
        self.label.text = data // 메인으로 복귀
    }
}
```

이 코드는 DispatchQueue.main.async 호출이 빠지더라도 컴파일을 통과하지만 런타임에 문제가 발생한다. 이처럼 메인 스레드에서 처리해야 하는 부분을 개발자가 잊지 않고 구현해야 했지만, 지금은 타입 시스템이 이를 강제한다. 액터를 사용하는 곳에 문제가 있다면 컴파일러가 감지한다.

액터는 **자신의 상태에 한 번에 하나의 작업만 접근하도록 컴파일러가 보장하는 참조 타입**이다. 목표는 데이터 경합을 방지하는 것이다. 일반 클래스에서는 개발자가 락(lock)이나 직렬 큐를 통해 직접 관리해야 하지만, 액터는 컴파일러의 액터 격리 검사와 런타임의 직렬 실행자(serial executor)를 통해 이러한 접근을 보호한다. 대신 액터의 함수를 외부에서 호출할 때 `await` 키워드를 함께 사용해야 한다.

컴파일 에러가 발생하는 상황을 살펴보자.

```swift
actor UserStore {
    var names: [String] = []
}

let store = UserStore()

#Playground("Compile Error") {
    store.names.append("Alice")
    store.names.append("Bob")
}
```

위 코드를 실행하면 다음과 같은 컴파일 에러가 발생한다.

- names는 격리된 상태이므로 액터 외부에서 직접 변경하려고 하면 컴파일 에러가 발생한다.

```
actor-isolated property 'names' can not be mutated from the main actor
```

컴파일 에러를 해결하려면 아래처럼 상태 변경 함수를 선언해 격리된 환경 내부에서만 상태가 변경되도록 해야 한다.

```swift
actor UserStore {
    var names: [String] = []
    
    func append(_ name: String) {
        names.append(name)
    }
}

let store = UserStore()

#Playground("Compile Error") {
    await store.append("Alice")
    await store.append("Bob")
}
```

## 2. How to isolate and serialize?

액터가 하는 일은 격리와 직렬 실행이다.

- 격리(isolation)
  - 저장 프로퍼티와 메서드는 기본적으로 해당 액터에 격리된다.
  - 액터 외부에서는 격리 경계를 넘을 수 없다.
- 직렬 실행(serial execution)
  - 한 액터의 격리된 코드는 동시에 둘 이상 실행되지 않는다.
  - 단, `await` 키워드에 의해 서스펜션되면 그사이에 다른 작업이 같은 액터에서 실행될 수 있다.

앞선 컴파일 에러 예제 코드를 통해 액터의 격리가 컴파일 수준에서 이루어진다는 사실을 살펴봤다. 그렇다면 직렬 실행은 어떻게 가능할까? 이 구조를 이해하려면 [스위프트의 비동기 처리 아키텍처][swift-asynchronous-task-architecture-link]를 알아야 한다. 태스크(task), 잡(job), 실행자(executor), 스레드(thread)로 비동기 처리가 이어지는 방식을 이해하는 것이 우선이다.

`await` 키워드는 **이 위치에서 태스크가 서스펜드(suspend) 상태가 될 수 있다는 표시**다. 액터의 함수 앞에 `await` 키워드가 붙는 이유는 다른 태스크가 특정 액터의 격리된 코드를 실행 중이라면 새롭게 진입하려는 태스크가 서스펜드될 수 있기 때문이다.

이해하기 쉽게 예제 코드와 함께 정리해 보자. 다음과 같은 액터가 있다.

```swift
actor Counter {
    var value = 0

    func increment() {
        value += 1
    }
}
```

위 액터 객체에 접근하는 두 개의 태스크가 있다. 각각 태스크 A와 태스크 B라고 가정한다.

```swift
let counter = Counter()

Task {
    ... 태스크 A 로직
    await counter.increment()
}

Task {
    ... 태스크 B 로직
    await counter.increment()
}
```

현재 두 태스크가 각각 다른 스레드에 의해 동시에 실행 중이다.

```
Thread 1
  Task A ──────> ... counter.increment()

Thread 2
  Task B ──────> ... counter.increment()
```

태스크 A가 먼저 Counter 액터의 increment() 함수를 호출했다고 가정해 보자. 현재 Counter 액터에 접근하는 태스크가 하나도 없는 상태다.

1. 태스크 A가 Counter 액터의 increment() 함수를 호출하면 즉시 실행된다.
2. 그사이에 태스크 B도 Counter 액터의 increment() 함수를 호출하면 태스크 B는 잠시 서스펜드된다.
3. 태스크 A의 작업이 완료된다.
4. 해당 액터의 직렬 실행자는 자신의 큐에서 대기 중인 태스크를 확인한 후 스케줄링을 통해 유휴 스레드에 태스크를 배치한다. 이 시점에 태스크 B가 3번 스레드에 배치된다.

```
시간 ─────────────────────────────────────────────────────>

Thread 1
Task A        ───[ actor.increment 실행 ]───
                         value += 1
                         actor 점유
Thread 2
Task B                ──[ await actor.increment() 요청 ]
                         │
                         │ actor가 이미 사용 중
                         ▼
                       suspend
                         │
                         │
                         │
                         └──────────────────────┐
                                                │
Thread 3                                        ▼
Task B                                          ─────[ resume ]
                                                    [ actor.increment 실행 ]
                                                      value += 1
```

이전 글에서 살펴봤듯이 사용 가능한 스레드를 선택하므로 태스크가 매번 같은 스레드에서 실행되지는 않는다. 공식 문서에 따르면 기본적으로 각 액터에는 고유한 직렬 실행자가 존재한다. 따라서 액터에 접근할 태스크를 액터 단위로 줄 세울 수 있다.

> By default, every actor gets its own serial executor instance, and each such instance is unique.

단, 예외는 있다. 스위프트에서는 커스텀 실행자(custom executor)를 지정해 여러 액터가 같은 직렬 실행자를 공유하도록 직접 설계할 수도 있다.

## 3. Actor Types

액터는 크게 세 가지 타입으로 나눌 수 있다.

- 일반 액터
- 메인 액터(=글로벌 액터)
- 커스텀 글로벌 액터

일반 액터는 각 액터 인스턴스가 자신의 상태를 격리하고, 직렬 실행자를 통해 액터에 접근하려는 태스크를 직렬화한다.

```swift
actor Counter {
    var value = 0
}
```

메인 액터(main actor)는 스위프트가 기본으로 제공하는 글로벌 액터(global actor)다. UI 관련 상태를 메인 실행 컨텍스트에 격리할 때 주로 사용한다. 글로벌 액터이기 때문에 클래스, 함수, 변수 등 종류와 관계없이 여러 곳에 동시에 적용할 수 있다. 여러 곳에 적용하더라도 하나의 글로벌 액터를 공유하므로 메인 액터에 접근하는 모든 태스크는 직렬화된다.

```swift
@MainActor
final class ViewModel {
    var text = ""
}

@MainActor
func updateUI() {
}

@MainActor
var selectedItem: Item?
...
```

마지막으로 개발자가 글로벌 액터를 직접 만들어 여러 곳에 적용할 수도 있다. 여러 곳에서 발생하는 변경 사항을 하나의 액터로 묶어 격리하고 직렬화할 수 있다.

```swift
@globalActor
actor SignalingActor {
    static let shared = SignalingActor()
}

@SignalingActor
final class WebSocketClient {
}

@SignalingActor
final class SDPHandler {
}

@SignalingActor
final class ICECandidateStore {
}

@SignalingActor
func foo() { }
```

일반 액터와 커스텀 글로벌 액터에 접근하는 태스크는 협력 스레드 풀(cooperative thread pool)의 워커 스레드가 처리하고, 메인 액터에 접근하는 태스크는 메인 스레드가 처리한다. 메인 액터를 담당하는 별도의 실행자가 존재한다.

```
                       Actor Executors
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
 일반 Actor           Custom Global Actor       MainActor
 Serial Executor     Serial Executor           Executor
 actor 인스턴스의       여러 선언을 하나의            UI / main state를
 상태를 보호            공통 격리 영역으로 묶음        메인 실행 컨텍스트에 격리
        │                    │                    │
        └─────────────┬──────┘                    │
                      │                           │
                      ▼                           ▼
            Cooperative Thread Pool          Main Thread
```

**메인 액터는 특별하다.** 메인 액터의 태스크(또는 잡)는 메인 액터 실행자에 의해 반드시 메인 스레드에만 할당된다. iOS에서는 데이터 경합을 방지하기 위해 UIKit과 SwiftUI의 UI 갱신이 반드시 메인 스레드에서만 이루어져야 한다. UI 프레임워크가 스레드 안전성을 보장하지 않기 때문에 여러 스레드가 동시에 뷰(view) 계층을 건드리면 내부 상태가 깨진다. 메인 스레드는 메인 런 루프를 초당 60~120회 실행하면서 다음과 같은 일을 한다.

- 터치·제스처 입력 처리
- 상태 변경 반영
- 레이아웃 계산
- 화면 그리기
- 다음 프레임 준비

따라서 메인 스레드에서 무거운 작업을 하면 화면이 멈춘다. 무거운 작업이 포함된 로직을 메인 액터로 격리하는 것은 좋지 않다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-09-21-swift-actor>

#### REFERENCE

- <https://github.com/swiftlang/swift-evolution/blob/main/proposals/0306-actors.md>
- <https://github.com/swiftlang/swift-evolution/blob/main/proposals/0327-actor-initializers.md>
- <https://docs.swift.org/latest/documentation/the-swift-programming-language/concurrency/>
- <https://docs.swift.org/latest/documentation/diagnostics/actor-isolated-call>

[swift-asynchronous-task-architecture-link]: https://junhyunny.github.io/swift/asnyc-await/task/executor/thread/swift-asynchronous-task-architecture/
