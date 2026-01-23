---
title: "JWT AuthenticationFilter 만들기"
search: false
category:
  - spring-boot
  - spring-security
last_modified_at: 2022-02-16T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [OncePerRequestFilter][once-per-request-filter-link]

👉 이어서 읽기를 추천합니다.
- [JWT AuthenticationProvider 만들기][make-authentication-provider-link]
- [JWT(Json Web Token) 발행과 재발행][issue-and-reissue-json-web-token-link]

## 0. 들어가면서

인증 과정은 `@EnableAuthorizationServer` 애너테이션과 `AuthorizationServerConfigurerAdapter` 클래스 상속만으로 쉽게 인증과 토큰 발급이 가능하다보니 내부 프로세스에 대해 크게 관심이 없었던 것 같습니다. 
최근에 이전 글들을 다시 정리하는 과정에서 `Spring Security` 진영이 더는 OAuth2.0 인증 서버와 관련된 기능을 제공하지 않는다는 사실을 알았습니다. 

> 2019/11/14 - Spring Security OAuth 2.0 Roadmap Update<br/>
> No Authorization Server Support<br/>
> ...<br/>
> Spring Security’s Authorization Server support was never a good fit. 
> An Authorization Server requires a library to build a product. 
> Spring Security, being a framework, is not in the business of building libraries or products. 
> For example, we don’t have a JWT library, but instead we make Nimbus easy to use. 
> And we don’t maintain our own SAML IdP, CAS or LDAP products.<br/>
> In 2019, there are plenty of both commercial and open-source authorization servers available. 
> Thus, the Spring Security team has decided to no longer provide support for authorization servers.<br/>
> UPDATE: We’d like to thank everyone for your feedback on the decision to not support Authorization Server. 
> Due to this feedback and some internal discussions, we are taking another look at this decision. 
> We’ll notify the community on any progress.

`'그러면 Spring Security 프레임워크를 이용한 사용자 인증 과정은 어떻게 처리하지?'`라는 의문이 들어서 관련된 내용을 찾아보았습니다. 
좋은 글들이 많았지만, 필터에서 `AuthenticationProvider` 클래스나 `UserDetailsService` 인터페이스 구현체를 직접 사용하는 예제들이 대부분이었습니다. 
저는 참고한 글들을 바탕으로 `Spring Security` 진영에서 소개했던 인증 아키텍처 방식에 맞게 구조를 변경하고 정리하였습니다. 

##### Spring Security Authentication Process
- 아래 그림에 AuthenticationFilter 부분을 JWT(Json Web Token)을 사용한다는 가정하에 구현하였습니다. 

<p align="center">
    <img src="/images/make-authentication-filter-1.JPG" width="80%" class="image__border">
</p>
<center>https://springbootdev.com/2017/08/23/spring-security-authentication-architecture/</center>

## 1. 패키지 구조 

```
.
├── HELP.md
├── action-in-blog.iml
├── mvnw
├── mvnw.cmd
├── pom.xml
└── src
    ├── main
    │   ├── java
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               ├── ActionInBlogApplication.java
    │   │               ├── filters
    │   │               │   └── JwtAuthenticationFilter.java
    │   │               └── security
    │   │                   ├── config
    │   │                   │   ├── JwtSecurityConfig.java
    │   │                   │   └── SecurityConfig.java
    │   │                   ├── controller
    │   │                   │   └── AuthController.java
    │   │                   ├── exception
    │   │                   │   └── JwtInvalidException.java
    │   │                   ├── provider
    │   │                   │   └── JwtAuthenticationProvider.java
    │   │                   └── tokens
    │   │                       └── JwtAuthenticationToken.java
    │   └── resources
    │       ├── application.yml
    │       ├── static
    │       └── templates
    └── test
        └── java
            └── action
                └── in
                    └── blog
                        ├── ActionInBlogApplicationTests.java
                        ├── filters
                        │   └── JwtAuthenticationFilterTest.java
                        └── security
                            └── controller
                                └── AuthControllerTest.java

24 directories, 17 files
```

## 2. 기능 구현하기

이번 포스트에선 `JwtAuthenticationFilter` 클래스에 초점을 맞추었으며, 일부 클래스들은 메서드 구현 부분이 비어있습니다. 
다음에 이어지는 포스트를 통해 구현할 예정입니다.

