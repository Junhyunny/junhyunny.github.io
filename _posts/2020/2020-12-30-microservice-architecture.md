---
title: "MicroService Architecture"
search: false
category:
  - information
  - msa
last_modified_at: 2021-08-21T16:00:00
---

<br/>

## 0. 들어가면서

내 첫 프로젝트는 모놀리식 아키텍처(monilithic architecture)기반의 기존 시스템을 마이크로서비스 아키텍처(microservice architecture)로 재구성하는 일이었다. 기존 시스템은 약 20년 가까이 운영되어 온 덩치 큰 괴물이었고, 나는 이 시스템을 비즈니스 영역별로 해체, 재결합하는 개발 프로젝트와 안정화하는 운영 업무를 수행했다. 

이 포스트에선 간단하게 모놀리식 아키텍처와 마이크로서비스 아키텍처의 개념을 비교 정리하고, 마이크로서비스 아키텍처의 특징과 원칙에 대해 알아본다. 마지막으로 마이크로 서비스 설계시 겪었던 문제들을 정리해봤다.

## 1. Monilithic Architecture

> 모든 것이 하나의 프로젝트에 들어있는 아키텍처

기능들이 추가되더라도 같은 환경에서 개발하기 때문에 환경 구성에 큰 어려움이 없다. 하나의 프로젝트에 모든 기능들이 들어있기 때문에 쉽게 고가용성 서비스를 만들 수 있다. 

하지만 기능들이 추가되고 서비스 규모가 커짐에 따라 어플리케이션 기동, 빌드, 배포 등에 시간이 길어진다. 간단한 기능으로 코드 몇 줄을 추가하더라도 프로젝트 전체를 다시 빌드하고 배포해야 한다. 시간이 지나면서 최초 설계와 다른 방향으로 유지보수가 일어나게 되면 시스템의 구조가 망가지고 점점 수정하기 어려워진다. 추가되는 기능에 적합한 기술 스택을 선정하는 것이 어렵다. 기술이 발전함에 따라 시스템에 적용된 기술도 함께 발전해야 하지만, 이는 쉽지 않은 작업이고 시스템의 기술 부채가 증가한다. 

## 2. MicroService Architecture

> 마이크로서비스 아키텍처의 큰 특징은 어플리케이션을 비즈니스 단위로 세분화한다는 점이다. 각 기능을 서비스라고 부르며, 독립적으로 구축하고 배포할 수 있다.

모놀리식 아키텍처에 단점을 극복하기 위해 등장한 아키텍처다. 비즈니스 단위로 서비스를 개발하기 때문에 결합도는 자연스레 낮아지고 응집도는 높아진다. 추가되는 기능에 따라 적절한 기술 스택을 선택할 수 있으며 서비스가 가볍기 때문에 기동, 빌드, 배포에 걸리는 시간이 짧다. 

하지만 서비스들끼리 협업하는 분산 환경이기 때문에 통신에 따른 성능 이슈가 있다. 서비스 간에 트랜잭션이 필요한 경우에는 이를 별도로 처리해야 한다. 분산 환경이기 때문에 장애 포인트가 늘어나고 모니터링에 어려움을 겪을 수 있다. 한마디로 시스템의 복잡도가 증가한다. 모놀리식 아키텍처와 마이크로서비스 아키텍처 구조의 차이점을 정리해보자. 

- 모놀리식 아키택처는 `UI`, `Business Logic`, `Data Access Layer` 모두 하나의 서비스에 존재한다.
- 마이크로서비스 아키텍처는 `UI` 서비스와 비즈니스 특성에 맞게 설계된 서비스들이 서로 협업한다.

<p align="center">
  <img src="/images/posts/2020/microservice-architecture-01.png" width="80%" class="image__border"/>
</p>
<center>https://www.redhat.com/ko/topics/microservices/what-are-microservices</center>

## 3. Characteristic MicroService Architecture

### 3.1. Single Purpose

> **Do one thing, and do it well.**

마이크로 서비스는 단일 역량을 담당한다. 서비스 하나에 책임도 하나다. 이는 비즈니스와 관련될 수도 있고 제 3자(third party)와의 연계 같은 공유 기술 역량일 수도 있다. 이런 특징은 마이크로 서비스의 높은 응집도(high cohesion)로 이어진다.

### 3.2. Loose Coupling

