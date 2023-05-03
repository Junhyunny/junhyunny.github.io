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

저의 첫 프로젝트는 모놀리식 아키텍처(monilithic architecture)기반의 기존 시스템을 마이크로서비스 아키텍처(microservice architecture)로 재구성하는 일이었습니다. 
기존 시스템은 약 20년 가까이 운영되어 온 덩치 큰 괴물이었습니다. 
저는 이 시스템을 비즈니스 영역별로 해체, 재결합하는 개발 프로젝트를 마치고, 안정화하는 운영 업무를 수행하였습니다. 

이번 포스트에선 간단하게 모놀리식 아키텍처와 마이크로서비스 아키텍처의 개념에 대해 정리하고, 마이크로서비스 아키텍처의 특징과 원칙에 대해 알아보겠습니다. 
마지막으로 마이크로 서비스 설계시 제가 겪었던 문제들에 대해 이야기해보겠습니다. 

## 1. 모놀리식 아키텍처(Monilithic Architecture)

> 모든 것이 하나의 프로젝트에 들어있는 아키텍처

기능들이 추가되더라도 같은 환경에서 개발하기 때문에 환경 구성에 큰 어려움이 없습니다. 
하나의 프로젝트에 모든 기능들이 들어있기 때문에 쉽게 고가용성 서비스를 만들 수 있습니다. 

하지만 기능들이 추가되고 서비스 규모가 커짐에 따라 어플리케이션 기동, 빌드, 배포 등에 시간이 길어집니다. 
간단한 기능을 위해 몇 줄의 코드를 추가하더라도 프로젝트 전체를 다시 빌드하고 배포해야 합니다. 
시간이 지나면서 최초 설계와 다른 방향으로 유지보수가 일어나게 되면 시스템의 구조가 망가지고 점점 수정하기 어려워집니다. 
추가되는 기능에 적합한 기술 스택을 선정하는 것이 어렵습니다. 
기술이 발전함에 따라 시스템에 적용된 기술도 함께 발전해야 하지만, 이는 쉽지 않은 작업이고 시스템의 기술 부채가 증가합니다. 

## 2. 마이크로서비스 아키텍처(MicroService Architecture)

> 마이크로서비스 아키텍처의 큰 특징은 어플리케이션을 비즈니스 단위로 세분화한다는 점입니다.<br/>
> 각 기능을 서비스라고 부르며, 독립적으로 구축하고 배포할 수 있습니다.

모놀리식 아키텍처에 단점을 극복하기 위해 등장한 아키텍처입니다. 
비즈니스 단위로 서비스를 개발하기 때문에 결합도는 자연스레 낮아지고 응집도는 높아집니다. 
추가되는 기능에 따라 적절한 기술 스택을 선택할 수 있으며 서비스가 가볍기 때문에 기동, 빌드, 배포에 걸리는 시간이 짧습니다. 

하지만 서비스들끼리 협업하는 분산 환경이기 때문에 통신에 따른 성능에 이슈가 있습니다. 
서비스 간에 트랜잭션이 필요한 경우에는 이를 별도로 처리해야 합니다. 
분산 환경이기 때문에 장애 포인트가 늘어나고 모니터링에 어려움을 겪을 수 있습니다. 
한마디로 시스템의 복잡도가 증가합니다. 

##### 모놀리식 아키텍처와 마이크로서비스 아키텍처 구조 차이

* 모놀리식 아키택처는 `UI`, `Business Logic`, `Data Access Layer` 모두 하나의 서비스에 존재합니다.
* 마이크로서비스 아키텍처는 `UI` 서비스와 비즈니스 특성에 맞게 설계된 서비스들이 서로 협업합니다.

<p align="center">
    <img src="/images/microservice-architecture-1.JPG" width="80%" class="image__border"/>
</p>
<center>https://www.redhat.com/ko/topics/microservices/what-are-microservices</center>

## 3. MicroService Architecture 특징

### 3.1. 단일 목적 수행 (Single Purpose)

> **Do one thing, and do it well.**

마이크로 서비스는 단일 역량을 담당합니다. 
서비스 하나에 책임도 하나입니다. 
이는 비즈니스와 관련될 수도 있고 제 3자(third party)와의 연계 같은 공유 기술 역량일 수도 있습니다. 
이런 특징은 마이크로 서비스의 높은 응집도(high cohesion)로 이어집니다.

