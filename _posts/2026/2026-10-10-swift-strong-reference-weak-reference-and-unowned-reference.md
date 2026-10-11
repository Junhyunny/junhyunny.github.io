---
title: "스위프트(Swift) 강한 참조, 약한 참조 그리고 미소유 참조"
search: false
category:
  - swift
  - swift-ui
  - strong-reference
  - weak-reference
  - garbage-collecting
last_modified_at: 2026-10-11T12:40:01+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [가비지 컬렉션(Garbage Collection) 참조 카운팅(Reference Counting) 알고리즘][reference-counting-gc-in-javascript-link]
- [스위프트 구조체와 클래스(Swift struct and class)][struct-and-class-in-swift-link]

## 0. 들어가면서

스위프트(Swift)를 사용하다 보니 종종 `weak`라는 키워드가 보였다. 이전에 쓰던 언어에서는 접하지 못한 문법이라 처음에는 어색했다. 이 키워드는 어떤 개념일까? 스위프트를 좀 더 깊이 이해하기 위해 글로 정리해 봤다.

## 1. 참조 카운팅 (Reference Counting)

스위프트는 ARC(Automatic Reference Counting)를 통해 클래스 객체의 생명 주기를 관리한다. ARC의 개념은 다음 글에서 정리할 생각이다. 중요한 점은 [객체 참조 카운팅][reference-counting-gc-in-javascript-link]이라는 메커니즘을 통해 객체를 메모리에서 해제한다는 사실이다. 이 글의 주제인 강한 참조와 약한 참조를 이해하기 위해 먼저 참조 카운팅을 살펴보자.

스위프트에서 class 키워드로 정의한 클래스는 참조 타입(reference type)이다. 변수에는 객체를 가리키는 참조가 저장된다. 손가락으로 어떤 물건을 가리킨다고 생각하면 이해하기 쉽다. 간단한 예제 코드를 살펴보자.

- first 변수와 second 변수가 동일한 객체를 가리키고 있다.
- first 변수를 통해 변경한 객체의 상태는 second 변수에서도 확인할 수 있다.

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

참조 카운팅은 객체를 강하게 참조하는 참조의 수를 세는 방식이다. 위 예제 코드에서 Box 객체의 참조 카운트(RC)는 아래 그림처럼 변한다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/swift-strong-reference-weak-reference-and-unowned-reference-01.png" width="100%" class="image__border">
</div>

<br/>

스위프트의 클래스 인스턴스를 더 이상 강하게 참조하는 곳이 없으면 해당 객체는 ARC에 의해 해제된다. 객체가 해제되는지는 deinit 호출을 통해 확인할 수 있다. 아래 코드를 실행해 보자.

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

코드를 실행하면 다음과 같은 로그가 출력된다.

- second 변수의 참조가 사라지면 Person("Junhyunny") 객체가 해제된다.

```
first 변수 해제
second 변수 해제
Junhyunny 해제
```

## 2. 강한 참조, 약한 참조 그리고 미소유 참조

스위프트에는 크게 세 가지 참조 방식이 있다.

- 강한 참조(strong reference)
- 약한 참조(weak reference)
- 미소유 참조(unowned reference)

앞서 말한 것처럼 스위프트는 ARC를 통해 클래스 인스턴스의 메모리를 관리하는데, 참조 방식에 따라 참조 카운트 증가 여부와 객체의 생명 주기에 미치는 영향이 달라진다. 먼저 강한 참조에 대해 살펴보자.

강한 참조는 가장 기본적인 참조 방식이다. 객체를 강하게 참조하면 해당 객체의 참조 카운트가 증가한다. 강한 참조가 하나라도 남은 객체는 해제(release)되지 않는다. 별다른 키워드 없이 클래스 인스턴스를 참조하면 기본적으로 강한 참조가 된다. 인스턴스가 서로를 강하게 참조하면 순환 참조(reference cycle)가 생길 수 있다. 아래 예제 코드를 살펴보자.

- Parent 인스턴스의 child 프로퍼티를 통해 Child 인스턴스를 참조한다.
- Child 인스턴스의 parent 프로퍼티를 통해 Parent 인스턴스를 참조한다.

```swift
final class Parent {
    var child: Child?
    deinit { print("Parent 해제") }
}

final class Child {
    var parent: Parent?
    deinit { print("Child 해제") }
}

var parent: Parent? = Parent()
var child: Child? = Child()
print("부모에게 자식을 할당")
parent?.child = child
print("자식에게 부모를 할당")
child?.parent = parent
print("parent 변수 참조 해제")
parent = nil
print("child 변수 참조 해제")
child = nil  // 두 deinit 모두 호출되지 않는다
```

