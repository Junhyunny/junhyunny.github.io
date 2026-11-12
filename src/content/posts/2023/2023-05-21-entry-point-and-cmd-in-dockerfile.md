---
title: "Dockerfile ENTRYPOINT와 CMD"
publishedAt: "2023-05-21"
updatedAt: "2026-11-12T16:19:33+09:00"
canonicalPath: "/docker/entry-point-and-cmd-in-dockerfile/"
categories:
  - "docker"
summary: "도커 파일의 ENTRYPOINT와 CMD 지시문이 컨테이너 실행 시 추가한 명령어와 어떻게 결합되는지 비교하고, 둘을 함께 쓰는 권장 방식을 정리했다."
recommendedPosts:
  - title: "Dockerfile 빌드와 이미지 레이어(Image Layer)"
    href: "https://junhyunny.github.io/information/docker/docker-file-build-and-image-layer/"
---

## 0. 들어가면서

도커 파일(dockerfile)을 작성할 때 `ENTRYPOINT`와 `CMD` 지시문으로 추가한 명령문은 컨테이너가 실행될 때 함께 수행된다. 같은 기능을 하는 듯 보이지만, 구분해서 사용하는 이유가 분명히 있다. 도커 파일을 작성하면서 종종 차이점을 찾아보곤 했는데, 개념을 명확히 세우고자 이번 글로 정리했다.

## 1. ENTRYPOINT Instruction

> 컨테이너가 실행될 때 반드시 함께 실행되는 명령어

`ENTRYPOINT`에 작성된 명령문은 반드시 실행된다. 이름처럼 컨테이너 실행의 시작 지점이다. `ENTRYPOINT` 지시문으로 작성한 명령문으로 실행된 프로세스가 종료되면 컨테이너도 함께 종료된다. 간단한 도커 파일로 이미지를 만들고 컨테이너를 실행하는 예시로 이 기능을 살펴보자.

다음 `Dockerfile-entrypoint` 파일은 우분투 이미지를 기반으로 이미지를 빌드한다. 이 파일로 빌드한 이미지를 컨테이너로 실행하면 `ls` 명령문이 수행된다.

```dockerfile
FROM ubuntu

ENTRYPOINT ["ls"]
```

다음 명령어로 이미지를 빌드한다.

```
$ docker build -t ubuntu:entry-point -f Dockerfile-entrypoint .
[+] Building 0.1s (5/5) FINISHED
 => [internal] load build definition from Dockerfile-entrypoint                                0.0s
 => => transferring dockerfile: 79B                                                            0.0s
 => [internal] load .dockerignore                                                              0.0s
 => => transferring context: 2B                                                                0.0s
 => [internal] load metadata for docker.io/library/ubuntu:latest                               0.0s
 => [1/1] FROM docker.io/library/ubuntu                                                        0.0s
 => exporting to image                                                                         0.0s
 => => exporting layers                                                                        0.0s
 => => writing image sha256:dd817191f69a1ee45cff089113c70d7d9789ad98699b6477ba39d32e19cd2462   0.0s
 => => naming to docker.io/library/ubuntu:entry-point                                          0.0s
```

컨테이너를 실행하면 `ls` 명령문이 실행된다.

```
$ docker run --name entry-point ubuntu:entry-point

bin
boot
dev
etc
home
lib
lib32
lib64
libx32
media
mnt
opt
proc
root
run
sbin
srv
sys
tmp
usr
var
```

이번엔 컨테이너를 실행할 때 `Hello World` 문자열을 출력하는 명령어를 파라미터로 추가한다. 추가한 명령어는 `ls` 명령문의 파라미터로 전달되기 때문에 `ls` 명령문이 `echo`, `Hello World` 파일이나 디렉터리에 접근할 수 없다는 에러 메시지가 출력된다.

```
$ docker run --name entry-point ubuntu:entry-point echo "Hello World"

ls: cannot access 'echo': No such file or directory
ls: cannot access 'Hello World': No such file or directory
```

## 2. CMD Instruction

> 컨테이너가 실행될 때 선택적으로 실행되는 명령어

`CMD` 지시문은 컨테이너가 실행될 때 함께 수행될 기본(default) 명령문을 지정한다. 컨테이너를 실행하면서 추가 명령문을 전달하면 도커 파일에 작성된 명령문은 무시된다.

다음 `Dockerfile-cmd` 파일도 우분투 이미지를 기반으로 이미지를 빌드한다. 이 파일로 빌드한 이미지를 컨테이너로 실행하면 `ls` 명령문이 수행된다.

```dockerfile
FROM ubuntu

CMD ["ls"]
```

다음 명령어로 이미지를 빌드한다.

```
$ docker build -t ubuntu:cmd -f Dockerfile-cmd .

[+] Building 0.0s (5/5) FINISHED
 => [internal] load .dockerignore                                                               0.0s
 => => transferring context: 2B                                                                 0.0s
 => [internal] load build definition from Dockerfile-cmd                                        0.0s
 => => transferring dockerfile: 65B                                                             0.0s
 => [internal] load metadata for docker.io/library/ubuntu:latest                                0.0s
 => CACHED [1/1] FROM docker.io/library/ubuntu                                                  0.0s
 => exporting to image                                                                          0.0s
 => => exporting layers                                                                         0.0s
 => => writing image sha256:d3c1b41e14bb4397ae451bde84a7dfb64f33c300f21ac7c1fbfe367b9c2fddb9    0.0s
 => => naming to docker.io/library/ubuntu:cmd                                                   0.0s
```

