---
title: "스위프트(Swift) Equatable 프로토콜"
search: false
category:
  - swift
  - equatable
  - comparable
last_modified_at: 2026-09-18T00:42:48+09:00
---

<br/>

## 1. Equatable 프로토콜

스위프트(Swift)의 Equatable 프로토콜을 채택하면 어떤 기준으로 객체가 같은지 비교할 수 있다. Equatable이 요구하는 핵심 기능은 `== 연산자`다.

```swift
static func == (lhs: Self, rhs: Self) -> Bool
```

이 메서드는 두 값이 같은지 판단해서 Bool 값을 반환한다. `!= 연산자`는 == 연산자의 결과를 반대로 사용하도록 스위프트 표준 라이브러리에서 제공하기 때문에 별도로 구현할 필요가 없다. Equatable 프로토콜을 채택하지 않은 객체는 == 연산자로 비교할 수 없다. "Binary operator '==' cannot be applied to two 'Coordinate' operands"라는 에러 메시지와 함께 컴파일 에러가 발생한다.

```swift
struct Coordinate {
    let x: Int
    let y: Int
}

let a = Coordinate(x: 1, y: 2)
let b = Coordinate(x: 1, y: 2)

print(a == b)  // compile 에러 - Binary operator '==' cannot be applied to two 'Coordinate' operands
```

## 2. Equatable 프로토콜 예시

지금부터 구조체(struct), 클래스(class), 이넘(enum)이 Equatable 프로토콜을 채택하면 어떻게 동작하는지 살펴보자. 먼저 구조체 자료형을 살펴보자. 구조체 자료형이 Equatable 프로토콜을 채택하면 컴파일러가 == 구현을 자동으로 만들어준다. 단, 컴파일러가 == 연산자를 자동으로 합성해주길 원한다면 모든 저장 프로퍼티 타입이 Equatable 프로토콜을 채택하고 있어야 한다.

아래 예제의 x, y 프로퍼티는 Int 타입으로 Equatable 프로토콜을 채택한 타입이다. 그렇기 때문에 컴파일러가 자동으로 == 연산자를 합성해준다.

```swift
struct Coordinate: Equatable {
    let x: Int
    let y: Int
}

let a = Coordinate(x: 1, y: 2)
let b = Coordinate(x: 1, y: 2)
let c = Coordinate(x: 3, y: 4)

print(a == b)  // true
print(a == c)  // false
```

필요하다면 비교 기준을 직접 정의할 수도 있다. 아래 예제에서는 name 속성이 달라도 id 속성 값이 같다면 같은 사용자라고 판단한다.

```swift
struct User: Equatable {
    let id: Int
    let name: String

    static func == (lhs: User, rhs: User) -> Bool {
        lhs.id == rhs.id
    }
}

let user1 = User(id: 1, name: "Kim")
let user2 = User(id: 1, name: "Lee")

print(user1 == user2)  // true
```

클래스는 구조체나 이넘 타입과 달리 Equatable 구현이 자동으로 합성되지 않는다. 따라서 어떤 기준으로 두 인스턴스를 같다고 볼지 직접 구현해야 한다. == 연산자를 구현하지 않으면 컴파일 에러가 발생한다. "Type 'Todo' does not conform to protocol 'Equatable'"라는 에러 메시지를 볼 수 있다.

```swift
class Todo: Equatable {
    let id: Int
    let title: String

    init(id: Int, title: String) {
        self.id = id
        self.title = title
    }
}
```

다음과 같이 == 연산자를 클래스 내부에 정의해줘야 한다.

```swift
class Todo: Equatable {
    let id: Int
    let title: String

    init(id: Int, title: String) {
        self.id = id
        self.title = title
    }

    static func == (lhs: Todo, rhs: Todo) -> Bool {
        lhs.id == rhs.id
    }
}

let todo1 = Todo(id: 1, title: "buying milk")
let todo2 = Todo(id: 1, title: "homework")

print(todo1 == todo2)  // true
```

== 연산자와 비슷한 === 연산자가 있다. == 연산자는 우리가 정의한 기준에 따라 id 속성을 비교한다. 즉, 값의 동등성을 비교한다. 반면 === 연산자는 두 객체가 메모리상 동일한 인스턴스인지 비교한다. 객체의 참조 자체가 같은지 확인할 때 사용한다.

```swift
let todo3 = todo1

print(todo1 === todo3)  // true
print(todo1 === todo2)  // false
```

이넘 타입도 구조체와 동일하게 컴파일러가 == 연산자 구현을 자동으로 만들어준다. 각 case가 가지고 있는 연관 값(associated value)이 모두 Equatable 프로토콜을 채택한 경우에만 자동으로 생성되는 부분도 구조체와 동일하다. 연관 값은 스위프트 이넘의 각 case가 함께 들고 있는 값을 의미한다.

```swift
enum NetworkState: Equatable {
    case idle
    case loading
    case success(String)
    case failure(Int)
}

print(NetworkState.idle == NetworkState.idle)  // true
print(NetworkState.loading == NetworkState.idle)  // false
print(NetworkState.success("Hello") == NetworkState.success("Hello"))  // true
print(NetworkState.success("Hello") == NetworkState.success("World"))  // false
print(NetworkState.failure(404) == NetworkState.failure(404))  // true
```

## CLOSING

정리하면 Equatable의 동작 방식은 타입에 따라 조금씩 다르다.

- struct 타입: 저장 프로퍼티가 모두 Equatable 프로토콜을 채택하면 컴파일러는 == 연산자를 자동으로 합성할 수 있다.
- class 타입: 컴파일러에 의해 자동 합성되지 않으므로 == 연산자를 직접 구현해야 한다.
- enum 타입: 연관 값이 모두 Equatable 프로토콜을 채택하면 == 연산자를 자동으로 합성할 수 있다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-09-18-swift-equatable/action-in-blog.playground>

#### REFERENCE

- [Swift 표준 라이브러리 — Equatable](https://developer.apple.com/documentation/swift/equatable)
- [Swift — Adopting Common Protocols](https://developer.apple.com/documentation/swift/adopting-common-protocols)
- [Swift 표준 라이브러리 — Hashable](https://developer.apple.com/documentation/swift/hashable)
