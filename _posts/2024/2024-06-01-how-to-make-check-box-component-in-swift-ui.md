---
title: "How to make CheckBox Component in SwiftUI"
search: false
category:
  - iOS
  - swift
  - swift-ui
  - test-driven-development
last_modified_at: 2024-06-01T27:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [How to test state change in iOS with ViewInspector][how-to-test-state-change-in-ios-with-view-inspector-link]

## 0. 들어가면서

SwiftUI 프레임워크로 iOS 애플리케이션을 개발할 때 체크 박스(check box)가 기본적으로 제공되지 않는다는 사실에 놀랐다. 이번 글은 iOS 애플리케이션에서 체크 박스 컴포넌트를 만드는 방법을 정리했다. 더불어 ViewInspector 라이브러리를 사용해 단위 테스트하는 방법도 함께 정리했다.

## 1. CheckBox based on Toggle

iOS 애플리케이션은 토글(toggle) 스위치 스타일을 바꿔 체크 박스 컴포넌트를 만든다. 

### 1.1. Implementation

ToggleStyle 프로토콜을 상속 받아 체크 박스 스타일을 만든다. 오버라이드(override) 한 makeBody 함수의 configuration 객체로부터 토글 컴포넌트에 설정된 정보를 얻을 수 있다.

1. 버튼이 눌리면 isOn 값을 토글한다.
2. isOn 상태에 따라 체크 박스, 빈 박스를 표시한다.
3. 라벨을 표시한다.

```swift
import SwiftUI

struct iOSCheckboxToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        Button(action: {
            configuration.isOn.toggle() // 1
        }, label: {
            HStack {
                Image(systemName: configuration.isOn ? "checkmark.square" : "square") // 2
                configuration.label
                    .colorMultiply(.black) // 3
            }
        })
    }
}
```

위에서 만든 iOSCheckboxToggleStyle 객체를 사용해 토글 컴포넌트의 스타일을 변경할 수 있다.

1. 토글 컴포넌트의 스타일을 iOSCheckboxToggleStyle 객체로 지정한다.
2. 토글 컴포넌트의 상태 변경 이벤트를 상위 컴포넌트로부터 전달 받은 onChange 클로저에게 전달한다.

```swift
struct SupportedCheckBox: View {
    internal let inspection = Inspection<Self>()
    
    @State var isOn: Bool = false
    
    let label: String
    let value: String
    let onChange: (Bool, String) -> Void
    
    var body: some View {
        Toggle(label, isOn: $isOn)
            .toggleStyle(iOSCheckboxToggleStyle()) // 1
            .onChange(of: isOn, { onChange(isOn, value) }) // 2
            .onReceive(inspection.notice) { self.inspection.visit(self, $0) }
    }
}
```

### 1.2. Tests

ViewInspector 라이브러리로 이제 위에서 만든 커스텀 컴포넌트를 테스트 해보자. SwiftUI 프레임워크는 모키토(mockito)처럼 동적으로 테스트 더블을 만들 수 있는 라이브러리가 없다. 다음과 같은 테스트 더블을 준비한다. 테스트에서만 사용하므로 테스트 대상 폴더에 내부에 만든다.

- onChange 함수를 호출했을 때 파라미터로 전달된 값을 저장한다.

```swift
class OnChangeSpy {   
    var expectedChecked = false
    var expectedValue = ""
    
    func onChange(isChecked: Bool, value: String) -> Void {
        self.expectedChecked = isChecked
        self.expectedValue = value
    }
}
```

테스트 더블이 준비되었으면 위 컴포넌트에 대한 단위 테스트를 작성한다.

1. 체크 박스에 라벨과 값이 표시되는지 확인한다.
2. 체크 박스를 탭 했을 때 onChange 함수가 예상되는 파라미터와 함께 호출되었는지 확인한다.
2. 체크 박스를 두번 탭 했을 때 onChange 함수가 예상되는 파라미터와 함께 호출되었는지 확인한다.

