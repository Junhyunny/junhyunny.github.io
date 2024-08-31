---
title: "Spring Security OAuth2 Resource Server"
search: false
category:
  - information
  - java
  - spring-boot
  - spring-security
last_modified_at: 2024-06-24T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [JWT(Json Web Token)][json-web-token-link]
- [JWK(Json Web Key)][json-web-key-link]

## 0. 들어가면서

최근 프로젝트는 iOS 애플리케이션을 개발했고 사용자 인증을 위해 마이크로소프트 AAD(Azure Active Directory)를 사용했다. 

평소 개발하는 웹 서비스에선 백엔드 애플리케이션이 클라이언트로써 참여하지만, iOS 애플리케이션 인증 과정에선 리소스 서버 역할을 수행한다. 오래 전에 스프링 시큐리티 인가 서버, 리소스 서버 의존성을 사용해 본 경험이 있지만, 당시엔 충분히 이해하지 못한 채 사용했기 때문에 구현에만 급급했다. 이번 글은 오랜만에 다시 사용해 본 스프링 시큐리티 OAuth2 리소스 서버의 아키텍처 일부분과 인증 흐름에 대해 정리했다. 

## 1. Project Context

프로젝트에서 OAuth2 인증 프로세스에 참여하는 컴포넌트들을 살펴보자. [OAuth2 인증 프로토콜 흐름(RFC6749)](https://www.rfc-editor.org/rfc/rfc6749#section-1.2)을 기준으로 설명한다.

1. Authorization Request
  - 리소스 오너(resource owner)에게 인가를 요청한다.
  - iOS 애플리케이션에서 로그인 버튼을 누르면 웹 뷰에서 MS AAD 로그인 화면이 열린다.
2. Authorization Grant
  - 리소스 오너가 인가 작업을 시도한다.
  - MS 로그인 화면에서 아이디, 비밀번호를 입력 후 제출한다.
3. Authorization Grant
  - 리소스 오너의 정보가 인가 서버로 제출된다.
  - 인가 서버는 리소스 오너의 인증 정보가 유효한지 확인한다.
4. Access Token
  - 리소스 오너의 인증 정보가 유효한다면 액세스 토큰을 반환한다.
5. Access Token
  - 리소스 서버에 접근할 때 액세스 토큰을 사용한다.
  - 백엔드 서버 애플리케이션은 `5-1` 과정을 통해 해당 액세스 토큰의 유효성을 확인한다.
6. Protected Resource
  - 액세스 토큰이 유효한 경우 리소스 오너의 보호된 정보를 반환한다. 

<div align="center">
  <img src="/images/posts/2024/spring-security-oauth2-resource-server-01.png" width="80%" class="image__border">
</div>

## 2. Validate Access Token Process in Spring Boot OAuth2 Resource Server

내가 개발한 백엔드 서버 애플리케이션은 마이크로소프트 서버가 아니다. 백엔드 애플리케이션은 어떤 과정을 통해 해당 토큰의 유효성을 검증하고 있을까? 내가 개발한 백엔드 서버는 `spring-boot-starter-oauth2-resource-server` 의존성을 사용하고 있다. 해당 의존성을 사용하면 `applicaiton.yml` 파일에 공개 키를 조회할 수 있는 URL 주소를 설정하는 것만으로 쉽게 해당 액세스 토큰의 유효성을 검증할 수 있다. 설정과 구현 코드를 함께 살펴보자. 

### 2.1. build.gradle

스프링 시큐리티 의존성과 OAuth2 리소스 서버 의존성이 필요하다.

- spring-boot-starter-security
- spring-boot-starter-oauth2-resource-server

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}
```

### 2.2. application YAML

아래와 같이 [JWKs(Json Web Key Set)][json-web-key-link] 정보를 조회할 수 있는 URL 주소를 추가한다. 필자의 프로젝트는 마이크로소프트 AAD 로그인를 사용하고 있기 때문에 마이크로소프트가 제공하는 공개 키 URL를 지정한다.

- spring.security.oauth2.resourceserver.jwt.jwk-set-uri
  - 해당 경로는 마이크로소프트에서 제공한 `MICROSOFT_TENANT_ID` 값만 있다면 해당 URL에서 공개 키 리스트를 획득할 수 있다.

```yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jwk-set-uri: https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/discovery/v2.0/keys
```

### 2.3. Security Filter Chain

시큐리티 필터 체인을 구성해보자. 스프링 시큐리티 의존성을 추가하면 자동으로 시큐리티 필터 체인이 구성되지만, 직접 구현해보자. 스프링 시큐리티 OAuth2 리소스 서버는 오파크(opaque) 토큰과 JWT(json web token) 방식을 지원한다. 이번 예제에선 JWT 방식을 사용한다.

1. 모든 리소스 접근 요청에는 인증된 사용자만 접근 가능하다.
2. 리소스 서버 관련 설정이다.
  - jwt 옵션을 활성화하고 기본 설정을 사용한다.

```java
package action.in.blog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {
        http.authorizeHttpRequests( // 1
                registry ->
                        registry.anyRequest().authenticated()
        );
        http.oauth2ResourceServer( // 2
                configurer ->
                        configurer.jwt(
                                Customizer.withDefaults()
                        )
        );
        return http.build();
    }
}
```

### 2.4. Verify Process

위 설정만으로 액세스 토큰의 유효성 검증이 수행된다. 아래와 같은 프로세스가 진행된다.

1. iOS 애플리케이션에서 JWT 타입의 액세스 토큰을 서버로 보낸다.
2. 시큐리티 필터 체인 내 BearerTokenAuthenticationFilter 객체에서 액세스 토큰 인증을 수행한다.
  - 인가 매니저 인스턴스에게 토큰 인증을 위임한다.
3. JwtAuthenticationProvider 인증 제공자 객체가 액세스 토큰 검증을 수행한다.
  - 액세스 토큰 디코딩은 NimbusJwtDecoder 객체에게 위임한다.
  - 액세스 토큰을 디코딩 하는 과정에서 토큰의 서명 정보(signature)를 검증한다.
4. DefaultJWTProcessor 객체에서 액세스 토큰 검증에 필요한 [JWks(JWK Set)][json-web-key-link]를 인가 서버에게 요청한다.
  - 인가 서버 요청 시 사용하는 URL 주소는 `application.yml` 파일에 정의되어 있다.
  - DefaultJWTProcessor 객체는 JKWs를 조회할 때 `RemoteJWKSet` 객체와 협업한다.
  - 인가 서버로부터 획득한 JWKs는 캐시에 저장하여 재사용한다. 액세스 토큰을 검증할 때마다 JWKs를 요청하는 과정을 생략할 수 있다.
5. DefaultJWTProcessor 객체는 JWK를 사용해 JWT 액세스 토큰의 서명 정보 검증한다.
  - JWKs(JWK Set)에 담긴 JWK 중에서 JWT 헤더의 `kid` 값과 매칭되는 JWK 객체를 사용한다.
  - JWK 객체에 담긴 정보를 바탕으로 공개 키를 만든다.
  - 공개 키를 사용해 동일한 서명이 만들어지는지 확인한다.

<div align="center">
  <img src="/images/posts/2024/spring-security-oauth2-resource-server-02.png" width="100%" class="image__border">
</div>

## CLOSING

예제 코드는 백엔드 애플리케이션만 제공한다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-07-24-spring-security-oauth2-resource-server>

#### REFERENCE

- <https://www.rfc-editor.org/rfc/rfc6749>
- <https://datatracker.ietf.org/doc/html/rfc7517>
- <https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html>
- <https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html>

[json-web-token-link]: https://junhyunny.github.io/information/json-web-token/
[json-web-key-link]: https://junhyunny.github.io/information/json-web-key/