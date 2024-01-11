---
title: "Session Management in Tomcat"
search: false
category:
  - information
  - server
last_modified_at: 2021-09-20T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Cookie and Session][cookie-session-link]
- [Filter, Interceptor and AOP in Spring][filter-interceptor-aop-link]

👉 이어서 읽기를 추천합니다.
- [Spring Session with JDBC][spring-session-link]

## 0. 들어가면서
이번 시스템 리뉴얼 중인 프로젝트의 코드를 보면 많은 사용자 정보가 세션에 담겨 사용되고 있었습니다. 
특히 로그인 성공시 많은 데이터가 세션에 추가되는데, 모바일 로그인 기능 추가를 위해 세션 동작을 정확히 이해할 필요가 있을 것 같아서 정리해보았습니다. 
`Tomcat` 서버, `JSP` 기술 스택을 기준으로 분석하였습니다. 

## 1. 세션(Session) 생성

### 1.1. 세션 생성 및 쿠키(Cookie) 세팅
처음 서버에 접근하는 시점엔 쿠키에 정보가 존재하지 않습니다. 
쿠키 정보는 응답 헤더를 통해 서버로부터 전달받습니다. 
서버 첫 응답을 통해 쿠키가 생성되며, 이후부터는 브라우저가 쿠키 정보를 스스로 요청 헤더(request header)에 추가합니다.

##### 첫 요청 정보와 그 이후 요청 정보의 차이점
- 첫 응답 헤더(header) `Set-Cookie` 항목에 `JSESSIONID` 값이 전달됩니다. 
- 그 이후 요청 헤더를 보면 `Cookie` 항목으로 전달받은 `JSESSIONID` 값이 들어갑니다.

<p align="center"><img src="/images/tomcat-session-management-1.JPG" width="100%"></p>

### 1.2. 세션 생성과 쿠키 생성 시점
처음 요청 시에는 없었던 쿠키 정보가 어느 시점에 생성되는지 디버깅(debugging)하여 코드를 살펴보았습니다. 
프로세스 순서를 크게 나눠보면 다음과 같습니다.
1. 컨트롤러(controller)에서 응답 값을 반환합니다.
1. `DispatcherServlet`에서 전달받은 페이지를 `JstlViewer` 객체를 이용하여 렌더링(rendering)합니다. 
1. 렌더링 수행 중 `JspServlet` 객체에 의해 PageContext 정보가 초기화되는 시점에 세션이 생성됩니다.
1. 세션을 생성하고 세션ID 정보를 응답 헤더에 쿠키로 담아서 전달합니다.

<p align="center"><img src="/images/tomcat-session-management-2.JPG" width="55%"></p>
<center>https://justforchangesake.wordpress.com/2014/05/07/spring-mvc-request-life-cycle/</center>

### 1.3. 세션(session) 생성 주요 클래스와 메소드

#### 1.3.1. Request 클래스 doGetSession 메소드
- org.apache.catalina.connector 패키지에 존재하는 Request 클래스의 doGetSession 메소드에서 세션(session) 생성을 수행합니다.
- createSession 메소드에서 중복되지 않는 세션ID를 만들고 세션 객체를 만들어 반환합니다.
- 세션이 생성되고 트랙킹 모드(tracking mode)에 쿠키가 포함된다면 세션 정보를 쿠키에 담고 응답 정보에 저장합니다.

```java
package org.apache.catalina.connector;

public class Request implements HttpServletRequest {

    // ...

    protected Session doGetSession(boolean create) {

        // ...

        // 세션 생성 및 세션ID 생성
        session = manager.createSession(sessionId);

        // Creating a new session cookie based on that session
        if (session != null && trackModesIncludesCookie) {
            Cookie cookie = ApplicationSessionCookieConfig.createSessionCookie(context, session.getIdInternal(), isSecure());
            // 응답에 세션 정보가 담긴 쿠키 정보 추가
            response.addSessionCookieInternal(cookie);
        }
    }
}
```

