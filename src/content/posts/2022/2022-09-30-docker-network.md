---
title: "도커 네트워크"
publishedAt: "2022-09-30"
updatedAt: "2026-11-11T22:58:57+09:00"
canonicalPath: "/docker/docker-network/"
categories:
  - "docker"
summary: "도커 네트워크의 토폴로지와 드라이버를 살펴보고, 커스텀 브릿지로 프론트엔드와 백엔드 컨테이너를 연결하는 방법과 디폴트 브릿지의 제약을 정리했다."
---

## 1. Isolated Docker Containers

도커(docker) 네트워크에 대해 알아보기 전에 도커 네트워크가 없다면 어떤 문제가 발생하는지 살펴보자. 도커 컨테이너는 격리된 환경에서 동작하기 때문에 기본적으로 다른 컨테이너와 통신이 불가능하다. 다음과 같은 상황을 예로 들 수 있다.

- `frontend` 컨테이너의 리액트 애플리케이션은 `backend` 컨테이너의 스프링 애플리케이션으로부터 데이터를 받고 싶다.
- 리액트 애플리케이션에서 `http://backend:8080/todos`로 데이터를 요청한다.
- `frontend` 컨테이너는 `backend`라는 도메인 주소를 찾을 수 없다.
- 데이터 요청은 실패한다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/docker-network-01.png" width="100%" class="image__border">
</div>

## 2. Docker Network

도커 네트워크는 격리된 컨테이너끼리 통신할 수 있게 돕는 논리적인 가상 인터페이스이며, 이를 통해 가상 네트워크 토폴로지(topology)를 구축할 수 있다. 도커 데몬(daemon)을 실행하면 다음과 같은 네트워크들이 기본적으로 함께 생성된다.

```
$ docker network ls

NETWORK ID     NAME      DRIVER    SCOPE
d8cd79053c56   bridge    bridge    local
969819b69df5   host      host      local
2e7d396ba961   none      null      local
```

### 2.1. Docker Network Topology

도커 네트워크의 디폴트 브릿지(bridge)를 기준으로 살펴보자. 브릿지는 동일한 호스트에서 동작하는 서로 다른 컨테이너들 사이의 통신을 위해 사용된다.

- 도커 데몬을 실행하면 기본적으로 `docker0`라는 도커 브릿지 가상 인터페이스가 추가된다.
- 새로운 컨테이너를 실행할 때마다 해당 컨테이너와 연결하기 위한 가상 인터페이스가 호스트 네트워크 스택에 추가된다.
  - 이름이 `veth(virtual ethernet)`으로 시작한다.
- 격리된 네트워크 환경을 지닌 컨테이너는 내부에 개인 인터페이스와 루프백 인터페이스를 가진다.
  - 개인 인터페이스는 이름이 `eth`으로 시작하며, 호스트의 가상 인터페이스(veth)와 연결하는 데 사용한다.
  - 루프백 인터페이스는 다른 컨테이너의 프로세스가 아니라 같은 컨테이너 안의 다른 프로그램과 통신할 때 사용한다.
- 컨테이너의 개인 인터페이스(eth)와 호스트의 가상 인터페이스(veth)가 서로 연결된다.
- 컨테이너와 연결된 가상 인터페이스(veth)는 도커 브릿지 가상 인터페이스(docker0)와 연결된다.
- 도커 브릿지 가상 인터페이스(docker0)는 호스트의 네트워크 인터페이스에 연결된다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/docker-network-02.png" width="100%" class="image__border">
</div>
<center>Docker in Action</center>

### 2.2. Docker Network Drivers

도커 네트워크 드라이버는 여러 가지 종류가 있다. 타입별로 어떤 기능을 하는지 간략하게 알아보자.

