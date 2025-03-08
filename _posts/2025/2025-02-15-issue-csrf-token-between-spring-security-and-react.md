---
title: "스프링 시큐리티 CSRF 토큰 리액트 애플리케션에서 발급 받기"
search: false
category:
  - react
  - spring-boot
  - spring-security
last_modified_at: 2025-02-15T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [CSRF(Cross-Site Request Forgery) 공격과 방어][cross-site-reqeust-forgery-link]

## 0. 들어가면서

스프링 애플리케이션에서 타임리프와 스프링 시큐리티를 사용하는 경우 쉽게 CSRF 토큰 발급이 가능하다. 이를 리액트 같은 싱글 페이지 애플리케이션(SPA, Single Page Application)에 발급 받으려면 서버 사이드 렌더링과 다른 방식으로 접근해야 한다. 이번 예제 코드를 이해하기 위해선 CSRF 공격과 방어에 대한 개념을 잘 이해하고 있어야 한다. CSRF 공격에 대해 잘 모른다면 [이 글][cross-site-reqeust-forgery-link]을 먼저 읽어보길 바란다.

스프링 시큐리티 공식 문서를 보면 [싱글 페이지 애플리케이션에 CSRF 토큰을 발급하는 방법](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html#csrf-integration-javascript-spa)이 정리되어 있지만, 나는 [모바일 애플리케이션에 인티그레이션 하는 방식](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html#csrf-integration-mobile)을 사용했다. 모바일 애플리케이션 방식이 코드 의미와 실행 흐름을 더 이해하기 쉬웠다. 

## 1. Spring Application

우선 백엔드 애플리케이션 구조를 살펴보자.

### 1.1. Structure

백엔드 애플리케이션 프로젝트 구조는 다음과 같다.

```
.
├── HELP.md
├── build.gradle
├── gradlew
├── gradlew.bat
├── settings.gradle
└── src
    └── main
        ├── java
        │   └── action
        │       └── in
        │           └── blog
        │               ├── ActionInBlogApplication.java
        │               ├── config
        │               │   └── SecurityConfig.java
        │               └── controller
        │                   ├── CsrfController.java
        │                   └── TodoController.java
        └── resources
            ├── application.properties
            ├── static
            └── templates
```

### 1.2. SecurityConfig class

시큐리티 필터 체인은 기본적으로 CSRF 공격에 대한 방어를 수행한다. 예제를 위해 모든 경로에 대한 접근을 허용한다.

```java
package action.in.blog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity httpSecurity
    ) throws Exception {
        httpSecurity.authorizeHttpRequests(
                config -> config.anyRequest().permitAll()
        );
        return httpSecurity.build();
    }
}
```

### 1.3. CsrfController class

CSRF 토큰을 발급받을 수 있는 엔드포인트를 구성한다. 엔드포인트 파라미터를 통해 획득한 CsrfToken 인스턴스를 그대로 반환한다. 엔드포인트에 주입되는 CsrfToken 인스턴스는 `CsrfTokenArgumentResolver` 객체에 의해 주입된다. CsrfToken 인스턴스는 세션에 저장된 값이 있으면 이를 사용하고 없는 경우 새로운 토큰을 생성한다.

```java
package action.in.blog.controller;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CsrfController {

    @GetMapping("/api/csrf")
    public CsrfToken csrfToken(CsrfToken token) {
        return token;
    }
}
```

### 1.3. TodoController class

테스트를 위해 간단한 엔드포인트를 만든다. 스프링 시큐리티는 GET, OPTIONS 같은 안전한 요청에 대해선 CSRF 방어를 수행하지 않는다. CSRF 토큰의 동작 여부를 확인하기 위해서 POST 요청 엔드포인트를 만든다.

```java
package action.in.blog.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

record Todo(
        String content
) {
}

@RestController
public class TodoController {

    @PostMapping("/api/todos")
    void createTodos(@RequestBody Todo todo) {
        System.out.println(todo);
    }
}
```

### 1.4. Validation CSRF token

cURL 커맨드를 통해 CSRF 토큰을 발급 받고 유효하게 동작하는지 살펴보자. Todo 엔드포인트에 요청을 보내면 403(forbidden) 에러로 실패한다.

```
$ curl -X POST -d '{"content": "Hello World"}'\
    -H 'Content-Type: application/json'\
    -v http://localhost:8080/api/todos

Note: Unnecessary use of -X or --request, POST is already inferred.
* Host localhost:8080 was resolved.
* IPv6: ::1
* IPv4: 127.0.0.1
*   Trying [::1]:8080...
* Connected to localhost (::1) port 8080
> POST /api/todos HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/8.7.1
> Accept: */*
> Content-Type: application/json
> Content-Length: 26
> 
* upload completely sent off: 26 bytes
< HTTP/1.1 403 
< Set-Cookie: JSESSIONID=D332761D15B854F39A0380AC3DFA6712; Path=/; HttpOnly
< X-Content-Type-Options: nosniff
< X-XSS-Protection: 0
< Cache-Control: no-cache, no-store, max-age=0, must-revalidate
< Pragma: no-cache
< Expires: 0
< X-Frame-Options: DENY
< Content-Type: application/json
< Transfer-Encoding: chunked
< Date: Sat, 15 Feb 2025 13:37:06 GMT
< 
* Connection #0 to host localhost left intact
{"timestamp":"2025-02-15T13:37:06.750+00:00","status":403,"error":"Forbidden","path":"/api/todos"}
```

이번엔 CSRF 토큰을 발급 받는다. 토큰 값과 토큰이 쿼리(query) 파라미터나 헤더에 포함될 때 매핑될 키(key) 값도 함께 받는다.

- 파라미터 키 - `_csrf`
- 헤더 키 - `X-CSRF-TOKEN`
- 토큰 - `7rK1Lrwiqnh2-qGr2gEe8NCwGArbgBTQnn02UOw_a8mvoYP_2YqHGosTmBpbycCZ4iwqlbTRNTPouS39qU0HaIpZXPqYmLWb`

```
$ curl -v http://localhost:8080/api/csrf

* Host localhost:8080 was resolved.
* IPv6: ::1
* IPv4: 127.0.0.1
*   Trying [::1]:8080...
* Connected to localhost (::1) port 8080
> GET /api/csrf HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/8.7.1
> Accept: */*
> 
* Request completely sent off
< HTTP/1.1 200 
< Set-Cookie: JSESSIONID=A2812161953A941A1AD77BF4FE716D89; Path=/; HttpOnly
< X-Content-Type-Options: nosniff
< X-XSS-Protection: 0
< Cache-Control: no-cache, no-store, max-age=0, must-revalidate
< Pragma: no-cache
< Expires: 0
< X-Frame-Options: DENY
< Content-Type: application/json
< Transfer-Encoding: chunked
< Date: Sat, 15 Feb 2025 13:38:28 GMT
< 
* Connection #0 to host localhost left intact
{"parameterName":"_csrf","token":"7rK1Lrwiqnh2-qGr2gEe8NCwGArbgBTQnn02UOw_a8mvoYP_2YqHGosTmBpbycCZ4iwqlbTRNTPouS39qU0HaIpZXPqYmLWb","headerName":"X-CSRF-TOKEN"}
```

이제 CSRF 토큰과 함께 요청을 보내보자. 주의할 점은 스프링 시큐리티는 기본적으로 원본 CSRF 토큰 값을 세션에 저장하고 있기 때문에 쿠키에 세션 아이디를 함께 전달해야 한다. 세션 아이디는 CSRF 토큰을 발급 받을 때 응답 헤더를 통해 함께 받는다. 요청을 보내면 200(ok) 응답을 받는다.

```
$ curl -X POST -d '{"content": "Hello World"}'\
    -H 'Content-Type: application/json'\
    -H 'Cookie: JSESSIONID=A2812161953A941A1AD77BF4FE716D89; Path=/; HttpOnly'\
    -H 'X-CSRF-TOKEN: 7rK1Lrwiqnh2-qGr2gEe8NCwGArbgBTQnn02UOw_a8mvoYP_2YqHGosTmBpbycCZ4iwqlbTRNTPouS39qU0HaIpZXPqYmLWb'\
    -v http://localhost:8080/api/todos

Note: Unnecessary use of -X or --request, POST is already inferred.
* Host localhost:8080 was resolved.
* IPv6: ::1
* IPv4: 127.0.0.1
*   Trying [::1]:8080...
* Connected to localhost (::1) port 8080
> POST /api/todos HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/8.7.1
> Accept: */*
> Content-Type: application/json
> Cookie: JSESSIONID=A2812161953A941A1AD77BF4FE716D89; Path=/; HttpOnly
> X-CSRF-TOKEN: 7rK1Lrwiqnh2-qGr2gEe8NCwGArbgBTQnn02UOw_a8mvoYP_2YqHGosTmBpbycCZ4iwqlbTRNTPouS39qU0HaIpZXPqYmLWb
> Content-Length: 26
> 
* upload completely sent off: 26 bytes
< HTTP/1.1 200 
< X-Content-Type-Options: nosniff
< X-XSS-Protection: 0
< Cache-Control: no-cache, no-store, max-age=0, must-revalidate
< Pragma: no-cache
< Expires: 0
< X-Frame-Options: DENY
< Content-Length: 0
< Date: Sat, 15 Feb 2025 13:43:36 GMT
< 
* Connection #0 to host localhost left intact
```

## 2. React application

스프링 애플리케이션 코드와 cURL 커맨드를 통해 정상적으로 CSRF 공격과 방어가 이뤄지는지 살펴봤다. 이번엔 리액트 애플리케이션 코드를 살펴보자. 

### 2.1. vite config 

우선 스프링 애플리케이션과 리액트 애플리케이션을 연결하기 위해선 프록시(proxy) 설정이 필요하다. 로컬 환경에서 프론트엔드 개발 서버와 백엔드 서버를 연결할 때 왜 프록시가 필요한지 궁긍하다면 [CORS(Cross Origin Resource Sharing) 개념](https://junhyunny.github.io/information/cors/)과 [React 프록시 설정](https://junhyunny.github.io/information/react/react-proxy/)을 참조하길 바란다. 

1. `/api` 접두어로 시작하는 경로의 요청은 `http://localhost:8080` 애플리케이션으로 전달한다.

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8080", // 1
    },
  },
});
```

### 2.2. App component

App 컴포넌트 코드는 아래와 같이 작성한다.

1. 화면이 렌더링 되는 시점에 CSRF 토큰을 요청한다.
2. 획득한 토큰을 `axios` 모듈의 기본 헤더로 추가한다. 헤더 이름과 값은 CSRF 토큰 응답에 모두 포함되어 있다.
3. 화면에서 텍스트 박스에 값을 입력 후 버튼을 누르면 정상적으로 Todo 생성 요청이 처리된다.

```tsx
import { useCallback, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const inputRef = useRef<HTMLInputElement>(null);

  const retrieveCsrfToken = useCallback(() => {
    axios.get("/api/csrf").then(({ data }) => {
      axios.defaults.headers[data.headerName] = data.token;
    });
  }, []);

  const createTodo = useCallback(() => {
    const inputElement = inputRef.current;
    if (inputElement) {
      axios // 3
        .post("/api/todos", {
          content: inputElement.value,
        })
        .then(() => alert("submitted"));
      inputElement.value = "";
    }
  }, []);

  useEffect(() => {
    retrieveCsrfToken(); // 1
  }, [retrieveCsrfToken]);

  return (
    <div>
      <input type="text" ref={inputRef} />
      <button onClick={createTodo}>submit</button>
    </div>
  );
}

export default App;
```

### 2.3. Submit todo content on the browser

리액트 개발 서버를 실행한다.

```
$ npm run dev

> frontend@0.0.0 dev
> vite


  VITE v6.1.0  ready in 73 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

브라우저 화면에서 Todo 아이템을 생성하면 정상적으로 처리되는 것을 확인할 수 있다. 

<div align="center">
  <img src="/images/posts/2025/issue-csrf-token-between-spring-security-and-react-01.png" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-02-15-issue-csrf-token-between-spring-security-and-react/action-in-blog>

#### REFERENCE

- <https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html#csrf-integration-javascript-spa>
- <https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html#csrf-integration-mobile>

[cross-site-reqeust-forgery-link]: https://junhyunny.github.io/information/security/spring-boot/spring-security/cross-site-reqeust-forgery/