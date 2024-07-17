---
title: "How to deploy react application on jar package"
search: false
category:
  - react
  - spring-boot
last_modified_at: 2024-07-16T23:55:00
---

<br/>

## 0. 들어가면서 

최근 참여한 프로젝트들은 SPA(single page application)의 빌드 결과물을 실행 가능한 jar(executable jar) 파일에 함께 패키징하고 있다. jar 패키지은 컨테이너 이미지로 만들어 AWS ECS에 배포한다. 프론트엔드 애플리케이션을 호스팅하기 위한 서버를 별도로 두지 않는 것도 나름 장점이 있는 것 같다.

- 크로스 사이트 요청에 대한 처리가 필요없다.
  - 프론트엔드, 백엔드 서버가 분리되어 있지 않기 때문에 동일 출처로 요청을 보낸다.
- 배포 프로세스가 단순화된다.
  - 프론트엔드 빌드 결과물을 백엔드의 정적 리소스에 옮긴 후 패키징한다.
  - 패키징 결과물만 배포하기 떄문에 단일 컨테이너만으로 온전한 서비스를 제공할 수 있다.

이번 글은 리액트 애플리케이션을 스프링 부트(spring boot) 프레임워크의 빌드 결과물인 실행 가능한 jar 파일에 함께 패키징하는 방법에 대해 정리했다. 

## 1. Understand build result of SPA

필자는 SPA 라이브러리로 리액트를 사용한다. 이번 예제는 비트(vite) 번들러(bundler)에서 리액트 애플리케이션을 빌드한다. 먼저 리액트 애플리케이션을 빌드해보자.

- `npm run build` 명령어를 사용한다.

```
$ npm run build

> frontend@0.0.0 build
> tsc -b && vite build

vite v5.3.3 building for production...
✓ 32 modules transformed.
dist/index.html                   0.46 kB │ gzip:  0.30 kB
dist/assets/index-UWF-2zO1.css    1.00 kB │ gzip:  0.54 kBㄹ
dist/assets/index-CxIYR50h.js   143.38 kB │ gzip: 46.13 kB
✓ built in 370ms
```

dist 경로에 빌드 결과물이 생성된다.

- index.html 
  - SPA의 메인 인덱스 페이지가 위치한다.
- assets 폴더
  - 이미지, 스타일, 자바스크립트(리액트 애플리케이션) 등이 위치한다.

<div align="left">
  <img src="/images/posts/2024/how-to-deploy-react-application-on-jar-package-01.png" width="40%" class="image__border">
</div>

<br/>

사실 위 빌드 결과물은 nginx 같은 웹 서버에 의해 호스팅 될 수 있는 정적 리소스이다. 동적인 인터렉션(interaction)은 자바스크립트 코드가 브라우저에 의해 실행되기 때문에 가능한 것이다. 서버가 리액트 애플리케이션의 빌드 결과물을 브라우저에게 잘 서빙(serving)할 수만 있다면 nginx를 사용하던 톰캣(tomcat)을 사용하던 전혀 문제가 없다.

## 2. Understand serving static resource in Spring Boot

스프링 부트 프레임워크는 임베디드 톰캣(embedded tomcat)을 사용하기 때문에 서블릿 컨테이너가 별도로 필요없다. 빌드 결과물인 jar 패키지 파일을 실행하기만 하면 된다. 

```
$ java -jar backend-gradle/build/libs/backend-0.0.1-SNAPSHOT.jar

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/

 :: Spring Boot ::                (v3.3.1)

2024-07-16T12:58:05.245+09:00  INFO 27625 --- [backend-gradle] [           main] action.in.blog.BackendApplicationKt      : Starting BackendApplicationKt v0.0.1-SNAPSHOT using Java 21.0.3 with PID 27625 (/Users/junhyunkang/Desktop/workspace/blog/blog-in-action/2024-07-16-how-to-deploy-react-application-on-jar-package/action-in-blog/backend-gradle/build/libs/backend-0.0.1-SNAPSHOT.jar started by junhyunkang in /Users/junhyunkang/Desktop/workspace/blog/blog-in-action/2024-07-16-how-to-deploy-react-application-on-jar-package/action-in-blog)
2024-07-16T12:58:05.246+09:00  INFO 27625 --- [backend-gradle] [           main] action.in.blog.BackendApplicationKt      : No active profile set, falling back to 1 default profile: "default"
2024-07-16T12:58:05.716+09:00  INFO 27625 --- [backend-gradle] [           main] .s.d.r.c.RepositoryConfigurationDelegate : Bootstrapping Spring Data JPA repositories in DEFAULT mode.
2024-07-16T12:58:05.744+09:00  INFO 27625 --- [backend-gradle] [           main] .s.d.r.c.RepositoryConfigurationDelegate : Finished Spring Data repository scanning in 23 ms. Found 1 JPA repository interface.
2024-07-16T12:58:06.029+09:00  INFO 27625 --- [backend-gradle] [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port 8080 (http)
2024-07-16T12:58:06.037+09:00  INFO 27625 --- [backend-gradle] [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2024-07-16T12:58:06.037+09:00  INFO 27625 --- [backend-gradle] [           main] o.apache.catalina.core.StandardEngine    : Starting Servlet engine: [Apache Tomcat/10.1.25]

...
```

