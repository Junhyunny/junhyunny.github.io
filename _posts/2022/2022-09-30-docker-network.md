---
title: "Docker Network"
search: false
category:
  - docker
last_modified_at: 2022-09-30T23:55:00
---

<br/>

## 1. Isolated Docker Containers

도커(docker) 네트워크에 대해 알아보기 전에 도커 네트워크가 없다면 어떤 문제가 발생하는지 살펴보겠습니다. 
도커 컨테이너는 격리된 환경에서 동작하기 때문에 기본적으로 다른 컨테이너와 통신이 불가능합니다. 
다음과 같은 상황을 예시로 들어보겠습니다. 

* `frontend` 컨테이너의 리액트 애플리케이션은 `backend` 컨테이너의 스프링 애플리케이션으로부터 데이터를 받고 싶습니다.
* 리액트 애플리케이션에서 `http://backend:8080/todos`으로 데이터를 요청합니다.
* `frontend` 컨테이너는 `backend`라는 도메인 주소를 찾을 수 없습니다.
* 데이터 요청은 실패합니다.

<p align="center">
    <img src="/images/docker-network-1.JPG" width="80%" class="image__border">
</p>

## 2. Docker Network

도커 네트워크는 격리된 컨테이너들의 통신을 돕는 논리적인 가상 인터페이스이며, 이를 통해 가상 네트워크 토폴로지(topology)를 구축할 수 있습니다. 
도커 데몬(daemon)을 실행하면 다음과 같은 네트워크들이 기본적으로 함께 생성됩니다. 

```
$ docker network ls

NETWORK ID     NAME      DRIVER    SCOPE
d8cd79053c56   bridge    bridge    local
969819b69df5   host      host      local
2e7d396ba961   none      null      local
```

### 2.1. Docker Network Topology

도커 네트워크의 디폴트 브릿지(bridge)를 기준으로 살펴보겠습니다. 
브릿지는 동일한 호스트에서 동작하는 서로 다른 컨테이너들 사이의 통신을 위해 사용됩니다. 

* 도커 데몬을 실행하면 기본적으로 `docker0`라는 도커 브릿지 가상 인터페이스가 추가됩니다.
* 새로운 컨테이너를 실행할 때마다 해당 컨테이너와 연결하기 위한 가상 인터페이스가 호스트 네트워크 스택에 추가됩니다.
    * 이름이 `veth(virtual ethernet)`으로 시작합니다.
* 격리된 네트워크 환경을 지닌 컨테이너는 내부에 개인 인터페이스와 루프백 인터페이스를 가집니다.
    * 개인 인터페이스는 이름이 `eth`으로 시작하며, 호스트의 가상 인터페이스(veth)와 연결을 위해 사용합니다.
    * 루프백 인터페이스는 다른 프로세스와 연결할 때 사용하지 않고, 동일 컨테이너에 다른 프로그램과 연결할 때 사용합니다. 
* 컨테이너의 개인 인터페이스(eth)와 호스트의 가상 인터페이스(veth)가 서로 연결됩니다. 
* 컨테이너와 연결된 가상 인터페이스(veth)는 도커 브릿지 가상 인터페이스(docker0)와 연결됩니다. 
* 도커 브릿지 가상 인터페이스(docker0)는 호스트의 네트워크 인터페이스에 연결됩니다. 

<p align="center">
    <img src="/images/docker-network-2.JPG" width="80%" class="image__border">
</p>
<center>Docker in Action</center>

### 2.2. Docker Network Drivers

도커 네트워크 드라이버는 여러 가지 종류가 있습니다. 
각 타입 별로 어떤 기능을 하는지 간략하게 알아보겠습니다. 

