---
title: "Jenkins SSH 에이전트 플러그인"
publishedAt: "2023-01-22"
updatedAt: "2026-11-12T16:17:28+09:00"
canonicalPath: "/information/jenkins/ssh-agent-plugin-in-jenkins/"
categories:
  - "information"
  - "jenkins"
summary: "젠킨스와 쿠버네티스 클러스터가 분리된 환경에서 SSH 키를 등록하고 SSH 에이전트 플러그인으로 마스터 노드에 직접 명령어를 전달하는 방법을 정리했다."
recommendedPosts:
  - title: "방화벽(firewall)"
    href: "https://junhyunny.github.io/information/firewall/"
  - title: "Open Firewall of Linux"
    href: "https://junhyunny.github.io/information/open-firewall-of-linux/"
  - title: "ssh-copy-id 명령어 - 패스워드 없는 SSH 연결"
    href: "https://junhyunny.github.io/information/ssh-copy-id-for-easy-connection/"
---

## 0. 들어가면서

CI/CD 파이프라인을 담당하는 젠킨스(jenkins)가 있는 클러스터와 서비스를 배포할 쿠버네티스 클러스터가 서로 달라 배포에 어려움이 있었다. 마스터 노드를 담당하는 가상 머신(virtual machine)에 명령어(command)를 직접 전달할 방법이 필요했다. 젠킨스의 SSH 에이전트(secure shell agent) 플러그인을 사용하면 명령어를 직접 전달할 수 있는데, 이 글에서는 그 방법을 정리했다.

## 1. Context of Practice

실습 환경으로 Windows 운영체제를 사용하는 호스트(host) PC 위에 가상 머신(virtual machine) 두 대를 실행했다. 가상 머신의 운영체제는 Ubuntu 22.04.1이며, 각 가상 머신의 IP는 다음과 같다.

- Jenkins VM IP - 192.168.78.131
- Master VM IP - 192.168.78.133

실습은 다음 순서로 진행한다.

1. `Jenkins VM`에서 공개 키와 비밀 키를 생성한다.
2. 공개 키를 `Master VM`에 등록해 비밀 키로 접속할 때 재인증하지 않도록 한다.
3. 비밀 키를 젠킨스 시크릿으로 등록한다.
4. 젠킨스 SSH 에이전트를 사용해 셸(shell) 명령어를 실행한다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/ssh-agent-plugin-in-jenkins-01.png" width="100%" class="image__border">
</div>

## 2. Generate Public/Private Key on Jenkins VM

이 작업은 `Jenkins VM`에서 수행한다. `ssh-keygen` 명령어로 공개 키와 비밀 키를 생성한다. 별도 옵션을 주지 않으면 `~/.ssh` 경로에 키가 생성된다.

```
$ ssh-keygen
Generating public/private rsa key pair.
Enter file in which to save the key (/home/jenkins/.ssh/id_rsa):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /home/jenkins/.ssh/id_rsa
Your public key has been saved in /home/jenkins/.ssh/id_rsa.pub
The key fingerprint is:
SHA256:Avt/Z5kJbzvKzwRxcZPdl6IGIYpTgXOavyCrwytoD/s jenkins@jenkins-virtual-machine
The key's randomart image is:
+---[RSA 3072]----+
|    .o.. .. . ooo|
|   oo.. ..   +.o+|
|   o*.    o o . .|
|   o.o     =     |
|    o . S o      |
| . . o .  ..     |
|o.o . o    o.+   |
|++o  . . ..oX    |
|=++E    ..o*+o   |
+----[SHA256]-----+
```

## 3. Copy SSH Key on Jenkins VM

이 작업도 `Jenkins VM`에서 수행한다. 이전 단계에서 만든 공개 키를 `Master VM`에 복사한다. 이 단계에서는 비밀번호를 한 번 입력해야 하지만, 이후에는 비밀 키로 접근할 때 비밀번호를 입력하지 않아도 된다.

