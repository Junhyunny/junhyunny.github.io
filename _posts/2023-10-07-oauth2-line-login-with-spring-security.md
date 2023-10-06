---
title: "OAuth2 LINE Login with Spring Security"
search: false
category:
  - java
  - spring-boot
  - spring-security
last_modified_at: 2023-10-07T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Spring Security Basic][spring-security-link]
* [Redirect and Forwarding][redirect-and-forwarding-link]
* [OAuth(Open Authorization)][oauth-link]

## 0. 들어가면서

많은 어플리케이션들은 SNS 인증을 통해 로그인 프로세스를 구현합니다. 
보통 SNS 인증 방식에는 [OAuth(Open Authorization)][oauth-link] 프로토콜이 사용되는데 현재 개발 중인 어플리케이션에도 LINE 로그인 기능을 추가하였습니다. 

스프링 프레임워크(spring framework) 기반으로 백엔드 서비스가 구성되었기 때문에 자연스레 스프링 시큐리티(spring security)를 사용하여 Line 로그인 기능을 추가하였습니다. 
기존 AAD(Azure Acrtive Directory) 인증 프로세스와 충돌이 있어서 정리하는 과정이 있었지만, 이번 포스트에선 LINE 로그인 기능에 대한 내용만 다루었습니다. 

## 1. OAuth2 Authentication Process in Spring Security

스프링 시큐리티를 사용하면 어떤 인증 프로세스가 진행되는지 정리하였습니다. 
이 내용을 이해하기 위해선 스프링 시큐리티 아키텍처에 대한 배경 지식이 필요합니다. 
간략히 설명하자면 스프링 시큐리티는 서블릿 필터 체인(servlet filter chain)의 기능을 확장합니다. 
서블릿 필터 체인 중간에 시큐리티 필터 체인을 추가하여 인증, 인가를 처리합니다. 
자세한 내용은 공식 홈페이지나 [Spring Security Basic][spring-security-link] 글을 참고하시기 바랍니다. 

### 1.1. Redirect to Login Page

처음 브라우저 웹 페이지에서 로그인 버튼을 누르면 상황이 시작됩니다. 

1. 사용자는 클라이언트 서비스의 `/oauth2/authorization/line` 경로로 요청을 보냅니다.
    * 스프링 시큐리티는 내부 규칙에 의해 인증 처리를 수행하는 URL이 자동으로 지정됩니다.
    * 개발자는 이를 변경할 수 있습니다.
1. `OAuth2AuthorizationRequestRedirectFilter` 인스턴스에서 설정 파일에 지정한 경로로 브라우저를 리다이렉트(redirect)시킵니다.
    * 각 서비스 제공자(SP, service provider)마다 인증 처리를 수행하는 경로가 다릅니다.
    * LINE의 경우 `https://access.line.me/oauth2/v2.1/authorize` 입니다.
    * 리다이렉트 시키는 경우 다음과 같은 정보들을 함께 전달합니다.
        * CLIENT_ID - 사전 발급이 필요합니다.
        * CLIENT_SECRET - 사전 발급이 필요합니다.
        * 콜백 URL - 사전 등록이 필요합니다.
        * 스코프(scope)
        * 응답 타입
1. 브라우저는 리다이렉트 요청으로 인해 LINE 로그인 페이지에 접근합니다.

<p align="center">
    <img src="/images/oauth2-line-login-with-spring-security-1.JPG" width="100%" class="image__border">
</p>

### 1.2. Login

서비스 제공자인 LINE이 제공하는 로그인 화면을 브라우저에서 볼 수 있습니다. 
사용자는 자신의 정보를 입력하여 로그인을 수행합니다. 

<p align="center">
    <img src="/images/oauth2-line-login-with-spring-security-2.JPG" width="100%" class="image__border">
</p>

### 1.3. Authenticate and Get User Profile

정확하게 사용자 정보를 입력했다면 서비스 제공자인 LINE의 인증 서비스는 임시 토큰을 하나 발급합니다. 
발급한 토큰을 사전에 등록된 클라이언트 콜백 URL로 전달하면서 상황이 시작됩니다. 

1. 서비스 제공자 인증 서버는 발급한 임시 토큰과 함께 `/oauth2/authorized/line` 경로로 브라우저를 리다이렉트시킵니다. 
    * LINE 개발자 페이지에 사전에 등록된 콜백 URL입니다.