스프링 부트 프레임워크가 내부적으로 톰캣 서버를 사용한다는 사실이 중요하다. 톰캣 서버는 프로젝트 static 폴더에 위치한 정적 자원을 별다른 설정 없이 서빙해준다. 예를 들어 static 폴더에 todo.html 파일이 존재한다면 가정해보자. 

- 해당 예제는 메이븐 프로젝트의 빌드 타겟 경로이다.

<div align="left">
  <img src="/images/posts/2024/how-to-deploy-react-application-on-jar-package-02.png" width="40%" class="image__border">
</div>

<br/>

서버 애플리케이션을 실행하고 브라우저로 http://localhost:8080/todo.html 접속하면 해당 todo.html 페이지를 받을 수 있다. 만약 파일 이름이 `index.html` 이라면 `http://localhost:8080`처럼 URL 주소에서 파일 이름을 생략할 수 있다.

<div align="center">
  <img src="/images/posts/2024/how-to-deploy-react-application-on-jar-package-03.png" width="100%" class="image__border">
</div>

## 3. Add SPA build result in jar package

위에서 언급한 내용들을 다시 정리해보자.

- SPA 애플리케이션은 브라우저에서 동작하는 자바스크립트이다. 
  - html 문서와 함께 브라우저로 서빙되면 정상적으로 동작한다. 
- 스프링 부트 애플리케이션은 static 경로에 위치한 정적 파일들을 브라우저에게 서빙한다. 
  - 이름이 index.html 파일이라면 URL 주소에서 파일 이름을 생략할 수 있다.

이제 어느 정도 감이 잡힐 것이다. SPA 빌드 결과물을 스프링 부트 애플리케이션의 static 폴더에 옮긴 후 jar 파일로 패키징하면 된다. [war 파일로 패키징][not-found-when-hosting-react-app-on-tomcat-link]하는 것도 같은 원리이다. 자바 프로젝트 빌드 도구가 메이븐(maven)인지 그레이들(gradle)인지에 따라 빌드 대상 폴더가 다르기 때문에 이 사실만 주의하면 된다.

그레이들 프로젝트의 static 리소스 경로는 `build/resources/main/static`이다. 

<div align="left">
  <img src="/images/posts/2024/how-to-deploy-react-application-on-jar-package-04.png" width="40%" class="image__border">
</div>

<br/>

메이븐 프로젝트의 static 리소스 경로는 `target/classes/static`이다.

<div align="left">
  <img src="/images/posts/2024/how-to-deploy-react-application-on-jar-package-05.png" width="40%" class="image__border">
</div>

<br/>

이제 static 리소스 경로에 SPA 빌드 결과물을 옮긴 후 jar 파일로 패키징해보자. 프로젝트 구조는 다음과 같다.

- backend-gradle
  - 그레이들 프로젝트
- backend-maven
  - 메이븐 프로젝트
- frontend
  - 리액트 프로젝트

```
.
├── README.md
├── backend-gradle
│   ├── HELP.md
│   ├── build.gradle
│   ├── gradlew
│   ├── gradlew.bat
│   ├── manifest.yml
│   ├── package-lock.json
│   ├── settings.gradle
│   └── src

...

├── backend-maven
│   ├── HELP.md
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── pom.xml
│   └── src

...

└── frontend
    ├── README.md
    ├── index.html
    ├── package.json
    ├── public
    │   └── vite.svg
    ├── src

...

    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts
```

