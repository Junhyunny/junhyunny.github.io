---
title: "Buildkit으로 도커 빌드 최적화"
publishedAt: "2022-10-29"
updatedAt: "2026-11-12T16:15:20+09:00"
canonicalPath: "/information/docker/optimize-docker-build-with-buildkit/"
categories:
  - "information"
  - "docker"
summary: "의존성이 자주 바뀌는 메이븐 프로젝트에서 도커 Buildkit의 RUN --mount=type=cache 옵션으로 의존성을 캐싱해 이미지 재빌드 시간을 줄인 과정을 정리했다."
recommendedPosts:
  - title: "Optimize Docker Build of Maven Project"
    href: "https://junhyunny.github.io/docker/maven/optimize-maven-project-when-dockerizing/"
---

## 0. 들어가면서

[Optimize Docker Build of Maven Project][optimize-maven-project-when-dockerizing-link] 글에선 메이븐(maven) 프로젝트를 컨테이너 이미지로 빌드하는 과정을 최적화하는 방법을 다뤘다. 그 글에서 설명한 방법은 소스 코드가 바뀌었을 때 캐싱된 레이어를 이용해 빌드 속도를 높이는 것이었다.

안정된 프로젝트는 의존성(dependency)이 거의 바뀌지 않지만, 프로젝트 초기엔 자주 바뀐다. 이러면 의존성을 미리 받아 놓는 캐싱(caching) 레이어로 얻을 수 있는 이점이 거의 없다. `Docker Buildkit`을 사용하면 이런 문제를 완화할 수 있다. 이번 글에선 `Buildkit`에 관한 내용과 메이븐 프로젝트 빌드를 최적화하는 방법을 정리했다.

## 1. Docker Buildkit

`Buildkit`은 18.09 릴리스부터 지원하는 기능으로, `Dockerfile`의 재사용성과 빌드 성능을 개선하는 도구다. 다음과 같은 복잡한 시나리오에 도움을 준다.

- 사용하지 않는 빌드 스테이지(stage)를 감지하고 제외한다.
- 독립적인 빌드 스테이지는 병렬로 수행한다.
- 빌드 컨텍스트와 빌드 사이에 변경된 파일만 점진적으로 전달한다.
- 빌드 컨텍스트에서 사용하지 않는 파일을 감지하고 전달에서 제외한다.
- `REST API`를 사용할 때 부수 효과(side effect)를 피할 수 있다.
- 자동 프루닝(pruning)을 위해 빌드 캐시에 우선순위를 정한다.

다양한 기능을 제공하지만, `Buildkit`의 주된 역할은 빌드 성능, 스토리지 관리, 확장성 등을 향상하는 것이다.

### 1.1. LLB(Low Level Build)

`LLB(Low Level Build)`의 기술적 세부 사항은 상당히 복잡하기 때문에 소개 페이지에 있는 내용을 위주로 가볍게 살펴보자. `Buildkit`은 `LLB`라는 `binary intermediate format`을 기반으로 동작한다. `LLB`는 콘텐츠 주소를 정의할 수 있는 의존성 그래프를 정의하며, 이는 매우 복잡한 빌드를 통합하는 데 사용할 수 있다.

빌드의 실행, 캐싱과 관련된 모든 것이 `LLB`에 정의된다. 캐싱 모델 전체를 다시 쓰는 레거시 빌드와 달리 `LLB`는 빌드 그래프와 구체적인 동작이 정의된 콘텐츠의 체크섬(checksum)을 직접 추적한다. 이런 동작 방식은 빌드를 빠르고, 간결하고, 이식성 좋게 만들어 준다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/optimize-docker-build-with-buildkit-01.png" width="75%" class="image__border">
</div>
<center>https://docs.docker.com/build/buildkit/</center>

### 1.2. Frontend

프론트엔드(Frontend)는 사람이 읽을 수 있는 빌드 형식을 `LLB`로 변환하는 컴포넌트다. 프론트엔드는 이미지로 배포될 수 있으며, 사용자는 특정 프론트엔드 버전을 지정해 사용할 수 있다.

### 1.3. RUN --mount Types

`RUN --mount` 옵션으로 마운트(mount) 타입을 지정하면 이미지 빌드 프로세스가 접근할 수 있는 임시 마운트를 생성할 수 있다. 마운트에는 다음 4가지 종류가 있다.

