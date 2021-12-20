---
title: "Login Page / Authorization based Oauth2 JWT / Resource Service 분할 - Authorization"
search: false
category:
  - spring-boot
  - spring-security
  - react
  - jest
  - test-driven-development
last_modified_at: 2021-12-19T23:55:00
---

<br>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [JWT, Json Web Token][json-link]
- [Spring Security][security-link]
- [Spring Security 기반 JWT 인증 방식 예제][spring-security-example-link]

👉 이어서 읽기를 추천합니다.
- [Login Page / Authorization based Oauth2 JWT / Resource Service 분할 - Front End][front-end-service-link]
- [Login Page / Authorization based Oauth2 JWT / Resource Service 분할 - Resource][resource-service-link](구현 예정)

## 0. 들어가면서

`TDD(Test Driven Development)`를 연습하면서 로그인 기능을 `Spring Security`와 함께 구현해보는 것도 좋을 것 같다는 생각이 들었습니다. 
이전에 작성한 [Spring Security 기반 JWT 인증 방식 예제][spring-security-example-link] 글을 참조했는데, 
마음에 들지 않는 부분들이 있어서 이번 포스트를 계기로 다시 정리해보려고 합니다. 

다시 정리해보려고 하는 내용들은 다음과 같습니다. 
- `Insomnia 툴(tool)`을 이용한 테스트를 실제 로그인 화면으로 변경하기
- `Authorization Server`와 `Resource Server` 분리하기
- `spring-security-oauth2` 의존성 - 보안 취약점이 발견된 2.3.3.RELEASE 버전 사용 (2.3.5.RELEASE 버전으로 변경)
- 선 테스트 코드 작성, 후 코드 구현 (RED-GREEN-REFACTORING 사이클 연습)
    - 프레임워크 기능에 의존적인 부분은 선 테스트 코드 작성에 실패하였습니다. 

##### Spring Security 기반 JWT 인증 방식 예제 서비스 구조

<p align="center"><img src="/images/split-login-authorization-resource-service-1.JPG" width="70%"></p>

##### Oauth2 JWT 인증 서비스 / 리소스 서비스 분할 서비스 구조
- 이번 포스트에선 `Oauth2 JWT 인증 서비스`를 구현하였습니다.  

<p align="center"><img src="/images/split-login-authorization-resource-service-2.JPG" width="70%"></p>

##### 주의사항
- 현재 최신 `Spring Security`에서는 `Authorization Server` 구현을 지원하지 않습니다. (Deprecated)

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

## 1. 인증 서비스 구조, 설정 및 의존성

### 1.1. 패키지 구조

```
.
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
    │   │               ├── filter
    │   │               │   └── CustomCorsFilter.java
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
                        ├── ActionInBlogApplicationTests.java
                        └── controller
                            └── AuthenticationControllerTests.java
```

### 1.2. application.yml

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
    password:
```

### 1.3. pom.xml - dependencies

```xml
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
			<version>2.3.5.RELEASE</version>
		</dependency>

		<dependency>
			<groupId>org.springframework.security</groupId>
			<artifactId>spring-security-jwt</artifactId>
			<version>1.1.1.RELEASE</version>
		</dependency>

		<dependency>
			<groupId>org.projectlombok</groupId>
			<artifactId>lombok</artifactId>
			<scope>provided</scope>
		</dependency>

        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.13.1</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
```

## 2. Authorization 서비스 구축
Authorization 서비스 구축은 쉽습니다. 
두 개의 Configuration 빈을 만들어주면 됩니다. 

### 2.1. SecurityConfig 클래스
- `@EnableWebSecurity` 애너테이션을 추가합니다. 
- `WebSecurityConfigurerAdapter` 클래스를 상속받습니다. 
- `configure(AuthenticationManagerBuilder auth)` 메소드
    - AuthenticationManagerBuilder 객체에 사용자 인증시 필요한 AuthenticationProvider 혹은 UserDetailsService를 설정합니다.
    - 실제 데이터베이스에 데이터를 저장하지 않고 메모리 상에 사용자 정보를 등록해둡니다.

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
    public JwtAccessTokenConverter jwtAccessTokenConverter() {
        return new JwtAccessTokenConverter();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(memberService);
        auth.inMemoryAuthentication().withUser("Junhyunny").password(passwordEncoder().encode("123")).authorities("ADMIN");
    }
}
```

### 2.2. AuthorizationServer 클래스
- `@EnableAuthorizationServer` 애너테이션을 추가합니다. 
- `AuthorizationServerConfigurerAdapter` 클래스를 상속받습니다. 
- `configure(ClientDetailsServiceConfigurer clients)` 메소드
    - 메모리에만 올려 사용하는 임시 `client` 정보를 추가합니다. 
    - 해당 클라이언트는 `password`, `refresh_token`을 이용하여 `access_token`을 발급받을 수 있습니다.
    - 임시 `client` 정보이므로 매번 신규 `client` 추가를 위해서는 별도 데이터 소스 연결이 필요합니다.
    - [OAuth2.0 and Dynamic Client Registration (using the Spring Security OAuth legacy stack)][spring-security-dynamic-clients-link]
