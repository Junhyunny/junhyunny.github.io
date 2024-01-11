---
title: "반사형 XSS(Reflected Cross Site Scripting) 공격과 방어"
search: false
category:
  - information
  - security
  - spring-mvc
last_modified_at: 2022-05-08T23:55:00
---

<br/>

👉 이어서 읽기를 추천합니다.
- [저장형 XSS(Stored Cross Site Scripting) 공격과 방어][stored-cross-site-scripting-link]
- [DOM 기반 XSS(DOM based Cross Site Scripting) 공격과 방어][dom-based-cross-site-scripting-link]

## 0. 들어가면서

레거시 시스템을 살펴보면 필터에서 요청 파라미터나 메시지에 담긴 `<`, `>` 등의 특수 문자를 다른 문자열로 치환하는 코드를 종종 보곤 합니다. 
이런 시큐어 코딩(secure coding)의 필요성을 잘 몰랐을 땐 요청 파라미터나 메시지가 변환되는 것에 대해 불편함을 토로하곤 했습니다. 
이 포스트에선 XSS 공격에 대한 전반적인 개념과 대표적인 공격 유형 중 반사형 XSS(Reflected XSS) 공격에 대한 내용을 위주로 다뤘습니다. 

## 1. XSS(Cross Site Scripting) 공격

> [XSS(Cross Site Scripting) 공격][xss-wiki-link]<br/>
> 사이트 간 스크립팅(또는 크로스 사이트 스크립팅, 영문 명칭 cross-site scripting, 영문 약어 XSS)은 
> 웹 어플리케이션에서 많이 나타나는 취약점의 하나로 웹사이트 관리자가 아닌 이가 웹 페이지에 악성 스크립트를 삽입할 수 있는 취약점이다. 
> 주로 여러 사용자가 보게 되는 전자 게시판에 악성 스크립트가 담긴 글을 올리는 형태로 이루어진다. 
> 이 취약점은 웹 어플리케이션이 사용자로부터 입력 받은 값을 제대로 검사하지 않고 사용할 경우 나타난다. 
> 이 취약점으로 해커가 사용자의 정보(쿠키, 세션 등)를 탈취하거나, 자동으로 비정상적인 기능을 수행하게 할 수 있다. 
> 주로 다른 웹사이트와 정보를 교환하는 식으로 작동하므로 사이트 간 스크립팅이라고 한다.

위키피디아의 XSS 공격에 대한 정의를 읽어보면 매우 잘 설명해주고 있지만, 
이해가 안 되거나 정확한 컨셉이 와닿지 않는 분들을 위해 간단한 시나리오를 바탕으로 예시 코드를 살펴보겠습니다. 

## 2. 반사형 XSS(Reflected XSS)

XSS 공격은 다음과 같은 유형들이 존재합니다.
- 반사형 XSS(Reflected XSS)
- 저장형 XSS(Stored or Persistent XSS)
- DOM 기반 XSS(DOM Based XSS)

이번 포스트에선 반사형 XSS 공격과 이를 방어하는 방법에 대해 정리하였습니다. 
악의적인 사용자가 악성 스크립트가 담긴 URL을 만들어 일반 사용자에게 전달하는 경우입니다. 
악의적인 사용자는 URL 주소 뒤에 붙는 쿼리에 악성 스크립트를 작성해서 전달합니다.

```
$ curl http://vulnerable-site.com/query?keyworkd=<script>malicious-script-code</script>
```

### 2.1. 반사형 XSS 공격 시나리오

1. 악의적인 사용자가 보안이 취약한 사이트를 발견했습니다. 
1. 보안이 취약한 사이트에서 사용자 정보를 빼돌릴 수 있는 스크립트가 담긴 URL을 만들어 일반 사용자에게 스팸 메일로 전달합니다.
1. 일반 사용자는 메일을 통해 전달받은 URL 링크를 클릭합니다. 일반 사용자 브라우저에서 보안이 취약한 사이트로 요청을 전달합니다.
1. 일반 사용자의 브라우저에서 응답 메시지를 실행하면서 악성 스크립트가 실행됩니다.
1. 악성 스크립트를 통해 사용자 정보가 악의적인 사용자에게 전달됩니다.

<p align="center">
    <img src="/images/reflected-cross-site-scripting-1.JPG" width="100%" class="image__border">
</p>

### 2.2. 반사형 XSS 공격 취약 서비스의 코드

