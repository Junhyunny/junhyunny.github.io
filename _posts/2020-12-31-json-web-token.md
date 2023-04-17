---
title: "JWT(Json Web Token)"
search: false
category:
  - information
last_modified_at: 2021-08-21T16:00:00
---

<br/>

## 1. JWT(Json Web Token)

`JWT(Json Web Token)` 개념에 대한 정의를 찾아보았습니다.

> Json 형태 데이터를 이용한 클레임(claim) 기반의 토큰 인증 방식

Json 객체를 사용하여 가볍고 자가 수용적인 방식으로 정보를 안정성 있게 주고 받는 방법입니다. 
C, C++, C#, Java, Python, Ruby, Go, Switft 등 많은 프로그래밍 언어에서 지원됩니다. 
임의로 생성된 문자열을 전달하는 일반 토큰과 다르게, `클레임 기반` 토큰은 내부에 사용자 정보나 데이터 속성 등을 담고 있습니다.

## 2. 일반 토큰 인증과 JWT 인증 방식

일반 토큰과 `JWT`를 사용한 인증 방식은 일부 차이가 있습니다. 
각 인증 방식을 살펴보겠습니다.

### 2.1. 일반 토큰 인증 방식

1. 클라이언트가 인증 서버(authorization server)에 토큰을 요청합니다.
1. 토큰 요청을 받은 인증 서버는 사용자 계정을 확인하고, 토큰 지급이 가능한지 여부를 판정 후 토큰을 발급합니다.
1. 인증 서버는 토큰 발급 후 토큰과 사용자 정보를 스토리지(storage)에 저장합니다.
1. 인증 서버는 클라이언트에게 토큰을 전달합니다.
1. 클라이언트는 토큰과 함께 리소스 서버(resource server)에 API 요청을 수행합니다.
1. 리소스 서버는 토큰을 이용한 사용자의 권한 정보 등을 확인 후 응답합니다.

<p align="center">
    <img src="/images/json-web-token-1.JPG" width="80%" class="image__border">
</p>

### 2.2. JWT 인증 방식

1. 클라이언트가 인증 서버에 토큰을 요청합니다.
1. 토큰 요청을 받은 인증 서버는 사용자 계정을 확인하고 토큰 지급이 가능한지 여부를 판정 후 토큰을 발급합니다.
1. 인증 서버는 사용자 정보를 Json 데이터로 만들고, 이를 암호화하여 토큰을 생성합니다.
    * 이 과정에서 만들어진 토큰은 일반 방식과 다르게 스토리지에 저장하지 않습니다.
1. 인증 서버는 클라이언트에게 토큰을 전달합니다.
1. 클라이언트는 토큰과 함께 리소스 서버에 API 요청을 수행합니다.
1. 리소스 서버는 토큰을 이용한 사용자의 권한 정보 등을 확인 후 응답합니다.

<p align="center">
    <img src="/images/json-web-token-2.JPG" width="80%" class="image__border">
</p>

## 2. JWT 구조

`헤더(Header)`, `페이로드(Payload)`, `시그너처(Signature)` 3개의 정보를 담고 있습니다. 각 정보에 대해 자세히 알아보도록 하겠습니다.

<p align="center">
    <img src="/images/json-web-token-3.JPG" width="50%" class="image__border">
</p>
<center>https://velopert.com/2389</center>

### 2.1. 헤더(Header) 정보

헤더에는 토큰 유형이나 해시 알고리즘 종류 같은 정보가 담깁니다. 
`Base64URL` 방식으로 인코딩(encoding) 되어 있습니다. 

* `typ`, `alg` 두 가지 정보를 가집니다.
* `typ`는 토큰의 타입을 지정합니다.
* `alg`는 해싱 알고리즘을 지정합니다.
    * 해싱 알고리즘은 `HMAC`, `SHA256`, `RSA` 등이 사용됩니다.
    * 해싱 알고리즘은 토큰 검증 시 사용되는 시그너처 부분에서 사용됩니다.

```json
{
    "typ": "JWT",
    "alg": "HS256"
}
```

### 2.2. 페이로드(Payload) 정보

헤더와 마찬가지로 `Base64URL` 방식으로 인코딩 되어 있습니다. 
담는 정보의 한 조각을 클레임(claim)이라 부르며 이름-값(name-value) 쌍으로 이루어져 있습니다. 
클레임의 종류는 크게 **등록된 클레임(registered claim), 공개된 클레임(public claim), 비공개 클레임(private claim)**으로 분류됩니다. 

* 등록된 클레임 (registered claim)
    * iss - 토큰 발급자 (issuer)
    * sub - 토큰 제목 (subject)
    * aud - 토큰 대상자 (audience)
    * exp - 토큰 만료 시간 (expiration)
    * nbf - 토큰 활성화 날짜 (not before)
    * iat - 토큰 발급 시간 (issued at)
    * jti - JWT 고유 식별자, 중복 처리 방지

```json
{
    "iss": "junhyunny.github.io",
    "exp": "1485270000000"
}
```

* 공개된 클레임 (public claim)
    * 충돌 방지를 위해 클레임 이름을 주로 URI 형식으로 지정합니다.

```json
{
    "https://junhyunny.github.io/": true
}
```

* 비공개 클레임 (private claim)
    * 서버와 클라이언트 협의하에 사용되는 클레임 이름입니다.
    * 공개 클레임과 달리 이름이 중복되어 충돌될 수 있으니 사용할 때 유의해야 합니다.

```json
{
    "username": "junhyunny"
}
```

### 2.3. 시그너처(Signature) 정보

헤더와 페이로드의 데이터 무결성과 변조 방지를 위한 서명 정보입니다. 
서명은 헤더 정보의 인코딩 값과 페이로드 정보의 인코딩 값을 합친 후 비밀 키로 해싱(hashing)하여 생성한 값입니다. 

```java
HMACSHA256(
    base64UrlEncode(header) + "." +
    base64UrlEncode(payload),
    secret)
```

## 3. JWT 토큰 만들기

<https://jwt.io/> 사이트에서 헤더, 페이로드, 시그너처 정보를 추가하면 JWT 토큰을 생성해볼 수 있습니다.

<p align="center">
    <img src="/images/json-web-token-4.JPG" class="image__border">
</p>

#### RECOMMEND NEXT POSTS

* [Spring Security JWT(Json Web Token) OAuth 인증 예제][spring-security-example-link]

#### REFERENCE

* <https://bcho.tistory.com/999>
* <https://velopert.com/2389>

[spring-security-example-link]: https://junhyunny.github.io/spring-boot/spring-security/spring-security-example/