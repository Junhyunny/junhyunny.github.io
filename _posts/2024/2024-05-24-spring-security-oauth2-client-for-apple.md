---
title: "Spring Security Oauth2 Client for Apple"
search: false
category:
  - spring-boot
  - spring-security
last_modified_at: 2024-05-24T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [OAuth(Open Authorization)][oauth-link]
- [OpenID Connect][open-id-connect-link]
- [Multiple SNS Login with Spring Security OAuth2 Client][multiple-sns-login-with-spring-security-oauth2-client-link]

## 0. 들어가면서

다른 팀에서 애플(Apple) OAuth2 로그인이 잘 동작하지 않는다는 문의가 들어 왔다. 아무래도 필자가 스프링 시큐리티(spring security)로 책을 집필 중이기도 하고 구현 경험이 많기 때문에 도움 요청이 온 것 같다. 이번 글에선 애플 OAuth2 인증에 필요한 추가 작업들에 대한 내용을 정리했다. 

## 1. Problem Context

문제 현상을 살펴보자. 웹 환경에서 OAuth2 인증은 리다이렉트(redirect)의 연속이다. 애플 로그인 화면에서 인증 성공 후 애플 인가 서버에서 개발 서버로 브라우저를 다시 리다이렉트 시키는 시점에 문제가 발생한다. 문제가 발생하는 두번째 리다이렉트 시점에 다음과 같은 정보들이 서버 콜백 URL로 전달되고 403 에러 응답을 받는다.

- POST 메소드 요청을 보낸다.
- 컨텐츠 타입(content type)은 application/x-www-form-urlencoded 이다.
- 요청 메세지에는 다음과 같은 정보가 담겨 있다.
  - state 
    - 상태 코드로 별도로 사용되지 않는다.
  - code 
    - 인가 코드로 액세스 토큰 혹은 ID 토큰을 받을 때 사용한다.
  - user 
    - 사용자 정보로 이름, 성, 이메일 정보 등이 들어 있다.
- 리다이렉트 된 요청은 403(forbidden) 응답을 받는다.

<div align="center">
  <img src="/images/posts/2024/spring-security-oauth2-client-for-apple-01.png" width="100%" class="image__border">
</div>

### 1.1. Phenomenon

스프링 시큐리티 내부에서 발생하는 에러에 대한 로그가 빈약하기 때문에 원인을 찾기 힘들다. 로컬 환경에서 디버깅이 필요한데, 애플은 보안을 이유로 콜백(callback) URL(혹은 리다이렉트 URL)에 `로컬 호스트(localhost)`를 지원하지 않는다. 이런 문제 때문에 로컬 환경에서 테스트가 힘들지만, 방법이 없진 않다. 디버깅 방법은 이 글의 주제를 벗어나므로 다른 글에서 소개하겠다.

로컬 호스트에서 디버깅을 해보면 인증 제공자(AuthenticationProvider) 인스턴스가 애플 인가 서버에서 액세스 토큰(혹은 아이디 토큰)를 받을 때 다음과 같은 에러가 발생하고 있었다.
 
```
[invalid_client]
```

<div align="center">
  <img src="/images/posts/2024/spring-security-oauth2-client-for-apple-02.png" width="100%" class="image__border">
</div>

### 1.2. What is the problem?

무엇이 문제일까? 공식 문서와 깃허브 이슈들을 살펴 보고 힌트를 얻을 수 있었다. 리다이렉트 요청을 받아 처리할 때 애플 인가 서버로 액세스 토큰(혹은 아이디 토큰)를 발급 받는다. 이 때 애플 개발자 센터에서 사전에 발급 받은 클라이언트 시크릿을 사용하면 에러가 발생한다. 새로운 클라이언트 시크릿(client secret)을 만들어야 한다. 

- 왼쪽 실패 케이스
  1. 사전에 발급 받은 클라이언트 시크릿을 사용해서 액세스 토큰을 요청한다.
  2. [invalid_client] 에러 응답을 받는다.
