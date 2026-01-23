---
title: "스프링 MVC(spring mvc) 트랜잭션 처리와 프록시 빈(proxy bean) 객체"
search: false
category:
  - spring-mvc
last_modified_at: 2025-08-26T22:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [프록시 패턴(proxy pattern)][proxy-pattern-link]

## 0. 들어가면서

내가 다뤘던 레거시(legacy) 시스템들은 대부분 스프링 MVC(spring mvc) 프레임워크를 사용했다. 커리어 초반부터 스프링 부트(spring boot) 프레임워크를 사용했던 나는 XML 파일을 이용한 컨텍스트 설정을 많이 어려워하였다. 이번 글도 스프링 MVC 프레임워크가 익숙하지 않아서 발생한 문제에 대해 정리하였다. 스프링 MVC 프레임워크 기반으로 구현된 레거시를 다루는 분들에게 도움이 되길 바란다.

## 1. Problem context

문제 현상을 간략하게 정리해보자.

- 트랜잭션 처리를 위한 AOP 설정에는 문제가 없다.
- 빈(bean) 생성과 주입(injection)도 정상적으로 동작한다.

처음엔 트랜잭션 처리를 위한 AOP(aspect oriented programming) 설정에 문제가 있는 줄 알았다. 오타를 찾거나 스프링 버전에 따라 트랜잭션 AOP 설정 방법이 달라졌는지 확인했다. `@Transactional` 애너테이션을 사용해보기도 했지만, 트랜잭션 처리가 안 되긴 마찬가지였다. 거의 1시간 정도를 허비하고 나서야 디버깅(debugging)을 통해 문제를 정확히 파악할 수 있었다.

**사용된 빈 객체가 프록시(proxy) 객체가 아니라 일반 객체였다.** 스프링 프레임워크에서 제공하는 트랜잭션 처리는 프록시 객체를 통해 이루어진다. 그렇기 때문에 메서드 콜 스택(method call stack)이 달라진다. 일반 빈 객체의 메서드를 호출하면 다음과 같은 스택 모습을 갖는다.

- Controller 객체에서 Service 객체의 메서드 호출 시 스택이 바로 이어진다.

<div align="center">
  <img src="/images/posts/2021/do-not-bind-proxy-spring-mvc-transaction-01.png" width="100%" class="image__border">
</div>

트랜잭션 처리가 감싸진 프록시 빈 객체의 메서드를 호출하면 다음과 같은 스택 모습을 갖는다.

- Controller 객체에서 Service 객체의 메서드 호출 시 프록시 객체의 중간 로직을 거친다. 
- 스택을 보면 트랜잭션 처리를 위한 인터셉터가 존재한다.

<div align="center">
  <img src="/images/posts/2021/do-not-bind-proxy-spring-mvc-transaction-02.png" width="100%" class="image__border">
</div>

## 2. Reason of problem

트랜잭션 처리가 실패하는 현상이 프록시 객체가 아닌 일반 객체를 주입 받아서 발생한다는 것은 확인했다. 어떤 이유로 이런 현상이 일어나는지 문제의 원인을 찾아보았다. 언제나 그렇듯 스택 오버플로우(stack overflow)에서 해답을 찾을 수 있었다.

- 동일한 객체에 대해 `component-scan` 행위를 두 번 수행한 것으로 예상된다.
- 처음은 프록시 빈 객체, 두 번째는 일반 빈 객체가 생성된다.

<div align="center">
  <img src="/images/posts/2021/do-not-bind-proxy-spring-mvc-transaction-03.png" width="80%" class="image__border">
</div>
<center>https://en.wikipedia.org/wiki/Proxy_pattern</center>

<br/>

확인해보니 `applicationContext.xml`, `dispatcher-servlet.xml` 두 파일에서 컴포넌트 스캔(component-scan) 작업을 수행하고 있었다. 컴포넌트 스캔이 두 번 발생한 원인은 스프링의 동작 순서와 연관되어 있지만, 이번 포스트에선 다루지 않는다. 컴포넌트 스캔 설정을 살펴보자.

- 아래 컴포넌트 스캔 설정이 applicationContext.xml, dispatcher-servlet.xml 파일에 모두 존재했다. 
- 프로젝트 `blog.in.action` 하위 패키지에 모든 컴포넌트를 찾는다.

```xml
    <mvc:annotation-driven/>
    <context:component-scan base-package="blog.in.action"></context:component-scan>
```

## 3. Solve the problem

컴포넌트 스캔 작업 시 제외할 컴포넌트 종류를 선택한다. dispatcher-servlet.xml 파일을 다음과 같이 변경했다.

- `@Controller` 애너테이션이 붙은 컴포넌트만 찾는다.
- `@Service`, `@Repository` 애너테이션이 붙은 컴포넌트는 제외한다.

```xml
    <mvc:annotation-driven/>
    <context:component-scan base-package="blog.in.action" use-default-filters="false">
        <context:include-filter type="annotation" expression="org.springframework.stereotype.Controller"/>
        <context:exclude-filter type="annotation" expression="org.springframework.stereotype.Service"/>
        <context:exclude-filter type="annotation" expression="org.springframework.stereotype.Repository"/>
    </context:component-scan>
```

applicationContext.xml 파일은 다음과 같이 설정한다.

