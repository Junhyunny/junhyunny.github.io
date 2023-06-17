---
title: "HTTP Keep-Alive"
search: false
category:
  - information
last_modified_at: 2021-09-01T03:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [HTTP(HyperText Transfer Protocol)][http-blog-link]

## 1. Connectionless Characteristic in HTTP

HTTP의 `Keep-Alive` 기능을 살펴보기 전에 등장 배경부터 알아보겠습니다. 
이는 비연결성(connectionless) 특징과 연관이 있습니다. 

> 비연결성(connectionless)은 서버가 클라이언트에게 응답을 보낸 후 맺어진 연결을 끊어버리는 것을 의미합니다. 서버는 불특정 다수 클라이언트들을 위해 서비스를 제공합니다. 한번 요청한 클라이언트와 연결을 계속 유지하는 것은 리소스 사용 측면에서 서버에게 많은 부담을 줍니다. 그렇기에 서버는 클라이언트의 요청에 대한 응답 후 연결을 유지하지 않습니다. 

비연결성이라는 특징 때문에 매번 연결을 생성해야 하기 때문에 네트워크 측면에서 불필요한 비용이 발생합니다. 

* HTTP는 비연결성 특징 때문에 매 요청마다 연결 성립과 종료 작업을 수행해야 합니다. 

<p align="center">
    <img src="/images/http-keep-alive-1.JPG" width="80%" class="image__border">
</p>

## 2. Keep-Alive

비연결성 때문에 발생하는 문제를 개선하기 위해 `Keep-Alive`을 사용합니다. 
이를 통해 `3-Way Handshake`으로 연결된 세션을 계속 사용할 수 있습니다. 

* 서버는 클라이언트와 맺은 연결을 특정 시간 동안 유지합니다. 
* 연결을 열어 놓은 시간 동안 재사용합니다. 
* 서버는 `Keep-Alive` 헤더를 사용하여 연결이 최소한 얼마나 열려있어야 할지 설정합니다. 
* 연결된 소켓(socket)에 마지막 접근이 종료된 시점부터 정의된 시간 내에 재접근이 이루어진다면 계속 연결된 상태를 유지합니다. 

##### Keep-Alive On and Off

* `Keep-Alive` 기능을 사용 여부에 따라 다음과 같은 차이가 발생합니다.

<p align="center">
    <img src="/images/http-keep-alive-2.JPG" width="80%" class="image__border">
</p>
<center>https://www.imperva.com/learn/performance/http-keep-alive/</center>

## 3. Benefits and Weaknesses

다음과 같은 장점이 있습니다.

* 별도의 연결 과정이 없으므로 핸드쉐이킹으로 인한 지연 시간을 감소시킬 수 있습니다.
* 새로운 연결을 위한 CPU 사용률이 감소합니다.
* HTTP 파이프라인(pipeline) 기능을 사용할 수 있습니다.
* 네트워크 혼잡이 감소됩니다.

다음과 같은 단점이 있습니다.

* 유휴 상태일 때에도 서버 리소스를 소비합니다.
* 과부하 상태에서는 DoS(Denial of Service) 공격을 당할 수 있습니다. 

## 4. How to use Keep-Alive

개발자의 별도 작업은 필요 없습니다. 
다만, 아래와 같은 조건이 필요합니다. 

* 클라이언트(브라우저)는 HTTP/1.1을 준수하고 이해할 수 있어야 합니다. 
* 클라이언트가 `Connection: keep-alive`를 포함한 요청을 서버에 전송합니다. 
* 서버도 HTTP/1.1을 구현해야 합니다. 
* 서버는 `Keep-Alive` 기능을 활성화하고 타임아웃(timeout) 등을 설정해야 합니다. 

### 4.1. Keep-Alive Header

#### 4.1.1. In Client Request Message

* HTTP/1.1 버전은 기본적으로 지원됩니다.
* ~~HTTP/1.0 버전은 아래와 같은 헤더를 추가해야 합니다.~~
    * 정상 동작하지 않습니다.

```
Connection: keep-alive
```

