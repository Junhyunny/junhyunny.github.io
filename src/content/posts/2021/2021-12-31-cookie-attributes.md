---
title: "쿠키(Cookie) 심층 분석"
publishedAt: "2021-12-31"
updatedAt: "2026-11-12T16:31:34+09:00"
canonicalPath: "/information/security/cookie-attributes/"
categories:
  - "information"
  - "security"
summary: "쿠키의 생성과 사용 방식, Domain, Path, Expires, Max-Age, Secure, HttpOnly, SameSite 같은 속성이 쿠키 전송에 미치는 영향을 정리했다."
recommendedPosts:
  - title: "쿠키(Cookie)와 세션(Session)"
    href: "https://junhyunny.github.io/information/cookie-and-session/"
  - title: "CSRF(Cross-Site Request Forgery) 공격과 방어"
    href: "https://junhyunny.github.io/information/security/spring-boot/spring-security/cross-site-reqeust-forgery/"
---

## 0. 들어가면서

[CSRF(Cross-Site Request Forgery) 공격과 방어][csrf-attack-and-defense-link] 글을 작성하면서 생각보다 쿠키(cookie)를 잘 모르고 있다는 느낌을 받았다. 이번 글에선 친숙하지만 자세히 알지 못했던 쿠키를 정리했다.

## 1. Cookie

쿠키는 서버에서 브라우저로 전달한 작은 데이터 조각을 의미한다. 인코딩(encoding)한 값으로 최대 4KB까지 저장할 수 있다. 브라우저는 서버로부터 받은 쿠키를 보관하고 있다가 서버로 요청할 때 함께 전달한다. 쿠키는 `무상태(stateless)`인 HTTP 프로토콜을 `상태를 유지(stateful)`하는 것처럼 사용하기 위해 등장했다.

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

스프링 애플리케이션에서는 다음과 같은 코드로 응답 헤더에 쿠키를 설정할 수 있다.

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

크롬 브라우저 개발자 도구의 네트워크 탭(tab)에서 응답 헤더에 쿠키 정보가 담긴 것을 확인할 수 있다. 브라우저는 이 응답을 받으면 쿠키를 생성하고 보관한다.

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
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2021/main/cookie-attributes-01.png" class="image__border">
</div>

### 1.2. Use Cookie

브라우저는 서버로 요청을 보낼 때 쿠키 속성과 브라우저 정책에 따라 선택적으로 쿠키를 전달한다. 쿠키를 전달할 때는 아래와 같이 요청 헤더에 `Cookie`라는 키로 쿠키 정보를 담아 보낸다. 브라우저 개발자 도구의 네트워크 탭에서 요청 헤더 정보를 확인할 수 있다.

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

브라우저는 쿠키 속성 값에 따라 쿠키를 요청 헤더에 선택적으로 담는다. 개발자는 쿠키 속성을 변경해 쿠키 사용을 제어할 수 있다. 어떤 속성들이 있는지 살펴보자.

### 2.1. Domain 속성

도메인(Domain) 속성은 쿠키가 종속된 도메인을 지정한다. 도메인 값을 지정하면 해당 도메인과 그 서브 도메인으로 요청할 때만 헤더에 쿠키가 포함된다. 예를 들어 A 쿠키에 `Domain=mozilla.org` 속성을 설정하고 `developer.mozilla.org` 도메인으로 요청하면 A 쿠키가 함께 전달된다.

서버 애플리케이션 코드에서 쿠키 도메인을 바꿔 간단한 테스트 케이스를 만들어 보고 싶었지만, 현재 도메인과 다른 도메인으로는 쿠키를 설정할 수 없다. MDN 문서에 따르면 Domain 속성 값은 `Set-Cookie` 응답 헤더를 보낸 서버의 도메인이거나 그 상위 도메인이어야 하고, 이 규칙을 어긴 쿠키는 무시된다.

> The value must be the domain of the server that sends the `Set-Cookie` response header, or a parent domain of that server's domain. It cannot be a public suffix such as `com`, `co.uk`, or `github.io`. (...) Cookies that break these rules are ignored.

### 2.2. Path 속성

Path 속성으로 쿠키가 포함되어야 하는 URL 경로를 지정할 수 있다. 예를 들어 A 쿠키의 Path 속성을 `'Path=/docs'`로 설정하면 아래 경로로 요청할 때 A 쿠키가 포함된다.

- /docs
- /docs/
- /docs/Web/
- /docs/Web/HTTP

반면 아래 경로로 요청할 때는 A 쿠키가 포함되지 않는다.

- /
- /docsets
- /fr/docs