- `bind` - 컨텍스트 디렉터리를 읽기 전용으로 `bind-mount`한다.
- `cache` - 컴파일러나 패키지 매니저가 사용할 수 있는 임시 디렉터리를 마운트한다.
- `secret` - 빌드 이미지에 함께 추가하지 않고 개인 키 같은 보안 파일에 접근할 수 있다.
- `ssh` - 빌드 시 암호 구문을 지원해 SSH 에이전트를 통해 SSH 키에 접근할 수 있다.

#### 1.3.1. --mount=type=cache 상세 옵션

이번 글에서 다루는 빌드 속도 개선 방법은 `cache` 타입을 사용한다. 이와 관련된 옵션은 다음과 같다.

- id 옵션
  - 다른 캐시와 구분하는 아이디 값이며 기본값은 `target`이다.
- target 옵션
  - 마운트할 경로(path)를 지정한다.
- ro, readonly 옵션
  - 이 옵션을 사용하면 캐시를 읽기 전용으로 지정한다.
- sharing 옵션
  - `shared`, `private`, `locked` 3가지 중 한 가지 값을 가진다.
  - 기본값은 `shared`이다.
  - `shared` 값 - 여러 사용자(writer)가 동시에 사용한다.
  - `private` 값 - 다른 사용자가 있으면 새로운 마운트를 생성한다.
  - `locked` 값 - 두 번째 사용자는 첫 번째 사용자가 마운트 사용을 마칠 때까지 대기한다.
- from 옵션
  - 캐시 마운트의 기준이 되는 빌드 스테이지다.
  - 기본값은 빈 디렉터리다.
- source 옵션
  - `from` 값의 하위 경로다.
  - 기본값은 `from` 값의 루트 경로다.
- mode 옵션
  - 새로운 캐시 디렉터리의 파일 모드다.
  - 기본값은 `0755`이다.
- uid 옵션
  - 캐시 디렉터리의 사용자 아이디다.
  - 기본값은 0이다.
- gid 옵션
  - 캐시 디렉터리의 그룹 아이디다.
  - 기본값은 0이다.

## 2. Optimize Maven Project Build

[Optimize Docker Build of Maven Project][optimize-maven-project-when-dockerizing-link] 예시를 기준으로 의존성이 바뀌었을 때 빌드 속도 차이가 얼마나 나는지 확인해 보자.

### 2.1. Activate Buildkit

먼저 `Buildkit` 지원을 활성화한다. 18.09 버전부터 지원했지만 19.03 버전까진 기본 방식이 아니므로 활성화 여부를 확인한 뒤 적용한다. 환경 변수로 지정하는 방법과 `daemon.json` 파일 설정을 변경하는 방법이 있는데, 이번 글에선 `daemon.json` 설정을 변경했다. 이 파일의 위치는 운영체제별로 다르다.

- MacOS - /Users/{userName}/.docker/daemon.json
- Linux - /etc/docker/daemon.json

`daemon.json` 파일을 다음과 같이 변경한다.

```json
{
  "features": {
    "buildkit" : true
  }
}
```

### 2.2. 시간 측정 - Buildkit 미적용

`Buildkit`을 적용하지 않은 `Dockerfile` 스크립트는 다음과 같다. 의존성을 정의하는 `pom.xml` 파일이 바뀌었을 때만 필요한 의존성을 받는 레이어(`RUN mvn dependency:go-offline`)를 다시 실행한다.

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

