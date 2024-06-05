---
title: "CSRF(Cross-Site Request Forgery) Attack and Defence"
search: false
category:
  - information
  - security
  - spring-boot
  - spring-security
last_modified_at: 2021-12-29T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Cookie and Session][cookie-and-session-link]
- [Deep dive into cookie][cookie-attributes-link]

## 0. 들어가면서

`Spring Security` 관련된 자료들을 찾다보면 종종 CSRF(Cross-Site Request Forgery) 설정을 비활성화시키라는 글들을 많이 발견할 수 있습니다. 
예전 프로젝트들을 돌이켜보면 CSRF 공격에 대비하기 위한 코드들이 많았던 것 같은데, 이를 비활성화시켜도 될지 의문스럽습니다. 
내용을 잘 모르면서 보안에 관련된 설정을 비활성화시키는 것은 위험하다고 생각되어 `CSRF` 공격이 무엇인지, 어째서 방어 코드를 비활성화시키는지 정리해보았습니다. 

##### CSRF 보안 비활성화 설정

```java
    @Override
    public void configure(HttpSecurity http) throws Exception {
        http.csrf().disable();
    }
```

## 1. CSRF, Cross-Site Request Forgery

> CSRF(Cross-Site Request Forgery) - 사이트 간 요청 위조<br/>
> 사용자가 자신의 의지와는 무관하게 공격자가 의도한 행위(수정, 삭제, 등록 등)를 특정 웹사이트에 요청하게 하는 공격을 말한다. 

정상적인 사용자가 의도하지 않았지만, 자신도 모르게 서버를 공격하게 되는 경우입니다. 
공격자가 만든 악성 페이지를 통해 사용자는 자신도 모르게 공격을 수행합니다. 
어떻게 이런 공격이 가능한지 확인해보겠습니다. 

### 1.1. Cookie and Session

우선 쿠키와 세션에 대한 간단한 이해가 필요합니다. 
사용자가 특정 서버에 로그인하면 일반적으로 다음과 같은 작업들이 수행됩니다. 
1. 서버는 로그인 시 인증된 사용자의 정보를 세션(session)에 저장하고, 이를 찾을 수 있는 `sessionID`을 만듭니다.
1. 서버는 저장된 세션 정보를 클라이언트(브라우저)가 사용할 수 있도록 `sessionID`를 `Set-Cookie` 헤더에 담아서 전달합니다. 
1. 클라이언트(브라우저)는 전달된 `sessionID`를 쿠키에 저장합니다.
1. 클라이언트(브라우저)는 해당 도메인을 가진 서버로 요청 시 쿠키에 저장된 `sessionID`를 자동으로 전달합니다.
1. 서버는 쿠키에 담긴 `sessionID`를 통해 인증된 사용자인지 여부를 확인합니다. 

<p align="center"><img src="/images/cross-site-reqeust-forgery-1.JPG" width="65%"></p>

### 1.2. CSRF 전제 조건과 공격 과정

CSRF 공격을 위한 조건과 과정에 대해 알아보겠습니다. 
CSRF 공격을 시도하기 위해선 아래와 같은 몇 가지 조건이 필요합니다.
- 사용자가 보안이 취약한 서버로부터 이미 인증을 받은 상태여야 합니다. 
- 쿠키 기반으로 서버 세션 정보를 획득할 수 있어야 합니다. 
- 공격자는 서버를 공격하기 위한 요청 방법에 대해 미리 파악하고 있어야 합니다. 예상치 못한 파라미터가 있으면 불가능합니다. 

