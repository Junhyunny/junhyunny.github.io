---
title: "RequestMatcher Setup Error When Spring Security 6.1.5 Version Upgrade"
search: false
category:
  - java
  - spring-boot
  - spring-security
last_modified_at: 2023-10-26T23:55:00
---

<br/>

## 0. 들어가면서

스프링 부트(spring boot) 프레임워크를 3.0.7 버전에서 3.1.5 버전으로 업그레이드한 후 서비스를 부팅할 때 이전에 발생하지 않던 에러가 발생했습니다. 스프링 시큐리티(spring security) 버전이 함께 업그레이드되면서 문제가 생겼는데 이번 글에서 예외가 발생한 이유와 해결 방법을 정리하였습니다. 

* 서블릿 컨텍스트에 이미 존재하는 API 경로를 처리하기 위한 RequestMatcher 객체를 만들 때 문제가 발생합니다.
    * `/h2-console/*`, `/` 경로에 대한 RequestMatcher 객체를 생성합니다.
    * 파라미터로 전달한 경로가 Spring MVC 패턴 방식인지 Ant Path 방식인지 패턴이 불분명하니 정해달라는 의미입니다. 

```
Caused by: java.lang.IllegalArgumentException: This method cannot decide whether these patterns are Spring MVC patterns or not. If this endpoint is a Spring MVC endpoint, please use requestMatchers(MvcRequestMatcher); otherwise, please use requestMatchers(AntPathRequestMatcher).

This is because there is more than one mappable servlet in your servlet context: {org.h2.server.web.JakartaWebServlet=[/h2-console/*], org.springframework.web.servlet.DispatcherServlet=[/]}.

For each MvcRequestMatcher, call MvcRequestMatcher#setServletPath to indicate the servlet path.
    at org.springframework.security.config.annotation.web.AbstractRequestMatcherRegistry.requestMatchers(AbstractRequestMatcherRegistry.java:208) ~[spring-security-config-6.1.5.jar:6.1.5]
    at org.springframework.security.config.annotation.web.AbstractRequestMatcherRegistry.requestMatchers(AbstractRequestMatcherRegistry.java:276) ~[spring-security-config-6.1.5.jar:6.1.5]
    at action.in.blog.config.SecurityConfig.lambda$filterChain$0(SecurityConfig.java:20) ~[main/:na]
    at org.springframework.security.config.annotation.web.builders.HttpSecurity.authorizeHttpRequests(HttpSecurity.java:1466) ~[spring-security-config-6.1.5.jar:6.1.5]
... 
```

## 1. Problem 

스프링 시큐리티에는 인가 처리를 위해 API 경로를 기반으로 RequestMatcher 객체를 등록하는 requestMatchers 메서드가 존재합니다. 

```java
package action.in.blog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.httpBasic(withDefaults());
        http.authorizeHttpRequests(configurer ->
                // 해당 메서드
                configurer.requestMatchers("/api/**")
                        .authenticated()
        );
        http.csrf(AbstractHttpConfigurer::disable);
        http.headers(AbstractHttpConfigurer::disable);
        return http.build();
    }
}

```

requestMatchers 메서드가 실행되면서 에러가 발생합니다. 이 메서드는 다음과 같이 변경되었습니다. 

* Spring Security Version 6.0.3 
    * mvcPresent 플래그에 따라 MvcRequestMatcher 객체나 AntRequestMatcher 객체가 등록됩니다. 

```java
public abstract class AbstractRequestMatcherRegistry<C> {

    // ...

    public C requestMatchers(HttpMethod method, String... patterns) {
        List<RequestMatcher> matchers = new ArrayList<>();
        if (mvcPresent) {
            matchers.addAll(createMvcMatchers(method, patterns));
        }
        else {
            matchers.addAll(RequestMatchers.antMatchers(method, patterns));
        }
        return requestMatchers(matchers.toArray(new RequestMatcher[0]));
    }
}
```

* Spring Security Version 6.1.5 
    * mvcPresent 플래그가 거짓인 경우 AntRequestMatcher 객체를 등록합니다. 
    * 프레임워크의 컨텍스트가 WebApplicationContext 인스턴스인 경우 AntRequestMatcher 객체를 등록합니다.
    * 서블릿 컨텍스트가 존재하지 않는 경우 AntRequestMatcher 객체를 등록합니다.
    * 서블릿 컨텍스트에 RequestMatcher로 함께 등록되어야 하는 서블릿 후보들이 1개 이상이고, 이들 중 하나라도 DispatcherServlet 인스턴스인 경우 예외가 발생합니다.   

```java
public abstract class AbstractRequestMatcherRegistry<C> {

    // ...

    public C requestMatchers(HttpMethod method, String... patterns) {
        if (!mvcPresent) {
            return requestMatchers(RequestMatchers.antMatchersAsArray(method, patterns));
        }
        if (!(this.context instanceof WebApplicationContext)) {
            return requestMatchers(RequestMatchers.antMatchersAsArray(method, patterns));
        }
        WebApplicationContext context = (WebApplicationContext) this.context;
        ServletContext servletContext = context.getServletContext();
        if (servletContext == null) {
            return requestMatchers(RequestMatchers.antMatchersAsArray(method, patterns));
        }
        Map<String, ? extends ServletRegistration> registrations = mappableServletRegistrations(servletContext);
        if (registrations.isEmpty()) {
            return requestMatchers(RequestMatchers.antMatchersAsArray(method, patterns));
        }
        if (!hasDispatcherServlet(registrations)) {
            return requestMatchers(RequestMatchers.antMatchersAsArray(method, patterns));
        }
        if (registrations.size() > 1) {
            String errorMessage = computeErrorMessage(registrations.values());
            throw new IllegalArgumentException(errorMessage);
        }
        return requestMatchers(createMvcMatchers(method, patterns).toArray(new RequestMatcher[0]));
    }
}
```

