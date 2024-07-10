---
title: "Reusable Style in SwiftUI"
search: false
category:
  - iOS
  - swift-ui
  - design-pattern
last_modified_at: 2024-07-10T23:55:00
---

<br/>

## 0. 들어가면서

프로덕트는 항상 공통으로 사용하는 디자인 컴포넌트들이 존재하길 마련이다. 프로덕트 UI의 통일성을 위해선 공통적인 스타일이 적용된 컴포넌트를 사용해야 한다. SwfitUI 프레임워크는 웹 서비스처럼 공통 스타일 모듈을 만드는 CSS 같은 언어가 별도로 없다. SwiftUI는 이 문제를 어떻게 해결했을까? 

필자는 iOS 개발은 이번이 처음이었지만, 중복되는 스타일 코드 때문에 늘어나는 복잡성을 줄이기 위해 스타일 재사용 방법을 찾아 적용했다. 이번 글은 SwiftUI의 재사용 가능한 스타일에 관련된 내용을 정리했다. 

## 1. Make color variable

먼저 색상에 관련된 변수를 만들었다. 디자인 도구로 피그마(figma)를 사용하는 데 피그마는 색상 정보를 헥스(hex) 코드로 제공한다. SwiftUI는 헥스 코드로 색상을 표현하는 기능이 없기 때문에 이를 확장한다.

- 헥스 코드를 받으면 이를 RGB 값으로 변환한다.
- 불투명도(opacity)를 설정할 수 있도록 디폴트 값과 함께 파라미터를 선언한다.

```swift
import SwiftUI

extension Color {
    init(hex: Int, opacity: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xff) / 255,
            green: Double((hex >> 08) & 0xff) / 255,
            blue: Double((hex >> 00) & 0xff) / 255,
            opacity: opacity
        )
    }
}
```

Color 구조체는 ShapeStyle 프로토콜을 상속 받는다. ShapeStyle 프로토콜은 모양을 렌더링(rendering)할 때 컬러나 패턴을 사용할 수 있는 기능을 제공한다. ShapeStyle 프로토콜을 다음과 같이 확장한다.

- ShapeStyle 프로토콜 타입 중 Color 구조체인 경우에만 적용한다.
- 내부에 컬러 변수 이름을 지정한다.
- 피그마에서 얻은 헥스 코드로 색상을 지정한다. 

```swift
import SwiftUI

...

extension ShapeStyle where Self == Color {
    static var cornflowerBlue: Color {
        Color(hex: 0x659FE5)
    }
    static var scarlet: Color {
        Color(hex: 0xFF3300)
    }
    static var davysGrey: Color {
        Color(hex: 0x525252)
    }
}
```

## 2. Make text style

다음으로 텍스트 스타일을 만들었다. 다양한 프로덕트에는 더 많은 종류의 텍스트 스타일이 존재하지만, 이 예시에선 다음 텍스트 타입들만 존재한다고 가정한다.

- 헤더
- 타이틀
- 패러그래프(paragraph)

먼저 Text 구조체를 확장한다. 다음과 같은 textStyle 함수를 만든다. 

- ViewModifier 인자를 받는다.
- ViewModifier 객체 스타일 정보를 따라 변환된 뷰를 만드는 ModifiedContent 객체를 반환한다.
  - content 인자는 해당 텍스트 객체를 의미한다.
  - modifier 인자는 적용할 스타일 정보가 포함된 뷰 수식자 객체를 의미한다.

```swift
import SwiftUI

extension Text {
    func textStyle<Style: ViewModifier>(_ style: Style) -> some View {
        ModifiedContent(content: self, modifier: style)
    }
}
```

다음 위에서 언급한 텍스트 타입들을 만든다. 

- 각 타입마다 스타일 구조체를 만든다.
  - 폰트는 애플 기본 폰트를 사용한다.
  - 색상은 위에서 정의한 커스텀 컬러를 사용한다.
- 각 타입 구조체는 ViewModifier 구조체를 상속받는다.

```swift
import SwiftUI

...

struct Header: ViewModifier {
    
    func body(content: Content) -> some View {
        content
            .font(.title2)
            .foregroundColor(.davysGrey)
    }
}

struct Title: ViewModifier {
    
    func body(content: Content) -> some View {
        content
            .font(.title3)
            .foregroundColor(.davysGrey)
    }
}

struct Paragraph: ViewModifier {
    
    func body(content: Content) -> some View {
        content
            .font(.body)
            .foregroundColor(.davysGrey)
    }
}
```

## 3. Make button style

버튼 스타일에 관련된 프로토콜은 이미 애플에서 제공한다. 단순히 이를 확장하면 된다. 

- 공통 버튼 스타일은 commonStyle 함수를 만들어 재사용한다.
- ButtonStyle 프로토콜을 확장한다. 
  - 버튼 타입에 따라 색상, 모양 등을 적용한다.

```swift
import SwiftUI

private func commonStyle(
    configuration: ButtonStyleConfiguration
) -> some View {
    configuration
        .label
        .frame(minWidth: 44, minHeight: 44)
        .padding(.horizontal)
        .foregroundStyle(Color.white)
        .font(.body)
        .bold()
}

struct Primary: ButtonStyle {
    
    func makeBody(configuration: Configuration) -> some View {
        commonStyle(configuration: configuration)
            .background(Color.cornflowerBlue)
            .clipShape(ButtonBorderShape.capsule)
    }
}

struct Cancel: ButtonStyle {
    
    func makeBody(configuration: Configuration) -> some View {
        commonStyle(configuration: configuration)
            .background(Color.scarlet)
            .clipShape(ButtonBorderShape.capsule)
    }
}
```

## 4. Use reusable style

위에서 정의한 텍스트, 버튼 스타일을 사용한다.

- textStyle 함수에 텍스트 스타일 ViewModifier 인스턴스를 전달한다.
- textStyle 함수에 ButtonStyle 인스턴스를 전달한다.

```swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Text("Header")
                .textStyle(Header())
            Text("Title")
                .textStyle(Title())
            Text("Content")
                .textStyle(Paragraph())
            Button("Submit") {}
                .buttonStyle(Primary())
            Button("Cancel") {}
                .buttonStyle(Cancel())
        }
        .padding()
    }
}
```

다음과 같이 스타일이 적용된다.

<div align="center">
  <img src="/images/posts/2024/reusable-style-in-swift-ui-01.png" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-07-10-reusable-design-component-in-swift-ui>

#### REFERENCE

- <https://swiftwithmajid.com/2019/08/28/composable-styling-in-swiftui/>
- <https://developer.apple.com/documentation/swiftui/shapestyle>
- <https://developer.apple.com/documentation/swiftui/modifiedcontent>