위 코드에서는 Parent와 Child 인스턴스의 프로퍼티를 통해 순환 참조가 만들어진다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/swift-strong-reference-weak-reference-and-unowned-reference-02.png" width="100%" class="image__border">
</div>

<br/>

로그를 살펴보면 두 객체의 deinit이 호출되지 않았음을 알 수 있다. ARC는 다른 참조 카운팅 방식과 마찬가지로 순환 참조를 식별하지 못하기 때문에 두 객체는 계속 메모리에 남는다.

- Parent와 Child 객체의 deinit이 호출되지 않는다.

```
부모에게 자식을 할당
자식에게 부모를 할당
parent 변수 참조 해제
child 변수 참조 해제
```

객체를 해제하려면 순환 참조에 포함된 강한 참조 하나를 약한 참조(weak reference)로 변경해야 한다. 약한 참조는 대상의 참조 카운트를 늘리지 않는다. 약한 참조가 가리키던 대상이 해제되면 참조는 자동으로 `nil`이 된다. 값이 `nil`이 될 수 있으므로 weak 키워드가 붙은 프로퍼티는 옵셔널(optional)이어야 한다. 예제 코드로 객체가 해제되는지 살펴보자.

- 이전 예제에서 Child 클래스의 parent 프로퍼티를 약한 참조로 바꿨다.

```swift
final class Parent {
    var child: Child?
    deinit { print("Parent 해제") }
}

final class Child {
    weak var parent: Parent?
    deinit { print("Child 해제") }
}

var parent: Parent? = Parent()
var child: Child? = Child()
print("부모에게 자식을 할당")
parent?.child = child
print("자식에게 부모를 할당")
child?.parent = parent
print("parent 변수 참조 해제")
parent = nil
print("child 변수 참조 해제")
child = nil
```

위 코드를 실행하면 다음과 같은 로그를 볼 수 있다.

- parent 변수의 참조를 해제하면 Parent 객체가 해제된다.
- child 변수의 참조를 해제하면 Child 객체가 해제된다.

```
부모에게 자식을 할당
자식에게 부모를 할당
parent 변수 참조 해제
Parent 해제
child 변수 참조 해제
Child 해제
```

그림으로 참조 카운팅을 살펴보면 더 이해하기 쉽다.

- Child 객체의 parent 프로퍼티는 약한 참조이므로 Parent 인스턴스의 참조 카운트는 1로 유지된다.
- parent 로컬 변수의 강한 참조만 참조 카운트에 포함되므로 해당 변수가 참조를 잃으면 Parent 객체는 해제된다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/swift-strong-reference-weak-reference-and-unowned-reference-03.png" width="100%" class="image__border">
</div>

<br/>

**미소유 참조는 약한 참조처럼 참조 카운트를 올리지 않는다.** 약한 참조와 달리 가리키던 대상이 해제되어도 자동으로 `nil`이 되지 않는다. 따라서 옵셔널이 강제되지 않는다. 다만 참조 대상이 해제된 뒤 접근하면 런타임 오류가 발생할 수 있다. 참조 대상이 미소유 참조를 사용하는 객체보다 오래 살아 있음을 보장할 수 있을 때 사용하는 것이 좋다. 간단한 예제를 살펴보자.

- Child 인스턴스의 parent 프로퍼티는 미소유 참조이기 때문에 옵셔널이 강제되지 않는다.

```swift
final class Parent {
    var child: Child?
    var name: String = "Parent"
    deinit { print("Parent 해제") }
}

final class Child {
    unowned var parent: Parent
    init(parent: Parent) {
        self.parent = parent
    }
    deinit { print("Child 해제") }
}

var parent: Parent? = Parent()
var child: Child? = Child(parent: parent!)
print("parent 변수 참조 해제")
parent = nil  // Parent 인스턴스 해제
print(child?.parent.name ?? "")  // 앱 크래쉬(crash) 발생
```

위 코드를 실행하면 앱 크래시(crash)가 발생해 앱이 종료된다.

- Child 인스턴스의 parent 프로퍼티는 미소유 참조이기 때문에 참조 카운팅이 늘어나지 않는다.
- parent 로컬 변수의 참조를 잃는 순간 Parent 인스턴스가 해제된다.
- 이후 Child 인스턴스의 parent 프로퍼티를 통해 해제된 객체에 접근하면 앱 크래시가 발생한다.

참조 대상이 먼저 해제될 수 있다면 약한 참조를 사용하는 것이 안전하다. 위에서 살펴본 세 가지 참조 방식을 비교하면 다음과 같다.

