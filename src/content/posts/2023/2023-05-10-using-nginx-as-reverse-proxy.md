---
title: "Nginx 리버스 프록시 활용하기"
publishedAt: "2023-05-10"
updatedAt: "2026-11-12T16:19:33+09:00"
canonicalPath: "/nginx/spring-boot/docker/docker-compose/using-nginx-as-reverse-proxy/"
categories:
  - "nginx"
  - "spring-boot"
  - "docker"
  - "docker-compose"
summary: "nginx를 리버스 프록시로 설정해 도메인에 따라 서로 다른 백엔드 서비스로 요청을 전달하는 구성을 도커 컴포즈로 실습했다."
recommendedPosts:
  - title: "포워드/리버스 프록시(Forward/Reverse Proxy)"
    href: "https://junhyunny.github.io/information/forward-reverse-proxy/"
---

## 0. 들어가면서

[Virtual Host in Tomcat][virtual-host-in-tomcat-link] 글 마지막에 언급했듯이 이번 글은 `nginx`를 리버스 프록시(reverse proxy)로 사용해 여러 도메인을 서비스하는 방법을 정리했다.

## 1. Reverse Proxy

리버스 프록시는 애플리케이션을 호스팅하는 서버와 직접 연결된 서버다. 클라이언트의 요청이 인터넷을 통해 전달되면 리버스 프록시가 서버 대신 전달받는다. 보안, 성능, 안정성 등의 이유로 리버스 프록시를 사용한다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/using-nginx-as-reverse-proxy-01.png" width="100%" class="image__border">
</div>
<center>https://surfshark.com/ko/blog/proxy-server</center>

## 2. Practice

`nginx`는 로드 밸런서, 웹 서버, 리버스 프록시 역할로 사용한다. URL 경로(path)를 이용하는 방법도 있지만, 톰캣의 가상 호스트를 대체하기 위해 도메인을 사용한 리버스 프록시를 구현했다. 아래 시나리오로 리버스 프록시 서버를 구축해 보자.

- `pc-service.com` 도메인 주소로 오는 요청은 `pc-backend` 서비스로 전달한다.
- `mobile-service.com` 도메인 주소로 오는 요청은 `mobile-backend` 서비스로 전달한다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/using-nginx-as-reverse-proxy-02.png" width="100%" class="image__border">
</div>

### 2.1. Backend Service

백엔드 서비스 두 개를 구축하지만 프로젝트 구조가 같으므로 하나만 살펴보자. HelloController 클래스는 "hello pc" 문자열을 반환한다.

```java
package action.in.blog;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping(value = {"", "/"})
    public String index() {
        return "hello pc";
    }
}
```

pc 서비스는 9000 포트로, mobile 서비스는 9090 포트로 실행되도록 Dockerfile을 작성한다.

```dockerfile
FROM gradle:jdk17 as build

WORKDIR /app

COPY settings.gradle gradlew ./

COPY gradle ./gradle

COPY build.gradle ./

COPY src ./src

RUN ./gradlew clean build

FROM openjdk:17-alpine

WORKDIR /app

COPY --from=build /app/build/libs/*.jar ./app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "-Dserver.port=9000", "./app.jar"]
```

### 2.2. Configuration for Nginx

nginx 서버가 리버스 프록시로 동작하도록 `default.conf` 설정 파일을 다음과 같이 작성한다. `pc-service.com` 도메인 서버는 요청을 받으면 `http://pc-backend:9000` 서비스로, `mobile-service.com` 도메인 서버는 `http://mobile-backend:9090` 서비스로 전달한다.

```conf
server {
  listen 80;

  server_name pc-service.com;

  location / {
    proxy_pass http://pc-backend:9000;
  }
}

server {
  listen 80;

  server_name mobile-service.com;

  location / {
    proxy_pass http://mobile-backend:9090;
  }
}
```

### 2.3. Docker Compose File

도커 컴포즈 파일은 다음과 같다. 볼륨으로 nginx 컨테이너가 사용할 `default.conf` 파일을 연결한다.

```yml
version: '3.8'
services:
  reverse-proxy:
    image: nginx
    volumes:
      - ./default.conf:/etc/nginx/conf.d/default.conf
    ports:
      - '80:80'
  pc-backend:
    container_name: pc-backend
    build:
      context: ./action-in-blog-pc
  mobile-backend:
    container_name: mobile-backend
    build:
      context: ./action-in-blog-mobile
```

## 3. Run Docker Compose

도커 컴포즈(docker compose)로 애플리케이션을 실행한다.

