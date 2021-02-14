---
title: "Application LOCK Mechanism"
search: false
category:
  - information
  - database
last_modified_at: 2021-02-14T00:00:00
---

# Application LOCK Mechanism<br>

엔터프라이즈 어플리케이션은 많은 요청들을 처리하기 때문에 여러 트랜잭션에 의해 동일한 데이터에 업데이트가 동시에 발생할 수 있습니다. 
이로 인해 일부 요청의 유실이 발생할 수 있고, 시스템 장애를 유발될 수 있습니다. 
이런 이유로 어플리케이션에서도 데이터베이스에 대한 동시 접근(concurrency)을 적절히 관리하는 것이 중요합니다. 

어플리케이션은 동시에 발생되는 트랜잭션에 대한 일관된 처리를 위한 방법으로 주로 **`LOCK`**을 사용합니다. 
LOCK을 처리하는 방법으로 무엇이 있고, 어떤 부분이 다른지 알아보도록 하겠습니다. 

## Optimistic Lock (낙관적인 잠금)

> 트랜잭션 충돌이 발생하지 않는다고 가정한 낙관적인 어플리케이션 LOCKING 방법

트랜잭션 충돌이 발생할지 않을 것이라 긍적적으로 생각하는 LOCKING 방법입니다. 
실제 업데이트시 트랜잭션 충돌을 감지하면 Excpeiton을 발생시켜 해당 트랜잭션을 실패시킵니다. 
재시도를 할지 종료시킬지는 비즈니스적으로 결정합니다. 

### Optimistic Lock 시나리오
트랜잭션 충돌에 대한 감지는 조회한 데이터의 VERSION 값을 통해 이루어집니다. 
어플리케이션은 아래와 같은 시나리오를 통해 트랜잭션 충돌 여부를 감지합니다. 
1. 데이터를 조회할 때 해당 시점의 VERSION 값이 함께 조회됩니다.
1. 이후 업데이트를 할 때 VERSION 값 증가 여부에 따라 트랜잭션 충돌을 감지됩니다.
  - SET 절에 `VERSION = {currentVersion} + 1`이 추가되어 현재 VERSION 값을 증가시키면서 쿼리
  - WHERE 절에 `VERSION = {currentVersion}`이 추가되어 다른 트랜잭션에 의한 VERSION 증가를 확인하면서 쿼리
  - 업데이트 결과가 0 건이라면 다른 트랜잭션에 의한 VERSION 증가로 인지하여 `OptimisticLockException` 발생

<p align="center"><img src="/images/application-lock-mechanism-1.JPG"></p>

## Pessimistic Lock (비관적인 잠금)

> 트랜잭션 충돌을 예상하고 미리 LOCK을 점유하는 비관적인 어플리케이션 LOCKING 방법

트랜잭션 충돌이 발생할 것이라 예상하고 조회시 미리 데이터에 대한 LOCK을 점유하는 방법입니다. 
예시로 데이터를 조회할 때 `SELECT - FOR UPDATE` 쿼리를 사용하여 조회와 동시에 데이터 LOCK을 시도할 수 있습니다.  
이 방법은 특정 트랜잭션이 데이터에 대한 LOCK을 선점하기 때문에 다른 트랜잭션들의 지연(WAIT)을 유발할 수 있습니다.

### Pessimistic Lock 시나리오
어플리케이션은 아래와 같은 시나리오를 통해 pessimistic lock을 수행합니다.
1. 데이터 조회시 `SELECT - FOR UPDATE` 쿼리를 사용하여 조회와 동시에 데이터 LOCK
1. 다른 트랜잭션이 잠금된 데이터에 대한 업데이트를 시도하는 경우 LOCK을 선점한 트랜잭션이 종료될 때까지 대기

<p align="center"><img src="/images/application-lock-mechanism-2.JPG"></p>

## OPINION
이번 포스트는 LOCK 메커니즘의 개념에 대해서만 정리해보았습니다. 
JPA는 어떻게 LOCK 기능을 제공하는지 다음 포스트에서 테스트 코드를 통해 알아보도록 하겠습니다. 

#### 참조글
- <https://stackoverflow.com/questions/129329/optimistic-vs-pessimistic-locking>