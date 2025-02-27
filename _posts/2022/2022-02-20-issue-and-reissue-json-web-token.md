---
title: "JWT(Json Web Token) 발행과 재발행"
search: false
category:
  - spring-boot
  - spring-security
last_modified_at: 2022-02-20T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [JWT(Json Web Token)][json-web-token-link]
- [JWT AuthenticationFilter 만들기][make-authentication-filter-link]
- [JWT AuthenticationProvider 만들기][make-authentication-provider-link]

## 0. 들어가면서

이번 포스트에선 토큰 발행과 재발행과 관련된 로직을 구현하였습니다. 
구현 설명에 앞서 `Spring Security` 프레임워크의 기본적인 인증 프로스세스와 제가 의도하고 있는 인증 프로세스를 다시 정리해보겠습니다. 

##### Basic Spring Security Authentication Process
- `AuthenticationFilter`는 `AuthenticationManager`에게 인증 절차를 위임합니다.
- `AuthenticationManager`는 `AuthenticationProvider`에게 인증 절차를 위임합니다.
- 기본적으로 사용되는 `Provider`는 `DaoAuthenticationProvider` 입니다.
- `DaoAuthenticationProvider`는 데이터베이스에서 사용자 정보를 조회하기 위해 `UserDetailsService`를 사용합니다.
- 이 단계에서 프레임워크를 이용하는 개발자가 구현한 클래스가 사용됩니다.
    - `UserDetailsService` 인터페이스를 구현한 `CustomUserDetailsService`
    - 영속성 관련 기술 스택에 따라 적절하게 데이터베이스에서 사용자 정보를 조회합니다.
- 위 단계를 거쳐 인증이 이뤄지기 때문에 `Spring Security` 프레임워크 예제는 `UserDetailsService` 인터페이스를 구현한 내용들이 많습니다. 

<p align="center">
    <img src="/images/issue-and-reissue-json-web-token-1.JPG" width="100%" class="image__border">
</p>

##### JWT(Json Web Token) Authentication Process in before posts
- `AuthenticationFilter`에서 HTTP 요청 헤더로부터 `JWT`을 추출합니다.
- `AuthenticationFilter`는 `AuthenticationManager`에게 인증 절차를 위임하며, `JWT`을 전달합니다.
- `AuthenticationManager`는 `AuthenticationProvider`에게 인증 절차를 위임하며, `JWT`을 전달합니다.
- [JWT AuthenticationProvider 만들기][make-authentication-provider-link] 포스트에서 구현한 `JwtAuthenticationProvider`가 사용됩니다.
    - 토큰의 유효성만 확인하기 때문에 `UserDetailsService` 인터페이스를 사용할 필요가 없습니다.

<p align="center">
    <img src="/images/issue-and-reissue-json-web-token-2.JPG" width="100%" class="image__border">
</p>

##### Issue and reissue JWT at this post
- 토큰 발행과 재발행 시 API 경로는 `/auth/**`에 포함되므로 인증 실패 시에도 발급 프로세스는 계속 진행됩니다.
    - `SecurityConfig` 설정에서 `/auth/**` 경로에 대해 모두 인증 없이도 접근할 수 있도록 허가했습니다. 
- 토큰 발행 - `AuthService` 클래스
    - ID와 비밀번호를 통해 정상적인 사용자임을 확인합니다.
    - 정상적인 사용자인 경우 액세스 토큰(access token)과 리프레시 토큰(refresh token)을 발급합니다.
    - `Spring Security` 프레임워크의 전형적인 사용자 인증 과정을 `AuthService` 클래스에서 구현하였습니다.
- 토큰 재발행 - `AuthService` 클래스
    - 전달받은 리프레시 토큰의 유효성을 검사합니다.
    - 유효한 리프레시 토큰인 경우 추출한 클레임(claim) 정보에서 사용자 ID를 추출합니다.
    - 추출한 사용자 ID를 이용해 사용자 정보를 조회하고 새로운 액세스 토큰과 리프레시 토큰을 발급합니다.

<p align="center">
    <img src="/images/issue-and-reissue-json-web-token-3.JPG" width="100%" class="image__border">
</p>

## 1. 패키지 구성 및 설정 변경 내용

### 1.1. 패키지 구성
- 다음 클래스에 변경이 있습니다.
    - `AuthController` 클래스 - 로그인 API 변경 및 토큰 재발행 API 추가
