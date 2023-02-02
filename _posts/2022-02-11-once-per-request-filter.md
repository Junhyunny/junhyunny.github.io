---
title: "OncePerRequestFilter"
search: false
category:
  - spring-boot
last_modified_at: 2022-02-11T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Spring Filter, Interceptor 그리고 AOP][filter-interceptor-and-aop-link]
- [Redirect and Forwarding][redirect-and-forwarding-link]

## 0. 들어가면서

인증 필터(authentication filter)를 구현 예시들을 찾아보면 `OncePerRequestFilter` 클래스를 상속받은 경우를 많이 볼 수 있습니다. 
처음 접한 클래스이고 특수한 성격을 가지고 있어서 관련된 내용을 정리해보았습니다. 

## 1. 필터(Filter)

우선 필터에 대한 기능부터 간단히 소개하고 포스트를 이어나가겠습니다. 
필터는 웹 어플리케이션(Web Application)에 등록합니다. 
요청 스레드가 서블릿 컨테이너(Servlet Container)에 도착하기 전에 수행됩니다. 
필터는 사용자의 요청 정보에 대한 검증하고 필요에 따라 데이터를 추가하거나 변조할 수 있습니다. 
응답 정보에 대한 변경도 가능합니다. 
주로 전역적으로 처리해야하는 인코딩, 보안 관련된 일을 수행합니다. 

### 1.1. 필터 사용 예
- 오류 처리 기능
- 인코딩 처리 기능
- 웹 보안 관련 기능 처리
- 데이터 압축이나 변환 기능
- 요청이나 응답에 대한 로그
- 로그인 여부, 권한 검사 같은 인증 기능

##### 필터 위치

<p align="center">
    <img src="/images/once-per-request-filter-1.JPG" width="60%" class="image__border">
</p>
<center>https://justforchangesake.wordpress.com/2014/05/07/spring-mvc-request-life-cycle/</center>

## 2. OncePerRequestFilter

`OncePerRequestFilter` 클래스는 이름에서 유추할 수 있듯이 한 요청에 대해 딱 한 번만 실행하는 필터입니다. 
예를 들어, 포워딩(forwarding)이 발생하면 필터 체인이 다시 동작면서, 인증처럼 한 번만 필요한 처리를 불필요하게 여러 번 수행하게 됩니다.  

##### 포워딩 과정

<p align="center">
    <img src="/images/once-per-request-filter-2.JPG" width="100%" class="image__border">
</p>

### 2.1. OncePerRequestFilter 클래스의 doFilter 메소드

`OncePerRequestFilter` 클래스의 `doFilter` 메소드를 열어보면 어떤 식으로 동작하는지 직관적으로 알 수 있습니다. 
최초 실행 시 `ServletRequest` 객체에 자신의 이름과 수행하였음을 표시하기 위한 `true` 값을 함께 넣어둡니다. 
그리고 `doFilterInternal` 메소드를 통해 자신의 기능을 수행합니다. 
리다이렉트 등으로 다시 실행되는 경우 이전 수행에서 요청 객체에 담아뒀던 수행 여부를 확인합니다. 
이미 수행되었음이 확인되면 필터 체인에게 요청과 응답 객체를 전달합니다.

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

## 3. OncePerReqeustFilter 테스트

일반 필터와 `OncePerRequestFilter`를 상속받은 필터를 만듭니다. 
특정 요청에 대해 포워딩 처리를 수행합니다. 
일반 필터와 `OncePerRequestFilter`를 상속받은 필터의 수행 횟수를 로그로 확인합니다. 

### 3.1. 구현 코드

#### 3.1.1. CustomFilter 클래스
- 빈(bean)으로 만들지 않고, 일반 클래스로 만들었습니다.
- 일반 필터를 상속받았으므로 2회 수행되길 예상합니다. 

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

#### 3.1.2. CustomOncePerRequestFilter 클래스
- `@Component` 애너테이션을 통해 빈으로 생성합니다.
- `OncePerRequestFilter` 필터를 상속받았으므로 1회 수행되길 예상합니다.

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

### 3.1.3. WebConfig 클래스
- CustomFilter 클래스를 필터 체인에 등록합니다.
- CustomFilter 클래스를 빈으로 만들지 않은 이유는 해당 과정에서 디스패치(dispatch) 타입을 지정해줘야하기 때문입니다.
    - 일반적인 필터는 생성시에 디스패치 타입이 `REQUEST`만 지정됩니다.
    - Config 설정을 통해 해당 필터가 `REQUEST`, `FORWARD` 처리 시에 모두 사용되도록 지정합니다. 
- `OncePerRequestFilter` 필터는 모든 종류의 디스패치에서 적용됩니다.
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

