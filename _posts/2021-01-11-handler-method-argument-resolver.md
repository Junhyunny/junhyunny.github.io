---
title: "HandlerMethodArgumentResolver 인터페이스"
search: false
category:
  - spring-boot
last_modified_at: 2021-08-21T17:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Spring Security JWT(Json Web Token) OAuth 인증 예제][spring-security-example-link]

## 1. HandlerMethodArgumentResolver 인터페이스

> Spring Document<br/>
> Strategy interface for resolving method parameters into argument values in the context of a given request.

서버에 주어진 요청을 처리하는 메소드의 매개변수에 원하는 값을 매핑할 수 있는 전략적 인터페이스입니다. 
자주 사용하는 `@RequestBody`, `@RequestParam`, `@PathVariable` 같은 애너테이션들도 각자의  `HandlerMethodArgumentResolver` 구현체들을 통해 값들이 매칭됩니다. 

##### HandlerMethodArgumentResolver 인터페이스 코드

* supportsParameter 메소드를 통해 자신이 지원하는 메소드 파라미터인지 확인합니다.
* resolveArgument 메소드를 통해 메소드 인수에 삽입할 값을 추출합니다. 

```java
package org.springframework.web.method.support;

import org.springframework.core.MethodParameter;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;

public interface HandlerMethodArgumentResolver {
    boolean supportsParameter(MethodParameter var1);

    @Nullable
    Object resolveArgument(MethodParameter var1, 
                           @Nullable ModelAndViewContainer var2, 
                           NativeWebRequest var3, 
                           @Nullable WebDataBinderFactory var4) throws Exception;
}
```

## 2. HandlerMethodArgumentResolver 인터페이스 호출 시점

다음과 같은 과정을 통해 `HandlerMethodArgumentResolver` 인터페이스 구현체의 로직이 수행됩니다. 

* 사용자 요청이 서비스로 요청됩니다.
* 필터 체인을 통과 후 `DispatcherServlet`으로 진입합니다.
* `DispatcherServlet`은 해당 요청을 수행할 `HandlerMethod` 인스턴스를 결정합니다. 
* `DispatcherServlet`은 `RequestMappingHandlerAdapter`에게 `HandlerMethod` 인스턴스를 전달합니다. 
* `RequestMappingHandlerAdapter`은 `HandlerMethod` 인스턴스에게 필요한 인수 값을 준비하도록 요청합니다. 
    * `HandlerMethod` 인스턴스는 자신에게 등록된 `리졸버(resolver)`들을 통해 필요한 메소드 인수 값을 셋팅(setting)합니다. 
* `HandlerMethod` 인스턴스는 자신과 연결된 컨트롤러의 메소드를 호출(invoke)합니다. 

<p align="center">
    <img src="/images/handler-method-argument-resolver-1.JPG" width="100%" class="image__border">
</p>

## 3. InvocableHandlerMethod 클래스 getMethodArgumentValues 메소드

`InvocableHandlerMethod` 클래스의 `getMethodArgumentValues` 메소드에서 리졸버들에게 자신이 지원하는 파라미터 값을 추출하도록 시킵니다. 

* `supportsParameter` 메소드 
    * `resolvers` 객체에게 해당 파라미터를 지원하는지 물어봅니다. 
* `resolveArgument` 메소드 
    * 해당 파라미터를 지원하는 경우 요청 정보로부터 필요한 값을 추출합니다. 

```java
public class InvocableHandlerMethod extends HandlerMethod {

    // ...

    protected Object[] getMethodArgumentValues(NativeWebRequest request, @Nullable ModelAndViewContainer mavContainer, Object... providedArgs) throws Exception {
        MethodParameter[] parameters = this.getMethodParameters();
        if (ObjectUtils.isEmpty(parameters)) {
            return EMPTY_ARGS;
        } else {
            Object[] args = new Object[parameters.length];

            for(int i = 0; i < parameters.length; ++i) {
                MethodParameter parameter = parameters[i];
                parameter.initParameterNameDiscovery(this.parameterNameDiscoverer);
                args[i] = findProvidedArgument(parameter, providedArgs);
                if (args[i] == null) {
                    if (!this.resolvers.supportsParameter(parameter)) {
                        throw new IllegalStateException(formatArgumentError(parameter, "No suitable resolver"));
                    }

                    try {
                        args[i] = this.resolvers.resolveArgument(parameter, mavContainer, request, this.dataBinderFactory);
                    } catch (Exception var10) {
                        if (logger.isDebugEnabled()) {
                            String exMsg = var10.getMessage();
                            if (exMsg != null && !exMsg.contains(parameter.getExecutable().toGenericString())) {
                                logger.debug(formatArgumentError(parameter, exMsg));
                            }
                        }

                        throw var10;
                    }
                }
            }

            return args;
        }
    }
}
```

