---
title: "데이터베이스 락(Database Lock)"
search: false
category:
  - information
  - database
  - database-lock
last_modified_at: 2025-07-02T22:45:00
---

<br/>

## 0. 들어가면서

엔터프라이즈 애플리케이션은 동시에 많은 요청들을 처리한다. 동일한 데이터에 대한 변경이 여러 트랜잭션(transaction)에 의해 동시 다발적으로 발생하기 때문에 일부 데이터가 유실될 수 있다. 이런 문제를 해결하기 위해 애플리케이션은 데이터베이스에 대한 동시성(concurrency)을 제어할 필요가 있다. 애플리케이션은 데이터 락(lock)을 통해 데이터에 대한 동시성 제어를 수행한다. 어떤 방법이 있는지 어떤 부분이 다른지 살펴본다.

## 1. Optimistic Lock 

> 트랜잭션 충돌이 발생하지 않는다고 가정한 낙관적인 락 방식

트랜잭션 충돌이 발생하지 않을 것이라고 낙관적으로 생각하는 데이터 제어 방법이다. 실제 업데이트 시 트랜잭션 충돌을 감지하면 예외(exception)를 발생시켜 해당 트랜잭션을 중지한다. 트랜잭션을 재시도할지 종료할지는 비즈니스적으로 결정한다.

데이터베이스 수준에서 실제로 락을 점유하는 것이 아니기 때문에 다른 트랜잭션의 접근이 가능하다. 데이터를 사용하지 못하게 잠근다는 의미보다는 충돌이 났을 때 이를 감지하는 방법이다.

### 1.1. How to work optimistic lock?

트랜잭션 충돌에 대한 감지는 조회한 데이터의 버전(version) 값을 통해 이루어진다. 아래와 같은 시나리오를 통해 트랜잭션 충돌 여부를 감지한다.

1. 데이터를 조회할 때 해당 시점의 버전 값을 함께 조회한다.
2. 이후 업데이트할 때 데이터의 현재 버전을 확인하여 충돌을 감지하고, 현재 버전 값을 증가시켜 데이터 변경 여부를 남긴다. 
  - `SET`에 `VERSION = {currentVersion} + 1`을 추가하여 현재 버전 값을 증가시킨다.
  - `WHERE`에 `VERSION = {currentVersion}`을 추가하여 다른 트랜잭션에 의한 버전 값 변경이 있었는지 확인한다.
  - 업데이트 결과가 0건이라면 다른 트랜잭션에 의한 데이터 변경을 인지하여 `OptimisticLockException`을 발생시킨다.

<div align="center">
  <img src="/images/posts/2021/application-lock-mechanism-01.png" width="80%" class="image__border">
</div>

## 2. Pessimistic Lock

> 트랜잭션 충돌을 예상하고 미리 데이터에 대한 락을 선점하는 비관적인 락 방식

트랜잭션 충돌이 발생할 것이라 예상하고 조회 시 미리 데이터에 대한 락을 선점한다. 예를 들어 애플리케이션은 데이터를 조회할 때 `SELECT FOR UPDATE WAIT` 쿼리를 수행하여 조회와 동시에 데이터 락을 점유한다. 이 비관적인 락은 특정 트랜잭션이 데이터에 대한 락을 선점하기 때문에 다른 트랜잭션들의 지연을 유발할 수 있다.

### 2.1. How to work pessimistic lock?

애플리케이션은 아래와 같은 시나리오를 통해 비관적인 락 방식을 수행한다.

1. 데이터 조회 시 `SELECT FOR UPDATE WAIT` 쿼리를 수행하여 조회와 동시에 데이터 락을 점유한다.
  - 조회 시 다른 트랜잭션에 의해 락이 걸린다면 지정한 시간만큼 대기한다.
  - 지정한 시간을 초과하면 예외를 발생시킨다.
2. 다른 트랜잭션들은 잠금된 데이터에 대해 업데이트 수행 시 데이터 락을 선점한 특정 트랜잭션 종료 시점까지 대기한다.

<div align="center">
  <img src="/images/posts/2021/application-lock-mechanism-02.png" width="80%" class="image__border">
</div>

#### RECOMMEND NEXT POSTS

- [Optimistic Lock in QueryDSL][optimistic-lock-in-query-dsl-link]
- [JPA 낙관적 락(optimistic lock)][jpa-optimistic-lock-link]
- [JPA 비관적 락(pessimistic lock)][jpa-pessimitic-lock-link]

#### REFERENCE

- <https://stackoverflow.com/questions/129329/optimistic-vs-pessimistic-locking>

[jpa-optimistic-lock-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-optimistic-lock/
[jpa-pessimitic-lock-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-pessimitic-lock/
[optimistic-lock-in-query-dsl-link]: https://junhyunny.github.io/java/spring-boot/query-dsl/jpa/optimistic-lock-in-query-dsl/