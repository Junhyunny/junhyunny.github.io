---
title: "Spring Security 기반 JWT 인증 방식 예제"
search: false
category:
  - spring-boot
  - spring-security
last_modified_at: 2021-02-17T23:55:00
---

<br>

⚠️ 다음 사항을 주의하세요.
- 해당 포스트는 2022년 2월 18일에 재작성되었습니다. 

👉 해당 포스트를 읽는데 도움을 줍니다.
- [JWT, Json Web Token][json-link]
- [Spring Security][security-link]

👉 Spring Security 프레임워크의 인증 절차를 더 자세히 들여다봤습니다.
- [AuthenticationFilter 만들기][make-authentication-filter-link]
- [JWT AuthenticationProvider 만들기][make-authentication-provider-link]
- [JWT(Json Web Token) 발행과 재발행][issue-and-reissue-json-web-token-link]

## 0. 들어가면서

이 글을 처음 작성하는 시점엔 `Spring Security` 프레임워크에 대한 깊은 이해가 없던지라 동작하는 코드를 나름 정리해서 올렸었습니다. 
최근에 이전 글들을 다시 정리하다보니 이 글이 마음에 들지 않아 삭제하거나 내용을 전면 변경하고 싶었습니다. 

감사하게도 많은 분들께서 글을 찾아주시고, 어떤 분들은 링크를 참조 걸어두시기도 하셔서 내용을 크게 변경하거나 삭제하지 않았습니다. 
**이 글은 JWT(Json Web Token) 인증이나 `Spring Security` 프레임워크의 인증 과정에 대한 인사이트를 얻기엔 부족합니다.** 
애너테이션만으로 인증 프로세를 위한 빈(bean)들이 너무 쉽게 생성되기 때문에 내부는 블랙 박스로 느껴질 수 있습니다. 

방문하시는 분들의 이해를 조금 더 돕고 싶은 마음에 다시 정리한 포스트들을 위에 참조로 걸어두었습니다. 
제 블로그를 찾아주시는 분들에게 좋은 컨텐츠와 정보가 전달되길 바랍니다. 
감사합니다.

## 1. 용어 정리

### 1.1. 보안 관련 용어

- 접근 주체(Principal)
    - 보안 시스템이 작동되고 있는 application에 접근하려는 유저
- 인증(Authentication)
    - Application 작업을 수행할 수 있는 주체(사용자)임을 증명하는 행위
    - Who are you?
- 권한(Authorization)
    - 인증된 주체가 application의 동작을 수행할 수 있도록 허락되었는지 확인, 결정하는 행위
    - What are you allowed to do?

### 1.2. OAuth(OpenID Authentication) 관련 용어

- Application (혹은 Client)
    - 사용자가 사용하는 어플리케이션입니다. 
    - 이번 포스트에서 `Insomnia` 툴(tool)입니다.
- Authorization Server 
    - 사용자 정보를 인증하는 서버입니다. 
    - 인증된 사용자에게 토큰을 발급해줍니다. 
    - `clientId`, `clientSecret`을 통해 어플리케이션 인증을 수행합니다.
    - `userName`, `password`, `grantType`을 통해 사용자 인증을 수행합니다.
    - 이번 포스트에서 `@EnableAuthorizationServer` 애너테이션이 붙은 빈(bean)을 통해 필요한 값이 설정됩니다.
- Resource Server 
    - 사용자 정보를 지닌 서버입니다. 
    - 인증된 사용자에게만 발급된 토큰을 통해 접근 가능합니다.
    - 이번 포스트에서 `@EnableResourceServer` 애너테이션이 붙은 빈을 통해 필요한 값이 설정됩니다.

<p align="center"><img src="/images/spring-security-example-0-0.JPG" width="80%"></p>
<center>이미지 출처, https://docs.pivotal.io/p-identity/1-14/grant-types.html</center><br>

## 2. 주의사항

