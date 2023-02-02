---
title: "SSH Agent Plugin in Jenkins"
search: false
category:
  - information
  - jenkins
last_modified_at: 2023-01-22T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Firewall][firewall-link]
* [Open Firewall of Linux][open-firewall-of-linux-link]
* [SSH Copy ID for Easy Connection][ssh-copy-id-for-easy-connection-link]

## 0. 들어가면서

CI/CD 파이프라인을 담당한 젠킨스(jenkins)가 위치한 클러스터와 서비스들을 배포할 쿠버네티스 클러스터가 서로 달라 배포에 어려움이 있었습니다. 
마스터 노드를 담당하는 가상 머신(virtual machine)에 직접 명령어(command)를 전달할 방법이 필요했습니다. 
젠킨스의 SSH 에이전트(secure shell agent) 플러그인을 사용하면 명령어을 직접 전달할 수 있는 데, 이번 포스트에선 이에 대해 정리하였습니다. 

## 1. Context for Practice

다음과 같은 실습 환경을 구축하였습니다. 

* Windows 운영체제를 사용하는 호스트(host) PC 위에 가상 머신(virtual machine) 두 대를 실행시킵니다. 
    * 운영체제 - Ubuntu 22.04.1
    * Jenkins VM IP - 192.168.78.131
    * Master VM IP - 192.168.78.133
* 다음과 같은 진행 과정을 통해 실습을 진행합니다.
    1. `Jenkins VM`에서 공개 키, 비밀 키를 생성합니다.
    1. 공개 키를 `Master VM`에 등록하여 비밀 키로 접속 시 재인증을 막습니다.
    1. 비밀 키를 젠킨스 시크릿으로 등록합니다.
    1. 젠킨스 SSH 에이전트를 사용해 쉘(shell) 명령어를 실행합니다. 

<p align="center">
    <img src="/images/ssh-agent-plugin-in-jenkins-1.JPG" width="80%" class="image__border">
</p>

## 2. Generate Public/Private Key on Jenkins VM

`Jenkins VM`에서 해당 작업을 수행합니다. 
`ssh-keygen` 명령어를 사용해 공개 키와 비밀 키를 생성합니다. 
별도 옵션을 주지 않는다면 `~/.ssh` 경로에 키가 생성됩니다. 

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

`Jenkins VM`에서 해당 작업을 수행합니다. 
이전 단계에서 만든 공개 키를 `MasterVM`에 복사합니다. 

* 이 단계에서 비밀번호 한번 입력이 필요합니다.
* 이 후엔 비밀 키를 사용한 접근 시에 비밀번호 입력이 필요 없습니다.

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

젠킨스에 비밀 키를 등록합니다. 
다음과 같은 과정을 통해 비밀 키 등록이 이뤄집니다. 

##### Manage Jenkins

* 메인 화면에서 `Manager Jenkins`을 누릅니다.
* 해당 화면에서 `Manage Credentials` 버튼을 눌러 신규 암호를 등록합니다.
 
<p align="center">
    <img src="/images/ssh-agent-plugin-in-jenkins-2.JPG" width="100%" class="image__border">
</p>

##### Credentials

* 해당 화면에서 `global` 링크를 누릅니다.

<p align="center">
    <img src="/images/ssh-agent-plugin-in-jenkins-3.JPG" width="100%" class="image__border">
</p>

##### Global credentials

* Add Credentials 버튼을 눌러 비밀 키를 등록합니다.

<p align="center">
    <img src="/images/ssh-agent-plugin-in-jenkins-4.JPG" width="100%" class="image__border">
</p>

##### New credentials

* 비밀 키 타입은 `SSH Username with private key`를 선택합니다.
* ID를 지정합니다.
    * `SSH-Agent-Key` - 해당 비밀 키를 식별하기 쉬운 ID 
* SSH 로그인에 필요한 사용자 이름을 등록합니다.
    * `master` - 해당 호스트에 접근하기 위한 사용자 이름
* 이전 단계에서 만든 비밀 키를 직접 입력합니다.
    * `cat .ssh/id_rsa` 명령어 실행 결과

<p align="center">
    <img src="/images/ssh-agent-plugin-in-jenkins-5.JPG" width="100%" class="image__border">
</p>

##### Check Secret Key

* 홈(home) 경로의 `.ssh` 경로에 만들어진 비밀 키를 확인합니다. 
    * `.pub` 확장자가 없는 파일입니다.

```
$ cat .ssh/id_rsa
-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
```

## 5. Jenkins Pipeline with SSH Agent

### 5.1. Install SSH Agent Plugin

* 사용 가능한 플러그인에서 `SSH Agent`를 검색하여 해당 플러그인을 설치합니다. 

<p align="center">
    <img src="/images/ssh-agent-plugin-in-jenkins-6.JPG" width="100%" class="image__border">
</p>

### 5.2. Run Jenkins Pipeline

실습을 위한 프로젝트를 만들고 아래와 같은 파이프라인 스크립트(script)를 실행시킵니다. 
별다른 설정 없이 해당 스크립트 실행만으로 SSH 명령어 실행이 정상적으로 수행됩니다. 

* 대상 호스트는 `master@192.168.78.133` 입니다.
* 이전 단계에서 생성한 `SSH-Agent-Key` 크레덴셜을 사용합니다.
* `ssh` 명령어를 통해 원격 호스트에 커맨드를 실행합니다.
    * pwd - 쉘이 실행되는 디렉토리 위치를 확인합니다.
    * mkdir workspace - 해당 위치에 workspace 디렉토리를 생성합니다.

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

##### Result of Pipeline

<p align="center">
    <img src="/images/ssh-agent-plugin-in-jenkins-7.gif" width="100%" class="image__border">
</p>

#### REFERENCE

* <https://royleej9.tistory.com/m/entry/Jenkins-SSH-%EC%82%AC%EC%9A%A9-pipeline-SSH-Agent>

[firewall-link]: https://junhyunny.github.io/information/firewall/
[open-firewall-of-linux-link]: https://junhyunny.github.io/information/open-firewall-of-linux/
[ssh-copy-id-for-easy-connection-link]: https://junhyunny.github.io/information/ssh-copy-id-for-easy-connection/