---
title: "@ObservedObject and @StateObject in SwiftUI"
search: false
category:
  - iOS
  - swift-ui
last_modified_at: 2024-04-20T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [MVVM Pattern in SwiftUI][mvvm-pattern-in-ios-link]

## 0. 들어가면서

필자가 개발한 iOS 애플리케이션의 체크 박스(check box) 기능에 버그가 있었다. SwiftUI 프레임워크에 대해 이해도가 낮은 것이 문제였다. 이번 글은 필자가 모르는 부분에 대해 정리했다.

## 1. Annotations for subscribing object changes

SwiftUI 프레임워크는 [MVVM(Model-View-ViewModel)][mvvm-pattern-in-ios-link] 패턴을 기술적으로 지원한다. 뷰 컴포넌트는 뷰-모델 컴포넌트에게 상태 관리를 의존한다. 뷰-모델 컴포넌트는 상태 변경을 뷰에게 알릴 수 있도록 @Published 애너테이션을 사용한다. 

뷰 컴포넌트는 뷰-모델 객체를 선언할 때 @ObservedObject 혹은 @StateObject 애너테이션을 사용할 수 있다. 동작하는 모습은 동일한데 둘 사이엔 어떤 차이점이 있길래 구분하여 사용할까? 우선 공식 홈페이지 설명을 먼저 살펴보자.

### 1.1. @ObservedObject Annotation

iOS 13.0 이상부터 사용할 수 있다. 뷰 컴포넌트 안에 선언한 ObservableObject 인스턴스 필드 앞에 @ObservedObject 애너테이션을 추가한다. ObservableObject 인스턴스가 공개한(published) 상태가 변화할 때마다 화면을 다시 그리려면 이 애너테이션이 필드 앞에 붙어 있어야 한다.

공식 문서에서는 서브-뷰(subview)에게 StateObject 인스턴스를 전달할 때 사용한다고 정리되어 있다. 

> You typically do this to pass a StateObject into a subview.

예제 코드를 살펴보자. 

1. 부모 뷰 컴포넌트에서 ObservableObject 인스턴스를 사용한다. 
  - @StateObject 애너테이션을 추가해 데이터 변경에 대한 이벤트를 전달 받는다.
2. 자식 뷰 컴포넌트에게 ObservableObject 인스턴스를 전달한다.
3. 자식 뷰 컴포넌트는 부모로부터 ObservableObject 인스턴스를 전달 받는다.
  - @ObservedObject 애너테이션을 추가해 데이터 변경에 대한 이벤트를 전달 받는다.

```swift
class DataModel: ObservableObject {
    @Published var name = "Some Name"
    @Published var isEnabled = false
}

struct MyView: View {
    @StateObject private var model = DataModel() // 1

    var body: some View {
        Text(model.name)
        MySubView(model: model) // 2
    }
}

struct MySubView: View {
    @ObservedObject var model: DataModel // 3

    var body: some View {
        Toggle("Enabled", isOn: $model.isEnabled)
    }
}
```

### 1.2. @StateObject Annotation

iOS 14.0 이상부터 사용할 수 있다. @StateObject 애너테이션도 @ObservedObject 애너테이션과 동일하게 ObservableObject 인스턴스 필드 앞에 추가한다. 거의 동일하게 동작하지만, 일부 다른 점이 있다. 공식 홈페이지를 보면 다음과 같은 설명을 볼 수 있다.

> Use a state object as the single source of truth for a reference type that you store in a view hierarchy.

@StateObject 애너테이션은 뷰 계층에서 단일 진실 공급원(the single source of truth)로써 상태를 사용할 수 있게 만든다. SwiftUI 프레임워크는 상태 객체를 선언한 컨테이너의 생명 주기 동안 모델 인스턴스를 단 한번만 만든다. 화면의 입력(input) 값이 바뀌어 화면이 다시 그려지더라도 상태 객체를 새롭게 생성하지 않는다. 

예제 코드를 살펴보자.

1. 부모 뷰 컴포넌트에서 ObservableObject 인스턴스를 사용한다. 
  - @StateObject 애너테이션을 추가해 데이터 변경에 대한 이벤트를 전달 받는다.
2. environmentObject 함수를 통해 자식 뷰 컴포넌트에게 ObservableObject 인스턴스를 전달한다.
3. 자식 뷰 컴포넌트는 부모로부터 ObservableObject 인스턴스를 전달 받는다.
  - @EnvironmentObject 애너테이션을 추가해 데이터 변경에 대한 이벤트를 전달 받는다.

```swift
class DataModel: ObservableObject {
    @Published var name = "Some Name"
    @Published var isEnabled = false
}

struct MyView: View {
    @StateObject private var model = DataModel() // 1

    var body: some View {
        Text(model.name)
        MySubView()
            .environmentObject(model) // 2
    }
}

struct MySubView: View {
    @EnvironmentObject var model: DataModel // 3

    var body: some View {
        Toggle("Enabled", isOn: $model.isEnabled)
    }
}
```

## 2. Difference of behavior in implementation

필자는 예제 코드만으로 큰 차이점을 알 수 없었다. 두 설명에 차이가 있다면 @StateObject 애너테이션을 사용하면 `단일 진실 공급원(the single source of truth)`으로써 상태 객체를 선언한 컨테이너가 살아있는 동안 단 한번만 선언된다는 점이다. 이를 쉬운 말로 다시 표현하면 화면(뷰)의 상태가 변경되어 다시 그려질 때 상태가 초기화되지 않는다는 의미이다. 간단한 예제 코드로 둘 사이의 차이점을 살펴보자.

