---
title: "Login Page / Authorization based Oauth2 JWT / Resource Service 분할 - Resource Service"
search: false
category:
  - spring-boot
  - spring-security
  - react
  - jest
  - test-driven-development
last_modified_at: 2021-12-19T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [JWT(Json Web Token)][json-link]
- [Spring Security][security-link]
- [Spring Security JWT OAuth Example][spring-security-example-link]

👉 이어서 읽기를 추천합니다.
- [Login Page / Authorization based Oauth2 JWT / Resource Service 분할 - Front-End Service][front-end-service-link]
- [Login Page / Authorization based Oauth2 JWT / Resource Service 분할 - Authorization Service][authorization-service-link]

## 0. 들어가면서

`TDD(Test Driven Development)`를 연습하면서 로그인 기능을 `Spring Security`와 함께 구현해보는 것도 좋을 것 같다는 생각이 들었습니다. 
이전에 작성했던 [Spring Security JWT OAuth Example][spring-security-example-link] 글을 참조했는데, 마음에 들지 않는 부분들이 있어서 다시 정리하였습니다.

다시 정리해보려고 하는 내용들은 다음과 같습니다. 
- `Insomnia 툴(tool)`을 이용한 테스트를 실제 로그인 화면으로 변경
- `Authorization Server`와 `Resource Server` 분리
- `spring-security-oauth2` 의존성 - 보안 취약점이 발견된 2.3.3.RELEASE 버전 사용 (2.3.5.RELEASE 버전으로 변경)
- 선 테스트 코드 작성 후 코드 구현 (RED-GREEN-REFACTORING 사이클 연습)
    - 프레임워크 기능에 의존적인 부분은 선 테스트 코드 작성에 실패하였습니다. 

##### Spring Security JWT OAuth Example 서비스 구조

<p align="center"><img src="/images/split-login-authorization-resource-service-1.JPG" width="70%"></p>

##### 해당 포스트에서 다루는 서비스 구조
- 이번 포스트에선 `리소스 서비스`를 구현하였습니다.  

<p align="center"><img src="/images/split-login-authorization-resource-service-2.JPG" width="70%"></p>

##### 주의사항
- 현재 최신 `Spring Security`에서는 `Authorization Server` 구현을 지원하지 않습니다. (Deprecated)

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

## 1. 리소스 서비스 구조, 설정 및 의존성

### 1.1. 패키지 구조

```
./
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
    │   │               ├── converter
    │   │               │   └── StringListConverter.java
    │   │               ├── dto
    │   │               │   └── MemberDto.java
    │   │               ├── entity
    │   │               │   └── Member.java
    │   │               ├── filter
    │   │               │   └── CustomCorsFilter.java
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
                        ├── ActionInBlogApplicationTests.java
                        └── controller
                            └── MemberControllerTests.java
```

### 1.2. application.yml

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
            <scope>test</scope>
        </dependency>
    </dependencies>
```

## 2. Resource 서비스 구축

### 2.1. SecurityConfig 클래스
- `@EnableWebSecurity` 애너테이션을 추가합니다. 
- `WebSecurityConfigurerAdapter` 클래스를 상속받습니다. 
- `configure(AuthenticationManagerBuilder auth)` 메소드
    - AuthenticationManagerBuilder 객체에 사용자 인증시 필요한 AuthenticationProvider 혹은 UserDetailsService를 설정합니다.
    - 임시 사용자 정보를 메모리에 등록합니다.
        - 아이디 `Junhyunny`, 비밀번호 `encode(123)`
        - 아이디 `TestUser`, 비밀번호 `encode(123)`

```java
package blog.in.action.security;

// ...

@RequiredArgsConstructor
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private final MemberService memberService;

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
        auth.inMemoryAuthentication().withUser("TestUser").password(passwordEncoder().encode("123")).authorities("USER");
    }
}
```

### 2.2. ResourceServer 클래스
- `@EnableResourceServer` 애너테이션을 추가합니다. 
- `ResourceServerConfigurerAdapter` 클래스를 상속받습니다. 
- `configure(HttpSecurity http)` 메소드
    - 리소스 서비스에서 제공하는 API 경로에 대한 접근 제어를 실시합니다.
    - `/member` 경로는 `"ADMIN"` 권한을 가진 사용자만 접근 가능하도록 제어합니다.

```java
package blog.in.action.security;

// ...

@Configuration
@EnableResourceServer
public class ResourceServer extends ResourceServerConfigurerAdapter {

    @Override
    public void configure(HttpSecurity http) throws Exception {
        http.cors().and() //
                .authorizeRequests() //
                .antMatchers("/h2-console/**").permitAll()
                .antMatchers("/member/**").hasAnyAuthority("ADMIN") // member API는 ADMIN 권한을 가지는 유저만 요청 허용
                .anyRequest().authenticated()
                .and() //
                .exceptionHandling().accessDeniedHandler(new OAuth2AccessDeniedHandler());
        // H2 데이터베이스 접근 허가
        http.headers().frameOptions().disable();
    }
}
```

## 3. 사용자 접근 제어 테스트

### 3.1. 테스트 전용 Authorization Server 구축
- `Authorization Server` 기능이 존재하지 않아서 테스트에 어려움을 겪을 수 있습니다. 
- `@TestConfiguration` 애너테이션을 이용해 임시 `Authorization Server`를 구축합니다.

```java
@TestConfiguration
@RequiredArgsConstructor
@EnableAuthorizationServer
class AuthorizationServer extends AuthorizationServerConfigurerAdapter {

    private String clientId = "CLIENT_ID";

