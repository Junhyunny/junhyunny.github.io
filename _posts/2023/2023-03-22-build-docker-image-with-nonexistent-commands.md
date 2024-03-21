---
title: "Install Nonexistent Commands into Container Image"
search: false
category:
  - docker
last_modified_at: 2023-03-22T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Build with Dockerfile and Image Layer][docker-file-build-and-image-layer-link]

## 1. Problem Context

최근 도커 이미지를 사용할 때 다음과 같은 상황을 마주쳤습니다. 

* 특정 이미지를 사용하는데 해당 이미지를 컨테이너로 띄우면 내부에 `vim`, `telnet` 같은 명령어가 없다.
* 폐쇄망에서 작업하고 있었기 때문에 컨테이너 내부에서 패키지를 다운받을 수 없다.

`apache/nifi` 컨테이너를 예시로 들어보겠습니다.

1. `docker run` 명령어를 통해 컨테이너를 실행합니다.
1. `docker exec` 명령어를 통해 컨테이너 내부에 접근합니다.
1. 컨테이너 내부에서 `vi`, `telnet` 명령어를 실행하면 찾을 수 없다는 에러 메시지를 만납니다.
    * `command not found`라는 에러 메시지가 나옵니다.

<p align="center">
    <img src="/images/build-docker-image-with-nonexistent-commands-1.gif" width="100%" class="image__border">
</p>

## 2. Solve the problem 

다음과 같은 방법으로 문제를 해결할 수 있습니다. 

* 네트워크가 연결된 외부망에서 해당 명령어를 설치한 신규 이미지 생성
* 이미지를 파일 시스템에 저장
* 폐쇄망으로 이미지 이동 후 도커 런타임에 로드(load)
* 폐쇄망에서 컨테이너 실행

### 2.1. Dockerfile

* 네트워크가 연결된 외부망에서 작업합니다.
* 원본 이미지 위에 필요한 명령어를 설치하는 지시문을 추가합니다.
* 도커 이미지를 빌드하면서 지시문을 실행할 때 권한 문제가 발생합니다.
    * `Acquire (13: Permission denied)`라는 메시지가 나옵니다.
    * `USER root` 지시문을 통해 사용자를 `root`로 변경하여 권한 문제를 해결합니다.
* 이미지 원본에서 사용한 운영체제에 따라 명령어가 일부 달라집니다.
    * Ubuntu 계열은 `apt-get`을 사용합니다.
    * CentOS 계열은 `yum`을 사용합니다.
    * Alpine 계열은 `apk`를 사용합니다.

```dockerfile
FROM apache/nifi:latest

USER root

RUN apt-get update && apt-get install -y vim telnet
```

### 2.2. Build Image

다음과 같은 명령어를 통해 이미지를 생성합니다. 
원본 이미지와 섞이지 않도록 새로운 태그를 부여합니다.

