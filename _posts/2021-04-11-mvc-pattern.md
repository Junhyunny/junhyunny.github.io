---
title: "MVC(Model, View, Controller) Pattern"
search: false
category:
  - information
  - design-pattern
last_modified_at: 2021-08-25T01:00:00
---

<br/>

## 0. 들어가면서

> Wiki<br/>
> 모델-뷰-컨트롤러(model–view–controller, MVC)는 소프트웨어 공학에서 사용되는 소프트웨어 디자인 패턴이다.

어플리케이션을 세 개의 영역으로 분할하고 각 구성 요소에게 고유한 역할을 부여하는 개발 방식입니다. 
MVC 패턴을 도입하면 도메인(비즈니스 로직) 영역과 UI 영역이 분리되므로 서로 영향을 주지 않고 유지보수가 가능합니다. 
MVC 패턴의 구조를 살펴보면서 각 컴포넌트가 무슨 역할을 수행하는지 알아보도록 하겠습니다.

## 1. MVC 패턴 구조
MVC 패턴은 이름에서도 알 수 있듯이 모델(Model), 뷰(View), 컨트롤러(Controller) 세 개의 컴포넌트로 이루어졌습니다. 
각 컴포넌트는 고유한 역할을 수행합니다. 
이미지를 통해 전체적인 구조를 파악하고 컴포넌트 별로 무슨 역할을 수행하는지 정리해보았습니다.  

##### MVC 패턴 다이어그램 및 웹 어플리케이션에서 사용하는 일반적인 MVC 패턴

<div align="center" class="image__border">
    <img src="/images/mvc-pattern-1.JPG" width="30%">
    <img src="/images/mvc-pattern-2.JPG" width="50%">
</div>
<center>모델-뷰-컨트롤러</center>

### 1.1. 모델(Model)

> DATA, 정보들의 가공을 책임지는 컴포넌트를 말합니다.

모델(Model)은 어플리케이션의 정보, 데이터를 나타냅니다. 
데이타베이스, 처음의 정의하는 상수, 초기화 값, 변수 등을 뜻합니다. 
비즈니스 로직을 처리한 후 모델의 변경사항을 컨트롤러와 뷰에 전달합니다. 

모델은 다음과 같은 규칙을 가지고 있습니다.
- 사용자가 편집하길 원하는 모든 데이터를 가지고 있어야 합니다.
- 뷰나 컨트롤러에 대해서 어떤 정보도 알지 말아야 합니다.
- 변경이 일어나면, 변경 통지에 대한 처리 방법을 구현해야만 합니다.

### 1.2. 뷰(View)

> 사용자에게 보여지는 부분, 즉 유저 인터페이스(User interface)를 의미합니다.

MVC 패턴은 여러 개의 뷰(View)가 존재할 수 있으며, 모델에게 질의하여 데이터를 전달받습니다. 
뷰는 받은 데이터를 화면에 표시해주는 역할을 가지고 있습니다. 
모델에게 전달받은 데이터를 별도로 저장하지 않아야 합니다. 
사용자가 화면에 표시된 내용을 변경하게 되면 모델에게 전달하여 모델을 변경해야 합니다. 

뷰는 다음과 같은 규칙을 가지고 있습니다.
- 모델이 가지고 있는 정보를 따로 저장해서는 안됩니다.
- 모델이나 컨트롤러와 같이 다른 구성요소들을 몰라야 됩니다.
- 변경이 일어나면 변경통지에 대한 처리방법을 구현해야만 합니다.

### 1.3. 컨트롤러(Controller)

> 모델(Model)과 뷰(View) 사이를 이어주는 브릿지(Bridge) 역할을 의미합니다.

모델이나 뷰는 서로의 존재를 모르고 있습니다. 변경 사항을 외부로 알리고 수신하는 방법만 있습니다. 
컨트롤러(Controller)는 이를 중재하기 위해 모델과 뷰에 대해 알고 있어야 합니다. 
모델이나 뷰로부터 변경 내용을 통지 받으면 이를 각 구성 요소에게 통지해야 합니다. 
사용자가 어플리케이션을 조작하여 발생하는 변경 이벤트들을 처리하는 역할을 수행합니다.

컨트롤러는 다음과 같은 규칙을 가지고 있습니다.
- 모델이나 뷰에 대해서 알고 있어야 합니다.
- 모델이나 뷰의 변경을 모니터링 해야 합니다.

## 2. MVC 패턴 왜 사용할까?

