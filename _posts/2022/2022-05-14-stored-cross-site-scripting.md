---
title: "저장형 XSS(Stored Cross Site Scripting) 공격과 방어"
search: false
category:
  - information
  - security
  - spring-mvc
last_modified_at: 2022-05-14T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [반사형 XSS(Reflected Cross Site Scripting) 공격과 방어][reflected-cross-site-scripting-link]

👉 이어서 읽기를 추천합니다.
- [DOM 기반 XSS(DOM based Cross Site Scripting) 공격과 방어][dom-based-cross-site-scripting-link]

## 0. 들어가면서

지난 포스트에 이어서 저장형 XSS(Stored Cross Site Scripting) 공격과 방어에 대해 알아보겠습니다. 
중복된 내용들은 간단하게 정리하고 본론으로 들어가겠습니다.

##### XSS(Cross Site Scripting) 공격

> [XSS(Cross Site Scripting) 공격][xss-wiki-link]<br/>
> 사이트 간 스크립팅(또는 크로스 사이트 스크립팅, 영문 명칭 cross-site scripting, 영문 약어 XSS)은 
> 웹 애플리케이션에서 많이 나타나는 취약점의 하나로 웹사이트 관리자가 아닌 이가 웹 페이지에 악성 스크립트를 삽입할 수 있는 취약점이다. 
> 주로 여러 사용자가 보게 되는 전자 게시판에 악성 스크립트가 담긴 글을 올리는 형태로 이루어진다. 
> 이 취약점은 웹 애플리케이션이 사용자로부터 입력 받은 값을 제대로 검사하지 않고 사용할 경우 나타난다. 
> 이 취약점으로 해커가 사용자의 정보(쿠키, 세션 등)를 탈취하거나, 자동으로 비정상적인 기능을 수행하게 할 수 있다. 
> 주로 다른 웹사이트와 정보를 교환하는 식으로 작동하므로 사이트 간 스크립팅이라고 한다.

##### XSS 공격 유형

- 반사형 XSS(Reflected XSS)
- 저장형 XSS(Stored or Persistent XSS)
- DOM 기반 XSS(DOM Based XSS)

## 1. 저장형 XSS(Stored Cross Site Scripting)

저장형 XSS 공격은 보안이 취약한 서버에 악의적인 사용자가 악성 스크립트를 저장함으로써 발생합니다. 
비정상적인 방법이 아니라 서버에서 제공하는 게시판, 사용자 프로필에 악의적으로 동작하는 스크립트가 그대로 저장된 후 클라이언트의 브라우저로 전달되어 문제가 발생합니다. 
간단한 시나리오를 바탕으로 예제 코드를 살펴보겠습니다.

### 1.1. 저장형 XSS 공격 시나리오

1. 악의적인 사용자가 보안이 취약한 사이트를 발견했습니다. 
1. 보안이 취약한 사이트에서 제공하는 게시판에 사용자 정보를 빼돌릴 수 있는 스크립트를 작성하여 올립니다.
1. 일반 사용자는 악의적인 사용자가 작성한 게시글을 읽으면, 서버로부터 악성 스크립트가 담긴 게시글 응답을 전달받습니다.
1. 일반 사용자의 브라우저에서 응답 메시지를 실행하면서 악성 스크립트가 실행됩니다.
1. 악성 스크립트를 통해 사용자 정보가 악의적인 사용자에게 전달됩니다.

<p align="center">
    <img src="/images/stored-cross-site-scripting-1.JPG" width="100%" class="image__border">
</p>

### 1.2. 저장형 XSS 공격 취약 서비스의 코드

보안이 취약한 서비스의 코드를 살펴보겠습니다. 
불필요한 코드는 제외하고 문제를 일으키는 코드만 확인해보겠습니다.

#### 1.2.1. Posts JSP

- 화면의 왼쪽은 게시글 목록입니다.
- 화면의 오른쪽은 글을 작성할 수 있는 입력 폼(form)입니다. 
- 왼쪽의 게시글 하나를 선택하면 상세 게시글 화면으로 이동합니다.

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <style>
        <!-- ... styles -->
    </style>
    <script type="text/javascript">
        function postDetail(id) {
            const form = document.createElement("form");
            document.body.appendChild(form)
            form.action = '/post/' + id
            form.method = 'GET'
            form.submit()
        }
    </script>
    <meta charset="UTF-8">
    <title>Stored XSS 공격</title>
</head>

<body>
<h1>Stored XSS 공격</h1>

<div class="container">
    <div class="posts">
        <c:forEach var="post" items="${posts}">
            <div class="posts__item" onclick="postDetail(${post.id})">
                <div>
                    <span>제목</span>
                    <span>${post.title}</span>
                </div>
            </div>
        </c:forEach>
    </div>
    <div class="form">
        <form action="/post" method="POST">
            <div class="form__title">
                <span>제목</span>
                <input type="text" name="title"/>
            </div>
            <div>
                <span>내용</span>
            </div>
            <textarea class="form__text-area" type="text" name="content"></textarea>
            <input class="form__button" type="submit" value="저장"/>
        </form>
    </div>
</div>

</body>
</html>
```

#### 1.2.2. PostDetail JSP

- 작성한 포스트의 내용을 확인할 수 있습니다.

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <style>
        <!-- ... styles -->
    </style>
    <meta charset="UTF-8">
    <title>Stored XSS 공격</title>
</head>

<body>
<h1>Stored XSS 공격</h1>

<div class="post">
    <h3 class="post__title">
        ${post.title}
    </h3>
    <div class="post__content">
        ${post.content}
    </div>
</div>

</body>
</html>
```

