---
title: "Not Found(404) When Hosting React App on Tomcat"
search: false
category:
  - spring-boot
  - react
  - tomcat
last_modified_at: 2023-07-10T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Deploy War Package for Spring Boot Project][deploy-spring-boot-project-as-war-link]

## 1. Problem Context

문제가 발생한 개발 환경과 상황은 다음과 같습니다. 

* 화면 어플리케이션 개발은 리액트(react) 라이브러리를 사용한다. 
    * `react-router-dom`으로 페이지 이동 처리를 수행한다.
* 서버 어플리케이션 개발은 스프링 부트(spring boot) 프레임워크를 사용한다.
* 빌드한 리액트 어플리케이션을 스프링 부트 프로젝트와 함께 WAR 파일로 패키징(pacakge)한다.
* WAR 패키지 파일을 톰캣(tomcat) 미들웨어에서 호스팅한다.
* 브라우저에서 새로고침(refresh)을 수행하면 Not Found(404) 에러가 발생한다.

<p align="center">
    <img src="/images/page-not-found-when-hosting-react-app-on-tomcat-1.gif" width="100%" class="image__border">
</p>

## 2. Cause of Problem 

문제 원인은 SPA(single page application)의 동작 방식과 연관되어 있습니다. 
SPA 실행 흐름을 따라가면 문제가 발생하는 지점을 찾을 수 있습니다.

1. 브라우저가 페이지를 그리기 위한 파일들을 최초 한 차례 다운로드 받습니다.
    * 예를 들어 http://localhost:8080에 접속하는 경우 index.html, main-{hash}.js 등 리소스 파일들을 다운로드 받습니다.
1. URL이 변경되면 index.html은 변경되지 않고 해당하는 페이지 모습을 JavaScript 코드가 그려줍니다. 
    * 예를 들어 http://localhost:8080/first-page로 이동하는 경우 /first-page 경로에 해당하는 페이지를 JavaScript가 그려줍니다.
    * 이 과정에서 서버로 새로운 페이지 요청은 없습니다.
1. 브라우저가 새로고침을 수행하면 URL 경로에 해당하는 페이지를 서버로부터 새롭게 요청합니다.
    * 예를 들어 http://localhost:8080/first-page 경로에서 새로고침을 서버로부터 /first-page 경로에 해당하는 페이지를 요청합니다.
    * 프론트엔드 어플리케이션은 SPA이므로 서버엔 /first-page 경로에 해당하는 페이지가 존재하지 않습니다.

<p align="center">
    <img src="/images/page-not-found-when-hosting-react-app-on-tomcat-2.JPG" width="80%" class="image__border">
</p>

## 3. Solving the Proglem 

검색해보면 문제를 해결하는 방법이 다양합니다. 

* web.xml 파일에 에러 처리를 위한 페이지 설정 추가
* server.xml 파일에 RewriteValve 클래스를 추가 후 rewrite.config 파일에 리다이렉트 룰(rule) 작성

위에서 설명한 두 방법은 저의 문제를 해결해주지 못 했습니다. 
이 문제를 어플리케이션 코드를 통해 더 쉽게 해결할 수 있는 방법이 있습니다. 
문제 해결 방법에 대해 알아보기 전 프로젝트 구조를 먼저 살펴보겠습니다.

* backend 폴더
    * 스프링 부트(spring boot) 어플리케이션 프로젝트입니다.
    * 에러 핸들링을 위한 컨트롤러가 존재합니다.
    * 리소스를 제공하는 컨트롤러가 존재합니다.
* frontend 폴더
    * 리액트(react) 어플리케이션 프로젝트입니다.
    * 두 개의 페이지가 존재합니다. 
    * 두 페이지 사이에 이동이 가능합니다.

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

스프링 부트에서 400, 401, 403, 404, 500 등의 오류를 쉽게 처리할 수 있도록 ErrorController 인터페이스를 제공합니다. 
ErrorController 인터페이스를 구현한 컨트롤러(controller)를 사용하면 쉽게 에러를 처리할 수 있습니다. 
브라우저가 요청한 경로에 해당되는 자원이 없는 경우 index.html 파일을 보내주는 방식으로 이 문제를 해결합니다. 

