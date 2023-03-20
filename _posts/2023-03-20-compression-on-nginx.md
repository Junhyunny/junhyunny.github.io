---
title: "Compression on Nginx"
search: false
category:
  - information
  - nginx
last_modified_at: 2023-02-08T23:55:00
---

<br/>

## 0. 들어가면서

리액트(react) 어플리케이션으로 개발한 간단한 서비스를 개발했습니다. 
이때 현장 네트워크 상황이 좋지 않아서 사용자들에게 버그로 인식될 정도였는데, 몇 가지 설정을 통해 이를 개선하였습니다. 
이번 포스트에선 `Nginx` 압축(compression) 관련 설정에 대해 알아보겠습니다. 

## 1. Compression on Nginx 

압축 관련된 설정은 공통적으로 적용하면 좋기 때문에 `http` 블럭 내부에 작성합니다. 
`server`, `location` 블럭 내부에 설정하여도 무관합니다. 

##### nginx.conf

* `http` 블럭은 메인 설정 파일인 `/etc/nginx/nginx.conf`에 정의합니다.
* 다음과 같은 압축 관련 설정들을 작성합니다.
* gzip on;
    * 컨텐츠 압축 사용을 지시합니다.
* gzip_disable "msie6";
    * 압축을 적용하지 않을 브라우저를 지정합니다.
    * 예전 IE(Internet Explorer)는 압축을 지원하지 않으므로 "msie6"를 예외 항목으로 설정합니다.
* gzip_vary on;
    * gzip 설정을 사용할 때 응답 헤더에 `Vary: Accept-Encoding`를 넣을지 여부입니다.
* gzip_proxied any;
    * 프록시(proxy)나 캐시 서버에서 요청할 경우 동작 여부를 설정합니다.
    * 다음과 같은 설정들을 가질 수 있습니다. 
        * off, expired, no-cache, no-store, any
* gzip_comp_level 6;
    * 1~9까지 숫자를 설정할 수 있으며 숫자가 클수록 압축률은 높아지지만, 압축 시간이 길어집니다.
* gzip_buffers 16 8k;
    * 버퍼의 숫자와 크기를 지정합니다.
    * 버퍼 숫자는 16, 크기는 8k입니다.
* gzip_http_version 1.1;
    * 최소 HTTP 통신 버전을 설정합니다.
    * 1.1 버전을 설정하였습니다.
* gzip_min_length 1024;
    * 압축을 적용할 컨텐츠(contents)의 최소 사이즈를 지정합니다.
    * 이보다 작은 파일은 압축하지 않습니다.
* gzip_types [types in array];
    * 컨텐츠 유형에 따른 압축 여부를 설정하며 기본 값은 `text/html`입니다.
    * 압축할 타입을 MIME(Multipurpose Internet Mail Extensions) 형식으로 작성합니다.

```conf
events {
    worker_connections 1024;
}

http {
  charset utf-8;
  default_type application/octet-stream;
  include /etc/nginx/mime.types;
  include /etc/nginx/conf.d/*.conf;

  gzip on;
  gzip_disable "msie6";
  gzip_vary on;
  gzip_proxied any;
  gzip_comp_level 6;
  gzip_buffers 16 8k;
  gzip_http_version 1.1;
  gzip_min_length 1025;
  gzip_types text/plain
             text/css
             application/javascript
             application/json
             image/x-icon
             image/png
             image/jpeg
             image/gif;
}
```

## 2. Practice

도커 컨테이너(docker container)로 간단한 서비스를 호스팅하여 압축 결과를 확인해보겠습니다. 

### 2.1. default.conf

* 서버에 관련된 설정을 추가합니다.
    * 포트를 `80`으로 지정합니다.
    * 루트 경로와 index 파일을 지정합니다.

```conf
server {
  listen 80;

  location / {
    root /usr/share/nginx/html;
    index index.html index.htm;
  }
}
```

### 2.2. Dockerfile

* `nginx.conf`, `default.conf` 설정을 이미지 특정 경로에 복사합니다.