위와 같은 조건이 만족되면 다음과 같은 과정을 통해 CSRF 공격이 수행됩니다.
1. 사용자는 보안이 취약한 서버에 로그인합니다. 
1. 로그인 이후 서버에 저장된 세션 정보를 사용할 수 있는 `sessionID`가 사용자 브라우저 쿠키에 저장됩니다.  
1. 공격자는 서버에 인증된 브라우저의 사용자가 악성 스크립트 페이지를 누르도록 유도합니다. 
    - 해당 악성 스크립트가 담긴 페이지를 클릭하도록 유도하는 방법은 다양한 것 같으나 몇 가지 유형을 정리하자면 다음과 같습니다.
    - 게시판에 악성 스크립트를 게시글로 작성하여 관리자 혹은 다른 사용자들이 게시글을 클릭하도록 유도합니다.
    - 메일 등으로 악성 스크립트를 직접 전달하거나, 악성 스크립트가 적힌 페이지 링크를 전달합니다.
1. 사용자가 악성 스크립트가 작성된 페이지 접근시 쿠키에 저장된 `sessionID`는 브라우저에 의해 자동적으로 함께 서버로 요청됩니다.
1. 서버는 쿠키에 담긴 `sessionID`를 통해 해당 요청이 인증된 사용자로부터 온 것으로 판단하고 처리합니다.

<p align="center"><img src="/images/cross-site-reqeust-forgery-2.JPG" width="65%"></p>

## 2. CSRF 공격 방법

간단한 POC(Proof Of Concept) 코드를 작성하여 CSRF 공격을 재현해보겠습니다. 
공격자는 취약 서버의 사용자 이름을 변경하는 방법을 파악하고, 악성 스크립트가 작성된 페이지를 사용자가 클릭하도록 유도했다고 가정합니다. 
GitHub 레포지토리에서 테스트와 관련된 프로젝트를 받을 수 있습니다.
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-12-29-cross-site-request-forgery>
    - backend - 보안 취약 서버 (DOMAIN - localhost / PORT - 8081)
    - attacker - 공격자 서버 (DOMAIN - 127.0.0.1 / PORT - 8080)

##### 보안 취약 서버의 AuthenticationInterceptor
- 보안 취약 서버에는 다음과 같은 인증 인터셉터(interceptor)가 존재합니다.
- 쿠키 정보를 바탕으로 세션에 저장된 사용자 정보 유무를 확인합니다.
- 사용자 정보가 없다면 로그인 페이지로 리다이렉트(redirect)시킵니다.
- 해당 코드로 인해 사용자가 로그인하기 전에 악성 페이지에 접근하더라도 사용자 정보를 변경할 수 없습니다.

```java
package blog.in.action.handler;

import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

public class AuthenticationInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("member") == null) {
            response.sendRedirect("/"); // No logged-in user found, so redirect to login page.
            return false;
        }
        response.setHeader("Set-Cookie", "JSESSIONID=" + request.getRequestedSessionId() + "; SameSite=None; Secure");
        return true;
    }
}
```

##### WebMvcConfiguration 클래스
- `/`, `/login` 경로를 제외한 모든 경로에서 `AuthenticationInterceptor`를 통과합니다.

```java
package blog.in.action.config;

import blog.in.action.handler.AuthenticationInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfiguration implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new AuthenticationInterceptor()).excludePathPatterns("/", "/login").addPathPatterns("/**");
    }
}
```

### 2.1. GET 방식 공격

`<img />` 태그(tag)를 사용하거나 하이퍼링크를 걸어주는 `<a></a>` 태그를 이용합니다. 
이번 테스트에서는 `<img />` 태그를 사용하였습니다.

##### 공격자 악성 페이지 - GET 방식
- 이미지 태그를 통해 페이지 로딩시 보안 취약 서버로 GET 요청을 보냅니다.
- width, height 값이 0px이므로 화면에서 보이지 않습니다.

```html
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Attacker Site</title>
</head>
<body>
<div id="wrap">
    <h1>악성 페이지 - 숨겨진 이미지 태그</h1>
    <img src="http://localhost:8081/change?name=JunhyunnyChangedByImageTag" style="width: 0px; height: 0px;"/>
</div>
</body>
</html>
```

##### CSRF 공격 후 사용자 이름 변경 확인

<p align="center"><img src="/images/cross-site-reqeust-forgery-3.gif" class="image__border"></p>

### 2.2. POST 방식 공격

