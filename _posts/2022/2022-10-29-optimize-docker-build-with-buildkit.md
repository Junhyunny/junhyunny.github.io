---
title: "Optimize Docker Build with Buildkit"
search: false
category:
  - information
  - docker
last_modified_at: 2022-10-29T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Optimize Docker Build of Maven Project][optimize-maven-project-when-dockerizing-link]

## 0. 들어가면서

[Optimize Docker Build of Maven Project][optimize-maven-project-when-dockerizing-link] 포스트에선 메이븐(maven) 프로젝트를 컨테이너 이미지로 빌드하는 과정을 최적화하는 방법에 대해 다뤘습니다. 
해당 포스트에서 설명한 방법은 소스 코드가 바뀌었을 때 캐싱된 레이어를 통해 빌드 속도를 최적화한다는 내용이었습니다. 
안정된 프로젝트인 경우 의존성(dependency) 변경이 거의 없지만, 프로젝트 초기엔 잦은 변경이 발생합니다. 
이러면 의존성들을 미리 받아 놓는 캐싱(caching) 레이어를 통해 얻을 수 있는 이점이 거의 없게 됩니다. 
`Docker Buildkit`을 사용하면 이런 문제를 완화할 수 있습니다. 
이번 포스트에선 `Buildkit`에 대한 내용과 메이븐 프로젝트 빌드를 최적화하는 방법에 대해 알아보겠습니다.

## 1. Docker Buildkit

18.09 릴리즈부터 지원하는 기능입니다. 
`Buildkit`은 `Dockerfile`의 재사용성을 개선하고 빌드 성능을 개선하는 도구입니다. 
다음과 같은 복잡한 시나리오에 도움을 줍니다.

* 사용하지 않는 빌드 스테이지(stage)를 감지하고 제외시킵니다.
* 독립적인 빌드 스테이지는 병렬적으로 수행합니다.
* 빌드 컨텍스트와 빌드 사이의 변경된 파일을 점진적으로 전달합니다.
* 빌드 컨텍스트에서 사용하지 않는 파일을 감지하고 전달에서 제외시킵니다.
* `REST API`를 사용할 때 부수 효과(side effect)를 피할 수 있습니다.
* 자동적인 프루닝(pruning)을 위해 빌드 캐시에 우선 순위를 정합니다.

다양한 기능들을 제공하지만, `Buildkit`은 빌드 성능, 스토리지 관리, 확장성 등을 향상시키는 것이 주 역할입니다. 

### 1.1. LLB(Low Level Build)

`LLB(Low Level Build)`의 기술적 세부 사항은 상당히 복잡하기 때문에 소개 페이지에 있는 내용들을 위주로 가볍게 살펴보겠습니다. 
`Buildkit`은 `LLB`라는 `binary intermediate format`을 기반으로 동작합니다. 
`LLB`는 컨텐츠 주소를 정의할 수 있는 의존성 그래프를 정의합니다. 
이는 매우 복잡한 빌드를 통합하는데 사용할 수 있습니다. 

빌드의 실행과 캐싱과 관련된 모든 것들이 `LLB`에 정의됩니다. 
캐싱 모델 전체가 다시 써지는 레거시 빌드와 다르게 `LLB`는 빌드 그래프와 구체적인 동작들이 정의된 컨텐츠의 체크섬(checksum)들을 직접 추적합니다. 
이런 동작 방법은 빌드를 빠르고, 간결하고, 이식성 좋게 만들어줍니다. 

<p align="center">
    <img src="/images/optimize-docker-build-with-buildkit-1.JPG" width="75%" class="image__border">
</p>
<center>https://docs.docker.com/build/buildkit/</center>

### 1.2. Frontend

프론트엔드(Frontend)는 사람이 읽을 수 있는 빌드 형식을 가지고 `LLB`로 변환하는 컴포넌트입니다. 
프론트엔드는 이미지로써 배포될 수 있으며 사용자는 특정 프론트엔드 버전을 지정하여 사용하는 것이 가능합니다. 

### 1.3. RUN --mount Types

