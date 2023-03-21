---
title: "Cache-Control on Nginx"
search: false
category:
  - information
  - nginx
last_modified_at: 2023-03-21T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Compression on Nginx][compression-on-nginx-link]

## 0. 들어가면서

속도가 느린 네트워크 상황에서 브라우저의 사용자 경험 개선을 위한 압축 설정에 관련된 내용을 [Compression on Nginx][compression-on-nginx-link] 포스트에서 다뤘습니다. 
이미지, 비디오 같은 파일들은 이미 충분히 압축된 바이너리(binary) 파일이기 때문에 압축 효과를 볼 수 없습니다. 
이에 대한 사용성 개선을 위해 캐시 컨트롤(cache control)을 적용하였습니다.  

## 1. Cache-Control in HTTP Header

> The Cache-Control HTTP header field holds directives (instructions) — in both requests and responses — that control caching in browsers and shared caches (e.g. Proxies, CDNs).

HTTP 헤더의 필드 중 하나이며 요청, 응답 헤더에 모두 포함될 수 있습니다. 
공용 캐시나 브라우저의 캐시 정책을 결정할 수 있습니다. 
이번 포스트는 `Nginx` 서버에서 브라우저에게 이미지, 비디오 등을 매번 갱신할 필요가 없다고 알려줘야하기 때문에 응답 헤더를 사용합니다. 

### 1.1. Vocabulary

다음과 같은 용어들에 대해 먼저 정리할 필요가 있습니다. 

* (HTTP) cache
    * 다음 요청들에 대해서 이전 요청, 응답의 결과를 재사용하는 것을 의미합니다.
    * 개인 캐시 혹은 공용 캐시가 될 수 있습니다.
* Shared cache
    * 원장(origin) 서버와 클라이언트 사이에 존재하는 프록시(proxy) 혹은 CDN(content delivery network)을 의미합니다.
    * 프록시나 CDN는 동일한 응답을 다수의 클라이언트에게 재사용할 수 있습니다. 
    * 사적인 컨텐츠가 공용 캐시에 올라가지 않도록 주의해야 합니다.  
* Private cache
    * 클라이언트 측에 존재하는 캐시를 의미합니다.
    * 브라우저에 존재하는 캐시나 로컬 캐시를 예로 들수 있으며 사적인 컨텐츠를 저장합니다.
* Store response
    * 응답을 캐시에 저장하는 것을 의미하며 캐시된 응답이 항상 그대로 재사용되는 것은 아닙니다.
    * 일반적인 캐시는 응답을 저장하는 것을 의미합니다.
* Reuse response
    * 이어지는 요청들에 대해 캐시된 응답을 재사용합니다.
* Revalidate response
    * 캐시된 응답이 여전히 유효한지 원장 서버에 물어봅니다.
    * 일반적으로 재평가는 조건부 요청을 통해 이뤄집니다. 
* Fresh response
    * 캐시된 응답이 여전히 유효하다는 의미입니다. 
    * 유효한 응답이므로 후속 요청들에 대해 응답을 재사용할 수 있습니다.
* Stale response
    * 캐시된 응답이 유효하지 않다는 의미입니다.
    * 캐시된 응답을 현재 상태로 재사용할 수 없습니다.
    * 재검증을 통해 새로운 응답으로 대체되어야 하므로 이전 응답은 캐시에 저장될 필요가 없습니다. 
* Age
    * 응답이 생성된 후 지난 시간을 의미합니다.

### 1.2. Response Directives

응답 헤더의 몇 개 디렉티브들만 살펴보겠습니다. 

* max-age=N
    * `N`초 동안 해당 응답을 재사용할 수 있다는 것을 의미합니다.
    * 응답을 수신한 이후 경과된 시간이 아닌 원장 서버에서 응답이 생성된 이후 경과된 시간입니다.

```
Cache-Control: max-age=604800
```

* private
    * 응답을 오직 개인 캐시에만 저장하라는 의미입니다.
    * 사적인 컨텐츠 혹은 로그인 후 세션 관리를 위해 사용되는 쿠키(cookie) 같은 응답을 예로 들수 있습니다.
    * `private` 디렉티브를 명시하지 않았다면 해당 응답이 공용 캐시에 저장되어 개인 정보 누출이 될 수 있습니다.

```
Cache-Control: private
```

* public
    * 해당 응답은 공용 캐시에 저장될 수 있다는 의미입니다.
    * `Authorization` 헤더가 함께 전달된 요청에 대한 응답은 공용 캐시에 저장되면 안 되지만, `public` 디렉티브에 의해 저장될 수 있습니다.

```
Cache-Control: public
```

## 2. Cache-Control on Nginx 

`Nginx` 서버 설정을 통해 캐시 컨트롤 헤더를 특정 요청에 대한 응답 메세지에 추가할 수 있습니다. 

##### default.conf

* 이미지, 비디오 등에 해당하는 확장자를 가진 자원들은 3일 동안 응답을 저장하고, 재사용합니다.
* 캐시 컨트롤의 효과를 더 극대화할 수 있도록 `Last-Modified` 헤더 값을 매번 변경합니다.
    * `304 Not Modified` 응답을 방지합니다.

