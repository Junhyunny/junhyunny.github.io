---
title: "Deep dive into cookie"
search: false
category:
  - information
  - security
last_modified_at: 2021-12-31T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Cookie and Session][cookie-and-session-link]

## 0. 들어가면서

[CSRF(Cross-Site Request Forgery) 공격과 방어][csrf-attack-and-defense-link] 글을 작성하면서 생각보다 쿠키(cookie)에 대해 잘 모르고 있다는 느낌을 받았다. 이번 글에선 친숙하지만, 자세히 알지 못 했던 쿠키에 대해 정리했다. 

## 1. Cookie

쿠키는 서버에서 브라우저로 전달한 작은 데이터 조각을 의미한다. 인코딩(encoding)한 값으로 최대 4KB 까지 저장할 수 있다. 브라우저는 서버로부터 받은 쿠키를 보관하고 있다가 서버로 요청할 때 함께 전달한다. 쿠키는 `무상태(stateless)`인 HTTP 프로토콜을 `상태를 유지(stateful)`하는 것처럼 사용하기 위해 등장했다.

쿠키는 다음과 같은 용도로 사용된다. 

- Session management
  - Logins, shopping carts, game scores, or anything else the server should remember
- Personalization
  - User preferences, themes, and other settings
- Tracking
  - Recording and analyzing user behavior

### 1.1. Create Cookie

쿠키는 브라우저가 서버로부터 다음과 같은 응답 헤더를 받으면 자동으로 생성된다. 

> Set-Cookie: `<cookie-name>=<cookie-value>`

스프링 애플리케이션에서 다음과 같은 코드를 통해 응답 헤더에 쿠키를 설정할 있다. 브라우저는 서버로부터 이 응답을 받으면 자동으로 쿠키를 생성 후 보관한다.

```java
@Controller
public class CookieController {

    @GetMapping(value = {"", "/"})
    public String index(HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        Cookie firstCookie = new Cookie("firstCookie", "chocolateCookie");
        Cookie secondCookie = new Cookie("secondCookie", "vanillaCookie");
        servletResponse.addCookie(firstCookie);
        servletResponse.addCookie(secondCookie);
        return "index";
    }
}
```

크롬 브라우저 개발자 도구 네트워크 탭(tab)에서 응답 정보를 보면 쿠키 정보가 담긴 것을 확인할 수 있다.

```
HTTP/1.1 200
Set-Cookie: firstCookie=chocolateCookie
Set-Cookie: secondCookie=vanillaCookie
Set-Cookie: JSESSIONID=9BDAD4736CAC0F5ED4078C2AC072AFCB; Path=/; HttpOnly
Content-Type: text/html;charset=UTF-8
Content-Language: ko-KR
Content-Length: 471
Date: Thu, 30 Dec 2021 15:49:59 GMT
Keep-Alive: timeout=60
Connection: keep-alive
```

<div align="center">
  <img src="/images/posts/2021/cookie-attributes-01.png" class="image__border">
</div>

### 1.2. Use Cookie

브라우저는 서버로 요청을 보낼 때 쿠키 속성과 브라우저 정책에 따라 선택적으로 쿠키를 전달한다. 쿠키를 전달할 때 아래와 같이 요청 헤더에 `Cookie`라는 키 값으로 쿠키 정보가 담아 보낸다. 브라우저 개발자 도구 네트워크 탭에서 요청 헤더 정보를 확인할 수 있다.

```
GET / HTTP/1.1
Host: localhost:8080
Connection: keep-alive
...
Accept-Encoding: gzip, deflate, br
Accept-Language: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7
Cookie: firstCookie=chocolateCookie; secondCookie=vanillaCookie; JSESSIONID=9BDAD4736CAC0F5ED4078C2AC072AFCB
```

## 2. Attributes in Cookie

브라우저는 쿠키 속성 값에 따라 쿠키를 요청 헤더에 선택적으로 담는다. 개발자는 쿠키 속성을 변경하여 쿠키 사용을 제어할 수 있다. 어떤 속성들이 있는지 살펴보자.

### 2.1. Domain Attribute

도메인(Domain) 속성은 해당 쿠키가 종속된 도메인을 지정하는 속성이다. 도메인 값을 지정하면 해당 도메인으로 요청할 때만 헤더에 쿠기가 포함된다. 서브 도메인도 함께 적용된다. 예를 들면 A 쿠키에 `Domain=mozilla.org`이라고 속성을 설정하고 `developer.mozilla.org` 도메인으로 요청하면 A 쿠키가 함께 전달된다. 서버 애플리케이션 코드에서 쿠키 도메인을 바꿔서 간단한 테스트 케이스를 만들어 보고 싶었지만, 타 도메인으로 설정은 안되는 것으로 보인다.

