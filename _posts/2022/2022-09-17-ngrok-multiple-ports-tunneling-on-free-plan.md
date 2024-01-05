---
title: "Ngrok Multiple Tunneling on Free Plan"
search: false
category:
  - information
last_modified_at: 2022-09-17T23:55:00
---

<br/>

## 1. ngrok

[Install Jenkins][jenkins-install-link] 포스트에서 소개했던 도구입니다. 
`ngrok`을 사용하면 터널링을 통해 로컬 컴퓨터에 구성한 어플리케이션을 인터넷에 노출할 수 있습니다. 
무료 플랜(Free Plan)을 사용하는 경우 외부에 노출시킬 수 있는 포트(port) 수가 1개로 제한되지만, `ngrok.yml` 파일을 사용하면 포트 여러 개를 동시에 노출할 수 있습니다. 

## 2. Multiple Ports Tunneling

MacOS 환경에서 설치와 터널링을 진행하였습니다. 
 
### 2.1. ngrok 설치

`brew` 명령어를 통해 쉽게 설치가 가능합니다.

```
$ brew install --cask ngrok
```

### 2.2. 세션 만료 없애기

ngrok 터널링은 기본적으로 2시간 세션이 유효합니다. 
세션 만료 시간을 없애려면 [ngrok](https://ngrok.com/) 사이트에 로그인하여 `authtoken`을 받아 등록합니다. 

##### authtoken 설정

<p align="center">
    <img src="/images/ngrok-multiple-ports-tunneling-on-free-plan-1.JPG" width="100%" class="image__border">
</p>

### 2.3. ngrok.yml 파일 수정

`/Users/${userName}/.ngrok2` 이동하면 `ngrok.yml` 파일을 확인할 수 있습니다. 
해당 파일을 다음과 같이 수정합니다. 

* 8080 포트를 점유하고 있는 젠킨스 어플리케이션을 터널링합니다.
* 3000 포트를 점유하고 있는 리액트 어플리케이션을 터널링합니다.

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

다음 명령어를 통해 터널링을 실행합니다. 

```
$ ngrok start --all
```

##### 실행 결과

<p align="center">
    <img src="/images/ngrok-multiple-ports-tunneling-on-free-plan-2.gif" width="100%" class="image__border">
</p>

#### REFERENCE

* <https://www.lesstif.com/software-architect/ngrok-39126236.html>
* <https://stackoverflow.com/questions/72490971/ngrok-invalid-host-header>
* <https://stackoverflow.com/questions/25522360/ngrok-configure-multiple-port-in-same-domain>
* <https://gist.github.com/sudomaze/b3c2b32663be66184c1f252b8e2c31f6>

[jenkins-install-link]: https://junhyunny.github.io/information/jenkins/jenkins-install/