* ErrorController 인터페이스를 구현합니다.
    * 스프링 부트 2.3.0 이전에는 getErrorPath() 메소드를 오버라이드하였습니다.
    * 스프링 부트 2.3.0 이후부터는 getErrorPath() 메소드를 지원하지 않습니다.
* /error 경로에서 에러를 핸들링합니다.
    * index.html 파일을 반환합니다.

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

간단한 스크립트를 통해 어플리케이션을 빌드 및 배포합니다. 
내장 톰캣을 사용하지 않고 WAR 파일로 패키징 후 톰캣 서버에 배포합니다. 
WAR 패키지를 톰캣 서버에 배포하는 방법은 [Deploy War Package for Spring Boot Project][deploy-spring-boot-project-as-war-link] 포스트를 참고하시길 바랍니다. 
그래이들(gradle) 기반 스프링 부트 어플리케이션에 리액트 어플리케이션을 얹어서 배포합니다.

1. backend 프로젝트를 빌드합니다.
1. frontend 프로젝트를 빌드합니다.
    * 빌드 결과를 backend 프로젝트의 정적 자원(static resource) 위치로 복사합니다.
    * frontend 빌드 결과물을 WAR 패키지에 함께 묶기 위한 작업입니다.  
1. backend 프로젝트를 war 파일로 패키징합니다.
    * WAR 패키지의 이름을 `ROOT.war`로 변경합니다.
1. WAR 패키지를 톰캣 서버의 webapps 경로로 이동합니다. 
    * 톰캣 서버는 ROOT.war 패키지 파일을 ROOT 경로에 해제합니다.
    * 톰캣 서버는 ROOT 경로에 해제된 자원을 호스팅합니다.

```sh
APPLICATION="ROOT.war"

cd backend
./gradlew clean build

cd ../frontend
npm install
npm run build
cp -rf ./build/ ../backend/build/resources/main/static

cd ../backend
./gradlew bootWar
mv build/libs/backend-0.0.1-SNAPSHOT.war build/libs/$APPLICATION
mv build/libs/$APPLICATION ~/Desktop/apache-tomcat-10.1.11/webapps
```

## 4. Result

빌드한 어플리케이션을 호스팅하는 톰캣 서버를 실행합니다.

* 톰캣 서버 경로로 이동합니다.
* 서버 `startup` 쉘(shell) 스크립트를 실행합니다.

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

브라우저 화면을 통해 새로고침에도 정상적으로 어플리케이션이 동작하는지 확인합니다.

* http://localhost:8080 경로에 접근합니다.
* 새로고침 버튼을 누릅니다.

<p align="center">
    <img src="/images/page-not-found-when-hosting-react-app-on-tomcat-3.gif" width="100%" class="image__border">
</p>

## CLOSING

많은 곳에서 컨테이너, 클라우드 기술을 사용하지만, 작은 회사들이나 공공기관은 온-프레미스(on-premiss) 서버에서 서비스를 호스팅합니다. 
언어나 프레임워크는 최신 기술을 따라 가려고 하지만, 인프라 환경은 따라가지 못하기 때문에 여전히 이런 배포 방식을 사용하고 있습니다. 

주의사항으로 프론트엔드 어플리케이션의 URL 경로와 백엔드 어플리케이션의 엔드-포인트(end-point) 경로가 겹치지 않아야 합니다. 
경로가 겹치는 경우 새로고침 시 브라우저가 백엔드 서비스로부터 JSON 응답을 직접 받게 됩니다. 
이를 방지하기 위해 리소스 요청의 경우 URL 경로 앞에 /api 등을 붙이는 것이 바람직합니다.

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

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-07-11-not-found-when-hosting-react-app-on-tomcat>

#### REFERENCE

* <http://ngmsoftware.com/bbs/board.php?bo_table=study&wr_id=854>
* <https://juyoungkim223.github.io/springboot/error/ErrorController/>
* <https://lts0606.tistory.com/533>

[deploy-spring-boot-project-as-war-link]: https://junhyunny.github.io/spring-boot/server/deploy-spring-boot-project-as-war/