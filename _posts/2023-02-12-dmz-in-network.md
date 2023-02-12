---
title: "DMZ in Network"
search: false
category:
  - information
last_modified_at: 2023-02-12T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Firewall][firewall-link]
* [Open Firewall of Linux][open-firewall-of-linux-link]

## 0. 들어가면서

이번 프로젝트에선 네트워크 관련된 이슈들이 많았습니다. 
네트워크 구성이나 관련 용어들에 익숙치 않다면 문제의 원인을 파악하는 데 어려움을 겪습니다. 
네트워크를 담당하는 인프라 팀과의 의사 소통도 문제가 되므로 기본적인 개념들에 대해선 정리할 필요가 있다는 생각이 들었습니다. 
이번 포스트에선 `DMZ`에 대한 내용을 다뤘습니다. 

## 1. DMZ(Demilitarized Zone)

네트워크는 개방 여부에 따라 두 가지로 구분됩니다.

* 개방 네트워크(public network)
    * 외부 네트워크를 의미하며 보안상 신뢰할 수 없는 네트워크입니다.
* 사설 네트워크(private network)
    * 내부 네트워크를 의미하며 보안상 신뢰할 수 있는 네트워크입니다.

신뢰할 수 없는 외부 네트워크와 내부 네트워크 사이의 연결은 방화벽(firewall)을 통해 제어됩니다. 
방화벽은 서로 다른 신뢰 수준을 가진 두 네트워크 사이에서 내부 네트워크를 외부 네트워크로부터 보호하기 위해 데이터 교환을 허용, 거부합니다. 
외부에서 내부로의 접근이 방화벽에 의해 모두 차단되면 내부 네트워크에 위치한 서비스를 외부에서 이용할 수 없습니다. 
편의를 위해 직접 접근을 허용한다면 예상치 못한 보안 문제가 발생할 수 있습니다. 
이런 문제를 해결하기 위해 `DMZ(Demilitarized Zone)`을 구축합니다. 

`DMZ`는 두 네트워크 사이에 위치한 서브넷(subnet)입니다. 
기본적으로 다음과 같은 구조로 설계됩니다. 

* `DMZ` 영역은 외부 네트워크에 서비스를 제공합니다.
    * 외부 네트워크에서 직접 접근이 가능한 영역입니다.
    * 반대로 `DMZ` 영역에서 외부 네트워크로 접근도 가능합니다.
    * 메일, 웹, FTP, DNS 서버처럼 잘 알려진(well known) 포트를 사용하는 서비스들이 위치합니다.
* `DMZ` 영역에서 내부 네트워크로의 접근은 불가능합니다.
    * `DMZ`에서 내부 네트워크에 접근하지 못하기 때문에 외부에서 `DMZ`를 통해 내부로 접근할 수 없습니다.
    * 외부 네트워크에서 내부 네트워크로 직접 접근할 수 없기 때문에 내부망은 위협적인 공격으로부터 보호됩니다. 
    * 외부 네트워크에서 접근하는 사용자는 필요한 기능들을 `DMZ` 영역에 위치한 서버로부터 제공 받을 수 있습니다.
* 내부 네트워크에서 `DMZ` 영역으로 접근이 가능합니다.
    * 내부망에서 `DMZ` 영역에 필요한 자원을 올리는 등의 작업을 수행할 때 `DMZ` 연결이 필요할 수 있습니다.
    * 내부망에서 `DMZ` 영역의 `SMTP` 서버로 메일을 보낼 수 있습니다.
    * 내부망에서 `DMZ` 영역의 `FTP` 서버로부터 필요한 자원을 다운 받을 수 있습니다.
* 내부 네트워크에서 외부 네트워크로 접근이 가능합니다.
    * 내부망에서 프로그램 설치, 보안 패치 등의 작업을 수행할 때 외부 네트워크 연결이 필요할 수 있습니다.

<p align="center">
    <img src="/images/dmz-in-network-1.JPG" width="80%" class="image__border">
</p>
<center>https://m.blog.naver.com/innoviss/222246852119</center>

## 2. Firewall Policies

다음과 같은 위치에 방화벽이 존재합니다.

* 외부 네트워크와 `DMZ` 영역 사이
* `DMZ` 영역과 내부 네트워크 사이

일반적인 `DMZ` 영역을 구축할 때 방화벽 정책은 다음과 같습니다.

* 외부 네트워크에서 `DMZ` 영역 접근 - `ALLOW`
    * 외부 네트워크에서 필요한 사내 서비스를 사용할 수 있습니다.
* 외부 네트워크에서 내부 네트워크 접근 - `DENY`
    * 외부 네트워크에서 내부 네트워크로의 공격을 방어합니다.
* `DMZ` 영역에서 내부 네트워크 접근 - `DENY`
    * `DMZ` 영역을 거쳐 우회한 악의적인 접근을 제한합니다.
* 내부 네트워크에서 `DMZ` 영역 접근 - `ALLOW`
* 내부 네트워크에서 외부 네트워크 접근 - `ALLOW`

<p align="center">
    <img src="/images/dmz-in-network-2.JPG" width="80%" class="image__border">
</p>
<center>https://www.uname.in/232</center>

#### REFERENCE

* <https://ko.wikipedia.org/wiki/비무장지대_(컴퓨팅)>
* <https://www.lesstif.com/ws/%EB%84%A4%ED%8A%B8%EC%9B%8C%ED%81%AC-%EB%B6%84%ED%95%A0-43843989.html>
* <https://velog.io/@ko1586/Firewall-DMZ-%EB%AD%94%EB%8D%B0>
* <https://m.blog.naver.com/innoviss/222246852119>
* <https://www.uname.in/232>
* <https://brunch.co.kr/@ka3211/2>
* <https://brunch.co.kr/@ka3211/4>

[firewall-link]: https://junhyunny.github.io/information/firewall/
[open-firewall-of-linux-link]: https://junhyunny.github.io/information/open-firewall-of-linux/