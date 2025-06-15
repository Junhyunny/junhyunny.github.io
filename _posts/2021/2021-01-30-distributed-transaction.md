---
title: "Saga Pattern And Distributed Transaction"
search: false
category:
  - msa
  - design-pattern
last_modified_at: 2021-08-22T00:30:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [마이크로서비스 아키텍처][microservice-architecture-link]
* [트랜잭션(transaction) ACID][transcation-acid-link]
* [Transaction Isolation][transcation-isolation-link]

## 0. 들어가면서

크리스 리차든의 [Saga Pattern][chris-saga-pattern-link] 영상을 보고 얻은 인사이트(insight)들을 저의 방식대로 정리하였습니다. 
가볍게 생각하면 간단해 보이지만, 곰곰히 생각해보면 고민할 요소들이 굉장히 많은 것 같습니다. 

* 동기 혹은 비동기 방식으로 처리되는 서비스들 사이의 트랜잭션을 연결
* 다른 서비스에 에러가 발생했을 때 데이터의 일관성(consistency)을 위한 보상 트랜잭션 실행
* 메시지 중복 전달이나 수신을 막기 위한 멱등성(idempotence)

크리스 리차든의 영상 외에도 다른 글이나 영상을 보고 공부한 내용들을 바탕으로 이번 포스트에 정리해보겠습니다. 

## 1. 분산 트랜잭션(Distributed Transaction)

> [분산 트랜잭션][wiki-distributed-transaction-link]<br/>
> 네트워크에 존재하는 2개 그 이상의 시스템 사이에서 발생하는 트랜잭션이다. 
> 일반적으로 서버들은 트랜잭션 리소스를 제공하고 트랜잭션 관리자는 리소스에 대한 모든 작업을 포함하는 전역 트랜잭션을 만들고 관리한다. 

어떤 비즈니스 프로세스가 네트워크를 통해 연결된 분산 환경에 놓인 시스템(혹은 서비스)들을 두루 걸쳐 실행되는 것을 `분산 트랜잭션`이라고 합니다. 
분산 트랜잭션에 참여한 각 서비스들은 각자 로컬 트랜잭션을 수행합니다. 
비즈니스 관점에서 바라보았을 때 분산 트랜잭션에 참여한 서비스들이 수행한 로컬 트랜잭션들은 의미있는 연관 관계를 가지게 됩니다. 

### 1.1. 분산 트랜잭션의 어려움

마이크로서비스 아키텍처(MSA, MicroService Architecture)은 대표적인 분산 트랜잭션 환경입니다. 
`MSA` 환경을 기준으로 분산 트랜잭션에 대한 설명을 이어 나가겠습니다. 
`MSA`는 `Database per Service` 특징을 가집니다. 

* 마이크로 서비스는 자신이 오너십(ownership)을 가지는 데이터 테이블들을 별도의 데이터베이스에 관리합니다. 
* 데이터베이스 크기, 유형, 스키마 등을 서비스에 맞게 조절할 수 있습니다. 
* 다른 서비스에서 발생하는 오류나 장애로부터 데이터를 지킬 수 있습니다.
* 서비스 별로 캡슐화 된 데이터를 가지기 때문에 서비스 간 결합도가 낮아집니다.

마이크로 서비스는 각자 데이터베이스를 소유하기 때문에 `ACID` 특성을 가진 로컬 트랜잭션 처리는 가능합니다. 
하지만 분산 트랜잭션은 서비스 사이를 넘나들면서 로컬 트랜잭션들을 발생시킵니다. 
각자 다른 서비스, 다른 데이터베이스에서 데이터를 처리하기 때문에 트랜잭션의 `ACID` 특성을 지키기 어렵습니다. 
거시적인 관점에서 시스템을 바라보았을 때 시스템 전체의 데이터 일관성을 모노리스 아키텍처처럼 데이터베이스만으로 지키기 어려워졌습니다. 

예를 들면 다음과 같은 상황을 생각할 수 있습니다. 
시스템에 주문(order) 서비스와 크레딧(credit) 서비스가 존재한다고 가정하였습니다.  