## 2. Why does Spring Security check the Servlet?

많은 부분이 변경되었고, 코드의 흐름도 일부 파악되었습니다. 스프링 시큐리티가 왜 서블릿으로 등록된 경로까지 함께 확인을 하는지 궁금했습니다. 스프링 공식 사이트의 [CVE-2023-34035](https://spring.io/security/cve-2023-34035) 글에서 관련된 내용을 찾을 수 있었습니다. 

> Second, if you are using multiple servlets and one of them is Spring MVC’s DispatcherServlet, you may see the following error message at startup time:
> ```
> This method cannot decide whether these patterns are Spring MVC patterns or not.
> If this endpoint is a Spring MVC endpoint, please use `requestMatchers(MvcRequestMatcher)`;
> otherwise, please use `requestMatchers(AntPathRequestMatcher)`.
> ```
> Sometimes these extra servlets are not needed. For example, some servlet containers will add a DefaultServlet that DispatcherServlet effectively replaces. In many cases, such a servlet can be removed from your container's global configuration.

스프링 팀은 다음과 같은 조건이 만족되면 보안 문제가 발생할 수 있다고 경고합니다. 

* `Spring MVC`가 클래스 패스(classpath)에 존재한다.
* 하나의 애플리케이션에서 스프링 프레임워크에서 제공하는 DispatcherServlet과 함께 다른 서블릿을 함께 사용한다. 
* requestMatchers(String) 혹은 requestMatchers(HttpMethod, String) 메서드를 사용한다. 

관련된 코드 변경은 [Improve RequestMatcher Validation](https://github.com/spring-projects/spring-security/commit/df239b6448ccf138b0c95b5575a88f33ac35cd9a)에서 확인할 수 있습니다. 아쉽게도 정확히 어떤 케이스가 보안 취약점을 만드는지 찾지는 못 했습니다. 

## 3. What is the reason?

스프링 팀에서 말하는 3가지 조건을 모두 만족했습니다. 두 가지 조건은 확실했습니다. 

* 스프링 MVC가 클래스 패스에 존재
* 문자열로 인가 처리 API 경로를 등록하는 requestMatchers(String) 메서드 사용

[Improve CVE-2023-34035 detection](https://github.com/spring-projects/spring-security/issues/13568) 이슈에 내용들을 살펴보면 여러 종류의 서블릿이 등록되는 케이스가 더러 있는 편인 것 같습니다. 에러 로그를 보면 H2 콘솔을 위한 서블릿이 별도로 추가되는 것을 확인할 수 있습니다. 필자는 로컬 환경과 테스트 코드에서 H2 데이터베이스를 사용하고, H2 콘솔 기능이 활성화되어 있어서 문제가 발생했습니다. H2 콘솔 기능이 활성화되면 `/h2-console` 경로를 서비스하기 위해 `org.h2.server.web.JakartaWebServlet`이 추가됩니다. 이 서블릿과 `DispatcherServlet`이 함께 공존하면서 위 에러가 발생했습니다. 

<p align="center">
    <img src="/images/request-matcher-setup-error-when-spring-security-version-upgrade-1.JPG" width="100%" class="image__border">
</p>

## 4. What is the solution?

이 에러를 해결하려면 인가 처리를 위한 API 경로에 적용할 RequestMatcher 객체를 명시적으로 사용해야합니다. 다음과 같은 생성자 함수를 사용할 수 있습니다. 

* MvcRequestMatcher(HandlerMappingIntrospector introspector, String pattern) 생성자 함수
    * MvcRequestMatcher.Builder 클래스의 pattern 메서드도 사용 가능합니다.
* AntPathRequestMatcher(String pattern) 생성자 함수
    * AntPathRequestMatcher 클래스의 antMatcher 메서드도 사용 가능합니다.

본인은 MveRequestMatcher 객체를 생성할 수 있는 빌더(builder) 객체를 사용하였습니다.

```java
package action.in.blog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.MvcRequestMatcher;
import org.springframework.web.servlet.handler.HandlerMappingIntrospector;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, HandlerMappingIntrospector handlerMappingIntrospector) throws Exception {

        var mvcRequestMatcherBuilder = new MvcRequestMatcher.Builder(handlerMappingIntrospector);

        http.httpBasic(withDefaults());
        http.authorizeHttpRequests(configurer ->
                configurer.requestMatchers(mvcRequestMatcherBuilder.pattern("/api/**"))
                        .authenticated()
        );
        http.csrf(AbstractHttpConfigurer::disable);
        http.headers(AbstractHttpConfigurer::disable);
        return http.build();
    }
}
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-10-26-request-matcher-setup-error-when-spring-security-version-upgrade>

#### REFERENCE

* <https://stackoverflow.com/questions/76809698/spring-security-method-cannot-decide-pattern-is-mvc-or-not-spring-boot-applicati>
* <https://spring.io/security/cve-2023-34035>
* <https://github.com/spring-projects/spring-security/commit/df239b6448ccf138b0c95b5575a88f33ac35cd9a>
* <https://github.com/spring-projects/spring-security/issues/13551>
* <https://github.com/spring-projects/spring-security/issues/13568>
* <https://stackoverflow.com/questions/50536292/difference-between-antmatcher-and-mvcmatcher>