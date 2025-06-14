---
title: "Could not find a valid Docker environment when use TestContainer in MacOS"
search: false
category:
  - spring-boot
  - testcontainer
last_modified_at: 2024-08-08T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [How to setup TestContainer in Kotlin Spring Boot][how-to-setup-testcontainer-in-kotlin-spring-boot-link]

## 1. Problem Context

`TestContainer`를 사용해 결합 테스트를 작성할 때 다음과 같은 에러가 발생했다. 

```
Can't get Docker image: RemoteDockerImage(imageName=postgres:16, imagePullPolicy=DefaultPullPolicy(), imageNameSubstitutor=org.testcontainers.utility.ImageNameSubstitutor$LogWrappedImageNameSubstitutor@48ea2003)
org.testcontainers.containers.ContainerFetchException: Can't get Docker image: RemoteDockerImage(imageName=postgres:16, imagePullPolicy=DefaultPullPolicy(), imageNameSubstitutor=org.testcontainers.utility.ImageNameSubstitutor$LogWrappedImageNameSubstitutor@48ea2003)
    at org.testcontainers.containers.GenericContainer.getDockerImageName(GenericContainer.java:1364)
    at org.springframework.boot.testcontainers.service.connection.ServiceConnectionContextCustomizerFactory.createSource(ServiceConnectionContextCustomizerFactory.java:88)

...

Caused by: java.lang.IllegalStateException: Could not find a valid Docker environment. Please see logs and check configuration
    at org.testcontainers.dockerclient.DockerClientProviderStrategy.lambda$getFirstValidStrategy$7(DockerClientProviderStrategy.java:277)
    at java.base/java.util.Optional.orElseThrow(Optional.java:403)
    at org.testcontainers.dockerclient.DockerClientProviderStrategy.getFirstValidStrategy(DockerClientProviderStrategy.java:268)
    at org.testcontainers.DockerClientFactory.getOrInitializeStrategy(DockerClientFactory.java:152)
```

도커 데몬이 실행 중이 아니겠거니 생각했지만, 데몬은 정상적으로 실행되고 있었다. 도커 데몬이 실행되는 환경은 다음과 같다.

- MacBook Pro
- Apple M3 Pro
- macOS Sonoma Version 14.5
- Rancher Desktop

## 2. Solve the problem

이 문제는 `도커 데스크탑(Docker Desktop)`을 사용하지 않으면 발생할 수 있다. 고객사 개발자와 함께 페어링 중에 이 문제가 발생했는 데, 페어링 한 개발자는 라이센스 문제로 `랜처 데스크탑(Rancher Desktop)`을 사용했기 때문에 이 에러가 발생했다. 테스트 컨테이너 공식 문서를 보면 다음과 같은 설명을 볼 수 있다.

> During development, Testcontainers is actively tested against recent versions of Docker on Linux, as well as against Docker Desktop on Mac and Windows.<br/>
> ...<br/>
> It is possible to configure Testcontainers to work with alternative container runtimes. Making use of the free Testcontainers Desktop app will take care of most of the manual configuration. When using those alternatives without Testcontainers Desktop, sometimes some manual configuration might be necessary (see further down for specific runtimes, or Customizing Docker host detection for general configuration mechanisms). Alternative container runtimes are not actively tested in the main development workflow, so not all Testcontainers features might be available.

테스트 컨테이너는 윈도우즈와 맥OS의 도커 데스크탑에 대해 적극적으로 테스트하기 때문에 도커 데스크탑을 대체하기 위해 사용하는 다른 데스크탑 환경들은 메인 개발 워크플로우가 아니다. 그렇기 때문에 종종 추가적인 설정이 필요한 경우가 있는 것으로 보인다. 다음과 같은 데스크탑 환경을 지원한다.

- Colima
- Podman
- Rancher Desktop

랜처 데스크탑에서 이 문제를 해결하려면 `Preference > Application > General` 설정에 `Administrative Access` 속성이 활성화한다. 