- `@Service`, `@Repository` 애너테이션이 붙은 컴포넌트는 포함한다.
- `@Controller` 애너테이션이 붙은 컴포넌트는 제외한다.

```xml
    <mvc:annotation-driven/>
    <context:component-scan base-package="blog.in.action" use-default-filters="false">
        <context:include-filter type="annotation" expression="org.springframework.stereotype.Service"/>
        <context:include-filter type="annotation" expression="org.springframework.stereotype.Repository"/>
        <context:exclude-filter type="annotation" expression="org.springframework.stereotype.Controller"/>
    </context:component-scan>
```

이제 결과를 확인해보자. 로그를 통해 어떤 빈 객체가 주입되는지 확인할 수 있다. BlogController 클래스 생성자에서 로그를 출력한다.

- 생성자 주입 시 빈(bean) 객체에 대한 정보를 로그로 출력한다.

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

컴포넌트 스캔시 별도 설정이 없다면 생성자 주입이 2번 발생한다.

- BlogController 생성자 주입: blog.in.action.service.impl.BlogServiceImpl@68fbc8b8
- BlogController 생성자 주입: blog.in.action.service.impl.BlogServiceImpl@51f4704b

```
05-Nov-2021 02:36:53.426 INFO [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.context.ContextLoader.initWebApplicationContext Root WebApplicationContext: initialization started
05-Nov-2021 02:36:55.045 INFO [RMI TCP Connection(3)-127.0.0.1] blog.in.action.controller.BlogController.<init> BlogController 생성자 주입: blog.in.action.service.impl.BlogServiceImpl@68fbc8b8
05-Nov-2021 02:36:55.061 INFO [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.context.ContextLoader.initWebApplicationContext Root WebApplicationContext initialized in 1635 ms
05-Nov-2021 02:36:55.276 WARNING [RMI TCP Connection(3)-127.0.0.1] org.apache.catalina.util.SessionIdGeneratorBase.createSecureRandom [SHA1PRNG] 알고리즘을 사용하여, 세션 ID를 생성하기 위한 SecureRandom 객체를 생성하는 데, [215] 밀리초가 소요됐습니다.
05-Nov-2021 02:36:55.309 INFO [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.servlet.FrameworkServlet.initServletBean Initializing Servlet 'dispatcher'
05-Nov-2021 02:36:55.376 INFO [RMI TCP Connection(3)-127.0.0.1] blog.in.action.controller.BlogController.<init> BlogController 생성자 주입: blog.in.action.service.impl.BlogServiceImpl@51f4704b
05-Nov-2021 02:36:55.408 INFO [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.servlet.FrameworkServlet.initServletBean Completed initialization in 99 ms
```

컴포넌트 스캔 설정을 변경해 문제를 해결한 후 로그를 보면 생성자 주입이 1회만 발생한다.

- BlogController 생성자 주입: blog.in.action.service.impl.BlogServiceImpl@34114842

```
05-Nov-2021 02:38:27.920 INFO [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.context.ContextLoader.initWebApplicationContext Root WebApplicationContext: initialization started
05-Nov-2021 02:38:29.515 INFO [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.context.ContextLoader.initWebApplicationContext Root WebApplicationContext initialized in 1595 ms
05-Nov-2021 02:38:29.740 INFO [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.servlet.FrameworkServlet.initServletBean Initializing Servlet 'dispatcher'
05-Nov-2021 02:38:29.824 INFO [RMI TCP Connection(3)-127.0.0.1] blog.in.action.controller.BlogController.<init> BlogController 생성자 주입: blog.in.action.service.impl.BlogServiceImpl@34114842
05-Nov-2021 02:38:29.855 INFO [RMI TCP Connection(3)-127.0.0.1] org.springframework.web.servlet.FrameworkServlet.initServletBean Completed initialization in 115 ms
```

이제 롤백이 정상적으로 동작하는지 살펴보자. 다음같이 정상적인 메서드와 의도적으로 예외가 발생하는 메서드를 만든다. 예외가 발생하는 경우 롤백을 통해 데이터가 이전 상태로 돌아가는지 확인한다. 

- updateBlog 메서드는 정상적으로 업데이트를 수행한다.
- rollbackAfterException 메서드는 의도적으로 예외(exception)가 밸상한다.

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

테스트를 수행하기 전에 데이터 상태는 다음과 같다.

<div align="left">
  <img src="/images/posts/2021/do-not-bind-proxy-spring-mvc-transaction-04.png" width="65%" class="image__border">
</div>

<br/>

정상 업데이트 엔드포인트에 cURL 명령어를 호출한다.

```
$ curl http://localhost:8080/update
```

정상적으로 authorities 컬럼(column)이 널(null) 값으로 업데이트 된다.

<div align="left">
  <img src="/images/posts/2021/do-not-bind-proxy-spring-mvc-transaction-05.png" width="65%" class="image__border">
</div>

<br/>

예외가 발생하는 엔드포인트에 cURL 명령어를 호출한다.

```
$ curl http://localhost:8080/rollback
```

데이터가 변경되지 않았으므로 별도 이미지를 첨부하지 않는다. 서버 에러가 발생한 것을 확인 후 쿼리를 통해 데이터를 확인할 수 있었다.

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