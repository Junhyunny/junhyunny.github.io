---
title: "DNS and AWS Route53"
search: false
category:
  - information
  - dns
  - aws
  - route53
last_modified_at: 2025-01-21T23:55:00
---

<br/>

## 0. 들어가면서

최근 사설 도메인 주소를 AWS 클라우드 서비스에 연결하는 작업을 했다. 도메인을 연결하면서 DNS 개념이나 AWS Route53 서비스가 지원하는 레코드 타입 등에 대해서 다시 찾아봤다. 이 참에 도메인 연결 작업을 수행할 때 필요한 개념들을 개인 블로그에 정리한다.

## 1. DNS(Domain Name System)

도메인 이름 시스템(DNS)는 사람이 이해하기 쉬운 도메인 이름을 컴퓨터가 이해할 수 있는 주소로 변환해주는 역할을 수행하는 시스템이다. 서버의 IP 주소를 일일이 기억하고 있는 사람은 없을 것이다. 예를 들어, 도메인 이름은 `google.com`이고 이에 해당하는 IP 주소는 `142.250.206.206`이다. 터미널에서 ping 명령어를 사용하면 해당 도메인 이름의 IP 주소를 확인할 수 있다.

```
$ ping google.com

PING google.com (142.250.206.206): 56 data bytes
64 bytes from 142.250.206.206: icmp_seq=0 ttl=116 time=33.210 ms
64 bytes from 142.250.206.206: icmp_seq=1 ttl=116 time=37.520 ms
```

### 1.1. Domain hierarchy structure

도메인 이름 시스템은 어떻게 동작하는지 알아보자. 우선 도메인 주소의 구조를 살펴봐야 한다. 주소는 여러 레벨의 주소로 구성되어 있다. 

- TLD(Top Level Domain) 
  - 도메인 이름의 최상위 계층으로 도메인의 종류나 지역을 나타낸다.
  - .com, .org, .net, .kr, .jp .us 등
- SLD(Second Level Domain)
  - TLD 바로 아래 위치하는 도메인 이름으로 주로 브랜드나 기관 이름을 나타낸다.
  - google, naver 등
- Subdomain
  - SLD 하위 계층 도메인이다. 도메인을 세분화하여 특정 서비스를 지정한다.
  - `mail.google.com`이라는 도메인 이름에서 `mail`

<div align="center">
  <img src="/images/posts/2025/dns-and-aws-route53-01.png" width="100%" class="image__border">
</div>

### 1.2. Domain name server

위에서 살펴본 것처럼 도메인은 계층 구조가 있다. 

- 루트를 기준으로 바로 하위에 TLD가 존재한다.
  - 국가 코드 도메인(ccTLD)
  - 일반 도메인(gTLD)
  - 새로운 일반 도메인(new gTLD)
- TLD 하위에 2단계, 3단계 도메인 순으로 트리가 깊어질수록 단계가 커진다.

<div align="center">
  <img src="/images/posts/2025/dns-and-aws-route53-02.png" width="100%" class="image__border">
</div>
<center>https://better-together.tistory.com/128</center>

<br/>

도메인 계층 구조를 살펴본 이유는 도메인 이름 시스템은 계층 구조를 따르는 네임 서버가 사용되기 때문이다. 브라우저에서 `exmample.com`을 입력하는 경우 어떤 흐름이 발생할까?

1. 사용자가 브라우저에 `example.com` 도메인을 입력한다. 로컬 호스트에서 관리 중인 캐시 정보를 우선 확인한다.
2. 로컬 DNS 서버에 example.com 도메인의 IP 주소를 질의한다. 
3. 로컬 DNS 서버에 IP 주소가 없는 경우 루트 DNS 서버에 example.com 도메인의 IP 주소를 질의한다. `.com` TLD 도메인의 주소를 관리하는 TLD DNS 서버 IP 주소를 알려준다.
4. .com TLD 도메인의 주소를 관리하는 TLD DNS 서버에 example.com 도메인의 IP 주소를 질의한다. `example.com` SLD 도메인의 주소를 관리하는 SLD DNS 서버 IP 주소를 알려준다.
5. example.com SLD 도메인의 주소를 관리하는 SLD DNS 서버에 example.com 도메인의 IP 주소를 질의한다. `example.com` 도메인의 IP 주소를 반환한다.

