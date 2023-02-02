---
title: "Optimize Docker Build of Maven Project"
search: false
category:
    - docker
    - maven
last_modified_at: 2022-06-27T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.

* [Dockerfile 빌드와 Docker Image Layer][docker-file-build-and-image-layer-link]

## 0. 들어가면서

스프링 어플리케이션을 위한 `Dockerfile`을 만들었는데, 코드 변경 후 이미지를 만들 때마다 매번 너무 오랜 시간이 걸렸습니다. 
도커 이미지 레이어를 고려하지 않고 명령어(instruction)를 작성했기 때문인데, 메이븐 프로젝트를 위한 `Dockerfile`은 어떻게 작성되어야 빌드 속도를 줄일 수 있는지 정리하였습니다.

## 1. 기존 Dockerfile

최적화를 진행하기 전 사용한 `Dockerfile`은 다음과 같습니다.

* 멀티 스테이지 빌드(multi stage build)를 수행합니다.
* maven 빌드를 수행합니다.
    * 기본 이미지는 `maven:3.8.6-jdk-11` 입니다.
    * pom.xml 파일과 소스 코드를 복사합니다.
    * `mvn package` 명령어를 통해 `jar` 파일을 생성합니다.
* 패키징 한 `jar` 파일을 실행합니다.
    * 기본 이미지는 `openjdk:11-jdk-slim-buster` 입니다.
    * 이전 단계에서 빌드한 `jar` 파일을 이미지 내부로 복사합니다.
    * CMD 명령어를 통해 패키징 한 `jar` 파일을 실행합니다.

```dockerfile
FROM maven:3.8.6-jdk-11 as MAVEN_BUILD

WORKDIR /build

COPY pom.xml .

COPY src ./src

RUN mvn package -Dmaven.test.skip=true

FROM openjdk:11-jdk-slim-buster

WORKDIR /app

ARG JAR_FILE=*.jar

COPY --from=MAVEN_BUILD /build/target/${JAR_FILE} ./app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
```

### 1.1. 처음 이미지 빌드

* 로컬 호스트에서 수행한 결과입니다.
* `mvn package` 명령어를 수행하는 시점에 164초가 수행됩니다.
    * 이미지를 만들 때 필요한 의존성들을 다운로드 받는데 많은 시간이 소요됩니다.

```
$ docker build .
[+] Building 167.4s (16/16) FINISHED
 => [internal] load build definition from Dockerfile                                                                                            0.0s
 => => transferring dockerfile: 344B                                                                                                            0.0s
 => [internal] load .dockerignore                                                                                                               0.0s
 => => transferring context: 2B                                                                                                                 0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                   2.4s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                           2.4s
 => [auth] library/maven:pull token for registry-1.docker.io                                                                                    0.0s
 => [auth] library/openjdk:pull token for registry-1.docker.io                                                                                  0.0s
 => [maven_build 1/5] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:35d9b4c76cece0781cec2a0cd92a11694d7af01adb758779266d8cf1173a34e0         0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:72816c4c23395f37a31b3637cabb62a290cb9063e7fbcec492ceec56efd5548d     0.0s
 => [internal] load build context                                                                                                               0.0s
 => => transferring context: 5.18kB                                                                                                             0.0s
 => CACHED [maven_build 2/5] WORKDIR /build                                                                                                     0.0s
 => [maven_build 3/5] COPY pom.xml .                                                                                                            0.0s
 => [maven_build 4/5] COPY src ./src                                                                                                            0.0s
 => [maven_build 5/5] RUN mvn package -Dmaven.test.skip=true                                                                                  164.3s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                           0.0s
 => [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                         0.1s
 => exporting to image                                                                                                                          0.1s
 => => exporting layers                                                                                                                         0.1s
 => => writing image sha256:d1f0559cdad7fb273f3c2eaf5dc7059c1efefaaa3aeefe3a87f529354259d925
```

### 1.2. 코드 변경 후 이미지 빌드

* 프로젝트의 소스 코드를 간단하게 수정 후 재빌드하였습니다.
* `CACHED [maven_build 3/5] COPY pom.xml .`
    * 해당 명령어까진 이전에 빌드된 이미지 레이어를 사용하였습니다.
