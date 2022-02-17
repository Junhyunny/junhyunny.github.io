---
title: "JWT AuthenticationProvider 만들기"
search: false
category:
  - spring-boot
  - spring-security
last_modified_at: 2022-02-17T23:55:00
---

<br>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [JWT, Json Web Token][json-web-token-link]
- [Spring Security][spring-security-link]
- [AuthenticationFilter 만들기][make-authentication-filter-link]

## 0. 들어가면서

[AuthenticationFilter 만들기][make-authentication-filter-link] 포스트에 이어서 이번엔 `JWT(Json Web Token)`을 통한 사용자 인증과 관련된 내용을 구현하였습니다. 

##### Spring Security Authentication Process
- [Spring Security][spring-security-link]에서 인증 과정에 대한 자세한 설명을 다루고 있습니다.
- 파란색 박스 부분은 `Spring Security` 프레임워크에서 제공하는 `ProvideManager` 클래스를 사용하였습니다.
- 빨간색 박스 부분이 이번에 구현할 `JwtAuthenticationProvider` 클래스가 속하는 부분입니다.

<p align="center">
    <img src="/images/make-authentication-provider-1.JPG" width="80%" class="image__border">
</p>
<center>이미지 출처, https://springbootdev.com/2017/08/23/spring-security-authentication-architecture/</center><br>

## 1. 변경 내용

[AuthenticationFilter 만들기][make-authentication-filter-link] 포스트와 비교하여 어떤 내용이 변경되었는지 확인해보겠습니다. 

### 1.1. 패키지 구성
- `JwtAuthenticationProviderTest` 클래스 구현을 위한 테스트를 작성하였습니다.
- `JwtAuthenticationProvider` 클래스를 구현하였습니다.
- `AuthControllerTest` 클래스에서 API 테스트를 추가하였습니다.

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
                            ├── controller
                            │   └── AuthControllerTest.java
                            └── provider
                                └── JwtAuthenticationProviderTest.java

25 directories, 18 files
```

### 1.2. application.yml
- `JwtAuthenticationProvider` 클래스에서 사용할 비밀 키 값을 설정에 추가하였습니다.

```yml
jwt:
  secret: validSecreteKey
```

## 2. 기능 구현하기

### 2.1. JwtAuthenticationProvider 클래스
- `Spring Security` 프레임워크에서 제공하는 `AuthenticationProvider` 인터페이스를 구현하였습니다.
- `supports` 메소드는 해당 `AuthenticationProvider`가 지원하는 인증인지 확인합니다.
- `authenticate` 메소드
    - 전달 받은 JWT(Json Web Token)을 파싱(parsing)하여 인증된 토큰 정보를 생성합니다.
    - 유효하지 않거나 시간이 만료된 토큰에 대해 예외(exception)을 던집니다.
    - `JwtParser` 클래스의 `parse` 메소드는 아래와 같은 예외를 던질 수 있으며 이에 대한 처리를 하였습니다.
        - MalformedJwtException
        - SignatureException
        - ExpiredJwtException
        - IllegalArgumentException

```java
package action.in.blog.security.provider;

import action.in.blog.security.exception.JwtInvalidException;
import action.in.blog.security.tokens.JwtAuthenticationToken;
import io.jsonwebtoken.*;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Log4j2
@Component
public class JwtAuthenticationProvider implements AuthenticationProvider {

    private final String KEY_ROLES = "roles";
    private final byte[] secretKeyByte;

    public JwtAuthenticationProvider(@Value("${jwt.secret}") String secretKey) {
        this.secretKeyByte = secretKey.getBytes();
    }

    private Collection<? extends GrantedAuthority> createGrantedAuthorities(Claims claims) {
        List<String> roles = (List) claims.get(KEY_ROLES);
        List<GrantedAuthority> grantedAuthorities = new ArrayList<>();
        for (String role : roles) {
            grantedAuthorities.add(() -> role);
        }
        return grantedAuthorities;
    }

