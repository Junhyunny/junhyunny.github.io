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

* 외부 네트워크에서 내부 네트워크로 직접 접근할 수 없습니다.
    * 내부망은 외부 네트워크로부터의 위협적인 공격으로부터 보호됩니다. 
* `DMZ` 영역에 위치한 서버들은 외부 네트워크에 서비스를 제공합니다.
    * 외부 네트워크에서 직접 접근이 가능한 영역입니다.
    * `DMZ` 영역에서 외부 네트워크로의 접근도 가능합니다.
    * 메일, 웹, FTP, DNS 서버처럼 잘 알려진(well known) 포트를 사용하는 서비스들이 위치합니다.
* `DMZ` 영역에 위치한 서버들은 내부 네트워크로 접근할 수 없습니다.
    * `DMZ`에서 내부 네트워크에 접근하지 못하기 때문에 외부에서 `DMZ`를 통해 내부로 우회 접근할 수 없습니다.
* 내부 네트워크에 위치한 호스트들은 `DMZ` 영역으로 접근할 수 있습니다.
    * 내부망에서 `DMZ` 영역에 필요한 자원들을 업로드 할 수 있습니다.
    * 내부망에서 `DMZ` 영역에 위치한 자원들을 다운로드 할 수 있습니다.
* 내부 네트워크에 위치한 호스트들은 외부 네트워크로 접근할 수 있습니다.
    * 내부망에서 프로그램 설치, 보안 패치 등의 작업을 수행할 때 외부 네트워크 연결이 필요할 수 있습니다.

<p align="center">
    <img src="/images/dmz-in-network-1.JPG" width="80%" class="image__border">
</p>
<center>https://m.blog.naver.com/innoviss/222246852119</center>

## 2. Firewall Policies

방화벽은 다음과 같은 위치에 존재합니다.

* 외부 네트워크와 `DMZ` 영역 사이
* `DMZ` 영역과 내부 네트워크 사이

간단한 사례를 통해 `DMZ` 영역과 방화벽 정책에 대해 알아보겠습니다. 
구체적인 요구사항에 따라 방화벽 정책을 정의하지만, 이번 포스트에선 개념 이해를 위한 간단한 사례만 살펴보겠습니다. 

방화벽은 다음과 같은 방향으로의 접근은 막습니다.  

* 외부 네트워크에서 내부 네트워크 접근
    * 외부 네트워크에서 직접 내부 네트워크로의 접근은 제한합니다.
* `DMZ` 영역에서 내부 네트워크 접근
    * `DMZ` 영역을 거쳐 우회한 악의적인 접근을 제한합니다.

방화벽은 다음과 같은 방향으로의 접근은 허용합니다.  

* 외부 네트워크에서 `DMZ` 영역 접근
    * 외부 네트워크에서 필요한 사내 서비스를 사용할 수 있습니다.
    * 외부 네트워크에서 접속한 재택 근무자는 사내 이메일 계정으로 메일을 전송 할 수 있습니다.
    * 일반 시청자들은 VOD 서버에서 영상 검색과 시청이 가능합니다.
* 내부 네트워크에서 `DMZ` 영역 접근
    * 내부 네트워크에서 인터넷 사용 시 `DMZ` 영역에 위치한 `DNS 서버`로부터 주소를 전달 받습니다.
    * 회사 내부에서 업무용 이메일을 보내고, 재택 근무나 출장 중에도 이를 볼 수 있어야 합니다.
    * 회사 외부에서 업로드 한 파일을 회사 내부에서 다운로드 받아 사용할 수 있어야 합니다.
* 내부 네트워크에서 외부 네트워크 접근
    * 내부망에서 프로그램 설치, 보안 패치 등의 작업을 수행하기 위해 접근 허용합니다.

<p align="center">
    <img src="/images/dmz-in-network-2.JPG" width="80%" class="image__border">
</p>
<center>https://brunch.co.kr/@ka3211/4</center>

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