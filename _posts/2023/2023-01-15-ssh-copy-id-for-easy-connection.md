---
title: "SSH Copy ID for Easy Connection"
search: false
category:
  - information
last_modified_at: 2023-01-15T23:55:00
---

<br/>

## 0. 들어가면서

시스템 환경 작업을 하다보면 SSH(Secure Shell)을 많이 사용하는 데, 매번 인증하는 일이 상당히 불편합니다. 
SSH 세션이 자주 끊기기도 하고, 쉘 스크립트에서 SSH 연결이 필요하면 인증 처리가 까다롭습니다. 
이번 포스트에선 `ssh-copy-id` 명령어를 사용해 한번 인증된 클라이언트가 비밀번호 입력 없이 SSH 연결을 맺는 방법에 대해 정리하였습니다. 

## 1. Practice

간단한 실습을 통해 사용 방법을 알아보겠습니다. 

* 클라이언트 PC에서 `ssh-keygen` 명령어를 사용해 공개 키와 비밀 키를 생성합니다.
* 공개 키를 SSH 서버에 복사합니다.
* 비밀 키를 사용해 SSH 서버에 접속합니다. 
* SSH Server IP - 192.168.78.132

### 1.1. Generate Public/Private Key

`ssh-keygen` 명령어를 사용해 공개 키와 비밀 키를 생성합니다. 
별도 옵션을 주지 않는다면 `~/.ssh` 경로에 키가 생성됩니다. 

```
$ ssh-keygen
Generating public/private rsa key pair.
Enter file in which to save the key (/home/client/.ssh/id_rsa): 
Enter passphrase (empty for no passphrase): 
Enter same passphrase again: 
Your identification has been saved in /home/client/.ssh/id_rsa
Your public key has been saved in /home/client/.ssh/id_rsa.pub
The key fingerprint is:
SHA256:4xgL+Y3e16qgTO3QS9guD/+rkd10HLBuE+0xa+kvFQQ client@client-virtual-machine
The key's randomart image is:
+---[RSA 3072]----+
|          . E.   |
|           +  .  |
|          o =.   |
|     .   . + *.  |
|    o . S = B  . |
|     B X = =  .  |
|    = & + ....   |
|   o.X =  . o.   |
|    ooOo=+.. ..  |
+----[SHA256]-----+

$ ls ~/.ssh/
id_rsa  id_rsa.pub  known_hosts  known_hosts.old
```

### 1.2. Copy Public Key to Server

`OpenSSH`의 일부 기능으로 매 로그인마다 비밀번호를 입력하지 않고 접근하기 위해 사용합니다. 
`ssh-copy-id` 명령어를 사용해 공개 키를 SSH 서버에 복사합니다. 

* 클라이언트가 생성한 공개 키(public key)를 서버에 복사합니다.
* `-i` 옵션으로 식별 공개 키를 지정합니다.
    * 기본 값(default)이 `~/.ssh/id_rsa`이며 별도로 옵션 값을 지정하지 않으면 해당 키가 사용됩니다.
* SSH 서버의 사용자(user) 정보와 호스트 IP 정보를 추가합니다.
    * `harbor@192.168.78.132`
    * SSH 서버 접속 ID - harbor
    * SSH 서버 호스트 IP - 192.168.78.132
* 비밀번호를 입력하여 인증 받으면 SSH 접속을 하라는 안내 메시지를 볼 수 있습니다.

```
$ ssh-copy-id -i ~/.ssh/id_rsa.pub harbor@192.168.78.132
/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/home/client/.ssh/id_rsa.pub"
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
harbor@192.168.78.132's password: 

Number of key(s) added: 1

Now try logging into the machine, with:   "ssh 'harbor@192.168.78.132'"
and check to make sure that only the key(s) you wanted were added.
```

##### Connect SSH

`ssh` 명령어로 접속하면 비밀번호 입력 없이 인증이 가능합니다.

<p align="center">
    <img src="/images/ssh-copy-id-for-easy-connection-1.gif" width="100%" class="image__border">
</p>

#### REFERENCE
 
* <https://www.ssh.com/academy/ssh/copy-id>
* <https://serverfault.com/questions/241588/how-to-automate-ssh-login-with-password>