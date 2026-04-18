---
title: "Ngrok 무료 플랜에서 여러 포트 터널링하기"
search: false
category:
  - information
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

## 1. ngrok

[젠킨스(Jenkins) 설치][jenkins-install-link] 포스트에서 소개했던 도구다. `ngrok`을 사용하면 터널링을 통해 로컬 컴퓨터에 구성한 애플리케이션을 인터넷에 노출할 수 있다. 무료 플랜(Free Plan)을 사용하는 경우 외부에 노출시킬 수 있는 포트(port) 수가 1개로 제한되지만, `ngrok.yml` 파일을 사용하면 포트 여러 개를 동시에 노출할 수 있다.

## 2. Multiple Ports Tunneling

MacOS 환경에서 설치와 터널링을 진행하였다.

### 2.1. ngrok 설치

`brew` 명령어를 통해 쉽게 설치가 가능하다.

```
$ brew install --cask ngrok
```

### 2.2. 세션 만료 없애기

ngrok 터널링은 기본적으로 2시간 세션이 유효하다. 세션 만료 시간을 없애려면 [ngrok](https://ngrok.com/) 사이트에 로그인하여 `authtoken`을 받아 등록한다.

##### authtoken 설정

<div align="center">
  <img src="{{ site.image_url_2022 }}/ngrok-multiple-ports-tunneling-on-free-plan-01.png" width="100%" class="image__border">
</div>

### 2.3. ngrok.yml 파일 수정

`/Users/${userName}/.ngrok2` 이동하면 `ngrok.yml` 파일을 확인할 수 있다. 해당 파일을 다음과 같이 수정한다.

- 8080 포트를 점유하고 있는 젠킨스 애플리케이션을 터널링한다.
- 3000 포트를 점유하고 있는 리액트 애플리케이션을 터널링한다.

```yml
authtoken: ${PERSONAL_AUTH_TOKEN}
tunnels:
  jenkins:
    proto: http
    addr: 8080
    bind_tls: true
  frontend:
    proto: http
    addr: 3000
    bind_tls: true
    host_header: "localhost:3000"
```

### 2.4. ngrok 터널링 실행

다음 명령어를 통해 터널링을 실행한다.

```
$ ngrok start --all
```

##### 실행 결과

<div align="center">
  <img src="{{ site.image_url_2022 }}/ngrok-multiple-ports-tunneling-on-free-plan-02.gif" width="100%" class="image__border">
</div>

#### REFERENCE

- <https://www.lesstif.com/software-architect/ngrok-39126236.html>
- <https://stackoverflow.com/questions/72490971/ngrok-invalid-host-header>
- <https://stackoverflow.com/questions/25522360/ngrok-configure-multiple-port-in-same-domain>
- <https://gist.github.com/sudomaze/b3c2b32663be66184c1f252b8e2c31f6>

[jenkins-install-link]: https://junhyunny.github.io/information/jenkins/jenkins-install/