MVC 패턴에 대한 여러 글을 읽어봤지만, 결국 **`'유지보수의 편리성'`**이라는 하나의 결론으로 수렴합니다. 
최초 설계를 꼼꼼하게 진행한 시스템이라도 유지보수가 발생하기 시작하면 각 기능간의 결합도(coupling)가 높아지는 경우가 발생합니다. 
이는 최초 설계 이념을 정했던 사람들의 부재 혹은 비즈니스 요건 변경으로 인해 필연적으로 발생하는 것 같습니다. 
결합도가 높아진 시스템은 유지보수 작업 시 다른 비즈니스 로직에 영향을 미치게 되므로 사소한 코드의 변경이 의도치 않은 버그를 유발할 수 있습니다. 

선배 개발자들은 이런 문제점을 해결하기 위해 UI 시스템의 핵심 컴포넌트를 모델, 뷰, 컨트롤러로 나누고 
각 컴포넌트가 자신의 수행 결과를 다른 컴포넌트에게 전달하는 프로그래밍 방식을 만들었습니다. 
MVC 패턴을 가진 시스템의 각 컴포넌트는 자신이 맡은 역할만 수행한 후 다른 컴포넌트로 결과만 넘겨주면 되기 때문에 시스템 결합도를 낮출 수 있습니다. 
유지보수 시에도 특정 컴포넌트만 수정하면 되기 때문에 보다 쉽게 시스템 변경이 가능합니다.
(화면의 변경은 only 뷰, 데이터나 비즈니스 요건이 변경은 only 모델, 뷰와 모델 변경에 따른 일부 컨트롤러 변경)

## 3. MVC 패턴의 한계

세상에 완벽이라는 단어는 없습니다. MVC 패턴에도 한계가 존재합니다. 
복잡한 대규모 프로그램의 경우 다수의 뷰와 모델이 컨트롤러를 통해 연결되기 때문에 컨트롤러가 불필요하게 커지는 현상이 발생합니다. 
복잡한 화면을 구성하는 경우에도 동일한 현상이 발생하는데 이를 **`'Massive-View-Controller'`** 라고 합니다. 

##### Massive-View-Controller
<p align="center"><img src="/images/mvc-pattern-3.JPG" width="75%" class="image__border"></p>
<center>https://www.infoq.com/news/2014/05/facebook-mvc-flux/</center>

이런 문제점을 보완하기 위해 다양한 패턴이 파생되었습니다. 
- MVP 패턴
- MVVM 패턴
- Flux
- Redux
- RxMVVM

## 4. MVC 패턴의 적용 사례
MVC 패턴은 Spring 프레임워크와 JSP(Java Servlet Page)를 사용한 웹 어플리케이션 개발에서 가장 즐겨 사용되는 개발 방식입니다. 
Spring Boot 프레임워크는 공식적으로 JSP를 지원하지 않지만, 개발은 가능하므로 이를 이용해 간단한 예제를 구현해보았습니다.   

### 4.1. MVC 패턴 적용 시나리오
1. 브라우저 화면에서 서버로 데이터를 전달합니다.
1. 컨트롤러에서 데이터를 전달받아 서비스에게 데이터를 전달합니다.
1. 서비스는 JpaRepository를 이용하여 전달받은 데이터를 데이터베이스에 INSERT 합니다.
1. INSERT 수행 후 컨트롤러는 서비스를 통해 데이터를 다시 조회합니다.
1. 조회한 데이터를 모델 객체를 통해 뷰에게 전달합니다.
1. 화면에 변경이 발생하는지 확인합니다.

<p align="center"><img src="/images/mvc-pattern-4.JPG" width="75%" class="image__border"></p>

### 4.2. 패키지 구조

```
./
├── mvnw
├── mvnw.cmd
├── pom.xml
└── src
    └── main
        ├── java
        │   └── blog
        │       └── in
        │           └── action
        │               ├── ActionInBlogApplication.java
        │               ├── controller
        │               │   ├── MemberController.java
        │               │   └── MemberDto.java
        │               └── domain
        │                   ├── Member.java
        │                   ├── MemberRepository.java
        │                   └── MemberService.java
        ├── resources
        │   └── application.yml
        └── webapp
            └── WEB-INF
                └── jsp
                    └── index.jsp
```

### 4.3. pom.xml 파일 dependency 추가

- Spring Boot 프레임워크는 JSP를 공식적으로 지원하지 않기 때문에 아래와 같은 의존성들이 필요합니다.
    - jstl - JSP 페이지를 작성할 때 사용할 수 있는 액션과 함수가 포함된 라이브러리
    - jasper - Tomcat의 JSP 엔진, JSP 파일을 구문 분석하여 서블릿 Java 코드로 변환하는 기능 제공

```xml
    <dependencies>
    ...
        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>jstl</artifactId>
        </dependency>

        <dependency>
            <groupId>org.apache.tomcat.embed</groupId>
            <artifactId>tomcat-embed-jasper</artifactId>
        </dependency>
    ...
    </dependencies>
```

