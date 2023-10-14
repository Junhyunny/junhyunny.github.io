---
title: "OpenID Connect"
search: false
category:
  - information
  - security
last_modified_at: 2023-10-12T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [JWT(Json Web Token)][json-web-token-link]
* [OAuth(Open Authorization)][oauth-link]

## 0. 들어가면서

현재 진행 중인 프로젝트에서 여러 인증 서비스 제공자(IdP, Identity Providers)의 OAuth2.0 클라이언트 인증 방식을 통합하는 작업을 수행했습니다. 
몇 가지 문제들이 있었고, 그 중 한가지는 `openid`라는 스코프(scope)를 사용해서 해결하였습니다. 
정확하게 어떤 개념인지 정리하기 위해 글로 작성하였습니다. 

글을 시작하기 전에 용어에 대한 정리를 간단하게 하겠습니다. 
용어가 헷갈린다면 글을 이해하는데 어려움을 겪을 수 있습니다. 

* 인증(authentication)
    * 사용자가 누구인지 판단합니다.
* 인가(authorization)
    * 인증된 사용자가 리소스에 접근할 수 있는지 확인합니다.

다음은 OAuth2.0 참여자들에 대한 용어 설명입니다.

* 사용자(resource owner)
    * 일반 인터넷 사용자를 의미합니다.
    * OAuth2.0 프로토콜에서 리소스 오너(resource owner)라고 합니다.
* 클라이언트(client)
    * 사용자의 리소스(e.g. 개인정보, email)를 사용하고 싶은 어플리케이션입니다.
    * 예를 들면 SNS 로그인을 지원하는 어떤 서비스 혹은 어플리케이션을 의미합니다.
* 리소스 서버(resource server)
    * 사용자 리소스를 관리하는 서버입니다.
    * 예를 들면 구글, 네이버, 카카오 같은 회사의 일반 서비스 서버를 의미합니다.
* 인가 서버(authorization server)
    * 클라이언트 어플리케이션이 사용자 리소스에 접근할 수 있도록 액세스 토큰(access token)을 발급하는 서버입니다.
    * 예를 들면 구글, 네이버, 카카오 같은 회사의 인가 서버를 의미합니다.

## 1. OpenID Connect

OIDC에 대한 개념을 살펴보기 전에 OAuth2.0 방식에 대해 먼저 알아보겠습니다. 
OAuth2.0 프레임워크는 사용자 리소스에 대한 접근 권한을 인가(authorization)받는 방식입니다. 
사용자를 인증하는 데 직접 관여하지 않습니다. 
대신 클라이언트 어플리케이션이 사용자 리소스(resource)에 접근할 수 있도록 액세스 토큰을 발급합니다. 
클라이언트 어플리케이션은 발급 받은 액세스 토큰을 사용해 리소스 서버로부터 사용자 정보를 조회할 수 있습니다. 
IdP는 인증이 완료된 사용자에 한해서 액세스 토큰을 발급하기 때문에 OAuth2.0 방식은 엄밀히 권한 부여에 대한 프로토콜이지만, 인증 방식으로도 많이 사용합니다. 

OIDC(OpenID Connect)는 OAuth2.0 프레임워크를 기반으로 동작하는 프로토콜입니다. 
새로운 방식의 토큰을 통해 인가와 더불어 인증도 함께 제공합니다. 
조금 더 구체적으로 살펴보면 OIDC 프로토콜에 참여하는 클라이언트는 액세스 토큰과 함께 사용자 인증 정보가 담긴 아이디 토큰(id token)을 함께 전달받습니다. 
아이디 토큰을 통해 인증된 사용자 정보를 확인할 수 있습니다.

<p align="center">
    <img src="/images/open-id-connect-1.JPG" width="100%" class="image__border">
</p>
<center>https://www.okta.com/openid-connect/</center>

### 1.1. ID Token

OIDC 프로토콜에 참여하는 클라이언트 어플리케이션이 전달받는 ID 토큰을 살펴보겠습니다. 
ID 토큰은 JWT(Json Web Token) 형식이며 이를 디코딩(decoding)한 데이터를 살펴보면 사용자 정보를 확인할 수 있습니다. 

* 액세스 토큰, 토큰 타입, 리프레시 토큰과 함께 아이디 토큰을 전달받습니다. 