- 다음과 같은 클래스들이 추가되었습니다.
    - `JsonWebTokenDto` 클래스 - 액세스 토큰, 리프레시 토큰, 인증 타입을 가진 클래스
    - `UserDto` 클래스 - 사용자 이름, 비밀번호를 전달받는 클래스
    - `User` 클래스 - JPA 엔티티 클래스
    - `JsonWebTokenIssuer` 클래스 - 토큰 발행, 리프레시 토큰 파싱 기능 제공
    - `AuthService` 클래스 - 로그인 처리, 토큰 재발행 기능 제공
    - `AuthRepository` 클래스 - 사용자 조회 기능 제공
- 다음과 같은 테스트 코드들이 추가되었습니다.
    - `AuthControllerTest` 클래스 - 로그인과 토큰 재발행 시 발생할 수 있는 시나리오에 대한 테스트 코드 추가
    - `JsonWebTokenIssuerTest` 클래스 - 토큰 발행과 리프레시 토큰 파싱(parsing) 테스트 코드 추가 
    - `AuthServiceTest` 클래스 - 로그인, 토큰 재발행 프로세스 테스트 코드 추가
    - `AuthRepositoryTest` 클래스 - `data.sql`을 통한 데이터 삽입 여부 확인 테스트 코드 추가

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
    │   │                   ├── dto
    │   │                   │   ├── JsonWebTokenDto.java
    │   │                   │   └── UserDto.java
    │   │                   ├── entity
    │   │                   │   └── User.java
    │   │                   ├── exception
    │   │                   │   └── JwtInvalidException.java
    │   │                   ├── provider
    │   │                   │   └── JwtAuthenticationProvider.java
    │   │                   ├── repository
    │   │                   │   └── AuthRepository.java
    │   │                   ├── service
    │   │                   │   └── AuthService.java
    │   │                   ├── tokens
    │   │                   │   └── JwtAuthenticationToken.java
    │   │                   └── utils
    │   │                       └── JsonWebTokenIssuer.java
    │   └── resources
    │       ├── application-test.yml
    │       ├── application.yml
    │       ├── db
    │       │   ├── data.sql
    │       │   └── schema.sql
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
                            ├── provider
                            │   └── JwtAuthenticationProviderTest.java
                            ├── repository
                            │   └── AuthRepositoryTest.java
                            ├── service
                            │   └── AuthServiceTest.java
                            └── utils
                                └── JsonWebTokenIssuerTest.java

34 directories, 30 files
```

### 1.2. application.yml
- 테스트를 위한 설정이 포함되었으로 `spring.profiles` 속성을 통해 설정을 구분합니다.

```yml
spring:
  profiles:
    active: test
```

### 1.3. application-test.yml
- 테스트 관련 설정을 추가하였습니다. 
- `spring.sql.init` 속성을 통해 서비스가 시작하는 시점에 미리 테이블 스키마와 데이터를 추가합니다.
    - `schema-locations` - 데이터베이스 스키마 SQL 설정
    - `data-locations` - 데이터베이스 초기 데이터 INSERT SQL 설정
- `jwt.refresh-secret` 속성을 통해 리프레시 토큰(refresh token)을 만들 때 사용할 키를 추가하였습니다.
- 기타 JPA, H2 설정을 추가합니다.

```yml
spring:
  sql:
    init:
      mode: always
      schema-locations: classpath:db/schema.sql
      data-locations: classpath:db/data.sql
  jpa:
    show-sql: true
    hibernate:
      ddl-auto: none
    defer-datasource-initialization: true
  datasource:
    driver-class-name: org.h2.Driver
    url: jdbc:h2:~/test
    username: sa
    password:
  h2:
    console:
      path: /h2-console
      enabled: true

jwt:
  secret: validSecretKey
  refresh-secret: refreshSecretKey
```

### 1.4. schema.sql
- 사용자 테이블을 만듭니다.

```sql
drop table if exists tb_user CASCADE;