### 2.1. JwtAuthenticationFilter 클래스
- `OncePerRequestFilter` 클래스를 상속받아서 한 요청에 대해 한 번만 수행합니다. 
- 필터 내부에서 사용할 `AuthenticationManager` 객체를 외부로부터 전달받습니다.
- `resolveToken` 메서드
    - 헤더에 `Authorization` 키가 존재하는지 확인합니다.
    - 인증 토큰의 인증 타입(grant type)이 `Bearer `인지 확인합니다.
    - `Bearer ` 부분을 잘라내어 토큰을 추출하여 반환합니다.
- `doFilterInternal` 메서드
    - 헤더에서 추출한 토큰을 기반으로 `JwtAuthenticationToken` 객체를 만듭니다.
    - `AuthenticationManager` 객체에게 `JwtAuthenticationToken` 객체를 전달하여 인증을 요청합니다.
    - 인증이 성공하면 `SecurityContextHolder` 클래스에 담습니다.
    - 인증 과정에서 예외가 발생하면 `SecurityContextHolder` 클래스에 담긴 인증 정보를 제거합니다.
- `SecurityContextHolder` 클래스는 별도로 설정이 없는 경우 `ThreadLocal` 클래스를 이용해 스레드 별로 컨텍스트를 관리합니다.

```java
package action.in.blog.filters;

import action.in.blog.security.tokens.JwtAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String AUTHORIZATION_HEADER = "Authorization";
    public static final String BEARER_PREFIX = "Bearer ";

    private final AuthenticationManager authenticationManager;

    public JwtAuthenticationFilter(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        String jwt = resolveToken(request);

        if (StringUtils.hasText(jwt)) {
            try {
                Authentication jwtAuthenticationToken = new JwtAuthenticationToken(jwt);
                Authentication authentication = authenticationManager.authenticate(jwtAuthenticationToken);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (AuthenticationException authenticationException) {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

### 2.2. JwtAuthenticationToken 클래스
- 인증을 위해 `AuthenticationManager` 클래스에게 전달될 클래스입니다.
- `AuthenticationProvider`에서 사용하기 위해 `AbstractAuthenticationToken` 클래스를 상속받았습니다.

```java
package action.in.blog.security.tokens;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

public class JwtAuthenticationToken extends AbstractAuthenticationToken {

    private String jsonWebToken;
    private Object principal;
    private Object credentials;

    public JwtAuthenticationToken(String jsonWebToken) {
        super(null);
        this.jsonWebToken = jsonWebToken;
        this.setAuthenticated(false);
    }

    public JwtAuthenticationToken(Object principal, Object credentials, Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.principal = principal;
        this.credentials = credentials;
        super.setAuthenticated(true);
    }

    public Object getCredentials() {
        return credentials;
    }

    public Object getPrincipal() {
        return this.principal;
    }

    public String getJsonWebToken() {
        return this.jsonWebToken;
    }
}
```

### 2.3. JwtSecurityConfig 클래스
- `SecurityConfigurerAdapter` 클래스를 상속받아서 추가로 필요한 설정들을 추가할 수 있는 `configure` 메서드를 구현합니다.
- `AuthenticationManager` 객체는 `SecurityConfig` 클래스로부터 주입받습니다. 
- 구현한 `JwtAuthenticationFilter`를 `LogoutFilter` 다음에 실행되도록 추가합니다.

```java
package action.in.blog.security.config;

import action.in.blog.filters.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.SecurityConfigurerAdapter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.DefaultSecurityFilterChain;
import org.springframework.security.web.authentication.logout.LogoutFilter;

@RequiredArgsConstructor
public class JwtSecurityConfig extends SecurityConfigurerAdapter<DefaultSecurityFilterChain, HttpSecurity> {

    private final AuthenticationManager authenticationManager;

    @Override
    public void configure(HttpSecurity http) {
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(authenticationManager);
        http.addFilterAfter(filter, LogoutFilter.class);
    }
}
```

### 2.4. JwtAuthenticationProvider 클래스
- 이번 포스트에서 구현을 하진 않지만, `AuthenticationManager` 클래스에 등록하기 위한 `AuthenticationProvider` 클래스입니다.
- `@Component` 애너테이션을 붙혀 빈(bean)으로 생성합니다.

```java
package action.in.blog.security.provider;

import lombok.extern.log4j.Log4j2;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;

