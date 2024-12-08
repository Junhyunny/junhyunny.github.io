---
title: "Backend For Frontend"
search: false
category:
  - architecture
  - pattern
last_modified_at: 2022-09-01T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [MicroService Architecture][microservice-architecture-link]

## 1. Pain Points for Frontend

`Backend For Frontend(이하 BFF)`이 무엇인지 알아보기 전에 어떤 이유로 이런 아키텍처 패턴이 탄생했는지 컨텍스트(context)를 먼저 살펴보겠습니다. 

### 1.1. 새로운 디바이스 타입의 등장

오래 전 사용자들은 웹 UI 기반의 어플리케이션 서비스들을 이용하였습니다. 
스마트 폰의 등장과 함께 모바일 어플리케이션 시장이 빠르게 성장했습니다.  
기존 웹 UI 어플리케이션의 기존 백엔드 서비스가 모바일 어플리케이션의 요구사항까지 함께 지원하는 범용 서비스가 되면서 문제가 발생합니다. 

* 모바일의 기능, 인터랙션(interaction), 성능, 디스플레이 측면에서 데스크탑(desktop)과 다릅니다.
    * 화면에 보여주는 데이터가 달라지기 때문에 백엔드에게 요구하는 API 요구사항이 다릅니다.
* 기존 백엔드 서비스의 API 기능들은 모바일 요구사항을 충족시키지 못 합니다. 
* 상충되는 요구사항으로 백엔드 개발 프로세스에 병목(bottleneck)이 생기면서 프론트엔드 서비스의 시장 진입이 늦어집니다.(time to market)
* 백엔드 서비스가 여러 플랫폼의 요구사항들을 만족하기 위해 모든 데이터를 내리게 되는 상황으로 이어질 수 있습니다. 

<p align="center">
    <img src="/images/backend-for-frontend-1.JPG" width="80%" class="image__border">
</p>

### 1.2. 마이크로서비스 아키텍처(MSA)

빠르게 변경되는 비즈니스 요구사항에 기민하게 대처하기 위한 마이크로서비스 아키텍처가 등장하였습니다. 
많은 시스템들이 마이크로서비스 아키텍처로 전환되면서 프론트엔드 서비스에 문제가 발생합니다. 

* 한 화면에서 보여줘야하는 데이터 조각들을 각기 다른 서비스들로부터 받아야하는 경우가 발생합니다.
* 단일 페이지에서 다른 서비스들에게 따로 API 요청을 수행하게 됩니다.
* 프론트엔드 서비스는 받은 데이터를 조작하고, 재조합하여 필요한 포맷(format)으로 만들어 사용합니다.
* 프론트엔드 서비스에 불필요한 비즈니스 로직이 침투될 수 있고, 브라우저 리소스는 과도하게 사용하게 됩니다.

<p align="center">
    <img src="/images/backend-for-frontend-2.JPG" width="80%" class="image__border">
</p>

## 2. Backend For Frontend

> 프론트엔드 서비스를 위한 백엔드 서비스

위와 같은 문제들을 마주쳤을 때 `BBF` 서비스 레이어를 적용할 수 있습니다. 
`BFF`는 일관된 사용자 경험을 위해 특정 프론트엔드 서비스만을 위한 백엔드 서비스입니다. 
프론트엔드 서비스는 `BFF`의 도움으로 비즈니스 로직을 최소화할 수 있습니다. 
또, UI 표현과 사용자 경험(UX, User eXperience)에 집중할 수 있습니다. 

`BFF`는 다음과 같은 역할을 수행합니다. 

* 다른 플랫폼의 프론트엔드 서비스들에게 각각 전용 API를 제공합니다. 
* 각 프론트엔드 서비스들이 필요한 데이터를 수집하고, 원하는 데이터 포맷을 만들어 전달합니다.
* 프론트엔드 서비스가 마이크로 서비스들의 리소스를 얻을 수 있도록 간단한 인터페이스를 제공합니다. 

##### BFF 레이어 개념도

<p align="center">
    <img src="/images/backend-for-frontend-3.JPG" width="80%" class="image__border">
</p>

## 3. Benefits

`BFF` 패턴을 적용하면 얻을 수 있는 이점들을 정리하였습니다. 

* 관심사 분리(separation of concerns)
    * 프론트엔드 서비스의 요구사항들이 백엔드 서비스의 관심사들과 분리됩니다.
    * 대신 프론트엔드 서비스의 요구사항들은 `BFF`와 밀접한 관계가 생깁니다.
    * 프론트엔드 서비스 팀이 `BFF` 개발을 주도하면 백엔드 개발 프로세스와의 의존성을 낮출 수 있습니다.
* API 변경 및 관리가 용이
    * 각기 다른 종류의 프론트엔드 서비스들이 각자 필요한 API 기능들을 자신의 `BFF`에 구현합니다.
    * 각 프론트엔드 서비스만을 위한 API 버전 관리가 가능합니다.
* 에러 핸들링
    * 마이크로 서비스들로부터 받는 에러들은 사용자들에게 무의미할 수 있습니다.
    * `BFF`는 데이터를 수집하고 포맷하는 과정에서 발생하는 에러를 사용자들에게 의미있도록 만들어 전달합니다. 
    * 필요한 데이터를 수집하는 과정에서 일부 요청이 실패하는 경우에 대한 정책을 쉽게 정할 수 있습니다. 
* 보안성 강화
    * 프론트엔드 서비스에서 불필요한 데이터나 민감한 정보를 보내지 않습니다.

