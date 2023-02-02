---
title: "[Spring MVC] Not binding proxy bean for transaction"
search: false
category:
  - spring-mvc
last_modified_at: 2021-11-04T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Proxy Pattern][proxy-pattern-link]

## 0. 들어가면서
제가 다룬 레거시(legacy) 시스템들은 대부분 Spring MVC 프레임워크를 기반이었습니다. 
커리어 초반부터 Spring Boot 프레임워크를 사용했던 저는 XML 파일을 이용한 컨텍스트 설정들을 많이 어려워합니다. 
이번 포스트도 Spring MVC 프레임워크가 익숙하지 않아서 발생한 문제에 대해 정리하였습니다. 
Spring MVC 프레임워크를 사용하시는 분들에게 도움이 되길 바랍니다. 

## 1. 문제 현상
문제 현상을 간략하게 정리해보겠습니다. 
- 트랜잭션 처리를 위한 AOP 설정은 문제가 없다.
- 빈(bean) 생성과 주입(injection)도 정상적으로 동작한다.

처음엔 트랜잭션 처리를 위한 AOP(aspect oriented programming) 설정에 문제가 있는 줄 알았습니다. 
오타를 찾는다거나 스프링 버전에 의래 트랜잭션 AOP 설정 방법이 달라졌는지 확인해보았습니다. 
`@Transactional` 애너테이션을 사용해보기도 했지만, 트랜잭션 처리가 안되기는 마찬가지였습니다. 
거의 1시간 정도를 허비한 후에야 디버깅(debugging)에서 문제를 정확히 파악할 수 있었습니다. 

**사용되는 빈(bean) 객체가 프록시(proxy) 객체가 아니라 일반 객체였습니다.** 
스프링(spring)에서 제공하는 트랜잭션 처리는 프록시 객체를 통해 이루어집니다. 
그렇기 때문에 메소드(method) 호출시 콜 스택(call stack)의 모양이 달라집니다. 

##### 빈(bean) 메소드 호출시 스택 모습
- Controller 객체에서 Service 객체의 메소드 호출시 스택이 바로 이어집니다.

<p align="center"><img src="/images/do-not-bind-proxy-spring-mvc-transaction-1.JPG" width="80%"></p>

##### 트랜잭션 처리된 빈(bean) 메소드 호출시 스택 모습
- Controller 객체에서 Service 객체의 메소드 호출시 프록시 객체의 중간 로직을 거치게 됩니다.
- 스택을 보면 트랜잭션 처리를 위한 인터셉터가 존재합니다. (빨간 박스)

<p align="center"><img src="/images/do-not-bind-proxy-spring-mvc-transaction-2.JPG" width="80%"></p>

## 2. 문제 원인
트랜잭션 처리가 실패하는 현상이 프록시 객체가 아닌 일반 객체를 주입 받아서 발생하는 것은 확인하였습니다. 
어떤 이유로 이런 현상이 일어나는지 문제의 원인을 찾아보았습니다. 
언제나 그렇듯 `StackOverflow`에서 해답을 찾을 수 있었습니다.

##### StackOverflow 답변
- 동일한 객체에 대해 `component-scan` 행위를 두 번 수행한 것으로 예상된다.
- 처음은 Proxy 객체, 두번째는 Non-Proxy 객체가 생성된다.

<p align="center"><img src="/images/do-not-bind-proxy-spring-mvc-transaction-3.JPG" width="80%"></p>
<center>hthttps://en.wikipedia.org/wiki/Proxy_pattern</center>

확인해보니 `applicationContext.xml`, `dispatcher-servlet.xml` 두 파일에서 컴포넌트 스캔(component-scan) 작업을 수행하고 있었습니다. 
컴포넌트 스캔이 두 번 발생한 원인은 스프링의 동작 순서와 연관되어 있지만, 이번 포스트에선 다루지 않겠습니다.

##### component-scan 설정
- 아래와 같은 컴포넌트 스캔 설정이 `applicationContext.xml`, `dispatcher-servlet.xml` 파일에 존재하였습니다. 
- 프로젝트 `blog.in.action` 하위 패키지에 모든 컴포넌트를 찾습니다.

```xml
    <mvc:annotation-driven/>
    <context:component-scan base-package="blog.in.action"></context:component-scan>
```

