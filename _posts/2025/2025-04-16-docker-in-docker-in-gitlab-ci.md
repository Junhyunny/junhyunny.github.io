---
title: "GitLab CI DinD(Docker in Docke) 설정과 테스트 컨테이너 실행"
search: false
category:
  - gitlab-ci
  - docker-in-docker
last_modified_at: 2025-04-16T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [테스트 컨테이너와 스프링 애플리케이션 AWS S3 결합 테스트][test-container-aws-s3-integration-test-link]

## 0. 들어가면서

[이전 글][test-container-aws-s3-integration-test-link]에서 이야기한 것처럼 문제가 있던 S3 테스트를 테스트 컨테이너를 사용한 결합 테스트로 변경했다. 이 후에 코드를 올렸는데 CI/CD 파이프라인에서 문제가 발생헀다. 파이프라인으로 `GitLab CI`를 사용 중이었는데, 파이프라인에서 컨테이너 환경을 기본적으로 지원하지 않기 때문에 문제가 발생한 것이었다. 이에 관련된 내용을 이번 글로 정리했다.  

## 1. Problem context

테스트 컨테이너를 적용한 테스트 코드를 작성한 뒤 코드를 푸쉬(push)하니 파이프라인에서 다음과 같은 에러가 발생했다.

- Could not find a valid Docker environment. Please see logs and check configuration

```
...
> Task :test FAILED
ActionInBlogApplicationTests STANDARD_OUT
    09:09:06.002 [Test worker] INFO org.springframework.test.context.support.AnnotationConfigContextLoaderUtils -- Could not detect default configuration classes for test class [action.in.blog.ActionInBlogApplicationTests]: ActionInBlogApplicationTests does not declare any static, non-private, non-final, nested classes annotated with @Configuration.
    09:09:06.246 [Test worker] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper -- Found @SpringBootConfiguration action.in.blog.ActionInBlogApplication for test class action.in.blog.ActionInBlogApplicationTests
    09:09:06.398 [Test worker] INFO org.testcontainers.images.PullPolicy -- Image pull policy will be performed by: DefaultPullPolicy()
    09:09:06.402 [Test worker] INFO org.testcontainers.utility.ImageNameSubstitutor -- Image name substitution will be performed by: DefaultImageNameSubstitutor (composite of 'ConfigurationFileImageNameSubstitutor' and 'PrefixingImageNameSubstitutor')
    09:09:06.413 [Test worker] INFO org.testcontainers.DockerClientFactory -- Testcontainers version: 1.20.6
    09:09:06.591 [Test worker] INFO org.testcontainers.dockerclient.DockerMachineClientProviderStrategy -- docker-machine executable was not found on PATH ([/usr/local/openjdk-17/bin, /usr/local/sbin, /usr/local/bin, /usr/sbin, /usr/bin, /sbin, /bin])
    09:09:06.592 [Test worker] ERROR org.testcontainers.dockerclient.DockerClientProviderStrategy -- Could not find a valid Docker environment. Please check configuration. Attempted configurations were:
        UnixSocketClientProviderStrategy: failed with exception InvalidConfigurationException (Could not find unix domain socket). Root cause NoSuchFileException (/var/run/docker.sock)
        DockerDesktopClientProviderStrategy: failed with exception NullPointerException (Cannot invoke "java.nio.file.Path.toString()" because the return value of "org.testcontainers.dockerclient.DockerDesktopClientProviderStrategy.getSocketPath()" is null)As no valid configuration was found, execution cannot continue.
    See https://java.testcontainers.org/on_failure.html for more details.
ActionInBlogApplicationTests > initializationError FAILED
    java.lang.IllegalStateException: Could not find a valid Docker environment. Please see logs and check configuration
        at org.testcontainers.dockerclient.DockerClientProviderStrategy.lambda$getFirstValidStrategy$7(DockerClientProviderStrategy.java:274)
        at java.base/java.util.Optional.orElseThrow(Optional.java:403)
        at org.testcontainers.dockerclient.DockerClientProviderStrategy.getFirstValidStrategy(DockerClientProviderStrategy.java:265)
        at org.testcontainers.DockerClientFactory.getOrInitializeStrategy(DockerClientFactory.java:154)
        at org.testcontainers.DockerClientFactory.client(DockerClientFactory.java:196)
        at org.testcontainers.DockerClientFactory$1.getDockerClient(DockerClientFactory.java:108)
        at com.github.dockerjava.api.DockerClientDelegate.authConfig(DockerClientDelegate.java:109)
        at org.testcontainers.containers.GenericContainer.start(GenericContainer.java:321)
        at action.in.blog.ActionInBlogApplicationTests.beforeAll(ActionInBlogApplicationTests.java:45)
Finished generating test XML results (0.012 secs) into: /builds/opop3966/2025-04-10-docker-in-docker-in-gitlab-ci/build/test-results/test
Generating HTML test report...
Finished generating test html results (0.019 secs) into: /builds/opop3966/2025-04-10-docker-in-docker-in-gitlab-ci/build/reports/tests/test
4 actionable tasks: 4 executed
...
```

