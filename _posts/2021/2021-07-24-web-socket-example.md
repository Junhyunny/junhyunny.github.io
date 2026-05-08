---
title: "웹소켓(WebSocket)을 사용한 메시지 실시간 동기화 예제"
search: false
category:
  - spring-boot
last_modified_at: 2026-05-07T21:16:56+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [웹소켓(WebSocket) 이해하기][web-socket-link]

## 0. 들어가면서

이번 글에서는 웹소켓(WebSocket) 예제 코드를 정리해 보겠다. 다음과 같은 환경에서 테스트했다.

- Spring Boot 2.2.5.RELEASE
- spring-boot-starter-thymeleaf
- spring-websocket
- SockJS

## 1. Scenario

이번 예제는 다음과 같은 시나리오를 구현한다.

1. 브라우저가 서버에 소켓 연결을 맺는다.
2. 두 번째 브라우저가 서버에 소켓 연결을 맺는다.
3. 처음 연결한 브라우저에서 메시지를 보낸다.
4. 서버는 메시지를 전달받아 자신이 관리하는 세션(session)에 메시지를 전송한다.
5. 두 브라우저 모두 서버로부터 전달받은 메시지를 출력한다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/web-socket-example-01.gif" width="100%">
</div>

## 2. Practice

패키지 구조는 다음과 같다.

```
./
|-- README.md
|-- action-in-blog.iml
|-- mvnw
|-- mvnw.cmd
|-- pom.xml
`-- src
    |-- main
    |   |-- java
    |   |   `-- blog
    |   |       `-- in
    |   |           `-- action
    |   |               |-- ActionInBlogApplication.java
    |   |               |-- component
    |   |               |   `-- WebSocketComponent.java
    |   |               |-- configure
    |   |               |   `-- CustomWebsocketConfiguration.java
    |   |               `-- controller
    |   |                   `-- ChatController.java
    |   `-- resources
    |       |-- application.yml
    |       `-- templates
    |           `-- chat.html
    `-- test
        `-- java
```

소켓 세션(session)을 관리하는 WebSocketComponent 클래스를 살펴보자. TextWebSocketHandler 클래스를 상속받고, 몇 개의 메서드를 오버라이드한다.

- afterConnectionEstablished 메서드
  - 연결 후 호출된다. 자신이 관리하는 sessionMap 객체에 연결 정보를 저장한다.
- handleMessage 메서드
  - sessionMap 객체에서 관리하는 session 정보를 이용하여 전달받은 메시지를 전송한다.
- afterConnectionClosed 메서드
  - 연결이 해제된 후 호출된다. 자신이 관리하는 sessionMap 객체에서 연결 정보를 삭제한다.

```java
package blog.in.action.component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Log4j2
@Component
public class WebSocketComponent extends TextWebSocketHandler {