create table tb_user
(
    user_name varchar(255) not null,
    password  varchar(255),
    authority varchar(255),
    primary key (user_name)
);
```

### 1.5. data.sql
- 비밀번호는 문자열 "123"을 미리 인코딩한 값입니다.

```sql
insert into tb_user (user_name, password, authority)
values ('Junhyunny', '{bcrypt}$2a$10$LDwzHdFsoeeo0CjXoYdmwelLK4CjdiMtGvPHDYPQ039JEx19L7C8e', 'ROLE_ADMIN');
```

## 2. 기능 구현하기

단순하게 필드만 있는 DTO(Data Transfer Object)와 엔티티(Entity) 클래스에 대한 내용은 다루지 않았습니다. 
`AuthRepository` 인터페이스도 `JpaRepository` 인터페이스를 상속하였을 뿐 추가한 기능이 없으므로 설명하지 않았습니다.

### 2.1. JsonWebTokenIssuer 클래스
- 토큰 발행과 리프래시 토큰에서 클레임 정보를 추출하는 기능을 제공합니다.
    - `createAccessToken` 메소드 - 액세스 토큰을 발급합니다.
    - `createRefreshToken` 메소드 - 리프레시 토큰을 발급합니다.
    - `parseClaimsFromRefreshToken` 메소드 - 리프레시 토큰에서 클레임 정보를 추출합니다.
- 액세스 토큰과 리프레시 토큰을 만들 때 사용하는 비밀 키는 다른 값을 사용합니다.
- 액세스 토큰과 리프레시 토큰 만료 시간은 설정을 통해 주입 받을 수 있지만 기본 값을 지정해주었습니다.
    - 액세스 토큰 만료 시간 10분
    - 리프레시 토큰 만료 시간 30분

```java
package action.in.blog.security.utils;

import action.in.blog.security.exception.JwtInvalidException;
import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Date;

@Component
public class JsonWebTokenIssuer {

    private final int ONE_SECONDS = 1000;
    private final int ONE_MINUTE = 60 * ONE_SECONDS;
    private final String KEY_ROLES = "roles";

    private final byte[] secretKeyBytes;
    private final byte[] refreshSecretKeyBytes;
    private final int expireMin;
    private final int refreshExpireMin;

    public JsonWebTokenIssuer(
            @Value("${jwt.secret}") String secretKey,
            @Value("${jwt.refresh-secret}") String refreshSecretKey,
            @Value("${jwt.expire-min:10}") int expireMin,
            @Value("${jwt.refresh-expire-min:30}") int refreshExpireMin) {
        this.secretKeyBytes = secretKey.getBytes();
        this.refreshSecretKeyBytes = refreshSecretKey.getBytes();
        this.expireMin = expireMin;
        this.refreshExpireMin = refreshExpireMin;
    }

    private String createToken(String userName, String authority, byte[] secretKeyBytes, int expireMin) {
        Date now = new Date();
        Claims claims = Jwts.claims().setSubject(userName);
        claims.put(KEY_ROLES, Collections.singleton(authority));
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + ONE_MINUTE * expireMin))
                .signWith(SignatureAlgorithm.HS256, secretKeyBytes)
                .compact();
    }

    public String createAccessToken(String userName, String authority) {
        return createToken(userName, authority, secretKeyBytes, expireMin);
    }

    public String createRefreshToken(String userName, String authority) {
        return createToken(userName, authority, refreshSecretKeyBytes, refreshExpireMin);
    }

    public Claims parseClaimsFromRefreshToken(String jsonWebToken) {
        Claims claims;
        try {
            claims = Jwts.parser().setSigningKey(refreshSecretKeyBytes).parseClaimsJws(jsonWebToken).getBody();
        } catch (SignatureException signatureException) {
            throw new JwtInvalidException("signature key is different", signatureException);
        } catch (ExpiredJwtException expiredJwtException) {
            throw new JwtInvalidException("expired token", expiredJwtException);
        } catch (MalformedJwtException malformedJwtException) {
            throw new JwtInvalidException("malformed token", malformedJwtException);
        } catch (IllegalArgumentException illegalArgumentException) {
            throw new JwtInvalidException("using illegal argument like null", illegalArgumentException);
        }
        return claims;
    }
}
```

### 2.2. AuthService 클래스
- `login` 메소드
    - ID를 이용해 존재하는 사용자인지 조회하고, 없는 경우 `UsernameNotFoundException`을 던집니다.
    - 인코딩 된 비밀번호와 전달받은 비밀번호를 비교하고, 다른 경우 `BadCredentialsException`을 던집니다.
    - 사용자 인증에 성공하면 `JsonWebTokenDto` 객체를 만들어 전달합니다.
- `reissue` 메소드
    - 파라미터로 전달 받은 토큰이 `Bearer` 인증 타입이 아닌 경우 `JwtInvalidException`을 던집니다.
    - `jwtIssuer` 객체를 통해 리프레시 토큰으로부터 클레임 정보를 추출하며, 없는 경우 `JwtInvalidException`을 던집니다.
    - ID를 이용해 존재하는 사용자인지 조회하고, 없는 경우 `UsernameNotFoundException`을 던집니다.
    - 위 단계를 모두 통과하면 `JsonWebTokenDto` 객체를 만들어 전달합니다.
- `AuthService` 클래스가 다양한 예외(exception)들을 던지지만, 모두 `AuthenticationException`을 상속 받은 예외들입니다.
- `AuthenticationException`를 던지면, 필터 체인에서 403(forbidden) 처리를 수행해줍니다. (테스트 코드에서 확인 가능)

```java
package action.in.blog.security.service;