## 4. Make Custom Resolvers

[Spring Security JWT(Json Web Token) OAuth 인증 예제][spring-security-example-link]에서 사용한 리소스 서버를 일부 변경하였습니다. 
이번 포스트에선 리졸버 구현에 집중할 예정이며, 기타 코드 설명이 필요하다면 [Spring Security JWT(Json Web Token) OAuth 인증 예제][spring-security-example-link] 포스트를 참고하시길 바랍니다. 

두 개의 리졸버를 구현할 예정입니다. 

* 요청 질의(query)의 날짜 문자열을 `LocalDate` 인스턴스로 변경하는 리졸버
* JWT 토큰에서 추출한 인증된 사용자 정보를 `AuthenticatedUser` 인스턴스로 변경하는 리졸버

### 4.1. LocalDateHandlerMethodArgumentResolver 클래스

* `supportsParameter` 메소드
    * 메소드의 파라미터가 `LocalDate`인 경우 인수 값 변경을 시도합니다.
* `resolveArgument` 메소드
    * 요청 정보에서 해당 파라미터 이름을 가진 쿼리(query) 인수 값을 구합니다.
    * 값이 존재하는 경우에만 `yyyy-MM-dd` 포맷으로 파싱(parsing)합니다.
    * 값이 없다면 `null`을 반환합니다.

```java
package blog.in.action.resolvers;

import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Component
public class LocalDateHandlerMethodArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter methodParameter) {
        return methodParameter.getParameter().getType().equals(LocalDate.class);
    }

    @Override
    public Object resolveArgument(MethodParameter methodParameter,
                                  ModelAndViewContainer modelAndViewContainer,
                                  NativeWebRequest nativeWebRequest,
                                  WebDataBinderFactory webDataBinderFactory) throws Exception {
        String parameterName = methodParameter.getParameterName();
        Optional<String> queryDate = Optional.of(nativeWebRequest.getParameter(parameterName));
        return queryDate
                .filter((stringDate) -> StringUtils.hasText(stringDate))
                .map((stringDate) -> LocalDate.parse(stringDate, DateTimeFormatter.ISO_LOCAL_DATE))
                .orElse(null);
    }
}
```

### 4.2. AuthHandlerMethodArgumentResolver 클래스

* `supportsParameter` 메소드
    * 메소드의 파라미터가 `AuthenticatedUser`인 경우 인수 값 추출을 시도합니다.
* `resolveArgument` 메소드
    * `JWT` 값이 유효한 경우 `OAuth2AuthenticationProcessingFilter`에서 토큰으로부터 추출한 인증된 사용자 정보를 `SecurityContext`에 저장하므로 이를 꺼내서 사용합니다.
    * 인증이 성공한 경우만 해당 리졸버까지 진입이 가능하므로 별도의 `null` 여부는 확인하지 않습니다. 
    * `AuthenticatedUser` 인스턴스에 인증된 사용자 `ID` 정보를 저장 후 반환합니다.

```java
package blog.in.action.resolvers;

import blog.in.action.dto.AuthenticatedUser;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
public class AuthHandlerMethodArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter methodParameter) {
        return methodParameter.getParameter().getType().equals(AuthenticatedUser.class);
    }

    @Override
    public Object resolveArgument(MethodParameter methodParameter,
                                  ModelAndViewContainer modelAndViewContainer,
                                  NativeWebRequest nativeWebRequest,
                                  WebDataBinderFactory webDataBinderFactory) throws Exception {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return AuthenticatedUser.builder()
                .id(authentication.getName())
                .build();
    }
}
```

### 4.3. WebConfig 클래스

