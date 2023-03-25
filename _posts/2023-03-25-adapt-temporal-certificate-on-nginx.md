---
title: "Adapt Temporal Certificate on Nginx"
search: false
category:
  - information
  - nginx
last_modified_at: 2023-03-25T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [HTTPS(HyperText Transfer Protocol over Secure Socket Layer)][https-link]

## 1. Context of Problem

현재 진행하는 프로젝트에서 [react-qr-scanner][react-qr-scanner-link]라는 라이브러리를 사용했습니다. 
이 라이브러리는 카메라를 사용해 QR 이미지를 스캔하는 기능을 제공합니다. 
적용하는데 다음과 같은 문제점이 있었습니다. 

* 브라우저에서 QR 스캔을 위해 카메라를 실행하려면 `HTTPS` 혹은 `localhost`에서만 가능하다.
* 기능 개발 후 PM(project manager)들이 테스트할 수 있는 환경을 구축해야 된다. 

위의 문제들을 해결하기 위해 임시 인증서를 만들고 `Nginx`에 적용하여 `HTTPS` 서비스를 하는 방법에 대해 정리하였습니다. 

## 2. Make Temporal Certificate

`OpenSSL`를 사용하면 임시 인증서를 생성할 수 있습니다. 

* 프로젝트에 `ssl` 폴더를 생성합니다.
* `openssl req` 명령어를 통해 인증서를 생성합니다.
    * PKCS#10 형식의 인증서 서명 요청(CSR, certificate Signing Request)을 생성합니다.
    * 테스트를 위해 루트(root) CA(certificate authority)로써 자체 서명 인증서를 생성할 수 있습니다.
* 다음과 같은 추가 설정들을 통해 인증서를 생성합니다.
    * `-x509` 
        * `-x509` 옵션을 통해 인증서 서명 요청이 아닌 인증서를 즉시 발급합니다.
        * 테스트를 위한 인증서 발급 방법입니다.
    * `-days 30` 
        * 30일 동안 유효한 인증서를 생성합니다.
    * `-nodes`
        * 만약 비공개 키를 생성한다면 암호화시키지 않는 옵션입니다.
        * OpenSSL 3.0부터 제거되었으며 `-noenc` 옵션을 사용합니다.
    * `-newkey rsa:2048`
        * `-key` 옵션이 지정되지 않은 경우 새로운 비공개 키를 생성하는데 사용됩니다.
        * 암호화 알고리즘을 함께 지정합니다.
    * `-keyout ssl/nginx-ssl.key`
        * 비공개 키를 파일로 만드는 옵션입니다.
    * `-out ssl/nginx-ssl.crt`
        * 인증서를 파일로 만드는 옵션입니다.
* `CSR`을 위한 정보를 입력합니다. 
    * 나라 - KR
    * 지역 - Seoul
    * 도시 - Seoul
    * 기관 - VMWare
    * 조직 - Tanzu Labs
    * 인증 받을 도메인 주소 - nginx-ssl.host.com
    * 이메일 주소 - test@test.com
* `ssl` 경로에 인증서 `nginx-ssl.crt`와 비공개 키 `nginx-ssl.key`가 생성된 것을 확인합니다.

```
$ mkdir ssl

$ openssl req -x509\
  -days 30\
  -nodes\
  -newkey rsa:2048\
  -keyout ssl/nginx-ssl.key\ 
  -out ssl/nginx-ssl.crt
Generating a 2048 bit RSA private key
...............................+++++
................................+++++
writing new private key to 'ssl/nginx-ssl.key'
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) []:KR
State or Province Name (full name) []:Seoul
Locality Name (eg, city) []:Seoul
Organization Name (eg, company) []:VMWare
Organizational Unit Name (eg, section) []:Tanzu Labs
Common Name (eg, fully qualified host name) []:nginx-ssl.host.com
Email Address []:test@test.com

$ ls -al ssl
total 16
drwxr-xr-x   4 junhyunk  staff   128 Mar 25 19:59 .
drwxr-xr-x  15 junhyunk  staff   480 Mar 25 19:58 ..
-rw-r--r--   1 junhyunk  staff  1310 Mar 25 19:59 nginx-ssl.crt
-rw-r--r--   1 junhyunk  staff  1704 Mar 25 19:59 nginx-ssl.key
```

## 3. Practice

도커 컨테이너(docker container)를 사용해 서비스를 실행합니다.

### 3.1. default.conf

