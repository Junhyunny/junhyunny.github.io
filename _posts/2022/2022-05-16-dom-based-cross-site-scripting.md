---
title: "DOM 기반 XSS(DOM based Cross Site Scripting) 공격과 방어"
search: false
category:
  - information
  - security
last_modified_at: 2022-05-16T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [반사형 XSS(Reflected Cross Site Scripting) 공격과 방어][reflected-cross-site-scripting-link]
- [저장형 XSS(Stored Cross Site Scripting) 공격과 방어][stored-cross-site-scripting-link]

## 0. 들어가면서

이번 포스트에선 DOM 기반 XSS(DOM Based Site Scripting) 공격과 방어에 대해 알아보겠습니다. 
중복이 되는 내용들은 간단하게 정리하고 본론으로 들어가겠습니다.

##### XSS(Cross Site Scripting) 공격

> [XSS(Cross Site Scripting) 공격][xss-wiki-link]<br/>
> 사이트 간 스크립팅(또는 크로스 사이트 스크립팅, 영문 명칭 cross-site scripting, 영문 약어 XSS)은 
> 웹 애플리케이션에서 많이 나타나는 취약점의 하나로 웹사이트 관리자가 아닌 이가 웹 페이지에 악성 스크립트를 삽입할 수 있는 취약점이다. 
> 주로 여러 사용자가 보게 되는 전자 게시판에 악성 스크립트가 담긴 글을 올리는 형태로 이루어진다. 
> 이 취약점은 웹 애플리케이션이 사용자로부터 입력 받은 값을 제대로 검사하지 않고 사용할 경우 나타난다. 
> 이 취약점으로 해커가 사용자의 정보(쿠키, 세션 등)를 탈취하거나, 자동으로 비정상적인 기능을 수행하게 할 수 있다. 
> 주로 다른 웹사이트와 정보를 교환하는 식으로 작동하므로 사이트 간 스크립팅이라고 한다.

##### XSS 공격 유형

- 반사형 XSS(Reflected XSS)
- 저장형 XSS(Stored or Persistent XSS)
- DOM 기반 XSS(DOM Based XSS)

## 1. DOM 기반 XSS(DOM Based Cross Site Scripting)

DOM 기반 XSS 공격은 보안에 취약한 JavaScript 코드로 DOM 객체를 제어하는 과정에서 발생합니다. 
간단한 시나리오를 바탕으로 예제 코드를 살펴보겠습니다. 

### 1.1. DOM 기반 XSS 공격 시나리오

1. 악의적인 사용자가 보안이 취약한 웹 페이지를 발견했습니다.
1. 보안이 취약한 웹 페이지에서 악성 스크립트가 실행되도록 URL 주소를 만들어 일반 사용자에게 전달합니다.
1. 일반 사용자는 메일 등을 통해 전달받은 URL 링크를 클릭합니다. 서버로부터 HTML 문서를 전달받습니다.
1. 사용자의 브라우저가 응답 받은 HTML 문서를 읽으면서 필요한 스크립트를 실행하는 중에 악성 스크립트가 동작합니다.
1. 악성 스크립트를 통해 사용자 정보가 악의적으로 전달됩니다.

<p align="center">
    <img src="/images/dom-based-cross-site-scripting-1.JPG" width="100%" class="image__border">
</p>

### 1.2. DOM 기반 XSS 공격 취약 서비스의 코드

보안이 취약한 웹 페이지 코드를 살펴보겠습니다. 

#### 1.2.1. index JSP

