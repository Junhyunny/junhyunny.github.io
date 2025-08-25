---
title: "WAF 도메인 주소 재작성으로 인한 OAuth2 리다이렉트 문제 해결"
search: false
category:
  - spring-boot
  - spring-security
  - waf
  - rewriting-domain
  - redirect-strategy
last_modified_at: 2025-08-25T23:55:00
---

<br/>

## 0. 들어가면서

올해 5월쯤 지원했던 팀에 있었던 문제와 해결 방법에 대해 정리했다. 

## 1. Problem context

발생한 문제에 대한 컨텍스트는 다음과 같다.

- 이 애플리케이션은 사외 사용자들과 사내 사용자들에게 모두 서비스를 제공한다.
  - 내부 사용자들이 서비스를 이용할 땐 internal.example.com 주소로 접근한다.
  - 외부 사용자들이 서비스를 이용할 땐 example.com 주소로 접근한다.
- 외부 사용자들은 외부 업체의 WAF(web application firewall)를 통해 접근한다. 
  - 이 WAF는 호스트 주소를 `example.com`에서 `internal.example.com`로 변경한다.

<div align="center">
  <img src="/images/posts/2025/fix-waf-rewriting-host-problem-with-spring-security-oauth2-01.png" width="100%" class="image__border">
</div>

<br/>

문제는 사용자가 OAuth2 프로토콜을 통해 로그인 할 때 발생했다. 서버의 호스트 URL이 `internal.example.com`이기 때문에 스프링 시큐리티 OAuth2 클라이언트(spring-security-oauth2-client)가 인가 코드 승인(authorization code grant) 과정에서 외부 사용자도 `internal.example.com` 주소를 리다이렉트(redirect) URL로 전달했다. 구체적으로 다음과 같은 문제가 발생했다.

- 사용자가 외부 네트워크에서 example.com 주소로 접근한 경우 internal.example.com 주소로 접근이 되지 않았다.
- 사용자가 내부 네트워크에서 example.com 주소로 접근한 경우 인증 완료 리다이렉트 이후 internal.example.com 주소로 변경되면서 example.com 주소에 연결된 쿠키를 잃게 된다. 인가 코드 승인 과정에서 CSRF 공격을 방어하기 위한 state 코드 비교에서 문제가 발생한다. 스프링 시큐리티는 state 코드를 세션에 저장하기 떄문이다. 세션 키는 example.com 도메인 쿠기에 담겨 있다.

<div align="center">
  <img src="/images/posts/2025/fix-waf-rewriting-host-problem-with-spring-security-oauth2-02.png" width="100%" class="image__border">
</div>

## 2. Solve the problem

WAF에서 서버로 연결하는 부분이 근본적으로 문제였지만, 외부에서 제공하는 WAF이기 때문에 이를 손보는 것은 어려운 상황이었다. 스프링 시큐리티 OAuth2 클라이언트의 리다이렉트 로직을 재구현했다. OAuth2 인가 코드 승인에서 인가 서버(auth server)로 리다이렉트 시키는 과정에 참여하는 컴포넌트는 다음과 같다.

- OAuth2AuthorizationRequestRedirectFilter 객체
  - OAuth2AuthorizationRequestResolver 인스턴스와 협업하여 사용자(브라우저)를 인가 서버로 리다이렉트 시킨다. 
- OAuth2AuthorizationRequestResolver 인스턴스
  - application YAML 파일에 등록된 클라이언트 정보를 바탕으로 사용자를 인가 서버로 리다이렉트 시키기 위한 URL을 만든다.
  - 실제 사용되는 구현체는 DefaultOAuth2AuthorizationRequestResolver 객체다.

<div align="center">
  <img src="/images/posts/2025/fix-waf-rewriting-host-problem-with-spring-security-oauth2-03.png" width="100%" class="image__border">
</div>

<br/>