위에서 `OAuth` 관련 용어에 대한 설명에서 볼 수 있듯이 인증을 위한 서버와 실제 사용자에게 서비스를 제공하는 서버는 구분지어 관리합니다. 
`spring-security-oauth2` 의존성을 이용하면 인증 서버(authorization server)와 리소스 서버(resource server)를 분리하여 구현할 수 있지만, 이번 포스트에선 그렇지 않습니다. 

이 글을 읽을 때 다음과 같은 주의사항들이 있습니다.
- 해당 포스트에선 서비스 하나에 인증, 리소스와 관련된 기능이 모두 포함되어 있습니다. 
- 해당 포스트에서 사용한 `spring-security-oauth2` 의존성 2.3.3.RELEASE 버전은 보안 취약점이 발견된 버전입니다. (프로덕션 코드로 사용 불가)
- 현재 `Spring Security` 진영에서 인증 서버를 구현하는 기능 지원을 중지하였습니다. 최신 버전에선 인증 서버 기능을 사용할 수 없습니다.

##### 이번 포스트 서비스 구조

<p align="center"><img src="/images/spring-security-example-0-1.JPG" width="70%"></p>

##### 서비스 분할 관련 포스트 서비스 구조

- 인증 서버, 리소스 서버가 분할된 예제를 확인 가능합니다.
- 아래 예제도 구 버전 `spring-security-oauth2` 의존성을 사용하고 있습니다.
- [Login Page / Authorization based Oauth2 JWT / Resource Service 분할 - Front-End Service][front-end-service-link]
- [Login Page / Authorization based Oauth2 JWT / Resource Service 분할 - Authorization Service][authorization-service-link]
- [Login Page / Authorization based Oauth2 JWT / Resource Service 분할 - Resource Service][resource-service-link]

<p align="center"><img src="/images/spring-security-example-0-2.JPG" width="70%"></p>

##### Spring Security 진영 정책 변경

현재 최신 `Spring Security`에서는 `Authorization Server` 구현을 지원하지 않습니다. (Deprecated)

> 2019/11/14 - Spring Security OAuth 2.0 Roadmap Update<br>
> No Authorization Server Support<br>
> ...<br>
> Spring Security’s Authorization Server support was never a good fit. 
> An Authorization Server requires a library to build a product. 
> Spring Security, being a framework, is not in the business of building libraries or products. 
> For example, we don’t have a JWT library, but instead we make Nimbus easy to use. 
> And we don’t maintain our own SAML IdP, CAS or LDAP products.<br>
> In 2019, there are plenty of both commercial and open-source authorization servers available. 
> Thus, the Spring Security team has decided to no longer provide support for authorization servers.<br>
> UPDATE: We’d like to thank everyone for your feedback on the decision to not support Authorization Server. 
> Due to this feedback and some internal discussions, we are taking another look at this decision. 
> We’ll notify the community on any progress.

##### 보안 취약점 버전 확인

<p align="center">
    <img src="/images/spring-security-example-0-3.JPG" width="80%" class="image__border">
</p>
<center>이미지 출처, https://mvnrepository.com/artifact/org.springframework.security.oauth/spring-security-oauth2</center><br>

## 3. 예제 코드
`Spring Security` 프레임워크를 이용하여 JWT(Json Web Token) 인증 방식을 구현해보았습니다. 
간단한 구현을 위해 H2 데이터베이스를 사용하였습니다. 
보통 Security Service는 별도의 서비스로 구현되지만 예제 구현의 편의를 위해 하나의 서비스로 구현하였습니다. 

### 3.1. 패키지 구조

