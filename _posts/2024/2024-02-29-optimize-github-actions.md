---
title: "Optimize Github Actions"
search: false
category:
  - information
  - github
  - dev-ops
last_modified_at: 2024-02-29T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Github Actions Example][github-actions-example-link]
- [Build with Dockerfile and Image Layer][docker-file-build-and-image-layer-link]

## 0. 들어가면서

[Github Actions Example][github-actions-example-link]에서 간단한 파이프라인을 구성하는 방법에 대해 다뤘다. 이번 글은 파이프라인을 최적화하는 방법에 대해 정리했다. 

## 1. Cache Action in Github Actions

CI/CD 파이프라인을 여러번 구축해보니 가장 시간을 많이 차지하는 작업은 필요한 의존성들을 다운로드 받는 것이다. 젠킨스(jenkins)나 깃랩(gitlab)에서 파이프라인을 구축할 때도 다운로드 받은 의존성을 재사용해서 빌드 시간을 줄이는 방법들이 존재한다. 깃허브 액션스에도 마찬가지로 의존성 재사용을 통한 파이프라인 시간을 단축하는 방법이 있다. 

캐시 액션(cache action)라는 액션을 사용하면 다운로드 의존성을 재사용할 수 있다. 공식 문서에서 다음과 같은 설명을 볼 수 있다.

> To make your workflows faster and more efficient, you can create and use caches for dependencies and other commonly reused files.

워크플로우(workflow)의 작업(job)이 동작하는 러너(runner) 환경은 항상 깨끗한 이미지이기 때문에 매번 필요한 의존성들을 다운로드 받는다. 네트워크 사용량이 늘어나고 빌드 시간이 길어지고 비용도 늘어나게 된다. 캐시 액션을 사용하면 자주 사용하는 의존성 파일들을 재사용할 수 있다. 간단하게 사용 방법을 알아보자.

다음과 같은 입력 설정들이 있다.

- key 
  - 필수 값으로 캐시를 저장하거나 재사용하기 위해 찾을 때 사용한다. 
  - 변수, 컨텍스트 값, 정적 문자열, 함수들을 사용해 만들 수 있다.
  - 최대 문자 길이는 512 이며 최대 길이를 넘어가는 경우 액션이 실패한다.
- path
  - 필수 값으로 러너에서 캐시를 적용할 경로를 의미한다. 의존성 파일들이 설치되는 디렉토리 경로가 보통 대상이 된다.
  - 경로를 여러 개 등록할 수 있으며 절대 경로나 상대 경로를 모두 사용할 수 있다.
- restore-keys
  - 선택 사항으로 매칭되는 키(key)가 없을 때 캐시를 찾거나 복원하기 위해 복원 키를 사용한다.
  - 여러 개 존재하는 경우 순차적으로 적용된다.
- enableCrossOsArchive
  - 선택 사항으로 불리언(boolean) 값을 입력한다.
  - 다른 독립적인 운영체제에 캐시를 저장하거나 복원하는 것을 허용한다.

다음과 같은 출력 값이 있다.

- cache-hit
  - 불리언 값으로 키에 매칭되는 캐시를 찾았는지 여부를 의미한다.

공식 문서를 보면 캐시 액션을 사용한 예제를 볼 수 있다. 설정이 직관적이기 때문에 예시를 이해하는데 크게 어려움은 없다.

```yml
name: Caching with npm
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Cache node modules
        id: cache-npm
        uses: actions/cache@v3
        env:
          cache-name: cache-node-modules
        with:
          # npm cache files are stored in `~/.npm` on Linux/macOS
          path: ~/.npm
          key: ${{ runner.os }}-build-${{ env.cache-name }}-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-build-${{ env.cache-name }}-
            ${{ runner.os }}-build-
            ${{ runner.os }}-
      - if: ${{ steps.cache-npm.outputs.cache-hit != 'true' }}
        name: List the state of node modules
        continue-on-error: true
        run: npm list
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Test
        run: npm test
```

공식 문서를 살펴보면 `setup-*` 액션을 사용하면 직접 캐시 액션을 사용하지 않아도 캐시를 적용할 수 있는 방법이 소개되어 있다. 많은 캐시 액션 예제 글들이 직접 의존성 파일들을 캐싱하지만, `setup-*` 액션에 포함된 캐시 기능을 사용할 생각이다. 다음과 같은 `setup-*` 액션들을 지원한다.

<p align="center">
  <img src="/images/posts/2024/optimize-github-actions-01.png" width="80%" class="image__border">
</p>
<center>https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows</center>

## 2. setup-* Caching

백엔드 애플리케이션은 의존성 관리를 위해 그래이들(gradle)를 사용한다. 파이프라인 설정을 다음과 같이 변경한다. 모노 레포 환경이기 때문에 캐시 의존성 경로를 기본 값으로 사용하지 못 한다. 그래이들 프로젝트의 캐시 의존성 경로를 지정한다.

```yml
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'adopt'
          java-version: '17'
          cache: 'gradle'
          cache-dependency-path: |
            ./backend/*.gradle*
            ./backend/**/gradle-wrapper.properties
```

프론트엔드 애플리케이션은 의존성 관리를 위해 npm을 사용한다. 파이프라인 설정을 다음과 같이 변경한다. 마찬가지로 캐시 의존성 경로를 직접 지정해준다.

```yml
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
          cache-dependency-path: ./frontend/package-lock.json
```

## 3. Docker Caching

