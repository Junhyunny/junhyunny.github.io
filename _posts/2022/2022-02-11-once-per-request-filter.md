---
title: "OncePerRequestFilter 클래스"
search: false
category:
  - spring-boot
last_modified_at: 2025-11-18T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Filter, Interceptor and AOP in Spring][filter-interceptor-and-aop-link]
- [Redirect and Forwarding][redirect-and-forwarding-link]

## 0. 들어가면서

인증 필터(authentication filter)를 구현 예시들을 찾아보면 `OncePerRequestFilter` 클래스를 상속받은 경우를 많이 볼 수 있다. 처음 사용해보는 클래스이고 특수한 성격을 갖고 있어서 관련된 내용을 정리해봤다.

## 1. 필터(Filter)

우선 필터 기능부터 간단히 알아보자. 필터는 웹 어플리케이션(Web Application) 영역에서 동작하는 컴포넌트다. 요청이 서블릿 컨테이너(servlet container)에 전달되기 전에 수행된다. 

<div align="center">
  <img src="/images/posts/2022/once-per-request-filter-01.png" width="60%" class="image__border">
</div>
<center>https://justforchangesake.wordpress.com/2014/05/07/spring-mvc-request-life-cycle/</center>

<br/>

필터는 사용자의 요청 정보에 대해 검증하고, 필요하다면 데이터를 추가하거나 변조할 수 있다. 응답 정보에 대한 변경도 가능하다. 주로 전역적으로 처리해야 하는 인코딩, 보안 관련된 일을 수행한다. 필터를 활용한 유즈-케이스는 다음과 같다.

- 오류 처리 기능
- 인코딩 처리 기능
- 웹 보안 관련 기능 처리
- 데이터 압축이나 변환 기능
- 요청이나 응답에 대한 로그
- 로그인 여부, 권한 검사 같은 인증 기능

## 2. OncePerRequestFilter class

`OncePerRequestFilter` 클래스는 이름에서 유추할 수 있듯이 한 요청에 대해 한 번만 실행되는 필터이다. 예를 들어, 포워딩(forwarding)이 발생하면 필터 체인이 다시 동작하면서, 인증처럼 한 번만 필요한 처리를 불필요하게 여러 번 수행하게 된다.

<div align="center">
  <img src="/images/posts/2022/once-per-request-filter-02.png" width="100%" class="image__border">
</div>

<br/>

`OncePerRequestFilter` 클래스의 `doFilter` 메소드를 열어보면 어떤 식으로 동작하는지 직관적으로 알 수 있다.

1. 최초 실행 시 `ServletRequest` 객체에 자신의 이름과 수행하였음을 표시하기 위한 `true` 값을 함께 저장한다.
2. `doFilterInternal` 메소드를 통해 자신의 기능을 수행한다.
3. 포워딩 등으로 다시 실행되는 경우 이전 수행에서 요청 객체에 담아뒀던 수행 여부를 확인한다. 이미 수행되었다면 자신의 동작은 스킵하고, 다음 필터를 실행한다.

```java
public abstract class OncePerRequestFilter extends GenericFilterBean {

    public final void doFilter(ServletRequest request, ServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        if (request instanceof HttpServletRequest && response instanceof HttpServletResponse) {
            HttpServletRequest httpRequest = (HttpServletRequest)request;
            HttpServletResponse httpResponse = (HttpServletResponse)response;
            String alreadyFilteredAttributeName = this.getAlreadyFilteredAttributeName();
            boolean hasAlreadyFilteredAttribute = request.getAttribute(alreadyFilteredAttributeName) != null;
            if (!this.skipDispatch(httpRequest) && !this.shouldNotFilter(httpRequest)) {
                if (hasAlreadyFilteredAttribute) {
                    if (DispatcherType.ERROR.equals(request.getDispatcherType())) {
                        this.doFilterNestedErrorDispatch(httpRequest, httpResponse, filterChain);
                        return;
                    }
                    filterChain.doFilter(request, response);
                } else {
                    request.setAttribute(alreadyFilteredAttributeName, Boolean.TRUE);
                    try {
                        this.doFilterInternal(httpRequest, httpResponse, filterChain);
                    } finally {
                        request.removeAttribute(alreadyFilteredAttributeName);
                    }
                }
            } else {
                filterChain.doFilter(request, response);
            }
        } else {
            throw new ServletException("OncePerRequestFilter just supports HTTP requests");
        }
    }
}
```

## 3. OncePerReqeustFilter test

일반 필터와 `OncePerRequestFilter`를 상속받은 필터를 만들고, 특정 요청에 대해 포워딩 처리를 수행한다. 일반 필터와 `OncePerRequestFilter`를 상속받은 필터의 수행 횟수를 로그로 확인한다.

### 3.1. Ipmlmentation code

먼저 일반 필터를 상속 받은 CustomFilter 클래스 코드를 살펴보자.

- 빈(bean)으로 만들지 않고, 일반 클래스로 만들었다.
- 일반 필터를 상속받았으므로 2회 수행되길 예상한다.

```java
package action.in.blog.filters;

import lombok.extern.log4j.Log4j2;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import java.io.IOException;

@Log4j2
public class CustomFilter implements Filter {

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        log.info("doFilter in CustomFilter");
        filterChain.doFilter(servletRequest, servletResponse);
    }
}
```