```
|-- action-in-blog.iml
|-- mvnw
|-- mvnw.cmd
|-- pom.xml
`-- src
    |-- main
    |   |-- java
    |   |   `-- blog
    |   |       `-- in
    |   |           `-- action
    |   |               |-- ActionInBlogApplication.java
    |   |               |-- config
    |   |               |   `-- Config.java
    |   |               |-- controller
    |   |               |   `-- MemberController.java
    |   |               |-- converter
    |   |               |   `-- StringListConverter.java
    |   |               |-- entity
    |   |               |   `-- Member.java
    |   |               |-- repository
    |   |               |   `-- MemberRepository.java
    |   |               |-- security
    |   |               |   |-- AuthorizationServer.java
    |   |               |   |-- ResourceServer.java
    |   |               |   `-- SecurityConfig.java
    |   |               `-- service
    |   |                   `-- MemberService.java
    |   `-- resources
    |       `-- application.yml
    `-- test
        `-- java
            `-- blog
                `-- in
                    `-- action
                        `-- ActionInBlogApplicationTests.java
```

### 3.2. application.yml
- H2 데이터베이스 설정

```yml
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

### 3.3. pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.4.1</version>
        <relativePath /> <!-- lookup parent from repository -->
    </parent>

    <groupId>blog.in.action</groupId>
    <artifactId>action-in-blog</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>action-in-blog</name>

    <properties>
        <java.version>11</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
            <exclusions>
                <exclusion>
                    <groupId>org.junit.vintage</groupId>
                    <artifactId>junit-vintage-engine</artifactId>
                </exclusion>
            </exclusions>
        </dependency>

        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>org.springframework.security.oauth</groupId>
            <artifactId>spring-security-oauth2</artifactId>
            <version>2.3.3.RELEASE</version>
        </dependency>

        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-jwt</artifactId>
            <version>1.0.10.RELEASE</version>
        </dependency>

        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <scope>provided</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
```

### 3.4. MemberController 클래스 구현
유저 정보를 등록할 수 있는 **/api/member/sign-up**와 조회하는 **/api/member/user-info** api path를 만들었습니다. 
아래 ResourceServer 클래스를 이용해 자원에 대한 요청 접근을 제어합니다. 
- **/api/member/sign-up** path는 인증 정보 없이 요청이 가능
- **/api/member/user-info** path는 인증 정보 없이 요청이 불가능

```java
package blog.in.action.controller;

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

@RestController
@RequestMapping(value = "/api/member")
public class MemberController {

    @Autowired
    private MemberService memberService;

    @PostMapping("/sign-up")
    @Transactional(propagation = Propagation.REQUIRED)
    public void requestSignUp(@RequestBody Member member) {
        memberService.registMember(member);
    }

    @GetMapping("/user-info")
    public Member requestUserInfo(@RequestParam("id") String id) {
        return memberService.findById(id);
    }
}
```

### 3.5. Config 클래스 구현
인증 토큰을 만들 때 필요한 JwtAccessTokenConverter @Bean과 유저의 비밀번호를 암호화할 때 사용되는 PasswordEncoder @Bean을 생성해줍니다. 
JwtAccessTokenConverter @Bean에 등록되는 `signingKey`는 암호화 복호화에 필요한 키 용도로 사용됩니다.

> [Class JwtAccessTokenConverter][spring-doc-link]<br>
> Sets the JWT signing key. It can be either a simple MAC key or an RSA key. RSA keys should be in OpenSSH format, as produced by ssh-keygen.

```java
package blog.in.action.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.provider.token.store.JwtAccessTokenConverter;

@Configuration
public class Config {

    private String jwtKey = "JWT_KEY";

    @Bean
    public JwtAccessTokenConverter jwtAccessTokenConverter() {
        JwtAccessTokenConverter converter = new JwtAccessTokenConverter();
        converter.setSigningKey(jwtKey);
        return converter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 3.6. AuthorizationServer 클래스 구현
인증에 필요한 설정이 가능한 `@Configuration` 입니다. 
자세한 내용은 [API 문서][authentication-link]에서 확인하시길 바랍니다. 

- @EnableAuthorizationServer 애너테이션 - 클라이언트 토큰을 저장할 수 있는 인메모리 저장소를 가진 권한 서버 생성
- AuthorizationServerConfigurerAdapter 클래스 - 상속을 통해 필요한 설정들을 추가할 수 있는 메소드 오버라이드(Override)

```java
package blog.in.action.security;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.config.annotation.configurers.ClientDetailsServiceConfigurer;
import org.springframework.security.oauth2.config.annotation.web.configuration.AuthorizationServerConfigurerAdapter;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableAuthorizationServer;
import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerEndpointsConfigurer;
import org.springframework.security.oauth2.provider.token.TokenEnhancerChain;
import org.springframework.security.oauth2.provider.token.store.JwtAccessTokenConverter;

