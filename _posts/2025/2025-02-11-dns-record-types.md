---
title: "DNS record types"
search: false
category:
  - information
last_modified_at: 2025-02-11T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [DNS and AWS Route53][dns-and-aws-route53-link]

## 0. 들어가면서

DNS(Domain Name System)를 구성하면 내부에 사용되는 다양한 레코드(record)들이 있다. ChatGPT 같은 도구를 사용하면 잘 정리해주기 때문에 모두 외우고 다닐 필요는 없지만, 레코드 타입에 따른 동작 방식을 잘 이해하기 위해 블로그에 정리했다. 

## 1. Record types

DNS 레코드는 도메인 이름과 IP 주소 및 기타 정보를 연결할 때 사용하는 데이터베이스 항목이다. AWS Route53에 호스팅 영역을 구축하면 아래와 같은 테이블에 각 레코드에 대한 타입을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2025/dns-record-types-01.png" width="100%" class="image__border">
</div>

<br/>

각 레코드 타입에 따라 사용하는 용도가 다르다. 예를 들어 VPC 내부 로드 밸런서에 연결하는 작업에는 `A` 레코드가 필요하고, 외부 DNS 서버 Route53 호스트 영역을 연결할 때는 `NS` 레코드가 필요하다. 각 레코드 타입에 따라 용도가 다르기 때문에 레코드 타입을 잘 이해하면 추후 시스템을 인티그레이션(integration)할 때 큰 어려움을 겪지 않을 수 있다. 

`A 레코드`는 도메인 이름을 IPv4 주소에 매핑한다. 예를 들어 example.com 도메인을 192.168.1.1 IP 주소로 연결한다. 존 파일(zone file)의 내용을 살펴보자. 

- 도메인 - example.com.
- TTL(time to live) - 3600초
- 인터넷 클래스 - IN
- 레코드 유형 - A
- 연결할 IP 주소 - 93.184.216.34

```
example.com.   3600   IN   A   93.184.216.34
```

`AAAA 레코드`는 도메인 이름을 IPv6 주소에 매핑한다. 예를 들어 example.com 도메인을 2001:0db8:85a3:0000:0000:8a2e:0370:7334 IP 주소로 연결한다.

- 도메인 - example.com.
- TTL - 3600초
- 인터넷 클래스 - IN
- 레코드 유형 - AAAA
- 연결할 IP 주소 - 2001:0db8:85a3:0000:0000:8a2e:0370:7334

```
example.com.   3600   IN   AAAA   2001:0db8:85a3:0000:0000:8a2e:0370:7334
```

`CNAME(Canonical Name) 레코드`는 도메인을 다른 도메인 이름으로 연결한다. 도메인 별명(alias)을 지어주는 것과 동일하다. 예를 들어 www.example.com 도메인을 example.com 도메인 주소로 연결하는 것이다. 도메인을 여러 개 사용하는 경우 CNAME 레코드를 통해 실제 서비스 접근 경로를 하나로 제어할 수 있지만, 클라이언트가 특정 도메인에 대한 IP 주소를 얻기 위해서 두 번의 요청을 주고 받아야 한다. 

<div align="center">
  <img src="/images/posts/2025/dns-record-types-02.png" width="100%" class="image__border">
</div>
<center>https://www.mailersend.com/blog/cname-record</center>

<br/>

`MX(Mail Exchanger) 레코드`는 이메일이 특정 도메인으로 전달될 때 어느 메일 서버로 전달해야 하는지 지정한다. 숫자로 우선 순위를 지정하고, 높은 우선 순위를 갖는 메일 서버로 메일을 전달한다.

- 도메인 - 이메일을 수신하는 도메인
- TTL - 3600초
- 인터넷 클래스 - IN
- 레코드 유형 - MX
- 연결할 IP 주소 - mail1.example.com.

```
example.com.    3600    IN    MX   10   mail1.example.com.
example.com.    3600    IN    MX   20   mail2.example.com.
```

