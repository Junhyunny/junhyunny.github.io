---
title: "Microsoft AAD 인증 시 스레드 락에 의한 시스템 장애 해결"
search: false
category:
  - spring
  - spring-security
  - microsoft
  - azure-active-directory
  - oauth2
  - oidc
  - trouble-shooting
last_modified_at: 2025-10-03T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [클라이언트 요청 타임아웃(request timeout)][kind-of-request-timeout-link]
- [JWK(Json Web Key)][json-web-key-link]
- [프록시 패턴(proxy pattern)][proxy-pattern-link]

## 0. 들어가면서

현재 나는 프로페셔널 서비스(professional service) 팀으로 일하고 있다. 여러 팀들로부터 지원 요청을 받거나 문제가 생겼을 떄 이를 해결해주는 역할을 수행한다. 최근 외부 서버와 통신 문제로 인해 시스템 장애가 발생한 케이스에 대한 문의를 받았고, 이 문제를 함께 해결했다. 트러블 슈팅 과정을 정리해 놓으면 좋을 것 같아서 글로 작성했다.

## 1. Problem context 

문제 상황을 정리해보면 다음과 같다.

- 시스템에 갑자기 HTTP 상태 400 에러가 급증하기 시작했다.
- 새로 로그인하는 사용자는 인증이 완료되지 않고 톰캣 화이트 페이지(white page)로 리다이렉트 된다. 
- 이미 로그인 한 사용자들은 문제 없이 사용이 가능하다.

<div align="center">
  <img src="/images/posts/2025/ms-aad-login-thread-lock-problem-01.png" width="100%" class="image__border">
</div>

<br/>

그렇다고 다른 문제가 있던 것은 아니다. ALB, 데이터베이스는 잘 동작했고, 애플리케이션 헬스 체크도 정상적으로 응답을 줬다. 서버의 리소스 사용량도 크게 문제가 되지 않은 수준이었다. 클라우드워치(cloudwatch)에도 에러 로그가 보이지 않았다. 힌트가 딱 하나 있었는데, 브라우저 주소 창에 표시된 리다이렉트 URL이 다음과 같았다.

```
https://application.com/?error=[invalid_id_token]%20An%20error%20occurred%20while%20attempting%20to%20decode%20the%20Jwt:%20Timeout%20while%20waiting%20for%20cache%20refresh%20(15000ms%20exceeded)
```

에러 메시지를 디코드해보면 다음과 같다.

```
error=[invalid_id_token] An error occurred while attempting to decode the Jwt: Timeout while waiting for cache refresh (15000ms exceeded)
```

에러 메시지를 본 담당 개발자가 서비스를 재기동하니 정상적으로 동작하기 시작했다. 임시적인 문제 해결 방식이었지만, 다행히 빠른 시간 안에 시스템 장애는 해결이 되었다.

## 2. Solve the problem

서비스 담당 개발자들과 재발 방지를 위해 근본적인 원인을 해결하기 위한 트러블 슈팅에 들어갔다. 에러 관련된 힌트가 너무 없어서 트러블 슈팅이 오래 걸릴 줄 알았지만, 딱히 그렇진 않았다. 스프링 시큐리티 책을 집필할 때 JWT 토큰 디코딩 로직을 디버깅해 본 경험 덕분인지 생각보다 빠르게 문제 지점을 찾을 수 있었다. 인텔리제이에서 해당 에러 메시지를 검색해보니 에러가 발생한 것으로 의심되는 특정 클래스들을 찾았다. `An error occurred while attempting to decode the Jwt` 메시지는 NimbusJwtDecoder 클래스 내부에서 사용 중이다. 

```java
public final class NimbusJwtDecoder implements JwtDecoder {

  private static final String DECODING_ERROR_MESSAGE_TEMPLATE = "An error occurred while attempting to decode the Jwt: %s";

  ...
}
```

`Timeout while waiting for cache refresh` 메시지는 CachingJWKSetSource 클래스 내부에서 사용 중이다.