import action.in.blog.security.dto.JsonWebTokenDto;
import action.in.blog.security.dto.UserDto;
import action.in.blog.security.entity.User;
import action.in.blog.security.exception.JwtInvalidException;
import action.in.blog.security.repository.AuthRepository;
import action.in.blog.security.utils.JsonWebTokenIssuer;
import io.jsonwebtoken.Claims;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AuthService {

    private final String GRANT_TYPE_BEARER = "Bearer";

    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final JsonWebTokenIssuer jwtIssuer;

    public AuthService(
            AuthRepository authRepository,
            PasswordEncoder passwordEncoder,
            JsonWebTokenIssuer jwtIssuer) {
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtIssuer = jwtIssuer;
    }

    private String resolveToken(String bearerToken) {
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(GRANT_TYPE_BEARER)) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private JsonWebTokenDto createJsonWebTokenDto(User user) {
        String userName = user.getUserName();
        String authority = user.getAuthority();
        return JsonWebTokenDto.builder()
                .grantType(GRANT_TYPE_BEARER)
                .accessToken(jwtIssuer.createAccessToken(userName, authority))
                .refreshToken(jwtIssuer.createRefreshToken(userName, authority))
                .build();
    }

    public JsonWebTokenDto login(UserDto userDto) {

        User user = authRepository.findById(userDto.getUserName())
                .orElseThrow(() -> new UsernameNotFoundException("username is not found"));

        if (!passwordEncoder.matches(userDto.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("bad credential: using unmatched password");
        }

        return createJsonWebTokenDto(user);
    }

    public JsonWebTokenDto reissue(String bearerToken) {

        String refreshToken = resolveToken(bearerToken);
        if (!StringUtils.hasText(refreshToken)) {
            throw new JwtInvalidException("invalid grant type");
        }

        Claims claims = jwtIssuer.parseClaimsFromRefreshToken(refreshToken);
        if (claims == null) {
            throw new JwtInvalidException("not exists claims in token");
        }

        User user = authRepository.findById(claims.getSubject())
                .orElseThrow(() -> new UsernameNotFoundException("username is not found"));

        return createJsonWebTokenDto(user);
    }
}
```

### 2.3. AuthController 클래스
- `login` 메소드
    - 사용자 로그인 정보를 `UserDto` 클래스를 통해 전달받습니다.
- `reissue` 메소드
    - 요청 헤더 정보에서 토큰 정보를 꺼냅니다.
    - 헤더에 토큰이 없는 경우 요청은 400(bad request) 처리됩니다.

```java
package action.in.blog.security.controller;

import action.in.blog.security.dto.JsonWebTokenDto;
import action.in.blog.security.dto.UserDto;
import action.in.blog.security.service.AuthService;
import lombok.extern.log4j.Log4j2;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Log4j2
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final String AUTHORIZATION_HEADER = "Authorization";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public JsonWebTokenDto login(UserDto userDto) {
        return authService.login(userDto);
    }

    @PostMapping("/reissue")
    public JsonWebTokenDto reissue(@RequestHeader(AUTHORIZATION_HEADER) String bearerToken) {
        return authService.reissue(bearerToken);
    }
}
```

## 3. 테스트하기

주요 기능들에 대한 테스트 코드만 확인해보겠습니다.

### 3.1. JsonWebTokenIssuerTest 클래스

```java
package action.in.blog.security.utils;

