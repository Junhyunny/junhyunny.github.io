---
title: "SSO(Single Sign On)"
search: false
category:
  - information
  - security
last_modified_at: 2022-12-05T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [OAuth(Open Authorization)][oauth-link]

## 0. 들어가면서

최근 프로젝트에서 `SSO(Single Sign On)`을 통한 사용자 인증 관련된 기능을 구현했습니다. 
기능을 구현하면서 `OAuth(Open Authorization)`와 인증 메커니즘이 똑같다는 생각이 계속 들었습니다. 
둘 사이에 무슨 관계가 있는지, 어떤 차이를 가지길래 용어를 다르게 표현하는지 관련된 내용을 찾아 정리하였습니다. 

## 1. SSO(Single Sign On)

> Wikipedia - Single sign-on<br/>
> 사용자가 단일 ID로 여러 관련된 독립적인 소프트웨어 시스템에 로그인할 수 있도록 하는 인증 체계입니다.

단일 ID로 한번 인증을 받으면 독립적인 다른 소프트웨어 시스템에서 자동적으로(혹은 쉽게) 인증을 받을 수 있는 방법입니다. 
한번 자격 증명이 검증된 사용자에겐 반복되는 로그인 없이 보호된 리소스에 접근할 수 있도록 허용합니다. 
예를 들어 구글에 한번 로그인 하면 Youtube, Gmail, Google Analytics, Google Search Console 같은 다른 서비스들은 로그인 없이 사용할 수 있습니다. 

인증된 사용자 정보 저장은 주로 LDAP(Lightweight Directory Access Protocol) 데이터베이스를 통해 구현됩니다. 
공통 DNS 상위 도메인을 공유하는 사이트들의 경우 쿠키(cookie)를 사용하여 쉽게 구현할 수도 있습니다. 

SSO 인증 서비스는 다음과 같은 장점이 있습니다.

* 사용자는 매번 ID, 비밀번호를 입력하는 번거로움이 줄어듭니다.
* 사용자는 여러 개의 ID, 비밀번호들을 관리하는 불편함이 줄어듭니다.
* 관리자는 자동화 된 인증 정보 관리를 통해 사용자들의 서비스 접근을 수동으로 제어할 필요가 없습니다.
* 관리자는 하나의 보안 토큰으로 여러 시스템과 플랫폼, 어플리케이션 및 기타 리소스에 대한 접근을 활성, 비활성화 할 수 있습니다.
* 서비스 제공자는 보다 나은 고객 경험을 제공할 수 있습니다.

SSO 인증 서비스는 다음과 같은 단점이 있습니다. 

* 한번의 인증으로 많은 정보를 제공하므로 보안 문제가 발생하면 피해가 증가할 수 있습니다.
* 하나의 ID에 대한 접근 권한을 잃어버리면 모든 서비스를 사용할 수 없습니다.
* SSO 인증을 지원하는 각 어플리케이션마다 보안 수준이 다른 경우 보안 문제가 발생할 수 있습니다.
    * OTP(One Time Password) 같은 2차 인증 수단을 추가로 사용하는 것이 좋습니다.

## 2. Roles in SSO

`SSO`는 인증 프로토콜이 아니고 인증을 제공하는 서비스의 한 종류입니다. 
`SSO` 인증 서비스는 SAML(Security Assertion Markup Language), OAuth, OpenID 같은 공개 표준 프로토콜을 통해 구현됩니다. 
대표적인 인증 방식 중 하나인 `SAML`을 통해 구현한 경우 다음과 같은 참여자들이 존재합니다.

* ID 공급자(IdP, Identity Provider)
    * 사용자 식별 정보를 생성, 유지, 관리를 합니다. 
    * 네트워크 내 어플리케이션들에게 인증 서비스를 제공하는 시스템 참여자입니다.
    * 사용자 인증을 서비스로서 제공합니다.
* 서비스 제공자(Service Provider)
    * 사용자에게 서비스를 제공하는 어플리케이션입니다.

## 3. Authentication Process