@Log4j2
@Component
public class JwtAuthenticationProvider implements AuthenticationProvider {

    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        log.warn("implement later");
        return null;
    }

    @Override
    public boolean supports(Class<?> authentication) {
        log.warn("implement later");
        return false;
    }
}
```

### 2.5. SecurityConfig 클래스
- `SecurityConfig` 생성자
    - `AuthenticationManagerBuilder` 빈을 주입 받습니다.
    - 구현한 `AuthenticationProvider` 빈을 주입 받습니다. 
    - `AuthenticationManager`에서 사용할 `AuthenticationProvider`를 `AuthenticationManagerBuilder`에 추가합니다. 
- `configure` 메서드
    - 코드 주석을 참고하시기 바랍니다.

```java
package action.in.blog.security.config;

import action.in.blog.security.provider.JwtAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;

@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private final String ROLE_ADMIN = "ADMIN";
    private final String ROLE_NORMAL = "NORMAL";

    private final AuthenticationManagerBuilder authenticationManagerBuilder;

    public SecurityConfig(
            AuthenticationManagerBuilder authenticationManagerBuilder,
            JwtAuthenticationProvider jsonWebTokenProvider
    ) {
        this.authenticationManagerBuilder = authenticationManagerBuilder;
        this.authenticationManagerBuilder.authenticationProvider(jsonWebTokenProvider);
    }

    @Override
    public void configure(WebSecurity web) throws Exception {
        super.configure(web);
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
                // REST API 방식이므로 CSRF 보안 토큰 생성 기능 종료
                .csrf().disable()
                // 요청 별 인증 필요 여부 혹은 권한 확인
                .authorizeRequests()
                // /auth 로 시작하는 모든 경로는 권한 확인 없이 수행 가능합니다.
                .antMatchers("/auth/**").permitAll()
                // 나머지는 인증 확인 및 역할 확인
                .anyRequest()
                .hasAnyRole(ROLE_ADMIN, ROLE_NORMAL)
                // h2-console 사용을 위한 설정
                .and()
                .headers()
                .frameOptions()
                .sameOrigin()
                // 세션을 사용하지 않도록 변경
                .and()
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                // JWT 토큰 인증 필터 설정
                .and()
                .apply(new JwtSecurityConfig(authenticationManagerBuilder.getOrBuild()));
    }
}
```

### 2.6. AuthController 클래스
- 테스트를 위해 간단한 컨트롤러 클래스를 만들었습니다.

```java
package action.in.blog.security.controller;

import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Log4j2
@RestController
@RequestMapping("/auth")
public class AuthController {

    @PostMapping("/login")
    public void login() {
       log.warn("implement later");
    }
}
```

## 3. 테스트하기

`given-when-then` 이름 규칙에 맞추어 메서드를 작명하였습니다.
- given - 이전 상황, 문맥, 조건
- when - 행동
- then - 결과

### 3.1. JwtAuthenticationFilterTest 클래스

```java
package action.in.blog.filters;

