---
title: "SwiftUI 바디(body) 재평가 원리 - Identity, Lifetime, Dependencies"
search: false
category:
  - swift
  - swift-ui
  - view
  - lifecycle
last_modified_at: 2026-10-15T16:07:53+09:00
---

<br/>

## 0. 들어가면서

[Demystify SwiftUI](https://developer.apple.com/videos/play/wwdc2021/10022/) 영상을 보고 배운 내용을 정리했다.

## 1. Core concepts

SwiftUI의 바디(body) 재평가 원리를 이해하려면 다음과 같은 세 가지 핵심 개념을 알아야 한다.

- 정체성 (Identity) - SwiftUI가 뷰(View)를 구별하는 기준
- 생명주기 (Lifetime) - 뷰의 정체성이 유지되는 기간
- 의존성 (Dependencies) - 뷰가 어떤 데이터에 의존하는지에 관한 관계

SwiftUI는 위 개념을 바탕으로 언제, 무엇을, 어떻게 업데이트해야 할지 판단한다. 이 세 가지 개념은 서로 연결되어 SwiftUI의 업데이트 과정을 결정한다.

```
Identity
   │
   │ View가 같은 존재인지 판단
   ▼
Lifetime
   │
   │ View의 State가 유지되는 기간 결정
   ▼
Dependencies
   │
   │ 변경된 데이터와 연결된 View를 파악
   ▼
body 재평가
   │
   ▼
필요한 UI 업데이트
```

지금부터 위 흐름을 조금 더 자세히 들여다보자.

## 2. 정체성 (Identity)

먼저 정체성부터 살펴보자. SwiftUI는 뷰를 구별할 때 두 가지 방법을 사용한다.

- 명시적 정체성 (Explicit Identity)
- 구조적 정체성 (Structural Identity)

명시적 정체성은 개발자가 직접 ID를 부여하는 방식이다. Identifiable 프로토콜을 채택하면 Hashable 프로토콜을 준수하는 id 프로퍼티를 제공해야 한다. 개발자는 `user.id`를 통해 각 뷰에 명시적 정체성을 부여할 수 있다. SwiftUI는 users 배열의 순서가 바뀌더라도 `user.id` 값이 같으면 기존 뷰가 이동한 것으로 판단할 수 있다.

```swift
struct User: Identifiable {
    let id: UUID
    let name: String
}

struct UserListView: View {
    let users: [User]

    var body: some View {
        ForEach(users) { user in
            Text(user.name)
        }
    }
}
```

Identifiable 프로토콜은 명시적 정체성을 설정하는 방법 중 하나다. 대표적인 방법은 다음과 같다.

- Identifiable 프로토콜
- ForEach 함수의 id 파라미터
- .id() 모디파이어(modifier)

구조적 정체성은 개발자가 ID를 지정하지 않아도 SwiftUI가 뷰 타입과 계층 내 위치를 이용해 정체성을 판단하는 방식이다. 간단한 예시를 살펴보자.

```swift
struct HomeView: View {
    var body: some View {
        Text("Home View")
    }
}

struct LoginView: View {
    var body: some View {
        Text("Login View")
    }
}

struct ContentView: View {
    @State var isLoggedIn: Bool = false

    var body: some View {
        VStack {
            if isLoggedIn {
                HomeView()
            } else {
                LoginView()
            }
            Button(action: {
                isLoggedIn.toggle()
            }) {
                Text("toggle")
            }
        }
    }
}
```

SwiftUI는 위 코드에서 HomeView와 LoginView를 서로 다른 조건 분기에 있는 뷰로 판단한다. 따라서 두 뷰는 서로 다른 정체성을 가지며, 조건이 바뀌면 뷰가 교체된다.

```
ExampleView
    │
    └── ConditionalContent
            │
            ├── true  → HomeView
            │
            └── false → LoginView
```

## 3. 생명주기 (Lifetime)

다음으로 뷰의 생명주기를 살펴보자. 뷰는 struct로 정의하지만, SwiftUI 뷰의 생명주기는 struct 값의 수명과 다르다. SwiftUI가 관리하는 뷰의 생명주기는 뷰 아이덴티티(identity)가 유지되는 기간을 의미한다. 이를 이해하려면 다음 세 가지 개념을 구분해야 한다.

- 뷰 밸류 (view value): 스위프트 struct로 만들어진 일시적인 값
- 뷰 아이덴티티 (view identity): 뷰를 동일한 논리적 요소로 식별하는 기준
- 뷰 생명주기 (view lifetime): 해당 뷰 아이덴티티가 유지되는 기간

예시 코드로 각 개념을 살펴보자. 다음과 같은 뷰 구조체가 있다.

```swift
struct CounterView: View {
    let count: Int

    var body: some View {
        Text("Count: \(count)")
    }
}
```

다음과 같이 세 개의 서로 다른 struct 값을 만들 수 있다. 각 값은 독립적이다.

```swift
let view1 = CounterView(count: 0)
let view2 = CounterView(count: 1)
let view3 = CounterView(count: 2)
```

여기까지는 일반적인 스위프트 구조체와 다르지 않다. 하지만 이 뷰를 SwiftUI 뷰 계층에서 사용하면 차이가 생긴다. CounterView를 뷰 계층에 추가해보자.

```swift
struct ContentView: View {
    @State private var count = 0

    var body: some View {
        VStack {
            CounterView(count: count)

            Button("Increment") {
                count += 1
            }
        }
    }
}
```

처음 body가 평가될 때 SwiftUI는 `CounterView(count: 0)`라는 뷰 밸류를 사용한다. 사용자가 버튼을 누르면 ContentView의 count 상태(state)가 1 증가한다. SwiftUI는 변경된 의존성을 바탕으로 `ContentView.body`를 다시 평가하고, 새로운 뷰 밸류인 `CounterView(count: 1)`를 사용한다.

새로운 CounterView struct 값이 만들어졌지만, SwiftUI는 이전과 현재의 CounterView를 논리적으로 같은 뷰로 판단한다. 이것이 뷰 아이덴티티의 역할이다.

- 시간이 흐르면서 상태가 바뀌면 뷰 밸류도 변경된다.
- 뷰 밸류는 일반적인 구조체 값처럼 생성되고 사용되며, 더 이상 필요하지 않으면 수명이 끝난다.
- SwiftUI는 여러 뷰 밸류를 동일한 아이덴티티로 연결한다.

```
시간 ─────────────────────────────────────▶

T1                 T2                 T3
│                  │                  │
▼                  ▼                  ▼

View Value A     View Value B      View Value C
 count = 0        count = 1         count = 2
     │                │                 │
     │                │                 │
     └────────────────┼─────────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │                       │
          │    View Identity A    │
          │                       │
          │   동일한 논리적 View   │
          │                       │
          └───────────────────────┘
```

여러 뷰 밸류를 하나의 뷰 아이덴티티로 연결하는 중요한 이유 중 하나는 **상태를 유지**하기 위해서다. 뷰는 struct이므로 새로운 값을 만들 때 저장 프로퍼티도 초기화된다. 그렇다면 body가 재평가되거나 뷰 밸류가 새로 만들어질 때마다 `@State`의 count 값도 0으로 초기화되지 않을까? 실제로 `@State`의 저장소는 특정 뷰 밸류가 아니라 SwiftUI가 관리하는 뷰 아이덴티티에 연결되어 있어 상태가 유지된다.

```
      SwiftUI
         │
         ▼
┌─────────────────┐
│  View Identity  │
│        A        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  State Storage  │
│                 │
│    count = 5    │
└─────────────────┘
```

뷰의 생명주기는 언제 끝날까? 해당 뷰 아이덴티티가 더 이상 유지되지 않을 때 끝난다. 대표적으로 두 가지 경우가 있다.

- 뷰 계층에서 제거되는 경우
- 명시적 아이덴티티가 변경되는 경우

뷰 계층에서 제거되는 경우를 살펴보자. 다음 예제는 isVisible 플래그로 CounterView의 표시 여부를 제어한다. isVisible 값이 거짓이 되어 뷰 계층에서 제거되면 CounterView의 아이덴티티도 함께 정리된다. 이후 isVisible 값이 참(true)이 되면 CounterView의 새로운 생명주기가 시작되고 count 상태가 0으로 초기화된다.

```swift
struct CounterView: View {
    @State var count: Int = 0

    var body: some View {
        VStack {
            Text("Count: \(count)")
            Button("Increase") {
                count = count + 1
            }
        }
    }
}

struct ParentView: View {
    @State private var isVisible = true

    var body: some View {
        VStack {
            if isVisible {
                CounterView()
            }
            Button("Toggle") {
                isVisible.toggle()
            }
        }
    }
}
```

이번에는 뷰를 제거하지 않고 아이덴티티만 변경해보자. `.id` 모디파이어를 사용하면 된다. 버튼을 눌러 CounterView의 아이덴티티를 변경한다. counterID 값이 증가하면 이전 CounterView의 생명주기는 끝나고 새로운 생명주기가 시작된다. 이에 따라 count 상태는 0으로 초기화된다.

```swift
struct ParentView: View {
    @State private var counterID = 0

    var body: some View {
        VStack {
            CounterView()
                .id(counterID)

            Button("Change Identity") {
                counterID += 1
            }
        }
    }
}
```

지금까지 살펴본 생명주기 관련 개념 세 가지를 하나의 그림으로 정리해보자.

```
시간 ────────────────────────────────────────────▶

① View Value의 수명

    [Value A]    [Value B]    [Value C]    [Value D]
        │            │            │            │
        ▼            ▼            ▼            ▼
      생성          생성          생성          생성
      사용          사용          사용          사용
      종료          종료          종료          종료


② View Identity의 Lifetime

    ┌─────────────────────────────────────────────┐
    │                                             │
    │                Identity A                   │
    │                                             │
    └─────────────────────────────────────────────┘
       ▲                                         ▲
       │                                         │
   Lifetime 시작                            Lifetime 종료


③ State의 유지 기간

    ┌─────────────────────────────────────────────┐
    │                                             │
    │              @State Storage                 │
    │                                             │
    │    count = 0 → 1 → 2 → 3 → 4                │
    │                                             │
    └─────────────────────────────────────────────┘
```

## 4. 의존성 (Dependencies)

의존성은 SwiftUI가 body를 언제 재평가하는지와 관련이 있다. 먼저 body 재평가와 화면 업데이트를 구분해야 한다. body가 다시 평가되더라도 화면 전체가 다시 그려지는 것은 아니다.

- 뷰 밸류 생성: 새로운 뷰 구조체 값이 만들어지는 것
- body 재평가: body를 다시 계산해서 뷰 계층을 기술하는 값을 만드는 것
- UI 업데이트: SwiftUI가 실제 화면에 변경을 반영하는 것

SwiftUI는 뷰가 사용하는 데이터를 의존성으로 관리한다.

- count 프로퍼티는 CounterView 뷰가 사용하는 상태 데이터다.

```swift
struct CounterView: View {
    @State private var count = 0

    var body: some View {
        VStack {
            Text("\(count)")

            Button("Increment") {
                count += 1
            }
        }
    }
}
```

위 코드에서 count 프로퍼티가 변경되면 다음과 같은 흐름이 이어진다.

```
사용자가 버튼 클릭
        │
        ▼
count 변경
        │
        ▼
관련 의존성 변경 감지
        │
        ▼
CounterView 무효화
        │
        ▼
body 재평가
        │
        ▼
새로운 View 계층 값 생성
        │
        ▼
SwiftUI가 필요한 UI 변경 적용
```

위와 같은 흐름은 어떻게 만들어질까? SwiftUI는 뷰가 어떤 데이터에 의존하는지, 데이터가 변경되면 어떤 뷰에 영향을 주는지 판단하기 위해 **의존성 그래프(dependency graph)**를 만든다. 의존성 그래프는 뷰 계층(view hierarchy), 상태, 관찰되는 데이터 사이의 관계를 바탕으로 SwiftUI가 내부적으로 관리하는 그래프다.

SwiftUI는 다음과 같은 프로퍼티 래퍼(property wrapper)나 매크로(macro)를 비롯한 여러 메커니즘을 통해 데이터와 뷰 사이의 의존성을 그래프로 만들어 관리한다.

- @State 프로퍼티 래퍼
- @Binding 프로퍼티 래퍼
- @Environment 프로퍼티 래퍼
- @Observable 매크로

의존성이 추적되는 방식은 다음과 같다.

- 뷰의 body를 평가할 때 관찰 가능한 프로퍼티를 읽으면 의존성이 형성된다. 모든 프로퍼티가 대상이 되는 것은 아니다.
- 의존성 객체를 전달받기만 해서는 해당 객체의 모든 프로퍼티에 대한 의존성이 생기지 않는다. 실제로 읽은 프로퍼티를 기준으로 의존성을 추적한다.
- 조건문 등에 의해 실행되지 않은 분기에서 프로퍼티를 읽는 코드는 의존성을 형성하지 않는다.
- 계산 프로퍼티를 통해 간접적으로 읽은 데이터의 의존성도 추적할 수 있다.

간단한 예시를 살펴보자. SwiftUI의 Observation 시스템은 body를 평가하면서 Observable 객체의 어떤 프로퍼티를 읽었는지 추적할 수 있다. 다음과 같은 Observable 클래스가 있다.

```swift
@Observable
class UserModel {
    var name = "Alice"
    var age = 25
}
```

UserModel 인스턴스의 각 프로퍼티를 사용하는 뷰를 생성해보자. body 재평가 여부를 확인하기 위해 로그를 남긴다.

- UserNameView 뷰는 name 프로퍼티를 사용한다.
- UserAgeView 뷰는 age 프로퍼티를 사용한다.

```swift
struct UserNameView: View {
    let user: UserModel

    var body: some View {
        let _ = print("UserNameView body re-evaluated")
        Text(user.name)
    }
}

struct UserAgeView: View {
    let user: UserModel

    var body: some View {
        let _ = print("UserAgeView body re-evaluated")
        Text("\(user.age)")
    }
}
```

앞에서 정의한 두 뷰를 사용하는 뷰를 만든다. 두 버튼으로 UserModel 인스턴스의 이름과 나이를 변경할 수 있다.

- Change Name 버튼: 이름 뒤에 느낌표(!)를 덧붙인다.
- Increase Age 버튼: 나이를 1씩 증가시킨다.

```swift
struct DependencyGraph: View {
    var userModel = UserModel()

    var body: some View {
        VStack {
            UserNameView(user: userModel)
            UserAgeView(user: userModel)
            Button(action: {
                userModel.name = userModel.name + "!"
            }) {
                Text("Change Name")
            }
            Button(action: {
                userModel.age += 1
            }) {
                Text("Increase Age")
            }
        }
    }
}
```

DependencyGraph.body와 각 자식 뷰의 body가 평가되면서 다음과 같은 의존성 그래프가 생성된다. 이 그래프를 통해 어떤 뷰가 어떤 프로퍼티의 영향을 받는지 파악할 수 있다.

```
         UserModel 인스턴스
                 │
       ┌─────────┴─────────┐
       │                   │
       ▼                   ▼
    name                 age
       │                   │
       ▼                   ▼
 UserNameView         UserAgeView
       │                   │
       ▼                   ▼
Text(user.name)       Text(user.age)
```

"Change Name" 버튼을 누르면 name 프로퍼티를 사용하는 UserNameView 뷰의 body만 재평가되는 것을 확인할 수 있다. age 프로퍼티만 읽는 UserAgeView 뷰는 이 변경으로 인해 무효화될 필요가 없다.

```
Click Change Name Button
UserNameView body re-evaluated
```

## CLOSING

`UIKit`에서는 `UIView`가 참조 타입인 클래스로 정의된다. 개발자는 뷰 인스턴스를 만든 뒤 프로퍼티를 직접 변경해 UI를 업데이트할 수 있다. 객체의 참조로 동일한 뷰인지 식별할 수 있으므로 객체의 생명주기 동안 화면의 상태를 관리할 수 있다.

SwiftUI에서는 뷰를 값 타입인 구조체로 정의하면서 이 글에서 살펴본 여러 가지 개념(identity, lifetime, dependencies)이 중요해졌다. 왜 이런 설계를 했을까? [SwiftUI Essentials](https://developer.apple.com/videos/play/wwdc2019/216/)에서는 다음과 같이 설명한다.

> Now we also saw that our Custom View is defined as a struct instead of a class. And this goes back to how views are defined declaratively in SwiftUI. In this case, that means our views are not persistent objects that we update over time using imperative event-based code. Instead, our views are defined declaratively as a function of their inputs.

애플은 SwiftUI는 선언형 UI 프레임워크로써 뷰는 특정 시점의 데이터 상태와 입력 값을 바탕으로 UI의 모습을 기술해야하기 때문에 시간이 지나면서 직접 수정하는 참조 타입의 객체가 아니라 입력 값에 따라 새로 값이 만들어지는 값 타입의 객체를 사용하는 것이 더 맞는 설계라고 판단한 것 같다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-10-15-swift-ui-identity-lifetime-dependencies>

#### REFERENCE

- <https://developer.apple.com/videos/play/wwdc2019/216/>
- <https://developer.apple.com/videos/play/wwdc2021/10022/>
- <https://developer.apple.com/documentation/xcode/understanding-and-improving-swiftui-performance>
- <https://developer.apple.com/documentation/swiftui/state>
- <https://developer.apple.com/documentation/observation/observable>
- <https://developer.apple.com/documentation/SwiftUI/Managing-model-data-in-your-app>