직접 확인해 보자. 서버에서 쿠키를 생성할 때 `Path=/index` 값을 설정한다.

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
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2021/main/cookie-attributes-02.png" class="image__border">
</div>

### 2.3. Expires, Max-Age 속성

`Expires`, `Max-Age` 속성은 쿠키의 유효 시간을 설정한다. 두 속성은 사용 방법에 약간의 차이가 있다. `Expires` 속성은 만료 날짜를 지정하며, 그 시각이 지나면 브라우저가 쿠키를 삭제한다. `Max-Age` 속성은 유효 기간을 초 단위로 지정하며, 쿠키를 받은 시점부터 그 기간이 지나면 브라우저가 쿠키를 삭제한다.

스프링 애플리케이션에서 다음과 같은 코드로 쿠키의 `Max-Age` 값을 설정할 수 있다. 아래 쿠키는 10초 뒤에 만료된다.

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

크롬 브라우저의 네트워크 탭에서 응답 정보를 살펴보면 `Max-Age=10` 속성이 추가된 것을 볼 수 있다.

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

개발자 도구에서 저장된 쿠키 정보를 살펴보면 첫 응답에서 생성된 쿠키에 만료 시간이 설정되어 있다. 만료 시간이 지나면 쿠키 정보가 사라진다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2021/main/cookie-attributes-03.png" class="image__border">
</div>

### 2.4. Secure 속성

