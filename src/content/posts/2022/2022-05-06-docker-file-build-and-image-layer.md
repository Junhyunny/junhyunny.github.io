---
title: "Dockerfile 빌드와 이미지 레이어(Image Layer)"
publishedAt: "2022-05-06"
updatedAt: "2026-11-12T16:19:45+09:00"
canonicalPath: "/information/docker/docker-file-build-and-image-layer/"
categories:
  - "information"
  - "docker"
summary: "Dockerfile 명령어와 이미지 레이어의 관계, 레이어 캐싱을 살펴보고 캐시를 활용하는 효율적인 Dockerfile과 .dockerignore 작성 방법을 정리했다."
---

## 1. Docker build with Dockerfile

`Dockerfile`을 이용해 도커 이미지를 만들어 봤다. 첫 빌드와 다음 빌드의 차이점을 살펴보자. 사용한 `Dockerfile`은 다음과 같다.

```dockerfile
FROM node:12

WORKDIR /app

COPY . /app

RUN npm install

EXPOSE 80

CMD ["node", "server.js"]
```

처음 `build` 커맨드로 이미지를 만들면 아래와 같은 로그가 출력된다. `Dockerfile`에 작성한 명령을 기준으로 하나씩 살펴보면 다음과 같다.

- `FROM node:12` - 도커 레지스트리에서 필요한 이미지를 내려받는다.
- `WORKDIR /app` - 작업 디렉터리를 `app`으로 변경한다.
- `COPY . /app` - 호스트의 현재 디렉터리에 있는 파일을 모두 `app` 폴더로 복사한다.
- `RUN npm install` - `npm` 커맨드로 필요한 패키지를 설치한다.

```
$ docker build .
[+] Building 9.3s (10/10) FINISHED
 => [internal] load build definition from Dockerfile                                                                 0.0s
 => => transferring dockerfile: 184B                                                                                 0.0s
 => [internal] load .dockerignore                                                                                    0.0s
 => => transferring context: 2B                                                                                      0.0s
 => [internal] load metadata for docker.io/library/node:12                                                           3.8s
 => [auth] library/node:pull token for registry-1.docker.io                                                          0.0s
 => [1/4] FROM docker.io/library/node:12@sha256:01627afeb110b3054ba4a1405541ca095c8bfca1cb6f2be9479c767a2711879e     2.7s
 => => resolve docker.io/library/node:12@sha256:01627afeb110b3054ba4a1405541ca095c8bfca1cb6f2be9479c767a2711879e     0.0s
 => => sha256:3a69ea1270dbf4ef20477361be4b7a43400e559c6abdfaf69d73f7c755f434f5 2.21kB / 2.21kB                       0.0s
 => => sha256:6c8de432fc7f7d8c58899f61982d1662ec6b73fb3ef92f862ba170dcc5b64fa9 7.68kB / 7.68kB                       0.0s
 => => sha256:df2c3b2eb7cc63351bb32f26457bbe0402af8082548f26975f0c329bc7841881 23.70MB / 23.70MB                     1.2s
 => => sha256:01627afeb110b3054ba4a1405541ca095c8bfca1cb6f2be9479c767a2711879e 776B / 776B                           0.0s
 => => sha256:efe636eac583776a8a114d50fef15bc65b648f3d2bb53326cf1f21cc5ef2b3ae 2.34MB / 2.34MB                       0.7s
 => => sha256:fe17849545bb51455d3f7c8773ded2dbb1d6668a85bd00564573a4b88afd36f6 464B / 464B                           0.8s
 => => extracting sha256:df2c3b2eb7cc63351bb32f26457bbe0402af8082548f26975f0c329bc7841881                            1.2s
 => => extracting sha256:efe636eac583776a8a114d50fef15bc65b648f3d2bb53326cf1f21cc5ef2b3ae                            0.1s
 => => extracting sha256:fe17849545bb51455d3f7c8773ded2dbb1d6668a85bd00564573a4b88afd36f6                            0.0s
 => [internal] load build context                                                                                    1.8s
 => => transferring context: 12.34kB                                                                                 1.6s
 => [2/4] WORKDIR /app                                                                                               0.2s
 => [3/4] COPY . /app                                                                                                0.0s
 => [4/4] RUN npm install                                                                                            2.4s
 => exporting to image                                                                                               0.1s
 => => exporting layers                                                                                              0.1s
 => => writing image sha256:7cdb07daed3b7bfc74a4d61c97eae38ea434ede3fa1707123f04250e3528a455
```

