---
title: "WebSocket 이해하기"
search: false
category:
  - information
last_modified_at: 2021-09-04T03:00:00
---

<br/>

👉 이어서 읽기를 추천합니다.
- [WebSocket 구현][websocket-implement-link]

## 1. WebSocket

> Wiki<br/>
> WebSocket is a computer communications protocol, providing full-duplex communication channels over a single TCP connection. 
> The WebSocket protocol was standardized by the IETF as RFC 6455 in 2011, and the WebSocket API in Web IDL is being standardized by the W3C. 

TCP 기반 전이중 통신(full-duplex communication)을 제공하고 [RFC 6455][RFC-6455] 문서에서 규격에 대한 내용이 작성되어 있다고 합니다. 
[RFC 6455][RFC-6455] 문서를 간단하게 살펴보았습니다. 

### 1.1. 등장 배경
WebSocket 등장 이전 실시간 데이터를 확인하고 싶은 경우 클라이언트는 짧은 주기로 서버에게 데이터를 요청하였습니다. 
이를 `HTTP polling` 방식이라고 하는데, `HTTP polling` 방식은 다음과 같은 문제가 있습니다. 
- 서버는 클라이언트가 보내는 요청마다 TCP 연결(connection)을 수행하므로 많은 수의 연결이 필요합니다. 
- 모든 클라이언트-서버 통신 메시지에 HTTP 헤더(header)를 가지게 됩니다.

위의 문제를 해결하기 위한 방법으로 `WebSocket`이 등장합니다. 
매 요청마다 연결을 할 필요가 없어졌기 때문에 연결을 위한 오버헤드(overhead)가 줄어들었습니다. 
한번 연결을 맺으면 별도의 요청 없이 서버로부터 메시지를 받을 수 있기 때문에 클라이언트 측에서 불필요한 요청을 보낼 일이 없어졌습니다. 
메시지에는 HTTP 헤더 정보가 없기 때문에 네트워크 부하도 줄어들었습니다. 

아래 설명을 통해 둘 사이의 차이점을 비교해보겠습니다. 

### 1.2. HTTP polling
- 클라이언트에서 서버로 데이터를 요청합니다.
- 서버로부터 응답을 받습니다.
- 일정 주기로 반복 수행합니다.
- 요청과 응답이 있을 때마다 매번 새로운 연결을 수행합니다.

### 1.3. WebSocket
- HTTP 요청을 통해 WebSocket 연결을 수행합니다. (Websocket Handshake)
- 연결을 생성한 후 클라이언트와 서버는 별도의 연결 작업 없이 데이터를 주고 받습니다. 
- 서버와 클라이언트 모두 연결을 종료할 수 있습니다.

<p align="center"><img src="/images/web-socket-1.JPG" width="70%"></p>
<center>https://www.programmersought.com/article/55824983394/</center>

### 1.4. WebSocket API 사용 가능 브라우저
<https://caniuse.com/?search=websocket> 링크에서 WebSocket API 사용 가능한 브라우저를 확인할 수 있습니다. 

<p align="center"><img src="/images/web-socket-2.JPG" width="70%"></p>
<center>https://caniuse.com/?search=websocket</center>

## 2. WebSocket Handshake
WebSocket 연결 요청인 Handshake 과정에서 서버와 주고 받는 정보를 확인해보겠습니다.
Handshake 과정은 HTTP 통신을 이용하며 주고 받은 데이터에서 중요한 정보만 확인해보겠습니다. 

### 2.1. 요청 정보
- `Connection: Upgrade` - 연결을 지속할 것인지 여부를 전달, 프로토콜 변경을 위해서는 `Upgrade` 정보 필수 포함
- `Upgrade: websocket` - websocket 프로토콜로 변경 요청
- `Sec-WebSocket-Key: <key>` - 클라이언트가 websocket 프로토콜 업그레이드를 요청할 권한이 있는지 확인하는데 필요한 정보를 서버에 제공
- `Sec-WebSocket-Version: <version>` - 클라이언트가 사용하고 싶은 websocket 버전을 전달

```
GET /chat/046/rnfjawvk/websocket HTTP/1.1
Host: localhost:8080
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0
Accept: */*
Accept-Language: ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3
Accept-Encoding: gzip, deflate
Sec-WebSocket-Version: 13
Origin: http://localhost:8080
Sec-WebSocket-Extensions: permessage-deflate
Sec-WebSocket-Key: VTBy273FOIzgpFUz2B15/w==
DNT: 1
Connection: keep-alive, Upgrade
Pragma: no-cache
Cache-Control: no-cache
Upgrade: websocket
```

### 2.2. 응답 정보
- `101 응답 코드` - 프로토콜 변경에 대한 응답 코드, Switching Protocols
- `Sec-WebSocket-Accept: <hashed key>` - 서버가 websocket 연결을 시작할 의사가 있음을 클라이언트에게 알리기 위한 정보

```
HTTP/1.1 101 
Vary: Origin
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers
Upgrade: websocket
Connection: upgrade, keep-alive
Sec-WebSocket-Accept: NoIMAWc3QDTXp1sRBJhBbKjJeuk=
Sec-WebSocket-Extensions: permessage-deflate
Date: Wed, 21 Jul 2021 00:50:56 GMT
Keep-Alive: timeout=60
```

#### REFERENCE
- <https://caniuse.com/?search=websocket>
- <https://datatracker.ietf.org/doc/html/rfc6455#section-1.1>
- <https://supawer0728.github.io/2018/03/30/spring-websocket/>
- <https://developer.mozilla.org/en-US/docs/Web/HTTP/Protocol_upgrade_mechanism>

[RFC-6455]: https://datatracker.ietf.org/doc/html/rfc6455#section-1.1
[websocket-implement-link]: https://junhyunny.github.io/spring-boot/web-socket-example/