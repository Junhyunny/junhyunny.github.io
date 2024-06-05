---
title: "Cookie and Session"
search: false
category:
  - information
last_modified_at: 2021-08-28T01:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [LocalStorage in Browser][local-storage-link]
* [SessionStorage in Browser][session-storage-link]

## 0. 들어가면서

웹 서비스를 개발하면 기본적인 저장소 개념에 대해 알아야 합니다. 
클라이언트에서 사용하는 저장소와 서버에서 사용하는 저장소가 서로 다릅니다. 

* 클라이언트 저장소
    * 로컬 스토리지(local storage)
    * 세션 스토리지(session storage)
    * 쿠키(cookie)
* 서버 저장소
    * 세션(session)
    * 데이터베이스(database)
    * 캐시(cache)

프론트엔드 개발자와 백엔드 개발자가 세션에 대해 이야기할 때 종종 대화가 꼬이기도 하는데 이는 구분지어 이야기해야 합니다. 
이번 포스트는 클라이언트 저장소의 쿠키와 서버 저장소의 세션에 대한 내용을 다룹니다. 

## 1. Stateless Characteristic of HTTP

HTTP(Hyper Text Transfer Protocol) 통신에서 요청을 보내는 측을 클라이언트(client), 요청을 받아 처리하고 응답하는 측을 서버(server)라고 합니다. 
웹 서비스에서 클라이언트는 보통 브라우저를 의미합니다. 
클라이언트와 서버 사이의 HTTP 통신은 기본적으로 상태를 저장하지 않는 특징을 가집니다. 

> 무상태 프로토콜(stateless protocol)은 어떠한 이전 요청과도 무관한 각각의 요청을 독립적인 트랜잭션으로 취급하는 통신 프로토콜 

기본적인 HTTP 통신은 모든 요청이 독립적입니다. 
상태를 저장하지 않기 때문에 이전 요청이 현재 요청에 영향을 주지 않습니다. 
무상태 프로토콜은 HTTP가 처음 등장했을 때처럼 HTML 문서를 전달하는 용도로만 사용했다면 문제가 없었겠지만, 현재는 HTTP 통신을 기반으로 다양한 서비스를 제공하기 때문에 무상태 프로토콜은 유용성(usability)에 큰 걸림돌이 됩니다. 

하지만 실제로 웹 서비스들은 클라이언트의 동작으로 변경된 상태를 계속 유지합니다.

* 사용자가 로그인한 상태를 계속 유지
* 쇼핑몰 사용자가 로그인 없이도 장바구니에 담은 항목들을 유지

무상태 프로토콜 특징을 가진 HTTP 통신에서 서버가 사용자의 상태를 저장하는 방법이 세션입니다. 
서버에 저장된 세션을 찾을 수 있는 키(key)가 클라이언트 PC에 저장되는 것이 쿠키입니다. 
둘 사이에 어떤 연결 고리가 존재하는지 정리해보겠습니다. 

<p align="center">
    <img src="/images/cookie-and-session-1.JPG" width="100%" class="image__border">
</p>

## 2. Session 

세션은 다양한 기술을 통해 구성될 수 있습니다. 
서버의 고가용성, 성능 개선과 같은 특징을 위해 적절한 기술을 사용합니다.

* 서버 메모리
* 데이터베이스
* 캐시 서버(e.g. Redis)

경험상 주로 세션에 다음과 같은 데이터들을 저장합니다. 

* 사용자 정보와 권한(roles)
* 서비스를 위한 기타 정보들

세션 생성은 다음과 같은 과정을 통해 이뤄집니다. 

1. 특정 클라이언트가 서버로 요청을 보냅니다.
1. 서버는 클라이언트가 보낸 요청이 첫 요청인지 확인합니다.
    * 서버는 자신이 관리하는 세션에 클라이언트가 보낸 세션 ID에 해당하는 정보가 존재하는지 확인합니다.
    * 클라이언트가 세션 ID를 보내지 않았다면 최초 요청으로 판단합니다. 
    * 클라이언트가 세션 ID를 보냈으나 세션에 데이터가 없다면 만료된 사용자로 판단하고, 최초 사용자로 처리합니다.