#### 1.3.2. Response 클래스 addSessionCookieInternal 메소드
- org.apache.catalina.connector 패키지에 존재하는 Response 클래스의 addSessionCookieInternal 메소드에서 쿠키 정보를 담습니다.

```java
package org.apache.catalina.connector;

public class Response implements HttpServletResponse {

    // ...

    public void addSessionCookieInternal(final Cookie cookie) {
        if (isCommitted()) {
            return;
        }
        String name = cookie.getName();
        final String headername = "Set-Cookie";
        final String startsWith = name + "=";
        String header = generateCookieString(cookie);
        boolean set = false;
        MimeHeaders headers = getCoyoteResponse().getMimeHeaders();
        int n = headers.size();
        for (int i = 0; i < n; i++) {
            if (headers.getName(i).toString().equals(headername)) {
                if (headers.getValue(i).toString().startsWith(startsWith)) {
                    headers.getValue(i).setString(header);
                    set = true;
                }
            }
        }
        if (!set) {
            addHeader(headername, header);
        }
    }
}
```

### 2. 세션(Session) 획득

#### 2.1. 쿠키(Cookie)를 활용한 세션ID 획득
첫 페이지 요청 시 만들어진 세션ID와 세션을 어떻게 획득하는지 확인해보았습니다. 
세션ID만 획득하면 어디에서든 세션 정보를 꺼낼 수 있습니다. 
그러므로 세션ID는 톰캣 영역에서 추출하는 시점만 디버깅을 통해 분석해보겠습니다. 

1. 세션ID는 요청을 받은 시점에 요청 헤더에 들어간 쿠키 정보에서 추출합니다. 
1. CoyoteAdapter 클래스의 postParseRequest 메소드에서 세션ID를 추출합니다. 
1. 세션 추적(tracking)을 URL을 통해 수행하는지 확인합니다.
1. URL에서 추출할 수 있다면 URL 요청 정보에서 세션ID를 획득합니다.
1. 요청 URL에서 추출하지 않는다면 parseSessionCookiesId 메소드를 통해 쿠키에서 세션ID를 추출합니다. 

<p align="center"><img src="/images/tomcat-session-management-3.JPG" width="55%"></p>
<center>https://justforchangesake.wordpress.com/2014/05/07/spring-mvc-request-life-cycle/</center>

### 2.2. 세션ID 획득 주요 클래스와 메소드

#### 2.2.1. CoyoteAdapter 클래스 postParseRequest 메소드
- org.apache.catalina.connector 패키지에 존재하는 CoyoteAdapter 클래스의 postParseRequest 메소드에서 다음 행위를 수행합니다.
    - 세션 추적 방법에 `URL`이 포함되는 경우 URL에서 추출합니다. (request.getPathParameter 메소드)
    - 쿠키에서 값을 추출합니다. (parseSessionCookiesId 메소드)
    - SSL(Secure Sokets Layer)을 사용하는 경우 복호화한 데이터에서 추출합니다. (parseSessionSslId 메소드)

```java
package org.apache.catalina.connector;

public class CoyoteAdapter implements Adapter {
    
    // ...

    protected boolean postParseRequest(org.apache.coyote.Request req, Request request, org.apache.coyote.Response res, Response response) throws IOException, ServletException {
        
        // ...

        while (mapRequired) {

            // ...

            String sessionID;
            if (request.getServletContext().getEffectiveSessionTrackingModes().contains(SessionTrackingMode.URL)) {
                // Get the session ID if there was one
                sessionID = request.getPathParameter(SessionConfig.getSessionUriParamName(request.getContext()));
                if (sessionID != null) {
                    request.setRequestedSessionId(sessionID);
                    request.setRequestedSessionURL(true);
                }
            }

            // Look for session ID in cookies and SSL session
            try {
                parseSessionCookiesId(request);
            } catch (IllegalArgumentException e) {
                // Too many cookies
                if (!response.isError()) {
                    response.setError();
                    response.sendError(400);
                }
                return true;
            }

            parseSessionSslId(request);

        // ...
        
        return true;
    }
}
```


