---
title: "Cookie and Session"
search: false
category:
  - information
last_modified_at: 2021-08-28T01:00:00
---

<br/>

## 0. 들어가면서

웹 서비스를 개발한다면 기본적으로 클라이언트, 서버 쪽에서 사용하는 저장소 개념을 알아야 한다. 클라이언트는 보통 다음과 같은 저장 공간을 사용한다. 저장 공간은 브라우저에 의해 관리된다.

- [로컬 스토리지(local storage)][local-storage-link]
- [세션 스토리지(session storage)][session-storage-link]
- [쿠키(cookie)][cookie-attributes-link]

서버에서 사용하는 저장 공간은 다음과 같다.

- 데이터베이스(database)
- 캐시(cache)

데이터베이스는 영속적으로 데이터를 저장하는 공간이다. 캐시는 임시로 데이터를 저장하지만, 애플리케이션 서비스의 성능을 향상하기 위해 사용한다. 서버에는 데이터베이스, 캐시와 별개로 세션(session)이라는 저장 공간이 존재한다. 세션은 시스템 요구 사항에 따라 인-메모리, 데이터베이스 혹은 캐시 중 선택적으로 사용한다. 이번 글은 브라우저의 저장 공간인 쿠키와 서버의 저장 공간인 세션에 대해 정리한 글이다.

## 1. Stateless Characteristic of HTTP

HTTP(Hyper Text Transfer Protocol) 통신에서 요청을 보내는 측을 클라이언트(client), 요청을 받아 처리하고 응답하는 측을 서버(server)라고 한다. 웹 서비스 환경이라면 클라이언트는 보통 브라우저를 의미한다. HTTP 통신은 기본적으로 상태를 저장하지 않는다는 특징이 있다. 이를 무상태 프로토콜(stateless protocol)이라고 한다.

> 무상태 프로토콜(stateless protocol)은 어떠한 이전 요청과도 무관한 각각의 요청을 독립적인 트랜잭션으로 취급하는 통신 프로토콜을 의미한다.

기본적인 HTTP 통신은 모든 요청이 독립적이어야 한다. 상태를 저장하지 않기 때문에 이전 요청이 현재 요청에 영향을 주지 않는다. HTTP 프로토콜의 무상태 특징은 HTML 문서를 전달하는 용도로만 사용했던 초기 HTTP 통신에선 문제가 없었다. 현재는 HTTP 통신을 기반으로 다양한 서비스를 제공하기 때문에 무상태 특징은 서비스 운영에 큰 걸림돌이 된다. 

그런데 실제로 웹 서비스들은 사용하면 상태가 유지되는 것처럼 느껴진다. 클라이언트의 동작으로 변경된 상태들을 계속 유지한다. 

- 사용자가 로그인한 상태를 계속 유지
- 쇼핑몰 사용자가 로그인 없이도 장바구니에 담은 항목들을 유지

이런 무상태 특징을 갖는 HTTP 통신의 한계를 극복하기 위해 세션과 쿠키를 함께 사용한다. 사용자의 상태를 저장하는 서버 공간이 세션이다. 보통 서버 세션에는 사용자 정보가 저장되고 세션애서 사용자 정보를 찾을 수 있는 세션 키(session key)는 브라우저 쿠키에 저장한다. 둘 사이에 어떤 연결 고리가 존재하는지 살펴보자. 

<div align="center">
  <img src="/images/posts/2021/cookie-and-session-01.png" width="100%" class="image__border">
</div>

## 2. Session 

세션은 다양한 기술을 통해 구현된다. 서버 고가용성, 성능, 시스템 요구 사항에 따라 적절한 기술을 선택하면 된다.

- 인-메모리
- 데이터베이스
- 캐시 서버

경험상 세션에 주로 다음과 같은 데이터들을 저장한다. 

- 인증된 사용자의 인증 주체(principal), 자격 증명(credential) 그리고 역할(혹은 권한)
- 서비스를 위한 기타 정보
  - 시스템에서 사용하는 코드 데이터
  - 사용자 인터랙션(interaction)에 의해 발생한 임시 변경 사항

서버에서 세션은 다음과 같은 과정을 통해 생성된다.

1. 특정 클라이언트가 서버로 요청을 보낸다.
2. 서버는 클라이언트가 보낸 요청이 첫 요청인지 확인한다.
  - 서버는 자신이 관리하는 세션에 클라이언트가 보낸 세션 ID에 해당하는 정보가 존재하는지 확인한다.
  - 클라이언트가 세션 ID를 보내지 않았다면 최초 요청으로 판단한다. 
  - 클라이언트가 세션 ID를 보냈으나 세션에 데이터가 없다면 만료된 사용자로 판단하고, 최초 사용자로 처리한다.
3. 서버는 현재 요청이 클라이언트가 처음 보낸 것이라 판단하는 경우 해당 클라이언트를 위한 저장 공간을 세션에 만든다.
4. 서버는 세션의 해당 저장 공간을 찾을 수 있는 세션 ID를 함께 발급한다.
5. 서버는 요청에 대한 적절한 처리를 수행한 후 세션 ID를 클라이언트에게 응답과 함께 전달한다. 

<div align="center">
  <img src="/images/posts/2021/cookie-and-session-02.png" width="80%" class="image__border">
</div>
<center>쿠키(Cookie)와 세션(Session)</center>

## 3. Cookie