마이크로 서비스는 각자 자신의 데이터 저장소에 대한 오너십을 가진다. 이는 서비스 결합력을 줄여주는데, 다른 서비스는 자신이 소유하지 않은 데이터에 접근할 때 데이터를 소유한 서비스가 제공한 인터페이스를 통해서만 접근이 가능하다.

### 3.3. High Cohesion

마이크로 서비스는 단일 비즈니스를 수행하기 때문에 서비스의 기능들은 자연스럽게 높은 응집도를 가지게 된다. 각 서비스는 모든 관련된 행위와 데이터를 캡슐화하여 관리한다. 새로운 기능을 구축해야하는 경우 모든 변경사항이 하나의 단일 서비스에서만 수정되도록 해야한다. 

<p align="center">
  <img src="/images/posts/2020/microservice-architecture-02.png" width="80%" class="image__border">
</p>
<center>https://medium.com/dtevangelist/microservice-at-medium-58214fd055b7</center>

## 4. MicroService Architecture Principles

마이크로 서비스 아키텍처는 다음과 같은 원칙을 따른다.

- 자율성(Autonomy)
  - 각 서비스는 다른 서비스와 독립적으로 변경되고 운영된다.
  - 자율성을 확실히 하기 위해 느슨한 결합이 필요하다.
  - 독립적으로 배포가 가능해야 한다.
- 회복성(Resilience)
  - 마이크로 서비스는 자연스러운 메커니즘을 통해 장애를 격리시킨다.
  - 독립적으로 배포하므로 어플리케이션 또는 인프라 장애는 시스템 일부에만 영향을 미친다.
  - 어플리케이션을 여러 서비스로 분리하여 장애를 격리시킬 수 있지만 장애 지점이 늘어나게 된다.
  - 장애가 발생할 때 확산을 막으려면 발생한 일을 처리해야 한다.
  - 가능한 부분은 비동기 처리를 한다.
  - 적절한 회로 차단기(circuit breaker)와 타임아웃(timeout)을 사용하도록 설계해야 한다.
- 투명성(Transparency)
  - MSA는 여러 서비스가 협업하기 때문에 시스템 어느 지점에서나 투명하고 관찰 가능해야 문제를 관찰하고 진단할 수 있다.
  - 이를 위한 비즈니스, 운영, 인프라스트럭처 메트릭(infrastructure metrics), 로그, 요청 추적 등을 생성해야 한다.
- 자동화(Automation)
  - MSA는 단일 어플리케이션을 개발하는 것보다 복잡한 아키텍처 구조를 가진다.
  - 자동화 된 CI/CD 파이프라인을 통해 배포와 운영을 안정적으로 수행해야 한다.

## 5. Problems in MSA Project

MSA 전환 프로젝트에서 겪었던 문제들을 정리해봤다. 먼저 기본 설계 시점에 현재 시스템을 업무 단위로 나누는 작업을 수행했다. 나는 비즈니스 도메인을 몰랐기 때문에 이론상 어려울 것은 없어 보였다. 하지만 기존 시스템을 비즈니스 영역 별로 분할할 때마다 눈에는 보이지 않던 걸림 돌들이 우리 팀의 발목을 잡았다. 최초 마이크로 서비스 설계시 도메인 전문가의 부재로 인해 잘못된 방향으로 시스템이 분할된 것이 문제의 큰 원인이 되었다. 도메인 전문가의 중요성을 이때 깨달았다. 잘못된 설계는 아래와 같은 문제점들을 저희 팀에게 안겨줬다.

> 업무 영역(domain context boundary)은 어떻게 나눠야 하나?

DDD(Domain Driven Design) 방법론을 통해 큰 업무를 독립적인 단위로 나누는 작업을 진행했다. 현장 근무자 입장에서 업무적인 독립성을 기준으로 업무를 분할하여 서비스로 도출해내는 작업이었다. 초기 잘못된 설계 방향으로 인해 시스템의 모듈 단위로 서비스가 분할되면서 특정 모듈 기능을 동기식 요청으로 제공받는 구조가 되었다. 이런 설계는 `단일 목적 수행`이라는 특징은 만족했지만, 특정 서비스로 API 요청이 과도하게 집중되어 전체 시스템의 성능이 떨어졌다. 동기식 요청 방식이 서비스 사이의 결합도를 높였기 때문에 마이크로서비스 아키텍처의 장점을 살리지 못한 결과를 가져다 줬다. 