```conf
server {
  listen 80;

  location / {
    root /usr/share/nginx/html;
    index index.html index.htm;

    add_header Last-Modified $date_gmt;

    location ~* \.(gif|jpe?g|png|ico)$ {
      add_header Cache-Control "private, max-age=259200";
    }
  }
}
```

## 3. Practice

도커 컨테이너(docker container)로 간단한 서비스를 호스팅하여 캐시 컨트롤 결과를 확인해보겠습니다. 

### 3.1. nginx.conf

서버 설정 이 외에 다음과 같은 전역 설정을 가지고 있습니다. 
캐시 컨트롤과는 무관하지만, [Compression on Nginx][compression-on-nginx-link] 포스트의 내용과 연결되므로 해당 설정을 유지하였습니다.

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

### 3.2. Dockerfile

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

### 3.3. Run Docker Container

* 이미지를 빌드하고, 컨테이너를 실행합니다.

```
$ docker build . -t nginx-compression
[+] Building 1.3s (16/16) FINISHED
 => [internal] load build definition from Dockerfile                                                                                   0.0s
 => => transferring dockerfile: 37B                                                                                                    0.0s
 => [internal] load .dockerignore                                                                                                      0.0s
 => => transferring context: 2B                                                                                                        0.0s
 => [internal] load metadata for docker.io/library/nginx:latest                                                                        0.9s
 => [internal] load metadata for docker.io/library/node:16-buster-slim                                                                 1.1s
 => [stage-1 1/4] FROM docker.io/library/nginx@sha256:aa0afebbb3cfa473099a62c4b32e9b3fb73ed23f2a75a65ce1d4b4f55a5c2ef2                 0.0s
 => [builder 1/6] FROM docker.io/library/node:16-buster-slim@sha256:3e531c9fb23b950711705c18e0c350cfc1f6a4c583883762d52b4096de3c9da8   0.0s
 => [internal] load build context                                                                                                      0.0s
 => => transferring context: 1.29kB                                                                                                    0.0s
 => CACHED [stage-1 2/4] COPY nginx.conf /etc/nginx/nginx.conf                                                                         0.0s
 => CACHED [stage-1 3/4] COPY default.conf /etc/nginx/conf.d/default.conf                                                              0.0s
 => CACHED [builder 2/6] WORKDIR /app                                                                                                  0.0s
 => CACHED [builder 3/6] COPY package.json .                                                                                           0.0s
 => CACHED [builder 4/6] RUN npm install --silent                                                                                      0.0s
 => CACHED [builder 5/6] COPY . .                                                                                                      0.0s
 => CACHED [builder 6/6] RUN npm run build                                                                                             0.0s
 => CACHED [stage-1 4/4] COPY --from=builder /app/build /usr/share/nginx/html                                                          0.0s
 => exporting to image                                                                                                                 0.0s
 => => exporting layers                                                                                                                0.0s
 => => writing image sha256:bb9326dd302313eb3029767c817f51b570cf6cba7ccc4d86b740332e2eb371c5                                           0.0s
 => => naming to docker.io/library/nginx-compression                                                                                   0.0s

$ docker run -d -p 80:80 --name nginx-compression nginx-compression
aae4f57de1107e4f2d216e3fdfb6a334495a09caa95ae28b466130f6e6c170ea
```

### 3.4. Result of Cache-Control on Nginx

압축 적용 전후를 비교해보겠습니다. 
테스트 환경은 다음과 같습니다.

* 크롬 브라우저
* `빠른 3G` 네트워크 환경

#### 3.3.1. Without Cache-Control

캐시 컨트롤 설정을 하지 않은 `Nginx` 서버로부터 페이지를 요청합니다.

* 처음 페이지 요청시 약 20초 정도 다운로드 받는 시간이 소요됩니다.
* 새로고침을 통해 화면을 갱신하면 첫 요청과 마찬가지로 약 20초 정도 다운로드 받는 시간이 동일하게 소요됩니다.

<p align="center">
    <img src="/images/cache-control-on-nginx-1.gif" width="100%" class="image__border">
</p>

#### 3.3.2. With Cache-Control

캐시 컨트롤 설정을 적용한 `Nginx` 서버로부터 페이지를 요청합니다.

* 처음 페이지 요청시 약 20초 정도 다운로드 받는 시간이 소요됩니다.
* 새로고침을 통해 화면을 갱신하면 이미지들은 메모리 캐시 값을 그대로 사용합니다.
* 네트워크 트래픽이 발생하지 않으므로 자원 요청 시간이 0초인 것을 볼 수 있습니다.

<p align="center">
    <img src="/images/cache-control-on-nginx-2.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-03-21-cache-control-on-nginx>

#### REFERENCE

* <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control>
* <https://stackoverflow.com/questions/3492319/private-vs-public-in-cache-control>
* <https://www.howtogeek.com/devops/how-to-configure-cache-control-headers-in-nginx/>
* <https://www.linuxhelp.com/how-to-cache-control-in-nginx>
* <https://ubiq.co/tech-blog/disable-nginx-cache/>

[compression-on-nginx-link]: https://junhyunny.github.io/information/nginx/compression-on-nginx/