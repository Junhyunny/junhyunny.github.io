---
title: "HandlerMethodArgumentResolver 인터페이스"
search: false
category:
  - spring-boot
last_modified_at: 2021-08-21T17:00:00
---

<br>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Spring Security 기반 JWT 인증 방식 예제][jwt-blogLink]
- [Token Enhancer][tokenenhancer-blogLink]

## 0. 들어가면서

HandlerMethodArgumentResolver 인터페이스와 커스텀 애너테이션을 이용해 아래와 기능을 수행하는 예제 코드입니다.
- 토큰에서 필요한 정보를 추출
- 커스텀 애너테이션이 붙은 클래스에 추출한 값 지정

## 1. 예제 코드

### 1.1. 패키지 구조

```
.
|-- action-in-blog.iml
|-- mvnw
|-- mvnw.cmd
|-- pom.xml
`-- src
    |-- main
    |   |-- java
    |   |   `-- blog
    |   |       `-- in
    |   |           `-- action
    |   |               |-- ActionInBlogApplication.java
    |   |               |-- annotation
    |   |               |   `-- TokenMember.java
    |   |               |-- config
    |   |               |   |-- Config.java
    |   |               |   `-- WebConfig.java
    |   |               |-- controller
    |   |               |   `-- MemberController.java
    |   |               |-- converter
    |   |               |   `-- StringListConverter.java
    |   |               |-- entity
    |   |               |   `-- Member.java
    |   |               |-- repository
    |   |               |   `-- MemberRepository.java
    |   |               |-- resolver
    |   |               |   `-- CustomMethodArgumentResolver.java
    |   |               |-- security
    |   |               |   |-- AuthorizationServer.java
    |   |               |   |-- ResourceServer.java
    |   |               |   `-- SecurityConfig.java
    |   |               `-- service
    |   |                   `-- MemberService.java
    |   `-- resources
    |       `-- application.yml
    `-- test
        `-- java
            `-- blog
                `-- in
                    `-- action
                        `-- ActionInBlogApplicationTests.java
```

### 1.2. TokenMember 애너테이션 구현
커스텀 애너테이션을 만들어줍니다. 메소드 파라미터 앞에 붙일 애너테이션이므로 @Target은 ElementType.PARAMETER로 지정합니다. 
프로그램 수행 중에 사용할 애너테이션이므로 @Retention 은 RetentionPolicy.RUNTIME으로 지정합니다. 

```java
package blog.in.action.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface TokenMember {

}
```

### 1.3. CustomMethodArgumentResolver 클래스 구현
HandlerMethodArgumentResolver 클래스를 상속하여 supportsParameter 메소드와 resolveArgument 메소드를 오버라이딩(overriding)합니다. 
1. supportsParameter 메소드를 통해 해당 파라미터에 대한 처리를 수행할지 말지 여부를 체크합니다. 
1. resolveArgument 메소드를 통해 토큰에서 필요한 데이터를 추출하여 Member 객체에 SETTING 후 이를 반환합니다. 
1. 반환된 객체는 요청 Parameter로써 Controller에게 전달됩니다.

##### ServletInvocableHandlerMethod 내부 supportsParameter 메소드와 resolveArgument 메소드 수행 위치
<p align="center"><img src="/images/handler-method-argument-resolver-1.JPG"></p>

```java
package blog.in.action.resolver;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.MethodParameter;
import org.springframework.security.jwt.Jwt;
import org.springframework.security.jwt.JwtHelper;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.fasterxml.jackson.databind.ObjectMapper;

import blog.in.action.annotation.TokenMember;
import blog.in.action.entity.Member;

@Component
public class CustomMethodArgumentResolver implements HandlerMethodArgumentResolver {

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        // parameter의 annotation이 @TokenMember 이면서 parameter 타입이 Member 클래스인 경우에만 해당 Resolver의 resolveArgument 메소드가 동작
        return parameter.getParameterAnnotation(TokenMember.class) != null && parameter.getParameterType().equals(Member.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer, NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws Exception {

        // Header에서 Authorization 정보 획득
        String authorizationHeader = webRequest.getHeader("Authorization");
        if (authorizationHeader == null) {
            return null;
        }

        // Barear 를 제외한 토큰을 추출
        String jwtToken = authorizationHeader.substring(7);

        // JWT 토큰 decoder 생성
        Jwt decodedToken = JwtHelper.decode(jwtToken);

        @SuppressWarnings("unchecked")
        Map<String, String> claims = objectMapper.readValue(decodedToken.getClaims(), Map.class);

        String memberId = String.valueOf(claims.get("memberId"));

        Member member = new Member();
        member.setId(memberId);
        return member;
    }

}
```

### 1.4. WebConfig 클래스 구현
WebMvcConfigurer 인터페이스의 addArgumentResolvers 메소드를 오버라이드하여 CustomMethodArgumentResolver 객체를 추가합니다.

```java
package blog.in.action.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import blog.in.action.resolver.CustomMethodArgumentResolver;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private CustomMethodArgumentResolver customMethodArgumentsHandler;

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(customMethodArgumentsHandler);
    }
}
```

### 1.5. MemberController 클래스 구현
Controller에 새로운 메소드를 추가하였습니다. 
requestUserInfoUsingToken 메소드를 보면 요청 파라미터에 @TokenMember 애너테이션이 붙어있습니다. 
**/api/member/user-info-using-token** API 요청시 CustomMethodArgumentResolver @Bean에 의해 Member 객체에 값이 SETTING 됩니다.

