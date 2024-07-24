---
title: "JWK(Json Web Key)"
search: false
category:
  - information
last_modified_at: 2024-04-10T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [JWT(Json Web Token)][json-web-token-link]
- [OAuth(Open Authorization)][oauth-link]

## 0. 들어가면서

최근 iOS 애플리케이션과 웹 애플리케이션을 동시에 개발하는 프로젝트에 참여하게 됐다. 이미 프로젝트가 진행 중이었고 참여하는 시점에 이미 사용자 인증 로직이 구현되어 있었다. 어떻게 돌아가고는 있었지만, iOS 애플리케이션에서 로그인한 사용자와 웹 애플리케이션에서 로그인한 사용자에 대한 추상화가 전혀 되어 있지 않은 상태였다. 

인증된 사용자 정보가 담겨 있는 인증 주체(principal) 인스턴스가 서로 달랐다. 그래서인지 인증 주체 인스턴스를 파라미터로 받는 컨트롤러 엔드-포인트(end-point) 메소드(method)부터 코드가 뒤죽박죽인 느낌이었다. 나는 비즈니스 로직의 통일성을 위해 서로 다른 두 플랫폼의 인증 이후 실행 흐름을 동일하게 맞추고 싶었다. 

이 글은 위 문제를 해결하기 위해 스프링 시큐리티 OAuth2 실행 흐름을 분석하면서 배운 내용들에 대해 정리했다. 마침 스프링 시큐리티에 관련된 책을 쓰고 있었기 때문에 집필 관련 리소스를 미리 정리한다는 차원에서 블로그에 글을 남긴다. 

## 1. JWK(JSON Web Key)

JWT(Json Web Token)은 대부분의 개발자라면 모두 알고 있을 것이다. 그렇다면 JWK(Json Web Key)는 무엇일까? RFC 표준을 살펴보자. 

> A JSON Web Key (JWK) is a JavaScript Object Notation (JSON) data structure that represents a cryptographic key.<br/>
> ...
> A JSON object that represents a cryptographic key. The members of the object represent properties of the key, including its value.

간단하게 JSON 형태의 암호 키를 의미한다. JSON 객체의 멤버들은 키(key)의 값을 포함하여 키의 속성을 나타낸다. 다음과 같은 형태를 갖는다. 각 멤버들에 대한 자세한 설명은 잠시 뒤에 살펴보자.

```json
{
  "kty":"EC",
  "crv":"P-256",
  "x":"f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
  "y":"x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
  "kid":"Public key used in JWS spec Appendix A.3 example"
}
```

더불어 함께 등장하는 JWKs(JWK Set)는 JWK 객체들이 세트(set)에 담겨 있는 형태를 의미한다. `keys` 멤버에 매핑되어 있다. JWK 객체들의 집합이라고 볼 수 있다. 다음 같은 모습을 갖는다.

```json
{
  "keys":[
      {
         "kty":"EC",
         "crv":"P-256",
         "x":"MKBCTNIcKUSDii11ySs3526iDZ8AiTo7Tu6KPAqv7D4",
         "y":"4Etl6SRW2YiLUrN5vfvVHuhp7x8PxltmWWlbbM4IFyM",
         "use":"enc",
         "kid":"1"
      },
      {
         "kty":"RSA",
         "n":"0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx
     4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMs
     tn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2
     QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbI
     SD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqb
     w0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw",
         "e":"AQAB",
         "alg":"RS256",
         "kid":"2011-04-29"
      }
  ]
}
```

## 2. JWK Format

JWK 형식에 대해 살펴보자. 다음은 JWK 객체에서 주요하게 사용되는 멤버들이다. 각 멤버들은 암호화 된 키의 속성들을 표현한다.

- "kty" (Key Type)
  - 이 파라미터는 암호 알고리즘을 식별할 때 사용한다. "RSA", "EC" 같은 값을 갖는다. 
  - case-sensitive 문자열이므로 대소문자에 주의해야 한다.
  - REQUIRED
- "use" (Public Key Use)
  - 이 파라미터는 공개 키(public key) 사용 목적을 식별한다. "sig"(signature), "enc"(encryption) 같은 값을 갖는다. 
  - 이 값을 통해 공개 키가 암호화에 사용되는지 서명을 확인할 때 사용되는지 알 수 있다. 
  - case-sensitive 문자열이므로 대소문자에 주의해야 한다. 
  - OPTIONAL
