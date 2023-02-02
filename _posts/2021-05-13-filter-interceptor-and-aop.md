---
title: "Spring Filter, Interceptor 그리고 AOP"
search: false
category:
  - spring-boot
last_modified_at: 2021-08-29T03:00:00
---

<br/>

## 0. 들어가면서

> **'Spring 필터(Filter)와 인터셉터(Interceptor)의 차이점에 대해 설명해주세요.'**<br/>
> **'필터는 서블릿 컨테이너에 이전에 공통적으로 처리해야되는 부분을 처리합니다. 인터셉터는 AOP 처럼 특정 시점을 빼앗아 동작하는 것을 의미하는 것 같습니다.'** 

<p align="center">
    <img src="/images/filter-interceptor-and-aop-1.JPG" width="30%" class="image__border">
</p>
<center>https://torbjorn.tistory.com/120</center>

최근 같은 질문을 두 번이나 받았습니다. 
첫 질문은 받은 이 후에 관련된 개념을 찾아보지 않았기 때문에 두 번째 질문에도 동일하게 답했지만 잘못된 대답이었습니다. 
인터셉터는 요청 처리를 위해 별도로 사용되는 기능이었습니다. 
필터와 인터셉터의 차이점을 포스트로 정리해보겠습니다. 

## 1. 필터, 인터셉터 그리고 AOP 기능별 위치
필터, 인터셉터 그리고 AOP 기능은 모두 다른 기능입니다. 
그리고 처리하는 일과 기능이 구현된 위치가 다릅니다. 
필터, 인터셉터, AOP 기능이 위치를 알아보고, 각자 해야할 역할에 대한 설명을 이어가보겠습니다. 

##### 필터와 인터셉터 위치

<p align="center">
    <img src="/images/filter-interceptor-and-aop-2.JPG" width="60%" class="image__border">
</p>
<center>https://justforchangesake.wordpress.com/2014/05/07/spring-mvc-request-life-cycle/</center>
<br/>

##### AOP 기능 위치

<p align="center">
    <img src="/images/filter-interceptor-and-aop-3.JPG" width="60%" class="image__border">
</p>
<center>https://programming.vip/docs/spring-aop-basic-use.html</center>

## 2. 필터(Filter)
필터는 웹 어플리케이션(Web Application)에 등록합니다. 
요청 스레드가 서블릿 컨테이너(Servlet Container)에 도착하기 전에 수행됩니다. 
필터는 사용자의 요청 정보에 대한 검증하고 필요에 따라 데이터를 추가하거나 변조할 수 있습니다. 
응답 정보에 대한 변경도 가능합니다. 
주로 전역적으로 처리해야하는 인코딩, 보안 관련된 일을 수행합니다. 

### 2.1. 필터 사용 예
- 오류 처리 기능
- 인코딩 처리 기능
- 웹 보안 관련 기능 처리
- 데이터 압축이나 변환 기능
- 요청이나 응답에 대한 로그
- 로그인 여부, 권한 검사 같은 인증 기능

### 2.2. 필터 메소드
- init() - 필터 인스턴스 초기화
- doFilter() - 전/후 처리
- destroy() - 필터 인스턴스 종료

### 2.3. 필터 구현 예제 코드

#### 2.3.1. BlogFilter 클래스
- Filter 인터페이스를 구현합니다.
- doFilter() 메소드는 필수입니다.
- init(), destroy() 메소드는 디폴트(default) 메소드이므로 필요에 따라 구현합니다.

```java
package blog.in.action.filters;

import java.io.IOException;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import lombok.extern.log4j.Log4j2;

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

#### 2.3.2. WebMvcConfiguration 클래스
- Spring Boot에서는 web.xml 파일이 존재하지 않으므로 FilterRegistrationBean 빈(bean)을 정의하여 필터를 등록합니다.
- 필터가 처리할 path를 지정합니다.
- WebMvcConfigurer 인터페이스를 상속받는 것과는 무관합니다.

```java
package blog.in.action.config;

