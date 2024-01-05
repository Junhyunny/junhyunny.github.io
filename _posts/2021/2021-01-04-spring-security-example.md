---
title: "Spring Security JWT OAuth Example"
search: false
category:
  - spring-boot
  - spring-security
last_modified_at: 2021-02-17T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [JWT(Json Web Token)][json-web-token-link]
* [Spring Security Basic][spring-security-link]

## 1. 용어 정리

인증 예제를 살펴보기 전에 간단하게 OAuth(OpenID Authentication) 인증과 관련된 용어에 대해 알아보겠습니다. 

* Resource Owner
    * 사용자이며 개인 정보에 주인입니다.
* Application (혹은 Client)
    * 사용자가 이용하고 싶은 서비스 혹은 어플리케이션입니다. 
* Authorization Server 
    * 사용자 정보를 인증하는 서버이며 인증된 사용자에게 토큰을 발급해줍니다. 
    * `clientId`, `clientSecret`을 전달받아 인증을 수행합니다.
* Resource Server 
    * 사용자 정보를 지닌 서버이며 인증된 사용자에게만 발급된 토큰을 통해 접근 가능합니다.

##### 인증 프로세스 예시

간단하게 `StackOverflow` 서비스 로그인을 예시로 들어보겠습니다. 

1. `사용자(Resource Owner)`는 `StackOverflow(Application) 서비스`에 질문을 남기기 위해 로그인을 시도합니다.
1. `StackOverflow 서비스`는 사용자 로그인 옵션을 제공합니다.
    * E-Mail, 비밀번호로 로그인
    * 구글 계정으로 로그인
    * GitHub 계정으로 로그인
    * Facebook 계정으로 로그인
1. `사용자`는 GitHub 계정으로 로그인 옵션을 선택합니다.
    * GitHub 계정으로 로그인하기 위한 화면이 연결됩니다.
    * 사용자는 자신의 GitHub 계정 정보를 입력합니다.
1. `사용자`의 GitHub 계정 정보는 `GitHub 인증 서버(Authorization Server)`로 전달됩니다.
1. 정상적인 인증이 된다면 `GitHub 인증 서버`는 `StackOverflow 서비스`로 인증 토큰을 발급합니다.
1. `StackOverflow 서비스`는 발급받은 인증 토큰으로 `GitHub 리소스 서버(Resource Server)`에 필요한 사용자 정보를 요청하여 전달받습니다.
1. `사용자`의 화면은 인증 화면에서 `StackOverflow 서비스` 화면으로 리다이렉트(redirect)됩니다. 
1. `사용자`는 `StackOverflow 서비스`를 이용할 수 있습니다.

<p align="center">
    <img src="/images/spring-security-example-1.JPG" width="80%">
</p>
<center>https://docs.pivotal.io/p-identity/1-14/grant-types.html</center>

## 2. 서비스 구조

이번 포스트에서 사용한 `spring-security-oauth2` 라이브러리 2.3.3.RELEASE 버전을 사용하면 인증 서버와 리소스 서버 기능을 구현할 수 있습니다. 
다음과 같은 서비스 인증 과정을 구현하였습니다. 

* 터미널에서 cURL 커맨드를 사용하였습니다.
* cURL 커맨드를 통해 인증 서버로 사용자 정보를 전달합니다.
* 인증 서버는 사용자 정보가 유효한지 확인합니다.
* 사용자 정보가 유효하다면 JWT 토큰을 생성 후 클라이언트에게 전달합니다.
* cURL 커맨드로 전달받은 토큰과 함께 리소스 서버에게 사용자 정보를 요청합니다. 
* 리소스 서버는 토큰이 유효한지, 권한은 충분한지 확인합니다. 
* 유효한 토큰인 경우 사용자 리소스를 클라이언트에게 전달합니다.

<p align="center">
    <img src="/images/spring-security-example-2.JPG" width="100%" class="image__border">
</p>

## 3. Authroization Server 구현

인증 서비스를 먼저 구현하겠습니다. 
다음과 같은 패키지 구조를 가지며 주요 클래스들을 위주로 살펴보겠습니다. 