* `WebMvcConfigurer` 인터페이스를 구현하여 필요한 기능들을 확장합니다.
* `addArgumentResolvers` 메소드를 확장하여 커스텀 리졸버들을 등록합니다. 

```java
package blog.in.action.web;

import blog.in.action.resolvers.AuthHandlerMethodArgumentResolver;
import blog.in.action.resolvers.LocalDateHandlerMethodArgumentResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

@RequiredArgsConstructor
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AuthHandlerMethodArgumentResolver authHandlerMethodArgumentResolver;

    private final LocalDateHandlerMethodArgumentResolver localDateHandlerMethodArgumentResolver;

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.addAll(Arrays.asList(authHandlerMethodArgumentResolver, localDateHandlerMethodArgumentResolver));
    }
}
```

### 4.4. MemberController 클래스

테스트를 위한 API 경로를 추가합니다. 
테스트에 용이하도록 가짜 데이터를 만들어서 반환합니다. 

* `searchUsersByJoinedDate` 메소드
    * 시작 날짜와 종료 날짜를 기준으로 가입 회원 정보를 반환합니다.
* `deactivateUser` 메소드
    * 인증된 사용자 정보를 사용하여 해당 계정을 비활성화시킵니다. 

```java
package blog.in.action.controller;

import blog.in.action.dto.AuthenticatedUser;
import blog.in.action.entity.Member;
import blog.in.action.service.MemberService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping(value = "/member")
public class MemberController {

    private final MemberService memberService;

    @GetMapping("/user-info")
    public Member requestUserInfo(@RequestParam("id") String id) {
        return memberService.findById(id);
    }

    @GetMapping("/search/joined-date")
    public List<Member> searchUsersByJoinedDate(LocalDate beginDate, LocalDate endDate) {
        return Arrays.asList(
                Member.builder()
                        .name("Junhyunny")
                        .joinedDate(beginDate)
                        .build(),
                Member.builder()
                        .name("Jua")
                        .joinedDate(endDate)
                        .build()
        );
    }

    @PutMapping("/deactivate")
    public Member deactivateUser(AuthenticatedUser authenticatedUser) {
        return Member.builder()
                .id(authenticatedUser.getId())
                .activate(false)
                .build();
    }
}
```

## 5. 테스트

해당 테스트는 인증 토큰이 필요합니다. 
인증 토큰을 얻는 자세한 방법을 확인하시려면 [Spring Security JWT(Json Web Token) OAuth 인증 예제][spring-security-example-link] 포스트의 테스트를 참조하시길 바랍니다. 

### 5.1. 인증 토큰 발급

우선 인증 서버로부터 인증 토큰을 발급 받습니다. 
포트 번호는 8080 입니다. 

```
$ curl -X POST http://localhost:8080/oauth/token\
       -H "Content-Type: application/x-www-form-urlencoded"\
       -u 'CLIENT_ID:CLIENT_SECRET'\
       -d "username=Junhyunny&password=123&grant_type=password" | jq .

  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  1073    0  1022  100    51   6022    300 --:--:-- --:--:-- --:--:--  6706
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJKdW5oeXVubnkiLCJzY29wZSI6WyJyZWFkIl0sIk1FTUJFUl9JRCI6Ikp1bmh5dW5ueSIsImV4cCI6MTY2MTI4NzcyNCwiYXV0aG9yaXRpZXMiOlsiQURNSU4iXSwianRpIjoiNmZjZGVhZTYtYzMwZi00YTFlLWEwZjItMGJiYTU3YmZlNTY3IiwiY2xpZW50X2lkIjoiQ0xJRU5UX0lEIiwiU0VSVklDRS1TRUNSRVQtS0VZIjoiSlVOSFlVTk5ZIEFVVEggU0VSVklDRSJ9.2pjWTSU_4teYLRLRV4dStql-gRnhmQIAFY0eTEHVIxI",
  "token_type": "bearer",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJKdW5oeXVubnkiLCJzY29wZSI6WyJyZWFkIl0sImF0aSI6IjZmY2RlYWU2LWMzMGYtNGExZS1hMGYyLTBiYmE1N2JmZTU2NyIsIk1FTUJFUl9JRCI6Ikp1bmh5dW5ueSIsImV4cCI6MTY2MTM1OTcyNCwiYXV0aG9yaXRpZXMiOlsiQURNSU4iXSwianRpIjoiZTUwODJlODEtYzdlYy00MGRlLWFlMTktODE4MDRlNGU5Mjc3IiwiY2xpZW50X2lkIjoiQ0xJRU5UX0lEIiwiU0VSVklDRS1TRUNSRVQtS0VZIjoiSlVOSFlVTk5ZIEFVVEggU0VSVklDRSJ9.aG6pH0-Zb4c1Diu4PeRqr6vHskwpC8BWVujXBoWl7_Q",
  "expires_in": 6001,
  "scope": "read",
  "MEMBER_ID": "Junhyunny",
  "SERVICE-SECRET-KEY": "JUNHYUNNY AUTH SERVICE",
  "jti": "6fcdeae6-c30f-4a1e-a0f2-0bba57bfe567"
}
```