* 80 포트로 접근하는 경우 443 포트로 리다이렉트(redirect)합니다.
* 443 포트로 들어오는 요청에 이전 단계에서 생성한 임시 인증서를 적용합니다.
    * `ssl_certificate` 설정으로 인증서 경로를 지정합니다.
    * `ssl_certificate_key` 설정으로 비공개 키 경로를 지정합니다.
* 등록한 비공개 키는 인증서 내부에 포함된 공개 키에 대응되는 비대칭 키입니다.

```conf
server {
  listen 80;
  server_name nginx-ssl.host.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl;
  server_name nginx-ssl.host.com;

  ssl_certificate /ssl/nginx-ssl.crt;
  ssl_certificate_key /ssl/nginx-ssl.key;

  root /usr/share/nginx/html;
  index index.html index.htm;

  location / {
    try_files $uri $uri/ = 404;
  }
}
```

### 3.2. Dockerfile

* 어플리케이션 이미지를 만들 때 사용하는 도커 파일(Dockerfile)입니다.
* `nginx` 이미지로 컨테이너를 실행할 때 인증서가 담긴 `ssl` 디렉토리를 이미지 내부에 복사합니다.

```dockerfile
FROM node:16-buster-slim as builder

WORKDIR /app

COPY package.json .

RUN npm install --silent

COPY . .

RUN npm run build

FROM nginx

COPY default.conf /etc/nginx/conf.d/default.conf

COPY ssl /ssl

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3.3. Add Host for Practice

`nginx-ssl.host.com`는 인증서 테스트를 위해 임시로 사용하는 호스트이므로 테스트 PC host 파일에 등록합니다. 
이미 발급 받은 도메인 주소를 사용해 이 포스트의 실습을 따라하는 경우에 이 작업은 불필요합니다. 

* AWS EC2 컨테이너를 사용해 공개 도메인 주소가 있는 경우
* 사전에 발급 받은 도메인 주소가 있는 경우

운영체제에 따라 호스트 파일을 관리하는 방법이 다릅니다. 
본인은 맥(mac)에서 작업을 하고 있기 때문에 이를 기준으로 작성하였습니다.

* 로컬 호스트와 동일한 `127.0.0.1` IP에 `nginx-ssl.host.com` 도메인을 매칭합니다.

```
$ sudo vi /etc/hosts

##
# Host Database
#
# localhost is used to configure the loopback interface
# when the system is booting.  Do not change this entry.
##
127.0.0.1       localhost
255.255.255.255 broadcasthost

127.0.0.1       nginx-ssl.host.com

::1             localhost
# Added by Docker Desktop
# To allow the same kube context to work on the host and the container:
127.0.0.1 kubernetes.docker.internal
# End of section
```

### 3.4. Run Application on Nginx

* 이미지를 빌드하고, 컨테이너를 실행합니다.
* 외부에서 접근할 수 있도록 80, 443 포트를 모두 노출합니다.

```
$ docker build -t nginx-ssl .