import action.in.blog.security.exception.JwtInvalidException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.isA;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class JsonWebTokenIssuerTest {

    JsonWebTokenIssuer jsonWebTokenIssuer;

    @BeforeEach
    public void setup() {
        jsonWebTokenIssuer = new JsonWebTokenIssuer(
                "secretKey",
                "refreshSecretKey",
                10,
                30);
    }

    Claims parseClaims(String jsonWebToken, String secretKey) {
        return Jwts.parser()
                .setSigningKey(secretKey.getBytes())
                .parseClaimsJws(jsonWebToken)
                .getBody();
    }

    @Test
    public void givenUser_whenCreateAccessTokenByUser_thenParsedClaimsWithSameValue() {

        String jwt = jsonWebTokenIssuer.createAccessToken("Junhyunny", "ROLE_ADMIN");

        Claims claims = parseClaims(jwt, "secretKey");

        assertThat(claims.getSubject(), equalTo("Junhyunny"));
        assertThat(claims.get("roles"), isA(List.class));
        List<String> roles = (List) claims.get("roles");
        for (String role : roles) {
            assertThat(role, equalTo("ROLE_ADMIN"));
        }
    }

    @Test
    public void givenUser_whenCreateRefreshTokenByUser_thenParsedClaimsWithSameValue() {

        String jwt = jsonWebTokenIssuer.createRefreshToken("Junhyunny", "ROLE_ADMIN");

        Claims claims = parseClaims(jwt, "refreshSecretKey");

        assertThat(claims.getSubject(), equalTo("Junhyunny"));
        assertThat(claims.get("roles"), isA(List.class));
        List<String> roles = (List) claims.get("roles");
        for (String role : roles) {
            assertThat(role, equalTo("ROLE_ADMIN"));
        }
    }

    @Test
    public void givenInValidRefreshToken_whenParseClaimsFromRefreshToken_thenThrowJwtInvalidException() {

        String invalidRefreshToken = "invalid refresh token";

        assertThrows(JwtInvalidException.class, () -> {
            jsonWebTokenIssuer.parseClaimsFromRefreshToken(invalidRefreshToken);
        });
    }

    @Test
    public void givenAccessToken_whenParseClaimsFromRefreshToken_thenThrowsJwtInvalidException() {

        String accessToken = jsonWebTokenIssuer.createAccessToken("Junhyunny", "ROLE_ADMIN");

        assertThrows(JwtInvalidException.class, () -> {
            jsonWebTokenIssuer.parseClaimsFromRefreshToken(accessToken);
        });
    }

    @Test
    public void givenRefreshToken_whenParseClaimsFromRefreshToken_thenReturnClaims() {

        String refreshToken = jsonWebTokenIssuer.createRefreshToken("Junhyunny", "ROLE_ADMIN");

        Claims claims = jsonWebTokenIssuer.parseClaimsFromRefreshToken(refreshToken);

        assertThat(claims.getSubject(), equalTo("Junhyunny"));
        assertThat(claims.get("roles"), isA(List.class));
        List<String> roles = (List) claims.get("roles");
        for (String role : roles) {
            assertThat(role, equalTo("ROLE_ADMIN"));
        }
    }
}
```

### 3.2. AuthServiceTest 클래스

```java
package action.in.blog.security.service;

import action.in.blog.security.dto.JsonWebTokenDto;
import action.in.blog.security.dto.UserDto;
import action.in.blog.security.entity.User;
import action.in.blog.security.exception.JwtInvalidException;
import action.in.blog.security.repository.AuthRepository;
import action.in.blog.security.utils.JsonWebTokenIssuer;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.isA;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

public class AuthServiceTest {

    AuthRepository mockAuthRepository;
    PasswordEncoder passwordEncoder;
    JsonWebTokenIssuer mockJwtIssuer;

    AuthService authService;

    @BeforeEach
    public void setup() {
        mockAuthRepository = Mockito.mock(AuthRepository.class);
        passwordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
        mockJwtIssuer = Mockito.mock(JsonWebTokenIssuer.class);
        authService = new AuthService(mockAuthRepository, passwordEncoder, mockJwtIssuer);
    }

    UserDto getUserDto(String userName, String password) {
        return UserDto.builder()
                .userName(userName)
                .password(password)
                .build();
    }

    User getUser(String userName, String password, String authority) {
        return User.builder()
                .userName(userName)
                .password(passwordEncoder.encode(password))
                .authority(authority)
                .build();
    }

    @Test
    public void givenNotExistUserName_whenLogin_thenThrowUsernameNotFoundException() {

        UserDto userDto = getUserDto("Junhyunny", "1234");

        Throwable throwable = assertThrows(UsernameNotFoundException.class, () -> {
            authService.login(userDto);
        });

        assertThat(throwable, isA(UsernameNotFoundException.class));
        assertThat(throwable.getMessage(), equalTo("username is not found"));
    }

    @Test
    public void givenNotMatchedPassword_whenLogin_thenThrowBadCredentialsException() {

        UserDto userDto = getUserDto("Junhyunny", "1234");
        when(mockAuthRepository.findById("Junhyunny")).thenReturn(
                Optional.of(
                        getUser("Junhyunny", "12345", "ROLE_ADMIN")
                )
        );

        Throwable throwable = assertThrows(BadCredentialsException.class, () -> {
            authService.login(userDto);
        });

        assertThat(throwable, isA(BadCredentialsException.class));
        assertThat(throwable.getMessage(), equalTo("bad credential: using unmatched password"));
    }