> Invalid cookie domain<br/>
> If the current domain were to be example.com, it would not be possible to add a cookie for the domain example.org:

### 2.2. Path Attribute

쿠키가 포함되어야하는 URL 경로를 지정할 수 있다. 예들 들어 A 쿠키의 Path 속성을 `'Path=/docs'`로 설정하는 경우 아래 URL 요청 시 A 쿠키가 포함된다.

- /docs
- /docs/
- /docs/Web/
- /docs/Web/HTTP

아래 경로로 요청 시 A 쿠키는 포함되지 않는다. 

- /
- /docsets
- /fr/docs

서버에서 쿠키를 생성할 때 `Path=/index` 값을 설정한다.

```
HTTP/1.1 200
Set-Cookie: customCookie=pathCookie; Path=/index
Content-Type: text/html;charset=UTF-8
Content-Language: ko-KR
Content-Length: 471
Date: Fri, 31 Dec 2021 08:00:39 GMT
Keep-Alive: timeout=60
Connection: keep-alive
```

브라우저에서 `/` 경로로 요청을 보내면 customCookie 쿠키가 함께 전달되지 않는다. 

```
GET / HTTP/1.1
Host: localhost:8080
Connection: keep-alive
Cache-Control: max-age=0
...
Accept-Encoding: gzip, deflate, br
Accept-Language: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7
Cookie: JSESSIONID=E27D97843642FBAD34540221DF74844B
```

브라우저에서 `/index` 경로로 요청을 보내면 customCookie 쿠키가 함께 전달된다.

```
GET /index HTTP/1.1
Host: localhost:8080
Connection: keep-alive
Cache-Control: max-age=0
...
Accept-Encoding: gzip, deflate, br
Accept-Language: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7
Cookie: customCookie=pathCookie; JSESSIONID=E27D97843642FBAD34540221DF74844B
```

크롬 브라우저 개발자 도구에서 저장된 쿠키 정보를 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2021/cookie-attributes-02.png" class="image__border">
</div>

### 2.3. Expires and Max-Age Attribute

쿠키의 유효 시간을 설정할 수 있는 속성이다. 사용 방법에 약간의 차이가 있다. 

- Expire
  - 날짜를 지정하며 만료 시간이 지나면 브라우저가 삭제한다.
- Max-Age
  - 유효 시간을 지정하며 쿠키를 받은 시간으로부터 계산하여 만료된 경우 브라우저가 삭제한다.

스프링 애플리케이션에서 다음과 같은 코드로 쿠키의 `Max-Age` 값을 설정할 수 있다.

- 해당 쿠키는 10초 뒤에 만료된다.

```java
package blog.in.action.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Controller
public class CookieController {

    boolean flag = true;

    @GetMapping(value = {"", "/", "/index"})
    public String index(
        HttpServletRequest servletRequest, 
        HttpServletResponse servletResponse
    ) {
        Cookie cookie = new Cookie("customCookie", "cookie");
        cookie.setMaxAge(10);
        if (flag) {
            servletResponse.addCookie(cookie);
            flag = false;
        }
        return "index";
    }
}
```

크롬 브라우저 네트워크 탭에서 응답 정보를 살펴보면 `Max-Age=10` 속성이 추가된 것을 볼 수 있다.

```
HTTP/1.1 200
Set-Cookie: customCookie=cookie; Max-Age=10; Expires=Fri, 31-Dec-2021 08:18:29 GMT
Set-Cookie: JSESSIONID=3F0E9A7B8444127F4FE0D3CDC1D329C1; Path=/; HttpOnly
Content-Type: text/html;charset=UTF-8
Content-Language: ko-KR
Content-Length: 471
Date: Fri, 31 Dec 2021 08:18:19 GMT
Keep-Alive: timeout=60
Connection: keep-alive
```

개발자 도구에서 저장된 쿠키 정보를 살펴보자. 첫 응답 시 쿠키가 생생된 것을 보면 만료 시간이 설정된 것을 볼 수 있다. 만료 시간이 지난 후에 쿠키 정보가 사라진다. 

<div align="center">
  <img src="/images/posts/2021/cookie-attributes-03.png" class="image__border">
</div>

### 2.4. Secure Attribute