[+] Building 20.8s (16/16) FINISHED
 => [internal] load build definition from Dockerfile                                                                                     0.0s
 => => transferring dockerfile: 37B                                                                                                      0.0s
 => [internal] load .dockerignore                                                                                                        0.0s
 => => transferring context: 2B                                                                                                          0.0s
 => [internal] load metadata for docker.io/library/nginx:latest                                                                          3.4s
 => [internal] load metadata for docker.io/library/node:16-buster-slim                                                                   2.6s
 => [builder 1/6] FROM docker.io/library/node:16-buster-slim@sha256:720848e85cae21df58f71400b4722ed0cb6ee14a23079c0cacd71a9c448b9670     0.0s
 => [stage-1 1/4] FROM docker.io/library/nginx@sha256:f4e3b6489888647ce1834b601c6c06b9f8c03dee6e097e13ed3e28c01ea3ac8c                   4.5s
 => => resolve docker.io/library/nginx@sha256:f4e3b6489888647ce1834b601c6c06b9f8c03dee6e097e13ed3e28c01ea3ac8c                           0.0s
 => => sha256:ac232364af842735579e922641ae2f67d5b8ea97df33a207c5ea05f60c63a92d 7.66kB / 7.66kB                                           0.0s
 => => sha256:f1f26f5702560b7e591bef5c4d840f76a232bf13fd5aefc4e22077a1ae4440c7 31.41MB / 31.41MB                                         2.0s
 => => sha256:84181e80d10e844350789d3324e848cf728df4f3d0f6c978789dd489f493934a 25.47MB / 25.47MB                                         2.2s
 => => sha256:1ff0f94a80076ab49af75159e23f062a30a75d333a8e9c021bf39669230afcfe 625B / 625B                                               0.8s
 => => sha256:f4e3b6489888647ce1834b601c6c06b9f8c03dee6e097e13ed3e28c01ea3ac8c 1.86kB / 1.86kB                                           0.0s
 => => sha256:557c9ede65655e5a70e4a32f1651638ea3bfb0802edd982810884602f700ba25 1.57kB / 1.57kB                                           0.0s
 => => sha256:d776269cad101c9f8e33e2baa0a05993ed0786604d86ea525f62d5d7ae7b9540 959B / 959B                                               1.1s
 => => sha256:e9427fcfa8642f8ddf5106f742a75eca0dbac676cf8145598623d04fa45dd74e 773B / 773B                                               1.4s
 => => sha256:d4ceccbfc2696101c94fbf2149036e4ff815e4723e518721ff85105ce5aa8afc 1.41kB / 1.41kB                                           1.7s
 => => extracting sha256:f1f26f5702560b7e591bef5c4d840f76a232bf13fd5aefc4e22077a1ae4440c7                                                1.3s
 => => extracting sha256:84181e80d10e844350789d3324e848cf728df4f3d0f6c978789dd489f493934a                                                0.6s
 => => extracting sha256:1ff0f94a80076ab49af75159e23f062a30a75d333a8e9c021bf39669230afcfe                                                0.0s
 => => extracting sha256:d776269cad101c9f8e33e2baa0a05993ed0786604d86ea525f62d5d7ae7b9540                                                0.0s
 => => extracting sha256:e9427fcfa8642f8ddf5106f742a75eca0dbac676cf8145598623d04fa45dd74e                                                0.0s
 => => extracting sha256:d4ceccbfc2696101c94fbf2149036e4ff815e4723e518721ff85105ce5aa8afc                                                0.0s
 => [internal] load build context                                                                                                        3.8s
 => => transferring context: 3.10MB                                                                                                      3.8s
 => CACHED [builder 2/6] WORKDIR /app                                                                                                    0.0s
 => CACHED [builder 3/6] COPY package.json .                                                                                             0.0s
 => CACHED [builder 4/6] RUN npm install --silent                                                                                        0.0s
 => [builder 5/6] COPY . .                                                                                                               4.7s
 => [stage-1 2/4] COPY default.conf /etc/nginx/conf.d/default.conf                                                                       0.3s
 => [stage-1 3/4] COPY ssl /ssl                                                                                                          0.0s
 => [builder 6/6] RUN npm run build                                                                                                      8.0s
 => [stage-1 4/4] COPY --from=builder /app/build /usr/share/nginx/html                                                                   0.0s
 => exporting to image                                                                                                                   0.0s
 => => exporting layers                                                                                                                  0.0s
 => => writing image sha256:6c9bcd2411fe0345cc861f21970ba2171297f8752a36e71e04e265957107fe35                                             0.0s
 => => naming to docker.io/library/nginx-ssl                                                                                             0.0s

$ docker run -d\
  -p 80:80\
  -p 443:443\
  --name nginx-ssl\
  nginx-ssl
e856fc0cf3f3d3d6ca3a127646f4e6cdbe50544a822e1765b57195f0823de512
```

##### Result of Practice

* 공인된 `CA`에서 발급한 인증서가 아니기 때문에 경고 메세지가 보여집니다.
* 안전하지 않은 이동을 눌러 사이트에 접속합니다.
* 유효하지 않은 인증서를 사용했기 때문에 브라우저 주소창에 경고 메세지가 보여집니다.
* 인증서 정보를 살펴볼 수 있습니다.
    * 인증서를 만들 때 작성한 정보들이 보여집니다.

<p align="center">
    <img src="/images/adapt-temporal-certificate-on-nginx-1.gif" width="100%" class="image__border">
</p>

## CLOSING

이번 포스트에서 다룬 내용은 어디까지나 임시 테스트 환경을 구축하기 위한 인증서 적용 방법입니다. 
운영 환경을 위해 도메인, 인증서, 비공개 키 등을 이미 발급 받았다면 임시 인증서 생성을 제외하곤 프로젝트 상황에 맞게 적절하게 적용할 수 있습니다.

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-03-25-adapt-temporal-certificate-on-nginx>

#### REFERENCE

* <https://www.openssl.org/>
* <https://www.openssl.org/docs/manmaster/man1/openssl-req.html>
* <https://docs.3rdeyesys.com/compute/ncloud_compute_lemp_nginx_ssl_setting_ubuntu_guide.html>

[https-link]: https://junhyunny.github.io/information/https/
[react-qr-scanner-link]: https://www.npmjs.com/package/react-qr-scanner