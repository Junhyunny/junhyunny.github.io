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

대부분 아시겠지만 클라이언트에서 서버 데이터 변경 사항들을 실시간으로 반영하기 위해 폴링(polling), 롱 폴링(long polling) 같은 방법을 사용합니다. 
최근에 우연히 폴링과 롱 폴링에 관련된 포스트를 읽었습니다. 
롱 폴링에 대해 개념 정도는 알고 있었는데, 읽는 순간 번뜩 의문점이 생겼습니다. 

> 롱 폴링은 서버에서 이벤트가 발생하기 전까지 응답을 주지 않아야 하는데 어떤 방식으로 구현하지? 

평소 구현할 기능이 단순하고, 구현이 쉽기 때문에 주로 폴링 방법을 사용하다보니 롱 폴링에 대해 고민해보지 않았습니다. 
제공할 서비스 특징이나 서버 부하를 고려했다면 롱 폴링도 고민해봤을텐데, 아직 모자른 부분이 많은 것 같습니다. 
폴링과 롱 폴링에 대해 비교, 정리하고 주 기술 스택인 스프링으로 간단한 테스트 코드를 작성해보겠습니다. 

## 1. 폴링(Polling)과 롱 폴링(Long Polling)

### 1.1. 폴링(Polling)

처음으로 폴링에 대해서 알아보겠습니다. 
클라이언트가 일정 주기로 서버에게 필요한 데이터를 요청하는 방식입니다. 
가장 쉬운 방법이지만, 변경 사항이 있든지 없든지 계속 요청을 보내기 때문에 서버에 부담을 주게 됩니다. 
데이터를 요청하는 주기가 짧아질수록 부하는 커지게 됩니다. 
네트워크나 HTTP 커넥션(connection)을 맺기 위한 비용이 계속 발생합니다. 

##### 폴링 방식

<p align="center">
    <img src="/images/posts/2022/polling-long-polling-and-spring-example-01.png" width="50%" class="image__border">
</p>
<center>https://rubberduck-debug.tistory.com/123</center>

### 1.2. 롱 폴링(Long Polling) 방식

다음으로 롱 폴링에 대해 알아보겠습니다. 
서버는 클라이언트 요청에 대해 즉시 응답을 주지 않습니다. 
다음과 같은 순서로 진행됩니다. 
- 클라이언트가 서버에게 요청을 보냅니다.
- 서버는 즉시 응답을 주지 않습니다.
- 특정 이벤트가 발생하거나 타임아웃(timeout)이 발생하면 응답을 전달합니다.
- 응답을 받은 클라이언트는 다시 서버에게 데이터를 요청합니다. 

##### 롱 폴링 방식

<p align="center">
    <img src="/images/posts/2022/polling-long-polling-and-spring-example-02.png" width="50%" class="image__border">
</p>
<center>https://rubberduck-debug.tistory.com/123</center>

### 1.3. 롱 폴링 방식은 항상 유리한가?

폴링은 주기적으로 데이터를 요청하면서 의미없이 서버의 리소스를 소비하게 됩니다. 
언뜻 보기에 이벤트가 발생했을 때만 클라이언트로 응답을 주는 롱 폴링 방식이 유용해보입니다. 
**하지만, 항상 그렇지는 않습니다.** 
예를 들어 100명이 채팅하는 단체 채팅방을 롱 폴링으로 구현했다고 가정합니다. 
누군가 한마디 메시지를 작성하면 100명이 동시에 응답을 받고, 100명이 동시에 다시 요청을 수행합니다. 
서버의 요청 큐(request queue)에 급작스런 요청이 몰리면서 서버에 부하가 발생할 수 있습니다. 
클라이언트에게 제공해야하는 서비스 성격과 특징에 따라 적절한 방식을 선택하는 것이 좋아보입니다. 

참고한 포스트에서는 다음과 같이 정리하고 있습니다. 
- 롱 폴링 방식 선택
    - 응답을 실시간으로 받아야하는 경우
    - 메신저 같이 1 on 1, 혹은 적은 수의 사용자가 동시에 사용하는 경우
    - 예를 들어, Facebook 웹 채팅, Google 메신저, MSN 웹 메신저