### 3.2. 느슨한 결합 (Loose Coupling)

마이크로 서비스는 각자 자신의 데이터 저장소에 대한 오너십을 가집니다. 
이는 서비스 결합력을 줄여주는데, 다른 서비스는 자신이 소유하지 않은 데이터에 접근할 때 데이터를 소유한 서비스가 제공한 인터페이스를 통해서만 접근이 가능합니다.

### 3.3. 높은 응집도 (High Cohesion)

마이크로 서비스는 단일 비즈니스를 수행하기 때문에 서비스의 기능들은 자연스럽게 높은 응집도를 가지게 됩니다. 
각 서비스는 모든 관련된 행위와 데이터를 캡슐화하여 관리합니다. 
새로운 기능을 구축해야하는 경우 모든 변경사항이 하나의 단일 서비스에서만 수정되도록 해야합니다. 

<p align="center">
    <img src="/images/microservice-architecture-2.JPG" width="80%" class="image__border">
</p>
<center>https://medium.com/dtevangelist/microservice-at-medium-58214fd055b7</center>

## 4. MicroService Architecture 핵심 원칙

### 4.1. 자율성 (Autonomy)

* 각 서비스는 다른 서비스와 독립적으로 변경되고 운영됩니다.
* 자율성을 확실히 하기 위해 느슨한 결합이 필요합니다.
* 독립적으로 배포가 가능해야합니다.

### 4.2. 회복성 (Resilience)

* 마이크로 서비스는 자연스러운 메커니즘을 통해 장애를 격리시킵니다.
* 독립적으로 배포하므로 어플리케이션 또는 인프라 장애는 시스템 일부에만 영향을 미칩니다.
* 어플리케이션을 여러 서비스로 분리하여 장애를 격리시킬 수 있지만 장애 지점이 늘어나게 됩니다.
* 장애가 발생할 때 확산을 막으려면 발생한 일을 처리해야합니다.
* 가능한 부분은 비동기 처리를 합니다.
* 적절한 회로 차단기(circuit breaker)와 타임아웃(timeout)을 사용하도록 설계해야 합니다.

### 4.3. 투명성 (Transparency)

* MSA는 여러 서비스가 협업하기 때문에 시스템 어느 지점에서나 투명하고 관찰 가능해야 문제를 관찰하고 진단할 수 있습니다.
* 이를 위한 비즈니스, 운영, 인프라스트럭처 메트릭(infrastructure metrics), 로그, 요청 추적 등을 생성해야합니다.

### 4.4. 자동화 (Automation)

* MSA는 단일 어플리케이션을 개발하는 것보다 복잡한 아키텍처 구조를 가집니다.
* 자동화된 `CI/CD`를 통해 배포와 운영을 안정적으로 수행해야 합니다.

## 5. MicroService Architecture 설계시 겪은 문제점

기본 설계 시점에 현재 시스템을 업무 단위로 나누는 작업을 수행하였습니다. 
저는 비즈니스 도메인에 대해 모르는 부분이 많았기 때문에 이론상으로 어려울 것이 없어 보였습니다. 
하지만 기존 시스템을 비즈니스 영역별로 분할할 때마다 눈에는 보이지 않던 걸림돌들이 저희 팀의 발목을 잡았습니다. 
최초 마이크로 서비스 설계시 도메인 전문가의 부재로 인해 잘못된 방향으로 시스템이 분할되었기 때문입니다. 
도메인 전문가의 중요성을 이때 깨닫게 되었습니다. 
 
잘못된 설계는 아래와 같은 문제점들을 저희 팀에게 안겨주었습니다. 

### 5.1. 업무 영역(domain context boundary)은 어떻게 나워야 하나?

DDD(Domain Driven Design)을 통해 큰 업무를 독립적인 단위로 나누는 작업을 진행했습니다. 
**이 작업은 현장 근무자 입장에서 업무적인 독립성을 기준으로 업무를 분할하여 서비스로 도출해내는 일입니다.** 
하지만 잘못된 설계로 인해 기존 시스템의 모듈 단위로 서비스가 분할되면서 특정 모듈의 기능을 API 요청을 통해 제공받는 구조가 되었습니다. 
이런 설계는 `단일 목적 수행`이라는 특징은 만족하였지만 특정 서비스로 API 요청이 과도하게 집중되어 전체 시스템의 성능이 떨어졌습니다. 
또한 동기식 요청 방식은 서비스의 결합력을 높이는 행위이기 때문에 마이크로서비스 아키텍처의 장점을 살리지 못한 결과를 가져다 주었습니다. 

