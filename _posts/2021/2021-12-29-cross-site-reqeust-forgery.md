---
title: "CSRF(Cross-Site Request Forgery) 공격과 방어"
search: false
category:
  - information
  - security
  - spring-boot
  - spring-security
last_modified_at: 2021-12-29T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Cookie and Session][cookie-and-session-link]
- [Deep dive into cookie][cookie-attributes-link]

## 0. 들어가면서

스프링 시큐리티(spring security) 관련 자료들을 보면 CSRF(Cross-Site Request Forgery) 설정을 비활성화시키는 글들이 종종 보인다. 예전 프로젝트 경험들을 돌이켜보면 CSRF 공격을 대비하기 위한 코드가 많았다. 이를 비활성화 시키는 것이 맞는지 의문스럽다. 이번 글에선 CSRF 공격이 무엇인지 정리하고 왜 CSRF 방어 설정을 비활성화 시키는지 정리해봤다. 

- 다음과 같이 CSRF 공격에 대한 방어 설정을 비활성화한다. 

```java
    @Override
    public void configure(HttpSecurity http) throws Exception {
        http.csrf().disable();
    }
```

## 1. Cross-Site Request Forgery

> CSRF(Cross-Site Request Forgery) - 사이트 간 요청 위조<br/>
> 사용자가 자신의 의지와는 무관하게 공격자가 의도한 행위(수정, 삭제, 등록 등)를 특정 웹사이트에 요청하게 하는 공격을 말한다. 

CSRF 공격이란 정상적인 사용자가 의도하지 않았지만, 자신도 모르게 서버를 공격하게 되는 경우이다. 공격자가 만든 악성 페이지를 통해 사용자는 자신도 모르게 공격을 수행한다. 어떻게 이런 공격이 가능할까?

### 1.1. Cookie and Session

우선 [쿠키와 세션][cookie-and-session-link]에 대한 이해가 필요하다. 사용자가 특정 서버에 로그인하면 일반적으로 다음과 같은 작업들이 수행된다.

1. 서버는 로그인 시 인증된 사용자의 정보를 세션(session)에 저장하고 이에 매칭되는 `세션 아이디(session ID)`을 만든다.
2. 서버는 저장된 세션 정보를 클라이언트(브라우저)가 사용할 수 있도록 `세션 아이디`를 `Set-Cookie` 헤더에 담아서 전달한다. 
3. 클라이언트(브라우저)는 전달된 `세션 아이디`를 쿠키에 저장한다.
4. 클라이언트(브라우저)는 해당 도메인을 가진 서버로 요청 시 쿠키에 저장된 `세션 아이디`를 자동으로 전달한다.
5. 서버는 쿠키에 담긴 `세션 아이디`를 통해 인증된 사용자인지 여부를 확인한다.

<div align="center">
  <img src="/images/posts/2021/cross-site-reqeust-forgery-01.png" width="80%" class="image__border">
</div>

### 1.2. CSRF Prerequisites and Attack Process

CSRF 공격을 위한 조건과 과정에 대해 알아보자. CSRF 공격을 시도하기 위해선 아래와 같은 몇 가지 조건이 필요하다.

- 사용자가 보안이 취약한 서버로부터 이미 인증을 받은 상태여야 한다.
- 쿠키 기반으로 서버 세션 정보를 획득할 수 있어야 한다. 
- 공격자는 서버를 공격하기 위한 요청 방법에 대해 미리 파악하고 있어야 한다. 

위와 같은 조건이 만족되면 다음과 같은 과정을 통해 CSRF 공격이 수행된다.

1. 사용자는 보안이 취약한 서버에 로그인한다.
  - 서버 세션에는 사용자 정보가 저장된다. 
  - 브라우저 쿠키에는 세션 정보를 조회할 수 있는 세션 키가 저장된다.
2. 공격자는 인증된 브라우저 사용자가 악성 스크립트가 작성된 페이지를 누르도록 유도한다.
  - 악성 스크립트가 작성된 페이지를 클릭하도록 유도하는 방법은 다양하다.
  - 게시판에 악성 스크립트를 게시글로 작성하여 관리자 혹은 다른 사용자들이 게시글을 클릭하도록 유도한다.
  - 메일 등으로 악성 스크립트를 직접 전달하거나 악성 스크립트가 작성된 페이지 링크를 전달한다.
