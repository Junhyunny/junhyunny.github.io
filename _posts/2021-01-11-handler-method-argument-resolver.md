---
title: "HandlerMethodArgumentResolver 인터페이스"
search: false
category:
  - spring-boot
last_modified_at: 2021-01-30T09:00:00
---

<br>

[Token Enhancer][tokenenhancer-blogLink] 포스트에서 JWT Token에 클라이언트 정보를 추가하는 기능을 구현해보았습니다. 
이번 글에서는 HandlerMethodArgumentResolver 인터페이스와 커스텀 애너테이션을 이용하여 토큰에서 필요한 정보를 쉽게 추출하는 방법에 대해서 알아보도록 하겠습니다.

## 패키지 구조
<p align="left"><img src="/images/handler-method-argument-resolver-1.JPG" width="30%"></p>

## TokenMember 애너테이션 구현
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

## CustomMethodArgumentResolver 클래스 구현
supportsParameter 메소드를 통해 해당 파라미터에 대한 처리를 수행할지 말지 여부를 체크합니다. 
이후 resolveArgument 메소드를 통해 토큰에서 필요한 데이터를 추출하여 Member 객체에 SETTING 후 이를 반환합니다. 
반환된 객체는 요청 Parameter로써 Controller에게 전달됩니다.

##### ServletInvocableHandlerMethod 내부 supportsParameter 메소드와 resolveArgument 메소드
<p align="center"><img src="/images/handler-method-argument-resolver-2.JPG"></p>

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

## WebConfig 클래스 구현
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

## MemberController 클래스 구현
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

## 테스트 결과
##### 유저 정보 등록 (ADMIN)
<p align="left"><img src="/images/handler-method-argument-resolver-3.JPG"></p>

##### 인증 정보 획득
<p align="left"><img src="/images/handler-method-argument-resolver-4.JPG"></p>

##### 사용자 정보 요청 (/api/member/user-info-using-token)
<p align="left"><img src="/images/handler-method-argument-resolver-5.JPG"></p>

##### resolveArgments 메소드, 토큰 내 사용자 정보 추출
<p align="left"><img src="/images/handler-method-argument-resolver-6.JPG"></p>

##### requestUserInfoUsingToken 메소드, 사용자 정보 확인
<p align="left"><img src="/images/handler-method-argument-resolver-7.JPG"></p>

## OPINION
사이드 프로젝트를 진행하면서 회사 가이드가 아닌 방식으로 프레임워크의 기능들을 샅샅히 사용해보며 서버를 구성해나가는데 큰 재미를 느끼고 있습니다. 

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action>

#### REFERENCE
- [Spring Security 기반 JWT 인증 방식 예제][jwt-blogLink]
- [Token Enhancer][tokenenhancer-blogLink]

[jwt-blogLink]: https://junhyunny.github.io/spring-boot/spring-security/spring-security-example/
[tokenenhancer-blogLink]: https://junhyunny.github.io/spring-boot/spring-security/token-enhancer/