#### 4.1.2. In Server Response Message

* `Connection: Keep-Alive`
    * 서버가 `Keep-Alive`를 지원하는 것을 의미합니다.
* `Keep-Alive: timeout=5, max=1000`
    * 5초간 연결을 유지합니다.
    * 1000회 요청에 대해 연결 유지 시간 갱신을 허용합니다.
    * 최대 5000(5 X 1000)초 시간동안 연결을 유지할 수 있습니다.
    * e.g. 5초 이내에 재요청이 오는 경우 max 값은 999가 됩니다.

```
HTTP/1.1 200 OK
Connection: Keep-Alive
Content-Encoding: gzip
Content-Type: text/html; charset=utf-8
Date: Thu, 11 Aug 2016 15:23:13 GMT
Keep-Alive: timeout=5, max=1000
Last-Modified: Mon, 25 Jul 2016 04:32:39 GMT
Server: Apache
```

## 5. Keep-Alive Test

`cURL` 명령어를 사용하여 `Keep-Alive` 기능이 동작하는지 확인할 수 있습니다. 

### 5.1. cURL Request in HTTP/1.1

* `-v` 옵션을 사용하는 경우 상세한 요청, 응답 내용을 확인할 수 있습니다.
* `https://www.naver.com` 서버로 2회 요청을 보냅니다.

```
$ curl -v --http1.1 https://www.naver.com https://www.naver.com > response
```

##### Result 