```java
@ThreadSafe
public class CachingJWKSetSource<C extends SecurityContext> extends AbstractCachingJWKSetSource<C> {

    private final ReentrantLock lock = new ReentrantLock();

    JWKSet loadJWKSetBlocking(final JWKSetCacheRefreshEvaluator refreshEvaluator, final long currentTime, final C context)
        throws KeySourceException {
        ...
        // try lock while wait 15 seconds
        if (lock.tryLock(getCacheRefreshTimeout(), TimeUnit.MILLISECONDS)) {
          try {
            CachedObject<JWKSet> cachedJWKSet = getCachedJWKSet();
            if (cachedJWKSet == null || refreshEvaluator.requiresRefresh(cachedJWKSet.get())) {
              if (eventListener != null) {
                eventListener.notify(new RefreshInitiatedEvent<>(this, lock.getQueueLength(), context));
              }
              
              // get JWKs
              cache = loadJWKSetNotThreadSafe(refreshEvaluator, currentTime, context);
              
              if (eventListener != null) {
                eventListener.notify(new RefreshCompletedEvent<>(this, cache.get(), lock.getQueueLength(), context));
              }
            } else {
              cache = cachedJWKSet;
            }
          } finally {
            // unlock
            lock.unlock();
          }
        } else {
          if (eventListener != null) {
            eventListener.notify(new RefreshTimedOutEvent<>(this, lock.getQueueLength(), context));
          }
          // throw exception
          throw new JWKSetUnavailableException("Timeout while waiting for cache refresh (" + cacheRefreshTimeout + "ms exceeded)");
        }
    ...
    }
}
```

CachingJWKSetSource 클래스의 `lock.tryLock(getCacheRefreshTimeout(), TimeUnit.MILLISECONDS)`, `lock.unlock()` 코드를 보고 시스템 장애가 발생한 원인을 다음과 같이 유추할 수 있었다.

- 특정 스레드가 ReentrantLock 객체를 통해 락을 잡는다.
- 임계 영역(critical section)에 진입한 스레드가 행(hang)에 걸려 락을 해제하지 못한다.
- 다른 스레드들은 락을 잡기 위해 tryLock 메소드를 호출하고 15초 대기하지만, 락을 잡지 못하고 JWKSetUnavailableException 에외를 던진다.

finally 블럭에 `lock.unlock` 코드가 위치하기 때문에 스레드가 무한 루프나 무한 대기에 빠지지 않았다면 락은 반드시 해제되어야 한다. 예전 디버깅 경험을 돌이켜보니 스프링 시큐리티는 JWT을 디코딩 할 때 내부적으로 인가 서버에게 [JWKs(Json Web Key Set)][json-web-key-link]을 요청했다. 이 원격 요청에 무엇인가 문제가 있다고 판단했다. 원격 요청을 하는 지점은 디버깅을 통해 찾아냈다.

- NimbusJwtDecoder 객체는 JWT를 생성한다.
- CachingJWKSetSource 객체는 JWT를 생성하기 위해 필요한 JWks을 획득한다.
- NimbusJwtDecoder$JwkSetUriJwtDecoderBuilder$SpringJWTSource 객체는 외부 인가 서버로 JWKs을 요청한다.

<div align="left">
  <img src="/images/posts/2025/ms-aad-login-thread-lock-problem-02.png" width="100%" class="image__border">
</div>

<br/>

SpringJWTSource 객체의 fetchJwks 메소드를 살펴보면 내부적으로 `RestOperations` 인스턴스를 사용해 `외부 서버(https://login.microsoftonline.com/{tenant-id}/discovery/v2.0/keys)`에게 JWKs을 요청한다.

```java
public final class NimbusJwtDecoder implements JwtDecoder {
  public static final class JwkSetUriJwtDecoderBuilder {
    private static final class SpringJWKSource<C extends SecurityContext> implements JWKSetSource<C> {

      private final RestOperations restOperations;
      
      private String fetchJwks() throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON, APPLICATION_JWK_SET_JSON));
        RequestEntity<Void> request = new RequestEntity<>(headers, HttpMethod.GET, URI.create(this.jwkSetUri));

        // this line
        ResponseEntity<String> response = this.restOperations.exchange(request, String.class);

        String jwks = response.getBody();
        this.jwkSet = JWKSet.parse(jwks);
        return jwks;
      }
      
    }
  }
}
```

코드를 둘러봐도 의심되는 것은 이 곳 밖에 없었다. RestTemplate 객체는 타임아웃을 설정하지 않으면 무한히 응답을 기다리기 때문에 이번 장애의 원인일 가능성이 높았다. 그림을 통해 시각화 하면 다음과 같다.

1. 스레드-1이 API 호출하기 전 락을 선점한다.
2. 스레드-1은 마이크로소프트(microsoft) 인증 서버로 API 호출을 수행하지만, 인증 서버와의 연결에 문제가 있어서 행이 걸린다.
3. 스레드-1은 락를 해제하지 못한다.
4. 다른 스레드들은 15초 대기 후 락을 선점하지 못해서 예외를 던지고 인증에 실패한다. 시스템 장애로 이어진다.

<div align="center">
  <img src="/images/posts/2025/ms-aad-login-thread-lock-problem-03.png" width="100%" class="image__border">
</div>

<br/>