1. `OAuth2LoginAuthenticationFilter` 필터에서 인증 처리가 수행되며 구체적인 인증 과정은 `AuthenticationManager` 인스턴스에게 위임합니다.
    * `ProviderManager` 인스턴스를 기본으로 사용합니다.
    * `ProviderManager` 인스턴스는 적합한 `AuthenticationProvider` 인스턴스에게 인증 과정을 위임합니다.
1. `OAuth2LoginAuthenticationProvider` 인스턴스는 `OAuth2AuthorizationCodeAuthenticationProvider` 인스턴스에서 액세스 토큰을 발급 받습니다.
    * 설정 파일에 등록한 URL로 액세스 토큰 발급을 요청합니다. 
    * LINE의 경우 `https://api.line.me/oauth2/v2.1/token` 입니다.
    * 서비스 제공자가 콜백 URL로 함께 전달한 인가 코드, 사전에 등록된 콜백 URL, 인가 타입 등이 전달됩니다.
1. `OAuth2LoginAuthenticationProvider` 인스턴스는 `DefaultOAuth2UserService` 인스턴스를 통해 사용자 정보를 리소스 서버로부터 전달받습니다. 
    * 설정 파일에 등록한 URL로 사용자 정보를 요청합니다. 
    * LINE의 경우 `https://api.line.me/v2/profile` 입니다.
    * 서비스 제공자의 인가 서버로부터 발급 받은 액세스 토큰을 함께 전달합니다.
1. 클라이언트 어플리케이션은 사용자 정보를 획득했다면 비즈니스 흐름에 맞게 사용자 브라우저를 리다이렉트시킵니다.
    * 이번 포스트에선 `http://localhost:8080/home` 경로로 이동합니다.

<p align="center">
    <img src="/images/oauth2-line-login-with-spring-security-3.JPG" width="100%" class="image__border">
</p>

## 2. Register Client

