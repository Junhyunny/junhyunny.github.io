---
title: "withCredentials Option in Axios"
search: false
category:
  - information
  - react
  - spring-boot
last_modified_at: 2023-05-12T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [CORS(Cross Origin Resource Sharing)][cors-link]
* [React 개발 서버 CORS 해결하기 with Proxy][react-proxy-link]
* [Cookie and Session][cookie-and-session-link]
* [Deep Dive into Cookie][cookie-attributes-link]

## 1. Background

쿠키(cookie)와 세션(session)을 통한 인증 프로세스를 사용하는 서비스의 구조를 다음과 같이 바꾸면서 문제가 발생했습니다. 

* nginx를 웹 서버이자 포워드 프록시(forward proxy)로 사용
    * 브라우저는 웹 서버와만 소통합니다.
    * 웹 화면은 웹 서버로부터 전달받습니다.
    * 데이터는 웹 서버를 통해 백엔드 서비스로부터 전달받습니다.
    * 브라우저는 백엔드 서비스의 존재를 모릅니다.

<p align="center">
    <img src="/images/with-credentials-in-axios-1.JPG" width="80%" class="image__border">
</p>

* nginx를 웹 서버로 사용
    * 브라우저는 웹 서버와 백엔드 서비스와 모두 소통합니다.
    * 웹 화면은 웹 서버로부터 전달받습니다.
    * 데이터는 백엔드 서비스로부터 직접 전달받습니다.
    * 원장 리소스(origin resource)가 웹 서버인 상태로 백엔드 서비스와 통신하면서 CORS(cross origin resource sharing) 정책 위반이 발생합니다.

<p align="center">
    <img src="/images/with-credentials-in-axios-2.JPG" width="80%" class="image__border">
</p>

## 2. Problem and Cause

다음과 같은 문제가 발생했습니다. 

* 세션 생성시 발급된 세션 아이디(session id)가 담긴 쿠키가 브라우저로 전달되지 않는다.
* axios를 사용한 API 요청시 쿠키가 백엔드 서비스로 전달되지 않는다.

다음과 같은 원인들이 겹치면서 문제가 발생했습니다.

1. nginx가 포워드 프록시로 사용되는 동안 클라이언트는 하나의 호스트를 통해서만 서비스 받습니다.
1. 하나의 호스트를 통해 서비스 받으므로 동일 사이트(same site) 조건을 만족합니다.
    * 쿠키는 동일 사이트의 경우 브라우저에 의해 자동적으로 전달됩니다.
1. nginx를 웹 서버로 사용하면서 브라우저가 백엔드 서비스와 직접 통신하게 됩니다.
    * 크로스 사이트(cross site) 문제가 발생합니다.
    * 브라우저에 의해 쿠키가 자동으로 전달되지 않습니다.
1. axios, XMLHttpRequest는 크로스 사이트로 요청 시 기본적으로 쿠키, 인증 헤더 혹은 TLS(Transport Layer Secure) 클라이언트 인증서와 같은 자격 증명을 사용하지 않습니다.
    * 백엔드 서비스에 별도 설정이 없는 경우 크로스 오리진(cross origin) 문제가 발생합니다.

## 3. withCredentials Property

> The XMLHttpRequest.withCredentials property is a boolean value that indicates whether or not cross-site Access-Control requests should be made using credentials such as cookies, authorization headers or TLS client certificates. Setting withCredentials has no effect on same-origin requests.

`withCredentials`는 XMLHttpRequest의 속성입니다. 
크로스 사이트로의 요청 시 쿠키, 인증 헤더 혹은 TLS 클라이언트 인증서 같은 자격 증명을 사용할지 여부를 결정합니다. 
기본 값은 false이므로 크로스 사이트로 요청 시 쿠키를 함께 전달하지 않습니다. 
개발자가 쉽게 사용할 수 있는 API를 제공하는 axios도 결국 내부적으론 XMLHttpRequest을 사용하기 때문에 `withCredentials` 관련 옵션을 지정할 수 있습니다. 

## 4. Practice

간단한 시나리오를 통해 관련 설정에 대해 알아보겠습니다. 
컨테이너 없이 로컬 호스트에서 개발 서버를 띄운 방식으로 실습을 진행합니다.

* 서버는 세션을 통해 사용자의 상태를 유지합니다.
    * 세션에 foo라는 문자열을 저장하고 매 요청마다 foo를 저장된 값 뒤에 추가합니다.
