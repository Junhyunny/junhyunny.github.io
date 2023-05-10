---
title: "Forward/Reverse Proxy"
search: false
category:
  - information
last_modified_at: 2023-05-07T23:55:00
---

<br/>

## 1. Proxy Server

> 프록시 서버(proxy server)는 클라이언트가 자신을 통해 다른 네트워크 서비스에 간접적으로 접속할 수 있게 해 주는 컴퓨터 시스템이나 응용 프로그램을 말합니다.

프록시 서버는 클라이언트(client)와 서버(server) 사이에 중개자 역할을 수행합니다. 
클라이언트가 서버 사이에 위치하여 둘 사이의 통신을 중개합니다. 
직접적인 통신이 아니라 프록시를 거쳐가는 이유는 보안, 성능, 안정성 등을 향상시키기 위해 사용합니다. 

<p align="center">
    <img src="/images/forward-reverse-proxy-1.JPG" width="80%" class="image__border">
</p>
<center>https://surfshark.com/ko/blog/proxy-server</center>

## 2. Proxy Server Based on Location

네트워크 상에서 프록시 서버의 위치가 어디에 있는지에 따라 이를 구분하여 사용합니다. 
프록시 서버 구성에 따라 얻는 장점이 다릅니다.

### 2. Forward Proxy

* 포워드 프록시(forward proxy)는 클라이언트 기기들과 연결됩니다.
* 클라이언트들의 요청은 포워드 프록시에게 전달되고, 포워드 프록시는 인터넷을 통해 서버에게 요청을 전달합니다.
* 서버는 포워드 프록시의 주소는 알지만, 클라이언트들의 주소는 알 수 없습니다.
* 자주 사용하는 데이터는 캐싱(caching)하여 클라이언트들의 성능을 향상시킬 수 있습니다.
    * 프록시 서버를 도입하게 된 목적은 인터넷 속도의 향상을 도모하기 위함이었습니다.
* 클라이언트들이 접근할 수 있는 서비스 목록을 제어할 수 있습니다.
    * 보안이 중요한 사내망(내부망)에선 프록시 서버를 통해 회사 내부 컴퓨터들을 통해 접근할 수 있는 서버 목록을 제어합니다.

<p align="center">
    <img src="/images/forward-reverse-proxy-2.JPG" width="80%" class="image__border">
</p>
<center>https://surfshark.com/ko/blog/proxy-server</center>

### 3. Reverse Proxy

* 리버스 프록시(reverse proxy)는 서버들과 연결됩니다.
* 클라이언트들의 요청이 인터넷을 통해 전달되면 리버스 프록시가 대신 전달받고, 서버에게 요청을 전달합니다.
* 클라이언트들은 리버스 프록시의 주소는 알지만, 실제 서버의 주소는 알 수 없습니다.
* 하나의 서버와 여러 개의 서브 도메인을 사용해 여러 개의 서비스를 운영할 수 있습니다.
    * 신규 기능 배포 시에도 리버스 프록시 뒤에 숨은 서비스를 하나씩 변경함으로써 사용자들에게 무중단 서비스가 가능합니다.
* 로드 밸런싱을 통한 요청 분배가 가능합니다.
* DDoS 같은 공격으로부터 실제 리소스 서버들을 보호합니다.
* 캐싱을 통해 성능을 향상시킬 수 있습니다.
    * 포워드 프록시처럼 서버의 응답을 캐싱합니다.
* 작은 SSL 암호화 구간을 적용하여 성능을 향상시킬 수 있습니다.
    * 인터넷은 보안상 위험하기 때문에 암호화 된 패킷을 사용해야 합니다.
    * 내부망은 비교적 안전하기 때문에 일반 패킷을 사용할 수 있습니다.     
    * 리버스 프록시에서만 SSL 암복호화가 이뤄지면 프록시에 붙은 내부 서버들은 암복호화에 대한 비싼 연산이 없이도 통신이 가능합니다. 

<p align="center">
    <img src="/images/forward-reverse-proxy-3.JPG" width="80%" class="image__border">
</p>
<center>https://surfshark.com/ko/blog/proxy-server</center>

#### RECOMMEND NEXT POSTS

* [Firewall][firewall-link]
* [DMZ in Network][dmz-in-network-link]
* [Using Nginx as Reverse Proxy][using-nginx-as-reverse-proxy-link]

#### REFERENCE

* <https://surfshark.com/ko/blog/proxy-server>
* <https://nordvpn.com/ko/blog/proxy-versus-vpn/>
* <https://jungin.tistory.com/4>
* <https://hudi.blog/forward-proxy-reverse-proxy/>

[firewall-link]: https://junhyunny.github.io/information/firewall/
[dmz-in-network-link]: https://junhyunny.github.io/information/dmz-in-network/
[using-nginx-as-reverse-proxy-link]: https://junhyunny.github.io/nginx/spring-boot/docker/docker-compose/using-nginx-as-reverse-proxy/