- 오른쪽 성공 케이스
  1. 새로 만든 클라이언트 시크릿을 사용해 액세스 토큰을 요청한다.
  2. 액세스 토큰을 받는다.

<div align="center">
  <img src="/images/posts/2024/spring-security-oauth2-client-for-apple-03.png" width="100%" class="image__border">
</div>

<br/>

[공식 문서](https://developer.apple.com/documentation/accountorganizationaldatasharing/creating-a-client-secret)를 살펴보면 클라이언트 시크릿을 만드는 방법을 찾을 수 있었다. 헤더는 다음과 같은 정보를 포함하여 만든다.

- alg
  - ES256 해시 알고리즘을 사용한다.
- kid 
  - 애플 개발자 센터에 등록할 때 발급 받은 10자리 KeyID를 사용한다.

```json
{
    "alg": "ES256",
    "kid": "ABC123DEFG"
}
```

페이로드(payload)에는 다음과 같은 정보가 담긴다.

- iss
  - 애플 개발자 센터에 등록할 때 발급 받은 10자리 TeamID를 사용한다.
- iat
  - 토큰 발급 시간으로 초(seconds) 단위의 정수형 타임스탬프를 사용한다.
- exp
  - 토큰 만료 시간으로 초 단위의 정수형 타임스탬프를 사용한다.
- aud
  - `https://appleid.apple.com` 값을 사용한다.
- sub
  - 애플 개발자 센터 등록할 때 발급 받은 AppID 혹은 ServicesID를 사용한다. 
  - 클라이언트 아이디와 동일하다.

```json
{
    "iss": "DEF123GHIJ",
    "iat": 1437179036,
    "exp": 1493298100,
    "aud": "https://appleid.apple.com",
    "sub": "com.mytest.app"
}
```

마지막으로 JWT 토큰 서명(signature)을 만들 때 `AuthKey_XXXXXXXXXX.p8` 포맷의 비공개 키 파일을 사용한다. 애플 개발자 센터에서 해당 파일을 발급 받는다. 헤더, 페이로드, 서명까지 모두 Base64 인코딩하면 새로운 클라이언트 시크릿이 만들어진다.

<div align="center">
  <img src="/images/posts/2024/spring-security-oauth2-client-for-apple-04.png" width="80%" class="image__border">
</div>

## 2. Solve the problem

액세스 토큰을 발급 받지 못한 문제 원인은 파악했지만, 또 다른 문제가 남았다. 

- 일단 필자가 진행하고 있는 프로젝트가 아니기 때문에 프로젝트에 대한 이해도가 낮았다.
- 애플 이 외에 다른 플랫폼들의 OAuth2 인증 프로세스를 사용 중이었다.
- 필자도 진행 중인 프로젝트가 있었기 때문에 인증 프로세스를 다시 재정비 할 시간이 부족했다.

기존 기능에 영향을 주지 않으면서, 새로운 기능을 확장할 수 있는 지점을 찾아야 했다. 아무리 테스트 코드가 있더라도 영향도 파악이 되지 않기 때문에 기존 코드를 고치는 것은 최대한 피하고 싶었다. OAuth2 인증 프로세스에 참여하는 컴포넌트들을 훑어보다 기능을 확장하기 가장 적합한 컴포넌트를 발견했다. 

- 다음과 같은 두 인증 매니저가 OAuth2 인증 프로세스에 참여한다. 스코프(scope)에 `oidc` 값이 있는지 여부에 따라 인가 매니저가 결정된다. 
  - OAuth2AuthorizationCodeAuthenticationProvider 클래스
  - OidcAuthorizationCodeAuthenticationProvider 클래스
- 두 인증 매니저는 모두 OAuth2AccessTokenResponseClient 인스턴스에 의존해 액세스 토큰(혹은 아이디 토큰)을 획득한다.
  - 애플 인가 서버로 HTTP 요청으로 권한 부여(authorization grant)를 요청한다.
  - 요청 정보가 정상적인 경우 액세스 토큰(access token)을 응답 받는다.

<div align="center">
  <img src="/images/posts/2024/spring-security-oauth2-client-for-apple-05.png" width="100%" class="image__border">
</div>

<br/>

여기서 OAuth2AccessTokenResponseClient 인스턴스가 의존하는 OAuth2AuthorizationCodeGrantRequestEntityConverter 클래스를 확장했다. 클라이언트 인스턴스는 해당 컨버터(converter) 객체에게 권한 부여 요청에 필요한 파라미터 생성을 요구한다. 필자는 이 파라미터 생성하는 createParameters 메소드를 확장했다.

- 애플 인가 서버로 보내는 요청인 경우
  - AppleSecreteGenerator 객체로 새로운 클라이언트 시크릿을 생성한다.
  - 부모 클래스의 createParameters 메소드로 만든 요청 파라미터 중 클라이언트 시크릿을 새로운 만든 시크릿으로 변경한다.
- 애플 외 다른 인가 서버로 보내는 요청인 경우 
  - 부모 클래스의 createParameters 메소드로 만든 요청 파라미터를 반환한다.

<div align="center">
  <img src="/images/posts/2024/spring-security-oauth2-client-for-apple-06.png" width="100%" class="image__border">
</div>

### 2.1. application.yml

새로운 시크릿을 만들기 위해 application.yml 파일에 다음과 같은 정보를 추가한다.

- Apple Key ID
- Apple Team ID

```yml
spring:
  security:
    oauth2:
      client:
        registration:
          apple:
            client-id: ${APPLE_CLIENT_ID}
            client-secret: ${APPLE_CLIENT_SECRET}
            authorization-grant-type: "authorization_code"
            redirect-uri: ${APPLE_REDIRECT_URL}
            scope:
              - openid
              - email
              - name
            client-name: "Apple"
            client-authentication-method: "client_secret_post"
        provider:
          apple:
            authorizationUri: "https://appleid.apple.com/auth/authorize?response_mode=form_post"
            tokenUri: "https://appleid.apple.com/auth/token"
            jwkSetUri: "https://appleid.apple.com/auth/keys"
            user-name-attribute: "sub"
# 새로운 클라이언트 시크릿 생성에 필요한 정보
apple:
  key-id: ${APPLE_KEY_ID}
  team-id: ${APPLE_TEAM_ID}
```

### 2.2. build.gradle

새로운 시크릿을 만들 때 비공개 키를 읽고, JWT을 만드는 작업이 필요하기 때문에 다음과 같은 의존성이 추가적으로 필요하다.

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-oauth2-client'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'

    // 추가된 의존성들
    implementation 'io.jsonwebtoken:jjwt-api:0.12.3'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.5'
    implementation 'org.bouncycastle:bcpkix-jdk15on:1.70'
}
```

### 2.2. Extend RequestEntityConverter

위에서 설명 했듯이 OAuth2AuthorizationCodeGrantRequestEntityConverter 클래스를 확장한다. 해당 로직에서 확인하는 클라이언트 아이디는 `application.yml` 파일에서 `spring.security.oauth2.client.registration` 속성에 등록된 아이디와 매칭되어야 한다.

1. 클라이언트 아이디가 `apple`인 경우 다음과 같은 작업을 진행한다.
  - 새로운 클라이언트 시크릿을 만든다.
  - 부모 클래스의 createParameters 메소드를 사용해 요청 파라미터를 생성한다.
  - 클라이언트 시크릿을 새로운 시크릿으로 교체한다.
  - 요청 파라미터를 반환한다. 
2. 클라이언트 아이디가 `apple`이 아닌 경우 부모 클래스의 createParameters 메소드 결과를 그대로 반환한다.

```java
package action.in.blog.component;

