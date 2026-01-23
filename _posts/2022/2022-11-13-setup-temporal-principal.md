---
title: "Principal Class for Authenticated User"
search: false
category:
  - tomcat
  - spring-boot
last_modified_at: 2022-11-13T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Filter, Interceptor and AOP in Spring][filter-interceptor-and-aop-link]
* [OncePerRequestFilter][once-per-request-filter-link]

## 0. 들어가면서

애플리케이션을 개발하다보면 사용자 인증이나 권한과 관련된 기능들이 필요합니다. 
아직 사용자 인증, 권한 관리에 대한 내용이 결정되지 않은 시점에 사용자 정보가 필요하다면 이를 어떻게 풀어갈지 고민이 필요합니다. 
저는 사용자 인증에 대한 문제로 다른 작업들이 블로킹(blocking)되면 안 되기 때문에 임시로 인증된 사용자 정보를 설정하고 싶었습니다. 
다음과 같은 관점에서 필터에 임시 사용자 정보를 주입하는 기능을 추가하기로 결정했습니다. 

* 세션(session)을 사용하든, 토큰(token)을 사용하든 필터에서 작업
* 가장 유력한 선택지인 `Spring Security` 라이브러리를 적용하더라도 비즈니스 기능에 변화가 없도록 구현

이번 포스트에선 임시로 인증된 사용자 정보를 제공하는 필터를 구현해보았습니다.

## 1. HttpServletRequestWrapper 클래스

`HttpServletRequestWrapper` 클래스는 `HttpServletRequest` 인터페이스 기능을 쉽게 확장할 수 있게 돕는 어댑터 클래스입니다. 
`HttpServletRequest` 객체를 감싼 형태로 담긴 정보를 변경, 조작할 수 있습니다. 
이전 [반사형 XSS(Reflected Cross Site Scripting) 공격과 방어][reflected-cross-site-scripting-link] 포스트에선 `HttpServletRequest` 객체에 담긴 파라미터 정보를 이스케이핑(escaping)하는 예시를 다뤘습니다. 

##### XSS 공격 방지 이스케이핑(escaping)

```java
    private class RequestWrapper extends HttpServletRequestWrapper {

        public RequestWrapper(HttpServletRequest request) {
            super(request);
        }

        @Override
        public String[] getParameterValues(String parameter) {
            String[] values = super.getParameterValues(parameter);
            if (values == null) {
                return null;
            }
            int count = values.length;
            String[] encodedValues = new String[count];
            for (int i = 0; i < count; i++) {
                encodedValues[i] = cleanXSS(values[i]);
            }
            return encodedValues;
        }

        @Override
        public String getParameter(String parameter) {
            String value = super.getParameter(parameter);
            if (value == null) {
                return null;
            }
            return cleanXSS(value);
        }

        @Override
        public String getHeader(String name) {
            String value = super.getHeader(name);
            if (value == null) {
                return null;
            }
            return cleanXSS(value);
        }

        private String cleanXSS(String value) {
            value = value.replaceAll("&", "&amp;");
            value = value.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
            value = value.replaceAll("\\(", "&#40;").replaceAll("\\)", "&#41;");
            value = value.replaceAll("/", "&#x2F;");
            value = value.replaceAll("'", "&#x27;");
            value = value.replaceAll("\"", "&quot;");
            return value;
        }
    }
```

## 2. 인증된 임시 사용자 만들기

### 2.1. AuthenticatedUser 클래스

* `Java` 애플리케이션에 접근하는 유저를 의미하는 `Principal` 인터페이스를 구현합니다.
    * `Principal` 인터페이스는 `java.security` 패키지에 위치합니다.
* 필요한 최소한의 정보만 정의합니다.

```java
package app.auth;

import lombok.Builder;
import lombok.Getter;

import java.security.Principal;
import java.util.List;

@Getter
@Builder
public class AuthenticatedUser implements Principal {

    private String id;
    private String name;
    private List<String> roles;

    @Override
    public String getName() {
        return name;
    }
}
```

