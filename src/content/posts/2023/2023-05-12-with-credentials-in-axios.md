---
title: "Axios withCredentials 옵션"
publishedAt: "2023-05-12"
updatedAt: "2026-11-12T16:19:33+09:00"
canonicalPath: "/information/react/spring-boot/with-credentials-in-axios/"
categories:
  - "information"
  - "react"
  - "spring-boot"
summary: "브라우저가 백엔드 서비스와 직접 통신하도록 구조를 바꾼 뒤 세션 쿠키가 전달되지 않는 문제의 원인을 살펴보고, axios의 withCredentials 옵션과 CORS 설정으로 해결했다."
recommendedPosts:
  - title: "CORS(Cross Origin Resource Sharing)"
    href: "https://junhyunny.github.io/information/cors/"
  - title: "React 개발 서버 CORS 문제 해결"
    href: "https://junhyunny.github.io/information/react/react-proxy/"
  - title: "쿠키(Cookie)와 세션(Session)"
    href: "https://junhyunny.github.io/information/cookie-and-session/"
  - title: "쿠키(Cookie) 심층 분석"
    href: "https://junhyunny.github.io/information/security/cookie-attributes/"
---

## 1. Background

쿠키(cookie)와 세션(session)으로 인증하는 서비스의 구조를 다음과 같이 바꾸면서 문제가 발생했다.

서비스 구조를 바꾸기 전에는 nginx를 웹 서버이자 포워드 프록시(forward proxy)로 사용했다. 브라우저는 웹 서버와만 소통한다. 웹 화면은 웹 서버로부터 전달받고, 데이터는 웹 서버를 통해 백엔드 서비스로부터 전달받는다. 브라우저는 백엔드 서비스의 존재를 모른다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/with-credentials-in-axios-01.png" width="100%" class="image__border">
</div>

서비스 구조를 바꾼 뒤에는 nginx를 웹 서버로만 사용한다. 브라우저는 웹 서버, 백엔드 서비스와 모두 소통한다. 웹 화면은 웹 서버로부터 전달받고, 데이터는 백엔드 서비스로부터 직접 전달받는다. 원장 리소스(origin resource)가 웹 서버인 상태로 백엔드 서비스와 통신하기 때문에 CORS(cross origin resource sharing) 정책 위반이 발생한다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/with-credentials-in-axios-02.png" width="100%" class="image__border">
</div>

## 2. Problem and Cause

다음과 같은 문제가 발생했다.

- 세션을 생성할 때 발급된 세션 아이디(session id)가 담긴 쿠키가 브라우저로 전달되지 않는다.
- axios로 API를 요청할 때 쿠키가 백엔드 서비스로 전달되지 않는다.

다음과 같은 원인들이 겹치면서 문제가 발생했다.

1. nginx를 포워드 프록시로 사용하는 동안 클라이언트는 하나의 호스트를 통해서만 서비스를 받는다.
1. 하나의 호스트를 통해 서비스를 받으므로 동일 사이트(same site) 조건을 항상 만족한다.
  - 동일 사이트라면 브라우저가 쿠키를 자동으로 전달한다.
1. nginx를 웹 서버로만 사용하면서 브라우저가 백엔드 서비스와 직접 통신하게 된다.
  - 크로스 사이트(cross site) 문제가 발생한다.
  - 브라우저가 쿠키를 자동으로 전달하지 않는다.
1. axios는 크로스 사이트 요청 시 기본적으로 쿠키, 인증 헤더 혹은 TLS(Transport Layer Security) 인증서 같은 자격 증명(credential)을 사용하지 않는다.
  - 백엔드 서비스에 별도 설정이 없으면 크로스 오리진(cross origin) 문제가 발생한다.

## 3. withCredentials 프로퍼티

> The XMLHttpRequest.withCredentials property is a boolean value that indicates whether or not cross-site Access-Control requests should be made using credentials such as cookies, authorization headers or TLS client certificates. Setting withCredentials has no effect on same-origin requests.

`withCredentials`는 XMLHttpRequest 객체의 속성이다. 이 속성으로 크로스 사이트 요청에 쿠키, 인증 헤더 혹은 TLS 클라이언트 인증서 같은 자격 증명을 사용할지 결정한다. 기본값은 `false`이므로 크로스 사이트로 요청할 때 쿠키를 함께 전달하지 않는다. 사용하기 쉬운 API를 제공하는 axios도 내부적으론 XMLHttpRequest 객체를 사용하기 때문에 옵션으로 `withCredentials`를 지정할 수 있다.

## 4. Practice

간단한 시나리오로 관련 설정을 알아보자. 컨테이너 없이 로컬 호스트에서 개발 서버를 띄우는 방식으로 실습한다. 프론트엔드 서비스는 React, 백엔드 서비스는 Spring Boot를 사용했다. 시나리오는 다음과 같다.

