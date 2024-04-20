---
title: "MVVM Pattern in SwiftUI"
search: false
category:
  - iOS
  - swift-ui
  - design-pattern
last_modified_at: 2024-04-19T23:55:00
---

<br/>

## 0. 들어가면서

iOS 애플리케이션을 개발하는 프로젝트에 참여하게 됐다. 스프링 프레임워크와 리액트과 익숙한 나에게 새로운 활력소가 되어주고 있다. 개발자로써 어느 정도 경험치가 쌓였고, 유명한 프레임워크들은 비슷한 패턴이나 컨샙들을 갖고 있기 때문에 생각보다 금새 적응했다. 이미 진행 중인 프로젝트 중간에 참여한 것도 소프트 랜딩(soft landing)이 가능했다. 

지금 프로젝트는 SwiftUI 프레임워크를 사용하고 MVVM(Model-View-ViewModel) 패턴이 적용되어 있다. 이번 글을 작성하면서 MVVM 패턴이 무엇인지 정리해 봤다. 필자는 iOS 개발은 무뇌한이기 때문에 기존 UIKit 프레임워크와 비교한다거나 MVVM 패턴에 대한 장단점, 인사이트에 대해 정리하진 않았다. 각 컴포넌트마다 갖는 책임과 실제 구현 방법을 위주로 글을 작성했다.

## 1. MVVM(Model-View-ModelView) Pattern

필자가 익숙한 스프링 프레임워크도 백엔드 애플리케이션을 구성할 때 각 컴포넌트 별로 책임을 나눠 개발한다. 이를 MVC 패턴이라고 한다. SwiftUI 프레임워크에서도 애플리케이션을 구성할 때 동일하게 컴포넌트들 간에 책임을 분할한다. 각 컴포넌트는 다음과 같은 책임을 갖는다.

- Model(모델)
  - 데이터를 저장, 조회하거나 데이터를 기반으로 계산하는 비즈니스 로직을 수행한다.
  - 모델 그룹에 속하는 컴포넌트들은 뷰나 뷰-모델에 대한 의존성을 갖지 않는다.
- View(뷰)
  - 화면(UI)을 표현한다. 사용자와 인터랙션(interaction)에 대한 책임을 갖는다.
  - 화면을 구성하는 반복되는 요소들을 재사용할 수 있도록 컴포넌트로 만들 필요가 있다.
  - 사용자가 만드는 이벤트를 감지하고, 필요하다면 뷰-모델에게 이벤트에 대한 처리를 요청한다. 
  - 화면 표현을 위해 필요한 데이터는 뷰-모델 컴포넌트로부터 전달 받는다.
- ViewModel(뷰-모델)
  - 뷰와 모델을 연결하는 책임을 갖는다.
  - 뷰에게 데이터나 커맨드(데이터를 변경하는 요청)을 노출한다.
  - 뷰에서 발생한 사용자 이벤트에 필요한 비즈니스 로직을 처리한다.
  - 모델에서 발생하는 데이터 변경을 뷰에게 전달(notify) 한다.

각 컴포넌트 별 책임에 대해서 간략하게 살펴봤다. 실제로 SwiftUI 프레임워크에서 MVVM 패턴을 적용하면 어떤 실행 흐름이 생길까? 사용자가 발생시키는 이벤트에서부터 내부 비즈니스 로직 처리까지 어떤 컴포넌트에서 어떤 일이 발생하는지 아래 그림을 통해 처리 흐름을 살펴보자. 

1. `뷰 컴포넌트`에서 사용자 이벤트가 발생한다.(e.g. 화면을 탭(tap)) `뷰 컴포넌트`는 사용자 이벤트 처리를 위해 `뷰-모델 컴포넌트`에게 작업을 요청한다. 
2. `뷰-모델 컴포넌트`는 데이터 변경이나 상태 확인이 필요할 경우 `모델 컴포넌트`에게 작업을 요청한다.
3. `모델 컴포넌트`는 받은 요청을 처리 후 결과를 `뷰-모델`에게 알린다. 함수의 반환 값처럼 동기적으로 처리될 수도 있고 클로저를 통한 비동기적인 처리일 수도 있다.
4. `뷰-모델 컴포넌트`는 자신이 관리하는 상태가 변경 된다면 이를 `뷰 컴포넌트`에게 알린다.
5. `뷰 컴포넌트`는 상태 변경을 감지하고 화면을 다시 그린다.

