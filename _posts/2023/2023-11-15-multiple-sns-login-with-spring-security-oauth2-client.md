---
title: "Multiple SNS Login with Spring Security OAuth2 Client"
search: false
category:
  - java
  - design-pattern
  - spring-boot
last_modified_at: 2023-11-15T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Strategy Pattern][strategy-pattern-link]
- [OAuth2 LINE Login with Spring Security][oauth2-line-login-link]
- [How to make stub for super class][stub-for-super-class-link]

## 0. 들어가면서

최근 프로젝트들이 모두 OAuth2 프로토콜을 통해 사용자 인증을 구현했습니다. 하나의 플랫폼만 연결하는 경우도 있었지만, 다중 플랫폼의 인증을 구현한 케이스도 있었습니다. 다중 플랫폼을 연결할 때는 플랫폼이 늘어날 때마다 확장성을 고려해야 합니다. 스프링 프레임워크(spring framework)의 프로파일 기능과 디자인 패턴을 통해 조금 더 확장하기 쉬운 애플리케이션을 개발한 내용에 대해 정리하였습니다. 

## 1. Spring Security OAuth2 Client

스프링 시큐리티(spring security) 의존성 중 하나인 `spring-boot-starter-oauth2-client`를 사용하면 OAuth2 프로토콜 표준에 맞춰 사용자 인증과 인가 작업을 쉽게 구현할 수 있습니다. 다만 스프링 시큐리티는 공부하지 않고 사용하는 경우 블랙 박스(black box)처럼 느껴지기 때문에 사용하기 어려워하는 경우가 있습니다. OAuth2 프로토콜 인증 흐름을 따라 스프링 시큐리티 OAuth2 클라이언트 의존성이 동작하는 과정을 정리하면서 어느 부분의 기능을 확장하였는지 살펴보겠습니다. 

### 1.1. Redirect Authentication Page

인터넷 서비스를 사용하는 사람들은 웬만하면 SNS 로그인을 경험해봤을 것 입니다. 돌이켜보면 SNS 로그인 화면은 해당 플랫폼에서 제공한다는 것을 떠올릴 수 있습니다. 인증은 사용자 리소스를 관리하는 플랫폼으로부터 전달받습니다. 브라우저에서 OAuth2 로그인을 시도하면 클라이언트 서비스는 요청을 인증 플랫폼 화면으로 리다이렉트합니다. 

- 브라우저에서 백엔드 서비스로 로그인 요청을 보냅니다.
- 백엔드 서비스는 요청을 해당 플랫폼의 인증 서비스로 리다이렉트합니다. 
- 브라우저는 해당 플랫폼의 로그인 화면을 볼 수 있습니다.

<p align="center">
    <img src="/images/multiple-sns-login-with-spring-security-oauth2-client-01.png" width="80%" class="image__border">
</p>

### 1.2. Get Access Token And User Resource

사용자는 SNS 플랫폼 로그인 화면에서 사용자 아이디와 비밀번호를 입력합니다. 인증이 성공하면 해당 플랫폼에 미리 등록한 리다이렉트 URL로 인증 코드와 함께 요청이 돌아옵니다. 전달 받는 인증 코드는 액세스 토큰을 발급 받을 때 클라이언트 아이디와 시크릿과 함께 사용됩니다. 리다이렉트 URL 돌아온 요청은 다음과 같은 실행 흐름을 가집니다. 

1. 플랫폼 인증 서버는 브라우저를 미리 등록된 경로로 리다이렉트시킵니다.
1. 리다이렉트 요청을 받으면 시큐리티 필터 체인(security filterchain)의 `OAuth2LoginAuthenticationFilter` 객체가 사용자 인가 작업을 수행합니다. 
1. `OAuth2AuthorizationCodeAuthenticationProvider` 객체가 인증 서버로부터 액세스 토큰(access token)을 발급 받습니다. 미리 등록한 클라이언트 아이디, 시크릿 그리고 리다이렉트 URL로 함께 전달받은 인가 코드를 함께 전달합니다.
1. 액세스 토큰 발급이 성공하면 인가 작업은 완료되었다는 의미입니다. `DefaultOAuth2UserService` 객체는 발급 받은 액세스 토큰을 사용해 사용자 정보를 리소스 서버로부터 조회합니다. 

