---
title: "비공개 도커 레지스트리(Private docker registry) 만들기"
publishedAt: "2022-02-01"
updatedAt: "2026-11-12T16:26:00+09:00"
canonicalPath: "/information/docker/make-private-docker-registry-on-ec2/"
categories:
  - "information"
  - "docker"
summary: "EC2 인스턴스에 설치한 도커 레지스트리에 openssl로 만든 SSL 인증서와 사용자 계정을 적용해 비공개 저장소로 만드는 과정을 정리했다."
recommendedPosts:
  - title: "CI/CD란 무엇인가?"
    href: "https://junhyunny.github.io/information/what-is-ci-cd/"
  - title: "HTTPS(HyperText Transfer Protocol over Secure Socket Layer)"
    href: "https://junhyunny.github.io/information/https/"
  - title: "젠킨스(Jenkins) 설치"
    href: "https://junhyunny.github.io/information/jenkins/jenkins-install/"
  - title: "젠킨스(Jenkins) GitHub Webhooks 연동"
    href: "https://junhyunny.github.io/information/jenkins/github/jenkins-github-webhook/"
  - title: "EC2 인스턴스에 도커 레지스트리(Docker registry) 설치"
    href: "https://junhyunny.github.io/information/docker/install-docker-registry-on-ec2/"
  - title: "젠킨스(Jenkins) 파이프라인을 통해 EC2 인스턴스에 서비스 배포"
    href: "https://junhyunny.github.io/information/jenkins/jenkins-deploy-ec2-using-docker/"
  - title: "젠킨스(Jenkins) 슬랙(Slack) 알림 메시지 전송"
    href: "https://junhyunny.github.io/information/jenkins/jenkins-slack-notification/"
---

## 0. 들어가면서

[EC2 인스턴스에 도커 레지스트리(Docker registry) 설치][install-docker-registry-on-ec2-link] 글에선 이미지 저장소를 만드는 방법을 다뤘다. 단순히 이미지 저장소를 만든 것이므로 따로 비공개 처리를 하지 않으면 IP와 포트(port)를 아는 사용자는 누구나 해당 레지스트리를 공개 저장소처럼 사용할 수 있다. 프로젝트용 비공개 이미지를 올릴 예정이므로 이전에 만든 레지스트리를 비공개로 바꾸려고 한다. 이번 글은 도커 레지스트리가 이미 설치되어 있다고 가정하고 설명한다.

AWS EC2 인스턴스와 맥북의 터미널 명령어가 섞여 나와 헷갈릴 수 있으므로, 각 명령어를 어디에서 실행하는지 본문에 밝혔다. 이번 글에서 다루는 작업 영역은 다음과 같다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/make-private-docker-registry-on-ec2-01.png" width="85%" class="image__border">
</div>

## 1. SSL 인증서 생성

도커 레지스트리가 원격에 있으면 `https` 프로토콜을 사용하므로 SSL(Secure Socket Layer) 인증서가 필요하다. `openssl`을 이용해 인증서를 만들고 적용해 보자. 이 절의 작업은 모두 EC2 인스턴스에서 수행한다.

먼저 인증서를 저장할 디렉토리를 만들고, 해당 디렉토리로 이동한다.

```
~ $ mkdir -p ~/docker-registry/cert
~ $ cd ~/docker-registry/cert
```

다음 명령어로 개인 키를 만든다. 암호화 비밀번호를 입력하고, 확인을 위해 한 번 더 입력한다. 명령어의 각 부분은 다음과 같다.

- `openssl genrsa` - 키를 생성하는 명령어이다.
- `-des3` - `3DES` 알고리즘으로 암호화한다.
- `-out server.key` - `server.key`라는 파일 이름으로 키를 생성한다.
- `2048` - `2048` bit long modulus 사용

```
cert $ openssl genrsa -des3 -out server.key 2048
Generating RSA private key, 2048 bit long modulus
......................................+++
.....+++
e is 65537 (0x10001)
Enter pass phrase for server.key:
Verifying - Enter pass phrase for server.key:
```

다음으로 인증 요청서(CSR, Certificate Signing Request)를 만든다. 인증 요청서는 SSL 서버를 운영하는 회사의 정보를 암호화해 인증 기관에 보내고 인증서를 발급받기 위한 신청서이다. `Common Name (eg, your name or your server's hostname)` 항목에는 EC2 인스턴스의 공개 IP를 등록한다. `Common Name`은 레지스트리로 사용할 서버의 도메인 이름과 같아야 하며, 반드시 IP를 넣어야 하는 것은 아니다.

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

다음 명령어로 자체 인증서(.crt)를 만든다. 명령어의 각 부분은 다음과 같다.

- `openssl x509` - 인증서를 만드는 명령어이다.
- `-req` - 입력 값으로 `certificate request`, `sign`, `output`이 필요하다는 옵션이다.
- `-days 365` - 인증서 유효 기간이다.
- `-in server.csr` - 인증서를 생성할 때 필요한 요청서로 `server.csr`을 사용한다.
- `-signkey server.key` - 인증서를 생성할 때 필요한 개인 키를 지정한다.
- `-out server.crt` - 생성할 인증서 이름을 `server.crt`로 지정한다.

```
cert $ openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
Signature ok
subject=/C=KR/ST=Seoul/L=Seoul/O=VMware/CN={ec2-instance-public-ip}
Getting Private key
Enter pass phrase for server.key:
```

개인 키를 복호화해 RSA Private Key를 추출한다.

```
cert $ cp server.key server.key.origin
cert $ openssl rsa -in server.key.origin -out server.key
Enter pass phrase for server.key.origin:
writing RSA key
```

