---
title: "Cookie and Session"
search: false
category:
  - information
last_modified_at: 2021-08-28T01:00:00
---

<br/>

👉 이어서 읽기를 추천합니다.
- [Session Management in Tomcat][tomcat-session-management-link]
- [Deep Dive into Cookie][cookie-attributes-link]

## 0. 들어가면서

웹 서버 개발에 기본적인 개념인 쿠키(Cookie)와 세션(Session)에 대해서 정리해보도록 하겠습니다. 
쿠키와 세션에 대해 정리하기 전에 우선 HTTP(Hyper Text Transfer Protocol) 통신의 stateless 특징이 무엇인지 알아보겠습니다.

## 1. HTTP 통신의 stateless 특징
쿠키와 세션을 사용하게 된 배경에는 HTTP 통신의 stateless 특징이 있습니다. 
우선 **`stateless`** 라는 단어가 무슨 의미인지 찾아보았습니다. 

> Wiki<br/>
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

### 1.1. Stateless 서버의 장점
Stateful 한 서비스를 제공할거면 stateful 특징을 가지는 통신 방식을 사용하면 되는데 굳이 HTTP 통신을 사용하는 것일까요. 
Stateless 특징은 스케일링(scaling)이 자유롭다는 장점이 있습니다. 
아래 이미지와 설명을 통해 이해를 돕도록 하겠습니다. 

##### Stateful 서버 scale out
1. 사용자 A가 로그인을 하면 사용자에 대한 정보가 서버에 저장됩니다.
1. 사용자가 늘어나 트래픽 증가합니다.
1. 서버의 스케일 아웃이 발생되었으나 기존 서버의 메모리는 복제되지 않습니다.
1. 사용자 A가 새로 생긴 서버로 요청하는 경우 사용자 정보가 없으므로 정상 응답이 불가능합니다.

<p align="center"><img src="/images/cookie-and-session-2.gif" width="80%"></p>

##### Stateless 서버 scale out
1. 사용자 A가 로그인을 하면 사용자에 대한 정보가 외부 저장소에 저장됩니다.
1. 사용자가 늘어나 트래픽 증가합니다.
1. 서버의 스케일 아웃이 발생됩니다.
1. 사용자 A가 새로 생긴 서버로 요청하는 경우 정상 응답이 가능합니다.

<p align="center"><img src="/images/cookie-and-session-3.gif" width="80%"></p>

## 2. 쿠키(Cookie)

> 웹 사이트에 접속할 때 생성되는 정보를 담은 임시 파일

사용자 PC에 사용자에 대한 정보를 저장하기 위한 임시 파일입니다. 
Key-Value 형태로 사용자에 대한 정보가 저장됩니다. 
이후 서버로 요청을 보낼 때 쿠키 정보를 함께 보내고, 응답 받을 때 함께 전달받아 사용자의 상태 정보를 이어나갑니다. 

### 2.1. 쿠키의 구성 요소
- 이름 - 각각의 쿠키를 구별하는 데 사용되는 이름
- 값 - 쿠키의 이름과 관련된 값
- 유효시간 - 쿠키의 유지시간
- 도메인 - 쿠키를 전송할 도메인
- 경로 - 쿠키를 전송할 요청 경로

### 2.2. 쿠키의 특징
쿠키는 다음과 같은 특징을 가집니다.
- 이름, 값, 만료일(저장 기간 설정), 경로 정보로 구성되어 있습니다.
- 클라이언트는 총 300개 쿠키를 저장할 수 있습니다.
- 하나의 도메인 당 20개 쿠키를 가질 수 있습니다
- 하나의 쿠키는 4KB(=4096byte)까지 저장 가능합니다.

### 2.3. 쿠키의 동작 순서

<p align="center"><img src="/images/cookie-and-session-4.JPG" width="80%"></p>
<center>잔재미코딩님 블로그-쿠키(Cookie)와 세션(Session)</center>

1. 클라이언트가 페이지를 요청합니다.(사용자가 웹사이트 접근)
1. 웹 서버는 쿠키를 생성합니다.
1. 생성한 쿠키에 정보를 담아 클라이언트에게 전달합니다.(Response Header에 Set-Cookie 속성 사용)
1. 전달받은 쿠키는 클라이언트 PC에 저장됩니다. 
1. 이후 다시 서버에 요청할 때 요청과 쿠키를 함께 전달합니다.(브라우저에 의해 자동 처리)
1. 서버는 전달받은 쿠키를 이용하여 해당 요청을 처리하고 응답합니다.