    @Test
    public void givenValidUserDto_whenLogin_thenReturnJsonWebTokenDto() {

        UserDto userDto = getUserDto("Junhyunny", "1234");
        User user = getUser("Junhyunny", "1234", "ROLE_ADMIN");
        when(mockAuthRepository.findById("Junhyunny")).thenReturn(Optional.of(user));
        when(mockJwtIssuer.createAccessToken("Junhyunny", "ROLE_ADMIN")).thenReturn("accessToken");
        when(mockJwtIssuer.createRefreshToken("Junhyunny", "ROLE_ADMIN")).thenReturn("refreshToken");

        JsonWebTokenDto jsonWebTokenDto = authService.login(userDto);

        assertThat(jsonWebTokenDto.getGrantType(), equalTo("Bearer"));
        assertThat(jsonWebTokenDto.getAccessToken(), equalTo("accessToken"));
        assertThat(jsonWebTokenDto.getRefreshToken(), equalTo("refreshToken"));
    }

    @Test
    public void givenInvalidGrandType_whenReissue_thenThrowJwtInvalidException() {

        Throwable throwable = assertThrows(JwtInvalidException.class, () -> {
            authService.reissue("refreshToken");
        });
        assertThat(throwable.getMessage(), equalTo("invalid grant type"));
    }

    @Test
    public void givenNullClaims_whenReissue_thenThrowJwtInvalidException() {

        when(mockJwtIssuer.parseClaimsFromRefreshToken("refreshToken")).thenReturn(null);

        Throwable throwable = assertThrows(JwtInvalidException.class, () -> {
            authService.reissue("Bearer refreshToken");
        });
        assertThat(throwable.getMessage(), equalTo("not exists claims in token"));
    }

    @Test
    public void givenValidRefreshToken_whenReissue_thenJsonWebTokenDto() {

        User user = getUser("Junhyunny", "1234", "ROLE_ADMIN");
        Claims claims = Jwts.claims().setSubject("Junhyunny");
        claims.put("roles", Collections.singleton("ROLE_ADMIN"));

        when(mockAuthRepository.findById("Junhyunny")).thenReturn(Optional.of(user));
        when(mockJwtIssuer.parseClaimsFromRefreshToken("refreshToken")).thenReturn(claims);
        when(mockJwtIssuer.createAccessToken("Junhyunny", "ROLE_ADMIN")).thenReturn("accessToken");
        when(mockJwtIssuer.createRefreshToken("Junhyunny", "ROLE_ADMIN")).thenReturn("refreshToken");

        JsonWebTokenDto jsonWebTokenDto = authService.reissue("Bearer refreshToken");

        assertThat(jsonWebTokenDto.getGrantType(), equalTo("Bearer"));
        assertThat(jsonWebTokenDto.getAccessToken(), equalTo("accessToken"));
        assertThat(jsonWebTokenDto.getRefreshToken(), equalTo("refreshToken"));
    }
}
```

### 3.3. AuthControllerTest 클래스
- 추가된 테스트 메소드들만 확인해보겠습니다.

```java
package action.in.blog.security.controller;

import action.in.blog.security.dto.JsonWebTokenDto;
import action.in.blog.security.utils.JsonWebTokenIssuer;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Collections;
import java.util.Date;
import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@SpringBootTest(value = {
        "jwt.secret=accessSecretKey",
        "jwt.refresh-secret=refreshSecretKey",
        "jwt.expire-min=10",
        "jwt.refresh-expire-min=30"
})
@AutoConfigureMockMvc
public class AuthControllerTest {

    final int ONE_SECONDS = 1000;
    final int ONE_MINUTE = 60 * ONE_SECONDS;
    final String KEY_ROLES = "roles";

    @Autowired
    MockMvc mockMvc;

    @SpyBean
    JsonWebTokenIssuer spyJsonWebTokenIssuer;

    @AfterEach
    public void clear() {
        Mockito.reset(spyJsonWebTokenIssuer);
    }

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

    private String getAccessToken() {
        return createToken(
                "Junhyunny",
                Collections.singletonList("ROLE_ADMIN"),
                new Date(),
                10,
                "accessSecretKey");
    }

    private String getRefreshToken() {
        return createToken(
                "Junhyunny",
                Collections.singletonList("ROLE_ADMIN"),
                new Date(),
                30,
                "refreshSecretKey");
    }

    // ... test code written before

    @Test
    public void givenNotExistsUserDto_whenLogin_thenIsForbidden() throws Exception {

        mockMvc.perform(
                post("/auth/login")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("userName", "Not-Junhyunny")
                        .param("password", "123")
        ).andExpect(status().isForbidden());
    }

