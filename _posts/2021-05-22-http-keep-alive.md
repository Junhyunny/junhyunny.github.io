---
title: "HTTP Keep-Alive"
search: false
category:
  - information
last_modified_at: 2021-09-01T03:00:00
---

<br/>

## 1. HTTP 비연결성(Connectionless) 특징
HTTP Keep-Alive 기능에 대한 설명 전에 해당 기능이 등장하게 된 배경부터 알아보겠습니다. 
Keep-Alive 기능이 등장하게 된 이유는 [HTTP(HyperText Transfer Protocol)][http-blog-link] 포스트에서 소개한 HTTP 특징 중 한가지인 비연결성(Connectionless)과 연관있습니다. 

> [HTTP(HyperText Transfer Protocol)][http-blog-link]<br/>
> 클라이언트와 서버가 연결을 맺은 후 서버가 응답을 마치면 맺은 연결을 끊어버리는 것을 의미합니다. 
> 서버는 불특정 다수의 클라이언트를 위해 서비스를 제공합니다. 한번 요청한 클라이언트와 연결을 계속 유지하는 것은 리소스 사용 측면에서 서버에게 많은 부담을 줍니다. 
> 그렇기에 서버는 클라이언트의 요청에 대한 응답 후 연결을 유지하지 않습니다.

HTTP 통신은 비연결성 특징으로 인해 매번 연결을 생성해야 하므로 네트워크 측면에서 불필요한 비용이 필요하게 됩니다. 
이를 개선하기 위한 방법으로 `'Keep-Alive'` 기능을 사용합니다.

## 2. Keep-Alive 기능
3-Way Handshake를 통해 연결된 세션을 없애지 않고 계속 사용하는 방식입니다. 
서버는 클라이언트와 맺은 연결을 특정 시간 동안 유지합니다. 
연결을 열어놓은 시간 동안 재사용합니다. 
서버는 Keep-Alive 헤더를 사용하여 연결이 최소한 얼마나 열려있어야 할지 설정합니다. 
연결된 Socket에 마지막 접근이 종료된 시점부터 정의된 시간 내에 재접근이 이루어진다면 계속 연결된 상태를 유지합니다. 

관련된 내용을 찾아보니 HTTP 특정 버전부터 가능한 것으로 확인됩니다. 
> [HTTP/1.x의 커넥션 관리][http-connection-control-link]<br/>
> HTTP/1.0 커넥션은 기본적으로 영속적이지 않습니다. 
> Connection를 close가 아닌 다른 것으로, 일반적으로 retry-after로 설정하면 영속적으로 동작하게 될 겁니다.
> 반면, HTTP/1.1에서는 기본적으로 영속적이며 헤더도 필요하지 않습니다. 

##### Keep-Alive On/Off
- Keep-Alive 기능 On/Off 시 아래와 같은 차이가 발생합니다.

<p align="center"><img src="/images/http-keep-alive-1.JPG" width="75%"></p>
<center>https://www.imperva.com/learn/performance/http-keep-alive/</center>

## 3. Keep-Alive 장단점
### 3.1. 장점
- No Handshaking 으로 인한 지연 시간을 감소시킬 수 있습니다.
- 새로운 Connection 형성을 위한 CPU 사용률이 감소합니다.
- HTTP PipeLine 기능 사용이 가능합니다.
- 네트워크 혼잡이 감소됩니다.

### 3.2. 단점
- 유휴 상태일 때에도 서버 리소스를 소비합니다.
- 과부하 상태에서는 DoS 공격을 당할 수 있습니다. 

## 4. Keep-Alive 기능 사용 방법
개발자의 별도 작업은 필요 없습니다. 다만, 아래와 같은 조건이 필요합니다. 
- 클라이언트(브라우저)는 HTTP/1.1을 준수하고 이해할 수 있어야 합니다. 
- 클라이언트가 요청에 `'Connection: keep-alive'` 를 넣어서 서버에게 전송합니다. 
- 서버도 HTTP/1.1을 구현해야 합니다. 
- 서버는 Keep-Alive 기능을 활성화하고 Time-Out 등을 설정해야 합니다. 