`NS(Name Server) 레코드`는 도메인 이름 시스템에서 특정 도메인의 DNS 정보를 관리하는 네임 서버를 지정하는 레코드다. NS 레코드를 통해 접근하는 네임 서버는 해당 도메인의 모든 DNS 레코드(A, MX, TXT 등)를 제공한다. NS 레코드를 사용하면 상위 DNS 서버가 하위 도메인의 정보를 찾는 요청을 다른 네임 서버에 위임한다. 예를 들어 GoDaddy 같은 도메인 구매 서비스를 통해 구매한 example.com 도메인을 다루는 네임 서버를 AWS Route53으로 지정할 수 있다.

<div align="center">
  <img src="/images/posts/2025/dns-record-types-03.png" width="80%" class="image__border">
</div>
<center>https://m.blog.naver.com/mogulist/221761776783</center>

<br/>

`PTR(Pointer) 레코드`는 IP 주소를 도메인 이름으로 역변환하는 레코드다. 예를 들어 192.168.1.1 IP 주소를 example.com 도메인으로 연결한다.

- 도메인 - 1.168.192.in-addr.arpa.
- TTL - 3600초
- 인터넷 클래스 - IN
- 레코드 유형 - PTR
- 연결할 IP 주소 - example.com.

```
1.168.192.in-addr.arpa.   3600   IN   PTR   example.com.
```

`TXT(Text) 레코드`는 텍스트 정보를 저장하는 레코드다. 텍스트는 따옴표로 묶인 하나 이상의 문자열 형태로 저장된다. 원래는 사람을 읽을 수 있는 메모를 저장하거나 도메인 소유 인증인 SPF(Sender Policy Framework)이나 DKIM(DomainKeys Identified Mail) 등에 사용된다. 아래는 메일을 보낼 수 있는 허가 서버 목록을 작성한 SPF 텍스트 레코드의  존 파일 예시이다.

- 도메인 - example.com.
- 인터넷 클래스 - IN
- 레코드 유형 - TXT
- SPF 텍스트 - "v=spf1 include:_spf.google.com ~all"

```
example.com. IN TXT "v=spf1 include:_spf.google.com ~all"
```

`SRV(Service) 레코드`는 통신 서비스 같은 특정 서비스에 대한 호스트 이름, 포트 번호, 우선순위 및 가중치 정보를 제공하는 DNS 레코드다. 주로 SIP(VoIP), XMPP 채팅, LDAP, 게임 서버 등에서 사용된다. 예를 들어 VoIP 전화기가 특정 도메인에서 SIP 서비스를 찾기 위해 DNS 조회 요청을 보낸다. DNS 서버는 해당 도메인의 SRV 레코드 반환하고, 클라이언트는 우선 순위 값에 따라 서버에 연겨을 시도한다. 연결이 성공하면 서비스가 시작된다.

- 서비스.프로토콜.도메인 - _sip._tcp.example.com.
- TTL - 3600초
- 인터넷 클래스 - IN
- 레코드 유형 - SRV
- 우선순위 - 10
- 가중치 - 5
- 포트 - 5060
- 대상 호스트 - sipserver1.example.com.

```
_sip._tcp.example.com. 3600 IN SRV 10 5 5060 sipserver1.example.com.
```

`SOA(Start of Authority) 레코드`는 DNS 특정 도메인 존(zone)의 시작과 권한에 대한 정보를 제공하는 필수 레코드다. DNS 호스트 존에는 반드시 하나의 SOA 레코드가 존재해야 한다. 해당 도메인을 관리하는 네임 서버에 대한 기본 정보를 제공한다. 예를 들어 주 네임 서버, 관리자 이메일, 시리얼 번호, 새로 고침 간격, 재시도 간격, 만료 시간, 최소 TTL을 입력한다.

