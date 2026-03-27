---
title: "MVC(Model, View, Controller) 패턴"
search: false
category:
  - information
  - design-pattern
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

## 1. Structure of MVC Pattern

애플리케이션을 세 개의 영역으로 분할하고 각 구성 요소에게 고유한 역할을 부여하는 개발 방식이다. MVC 패턴을 도입하면 도메인(비즈니스 로직) 영역과 UI 영역이 분리되므로 서로 영향을 주지 않고 유지보수가 가능하다. MVC 패턴의 구조를 살펴보면서 각 컴포넌트가 무슨 역할을 수행하는지 알아보자. MVC 패턴은 이름에서도 알 수 있듯이 모델(Model), 뷰(View), 컨트롤러(Controller) 세 개의 컴포넌트로 이루어졌다. 각 컴포넌트는 고유한 역할을 수행한다. 아래 이미지는 MVC 패턴 다이어그램 및 웹 애플리케이션에서 사용하는 일반적인 MVC 패턴이다.

<div align="center" class="image__border">
    <img src="{{ site.image_url_2021 }}/mvc-pattern-01.png" width="30%">
    <img src="{{ site.image_url_2021 }}/mvc-pattern-02.png" width="50%">
</div>
<center>모델-뷰-컨트롤러</center>

### 1.1. Model

> 데이터(data) 가공을 책임지는 컴포넌트(component)이다.

모델은 애플리케이션의 정보, 데이터를 나타낸다. 데이터베이스, 초기화된 상수나 값, 변수 등을 뜻한다. 비즈니스 로직을 처리한 후 모델의 변경 사항을 컨트롤러와 뷰에 전달한다.

모델은 다음과 같은 규칙을 가지고 있다.

- 사용자가 편집하길 원하는 모든 데이터를 가지고 있어야 한다.
- 뷰나 컨트롤러에 대해서 어떤 정보도 알지 말아야 한다.
- 변경이 일어나면, 변경 통지에 대한 처리 방법을 구현해야만 한다.

### 1.2. View

> 사용자에게 보여지는 부분, 즉 유저 인터페이스(User interface)를 의미한다.

MVC 패턴은 여러 개의 뷰가 존재할 수 있으며, 모델에게 질의하여 데이터를 전달받는다. 뷰는 받은 데이터를 화면에 표시해주는 역할을 가지고 있다. 모델에게 전달받은 데이터를 별도로 저장하지 않아야 한다. 사용자가 화면에 표시된 내용을 변경하게 되면 모델에게 전달하여 모델을 변경해야 한다.

뷰는 다음과 같은 규칙을 가지고 있다.

- 모델이 가지고 있는 정보를 따로 저장해서는 안 된다.
- 모델이나 컨트롤러와 같이 다른 구성 요소들을 몰라야 한다.
- 변경이 일어나면 변경 통지에 대한 처리 방법을 구현해야만 한다.

### 1.3. Controller

> 모델과 뷰 사이를 이어주는 브릿지(bridge) 역할을 의미한다.

모델이나 뷰는 서로의 존재를 모르고 있다. 변경 사항을 외부로 알리고 수신하는 방법만 있다. 컨트롤러는 이를 중재하기 위한 컴포넌트이다. 모델과 뷰에 대해 알고 있으며 모델이나 뷰로부터 변경 내용을 통지 받으면 이를 각 구성 요소에게 통지한다. 사용자가 애플리케이션을 조작하여 발생하는 변경 이벤트들을 처리하는 역할을 수행한다.

컨트롤러는 다음과 같은 규칙을 가지고 있다.

- 모델이나 뷰에 대해서 알고 있어야 한다.
- 모델이나 뷰의 변경을 모니터링해야 한다.

## 2. Why do we use MVC pattern?

> 유지보수의 편리성