### 5.2. 가입한 날짜 별 사용자 정보 조회

발급한 인증 토큰과 함께 리소스 서버로 가입한 날짜 조건에 맞는 사용자들의 정보를 요청합니다. 
포트 번호는 8081 입니다.

* 요청 질의 정보에 `beginDate`, `endDate` 값을 전달합니다.
* 요청 질의에 해당되는 사용자 정보가 반환됩니다.

```
$ curl "http://localhost:8081/member/search/joined-date?beginDate=2021-01-01&endDate=2021-12-31"\
   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJKdW5oeXVubnkiLCJzY29wZSI6WyJyZWFkIl0sIk1FTUJFUl9JRCI6Ikp1bmh5dW5ueSIsImV4cCI6MTY2MTI4NzcyNCwiYXV0aG9yaXRpZXMiOlsiQURNSU4iXSwianRpIjoiNmZjZGVhZTYtYzMwZi00YTFlLWEwZjItMGJiYTU3YmZlNTY3IiwiY2xpZW50X2lkIjoiQ0xJRU5UX0lEIiwiU0VSVklDRS1TRUNSRVQtS0VZIjoiSlVOSFlVTk5ZIEFVVEggU0VSVklDRSJ9.2pjWTSU_4teYLRLRV4dStql-gRnhmQIAFY0eTEHVIxI" | jq .

  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   199    0   199    0     0   1107      0 --:--:-- --:--:-- --:--:--  1150
[
  {
    "id": null,
    "name": "Junhyunny",
    "email": null,
    "address": null,
    "joinedDate": "2021-01-01",
    "activate": false
  },
  {
    "id": null,
    "name": "Jua",
    "email": null,
    "address": null,
    "joinedDate": "2021-12-31",
    "activate": false
  }
]
```

### 5.3. 사용자 비활성화

발급한 인증 토큰과 함께 리소스 서버로 인증된 사용자의 비활성화를 요청합니다. 
포트 번호는 8081 입니다.

* 전달한 토큰에서 추출한 ID 값을 가진 사용자 정보가 반환됩니다. 

```
$ curl -X PUT "http://localhost:8081/member/deactivate"\
       -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJKdW5oeXVubnkiLCJzY29wZSI6WyJyZWFkIl0sIk1FTUJFUl9JRCI6Ikp1bmh5dW5ueSIsImV4cCI6MTY2MTI4NzcyNCwiYXV0aG9yaXRpZXMiOlsiQURNSU4iXSwianRpIjoiNmZjZGVhZTYtYzMwZi00YTFlLWEwZjItMGJiYTU3YmZlNTY3IiwiY2xpZW50X2lkIjoiQ0xJRU5UX0lEIiwiU0VSVklDRS1TRUNSRVQtS0VZIjoiSlVOSFlVTk5ZIEFVVEggU0VSVklDRSJ9.2pjWTSU_4teYLRLRV4dStql-gRnhmQIAFY0eTEHVIxI" | jq .

  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    93    0    93    0     0   4903      0 --:--:-- --:--:-- --:--:-- 15500
{
  "id": "Junhyunny",
  "name": null,
  "email": null,
  "address": null,
  "joinedDate": null,
  "activate": false
}
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-01-11-handler-method-argument-resolver>

#### REFERENCE

* <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/method/support/HandlerMethodArgumentResolver.html>

[spring-security-example-link]: https://junhyunny.github.io/spring-boot/spring-security/spring-security-example/