    private String clientSecret = "CLIENT_SECRET";

    private int ACCESS_TOKEN_VALID_SECONDS = 10 * 60 * 24;

    private int REFRESH_TOKEN_VALID_SECONDS = 60 * 60 * 24;

    private final MemberService memberService;

    private final PasswordEncoder passwordEncoder;

    private final AuthenticationManager authenticationManager;

    @Bean
    public JwtAccessTokenConverter jwtAccessTokenConverter() {
        return new JwtAccessTokenConverter();
    }

    @Override
    public void configure(ClientDetailsServiceConfigurer clients) throws Exception {
        clients.inMemory()
                .withClient(clientId)//
                .secret(passwordEncoder.encode(clientSecret))//
                .authorizedGrantTypes("password", "refresh_token")//
                .scopes("read")//
                .accessTokenValiditySeconds(ACCESS_TOKEN_VALID_SECONDS)// token 유효 시간 등록
                .refreshTokenValiditySeconds(REFRESH_TOKEN_VALID_SECONDS);
    }

    @Override
    public void configure(AuthorizationServerEndpointsConfigurer endpoints) throws Exception {
        TokenEnhancerChain tokenEnhancerChain = new TokenEnhancerChain();
        tokenEnhancerChain.setTokenEnhancers(Arrays.asList(jwtAccessTokenConverter())); // JWT Converter 등록
        endpoints.userDetailsService(memberService)// UserDetailsService 등록
                .authenticationManager(authenticationManager)//
                .tokenEnhancer(tokenEnhancerChain);
    }
}
```

### 3.2. 사용자 접근 제어 테스트
- `givenMemberId_whenWithoutToken_thenIsUnauthorized` 테스트
    - 토큰 없이 접근하는 경우 `401 Unauthorized` 에러가 발생합니다.
- `givenMemberId_whenWithBearerToken_thenIsOk` 테스트
    - 적절한 권한을 가진 사용자가 토큰을 이용해 접근하는 경우 정상적으로 데이터를 조회할 수 있습니다.
- `givenMemberId_whenUnsupportedAuthorization_thenIsForbidden` 테스트
    - 부적절한 권한을 가진 사용자가 토큰을 이용해 접근하는 경우 `403 Forbidden` 에러가 발생합니다.

```java
package blog.in.action.controller;

// ...

@RunWith(SpringRunner.class)
@WebAppConfiguration
@SpringBootTest(classes = ActionInBlogApplication.class)
@Import(AuthorizationServer.class)
public class MemberControllerTests {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @MockBean
    private MemberRepository memberRepository;

    private MockMvc mockMvc;

    @Before
    public void setup() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Test
    public void givenMemberId_whenWithoutToken_thenIsUnauthorized() throws Exception {

        mockMvc.perform(get("/member/Junhyunny"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void givenMemberId_whenWithBearerToken_thenIsOk() throws Exception {

        when(memberRepository.findById("Junhyunny"))
                .thenReturn(Optional.of(new Member("Junhyunny", "123", Collections.singletonList("ADMIN"))));

        mockMvc.perform(get("/member/Junhyunny")
                        .header("Authorization", "Bearer " + getAccessToken("Junhyunny", "123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is("Junhyunny")))
                .andExpect(jsonPath("$.authorities").isArray())
                .andExpect(jsonPath("$.authorities").isNotEmpty())
                .andExpect(jsonPath("$.authorities[0]", is("ADMIN")));
    }

    @Test
    public void givenMemberId_whenUnsupportedAuthorization_thenIsForbidden() throws Exception {

        mockMvc.perform(get("/member/TestUser")
                        .header("Authorization", "Bearer " + getAccessToken("TestUser", "123")))
                .andExpect(status().isForbidden());
    }

    public String getAccessToken(String username, String password) throws Exception {

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "password");
        params.add("username", username);
        params.add("password", password);

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
        return parsedMap.get("access_token").toString();
    }
}
```

## 4. 화면 / 인증 / 리소스 서비스 연동 결과
위 작업 내용은 모두 커밋(commit)하고, 구현 완료된 인증 서비스, 리소스 서비스와 연결하면서 변경된 내용만 정리해보겠습니다. 
테스트를 모두 통과하였기에 쉽게 연결될 것으로 기대했지만, 인증 서비스와 연결시에 예상치 못한 에러를 만났습니다. 
해당 사항에 구체적인 내용은 다음 포스트를 통해 정리해보겠습니다. 
변경된 내용은 위 코드에 반영하지 않았으며, 테스트 코드 레포지토리에서 확인하시길 바랍니다. 

### 4.1. 리소스 서비스 코드 변경 사항
- JWT 토큰을 변경하는 빈에 Sign Key를 지정해주고, 부가적인 기능을 호출합니다.(afterPropertiesSet 메소드)
    - 관련 코드 - MemberController.AuthorizationServer.java
- JWT 토큰을 변경하는 JwtAccessTokenConverter 객체를 ResourceServerSecurityConfigurer 객체에 추가합니다.
    - 관련 코드 - ResourceServer.java
- 테스트 용 사용자를 등록하기 위한 CommandLineRunner 기능을 추가합니다.
    - 관련 코드 - ActionInBlogApplication.java

### 4.2. 테스트 결과 화면

<p align="center">
    <img src="/images/split-login-authorization-resource-service-3.gif" width="100%" class="image__border">
</p>

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
[authorization-service-link]: https://junhyunny.github.io/spring-boot/spring-security/react/jest/test-driven-development/split-login-authorization-resource-service-authorization/