## 3. 해결방법
컴포넌트 스캔 작업시 제외할 컴포넌트 종류를 선택하였습니다. 

##### dispatcher-servlet.xml 파일
- `@Controller` 애너테이션이 붙은 컴포넌트만 찾습니다.
- `@Service`, `@Repository` 애너테이션 붙은 컴포넌트는 제외합니다.

```xml
    <mvc:annotation-driven/>
    <context:component-scan base-package="blog.in.action" use-default-filters="false">
        <context:include-filter type="annotation" expression="org.springframework.stereotype.Controller"/>
        <context:exclude-filter type="annotation" expression="org.springframework.stereotype.Service"/>
        <context:exclude-filter type="annotation" expression="org.springframework.stereotype.Repository"/>
    </context:component-scan>
```

##### applicationContext.xml 파일
- `@Service`, `@Repository` 애너테이션이 붙은 컴포넌트는 포함합니다.
- `@Controller` 애너테이션이 붙은 컴포넌트는 제외합니다.

```xml
    <mvc:annotation-driven/>
    <context:component-scan base-package="blog.in.action" use-default-filters="false">
        <context:include-filter type="annotation" expression="org.springframework.stereotype.Service"/>
        <context:include-filter type="annotation" expression="org.springframework.stereotype.Repository"/>
        <context:exclude-filter type="annotation" expression="org.springframework.stereotype.Controller"/>
    </context:component-scan>
```

## 4. 결과 확인

### 4.1. 생성자 주입 로그 확인

#### 4.1.1. BlogController 클래스 
- 생성자 주입시 빈(bean) 객체에 대한 정보를 로그로 출력합니다.

```java
package blog.in.action.controller;

import blog.in.action.service.BlogService;
import java.util.logging.Logger;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BlogController {

    private Logger log = Logger.getLogger(BlogController.class.getName());

    private final BlogService blogService;

    public BlogController(BlogService blogService) {
        log.info("BlogController 생성자 주입: " + blogService);
        this.blogService = blogService;
    }

    @RequestMapping(value = {"", "/"})
    public String index() {
        return "index";
    }

    @RequestMapping("/update")
    public void updateBlog() {
        blogService.updateBlog();
    }

    @RequestMapping("/rollback")
    public void rollbackAfterException() {
        blogService.rollbackAfterException();
    }
}
```

##### 컴포넌트 스캔시 별도 설정이 없는 경우 로그
- 생성자 주입이 2회 발생합니다.
    - `blog.in.action.service.impl.BlogServiceImpl@68fbc8b8`
    - `blog.in.action.service.impl.BlogServiceImpl@51f4704b`

```
05-Nov-2021 02:36:53.426 INFO [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.context.ContextLoader.initWebApplicationContext Root WebApplicationContext: initialization started
05-Nov-2021 02:36:55.045 INFO [RMI TCP Connection(3)-127.0.0.1] blog.in.action.controller.BlogController.<init> BlogController 생성자 주입: blog.in.action.service.impl.BlogServiceImpl@68fbc8b8
05-Nov-2021 02:36:55.061 INFO [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.context.ContextLoader.initWebApplicationContext Root WebApplicationContext initialized in 1635 ms
05-Nov-2021 02:36:55.276 WARNING [RMI TCP Connection(3)-127.0.0.1] org.apache.catalina.util.SessionIdGeneratorBase.createSecureRandom [SHA1PRNG] 알고리즘을 사용하여, 세션 ID를 생성하기 위한 SecureRandom 객체를 생성하는데, [215] 밀리초가 소요됐습니다.
05-Nov-2021 02:36:55.309 INFO [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.servlet.FrameworkServlet.initServletBean Initializing Servlet 'dispatcher'
05-Nov-2021 02:36:55.376 INFO [RMI TCP Connection(3)-127.0.0.1] blog.in.action.controller.BlogController.<init> BlogController 생성자 주입: blog.in.action.service.impl.BlogServiceImpl@51f4704b
05-Nov-2021 02:36:55.408 INFO [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.servlet.FrameworkServlet.initServletBean Completed initialization in 99 ms
```

##### 컴포넌트 스캔 대상을 지정한 후 로그
- 생성자 주입이 1회 발생합니다.

