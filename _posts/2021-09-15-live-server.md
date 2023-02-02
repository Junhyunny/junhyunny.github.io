---
title: "간편 웹 서버 구축하기 (feat. live-server)"
search: false
category:
  - information
last_modified_at: 2021-09-15T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Webpack][webpack-link]
- [CORS(Cross Origin Resource Sharing)][cors-link] 

## 1. 브라우저 페이지 렌더링 문제
[Webpack][webpack-link] 포스트를 작성하면서 간단한 테스트 코드를 구현하는 중에 다음과 같은 에러를 만났습니다. 

> Access to script at 'file:///C:/Users/kang3/.../hello.js' from origin 'null' has been blocked by CORS policy: 
> Cross origin requests are only supported for protocol schemes: http, data, chrome, chrome-extension, chrome-untrusted, https.

흔하게 만나는 CORS(Cross Orgin Resource Sharing) 에러이지만 굉장히 의아했습니다. 
브라우저로 실행시킨 `index.html` 파일은 로컬 PC 특정 폴더에 위치하였고, 모듈(module)로써 추가(import)한 `hello.js` 파일은 같은 디렉토리에 존재하였습니다. 
로컬에 위치한 HTML 파일을 브라우저로 실행시켰는데 동일 디렉토리에 위치한 JavaScript 파일을 읽어오는데 CORS 에러가 발생한다니 이해가 안 됬습니다. 

일단 의심스러운 부분은 있었습니다. 
스크립트(script) 태그를 이용해 단순하게 정적 자원으로 사용한 것이 아니라 `type="module"` 키워드를 통해 모듈을 사용했다는 점입니다. 
해당 에러를 해결할 수 있는 방법을 찾아보았습니다. 

## 2. 문제 원인

> StackOverflow<br/>
> Unlike regular scripts, ES6 modules are subject to same-origin policy. 
> This means that you cannot import them from the file system or cross-origin without a CORS header (which cannot be set for local files).<br/>
> <br/>
> Basically you need to run this code from a (local) server or disable same-origin in the browser for testing (do not do this permanently). 
> See: Access to Image from origin 'null' has been blocked by CORS policy.

`StackOverflow`에서 관련된 내용을 찾았습니다. 
일반적인 스크립트와 다르게 ES6 모듈들은 Same Origin 정책을 따르기 때문에, 파일 시스템이나 크로스 오리진(Cross Orign)이 허용되지 않은 모듈은 사용하지 못한다고 합니다. 
이는 테스트를 위해서 웹 서버가 필요하다는 의미인데, 단순한 JavaScript 모듈 테스트를 위해 Spring 프로젝트를 만들고 싶지는 않았습니다. 
이를 손쉽게 테스트할 수 있는 방법을 찾아보았습니다. 

## 3. 문제 해결, live-server 명령어

### 3.1. live-server 설치
`npm` 명령어를 통해 설치가 가능합니다. 
아래와 같이 명령어를 실행하면 `live-server`가 설치됩니다. 

##### 설치 명령어
- 로컬 PC 전역에서 사용할 것이므로 -g 옵션을 사용합니다.

```
$ npm install -g live-server
```

##### 설치 실행 로그

```
npm WARN deprecated chokidar@2.1.8: Chokidar 2 will break on node v14+. Upgrade to chokidar 3 with 15x less dependencies.
npm WARN deprecated opn@6.0.0: The package has been renamed to `open`
npm WARN deprecated fsevents@1.2.13: fsevents 1 will break on node v14+ and could be using insecure binaries. Upgrade to fsevents 2.
npm WARN deprecated urix@0.1.0: Please see https://github.com/lydell/urix#deprecated
npm WARN deprecated resolve-url@0.2.1: https://github.com/lydell/resolve-url#deprecated
C:\Users\kang3\AppData\Roaming\npm\live-server -> C:\Users\kang3\AppData\Roaming\npm\node_modules\live-server\live-server.js
npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@^1.2.7 (node_modules\live-server\node_modules\chokidar\node_modules\fsevents):
npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@1.2.13: wanted {"os":"darwin","arch":"any"} (current: {"os":"win32","arch":"x64"})

+ live-server@1.2.1
added 194 packages from 149 contributors in 15.354s
```

### 3.2. live-server  실행
설치가 완료되면 해당 HTML 파일이 위치한 폴더로 이동합니다.
다시 말해 프로젝트의 root 디렉토리로 이동하면 됩니다. 
보통 `index.html` 파일이 위치한 폴더입니다.

```
$ cd <directory>
```

##### 실행 명령어

```
$ live-server
```

##### 실행 로그

```
$ live-server
Serving "D:\workspace\blog\blog-in-action\2021-09-14-webpack\use_module" at http://127.0.0.1:8080
Ready for changes
GET /favicon.ico 404 1.704 ms - 150
```

##### 실행 결과

<p align="left"><img src="/images/live-server-1.JPG"></p>

#### REFERENCE
- <https://taehyos.blogspot.com/2018/11/live-server.html>
- <https://stackoverflow.com/questions/52919331/access-to-script-at-from-origin-null-has-been-blocked-by-cors-policy>
- <https://stackoverflow.com/questions/46992463/es6-module-support-in-chrome-62-chrome-canary-64-does-not-work-locally-cors-er?rq=1>

[webpack-link]: https://junhyunny.github.io/information/webpack/
[cors-link]: https://junhyunny.github.io/information/cors/