import blog.in.action.filters.BlogFilter;
import blog.in.action.interceptor.BlogHandlerInterceptor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfiguration implements WebMvcConfigurer {

    @Bean
    public FilterRegistrationBean filterRegistrationBean() {
        FilterRegistrationBean registrationBean = new FilterRegistrationBean(new BlogFilter(BlogFilter.class.getSimpleName()));
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

## 3. 인터셉터(Interceptor)
인터셉터는 스프링 컨텍스트(Context)에 등록합니다. 
서블릿 컨테이너를 통과한 후 컨트롤러에게 요청이 전달되기 전, 후에 대한 처리를 수행합니다. 
스프링 컨텍스트 내에 존재하기 때문에 모든 빈(bean) 객체에 접근할 수 있습니다. 
여러 개의 인터셉터를 사용할 수 있으며 세션 처리, 로그인 처리, 권한 체크, 프로그램 실행 시간 계산 등을 수행합니다. 
필터와 다르게 hanlderMethod 파라미터를 이용하여 AOP와 같은 기능 수행이 가능합니다. 

### 3.1. 인터셉터 메소드
- preHandler() - 컨트롤러 메소드가 실행되기 전
- postHandler() - 컨트롤러 메소드 실행 후 view 페이지 렌더링 전
- afterCompletion() - view 페이지 렌더링 후

### 3.2. 인터셉터 구현 예제 코드

#### 3.2.1. BlogHandlerInterceptor 클래스
- HandlerInterceptor 인터페이스를 구현합니다.

```java
ppackage blog.in.action.interceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import lombok.extern.log4j.Log4j2;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

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

#### 3.2.2. WebMvcConfiguration 클래스
- WebMvcConfigurer 인터페이스를 상속받습니다.
- addInterceptors 메소드를 재구현하여 개발자가 직접 구현한 인터셉터를 등록합니다.
- 인터셉터가 처리할 path를 지정합니다.

```java
package blog.in.action.config;

import blog.in.action.filters.BlogFilter;
import blog.in.action.interceptor.BlogHandlerInterceptor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfiguration implements WebMvcConfigurer {

    @Bean
    public FilterRegistrationBean filterRegistrationBean() {
        FilterRegistrationBean registrationBean = new FilterRegistrationBean(new BlogFilter(BlogFilter.class.getSimpleName()));
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

## 4. AOP(Aspect Oriented Programming)
비즈니스 로직을 수행하는데 중복되는 코드를 줄이기 위한 프로그래밍 방법입니다. 
비즈니스 로직의 특정 시점을 바라보고 해당 시점이 수행되는 순간을 가로채어 전, 후 기능을 처리합니다. 
주로 로깅, 트랜잭션 처리, 에러 처리 같은 기능을 수행합니다. 
AOP 기능은 다양한 방법으로 처리가 가능하기 때문에 추후에 관련된 기능과 용어를 정리해보도록 하겠습니다. 
이 포스트에서는 간단한 테스트 코드를 통해 기능 소개만 하겠습니다.

### 4.1. AOP 구현 예제 코드

#### 4.1.1. BlogAop 클래스
- BlogService 빈(bean)이 수행하는 메소드의 시점을 가로채어 전, 후 동작을 수행합니다.
- BlogController 빈(bean)이 수행하는 메소드의 시점을 가로채어 전, 후 동작을 수행합니다.

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

## 5. 테스트 코드
테스트에 필요한 컨트롤러(Controller)와 서비스(Service) 객체를 만들어줍니다. 
서비스 동작 후 **`curl`** 명령어를 통해 API 요청을 수행합니다.  

#### 5.1. BlogController 클래스

```java
package blog.in.action.controller;

import blog.in.action.service.BlogService;
import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Log4j2
@RestController
@RequestMapping("/api")
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

#### 5.2. BlogService 클래스

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

#### 5.3. 테스트 명령어 수행

```
C:\Users\kang3>curl http://localhost:8081/api/foo
foo
```

#### 5.4. 테스트 결과 로그

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::        (v2.2.5.RELEASE)

2021-05-15 00:57:42.166  INFO 17332 --- [           main] blog.in.action.ActionInBlogApplication   : No active profile set, falling back to default profiles: default
2021-05-15 00:57:42.484  INFO 17332 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Bootstrapping Spring Data JPA repositories in DEFAULT mode.
2021-05-15 00:57:42.500  INFO 17332 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Finished Spring Data repository scanning in 7ms. Found 0 JPA repository interfaces.
2021-05-15 00:57:42.600  INFO 17332 --- [           main] o.s.cloud.context.scope.GenericScope     : BeanFactory id=4f893516-1aef-34f5-a2bd-26d6c4e1dd20
2021-05-15 00:57:42.870  INFO 17332 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8081 (http)
2021-05-15 00:57:42.870  INFO 17332 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2021-05-15 00:57:42.870  INFO 17332 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.31]
2021-05-15 00:57:42.970  INFO 17332 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
2021-05-15 00:57:42.970  INFO 17332 --- [           main] o.s.web.context.ContextLoader            : Root WebApplicationContext: initialization completed in 792 ms
2021-05-15 00:57:43.001  INFO 17332 --- [           main] blog.in.action.filters.BlogFilter        : ==========    BlogFilter init filter
2021-05-15 00:57:43.087  INFO 17332 --- [           main] o.hibernate.jpa.internal.util.LogHelper  : HHH000204: Processing PersistenceUnitInfo [name: default]
2021-05-15 00:57:43.118  INFO 17332 --- [           main] org.hibernate.Version                    : HHH000412: Hibernate ORM core version 5.4.12.Final
2021-05-15 00:57:43.199  INFO 17332 --- [           main] o.hibernate.annotations.common.Version   : HCANN000001: Hibernate Commons Annotations {5.1.0.Final}
2021-05-15 00:57:43.260  INFO 17332 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
2021-05-15 00:57:43.341  INFO 17332 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
2021-05-15 00:57:43.356  INFO 17332 --- [           main] org.hibernate.dialect.Dialect            : HHH000400: Using dialect: org.hibernate.dialect.MySQL5InnoDBDialect
2021-05-15 00:57:43.473  INFO 17332 --- [           main] o.h.e.t.j.p.i.JtaPlatformInitiator       : HHH000490: Using JtaPlatform implementation: [org.hibernate.engine.transaction.jta.platform.internal.NoJtaPlatform]
2021-05-15 00:57:43.473  INFO 17332 --- [           main] j.LocalContainerEntityManagerFactoryBean : Initialized JPA EntityManagerFactory for persistence unit 'default'
2021-05-15 00:57:43.525  WARN 17332 --- [           main] o.s.c.n.a.ArchaiusAutoConfiguration      : No spring.application.name found, defaulting to 'application'
2021-05-15 00:57:43.525  WARN 17332 --- [           main] c.n.c.sources.URLConfigurationSource     : No URLs will be polled as dynamic configuration sources.
2021-05-15 00:57:43.525  INFO 17332 --- [           main] c.n.c.sources.URLConfigurationSource     : To enable URLs as dynamic configuration sources, define System property archaius.configurationSource.additionalUrls or make config.properties available on classpath.
2021-05-15 00:57:43.525  WARN 17332 --- [           main] c.n.c.sources.URLConfigurationSource     : No URLs will be polled as dynamic configuration sources.
2021-05-15 00:57:43.525  INFO 17332 --- [           main] c.n.c.sources.URLConfigurationSource     : To enable URLs as dynamic configuration sources, define System property archaius.configurationSource.additionalUrls or make config.properties available on classpath.
2021-05-15 00:57:43.574  WARN 17332 --- [           main] JpaBaseConfiguration$JpaWebConfiguration : spring.jpa.open-in-view is enabled by default. Therefore, database queries may be performed during view rendering. Explicitly configure spring.jpa.open-in-view to disable this warning
2021-05-15 00:57:43.656  INFO 17332 --- [           main] o.s.s.concurrent.ThreadPoolTaskExecutor  : Initializing ExecutorService 'applicationTaskExecutor'
2021-05-15 00:57:44.111  INFO 17332 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8081 (http) with context path ''
2021-05-15 00:57:44.364  INFO 17332 --- [           main] blog.in.action.ActionInBlogApplication   : Started ActionInBlogApplication in 3.188 seconds (JVM running for 4.066)
2021-05-15 00:57:46.248  INFO 17332 --- [nio-8081-exec-1] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring DispatcherServlet 'dispatcherServlet'
2021-05-15 00:57:46.248  INFO 17332 --- [nio-8081-exec-1] o.s.web.servlet.DispatcherServlet        : Initializing Servlet 'dispatcherServlet'
2021-05-15 00:57:46.248  INFO 17332 --- [nio-8081-exec-1] o.s.web.servlet.DispatcherServlet        : Completed initialization in 0 ms
2021-05-15 00:57:46.248  INFO 17332 --- [nio-8081-exec-1] blog.in.action.filters.BlogFilter        : ==========    BlogFilter before doFilter
2021-05-15 00:57:46.263  INFO 17332 --- [nio-8081-exec-1] b.i.a.i.BlogHandlerInterceptor           : ==========    interceptor preHandle
2021-05-15 00:57:46.302  INFO 17332 --- [nio-8081-exec-1] blog.in.action.aop.BlogAop               : ==========    around controller before foo
2021-05-15 00:57:46.302  INFO 17332 --- [nio-8081-exec-1] b.in.action.controller.BlogController    : ==========    controller foo
2021-05-15 00:57:46.302  INFO 17332 --- [nio-8081-exec-1] blog.in.action.aop.BlogAop               : ==========    around service before foo
2021-05-15 00:57:46.302  INFO 17332 --- [nio-8081-exec-1] blog.in.action.service.BlogService       : ==========    service foo
2021-05-15 00:57:46.302  INFO 17332 --- [nio-8081-exec-1] blog.in.action.aop.BlogAop               : ==========    around service after foo
2021-05-15 00:57:46.302  INFO 17332 --- [nio-8081-exec-1] blog.in.action.aop.BlogAop               : ==========    around controller after foo
2021-05-15 00:57:46.318  INFO 17332 --- [nio-8081-exec-1] b.i.a.i.BlogHandlerInterceptor           : ==========    interceptor postHandle
2021-05-15 00:57:46.318  INFO 17332 --- [nio-8081-exec-1] b.i.a.i.BlogHandlerInterceptor           : ==========    interceptor afterCompletion
2021-05-15 00:57:46.318  INFO 17332 --- [nio-8081-exec-1] blog.in.action.filters.BlogFilter        : ==========    BlogFilter after doFilter
Disconnected from the target VM, address: '127.0.0.1:59594', transport: 'socket'
2021-05-15 01:00:10.300  INFO 17332 --- [extShutdownHook] o.s.s.concurrent.ThreadPoolTaskExecutor  : Shutting down ExecutorService 'applicationTaskExecutor'
2021-05-15 01:00:10.300  INFO 17332 --- [extShutdownHook] j.LocalContainerEntityManagerFactoryBean : Closing JPA EntityManagerFactory for persistence unit 'default'
2021-05-15 01:00:10.300  INFO 17332 --- [extShutdownHook] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Shutdown initiated...
2021-05-15 01:00:10.316  INFO 17332 --- [extShutdownHook] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Shutdown completed.
2021-05-15 01:00:10.495  INFO 17332 --- [extShutdownHook] blog.in.action.filters.BlogFilter        : ==========    BlogFilter destroy filter
```

## CLOSING
최근 공공기관 시스템 유지 보수와 관련된 일을 수행하였습니다. 
해당 시스템에 특정 회사 프레임워크가 사용되었는데 보안 관련된 많은 처리를 필터를 이용해 수행하고 있었습니다. 
업무를 수행하면서 필터에서 처리하는 방법에 대해 관심도 많아졌고, 
해당 프레임워크와 관련된 API 문서 없이 기능 추가, 버그 수정을 위해 프레임워크 구조를 분석하면서 필터에 대해 많은 공부가 되었습니다. 
아쉽게도 인터셉터에 대한 공부가 부족했는데 이 참에 어떤 부분이 다른지 정리해보았습니다. 

필터에서만 할 수 있는 일과 인터셉터에서만 할 수 있는 일에 대해 **`기록은 재산이다 블로그`**의 [(Spring)Filter와 Interceptor의 차이][spring-filter-interceptor-link] 포스트에서 정리한 내용을 가져왔습니다. 
본인은 경험해보지는 못 했지만 나중에 도움이 될 것 같아서 OPINION 부분에 함께 기록해두겠습니다.

### 필터에서만 할 수 있는 일

> ServletRequest 혹은 ServletResponse를 교체할 수 있다. 아래와 같은 일이 가능하다.

```java
public class SomeFilter implements Filter {
  //...
  
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
    chain.doFilter(new CustomServletRequest(), new CustomResponse());
  }
}
```
 
> 설마 저런 일을 할까? 꽤 자주 있는 요구 사항이다. 
> HttpServletRequest의 body(ServletInputStream의 내용)를 로깅하는 것을 예로 들 수 있을 것 같다. 
> HttpServletRequest는 body의 내용을 한 번만 읽을 수 있다. 
> Rest API Application을 작성할 때, 흔히 json 형식으로 요청을 받는다. 
> @Controller(Handler)에 요청이 들어오면서 body를 한 번 읽게 된다. 
> 때문에 Filter나 Interceptor에서는 body를 읽을 수 없다. IOException이 발생한다. 
> body를 로깅하기 위해서는 HttpServletRequest를 감싸서 여러 번 inputStream을 열 수 있도록 커스터마이징 된 ServletRequest를 쓸 수 밖에 없다.

### 인터셉터에서만 할 수 있는 일

> AOP 흉내를 낼 수 있다. 
> @RequestMapping 선언으로 요청에 대한 HandlerMethod(@Controller의 메서드)가 정해졌다면, handler라는 이름으로 HandlerMethod가 들어온다. 
> HandlerMethod로 메서드 시그니처 등 추가적인 정보를 파악해서 로직 실행 여부를 판단할 수 있다. 
> View를 렌더링하기 전에 추가 작업을 할 수 있다. 
> 예를 들어 웹 페이지가 권한에 따라 GNB(Global Navigation Bar)이 항목이 다르게 노출되어야 할 때 등의 처리를 하기 좋다.

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-05-13-filter-interceptor-and-aop>

#### REFERENCE
- <https://yzlosmik.tistory.com/24>
- <https://goddaehee.tistory.com/154>
- <https://supawer0728.github.io/2018/04/04/spring-filter-interceptor/>
- <https://jaehun2841.github.io/2018/08/25/2018-08-18-spring-filter-interceptor/#spring-request-flow>

[spring-filter-interceptor-link]: https://supawer0728.github.io/2018/04/04/spring-filter-interceptor/