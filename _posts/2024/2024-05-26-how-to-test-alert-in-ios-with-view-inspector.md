---
title: "How to test alert in iOS with ViewInspector"
search: false
category:
  - iOS
  - swift
  - swift-ui
  - test-driven-development
last_modified_at: 2024-05-26T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [MVVM Pattern in SwiftUI][mvvm-pattern-in-ios-link]

## 0. 들어가면서

현재 프로젝트는 iOS 단위 테스트 패키지로 [nalexn/ViewInspector](https://github.com/nalexn/ViewInspector)를 사용하고 있다. ViewInspector 패키지에서 알림(alert) 컴포넌트를 테스트하려면 별도 작업이 필요하다. 이 글은 관련된 내용에 대해 정리했다.

## 1. InspectableAlert Struct

알림 컴포넌트를 테스트하기 위해선 다음과 같은 작업이 필요하다.

- InspectableAlert 구조체를 만든다.
- InspectableAlert 구조체를 ViewInspector 패키지에서 제공하는 PopupPresenter 프로토콜을 상속 받도록 확장한다.

먼저 InspectableAlert 구조체를 만들어보자. ViewModifier 프로토콜은 커스텀 스타일을 재사용할 때 사용하지만, 이번엔 테스트 가능한 알림 컴포넌트를 만들기 위해 사용한다.

- InspectableAlert 구조체는 ViewModifier 프로토콜을 상속 받고 body 함수를 재구현한다. 
- 기본 알림 컴포넌트를 만들어 반환한다.
  - InspectableAlert 구조체의 필드들을 주입한다.
  - isPresented - 알림 표시 여부
  - popupBuilder - 알림 컴포넌트 생성하는 클로저(closure)

```swift
import SwiftUI

struct InspectableAlert: ViewModifier {
    let isPresented: Binding<Bool>
    let popupBuilder: () -> Alert
    let onDismiss: (() -> Void)? = nil
    
    func body(content: Self.Content) -> some View {
        content.alert(isPresented: isPresented, content: popupBuilder)
    }
}
```

## 2. Alert+ Extension

뷰 컴포넌트에서 일반 알림 컴포넌트가 아닌 검사 가능한 알림 컴포넌트를 호출해서 사용할 수 있도록 View 프로토콜을 확장한다. 

```swift
import SwiftUI

extension View {
    func inspectableAlert(isPresented: Binding<Bool>, content: @escaping () -> Alert) -> some View {
        return self.modifier(
            InspectableAlert(
                isPresented: isPresented,
                popupBuilder: content
            )
        )
    }
}
```

## 3. InspectableAlert+ Extension

단위 테스트에서 알림 창의 열림, 닫힘 여부를 확인하거나 버튼을 눌러 액션을 일으키려면 ViewInspector 패키지에서 제공하는 PopupPresenter 프로토콜을 상속하도록 만든다. 단위 테스트에서만 필요하기 때문에 테스트 타겟 폴더 내부에 InspectableAlert 구조체 확장 파일을 만든다.

```swift
import ViewInspector

@testable import ActionInBlog

extension InspectableAlert: PopupPresenter {}
```

## 4. Create Unit Test

다음과 같은 기능들을 테스트 한다. 

- 화면에 버튼을 눌렀을 때 알림 창이 열리는지 확인한다.
- 열린 알림 창에서 확인 버튼을 눌렀을 때 메인 화면 숫자가 하나 증가한 것을 확인한다.
- 열린 알림 창에서 취소 버튼을 눌렀을 때 메인 화면 숫자에 변화가 없는 것을 확인한다.

먼저 화면에 버튼을 눌렀을 때 알림 창이 열리는지 확인하는 단위 테스트를 만들어 보자.

1. 화면의 증가 버튼을 누른다.
2. 알림 창에 작성된 정보가 보이는지 확인한다.

```swift
import SwiftUI
import XCTest
import ViewInspector
import Nimble

@testable import ActionInBlog

final class ContentViewTests: XCTestCase {
    func test_whenClickIncreaseButton_thenOpenAlert() throws {
        let sut = ContentView()
        let expectation = sut.inspection.inspect { view in
            try view.find(button: "Increase").tap() // 1
            
            
            let alertWindow = try view.find( // 2
                ViewType.Alert.self,
                containing: "Do you want to increase count?"
            )
            let yesButton = try view.find(ViewType.AlertButton.self, containing: "Yes")
            let cancelButton = try view.find(ViewType.AlertButton.self, containing: "Cancel")
            expect(alertWindow).toNot(beNil())
            expect(yesButton).toNot(beNil())
            expect(cancelButton).toNot(beNil())
        }
        ViewHosting.host(view: sut)
        wait(for: [expectation], timeout: 2.5)
    }
}
```

다음은 알림 창일 열린 상태에서 Yes 버튼을 눌렀을 때 숫자가 증가하고 해당 버튼이 화면에서 보이지 않는지 확인한다.

1. 증가 버튼을 눌러 알림 창이 열린 상태를 만든다.
2. 알림 화면의 Yes 버튼을 누른다.
3. 증가한 숫자와 Yes 버튼은 사라졌는지 확인한다.

```swift
final class ContentViewTests: XCTestCase {
    func test_givenOpenedAlert_whenYesButton_thenCountIsIncreasedAndCloseAlert() throws {
        let sut = ContentView()
        let expectation = sut.inspection.inspect { view in
            try view.find(button: "Increase").tap() // 1
            
            
            try view.find(ViewType.AlertButton.self, containing: "Yes").tap() // 2
            
            
            let result = try view.find(text: "1") // 3
            expect(result).toNot(beNil())
            expect{
                try view.find(
                    ViewType.AlertButton.self,
                    containing: "Yes"
                )
            }.to(throwError())
        }
        ViewHosting.host(view: sut)
        wait(for: [expectation], timeout: 2.5)
    }
}
```

마지막으로 알림 창일 열린 상태에서 Cancel 버튼을 눌렀을 때 숫자는 변함없이 해당 버튼이 화면에서 보이지 않는지 확인한다.

1. 증가 버튼을 눌러 알림 창이 열린 상태를 만든다.
2. 알림 화면의 Cancel 버튼을 누른다.
3. 변함 없는 숫자와 Cancel 버튼은 사라졌는지 확인한다.

```swift
final class ContentViewTests: XCTestCase {
    func test_givenOpenedAlert_whenCancelButton_thenCountIsNotIncreasedAndCloseAlert() throws {
        let sut = ContentView()
        let expectation = sut.inspection.inspect { view in
            try view.find(button: "Increase").tap()
            
            
            try view.find(
                ViewType.AlertButton.self,
                containing: "Cancel"
            )
            .tap()
            
            
            let result = try view.find(text: "0")
            expect(result).toNot(beNil())
            expect{
                try view.find(
                    ViewType.AlertButton.self,
                    containing: "Cancel"
                )
            }.to(throwError())
        }
        ViewHosting.host(view: sut)
        wait(for: [expectation], timeout: 2.5)
    }
}
```

## 5. ContentView Implementation

구현체 코드는 다음과 같다.

1. inspectableAlert 기능을 호출한다.
  - @State 변수를 바인딩하고, 알림 컴포넌트를 클로저로 추가한다.
2. 알림 창에는 다음과 같은 정보가 포함된다.
  - 숫자를 증가시킬 것인지 확인하는 타이틀
  - Yes 버튼과 카운트를 증가시키는 클로저
  - No 버튼

```swift
import SwiftUI

struct ContentView: View {
    internal let inspection = Inspection<Self>()
    @State var count = 0
    @State var isPresented = false
    
    var body: some View {
        VStack {
            Text("\(count)")
                .inspectableAlert(isPresented: $isPresented) { // 1
                    Alert(
                        title: Text("Do you want to increase count?"), // 2
                        primaryButton: .default(Text("Yes")) { count += 1 },
                        secondaryButton: .destructive(Text("Cancel"))
                    )
                }
            Button("Increase") {
                self.isPresented = true
            }
        }
        .padding()
        .onReceive(inspection.notice) { self.inspection.visit(self, $0) }
    }
}

#Preview {
    ContentView()
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-05-26-how-to-test-alert-in-ios-with-view-inspector>

#### REFERENCE

- <https://github.com/nalexn/ViewInspector>

[mvvm-pattern-in-ios-link]: https://junhyunny.github.io/ios/swift-ui/design-pattern/mvvm-pattern-in-ios/