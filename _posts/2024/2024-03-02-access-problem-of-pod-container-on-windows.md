---
title: "Access Problem of Podman Container on Windows"
search: false
category:
  - podman
  - windows
last_modified_at: 2024-03-02T23:55:00
---

<br/>

## 0. 들어가면서

현재 프로젝트 운영 환경은 다음과 같다.

- 온-프레미스(on-premise) 서버
- 윈도우(Windows) 운영체제
- 컨테이너 런타임 사용
- 사내(company internal) 네트워크

서비스를 릴리즈하기 전까진 도커 데스크탑을 사용했지만, 라이센스 문제 때문에 컨테이너 런타임을 파드맨(podman)으로 변경했다. 파드맨으로 런타임을 변경한 이후 외부에서 컨테이너에 접근할 수 없는 문제가 발생했다. 이번 글은 관련된 문제를 해결한 방법에 대해 정리했다.

## 1. Problem Context

문제 상황을 간단하게 재현해보자. `PowerShell`에서 파드맨으로 호스트 80 포트와 연결된 nginx 컨테이너를 실행한다.

```
> podman run -p 80:80 -d nginx
e464459033f4548051bfaad2b2a2a5f54db117f7721e45ec3b62871efe354e55
```

외부 네트워크와 연결된 IP를 확인해보자. 

```
> ipconfig

Windows IP 구성

... 

무선 LAN 어댑터 Wi-Fi:

   연결별 DNS 접미사. . . . :
   링크-로컬 IPv6 주소 . . . . : fe80::2637:7a15:232c:853%6
   IPv4 주소 . . . . . . . . . : 192.168.0.12
   서브넷 마스크 . . . . . . . : 255.255.255.0
   기본 게이트웨이 . . . . . . : 192.168.0.1
...

이더넷 어댑터 vEthernet (WSL (Hyper-V firewall)):

   연결별 DNS 접미사. . . . :
   링크-로컬 IPv6 주소 . . . . : fe80::414b:a2c4:8a4e:d80c%31
   IPv4 주소 . . . . . . . . . : 172.28.240.1
   서브넷 마스크 . . . . . . . : 255.255.240.0
   기본 게이트웨이 . . . . . . :
```

외부 네트워크와 연결된 IP 주소는 `192.168.0.12`이다. 이 IP 주소를 사용해 애플리케이션에 접근해보자. 

- `192.168.0.12`를 통해 애플리케이션으로 접근할 수 없다. 

<p align="center">
  <img src="/images/posts/2024/access-problem-of-pod-container-on-windows-01.png" width="80%" class="image__border">
</p>

- `localhost`나 `127.0.0.1` 호스트를 사용하면 애플리케이션에 접근할 수 있다.

<p align="center">
  <img src="/images/posts/2024/access-problem-of-pod-container-on-windows-02.png" width="80%" class="image__border">
</p>

## 2. Problem Cause

윈도우 운영체제에서 컨테이너 런타임은 WSL(Windows Subsystem for Linux) 환경에서 동작한다. WSL 명령어를 사용해 WSL 시스템의 IP 주소를 확인해보자. 

- WSL 시스템은 `172.28.241.140` IP 주소를 갖는다.
- `172.28.241.140` 주소를 사용하면 애플리케이션에 접근할 수 있다.