import action.in.blog.security.exception.JwtInvalidException;
import action.in.blog.security.tokens.JwtAuthenticationToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import java.io.IOException;
import java.util.Collections;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class JwtAuthenticationFilterTest {

    MockHttpServletRequest mockRequest;
    MockHttpServletResponse mockResponse;
    FilterChain mockFilterChain;
    AuthenticationManager mockAuthenticationManager;

    JwtAuthenticationFilter filter;

    @BeforeEach
    public void setup() {
        mockRequest = new MockHttpServletRequest();
        mockResponse = new MockHttpServletResponse();
        mockFilterChain = Mockito.mock(FilterChain.class);
        mockAuthenticationManager = Mockito.mock(AuthenticationManager.class);
        filter = new JwtAuthenticationFilter(mockAuthenticationManager);
    }

    @Test
    public void givenTokenNotInHeader_whenDoFilterInternal_thenAuthenticationManagerNotBeenCalled() throws ServletException, IOException {

        // setup
        when(mockAuthenticationManager.authenticate(any())).thenReturn(null);

        // action
        filter.doFilterInternal(mockRequest, mockResponse, mockFilterChain);

        // verify
        verify(mockAuthenticationManager, never()).authenticate(any());
        verify(mockFilterChain, times(1)).doFilter(mockRequest, mockResponse);
    }

    @Test
    public void givenInvalidTokenInHeader_whenDoFilterInternal_thenAuthenticationManagerNotBeenCalled() throws ServletException, IOException {

        // setup
        mockRequest.addHeader("Authorization", "invalid token");
        when(mockAuthenticationManager.authenticate(any())).thenReturn(null);

        // action
        filter.doFilterInternal(mockRequest, mockResponse, mockFilterChain);

        // verify
        verify(mockAuthenticationManager, never()).authenticate(any());
        verify(mockFilterChain, times(1)).doFilter(mockRequest, mockResponse);
    }

    @Test
    public void givenReturnNullAfterAuthenticateWithValidToken_whenDoFilterInternal_thenAuthenticationFromSecurityContextHolderIsNull() throws ServletException, IOException {

        // setup
        mockRequest.addHeader("Authorization", "Bearer valid_token");
        JwtAuthenticationToken token = new JwtAuthenticationToken("valid_token");

        when(mockAuthenticationManager.authenticate(token)).thenReturn(null);

        // action
        filter.doFilterInternal(mockRequest, mockResponse, mockFilterChain);

        // verify
        assertThat(SecurityContextHolder.getContext().getAuthentication(), nullValue());
    }

    @Test
    public void givenThrowAuthenticationException_whenDoFilterInternal_thenSecurityContextInContextHolderIsNullAndClearContextBeenCalled() throws ServletException, IOException {

        // setup
        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        MockedStatic<SecurityContextHolder> utilities = Mockito.mockStatic(SecurityContextHolder.class);

        utilities.when(SecurityContextHolder::getContext).thenReturn(securityContext);

        mockRequest.addHeader("Authorization", "Bearer valid_token");
        JwtAuthenticationToken token = new JwtAuthenticationToken("valid_token");

        when(mockAuthenticationManager.authenticate(token)).thenThrow(new JwtInvalidException("time expired"));

        // action
        filter.doFilterInternal(mockRequest, mockResponse, mockFilterChain);

        // verify
        utilities.verify(SecurityContextHolder::clearContext, times(1));
        assertThat(SecurityContextHolder.getContext().getAuthentication(), nullValue());

        // clear static Mockito
        Mockito.clearAllCaches();
    }

    @Test
    public void givenValidToken_whenDoFilterInternal_thenSecurityContextHasAuthentication() throws ServletException, IOException {

        mockRequest.addHeader("Authorization", "Bearer valid_token");
        JwtAuthenticationToken token = new JwtAuthenticationToken("valid_token");
        JwtAuthenticationToken authenticatedToken = new JwtAuthenticationToken(
                "Junhyunny",
                "",
                Collections.singletonList(
                        () -> "ROLE_ADMIN"
                )
        );

        when(mockAuthenticationManager.authenticate(token)).thenReturn(authenticatedToken);

        // action
        filter.doFilterInternal(mockRequest, mockResponse, mockFilterChain);

        // verify
        assertThat(SecurityContextHolder.getContext().getAuthentication(), equalTo(authenticatedToken));
    }

}
```

### 3.2 AuthControllerTest 클래스
- `Spring Security` 프레임워크를 통해 생성된 필터 체인이 정상적으로 동작하는지 테스트합니다.

```java
package action.in.blog.security.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    public void givenWithOutToken_whenCallLogin_thenIsOk() throws Exception {

        mockMvc.perform(
                        post("/auth/login")
                )
                .andExpect(status().isOk());
    }

    @Test
    public void givenWithoutToken_whenCallNotExistsPath_thenIsForbidden() throws Exception {

        mockMvc.perform(
                        post("/something-other")
                )
                .andExpect(status().isForbidden());
    }
}
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-02-15-make-authentication-filter>

#### REFERENCE
- <https://bcp0109.tistory.com/301>
- <https://silvernine.me/wp/?p=1135>
- <https://jskim1991.medium.com/spring-boot-tdd-with-spring-boot-starter-security-jwt-d29e455c08cb>


[json-web-token-link]: https://junhyunny.github.io/information/json-web-token/
[once-per-request-filter-link]: https://junhyunny.github.io/spring-boot/once-per-request-filter/

[make-authentication-provider-link]: https://junhyunny.github.io/spring-boot/spring-security/make-authentication-provider/
[issue-and-reissue-json-web-token-link]: https://junhyunny.github.io/spring-boot/spring-security/issue-and-reissue-json-web-token/