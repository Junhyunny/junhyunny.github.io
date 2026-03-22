---
title: "비공개 도커 레지스트리(Private docker registry) 만들기" 
search: false
category:
  - information
  - docker
last_modified_at: 2022-02-01T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [CI/CD란 무엇인가?][what-is-ci-cd-link]
- [HTTPS(HyperText Transfer Protocol over Secure Socket Layer)][https-link]
- [Install Jenkins][jenkins-install-link]
- [젠킨스(Jenkins) GitHub Webhooks 연동][jenkins-github-webhook-link]
- [도커 레지스트리(Docker registry) 설치 on EC2 인스턴스][install-docker-registry-on-ec2-link]

👉 이어서 읽기를 추천합니다.
- [젠킨스(Jenkins) 파이프라인 서비스 배포 on EC2 인스턴스][jenkins-deploy-ec2-using-docker-link]
- [젠킨스(Jenkins) 슬랙(Slack) 알림 메시지 전송][jenkins-slack-notification-link]

## 0. 들어가면서

[도커 레지스트리(Docker registry) 설치 on EC2 인스턴스][install-docker-registry-on-ec2-link] 포스트에선 이미지 저장소를 만드는 내용에 대해 다뤘습니다. 
단순히 이미지 저장소를 만든 것이므로 별도의 비공개 처리를 하지 않았다면 IP와 포트(port)를 알고 있는 사용자들은 모두 해당 레지스트리를 공개 저장소처럼 사용할 수 있습니다. 
프로젝트를 위한 비공개 이미지들을 올릴 예정이므로 이전에 만들었던 레지스트리를 비공개 처리해보겠습니다. 
이번 포스트에선 이미 도커 레지스트리가 설치되어 있다는 가정하에 설명을 진행하겠습니다. 

터미널 명령어들이 섞여서 나오기 때문에 헷갈릴 수 있어서 별도로 표시하였습니다. 
- `on EC2 인스턴스` 접미사가 붙은 것은 AWS EC2 인스턴스에서 작업한 내용입니다. 
- `on Macbook` 접미사가 붙은 것은 맥북에서 작업한 내용입니다. 

##### 비공개 도커 레지스트리 만들기 작업 영역 

<p align="center"><img src="{{ site.image_url_2022 }}/make-private-docker-registry-on-ec2-01.png" width="85%" class="image__border"></p>

## 1. SSL 인증서 생성

도커 레지스트리가 원격에 위치한 경우 `https` 프로토콜이 사용되므로 SSL(Secure Socket Layer)에서 필요한 인증서가 필요합니다. 
`openssl`을 이용하여 인증서를 만들고 적용해보겠습니다. 

##### 개인 키와 공개 키 만들기 on EC2 인스턴스
- 인증서를 저장할 디렉토리를 만들고, 해당 디렉토리로 이동합니다.

```
~ $ mkdir -p ~/docker-registry/cert
~ $ cd ~/docker-registry/cert
```

- 개인 키를 만듭니다.
    - `openssl genrsa` - 키를 생성하는 명령어입니다.
    - `-des3` - `3DES` 알고리즘으로 암호화합니다.
    - `-out server.key` - 파일명 `server.key`으로 키를 생성합니다.
    - `2048` - `2048` bit long modulus 사용
    - 암호화 비밀번호를 입력하고, 확인을 위한 재입력을 수행합니다.

```
cert $ openssl genrsa -des3 -out server.key 2048
Generating RSA private key, 2048 bit long modulus
......................................+++
.....+++
e is 65537 (0x10001)
Enter pass phrase for server.key:
Verifying - Enter pass phrase for server.key:
```

- 인증 요청서(CSR, Certificate Signing Request) 만들기
    - SSL 서버를 운영하는 회사의 정보를 암호화하여 인증 기관으로 보내 인증서를 발급받기 위한 신청서입니다.
    - `Common Name (eg, your name or your server's hostname)` 항목에서 EC2 인스턴스 공개IP를 등록합니다.
    - `Common Name`은 레지스트리로 사용할 서버의 도메인 이름과 동일해야하며 반드시 IP가 들어가지는 않습니다.