### 4.1. Keep-Alive 헤더
##### 클라이언트 요청 메세지의 Keep-Alive 헤더
- HTTP/1.1 에서는 기본적으로 지원됩니다.
- ~~HTTP/1.0 에서는 아래와 같은 헤더를 추가해야 합니다.~~ (정상 동작하지 않습니다.) 

```
Connection: keep-alive
```

##### 서버 응답 메세지의 Keep-Alive 헤더
- `Connection: Keep-Alive`, 서버가 `Keep-Alive` 기능을 지원함을 의미합니다.
- `Keep-Alive: timeout=5, max=1000`
  - timeout=5, 5초간 연결을 유지합니다.
  - max=1000, 1000회 요청에 대해 연결 유지 시간 갱신을 허용합니다.
  - 예를 들어 5초 이내에 재요청이 오는 경우 max 값은 999가 됩니다.
  - 최대 5 X 1000 = 5000초 시간 동안 연결을 유지할 수 있습니다.

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

### 4.2. Keep-Alive 기능 동작 확인
`cURL` 명령어를 사용하여 Keep-Alive 기능이 동작하는지 확인할 수 있습니다. 
네이버(Naver) 요청 시 응답이 너무 길어 불필요한 부분은 `...` 으로 표시하였습니다. 

##### HTTP/1.1 사용 cURL 요청
- `-v` 옵션을 사용하는 경우 상세한 요청, 응답 내용을 확인할 수 있습니다.
- `https://www.naver.com` 서버로 2회 요청을 보냅니다.

```
> curl -v https://www.naver.com https://www.naver.com
```

##### HTTP/1.1 사용 cURL 요청 시 결과
- `Connected to www.naver.com (223.130.195.200) port 443 (#0)`, 223.130.195.200:443 으로 연결합니다.
- `Connection: keep-alive`, 응답 헤더에 Connection 값이 keep-alive 입니다.
- `Connection #0 to host www.naver.com left intact`, #0 연결을 유지합니다.
- `Re-using existing connection! (#0) with host www.naver.com`, 두 번째 요청에서 기존 연결을 재사용합니다.

```
* Rebuilt URL to: https://www.naver.com/
*   Trying 223.130.195.200...
* TCP_NODELAY set
* Connected to www.naver.com (223.130.195.200) port 443 (#0)
...
> GET / HTTP/1.1
> Host: www.naver.com
> User-Agent: curl/7.55.1
> Accept: */*
...
< HTTP/1.1 200 OK
< Server: NWS
< Date: Fri, 21 May 2021 15:55:06 GMT
< Content-Type: text/html; charset=UTF-8
< Transfer-Encoding: chunked
< Connection: keep-alive
< Set-Cookie: PM_CK_loc=55a94278c68df727e705b981773343a78e125946b8dcb3a7db218c69242cfbe6; Expires=Sat, 22 May 2021 15:55:06 GMT; Path=/; HttpOnly
< Cache-Control: no-cache, no-store, must-revalidate
< Pragma: no-cache
< P3P: CP="CAO DSP CURa ADMa TAIa PSAa OUR LAW STP PHY ONL UNI PUR FIN COM NAV INT DEM STA PRE"
< X-Frame-Options: DENY
< X-XSS-Protection: 1; mode=block
< Strict-Transport-Security: max-age=63072000; includeSubdomains
< Referrer-Policy: unsafe-url
...
* Connection #0 to host www.naver.com left intact
* Rebuilt URL to: https://www.naver.com/
* Found bundle for host www.naver.com: 0x1e9654d10a0 [can pipeline]
* Re-using existing connection! (#0) with host www.naver.com
* Connected to www.naver.com (223.130.195.200) port 443 (#0)
> GET / HTTP/1.1
> Host: www.naver.com
> User-Agent: curl/7.55.1
> Accept: */*
...
< HTTP/1.1 200 OK
< Server: NWS
< Date: Fri, 21 May 2021 15:55:13 GMT
< Content-Type: text/html; charset=UTF-8
< Transfer-Encoding: chunked
< Connection: keep-alive
< Set-Cookie: PM_CK_loc=55a94278c68df727e705b981773343a78e125946b8dcb3a7db218c69242cfbe6; Expires=Sat, 22 May 2021 15:55:13 GMT; Path=/; HttpOnly
< Cache-Control: no-cache, no-store, must-revalidate
< Pragma: no-cache
< P3P: CP="CAO DSP CURa ADMa TAIa PSAa OUR LAW STP PHY ONL UNI PUR FIN COM NAV INT DEM STA PRE"
< X-Frame-Options: DENY
< X-XSS-Protection: 1; mode=block
< Strict-Transport-Security: max-age=63072000; includeSubdomains
< Referrer-Policy: unsafe-url
...
* Connection #0 to host www.naver.com left intact
```

