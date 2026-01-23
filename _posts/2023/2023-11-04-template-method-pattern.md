---
title: "Template Method Pattern"
search: false
category:
  - java
  - design-pattern
last_modified_at: 2023-11-04T23:55:00
---

<br/>

## 1. Template Method Pattern

> 객체의 연산에는 알고리즘의 뼈대만을 정의하고 각 단계에서 수행할 구체적 처리는 서브 클래스 쪽으로 미룹니다. 알고리즘의 구조 자체는 그대로 놔둔 채 알고리즘 각 단계 처리를 서브 클래스에서 재정의할 수 있게 합니다.

코드 재사용을 위한 디자인 패턴입니다. 부모 클래스의 메서드에 실행 흐름을 제어하는 코드를 정의합니다. 실행 흐름을 제어하는 코드는 비즈니스 로직의 골격 역할을 수행합니다. 부모 클래스는 공통 알고리즘을 일련의 단계들로 나누고 이를 메서드로 정의합니다. 각 단계들은 비즈니스에 따라 실제 구현 방법이 다를 수 있으므로 자식 클래스들은 이를 재정의합니다. 

간단하게 여러 문서로부터 데이터를 추출하는 애플리케이션을 예로 들어보겠습니다. `.doc`, `.csv`, `.pdf` 확장자를 가진 파일들로부터 데이터를 추출합니다. 데이터를 추출하는 일련의 작업은 동일합니다. 

1. 파일 열기
1. 로우 데이터 추출하기
1. 데이터 정제하기
1. 데이터 분석하기
1. 리포트 전송
1. 파일 닫기

큰 실행 흐름은 어떤 문서를 분석하더라도 변경이 없습니다. 파일을 열고 닫는 작업, 파일로부터 로우 데이터를 추출하는 방법, 로우 데이터로부터 데이터 분석을 위한 정보를 정리하는 작업은 각 문서 종류마다 다를 수 있습니다. 이런 이유로 서로 다른 확장자 파일들을 다룰 수 있는 별도 클래스가 필요합니다.  

- 알고리즘은 DataMiner 추상 클래스의 mine 메서드에 정의되어 있습니다.
- openFile, extractData, parseData, closeFile 메서드들은 추상 메서드로써 각 구현 클래스가 반드시 재정의(override)해야하는 책임을 가집니다.

<p align="center">
    <img src="/images/template-method-pattern-01.png" width="80%" class="image__border image__padding">
</p>

### 1.1. Pros and Cons

다음과 같은 장점을 가집니다. 

- 부모 클래스에 공통적으로 사용하는 코드를 정의하므로 중복 코드를 줄일 수 있습니다.
- 자식 클래스들은 특정 부분만 오버라이드하기 때문에 뼈대 알고리즘을 변경하는 것이 용이합니다. 

다음과 같은 단점을 가집니다. 

- 일부 자식 클래스들의 기능 확장에 제한적입니다. 비즈니스 변화에 유연하게 대응하는게 어려울 수 있습니다. 
- 기능 확장을 위해 추상화 레이어가 늘린다면 코드 복잡도가 높아집니다. 

### 1.2. Considerations

템플릿 메서드 패턴에서 자식 클래스들이 재정의할 수 있는 메서드 종류는 두 가지입니다. 

- 추상 메서드(abstract method)
    - 모든 자식 클래스들이 반드시 재정의해야하는 메서드입니다.
- 훅 연산(hook operation)
    - 추상 메서드는 아니지만, 구현 코드가 존재하지 않는 메서드로 선택적으로 구현합니다. 

개발자는 어떤 연산이 훅 연산인지 추상 연산인지 확인해야 합니다. Java에선 추상 메서드를 재구현하지 않으면 컴파일 에러가 발생하기 때문에 반드시 재구현해야하므로 이를 파악하는데 문제가 없습니다. 훅 연산들은 굳이 재구현하지 않아도 되므로 개발자가 직접 판단해야 합니다. 이때 어떤 훅 연산들을 추가적으로 재정의하면 비즈니스 기능을 확장할 수 있는지 파악하는 것이 좋습니다. 

## 2. Usage Case

프레임워크를 사용하면 프레임워크에서 제공하는 인터페이스나 추상 클래스를 상속 받아 작성하는 경우가 많습니다. 큰 실행 흐름은 프레임워크가 정의하고 필요한 기능만 개발자가 구현합니다. 자주 사용하는 스프링 프레임워크에서 템플릿 메서드 패턴을 사용하는 예제를 찾아봤습니다. 

스프링 시큐리티(spring security) 프레임워크의 인증 프로세스에는 AbstractAuthenticationProcessingFilter 클래스가 존재합니다. 일련의 인증 과정을 부모 클래스에서 정의하고 있습니다. 

1. 인증이 필요한지 확인
1. 인증 시도
1. 세션 핸들링
1. 인증 성공 후처리
1. 인증 실패인 경우 후처리

프레임워크에서 인증하는 일련의 과정은 동일하지만, 인증 구현 방법은 어떤 메커니즘을 사용하느냐에 따라 다릅니다. 예를 들면 아이디와 비밀번호를 사용하는 인증 방법과 OAuth2 프로토콜을 따르는 인증 방법은 서로 다릅니다. 그렇기 때문에 구체적인 인증 작업은 자식 클래스들이 직접 정의합니다.  

<p align="center">
    <img src="/images/template-method-pattern-02.png" width="100%" class="image__border">
</p>

### 2.1. AbstractAuthenticationProcessingFilter Class

doFilter 메서드에서 인증 작업에 대한 큰 알고리즘을 정의합니다. 

