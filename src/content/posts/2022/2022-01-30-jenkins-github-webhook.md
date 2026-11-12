---
title: "젠킨스(Jenkins) GitHub Webhooks 연동"
publishedAt: "2022-01-30"
updatedAt: "2026-11-12T16:26:00+09:00"
canonicalPath: "/information/jenkins/github/jenkins-github-webhook/"
categories:
  - "information"
  - "jenkins"
  - "github"
summary: "GitHub 액세스 토큰과 젠킨스 Credentials를 만들고 개인 레포지토리 웹훅을 연결해 커밋 시 젠킨스 파이프라인이 동작하도록 설정하는 과정을 정리했다."
recommendedPosts:
  - title: "CI/CD란 무엇인가?"
    href: "https://junhyunny.github.io/information/what-is-ci-cd/"
  - title: "젠킨스(Jenkins) 설치"
    href: "https://junhyunny.github.io/information/jenkins/jenkins-install/"
  - title: "EC2 인스턴스에 도커 레지스트리(Docker registry) 설치"
    href: "https://junhyunny.github.io/information/docker/install-docker-registry-on-ec2/"
  - title: "비공개 도커 레지스트리(Private docker registry) 만들기"
    href: "https://junhyunny.github.io/information/docker/make-private-docker-registry-on-ec2/"
  - title: "젠킨스(Jenkins) 파이프라인을 통해 EC2 인스턴스에 서비스 배포"
    href: "https://junhyunny.github.io/information/jenkins/jenkins-deploy-ec2-using-docker/"
  - title: "젠킨스(Jenkins) 슬랙(Slack) 알림 메시지 전송"
    href: "https://junhyunny.github.io/information/jenkins/jenkins-slack-notification/"
---

## 0. 들어가면서

[젠킨스(Jenkins) 설치][jenkins-install-link] 글에선 젠킨스 설치 과정을 정리했다. 이번 글에선 CI/CD 파이프라인의 시작점인 GitHub 이벤트와 젠킨스를 연결하는 `GitHub Webhooks`를 정리했다. 이번 글에서 다루는 GitHub 웹훅의 작업 영역은 다음과 같다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-github-webhook-01.png" width="85%" class="image__border">
</div>

## 1. GitHub 액세스 토큰(access token) 생성

GitHub에 로그인하면 오른쪽 상단에 사용자 프로필 이미지가 보인다. 프로필 사진을 누르면 나타나는 `Settings`를 눌러 액세스 토큰을 만드는 화면까지 이동한다. 경로는 `Settings > Developer settings > Personal access tokens`이며, 화면에 보이는 `Generate new token` 버튼을 누른다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-github-webhook-02.png" width="100%" class="image__border">
</div>

토큰 생성 화면에서 만료 시간은 무제한으로 설정했다. 이 토큰으로 접근할 수 있는 스코프(scope)로는 `repo`, `admin:repo_hook`을 선택한다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-github-webhook-03.png" width="75%" class="image__border">
</div>

토큰이 생성되면 아래와 같은 화면을 볼 수 있다. 이 화면을 벗어나면 토큰을 다시 찾을 방법이 없어 새로 생성해야 하므로 **토큰을 잃어버리지 않도록 다른 곳에 저장한다.**

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-github-webhook-04.png" width="100%" class="image__border">
</div>

## 2. GitHub 개인 레포지토리 webhook 설정

GitHub 웹훅(webhook)을 이용하면 특정 이벤트를 감지해 CI/CD 파이프라인의 시작점으로 연결할 수 있다. 공개 레포지토리는 별도 액세스 토큰 없이 쉽게 연결되므로 이번 글에선 개인 레포지토리를 연결했다.

개인 레포지토리의 `Settings > Webhooks` 경로로 웹훅 등록 화면에 이동한 뒤 `Add webhook` 버튼을 클릭한다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-github-webhook-05.png" width="100%" class="image__border">
</div>

웹훅 추가 화면에서 다음 항목을 입력하고 `Add webhook` 버튼을 누른다.

- Payload URL - 젠킨스 서버 주소에 `/github-webhook/` 경로를 붙여 입력한다.
  - `http://locahost:8080`를 입력하면 정상적으로 동작하지 않는다.
  - `http://public-ip:8080`처럼 공개 IP를 사용해도 정상적으로 동작하지 않는다.
  - `ngrok` 애플리케이션으로 만든, 외부에서 접근할 수 있는 도메인을 사용한다.
- Content type - `application/json` 타입을 사용한다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-github-webhook-06.png" width="75%">
</div>

## 3. Credentials 만들기