#### 2.2.2. CoyoteAdapter 클래스 parseSessionCookiesId 메소드
- org.apache.catalina.connector 패키지에 존재하는 CoyoteAdapter 클래스의 parseSessionCookiesId 메소드에서 쿠키에 담긴 세션ID 값을 획득합니다.

```java
package org.apache.catalina.connector;

public class CoyoteAdapter implements Adapter {

    // ...

    protected void parseSessionCookiesId(Request request) {
        
        // ...

        Context context = request.getMappingData().context;
        if (context != null && !context.getServletContext().getEffectiveSessionTrackingModes().contains(SessionTrackingMode.COOKIE)) {
            return;
        }

        ServerCookies serverCookies = request.getServerCookies();
        int count = serverCookies.getCookieCount();
        if (count <= 0) {
            return;
        }

        String sessionCookieName = SessionConfig.getSessionCookieName(context);
        for (int i = 0; i < count; i++) {
            ServerCookie scookie = serverCookies.getCookie(i);
            if (scookie.getName().equals(sessionCookieName)) {
                // Override anything requested in the URL
                if (!request.isRequestedSessionIdFromCookie()) {
                    // Accept only the first session id cookie
                    convertMB(scookie.getValue());
                    request.setRequestedSessionId(scookie.getValue().toString());
                    request.setRequestedSessionCookie(true);
                    request.setRequestedSessionURL(false);
                    if (log.isDebugEnabled()) {
                        log.debug(" Requested cookie session id is " + request.getRequestedSessionId());
                    }
                } else {
                    if (!request.isRequestedSessionIdValid()) {
                        // Replace the session id until one is valid
                        convertMB(scookie.getValue());
                        request.setRequestedSessionId(scookie.getValue().toString());
                    }
                }
            }
        }
    }
}
```

### 2.3. 각 영역에서 세션 획득하기
Spring 프레임워크를 이용하면 개발자는 필터, 인터셉터, 컨트롤러 각 영역에서 쉽게 세션 정보를 획득할 수 있습니다. 
아래 예제 코드를 통해 세션을 획득하는 방법을 정리하였습니다.

#### 2.3.1. 필터 영역에서 세션 획득
- `ServletRequest` 객체로부터 세션을 획득할 수 있습니다.
- 필터 클래스를 상속받는 경우 오버라이드 한 메소드의 파라미터는 `ServletRequest` 클래스이므로 `HttpServletRequest` 클래스로 형변환(casting)하여 사용합니다.
- 필터에서 세션에 접근 성공한 횟수를 파악하기 위해 카운트하는 코드를 추가합니다.

```java
package blog.in.action.filter;

import java.io.IOException;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import lombok.extern.log4j.Log4j2;

@Log4j2
public class BlogFilter implements Filter {

    private final String KEY = "filterCount";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        HttpSession session = ((HttpServletRequest) request).getSession(false);
        if (session != null) {
            Integer count = (Integer) session.getAttribute(KEY);
            if (count == null) {
                count = -1;
            }
            session.setAttribute(KEY, count + 1);
        }
        chain.doFilter(request, response);
    }
}
```

#### 2.3.2. 인터셉터 영역에서 세션 획득
- `HttpServletRequest` 객체로부터 세션을 획득할 수 있습니다.
- 인터셉터에서 세션에 접근 성공한 횟수를 파악하기 위해 카운트하는 코드를 추가합니다.

```java
package blog.in.action.interceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import lombok.extern.log4j.Log4j2;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

@Log4j2
public class BlogHandlerInterceptor implements HandlerInterceptor {

    private final String KEY = "interceptorCount";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        HttpSession session = request.getSession(false);
        if (session != null) {
            Integer count = (Integer) session.getAttribute(KEY);
            if (count == null) {
                count = -1;
            }
            session.setAttribute(KEY, count + 1);
        }
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
    }
}
```