- 도메인 - example.com.
- 인터넷 클래스 - IN
- 레코드 유형 - SOA
- 권한 있는 네임 서버 - ns1.example.com.
- 관리자 이메일 주소 - admin.example.com.
  - `@` 대신 `.`을 사용한다.
- 레코드 파라미터
  - 시리얼 번호 - DNS 존 파일에 변경 사항이 있을 때마다 값이 증가하여 존 파일 변경이 있음을 나타낸다.
  - 리프레시(refresh) - 보조(secondary) DNS 서버가 주(primary) DNS 서버에서 정보를 새로 고치는 주기이다.
  - 리트라이(retry) - 보조 DNS 서버가 주 DNS 서버와의 연결이 실패하면 재시도하는 주기이다.
  - 만료(expire) - 보조 DNS 서버가 주 DNS 서버와의 연결을 복구할 수 없을 때 데이터가 만료되는 시간이다.
  - TTL - 레코드의 최소 TTL 값이다. 이 값은 네임 서버에서 해당 레코드에 대한 캐시된 데이터를 최소한으로 유지해야 하는 시간이다.

```
example.com.    IN  SOA  ns1.example.com. admin.example.com. (
                    2023022401 ; Serial
                    3600       ; Refresh (1 hour)
                    600        ; Retry (10 minutes)
                    1209600    ; Expire (14 days)
                    86400      ; Minimum TTL (1 day)
)
```

`CAA(Certification Authority Authoriztion) 레코드`는 인증 기관(certificate authority)에 대한 허가를 명시하는 DNS 레코드다. 이 레코드는 도메인 이름에 대해 어떤 인증 기관이 SSL/TLS 인증서를 발급할 수 있는지를 제어한다. 이를 통해 도메인 소유자는 특정 인증 기관만 인증서를 발급할 수 있도록 허용하고 신뢰할 수 없는 인증 기관에서 발급된 인증서를 방지할 수 있다.

- 도메인 - example.com.
- 인터넷 클래스 - IN
- 레코드 유형 - CAA
- 플래그 - 레코드에 대한 동작을 제어한다. 이를 통해 다른 인증 기관에서 발급된 인증서를 거부할 수 있다.
  - 0 값은 일반적인 플래그로 인증서 발급을 허용한다는 의미이다.
  - 128 값은 반드시 허용된 인증 기관만 인증서를 발급할 수 있다는 의미이다. 
- 태그 - 인증 기관이 해당 도메인에 어떤 작업을 할 수 있는지 혹은 어떤 동작을 해야 하는지 지정하는 값이다.
  - issue - 인증서 발급을 허용하는 인증 기관을 지정한다.
  - issuewild - 와일드카드 인증서 발급을 허용하는 인증 기관을 지정한다.
  - iodef - 인증 기관에 문제 발생 시 보고할 URL을 설정한다.
- 깂 - 인증 기관을 지정한다.

```
example.com.  IN  CAA  0 issue "letsencrypt.org"
```

위 CAA 레코드는 example.com 도메인에 대해 `letsencrypt.org` 인증 기관만 인증서를 발급할 수 있음을 명시한다. 여러 개의 레코드를 정의하면 여러 인증 기관을 허용할 수 있다.

```
example.com.  IN  CAA  0 issue "letsencrypt.org"
example.com.  IN  CAA  0 issue "comodoca.com"
```

#### REFERENCE

- [DNS 레코드 종류 ★ 완벽 정리](https://inpa.tistory.com/entry/WEB-%F0%9F%8C%90-DNS-%EB%A0%88%EC%BD%94%EB%93%9C-%EC%A2%85%EB%A5%98-%E2%98%85-%EC%95%8C%EA%B8%B0-%EC%89%BD%EA%B2%8C-%EC%A0%95%EB%A6%AC)
- <https://docs.aws.amazon.com/ko_kr/Route53/latest/DeveloperGuide/ResourceRecordTypes.html>

[dns-and-aws-route53-link]: https://junhyunny.github.io/information/dns/aws/route53/dns-and-aws-route53/