`Secure` 속성이 설정된 쿠키는 암호화된 `HTTPS` 요청에서만 전송된다. `localhost(혹은 127.0.0.1)`를 제외하면 `HTTP` 요청에는 쿠키가 전송되지 않는다. 간단한 예시를 살펴보자. IP 주소(http://192.168.1.3:8080)로 서버에 요청을 보내면 쿠키를 저장하라는 응답 헤더가 있어도 브라우저에 쿠키가 저장되지 않고, 다음과 같은 경고 메시지가 표시된다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2021/main/cookie-attributes-04.png" class="image__border">
</div>

### 2.5. HttpOnly 속성

`HttpOnly` 속성이 설정된 쿠키는 JavaScript `Document.cookie` API로 접근할 수 없다. 읽기와 쓰기가 모두 불가능하다. 이 설정으로 XSS(Cross-Site Scripting) 공격을 통해 쿠키가 탈취되는 것을 막을 수 있다.

스프링 애플리케이션에서는 다음과 같은 코드로 HttpOnly 속성을 지정할 수 있다. `customCookie` 쿠키에는 HttpOnly 속성을 지정하고, `otherCookie` 쿠키는 별도 설정 없이 생성한다.

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

웹 페이지에서 쿠키 정보에 접근하면 어떤 결과를 얻을까? JavaScript 코드에서 `document.cookie` 변수에 담긴 쿠키 값을 알림(alert)으로 확인해 보자.

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

실행하면 다음과 같이 HttpOnly 속성이 지정된 `customCookie` 쿠키는 표시되지 않고, HttpOnly 속성이 지정되지 않은 `otherCookie` 쿠키만 표시된다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2021/main/cookie-attributes-05.png" width="50%" class="image__border">
</div>

### 2.6. SameSite 속성

SameSite 속성은 CSRF(Cross-Site Request Forgery) 공격을 방어하기 위해 만들어졌다. CSRF 공격에 대한 자세한 내용은 [해당 링크][csrf-attack-and-defense-link]를 참고하길 바란다. SameSite 속성은 다음 세 가지 값 중 하나를 가질 수 있다.

- None
- Strict
- Lax

각 속성 값에 따라 쿠키가 어떻게 동작하는지 정리해 보자.

#### 2.6.1. None

`None`으로 설정한 쿠키는 요청하는 사이트를 가리지 않고 전달된다. 단, `Secure` 속성을 함께 활성화해야 한다. 예를 들면 다음과 같다.

1. 사용자는 A.com 사이트에 접속해 로그인 및 기타 용무를 처리한다. 이때 쿠키를 저장한다.
2. 이후 B.com 사이트에 접속해 A.com 사이트에 접근하는 링크를 누른다.
3. 이전에 A.com 사이트에서 발급받았던 쿠키들이 요청에 함께 전달된다.

#### 2.6.2. Strict

`Strict`로 설정한 쿠키는 쿠키를 발급한 사이트와 동일한 사이트에서만 사용할 수 있다. 예를 들면 다음과 같다.

1. 사용자는 A.com 사이트에 접속해 로그인 및 기타 용무를 처리한다. 이때 쿠키를 저장한다.
2. 이후 B.com 사이트에 접속해 A.com 사이트에 접근하는 링크를 누른다.
3. 동일한 사이트에서 접근한 것이 아니므로 A.com 사이트에서 발급받았던 쿠키들은 함께 전달되지 않는다.

#### 2.6.3. Lax

`Lax`로 설정한 쿠키는 쿠키를 발급한 사이트와 동일한 사이트가 아니더라도 일부 경우에 사용할 수 있다. 안전한 HTTP 메서드를 사용하고, 최상위 레벨 탐색(브라우저 주소창의 URL이 바뀌는 경우)으로 이동할 때만 쿠키가 전달된다. `<iframe>` 태그를 사용하거나 AJAX로 요청할 때는 쿠키가 전송되지 않는다. 예를 들면 다음과 같다.

1. 사용자는 A.com 사이트에 접속해 로그인 및 기타 용무를 처리한다. 이때 쿠키를 저장한다.
2. 이후 B.com 사이트에 접속해 A.com 사이트에 접근하는 링크를 누른다.
3. 단순한 페이지 이동이므로 이전에 A.com 사이트에서 발급받았던 쿠키들이 요청에 함께 전달된다.
4. 이번엔 B.com 사이트 화면에서 A.com 사이트에서 사용하는 비밀번호 변경을 시도한다.
5. A.com 사이트의 정보를 바꾸는 행위이므로 이전에 A.com 사이트에서 발급받았던 쿠키들은 함께 전달되지 않는다.

#### 2.6.4. What is the difference between SameSite and CrossSite?

동일 사이트(same site)와 크로스 사이트(cross site)의 기준을 정확히 짚고 넘어가자. 사이트는 최상위 도메인(TLD, Top-Level Domain)을 기준으로 구분한다. TLD는 [Root Zone Database](https://www.iana.org/domains/root/db)에서 관리하는 .com, .org 같은 도메인이다. TLD와 그 바로 아래 한 단계 도메인(`TLD+1`)까지 같으면 동일 사이트다.

<div class="block-break">
  <div align="center">
    <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2021/main/cookie-attributes-06.png" width="40%" class="image__border image__padding">
  </div>
  <center>https://web.dev/same-site-same-origin/</center>
</div>

그런데 TLD만으로 사이트를 구분하기 어려운 도메인들이 있다. .co.kr, .github.io 같은 도메인은 .kr, .io 같은 TLD만으로 동일 사이트 여부를 판단하기 어렵다. 이를 해결하기 위해 공공 접미사(public suffix) 목록을 사용한다. [publicsuffix 링크](https://publicsuffix.org/list/)에서 해당 목록을 확인할 수 있다. 이 목록에 있는 도메인을 eTLD(effective TLD)라고 하며, eTLD와 그 바로 아래 한 단계 도메인(`eTLD+1`)까지 같으면 동일 사이트다.

<div class="block-break">
  <div align="center">
    <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2021/main/cookie-attributes-07.png" width="40%" class="image__border image__padding">
  </div>
  <center>https://web.dev/same-site-same-origin/</center>
</div>

아래 표는 동일 사이트와 크로스 사이트를 구분한 예시이다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2021/main/cookie-attributes-08.png" width="100%" class="image__border image__padding">
</div>
<center>https://web.dev/same-site-same-origin/</center>

#### 2.6.5. What is Schemeful SameSite?

도메인 주소 앞의 스킴(scheme)까지 비교해 동일 사이트인지 판단하면 이를 `스킴풀(schemeful) 동일 사이트`라고 한다.

<div class="block-break">
  <div align="center">
    <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2021/main/cookie-attributes-09.png" width="40%" class="image__border image__padding">
  </div>
  <center>https://web.dev/same-site-same-origin/</center>
</div>

아래 표는 스킴풀(schemeful) 동일 사이트와 크로스 사이트를 구분한 예시이다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2021/main/cookie-attributes-10.png" width="100%" class="image__border image__padding">
</div>
<center>https://web.dev/same-site-same-origin/</center>

#### REFERENCE

- <https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies>
- <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie>
- <https://ko.javascript.info/cookie#ref-3243>
- <https://meetup.toast.com/posts/172>
- <https://web.dev/same-site-same-origin/>
- <https://cherish-it.tistory.com/12>
- <https://jskim1991.medium.com/web-storages-and-cookies-6c301bf9d57a>
- [브라우저 쿠키와 SameSite 속성][cookie-samesite-link]

[cookie-samesite-link]: https://seob.dev/posts/%EB%B8%8C%EB%9D%BC%EC%9A%B0%EC%A0%80-%EC%BF%A0%ED%82%A4%EC%99%80-SameSite-%EC%86%8D%EC%84%B1/
[csrf-attack-and-defense-link]: https://junhyunny.github.io/information/security/spring-boot/spring-security/cross-site-reqeust-forgery/
