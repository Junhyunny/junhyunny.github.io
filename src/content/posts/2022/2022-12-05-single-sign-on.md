---
title: "SSO(Single Sign On)"
publishedAt: "2022-12-05"
updatedAt: "2026-11-12T16:19:21+09:00"
canonicalPath: "/information/security/single-sign-on/"
categories:
  - "information"
  - "security"
summary: "SSO의 역할과 SAML 기반 인증 프로세스, 인증 대행 모델과 인증 정보 전달 모델을 살펴보고 SSO와 OAuth의 관계와 차이를 정리했다."
recommendedPosts:
  - title: "OAuth(Open Authorization)"
    href: "https://junhyunny.github.io/information/security/oauth/"
---

## 0. 들어가면서

최근 프로젝트에서 `SSO(Single Sign On)`를 통한 사용자 인증 기능을 구현했다. 기능을 구현하면서 `OAuth(Open Authorization)`와 인증 메커니즘이 똑같다는 생각이 계속 들었다. 둘 사이에 무슨 관계가 있는지, 어떤 차이가 있길래 용어를 다르게 쓰는지 관련 내용을 찾아 정리했다.

## 1. SSO(Single Sign On)

> Wikipedia - Single sign-on<br/>
> 사용자가 단일 ID로 여러 관련된 독립적인 소프트웨어 시스템에 로그인할 수 있도록 하는 인증 체계입니다.

단일 ID로 한 번 인증을 받으면 독립적인 다른 소프트웨어 시스템에서 자동으로(혹은 쉽게) 인증을 받을 수 있는 방법이다. 한 번 자격 증명이 검증된 사용자는 반복되는 로그인 없이 보호된 리소스에 접근할 수 있다. 예를 들어 구글에 한 번 로그인하면 Youtube, Gmail, Google Analytics, Google Search Console 같은 다른 서비스들을 로그인 없이 사용할 수 있다.

인증된 사용자 정보 저장은 주로 LDAP(Lightweight Directory Access Protocol) 데이터베이스로 구현한다. 공통 DNS 상위 도메인을 공유하는 사이트들은 쿠키(cookie)를 사용해 쉽게 구현할 수도 있다.

SSO 인증 서비스는 다음과 같은 장점이 있다.

- 사용자는 매번 ID, 비밀번호를 입력하는 번거로움이 줄어든다.
- 사용자는 여러 개의 ID, 비밀번호를 관리하는 불편함이 줄어든다.
- 관리자는 자동화된 인증 정보 관리 덕분에 사용자의 서비스 접근을 수동으로 제어할 필요가 없다.
- 관리자는 하나의 보안 토큰으로 여러 시스템과 플랫폼, 애플리케이션 및 기타 리소스에 대한 접근을 활성, 비활성화할 수 있다.
- 서비스 제공자는 보다 나은 고객 경험을 제공할 수 있다.

SSO 인증 서비스는 다음과 같은 단점이 있다.

- 한 번의 인증으로 많은 정보를 제공하므로 보안 문제가 발생하면 피해가 커질 수 있다.
- 하나의 ID에 대한 접근 권한을 잃어버리면 모든 서비스를 사용할 수 없다.
- SSO 인증을 지원하는 애플리케이션마다 보안 수준이 다르면 보안 문제가 발생할 수 있다.
  - OTP(One Time Password) 같은 2차 인증 수단을 추가로 사용하는 것이 좋다.

## 2. Roles in SSO

`SSO`는 인증 프로토콜이 아니라 인증을 제공하는 서비스의 한 종류다. `SSO` 인증 서비스는 SAML(Security Assertion Markup Language), OAuth, OpenID 같은 공개 표준 프로토콜로 구현한다. 대표적인 인증 방식 중 하나인 `SAML`로 구현하면 다음과 같은 참여자들이 있다.

- ID 공급자(IdP, Identity Provider)
  - 사용자 식별 정보를 생성, 유지, 관리한다.
  - 네트워크 안의 애플리케이션들에 인증 서비스를 제공하는 시스템 참여자다.
  - 사용자 인증을 서비스로 제공한다.