#### 2.3.3. 컨트롤러 영역에서 세션 획득
- `ServletRequest` 객체로부터 세션을 획득할 수 있습니다.
- 컨트롤러 클래스의 메소드에서 전달받는 파라미터는 `ServletRequest` 클래스이므로 `HttpServletRequest` 클래스로 형변환(casting)하여 사용합니다.
- 컨트롤러에서 세션에 접근 성공한 횟수를 파악하기 위해 카운트하는 코드를 추가합니다.

```java
package blog.in.action.controller;

import javax.servlet.ServletRequest;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class PageController {

    private final String KEY = "controllerCount";

    @RequestMapping
    public ModelAndView index(ServletRequest request) {
        HttpSession session = ((HttpServletRequest) request).getSession(false);
        if (session != null) {
            Integer count = (Integer) session.getAttribute(KEY);
            if (count == null) {
                count = -1;
            }
            session.setAttribute(KEY, count + 1);
        }
        ModelAndView mav = new ModelAndView("/index");
        mav.addObject("session", session);
        return mav;
    }
}
```

### 2.4. 세션 획득 테스트
- 두 개의 브라우저를 이용하여 페이지를 요청합니다. (Chrome, Edge)
- 화면을 새로고침(F5)하여 서버에게 페이지를 요청합니다. 
- 각 화면 별로 기존 세션이 유지되므로 세션 접근 횟수가 증가됩니다. 
- 필터, 인터셉터 그리고 컨트롤러에서 몇 회 접근하였는지 화면으로 표기합니다. 
- 쿠키에 세션ID를 삭제하는 경우 세션이 없다는 메시지가 출력됩니다.

<p align="center"><img src="/images/tomcat-session-management-4.gif" width="100%"></p>

## 3. Session 만료

### 3.1. 세션 만료 처리
세션 만료 처리는 내부에서 주기적으로 실행되는 백그라운드(background) 스레드에 의해 수행됩니다. 
- 백그라운드 스레드는 StandardContext 클래스의 backgroundProcess 메소드를 호출합니다.
- StandardContext 클래스의 backgroundProcess 메소드에 의해 각 기능 별 백그라운드 기능이 수행됩니다.
    - Loader, Manager, WebResourceRoot, InstanceManager 클래스의 백그라운드 기능 실행
- Manager 클래스는 backgroundProcess 메소드를 수행할 때 자신이 관리하는 세션들 중 만료 처리가 필요한 세션이 있는지 확인합니다.
- 설정된 시간이 지난 세션들은 모두 만료 처리 후 세션 풀(pool)에서 제거합니다.

### 3.2. 세션 만료 처리 주요 클래스와 메소드

#### 3.2.1. ManagerBase 클래스 processExpires 메소드
- org.apache.catalina.session 패키지에 위치하는 ManagerBase 클래스의 processExpires 메소드에서 세션 만료 처리가 수행됩니다.
- Session 객체의 isValid 메소드를 통해 유효성 여부를 확인하고, 유효하지 않는 경우 만료 처리합니다.

```java
package org.apache.catalina.session;

public abstract class ManagerBase extends LifecycleMBeanBase implements Manager {

    // ...

    public void processExpires() {

        long timeNow = System.currentTimeMillis();
        Session sessions[] = findSessions();
        int expireHere = 0 ;

        if(log.isDebugEnabled())
            log.debug("Start expire sessions " + getName() + " at " + timeNow + " sessioncount " + sessions.length);
        for (int i = 0; i < sessions.length; i++) {
            if (sessions[i]!=null && !sessions[i].isValid()) {
                expireHere++;
            }
        }
        long timeEnd = System.currentTimeMillis();
        if(log.isDebugEnabled())
             log.debug("End expire sessions " + getName() + " processingTime " + (timeEnd - timeNow) + " expired sessions: " + expireHere);
        processingTime += ( timeEnd - timeNow );

    }
}
```