3. 사용자가 악성 페이지 접속한다.
  - 악성 페이지에는 서버를 공격하기 위한 HTTP 요청 스크립트가 있다.
  - 악성 스크립트에 의해 실행된 HTTP 요청시 쿠키에 저장된 세션 키는 브라우저에 의해 자동으로 요청 헤더에 담겨 서버로 전달된다.
4. 사용자가 접속한 악성 페이지에서 사용자 몰래 악의적인 요청을 보낸다.
  - 악의적인 요청에는 사전에 인증된 사용자의 쿠키가 함께 전달된다.
  - 쿠키 SameSite 정책에 따라 다르지만, 크로스 사이트에서 쿠키가 요청에 함께 전달될 수 있다는 취약점을 사용한 것이다.
5. 서버는 쿠키에 담긴 세션 키를 통해 해당 요청이 인증된 사용자로부터 온 것으로 판단하고 처리한다.

<div align="center">
  <img src="/images/posts/2021/cross-site-reqeust-forgery-02.png" width="60%" class="image__border">
</div>

## 2. How to make CSRF attack?

간단한 예제 코드로 CSRF 공격을 재현해보자. 공격자는 취약 서버의 사용자 이름을 변경하는 방법을 파악하고, 악성 스크립트가 작성된 페이지를 사용자가 클릭하도록 유도했다고 가정한다. [예제 레포지토리](https://github.com/Junhyunny/blog-in-action/tree/master/2021-12-29-cross-site-request-forgery)에서 프로젝트 코드를 받을 수 있다.

- backend - 보안이 취약한 서버
  - 도메인 주소는 `localhost`를 사용한다.
  - 포트 번호는 `8081`를 사용한다.
- attacker - 공격자 서버 
  - 도메인 주소는 `127.0.0.1`를 사용한다.
  - 포트 번호는 `8080`를 사용한다.

보안이 취약한 서버에는 다음과 같은 인증 인터셉터(interceptor)가 존재한다. 해당 인증 코드 덕분에 사용자가 로그인하기 전에 악성 페이지에 접근하더라도 사용자 정보를 변경할 수 없다.

- 쿠키 정보를 바탕으로 세션에 저장된 사용자 정보 유무를 확인한다.
- 사용자 정보가 없다면 로그인 페이지로 리다이렉트(redirect)시킨다.

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

다음과 같은 웹 MVC 설정을 통해 위 AuthenticationInterceptor 객체가 적용되지 않는 경로를 지정한다.

- `/`, `/login` 경로를 제외한 모든 경로에 대한 요청은 AuthenticationInterceptor 객체를 통과한다.

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
        registry.addInterceptor(new AuthenticationInterceptor())
                .excludePathPatterns("/", "/login")
                .addPathPatterns("/**");
    }
}
```

### 2.1. GET Method Attack

`<img />` 태그(tag)를 사용하거나 하이퍼링크를 걸어주는 `<a></a>` 태그를 이용한다. 이번 예제에선 `<img />` 태그를 사용했다.

- 이미지 태그를 통해 페이지 로딩 시 보안 취약 서버로 GET 요청을 보낸다.
- width, height 값이 0px이므로 화면에서 보이지 않는다.

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

로그인 완료된 사용자가 공격자가 만든 악성 페이지를 로딩하면 사용자의 이름이 변경된다. 

<div align="center">
  <img src="/images/posts/2021/cross-site-reqeust-forgery-03.gif" width="100%" class="image__border">
</div>

### 2.2. POST Method Attack

`<form></form>` 태그와 hidden 타입의 `<input />` 태그를 사용한다. 페이지가 로딩되면 폼 요청을 시도한다.

- form 태그와 hidden 타입의 input 태그로 POST 요청을 수행한다.

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

GET 공격과 마찬가지로 로그인 완료된 사용자가 공격자가 만든 악성 페이지를 로딩하면 사용자의 이름이 변경된다. 

<div align="center">
  <img src="/images/posts/2021/cross-site-reqeust-forgery-04.gif" width="100%" class="image__border">
</div>

## 3. How to defence CSRF attack?

공격 방법에 대해 알아봤으니 방어법에 대해 정리해보자. [예제 레포지토리](https://github.com/Junhyunny/blog-in-action/tree/master/2021-12-29-cross-site-request-forgery)에서 예제 프로젝트 코드를 확인할 수 있다.

- enhanced-backend - 보안이 강화된 서버
  - 도메인 주소는 `localhost`를 사용한다.
  - 포트 번호는 `8081`를 사용한다.
- attacker - 공격자 서버 
  - 도메인 주소는 `127.0.0.1`를 사용한다.
  - 포트 번호는 `8080`를 사용한다.

### 3.1. Check Referrer

서버에서 사용자의 요청에 `Referrer` 정보를 확인하는 방법이 있다. 요청 헤더(request header) 정보에서 `Referrer` 정보를 확인할 수 있다. 보통 호스트(host)와 `Referrer` 값이 일치하므로 둘을 비교한다. CSRF 공격의 대부분 `Referrer` 값에 대한 검증만으로 방어가 가능하다고 한다.

```java
package blog.in.action.handler;