<div align="center">
  <img src="/images/posts/2025/dns-and-aws-route53-03.png" width="100%" class="image__border">
</div>
<center>https://velog.io/@combi_jihoon/Route53</center>

<br/>

위 이미지에서 보이듯 로컬 캐시, DNS 서버도 여러 개 존재한다. 각 구성 요소에 대해 살펴보자.

- 로컬 DNS 캐시
  - 브라우저나 운영체제에 내장된 메모리다. 네트워크에서 자주 요청되는 DNS 정보를 저장한다.
- 로컬 DNS 서버
  - 사용자가 속한 인터넷 서비스 제공자(ISP, internet service provider)나 회사 네트워크에서 제공하는 DNS 서버다.
  - 요청 결과를 일정 기간 동안 캐싱하여 재사용한다.
  - 사용자의 DNS 요청을 가장 먼저 처리하고, 필요하다면 루트 DNS 서버로 요청을 전달한다.
- 루트 DNS 서버
  - DNS 계층 구조의 최상단에 위치한 서버로 모든 도메인 이름 시스템의 시작점이다.
  - TLD 네임 서버의 주소를 제공한다.
- TLD DNS 서버
  - 특정 TLD(e.g. .com, .kr, .org) 도메인 이름 정보를 관리하는 서버다.
- SLD DNS 서버
  - SLD 도메인과 관련된 정보를 관리하는 네임 서버다.
- Authorittative DNS 서버
  - 특정 도메인에 대한 최종 정보를 가진 DNS 서버다.
  - 도메인의 IP 주소 또는 기타 DNS 레코드(e.g. A, CNAME)를 제공한다.
  - 최종적인 IP 주소를 반환하여 클라이언트의 요청을 완료한다.

## 2. AWS Route53

Route53는 AWS의 DNS 웹 서비스다. 사용자의 요청을 AWS 혹은 온프레미스에서 실행되는 애플리케이션에 연결한다. AWS Route53는 도메인 이름 시스템에서 `Authorittative DNS 서버` 역할을 수행한다. Route53는 두 개의 호스트 영역이 있다. 

- 공용 호스트 영역 (Public Hosted Zone)
  - 인터넷에 노출된 도메인 이름과 해당 DNS 레코드를 관리한다.
- 사설 호스트 영역 (Private Hosted Zone)
  - AWS VPC(virtual private cloud) 내부에서만 작동하는 도메인 이름을 관리한다.
  - 인터넷에 노출되지 않고, VPC 내부 리소스에 대한 이름 해석에 사용된다.

<div align="center">
  <img src="/images/posts/2025/dns-and-aws-route53-04.png" width="100%" class="image__border">
</div>
<center>https://velog.io/@combi_jihoon/Route53</center>

<br/>

Route53를 사용할 때 인터넷 연결이 필요하다면 공용 호스트 영역을 사용해야 한다. Route53을 사용하면 도메인 구매도 가능하지만, 외부 도메인 구매 대행 서비스를 통해 구매한 도메인과 연결하는 것도 가능하다. 만약, 서드파티(3rd party) 도메인 구매 대행 서비스를 사용했다면 다음과 같은 과정을 거친다.

1. 도메인 구매 대행 서비스를 통해 도메인을 구매한다.
2. 구매한 도메인은 자동으로 TLD DNS 서버와 동기화 된다.

<div align="center">
  <img src="/images/posts/2025/dns-and-aws-route53-05.png" width="100%" class="image__border">
</div>

<br/>

Route53에서 공용 호스트 영역을 하나 생성하면 다음과 같은 레코드 두 개가 기본적으로 생성된다. 레코드 타입에 대한 내용은 다음 글로 다시 자세히 정리할 예정이다.

- NS 레코드(Name Server Record)
  - 특정 도메인의 네임 서버를 지정한다.
  - 도메인의 DNS 정보를 관리하는 서버를 가리킨다.
- SOA 레코드(Start of Authority Record)
  - 특정 도메인의 시작 지점(start of authority)를 정의한다.
  - 도메인에 대한 주요 정보를 포함하며, DNS 영역 관리에 사용된다.
  - 도메인과 관련된 기본 네임 서버를 지정하고, 도메인 정보가 업데이트 되는 빈도, 캐싱 시간, 관리 책임자 이메일 등 메타 데이터를 제공한다.

