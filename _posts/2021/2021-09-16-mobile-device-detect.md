---
title: "사용자 디바이스 식별하기(identify user device)"
search: false
category:
  - information
  - spring-boot
last_modified_at: 2026-06-03T09:25:51+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [스프링(spring) 프레임워크의 필터(Filter), 인터셉터(Interceptor), AOP(Aspect Oriented Programming)][filter-interceptor-link]
- [live-server 명령어 간단 웹 서버 실행][live-server-link]

## 0. 들어가면서

현재 리뉴얼 중인 시스템의 모바일 기능을 추가하는데 사용자의 디바이스 식별을 어디에서 수행할지 고민되었다.

- 브라우저에서 판단하여 경로를 다르게 호출한다.
- 브라우저는 일단 호출하고 서버의 필터(filter) 혹은 인터셉터(interceptor)에서 경로를 라우팅(routing)해준다.

아무래도 서버에서 사용자 디바이스를 식별하고 적절한 서비스를 제공하는 것이 좋은 구조인 것 같지만, 표준으로 사용되는 방법이 있을 것 같다는 생각이 들었다. 같은 고민을 한 사람을 `StackOverflow`에서 찾을 수 있었다.

> StackOverflow<br/>
> Is it better/faster to detect mobile browser on server side (PHP) or client side (JavaScript)? I've seen code that detects whether someone is using a mobile browser in JavaScript (e.g. a jQuery script) and I've seen some that work in PHP (or other server-side language). But I've never seen a good explanation for whether one is a better choice than the other in all or any situations. Is there a reason why one is a better choice?

이에 대한 답변에서 큰 힌트를 얻었다.

> The typical answer: it depends on why you are doing the check... From my standpoint, here is what I usually consider:
> - If you want to present the user a different experience (mobile, tablet, laptop, etc) based on browser, do it at the server.
> - If you want to present the same general experience, but need to account for browser compatibility issues, do it at the client.

모바일, 태블릿, PC 환경에 따라 다른 경험을 제공해주고 싶다면 서버 측에서 수행하고, 일반적으로 같은 경험을 제공해주고 싶지만, 브라우저 호환성 문제를 고려해야 하는 경우는 클라이언트 측에서 수행하는 것이 좋다고 한다. 이번 프로젝트에서 추가되는 모바일(혹은 태블릿) 서비스는 PC 환경에서 제공하는 서비스와 전혀 다르기 때문에 서버 측에서 수행하기로 하였다. 이제 구현 방법을 알아보자.

## 1. 자바스크립트(JavaScript)에서 사용자 디바이스 식별 

서버 측에서 디바이스 식별을 수행할 예정이지만, 글을 작성하는 김에 함께 정리했다. 정규식과 `navigator.userAgent` 정보를 이용하여 모바일 여부를 판단하는 코드다. 간단한 예제 코드를 살펴보자.

- 브라우저로 접속한 사용자 디바이스에 따라 `root` ID를 가지는 div 태그에 true, false 값이 지정된다.

```html
<!DOCTYPE html>
<html>
<head>
    <script type="text/javascript">
        function isMobile() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }
    </script>
</head>
<body>
    <div id="root"></div>
    <script>
        document.getElementById("root").innerHTML = isMobile();
    </script>
</body>
</html>
```

위 코드를 [live-server 명령어][live-server-link]를 통해 실행해보자. HTML 문서 위치까지 이동 후 아래 명령어를 실행한다.

```
$ live-server
```

PC 환경 브라우저에서는 아래 이미지처럼 표시된다.

<div align="left">
  <img src="{{ site.image_url_2021 }}/mobile-device-detect-01.png" width="50%" class="image__border">
</div>

<br/>

모바일 환경 브라우저에서는 아래 이미지처럼 표시된다.

<div align="left">
  <img src="{{ site.image_url_2021 }}/mobile-device-detect-02.png" width="50%" class="image__border">
</div>

## 2. 서버에서 사용자 디바이스 식별

스프링 부트(Spring Boot) 프레임워크를 사용한 애플리케이션을 예제로 살펴보자. 대부분의 사람들이 작성한 예제 코드를 보면 `spring-mobile-device` 의존성을 사용하기는 했지만, 컨트롤러(controller) 영역에서 디바이스를 판단하는 단순한 코드만 제공했다. 예를 들면, 아래와 같이 엔드포인트에서 Device 객체를 주입받는다.

