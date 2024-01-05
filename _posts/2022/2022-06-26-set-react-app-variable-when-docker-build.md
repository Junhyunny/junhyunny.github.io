---
title: "도커 빌드 시 React APP 환경 변수 설정"
search: false
category:
    - react
    - docker
last_modified_at: 2022-06-26T23:55:00
---

<br/>

## 0. 들어가면서 

리액트 어플리케이션 배포 시 개발, 운영 환경 별로 다르게 동작하도록 변수 설정이 필요했습니다. 
CI/CD 파이프라인의 젠킨스 파일을 직접 수정할 수 없다는 제약 사항이 있었지만, 
각 배포 환경 별로 사용하는 도커 파일(Dockerfile)이 다른 점을 이용하여 배포 환경에 맞는 환경 변수를 설정하였습니다. 
이번 포스트에선 배포 환경 별로 도커 파일을 사용하여 리액트 어플리케이션에 환경 변수를 설정하는 방법에 대해 정리하였습니다. 

## 1. 간단한 리액트 어플리케이션

CRA(create-react-app)을 사용하여 생성한 프로젝트를 간단하게 변경하였습니다. 

### 1.1. 패키지 구조

우선 리액트 프로젝트의 패키지 구조를 살펴보겠습니다.

* Dockerfile-dev - 개발계 배포를 위한 도커 파일
* Dockerfile-prod - 운영계 배포를 위한 도커 파일
* nginx.conf - nginx 서버 설정 파일

```
./
├── Dockerfile-dev
├── Dockerfile-prod
├── README.md
├── conf
│   └── nginx.conf
├── package-lock.json
├── package.json
├── public
│   ├── favicon.ico
│   ├── index.html
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
└── src
    ├── App.css
    ├── App.js
    ├── App.test.js
    ├── index.css
    ├── index.js
    ├── logo.svg
    ├── reportWebVitals.js
    └── setupTests.js
```

### 1.2. index.js

* Node 전역 변수인 `process.env`의 `REACT_APP_ALLOW` 설정 값에 따라 다르게 동작합니다.
    * 값이 `ALLOW`인 경우 `<App />` 컴포넌트가 화면에 렌더링(rendering) 됩니다.
    * 값이 `ALLOW`가 아닌 경우 `NOT FOUND` 문장이 화면에 렌더링 됩니다.

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