마이크로소프트 인증 서버에 일시적 문제가 있었던 것이라 생각하고, 다음과 같은 조치를 취했다.

- 로그를 통해 에러 위치를 판단하기 위해 로그 레벨 조정
- restOperations 객체에 타임아웃 시간 지정

로깅 레벨을 조절하는 것은 크게 어렵지 않지만, restOperations 객체에 타임아웃을 지정하는 것이 어려울까 걱정했다. 다행히 restOperations 객체는 의존성 주입을 통해 설정할 수 있었기 때문에 이에 관련된 작업을 수행했다. 현재 이 팀은 마이크로소프트에서 제공하는 AAD 의존성을 사용하고 있기 때문에 이에 맞는 의존성 주입 코드를 작성했다. 이 문제에 연관된 의존성은 다음과 같다.

```gradle
dependencies {
    ...
    implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    implementation("com.azure.spring:spring-cloud-azure-starter-active-directory:5.23.0")
    ...
}
```

SpringJWKSource 객체에 필요한 RestTemplate 객체는 `spring-cloud-azure-starter-active-directory` 의존성에서 제공하는 빈(bean)을 통해 주입된다. 이에 관련된 클래스와 메소드는 다음과 같다. 우선 AadOAuth2ClientConfiguration 클래스의 azureAdJwtDecoderFactory 메소드에서 JwtDecoder 객체를 생성한다.

```java
package com.azure.spring.cloud.autoconfigure.implementation.aad.configuration;

...

@Configuration(proxyBeanMethods = false)
@Conditional(ClientRegistrationCondition.class)
class AadOAuth2ClientConfiguration {

    private final RestTemplateBuilder restTemplateBuilder;

    AadOAuth2ClientConfiguration(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplateBuilder = restTemplateBuilder;
    }

    ...

    @Bean
    @ConditionalOnMissingBean
    JwtDecoderFactory<ClientRegistration> azureAdJwtDecoderFactory(AadAuthenticationProperties properties) {
        AadProfileProperties profile = properties.getProfile();
        AadAuthorizationServerEndpoints endpoints = new AadAuthorizationServerEndpoints(
                profile.getEnvironment().getActiveDirectoryEndpoint(), 
                profile.getTenantId()
        );
        // create JWT decoder
        return new AadOidcIdTokenDecoderFactory(
            endpoints.getJwkSetEndpoint(),
            // inject RestTemplate 
            createRestTemplate(restTemplateBuilder)
        );
    }
    ...
}
```

AadResourceServerConfiguration 클래스의 jwtDecoder 메소드에서도 JwtDecoder 객체를 생성한다.

```java
package com.azure.spring.cloud.autoconfigure.implementation.aad.configuration;

...

@Configuration(proxyBeanMethods = false)
@Conditional(ResourceServerCondition.class)
class AadResourceServerConfiguration {

    private final RestTemplateBuilder restTemplateBuilder;

    AadResourceServerConfiguration(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplateBuilder = restTemplateBuilder;
    }

    ...
    
    @Bean
    @ConditionalOnMissingBean(JwtDecoder.class)
    JwtDecoder jwtDecoder(AadAuthenticationProperties aadAuthenticationProperties) {
        AadAuthorizationServerEndpoints identityEndpoints = new AadAuthorizationServerEndpoints(
            aadAuthenticationProperties.getProfile().getEnvironment().getActiveDirectoryEndpoint(), 
            aadAuthenticationProperties.getProfile().getTenantId()
        );
        // create JWT decoder
        NimbusJwtDecoder nimbusJwtDecoder = NimbusJwtDecoder
            .withJwkSetUri(identityEndpoints.getJwkSetEndpoint())
                // inject RestTemplate
                .restOperations(createRestTemplate(restTemplateBuilder))
                .build();
        List<OAuth2TokenValidator<Jwt>> validators = createDefaultValidator(aadAuthenticationProperties);
        nimbusJwtDecoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(validators));
        return nimbusJwtDecoder;
    }
    ...
}
```

두 곳의 설정(configuration) 빈에서 JwtDecoder 객체를 생성하고, RestTemplateBuilder 클래스를 통해 RestTemplate 객체를 생성 후 주입한다. 실제로 장애를 유발한 JwtDecoder 객체는 아무래도 클라이언트 쪽일 것 같지만, 두 곳에 모두 타임아웃을 추가한다고 문제가 될 것 같진 않아서 아래와 같은 프록시(proxy) 객체를 생성했다.

