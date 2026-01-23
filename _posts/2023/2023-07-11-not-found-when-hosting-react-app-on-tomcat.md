---
title: "Not Found(404) when react application is hosted on Tomcat"
search: false
category:
  - spring-boot
  - react
  - tomcat
last_modified_at: 2023-07-10T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Deploy war package when using spring boot framework][deploy-spring-boot-project-as-war-link]
- [How to deploy react application on jar package][how-to-deploy-react-application-on-jar-package-link]

## 1. Problem Context

현재 개발하는 애플리케이션의 배포 환경은 다음과 같다.

- 화면 애플리케이션 개발은 리액트(react) 라이브러리를 사용한다. 
  - `react-router-dom`으로 페이지 이동을 처리한다.
- 서버 애플리케이션 개발은 스프링 부트(spring boot) 프레임워크를 사용한다.
- 빌드한 리액트 애플리케이션을 스프링 부트 프로젝트와 함께 WAR 파일로 패키징(pacakge)한다.
- WAR 패키지 파일을 톰캣(tomcat) 미들웨어에서 호스팅한다.

위와 같은 방식으로 배포하니 다음과 같은 문제가 발생했다.

- 브라우저에서 새로고침(refresh)을 수행하면 Not Found(404) 에러가 발생한다.

<div align="center">
  <img src="/images/posts/2023/page-not-found-when-hosting-react-app-on-tomcat-01.gif" width="100%" class="image__border">
</div>

## 2. Cause of the problem 

문제 원인은 SPA(single page application)의 동작 방식과 연관되어 있다. SPA 실행 흐름을 따라가면 문제가 발생하는 원인을 찾을 수 있다.

1. 브라우저가 페이지를 그리기 위한 파일들을 최초 한 차례 다운로드 받는다.
  - 예를 들어 http://localhost:8080에 접속하는 경우 index.html, main-hash.js 등 리소스 파일들을 다운로드 받는다.
1. URL이 변경되면 index.html은 변경되지 않고 해당하는 페이지 모습을 자바스크립트(JavaScript) 코드가 그린다. 
  - 예를 들어 http://localhost:8080/first-page로 이동하는 경우 /first-page 경로에 해당하는 페이지를 자바스크립트 코드가 그린다.
  - 이 과정에서 서버로 새로운 페이지 요청은 없다.
1. 브라우저가 새로고침을 수행하면 URL 경로에 해당하는 페이지를 서버로부터 새롭게 요청한다.
  - 예를 들어 http://localhost:8080/first-page 경로에서 새로고침을 서버로부터 /first-page 경로에 해당하는 페이지를 요청한다.
  - SPA이기 때문에 프론트엔드 애플리케이션 서버엔 /first-page 경로에 해당하는 페이지가 존재하지 않습니다.

<div align="center">
  <img src="/images/posts/2023/page-not-found-when-hosting-react-app-on-tomcat-02.png" width="80%" class="image__border">
</div>

## 3. Solve the Proglem 

문제를 해결하는 방법은 다양하다. 

- 톰캣 서버의 web.xml 파일에 에러 처리를 위한 페이지 설정 추가
- 톰캣 서버의 server.xml 파일에 RewriteValve 클래스를 추가 후 rewrite.config 파일에 리다이렉트 룰(rule) 작성

위에서 설명한 두 방법은 이 문제를 해결해주지 못 했다. 이 문제는 애플리케이션 코드를 통해 더 쉽게 해결할 수 있는 방법이 있다. 문제 해결 방법에 대해 알아보기 전 프로젝트 구조를 먼저 살펴보자.

- backend 폴더
  - 스프링 부트(spring boot) 애플리케이션 프로젝트다.
  - 에러 핸들링을 위한 컨트롤러가 존재한다.
  - 리소스를 제공하는 컨트롤러가 존재한다.
- frontend 폴더
  - 리액트(react) 애플리케이션 프로젝트다.
  - 두 개의 페이지가 존재한다. 
  - 두 페이지 사이에 이동이 가능하다.