```
./
├── Dockerfile
├── action-in-blog.iml
├── mvnw
├── mvnw.cmd
├── pom.xml
└── src
    ├── main
    │   ├── java
    │   │   └── blog
    │   │       └── in
    │   │           └── action
    │   │               ├── ActionInBlogApplication.java
    │   │               ├── converter
    │   │               │   └── StringListConverter.java
    │   │               ├── entity
    │   │               │   └── Member.java
    │   │               ├── repository
    │   │               │   └── MemberRepository.java
    │   │               ├── security
    │   │               │   ├── AuthorizationServer.java
    │   │               │   └── SecurityConfig.java
    │   │               └── service
    │   │                   └── MemberService.java
    │   └── resources
    │       └── application.yml
    └── test
        └── java
            └── blog
                └── in
                    └── action
                        └── ActionInBlogApplicationTests.java
```

### 3.1. application.yml

* H2 메모리 데이터베이스를 사용하였습니다.
* 8080 포트를 가집니다.

```yml
server:
  port: 8080
spring:
  h2:
    console:
      enabled: true
      path: /h2-console
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password: 123
```

### 3.2. AuthorizationServer 클래스

* `@EnableAuthorizationServer` 애너테이션을 사용해 인증 서버 설정을 위한 빈(bean)으로 등록합니다. 
* `AuthorizationServerConfigurerAdapter` 클래스를 상속받아 인증 서버 구현에 필요한 기능을 확장합니다.
* 기타 설명은 가독성을 위해 코드에 주석으로 표시하였습니다.
    * `AuthenticationManager` 개념에 대한 이해가 부족한 분은 [Spring Security Basic][spring-security-link] 포스트를 참고 바랍니다.

```java
package blog.in.action.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.config.annotation.configurers.ClientDetailsServiceConfigurer;
import org.springframework.security.oauth2.config.annotation.web.configuration.AuthorizationServerConfigurerAdapter;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableAuthorizationServer;
import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerEndpointsConfigurer;
import org.springframework.security.oauth2.provider.token.TokenEnhancerChain;
import org.springframework.security.oauth2.provider.token.store.JwtAccessTokenConverter;

import java.util.Arrays;

@RequiredArgsConstructor
@Configuration
@EnableAuthorizationServer
public class AuthorizationServer extends AuthorizationServerConfigurerAdapter {

    private String clientId = "CLIENT_ID";

    private String clientSecret = "CLIENT_SECRET";

    private int ACCESS_TOKEN_VALID_SECONDS = 10 * 60 * 24;

    private int REFRESH_TOKEN_VALID_SECONDS = 60 * 60 * 24;

    private final PasswordEncoder passwordEncoder;

    private final AuthenticationManager authenticationManager;

    private final JwtAccessTokenConverter jwtAccessTokenConverter;

    @Override
    public void configure(ClientDetailsServiceConfigurer clients) throws Exception {
        // 해당 인증 서버를 이용하는 클라이언트 어플리케이션 정보를 추가합니다.
        clients
                // 인증 서버 메모리에 추가합니다.
                .inMemory()
                // 클라이언트 어플리케이션에 미리 발급된 ID
                .withClient(clientId)
                // 클라이언트 어플리케이션에 미리 발급된 SECRETE, 암호화하여 추가
                .secret(passwordEncoder.encode(clientSecret))
                // 인증 방법은 비밀번호와 리프레시 토큰
                .authorizedGrantTypes("password", "refresh_token")
                .scopes("read")
                // access token 유효 시간 등록
                .accessTokenValiditySeconds(ACCESS_TOKEN_VALID_SECONDS)
                // refresh token 유효 시간 등록
                .refreshTokenValiditySeconds(REFRESH_TOKEN_VALID_SECONDS);
    }

    @Override
    public void configure(AuthorizationServerEndpointsConfigurer endpoints) throws Exception {
        TokenEnhancerChain tokenEnhancerChain = new TokenEnhancerChain();
        // JSON WEB TOKEN 을 사용하기 위한 컨버터 등록
        tokenEnhancerChain.setTokenEnhancers(Arrays.asList(jwtAccessTokenConverter));
        endpoints
                // Spring Security 프레임워크에서 사용하는 AuthenticationManager 등록
                .authenticationManager(authenticationManager)
                // 토큰 강화를 위한 TokenEnhancer 등록
                .tokenEnhancer(tokenEnhancerChain);
    }
}
```