1. 서버는 현재 요청이 클라이언트가 처음 보낸 것이라 판단하는 경우 해당 클라이언트를 위한 저장 공간을 세션에 만듭니다.
1. 서버는 세션의 해당 저장 공간을 찾을 수 있는 세션 ID를 함께 발급합니다.
1. 서버는 요청에 대한 적절한 처리를 수행한 후 세션 ID를 클라이언트에게 응답과 함께 전달합니다. 

<p align="center">
    <img src="/images/cookie-and-session-2.JPG" width="80%" class="image__border">
</p>
<center>쿠키(Cookie)와 세션(Session)</center>

## 3. Cookie

서버는 생성한 세션 정보를 찾을 수 있는 세션 ID를 발급해서 클라이언트(이하 브라우저)에게 전달합니다. 
서버는 세션 ID를 브라우저가 쿠키에 저장할 수 있도록 HTTP 헤더에 쿠키 정보를 담아 전달합니다. 

##### Setup Cookie at Server

서버는 다음과 같은 코드를 통해 HTTP 헤더에 쿠키 정보를 담습니다.  

```java
    Cookie sessionId = new Cookie("JSESSIONID", "9BDAD4736CAC0F5ED4078C2AC072AFCB");
    servletResponse.addCookie(sessionId);
```

```java
    response.setHeader("Set-Cookie", "JSESSIONID=" + sessionId + "; SameSite=None; Secure");
```

##### Response from Server with Cookie

브라우저는 다음과 같은 응답을 받으면 자동으로 클라이언트 PC 특정 위치에 쿠키 정보를 저장합니다. 

```
HTTP/1.1 200
Set-Cookie: JSESSIONID=9BDAD4736CAC0F5ED4078C2AC072AFCB; Path=/; HttpOnly
Content-Type: text/html;charset=UTF-8
Content-Language: ko-KR
Content-Length: 471
Date: Thu, 30 Dec 2021 15:49:59 GMT
Keep-Alive: timeout=60
Connection: keep-alive
```

### 3.1. Usage Cookie

쿠키는 브라우저에 의해 자동으로 사용됩니다. 
프론트엔드 코드를 통해 제어되는 경우는 로그아웃(logout)을 제외하고 거의 없습니다. 
쿠키는 다음과 같은 과정을 통해 사용됩니다. 

1. 브라우저가 페이지를 요청합니다.
1. 서버는 요청에 대한 적절한 처리를 수행하고, 세션을 생성한 후 세션 ID를 HTTP 헤더 쿠키 정보에 담아 응답합니다. 
    * HTTP 헤더의 Set-Cookie 속성을 사용합니다.
1. 브라우저는 HTTP 헤더에 쿠키 관련된 정보가 있다면 이를 클라이언트 PC에 저장합니다.
1. 이후 동일한 도메인에 해당하는 서버로 요청을 보낼 때마다 쿠키를 함께 전달합니다.
    * 해당 작업은 브라우저에 의해 자동으로 처리됩니다.
1. 서버는 HTTP 헤더 쿠키 정보에 함께 전달된 세션 ID를 통해 특정 사용자에 맞춘 적합한 요청 처리를 수행합니다.

<p align="center">
    <img src="/images/cookie-and-session-3.JPG" width="80%" class="image__border">
</p>
<center>쿠키(Cookie)와 세션(Session)</center>

### 3.2. Characteristic of Cookie

쿠키는 브라우저가 사용자 PC에 정보를 저장하기 위해 사용하는 임시 파일입니다. 
키-값(key-value) 형태로 저장됩니다. 
서버로 요청을 보낼 때 브라우저에 의해 자동으로 보내지기 때문에 서버는 사용자의 상태를 유지한 서비스가 가능합니다. 

쿠키는 다음과 같은 요소들로 구성되어 있습니다.

* 이름 - 각각의 쿠키를 구별하는 데 사용되는 이름
* 값 - 쿠키의 이름과 관련된 값
* 유효시간 - 쿠키의 유지시간
* 도메인 - 쿠키를 전송할 도메인
* 경로 - 쿠키를 전송할 요청 경로

