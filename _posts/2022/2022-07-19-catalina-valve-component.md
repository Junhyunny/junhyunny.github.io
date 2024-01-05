---
title: "Catalina Valve Component"
search: false
category:
  - server
last_modified_at: 2022-07-19T23:55:00
---

<br/>

## 0. 들어가면서

[Spring Cloud Sleuth][spring-cloud-sleuth-link] 포스트를 작성하면서 트레이스(trace), 스판(span) 아이디가 어느 시점에 생기는지 분석해봤습니다. 
필터로 예상했지만, 생각과 다르게 `TraceValve` 클래스에서 트레이스, 스판 아이디를 생성하고 있었습니다. 
`Catalina` 컨테이너의 `CoyoteAdapter` 클래스에서 `TraceValve` 클래스를 호출하였는데, 시점이 서블릿 필터(servlet filter) 진입 전이었습니다. 
필터 기능 이전에도 이렇게 전처리 기능이 있었다는 사실에 놀랐고, 관련된 내용을 정리해보았습니다.

## 1. TraceValve 클래스

이번 포스트 주제의 계기를 만든 `TraceValve` 클래스를 살펴보겠습니다.

* `ValveBase` 추상 클래스를 상속받습니다.
    * `ValveBase` 추상 클래스는 `Valve` 인터페이스를 구현합니다.
* `invoke` 메소드를 오버라이드(override)하여 필요한 기능들을 수행합니다.
* `CurrentTraceContext` 클래스 `maybeScope` 메소드에서 트레이스, 스판 아이디를 생성합니다.
* 다음 `Valve` 객체가 존재하면 이를 실행합니다.

```java
package org.springframework.cloud.sleuth.instrument.web.tomcat;

import java.io.IOException;

import javax.servlet.ServletException;

import org.apache.catalina.Valve;
import org.apache.catalina.connector.Request;
import org.apache.catalina.connector.Response;
import org.apache.catalina.valves.ValveBase;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cloud.sleuth.CurrentTraceContext;
import org.springframework.cloud.sleuth.Span;
import org.springframework.cloud.sleuth.SpanCustomizer;
import org.springframework.cloud.sleuth.TraceContext;
import org.springframework.cloud.sleuth.http.HttpServerHandler;
import org.springframework.cloud.sleuth.instrument.web.servlet.HttpServletRequestWrapper;
import org.springframework.cloud.sleuth.instrument.web.servlet.HttpServletResponseWrapper;
import org.springframework.core.log.LogAccessor;
import org.springframework.lang.NonNull;

public class TraceValve extends ValveBase {

    private static final LogAccessor log = new LogAccessor(TraceValve.class);

    private HttpServerHandler httpServerHandler;

    private CurrentTraceContext currentTraceContext;

    private final ObjectProvider<HttpServerHandler> httpServerHandlerProvider;

    private final ObjectProvider<CurrentTraceContext> currentTraceContextProvider;

    public TraceValve(@NonNull HttpServerHandler httpServerHandler, @NonNull CurrentTraceContext currentTraceContext) {
        this.httpServerHandler = httpServerHandler;
        this.currentTraceContext = currentTraceContext;
        this.httpServerHandlerProvider = null;
        this.currentTraceContextProvider = null;
        setAsyncSupported(true);
    }

    public TraceValve(@NonNull ObjectProvider<HttpServerHandler> httpServerHandler,
            @NonNull ObjectProvider<CurrentTraceContext> currentTraceContext) {
        this.httpServerHandler = null;
        this.currentTraceContext = null;
        this.httpServerHandlerProvider = httpServerHandler;
        this.currentTraceContextProvider = currentTraceContext;
        setAsyncSupported(true);
    }

    @Override
    public void invoke(Request request, Response response) throws IOException, ServletException {
        Object attribute = request.getAttribute(Span.class.getName());
        if (attribute != null) {
            try (CurrentTraceContext.Scope ws = currentTraceContext().maybeScope(((Span) attribute).context())) {
                Valve next = getNext();
                if (null == next) {
                    return;
                }
                next.invoke(request, response);
                return;
            }
        }
        Exception ex = null;
        Span handleReceive = httpServerHandler().handleReceive(HttpServletRequestWrapper.create(request.getRequest()));
        if (log.isDebugEnabled()) {
            log.debug("Created a server receive span [" + handleReceive + "]");
        }
        request.setAttribute(SpanCustomizer.class.getName(), handleReceive);
        request.setAttribute(TraceContext.class.getName(), handleReceive.context());
        request.setAttribute(Span.class.getName(), handleReceive);
        try (CurrentTraceContext.Scope ws = currentTraceContext().maybeScope(handleReceive.context())) {
            Valve next = getNext();
            if (null == next) {
                return;
            }
            next.invoke(request, response);
        }
        catch (Exception exception) {
            ex = exception;
            throw exception;
        }
        finally {
            httpServerHandler().handleSend(
                    HttpServletResponseWrapper.create(request.getRequest(), response.getResponse(), ex), handleReceive);
            if (log.isDebugEnabled()) {
                log.debug("Handled send of span [" + handleReceive + "]");
            }
        }
    }

    private HttpServerHandler httpServerHandler() {
        if (this.httpServerHandler == null) {
            this.httpServerHandler = this.httpServerHandlerProvider.getIfAvailable();
        }
        return this.httpServerHandler;
    }

    private CurrentTraceContext currentTraceContext() {
        if (this.currentTraceContext == null) {
            this.currentTraceContext = this.currentTraceContextProvider.getIfAvailable();
        }
        return this.currentTraceContext;
    }

}
```