let component;
if (process.env.REACT_APP_ALLOW === 'ALLOW') {
    component = <App/>;
} else {
    component = <div><h1>NOT FOUND</h1></div>;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        {component}
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
```

## 2. 도커 이미지 빌드 및 컨테이너 실행

각 환경 별로 이미지를 빌드하고 도커 컨테이너를 실행해보겠습니다.

### 2.1. 도커 파일

우선 도커 파일 별로 어플리케이션에서 사용할 변수를 다르게 설정합니다.

* `ENV REACT_APP_ALLOW` 명령어를 통해 환경 변수를 설정합니다.
    * Dockerfile-dev 파일에서 `ALLOW` 값으로 설정
    * Dockerfile-prod 파일에서 `DENY` 값으로 설정

```dockerfile
FROM node:14-alpine as builder

# Dockerfile-dev 파일 - ALLOW
# Dockerfile-prod 파일 - DENY
ENV REACT_APP_ALLOW ALLOW

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

RUN npm run build

FROM nginx:1.19-alpine

COPY --from=builder /app/build /usr/share/nginx/html

COPY conf/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2.2. 도커 빌드

다음과 같은 명령어를 통해 도커 이미지를 빌드합니다.

* `docker build` - 도커 이미지를 빌드합니다.
* `-f` 플래그 - 도커 빌드에 사용할 파일을 지정합니다.
* `-t` 플래그 - 이미지에 태그 이름을 지정합니다.

```
$ docker build -f ./Dockerfile-dev -t react-app-dev:0.1 .
[+] Building 3.3s (15/15) FINISHED
 => [internal] load build definition from Dockerfile-dev                                                                             0.0s
 => => transferring dockerfile: 364B                                                                                                 0.0s
 => [internal] load .dockerignore                                                                                                    0.0s
 => => transferring context: 2B                                                                                                      0.0s
 => [internal] load metadata for docker.io/library/nginx:1.19-alpine                                                                 1.1s
 => [internal] load metadata for docker.io/library/node:14-alpine                                                                    1.1s
 => [builder 1/6] FROM docker.io/library/node:14-alpine@sha256:6b87d16e4ce20cacd6f1f662f66c821e4c3c41c2903daeace52d818ec3f4bbdd      0.0s
 => [stage-1 1/3] FROM docker.io/library/nginx:1.19-alpine@sha256:07ab71a2c8e4ecb19a5a5abcfb3a4f175946c001c8af288b1aa766d67b0d05d2   0.0s
 => [internal] load build context                                                                                                    2.1s
 => => transferring context: 3.08MB                                                                                                  2.1s
 => CACHED [builder 2/6] WORKDIR /app                                                                                                0.0s
 => CACHED [builder 3/6] COPY package.json .                                                                                         0.0s
 => CACHED [builder 4/6] RUN npm install                                                                                             0.0s
 => CACHED [builder 5/6] COPY . .                                                                                                    0.0s
 => CACHED [builder 6/6] RUN npm run build                                                                                           0.0s
 => CACHED [stage-1 2/3] COPY --from=builder /app/build /usr/share/nginx/html                                                        0.0s
 => CACHED [stage-1 3/3] COPY conf/nginx.conf /etc/nginx/conf.d/default.conf                                                         0.0s
 => exporting to image                                                                                                               0.0s
 => => exporting layers                                                                                                              0.0s
 => => writing image sha256:55549a2fee4d3e8bbb6922dabb759ed11a71d878b044e55303eba7702a4ef2d5                                         0.0s
 => => naming to docker.io/library/react-app-dev:0.1                                                                                 0.0s

$ docker build -f ./Dockerfile-prod -t react-app-prod:0.1 .
[+] Building 2.8s (15/15) FINISHED
 => [internal] load build definition from Dockerfile-prod                                                                            0.0s
 => => transferring dockerfile: 364B                                                                                                 0.0s
 => [internal] load .dockerignore                                                                                                    0.0s
 => => transferring context: 2B                                                                                                      0.0s
 => [internal] load metadata for docker.io/library/nginx:1.19-alpine                                                                 0.9s
 => [internal] load metadata for docker.io/library/node:14-alpine                                                                    0.9s
 => [builder 1/6] FROM docker.io/library/node:14-alpine@sha256:6b87d16e4ce20cacd6f1f662f66c821e4c3c41c2903daeace52d818ec3f4bbdd      0.0s
 => [stage-1 1/3] FROM docker.io/library/nginx:1.19-alpine@sha256:07ab71a2c8e4ecb19a5a5abcfb3a4f175946c001c8af288b1aa766d67b0d05d2   0.0s
 => [internal] load build context                                                                                                    1.8s
 => => transferring context: 3.08MB                                                                                                  1.7s
 => CACHED [builder 2/6] WORKDIR /app                                                                                                0.0s
 => CACHED [builder 3/6] COPY package.json .                                                                                         0.0s
 => CACHED [builder 4/6] RUN npm install                                                                                             0.0s
 => CACHED [builder 5/6] COPY . .                                                                                                    0.0s
 => CACHED [builder 6/6] RUN npm run build                                                                                           0.0s
 => CACHED [stage-1 2/3] COPY --from=builder /app/build /usr/share/nginx/html                                                        0.0s
 => CACHED [stage-1 3/3] COPY conf/nginx.conf /etc/nginx/conf.d/default.conf                                                         0.0s
 => exporting to image                                                                                                               0.0s
 => => exporting layers                                                                                                              0.0s
 => => writing image sha256:d39f5e005627a2dec2b44b91161f75ba370ff0561ceb2988fa1d85ff75b57862                                         0.0s
 => => naming to docker.io/library/react-app-prod:0.1                                                                                0.0s

$ docker images                                            
REPOSITORY       TAG       IMAGE ID       CREATED          SIZE
react-app-prod   0.1       d39f5e005627   47 minutes ago   23.2MB
react-app-dev    0.1       55549a2fee4d   51 minutes ago   23.2MB
```

### 2.3. 도커 컨테이너 실행

다음과 같은 명령어를 통해 도커 컨테이너를 실행합니다.

* `docker run` - 도커 컨테이너를 실행합니다.
* `-p` 플래그 - 호스트의 포트와 컨테이너의 포트를 연결합니다.
    * 개발 환경에 배포할 이미지는 8080 포트를 사용합니다.
    * 운영 환경에 배포할 이미지는 8081 포트를 사용합니다.
* `-d` 플래그 - 컨테이너를 백그라운드에서 실행합니다.

```
$ docker run -p 8080:80 -d react-app-dev:0.1
8907355ca6fa08d4702b5242ddaa8cb138de922fe0a64c1e68b1dcbf490144dc

$ docker run -p 8081:80 -d react-app-prod:0.1
f62a53cf5186d36097b654741b858f5b01ad3a779493c69cc994f7fa02f729dc

$ docker ps -a                               
CONTAINER ID   IMAGE                COMMAND                  CREATED          STATUS          PORTS                  NAMES
f62a53cf5186   react-app-prod:0.1   "/docker-entrypoint.…"   6 seconds ago    Up 5 seconds    0.0.0.0:8081->80/tcp   lucid_dirac
8907355ca6fa   react-app-dev:0.1    "/docker-entrypoint.…"   12 seconds ago   Up 11 seconds   0.0.0.0:8080->80/tcp   focused_golick
```

### 3. 서비스 실행 결과

다음과 같은 결과를 얻을 수 있습니다.

* `localhost:8080` 접속 시 기본 리액트 어플리케이션 화면이 보입니다.
* `localhost:8081` 접속 시 `NOT FOUND` 화면이 보입니다.

<p align="center">
    <img src="/images/set-react-app-variable-when-docker-build-1.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-06-26-set-react-app-variable-when-docker-build>

#### REFERENCE

* <https://create-react-app.dev/docs/adding-custom-environment-variables/>
* <https://vsupalov.com/docker-arg-env-variable-guide/>