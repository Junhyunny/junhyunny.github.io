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

페어의 랜처 데스크탑은 QEMU 에뮬레이터를 사용 중이었기 때문에 공식 문서의 설명을 따라 다음 명령어를 사용했지만, 실패했다.

```
$ export TESTCONTAINERS_HOST_OVERRIDE=$(rdctl shell ip a show rd0 | awk '/inet / {sub("/.*",""); print $2}')
```

필자의 경우 심볼릭 링크(symbolic link)가 제대로 잡혀있지 않았기 때문에 문제가 발생했다. 랜처 데스크탑의 경우 다음 명령어를 통해 심볼릭 링크를 제대로 잡아줄 수 있다.

```
$ sudo ln -s $HOME/.rd/docker.sock /var/run/docker.sock
```

#### REFERENCE

- <https://java.testcontainers.org/supported_docker_environment/>
- <https://velog.io/@rmswjdtn/Solve-Could-not-find-a-valid-Docker-environment-error-using-colima>
- <https://stackoverflow.com/questions/61108655/test-container-test-cases-are-failing-due-to-could-not-find-a-valid-docker-envi>

[how-to-setup-testcontainer-in-kotlin-spring-boot-link]: https://junhyunny.github.io/kotlin/spring-boot/test-container/how-to-setup-testcontainer-in-kotlin-spring-boot/