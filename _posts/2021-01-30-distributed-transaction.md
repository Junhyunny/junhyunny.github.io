---
title: "분산 트랜잭션(Distributed transaction)"
search: false
category:
  - msa
  - design-pattern
last_modified_at: 2021-08-22T00:30:00
---

<br>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Micro Service Architecture][msa-blog-link]

👉 이어서 읽기를 추천합니다.
- [Micro Service Architecture 장점과 단점][msa-pros-and-cons-link]

## 0. 들어가면서

**마이크로 서비스 아키텍처에서 가장 큰 어려움은 트랜잭션 관리입니다.** 
기존 모놀리식 아키텍처는 DBMS 기능에 의존한 트랜잭션 처리를 통해 데이터의 일관성을 보장하였습니다. 
마이크로 서비스 아키텍처의 경우 각 서비스 별로 데이터 베이스를 가지고 있기 때문에 DBMS 기능에 의존한 트랜잭션 처리가 불가능합니다. 
마이크로 서비스 아키텍처에서는 어떤 방법을 통해 트랜잭션 처리를 수행하는지 알아보도록 하겠습니다.

## 1. 분산 트랜잭션 개념

마이크로 서비스 아키텍처는 여러 서비스의 협업을 통해 업무 처리를 수행하므로 필연적으로 분산 트랜잭션 처리가 필요합니다. 
분산 트랜잭션의 정의를 살펴보고 실제로 사용되는 방법들이 어떤 메커니즘을 통해 분산된 트랜잭션 처리를 하나의 트랜잭션처럼 수행하는지 이론적인 내용에 대해서 알아보도록 하겠습니다.

> 네트워크에 존재하는 2개 그 이상의 시스템 사이에서 발생하는 트랜잭션<br>
> 일반적으로 서버들은 트랜잭션 리소스를 제공하고 트랜잭션 관리자는 리소스에 대한 모든 작업을 포함하는 전역 트랜잭션을 만들고 관리한다.<br>
> \- Wikipedia

## 2. 2단계 커밋(2-phase commit)
이전에 많이 사용했던 분산 트랜잭션 처리 방법으로 데이터베이스가 분산 트랜잭션을 지원해야 합니다. 
**같은 제품의 데이터베이스이어야 하기 때문에 마이크로 서비스 아키텍처에서 폴리글랏(polyglot) 아키텍처로서의 장점은 취하지 못합니다.** 
2단계 커밋은 하나의 API END POINT를 통해 서비스 요청이 들어오고 내부적으로 데이터베이스가 분산되어 있는 경우에 사용이 가능합니다.

2단계 커밋의 정의는 다음과 같습니다.
> 분산 컴퓨팅 환경에서 트랜잭션에 참여하는 모든 데이터베이스가 정상적으로 수정되었음을 보장하는 두 단계 커밋 프로토콜이다.<br>
> 분산 트랜잭션에 참여한 모든 데이터베이스가 모두 함께 커밋(commit)되거나 롤백(rollback)되는 것을 보장한다.

2단계 커밋은 말 그대로 2단계에 걸쳐서 트랜잭션 처리를 수행합니다.
1. First Phase(또는 Prepare Phase)
  - 각 데이터베이스 노드들이 커밋을 하기 위한 준비 요청 단계입니다.
  - 트랜잭션 매니저는 데이터베이스 노드들에게 커밋 준비를 요청합니다.
  - 각 데이터베이스 노드들은 커밋 준비 성공, 실패 여부를 트랜잭션 매니저에게 알립니다.
1. Second Phase(또는 Commit Phase)
  - 트랜잭션 매니저는 분산 트랜잭션에 참여한 모든 데이터베이스 노드들로부터 준비 완료에 대한 메세지를 받을 때까지 대기합니다.
  - 모든 데이터베이스 노드들로부터 준비 성공 응답을 받는 경우 트랜잭션 매니저는 커밋 메세지를 보내 모든 작업을 커밋합니다.
  - 하나의 데이터베이스 노드라도 준비 실패 응답을 보낸 경우 트랜잭션 매니저는 롤백 메세지를 보내 모든 작업을 롤백 합니다.

##### 2단계 커밋 성공 / 실패 시나리오

<p align="center"><img src="/images/distributed-transaction-1.JPG"></p>