다음 OncePerRequestFilter를 상속 받은 CustomOncePerRequestFilter 클래스 코드를 살펴보자.

- `@Component` 애너테이션을 통해 빈으로 생성한다.
- `OncePerRequestFilter` 필터를 상속받았으므로 1회 수행되길 예상한다.

```java
package action.in.blog.filters;

import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Log4j2
@Component
public class CustomOncePerRequestFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        log.info("doFilter in CustomOncePerRequestFilter");
        filterChain.doFilter(request, response);
    }
}
```

마지막으로 웹 애플리케이션 설정을 추가한 WebConfig 클래스를 살펴보자.

- CustomFilter 클래스를 필터 체인에 등록한다.
- CustomFilter 클래스를 빈으로 만들지 않은 이유는 해당 과정에서 디스패치(dispatch) 타입을 지정해줘야하기 때문이다.
  - 일반적인 필터는 생성시에 디스패치 타입이 `REQUEST`만 지정된다.
  - Config 설정을 통해 해당 필터가 `REQUEST`, `FORWARD` 처리 시에 모두 사용되도록 지정한다.
- `OncePerRequestFilter` 필터는 모든 종류의 디스패치에서 적용된다.
  - `FORWARD`, `INCLUDE`, `REQUEST`, `ASYNC`, `ERROR`

```java
package action.in.blog.config;

import action.in.blog.filters.CustomFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.servlet.DispatcherType;
import javax.servlet.Filter;
import java.util.EnumSet;

@Configuration
public class WebConfig {

    @Bean
    public FilterRegistrationBean<Filter> filterRegistrationBean() {
        FilterRegistrationBean<Filter> registrationBean = new FilterRegistrationBean();
        registrationBean.setFilter(new CustomFilter());
        registrationBean.addUrlPatterns("/*");
        registrationBean.setDispatcherTypes(EnumSet.of(DispatcherType.REQUEST, DispatcherType.FORWARD));
        return registrationBean;
    }
}
```

테스트를 위해 요청을 포워딩 하는 엔드 포인트를 만든다.

```java
package action.in.blog.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@RestController
public class TestController {

    @GetMapping("/will-redirect")
    public void willRedirect(HttpServletResponse response) throws IOException {
        response.sendRedirect("/redirected");
    }

    @GetMapping("/redirected")
    public String redirected() {
        return "redirected";
    }

    @GetMapping("/will-forward")
    public void willForward(
        HttpServletRequest request, 
        HttpServletResponse response
    ) throws IOException, ServletException {
        request.getRequestDispatcher("/forwarded").forward(request, response);
    }

    @GetMapping("/forwarded")
    public String forwarded() {
        return "forwarded";
    }
}
```

### 3.2. Check filtering times

`/will-forward` 경로로 요청을 보낸 후 각 필터의 로그가 몇 회 수행되는지 살펴보자. 브라우저를 통해 `/will-forward` 경로에 접근한다.

- `doFilter in CustomFilter` 로그가 2회 수행된다.
- `doFilter in CustomOncePerRequestFilter` 로그는 1회 수행된다.

```
2022-02-12 06:20:06.727  INFO 94294 --- [nio-8080-exec-1] action.in.blog.filters.CustomFilter      : doFilter in CustomFilter
2022-02-12 06:20:06.728  INFO 94294 --- [nio-8080-exec-1] a.i.b.f.CustomOncePerRequestFilter       : doFilter in CustomOncePerRequestFilter
2022-02-12 06:20:06.744  INFO 94294 --- [nio-8080-exec-1] action.in.blog.filters.CustomFilter      : doFilter in CustomFilter
```

## CLOSING

참고한 글 중에 어떤 사람은 리다이렉트(redirect)를 통해 `OncePerReqeustFilter` 클래스 테스트를 하였는데, 이해가 되지 않는다. 일반적인 리다이렉트는 브라우저가 서버로부터 리다이렉트하라는 302 응답을 받은 후 전달받은 `Location`으로 재요청을 하는 프로세스이다. 

<div align="center">
  <img src="/images/posts/2022/once-per-request-filter-03.png" width="100%" class="image__border">
</div>

<br/>

이 경우 서버 입장에선 2회의 요청이 들어온 것이므로 `OncePerReqeustFilter` 필터라도 동일하게 2회 수행될 것으로 예상된다. 실제로 직접 테스트 해봤을 때 2회 수행되었는데, 리다이렉트로 `OncePerReqeustFilter` 테스트가 성공한 사람은 어떤 설정이었는지 궁금하다.

`MockMvc`를 이용한 포워딩 테스트를 진행하고 싶었지만, 관련된 기능은 제공되지 않은 것 같다. 찾아보니 스프링 진영에서도 관련된 내용에 대한 의견을 나누고는 있는 것 같다.

<div align="center">
  <img src="/images/posts/2022/once-per-request-filter-04.png" width="80%" class="image__border">
</div>
<center>https://github.com/spring-attic/spring-mvc-showcase/issues/42</center>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-02-11-once-per-request-filter>

#### REFERENCE

- <https://dev-racoon.tistory.com/34>
- <https://dololak.tistory.com/607>

[filter-interceptor-and-aop-link]: https://junhyunny.github.io/spring-boot/filter-interceptor-and-aop/
[redirect-and-forwarding-link]: https://junhyunny.github.io/information/redirect-and-forwarding/