많은 글에서 GitHub API Usage 등록, JDK 설정, Maven 설정 등을 수행하는데, 확인해 보니 `Credentials` 등록만으로도 GitHub 웹훅을 연동할 수 있다. 버전 차이일 수 있으니 다른 글들을 참고해도 좋다. 이제 `Credentials`를 등록해 보자.

젠킨스 메인 대시보드에서 `Manage Jenkins > Manage Credentials` 경로로 이동한다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-github-webhook-07.png" width="100%" class="image__border">
</div>

(global) 링크를 눌러 `Credentials` 등록 화면으로 이동한 뒤 `Add Credentials` 버튼을 누른다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-github-webhook-08.png" width="100%" class="image__border">
</div>

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-github-webhook-09.png" width="100%" class="image__border">
</div>

2021년 8월 13일부터 비밀번호를 사용한 인증이 불가능해졌으므로 이전 단계에서 만든 액세스 토큰을 사용한다. GitHub에 연결할 때 UserName과 Password로 만든 `Credential`만 사용할 수 있는 경우가 있으므로, 패스워드 영역에 GitHub 비밀번호가 아닌 액세스 토큰을 입력한다. 관련 이슈는 <https://github.com/jenkinsci/ghprb-plugin/issues/534>에서 볼 수 있다.

> remote: Support for password authentication was removed on August 13, 2021.
> Please use a personal access token instead.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-github-webhook-10.png" width="100%" class="image__border">
</div>

## 4. 젠킨스 파이프라인(pipeline) 프로젝트 생성

GitHub와 연결할 잡(Job)을 만들어 보자. 메인 대시보드 화면의 `Create a Job` 혹은 왼쪽 상단의 `New Item` 버튼을 누른다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-github-webhook-11.png" width="100%" class="image__border">
</div>

적절한 이름으로 파이프라인을 생성한다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-github-webhook-12.png" width="100%" class="image__border">
</div>

파이프라인 설정 화면에서 `GitHub project`, `GitHub hook trigger for GITScm polling` 체크 박스를 선택한다. 그리고 아래 스크립트(Declarative 방식)를 Pipeline 스크립트 영역에 붙여 넣는다. 스크립트에는 GitHub에서 내려받을 브랜치와 레포지토리 정보를 입력하고, 이전 단계에서 만든 github_access_token `Credential`을 추가한다.

```
pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'github_access_token',
                    url: 'https://github.com/Junhyunny/archived-jenkins-github-webhook.git'
            }
        }
    }
}
```

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-github-webhook-13.png" width="100%" class="image__border">
</div>

파이프라인을 생성했으면 `Build Now` 버튼을 눌러 최초 빌드를 실행한다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-github-webhook-14.png" width="100%" class="image__border">
</div>

빌드에 성공한 로그를 확인하면 다음과 같은 창을 볼 수 있다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-github-webhook-15.png" width="100%" class="image__border">
</div>

## 5. 젠킨스 Webhook 동작 확인

마지막으로 GitHub 웹훅이 잘 연결됐는지 확인한다. GitHub 개인 레포지토리에 커밋(commit)을 만들고 젠킨스 서버에서 빌드가 정상적으로 수행되는지 확인한다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-github-webhook-16.gif" width="100%" class="image__border">
</div>

## CLOSING

맥북에 설치한 젠킨스 서버에서 GitHub 연결을 시도하면 다음과 같은 에러를 만날 수 있다.

```
Caused by: hudson.plugins.git.GitException: Command "git init /Users/junhyunk/.jenkins/workspace/test" returned status code 1:
stdout: 
stderr: xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools), missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun

    at org.jenkinsci.plugins.gitclient.CliGitAPIImpl.launchCommandIn(CliGitAPIImpl.java:2671)
    at org.jenkinsci.plugins.gitclient.CliGitAPIImpl.launchCommandIn(CliGitAPIImpl.java:2601)
```

`Xcode Command Line Tools` 이슈이며, 아래 명령어로 해결할 수 있다.

```
$ xcode-select --install
```

파이프라인 스크립트를 작성하는 방법에는 Scripted 방식과 Declarative 방식 두 가지가 있으며, 둘을 혼동하지 않도록 조심하기 바란다. Scripted 방식은 `node` 블록으로 감싸져 있다.

```
node {
    stage('Build') {

    }
    stage('Test') {
        
    }
    stage('Deploy') {
        
    }
}
```

Declarative 방식은 `pipeline` 블록으로 감싸져 있다.

```
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {

            }
        }
        stage('Test') {
            steps {
                
            }
        }
        stage('Deploy') {
            steps {
                
            }
        }
    }
}
```

#### REFERENCE

- <https://jojoldu.tistory.com/139?category=777282>
- <https://sssunho.tistory.com/64>

[jenkins-install-link]: https://junhyunny.github.io/information/jenkins/jenkins-install/