## 3. Saga pattern
마이크로 서비스 아키텍처 환경에서는 서로 다른 서비스가 각각의 API END POINT를 통해 요청을 처리하기 때문에 2단계 커밋은 사용하기 어렵습니다. 
마이크로 서비스 아키텍처는 2단계 커밋 대신 `Saga 패턴`을 통해 분산 트랜잭션 처리를 수행합니다.
`Saga 패턴`에서 트랜잭션의 관리 주체는 어플리케이션(서비스)입니다. 
각 서비스들은 자신이 소유권을 가진 데이터베이스의 트랜잭션에만 관심이 있습니다. 
트랜잭션에 참여하는 서비스들끼리 이벤트를 주고 받으며 전체 트랜잭션 처리를 수행합니다. 
2단계 커밋처럼 데이터의 원자성이 보장되지 않기 때문에 `eventual consistency`를 보장하며 보상 트랜잭션 처리가 필요합니다.

Saga 패턴은 두 가지 종류가 존재합니다. 
각자 어떤 메커니즘으로 구현되어 있는지 알아보도록 하겠습니다.

### 3.1. Choreography-based SAGA
각 서비스는 자신의 로컬 트랜잭션을 완료 후 이벤트를 발행합니다. 
이벤트는 Kafka와 같은 메세지 큐를 이용하여 비동기 방식으로 전달합니다. 
다음에 수행되어야할 트랜잭션이 있다면 해당 트랜잭션을 수행해야하는 서비스에서 완료 이벤트를 수신받고 다음 트랜잭션을 수행합니다. 

각 서비스 별로 트랜잭션을 관리하는 로직이 존재합니다.
중간에 트랜잭션이 실패하면 실패한 서비스에서 해당 트랜잭션에 대한 취소 처리 이벤트를 발행합니다.(보상 트랜잭션)
취소 처리 이벤트를 받은 서비스들은 이를 롤백 처리합니다.

##### 트랜잭션 성공 시 트랜잭션 완료 처리

<p align="center"><img src="/images/distributed-transaction-2.JPG"></p>
<center>이미지 출처, https://cla9.tistory.com/22</center><br>

##### 트랜잭션 실패 시 보상 트랜잭션 수행

<p align="center"><img src="/images/distributed-transaction-3.JPG"></p>
<center>이미지 출처, https://cla9.tistory.com/22</center><br>

### 3.2. Orchestration-based SAGA
분산 트랜잭션을 관리하는 오케스트레이터(orchestrator)가 존재합니다. 
오케스트레이터가 어떤 트랜잭션을 수행할지 알려주는 방식입니다. 
**메인이 되는 서비스에 SAGA 모듈이 존재합니다.** 
트랜잭션에 참가하는 마이크로 서비스들의 로컬 트랜잭션은 오케스트레이터에 의해 호출되며 결과를 오케스트레이터에게 전달합니다. 
비스니스적으로 마지막 트랜잭션이 종료되면 오케스트레이터는 전체 트랜잭션을 종료합니다. 
트랜잭션에 참가하는 특정 마이크로 서비스에서 로컬 트랜잭션 오류가 발생하면 오케스트레이터는 보상 트랜잭션을 수행하여 데이터의 일관성을 유지합니다.

##### 트랜잭션 성공 시 트랜잭션 완료 처리

<p align="center"><img src="/images/distributed-transaction-4.JPG"></p>
<center>이미지 출처, https://cla9.tistory.com/22</center><br>

##### 트랜잭션 실패 시 보상 트랜잭션 수행

<p align="center"><img src="/images/distributed-transaction-5.JPG"></p>
<center>이미지 출처, https://cla9.tistory.com/22</center><br>

#### REFERENCE
- <https://en.wikipedia.org/wiki/Distributed_transaction>
- <https://cla9.tistory.com/22>
- <https://sarc.io/index.php/development/2128-saga-pattern>
- <https://technet.tmaxsoft.com/upload/download/online/tibero/pver-20140808-000002/tibero_admin/ch_07.html>

[msa-blog-link]: https://junhyunny.github.io/information/msa/microservice-architecture/

[msa-pros-and-cons-link]: https://junhyunny.github.io/msa/msa-pros-and-cons/