```dockerfile
FROM node:16-buster-slim as builder

WORKDIR /app

COPY package.json .

RUN npm install --silent

COPY . .

RUN npm run build

FROM nginx

COPY nginx.conf /etc/nginx/nginx.conf

COPY default.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2.3. Run Docker Container

* 이미지를 빌드하고, 컨테이너를 실행합니다.

```
$ docker build . -t nginx-compression
[+] Building 90.7s (16/16) FINISHED
 => [internal] load build definition from Dockerfile                                                                                      0.0s
 => => transferring dockerfile: 37B                                                                                                       0.0s
 => [internal] load .dockerignore                                                                                                         0.0s
 => => transferring context: 2B                                                                                                           0.0s
 => [internal] load metadata for docker.io/library/nginx:latest                                                                           1.0s
 => [internal] load metadata for docker.io/library/node:16-buster-slim                                                                    1.2s
 => [builder 1/6] FROM docker.io/library/node:16-buster-slim@sha256:3e531c9fb23b950711705c18e0c350cfc1f6a4c583883762d52b4096de3c9da8      0.0s
 => [stage-1 1/4] FROM docker.io/library/nginx@sha256:aa0afebbb3cfa473099a62c4b32e9b3fb73ed23f2a75a65ce1d4b4f55a5c2ef2                    0.0s
 => [internal] load build context                                                                                                         2.6s
 => => transferring context: 3.10MB                                                                                                       2.6s
 => CACHED [builder 2/6] WORKDIR /app                                                                                                     0.0s
 => CACHED [builder 3/6] COPY package.json .                                                                                              0.0s
 => [builder 4/6] RUN npm install --silent                                                                                                71.0s
 => CACHED [stage-1 2/4] COPY nginx.conf /etc/nginx/nginx.conf                                                                            0.0s
 => CACHED [stage-1 3/4] COPY default.conf /etc/nginx/conf.d/default.conf                                                                 0.0s
 => [builder 5/6] COPY . .                                                                                                                5.4s 
 => [builder 6/6] RUN npm run build                                                                                                       9.6s 
 => [stage-1 4/4] COPY --from=builder /app/build /usr/share/nginx/html                                                                    0.0s 
 => exporting to image                                                                                                                    0.0s
 => => exporting layers                                                                                                                   0.0s
 => => writing image sha256:40a596f43636b2f5b051d2ed60e5cdfda86c74ee5111bb954c64323016bb4285                                              0.0s
 => => naming to docker.io/library/nginx-compression                                                                                      0.0s

