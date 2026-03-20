---
title: "카탈리나(catalina) 밸브(valve) 컴포넌트"
search: false
category:
  - server
last_modified_at: 2026-03-20T12:40:32+09:00
---

<br/>

## 0. 들어가면서

[Spring Cloud Sleuth에 관련된 글][spring-cloud-sleuth-link]을 작성하면서 트레이스(trace), 스팬(span) 아이디가 어느 시점에 생기는지 분석해 봤다. 필터로 예상했지만, 생각과 다르게 `TraceValve` 객체에서 트레이스, 스팬 아이디를 생성하고 있었다. `Catalina` 컨테이너의 `CoyoteAdapter` 클래스에서 `TraceValve` 클래스를 호출하였는데, 시점이 서블릿 필터(servlet filter) 진입 전이었다. 필터 기능 이전에도 이렇게 전처리 기능이 있었다는 사실에 놀랐고, 관련된 내용을 정리해 보았다.

## 1. TraceValve 클래스

이번 글 주제인 `TraceValve` 클래스를 먼저 살펴보자.

- `ValveBase` 추상 클래스를 상속받는다. `ValveBase` 추상 클래스는 Valve 인터페이스를 구현한다.
- `invoke` 메서드를 오버라이드(override)하여 필요한 기능들을 수행한다.
- `CurrentTraceContext` 클래스의 `maybeScope` 메서드에서 트레이스, 스팬 아이디를 생성한다. 필터 체인처럼 다음 Valve 객체가 존재하면 이를 실행한다.

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

`TraceValve` 클래스는 Valve 인터페이스로 추상화되어 있다. 카탈리나(catalina) 컨테이너는 `Sleuth`에서 정의한 밸브 기능을 호출한다. 카탈리나 컨테이너에서 Valve 인터페이스는 어떤 책임을 갖고 있는 인터페이스일까? 공식 문서를 살펴보면 다음과 같이 설명되어 있다.

> A Valve element represents a component that will be inserted into the request processing pipeline for the associated Catalina container (Engine, Host, or Context). 
> Individual Valves have distinct processing capabilities, and are described individually below.

Valve 컴포넌트는 `Tomcat 4`에서 처음 소개된 기능이다. 카탈리나 컨테이너와 연관된 요청 파이프라인에 추가되어 각각 특정 전처리를 수행한다. Valve 컴포넌트를 실행하는 `CoyoteAdapter` 클래스를 살펴보자.

- 오버라이드 한 `service` 메서드에서 Valve 컴포넌트를 실행한다.
- connector 객체의 체이닝(chaining)을 통해 파이프라인의 첫 번째 Valve 컴포넌트를 `invoke` 한다.
- connector 객체의 체이닝 메서드 별 동작을 확인해 보았다.
  - .getService() - 요청 처리를 위한 단일 컨테이너를 공유하는 커넥터(connector)들의 모임인 Service 객체 반환
  - .getContainer() - 전체 카탈리나 서블릿 엔진을 대표하는 Engine 객체 반환
  - .getPipeline() - Valve 컴포넌트의 집합인 PipeLine 객체 반환
  - .getFirst() - 첫 번째 Valve 객체 반환
  - .invoke(request, response) - Valve 객체 실행

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

웹 애플리케이션에 한정되어 동작하는 서블릿 필터와 다르게 컨테이너 레벨에서 동작한다.

- 밸브 컴포넌트는 웹 애플리케이션이 아닌 카탈리나 컨테이너에 위치한다. 서블릿 필터가 동작하기 전에 실행된다.

<div align="center">
  <img src="/images/posts/2022/catalina-valve-component-01.png" width="80%" class="image__border">
</div>
<center>https://m.blog.naver.com/gallechess/221047184041</center>

<br/>

상세하게 살펴보면 톰캣 버전에 따라 다르지만, 기본적으로 다음과 같은 Valve 컴포넌트들이 컨테이너에서 실행된다.

- Access Log Valve
  - 다음과 같은 내용들을 추적한다.
  - 페이지 히트 수(hit count), 사용자 세션 활성, 사용자 인증 정보 등의 작업을 수행한다.
- Remote Address Filter Valve
  - 요청을 보낸 클라이언트의 IP 주소를 하나 이상의 정규식과 비교한다.
  - 비교 결과에 따라 요청이 계속되지 않도록 허용하거나 방지할 수 있다.
- Remote Host Filter Valve
  - Remote Address filter 기능과 유사하다.
  - 고정 IP 대신 요청을 보낸 클라이언트의 원격 호스트 주소를 비교한다.
- Request Dumper Valve
  - 지정된 요청 및 응답과 관련된 HTTP 헤더를 해당 컨테이너와 연결된 로거(logger)에 덤프(dump)하는 디버깅 도구이다.
  - 특히 HTTP 클라이언트가 보낸 헤더 또는 쿠키와 관련된 문제를 해결할 때 유용하다.
  - `<TOMCAT_HOME>/logs/catalina_log` 파일에서 해당 컴포넌트에 의해 만들어진 엔트리(entry)들을 볼 수 있다.

#### REFERENCE

- <https://tomcat.apache.org/tomcat-8.0-doc/config/valve.html#Introduction>
- <https://tomcat.apache.org/tomcat-8.5-doc/api/org/apache/catalina/valves/ValveBase.html>
- <https://www.oxxus.net/tutorials/tomcat/tomcat-valve>
- <https://m.blog.naver.com/gallechess/221047184041>

[spring-cloud-sleuth-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-sleuth/