    public static Map<String, WebSocketSession> sessionMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessionMap.put(session.getId(), session);
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) {
        sessionMap.forEach((sessionId, sessionInMap) -> {
            try {
                sessionInMap.sendMessage(message);
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessionMap.remove(session.getId());
    }
}
```

위에서 만든 WebSocketComponent 객체를 웹소켓 핸들러로 등록하기 위한 CustomWebsocketConfiguration 클래스 코드는 다음과 같다. WebSocketConfigurer 인터페이스를 구현한다.

- @EnableWebSocket 애너테이션을 클래스 위에 추가한다.
- CustomWebsocketConfiguration 생성자 메서드
  - WebSocket 연결 관리를 위해 생성한 WebSocketComponent 빈(bean)을 주입받는다.
- registerWebSocketHandlers 메서드
  - addHandler 메서드 - `/chat` 경로의 WebSocket 연결 정보는 WebSocketComponent 객체로 지정한다.
  - setAllowedOrigins 메서드 - CORS 문제 해결을 위해 "*" 텍스트를 추가한다. 테스트이므로 모든 CORS 요청을 허용한다.
  - withSockJS 메서드 - SockJS fallback 옵션을 허용한다.
  - setClientLibraryUrl 메서드 - SockJS 사용 시 필요한 클라이언트 라이브러리 URL 정보를 입력한다. 타임리프를 사용하기 때문에 반환하는 HTML 페이지에 필요한 의존성을 브라우저에서 다운로드하기 위한 코드다.

```java
package blog.in.action.configure;

import blog.in.action.component.WebSocketComponent;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class CustomWebsocketConfiguration implements WebSocketConfigurer {

    private final WebSocketComponent webSocketComponent;

    public CustomWebsocketConfiguration(WebSocketComponent webSocketComponent) {
        this.webSocketComponent = webSocketComponent;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry webSocketHandlerRegistry) {
        webSocketHandlerRegistry.addHandler(webSocketComponent, "/chat")
            .setAllowedOrigins("*")
            .withSockJS()
            .setClientLibraryUrl("https://cdnjs.cloudflare.com/ajax/libs/sockjs-client/1.1.5/sockjs.min.js");
    }
}
```

채팅 화면 페이지를 반환하는 ChatController 클래스는 다음과 같다.

- `/chat` 경로의 요청에 대해 `chat.html` 페이지를 반환한다.

```java
package blog.in.action.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ChatController {

    @GetMapping("/chat")
    public String chat() {
        return "chat";
    }
}
```

위 엔드포인트에서 반환하는 chat HTML 코드를 살펴보자. 주요 함수는 다음과 같다.

- connectSocket 함수
  - SockJS 객체를 생성한 후 연결에 필요한 경로인 `/chat`을 입력한다.
- onmessage 함수
  - 메시지 수신 시 필요한 함수를 지정한다.
- onerror 함수
  - 에러 발생 시 필요한 함수를 지정한다.
- onclose 함수
  - 연결이 닫힐 때 필요한 함수를 지정한다.
- send 함수
  - sock 객체를 이용해 메시지를 전송한다.

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>채팅</title>
</head>
<body>
<h1>채팅방</h1>
<div id="chatConnect">
    <button onclick="connectSocket()">채팅 시작하기</button>
</div>

<div id="chat" hidden="hidden">
    <input id="message">
    <button id="sendBtn">전송</button>
    <div id="chatBox"></div>
</div>

<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/sockjs-client/1.1.5/sockjs.min.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
<script type="text/javascript">

    let sock;

    function connectSocket() {
        sock = new SockJS("/chat");
        sock.onopen = function () {
            alert('연결에 성공하였습니다.');
            sock.onmessage = (data => {
                $("<p>" + data.data + "</p>").prependTo('#chatBox');
            });
            $('#chatConnect').hide();
            $('#chat').show();
        }
        sock.onerror = function (e) {
            alert('연결에 실패하였습니다.');
            $('#chatConnect').show();
            $('#chat').hide();
        }
        sock.onclose = function () {
            alert('연결을 종료합니다.');
            $('#chatConnect').show();
            $('#chat').hide();
        };
    }

    function sendMessage() {
        sock.send($("#message").val());
        $('#message').val("");
    }

    $("#message").keyup(e => {
        if (e.keyCode == 13) {
            sendMessage();
        }
    });

    $("#sendBtn").click(() => {
        sendMessage();
    });
</script>
</body>
</html>
```

위 애플리케이션을 실행한 후 두 브라우저 탭에서 애플리케이션에 접속한다. 웹소켓 연결이 완료된 후 메시지를 전송하면 두 브라우저 탭이 서로 동기화되는 것을 확인할 수 있다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/web-socket-example-02.gif" width="100%" class="image__border" />
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-07-21-web-socket>

#### REFERENCE

- <https://dev-gorany.tistory.com/224>
- <https://supawer0728.github.io/2018/03/30/spring-websocket/>

[web-socket-link]: https://junhyunny.github.io/information/web-socket/
