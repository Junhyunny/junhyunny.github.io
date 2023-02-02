---
title: "Using Jenkinsfile in Pipeline"
search: false
category:
  - information
  - jenkins
last_modified_at: 2022-09-17T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [젠킨스(Jenkins) 설치][jenkins-install-link]
* [젠킨스(Jenkins) GitHub Webhooks 연동][jenkins-github-webhook-link]

## 1. Jenkinsfile

`Jenkinsfile`을 사용하면 젠킨스(jenkins)의 파이프라인을 파일로 관리할 수 있습니다. 
파일로 파이프라인을 관리하면 다음과 같은 장점을 얻을 수 있습니다. 

* `Git` 같은 형상 관리 도구를 통해 변경 이력 관리가 가능하다.
* 코드 리뷰가 가능하다.

이번 포스트에서는 `GitHub` 원격 저장소에 저장된 `Jenkinsfile`을 사용하여 파이프라인을 제어하는 방법을 정리하였습니다. 
[젠킨스(Jenkins) GitHub Webhooks 연동][jenkins-github-webhook-link] 포스트처럼 `GitHub`의 웹 훅 기능을 통해 파이프라인을 실행시켰습니다.

## 2. Jenkins 파일 만들기

다음과 같이 단순하게 스테이지 별로 로그를 출력 `Jenkinsfile`을 만듭니다. 
해당 파일은 저장소 루트 경로에 위치시킵니다. 

```
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                echo 'Building..'
            }
        }
        stage('Test') {
            steps {
                echo 'Testing..'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying....'
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
    <img src="/images/using-jenkinsfile-in-pipeline-1.JPG" width="80%" class="image__border">
</p>

## 4. Trigger Pipeline by Web Hook

원격 저장소에 변경 이력을 만들면 웹 훅을 통해 파이프라인이 실행됩니다. 
`Jenkinsfile`에 정의한대로 파이프라인이 실행되는지 확인합니다. 

##### 파이프라인 동작

<p align="center">
    <img src="/images/using-jenkinsfile-in-pipeline-2.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/jenkins-pipeline-test>

#### RECOMMEND NEXT POSTS

* [Parallel Tests in Jenkins Pipeline][parallel-tests-in-jenkins-pipeline-link]

#### REFERENCE

* <https://www.jenkins.io/doc/book/pipeline/jenkinsfile/>

[jenkins-install-link]: https://junhyunny.github.io/information/jenkins/jenkins-install/
[jenkins-github-webhook-link]: https://junhyunny.github.io/information/jenkins/github/jenkins-github-webhook/

[parallel-tests-in-jenkins-pipeline-link]: https://junhyunny.github.io/information/jenkins/parallel-tests-in-jenkins-pipeline/