```swift
import XCTest
import SwiftUI
import Nimble
import ViewInspector

@testable import ActionInBlog

final class SupportedCheckBoxTests: XCTestCase {
    func test_renderCheckBox() throws { // 1
        func onChange(isChecked: Bool, value: String) -> Void {}
        let sut = SupportedCheckBox(label: "label", value: "value", onChange: onChange)
        
        
        let button = try sut.inspect().find(button: "label")
        
        
        expect(button).toNot(beNil())
        expect(try button.find(text: "label")).toNot(beNil())
    }
    
    func test_whenClick_thenGetValueAndState() throws { // 2
        let onChangeSpy = OnChangeSpy()
        let sut = SupportedCheckBox(label: "label", value: "value", onChange: onChangeSpy.onChange)
        let expectation = sut.inspection.inspect { view in
            let button = try view.find(button: "label")
            try button.tap()
            
            
            expect(onChangeSpy.expectedChecked).to(beTrue())
            expect(onChangeSpy.expectedValue).to(equal("value"))
        }
        ViewHosting.host(view: sut)
        wait(for: [expectation], timeout: 2.5)
    }
    
    func test_whenDoubleClick_thenGetValueAndState() throws { // 3
        let onChangeSpy = OnChangeSpy()
        let sut = SupportedCheckBox(label: "label", value: "value", onChange: onChangeSpy.onChange)
        let expectation = sut.inspection.inspect { view in
            let button = try view.find(button: "label")
            try button.tap()
            try button.tap()
            
            
            expect(onChangeSpy.expectedChecked).to(beFalse())
            expect(onChangeSpy.expectedValue).to(equal("value"))
        }
        ViewHosting.host(view: sut)
        wait(for: [expectation], timeout: 2.5)
    }
}
```

## 2. CheckBox based on Button

위에서 만든 체크 박스 컴포넌트만으로 충분하지만, 낮은 버전의 ViewInspector 라이브러리는 Toggle 컴포넌트를 충분히 지원하지 못 한다. `0.9.11`보다 낮은 버전을 사용하면 다음과 같은 에러를 만나게 된다.

```
failed - Toggle's tap() and isOn() are currently unavailable for inspection on iOs 16. 
Situation may change with a minor OS version update. 
In the meanwhile, please add XCTSkip for iOS 16 and use an earlier OS version for testing.
```

이 문제는 Button 컴포넌트로 직접 구현한다면 해결할 수 있다.

### 2.1. Implementation

iOSCheckboxToggleStyle 구조체와 유사한 구조를 갖는다. 

1. 버튼을 클릭하면 isOn 값을 토글한다.
2. 상위 컴포넌트로부터 전달 받은 onChange 클로저에게 상태 변경 이벤트를 전달한다.
3. isOn 상태에 따라 체크 박스, 빈 박스를 표시한다.
4. 라벨을 표시한다.

```swift
import SwiftUI

struct CheckBox: View {
    internal let inspection = Inspection<Self>()
    
    @State var isOn: Bool = false

    let label: String
    let value: String
    let onChange: (Bool, String) -> Void
    
    var body: some View {
        Button(
            action: {
                isOn.toggle() // 1
                onChange(isOn, value) // 2
            },
            label: {
                HStack {
                    Image(systemName: isOn ? "checkmark.square" : "square") // 3
                    Text(label).colorMultiply(.black) // 4
                }
            }
        )
        .onReceive(inspection.notice) { self.inspection.visit(self, $0) }
    }
}
```

### 2.2. Tests

단위 테스트 방법은 동일하다.

```swift
import XCTest
import SwiftUI
import Nimble
import ViewInspector

@testable import ActionInBlog

final class CheckBoxTests: XCTestCase {
    func test_renderCheckBox() throws { // 1
        func onChange(isChecked: Bool, value: String) -> Void {}
        let sut = CheckBox(label: "label", value: "value", onChange: onChange)
        
        
        let button = try sut.inspect().find(button: "label")
        
        
        expect(button).toNot(beNil())
        expect(try button.find(text: "label")).toNot(beNil())
    }
    
    func test_whenClick_thenGetValueAndState() throws { // 2
        let onChangeSpy = OnChangeSpy()
        let sut = CheckBox(label: "label", value: "value", onChange: onChangeSpy.onChange)
        let expectation = sut.inspection.inspect { view in
            let button = try view.find(button: "label")
            try button.tap()
            
            
            expect(onChangeSpy.expectedChecked).to(beTrue())
            expect(onChangeSpy.expectedValue).to(equal("value"))
        }
        ViewHosting.host(view: sut)
        wait(for: [expectation], timeout: 2.5)
    }
    
    func test_whenDoubleClick_thenGetValueAndState() throws { // 3
        let onChangeSpy = OnChangeSpy()
        let sut = CheckBox(label: "label", value: "value", onChange: onChangeSpy.onChange)
        let expectation = sut.inspection.inspect { view in
            let button = try view.find(button: "label")
            try button.tap()
            try button.tap()
            
            
            expect(onChangeSpy.expectedChecked).to(beFalse())
            expect(onChangeSpy.expectedValue).to(equal("value"))
        }
        ViewHosting.host(view: sut)
        wait(for: [expectation], timeout: 2.5)
    }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-05-31-how-to-make-check-box-component-in-swift-ui>

#### REFERENCE

- <https://sarunw.com/posts/swiftui-checkbox/>
- <https://github.com/nalexn/ViewInspector/issues/230>

[how-to-test-state-change-in-ios-with-view-inspector-link]: https://junhyunny.github.io/ios/swift/swift-ui/test-driven-development/how-to-test-state-change-in-ios-with-view-inspector/