`RUN --mount` 옵션을 통해 마운트(mount) 타입을 지정하면 이미지 빌드 프로세스가 접근할 수 있는 임시 마운트를 생성할 수 있습니다. 
4가지 종류의 마운트가 존재합니다.

* `bind` - 컨텍스트 디렉토리를 읽기 전용으로 `bind-mount`합니다.
* `cache` - 컴파일러나 패키지 매니저가 사용할 수 있는 임시 디렉토리를 마운트합니다.
* `secret` - 빌드 이미지에 함께 추가하지 않고 개인 키 같은 보안 파일에 액세스할 수 있습니다.
* `ssh` - 빌드 시 암호 구문을 지원하여 SSH 에이전트를 통해 SSH 키에 접근할 수 있습니다.

#### 1.3.1. --mount=type=cache 상세 옵션

이번 포스트에서 다루는 빌드 속도 개선 방법은 `cache` 타입을 통해 이뤄졌습니다. 
이와 관련된 옵션들만 알아보겠습니다. 

* id 옵션
    * 다른 캐시를 구분할 수 있는 아이디 값이며 기본 값은 `target`입니다.
* target 옵션 
    * 마운트할 경로(path)를 지정합니다.
* ro, readonly 옵션
    * 해당 옵션을 사용하면 읽기 전용으로 캐시로 지정합니다.
* sharing 옵션
    * `shared`, `private`, `locked` 3가지 중 한 가지 값을 가집니다.
    * 기본 값은 `shared`입니다.
    * `shared` 값 - 다른 사용자(writer)들에게 동시적으로 사용됩니다.
    * `private` 값 - 다른 사용자들이 존재하는 경우 새로운 마운트를 생성합니다.
    * `locked` 값 - 두 번째 사용자는 첫 번째 사용자가 마운트 사용을 마칠 때까지 대기합니다.
* from 옵션
    * 캐시 마운트를 기준으로 스테이지를 빌드합니다.
    * 기본 값은 빈 디렉토리입니다. 
* source 옵션
    * `from` 값의 하위 경로입니다.
    * 기본 값은 `from` 값의 루트 경로입니다.
* mode 옵션
    * 새로운 캐시 디렉토리의 파일 모드입니다.
    * 기본 값은 `0755`입니다.
* uid 옵션
    * 캐시 디렉토리를 위한 사용자 아이디입니다.
    * 기본 값은 0 입니다.
* gid 옵션
    * 캐시 디렉토리를 위한 그룹 아이디입니다.
    * 기본 값은 0 입니다.

## 2. Optimize Maven Project Build

[Optimize Docker Build of Maven Project][optimize-maven-project-when-dockerizing-link] 예시를 기준으로 의존성이 바뀌었을 때 빌드 속도 차이가 얼마나 나는지 확인해보겠습니다. 

### 2.1. Activate Buildkit 

`Buildkit` 지원을 활성화시킵니다. 
18.09 버전부터 지원하였고, 19.03 버전까진 기본 방식이 아니므로 활성화 여부를 확인 후 적용합니다. 
환경 변수를 통해 지정하는 방법과 `daemon.json` 파일 설정을 변경하는 방법이 있습니다. 
이번 포스트에선 `daemon.json` 설정을 변경하였습니다.

##### daemon.json 설정 변경

* 운영체제 별로 해당 파일 위치가 다릅니다.
    * MacOS - /Users/{userName}/.docker/daemon.json
    * Linux - /etc/docker/daemon.json

```json
{
  "features": {
    "buildkit" : true
  }
}
```

### 2.2. 시간 측정 - Buildkit 미적용

#### 2.2.1. Dockerfile Script

* 의존성을 변경하는 `pom.xml` 파일에 변경이 있을 때만 필요한 의존성을 받는 레이어를 재실행합니다.
    * RUN mvn dependency:go-offline

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

#### 2.2.2. 최초 빌드 시간

* 최초 이미지 빌드 시 필요한 의존성들을 준비하는 `RUN mvn dependency:go-offline` 레이어에서 607초 소요됩니다.
* 빌드 시간이 총 662.4초 소요됩니다.