컨테이너를 실행하면 `ls` 명령문이 실행된다.

```
$ docker run --name cmd ubuntu:cmd

bin
boot
dev
etc
home
lib
lib32
lib64
libx32
media
mnt
opt
proc
root
run
sbin
srv
sys
tmp
usr
var
```

컨테이너를 실행할 때 `Hello World` 문자열을 출력하는 명령어를 파라미터로 추가하면 `ls` 명령문은 실행되지 않고 `Hello World` 문자열이 출력된다.

```
$ docker run --name cmd ubuntu:cmd echo "Hello World"

Hello World
```

## 3. Best Practice

두 지시어 모두 컨테이너가 실행되면 함께 실행된다. 차이점은 다음과 같다.

- `ENTRYPOINT` 지시어로 작성한 명령문이 있으면 컨테이너 실행 시점에 추가한 명령어는 파일에 작성된 명령문 뒤에 붙어서 실행된다.
- `CMD` 지시어로 작성한 명령문이 있을 때 컨테이너 실행 시점에 추가한 명령어가 있으면 파일에 작성된 명령문은 무시된다.

컨테이너 실행 시점에 반드시 함께 실행되어야 하는 명령문이 있다면 다음과 같은 방식으로 도커 파일을 작성한다.

- 반드시 실행될 명령문은 `ENTRYPOINT` 지시어로 작성한다.
- 컨테이너 실행 시점에 옵션이나 파라미터를 전달하지 않는 경우를 대비해 기본값을 `CMD` 지시어로 추가한다.

간단한 도커 파일을 작성하고, 이미지를 만들어 컨테이너를 실행해 보자. 다음 `Dockerfile-together` 파일은 `ls` 명령문을 반드시 수행하고, `.` 명령문을 `ls` 명령문 뒤에 파라미터로 추가한다.

```dockerfile
FROM ubuntu

ENTRYPOINT ["ls"]
CMD ["."]
```

다음 명령어로 이미지를 빌드한다.

```
$ docker build -t ubuntu:together -f Dockerfile-together .

[+] Building 0.0s (5/5) FINISHED
 => [internal] load .dockerignore                                                               0.0s
 => => transferring context: 2B                                                                 0.0s
 => [internal] load build definition from Dockerfile-together                                   0.0s
 => => transferring dockerfile: 88B                                                             0.0s
 => [internal] load metadata for docker.io/library/ubuntu:latest                                0.0s
 => CACHED [1/1] FROM docker.io/library/ubuntu                                                  0.0s
 => exporting to image                                                                          0.0s
 => => exporting layers                                                                         0.0s
 => => writing image sha256:5ebd365e15c4fe82eae03d27b3e16fdedb92c24ea43474649814b095c2276e83    0.0s
 => => naming to docker.io/library/ubuntu:together                                              0.0s
```

컨테이너를 실행할 때 별도로 전달한 파라미터가 없으므로 `ls .` 명령문이 실행된다.

```
$ docker run --name together ubuntu:together

bin
boot
dev
etc
home
lib
lib32
lib64
libx32
media
mnt
opt
proc
root
run
sbin
srv
sys
tmp
usr
var
```

컨테이너를 실행할 때 파라미터를 함께 전달하면 `CMD` 지시어의 기본값 대신 전달한 파라미터가 사용되므로 `ls -la dev` 명령문이 실행된다.

```
$ docker run --name together ubuntu:together -la dev

total 4
drwxr-xr-x 5 root root  340 May 21 13:50 .
drwxr-xr-x 1 root root 4096 May 21 13:50 ..
lrwxrwxrwx 1 root root   11 May 21 13:50 core -> /proc/kcore
lrwxrwxrwx 1 root root   13 May 21 13:50 fd -> /proc/self/fd
crw-rw-rw- 1 root root 1, 7 May 21 13:50 full
drwxrwxrwt 2 root root   40 May 21 13:50 mqueue
crw-rw-rw- 1 root root 1, 3 May 21 13:50 null
lrwxrwxrwx 1 root root    8 May 21 13:50 ptmx -> pts/ptmx
drwxr-xr-x 2 root root    0 May 21 13:50 pts
crw-rw-rw- 1 root root 1, 8 May 21 13:50 random
drwxrwxrwt 2 root root   40 May 21 13:50 shm
lrwxrwxrwx 1 root root   15 May 21 13:50 stderr -> /proc/self/fd/2
lrwxrwxrwx 1 root root   15 May 21 13:50 stdin -> /proc/self/fd/0
lrwxrwxrwx 1 root root   15 May 21 13:50 stdout -> /proc/self/fd/1
crw-rw-rw- 1 root root 5, 0 May 21 13:50 tty
crw-rw-rw- 1 root root 1, 9 May 21 13:50 urandom
crw-rw-rw- 1 root root 1, 5 May 21 13:50 zero
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-05-21-entry-point-and-cmd-in-dockerfile>

#### REFERENCE

- <https://bluese05.tistory.com/77>
- <https://www.daleseo.com/dockerfile/>