> 트랜잭션 롤백(transaction rollback)은 어디까지 되어야 하나?

서비스별로 소유권을 가지는 테이블들이 생기면서 분산 환경에서의 트랜잭션 관리가 필요하게 되면서 다음과 같은 고려사항들이 생기기 시작했다. 

- 특정 서비스의 트랜잭션 실패는 이전 서비스들 중 어느 서비스까지 롤백 되어야 하는가?
- 서비스 별 다수의 인스턴스들 중 어떤 인스턴스가 해당 트랜잭션을 수행했는가?

마이크로 서비스의 설계가 잘 이루어졌다면 특정 서비스가 한 일은 다른 서비스의 업무와 독립적일테니 서비스들간의 트랜잭션 롤백에 대한 고민이 적었어야 한다고 생각이 최근 들었다.

> 모든 비즈니스에서 동시에 사용되는 테이블은 어떻게 관리할 것인가?

서비스 별로 테이블 소유권을 가지지만 특정 몇 개의 테이블들은 모든 서비스에서 필요했다. 시스템 모듈 단위로 마이크로 서비스를 설계하다 보니 서비스마다 공통으로 사용하는 테이블이 생기게 된 것이다. 이를 관리하기 위한 별도의 공유 서비스를 설계했다. 하지만 서비스 부하와 트랜잭션 관리의 어려움이 추가되었다.

> 문제 해결은 어떻게?

문제가 되는 서비스들을 하나씩 묶어나갔다. 트랜잭션 관리의 용이성, 비즈니스 독립성 등을 고려하면서 서비스들을 합쳤다. 최종적으로 48개 정도의 마이크로 서비스들을 8개의 서비스로 통합했다. 서비스들이 합쳐지면서 `마이크로`라고 부르기엔 다소 크기가 큰 모습이 되었었다.

## CLOSING

마이크로 서비스 아키텍처의 성공적인 설계를 위한 핵심은 비즈니스 도메인에 대한 전문성이라고 생각된다. 비즈니스 도메인의 업무 영역을 의미있게 분할해야지 독립적이고 자율성 있는 마이크로 서비스를 도출해낼 수 있다. 마이크로 서비스 아키텍처가 모든 비즈니스에 적합하진 않다는 생각이 들었고, 비즈니스 도메인에 대한 높은 이해도가 아키텍처 설계의 승패를 가른다는 사실을 경험했다.

#### RECOMMEND NEXT POSTS

- [Pros and Cons of MicroService Architecture][msa-pros-and-cons-link]
- [MSA API Gateway][msa-api-gateway-link]
- [MicroService Architecture Release Strategy][msa-release-link]
- [Saga Pattern And Distributed Transaction][distributed-transaction-link]

#### REFERENCE

- <https://alwayspr.tistory.com/19>
- <https://alwayspr.tistory.com/20>
- <https://12bme.tistory.com/517>
- <https://medium.com/dtevangelist/microservice-at-medium-58214fd055b7>
- <https://www.redhat.com/ko/topics/microservices/what-are-microservices>
- [(마이크로 서비스 vs 모놀리식 아키텍처) MicroService vs Monolithic Architecture 간단 소개 및 주관적 의견][msa-blog-link]

[msa-blog-link]: https://lion-king.tistory.com/entry/%EB%A7%88%EC%9D%B4%ED%81%AC%EB%A1%9C-%EC%84%9C%EB%B9%84%EC%8A%A4-vs-%EB%AA%A8%EB%86%80%EB%A6%AC%EC%8B%9D-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-MicroService-vs-Monolithic-Architecture-%EA%B0%84%EB%8B%A8-%EC%86%8C%EA%B0%9C-%EB%B0%8F-%EC%A3%BC%EA%B4%80%EC%A0%81-%EC%9D%98%EA%B2%AC

[msa-pros-and-cons-link]: https://junhyunny.github.io/msa/msa-pros-and-cons/
[msa-api-gateway-link]: https://junhyunny.github.io/msa/msa-api-gateway/
[msa-release-link]: https://junhyunny.github.io/msa/msa-release/
[distributed-transaction-link]: https://junhyunny.github.io/msa/design-pattern/distributed-transaction/