### 3.4. SecurityConfig 클래스

* `@EnableWebSecurity` 애너테이션을 통해 웹 암호화 설정 빈으로 등록합니다.
* `WebSecurityConfigurerAdapter` 클래스를 상속하여 필요한 암호화에 필요한 기능을 확장합니다.
* 기타 설명은 가독성을 위해 코드에 주석으로 표시하였습니다.
    * `UserDetailsService` 개념에 대한 이해가 부족한 분은 [Spring Security Basic][spring-security-link] 포스트를 참고 바랍니다.

```java
package blog.in.action.security;

import blog.in.action.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.provider.token.store.JwtAccessTokenConverter;

@RequiredArgsConstructor
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private final MemberService memberService;

    @Bean
    public JwtAccessTokenConverter jwtAccessTokenConverter() throws Exception {
        // JWT 토큰을 만들기 위한 컨버터 생성
        JwtAccessTokenConverter converter = new JwtAccessTokenConverter();
        converter.setSigningKey("TEMP_SIGN_KEY");
        converter.afterPropertiesSet();
        return converter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // 암호화 인코더 
        return new BCryptPasswordEncoder();
    }

    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        // Spring Security 프레임워크에서 필요한 AuthenticationManager 등록
        return super.authenticationManagerBean();
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        // AuthenticationManager에서 사용하는 UserDetailsService 등록
        auth.userDetailsService(memberService);
    }
}
```

### 3.5. MemberService 클래스

* `UserDetailsService` 클래스를 상속받아서 사용자 정보 조회 기능을 확장합니다.
* `AuthenticationManager` 클래스가 인증 과정에서 `loadUserByUsername` 메소드를 호출하여 사용자 정보를 확인합니다.

```java
package blog.in.action.service;

import blog.in.action.entity.Member;
import blog.in.action.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Optional;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class MemberService implements UserDetailsService {

    private final MemberRepository memberRepository;

    private Collection<? extends GrantedAuthority> authorities(Member member) {
        return member.getAuthorities()
            .stream()
            .map(authority -> new SimpleGrantedAuthority(authority))
            .collect(Collectors.toList());
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<Member> option = memberRepository.findById(username);
        if (!option.isPresent()) {
            throw new UsernameNotFoundException(username);
        }
        Member member = option.get();
        return new User(member.getId(), member.getPassword(), authorities(member));
    }
}
```

### 3.6. ActionInBlogApplication 클래스

* `CommandLineRunner` 클래스를 확장하여 서비스 테스트에 필요한 데이터를 미리 추가합니다.

```java
package blog.in.action;

import blog.in.action.entity.Member;
import blog.in.action.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;

@RequiredArgsConstructor
@SpringBootApplication
public class ActionInBlogApplication implements CommandLineRunner {

    private final MemberRepository memberRepository;

    private final PasswordEncoder passwordEncoder;

    public static void main(String[] args) {
        SpringApplication.run(ActionInBlogApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        memberRepository.save(Member.builder()
                .id("Junhyunny")
                .password(passwordEncoder.encode("123"))
                .authorities(Collections.singletonList("ADMIN"))
                .build()
        );
    }
}
```

## 4. Resource Server 구현

리소스 서비스를 먼저 구현하겠습니다. 
다음과 같은 패키지 구조를 가지며 주요 클래스들을 위주로 살펴보겠습니다. 

```
./
├── Dockerfile
├── action-in-blog\ (1).iml
├── mvnw
├── mvnw.cmd
├── pom.xml
└── src
    ├── main
    │   ├── java
    │   │   └── blog
    │   │       └── in
    │   │           └── action
    │   │               ├── ActionInBlogApplication.java
    │   │               ├── controller
    │   │               │   └── MemberController.java
    │   │               ├── entity
    │   │               │   └── Member.java
    │   │               ├── repository
    │   │               │   └── MemberRepository.java
    │   │               ├── security
    │   │               │   ├── ResourceServer.java
    │   │               │   └── SecurityConfig.java
    │   │               └── service
    │   │                   └── MemberService.java
    │   └── resources
    │       └── application.yml
    └── test
        └── java
            └── blog
                └── in
                    └── action
                        └── ActionInBlogApplicationTests.java
```

