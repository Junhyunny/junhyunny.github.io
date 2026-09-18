---
title: "스위프트(Swift) Comparable 프로토콜"
search: false
category:
  - swift
  - equatable
  - comparable
last_modified_at: 2026-09-18T10:26:56+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [스위프트(Swift) Equatable 프로토콜][swift-equatable-link]

## 1. Comparable 프로토콜

스위프트(Swift)의 Comparable 프로토콜을 채택(conform)하면 객체의 순서를 결정할 수 있다. 구현할 핵심 요구사항은 `< 연산자`다. Comparable 프로토콜은 Equatable 프로토콜을 상속하기 때문에 `== 연산자`는 직접 구현하거나 컴파일러에 의해 자동 합성될 수 있다. `!=`, `>`, `<=`, `>=` 연산자는 `== 연산자`와 `< 연산자`를 바탕으로 표준 라이브러리가 제공한다.

```swift
static func < (lhs: Self, rhs: Self) -> Bool
```

Comparable 프로토콜을 채택하지 않고 < 연산자를 사용하면 "Binary operator '<' cannot be applied to two 'Coordinate' operands"라는 에러 메시지와 함께 컴파일 에러가 발생한다.

```swift
struct Coordinate {
    let x: Int
    let y: Int
}

let a = Coordinate(x: 1, y: 2)
let b = Coordinate(x: 1, y: 2)

print(a < b)  // compile 에러 - Binary operator '<' cannot be applied to two 'Coordinate' operands
```

Comparable 프로토콜을 구현하려면 일관된 순서를 만들어야 한다. 임의의 값 a, b에 대해 다음 세 관계 중 하나가 성립해야 한다.

```
a == b
a < b
b < a
```

자기 자신보다 작을 순 없다.

```
a < a // false
```

`a < b`가 성립하면 `b < a`는 성립할 수 없다.

```
a < b // true
b < a // false
```

순서는 전이되어야 한다. 예를 들어, 아래와 같은 조건이 있다고 가정해보자.

```
a < b
b < c
```

위 조건이 만족한다면 `a < c`도 성립해야 한다. 이런 규칙이 지켜져야 sorted(), min(), max() 같은 연산이 일관된 결과를 만들 수 있다.

## 2. Comparable 프로토콜 예제

지금부터 구조체(struct), 클래스(class), 이넘(enum)이 Comparable 프로토콜을 채택하면 어떻게 동작하는지 살펴보자. 먼저 구조체 자료형을 살펴본다. == 연산자는 프로퍼티 타입이 모두 Equatable 프로토콜을 채택하고 있다면 컴파일러에 의해 자동으로 합성되므로 < 연산자만 필수로 구현한다.

아래 예제는 Int 타입인 major, minor, patch 프로퍼티를 하나의 튜플(tuple)로 묶어서 비교하도록 구현했다. 튜플은 이미 < 연산자를 구현하고 있기 때문에 이를 활용했다. 튜플 비교는 왼쪽 값부터 순서대로 진행된다.

```swift
struct Version: Comparable {
    let major: Int
    let minor: Int
    let patch: Int

    static func < (lhs: Version, rhs: Version) -> Bool {
        (lhs.major, lhs.minor, lhs.patch)
            < (rhs.major, rhs.minor, rhs.patch)
    }
}

let v1 = Version(major: 1, minor: 9, patch: 0)
let v2 = Version(major: 2, minor: 0, patch: 0)

print(v1 < v2)  // true
print(v1 > v2)  // false
print(v1 == v2)  // false
```

Comparable 프로토콜을 채택할 때 중요한 점은 < 연산자와 == 연산자가 같은 비교 기준을 사용해야 한다는 것이다. 예를 들어 아래처럼 구현하면 같은 값이면서 동시에 한 값이 다른 값보다 작다고 판단하는 모순이 생긴다.