```
$ docker build . 

[+] Building 662.4s (15/15) FINISHED
 => [internal] load build definition from Dockerfile                                                                                                        0.3s
 => => transferring dockerfile: 376B                                                                                                                        0.0s
 => [internal] load .dockerignore                                                                                                                           0.3s
 => => transferring context: 2B                                                                                                                             0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                               2.4s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                                       2.2s
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81f                        22.8s
 => => resolve docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215                                 0.2s
 => => sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215 549B / 549B                                                                  0.0s
 => => sha256:37a94a4fe3b52627748d66c095d013a17d67478bc0594236eca55c8aef33ddaa 2.42kB / 2.42kB                                                              0.0s
 => => sha256:6c3ab1faec76c92f0867f4b366000d77e8dab5f9d6339fb03c1e394e20f3cb59 8.91kB / 8.91kB                                                              0.0s
 => => sha256:001c52e26ad57e3b25b439ee0052f6692e5c0f2d5d982a00a8819ace5e521452 55.00MB / 55.00MB                                                           13.3s
 => => sha256:d9d4b9b6e964657da49910b495173d6c4f0d9bc47b3b44273cf82fd32723d165 5.16MB / 5.16MB                                                              2.4s
 => => sha256:2068746827ec1b043b571e4788693eab7e9b2a95301176512791f8c317a2816a 10.88MB / 10.88MB                                                            3.5s
 => => sha256:9daef329d35093868ef75ac8b7c6eb407fa53abbcb3a264c218c2ec7bca716e6 54.58MB / 54.58MB                                                            7.0s
 => => sha256:d85151f15b6683b98f21c3827ac545188b1849efb14a1049710ebc4692de3dd5 5.42MB / 5.42MB                                                              7.6s
 => => sha256:66223a710990a0ae7162aeed80417d30303afa3f24aafa57aa30348725e2230b 213B / 213B                                                                  7.9s
 => => sha256:db38d58ec8ab4111b072f6700f978a51985acd252aabce3be377f25162e68301 202.07MB / 202.07MB                                                         15.4s
 => => sha256:2896deaba78c60c05d4e37be721ade7bd8f30cddb280af30b5e4df930108f045 8.74MB / 8.74MB                                                              8.8s
 => => sha256:25fd53091b07a227ff046dc649e522bed93779b38e38fca2635bc642eac0d71f 856B / 856B                                                                  9.0s
 => => sha256:dd3ce32e87decb846afbbee5101dd4f88280e8a7a6f3f1a2b8026efe474fda90 360B / 360B                                                                  9.2s
 => => extracting sha256:001c52e26ad57e3b25b439ee0052f6692e5c0f2d5d982a00a8819ace5e521452                                                                   1.9s
 => => extracting sha256:d9d4b9b6e964657da49910b495173d6c4f0d9bc47b3b44273cf82fd32723d165                                                                   0.2s
 => => extracting sha256:2068746827ec1b043b571e4788693eab7e9b2a95301176512791f8c317a2816a                                                                   0.2s
 => => extracting sha256:9daef329d35093868ef75ac8b7c6eb407fa53abbcb3a264c218c2ec7bca716e6                                                                   2.0s
 => => extracting sha256:d85151f15b6683b98f21c3827ac545188b1849efb14a1049710ebc4692de3dd5                                                                   0.2s
 => => extracting sha256:66223a710990a0ae7162aeed80417d30303afa3f24aafa57aa30348725e2230b                                                                   0.0s
 => => extracting sha256:db38d58ec8ab4111b072f6700f978a51985acd252aabce3be377f25162e68301                                                                   3.9s
 => => extracting sha256:2896deaba78c60c05d4e37be721ade7bd8f30cddb280af30b5e4df930108f045                                                                   0.1s
 => => extracting sha256:25fd53091b07a227ff046dc649e522bed93779b38e38fca2635bc642eac0d71f                                                                   0.0s
 => => extracting sha256:dd3ce32e87decb846afbbee5101dd4f88280e8a7a6f3f1a2b8026efe474fda90                                                                   0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d                        12.7s
 => => resolve docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55                         0.1s
 => => sha256:0713a1ae7eb5f31b83e5efe619e1c1be0f28985d15b2cd36f47afcf3d9e3cf62 5.59kB / 5.59kB                                                              0.0s
 => => sha256:140e22108c7d39a72fc1f5f3ba4ffdd55836614e9c53175f5d43ada8b6bbaacc 3.27MB / 3.27MB                                                              1.8s
 => => sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55 549B / 549B                                                                  0.0s
 => => sha256:c710ac217d26e31560686e85cdac797e3e2cbb73146276647f5d9f6beea850c1 1.16kB / 1.16kB                                                              0.0s
 => => sha256:993077aca88ec2c64510ea6df4ece97e0a009459040c50730ec068cf7076b7c7 209B / 209B                                                                  0.7s
 => => sha256:751ef25978b2971e15496369695ba51ed5b1b9aaca7e37b18a173d754d1ca820 27.14MB / 27.14MB                                                            1.5s
 => => sha256:a1316402b155e7344964cea7a5a30218b7d122e100d3b5a140d4812e508220ad 202.34MB / 202.34MB                                                          8.2s
 => => extracting sha256:751ef25978b2971e15496369695ba51ed5b1b9aaca7e37b18a173d754d1ca820                                                                   1.2s
 => => extracting sha256:140e22108c7d39a72fc1f5f3ba4ffdd55836614e9c53175f5d43ada8b6bbaacc                                                                   0.2s
 => => extracting sha256:993077aca88ec2c64510ea6df4ece97e0a009459040c50730ec068cf7076b7c7                                                                   0.0s
 => => extracting sha256:a1316402b155e7344964cea7a5a30218b7d122e100d3b5a140d4812e508220ad                                                                   4.3s
 => [internal] load build context                                                                                                                           0.2s
 => => transferring context: 5.10kB                                                                                                                         0.0s
 => [stage-1 2/3] WORKDIR /app                                                                                                                              0.7s
 => [maven_build 2/6] WORKDIR /build                                                                                                                        0.7s
 => [maven_build 3/6] COPY pom.xml .                                                                                                                        0.0s
 => [maven_build 4/6] RUN mvn dependency:go-offline                                                                                                       607.0s
 => [maven_build 5/6] COPY src ./src                                                                                                                        0.0s
 => [maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                                               28.3s
 => [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                                     0.1s
 => exporting to image                                                                                                                                      0.1s
 => => exporting layers                                                                                                                                     0.1s
 => => writing image sha256:56616a82fa61cb0a6c559edcc0861e6f9ce6b7b0046338a5b8725ddd5b4b41ae                                                                0.0s
```

