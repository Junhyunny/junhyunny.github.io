---
title: "Spring Security 기반 JWT 인증 방식 예제"
search: false
category: 
  - side project
  - security
  - spring security
last_modified_at: 2021-01-06T00:00:00
---

# Spring Security 기반 JWT 인증 방식 예제<br>

지난 포스트에서는 [Jason Web Token][json-blogLink]과 [Spring Security][security-blogLink] 대한 이야기를 해보았습니다.
Spring Security Framework을 이용하여 Jason Web Token 인증 방식을 구현해보았습니다. 
간단한 구현을 위해 h2 메모리 DB를 사용하였습니다.

## 패키지 구조
<p align="left"><img src="/images/spring-security-example-1.JPG"></p>

## application.yml
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

## pom.xml
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

## controller 구현
유저 정보를 등록할 수 있는 **/api/member/sign-up**와 조회하는 **/api/member/user-info** api path를 만들었습니다. 
아래 ResourceServer에서 확인하실 수 있겠지만 **/api/member/sign-up** path는 인증 정보 없이 요청이 가능하지만 **/api/member/user-info** path는 인증 정보 없이 요청이 불가능합니다.

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

## Config 구현
인증 토큰을 만들 때 필요한 JwtAccessTokenConverter @Bean과 유저의 비밀번호를 암호화할 때 사용되는 PasswordEncoder @Bean을 생성해줍니다. 
API 문서를 확인해보니 JwtAccessTokenConverter @Bean에 등록되는 signingKey는 암호화에서 필요한 키 용도로 사용되는 듯 합니다.

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

## AuthorizationServer 구현
인증에 필요한 설정이 가능한 @Configuration입니다. 
@EnableAuthorizationServer 애너테이션을 붙임으로서 클라이언트 토큰을 저장하는 인메모리 저장소를 가진 권한 서버가 생성됩니다. 
AuthorizationServerConfigurerAdapter 클래스를 확장한 후 필요한 설정들을 추가하기 위한 메소드들을 Override합니다. 
자세한 내용은 [API 문서][authentication-docLink]에서 확인하시길 바랍니다. 

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

## ResourceServer 구현
자원에 대한 접근을 제어, 관리하는 @Configuration입니다. 
@EnableResourceServer 애너테이션은 OAuth2 토큰을 검증하는 보안 필터를 활성화해서 접근 토큰을 검증할 수 있게 해줍니다. 
특별 authorization만 접근 가능하도록 제어하는 것이 가능해집니다. 
ResourceServerConfigurerAdapter 클래스를 확장하여 추가적인 기능들은 Override합니다. 
자세한 내용은 [API 문서][resource-docLink]에서 확인하시길 바랍니다. 

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

## SecurityConfig 구현
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

## UserDetailsService 인터페이스 구현
인증(Authentication)에서 AuthenticationProvider들에 의해 사용되는 UserDetailsService 인터페이스를 구현한 클래스입니다. 
Override 된 loadUserByUsername 메소드는 사용자 정보를 조회하여 UserDetails 구현체를 반환합니다.

- loadUserByUsername 메소드의 debug 포인트 설정시 call stack
  - DaoAuthenticationProvider에 의해 사용됨을 확인할 수 있습니다.
<p align="center"><img src="/images/spring-security-example-2.JPG"></p>

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
  
## 테스트 결과
- 유저 정보 등록 (ADMIN)
<p align="center"><img src="/images/spring-security-example-3.JPG"></p>

- 인증 정보 획득
<p align="center"><img src="/images/spring-security-example-4.JPG"></p>

- 인증 정보 헤더 등록
  - 토큰 정보, bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDk5NjE2NDEsInVzZXJfbmFtZSI6Imp1bmh5dW5ueSIsImF1dGhvcml0aWVzIjpbIkFETUlOIl0sImp0aSI6IjU0ODljYzQ3LTc5YjQtNDE1Mi04MjUyLTZjNzY3ZTNiODJkYiIsImNsaWVudF9pZCI6IkNMSUVOVF9JRCIsInNjb3BlIjpbInJlYWQiLCJwcm9maWxlIl19.-J-jWH6QrzeVuKixL4m2fimWClm4BiriCK4Xz-H_sJ4
<p align="center"><img src="/images/spring-security-example-5.JPG"></p>

- 유저 정보 요청 (정상 확인)
<p align="center"><img src="/images/spring-security-example-6.JPG"></p>

- <https://jwt.io/> 사이트에서 생성한 Token Decoding 
<p align="center"><img src="/images/spring-security-example-7.JPG"></p>

## OPINION
예전에 작성해둔 블로그 글이 아주 유용하게 사용되었습니다. 
당시에는 사용자 인증 관련된 글로 단순 토큰 발행 케이스에 대해서 정리하였는데 이번엔 JWT 사용으로 기능으로 조금 확장해보았습니다. 
해당 코드를 받아보시려면 [github link][github-link]로 이동하세요. 
테스트 시 ADMIN을 USER로 등록하여 인증 처리한 경우에는 유저 정보 요청에 실패함을 확인하실 수 있습니다.

#### 참조글
- <https://junhyunny.blogspot.com/2020/10/srping-boot-user-authentication.html>

[json-blogLink]: https://junhyunny.github.io/side%20project/information/security/json-web-token/
[security-blogLink]: https://junhyunny.github.io/side%20project/information/security/spring%20security/spring-security/
[authentication-docLink]: https://docs.spring.io/spring-security/oauth/apidocs/org/springframework/security/oauth2/config/annotation/web/configuration/AuthorizationServerConfigurerAdapter.html
[resource-docLink]: https://docs.spring.io/spring-security/oauth/apidocs/org/springframework/security/oauth2/config/annotation/web/configuration/ResourceServerConfigurerAdapter.html
[github-link]: https://github.com/Junhyunny/action-in-blog/tree/441221739c107eaae741276dc8707aa5f83ccab1