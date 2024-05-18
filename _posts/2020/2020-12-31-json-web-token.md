---
title: "JWT(Json Web Token)"
search: false
category:
  - information
last_modified_at: 2021-08-21T16:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [RFC 4648 - Base64 Encoding][base-64-encode-and-decode-link]

## 1. JWT(Json Web Token)

`Json 웹 토큰(Json Web Token, JWT)`은 다음과 같이 요약할 수 있다. 

- 클레임 기반 토큰이기 때문에 사용자 정보나 데이터 속성을 담고 있다. 
- 사용자 정보나 데이터 속성은 Json 객체에 저장된다.
- 토큰을 만들기 위해 Base64 방식으로 인코딩한다.

## 2. JWT Format

`헤더(Header)`, `페이로드(Payload)`, `시그너처(Signature)` 3개의 정보를 담고 있다. 각 정보에 대해 자세히 알아보자.

<div align="center">
  <img src="/images/posts/2020/json-web-token-01.png" width="50%" class="image__border">
</div>
<center>https://velopert.com/2389</center>

### 2.1. Header

헤더에는 토큰 유형이나 해시 알고리즘 종류 같은 정보가 담긴다. Base64 방식으로 인코딩(encoding) 되어 있다. 

- `typ`, `alg` 두 가지 정보를 가진다.
- `typ`는 토큰의 타입을 지정한다.
- `alg`는 해싱 알고리즘을 지정한다.
  - 해싱 알고리즘은 `HMAC`, `SHA256`, `RSA` 등이 사용된다.
  - 해싱 알고리즘은 토큰 검증 시 사용되는 시그너처 부분에서 사용된다.

```json
{
  "typ": "JWT",
  "alg": "HS256"
}
```

### 2.2. Payload

헤더와 마찬가지로 `Base64URL` 방식으로 인코딩 되어 있다. 담는 정보의 한 조각을 클레임(claim)이라 부르며 이름-값(name-value) 쌍으로 이루어져 있다. 클레임의 종류는 크게 다음과 같이 분류된다. 

- 등록된 클레임(registered claim)
- 공개된 클레임(public claim)
- 비공개 클레임(private claim)

먼저 등록된 클레임을 살펴보자.

- iss - 토큰 발급자 (issuer)
- sub - 토큰 제목 (subject)
- aud - 토큰 대상자 (audience)
- exp - 토큰 만료 시간 (expiration)
- nbf - 토큰 활성화 날짜 (not before)
- iat - 토큰 발급 시간 (issued at)
- jti - JWT 고유 식별자, 중복 처리 방지

```json
{
  "iss": "junhyunny.github.io",
  "exp": "1485270000000"
}
```

공개된 클레임은 다음과 같은 정보를 갖는다.

- 충돌 방지를 위해 클레임 이름을 주로 URI 형식으로 지정한다.

```json
{
  "https://junhyunny.github.io/": true
}
```

마지막 비공개 클레임 정보는 다음과 같다.

- 서버와 클라이언트 협의하에 사용되는 클레임 이름이다.
- 공개 클레임과 달리 이름이 중복되어 충돌될 수 있으니 사용할 때 유의해야 한다.

```json
{
  "username": "junhyunny"
}
```

### 2.3. Signature

헤더와 페이로드의 데이터 무결성과 변조 방지를 위한 서명 정보다. 서명은 헤더 정보의 인코딩 값과 페이로드 정보의 인코딩 값을 합친 후 비밀 키로 해싱(hashing)하여 생성한 값을 사용한다. 서버에서 서명 정보를 비교해고 위조된 토큰인지 아닌지 여부를 판단할 수 있다. 

```java
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret
)
```

## 3. Encoding and Decoding JWT

<https://jwt.io/> 사이트에서 헤더, 페이로드, 시그너처 정보를 추가하면 JWT 객체를 생성할 수 있다. 반대로 JWT 객체가 있다면 이를 파싱해 볼 수 있다. 내부에 어떤 값이 들었있는지 확인할 때 용이하다.

<div align="center">
  <img src="/images/posts/2020/json-web-token-02.png" class="image__border">
</div>

## 4. Authorization with JWT?

JWT는 Json 객체에 사용자 정보가 담겨 있다. 이는 JWT로부터 인증된 사용자 정보와 권한을 획득할 수 있다는 의미이다. 때문에 오파크 토큰(opaque token)과 JWT을 사용한 인증, 인가 방식에는 차이가 발생한다. 각 인증 방식을 살펴보자.

### 4.1. Opaque Token

1. 클라이언트가 인증 서버(authorization server)에 토큰을 요청한다.
2. 토큰 요청을 받은 인증 서버는 사용자 계정을 확인하고, 토큰 지급이 가능한지 여부를 판정 후 토큰을 발급한다.
3. 인증 서버는 토큰 발급 후 토큰과 사용자 정보를 스토리지(storage)에 저장한다.
4. 인증 서버는 클라이언트에게 토큰을 전달한다.
5. 클라이언트는 토큰과 함께 리소스 서버(resource server)에 API 요청을 수행한다.
6. 리소스 서버는 토큰을 이용한 사용자의 권한 정보 등을 확인 후 응답한다.

<div align="center">
  <img src="/images/posts/2020/json-web-token-03.png" width="80%" class="image__border">
</div>

### 4.2. Json Web Token

1. 클라이언트가 인증 서버에 토큰을 요청한다.
2. 토큰 요청을 받은 인증 서버는 사용자 계정을 확인하고 토큰 지급이 가능한지 여부를 판정 후 토큰을 발급한다.
3. 인증 서버는 사용자 정보를 Json 데이터로 만들고, 이를 암호화하여 토큰을 생성한다.
  - 이 과정에서 만들어진 토큰은 일반 방식과 다르게 스토리지에 저장하지 않는다.
4. 인증 서버는 클라이언트에게 토큰을 전달한다.
5. 클라이언트는 토큰과 함께 리소스 서버에 API 요청을 수행한다.
6. 리소스 서버는 토큰을 이용한 사용자의 권한 정보 등을 확인 후 응답한다.

<div align="center">
  <img src="/images/posts/2020/json-web-token-04.png" width="80%" class="image__border">
</div>

#### RECOMMEND NEXT POSTS

- [Spring Security JWT OAuth Example][spring-security-example-link]
- [JWK(Json Web Key)][json-web-key-link]

#### REFERENCE

- <https://bcho.tistory.com/999>
- <https://velopert.com/2389>
- <https://www.daleseo.com/jwt/>

[base-64-encode-and-decode-link]: https://junhyunny.github.io/information/base-64-encode-and-decode/
[spring-security-example-link]: https://junhyunny.github.io/spring-boot/spring-security/spring-security-example/
[json-web-key-link]: https://junhyunny.github.io/information/json-web-key/