- `configure(AuthorizationServerEndpointsConfigurer endpoints)` 메소드
    - 사용자 인증을 위한 `AuthenticationManager`을 등록합니다. 
    - JWT 토큰 발급을 위한 `TokenEnhancerChain`을 등록합니다.
    - `TokenEnhancerChain`을 등록하지 않으면 일반 토큰이 발급됩니다.

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
        clients.inMemory()
                .withClient(clientId)//
                .secret(passwordEncoder.encode(clientSecret))//
                .authorizedGrantTypes("password", "refresh_token")//
                .scopes("read")//
                .accessTokenValiditySeconds(ACCESS_TOKEN_VALID_SECONDS)// access token 유효 시간 등록
                .refreshTokenValiditySeconds(REFRESH_TOKEN_VALID_SECONDS);// refresh token 유효 시간 등록
    }

    @Override
    public void configure(AuthorizationServerEndpointsConfigurer endpoints) throws Exception {
        TokenEnhancerChain tokenEnhancerChain = new TokenEnhancerChain();
        tokenEnhancerChain.setTokenEnhancers(Arrays.asList(jwtAccessTokenConverter)); // JWT Converter 등록
        endpoints.authenticationManager(authenticationManager)//
                .tokenEnhancer(tokenEnhancerChain);
    }
}
```

## 3. 사용자 인증 테스트 코드
- `givenImproperInfo_whenGetAccessToken_thenBadRequest` 테스트
    - 등록되지 않은 사용자로 토큰 요청시 `400 Bad Request` 응답을 받습니다.
- `givenProperInfo_whenGetAccessToken_thenAuthorized` 테스트
    - 정상적인 정보로 토큰 요청시 `access_token`, `refresh_token`, `token_type`을 전달받습니다. 

```java
package blog.in.action.controller;

import blog.in.action.ActionInBlogApplication;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.json.JacksonJsonParser;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.context.WebApplicationContext;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@RunWith(SpringRunner.class)
@WebAppConfiguration
@SpringBootTest(classes = ActionInBlogApplication.class)
public class AuthenticationControllerTests {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @Before
    public void setup() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Test
    public void givenImproperInfo_whenGetAccessToken_thenBadRequest() throws Exception {

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "password");
        params.add("username", "testUser");
        params.add("password", "12345");

        mockMvc.perform(post("/oauth/token")
                        .params(params)
                        .with(httpBasic("CLIENT_ID", "CLIENT_SECRET"))
                        .accept("application/json;charset=UTF-8"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void givenProperInfo_whenGetAccessToken_thenAuthorized() throws Exception {

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "password");
        params.add("username", "Junhyunny");
        params.add("password", "123");

        ResultActions result = mockMvc.perform(post("/oauth/token")
                        .params(params)
                        .with(httpBasic("CLIENT_ID", "CLIENT_SECRET"))
                        .accept("application/json;charset=UTF-8"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json;charset=UTF-8"));

        String resultString = result.andReturn().getResponse().getContentAsString();

        JacksonJsonParser jsonParser = new JacksonJsonParser();
        Map<String, Object> parsedMap = jsonParser.parseMap(resultString);
        assertThat(parsedMap.get("access_token")).isNotNull();
        assertThat(parsedMap.get("refresh_token")).isNotNull();
        assertThat(parsedMap.get("token_type")).isEqualTo("bearer");
    }
}
```

## 4. 화면 / 인증 / 리소스 서비스 연동 결과
- 현재 리소스 서버 구현이 되지 않았습니다. 구현 후 내용 추가할 예정입니다. 

<!-- ### 4.1. 프론트엔드 서비스 코드 변경 사항 -->

<!-- ### 4.2. 테스트 결과 화면 -->

<!-- ## CLOSING -->

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-12-19-split-login-authorization-resource-service>

#### REFERENCE
- <https://www.baeldung.com/oauth-api-testing-with-spring-mvc>
- <https://spring.io/blog/2014/05/23/preview-spring-security-test-web-security>
- <https://meetup.toast.com/posts/124>

[json-link]: https://junhyunny.github.io/information/json-web-token/
[security-link]: https://junhyunny.github.io/spring-security/spring-security/
[spring-security-example-link]: https://junhyunny.github.io/spring-boot/spring-security/spring-security-example/
[front-end-service-link]: https://junhyunny.github.io/spring-boot/spring-security/react/jest/test-driven-development/split-login-authorization-resource-service-front-end/
[resource-service-link]: https://junhyunny.github.io/spring-boot/spring-security/react/jest/test-driven-development/split-login-authorization-resource-service-resource/
[spring-security-dynamic-clients-link]: https://www.baeldung.com/spring-security-oauth-dynamic-client-registration