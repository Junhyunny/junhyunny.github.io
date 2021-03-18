---
title: "Lock Mechanism"
search: false
category:
  - information
last_modified_at: 2021-02-14T00:00:00
---

<br>

엔터프라이즈 어플리케이션은 많은 요청들을 처리합니다. 
그렇기 때문에 동일한 데이터에 대한 업데이트가 여러 트랜잭션에 의해 동시 다발적으로 발생할 수 있습니다. 
이로 인해 일부 요청의 유실이 발생할 수 있고, 시스템 장애가 유발될 수 있습니다. 
이런 이유들은 어플리케이션이 데이터베이스에 대한 동시 접근성(concurrency)을 관리하도록 만듭니다.

어플리케이션은 동시에 수행되는 트랜잭션들을 일관되도록 처리하기 위해 **`DATA LOCK`**을 사용합니다. 
어플리케이션에서 DATA LOCK을 위한 방법으로 무엇을 사용하는지, 방법에 따라 어떤 부분들이 다른지 알아보도록 하겠습니다. 

## Optimistic Lock (낙관적인 잠금)

> 트랜잭션 충돌이 발생하지 않는다고 가정한 낙관적인 LOCK

트랜잭션 충돌이 발생하지 않을 것이라고 낙관적으로 생각하는 Locking 방법입니다. 
실제 업데이트시 트랜잭션 충돌을 감지하면 Excpeiton을 발생시켜 해당 트랜잭션을 실패시킵니다. 
트랜잭션을 재시도를 할지 종료시킬지는 비즈니스적으로 결정합니다. 

### Optimistic Lock 시나리오
트랜잭션 충돌에 대한 감지는 조회한 데이터의 VERSION 값을 통해 이루어집니다. 
아래와 같은 시나리오를 통해 트랜잭션 충돌 여부를 감지합니다. 
1. 데이터를 조회할 때 해당 시점의 VERSION 값이 함께 조회됩니다.
1. 이후 업데이트할 때 VERSION 값 증가 여부에 따라 트랜잭션 충돌이 감지됩니다.
  - SET 절에 `VERSION = {currentVersion} + 1`이 추가되어 현재 VERSION 값을 증가시키는 쿼리 수행
  - WHERE 절에 `VERSION = {currentVersion}`이 추가되어 다른 트랜잭션에 의한 VERSION 증가가 있었는지 확인하는 쿼리 수행
  - 업데이트 결과가 0 건이라면 다른 트랜잭션에 의한 VERSION 증가로 인지하여 `OptimisticLockException` 발생

<p align="center"><img src="/images/application-lock-mechanism-1.JPG" width="750"></p>

## Pessimistic Lock (비관적인 잠금)

> 트랜잭션 충돌을 예상하고 미리 데이터에 대한 LOCK을 점유하는 비관적인 LOCK

트랜잭션 충돌이 발생할 것이라 예상하고 조회시 미리 데이터에 대한 LOCK을 점유하는 방법입니다. 
예를 들어 어플리케이션은 데이터를 조회할 때 `SELECT - FOR UPDATE` 쿼리를 수행하여 조회와 동시에 데이터 LOCK을 시도할 수 있습니다. 
이 Locking 방법은 특정 트랜잭션이 데이터에 대한 LOCK을 선점하기 때문에 다른 트랜잭션들의 지연(WAIT)을 유발할 수 있습니다.

### Pessimistic Lock 시나리오
어플리케이션은 아래와 같은 시나리오를 통해 Pessimistic Lock을 수행합니다.
1. 데이터 조회시 `SELECT - FOR UPDATE` 쿼리를 수행하여 조회와 동시에 데이터 LOCK
1. 다른 트랜잭션들은 잠금된 데이터에 대해 업데이트 수행시 LOCK을 선점한 특정 트랜잭션 종료 시점까지 대기

<p align="center"><img src="/images/application-lock-mechanism-2.JPG" width="750"></p>

## OPINION
이번 포스트는 어플리케이션에서 사용하는 Locking 방법들의 개념에 대해서만 정리해보았습니다. 
JPA는 어떻게 LOCK 기능을 제공하는지 다음 포스트에서 테스트 코드들을 통해 알아보도록 하겠습니다. 
Optimistic Lock, Pessimistic Lock 두 가지 방법을 각기 다른 주제로 선정하여 정리하도록 하겠습니다.

#### REFERENCE
- <https://stackoverflow.com/questions/129329/optimistic-vs-pessimistic-locking>