    /**
     * JwtParser.parse method can throw below exception, so you should catch and do something.
     * MalformedJwtException – if the specified JWT was incorrectly constructed (and therefore invalid). Invalid JWTs should not be trusted and should be discarded.
     * SignatureException – if a JWS signature was discovered, but could not be verified. JWTs that fail signature validation should not be trusted and should be discarded.
     * ExpiredJwtException – if the specified JWT is a Claims JWT and the Claims has an expiration time before the time this method is invoked.
     * IllegalArgumentException – if the specified string is null or empty or only whitespace.
     */
    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        Claims claims;
        try {
            claims = Jwts.parser().setSigningKey(secretKeyByte).parseClaimsJws(((JwtAuthenticationToken) authentication).getJsonWebToken()).getBody();
        } catch (SignatureException signatureException) {
            throw new JwtInvalidException("signature key is different", signatureException);
        } catch (ExpiredJwtException expiredJwtException) {
            throw new JwtInvalidException("expired token", expiredJwtException);
        } catch (MalformedJwtException malformedJwtException) {
            throw new JwtInvalidException("malformed token", malformedJwtException);
        } catch (IllegalArgumentException illegalArgumentException) {
            throw new JwtInvalidException("using illegal argument like null", illegalArgumentException);
        }
        return new JwtAuthenticationToken(claims.getSubject(), "", createGrantedAuthorities(claims));
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return JwtAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
```

### 2.2. SecurityConfig 클래스
- [AuthenticationFilter 만들기][make-authentication-filter-link] 포스트와 코드는 동일하지만, 리마인드 차원에서 코드를 가져왔습니다.
- `SecurityConfig` 생성자
    - `AuthenticationManagerBuilder` 빈을 주입 받습니다.
    - 구현한 `AuthenticationProvider` 빈을 주입 받습니다. 
    - `AuthenticationManager`에서 사용할 `AuthenticationProvider`를 `AuthenticationManagerBuilder`에 추가합니다. 

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
                // 나머지는 인증 확인
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

## 3. 테스트하기

### 3.1. JwtAuthenticationProviderTest 클래스

```java
package action.in.blog.security.provider;

import action.in.blog.security.exception.JwtInvalidException;
import action.in.blog.security.tokens.JwtAuthenticationToken;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.isA;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class JwtAuthenticationProviderTest {

    final int ONE_SECONDS = 1000;
    final int ONE_MINUTE = 60 * ONE_SECONDS;
    final String KEY_ROLES = "roles";

    JwtAuthenticationProvider provider;

    @BeforeEach
    public void setup() {
        provider = new JwtAuthenticationProvider("validSecretKey");
    }

    private String createToken(String userName, List<String> roles, Date now, int expireMin, String secretKey) {
        Claims claims = Jwts.claims().setSubject(userName);
        claims.put(KEY_ROLES, roles);
        return Jwts.builder().setClaims(claims).setIssuedAt(now).setExpiration(new Date(now.getTime() + ONE_MINUTE * expireMin)).signWith(SignatureAlgorithm.HS256, secretKey.getBytes()).compact();
    }

    @Test
    public void givenNotSupportAuthentication_whenCallSupports_thenReturnFalse() {

        assertThat(provider.supports(UsernamePasswordAuthenticationToken.class), equalTo(false));
        assertThat(provider.supports(AbstractAuthenticationToken.class), equalTo(false));
        assertThat(provider.supports(Authentication.class), equalTo(false));
    }

    @Test
    public void givenSupportAuthentication_whenCallSupports_thenReturnTrue() {

        assertThat(provider.supports(JwtAuthenticationToken.class), equalTo(true));
    }

    @Test
    public void givenTokenMadeByDifferentSecretKey_whenCallAuthentication_thenThrowJwtInvalidException() {

        String invalidToken = createToken("Junhyunny", Collections.singletonList("ROLE_ADMIN"), new Date(), 30, "invalidSecretKey");
        JwtAuthenticationToken authentication = new JwtAuthenticationToken(invalidToken);

        Throwable throwable = assertThrows(JwtInvalidException.class, () -> {
            provider.authenticate(authentication);
        });

        // same with below assert
        // assertThat(throwable, is(instanceOf(JwtInvalidException.class)));
        assertThat(throwable, isA(JwtInvalidException.class));
        assertThat(throwable.getMessage(), equalTo("signature key is different"));
    }

    @Test
    public void givenExpiredToken_whenCallAuthentication_thenThrowJwtInvalidException() {

        Date past = new Date(System.currentTimeMillis() - ONE_MINUTE * 10);
        String invalidToken = createToken("Junhyunny", Collections.singletonList("ROLE_ADMIN"), past, 5, "validSecretKey");
        JwtAuthenticationToken authentication = new JwtAuthenticationToken(invalidToken);

        Throwable throwable = assertThrows(JwtInvalidException.class, () -> {
            provider.authenticate(authentication);
        });

        assertThat(throwable, isA(JwtInvalidException.class));
        assertThat(throwable.getMessage(), equalTo("expired token"));
    }

    @Test
    public void givenMalformedToken_whenCallAuthentication_thenThrowJwtInvalidException() {

        JwtAuthenticationToken authentication = new JwtAuthenticationToken("some malformed token here");

        Throwable throwable = assertThrows(JwtInvalidException.class, () -> {
            provider.authenticate(authentication);
        });

        assertThat(throwable, isA(JwtInvalidException.class));
        assertThat(throwable.getMessage(), equalTo("malformed token"));
    }

    @Test
    public void givenNullJwt_whenCallAuthentication_thenThrowJwtInvalidException() {

        JwtAuthenticationToken authentication = new JwtAuthenticationToken(null);

        Throwable throwable = assertThrows(JwtInvalidException.class, () -> {
            provider.authenticate(authentication);
        });

        assertThat(throwable, isA(JwtInvalidException.class));
        assertThat(throwable.getMessage(), equalTo("using illegal argument like null"));
    }

    @Test
    public void givenValidToken_whenCallAuthentication_thenReturnAuthentication() {

        String validToken = createToken("Junhyunny", Collections.singletonList("ROLE_ADMIN"), new Date(), 30, "validSecretKey");
        JwtAuthenticationToken authentication = new JwtAuthenticationToken(validToken);

        Authentication authenticated = provider.authenticate(authentication);

        assertThat(authenticated.getPrincipal(), equalTo("Junhyunny"));
        assertThat(authenticated.getCredentials(), equalTo(""));
        Collection<? extends GrantedAuthority> authorities = authenticated.getAuthorities();
        for (GrantedAuthority authority : authorities) {
            assertThat(authority.getAuthority(), equalTo("ROLE_ADMIN"));
        }
    }
}
```

### 3.2. AuthControllerTest 클래스
- [AuthenticationFilter 만들기][make-authentication-filter-link] 포스트에서 작성한 테스트 코드는 주석하였습니다.

```java
package action.in.blog.security.controller;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Date;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(value = {
        "jwt.secret=validSecretKey"
})
@AutoConfigureMockMvc
public class AuthControllerTest {