- 폴링 방식 선택
    - 응답을 실시간으로 받지 않아도 되는 경우
    - 다수의 사용자가 동시에 사용하는 경우
    - 예를 들어, 전체 채팅이 필요한 웹 게임

## 2. 스프링(spring)에서 롱 폴링 구현하기

폴링을 위해 서버에서 별도로 필요한 작업은 없습니다. 
지금부터 이번 포스트를 작성하게 된 계기, 스프링에서 어떻게 롱 폴링을 구현하는지 정리해보겠습니다. 
일반적으로 HTTP 요청에 대한 응답 방식은 동기식으로 처리됩니다. 
요청에 대한 처리를 수행하는 동안 블록킹(blocking)되며, 모든 처리가 완료된 후에 응답을 전달합니다. 

하지만, 롱 폴링의 경우 응답을 타임아웃까지 최대한 미뤘다 특정 이벤트가 발생하는 시점에 전달합니다. 
전통적인 방식대로라면 이를 위해 요청을 받은 서블릿 스레드가 이벤트나 타임아웃이 발생하기 전까지 다른 일을 하지 못하고 대기하게 됩니다. 
이는 굉장히 불합리하고 성능에 문제가 됩니다. 
스프링엔 이런 문제를 해결하기 위한 비동기 처리 기능이 존재합니다.

### 2.1. DeferredResult 클래스

> Guide to DeferredResult in Spring<br/>
> DeferredResult, available from Spring 3.2 onwards, 
> assists in offloading a long-running computation from an http-worker thread to a separate thread.

롱 폴링 구현에 필요한 주요 클래스에 대해 알아보겠습니다. 
DeferredResult 클래스는 비동기 처리를 위해 등장하였습니다. 
스프링 3.2 부터 사용할 수 있습니다. 
처리가 길어지는 연산을 `http-worker` 스레드가 아닌 다른 별도 스레드에게 분산하기 위해 사용합니다. 
자세한 내용은 다른 비동기 처리 방식들과 함께 별도 포스트로 정리하겠습니다. 

##### DeferredResult 인스턴스 반환을 통한 비동기 처리 방식

디컴파일과 디버깅을 통해 분석한 내용을 일부 추가, 정리하겠습니다.
- `nio-http-worker` 스레드가 최초 사용자 요청을 받습니다.
- 컨트롤러가 `DeferredResult` 객체를 반환하면 `nio-http-worker` 스레드에 의해 아래 객체들 사이에 참조를 만들어집니다.
    - DeferredResult
    - WebAsyncManager
    - AsyncWebRequest
    - AsyncContext
    - ServletRequest
    - ServletResponse
    - 이 시점에 클라이언트에게 응답을 보내지 않습니다.
- `서블릿 요청/응답 객체 - 비동기 컨텍스트 객체 - 비동기 매니저 객체 - 지연 응답 객체` 사이에 참조를 모두 생성해주면 `nio-http-worker` 스레드는 풀(pool)로 이동합니다.
- 이후 타임아웃이나 다른 스레드(`nio-http-worker` 혹은 다른 종류의 worker)에 의해 발생한 이벤트로 `DeferredResult` 객체의 결과가 변경됩니다.
- `nio-http-worker` 스레드가 다시 스레드 풀에서 나와 타임아웃되거나 완료된 대상을 처리합니다.

<p align="center">
    <img src="/images/posts/2022/polling-long-polling-and-spring-example-03.png" width="60%" class="image__border">
</p>
<center>https://jongmin92.github.io/2019/03/31/Java/java-async-1/</center>

### 2.2. DeferredResultController 클래스 테스트

롱 폴링을 이용한 2차 인증 대기 기능을 위한 컨트롤러 개발을 가정하여 테스트를 작성하였습니다. 
테스트 코드를 통해 먼저 기능을 정의하였습니다. 
다음 테스트 코드들은 `Given-When-Then 패턴`에 맞춰 명명하였습니다. 

