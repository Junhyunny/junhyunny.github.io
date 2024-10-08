---
title: "Register Client in Keycloak for OAuth2"
search: false
category:
  - security
  - tool
last_modified_at: 2024-10-08T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Setup Keycloak][set-up-key-cloak-link]

## 0. 들어가면서

[이전 글][set-up-key-cloak-link]에서 키클록(keycloak)을 설치하고 관리자 사용자로 렐름(raelm)과 새로운 사용자를 만드는 방법에 대해 정리했다. 이번 글은 OAuth2 인가 프로세스를 위해 클라이언트 애플리케이션을 등록하는 방법에 대해 정리한다. 

## 1. Create new client

새로운 클라이언트 애플리케이션을 등록한다. 사전에 만든 `spring-security-oauth2-example` 렐름에서 클라이언트(client) 탭을 선택한다. 화면에서 `Create client` 버튼을 누른다. 

<div align="center">
  <img src="/images/posts/2024/register-client-in-keycloak-for-oauth2-01.png" width="100%" class="image__border">
</div>

<br/>

OAuth2 클라이언트 아이디를 `oauth2-client-demo`로 지정한다.

<div align="center">
  <img src="/images/posts/2024/register-client-in-keycloak-for-oauth2-02.png" width="100%" class="image__border">
</div>

<br/>

OAuth2 클라이언트 타입은 두 가지이다. 

- 기밀 클라이언트(condfidential client)
  - 클라이언트 자격 증명(e.g. 클라이언트 ID, 시크릿)의 기밀성을 유지할 수 있는 클라이언트를 의미한다. 
  - 예를 들어 클라이언트가 보안 서버에 구현되어 있어 클라이언트 자격 증명에 대한 접근이 제한되는 경우이다. 
- 공개 클라이언트(public client)
  - 자격 증명의 기밀성을 유지할 수 없는 클라이언트를 의미한다. 
  - 예를 들어 리소스 소유자가 사용하는 디바이스에서 실행되는 클라이언트(e.g. 안드로이드, 아이폰, 웹 브라우저 애플리케이션)가 이에 해당한다.

클라이언트 역할을 수행하는 애플리케이션이 서버라면 보통 기밀 클라이언트 타입이다. OAuth2 인가 프로세스에서 클라이언트 인증을 활성화한다. 클라이언트 애플리케이션을 등록하면 발급 받는 클라이언트 아이디와 시크릿(secret)을 사용해 이후 인가 서버로부터 인증을 수행한다. 

<div align="center">
  <img src="/images/posts/2024/register-client-in-keycloak-for-oauth2-03.png" width="100%" class="image__border">
</div>

<br/>

필요한 URL을 지정한다. 각 URL에 다음과 같은 정보를 입력한다.

- ROOT URL
  - 키클록 서버의 다른 상대 경로 URL이 있다면 이를 등록한다. 
- Home URL
  - 인증 서버가 클라이언트로 리다이렉션하거나 다시 연결해야 하는 경우에 사용하는 기본 URL을 제공한다.
- Valid redirect URIs
  - 브라우저가 로그인 성공 후 리다이렉트 되는 URI 패턴을 지정한다.
  - 와일드카드(*)를 사용할 수 있지만, 보안상 운영 환경에서 사용하지 않는 것이 좋다.
- Web Origins
  - 웹(web) 환경에서 Cross-Origin Resource Sharing(CORS) 옵션을 다루기 위해 사용한다.
- Admin URL
  - 클라이언트에 대한 콜백 엔드포인트다.
  - 서버는 이 URL을 사용해 해지 정책 푸시, 백채널 로그아웃 수행 및 기타 관리 작업 같은 콜백을 수행한다.

OAuth2 클라이언트 애플리케이션을 위한 리다이렉트 URI 주소를 `http://localhost:8080/login/oauth2/code/key-cloak`으로 지정한다. 

- 리소스 소유자(resource owner)가 성공적으로 로그인 후 클라이언트 애플리케이션으로 리다이렉트 되는 주소를 의미한다.
- 이 리다이렉트 요청에서 클라이언트 애플리케이션은 액세스 토큰을 발급 받는다.

<div align="center">
  <img src="/images/posts/2024/register-client-in-keycloak-for-oauth2-04.png" width="100%" class="image__border">
</div>

<br/>

클라이언트를 생성하면 아래와 같이 클라이언트 애플리케이션 상세 정보를 확인할 수 있다. `Credentials` 탭에서 클라이언트 시크릿을 확인할 수 있다. 

<div align="center">
  <img src="/images/posts/2024/register-client-in-keycloak-for-oauth2-05.png" width="100%" class="image__border">
</div>

#### REFERENCE

- <https://developer.temenos.com/temenos-explorer/docs/developer/keycloak/keycloak-step-3/#configure-your-client>
- <https://www.keycloak.org/docs/latest/server_admin/#access-settings>

[set-up-key-cloak-link]: https://junhyunny.github.io/security/tool/set-up-key-cloak/