### 4.1. application.yml

* H2 메모리 데이터베이스를 사용하였습니다.
* 8081 포트를 가집니다.

```yml
server:
  port: 8081
spring:
  h2:
    console:
      enabled: true
      path: /h2-console
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password: 123
```

### 4.2. ResourceServer 클래스

* `@EnableResourceServer` 애너테이션을 사용해 리소스 서버 설정을 위한 빈으로 등록합니다. 
* `ResourceServerConfigurerAdapter` 클래스를 상속받아 리소스 서버 구현에 필요한 기능을 확장합니다.
* 기타 설명은 가독성을 위해 코드에 주석으로 표시하였습니다.

```java
package blog.in.action.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableResourceServer;
import org.springframework.security.oauth2.config.annotation.web.configuration.ResourceServerConfigurerAdapter;
import org.springframework.security.oauth2.config.annotation.web.configurers.ResourceServerSecurityConfigurer;
import org.springframework.security.oauth2.provider.error.OAuth2AccessDeniedHandler;
import org.springframework.security.oauth2.provider.token.DefaultTokenServices;
import org.springframework.security.oauth2.provider.token.store.JwtAccessTokenConverter;
import org.springframework.security.oauth2.provider.token.store.JwtTokenStore;

@Configuration
@EnableResourceServer
public class ResourceServer extends ResourceServerConfigurerAdapter {

    @Override
    public void configure(ResourceServerSecurityConfigurer resources) throws Exception {
        super.configure(resources);
        // 토큰 정보를 다루기 위한 토큰 서비스 객체 생성
        DefaultTokenServices defaultTokenServices = new DefaultTokenServices();
        // JWT 토큰 변경을 위한 컨버터 생성
        JwtAccessTokenConverter converter = new JwtAccessTokenConverter();
        // JWT 토큰 인코딩과 디코딩에 사용되므로 인증 서버와 동일한 암호키를 사용합니다. - TEMP_SIGN_KEY
        converter.setSigningKey("TEMP_SIGN_KEY");
        converter.afterPropertiesSet();
        // JWT 토큰 컨버터와 JWT 토큰 스토어 등록
        defaultTokenServices.setTokenStore(new JwtTokenStore(converter));
        defaultTokenServices.setSupportRefreshToken(true);
        // 토큰 서비스 등록
        resources.tokenServices(defaultTokenServices);
    }

    @Override
    public void configure(HttpSecurity http) throws Exception {
        http.cors().and()
                // 권한 확인이 필요한 요청 정보 등록
                .authorizeRequests()
                // /h2-console/** 경로는 모든 요청에 대해 허용
                .antMatchers("/h2-console/**").permitAll()
                // /member/user-info 경로는 ADMIN만 접근 가능
                .antMatchers("/member/user-info").hasAnyAuthority("ADMIN")
                // 나머지 요청은 인증만 필요
                .anyRequest().authenticated()
                .and()
                .exceptionHandling()
                .accessDeniedHandler(new OAuth2AccessDeniedHandler());
        http.csrf().disable();
        http.headers().frameOptions().disable();
    }
}
```

### 4.3. SecurityConfig 클래스

* 암호화에 사용하는 `PasswordEncoder` 빈을 등록합니다.

```java
package blog.in.action.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@RequiredArgsConstructor
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 4.4. MemberController 클래스 

* 사용자 정보 획득을 위한 `/member/user-info` API를 노출하고 있습니다.

```java
package blog.in.action.controller;

import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import blog.in.action.entity.Member;
import blog.in.action.service.MemberService;

@AllArgsConstructor
@RestController
@RequestMapping(value = "/member")
public class MemberController {

    private final MemberService memberService;

    @GetMapping("/user-info")
    public Member requestUserInfo(@RequestParam("id") String id) {
        return memberService.findById(id);
    }
}
```

### 4.5. MemberService 클래스

* 사용자 ID를 통해 사용자 정보를 조회합니다.

```java
package blog.in.action.service;

import blog.in.action.entity.Member;
import blog.in.action.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@RequiredArgsConstructor
@Service
public class MemberService {

    private final MemberRepository memberRepository;

