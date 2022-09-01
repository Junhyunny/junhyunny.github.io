---
title: "Transaction ACID"
search: false
category:
  - information
last_modified_at: 2021-08-22T00:30:00
---

<br>

## 1. 트랜잭션 (Transaction)

> 완결성 있게 처리되어야 하는 하나의 논리적인 작업 단위를 의미합니다.

논리적 작업 단위 내에는 여러 동작(질의, query)들이 존재하며 이들은 모두 실행되거나 모두 실행되지 않아야 합니다. 
작업 단위가 중간에 실패한다면 이를 롤백(rollback)하여 이전 상태로 되돌리고 성공한다면 커밋(commit)하여 현재 데이터 상태를 확정지어야 합니다. 
트랜잭션은 작업 수행의 논리적 단위이기 때문에 DBMS(Database Management System)에서는 `TPS(Transaction Per Second)`로 성능을 측정합니다. 
트랜잭션은 데이터의 부정합성을 방지하기 위해 사용합니다.

## 2. ACID 특징

트랜잭션이 가져야하는 `ACID` 특징에 대해 살펴보겠습니다. 

### 2.1. 원자성(Atomic)

* 트랜잭션의 작업이 부분적으로 실행되거나 중단되지 않는 것을 보장합니다.
* `All or Noting`의 개념으로서 작업 단위의 일부분만 실행하지 않는다는 것을 의미합니다.
* 커밋 이전 상태를 롤백 세그먼트(rollback segment)라는 임시 영역에 저장하고 트랜잭션에 의해 내용들을 변경해나갑니다.
* 트랜잭션이 실패하는 경우 수행한 내용들을 삭제하고 롤백 세그먼트에 있는 데이터 상태로 롤백 합니다. 

### 2.2. 일관성(Consistency)

* 트랜잭션을 마친 후의 데이터베이스 상태는 트랜잭션 시작 전 상태와 동일하게 정상 상태를 유지해야 합니다.
* 트랜잭션 수행 후에도 데이터 모델의 제약 조건(기본키, 외래키, 도메인, 도메인 제약조건 등)을 만족하게 함으로써 일관성을 보장할 수 있습니다.

### 2.3. 격리성(Isolation)

* 트랜잭션 수행시 다른 트랜잭션의 작업이 끼어들지 못하도록 보장하는 것을 말합니다.
* 다른 트랜잭션끼리는 서로를 간섭할 수 없습니다.
* 격리성 보장이 되지 않는다면 병행 트랜잭션에서 수행 결과가 매번 달라질 수 있습니다.
* 격리성 보장을 위해 `lock, unlock` 메커니즘을 사용합니다.

##### 격리성을 보장하지 못하는 경우 발생하는 데이터 불일치 CASE

<p align="center">
  <img src="/images/transcation-acid-1.JPG" width="100%" class="image__border">
</p>

### 2.4. 지속성(Durability)

* 성공적으로 수행된 트랜잭션의 결과가 데이터베이스에 반영이 되는 것을 의미합니다.
* 커밋 수행 이후 현재 상태는 영원히 보장됩니다.

#### RECOMMEND NEXT POSTS

* [트랜잭션 격리성(Transaction Isolation)][transaction-isolation-link]

#### REFERENCE

* <https://victorydntmd.tistory.com/129>

[transaction-isolation-link]: https://junhyunny.github.io/information/transcation-isolation/