```java
@Controller
public class HomeController {

    private static final Logger logger = LoggerFactory.getLogger(HomeController.class);

    @RequestMapping("/")
    public void home(Device device) {
        if (device.isMobile()) {
            logger.info("Hello mobile user!");
        } else if (device.isTablet()) {
            logger.info("Hello tablet user!");
        } else {
            logger.info("Hello desktop user!");
        }
    }
}
```

위 방법은 이미 비즈니스 로직 시작 위치까지 진입했다고 보이기 때문에 이런 방식을 사용하고 싶지는 않았다. 필터 혹은 인터셉터를 사용한 경로 라우팅을 수행하고 싶었다. 관련된 내용을 찾다 보니 [Spring Document - Spring Mobile Device Module][spring-doc-link]에 자세한 방법이 나와 있었다. 이번 리뉴얼 프로젝트가 JSP를 사용하는 중이었는데, 운 좋게 API 문서 설명에서 사용한 코드도 JSP로 제공해주고 있었다. 간단한 예제 코드를 통해 잘 동작하는지 확인해보겠다.

패키지는 다음과 같이 구성되어 있다.

```
./
|-- README.md
|-- action-in-blog.iml
|-- mvnw
|-- mvnw.cmd
|-- pom.xml
`-- src
    `-- main
        |-- java
        |   `-- blog
        |       `-- in
        |           `-- action
        |               |-- ActionInBlogApplication.java
        |               |-- config
        |               |   `-- Config.java
        |               |-- controller
        |               |   |-- MobileController.java
        |               |   `-- PcController.java
        |               `-- service
        |-- resources
        |   `-- application.yml
        `-- webapp
            `-- WEB-INF
                `-- jsp
                    |-- mobile
                    |   `-- index.jsp
                    `-- pc
                        `-- index.jsp
```

pom.xml 파일에 아래와 같은 의존성이 필요하다.

- `spring-mobile-device` 의존성
    - 디바이스 식별을 위해 사용한다.
- 스프링 부트 프레임워크 JSP 관련 의존성
  - `spring-boot-starter-tomcat`
  - `tomcat-embed-jasper`
  - `jstl`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.2.5.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>

    <groupId>blog.in.action</groupId>
    <artifactId>action-in-blog</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>action-in-blog</name>

    <properties>
        <java.version>11</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
            <scope>provided</scope>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
            <exclusions>
                <exclusion>
                    <groupId>org.junit.vintage</groupId>
                    <artifactId>junit-vintage-engine</artifactId>
                </exclusion>
            </exclusions>
        </dependency>

        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <scope>provided</scope>
        </dependency>

        <dependency>
            <groupId>org.springframework.mobile</groupId>
            <artifactId>spring-mobile-device</artifactId>
            <version>1.1.5.RELEASE</version>
        </dependency>

        <dependency>
            <groupId>org.apache.tomcat.embed</groupId>
            <artifactId>tomcat-embed-jasper</artifactId>
            <version>9.0.44</version>
            <scope>provided</scope>
        </dependency>

        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>jstl</artifactId>
            <version>1.2</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
```

application.yml 파일에 다음과 같은 설정을 추가한다.

```yml
spring:
  mvc:
    view:
      prefix: /WEB-INF/jsp/
      suffix: .jsp
```

Config 클래스에 디바이스 식별 후 라우팅을 수행하는 빈(bean) 객체들을 만들어준다.

- `DeviceResolverHandlerInterceptor` 객체
  - 웹 요청으로부터 디바이스를 식별해내는 기능을 제공한다.
- `SiteSwitcherHandlerInterceptor` 객체
  - 모바일, 태블릿, 루트(root)에 따른 API 경로 prefix를 지정한다.
  - 모바일과 태블릿으로 접근 시 `/m` 경로가 앞에 자동적으로 추가된다.
  - PC로 접근 시 루트인 `/` 경로부터 시작한다.
  - urlPath() 메서드의 파라미터 개수에 따라 각 의미가 달라진다.
    - 1개인 경우 모바일 URL 경로 지정
    - 2개인 경우 순서대로 모바일, 루트 URL 경로 지정
    - 3개인 경우 순서대로 모바일, 태블릿, 루트 URL 경로 지정