    public Member findById(String id) {
        Optional<Member> option = memberRepository.findById(id);
        if (!option.isPresent()) {
            return null;
        }
        return option.get();
    }
}
```

### 4.6. ActionInBlogApplication 클래스

* `CommandLineRunner` 클래스를 확장하여 서비스 테스트에 필요한 데이터를 미리 추가합니다.

```java
package blog.in.action;

import blog.in.action.entity.Member;
import blog.in.action.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@RequiredArgsConstructor
@SpringBootApplication
public class ActionInBlogApplication implements CommandLineRunner {

    private final MemberRepository memberRepository;

    public static void main(String[] args) {
        SpringApplication.run(ActionInBlogApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        memberRepository.save(Member.builder()
                .id("Junhyunny")
                .name("Junhyunny")
                .email("junhyunny@naver.com")
                .address("Seoul")
                .build()
        );
    }
}
```

## 5. 테스트하기

### 5.1. 서비스 실행

도커 컴포즈(docker compose)를 사용하여 인증 서버와 리소스 서버를 동시에 실행시킵니다. 

* `docker-compose up` 명령어를 사용합니다.

```
$ pwd
/Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-01-04-spring-security-example

$ docker-compose up  
Creating network "2021-01-04-spring-security-example_default" with the default driver
Creating 2021-01-04-spring-security-example_resource-server_1      ... done
Creating 2021-01-04-spring-security-example_authorization-server_1 ... done
Attaching to 2021-01-04-spring-security-example_authorization-server_1, 2021-01-04-spring-security-example_resource-server_1
authorization-server_1  | 
authorization-server_1  |   .   ____          _            __ _ _
authorization-server_1  |  /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
authorization-server_1  | ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
authorization-server_1  |  \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
authorization-server_1  |   '  |____| .__|_| |_|_| |_\__, | / / / /
authorization-server_1  |  =========|_|==============|___/=/_/_/_/
authorization-server_1  |  :: Spring Boot ::                (v2.4.1)
authorization-server_1  | 
resource-server_1       | 
resource-server_1       |   .   ____          _            __ _ _
resource-server_1       |  /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
resource-server_1       | ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
resource-server_1       |  \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
resource-server_1       |   '  |____| .__|_| |_|_| |_\__, | / / / /
resource-server_1       |  =========|_|==============|___/=/_/_/_/
resource-server_1       |  :: Spring Boot ::                (v2.4.1)
resource-server_1       | 
authorization-server_1  | 2022-08-19 18:49:17.871  INFO 1 --- [           main] blog.in.action.ActionInBlogApplication   : Starting ActionInBlogApplication v0.0.1-SNAPSHOT using Java 11.0.16 on 0df3df36e161 with PID 1 (/app/app.jar started by root in /app)
authorization-server_1  | 2022-08-19 18:49:17.874  INFO 1 --- [           main] blog.in.action.ActionInBlogApplication   : No active profile set, falling back to default profiles: default
resource-server_1       | 2022-08-19 18:49:17.884  INFO 1 --- [           main] blog.in.action.ActionInBlogApplication   : Starting ActionInBlogApplication v0.0.1-SNAPSHOT using Java 11.0.16 on bd0d9c3a927a with PID 1 (/app/app.jar started by root in /app)
resource-server_1       | 2022-08-19 18:49:17.887  INFO 1 --- [           main] blog.in.action.ActionInBlogApplication   : No active profile set, falling back to default profiles: default
resource-server_1       | 2022-08-19 18:49:18.775  INFO 1 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Bootstrapping Spring Data JPA repositories in DEFAULT mode.
authorization-server_1  | 2022-08-19 18:49:18.838  INFO 1 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Bootstrapping Spring Data JPA repositories in DEFAULT mode.
resource-server_1       | 2022-08-19 18:49:18.869  INFO 1 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Finished Spring Data repository scanning in 83 ms. Found 1 JPA repository interfaces.
authorization-server_1  | 2022-08-19 18:49:18.903  INFO 1 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Finished Spring Data repository scanning in 55 ms. Found 1 JPA repository interfaces.
resource-server_1       | 2022-08-19 18:49:19.655  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8081 (http)
resource-server_1       | 2022-08-19 18:49:19.671  INFO 1 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
resource-server_1       | 2022-08-19 18:49:19.671  INFO 1 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.41]
resource-server_1       | 2022-08-19 18:49:19.733  INFO 1 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
resource-server_1       | 2022-08-19 18:49:19.733  INFO 1 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 1771 ms
authorization-server_1  | 2022-08-19 18:49:19.752  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
authorization-server_1  | 2022-08-19 18:49:19.768  INFO 1 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
authorization-server_1  | 2022-08-19 18:49:19.769  INFO 1 --- [           main] org.apache.catalina.core.StandardEngine  : Starting Servlet engine: [Apache Tomcat/9.0.41]
resource-server_1       | 2022-08-19 18:49:19.812  INFO 1 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
authorization-server_1  | 2022-08-19 18:49:19.833  INFO 1 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
authorization-server_1  | 2022-08-19 18:49:19.834  INFO 1 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 1831 ms
authorization-server_1  | 2022-08-19 18:49:19.900  INFO 1 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
resource-server_1       | 2022-08-19 18:49:20.041  INFO 1 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
resource-server_1       | 2022-08-19 18:49:20.050  INFO 1 --- [           main] o.s.b.a.h2.H2ConsoleAutoConfiguration    : H2 console available at '/h2-console'. Database available at 'jdbc:h2:mem:testdb'
authorization-server_1  | 2022-08-19 18:49:20.137  INFO 1 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
authorization-server_1  | 2022-08-19 18:49:20.145  INFO 1 --- [           main] o.s.b.a.h2.H2ConsoleAutoConfiguration    : H2 console available at '/h2-console'. Database available at 'jdbc:h2:mem:testdb'
resource-server_1       | 2022-08-19 18:49:20.265  INFO 1 --- [           main] o.hibernate.jpa.internal.util.LogHelper  : HHH000204: Processing PersistenceUnitInfo [name: default]
resource-server_1       | 2022-08-19 18:49:20.320  INFO 1 --- [           main] org.hibernate.Version                    : HHH000412: Hibernate ORM core version 5.4.25.Final
authorization-server_1  | 2022-08-19 18:49:20.351  INFO 1 --- [           main] o.hibernate.jpa.internal.util.LogHelper  : HHH000204: Processing PersistenceUnitInfo [name: default]
authorization-server_1  | 2022-08-19 18:49:20.404  INFO 1 --- [           main] org.hibernate.Version                    : HHH000412: Hibernate ORM core version 5.4.25.Final
resource-server_1       | 2022-08-19 18:49:20.508  INFO 1 --- [           main] o.hibernate.annotations.common.Version   : HCANN000001: Hibernate Commons Annotations {5.1.2.Final}
authorization-server_1  | 2022-08-19 18:49:20.613  INFO 1 --- [           main] o.hibernate.annotations.common.Version   : HCANN000001: Hibernate Commons Annotations {5.1.2.Final}
resource-server_1       | 2022-08-19 18:49:20.671  INFO 1 --- [           main] org.hibernate.dialect.Dialect            : HHH000400: Using dialect: org.hibernate.dialect.H2Dialect
authorization-server_1  | 2022-08-19 18:49:20.766  INFO 1 --- [           main] org.hibernate.dialect.Dialect            : HHH000400: Using dialect: org.hibernate.dialect.H2Dialect
resource-server_1       | 2022-08-19 18:49:21.226  INFO 1 --- [           main] o.h.e.t.j.p.i.JtaPlatformInitiator       : HHH000490: Using JtaPlatform implementation: [org.hibernate.engine.transaction.jta.platform.internal.NoJtaPlatform]
resource-server_1       | 2022-08-19 18:49:21.234  INFO 1 --- [           main] j.LocalContainerEntityManagerFactoryBean : Initialized JPA EntityManagerFactory for persistence unit 'default'
authorization-server_1  | 2022-08-19 18:49:21.316  INFO 1 --- [           main] o.h.e.t.j.p.i.JtaPlatformInitiator       : HHH000490: Using JtaPlatform implementation: [org.hibernate.engine.transaction.jta.platform.internal.NoJtaPlatform]
authorization-server_1  | 2022-08-19 18:49:21.325  INFO 1 --- [           main] j.LocalContainerEntityManagerFactoryBean : Initialized JPA EntityManagerFactory for persistence unit 'default'
resource-server_1       | 2022-08-19 18:49:21.615  WARN 1 --- [           main] JpaBaseConfiguration$JpaWebConfiguration : spring.jpa.open-in-view is enabled by default. Therefore, database queries may be performed during view rendering. Explicitly configure spring.jpa.open-in-view to disable this warning
authorization-server_1  | 2022-08-19 18:49:21.734  WARN 1 --- [           main] JpaBaseConfiguration$JpaWebConfiguration : spring.jpa.open-in-view is enabled by default. Therefore, database queries may be performed during view rendering. Explicitly configure spring.jpa.open-in-view to disable this warning

