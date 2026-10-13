---
title: "스위프트 ARC(Swift Automatic Reference Counting)"
search: false
category:
  - swift
  - swift-ui
  - arc
  - automatic-reference-counting
  - garbage-collecting
last_modified_at: 2026-10-13T17:42:49+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [가비지 컬렉션(Garbage Collection) 참조 카운팅(Reference Counting) 알고리즘][reference-counting-gc-in-javascript-link]
- [스위프트 구조체와 클래스(Swift struct and class)][struct-and-class-in-swift-link]
- [스위프트(Swift) 강한 참조, 약한 참조 그리고 미소유 참조][swift-strong-reference-weak-reference-and-unowned-reference-link]

## 0. 들어가면서

스위프트(Swift)는 `ARC(Automatic Reference Counting)`라는 방법을 통해 클래스 인스턴스의 수명을 관리한다. 이전의 Objective-C에서는 개발자가 메모리 해제를 직접 관리하기도 했지만, 스위프트는 ARC를 통해 사용되지 않는 인스턴스의 메모리를 자동으로 해제한다. ARC는 가비지 컬렉션 방식 중 [참조 카운팅(reference counting) 알고리즘][reference-counting-gc-in-javascript-link]과 같은 원리로 동작한다. 먼저 참조 카운팅 방식을 살펴본 뒤 ARC를 자세히 알아보자.

## 1. 참조 카운팅 (Reference Counting)

스위프트에서 `class` 키워드로 정의한 클래스의 인스턴스는 참조 타입(reference type)이다. 참조 타입의 변수에는 인스턴스에 대한 참조가 저장된다. 손가락으로 어떤 물건을 가리킨다고 생각하면 이해하기 쉽다. 간단한 예시 코드를 살펴보자.

- first 변수와 second 변수가 동일한 객체를 가리킨다.
- first 변수를 통해 변경한 객체의 상태를 second 변수에서도 확인할 수 있다.

```swift
final class Box {
    var number = 1
    deinit { print("Box 해제") }
}

var first: Box? = Box()  // Box 객체 한 개를 만든다
var second = first  // 새 Box를 만들지 않고 같은 객체를 가리킨다
print(first === second)  // true, 두 참조의 대상이 같다
first?.number = 10
print(second?.number ?? -1)  // 10, 한 객체를 공유한다
first = nil  // 첫 번째 손가락만 거둔다
print(second?.number ?? -1)  // 10, 객체는 여전히 살아 있다
second = nil  // 두 번째 손가락을 거둔다
```

참조 카운팅은 객체를 가리키는 참조의 수를 세는 방식이다. 위 예시 코드에서 Box 객체의 참조 카운트(RC)는 아래 그림처럼 변한다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/swift-strong-reference-weak-reference-and-unowned-reference-01.png" width="100%" class="image__border">
</div>

<br/>

스위프트의 클래스 인스턴스를 아무도 참조하지 않으면 해당 객체는 ARC에 의해 해제된다. 객체가 해제되는지는 `deinit`을 통해 확인할 수 있다. 아래 코드를 실행해 보자.

```swift
final class Person {
    let name: String
    init(_ name: String) { self.name = name }
    deinit { print("\(name) 해제") }
}

var first: Person? = Person("Junhyunny")
var second = first  // 같은 인스턴스를 강하게 참조한다
print("first 변수 해제")
first = nil  // second의 강한 참조가 남아 있으므로 아직 해제되지 않는다
print("second 변수 해제")
second = nil  // 마지막 강한 참조가 사라져 deinit이 호출된다
```

위 코드의 실행 결과는 다음과 같다.

- 두 번째 참조인 second 변수가 참조를 잃으면 Person("Junhyunny") 객체가 해제된다.

```
first 변수 해제
second 변수 해제
Junhyunny 해제
```

## 2. Swift ARC(Automatic Reference Counting)

클래스 인스턴스의 수명을 관리하는 ARC는 어떻게 동작할까? ARC의 핵심은 개발자가 소스 코드에 retain(유지)과 release(해제)를 직접 쓰지 않아도 **컴파일할 때 참조의 시작과 마지막 사용을 분석해 필요한 연산을 생성**한다는 것이다. 프로그램을 실행하면 컴파일러가 생성한 retain, release 연산이 참조 카운트를 올리거나 내린다. 앞서 살펴봤듯이 참조 카운트가 0이 되면 객체가 메모리에서 해제된다.

- retain: 어떤 객체를 새로운 [강한 참조(strong reference)][swift-strong-reference-weak-reference-and-unowned-reference-link]가 가리키는 경우 그 객체의 참조 카운트를 증가시키는 연산
- release: 기존 강한 참조가 사라질 때 참조 카운트를 감소시키는 연산