`Secure` 속성이 설정된 쿠키는 암호화 된 `HTTPS`을 사용하는 요청 시에만 전송된다. `localhost(혹은 127.0.0.1)`를 제외하고 `HTTP`를 사용하는 요청에는 쿠키가 전송되지 않는다. 간단한 같이 예시를 살펴보자.

- IP(http://192.168.1.3:8080)를 사용해 서버에 요청을 보낸다.
- 쿠키를 저장하기 위한 응답 헤더가 있지만, 브라우저에 저장되지 않는다.
  - 경고 메시지를 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2021/cookie-attributes-04.png" class="image__border">
</div>

### 2.5. HttpOnly Attribute

`HttpOnly` 속성이 설정된 쿠키는 JavaScript `Document.cookie` API를 통해서 접근할 수 없다. 읽기, 쓰기가 모두 불가능하다. 해당 설정은 XSS(Cross-Site Scritping) 공격을 방지할 수 있다. 스프링 애플리케이션에서 다음과 같은 코드로 HttpOnly 속성을 지정할 수 있다.

- `customCookie`는 HttpOnly 속성을 지정한다.
- `otherCookie`는 별도 설정 없이 생성한다.

```java
@Controller
public class CookieController {

    @GetMapping(value = {"", "/", "/index"})
    public String index(HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        Cookie cookie = new Cookie("customCookie", "cookie");
        cookie.setHttpOnly(true);
        servletResponse.addCookie(cookie);
        servletResponse.addCookie(new Cookie("otherCookie", "otherCookie"));
        return "index";
    }
}
```

웹 페이지에서 쿠키 정보에 접근하면 어떤 결과를 얻을까? JavaScript 코드에서 `document.cookie` 변수에 담긴 쿠키 값을 알림(alert)으로 확인해보자. 

```html
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <style>
        /* ... */
    </style>
</head>
<body>
<div id="wrap">
    <h1>쿠키 테스트</h1>
    <script>
        alert(document.cookie)
    </script>
</div>
</body>
</html>
```

다음과 같은 결과를 얻는다.

- HttpOnly 속성이 지정된 `customCookie` 쿠키는 표시되지 않는다.
- HttpOnly 속성이 지정되지 않은 `otherCookie` 쿠키는 표시된다.

<div align="center">
  <img src="/images/posts/2021/cookie-attributes-05.png" width="50%" class="image__border">
</div>

### 2.6. SameSite Attribute

CSRF(Cross-Site Request Forgery) 공격을 방어하기 위해 만들어진 속성이다. CSRF 공격에 대한 자세한 내용은 [해당 링크][csrf-attack-and-defense-link]를 참고하길 바란다. SameSite 속성은 다음과 같은 세 가지 옵션을 가질 수 있다.

- None
- Strict
- Lax

각 속성 값을 통해 쿠키가 어떻게 동작하는지 정리해보자.

#### 2.6.1. None

- 도메인 검증을 하지 않고, `Secure` 속성을 활성화하여 사용해야 한다.
- 예를 들면 다음과 같다.
  1. 사용자는 A.com 사이트에 접속하여 로그인 및 기타 용무를 처리한다. 이때 쿠키를 저장한다.
  2. 이후 B.com 사이트에 접속하여 A.com 사이트에 접근하는 링크를 누른다. 
  3. 이전에 A.com 사이트에서 발급 받았던 쿠키들이 함께 요청에 전달된다.

#### 2.6.2. Strict

- 쿠키를 발급한 사이트와 동일한 사이트에서만 사용이 가능하다.
- 예를 들면 다음과 같다.
  1. 사용자는 A.com 사이트에 접속하여 로그인 및 기타 용무를 처리한다. 이때 쿠키를 저장한다.
  2. 이후 B.com 사이트에 접속하여 A.com 사이트에 접근하는 링크를 누른다. 
  3. 동일한 사이트에서 접근한 것이 아니므로 A.com 사이트에서 발급 받았던 쿠키들은 함께 전달되지 않는다.

#### 2.6.3. Lax

- 쿠키를 발급한 사이트와 동일한 사이트가 아니더라도 일부 케이스에서 사용 가능하다.
- 안전한 HTTP 메소드인 경우에만 쿠키를 전달한다.
- 작업이 최상위 레벨 탐색에서 이루어질 때(브라우저 주소창에서 URL을 변경하는 경우)만 쿠키가 전달된다.
  - `<iframe>` 태크를 사용하거나 AJAX 요청 시에는 쿠키가 전송되지 않는다.
- 예를 들면 다음과 같다.
  1. 사용자는 A.com 사이트에 접속하여 로그인 및 기타 용무를 처리한다. 이때 쿠키를 저장한다.
  2. 이후 B.com 사이트에 접속하여 A.com 사이트에 접근하는 링크를 누른다.
  3. 단순한 페이지 이동이므로 이전에 A.com 사이트에서 발급 받았던 쿠키들이 함께 요청에 전달된다.
  4. 이번엔 B.com 사이트 화면에서 A.com 사이트에서 사용하는 비밀번호 변경을 시도한다.
  5. A.com 사이트의 정보를 바꾸는 행위이므로 이전에 A.com 사이트에서 발급 받았던 쿠키들은 함께 전달되지 않는다.

#### 2.6.4. What is it diffrent between SameSite and CrossSite?

동일 사이트(same site)와 크로스 사이트(cross site)에 대한 기준을 정확히 짚고 넘어가자. 동일 사이트란 Top-Level Domains(TLDs)를 기준으로 `eTLD+1` 도메인 주소까지 동일한 것을 의미한다. eTLD(effective TLD)은 [Root Zone Database](https://www.iana.org/domains/root/db) 사이트에서 관리되는 .com, .org 같은 루트 도메인들을 의미한다.

- eTLD 도메인과 한 단계 아래 도메인까지 포함한 도메인이 같은 경우 동일 사이트이다.

<div align="center">
  <img src="/images/posts/2021/cookie-attributes-06.png" width="40%" class="image__border image__padding">
</div>
<center>https://web.dev/same-site-same-origin/</center>

<br/>

eTLD만으로 사이트를 구분하기 어려운 도메인들이 있다. .co.kr, .github.io 같은 도메인들은 .kr, .io 같은 루트 도메인만으로 동일 사이트 여부를 판단하기 어렵다. 이를 해결하기 위해 공공 접미사(public suffix)를 사용한다. [publicsuffix 링크](https://publicsuffix.org/list/)에서 해당 리스트를 확인할 수 있다.

- 공공 접미사 도메인과 한 단계 아래 도메인까지 포함한 도메인이 같은 경우 동일 사이트이다.

<div align="center">
  <img src="/images/posts/2021/cookie-attributes-07.png" width="40%" class="image__border image__padding">
</div>
<center>https://web.dev/same-site-same-origin/</center>

<br/>

아래 표는 동일 사이트와 크로스 사이트를 구분한 예시이다.

<div align="center">
  <img src="/images/posts/2021/cookie-attributes-08.png" width="80%" class="image__border image__padding">
</div>
<center>https://web.dev/same-site-same-origin/</center>

#### 2.6.5. What is Schemeful SameSite?

도메인 주소 앞의 스키마(schema)까지 비교하여 동일 사이트인지 여부를 판단하면 이를 `스킴풀(schemeful) 동일 사이트`라고 한다.

<div align="center">
  <img src="/images/posts/2021/cookie-attributes-09.png" width="40%" class="image__border image__padding">
</div>
<center>https://web.dev/same-site-same-origin/</center>

<br/>

아래 표는 스킴풀(schemeful) 동일 사이트와 크로스 사이트를 구분한 예시이다.

<div align="center">
  <img src="/images/posts/2021/cookie-attributes-10.png" width="80%" class="image__border image__padding">
</div>
<center>https://web.dev/same-site-same-origin/</center>

#### RECOMMEND NEXT POSTS

- [CSRF(Cross-Site Request Forgery) 공격과 방어][csrf-attack-and-defense-link]

#### REFERENCE

- <https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies>
- <https://developer.mozilla.org/en-US/docs/Web/WebDriver/Errors/InvalidCookieDomain>
- <https://ko.javascript.info/cookie#ref-3243>
- <https://meetup.toast.com/posts/172>
- <https://web.dev/same-site-same-origin/>
- <https://cherish-it.tistory.com/12>
- <https://jskim1991.medium.com/web-storages-and-cookies-6c301bf9d57a>
- [브라우저 쿠키와 SameSite 속성][cookie-samesite-link]

[cookie-samesite-link]: https://seob.dev/posts/%EB%B8%8C%EB%9D%BC%EC%9A%B0%EC%A0%80-%EC%BF%A0%ED%82%A4%EC%99%80-SameSite-%EC%86%8D%EC%84%B1/
[cookie-and-session-link]: https://junhyunny.github.io/information/cookie-and-session/
[csrf-attack-and-defense-link]: https://junhyunny.github.io/information/security/spring-boot/spring-security/cross-site-reqeust-forgery/
