---
title: "젠킨스(Jenkins) 설치" 
search: false
category:
  - information
  - jenkins
last_modified_at: 2022-01-29T23:55:00
---

<br>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [CI/CD란 무엇인가?][what-is-ci-cd-link]

👉 이어서 읽기를 추천합니다.
- [젠킨스(Jenkins) Github Webhooks 연동][jenkins-github-webhook-link]
- [도커 레지스트리(Docker registry) 설치 on EC2 인스턴스][install-docker-registry-on-ec2-link]

## 0. 들어가면서

`Extream Programming(XP)` 책을 보면 지속적인 통합(CI, Continuous Integration), 지속적인 전달(CD, Continuous Delivery) 그리고 테스트 주도 개발(TDD, Test Driven Development)를 강조합니다. 
개발 과정에서 이터레이션(iteration)마다 쌓이는 테스트들과 기능들을 개발자들이 일일이 `통합 > 빌드 > 테스트 > 배포`한다면 개발자들의 피로도가 높아지게 됩니다. 
시간을 절약하고, 개발자의 피로도를 낮추기 위해선 CI/CD 파이프라인 구축이 필요합니다. 

마침 지난번 프로젝트에서 CI/CD 환경이 필요하다는 피드백을 받은 팀원이 이번 프로젝트에서 우선 구축해보자는 제의를 하였습니다. 
좋은 의견이었기에 여러가지 아이디어들을 주고 받다가 많은 곳에서 사랑받는 젠킨스(Jenkins)를 사용하기로 했습니다. 
CI/CD 환경 구축을 위한 몇 가지 작업들을 주제로 포스트를 작성할 예정입니다. 
첫 주제로 젠킨스 설치 방법에 대해 정리하였습니다. 

## 1. 개발 및 테스트 환경

여러가지 이유로 개발을 위한 CI/CD 구축에 어려움을 겪었습니다. 
특히 젠킨스를 올릴 호스팅(hosting) 서버가 없었는데, 다행히 회사에 남는 맥북을 지원받았습니다. 
처음엔 도커 이미지로 젠킨스를 설치하였지만, 맥북 자원을 모두 사용하는 편이 좋겠다는 판단하여 로컬에 설치하였습니다. 
개발용 CI/CD 환경은 다음과 같습니다. 

##### 개발용 CI/CD 환경
- 젠킨스 서버는 `ngrok`을 사용하여 로컬 서버를 외부 인터넷으로 노출하였습니다.
- 테스트를 위한 어플리케이션은 `AWS 프리티어(freetier) EC2`에 배포하였습니다.

<p align="center"><img src="/images/jenkins-install-1.JPG" width="85%" style="border: 1px solid #ccc; border-radius: 10px;"></p>

## 2. 젠킨스 설치 및 실행

### 2.1. 젠킨스 설치

맥에서는 `brew` 명령어를 이용하면 쉽게 설치할 수 있습니다. 
아래와 같은 설치 명령어를 실행합니다. 

```
% brew install jenkins
```

##### 설치 로그

```
Running `brew update --preinstall`...
==> Auto-updated Homebrew!
Updated 2 taps (homebrew/core and homebrew/cask).
==> New Formulae
ascii2binary               atlas                      weggli
==> Updated Formulae
Updated 148 formulae.

...

==> Summary
🍺  /usr/local/Cellar/jenkins/2.332: 8 files, 73.8MB
==> Running `brew cleanup jenkins`...
Disable this behaviour by setting HOMEBREW_NO_INSTALL_CLEANUP.
Hide these hints with HOMEBREW_NO_ENV_HINTS (see `man brew`).
==> Caveats
==> jenkins
Note: When using launchctl the port will be 8080.

To restart jenkins after an upgrade:
  brew services restart jenkins
Or, if you don't want/need a background service you can just run:
  /usr/local/opt/openjdk@11/bin/java -Dmail.smtp.starttls.enable=true -jar /usr/local/opt/jenkins/libexec/jenkins.war --httpListenAddress=127.0.0.1 --httpPort=8080
```