### 5.2. Transaction rollback은 어디까지 되어야 하나?

서비스별로 소유권을 가지는 테이블들이 생기면서 분산 환경에서의 트랜잭션 관리가 필요하게 되면서 다음과 같은 고려사항들이 생기기 시작했습니다. 

* 특정 서비스의 트랜잭션 실패는 이전 서비스들 중 어느 서비스까지 rollback 되어야 하는가?
* 서비스 별 다수의 인스턴스들 중 어떤 인스턴스가 해당 트랜잭션을 수행했는가?

마이크로 서비스의 설계가 잘 이루어졌다면 특정 서비스가 한 일은 다른 서비스의 업무와 독립적일테니 서비스들간의 transaction rollback에 대한 고민은 적었어야 한다고 생각합니다.

### 5.3. 모든 비즈니스에서 동시에 사용되는 테이블은 어떻게 관리할 것인가?

서비스별로 테이블 소유권을 가지지만 특정 몇 개의 테이블들은 모든 서비스에서 필요하였습니다. 
시스템 모듈 단위로 마이크로 서비스를 설계하다 보니 서비스마다 공통으로 사용하는 테이블이 생기게 된 것입니다. 
이를 관리하기 위한 별도의 공유 서비스를 설계하였습니다. 
하지만 서비스 부하와 트랜잭션 관리의 어려움이 추가되었습니다.

### 5.4. 문제 해결

문제가 되는 서비스들을 하나씩 묶어나갔습니다. 
**트랜잭션 관리의 용이성, 비즈니스적 독립성 등을 고려하면서 서비스들을 합쳐 나갔으며, 48개 정도의 마이크로 서비스들을 8개의 서비스로 통합하였습니다.** 
서비스들이 합쳐지면서 저희 팀의 서비스는 `마이크로`라고 부르기에는 다소 규모가 있는 모습이 되었습니다.

## CLOSING

마이크로서비스 아키텍처의 성공적인 설계를 위한 핵심은 비즈니스 도메인에 대한 전문성이라고 생각됩니다. 
비즈니스 도메인의 업무 영역을 의미있게 분할하는 일을 통해 독립적이고 자율성있는 마이크로 서비스를 도출해낼 수 있습니다. 
**마이크로서비스 아키텍처가 모든 비즈니스에 적합하진 않겠지만 비즈니스 도메인에 대한 높은 이해도가 아키텍처 설계의 승패를 가른다는 것을 경험하였습니다.**

#### RECOMMEND NEXT POSTS

* [Pros and Cons of MicroService Architecture][msa-pros-and-cons-link]
* [MSA API Gateway][msa-api-gateway-link]
* [MicroService Architecture Release Strategy][msa-release-link]
* [Saga Pattern And Distributed Transaction][distributed-transaction-link]

#### REFERENCE

* <https://alwayspr.tistory.com/19>
* <https://alwayspr.tistory.com/20>
* <https://12bme.tistory.com/517>
* <https://medium.com/dtevangelist/microservice-at-medium-58214fd055b7>
* <https://www.redhat.com/ko/topics/microservices/what-are-microservices>
* [(마이크로 서비스 vs 모놀리식 아키텍처) MicroService vs Monolithic Architecture 간단 소개 및 주관적 의견][msa-blog-link]

[msa-blog-link]: https://lion-king.tistory.com/entry/%EB%A7%88%EC%9D%B4%ED%81%AC%EB%A1%9C-%EC%84%9C%EB%B9%84%EC%8A%A4-vs-%EB%AA%A8%EB%86%80%EB%A6%AC%EC%8B%9D-%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98-MicroService-vs-Monolithic-Architecture-%EA%B0%84%EB%8B%A8-%EC%86%8C%EA%B0%9C-%EB%B0%8F-%EC%A3%BC%EA%B4%80%EC%A0%81-%EC%9D%98%EA%B2%AC

[msa-pros-and-cons-link]: https://junhyunny.github.io/msa/msa-pros-and-cons/
[msa-api-gateway-link]: https://junhyunny.github.io/msa/msa-api-gateway/
[msa-release-link]: https://junhyunny.github.io/msa/msa-release/
[distributed-transaction-link]: https://junhyunny.github.io/msa/design-pattern/distributed-transaction/