---
title: "트랜잭션 격리성(transaction isolation) 특징"
search: false
category:
  - information
last_modified_at: 2025-06-15T00:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [트랜잭션(transaction) ACID][transaction-acid-link]

## 0. 들어가면서

[트랜잭션(transaction)의 ACID 특징][transaction-acid-link] 중 격리성(isolation)이라는 개념이 있다. 격리성은 다른 트랜잭션끼리는 서로를 간섭할 수 없다는 의미인데, 사실 격리성 수준에 따라 트랜잭션끼리 간섭 여부가 결정된다. 어떤 격리성 수준들이 있는지, 격리 수준에 따라 어떤 문제들이 발생할 수 있는지 이번 글을 통해 정리해보자.

## 1. Common issues depending on ttransaction isolation levels

트랜잭션 격리 수준에 따라 어떤 문제들이 있는지 살펴보자. 먼저 더티 리드(dirty read)는 아직 커밋되지 않은(완료되지 않은) 트랜잭션의 데이터를 다른 트랜잭션이 읽는 현상을 말한다.

- `트랜잭션_1`이 아이디가 1인 사용자를 조회한다.
- `트랜잭션_1`이 사용자의 이름을 변경한다.
- `트랜잭션_2`가 아이디가 1인 사용자를 조회한다.
- `트랜잭션_2`가 조회한 사용자 정보는 `트랜잭션_1`에서 변경한 모습으로 반영되어 있다.

<div align="center">
  <img src="/images/posts/2021/transcation-isolation-01.png" alt="더티 리드 예시" width="80%">
</div>

<br />

비반복 읽기(non-repeatable read)은 하나의 트랜잭션에서 같은 쿼리를 두 번 이상 수행할 때 결과가 달라지는 현상이다. 예를 들어, 트랜잭션이 어떤 데이터를 조회한 후 다른 트랜잭션이 그 데이터를 수정하거나 삭제하면, 다시 조회할 때 처음과 다른 결과를 보게 된다.

- `트랜잭션_1`이 아이디가 1인 사용자를 조회한다.
- `트랜잭션_1`이 사용자의 이름을 변경한다.
- `트랜잭션_2`가 아이디가 1인 사용자를 조회한다.
- `트랜잭션_2`가 조회한 사용자 정보는 `트랜잭션_1`이 변경하기 전 상태로 보여진다.
- `트랜잭션_1`이 트랜잭션을 마치고 커밋(commit)을 수행한다.
- `트랜잭션_2`가 다시 아이디가 1인 사용자를 조회한다.
- `트랜잭션_2`가 조회한 사용자 정보는 `트랜잭션_1`에서 변경한 모습으로 반영되어 있다.

<div align="center">
  <img src="/images/posts/2021/transcation-isolation-02.png" alt="비반복 읽기 예시" width="80%">
</div>

<br />

팬텀 리드(phantom read)는 하나의 트랜잭션에서 일정 범위의 레코드를 두 번 이상 수행할 때 처음 수행할 때 없던 레코드가 나타나는 현상이다.

- `트랜잭션_2`가 먼저 트랜잭션을 시작한다.
- `트랜잭션_1`이 아이디가 2인 사용자를 추가한다.
- `트랜잭션_1`이 트랜잭션을 마치고 커밋을 수행한다.
- `트랜잭션_2`가 테이블에 저장된 데이터 수를 확인하면 1개이다.
- `트랜잭션_2`가 아이디가 2인 사용자 정보를 업데이트한다.
  - `트랜잭션_2`에서 보이지 않는 데이터를 업데이트한 것이지만 정상적으로 수행된다.
- `트랜잭션_2`가 테이블에 저장된 데이터 수를 확인하면 2개이다.

<div align="center">
  <img src="/images/posts/2021/transcation-isolation-03.png" alt="팬텀 리드 예시" width="80%">
</div>

## 2. Transaction Isolation Level

트랜잭션 격리 수준(transaction isolation level)은 병렬 트랜잭션 시 특정 트랜잭션이 다른 트랜잭션에서 변경하는 데이터를 언제부터 볼 수 있는지 허용하는 수준을 의미한다. 격리 수준을 통해 위에서 살펴본 문제들을 해결할 수 있다. 아래 예시들을 통해 자세히 알아보자. 

먼저 미확정 읽기(read uncommitted)는 아직 커밋되지 않은 다른 트랜잭션의 변경 내용을 읽을 수 있는 격리 수준이다.

- 모든 트랜잭션은 다른 트랜잭션의 커밋 여부와 상관없이 변경되는 데이터를 확인할 수 있다.
- 데이터 정합성이 좋지 않은 격리 수준이므로 사용하지 않는다.
- 더티 리드, 비반복 읽기, 팬텀 리드 현상이 발생한다.

<div align="center">
  <img src="/images/posts/2021/transcation-isolation-04.png" alt="Read Uncommitted 예시" width="80%">
</div>

<br />

확정 읽기(read committed)는 각 트랜잭션은 다른 트랜잭션에서 커밋(완료)된 데이터만 읽을 수 있는 격리 수준이다.

- 각 트랜잭션은 다른 트랜잭션의 커밋 완료된 데이터만 확인할 수 있다.
- 주로 사용되는 격리 수준이다.
- 비반복 읽기, 팬텀 리드 현상이 발생한다.

<div align="center">
  <img src="/images/posts/2021/transcation-isolation-05.png" alt="Read Committed 예시" width="80%">
</div>

<br />

반복 읽기(repeatable read)는 한 트랜잭션이 시작되면, 그 트랜잭션이 종료될 때까지 다른 트랜잭션에서 커밋한 데이터라도 읽을 수 없도록 보장하는 격리 수준이다.

- 한 트랜잭션이 시작되면 다른 트랜잭션에서 커밋 된 데이터가 있더라도 확인되지 않는다.
- 트랜잭션 별로 식별자를 주고 `UNDO` 영역의 데이터를 백업해둠으로써 트랜잭션의 일관성을 보장한다.
- 팬텀 리드 현상이 발생한다.

<div align="center">
  <img src="/images/posts/2021/transcation-isolation-06.png" alt="Repeatable Read 예시" width="80%">
</div>

<br />

직렬화 가능(serializable)은 가장 높은 수준의 격리 수준이다.

- 레코드를 조회할 때 `shared lock`을 획득해야만 조회가 가능하다.
- 레코드를 수정할 때 `exclusive lock`을 획득해야만 변경이 가능하다.
- 한 트랜잭션에서 사용하는 데이터는 다른 트랜잭션에서 사용 불가능하다.
- 격리 수준에 따른 문제는 발생하지 않지만 동시성이 저하되는 문제가 발생한다.

## 3. Summary

각 격리 수준에 따라 발생할 수 있는 문제점들을 하나의 표로 정리하였다.

| 격리 수준       | 더티 리드 | 비반복 읽기 | 팬텀 리드 |
|----------------|:----------:|:-------------------:|:------------:|
| Read Uncommitted | O          | O                   | O            |
| Read Committed   | X          | O                   | O            |
| Repeatable Read  | X          | X                   | O            |
| Serializable     | X          | X                   | X            |

#### REFERENCE

- <https://nesoy.github.io/articles/2019-05/Database-Transaction-isolation>

[transaction-acid-link]: https://junhyunny.github.io/information/database/acid/transaction/transcation-acid/