```json
{
   "access_token": "SlAV32hkKG",
   "token_type": "Bearer",
   "refresh_token": "8xLOxBtZp8",
   "expires_in": 3600,
   "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ.ewogImlzc
     yI6ICJodHRwOi8vc2VydmVyLmV4YW1wbGUuY29tIiwKICJzdWIiOiAiMjQ4Mjg5
     NzYxMDAxIiwKICJhdWQiOiAiczZCaGRSa3F0MyIsCiAibm9uY2UiOiAibi0wUzZ
     fV3pBMk1qIiwKICJleHAiOiAxMzExMjgxOTcwLAogImlhdCI6IDEzMTEyODA5Nz
     AKfQ.ggW8hZ1EuVLuxNuuIJKX_V8a_OMXzR0EHR9R6jgdqrOOF4daGU96Sr_P6q
     Jp6IcmD3HP99Obi1PRs-cwh3LO-p146waJ8IhehcwL7F09JdijmBqkvPeB2T9CJ
     NqeGpe-gccMg4vfKjkM8FcGvnzZUN4_KSP0aAp1tOJ1zZwgjxqGByKHiOtX7Tpd
     QyHE5lcMiKPXfEIQILVq0pc_E2DzL7emopWoaoZTF_m0_N0YzFC6g6EJbOEoRoS
     K5hoDalrcvRYLSrQAZZKflyuVCyixEoV9GfNQC3_osjzw2PAithfubEEBLuVVk4
     XUVrWOLrLl0nx7RkKU8NXNHq-rvKMzqg"
}
```

아이디 토큰을 디코딩하면 볼 수 있는 클레임(claim)을 살펴보면 사용자를 식별할 수 있는 정보가 들어있습니다. 

* 헤더(header)
    * alg(encryption algorithm) - 암호화 알고리즘
    * kid - Key ID

```json
{
  "alg": "RS256",
  "kid": "1e9gdk7"
}
```

* 페이로드 데이터(payload data)
    * iss(issuer) - ID 토큰 발급자의 식별자
    * sub(subject) - 사용자를 식별하는 고유 식별자
    * aud(audience) - ID 토큰이 유효한 대상(audience)으로 일반적으로 클라이언트 어플리케이션 ID
    * nonce(number once) - 클라이언트가 요청한 이전 인증 요청과 매핑하기 위한 값
    * exp(expiration time) - ID 토큰 만료 시간
    * iat(issued at) - ID 토큰이 발급된 시간

```json
{
  "iss": "http://server.example.com",
  "sub": "248289761001",
  "aud": "s6BhdRkqt3",
  "nonce": "n-0S6_WzA2Mj",
  "exp": 1311281970,
  "iat": 1311280970
}
```

* 인증 시그니처(verify signature)
    * 헤더와 페이로드의 변경 여부를 확인하고 이를 방지하기 위한 서명 정보

```json
RSASHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secretKey
)
```

### 1.2. Requesting Claims using Scope Values

OIDC 프로토콜에 참여하는 클라이언트는 스코프를 사용할 수 있습니다. 
[RFC 6749][rfc-6749-link]에서 정의하고 있는 액세스 권한을 기반으로 사용할 수 있는 리소스를 결정합니다. 
OIDC 프로토콜의 클라이언트 어플리케이션이 스코프를 정의하면 해당되는 데이터들이 아이디 토큰 클레임에 담겨 전달됩니다. 
다음과 같은 스코프들이 존재합니다.

* profile
    * 선택 사항입니다.
    * 사용자의 이름, 성(family name), 닉네임, 프로필 사진 등과 같은 프로필 정보를 의미합니다.
* email
    * 선택 사항입니다.
    * 사용자 이메일 정보입니다.
* address
    * 선택 사항입니다.
    * 사용자의 주소 정보입니다.
* phone
    * 선택 사항입니다.
    * 사용자의 핸드폰 번호입니다.

띄어쓰기(space)를 통해 스코프 값들을 구분한다면 스코프 값들을 다중으로 동시에 사용할 수 있습니다. 

```
scope=openid profile email phone
```

## 2. OAuth2.0 and OIDC Flow

OIDC를 사용하면 인증된 사용자 정보를 아이디 토큰을 통해 전달받기 때문에 OAuth2.0 프레임워크에 비해 네트워크 통신 횟수가 적다는 장점이 있습니다. 
실행 흐름을 살펴보면 이를 확인할 수 있습니다. 

OAuth2.0 참여자들에 대한 설명은 글 도입부에 하였으므로 OIDC 프로토콜 참가자들에 대한 정리는 먼저하겠습니다. 

* IdP(Identity Provider)
    * 구글, 네이버, 카카오와 같이 OIDC 서비스를 제공하는 참여자입니다.
    * OAuth2.0 프레임워크에 인가 서버와 역할이 동일합니다.