[Github Actions Example][github-actions-example-link] 글에서 소개했지만, 파이프라인 마지막엔 이미지를 만들어 배포하는 작업을 수행한다. 도커 이미지 레이어(layer)를 재사용할 수 있도록 캐싱해야 한다. 짧은 생각으론 이미지 레이어가 저장되는 위치에 대해 캐시 액션을 적용할 것 같았지만, 탐구해보니 도커 진영에서 만든 액션을 활용하는 것이 가장 흔한 방법으로 보여졌다.

공식 홈페이지나 다른 블로그 글들을 보면 `build-push-action` 액션에 다음과 같은 설정을 추가하면 캐시가 동작하는 것처럼 보인다.  `build-push-action` 액션에서 캐시를 사용하려면 `setup-buildx-action` 액션이 사전에 호출되어 도커 드라이브가 미리 준비된 상태여야 한다.

- cache-from
  - 빌드를 위해 외부 캐시 소스를 지정한다.
  - 다음과 같은 타입들이 존재한다. 
    - `registry source` can import cache from a cache manifest or (special) image configuration on the registry
    - `local source` can import cache from local files previously exported with --cache-to
    - `gha source` can import cache from a previously exported cache with --cache-to in your GitHub repository
    - `s3 source` can import cache from a previously exported cache with --cache-to in your S3 bucket
- cache-to
  - 외부 캐시 저장소에 빌드한 캐시를 내보낸다.
  - 다음과 같은 타입들이 존재한다.
    - `registry type` exports build cache to a cache manifest in the registry
    - `local type` exports cache to a local directory on the client
    - `inline type` writes the cache metadata into the image configuration
    - `gha type` exports cache through the GitHub Actions Cache service API
    - `s3 type` exports cache to a S3 bucket

```yml
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      # ...
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: "<registry>/<image>:latest"
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

공식 홈페이지나 많은 블로그 글들이 gha 타입이 정상적으로 동작하는 것처럼 작성되어 있지만, 필자의 경우 어떤 이유에선지 정상적으로 캐시가 동작하지 않았다. gha 타입이 베타 버전임을 고려하더라도 빌드 이미지를 저장하고 찾는 위치만 바뀌는 것이기 때문에 크게 문제가 없을 것 같았지만, 생각보다 시간을 많이 허비했다. 같은 작업에서 같은 타입으로 이미지를 두 번 빌드하기 때문인지 모르겠다는 생각이 들었지만, 관련된 내용에 대한 이슈들은 찾을 수 없었다. 이 현상에 대해 다시 정리해서 깃허브 이슈나 스택 오버플로우에 문의할 생각이다.

[Cache management with GitHub Actions](https://docs.docker.com/build/ci/github-actions/cache/) 글을 읽어보면 깃허브 액션스에서 사용할 수 있는 다양한 캐싱 방법들이 정리되어 있다. 필자는 `Inline cache` 방법을 사용했을 때 정상적으로 동작했다. 다음과 같이 파이프라인을 구성했다.

```yml
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      # ...
      - name: Backend Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: opop3966/backend:latest
          cache-from: type=registry,ref=opop3966/backend:latest
          cache-to: type=inline
      - name: Frontend Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: opop3966/frontend:latest
          cache-from: type=registry,ref=opop3966/frontend:latest
          cache-to: type=inline
```

전체 파이프라인 스크립트를 보고 싶다면 글 아래 테스트 코드 저장소를 참고하길 바란다. 

## 4. Result 

파이프라인을 변경했으니 속도 차이를 확인해보자.

### 4.1. First time to run pipeline

캐시 관련 설정을 추가하고 실행한 파이프라인이다. 첫 실행이므로 캐시를 재사용하지 않고 저장만 한다.

- 백엔드 애플리케이션 테스트 - 3분 11초
- 프론트엔드 애플리케이션 테스트 - 32초
- 도커 이미지 빌드와 푸시 - 2분 21초

<p align="center">
  <img src="/images/posts/2024/optimize-github-actions-02.png" width="80%" class="image__border">
</p>

### 4.2. Next time to run pipeline

README.md 파일만 변경하고 실행한 파이프라인이다. 새로 빌드할 필요가 없기 때문에 파이프라인 스텝(step) 대부분이 캐싱된다. 

- 백엔드 애플리케이션 테스트 - 43초
- 프론트엔드 애플리케이션 테스트 - 19초
- 도커 이미지 빌드와 푸시 - 16초

<p align="center">
  <img src="/images/posts/2024/optimize-github-actions-03.png" width="80%" class="image__border">
</p>

## CLOSING

README.md 파일만 변경했기 때문에 효과가 극적으로 보이지만, 확실히 파이프라인 속도는 크게 개선되었다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/github-actions>

#### REFERENCE

- <https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows>
- <https://github.com/actions/setup-java#caching-packages-dependencies>
- <https://docs.docker.com/build/cache/backends/>
- <https://docs.docker.com/build/cache/backends/gha/>
- <https://docs.docker.com/build/ci/github-actions/cache/>
- <https://docs.docker.com/reference/cli/docker/buildx/build/#cache-from>
- <https://docs.docker.com/reference/cli/docker/buildx/build/#cache-to>
- <https://github.com/moby/buildkit#github-actions-cache-experimental>

[github-actions-example-link]: https://junhyunny.github.io/information/github/dev-ops/github-actions-example/
[docker-file-build-and-image-layer-link]: https://junhyunny.github.io/information/docker/docker-file-build-and-image-layer/