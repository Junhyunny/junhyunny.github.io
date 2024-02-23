---
title: "Github Actions Example"
search: false
category:
  - information
  - github
  - dev-ops
last_modified_at: 2023-02-23T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Github Actions Basic][github-actions-link]

## 0. 들어가면서

[Github Actions Basic][github-actions-link]에선 깃허브 액션스(github actions)의 기본 개념을 다뤘다. 이번 글은 워크플로우 파일을 작성해 파이프라인을 구성하는 방법에 대해 정리했다. 파이프라인 전체를 자동화할 수 없는 현재 프로젝트 상황에 맞게 컨테이너 이미지를 빌드해서 이미지 레지스트리(registry)에 올리는 단계까지 구축한 예제이다.

## 1. Context

현재 프로젝트는 모노레포(monorepo) 방식으로 백엔드, 프론트엔드 애플리케이션이 하나의 디렉토리에 존재한다. 각 애플리케이션 경로에서 테스트를 수행하고, 두 테스트가 모두 성공하면 이미지를 빌드해 배포한다.

- 파이프라인을 가시화하고 효율적인 실행을 위해 프론트엔드, 백엔드 테스트는 작업(job)으로 구분한다.
  - 작업은 각자 격리된 러너(runner)를 할당 받아 병렬로 실행하기 때문에 테스트 단계 속도가 빠르다.
- 작업의 성격이 다르고 프론트엔드, 백엔드 테스트 파이프라인이 모두 성공했을 때 이미지를 빌드하고 배포하기 위해 작업을 구분한다.

구상 중인 파이프라인을 시각화하면 다음과 같다.

1. 개발자가 코드를 특정 브랜치에 푸시(push)하면 파이프라인이 트리거(trigger)된다.
1. 깃허브 액션스에 등록한 워크 플로우가 실행된다.
1. 파이프라인이 모두 성공하면 컨테이너 이미지를 만들어 배포한다.

<p align="center">
  <img src="/images/posts/2024/github-actions-example-01.png" width="80%" class="image__border">
</p>

## 2. Build Pipeline

이제 파이프라인을 구축해보자. 먼저 프로젝트 구조부터 살펴본다.

### 2.1. Project

프로젝트는 다음과 같은 구조를 가진다. 

- 프로젝트 루트(root) 경로에 프론트엔드, 백엔드 애플리케이션 경로가 있다.
- 각 애플리케이션 경로에 컨테이너 이미지를 만들기 위한 Dockerfile이 존재한다.

```
./
├── README.md
├── backend
│   ├── Dockerfile
│   ├── HELP.md
│   ├── build.gradle
│   ├── settings.gradle
│   └── src
│       ├── main
│       │   ├── kotlin
│       │   │   └── blog
│       │   │       └── in
│       │   │           └── action
│       │   │               └── ActionInBlogApplication.kt
│       │   └── resources
│       │       ├── application.properties
│       │       ├── static
│       │       └── templates
│       └── test
│           └── kotlin
│               └── blog
│                   └── in
│                       └── action
│                           └── ActionInBlogApplicationTests.kt
└── frontend
    ├── Dockerfile
    ├── README.md
    ├── nginx.conf
    ├── package-lock.json
    ├── package.json
    ├── public
    │   ├── favicon.ico
    │   ├── index.html
    │   ├── logo192.png
    │   ├── logo512.png
    │   ├── manifest.json
    │   └── robots.txt
    ├── src
    │   ├── App.css
    │   ├── App.test.tsx
    │   ├── App.tsx
    │   ├── index.css
    │   ├── index.tsx
    │   ├── logo.svg
    │   ├── react-app-env.d.ts
    │   ├── reportWebVitals.ts
    │   └── setupTests.ts
    └── tsconfig.json
```

### 2.2. Pipeline Workflow File

다음과 같은 워크플로우 파일을 생성한다. 가독성 좋은 설명을 위해 주석으로 설명한다. 