쿠키는 다음과 같은 특징을 가집니다.

* 이름, 값, 만료일(저장 기간 설정), 경로 정보로 구성되어 있습니다.
* 클라이언트는 총 300개 쿠키를 저장할 수 있습니다.
* 하나의 도메인 당 20개 쿠키를 가질 수 있습니다
* 하나의 쿠키는 4KB(=4096byte)까지 저장 가능합니다.

자세한 내용은 [Deep dive into cookie][cookie-attributes-link] 포스트를 참조하시길 바랍니다. 

## CLOSING

쿠키와 세션에 대한 글들을 살펴보면 둘의 특성과 차이점을 비교해두었는데, 쿠키와 세션은 서로 비교 대상이 아닙니다. 
쿠키는 클라이언트, 세션은 서버 측 어플리케이션(application)에서 사용하는 저장소이기 때문에 성격이 다릅니다. 
오히려 쿠키는 브라우저의 세션 스토리지, 로컬 스토리지와 비교하는 것이 적절하다는 생각이 듭니다. 

쿠키는 브라우저에 의해 자동으로 처리되고, 세션은 톰캣(tomcat) 미들웨어를 기반으로 동작하는 서버에선 손쉽게 만들고 다룰 수 있기 때문에 둘의 조합을 많이 사용합니다. 
개발자는 둘을 적절히 조합하여 사용자에게 좋은 서비스를 제공해야한다는 점에 집중해야 합니다. 

#### RECOMMEND NEXT POSTS

* [HTTP(HyperText Transfer Protocol)][http-link]
* [Deep dive into cookie][cookie-attributes-link]
* [CSRF(Cross-Site Request Forgery) Attack and Defence][cross-site-reqeust-forgery-link]
* [Session Management in Tomcat][tomcat-session-management-link]
* [Spring Session with JDBC][spring-session-link]
* [Spring Session with Redis][spring-session-with-redis-link]

#### REFERENCE

* [[Stateful/Stateless] Stateful vs. Stateless 서비스와 HTTP 및 REST][stateless-service-blog-link]
* [쿠키(Cookie)와 세션(Session)][cookie-and-session-blogLink]
* <https://devuna.tistory.com/23>
* <https://junshock5.tistory.com/84>
* <https://hahahoho5915.tistory.com/32>
* <https://interconnection.tistory.com/74>

[multi-servers-env-blog-link]: https://junshock5.tistory.com/84
[stateless-service-blog-link]: https://5equal0.tistory.com/entry/StatefulStateless-Stateful-vs-Stateless-%EC%84%9C%EB%B9%84%EC%8A%A4%EC%99%80-HTTP-%EB%B0%8F-REST
[cookie-and-session-blogLink]: https://www.fun-coding.org/crawl_advance1.html#6.1.-%EC%BF%A0%ED%82%A4(cookie):-%EC%83%81%ED%83%9C-%EC%A0%95%EB%B3%B4%EB%A5%BC-%ED%81%B4%EB%9D%BC%EC%9D%B4%EC%96%B8%ED%8A%B8%EC%97%90-%EC%A0%80%EC%9E%A5%ED%95%98%EB%8A%94-%EB%B0%A9%EC%8B%9D

[local-storage-link]: https://junhyunny.github.io/information/local-storage/
[session-storage-link]: https://junhyunny.github.io/information/session-storage/
[tomcat-session-management-link]: https://junhyunny.github.io/information/server/tomcat-session-management/
[http-link]: https://junhyunny.github.io/information/http/
[cookie-attributes-link]: https://junhyunny.github.io/information/security/cookie-attributes/
[cross-site-reqeust-forgery-link]: https://junhyunny.github.io/information/security/spring-boot/spring-security/cross-site-reqeust-forgery/
[spring-session-link]: https://junhyunny.github.io/information/spring-boot/spring-session/
[spring-session-with-redis-link]: https://junhyunny.github.io/information/spring-boot/redis/spring-session-with-redis/