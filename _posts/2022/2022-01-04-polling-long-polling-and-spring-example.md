---
title: "Long polling in Spring"
search: false
category:
  - information
  - spring-boot
last_modified_at: 2022-01-04T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Asynchronous Non-Blocking Handling][async-nonblocking-link]

## 0. 들어가면서

클라이언트가 서버의 상태 변경을 주기적으로 반영하기 위해 폴링(polling)을 사용한다. 최근 우연히 만난 글에서 롱 폴링(long polling)에 대한 내용을 읽어보니 갑작스레 의문이 들었다. 

> 롱 폴링은 서버에서 이벤트가 발생하기 전까지 응답을 주지 않아야 하는데 어떤 방식으로 구현하지? 

이번 글은 폴링과 롱 폴링의 차이점에 대해 살펴보고 스프링 서버 애플리케이션에서 롱 폴링을 구현하는 방법에 대해 살펴본다. 

## 1. Polling and Long Polling

먼저 폴링을 알아보자. 클라이언트가 일정 주기로 서버에 필요한 데이터를 요청한다. 가장 쉬운 방법이지만, 변경 사항이 있든지 없든지 계속 요청을 보내기 때문에 서버에 부담을 주게 된다. 데이터를 요청하는 주기가 짧아질수록 부하는 커진다. 네트워크나 HTTP 커넥션(connection)을 맺기 위한 비용이 계속 발생한다.

<div align="center">
  <img src="/images/posts/2022/polling-long-polling-and-spring-example-01.png" width="50%" class="image__border">
</div>
<center>https://rubberduck-debug.tistory.com/123</center>

<br/>

롱 폴링은 조금 다르다. 서버는 클라이언트 요청에 대해 즉시 응답을 주지 않는다. 다음과 같이 진행된다.
 
1. 클라이언트가 서버에게 요청을 보낸다.
2. 서버는 즉시 요청을 처리하고 응답을 보내지 않는다.
3. 서버에서 특정 이벤트가 발생하면 응답을 보낸다.
  - 서버의 응답이 없다면 타임 아웃(timeout)이 발생한다.
4. 응답을 받은 클라이언트는 다시 서버에게 요청을 보낸다. 
  - 클라이언트 측에서 타임 아웃이 발생한 경우에도 다시 서버에게 요청을 보낸다.  

<div align="center">
  <img src="/images/posts/2022/polling-long-polling-and-spring-example-02.png" width="50%" class="image__border">
</div>
<center>https://rubberduck-debug.tistory.com/123</center>

## 2. Does the Long Polling always have advantages?

폴링은 주기적으로 데이터를 요청하기 때문에 의미 없이 서버의 리소스를 소비한다. 언뜻 보기엔 이벤트가 발생했을 때만 클라이언트로 응답을 주는 롱 폴링 방식이 더 유리해보인다. 하지만 항상 그렇진 않다. 간단한 예시를 살펴보자. 100명이 채팅하는 단체 채팅방을 롱 폴링으로 구현했다고 가정해보자. 누군가 한마디 메시지를 작성하면 100명이 동시에 응답을 받고, 100명이 동시에 다시 요청을 수행한다. 서버의 요청 큐(request queue)에 급작스런 요청이 몰리면서 서버에 부하가 발생할 수 있다. 

참고한 글에선 폴링, 롱 폴링 방식을 선택해야 하는 상황을 다음과 같이 정리하고 있다.

- 폴링 방식
  - 응답을 실시간으로 받지 않아도 되는 경우
  - 다수의 사용자가 동시에 사용하는 경우
  - 예를 들어, 전체 채팅이 필요한 웹 게임
- 롱 폴링 방식
  - 응답을 실시간으로 받아야하는 경우
  - 메신저 같이 1 on 1, 혹은 적은 수의 사용자가 동시에 사용하는 경우
  - 예를 들어, Facebook 웹 채팅, Google 메신저, MSN 웹 메신저

## 3. Implment long polling in Spring