### 4.4. application.yml

- .jsp 파일 경로를 알려주기 위해 다음과 같은 설정을 추가합니다.
    - spring.mvc.view.prefix=/WEB-INF/jsp/
    - spring.mvc.view.suffix=.jsp

```yml
server:
  port: 8081
spring:
  mvc:
    view:
      prefix: /WEB-INF/jsp/
      suffix: .jsp
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

### 4.5. index.jsp

- 뷰(View) 역할을 수행하는 `JSP` 파일입니다.
- `/src/main` 폴더 하위에 `/webapp/WEB-INF/jsp` 폴더를 만들고 JSP 파일을 추가합니다.
- 다음과 같은 기능을 수행합니다.
    - 폼(form) 블록으로 컨트롤러에게 추가하고 싶은 사용자 정보를 전달합니다.
    - 컨트롤러에게 전달받은 사용자 정보를 화면에 렌더링합니다.

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <style>
        .form {
            border: #323232 solid 1px;
            margin: auto;
            padding: 10px;
            width: 70vw;
            height: 100%;
        }

        .form__input {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .form__input > div {
            display: flex;
            justify-content: space-between;
        }

        .form__button {
            margin-top: 10px;
            width: 100%;
        }

        .container {
            overflow: auto;
            border: #323232 solid 1px;
            margin: 10px auto;
            padding: 10px;
            width: 70vw;
            height: 300px;
        }

        .container__cards {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .container__card {
            padding: 10px;
            border: #323232 solid 1px;
            border-radius: 4px;
            box-shadow: 0 2px 1px 1px gray;
        }
    </style>
    <meta charset="UTF-8">
    <title>멤버 등록</title>
</head>

<body>
<div class="form">
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

### 4.6. JspController 클래스

- 컨트롤러(Controller) 역할을 수행하는 클래스입니다.
- 다음과 같은 기능을 수행합니다.
    - `/index` 경로 POST 요청 - 전달받은 사용자 정보를 모델 영역으로 전달합니다.
    - `/index` 경로 GET 요청 - 화면에서 렌더링할 사용자들의 정보를 모델 영역으로부터 받아 전달합니다.

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

### 4.7. MemberService 클래스

- 모델(Model) 역할을 수행하는 클래스입니다.
- 다음과 같은 기능을 수행합니다.
    - 모든 사용자들의 정보를 조회합니다.
    - 사용자 정보를 추가, 업데이트합니다.

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

##### 테스트 결과

<p align="left"><img src="/images/mvc-pattern-5.gif" width="60%" class="image__border"></p>

## CLOSING

사용자 인터페이스가 필요한 어플리케이션에서 가장 즐겨 사용되는 디자인 패턴입니다. 
MVC 패턴에 대해 주어 들은 건 있어서 어느 정도 설명은 가능하지만, 
구체적으로 정리해보지 않았기 때문에 포스트로 한번 정리해보았습니다. 
디자인 패턴에 대해 공부하고, 이를 적용하고 싶은 마음은 굴뚝 같지만 쉽지 않습니다. 
책을 읽어봐도 이해가 쉽지 않아 관련된 공부 방법을 찾아 보던 중 
Okky 커뮤니티 멘토이신 fender 님의 글이 굉장히 인상 깊어 제 블로그에 옮겨왔습니다.

> [디자인패턴과 알고리즘][okky-link]<br/>
> 일단 그런 질문을 하는 개발자들의 수준을 대략적으로 일반화해보면 
> 아마도 사용해본 프레임워크의 예제를 조금씩 변형해서 비슷한 프로그램을 찍어낼 수 있는 능력을 갖추었을 것입니다. 
> 하지만 그런 프레임워크가 어떻게 동작하고 왜 그런 모양으로 생겼는지는 이해하지 못할 것이고, 
> 당연히 비슷한 프레임워크 같은 것을 만들 수 있는 능력은 없을 것입니다.<br/>
> ...(중략)<br/>
> 그리고 객체지향 언어로 좋은 API를 설계하려면, 
> 또한 그 이전에 그렇게 설계된 스프링 프레임워크 등의 API를 이해하려면 결국 디자인 패턴을 공부해야 합니다.

조금은 공부 방법에 힌트가 되는 글이었습니다. 
아직 경험이 적은 개발자이기 때문에 프레임워크에 적용된 좋은 사례를 찾아보고 
왜 적용되었는지, 해당 디자인 패턴을 적용하여 얻을 수 있는 이점은 무엇인지에 대해 고민해보고 정리하는 식의 공부를 진행해보려 합니다.

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
