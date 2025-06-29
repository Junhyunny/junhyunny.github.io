---
title: "WebSocket 핸드쉐이킹과 스프링 시큐리티 리다이렉트 문제"
search: false
category:
  - spring-boot
  - spring-security
  - web-socket
last_modified_at: 2025-06-28T23:55:00
---

<br/>

## 0. 들어가면서

웹소켓을 사용하는 팀에서 사용자 로그인 세션이 끊긴 이후에 다시 로그인을 하면 이상한 페이지로 리다이렉트되는 문제가 발생한다는 리포트가 있었다. 이런 문제가 발생한 이유와 해결한 방법에 대해 정리했다. 

## 1. Problem context

문제가 발생한 컨텍스트를 살펴보자. 예시 코드는 문제 여부만 확인할 수 있을 정도로 간소화했다. 서비스는 OAuth2 클라이언트로써 MS(microsoft) AAD 인가 서버를 사용한다. 프론트엔드 프로젝트는 리액트 애플리케이션으로 웹소켓과 관련된 의존성은 다음과 같다.

- sockjs-client
- stompjs

백엔드 프로젝트는 스프링 애플리케이션으로 문제와 연관된 의존성들은 다음과 같다.

- spring-boot-starter-websocket
- spring-boot-starter-security
- spring-boot-starter-oauth2-client

리액트 애플리케이션에선 다음과 같이 소켓을 연결하고 있다.

```tsx
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";

function App() {

  useEffect(() => {
    // stomp 클라이언트 생성
    const stompClient = new Client({
      webSocketFactory: () => new SockJS("/ws"),
      debug           : (str) => {
        console.log(str);
      }
    });

    // stomp 클라이언트 연결 완료
    stompClient.onConnect = (frame) => {
      console.log("Connected: " + frame);
      setIsConnected(true);
    };

    // stomp 클라이언트 연결 에러
    stompClient.onStompError = (frame) => {
      console.error("Broker reported error: " + frame.headers["message"]);
      console.error("Additional details: " + frame.body);
      setIsConnected(false);
    };

    // stomp 클라이언트 연결 종료
    stompClient.onDisconnect = () => {
      console.log("Disconnected");
      setIsConnected(false);
    };

    // stomp 클라이언트 활성화
    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, []);

  return (
    <>
      ...
    </>
  );
}
```

스프링 애플리케이션의 스프링 시큐리티 설정은 다음과 같다.

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(
                        // 모든 요청은 인증된 사용자만 허용
                        authorize -> authorize
                                .anyRequest().authenticated()
                )
                .oauth2Login(
                        // oauth2 로그인이 성공하면 특정 URL로 리다이렉트
                        oauth2 -> oauth2.defaultSuccessUrl("http://localhost:5173")
                );
        return http.build();
    }
}
```

위와 같은 상황에서 사용자가 로그인 후 서비스를 이용한다. 사용자가 서비스를 이용하는 중 긴 시간동안 서버와 인터렉션이 없어서 세션이 만료된 후 다시 로그인을 수행하면 서비스 경로가 아닌 웹 소켓 핸드쉐이킹(handshaking) 경로로 리다이렉트 된다. 브라우저가 로그인 성공 후 설정에 지정한 `http://localhost:5173` 경로가 아닌 `http://localhost:5173/ws/info?t=1751126372382&continue` 경로로 리다이렉트 되는 것이다.

<div align="center">
  <img src="/images/posts/2025/web-socket-hand-shaking-problem-with-spring-security-01.png" width="80%" class="image__border">
</div>

## 2. Cause of the problem

최초 로그인은 문제 없이 잘 동작했다. 로그인 한 사용자의 세션이 만료된 후 재로그인을 수행하면 이런 문제가 발생했다. 원인은 무엇일까? 우선 사용자 세션이 만료되면 웹 소켓 클라이언트는 지속적으로 연결을 시도한다. 브라우저 개발자 도구의 네트워크 탭을 보면 연결을 계속 시도하는 것을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2025/web-socket-hand-shaking-problem-with-spring-security-02.gif" width="80%" class="image__border">
</div>

<br />

웹 소켓 연결 요청은 만료된 사용자 요청이기 때문에 이 과정에서 사용자 인증 예외가 발생한다. 발생한 예외는 ExceptionTranslationFilter 객체에서 처리된다. 예외를 처리하는 과정에서 sendStartAuthentication 메소드가 실행된다. 여기서 HttpSessionRequestCache 객체를 통해 서버 세션에 현재 요청에 대한 정보를 저장한다. 이는 추후 다시 사용자가 로그인하면 마지막에 실패한 요청으로 사용자를 리다이렉트시키기 위함이다.

