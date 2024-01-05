---
title: "How to make multiple security filter chains in Spring Security"
search: false
category:
  - java
  - spring-boot
  - spring-security
last_modified_at: 2023-12-06T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Web MVC Filter Test on Spring Boot][web-mvc-filter-test-on-spring-boot-link]

## 1. Problem

일반 사용자들을 위한 애플리케이션 프로젝트에 관리자를 위한 애플리케이션이 추가되었습니다. 해당 프로젝트는 스프링 시큐리티(spring security)를 사용하고 있었는데, 하나의 프로젝트에서 두 개의 도메인을 다루기 시작하면서 리소스(resource)에 대한 두 애플리케이션의 인가(authorization) 정책이 서로 다른 것이 문제가 됬습니다. 

- 관리자 애플리케이션 인가 정책
    - 모든 리소스가 관리자 권한 필요
- 사용자 애플리케이션 인가 정책
    - 대부분의 리소스 허용
    - 일부 개인 정보 리소스 인증(authenticated) 필요
    - 특정 리소스 생성 및 수정은 관리자 권한 필요

## 2. Solve the problem

SecurityFilterChain 빈(bean)을 여러 개 만들면 하나의 애플리케이션에 여러 개 시큐리티 필터 체인들을 정의할 수 있습니다. 대신 각 시큐리티 필터 체인마다 자신이 책임을 갖는 API 경로를 지정해야 합니다. 아래 그림은 두 개의 시큐리티 필터 체인을 구성하고 각 필터 체인마다 자신이 담당하는 요청 경로를 지정해 준 모습입니다. 

1. 서버가 클라이언트로부터 `/admin/api/articles` 요청을 전달받습니다. 
1. 서블릿 필터 체인에 위치한 FilterChainProxy 인스턴스는 요청 경로를 바탕으로 적절한 시큐리티 필터 체인을 찾습니다.
    - 각 서블릿 필터 체인은 자신이 담당하는 경로 정보를 RequestMatcher 인스턴스 형태로 가지고 있습니다.
1. 적합한 시큐리티 필터 체인을 통해 인증, 인가 처리를 수행합니다.

<p align="center">
    <img src="/images/how-to-make-multiple-security-filter-chains-01.png" width="80%" class="image__border">
</p>

### 2.1. API Design

기존 API 경로를 변경하는 작업이 필요했습니다. 한 프로젝트에 도메인이 늘어났기 때문에 API 경로를 명확히 구분짓기 위해 기존 애플리케이션에서 사용했던 경로인 `/api/**` 앞에 도메인 이름을 추가합니다. 두 도메인은 서로 다른 로그인 방식을 제공하기 때문에 로그인 경로도 추가적으로 구분합니다.

