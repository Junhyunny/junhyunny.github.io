---
title: "메이븐 프로젝트 GitLab CI 파이프라인 최적화(Optimize Gitlab CI Pipeline for Maven Project)"
search: false
category:
  - gitlab-ci
  - maven
  - spring-boot
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [GitLab CI/CD Pipeline for On-Premise][gitlab-ci-cd-pipeline-for-on-premise-link]

## 0. 들어가면서

`깃랩(GitLab) CI`로 메이븐(maven) 프로젝트를 딜리버리할 때 캐싱이 정상적으로 동작하지 않아서 발생했던 문제를 해결한 내용이다. 메이븐 프로젝트에 대한 최적화 내용을 위해 파이프라인 코드를 일부 각색했다.

## 1. Problem

아래는 초기 `.gitlab-ci.yml` 파일이다. build, test, deploy 세 단계 스테이지가 존재한다. 각 스테이지를 수행하기 위한 잡(job)들이 존재한다. 다음 경로들에 캐시를 적용한다.

- /root/.m2/repository
  - 다운로드 받은 의존성 재사용
- action-in-blog/target
  - 프로젝트 빌드한 내용 재사용

```yml
stages:
  - build
  - test
  - deploy

image: openjdk:17-jdk-slim

cache:
  paths:
    - /root/.m2/repository
    - action-in-blog/target

build-app:
  stage: build
  only:
    - main
  before_script:
    - cd action-in-blog
  script:
    - ./mvnw clean compile

test-app:
  stage: test
  only:
    - main
  before_script:
    - cd action-in-blog
  script:
    - ./mvnw test

deploy-app:
  stage: deploy
  only:
    - main
  before_script:
    - cd action-in-blog
  script:
    - |
      ./mvnw -Dmaven.test.skip=true package
      echo "Deploy Application"
```

캐시는 각 잡들 사이에 특정 파일이나 디렉토리를 재사용하여 빌드 프로세스 속도를 높이는 기능이다. 필자는 디버그 로그를 통해 메이븐이 사용하는 로컬 레포지토리 위치가 `/root/.m2/repository`임을 미리 확인했다. 잡마다 프로젝트에 필요한 의존성을 다시 다운로드 받는 현상을 없애기 위해 `/root/.m2/repository` 경로를 캐시로 설정해 놨다.

한동안 사용하다 언젠가 파이프라인 로그를 봤을 때 캐시가 정상적으로 동작하지 않음을 확인했다. 파이프라인 모든 스테이지에서 필요한 의존성들을 매번 다운로드 받고 있었다.

- 각 잡마다 `/root/.m2/repository` 경로에 대한 캐시가 적용되지 않는다.
- 각 잡마다 원격 레포지토리에서 필요한 의존성을 다운로드 받는 작업이 발생한다.
  - 각 잡이 10초 이상씩 수행된다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/optimize-gitlab-ci-pipeline-for-maven-project-01.png" width="80%" class="image__border">
</div>

## 2. Solve the problem

파이프라인 로그를 살펴보면 다음과 같은 경고를 볼 수 있다. 깃랩 CI는 `$CI_PROJECT_DIR` 디렉토리 내부에서만 아티팩트(artifact)를 찾을 수 있다. 프로젝트 외부에 캐시를 둘 수 없다. `$CI_PROJECT_DIR`는 깃랩 CI에서 예약된 변수로 프로젝트 경로를 의미한다.

```
...

[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  16.252 s
[INFO] Finished at: 2023-12-10T05:49:13Z
[INFO] ------------------------------------------------------------------------
Deploy Application
Saving cache for successful job 00:04
Creating cache default-protected...
WARNING: processPath: artifact path is not a subpath of project directory: /root/.m2/repository
action-in-blog/target: found 32 matching artifact files and directories
Uploading cache.zip to https://storage.googleapis.com/gitlab-com-runners-cache/project/52921570/default-protected
Created cache
```

이 문제를 해결하기 위해 다음과 같이 `.gitlab-ci.yml` 스크립트를 변경한다.

- `$CI_PROJECT_DIR/.m2/repository` 경로를 캐싱한다.
- `MAVEN_OPTS` 옵션을 통해 로컬 레포지토리 경로를 `$CI_PROJECT_DIR/.m2/repository`로 설정한다.
  - `MAVEN_OPTS` 환경 변수는 메이븐 빌드 시 사용되므로 선언만으로도 적용된다.

```yml
stages:
  - build
  - test
  - deploy

variables:
  MAVEN_OPTS: >-
    -Dmaven.repo.local=$CI_PROJECT_DIR/.m2/repository

image: openjdk:17-jdk-slim

cache:
  paths:
    - $CI_PROJECT_DIR/.m2/repository
    - action-in-blog/target

build-app:
  stage: build
  only:
    - main
  before_script:
    - cd action-in-blog
  script:
    - ./mvnw clean compile

test-app:
  stage: test
  only:
    - main
  before_script:
    - cd action-in-blog
  script:
    - ./mvnw test

deploy-app:
  stage: deploy
  only:
    - main
  before_script:
    - cd action-in-blog
  script:
    - |
      ./mvnw -Dmaven.test.skip=true package
      echo "Deploy Application"
```

다음과 같이 파이프라인을 구성하면 경고 로그가 다음과 같이 변경된다.

- builds/opop3966/optimize-maven/.m2/repository 경로에서 아티팩트를 정상적으로 찾는다.

```
...

[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  12.324 s
[INFO] Finished at: 2023-12-10T06:05:49Z
[INFO] ------------------------------------------------------------------------
Saving cache for successful job 00:03
Creating cache default-protected...
/builds/opop3966/optimize-maven/.m2/repository: found 2287 matching artifact files and directories
action-in-blog/target: found 14 matching artifact files and directories
Uploading cache.zip to https://storage.googleapis.com/gitlab-com-runners-cache/project/52921570/default-protected
Created cache
Cleaning up project directory and file based variables 00:00
Job succeeded
```

파이프라인 스크립트를 변경 후 애플리케이션 코드를 푸시하면 다음과 같이 파이프라인이 동작한다. 각 잡 별로 캐시 경로를 공유할 뿐만 아니라 매 파이프라인마다 다운로드 받던 의존성을 다시 받지 않는다는 점이다. 캐시가 파이프라인마다 공유된다.

- #1101629627 파이프라인
  - build-app 잡 12.324초 수행
  - test-app 잡 12.559초 수행
  - dpeloy-app 잡 6.150초 수행
- #1101631553 파이프라인
  - 캐시가 공유되기 때문에 의존성을 다운로드 받는 시간이 줄어든다.
  - build-app 잡 3.333초 수행
  - test-app 잡 9.513초 수행
  - dpeloy-app 잡 4.373초 수행

<div align="center">
  <img src="{{ site.image_url_2023 }}/optimize-gitlab-ci-pipeline-for-maven-project-02.png" width="80%" class="image__border">
</div>

#### REFERENCE

- <https://maven.apache.org/ref/3.6.3/maven-embedder/cli.html>
- <https://insight.infograb.net/blog/2023/02/27/gitlab-ci-cd-cache/>
- <https://workshop.infograb.io/gitlab-ci/23_add_test_stage_ci_pipeline/4_gitlab_ci_-optimization/>
- <https://stackoverflow.com/questions/25621601/what-does-the-maven-opts-environment-variable-do>
- <https://stackoverflow.com/questions/69582679/gitlab-ci-not-supported-outside-build-directory>

[gitlab-ci-cd-pipeline-for-on-premise-link]: https://junhyunny.github.io/information/dev-ops/gitlab-ci-cd-pipeline-for-on-premise/