서버는 생성한 세션 정보를 찾을 수 있는 세션 ID를 발급해서 클라이언트(이하 브라우저)에게 전달한다. 세션 ID를 브라우저가 쿠키에 저장할 수 있도록 HTTP 응답 헤더에 쿠키 정보를 담아 전달한다. 스프링 프레임워크를 사용한 서버 애플리케이션은 HttpServletResponse 객체의 addCookie 메서드를 사용하면 HTTP 응답 헤더에 쿠키 정보를 담을 수 있다.

- Cookie 객체를 HttpServletResponse 객체에 저장한다.

```java
Cookie sessionId = new Cookie("JSESSIONID", "9BDAD4736CAC0F5ED4078C2AC072AFCB");
servletResponse.addCookie(sessionId);
```

- HttpServletResponse 객체의 헤더에 직접 쿠키 정보를 설정한다.

```java
response.setHeader("Set-Cookie", "JSESSIONID=" + sessionId + "; SameSite=None; Secure");
```

위 코드는 아래와 같은 응답 헤더를 만든다. 응답 헤더에 `Set-Cookie`가 있는 경우 브라우저는 이를 쿠키 저장소에 저장한다. 

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

브라우저에서 실행되는 클라이언트 애플리케이션이 서버로 요청을 보낼 때 쿠키에 저장된 값은 함께 전달된다. 브라우저에 의해 자동으로 전달되기 때문에 프론트엔드 개발자는 크게 의도적으로 전달할 필요가 없다. 쿠키는 다음과 같은 과정을 통해 서버로 전달된다.

1. 브라우저가 서버에게 페이지를 요청한다.
2. 서버는 요청에 대한 적절한 처리를 수행하고, 세션을 생성한 후 세션 ID를 HTTP 헤더 쿠키 정보에 담아 응답한다. 
  - HTTP 헤더의 Set-Cookie 속성을 사용한다.
3. 브라우저는 HTTP 헤더에 Set-Cookie 속성이 있다면 쿠키의 키, 값을 호스트 머신에 저장한다.
4. 이후 동일한 도메인 주소로 요청을 보낼 때마다 쿠키를 함께 전달한다.
  - 해당 작업은 브라우저에 의해 자동으로 처리된다.
5. 서버는 HTTP 요청 헤더에 담긴 쿠키의 세션 ID를 사용해 특정 사용자에 맞춘 적합한 요청 처리를 수행한다.

<div align="center">
  <img src="/images/posts/2021/cookie-and-session-03.png" width="80%" class="image__border">
</div>
<center>쿠키(Cookie)와 세션(Session)</center>

### 3.2. Characteristic of Cookie

쿠키는 브라우저가 사용자 PC에 정보를 저장하기 위해 사용하는 임시 파일이다. 키-값(key-value) 형태로 저장된다. 서버로 요청을 보낼 때 브라우저에 의해 자동으로 전달되기 때문에 서버는 사용자의 상태를 유지한 서비스가 가능하다. 쿠키는 다음과 같은 요소들로 구성되어 있습니다.

- `Name`은 각각의 쿠키를 구별하는 데 사용된다.
- `Value`은 쿠키 값이다.
- `Domain`은 쿠키가 종속된 도메인 주소를 의미한다.
- `Path`는 쿠키가 유효한 리소스 경로 정보를 의미한다.
- `Expires/Max-Age`은 쿠키의 유지 시간이다.
- `HttpOnly`는 브라우저에서 자바스크립트로 쿠키를 조작할 수 있는지 여부이다.
- `Secure`는 HTTPS 통신에서만 쿠키를 전송할 것인지 여부이다.

쿠키는 다음과 같은 특징을 가집니다.

- 이름, 값, 만료일(저장 기간 설정), 경로 정보로 구성되어 있다.
- 클라이언트는 총 300개 쿠키를 저장할 수 있다.
- 하나의 도메인 당 20개 쿠키를 가질 수 있다
- 하나의 쿠키는 4KB(=4096byte)까지 저장 가능하다.

쿠키의 더 자세한 스펙은 [Deep dive into cookie][cookie-attributes-link] 글에 정리했다. 이를 참고하길 바란다.

## CLOSING

쿠키와 세션에 대한 글들을 살펴보면 둘의 특성과 차이점을 비교해두었는데, 쿠키와 세션은 서로 비교 대상이 아니다. 쿠키는 클라이언트, 세션은 서버 애플리케이션에서 사용하는 저장소이기 때문에 성격이 다르다. 오히려 쿠키는 브라우저의 세션 스토리지, 로컬 스토리지와 비교하는 것이 적절하다는 생각이 든다. 쿠키는 브라우저에 의해 자동으로 처리되고, 세션은 톰캣(tomcat) 미들웨어를 기반으로 동작하는 서버에선 손쉽게 만들고 다룰 수 있기 때문에 둘의 조합을 많이 사용한다.  

#### RECOMMEND NEXT POSTS

- [Deep dive into cookie][cookie-attributes-link]
- [CSRF(Cross-Site Request Forgery) 공격과 방어][cross-site-reqeust-forgery-link]
- [LocalStorage in Browser][local-storage-link]
- [SessionStorage in Browser][session-storage-link]

#### REFERENCE

- [[Stateful/Stateless] Stateful vs. Stateless 서비스와 HTTP 및 REST][stateless-service-blog-link]
- [쿠키(Cookie)와 세션(Session)][cookie-and-session-blogLink]
- <https://devuna.tistory.com/23>
- <https://junshock5.tistory.com/84>
- <https://hahahoho5915.tistory.com/32>
- <https://interconnection.tistory.com/74>

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