- == 연산자는 id 프로퍼티를 기준으로 비교
- < 연산자는 name 프로퍼티를 기준으로 비교

```swift
struct User: Comparable {
    let id: Int
    let name: String

    static func == (lhs: User, rhs: User) -> Bool {
        lhs.id == rhs.id
    }

    static func < (lhs: User, rhs: User) -> Bool {
        lhs.name < rhs.name
    }
}

let a = User(id: 1, name: "Alice")
let b = User(id: 1, name: "Bob")

print(a == b)  // true
print(a < b)  // true
```

클래스도 Comparable 프로토콜을 채택할 수 있다. 다만 클래스는 구조체와 달리 Equatable 프로토콜 구현이 자동으로 합성되지 않기 때문에 ==, < 연산자를 직접 구현해야 한다.

```swift
class Person: Comparable {
    let id: Int
    let name: String

    init(id: Int, name: String) {
        self.id = id
        self.name = name
    }

    static func == (lhs: Person, rhs: Person) -> Bool {
        lhs.id == rhs.id
    }

    static func < (lhs: Person, rhs: Person) -> Bool {
        lhs.id < rhs.id
    }
}

let alice = Person(id: 1, name: "Alice")
let bob = Person(id: 2, name: "Bob")

print(alice < bob)  // true
print(alice == bob)  // false
print(alice > bob)  // false
```

이넘도 Comparable 프로토콜을 채택할 수 있다. 연관 값(associated value)이 없는 단순한 이넘의 경우 컴파일러가 선언된 case 순서를 기준으로 Comparable 구현을 합성한다. 예를 들어 보자.

- `low < medium < high` 순서가 만들어진다.

```swift
enum Priority: Comparable {
    case low
    case medium
    case high
}

print(Priority.low < Priority.medium)  // true
print(Priority.medium < Priority.high)  // true
print(Priority.high > Priority.low)  // true
```

연관 값이 있는 이넘도 해당 값들이 비교 가능한 타입이라면 컴파일러에 의해 자동으로 합성되어 비교에 사용된다.

```swift
enum Score: Comparable {
    case none
    case value(Int)
}

print(Score.value(10) < Score.value(20))  // true
print(Score.value(20) == Score.value(20))  // true
```

Int, String, Double 같은 표준 라이브러리의 많은 타입은 이미 Comparable 프로토콜을 채택하고 있다. Comparable 프로토콜을 채택한 객체가 담긴 컬렉션에서는 sort(), sorted(), min(), max() 같은 함수를 쉽게 사용할 수 있다.

```swift
let scores = [30, 10, 20]

print(scores.sorted()) // [10, 20, 30]
print(scores.min()) // Optional(10)
print(scores.max()) // Optional(30)
```

Double.nan 값은 예외적으로 주의해야 한다. 부동소수점에는 NaN(Not a Number)이라는 특수한 값이 있다. NaN은 일반적인 값과 다른 비교 규칙을 가진다.

- 자기 자신과도 같지 않다.

```swift
let value = Double.nan

print(value == value)  // false
print(value < value)  // false
print(value > value)  // false
```

그렇기 때문에 부동소수점 값을 다룰 때 NaN 값이 포함될 가능성이 있다면 일반적인 비교 결과를 예상하면 안 된다. 필요하다면 먼저 isNaN 프로퍼티를 이용해 별도로 처리하는 것이 좋다.

```swift
if value.isNaN {
    print("NaN에 대한 별도 처리")
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-09-18-swift-comparable/action-in-blog.playground>

#### REFERENCE

- [Swift 표준 라이브러리 — Comparable의 요구사항과 기본 구현](https://developer.apple.com/documentation/swift/comparable)
- [Swift 표준 라이브러리 — FloatingPoint의 NaN](https://developer.apple.com/documentation/swift/floatingpoint)

[swift-equatable-link]: https://junhyunny.github.io/swift/equatable/comparable/swift-equatable/