    final int ONE_SECONDS = 1000;
    final int ONE_MINUTE = 60 * ONE_SECONDS;
    final String KEY_ROLES = "roles";

    @Autowired
    MockMvc mockMvc;

    private String createToken(String userName, List<String> roles, Date now, int expireMin, String secretKey) {
        Claims claims = Jwts.claims().setSubject(userName);
        claims.put(KEY_ROLES, roles);
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + ONE_MINUTE * expireMin))
                .signWith(SignatureAlgorithm.HS256, secretKey.getBytes())
                .compact();
    }

    // ... test code written before

    @Test
    public void givenInvalidToken_whenCallNotExistsPath_thenIsForbidden() throws Exception {

        String inValidToken = createToken(
                "Junhyunny",
                Collections.singletonList("ROLE_ADMIN"),
                new Date(),
                30,
                "invalidSecreteKey");

        mockMvc.perform(
                        post("/something-other").
                                header("Authorization", "Bearer " + inValidToken)
                )
                .andExpect(status().isForbidden());
    }

    @Test
    public void givenExpiredToken_whenCallNotExistsPath_thenIsForbidden() throws Exception {

        Date past = new Date(System.currentTimeMillis() - ONE_MINUTE * 10);
        String expiredToken = createToken(
                "Junhyunny",
                Collections.singletonList("ROLE_ADMIN"),
                past,
                5,
                "validSecretKey");

        mockMvc.perform(
                        post("/something-other").
                                header("Authorization", "Bearer " + expiredToken)
                )
                .andExpect(status().isForbidden());
    }

    @Test
    public void givenValidToken_whenCallNotExistsPath_thenNotFound() throws Exception {

        String validToken = createToken(
                "Junhyunny",
                Collections.singletonList("ROLE_ADMIN"),
                new Date(),
                30,
                "validSecretKey");

        mockMvc.perform(
                        post("/something-other").
                                header("Authorization", "Bearer " + validToken)
                )
                .andExpect(status().isNotFound());
    }
}
```

## CLOSING
작성 중 입니다.

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-02-15-make-authentication-filter>

#### REFERENCE
- <https://bcp0109.tistory.com/301>
- <https://silvernine.me/wp/?p=1135>

[json-web-token-link]: https://junhyunny.github.io/information/json-web-token/
[spring-security-link]: https://junhyunny.github.io/spring-security/spring-security/
[make-authentication-filter-link]: https://junhyunny.github.io/spring-boot/spring-security/make-authentication-filter/