---
title: "스프링 DelegatingFilterProxy 클래스"
search: false
category:
  - java
  - spring
  - spring-boot
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

## 0. 들어가면서

스프링 시큐리티(spring security)는 서블릿 필터 체인을 확장하여 인증, 인가 처리를 수행한다. 이 과정에서 DelegatingFilterProxy 클래스를 사용한다. 스프링 시큐리티는 직접 서블릿 필터들을 만들지 않고 DelegatingFilterProxy 클래스를 통해 서블릿 필터 체인을 확장했는지 궁금했다. 이번 포스트는 관련된 내용에 대해 정리하였다.

## 1. Legacy Spring MVC

스프링 MVC 프레임워크 초기엔 톰캣 같은 서블릿 컨테이너(servlet container)와 스프링 애플리케이션은 서로 다른 영역이었기 때문에 서블릿 필터를 스프링 빈(bean)으로 사용하거나 서블릿 필터에서 스프링 빈을 사용하는 것이 어려웠다고 한다. 이는 서블릿 컨테이너의 컨텍스트(context)가 준비되는 시점과 스프링의 애플리케이션 컨텍스트가 준비되는 시점이 다르기 때문이다.

1. 서블릿 컨텍스트가 먼저 준비된다.
  - 서블릿 컨텍스트를 준비하는 과정에서 서블릿 필터들을 생성하고 필터 체인에 등록한다.
2. 다음 애플리케이션 컨텍스트가 만들어진다.
  - 애플리케이션 컨텍스트를 준비하는 과정에서 스프링 빈들이 생성된다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/delegating-filter-proxy-01.png" width="100%" class="image__border">
</div>

### 1.1. DelegatingFilterProxy Class

DelegatingFilterProxy 클래스는 스프링 빈으로 등록된 필터를 사용하기 위해 스프링 1.2 버전에 추가되었다. 클래스 이름처럼 전달받은 작업을 전달하는 대리인(proxy) 역할을 수행하는 클래스이다. 다음과 같은 방법으로 DelegatingFilterProxy 인스턴스는 스프링 필터 빈에게 요청을 전달한다.

1. 서블릿 컨텍스트가 준비된다.
  - DelegatingFilterProxy 인스턴스는 이 시점에 서블릿 필터로 등록된다.
  - 인스턴스가 생성될 때 누구의 대리인 역할을 수행하는 것인지 스프링 필터 빈의 이름을 지정한다.
2. 애플리케이션 컨텍스트가 준비된다.
  - 서블릿 필터가 스프링 빈으로서 생성된다.
3. DelegatingFilterProxy 인스턴스가 요청을 받는다.
4. DelegatingFilterProxy 인스턴스는 스프링 빈을 탐색 후 요청을 전달한다.
  - 지정된 스프링 필터 빈을 이름으로 애플리케이션 컨텍스트에서 탐색한다.
  - 탐색된 필터가 있다면 해당 요청을 전달한다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/delegating-filter-proxy-02.png" width="80%" class="image__border">
</div>

### 1.2. Inside DelegatingFilterProxy Class

코드를 통해 동작 과정을 확인한다.

- doFilter 메서드
  - 요청을 위임할 필터가 존재하는지 확인한다.
  - 요청을 위임할 필터가 없는 경우 WebApplicationContext 인스턴스를 사용해 스프링 필터 빈을 탐색한다.
  - 이전에 사용한 필터가 있는 경우 요청을 위임한다.
- initDelegate 메서드
  - 등록된 빈 이름을 사용해 WebApplicationContext 인스턴스에 빈을 탐색한다.
  - 필터 빈을 찾은 경우 초기화 후 반환한다.
- invokeDelegate 메서드
  - 탐색한 필터에게 요청을 위임한다.