```
├── backend
│   ├── HELP.md
│   ├── build.gradle
│   ├── gradle
│   │   └── wrapper
│   │       ├── gradle-wrapper.jar
│   │       └── gradle-wrapper.properties
│   ├── gradlew
│   ├── gradlew.bat
│   ├── settings.gradle
│   └── src
│       ├── main
│       │   ├── java
│       │   │   └── action
│       │   │       └── in
│       │   │           └── blog
│       │   │               ├── BackendApplication.java
│       │   │               ├── ServletInitializer.java
│       │   │               └── controller
│       │   │                   ├── NotFoundErrorController.java
│       │   │                   └── PageController.java
│       │   └── resources
│       │       ├── application.properties
│       │       ├── static
│       │       └── templates
│       └── test
│           └── java
│               └── action
│                   └── in
│                       └── blog
│                           └── BackendApplicationTests.java
├── build.sh
└── frontend
    ├── README.md
    ├── package-lock.json
    ├── package.json
    ├── public
    │   ├── favicon.ico
    │   ├── index.html
    │   ├── logo192.png
    │   ├── logo512.png
    │   ├── manifest.json
    │   └── robots.txt
    ├── src
    │   ├── App.css
    │   ├── App.test.tsx
    │   ├── App.tsx
    │   ├── PageFirst.tsx
    │   ├── PageSecond.tsx
    │   ├── first.png
    │   ├── index.css
    │   ├── index.tsx
    │   ├── logo.svg
    │   ├── react-app-env.d.ts
    │   ├── reportWebVitals.ts
    │   ├── second.png
    │   └── setupTests.ts
    └── tsconfig.json
```

### 3.1. NotFoundErrorController Class

스프링 부트에서 400, 401, 403, 404, 500 등의 오류를 쉽게 처리할 수 있도록 ErrorController 인터페이스를 제공한다. ErrorController 인터페이스를 구현한 컨트롤러(controller)를 사용하면 쉽게 에러를 처리할 수 있다. 브라우저가 요청한 경로에 해당되는 자원이 없는 경우 index.html 파일을 보내주는 방식으로 이 문제를 해결할 수 있다. 

- ErrorController 인터페이스를 구현한다.
  - 스프링 부트 2.3.0 이전에는 getErrorPath() 메소드를 오버라이드했다.
  - 스프링 부트 2.3.0 이후부터는 getErrorPath() 메소드를 지원하지 않는다.
- /error 경로에서 에러를 핸들링한다.
  - index.html 파일을 반환한다.

```java
package action.in.blog.controller;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class NotFoundErrorController implements ErrorController {

    @GetMapping({"/", "/error"})
    public String error() {
        return "index.html";
    }
}
```

### 3.2. Build and Deploy Application

간단한 스크립트를 통해 애플리케이션을 빌드 및 배포한다. 내장 톰캣을 사용하지 않고 WAR 파일로 패키징 후 톰캣 서버에 배포한다. war 패키지 파일을 톰캣 서버에 배포하는 방법은 [Deploy war package when using spring boot framework][deploy-spring-boot-project-as-war-link]를 참고하길 바란다. 그래이들(gradle) 스프링 부트 프로젝트는 빌드 결과가 `build` 디렉토리에 생성된다. build 디렉토리 내부 정적 리소스 위치에 리액트 애플리케이션 빌드 결과를 옮긴 후 함께 패키징한다. 메이븐(maven)을 사용한다면 빌드 결과가 다른 디렉토리에 생성되므로 주의하길 바란다.

1. backend 프로젝트를 빌드한다.
  - 처음 빌드 시점엔 build 디렉토리가 없다.
  - build 디렉토리를 찾지 못하는 문제를 해결하기 위해 백엔드 프로젝트를 먼저 빌드한다.
2. frontend 프로젝트를 빌드한다.
  - 빌드 결과를 backend 프로젝트의 정적 자원(static resource) 위치로 복사한다.
  - frontend 빌드 결과물을 war 패키지에 함께 묶기 위한 작업이다.
3. backend 프로젝트를 war 파일로 패키징한다.
  - war 패키지의 이름을 `ROOT.war`로 변경한다.
4. war 패키지를 톰캣 서버의 webapps 경로로 이동한다. 
  - 톰캣 서버는 ROOT.war 패키지 파일을 ROOT 경로에 해제한다.
  - 톰캣 서버는 ROOT 경로에 해제된 자원을 호스팅한다.

