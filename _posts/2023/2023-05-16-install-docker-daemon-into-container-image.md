---
title: "Install Docker Daemon into Container Image"
search: false
category:
  - docker
last_modified_at: 2023-05-16T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Build with Dockerfile and Image Layer][docker-file-build-and-image-layer-link]
* [Install Nonexistent Commands into Container Image][build-docker-image-with-nonexistent-commands-link]
* [테스트 컨테이너와 스프링 애플리케이션 MySQL 결합 테스트][test-container-for-database-link]

## 1. Problem

테스트 컨테이너(test container)를 사용한 결합 테스트 환경을 구축 후 CI/CD 파이프라인에서 문제가 발생했습니다. 
다음과 같은 환경을 가진 파이프라인이었습니다. 

* 젠킨스(jenkins)
* 쿠버네티스(kubernetes)의 파드(pod)를 에이전트(agent)로 사용

쿠버네티스 파드에서 사용한 메이븐(maven) 이미지 내부엔 도커(docker)가 없기 때문에 테스트 컨테이너가 실행될 수 없었습니다. 
테스트 컨테이너가 적용된 어플리케이션을 메이븐 이미지 위에서 테스트하면 다음과 같은 에러를 만납니다.

* 이미지 내부에 도커가 없어서 실행할 수 없다는 에러 메시지
    * UnixSocketClientProviderStrategy: failed with exception InvalidConfigurationException (Could not find unix domain socket)
    * Root cause NoSuchFileException (/var/run/docker.sock)As no valid configuration was found, execution cannot continue.

```
...
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running action.in.blog.ApplicationTest
23:54:36.847 [main] INFO  org.springframework.test.context.support.AnnotationConfigContextLoaderUtils - Could not detect default configuration classes for test class [action.in.blog.ApplicationTest]: ApplicationTest does not declare any static, non-private, non-final, nested classes annotated with @Configuration.
23:54:36.945 [main] INFO  org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Found @SpringBootConfiguration action.in.blog.ActionInBlogApplication for test class action.in.blog.ApplicationTest
23:54:37.004 [main] WARN  org.testcontainers.utility.TestcontainersConfiguration - Attempted to read Testcontainers configuration file at file:/root/.testcontainers.properties but the file was not found. Exception message: FileNotFoundException: /root/.testcontainers.properties (No such file or directory)
23:54:37.008 [main] INFO  org.testcontainers.utility.ImageNameSubstitutor - Image name substitution will be performed by: DefaultImageNameSubstitutor (composite of 'ConfigurationFileImageNameSubstitutor' and 'PrefixingImageNameSubstitutor')
23:54:37.181 [main] INFO  org.testcontainers.dockerclient.DockerMachineClientProviderStrategy - docker-machine executable was not found on PATH ([/usr/java/openjdk-17/bin, /usr/local/sbin, /usr/local/bin, /usr/sbin, /usr/bin, /sbin, /bin])
23:54:37.183 [main] ERROR org.testcontainers.dockerclient.DockerClientProviderStrategy - Could not find a valid Docker environment. Please check configuration. Attempted configurations were:
        UnixSocketClientProviderStrategy: failed with exception InvalidConfigurationException (Could not find unix domain socket). Root cause NoSuchFileException (/var/run/docker.sock)As no valid configuration was found, execution cannot continue.
See https://www.testcontainers.org/on_failure.html for more details.
[ERROR] Tests run: 1, Failures: 0, Errors: 1, Skipped: 0, Time elapsed: 0.576 s <<< FAILURE! - in action.in.blog.ApplicationTest
[ERROR] action.in.blog.ApplicationTest  Time elapsed: 0.576 s  <<< ERROR!
java.lang.IllegalStateException: Could not find a valid Docker environment. Please see logs and check configuration

[INFO] 
[INFO] Results:
[INFO] 
[ERROR] Errors: 
[ERROR]   ApplicationTest » IllegalState Could not find a valid Docker environment. Plea...
[INFO] 
[ERROR] Tests run: 1, Failures: 0, Errors: 1, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD FAILURE
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  18.037 s
[INFO] Finished at: 2023-05-15T23:54:37Z
[INFO] ------------------------------------------------------------------------
```

## 2. Solve the problem

[Install Nonexistent Commands into Container Image][build-docker-image-with-nonexistent-commands-link] 포스트처럼 도커가 설치된 커스텀 이미지를 만들면 이를 해결할 수 있습니다. 
단순히 이미지 레이어를 추가하는 정도로 해결되지 않았기 때문에 일부는 중복된 내용이지만, 별도 포스트로 정리하였습니다. 

### 2.1. Install systemd

> systemd - An alternative boot manager

`systemd`는 리눅스의 시스템과 세션 관리자입니다. 
도커 데몬 실행을 위해 이미지 레이어에 추가되어야 합니다. 
`systemd`는 다음과 같은 역할을 수행합니다.

* 실행되는 서비스를 위한 소켓(socket)이나 D-버스(D-Bus)를 활성화
* 데몬(daemon) 실행
* 리눅스 `cgroup`을 사용한 프로세스 추적
* 시스템 상태 저장과 스냅샷(snapshot) 지원
* 마운트(mount) 및 자동 마운트 지점을 유지하고 정교한 트랜잭션 종속성 기반 서비스 제어 로직을 구현