- `LiteDeviceDelegatingViewResolver` 객체
  - 디바이스 별로 사용되는 페이지에 대한 자원 경로를 지정한다.
  - 모바일은 `/mobile` 폴더 안에 위치한 JSP 자원을 사용한다.
  - 태블릿은 `/mobile` 폴더 안에 위치한 JSP 자원을 사용한다.
  - 일반은 `/pc` 폴더 안에 위치한 JSP 자원을 사용한다.

```java
package blog.in.action.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mobile.device.DeviceResolverHandlerInterceptor;
import org.springframework.mobile.device.switcher.SiteSwitcherHandlerInterceptor;
import org.springframework.mobile.device.view.LiteDeviceDelegatingViewResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.view.InternalResourceViewResolver;

@Configuration
public class Config implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(deviceResolverHandlerInterceptor());
        registry.addInterceptor(siteSwitcherHandlerInterceptor());
    }

    @Bean
    public DeviceResolverHandlerInterceptor deviceResolverHandlerInterceptor() {
        return new DeviceResolverHandlerInterceptor();
    }

    @Bean
    public SiteSwitcherHandlerInterceptor siteSwitcherHandlerInterceptor() {
        return SiteSwitcherHandlerInterceptor.urlPath("/m", "/m", "/");
    }

    @Bean
    public LiteDeviceDelegatingViewResolver liteDeviceAwareViewResolver() {
        InternalResourceViewResolver delegate = new InternalResourceViewResolver();
        delegate.setPrefix("/WEB-INF/jsp/");
        delegate.setSuffix(".jsp");
        LiteDeviceDelegatingViewResolver resolver = new LiteDeviceDelegatingViewResolver(delegate);
        resolver.setMobilePrefix("mobile/");
        resolver.setTabletPrefix("mobile/");
        resolver.setNormalPrefix("pc/");
        return resolver;
    }
}
```

다음으로 PC를 위한 엔드포인트 역할을 수행하는 PcController 클래스를 살펴보자.

- API 경로를 별도로 지정하지 않았으므로 루트 경로로 접근 시 `index.jsp` 페이지가 반환된다.
- `index.jsp` 페이지의 자원 경로를 별도로 지정하지 않는다.

```java
package blog.in.action.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class PcController {

    @RequestMapping
    public String index() {
        return "/index";
    }
}
```

모바일을 위한 엔드포인트 역할을 수행하는 MobileController 클래스를 살펴보자.

- 해당 컨트롤러가 다루는 API 경로가 `/m`으로 시작하도록 클래스 위에 `@RequestMapping("/m")` 애너테이션을 추가한다.
- `index.jsp` 페이지의 자원 경로를 별도로 지정하지 않는다.

```java
package blog.in.action.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/m")
public class MobileController {

    @RequestMapping
    public String index() {
        return "/index";
    }
}
```

이제 JSP 파일들을 살펴보자. 아래 코드는 /pc 경로의 index.jsp 파일이다.

```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>Title</title>
<body>
</head>

<div>
    <h1>PC 메인 화면</h1>
</div>

</body>
</html>
```

아래 코드는 /mobile 경로의 index.jsp 파일이다.

```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
    <title>Title</title>
<body>
</head>

<div>
    <h1>모바일/태블릿 메인 화면</h1>
</div>

</body>
</html>
```

## 3. 테스트

애플리케이션을 실행 후 PC 환경에서 접근하면 아래와 같은 화면을 볼 수 있다.

<div align="left">
  <img src="{{ site.image_url_2021 }}/mobile-device-detect-03.gif" class="image__border">
</div>

<br/>

모바일 환경에서 접근하면 아래와 같은 화면을 볼 수 있다.

<div align="left">
  <img src="{{ site.image_url_2021 }}/mobile-device-detect-04.gif" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-09-16-mobile-device-detect>

#### REFERENCE

- <https://docs.spring.io/spring-mobile/docs/current/reference/html/device.html>
- <https://dev.to/timhuang/a-simple-way-to-detect-if-browser-is-on-a-mobile-device-with-javascript-44j3>
- <https://stackoverflow.com/questions/13093629/is-it-better-faster-to-detect-mobile-browser-on-server-side-php-or-client-side>

[filter-interceptor-link]: https://junhyunny.github.io/spring-boot/filter-interceptor-and-aop/
[live-server-link]: https://junhyunny.github.io/information/live-server/
[spring-doc-link]: https://docs.spring.io/spring-mobile/docs/current/reference/html/device.html