### 2.2. 젠킨스 실행, 종료 및 재시작

##### 젠킨스 실행 명령어

```
$ brew services start jenkins
```

##### 젠킨스 종료 명령어

```
$ brew services stop jenkins
```

##### 젠킨스 재실행 명령어

```
$ brew services restart jenkins
```

### 2.3. 젠킨스 대시보드 접속 및 초기화

브라우저를 통해 `http://localhost:8080` 접속시 다음과 같은 화면을 확인할 수 있습니다.

##### 젠킨스 준비 화면

<p align="center"><img src="/images/jenkins-install-2.JPG" width="80%" style="border: 1px solid #ccc; border-radius: 10px;"></p>

##### 젠킨스 초기 비밀번호 찾기
- `/Users/junhyunk/.jenkins/secrets/initialAdminPassword` 파일에 초기 비밀번호가 있다고 안내해줍니다.
- 설치하는 사용자마다 경로가 다르니 본인 화면에서 보이는 경로를 확인합니다.
- 아래 명령어를 통해 얻은 비밀번호로 로그인을 시도합니다.

```
$ cat /Users/junhyunk/.jenkins/secrets/initialAdminPassword
```

<p align="center"><img src="/images/jenkins-install-3.JPG" width="80%"></p>

##### 젠킨스 플러그인(plugin) 설치
- 추천 플러그인들을 설치하였습니다.

<p align="center"><img src="/images/jenkins-install-4.JPG" width="80%"></p>

##### 젠킨스 관리자 설정 초기화
- 관리자 정보를 초기화합니다.
- 이 과정 이후 절차가 있었지만, 별도 수정 사항은 없이 확인을 눌러 진행하였습니다.

<p align="center"><img src="/images/jenkins-install-5.JPG" width="80%"></p>

##### 젠킨스 대시보드
- 모든 설정을 마치면 다음과 같은 화면을 볼 수 있습니다.

<p align="center"><img src="/images/jenkins-install-6.JPG" width="100%" style="border: 1px solid #ccc; border-radius: 10px;"></p>

## 3. ngrok 터널링(tunneling)

로컬 호스트에서만 젠킨스 대시보드를 확인하는 것이 아니라 외부에서도 확인이 필요하여 `ngrok`을 사용하였습니다.
`ngrok`은 외부에서 인터넷을 통해 로컬 서비스로 접근할 수 있도록 터널링(tunneling)을 수행하는 어플리케이션입니다. 

> ngrok allows you to expose a web server running on your local machine to the internet. 
> Just tell ngrok what port your web server is listening on. 

### 3.1. ngrok 설치

```
$ brew install --cask ngrok
```

### 3.2. ngrok 터널링
외부에서 8080 포트로 접근시 `localhost:8080` 서버로 연결합니다. 
아래 명령어를 수행하여 외부와 연결을 수행합니다.

```
$ ngrok http 8080
```

##### ngrok 터널링
- 2시간 동안 세션이 유효합니다.
- 로그인하여 토큰을 발급받아 인증시 세션 만료가 없습니다. 
- `Free Plan`인 경우 ngrok 클라이언트를 동시에 1개만 사용할 수 있습니다.

<p align="left"><img src="/images/jenkins-install-7.JPG" width="75%"></p>

##### ngrok 도메인 접속
- `ngrok`이 만든 도메인으로 접근시 젠킨스 화면을 볼 수 있습니다. 

<p align="center"><img src="/images/jenkins-install-8.JPG" width="100%" style="border: 1px solid #ccc; border-radius: 10px;"></p>

#### REFERENCE
- <https://wan-blog.tistory.com/74>
- <https://blog.outsider.ne.kr/1159>

[what-is-ci-cd-link]: https://junhyunny.github.io/information/what-is-ci-cd/

[jenkins-github-webhook-link]: https://junhyunny.github.io/information/jenkins/github/jenkins-github-webhook/
[install-docker-registry-on-ec2-link]: https://junhyunny.github.io/information/docker/install-docker-registry-on-ec2/