---
title: "마이크로서비스 아키텍처(MicroService Architecture) 배포 전략"
search: false
category:
  - msa
last_modified_at: 2021-08-21T17:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [마이크로서비스 아키텍처][microservice-architecture-link]

## 0. 들어가면서

마이크로서비스 아키텍처의 다양한 배포 전략을 정리했다. 롤링(rolling) 배포 정도만 알고 있었는데, 그 이 외에도 마이크로서비스 아키텍처의 장점을 살릴 수 있는 다양한 배포 전략들이 있다는 사실을 배울 수 있었다. 

## 1. Rolling Deployment

롤링 배포(rolling deployment)는 동일 서버의 인스턴스가 여러 개 존재할 때 이를 새로운 버전으로 하나씩 교체하면서 배포하는 방식이다. 이전 버전에서 새로운 버전으로 트래픽을 점진적으로 전환하는 배포 방식이다. 배포 중에 인스턴스 수가 감소되므로 서버 처리 용량을 미리 고려해야 한다.

<div align="center">
    <img src="/images/posts/2021/msa-release-01.png" width="80%" class="image__border">
</div>
<center>https://reference-m1.tistory.com/211</center>

## 2. Canary Deployment

카나리 배포(canary deployment)는 과거 석탄 광산에서 유독가스를 미리 감지하고자 카나리아 새를 날려 보냈던 것에서 유래한 배포 방식이다. 위험을 최소화하면서 실제 프로덕션 배포를 테스트하는 방법이다. 사용자 요청의 일부를 신규 서비스로 라우팅하여 이를 테스트 해본다. 문제가 발견된다면 배포를 중단하고 문제의 원인을 파악하고 수정할 수 있다. 트래픽 라우팅을 통해 신규 서비스를 검증할 수 있고, 트래픽 분산은 랜덤하게 하거나 사용자 별로 분류하는 것도 가능하다.

<div align="center">
    <img src="/images/posts/2021/msa-release-02.png" width="80%" class="image__border">
</div>
<center>https://reference-m1.tistory.com/211</center>

## 3. A/B Testing

A/B 테스팅은 카나리 배포와 유사하지만 한가지 차이점이 있다. 카나리 배포는 버그와 병목 현상 식별에 초점을 맞춘다면, A/B 테스팅은 신규 어플리케이션 기능에 관한 사용자 반응을 측정하는데 초점을 맞춘다는 것이다. 해당 기능에 대한 사용자 호응, 주목도, 작동 여부 등을 확인할 수 있다. 

## 4. Blue-Green Deployments

블루-그린 배포(blue-green deployment)에선 이전 버전을 블루(blue), 새로운 버전을 그린(green)으로 표현한다. 일단 블루-그린 배포는 두 가지 프로덕션 환경을 나란히 실행하다. 배포 시점에 트래픽을 일제히 전환하는 방식이다. 빠른 롤백이 가능하고, 운영 환경에 영향을 주지 않고 실제 서비스 환경으로 신 버전 테스트가 가능한다. 이 구성은 시스템 자원이 두 배로 필요하여 비용이 더 많이 발생한다. 

<div align="center">
    <img src="/images/posts/2021/msa-release-03.png" width="100%" class="image__border">
</div>
<center>https://reference-m1.tistory.com/211</center>

## 4. Traffic Shadowing

트래픽 섀도잉(traffic shadowing)은 블루-그린 배포와 비슷하지만, 그린 환경 검증을 위한 종합적인 테스트에 집중하진 않는다. 라우팅을 통해 들어오는 모든 트래픽을 복제하여 아직 공개되지 않은 별도 테스트 서버에 미러링(mirroring)을 수행한다. 트래픽 섀도잉을 통해 실제 트래픽을 기준으로 새 버전을 배포했을 때 무슨 일이 발생하는지 정확하기 파악할 수 있다. 트래픽 섀도잉을 통한 테스트는 실제 프로덕션에 아무런 영향을 미치지 않는다. 

#### RECOMMEND NEXT POSTS

- [MSA API 게이트웨이(gateway)][msa-api-gateway-link]

#### REFERENCE

- <https://reference-m1.tistory.com/211>
- <https://www.ciokorea.com/news/157642>

[microservice-architecture-link]: https://junhyunny.github.io/information/msa/microservice-architecture/
[msa-api-gateway-link]: https://junhyunny.github.io/msa/msa-api-gateway/