$ docker run -d -p 80:80 --name nginx-compression nginx-compression
742d36d9e714becb10fec140d11b6a95f668f95dfb1a02cc77305dc1191567aa
```

### 2.4. Result of Compression on Nginx

압축 적용 전후를 비교해보겠습니다. 
테스트 환경은 다음과 같습니다.

* 크롬 브라우저
* `빠른 3G` 네트워크 환경
* 캐시 사용 중지

#### 2.4.1. Without Compression

압축 설정을 하지 않은 `Nginx` 서버로부터 페이지를 요청합니다.

##### Response Header

* 컨텐츠 길이가 143,916 바이트입니다.
* 컨텐츠 타입은 `application/javascript`입니다.

<p align="left">
    <img src="/images/compression-on-nginx-1.JPG" width="50%" class="image__border">
</p>

##### Timing

* 서버 응답을 기다리는데 걸리는 시간은 577.20ms 입니다.
* 콘텐츠를 다운로드 받는데 걸리는 시간은 855.36ms 입니다.
* 총 소요된 시간은 1.44s 입니다.

<p align="center">
    <img src="/images/compression-on-nginx-2.JPG" width="100%" class="image__border">
</p>

#### 2.4.2. With Compression

압축 설정을 적용한 `Nginx` 서버로부터 페이지를 요청합니다.

##### Response Header

* 컨텐츠 인코딩(encoding)이 `gzip`으로 표시됩니다.
    * 컨텐츠 사이즈는 원래 사이즈는 144kB, 작아진 사이즈는 46.9kB로 표시됩니다.
* 컨텐츠 타입은 `application/javascript`입니다.

<p align="left">
    <img src="/images/compression-on-nginx-3.JPG" width="50%" class="image__border">
</p>

<p align="left">
    <img src="/images/compression-on-nginx-4.JPG" width="70%" class="image__border">
</p>

##### Timing

* 서버 응답을 기다리는데 걸리는 시간은 582.17ms 입니다.
    * 서버의 응답이 10ms 정도 증가했으며 이는 서버가 자원을 압축하는데 걸리는 시간입니다.
* 콘텐츠를 다운로드 받는데 걸리는 시간은 255.91ms 입니다.
    * 컨텐츠 사이즈가 작아진만큼 다운로드 속도가 감소하였습니다.
* 총 소요된 시간은 841.87ms 입니다.

<p align="center">
    <img src="/images/compression-on-nginx-5.JPG" width="100%" class="image__border">
</p>

## 3. Result

이 포스트를 작성하면서 배운점들을 정리하였습니다.

### 3.1. Consideration

압축은 다음과 같은 프로세스를 거칩니다.

1. 서버가 자원을 압축합니다.
1. 작아진 용량의 데이터가 네트워크를 통해 클라이언트에게 전달됩니다.
1. 클라이언트는 압축된 자원을 해제합니다. 

그렇기 때문에 압축이 항상 좋은 결과를 만들진 않습니다. 
네트워크를 통한 다운로드 시간은 단축시키지만, 서버의 사양이 좋지 않다면 압축하는데 시간이 더 오래 걸릴 수 있습니다. 
압축을 적용하려면 다음과 같은 사항들을 고려하는 것이 좋습니다.

* 서버 사양 
    * 서버가 자원을 압축 후 전달하기 때문에 서버 사양이 낮으면 속도가 느려질 수 있습니다.
* 사용자 트래픽
    * 접속 사용자가 많다면 네트워크 트래픽 절감 효과를 얻기 위해 압축을 적용합니다.
* 해외(혹은 원거리) 통신
    * 물리적으로 매우 먼 거리의 통신인 경우 압축을 통해 네트워크 트래픽을 작게 만듭니다.
    * 예를 들면 해외 서버에서 국내 클라이언트를 위한 서비스를 수행하는 경우를 들 수 있습니다.

### 3.2. Not useful cases

텍스트(text) 파일은 압축 효율이 좋기 때문에 적용 전후에 많은 차이가 있습니다. 
이미지, 비디오, gif, zip 파일들은 이미 충분히 압축된 바이너리(binary) 파일이므로 추가적인 압축 작업이 효율적으로 적용되지 않습니다. 
데이터 크기가 줄어든다는 보장이 없고 불필요한 압축/해제 단계만 추가됩니다. 
이 경우 캐시 컨트롤(cache control)을 활용하여 클라이언트의 속도 향상을 노리는 것이 더 효과적입니다. 

아래 예시를 보면 압축 적용 전후 고용량 이미지들을 다운로드 받는데 걸리는 시간 차이가 얼마 없음을 확인할 수 있습니다. 

##### Download images without compression

* 다운로드 받은 각 리소스의 크기와 소요된 시간을 살펴보겠습니다.
* image-1.jpg
    * 201kB
    * 3.86초 소요
* image-2.png
    * 189kB
    * 3.72초 소요
* image-3.gif
    * 3.4MB
    * 21.67초 소요

<p align="center">
    <img src="/images/compression-on-nginx-5.gif" width="100%" class="image__border">
</p>

##### Download images with compression

* 다운로드 받은 각 리소스의 크기와 소요된 시간을 살펴보겠습니다.
* image-1.jpg
    * 188kB
    * 3.71초 소요
* image-2.png
    * 189kB
    * 3.73초 소요
* image-3.gif
    * 3.4MB
    * 21.57초 소요

<p align="center">
    <img src="/images/compression-on-nginx-6.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-03-20-compression-on-nginx>

#### REFERENCE

* <https://nginx.org/en/docs/http/ngx_http_gzip_module.html>
* <https://docs.nginx.com/nginx/admin-guide/web-server/compression/>
* <https://www.lesstif.com/system-admin/nginx-gzip-59343019.html>
* <https://blog.lael.be/post/6553>
