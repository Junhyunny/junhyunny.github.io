---
title: "Is Chrome's default SameSite policy safe against CSRF?"
search: false
category:
  - spring-boot
  - spring-security
  - security
last_modified_at: 2024-07-09T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Deep dive into cookie][cookie-attributes-link]
- [CSRF(Cross-Site Request Forgery) Attack and Defence][cross-site-reqeust-forgery-link]

## 0. 들어가면서

책의 크로스 사이트 요청 위조(CSRF, Cross-Site Request Forgery) 부분을 집필하고 있다. 내용을 정리하다보니 크로스 사이트 사이에 쿠키를 공유를 제어하는 정책인 `SameSite` 속성을 자세히 살펴볼 필요가 있었다. 관련된 내용을 글로 정리하였다. 이 글은 SameSite 속성 중 `Lax`에 대한 이야기다. 

## 1. What is the meaning of same site?

쿠키(cookie)의 동일 사이트(same site)가 어떤 의미인지 정리하자. [크로스 오리진(cross origin)](https://junhyunny.github.io/information/cors/)과 다른 개념이므로 주의하길 바란다.

동일 사이트(same site)란 공용 접미사(public suffix)와 한 단계 하위 도메인까지 동일하다면 이를 동일 사이트로 판단한다. 더 자세히 살펴보자. [Root Zone Database](https://www.iana.org/domains/root/db) 사이트엔 eTLD(effective TLD) 리스트가 정리되어 있다. 예를 들어 .com, .org, .kr, .io 같은 루트 도메인 리스트가 관리된다. 이런 루트 도메인을 eTLD(effective TLD)이라고 한다. 

- eTLD 도메인과 한 단계 아래 도메인까지 포함한 도메인이 같은 경우 동일 사이트이다.

<div align="center">
  <img src="/images/posts/2024/is-chrome-samesite-policy-safe-against-csrf-01.png" width="40%" class="image__border image__padding">
</div>
<center>https://web.dev/same-site-same-origin/</center>

<br/>

루트 도메인만으로 동일 사이트를 구분하기 힘든 경우가 있다. 예를 들어 깃허브(github)는 .github.io 도메인으로 사용자들의 개인 사이트를 호스팅 해주기 때문에 .io 루트 도메인만으로 동일 사이트 여부를 판단하기 어렵다. 이를 해결하기 위해 [공공 접미사(public suffix)](https://publicsuffix.org/list/)를 만들어 관리한다.

- 공공 접미사 도메인과 한 단계 아래 도메인까지 포함한 도메인이 같은 경우 동일 사이트이다.

<div align="center">
  <img src="/images/posts/2024/is-chrome-samesite-policy-safe-against-csrf-02.png" width="40%" class="image__border image__padding">
</div>
<center>https://web.dev/same-site-same-origin/</center>

<br/>

아래 표는 동일 사이트와 크로스 사이트를 구분한 예시이다.

<div align="center">
  <img src="/images/posts/2024/is-chrome-samesite-policy-safe-against-csrf-03.png" width="80%" class="image__border image__padding">
</div>
<center>https://web.dev/same-site-same-origin/</center>

<br/>

도메인 주소 앞의 스키마(schema)까지 비교하여 동일 사이트인지 여부를 판단하면 이를 `스킴풀(schemeful) 동일 사이트`라고 한다. 아래 표는 스킴풀 동일 사이트와 크로스 사이트를 구분한 예시이다.

<div align="center">
  <img src="/images/posts/2024/is-chrome-samesite-policy-safe-against-csrf-04.png" width="80%" class="image__border image__padding">
</div>
<center>https://web.dev/same-site-same-origin/</center>

<br/>

브라우저 주소 창에 표시된 주소와 HTTP 요청을 받아 주는 서버의 주소가 동일 사이트인지 여부를 판단할 때 비교 대상이 된다.

- 브라우저 주소 창에 표시되는 해당 HTML 리소스를 가져온 서버의 주소
  - 아래 그림에선 cross-site.com 사이트에서 해당 HTML 페이지 리소스를 가져왔다.
- HTML 태그나 스크립트 코드로 HTTP 요청을 보낼 때 해당 요청을 처리하는 서버의 주소
  - 아래 그림에선 origin-site.com 사이트로 요청을 보낸다.
- HTTP 요청 헤더를 보면 다음과 같은 값을 확인할 수 있다.
  - origin, referrer 값엔 해당 HTML 페이지 리소스를 받아온 사이트 정보가 표시된다.
  - host 값엔 해당 HTTP 요청을 처리해 줄 서버 주소 정보가 표시된다.

<div align="center">
  <img src="/images/posts/2024/is-chrome-samesite-policy-safe-against-csrf-05.png" width="80%" class="image__border">
</div>

## 2. Options for SameSite

쿠키의 SameSite 속성을 간단히 정리하면 크로스 사이트로 요청을 보낼 때 쿠키를 함께 전달할 것인지 아닌지 결정하는 옵션이다. 브라우저는 다음 응답 헤더를 받으면 SameSite 옵션이 "Strict" 상태인 SID 쿠키를 저장한다.

```
Set-Cookie: SID=31d4d96e407aad42; SameSite=Strict
```

SameSite 속성은 "Strict"를 포함한 3가지 옵션이 있다. 간단하게 살펴보자. 

- None
  - 크로스 사이트 여부를 판단하지 않고 모든 HTTP 요청에 해당 쿠키가 함께 전달된다.
  - 쿠키의 Secure 옵션을 활성화해서 HTTPS 환경에서만 사용할 수 있다.
  - CSRF 공격에 매우 취약하다.
- Strict
  - 동일 사이트인 경우에만 HTTP 요청에 해당 쿠키가 함께 전달된다.
- Lax
  - 동일 사이트인 경우에 HTTP 요청에 해당 쿠키가 함께 전달된다.
  - 크로스 사이트인 경우라면 안전한 요청에만 해당 쿠키가 함께 전달된다.

Lax 옵션일 때 크로스 사이트임에도 쿠키 전송을 허용하는 안전한 요청이란 무엇일까?

- GET 메소드 요청
  - AJAX(Asynchronous JavaScript and XML) 요청
  - 폼(form) 요청
- 탑-레벨(top-level) 문서에서만 발생하는 네비게이션
  - anchor 태그의 href 변경
  - document.location 객체의 href 변경 

Lax 옵션은 GET 요청이 서버의 상태를 변경하지 않는 안전한 읽기-전용(read-only) 요청이라는 가정을 기저에 깔고 쿠키를 함께 전달한다. 탑-레벨 문서에서 발생하는 네비게이션 시 쿠키를 허용하는 이유는 서드-파티(3rd-party) 사이트로 이동하는 것을 지원하기 위함이다. Strict 옵션은 외부 사이트로의 연결을 원활히 지원할 수 없다. iframe 태그는 탑-레벨 문서가 아니기 때문에 iframe 태그 내부에서 일어나는 네비게이션엔 쿠키를 전달하지 않는다.

## 3. Is Chrome's default SameSite safe against CSRF? 

20년 2월에 출시된 크롬(chrome) 80부터 쿠키에 지정된 SameSite 값이 없는 경우 쿠키가 Lax 옵션과 동일하게 동작하도록 업데이트했다. 업데이트 이전엔 None 옵션으로 동작했기 때문에 CSRF 공격에 취약했다. 업데이트 당시 크롬의 SameSite 기본 동작이 Lax 옵션이 되면서 발생한 에러들을 해결한 블로그 글들을 많이 볼 수 있다. 

마이크로소프트의 AAD(Azure Active Directory)나 MSA(Microsoft Account Authentication) 같은 OAuth2 인증 메커니즘에도 문제가 있었던 것으로 보인다. 웹 서비스 환경에서 OAuth2 인증 시 브라우저에서 리다이렉트가 발생하는데 SameSite 옵션이 Lax인 경우 쿠키가 중간에 누락되는 문제가 있었다. 

- 마이크로소프트 AAD 인증시 `form_post` 방식을 사용하기 때문에 Lax 옵션일 경우 중간에 쿠키가 누락되는 문제가 리포트된다.
- 이 문제를 해결하기 위해 크롬(chrome) 팀은 다음과 같은 조건을 만족하는 쿠키에 한해 폼 요청시 POST 메소드에 쿠키 전달을 허용한다.
  - 만료 시간이 지정되지 않은 쿠키의 경우 2분 동안 폼 요청시 POST 메소드에 쿠키 전달 허용
  - 최대 사용 시간이 2분 이내인 쿠키는 폼 요청시 POST 메소드에 쿠키 전달 허용

<div align="center">
  <img src="/images/posts/2024/is-chrome-samesite-policy-safe-against-csrf-06.png" width="100%" class="image__border">
</div>
<center>https://groups.google.com/a/chromium.org/g/blink-dev/c/AknSSyQTGYs/m/lXBt8xyGAgAJ</center>

<br/>

위에서 봤듯이 최초 쿠키가 설정되고 2분 정도는 POST 메소드 요청이 허용된다. 이 말은 크롬의 SameSite 디폴트 정책은 실제 Lax 옵션에 비해 완화된 기준이 적용되어 있다는 의미다. 이 완화된 정책으로 CSRF 공격에 대한 위험도는 여전히 존재한다. 

## 4. Example

위 내용이 사실인지 간단한 예제를 통해 확인해보자. SameSite 옵션을 지정하지 않은 쿠키와 Lax 쿠키 사이의 동작을 비교한다. 컨셉 확인을 위해 타임리프(thymeleaf) 템플릿 엔진을 사용했다. 

### 4.1. IndexController Class

메인 페이지를 반환하는 컨트롤러 클래스다.

1. 루트 경로로 접근하는 경우 DefaultCookie, LaxCookie 쿠키를 만들어 반환한다.
  - DefaultCookie 쿠키는 SameSite 옵션을 지정하지 않는다.
  - LaxCookie 쿠키는 SameSite 옵션 Lax로 지정한다.
2. POST 요청시 쿠키 전달 여부를 확인할 수 있는 API 엔드-포인트(end-point)를 만든다.

```java
package action.in.blog.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class IndexController {

    @GetMapping
    public String index(HttpServletResponse response) { // 1
        response.addHeader("Set-Cookie", "DefaultCookie=DefaultCookie");
        response.addHeader("Set-Cookie", "LaxCookie=LaxCookie;SameSite=Lax");
        return "index";
    }

    @PostMapping("/posts") // 2
    public String posts() {
        return "index";
    }
}
```

### 4.2. index HTML

1개의 링크와 6개의 버튼이 존재한다. 

- `link` 링크는 앵커 태그를 사용해 페이지를 이동한다.
- `document location` 버튼은 document.location 객체의 href 값을 변경해 페이지를 이동한다.
- `AJAX request` 버튼은 fetch API를 사용해 AJAX GET 요청을 수행한다.
- `get submit` 버튼은 GET 메소드 폼 요청을 수행한다.
- `post submit` 버튼은 POST 메소드 폼 요청을 수행한다.
- `iframe get submit` 버튼은 GET 메소드 폼 요청의 결과를 iframe 태그에 출력한다.
- `popup post submit` 버튼은 POST 메소드 폼 요청의 결과를 새로운 팝업 윈도우에 출력한다.

```html
<!DOCTYPE html>
<html lang="ko">
<header>
    <meta charset="UTF-8">
    <title>Document</title>
    <style>
      /* styles */
    </style>
    <script>
        window.open("", "popup", "width=300,height=300");
    </script>
</header>
<body>
<div class="container">
    <a href="http://origin-site.com:8080">link</a>
    <button onclick="change()">document location</button>
    <button onclick="request()">AJAX request</button>
    <form action="http://origin-site.com:8080" method="get">
        <button>get submit</button>
    </form>
    <form action="http://origin-site.com:8080/posts" method="post">
        <button>post submit</button>
    </form>
    <form action="http://origin-site.com:8080" method="get" target="innerFrame">
        <button>iframe get submit</button>
    </form>
    <iframe id="innerFrame" name="innerFrame" style="display: none"></iframe>
    <form action="http://origin-site.com:8080/posts" method="post" target="popup">
        <button>popup post submit</button>
    </form>
</div>
<script>
    function change() {
        document.location.href = "http://origin-site.com:8080"
    }

    function request() {
        fetch('http://origin-site.com:8080', {
            method: 'get',
            credentials: 'include'
        })
    }
</script>
</body>
</html>
```

### 4.3. Add hosts

크로스 사이트에서 쿠키가 전달되는지 확인하려면 서로 다른 도메인 주소가 필요하다. 테스트를 위해 hosts 파일에 임시로 도메인 주소를 등록한다. 필자는 맥OS(MacOS) 사용하기 때문에 아래 명령어를 통해 호스트 파일을 수정할 수 있다.

```
$ sudo vi /etc/hosts
```

테스트를 위해 다음 호스트들을 추가한다.

```
127.0.0.1       origin-site.com
127.0.0.1       cross-site.com
```

### 4.4. Run application and test

애플리케이션을 실행 후 http://origin-site.com:8080 주소로 접속하면 다음과 같은 화면을 볼 수 있다.

- DefaultCookie, LaxCookie 쿠키를 개발자 도구 Application 탭에서 확인할 수 있다.
- 신규 팝업 윈도우가 빈 화면으로 열린다.

<div align="center">
  <img src="/images/posts/2024/is-chrome-samesite-policy-safe-against-csrf-07.png" width="80%" class="image__border">
</div>

<br/>

이번엔 http://cross-site.com:8080 주소로 접속한다. 동일한 화면이지만, 주소가 다르다. 이제 링크와 버튼을 하나씩 누르면서 HTTP 요청의 헤더 값을 확인해보자. 버튼을 누르면 브라우저의 주소가 변경되기 때문에 버튼을 누르기 전에 브라우저 주소가 http://cross-site.com:8080 값인지를 확인하길 바란다. 

`link` 링크와 `document location`, `AJAX request`, `get submit` 버튼을 클릭하면 다음과 같은 요청을 보낸다.

- DefaultCookie, LaxCookie 쿠키 모두 전달한다.
- Host 값은 origin-site.com:8080 이다.
- Referer 값은 http://cross-site.com:8080/ 이다.

```
GET / HTTP/1.1
...
Cookie: DefaultCookie=DefaultCookie; LaxCookie=LaxCookie
Host: origin-site.com:8080
Referer: http://cross-site.com:8080/
...
```

`post submit`, `popup post submit` 버튼을 다음과 같은 요청을 보낸다. 크롬은 크로스 사이트로 보내는 POST 메소드 요청이기 때문에 LaxCookie 쿠키는 전달하지 않는다. 반면 예외 처리에 의해 DefaultCookie 쿠키는 전달한다. 하지만 최초 쿠키가 등록된 후 2분이 지났다면 전달 대상에서 제외된다.

- DefaultCookie 쿠키만 전달한다. 
- Host 값은 origin-site.com:8080 이다.
- Origin 값은 http://cross-site.com:8080 이다.
- Referer 값은 http://cross-site.com:8080/ 이다.

```
POST /posts HTTP/1.1
...
Cookie: DefaultCookie=DefaultCookie
Host: origin-site.com:8080
Origin: http://cross-site.com:8080
Referer: http://cross-site.com:8080/
...
```

`iframe get submit` 버튼을 다음과 같은 요청을 보낸다. GET 요청이지만, iframe 태그에 요청 결과를 출력하기 때문에 LaxCookie 쿠키를 함께 전달하지 않는다. DefaultCookie 쿠키도 기본적으로 Lax 옵션과 동일한 정책이므로 전달 대상에서 제외된다. 

- 쿠키를 전달하지 않는다.
- Host 값은 origin-site.com:8080 이다.
- Referer 값은 http://cross-site.com:8080/ 이다.

```
GET / HTTP/1.1
...
Host: origin-site.com:8080
Referer: http://cross-site.com:8080/
...
```

## CLOSING

글의 내용을 다시 정리해보자. 

- GET 요청으로 서버의 상태를 변경하는 잘못된 API 개발이 아니라면 명시적인 Lax 옵션은 CSRF 공격을 상당히 어렵게 만든다. 
- 크롬의 디폴트 SameSite 옵션은 `Lax + Post`로 더 완화된 정책이기 때문에 명시적인 Lax 옵션보단 CSRF 공격에 더 취약하다.   

필자는 파이어폭스(firefox)를 보통 사용하는 데 크롬과 동일하게 동작한다. 파이어폭스는 크로미움(chromium)이 아닌 퀀텀(Quantum) 엔진을 사용하지만, 크롬과 유사한 정책을 적용한 듯하다. SameSite 속성의 Lax 정책은 크로스 사이트 간 쿠키 공유를 차단하기 때문에 확실히 CSRF 공격에 대한 방어에 도움이 된다. 다만 XSS 공격과 함께 SameSite 옵션을 우회하는 방법들이 있기 때문에 여전히 CSRF 공격으로부터 자유롭진 않은 것 같다. 여전히 전통적인 CSRF 공격 방어 수단인 CSRF 토큰 등이 필요한 것으로 보인다.

#### TEST CODE REPOSITORY

- <>

#### REFERENCE

- <https://www.chromium.org/updates/same-site/>
- <https://airman604.medium.com/do-samesite-cookies-solve-csrf-6dcd02dc9383>
- <https://www.youtube.com/watch?v=Q3YuKipzPbs&list=PLJpP1-KMU_TxtEK9YJgZAhewhtxLADOff&index=4>
- <https://datatracker.ietf.org/doc/html/draft-west-cookie-incrementalism-00>
- <https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-cookie-same-site-00>
- <https://groups.google.com/a/chromium.org/g/blink-dev/c/AknSSyQTGYs/m/lXBt8xyGAgAJ>
- <https://web.dev/articles/samesite-cookies-explained?hl=ko#explicitly-state-cookie-usage-with-the-samesite-attribute>
- <https://portswigger.net/web-security/csrf/bypassing-samesite-restrictions>

[cookie-attributes-link]: https://junhyunny.github.io/information/security/cookie-attributes/
[cross-site-reqeust-forgery-link]: https://junhyunny.github.io/information/security/spring-boot/spring-security/cross-site-reqeust-forgery/