이제 보안이 취약한 서버의 코드를 살펴보겠습니다. 
불필요한 코드는 제외하고 문제를 일으키는 코드만 확인해보겠습니다.

#### 2.2.1. ReflectedXssAttack JSP

- 사용자에게 검색 키워드를 입력받습니다.
- 사용자가 자신이 어떤 검색 키워드를 사용했는지 확인할 수 있도록 화면에 보여줍니다.

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <style>
        <!-- styles ... -->
    </style>
    <meta charset="UTF-8">
    <title>Reflected XSS 공격</title>
</head>

<body>
<h1>Reflected XSS 공격</h1>

<div class="form">
    <form action="/reflected" method="get">
        <div class="form__input">
            <div>
                <span>검색어</span>
                <input type="text" name="keyword"/>
            </div>
        </div>
        <input class="form__button" type="submit" value="검색"/>
    </form>
</div>

<div class="container">
    <div class="container__header">검색어 ${keyword}</div>
</div>

</body>
</html>
```

#### 2.2.2. XssAttackController 클래스

- 화면에서 전달한 조회 키워드 파라미터를 그대로 화면에 담아서 전달합니다.
- 사용자의 입력을 검증 없이 사용합니다.

```java
    @GetMapping(path = "/reflected")
    public String index(Model model, @RequestParam(name = "keyword", required = false) String keyword) {
        model.addAttribute("keyword", keyword);
        return "ReflectedXssAttack";
    }
```

### 2.3. 반사형 XSS 공격 결과

1. 악의적인 사용자는 악성 스크립트를 만들어 URL로 만들어지는 것을 확인합니다.
1. 공격 URL 주소를 다른 일반 사용자가 알아보지 못 하도록 다른 URL 주소로 변경한 후 일반 사용자에게 전달합니다.
1. 공격 URL 주소를 클릭한 사용자의 브라우저는 악성 스크립트를 실행하게 됩니다.

<p align="center">
    <img src="/images/reflected-cross-site-scripting-2.gif" width="100%" class="image__border">
</p>

## 3. 반사형 XSS 방어

반사형 XSS 공격을 방어하는 방법을 정리해보겠습니다. 

### 3.1. 입력 값 제한

브라우저에서 사용자 입력 시 특수 문자를 제한합니다. 
다음과 같은 정규식을 통해 입력을 제한할 수 있습니다.

##### 클라이언트 입력 제한 정규식 사용

- 한글, 영어, 숫자, 공백만 입력 가능합니다.

```jsp
    <script type="text/javascript">
        function submitHandler() {
            const keyword = document.querySelector("input[name='keyword']");
            const regex = /^[ㄱ-ㅎ|가-힣|a-z|A-Z|0-9| |]+$/;
            if (!regex.test(keyword.value)) {
                alert('특수 문자는 입력할 수 없습니다.');
                return false;
            }
            return true;
        }
    </script>

<body>

<!-- ... -->

<div class="form">
    <form action="/reflected" method="get" onsubmit="return submitHandler();">
        <div class="form__input">
            <div>
                <span>검색어</span>
                <input type="text" name="keyword"/>
            </div>
        </div>
        <input class="form__button" type="submit" value="검색"/>
    </form>
</div>

</body>
```

##### 적용 결과

<p align="center">
    <img src="/images/reflected-cross-site-scripting-3.gif" width="100%" class="image__border">
</p>

### 3.2. 입력 값 치환

악성 스크립트를 만들 수 있는 특수 문자들을 치환합니다. 
모든 요청에 대해 치환을 적용할 수 있도록 필터를 만들어 이를 적용합니다. 

##### 악성 스크립트를 만들 수 있는 특수 문자

| ASCII 문자 | 참조 문자 | ASCII 문자 | 참조 문자 |
|:---:|:---:|:---:|:---:|
| & | `&amp;` | " | `&quot;` |
| < | `&lt;` | ' | `&#x27;` |
| > | `&gt;` | / | `&#x2F;` |
| ( | `&#40;` | ) | `&#41;` |

##### XssAttackFilter 클래스

- 요청 정보를 담고 있는 `ServletRequest` 객체를 `RequestWrapper` 클래스로 래핑합니다.
- 요청에서 다음과 같은 데이터를 추출할 때 오버라이딩 한 메소드를 통해 전달합니다.
    - `getParameterValues` 메소드 - 요청 파라미터 값들을 전달할 때 특수 문자를 치환 후 반환합니다.
    - `getParameter` 메소드 - 요청 파라미터 값을 전달할 때 특수 문자를 치환 후 반환합니다.
    - `getHeader` 메소드 - 요청 헤더 값을 전달할 때 특수 문자를 치환 후 반환합니다.