```java
public class DelegatingFilterProxy extends GenericFilterBean {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Filter delegateToUse = this.delegate;
        if (delegateToUse == null) {
            synchronized (this.delegateMonitor) {
                delegateToUse = this.delegate;
                if (delegateToUse == null) {
                    WebApplicationContext wac = findWebApplicationContext();
                    if (wac == null) {
                        throw new IllegalStateException("No WebApplicationContext found: " +
                                "no ContextLoaderListener or DispatcherServlet registered?");
                    }
                    delegateToUse = initDelegate(wac);
                }
                this.delegate = delegateToUse;
            }
        }

        invokeDelegate(delegateToUse, request, response, filterChain);
    }

    protected Filter initDelegate(WebApplicationContext wac) throws ServletException {
        String targetBeanName = getTargetBeanName();
        Assert.state(targetBeanName != null, "No target bean name set");
        Filter delegate = wac.getBean(targetBeanName, Filter.class);
        if (isTargetFilterLifecycle()) {
            delegate.init(getFilterConfig());
        }
        return delegate;
    }

    protected void invokeDelegate(
            Filter delegate, ServletRequest request, ServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        delegate.doFilter(request, response, filterChain);
    }
}
```

## 2. Servlet Filter in Spring Boot

DelegatingFilterProxy 클래스는 서블릿 필터 체인에서 직접 사용할 수 없는 스프링 빈 필터를 필터 체인에 등록하는 작업을 실제 사용되는 시점까지 지연 로딩(lazy loading)을 통해 늦춘 기능이다. 스프링 부트(spring boot)에선 스프링 빈 필터를 서블릿 필터 체인에 직접 추가할 수 있기 때문에 DelegatingFilterProxy 클래스의 필요성이 다소 낮다.

스프링 부트 프레임워크는 내장 톰캣을 사용하고 내부적으로 ServletContainerInitializer 인스턴스를 통해 서블릿 컨텍스트에 직접 스프링 필터 빈을 주입할 수 있다. 내장 톰캣을 사용하는 경우 TomcatStarter 구현체 클래스가 사용된다.

- onStartup 메서드
  - 서블릿 컨테이너를 초기화하는 과정에서 호출된다.
  - 이 과정을 통해 스프링 애플리케이션 컨텍스트에서 만들어지는 인스턴스들이 서블릿 컨텍스트에 추가된다.

```java
class TomcatStarter implements ServletContainerInitializer {

    private static final Log logger = LogFactory.getLog(TomcatStarter.class);

    private final ServletContextInitializer[] initializers;

    private volatile Exception startUpException;

    TomcatStarter(ServletContextInitializer[] initializers) {
        this.initializers = initializers;
    }

    @Override
    public void onStartup(Set<Class<?>> classes, ServletContext servletContext) throws ServletException {
        try {
            for (ServletContextInitializer initializer : this.initializers) {
                initializer.onStartup(servletContext);
            }
        }
        catch (Exception ex) {
            this.startUpException = ex;
            if (logger.isErrorEnabled()) {
                logger.error("Error starting Tomcat context. Exception: " + ex.getClass().getName() + ". Message: "
                        + ex.getMessage());
            }
        }
    }

    Exception getStartUpException() {
        return this.startUpException;
    }

}
```

## CLOSING

필자가 개발자 커리어를 시작했을 땐 이미 스프링 부트 프레임워크가 활발하게 사용되는 시점이었다. 주니어 시절에 레거시 시스템을 만져볼 기회가 별로 없다보니 비즈니스 로직에만 집중할 수 있는 쉬운 개발 환경 설정이 당연했었다. 회사를 옮기면서 여러 프로젝트를 경험하다보니 레거시 시스템을 다루는 일들이 많아졌고, 당시에 쉽게 추가했던 서블릿 필터도 XML 설정 파일을 수작업으로 변경하면서 어려움을 겪었던 기억이 난다. 요즘은 스프링이라는 자동화 된 프레임워크가 개발자에게 봄을 가져다 주었다는 말에 크게 공감되고, 고마울 따름이다.

#### REFERENCE

- <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/filter/DelegatingFilterProxy.html>
- <https://mangkyu.tistory.com/221>