| 구분 | Strong | Weak | Unowned |
|---|---|---|---|
| 강한 참조 카운트 증가 | O | X | X |
| 객체 생명 주기 유지 | O | X | X |
| 대상 해제 시 자동 nil | X | O | X |
| 일반적인 Optional 사용 | 선택 | 필수 | 선택 |
| 해제된 객체 접근 | 강한 참조가 유지되는 동안 해제되지 않음 | nil 반환 | 런타임 오류 |
| 대표적인 사용 사례 | 일반적인 객체 참조 | Delegate, 부모-자식 역참조 | 생명 주기가 보장된 역참조 |

## 3. 클로저(closure)의 인스턴스 참조

순환 참조는 객체의 프로퍼티 사이에서만 생기지 않는다. 클로저는 기본적으로 캡처한 클래스 인스턴스를 강하게 참조한다. 인스턴스가 클로저를 프로퍼티에 저장하고, 클로저가 다시 해당 인스턴스의 self를 캡처하면 순환 참조가 생긴다. 간단한 예제 코드를 살펴보자.

- Button 클래스의 onTap 프로퍼티는 전달받은 클로저를 강하게 참조한다.
- ViewController 객체는 Button 객체를 소유하고, Button 객체의 onTap 프로퍼티에 self를 캡처한 클로저를 할당한다.

```swift
class Button {
    var onTap: (() -> Void)?

    func tap() {
        onTap?()
    }

    deinit {
        print("Button deinit")
    }
}

class ViewController {
    let button = Button()

    func setup() {
        button.onTap = {
            self.handleTap()
        }
    }

    func handleTap() {
        print("Button tapped")
    }

    deinit {
        print("ViewController deinit")
    }
}
```

이제 Button과 ViewController 객체를 생성해 사용해 보자.

- vc 로컬 변수로 ViewController 객체를 참조한다.
- ViewController 객체를 사용한 뒤 vc 로컬 변수의 참조를 해제한다.

```swift
var vc: ViewController? = ViewController()
vc?.setup()
vc?.button.tap()
print("vc 변수 참조 정리")
vc = nil
```

위 코드를 실행하면 다음과 같은 로그를 볼 수 있다.

- Button, ViewController 클래스의 deinit 함수가 호출되지 않는다.

```
Button tapped
vc 변수 참조 정리
```

이 경우에도 클로저에서 self를 약하게 참조하면 문제를 해결할 수 있다. Button 객체의 onTap 프로퍼티에 설정할 클로저의 캡처 리스트(capture list)에 `[weak self]`를 추가해 self를 약하게 참조하도록 만든다.

```swift
func setup() {
    button.onTap = { [weak self] in
        self?.handleTap()
    }
}
```

클로저가 self를 약하게 참조하므로 순환 참조 문제가 해결된다.

- Button, ViewController 클래스의 deinit 함수가 정상적으로 호출된다.

```
Button tapped
vc 변수 참조 정리
ViewController deinit
Button deinit
```

## CLOSING

이번 글에서 살펴본 사례 외에도 다양한 상황에서 순환 참조 문제가 발생할 수 있다.

- 델리게이트(delegate)나 싱글톤(singleton) 객체가 다른 객체와 서로 강하게 참조하는 경우
- 컬렉션에 저장된 인스턴스가 그 컬렉션을 소유한 객체를 다시 강하게 참조하는 경우

메모리 누수는 치명적일 수 있으므로 코드를 작성할 때 객체의 참조 관계에 신경 써야 한다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-10-10-swift-strong-reference-weak-reference-and-unowned-reference>

#### RECOMMEND NEXT POSTS

- <https://developer.apple.com/videos/play/wwdc2021/10216/>
- <https://docs.swift.org/latest/documentation/the-swift-programming-language/automaticreferencecounting/>
- <https://docs.swift.org/latest/documentation/the-swift-programming-language/automaticreferencecounting/#Strong-Reference-Cycles-for-Closures>
- <https://www.swift.org/documentation/swift-compiler>
- <https://velog.io/@knr9144/ARC>
- <https://velog.io/@knr9144/Swift-ARC2-%EA%B0%95%ED%95%9C%EC%B0%B8%EC%A1%B0%EC%8B%B8%EC%9D%B4%ED%81%B4-Strong-Reference-Cycle>

#### REFERENCE

- <https://docs.swift.org/latest/documentation/the-swift-programming-language/automaticreferencecounting/#Strong-Reference-Cycles-Between-Class-Instances>

[reference-counting-gc-in-javascript-link]: https://junhyunny.github.io/information/javascript/reference-counting-gc-in-javascript/
[struct-and-class-in-swift-link]: https://junhyunny.github.io/swift/struct-and-class-in-swift/