```sh
APPLICATION="ROOT.war"

# 1
cd backend
./gradlew clean build

# 2
cd ../frontend
npm install
npm run build
cp -rf ./build/ ../backend/build/resources/main/static

# 3
cd ../backend
./gradlew bootWar

# 4
mv build/libs/backend-0.0.1-SNAPSHOT.war build/libs/$APPLICATION
mv build/libs/$APPLICATION ~/Desktop/apache-tomcat-10.1.11/webapps
```

## 4. Result

빌드한 애플리케이션을 호스팅하는 톰캣 서버를 실행한다.

- 톰캣 서버 경로로 이동한다.
- 서버 `startup` 쉘(shell) 스크립트를 실행한다.

```
$ cd ~/Desktop/apache-tomcat-10.1.11

$ sh bin/startup.sh 
Using CATALINA_BASE:   /Users/junhyunk/Desktop/apache-tomcat-10.1.11
Using CATALINA_HOME:   /Users/junhyunk/Desktop/apache-tomcat-10.1.11
Using CATALINA_TMPDIR: /Users/junhyunk/Desktop/apache-tomcat-10.1.11/temp
Using JRE_HOME:        /Users/junhyunk/Library/Java/JavaVirtualMachines/temurin-17.0.7/Contents/Home
Using CLASSPATH:       /Users/junhyunk/Desktop/apache-tomcat-10.1.11/bin/bootstrap.jar:/Users/junhyunk/Desktop/apache-tomcat-10.1.11/bin/tomcat-juli.jar
Using CATALINA_OPTS:   
Tomcat started.
```

브라우저 화면을 통해 새로고침에도 정상적으로 애플리케이션이 동작하는지 확인한다.

- http://localhost:8080 경로에 접근한다.
  - http://localhost:8080/first, http://localhost:8080/second 페이지로 이동하는지 확인한다.
- 새로고침 버튼을 누른다.
  - Not Found(404) 에러가 발생하지 않는 것을 확인한다.

<div align="center">
  <img src="/images/posts/2023/page-not-found-when-hosting-react-app-on-tomcat-03.gif" width="100%" class="image__border">
</div>

## CLOSING

많은 곳에서 컨테이너, 클라우드 기술을 사용하지만, 작은 회사들이나 공공기관은 여전히 온-프레미스(on-premiss) 서버에서 서비스를 호스팅한다. 언어나 프레임워크는 최신 기술을 따라 가려고 하지만, 인프라 환경은 비용이나 보안 측면에서 문제가 되기 때문에 빨리 따라가지 못하는 것 같다. 이런 오래된 배포 방식은 여전히 사용되고 있다. 

프론트엔드 애플리케이션과 백엔드 애플리케이션을 함께 배포할 때 주의 사항은 프론트엔드 애플리케이션의 URL 경로와 백엔드 애플리케이션의 엔드-포인트(end-point) 경로가 겹치지 않아야 한다. 경로가 겹치면 새로고침 할 때 백엔드 서비스로부터 JSON 응답을 직접 받게 된다. 이를 방지하기 위해 리소스 요청은 URL 경로 앞에 /api 같은 접미사를 붙이는 것이 바람한 것 같다.

```java
package action.in.blog.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PageController {

    @GetMapping("/page-first")
    public String pageFirst() {
        return "This is first page";
    }

    @GetMapping("/page-second")
    public String pageSecond() {
        return "This is second page";
    }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-07-11-not-found-when-hosting-react-app-on-tomcat>

#### REFERENCE

- <http://ngmsoftware.com/bbs/board.php?bo_table=study&wr_id=854>
- <https://juyoungkim223.github.io/springboot/error/ErrorController/>
- <https://lts0606.tistory.com/533>

[deploy-spring-boot-project-as-war-link]: https://junhyunny.github.io/spring-boot/server/deploy-spring-boot-project-as-war/
[how-to-deploy-react-application-on-jar-package-link]: https://junhyunny.github.io/react/spring-boot/how-to-deploy-react-application-on-jar-package/