## 4. Considerations

`BFF` 패턴을 적용하기 전에 몇 가지 고려해 볼 사항들이 있습니다. 
프로젝트의 컨텍스트와 팀이 따르는 아키텍처 플랜을 고려하여 최선을 선택합니다. 

* 언제 적용이 필요한가?
    * 여러 사용자 플랫폼을 지원하는 경우
    * 특정 클라이언트 서비스의 요구사항이 자주 바뀌는 경우
    * 마이크로서비스 아키텍처에서 여러 서비스들로부터 데이터 조각들을 수집하는 경우
    * 외부 서비스들의 API를 사용하는 경우
* 서비스 종류
    * `BFF`를 어느 수준까지 나눌지 고민이 필요합니다.
    * 예를 들어 iOS 앱과 Android 앱을 위한 `BFF`가 각자 필요한지, 모바일을 위한 `BFF`를 하나만 만들지 고민합니다.
    * `BFF` 적용 여부는 기기 타입이 아닌 사용자 경험에 적합한지 여부를 기준으로 판단합니다.
* 코드 중복 문제
    * `BFF`마다 유사한 사용자 경험을 제공하다보면 코드 중복이 발생합니다.
    * 중복되는 코드는 추상화와 리팩토링을 통해 최대한 줄여나갑니다.
    * 중복되는 코드를 공통 라이브러리로 만들 수 있지만, 공통 라이브러리에 대한 의존도가 높이게 됩니다.
    * 비용이 낮고, 여유가 있다면 공통 코드를 별도의 서비스로 도출해볼 수도 있습니다.
* 데이터 수집시 비동기 병렬 처리
    * 다른 마이크로 서비스들로부터 데이터 조각들을 수집하는 경우 비동기 병렬 처리를 고려할 수 있습니다.
    * 리액티브 스타일의 프로그래밍이 도움이 될 수 있습니다. 
    * e.g. `Finagle's Future System` 혹은 `RxJava`

## 5. Curiosities

`BFF` 레이어에 대해 공부하면서 문득 떠오른 몇 가지 궁금증들에 대한 내용을 함께 정리하였습니다.

### 5.1. BFF 레이어를 통해 커맨드(command) 요청을 수행하나?

커맨드는 서비스의 상태를 바꿀 수 있는 `CUD` 요청을 의미합니다. 
`BFF`는 프론트엔드 서비스와 밀접하게 연결된 구조라 커맨드 요청도 굳이 `BFF`를 거쳐야하는지 의문스러웠습니다. 
`BFF` 구현을 위한 팁을 정리한 포스트에서 다음과 같은 설명을 보고 아니라고 판단했습니다.

* `BFF`에는 프레젠테이션(presentation) 로직만 포함되는지 확인합니다.
    * 어플리케이션은 보통 다음과 같은 로직들을 가지고 있으며, `BFF`는 프레젠테이션 로직만 가지도록 합니다.
    * 프레젠테이션 로직(presentation logic) - 정확한 UI 포맷을 위해 백엔드 서비스의 데이터를 번역합니다.
    * 흐름 혹은 구성 로직(flow or composition logic) - 컴포넌트들이 통신하는 방법을 정의합니다.
    * 도메인 로직(domain logic) - 핵심 비즈니스를 수행합니다.
    * 영속성 로직(persistence logic) - 데이터를 내부적으로 언제, 어떻게 저장할지 결정합니다.

### 5.2. API 게이트웨이 서비스랑 차이점은?

`BFF` 관련된 내용을 가볍게 살펴봤을 때 API 게이트웨이 서비스와 무엇이 다른지 이해가 안 됐습니다. 
여러 글들을 읽다보니 `BFF`는 API 게이트웨이와 유사하지만 다르다는 인사이트(insight) 얻었습니다. 

* API 게이트웨이는 프론트엔드의 요청을 백엔드 서비스로 전달하고 받은 응답을 변경하지 않습니다.
* `BFF`는 프론트엔드 서비스에서 필요한 데이터를 만들어 전달합니다.
* `BFF`는 프론트엔드 서비스에서 `UI/UX`에 필요한 API만 제공합니다.

### 5.3. 요청 지연(latency)은 괜찮은가?

서비스 계층이 하나 더 생겨서 발생하는 지연은 최적화되지 않은 프론트엔드 코드로 브라우저의 리소스를 과도하게 사용하면서 발생하는 속도 지연에 비해선 별거 아니라는 의견들이 많았습니다. 

#### REFERENCE

* <https://samnewman.io/patterns/architectural/bff/>
* <https://fe-developers.kakaoent.com/2022/220310-kakaopage-bff/>
* <https://dev.to/adelhamad/bff-backend-for-frontend-design-pattern-with-nextjs-3od0>
* <https://docs.microsoft.com/ko-kr/azure/architecture/patterns/backends-for-frontends>
* <https://blog.bitsrc.io/bff-pattern-backend-for-frontend-an-introduction-e4fa965128bf>
* <https://medium.com/mobilepeople/backend-for-frontend-pattern-why-you-need-to-know-it-46f94ce420b0>
* <https://www.techtarget.com/searchapparchitecture/tip/Using-the-BFF-pattern-to-keep-UIs-flexible-and-reliable>
* <https://philcalcado.com/2015/09/18/the_back_end_for_front_end_pattern_bff.html>

[microservice-architecture-link]: https://junhyunny.github.io/information/msa/microservice-architecture/