#### 3.1.1. TestController 클래스

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
    public void willForward(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
        request.getRequestDispatcher("/forwarded").forward(request, response);
    }

    @GetMapping("/forwarded")
    public String forwarded() {
        return "forwarded";
    }
}
```

### 3.2. 테스트 결과 로그 확인

- 브라우저를 이용해 `/will-forward` 경로로 요청을 수행합니다.
- `doFilter in CustomFilter` 로그가 2회 수행됩니다.
- `doFilter in CustomOncePerRequestFilter` 로그는 1회 수행됩니다.

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v2.6.3)

2022-02-12 06:19:55.017  INFO 94294 --- [           main] action.in.blog.ActionInBlogApplication   : Starting ActionInBlogApplication using Java 11.0.13 on junhyunk-a01.vmware.com with PID 94294 (/Users/junhyunk/Desktop/workspace/blog-in-action/2022-02-11-once-per-request-filter/action-in-blog/target/classes started by junhyunk in /Users/junhyunk/Desktop/workspace/blog-in-action/2022-02-11-once-per-request-filter/action-in-blog)
2022-02-12 06:19:55.021  INFO 94294 --- [           main] action.in.blog.ActionInBlogApplication   : No active profile set, falling back to default profiles: default
2022-02-12 06:19:55.644  INFO 94294 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2022-02-12 06:19:55.650  INFO 94294 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2022-02-12 06:19:55.650  INFO 94294 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.56]
2022-02-12 06:19:55.693  INFO 94294 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
2022-02-12 06:19:55.693  INFO 94294 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 581 ms
2022-02-12 06:19:55.938  INFO 94294 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2022-02-12 06:19:55.947  INFO 94294 --- [           main] action.in.blog.ActionInBlogApplication   : Started ActionInBlogApplication in 1.245 seconds (JVM running for 1.751)
2022-02-12 06:20:06.722  INFO 94294 --- [nio-8080-exec-1] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring DispatcherServlet 'dispatcherServlet'
2022-02-12 06:20:06.723  INFO 94294 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : Initializing Servlet 'dispatcherServlet'
2022-02-12 06:20:06.723  INFO 94294 --- [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : Completed initialization in 0 ms
2022-02-12 06:20:06.727  INFO 94294 --- [nio-8080-exec-1] action.in.blog.filters.CustomFilter      : doFilter in CustomFilter
2022-02-12 06:20:06.728  INFO 94294 --- [nio-8080-exec-1] a.i.b.f.CustomOncePerRequestFilter       : doFilter in CustomOncePerRequestFilter
2022-02-12 06:20:06.744  INFO 94294 --- [nio-8080-exec-1] action.in.blog.filters.CustomFilter      : doFilter in CustomFilter
```

## CLOSING

참고한 포스트 중에 어떤 분은 리다이렉트(redirect)를 통해 `OncePerReqeustFilter` 클래스 테스트를 하였는데, 이해가 되지 않는 부분이 있습니다. 
일반적인 리다이렉트는 브라우저가 서버로부터 리다이렉트하라는 302 응답을 받은 후 전달받은 `Location`으로 재요청을 하는 프로세스입니다. 
이 경우 서버 입장에선 2회의 요청이 들어온 것이므로 `OncePerReqeustFilter` 필터라도 동일하게 2회 수행될 것으로 예상됩니다. 
제가 테스트해 본 결과도 2회 수행되었는데, 리다이렉트로 `OncePerReqeustFilter` 테스트가 성공하신 분은 어떠 식이었는지 궁금합니다. 

##### 리다이렉트 과정

<p align="center">
    <img src="/images/once-per-request-filter-3.JPG" width="100%" class="image__border">
</p>

##### GitHub spring-mvc-showcase 레포지토리 이슈
- `MockMvc`를 이용한 포워딩 테스트를 진행하고 싶었지만, 관련된 기능은 제공되지 않은 것 같습니다. 
- 찾아보니 스프링 진영에서도 관련된 내용에 대한 의견을 나누고는 있는 것 같습니다.
- <https://github.com/spring-attic/spring-mvc-showcase/issues/42>

<p align="center">
    <img src="/images/once-per-request-filter-4.JPG" width="80%" class="image__border">
</p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-02-11-once-per-request-filter>

#### REFERENCE
- <https://dev-racoon.tistory.com/34>
- <https://dololak.tistory.com/607>

[filter-interceptor-and-aop-link]: https://junhyunny.github.io/spring-boot/filter-interceptor-and-aop/
[redirect-and-forwarding-link]: https://junhyunny.github.io/information/redirect-and-forwarding/