```
cert $ openssl req -new -key server.key -out server.csr
Enter pass phrase for server.key:
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [XX]:KR
State or Province Name (full name) []:Seoul
Locality Name (eg, city) [Default City]:Seoul
Organization Name (eg, company) [Default Company Ltd]:VMware
Organizational Unit Name (eg, section) []:
Common Name (eg, your name or your server's hostname) []:{ec2-instance-public-ip}
Email Address []:

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:
An optional company name []:
```

- 자체 인증서(.crt) 만들기
    - `openssl x509` - 인증서를 만드는 명령어입니다.
    - `-req` - 입력 값으로 `certificate request`, `sign` 그리고 `output`이 필요하다는 옵션입니다.
    - `-days 365` - 인증서 유효기간입니다.
    - `-in server.csr` - 인증서 생성시 필요한 요청서는 `server.csr`입니다.
    - `-signkey server.key` - 인증서 생성시 필요한 개인 키를 지정합니다.
    - `-out server.crt` - 생성할 인증서 이름을 `server.crt`로 지정합니다.

```
cert $ openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
Signature ok
subject=/C=KR/ST=Seoul/L=Seoul/O=VMware/CN={ec2-instance-public-ip}
Getting Private key
Enter pass phrase for server.key:
```

- 개인 키 복호화를 통한 RSA Private Key 추출

```
cert $ cp server.key server.key.origin
cert $ openssl rsa -in server.key.origin -out server.key
Enter pass phrase for server.key.origin:
writing RSA key
```

- 인증서 생성 확인

```
cert $ ls
server.crt  server.csr  server.key  server.key.origin
```

## 2. 클라이언트 인증서 적용

우선 서버에서 만든 인증서를 클라이언트(맥북)으로 복사시켜야 합니다. 
`scp` 명령어로 서버에서 만든 인증서를 맥북으로 복사하겠습니다. 

##### 인증서 복사 on Macbook
- EC2 컨테이너의 `~/docker-registry/cert` 디렉토리 파일을 맥북의 `~/Desktop/cert` 폴더로 복사합니다.

```
~ % scp -r -i ~/Downloads/private-key.pem ec2-user@{ec2-instance-public-domain}.ap-northeast-1.compute.amazonaws.com:~/docker-registry/cert ~/Desktop
server.key                                                                                                              100% 1675    39.1KB/s   00:00    
server.csr                                                                                                              100%  980    24.3KB/s   00:00    
server.crt                                                                                                              100% 1151    28.9KB/s   00:00    
server.key.origin                                                                                                       100% 1743    43.5KB/s   00:00
```

##### 인증서 적용하기 on Macbook
- 다운받은 인증서를 맥북에 등록하고, 도커를 재시작합니다.

```
~ % security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ~/Desktop/cert/server.crt
```

##### 인증서 적용하기 on ohter OS
- ubuntu

```
~ $ cp ~/Desktop/cert/server.crt /usr/share/ca-certificates/
~ $ echo server.crt >> /etc/ca-certificates.conf
~ $ update-ca-certificates
```

- centos

```
~ $ cp ~/Desktop/cert/server.crt /etc/pki/ca-trust/source/anchors/ 
~ $ update-ca-trust
```

## 3. 로그인 정보 설정 및 레지스트리 실행

클라이언트에서 로그인할 수 있는 사용자 아이디와 비밀번호를 만들고 레지스트리 서비스를 재실행하겠습니다. 

##### 사용자 아이디와 비밀번호 만들기 on EC2 인스턴스
- 아이디와 비밀번호를 만들어 저장할 디렉토리를 만듭니다.

```
~ $ mkdir -p ~/docker-registry/auth
~ $ cd ~/docker-registry/auth
```

- 이전 레지스트리 버전에 포함되었던 `htpasswd` 기능이 최근 이미지에서 빠진 것 같습니다.
- htpasswd 툴(tool) 설치 후 아이디와 비밀번호를 만들어줍니다.
    - 아이디는 `cicduser`, 비밀번호는 `0000`입니다.

