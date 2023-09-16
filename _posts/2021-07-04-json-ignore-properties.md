---
title: "StackOverFlowError and @JsonIgnoreProperties Annotation"
search: false
category:
  - spring-boot
  - junit
last_modified_at: 2021-09-04T13:00:00
---

<br/>

## 1. Problem Context

API 엔드 포인트(end-point) 개발 중 다음과 같은 에러를 만났습니다. 

* 잭슨(jackson) 라이브러리에서 직렬화(serialize)를 수행할 때 무한 재귀(infinite recursion)을 수행합니다.
* `StackOverflowError`가 발생합니다.

```
2023-09-14T00:42:29.816+09:00 ERROR 15028 --- [nio-8080-exec-6] o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed: org.springframework.http.converter.HttpMessageNotWritableException: Could not write JSON: Infinite recursion (StackOverflowError)] with root cause

java.lang.StackOverflowError: null
	at java.base/java.lang.Exception.<init>(Exception.java:85) ~[na:na]
	at java.base/java.io.IOException.<init>(IOException.java:80) ~[na:na]
	at com.fasterxml.jackson.core.JacksonException.<init>(JacksonException.java:26) ~[jackson-core-2.15.2.jar:2.15.2]
	at com.fasterxml.jackson.core.JsonProcessingException.<init>(JsonProcessingException.java:25) ~[jackson-core-2.15.2.jar:2.15.2]
	at com.fasterxml.jackson.databind.DatabindException.<init>(DatabindException.java:22) ~[jackson-databind-2.15.2.jar:2.15.2]
	at com.fasterxml.jackson.databind.DatabindException.<init>(DatabindException.java:34) ~[jackson-databind-2.15.2.jar:2.15.2]
... 
	at com.fasterxml.jackson.databind.ser.impl.IndexedListSerializer.serializeContentsUsing(IndexedListSerializer.java:142) ~[jackson-databind-2.15.2.jar:2.15.2]
	at com.fasterxml.jackson.databind.ser.impl.IndexedListSerializer.serializeContents(IndexedListSerializer.java:88) ~[jackson-databind-2.15.2.jar:2.15.2]
	at com.fasterxml.jackson.databind.ser.impl.IndexedListSerializer.serialize(IndexedListSerializer.java:79) ~[jackson-databind-2.15.2.jar:2.15.2]
	at com.fasterxml.jackson.databind.ser.impl.IndexedListSerializer.serialize(IndexedListSerializer.java:18) ~[jackson-databind-2.15.2.jar:2.15.2]
	at com.fasterxml.jackson.databind.ser.BeanPropertyWriter.serializeAsField(BeanPropertyWriter.java:732) ~[jackson-databind-2.15.2.jar:2.15.2]
...
```

## 2. Problem Analysis

문제를 살펴보니 단순 조회성 API 엔드 포인트였지만, 문제가 발생시키는 객체 구조를 가진 상태였습니다. 
당시 상황을 재현한 코드를 통해 원인을 알아보겠습니다. 

### 2.1. Circular Reference

> A circular reference is a series of references where the last object references the first, resulting in a closed loop

객체 사이에 닫힌 루프(loop)가 생기는 것을 의미합니다. 
아래 그림을 보면 빨간색 참조 그래프가 서로 맞물려 닫힌 루프를 생성합니다. 

* 참조하는 객체가 정리되지 않기 때문에 가비지 컬렉션(garbage collection) 대상이 되지 않으므로 메모리 누수가 발생할 수 있습니다.
* 메소드 호출시 재귀 호출을 통해 스택 오버플로우 에러가 발생할 수 있습니다. 

<p align="center">
    <img src="/images/json-ignore-properties-1.jpg" width="40%" class="image__border">
</p>
<center>https://en.wikipedia.org/wiki/Circular_reference</center>

### 2.2. Domain Classes

도메인 객체들을 살펴보니 다음과 같은 구조를 가지고 있었습니다. 

* 포스트(post) 객체는 자신의 댓글(reply) 객체들을 리스트로 참조하고 있습니다.
* 댓글 객체는 자신과 연관된 포스트 객체를 참조하고 있습니다.

<p align="center">
    <img src="/images/json-ignore-properties-2.jpg" width="80%" class="image__border">
</p>

#### 2.2.1. Post Record

```java
package blog.in.action.domain;

import lombok.Builder;

import java.util.List;

public record Post(
        long id,
        String content,
        List<Reply> replies
) {
    @Builder
    public Post {
    }

    public void addReply(Reply reply) {
        this.replies.add(reply);
    }
}
```

#### 2.2.2. Reply Record

```java
package blog.in.action.domain;

import lombok.Builder;

public record Reply(
        long id,
        String content,
        Post post
) {
    @Builder
    public Reply {
    }
}
```

### 2.3. Jackson

스프링 프레임워크(spring framework)에서 Json 변환에 기본적으로 사용되는 라이브러리는 잭슨입니다. 
잭슨은 게터(getter), 세터(setter) 메소드를 기준으로 직렬화(serialilze), 역직렬화(deserialize)를 수행합니다. 
위 도메인 객체를 Json 형태로 직렬화하는 경우 다음과 같은 흐름이 발생합니다. 