### 2.2. Install init

`systemd`를 설치한 이미지에서 도커 데몬을 실행하면 다음과 같은 에러 메시지를 마주칩니다.

```
2023-05-16 10:23:56 System has not been booted with systemd as init system (PID 1). Can't operate.
2023-05-16 10:23:56 Failed to connect to bus: Host is down
```

`systemd`는 `init` 프로세스가 될 수 없기 때문에 발생하는 에러입니다. 
`init` 프로세스는 사용자들을 위해 시스템 설정을 수행하는 부팅(booting) 프로세스의 일부입니다. 
모든 프로세스의 부모 역할을 수행하기 때문에 `systemd`로 도커 데몬을 실행하기 위해선 `init` 설치가 필요합니다. 
`init` 프로세스는 다음과 같은 역할을 수행합니다.

* 파일 시스템의 구조 검사
* 파일 시스템의 마운트
* 서버 데몬 실행
* 사용자 로그인 처리 및 CLI(command line interface) 연결

### 2.3. Install docker.io and Build Image

마지막으로 도커 데몬을 설치하는 이미지 레이어를 추가하고 이미지를 빌드합니다. 
최종적으로 다음과 같은 도커 파일이 작성됩니다.

##### Dockerfile

* 테스트 실행을 위한 이미지 레이어도 추가합니다.
* 컨테이너를 실행할 때 `init` 프로세스를 실행할 수 있도록 엔트리 포인트(entry point)로 지정합니다.
    * 이미지를 빌드하는 과정에서 `init` 프로세스를 실행할 수 없습니다.
    * 컨테이너를 실행하는 시점에 `init` 프로세스를 실행합니다.

```dockerfile
FROM maven:3-eclipse-temurin-17

USER root

RUN apt-get update

RUN apt-get install -y init systemd docker.io

WORKDIR /build

COPY pom.xml .

RUN mvn dependency:go-offline

COPY src ./src

ENTRYPOINT ["/sbin/init"]
```

##### Build Image

* 위에서 작성한 도커 파일을 기준으로 이미지를 생성합니다.

```
$ docker build -t maven:3-eclipse-temurin-17-docker .

[+] Building 2.9s (13/13) FINISHED
 => [internal] load .dockerignore                                                                                                    0.0s
 => => transferring context: 2B                                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                                 0.0s
 => => transferring dockerfile: 254B                                                                                                 0.0s
 => [internal] load metadata for docker.io/library/maven:3-eclipse-temurin-17                                                        2.8s
 => [auth] library/maven:pull token for registry-1.docker.io                                                                         0.0s
 => [1/7] FROM docker.io/library/maven:3-eclipse-temurin-17@sha256:471d9f0b11063569cc12ca07d6b44fa9a0bc17cde17535614275f82d4b0d92b6  0.0s
 => [internal] load build context                                                                                                    0.0s
 => => transferring context: 1.18kB                                                                                                  0.0s
 => CACHED [2/7] RUN apt-get update                                                                                                  0.0s
 => CACHED [3/7] RUN apt-get install -y init systemd docker.io                                                                       0.0s
 => CACHED [4/7] WORKDIR /build                                                                                                      0.0s
 => CACHED [5/7] COPY pom.xml .                                                                                                      0.0s
 => CACHED [6/7] RUN mvn dependency:go-offline                                                                                       0.0s
 => CACHED [7/7] COPY src ./src                                                                                                      0.0s
 => exporting to image                                                                                                               0.0s
 => => exporting layers                                                                                                              0.0s
 => => writing image sha256:0de9322c504186f1674fa65e773169a1ea3278c11890767f994d55c0bbfb4f40                                         0.0s
 => => naming to docker.io/library/maven:3-eclipse-temurin-17-docker
 ```

## 3. Run Container

생성한 이미지로 컨테이너를 실행하고 컨테이너 내부에서 테스트를 실행합니다.

```
$ docker run --privileged -d maven:3-eclipse-temurin-17-docker           
65ce2d5dbe9ae4a5a5463237af0e941ac571ad128668f94b13e0ff5ce3fca328

$ docker exec -it 736aacd50a7228272a94af6a3764a233ac887ecccd95004357bdac32ffca0adb bash

root@736aacd50a72:/build# mvn test
```

<p align="center">
    <img src="/images/install-docker-daemon-into-container-image-1.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-05-16-install-docker-daemon-into-container-image>

#### REFERENCE

* <https://wiki.ubuntu.com/systemd>
* <https://wiki.kldp.org/KoreanDoc/html/Boot_Process-KLDP/initprocess.html>
* <http://home.zany.kr:9003/board/bView.asp?bCode=11&aCode=14198>

[docker-file-build-and-image-layer-link]: https://junhyunny.github.io/information/docker/docker-file-build-and-image-layer/
[build-docker-image-with-nonexistent-commands-link]: https://junhyunny.github.io/docker/build-docker-image-with-nonexistent-commands/
[test-container-for-database-link]: https://junhyunny.github.io/post-format/test-container-for-database/