    @Test
    public void givenNotMatchedPasswordDto_whenLogin_thenIsForbidden() throws Exception {

        mockMvc.perform(
                post("/auth/login")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("userName", "Junhyunny")
                        .param("password", "1234")
        ).andExpect(status().isForbidden());
    }

    @Test
    public void givenValidUserDto_whenLogin_thenReturnAccessToken() throws Exception {

        ObjectMapper mapper = new ObjectMapper();
        String accessToken = getAccessToken();
        String refreshToken = getRefreshToken();
        when(spyJsonWebTokenIssuer.createAccessToken("Junhyunny", "ROLE_ADMIN")).thenReturn(accessToken);
        when(spyJsonWebTokenIssuer.createRefreshToken("Junhyunny", "ROLE_ADMIN")).thenReturn(refreshToken);

        MvcResult mvcResult = mockMvc.perform(
                        post("/auth/login")
                                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                                .param("userName", "Junhyunny")
                                .param("password", "123")
                )
                .andExpect(status().isOk())
                .andReturn();

        JsonWebTokenDto jsonWebTokenDto = mapper.readValue(mvcResult.getResponse().getContentAsString(), JsonWebTokenDto.class);
        assertThat(jsonWebTokenDto.getAccessToken(), equalTo(accessToken));
        assertThat(jsonWebTokenDto.getRefreshToken(), equalTo(refreshToken));
        assertThat(jsonWebTokenDto.getGrantType(), equalTo("Bearer"));
    }

    @Test
    public void givenWithoutAuthorization_whenReissue_thenIsBadRequest() throws Exception {

        mockMvc.perform(
                        post("/auth/reissue")
                )
                .andExpect(status().isBadRequest());
    }

    @Test
    public void givenNotBearerToken_whenReissue_thenIsForbidden() throws Exception {

        String refreshToken = getRefreshToken();

        mockMvc.perform(
                        post("/auth/reissue")
                                .header("Authorization", refreshToken)
                )
                .andExpect(status().isForbidden());
    }

    @Test
    public void givenAccessToken_whenReissue_thenIsForbidden() throws Exception {

        String accessToken = getAccessToken();

        mockMvc.perform(
                        post("/auth/reissue")
                                .header("Authorization", "Bearer " + accessToken)
                )
                .andExpect(status().isForbidden());
    }

