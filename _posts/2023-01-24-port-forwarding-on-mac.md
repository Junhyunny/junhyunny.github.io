---
title: "Port Forwarding on Mac"
search: false
category:
  - information
last_modified_at: 2023-01-24T23:55:00
---

<br/>

## 1. Port Forwarding 

> Wikipedia<br/>
> 포트 포워딩(port forwarding) 또는 포트 매핑(port mapping)은 컴퓨터 네트워크에서 패킷(packet)이 라우터나 방화벽과 같은 네트워크 게이트웨이를 가로지르는 동안 하나의 IP 주소와 포트 번호 결합의 통신 요청을 다른 곳으로 넘겨주는 네트워크 주소 변환(NAT)의 응용이다. 

네트워크 패킷은 출발지(source)와 목적지(destination) 주소 정보를 모두 갖고 있습니다. 
네트워크 주소는 IP, 포트로 구성되어 있습니다. 
포트 포워딩은 라우터(router) 같은 네트워크 중간에 위치한 기기에서 전달받은 패킷을 목적지 포트 정보에 의거해 다른 목적지로 보내는 것을 의미합니다. 
중간에 주소가 바뀌기 때문에 네트워크 주소 변환(NAT, network address transfer) 기술의 응용으로 볼 수 있습니다. 

포트 포워딩을 사용하면 원격에 위치한 컴퓨터가 공개 인터넷 망을 거쳐 근거리 통신망(LAN) 내에 위치한 특정 컴퓨터나 서비스에 연결할 수 있습니다.  
다음과 같이 여러 가지 용도로 사용됩니다. 

* 원격으로 개인 네트워크(private network)에 위치한 특정 서버 혹은 서비스에 접근하는 경우
* 스마트 홈 기기를 가정용 네트워크에 연결하는 경우
* 원격 데스크톱 소프트웨어를 사용해 개인 컴퓨터에 접속하는 경우

##### How to Work Port Forwarding

포트 포워딩은 다음과 같은 방법으로 동작합니다. 

* 공유기 역할을 수행하는 라우터에 의해 사설(private) 네트워크가 구성됩니다. 
    * 내부 네트워크의 IP 대역은 `192.168.X.X`입니다.
* 공인(public) IP를 발급 받은 라우터가 요청 패킷을 전달받습니다. 
    * 라우터의 공인 IP는 `12.34.56.78`입니다.
    * 라우터의 내부 IP는 `192.168.0.1`입니다. 
* 공유기는 요청 패킷의 목적지 주소를 확인 후 사설 네트워크 내에 위치한 컴퓨터로 요청 패킷을 재전달합니다. 
    * 목적지 포트 번호가 80이면 사설 네트워크의 192.168.0.2 주소를 가진 컴퓨터의 80번 포트를 점유한 어플리케이션으로 패킷을 전달합니다. 
    * 목적지 포트 번호가 21이면 사설 네트워크의 192.168.0.3 주소를 가진 컴퓨터의 21번 포트를 점유한 FTF 서버 어플리케이션으로 패킷을 전달합니다.

<p align="center">
    <img src="/images/port-forwarding-on-mac-1.JPG" width="100%" class="image__border">
</p>
<center>https://lamanus.kr/59</center>

## 2. Practice

일반적인 컴퓨터 역시 라우터처럼 운영체제(OS, operating system)의 도움을 받아서 포트 포워딩이 가능합니다. 
최근에 작업했던 Mac PC의 포트 포워딩에 대한 내용을 바탕으로 이번 포스트를 정리하였습니다. 

### 2.1. Context for Practice

다음과 같은 실습 환경을 구축하였습니다.

* Mac 운영체제를 사용하는 호스트에서 3000번 포트를 사용하는 어플리케이션을 실행합니다.
    * 간단한 리액트(react) 어플리케이션을 실행합니다.
    * Mac 호스트의 IP는 `192.168.1.100`입니다.
* Windows 운영체제를 사용하는 클라이언트는 브라우저를 통해 호스트의 8080번 포트로 접근합니다.
    * 해당 요청이 정상적으로 3000번 포트의 어플리케이션으로 연결되었다면 리액트 메인 화면을 볼 수 있습니다.

<p align="center">
    <img src="/images/port-forwarding-on-mac-2.JPG" width="80%" class="image__border">
</p>

### 2.2. Check IP Address on Mac Host

해당 작업은 Mac 호스트에서 진행합니다. 

* `ifconfig` 명령어를 통해 자신이 사용하는 IP 주소를 확인합니다. 
* 다른 컴퓨터에서 접근할 수 있는 IP 주소를 사용하는 `en0` 네트워크를 사용합니다.