- 관리자 애플리케이션 리소스 API 경로
    - /admin/api/**
    - /admin/login
- 일반 사용자 애플리케이션 리소스 API 경로
    - /app/api/**
    - /app/login

### 2.2. SecurityConfig Class

코드를 일부 각색한 설정(configuration) 클래스입니다. 

- adminSecurityFilterChain 메소드
    - 담당 리소스 경로는 `/admin/api/**`, `/admin/login` 입니다.
    - 모든 리소스 경로는 `ADMIN` 권한을 가진 사용자만 접근할 수 있습니다.
    - 폼(form) 로그인 인증 방식을 사용합니다.
        - 로그인 성공시 리다이렉트 URL은 `/admin/home` 입니다.
        - 로그인 실패시 리다이렉트 URL은 `/admin/login?error` 입니다.
- appSecurityFilterChain 메소드
    - 담당 경로는 `/app/api/**`, `/app/login` 입니다.
    - 다음과 같은 리소스 인가 규칙을 가집니다.
        - `/app/api/private-articles` 경로는 인증된 사용자만 접근할 수 있습니다.
        - 이 외 경로는 모두 허용입니다.
    - 폼(form) 로그인 인증 방식을 사용합니다.
        - 로그인 성공시 리다이렉트 URL은 `/app/home` 입니다.
        - 로그인 실패시 리다이렉트 URL은 `/app/login?error` 입니다.

```java
package action.in.blog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String[] adminSecurityMatcher = new String[]{
            "/admin/api/**",
            "/admin/login"
    };

    private static final String[] appSecurityMatcher = new String[]{
            "/app/api/**",
            "/app/login"
    };

    @Bean
    public SecurityFilterChain adminSecurityFilterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity.securityMatcher(adminSecurityMatcher);
        httpSecurity.authorizeHttpRequests(
                registry -> registry.anyRequest().hasRole("ADMIN")
        );
        httpSecurity.formLogin(
                configurer -> configurer
                        .loginProcessingUrl("/admin/login")
                        .defaultSuccessUrl("/admin/home")
                        .failureUrl("/admin/login?error")
        );
        httpSecurity.csrf(
                AbstractHttpConfigurer::disable
        );
        return httpSecurity.build();
    }

    @Bean
    public SecurityFilterChain appSecurityFilterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity.securityMatcher(appSecurityMatcher);
        httpSecurity.authorizeHttpRequests(
                registry -> registry
                        .requestMatchers(HttpMethod.GET, "/app/api/private-articles").authenticated()
                        .anyRequest().permitAll()
        );
        httpSecurity.formLogin(
                configurer -> configurer
                        .loginProcessingUrl("/app/login")
                        .defaultSuccessUrl("/app/home")
                        .failureUrl("/app/login?error")
        );
        httpSecurity.csrf(
                AbstractHttpConfigurer::disable
        );
        return httpSecurity.build();
    }
}
```

## 3. Test

테스트 코드를 통해 설정 클래스에서 정의한 두 개의 시큐리티 필터 체인이 정상적으로 동작하는지 확인합니다. 로그인 테스트를 위해 InMemoryUserDetailsManager 객체를 사용해 두 명의 임시 사용자를 준비합니다.

```java
package action.in.blog;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

@Configuration
public class MockUsers {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    public UserDetailsService inMemoryUserDetailsManager() {
        var inMemoryUserDetailsManager = new InMemoryUserDetailsManager();
        inMemoryUserDetailsManager.createUser(
                User.withDefaultPasswordEncoder()
                        .username("junhyunny")
                        .password("123")
                        .roles("ADMIN")
                        .build()
        );
        inMemoryUserDetailsManager.createUser(
                User.withDefaultPasswordEncoder()
                        .username("jua")
                        .password("123")
                        .roles("USER")
                        .build()
        );
        return inMemoryUserDetailsManager;
    }
}
```

### 3.1. Admin Resource

관리자 애플리케이션의 컨트롤러 클래스를 먼저 살펴봅니다.

#### 3.1.1. AdminController Class

```java
package action.in.blog.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/api")
public class AdminController {

    @GetMapping("/articles")
    public String articles() {
        return "admin articles";
    }
}
```

#### 3.1.2. AdminControllerTest Class

테스트를 위한 환경을 준비합니다.

- 테스트 대상 컨트롤러를 스코핑하고 설정한 시큐리티 필터 체인이 동작하도록 @WebMvcTest 애너테이션을 통해 통합 테스트(integration test)를 수행합니다.
- 다음과 같은 추가 의존성이 필요합니다.
    - 설정한 시큐리티 필터 체인이 적용될 수 있도록 SecurityConfig 클래스를 추가(import)합니다.
    - 로그인 테스트를 위해 MockUsers 클래스를 추가합니다.

각 테스트 별로 다음과 같은 내용을 검증합니다.

- login 메소드
    - InMemoryUserDetailsManager 객체에 추가된 사용자로 로그인을 수행합니다.
    - 관리자 시큐리티 필터 체인에 정의한 로그인 성공 URL로 리다이렉트 되는지 확인합니다.
- wrongCredential_login_redirectFailure 메소드
    - 잘못된 사용자 자격 증명을 사용해 로그인을 수행합니다.
    - 관리자 시큐리티 필터 체인에 정의한 로그인 실패 URL로 리다이렉트 되는지 확인합니다.
- articles 메소드
    - 관리자 애플리케이션 리소스에 접근합니다.
    - 관리자 권한을 가진 사용자로 접근하는 경우 정상적으로 응답을 받는지 확인합니다.
- withoutAuthentication_articles_redirectToLogin 메소드
    - 관리자 애플리케이션 리소스에 접근합니다.
    - 사용자 인증 없이 접근하는 경우 로그인 페이지로 리다이렉트 되는지 확인합니다.
- withoutAuthorization_articles_statusForbidden 메소드
    - 관리자 애플리케이션 리소스에 접근합니다.
    - 인증은 되었지만, 관리자 권한이 아닌 사용자가 접근하는 경우 `forbidden(403)` 응답을 받는지 확ㅇ니합니다.

```java
package action.in.blog.controller;

import action.in.blog.MockUsers;
import action.in.blog.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Import({SecurityConfig.class, MockUsers.class})
@WebMvcTest(controllers = {AdminController.class})
class AdminControllerTest {

    @Autowired
    MockMvc sut;

    UserDetails sampleAdmin() {
        return User.withDefaultPasswordEncoder()
                .username("junhyunny")
                .password("123")
                .roles("ADMIN")
                .build();
    }

    UserDetails sampleUser() {
        return User.withDefaultPasswordEncoder()
                .username("jua")
                .password("123")
                .roles("USER")
                .build();
    }

    @Test
    void login() throws Exception {

        sut.perform(
                        post("/admin/login")
                                .param("username", "junhyunny")
                                .param("password", "123")
                                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                )
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/admin/home"))
        ;
    }

    @Test
    void wrongCredential_login_redirectFailure() throws Exception {

        sut.perform(
                        post("/admin/login")
                                .param("username", "junhyunny")
                                .param("password", "12345")
                                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                )
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/admin/login?error"))
        ;
    }

    @Test
    void articles() throws Exception {

        sut.perform(
                        get("/admin/api/articles")
                                .with(user(sampleAdmin()))
                )
                .andExpect(content().string("admin articles"))
        ;
    }

    @Test
    void withoutAuthentication_articles_redirectToLogin() throws Exception {

        sut.perform(
                        get("/admin/api/articles")
                )
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("http://localhost/login"))
        ;
    }

    @Test
    void withoutAuthorization_articles_statusForbidden() throws Exception {

        sut.perform(
                        get("/admin/api/articles")
                                .with(user(sampleUser()))
                )
                .andExpect(status().isForbidden())
        ;
    }
}
```

### 3.2. User Resource

다음으로 사용자 애플리케이션의 컨트롤러 클래스를 살펴봅니다.

#### 3.2.1. UserController Class

```java
package action.in.blog.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/app/api")
public class UserController {

    @GetMapping("/articles")
    public String articles() {
        return "user articles";
    }

    @GetMapping("/private-articles")
    public String privateArticles() {
        return "user's private articles";
    }

}
```

#### 3.2.2. UserControllerTest Class

테스트 환경을 구성하는 방법은 위와 동일합니다. 각 테스트 별로 다음과 같은 내용을 검증합니다.

- login 메소드
    - InMemoryUserDetailsManager 객체에 추가된 사용자로 로그인을 수행합니다.
    - 앱 시큐리티 필터 체인에 정의한 로그인 성공 URL로 리다이렉트 되는지 확인합니다.
- wrongCredential_login_redirectFailure 메소드
    - 잘못된 사용자 자격 증명을 사용해 로그인을 수행합니다.
    - 앱 시큐리티 필터 체인에 정의한 로그인 실패 URL로 리다이렉트 되는지 확인합니다.
- articles 메소드
    - 애플리케이션 리소스에 접근합니다.
    - 인증하지 않은 사용자로 접근하는 경우 정상적으로 응답을 받는지 확인합니다.
- privateArticles 메소드
    - 애플리케이션 리소스에 접근합니다.
    - 인증된 사용자인 경우 정상적으로 응답을 받는지 확인합니다.
- withoutAuthentication_privateArticles_redirectToLogin 메소드
    - 애플리케이션 리소스에 접근합니다.
    - 사용자 인증 없이 접근하는 경우 로그인 페이지로 리다이렉트 되는지 확인합니다.

```java
package action.in.blog.controller;

import action.in.blog.MockUsers;
import action.in.blog.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Import({SecurityConfig.class, MockUsers.class})
@WebMvcTest(controllers = {UserController.class})
class UserControllerTest {

    @Autowired
    MockMvc sut;

    UserDetails sampleUser() {
        return User.withDefaultPasswordEncoder()
                .username("jua")
                .password("123")
                .build();
    }

    @Test
    void login() throws Exception {

        sut.perform(
                        post("/app/login")
                                .param("username", "jua")
                                .param("password", "123")
                                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                )
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/app/home"))
        ;
    }

    @Test
    void wrongCredential_login_redirectFailure() throws Exception {

        sut.perform(
                        post("/app/login")
                                .param("username", "jua")
                                .param("password", "12345")
                                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                )
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/app/login?error"))
        ;
    }

    @Test
    void articles() throws Exception {

        sut.perform(
                        get("/app/api/articles")
                )
                .andExpect(content().string("user articles"))
        ;
    }

    @Test
    void privateArticles() throws Exception {

        sut.perform(
                        get("/app/api/private-articles")
                                .with(user(sampleUser()))
                )
                .andExpect(content().string("user's private articles"))
        ;
    }

    @Test
    void withoutAuthentication_privateArticles_redirectToLogin() throws Exception {

        sut.perform(
                        get("/app/api/private-articles")
                )
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("http://localhost/login"))
        ;
    }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-12-06-how-to-make-multiple-security-filter-chains>

[web-mvc-filter-test-on-spring-boot-link]: https://junhyunny.github.io/java/spring-boot/web-mvc-filter-test-on-spring-boot/