```yml
name: CI/CD Pipeline
# main 브랜치에 push 이벤트가 발생하면 워크플로우가 실행된다.
on:
  push:
    branches: [ "main" ]
jobs:
  # backend-test 작업을 정의한다.
  backend-test:
    # 러너(runner) OS는 우분투 환경을 사용한다.
    runs-on: ubuntu-latest
    steps: # backend-test 작업에서 실행될 스텝들을 정의한다.
      - name: Check out # 프로젝트 코드 체크아웃
        uses: actions/checkout@v4
      - name: Setup Java # Java 설정
        uses: actions/setup-java@v4
        with:
          distribution: 'adopt'
          java-version: '17'
      - name: Setup Gradle # Gradle 설정
        uses: gradle/gradle-build-action@v3
      - name: Unit Test # 단위 테스트 실행
        working-directory: ./backend
        run: |
          ./gradlew test
  # frontend-test 작업을 정의한다.
  frontend-test:
    # 러너 OS는 우분투 환경을 사용한다.
    runs-on: ubuntu-latest
    steps: # frontend-test 작업에서 실행될 스텝들을 정의한다.
      - name: Check out # 코드 체크아웃
        uses: actions/checkout@v4
      - name: Setup Node # Node 환경 설정
        uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Unit Test # 단위 테스트 실행
        working-directory: ./frontend
        run: |
          npm ci
          npm test
  # image-build-and-deploy 작업을 정의한다.
  image-build-and-deploy:
    # 러너 OS는 우분투 환경을 사용한다.
    runs-on: ubuntu-latest
    steps: # frontend-test 작업에서 실행될 스텝들을 정의한다.
      - name: Check out # 코드 체크아웃
        uses: actions/checkout@v4
      - name: Set up QEMU # QEMU 설정
        uses: docker/setup-qemu-action@v3
      - name: Set up Docker Buildx # Buildx 설정
        uses: docker/setup-buildx-action@v3
      - name: Login to Docker Hub # 도커 허브 로그인
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Backend Build and push # 백엔드 컨테이너 이미지 빌드 및 푸시
        uses: docker/build-push-action@v5
        with:
          context: ./backend # 애플리케이션 컨텍스트 설정
          push: true
          tags: opop3966/backend:latest # 이미지 태그 설정
      - name: Frontend Build and push # 프론트엔드 컨테이너 이미지 빌드 및 푸시
        uses: docker/build-push-action@v5
        with:
          context: ./frontend # 애플리케이션 컨텍스트 설정
          push: true
          tags: opop3966/frontend:latest # 이미지 태그 설정
    needs: [ backend-test, frontend-test ] # 순차적인 작업 수행을 위해 종속성을 추가
```

### 2.3. Add Secrets for Pipeline

도커 허브에 로그인하기 위해 필요한 사용자 아이디와 비밀번호는 환경 변수로 등록한다. 

- 프로젝트 레포지토리 `Settings` 탭을 누른다.
- `Secrets and Variables` 메뉴를 누른다.
- 파이프라인에 필요한 시크릿을 등록한다.
  - DOCKERHUB_USERNAME - 도커 허브 사용자 아이디
  - DOCKERHUB_TOKEN - 도커 허브 사용자 비밀번호 혹은 발급 토큰

<p align="center">
  <img src="/images/posts/2024/github-actions-example-02.png" width="100%" class="image__border">
</p>

## 3. Run Pipeline

프로젝트 변경 사항을 커밋(commit) 후 푸시한다.

### 3.1. Check Pipeline 

`Actions` 탭에서 CI/CD 파이프라인의 동작 모습을 확인할 수 있다.

<p align="center">
  <img src="/images/posts/2024/github-actions-example-03.png" width="100%" class="image__border">
</p>

### 3.2. Check Dockerhub

도커 허브에 업로드 된 이미지를 확인할 수 있다.

<p align="center">
  <img src="/images/posts/2024/github-actions-example-04.png" width="100%" class="image__border">
</p>

## CLOSING

이번 글에서 파이프라인을 구성할 때 최적화 작업은 수행하지 않았다. 깃허브 액션스로 파이프라인을 구축할 때 캐시를 사용하면 이전 파이프라인에서 사용했던 리소스를 재사용함으로써 테스트나 빌드 시간을 단축시킬 수 있다. 다음 글은 간략하게 구성한 파이프라인을 최적화하는 방법에 대해 정리할 예정이다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/github-actions>

#### REFERENCE

- <https://github.com/docker/build-push-action>

[github-actions-link]: https://junhyunny.github.io/information/github/dev-ops/github-actions/