```java
package blog.in.action.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import blog.in.action.annotation.TokenMember;
import blog.in.action.entity.Member;
import blog.in.action.service.MemberService;

@RestController
@RequestMapping(value = "/api/member")
public class MemberController {

    @Autowired
    private MemberService memberService;

    @PostMapping("/sign-up")
    @Transactional(propagation = Propagation.REQUIRED)
    public void requestSignUp(@RequestBody Member member) {
        memberService.registMember(member);
    }

    @GetMapping("/user-info")
    public Member requestUserInfo(@RequestParam("id") String id) {
        return memberService.findById(id);
    }

    @GetMapping("/user-info-using-token")
    public Member requestUserInfoUsingToken(@TokenMember Member member) {
        return memberService.findById(member.getId());
    }
}
```

## 2. 테스트 결과
테스트를 위한 데이터를 복사하여 사용할 수 있도록 이미지가 아닌 Timeline으로 변경하였습니다.(2021-07-05)

### 2.1. 사용자 정보 등록 요청

```
> POST /api/member/sign-up HTTP/1.1
> Host: localhost:8080
> User-Agent: insomnia/2021.4.0
> Cookie: JSESSIONID=49EC0B7588ED248E1DECE1A16049416E
> Content-Type: application/json
> Accept: */*
> Content-Length: 69

| {
|     "id": "junhyunny",
|     "password": "123",
|     "authroities": ["ADMIN"]
| }
```

### 2.2. 인증 정보 요청

```
> POST /oauth/token HTTP/1.1
> Host: localhost:8080
> User-Agent: insomnia/2021.4.0
> Cookie: JSESSIONID=49EC0B7588ED248E1DECE1A16049416E
> content-type: application/x-www-form-urlencoded
> Authorization: Basic Q0xJRU5UX0lEOkNMSUVOVF9TRUNSRVQ=
> Accept: */*
> Content-Length: 51

| username=junhyunny&password=123&grant_type=password
```

### 2.3. 인증 토큰 응답

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJqdW5oeXVubnkiLCJzY29wZSI6WyJyZWFkIiwicHJvZmlsZSJdLCJvdGhlckluZm9tYXRpb24iOiJvdGhlckluZm9tYXRpb24iLCJleHAiOjE2MjU1NTMzOTgsImF1dGhvcml0aWVzIjpbIkFETUlOIl0sImp0aSI6IjljZjIxMjAyLTI1NjMtNDE4MS1iZmE2LWY4NjNhOTg2M2VlMiIsImNsaWVudF9pZCI6IkNMSUVOVF9JRCIsIm1lbWJlcklkIjoianVuaHl1bm55In0.ERx7jP7ZHkkihWQltFnq_GhgTmbNpMqgxw7_PI777BQ",
  "token_type": "bearer",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJqdW5oeXVubnkiLCJzY29wZSI6WyJyZWFkIiwicHJvZmlsZSJdLCJhdGkiOiI5Y2YyMTIwMi0yNTYzLTQxODEtYmZhNi1mODYzYTk4NjNlZTIiLCJvdGhlckluZm9tYXRpb24iOiJvdGhlckluZm9tYXRpb24iLCJhdXRob3JpdGllcyI6WyJBRE1JTiJdLCJqdGkiOiI0MjM2NjRlOS0yZDQ5LTQ3NTktOWM2ZS0xOTZjOWEwYjhkZjEiLCJjbGllbnRfaWQiOiJDTElFTlRfSUQiLCJtZW1iZXJJZCI6Imp1bmh5dW5ueSJ9.JoIolZ0ezaWIzqMKW-03kB3T4SXpk7-qvx-dc1ApR4Y",
  "expires_in": 86399,
  "scope": "read profile",
  "otherInfomation": "otherInfomation",
  "memberId": "junhyunny",
  "jti": "9cf21202-2563-4181-bfa6-f863a9863ee2"
}
```

### 2.4. 사용자 정보 요청(api/member/user-info-using-token)

```
> GET /api/member/user-info-using-token HTTP/1.1
> Host: localhost:8080
> User-Agent: insomnia/2021.4.0
> Cookie: JSESSIONID=49EC0B7588ED248E1DECE1A16049416E
> Authorization: bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJqdW5oeXVubnkiLCJzY29wZSI6WyJyZWFkIiwicHJvZmlsZSJdLCJvdGhlckluZm9tYXRpb24iOiJvdGhlckluZm9tYXRpb24iLCJleHAiOjE2MjU1NTMzOTgsImF1dGhvcml0aWVzIjpbIkFETUlOIl0sImp0aSI6IjljZjIxMjAyLTI1NjMtNDE4MS1iZmE2LWY4NjNhOTg2M2VlMiIsImNsaWVudF9pZCI6IkNMSUVOVF9JRCIsIm1lbWJlcklkIjoianVuaHl1bm55In0.ERx7jP7ZHkkihWQltFnq_GhgTmbNpMqgxw7_PI777BQ
> Accept: */*
```

### 2.5. 사용자 정보 응답

```json
{
  "id": "junhyunny",
  "password": "$2a$10$i8z0rp0kCko7OMZIqGvrled7ARlWbMW8hFXrPMkmHVbG66Cxwtey6",
  "authroities": [
    "ADMIN"
  ]
}
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-01-11-handler-method-argument-resolver>

[jwt-blogLink]: https://junhyunny.github.io/spring-boot/spring-security/spring-security-example/
[tokenenhancer-blogLink]: https://junhyunny.github.io/spring-boot/spring-security/token-enhancer/