---
title: "DelegatingFilterProxy Class in Spring"
search: false
category:
  - java
  - spring
  - spring-boot
last_modified_at: 2023-10-08T23:55:00
---

<br/>

## 0. 들어가면서

스프링 시큐리티(spring security)는 서블릿 필터 체인을 확장하여 인증, 인가 처리를 수행합니다. 
이 과정에서 DelegatingFilterProxy 클래스를 사용합니다. 
스프링 시큐리티는 직접 서블릿 필터들을 만들지 않고 DelegatingFilterProxy 클래스를 통해 서블릿 필터 체인을 확장했는지 궁금했습니다. 
이번 포스트는 관련된 내용에 대해 정리하였습니다. 

## 1. Legacy Spring MVC

스프링 MVC 프레임워크 초기엔 톰캣 같은 서블릿 컨테이너(servlet container)와 스프링 어플리케이션은 서로 다른 영역이었기 때문에 서블릿 필터를 스프링 빈(bean)으로 사용하거나 서블릿 필터에서 스프링 빈을 사용하는 것이 어려웠다고 합니다. 
이는 서블릿 컨테이너의 컨텍스트(context)가 준비되는 시점과 스프링의 어플리케이션 컨텍스트가 준비되는 시점이 다르기 때문입니다. 

1. 서블릿 컨텍스트가 먼저 준비됩니다. 
    * 서블릿 컨텍스트를 준비하는 과정에서 서블릿 필터들을 생성하고 필터 체인에 등록합니다.
2. 다음 어플리케이션 컨텍스트가 만들어집니다.
    * 어플리케이션 컨텍스트를 준비하는 과정에서 스프링 빈들이 생성됩니다.

<p align="center">
    <img src="/images/delegating-filter-proxy-1.JPG" width="100%" class="image__border">
</p>

### 1.1. DelegatingFilterProxy Class
 
DelegatingFilterProxy 클래스는 스프링 빈으로 등록된 필터를 사용하기 위해 스프링 1.2 버전에 추가되었습니다. 
클래스 이름처럼 전달받은 작업을 전달하는 대리자(proxy) 역할을 수행하는 클래스입니다. 
다음과 같은 방법으로 DelegatingFilterProxy 인스턴스는 스프링 필터 빈에게 요청을 전달합니다. 

1. 서블릿 컨텍스트가 준비됩니다.
    * DelegatingFilterProxy 인스턴스는 이 시점에 서블릿 필터로 등록됩니다.
    * 인스턴스가 생성될 때 누구의 대리자 역할을 수행하는 것인지 스프링 필터 빈의 이름을 지정합니다. 
2. 어플리케이션 컨텍스트가 준비됩니다.
    * 서블릿 필터가 스프링 빈으로서 생성됩니다. 
3. DelegatingFilterProxy 인스턴스가 요청을 받습니다.
    * 지정된 스프링 필터 빈을 이름으로 어플리케이션 컨텍스트에서 탐색합니다.
    * 탐색된 필터가 있다면 해당 요청을 전달합니다.

<p align="center">
    <img src="/images/delegating-filter-proxy-2.JPG" width="80%" class="image__border">
</p>

### 1.2. Inside DelegatingFilterProxy Class 

코드를 통해 동작 과정을 확인합니다. 

* doFilter 메소드
    * 대리인 필터가 존재하는지 확인합니다.
    * 대리인 필터가 없는 경우 WebApplicationContext 인스턴스를 사용해 스프링 필터 빈을 탐색합니다.
    * 대리인 필터가 있는 경우 요청을 위임합니다.
* initDelegate 메소드
    * 등록된 빈 이름을 사용해 WebApplicationContext 인스턴스에 빈을 탐색합니다.
    * 필터 빈을 찾은 경우 초기화 후 반환합니다.
* invokeDelegate 메소드
    * 대리인 필터에게 요청을 위임합니다.

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

DelegatingFilterProxy 클래스는 서블릿 필터 체인에서 직접 사용할 수 없는 스프링 빈 필터를 지연 로딩(lazy loading)을 통해 필터가 실제로 사용되는 시점까지 필터 추가를 미루는 기능입니다. 
스프링 부트(spring boot)에선 스프링 빈 필터를 서블릿 필터 체인에 직접 추가할 수 있기 때문에 DelegatingFilterProxy 클래스의 필요성이 다소 낮습니다. 

스프링 부트 프레임워크는 내장 톰캣을 사용하고 내부적으로 ServletContainerInitializer 인스턴스를 통해 서블릿 컨텍스트에 직접 스프링 필터 빈을 주입할 수 있습니다. 
내장 톰캣을 사용하는 경우 TomcatStarter 구현체 클래스가 사용됩니다.

* onStartup 메소드
    * 서블릿 컨테이너를 초기화하는 과정 호출됩니다.
    * 이 과정을 통해 스프링 어플리케이션 컨텍스트에서 만들어지는 인스턴스들이 서블릿 컨텍스트에 추가됩니다. 

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

필자가 개발자 커리어를 시작했을 땐 이미 스프링 부트 프레임워크가 활발하게 사용되는 시점이었습니다.
주니어 시절에 레거시 시스템을 만져볼 기회가 별로 없다보니 비즈니스 로직에만 집중할 수 있는 쉬운 개발 환경 설정이 당연했었습니다. 
회사를 옮기면서 여러 프로젝트를 경험하다보니 레거시 시스템을 다루는 일들이 많아졌고, 당시에 쉽게 추가헀던 서블릿 필터도 XML 설정 파일을 수작업으로 변경하면서 어려움을 겪었던 기억이 납니다. 
요즘은 스프링이라는 자동화 된 프레임워크가 개발자에게 봄을 가져다 주었다는 말에 크게 공감되고, 고마울 따름입니다. 

#### REFERENCE

* <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/filter/DelegatingFilterProxy.html>
* <https://mangkyu.tistory.com/221>