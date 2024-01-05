---
title: "RFC 7617 - The Basic HTTP Authentication Scheme"
search: false
category:
  - information
  - http
  - security
last_modified_at: 2023-10-09T23:55:00
---

<br/>

## 1. The Basic HTTP Authentication Scheme

HTTP 인증 방식 중 하나입니다. 
[RFC 7617](https://datatracker.ietf.org/doc/html/rfc7617) 문서 개요에는 다음과 같이 소개되어있습니다. 

> This document defines the "Basic" Hypertext Transfer Protocol (HTTP) authentication scheme, which transmits credentials as user-id/password pairs, encoded using Base64.

HTTP Basic 인증은 사용자 아이디와 비밀번호 한 쌍을 Base64 방식으로 인코딩하여 전송하는 방식입니다. 
TLS(Transport Layer Security) 같은 외부 보안 시스템과 함께 사용하지 않은 경우 안전하지 않은 사용자 인증 방식으로 간주합니다. 
TLS 같은 암호화 도구를 사용하지 않는 경우 사용자 아이디와 비밀번호가 네트워크를 통해 명확한 텍스트로 전달되기 때문에 악의적인 사용자에게 쉽게 노출될 수 있습니다. 

다음과 같은 진행 흐름을 가집니다.

1. 클라이언트는 자격 증명 없거나 유효하지 않은 자격 증명으로 서버로 요청을 보냅니다.
1. 서버는 401 Unauthorized 응답을 반환합니다.
1. 클라이언트는 정상적인 자격 증명을 HTTP 요청 헤더에 담아 서버로 요청을 보냅니다.
1. 서버는 정상적인 응답을 전달하거나 권한이 없는 경우 403 Forbidden 응답을 반환합니다.

<p align="center">
    <img src="/images/rfc-7617-http-basic-authentication-1.JPG" width="100%">
</p>
<center>https://blog.tossbusiness.com/articles/dev-2?utm_source=docs-tosspayments&utm_medium=docs</center>

## 2. Bsic HTTP Authentication in Client Side

HTTP Basic 인증 프레임워크를 사용하는 클라이언트는 [RFC 7235](https://datatracker.ietf.org/doc/html/rfc7235) 정의에 맞게 다음과 같은 헤더 정보를 만들어 서버로 전달합니다. 

* `type`은 인증 스키마입니다. 
    * HTTP Basic 인증 프레임워크를 사용하는 경우 `Basic` 값을 사용합니다.
* `credentials`은 클라이언트를 식별할 수 있는 자격 증명입니다.

```
Authorization: <type> <credentials>
```

클라이언트는 사용자 아이디와 비밀번호를 사용해 각 렐름(realm)에 대한 인증을 받습니다. 
렐름은 HTTP 인증에서 서버의 보호되는 범위 혹은 영역을 의미합니다. 
HTTP Basic 인증을 사용하는 클라이언트는 아이디와 비밀번호를 콜론(:)으로 구분하여 자격 증명(credentials)을 만듭니다. 
이때 자격 증명은 평문(plaintext)가 아닌 Base64 방식으로 인코딩 된 값을 사용합니다. 

```
Authorization: Basic base64({USERNAME}:{PASSWORD})
```

예를 들어 사용자 아이디가 `junhyunny`, 비밀번호가 `123`인 경우 다음과 같은 정보가 HTTP 헤더에 포함됩니다. 

* 헤더 키는 `Authorization`을 사용합니다.
* 헤더 값에 타입은 `Basic`을 사용합니다.
* 헤더 값에 자격 증명은 `junhyunny:123`을 Base64 방식으로 인코딩한 값입니다.
    * <https://www.base64encode.org/ko/>

```
Authorization: Basic anVuaHl1bm55OjEyMw==
```

## 3. Basic HTTP Authentication in Server Side

서버는 요청과 함께 전달받은 유효하지 않은 자격 증명에 대해 401(Unauthorized) 응답을 반환해야 합니다. 
401 응답을 생성하는 서버는 요청된 리소스에 접근을 얻기 위해 사용되어야 할 인증 방법을 HTTP 응답 헤더 `WWW-Authenticate` 필드 값을 통해 제공해야 합니다. 

* `type`은 인증 스키마입니다. 
    * HTTP Basic 인증 프레임워크를 사용하는 경우 `Basic` 값을 사용합니다.
* `realm`은 서버에서 관리하는 렐름 정보입니다.

```
WWW-Authenticate: <type> realm=<realm>
```

위와 같은 응답 헤더를 통해 클라이언트는 자격 증명에 따라 응답이 달라질 수 있다는 점을 예상할 수 있습니다. 
HTTP Basic 인증에 참여하는 서버는 401 응답을 전달할 때 다음과 같은 응답 헤더를 전달합니다. 

* 헤더 키는 `WWW-Authenticate`을 사용합니다.
* 헤더 값에 타입은 `Basic`을 사용합니다.
* 헤더 값에 렐름 정보를 전달합니다. 
    * 서버는 클라이언트가 해당 렐름에 유효한 자격 증명을 보내기를 유도합니다.

```
WWW-Authenticate: Basic realm="Realm"
```

#### REFERENCE

* <https://en.wikipedia.org/wiki/Basic_access_authentication>
* <https://developer.mozilla.org/ko/docs/Web/HTTP/Authentication>
* <https://datatracker.ietf.org/doc/html/rfc7617>
* <https://datatracker.ietf.org/doc/html/rfc7235>
* <https://datatracker.ietf.org/doc/html/rfc2617#section-2>
* <https://blog.tossbusiness.com/articles/dev-2?utm_source=docs-tosspayments&utm_medium=docs>