`<form></form>` 태그와 hidden 타입의 `<input />` 태그를 사용합니다. 
`JavaScript`를 이용해 페이지 렌더링이 수행되자마자 폼 전송을 시도합니다.

##### 공격자 악성 페이지 - POST 방식
- form 태그와 hidden 타입의 input 태그로 POST 요청을 수행합니다.

```html
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Attacker Site</title>
</head>
<body>
<div id="wrap">
    <h1>악성 페이지 - 3초 뒤 숨겨진 폼(form) 전송</h1>
    <form action="http://localhost:8081/change" method="POST">
        <input type="hidden" id="memberName" name="memberName" value="JunhyunnyChangedByFormSubmit"/>
    </form>
    <script>
        setTimeout(function () {
            document.forms[0].submit();
        }, 3000);
    </script>
</div>
</body>
</html>
```

##### CSRF 공격 후 사용자 이름 변경 확인

<p align="center"><img src="/images/cross-site-reqeust-forgery-4.gif" class="image__border"></p>

## 3. CSRF 방어 방법

공격 방법에 대해 알아보았으니 방어 방법에 대해 정리해보겠습니다. 
GitHub 레포지토리에서 테스트와 관련된 프로젝트를 받을 수 있습니다.
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-12-29-cross-site-request-forgery>
    - enhanced-backend - 보안 강화 서버 (DOMAIN - localhost / PORT - 8081)

### 3.1. Referrer 검증

서버에서 사용자의 요청에 `Referrer` 정보를 확인하는 방법이 있습니다. 
요청 헤더(request header) 정보에서 `Referrer` 정보를 확인할 수 있습니다. 
보통이라면 호스트(host)와 `Referrer` 값이 일치하므로 둘을 비교합니다.
CSRF 공격의 대부분 `Referrer` 값에 대한 검증만으로 방어가 가능하다고 합니다. 

##### ReferrerCheckInterceptor 클래스 - Referrer 검증 방어 코드

```java
package blog.in.action.handler;

import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class ReferrerCheckInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String referer = request.getHeader("Referer");
        String host = request.getHeader("host");
        if (referer == null || !referer.contains(host)) {
            response.sendRedirect("/");
            return false;
        }
        return true;
    }
}
```

### 3.2. CSRF 토큰 검증

임의의 CSRF 토큰을 만들어 세션에 저장합니다. 
요청하는 페이지에 `hidden` 타입 input 태그를 이용해 토큰 값을 함께 전달합니다. 
이후 서버에서 세션에 저장된 CSRF 토큰 값과 요청 파라미터에 담긴 토큰 값을 비교합니다. 

##### 세션 및 hidden input 값으로 CSRF 토큰 설정하기 - Java

```java
    // 세션에 설정
    session.setAttribute("CSRF_TOKEN", UUID.randomUUID().toString());

    // 페이지 내 hidden 값으로 설정
    model.addAttribute("CSRF_TOKEN", session.getAttribute("CSRF_TOKEN"));
```

##### 세션 및 hidden input 값으로 CSRF 토큰 설정하기 - JSP

```html
<form action="http://server-host:port/path" method="POST">
    <input type="hidden" name="_csrf" value="${CSRF_TOKEN}"/>
    <!-- ... -->
</form>
```

##### 인터셉터 추가 및 CSRF 토큰 사용 path 지정
- 모든 경로에 대해서 CSRF 토큰 검증을 수행하기에 어려움이 있으므로 토큰 검증을 수행하는 경로만 추가합니다.

```java
package blog.in.action.config;

import blog.in.action.handler.AuthenticationInterceptor;
import blog.in.action.handler.CsrfTokenInterceptor;
import blog.in.action.handler.ReferrerCheckInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfiguration implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new AuthenticationInterceptor()).excludePathPatterns("", "/", "/login").addPathPatterns("/**");
        registry.addInterceptor(new ReferrerCheckInterceptor()).excludePathPatterns("", "/", "/login").addPathPatterns("/**");
        registry.addInterceptor(new CsrfTokenInterceptor()).addPathPatterns("/change/**");
    }
}
```

