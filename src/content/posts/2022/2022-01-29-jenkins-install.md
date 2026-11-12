---
title: "젠킨스(Jenkins) 설치"
publishedAt: "2022-01-29"
updatedAt: "2026-03-24T08:03:14+09:00"
canonicalPath: "/information/jenkins/jenkins-install/"
categories:
  - "information"
  - "jenkins"
summary: "CI/CD 파이프라인 구축을 위해 맥북에 젠킨스를 설치하고 초기 설정한 뒤, ngrok 터널링으로 외부에서 대시보드에 접속하는 과정을 정리했다."
recommendedPosts:
  - title: "CI/CD란 무엇인가?"
    href: "https://junhyunny.github.io/information/what-is-ci-cd/"
  - title: "젠킨스(Jenkins) GitHub Webhooks 연동"
    href: "https://junhyunny.github.io/information/jenkins/github/jenkins-github-webhook/"
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

`Extream Programming(XP)` 책을 보면 지속적인 통합(CI, Continuous Integration), 지속적인 전달(CD, Continuous Delivery) 그리고 테스트 주도 개발(TDD, Test Driven Development)을 강조한다.

개발 과정에서 이터레이션(iteration)마다 쌓이는 테스트들과 기능들을 개발자들이 일일이 `통합 > 빌드 > 테스트 > 배포`한다면 개발자들의 피로도가 높아지게 된다. 시간을 절약하고, 개발자의 피로도를 낮추기 위해선 CI/CD 파이프라인 구축이 필요하다.

마침 지난번 프로젝트에서 CI/CD 환경이 필요하다는 피드백을 받은 팀원이 이번 프로젝트에서 우선 구축해보자는 제의를 했다. 좋은 의견이었기에 여러 가지 아이디어들을 주고 받다가 많은 곳에서 사랑받는 젠킨스(Jenkins)를 사용하기로 했다. CI/CD 환경 구축을 위한 몇 가지 작업들을 주제로 포스트를 작성할 예정이다. 첫 주제로 젠킨스 설치 방법에 대해 정리했다.

## 1. 개발 및 테스트 환경

여러 가지 이유로 개발을 위한 CI/CD 구축에 어려움을 겪었다. 특히 젠킨스를 올릴 호스팅(hosting) 서버가 없었는데, 다행히 회사에 남는 맥북을 지원받았다. 처음엔 도커 이미지로 젠킨스를 설치했지만, 맥북 자원을 모두 사용하는 편이 좋겠다는 판단하여 로컬에 설치했다. 개발용 CI/CD 환경은 다음과 같다.

- 젠킨스 서버는 `ngrok`을 사용하여 로컬 서버를 외부 인터넷으로 노출했다.
- 테스트를 위한 애플리케이션은 `AWS 프리티어(freetier) EC2`에 배포했다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-install-01.png" width="85%" class="image__border">
</div>

## 2. 젠킨스 설치 및 실행

맥에서 젠킨스 설치는 `brew` 명령어를 이용하면 쉽게 설치할 수 있다. 아래와 같은 설치 명령어를 실행한다.

```
$ brew install jenkins
```

다음 명령어를 통해 젠킨스를 실행한다.

```
$ brew services start jenkins
```

다음 명령어를 통해 젠킨스를 종료시킬 수 있다.

```
$ brew services stop jenkins
```

다음 명령어를 통해 젠킨스를 재실행 할 수 있다.

```
$ brew services restart jenkins
```

브라우저를 통해 `http://localhost:8080` 접속하면 젠킨스 대시보드 접속할 수 있다.

<!-- PROMPT("이미지 블록 필요") -->
<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-install-02.png" width="100%" class="image__border">
</div>

처음 대시보드에 들어오면 비밀번호를 설정해야 한다. 화면을 보면 `/Users/junhyunk/.jenkins/secrets/initialAdminPassword` 파일에 초기 비밀번호가 있다고 안내해준다. 설치하는 사용자마다 경로가 다르니 본인 화면에서 보이는 경로를 확인한다.

<!-- PROMPT("이미지 블록 필요") -->
<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-install-03.png" width="100%">
</div>

아래 명령어를 통해 얻은 비밀번호로 로그인을 시도한다.

```
$ cat /Users/junhyunk/.jenkins/secrets/initialAdminPassword
```

젠킨스의 추천 플러그인(plugin)을 설치했다.

<!-- PROMPT("이미지 블록 필요") -->
<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-install-04.png" width="100%">
</div>

젠킨스 관리자 정보를 초기화한다. 이 과정 이후 절차가 있었지만, 별도 수정 없이 디폴트 값들을 사용했다.

<!-- PROMPT("이미지 블록 필요") -->
<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-install-05.png" width="100%">
</div>

모든 설정을 마치면 다음과 젠킨스 대시보드 화면을 볼 수 있다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-install-06.png" width="100%" class="image__border">
</div>

## 3. ngrok 터널링(tunneling)

로컬 호스트에서만 젠킨스 대시보드를 확인하는 것이 아니라 외부에서도 확인이 필요하여 `ngrok`을 사용했다. `ngrok`은 외부에서 인터넷을 통해 로컬 서비스로 접근할 수 있도록 터널링(tunneling)을 수행하는 애플리케이션이다.

> ngrok allows you to expose a web server running on your local machine to the internet. 
> Just tell ngrok what port your web server is listening on. 

마찬가지로 brew 명령어를 통해 ngrok을 설치할 수 있다.

```
$ brew install --cask ngrok
```

외부에서 8080 포트로 접근시 `localhost:8080` 서버로 연결한다. 아래 명령어를 수행하여 외부와 연결을 수행한다.

```
$ ngrok http 8080
```

ngrok 터널링은 2시간 동안 세션이 유효하다. 로그인하여 토큰을 발급 받아 인증하면 세션 만료가 시간이 없다. `Free Plan`인 경우 ngrok 클라이언트를 동시에 1개만 사용할 수 있다.

<!-- PROMPT("이미지 블록 필요") -->
<div align="left">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-install-07.png" width="75%">
</div>

ngrok이 만든 도메인으로 접근하면 사전에 구축한 젠킨스 대시보드 화면을 볼 수 있다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/jenkins-install-08.png" width="100%" class="image__border">
</div>

#### REFERENCE

- <https://wan-blog.tistory.com/74>
- <https://blog.outsider.ne.kr/1159>
