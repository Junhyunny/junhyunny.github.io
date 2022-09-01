---
title: "트랜잭션 격리성(Transaction Isolation)"
search: false
category:
  - information
last_modified_at: 2021-08-22T00:30:00
---

<br>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Transaction ACID][acid-link]

## 0. 들어가면서

트랜잭션에서 발생할 수 있는 문제점들에 대해 알아보고 이를 해결하기 위한 트랜잭션 격리 수준들에 대해 정리하였습니다.
각 격리 수준 별로 발생할 수 있는 문제들을 한 눈에 확인할 수 있도록 표로 정리하였습니다. 

## 1. 트랜잭션에서 발생할 수 있는 문제들

### 1.1. Dirty Read
- 트랜잭션 작업이 완료되지 않은 데이터를 다른 트랜잭션에서 볼 수 있는 현상

<p align="center"><img src="/images/transcation-isolation-1.JPG"></p>

### 1.2. Non-Repeatable Read
- 하나의 트랜잭션에서 같은 쿼리를 두 번 이상 수행할 때 결과가 달라지는 현상

<p align="center"><img src="/images/transcation-isolation-2.JPG"></p>

### 1.3. Phantom Read
- 하나의 트랜잭션에서 일정 범위의 레코드를 두 번 이상 수행할 때 처음 수행할 때 없던 레코드가 나타나는 현상

<p align="center"><img src="/images/transcation-isolation-3.JPG"></p>

## 2. 트랜잭션 격리 수준(Transaction Isolation Level)

> 병렬 트랜잭션 시 특정 트랜잭션이 다른 트랜잭션에서 변경하는 데이터를 언제부터 볼 수 있는지 허용하는 수준

### 2.1. Read Uncommitted
- 모든 트랜잭션은 다른 트랜잭션의 커밋(commit) 여부와 상관없이 변경되는 데이터를 확인 가능합니다.
- 데이터 정합성이 좋지 않은 격리 수준이므로 사용하지 않습니다.
- Dirty Read, Non-Repeatable Read, Phantom Read 발생 가능

<p align="center"><img src="/images/transcation-isolation-4.JPG"></p>

### 2.2. Read Committed
- 각 트랜잭션은 다른 트랜잭션의 커밋 완료된 데이터만 확인 가능합니다.
- 주로 사용되는 격리 수준입니다.
- Non-Repeatable Read, Phantom Read 발생 가능

<p align="center"><img src="/images/transcation-isolation-5.JPG"></p>

### 2.3. Repeatable Read
- 한 트랜잭션이 시작되면 다른 트랜잭션에서 커밋 된 데이터가 있더라도 확인되지 않습니다.
- 트랜잭션 별로 식별자를 주고 `UNDO` 영역의 데이터를 백업해둠으로써 트랜잭션의 일관성을 보장합니다.
- Phantom Read 발생 가능

<p align="center"><img src="/images/transcation-isolation-6.JPG"></p>

### 2.4. Serializable
- 가장 높은 수준의 격리 수준입니다. 
- 레코드를 조회할 때 shared lock을 획득해야만 조회가 가능합니다.
- 레코드를 수정할 때 exclusive lock을 획득해야만 변경이 가능합니다.
- 한 트랜잭션에서 사용하는 데이터는 다른 트랜잭션에서 사용 불가능합니다.
- 격리 수준에 따른 문제는 발생하지 않지만 동시성이 저하되는 문제가 발생합니다.

### 2.5. 각 격리 수준별 발생 가능 문제점

| 격리 수준 | Dirty Read | Non-Repeatable Read | Phantom Read |
|---|:---:|:---:|:---:|
| Read Uncommitted | O | O | O |
| Read Committed | X | O | O |
| Repeatable Read | X | X | O |
| Serializable | X | X | X |

#### REFERENCE
- <https://nesoy.github.io/articles/2019-05/Database-Transaction-isolation>

[acid-link]: https://junhyunny.github.io/information/transcation-acid/