- URL 주소에 해시(#) 값이 존재하면, 서버로 해시 값 경로에 위치한 페이지를 요청합니다.
- 해시 값 변경이 발생할 때마다 서버에게 특정 페이지를 요청합니다.

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <style>
        <!-- ... styles -->
    </style>
    <script type="text/javascript">
        const hash = window.location.hash.slice(1)
        if (hash) {
            window.location.href = decodeURIComponent(hash)
        }
        window.addEventListener('hashchange', function () {
            window.location.href = decodeURIComponent(window.location.hash.slice(1))
        });
    </script>
    <meta charset="UTF-8">
    <title>DOM Based XSS 공격</title>
</head>

<body>
<h1>DOM Based XSS 공격</h1>

<div class="container">
    <a id="first" href="#first" class="item">First 바로가기</a>
    <a id="second" href="#second" class="item">Second 바로가기</a>
</div>

</body>
</html>
```

#### 1.2.2. DomBasedController 클래스

- 단순하게 페이지만 응답하는 컨트롤러입니다.

```java
package blog.in.action.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DomBasedController {

    @GetMapping(path = {"", "/"})
    public String index() {
        return "index";
    }

    @GetMapping("first")
    public String first() {
        return "First";
    }

    @GetMapping("second")
    public String second() {
        return "Second";
    }
}
```

### 1.3. DOM 기반 XSS 공격 결과

1. 악의적인 사용자는 악성 스크립트를 만들어 URL로 만들어지는 것을 확인합니다.
1. 공격 URL 주소를 다른 일반 사용자가 알아보지 못 하도록 다른 URL 주소로 변경한 후 일반 사용자에게 전달합니다.
1. 공격 URL 주소를 클릭한 사용자의 브라우저는 악성 스크립트를 실행하게 됩니다.

<p align="center">
    <img src="/images/dom-based-cross-site-scripting-2.gif" width="100%" class="image__border">
</p>

### 1.4. DOM 기반 XSS 공격과 반사형 XSS 공격의 차이점

이전 [반사형 XSS(Reflected Cross Site Scripting) 공격과 방어][reflected-cross-site-scripting-link] 포스트를 읽어보면 반사형 XSS 공격과 DOM 기반 공격이 유사하게 보입니다. 
두 공격 사이에 차이점은 악성 스크립트가 심어지는 시점에서 찾을 수 있습니다. 
다음과 같이 정리해보았습니다. 

##### DOM 기반 XSS 공격

- 최초에 HTML 문서를 서버로부터 받으면, 그 이후에는 서버로 요청을 보내지 않아도 악성 스크립트 심을 수 있습니다.
- DOM 기반 XSS 공격 결과를 보면 네트워크에서 서버에게 별도 요청은 없지만, URL 주소 해시에 심은 악성 스크립트가 실행됩니다.
- 악성 스크립트가 담긴 URL 주소를 클라이언트가 누르면 다음과 같이 동작합니다.
    1. 일반적인 사용자가 악성 스크립트가 담긴 URL을 클릭합니다.
    1. 사용자 브라우저는 서버로부터 정상적인 HTML 문서를 전달받습니다.
    1. 사용자 브라우저가 정상적인 HTML 문서를 읽습니다.
    1. 브라우저가 HTML 문서를 읽는 중에 URL에 담긴 악성 스크립트 문자열을 추출합니다.
    1. 악성 스크립트를 실행시킬 수 있는 JavaScript 코드를 만나 실행됩니다. 

##### 반사형 XSS 공격

- URL 주소에 함께 작성된 악성 스크립트가 일단 서버에 전달되어야 합니다.
- 악성 스크립트가 담긴 URL 주소를 클라이언트가 누르면 다음과 같이 동작합니다.
    1. 일반적인 사용자가 악성 스크립트가 담긴 URL을 클릭합니다.
    1. 서버는 URL에 담긴 악성 스크립트 문자열을 추출합니다.
    1. 응답해야하는 HTML 문서에 악성 스크립트를 검증 없이 그대로 담습니다.
    1. 사용자 브라우저는 서버로부터 비정상적인 HTML 문서를 전달받습니다.
    1. 사용자 브라우저가 정상적인 HTML 문서를 읽습니다.
    1. 악성 스크립트가 실행됩니다.

## 2. DOM 기반 XSS 예방과 공격 유형

실제 예시를 보면 악성 스크립트가 실행되는 취약한 코드는 다음과 같은 한 줄입니다. 

##### 보안 취약 코드

```javascript
window.location.href = decodeURIComponent(hash)
```

위 코드는 고의로 XSS 공격을 유도하진 않았지만, 보안에 취약한 사용 방법이므로 피하는 것이 좋아보입니다. 
또, 클라이언트 측에서 사용자의 입력을 검증 없이 사용하였기 때문에 발생하였기 때문에 사용자가 입력할 수 있는 값에 대한 검증이 필요해 보입니다. 

DOM 기반 XSS 공격을 예방하기 위해선 다음 내용들을 확인할 필요가 있어 보입니다.
- 보안에 취약한 JavaScript 코드 미사용
- 클라이언트 입력 값 검증

마지막으로 DOM 기반 XSS 공격을 유발할 수 있는 취약한 유형에 대해 알아보고 이번 글을 마치겠습니다. 

##### 유형 1. 해시 값 innerHTML 삽입

```html
<body>
    <script>
        let hash = location.hash.slice(1);
        document.body.innerHTML = decodeURIComponent(hash);
    </script>
</body>
```

##### 유형 2. 해시 값 href 삽입

```html
<script>
    location.href = decodeURIComponent(location.hash.slice(1));
</script>
```

##### 유형 3. jQuery 라이브러리

- jQuery 라이브러리의 버그로 인해 XSS 공격이 가능하기도 합니다. 
- <https://security.stackexchange.com/questions/200215/is-this-code-vulnerable-to-dom-based-xss-jquery-animate>

<p align="center">
    <img src="/images/dom-based-cross-site-scripting-3.JPG" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-05-16-dom-based-cross-site-scripting>

#### REFERENCE
- [XSS(Cross Site Scripting) 공격][xss-wiki-link]
- <https://bitly.com/>
- <https://portswigger.net/web-security/cross-site-scripting/dom-based>
- <https://blog.rubiya.kr/index.php/2019/03/28/browsers-xss-filter-bypass-cheat-sheet/>
- <https://security.stackexchange.com/questions/200215/is-this-code-vulnerable-to-dom-based-xss-jquery-animate>

[xss-wiki-link]: https://ko.wikipedia.org/wiki/%EC%82%AC%EC%9D%B4%ED%8A%B8_%EA%B0%84_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8C%85
[reflected-cross-site-scripting-link]: https://junhyunny.github.io/information/security/spring-mvc/reflected-cross-site-scripting/
[stored-cross-site-scripting-link]: https://junhyunny.github.io/information/security/spring-mvc/stored-cross-site-scripting/