* 소스 코드가 변경되었으므로 `src` 폴더를 복사하는 명령어부터 재빌드를 수행합니다.
* `mvn package` 명령어를 수행하는 시점에 275초가 수행됩니다.
    * 위와 마찬가지로 이미지를 만들 때 필요한 의존성들을 다운로드 받는데 많은 시간이 소요됩니다.

```
$ docker build .
[+] Building 277.4s (14/14) FINISHED
 => [internal] load build definition from Dockerfile                                                                                            0.0s
 => => transferring dockerfile: 37B                                                                                                             0.0s
 => [internal] load .dockerignore                                                                                                               0.0s
 => => transferring context: 2B                                                                                                                 0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                   1.2s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                           1.3s
 => [maven_build 1/5] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:35d9b4c76cece0781cec2a0cd92a11694d7af01adb758779266d8cf1173a34e0         0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:72816c4c23395f37a31b3637cabb62a290cb9063e7fbcec492ceec56efd5548d     0.0s
 => [internal] load build context                                                                                                               0.0s
 => => transferring context: 1.29kB                                                                                                             0.0s
 => CACHED [maven_build 2/5] WORKDIR /build                                                                                                     0.0s
 => CACHED [maven_build 3/5] COPY pom.xml .                                                                                                     0.0s
 => [maven_build 4/5] COPY src ./src                                                                                                            0.0s
 => [maven_build 5/5] RUN mvn package -Dmaven.test.skip=true                                                                                  275.5s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                           0.0s
 => [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                         0.1s
 => exporting to image                                                                                                                          0.1s
 => => exporting layers                                                                                                                         0.1s
 => => writing image sha256:f56b124c8bb31ca5c3248203fba15f01aba314c33665f9ca77887b6fce579743
```

## 2. Dockerfile 개선

간단한 코드 변경임에도 이미지 빌드가 매번 3~5분이 소요되는 것은 상당히 불합리합니다. 
이를 간단하게 개선할 수 있는 방법을 찾았는데, 이를 소개하기 전에 우선 메이븐의 오프라인 모드를 살펴보겠습니다. 

### 2.1. maven 오프라인 모드 준비

메이븐은 인터넷이 연결되 있지 않은 폐쇄망에서 개발할 때 오프라인으로 빌드할 수 있도록 오프라인 모드를 지원합니다.

##### maven 오프라인 모드

* `-o` 옵션 - 인터넷에 연결하지 않고 로컬 레포지토리에서만 필요한 의존성을 찾습니다.
* `--offline` 옵션도 동일하게 동작합니다.

```
$ mvn -o package
```

##### maven 오프라인 모드 준비

* 메이븐 오프라인 모드를 사용하려면 로컬 레포지토리에 필요한 의존성들을 모두 미리 다운로드 받아야 합니다. 
* 다음과 같은 명령어를 통해 필요한 의존성들을 미리 다운받을 수 있습니다.

```
$ mvn dependency:go-offline
```

### 2.2. Dockerfile 변경

다음과 같이 도커 파일을 변경합니다.

* `RUN mvn dependency:go-offline` 명령어를 추가합니다.
    * pom.xml 파일 변경 시에만 의존성들을 다시 다운로드받습니다. 
    * 의존성 변경이 없다면 의존성들은 이전에 빌드된 이미지 레이어를 사용합니다.
* 소스 코드 변경이 있더라도 의존성들은 다운로드되지 않습니다.
* `mvn package` 명령어 수행 시 오프라인 모드 준비 시점에 다운받은 의존성들을 사용합니다.
    * 추가적인 의존성 다운로드가 발생할 수 있지만, 많지 않으므로 속도에는 크게 문제가 없습니다.

```dockerfile
FROM maven:3.8.6-jdk-11 as MAVEN_BUILD

WORKDIR /build

COPY pom.xml .

RUN mvn dependency:go-offline

COPY src ./src

RUN mvn package -Dmaven.test.skip=true

FROM openjdk:11-jdk-slim-buster

WORKDIR /app

ARG JAR_FILE=*.jar

COPY --from=MAVEN_BUILD /build/target/${JAR_FILE} ./app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
```

### 2.3. 이미지 빌드

* 로컬 호스트에서 수행한 결과입니다.
* `mvn package` 명령어를 수행하는 시점에 259초가 수행됩니다.
    * 처음 이미지를 만들 때 필요한 의존성들을 다운로드 받는데 많은 시간이 소요됩니다.