<div align="center">
  <img src="/images/posts/2025/dns-and-aws-route53-06.png" width="100%" class="image__border">
</div>

<br/>

NS 레코드엔 4개의 DNS 네임 서버 정보가 지정되어 있다. 서드파티에서 도메인 구매한 경우 AWS의 DNS 네임 서버와 연결하기 위해선 서드파티 사이트에 AWS DNS 네임 서버 정보를 등록해야 한다. 필자가 사용한 GoDaddy 서비스를 찾아보면 구매한 도메인에 다른 DNS 네임 서버를 등록할 수 있는 화면을 볼 수 있다. 해당 화면에서 AWS Route53의 NS 레코드 정보를 등록하면 된다.

<div align="center">
  <img src="/images/posts/2025/dns-and-aws-route53-07.png" width="80%" class="image__border">
</div>
<center>https://m.blog.naver.com/mogulist/221761776783</center>

<br/>

whois 명령어를 사용하면 해당 도메인에 연결된 DNS 네임 서버 정보와 메타 데이터를 확인할 수 있다.

```
$ whois google.com

% IANA WHOIS server
% for more information on IANA, visit http://www.iana.org
% This query returned 1 object

refer:        whois.verisign-grs.com

domain:       COM

organisation: VeriSign Global Registry Services
address:      12061 Bluemont Way
address:      Reston VA 20190
address:      United States of America (the)

contact:      administrative
name:         Registry Customer Service
organisation: VeriSign Global Registry Services
address:      12061 Bluemont Way
address:      Reston VA 20190
address:      United States of America (the)
phone:        +1 703 925-6999
fax-no:       +1 703 948 3978
e-mail:       info@verisign-grs.com

contact:      technical
name:         Registry Customer Service
organisation: VeriSign Global Registry Services
address:      12061 Bluemont Way
address:      Reston VA 20190
address:      United States of America (the)
phone:        +1 703 925-6999
fax-no:       +1 703 948 3978
e-mail:       info@verisign-grs.com

nserver:      A.GTLD-SERVERS.NET 192.5.6.30 2001:503:a83e:0:0:0:2:30
nserver:      B.GTLD-SERVERS.NET 192.33.14.30 2001:503:231d:0:0:0:2:30
nserver:      C.GTLD-SERVERS.NET 192.26.92.30 2001:503:83eb:0:0:0:0:30
nserver:      D.GTLD-SERVERS.NET 192.31.80.30 2001:500:856e:0:0:0:0:30
nserver:      E.GTLD-SERVERS.NET 192.12.94.30 2001:502:1ca1:0:0:0:0:30
nserver:      F.GTLD-SERVERS.NET 192.35.51.30 2001:503:d414:0:0:0:0:30
nserver:      G.GTLD-SERVERS.NET 192.42.93.30 2001:503:eea3:0:0:0:0:30
nserver:      H.GTLD-SERVERS.NET 192.54.112.30 2001:502:8cc:0:0:0:0:30
nserver:      I.GTLD-SERVERS.NET 192.43.172.30 2001:503:39c1:0:0:0:0:30
nserver:      J.GTLD-SERVERS.NET 192.48.79.30 2001:502:7094:0:0:0:0:30
nserver:      K.GTLD-SERVERS.NET 192.52.178.30 2001:503:d2d:0:0:0:0:30
nserver:      L.GTLD-SERVERS.NET 192.41.162.30 2001:500:d937:0:0:0:0:30
nserver:      M.GTLD-SERVERS.NET 192.55.83.30 2001:501:b1f9:0:0:0:0:30
ds-rdata:     19718 13 2 8acbb0cd28f41250a80a491389424d341522d946b0da0c0291f2d3d771d7805a

whois:        whois.verisign-grs.com

status:       ACTIVE
remarks:      Registration information: http://www.verisigninc.com

created:      1985-01-01
changed:      2023-12-07
source:       IANA

...

>>> Last update of WHOIS database: 2025-01-21T16:34:48+0000 <<<
```

#### REFERENCE

- <https://itguny04.tistory.com/25>
- <https://extrememanual.net/7168>
- <https://domainwheel.com/second-level-domains/#gref>
- <https://better-together.tistory.com/128>
- <https://brunch.co.kr/@topasvga/49>
- <https://m.blog.naver.com/mogulist/221761776783>