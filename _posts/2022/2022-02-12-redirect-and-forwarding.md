---
title: "리다이렉트(redirect)와 포워딩(forwarding)"
search: false
category:
  - information
last_modified_at: 2025-12-30T23:55:00
---

<br/>

## 0. 들어가면서

[OncePerRequestFilter 클래스에 관련된 글][once-per-request-filter-link]을 작성하면서 리다이렉트(redirect)와 포워딩(forwarding)에 대한 개념을 다시 살펴봤다. 기초적인 내용이고 서버 사이드 렌더링 방식을 사용할 때 많이 접하지만, 이번에 다시 리마인드 할 수 있어서 좋았다. 찾아본 김에 블로그에 정리했다. 동작 과정은 톰캣과 스프링을 기준으로 작성하였다.

## 1. 리다이렉트(Redirect)

다음과 같은 과정을 통해 리다이렉트가 이뤄진다.

1. 브라우저는 서버에게 요청을 보낸다.
2. 서버는 302 응답 코드와 함께 재요청할 수 있는 주소를 `Location`으로 표시하여 응답한다.
3. 브라우저는 해당 응답을 확인 후 `Location` 위치로 재요청을 보낸다.
4. 브라우저는 서버로부터 응답을 받는다.

위와 같은 과정을 통해 리다이렉트가 이뤄지다보니 **브라우저 입장에선 URL 경로가 바뀌게 된다.** 서버 입장에서는 새로운 요청이 들어온 것이며, 새로운 요청, 응답 객체를 만들어 이를 처리한다. 

<div align="center">
  <img src="/images/posts/2022/redirect-and-forwarding-01.png" width="100%" class="image__border">
</div>

## 2. 포워딩(Forwarding)

다음과 같은 과정을 통해 포워딩이 이루어진다.

1. 브라우저는 `/will-forward` 경로로 서버에게 요청을 보낸다.
2. 서버는 해당 경로의 요청을 처리하는 중에 이를 다른 경로(`/forwared`)에서 이를 처리하도록 전달한다. 이때 최초 만들어진 요청과 응답 객체를 그대로 함께 전달한다.
3. 서버는 `/forwared` 경로에서 요청을 처리 후 응답한다.
4. 브라우저는 서버로부터 응답을 받는다.

위와 같은 과정을 통해 포워딩이 이뤄지다보니 **브라우저 입장에선 URL 경로가 변경되지 않는다.** 브라우저는 자신이 보낸 요청을 서버가 다른 경로로 전달하여 처리하였는지 알 수 없다. 그렇기 때문에 자신이 요청한 `/will-forward` 경로로부터 응답을 받았다고 인지한다. 서버는 처음 요청을 받았을 때 생성한 요청과 응답 객체를 그대로 사용하여 다른 경로에서 브라우저의 요청을 처리한다.

<div align="center">
  <img src="/images/posts/2022/redirect-and-forwarding-02.png" width="100%" class="image__border">
</div>

## CLOSING

포워딩 설명에서 처음 요청을 받았을 때 생성한 요청과 응답 객체를 그대로 사용한다고 설명했지만, 스프링 프레임워크는 요청 객체를 새로운 객체로 감싸서 처리한다.

- 실제 코드를 보면 포워딩 처리를 위해 요청 객체에서 특정 경로를 위한 디스패처(dispatcher)를 꺼낸 후 요청과 응답 객체를 전달한다.
- forward 메서드 내부에선 RequestFacade 객체를 ApplicationHttpRequest 객체로 감싼 후 이를 이용해 포워딩을 처리한다.

```java
    @GetMapping("/will-forward")
    public void willForward(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
        request.getRequestDispatcher("/forwarded").forward(request, response);
    }
```

#### REFERENCE

- <https://junhyunny.github.io/spring-boot/once-per-request-filter/>
- <https://choitaetae.tistory.com/92>

[once-per-request-filter-link]: https://junhyunny.github.io/spring-boot/once-per-request-filter/