<p align="center">
    <img src="/images/multiple-sns-login-with-spring-security-oauth2-client-02.png" width="100%" class="image__border">
</p>

### 1.3. How can we implement SNS login for multiple platforms?

스프링 시큐리티는 OAuth2 프로토콜 표준을 따르기 때문에 인증, 인가, 리소스 획득 작업은 어떤 플랫폼을 사용하든 동일한 과정을 거칩니다. 플랫폼마다 다른 점은 사용자 정보 스키마입니다. 각 플랫폼마다 다른 모습, 다른 프로퍼티 이름으로 사용자 정보를 반환하기 때문에 이 부분을 맞춰 개발할 필요가 있습니다. 필자는 DefaultOAuth2UserService 클래스를 확장하여 각 플랫폼 별로 획득한 인증된 사용자 정보를 신규 생성 혹은 조회하도록 설계하였습니다. CustomOAuth2UserService 인터페이스로 추상화하여 전략 패턴(strategy pattern)을 적용한 이유는 추후 연결할 플랫폼이 늘어날 것을 고려했기 때문입니다. DefaultOAuth2UserService 구현 코드를 설명할 때 이에 대한 추가적인 이야기를 하겠습니다. 

- DefaultOAuth2UserService 객체는 통해 부모 클래스 기능을 통해 SNS 플랫폼 리소스 서버로부터 인증된 사용자 정보를 획득합니다.
- DefaultOAuth2UserService 객체는 CustomOAuth2UserService 인스턴스들에게 인증된 사용자 처리를 위임합니다.
    - CustomOAuth2UserService 인스턴스는 자신이 지원하는 플랫폼의 사용자만 처리합니다.
    - 신규 사용자는 새로 생성합니다.
    - 기존 사용자는 조회 후 반환합니다. 

<p align="center">
    <img src="/images/multiple-sns-login-with-spring-security-oauth2-client-03.png" width="80%" class="image__border">
</p>

## 2. Project Setup

먼저 프로젝트 설정부터 살펴보겠습니다. 

### 2.1. build.gradle

다음과 같은 의존성이 필요합니다.

- spring-boot-starter-security
    - 스프링 시큐리티 프레임워크
- spring-boot-starter-oauth2-client
    - OAuth2 프로토콜 클라이언트 서비스 지원

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.1.5'
    id 'io.spring.dependency-management' version '1.1.3'
}

group = 'action.in.blog'
version = '0.0.1-SNAPSHOT'

java {
    sourceCompatibility = '17'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-thymeleaf'
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-client'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'com.h2database:h2:2.2.224'
    compileOnly 'org.projectlombok:lombok:1.18.30'
    annotationProcessor 'org.projectlombok:lombok:1.18.30'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
}

