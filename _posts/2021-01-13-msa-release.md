---
title: "MicroService Architecture 배포 전략"
search: false
category:
  - msa
last_modified_at: 2021-08-21T17:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [MicroService Architecture][microservice-architecture-link]

## 0. 들어가면서

마이크로서비스 아키텍처의 다양한 배포 전략을 정리하였습니다. 
롤링(rolling) 배포 정도만 알고 있었는데, 그 이 외에도 마이크로서비스 아키텍처의 장점을 살릴 수 있는 다양한 배포 전략들에 대해 알아보겠습니다. 

## 1. 롤링 배포(rolling deployment)

동일 서버의 인스턴스가 여러 개 존재할 때 이를 새로운 버전으로 하나씩 교체하면서 배포하는 방식입니다. 
이전 버전에서 새로운 버전으로 트래픽을 점진적으로 전환하는 배포 방식입니다. 
배포 중에 인스턴스 수가 감소되므로 서버 처리 용량을 미리 고려해야 합니다.

<p align="center">
    <img src="/images/msa-release-1.JPG" width="80%" class="image__border">
</p>
<center>https://reference-m1.tistory.com/211</center>

## 2. 카나리 배포(Canary deployment)

> 과거 석탄 광산에서 유독가스를 미리 감지하고자 카나리아 새를 날려 보냈던 것에서 유래

위험을 최소화하면서 실제 프로덕션 배포를 테스트하는 방법입니다. 
사용자 요청의 일부를 신규 서비스로 라우팅하여 이를 테스트해봅니다. 
문제가 발견된다면 배포를 중단하고 문제의 원인을 파악하고 수정할 수 있습니다. 
트래픽 라우팅을 통해 신규 서비스를 검증할 수 있습니다. 
트래픽 분산은 랜덤하게 하거나 사용자 별로 분류할 수 있습니다. 

<p align="center">
    <img src="/images/msa-release-2.JPG" width="80%" class="image__border">
</p>
<center>https://reference-m1.tistory.com/211</center>

## 3. A/B 테스팅(A/B testing)

A/B 테스팅은 카나리 배포와 유사하지만 한가지 차이점이 있습니다. 
카나리 배포는 버그와 병목 현상 식별에 초점을 맞춘다면, A/B 테스팅은 신규 어플리케이션 기능에 관한 사용자 반응을 측정하는데 초점을 맞춥니다. 
해당 기능에 대한 사용자 호응, 주목도, 작동 여부 등을 확인할 수 있습니다. 

## 4. 블루-그린 배포(Blue-green deployments)

이전 버전을 블루(blue), 새로운 버전을 그린(green)으로 표현합니다. 
블루-그린 배포는 두 가지 프로덕션 환경을 나란히 운영합니다. 
배포 시점에 트래픽을 일제히 전환합니다. 
빠른 롤백이 가능하고, 운영 환경에 영향을 주지 않고 실제 서비스 환경으로 신 버전 테스트가 가능합니다. 
이 구성은 시스템 자원이 두배로 필요하여 비용이 더 많이 발생합니다. 

<p align="center">
    <img src="/images/msa-release-3.JPG" width="100%" class="image__border">
</p>
<center>https://reference-m1.tistory.com/211</center>

## 4. 트래픽 섀도잉(Traffic shadowing)

트래픽 섀도잉은 블루-그린 배포와 비슷하지만, 그린 환경 검증을 위한 종합적인 테스트에 집중하진 않습니다. 
라우팅을 통해 들어오는 모든 트래픽을 복제하여 아직 공개되지 않은 별도 테스트 서버에 미러링(mirroring)을 수행합니다. 
트래픽 섀도잉을 통해 실제 트래픽을 기준으로 새 버전을 배포했을 때 무슨 일이 발생하는지 정확하기 파악할 수 있습니다. 
트래픽 섀도잉을 통한 테스트는 실제 프로덕션에 아무런 영향을 미치지 않습니다. 

#### RECOMMEND NEXT POSTS

* [Pros and Cons of MicroService Architecture][msa-pros-and-cons-link]
* [MSA API Gateway][msa-api-gateway-link]

#### REFERENCE

* <https://reference-m1.tistory.com/211>
* <https://www.ciokorea.com/news/157642>

[microservice-architecture-link]: https://junhyunny.github.io/information/msa/microservice-architecture/

[msa-pros-and-cons-link]: https://junhyunny.github.io/msa/msa-pros-and-cons/
[msa-api-gateway-link]: https://junhyunny.github.io/msa/msa-api-gateway/