- 서비스 제공자(Service Provider)
  - 사용자에게 서비스를 제공하는 애플리케이션이다.

## 3. Authentication Process

ID 공급자와 서비스 제공자는 디지털 인증서와 메타데이터를 교환해 신뢰 관계를 미리 설정한다. `SAML` 방식으로 구현하면 다음과 같은 프로세스를 거쳐 인증이 이뤄진다.

1. 사용자가 서비스 제공자에게 접근을 시도한다.
2. 서비스 제공자는 SAML 요청을 생성해 ID 공급자에게 전달한다.
3. ID 공급자는 먼저 사용자가 이미 인증되었는지 확인한다.
  - 인증된 사용자라면 서비스 제공자에게 토큰을 전달해 사용자 인증 완료를 알린다.
  - 인증되지 않은 사용자라면 ID 공급자는 필요한 인증 정보를 입력하도록 요청한다.
    - 인증 정책에 따라 ID, 비밀번호를 사용할 수 있다.
    - OTP 같은 2차 인증 수단을 사용할 수 있다.
4. 사용자 인증이 정상적으로 완료되면 SAML 응답을 생성해 응답한다.
  - SAML 응답은 브라우저를 거쳐 서비스 제공자에게 전달된다.
5. 수신된 SAML 응답은 서비스 제공자와 ID 공급자 간에 미리 설정된 신뢰 관계에 따라 유효성이 검증된다.
  - 유효한 SAML 응답인 경우 사용자에게 인증 토큰을 발급한다.
6. 인증 토큰을 전달받은 사용자는 서비스 제공자에 대한 접근 권한을 가지게 된다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/single-sign-on-01.png" width="100%" class="image__border">
</div>

## 4. SSO Authentication Model

SSO 인증 모델로는 다음 두 가지가 대표적으로 소개된다.

### 4.1. 인증 대행 모델

인증 대행 모델에선 통합 SSO 에이전트(agent)가 인증을 수행한다. 사용자의 인증 정보를 에이전트가 관리하고 대신 로그인해 준다. 인증된 사용자와 서비스 사이의 통신도 통합 SSO 에이전트가 중개한다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/single-sign-on-02.png" width="100%" class="image__border">
</div>
<center>https://nyyang.tistory.com/142</center>

### 4.2. 인증 정보 전달 모델

인증 정보 전달 모델에선 통합 인증 서비스가 인증된 사용자에게 토큰을 발급한다. 사용자는 인증을 통해 발급받은 토큰과 함께 대상 애플리케이션에 요청해 서비스를 제공받는다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/single-sign-on-03.png" width="100%" class="image__border">
</div>
<center>https://nyyang.tistory.com/142</center>

## CLOSING

`SSO`와 `OAuth`의 차이점은 다음과 같이 정리할 수 있다.

- `SSO` 인증을 지원하는 프로토콜은 여러 가지가 있고, 그중 대표적으로 사용되는 방법 하나가 `OAuth`다.
- `OAuth`는 B2C(Business to Consumer), `SAML`은 엔터프라이즈의 사내 `SSO`에서 많이 사용되는 프로토콜이다.
  - `OAuth` 방식은 인가(authorization)만 제공하며 JSON 형식의 데이터를 주고받는 방식이다.
  - `SAML` 방식은 크로스 도메인(cross domain) 간에 구현할 수 있고, XML 형식의 데이터를 주고받는 인증 방식이다.

#### REFERENCE

- <https://en.wikipedia.org/wiki/Single_sign-on>
- <https://developers.worksmobile.com/kr/document/10010604?lang=ko>
- <https://aws.amazon.com/ko/what-is/sso/>
- <https://www.itworld.co.kr/howto/193849>
- <https://velog.io/@krafftdj/SSO%EB%9E%80>
- <https://gruuuuu.github.io/security/ssofriends/>
- <https://nyyang.tistory.com/142>
- <https://bcho.tistory.com/755>