빌드 스크립트는 그레이들 프로젝트를 기준으로 설명한다. 프로젝트 루트(root) 경로에서 해당 명령어를 실행한다.

1. backend-gradle 경로에서 프로젝트를 빌드한다.
  - 프로젝트 소스 코드를 먼저 컴파일하는 이유는 그레이들 프로젝트의 build 디렉토리를 만들기 위함이다.
  - 컴파일이 끝나면 build 디렉토리에 컴파일 된 클래스 파일들이 생긴다. 
2. frontend 경로에서 프로젝트를 빌드한다.
3. SPA 빌드 결과물을 그레이들 프로젝트 build 디렉토리의 static 경로에 복사한다.
4. 그레이들 프로젝트의 build 디렉토리를 jar 파일로 패키징한다.
  - SPA 빌드 결과물과 스프링 애플리케이션 빌드 결과물을 하나의 파일로 패키징한다.

```
# 1
cd backend-gradle
./gradlew clean build

# 2
cd ../frontend
npm install && npm run build

# 3
cp -rf ./dist/ ../backend-gradle/build/resources/main/static

# 4
cd ../backend-gradle
./gradlew bootJar
```

애플리케이션을 실행한다.

```
$ java -jar backend-gradle/build/libs/backend-0.0.1-SNAPSHOT.jar 

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/

 :: Spring Boot ::                (v3.3.1)

2024-07-16T14:56:59.666+09:00  INFO 33775 --- [backend-gradle] [           main] action.in.blog.BackendApplicationKt      : Starting BackendApplicationKt v0.0.1-SNAPSHOT using Java 21.0.3 with PID 33775 (/Users/junhyunkang/Desktop/workspace/blog/blog-in-action/2024-07-16-how-to-deploy-react-application-on-jar-package/action-in-blog/backend-gradle/build/libs/backend-0.0.1-SNAPSHOT.jar started by junhyunkang in /Users/junhyunkang/Desktop/workspace/blog/blog-in-action/2024-07-16-how-to-deploy-react-application-on-jar-package/action-in-blog)
2024-07-16T14:56:59.668+09:00  INFO 33775 --- [backend-gradle] [           main] action.in.blog.BackendApplicationKt      : No active profile set, falling back to 1 default profile: "default"
2024-07-16T14:57:00.124+09:00  INFO 33775 --- [backend-gradle] [           main] .s.d.r.c.RepositoryConfigurationDelegate : Bootstrapping Spring Data JPA repositories in DEFAULT mode.
2024-07-16T14:57:00.152+09:00  INFO 33775 --- [backend-gradle] [           main] .s.d.r.c.RepositoryConfigurationDelegate : Finished Spring Data repository scanning in 24 ms. Found 1 JPA repository interface.

...

2024-07-16T14:57:01.517+09:00  INFO 33775 --- [backend-gradle] [           main] o.s.b.a.w.s.WelcomePageHandlerMapping    : Adding welcome page: class path resource [static/index.html]
2024-07-16T14:57:01.693+09:00  INFO 33775 --- [backend-gradle] [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port 8080 (http) with context path '/'
2024-07-16T14:57:01.705+09:00  INFO 33775 --- [backend-gradle] [           main] action.in.blog.BackendApplicationKt      : Started BackendApplicationKt in 2.302 seconds (process running for 2.62)
```

브라우저로 http://localhost:8080 주소에 접속하면 리액트 애플리케이션이 정상적으로 서빙되는 것을 볼 수 있다.

<div align="center">
  <img src="/images/posts/2024/how-to-deploy-react-application-on-jar-package-06.png" width="100%" class="image__border">
</div>

## CLOSING

여러 글들을 보면 이 문제를 해결하기 위해 플러그인 같은 것들을 사용하지만, 사실 원리를 이해하면 별도 빌드 플러그인은 필요 없다. 

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-07-16-how-to-deploy-react-application-on-jar-package>

#### RECOMMEND NEXT POSTS

- [Not Found(404) when react application is hosted on Tomcat][not-found-when-hosting-react-app-on-tomcat-link]

#### REFERENCE

- <https://okky.kr/questions/1507770?topic=questions&page=2>
- <https://bottom-to-top.tistory.com/38>

[not-found-when-hosting-react-app-on-tomcat-link]: https://junhyunny.github.io/spring-boot/react/tomcat/not-found-when-hosting-react-app-on-tomcat/