* 클라이언트는 axios를 사용해 서버로 직접 요청을 수행합니다. 
    * `withCredentials`를 true로 지정하면 쿠키를 통해 사용자 세션을 찾아 이를 재활용합니다. 
    * `withCredentials`를 별도로 설정하지 않으면 쿠키를 함께 전달하지 않으므로 매번 새로운 새션을 생성합니다.

### 4.1. Frontend Service

프론트엔드는 로컬 호스트(localhost) 3000 포트에서 서비스합니다.

#### 4.1.1. App.tsx

* `withCredentials` 버튼
    * `withCredentials` 설정을 true로 지정합니다.
    * 백엔드 서비스로 직접 요청을 보냅니다.
* `withoutCredentials` 버튼
    * `withCredentials` 설정이 없으므로 기본 값인 false가 적용됩니다.
    * 백엔드 서비스로 직접 요청을 보냅니다.

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

백엔드는 로컬 호스트 8080 포트에서 서비스합니다.

#### 4.2.1. FooController Class

* 요청 객체에서 세션 객체를 획득합니다.
    * 쿠키에 세션 ID가 있는 경우 이전에 생성한 세션을 획득합니다.
    * 쿠키에 세션 ID가 없다면 신규 세션을 생성합니다.
* 세션에 저장된 값이 없다면 기본 값을 세션에 저장하고 반환합니다.
* 세션에 저장된 값이 있다면 이에 기본 값을 더해 저장하고 반환합니다.

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

#### 4.2.2. WebConfig Class

백엔드 서비스도 자격 증명과 관련된 설정이 필요합니다.
`WebMvcConfigurer` 인터페이스 구현을 통해 자격증명(credential) 관련 설정을 추가합니다. 

* 다음과 같은 경우에 CORS 정책을 허용합니다.
    * 모든 경로
    * 오리진(origin) 서버가 `localhost:3000`인 경우
    * GET 메소드
* `allowCredentials` 메소드를 통해 자격증명을 허용합니다.
    * 해당 설정이 true인 경우 응답 헤더에 `Access-Control-Allow-Credentials` 값이 실려 브라우저에게 전달됩니다. 
    * 해당 설정이 하지 않거나 false인 경우 
        * 자격 증명을 함께 전달한 요청은 브라우저에서 CORS 정책 위반 에러가 발생합니다.
        * 자격 증명을 함께 전달하지 않은 요청은 브라우저에서 정상 처리됩니다.

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

##### Result without allowing credential

* 백엔드 서비스에서 자격증명 허용을 하지 않은 경우입니다.
    * 브라우저에서 자격증명을 함께 전달하는 경우 CORS 정책 위반 에러가 발생합니다.
    * 브라우저에서 자격증명을 전달하지 않은 경우 정상 동작하지만, 쿠키가 생성되지 않습니다.

<p align="center">
    <img src="/images/with-credentials-in-axios-3.gif" width="100%" class="image__border">
</p>

##### Result with allowing credential

* 백엔드 서비스에서 자격증명을 허용한 경우입니다.
    * 브라우저에서 자격증명을 함께 전달하는 경우 정상 동작하고 세션 ID가 담긴 쿠키가 생성됩니다.
    * 브라우저에서 자격증명을 전달하지 않은 경우 정상 동작하지만, 쿠키가 생성되지 않습니다.

<p align="center">
    <img src="/images/with-credentials-in-axios-4.gif" width="100%" class="image__border">
</p>


## CLOSING

다음 코드를 통해 axios의`withCredentials` 설정을 전역으로 지정할 수 있습니다. 

```js
axios.defaults.withCredentials = true; 
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-05-12-with-credentials-in-axios>

#### REFERENCE

* <https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials>
* <https://stackoverflow.com/questions/52549079/does-axios-support-set-cookie-is-it-possible-to-authenticate-through-axios-http>
* [CORS 쿠키 전송하기 (withCredentials 옵션)](https://inpa.tistory.com/entry/AXIOS-%F0%9F%93%9A-CORS-%EC%BF%A0%ED%82%A4-%EC%A0%84%EC%86%A1withCredentials-%EC%98%B5%EC%85%98)

[cors-link]: https://junhyunny.github.io/information/cors/
[react-proxy-link]: https://junhyunny.github.io/information/react/react-proxy/
[cookie-and-session-link]: https://junhyunny.github.io/information/cookie-and-session/
[cookie-attributes-link]: https://junhyunny.github.io/information/security/cookie-attributes/
