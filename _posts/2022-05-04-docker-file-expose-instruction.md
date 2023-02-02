---
title: "Dockerfile EXPOSE 명령어"
search: false
category:
  - information
  - docker
last_modified_at: 2022-05-04T23:55:00
---

<br/>

## 1. EXPOSE 명령어

도커 이미지를 빌드(build)할 때 사용하는 `Dockerfile`에 작성하는 EXPOSE 명령어는 필수가 아닙니다. 
굳이 작성하지 않아도 도커 이미지를 만들고, 컨테이너를 실행시킬 수 있습니다. 
공식 문서를 보면 다음과 같은 설명을 찾을 수 있습니다.

> [EXPOSE](https://docs.docker.com/engine/reference/builder/#expose)<br/>
> The EXPOSE instruction does not actually publish the port. 
> It functions as a type of documentation between the person who builds the image 
> and the person who runs the container, about which ports are intended to be published. 
> To actually publish the port when running the container, use the -p flag on docker run to publish and map one or more ports, 
> or the -P flag to publish all exposed ports and map them to high-order ports.

EXPOSE 명령과 함께 작성하는 포트 번호는 실제로 노출하는 포트를 의미하지는 않지만, 
이미지를 만드는 사람과 컨테이너를 실행시키는 사람 사이의 컨텍스트 공유를 위한 문서 역할정도로 보입니다. 
아래 리액트 프로젝트를 빌드하기 위한 `Dockerfile`을 기준으로 `-P`, `-p` 플래그 옵션이 어떻게 동작하는지 확인해보곘습니다. 

##### Dockerfile

- `EXPOSE` 명령으로 노출할 포트를 80으로 명시하였습니다. 

```dockerfile
FROM node as builder

RUN mkdir /app

WORKDIR /app

COPY package.json .

RUN npm install --silent

COPY . .

RUN npm run build

FROM nginx

COPY conf/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

##### nginx.conf

- `nginx`의 `listen` 값을 80으로 작성하여 포트 값을 결정합니다.
- 컨테이너에서 공개하는 포트를 80 이 외에 다른 포트로 지정하는 경우 정상적으로 컨테이너의 어플리케이션이 연결되지 않습니다.

```conf
server {
    listen 80;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
```

## 2. 플래그 사용

### 2.1. -P 플래그 사용

- 별도로 지정하진 않았지만, 호스트(host)의 55001 포트가 컨테이너의 80 포트로 연결됩니다.
- `-P` 플래그를 사용하면 호스트의 랜덤한 포트가 `Dockerfile`에 `EXPOSE` 명령어로 명시한 포트와 연결됩니다.

```
$ docker images 
REPOSITORY   TAG       IMAGE ID       CREATED       SIZE
<none>       <none>    e273fa25a9e3   2 hours ago   142MB

$ docker run -d -P e273fa25a9e3          
0f199f5febb159e8204bf57ca2034162ad88042c07a733735e79915aab2fec9c

$ docker ps -a                 
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                   NAMES
0f199f5febb1   e273fa25a9e3   "/docker-entrypoint.…"   5 seconds ago   Up 3 seconds   0.0.0.0:55001->80/tcp   happy_rubin
```

### 2.2. -p 플래그 사용

- `-p` 플래그를 사용하면 컨테이너를 실행시킬 때 호스트의 포트와 컨테이너의 포트를 명시적으로 연결할 수 있습니다.
- `-p` 플래그 뒤에 `{host.port}:{container.port}`를 추가하여 연결 정보를 전달합니다.
    - 아래 예시에선 호스트의 3030 포트와 컨테이너의 80 포트를 연결하였습니다.

```
$ docker images                             
REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
<none>       <none>    e273fa25a9e3   27 hours ago   142MB

$ docker run -d -p 3030:80 e273fa25a9e3   
d49c0dcdb26a6f2be9f1ab68e38838434b6185a99b8d5999f87d8ace1b24989b

$ docker ps -a                         
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                   NAMES
d49c0dcdb26a   e273fa25a9e3   "/docker-entrypoint.…"   7 seconds ago   Up 6 seconds   0.0.0.0:3030->80/tcp    vibrant_mestorf
0f199f5febb1   e273fa25a9e3   "/docker-entrypoint.…"   25 hours ago    Up 25 hours    0.0.0.0:55001->80/tcp   happy_rubin
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-05-04-docker-file-expose-instruction>

#### REFERENCE
- <https://soft.plusblog.co.kr/139>