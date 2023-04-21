---
title: "TokenEnhancer Interface"
search: false
category:
  - spring-boot
  - spring-security
last_modified_at: 2021-08-21T17:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [JWT(Json Web Token)][json-web-token-link]
* [Spring Security][spring-security-link]
* [Spring Security JWT OAuth Example][spring-security-example-link]

## 1. TokenEnhancer Interface

Spring Security 프레임워크의 `TokenEnhancer` 인터페이스를 구현한 클래스를 사용하면 토큰의 모습을 변경할 수 있습니다. 
[Spring Security JWT OAuth Example][spring-security-example-link] 포스트에서 사용한 `JwtAccessTokenConverter` 클래스 또한 `TokenEnhancer` 인터페이스를 구현하고 있습니다. 

```java
public class JwtAccessTokenConverter implements TokenEnhancer, AccessTokenConverter, InitializingBean {

    public static final String TOKEN_ID = "jti";
    public static final String ACCESS_TOKEN_ID = "ati";
    private static final Log logger = LogFactory.getLog(JwtAccessTokenConverter.class);
    private AccessTokenConverter tokenConverter = new DefaultAccessTokenConverter();
    private JwtClaimsSetVerifier jwtClaimsSetVerifier = new NoOpJwtClaimsSetVerifier();
    private JsonParser objectMapper = JsonParserFactory.create();
    private String verifierKey = (new RandomValueStringGenerator()).generate();
    private Signer signer;
    private String signingKey;
    private SignatureVerifier verifier;

    public JwtAccessTokenConverter() {
        this.signer = new MacSigner(this.verifierKey);
        this.signingKey = this.verifierKey;
    }

    // ...
}
```

## 2. TokenEnhancer 인스턴스 호출 시점

인증 서버에서 토큰을 변경하는 시점은 다음과 같습니다. 

* 사용자가 인증 서버의 `/oauth/token` 경로로 토큰을 요청합니다.
* 프레임워크에서 제공하는 필터 체인을 통과합니다.
* 프레임워크에서 제공하는 `TokenEndPoint` 클래스에서 사용자 요청을 전달받습니다.
* 내부 인증 로직 수행 중 `CompositeTokenGenerator` 클래스에서 토큰을 생성합니다.
* `TokenEnhancerChain` 클래스에서 등록된 토큰 강화기를 하나씩 수행합니다.
* 개발자가 구현한 커스텀 토큰 강화기가 호출됩니다.

<p align="center">
    <img src="/images/token-enhancer-1.JPG" width="100%" class="image__border">
</p>

## 3. 인증 서버

이번 포스트의 인증 서버는 [Spring Security JWT OAuth Example][spring-security-example-link]에서 사용한 서비스를 일부 변경하였습니다. 
서비스의 구체적인 구조나 코드에 관련된 설명은 해당 포스트를 통해 확인하시길 바랍니다.

### 3.1. CustomTokenEnhancer 클래스

* `TokenEnhancer` 인터페이스의 `enhance` 메소드를 재구현합니다. 
* 기존 토큰에 담긴 정보를 유지하면서 새로운 정보를 추가합니다. 
    * OAuth2Authentication 객체에서 추출한 리스소 오너(resource owner)의 이름
    * 별도 추가적인 정보

```java
package blog.in.action.security;

import org.springframework.security.oauth2.common.OAuth2AccessToken;
import org.springframework.security.oauth2.provider.OAuth2Authentication;
import org.springframework.security.oauth2.provider.token.TokenEnhancer;
import org.springframework.stereotype.Component;

@Component
public class CustomTokenEnhancer implements TokenEnhancer {

    @Override
    public OAuth2AccessToken enhance(OAuth2AccessToken oAuth2AccessToken, OAuth2Authentication oAuth2Authentication) {
        User user = (User) oAuth2Authentication.getPrincipal();
        Map<String, Object> additionalInfo = new LinkedHashMap<>(oAuth2AccessToken.getAdditionalInformation());
        additionalInfo.put("MEMBER_ID", user.getUsername());
        additionalInfo.put("SERVICE-SECRET-KEY", "JUNHYUNNY AUTH SERVICE");
        ((DefaultOAuth2AccessToken) oAuth2AccessToken).setAdditionalInformation(additionalInfo);
        return oAuth2AccessToken;
    }
}
```

