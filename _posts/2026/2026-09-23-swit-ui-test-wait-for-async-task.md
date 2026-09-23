---
title: "SwiftUI 테스트 - 비동기 작업 단언(async task assertion)"
search: false
category:
  - swift
  - swift-ui
  - test
  - test-driven-development
  - unit-test
last_modified_at: 2026-09-23T10:48:32+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

## 0. 들어가면서

이번 글은 SwiftUI 단위 테스트에 비동기 로직이 포함되었을 때 테스트가 간헐적으로 실패하거나 단언(assertion)이 정상적으로 수행되지 않는 문제를 해결하기 위한 팁(tip)을 소개한다.

## 1. Problem context

예제 코드를 살펴보자. 다음과 같은 비즈니스 로직이 있다.

- observation 함수는 SignalClient 인스턴스로부터 비동기적으로 이벤트를 수신한다.

```swift
final class ContentViewModel {
    private(set) var status: String = ""
    private let signalClient: SignalClient

    init(signalClient: SignalClient) {
        self.signalClient = signalClient
    }

    func observation() {
        Task {
            for await event in signalClient.events {
                switch event {
                case .joined:
                    self.status = "joined"
                case .peerLeft:
                    self.status = "peerLeft"
                }
            }
        }
    }
}
```

위 코드의 테스트와 여기에서 사용하는 테스트 더블을 살펴보자. 먼저 다음과 같은 테스트 더블을 만들었다.

- events 프로퍼티는 AsyncStream 객체로 지정한다. 값을 한 번 반환하고 종료되는 async 함수와 달리 여러 이벤트를 계속 전달할 수 있다.
- sendEvent 함수는 Continuation 객체의 yield 함수를 통해 이벤트를 발생시킨다. 테스트 코드에서 이벤트를 제어하기 위해 사용한다.

```swift
final class MockSignalClient: SignalClient {
    private(set) var events: AsyncStream<SignalEvent>
    private(set) var continuation: AsyncStream<SignalEvent>.Continuation!
    init() {
        var continuous: AsyncStream<SignalEvent>.Continuation?
        self.events = AsyncStream { streamContinuation in
            continuous = streamContinuation
        }
        self.continuation = continuous
    }

    func sendEvent(signalEvent: SignalEvent) {
        self.continuation.yield(signalEvent)
    }
}
```

테스트 더블을 살펴봤으니 ContentViewModel 클래스의 테스트 코드를 살펴보자. 아래 테스트에서 확인하고 싶은 것은 다음과 같다.

1. observation 함수를 실행한다.
2. SignalClient 인스턴스로부터 이벤트가 발생한다.
3. 상태가 이벤트 타입에 따라 변경되었는지 확인한다.

```swift

import Testing

@testable import action_in_blog

...

struct ContentViewModelTests {

    @MainActor
    @Test
    func `given_joined_event_is_received_when_receive_then_status_is_joined`()
        async throws
    {
        let mockSignalClient = MockSignalClient()
        let sut = ContentViewModel(signalClient: mockSignalClient)

        sut.observation()

        mockSignalClient.sendEvent(signalEvent: .joined)
        #expect(sut.status == "joined")
    }
}
```

논리적으로 문제가 없어 보이지만, 테스트 코드는 실패한다. 비동기적으로 뷰 모델(view model)의 상태가 변경되기 때문이다.

## 2. Solve the problem

이 문제는 비동기 처리가 완료될 때까지 기다리면 해결할 수 있다. 무제한으로 기다릴 수는 없으므로 지정한 시간만큼 기다리는 함수를 만든다. 내가 주로 사용했던 RTL(React Testing Library)은 이런 기능을 제공하지만, 스위프트 테스트 라이브러리는 이를 제공하지 않는 것 같아 직접 만들어야 한다. 코드는 다음과 같다.

- 현재 시간에 타임아웃을 더한 시각을 데드라인으로 지정한다.
- 데드라인에 도달할 때까지 condition 클로저를 10ms 주기로 확인한다.
- 대기 중 condition 클로저가 true를 반환하면 대기를 종료한다.
- 대기 시간 동안 condition 클로저가 true를 반환하지 않으면 예외를 발생시킨다.

```swift
func waitFor(
    timeout: Duration = .seconds(1),
    condition: @escaping () async -> Bool
) async throws {
    let clock = ContinuousClock()
    let deadline = clock.now.advanced(by: timeout)
    while clock.now < deadline {
        if await condition() {
            return
        }
        try await Task.sleep(for: .milliseconds(10))
    }
    throw WaitError.timeout
}

enum WaitError: Error {
    case timeout
}
```

위 waitFor 함수로 비동기 처리로 상태가 바뀌는 것을 기다린 후 단언하면 테스트가 통과한다.

```swift
struct ContentViewModelTests {

    @MainActor
    @Test
    func `given_joined_event_is_received_when_receive_then_status_is_joined`()
        async throws
    {
        let mockSignalClient = MockSignalClient()
        let sut = ContentViewModel(signalClient: mockSignalClient)

        sut.observation()

        mockSignalClient.sendEvent(signalEvent: .joined)
        try await waitFor { sut.status == "joined" }
        #expect(sut.status == "joined")
    }
}
```

## CLOSING

이 외에도 비동기 처리가 완료되기를 기다리는 방법이 있는 것 같지만, 함수 시그니처를 바꾸지 않고 문제를 해결하기 위해 가장 익숙한 신택스(syntax)의 함수를 만들었다. 스위프트는 공부할수록 직접 해 줘야 하는 게 많다는 인상을 받는다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-09-23-swit-ui-test-wait-for-async-task>
