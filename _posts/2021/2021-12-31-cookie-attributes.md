---
title: "Deep Dive into Cookie"
search: false
category:
  - information
  - security
last_modified_at: 2021-12-31T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Cookie and Session][cookie-and-session-link]
- [Session Management in Tomcat][tomcat-session-management-link]

👉 이어서 읽기를 추천합니다.
- [CSRF(Cross-Site Request Forgery) 공격과 방어][csrf-attack-and-defense-link]

## 0. 들어가면서

[CSRF(Cross-Site Request Forgery) 공격과 방어][csrf-attack-and-defense-link] 포스트를 작성하면서 생각보다 쿠키에 대해 잘 모르고 있다는 느낌을 많이 받았습니다. 
이곳 저곳에서 많이 들어서 친숙하지만, 자세히 알지 못했던 쿠키에 대해 정리해보았습니다. 

## 1. 쿠키(Cookie)

쿠키는 서버에서 브라우저로 전달한 작은 데이터 조각을 의미합니다. 
인코딩(encoding)한 값으로 최대 4KB 까지 저장할 수 있습니다. 
브라우저는 이를 저장하고 있다가 서버로 다음 요청 시 함께 전달합니다. 
쿠키를 사용하는 이유는 `stateless`인 HTTP 프로토콜을 `stateful`하게 사용하기 위해 등장하였습니다.

쿠키는 다음과 같은 용도로 사용됩니다. 
- Session management
    - Logins, shopping carts, game scores, or anything else the server should remember
- Personalization
    - User preferences, themes, and other settings
- Tracking
    - Recording and analyzing user behavior

### 1.1. 쿠키 생성

쿠키는 브라우저가 서버로부터 다음과 같은 헤더 정보를 받으면 자동으로 생성됩니다. 

> Set-Cookie: `<cookie-name>=<cookie-value>`

##### 응답 헤더에 쿠키 정보 설정 - Spring Boot 서버
- 다음과 같은 코드를 통해 응답 헤더에 쿠키를 담을 수 있습니다.
- 브라우저는 서버로부터 응답을 받으면 자동으로 쿠키를 생성하고 이를 보관합니다.

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

##### 응답 정보 - 크롬 브라우저

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

##### 저장된 쿠키 정보 확인 - 크롬 브라우저 개발자 도구

<p align="center"><img src="/images/cookie-attributes-1.JPG" class="image__border"></p>

### 1.2. 쿠키 사용

브라우저는 쿠키 속성과 브라우저 정책에 따라 적절하게 쿠키를 서버로 전달합니다. 
요청 헤더(request header) 내 `Cookie`라는 키 값으로 자동 매칭되어 서버로 전달됩니다.

##### 요청 정보 - 크롬 브라우저

```
GET / HTTP/1.1
Host: localhost:8080
Connection: keep-alive
...
Accept-Encoding: gzip, deflate, br
Accept-Language: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7
Cookie: firstCookie=chocolateCookie; secondCookie=vanillaCookie; JSESSIONID=9BDAD4736CAC0F5ED4078C2AC072AFCB
```

## 2. 쿠키 관련 속성

쿠키는 브라우저에 의해 자동적으로 요청 헤더에 실려 전달됩니다. 
개발자는 쿠키와 관련된 속성을 이용하여 이를 제어할 수 있습니다. 
어떤 속성들이 있는지 살펴보겠습니다.  

### 2.1. Domain 속성
도메인(Domain) 속성은 해당 쿠키를 전달받을 도메인을 지정하는 속성입니다. 
해당 속성을 이용해 도메인을 지정하면 해당되는 도메인으로 요청할 때만 함께 포함됩니다. 
서브 도메인에도 함께 적용됩니다. 
만약, A 쿠키에 `Domain=mozilla.org`이라고 속성을 설정하면 `developer.mozilla.org` 도메인으로 요청 시 A 쿠키가 함께 전달됩니다. 

테스트 케이스를 만들어보고 싶었지만, 타 도메인으로 설정은 안되는 것으로 확인됩니다.
> Invalid cookie domain<br/>
> If the current domain were to be example.com, it would not be possible to add a cookie for the domain example.org:

### 2.2. Path 속성

쿠키가 포함되어야하는 URL 경로를 지정할 수 있습니다. 
예들 들어 A 쿠키의 Path 속성을 `'Path=/docs'`로 설정하는 경우 아래 URL 요청 시 A 쿠키가 포함됩니다.
- /docs
- /docs/
- /docs/Web/
- /docs/Web/HTTP