```
auth $ sudo yum install httpd-tools -y
auth $ htpasswd -Bbn cicduser 0000 > ./htpasswd
```

##### 도커 레지스트리 실행 on EC2 인스턴스
- 레지스트리에서 사용할 루트 디랙토리를 생성합니다.

```
~ $ mkdir -p ~/docker-registry/volume
```

- 이전에 실행 중인 레지스트리 컨테이너가 있다면 종료 후 재실행합니다.

```
~ $ docker run -d \
  -p 5000:5000 \
  --restart=always \
  --name private-registry \
  -v ~/docker-registry/auth:/auth \
  -e REGISTRY_AUTH=htpasswd \
  -e "REGISTRY_AUTH_HTPASSWD_REALM=Registry Realm" \
  -e REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd \
  -v ~/docker-registry/volume:/data \
  -e REGISTRY_STORAGE_FILESYSTEM_ROOTDIRECTORY=/data \
  -v ~/docker-registry/cert:/certs \
  -e REGISTRY_HTTP_TLS_KEY=/certs/server.key \
  -e REGISTRY_HTTP_TLS_CERTIFICATE=/certs/server.crt \
  registry

~ $ docker ps
CONTAINER ID   IMAGE      COMMAND                  CREATED         STATUS         PORTS                                       NAMES
d204d32fc574   registry   "/entrypoint.sh /etc…"   9 seconds ago   Up 8 seconds   0.0.0.0:5000->5000/tcp, :::5000->5000/tcp   private-registry
```

## 4. 도커 이미지 push & pull

이제 맥북에서 이미지를 만들어 `push`, `pull` 해보겠습니다. 
간단한 테스트로 도커 허브에서 nginx 이미지를 다운받아서 EC2 인스턴스에 위치한 개인 저장소에 올리겠습니다.

##### nginx 이미지 pull from 도커 허브 on Macbook

```
~ % docker pull nginx
Using default tag: latest
latest: Pulling from library/nginx
5eb5b503b376: Already exists 
1ae07ab881bd: Already exists 
78091884b7be: Already exists 
091c283c6a66: Already exists 
55de5851019b: Already exists 
b559bad762be: Already exists 
Digest: sha256:2834dc507516af02784808c5f48b7cbe38b8ed5d0f4837f16e78d00deb7e7767
Status: Downloaded newer image for nginx:latest
docker.io/library/nginx:latest
```

##### nginx 이미지 태그 변경 및 확인 on Macbook
- `{ec2-instance-public-ip}`에는 본인의 EC2 인스턴스 공개 IP를 사용하면 됩니다.

```
~ % docker tag nginx {ec2-instance-public-ip}:5000/nginx

~ % docker images
REPOSITORY                TAG       IMAGE ID       CREATED      SIZE
{ec2-instance-public-ip}:5000/nginx   latest    c316d5a335a5   5 days ago   142MB
nginx                     latest    c316d5a335a5   5 days ago   142MB
```

##### 이미지 push 실패 on Macbook
- 맥북에 도커 로그인이 다른 사용자로 되어 있는 경우 `docker push` 명령어 수행이 실패합니다.

```
~ % docker push {ec2-instance-public-ip}:5000/nginx     
Using default tag: latest
The push refers to repository [{ec2-instance-public-ip}:5000/nginx]
762b147902c0: Preparing 
235e04e3592a: Preparing 
6173b6fa63db: Preparing 
9a94c4a55fe4: Preparing 
9a3a6af98e18: Preparing 
7d0ebbe3f5d2: Waiting 
unauthorized: authentication required
```

##### 이미지 push 성공 on Macbook
- 맥북에서 레지스트리 사용자로 로그인 후 `docker push` 명령어를 수행하면 성공합니다.

```
~ % docker login {ec2-instance-public-ip}:5000 --username cicduser
Password: 
Login Succeeded

~ % docker push {ec2-instance-public-ip}:5000/nginx               
Using default tag: latest
The push refers to repository [{ec2-instance-public-ip}:5000/nginx]
762b147902c0: Pushed 
235e04e3592a: Pushed 
6173b6fa63db: Pushed 
9a94c4a55fe4: Pushed 
9a3a6af98e18: Pushed 
7d0ebbe3f5d2: Pushed 
latest: digest: sha256:bb129a712c2431ecce4af8dde831e980373b26368233ef0f3b2bae9e9ec515ee size: 1570
```

