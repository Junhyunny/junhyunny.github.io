---
title: "MSA Circuit Breaker Pattern"
search: false
category:
  - spring
  - spring cloud
  - msa
  - circuit-breaker
  - netflix-oss
last_modified_at: 2021-03-13T00:00:00
---

<br>

마이크로 서비스 아키텍처(MSA, Micro Service Architecture)는 한가지 일만 잘하는 서비스들이 협업하는 아키텍처입니다. 
서비스들은 Rest API 같은 동기식 처리를 통해 협업을 수행합니다. 
동기식 처리 방식의 문제점은 한 서비스에서 장애가 발생하였을 때 다른 서비스들로 장애가 전파된다는 것입니다. 

##### 마이크로 서비스 아키텍처 장애 전파
<p align="center"><img src="/images/msa-circuit-breaker-pattern-1.gif" width="500"></p>

그렇기 때문에 마이크로 서비스 아키텍처는 스스로 회복성(Resilience)를 가지도록 구성되어야 합니다.([Micro Service Architecture][msa-blogLink]) 
이번 포스트는 마이크로 서비스 아키텍처에서 장애를 격리시켜 전파를 막는 방법에 대해 알아보도록 하겠습니다.

> **Micro Service Architecture 핵심 원칙, 회복성(Resilience)**<br>
> 마이크로 서비스는 자연스러운 메커니즘을 통해 장애를 격리시킵니다.

## Circuit Breaker
작성 중입니다.

## OPINION
작성 중입니다.

#### REFERENCE
- <https://martinfowler.com/bliki/CircuitBreaker.html>

[msa-blogLink]: https://junhyunny.github.io/information/msa/microservice-architecture/