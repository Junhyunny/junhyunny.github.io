---
title: "Repeatablely Read Message from Servlet Request"
search: false
category:
  - java
  - spring-boot
last_modified_at: 2023-06-30T23:55:00
---

<br/>

## 1. Problem Context

[HMAC 인증 필터][hmac-link]를 구현하면서 다음 에러를 만났습니다. 

* 실행 후 런타임에서 발생하는 에러 메세지

```
java.lang.IllegalStateException: getReader() has already been called for this request
    at org.apache.catalina.connector.Request.getInputStream(Request.java:1024) ~[tomcat-embed-core-10.1.10.jar:10.1.10]
    at org.apache.catalina.connector.RequestFacade.getInputStream(RequestFacade.java:298) ~[tomcat-embed-core-10.1.10.jar:10.1.10]
    at org.springframework.http.server.ServletServerHttpRequest.getBody(ServletServerHttpRequest.java:206) ~[spring-web-6.0.10.jar:6.0.10]
    at org.springframework.web.servlet.mvc.method.annotation.AbstractMessageConverterMethodArgumentResolver$EmptyBodyCheckingHttpInputMessage.<init>(AbstractMessageConverterMethodArgumentResolver.java:323) ~[spring-webmvc-6.0.10.jar:6.0.10]
    at org.springframework.web.servlet.mvc.method.annotation.AbstractMessageConverterMethodArgumentResolver.readWithMessageConverters(AbstractMessageConverterMethodArgumentResolver.java:172) ~[spring-webmvc-6.0.10.jar:6.0.10]
    ... 
```

* 테스트 실행 시 발생하는 에러 메세지

```
Request processing failed: java.lang.IllegalStateException: Cannot call getInputStream() after getReader() has already been called for the current request
jakarta.servlet.ServletException: Request processing failed: java.lang.IllegalStateException: Cannot call getInputStream() after getReader() has already been called for the current request
    at app//org.springframework.web.servlet.FrameworkServlet.processRequest(FrameworkServlet.java:1019)
    at app//org.springframework.web.servlet.FrameworkServlet.doPost(FrameworkServlet.java:914)
    ...
```

로그에서 볼 수 있듯이 요청(request) 객체에서 getReader() 메소드를 여러번 호출하여 에러가 발생합니다. 
HMAC 필터에서 application/json 형식의 데이터를 추출하는 작업을 수행했기 때문입니다. 

```java
@Component
public class HmacFilter extends OncePerRequestFilter {

    // ...

    private String getMessage(HttpServletRequest request) {
        try (BufferedReader reader = request.getReader()) {
            StringBuilder stringBuilder = new StringBuilder();
            String line = null;
            while ((line = reader.readLine()) != null) {
                stringBuilder.append(line);
            }
            return stringBuilder.toString();
        } catch (IOException ioException) {
            throw new RuntimeException(ioException);
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        var message = getMessage(request);

        // ...

        filterChain.doFilter(request, response);
    }
}
```

getReader() 메소드를 호출하지 않게 우회하더라도 문제가 발생합니다. 

* InputStream 객체는 메세지를 읽을 때 인덱스를 사용해 바이트 배열의 읽은 위치를 지나가기 때문에 다시 읽지 못 합니다.
* 요청 객체에 담긴 메세지가 필터에서 소비되어 컨트롤러 영역까지 전달되지 못합니다.
    * 요청 핸들러(request handler)에서 메세지가 누락되었다는 예외를 발생시킵니다.

```java
@Component
public class HmacFilter extends OncePerRequestFilter {

    // ...

    private String getMessage(HttpServletRequest request) {
        try (
                OutputStream outputStream = new ByteArrayOutputStream();
                InputStream inputStream = request.getInputStream()
        ) {
            inputStream.transferTo(outputStream);
            return outputStream.toString();
        } catch (IOException ioException) {
            throw new RuntimeException(ioException);
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        var message = getMessage(request);

        // ...

        filterChain.doFilter(request, response);
    }
}
```

* 요청 메세지를 필터에서 소비하기 때문에 서블릿 컨테이너에서 메세지를 보내지 않았다는 `bad request(400)`가 발생합니다.

```
$ ccurl -X POST http://localhost:8080/todos\
   -H 'Content-Type: application/json'\
   -d '{"content":"Hello World"}' | jq .

  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   121    0    96  100    25    866    225 --:--:-- --:--:-- --:--:--  1163
{
  "timestamp": "2023-07-01T14:01:04.009+00:00",
  "status": 400,
  "error": "Bad Request",
  "path": "/todos"
}

```

