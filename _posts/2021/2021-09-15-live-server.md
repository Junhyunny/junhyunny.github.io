---
title: "live-server 명령어 간단 웹 서버 실행"
search: false
category:
  - information
last_modified_at: 2026-06-03T00:25:30+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [웹팩 (Webpack)][webpack-link]
- [CORS(Cross Origin Resource Sharing)][cors-link]

## 1. 브라우저 페이지 렌더링 문제

[웹팩 (Webpack) 글][webpack-link]을 작성하면서 간단한 테스트 코드를 구현하는 중에 다음과 같은 에러를 만났다.

> Access to script at 'file:///C:/Users/kang3/.../hello.js' from origin 'null' has been blocked by CORS policy:
> Cross origin requests are only supported for protocol schemes: http, data, chrome, chrome-extension, chrome-untrusted, https.

흔하게 만나는 CORS(Cross Origin Resource Sharing) 에러지만 의아한 부분이 있었다. 브라우저로 실행한 `index.html` 파일은 로컬 PC 특정 폴더에 위치하고, 모듈(module)로서 추가(import)한 `hello.js` 파일은 같은 디렉토리에 존재했다. 로컬에 위치한 HTML 파일을 브라우저로 실행했는데 동일 디렉토리에 위치한 자바스크립트(JavaScript) 파일을 읽어오는 데 CORS 에러가 발생한다니 이해가 안 됐다. 의심스러운 부분은 스크립트(script) 태그를 이용해 단순하게 정적 자원으로 사용한 것이 아니라 `type="module"` 키워드를 통해 모듈을 사용했다는 점이다. 해당 에러를 해결할 수 있는 방법을 찾아보았다.

## 2. 문제 원인

`StackOverflow`에서 관련된 내용을 찾았다. 

> StackOverflow<br/>
> Unlike regular scripts, ES6 modules are subject to same-origin policy. This means that you cannot import them from the file system or cross-origin without a CORS header (which cannot be set for local files).<br/>
> <br/>
> Basically you need to run this code from a (local) server or disable same-origin in the browser for testing (do not do this permanently). See: Access to Image from origin 'null' has been blocked by CORS policy.

일반적인 스크립트와 다르게 ES6 모듈들은 동일 출처 정책(same origin policy)을 따르기 때문에, 파일 시스템이나 교차 출처(cross origin)가 허용되지 않은 모듈은 사용하지 못한다고 한다. 이는 테스트를 위해서 웹 서버가 필요하다는 의미인데, 단순한 자바스크립트 모듈 테스트를 위해 서버 애플리케이션을 만들고 싶지는 않았다. 이를 손쉽게 테스트할 수 있는 방법을 찾아보았다.

## 3. live-server 명령어

`npm` 명령어를 통해 설치가 가능하다. 아래와 같이 명령어를 실행하면 `live-server`가 설치된다.

- 로컬 PC 전역에서 사용할 것이므로 -g 옵션을 사용한다.

```
$ npm install -g live-server
```

설치가 완료되면 해당 HTML 파일이 위치한 폴더(프로젝트의 root 디렉토리)로 이동한다. 이 글에선 `index.html` 파일이 위치한 폴더다.

```
$ cd <directory>
```

아래 명령어를 통해 서버를 실행한다.

```
$ live-server
```

정상적으로 실행되었다면 접속 시 아래와 같은 로그를 볼 수 있다.

```
Serving "D:\workspace\blog\blog-in-action\2021-09-14-webpack\use_module" at http://127.0.0.1:8080
Ready for changes
GET /favicon.ico 404 1.704 ms - 150
```

정상적으로 모듈이 로딩된다.

<div align="left">
  <img src="{{ site.image_url_2021 }}/live-server-01.png" class="image__border">
</div>

#### REFERENCE

- <https://taehyos.blogspot.com/2018/11/live-server.html>
- <https://stackoverflow.com/questions/52919331/access-to-script-at-from-origin-null-has-been-blocked-by-cors-policy>
- <https://stackoverflow.com/questions/46992463/es6-module-support-in-chrome-62-chrome-canary-64-does-not-work-locally-cors-er?rq=1>

[webpack-link]: https://junhyunny.github.io/information/webpack/
[cors-link]: https://junhyunny.github.io/information/cors/
