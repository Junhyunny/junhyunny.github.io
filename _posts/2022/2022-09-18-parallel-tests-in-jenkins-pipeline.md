---
title: "Parallel Tests in Jenkins Pipeline"
search: false
category:
  - information
  - jenkins
last_modified_at: 2022-09-18T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Install Jenkins][jenkins-install-link]
* [젠킨스(Jenkins) GitHub Webhooks 연동][jenkins-github-webhook-link]
* [Using Jenkinsfile in Pipeline][using-jenkinsfile-in-pipeline-link]

## 0. 들어가면서

젠킨스(jenkins) 파이프라인은 필요하다면 병렬로 처리할 수 있습니다. 
프론트엔드, 백엔드 서비스 코드를 모두 가진 하나의 프로젝트를 가지고 파이프라인 병렬 처리 방법을 알아보겠습니다. 

## 1. 프로젝트 구조

코드는 중요하지 않으니 프로젝트 구조만 살펴보겠습니다. 

* backend 폴더는 Spring Boot 프로젝트입니다.
    * BackendApplicationTests 클래스는 단위 테스트를 수행합니다.
    * BackendApplicationIT 클래스는 결합 테스트를 수행합니다.
* frontend 폴더는 React 프로젝트입니다.
    * App.test.js 파일은 단위 테스트를 수행합니다.
* docker-compose.yml 파일을 통해 프론트엔드, 백엔드 서비스를 로컬에 배포합니다. 
* Jenkinsfile 파일에 작성된 `Declarative` 방식의 스크립트를 통해 젠킨스 파이프라인을 제어합니다.

```
├── Jenkinsfile
├── README.md
├── backend
│   ├── Dockerfile
│   ├── HELP.md
│   ├── action-in-blog.iml
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── pom.xml
│   └── src
│       ├── main
│       │   ├── java
│       │   │   └── action
│       │   │       └── in
│       │   │           └── blog
│       │   │               └── BackendApplication.java
│       │   └── resources
│       │       ├── application.properties
│       │       ├── static
│       │       └── templates
│       └── test
│           └── java
│               └── action
│                   └── in
│                       └── blog
│                           ├── BackendApplicationIT.java
│                           └── BackendApplicationTests.java
├── docker-compose.yml
└── frontend
    ├── Dockerfile
    ├── README.md
    ├── conf
    │   └── nginx.conf
    ├── package-lock.json
    ├── package.json
    ├── public
    │   ├── favicon.ico
    │   ├── index.html
    │   ├── logo192.png
    │   ├── logo512.png
    │   ├── manifest.json
    │   └── robots.txt
    └── src
        ├── App.css
        ├── App.js
        ├── App.test.js
        ├── index.css
        ├── index.js
        ├── logo.svg
        ├── reportWebVitals.js
        └── setupTests.js
```

## 2. Jenkinsfile 작성하기

각 스테이지(stage) 별로 동작하는 모습을 살펴보겠습니다.

* `tests` 스테이지
    * `parallel` 블럭을 사용하여 백엔드, 프론트엔드 테스트를 병렬로 수행합니다.
    * `dir` 블럭을 사용하여 특정 경로에서 명령어를 실행합니다.
    * `backend test` 스테이지에서 백엔드 프로젝트의 단위, 결합 테스트를 수행합니다.
    * `frontend test` 스테이지에서 프론트엔드 단위 테스트를 수행합니다.
* `build` 스테이지
    * 도커 컴포즈(compose)를 사용하여 실행 중인 서비스가 있다면 종료하고, 새로운 이미지를 빌드합니다.
* `deploy` 스테이지
    * 도커 컴포즈를 사용하여 백엔드, 프론트엔드 서비스를 백그라운드에서 실행합니다.

```
pipeline {
    agent any
    stages {
        stage('tests') {
            parallel {
                stage('backend test') {
                    steps {
                        dir('backend') {
                            sh 'mvn verify'
                        }
                    }
                }
                stage('frontend test') {
                    steps {
                        dir('frontend') {
                            sh 'npm install && npm test'
                        }
                    }
                }
            }
        }
        stage('build') {
            steps {
                sh 'docker-compose down && docker-compose build'
            }
        }
        stage('deploy') {
            steps {
                sh 'docker-compose up -d'
            }
        }
    }
}
```

## 3. Jenkins Pipeline 설정 변경

GitHub 웹 훅(web hook)이 연결된 젠킨스 파이프라인 잡(job) 하나를 만들고 `Jenkinsfile`을 등록합니다. 
GitHub 웹 훅이 연결된 젠킨스 파이프라인 만드는 방법은 [젠킨스(Jenkins) GitHub Webhooks 연동][jenkins-github-webhook-link] 포스트를 참고하시기 바랍니다. 

다음과 같이 파이프라인 설정을 변경합니다.

* Definition - Pipeline script from SCM
* SCM - Git 
* Repository URL - 웹 훅이 등록된 원격 저장소 주소
* Credentials(optional) - 저장소에서 소스 코드를 받을 때 필요한 인증키
* Branch Specifier - 원격 저장소에서 사용하는 특정 브랜치
* Script Path - `Jenkinsfile`이 위치한 경로와 파일명
    * 프로젝트 루트 경로에 위치하였기 때문에 파일명만 추가합니다.

<p align="left">
    <img src="/images/parallel-tests-in-jenkins-pipeline-1.JPG" width="80%" class="image__border">
</p>

## 4. Trigger Pipeline by Web Hook

원격 저장소에 변경 이력을 만들면 웹 훅을 통해 파이프라인이 실행됩니다. 
`Jenkinsfile`에 정의한대로 파이프라인이 실행되는지 확인합니다. 
`Pipeline Graph View` 플러그인을 설치하면 병렬로 실행됬는지 여부를 확인할 수 있습니다. 

##### 파이프라인 동작

<p align="center">
    <img src="/images/parallel-tests-in-jenkins-pipeline-2.gif" width="100%" class="image__border">
</p>

#### Pipeline Graph View 플러그인으로 확인한 실행 결과

<p align="center">
    <img src="/images/parallel-tests-in-jenkins-pipeline-3.JPG" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/jenkins-pipeline-test>

#### REFERENCE

* <https://www.jenkins.io/blog/2017/09/25/declarative-1/>
* <https://plugins.jenkins.io/pipeline-graph-view/>

[jenkins-install-link]: https://junhyunny.github.io/information/jenkins/jenkins-install/
[jenkins-github-webhook-link]: https://junhyunny.github.io/information/jenkins/github/jenkins-github-webhook/
[using-jenkinsfile-in-pipeline-link]: https://junhyunny.github.io/information/jenkins/using-jenkinsfile-in-pipeline/