1. Post 객체가 직렬화된다.
1. Post 객체 내부의 replies 필드를 직렬화한다.
1. Reply 객체가 직렬화된다.
1. Reply 객체 내부의 post 필드를 직렬화한다.
1. Post 객체가 직렬화된다.
1. 이를 반복 수행하다 StackOverFlowError가 발생한다.

## 3. Solve the problem

문제를 해결하는 방법은 여러가지 있지만, 이번 포스트에선 @JsonIgnoreProperties 애너테이션을 사용한 해결 방법을 정리하였습니다. 

### 3.1. @JsonIgnoreProperties Annotation

JSON 직렬화 작업에서 순환 참조를 끊기 위해 @JsonIgnoreProperties 애너테이션을 사용합니다. 
특정 객체의 내부 프로퍼티들 중 Json 형태로 직렬화할 대상을 제외할 수 있습니다. 

```java
@Target({ElementType.ANNOTATION_TYPE, ElementType.TYPE, ElementType.METHOD, ElementType.CONSTRUCTOR, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@JacksonAnnotation
public @interface JsonIgnoreProperties {

    /**
     * Names of properties to ignore.
     */
    public String[] value() default { };

    ...
}
```

### 3.2. Test

#### 3.2.1. PostController Class

Post 객체와 Reply 객체의 순환 참조를 만들고 이를 반환합니다.

```java
package blog.in.action.controller;

import blog.in.action.domain.Post;
import blog.in.action.domain.Reply;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
public class PostController {

    @GetMapping("/posts")
    public List<Post> getPosts() {

        var post = Post.builder()
                .id(1L)
                .content("Hello World")
                .replies(new ArrayList<>())
                .build();

        var reply = Reply.builder()
                .id(1L)
                .content("This is reply")
                .post(post)
                .build();

        post.addReply(reply);

        return List.of(post);
    }
}
```

#### 3.2.2. Throw Excecption

해당 API 경로를 호출하면 에러가 발생하는지 확인합니다.

```java
package blog.in.action;

import blog.in.action.controller.PostController;
import com.fasterxml.jackson.databind.JsonMappingException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.HttpMessageNotWritableException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.isNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

public class ActionInBlogTest {

    MockMvc mockMvc;

    @BeforeEach
    void beforeEach() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(PostController.class)
                .build();
    }

    @Test
    void withoutJsonIgnoreProperties_throwException() {

        var throwable = assertThrows(Exception.class, () -> mockMvc.perform(get("/posts")));


        var cause = throwable.getCause();
        assertInstanceOf(HttpMessageNotWritableException.class, throwable.getCause());
        assertInstanceOf(JsonMappingException.class, cause.getCause());
        cause.printStackTrace();
    }
}
```

##### Result 

* 로그를 살펴보면 StackOverflowError 에러가 원인임을 확인할 수 있습니다. 

```
13:46:48.440 [main] INFO org.springframework.mock.web.MockServletContext -- Initializing Spring TestDispatcherServlet ''
13:46:48.441 [main] INFO org.springframework.test.web.servlet.TestDispatcherServlet -- Initializing Servlet ''
13:46:48.445 [main] INFO org.springframework.test.web.servlet.TestDispatcherServlet -- Completed initialization in 2 ms
13:46:48.566 [main] WARN org.springframework.web.servlet.mvc.support.DefaultHandlerExceptionResolver -- Failure while trying to resolve exception [org.springframework.http.converter.HttpMessageNotWritableException]
java.lang.IllegalStateException: Cannot set error status - response is already committed
	at org.springframework.util.Assert.state(Assert.java:76)
	at org.springframework.mock.web.MockHttpServletResponse.sendError(MockHttpServletResponse.java:586)
	at org.springframework.web.servlet.mvc.support.DefaultHandlerExceptionResolver.sendServerError(DefaultHandlerExceptionResolver.java:581)
	at org.springframework.web.servlet.mvc.support.DefaultHandlerExceptionResolver.handleHttpMessageNotWritable(DefaultHandlerExceptionResolver.java:548)
	at org.springframework.web.servlet.mvc.support.DefaultHandlerExceptionResolver.doResolveException(DefaultHandlerExceptionResolver.java:221)
	at org.springframework.web.servlet.handler.AbstractHandlerExceptionResolver.resolveException(AbstractHandlerExceptionResolver.java:141)
	at org.springframework.web.servlet.handler.HandlerExceptionResolverComposite.resolveException(HandlerExceptionResolverComposite.java:80)
	at org.springframework.web.servlet.DispatcherServlet.processHandlerException(DispatcherServlet.java:1341)
	at org.springframework.test.web.servlet.TestDispatcherServlet.processHandlerException(TestDispatcherServlet.java:144)
	at org.springframework.web.servlet.DispatcherServlet.processDispatchResult(DispatcherServlet.java:1152)
	at org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1098)
	at org.springframework.web.servlet.DispatcherServlet.doService(DispatcherServlet.java:974)
	at org.springframework.web.servlet.FrameworkServlet.processRequest(FrameworkServlet.java:1011)
	at org.springframework.web.servlet.FrameworkServlet.doGet(FrameworkServlet.java:903)
	at jakarta.servlet.http.HttpServlet.service(HttpServlet.java:564)
    ...
org.springframework.http.converter.HttpMessageNotWritableException: Could not write JSON: Infinite recursion (StackOverflowError)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.lambda$executeRecursively$8(NodeTestTask.java:141)
	at org.junit.platform.engine.support.hierarchical.Node.around(Node.java:137)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.lambda$executeRecursively$9(NodeTestTask.java:139)
	at org.junit.platform.engine.support.hierarchical.ThrowableCollector.execute(ThrowableCollector.java:73)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.executeRecursively(NodeTestTask.java:138)
	at org.junit.platform.engine.support.hierarchical.NodeTestTask.execute(NodeTestTask.java:95)
	at java.base/java.util.ArrayList.forEach(ArrayList.java:1511)
	at org.junit.platform.engine.support.hierarchical.SameThreadHierarchicalTestExecutorService.invokeAll(SameThreadHierarchicalTestExecutorService.java:41)
    ...
Caused by: com.fasterxml.jackson.databind.JsonMappingException: Infinite recursion (StackOverflowError) (through reference chain: blog.in.action.domain.Reply["post"]->blog.in.action.domain.Post["replies"]->java.util.ArrayList[0]...
	at com.fasterxml.jackson.databind.ser.std.BeanSerializerBase.serializeFields(BeanSerializerBase.java:787)
	at com.fasterxml.jackson.databind.ser.BeanSerializer.serialize(BeanSerializer.java:178)
	at com.fasterxml.jackson.databind.ser.impl.IndexedListSerializer.serializeContentsUsing(IndexedListSerializer.java:142)
	at com.fasterxml.jackson.databind.ser.impl.IndexedListSerializer.serializeContents(IndexedListSerializer.java:88)
	at com.fasterxml.jackson.databind.ser.impl.IndexedListSerializer.serialize(IndexedListSerializer.java:79)
	at com.fasterxml.jackson.databind.ser.impl.IndexedListSerializer.serialize(IndexedListSerializer.java:18)
    ...
```

