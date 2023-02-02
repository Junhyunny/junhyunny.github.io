---
title: "LocalStorage in Browser"
search: false
category:
  - information
last_modified_at: 2022-12-14T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [CORS(Cross Origin Resource Sharing)][cors-link]

## 1. LocalStorage

`localStorage` 객체는 웹 스토리지(web storage) 중 하나입니다. 
`localStorage` 객체를 통해 브라우저 내에 키-값(key-value) 데이터 쌍을 저장할 수 있습니다. 

## 2. Characteristics of LocalStorage

`localStorage` 객체는 다음과 같은 특징을 가집니다. 

* `localStorage`에 저장한 데이터는 브라우저에 의해 자동으로 서버에게 요청되지 않습니다. 
* `localStorage`에 저장한 데이터는 브라우저를 다시 실행해도 사라지지 않습니다. 
* 대부분의 브라우저들은 도메인 별로 최소 2MB, 최대 5BM 정도의 데이터를 저장할 수 있습니다.
* 데이터를 문자열(string) 형식으로 저장합니다.
* 브라우저 탭(tab) 간의 데이터를 공유할 수 있습니다.
* 서버는 HTTP 응답 헤더를 통해 `localStorage`에 저장된 데이터를 제어할 수 없습니다. 
* `localStorage` 데이터는 동일 출처(origin)에 따라 관리됩니다.
    * 도메인, 프로토콜, 포트를 통해 동일 출처 여부를 결정합니다.
    * 서브 도메인, 프로토콜, 포트 등이 다른 경우 `localStorage`에 저장된 데이터에 접근할 수 없습니다.

## 3. Main Methods of LocalStorage

다음과 같은 기능을 가집니다. 

* setItem(key, value) – 키-값 쌍을 보관합니다.
* getItem(key) – 키에 해당하는 값을 받아옵니다.
* removeItem(key) – 키와 해당 값을 삭제합니다.
* clear() – 모든 것을 삭제합니다.
* key(index) – 인덱스(index)에 해당하는 키를 받아옵니다.
* length – 저장된 항목의 개수를 얻습니다.

## 4. Practices

`localStorage` 객체의 특징을 이해하기 위해 몇 가지 실습을 진행하였습니다. 
브라우저 개발자 도구의 콘솔(console) 창에서 테스트가 가능합니다.

##### 문자열 저장 

* `localStorage` 객체는 데이터를 문자열 형식으로 저장합니다.
* 숫자, 객체는 문자열로 변경되어 저장되므로 주의해야합니다.
* 다음과 데이터를 저장하고 다시 읽어봅니다.
    * 일반적인 문자열
    * 일반 객체
    * JSON 객체

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

* 출처가 다른 경우 `localStorage`에 저장된 데이터를 볼 수 있는지 확인합니다.
    * `https://junhyunny.github.io/` 경로에 데이터를 저장합니다.
    * 새로운 탭을 열고 `https://github.com` 사이트로 접속하여 저장된 데이터를 확인합니다.
    * 새로운 탭을 열고 `https://junhyunny.github.io/` 사이트로 접속하여 저장된 데이터를 확인합니다.
* 동일 출처를 가진 새로운 브라우저 탭에서 데이터를 찾을 수 있습니다.
    * `https://github.com` 사이트에서는 데이터를 찾을 수 없습니다.
    * `https://junhyunny.github.io/` 사이트에서는 데이터를 찾을 수 있습니다.

<p align="center">
    <img src="/images/local-storage-1.gif" width="100%" class="image__border">
</p>

##### 브라우저를 다시 열었을 때 데이터 존재 여부

* 브라우저를 다시 열었을 때 이전에 저장한 데이터가 남아있는지 확인합니다.
    * 이전에 저장한 데이터가 존재합니다.

<p align="center">
    <img src="/images/local-storage-2.gif" width="100%" class="image__border">
</p>

#### RECOMMEND NEXT POSTS

* [SessionStorage in Browser][session-storage-link]

#### REFERENCE

* <https://ko.javascript.info/localstorage>
* <https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage>
* <https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API>
* <https://www.gwtproject.org/doc/latest/DevGuideHtml5Storage.html>

[cors-link]: https://junhyunny.github.io/information/cors/
[session-storage-link]: https://junhyunny.github.io/information/session-storage/