최초 설계를 꼼꼼하게 진행한 시스템이라도 유지 보수가 발생하기 시작하면 각 기능 간의 결합도(coupling)가 높아진다. 이는 최초 설계 이념을 정했던 사람들의 부재 혹은 비즈니스 요건 변경으로 인해 필연적으로 발생하는 것 같다. 결합도가 높아진 시스템은 유지보수 작업 시 다른 비즈니스 로직에 영향을 미치게 되므로 사소한 코드의 변경이 의도치 않은 버그를 유발할 수 있다.

디자인 패턴이란 개발하는 과정에서 마주치는 문제들을 해결하기 위한 방법들이다. 선배 개발자들은 이런 문제점을 해결하기 위해 UI 시스템을 위한 책임을 기준으로 3개의 핵심 컴포넌트 모델, 뷰, 컨트롤러라는 책임을 나누었다. 각 컴포넌트가 자신의 수행 결과를 다른 컴포넌트에게 전달하는 프로그래밍 방식으로 결합도를 낮췄다. 시스템 유지보수 시에도 특정 컴포넌트만 수정하면 되기 때문에 보다 쉬운 시스템 변경이 가능하다.

- 화면의 변경은 뷰를 수정하여 반영한다.
- 데이터나 비즈니스 요건의 변경은 모델을 수정하여 반영한다.
- 뷰와 모델 변경에 따른 컨트롤러를 수정한다.

## 3. Limitations of MVC Pattern

세상에 완벽이라는 단어는 없다. MVC 패턴에도 한계가 존재한다. 복잡한 대규모 프로그램의 경우 다수의 뷰와 모델이 컨트롤러를 통해 연결되기 때문에 컨트롤러가 불필요하게 커지는 현상이 발생한다. 복잡한 화면을 구성하는 경우에도 동일한 현상이 발생하는데 이를 **`'Massive-View-Controller'`** 라고 한다.

<div align="center">
    <img src="{{ site.image_url_2021 }}/mvc-pattern-03.png" width="80%" class="image__border">
</div>
<center>https://www.infoq.com/news/2014/05/facebook-mvc-flux/</center>

<br/>

이런 문제점을 보완하기 위해 다양한 패턴이 파생되었다.

- MVP 패턴
- MVVM 패턴
- Flux
- Redux
- RxMVVM

## 4. Example of MVC Pattern

서버 사이드 렌더링으로 많이 사용되는 JSP, Thymeleaf 기술 스택을 통해 MVC 패턴을 적용할 수 있다. 스프링 부트(spring boot) 프레임워크는 공식적으로 JSP를 지원하지 않지만, 개발은 가능하므로 간단한 예제를 만들어 보았다.

1. 브라우저 화면에서 서버로 데이터를 전달한다.
2. 컨트롤러에서 데이터를 전달받아 서비스에게 데이터를 전달한다.
3. 서비스는 레포지토리(repository)를 이용하여 전달받은 데이터를 데이터베이스에 저장한다.
4. 저장 후 컨트롤러는 서비스를 통해 데이터를 다시 조회한다.
5. 조회한 데이터를 모델 객체를 통해 뷰에게 전달한다.
6. 화면에 변경이 발생하는지 확인한다.

<div align="center">
    <img src="{{ site.image_url_2021 }}/mvc-pattern-04.png" width="80%" class="image__border">
</div>

<br/>

다음과 같은 패키지 구조를 갖는다.

```
./
├── mvnw
├── mvnw.cmd
├── pom.xml
└── src
    └── main
        ├── java
        │   └── blog
        │       └── in
        │           └── action
        │               ├── ActionInBlogApplication.java
        │               ├── controller
        │               │   ├── MemberController.java
        │               │   └── MemberDto.java
        │               └── domain
        │                   ├── Member.java
        │                   ├── MemberRepository.java
        │                   └── MemberService.java
        ├── resources
        │   └── application.yml
        └── webapp
            └── WEB-INF
                └── jsp
                    └── index.jsp
```

스프링 부트 프레임워크는 JSP를 공식적으로 지원하지 않는다. pom.xml 파일에 다음과 같은 추가 의존성들이 필요하다.

- jstl
  - JSP 페이지를 작성할 때 사용할 수 있는 액션과 함수가 포함된 라이브러리