### 2.1. Hierarchy of View

예제 코드를 더 잘 이해할 수 있도록 화면 구조를 이미지로 먼저 살펴보자. 

- 회색 박스는 텍스트, 파란 박스는 버튼이다.
- ContentView가 부모 뷰 컴포넌트이며 자식 컴포넌트를 두 개 갖는다.
- ObservedClickCount 뷰 컴포넌트는 @ObservedObject 애너테이션을 사용한다.
- StateClickCount 뷰 컴포넌트는 @StateObject 애너테이션을 사용한다.
- 자식 컴포넌트의 `+` 버튼을 누르면 각 컴포넌트의 숫자가 증가한다.
- 부모 컴포넌트의 `change state` 버튼을 누르면 부모 컴포넌트의 플래그가 변경된다.

<p align="center">
  <img src="/images/posts/2024/state-object-vs-observed-object-01.png" width="40%" class="image__border">
</p>

### 2.2. ContentView View

부모 컴포넌트 코드를 먼저 살펴보자. 

1. 부모 컴포넌트에서 사용하는 간단한 상태 값이다.
2. 상태 값 변경이 발생하면 화면이 변경되는지 확인한다.
3. 버튼을 누르면 상태 값이 변경된다.
4. ObservedClickCount 자식 컴포넌트를 그린다.
4. StateClickCount 자식 컴포넌트를 그린다.

```swift
import SwiftUI

struct ContentView: View {
    
    @State var flag: Bool = false // 1

    var body: some View {
        VStack {
            VStack {
                Text("current flag state - \(flag)") // 2
                Button(action: { flag.toggle() }, label: { // 3
                    Text("change state")
                })
            }
            Divider().padding(.vertical, 20)
            VStack {
                Text("This case is @ObservedObject")
                ObservedClickCount() // 4
            }
            Divider().padding(.vertical, 20)
            VStack {
                Text("This case is @StateObject")
                StateClickCount() // 5
            }
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
```

### 2.3. ObservedClickCount View

@ObservedObject 애너테이션을 사용한 자식 뷰 컴포넌트는 다음과 같다.

1. 뷰-모델 객체를 선언할 때 @ObservedObject 애너테이션을 사용한다.
2. 화면에 카운트 상태 변경을 출력한다.
3. 버튼을 누르면 카운트가 증가한다.

```swift
import SwiftUI

struct ObservedClickCount: View {
    
    @ObservedObject var viewModel = ViewModel() // 1
    
    var body: some View {
        HStack {
            Text("\(viewModel.count)") // 2
            Button(action: {viewModel.increase()}, label: { // 3
                Text("+")
            })
        }
    }
}

extension ObservedClickCount {
    class ViewModel: ObservableObject {
        
        @Published var count: Int = 0
        
        func increase() {
            count += 1
        }
    }
}
```

### 2.4. StateClickCount View

@StateObject 애너테이션을 사용한 것 외에 코드는 크게 다르지 않다. 

1. 뷰-모델 객체를 선언할 때 @StateObject 애너테이션을 사용한다.
2. 화면에 카운트 상태 변경을 출력한다.
3. 버튼을 누르면 카운트가 증가한다.

```swift
import SwiftUI

struct StateClickCount: View {
    
    @StateObject var viewModel = ViewModel()
    
    var body: some View {
        HStack {
            Text("\(viewModel.count)")
            Button(action: {viewModel.increase()}, label: {
                Text("+")
            })
        }
    }
}

extension StateClickCount {
    class ViewModel: ObservableObject {
        
        @Published var count: Int = 0
        
        func increase() {
            count += 1
        }
    }
}
```

## 3. iOS Simulator

부모 컴포넌트의 상태가 변경되어 화면이 다시 그려질 때 자식 컴포넌트의 상태가 어떻게 바뀌는지 살펴보자. 

- ObservedClickCount 컴포넌트는 부모 컴포넌트의 상태가 변경될 때 초기화된다.
- StateClickCount 컴포넌트는 부모 컴포넌트의 상태가 변경되더라도 초기화되지 않는다.

<p align="center">
  <img src="/images/posts/2024/state-object-vs-observed-object-02.gif" width="30%" class="image__border">
</p>

## CLOSING

필자는 체크박스를 만들 때 @ObservedObject 애너테이션을 사용해 버그가 발생했다. 버그를 고치려고 SwiftUI 프레임워크에 대한 내용을 살펴보면서 이런 생각이 들었다. 

- 애플리케이션 개발자는 프레임워크에 대한 이해도가 높아야 된다.
- 단위 테스트로 각 컴포넌트의 기능을 검증하는 것만으로 부족하다. 시스템을 구성하는 실제 컴포넌트들 사이의 복합적인 상호 작용을 확인할 수 있는 테스크 코드들이 필요하다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-04-20-state-object-vs-observed-object/action-in-blog>

#### REFERENCE

- <https://developer.apple.com/documentation/swiftui/observedobject>
- <https://developer.apple.com/documentation/swiftui/stateobject>
- <https://www.avanderlee.com/swiftui/stateobject-observedobject-differences/>
- <https://pilgwon.github.io/post/state-object-vs-observed-object>
- <https://medium.com/hcleedev/swift-observedobject%EC%99%80-stateobject-4f851ed9ef0d>

[mvvm-pattern-in-ios-link]: https://junhyunny.github.io/ios/swift-ui/design-pattern/mvvm-pattern-in-ios/