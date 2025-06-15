---
title: "Transaction Isolation"
search: false
category:
  - information
last_modified_at: 2021-08-22T00:30:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [트랜잭션(transaction) ACID][acid-link]

## 0. 들어가면서

[트랜잭션(transaction) ACID][acid-link] 특징 중 격리성(isolation)이라는 개념이 있습니다. 
격리성은 다른 트랜잭션끼리는 서로를 간섭할 수 없다는 의미인데, 사실 격리성 수준에 따라 트랜잭션끼리 간섭 여부가 결정됩니다. 
어떤 격리성 수준들이 있는지, 격리 수준에 따라 어떤 문제들이 발생할 수 있는지 이번 포스트를 통해 알아보겠습니다. 

## 1. 트랜잭션에서 발생할 수 있는 문제들

### 1.1. Dirty Read

* 트랜잭션 작업이 완료되지 않은 데이터를 다른 트랜잭션에서 볼 수 있는 현상입니다.
* `트랜잭션_1`이 아이디가 1인 사용자를 조회합니다.
* `트랜잭션_1`이 사용자의 이름을 변경합니다.
* `트랜잭션_2`가 아이디가 1인 사용자를 조회합니다.
* `트랜잭션_2`가 조회한 사용자 정보는 `트랜잭션_1`에서 변경한 모습으로 반영되어 있습니다.

<p align="center">
    <img src="/images/transcation-isolation-1.JPG" width="80%">
</p>

### 1.2. Non-Repeatable Read

* 하나의 트랜잭션에서 같은 쿼리를 두 번 이상 수행할 때 결과가 달라지는 현상입니다.
* `트랜잭션_1`이 아이디가 1인 사용자를 조회합니다.
* `트랜잭션_1`이 사용자의 이름을 변경합니다.
* `트랜잭션_2`가 아이디가 1인 사용자를 조회합니다.
* `트랜잭션_2`가 조회한 사용자 정보는 `트랜잭션_1`이 변경하기 전 상태로 보여집니다.
* `트랜잭션_1`이 트랜잭션을 마치고 커밋(commit)을 수행합니다.
* `트랜잭션_2`가 다시 아이디가 1인 사용자를 조회합니다.
* `트랜잭션_2`가 조회한 사용자 정보는 `트랜잭션_1`에서 변경한 모습으로 반영되어 있습니다.

<p align="center">
    <img src="/images/transcation-isolation-2.JPG" width="80%">
</p>

### 1.3. Phantom Read

* 하나의 트랜잭션에서 일정 범위의 레코드를 두 번 이상 수행할 때 처음 수행할 때 없던 레코드가 나타나는 현상입니다.
* `트랜잭션_2`가 먼저 트랜잭션을 시작합니다.
* `트랜잭션_1`이 아이디가 2인 사용자를 추가합니다.
* `트랜잭션_1`이 트랜잭션으 마치고 커밋을 수행합니다.
* `트랜잭션_2`가 테이블에 저장된 데이터 수를 확인하면 1개입니다. 
* `트랜잭션_2`가 아이디가 2인 사용자 정보를 업데이트합니다. 
    * `트랜잭션_2`에서 보이지 않는 데이터를 업데이트한 것이지만 정상적으로 수행됩니다.
* `트랜잭션_2`가 테이블에 저장된 데이터 수를 확인하면 2개입니다. 

<p align="center">
    <img src="/images/transcation-isolation-3.JPG" width="80%">
</p>

## 2. 트랜잭션 격리 수준(Transaction Isolation Level)

병렬 트랜잭션 시 특정 트랜잭션이 다른 트랜잭션에서 변경하는 데이터를 언제부터 볼 수 있는지 허용하는 수준을 의미합니다. 
아래 예시를 통해 자세히 알아보겠습니다.

### 2.1. Read Uncommitted

* 모든 트랜잭션은 다른 트랜잭션의 커밋 여부와 상관없이 변경되는 데이터를 확인 가능합니다.
* 데이터 정합성이 좋지 않은 격리 수준이므로 사용하지 않습니다.
* Dirty Read, Non-Repeatable Read, Phantom Read 현상이 발생합니다.

<p align="center">
    <img src="/images/transcation-isolation-4.JPG" width="80%">
</p>

### 2.2. Read Committed

* 각 트랜잭션은 다른 트랜잭션의 커밋 완료된 데이터만 확인 가능합니다.
* 주로 사용되는 격리 수준입니다.
* Non-Repeatable Read, Phantom Read 현상이 발생합니다.

<p align="center">
    <img src="/images/transcation-isolation-5.JPG" width="80%">
</p>

### 2.3. Repeatable Read

* 한 트랜잭션이 시작되면 다른 트랜잭션에서 커밋 된 데이터가 있더라도 확인되지 않습니다.
* 트랜잭션 별로 식별자를 주고 `UNDO` 영역의 데이터를 백업해둠으로써 트랜잭션의 일관성을 보장합니다.
* Phantom Read 현상이 발생합니다.

<p align="center">
    <img src="/images/transcation-isolation-6.JPG" width="80%">
</p>

### 2.4. Serializable

* 가장 높은 수준의 격리 수준입니다. 
* 레코드를 조회할 때 `shared lock`을 획득해야만 조회가 가능합니다.
* 레코드를 수정할 때 `exclusive lock`을 획득해야만 변경이 가능합니다.
* 한 트랜잭션에서 사용하는 데이터는 다른 트랜잭션에서 사용 불가능합니다.
* 격리 수준에 따른 문제는 발생하지 않지만 동시성이 저하되는 문제가 발생합니다.

### 3. 요약

각 격리 수준에 따라 발생할 수 있는 문제점들을 하나의 표로 정리하였습니다.

| 격리 수준 | Dirty Read | Non-Repeatable Read | Phantom Read |
|---|:---:|:---:|:---:|
| Read Uncommitted | O | O | O |
| Read Committed | X | O | O |
| Repeatable Read | X | X | O |
| Serializable | X | X | X |

#### REFERENCE

* <https://nesoy.github.io/articles/2019-05/Database-Transaction-isolation>

[acid-link]: https://junhyunny.github.io/information/database/acid/transaction/transcation-acid/