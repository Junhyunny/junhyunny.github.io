---
title: "Spring Security"
search: false
category:
  - spring-security
last_modified_at: 2021-08-21T16:00:00
---

<br>

👉 이어서 읽기를 추천합니다.
- [Spring Security 기반 JWT 인증 방식 예제][spring-security-example-link]

## 0. 들어가면서

이번 포스트에서는 Spring Security 프레임워크에 대해 알아보았습니다. 

> Spring Security is a Java/Java EE framework that provides **authentication, authorization** and other security features for enterprise applications.
> Spring Security in the web tier (for UIs and HTTP back ends) is based on Servlet Filters.

## 1. 보안 관련 용어

Spring Security 프레임워크에 대해 알아보기 전에 보안과 관련된 용어에 대해 정의해보았습니다.

- **접근 주체(Principal)**
  - 보안 시스템이 작동되고 있는 application에 접근하려는 유저
- **인증(Authentication)**
  - Application 작업을 수행할 수 있는 주체(사용자)임을 증명하는 행위
  - Who are you?
- **권한(Authorization)**
  - 인증된 주체가 application의 동작을 수행할 수 있도록 허락되었는지 확인, 결정하는 행위
  - What are you allowed to do?

> 한 줄 요약<br>
> 특정 기능을 수행할 수 있는 권한(Authorization)은 승인이 필요한 부분이므로 접근하기 위해서는 인증(Authentication) 과정이 필요합니다.

## 2. Servlet Filters in Web Security
웹 계층 (UI 및 HTTP 백엔드 용)의 Spring Security는 서블릿 필터(servlet filter)를 기반으로 구현되어 있습니다.
때문에 서블릿 필터의 구조에 대해서 먼저 알아보도록 하겠습니다. 
클라이언트가 서버로 HTTP 요청시 아래와 같은 필터 계층에 의해 처리됩니다.  

<p align="center"><img src="/images/spring-security-1.JPG" width="30%"></p>
<center>이미지 출처, https://spring.io/guides/topicals/spring-security-architecture/</center><br>

컨테이너는 클라이언트 요청 URL에 근거하여 어떤 필터, 어떤 서블릿을 적용할지 결정합니다. 
기껏해야 하나의 서블릿이 단일 요청을 처리 할 수 ​​있지만 필터는 체인을 형성하므로 순서가 지정됩니다. 
사용자 요청은 순서가 지정된 필터들을 차례대로 거치게 됩니다. 
**필터는 downstream 에서 사용되는 요청이나 응답 정보를 수정할 수 있습니다.** 
**(In the client–server model, downstream can refer to the direction from the server to the client.)**

## 3. Speing Security FilterChainProxy
**Spring Security는 하나의 필터로서 FilterChainProxy라는 타입으로 서블릿 필터 체인에 포함됩니다.** 
컨테이너 입장에서 보면 Spring Security는 1개의 필터이지만 그 내부를 살펴보면 각자 특수한 역할을 수행하는 필터들로 구성되어 있습니다. 
FilterChainProxy는 필터 체인으로서 내부적으로 배열된 모든 보안 로직(필터)들을 포함하고 있습니다. 

- FilterChainProxy 추상화 이미지
<p align="center"><img src="/images/spring-security-2.JPG" width="50%"></p>
<center>이미지 출처, https://spring.io/guides/topicals/spring-security-architecture/</center><br>

- FilterChainProxy 내부 실제 Filters
  - FilterChainProxy 내부 필터들은 각자 수행하는 역할이 있습니다.
<p align="center"><img src="/images/spring-security-3.JPG" width="80%"></p>
<center>이미지 출처, https://bamdule.tistory.com/52</center><br>

동일한 최상위 FilterChainProxy 레벨에서 Spring Security에 의해 관리되는 여러 개의 필터 체인들이 존재할 수도 있으며 
모든 필터 체인들이 컨테이너에게는 알려지지 않습니다. 
Spring Security 필터는 모든 필터 체인들의 목록을 포함하고 있으며 경로(API PATH)가 일치하는 첫 번째 체인에 요청을 전달합니다. 
아래 그림은 요청 경로별 매칭에 의거하여 요청을 전달하는 모습을 보여줍니다. (<em>/foo/**<em>는 <em>/**<em>보다 매칭됩니다.) 

<p align="center"><img src="/images/spring-security-4.JPG" width="50%"></p>
<center>이미지 출처, https://spring.io/guides/topicals/spring-security-architecture/</center><br>

## 4. Spring Security Authentication Architecture
Spring Security가 컨테이너의 서블릿 필터 체인 구조를 활용하여 어떤 식으로 웹 요청에 대한 보안 처리를 하는지 확인해보았습니다. 
다음은 Spring Security Framework이 사용자 인증을 처리하는 프로세스에 대해서 알아보겠습니다. 

<p align="center"><img src="/images/spring-security-5.JPG" width="80%"></p>
<center>이미지 출처, https://springbootdev.com/2017/08/23/spring-security-authentication-architecture/</center><br>

1\. HTTP 요청 접수
  - 요청은 authentication, authorization 별 용도에 맞는 필터 체인으로 이동

2\. AuthenticationToken 생성
  - 요청이 관련 AuthenticationFilter로 수신되면 요청에서 이름과 비밀번호를 추출
  - 추출한 유저 정보를 이용한 Authentication Object 생성

3\. AuthenticationManager에게 AuthenticationToken 전달
  - AuthenticationManager 인터페이스의 authenticate 메소드 호출
  - Authentication Object는 authenticate 메소드의 파라미터로 사용

```java
public interface AuthenticationManager {
    Authentication authenticate(Authentication authentication)throws AuthenticationException;
}
```

4\. AuthenticationProvider들로부터 인증 시도
  - AuthenticationManager의 구현체인 ProviderManager는 인증에 사용되는 AuthenticationProvider들을 소유
  - AuthenticationProvider들은 전달받은 authentication object을 활용하여 사용자 인증을 처리

5\. UserDetailsService 사용
  - 몇 AuthenticationProvider들은 username 정보를 통해 사용자 정보를 조회하기 위해 UserDetailsService를 사용

```java
public interface UserDetailsService {
    UserDetails loadUserByUsername(String username) throws UsernameNotFoundException;
}
```

6\. UserDetails
  - UserDetailsService은 username 정보를 통해 UserDetails 조회

7\. Authentication Object 혹은 AuthenticationException
  - 인증 성공시 Fully populated Authentication Object 반환
  - 인증 실패시 AuthenticationException 전달(throw)
  - Fully populated Authentication Object는 다음과 같은 정보들이 지닙니다.
    - authenticated – true
    - grant authorities list
    - user credentials (username only)

8\. 인증 완료

9\. SecurityContext 내부에 Authentication Object Setting 

#### REFERENCE
- <https://spring.io/guides/topicals/spring-security-architecture/>
- <https://springbootdev.com/2017/08/23/spring-security-authentication-architecture/>
- <https://bamdule.tistory.com/52>
- <https://sjh836.tistory.com/165>

[jwt-blog-link]: https://junhyunny.github.io/information/json-web-token/
[spring-security-example-link]: https://junhyunny.github.io/spring-boot/spring-security/spring-security-example/