```
$ ssh-copy-id -i ~/.ssh/id_rsa.pub master@192.168.78.133
/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/home/jenkins/.ssh/id_rsa.pub"
The authenticity of host '192.168.78.133 (192.168.78.133)' can't be established.
ED25519 key fingerprint is SHA256:TyujxQv+fBzfcekVqBbEGniYS2WY3sAvr5dqwbUFCs4.
This key is not known by any other names
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
master@192.168.78.133's password:

Number of key(s) added: 1

Now try logging into the machine, with:   "ssh 'master@192.168.78.133'"
and check to make sure that only the key(s) you wanted were added.
```

## 4. Register Private SSH Key on Jenkins VM

젠킨스에 비밀 키를 등록한다. 먼저 메인 화면에서 `Manage Jenkins`를 누르고, 이어지는 화면에서 `Manage Credentials` 버튼을 눌러 새 크레덴셜을 등록한다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/ssh-agent-plugin-in-jenkins-02.png" width="100%" class="image__border">
</div>

`Credentials` 화면에서 `global` 링크를 누른다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/ssh-agent-plugin-in-jenkins-03.png" width="100%" class="image__border">
</div>

`Global credentials` 화면에서 `Add Credentials` 버튼을 눌러 비밀 키를 등록한다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/ssh-agent-plugin-in-jenkins-04.png" width="100%" class="image__border">
</div>

`New credentials` 화면에서는 다음과 같이 입력한다.

- 비밀 키 타입은 `SSH Username with private key`를 선택한다.
- ID를 지정한다.
  - `SSH-Agent-Key` - 해당 비밀 키를 식별하기 쉬운 ID
- SSH 로그인에 필요한 사용자 이름을 등록한다.
  - `master` - 해당 호스트에 접근하기 위한 사용자 이름
- 이전 단계에서 만든 비밀 키를 직접 입력한다.
  - `cat .ssh/id_rsa` 명령어 실행 결과

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/ssh-agent-plugin-in-jenkins-05.png" width="100%" class="image__border">
</div>

비밀 키는 홈(home) 경로 아래 `.ssh` 경로에 만들어진다. `.pub` 확장자가 없는 파일이 비밀 키이며, 다음 명령어로 내용을 확인할 수 있다.

```
$ cat .ssh/id_rsa
```

## 5. Jenkins Pipeline with SSH Agent

### 5.1. Install SSH Agent Plugin

사용 가능한 플러그인에서 `SSH Agent`를 검색해 플러그인을 설치한다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/ssh-agent-plugin-in-jenkins-06.png" width="100%" class="image__border">
</div>

### 5.2. Run Jenkins Pipeline

실습용 프로젝트를 만들고 아래 파이프라인 스크립트(script)를 실행한다. 별다른 설정 없이 이 스크립트를 실행하는 것만으로 SSH 명령어가 정상적으로 실행된다. 스크립트 내용은 다음과 같다.

- 대상 호스트는 `master@192.168.78.133`이다.
- 이전 단계에서 생성한 `SSH-Agent-Key` 크레덴셜을 사용한다.
- `ssh` 명령어로 원격 호스트에서 커맨드를 실행한다.
  - pwd - 셸이 실행되는 디렉터리 위치를 확인한다.
  - mkdir workspace - 해당 위치에 workspace 디렉터리를 생성한다.

```
pipeline {
    agent any
    stages {
        stage('SSH Agent Command') {
            steps {
                sshagent (credentials: ['SSH-Agent-Key']) {
                sh """
                    ssh -o StrictHostKeyChecking=no ${TARGET_HOST} '
                        pwd
                        mkdir workspace
                    '
                """
                }
            }
        }
    }
    environment {
        TARGET_HOST = "master@192.168.78.133"
    }
}
```

파이프라인 실행 결과는 다음과 같다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/ssh-agent-plugin-in-jenkins-07.gif" width="100%" class="image__border">
</div>

#### REFERENCE

- <https://royleej9.tistory.com/m/entry/Jenkins-SSH-%EC%82%AC%EC%9A%A9-pipeline-SSH-Agent>
