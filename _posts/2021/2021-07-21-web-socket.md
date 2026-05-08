---
title: "웹소켓(WebSocket) 이해하기"
search: false
category:
  - information
last_modified_at: 2026-05-07T20:56:01+09:00
---

<br/>

#### RECOMMEND NEXT POSTS

- [웹소켓(WebSocket)을 사용한 메시지 실시간 동기화 예제][websocket-implement-link]

## 1. WebSocket

웹소켓은 TCP 기반 전이중 통신(full-duplex communication)을 제공하며, [RFC 6455][RFC-6455] 문서에 관련 규격이 작성되어 있다. [RFC 6455][RFC-6455] 문서를 간단하게 살펴보자. 웹소켓(WebSocket) 등장 이전에 실시간 데이터를 확인하고 싶은 경우 클라이언트는 짧은 주기로 서버에 데이터를 요청하였다. 이를 `HTTP 폴링(polling)` 방식이라고 하는데, 다음과 같은 문제가 있다.

- 서버는 클라이언트가 보내는 요청마다 TCP 연결(connection)을 수행하므로 많은 수의 연결이 필요하다.
- 모든 클라이언트-서버 통신 메시지에 HTTP 헤더(header) 데이터가 필요하다.

위의 문제를 해결하기 위한 방법으로 `웹소켓`이 등장한다. 매 요청마다 연결할 필요가 없어졌기 때문에 연결을 위한 오버헤드(overhead)가 줄어들었다. 한 번 연결을 맺으면 별도의 요청 없이 서버로부터 메시지를 받을 수 있기 때문에 클라이언트 측에서 불필요한 요청을 보낼 일이 없어졌다. 메시지에는 HTTP 헤더 정보가 없기 때문에 네트워크 부하도 줄어들었다.

HTTP 폴링과 웹소켓의 차이점을 비교해 보자.

| 구분 | HTTP 폴링 | WebSocket |
| --- | --- | --- |
| 연결 방식 | 요청과 응답이 있을 때마다 매번 새로운 연결을 맺는다. | HTTP 요청을 통해 WebSocket 연결을 맺는다. (WebSocket Handshake) |
| 데이터 흐름 | 클라이언트에서 서버로 데이터를 요청하고, 서버로부터 응답을 받는다. | 연결을 맺은 후 클라이언트와 서버는 별도의 연결 작업 없이 데이터를 주고받는다. |
| 반복 여부 | 일정 주기로 반복 수행한다. | 별도의 주기적 요청 없이 연결을 유지하며 데이터를 주고받는다. |
| 연결 종료 | 요청과 응답이 끝나면 연결이 종료된다. | 서버와 클라이언트 모두 연결을 종료할 수 있다. |

<div align="center">
  <img src="{{ site.image_url_2021 }}/web-socket-01.png" width="80%">
</div>
<center>https://www.programmersought.com/article/55824983394/</center>

<br/>

[Can I Use](https://caniuse.com/?search=websocket) 사이트에서 웹소켓 API를 사용할 수 있는 브라우저를 확인할 수 있다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/web-socket-02.png" width="80%">
</div>
<center>https://caniuse.com/?search=websocket</center>

## 2. WebSocket Handshake

웹소켓 연결 요청인 핸드셰이크(handshake) 과정에서 서버와 주고받는 정보를 확인해 보겠다. 핸드셰이크 과정은 HTTP 통신을 이용하며 주고받은 데이터에서 중요한 정보만 확인해 보자. 요청 정보에는 다음과 같은 헤더가 필요하다.

- `Connection: Upgrade`
  - 연결을 지속할 것인지 여부를 전달, 프로토콜 변경을 위해서는 `Upgrade` 정보 필수 포함
- `Upgrade: websocket`
  - WebSocket 프로토콜로 변경 요청
- `Sec-WebSocket-Key: <key>`
  - 클라이언트가 WebSocket 프로토콜 업그레이드를 요청할 권한이 있는지 확인하는 데 필요한 정보를 서버에 제공
- `Sec-WebSocket-Version: <version>`
  - 클라이언트가 사용하고 싶은 WebSocket 버전을 전달

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

응답 정보에는 다음과 같은 헤더가 필요하다.

- `101 응답 코드`
  - 프로토콜 변경에 대한 응답 코드, Switching Protocols
- `Sec-WebSocket-Accept: <hashed key>`
  - 서버가 WebSocket 연결을 시작할 의사가 있음을 클라이언트에게 알리기 위한 정보

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
