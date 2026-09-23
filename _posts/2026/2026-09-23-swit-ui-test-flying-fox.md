---
title: "SwiftUI 테스트 - FlyingFox HTTP 서버 목킹(mocking)하기"
search: false
category:
  - swift
  - swift-ui
  - flyingfox
  - test
  - test-driven-development
  - integration-test
last_modified_at: 2026-09-24T01:55:05+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [테스트 더블(Test Double)][test-double-link]

## 1. SwiftUI UI 테스트와 테스트 더블

SwiftUI의 UI 테스트는 XCUITest를 사용해 실제 앱을 실행한 뒤 사용자 관점에서 화면을 조작하고 결과를 검증하는 테스트다. 이러한 특성 때문에 E2E 테스트와 비슷하다. 단위 테스트에서는 테스트 대상을 격리하고, [테스트 더블(test double)][test-double-link]을 사용해 필요한 컨텍스트를 준비한다. 반면 UI 테스트는 시뮬레이터에서 실제 애플리케이션을 실행하기 때문에 테스트 코드로 필요한 컨텍스트를 준비하기 어렵다.

여기서 컨텍스트란 다음과 같다.

- 초기 상태나 입력 데이터 준비: 테스트 시작 시점의 앱 상태나 사전에 준비해야 할 데이터
- 외부 의존성 준비: 서버, 네트워크, 데이터베이스, 파일 시스템 등 외부 컴포넌트의 상태
- 실행 환경 준비: 권한, 언어, 네트워크 상태, 디바이스 설정처럼 실행 결과에 영향을 주는 환경
- 화면 진입 조건 준비: 특정 화면이나 사용자 흐름에서 테스트를 시작하기 위해 필요한 상태

UI 테스트에서도 위 컨텍스트 중 초기 상태나 실행 환경을 제어할 수 있지만, 제어할 수 있는 범위가 제한적이다. 아래 이미지의 왼쪽은 단위 테스트, 오른쪽은 UI 테스트를 시각화한 것이다.

- 단위 테스트: 보통 테스트 대상이 의존하는 모듈에 인터페이스로 경계를 만든다. 인터페이스를 구현한 테스트 더블을 준비하고, 테스트 코드에서 이 테스트 더블을 사용해 필요한 컨텍스트를 만든다.
- UI 테스트: 애플리케이션 자체를 블랙 박스로 간주한다. 사용자처럼 코드로 에뮬레이터에서 실행 중인 애플리케이션을 제어한다. 앱이 실행 중이기 때문에 테스트 코드로 필요한 컨텍스트를 제어하는 데 한계가 있다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/swit-ui-test-flying-fox-01.png" width="100%" class="image__border">
</div>

<br/>

UI 테스트에서 외부 의존성과 연결된 모듈을 직접 테스트 더블로 만들어 제어하기는 어렵지만, 외부 의존성 자체를 테스트 더블로 만드는 것은 가능하다. 예를 들어 애플리케이션이 서버와 연결되어 있다고 가정해 보자. 애플리케이션 입장에서 서버는 외부 의존성이다. 이 서버를 테스트 더블로 만들면 테스트 코드에서 서버의 응답을 제어하거나 어떤 요청을 받았는지 확인할 수 있다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/swit-ui-test-flying-fox-02.png" width="100%" class="image__border">
</div>

## 2. FlyingFox 라이브러리

이번 글에서는 외부 HTTP 서버를 테스트 더블로 만들어 제어할 수 있는 라이브러리를 소개한다. 스위프트(Swift)에서 테스트 코드로 목 서버를 만들고 제어할 수 있는 라이브러리를 두 개 찾았다.