```java
package blog.in.action.controller;

// ...

public class DeferredResultControllerTest {

    MockMvc mockMvc;

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(new DeferredResultController()).build();
    }

    @Test
    public void givenUserNameParams_whenRequestAuthentication_thenIsOk() throws Exception {

        mockMvc.perform(get("/authentication")
                        .param("userName", "Junhyunny"))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted());
    }

    @Test
    public void givenUserNameParams_whenRequestAuthentication_thenPoolSizeOne() throws Exception {

        mockMvc.perform(get("/authentication")
                        .param("userName", "Junhyunny"))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted());

        mockMvc.perform(get("/pool-size"))
                .andExpect(status().isOk())
                .andExpect(content().string("1"));
    }

    @Test
    public void givenUserNameParams_whenAuthenticate_thenIsOk() throws Exception {

        mockMvc.perform(post("/authentication")
                        .param("userName", "Junhyunny"))
                .andExpect(status().isOk());
    }

    @Test
    public void givenRequestAuthenticationAuthenticate_whenAsyncDispatch_thenReturnTrue() throws Exception {

        // given
        MvcResult result = mockMvc.perform(get("/authentication")
                        .param("userName", "Junhyunny"))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted())
                .andReturn();
        mockMvc.perform(post("/authentication")
                        .param("userName", "Junhyunny"))
                .andExpect(status().isOk());

        // when, then
        mockMvc.perform(asyncDispatch(result))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    public void givenRequestAuthenticationAuthenticate_whenAsyncDispatch_thenPoolSizeZero() throws Exception {

        // given
        mockMvc.perform(get("/authentication")
                        .param("userName", "Junhyunny"))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted())
                .andReturn();
        mockMvc.perform(post("/authentication")
                        .param("userName", "Junhyunny"))
                .andExpect(status().isOk());

        // when, then
        mockMvc.perform(get("/pool-size"))
                .andExpect(status().isOk())
                .andExpect(content().string("0"));
    }

    @Test
    public void givenRequestAuthentication_whenTimeout_thenIs5xxServerError() throws Exception {

        // given
        MvcResult result = mockMvc.perform(get("/authentication")
                        .param("userName", "Junhyunny"))
                .andExpect(request().asyncStarted())
                .andReturn();

        // when
        MockAsyncContext ctx = (MockAsyncContext) result.getRequest().getAsyncContext();
        for (AsyncListener listener : ctx.getListeners()) {
            listener.onTimeout(null);
        }

        // then
        mockMvc.perform(asyncDispatch(result))
                .andExpect(status().is5xxServerError());
    }

    @Test
    public void givenRequestAuthentication_whenTimeout_thenPoolSizeZero() throws Exception {

        // given
        MvcResult result = mockMvc.perform(get("/authentication")
                        .param("userName", "Junhyunny"))
                .andExpect(request().asyncStarted())
                .andReturn();

        // when
        MockAsyncContext ctx = (MockAsyncContext) result.getRequest().getAsyncContext();
        for (AsyncListener listener : ctx.getListeners()) {
            listener.onTimeout(null);
        }

        // then
        mockMvc.perform(get("/pool-size"))
                .andExpect(status().isOk())
                .andExpect(content().string("0"));
    }
}
```

### 2.3. DeferredResultController 클래스 구현

테스트를 통과시킬 수 있도록 기능을 확장해나가면서 구현하였습니다. 
- authenticate 메소드
    - 스터빙(stubbing), 스파이(spy) 사용이 제한되어 테스트를 위해 메소드입니다.
    - 타임아웃이나 이벤트 처리 완료시 정상적으로 요청 풀에서 삭제되었는지 확인합니다.
- requestAuthentication 메소드
    - 인증 요청 발생시 DeferredResult 객체를 인증 풀에 담고, 이를 반환합니다.
    - 타임아웃, 완료, 에러 발생시 수행할 콜백 메소드들을 매칭시킵니다. 
- authenticate 메소드
    - 인증 완료 요청 시 풀에서 사용자 이름으로 DeferredResult 객체를 찾음과 동시에 제거합니다.
    - 찾지 못하였으면 메소드를 종료합니다.
    - 찾은 경우 결과를 `true`로 설정합니다.