##### CsrfTokenInterceptor 클래스 - CSRF 토큰 방어 코드

```java
package blog.in.action.handler;

import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

public class CsrfTokenInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        HttpSession httpSession = request.getSession(false);
        String csrfTokenParam = request.getParameter("_csrf");
        String csrfTokenSession = (String) httpSession.getAttribute("CSRF_TOKEN");
        if (csrfTokenParam == null || !csrfTokenParam.equals(csrfTokenSession)) {
            response.sendRedirect("/");
            return false;
        }
        return true;
    }
}
```

### 3.3. Double Submit Cookie 검증

브라우저의 `Same Origin 정책`을 이용합니다. 
`Same Origin`이 아닌 경우 `JavaScript`로 쿠키 값을 확인하거나 수정하지 못한다는 점을 이용한 검증 방법입니다. 
클라이언트(브라우저)에서 `JavaScript`로 임의의 생성한 토큰을 쿠키와 요청 헤더에 각각 담아서 서버에게 전달합니다. 
서버는 전달받은 쿠키와 요청 헤더에서 각자 토큰 값을 꺼내어 이를 비교합니다. 
이때, 쿠키에 저장된 토큰 정보는 이후에 재사용하지 못하도록 만료 처리합니다. 

##### DoubleSubmitCookieInterceptor 인터셉터 추가
- 이전 단계의 CSRF 토큰 검증 방법과 동시 사용이 어려워 DoubleSubmitCookieInterceptor 인터셉터만 사용합니다.

```java
package blog.in.action.config;

import blog.in.action.handler.AuthenticationInterceptor;
import blog.in.action.handler.DoubleSubmitCookieInterceptor;
import blog.in.action.handler.ReferrerCheckInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfiguration implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new AuthenticationInterceptor()).excludePathPatterns("", "/", "/login").addPathPatterns("/**");
        registry.addInterceptor(new ReferrerCheckInterceptor()).excludePathPatterns("", "/", "/login").addPathPatterns("/**");
        // registry.addInterceptor(new CsrfTokenInterceptor()).addPathPatterns("/change/**");
        registry.addInterceptor(new DoubleSubmitCookieInterceptor()).addPathPatterns("/change/**");
    }
}
```

##### 클라이언트 코드
- `uuidv4()` 함수로 임의의 토큰을 생성합니다.
- `doubleSubmitHandler()` 함수를 이용해 생성한 토큰 정보를 요청 헤더와 쿠키에 저장 후 서버에게 전달합니다.

```html
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>Enhanced Site</title>
    <script>
        // ...
        function uuidv4() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        function doubleSubmitHandler() {
            let uuid = uuidv4();
            document.cookie = 'CSRF_TOKEN=' + uuid + ";path=/";
            fetch('http://localhost:8081/change', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    'X-CSRF-HEADER': uuid
                },
                body: new URLSearchParams({
                    memberName: document.getElementById('memberName').value,
                })
            }).then(response => {
                return response.json();
            }).then(data => {
                document.getElementById('pageMemberName').innerHTML = data.memberName;
                document.getElementById('memberName').value = '';
            });
        }
    </script>
</head>
<body>
<div id="wrap">
    <p>
        사용자 <strong id="pageMemberName">${memberName}</strong>님은 인증된 사용자입니다.
    </p>
</div>
<div>
    <input id="memberName" type="text" id="memberName" name="memberName"/>
    <input id="csrfToken" type="hidden" name="_csrf" value="${CSRF_TOKEN}"/>
    <!-- <button onclick="onSubmitHandler()">Submit</button> -->
    <button onclick="doubleSubmitHandler()">Double Submit Cookie</button>
</div>
</body>
</html>
```

##### 서버 코드
- 헤더에서 찾은 토큰 값과 쿠키에서 찾은 토큰 값을 서로 비교합니다.
- 해당 쿠키는 만료처리합니다.