##### HTTP/1.0 사용 cURL 요청
- `-v` 옵션을 사용하는 경우 상세한 요청, 응답 내용을 확인할 수 있습니다.
- `-0` 옵션을 사용하는 경우 HTTP/1.0 버전을 사용합니다. 
- `https://www.naver.com` 서버로 2회 요청을 보냅니다.

```
> curl -v -0 https://www.naver.com https://www.naver.com
```

##### HTTP/1.0 사용 cURL 요청 시 결과
- `Connected to www.naver.com (223.130.195.200) port 443 (#0)`, 223.130.195.200:443 으로 연결합니다.
- `GET / HTTP/1.0`, HTTP/1.0 버전을 사용하여 요청합니다. 
- `Connection: close`, 응답 헤더에 Connection 값이 close 입니다.
- `Closing connection 0`, 요청에 대한 연결을 닫습니다.

```
* Rebuilt URL to: https://www.naver.com/
*   Trying 223.130.195.200...
* TCP_NODELAY set
* Connected to www.naver.com (223.130.195.200) port 443 (#0)
...
> GET / HTTP/1.0
> Host: www.naver.com
> User-Agent: curl/7.55.1
> Accept: */*
...
< HTTP/1.1 200 OK
< Server: NWS
< Date: Fri, 21 May 2021 15:54:11 GMT
< Content-Type: text/html; charset=UTF-8
< Connection: close
< Set-Cookie: PM_CK_loc=55a94278c68df727e705b981773343a78e125946b8dcb3a7db218c69242cfbe6; Expires=Sat, 22 May 2021 15:54:11 GMT; Path=/; HttpOnly
< Cache-Control: no-cache, no-store, must-revalidate
< Pragma: no-cache
< P3P: CP="CAO DSP CURa ADMa TAIa PSAa OUR LAW STP PHY ONL UNI PUR FIN COM NAV INT DEM STA PRE"
< X-Frame-Options: DENY
< X-XSS-Protection: 1; mode=block
< Strict-Transport-Security: max-age=63072000; includeSubdomains
< Referrer-Policy: unsafe-url
...
* Closing connection 0
* schannel: shutting down SSL/TLS connection with www.naver.com port 443
* schannel: clear security context handle
* Rebuilt URL to: https://www.naver.com/
* Hostname www.naver.com was found in DNS cache
*   Trying 223.130.195.200...
* TCP_NODELAY set
* Connected to www.naver.com (223.130.195.200) port 443 (#1)
...
> GET / HTTP/1.0
> Host: www.naver.com
> User-Agent: curl/7.55.1
> Accept: */*
...
< HTTP/1.1 200 OK
< Server: NWS
< Date: Fri, 21 May 2021 15:54:17 GMT
< Content-Type: text/html; charset=UTF-8
< Connection: close
< Set-Cookie: PM_CK_loc=55a94278c68df727e705b981773343a78e125946b8dcb3a7db218c69242cfbe6; Expires=Sat, 22 May 2021 15:54:17 GMT; Path=/; HttpOnly
< Cache-Control: no-cache, no-store, must-revalidate
< Pragma: no-cache
< P3P: CP="CAO DSP CURa ADMa TAIa PSAa OUR LAW STP PHY ONL UNI PUR FIN COM NAV INT DEM STA PRE"
< X-Frame-Options: DENY
< X-XSS-Protection: 1; mode=block
< Strict-Transport-Security: max-age=63072000; includeSubdomains
< Referrer-Policy: unsafe-url
...
* schannel: server indicated shutdown in a prior call
* schannel: schannel_recv cleanup
* Closing connection 1
* schannel: shutting down SSL/TLS connection with www.naver.com port 443
* schannel: clear security context handle
```