... 

resource-server_1       | 2022-08-19 18:49:22.714  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8081 (http) with context path ''
resource-server_1       | 2022-08-19 18:49:22.725  INFO 1 --- [           main] blog.in.action.ActionInBlogApplication   : Started ActionInBlogApplication in 5.797 seconds (JVM running for 6.389)
authorization-server_1  | 2022-08-19 18:49:22.748  INFO 1 --- [           main] o.s.s.concurrent.ThreadPoolTaskExecutor  : Initializing ExecutorService 'applicationTaskExecutor'
authorization-server_1  | 2022-08-19 18:49:22.966  INFO 1 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
authorization-server_1  | 2022-08-19 18:49:22.976  INFO 1 --- [           main] blog.in.action.ActionInBlogApplication   : Started ActionInBlogApplication in 5.992 seconds (JVM running for 6.644)
```

### 5.2. 토큰 정보 받기

* 인증 서버로 토큰 정보를 요청합니다.
    * POST 요청입니다.
    * `/oauth/token`는 Spring Security 프레임워크가 자동으로 생성한 API 경로입니다.
* 인증 서버에 미리 등록된 클라이언트 `ID`와 `SECRETE` 정보를 함께 전달합니다.
    * 클라이언트 `ID`와 `SECRETE` 정보는 클라이언트 어플리케이션이 인증 서버로부터 미리 발급 받은 정보입니다.
* 사용자임을 인증할 수 있도록 사용자 ID, 비밀번호, 인증 방식을 전달합니다.

```
$ curl -X POST http://localhost:8080/oauth/token\
   -H "Content-Type: application/x-www-form-urlencoded"\
   -u 'CLIENT_ID:CLIENT_SECRET'\
   -d "username=Junhyunny&password=123&grant_type=password" | jq .