나는 OAuth2AuthorizationRequestResolver 인스턴스의 로직을 [프록시 패턴(proxy pattern)](https://junhyunny.github.io/information/design-pattern/proxy-pattern/)을 통해 확장했다. 

- DefaultOAuth2AuthorizationRequestResolver 객체의 기능은 그대로 사용한다.
- CustomOAuth2AuthorizationRequestResolverProxy 객체는 DefaultOAuth2AuthorizationRequestResolver 객체에게 인가 서버 리다이렉트 URL 생성을 위임하고, 인가 서버 리다이렉트 URL 쿼리에 포함된 `redirect_url` 값만 변경한다.

<div align="center">
  <img src="/images/posts/2025/fix-waf-rewriting-host-problem-with-spring-security-oauth2-04.png" width="100%" class="image__border">
</div>

<br/>

프록시 패턴을 사용한 이유는 application YAML 파일 기반으로 인가 서버로 리다이렉트 시키는 URL을 만드는 작업은 생각보다 복잡하기 때문이다. 스프링 시큐리티에서 제공하는 OAuth2AuthorizationRequestResolver 컴포넌트의 기능을 그대로 사용하되 필요한 정보만 오버라이딩하고 싶었다. HTTP 헤더에 포함된 레퍼러(referer) 정보를 기반으로 `redirect_url` 값을 변경한다. HTTP 레퍼러 헤더는 사용자가 현재 웹 페이지로 어떤 경로를 통해 왔는지를 나타내는 정보다. 웹사이트의 유입 경로 분석에 사용되지만, 이 문제를 해결할 때 활용할 수 있을 것이라 생각했다. 

이제 코드를 살펴보자. 다음과 같은 동작을 수행한다.

1. delegate 인스턴스에게 인가 서버 URL 생성을 위임한다.
2. HTTP 헤더의 레퍼러 정보를 확인 후 이를 기반으로 인가 서버 리다이렉트 URL 쿼리에 포함된 `redirect_url` 값을 변경한다. 
  - 외부로부터 온 요청이고, `redirect_url` 값이 인터널 도메인을 사용하는 경우 이를 변경한다.
  - 그렇지 않은 경우 그 값을 그대로 사용한다.
3. 인가 코드 승인 요청 객체를 새로 생성 후 반환한다.

```kotlin
import jakarta.servlet.http.HttpServletRequest
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest

class CustomOAuth2AuthorizationRequestResolverProxy(
  private val delegate: OAuth2AuthorizationRequestResolver
) : OAuth2AuthorizationRequestResolver {
  override fun resolve(request: HttpServletRequest): OAuth2AuthorizationRequest? = changeRedirectUri(
    request,
    delegate.resolve(request) // 1. delegate 인스턴스에게 인가 서버 URL 생성을 위임
  )

  override fun resolve(request: HttpServletRequest, clientRegistrationId: String): OAuth2AuthorizationRequest? =
    changeRedirectUri(
      request,
      delegate.resolve(request, clientRegistrationId) // 1. delegate 인스턴스에게 인가 서버 URL 생성을 위임
    )

  private fun changeRedirectUri(
    request: HttpServletRequest,
    result: OAuth2AuthorizationRequest?
  ): OAuth2AuthorizationRequest? {
    if (result == null) return null
    val referer = request.getHeader("referer") ?: request.getHeader("Referer")
    val newUri =
      if (referer == "https://example.com/" && result.redirectUri.contains("https://internal.example.com")) {
        result.redirectUri.replace("https://internal.example.com", "https://example.com")
      } else {
        result.redirectUri
      } // 2. HTTP 헤더 레퍼러 값을 기반으로 `redirect_url` 값 변경
    return OAuth2AuthorizationRequest.from(result)
      .redirectUri(newUri)
      .build() // 3. 인가 코드 승인 요청 객체를 새로 생성 후 반환
  }
}
```

OAuth2AuthorizationRequestResolver 인스턴스의 기능을 확장한 CustomOAuth2AuthorizationRequestResolverProxy 객체를 시큐리티 필터 체인에 포함시킨다. 필터 체인을 구성할 때 CustomOAuth2AuthorizationRequestResolverProxy 객체를 주입한다.

```kotlin
@Configuration
@EnableWebSecurity
class SecurityConfig {

  @Bean
  fun authSecurityFilterChain(
    http: HttpSecurity,
    clientRegistrationRepository: ClientRegistrationRepository,
  ): SecurityFilterChain {
    http
      ...
      .oauth2Login {
        it.authorizationEndpoint { aut ->
          // CustomOAuth2AuthorizationRequestResolverProxy 객체 주입
          aut.authorizationRequestResolver(
            CustomOAuth2AuthorizationRequestResolverProxy(
              DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository,
                OAuth2AuthorizationRequestRedirectFilter.DEFAULT_AUTHORIZATION_REQUEST_BASE_URI
              )
            )
          )
        }
        ...
      }
      ...
    return http.build()
  }
}
```

## CLOSING

스프링 시큐리티 구조와 시큐리티 필터 체인을 알고 있다면 확장할 부분을 탐색하는 것은 크게 어렵지 않다. 시큐리티 필터 체인에 속한 서블릿 필터의 역할만 알고 있다면 그 주변 코드를 디버깅을 통해 살펴보면 된다. 보통 가벼운 예제를 만들어 코드 전체를 올리는 편이지만, 이 글에서 다룬 문제를 재현하기 위한 OAuth2 인가 설정이나 WAF 준비가 번거롭기 때문에 내용과 핵심 코드 부분만 정리했다.

#### REFERENCE

- <https://junhyunny.github.io/information/design-pattern/proxy-pattern/>
- <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referer>