최초 이미지 빌드 시 필요한 의존성을 준비하는 `RUN mvn dependency:go-offline` 레이어에서 607초가 걸렸고, 빌드에 총 662.4초가 걸렸다.

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
 => [maven_build 4/6] RUN mvn dependency:go-offline                                                                                                       607.0s
 => [maven_build 5/6] COPY src ./src                                                                                                                        0.0s
 => [maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                                               28.3s
 => [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                                     0.1s
 => exporting to image                                                                                                                                      0.1s
 => => exporting layers                                                                                                                                     0.1s
 => => writing image sha256:56616a82fa61cb0a6c559edcc0861e6f9ce6b7b0046338a5b8725ddd5b4b41ae                                                                0.0s
```

이제 `pom.xml` 파일에 다음과 같은 의존성을 추가한다.

```xml
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>1.18.24</version>
        <scope>provided</scope>
    </dependency>
```

이미지를 다시 빌드하면 `pom.xml` 파일이 바뀌었으므로 그 아래 캐싱 레이어를 사용하지 못한다. 캐싱된 레이어를 재사용하지 못해 모든 의존성을 다시 내려받기 때문에 최초 빌드와 마찬가지로 `RUN mvn dependency:go-offline` 레이어에서 559.4초가 걸렸다. 빌드에는 총 573.7초가 걸렸다.

```
$ docker build .

[+] Building 573.7s (17/17) FINISHED
 => [maven_build 4/6] RUN mvn dependency:go-offline                                                                                                      559.4s
 => [maven_build 5/6] COPY src ./src                                                                                                                       0.0s
 => [maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                                              11.2s
 => [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                                    0.1s
 => exporting to image                                                                                                                                     0.1s
 => => exporting layers                                                                                                                                    0.1s
 => => writing image sha256:729ceb3391af10e49d633d5f180cd48acbd5ba1fc3ea86e5466f924599128329                                                               0.0s
```

### 2.3. 시간 측정 - Buildkit 적용

`Buildkit`을 적용한 뒤 의존성이 바뀌었을 때 속도 차이가 얼마나 나는지 살펴보자. `Dockerfile` 스크립트에서 사용한 옵션은 다음과 같다.

- `RUN --mount=type=cache` 옵션
  - 컴파일러나 패키지 매니저를 위한 캐시 디렉터리를 임의의 디렉터리에 연결한다.
  - 컨테이너를 빌드할 때 컴파일러나 패키지 매니저는 캐시 디렉터리를 사용할 수 있다.
- `target=/root/.m2` 옵션
  - 마운트할 경로를 지정한다.
  - 메이븐 이미지가 사용하는 로컬 저장소 경로를 캐시 디렉터리로 지정한다.

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

최초 이미지 빌드 시 필요한 의존성을 준비하는 `RUN mvn dependency:go-offline` 레이어에서 1020.7초가 걸렸고, 빌드에 총 1063.1초가 걸렸다.

```
$ docker build .

[+] Building 1063.1s (15/15) FINISHED
 => [maven_build 4/6] RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline                                                                1020.7s
 => [maven_build 5/6] COPY src ./src                                                                                                                      0.0s
 => [maven_build 6/6] RUN --mount=type=cache,target=/root/.m2 mvn package -Dmaven.test.skip=true                                                         18.4s
 => [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                                                   0.1s
 => exporting to image                                                                                                                                    0.1s
 => => exporting layers                                                                                                                                   0.1s
 => => writing image sha256:c40d22d9c3b0b8467a859ce0bf545ea69fd6356006957f044f164767e14c6cc3                                                              0.0s
```

앞에서와 같이 `pom.xml` 파일에 다음 의존성을 추가한다.

```xml
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <version>1.18.24</version>
        <scope>provided</scope>
    </dependency>
```

이미지를 다시 빌드하면 `pom.xml` 파일이 바뀌었으므로 그 아래 캐싱 레이어는 사용하지 못한다. 하지만 최초 빌드에 사용한 캐시 디렉터리를 사용하므로 모든 의존성이 아니라 추가된 `lombok`만 내려받는다. 그 결과 `RUN mvn dependency:go-offline` 레이어에서 4.7초, 빌드에 총 11.1초가 걸렸다.

```
$ docker build .
[+] Building 11.1s (17/17) FINISHED
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

의존성이 바뀌었을 때 단축된 시간을 간단한 표로 정리하면 다음과 같다. 최초 빌드 시간의 차이는 네트워크 등의 영향을 받을 수 있기 때문에 크게 고려할 사항이 아니다. 주목할 정보는 의존성이 바뀌었을 때의 빌드 시간 차이다.

| | 최초 빌드 시간 | 의존성 변경 후 빌드 시간 |
|:---:|:---:|:---:|
| Buildkit 미사용 | 662.4초 | 573.7초 |
| Buildkit 사용 | 1063.1초 | 11.1초 |

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-10-29-optimize-docker-build-with-buildkit>

#### REFERENCE

- <https://docs.docker.com/build/buildkit/>
- <https://github.com/moby/buildkit>
- <https://www.baeldung.com/ops/docker-cache-maven-dependencies>
- <https://stackoverflow.com/questions/57581943/mount-type-cache-in-buildkit>

[optimize-maven-project-when-dockerizing-link]: https://junhyunny.github.io/docker/maven/optimize-maven-project-when-dockerizing/
