---
title: "OpenID Connect"
search: false
category:
  - information
  - security
last_modified_at: 2023-10-11T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [JWT(Json Web Token)][json-web-token-link]
* [OAuth(Open Authorization)][oauth-link]

## 0. 들어가면서

현재 개발 진행 중인 프로젝트에서 사용자 로그인 관련된 기능을 확장했습니다. 
기존 AAD(Azure Active Directory) 방식을 유지하면서 LINE 로그인을 추가하였는데 아래 의존성 때문에 문제가 발생했습니다. 

* `spring-cloud-azure-starter-active-directory` 의존성

위 의존성은 `spring-boot-starter-oauth2-client` 의존성에 포함된 API 기능들을 AAD 플랫폼에 적합하도록 재구현했기 때문에 LINE 로그인에 필요한 기능 구현이 어려웠습니다. 
두 인증 방식을 병합하기 위해 `spring-cloud-azure-starter-active-directory` 의존성을 제거했고, 순수하게 `spring-boot-starter-oauth2-client` 의존성만을 사용해 로그인 기능을 확장하였습니다. 
이 과정에서 OAuth2 스코프(scope)로 `openid`를 사용해 사소한 문제도 해결하였는데, `openid`라는 스펙은 OAuth2 프로토콜과 어떤 관계가 있는지 궁금하여 글로 정리하였습니다. 

## 1. OpenID Connect

OIDC(OpenID Connect)는 

## 2. OIDC Benefits

## CLOSING

#### TEST CODE REPOSITORY

#### RECOMMEND NEXT POSTS

#### REFERENCE

* <https://www.okta.com/openid-connect/>
* <https://openid.net/developers/how-connect-works/>
* <https://auth0.com/docs/authenticate/protocols/openid-connect-protocol>
* <https://www.authlete.com/developers/definitive_guide/authorization_endpoint_spec/>
* <https://hudi.blog/open-id/>

[json-web-token-link]: https://junhyunny.github.io/information/json-web-token/
[oauth-link]: https://junhyunny.github.io/information/security/oauth/