#### 2.2.3. 의존성 변경

* `pom.xml` 파일에 다음과 같은 의존성을 추가합니다.

```xml
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>1.18.24</version>
        <scope>provided</scope>
    </dependency>
```

#### 2.2.4. 이미지 재빌드 시간

* `pom.xml` 파일이 변경되었으므로 그 아래 캐싱 레이어를 사용하지 못합니다.
* 최초 빌드와 마찬가지로 `RUN mvn dependency:go-offline` 레이어에서 559.4초 소요됩니다.
    * 캐싱된 레이어를 재사용하지 못하므로 모든 의존성을 다시 다운로드 받습니다.
* 빌드 시간이 총 573.7초 소요됩니다.

```
$ docker build .

[+] Building 573.7s (17/17) FINISHED                  
 => [internal] load build definition from Dockerfile                                                                                                       0.0s
 => => transferring dockerfile: 37B                                                                                                                        0.0s
 => [internal] load .dockerignore                                                                                                                          0.0s
 => => transferring context: 2B                                                                                                                            0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                              2.4s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                                      2.4s
 => [auth] library/openjdk:pull token for registry-1.docker.io                                                                                             0.0s
 => [auth] library/maven:pull token for registry-1.docker.io                                                                                               0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55                0.0s
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215                    0.0s
 => [internal] load build context                                                                                                                          0.0s
 => => transferring context: 3.16kB                                                                                                                        0.0s
 => CACHED [maven_build 2/6] WORKDIR /build                                                                                                                0.0s
 => [maven_build 3/6] COPY pom.xml .                                                                                                                       0.0s
 => [maven_build 4/6] RUN mvn dependency:go-offline                                                                                                      559.4s
 => [maven_build 5/6] COPY src ./src                                                                                                                       0.0s 
 => [maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                                              11.2s 
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                                      0.0s 
 => [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                                    0.1s 
 => exporting to image                                                                                                                                     0.1s 
 => => exporting layers                                                                                                                                    0.1s 
 => => writing image sha256:729ceb3391af10e49d633d5f180cd48acbd5ba1fc3ea86e5466f924599128329                                                               0.0s 
```