### 2.2. AuthenticationFilter 클래스

나중에 인증 관련된 로직이 추가될 필터입니다. 
지금은 개발되어야 하는 기능들이 진행될 수 있도록 임시 사용자 정보를 반환합니다. 

* 해당 필터에서만 사용하는 `UserPrincipalHttpServletRequest` 클래스를 정의합니다.
* `Principal` 객체를 반환하는 `getter` 메소드에 필요한 사용자 객체를 반환합니다.
* `getUserPrincipal` 메소드는 서블릿 컨테이너에 의해 필요한 시점에 호출되어 인증된 사용자 정보로 사용됩니다.

```java
package app.filter;

import app.auth.AuthenticatedUser;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.security.Principal;
import java.util.Arrays;

public class AuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        filterChain.doFilter(new UserPrincipalHttpServletRequest(request), response);
    }

    private class UserPrincipalHttpServletRequest extends HttpServletRequestWrapper {

        public UserPrincipalHttpServletRequest(HttpServletRequest request) {
            super(request);
        }

        @Override
        public Principal getUserPrincipal() {
            return AuthenticatedUser.builder()
                    .id("0001")
                    .name("Junhyunny")
                    .roles(Arrays.asList("ADMIN", "USER", "MANAGER"))
                    .build();
        }
    }
}
```

### 2.3. 인증된 사용자 사용하기

인증된 사용자 객체를 사용하는 방법은 단순합니다. 
비즈니스 로직의 시작점인 컨트롤러(controller) 엔드 포인트에 파라미터로 설정합니다. 

```java
package app.controller;

import app.auth.AuthenticatedUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ResourceController {

    @GetMapping("/user")
    public AuthenticatedUser getUser(AuthenticatedUser user) {
        return user;
    }
}
```

### 2.4. WebMvcConfiguration 클래스

* 만든 필터를 사용하기 위해 등록합니다.

```java
package app.config;

import app.filter.AuthenticationFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfiguration implements WebMvcConfigurer {

    @Bean
    public FilterRegistrationBean filterRegistrationBean() {
        FilterRegistrationBean registrationBean = new FilterRegistrationBean(new AuthenticationFilter());
        registrationBean.addUrlPatterns("/*");
        return registrationBean;
    }
}
```

## 3. 단위 테스트

정말 해당 필터를 통과하면 컨트롤러 엔드 포인트에서 사용자 정보를 받을 수 있는지 확인해보겠습니다. 

* 컨트롤러 테스트를 위해 만든 `MockMvc` 객체에 인증 필터를 추가합니다.
* `/user` 경로에 API 요청을 수행하면 필터를 통과해서 사용자 정보를 응답으로 받는지 확인합니다.

```java
package app.controller;

import app.filter.AuthenticationFilter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthenticationFilterTests {

    @Test
    @DisplayName("AuthenticationFilter 를 통과하면 사용자 정보를 획득할 수 있다.")
    void get_user_information_through_authentication_filter() throws Exception {

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new ResourceController())
                .addFilter(new AuthenticationFilter())
                .build();


        mockMvc.perform(get("/user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("0001"))
                .andExpect(jsonPath("$.name").value("Junhyunny"))
                .andExpect(jsonPath("$.roles[0]").value("ADMIN"))
                .andExpect(jsonPath("$.roles[1]").value("USER"))
                .andExpect(jsonPath("$.roles[2]").value("MANAGER"))
        ;
    }
}
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-11-13-setup-temporal-principal>

#### REFERENCE

* <https://stackoverflow.com/questions/47734663/setting-user-principal-in-filter>
* <https://docs.oracle.com/javaee/6/api/javax/servlet/http/HttpServletRequestWrapper.html>

[filter-interceptor-and-aop-link]: https://junhyunny.github.io/spring-boot/filter-interceptor-and-aop/
[once-per-request-filter-link]: https://junhyunny.github.io/spring-boot/once-per-request-filter/

[reflected-cross-site-scripting-link]: https://junhyunny.github.io/information/security/spring-mvc/reflected-cross-site-scripting/