```
$ docker build .
[+] Building 270.9s (15/15) FINISHED 
 => [internal] load build definition from Dockerfile                                                                                            0.0s
 => => transferring dockerfile: 376B                                                                                                            0.0s
 => [internal] load .dockerignore                                                                                                               0.0s
 => => transferring context: 2B                                                                                                                 0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                   1.0s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                           1.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:72816c4c23395f37a31b3637cabb62a290cb9063e7fbcec492ceec56efd5548d     0.0s
 => [internal] load build context                                                                                                               0.0s
 => => transferring context: 3.00kB                                                                                                             0.0s
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:35d9b4c76cece0781cec2a0cd92a11694d7af01adb758779266d8cf1173a34e0         0.0s
 => CACHED [maven_build 2/6] WORKDIR /build                                                                                                     0.0s
 => [maven_build 3/6] COPY pom.xml .                                                                                                            0.0s
 => [maven_build 4/6] RUN mvn dependency:go-offline                                                                                           259.9s
 => [maven_build 5/6] COPY src ./src                                                                                                            0.0s
 => [maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                                    9.3s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                           0.0s
 => [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                         0.1s
 => exporting to image                                                                                                                          0.1s
 => => exporting layers                                                                                                                         0.1s
 => => writing image sha256:f347bf8f32da66b3e3ff18b64cedd78400d64ebebc4c41346854e5e4dd9a55af                                                    0.0s
```

### 2.4. 코드 변경 후 이미지 빌드

* 프로젝트의 소스 코드를 간단하게 수정 후 재빌드하였습니다.
* `CACHED [maven_build 4/6] RUN mvn dependency:go-offline`
    * 해당 명령어까진 이전에 빌드된 이미지 레이어를 사용하였습니다.
* 소스 코드가 변경되었으므로 `src` 폴더를 복사하는 명령어부터 재빌드를 수행합니다.
* `mvn package` 명령어를 수행하는 시점에 7.5초가 수행됩니다.
* 단순한 소스 코드 변경만 발생하는 경우 이미지 빌드 시간이 크게 감소하였습니다.

```
$ docker build .
[+] Building 10.3s (17/17) FINISHED
 => [internal] load build definition from Dockerfile                                                                                            0.0s
 => => transferring dockerfile: 37B                                                                                                             0.0s
 => [internal] load .dockerignore                                                                                                               0.0s
 => => transferring context: 2B                                                                                                                 0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                   2.1s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                           2.1s
 => [auth] library/openjdk:pull token for registry-1.docker.io                                                                                  0.0s
 => [auth] library/maven:pull token for registry-1.docker.io                                                                                    0.0s
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:35d9b4c76cece0781cec2a0cd92a11694d7af01adb758779266d8cf1173a34e0         0.0s
 => [internal] load build context                                                                                                               0.0s
 => => transferring context: 1.29kB                                                                                                             0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:72816c4c23395f37a31b3637cabb62a290cb9063e7fbcec492ceec56efd5548d     0.0s
 => CACHED [maven_build 2/6] WORKDIR /build                                                                                                     0.0s
 => CACHED [maven_build 3/6] COPY pom.xml .                                                                                                     0.0s
 => CACHED [maven_build 4/6] RUN mvn dependency:go-offline                                                                                      0.0s
 => [maven_build 5/6] COPY src ./src                                                                                                            0.0s
 => [maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                                    7.5s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                           0.0s
 => [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                         0.1s
 => exporting to image                                                                                                                          0.1s
 => => exporting layers                                                                                                                         0.1s
 => => writing image sha256:2a798f6ca2bb8fe2b25994edc6c252d5f698b6c489fbfa4f466a51df02ff46a5                                                    0.0s
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-06-27-optimize-maven-project-when-dockerizing>

#### REFERENCE

* <https://maven.apache.org/plugins-archives/maven-dependency-plugin-3.1.1/go-offline-mojo.html>
* <https://whitfin.io/speeding-up-maven-docker-builds/>
* <https://hbase.tistory.com/225>

[docker-file-build-and-image-layer-link]: https://junhyunny.github.io/information/docker/docker-file-build-and-image-layer/