#### 3.2.3. Fix Exception with @JsonIgnoreProperties

Reply 클래스를 다음과 같이 변경합니다.

* Post 객체의 프로퍼티 중 `replies`를 Json 직렬화 대상에서 제외합니다.

```java
package blog.in.action.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;

public record Reply(
        long id,
        String content,
        @JsonIgnoreProperties(value = "replies")
        Post post
) {
    @Builder
    public Reply {
    }
}
```

#### 3.2.4. Response is ok

정상적으로 응답을 받습니다. 

```java
package blog.in.action;

import blog.in.action.controller.PostController;
import com.fasterxml.jackson.databind.JsonMappingException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.HttpMessageNotWritableException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.isNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

public class ActionInBlogTest {

    MockMvc mockMvc;

    @BeforeEach
    void beforeEach() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(PostController.class)
                .build();
    }

    // ...

    @Test
    void withJsonIgnoreProperties_isOk() throws Exception {

        mockMvc.perform(get("/posts"))
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].content").value("Hello World"))
                .andExpect(jsonPath("$[0].replies[0].id").value(1L))
                .andExpect(jsonPath("$[0].replies[0].content").value("This is reply"))
                .andExpect(jsonPath("$[0].replies[0].post.id").value(1L))
                .andExpect(jsonPath("$[0].replies[0].post.content").value("Hello World"))
                .andExpect(jsonPath("$[0].replies[0].post.replies").doesNotExist())
                .andDo(print())
        ;
    }
}
```

##### Result

* Reply 객체의 프로퍼티인 Post 객체의 `replies` 프로퍼티는 직렬화되지 않습니다. 

```
13:53:06.203 [main] INFO org.springframework.mock.web.MockServletContext -- Initializing Spring TestDispatcherServlet ''
13:53:06.204 [main] INFO org.springframework.test.web.servlet.TestDispatcherServlet -- Initializing Servlet ''
13:53:06.208 [main] INFO org.springframework.test.web.servlet.TestDispatcherServlet -- Completed initialization in 2 ms

MockHttpServletRequest:
      HTTP Method = GET
      Request URI = /posts
       Parameters = {}
          Headers = []
             Body = <no character encoding set>
    Session Attrs = {}

Handler:
             Type = blog.in.action.controller.PostController
           Method = blog.in.action.controller.PostController#getPosts()

Async:
    Async started = false
     Async result = null

Resolved Exception:
             Type = null

ModelAndView:
        View name = null
             View = null
            Model = null

FlashMap:
       Attributes = null

MockHttpServletResponse:
           Status = 200
    Error message = null
          Headers = [Content-Type:"application/json"]
     Content type = application/json
             Body = [{"id":1,"content":"Hello World","replies":[{"id":1,"content":"This is reply","post":{"id":1,"content":"Hello World"}}]}]
    Forwarded URL = null
   Redirected URL = null
          Cookies = []
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-07-04-json-ignore-properties>

#### REFERENCE

* <https://en.wikipedia.org/wiki/Circular_reference>