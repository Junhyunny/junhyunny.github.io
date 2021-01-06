---
title: "MSA Pros And Cons"
search: false
category: 
  - main project
  - information
  - msa
last_modified_at: 2021-01-06T00:00:00
---

# MSA Pros And Cons<br>

[Microservice Architecture][msa-blogLink]포스트에서는 마이크로서비스 아키텍처와 이를 구성하는 서비스의 특징과 원칙에 대한 이야기를 해보았습니다.
이번 포스트에서는 마이크로서비스 아키텍처의 장점과 단점에 대해서 정리해보았습니다. 

## MSA Pros
### Polyglot Architecture
생소한 폴리글랏(Polyglot)이라는 단어의 의미부터 찾아보았습니다. 

> knowing or using several languages.

말 그대로 다양한 언어를 사용한 아키텍처를 의미합니다. 
프로그래밍 언어나 DB는 각자 특성에 따라 활용되는 용도가 다릅니다. 
비즈니스 별로 특성을 살릴 수 있도록 용도에 맞는 프로그래밍 언어가 사용되어 개발된다면 더 좋은 품질의 서비스를 제공할 수 있을 것입니다. 

<p align="center"><img src="/images/msa-pros-and-cons-1.JPG"></p>

### 실험과 혁신 유도
> 마이크로서비스는 단순하고 크기가 작아 기업들이 적은 비용으로 새로운 프로세스, 알고리즘, 비즈니스 로직 등을 실험해 볼 수 있습니다. 

대규모 일체형 어플리케이션에서는 실험해보는 것이 쉽지 않고 비용도 적지 않습니다. 
마이크로서비스는 실험적인 새로운 기능을 만들어 적용시켜보고 기대치에 부응하지 못하면 다른 마이크로서비스로 변경하거나 대체할 수 있습니다.

### 확장성에 대한 이야기
마이크로서비스에 대한 장점에 대해서 이야기할 때 확장성에 대한 이야기는 빠지지 않습니다. 
어플리케이션 확장성에 대한 설명은 주로 스케일 큐브(Scale cube)를 통해 진행됩니다. 
**스케일 큐브(Scale Cube)는 어플리케이션을 확장하는 데 필요한 세 가지 주요 접근 방식을 정의합니다.**

<p align="center"><img src="/images/msa-pros-and-cons-2.JPG"></p>
<center>이미지 출처, https://akfpartners.com/growth-blog/scale-cube</center><br>

- x 축 방향의 확장은 어플리케이션을 복제해서 수평적으로 확장하는 것을 의미
- y 축 방향의 확장은 서로 다른 기능을 분리하는 것을 의미 - Microservices (or micro-services)
- z 축 방향의 확장은 데이터 파이셔닝(partitioning) 또는 샤딩(sharding)을 의미

<br>
y 축 방향의 확장이 일체형 어플리케이션에 적용되면 일체형에 담겨있던 기능은 분리되어 비즈니스 기능에 맞게 더 작은 서비스들로 분리가 됩니다. 
y 축 방향의 확장이 이루어지면 아래와 같은 장점과 단점을 얻게 됩니다. 
- Pros of Y axis scaling
  - Allows for organizational scale
  - Scales transactions well
  - Fault isolation
  - Increases cache hit rate
- Cons of Y axis scaling
  - Intellectually hard
  - Takes time to implement
    
### 대체 가능성
> 마이크로서비스는 자기 완비적이고 독립적으로 배포 가능한 모듈입니다. 
> 그렇기 때문에 하나의 마이크로서비스를 비슷한 다른 마이크로서비스로 대체할 수 있습니다. 

기존 일체형의 경우 하나의 모듈을 다른 모듈로 변경할 경우 시스템 전체에 미칠 수 있는 영향도 파악이 어렵기 때문에 많은 시간과 비용이 듭니다. 
일체형 어플리케이션 컴포넌트들이 높은 응집성을 가진다면 특정 모듈을 변경하는 일은 더 어려울 것입니다. 

### 유기적 시스템 구축 유도
> 유기적인 시스템이란 시간이 지남에 따라 점점 더 많은 기능을 추가하면서 성장해가는 시스템을 의미합니다.

마이크로서비스는 독립적으로 관리 가능한 서비스입니다. 
덕분에 마이크로서비스 아키텍처에서는 필요에 따라 서비스를 더 많이 추가하면서도 기존 서비스에 미치는 영향을 최소화할 수 있습니다. 

### 기술 부채의 경감
> 수명이 다한 기술을 사용하는 서비스를 다른 기술을 사용하는 서비스로 최소한의 비용으로 전환이 가능합니다.

시스템도 오래 사용하다보면 필연적으로 죽음(?)을 맞이하게 됩니다. 
기술의 수명이 다함과 동시에 시스템은 새로운 기술을 이용하여 재탄생되어야 합니다. 
마이크로서비스는 단일 업무 수행에 대한 원칙으로 각 서비스 별로 의존성이 매우 낮은 것이 특징입니다. 
그렇기 때문에 서비스 교체에 대한 비용이 높지 않습니다. 
반면에 일체형 아키텍처의 경우 시스템 전체에 대한 변경으로 인해 많은 비용이 소요됩니다.

## MSA Cons
작성 중입니다.

## OPINION
작성 중입니다.

#### 참조글
- 스프링 5.0 마이크로서비스 2/e, 라제시 RV 지음
- <https://akfpartners.com/growth-blog/scale-cube>

[msa-blogLink]: https://junhyunny.github.io/main%20project/information/msa/microservice-architecture/