1. 사용자는 물건 구매를 위해 주문을 생성합니다.
1. 사용자 요청을 전달받은 주문 서비스는 주문 생성을 완료합니다. 
1. 주문 서비스는 크레딧 서비스에게 결제된 금액만큼 크레딧 차감하도록 이벤트를 전달합니다. 
1. 이벤트를 전달받은 크레딧 서비스는 주문이 완료된 금액만큼 크레딧에서 차감을 시도합니다. 
1. 크레딧 서비스에서 로직 중간에 에러가 발생하면서 차감된 크레딧 정보는 롤백(rollback)되어 이전 상태로 돌아갑니다.
1. 주문 서비스에서 생성한 주문은 커밋된 상태이고 별도 처리가 없었으므로 그대로 유지됩니다. 
1. 전체 시스템 관점에서 보았을 때 구매자는 크레딧 차감없이 정상적인 주문이 생성되었으므로 문제가 발생합니다. 

## 2. 2단계 커밋(2-Phase Commit) 

여러 개 데이터베이스를 사용하는 분산 트랜잭션 환경에서 데이터 일관성을 보장하기 위한 방법입니다. 
`X/Open`에서 제정한 분산 트랜잭션 표준인 `XA`을 따르는 기술들을 통해 2단계 커밋을 사용할 수 있습니다. 
`Java`는 `XA` 표준을 따르는 `JTA(Java Transaction API)` 인터페이스의 대표적인 구현체들이 있습니다. 