import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequest;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequestEntityConverter;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;

import java.util.List;

@Component
public class AppleOAuth2AuthorizationCodeGrantRequestEntityConverter extends OAuth2AuthorizationCodeGrantRequestEntityConverter {

    private static final String APPLE_REGISTRATION_ID = "apple";
    private static final String CLIENT_SECRET_KEY = "client_secret";

    private final AppleSecreteGenerator appleSecreteGenerator;

    public AppleOAuth2AuthorizationCodeGrantRequestEntityConverter(
            AppleSecreteGenerator appleSecreteGenerator
    ) {
        this.appleSecreteGenerator = appleSecreteGenerator;
    }

    @Override
    protected MultiValueMap<String, String> createParameters(
            OAuth2AuthorizationCodeGrantRequest authorizationCodeGrantRequest
    ) {
        var clientRegistrationId = authorizationCodeGrantRequest.getClientRegistration().getRegistrationId();
        if (APPLE_REGISTRATION_ID.equalsIgnoreCase(clientRegistrationId)) { // 1
            var encryptedPrivateKey = appleSecreteGenerator.createClientSecret();
            var parameter = super.createParameters(authorizationCodeGrantRequest);
            parameter.put(CLIENT_SECRET_KEY, List.of(encryptedPrivateKey));
            return parameter;
        }
        return super.createParameters(authorizationCodeGrantRequest); // 2
    }
}
```

### 2.3. Apple's Secret Key Generator

새로운 클라이언트 시크릿으로 사용할 JWT 객체를 생성한다. 여기서 application.yml 파일에 새롭게 추가한 정보들과 비공개 키가 사용된다. 해당 예제에선 비공개 키가 클래스 패스(class path)의 static 폴더 내부에 존재하지만, 실제 프로젝트라면 보안 문제가 발생할 수 있으니 프로젝트 경로에서 관리하지 않길 바란다. CI/CD 파이프라인에서 추가하거나 클라우드 프로바이더(cloud provider)가 제공하는 컴포넌트를 통해 환경 변수로 주입하여 사용하길 바란다.

1. 비공개 키를 읽는다.
2. 비공개 키 데이터를 바탕으로 PrivateKey 인스턴스를 생성한다.
3. JWT 헤더를 설정한다. 
  - 애플 공식 홈페이지 설명을 따른다.
4. JWT 페이로드를 설정한다. 
  - 애플 공식 홈페이지 설명을 따른다.
  - 서명에 필요한 PrivateKey 인스턴스를 설정한다. 
5. JWT를 생성 후 반환한다.

```java
package action.in.blog.component;

