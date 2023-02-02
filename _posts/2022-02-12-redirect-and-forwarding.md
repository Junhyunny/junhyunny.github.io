---
title: "Redirect and Forwarding"
search: false
category:
  - information
last_modified_at: 2022-02-12T23:55:00
---

<br/>

## 0. 들어가면서

[OncePerRequestFilter][once-per-request-filter-link] 포스트를 작성하먼서 리다이렉트(redirect)와 포워딩(forwarding)에 대한 개념을 다시 살펴봤습니다. 
기초적인 내용이고 서버 사이드 렌더링 방식을 사용할 때 많이 접하지만, 이번 기회에 다시 리마인드 할 수 있어서 좋았습니다. 
기왕 찾아본 김에 블로그에 정리하였으며 동작 과정은 톰캣과 스프링을 기준으로 작성하였습니다. 

## 1. 리다이렉트(Redirect)

다음과 같은 과정을 통해 리다이렉트가 이루어집니다. 
1. 브라우저는 서버에게 요청을 보냅니다.
1. 서버는 302 응답 코드와 함께 재요청할 수 있는 주소를 `Location`으로 표시하여 응답합니다.
1. 브라우저는 해당 응답을 확인 후 `Location` 위치로 재요청을 보냅니다.
1. 브라우저는 서버로부터 응답을 받습니다.

위와 같은 과정을 통해 리다이렉트가 이뤄지다보니 **브라우저 입장에선 URL 경로가 바뀌게 됩니다.** 
서버 입장에서는 새로운 요청이 들어온 것이며, 새로운 요청, 응답 객체를 만들어 이를 처리합니다. 

##### 리다이렉트 과정

<p align="center">
    <img src="/images/redirect-and-forwarding-1.JPG" width="100%" class="image__border">
</p>

## 2. 포워딩(Forwarding)

다음과 같은 과정을 통해 포워딩이 이루어집니다.
1. 브라우저는 `/will-forward` 경로로 서버에게 요청을 보냅니다.
1. 서버는 해당 경로의 요청을 처리하는 중에 이를 다른 경로(`/forwared`)에서 이를 처리하도록 전달합니다.
    - 이때, 최초 만들어진 요청, 응답 객체를 그대로 함께 전달합니다.
1. 서버는 `/forwared` 경로에서 요청을 처리 후 응답합니다.
1. 브라우저는 서버로부터 응답을 받습니다.

위와 같은 과정을 통해 포워딩이 이뤄지다보니 **브라우저 입장에선 URL 경로가 변경되지 않습니다.** 
브라우저는 자신이 보낸 요청을 서버가 다른 경로로 전달하여 처리하였는지 알 수 없습니다. 
그렇기 때문에 자신이 요청한 `/will-forward` 경로로부터 응답을 받았다고 인지합니다. 
서버는 처음 요청을 받았을 때 생성한 요청과 응답 객체를 그대로 사용하여 다른 경로에서 브라우저의 요청을 처리합니다.

##### 포워딩 과정

<p align="center">
    <img src="/images/redirect-and-forwarding-2.JPG" width="100%" class="image__border">
</p>

## CLOSING

포워딩 설명에서 처음 요청을 받았을 때 생성한 요청과 응답 객체를 그대로 사용한다고 설명했지만, 프레임워크는 요청 객체를 새로운 객체로 감싸서 처리합니다. 

##### 스프링 포워딩 방법
- 실제 코드를 보면 포워딩 처리를 위해 요청 객체에서 특정 경로를 위한 디스패처(dispatcher)를 꺼낸 후 요청과 응답 객체를 전달합니다.
- `forward` 메소드 내부에선 `RequestFacade` 객체를 `ApplicationHttpRequest` 클래스로 감싼 후 이를 이용해 포워딩을 처리합니다.

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