* 23.210.76.217 서버의 433 포트로 연결합니다.
    * Connected to www.naver.com (23.210.76.217) port 443 (#0)
* HTTP/1.1 버전을 사용합니다.
    * ALPN: offers h2,http/1.1
* #0 연결을 계속 유지합니다.
    * Connection #0 to host www.naver.com left intact
* #0 연결을 재사용합니다.
    * Re-using existing connection #0 with host www.naver.com
* 응답 헤더에서 `keep-alive`를 지원한다는 정보를 확인할 수 있습니다.
    * Connection: keep-alive
* 핸드쉐이킹이 1회 수행됩니다.

```
$ curl -v --http1.1 https://www.naver.com https://www.naver.com > response
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0*   Trying 23.210.76.217:443...
* Connected to www.naver.com (23.210.76.217) port 443 (#0)
* ALPN: offers http/1.1
* (304) (OUT), TLS handshake, Client hello (1):
} [315 bytes data]
*  CAfile: /etc/ssl/cert.pem
*  CApath: none
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0* (304) (IN), TLS handshake, Server hello (2):
{ [108 bytes data]
* TLSv1.2 (IN), TLS handshake, Certificate (11):
{ [4186 bytes data]
* TLSv1.2 (IN), TLS handshake, Server key exchange (12):
{ [333 bytes data]
* TLSv1.2 (IN), TLS handshake, Server finished (14):
{ [4 bytes data]
* TLSv1.2 (OUT), TLS handshake, Client key exchange (16):
} [70 bytes data]
* TLSv1.2 (OUT), TLS change cipher, Change cipher spec (1):
} [1 bytes data]
* TLSv1.2 (OUT), TLS handshake, Finished (20):
} [16 bytes data]
* TLSv1.2 (IN), TLS change cipher, Change cipher spec (1):
{ [1 bytes data]
* TLSv1.2 (IN), TLS handshake, Finished (20):
{ [16 bytes data]
* SSL connection using TLSv1.2 / ECDHE-RSA-AES128-GCM-SHA256
* ALPN: server accepted http/1.1
* Server certificate:
*  subject: C=KR; ST=Gyeonggi-do; L=Seongnam-si; O=NAVER Cloud Corp.; CN=ssl.pstatic.net
*  start date: May 24 00:00:00 2023 GMT
*  expire date: Sep  7 23:59:59 2023 GMT
*  subjectAltName: host "www.naver.com" matched cert's "www.naver.com"
*  issuer: C=US; O=DigiCert Inc; OU=www.digicert.com; CN=GeoTrust RSA CA 2018
*  SSL certificate verify ok.
* using HTTP/1.1
> GET / HTTP/1.1
> Host: www.naver.com
> User-Agent: curl/7.88.1
> Accept: */*
>
< HTTP/1.1 200 OK
< Server: NWS
< Content-Type: text/html; charset=UTF-8
< Cache-Control: no-cache, no-store, must-revalidate
< Pragma: no-cache
< P3P: CP="CAO DSP CURa ADMa TAIa PSAa OUR LAW STP PHY ONL UNI PUR FIN COM NAV INT DEM STA PRE"
< X-Frame-Options: DENY
< X-XSS-Protection: 1; mode=block
< Strict-Transport-Security: max-age=63072000; includeSubdomains
< Referrer-Policy: unsafe-url
< Date: Sat, 17 Jun 2023 15:56:52 GMT
< Transfer-Encoding:  chunked
< Connection: keep-alive
< Connection: Transfer-Encoding
< Set-Cookie: PM_CK_loc=3adfb5823d9a04c1e9570f6d22599a4d9620939fe8068116f478f474194a309d; Expires=Sun, 18 Jun 2023 15:56:52 GMT; Path=/; HttpOnly
<
{ [15732 bytes data]
100  196k    0  196k    0     0   108k      0 --:--:--  0:00:01 --:--:--  108k
* Connection #0 to host www.naver.com left intact
* Found bundle for host: 0x60000156c390 [serially]
* Re-using existing connection #0 with host www.naver.com
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0> GET / HTTP/1.1
> Host: www.naver.com
> User-Agent: curl/7.88.1
> Accept: */*
>
< HTTP/1.1 200 OK
< Server: NWS
< Content-Type: text/html; charset=UTF-8
< Cache-Control: no-cache, no-store, must-revalidate
< Pragma: no-cache
< P3P: CP="CAO DSP CURa ADMa TAIa PSAa OUR LAW STP PHY ONL UNI PUR FIN COM NAV INT DEM STA PRE"
< X-Frame-Options: DENY
< X-XSS-Protection: 1; mode=block
< Strict-Transport-Security: max-age=63072000; includeSubdomains
< Referrer-Policy: unsafe-url
< Date: Sat, 17 Jun 2023 15:56:53 GMT
< Transfer-Encoding:  chunked
< Connection: keep-alive
< Connection: Transfer-Encoding
< Set-Cookie: PM_CK_loc=3adfb5823d9a04c1e9570f6d22599a4d9620939fe8068116f478f474194a309d; Expires=Sun, 18 Jun 2023 15:56:53 GMT; Path=/; HttpOnly
<
{ [15732 bytes data]
100  221k    0  221k    0     0   293k      0 --:--:-- --:--:-- --:--:--  293k
* Connection #0 to host www.naver.com left intact
```

### 5.2. cURL Request in HTTP/1.0

* `-v` 옵션을 사용하는 경우 상세한 요청, 응답 내용을 확인할 수 있습니다.
* `-0` 옵션을 사용하는 경우 HTTP/1.0 버전을 사용합니다. 
* `https://www.naver.com` 서버로 2회 요청을 보냅니다.

```
$ curl -v -0 https://www.naver.com https://www.naver.com > response
```

##### Result

* 23.210.76.217 서버의 433 포트로 연결합니다.
    * Connected to www.naver.com (23.210.76.217) port 443 (#0)
* HTTP/1.0 버전을 사용합니다.
    * ALPN: offers http/1.0
* 연결을 종료합니다.
    * Connection: close
    * Closing connection 0
* 핸드쉐이킹이 2회 수행됩니다.

```
$ curl -v -0 https://www.naver.com https://www.naver.com > response
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0*   Trying 23.210.76.217:443...
* Connected to www.naver.com (23.210.76.217) port 443 (#0)
* ALPN: offers http/1.0
* (304) (OUT), TLS handshake, Client hello (1):
} [315 bytes data]
*  CAfile: /etc/ssl/cert.pem
*  CApath: none
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0* (304) (IN), TLS handshake, Server hello (2):
{ [108 bytes data]
* TLSv1.2 (IN), TLS handshake, Certificate (11):
{ [4186 bytes data]
* TLSv1.2 (IN), TLS handshake, Server key exchange (12):
{ [333 bytes data]
* TLSv1.2 (IN), TLS handshake, Server finished (14):
{ [4 bytes data]
* TLSv1.2 (OUT), TLS handshake, Client key exchange (16):
} [70 bytes data]
* TLSv1.2 (OUT), TLS change cipher, Change cipher spec (1):
} [1 bytes data]
* TLSv1.2 (OUT), TLS handshake, Finished (20):
} [16 bytes data]
* TLSv1.2 (IN), TLS change cipher, Change cipher spec (1):
{ [1 bytes data]
* TLSv1.2 (IN), TLS handshake, Finished (20):
{ [16 bytes data]
* SSL connection using TLSv1.2 / ECDHE-RSA-AES128-GCM-SHA256
* ALPN: server accepted http/1.0
* Server certificate:
*  subject: C=KR; ST=Gyeonggi-do; L=Seongnam-si; O=NAVER Cloud Corp.; CN=ssl.pstatic.net
*  start date: May 24 00:00:00 2023 GMT
*  expire date: Sep  7 23:59:59 2023 GMT
*  subjectAltName: host "www.naver.com" matched cert's "www.naver.com"
*  issuer: C=US; O=DigiCert Inc; OU=www.digicert.com; CN=GeoTrust RSA CA 2018
*  SSL certificate verify ok.
* using HTTP/1.x
> GET / HTTP/1.0
> Host: www.naver.com
> User-Agent: curl/7.88.1
> Accept: */*
>
* HTTP 1.0, assume close after body
< HTTP/1.0 200 OK
< Server: NWS
< Content-Type: text/html; charset=UTF-8
< Cache-Control: no-cache, no-store, must-revalidate
< Pragma: no-cache
< P3P: CP="CAO DSP CURa ADMa TAIa PSAa OUR LAW STP PHY ONL UNI PUR FIN COM NAV INT DEM STA PRE"
< X-Frame-Options: DENY
< X-XSS-Protection: 1; mode=block
< Strict-Transport-Security: max-age=63072000; includeSubdomains
< Referrer-Policy: unsafe-url
< Date: Sat, 17 Jun 2023 15:52:10 GMT
< Connection: close
< Set-Cookie: PM_CK_loc=3adfb5823d9a04c1e9570f6d22599a4d9620939fe8068116f478f474194a309d; Expires=Sun, 18 Jun 2023 15:52:09 GMT; Path=/; HttpOnly
<
{ [15797 bytes data]
100 24576    0 24576    0     0  17612      0 --:--:--  0:00:01 --:--:-- 17680* TLSv1.2 (IN), TLS alert, close notify (256):
{ [2 bytes data]
100  196k    0  196k    0     0   116k      0 --:--:--  0:00:01 --:--:--  116k
* Closing connection 0
* TLSv1.2 (OUT), TLS alert, close notify (256):
} [2 bytes data]
* Hostname www.naver.com was found in DNS cache
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0*   Trying 23.210.76.217:443...
* Connected to www.naver.com (23.210.76.217) port 443 (#1)
* ALPN: offers http/1.0
* SSL re-using session ID
* TLSv1.2 (OUT), TLS handshake, Client hello (1):
} [254 bytes data]
*  CAfile: /etc/ssl/cert.pem
*  CApath: none
* TLSv1.2 (IN), TLS handshake, Server hello (2):
{ [96 bytes data]
* TLSv1.2 (IN), TLS change cipher, Change cipher spec (1):
{ [1 bytes data]
* TLSv1.2 (IN), TLS handshake, Finished (20):
{ [16 bytes data]
* TLSv1.2 (OUT), TLS change cipher, Change cipher spec (1):
} [1 bytes data]
* TLSv1.2 (OUT), TLS handshake, Finished (20):
} [16 bytes data]
* SSL connection using TLSv1.2 / ECDHE-RSA-AES128-GCM-SHA256
* ALPN: server accepted http/1.0
* Server certificate:
*  subject: C=KR; ST=Gyeonggi-do; L=Seongnam-si; O=NAVER Cloud Corp.; CN=ssl.pstatic.net
*  start date: May 24 00:00:00 2023 GMT
*  expire date: Sep  7 23:59:59 2023 GMT
*  subjectAltName: host "www.naver.com" matched cert's "www.naver.com"
*  issuer: C=US; O=DigiCert Inc; OU=www.digicert.com; CN=GeoTrust RSA CA 2018
*  SSL certificate verify ok.
* using HTTP/1.x
> GET / HTTP/1.0
> Host: www.naver.com
> User-Agent: curl/7.88.1
> Accept: */*
>
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0* HTTP 1.0, assume close after body
< HTTP/1.0 200 OK
< Server: NWS
< Content-Type: text/html; charset=UTF-8
< Cache-Control: no-cache, no-store, must-revalidate
< Pragma: no-cache
< P3P: CP="CAO DSP CURa ADMa TAIa PSAa OUR LAW STP PHY ONL UNI PUR FIN COM NAV INT DEM STA PRE"
< X-Frame-Options: DENY
< X-XSS-Protection: 1; mode=block
< Strict-Transport-Security: max-age=63072000; includeSubdomains
< Referrer-Policy: unsafe-url
< Date: Sat, 17 Jun 2023 15:52:11 GMT
< Connection: close
< Set-Cookie: PM_CK_loc=3adfb5823d9a04c1e9570f6d22599a4d9620939fe8068116f478f474194a309d; Expires=Sun, 18 Jun 2023 15:52:10 GMT; Path=/; HttpOnly
<
{ [15797 bytes data]
* TLSv1.2 (IN), TLS alert, close notify (256):
{ [2 bytes data]
100  199k    0  199k    0     0   161k      0 --:--:--  0:00:01 --:--:--  161k
* Closing connection 1
* TLSv1.2 (OUT), TLS alert, close notify (256):
} [2 bytes data]
```

## CLOSING

살펴본 몇몇 레퍼런스(reference)들은 HTTP/1.0 버전에서 요청 시 "Connection: keep-alive" 헤더를 추가하면 `keep-alive`이 동작한다고 설명합니다. 
하지만 실제로 헤더에 값을 추가하여 요청하면 커넥션이 유지되지 않습니다. 

* `-v` 옵션을 사용하는 경우 상세한 요청, 응답 내용을 확인할 수 있습니다.
* `-0` 옵션을 사용하는 경우 HTTP/1.0 버전을 사용합니다.
* `-H` 옵션을 사용하여 `Connection: keep-alive` 정보를 헤더에 추가합니다.
* `https://www.naver.com` 서버로 2회 요청을 보냅니다.

```
$ curl -v -0 -H "Connection: keep-alive" https://www.naver.com https://www.naver.com > response
```

#### REFERENCE

* [HTTP/1.1 Keep-Alive 기능에 대해][keep-alive-blog-link]
* [HTTP/1.1 의 HTTP Pipelining 과 Persistent Connection 에 대하여][http-pipelining-link]
* <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Keep-Alive>
* <https://developer.mozilla.org/ko/docs/Web/HTTP/Connection_management_in_HTTP_1.x>
* <https://en.wikipedia.org/wiki/HTTP_persistent_connection>
* <https://www.imperva.com/learn/performance/http-keep-alive/>
* <https://ston.readthedocs.io/ko/latest/admin/handling_http_requests.html>

[keep-alive-blog-link]: https://b.pungjoo.com/entry/HTTP-11-Keep-Alive-%EA%B8%B0%EB%8A%A5%EC%97%90-%EB%8C%80%ED%95%B4
[http-pipelining-link]: https://jins-dev.tistory.com/entry/HTTP11-%EC%9D%98-HTTP-Pipelining-%EA%B3%BC-Persistent-Connection-%EC%97%90-%EB%8C%80%ED%95%98%EC%97%AC

[http-blog-link]: https://junhyunny.github.io/information/http/