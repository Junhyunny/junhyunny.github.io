---
title: "쿠키(Cookie)와 세션(Session)"
search: false
category:
  - information
last_modified_at: 2021-04-19T00:00:00
---

<br>

웹 서버 개발에 기본적인 개념인 쿠키(Cookie)와 세션(Session)에 대해서 정리해보도록 하겠습니다. 
쿠키와 세션에 대해 정리하기 전에 우선 HTTP(Hyper Text Transfer Protocol) 통신의 stateless 특징이 무엇인지 알아보겠습니다.

## HTTP 통신의 stateless 특징
쿠키와 세션을 사용하게 된 배경에는 HTTP 통신의 stateless 특징이 있습니다. 
우선 **`stateless`** 라는 단어가 무슨 의미인지 찾아보았습니다. 

> Wiki<br>
> 무상태 프로토콜(stateless protocol)은 어떠한 이전 요청과도 무관한 각각의 요청을 독립적인 트랜잭션으로 취급하는 통신 프로토콜, 
> 통신이 독립적인 쌍의 요청과 응답을 이룰 수 있게 하는 방식이다.

무상태(stateless)라는 의미는 서버가 클라이언트의 정보를 유지하지 않는다는 의미입니다. 
서버는 클라이언트의 정보를 유지하지 않기 때문에 각 요청을 독립적으로 처리합니다. 
이전 데이터 요청과 다음 데이터 요청을 서로 무관하게 처리하며, 요청에 포함된 데이터를 이용해 그 시점에 적절한 응답을 줄 뿐입니다. 

이상합니다.🤨 
서버가 클라이언트에 대한 정보를 가지고 있지 않은데 사용자가 한번 로그인을 하면 사용자 인증이 유지된 상태로 서비스를 이용할 수 있습니다. 
**`'이거는 상태가 유지되는게 아닌가?'`** 하는 의문이 들었습니다. 
상태가 유지되는게 맞습니다. 
HTTP 프로토콜은 stateless 특징을 가지지만 stateful 한 서비스를 하기 위해 쿠키와 세션을 사용합니다. 
미리 말하자면 쿠키는 클라이언트, 세션 정보는 서버 측에 저장됩니다.

##### 쿠키와 세션 정보 위치
<p align="center"><img src="/images/cookie-and-session-1.JPG" width="80%"></p>

### Stateless 서버의 장점
Stateful 한 서비스를 제공할거면 stateful 특징을 가지는 통신 방식을 이용하면 되는데 굳이 HTTP 통신을 사용하는 것일까요. 
Stateless 특징은 스케일링(scaling)이 자유롭다는 장점이 있습니다. 
요청 트래픽 양에 따라 서비스가 증가, 감소하게 되는 스케일링이 발생하게 되면 stateful 서버는 

##### Stateful 서버 scale out


##### Stateless 서버 scale out


## 쿠키(Cookie)

## 세션(Session)

## OPINION
첫 프로젝트로 레거시 시스템을 마이크로 서비스 아키텍처로 변환하는 
약 3년이라는 경력을 가지고 있지만 쿠키, 세션이라는 

#### REFERENCE
- [[Stateful/Stateless] Stateful vs. Stateless 서비스와 HTTP 및 REST][stateless-service-blogLink]

[stateless-service-blogLink]: https://5equal0.tistory.com/entry/StatefulStateless-Stateful-vs-Stateless-%EC%84%9C%EB%B9%84%EC%8A%A4%EC%99%80-HTTP-%EB%B0%8F-REST