폴링은 스프링에서 별도로 추가적인 작업이 필요 없다. 롱 폴링은 어떻게 구현할까? 요청이 왔을 때 서버는 해당 요청을 즉시 처리하지 않는다. 타임 아웃이 발생하기 전까지 최대한 응답을 미룬다. 타임 아웃이 발생하기 전에 비동기적인 이벤트가 발생하면 해당 요청에 대한 응답을 보낸다. 

스프링 애플리케이션의 서블릿 엔진은 기본적으로 리퀘스트-퍼-스레드(request-per-thread) 모델이다. 리퀘스트-퍼-스레드 방식인 경우 요청을 받은 스레드가 타임 아웃이 발생하기 전까지 다른 작업을 수행하지 못 한다. 이는 불합리하고 성능 문제도 발생한다. 스프링은 이런 문제를 해결하기 위한 비동기 응답 기능이 존재한다. 

### 2.1. DeferredResult Class

비동기 처리를 위해 DeferredResult 클래스가 등장헀다. 스프링 3.2부터 사용할 수 있다. 처리가 길어지는 연산을 `http-worker` 스레드가 아닌 다른 별도 스레드에게 분산하기 위해 사용한다. 

> Guide to DeferredResult in Spring<br/>
> DeferredResult, available from Spring 3.2 onwards, 
> assists in offloading a long-running computation from an http-worker thread to a separate thread.

디컴파일(decomplie)과 디버깅(debuging)으로 살펴본 코드 흐름을 정리해보면 다음과 같다.

1. `nio-http-worker` 스레드가 최초 사용자 요청을 받아 처리한다.
2. 컨트롤러 레이어(layer)까지 요청이 전달되면 요청을 받은 컨트롤러 객체는 DeferredResult 객체를 반환한다.
  - 요청이 반환되면 nio-http-work 스레드는 객체들 사이에 참조를 걸어 연결 고리를 만든다.
  - (ServletRequest, ServletResponse) - AsyncContext - WebAsyncManager - DeferredResult
3. nio-http-work 스레드는 스레드 풀(thread pool)로 돌아간다.
4. 타임 아웃 혹은 비동기적인 이벤트에 의해 DeferredResult 객체의 상태가 변경된다.
5. 스레드 풀에 담겨 있던 nio-http-worker 스레드가 타임 아웃 처리를 하거나 클라이언트에게 응답을 반환한다.
  - DeferredResult 객체의 변화가 참조를 따라 ServletResponse 객체까지 전달된다.

<div align="center">
  <img src="/images/posts/2022/polling-long-polling-and-spring-example-03.png" width="60%" class="image__border">
</div>
<center>https://jongmin92.github.io/2019/03/31/Java/java-async-1/</center>

### 2.2. DeferredResultController Class

특정 이벤트에 의해 컨트롤러에서 반환된 DeferredResult 객체의 상태를 변경해야 한다. 그렇므로 컨트롤러에서 반환하는 DeferredResult 객체를 임시로 보관할 필요가 있다. 이번 예제에선 ConcurrentHashMap 객체에 임시로 보관한다.

1. 메모리 누수가 발생할 수 있으니 다음과 같은 경우에 참조를 끊는다.. 
  - 이벤트 처리 완료
  - 이벤트 에러 발생
  - 타임 아웃
2. DeferredResult 객체를 ConcurrentHashMap 객체에서 보관한다.
  - 요청 경로의 ID를 맵(map)의 키로 사용한다.
3. DeferredResult 객체를 반환한다.

```java
package blog.in.action.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.async.DeferredResult;

import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@CrossOrigin
@RestController
@RequestMapping("/messages")
public class DeferredResultController {

    private final Map<String, Collection<String>> messagesMap = new ConcurrentHashMap<>();
    private final Map<String, DeferredResult<Collection<String>>> deferredResponsesMap = new ConcurrentHashMap<>();

    @GetMapping("/{id}")
    public DeferredResult<Collection<String>> getMessages(
            @PathVariable String id
    ) {
        DeferredResult<Collection<String>> deferredResult = new DeferredResult<>(); // 1
        deferredResult.onTimeout(() -> deferredResponsesMap.remove(id)); 
        deferredResult.onCompletion(() -> deferredResponsesMap.remove(id));
        deferredResult.onError((throwable -> deferredResponsesMap.remove(id)));
        deferredResponsesMap.put(id, deferredResult); // 2
        return deferredResult; // 3
    }

    ...

}
```

