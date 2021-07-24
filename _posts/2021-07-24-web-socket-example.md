---
title: "WebSocket 구현"
search: false
category:
  - spring-boot
last_modified_at: 2021-07-24T12:00:00
---

<br>

[WebSocket 이해하기][web-socket-link] 포스트에서 WebSocket 개념에 대해 간단하게 정리했었습니다. 
이번 포스트는 WebSocket 예제 코드를 정리해서 올려보도록 하겠습니다. 
다음과 같은 환경에서 테스트하였습니다.
- spring boot 2.2.5.RELEASE
- spring-boot-starter-thymeleaf
- spring-websocket
- SockJS

## 시나리오 구성도
- 브라우저가 서버에 소켓 연결을 수행합니다.
- 두 번째 브라우저가 서버에 소켓 연결을 수행합니다.
- 처음 연결한 브라우저에서 메세지를 전달합니다.
- 서버는 메세지를 전달받아 자신이 관리하는 세션(session)으로 메세지를 전송합니다.
- 두 브라우저 모두 서버로부터 전달받은 메세지를 출력합니다.

<p align="center"><img src="/images/web-socket-example-1.gif" width="70%"></p>

## 패키지 구조

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

## WebSocketComponent 클래스
- TextWebSocketHandler 클래스를 상속받습니다. 몇 개의 메소드를 오버라이드합니다.
- afterConnectionEstablished 메소드 - 연결 후에 수행됩니다. 자신이 관리하는 sessionMap 객체에 연결 정보를 저장합니다.
- handleMessage 메소드 - sessionMap 객체에서 관리되는 session 정보를 이용하여 전달받은 메세지를 전송합니다.
- afterConnectionClosed 메소드 - 연결이 해제된 후에 수행됩니다. 자신이 관리하는 sessionMap 객체에서 연결 정보를 삭제합니다.

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

## CustomWebsocketConfiguration 클래스
- @EnableWebSocket 애너테이션을 추가합니다.
- WebSocketConfigurer 인터페이스를 구현합니다.
- WebSocket Connection 관리를 위해 생성한 WebSocketComponent 빈(Bean)을 주입받습니다.
- registerWebSocketHandlers 메소드 - WebSocket 기능을 위해 필요한 정보들을 지정합니다.
    - `/chat` 경로의 WebSocket 연결 정보는 WebSocketComponent 객체로 지정합니다.
    - CORS 문제 해결을 위해 setAllowedOrigins() 메소드를 사용합니다. 테스트이므로 모든 CORS 정보를 허용합니다.
    - SockJS fallback option들을 허용합니다.
    - SockJS 사용 시 필요한 클라이언트 라이브러리 URL 정보를 입력합니다.

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

## ChatController 클래스
- `/chat` 경로를 통해 전달받는 요청으로 `chat.html` 페이지를 전달합니다.

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

## chat.html
- connectSocket 함수 - SockJS 객체를 생성 후 연결에 필요한 경로를 입력합니다. `/chat`
- onmessage 함수 - 메세지 수신 시 필요한 함수를 지정합니다.
- onerror 함수 - 에러 발생 시 필요한 함수를 지정합니다.
- onclose 함수 - 연결이 닫힐 시 필요한 함수를 지정합니다.
- send 함수 - sock 객체를 이용해 메세지를 전송합니다.

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

#### 테스트 확인

<p align="center"><img src="/images/web-socket-example-2.gif" width="70%"></p>

## OPINION
예제 구현은 간단하게 되었습니다. 
하지만 실제로 이런 방식을 사용하지 않는다고 합니다. 
Spring 프레임워크에서 제공하는 `STOMP`를 사용하면 개발자가 직접 session 관리를 위한 코드를 작성하지 않고도 메세지 발행, 구독이 가능하다고 합니다. 
시간이 된다면 관련된 내용에 대해 공부하고, 해당 예제를 확장시켜봐야겠습니다. 

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action>

#### REFERENCE
- <https://dev-gorany.tistory.com/224>
- <https://supawer0728.github.io/2018/03/30/spring-websocket/>

[web-socket-link]: https://junhyunny.github.io/information/web-socket/