```
$ docker build . -t apache/nifi:custom
[+] Building 78.1s (6/6) FINISHED
 => [internal] load build definition from Dockerfile                                                                 0.0s
 => => transferring dockerfile: 131B                                                                                 0.0s
 => [internal] load .dockerignore                                                                                    0.0s
 => => transferring context: 2B                                                                                      0.0s
 => [internal] load metadata for docker.io/apache/nifi:latest                                                        3.1s
 => [1/2] FROM docker.io/apache/nifi:latest@sha256:59445c1bb8b9c26d44ec7e048bd19253e135c6c06df9e527b6555462ac6ff79b  61.1s
 => => resolve docker.io/apache/nifi:latest@sha256:59445c1bb8b9c26d44ec7e048bd19253e135c6c06df9e527b6555462ac6ff79b  0.0s
 => => sha256:1b4c347ee66392134621f44bd61cdc4cd1e5689c11d0a01d8f911256d1fc5718 2.47kB / 2.47kB                       0.0s
 => => sha256:10ac4908093d4325f2c94b2c9a571fa1071a17a72dd9c21c1ffb2c86f68ca028 30.43MB / 30.43MB                     1.6s
 => => sha256:59445c1bb8b9c26d44ec7e048bd19253e135c6c06df9e527b6555462ac6ff79b 685B / 685B                           0.0s
 => => sha256:6a3ca944ee8e4bcccc15f06edd29979d86996e8827d3487dcc5f35c92e3f504f 14.45kB / 14.45kB                     0.0s
 => => sha256:c5b99dc26ba300e0f809f00511dcac6ceb6c9dde4a5c0a7288225868d3a7df21 12.43MB / 12.43MB                     1.5s
 => => sha256:475d0703f5bc1c862565817c8cca45229e0c4353ec8bbf2bf354818548bd740a 46.64MB / 46.64MB                     3.5s
 => => sha256:d2576264bf764d7f43ca167c0598daa092b2266d16587f8363005f491d311759 160B / 160B                           1.8s
 => => sha256:ac4c54d7c7f4f3cbfcb03373f90e63ed12c458a6e156e5d6f3c874083d4da13a 4.64kB / 4.64kB                       1.9s
 => => extracting sha256:10ac4908093d4325f2c94b2c9a571fa1071a17a72dd9c21c1ffb2c86f68ca028                            0.7s
 => => sha256:d9bb6e322fdb9589c1f9b4e1b12ee699fbc1d2be4946626cad42992592e277d0 983B / 983B                           2.0s
 => => sha256:1435e39b563e81c43b7cea37f66d93f42aa4d2885dc4f1c82a0a880b1aed66f6 16.45MB / 16.45MB                     3.5s
 => => sha256:fab9496c7dcec79dfc1e7aca06830788f64ce51ea5cc5e2f2511e8fc2a8622bc 135.05MB / 135.05MB                   8.2s
 => => extracting sha256:c5b99dc26ba300e0f809f00511dcac6ceb6c9dde4a5c0a7288225868d3a7df21                            0.5s
 => => sha256:b9ab4bda4ce227a90f4d4c76eb8ff853cd237be20691621f4926d909e59dee9c 1.49GB / 1.49GB                       52.2s
 => => extracting sha256:475d0703f5bc1c862565817c8cca45229e0c4353ec8bbf2bf354818548bd740a                            0.9s
 => => sha256:43534088789c59b1f28b2b9d094ae8fa201811eec1f759384d228bf1884b8527 227B / 227B                           3.8s
 => => sha256:4f4fb700ef54461cfa02571ae0db9a0dc1e0cdb5577484a6d75e68dc38e8acc1 32B / 32B                             4.1s
 => => extracting sha256:d2576264bf764d7f43ca167c0598daa092b2266d16587f8363005f491d311759                            0.0s
 => => extracting sha256:ac4c54d7c7f4f3cbfcb03373f90e63ed12c458a6e156e5d6f3c874083d4da13a                            0.0s
 => => extracting sha256:d9bb6e322fdb9589c1f9b4e1b12ee699fbc1d2be4946626cad42992592e277d0                            0.0s
 => => extracting sha256:1435e39b563e81c43b7cea37f66d93f42aa4d2885dc4f1c82a0a880b1aed66f6                            0.3s
 => => extracting sha256:fab9496c7dcec79dfc1e7aca06830788f64ce51ea5cc5e2f2511e8fc2a8622bc                            0.8s
 => => extracting sha256:b9ab4bda4ce227a90f4d4c76eb8ff853cd237be20691621f4926d909e59dee9c                            8.1s
 => => extracting sha256:43534088789c59b1f28b2b9d094ae8fa201811eec1f759384d228bf1884b8527                            0.0s
 => => extracting sha256:4f4fb700ef54461cfa02571ae0db9a0dc1e0cdb5577484a6d75e68dc38e8acc1                            0.0s
 => [2/2] RUN apt-get update && apt-get install -y vim telnet                                                        13.2s
 => exporting to image                                                                                               0.6s
 => => exporting layers                                                                                              0.6s
 => => writing image sha256:436be1f6ff2c82784f73faf147b4723fe50be732651facc2c9d95fc7655ee9e3                         0.0s
 => => naming to docker.io/apache/nifi:custom                                                                        0.0s

$ docker images
REPOSITORY    TAG       IMAGE ID       CREATED          SIZE
apache/nifi   custom    436be1f6ff2c   17 seconds ago   2.05GB
```

### 2.3. Save Image

* 도커 런타임에 올라가 있는 이미지를 파일로 저장합니다.
* `docker save` 명령어를 통해 `tar` 파일로 저장합니다.

```
$ docker images
REPOSITORY    TAG       IMAGE ID       CREATED          SIZE
apache/nifi   custom    436be1f6ff2c   17 seconds ago   2.05GB

$ docker save --output apache-nifi-custom.tar apache/nifi:custom

$ ls -alsh apache-nifi-custom.tar
4043456 -rw-------  1 junhyunk  staff   1.9G  3 22 22:32 apache-nifi-custom.tar
```

### 2.4. Load Image

* 생성한 이미지 파일을 폐쇄망으로 옮긴 후 진행하는 작업입니다.
* `docker load` 명령어를 통해 `tar` 파일을 도커 런타임에 이미지로써 올립니다.

```
$ docker load --input apache-nifi-custom.tar
Loaded image: apache/nifi:custom

$ docker images
REPOSITORY    TAG       IMAGE ID       CREATED         SIZE
apache/nifi   custom    436be1f6ff2c   6 minutes ago   2.05GB
```

### 2.5. Run Container

다음 명령어를 통해 컨테이너를 실행합니다.

```
$ docker run --name nifi-custom -d apache/nifi:custom
b77cfcfa25b65559e8f287b9bdd64fa72ffc2e1af563832471ebf6cdfd85400e
```

* 실행된 컨테이너 내부에 접근합니다.
* 기존에 없던 명령어가 잘 실행되는지 확인합니다.

<p align="center">
    <img src="/images/build-docker-image-with-nonexistent-commands-2.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-03-22-build-docker-image-with-nonexistent-commands>

#### REFERENCE

* <https://dev.to/greenteabiscuit/installing-vim-in-a-docker-container-15i6>
* <https://forums.docker.com/t/cannot-use-vim-vi-nano-yum-inside-docker-container/14905/4>
* <https://docs.docker.com/engine/reference/commandline/save/>
* <https://docs.docker.com/engine/reference/commandline/load/>
* <https://stackoverflow.com/questions/54268180/why-does-simple-dockerfile-give-permission-denied>

[docker-file-build-and-image-layer-link]: https://junhyunny.github.io/information/docker/docker-file-build-and-image-layer/