```java
public abstract class AbstractAuthenticationProcessingFilter extends GenericFilterBean implements ApplicationEventPublisherAware, MessageSourceAware {

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        this.doFilter((HttpServletRequest)request, (HttpServletResponse)response, chain);
    }

    private void doFilter(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws IOException, ServletException {
        if (!this.requiresAuthentication(request, response)) {
            chain.doFilter(request, response);
        } else {
            try {
                Authentication authenticationResult = this.attemptAuthentication(request, response);
                if (authenticationResult == null) {
                    return;
                }

                this.sessionStrategy.onAuthentication(authenticationResult, request, response);
                if (this.continueChainBeforeSuccessfulAuthentication) {
                    chain.doFilter(request, response);
                }

                this.successfulAuthentication(request, response, chain, authenticationResult);
            } catch (InternalAuthenticationServiceException var5) {
                this.logger.error("An internal error occurred while trying to authenticate the user.", var5);
                this.unsuccessfulAuthentication(request, response, var5);
            } catch (AuthenticationException var6) {
                this.unsuccessfulAuthentication(request, response, var6);
            }

        }
    }

    public abstract Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException, IOException, ServletException;

    // ... 
}
```

### 2.2. UsernamePasswordAuthenticationFilter Class

오버라이드한 attemptAuthentication 메서드에서 아이디, 비밀번호로 사용자 인증을 수행합니다.

```java
public class UsernamePasswordAuthenticationFilter extends AbstractAuthenticationProcessingFilter {
    
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {
        if (this.postOnly && !request.getMethod().equals("POST")) {
            throw new AuthenticationServiceException("Authentication method not supported: " + request.getMethod());
        } else {
            String username = this.obtainUsername(request);
            username = username != null ? username.trim() : "";
            String password = this.obtainPassword(request);
            password = password != null ? password : "";
            UsernamePasswordAuthenticationToken authRequest = UsernamePasswordAuthenticationToken.unauthenticated(username, password);
            this.setDetails(request, authRequest);
            return this.getAuthenticationManager().authenticate(authRequest);
        }
    }

    // ...
}
```

### 2.3. OAuth2LoginAuthenticationFilter Class

오버라이드한 attemptAuthentication 메서드에서 OAuth2 인증 작업을 수행합니다. 

```java
public class OAuth2LoginAuthenticationFilter extends AbstractAuthenticationProcessingFilter {

    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {
        MultiValueMap<String, String> params = OAuth2AuthorizationResponseUtils.toMultiMap(request.getParameterMap());
        if (!OAuth2AuthorizationResponseUtils.isAuthorizationResponse(params)) {
            OAuth2Error oauth2Error = new OAuth2Error("invalid_request");
            throw new OAuth2AuthenticationException(oauth2Error, oauth2Error.toString());
        } else {
            OAuth2AuthorizationRequest authorizationRequest = this.authorizationRequestRepository.removeAuthorizationRequest(request, response);
            if (authorizationRequest == null) {
                OAuth2Error oauth2Error = new OAuth2Error("authorization_request_not_found");
                throw new OAuth2AuthenticationException(oauth2Error, oauth2Error.toString());
            } else {
                String registrationId = (String)authorizationRequest.getAttribute("registration_id");
                ClientRegistration clientRegistration = this.clientRegistrationRepository.findByRegistrationId(registrationId);
                if (clientRegistration == null) {
                    OAuth2Error oauth2Error = new OAuth2Error("client_registration_not_found", "Client Registration not found with Id: " + registrationId, (String)null);
                    throw new OAuth2AuthenticationException(oauth2Error, oauth2Error.toString());
                } else {
                    String redirectUri = UriComponentsBuilder.fromHttpUrl(UrlUtils.buildFullRequestUrl(request)).replaceQuery((String)null).build().toUriString();
                    OAuth2AuthorizationResponse authorizationResponse = OAuth2AuthorizationResponseUtils.convert(params, redirectUri);
                    Object authenticationDetails = this.authenticationDetailsSource.buildDetails(request);
                    OAuth2LoginAuthenticationToken authenticationRequest = new OAuth2LoginAuthenticationToken(clientRegistration, new OAuth2AuthorizationExchange(authorizationRequest, authorizationResponse));
                    authenticationRequest.setDetails(authenticationDetails);
                    OAuth2LoginAuthenticationToken authenticationResult = (OAuth2LoginAuthenticationToken)this.getAuthenticationManager().authenticate(authenticationRequest);
                    OAuth2AuthenticationToken oauth2Authentication = (OAuth2AuthenticationToken)this.authenticationResultConverter.convert(authenticationResult);
                    Assert.notNull(oauth2Authentication, "authentication result cannot be null");
                    oauth2Authentication.setDetails(authenticationDetails);
                    OAuth2AuthorizedClient authorizedClient = new OAuth2AuthorizedClient(authenticationResult.getClientRegistration(), oauth2Authentication.getName(), authenticationResult.getAccessToken(), authenticationResult.getRefreshToken());
                    this.authorizedClientRepository.saveAuthorizedClient(authorizedClient, oauth2Authentication, request, response);
                    return oauth2Authentication;
                }
            }
        }
    }

    // ... 
}
```

#### REFERENCE

- [Design Patterns: Elements of Reusable Object Oriented Software][design-pattern-book-link]
- <https://refactoring.guru/ko/design-patterns/template-method>
- <https://engineering.linecorp.com/ko/blog/templete-method-pattern>
- <https://gmlwjd9405.github.io/2018/07/13/template-method-pattern.html>
- <https://coding-factory.tistory.com/712>

[design-pattern-book-link]: https://www.kyobobook.co.kr/product/detailViewKor.laf?mallGb=KOR&ejkGb=KOR&barcode=9791195444953