---
title: "SessionStorage in Browser"
search: false
category:
  - information
last_modified_at: 2022-12-15T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [CORS(Cross Origin Resource Sharing)][cors-link]

## 1. SessionStorage

`sessionStorage` 객체는 웹 스토리지(web storage) 중 하나입니다. 
`sessionStorage` 객체를 통해 브라우저 내에 키-값(key-value) 데이터 쌍을 저장할 수 있습니다. 
`localStorage`와 동일한 기능을 제공하지만, 몇 가지 다른 특성들 때문에 자주 사용되지 않습니다. 
이번 포스트에서 `sessionStorage`의 특성들은 무엇인지 살펴보고 간단한 실습을 통해 확인해보겠습니다.  

## 2. Characteristics of SessionStorage

`sessionStorage` 객체는 다음과 같은 특징을 가집니다. 

* `sessionStorage`에 저장한 데이터는 브라우저에 의해 자동으로 서버에게 요청되지 않습니다. 
* 대부분의 브라우저들은 도메인 별로 최소 2MB, 최대 5BM 정도의 데이터를 저장할 수 있습니다.
* 데이터를 문자열(string) 형식으로 저장합니다.
* 서버는 HTTP 응답 헤더를 통해 `sessionStorage`에 저장된 데이터를 제어할 수 없습니다. 
* `sessionStorage` 데이터는 동일 출처(origin)에 따라 관리됩니다.
    * 도메인, 프로토콜, 포트를 통해 동일 출처 여부를 결정합니다.
    * 서브 도메인, 프로토콜, 포트 등이 다른 경우 `sessionStorage`에 저장된 데이터에 접근할 수 없습니다.

`sessionStorage`는 다음과 같은 특징들이 `localStorage`와 다릅니다.

* `sessionStorage`에 저장한 데이터는 브라우저 탭(tab) 간의 데이터를 공유할 수 없습니다.
* `sessionStorage`에 저장한 데이터는 브라우저를 다시 실행하면 사라집니다.

## 3. Main Methods of SessionStorage

다음과 같은 기능을 가집니다. 

* setItem(key, value) – 키-값 쌍을 보관합니다.
* getItem(key) – 키에 해당하는 값을 받아옵니다.
* removeItem(key) – 키와 해당 값을 삭제합니다.
* clear() – 모든 것을 삭제합니다.
* key(index) – 인덱스(index)에 해당하는 키를 받아옵니다.
* length – 저장된 항목의 개수를 얻습니다.

## 4. Practices

`sessionStorage` 객체의 특징을 이해하기 위해 몇 가지 실습을 진행하였습니다. 
브라우저 개발자 도구의 콘솔(console) 창에서 테스트가 가능합니다.

##### 문자열 저장 

* `sessionStorage` 객체는 데이터를 문자열 형식으로 저장합니다.
* 숫자, 객체는 문자열로 변경되어 저장되므로 주의해야합니다.
* 다음과 데이터를 저장하고 다시 읽어봅니다.
    * 일반적인 문자열
    * 일반 객체
    * JSON 객체

```javascript
sessionStorage.setItem("Hello", "World")
sessionStorage.getItem("Hello") // "World"

sessionStorage.setItem("Hello", {a: 'Hello', b: 'World'})
sessionStorage.getItem("Hello") // "[object Object]"

sessionStorage.setItem("Hello", JSON.stringify({a: 'Hello', b: 'World'}))
sessionStorage.getItem("Hello") // "{\"a\":\"Hello\",\"b\":\"World\"}"
JSON.parse(sessionStorage.getItem("Hello")) // Object { a: "Hello", b: "World" }
```

##### 동일 출처(origin) 단위의 데이터 관리

* 출처가 다른 경우 `sessionStorage`에 저장된 데이터를 볼 수 있는지 확인합니다.
    * `https://junhyunny.github.io/` 경로에 데이터를 저장합니다.
    * 해당 탭에서 `https://github.com` 사이트로 접속하여 저장된 데이터를 확인합니다.
    * 해당 탭에서 `https://junhyunny.github.io/` 사이트로 재접속하여 저장된 데이터를 확인합니다.
* 동일 출처를 가진 사이트에서만 데이터를 찾을 수 있습니다.

<p align="center">
    <img src="/images/session-storage-1.gif" width="100%" class="image__border">
</p>

##### 신규 브라우저 탭 사이의 데이터 공유 여부

* 새로운 탭을 열었을 때 동일한 출처 사이트에 저장한 데이터가 남아있는지 확인합니다.
    * 다른 탭에서 저장한 데이터가 없습니다.

<p align="center">
    <img src="/images/session-storage-2.gif" width="100%" class="image__border">
</p>

##### 브라우저를 다시 열었을 때 데이터 존재 여부

* 브라우저를 열었을 때 동일한 출처 사이트에 저장한 데이터가 남아있는지 확인합니다.
    * 이전에 저장한 데이터가 없습니다.

<p align="center">
    <img src="/images/session-storage-3.gif" width="100%" class="image__border">
</p>

#### RECOMMEND NEXT POSTS

* [LocalStorage in Browser][local-storage-link]

#### REFERENCE

* <https://ko.javascript.info/localstorage>
* <https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage>
* <https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API>
* <https://www.gwtproject.org/doc/latest/DevGuideHtml5Storage.html>

[cors-link]: https://junhyunny.github.io/information/cors/
[local-storage-link]: https://junhyunny.github.io/information/local-storage/