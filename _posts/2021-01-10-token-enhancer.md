---
title: "Token Enhancer"
search: false
category: 
  - side project
  - security
  - spring security
last_modified_at: 2021-01-11T00:00:00
---

# Token Enhancer<br>

사이드 프로젝트를 진행할 때 정보를 URL에 노출시키지 않고 유저 정보를 가져올 수 있는 방법에 대해 고민을 많이 했습니다. 
@RequestBody에 유저 정보를 담는 방법도 있지만 클라이언트 유저 정보와 동시에 다른 유저 정보를 함께 전달해야되는 경우에는 처리가 곤란했습니다. 
이를 해결하기 위해 JWT 토큰에 추가적인 클라이언트 정보를 함께 전달하는 TokenEnhancer 인터페이스의 기능을 이용하기로 하였습니다. 

지난 [Spring Security 기반 JWT 인증 방식 예제][jwt-blogLink] 글에서 정리한 내용을 기반으로 기능을 확장하여 구현하였습니다. 
아래 설명되어 있지 않은 클래스나 파일들은 지난 글을 참조하시면 됩니다. 

## 패키지 구조
<p align="left"><img src="/images/token-enhancer-1.JPG"></p>

## Config 클래스 구현
지난 글에서 Config 클래스에 JwtAccessTokenConverter @Bean을 만들어줬지만 이를 제거하고 AuthorizationServer 클래스로 이동하였습니다. 
이유는 아래 AuthorizationServer 클래스 구현에서 확인하실 수 있습니다. 

```java
package blog.in.action.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class Config {

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}
```
## CustomTokenEnhancer 클래스 구현
AuthorizationServer 클래스의 내부 클래스로 구현하여 패키지 구조에는 보이지 않습니다. 
TokenEnhancer 인터페이스를 구현하였으며 enhance 메소드를 통해 토큰에 정보를 추가합니다. OAuth2Authentication 객체에서 principal에 대한 정보를 추출 후 OAuth2AccessToken 객체에 추가하였습니다. 
```java
  private class CustomTokenEnhancer implements TokenEnhancer {
    // Access Token에 추가하고 싶은 값을 함께 전달한다.
    @Override
    public OAuth2AccessToken enhance(OAuth2AccessToken accessToken, OAuth2Authentication authentication) {
      User user = (User) authentication.getPrincipal();
      Map<String, Object> additionalInfo = new HashMap<String, Object>();
      // token에 추가 정보 등록
      additionalInfo.put("memberId", user.getUsername());
      additionalInfo.put("otherInfomation", "otherInfomation");
      ((DefaultOAuth2AccessToken) accessToken).setAdditionalInformation(additionalInfo);
      return accessToken;
    }
  }
```

## AuthorizationServer 클래스 구현
AuthorizationServer 클래스을 통해 CustomTokenEnhancer, JwtAccessTokenConverter를 등록합니다. 
CustomTokenEnhancer, JwtAccessTokenConverter 모두 TokenEnhancer를 상속받았기 때문에 둘 모드를 @Bean으로 등록하는 경우 충돌이 발생합니다. 
@Bean 충돌을 방지하기 위해 생성자를 통해 객체들을 만들었으며 TokenEnhancerChain에 두 tokenEnhancer 객체를 모두 추가해줬습니다. 

```java
package blog.in.action.security;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.common.DefaultOAuth2AccessToken;
import org.springframework.security.oauth2.common.OAuth2AccessToken;
import org.springframework.security.oauth2.config.annotation.configurers.ClientDetailsServiceConfigurer;
import org.springframework.security.oauth2.config.annotation.web.configuration.AuthorizationServerConfigurerAdapter;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableAuthorizationServer;
import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerEndpointsConfigurer;
import org.springframework.security.oauth2.provider.OAuth2Authentication;
import org.springframework.security.oauth2.provider.token.TokenEnhancer;
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
  private AuthenticationManager authenticationManager;

  private class CustomTokenEnhancer implements TokenEnhancer {
    // Access Token에 추가하고 싶은 값을 함께 전달한다.
    @Override
    public OAuth2AccessToken enhance(OAuth2AccessToken accessToken, OAuth2Authentication authentication) {
      User user = (User) authentication.getPrincipal();
      Map<String, Object> additionalInfo = new HashMap<String, Object>();
      // token에 추가 정보 등록
      additionalInfo.put("memberId", user.getUsername());
      additionalInfo.put("otherInfomation", "otherInfomation");
      ((DefaultOAuth2AccessToken) accessToken).setAdditionalInformation(additionalInfo);
      return accessToken;
    }
  }

  private CustomTokenEnhancer customTokenEnhancer() {
    return new CustomTokenEnhancer();
  }

  private JwtAccessTokenConverter jwtAccessTokenConverter() {
    JwtAccessTokenConverter converter = new JwtAccessTokenConverter();
    converter.setSigningKey("JWT_KEY");
    return converter;
  }

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
    // tokenEnhancerChain에 tokenEnhancer들 등록
    tokenEnhancerChain.setTokenEnhancers(Arrays.asList(customTokenEnhancer(), jwtAccessTokenConverter())); // JWT Converter 등록
    endpoints.userDetailsService(memberService)// UserDetailsService 등록
        .authenticationManager(authenticationManager)//
        .tokenEnhancer(tokenEnhancerChain);
  }

}
```

## 테스트 결과
- 유저 정보 등록 (ADMIN)
<p align="left"><img src="/images/token-enhancer-2.JPG"></p>

- 인증 정보 획득
<p align="left"><img src="/images/token-enhancer-3.JPG"></p>

- <https://jwt.io/> 사이트에서 생성한 Token Decoding 
<p align="center"><img src="/images/token-enhancer-4.JPG"></p>

## OPINION
이 글에선 TokenEnhancer를 커스터마이즈한 기능을 통해 token에 필요한 내용을 추가하는 것으로 마무리하였습니다. 
다음 글에선 token에 추가된 정보를 커스터마이즈한 애너테이션을 통해 쉽게 추출하는 방법에 대해서 정리해보겠습니다.
해당 코드를 받아보시려면 [github link][blog-githubLink]로 이동하시길 바랍니다.

#### 참조글
- [Spring Security 기반 JWT 인증 방식 예제][jwt-blogLink]

[jwt-blogLink]: https://junhyunny.github.io/side%20project/security/spring%20security/spring-security-example/
[blog-githubLink]: https://github.com/Junhyunny/action-in-blog/tree/54a9e2977b7067a42c214e44999e106de9d2b3bd