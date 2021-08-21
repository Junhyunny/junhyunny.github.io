---
title: "Transaction ACID 특징"
search: false
category:
  - information
last_modified_at: 2021-01-30T09:00:00
---

<br>

시스템 개발/운영을 하면서 많이 접하게 되는 Transaction 이라는 용어의 정확한 의미와 Transaction ACID 특징에 대해 정리해보았습니다. 

## 1. 트랜잭션 (Transaction)
**완결성있게 처리되어야 하는 하나의 논리적인 작업 단위를 의미합니다.** 
이 논리적 작업 단위 내에는 여러 동작(질의, query)들이 존재하며 이들은 모두 실행되거나 모두 실행되지 않아야합니다. 
작업 단위가 중간에 실패한다면 이를 ROLLBACK 하여 이전 상태로 되돌리고 성공한다면 COMMIT 하여 현재 데이터 상태를 확정짓습니다. 
트랜잭션은 작업 수행의 논리적 단위이기 때문에 DBMS(Database Management System)에서는 **TPS(Transaction Per Second)**로 성능을 측정합니다. 
**트랜잭션은 데이터의 부정합성을 방지하기 위해 사용합니다.** 

## 2. ACID 특징
트랜잭션의 개념에 대해 알아보았으니 이를 대표하는 ACID 특징에 대해서 알아보도록 하겠습니다. 

### 2.1. Atomic (원자성)
- 트랜잭션의 작업이 부분적으로 실행되거나 중단되지 않는 것을 보장합니다.
- 즉, **All or Noting**의 개념으로서 작업 단위의 일부분만 실행하지 않는다는 것을 의미합니다.
- 이전 COMMIT 상태를 롤백 세그먼트(ROLLBACK SEGMENT)라는 임시 영역에 저장하고 트랜잭션에 의해 내용들을 변경해나갑니다.
- 트랜잭션이 실패하는 경우 수행한 내용들을 삭제하고 롤백 세그먼트에 있는 데이터 상태로 ROLLBACK 합니다. 

### 2.2. Consistency (일관성)
- 트랜잭션을 마친 후의 DB 상태는 트랜잭션 시작 전 상태와 동일하게 정상 상태를 유지해야 합니다.
- 트랜잭션 수행 후에도 데이터 모델의 제약 조건(기본키, 외래키, 도메인, 도메인 제약조건 등)을 만족하게 함으로써 일관성을 보장할 수 있습니다.

### 2.3. Isolation (격리성)
- 트랜잭션 수행시 다른 트랜잭션의 작업이 끼어들지 못하도록 보장하는 것을 말합니다.
- 즉, 트랜잭션끼리는 서로를 간섭할 수 없습니다.
- 격리성 보장이 되지 않는다면 병행 트랜잭션에서 수행 결과가 매번 달라질 수 있습니다.
- 격리성 보장을 위해 LOCK/UNLOCK 메커니즘을 사용합니다.

##### 격리성을 보장하지 못하는 경우 발생하는 데이터 불일치 CASE
<p align="center"><img src="/images/transcation-acid-1.JPG"></p>

### 2.4. Durability (지속성)
- 성공적으로 수행된 트랜잭션의 결과가 데이터베이스에 반영이 되는 것을 의미합니다.
- COMMIT 수행시 현재 상태는 영원히 보장됩니다.

## OPINION
[참고 블로그][acid-blogLink]가 너무 잘 정리되어 있어서 내용 대부분이 유사합니다. 
직접 정리하지 못한만큼 이 글을 자주 복습하여 저의 지식으로 만드는 과정이 필요할 것 같습니다. 
격리성과 관련한 구체적인 LOCK/UNLOCK 메커니즘에 대한 내용에 대해 알고 싶으시다면 [참고 블로그][acid-blogLink]를 방문하시면 됩니다.  

#### REFERENCE
- <https://victorydntmd.tistory.com/129>

[acid-blogLink]: https://victorydntmd.tistory.com/129
