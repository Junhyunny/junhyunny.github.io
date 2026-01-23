---
title: "Chain of Responsibility Pattern"
search: false
category:
  - design-pattern
last_modified_at: 2024-04-22T23:55:00
---

<br/>

## 0. 들어가면서

스프링 프레임워크가 익숙한 개발자라면 서블릿 필터(servlet filter), 필터 체인(filter chain) 같은 개념이 익숙할 것이다. 필터 체인에는 책임 연쇄(chain of responsibility)라는 패턴이 적용되어 있다. 이 패턴에 대해 자세히 설명할 일이 생긴 김에 블로그에 글로 정리했다.

## 1. Chain of Responsibility Pattern

책임 연쇄 패턴은 어떤 문제를 해결하기 위해 고안되었는지 살펴보자.

### 1.1. In Gangs of Four (GoF) Design Patterns

디자인 패턴의 바이블(bible)이라고 불리는 [Gangs of Four (GoF) Design Patterns](https://product.kyobobook.co.kr/detail/S000000676784)에서 책임 연쇄 패턴에 대해 찾아보면 다음과 같은 예시를 제시한다. 

- UI 애플리케이션 사용자가 도움말 정보를 얻어야 한다.
  - 사용자는 인터페이스의 어느 위치를 클릭하더라도 도움말 정보를 얻어야 한다.
  - 선택한 인터페이스 부분과 컨텍스트에 따라 도움말 정보가 달라진다.
- UI 애플리케이션은 도움말 정보를 구체적인 것부터 일반적인 것까지 제공할 수 있어야 한다.
  - 사용자가 선택한 인터페이스에 밀접할수록 구체적인 정보를 갖고 있을 수도 있고 없을 수도 있다.
  - 사용자가 선택한 인터페이스와 멀수록 일반적인 정보를 갖고 있다.

문제는 도움말 정보를 제공하는 컴포넌트는 사용자가 도움말을 요청하기 위해 클릭한 인터페이스 컴포넌트의 존재를 모른다는 점이다. 이 문제를 해결하기 위해 여러 개체들이 특정 요청을 처리하기 위한 연결 고리를 만들고 요청을 재전달한다.

- 자신이 해결할 수 있는 요청은 자신이 처리한다.
- 자신이 해결할 수 없는 요청은 다음 후보 객체에게 전달한다.

<p align="center">
  <img src="/images/posts/2024/chain-of-responsibility-pattern-01.png" width="80%" class="image__border">
</p>
<center>https://www.cs.unc.edu/~stotts/GOF/hires/pat5afso.htm</center>

### 1.2. In Refactoring Guru

디자인 패턴에 대해 잘 정리된 [Refacotring Guru](https://refactoring.guru/ko)라는 사이트에서도 좋은 예시를 들고 있다. 내가 익숙한 스프링 시큐리티(spring security)와 유사한 사례이기 때문에 더 이해하기 쉬웠다. 

1. 온라인 주문 시스템을 개발하고 있다.
  - 인증된 사용자만 주문할 수 있다.
  - 관리 권한이 있는 사용자들은 모든 주문에 접근 권한을 부여할 수 있다.
2. 몇 가지 기능들이 더 추가됬다.
  - 검증되지 않은 데이터를 주문 시스템에 직접 전달하는 것이 안정하지 않아 데이터를 정제(sanitize)하는 추가 유효성 검사를 추가한다.
  - 무차별 대입 공격에 방어하기 위해 같은 IP 주소로부터 반복적으로 오는 실패한 요청을 걸러내는 검사를 추가한다.
  - 같은 데이터가 포함된 반복 요청에 대해 캐시된 결과를 반환한다.

<p align="center">
  <img src="/images/posts/2024/chain-of-responsibility-pattern-02.png" width="100%" class="image__border">
</p>
<center>https://refactoring.guru/ko/design-patterns/chain-of-responsibility</center>

<br/>

인증, 인가, 유효성 검사, 무차별 공격 방어, 캐싱 등 너무 많은 기능들이 모여있다. 새로운 기능을 추가할 때마다 코드의 복잡성은 증가하고 이는 코드를 수정, 검증하는 데 더 많은 비용을 들게 만드는 악순환의 고리를 만든다. 비슷한 검증이 필요한 다른 시스템에선 코드 일부분을 복제해가기 때문에 비슷한 코드가 점점 늘어난다.

이런 문제를 해결하기 위해 책임 연쇄 패턴을 적용한다. 

- `핸들러(handler)`라는 독립 실행형 객체들로 각 기능에 대한 책임을 분리한다.
  - 예를 들면 인증 핸들러, 인가 핸들러 등으로 여러 핸들러들로 책임을 분할한다. 
- 핸들러들은 하나의 체인으로 연결되어 자신이 맡은 책임에 대해 처리 후 다음 핸들러에게 요청을 전달한다. 
- 핸들러 결정에 따라 요청을 위한 체인을 계속 진행하지 않고 추가 처리를 중지할 수 있다.
- 다음과 같은 문제를 해결할 수 있다.
  - 책임 연쇄 패턴을 적용하면 코드의 복잡도가 줄어든다.
  - 비슷한 검증이 필요한 다른 시스템들은 자신의 상황에 맞는 핸들러들로 체인을 조합하여 사용한다.   

<p align="center">
  <img src="/images/posts/2024/chain-of-responsibility-pattern-03.png" width="80%" class="image__border">
</p>
<center>https://refactoring.guru/ko/design-patterns/chain-of-responsibility</center>

## 2. Structure

책임 연쇄 패턴은 다음과 같은 구조를 갖는다.

- 핸들러(handler)
  - 핸들러의 책임을 명시한다.
  - 요청을 처리하기 위한 메서드가 있다.
  - 체인의 다음 핸들러를 세팅하기 위한 메서드가 추가적으로 있을 수 있다.
- 기초 핸들러(base handler)
  - 선택적(optional)으로 구현하며 공통적인 코드를 넣는다.
- 구현 핸들러(concrete handler)
  - 요청을 처리하기 위한 실제 코드가 포함되어 있다.
  - 요청을 받으면 요청을 처리할지 체인의 다른 핸들러에게 전달하지 결정한다.
  - 요청을 처리하면 체인을 계속 진행할지 중단할지 결정한다.
- 클라이언트(client)
  - 핸들러 체인에게 요청을 전달한다.
  - 핸들러 체인은 동적으로 구성할 수 있다.

<p align="center">
  <img src="/images/posts/2024/chain-of-responsibility-pattern-04.png" width="40%" class="image__border image__padding">
</p>
<center>https://refactoring.guru/ko/design-patterns/chain-of-responsibility</center>

## 3. Considerations

다음과 같은 상황에 책임 연쇄 패턴을 적용한다.

- 애플리케이션이 다양한 방식으로 다양한 종류의 요청들을 처리하지만, 정확한 요청 유형들과 순서를 미리 알 수 없다.
- 메시지를 받을 받을 객체를 명시하지 않은 채 여러 객체들 중 하나에게 처리를 요청한다.
- 요청을 처리할 수 있는 객체 집합이 동적으로 변경될 수 있어야 한다. 

책임 연쇄 패턴에서 체인을 구성하는 핸들러들은 개발자가 계획한 특정 순서대로 실행되어야 한다. 다음과 같은 장점이 있다.

- 단일 책임 원칙을 따른다. 
  - 각 핸들러는 자신이 맡은 책임만 처리한다.
  - 큰 책임을 여러 핸들러 객체에게 분산시킬 수 있다.
- 개방-폐쇄 원칙을 따른다.
  - 새로운 비즈니스 케이스가 생기면 새로운 핸들러를 추가하고 핸들러 체인에 추가한다.
  - 기존 코드를 손상시키지 않고 기능을 확장할 수 있다.
- 객체 간의 행동적 결합도가 적어진다.
  - 다른 핸들러 객체가 어떻게 요청을 처리하는지 몰라도 된다.
  - 단지 요청을 보내는 객체는 이 메시지가 적절하게 처리될 것이라는 것만 확신하면 된다.
- 객체에게 책임을 할당하는 데 유연성을 높일 수 있다.
  - 런타임에 객체 연결 고리를 변경하거나 추가하여 책임을 변경하거나 확장할 수 있다.

다음과 같은 단점이 있다.

- 메시지 수신이 보장되지 않는다.
  - 어떤 핸들러 객체가 이 처리에 대한 수신을 담당한다는 것을 명시하지 않으므로 요청이 처리된다는 보장이 없다.
  - 객체들 간의 연결 고리가 잘 정의되지 않았다면 요청은 처리되지 못한 채로 버려질 수 있다.
- 체인의 순서가 런타임에 동적으로 결정되는 경우 디버깅이 어렵다.

## 4. An example in Spring Security

스프링 프레임워크의 서블릿 필터 체인(servlet filter chain)도 책임 연쇄 패턴의 좋은 예이지만, 서블릿 필터 체인을 확장한 스프링 시큐리티 프레임워크의 시큐리티 필터 체인도 좋은 에시 중 하나이다. 인증이나 인가, 공격 방어에 대한 책임들을 여러 필터들로 분리하고 이들을 하나의 필터 체인으로 연결했다. 

Filter 클래스를 살펴보면 doFilter 메서드가 선언되어 있다. 구현 클래스들은 이 메서드 내부에서 자신의 책임을 수행한다. 

```java
public interface Filter {
    default void init(FilterConfig filterConfig) throws ServletException {
    }

    void doFilter(
        ServletRequest request, 
        ServletResponse response, 
        FilterChain chain
    ) throws IOException, ServletException;

    default void destroy() {
    }
}
```

실제 구현 클래스 중 하나를 살펴보자. SecurityContextHolderFilter 클래스는 다음과 같이 자신의 책임을 수행한다. SecurityContextHolderFilter 객체는 인증된 사용자 정보를 저장소에서 불러오는 책임을 갖는다. 

1. 기존에 인증된 사용자인 경우 사용자 정보를 불러온다.
2. 인증된 사용자 정보를 시큐리티 컨텍스트 홀더(security context holder)에 저장한다.
3. 필터 체인 객체를 통해 요청을 다음 필터에게 전달한다.

```java
public class SecurityContextHolderFilter extends GenericFilterBean {

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        this.doFilter((HttpServletRequest)request, (HttpServletResponse)response, chain);
    }

    private void doFilter(
        HttpServletRequest request, 
        HttpServletResponse response, 
        FilterChain chain
    ) throws ServletException, IOException {
        if (request.getAttribute(FILTER_APPLIED) != null) {
            chain.doFilter(request, response);
        } else {
            request.setAttribute(FILTER_APPLIED, Boolean.TRUE);
            Supplier<SecurityContext> deferredContext = this.securityContextRepository.loadDeferredContext(request); // 1
            try {
                this.securityContextHolderStrategy.setDeferredContext(deferredContext); // 2
                chain.doFilter(request, response); // 3
            } finally {
                this.securityContextHolderStrategy.clearContext();
                request.removeAttribute(FILTER_APPLIED);
            }

        }
    }
}
```

스프링 시큐리티 필터 체인에 적용된 책임 연쇄 패턴을 클래스 다이어그램으로 다시 살펴보자. 다이어그램에 정리된 필터 외에 더 많은 필터들이 인증, 인가에 참여한다.

- 시큐리티 필터 체인을 구성하는 필터들은 Filter 인터페이스를 구현한다.
  - 각 필터들은 자신이 맡은 책임을 처리한다.
  - 각 필터들은 지정된 순서에 따라 실행된다.
  - 예를 들어 
    - SecurityContextHolderFilter 객체는 인증된 사용자 정보를 저장소에서 불러온다.
    - CsrfFilter 객체는 CSRF 공격을 방어한다.
    - LogoutFilter 객체는 로그아웃을 수행한다.
    - UsernamePasswordAuthenticationFilter 객체는 아이디, 비밀번호로 사용자 인증을 수행한다.
    - AnonymousAuthenticationFilter 객체는 인증되지 않은 사용자에게 익명 사용자 정보를 지정한다.
    - ExceptionTranslationFilter 객체는 인증, 인가 예외 처리를 수행한다.
    - AuthorizationFilter 객체는 인가 처리를 수행한다.
- 요청 정보는 HttpServletRequest, 응답 정보는 HttpServletResponse 객체에 담겨 있다.
- 핸들러 역할을 수행하는 필터들은 서로의 존재를 모르고 FilterChain 인스턴스를 통해 다음 필터에게 요청을 건낸다.

<p align="center">
  <img src="/images/posts/2024/chain-of-responsibility-pattern-05.png" width="100%" class="image__border">
</p>

#### REFERENCE

- [Gangs of Four (GoF) Design Patterns](https://product.kyobobook.co.kr/detail/S000000676784)
- <https://refactoring.guru/ko/design-patterns/chain-of-responsibility>
- <https://www.cs.unc.edu/~stotts/GOF/hires/pat5afso.htm>