### 2.3. 시간 측정 - Buildkit 적용

`Buildkit`을 적용한 후 의존성에 변경이 있었을 때 속도 차이가 얼마나 있는지 살펴보겠습니다. 

#### 2.3.1. Dockerfile Script

* `RUN --mount=type=cache` 옵션
    * 컴파일러나 패키지 매니저들을 위한 캐시 디렉토리를 임의의 디렉토리에 연결합니다.
    * 컨테이너를 빌드할 때 컴파일러나 패키지 매니저는 캐시 디렉토리를 사용할 수 있습니다.
* `target=/root/.m2` 옵션
    * 마운트할 경로를 지정합니다.
    * 메이븐 이미지가 사용하는 로컬 레포지토리 경로를 캐시 디렉토리로 지정합니다.

```dockerfile
FROM maven:3.8.6-jdk-11 as MAVEN_BUILD

WORKDIR /build

COPY pom.xml .

RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline

COPY src ./src

RUN --mount=type=cache,target=/root/.m2 mvn package -Dmaven.test.skip=true

FROM openjdk:11-jdk-slim-buster

WORKDIR /app

ARG JAR_FILE=*.jar

COPY --from=MAVEN_BUILD /build/target/${JAR_FILE} ./app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
```

#### 2.3.2. 최초 빌드 시간

* 최초 이미지 빌드 시 필요한 의존성들을 준비하는 `RUN mvn dependency:go-offline` 레이어에서 1020.7초 소요됩니다.
* 빌드 시간이 총 1063.1초 소요됩니다.

