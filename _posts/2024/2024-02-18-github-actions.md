---
title: "Github Actions Basic"
search: false
category:
  - information
  - github
  - dev-ops
last_modified_at: 2024-02-18T23:55:00
---

<br/>

## RECOMMEND POSTS BEFORE THIS

- [CI/CD 파이프라인][what-is-ci-cd-link]

## 0. 들어가면서

이번 프로젝트 MVP(minimum viable product) 릴리즈 일정이 다가오면서 운영 환경을 위한 CI/CD 파이프라인 구축이 필요했다. 현재 프로젝트 상황을 고려했을 때 `깃허브 액션스(Github Actions)`가 가장 최선의 선택이라고 생각됐다. 

- 고객사는 깃허브(github) 엔터프라이즈를 사용하고 있다.
- CI/CD 파이프라인 구축을 위한 리소스를 별도로 할당 받을 수 없다.
- 격리된 네트워크 내부 서버에서 받을 수 있는 애플리케이션 이미지를 만들어 배포하면 된다.

파이프라인을 구축하기 전에 팀원들에게 깃허브 액션스에 대한 내용을 공유하기 위해 블로그에 기본 개념들에 대해 공부한 것들을 정리했다. 

## 1. Github Actions

공식 홈페이지에선 깃허브 액션스에 대해 다음과 같이 설명하고 있다.

> GitHub Actions is a continuous integration and continuous delivery (CI/CD) platform that allows you to automate your build, test, and deployment pipeline.

애플리케이션 빌드, 테스트, 배포를 자동으로 수행할 수 있는 CI/CD 파이프라인 플랫폼이다. CI/CD 파이프라인 외에도 다른 작업들을 할 수 있다고 소개한다. 예를 들면 레포지토리에 새로운 이슈를 만들었을 때 적절한 라벨을 붙히는 작업도 깃허브 액션스를 통해 자동화할 수 있다고 한다. 

## 2. Components of Github Actions

깃허브 액션스를 구성하는 컴포넌트들에 대해서 알아보자. 각 컴포넌트가 어떤 역할을 수행하는지 파악하면 좀 더 원활하게 파이프라인을 구축할 수 있다. 

### 2.1. Workflows

워크플로우(workflow)는 자동화 된 프로세스를 의미한다. 위에서도 언급했지만, 자동화 된 프로세스는 CI/CD 파이프라인 외에도 레포지토리를 관리할 때 필요한 작업들을 자동으로 수행한다는 의미이다. 워크플로우는 다음과 같은 과정을 통해 만들 수 있다. 

1. 자동화 작업이 필요한 레포지토리에 `/.github/workflows` 폴더를 만든다.
2. 워크플로우 흐름을 정의한 yml 파일을 생성한다.
  - yml 파일을 여러 개 정의함으로써 여러 개 워크플로우를 만들 수 있다.
3. 워크플로우 yml 파일을 푸시하면 이를 기준으로 워크플로우가 동작한다. 

워크플로우는 다음과 같은 요소들로 구성되어 있다. 각 구성 요소들이 무엇인지 살펴보자.

- 이벤트(event)
- 작업(job)
- 스텝(step)

<p align="center">
  <img src="/images/posts/2024/github-actions-01.png" width="100%" class="image__border">
</p>
<center>https://docs.github.com/ko/actions/learn-github-actions/understanding-github-actions</center>

### 2.2. Events

