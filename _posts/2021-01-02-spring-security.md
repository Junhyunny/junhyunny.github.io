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

## Web Security
Spring Security는 web tier 상에서 servlet filter들을 기반으로 구현되어 있기 때문에 filter들의 역할에 대해 알아봅니다.

## OPINION
작성 중입니다.

#### 참조글
- <https://spring.io/guides/topicals/spring-security-architecture/>
- <https://sjh836.tistory.com/165>

[blogLink]: https://junhyunny.github.io/side%20project/information/security/json-web-token/