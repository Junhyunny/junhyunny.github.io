---
title: "Quartz Clustering in Spring MVC"
search: false
category:
  - spring-mvc
last_modified_at: 2021-11-11T23:55:00
---

<br>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Quartz in Spring MVC][quartz-in-spring-mvc-link]

## 0. 들어가면서

`Quartz` 스케줄러를 처음 접했을 때 이런 의문점이 있었습니다. 
`"동일한 소스 코드를 다중 서버 환경으로 배포한다면 같은 시간에 같은 기능이 여러 곳에서 실행되니 위험하고, 불합리하지 않은가?"` 
당시에는 스케줄러 어플리케이션을 별도로 한 개의 서버로 구현한다고 생각했었는데, 정답이 아니었습니다. 

##### 다중 서버 환경에서 Quartz 동작

<p align="center"><img src="/images/quartz-clustering-in-spring-mvc-1.gif" width="65%"></p><br>

[Quartz in Spring MVC][quartz-in-spring-mvc-link] 포스트에서 `Quartz` 스케줄러에 대한 장점 중에 클러스터링(clustering)을 언급했었습니다. 

> Quartz 특장점<br> 
> 데이터베이스를 기반으로 클러스터링(clustering) 기능을 제공합니다. 

`Quartz Clustering`을 이용하면 제가 가졌던 의문점을 해결할 수 있습니다. 
이번 포스트에선 클러스터링 사용시 얻는 이점에 대해 정리하고, 간단한 구현 예제를 구현하였습니다.  

##### 다중 서버 환경에서 Quartz 클러스터링 동작

<p align="center"><img src="/images/quartz-clustering-in-spring-mvc-2.gif" width="65%"></p>

## 1. Spring Quartz Clustering
`Quartz` 구조를 살펴보면 `JobStore` 기능이 존재합니다. 
해야될 일인 `Job`과 이를 실행시킬 조건인 `Trigger`에 대한 정보를 어떤 방식으로 저장하는지를 정의한 기능입니다. 
정보를 저장하는 방법으로 `메모리` 방식과 `데이터베이스` 방식이 사용됩니다. 
다중 서버 환경에서 `데이터베이스` 방식을 사용하면 서버들간의 `Job`, `Trigger` 정보를 공유할 수 있으므로 클러스터링이 가능합니다. 

<p align="center"><img src="/images/quartz-clustering-in-spring-mvc-3.JPG" width="65%"></p>

## 2. Spring Quartz Clustering 이점

### 2.1. 고가용성(High Availability)

<p align="center"><img src="/images/quartz-clustering-in-spring-mvc-4.gif" width="65%"></p>

### 2.2. 확장성(Scalability)

<p align="center"><img src="/images/quartz-clustering-in-spring-mvc-5.gif" width="65%"></p>

### 2.3. 부하 분산(Loading Balancing)

<p align="center"><img src="/images/quartz-clustering-in-spring-mvc-6.gif" width="65%"></p>

## 2. Spring Quartz 클러스터링 구현

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-11-11-quartz-clustering-in-spring-mvc>

#### REFERENCE
- <https://junhyunny.github.io/spring-mvc/quartz-in-spring-mvc/>
- [[Quartz-3] Multi WAS 환경을 위한 Cluster 환경의 Quartz Job Scheduler 구현][quartz-clustering-in-spring-mvc-link]

[quartz-in-spring-mvc-link]: https://junhyunny.github.io/spring-mvc/quartz-in-spring-mvc/
[quartz-clustering-in-spring-mvc-link]: https://blog.advenoh.pe.kr/spring/Multi-WAS-%ED%99%98%EA%B2%BD%EC%9D%84-%EC%9C%84%ED%95%9C-Cluster-%ED%99%98%EA%B2%BD%EC%9D%98-Quartz-Job-Scheduler-%EA%B5%AC%ED%98%84/