import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class ReferrerCheckInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(
        HttpServletRequest request, 
        HttpServletResponse response, 
        Object handler
    ) throws Exception {
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

### 3.2. Check CSRF token

임의의 CSRF 토큰을 만들어 세션에 저장한다. 요청하는 페이지에 `hidden` 타입 input 태그를 이용해 토큰 값을 함께 전달한다. 이후 서버에서 세션에 저장된 CSRF 토큰 값과 요청 파라미터에 담긴 토큰 값을 비교한다. 

- 세션과 모델에 CSRF 토큰을 설정한다.

```java
    // 세션에 설정
    session.setAttribute("CSRF_TOKEN", UUID.randomUUID().toString());
    // 페이지 내 hidden 값으로 설정
    model.addAttribute("CSRF_TOKEN", session.getAttribute("CSRF_TOKEN"));
```

- JSP 페이지 hidden 타입의 input 태그에 CSRF 토큰을 설정한다.

```html
<form action="http://server-host:port/path" method="POST">
    <input type="hidden" name="_csrf" value="${CSRF_TOKEN}"/>
    <!-- ... -->
</form>
```

모든 경로에 대해 CSRF 토큰 검증이 어렵다면 검증이 필요한 경로에만 추가한다. 웹 MVC 설정 빈 객체를 사용한다.

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
        registry.addInterceptor(new AuthenticationInterceptor())
                .excludePathPatterns("", "/", "/login")
                .addPathPatterns("/**");
        registry.addInterceptor(new CsrfTokenInterceptor())
                .addPathPatterns("/change/**");
    }
}
```

클라이언트 사이드 코드를 살펴보자.

1. onSubmitHandler 함수 호출 시 hidden 타입 input 태그에 설정된 CSRF 토큰 값을 서버에게 전달한다.

```html
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>Enhanced Site</title>
    <style>
        #wrap {
            margin: 0 auto;
        }
    </style>
    <script>
        function onSubmitHandler() { // 1
            fetch('http://localhost:8081/change?_csrf=' + document.getElementById('csrfToken').value, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
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
    <button onclick="onSubmitHandler()">Submit</button>
</div>
</body>
</html>
```

서버 사이드에 다음과 같이 CSRF 토큰을 비교하는 방어 코드를 추가한다. 

1. 요청 파라미터에서 CSRF 토큰을 꺼낸다.
2. 사용자 세션에서 CSRF 토큰을 꺼낸다.
3. 두 토큰 값을 비교한다.

```java
package blog.in.action.handler;

import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

public class CsrfTokenInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(
        HttpServletRequest request, 
        HttpServletResponse response, 
        Object handler
    ) throws Exception {
        HttpSession httpSession = request.getSession(false);
        String csrfTokenParam = request.getParameter("_csrf"); // 1
        String csrfTokenSession = (String) httpSession.getAttribute("CSRF_TOKEN"); // 2
        if (csrfTokenParam == null || !csrfTokenParam.equals(csrfTokenSession)) { // 3
            response.sendRedirect("/");
            return false;
        }
        return true;
    }
}
```

로그인 한 사용자가 악성 페이지를 로딩하더라도 사용자의 이름이 변경되지 않는다. 토큰이 요청 파라미터에 전달된 요청인 경우에만 정상적으로 이름이 변경된다.

<div align="center">
  <img src="/images/posts/2021/cross-site-reqeust-forgery-05.gif" width="100%" class="image__border">
</div>

### 3.3. Check Double-Submit cookie

브라우저의 `SameOrigin 정책`을 이용한다. `SameOrigin`이 아닌 경우 `JavaScript`로 쿠키 값을 확인하거나 수정하지 못한다는 점을 이용한 검증 방법이다. 동일한 도메인 주소에서 동작하도록 해당 사이트에 게시글 등을 통해 악성 스크립트를 심는 경우 이 방어는 무효하다. 이 글의 예제처럼 도메인이 다른 사이트를 이용해 공격하는 경우에만 방어 코드가 유효하다.

클라이언트(브라우저)에서 `JavaScript`로 임의의 생성한 토큰을 쿠키와 요청 헤더에 각각 담아서 서버에게 전달한다. 서버는 전달받은 쿠키와 요청 헤더에서 각자 토큰 값을 꺼내어 이를 비교하고 쿠키에 저장된 토큰 정보를 이후에 재사용하지 못하도록 만료 처리한다. 

- DoubleSubmitCookieInterceptor 인터셉터를 경로에 추가한다.

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
        registry.addInterceptor(new AuthenticationInterceptor())
                .excludePathPatterns("", "/", "/login")
                .addPathPatterns("/**");
        registry.addInterceptor(new DoubleSubmitCookieInterceptor())
                .addPathPatterns("/change/**");
    }
}
```

클라이언트 사이드 코드를 살펴보자.

1. uuidv4 함수로 임의의 토큰을 생성한다.
2. doubleSubmitHandler 함수 호출 시 생성한 토큰 정보를 요청 헤더와 쿠키에 저장 후 서버에게 전달한다.

```html
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>Enhanced Site</title>
    <style>
        #wrap {
            margin: 0 auto;
        }
    </style>
    <script>
        function uuidv4() { // 1
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        function doubleSubmitHandler() { // 2
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
    <button onclick="doubleSubmitHandler()">Double Submit Cookie</button>
</div>
</body>
</html>
```

서버 사이드에서 토큰을 비교하는 코드를 살펴보자.

1. 헤더로 전달된 CSRF 토큰을 찾는다.
2. 쿠키로 전달된 CSRF 토큰을 찾는다.
3. 쿠키에 전달된 CSRF 토큰을 변수에 저장 후 해당 쿠키를 만료한다.
4. 두 값이 일치하는 지 검증한다.

```java
package blog.in.action.handler;

import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class DoubleSubmitCookieInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(
        HttpServletRequest request, 
        HttpServletResponse response, 
        Object handler
    ) throws Exception {
        String paramToken = request.getHeader("X-CSRF-HEADER");  // 1
        String cookieToken = null;
        for (Cookie cookie : request.getCookies()) {
            if ("CSRF_TOKEN".equals(cookie.getName())) { // 2
                cookieToken = cookie.getValue(); // 3
                cookie.setPath("/");
                cookie.setValue("");
                cookie.setMaxAge(0);
                response.addCookie(cookie);
                break;
            }
        }
        if (cookieToken == null || !cookieToken.equals(paramToken)) { // 4
            response.sendRedirect("/");
            return false;
        }
        return true;
    }
}
```

로그인 한 사용자가 악성 페이지를 로딩하더라도 사용자의 이름이 변경되지 않는다. Double-Submit 쿠키가 함께 전달된 요청인 경우에만 정상적으로 이름이 변경된다.

<div align="center">
  <img src="/images/posts/2021/cross-site-reqeust-forgery-05.gif" width="100%" class="image__border">
</div>

## 4. Is it safe to turn off CSRF defence?

스프링 시큐리티 프레임워크는 기본적으로 CSRF 공격에 대한 방어를 수행한다. CSRF 공격에 대처할 수 설정을 `disable` 시키는 것이 과연 좋은 방법일까? 예전 MVC 구조는 세션과 쿠키를 통해 사용자 인증을 수행했기 때문에 CSRF 공격에 취약했다. 상태를 유지하는(stateful) 서비스를 제공하기 위해 인증된 사용자 정보를 세션에 저장하고, 세션 ID가 쿠키에 저장되기 때문에 문제가 발생했다.

> StackExchange - Should I use CSRF protection on Rest API endpoints?<br/>
> No cookies = No CSRF

쿠키가 없으면 CSRF 공격이 불가능하다. 브라우저에 저장되는 쿠키가 CSRF 공격의 매개체이기 때문이다. 최근 많이 사용하는 REST API 방식은 쿠키나 세션에 의존하지 않는 경향이 크기 때문에 CSRF 공격에 대한 방어 설정을 비활성화시키는 경우가 많은 것이다. 예를 들어 쿠키 대신에 로컬 스토리지(localStorage), 세션 대신 JWT(Json Web Token)를 사용하면 CSRF 공격에 대한 방어가 필요 없다.

## CLOSING

로컬 스토리지를 사용하는 경우 XSS(Cross Site Scripting) 공격에 취약하다. 관련 내용은 다른 글로 정리할 예정이다. 

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-12-29-cross-site-request-forgery>

#### RECOMMEND NEXT POSTS

- [Is Chrome's default SameSite policy safe against CSRF?][is-chrome-samesite-policy-safe-against-csrf-link]
- [반사형 XSS(Reflected Cross Site Scripting) 공격과 방어][reflected-cross-site-scripting-link]
- [저장형 XSS(Stored Cross Site Scripting) 공격과 방어][stored-cross-site-scripting]
- [DOM 기반 XSS(DOM based Cross Site Scripting) 공격과 방어][dom-based-cross-site-scripting-link]

#### REFERENCE

- [사이트 간 요청 위조][csrf-wiki-link]
- [CSRF-공격이란-그리고-CSRF-방어-방법][csrf-attack-and-protection-link]
- <https://portswigger.net/web-security/csrf>
- <https://swk3169.tistory.com/24?category=712648>
- <https://security.stackexchange.com/questions/166724/should-i-use-csrf-protection-on-rest-api-endpoints/166798#166798>
- <https://stackoverflow.com/questions/65854195/csrf-double-submit-cookie-is-basically-not-secure>

[cookie-and-session-link]: https://junhyunny.github.io/information/cookie-and-session/
[cookie-attributes-link]: https://junhyunny.github.io/information/security/cookie-attributes/

[is-chrome-samesite-policy-safe-against-csrf-link]: https://junhyunny.github.io/spring-boot/spring-security/security/is-chrome-samesite-policy-safe-against-csrf/
[reflected-cross-site-scripting-link]: https://junhyunny.github.io/information/security/spring-mvc/reflected-cross-site-scripting/
[stored-cross-site-scripting]: https://junhyunny.github.io/information/security/spring-mvc/stored-cross-site-scripting/
[dom-based-cross-site-scripting-link]: https://junhyunny.github.io/information/security/dom-based-cross-site-scripting/

[csrf-wiki-link]: https://ko.wikipedia.org/wiki/%EC%82%AC%EC%9D%B4%ED%8A%B8_%EA%B0%84_%EC%9A%94%EC%B2%AD_%EC%9C%84%EC%A1%B0
[csrf-attack-and-protection-link]: https://itstory.tk/entry/CSRF-%EA%B3%B5%EA%B2%A9%EC%9D%B4%EB%9E%80-%EA%B7%B8%EB%A6%AC%EA%B3%A0-CSRF-%EB%B0%A9%EC%96%B4-%EB%B0%A9%EB%B2%95