tasks.named('bootBuildImage') {
    builder = 'paketobuildpacks/builder-jammy-base:latest'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

### 2.2. application-platform.yml 

하나의 파일에 모든 설정이 들어 있는 것은 복잡합니다. 플랫폼 별로 설정 파일을 분할하고 필요에 따라 프로파일을 추가하여 사용합니다. 각 설정 파일을 살펴보겠습니다.

#### 2.2.1. application-google.yml

구글은 스프링 시큐리티에서 필요한 정보를 자동으로 채워주기 때문에 제공자 정보는 별도로 추가하지 않습니다. 클라이언트 아이디, 시크릿, 리다이렉트 URL, 클라이언트 시크릿 전달 방식, 스코프 등의 정보만 작성합니다.

```yml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-authentication-method: client_secret_post # 클라이언트 시크릿 전달 방식
            client-id: ${GOOGLE_CLIENT_ID} # 클라이언트 아이디
            client-secret: ${GOOGLE_CLIENT_SECRET} # 클라이언트 시크릿
            redirect-uri: "{baseUrl}/login/oauth2/callback/" # 리다이렉트 URL
            scope: # 스코프
              - profile
              - email
```

#### 2.2.2. application-kakao.yml

카카오는 클라이언트, 인증 제공자 정보를 모두 입력합니다. 가독성을 위해 주석으로 설명을 작성하였습니다. 스코프나 인증 제공자 정보는 공식 홈페이지를 참조합니다. 

```yml
spring:
  security:
    oauth2:
      client:
        registration:
          kakao:
            client-authentication-method: client_secret_post # 클라이언트 시크릿 전달 방식
            authorization-grant-type: authorization_code # 인가 방법
            client-id: ${KAKAO_CLIENT_ID} # 클라이언트 아이디
            client-secret: ${KAKAO_CLIENT_SECRET} # 클라이언트 시크릿
            redirect-uri: "{baseUrl}/login/oauth2/callback/" # 리다이렉트 URL
            scope: # 스코프
              - profile_nickname 
              - account_email
        provider:
          kakao:
            authorization-uri: https://kauth.kakao.com/oauth/authorize # 인가 서버
            token-uri: https://kauth.kakao.com/oauth/token # 토큰 발급 서버
            user-info-uri: https://kapi.kakao.com/v2/user/me # 사용자 정보 조회 리소스 서버
            user-name-attribute: id # 사용자 정보 스키마에서 사용자 식별자를 찾을 수 있는 키
```

#### 2.2.3. application-naver.md

네이버도 카카오와 마찬가지로 클라이언트, 인증 제공자 정보를 모두 입력합니다. 가독성을 위해 주석으로 설명을 작성하였습니다. 스코프나 인증 제공자 정보는 공식 홈페이지를 참조합니다. 

```yml
spring:
  security:
    oauth2:
      client:
        registration:
          naver:
            authorization-grant-type: authorization_code # 인가 방법
            client-id: ${NAVER_CLIENT_ID} # 클라이언트 아이디
            client-secret: ${NAVER_CLIENT_SECRET} # 클라이언트 시크릿
            redirect-uri: "{baseUrl}/login/oauth2/callback/" # 리다이렉트 URL
            scope: # 스코프
              - email
        provider:
          naver:
            authorization-uri: https://nid.naver.com/oauth2.0/authorize # 인가 서버
            token-uri: https://nid.naver.com/oauth2.0/token # 토큰 발급 서버
            user-info-uri: https://openapi.naver.com/v1/nid/me # 사용자 정보 조회 리소스 서버
            user-name-attribute: response # 사용자 정보 스키마에서 사용자 식별자를 찾을 수 있는 키
```

### 2.3. application.yml

각 플랫폼 별 설정 파일을 살펴봤습니다. 위 설정 파일들을 애플리케이션이 실행될 때 모두 사용하기 위해 `include` 키워드를 이용합니다. 

- 필요한 프로파일들을 플랫폼 이름으로 추가합니다.
    - 플랫폼 이름이 붙은 설정 파일들이 사용됩니다. 

```yml
spring:
  profiles:
    include:
      - kakao
      - naver
      - google
  datasource:
    url: jdbc:h2:mem:test
    driver-class-name: org.h2.Driver
    username: sa
    password:
  h2:
    console:
      path: /h2-console
      enabled: true
```

### 2.4. SecurityConfig Class

- 접근 권한 설정
    - H2 콘솔 경로 허용
    - 기타 다른 경로는 인증 필요
- OAuth2 로그인 설정
    - `/login/oauth2/callback/` 경로
        - 인증 서비스 제공자에 미리 등록한 리다이렉트 URL 설정
    - `/home` 경로
        - 인증 성공 후처리를 위한 리다이렉트 URL 지정

```java
package action.in.blog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.boot.autoconfigure.security.servlet.PathRequest.toH2Console;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(
                        (requests) -> requests
                                .requestMatchers(toH2Console()).permitAll()
                                .anyRequest().authenticated()
                )
                .oauth2Login((configurer) ->
                        configurer
                                .redirectionEndpoint(endpoint -> endpoint.baseUri("/login/oauth2/callback/"))
                                .defaultSuccessUrl("/home")
                )
                .headers(configurer -> configurer.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable);
        return http.build();
    }
}
```

## 3. Implementation

지금부터 구현 코드를 살펴보겠습니다. 

### 3.1. DelegatingOAuth2UserService Class

DefaultOAuth2UserService 클래스를 상속한 클래스를 정의합니다. @Service 애너테이션을 추가해 스프링 빈(bean)으로 만들면 해당 컴포넌트가 OAuth2LoginAuthenticationProvider 인스턴스에서 사용하는 DefaultOAuth2UserService 인스턴스를 대체합니다. CustomOAuth2UserService 인스턴스를 리스트 형태로 주입 받습니다. CustomOAuth2UserService 인터페이스를 구현한 모든 스프링 빈들이 주입됩니다. 다음과 같은 장점을 가집니다.

- 나중에 추가될 플랫폼을 지원하는 스프링 빈을 새롭게 정의하면 자동으로 주입 받습니다.
- 인증을 위한 핵심 비즈니스 로직인 loadUser 메서드는 변경이 없습니다.
- 변경에 닫혀 있고 확장에 열린 개방-폐쇄 원칙(open–closed principle)을 지킬 수 있습니다.

다음과 같은 동작을 수행합니다. 

- 처리를 위임할 CustomOAuth2UserService 인스턴스들에게 플랫폼 지원 여부를 확인합니다.
- 해당 플랫폼을 지원하는 서비스 인스턴스를 찾았다면 부모 클래스의 기능을 사용해 외부 리소스 서버로부터 사용자 정보를 조회합니다.
    - 새로운 메서드로 감싼 이유는 테스트를 원활하게 만들기 위함입니다.
    - 자세한 내용은 [How to make stub for super class][stub-for-super-class-link] 포스트를 참조바랍니다.
- 리소스 서버로부터 사용자 정보를 획득하면 이를 기반으로 사용자 정보를 생성하거나 조회 후 반환합니다.

```java
package action.in.blog.service;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DelegatingOAuth2UserService extends DefaultOAuth2UserService {

    private final List<CustomOAuth2UserService> oauth2UserServices;

    public DelegatingOAuth2UserService(List<CustomOAuth2UserService> oauth2UserServices) {
        this.oauth2UserServices = oauth2UserServices;
    }

    public OAuth2User loadUserFromParent(OAuth2UserRequest userRequest) {
        return super.loadUser(userRequest);
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        for (var oauth2Service : oauth2UserServices) {
            if (!oauth2Service.supports(userRequest)) {
                continue;
            }
            var oauth2User = loadUserFromParent(userRequest);
            return oauth2Service.createOrLoadUser(oauth2User);
        }
        throw new RuntimeException("지원하지 않는 플랫폼입니다.");
    }
}
```

### 3.2. CustomOAuth2UserService Interface

CustomOAuth2UserService 인스턴스는 어떤 책임을 가지는지 인터페이스를 살펴보겠습니다. 

- 해당 플랫폼을 지원하는지 확인합니다.
- 사용자 정보를 생성하거나 조회합니다.

```java
package action.in.blog.service;

import action.in.blog.domain.token.AuthenticatedUser;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;

public interface CustomOAuth2UserService {

    boolean supports(OAuth2UserRequest userRequest);

    AuthenticatedUser createOrLoadUser(OAuth2User authenticatedUser);
}
```

### 3.3. Google

구글 리소스 서버로부터 전달받은 사용자 정보는 다음과 같은 스키마를 가지고 있습니다. 이를 처리하기 위한 도메인 객체를 설계하고 서비스 기능을 정의합니다.

```
{
    sub=111160025331912458305, 
    name=강준현, 
    given_name=준현, 
    family_name=강, 
    picture=https://lh3.googleusercontent.com/a/ACg8ocL-ZA1YcUPAPUkCjn3gbyM267CEPG80wy7KCDOokOWh=s96-c, 
    email=opop3966@gmail.com, 
    email_verified=true, 
    locale=ko
}
```

#### 3.3.1. GoogleUser Class

구글 사용자 정보를 기반으로 UserEntity 객체를 생성합니다.

```java
package action.in.blog.domain.model;

import action.in.blog.domain.entity.UserEntity;
import action.in.blog.domain.enums.LoginType;
import action.in.blog.domain.enums.Role;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Map;

public class GoogleUser {

    private final OAuth2User oAuth2User;

    public GoogleUser(OAuth2User oAuth2User) {
        this.oAuth2User = oAuth2User;
    }

    public UserEntity toUserEntity() {
        return UserEntity.builder()
                .role(Role.USER)
                .email(email())
                .nickName(nickName())
                .loginType(LoginType.GOOGLE)
                .oauth2ClientId(oAuth2User.getName())
                .build();
    }

    private Map<String, Object> attributes() {
        return oAuth2User.getAttributes();
    }

    private String nickName() {
        return String.valueOf(attributes().get("name"));
    }

    private String email() {
        return String.valueOf(attributes().get("email"));
    }
}
```

#### 3.2.2. GoogleOAuth2UserService Class

- supports 메서드
    - 서비스 제공자가 `google`인 경우만 지원합니다.
- createOrLoadUser 메서드
    - 사용자 정보를 조회 후 반환합니다.
    - 사용자 정보가 없는 경우 새로 생성합니다.
    - 인증된 사용자 정보를 담은 토큰을 만들어 반환합니다.

```java
package action.in.blog.service;

import action.in.blog.domain.entity.UserEntity;
import action.in.blog.domain.enums.LoginType;
import action.in.blog.domain.model.GoogleUser;
import action.in.blog.domain.token.AuthenticatedUser;
import action.in.blog.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoogleOAuth2UserService implements CustomOAuth2UserService {

    private static final String REGISTRATION_ID = "google";
    private final UserRepository repository;

    public GoogleOAuth2UserService(UserRepository repository) {
        this.repository = repository;
    }

    @Override
    public boolean supports(OAuth2UserRequest userRequest) {
        return REGISTRATION_ID.equals(userRequest.getClientRegistration().getRegistrationId());
    }

    @Transactional
    @Override
    public AuthenticatedUser createOrLoadUser(OAuth2User authenticatedUser) {
        var subject = authenticatedUser.getName();
        var optional = repository.findUserByOauth2ClientIdAndLoginType(subject, LoginType.GOOGLE);
        UserEntity user;
        if (optional.isPresent()) {
            user = optional.get();
        } else {
            user = new GoogleUser(authenticatedUser).toUserEntity();
            repository.save(user);
        }
        return AuthenticatedUser.of(user, authenticatedUser);
    }
}
```

### 3.4. Kakao

카카오 리소스 서버로부터 전달받은 사용자 정보는 다음과 같은 스키마를 가지고 있습니다. 이를 처리하기 위한 도메인 객체를 설계하고 서비스 기능을 정의합니다.

```
{
    id=3149432885, 
    connected_at=2023-11-05T11:56:24Z, 
    properties={
        nickname=강준현
    }, 
    kakao_account={
        profile_nickname_needs_agreement=false, 
        profile={
            nickname=강준현
        }, 
        has_email=true, 
        email_needs_agreement=false, 
        is_email_valid=true, 
        is_email_verified=true, 
        email=kang3966@naver.com
    }
}
```

#### 3.4.1. KakaoUser Class

카카오 사용자 정보를 기반으로 UserEntity 객체를 생성합니다.

```java
package action.in.blog.domain.model;

import action.in.blog.domain.entity.UserEntity;
import action.in.blog.domain.enums.LoginType;
import action.in.blog.domain.enums.Role;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Map;

public class KakaoUser {

    private final OAuth2User oAuth2User;

    public KakaoUser(OAuth2User oAuth2User) {
        this.oAuth2User = oAuth2User;
    }

    public UserEntity toUserEntity() {
        return UserEntity.builder()
                .role(Role.USER)
                .email(email())
                .nickName(nickName())
                .loginType(LoginType.KAKAO)
                .oauth2ClientId(oAuth2User.getName())
                .build();
    }

    private Map<String, Object> properties() {
        return oAuth2User.getAttribute("properties");
    }

    private Map<String, Object> account() {
        return oAuth2User.getAttribute("kakao_account");
    }

    private String nickName() {
        return String.valueOf(properties().get("nickname"));
    }

    private String email() {
        return String.valueOf(account().get("email"));
    }
}
```

#### 3.4.2. KakaoOAuth2UserService Class

- supports 메서드
    - 서비스 제공자가 `kakao`인 경우만 지원합니다.
- createOrLoadUser 메서드
    - 사용자 정보를 조회 후 반환합니다.
    - 사용자 정보가 없는 경우 새로 생성합니다.
    - 인증된 사용자 정보를 담은 토큰을 만들어 반환합니다.

```java
package action.in.blog.service;

import action.in.blog.domain.entity.UserEntity;
import action.in.blog.domain.enums.LoginType;
import action.in.blog.domain.token.AuthenticatedUser;
import action.in.blog.domain.model.KakaoUser;
import action.in.blog.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class KakaoOAuth2UserService implements CustomOAuth2UserService {

    private static final String REGISTRATION_ID = "kakao";
    private final UserRepository repository;

    public KakaoOAuth2UserService(UserRepository repository) {
        this.repository = repository;
    }

    @Override
    public boolean supports(OAuth2UserRequest userRequest) {
        return REGISTRATION_ID.equals(userRequest.getClientRegistration().getRegistrationId());
    }

    @Transactional
    @Override
    public AuthenticatedUser createOrLoadUser(OAuth2User authenticatedUser) {
        var subject = authenticatedUser.getName();
        var optional = repository.findUserByOauth2ClientIdAndLoginType(subject, LoginType.KAKAO);
        UserEntity user;
        if (optional.isPresent()) {
            user = optional.get();
        } else {
            user = new KakaoUser(authenticatedUser).toUserEntity();
            repository.save(user);
        }
        return AuthenticatedUser.of(user, authenticatedUser);
    }
}
```

### 3.5. Naver

네이버 리소스 서버로부터 전달받은 사용자 정보는 다음과 같은 스키마를 가지고 있습니다. 이를 처리하기 위한 도메인 객체를 설계하고 서비스 기능을 정의합니다.

```
{
    resultcode=00, 
    message=success, 
    response={
        id=y_M3h3qw48wNZNM5Gda3yWpV7Tv_BOAjJhWOxJkIW6o, 
        email=kang3966@naver.com, 
        name=강준현
    }
}
```

#### 3.5.1. NaverUser Class

네이버 사용자 정보를 기반으로 UserEntity 객체를 생성합니다.

```java
package action.in.blog.domain.model;

import action.in.blog.domain.entity.UserEntity;
import action.in.blog.domain.enums.LoginType;
import action.in.blog.domain.enums.Role;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Map;

public class NaverUser {

    private final OAuth2User oAuth2User;

    public NaverUser(OAuth2User oAuth2User) {
        this.oAuth2User = oAuth2User;
    }

    public UserEntity toUserEntity() {
        return UserEntity.builder()
                .role(Role.USER)
                .email(email())
                .nickName(nickName())
                .loginType(LoginType.NAVER)
                .oauth2ClientId(subject())
                .build();
    }

    private Map<String, Object> response() {
        return oAuth2User.getAttribute("response");
    }

    public String subject() {
        return String.valueOf(response().get("id"));
    }

    private String nickName() {
        return String.valueOf(response().get("name"));
    }

    private String email() {
        return String.valueOf(response().get("email"));
    }
}
```

#### 3.5.2. NaverOAuth2UserService Class

- supports 메서드
    - 서비스 제공자가 `naver`인 경우만 지원합니다.
- createOrLoadUser 메서드
    - 사용자 정보를 조회 후 반환합니다.
    - 사용자 정보가 없는 경우 새로 생성합니다.
    - 인증된 사용자 정보를 담은 토큰을 만들어 반환합니다.

```java
package action.in.blog.service;

import action.in.blog.domain.entity.UserEntity;
import action.in.blog.domain.enums.LoginType;
import action.in.blog.domain.token.AuthenticatedUser;
import action.in.blog.domain.model.NaverUser;
import action.in.blog.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NaverOAuth2UserService implements CustomOAuth2UserService {

    private static final String REGISTRATION_ID = "naver";
    private final UserRepository repository;

    public NaverOAuth2UserService(UserRepository repository) {
        this.repository = repository;
    }

    @Override
    public boolean supports(OAuth2UserRequest userRequest) {
        return REGISTRATION_ID.equals(userRequest.getClientRegistration().getRegistrationId());
    }

    @Transactional
    @Override
    public AuthenticatedUser createOrLoadUser(OAuth2User authenticatedUser) {
        var naverUser = new NaverUser(authenticatedUser);
        var optional = repository.findUserByOauth2ClientIdAndLoginType(naverUser.subject(), LoginType.NAVER);
        UserEntity user;
        if (optional.isPresent()) {
            user = optional.get();
        } else {
            user = naverUser.toUserEntity();
            repository.save(user);
        }
        return AuthenticatedUser.of(user, authenticatedUser);
    }
}
```

### 3.6. AuthenticatedUser Class

인증된 사용자 정보를 시큐리티 컨텍스트(security context)에 보관할 때 사용하는 클래스입니다. 사용자 식별자, 권한 리스트, 이메일, 닉네임 정보를 반환합니다.

```java
package action.in.blog.domain.token;

import action.in.blog.domain.entity.UserEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.util.StringUtils;

import javax.security.auth.Subject;
import java.security.Principal;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthenticatedUser implements Principal, OAuth2User {

    private String name;
    private List<String> roles;
    private String email;
    private String nickName;
    private Map<String, Object> attributes;

    @Override
    public String getName() {
        return name;
    }

    @Override
    public boolean implies(Subject subject) {
        return Principal.super.implies(subject);
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
    }

    public static AuthenticatedUser of(UserEntity user, OAuth2User oauth2User) {
        return AuthenticatedUser.builder()
                .name(String.valueOf(user.getId()))
                .email(user.getEmail())
                .roles(List.of(user.getRole().name()))
                .nickName(user.getNickName())
                .attributes(oauth2User.getAttributes())
                .build();
    }
}
```

### 3.7. HomeController Class

인증된 사용자 정보를 바탕으로 HTML 페이지를 생성합니다.

```java
package action.in.blog.controller;

import action.in.blog.domain.model.AuthenticatedUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class HomeController {

    @GetMapping("/home")
    public ModelAndView home(@AuthenticationPrincipal AuthenticatedUser user) {
        var mav = new ModelAndView("home");
        mav.addObject("email", user.getEmail());
        mav.addObject("nickName", user.getNickName());
        return mav;
    }
}
```

## 4. Result

### 4.1. SNS Login

스프링 시큐리티에서 기본으로 제공하는 로그인 페이지를 통해 테스트할 수 있습니다.

<p align="center">
    <img src="/images/multiple-sns-login-with-spring-security-oauth2-client-04.gif" width="100%" class="image__border">
</p>

### 4.2. In Database

H2 콘솔을 통해 데이터베이스를 확인하면 사용자 정보가 다음과 같이 저장됩니다.

<p align="center">
    <img src="/images/multiple-sns-login-with-spring-security-oauth2-client-05.png" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-11-15-multiple-sns-login-with-spring-security-oauth2-client>

#### REFERENCE

- <https://www.rfc-editor.org/rfc/rfc6749>

[strategy-pattern-link]: https://junhyunny.github.io/information/design-pattern/strategy-pattern/
[oauth2-line-login-link]: https://junhyunny.github.io/java/spring-boot/spring-security/oauth2-line-login-with-spring-security/
[stub-for-super-class-link]: https://junhyunny.github.io/java/spring-boot/test/how-to-make-stub-for-super-class/