* [Atomikos](https://www.atomikos.com/Main/WebHome)
* [Bitronix](https://github.com/bitronix/btm)

### 2.1. 동작 과정

2단계 커밋에는 트랜잭션을 관리하는 별도의 코디네이터(coordinator)가 존재합니다. 
코디네이터에 의해 2단계에 걸쳐 트랜잭션을 처리합니다. 

##### First Phase(혹은 Prepare Phase)

* 코디네이터는 각 데이터베이스 노드들에게 커밋을 위한 준비 요청을 보냅니다.
* 각 데이터베이스 노드들은 준비 성공, 실패 여부를 응답합니다.

<p align="center">
    <img src="/images/distributed-transaction-1.JPG" width="80%" class="image__border">
</p>

##### Second Phase(혹은 Commit Phase)

* 코디네이터는 모든 데이터베이스 노드들로부터 준비 완료 응답을 받으면 커밋을 요청합니다. 
* 코디네이터는 단 하나의 데이터베이스 노드라도 준비 실패 응답을 보내면 모든 데이터베이스 노드들에게 롤백을 요청합니다.

<p align="center">
    <img src="/images/distributed-transaction-2.JPG" width="80%" class="image__border">
</p>

### 2.2. 2-phase commit is not an option

`JTA` 구현체를 사용하여 `MSA` 환경에서 2단계 커밋을 구현한 예시나 방법을 찾진 못 했습니다. 
하지만 이 외에도 2단계 커밋은 다음과 같은 이유로 `MSA` 환경에서 사용하기 어렵습니다. 

* 트랜잭션 책임이 코디네이터에게 집중되어 있습니다.
    * 시스템 실패 포인트가 하나에 집중되어 있어서 코디네이터에 이상이 발생하는 경우 시스템이 중단됩니다. 
    * 코디네이터와 많은 통신이 발생하기 때문에 속도가 느립니다. 
* 시스템의 전반적인 속도가 가장 느린 데이터베이스 노드에 맞춰집니다. 
* NoSQL 데이터베이스는 2단계 커밋을 지원하지 않습니다.

## 3. Saga Pattern

`MSA` 환경에선 트랜잭션의 관리 주체는 데이터베이스가 아닌 어플리케이션입니다. 
Saga 패턴은 분산 트랜잭션 환경에서 강력한 데이터 일관성을 지키지 못하는 한계를 인정하고 최종적인 일관성(eventually consistency)을 보장하기 위한 방법입니다. 

Saga 패턴은 비즈니스 흐름을 따라 서비스들의 로컬 트랜잭션을 순차적으로 처리합니다. 
다음과 같은 과정을 통해 Saga 패턴을 적용합니다. 

1. 전체적인 비즈니스 프로세스를 살펴보고 각 서비스의 로컬 트랜잭션으로 처리할 수 있도록 작업 단위를 나누고 순서를 결정합니다. 
    * 예를 들어 주문을 생성하는 프로세스는 주문을 생성하고, 사용자 크레딧을 차감되면 배송을 시작합니다.
    * 주문 서비스에서 주문을 생성하는 로컬 트랜잭션 수행이 필요합니다.
    * 크레딧 서비스에서 크레딧을 차감하는 로컬 트랜잭션 수행이 필요합니다.
    * 배송 서비스는 배송 시작 정보를 생성하는 로컬 트랜잭션 수행이 필요합니다.
1. 선행되어야 하는 서비스부터 로컬 트랜잭션을 처리합니다.
1. 로컬 트랜잭션을 마친 서비스는 다음 트랜잭션이 수행되도록 트리거(trigger)시킵니다. 
    * 트리거 방법은 이벤트나 메시징 방식입니다. 
1. 비즈니스 프로세스를 따라 각 서비스들에서 로컬 트랜잭션이 실행됩니다. 

### 3.1. 보상 트랜잭션(Compensate Transaction) 정의

Saga 패턴을 적용하기 위해선 보상 트랜잭션을 고려해야합니다. 
각 서비스는 로컬 트랜잭션을 커밋하기 때문에 다음 서비스가 실패할 경우 자신의 상태를 이전으로 되돌려야 합니다. 
로컬 트랜잭션이 끝났으므로 롤백(rollback)은 불가하지만, 비즈니스적인 의미에서 이전 상태로 되돌립니다(undo). 
개발자는 보상 트랜잭션을 위한 고려사항들을 설계에 반영하고 별도 로직을 구현해야 합니다. 

다음과 같은 상황을 예시로 보상 트랜잭션에 대해 알아보겠습니다. 

* 주문 서비스는 주문을 생성합니다.
    * 주문의 상태는 `PENDING`입니다.
* 주문 서비스는 다음 서비스를 트리거합니다.
* 크레딧 서비스가 크레딧을 차감하는 중에 에러가 발생합니다.
    * 크레딧 상태는 이전으로 롤백됩니다.
* 크레딧 서비스는 자신의 실패를 알리는 `보상 트랜잭션`을 수행합니다.
    * 이벤트나 메시징 방식을 사용합니다.
* 보상 트랜잭션에 의해 주문 서비스는 주문의 상태를 `CANCELED`로 변경합니다.
* 만약 정상적으로 수행되었다면 주문 상태를 `CONFIRMED`로 변경합니다. 

### 3.2. 오케스트레이션 사가(Orchestration Saga)

음악 무대의 오케스트레이터(orchestrator)처럼 전체적인 트랜잭션을 조율하는 컴포넌트가 존재합니다. 
어떤 경우엔 중앙 오케이스트레이터 역할의 서비스를 만들기도 하는 것 같지만, 크리스 리차든의 구현 방법을 위주로 설명을 이어나가겠습니다. 

해당 비즈니스를 처리하기 위한 사가 컴포넌트가 전체 트랜잭션을 컨트롤합니다. 
사가 컴포넌트는 자신이 책임지고 있는 로직을 수행하고 다음 참가자에게 메시지를 전달합니다. 
다른 사가 패턴 참가자의 메시지 응답에 따라 필요한 다음 처리를 선택적으로 수행합니다. 
사가 패턴에 참여하는 서비스들은 다른 참가자들을 알 필요가 없습니다. 

#### 3.2.1. 동작 과정

주문 정보를 만드는 프로세스를 예시로 오케스트레이션 사가 패턴의 전반적인 동작 과정을 살펴보겠습니다. 

1. 주문 서비스가 주문 생성 요청을 받습니다.
1. 주문 사가 컴포넌트가 주문을 생성합니다.
1. 주문 사가 컴포넌트는 메시지 브로커를 통해 크레딧 생성을 메시지를 전달합니다.
    1. 주문이 생성되었음을 클라이언트에게 응답합니다.
1. 크레딧 서비스의 커맨드 핸들러가 메시지를 받아 크레딧 예약을 요청합니다.
1. 크레딧 서비스는 주문한 금액만큼 크레딧을 예약합니다.
1. 크레딧 서비스는 크레딧 예약 성공 여부를 메시지로 전달합니다.
1. 주문 사가 컴포넌트는 크레딧 예약 성공 여부에 따라 생성한 주문을 확정하거나 취소합니다.

<p align="center">
    <img src="/images/distributed-transaction-3.JPG" width="100%" class="image__border">
</p>

### 3.3. 코리오그래피 사가(Choreography Saga)

무대 위의 안무가(choreographer)들처럼 각자의 책임을 스스로 수행합니다. 
책임을 사가 패턴 참가자들에게 분산합니다. 

사가 패턴에 참여하는 서비스들은 자신이 책임진 로직을 수행하고, 자신이 업무를 마쳤음을 다음 참가자를 위해 이벤트로 발행합니다. 
사가 패턴 참여자들은 관심있는 이벤트를 구독하고, 이벤트 수신 시 필요한 로직을 수행합니다. 
만약, 참가자가 정상적으로 로직을 수행하지 못했다면 보상 트랜잭션을 위한 이벤트를 발행합니다. 
보상 트랜잭션 관련된 이벤트를 구독하는 서비스들은 이벤트 수신 시 필요한 보상 로직을 수행합니다. 

#### 3.3.1. 동작 과정

주문 정보를 만드는 프로세스를 예시로 코리오그래피 사가 패턴의 전반적인 동작 과정을 살펴보겠습니다. 

1. 주문 서비스가 주문 생성 요청을 받습니다.
1. 주문 서비스는 주문을 생성합니다.
1. 주문 생성이 완료되었음을 이벤트로 발행합니다.
    1. 주문이 생성되었음을 클라이언트에게 응답합니다.
1. 크레딧 서비스는 주문 생성 이벤트를 수신하면 크레딧을 예약을 시도합니다.
1. 크레딧 서비스는 주문한 금액만큼 크레딧을 예약합니다.
1. 크레딧 서비스는 크레딧 예약 성공 여부를 이벤트로 발행합니다.
    * 필요에 따라서 성공 채널과 보상 트랜잭션을 위한 채널로 구분하는 것을 고려합니다.
1. 주문 서비스는 크레딧 예약 결과 이벤트를 수신한 후 크레딧 예약 성공 여부에 따라 생성한 주문을 확정하거나 취소합니다.

<p align="center">
    <img src="/images/distributed-transaction-4.JPG" width="100%" class="image__border">
</p>

### 3.4. Considerations

Saga 패턴을 적용하기 전에 몇 가지 고려할 사항들이 있습니다. 

* 여러 서비스들에 걸쳐 트랜잭션들을 처리하기 때문에 테스트와 디버깅이 쉽지 않습니다.
* 메시지 혹은 이벤트의 중복 송수신을 없애야 합니다.
    * 중복된 메시지, 이벤트 송수신이 발생하는 경우 잘못된 데이터 처리가 발생하기 때문에 이에 대한 처리를 고민해야합니다.
    * Kafka 같은 솔루션을 사용하는 경우 `Idempotence Publisher`를 사용합니다.
    * 크리스 리차든의 오케스트레이션 사가 예제 코드는 데이터베이스를 메시지 큐로 사용하는 `Transactional Outbox Pattern`을 적용하였습니다.
* 메시지 혹은 이벤트 재송신(retry)이 가능해야 합니다.
    * 불안정한 인프라 상황에 메시지나 이벤트가 누락되는 경우가 발생합니다.
    * 누락된 메시지, 이벤트를 재송신 할 수 있어야 합니다. 
* 상황에 맞는 사가 패턴을 적용합니다.
    * 오케스트레이션 사가는 중앙 컴포넌트가 트랜잭션을 제어하므로 서비스 간의 복잡성은 줄어들지만, 서비스 간의 결합도가 높아집니다. 
    * 코리오그래피 사가는 각자의 책임을 나눠가지기 때문에 서비스 간의 결합도는 느슨하지만, 복잡도가 높습니다.
* Saga 패턴에 참여하는 서비스들의 워크 플로우(work flow)를 모니터링하고 추적할 수 있어야 합니다.
    * 운영자는 시스템 전체에서 발생하는 로컬 트랜잭션들로 인해 현재 시스템의 상태를 확인하기 어렵습니다.
* 클라이언트 사용성에 대해 고민이 필요합니다.
    * 프로세스를 모두 마친 후 응답을 보내는 것이 아니기 때문에 클라이언트에게 최종 결과를 전달할 방법을 정해야 합니다.
    * 클라이언트 쪽 프로그램에서 주기적인 폴링을 통해 최종 결과를 확인하는 방법이 있습니다.
    * 웹 소켓, `SSE(Server Send Event)` 방식을 통해 클라이언트를 업데이트 합니다.

## CLOSING

분산 트랜잭션은 구현한기 어려운만큼 가능하다면 각 서비스의 로컬 트랜잭션만으로 처리될 수 있도록 후보 서비스를 도출하는 것이 좋다는 생각이 들었습니다. 
Saga 패턴을 구현해야 한다면 최대한 참여자가 적도록 비즈니스 프로세스를 조정하는 것도 필요해보입니다. 

사가 패턴을 지원하는 여러 프레임워크들이 존재합니다. 
프레임워크를 통해 안정적으로 사가 패턴을 적용하는 것도 좋은 방법이라 생각합니다. 

* [Apache Camel](https://camel.apache.org/components/3.18.x/eips/saga-eip.html)
* [Eventuate Tram Sagas](https://eventuate.io/docs/manual/eventuate-tram/latest/getting-started-eventuate-tram-sagas.html)
* [Axon Saga](https://docs.axoniq.io/reference-guide/v/3.1/part-ii-domain-logic/sagas)
* [Eclipse MicroProfile LRA](https://github.com/eclipse/microprofile-lra)

직관적인 코리오그래피 사가에 비해 오케스트레이션 사가의 중앙 컴포넌트 동작 방식은 잘 이해가 되지 않았는데, 크리스 리차든의 오케스트레이션 사가 패턴 예시 코드를 살펴보면서 어느 정도 소화하였습니다. 
나중에 기회가 된다면 예시 코드를 분석한 내용을 포스트로 작성해볼 생각입니다. 

#### 크리스 리차든의 오케스트레이션 사가 예시 코드

* <https://github.com/eventuate-tram/eventuate-tram-sagas-examples-customers-and-orders/>

#### REFERENCE

* [분산 트랜잭션][wiki-distributed-transaction-link]
* <https://www.youtube.com/watch?v=YPbGW3Fnmbc>
* <https://microservices.io/patterns/data/saga.html>
* <https://docs.microsoft.com/ko-kr/azure/architecture/reference-architectures/saga/saga>
* <https://azderica.github.io/01-architecture-msa/>
* <https://www.baeldung.com/cs/saga-pattern-microservices>
* <https://sarc.io/index.php/development/2128-saga-pattern>
* <https://sarc.io/index.php/cloud/1944-msa-transactional-outbox-pattern>
* <https://waspro.tistory.com/735>
* <https://jjeongil.tistory.com/1100>
* <https://supawer0728.github.io/2018/03/22/spring-multi-transaction/>

[microservice-architecture-link]: https://junhyunny.github.io/information/msa/microservice-architecture/
[transcation-acid-link]: https://junhyunny.github.io/information/database/acid/transaction/transcation-acid/
[transcation-isolation-link]: https://junhyunny.github.io/information/transcation-isolation/

[chris-saga-pattern-link]: https://www.youtube.com/watch?v=YPbGW3Fnmbc
[wiki-distributed-transaction-link]: https://ko.wikipedia.org/wiki/%EB%B6%84%EC%82%B0_%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98