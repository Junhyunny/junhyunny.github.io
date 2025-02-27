---
title: "스프링 HandlerMethodArgumentResolver 컴포넌트"
search: false
category:
  - spring-boot
last_modified_at: 2021-08-21T17:00:00
---

<br/>

## 1. HandlerMethodArgumentResolver Interface

> Spring Document<br/>
> Strategy interface for resolving method parameters into argument values in the context of a given request.

스프링 서버 애플리케이션이 HTTP 요청을 처리하는 엔드포인트(endpoint) 메소드의 매개변수에 원하는 값을 매핑할 수 있는 컴포넌트의 인터페이스다. 자주 사용하는 `@RequestBody`, `@RequestParam`, `@PathVariable` 같은 애너테이션들도 각 `HandlerMethodArgumentResolver` 구현체들을 통해 값들이 매칭된다. 인터페이스의 책임을 살펴보자.

- supportsParameter 메소드
  - 자신이 지원하는 메소드 파라미터 타입인지 확인한다.
- resolveArgument 메소드
  - 메소드 파라미터 인수에 삽입할 값을 추출한다. 

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

## 2. When is HandlerMethodArgumentResolver instance invoked?

`HandlerMethodArgumentResolver` 인스턴스는 어느 시점에 호출될까? 사용자 요청이 들어오면 스프링 애플리케이션은 아래 이미지와 같은 실행 흐름을 갖는다.

1. 사용자가 요청을 보낸다.
2. 필터 체인을 통과 후 `DispatcherServlet`으로 진입한다.
3. `DispatcherServlet`은 해당 요청을 수행할 `HandlerMethod` 인스턴스를 결정한다. 
4. `DispatcherServlet`은 `RequestMappingHandlerAdapter`에게 `HandlerMethod` 인스턴스를 전달한다. 
5. `RequestMappingHandlerAdapter`은 `HandlerMethod` 인스턴스에게 필요한 인수 값을 준비하도록 요청한다. 
  - `HandlerMethod` 인스턴스는 자신에게 등록된 `리졸버(resolver)`들을 통해 필요한 메소드 인수 값을 셋팅한다. 
6. `HandlerMethod` 인스턴스는 자신과 연결된 컨트롤러의 메소드를 호출(invoke)한다. 

<div align="center">
  <img src="/images/posts/2021/handler-method-argument-resolver-01.png" width="100%" class="image__border">
</div>

<br/>

위에서 설명한 5번 과정을 자세히 들여다보자. InvocableHandlerMethod 클래스의 getMethodArgumentValues 메소드를 살펴보면 HandlerMethodArgumentResolver 인스턴스들이 호출되는 코드를 찾을 수 있다. 각 HandlerMethodArgumentResolver 인스턴스가 지원하는 파라미터가 사용되는 엔드 포인트 메소드로 연결되는 경우 HTTP 요청 정보로부터 쿼리 파라미터(혹은 요청 메시지)로부터 필요한 값을 추출한다.

- supportsParameter 메소드 
  - HandlerMethodArgumentResolver 객체에게 해당 파라미터를 지원하는지 확인한다. 
- resolveArgument 메소드 
  - 해당 파라미터를 지원하는 경우 요청 정보로부터 필요한 값을 추출한다. 

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

## 3. Example

예제 코드를 살펴보자. 쿼리 파라미터로부터 날짜 정보를 추출해서 LocalDate 객체로 변경하는 리졸버 객체를 구현한다.

- supportsParameter 메소드
  - 컨트롤러 엔드포인트 메소드의 파라미터가 LocalDate 타입인지 확인한다.
- resolveArgument 메소드
  - HTTP 요청에서 엔드포인트 메소드의 파라미터 이름을 가진 쿼리가 있ㄴ느지 확인한다.
  - 값이 존재하는 경우에만 `yyyy-MM-dd` 포맷으로 파싱(parsing)한다.
  - 값이 없는 경우 `null`을 반환한다.

```java
package blog.in.action.handler;

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
        assert parameterName != null;
        Optional<String> queryDate = Optional.ofNullable(nativeWebRequest.getParameter(parameterName));
        return queryDate
                .filter(StringUtils::hasText)
                .map((stringDate) -> LocalDate.parse(stringDate, DateTimeFormatter.ISO_LOCAL_DATE))
                .orElse(null);
    }
}
```

리졸버를 구현했으면 스프링 컨텍스트에 등록한다. 설정 객체를 만들고 위에서 만든 HandlerMethodArgumentResolver 인스턴스를 등록한다.

- WebMvcConfigurer 인터페이스를 구현하여 addArgumentResolvers 메소드를 재구현한다.

```java
package blog.in.action.config;

import blog.in.action.handler.LocalDateHandlerMethodArgumentResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@RequiredArgsConstructor
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final LocalDateHandlerMethodArgumentResolver customLocalDateResolver;

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(customLocalDateResolver);
    }
}
```

다음과 같은 엔드포인트를 갖는 컨트롤러 객체를 만든다.

```java
package blog.in.action.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api")
public class UserController {

    @GetMapping("/users")
    public List<String> searchByJoinDate(LocalDate beginDate, LocalDate endDate) {
        return Arrays.asList(
                String.format("user1 %s", beginDate),
                String.format("user2 %s", endDate)
        );
    }
}
```

## 4. Verify

위에서 구현한 코드가 잘 동작하는지 검증해보자. 서비스를 실행하고 아래와 같은 cURL 요청을 보내면 쿼리 파라미터에서 파싱된 데이터가 사용된 응답을 받을 수 있다.

```
$ curl "http://localhost:8080/api/users?beginDate=2021-01-11&endDate=2021-02-01" | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    39    0    39    0     0  19519      0 --:--:-- --:--:-- --:--:-- 39000
[
  "user1 2021-01-11",
  "user2 2021-02-01"
]
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-01-11-handler-method-argument-resolver>

#### REFERENCE

- <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/method/support/HandlerMethodArgumentResolver.html>