```java
public class ExceptionTranslationFilter extends GenericFilterBean implements MessageSourceAware {
  
    private final RequestCache requestCache;

    protected MessageSourceAccessor messages = SpringSecurityMessageSource.getAccessor();

    public ExceptionTranslationFilter(AuthenticationEntryPoint authenticationEntryPoint) {
        this(authenticationEntryPoint, new HttpSessionRequestCache());
    }

    public ExceptionTranslationFilter(AuthenticationEntryPoint authenticationEntryPoint, RequestCache requestCache) {
        Assert.notNull(authenticationEntryPoint, "authenticationEntryPoint cannot be null");
        Assert.notNull(requestCache, "requestCache cannot be null");
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.requestCache = requestCache;
    }

    protected void sendStartAuthentication(
      HttpServletRequest request, 
      HttpServletResponse response, 
      FilterChain chain,
            AuthenticationException reason
  ) throws ServletException, IOException {
        SecurityContext context = this.securityContextHolderStrategy.createEmptyContext();
        this.securityContextHolderStrategy.setContext(context);
        this.requestCache.saveRequest(request, response); // this line
        this.authenticationEntryPoint.commence(request, response, reason);
    }
}
```

그림으로 설명하면 다음과 같다.

1. 현재 인가 규칙은 인증된 사용자에 대해서만 접근을 허용한다. AuthorizationFilter 객체에서 인증되지 않은 사용자에 대한 요청은 예외를 던진다.
2. 예외 처리를 수행하는 ExceptionTranslationFilter 객체에서 이를 핸들링한다. 요청을 재사용하기 위해 HttpSessionRequestCache 객체를 통해 캐싱한다.
3. HttpSessionRequestCache 객체는 요청 정보를 세션에 저장한다.

<div align="center">
  <img src="/images/posts/2025/web-socket-hand-shaking-problem-with-spring-security-03.png" width="100%" class="image__border">
</div>

<br />

이후 로그인이 성공하면 세션에 저장된 요청 객체를 꺼내서 재사용한다. 사용자 인증이 완료된 후 실행되는 SavedRequestAwareAuthenticationSuccessHandler 객체의 onAuthenticationSuccess 메소드를 살펴보자. 시큐리티 필터 체인을 생성할 때 defaultSuccessUrl 메소드로 리다이렉트 URL을 지정했다면 기본적으로 SavedRequestAwareAuthenticationSuccessHandler 객체가 사용된다.

```java
public class SavedRequestAwareAuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    protected final Log logger = LogFactory.getLog(this.getClass());

    private RequestCache requestCache = new HttpSessionRequestCache();

    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request, 
        HttpServletResponse response,
        Authentication authentication
  ) throws ServletException, IOException {
        // 1. get saved request from session
        SavedRequest savedRequest = this.requestCache.getRequest(request, response);
        if (savedRequest == null) {
            super.onAuthenticationSuccess(request, response, authentication);
            return;
        }
        String targetUrlParameter = getTargetUrlParameter();
        if (isAlwaysUseDefaultTargetUrl()
                || (targetUrlParameter != null && StringUtils.hasText(request.getParameter(targetUrlParameter)))) {
            this.requestCache.removeRequest(request, response);
            super.onAuthenticationSuccess(request, response, authentication);
            return;
        }
        clearAuthenticationAttributes(request);
        // 2. use saved request's url
        String targetUrl = savedRequest.getRedirectUrl();
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
```

그림으로 설명하면 다음과 같다.

1. OAuth2LoginAuthenticationFilter 객체에서 인증이 완료되면 SavedRequestAwareAuthenticationSuccessHandler 객체에게 인증 후처리를 위임한다.
2. SavedRequestAwareAuthenticationSuccessHandler 객체는 지정된 리다이렉트 URL로 요청을 보내기 전에 세션에 저장된 요청 정보가 존재하는지 확인한다. 세션에 저장된 요청 정보는 사용자가 인증 되기 전에 마지막으로 보냈던 요청이다. 
3. HttpSessionRequestCache 객체는 요청 정보를 세션으로부터 꺼낸다. SavedRequestAwareAuthenticationSuccessHandler 객체는 캐싱된 요청 정보가 있다면 해당 경로로 사용자를 리다이렉트시킨다.

<div align="center">
  <img src="/images/posts/2025/web-socket-hand-shaking-problem-with-spring-security-04.png" width="100%" class="image__border">
</div>

## 3. Solve the problem

원인을 파악했으니 문제를 해결해보자. onAuthenticationSuccess 메소드를 보면 isAlwaysUseDefaultTargetUrl() 메소드를 볼 수 있다. isAlwaysUseDefaultTargetUrl() 메소드의 결과가 참(true)인 경우 세션에 저장된 요청 객체가 있더라도 항상 지정한 리다이렉트 URL로 요청을 보낸다. 이 메소드는 부모 클래스인 AbstractAuthenticationTargetUrlRequestHandler에 정의되어 있다. 

<div align="center">
  <img src="/images/posts/2025/web-socket-hand-shaking-problem-with-spring-security-05.png" width="60%" class="image__border">
</div>

<br />

해당 플래그는 시큐리티 필터 체인을 생성할 때 설정할 수 있다.

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(
                        authorize -> authorize
                                .anyRequest().authenticated()
                )
                .oauth2Login(
                        oauth2 -> oauth2.defaultSuccessUrl("http://localhost:5173", true)
                );
        return http.build();
    }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-06-28-web-socket-hand-shaking-problem-with-spring-security>