    @Test
    public void givenRefreshToken_whenReissue_thenReturnAccessToken() throws Exception {

        ObjectMapper mapper = new ObjectMapper();
        String accessToken = getAccessToken();
        String refreshToken = getRefreshToken();
        when(spyJsonWebTokenIssuer.createAccessToken("Junhyunny", "ROLE_ADMIN")).thenReturn(accessToken);
        when(spyJsonWebTokenIssuer.createRefreshToken("Junhyunny", "ROLE_ADMIN")).thenReturn(refreshToken);

        MvcResult mvcResult = mockMvc.perform(
                        post("/auth/reissue")
                                .header("Authorization", "Bearer " + refreshToken)
                )
                .andExpect(status().isOk())
                .andReturn();

        JsonWebTokenDto jsonWebTokenDto = mapper.readValue(mvcResult.getResponse().getContentAsString(), JsonWebTokenDto.class);
        assertThat(jsonWebTokenDto.getAccessToken(), equalTo(accessToken));
        assertThat(jsonWebTokenDto.getRefreshToken(), equalTo(refreshToken));
        assertThat(jsonWebTokenDto.getGrantType(), equalTo("Bearer"));
    }
}
```

## CLOSING

사실 `Spring Security` 프레임워크 인증을 자세히 들여다 본 계기는 리액트를 이용한 대시보드 클론 코딩을 하는 과정에서 백엔드 서비스 기능도 함께 붙혀 보자는 생각이 들었기 때문입니다. 
포스트로 정리려고 고민하다 보니 대시보드 클론 코딩은 이미 잊혀진 것 같습니다. 
공부한 CSS 내용들을 잊어버리기 전에 빨리 다시 시작해야겠습니다. 

테스트 코드만으로 기능을 검증했기 때문에 프론트 서비스와 연결하면 실제 예상하지 못한 케이스들을 발견할 수 있을 것 같습니다. 
그 과정에서 좋은 인사이트를 얻는다면 정리해서 포스트로 올릴 예정입니다. 
`Spring Security` 프레임워크를 파헤치다보니 몇 가지 디자인 패턴들이 눈에 띄었는데 관련된 내용도 정리해야겠습니다. 

##### cURL 테스트
- `cURL`을 이용한 테스트 결과를 함께 첨부하였습니다.
- `jq` 커맨드 라인을 파이프라인에 추가하여 결과를 보기 좋게 변경하였습니다.
- 로그인 시 토큰 발행

```
% curl -X POST -H 'Content-Type: x-www-form-urlencoded' "http://localhost:8080/auth/login?userName=Junhyunny&password=123" | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   391    0   391    0     0   4286      0 --:--:-- --:--:-- --:--:--  4887
{
  "grantType": "Bearer",
  "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJKdW5oeXVubnkiLCJyb2xlcyI6WyJST0xFX0FETUlOIl0sImlhdCI6MTY0NTMzNDUwMiwiZXhwIjoxNjQ1MzM1MTAyfQ.J0bLVWblxErXUNElduA6_KZ4_iUZkJoP1_XQ32KL65M",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJKdW5oeXVubnkiLCJyb2xlcyI6WyJST0xFX0FETUlOIl0sImlhdCI6MTY0NTMzNDUwMiwiZXhwIjoxNjQ1MzM2MzAyfQ.DwMVC7qRdRjAEmdZcJqcc1gckxwB-DyfRBwDniYF9mE"
}
```

- 액세스 토큰을 이용 시 토큰 재발행 실패
    - 403 응답 에러 코드

```
% curl -X POST -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJKdW5oeXVubnkiLCJyb2xlcyI6WyJST0xFX0FETUlOIl0sImlhdCI6MTY0NTMzNDUwMiwiZXhwIjoxNjQ1MzM1MTAyfQ.J0bLVWblxErXUNElduA6_KZ4_iUZkJoP1_XQ32KL65M' -v "http://localhost:8080/auth/reissue" | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0*   Trying ::1:8080...
* Connected to localhost (::1) port 8080 (#0)
> POST /auth/reissue HTTP/1.1
> Host: localhost:8080
> User-Agent: curl/7.77.0
> Accept: */*
> Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJKdW5oeXVubnkiLCJyb2xlcyI6WyJST0xFX0FETUlOIl0sImlhdCI6MTY0NTMzNDUwMiwiZXhwIjoxNjQ1MzM1MTAyfQ.J0bLVWblxErXUNElduA6_KZ4_iUZkJoP1_XQ32KL65M
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 403 
< X-Content-Type-Options: nosniff
< X-XSS-Protection: 1; mode=block
< Cache-Control: no-cache, no-store, max-age=0, must-revalidate
< Pragma: no-cache
< Expires: 0
< X-Frame-Options: SAMEORIGIN
< Content-Length: 0
< Date: Sun, 20 Feb 2022 05:29:51 GMT
< 
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
* Connection #0 to host localhost left intact
```

- 리프레시 토큰을 이용 시 토큰 재발행 성공

```
 % curl -X POST -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJKdW5oeXVubnkiLCJyb2xlcyI6WyJST0xFX0FETUlOIl0sImlhdCI6MTY0NTMzNDUwMiwiZXhwIjoxNjQ1MzM2MzAyfQ.DwMVC7qRdRjAEmdZcJqcc1gckxwB-DyfRBwDniYF9mE' "http://localhost:8080/auth/reissue" | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   391    0   391    0     0   4607      0 --:--:-- --:--:-- --:--:--  5077
{
  "grantType": "Bearer",
  "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJKdW5oeXVubnkiLCJyb2xlcyI6WyJST0xFX0FETUlOIl0sImlhdCI6MTY0NTMzNTA4OSwiZXhwIjoxNjQ1MzM1Njg5fQ.X0IWDRvNVjMslKeeDK05W5OZB92sdYbpAIvXETFRJ0w",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJKdW5oeXVubnkiLCJyb2xlcyI6WyJST0xFX0FETUlOIl0sImlhdCI6MTY0NTMzNTA4OSwiZXhwIjoxNjQ1MzM2ODg5fQ.n49-T3y8F_aq1PAHxI08AieIgAye5lSD4inO0SI_q54"
}
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-02-15-make-authentication-filter>

#### REFERENCE
- <https://bcp0109.tistory.com/301>
- <https://silvernine.me/wp/?p=1135>
- <https://jskim1991.medium.com/spring-boot-tdd-with-spring-boot-starter-security-jwt-d29e455c08cb>

[json-web-token-link]: https://junhyunny.github.io/information/json-web-token/
[make-authentication-filter-link]: https://junhyunny.github.io/spring-boot/spring-security/make-authentication-filter/
[make-authentication-provider-link]: https://junhyunny.github.io/spring-boot/spring-security/make-authentication-provider/