## 2. Catalina Container Valve Component

`TraceValve` 클래스의 최상위 `Valve` 인터페이스 통해 카탈리나(catalina) 컨테이너가 `Slueth`에서 정의한 기능을 호출해주는 것을 확인했습니다. 
그러면 카탈리나 컨테이너에서 `Valve`라는 인터페이스가 어떤 역할을 수행하는지 알아볼 필요가 있다고 생각했습니다. 

공식 문서를 살펴보면 다음과 같이 설명되어 있습니다. 

> A Valve element represents a component that will be inserted into the request processing pipeline for the associated Catalina container (Engine, Host, or Context). 
> Individual Valves have distinct processing capabilities, and are described individually below.

`Tomcat 4`에서 처음 소개된 기능입니다. 
`Valve` 컴포넌트는 카탈리나 컨테이너와 연관된 요청 파이프라인에 추가되어 각각 특정 전처리를 수행합니다. 

### 2.1. CoyoteAdapter 클래스

`Valve` 컴포넌트를 실행하는 `CoyoteAdapter` 클래스를 살펴보았습니다.

* 오버라이드 한 `service` 메소드에서 `Valve` 컴포넌트를 실행합니다.
* connector 객체의 체이닝(chaining)을 통해 파이프 라인의 첫 번째 `Valve` 컴포넌트를 `invoke` 합니다.
* connector 객체의 체이닝 메소드 별 동작을 확인해보았습니다.
    * .getService() - 요청 처리를 위한 단일 컨테이너를 공유하는 커넥터(connector)들의 모임인 Service 객체 반환
    * .getContainer() - 전체 카탈리나 서블릿 엔진을 대표하는 Egine 객체 반환
    * .getPipeline() - `Valve` 컴포넌트의 집합인 PipeLine 객체 반환
    * .getFirst() - 첫 번째 `Valve` 객체 반환
    * .invoke(request, response) - `Valve` 객체 실행

```java
package org.apache.catalina.connector;

// ... imports

public class CoyoteAdapter implements Adapter {

    // fields

    private final Connector connector;

    @Override
    public void service(org.apache.coyote.Request req, org.apache.coyote.Response res) throws Exception {

        Request request = (Request) req.getNote(ADAPTER_NOTES);
        Response response = (Response) res.getNote(ADAPTER_NOTES);

        // ...

        boolean async = false;
        boolean postParseSuccess = false;

        req.getRequestProcessor().setWorkerThreadName(THREAD_NAME.get());
        req.setRequestThread();

        try {
            // Parse and set Catalina and configuration specific request parameters
            postParseSuccess = postParseRequest(req, request, res, response);
            if (postParseSuccess) {
                //check valves if we support async
                request.setAsyncSupported(
                        connector
                            .getService()
                            .getContainer()
                            .getPipeline()
                            .isAsyncSupported()
                        );

                // Calling the container
                connector
                    .getService()
                    .getContainer()
                    .getPipeline()
                    .getFirst()
                    .invoke(request, response); // 
            }
            
            // ...
            
        } catch (IOException e) {
            // Ignore
        } finally {
            // ...
        }
    }
}
```

### 2.2. Valve 컴포넌트 실행

웹 어플리케이션에 한정되어 동작하는 서블릿 필터와 다르게 컨테이너 레벨에서 동작합니다. 

* 웹 어플리케이션이 아닌 카탈리나 컨테이너에 위치합니다.
* 서블릿 필터가 동작하기 전에 실행됩니다.

<p align="center">
    <img src="/images/catalina-valve-component-1.JPG" width="80%" class="image__border">
</p>
<center>https://m.blog.naver.com/gallechess/221047184041</center>

### 2.3. Valve 컴포넌트 종류

상세하게 살펴보면 톰캣 버전에 따라 다르지만, 기본적으로 다음과 같은 `Valve` 컴포넌트들로 구성됩니다.

* Access Log Valve
    * 다음과 같은 내용들을 추적합니다.
    * 페이지 히트 수(hit count)
    * 사용자 세션 활성
    * 사용자 인증 정보
* Remote Address Filter Valve
    * 요청을 보낸 클라이언트의 IP 주소를 하나 이상의 정규식과 비교합니다.
    * 비교 결과에 따라 요청이 계속되지 않도록 허용하거나 방지할 수 있습니다.
* Remote Host Filter Valve
    * Remote Address filter 기능과 유사합니다.
    * 고정 IP 대신 요청을 보낸 클라이언트의 원격 호스트 주소를 비교합니다.
* Request Dumper Valve
    * 지정된 요청 및 응답과 관련된 HTTP 헤더를 해당 컨테이너와 연결된 로거(logger)에 덤프(dump)하는 디버깅 도구입니다.
    * 특히 HTTP 클라이언트가 보낸 헤더 또는 쿠키와 관련된 문제를 해결할 때 유용합니다.
    * `<TOMCAT_HOME>/logs/catalina_log` 파일에서 해당 컴포넌트에 의해 만들어진 엔트리(entry)들을 볼 수 있습니다.

#### REFERENCE

* <https://tomcat.apache.org/tomcat-8.0-doc/config/valve.html#Introduction>
* <https://tomcat.apache.org/tomcat-8.5-doc/api/org/apache/catalina/valves/ValveBase.html>
* <https://www.oxxus.net/tutorials/tomcat/tomcat-valve>
* <https://m.blog.naver.com/gallechess/221047184041>

[spring-cloud-sleuth-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-sleuth/