---
title: "트랜잭션 격리성(Transaction Isolation)"
search: false
category:
  - information
last_modified_at: 2021-01-30T00:00:00
---

<br>

지난 [Transaction ACID 특징][acid-blogLink] 포스트에서 다뤘던 내용 중 격리성(isolation)에 대한 내용을 더 자세히 다뤄보고자 합니다. 
트랜잭션에서 발생할 수 있는 문제점들에 대해 알아보고 이를 해결하기 위한 트랜잭션 격리 수준들에 대해 정리하였습니다.
각 격리 수준 별로 발생할 수 있는 문제들을 한 눈에 확인할 수 있도록 표로 정리하였습니다. 

## 트랜잭션에서 발생할 수 있는 문제들

### Dirty Read
- 트랜잭션 작업이 완료되지 않은 데이터를 다른 트랜잭션에서 볼 수 있는 현상

<p align="center"><img src="/images/transcation-isolation-1.JPG"></p>

### Non-Repeatable Read
- 하나의 트랜잭션에서 같은 쿼리를 두 번 이상 수행할 때 결과가 달라지는 현상

<p align="center"><img src="/images/transcation-isolation-2.JPG"></p>

### Phantom Read
- 하나의 트랜잭션에서 일정 범위의 레코드를 두 번 이상 수행할 때 처음 수행할 때 없던 레코드가 나타나는 현상

<p align="center"><img src="/images/transcation-isolation-3.JPG"></p>

## 트랜잭션 격리 수준(Transaction Isolation Level)

> 병렬 트랜잭션 시 특정 트랜잭션이 다른 트랜잭션에서 변경하는 데이터를 언제부터 볼 수 있는지 허용하는 수준

### Read Uncommitted
- 모든 트랜잭션은 다른 트랜잭션의 COMMIT 여부와 상관없이 변경되는 데이터를 확인 가능합니다.
- 데이터 정합성이 좋지 않은 격리 수준이므로 사용하지 않습니다.
- Dirty Read, Non-Repeatable Read, Phantom Read 발생 가능

<p align="center"><img src="/images/transcation-isolation-4.JPG"></p>

### Read Committed
- 각 트랜잭션은 다른 트랜잭션의 COMMIT 완료된 데이터만 확인 가능합니다.
- 주로 사용되는 격리 수준입니다.
- Non-Repeatable Read, Phantom Read 발생 가능

<p align="center"><img src="/images/transcation-isolation-5.JPG"></p>

### Repeatable Read
- 한 트랜잭션이 시작되면 다른 트랜잭션에서 COMMIT 된 데이터가 있더라도 확인되지 않습니다.
- 트랜잭션 별로 식별자를 주고 UNDO 영역의 데이터를 백업해둠으로써 트랜잭션의 일관성을 보장합니다.
- Phantom Read 발생 가능

<p align="center"><img src="/images/transcation-isolation-6.JPG"></p>

### Serializable
- 가장 높은 수준의 격리 수준입니다. 
- 레코드를 조회할 때 shared lock을 획득해야만 조회가 가능합니다.
- 레코드를 수정할 때 exclusive lock을 획득해야만 변경이 가능합니다.
- 한 트랜잭션에서 사용하는 데이터는 다른 트랜잭션에서 사용 불가능합니다.
- 격리 수준에 따른 문제는 발생하지 않지만 동시성이 저하되는 문제가 발생합니다.

### 각 격리 수준별 발생 가능 문제점

| 격리 수준 | Dirty Read | Non-Repeatable Read | Phantom Read |
|---|:---:|:---:|:---:|
| Read Uncommitted | O | O | O |
| Read Committed | X | O | O |
| Repeatable Read | X | X | O |
| Serializable | X | X | X |

## OPINION
트랜잭션 격리 수준에 따라 발생하는 문제들에 대해 알아보았습니다. 
트랜잭션을 이미지로 시각화하면서 문제 현상에 대해 이해도가 더 높아진 것 같습니다. 
다음에 기회가 되면 Spring-Jpa를 활용하여 격리성 테스트를 수행하고 이에 대한 글을 정리해보도록 하겠습니다. 

#### REFERENCE
- <https://nesoy.github.io/articles/2019-05/Database-Transaction-isolation>

[acid-blogLink]: https://junhyunny.github.io/information/database/transcation-acid/