- [FlyingFox](https://github.com/swhitty/FlyingFox)
- [Swifter](https://github.com/httpswift/swifter)

두 라이브러리의 특징을 비교해보자.

| 항목 | FlyingFox | Swifter |
|---|---|---|
| GitHub Stars | 약 **680** | 약 **4.0k** |
| 라이선스 | **MIT** | **BSD-3-Clause** |
| 최신 릴리즈 | **0.27.1**, 2026년 7월 | **1.5.0**, 2020년 9월 26일 |
| 최근 유지보수 | 활발함. 최근 릴리즈·PR·커밋 지속 | 활동이 적은 편. 최신 정식 릴리즈가 2020년 |
| Swift 버전 | 최신 0.27.x는 사실상 **Swift 6+**. `Package.swift`도 Swift tools 6.0 / Swift 6 language mode 사용 | 1.5.0 기준 **Swift 5 시대** 패키지. 패키지 레지스트리에서는 Swift Tools 5.0으로 표시 |
| Swift Concurrency | **적극 사용** — `async/await`, `Task`, `AsyncStream` 기반 | 기존 callback / Dispatch / socket 중심 |
| HTTP 서버 | 지원 | 지원 |
| WebSocket | 지원, `AsyncStream<WSMessage>` 기반 | 지원 |
| SPM | 지원 | 지원 |
| CocoaPods | 지원 | 지원 |
| iOS 최소 버전 | iOS 13+ | 오래된 iOS 버전부터 지원해온 라이브러리 |
| 코드 스타일 | 현대 Swift에 가까움 | 비교적 전통적인 Swift 스타일 |

Swifter는 더 오래되고 스타 수도 많아 검증된 라이브러리지만, 최근 유지보수와 Swift 6/Concurrency 대응을 고려하면 신규 프로젝트에서는 FlyingFox가 더 적합하다고 판단했다. 그래서 최근 학습을 겸해 개발 중인 프로젝트에 FlyingFox를 채택했다.

이제 `FlyingFox`에 대해 더 자세히 알아보자. FlyingFox는 스위프트 동시성(Swift Concurrency) 기반의 경량 HTTP 서버 라이브러리다. async/await 키워드와 non-blocking BSD 소켓을 사용해 요청을 비동기로 처리하며, 각 연결은 별도의 자식 태스크에서 동작한다.

주요 특징은 다음과 같다.

- HTTP 서버를 간단하게 실행할 수 있다.
- 라우팅과 커스텀 핸들러를 지원한다.
- 정적 파일 응답, 프록시, 리다이렉트 같은 기능을 제공한다.
- 웹 소켓(WebSocket)을 지원한다.
- 스위프트 패키지 매니저(Swift Package Manager)로 설치할 수 있다.

예를 들어 FlyingFox 라이브러리를 사용하면 다음과 같이 간단하게 HTTP 서버를 준비할 수 있다.

```swift
import FlyingFox

let server = HTTPServer(port: 8080)

await server.appendRoute("GET /hello") { _ in
    HTTPResponse(statusCode: .ok)
}

try await server.run()
```

## 3. HTTP 서버 목킹 예제

간단한 GET HTTP 요청을 보낸 후 응답받은 데이터를 보여주는 화면의 테스트 코드를 작성해 보자. 예시에서 무료 API 서버인 [포켓몬 API](https://pokeapi.co/)를 사용했다. 화면 코드는 다음과 같다.

- `.task` 클로저에서 포켓몬 데이터를 가져오고(fetch), 응답을 받으면 View 상태를 변경한다.
- URL 주소는 AppConfig 객체로부터 전달받는다.

```swift
struct ContentView: View {
    @Environment(\.appConfig) private var appConfig
    @State private var pokemons: [Pokemon] = []

    func fetchPokemons() async -> [Pokemon] {
        do {
            let (data, _) = try await URLSession.shared.data(
                from: URL(string: "\(appConfig.url)/api/v2/pokemon")!
            )
            let response = try JSONDecoder().decode(
                PokemonResponse.self,
                from: data
            )
            return response.results
        } catch {
            return []
        }
    }

    var body: some View {
        List(pokemons) { pokemon in
            Text(pokemon.name)
        }
        .task {
            pokemons = await fetchPokemons()
        }
    }
}
```

지금부터 위 화면의 테스트 코드를 살펴보자. FlyingFox HTTP 서버를 실행하고 테스트가 완료되면 서버를 종료하는 과정은 보일러플레이트(boilerplate) 코드이므로 재사용할 수 있는 래퍼(wrapper) 함수를 만들면 유용하다. 함수의 매개변수(parameter)는 다음과 같다. 다른 내용은 가독성을 위해 주석으로 남겼다.

- route 매개변수
  - 테스트 코드에서 API 경로와 이를 처리할 수 있는 핸들러를 한 쌍으로 묶은 튜플(tuple)
- wrappered 매개변수
  - FlyingFox HTTP 서버 주소를 파라미터로 받아 실행할 테스트 코드가 정의된 클로저 함수

```swift
func withMockServer(
    route: (HTTPRoute, @Sendable (HTTPRequest) async throws -> HTTPResponse),
    wrappered: @escaping (String) async throws -> Void
) async throws {
    let server = HTTPServer(port: 0) // 랜덤 포트 사용
    await server.appendRoute(route.0, handler: route.1) // 테스트 코드에서 지정한 경로와 핸들러 등록
    defer {
        await server.stop() // 현재 래퍼 함수 스코프를 벗어날 때 서버를 종료
    }
    Task {
        do {
            try await server.run() // FlyingFox HTTP 서버를 실행, 실행 후 대기하기 때문에 Task 블록으로 묶어서 실행자 큐로 전달
        } catch {
            print("HTTP Server is failed to start")
        }
    }
    try? await server.waitUntilListening() // FlygingFox HTTP 서버가 실행되는 것을 대기
    guard let address = await server.listeningAddress else { // 실행 중인 HTTP 서버의 주소를 획득, 포트 번호가 랜덤이기 때문에 포트 정보를 추출하기 위해 사용
        throw MockServerError.notFoundAddress
    }
    var port: UInt16 = 0 // 포트번호 획득
    switch address {
    case .ip4(_, let portNumber):
        port = portNumber
    case .ip6(_, let portNumber):
        port = portNumber
    case .unix:
        throw MockServerError.notFoundPort
    }
    try await wrappered("http://localhost:\(port)") // 테스트 코드에 FlyingFox HTTP 서버 주소 전달
}

enum MockServerError: Error {
    case notFoundAddress
    case notFoundPort
}
```

이제 위 래퍼 함수를 활용한 테스트 코드를 살펴볼 차례다. 테스트 코드에서 스터빙(stubbing)한 응답 데이터가 화면에 표시되는지 확인한다. 다음과 같은 스텁 응답을 사용했다.

```swift
final class action_in_blogUITests: XCTestCase {

    let stubResponse: String = """
        {
            "count":1351,
            "next":"https://pokeapi.co/api/v2/pokemon?offset=20&limit=20",
            "previous":null,
            "results":[
                {"name":"bulbasaur","url":"https://pokeapi.co/api/v2/pokemon/1/"},
                {"name":"ivysaur","url":"https://pokeapi.co/api/v2/pokemon/2/"}
            ]
        }
        """
    ...
}
```

UI 테스트이므로 XCUIApplication 객체를 사용한다. 앞서 살펴본 `withMockServer()` 래퍼 함수를 사용하면 클로저에서 FlyingFox HTTP 서버 주소를 파라미터로 전달받을 수 있다.

- API 경로는 "METHOD /path" 패턴으로 지정한다. 테스트 코드에서 지정한 요청 메서드나 경로가 구현 코드의 것과 다르면 함께 전달한 핸들러는 실행되지 않는다.
- 클로저 파라미터로 전달된 HTTP 서버 주소를 실행 환경 변수(launch environment)로 지정한다.
- 비동기 요청이므로 스텁 응답에 포함된 "bulbasaur" 텍스트가 화면에 보일 때까지 최대 3초 대기한다.

```swift
import FlyingFox
import XCTest

final class action_in_blogUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    ...

    @MainActor
    func testExample() async throws {
        try await withMockServer(
            route: (
                "GET /api/v2/pokemon",
                { _ in
                    return HTTPResponse(
                        statusCode: .ok,
                        body: Data(self.stubResponse.utf8)
                    )
                }
            )
        ) { url in
            let app = XCUIApplication()
            app.launchEnvironment["POKEMON_URL"] = url
            app.launch()

            XCTAssertTrue(
                app.staticTexts["bulbasaur"].waitForExistence(timeout: 3)
            )
            XCTAssertTrue(app.staticTexts["ivysaur"].exists)
        }
    }
}
```

이번 예제에서는 쿼리 파라미터가 없는 GET 요청만 테스트했다. HTTP 핸들러는 클로저 형식으로 지정할 수 있으므로 다음과 같은 테스트도 가능하다.

- GET 요청 시 클라이언트가 서버로 어떤 파라미터를 전달했는지 테스트에서 검증
- POST, PUT 요청 시 클라이언트가 어떤 요청 메시지(request body)를 전달했는지 테스트에서 검증

## CLOSING

FlyingFox 라이브러리는 일반적인 HTTP 서버 외에 웹 소켓 서버도 지원한다. 웹 소켓은 양방향 통신이기 때문에 서버에서 비동기적으로 메시지를 수신한다. 테스트에서 이를 처리하려면 위와 다른 패턴이 필요하므로 블로그 글로 정리해도 좋을 것 같다. 마침 연습 삼아 개발 중인 프로젝트에서 웹 소켓을 사용하고 있으므로 관련 내용을 다뤄 봐야겠다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-09-23-swit-ui-test-flying-fox>

#### REFERENCE

- <https://github.com/swhitty/FlyingFox>

[test-double-link]: https://junhyunny.github.io/test/test-driven-development/test-double/
