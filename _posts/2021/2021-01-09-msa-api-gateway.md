---
title: "API 게이트웨이(gateway)"
search: false
category:
  - msa
last_modified_at: 2021-08-21T16:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [MicroService Architecture][microservice-architecture-link]

## 1. API Gateway

마이크로서비스 아키텍처는 전체 시스템을 각자 책임에 맡은 여러 개의 서비스들로 분산한 아키텍처이다. 여기서 말하는 책임이란 간단한 예로 들면 온라인 쇼핑이라는 거대한 이커머스 도메인을 구성하는 사용자 관리, 주문, 결제, 배송 같은 비즈니스 도메인으로 분리하는 것을 의미한다. 그리고 분리된 비즈니스 도메인을 처리하는 서비스들의 협업으로 전체 시스템을 구성하는 것이다. 각 요청 트래픽은 자신을 처리해줄 수 있는 적합한 서비스에게 전달되어야 하지만, 여러 서비스가 있다보니 클라이언트 애플리케이션(e.g. 웹 서비스, 모바일 애플리케이션) 측에서 어떤 서비스로 요청을 보내야할지 분기하는 것이 여간 쉬운 일이 아니다. 클라이언트 측에서 이를 처리하려면 코드 복잡도가 상당히 높아질 것이 분명하다.

이를 해결하기 위한 컴포넌트가 `API 게이트웨이(gateway)`이다. 클라이언트 애플리케이션 입장에선 API 서버들을 하나로 묶어 단일화 한 것처럼 보이기 때문에 게이트웨이 하나의 호스트를 통해 여러 API 서비스에 접근할 수 있다. 

<p align="center">
  <img src="/images/posts/2021/msa-api-gateway-01.png" width="100%" class="image__border">
</p>
<center>마이크로소프트-.NET 마이크로 서비스 - 아키텍처 eBook</center>

<br/>

API 게이트웨이는 엔드포인트 단일화를 위해서만 사용되는 컴포넌트는 아니다. 여러가지 책임을 게이트웨이에 부여할 수 있다.

- 인증과 인가
- 라우팅(routing)
- 공통 로직
- 중개(mediation)
- 로깅
- API 미터링(metering)과 차징(charging)

인증(Authentication)은 API를 호출하는 클라이언트에 대한 신분 확인하는 작업이다. 인가(Authorization)는 인증 받은 클라이언트가 API를 호출할 수 있는 권한이 있는지 확인하는 작업이다. 인증과 인가에 대한 로직이 모든 마이크로 서비스에 존재할 필요는 없습니다. 암호화/복호화라는 비싼 연산이 포함되기 때문에 어떤 경우엔 불합리할 수 있다. 인증/인가에 관련된 코드들이 중복되거나 비밀 키 같은 값에 싱크(sync)가 맞지 않으면 시스템 장애가 날 수도 있다. 모든 요청 트래픽에 대해 API 게이트웨이 내에서 인증과 인가에 대한 프로세스를 수행하면 다른 마이크로 서비스들은 한층 더 부담을 줄일 수 있다. 

라우팅 기능을 게이트웨이에 구현하면 로드 밸런싱(load balancing), 서비스 및 클라이언트 별 엔드포인트 라우팅, 메시지 혹은 헤더 기반 라우팅이 가능하다.

API 게이트웨이는 특성상 모든 API 서버 앞 쪽에 위치한다. 즉, 모든 트래픽이 API 게이트웨이를 거쳐간다. 모든 트래픽에 대해 공통적으로 처리해야 하는 공통 기능들을 API 게이트웨이에 구현하면 다른 API 서비스들 비즈니스에 집중할 수 있다. 게이트웨이는 로그를 수집하기에도 매우 좋은 곳에 위치한다. API 호출 로그는 사용자 사용 패턴을 분석하거나 문제 발생시 이를 추적하기 위한 자료로 사용된다.

<p align="center">
  <img src="/images/posts/2021/msa-api-gateway-02.png" width="75%" class="image__border">
</p>
<center>MSA 아키텍쳐 구현을 위한 API 게이트웨이의 이해 #1</center>

<br/>

API 게이트웨이는 중재 기능을 수행하는 것이 가능하다. 중재란 서비스가 제공하는 각 API 서버의 응답 스키마(schema)가 클라이언트가 원하는 응답 스키마와 다를 때 이를 맞춰주는 작업을 의미한다. 예를 들면 다음과 같은 중재 작업들이 있다.

- 메시지 포맷 변환(message format transformation)
- 프로토콜 변환
- 메시지 호출 패턴 변환(message exchange pattern), 동기식/비동기식 호출 패턴을 변환
- 어그리게이션(aggregation), 여러 개의 API를 묶어서 하나의 API로 병합

만약, 유로 API 서비스를 제공한다면 각 사용자마다 API 사용량을 분석해야 한다. API 게이트웨이는 과금을 위한 API 호출 횟수, 클라이언트 IP, API 종류, IN/OUT 트래픽 사용량을 측정하고 기록하는 미터링을 수행하기 좋다. 서비스 업체는 미터링 된 데이터를 기반으로 사용 금액을 정책에 따라 비용을 청구(charging)하는 것이 가능하다.

## CLOSING

API 게이트웨이의 기능들에 대해 간략하게 정리해보았습니다. 예시나 사례는 [이 글][cho-blog-link]에 상당히 구체적으로 작성되어 있다. 

#### RECOMMEND NEXT POSTS

- [마이크로서비스 아키텍처(MicroService Architecture) 배포 전략][msa-release-link]
- [Spring Cloud Gateway][spring-cloud-gateway-link]

#### REFERENCE

- [.NET 마이크로 서비스 - 아키텍처 eBook][microsoft-ebook-link]
- [MSA 아키텍쳐 구현을 위한 API 게이트웨이의 이해 #1][cho-blog-link]

[microsoft-ebook-link]: https://docs.microsoft.com/ko-kr/dotnet/architecture/microservices/architect-microservice-container-applications/direct-client-to-microservice-communication-versus-the-api-gateway-pattern
[cho-blog-link]: https://bcho.tistory.com/1005

[microservice-architecture-link]: https://junhyunny.github.io/information/msa/microservice-architecture/
[msa-release-link]: https://junhyunny.github.io/msa/msa-release/
[spring-cloud-gateway-link]: https://junhyunny.github.io/information/spring-boot/spring-cloud/spring-cloud-gateway/