- 서버는 세션으로 사용자의 상태를 유지한다. 세션에 `foo` 문자열을 저장하고, 요청마다 저장된 값 뒤에 `-foo` 문자열을 추가한다.
- 클라이언트는 axios를 사용해 서버로 직접 요청한다.
  - `withCredentials`를 true로 지정하면 쿠키로 사용자 세션을 찾아 재활용한다.
  - `withCredentials`를 따로 설정하지 않으면 쿠키를 함께 전달하지 않으므로 매번 새로운 세션을 생성한다.

### 4.1. Frontend Service

프론트엔드는 로컬 호스트(localhost) 3000 포트에서 서비스한다. App 컴포넌트에는 백엔드 서비스로 직접 요청을 보내는 두 버튼이 있다. `withCredentials` 버튼은 `withCredentials` 설정을 true로 지정한다. `withoutCredentials` 버튼은 `withCredentials` 설정이 없으므로 기본값인 false가 적용된다.

```tsx
import React, { useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState<string>("");

  const successHandler = ({ data }: { data: any }) => {
    setMessage(data);
    return data;
  };

  const errorHandler = ({ message }: { message: string }) => {
    setMessage(message);
  };

  const withCredentialsHandler = () => {
    axios
      .get("http://localhost:8080/foo", { withCredentials: true })
      .then(successHandler)
      .catch(errorHandler);
  };

  const withoutCredentialsHandler = () => {
    axios
      .get("http://localhost:8080/foo")
      .then(successHandler)
      .catch(errorHandler);
  };

  return (
    <div>
      <div>
        <button onClick={withCredentialsHandler}>withCredentials</button>
        <button onClick={withoutCredentialsHandler}>withoutCredentials</button>
      </div>
      <p>{message}</p>
    </div>
  );
}

export default App;
```

### 4.2. Backend Service

백엔드는 로컬 호스트 8080 포트에서 서비스한다.

FooController 클래스는 요청 객체에서 세션 객체를 획득한다. 쿠키에 세션 ID가 있으면 이전에 생성한 세션을, 없으면 새로 생성한 세션을 얻는다. 세션에 저장된 값이 없다면 기본값을 세션에 저장하고 반환하고, 저장된 값이 있다면 `-foo` 문자열을 더해 저장한 뒤 이를 반환한다.

```java
package action.in.blog.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FooController {

    private static final String key = "foo";

    @GetMapping("/foo")
    public String foo(HttpServletRequest request) {
        String defaultValue = "foo";

        HttpSession session = request.getSession();
        String fooInSession = (String) session.getAttribute(key);
        if (fooInSession == null) {
            session.setAttribute(key, defaultValue);
            return defaultValue;
        }

        String result = fooInSession.concat("-").concat(defaultValue);
        session.setAttribute(key, result);
        return result;
    }
}
```

백엔드 서비스도 자격 증명 관련 설정이 필요하다. WebConfig 클래스에서 `WebMvcConfigurer` 인터페이스를 구현해 관련 설정을 추가한다. 모든 경로에서 오리진(origin) 서버가 `localhost:3000`인 GET 요청은 CORS 정책을 허용하고, `allowCredentials` 메서드로 자격 증명을 허용한다.

이 설정이 true이면 응답 헤더에 `Access-Control-Allow-Credentials` 값이 실려 브라우저에 전달된다. 이 설정을 하지 않거나 false이면 자격 증명을 함께 전달한 요청은 브라우저에서 CORS 정책 위반 에러가 발생하고, 자격 증명을 전달하지 않은 요청은 정상 처리된다.

```java
package action.in.blog.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("http://localhost:3000")
                .allowedMethods("GET")
                .allowCredentials(false)
        ;
    }
}
```

백엔드 서비스에서 자격 증명을 허용하지 않은 경우의 결과를 살펴보자. 브라우저가 자격 증명을 함께 전달하면 CORS 정책 위반 에러가 발생한다. 자격 증명을 전달하지 않으면 정상 동작하지만, 쿠키가 생성되지 않는다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/with-credentials-in-axios-03.gif" width="100%" class="image__border">
</div>

백엔드 서비스에서 자격 증명을 허용하면 브라우저가 자격 증명을 함께 전달할 때 정상 동작하고 세션 ID가 담긴 쿠키가 생성된다. 자격 증명을 전달하지 않으면 정상 동작하지만, 쿠키가 생성되지 않는다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/with-credentials-in-axios-04.gif" width="100%" class="image__border">
</div>

## CLOSING

다음 코드로 axios의 `withCredentials` 설정을 전역으로 지정할 수 있다.

```js
axios.defaults.withCredentials = true;
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-05-12-with-credentials-in-axios>

#### REFERENCE

- <https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials>
- <https://stackoverflow.com/questions/52549079/does-axios-support-set-cookie-is-it-possible-to-authenticate-through-axios-http>
- [CORS 쿠키 전송하기 (withCredentials 옵션)](https://inpa.tistory.com/entry/AXIOS-%F0%9F%93%9A-CORS-%EC%BF%A0%ED%82%A4-%EC%A0%84%EC%86%A1withCredentials-%EC%98%B5%EC%85%98)