- RestTemplate 클래스를 상속하고, 부모 클래스의 기능을 내부적으로 호출한다.
- 호출하기 전 스레드, 응답을 받은 후 스레드 이름을 로깅한다. 응답을 받지 못한 스레드가 unlock 처리를 못하여 시스템 장애를 유발할 것이다. 
- RestTemplate 객체에 타임아웃을 설정할 것이기 때문에 이를 확인하기 위해 예외를 로깅하고 락을 해제하기 위해 이를 던진다.

```kotlin
class ProxyRestTemplate() : RestTemplate() {
    override fun <T : Any?> exchange(entity: RequestEntity<*>, responseType: Class<T?>): ResponseEntity<T?> {
        try {
            logger.debug("Microsoft auth server request: ${Thread.currentThread().name}")
            val result = super.exchange(entity, responseType)
            logger.debug("response: ${Thread.currentThread().name}")
            return result
        } catch (e: Exception) {
            logger.error("Microsoft auth server request error", e)
            throw e
        }
    }
}
```

프록시 RestTemplate 객체를 주입하기 위한 ProxyRestTemplateBuilder 클래스를 생성한다. AadOAuth2ClientConfiguration, AadResourceServerConfiguration 객체가 사용하는 createRestTemplate 메소드에서 에러 핸들러, 메시지 컨버터 등을 추가할 때 RestTemplateBuilder 객체가 새로 생성되기 때문에 build 메소드 외에도 errorHandler, messageConverters 메소드를 오버라이딩 해줘야 한다.

```kotlin
class ProxyRestTemplateBuilder(
    private val delegate: RestTemplateBuilder
) : RestTemplateBuilder() {
    override fun errorHandler(errorHandler: ResponseErrorHandler?): RestTemplateBuilder? {
        return ProxyRestTemplateBuilder(delegate.errorHandler(errorHandler))
    }

    override fun messageConverters(vararg messageConverters: HttpMessageConverter<*>?): RestTemplateBuilder? {
        return ProxyRestTemplateBuilder(delegate.messageConverters(*messageConverters))
    }

    override fun build(): RestTemplate {
        return delegate.configure(ProxyRestTemplate())
    }
}
```

의존성 주입을 위한 restTemplateBuilder 빈 객체를 생성한다. 타임아웃을 지정할 때 사용하는 connectTimeout, readTimeout 메소드도 매번 새로운 RestTemplateBuilder 객체를 생성 후 반환하므로 이를 주의해야 한다. 타임아웃 시간은 15초로 지정했다. 인증 서버로부터 JWKs을 받을 때 필요한 적절한 시간을 정확히 판단할 수 없기 때문에 스레드가 락을 선점하기 위해 기다리는 15초를 기준으로 삼았다.

```kotlin
@Configuration
class JwtConfig() {

    @Bean
    fun restTemplateBuilder(): RestTemplateBuilder {
        val result = RestTemplateBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .readTimeout(Duration.ofSeconds(15))
        return ProxyRestTemplateBuilder(result)
    }
}
```

서비스를 배포 후 얼마 안 지나서 다음과 같은 에러 메시지를 만났다. 

- 스레드-252590이 JWKs을 획득하기 위해 MS 인증 서버의 API를 호출한다. 이 시점에 스레드-252590은 락을 선점한 상태다.
- 15초 이후에 ReadTimeoutException이 발생한다. MS 인증 서버로의 연결이 실패한 것으로 보인다. 

<div align="center">
  <img src="/images/posts/2025/ms-aad-login-thread-lock-problem-04.png" width="100%" class="image__border">
</div>

## CLOSING

이 글의 내용을 요약해보자. 사용자 인증 과정에서 JWT 유효성 검사를 위해 외부 마이크로소프트 인증 서버로부터 JWKs을 받아 오는 과정에 문제가 있었다. 우리는 문제가 발생하는 지점을 특정했고, 클라이언트 타임아웃을 설정해 시스템 장애가 발생하는 것을 방지했다. 인프라 문제인지 MS 인증 서버 문제인지 정확하게 알 수는 없지만, 우리가 다루지 못하는 외부 서비스와의 연결을 주의해야 한다는 교훈을 다시끔 얻었다. 인프라 쪽에 문제가 있었는지 함께 살펴보지 못해서 아쉽다.

이 팀은 나와 트러블 슈팅을 마친 후 장애 대응 프로세스 수립, 후속 조치, 그리고 포스트모템(postmortem)까지 수행했다. 최근 같이 일했던 팀 중에 가장 훌륭한 팀이다.

[json-web-key-link]: https://junhyunny.github.io/information/json-web-key/
[kind-of-request-timeout-link]: https://junhyunny.github.io/information/kind-of-request-timeout/
[proxy-pattern-link]: https://junhyunny.github.io/information/design-pattern/proxy-pattern/