---
title: "MSA API Gateway"
search: false
category:
  - msa
last_modified_at: 2021-08-21T16:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [MicroService Architecture][microservice-architecture-link]

## 0. 들어가면서

마이크로서비스 아키텍처에서 마이크로 서비스는 최소 2개 이상 존재합니다. 
만약 필요에 의해 데이터를 여러 서비스들에게 분산하여 요청하게 된다면 클라이언트 프로그램 코드는 좋지 않은 모습을 가지게 됩니다. 
`API 게이트웨이(gateway)`를 이용하면 API 서버들을 하나로 묶어서 단일화 관리할 수 있고, 클라이언트는 하나의 호스트를 통해 여러 서비스들에게 데이터를 요청할 수 있습니다. 

또, 마이크로서비스 아키텍처에서 입구 역할을 하는 `API 게이트웨이`는 API 서버들의 엔드 포인트(end point) 단일화, 인증, 인가, 라우팅 등의 여러 가지 기능을 수행합니다. 
JSON/REST 기반으로 최소한의 기능을 처리하는 경량화 서비스인 API 게이트웨이가 제공하는 기능들을 이번 포스트에 정리하였습니다. 

<p align="center">
    <img src="/images/msa-api-gateway-1.JPG" width="100%" class="image__border">
</p>
<center>마이크로소프트-.NET 마이크로 서비스 - 아키텍처 eBook</center>

## 1. API 게이트웨이 주요 기능

### 1.1. 인증 및 인가 (Authentication and Authorization)

> API 게이트웨이의 가장 기본적인 기능은 API 에 대한 인증과 인가 관련 기능입니다. 

인증(Authentication)은 API를 호출하는 클라이언트에 대한 신분 확인을 수행하는 기능입니다. 
인가(Authorization)는 인증 받은 클라이언트가 API를 호출할 수 있는 권한이 있는지 확인하는 기능입니다. 
인증과 인가에 대한 로직이 모든 마이크로 서비스에 존재할 필요는 없습니다. 
코드 중복 등으로 인해 관리가 어려워지는 현상을 유발하기도 합니다. 
모든 클라이언트 요청들이 통과하는 API 게이트웨이 내에서 인증과 인가에 대한 프로세스를 수행하면 다른 마이크로 서비스들은 한층 더 부담을 줄일 수 있습니다. 

### 1.2. API Routing

API 라우팅(routing) 기능을 이용해 다음과 같은 서비스가 가능합니다.

* 로드 밸런싱(load balancing)
* 서비스 및 클라이언트 별 엔드포인트 라우팅
* 메세지 혹은 헤더 기반 라우팅

### 1.3. 공통 로직 수행

API 게이트웨이 특성상 모든 API 서버 앞 쪽에 위치하며, 모든 API 호출이 API 게이트웨이를 거쳐갑니다. 
모든 API가 공통적으로 처리해야하는 공통 기능들을 API 게이트웨이에 구현하게 되면 API 서버들은 더욱 비즈니스에 집중할 수 있습니다. 

<p align="center">
    <img src="/images/msa-api-gateway-2.JPG" width="75%" class="image__border">
</p>
<center>MSA 아키텍쳐 구현을 위한 API 게이트웨이의 이해 #1</center>

### 1.4. 중개(Mediation) 기능

API 게이트웨이는 다음과 같은 중재 기능을 수행합니다. 
서비스가 제공하는 API 형태가 클라이언트가 원하는 형태와 다를 때 이 기능을 수행합니다. 

* 메세지 포맷 변환(message format transformation)
* 프로토콜 변환
* 메세지 호출 패턴 변환(message exchange pattern), 동기식 / 비동기식 호출 패턴을 변환
* 어그리게이션(aggregation), 여러 개의 API를 묶어서 하나의 API로 병합

### 1.5. 로깅(Logging)

API 호출시 API 게이트웨이는 공통적으로 호출되는 서비스이므로 모든 로그를 중간에서 수집하기 좋습니다. 
API 호출 로그는 사용자 사용 패턴 분석이나 문제 발생시 문제를 추적하기 위한 자료로 사용됩니다. 

### 1.6. API 미터링(Metering)과 차징(Charging)

유로 API 서비스를 위한 기능으로 미터링은 과금을 위한 API 호출 횟수, 클라이언트 IP, API 종류, IN/OUT 용량들을 측정, 기록하는 서비스입니다. 
차징은 미터링이 된 자료를 기반으로 API 서비스 사용 금액을 정책에 따라서 계산할 수 있습니다. 

## CLOSING

API 게이트웨이의 기능들에 대해 간략하게 정리해보았습니다. 
예시나 사례는 [MSA 아키텍쳐 구현을 위한 API 게이트웨이의 이해 #1][cho-blog-link]에 상당히 구체적으로 작성되어 있습니다. 

#### RECOMMEND NEXT POSTS

* [Pros and Cons of MicroService Architecture][msa-pros-and-cons-link]
* [MicroService Architecture Release Strategy][msa-release-link]
* [Spring Cloud Gateway][spring-cloud-gateway-link]

#### REFERENCE

* [.NET 마이크로 서비스 - 아키텍처 eBook][microsoft-ebook-link]
* [MSA 아키텍쳐 구현을 위한 API 게이트웨이의 이해 #1][cho-blog-link]

[microsoft-ebook-link]: https://docs.microsoft.com/ko-kr/dotnet/architecture/microservices/architect-microservice-container-applications/direct-client-to-microservice-communication-versus-the-api-gateway-pattern
[cho-blog-link]: https://bcho.tistory.com/1005

[microservice-architecture-link]: https://junhyunny.github.io/information/msa/microservice-architecture/

[msa-pros-and-cons-link]: https://junhyunny.github.io/msa/msa-pros-and-cons/
[msa-release-link]: https://junhyunny.github.io/msa/msa-release/
[spring-cloud-gateway-link]: https://junhyunny.github.io/information/spring-boot/spring-cloud/spring-cloud-gateway/