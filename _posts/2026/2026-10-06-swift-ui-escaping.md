---
title: "SwiftUI @escaping 클로저(closure)"
search: false
category:
  - swift
  - swift-ui
  - escaping
last_modified_at: 2026-10-11T04:11:25+09:00
---

<br/>

## 1. SwiftUI @escaping 키워드

함수에 전달한 클로저는 기본적으로 함수 안에서 사용된다. 하지만 함수가 클로저를 저장해 두면 함수가 종료된 뒤에도 호출할 수 있다. 글로만 설명하면 어려울 수 있으니 예제 코드를 함께 살펴보자. 먼저 @escaping 키워드가 필요 없는 경우다. 아래 performNow() 함수는 클로저를 파라미터로 전달받아 함수 안에서 호출한다. 함수가 끝나면 해당 클로저를 더 이상 사용하지 않는다.

```swift
func performNow(_ action: () -> Void) {
    action()
}

performNow { print("즉시 실행") }
```

다음은 @escaping 키워드가 필요한 예제다. DeferredActions 클래스는 함수 파라미터로 전달받은 클로저를 멤버 변수에 저장한다. fire() 함수를 통해 앞서 전달받은 클로저를 나중에 호출한다.

```swift
final class DeferredActions {
    private var action: (() -> Void)?

    func save(_ action: @escaping () -> Void) {
        self.action = action
    }

    func fire() { action?() }
    
    func clear() { action = nil }
}

let deferred = DeferredActions()
deferred.save { print("나중에 실행") }
print("deferred.save() 함수 호출 완료")
deferred.fire()
```

위 코드를 실행하면 다음과 같은 로그를 확인할 수 있다.

- save() 함수가 먼저 실행되지만, '나중에 실행'이라는 로그는 'deferred.save() 함수 호출 완료'라는 로그 뒤에 출력된다.

```
deferred.save() 함수 호출 완료
나중에 실행
```

## 2. @escaping 키워드가 필요한 이유

위 DeferredActions 클래스의 예시에서 본 것처럼 클로저 파라미터를 멤버 변수에 저장하면 실행 시점을 나중으로 미룰 수 있다. 클로저가 함수 종료 후에도 호출될 수 있다면 @escaping 키워드로 이를 명시해야 한다. **@escaping 키워드는 클로저의 수명에 관한 선언**이다. 클로저를 프로퍼티에 저장하거나 비동기 작업의 완료 핸들러(completion handler)로 넘기면 함수의 생명 주기보다 오래 살아남을 수 있다. 따라서 스위프트 컴파일러는 @escaping 표시를 요구한다.

필요한 곳에 @escaping 키워드를 붙이지 않으면 다음과 같은 컴파일 오류가 발생한다.

```
Assigning non-escaping parameter 'action' to an '@escaping' closure
```

클로저가 함수의 실행 범위를 벗어나는지 구분하면 어떤 이점이 있을까? 다음과 같이 정리할 수 있다.

- non-escaping 클로저에 적용할 수 있는 컴파일러의 메모리 및 성능 최적화
- 개발자가 의도하지 않게 클로저를 저장하는 실수를 방지하는 컴파일 검사

**컴파일러의 메모리 및 성능 최적화와 관련된 내용부터 살펴보자.** 스위프트는 @escaping이 붙지 않은 클로저 파라미터를 non-escaping으로 취급한다. 이 경우 전달된 클로저가 함수 종료 후까지 살아남지 않는다는 보장이 있으므로 컴파일러가 더 적극적으로 최적화할 수 있다.

공식 문서에 따르면 non-escaping 클로저는 함수 호출이 끝난 뒤까지 살아남지 않으므로 스위프트 컴파일러가 캡처된 지역 변수의 저장 공간을 더 단순하게 다룰 수 있다. 경우에 따라 힙 할당이나 reference-counted 박스를 피하고, 일부 메모리 접근 안전성 검사를 컴파일 시점에 수행할 수 있다.

> A non-escaping closure can capture a var or inout by simply capturing the memory address of the storage location. This is safe, because a non-escaping closure cannot outlive the dynamic extent of the storage location

반면, @escaping 키워드가 붙은 클로저는 함수가 끝난 뒤에도 살아남을 수 있다. 따라서 캡처한 지역 변수를 더 오래 유지하도록 힙 영역의 별도 저장 공간으로 옮겨 관리해야 할 수 있다.

> An @escaping closure can also capture a var, which requires promoting the var to a heap-allocated box with a reference count, with all variable accesses indirecting through the box.

**개발자가 의도치 않게 클로저를 저장하는 것을 방지한다.** 개발자는 API만 봐도 클로저의 생명 주기를 알 수 있다. 예를 들어 아래 함수의 클로저 파라미터는 함수 실행 중에만 사용된다.

```swift
func foo(handler: () -> Void)
```

반면, 아래 함수의 핸들러는 함수가 끝난 뒤에도 실행될 수 있다.

```swift
func foo(handler: @escaping () -> Void)
```

@escaping 키워드를 사용하면 개발자에게 클로저 파라미터의 수명(lifetime)에 관한 계약을 명확히 전달할 수 있다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-10-06-swit-ui-escaping>

#### REFERENCE

- <https://docs.swift.org/latest/documentation/the-swift-programming-language/closures/#Escaping-Closures>
- <https://download.swift.org/docs/assets/generics.pdf>
