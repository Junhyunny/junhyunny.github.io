---
title: "JWT, Json Web Token"
search: false
category:
  - information
  - security
last_modified_at: 2021-01-28T00:00:00
---

<br>

> Json Format 데이터를 이용한 클레임(Claim) 기반의 토큰 인증 방식

Json 객체를 사용하여 가볍고 자가 수용적인 방식으로 정보를 안정성 있게 주고 받는 방법입니다. 
C, C++, C#, Java, Python, Ruby, Go, Switft 등 많은 프로그래밍 언어에서 지원됩니다. 

## 클레임(Claim) 기반이란?
우선 `클레임 기반`에 대한 정의를 알아보도록 하겠습니다. 
주로 의미없는 문자열을 전달하는 일반 string 토큰과 달리 **클레임 기반 토큰은 내부에 사용자 정보나 데이터 속성 등을 담고 있습니다.** 

#### 일반 string 토큰 인증 방식
<p align="center"><img src="/images/json-web-token-1.JPG"></p>

  1. 클라이언트가 authorization server에 토큰 요청
  1. 토큰 요청을 받은 authorization server는 사용자 계정을 확인 후 토큰 지급이 가능한지 여부를 판정하여 토큰 발급
  1. **토큰 발급 후 토큰과 사용자 정보를 storage에 저장** 
  1. 클라이언트에게 토큰 전달
  1. 클라이언트는 토큰과 함께 resource server에 api 요청
  1. 토큰을 이용한 사용자 정보 확인 후 응답 (권한 등)<br>

#### 클레임 기반 토큰 인증 방식
<p align="center"><img src="/images/json-web-token-2.JPG"></p>

  1. 클라이언트가 authorization server에 토큰 요청
  1. 토큰 요청을 받은 authorization server는 사용자 계정을 확인 후 토큰 지급이 가능한지 여부를 판정하여 토큰 발급
  1. **사용자 정보를 json data로 만들고, 이를 암호화하여 토큰으로 생성<br>**
		 **(이 과정에서 만들어진 토큰은 일반 방식과 다르게 storage에 저장하지 않습니다.)** 
  1. 클라이언트에게 토큰 전달
  1. 클라이언트는 토큰과 함께 resource server에 api 요청
  1. 토큰을 이용한 사용자 정보 확인 후 응답 (권한 등)<br>

이러한 인증 방식의 차이로 클레임 기반의 경우 토큰을 생성하는 단계에서 토큰을 별도로 서버에 유지할 필요가 없어졌습니다. 
API 서버는 API 요청을 검증하기 위해 토큰을 이용하여 사용자 정보를 별도로 조회할 필요가 없어졌습니다. 

## Json Web Token 구조
Header, Payload, Signature 3개의 정보를 담고 있습니다. 각 정보에 대해 자세히 알아보도록 하겠습니다.

<p align="center"><img src="/images/json-web-token-3.JPG"></p>

### Header 정보
토큰 유형이나 해시 알고리즘이 무엇인지 등의 정보가 담깁니다. 
Base64URL 방식으로 인코딩되어 있습니다. 
"typ", "alg" 두가지 정보를 가집니다. 
"typ"은 토큰의 타입을 지정하고 "alg"는 해싱 알고리즘을 지정합니다. 
해싱 알고리즘은 HMAC, SHA256, RSA가 사용되며, 이 알고리즘은 토큰 검증시 사용되는 signature 부분에서 사용됩니다. 
```json
{
  "typ": "JWT",
  "alg": "HS256"
}
```

### Payload 정보
Header 정보와 마찬가지로 Base64URL 방식으로 인코딩되어 있습니다. 
담는 정보의 한 조각을 클레임(claim)이라 부르며 name-value 쌍으로 이루어져 있습니다. 
클레임의 종류는 크게 **등록된 클레임(registered claim), 공개된 클레임(public claim), 비공개 클레임(private claim)**으로 분류됩니다. 

- 등록된 클레임 (registered claim)
  - iss: 토큰 발급자 (issuer)
  - sub: 토큰 제목 (subject)
  - aud: 토큰 대상자 (audience)
  - exp: 토큰 만료 시간 (expiration)
  - nbf: 토큰 활성화 날짜 (not before)
  - iat: 토큰 발급 시간 (issued at)
  - jti: JWT 고유 식별자, 중복 처리 방지

```json
{
    "iss": "junhyunny.github.io",
    "exp": "1485270000000"
}
```
- 공개된 클레임 (public claim)
  - 충돌 방지를 위해 클레임 이름을 주로 URI 형식으로 지정합니다.

```json
{
    "https://junhyunny.github.io/": true
}
```
- 비공개 클레임 (private claim)
  - 서버와 클라이언트 협의하에 사용되는 클레임 이름입니다.
  - 공개 클레임과 달리 이름이 중복되어 충돌될 수 있으니 사용할 때 유의해야 합니다.

```json
{
    "username": "junhyunny"
}
```

### Signature 정보
Header 정보와 Payload 정보의 데이터 무결성과 변조 방지를 위한 서명을 의미합니다. 
서명은 Header 정보의 인코딩 값과 Payload 정보의 인코딩 값을 합친 후 비밀 키로 해싱(hashing)하여 생성한 값입니다. 
```java
HMACSHA256(
    base64UrlEncode(header) + "." +
    base64UrlEncode(payload),
    secret)
```

<br>
<https://jwt.io/> 사이트에서 Header, Payload, Signature 정보를 추가하여 JWT를 생성해보았습니다. 

<p align="center"><img src="/images/json-web-token-4.JPG"></p>

## OPINION
회사에서 업무상 진행하는 프로젝트는 규모가 크고, 모든 일이 협업을 통해 진행되기 때문에 보안과 관련된 내용을 접하기 어려웠습니다. 
스스로 성장할 수 있는 resource를 얻기 위해 side project를 진행하였으며 이 과정에서 직접 security 구현 및 관련 개념들에 대해 배우게 되었습니다. 
이 글에서는 Json Web Token에 대한 개념에 대해서 정리했다면 다음 글은 spring security를 이용한 구현에 대해 정리할 예정입니다. 

#### 참조글
- <https://bcho.tistory.com/999>
- <https://velopert.com/2389>