ID 공급자와 서비스 제공자는 디지털 인증서와 메타 데이터를 교환하여 신뢰 관계를 미리 설정합니다. 
`SAML` 방식을 통해 구현한 경우 다음과 같은 프로세스를 거쳐 인증이 이뤄집니다.

1. 사용자가 서비스 제공자에게 접근을 시도합니다.
1. 서비스 제공자는 SAML 요청을 생성하여 ID 공급자에게 전달합니다.
1. ID 공급자는 먼저 사용자가 이미 인증되었는지 여부를 확인합니다.
    * 인증된 사용자라면 서비스 공급자에게 토큰을 전달하여 사용자 인증 완료를 알립니다.
    * 인증되지 않은 사용자라면 ID 공급자는 자신이 필요한 인증 정보를 입력하도록 요청합니다.
        * 인증 정책에 따라 ID, 비밀번호를 사용할 수 있습니다.
        * OTP 같은 2차 인증 수단을 사용할 수 있습니다.
1. 정상적인 사용자 인증이 완료되면 SAML 응답을 생성하여 응답합니다.
    * SAML 응답은 브라우저를 거쳐 서비스 제공자에게 전달됩니다.
1. 수신된 SAML 응답은 서비스 제공자와 ID 공급자 간에 미리 설정된 신뢰 관계에 따라 유효성이 검증이 진행됩니다.
    * 유효한 SAML 응답인 경우 사용자에게 인증 토큰을 발급합니다.
1. 인증 토큰을 전달받은 사용자는 서비스 제공자에 대한 접근 권한을 가지게 됩니다.

<p align="center">
    <img src="/images/single-sign-on-1.JPG" width="80%" class="image__border">
</p>

## 4. SSO Authentication Model

SSO 인증 모델은 다음 두가지 모델이 대표적으로 소개됩니다.

### 4.1. 인증 대행 모델

* 통합 SSO 에이전트(agent)가 인증을 수행합니다.
    * 사용자의 인증 정보를 에이전트가 관리하고 대신 로그인해줍니다.
* 인증된 사용자와 서비스들과의 통신을 통합 SSO 에이전트가 중개합니다.

<p align="center">
    <img src="/images/single-sign-on-2.JPG" width="80%" class="image__border">
</p>
<center>https://nyyang.tistory.com/142</center>


### 4.2. 인증 정보 전달 모델

* 통합 인증 서비스는 인증된 사용자에게 토큰을 발급합니다.
* 사용자는 인증을 통해 발급받은 토큰과 함께 대상 어플리케이션에 요청하여 서비스를 제공받습니다.

<p align="center">
    <img src="/images/single-sign-on-3.JPG" width="80%" class="image__border">
</p>
<center>https://nyyang.tistory.com/142</center>

## CLOSING

`SSO`와 `OAuth`에 대한 차이점은 다음과 같이 정리할 수 있습니다. 

* `SSO` 인증을 지원하는 프로토콜은 여러 가지가 존재하고, 그 중 대표적으로 사용되는 방법 중 하나가 `OAuth`입니다.
* `OAuth`는 B2C(Business to Consumer), `SAML`은 엔터프라이즈의 사내 `SSO`에서 많이 사용되는 프로토콜입니다. 
    * `OAuth` 방식은 인가(authorization)만을 제공하는 JSON 형식의 데이터를 주고 받는 방식입니다.
    * `SAML` 방식은 크로스 도메인(cross domain) 간에 구현이 가능하고, XML 형식의 데이터를 주고 받는 인증 방식입니다.

#### REFERENCE

* <https://en.wikipedia.org/wiki/Single_sign-on>
* <https://developers.worksmobile.com/kr/document/10010604?lang=ko>
* <https://aws.amazon.com/ko/what-is/sso/>
* <https://www.itworld.co.kr/howto/193849>
* <https://velog.io/@krafftdj/SSO%EB%9E%80>
* <https://gruuuuu.github.io/security/ssofriends/>
* <https://nyyang.tistory.com/142>
* <https://bcho.tistory.com/755>

[oauth-link]: https://junhyunny.github.io/information/security/oauth/