- "key_ops" (Key Operations)
  - 키가 공개, 비공개나 대칭키 같은 어떤 유즈 케이스(use case)들에 사용되는지에 대한 정보를 담고 있다. 
  - case-sensitive 문자열이므로 대소문자에 주의해야 한다.
  - OPTIONAL
  - 다음과 같은 값을 가질 수 있다.
    - "sign" (compute digital signature or MAC)
    - "verify" (verify digital signature or MAC)
    - "encrypt" (encrypt content)
    - "decrypt" (decrypt content and validate decryption, if applicable)
    - "wrapKey" (encrypt key)
    - "unwrapKey" (decrypt key and validate decryption, if applicable)
    - "deriveKey" (derive key)
    - "deriveBits" (derive bits not to be used as a key)
- "alg" (Algorithm)
  - 이 파라미터는 키와 함께 사용되는 알고리즘 정보를 식별할 때 사용한다. 
  - case-sensitive ASCII 문자열이며 옵셔널 멤버다. 
  - OPTIONAL
- "kid" (Key ID)
  - 특정 JWK 객체를 찾을 때 사용한다. 
  - 예를 들면, JWKs 객체에는 여러 개 JWK 객체들이 담겨 있다. 이 객체들 중 특정 키 정보를 가진 JWK 객체를 찾기 위해 사용한다. JWKs 객체에 담긴 JWK 객체들은 자신을 구분할 수 있도록 서로 다른 "kid" 값을 가져야 한다. 
  - case-sensitive 문자열이므로 대소문자에 주의해야 한다.
  - OPTIONAL

X.509 인증서 표준을 지원하기 위한 멤버들이 존재한다. 모든 멤버들이 옵셔널이다.

- "x5u" (X.509 URL)
- "x5t" (X.509 Certificate SHA-1 Thumbprint)
- "x5t#S256" (X.509 Certificate SHA-256 Thumbprint)

## 3. Where is JWK used for?

JWK 객체는 어디에 사용할까? JWT 객체의 유효성을 검증할 때 사용한다. 지금 진행하는 프로젝트를 기준으로 간단하게 정리해보자. OAuth2 프로토콜을 사용하고 있으며 현재 인증에 참여하는 컴포넌트들은 다음과 같다.

- 클라이언트 - iOS 애플리케이션
- 리소스 서버 - 스프링 서버 애플리케이션
- 인가 서버 - 마이크로소프트 인가 서버

다음과 같은 실행 흐름을 갖는다. 

1. iOS 애플리케이션에서 마이크로소프트 인가 서버로부터 사용자 인증을 수행한다. 인증 작업이 완료되면 특정 리소스에 접근할 수 있는 액세스 토큰(access token)을 전달 받는다.
2. iOS 애플리케이션은 필요한 사용자 정보를 얻기 위해 백엔드 서버 애플리케이션으로 API 요청을 보낸다. 마이크로소프트 인가 서버에서 획득한 액세스 토큰을 함께 전달한다.
3. 백엔드 서버 애플리케이션은 사용자가 해당 리소스에 접근할 권한이 있는지 확인하기 위해 요청과 함께 전달된 액세스 토큰의 유효성을 검증해야 한다. 
    - 액세스 토큰 유효성 검증을 위해선 JWT 객체 서명(signature)를 확인해야 한다.
    - 서명은 헤더, 페이로드(payload), 암호 키를 암호화하여 만들기 때문에 서명 검증을 위해선 암호 키 정보가 필요하다.
    - 백엔드 서버 애플리케이션은 마이크로소프트 인가 서버로부터 JWKs 객체를 요청한다.
4. 백엔드 서버 애플리케이션는 JWKs 객체 중 JWT 액세스 토큰과 매칭되는 JWK 객체를 찾아 유효성 검증을 수행한다.
    - JWK 객체로부터 암호 키를 획득한다.
    - JWT 객체에 포함된 헤더, 페이로드, JWK 객체로부터 얻은 암호 키를 사용해 새로운 서명을 만든다.
    - JWT 객체에 포함된 서명과 새롭게 만든 서명을 비교한다. 
    - 서명이 동일하면 접근을 허용하고, 서명이 다르다면 접근을 거부한다.

<p align="center">
  <img src="/images/posts/2024/json-web-key-01.png" width="100%" class="image__border">
</p>

## CLOSING

이 글 도입부에 설명한 것처럼 현 프로젝트의 통일되지 않은 인증, 인가 작업을 정리하기 위해 스프링 시큐리티를 디버깅하면서 확인한 내용들을 글로 정리했다. 스프링 애플리케이션 구조를 다시 재조정하여 문제를 해결한 내용들은 앞으로 작게 나눠 정리할 예정이다.  

#### REFERENCE

- <https://datatracker.ietf.org/doc/html/rfc7517>
- <https://www.letmecompile.com/api-auth-jwt-jwk-explained/>

[json-web-token-link]: https://junhyunny.github.io/information/json-web-token/
[oauth-link]: https://junhyunny.github.io/information/security/oauth/