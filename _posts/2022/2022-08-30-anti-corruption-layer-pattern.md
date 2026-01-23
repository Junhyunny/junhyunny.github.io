---
title: "부패 방지 계층 패턴 (Anti-Corruption Layer)"
search: false
category:
  - architecture
  - pattern
last_modified_at: 2026-01-23T00:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Facade Pattern][facade-pattern-link]
- [어댑터 패턴 (Adapter Pattern)][adapter-pattern-link]

## 1. Anti-Corruption Layer

부패 방지 계층(anti-corruption layer)은 Eric Evans의 DDD(Domain Driven Development)에서 등장한 개념이다. 레거시(legacy) 시스템을 새로운 시스템으로 여러 단계에 걸쳐 이전할 때 사용할 수 있는 패턴(pattern)이다. 간단한 그림을 통해 개념을 이해해본다.

- 다음과 같은 레거시 시스템이 존재한다.
  - 모놀리스 아키텍처로 구성된 하나의 서비스다.
  - 주문, 상품, 결제, 고객과 관련된 비즈니스 컴포넌트(component)들로 구성되어 있다.
- 새로운 시스템은 마이크로서비스 아키텍처다.
  - 레거시 시스템의 컴포넌트 단위로 서비스를 이전(migration)하고 있다.
  - 고객 서비스는 이미 이전했다.
- 고객 기능은 레거시 시스템에서도 주문과 결제 기능을 함께 사용했다.
- 신규 시스템에 이전한 고객 서비스도 아직 이동하지 못한 레거시 시스템의 주문, 결제 기능이 필요하다.
- 신규 시스템은 부패 방지 계층(ACL, Anti-Corruption Layer)을 통해 필요한 레거시 기능을 사용한다.

<div align="center">
  <img src="/images/posts/2022/anti-corruption-layer-pattern-01.png" width="100%" class="image__border">
</div>

## 2. Why do we use anti-corruption layer?

왜 부패 방지 계층을 왜 사용할까? 신규 시스템으로 이전하는 과정에서 일부 기능만 옮기면 레거시 시스템의 기능이 필요한 경우가 있다. 시스템 연계는 다음과 같은 어려움을 만날 수 있다.

- 서로 다른 플랫폼의 인프라스트럭처(infrastructure) 계층
- 서로 다른 통신 프로토콜 사용 (e.g. SOAP, Restful)
- 서로 다른 데이터 타입 사용
- 서로 다른 도메인 모델 설계 방향

이는 타 시스템(3rd party system)과 연계하더라도 마찬가지다. 시스템 연계의 어려움에 타협하여 레거시 시스템에서 사용하는 기능이나 도메인 모델이 신규 시스템으로 침투하면 새로운 시스템의 설계 의도나 도메인 모델이 전체적으로 매몰될 수 있다. 레거시 시스템의 데이터 모델은 대체로 좋지 않고, 신규 시스템의 모델과 다른 모습을 가진다. 만약 두 시스템이 직접 데이터를 주고받는 경우 잘못된 해석이 발생하면 시스템 에러나 데이터베이스를 오염시킬 수 있다.

두 시스템이 망가지는 것을 막고자 중간에서 도메인 모델을 변경하거나 프로토콜을 맞춰주는 부패 방지 계층을 만든다. 새로운 도메인 모델과 다른 시스템의 모델을 양방향으로 변경해주며 설계에 따라 통신 방법을 결정한다.

## 3. How to implement?

다양한 레퍼런스들에서 다른 모습으로 내부 구조를 설명하고 있다. [도메인 주도 설계 - 소프트웨어의 복잡성을 다루는 지혜][ddd-book-link] 책에서 설명하는 구조를 기준으로 정리했다. 개념적인 구조일 뿐 100% 일치할 수 없으므로 프로젝트 상황과 요구사항에 따라 구현 방식과 기술을 결정한다.

부패 방지 계층의 구조는 크게 4개 요소로 구성된다.

- Service
  - 외부 시스템에서 부패 방지 레이어를 호출할 수 있는 API(Application Programming Interface) 기능들이다.
- Adapter
  - [어댑터 패턴][adapter-pattern-link]을 적용한다.
  - 중간 어댑터 클래스로 신규 서비스의 기능과 레거시 시스템의 기능을 연결한다.
  - 번역기(Translator)를 사용하여 신규 모델과 레거시 모델 사이의 변경을 수행한다.
- Translator
  - 신규 시스템 모델과 레거시 시스템 모델 사이의 변경을 처리한다.
  - 대칭적으로 번역하기 위해 동일한 번역기를 사용한다.
- Facade
  - [퍼사드 패턴][facade-pattern-link]을 적용한다.
  - 뒤죽박죽인 인터페이스들로 구성된 서브 시스템을 획일화 된 하나의 인터페이스로 묶어 쉽게 사용하도록 제공한다.
  - 필요한 것만 보기 위한 인터페이스 설계이며 하위 시스템에 대한 접근을 단순화한다.

<div align="center">
  <img src="/images/posts/2022/anti-corruption-layer-pattern-02.png" width="100%" class="image__border">
</div>

## 4. Considerations

추가적으로 어떤 것들을 고려해야 하는지 정리했다.

- 호출 지연(latency)
  - 추가적인 레이어를 통한 통신으로 인해 호출 지연 문제가 발생할 수 있다.
- 부패 방지 계층 서비스 관리
  - 별도 서비스(standalone)로 구현된다면 관리가 필요하다.
  - 모니터링을 통한 정상적인 동작 확인이 필요하다.
- 영구적인(permanent) 사용 여부
  - 시스템이 모두 이전된 이후 부패 방지 계층을 유지할 것인지 폐기할 것인지 결정한다.
  - 레거시 시스템 이외에 타 시스템과 연결하는 데 사용한다면 이를 유지한다.
  - 모든 레거시 시스템 이전이 불가능하고, 새 시스템과 레거시 간의 통합을 유지해야 하는 경우 유지한다.
- 복잡성(complexity)
  - 새로운 계층을 통해 통신이 이뤄지므로 시스템의 복잡도가 증가한다.
  - 필요에 따라서는 부패 방지 계층을 여러 개 만들어 사용할 수 있다.

#### REFERENCE

- [도메인 주도 설계 - 소프트웨어의 복잡성을 다루는 지혜][ddd-book-link]
- <https://sarc.io/index.php/cloud/2027-cdp-anti-corruption-layer\>
- <https://softwareengineering.stackexchange.com/questions/356116/how-to-design-anti-corruption-layer-in-ddd\>
- <https://www.youtube.com/watch\?v\=7fT6B7lO9OU\>
- <https://www.youtube.com/watch\?v\=YYezGu43zkU\>

[facade-pattern-link]: https://junhyunny.github.io/information/design-pattern/facade-pattern/
[adapter-pattern-link]: https://junhyunny.github.io/information/design-pattern/adapter-pattern/
[ddd-book-link]: https://www.kyobobook.co.kr/product/detailViewKor.laf\?mallGb\=KOR\&ejkGb\=KOR\&barcode\=9788992939850