* 테스트 실행 시 동일하게 `bad request(400)`가 발생합니다.

```
MockHttpServletRequest:
      HTTP Method = POST
      Request URI = /todos
       Parameters = {}
          Headers = [Content-Type:"application/json;charset=UTF-8", Content-Length:"32"]
             Body = {"id":0,"content":"Hello World"}
    Session Attrs = {}

Handler:
             Type = action.in.blog.TodoController
           Method = action.in.blog.TodoController#createTodo(Todo)

Async:
    Async started = false
     Async result = null

Resolved Exception:
             Type = org.springframework.http.converter.HttpMessageNotReadableException

ModelAndView:
        View name = null
             View = null
            Model = null

FlashMap:
       Attributes = null

MockHttpServletResponse:
           Status = 400
    Error message = null
          Headers = []
     Content type = null
             Body = 
    Forwarded URL = null
   Redirected URL = null
          Cookies = []

Status expected:<200> but was:<400>
Expected :200
Actual   :400
```

## 2. Solve the problem

문제 해결을 위해 HttpServletRequestWrapper 클래스를 상속 받은 요청 클래스를 생성합니다. 

* 객체 생성시 메세지 인코딩 방법과 InputStream 객체에 저장된 원장(origin) 데이터를 필드에 저장합니다.
* 클라이언트(client)가 InputStream 객체나 Reader 객체를 요청하면 원장 데이터를 담은 객체를 전달합니다.

```java
package action.in.blog;

import io.micrometer.common.util.StringUtils;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

public class RepeatableReadRequest extends HttpServletRequestWrapper {

    private final Charset encoding;
    private final byte[] rawBytes;

    public RepeatableReadRequest(HttpServletRequest request) {
        super(request);
        String characterEncoding = request.getCharacterEncoding();
        if (StringUtils.isBlank(characterEncoding)) {
            characterEncoding = StandardCharsets.UTF_8.name();
        }
        encoding = Charset.forName(characterEncoding);
        try {
            rawBytes = request.getInputStream().readAllBytes();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public ServletInputStream getInputStream() throws IOException {
        var byteInputStream = new ByteArrayInputStream(rawBytes);
        return new ServletInputStream() {
            @Override
            public boolean isFinished() {
                return false;
            }

            @Override
            public boolean isReady() {
                return false;
            }

            @Override
            public void setReadListener(ReadListener listener) {
            }

            @Override
            public int read() throws IOException {
                return byteInputStream.read();
            }
        };
    }

    @Override
    public BufferedReader getReader() throws IOException {
        return new BufferedReader(new InputStreamReader(this.getInputStream(), this.encoding));
    }
}
```

위 요청 객체를 래핑할 수 있는 클래스를 필터에서 사용합니다. 

* 요청 객체를 위에서 생성한 RepeatableReadRequest 클래스로 감쌉니다.
* 래핑된 객체를 사용해 메세지를 추출합니다.
* 래핑된 객체를 필터 체인(filter chain)에 전달합니다. 

```java
@Component
public class HmacFilter extends OncePerRequestFilter {

    // ...

    private String getMessage(HttpServletRequest request) {
        try (
                OutputStream outputStream = new ByteArrayOutputStream();
                InputStream inputStream = request.getInputStream()
        ) {
            inputStream.transferTo(outputStream);
            return outputStream.toString();
        } catch (IOException ioException) {
            throw new RuntimeException(ioException);
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        var wrappedRequest = new RepeatableReadRequest(request);
        var message = getMessage(wrappedRequest);

        // ...

        filterChain.doFilter(wrappedRequest, response);
    }
}
```

##### Result

위 방법으로 해당 문제를 해결하면 정상적으로 요청 메세지가 전달됩니다.

```
$ curl -X POST http://localhost:8080/todos\
   -H 'Content-Type: application/json'\
   -d '{"content":"Hello World"}' | jq .

  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    60    0    35  100    25   4490   3207 --:--:-- --:--:-- --:--:-- 30000
{
  "id": 1000,
  "content": "Hello World"
}
```

## CLOSING

전체 구현 코드를 확인하시려면 [HMAC(Hash-based Message Authentication Code)][hmac-link] 포스트를 참고하시길 바랍니다. 

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-06-28-hmac>

#### RECOMMEND NEXT POSTS

* [HMAC(Hash-based Message Authentication Code)][hmac-link]

#### REFERENCE

* <https://meetup.nhncloud.com/posts/44>
* <https://aljjabaegi.tistory.com/683>
* <https://dylee.tistory.com/6>

[hmac-link]: https://junhyunny.github.io/information/security/java/spring/hmac/