* bridge
    * 디폴트 네트워크 드라이버입니다.
    * 특별히 드라이버를 지정하지 않으면 `bridge` 드라이버로 생성됩니다.
    * 독립적으로 실행되는 컨테이너들 간의 통신을 위해 사용됩니다.
    * [details](https://docs.docker.com/network/bridge/)
* host
    * 독립적으로 실행되는 컨테이너를 위해 네트워크 격리를 제거합니다.
    * 호스트 시스템의 네트워크를 직접 사용합니다.
    * [details](https://docs.docker.com/network/host/)
* overlay
    * 여러 개의 분산된 도커 데몬 호스트들 사이의 연결을 위해 사용합니다.
    * `swarm` 서비스들 사이의 통신에 사용합니다.
    * `swarm` 서비스와 독립적으로 실행되는 컨테이너 사이의 통신에 사용합니다. 
    * 서로 다른 도커 데몬에서 실행되는 독립형 컨테이너들 사이의 통신에 사용합니다.
    * [details](https://docs.docker.com/network/overlay/)
* ipvlan
    * 사용자에게 IPv4, IPv6 주소 제어권을 줍니다. 
    * 2계층 태깅(tagging) 제어와 언더레이(underlay) 네트워크 통합에 관심있는 사용자들을 위한 3계층 라우팅 제어가 가능합니다.
    * [details](https://docs.docker.com/network/ipvlan/)
* macvlan
    * 컨테이너에게 맥(MAC) 주소를 부여할 수 있습니다.
    * 네트워크 상의 물리적 디바이스처럼 보이게 만들 수 있습니다.
    * 도커 데몬은 맥 주소를 통해 트래픽을 컨테이너에게 전달할 수 있습니다. 
    * [details](https://docs.docker.com/network/macvlan/)
* none
    * 컨테이너 네트워킹을 불가능하게 만듭니다.
    * 일반적으로 사용자 지정 네트워크 드라이버와 함께 사용됩니다.
    * `swarm` 서비스에서 사용 불가능입니다.
    * [details](https://docs.docker.com/network/none/)

## 3. Connect Containers

`frontend`, `backend` 컨테이너를 연결하는 간단한 예제를 살펴보겠습니다. 
`frontend` 컨테이너는 리액트 애플리케이션을 호스팅합니다. 
`backend` 컨테이너는 스프링 애플리케이션을 호스팅합니다. 
두 컨테이너는 `custom-bridge`라는 이름의 브릿지 드라이버를 통해 연결되어 있습니다. 

애플리케이션 코드들은 중요하지 않으므로 이번 포스트에선 다루지 않았습니다. 
편의상 리액트 애플리케이션을 프론트엔드 서비스, 스프링 애플리케이션을 백엔드 서비스로 지칭하였습니다. 
두 서비스는 사용자에게 다음과 같은 서비스를 제공합니다. 

* 브라우저를 통해 `TODO` 항목을 등록합니다.
    * 새로운 `TODO` 항목은 프론트엔드 서비스에 전달됩니다.
    * `nginx` 프록시 패스 설정에 따라 백엔드 서비스로 요청이 전달됩니다.
    * 새로운 `TODO` 항목은 백엔드 서비스에 저장됩니다.
* 브라우저에서 이전에 등록한 `TODO` 항목들을 보여줍니다.
    * `TODO` 항목들을 프론트엔드 서비스에 요청합니다.
    * `nginx` 프록시 패스 설정에 따라 백엔드 서비스로 요청이 전달됩니다.
    * 백엔드 서비스는 저장하고 있는 `TODO` 항목들을 응답으로 반환합니다.

<p align="center">
    <img src="/images/docker-network-3.JPG" width="80%" class="image__border">
</p>

### 3.1. Create Custom Bridge

우선 드라이버 종류가 브릿지인 네트워크를 생성합니다. 

```
$ docker network create custom-bridge

9b5ae49f9a0244a893ad878b8a95fb09b658ec876ec9dcf6ef408dd1c153a03a

$ docker network ls

NETWORK ID     NAME            DRIVER    SCOPE
d8cd79053c56   bridge          bridge    local
9b5ae49f9a02   custom-bridge   bridge    local
969819b69df5   host            host      local
2e7d396ba961   none            null      local
```

### 3.2. Connect Backend Container to Custom Bridge

백엔드 컨테이너를 실행하고, 커스텀 브릿지에 연결합니다. 

* `docker build -t backend ./backend` 
    * 백엔드 컨테이너 이미지를 생성합니다.
* `docker run -d -p 8080:8080 --name backend backend`
    * 백엔드 컨테이너를 실행합니다.
* `docker network connect custom-bridge backend`
    * 백엔드 컨테이너를 커스텀 브릿지에 연결합니다.
* `docker network inspect custom-bridge`
    * 커스텀 브릿지 상세 정보를 확인합니다.
    * `Containers` 항목에 백엔드 컨테이너가 포함된 것을 확인할 수 있습니다.

```
$ docker build -t backend ./backend

[+] Building 1.1s (15/15) FINISHED
 => [internal] load build definition from Dockerfile                                                                                  0.0s
 => => transferring dockerfile: 37B                                                                                                   0.0s
 => [internal] load .dockerignore                                                                                                     0.0s
 => => transferring context: 2B                                                                                                       0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                         1.0s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                 1.0s
 => [internal] load build context                                                                                                     0.0s
 => => transferring context: 1.90kB                                                                                                   0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9  0.0s
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa  0.0s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                 0.0s
 => CACHED [maven_build 2/6] WORKDIR /build                                                                                           0.0s
 => CACHED [maven_build 3/6] COPY pom.xml .                                                                                           0.0s
 => CACHED [maven_build 4/6] RUN mvn dependency:go-offline                                                                            0.0s
 => CACHED [maven_build 5/6] COPY src ./src                                                                                           0.0s
 => CACHED [maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                   0.0s
 => CACHED [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                        0.0s
 => exporting to image                                                                                                                0.0s
 => => exporting layers                                                                                                               0.0s
 => => writing image sha256:a57a2076bf7d956dc71138a1cb433fa1a13c0d38dbf6d1dda9f1de9b7fb4b85d                                          0.0s
 => => naming to docker.io/library/backend                                                                                            0.0s

$ docker run -d -p 8080:8080 --name backend backend 

3b4e0a33065581f7df7b9be505b6a356981d1014face0e341130640835aaf212

$ docker network connect custom-bridge backend

$ docker network inspect custom-bridge

[
    {
        "Name": "custom-bridge",
        "Id": "9b5ae49f9a0244a893ad878b8a95fb09b658ec876ec9dcf6ef408dd1c153a03a",
        "Created": "2022-09-30T14:57:25.636879404Z",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": {},
            "Config": [
                {
                    "Subnet": "172.20.0.0/16",
                    "Gateway": "172.20.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "3b4e0a33065581f7df7b9be505b6a356981d1014face0e341130640835aaf212": {
                "Name": "backend",
                "EndpointID": "c67397b9bb392fe352868c447d12b4a0271556d298b8613f6836909a04d96d7b",
                "MacAddress": "02:42:ac:14:00:02",
                "IPv4Address": "172.20.0.2/16",
                "IPv6Address": ""
            }
        },
        "Options": {},
        "Labels": {}
    }
]
```

### 3.3. Connect Frontend Container to Custom Bridge

프론트엔드 컨테이너를 실행할 때 커스텀 브릿지에 연결합니다. 

* `docker build -t frontend ./frontend`
    * 프론트엔드 컨테이너 이미지를 만듭니다.
* `docker run -d -p 80:80 --name frontend --network custom-bridge frontend`
    * `--network` 옵션을 통해 컨테이너 실행 시 네트워크 연결을 함께 수행합니다.
* `docker network inspect custom-bridge`
    * 커스텀 브릿지 상세 정보를 확인합니다.
    * `Containers` 항목에 프론트엔드 컨테이너가 포함된 것을 확인할 수 있습니다.

```
$ docker build -t frontend ./frontend

[+] Building 3.2s (15/15) FINISHED
 => [internal] load build definition from Dockerfile                                                                                  0.0s
 => => transferring dockerfile: 37B                                                                                                   0.0s
 => [internal] load .dockerignore                                                                                                     0.0s
 => => transferring context: 2B                                                                                                       0.0s
 => [internal] load metadata for docker.io/library/nginx:latest                                                                       0.9s
 => [internal] load metadata for docker.io/library/node:16-buster-slim                                                                0.9s
 => [builder 1/6] FROM docker.io/library/node:16-buster-slim@sha256:0070b4ae6bfe264b70947a7d040236cb977a8a6fe42c37b04f554f7c5b1768c3  0.0s
 => [stage-1 1/3] FROM docker.io/library/nginx@sha256:0b970013351304af46f322da1263516b188318682b2ab1091862497591189ff1                0.0s
 => [internal] load build context                                                                                                     2.2s
 => => transferring context: 3.14MB                                                                                                   2.1s
 => CACHED [stage-1 2/3] COPY conf/nginx.conf /etc/nginx/conf.d/default.conf                                                          0.0s
 => CACHED [builder 2/6] WORKDIR /app                                                                                                 0.0s
 => CACHED [builder 3/6] COPY package.json .                                                                                          0.0s
 => CACHED [builder 4/6] RUN npm install --silent                                                                                     0.0s
 => CACHED [builder 5/6] COPY . .                                                                                                     0.0s
 => CACHED [builder 6/6] RUN npm run build                                                                                            0.0s
 => CACHED [stage-1 3/3] COPY --from=builder /app/build /usr/share/nginx/html                                                         0.0s
 => exporting to image                                                                                                                0.0s
 => => exporting layers                                                                                                               0.0s
 => => writing image sha256:3cf9bccf0897e5b565ba6a30c4e673e8776b441554ef7d8191d2ab8fbefbaf1f                                          0.0s
 => => naming to docker.io/library/frontend                                                                                           0.0s

$ docker run -d -p 80:80 --name frontend --network custom-bridge frontend

a68957f36c09410c0a360668ecdc2ac7fe35912ddd5cbc86a6b98f1c32a25bf9

$ docker network inspect custom-bridge

[
    {
        "Name": "custom-bridge",
        "Id": "9b5ae49f9a0244a893ad878b8a95fb09b658ec876ec9dcf6ef408dd1c153a03a",
        "Created": "2022-09-30T14:57:25.636879404Z",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": {},
            "Config": [
                {
                    "Subnet": "172.20.0.0/16",
                    "Gateway": "172.20.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "3b4e0a33065581f7df7b9be505b6a356981d1014face0e341130640835aaf212": {
                "Name": "backend",
                "EndpointID": "c67397b9bb392fe352868c447d12b4a0271556d298b8613f6836909a04d96d7b",
                "MacAddress": "02:42:ac:14:00:02",
                "IPv4Address": "172.20.0.2/16",
                "IPv6Address": ""
            },
            "a68957f36c09410c0a360668ecdc2ac7fe35912ddd5cbc86a6b98f1c32a25bf9": {
                "Name": "frontend",
                "EndpointID": "c03726c5f4d5a9d661cd591f1ec25603cd7441947c46bd8bc993c20bcf549d16",
                "MacAddress": "02:42:ac:14:00:03",
                "IPv4Address": "172.20.0.3/16",
                "IPv6Address": ""
            }
        },
        "Options": {},
        "Labels": {}
    }
]
```

### 3.4. 동작 테스트

* `http://localhost:80`로 접속합니다.
* 새로운 `TODO` 항목들을 추가합니다.
* 새로운 탭에서 `http://localhost:80`로 접속합니다.
* 이전에 등록된 `TODO` 항목들이 조회되는지 확인합니다.

<p align="center">
    <img src="/images/docker-network-4.gif" width="100%" class="image__border">
</p>

## 4. Restriction of Default Bridge

`--network` 옵션 없이 컨테이너를 실행하면 기본적으로 생성되어 있는 디폴트 브릿지 네트워크에 자동으로 연결됩니다. 

```
$ docker run -d -p 8080:8080 --name backend backend 

f8710dab02f3e2fa62f5805afa11c58fe093f64f2a8865e509257728a0c88a02

$ docker network inspect bridge                     
[
    {
        "Name": "bridge",
        "Id": "d8cd79053c567045d3b35f6537444b56a12f37282edc1325a1e21a8ecfaa454d",
        "Created": "2022-09-29T15:28:55.996643036Z",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.17.0.0/16",
                    "Gateway": "172.17.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "f8710dab02f3e2fa62f5805afa11c58fe093f64f2a8865e509257728a0c88a02": {
                "Name": "backend",
                "EndpointID": "3f38737ef050e85e61134a90108a90dc4124bea9be5c13f4c438ab5d97b0a0ff",
                "MacAddress": "02:42:ac:11:00:02",
                "IPv4Address": "172.17.0.2/16",
                "IPv6Address": ""
            }
        },
        "Options": {
            "com.docker.network.bridge.default_bridge": "true",
            "com.docker.network.bridge.enable_icc": "true",
            "com.docker.network.bridge.enable_ip_masquerade": "true",
            "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
            "com.docker.network.bridge.name": "docker0",
            "com.docker.network.driver.mtu": "1500"
        },
        "Labels": {}
    }
]
```

컨테이너가 자동으로 디폴트 브릿지 네트워크에 연결된다면 별도 네트워크 작업 없이 프론트엔드 컨테이너를 실행만 해도 백엔드 컨테이너와 연결될 것이라 생각했습니다. 

> 왜 사용자 지정 네트워크를 별도로 만들지?

실제로 프론트엔드 컨테이너를 디폴트 브릿지에 연결하면 백엔드 컨테이너와 통신이 되지 않습니다. 
그 이유는 디폴트 브릿지 위에 컨테이너들은 IP를 통해서만 통신이 가능하기 때문입니다. 
도커 공식 문서를 보면 다음과 같은 설명이 있습니다. 

> Containers on the default bridge network can only access each other by IP addresses, unless you use the --link option, 
> which is considered legacy. 
> On a user-defined bridge network, containers can resolve each other by name or alias.

사용자 정의 브릿지를 사용해야지 컨테이너들을 이름이나 별칭(alias)으로 호출할 수 있습니다. 
프론트엔드 컨테이너에서 호스팅하는 애플리케이션은 `nginx` 서버를 사용해 서비스합니다. 
해당 `nginx` 설정을 살펴보면 백엔드 컨테이너를 `backend`라는 이름으로 호출하기 때문에 디폴트 브릿지에선 이를 찾지 못 합니다. 

```conf
upstream backend {
    server backend:8080;
}

server {
    listen 80;
    server_name frontend;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri /index.html;
    }

    location /api {
        rewrite ^/api(.*)$ $1?$args break;
        proxy_pass http://backend;
    }
}
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-09-30-docker-network>

#### REFERENCE

* [Docker in Action][docker-in-action-link]
* <https://www.daleseo.com/docker-networks/>
* <https://docs.docker.com/network/>
* <https://docs.docker.com/network/bridge/#differences-between-user-defined-bridges-and-the-default-bridge>

[docker-in-action-link]: https://www.manning.com/books/docker-in-action-second-edition