[ARC in Swift: Basics and beyond](https://developer.apple.com/videos/play/wwdc2021/10216/) 영상에서는 짧은 예제 코드와 함께 ARC의 동작을 설명한다. 이 예제에서 등장하는 retain, release 연산도 컴파일러가 추가한 것을 시각화한 것이다. 지금부터 영상에서 소개한 예제 코드를 살펴보자.

예제에서는 Traveler 인스턴스를 생성해 traveler1 변수에 할당한다. 이어 traveler1이 참조하는 인스턴스를 traveler2 변수에도 할당한다. 이로써 두 변수는 동일한 Traveler 인스턴스를 가리킨다. 

```swift
class Traveler {
    var name: String
    var destination: String?
    init(name: String, destination: String? = nil) {
        self.name = name
        self.destination = destination
    }
}
    
let traveler1 = Traveler(name: "Lily")
let traveler2 = traveler1
traveler2.destination = "Big Sur"
print("Done traveling")
```

위 코드는 컴파일 시점에 다음과 같이 컴파일러에 의해 메모리 관리 연산들이 추가된다.

```swift
let traveler1 = Traveler(name: "Lily")
retain

let traveler2 = traveler1
release

traveler2.destination = "Big Sur"
release

print("Done traveling")
```

위 코드를 하나씩 뜯어서 살펴보자. 다음 코드에서 Traveler 인스턴스가 생성된다.

```swift
let traveler1 = Traveler(name: "Lily")
retain
```

이후 retain 연산이 수행되고, Traveler(name: "Lily") 인스턴스의 참조 카운트는 1이 된다. 그 다음 같은 객체를 다른 변수(traveler2)에 대입한다. 객체의 참조 카운트가 늘어나므로 retain 연산이 수행될 것 같지만, 예제에서는 release 연산이 실행된다.

```swift
let traveler2 = traveler1
release
```

이 코드는 새로운 Traveler 인스턴스가 만들어지는 것은 아니다. traveler1과 traveler2 변수는 동일한 인스턴스를 가리킨다. 개념적으로 강한 참조가 두 개이므로 참조 카운트가 2가 되는 것이 맞다.

```
traveler1 ───┐
             │
             ▼
          Traveler (reference count = 2)
             ▲
             │
traveler2 ───┘
```

다만 이 코드가 traveler1 변수의 마지막 사용 시점이라는 것이 중요하다. 컴파일러는 traveler1의 강한 참조를 더 유지할 필요가 없다고 판단하고 release 연산으로 참조 카운트를 감소시킨다. 컴파일러는 변수가 더 이상 필요하지 않다고 판단하면 release 연산을 실행 추가하게 된다. **객체의 참조 카운트가 코드 블록의 끝까지 반드시 유지되는 것은 아니다.**

다음 traveler2 변수를 통해 Traveler 인스턴스의 destination 프로퍼티를 변경한다. 이후 traveler2 변수의 강한 참조도 release 처리된다. 이 코드가 traveler2 변수의 마지막 사용 지점이므로 함수 블록의 끝까지 기다리지 않고 참조 카운트를 줄일 수 있다.

```swift
traveler2.destination = "Big Sur"
release
```

컴파일 시점에 retain, release 연산이 생성되고, 런타임에 그 연산이 실행되면서 객체의 참조 카운트가 변한다. 참조 카운트가 0이 되면 deinit이 실행된 뒤 객체의 메모리가 해제되지만, 마지막 사용 직후 항상 객체가 해제되는 것은 아니다. **객체의 초기화부터 마지막 사용 시점까지 최소 수명만 보장된다.** [ARC in Swift: Basics and beyond](https://developer.apple.com/videos/play/wwdc2021/10216/)에서는 앞서 살펴본 사례에 다음 설명을 덧붙인다.

- 참조 카운트가 0으로 떨어지면 객체는 메모리에서 해제될 수 있다.
- 스위프트에서 객체의 수명은 사용 시점을 기준으로 결정된다.
- 객체의 보장되는 최소 수명은 객체가 초기화되는 시점에 시작해서, 그 객체가 마지막으로 사용되는 시점에 끝난다.
- **하지만 실제 객체의 수명은 Swift 컴파일러가 삽입한 retain과 release 연산에 의해 결정된다.**
- **적용된 ARC 최적화에 따라 관찰되는 객체의 수명이 보장된 최소 수명보다 길어질 수 있다. 즉, 객체가 마지막 사용 시점 이후에도 살아 있을 수 있다.**

> Once the reference count drops to zero, the object can be deallocated. Object lifetimes in Swift are use-based. An object's guaranteed minimum lifetime begins at initialization and ends at last use. This is different from languages like C++, in which an object’s lifetime is guaranteed to end at the closing brace. In this example, we saw the object was deallocated immediately after the last use.<br/>
> ...<br/>
> However, in practice, object lifetimes are determined by the retain and release operations inserted by the Swift compiler. And depending on the ARC optimizations that kick in, the observed object lifetimes may differ from their guaranteed minimum, ending beyond the last use of the object. In such cases, the object is deallocated at a program point beyond its last use.

마지막 사용 시점은 해제가 가능해지는 기준일 뿐, release 연산이 반드시 실행되는 위치는 아니다. 실제로 위 코드의 컴파일 결과를 중간 표현인 SIL(Swift Intermediate Language)로 출력하면 컴파일러가 만든 release 연산이 코드 블록의 끝에 몰려 있는 것을 확인할 수 있다.

```
$ swiftc -emit-sil -Onone action-in-blog.swift
```

연산이 추가된 위치는 앞선 설명과 조금 다르지만, retain 연산 1회와 release 연산 2회가 수행되는 것은 동일하다.

- `%20`는 Traveler 객체를 가리키는 SIL 값이다. traveler1과 traveler2의 debug_value가 모두 `%20`을 사용하므로 객체가 복사된 것이 아니라 같은 객체에 대한 강한 참조가 하나 늘어난 것을 볼 수 있다.
- `%20`에 대한 strong_retain 연산은 1회, strong_release 연산은 2회 수행된다.

```
// closure #1 in static $s4main0026actioninblogswift_pkFCfcayfMX33_0_33_BCF0FC9F294D000A752CCC1521A6FDF4Ll10PlaygroundfMf_24PlaygroundEntryContainerfMu_.$s4main0026actioninblogswift_pkFCfcayfMX33_0_33_BCF0FC9F294D000A752CCC1521A6FDF4Ll10PlaygroundfMf_15PlaygroundEntryfMu_@Sendable ()
// Isolation: global_actor. type: MainActor
sil private @$s4main128$s4main0026actioninblogswift_pkFCfcayfMX33_0_33_BCF0FC9F294D000A752CCC1521A6FDF4Ll10PlaygroundfMf_24PlaygroundEntryContainerfMu_01_fghijklM0LLO0b1_cde6_0_33_fghijklmnop3_15q6EntryfT1_yyYaYbKFZyyYaYbScMYcXEfU_ : $@convention(thin) @Sendable @async () -> @error any Error {
bb0:
  ... 
  
  %20 = apply %19(%17, %18, %11) : $@convention(method) (@owned String, @owned Optional<String>, @thick Traveler.Type) -> @owned Traveler // users: %66, %65, %31, %23, %22, %21
  debug_value %20, let, name "traveler1"          // id: %21
  strong_retain %20                               // id: %22
  debug_value %20, let, name "traveler2"          // id: %23
  %24 = string_literal utf8 "Big Sur"             // user: %29
  
  ...

  release_value %59                               // id: %62
  release_value %57                               // id: %63
  release_value %55                               // id: %64
  strong_release %20                              // id: %65
  strong_release %20                              // id: %66
  %67 = tuple ()                                  // user: %68
  return %67                                      // id: %68
} // end sil function '$s4main128$s4main0026actioninblogswift_pkFCfcayfMX33_0_33_BCF0FC9F294D000A752CCC1521A6FDF4Ll10PlaygroundfMf_24PlaygroundEntryContainerfMu_01_fghijklM0LLO0b1_cde6_0_33_fghijklmnop3_15q6EntryfT1_yyYaYbKFZyyYaYbScMYcXEfU_'
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-10-13-swift-automatic-reference-counting>

#### REFERENCE

- <https://developer.apple.com/videos/play/wwdc2021/10216/>
- <https://www.swift.org/documentation/swift-compiler>
- <https://docs.swift.org/latest/documentation/the-swift-programming-language/automaticreferencecounting/>
- <https://docs.swift.org/latest/documentation/the-swift-programming-language/automaticreferencecounting/#Strong-Reference-Cycles-Between-Class-Instances>
- <https://velog.io/@knr9144/ARC>
- <https://velog.io/@knr9144/Swift-ARC2-%EA%B0%95%ED%95%9C%EC%B0%B8%EC%A1%B0%EC%8B%B8%EC%9D%B4%ED%81%B4-Strong-Reference-Cycle>

[reference-counting-gc-in-javascript-link]: https://junhyunny.github.io/information/javascript/reference-counting-gc-in-javascript/
[struct-and-class-in-swift-link]: https://junhyunny.github.io/swift/struct-and-class-in-swift/
[swift-strong-reference-weak-reference-and-unowned-reference-link]: https://junhyunny.github.io/swift/swift-ui/strong-reference/weak-reference/garbage-collecting/swift-strong-reference-weak-reference-and-unowned-reference/