## CLOSING
포스트를 작성하면서 몇 가지 테스트를 해보니 다음과 같은 사항을 확인하였습니다. 

> 클라이언트 요청 메세지의 Keep-Alive 헤더<br/>
> HTTP/1.0 에서는 아래와 같은 헤더를 추가해야 합니다.<br/>
> `Connection: keep-alive`

`cURL` 명령어를 사용한 테스트 결과 HTTP/1.0 에서는 헤더를 추가하여도 정상적인 동작이 안 됩니다. 

##### HTTP/1.0 사용 `Connection: keep-alive` 헤더 추가
- `-v` 옵션을 사용하는 경우 상세한 요청, 응답 내용을 확인할 수 있습니다.
- `-0` 옵션을 사용하는 경우 HTTP/1.0 버전을 사용합니다.
- `-H` 옵션을 사용하여 `Connection: keep-alive` 정보를 헤더에 추가합니다.
- `https://www.google.com` 서버로 2회 요청을 보냅니다.

```
> curl -v -0 -H "Connection: keep-alive" http://www.google.com http://www.google.com
```

##### HTTP/1.0 사용 `Connection: keep-alive` 헤더 추가 시 결과
- `HTTP 1.0, assume close after body`, 응답 이후 연결이 닫힐 것이라는 로그를 확인할 수 있습니다.
- `Closing connection 0`, 요청 이후 연결이 닫힙니다.
- 다음 요청에서 특정 연결을 재사용하겠다는 로그는 존재하지 않습니다.

```
* Rebuilt URL to: http://www.google.com/
*   Trying 172.217.175.36...
* TCP_NODELAY set
* Connected to www.google.com (172.217.175.36) port 80 (#0)
> GET / HTTP/1.0
> Host: www.google.com
> User-Agent: curl/7.55.1
> Accept: */*
> Connection: keep-alive
...
* HTTP 1.0, assume close after body
< HTTP/1.0 200 OK
< Date: Fri, 21 May 2021 16:38:42 GMT
< Expires: -1
< Cache-Control: private, max-age=0
< Content-Type: text/html; charset=ISO-8859-1
< P3P: CP="This is not a P3P policy! See g.co/p3phelp for more info."
< Server: gws
< X-XSS-Protection: 0
< X-Frame-Options: SAMEORIGIN
< Set-Cookie: 1P_JAR=2021-05-21-16; expires=Sun, 20-Jun-2021 16:38:42 GMT; path=/; domain=.google.com; Secure
< Set-Cookie: NID=216=fVTBZdYP0LhAHXSWp4YahEdXbZfl8fpuo-XDii90p2K0msIzkeAWDJSOBJK658NhJtTebzKNPjZc3S0KlPrVA4IRtueF7o-CckOAEvxfcj-vxtMMv23Hks3b3Pp8agpj8O-2milQblYZK02DRkZb7thPV9rti_L8IiJhpnkgXWA; expires=Sat, 20-Nov-2021 16:38:42 GMT; path=/; domain=.google.com; HttpOnly
< Accept-Ranges: none
< Vary: Accept-Encoding
...
* Closing connection 0
```

#### REFERENCE
- [HTTP/1.1 Keep-Alive 기능에 대해][keep-alive-blog-link-1]
- <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Keep-Alive>
- <https://developer.mozilla.org/ko/docs/Web/HTTP/Connection_management_in_HTTP_1.x>
- <https://en.wikipedia.org/wiki/HTTP_persistent_connection>
- <https://www.imperva.com/learn/performance/http-keep-alive/>
- <https://ston.readthedocs.io/ko/latest/admin/handling_http_requests.html>
- <https://junhyunny.github.io/information/http/>

[keep-alive-blog-link-1]: https://b.pungjoo.com/entry/HTTP-11-Keep-Alive-%EA%B8%B0%EB%8A%A5%EC%97%90-%EB%8C%80%ED%95%B4
[http-connection-control-link]: https://developer.mozilla.org/ko/docs/Web/HTTP/Connection_management_in_HTTP_1.x
[http-blog-link]: https://junhyunny.github.io/information/http/