- bridge
  - 디폴트 네트워크 드라이버다.
  - 특별히 드라이버를 지정하지 않으면 `bridge` 드라이버로 생성된다.
  - 독립적으로 실행되는 컨테이너 사이의 통신에 사용된다.
  - [details](https://docs.docker.com/network/bridge/)
- host
  - 독립적으로 실행되는 컨테이너를 위해 네트워크 격리를 제거한다.
  - 호스트 시스템의 네트워크를 직접 사용한다.
  - [details](https://docs.docker.com/network/host/)
- overlay
  - 여러 개의 분산된 도커 데몬 호스트들 사이의 연결을 위해 사용한다.
  - `swarm` 서비스들 사이의 통신에 사용한다.
  - `swarm` 서비스와 독립적으로 실행되는 컨테이너 사이의 통신에 사용한다.
  - 서로 다른 도커 데몬에서 실행되는 독립형 컨테이너들 사이의 통신에 사용한다.
  - [details](https://docs.docker.com/network/overlay/)
- ipvlan
  - 사용자에게 IPv4, IPv6 주소 제어권을 준다.
  - 2계층 VLAN 태깅(tagging)을 제어할 수 있고, 언더레이(underlay) 네트워크 통합이 필요한 사용자는 3계층 라우팅까지 제어할 수 있다.
  - [details](https://docs.docker.com/network/ipvlan/)
- macvlan
  - 컨테이너에게 맥(MAC) 주소를 부여할 수 있다.
  - 네트워크상의 물리적 디바이스처럼 보이게 만들 수 있다.
  - 도커 데몬은 맥 주소를 통해 트래픽을 컨테이너에게 전달할 수 있다.
  - [details](https://docs.docker.com/network/macvlan/)
- none
  - 컨테이너의 네트워킹을 비활성화한다.
  - 일반적으로 사용자 지정 네트워크 드라이버와 함께 사용된다.
  - `swarm` 서비스에서는 사용할 수 없다.
  - [details](https://docs.docker.com/network/none/)

## 3. Connect Containers

`frontend`, `backend` 컨테이너를 연결하는 간단한 예제를 살펴보자. `frontend` 컨테이너는 리액트 애플리케이션을, `backend` 컨테이너는 스프링 애플리케이션을 호스팅한다. 두 컨테이너는 브릿지 드라이버로 만든 `custom-bridge` 네트워크를 통해 연결된다.

애플리케이션 코드는 중요하지 않으므로 이 글에선 다루지 않는다. 편의상 리액트 애플리케이션을 프론트엔드 서비스, 스프링 애플리케이션을 백엔드 서비스라고 부른다. 두 서비스는 사용자에게 다음과 같은 기능을 제공한다.

- 브라우저를 통해 `TODO` 항목을 등록한다.
  - 새로운 `TODO` 항목은 프론트엔드 서비스에 전달된다.
  - `nginx` 프록시 패스 설정에 따라 백엔드 서비스로 요청이 전달된다.
  - 새로운 `TODO` 항목은 백엔드 서비스에 저장된다.
- 브라우저에서 이전에 등록한 `TODO` 항목들을 보여준다.
  - `TODO` 항목들을 프론트엔드 서비스에 요청한다.
  - `nginx` 프록시 패스 설정에 따라 백엔드 서비스로 요청이 전달된다.
  - 백엔드 서비스는 저장하고 있는 `TODO` 항목들을 응답으로 반환한다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/docker-network-03.png" width="100%" class="image__border">
</div>

### 3.1. Create Custom Bridge

우선 드라이버 종류가 브릿지인 네트워크를 생성한다.

```
$ docker network create custom-bridge

9b5ae49f9a0244a893ad878b8a95fb09b658ec876ec9dcf6ef408dd1c153a03a
```

네트워크가 잘 생성됐는지 확인한다.

```
$ docker network ls

NETWORK ID     NAME            DRIVER    SCOPE
d8cd79053c56   bridge          bridge    local
9b5ae49f9a02   custom-bridge   bridge    local
969819b69df5   host            host      local
2e7d396ba961   none            null      local
```

### 3.2. Connect Backend Container to Custom Bridge

백엔드 컨테이너를 실행하고, 커스텀 브릿지에 연결해보자. 먼저 백엔드 컨테이너 이미지를 생성한다.

```
$ docker build -t backend ./backend
```

백엔드 컨테이너를 실행한다.

```
$ docker run -d -p 8080:8080 --name backend backend

3b4e0a33065581f7df7b9be505b6a356981d1014face0e341130640835aaf212
```

백엔드 컨테이너를 커스텀 브릿지에 연결한다.

```
$ docker network connect custom-bridge backend
```

커스텀 브릿지의 상세 정보를 확인한다. `Containers` 항목에 백엔드 컨테이너가 포함된 것을 확인할 수 있다.

```
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

프론트엔드 컨테이너를 실행할 때 커스텀 브릿지에 연결한다. 앞선 예제와 동일하게 프론트엔드 컨테이너 이미지를 만든다.

```
$ docker build -t frontend ./frontend
```

`--network` 옵션을 사용하면 컨테이너를 실행하면서 네트워크에도 연결할 수 있다.

```
$ docker run -d -p 80:80 --name frontend --network custom-bridge frontend

a68957f36c09410c0a360668ecdc2ac7fe35912ddd5cbc86a6b98f1c32a25bf9
```

커스텀 브릿지의 상세 정보를 다시 확인한다. `Containers` 항목에 프론트엔드 컨테이너가 포함된 것을 확인할 수 있다.

```
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

`http://localhost:80`에 접속해 새로운 `TODO` 항목들을 추가하고, 새 탭에서 다시 접속해 앞서 등록한 항목들이 조회되는지 확인해보자.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/docker-network-04.gif" width="100%" class="image__border">
</div>

## 4. Restriction of Default Bridge

`--network` 옵션 없이 컨테이너를 실행하면 기본으로 만들어져 있는 디폴트 브릿지 네트워크에 자동으로 연결된다.

```
$ docker run -d -p 8080:8080 --name backend backend

f8710dab02f3e2fa62f5805afa11c58fe093f64f2a8865e509257728a0c88a02
```

디폴트 브릿지 네트워크를 살펴보면 방금 실행한 `backend` 컨테이너를 확인할 수 있다.

```
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

컨테이너가 자동으로 디폴트 브릿지 네트워크에 연결된다면 별도 네트워크 작업 없이 프론트엔드 컨테이너를 실행만 해도 백엔드 컨테이너와 연결될 것이라 생각했다.

> 왜 사용자 지정 네트워크를 별도로 만들지?

실제로 프론트엔드 컨테이너를 디폴트 브릿지에 연결하면 백엔드 컨테이너와 통신이 되지 않는다. 디폴트 브릿지에 연결된 컨테이너끼리는 IP 주소로만 통신할 수 있기 때문이다. 도커 공식 문서를 보면 다음과 같은 설명이 있다.

> Containers on the default bridge network can only access each other by IP addresses, unless you use the --link option,
> which is considered legacy.
> On a user-defined bridge network, containers can resolve each other by name or alias.

사용자 정의 브릿지를 사용해야 컨테이너들을 이름이나 별칭(alias)으로 호출할 수 있다. 프론트엔드 컨테이너에서 호스팅하는 애플리케이션은 `nginx` 서버를 사용해 서비스한다. 아래 `nginx` 설정은 백엔드 컨테이너를 `backend`라는 이름으로 호출하기 때문에, 디폴트 브릿지에서는 이 이름을 찾지 못한다.

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

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-09-30-docker-network>

#### REFERENCE

- [Docker in Action][docker-in-action-link]
- <https://www.daleseo.com/docker-networks/>
- <https://docs.docker.com/network/>
- <https://docs.docker.com/network/bridge/#differences-between-user-defined-bridges-and-the-default-bridge>

[docker-in-action-link]: https://www.manning.com/books/docker-in-action-second-edition