```
$ docker build . 

[+] Building 1063.1s (15/15) FINISHED
 => [internal] load build definition from Dockerfile                                                                                                      0.0s
 => => transferring dockerfile: 448B                                                                                                                      0.0s
 => [internal] load .dockerignore                                                                                                                         0.0s
 => => transferring context: 2B                                                                                                                           0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                             2.1s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                                     2.1s
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215                  21.2s
 => => resolve docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215                               0.0s
 => => sha256:6c3ab1faec76c92f0867f4b366000d77e8dab5f9d6339fb03c1e394e20f3cb59 8.91kB / 8.91kB                                                            0.0s
 => => sha256:d9d4b9b6e964657da49910b495173d6c4f0d9bc47b3b44273cf82fd32723d165 5.16MB / 5.16MB                                                            1.3s
 => => sha256:2068746827ec1b043b571e4788693eab7e9b2a95301176512791f8c317a2816a 10.88MB / 10.88MB                                                          1.8s
 => => sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215 549B / 549B                                                                0.0s
 => => sha256:37a94a4fe3b52627748d66c095d013a17d67478bc0594236eca55c8aef33ddaa 2.42kB / 2.42kB                                                            0.0s
 => => sha256:001c52e26ad57e3b25b439ee0052f6692e5c0f2d5d982a00a8819ace5e521452 55.00MB / 55.00MB                                                          4.6s
 => => sha256:9daef329d35093868ef75ac8b7c6eb407fa53abbcb3a264c218c2ec7bca716e6 54.58MB / 54.58MB                                                          4.5s
 => => sha256:d85151f15b6683b98f21c3827ac545188b1849efb14a1049710ebc4692de3dd5 5.42MB / 5.42MB                                                            2.9s
 => => sha256:66223a710990a0ae7162aeed80417d30303afa3f24aafa57aa30348725e2230b 213B / 213B                                                                3.2s
 => => sha256:db38d58ec8ab4111b072f6700f978a51985acd252aabce3be377f25162e68301 202.07MB / 202.07MB                                                       15.7s
 => => sha256:2896deaba78c60c05d4e37be721ade7bd8f30cddb280af30b5e4df930108f045 8.74MB / 8.74MB                                                            5.3s
 => => extracting sha256:001c52e26ad57e3b25b439ee0052f6692e5c0f2d5d982a00a8819ace5e521452                                                                 2.2s
 => => sha256:25fd53091b07a227ff046dc649e522bed93779b38e38fca2635bc642eac0d71f 856B / 856B                                                                4.9s
 => => sha256:dd3ce32e87decb846afbbee5101dd4f88280e8a7a6f3f1a2b8026efe474fda90 360B / 360B                                                                5.2s
 => => extracting sha256:d9d4b9b6e964657da49910b495173d6c4f0d9bc47b3b44273cf82fd32723d165                                                                 0.2s
 => => extracting sha256:2068746827ec1b043b571e4788693eab7e9b2a95301176512791f8c317a2816a                                                                 0.3s
 => => extracting sha256:9daef329d35093868ef75ac8b7c6eb407fa53abbcb3a264c218c2ec7bca716e6                                                                 2.4s
 => => extracting sha256:d85151f15b6683b98f21c3827ac545188b1849efb14a1049710ebc4692de3dd5                                                                 0.2s
 => => extracting sha256:66223a710990a0ae7162aeed80417d30303afa3f24aafa57aa30348725e2230b                                                                 0.0s
 => => extracting sha256:db38d58ec8ab4111b072f6700f978a51985acd252aabce3be377f25162e68301                                                                 4.5s
 => => extracting sha256:2896deaba78c60c05d4e37be721ade7bd8f30cddb280af30b5e4df930108f045                                                                 0.1s
 => => extracting sha256:25fd53091b07a227ff046dc649e522bed93779b38e38fca2635bc642eac0d71f                                                                 0.0s
 => => extracting sha256:dd3ce32e87decb846afbbee5101dd4f88280e8a7a6f3f1a2b8026efe474fda90                                                                 0.0s
 => [internal] load build context                                                                                                                         0.0s
 => => transferring context: 5.10kB                                                                                                                       0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55              20.2s
 => => resolve docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55                       0.0s
 => => sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55 549B / 549B                                                                0.0s
 => => sha256:c710ac217d26e31560686e85cdac797e3e2cbb73146276647f5d9f6beea850c1 1.16kB / 1.16kB                                                            0.0s
 => => sha256:0713a1ae7eb5f31b83e5efe619e1c1be0f28985d15b2cd36f47afcf3d9e3cf62 5.59kB / 5.59kB                                                            0.0s
 => => sha256:751ef25978b2971e15496369695ba51ed5b1b9aaca7e37b18a173d754d1ca820 27.14MB / 27.14MB                                                          7.3s
 => => sha256:140e22108c7d39a72fc1f5f3ba4ffdd55836614e9c53175f5d43ada8b6bbaacc 3.27MB / 3.27MB                                                            6.9s
 => => sha256:993077aca88ec2c64510ea6df4ece97e0a009459040c50730ec068cf7076b7c7 209B / 209B                                                                7.2s
 => => sha256:a1316402b155e7344964cea7a5a30218b7d122e100d3b5a140d4812e508220ad 202.34MB / 202.34MB                                                       15.5s
 => => extracting sha256:751ef25978b2971e15496369695ba51ed5b1b9aaca7e37b18a173d754d1ca820                                                                 1.3s
 => => extracting sha256:140e22108c7d39a72fc1f5f3ba4ffdd55836614e9c53175f5d43ada8b6bbaacc                                                                 0.2s
 => => extracting sha256:993077aca88ec2c64510ea6df4ece97e0a009459040c50730ec068cf7076b7c7                                                                 0.0s
 => => extracting sha256:a1316402b155e7344964cea7a5a30218b7d122e100d3b5a140d4812e508220ad                                                                 4.4s
 => [stage-1 2/3] WORKDIR /app                                                                                                                            0.6s
 => [maven_build 2/6] WORKDIR /build                                                                                                                      0.0s
 => [maven_build 3/6] COPY pom.xml .                                                                                                                      0.0s
 => [maven_build 4/6] RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline                                                                1020.7s
 => [maven_build 5/6] COPY src ./src                                                                                                                      0.0s
 => [maven_build 6/6] RUN --mount=type=cache,target=/root/.m2 mvn package -Dmaven.test.skip=true                                                         18.4s
 => [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                                   0.1s
 => exporting to image                                                                                                                                    0.1s
 => => exporting layers                                                                                                                                   0.1s
 => => writing image sha256:c40d22d9c3b0b8467a859ce0bf545ea69fd6356006957f044f164767e14c6cc3                                                              0.0s
```