<p align="center">
  <img src="/images/posts/2024/mvvm-pattern-in-ios-01.png" width="80%" class="image__border">
</p>

## 2. How do we implement?

필자는 애플리케이션의 전반적인 아키텍처가 세 개의 그룹으로 나뉘는 것이나 각 그룹 별로 갖는 책임은 스프링 부트로 구성하는 백엔드 애플리케이션의 구조와 비슷하다고 느꼈다. 상태가 변경됨에 따라 화면이 다시 랜더링 되는 것은 리액트나 뷰(Vue) 같은 프론트엔드와 비슷하다는 생각이 들었다. 리액트나 스프링 부트가 익숙한 덕분에 MVVM 패턴의 컨셉을 쉽게 이해할 수 있었다. 

큰 그림은 살펴봤으니 이번엔 실제 SwiftUI 프레임워크를 사용해 구현한 애플리케이션 코드는 어떤 모습인지 살펴보자. [PokeApi](https://pokeapi.co/)라는 오픈 API 서버를 사용한다. 간단한 리스트 화면과 페이징 처리까지 구현했다.

### 2.1. Project Groups

예제 프로젝트는 다음과 같은 그룹 구조를 갖는다. 

- Domains
  - 도메인 객체들이 위치한다.
  - 모델, 뷰, 뷰-모델에서 모두 참조 가능하다.
- Models
  - 모델 객체들이 위치한다.
- ViewModels
  - 뷰-모델 객체들이 위치한다.
- Views
  - 뷰 컴포넌트가 위치한다.

```
./
├── ActionInBlogApp.swift
├── Assets.xcassets
│   ├── AccentColor.colorset
│   │   └── Contents.json
│   ├── AppIcon.appiconset
│   │   └── Contents.json
│   └── Contents.json
├── Domains
│   ├── Pokemon.swift
│   └── PokemonPage.swift
├── Models
│   └── PokemonRepository.swift
├── Preview Content
│   └── Preview Assets.xcassets
│       └── Contents.json
├── ViewModels
│   └── ContentViewModel.swift
└── Views
    └── ContentView.swift
```

### 2.2. ContentView View

뷰 컴포넌트의 기능을 살펴보자. 

1. 화면 페이징 처리를 위해 오프셋을 상태로 관리한다. 
  - @State 애너테이션을 추가하여 상태 변경이 가능하도록 만든다. 
  - 상태로 관리되면 프레임워크가 변경을 감지할 수 있다.
2. 뷰-모델 객체를 선언한다. 
  - 뷰-모델 객체도 상태로 관리될 수 있도록 @StateObject 애너테이션을 추가한다.
3. 뷰-모델 객체의 pokemons 데이터를 이용해 화면에 포켓몬 리스트를 표현한다. 
  - 뷰-모델 객체는 상태 객체로 관리되기 때문에 pokemons 값에 변경이 발생하는 경우 화면이 다시 그려진다.
4. 뷰 컴포넌트에서 버튼이 눌렸을 때 이벤트를 어떻게 처리할 것인지 정의한다. 
  - 예제는 prevPage, nextPage 함수가 호출된다. 
  - 각 함수는 뷰-모델 객체을 사용해 특정 오프셋의 데이터를 다시 조회힌다.
5. 최초 화면이 그려지기 전 뷰-모델 객체를 통해 데이터를 조회한다.

```swift
import SwiftUI

struct ContentView: View {
    
    @State var offset = 0 // 1
    @StateObject var viewModel = ContentViewModel() // 2
    
    private func prevPage() {
        let prevOffset = self.offset - 10
        self.offset = prevOffset < 0 ? offset : prevOffset
        viewModel.fetch(offset)
    }
    
    private func nextPage() {
        let nextOffset = self.offset + 10
        self.offset = nextOffset > viewModel.totalCount ? offset : nextOffset
        viewModel.fetch(offset)
    }
    
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Pokemon List").font(.title2)
            }
            .frame(height: 20)
            Divider().padding(.vertical ,20)
            ScrollView {
                // 3
                ForEach(viewModel.pokemons, id: \.name) { pokemon in
                    Text(pokemon.name)
                        .font(.body)
                        .frame(maxWidth: .infinity, minHeight: 50)
                        .border(.gray)
                }
            }
            Divider().padding(.vertical ,20)
            HStack {
                // 4
                Button(action: prevPage, label: {
                    Image(systemName: "arrow.backward.square").font(.title)
                })
                Button(action: nextPage, label: {
                    Image(systemName: "arrow.forward.square").font(.title)
                })
            }
            .frame(height: 20)
        }
        .padding(.all, 20)
        .onAppear() {
            // 5
            viewModel.fetch(offset)
        }
    }
}

#Preview {
    ContentView()
}
```

### 2.3. ContentViewModel Class

다음은 뷰-모델 객체를 살펴보자. 

1. 뷰 컴포넌트에서 상태 객체로 관리되기 위해선 ObservableObject 프로토콜을 따라야 한다. 
2. 모델 객체에게 데이터 조회를 의존한다.
3. 뷰에게 변경을 알릴 필요가 있는 데이터 앞에는 @Published 애너테이션을 추가한다. 
4. 모델 객체에게 데이터 조회를 요청한다.
5. 모델 객체로부터 전달 받은 결과로 뷰-모델 객체에서 관리하는 데이터를 업데이트한다.

```swift
import Foundation

class ContentViewModel: ObservableObject { // 1
    
    private let pokenmonRepository = PokemonRepository() // 2
    
    @Published var totalCount: Int = Int.max // 3
    @Published var pokemons: [Pokemon] = []
    
    func fetch(_ offset: Int) {
        Task {
            // 4
            guard let response = await self.pokenmonRepository.list(offset) else {
                return
            }
            // 5
            DispatchQueue.main.async {
                self.totalCount = response.count
                self.pokemons = response.results
            }
        }
    }
}
```

### 2.4. PokemonRepository Struct

모델 그룹에 위치한 레포지토리 객체 코드를 살펴보자.

1. [PokeApi](https://pokeapi.co/) 서버에 요청을 보낸다.
2. 응답 값을 도메인 객체로 디코딩(decoding)한다.

```swift
import Foundation

struct PokemonRepository {
    
    private let url = "https://pokeapi.co/api/v2/pokemon?limit=10&offset="

    func list(_ offset: Int) async -> PokemonPage?  {
        guard let url = URL(string: "\(url)\(offset)") else {
            return nil
        }
        do {
            let (data, _) = try await URLSession.shared.data(from: url) // 1
            return try JSONDecoder().decode(PokemonPage.self, from: data) // 2
        } catch {
            print(error.localizedDescription)
        }
        return nil
    }
}
```

## 3. iOS Simulator

iOS 시뮬레이터를 실행하면 다음과 같이 동작한다.

<p align="center">
  <img src="/images/posts/2024/mvvm-pattern-in-ios-02.gif" width="30%" class="image__border">
</p>

## CLOSING

이전 유데미에서 iOS 개발 강의를 들었을 적 UIKit 프레임워크를 사용했었다. UIKit 프레임워크에서 많이 사용하는 MVC 패턴을 구성하기 위해선 delegates, callbacks 같은 컴포넌트들을 통해 연결 고리를 만들어야만 했던 기억이 어렴풋이 난다. 당시에 필자는 그 구조가 상당히 복잡하다고 느꼈던 것 같다. 

이번 프로젝트에서 SwiftUI 프레임워크와 MVVM 패턴을 사용한 덕분인지 프로젝트 중반에 투입된 필자도 코드 흐름을 따라가기 수월했다. 개발자로 경력은 있지만, iOS 개발은 처음이기 때문에 이런 단순한 패턴이 프로젝트 컨텍스트를 파악하는데 큰 도움을 준 것 같다. 애플리케이션이 단순한 구조를 가질 수 있도록 SwiftUI 프레임워크가 뒤에서 많은 작업을 해준 덕분에 MVVM 패턴도 직관적이고 단순한 데이터 흐름을 가질 수 있게 된 것 같다. 

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-04-19-mvvm-pattern-in-ios>

#### REFERENCE

- <https://nalexn.github.io/clean-architecture-swiftui/>
- <https://gon125.github.io/posts/SwiftUI%EB%A5%BC-%EC%9C%84%ED%95%9C-%ED%81%B4%EB%A6%B0-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98/>
- <https://www.vadimbulavin.com/modern-mvvm-ios-app-architecture-with-combine-and-swiftui/>
- <https://medium.com/hcleedev/ios-swiftui%EC%9D%98-mvvm-%ED%8C%A8%ED%84%B4%EA%B3%BC-mvc%EC%99%80%EC%9D%98-%EB%B9%84%EA%B5%90-8662c96353cc>