```java
package blog.in.action.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.async.DeferredResult;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
public class DeferredResultController {

    private Map<String, DeferredResult<Boolean>> secondAuthRequests = new ConcurrentHashMap<>();

    @GetMapping("/pool-size")
    public int authenticate() {
        return secondAuthRequests.size();
    }

    @GetMapping("/authentication")
    public DeferredResult<Boolean> requestAuthentication(@RequestParam("userName") String userName) {
        DeferredResult<Boolean> deferredResult = new DeferredResult<>();
        deferredResult.onTimeout(() -> {
            secondAuthRequests.remove(userName);
        });
        deferredResult.onCompletion(() -> {
            secondAuthRequests.remove(userName);
        });
        deferredResult.onError((throwable -> {
            deferredResult.setErrorResult(false);
            secondAuthRequests.remove(userName);
        }));
        secondAuthRequests.put(userName, deferredResult);
        return deferredResult;
    }

    @PostMapping("/authentication")
    public void authenticate(@RequestParam("userName") String userName) {
        DeferredResult secondAuthRequest = secondAuthRequests.remove(userName);
        if (secondAuthRequest == null) {
            return;
        }
        secondAuthRequest.setResult(true);
        return;
    }
}
```

## 3. 테스트 코드 특이사항

해피 패스(happy path)인 경우 테스트가 단순했지만, 타임아웃에 대한 테스트 구현이 어려웠습니다. 
비동기 처리시 타임아웃을 유발할 수 있는 방법이 두 가지 있습니다. 

### 3.1. 타임아웃 시간 감소
- 비동기 응답시 사용하는 `AsyncContext`을 이용해 타임아웃 발생 시간을 감소시킵니다.
- `asyncDispatch()` 혹은 `result.getAsyncResult()` 메소드 호출시 타임아웃으로 인한 `IllegalStateException` 예외를 확인합니다.

```java
        // given
        MvcResult result = mockMvc.perform(get("/authentication")
                        .param("userName", "Junhyunny"))
                .andExpect(request().asyncStarted())
                .andReturn();

        result.getRequest().getAsyncContext().setTimeout(10);

        // when, then
        assertThrows(IllegalStateException.class, () -> {
            asyncDispatch(result);
            // result.getAsyncResult(); // 동일한 결과
        });
```

### 3.2. 강제 타임아웃 이벤트 실행
- 비동기 응답시 사용하는 `AsyncContext`를 획득합니다.
- 해당 컨텍스트에 담긴 리스너(listener)를 이용해 강제로 타임아웃 이벤트를 실행합니다.
- 이후 `asyncDispatch` 메소드를 이용해 비동기 처리에 대한 디스패치(dispatch)를 수행합니다.

```java
        // given
        MvcResult result = mockMvc.perform(get("/authentication")
                        .param("userName", "Junhyunny"))
                .andExpect(request().asyncStarted())
                .andReturn();

        // when
        MockAsyncContext ctx = (MockAsyncContext) result.getRequest().getAsyncContext();
        for (AsyncListener listener : ctx.getListeners()) {
            listener.onTimeout(null);
        }

        // then
        mockMvc.perform(asyncDispatch(result))
                .andExpect(status().is5xxServerError());
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-01-04-polling-long-polling-and-spring-async-task>

#### RECOMMEND NEXT POSTS

- [폴링(Polling), 롱 폴링(Long polling) 그리고 JavaScript 예제][polling-long-polling-and-javascript-example-link]

#### REFERENCE

- <https://rubberduck-debug.tistory.com/123>
- <https://kuimoani.tistory.com/74>
- <https://www.baeldung.com/spring-deferred-result>
- <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/context/request/async/DeferredResult.html>
- <https://jongmin92.github.io/2019/03/31/Java/java-async-1/>

[async-nonblocking-link]: https://junhyunny.github.io/information/java/asynchronous-and-non-blocking-process/
[polling-long-polling-and-javascript-example-link]: https://junhyunny.github.io/information/javascript/polling-long-polling-and-javascript-example/