```
05-Nov-2021 02:38:27.920 INFO [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.context.ContextLoader.initWebApplicationContext Root WebApplicationContext: initialization started
05-Nov-2021 02:38:29.515 INFO [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.context.ContextLoader.initWebApplicationContext Root WebApplicationContext initialized in 1595 ms
05-Nov-2021 02:38:29.714 WARNING [RMI TCP Connection(3)-127.0.0.1] org.apache.catalina.util.SessionIdGeneratorBase.createSecureRandom [SHA1PRNG] 알고리즘을 사용하여, 세션 ID를 생성하기 위한 SecureRandom 객체를 생성하는데, [199] 밀리초가 소요됐습니다.
05-Nov-2021 02:38:29.740 INFO [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.servlet.FrameworkServlet.initServletBean Initializing Servlet 'dispatcher'
05-Nov-2021 02:38:29.824 INFO [RMI TCP Connection(3)-127.0.0.1] blog.in.action.controller.BlogController.<init> BlogController 생성자 주입: blog.in.action.service.impl.BlogServiceImpl@34114842
05-Nov-2021 02:38:29.855 INFO [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.servlet.FrameworkServlet.initServletBean Completed initialization in 115 ms
```

### 4.2. 롤백(rollback) 정상 동작 여부 확인

#### 4.2.1. BlogServiceImpl 클래스
- `updateBlog` 메소드 - 정상적으로 업데이트를 수행합니다.
- `rollbackAfterException` 메소드 - 의도적으로 예외(exception) 발생 후 롤백 여부를 확인합니다.

```java
package blog.in.action.service.impl;

import blog.in.action.dao.BlogDao;
import blog.in.action.service.BlogService;
import org.springframework.stereotype.Service;

@Service
public class BlogServiceImpl implements BlogService {

    private final BlogDao blogDao;

    public BlogServiceImpl(BlogDao blogDao) {
        this.blogDao = blogDao;
    }

    @Override
    public void updateBlog() {
        blogDao.updateBlog();
    }

    @Override
    public void rollbackAfterException() {
        blogDao.updateBlog();
        if (true) {
            throw new RuntimeException("occur exception");
        }
    }
}
```

##### 테스트 수행 전 데이터

<p align="left"><img src="/images/do-not-bind-proxy-spring-mvc-transaction-4.JPG"></p>

##### updateBlog 메소드 - curl 명령어

```
$ curl http://localhost:8080/update
```

##### updateBlog 메소드 테스트 결과
- `authorities` 항목이 `NULL`로 바뀌었습니다.

<p align="left"><img src="/images/do-not-bind-proxy-spring-mvc-transaction-5.JPG"></p>

##### rollbackAfterException 메소드 - curl 명령어

```
$ curl http://localhost:8080/rollback
```

##### rollbackAfterException 메소드 테스트 결과 로그
- 데이터가 변경되지 않았으므로 별도 이미지를 첨부하지 않았습니다. 
- 서버 에러가 발생한 것을 확인 후 쿼리를 통해 데이터를 확인합니다.

```
$ curl http://localhost:8080/rollback
...
org.springframework.web.util.NestedServletException: Request processing failed; nested exception is java.lang.RuntimeException: occur exception
        org.springframework.web.servlet.FrameworkServlet.processRequest(FrameworkServlet.java:1014)
        org.springframework.web.servlet.FrameworkServlet.doGet(FrameworkServlet.java:898)
        javax.servlet.http.HttpServlet.service(HttpServlet.java:655)
        org.springframework.web.servlet.FrameworkServlet.service(FrameworkServlet.java:883)
        javax.servlet.http.HttpServlet.service(HttpServlet.java:764)
        org.apache.tomcat.websocket.server.WsFilter.doFilter(WsFilter.java:53)
...
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-11-04-do-not-bind-proxy-spring-mvc-transaction>

#### REFERENCE
- <https://stackoverflow.com/questions/18995298/why-proxy-is-not-used-to-autowire>
- <https://stackoverflow.com/questions/11486401/autowired-spring-bean-is-not-a-proxy>
- <https://javannspring.tistory.com/231>
- <https://codedragon.tistory.com/9017>

[proxy-pattern-link]: https://junhyunny.github.io/information/design-pattern/proxy-pattern/