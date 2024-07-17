---
title: "EXPOSE command in Dockerfile"
search: false
category:
  - information
  - docker
last_modified_at: 2022-05-04T23:55:00
---

<br/>

## 1. EXPOSE command

도커 이미지를 빌드(build)할 때 사용하는 `도커 파일(Dockerfile)`을 작성한다. 도커 파일에 작성하는 `EXPOSE` 명령어는 필수가 아니다. EXPOSE 명령어가 없더라도 도커 이미지를 생성과 컨테이너 실행이 가능하다. 공식 문서를 보면 다음과 같은 설명을 찾을 수 있다.

> [EXPOSE](https://docs.docker.com/engine/reference/builder/#expose)<br/>
> The EXPOSE instruction does not actually publish the port. 
> It functions as a type of documentation between the person who builds the image 
> and the person who runs the container, about which ports are intended to be published. 
> To actually publish the port when running the container, use the -p flag on docker run to publish and map one or more ports, 
> or the -P flag to publish all exposed ports and map them to high-order ports.

EXPOSE 명령어에 명시된 포트는 실제로 노출하는 포트를 의미하지는 않지만, 이미지를 만드는 사람과 컨테이너를 실행시키는 사람 사이에 컨텍스트 공유를 위한 지침 정도로 보인다. 아래 리액트 애플리케이션 도커 파일을 기준으로 `-P`, `-p` 플래그 옵션이 어떻게 동작하는지 살펴보자. 

- `EXPOSE` 명령으로 노출할 포트를 80으로 명시한다. 

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

예제에서 nginx 이미지를 사용하기 때문에 다음 설정 파일이 추가적으로 필요하다.

- nginx 설정의 `listen` 값을 80으로 지정한다.
- 컨테이너 내부에서 nginx 웹 서버는 80번 포트를 사용한다.

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

## 2. Usage flags

위에서 언급했듯이 도커 커맨드의 -p, -P 옵션을 사용해서 컨테이너를 실행해보자.  

### 2.1. -P option

-P(--publish-all) 옵션을 사용하면 호스트(host) 컴퓨터의 임의의 포트를 컨테이너에 바인딩(binding)한다. 바인딩 된 포트로 요청을 보내면 해당 요청은 EXPOSE 명령어에 정의된 포트 애플리케이션으로 포트 포워딩(port forwarding)된다. 즉 `-P` 플래그를 사용하면 호스트의 랜덤한 포트가 도커 파일에 `EXPOSE` 명령어로 명시한 포트와 연결된다. -P 옵션을 사용해 컨테이너를 실행해보자.

- 별도로 포트를 지정하진 않았음에도 호스트(host)의 55001 포트가 컨테이너의 80 포트로 연결됩니다.

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

### 2.2. -p option

-p(--expose) 옵션은 바인딩 할 호스트의 포트와 컨테이너의 포트를 명시적으로 작성하는 방법이다. 아래 예시에선 호스트의 3030 포트와 컨테이너의 80 포트를 연결했다. 호스트 컴퓨터의 3030 포트로 요청을 보내면 컨테이너의 80 포트로 요청이 포트 포워딩된다.

- `-p` 플래그 뒤에 `{host.port}:{container.port}`를 추가해 바인딩 정보를 전달한다.

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