- jasper
  - Tomcat의 JSP 엔진, JSP 파일을 구문 분석하여 서블릿 Java 코드로 변환하는 기능 제공

```xml
    <dependencies>
        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>jstl</artifactId>
        </dependency>
        <dependency>
            <groupId>org.apache.tomcat.embed</groupId>
            <artifactId>tomcat-embed-jasper</artifactId>
        </dependency>
    </dependencies>
```

application YAML 파일에 JSP 파일 경로를 설정한다.

```yml
server:
  port: 8081
spring:
  mvc:
    view:
      prefix: /WEB-INF/jsp/ # this
      suffix: .jsp # this
  datasource:
    driver-class-name: org.h2.Driver
    url: jdbc:h2:~/test
    username: sa
    password:
  jpa:
    show-sql: true
    hibernate:
      ddl-auto: create-drop
  h2:
    console:
      path: /h2-console
      enabled: true
```

index.jsp 파일은 뷰 역할을 수행하는 JSP 코드이다. 위 설정에 맞춰 `/src/main` 폴더 하위에 `/webapp/WEB-INF/jsp` 폴더를 만들고 JSP 파일을 추가한다. 다음과 같은 기능을 수행한다.

1. 폼(form) 블록으로 컨트롤러에게 추가하고 싶은 사용자 정보를 전달한다.
2. 컨트롤러에게 전달받은 사용자 정보를 화면에 렌더링한다.

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <style>
        ...
    </style>
    <meta charset="UTF-8">
    <title>멤버 등록</title>
</head>

<body>
<div class="form">
  <!-- [1] -->
    <form action="/index" method="post"> 
        <div class="form__input">
            <div>
                <span>ID: </span>
                <input type="text" name="id"/>
            </div>
            <div>
                <span>비밀번호: </span>
                <input type="password" name="password"/>
            </div>
            <div>
                <span>이름: </span>
                <input type="text" name="memberName"/>
            </div>
            <div>
                <span>E-MAIL:</span>
                <input type="text" name="memberEmail"/>
            </div>
        </div>
        <input class="form__button" type="submit" value="전송"/>
    </form>
</div>

<!-- [2] -->
<div class="container">
    <div class="container__cards">
        <c:forEach items="${memberList}" var="member">
            <div class="container__card">
                <div>
                    <span>ID</span>
                    <span>${member.getId()}</span>
                </div>
                <div>
                    <span>이름</span>
                    <span>${member.getMemberName()}</span>
                </div>
                <div>
                    <span>E-MAIL</span>
                    <span>${member.getMemberEmail()}</span>
                </div>
            </div>
        </c:forEach>
    </div>
</div>
</body>
</html>
```

외부로부터 요청을 받는 JspController 객체를 정의하자. 컨트롤러 역할을 수행하는 클래스이다. 다음과 같은 기능을 수행한다.

- `/index` 경로 POST 요청
  - 전달받은 사용자 정보를 모델 영역으로 전달한다.
- `/index` 경로 GET 요청
  - 화면에서 렌더링할 사용자들의 정보를 모델 영역으로부터 받아 전달한다.

```java
package blog.in.action.controller;

import java.util.List;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;

import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

import blog.in.action.domain.Member;
import blog.in.action.domain.MemberService;