```
> wsl -d podman-machine-default ifconfig
eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.28.241.140  netmask 255.255.240.0  broadcast 172.28.255.255
        inet6 fe80::215:5dff:fe39:6fb2  prefixlen 64  scopeid 0x20<link>
        ether 00:15:5d:39:6f:b2  txqueuelen 1000  (Ethernet)
        RX packets 94646  bytes 138596998 (132.1 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 11840  bytes 947475 (925.2 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 3678  bytes 1071469 (1.0 MiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 3678  bytes 1071469 (1.0 MiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

podman0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.88.0.1  netmask 255.255.0.0  broadcast 10.88.255.255
        inet6 fe80::ce0:89ff:fe4b:7a5c  prefixlen 64  scopeid 0x20<link>
        ether 0e:e0:89:4b:7a:5c  txqueuelen 1000  (Ethernet)
        RX packets 89  bytes 9379 (9.1 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 103  bytes 10414 (10.1 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

veth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet6 fe80::d49d:ceff:fef2:3e0e  prefixlen 64  scopeid 0x20<link>
        ether d6:9d:ce:f2:3e:0e  txqueuelen 1000  (Ethernet)
        RX packets 90  bytes 10667 (10.4 KiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 118  bytes 11560 (11.2 KiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

윈도우 서버 네트워크 어댑터들 중 `이더넷 어댑터 vEthernet (WSL (Hyper-V firewall))`가 WSL 시스템이 속한 네트워크로 접근하는 게이트웨이(gateway) 주소로 보여진다. 파드맨은 호스트 서버의 서브 네트워크를 통해 들어온 트래픽을 WSL 시스템 내부로 직접 연결하지 못한다. 이해하기 쉽게 그림으로 설명하면 다음과 같다.

1. 파드맨으로 실행한 컨테이너는 WSL 시스템에서 동작 중이다. 
  - WSL 시스템은 `172.28.241.140` IP 주소를 갖는다. 
2. 외부 네트워크와 연결된 `192.168.0.12` IP 주소, 80 포트로 요청 트래픽이 들어온다.
3. 요청 트래픽은 `172.28.241.140` 시스템으로 자동으로 전달되지 못하고 누락된다.

<p align="center">
  <img src="/images/posts/2024/access-problem-of-pod-container-on-windows-03.png" width="80%" class="image__border">
</p>

## 3. Solve the Problem

도커도 파드맨과 마찬가지로 WSL 환경에서 동작한다. 하지만 도커는 윈도우 운영체제에서 실행될 때 함께 동작하는 부가적인 컴포넌트들 덕분인지 파드맨과 다르게 자동으로 트래픽이 연결된다. 도커와 다르게 파드맨을 사용할 때 트래픽 연결이 자동으로 되지 않는 이유는 확인이 필요하다. 

### 3.1. Podman Github Issue

해결 방법은 파드맨 이슈들을 읽어보니 찾을 수 있었다. 힌트가 된 글들은 다음과 같다.

- WSL 트래픽은 윈도우 애플리케이션과 별도의 네트워크 인터페이스에 분리되어 있다.
- 트래픽이 전달되는 로컬 호스트(localhost)를 통해 접근할 수 있다.
- 트래픽을 해당 WSL 리눅스 배포판 머신에 할당된 IP 주소로 포워딩(forwarding)해야 한다.
  - 이 주소는 임시적이고 변경될 수 있다.

<p align="center">
  <img src="/images/posts/2024/access-problem-of-pod-container-on-windows-04.png" width="80%" class="image__border">
</p>

### 3.2. Windows Port Forwarding

글에 첨부된 마이크로소프트 공식 문서 링크에서 WSL2 시스템의 애플리케이션과 포트 포워딩하는 방법에 대해 확인할 수 있다.

```
> netsh interface portproxy add v4tov4 listenport=<yourPortToForward> listenaddress=0.0.0.0 connectport=<yourPortToConnectToInWSL> connectaddress=(wsl hostname -I)
```

`wsl hostname -I` 위치에 `wsl -d podman-machine-default ifconfig` 명령어를 통해 확인한 IP 주소를 추가한다. 필자의 경우 다음과 같다. 해당 명령어는 PowerShell 관리자 모드에서만 수행할 수 있다. 

```
> netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=80 connectaddress=172.28.241.140
```

포트 포워딩 규칙이 정상적으로 등록되었는지 다음 명령어를 통해 확인할 수 있다.

```
> netsh interface portproxy show all

ipv4 수신 대기:             ipv4에 연결:

주소            포트        주소            포트
--------------- ----------  --------------- ----------
0.0.0.0         80          172.28.241.140  80
```

### 3.3. Result

외부 네트워크와 연결된 `192.168.0.12` IP 주소를 통해 애플리케이션에 접근할 수 있다.

<p align="center">
  <img src="/images/posts/2024/access-problem-of-pod-container-on-windows-05.png" width="80%" class="image__border">
</p>

## CLOSING

이 문제는 파드맨을 윈도우 운영체제에서 사용할 때 발생하는 것으로 보인다. 실제로 맥북(macbook)에서 테스트해보니 별다른 문제가 발생하지 않았다. 위 작업은 윈도우 서버 호스트로 들어온 트래픽을 WSL 시스템으로 연결하는 것이기 때문에 방화벽 작업은 별도로 진행해야 실제 외부에서 접근할 수 있다.

#### RECOMMEND NEXT POSTS

- <https://github.com/containers/podman/issues/12292>
- <https://github.com/containers/podman/issues/17030>
- <https://learn.microsoft.com/en-us/windows/wsl/networking>
- <https://blog.naver.com/sipzirala/220446175236>
- <https://www.tuwlab.com/ece/29011>

#### REFERENCE

- <https://learn.microsoft.com/en-us/windows/wsl/networking>