### 2.4. 쿠키의 한계
쿠키는 다음과 같은 한계점이 존재합니다.
- 사용자 측에 저장되고 정보를 임의로 고쳐 사용할 수 있으므로 악용 가능합니다.
- 요청 정보는 가로채기 쉽기 때문에 보안에 취약합니다.

## 3. 세션(Session)
보안이 취약하다는 쿠키의 한계점을 극복하기 위해 사용합니다. 
쿠키를 기반으로 하여 동작하기는 하지만 사용자 정보를 클라이언트 측이 아닌 서버 측에서 관리한다는 점이 다릅니다. 
클라이언트는 서버로부터 서버에서 관리하고 있는 세션 정보를 찾기 위한 세션 ID만 전달받습니다. 
세션 정보를 저장하는 장소는 서버 메모리일수도 있지만 다중 서버 환경에서는 외부 저장소를 사용합니다.
[(관련 포스트, 다중 서버 환경에서 Session 공유법 (Sticky Session, Session Clustering, Inmemory DB))][multi-servers-env-blog-link]

### 3.1. 세션의 특징
세션은 다음과 같은 특징을 가집니다.
- 각 클라이언트에게 고유 ID를 부여합니다.
- 서버는 세션 ID로 클라이언트를 구분하고 클라이언트의 요구에 맞는 서비스를 제공합니다.
- 접속 시간에 제한을 두어 일정 시간 응답이 없다면 정보가 유지되지 않도록 설정 가능합니다.
- 클라이언트는 고유 ID만 가지고 있고 서버가 이에 대응하는 클라이언트 정보를 관리하므로 비교적으로 보안성이 좋습니다.

### 3.2. 세션 동작 순서

<p align="center"><img src="/images/cookie-and-session-5.JPG" width="80%"></p>
<center>잔재미코딩님 블로그-쿠키(Cookie)와 세션(Session)</center>

1. 클라이언트가 페이지를 요청합니다.(사용자가 웹사이트 접근)
1. 서버는 세션 ID를 만들고 해당 사용자의 정보를 세션 ID와 함께 저장합니다. 
1. 생성한 세션 ID를 쿠키에 담아 클라이언트에게 전달합니다.(Response Header에 Set-Cookie 속성 사용)
1. 전달받은 쿠키는 클라이언트 PC에 저장됩니다. 
1. 이후 다시 서버에 요청할 때 요청과 쿠키를 함께 전달합니다.(브라우저에 의해 자동 처리)
1. 서버는 전달받은 쿠키에 있는 세션 ID를 활용하여 해당 요청을 처리하고 응답합니다.

### 3.3. 세션의 한계
세션은 다음과 같은 한계점이 존재합니다.
- 사용자가 많아질수록 서버의 메모리를 많이 차지합니다.
- 동접자 수가 많은 경우 서버에 과부하를 주게 되므로 성능 저하의 요인이 됩니다. 

## 4. 쿠키와 세션의 차이점 요약

<p align="center"><img src="/images/cookie-and-session-6.JPG" width="80%"></p>
<center>표 출처, https://hahahoho5915.tistory.com/32</center>

#### REFERENCE
- [[Stateful/Stateless] Stateful vs. Stateless 서비스와 HTTP 및 REST][stateless-service-blog-link]
- [잔재미코딩님 블로그-쿠키(Cookie)와 세션(Session)][cookie-and-session-blogLink]
- <https://devuna.tistory.com/23>
- <https://junshock5.tistory.com/84>
- <https://hahahoho5915.tistory.com/32>
- <https://interconnection.tistory.com/74>

[multi-servers-env-blog-link]: https://junshock5.tistory.com/84
[stateless-service-blog-link]: https://5equal0.tistory.com/entry/StatefulStateless-Stateful-vs-Stateless-%EC%84%9C%EB%B9%84%EC%8A%A4%EC%99%80-HTTP-%EB%B0%8F-REST
[cookie-and-session-blogLink]: https://www.fun-coding.org/crawl_advance1.html#6.1.-%EC%BF%A0%ED%82%A4(cookie):-%EC%83%81%ED%83%9C-%EC%A0%95%EB%B3%B4%EB%A5%BC-%ED%81%B4%EB%9D%BC%EC%9D%B4%EC%96%B8%ED%8A%B8%EC%97%90-%EC%A0%80%EC%9E%A5%ED%95%98%EB%8A%94-%EB%B0%A9%EC%8B%9D

[tomcat-session-management-link]: https://junhyunny.github.io/information/server/tomcat-session-management/
[cookie-attributes-link]: https://junhyunny.github.io/information/security/cookie-attributes/