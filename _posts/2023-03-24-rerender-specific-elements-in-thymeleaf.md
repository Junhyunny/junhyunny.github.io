---
title: "Re-render Specific Elements in Thymeleaf"
search: false
category:
  - spring-boot
  - thymeleaf
last_modified_at: 2023-03-24T23:55:00
---

<br/>

## 1. Needs

특정 기술의 컨셉을 확인하기 위해 스프링 부트(spring boot), 타임리프(thymeleaf) 프레임워크로 간단한 어플리케이션을 만들어보는 과정에서 다음과 같은 문제를 만났습니다. 

* 타임리프는 SSR(server side rendering) 방식이라 요청에 대한 응답을 페이지로 받는다. 
* 매번 신규 페이지를 받아 처리하다보니 브라우저의 새로고침이나 뒤로가기를 하면 데이터가 꼬인다.

위 문제들을 해결하기 위해 다음과 같은 방식으로 기능을 구현했습니다. 

* SPA(single page application) 방식처럼 페이지는 유지한 채 특정 영역만 다시 렌더링(rendering)
* `jquery`, `axios` 같은 외부 의존성을 추가하지 않고 기능 구현

이번 포스트에선 브라우저가 기본으로 제공하는 웹 API `fetch` 함수를 사용해 페이지의 부분적인 렌더링을 수행하는 방법에 대해 정리하였습니다. 

## 2. Practice

간단한 예시를 만들어 살펴보겠습니다.

## 2.1. packages

```
./
├── HELP.md
├── build.gradle
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
├── settings.gradle
└── src
    ├── main
    │   ├── java
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               ├── ActionInBlogApplication.java
    │   │               ├── controller
    │   │               │   └── FormController.java
    │   │               └── domain
    │   │                   └── User.java
    │   └── resources
    │       ├── application.yml
    │       ├── static
    │       │   └── index.css
    │       └── templates
    │           └── index.html
    └── test
        └── java
            └── action
                └── in
                    └── blog
                        └── ActionInBlogApplicationTests.java
```

## 2.2. build.gradle

다음과 같은 환경에서 실습을 진행합니다.

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

### 2.3. application.yml

타임리프를 위한 설정입니다.

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

### 2.4. index.html

* submit 함수
    * `preventDefault` 함수를 호출하여 폼(form) `submit` 이벤트의 고유 기능인 페이지 이동을 막습니다.
    * 폼 엘리먼트(element)를 폼 데이터 객체로 변경합니다.
    * API 요청을 수행합니다.
    * 비동기 콜백을 통해 응답을 텍스트로 변경합니다.
    * `#user` 영역의 HTML 텍스트를 응답 결과로 대체합니다.

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

### 2.5. FormController Class

* `/user` 경로
    * 요청으로 들어온 정보를 그대로 모델(model) 객체에 담습니다.
    * 응답 경로는 `index.html` 내부에 `#user` 영역만 페이지로 만들어 반환합니다. 

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

##### Result of Practice

* 오른쪽 폼에서 입력한 값들이 왼쪽 창으로 그대로 이동됩니다.

<p align="center">
    <img src="/images/rerender-specific-elements-in-thymeleaf-1.gif" width="100%" class="image__border">
</p>

## CLOSING

REST API 방식처럼 필요한 데이터만 주고 받진 않지만, 사용자에겐 같은 경험을 제공합니다. 
다만 HTML 엘리먼트를 통째로 바꾸기 때문에 XSS(cross site script) 공격에 취약하므로 주의해야합니다. 

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-03-24-rerender-specific-elements-in-thymeleaf>

#### RECOMMEND NEXT POSTS

* [반사형 XSS(Reflected Cross Site Scripting) 공격과 방어][reflected-cross-site-scripting-link]
* [저장형 XSS(Stored Cross Site Scripting) 공격과 방어][stored-cross-site-scripting-link]
* [DOM 기반 XSS(DOM based Cross Site Scripting) 공격과 방어][dom-based-cross-site-scripting-link]
* [dangerouslySetInnerHTML Attribute And XSS Attack][react-xss-attack-link]
* [v-html Directive And XSS Attack][vue-xss-attack-link]

#### REFERENCE

* <https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch>
* <https://developer.mozilla.org/en-US/docs/Web/API/Response/text>
* <https://wangtak.tistory.com/29>
* <https://chaelin1211.github.io/study/2021/04/14/thymeleaf-ajax.html>

[reflected-cross-site-scripting-link]: https://junhyunny.github.io/information/security/spring-mvc/reflected-cross-site-scripting/
[stored-cross-site-scripting-link]: https://junhyunny.github.io/information/security/spring-mvc/stored-cross-site-scripting/
[dom-based-cross-site-scripting-link]: https://junhyunny.github.io/information/security/dom-based-cross-site-scripting/
[react-xss-attack-link]: https://junhyunny.github.io/javascript/react/security/xss-weakness-when-dangerously-set-inner-html-attribute/
[vue-xss-attack-link]: https://junhyunny.github.io/javascript/vue.js/security/xss-weakness-when-using-v-html/