아래 경로로 요청 시 A 쿠키는 포함되지 않습니다. 
- /
- /docsets
- /fr/docs

##### 쿠키 생성 - Path=/index 설정

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

##### '/' 경로 요청 시 헤더 정보

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

##### '/index' 경로 요청 시 헤더 정보

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

##### 저장된 쿠키 정보 확인 - 크롬 브라우저 개발자 도구

<p align="center"><img src="/images/cookie-attributes-2.JPG" class="image__border"></p>

### 2.3. Expires & Max-Age 속성

쿠키의 유효 시간을 설정할 수 있는 속성입니다. 
사용 방법에 약간의 차이가 있습니다. 
- Expire - 날짜를 지정하며 만료 시간이 지나면 브라우저가 삭제합니다.
- Max-Age - 유효 시간을 지정하며 쿠키를 받은 시간으로부터 계산하며 만료된 경우 브라우저가 삭제합니다.

##### 쿠키 Max-Age 설정 - Spring Boot 서버
- 다음과 같은 코드를 통해 쿠키의 만료 시간을 설정할 수 있습니다.
- 해당 쿠키는 10초 뒤에 만료됩니다.

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
    public String index(HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
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

##### 응답 정보 - 크롬 브라우저

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

##### 저장된 쿠키 정보 확인 - 크롬 브라우저 개발자 도구
- 첫 응답시에 생성된 쿠키 정보를 확인할 수 있습니다.
- 만료 시간이 지난 후에 쿠키 정보가 사라지는 것을 확인할 수 있습니다. 

<p align="center"><img src="/images/cookie-attributes-3.JPG" class="image__border"></p>

### 2.4. Secure 속성

`Secure` 속성이 설정된 쿠키는 암호화 된 `HTTPS`을 사용하는 요청 시에만 전송됩니다. 
`localhost(혹은 127.0.0.1)`를 제외하고 `HTTP`를 사용하는 요청에는 쿠키가 전송되지 않습니다. 

##### 전달받은 쿠키 정보 확인 - 크롬 브라우저 개발자 도구
- LAN IP를 사용하여 서버로 접근합니다. (http://192.168.1.3:8080/)
- 크롬 브라우저를 통해 `Secure` 속성이 설정된 쿠키 정보를 확인하면 경고와 함께 쿠키가 저장되지 않음을 확인할 수 있습니다.

<p align="center"><img src="/images/cookie-attributes-4.JPG" class="image__border"></p>

### 2.5. HttpOnly 속성

`HttpOnly` 속성이 설정된 쿠키는 JavaScript `Document.cookie` API를 통해서 접근할 수 없습니다. (Read / Write 불가능)
해당 설정은 XSS(Cross-Site Scritping) 공격을 방지할 수 있습니다. 

##### HttpOnly 쿠키 생성 - Spring Boot 서버
- `customCookie`는 HttpOnly 속성을 지정합니다.
- `otherCookie`는 별도 설정 없이 생성합니다.

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

##### index.jsp 화면
- JavaScrip의 `Document.cookie` API를 통해 쿠키에 접근합니다.

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

##### 브라우저 페이지 로딩시 alert 메시지

<p align="left"><img src="/images/cookie-attributes-5.JPG" width="45%" class="image__border"></p>

### 2.6. SameSite 속성

CSRF(Cross-Site Request Forgery) 공격을 방어하기 위해 만들어진 속성입니다. 
자세한 내용은 [CSRF(Cross-Site Request Forgery) 공격과 방어][csrf-attack-and-defense-link] 포스트를 통해 확인하실 수 있습니다. 
SameSite 속성이 가질 수 있는 옵션에 대해 먼저 정리하였습니다. 
총 세 가지 옵션이 있으며, 각 옵션이 제공하는 기능을 예를 들어 설명하였습니다.

#### 2.6.1. None
- 도메인 검증을 하지 않습니다. 
- `Secure` 속성 설정이 필요합니다.
- 예를 들면 다음과 같습니다.
    1. 사용자는 A.com 사이트에 접속하여 로그인 및 기타 용무를 처리합니다. 이때 쿠키를 저장합니다.
    1. 이후 B.com 사이트에 접속하여 A.com 사이트에 접근하는 링크를 누릅니다. 
    1. 이전에 A.com 사이트에서 발급 받았던 쿠키들이 함께 요청에 전달됩니다.

#### 2.6.2. Strict
- 쿠키를 발급한 사이트와 동일한 사이트에서만 사용이 가능합니다.
- 예를 들면 다음과 같습니다.
    1. 사용자는 A.com 사이트에 접속하여 로그인 및 기타 용무를 처리합니다. 이때 쿠키를 저장합니다.
    1. 이후 B.com 사이트에 접속하여 A.com 사이트에 접근하는 링크를 누릅니다. 
    1. 동일한 사이트에서 접근한 것이 아니므로 A.com 사이트에서 발급 받았던 쿠키들은 함께 전달되지 않습니다.

#### 2.6.3. Lax
- 쿠키를 발급한 사이트와 동일한 사이트가 아니더라도 일부 케이스에서 사용 가능합니다.
- 안전한 HTTP 메소드인 경우에만 쿠키를 전달합니다.
- 작업이 최상위 레벨 탐색에서 이루어질 때(브라우저 주소창에서 URL을 변경하는 경우)만 쿠키가 전달됩니다.
    - `<iframe>` 태크를 사용하거나 AJAX 요청 시에는 쿠키가 전송되지 않습니다.
- 예를 들면 다음과 같습니다.
    1. 사용자는 A.com 사이트에 접속하여 로그인 및 기타 용무를 처리합니다. 이때 쿠키를 저장합니다.
    1. 이후 B.com 사이트에 접속하여 A.com 사이트에 접근하는 링크를 누릅니다.
    1. 단순한 페이지 이동이므로 이전에 A.com 사이트에서 발급 받았던 쿠키들이 함께 요청에 전달됩니다.
    1. 이번엔 B.com 사이트 화면에서 A.com 사이트에서 사용하는 비밀번호 변경을 시도합니다.
    1. A.com 사이트의 정보를 바꾸는 행위이므로 이전에 A.com 사이트에서 발급 받았던 쿠키들은 함께 전달되지 않습니다.

#### 2.6.4. SameSite VS CrossSite
SameSite, CrossSite에 대한 기준을 제대로 알고 있어야 이해가 쉬울 것 같아서 함께 정리하였습니다. 
Top-level Domains(TLDs)를 기준으로 `eTLD+1`이 같은 경우에는 `SameSite`로 구분하고 있습니다. 
`'이게 무슨 소리야?'`라는 생각이 드실 것 같습니다. 
아래 예시를 통해 이해를 돕도록 하겠습니다.

##### 예시 사이트 - 1
- [Root Zone Database][root-zone-database-link]에 명시된 `.com`, `.org` 같은 도메인이 `eTLD(effective TLD)`입니다.
- `eTLD` 한 칸 앞에 있는 단어까지 포함하여 `eTLD+1`입니다. 

<p align="center">
    <img src="/images/cookie-attributes-6.JPG" width="40%" class="image__border">
</p>
<center>https://web.dev/same-site-same-origin/</center>

##### 예시 사이트 - 2
- `.co.kr` 이나 `.github.io` 같은 도메인을 가지는 경우 `.kr`, `.io` 도메인만으로 사이트 구분이 어렵습니다.
- 이를 해결하기 위해 식별 가능한 eTLDs가 만들어졌고, 해당 리스트들은 하단 링크에서 확인할 수 있습니다. 
    - <https://publicsuffix.org/list/> 

<p align="center">
    <img src="/images/cookie-attributes-7.JPG" width="40%" class="image__border">
</p>
<center>https://web.dev/same-site-same-origin/</center>

##### SameSite, CrossSite 비교표

<p align="center"><img src="/images/cookie-attributes-8.JPG" width="75%" class="image__border"></p>
<center>https://web.dev/same-site-same-origin/</center>

##### Schemeful SameSite
- 요청 시 사용하는 프로토콜까지 비교하는 경우 `Schemeful SameSite`라고 합니다.

<p align="center"><img src="/images/cookie-attributes-9.JPG" width="40%" class="image__border"></p>
<center>https://web.dev/same-site-same-origin/</center>

##### Schemeful SameSite, CrossSite 비교표

<p align="center"><img src="/images/cookie-attributes-10.JPG" width="75%" class="image__border"></p>
<center>https://web.dev/same-site-same-origin/</center>

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
[tomcat-session-management-link]: https://junhyunny.github.io/information/server/tomcat-session-management/
[csrf-attack-and-defense-link]: https://junhyunny.github.io/information/security/spring-boot/spring-security/cross-site-reqeust-forgery/
[root-zone-database-link]: https://www.iana.org/domains/root/db