유효한 테스트 환경을 찾을 수 없다는 에러였다. 문제가 발생한 `.gitlab-ci.yml` 스크립트를 살펴보자. 불필요한 스크립트는 제외하고 테스트에 관련된 잡(job)만 살펴보면 다음과 같이 작성되어 있다.

- `openjdk:17-ea-33-jdk-buster` 이미지를 사용한 컨테이너 위에서 파이프라인 잡이 동작한다. 

```yml
stages:
  - test

test-backend-app:
  image: openjdk:17-ea-33-jdk-buster
  stage: test
  script:
    - |
      ./gradlew test -i
```

## 2. Solve the problem

깃랩(Gitlab) 러너(runner)는 CI/CD 잡을 실행하는데 러너가 어떤 방식(환경)으로 잡을 실행할 것인지 결정한다. 이를 실행자(executor)라고 한다. 깃랩은 여러 종류의 실행자를 제공한다.

- SSH
- Shell
- Parallels
- VirtualBox
- Docker
- Docker Autoscaler
- Docker Machine (auto-scaling)
- Kubernetes
- Instance
- Custom

디폴트는 쉘(shell) 실행자이며, 위에서 문제가 된 방식은 도커 실행자 환경에서 동작한다. 도커 실행자는 CI/CD 잡을 도커 이미지 위에서 실행하는 방식이다. 문제는 여기서 발생한다. 위에서 문제가 된 CI 잡은 도커 이미지 환경에서 동작하다보니 컨테이너 내부에 도커가 준비되어 있지 않다면 테스트 컨테이너가 실행되지 않는다. 

<div align="center">
  <img src="/images/posts/2025/docker-in-docker-in-gitlab-ci-01.png" width="80%" class="image__border">
</div>

<br/>

이런 경우에는 도커-인-도커(DinD, docker in docker) 설정이나 도커-아웃-오브-도커(DooD, docker out of docker) 같은 환경이 필요하다. 도커-인-도커는 도커가 설치된 도커 컨테이너를 사용하는 방식이고, 도커-아웃-오브-도커는 볼륨을 통해 컨테이너의 파일 시스템을 호스트 머신의 파일 시스템으로 마운트(mount)하여 호스트의 `docker.sock`을 공유는 방식이다. 

<div align="center">
  <img src="/images/posts/2025/docker-in-docker-in-gitlab-ci-02.png" width="100%" class="image__border">
</div>

<br/>

도커-인-도커 방식은 컨테이너가 호스트 머신의 커널에 접근할 수 있는 권한을 부여하는 `privileged` 모드가 필요하기 때문에 보안적으로 문제가 된다. 깃랩은 이를 해결하기 위해 CI 잡을 실행하는 컨테이너 외부에 데몬(daemon) 서비스를 제공한다. 도커-인-도커를 지원하는 공식 도커 이미지를 제공하고, 이를 외부에 데몬 서비스로써 실행시킨 후 CI 잡을 실행하는 컨테이너와 연결하는 방식이다. 

- 도커-인-도커가 가능한 데몬 컨테이너를 띄우고 도커-아웃-오브-도커 방식처럼 잡을 실행하는 컨테이너가 외부 서비스 컨테이너의 도커 데몬을 사용한다. 

<div align="center">
  <img src="/images/posts/2025/docker-in-docker-in-gitlab-ci-03.png" width="80%" class="image__border">
</div>

<br/>

위 설명이 이해됐다면 이제 실제 스크립트를 살펴보자. 아래 스크립트처럼 변경 후 파이프라인을 실행하면 정상적으로 테스트가 통과한다.

- [services](https://docs.gitlab.com/ci/services/) 키워드는 CI/CD 파이프라인이 동작할 때 필요한 컨테이너를 실행할 수 있도록 지원하는 기능이다. 여러 개의 컨테이너를 동시에 실행할 수 있다.

```yml
services:
  - name: docker:dind # dind 서비스를 제공하는 도커 이미지
    command: [ "--tls=false" ] # 연결 문제로 인한 TLS 옵션 비활성화

variables:
  DOCKER_HOST: "tcp://docker:2375" # 도커 데몬 서비스 연결 정보

stages:
  - test

test-backend-app:
  image: openjdk:17-ea-33-jdk-buster
  stage: test
  script:
    - |
      ./gradlew test -i
```

#### TEST CODE REPOSITORY

- <https://gitlab.com/opop3966/2025-04-10-docker-in-docker-in-gitlab-ci>

#### REFERENCE

- <https://www.docker.com/blog/running-testcontainers-tests-on-gitlab-ci/>
- <https://stackoverflow.com/questions/78908814/gitlab-ci-fails-with-failed-to-connect-to-localhost>
- <https://docs.gitlab.com/runner/executors/>
- <https://docs.gitlab.com/ci/docker/using_docker_build/>
- <https://docs.gitlab.com/ci/yaml/#imagedocker>
- <https://docs.gitlab.com/runner/security/#docker-in-docker-with-privileged-mode>
- <https://docs.gitlab.com/ci/services/>
- <https://docs.gitlab.com/ci/docker/using_docker_build/#enable-docker-commands-in-your-cicd-jobs>

[test-container-aws-s3-integration-test-link]: https://junhyunny.github.io/spring-boot/test-container/aws/test-container-aws-s3-integration-test/
