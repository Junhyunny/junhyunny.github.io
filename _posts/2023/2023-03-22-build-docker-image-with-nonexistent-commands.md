---
title: "컨테이너 이미지에 없는 CLI 명령어 설치하기"
search: false
category:
  - docker
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Dockerfile 빌드와 이미지 레이어(Image Layer)][docker-file-build-and-image-layer-link]

## 1. Problem Context

최근 도커 이미지를 사용할 때 다음과 같은 상황을 마주쳤다.

- 특정 이미지를 사용하는데 해당 이미지를 컨테이너로 띄우면 내부에 `vim`, `telnet` 같은 명령어가 없다.
- 폐쇄망에서 작업하고 있었기 때문에 컨테이너 내부에서 패키지를 다운받을 수 없다.

`apache/nifi` 컨테이너를 예시로 살펴보자.

1. `docker run` 명령어를 통해 컨테이너를 실행한다.
2. `docker exec` 명령어를 통해 컨테이너 내부에 접근한다.
3. 컨테이너 내부에서 `vi`, `telnet` 명령어를 실행하면 찾을 수 없다는 에러 메시지를 만난다.
  - `command not found`라는 에러 메시지가 나온다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/build-docker-image-with-nonexistent-commands-01.gif" width="100%" class="image__border">
</div>

## 2. Solve the problem

다음과 같은 방법으로 문제를 해결할 수 있다.

1. 네트워크가 연결된 외부망에서 해당 명령어를 설치한 신규 이미지 생성
2. 이미지를 파일 시스템에 저장
3. 폐쇄망으로 이미지 이동 후 도커 런타임에 로드(load)
4. 폐쇄망에서 컨테이너 실행

다음과 같은 도커 파일을 만든다. 네트워크가 연결된 외부망에서 작업한다. 원본 이미지 위에 필요한 명령어를 설치하는 지시문을 추가한다.

- 도커 이미지를 빌드하면서 지시문을 실행할 때 권한 문제가 발생한다.
  - `Acquire (13: Permission denied)`라는 메시지가 나온다.
  - `USER root` 지시문을 통해 사용자를 `root`로 변경하여 권한 문제를 해결한다.
- 이미지 원본에서 사용한 운영체제에 따라 명령어가 일부 달라진다.
  - Ubuntu 계열은 `apt-get`을 사용한다.
  - CentOS 계열은 `yum`을 사용한다.
  - Alpine 계열은 `apk`를 사용한다.

```dockerfile
FROM apache/nifi:latest

USER root

RUN apt-get update && apt-get install -y vim telnet
```

다음과 같은 명령어를 통해 이미지를 생성한다. 원본 이미지와 섞이지 않도록 새로운 태그를 부여한다.

```
$ docker build . -t apache/nifi:custom

...

 => [2/2] RUN apt-get update && apt-get install -y vim telnet                                           13.2s
 => exporting to image                                                                                  0.6s
 => => exporting layers                                                                                 0.6s
 => => writing image sha256:436be1f6ff2c82784f73faf147b4723fe50be732651facc2c9d95fc7655ee9e3            0.0s
 => => naming to docker.io/apache/nifi:custom                                                           0.0s
```

이미지가 잘 생성되었는지 확인한다.

```
$ docker images

REPOSITORY    TAG       IMAGE ID       CREATED          SIZE
apache/nifi   custom    436be1f6ff2c   17 seconds ago   2.05GB
```

도커 런타임에만 존재하는 컨테이너 이미지를 파일 시스템에 저장한다. `docker save` 명령어를 통해 `tar` 파일로 저장한다.

```
$ docker save --output apache-nifi-custom.tar apache/nifi:custom

$ ls -alsh apache-nifi-custom.tar
4043456 -rw-------  1 junhyunk  staff   1.9G  3 22 22:32 apache-nifi-custom.tar
```

이미지가 압축된 tar 파일을 폐쇄망 시스템으로 옮긴 후 서버에 로드한다. `docker load` 명령어를 통해 `tar` 파일을 도커 런타임에 이미지로서 올린다.

```
$ docker load --input apache-nifi-custom.tar
Loaded image: apache/nifi:custom
```

이미지가 잘 로드되었는지 확인한다.

```
$ docker images
REPOSITORY    TAG       IMAGE ID       CREATED         SIZE
apache/nifi   custom    436be1f6ff2c   6 minutes ago   2.05GB
```

다음 명령어를 통해 컨테이너를 실행한다.

```
$ docker run --name nifi-custom -d apache/nifi:custom
b77cfcfa25b65559e8f287b9bdd64fa72ffc2e1af563832471ebf6cdfd85400e
```

실행된 컨테이너 내부에 접근 후 기존에 없던 명령어가 잘 실행되는지 확인해본다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/build-docker-image-with-nonexistent-commands-02.gif" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-03-22-build-docker-image-with-nonexistent-commands>

#### REFERENCE

- <https://dev.to/greenteabiscuit/installing-vim-in-a-docker-container-15i6>
- <https://forums.docker.com/t/cannot-use-vim-vi-nano-yum-inside-docker-container/14905/4>
- <https://docs.docker.com/engine/reference/commandline/save/>
- <https://docs.docker.com/engine/reference/commandline/load/>
- <https://stackoverflow.com/questions/54268180/why-does-simple-dockerfile-give-permission-denied>

[docker-file-build-and-image-layer-link]: https://junhyunny.github.io/information/docker/docker-file-build-and-image-layer/