다음으로 도커 이미지를 삭제하고, 프로젝트를 변경하지 않은 채 다시 이미지를 빌드했다. 이때 `build` 커맨드로 이미지를 만들면 아래와 같은 로그가 출력된다. `Dockerfile`에 작성한 명령을 기준으로 하나씩 살펴보면 다음과 같다.

- `FROM node:12` - 도커 레지스트리에서 필요한 이미지를 내려받지 않는다.
- `CACHED WORKDIR /app` - `CACHED`, 이전 빌드에서 작업한 내용을 그대로 사용한다.
- `CACHED COPY . /app` - `CACHED`, 이전 빌드에서 작업한 내용을 그대로 사용한다.
- `CACHED RUN npm install` - `CACHED`, 이전 빌드에서 작업한 내용을 그대로 사용한다.

```
$ docker images -a
REPOSITORY   TAG       IMAGE ID       CREATED         SIZE
<none>       <none>    7cdb07daed3b   6 minutes ago   922MB

$ docker rmi $(docker images -q)
Deleted: sha256:7cdb07daed3b7bfc74a4d61c97eae38ea434ede3fa1707123f04250e3528a455

$ docker images -a
REPOSITORY   TAG       IMAGE ID   CREATED   SIZE

$ docker build .
[+] Building 2.7s (10/10) FINISHED
 => [internal] load build definition from Dockerfile                                                                 0.0s
 => => transferring dockerfile: 84B                                                                                  0.0s
 => [internal] load .dockerignore                                                                                    0.0s
 => => transferring context: 2B                                                                                      0.0s
 => [internal] load metadata for docker.io/library/node:12                                                           2.6s
 => [auth] library/node:pull token for registry-1.docker.io                                                          0.0s
 => [internal] load build context                                                                                    0.0s
 => => transferring context: 720B                                                                                    0.0s
 => [1/4] FROM docker.io/library/node:12@sha256:01627afeb110b3054ba4a1405541ca095c8bfca1cb6f2be9479c767a2711879e     0.0s
 => CACHED [2/4] WORKDIR /app                                                                                        0.0s
 => CACHED [3/4] COPY . /app                                                                                         0.0s
 => CACHED [4/4] RUN npm install                                                                                     0.0s
 => exporting to image                                                                                               0.0s
 => => exporting layers                                                                                              0.0s
 => => writing image sha256:7cdb07daed3b7bfc74a4d61c97eae38ea434ede3fa1707123f04250e3528a455                         0.0s
```

### 1.1. Docker image layer

도커 이미지는 `레이어(layer)`로 이뤄져 있다. `Dockerfile`로 도커 이미지를 만들면 도커 파일의 각 명령어(instruction)가 이미지를 구성하는 레이어가 된다. 각 레이어는 독립적으로 저장되며 `읽기 전용(read only)`이기 때문에 수정할 수 없다.

`Dockerfile`에 작성된 모든 명령어가 이미지 크기에 영향을 주는 것은 아니다.

- WORKDIR 명령어는 레이어로 저장된다.
  - 도커 이미지 크기에 영향을 미치지 않는다.
  - 레이어가 저장되므로 이미지 빌드 시 캐싱할 수 있다.
- RUN, ADD 그리고 COPY 명령어는 레이어로 저장된다.
  - 도커 이미지 크기에 영향을 미친다.
  - 레이어가 저장되므로 이미지 빌드 시 캐싱할 수 있다.
- CMD, LABEL, ENV, EXPOSE 등 메타 정보를 다루는 명령어는 임시로 레이어가 생성되지만, 저장되지 않는다.
  - 도커 이미지 크기에 영향을 미치지 않는다.
  - 레이어가 저장되지 않으므로 이미지 빌드 시 캐싱할 수 없다.

`Dockerfile` 명령어와 이미지 레이어의 관계를 그림으로 나타내면 다음과 같다.

<div class="block-break">
  <div align="center">
    <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/docker-file-build-and-image-layer-01.png" width="100%" class="image__border">
  </div>
  <center>https://kimjingo.tistory.com/62</center>
</div>

`history` 커맨드로 이미지를 구성하는 레이어 정보를 확인할 수 있다.