import blog.in.action.service.MemberService;

@Configuration
@EnableAuthorizationServer
public class AuthorizationServer extends AuthorizationServerConfigurerAdapter {

    private String clientId = "CLIENT_ID";

    private String clientSecret = "CLIENT_SECRET";

    @Autowired
    private MemberService memberService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtAccessTokenConverter jwtAccessTokenConverter;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Override
    public void configure(ClientDetailsServiceConfigurer clients) throws Exception {
        clients.inMemory().withClient(clientId)//
                .authorizedGrantTypes("password", "refresh_token")//
                .scopes("read", "profile")//
                .secret(passwordEncoder.encode(clientSecret))//
                .accessTokenValiditySeconds(1 * 60 * 60 * 24)// token 유효 시간 등록
                .refreshTokenValiditySeconds(0);
    }

    @Override
    public void configure(AuthorizationServerEndpointsConfigurer endpoints) throws Exception {
        TokenEnhancerChain tokenEnhancerChain = new TokenEnhancerChain();
        tokenEnhancerChain.setTokenEnhancers(Arrays.asList(jwtAccessTokenConverter)); // JWT Converter 등록
        endpoints.userDetailsService(memberService)// UserDetailsService 등록
                .authenticationManager(authenticationManager)//
                .tokenEnhancer(tokenEnhancerChain);
    }

}
```

### 3.7. ResourceServer 클래스 구현
자원에 대한 접근을 제어, 관리하는 `@Configuration` 입니다. 
자세한 내용은 [API 문서][resource-link]에서 확인하시길 바랍니다. 

- @EnableResourceServer 애너테이션 - OAuth2 토큰을 검증하는 보안 필터를 활성화해서 접근 토큰을 검증
    - 특정 권한(authorization)만 접근 가능하도록 제어하는 것이 가능해집니다. 
- ResourceServerConfigurerAdapter 클래스 - 상속을 통해 추가적인 기능들은 오버라이드(Override) 

```java
package blog.in.action.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableResourceServer;
import org.springframework.security.oauth2.config.annotation.web.configuration.ResourceServerConfigurerAdapter;
import org.springframework.security.oauth2.provider.error.OAuth2AccessDeniedHandler;

@Configuration
@EnableResourceServer
public class ResourceServer extends ResourceServerConfigurerAdapter {

    @Override
    public void configure(HttpSecurity http) throws Exception {
        http.cors().and() //
                .authorizeRequests() //
                .antMatchers("/api/member/sign-up").permitAll() // sign-up API는 모든 요청 허용
                .antMatchers("/api/member/user-info").hasAnyAuthority("ADMIN")// user-info API는 ADMIN 권한을 가지는 유저만 요청 허용
                .anyRequest().authenticated().and() //
                .exceptionHandling().accessDeniedHandler(new OAuth2AccessDeniedHandler());
    }
}
```

### 3.8. SecurityConfig 클래스 구현

```java
package blog.in.action.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

import blog.in.action.service.MemberService;

@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private MemberService memberService;

    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(memberService);
    }
}
```

### 3.9. MemberService 클래스, UserDetailsService 인터페이스 구현
인증(Authentication)에서 AuthenticationProvider들에 의해 사용되는 UserDetailsService 인터페이스를 구현한 클래스입니다. 
Override 된 loadUserByUsername 메소드는 사용자 정보를 조회하여 UserDetails 구현체를 반환합니다.

- loadUserByUsername 메소드의 debug 포인트 설정 시 call stack
    - DaoAuthenticationProvider에 의해 사용됨을 확인할 수 있습니다.

<p align="left"><img src="/images/spring-security-example-1.JPG" width="50%"></p>

```java
package blog.in.action.service;

