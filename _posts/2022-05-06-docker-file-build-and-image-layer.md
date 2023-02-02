---
title: "Dockerfile 빌드와 Docker Image Layer"
search: false
category:
  - information
  - docker
last_modified_at: 2022-05-06T23:55:00
---

<br/>

## 1. Docker build with Dockerfile

`Dockerfile`을 이용하여 도커 이미지를 만들어보았습니다. 
첫 빌드와 다음 빌드의 차이점을 살펴보겠습니다. 

##### Dockerfile

```dockerfile
FROM node:12

WORKDIR /app

COPY . /app

RUN npm install

EXPOSE 80

CMD ["node", "server.js"]
```

##### First docker build

- `build` 커맨드를 사용하여 이미지를 만들면 다음과 같은 로그가 출력됩니다.
- `Dockerfile`에 작성한 명령들을 기준으로 하나씩 살펴보겠습니다.
    - `FROM node:12` - 도커 레지스트리에서 필요한 이미지를 다운받습니다.
    - `WORKDIR /app` - 작업 디렉토리를 `app`으로 변경합니다.
    - `COPY . /app` - 호스트의 현재 디렉토리의 파일들을 모두 `app` 폴더로 이동합니다.
    - `RUN npm install` - `npm` 커맨드를 사용하여 필요한 패키지들을 설치합니다.

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

##### Second docker build

- 도커 이미지를 삭제하고, 프로젝트에 다른 변경 없이 다시 이미지를 빌드하였습니다. 
- `build` 커맨드를 사용하여 이미지를 만들면 다음과 같은 로그가 출력됩니다.
- `Dockerfile`에 작성한 명령들을 기준으로 하나씩 살펴보겠습니다.
    - `FROM node:12` - 도커 레지스트리에서 필요한 이미지를 다운받지 않습니다.
    - `CACHED WORKDIR /app` - `CACHED`, 이전 빌드에서 작업한 내용을 그대로 사용합니다.
    - `CACHED COPY . /app` - `CACHED`, 이전 빌드에서 작업한 내용을 그대로 사용합니다.
    - `CACHED RUN npm install` - `CACHED`, 이전 빌드에서 작업한 내용을 그대로 사용합니다.

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

도커 이미지는 `레이어(layer)`로 이뤄져 있습니다. 
`Dockerfile`을 통해 도커 이미지를 만들면 도커 파일의 각 명령어(instruction)가 이미지를 구성하기 위한 레이어가 됩니다. 
각 레이어들은 독립적으로 저장되며 `읽기 전용(read only)`이기 때문에 수정이 불가능합니다. 

`Dockerfile`의 작성된 모든 
- WORKDIR 명령어는 레이어로 저장됩니다.
    - 도커 이미지 사이즈에 영향을 미치지 않습니다.
    - 레이어가 저장되므로 이미지 빌드 시 캐싱이 가능합니다.
- RUN, ADD 그리고 COPY 명령어는 레이어로 저장됩니다.
    - 도커 이미지 사이즈에 영향을 미칩니다.
    - 레이어가 저장되므로 이미지 빌드 시 캐싱이 가능합니다.
- CMD, LABEL, ENV, EXPOSE 등 메타 정보를 다루는 명령어들은 임시로 레이어가 생성되지만, 저장되지 않습니다.
    - 도커 이미지 사이즈에 영향을 미치지 않습니다.
    - 레이어가 저장되지 않으므로 이미지 빌드 시 캐싱이 불가능합니다.

##### Dockerfile instruction and image layer

<p align="center">
    <img src="/images/docker-file-build-and-image-layer-1.JPG" width="100%" class="image__border">
</p>
<center>https://kimjingo.tistory.com/62</center>

##### docker history command to see the layer

- `history` 커맨드를 통해 이미지를 구성하는 레이어 정보를 확인할 수 있습니다. 

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

### 1.2. Layer caching

`Dockerfile`을 통해 이미지를 만들 때 생성되는 레이어들은 변경이 없다면 재사용이 가능합니다. 
이미지 빌드를 더 빠르게 하기 위해 이미지 레이어를 효율적으로 재사용하려면 `Dockerfile` 구조를 고민해볼 필요가 있습니다. 
`Dockerfile`을 통한 빌드 시 변경이 일어난 명령어부터 모두 재실행된다는 점을 고려하고 작성해야합니다. 
이전 단계에서 작성한 `Dockerfile`을 먼저 살펴보고, 이를 효율적인 모습으로 변경해보겠습니다. 

##### 이전 Dockerfile 문제점

- `COPY . /app` 명령어를 통해 현재 프로젝트 파일들을 모두 컨테이너로 복사합니다.
- 프로젝트 내 변경이 있을 때마다 `COPY . /app` 명령어부터 모두 재실행합니다. 
- 단순한 소스 코드의 변경만으로 시간적 비용이 높은 `RUN npm install`을 매번 실행하게 됩니다. 
    - `npm install` 명령어 실행은 소스 코드만 변경되었을 때

```dockerfile
FROM node:12

WORKDIR /app

COPY . /app

RUN npm install

EXPOSE 80

CMD ["node", "server.js"]
```

##### 효율적인 Dockerfile 그리고 .dockerignore 파일

- 다음과 같이 변경하면 효율적인 빌드가 가능합니다.
- `COPY package.json /app` 명령어를 통해 의존성 관리를 위한 `package.json` 파일만 복사합니다.
- `RUN npm install` 명령어는 `package.json` 파일의 변경이 있을 때만 재실행합니다.
- 단순한 소스 코드의 변경이 발생하면 `COPY . /app` 명령어부터 재실행하고, 이전 단계에서는 기존에 만든 이미지 레이어를 사용합니다.

```dockerfile
FROM node:12

WORKDIR /app

COPY package.json /app

RUN npm install

COPY . /app

EXPOSE 80

CMD ["node", "server.js"]
```

- 빌드를 더 효율적으로 개선하기 위해서 `.dockerignore` 파일을 만듭니다.
- 도커 이미지 빌드 시 불필요한 파일들이 포함되지 않도록 불필요 항목들을 추가합니다.

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