인증서가 생성됐는지 확인한다.

```
cert $ ls
server.crt  server.csr  server.key  server.key.origin
```

## 2. 클라이언트 인증서 적용

우선 서버에서 만든 인증서를 클라이언트(맥북)로 복사해야 한다. 맥북에서 `scp` 명령어를 실행해 EC2 인스턴스의 `~/docker-registry/cert` 디렉토리 파일을 맥북의 `~/Desktop/cert` 폴더로 복사한다.

```
~ % scp -r -i ~/Downloads/private-key.pem ec2-user@{ec2-instance-public-domain}.ap-northeast-1.compute.amazonaws.com:~/docker-registry/cert ~/Desktop
server.key                                                                                                              100% 1675    39.1KB/s   00:00
server.csr                                                                                                              100%  980    24.3KB/s   00:00
server.crt                                                                                                              100% 1151    28.9KB/s   00:00
server.key.origin                                                                                                       100% 1743    43.5KB/s   00:00
```

내려받은 인증서를 맥북에 등록하고, 도커를 재시작한다.

```
~ % security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ~/Desktop/cert/server.crt
```

다른 운영체제에서도 인증서를 적용할 수 있다. 우분투(ubuntu)에서는 다음 명령어를 실행한다.

```
~ $ cp ~/Desktop/cert/server.crt /usr/share/ca-certificates/
~ $ echo server.crt >> /etc/ca-certificates.conf
~ $ update-ca-certificates
```

센트OS(centos)에서는 다음 명령어를 실행한다.

```
~ $ cp ~/Desktop/cert/server.crt /etc/pki/ca-trust/source/anchors/
~ $ update-ca-trust
```

## 3. 로그인 정보 설정 및 레지스트리 실행

클라이언트에서 로그인할 수 있는 사용자 아이디와 비밀번호를 만들고 레지스트리 서비스를 다시 실행한다. 이 절의 작업은 모두 EC2 인스턴스에서 수행한다.

먼저 아이디와 비밀번호를 저장할 디렉토리를 만든다.

```
~ $ mkdir -p ~/docker-registry/auth
~ $ cd ~/docker-registry/auth
```

이전 레지스트리 버전에 포함됐던 `htpasswd` 기능이 최근 이미지에서 빠진 것 같다. htpasswd 툴(tool)을 설치한 뒤 아이디와 비밀번호를 만든다. 아이디는 `cicduser`, 비밀번호는 `0000`이다.

```
auth $ sudo yum install httpd-tools -y
auth $ htpasswd -Bbn cicduser 0000 > ./htpasswd
```

레지스트리에서 사용할 루트 디렉토리를 생성한다.

```
~ $ mkdir -p ~/docker-registry/volume
```

실행 중인 레지스트리 컨테이너가 있다면 종료한 뒤 다시 실행한다.

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

이제 맥북에서 이미지를 만들어 `push`, `pull` 해 보자. 이 절의 작업은 모두 맥북에서 수행한다. 간단한 테스트로 도커 허브에서 nginx 이미지를 내려받아 EC2 인스턴스에 있는 개인 저장소에 올린다.

먼저 도커 허브에서 nginx 이미지를 pull 한다.

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

nginx 이미지의 태그를 변경하고 확인한다. `{ec2-instance-public-ip}`에는 자신의 EC2 인스턴스 공개 IP를 사용하면 된다.

```
~ % docker tag nginx {ec2-instance-public-ip}:5000/nginx

~ % docker images
REPOSITORY                TAG       IMAGE ID       CREATED      SIZE
{ec2-instance-public-ip}:5000/nginx   latest    c316d5a335a5   5 days ago   142MB
nginx                     latest    c316d5a335a5   5 days ago   142MB
```

맥북의 도커에 다른 사용자로 로그인되어 있으면 `docker push` 명령어가 실패한다.

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

레지스트리 사용자로 로그인한 뒤 `docker push` 명령어를 수행하면 성공한다.

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

`curl` 명령어로 push 된 이미지를 확인할 수 있다. 이미지를 확인하려면 사용자 아이디와 비밀번호를 함께 전달한다.

```
~ % curl -X GET -u cicduser:0000 https://{ec2-instance-public-ip}:5000/v2/_catalog
{"repositories":["element","nginx","openjdk"]}
```

이번엔 레지스트리에서 이미지를 pull 해 보자. 먼저 이전 단계에서 로그인해 생긴 `credential`과 도커 이미지를 제거한다.

```
~ % docker logout {ec2-instance-public-ip}:5000
Removing login credentials for {ec2-instance-public-ip}:5000

~ % docker rmi -f $(docker images -aq)
```

로그인하지 않은 상태로 레지스트리에서 pull 하면 에러가 발생한다.

```
~ % docker pull {ec2-instance-public-ip}:5000/nginx
Using default tag: latest
Error response from daemon: Get "http://{ec2-instance-public-ip}:5000/v2/": net/http: HTTP/1.x transport connection broken: malformed HTTP response "\x15\x03\x01\x00\x02\x02"
```

로그인한 뒤 이미지를 pull 하면 정상적으로 실행된다.

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

[install-docker-registry-on-ec2-link]: https://junhyunny.github.io/information/docker/install-docker-registry-on-ec2/

[docker-registry-secret-link]: https://5equal0.tistory.com/entry/Docker-Registry-%EC%82%AC%EC%84%A4-%EC%9B%90%EA%B2%A9-%EB%A0%88%EC%A7%80%EC%8A%A4%ED%8A%B8%EB%A6%AC-%EB%A7%8C%EB%93%A4%EA%B8%B0