```java
package blog.in.action.filter;

import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import java.io.IOException;

@Component
public class XssAttackFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {

    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        filterChain.doFilter(new RequestWrapper((HttpServletRequest) servletRequest), servletResponse);
    }

    @Override
    public void destroy() {

    }

    private class RequestWrapper extends HttpServletRequestWrapper {

        public RequestWrapper(HttpServletRequest request) {
            super(request);
        }

        @Override
        public String[] getParameterValues(String parameter) {
            String[] values = super.getParameterValues(parameter);
            if (values == null) {
                return null;
            }
            int count = values.length;
            String[] encodedValues = new String[count];
            for (int i = 0; i < count; i++) {
                encodedValues[i] = cleanXSS(values[i]);
            }
            return encodedValues;
        }

        @Override
        public String getParameter(String parameter) {
            String value = super.getParameter(parameter);
            if (value == null) {
                return null;
            }
            return cleanXSS(value);
        }

        @Override
        public String getHeader(String name) {
            String value = super.getHeader(name);
            if (value == null) {
                return null;
            }
            return cleanXSS(value);
        }

        private String cleanXSS(String value) {
            value = value.replaceAll("&", "&amp;");
            value = value.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
            value = value.replaceAll("\\(", "&#40;").replaceAll("\\)", "&#41;");
            value = value.replaceAll("/", "&#x2F;");
            value = value.replaceAll("'", "&#x27;");
            value = value.replaceAll("\"", "&quot;");
            return value;
        }
    }
}
```

##### 적용 결과

<p align="center">
    <img src="/images/reflected-cross-site-scripting-4.gif" width="100%" class="image__border">
</p>

### 3.3. 직접 출력 금지

사용자의 입력을 그대로 출력하는 일은 위험하므로 라이브러리의 출력 함수를 사용하는 방법이 있습니다. 
JSP 프레임워크에서 사용하는 JSTL 라이브러리의 출력 태그(`<c:out />`)를 사용하면 문자열을 그대로 출력합니다. 
문자열을 그대로 출력하기 때문에 스크립트가 실행되지 않으므로 XSS 공격을 방어할 수 있습니다.

##### JSTL <c:out /> 태그 사용

```jsp
<div class="container">
    <div class="container__header">검색어 <c:out value="${keyword}"/></div>
</div>
```

##### 적용 결과

<p align="center">
    <img src="/images/reflected-cross-site-scripting-5.gif" width="100%" class="image__border">
</p>

## 4. XSS 공격의 위험성

악성 스크립트를 통한 XSS 공격은 쿠키나 스토리지로부터 사용자 정보를 획득하는 방법만 있는 것이 아닙니다. 
다음과 같은 스크립트를 통해 악속 코드를 다운받는 사이트 혹은 유사 사이트로 리다이렉트(redirect) 시킬 수 있습니다. 

```jsp
<script>
    window.open("https://www.google.com/?query=hello+world")
</script>
```

## CLOSING

이번 포스트에서 XSS 공격의 모든 유형을 다루기엔 너무 내용이 길어질 것 같아서 분리하였습니다. 
다음 포스트는 저장형 XSS(Stored or Persistent XSS) 공격과 방어에 대한 내용을 다뤄보겠습니다.

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-05-08-reflected-cross-site-scripting>

#### REFERENCE
- [XSS(Cross Site Scripting) 공격][xss-wiki-link]
- <https://bitly.com/>
- <https://kevinthegrey.tistory.com/36>
- <https://brownbears.tistory.com/250>
- <https://www.hahwul.com/cullinan/xss/>
- <http://blog.plura.io/?p=7614>
- <https://popo015.tistory.com/104>
- <https://m.blog.naver.com/weekamp/220458872665>

[xss-wiki-link]: https://ko.wikipedia.org/wiki/%EC%82%AC%EC%9D%B4%ED%8A%B8_%EA%B0%84_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8C%85

[stored-cross-site-scripting-link]: https://junhyunny.github.io/information/security/spring-mvc/stored-cross-site-scripting/
[dom-based-cross-site-scripting-link]: https://junhyunny.github.io/information/security/dom-based-cross-site-scripting/