이벤트는 워크플로우 실행을 트리거(trigger)하는 행위이다. 때문에 이벤트는 워크플로우를 정의할 때 필수로 지정해야 한다.  `push`, `pull_request` 이벤트가 파이프라인을 위해 많이 사용된다. 크론 잡(cron job)을 사용한 스케줄링도 가능하다. [워크플로우 이벤트](https://docs.github.com/ko/actions/using-workflows/events-that-trigger-workflows)들은 굉장히 다양하기 때문에 공식 홈페이지를 참고하길 바란다.

예를 들어 아래처럼 워크플로우 파일을 정의하면 메인 브랜치에 `push` 이벤트가 발생했을 때 워크플로우가 실행된다. 

```yml
on:
  push:
    branches:
      - 'main'
```

### 2.3. Runners, Jobs and Steps

작업(job)은 워크플로우가 수행해야 하는 태스크(task)들을 명시된 컴포넌트다. 여러 개의 스텝(step)으로 구성되어 있다. 기본적으로 각 작업들은 서로 의존적이지 않고 병렬로 동작한다. 작업들 사이의 의존 관계를 정의하여 순차적으로 실행하도록 만들 수도 있다. 

각 작업들은 독립적인 가상 머신(virtual machine)에서 실행된다. 가상 머신이 설치된 인스턴스를 러너(Runner)라고 한다. 각 작업들 사이의 컨텍스트는 공유되지 않는다. 리눅스, 윈도우즈 그리고 맥OS 운영체제를 지원하며 각 머신 별로 가격 정책이 다르기 때문에 주의해야 한다. 

작업에 포함되는 스텝들은 각자 쉘 스크립트나 액션(action)으로 정의된다. 서로 의존 관계를 가지기 때문에 순차적으로 동작한다. 이전 스텝에서 작업한 내용들에 대한 결과물들은 다음 스텝에서도 확인할 수 있다. 작업 중인 디렉토리 공간에 대한 컨텍스트는 이어지지 않는다. 

작업을 정의할 때 `runs-on`, `steps` 속성은 필수로 지정해야 한다. 

- runs-on
  - 작업이 실행될 러너(runner) 환경을 정의한다.
  - 아래 예시는 우분투 환경에서 실행한다고 명시한 것이다.
- steps
  - 해당 작업에서 수행할 일들을 순차적으로 정의한다.
  - 3개의 스텝을 정의했으며 순차적으로 실행된다.

```yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run a one-line script
        run: echo Hello, world!
      - name: Run a multi-line script
        run: |
          echo Add other actions to build,
          echo test, and deploy your project.
```

### 2.4. Actions

액션(action)은 깃허브 액션스 플랫폼에서 복잡하지만, 자주 실행하는 태스크들을 재사용하기 쉽게 하나로 묶어 정의한 컴포넌트이다. 예를 들면 다음과 같은 태스크들을 액션으로 정의해 사용할 수 있다.

- 코드 체크아웃
- 언어, 빌드 환경 설정
- 컨테이너 이미지 레지스트리 로그인

예를 들어 레포지토리 코드를 러너에 다운로드 받는 작업은 다음 `actions/checkout@v3` 액션을 사용한다.

```yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
```

이미 만들어진 액션을 사용해도 되지만, 필요하다면 커스텀하게 정의한 액션을 만들어 사용할 수도 있다. 필요하다면 [커스텀 액션](https://docs.github.com/en/actions/creating-actions) 링크에서 액션을 만드는 방법을 찾아보길 바란다. 

## 3. Start Github Actions

깃허브 액션스를 시작하는 방법은 굉장히 쉽다. 다음 절차를 따라 수행하면 깃허브 액션스를 실행할 수 있다.

- 레포지토리의 액션스 섹션으로 이동한다.
- 다양한 워크플로우 템플릿들이 존재한다.
  - 추천 워크플로우가 없다면 필요한 템플릿을 검색해서 사용할 수 있다.
  - 필자는 `Simple workflow`를 선택했다.

<p align="center">
  <img src="/images/posts/2024/github-actions-02.png" width="100%" class="image__border">
</p>

- 워크플로우 yml 파일을 생성한다.

<p align="center">
  <img src="/images/posts/2024/github-actions-03.png" width="100%" class="image__border">
</p>

- 액션스 섹션에서 방금 생성한 워크플로우가 실행되는 것을 확인할 수 있다.

<p align="center">
  <img src="/images/posts/2024/github-actions-04.png" width="100%" class="image__border">
</p>

## CLOSING

이번 글은 깃허브 액션스에 기본 개념에 대한 내용을 다뤘다. 필자의 프로젝트는 모노레포(monorepo)에서 리액트 프론트엔드, 스프링 백엔드 프로젝트를 관리하고 있다. 깃허브 액션스를 사용해 실제로 CI/CD 파이프라인을 구축한 내용은 다음 글로 정리할 예정이다. 

#### RECOMMEND NEXT POSTS

- [GitLab CI/CD Pipeline for On-Premise][gitlab-ci-cd-pipeline-link]
- [Optimize Gitlab CI Pipeline for Maven Project][optimize-gitlab-ci-pipeline-link]

#### REFERENCE

- <https://docs.github.com/ko/actions>
- <https://docs.github.com/ko/actions/learn-github-actions/understanding-github-actions>

[what-is-ci-cd-link]: https://junhyunny.github.io/information/what-is-ci-cd/
[gitlab-ci-cd-pipeline-link]: https://junhyunny.github.io/information/dev-ops/gitlab-ci-cd-pipeline-for-on-premise/
[optimize-gitlab-ci-pipeline-link]: https://junhyunny.github.io/gitlab-ci/maven/spring-boot/optimize-gitlab-ci-pipeline-for-maven-project/