```

##### 결과

* access_token - JWT 토큰
* token_type - 토큰 타입
* refresh_token - JWT 액세스 토큰이 만료된 경우 재발급을 받을 때 사용하는 리프레시 토큰
* expires_in - 토큰 만료 시간

```
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   818    0   767  100    51   1356     90 --:--:-- --:--:-- --:--:--  1476
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NjA5NDk4MTIsInVzZXJfbmFtZSI6Ikp1bmh5dW5ueSIsImF1dGhvcml0aWVzIjpbIkFETUlOIl0sImp0aSI6IjlhMGZhOWVkLTk0MTgtNDkzYy1hNzgxLTFkMDNiNjljOGQxNSIsImNsaWVudF9pZCI6IkNMSUVOVF9JRCIsInNjb3BlIjpbInJlYWQiXX0.MTdH5OFPO4XhsVYd5lVFhL8ufOaPeZMWg9bSnaJ2lyE",
  "token_type": "bearer",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJKdW5oeXVubnkiLCJzY29wZSI6WyJyZWFkIl0sImF0aSI6IjlhMGZhOWVkLTk0MTgtNDkzYy1hNzgxLTFkMDNiNjljOGQxNSIsImV4cCI6MTY2MTAyMTgxMiwiYXV0aG9yaXRpZXMiOlsiQURNSU4iXSwianRpIjoiZDM1M2Y1NGQtZTBmNS00NjQ4LTg3NjMtY2UyMWI4N2VkMzNjIiwiY2xpZW50X2lkIjoiQ0xJRU5UX0lEIn0.xdwmp4C7hy3nEjIeD0IPIr1EK-076VlpHV5NnPk5LTI",
  "expires_in": 14399,
  "scope": "read",
  "jti": "9a0fa9ed-9418-493c-a781-1d03b69c8d15"
}
```

### 5.3. 사용자 리소스 정보 받기

* 리소스 서버로 사용자 정보를 요청합니다.
    * 전달받은 토큰을 헤더 정보에 담아 전달합니다. 
    * 헤더 키는 `Authorization`이며 토큰 앞에 `Bearer` 토큰 타입을 추가합니다.

```
$ curl http://localhost:8081/member/user-info\?id\=Junhyunny\
   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2NjA5NDk4MTIsInVzZXJfbmFtZSI6Ikp1bmh5dW5ueSIsImF1dGhvcml0aWVzIjpbIkFETUlOIl0sImp0aSI6IjlhMGZhOWVkLTk0MTgtNDkzYy1hNzgxLTFkMDNiNjljOGQxNSIsImNsaWVudF9pZCI6IkNMSUVOVF9JRCIsInNjb3BlIjpbInJlYWQiXX0.MTdH5OFPO4XhsVYd5lVFhL8ufOaPeZMWg9bSnaJ2lyE" | jq .
