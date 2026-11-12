---
title: "Thymeleaf에서 특정 엘리먼트 재렌더링하기"
publishedAt: "2023-03-24"
updatedAt: "2026-11-12T16:17:28+09:00"
canonicalPath: "/spring-boot/thymeleaf/rerender-specific-elements-in-thymeleaf/"
categories:
  - "spring-boot"
  - "thymeleaf"
summary: "타임리프 SSR 페이지에서 새로고침, 뒤로가기 시 데이터가 꼬이는 문제를 fetch 함수로 받은 HTML로 페이지의 특정 영역만 다시 렌더링해 해결한 방법을 정리했다."
recommendedPosts:
  - title: "반사형 XSS(Reflected Cross Site Scripting) 공격과 방어"
    href: "https://junhyunny.github.io/information/security/spring-mvc/reflected-cross-site-scripting/"
  - title: "저장형 XSS(Stored Cross Site Scripting) 공격과 방어"
    href: "https://junhyunny.github.io/information/security/spring-mvc/stored-cross-site-scripting/"
  - title: "DOM 기반 XSS(DOM based Cross Site Scripting) 공격과 방어"
    href: "https://junhyunny.github.io/information/security/dom-based-cross-site-scripting/"
  - title: "dangerouslySetInnerHTML Attribute And XSS Attack"
    href: "https://junhyunny.github.io/javascript/react/security/xss-weakness-when-dangerously-set-inner-html-attribute/"
  - title: "v-html Directive And XSS Attack"
    href: "https://junhyunny.github.io/javascript/vue.js/security/xss-weakness-when-using-v-html/"
---

## 1. Needs

특정 기술의 콘셉트를 확인하려고 스프링 부트(spring boot), 타임리프(thymeleaf) 프레임워크로 간단한 애플리케이션을 만들어 보다가 다음과 같은 문제를 만났다.

- 타임리프는 SSR(server side rendering) 방식이라 요청에 대한 응답을 페이지로 받는다.
- 매번 신규 페이지를 받아 처리하다 보니 브라우저의 새로고침이나 뒤로가기를 하면 데이터가 꼬인다.

이 문제를 해결하기 위해 다음과 같은 방식으로 기능을 구현했다.

- SPA(single page application) 방식처럼 페이지는 유지한 채 특정 영역만 다시 렌더링(rendering)
- `jquery`, `axios` 같은 외부 의존성을 추가하지 않고 기능 구현

이 글에서는 브라우저가 기본으로 제공하는 웹 API인 `fetch` 함수와 타임리프 프레임워크를 사용해 페이지의 특정 부분만 렌더링하는 방법을 정리했다.

## 2. Practice

예제 프로젝트는 다음과 같은 패키지 구조를 가진다.

```
./
├── HELP.md
├── build.gradle
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
├── settings.gradle
└── src
    ├── main
    │   ├── java
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               ├── ActionInBlogApplication.java
    │   │               ├── controller
    │   │               │   └── FormController.java
    │   │               └── domain
    │   │                   └── User.java
    │   └── resources
    │       ├── application.yml
    │       ├── static
    │       │   └── index.css
    │       └── templates
    │           └── index.html
    └── test
        └── java
            └── action
                └── in
                    └── blog
                        └── ActionInBlogApplicationTests.java
```

`build.gradle` 파일에는 다음과 같은 의존성이 필요하다.

```
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.0.4'
    id 'io.spring.dependency-management' version '1.1.0'
}

group = 'action-in-blog'
version = '0.0.1-SNAPSHOT'
sourceCompatibility = '17'

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-thymeleaf'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

`application.yml` 파일에는 타임리프를 위한 설정을 추가한다.

```yml
spring:
  mvc:
    static-path-pattern: /static/**
  thymeleaf:
    prefix: classpath:templates/
    check-template-location: true
    suffix: .html
    mode: HTML5
    cache: false
```

`index.html` 파일의 `submit` 함수는 다음 순서로 동작한다.

1. `preventDefault` 함수로 폼(form) `submit` 이벤트의 고유 기능인 페이지 이동을 막는다.
2. 폼 엘리먼트(element)를 데이터 객체로 변경한다.
3. API 요청을 수행한다.
4. 비동기 콜백으로 응답을 텍스트로 변경한다.
5. `#user` 영역의 HTML 텍스트를 응답 결과로 대체한다.

```html
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <link rel="stylesheet" type="text/css" href="static/index.css">
    <title>Document</title>

    <script type="text/javascript">
        async function submit(event) {
            event.preventDefault()
            const formElement = document.querySelector("#form");
            const formData = new FormData(formElement);
            const result = await fetch('/user', {
                method: 'POST',
                body: formData,
            }).then(response => response.text())
            document.getElementById('user').outerHTML = result
        }
    </script>

</head>
<body>
<div id="user">
    <div class="row">
        <p>name</p>
        <p th:text="${name}" class="value"/>
    </div>
    <div class="row">
        <p>contact</p>
        <p th:text="${contact}" class="value"/>
    </div>
    <div class="row">
        <p>e-mail</p>
        <p th:text="${email}" class="value"/>
    </div>
</div>
<form id="form">
    <div class="row">
        <p>name</p>
        <input type="text" name="name">
    </div>
    <div class="row">
        <p>contact</p>
        <input type="text" name="contact">
    </div>
    <div class="row">
        <p>e-mail</p>
        <input type="text" name="email">
    </div>
    <button type="submit">submit</button>
</form>

<script type="text/javascript">
    const formElement = document.querySelector("#form");
    formElement.addEventListener('submit', submit)
</script>
</body>
</html>
```

`FormController` 클래스의 `/user` 경로는 요청으로 들어온 정보를 그대로 모델(model) 객체에 담는다. 응답으로는 `index.html` 내부의 `#user` 영역만 페이지로 만들어 반환한다.

```java
package action.in.blog.controller;

import action.in.blog.domain.User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class FormController {

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @PostMapping("/user")
    public String user(@ModelAttribute User user, Model model) {
        model.addAttribute("name", user.getName());
        model.addAttribute("contact", user.getContact());
        model.addAttribute("email", user.getEmail());
        return "index::#user";
    }
}
```

실습해 보면 오른쪽 폼에 입력한 값이 왼쪽 창에 그대로 반영된다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/rerender-specific-elements-in-thymeleaf-01.gif" width="100%" class="image__border">
</div>

## CLOSING

REST API 방식처럼 필요한 데이터만 주고받지는 않지만, 사용자에게는 같은 경험을 제공한다. 다만 HTML 엘리먼트를 통째로 바꾸기 때문에 XSS(cross site script) 공격에 취약하므로 주의해야 한다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-03-24-rerender-specific-elements-in-thymeleaf>

#### REFERENCE

- <https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch>
- <https://developer.mozilla.org/en-US/docs/Web/API/Response/text>
- <https://wangtak.tistory.com/29>
- <https://chaelin1211.github.io/study/2021/04/14/thymeleaf-ajax.html>