```
$ ifconfig       
lo0: flags=8049<UP,LOOPBACK,RUNNING,MULTICAST> mtu 16384
	options=1203<RXCSUM,TXCSUM,TXSTATUS,SW_TIMESTAMP>
	inet 127.0.0.1 netmask 0xff000000
	inet6 ::1 prefixlen 128
	inet6 fe80::1%lo0 prefixlen 64 scopeid 0x1
	nd6 options=201<PERFORMNUD,DAD>

...

en0: flags=8863<UP,BROADCAST,SMART,RUNNING,SIMPLEX,MULTICAST> mtu 1500
	options=6463<RXCSUM,TXCSUM,TSO4,TSO6,CHANNEL_IO,PARTIAL_CSUM,ZEROINVERT_CSUM>
	ether 88:66:5a:51:e3:e8
	inet6 fe80::14e0:10b2:2c77:37d4%en0 prefixlen 64 secured scopeid 0x6
	inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
	inet6 2001:2d8:f214:bfd5:4b6:7b16:1459:ac5d prefixlen 64 autoconf secured
	inet6 2001:2d8:f214:bfd5:1c72:46e1:4ff3:93f2 prefixlen 64 autoconf temporary
	nat64 prefix 64:ff9b:: prefixlen 96
	nd6 options=201<PERFORMNUD,DAD>
	media: autoselect
	status: active

...

```

### 2.3. Make Anchor File on Mac Host

해당 작업은 Mac 호스트에서 진행합니다.

* 포트 포워딩 정보가 적힌 앵커 파일을 생성합니다.
    * `/etc/pf.anchors` 경로에 생성합니다.
    * 파일 이름은 임의로 지정합니다.

```
$ cd /etc/pf.anchors

$ sudo vi com.junhyunny
```

`com.junhyunny` 파일에 다음과 같은 라우팅 정보를 작성합니다.

* `en0` 드라이버의 `inet` 주소로 들어오는 TCP 요청을 처리합니다.
* 출발지와 목적지는 상관하지 않습니다.`
* 포트 번호 80번으로 들어오는 요청을 처리합니다.
* 위 조건을 만족하는 요청 패킷은 로컬 호스트의 4000 포트로 재전달합니다.

```
rdr pass on en0 inet proto tcp from any to any port 8080 -> 192.168.1.100 port 3000
```

### 2.4. Apply Anchor File on Mac Host

해당 작업은 Mac 호스트에서 진행합니다.

* 이전 단계에서 작성한 앵커 파일을 적용합니다.
* `/etc/pf.conf` 파일을 다음과 같이 수정합니다.
* 새로운 `rdr-anchor`를 설정하고 라우팅 정보를 명시한 파일 경로를 지정합니다.

```
$ sudo vi /etc/pf.conf

scrub-anchor "com.apple/*"
nat-anchor "com.apple/*"
rdr-anchor "com.apple/*"

# here
rdr-anchor "junhyunny"

dummynet-anchor "com.apple/*"
anchor "com.apple/*"
load anchor "com.apple" from "/etc/pf.anchors/com.apple"

# here
load anchor "junhyunny" from "/etc/pf.anchors/com.junhyunny"
```

다음 명령어를 통해 포트 포워딩을 적용합니다.

```
$ sudo pfctl -ef /etc/pf.conf
pfctl: Use of -f option, could result in flushing of rules
present in the main ruleset added by the system at startup.
See /etc/pf.conf for further details.

No ALTQ support in kernel
ALTQ related functions disabled
pf enabled
```

### 2.5. Run React Application on Mac Host

Mac 호스트에서 리액트 어플리케이션을 실행합니다.

```
$ npm run start
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.100:3000

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
```

##### Result of Port Forwarding on Windows Client

Windows 클라이언트의 브라우저에서 `192.168.1.100:8080`로 접근합니다.

<p align="center">
    <img src="/images/port-forwarding-on-mac-3.gif" width="100%" class="image__border">
</p>

#### REFERENCE

* [포트 포워딩][wiki-port-forwarding-link]
* <https://en.wikipedia.org/wiki/Port_forwarding>
* <https://nordvpn.com/ko/blog/port-forwarding-vpn/>
* <https://lamanus.kr/59>
* <https://binaries.tistory.com/5>

[wiki-port-forwarding-link]: https://ko.wikipedia.org/wiki/%ED%8F%AC%ED%8A%B8_%ED%8F%AC%EC%9B%8C%EB%94%A9
