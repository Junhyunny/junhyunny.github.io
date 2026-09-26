---
title: "SwiftUI 테스트 - 실행 환경(Launch Environment) 설정하기"
search: false
category:
  - swift
  - swift-ui
  - test
  - test-driven-development
last_modified_at: 2026-09-26T12:37:09+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [SwiftUI 테스트 - FlyingFox HTTP 서버 목킹(mocking)하기][swit-ui-test-flying-fox-link]
- [테스트 더블(Test Double)][test-double-link]

## 0. 들어가면서

[이전 글][swit-ui-test-flying-fox-link] 예제를 보면 테스트에서 주입한 환경 변수가 구현 코드에서 사용됐다. 이 부분에 대한 내용을 자세히 다루지 않았기 때문에 이번 글에서 정리한다.

## 1. UI Test Launch Environment

`launchEnvironment`는 XCUITest가 앱을 실행할 때 테스트 전용 환경 변수를 주입하는 기능이다. UI 테스트에서 이번 애플리케이션 실행에 필요한 조건을 알려주는 방법이다. 테스트 코드에서는 다음과 같이 환경 변수를 설정한다.

```swift
let app = XCUIApplication()

app.launchEnvironment["APP_ENV"] = "uiTest"
app.launchEnvironment["INITIAL_ROUTE"] = "call"
app.launchEnvironment["API_BASE_URL"] = "http://localhost:8080"

app.launch()
```

실제 애플리케이션에서는 다음과 같이 ProcessInfo 객체에서 꺼내 사용한다.

```swift
let environment = ProcessInfo.processInfo.environment

let appEnv = environment["APP_ENV"]
let initialRoute = environment["INITIAL_ROUTE"]
let apiBaseURL = environment["API_BASE_URL"]
```

여러 가지 용도로 사용할 수 있다.

- 특정 화면에서 애플리케이션이 시작하도록 라우팅 제어
- 피처 플래그(feature flag), 서버 주소처럼 환경마다 구분이 필요한 환경 변수 제어

UI 테스트는 단위 테스트(unit test)와 달리 직접 원하는 상태나 [테스트 더블(test double)][test-double-link]을 주입할 수 없다. 에뮬레이터에서 애플리케이션을 실행하는 방식이기 때문에 앱 내부 메모리에 접근할 수 없기 때문이다. 애플리케이션과 UI 테스트 사이의 경계를 넘어 필요한 컨텍스트를 설정하기 위해 launchEnvironment를 사용한다.

```
UI Test Process
      │
      │ launchEnvironment
      │ 
      ▼
App Process
```

## 2. How to use launch environment?

launchEnvironment를 어떻게 사용하면 좋을까? 나는 다음과 같은 방식을 사용했다.

1. 애플리케이션을 시작할 때 한 번 읽어서 하나의 모듈에 격리한다.
2. environment() 함수를 통해 이전 단계에서 만든 설정 모듈을 애플리케이션 환경 값으로 등록한다.
3. 뷰(view)에서 필요한 환경 값을 꺼내 사용한다.

지금부터 예시 코드를 살펴보자. 테스트 코드에서 다음과 같이 환경 변수를 설정했다고 가정한다.

```swift
let app = XCUIApplication()
app.launchEnvironment["POKEMON_URL"] = url
app.launch()
```

launchEnvironment를 불러오는 AppConfig 구조체를 만드는 것부터 시작한다. AppConfig 객체에 필요한 프로퍼티를 설정한 후 반환하는 loadEnvironment() 정적 함수를 만든다.

- 환경 변수를 통해 주입받고 싶은 프로퍼티를 만든다. 기본값은 운영 환경(혹은 개발 환경)에서 사용하는 값으로 지정한다.
- 컴파일 설정(Build Configuration)이 디버그(debug)인 경우에만 실행되도록 `#if DEBUG` 블록으로 환경 변수를 불러오는 코드를 감싼다. 테스트의 컴파일 설정은 디버그로 지정된다.

```swift
struct AppConfig {
    var url: String = "https://pokeapi.co"

    static func loadEnvironment() -> AppConfig {
        var appConfig = AppConfig()
        #if DEBUG
            let environment = ProcessInfo.processInfo.environment
            if let url = environment["POKEMON_URL"] {
                appConfig.url = url
            }
        #endif
        return appConfig
    }
}
```

위에서 만든 loadEnvironment() 정적 함수를 호출해서 뷰의 환경 값으로 등록해야 한다. 이때 environment() 함수를 사용한다. EnvironmentKey 타입의 구조체를 하나 만들고, EnvironmentValues 구조체를 확장해야 한다. 먼저 EnvironmentKey 타입의 새로운 구조체를 선언한다.

- AppConfigurationKey 구조체는 Environment에 값을 저장하고 꺼낼 때 사용하는 키 타입이다.
- 이름표 역할만 수행하는 것이 아니라, 해당 키에 값이 아직 주입되지 않았을 때 사용할 기본값까지 함께 정의한다.

```swift
private struct AppConfigurationKey: EnvironmentKey {
    static let defaultValue = AppConfig()
}
```

다음으로 EnvironmentValues 구조체를 확장해서 appConfig이라는 커스텀 환경 값 접근 프로퍼티를 추가한다. environment() 함수를 통해 환경 값을 주입하려면 EnvironmentValues 구조체를 확장한 프로퍼티가 필요하다.

- EnvironmentValues 객체는 내부적으로 키-값 저장소처럼 동작한다.
- EnvironmentValues 객체의 appConfig 프로퍼티를 통해 AppConfigurationKey 타입에 해당하는 환경 값을 `get/set`할 수 있도록 만든다.

```swift
extension EnvironmentValues {
    var appConfig: AppConfig {
        get { self[AppConfigurationKey.self] }
        set { self[AppConfigurationKey.self] = newValue }
    }
}
```

두 타입의 정의를 마치면 뷰에 AppConfig 객체를 주입할 수 있다.

```swift
@main struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.appConfig, .loadEnvironment()) // this
        }
    }
}
```

환경 값을 주입한 후에는 @Environment 프로퍼티 래퍼(property wrapper)를 통해 환경 값을 꺼내 사용할 수 있다.

```swift
struct ContentView: View {
    @Environment(\.appConfig) private var appConfig
    ...

    func fetchPokemons() async -> [Pokemon] {
        do {
            let (data, _) = try await URLSession.shared.data(
                from: URL(string: "\(appConfig.url)/api/v2/pokemon")!
            )
            ...
        } catch {
            return []
        }
    }

    var body: some View {
        ...
    }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-09-23-swit-ui-test-flying-fox>

#### REFERENCE

- <https://developer.apple.com/documentation/xcode/testing>
- <https://developer.apple.com/documentation/xcuiautomation/xcuiapplication>
- <https://developer.apple.com/documentation/foundation/processinfo>

[swit-ui-test-flying-fox-link]: https://junhyunny.github.io/swift/swift-ui/flyingfox/test/test-driven-development/integration-test/swit-ui-test-flying-fox/
[test-double-link]: https://junhyunny.github.io/test/test-driven-development/test-double/