```

##### 결과

* 사용자 정보를 정상적으로 전달받습니다.

```
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    85    0    85    0     0    329      0 --:--:-- --:--:-- --:--:--   346
{
  "id": "Junhyunny",
  "name": "Junhyunny",
  "email": "junhyunny@naver.com",
  "address": "Seoul"
}
```

## CLOSING

리소스 서버에서 `/member/user-info` 경로의 접근 권한을 `USER` 등으로 변경하면 사용자 정보 요청에 실패함을 확인할 수 있습니다. 
이번 포스트를 참고하시는 분들은 아래 주의사항을 확인바랍니다. 

##### Spring Security 진영 정책 변경

이번 포스트에서 사용한 `2.3.3.RELEASE` 버전까지는 인증 서버를 구현할 수 있지만, 최근 버전에선 인증 서버 구현을 위한 기능들이 모두 제거되었습니다. 
현재 최신 `Spring Security`에서는 `Authorization Server` 구현을 지원하지 않습니다.(Deprecated)

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

##### 보안 취약점 버전 확인

* `2.3.3.RELEASE` 버전은 보안 취약점이 발견된 버전입니다.

<p align="center">
    <img src="/images/spring-security-example-3.JPG" width="80%" class="image__border">
</p>
<center>https://mvnrepository.com/artifact/org.springframework.security.oauth/spring-security-oauth2</center>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-01-04-spring-security-example>

#### RECOMMEND NEXT POSTS

* [TokenEnhancer Interface][token-enhancer-link]
* [HandlerMethodArgumentResolver Interface][handler-method-argument-resolver-link]
* [JWT AuthenticationFilter 만들기][make-authentication-filter-link]
* [JWT AuthenticationProvider 만들기][make-authentication-provider-link]
* [JWT(Json Web Token) 발행과 재발행][issue-and-reissue-json-web-token-link]

#### REFERENCE

* [JwtAccessTokenConverter](https://docs.spring.io/spring-security/oauth/apidocs/org/springframework/security/oauth2/provider/token/store/JwtAccessTokenConverter.html)
* [AuthorizationServerConfigurerAdapter](https://docs.spring.io/spring-security/oauth/apidocs/org/springframework/security/oauth2/config/annotation/web/configuration/AuthorizationServerConfigurerAdapter.html)
* [ResourceServerConfigurerAdapter](https://docs.spring.io/spring-security/oauth/apidocs/org/springframework/security/oauth2/config/annotation/web/configuration/ResourceServerConfigurerAdapter.html)

[json-web-token-link]: https://junhyunny.github.io/information/json-web-token/
[spring-security-link]: https://junhyunny.github.io/spring-security/spring-security/

[token-enhancer-link]: https://junhyunny.github.io/spring-boot/spring-security/token-enhancer/
[handler-method-argument-resolver-link]: https://junhyunny.github.io/spring-boot/handler-method-argument-resolver/
[make-authentication-filter-link]: https://junhyunny.github.io/spring-boot/spring-security/make-authentication-filter/
[make-authentication-provider-link]: https://junhyunny.github.io/spring-boot/spring-security/make-authentication-provider/
[issue-and-reissue-json-web-token-link]: https://junhyunny.github.io/spring-boot/spring-security/issue-and-reissue-json-web-token/
