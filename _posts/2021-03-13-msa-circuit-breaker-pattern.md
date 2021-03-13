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
서비스들은 Rest API 같은 동기식 처리 방법을 통해 협업을 수행합니다. 
동기식 처리 방식의 문제점은 한 서비스에서 에러가 발생하거나 느려지면 이를 호출하는 다른 서비스들로 장애가 전파된다는 것입니다. 

##### 마이크로 서비스 아키텍처 장애 전파
<p align="center"><img src="/images/msa-circuit-breaker-pattern-1.gif" width="500"></p>

그렇기 때문에 마이크로 서비스 아키텍처는 스스로 회복성(Resilience)를 가지도록 구성되어야 합니다.([Micro Service Architecture][msa-blogLink]) 
> **Micro Service Architecture 핵심 원칙, 회복성(Resilience)**<br>
> 마이크로 서비스는 자연스러운 메커니즘을 통해 장애를 격리시킵니다.

이번 포스트는 마이크로 서비스 아키텍처에서 장애를 격리시켜 전파를 막는 방법에 대해 알아보도록 하겠습니다.

## Circuit Breaker Pattern
요청을 처리하는 서비스가 느려지는 경우 장애가 전파되는 이유는 응답을 받지 못한 서비스의 스레드가 대기하게 되면서 사용 가능한 스레드가 줄어들기 때문입니다. 
요청을 처리하는 서비스에 에러가 발생하면 exception이 발생하면서 장애가 전파됩니다. 

마이크로 서비스 아키텍처는 장애 전파를 막기 위해 **`Circuit Breaker 패턴`**을 사용합니다. 
Circuit Breaker 패턴은 이름처럼 회로 차단기 역할을 수행합니다. 
서비스와 서비스 사이에 API 요청을 차단할 수 있는 circuit breaker를 추가합니다. 

##### Circuit Breaker 동작
1. client 서비스에서 supplier 서비스로 요청을 수행합니다.
1. 장애가 없다면 circuit breaker는 요청은 이상없이 전달됩니다.(circuit close)
1. supplier 서비스에 문제가 발생하면 circuit breaker는 supplier 서비스로의 요청을 차단합니다.(circuit open)
1. Fall back으로 지정한 응답을 client 서비스로 전달합니다.

<p align="center"><img src="/images/msa-circuit-breaker-pattern-2.JPG"></p>
<center>이미지 출처, https://martinfowler.com/bliki/CircuitBreaker.html</center><br>

위 이미지는 circuit breaker가 서비스로 보일 수 있으니 조금 수정해보았습니다. 
circuit breaker는 실제로 client 서비스에 추가되어 있습니다. 

<p align="center"><img src="/images/msa-circuit-breaker-pattern-3.JPG"></p>

## OPINION
작성 중입니다.

#### REFERENCE
- <https://martinfowler.com/bliki/CircuitBreaker.html>
- <https://bcho.tistory.com/1247>

[msa-blogLink]: https://junhyunny.github.io/information/msa/microservice-architecture/