@Controller
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    private List<MemberDto> getAllMembers() {
        List<Member> memberList = memberService.findAll();
        return memberList
                .stream()
                .map(member -> MemberDto.builder()
                        .id(member.getId())
                        .memberName(member.getMemberName())
                        .memberEmail(member.getMemberEmail())
                        .build()
                )
                .collect(Collectors.toList());
    }

    @GetMapping("/index")
    public String index(Model model) {
        model.addAttribute("memberList", getAllMembers());
        return "index";
    }

    @PostMapping(path = "/index")
    public String register(HttpServletRequest servletRequest, Model model) {
        Member member = new Member();
        member.setId(servletRequest.getParameter("id"));
        member.setPassword(servletRequest.getParameter("password"));
        member.setMemberName(servletRequest.getParameter("memberName"));
        member.setMemberEmail(servletRequest.getParameter("memberEmail"));
        memberService.registerMember(member);
        model.addAttribute("memberList", getAllMembers());
        return "index";
    }
}
```

MemberService 클래스는 모델 역할을 수행하는 클래스이다. 다음과 같은 기능을 수행한다.

- 모든 사용자들의 정보를 조회한다.
- 사용자 정보를 추가, 업데이트한다.

```java
package blog.in.action.domain;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MemberService {

    private final MemberRepository memberRepository;

    public MemberService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @Transactional
    public Member registerMember(Member member) {
        return memberRepository.save(member);
    }

    public List<Member> findAll() {
        return memberRepository.findAll();
    }
}
```

위 애플리케이션을 실행하면 다음과 같이 동작하는 화면을 볼 수 있다.

<div align="left">
    <img src="{{ site.image_url_2021 }}/mvc-pattern-05.gif" width="60%" class="image__border">
</div>

## CLOSING

사용자 인터페이스가 필요한 애플리케이션에서 가장 즐겨 사용되는 디자인 패턴이다. MVC 패턴에 대해 주워들은 건 있어서 어느 정도 설명은 가능하지만, 구체적으로 정리해보지 않았기 때문에 포스트로 한번 정리해보았다. 디자인 패턴에 대해 공부하는 것은 어렵다. 책으로만 읽어본다고 쉽게 이해되지 않는다. 프레임워크나 라이브러리를 다루다 보면 알게 모르게 디자인 패턴을 마주치게 된다. 이를 응용하다 보면 자신도 모르게 디자인 패턴을 사용하기도 한다. 다만 이를 의식적으로 연습하고, 의도해야지 실력이 향상된다는 점을 최근 느끼고 있다.

- 지금 사용하는 기능은 어떤 점을 고려한 구조인지?
- 내가 마주친 문제를 해결하기 위해 고안해낸 구조가 어떤 패턴과 유사한지?

이런 식으로 디자인 패턴을 사용 혹은 응용하는 것이 의도적이어야지 개발에 관련된 인사이트(insight)가 생기는 것 같다. 이와 관련해서 OKKY 커뮤니티의 `fender` 님의 글이 굉장히 인상 깊었다.

> [디자인패턴과 알고리즘][okky-link]<br/>
> 일단 그런 질문을 하는 개발자들의 수준을 대략적으로 일반화해보면 아마도 사용해본 프레임워크의 예제를 조금씩 변형해서 비슷한 프로그램을 찍어낼 수 있는 능력을 갖추었을 것입니다. 하지만 그런 프레임워크가 어떻게 동작하고 왜 그런 모양으로 생겼는지는 이해하지 못할 것이고, 당연히 비슷한 프레임워크 같은 것을 만들 수 있는 능력은 없을 것입니다.<br/>
> ...(중략)<br/>
> 그리고 객체지향 언어로 좋은 API를 설계하려면, 또한 그 이전에 그렇게 설계된 스프링 프레임워크 등의 API를 이해하려면 결국 디자인 패턴을 공부해야 합니다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-04-11-mvc-pattern>

#### REFERENCE

- [모델-뷰-컨트롤러][wiki-link]
- [[아키텍처 패턴] MVC 패턴이란?][mvc-pattern-link]
- <https://luckygg.tistory.com/182>
- <https://m.blog.naver.com/jhc9639/220967034588>
- <https://okky.kr/article/380619>
- <https://okky.kr/article/453210>

[wiki-link]: https://ko.wikipedia.org/wiki/%EB%AA%A8%EB%8D%B8-%EB%B7%B0-%EC%BB%A8%ED%8A%B8%EB%A1%A4%EB%9F%AC
[okky-link]: https://okky.kr/article/380619
[mvc-pattern-link]: https://medium.com/@jang.wangsu/%EB%94%94%EC%9E%90%EC%9D%B8%ED%8C%A8%ED%84%B4-mvc-%ED%8C%A8%ED%84%B4%EC%9D%B4%EB%9E%80-1d74fac6e256