동일한 컨트롤러에 비동기 이벤트를 위한 다른 엔드-포인트를 만든다. 

1. 해당 ID에 매칭된 메시지 리스트를 꺼낸다.
  - 새로운 메세지를 추가한다.
2. 해당 ID에 매칭된 비동기 응답을 위한 DeferredResult 객체가 있다면 해당 메세지를 응답으로 전달한다.

```java
@RestController
@RequestMapping("/messages")
public class DeferredResultController {

    private final Map<String, Collection<String>> messagesMap = new ConcurrentHashMap<>();
    private final Map<String, DeferredResult<Collection<String>>> deferredResponsesMap = new ConcurrentHashMap<>();

    ...

    @PostMapping("/{id}")
    public void receiveMessage(
            @PathVariable String id,
            @RequestParam String message
    ) {
        Collection<String> messages = messagesMap.getOrDefault(id, new ConcurrentLinkedQueue<>()); // 1
        synchronized (messages) {
            messages.add(message);
        }
        messagesMap.put(id, messages);
        if (deferredResponsesMap.containsKey(id)) {  // 2
            deferredResponsesMap
                    .get(id)
                    .setResult(messages);
        }
    }
}
```

## 3. Demo

애플리케이션을 실행 후 비동기 이벤트로  정상적으로 동작하는지 살펴보자. 테스트를 위해 간단하게 롱 폴링을 수행하는 쉘 스크립트를 사용한다. 

1. `/messages/1` 경로로 롱-폴링을 수행한다.
  - 타임 아웃 시간은 10초로 지정한다.
2. cURL 명령어 호출 결과의 상태를 캡처한다.
3. 다음과 같이 동작한다.
  - 타임 아웃인 경우 "Request timed out." 메시지를 출력한다.
  - 응답 메세지를 출력한다.

```sh
URL="http://localhost:8080/messages/1"

while true; do
  RESPONSE=$(curl -m 10 -s $URL) # 1
  CURL_EXIT_STATUS=$? # 2
  if [ $CURL_EXIT_STATUS -eq 28 ]; then # 3
    echo "Request timed out."
  else
    echo "Response: $RESPONSE"
  fi
done

echo "Polling complete."
```

다음 비동기 이벤트를 일으키는 메시지 전송 스크립트를 살펴보자. 

- `/messages/1` 경로로 메시지를 전송한다.
- 메시지는 쉘 스크립트 커맨드라인 인자를 사용한다. 

```sh
curl -X POST\
  -H 'Content-Type: application/x-www-form-urlencoded'\
  -d 'message='$1\
  http://localhost:8080/messages/1
```

애플리케이션을 실행하고 두 스크립트를 실행해보자. 위쪽 터미널이 롱 폴링 스크립트, 아래 터미널이 메시지 전송 스크립트다.

- 롱 폴링 터미널
  - 메시지를 수신할 때마다 로그가 출력된다.
  - 타임 아웃이 발생하는 에러 로그가 출력된다.
- 메시지 전송 터미널
  - 미리 작성한 스크립트에 인자를 전달하여 메시지 전송한다.
  - x-www-form-urlencoded 컨텐츠 타입을 사용하기 때문에 띄어쓰기에서 "+" 문자열을 사용한다.

<div align="center">
  <img src="/images/posts/2022/polling-long-polling-and-spring-example-04.gif" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-01-04-polling-long-polling-and-spring-async-task>

#### RECOMMEND NEXT POSTS

- [Polling & Long Polling in JavaScript][polling-long-polling-and-javascript-example-link]

#### REFERENCE

- <https://rubberduck-debug.tistory.com/123>
- <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/context/request/async/DeferredResult.html>
- <https://www.baeldung.com/spring-deferred-result>
- <https://jongmin92.github.io/2019/03/31/Java/java-async-1/>

[async-nonblocking-link]: https://junhyunny.github.io/information/java/asynchronous-and-non-blocking-process/
[polling-long-polling-and-javascript-example-link]: https://junhyunny.github.io/information/javascript/polling-long-polling-and-javascript-example/