### 3.2. AuthorizationServer 클래스

새로 만든 커스텀 토큰 강화기를 인증 서버의 `TokenEnhancerChain` 인스턴스에 등록합니다.

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

    private final CustomTokenEnhancer customTokenEnhancer;

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
        // 커스텀 토큰 강화기, JSON WEB TOKEN 을 사용하기 위한 컨버터 등록
        tokenEnhancerChain.setTokenEnhancers(Arrays.asList(customTokenEnhancer, jwtAccessTokenConverter));
        endpoints
                // Spring Security 프레임워크에서 사용하는 AuthenticationManager 등록
                .authenticationManager(authenticationManager)
                // 토큰 강화를 위한 TokenEnhancer 등록
                .tokenEnhancer(tokenEnhancerChain);
    }
}
```

## 4. 테스트 

[Spring Security JWT OAuth Example][spring-security-example-link] 포스트와 마찬가지로 cURL 커맨드를 사용하여 테스트를 수행하였습니다. 

##### 토큰 정보 요청과 처리 결과

* 토큰 강화기에서 추가한 정보가 결과에서 확인됩니다.

```
$ curl -X POST http://localhost:8080/oauth/token\
   -H "Content-Type: application/x-www-form-urlencoded"\
   -u 'CLIENT_ID:CLIENT_SECRET'\
   -d "username=Junhyunny&password=123&grant_type=password" | jq .

  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  1074    0  1023  100    51   6322    315 --:--:-- --:--:-- --:--:--  7019
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJKdW5oeXVubnkiLCJzY29wZSI6WyJyZWFkIl0sIk1FTUJFUl9JRCI6Ikp1bmh5dW5ueSIsImV4cCI6MTY2MTIwNTE5MCwiYXV0aG9yaXRpZXMiOlsiQURNSU4iXSwianRpIjoiZmYxMGIwZjktZWVjMi00YzM4LWFhMWMtNDE3MGQ4YjBhODk0IiwiY2xpZW50X2lkIjoiQ0xJRU5UX0lEIiwiU0VSVklDRS1TRUNSRVQtS0VZIjoiSlVOSFlVTk5ZIEFVVEggU0VSVklDRSJ9.1A0ymrGZk8Pvho4lqGkvUaX6713tvRLFhEaUQXr_SkY",
  "token_type": "bearer",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJKdW5oeXVubnkiLCJzY29wZSI6WyJyZWFkIl0sImF0aSI6ImZmMTBiMGY5LWVlYzItNGMzOC1hYTFjLTQxNzBkOGIwYTg5NCIsIk1FTUJFUl9JRCI6Ikp1bmh5dW5ueSIsImV4cCI6MTY2MTI3NzE5MCwiYXV0aG9yaXRpZXMiOlsiQURNSU4iXSwianRpIjoiYmMyYWM5ZTQtYjQ2MC00OTFmLWI4MDYtNTE4YzVlZTE3MTg4IiwiY2xpZW50X2lkIjoiQ0xJRU5UX0lEIiwiU0VSVklDRS1TRUNSRVQtS0VZIjoiSlVOSFlVTk5ZIEFVVEggU0VSVklDRSJ9.9o2pXUUkP1eqkcMLrSWNONnvZ7-baWWpi-TUgDfxRQg",
  "expires_in": 14069,
  "scope": "read",
  "MEMBER_ID": "Junhyunny",
  "SERVICE-SECRET-KEY": "JUNHYUNNY AUTH SERVICE",
  "jti": "ff10b0f9-eec2-4c38-aa1c-4170d8b0a894"
}
```

##### Decoded Json Web Token

`JwtAccessTokenConverter` 클래스에서 토큰을 변경할 때 `OAuth2AccessToken` 인스턴스에 담긴 정보를 모두 포함하여 인코딩을 수행하기 때문에 JWT 토큰 값을 디코딩하면 별도로 추가한 정보들도 함께 확인할 수 있습니다. 

<p align="center">
    <img src="/images/token-enhancer-2.JPG" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-01-10-token-enhancer>

[json-web-token-link]: https://junhyunny.github.io/information/json-web-token/
[spring-security-link]: https://junhyunny.github.io/spring-security/spring-security/
[spring-security-example-link]: https://junhyunny.github.io/spring-boot/spring-security/spring-security-example/