* RP(Relying Party)
    * 사용자 인증을 위해 IdP 서비스를 사용하는 어플리케이션입니다.
    * OAuth2.0 프레임워크에 클라이언트와 역할이 동일합니다.
* UserInfo Endpoint
    * 액세스 토큰을 통해 보호 중 사용자 정보를 가져올 수 있는 엔드-포인트를 의미합니다.
    * OAuth2.0 프레임워크에서 리소스 서버와 역할이 동일합니다.

### 2.1. OAuth2.0 Flow

OAuth2.0 프레임워크 실행 흐름을 살펴보겠습니다.

1. 사용자가 클라이언트 어플리케이션에 진입하여 SNS 로그인을 시도합니다.
1. 클라이언트 어플리케이션은 클라이언트 아이디, 리다이렉트 URL, 응답 타입, 스코프 등을 인가 서버에 전달합니다. 
1. 사용자는 IdP가 제공하는 로그인 페이지로 리다이렉트 되고, 해당 페이지에서 로그인을 시도합니다.
1. 사용자는 인증에 성공하면 접근 허가에 대한 안내창을 볼 수 있습니다. 
1. 클라이언트 어플리케이션은 임시 인가 코드를 인가 서버로부터 리다이렉트 URL을 통해 전달받습니다.
1. 클라이언트 어플리케이션은 임시 인가 코드, 클라이언트 아이디, 시크릿(secret)을 인가 서버로 전달합니다.
1. 클라이언트 어플리케이션은 액세스 토큰을 인가 서버로부터 전달 받습니다.
1. 클라이언트 어플리케이션은 액세스 토큰을 사용해 리소스 서버로부터 사용자 정보를 획득합니다.

<p align="center">
    <img src="/images/open-id-connect-2.JPG" width="100%" class="image__border">
</p>
<center>https://developer.okta.com/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc</center>

### 2.2. OIDC Flow

OIDC 프로토콜의 실행 흐름을 살펴보겠습니다. 
OAuth2.0 프레임워크를 기반으로 동작하기 때문에 대부분의 실행 흐름이 동일합니다.

1. 사용자가 클라이언트 어플리케이션에 진입하여 SNS 로그인을 시도합니다.
1. 클라이언트 어플리케이션은 클라이언트 아이디, 리다이렉트 URL, 응답 타입, 스코프 등을 인가 서버에 전달합니다. 
    * 스코프에 `openid` 값이 추가됩니다.
1. 사용자는 IdP가 제공하는 로그인 페이지로 리다이렉트 되고, 해당 페이지에서 로그인을 시도합니다.
1. 사용자는 인증에 성공하면 접근 허가에 대한 안내창을 볼 수 있습니다. 
1. 클라이언트 어플리케이션은 임시 인가 코드를 인가 서버로부터 리다이렉트 URL을 통해 전달받습니다.
1. 클라이언트 어플리케이션은 임시 인가 코드, 클라이언트 아이디, 시크릿(secret)을 인가 서버로 전달합니다.
1. 클라이언트 어플리케이션은 액세스 토큰과 아이디 토큰을 인가 서버로부터 전달 받습니다.
    * 아이디 토큰을 디코딩한 클레임을 살펴보면 인증된 사용자 정보를 확인할 수 있습니다.
    * 클라이언트 어플리케이션은 아이디 토큰에 충분한 사용자 정보가 존재한다면 리소스 서버에 사용자 정보 요청을 보내지 않습니다. 
1. (선택 사항) 클라이언트 어플리케이션은 액세스 토큰을 사용해 리소스 서버로부터 사용자 정보를 획득합니다.
    * 추가적으로 필요한 리소스가 있다면 액세스 토큰을 사용해 사용자 정보를 조회합니다.

<p align="center">
    <img src="/images/open-id-connect-3.JPG" width="100%" class="image__border">
</p>
<center>https://developer.okta.com/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc</center>

#### REFERENCE

* <https://www.okta.com/openid-connect/>
* <https://openid.net/developers/how-connect-works/>
* <https://auth0.com/docs/authenticate/protocols/openid-connect-protocol>
* <https://www.authlete.com/developers/definitive_guide/authorization_endpoint_spec/>
* <https://hudi.blog/open-id/>
* <https://developer.okta.com/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc>
* <https://datatracker.ietf.org/doc/html/rfc6749>
* <https://developers.onelogin.com/openid-connect>

[json-web-token-link]: https://junhyunny.github.io/information/json-web-token/
[oauth-link]: https://junhyunny.github.io/information/security/oauth/
[rfc-6749-link]: https://datatracker.ietf.org/doc/html/rfc6749