import java.util.Collection;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import blog.in.action.entity.Member;
import blog.in.action.repository.MemberRepository;

@Service
public class MemberService implements UserDetailsService {

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Member findById(String id) {
        Optional<Member> option = memberRepository.findById(id);
        if (!option.isPresent()) {
            return null;
        }
        return option.get();
    }

    public Member registMember(Member member) {
        String encodedPassword = passwordEncoder.encode(member.getPassword());
        member.setPassword(encodedPassword);
        return memberRepository.save(member);
    }

    // 계정이 갖고있는 권한 목록을 return
    private Collection<? extends GrantedAuthority> authorities(Member member) {
        return member.getAuthroities().stream().map(authority -> new SimpleGrantedAuthority(authority)).collect(Collectors.toList());
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<Member> option = memberRepository.findById(username);
        if (!option.isPresent()) {
            throw new UsernameNotFoundException(username);
        }
        // ID, PASSWORD, AUTHORITIES 반환
        Member member = option.get();
        return new User(member.getId(), member.getPassword(), authorities(member));
    }

}
```
  
## 4. 테스트 결과
API 테스트는 `Insomnia 툴(tool)`을 사용하였습니다. 
테스트를 위한 데이터를 복사하여 사용할 수 있도록 이미지가 아닌 Timeline으로 변경하였습니다.(2021-07-02)

### 4.1. 유저 정보 등록 요청

```
POST /api/member/sign-up HTTP/1.1
Host: localhost:8080
User-Agent: insomnia/2021.3.0
Content-Type: application/json
Accept: */*
Content-Length: 74

{
    "id": "junhyunny",
    "password": "123",
    "authroities": [
        "ADMIN"
    ]
}
```

### 4.2. 인증 토큰 획득 요청
- 요청은 `Form`을 사용합니다.
- 인증 방식은 `Basic` 입니다.
    - USERNAME - CLIENT_ID
    - PASSWORD - CLIENT_SECRET

```
POST /oauth/token HTTP/1.1
Host: localhost:8080
User-Agent: insomnia/2021.3.0
Content-Type: application/x-www-form-urlencoded
Authorization: Basic Q0xJRU5UX0lEOkNMSUVOVF9TRUNSRVQ=
Accept: */*
Content-Length: 51