#### 1.2.3. PostController 클래스

- `/post` 경로 요청 시 사용자 입력을 검증 없이 그대로 데이터베이스에 저장합니다.
- `/post/{postId}` 경로 요청 시 작성된 게시물 정보를 그대로 화면으로 전달합니다.

```java
@Controller
public class PostController {

    // ...

    @PostMapping(path = "post")
    public String post(Model model, Post post) {
        postRepository.save(post);
        List<Post> posts = postRepository.findAll();
        model.addAttribute("posts", posts);
        return "Posts";
    }

    @GetMapping(path = "/post/{postId}")
    public String post(Model model, @PathVariable long postId) {
        Post post = postRepository.findById(postId).orElseThrow();
        model.addAttribute("post", post);
        return "PostDetail";
    }
}
```

### 1.3. 저장형 XSS 공격 결과

1. 악의적인 사용자는 악성 스크립트가 담긴 게시글을 작성합니다.
1. 일반 사용자는 악의적인 사용자가 작성한 게시글을 보기 위해 클릭합니다.
1. 게시글 조회 시 작성된 악성 스크립트가 실행됩니다.

<p align="center">
    <img src="/images/stored-cross-site-scripting-2.gif" width="100%" class="image__border">
</p>

## 2. 저장형 XSS 방어

저장형 XSS 공격을 방어하는 방법을 정리하였습니다.

### 2.1. 사용자 입력 검증 및 변경

- 사용자가 입력한 값을 그대로 저장하지 않습니다.
- 태그를 만들 때 사용하는 `<`, `>`을 HTML에서 사용하는 특수 문자로 변경합니다.

##### Post 클래스

- `removeTag` 메소드에서 `<`, `>` 문자를 HTML에서 사용하는 특수 문자로 변경합니다.

```java
@Entity
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private long id;

    @Column
    private String title;

    @Column
    private String content;

    public void removeTag() {
        this.title = this.title.replaceAll("<", "&lt;");
        this.title = this.title.replaceAll(">", "&gt;");
        this.content = this.content.replaceAll("<", "&lt;");
        this.content = this.content.replaceAll(">", "&gt;");
    }
}
```

##### PostController 클래스

- 게시글을 저장하기 전에 `removeTag` 메소드를 통해 내용을 정리합니다.

```java
@Controller
public class PostController {

    // ...

    @PostMapping(path = "post")
    public String post(Model model, Post post) {
        post.removeTag();
        postRepository.save(post);
        List<Post> posts = postRepository.findAll();
        model.addAttribute("posts", posts);
        return "Posts";
    }
}
```

##### 적용 결과

<p align="center">
    <img src="/images/stored-cross-site-scripting-3.gif" width="100%" class="image__border">
</p>

### 2.2. 직접 출력 금지

사용자의 입력을 그대로 출력하는 일은 위험하므로 라이브러리의 출력 함수를 사용하는 방법이 있습니다. 
JSP 프레임워크에서 사용하는 JSTL 라이브러리의 출력 태그(`<c:out />`)를 사용하면 문자열을 그대로 출력합니다. 
문자열을 그대로 출력하기 때문에 스크립트가 실행되지 않으므로 XSS 공격을 방어할 수 있습니다.

##### JSTL <c:out /> 태그 사용

```jsp
<div class="post">
    <h3 class="post__title">
        <c:out value="${post.title}"/>
    </h3>
    <div class="post__content">
        <pre><c:out value="${post.content}"/></pre>
    </div>
</div>
```

##### 적용 결과

<p align="center">
    <img src="/images/stored-cross-site-scripting-4.gif" width="100%" class="image__border">
</p>

## CLOSING

사용자의 입력을 검증하지 않고 그대로 사용하는 경우 XSS 공격에 취약한 모습을 보이는 것 같습니다. 
안정적인 서비스 운영을 위해선 사용자 입력을 검증 후 변경하고, 화면 출력도 안정적인 방법으로 수행할 필요가 있어 보입니다. 

이번 포스트에선 간단한 방법으로 사용자의 입력을 변경 후 저장하였습니다. 
필터(filter)나 컨버터(converter)를 사용하면 예시보다 효율적인 방법으로 검증 및 변경 작업이 가능할 것입니다. 
기회가 된다면 간단한 예시 코드를 작성하고 소개하는 포스트를 작성해봐야겠습니다. 
다음 포스트는 DOM 기반 XSS(DOM based XSS) 공격과 방어에 대한 내용을 다뤄보겠습니다. 

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-05-13-stored-cross-site-scripting>

#### REFERENCE
- [XSS(Cross Site Scripting) 공격][xss-wiki-link]
- <https://kevinthegrey.tistory.com/36>
- <https://brownbears.tistory.com/250>
- <https://www.hahwul.com/cullinan/xss/>
- <http://blog.plura.io/?p=7614>
- <https://popo015.tistory.com/104>

[xss-wiki-link]: https://ko.wikipedia.org/wiki/%EC%82%AC%EC%9D%B4%ED%8A%B8_%EA%B0%84_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8C%85

[reflected-cross-site-scripting-link]: https://junhyunny.github.io/information/security/spring-mvc/reflected-cross-site-scripting/
[dom-based-cross-site-scripting-link]: https://junhyunny.github.io/information/security/dom-based-cross-site-scripting/