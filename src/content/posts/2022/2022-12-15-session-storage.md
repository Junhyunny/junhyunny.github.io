---
title: "브라우저 세션 스토리지(session storage)"
publishedAt: "2022-12-15"
updatedAt: "2026-11-12T16:19:56+09:00"
canonicalPath: "/information/session-storage/"
categories:
  - "information"
summary: "브라우저 세션 스토리지의 특징과 주요 메서드를 살펴보고, 출처별 데이터 관리, 새 탭 사이의 공유 여부, 브라우저 재실행 시 데이터 유지 여부를 실습으로 확인했다."
recommendedPosts:
  - title: "CORS(Cross Origin Resource Sharing)"
    href: "https://junhyunny.github.io/information/cors/"
  - title: "브라우저 로컬 스토리지(local storage)"
    href: "https://junhyunny.github.io/information/local-storage/"
---

## 1. SessionStorage

`sessionStorage` 객체는 웹 스토리지(web storage) 중 하나다. `sessionStorage` 객체를 사용하면 브라우저 안에 키-값(key-value) 데이터 쌍을 저장할 수 있다. `localStorage`와 같은 기능을 제공하지만, 몇 가지 다른 특성 때문에 자주 사용되지 않는다. 이번 글에선 `sessionStorage`의 특성을 살펴보고 간단한 실습으로 확인했다.

## 2. Characteristics of SessionStorage

`sessionStorage` 객체는 다음과 같은 특징을 가진다.

- `sessionStorage`에 저장한 데이터는 브라우저가 서버로 보내는 요청에 자동으로 포함되지 않는다.
- 대부분의 브라우저는 도메인별로 최소 2MB, 최대 5MB 정도의 데이터를 저장할 수 있다.
- 데이터를 문자열(string) 형식으로 저장한다.
- 서버는 HTTP 응답 헤더를 통해 `sessionStorage`에 저장된 데이터를 제어할 수 없다.
- `sessionStorage` 데이터는 동일 출처(origin)에 따라 관리된다.
  - 도메인, 프로토콜, 포트로 동일 출처 여부를 결정한다.
  - 서브 도메인, 프로토콜, 포트 등이 다른 경우 `sessionStorage`에 저장된 데이터에 접근할 수 없다.

`sessionStorage`는 다음과 같은 특징이 `localStorage`와 다르다.

- `sessionStorage`에 저장한 데이터는 브라우저 탭(tab) 사이에 공유할 수 없다.
- `sessionStorage`에 저장한 데이터는 브라우저를 다시 실행하면 사라진다.

## 3. Main Methods of SessionStorage

`sessionStorage` 객체는 다음과 같은 기능을 제공한다.

- setItem(key, value) – 키-값 쌍을 보관한다.
- getItem(key) – 키에 해당하는 값을 받아온다.
- removeItem(key) – 키와 해당 값을 삭제한다.
- clear() – 모든 것을 삭제한다.
- key(index) – 인덱스(index)에 해당하는 키를 받아온다.
- length – 저장된 항목의 개수를 얻는다.

## 4. Practices

`sessionStorage` 객체의 특징을 이해하기 위해 몇 가지 실습을 진행했다. 브라우저 개발자 도구의 콘솔(console) 창에서 테스트할 수 있다.

먼저 문자열 저장 방식을 확인한다. `sessionStorage` 객체는 데이터를 문자열 형식으로 저장한다. 숫자, 객체는 문자열로 변환되어 저장되므로 주의해야 한다. 일반 문자열, 일반 객체, JSON 객체를 저장하고 다시 읽어 보자.

```javascript
sessionStorage.setItem("Hello", "World")
sessionStorage.getItem("Hello") // "World"

sessionStorage.setItem("Hello", {a: 'Hello', b: 'World'})
sessionStorage.getItem("Hello") // "[object Object]"

sessionStorage.setItem("Hello", JSON.stringify({a: 'Hello', b: 'World'}))
sessionStorage.getItem("Hello") // "{\"a\":\"Hello\",\"b\":\"World\"}"
JSON.parse(sessionStorage.getItem("Hello")) // Object { a: "Hello", b: "World" }
```

다음으로 `sessionStorage` 데이터가 동일 출처(origin) 단위로 관리되는지, 즉 출처가 다르면 저장된 데이터를 볼 수 없는지 확인한다. 확인 순서는 다음과 같다.

1. `https://junhyunny.github.io/` 경로에 데이터를 저장한다.
2. 같은 탭에서 `https://github.com` 사이트에 접속해 저장된 데이터를 확인한다.
3. 같은 탭에서 `https://junhyunny.github.io/` 사이트에 다시 접속해 저장된 데이터를 확인한다.

동일 출처를 가진 사이트에서만 데이터를 찾을 수 있다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/session-storage-01.gif" width="100%" class="image__border">
</div>

새로운 브라우저 탭 사이에 데이터가 공유되는지 확인한다. 새로운 탭을 열고 같은 출처 사이트에 접속하면 다른 탭에서 저장한 데이터가 없다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/session-storage-02.gif" width="100%" class="image__border">
</div>

마지막으로 브라우저를 다시 열었을 때 같은 출처 사이트에 저장한 데이터가 남아 있는지 확인한다. 이전에 저장한 데이터가 없다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/session-storage-03.gif" width="100%" class="image__border">
</div>

#### REFERENCE

- <https://ko.javascript.info/localstorage>
- <https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage>
- <https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API>
- <https://www.gwtproject.org/doc/latest/DevGuideHtml5Storage.html>