username=junhyunny&password=123&grant_type=password
```

### 4.3. 인증 토큰 응답

```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MjUyMzk5NzgsInVzZXJfbmFtZSI6Imp1bmh5dW5ueSIsImF1dGhvcml0aWVzIjpbIkFETUlOIl0sImp0aSI6IjU1NTA0NjAwLWE3YzEtNGRiZS1iYjlkLTI3Mjg1MzJmNTA4YyIsImNsaWVudF9pZCI6IkNMSUVOVF9JRCIsInNjb3BlIjpbInJlYWQiLCJwcm9maWxlIl19.5fB4P5Z9N7UuIT_DNRK8auRBBz0nXZLk0u7HGJaHIDo",
    "token_type": "bearer",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJqdW5oeXVubnkiLCJhdXRob3JpdGllcyI6WyJBRE1JTiJdLCJqdGkiOiI0YTQyNTFiMS1iZjQ2LTQ5YWItYTdiNi1hYmNiZWJmOGJkMzQiLCJjbGllbnRfaWQiOiJDTElFTlRfSUQiLCJzY29wZSI6WyJyZWFkIiwicHJvZmlsZSJdLCJhdGkiOiI1NTUwNDYwMC1hN2MxLTRkYmUtYmI5ZC0yNzI4NTMyZjUwOGMifQ.PBvsBK6PAZhlgXeMiLHRF7STX8D3x2pIv5N6t7YwrHc",
    "expires_in": 86171,
    "scope": "read profile",
    "jti": "55504600-a7c1-4dbe-bb9d-2728532f508c"
}
```

### 4.4. 인증 토큰을 사용한 사용자 정보 요청
- 응답 받은 인증 토큰을 사용합니다.
- 헤더 정보에 `Authorization` 키로 접두어 `bearer`를 추가한 토큰을 함께 전달합니다.
- 요청 파라미터로 id 값을 전달합니다.

```
GET /api/member/user-info?id=junhyunny HTTP/1.1
Host: localhost:8080
User-Agent: insomnia/2021.3.0
Authorization: bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MjUyMzk5NzgsInVzZXJfbmFtZSI6Imp1bmh5dW5ueSIsImF1dGhvcml0aWVzIjpbIkFETUlOIl0sImp0aSI6IjU1NTA0NjAwLWE3YzEtNGRiZS1iYjlkLTI3Mjg1MzJmNTA4YyIsImNsaWVudF9pZCI6IkNMSUVOVF9JRCIsInNjb3BlIjpbInJlYWQiLCJwcm9maWxlIl19.5fB4P5Z9N7UuIT_DNRK8auRBBz0nXZLk0u7HGJaHIDo
Accept: */*
```

### 4.5. 사용자 정보 응답

```json
{
    "id": "junhyunny",
    "password": "$2a$10$KdarSqArLPXsGkLuX0jWhubndBpqkOX5PBRwsk0Fs/GtI4uKU6lx6",
    "authroities": [
        "ADMIN"
    ]
}
```

##### <https://jwt.io/>, Token Decoding 

<p align="center">
    <img src="/images/spring-security-example-2.JPG" class="image__border">
</p>

## CLOSING
예전에 작성했던 블로그 글이 아주 유용하게 사용되었습니다. 
당시에는 사용자 인증 관련된 글로 단순 토큰 발행 케이스에 대해서 정리하였는데 이번엔 JWT 기능을 추가하였습니다. 
**테스트 시 ADMIN을 USER로 등록하여 인증 처리한 경우에는 유저 정보 요청에 실패함을 확인하실 수 있습니다.**

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-01-04-spring-security-example>

#### REFERENCE
- <https://junhyunny.blogspot.com/2020/10/srping-boot-user-authentication.html>

[spring-doc-link]: https://docs.spring.io/spring-security/oauth/apidocs/org/springframework/security/oauth2/provider/token/store/JwtAccessTokenConverter.html
[authentication-link]: https://docs.spring.io/spring-security/oauth/apidocs/org/springframework/security/oauth2/config/annotation/web/configuration/AuthorizationServerConfigurerAdapter.html
[resource-link]: https://docs.spring.io/spring-security/oauth/apidocs/org/springframework/security/oauth2/config/annotation/web/configuration/ResourceServerConfigurerAdapter.html

[json-link]: https://junhyunny.github.io/information/json-web-token/
[security-link]: https://junhyunny.github.io/spring-security/spring-security/

[make-authentication-filter-link]: https://junhyunny.github.io/spring-boot/spring-security/make-authentication-filter/
[make-authentication-provider-link]: https://junhyunny.github.io/spring-boot/spring-security/make-authentication-provider/
[issue-and-reissue-json-web-token-link]: https://junhyunny.github.io/spring-boot/spring-security/issue-and-reissue-json-web-token/

[front-end-service-link]: https://junhyunny.github.io/spring-boot/spring-security/react/jest/test-driven-development/split-login-authorization-resource-service-front-end/
[authorization-service-link]: https://junhyunny.github.io/spring-boot/spring-security/react/jest/test-driven-development/split-login-authorization-resource-service-authorization/
[resource-service-link]: https://junhyunny.github.io/spring-boot/spring-security/react/jest/test-driven-development/split-login-authorization-resource-service-resource/