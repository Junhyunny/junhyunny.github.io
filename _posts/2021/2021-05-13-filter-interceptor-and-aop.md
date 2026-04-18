---
title: "스프링(spring) 프레임워크의 필터(Filter), 인터셉터(Interceptor), AOP(Aspect Oriented Programming)"
search: false
category:
  - spring-boot
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

## 1. Location of Filter, Interceptor and AOP

필터(filter), 인터셉터(interceptor), AOP(aspect oriented programming)은 각자 수행되는 위치가 다르다. 각 기능들에 대한 내용을 정리하기 전에 어느 위치에서 동작하는 컴포넌트인지 살펴본다.

필터는 톰캣 같은 서블릿 컨테이너에서 동작한다. 요청이 서블릿으로 전달되기 전에 실행된다. 반면, 인터셉터는 스프링(spring) 프레임워크 내부에서 동작한다. 서블릿에 의해 요청을 처리할 적절한 핸들러가 결정되었다면, 핸들러 이전에 실행된다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/filter-interceptor-and-aop-01.png" width="80%" class="image__border">
</div>
<center>https://gowoonsori.com/blog/spring/architecture/</center>

<br/>

AOP 스프링 프레임워크 내부에서 동작한다.

- 스프링에서 관리하는 빈(bean) 객체의 메서드 호출 전이나 후에 시점을 빼앗아 실행된다.
- 예를 들면 `@Transactional` 애너테이션을 통한 트랜잭션 관리도 AOP 기능의 일종이다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/filter-interceptor-and-aop-02.png" width="80%" class="image__border">
</div>

## 2. Features of Filter, Interceptor and AOP

각 컴포넌트들의 기능들을 정리해보자. 필터는 다음과 같은 특징을 갖는다.

- 톰캣 같은 미들웨어 컨테이너 영역에서 동작이 수행된다. `javax.servlet.Filter` 인터페이스를 구현한다.
- 요청이 디스패처 서블릿(dispatcher servlet)에 전달되기 전에 실행된다.

필터는 다음과 같은 역할을 수행한다.

- 사용자 인증이나 권한 검사 같은 인증 프로세스를 수행
- 요청과 응답에 대한 로그를 출력
- 인코딩 관련 작업
- 웹 보안 관련 기능을 처리
  - CSRF 공격을 대비한 레퍼러(referrer) 확인
  - XSS 공격을 대비한 이스케이핑(escaping) 처리
  - CORS 설정 관련 처리

인터셉터는 다음과 같은 특징을 갖는다.

- 스프링 프레임워크 ``컨텍스트``(context) 영역에서 동작이 수행된다. `org.springframework.web.servlet.HandlerInterceptor` 인터페이스를 구현한다.
- 요청이 컨트롤러(controller)에게 전달되기 전에 실행된다.

안터셉터는 다음과 같은 역할을 수행한다.

- 로그인이나 사용자 권한 관리 같은 인증 프로세스 수행
- 사용자 세션 처리 수행
- 프로그램 실행 시간 측정

AOP는 다음과 같은 특징을 갖는다.

- 비즈니스 로직을 수행할 때 중복되는 코드를 줄이기 위한 프로그래밍 기법이다.
- 스프링 ``컨텍스트``에 빈으로 등록된 객체들의 특정 메서드 호출 전, 후 시점을 가로채어 공통적인 기능을 수행한다.

AOP는 다음과 같은 기능을 위해 사용된다.

- 로깅,
- 트랜잭션,
- 공통 에러 처리

## 3. Practice

간단한 예제 코드를 통해 각 컴포넌트들이 동작하는 순서를 로그로 살펴보자. BlogFilter 클래스는 javax.servlet.Filter 인터페이스를 구현한다.

```java
package blog.in.action.filters;

import lombok.extern.log4j.Log4j2;

import javax.servlet.*;
import java.io.IOException;

@Log4j2
public class BlogFilter implements Filter {

    private final String value;

    public BlogFilter(String value) {
        this.value = value;
    }


    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        log.info("==========\t" + value + " init filter");
    }

    @Override
    public void destroy() {
        log.info("==========\t" + value + " destroy filter");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        log.info("==========\t" + value + " before doFilter");
        chain.doFilter(request, response);
        log.info("==========\t" + value + " after doFilter");
    }
}
```

다음으로 BlogHandlerInterceptor 클래스는 org.springframework.web.servlet.HandlerInterceptor 인터페이스를 구현한다.

```java
package blog.in.action.interceptor;

import lombok.extern.log4j.Log4j2;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Log4j2
public class BlogHandlerInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        log.info("==========\tinterceptor preHandle");
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        log.info("==========\tinterceptor postHandle");
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        log.info("==========\tinterceptor afterCompletion");
    }
}
```

위에서 생성한 필터와 인터셉터를 스프링 애플리케이션 컨텍스트(application context)에 등록한다. WebMvcConfiguration 빈 객체를 통해 이를 수행한다.

```java
package blog.in.action.config;

import blog.in.action.filters.BlogFilter;
import blog.in.action.interceptor.BlogHandlerInterceptor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import javax.servlet.Filter;

@Configuration
public class WebMvcConfiguration implements WebMvcConfigurer {

    @Bean
    public FilterRegistrationBean<Filter> filterRegistrationBean() {
        FilterRegistrationBean<Filter> registrationBean = new FilterRegistrationBean<>(new BlogFilter(BlogFilter.class.getSimpleName()));
        registrationBean.addUrlPatterns("/*");
        registrationBean.setOrder(1);
        return registrationBean;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new BlogHandlerInterceptor())
                .addPathPatterns("/**");
    }
}
```