#### 3.2.2. StandardSession 클래스 isValid 메소드
- org.apache.catalina.session 패키지에 위치하는 StandardSession 클래스의 isValid 메소드에서 세션의 유효성 여부를 판정합니다.
- Session 객체의 isValid 메소드를 통해 유효성 여부를 확인하고, 유효하지 않는 경우 만료 처리를 수행합니다.
- 세션 접근 간격 시간이 `maxInactiveInterval` 값보다 큰 경우에는 해당 세션을 만료 처리합니다. 
- `maxInactiveInterval` 값은 설정 파일을 통해 수정할 수 있습니다.

```java
package org.apache.catalina.session;

public class StandardSession implements HttpSession, Session, Serializable {

    // ...

    @Override
    public boolean isValid() {

        if (!this.isValid) {
            return false;
        }

        if (this.expiring) {
            return true;
        }

        if (ACTIVITY_CHECK && accessCount.get() > 0) {
            return true;
        }

        if (maxInactiveInterval > 0) {
            int timeIdle = (int) (getIdleTimeInternal() / 1000L);
            if (timeIdle >= maxInactiveInterval) {
                expire(true);
            }
        }

        return this.isValid;
    }
}
```

### 3.3. 세션 만료 설정하기
어플리케이션 배포 방법에 따라 세션을 만료할 수 있는 설정이 다릅니다. 
예전에 많이 사용되었던 `war` 패키징 방식과 최근에 많이 사용되는 내장 톰캣(embedded tomcat)의 세션 만료 설정 방법에 대해 정리해보았습니다.

#### 3.3.1. Tomcat Server 사용시 세션 만료 설정
`war` 파일로 패키징(packaging)하여 Tomcat 서버에 배포하는 경우를 의미합니다. 
이런 경우에 세션 타임아웃(timeout)은 Tomcat 서버 폴더에 위치한 `web.xml` 파일을 통해 변경 가능합니다. 

##### apache-tomcat-9.0.52/conf/web.xml 파일의 세션 만료 설정

```xml
  <!-- ==================== Default Session Configuration ================= -->
  <!-- You can set the default session timeout (in minutes) for all newly   -->
  <!-- created sessions by modifying the value below.                       -->
    <session-config>
        <session-timeout>30</session-timeout>
    </session-config>
```


#### 3.3.2. Embedded Tomcat 사용시 세션 만료 설정
Spring Boot 프레임워크를 사용하여 개발하는 경우 내장 톰캣(Embedded Tomcat) 서버를 사용하게 됩니다. 
이런 경우에는 `application.yml` 파일을 이용하여 세션 만료 시간을 설정할 수 있습니다. 
`server.servlet.session.timeout` 설정 값을 조절합니다. 
`s` 단위를 붙히는 경우 초 단위로 설정이 가능하지만 분으로 잘라서 계산하기 때문에 `130s` 값을 설정하는 경우 만료 시간은 2분입니다. 
지정할 수 있는 최소 시간은 1분입니다.

```yml
server:
  servlet:
    session:
      timeout: 1m
spring:
  mvc:
    view:
      prefix: /WEB-INF/jsp/
      suffix: .jsp
```

### 3.4. 세션 만료 테스트
- 세션 만료 시간을 1분으로 설정합니다.
- 브라우저 화면에 60초가 지난 후 새로고침하면 세션이 만료되었다는 메시지가 출력됩니다. 
- 60초가 지나기 전 새로고침을 수행하면 마지막 접근 시간이 갱신되므로 세션이 만료되지 않습니다.
- 세션이 유지되므로 필터, 인터셉터, 컨트롤러에 접근 횟수가 증가합니다.

<p align="center"><img src="/images/tomcat-session-management-5.gif"></p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-09-20-tomcat-session-management>

[cookie-session-link]: https://junhyunny.github.io/information/cookie-and-session/
[filter-interceptor-aop-link]: https://junhyunny.github.io/spring-boot/filter-interceptor-and-aop/
[spring-session-link]: https://junhyunny.github.io/information/spring-boot/spring-session/