import io.jsonwebtoken.Jwts;
import org.bouncycastle.asn1.pkcs.PrivateKeyInfo;
import org.bouncycastle.openssl.PEMParser;
import org.bouncycastle.openssl.jcajce.JcaPEMKeyConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Component
public class AppleSecreteGenerator {

    private static final int SECOND = 1000;
    private static final int MINUTE = 60 * SECOND;

    private static final String AUDIENCE = "https://appleid.apple.com";
    private static final String ALGORITHM = "ES256";

    private final String keyId;
    private final String teamId;
    private final String clientId;

    public AppleSecreteGenerator(
            @Value("${apple.key-id}") String keyId,
            @Value("${apple.team-id}") String teamId,
            @Value("${spring.security.oauth2.client.registration.apple.client-id}") String clientId
    ) {
        this.keyId = keyId;
        this.teamId = teamId;
        this.clientId = clientId;
    }

    private Map<String, Object> tokenHeader() {
        return Map.of(
                "alg", ALGORITHM,
                "kid", keyId
        );
    }

    public String createClientSecret() {
        var resource = new ClassPathResource("static/private_key.p8"); // 1
        try (
                InputStream inputStream = resource.getInputStream();
                StringReader reader = new StringReader(new String(inputStream.readAllBytes(), StandardCharsets.UTF_8))
        ) {
            var pemParser = new PEMParser(reader); // 2
            var pemObject = pemParser.readObject();
            var converter = new JcaPEMKeyConverter();
            var privateKey = converter.getPrivateKey(
                    PrivateKeyInfo.getInstance(pemObject)
            );
            var now = System.currentTimeMillis();
            var builder = Jwts.builder();
            builder.header().add(tokenHeader()) // 3
                    .and();
            builder.signWith(privateKey) // 4
                    .issuer(teamId)
                    .issuedAt(new Date(now))
                    .expiration(new Date(now + 10 * MINUTE))
                    .subject(clientId)
                    .audience().add(AUDIENCE)
                    .and();
            return builder.compact(); // 5
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
```

### 2.4. Register Spring Beans

위에서 만든 AppleOAuth2AuthorizationCodeGrantRequestEntityConverter 객체를 인증 매니저에게 주입한다. 위에서 설명했듯 OAuth2 스코프에 따라 다른 인증 매니저를 사용한다. 이 예제는 `oidc` 스코프를 사용하기 때문에 OidcAuthorizationCodeAuthenticationProvider 객체를 스프링 빈(spring bean)으로 등록한다. 

```java
package action.in.blog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.oauth2.client.endpoint.DefaultAuthorizationCodeTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2AccessTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequest;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequestEntityConverter;
import org.springframework.security.oauth2.client.oidc.authentication.OidcAuthorizationCodeAuthenticationProvider;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.web.SecurityFilterChain;

@EnableWebSecurity
@Configuration
public class SecurityConfig {

    @Bean
    public OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> accessTokenResponseClient(
            OAuth2AuthorizationCodeGrantRequestEntityConverter oAuth2AuthorizationCodeGrantRequestEntityConverter
    ) {
        var client = new DefaultAuthorizationCodeTokenResponseClient();
        client.setRequestEntityConverter(oAuth2AuthorizationCodeGrantRequestEntityConverter);
        return client;
    }

    @Bean
    public OidcAuthorizationCodeAuthenticationProvider auth2AuthorizationCodeAuthenticationProvider(
            OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> accessTokenResponseClient
    ) {
        return new OidcAuthorizationCodeAuthenticationProvider(accessTokenResponseClient, new OidcUserService());
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity
                .authorizeHttpRequests(
                        configurer -> configurer.anyRequest().authenticated()
                )
                .oauth2Login(
                        configurer -> configurer.defaultSuccessUrl("/main")
                )
                .csrf(AbstractHttpConfigurer::disable);
        return httpSecurity.build();
    }
}
```

## 3. Verification

새로 만든 시크릿을 사용했을 때 정상적으로 토큰을 획득하는지 살펴보자. 위에서도 언급했듯이 로컬에서 테스트하는 방법은 다른 글로 소개할 예정이다. 간단하게 설명하면 리다이렉트 요청을 cURL 명령어로 재현하는 것이다. 리다이렉트 요청을 cURL 명령어로 재현할 때 로컬 호스트 서버로 요청을 보낸다. 해당 요청을 처리할 때 애플 인가 서버로부터 아이디 토큰을 잘 발급 받는지 확인했다.

- 정상적으로 액세스 토큰, 리프레시 토큰, 아이디 토큰을 발급 받는다.

<div align="center">
  <img src="/images/posts/2024/spring-security-oauth2-client-for-apple-07.png" width="100%" class="image__border">
</div>

## CLOSING

이 외에도 몇 가지 문제들이 있었다. 관련된 내용들은 추가적으로 정리할 예정이다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-05-24-spring-security-oauth2-client-for-apple>

#### REFERENCE

- <https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens>
- <https://developer.apple.com/documentation/accountorganizationaldatasharing/creating-a-client-secret>
- <https://gist.github.com/patrickbussmann/877008231ef082cc5dc4ee5ca661a641>
- <https://github.com/SWM-YouQuiz/Authentication-Service/blob/dev/build.gradle.kts>
- <https://github.com/SWM-YouQuiz/Authentication-Service/blob/847932c2047e8111a289f43e018550f5c6aef22d/src/main/kotlin/com/quizit/authentication/global/oauth/AppleOAuth2Provider.kt>

[oauth-link]: https://junhyunny.github.io/information/security/oauth/
[open-id-connect-link]: https://junhyunny.github.io/information/security/open-id-connect/
[multiple-sns-login-with-spring-security-oauth2-client-link]: https://junhyunny.github.io/java/design-pattern/spring-boot/multiple-sns-login-with-spring-security-oauth2-client/