##### 이미지 push 성공 여부 확인 on Macbook
- `curl` 명령어를 통해 push 된 이미지를 확인할 수 있습니다.
- 이미지 확인을 위해 사용자 아이디와 비밀번호를 함께 전달합니다.

```
~ % curl -X GET -u cicduser:0000 https://{ec2-instance-public-ip}:5000/v2/_catalog
{"repositories":["element","nginx","openjdk"]}
```

##### 이미지 pull 실패 from 레지스트리 on Macbook
- 이전 단계에서 로그인하여 생긴 `credential`와 도커 이미지를 제거합니다.

```
~ % docker logout {ec2-instance-public-ip}:5000      
Removing login credentials for {ec2-instance-public-ip}:5000

~ % docker rmi -f $(docker images -aq)
```

- 레지스트리에서 pull 시도시 에러가 발생합니다.

```
~ % docker pull {ec2-instance-public-ip}:5000/nginx
Using default tag: latest
Error response from daemon: Get "http://{ec2-instance-public-ip}:5000/v2/": net/http: HTTP/1.x transport connection broken: malformed HTTP response "\x15\x03\x01\x00\x02\x02"
```

##### 이미지 pull 성공 from 레지스트리 on Macbook
- 로그인 후 이미지 pull 시도시 정상적으로 실행됩니다.

```
~ % docker login {ec2-instance-public-ip}:5000 --username cicduser
Password: 
Login Succeeded

~ % docker pull {ec2-instance-public-ip}:5000/nginx               
Using default tag: latest
latest: Pulling from nginx
5eb5b503b376: Already exists 
1ae07ab881bd: Already exists 
78091884b7be: Already exists 
091c283c6a66: Already exists 
55de5851019b: Already exists 
b559bad762be: Already exists 
Digest: sha256:bb129a712c2431ecce4af8dde831e980373b26368233ef0f3b2bae9e9ec515ee
Status: Downloaded newer image for {ec2-instance-public-ip}:5000/nginx:latest
{ec2-instance-public-ip}:5000/nginx:latest

~ % docker images
REPOSITORY                TAG       IMAGE ID       CREATED      SIZE
{ec2-instance-public-ip}:5000/nginx   latest    c316d5a335a5   6 days ago   142MB
```

#### REFERENCE
- [도커 사설 원격 레지스트리 만들기][docker-registry-secret-link]
- <https://ikcoo.tistory.com/60>
- <https://setyourmindpark.github.io/2018/02/06/docker/docker-4/>
- <https://www.comodossl.co.kr/certificate/ssl-installation-guides/Apache-csr-crt.aspx>
- <https://www.openssl.org/docs/man1.1.1/man1/x509.html>
- <https://docs.docker.com/registry/deploying/>

[what-is-ci-cd-link]: https://junhyunny.github.io/information/what-is-ci-cd/
[https-link]: https://junhyunny.github.io/information/https/
[jenkins-install-link]: https://junhyunny.github.io/information/jenkins/jenkins-install/
[jenkins-github-webhook-link]: https://junhyunny.github.io/information/jenkins/github/jenkins-github-webhook/
[install-docker-registry-on-ec2-link]: https://junhyunny.github.io/information/docker/install-docker-registry-on-ec2/

[jenkins-deploy-ec2-using-docker-link]: https://junhyunny.github.io/information/jenkins/jenkins-deploy-ec2-using-docker/
[jenkins-slack-notification-link]: https://junhyunny.github.io/information/jenkins/jenkins-slack-notification/

[docker-registry-secret-link]: https://5equal0.tistory.com/entry/Docker-Registry-%EC%82%AC%EC%84%A4-%EC%9B%90%EA%B2%A9-%EB%A0%88%EC%A7%80%EC%8A%A4%ED%8A%B8%EB%A6%AC-%EB%A7%8C%EB%93%A4%EA%B8%B0