BlogAop 클래스에 스프링 빈 객체로 등록된 컨트롤러와 서비스 객체의 특정 메서드 실행 전, 후에 수행할 로직을 정의한다. @Aspect, @Component, @Around 애너테이션을 사용한다.

```java
package blog.in.action.aop;

import lombok.extern.log4j.Log4j2;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Log4j2
@Aspect
@Component
public class BlogAop {

    @Around("execution(* blog.in.action.service.BlogService.*(..))")
    public Object aroundServiceFoo(ProceedingJoinPoint pjp) throws Throwable {
        log.info("==========\taround service before foo");
        Object result = pjp.proceed();
        log.info("==========\taround service after foo");
        return result;
    }

    @Around("execution(* blog.in.action.controller.BlogController.*(..))")
    public Object aroundControllerFoo(ProceedingJoinPoint pjp) throws Throwable {
        log.info("==========\taround controller before foo");
        Object result = pjp.proceed();
        log.info("==========\taround controller after foo");
        return result;
    }
}
```

AOP 로직이 적용될 BlogController 클래스 코드를 살펴보자.

- `/foo` 경로로 요청을 받는다.

```java
package blog.in.action.controller;

import blog.in.action.service.BlogService;
import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Log4j2
@RestController
public class BlogController {

    private final BlogService blogService;

    public BlogController(BlogService blogService) {
        this.blogService = blogService;
    }

    @GetMapping("/foo")
    public String foo() {
        log.info("==========\tcontroller foo");
        return blogService.foo();
    }

}
```

마찬가지로 AOP 로직이 적용될 BlogService 클래스 코드다.

- `foo` 문자열을 반환한다.

```java
package blog.in.action.service;

import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

@Log4j2
@Service
public class BlogService {

    public String foo() {
        log.info("==========\tservice foo");
        return "foo";
    }
}
```

코드는 모두 작성했다. 서비스 실행 후 `cURL`을 통해 API 요청을 수행해보자.

```
$ curl localhost:8080/foo
foo
```

다음과 같은 서비스 실행 로그를 확인할 수 있다.

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::        (v2.2.5.RELEASE)

...

2023-05-11 13:44:03.890  INFO 9275 --- [nio-8080-exec-1] blog.in.action.filters.BlogFilter        : ==========    BlogFilter before doFilter
2023-05-11 13:44:03.895  INFO 9275 --- [nio-8080-exec-1] b.i.a.i.BlogHandlerInterceptor           : ==========    interceptor preHandle
2023-05-11 13:44:03.904  INFO 9275 --- [nio-8080-exec-1] blog.in.action.aop.BlogAop               : ==========    around controller before foo
2023-05-11 13:44:03.908  INFO 9275 --- [nio-8080-exec-1] b.in.action.controller.BlogController    : ==========    controller foo
2023-05-11 13:44:03.908  INFO 9275 --- [nio-8080-exec-1] blog.in.action.aop.BlogAop               : ==========    around service before foo
2023-05-11 13:44:03.911  INFO 9275 --- [nio-8080-exec-1] blog.in.action.service.BlogService       : ==========    service foo
2023-05-11 13:44:03.911  INFO 9275 --- [nio-8080-exec-1] blog.in.action.aop.BlogAop               : ==========    around service after foo
2023-05-11 13:44:03.911  INFO 9275 --- [nio-8080-exec-1] blog.in.action.aop.BlogAop               : ==========    around controller after foo
2023-05-11 13:44:03.925  INFO 9275 --- [nio-8080-exec-1] b.i.a.i.BlogHandlerInterceptor           : ==========    interceptor postHandle
2023-05-11 13:44:03.925  INFO 9275 --- [nio-8080-exec-1] b.i.a.i.BlogHandlerInterceptor           : ==========    interceptor afterCompletion
2023-05-11 13:44:03.926  INFO 9275 --- [nio-8080-exec-1] blog.in.action.filters.BlogFilter        : ==========    BlogFilter after doFilter
```

## CLOSING

최근 공공기관 시스템 유지 보수와 관련된 일을 수행했다. 어떤 회사가 만든 프레임워크가 사용되었는데, 보안과 관련된 많은 처리가 필터에서 이뤄지고 있었다. 버그 수정을 위해 프레임워크 구조를 분석하면서 필터나 인터셉터에 대한 많은 공부가 되었다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-05-13-filter-interceptor-and-aop>

#### RECOMMEND NEXT POSTS

- [OncePerRequestFilter 클래스][once-per-request-filter-link]
- [JWT AuthenticationFilter 만들기][make-authentication-filter-link]
- [스프링(Spring)에서 Axios 클라이언트로 커스텀 예외 전달하기][throw-custom-exception-to-axios-from-spring-link]
- [애너테이션 기반 AOP(관점 지향 프로그래밍)][annotation-based-aop-link]
- [FeignClient AOP 단위 테스트 개선][improve-feign-client-aop-test-link]

#### REFERENCE

- <https://yzlosmik.tistory.com/24>
- <https://goddaehee.tistory.com/154>
- <https://supawer0728.github.io/2018/04/04/spring-filter-interceptor/>
- <https://jaehun2841.github.io/2018/08/25/2018-08-18-spring-filter-interceptor/#spring-request-flow>

[once-per-request-filter-link]: https://junhyunny.github.io/spring-boot/once-per-request-filter/
[make-authentication-filter-link]: https://junhyunny.github.io/spring-boot/spring-security/make-authentication-filter/
[throw-custom-exception-to-axios-from-spring-link]: https://junhyunny.github.io/spring-boot/axios/throw-custom-exception-to-axios-from-spring/
[annotation-based-aop-link]: https://junhyunny.github.io/spring-boot/spring-cloud/annotation-based-aop/
[improve-feign-client-aop-test-link]: https://junhyunny.github.io/spring-boot/test-driven-development/improve-feign-client-aop-test/