#### 2.3.3. 의존성 변경

* `pom.xml` 파일에 다음과 같은 의존성을 추가합니다.

```xml
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>1.18.24</version>
        <scope>provided</scope>
    </dependency>
```

#### 2.3.4. 이미지 재빌드 시간

* `pom.xml` 파일이 변경되었으므로 그 아래 캐싱 레이어를 사용하지 못합니다.
* 최초 빌드에 사용한 캐시 디렉토리를 사용하므로 `RUN mvn dependency:go-offline` 레이어에서 4.7초 소요됩니다.
    * 모든 의존성이 아니라 추가된 `lombok`만 다운로드 받습니다.
* 빌드 시간이 총 11.1s초 소요됩니다.

```
$ docker build .
[+] Building 11.1s (17/17) FINISHED
 => [internal] load build definition from Dockerfile                                                                                                      0.0s
 => => transferring dockerfile: 37B                                                                                                                       0.0s
 => [internal] load .dockerignore                                                                                                                         0.0s
 => => transferring context: 2B                                                                                                                           0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                             2.3s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                                     2.3s
 => [auth] library/openjdk:pull token for registry-1.docker.io                                                                                            0.0s
 => [auth] library/maven:pull token for registry-1.docker.io                                                                                              0.0s
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215                   0.0s
 => [internal] load build context                                                                                                                         0.0s
 => => transferring context: 3.16kB                                                                                                                       0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55               0.0s
 => CACHED [maven_build 2/6] WORKDIR /build                                                                                                               0.0s
 => [maven_build 3/6] COPY pom.xml .                                                                                                                      0.0s
 => [maven_build 4/6] RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline                                                                   4.7s
 => [maven_build 5/6] COPY src ./src                                                                                                                      0.0s 
 => [maven_build 6/6] RUN --mount=type=cache,target=/root/.m2 mvn package -Dmaven.test.skip=true                                                          3.4s 
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                                     0.0s 
 => [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                                   0.1s 
 => exporting to image                                                                                                                                    0.1s 
 => => exporting layers                                                                                                                                   0.1s 
 => => writing image sha256:c824a279b1034f3fdf246c0014d629ce3440812da05ad853037287ec616a3476                                                              0.0s 
```

## CLOSING

의존성 변경이 발생했을 때 단축된 시간을 간단한 표로 정리하면 다음과 같습니다. 
최초 빌드 시간이 차이나는 것은 네트워크 등에 영향을 받을 수 있기 때문에 크게 고려할 사항이 아닙니다. 
집중해야하는 정보는 의존성 변경이 발생했을 때 빌드 시간의 차이입니다.  

| | 최초 빌드 시간 | 의존성 변경 후 빌드 시간 |
|:---:|:---:|:---:|
| Buildkit 미사용 | 662.4초 | 573.7초 | 
| Buildkit 사용 | 1063.1초 | 11.1초 | 

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-10-29-optimize-docker-build-with-buildkit>

#### REFERENCE

* <https://docs.docker.com/build/buildkit/>
* <https://github.com/moby/buildkit>
* <https://www.baeldung.com/ops/docker-cache-maven-dependencies>
* <https://stackoverflow.com/questions/57581943/mount-type-cache-in-buildkit>

[optimize-maven-project-when-dockerizing-link]: https://junhyunny.github.io/docker/maven/optimize-maven-project-when-dockerizing/