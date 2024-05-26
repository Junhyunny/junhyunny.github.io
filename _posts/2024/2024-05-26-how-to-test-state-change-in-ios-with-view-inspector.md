---
title: "How to test state change in iOS with ViewInspector"
search: false
category:
  - iOS
  - swift
  - swift-ui
  - test-driven-development
last_modified_at: 2024-05-26T23:55:00
---

<br/>

## 0. 들어가면서

ViewInspector는 SwiftUI 단위 테스트를 위한 패키지다. ViewInspector 패키지는 몇 가지 제약 사항들 때문에 구현체 코드에 테스트를 위한 장치들이 추가되야 한다. @State, @StateObject 필드들의 변경을 감지 못 하는 문제가 그 중 하나이다. 이번 글은 관련된 문제를 해결하는 방법에 대해 정리했다.

## 1. Problem

먼저 구현체 코드를 살펴보자. 

- 버튼을 누를 때마다 상태가 변경된다.
  - @State 필드는 1씩 증가한다.
  - @StateObject 필드는 1씩 감소한다.

```swift
import SwiftUI

class ContentViewModel: ObservableObject {
    @Published var count: Int = 0
}

struct ContentView: View {
    @State var count: Int = 0
    @StateObject var viewModel = ContentViewModel()
    
    var body: some View {
        VStack {
            Text("\(count)")
            Text("\(viewModel.count)")
            Button("Change") {
                count += 1
                viewModel.count -= 1
            }
        }
        .padding()
    }
}
```

이제 테스트 코드를 살펴보자. 

1. Change 버튼을 누른다.
2. 숫자 하나는 증가하고, 나머지는 감소한다.

```swift
import XCTest
import ViewInspector
import Nimble

@testable import ActionInBlog

final class ContentViewTests: XCTestCase {
    
    func test_whenClickButton_thenChangeState() throws {
        let sut = ContentView()
        ViewHosting.host(view: sut)
        
        
        try sut.inspect() // 1
            .find(button: "Change")
            .tap()
        
        
        expect(try sut.inspect().find(text: "1")).toNot(beNil()) // 2
        expect(try sut.inspect().find(text: "-1")).toNot(beNil())
    }
}
```

위 테스트는 실패한다. 다음과 같은 에러가 발생한다. Text 컴포넌트를 찾지 못 해서 예외가 발생한다. 테스트가 실패한 이유는 @State, @StateObject 필드들의 업데이트가 발생하지 않았기 때문이다. 

```
test_whenClickButton_thenChangeState(): unexpected error thrown: <Search did not find a match>
```

## 2. Solve the problem

이 문제를 해결하기 위한 장치들을 만들고 테스트를 통과시켜 보자.

### 2.1. Inspection class

테스트 대상 컴포넌트의 변경을 감지하기 위한 Inspection 클래스 만든다. Inspection 객체는 구현체 코드에 추가해야 하므로 애플리케이션 대상 폴더 내부에 만든다. 

```swift
import SwiftUI
import Combine

internal final class Inspection<V> {
    let notice = PassthroughSubject<UInt, Never>()
    var callbacks = [UInt: (V) -> Void]()
    
    func visit(_ view: V, _ line: UInt) {
        if let callback = callbacks.removeValue(forKey: line) {
            callback(view)
        }
    }
}
```

### 2.2. Inspection+ Extension

Inspection 객체가 뷰 컴포넌트의 변경을 감지할 수 있도록 ViewInspector 패키지에서 제공하는 InspectionEmissary 프로토콜을 상속 받는다. 테스트에서만 사용하기 때문에 테스트 대상 폴더 내부에 만든다.

```swift
import ViewInspector

@testable import ActionInBlog

extension Inspection: InspectionEmissary {}
```

### 2.3. ContentView struct

구현체 코드에 변경이 필요하다. 구현체 뷰 컴포넌트의 변경을 감지하기 위해 Inspection 객체를 뷰 컴포넌트 onReceive 함수에 설정한다.

1. Inspection 객체를 만든다.
2. onReceive 함수에 Inspection 객체의 멤버 변수 발행자(publisher)를 설정한다.
  - 발행자의 값이 변경될 때 지정된 클로저가 실행된다.

```swift
import SwiftUI

class ContentViewModel: ObservableObject {
    @Published var count: Int = 0
}

struct ContentView: View {
    internal let inspection = Inspection<Self>() // 1
    @State var count: Int = 0
    @StateObject var viewModel = ContentViewModel()
    
    var body: some View {
        VStack {
            Text("\(count)")
            Text("\(viewModel.count)")
            Button("Change") {
                count += 1
                viewModel.count -= 1
            }
        }
        .padding()
        .onReceive(inspection.notice) { self.inspection.visit(self, $0) } // 2
    }
}
```

### 2.4. Fix Test Code

테스트 코드도 일부 변경이 필요하다. 뷰 컴포넌트에 설정한 Inspection 객체를 사용해 테스트를 수행한다.

1. inspection 객체의 inspect 함수에 클로저를 등록한다.
  - 클로저 내부에 단위 테스트를 작성한다.
2. 클로저를 등록할 때 반환된 XCTestExpectation 객체를 wait 함수에 등록한다.
  - 클로저를 등록하는 작업은 검증이 이뤄지지 않는다.
  - 타임 아웃은 옵셔널(optional)이다.

```swift
import XCTest
import ViewInspector
import Nimble

@testable import ActionInBlog

final class ContentViewTests: XCTestCase {
    func test_whenClickButton_thenChangeState() throws {
        let sut = ContentView()
        let expectation = sut.inspection.inspect { view in // 1
            
            try view.find(button: "Change").tap()
            
            
            expect(try view.find(text: "1")).toNot(beNil())
            expect(try view.find(text: "-1")).toNot(beNil())
        }
        ViewHosting.host(view: sut)
        wait(for: [expectation], timeout: 2.5) // 2
    }
}
```

## 3. Deficiecny of Support for @State and @StateObject

구현체에 테스트를 위한 코드가 추가되는 모습은 확실히 보기 좋지 않다. 필자도 이를 고쳐보려 했지만, 라이브러리의 한계가 있다. 일부 글들을 보면 아래 예제처럼 테스트에서만 사용할 TestWrapperView 구조체를 만들고 테스트에서만 구현체를 감싸는 방식으로 리팩토링 했지만, 실제로 제대로 동작하지 않는다. 해당 글의 테스트 코드를 보면 wait 함수로 검증하는 작업이 누락됐다. 

```swift
public let TEST_WRAPPED_ID: String = "wrapped"

struct TestWrapperView<Wrapped: View> : View{
   internal let inspection = Inspection<Self>()
   var wrapped: Wrapped

   init( wrapped: Wrapped ){
       self.wrapped = wrapped
   }

   var body: some View {
      wrapped
        .id(TEST_WRAPPED_ID)
        .onReceive(inspection.notice) {
           self.inspection.visit(self, $0)
        }
    }
}
```

현재(24년 5월) 기준으로 깃허브(github) 이슈를 보면 아직도 해결되지 않은 상태이다.

- [Inspection of nested SwiftUI Views using @State properties not possible](https://github.com/nalexn/ViewInspector/issues/231)

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-05-26-how-to-test-alert-in-ios-with-view-inspector>

#### REFERENCE

- <https://github.com/nalexn/ViewInspector/issues/231>