<div align="center">
  <img src="/images/posts/2024/not-find-valid-docker-env-when-testcontainer-in-mac-01.png" width="45%" class="image__border image__padding">
  <img src="/images/posts/2024/not-find-valid-docker-env-when-testcontainer-in-mac-02.png" width="35%" class="image__border image__padding">
</div>

<br/>

위 설정이 완료되면 `/var/run/docker.sock` 파일의 심볼릭 링크가 제대로 설정되어 있지 않은 문제도 함께 해결해준다. 랜처 데스트탑 환경에서 심볼릭 링크는 `$HOME/.rd/docker.sock` 경로로 설정되어 한다.

```
$ ls -al /var/run/docker.sock
lrwxr-xr-x  1 root  daemon  34 Aug  9 15:11 /var/run/docker.sock -> /Users/junhyunkang/.rd/docker.sock
```

심볼링 링크가 제대로 설정되어 있지 않은 경우 다음 명령어를 통해 심볼링 링크를 다시 설정한다.

```
$ sudo ln -s $HOME/.rd/docker.sock /var/run/docker.sock
```

사용 중인 에뮬레이터에 따라 `TestContainer`의 호스트 환경 변수를 오버라이딩 해야 한다. 필자의 페어는 QEMU 에뮬레이터를 사용 중이었기 때문에 공식 문서의 설명을 따라 다음 명령어를 사용했다.

```
$ export TESTCONTAINERS_HOST_OVERRIDE=$(rdctl shell ip a show rd0 | awk '/inet / {sub("/.*",""); print $2}')
```

만약, 위 명령어를 다음과 같은 에러를 만날 수 있다. 이 에러를 만난다면 `Administrative Access` 설정이 제대로 활성화 되었는지 다시 확인하길 바란다.

```
ip: can't find device 'rd0'
Error: exit status 1
```

## CLOSING

위 해결 방법은 랜처 데스크탑을 사용할 때 인텔리제이 IDE 환경이나 그레이들(gradle) CLI로 테스트를 실행할 때 발생하는 문제는 해결한다. 하지만 컨테이너 이미지를 빌드하는 시점에 테스트 스테이지(stage)가 있다면 `TestContainer`를 실행할 때 다시 같은 문제가 발생한다. 도커 데스크탑과는 다르게 이미지를 빌드하는 시점에 호스트 머신의 `docker.sock` 파일을 사용하지 못하는 문제가 있는 것으로 보인다.

- `/var/run/docker.sock` 파일을 찾을 수 없어서 `NoSuchFileException` 예외가 발생한다.

```
30.32     2024-08-09T15:49:00.523+09:00 ERROR 159 --- [    Test worker] o.t.d.DockerClientProviderStrategy       : Could not find a valid Docker environment. Please check configuration. Attempted configurations were:
30.32           UnixSocketClientProviderStrategy: failed with exception InvalidConfigurationException (Could not find unix domain socket). Root cause NoSuchFileException (/var/run/docker.sock)
30.32           DockerDesktopClientProviderStrategy: failed with exception NullPointerException (Cannot invoke "java.nio.file.Path.toString()" because the return value of "org.testcontainers.dockerclient.DockerDesktopClientProviderStrategy.getSocketPath()" is null)As no valid configuration was found, execution cannot continue.

... 
```

#### REFERENCE

- <https://java.testcontainers.org/supported_docker_environment/>
- <https://velog.io/@rmswjdtn/Solve-Could-not-find-a-valid-Docker-environment-error-using-colima>
- <https://stackoverflow.com/questions/61108655/test-container-test-cases-are-failing-due-to-could-not-find-a-valid-docker-envi>
- <https://docs.rancherdesktop.io/how-to-guides/using-testcontainers/>

[how-to-setup-testcontainer-in-kotlin-spring-boot-link]: https://junhyunny.github.io/kotlin/spring-boot/test-container/how-to-setup-testcontainer-in-kotlin-spring-boot/