```
$ docker-compose up -d

[+] Running 7/7
 ✔ reverse-proxy 6 layers [⣿⣿⣿⣿⣿⣿]      0B/0B      Pulled                                                                           8.3s
   ✔ 9e3ea8720c6d Pull complete                                                                                                      3.8s
   ✔ bf36b6466679 Pull complete                                                                                                      4.3s
   ✔ 15a97cf85bb8 Pull complete                                                                                                      4.4s
   ✔ 9c2d6be5a61d Pull complete                                                                                                      4.4s
   ✔ 6b7e4a5c7c7a Pull complete                                                                                                      4.5s
   ✔ 8db4caa19df8 Pull complete                                                                                                      4.6s
[+] Building 0.0s (0/1)
[+] Building 1.3s (16/16) FINISHED
 => [internal] load build definition from Dockerfile                                                                                 0.0s
 => => transferring dockerfile: 365B                                                                                                 0.0s
 => [internal] load .dockerignore                                                                                                    0.0s
 => => transferring context: 2B                                                                                                      0.0s
 => [internal] load metadata for docker.io/library/openjdk:17-alpine                                                                 0.9s
 => [internal] load metadata for docker.io/library/gradle:jdk17                                                                      1.3s
 => [build 1/7] FROM docker.io/library/gradle:jdk17@sha256:7c56302cc359a0d17cf7ccae11fe51d027186d20579f45938cfa2f21803f744f          0.0s
 => [internal] load build context                                                                                                    0.0s
 => => transferring context: 1.11kB                                                                                                  0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:17-alpine@sha256:4b6abae565492dbe9e7a894137c966a7485154238902f2f25e9dbd9784383d81   0.0s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                0.0s
 => CACHED [build 2/7] WORKDIR /app                                                                                                  0.0s
 => CACHED [build 3/7] COPY settings.gradle gradlew ./                                                                               0.0s
 => CACHED [build 4/7] COPY gradle ./gradle                                                                                          0.0s
 => CACHED [build 5/7] COPY build.gradle ./                                                                                          0.0s
 => CACHED [build 6/7] COPY src ./src                                                                                                0.0s
 => CACHED [build 7/7] RUN ./gradlew clean build                                                                                     0.0s
 => CACHED [stage-1 3/3] COPY --from=build /app/build/libs/*.jar ./app.jar                                                           0.0s
 => exporting to image                                                                                                               0.0s
 => => exporting layers                                                                                                              0.0s
 => => writing image sha256:698d29b9bdb1c37c5229395d49e0963e8c9eaced3225c1020dea499801d50ac8                                         0.0s
[+] Building 0.9s (16/16) FINISHED
 => [internal] load .dockerignore                                                                                                    0.0s
 => => transferring context: 2B                                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                                 0.0s
 => => transferring dockerfile: 365B                                                                                                 0.0s
 => [internal] load metadata for docker.io/library/openjdk:17-alpine                                                                 0.5s
 => [internal] load metadata for docker.io/library/gradle:jdk17                                                                      0.9s
 => [stage-1 1/3] FROM docker.io/library/openjdk:17-alpine@sha256:4b6abae565492dbe9e7a894137c966a7485154238902f2f25e9dbd9784383d81   0.0s
 => [build 1/7] FROM docker.io/library/gradle:jdk17@sha256:7c56302cc359a0d17cf7ccae11fe51d027186d20579f45938cfa2f21803f744f          0.0s
 => [internal] load build context                                                                                                    0.0s
 => => transferring context: 1.10kB                                                                                                  0.0s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                0.0s
 => CACHED [build 2/7] WORKDIR /app                                                                                                  0.0s
 => CACHED [build 3/7] COPY settings.gradle gradlew ./                                                                               0.0s
 => CACHED [build 4/7] COPY gradle ./gradle                                                                                          0.0s
 => CACHED [build 5/7] COPY build.gradle ./                                                                                          0.0s
 => CACHED [build 6/7] COPY src ./src                                                                                                0.0s
 => CACHED [build 7/7] RUN ./gradlew clean build                                                                                     0.0s
 => CACHED [stage-1 3/3] COPY --from=build /app/build/libs/*.jar ./app.jar                                                           0.0s
 => exporting to image                                                                                                               0.0s
 => => exporting layers                                                                                                              0.0s
 => => writing image sha256:ef458464c3f6f5cccd5351e2f80d25ea83816e4b48ef62c189bf09f2c8cac7f1                                         0.0s
 => => naming to docker.io/library/2023-05-09-using-nginx-as-reverse-proxy-pc-backend                                                0.0s
[+] Running 4/4
 ✔ Network 2023-05-09-using-nginx-as-reverse-proxy_default            Created                                                        0.1s
 ✔ Container mobile-backend                                           Started                                                        0.8s
 ✔ Container 2023-05-09-using-nginx-as-reverse-proxy-reverse-proxy-1  Started                                                        1.0s
 ✔ Container pc-backend                                               Started                                                        1.0s
```

`pc-service.com` 도메인 주소로 접근하면 "hello pc"를, `mobile-service.com` 도메인 주소로 접근하면 "hello mobile"을 응답받는다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/using-nginx-as-reverse-proxy-03.gif" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-05-10-using-nginx-as-reverse-proxy>

#### REFERENCE

- [Embedded Tomcat과 Tomcat의 차이](https://thxwelchs.github.io/EmbeddedTomcat%EA%B3%BCTomcat%EC%9D%98%EC%B0%A8%EC%9D%B4/)

[virtual-host-in-tomcat-link]: https://junhyunny.github.io/spring-boot/tomcat/virtual-host-in-tomcat/
