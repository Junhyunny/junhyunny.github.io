---
title: "브라우저 로컬 스토리지(local storage)"
search: false
category:
  - information
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [CORS(Cross Origin Resource Sharing)][cors-link]

## 1. LocalStorage

`localStorage` 객체는 웹 스토리지(web storage) 중 하나다. `localStorage` 객체를 통해 브라우저 내에 키-값(key-value) 데이터 쌍을 저장할 수 있다.

## 2. Characteristics of LocalStorage

`localStorage` 객체는 다음과 같은 특징을 가진다.

- `localStorage`에 저장한 데이터는 브라우저에 의해 자동으로 서버에게 요청되지 않는다.
- `localStorage`에 저장한 데이터는 브라우저를 다시 실행해도 사라지지 않는다.
- 대부분의 브라우저들은 도메인 별로 최소 2MB, 최대 5BM 정도의 데이터를 저장할 수 있다.
- 데이터를 문자열(string) 형식으로 저장한다.
- 브라우저 탭(tab) 간의 데이터를 공유할 수 있다.
- 서버는 HTTP 응답 헤더를 통해 `localStorage`에 저장된 데이터를 제어할 수 없다.
- `localStorage` 데이터는 동일 출처(origin)에 따라 관리된다.
  - 도메인, 프로토콜, 포트를 통해 동일 출처 여부를 결정한다.
  - 서브 도메인, 프로토콜, 포트 등이 다른 경우 `localStorage`에 저장된 데이터에 접근할 수 없다.

## 3. Main Methods of LocalStorage

다음과 같은 기능을 가진다.

- setItem(key, value) – 키-값 쌍을 보관한다.
- getItem(key) – 키에 해당하는 값을 받아온다.
- removeItem(key) – 키와 해당 값을 삭제한다.
- clear() – 모든 것을 삭제한다.
- key(index) – 인덱스(index)에 해당하는 키를 받아온다.
- length – 저장된 항목의 개수를 얻는다.

## 4. Practices

`localStorage` 객체의 특징을 이해하기 위해 몇 가지 실습을 진행하였다. 브라우저 개발자 도구의 콘솔(console) 창에서 테스트가 가능하다.

##### 문자열 저장

- `localStorage` 객체는 데이터를 문자열 형식으로 저장한다.
- 숫자, 객체는 문자열로 변경되어 저장되므로 주의해야 한다.
- 다음과 같은 데이터를 저장하고 다시 읽어본다.
  - 일반적인 문자열
  - 일반 객체
  - JSON 객체

```javascript
localStorage.setItem("Hello", "World")
localStorage.getItem("Hello") // "World"

localStorage.setItem("Hello", {a: 'Hello', b: 'World'})
localStorage.getItem("Hello") // "[object Object]"

localStorage.setItem("Hello", JSON.stringify({a: 'Hello', b: 'World'}))
localStorage.getItem("Hello") // "{\"a\":\"Hello\",\"b\":\"World\"}"
JSON.parse(localStorage.getItem("Hello")) // Object { a: "Hello", b: "World" }
```

##### 동일 출처(origin) 및 신규 브라우저 탭 데이터 공유 여부

- 출처가 다른 경우 `localStorage`에 저장된 데이터를 볼 수 있는지 확인한다.
  - `https://junhyunny.github.io/` 경로에 데이터를 저장한다.
  - 새로운 탭을 열고 `https://github.com` 사이트로 접속하여 저장된 데이터를 확인한다.
  - 새로운 탭을 열고 `https://junhyunny.github.io/` 사이트로 접속하여 저장된 데이터를 확인한다.
- 동일 출처를 가진 새로운 브라우저 탭에서 데이터를 찾을 수 있다.
  - `https://github.com` 사이트에서는 데이터를 찾을 수 없다.
  - `https://junhyunny.github.io/` 사이트에서는 데이터를 찾을 수 있다.

<div align="center">
  <img src="{{ site.image_url_2022 }}/local-storage-01.gif" width="100%" class="image__border">
</div>

##### 브라우저를 다시 열었을 때 데이터 존재 여부

- 브라우저를 다시 열었을 때 이전에 저장한 데이터가 남아있는지 확인한다.
  - 이전에 저장한 데이터가 존재한다.

<div align="center">
  <img src="{{ site.image_url_2022 }}/local-storage-02.gif" width="100%" class="image__border">
</div>

#### RECOMMEND NEXT POSTS

- [브라우저 세션 스토리지(session storage)][session-storage-link]

#### REFERENCE

- <https://ko.javascript.info/localstorage>
- <https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage>
- <https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API>
- <https://www.gwtproject.org/doc/latest/DevGuideHtml5Storage.html>

[cors-link]: https://junhyunny.github.io/information/cors/
[session-storage-link]: https://junhyunny.github.io/information/session-storage/