OAuth2 클라이언트 어플리케이션의 로그인 기능 구현을 위한 사전 준비가 필요합니다. 
[LINE 개발자 사이트](https://developers.line.biz/en/)에 개발할 어플리케이션을 등록합니다. 
이 과정을 통해 클라이언트 ID, 클라이언트 SECRET 등을 발급 받고, 콜백 URL을 등록합니다. 

### 2.1. Line Developers Console

LINE 개발자 사이트에 가입 후 로그인합니다. 

* 우측 상단 콘솔 버튼을 누릅니다.

<p align="center">
    <img src="/images/oauth2-line-login-with-spring-security-4.JPG" width="100%" class="image__border">
</p>

### 2.2. Create Provider and Channel

프로바이더를 신규로 등록합니다. 

* 생성 버튼을 누릅니다.

<p align="center">
    <img src="/images/oauth2-line-login-with-spring-security-5.JPG" width="100%" class="image__border">
</p>

* `Create a Line Login channel` 버튼을 선택합니다. 

<p align="center">
    <img src="/images/oauth2-line-login-with-spring-security-6.JPG" width="100%" class="image__border">
</p>

* 채널 생성을 위해 필수 정보들을 입력합니다. 
    * 채널 타입은 `LINE Login`을 선택합니다.
    * 앱 타입에 `Web app`을 선택합니다.

<p align="center">
    <img src="/images/oauth2-line-login-with-spring-security-7.JPG" width="100%" class="image__border">
</p>

### 2.3. Get Client Info and Register Callback URL

채널에서 클라이언트 ID, 시크릿 정보를 확인하고, 콜백 URL을 등록합니다.

* 개발 편의를 위해 `developing` 버튼을 눌러 `published` 상태로 변경합니다.
* Basic settings Tab
    * `Channel ID` 항목이 클라이언트 ID입니다.
    * `Channel secrete` 항목이 클라이언트 시크릿입니다.

<p align="center">
    <img src="/images/oauth2-line-login-with-spring-security-8.JPG" width="100%" class="image__border">
</p>

<p align="center">
    <img src="/images/oauth2-line-login-with-spring-security-9.JPG" width="100%" class="image__border">
</p>

* LINE Login Tab
    * 콜백 URL을 등록합니다.
    * 라인을 구분하면 여러 개의 콜백 URL을 등록할 수 있습니다. 

<p align="center">
    <img src="/images/oauth2-line-login-with-spring-security-10.JPG" width="100%" class="image__border">
</p>

## 3. Practice

본격적으로 스프링 시큐리티를 사용해 LINE 로그인을 구현합니다.

### 3.1. build.gradle

* 스프링 시큐리티 관련 의존성을 추가합니다.
    * spring-boot-starter-security
    * spring-boot-starter-oauth2-client

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.1.4'
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
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

### 3.2. application.yml

* LINE 개발자 센터에 등록한 클라이언트 정보를 입력합니다.
    * LINE_CLIENT_ID
    * LINE_CLIENT_SECRET
    * 콜백 URL
* 기타 정보에 대한 설명은 가독성을 위해 주석으로 작성하였습니다.

```yml
spring:
  security:
    oauth2:
      client:
        registration:
          line:
            client-id: "${LINE_CLIENT_ID}"
            client-secret: "${LINE_CLIENT_SECRET}"
            authorization-grant-type: authorization_code
            redirect-uri: "{baseUrl}/oauth2/authorized/line"
            scope: "profile" # 사용자 정보에 대한 범위입니다. 아이디, 이름, 프로파일 이미지
        provider:
          line:
            authorization-uri: https://access.line.me/oauth2/v2.1/authorize # 인증, 인가 URL
            token-uri: https://api.line.me/oauth2/v2.1/token # 토큰 발급 URL
            user-info-uri: https://api.line.me/v2/profile # 사용자 정보 조회 URL
            user-name-attribute: userId # 전달 받은 사용자 정보에서 PK 역할을 수행하는 키
```

### 3.3. WebSecurityConfig Class

스프링 시큐리티의 시큐리티 필터 체인을 정의합니다. 
설명은 가독성을 위해 주석으로 작성하였습니다.

```java
package action.in.blog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity(debug = true) // 디버그 모드로 설정하여 로깅 only 개발 용도로 사용
public class WebSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.oauth2Login(
                configurer -> configurer
                        .defaultSuccessUrl("/home") // 로그인에 성공 시 /home 경로로 리다이렉트
                        .redirectionEndpoint(
                                config -> config.baseUri("/oauth2/authorized/line") // 라다이렉트 URL을 지정합
                        )
        ).authorizeHttpRequests(
                registry -> registry
                        .requestMatchers("/home") // /home 경로는 인증되지 않은 사용자가 접근하지 못하도록 지정
                        .authenticated()
        );
        return http.build();
    }
}
```

### 3.4. HomeController Class

스프링 시큐리티는 인증된 사용자 정보를 시큐리티 컨텍스트에 담아 SecurityContextHodler 클래스를 통해 운반합니다. 

* 컨트롤러에서 인증된 사용자 정보를 획득하기 위해 `@AuthenticationPrincipal` 애너테이션을 사용합니다. 
* home 페이지에 사용자 이름과 사진 URL 값을 전달합니다.

```java
package action.in.blog.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.OAuth2AuthenticatedPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class HomeController {

    @GetMapping("/home")
    public ModelAndView home(@AuthenticationPrincipal OAuth2AuthenticatedPrincipal principal) {
        var mav = new ModelAndView("home");
        mav.addObject("displayName", principal.getAttribute("displayName"));
        mav.addObject("pictureUrl", principal.getAttribute("pictureUrl"));
        return mav;
    }
}
```

## 4. Test

간단한 HTML 코드도 있지만, 글과 크게 연관성 있지 않으므로 다루지 않겠습니다. 
어플리케이션을 실행 후 동작 과정을 확인합니다. 
로그인 페이지와 로그아웃 페이지는 스프링 시큐리티에서 기본적으로 제공하는 기능을 사용합니다. 

<p align="center">
    <img src="/images/oauth2-line-login-with-spring-security-11.gif" width="100%" class="image__border">
</p>

## CLOSING

웹 기반 [OAuth2 표준][rfc6749-link]에 흐름에 대해 이해하고 있다면 SNS 로그인 인증 프로세스를 구현하는 것은 크게 어렵지 않습니다. 
OAuth2 프로토콜에서 클라이언트 어플리케이션을 구현하기 어렵게 느껴진다면 인증 표준에 참여하는 각 컴포넌트들의 역할과 웹 기반 인증 과정에서 개발자를 헷갈리게 만드는 브라우저 리다이렉트에 대한 개념을 잘 정리할 필요가 있습니다. 

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-10-07-oauth2-line-login-with-spring-security>

#### REFERENCE

* <https://www.rfc-editor.org/rfc/rfc6749>
* <https://developers.line.biz/en/docs/line-login/>
* <https://developers.line.biz/en/docs/line-login/integrate-line-login/#scopes>
* <https://developers.line.biz/en/reference/line-login/>

[spring-security-link]: https://junhyunny.github.io/spring-security/spring-security/
[redirect-and-forwarding-link]: https://junhyunny.github.io/information/redirect-and-forwarding/
[oauth-link]: https://junhyunny.github.io/information/security/oauth/

[rfc6749-link]: https://www.rfc-editor.org/rfc/rfc6749