```
$ docker images
REPOSITORY   TAG       IMAGE ID       CREATED             SIZE
<none>       <none>    7cdb07daed3b   About an hour ago   922MB

$ docker image history 7cdb07daed3b
IMAGE          CREATED             CREATED BY                                      SIZE      COMMENT
7cdb07daed3b   About an hour ago   CMD ["node" "server.js"]                        0B        buildkit.dockerfile.v0
<missing>      About an hour ago   EXPOSE map[80/tcp:{}]                           0B        buildkit.dockerfile.v0
<missing>      About an hour ago   RUN /bin/sh -c npm install # buildkit           4.42MB    buildkit.dockerfile.v0
<missing>      About an hour ago   COPY . /app # buildkit                          11.5kB    buildkit.dockerfile.v0
<missing>      About an hour ago   WORKDIR /app                                    0B        buildkit.dockerfile.v0
<missing>      2 weeks ago         /bin/sh -c #(nop)  CMD ["node"]                 0B
<missing>      2 weeks ago         /bin/sh -c #(nop)  ENTRYPOINT ["docker-entry…   0B
<missing>      2 weeks ago         /bin/sh -c #(nop) COPY file:4d192565a7220e13…   388B
<missing>      2 weeks ago         /bin/sh -c set -ex   && for key in     6A010…   7.72MB
<missing>      2 weeks ago         /bin/sh -c #(nop)  ENV YARN_VERSION=1.22.18     0B
<missing>      2 weeks ago         /bin/sh -c ARCH= && dpkgArch="$(dpkg --print…   74.4MB
<missing>      2 weeks ago         /bin/sh -c #(nop)  ENV NODE_VERSION=12.22.12    0B
<missing>      2 weeks ago         /bin/sh -c groupadd --gid 1000 node   && use…   333kB
<missing>      2 weeks ago         /bin/sh -c set -ex;  apt-get update;  apt-ge…   562MB
<missing>      2 weeks ago         /bin/sh -c apt-get update && apt-get install…   141MB
<missing>      2 weeks ago         /bin/sh -c set -ex;  if ! command -v gpg > /…   7.82MB
<missing>      2 weeks ago         /bin/sh -c set -eux;  apt-get update;  apt-g…   24.1MB
<missing>      2 weeks ago         /bin/sh -c #(nop)  CMD ["bash"]                 0B
<missing>      2 weeks ago         /bin/sh -c #(nop) ADD file:6ed691b65385dede4…   101MB
```

### 1.2. Layer Caching

`Dockerfile`로 이미지를 만들 때 생성되는 레이어는 변경이 없다면 재사용할 수 있다. 이미지를 더 빠르게 빌드하려고 이미지 레이어를 효율적으로 재사용하려면 `Dockerfile` 구조를 고민해야 한다. `Dockerfile`로 빌드할 때는 변경이 일어난 명령어부터 모두 재실행된다는 점을 고려해 작성해야 한다. 이전 단계에서 작성한 `Dockerfile`을 먼저 살펴보고, 이를 효율적인 모습으로 바꿔 보자.

이전 `Dockerfile`은 `COPY . /app` 명령어로 현재 프로젝트 파일을 모두 컨테이너로 복사한다. 그래서 프로젝트에 변경이 있을 때마다 `COPY . /app` 명령어부터 모두 재실행한다. 소스 코드만 변경되었을 때는 `npm install` 명령어를 실행할 필요가 없는데도, 단순한 소스 코드 변경 때문에 시간 비용이 높은 `RUN npm install`을 매번 실행하게 된다.

```dockerfile
FROM node:12

WORKDIR /app

COPY . /app

RUN npm install

EXPOSE 80

CMD ["node", "server.js"]
```

다음과 같이 변경하면 효율적으로 빌드할 수 있다. `COPY package.json /app` 명령어로 의존성 관리를 위한 `package.json` 파일만 먼저 복사하므로, `RUN npm install` 명령어는 `package.json` 파일이 변경되었을 때만 재실행한다. 단순히 소스 코드가 변경되면 `COPY . /app` 명령어부터 재실행하고, 이전 단계에서는 기존에 만든 이미지 레이어를 사용한다.

```dockerfile
FROM node:12

WORKDIR /app

COPY package.json /app

RUN npm install

COPY . /app

EXPOSE 80

CMD ["node", "server.js"]
```

빌드를 더 효율적으로 개선하기 위해 `.dockerignore` 파일을 만든다. 도커 이미지를 빌드할 때 불필요한 파일이 포함되지 않도록 해당 항목을 추가한다.

```
.dockerignore

node_modules

Dockerfile
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-05-05-docker-file-build-and-image-layer>

#### REFERENCE

- <https://kimjingo.tistory.com/62>
- <https://www.44bits.io/ko/post/how-docker-image-work>
- <https://blog.naver.com/alice_k106/221149596996>
- <https://docs.docker.com/get-started/09_image_best/#image-layering>
- <https://woochan-autobiography.tistory.com/468>
