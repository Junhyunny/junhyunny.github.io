---
title: "Spring Security"
search: false
category: 
  - side project
  - information
  - security
  - spring security
last_modified_at: 2021-01-02T00:00:00
---

# Spring Security<br>

지난 포스트에서는 [JWT, Jason Web Token][blogLink]에 대한 이야기를 해보았습니다. 
Spring Security 프레임워크와 json web token을 활용한 서버 구현 전에 spring security 프레임워크에 대해 알아보았습니다. 

> Spring Security is a Java/Java EE framework that provides **authentication, authorization** and other security features for enterprise applications.
> Spring Security in the web tier (for UIs and HTTP back ends) is based on Servlet Filters.

## 보안 관련 용어
Spring Security 프레임워크에 대해 알아보기 전에 보안과 관련된 용어에 대해 정의해보았습니다.<br>
- 접근 주체(Principal)
  - 보안 시스템이 작동되고 있는 application에 접근하려는 유저
- 인증(Authentication)
  - Application 작업을 수행할 수 있는 주체(사용자)임을 증명하는 행위
  - who are you?
- 권한(Authorization)
  - 인증된 주체가 application의 동작을 수행할 수 있도록 허락되었는지 확인, 결정하는 행위
  - what are you allowed to do?

> 권한(Authorization)은 승인이 필요한 부분으로 접근하기 위해서는 인증(Authentication) 과정이 필요

## Servlet Filters in Web Security
Spring Security는 web tier 상에서 서블릿 필터(servlet filter)들을 기반으로 구현되어 있기 때문에 필터들의 역할에 대해 알아봅니다.
클라이언트가 서로버 HTTP 요청시 아래와 같은 필터 계층에 의해 처리됩니다. 

이미지-1
출처 https://spring.io/guides/topicals/spring-security-architecture/

컨테이너는 클라이언트 요청 URL에 근거하여 어떤 필터, 어떤 서블릿을 적용할지 결정합니다. 
기껏해야 하나의 서블릿이 단일 요청을 처리 할 수 ​​있지만 필터는 체인을 형성하므로 순서가 지정됩니다.

## Speing Security FilterChainProxy
Spring Security에서는 

이미지-2
출처 https://spring.io/guides/topicals/spring-security-architecture/


## OPINION
작성 중입니다.

#### 참조글
- <https://spring.io/guides/topicals/spring-security-architecture/>
- <https://sjh836.tistory.com/165>

[blogLink]: https://junhyunny.github.io/side%20project/information/security/json-web-token/