```java
package blog.in.action.handler;

import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class DoubleSubmitCookieInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // 헤더로 전달된 csrf 토큰 값
        String paramToken = request.getHeader("X-CSRF-HEADER");
        String cookieToken = null;
        for (Cookie cookie : request.getCookies()) {
            if ("CSRF_TOKEN".equals(cookie.getName())) { // 쿠키로 전달되 csrf 토큰 값
                cookieToken = cookie.getValue();
                // 재사용이 불가능하도록 쿠키 만료
                cookie.setPath("/");
                cookie.setValue("");
                cookie.setMaxAge(0);
                response.addCookie(cookie);
                break;
            }
        }
        // 두 값이 일치하는 지 검증
        if (cookieToken == null || !cookieToken.equals(paramToken)) {
            response.sendRedirect("/");
            return false;
        }
        return true;
    }
}
```

##### CSRF 공격에 대한 방어 성공 여부 확인

<p align="center"><img src="/images/cross-site-reqeust-forgery-5.gif" class="image__border"></p>

## 4. CSRF disable 설정 안전한가?

`Spring Security` 프레임워크는 기본적으로 CSRF 공격에 대한 방지를 수행합니다. 
CSRF 공격에 대처할 수 설정을 `disable` 시키는 것이 과연 좋은 방법인지 찾아봤습니다. 

예전에 많이 사용했던 MVC 구조는 세션과 쿠키를 통해 사용자 인증을 수행했기 때문에 CSRF 공격에 취약합니다. 
`Stateful` 한 서비스를 제공하기 위해 인증된 사용자 정보를 세션에 저장하고, 세션 ID가 쿠키에 저장되기 때문에 문제가 발생합니다. 

> StackExchange - Should I use CSRF protection on Rest API endpoints?<br/>
> No cookies = No CSRF

네, 쿠키가 없으면 CSRF 공격도 없습니다. 
브라우저에 저장되는 쿠키가 CSRF 공격의 매개체입니다. 
최근 많이 사용하는 REST API 방식은 쿠키나 세션에 의존하지 않는 경향이 크기 때문에 CSRF 공격에 대한 방어 설정을 비활성화시키는 경우가 많다고 합니다. 
쿠키 대신에 로컬 스토리지(localStorage)와 요청 헤더(Request Header) 사용하거나, 세션 대신에 JWT(Json Web Token)을 사용하기 때문입니다. 
하지만, CSRF 공격에 대한 방지를 `disable` 시키더라도 인터셉터 등에서 적절한 방어 코드를 통해 보안 수준을 높이는 것이 좋을 것 같습니다. 

## CLOSING

로컬 스토리지을 사용하는 경우 XSS(Cross Site Scripting) 공격에 취약하지만, 관련된 내용은 다음 포스트로 정리하겠습니다. 

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-12-29-cross-site-request-forgery>

#### REFERENCE
- [Wikipedia - 사이트 간 요청 위조][csrf-wiki-link]
- [CSRF-공격이란-그리고-CSRF-방어-방법][csrf-attack-and-protection-link]
- <https://portswigger.net/web-security/csrf>
- <https://swk3169.tistory.com/24?category=712648>
- <https://security.stackexchange.com/questions/166724/should-i-use-csrf-protection-on-rest-api-endpoints/166798#166798>

[cookie-and-session-link]: https://junhyunny.github.io/information/cookie-and-session/
[cookie-attributes-link]: https://junhyunny.github.io/information/security/cookie-attributes/

[csrf-wiki-link]: https://ko.wikipedia.org/wiki/%EC%82%AC%EC%9D%B4%ED%8A%B8_%EA%B0%84_%EC%9A%94%EC%B2%AD_%EC%9C%84%EC%A1%B0
[csrf-attack-and-protection-link]: https://itstory.tk/entry/CSRF-%EA%B3%B5%EA%B2%A9%EC%9D%B4%EB%9E%80-%EA%B7%B8%EB%A6%AC%EA%B3%A0-CSRF-%EB%B0%A9%EC%96%B4-%EB%B0%A9%EB%B2%95