---
title: "OSIV(Open Session In View)"
search: false
category:
  - spring-mvc
  - jpa
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS
- [영속성 컨텍스트(persistent context)와 엔티티(entity) 생명주기][jpa-persistence-context-link]
- [EntityManager 특징과 영속성 컨텍스트 장점][persistence-context-advantages-link]
- [JPA 플러쉬(flush)][jpa-flush-link]
- [@Transactional 애너테이션의 전파 타입(Propagation)][transactional-propagation-type-link]
- [Filter, Interceptor and AOP in Spring][filter-interceptor-and-aop-link]

## 1. OSIV 패턴을 위한 사전 개념

OSIV 패턴을 이해하려면 하이버네이트(hibernate) 매커니즘을 이해할 필요가 있다. 저에겐 익숙한 `JPA`의 구현체가 하이버네이트이다 보니 비슷한 부분이 많이 있었지만, 참고한 자료의 내용을 바탕으로 정리하였다.

### 1.1. 영속성 컨텍스트(Persistence Context)

> 엔티티(entity)를 영구히 저장하는 환경

영속성 컨텍스트는 서버 애플리케이션과 데이터베이스 사이에서 엔티티를 저장하는 논리적인 영역이다. 엔티티 클래스는 ORM(object relation mapping) 프레임워크에서 데이터베이스 테이블과 매칭된다. 엔티티 객체는 각 테이블에 저장되는 데이터로 매칭된다. 영속성 컨텍스트는 엔티티 객체를 데이터로써 데이터베이스에 저장하기 전에 이들을 관리하는 환경을 의미한다.

### 1.2. 하이버네이트 엔티티 생명주기(Entity Lifecycle)

엔티티 생명주기에 관련된 상태는 4가지가 존재한다. 각 상태에 대해서 알아보겠다.

- 비영속(Transient)
  - 생성자를 사용해 생성한 객체는 바로 영속화되지 않는다.
  - 영속성 매니저를 통해 엔티티를 영속화시키지 않으면 새로 생성한 객체일 뿐이다.
- 영속(Persistent)
  - 영속성 매니저를 통해 엔티티 객체를 영속화시킨 상태이다.
  - 영속성 매니저는 영속 상태의 엔티티를 관리하고, 변화를 감지한다.
  - 영속성 매니저를 통해 새롭게 등록된 엔티티, 데이터베이스에서 조회한 엔티티는 영속 상태이다.
- 삭제(Removed)
  - 삭제 대상 엔티티 객체의 상태이다.
  - 하이버네이트의 작업 단위(unit of work)가 완료되면 데이터베이스에서 삭제된다.
  - 작업 단위가 완료되기 전까지는 영속성 컨텍스트에서 관리된다.
- 준영속(Detached)
  - 하이버네이트가 작업 단위를 마치면, 해당 작업 단위의 영속성 컨텍스트를 데이터베이스와 동기화한다.
  - 작업 단위를 완료하면 영속성 컨텍스트가 닫히는데, 애플리케이션은 여전히 사용 중이던 엔티티 객체들을 참조하고 있다.
  - 영속성 컨텍스트가 닫혔기 때문에 데이터베이스와 동기화를 보장하진 않지만, 애플리케이션의 메모리에 여전히 존재하는 상태를 의미한다.

<div align="center">
  <img src="{{ site.image_url_2022 }}/open-session-in-view-01.png" width="65%" class="image__border">
</div>
<center>Java Persistence with Hibernate</center>

### 1.3. 하이버네이트 세션(Hibernate Session)과 작업 단위(Unit of Work)

하이버네이트 세션(session)은 엔티티를 관리하는 객체를 의미한다. `JPA`의 `EntityManager`과 동일한 역할을 하는 것으로 보인다. 세션은 하나의 영속성 컨텍스트를 가지고 있으며, 세션을 만들 때 영속성 컨텍스트도 함께 생성된다.

하이버네이트의 작업 단위(unit of work)는 원자적으로 처리되어야 하는 상태 변경 작업들의 집합을 의미한다. 일반적으로 하나의 작업 단위는 하나의 영속성 컨텍스트와 연결된다. 하이버네이트 세션은 하나의 작업 단위에서 발생하는 엔티티 객체의 생성, 조회, 수정, 삭제 등을 영속성 컨텍스트에 저장하고 있다. 작업 단위가 종료되면 이를 데이터베이스에 반영시킨다.

### 1.4. 플러시(Flush)와 지연 쓰기(Transactional Write-behind)

플러시(Flush)는 영속성 컨텍스트에 존재하는 엔티티들의 변경 내용을 데이터베이스에 동기화하는 작업이다. 하이버네이트는 기본적으로 다음과 같은 경우에 세션 객체를 플러시시킨다.

- 하이버네이트 트랜잭션이 커밋(commit)되는 경우
- 쿼리를 실행하기 전 영속성 컨텍스트의 상태가 쿼리 결과에 영향을 미친다고 판단되는 경우
- `session.flush()` 함수를 명시적으로 호출하는 경우

하이버네이트는 다음과 같은 플러시 모드를 제공한다.

- FlushMode.AUTO
  - 위에서 설명한 3가지 경우에 영속성 컨텍스트를 플러시한다.
- FlushMode.ALWAYS
  - 모든 쿼리를 실행하기 전에 영속성 컨텍스트를 플러시한다.
- FlushMode.COMMIT
  - 쿼리 실행 전에는 플러시하지 않는다.
  - 트랜잭션이 커밋되거나 직접 `session.flush()` 함수를 호출하는 경우에 플러시를 수행한다.
- FlushMode.MANUAL
  - 명시적으로 `flush()` 함수를 호출할 때만 영속성 컨텍스트를 플러시한다.
  - 쿼리 실행 전과 하이버네이트 트랜잭션이 커밋되더라도 영속성 컨텍스트는 플러시되지 않는다.

하이버네이트는 영속성 컨텍스트에서 관리하는 엔티티들의 변화가 있을 때마다 매번 플러시를 수행하지 않는다. 커밋하기 직전까지 추가(insert), 수정(update), 삭제(delete) 쿼리를 수행하지 않는다. 수행할 쿼리들을 커밋하는 시점까지 모아서 데이터베이스에 한번에 전달하는데, 이를 `지연 쓰기(Transactional Write-behind)`라고 한다. 쓰기 연산을 지연하면 데이터베이스로 쿼리를 전송하는 횟수를 줄여 성능을 향상시킬 수 있다. 또한 트랜잭션에 의해 데이터베이스에 락이 걸리는 시간을 최소화할 수 있다.

### 1.5. 지연 로딩(Lazy Loading)

엔티티 사이에 관계를 맺어 사용하면, 데이터 조회 시 fetch 방법에 대해 고려해야 한다. fetch 방법은 두 가지 존재한다.

##### EAGER Fetch

- 어떤 엔티티를 조회할 때 관계를 맺고 있는 엔티티도 함께 조회한다.
- 기본적으로 `@ManyToOne` 엔티티의 fetch 방법은 `EAGER`이다.
- `Member` 엔티티를 조회하면, 연관되는 `Team` 엔티티를 함께 조회한다.

```java
package blog.in.action.domain;

import lombok.*;

import javax.persistence.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "TB_MEMBER")
public class Member {

    public Member(String id) {
        this.id = id;
    }

    @Id
    private String id;

    @Column
    private String memberName;

    @Column
    private String memberEmail;

    @ManyToOne
    private Team team;

}
```

##### LAZY Fetch

- 어떤 엔티티를 조회할 때 해당되는 엔티티만 조회하고, 관계를 맺은 엔티티는 사용하는 시점에 조회한다.
- 기본적으로 `@OneToMany` 엔티티의 fetch 방법은 `LAZY`이다.
- 예를 들어 보겠다.
  - `Team` 엔티티를 조회하면, 연관되는 `Member` 엔티티들은 함께 조회하지 않는다.
  - 로직 중간에 `team` 엔티티의 `members` 필드에 접근을 시도하면 그 시점에 `SELECT` 쿼리를 이용해 데이터를 조회한다.

```java
package blog.in.action.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "TB_TEAM")
public class Team {

    public Team(long id) {
        this.id = id;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column
    private String teamName;

    @OneToMany(targetEntity = Member.class, mappedBy = "team")
    private List<Member> members = new ArrayList<>();
}
```

## 2. LazyInitializationException: could not initialize proxy - no Session

LazyInitializationException 예외는 다음과 같은 조건이 충족되면 발생한다.

- OSIV 패턴 미적용
- 트랜잭션 영역 밖에서 엔티티 지연 로딩(lazy loading) 수행

스프링 프레임워크에선 `@Transactional` 애너테이션으로 트랜잭션 범위를 지정할 수 있다. 실행 스레드가 `@Transactional` 애너테이션이 붙은 메서드를 호출하면 다음과 같은 일들이 일어난다.

- Session 객체가 없다면 생성하고, 있다면 이를 그대로 사용한다.
- 트랜잭션 시작을 지정하면서 동시에 데이터베이스 접근을 위한 JDBC 커넥션(connection)을 획득한다.

팀 정보를 등록하는 기능을 제공하는 예제 코드로 간단하게 에러 발생을 살펴보겠다.

### 2.1. application.yml

- 스프링 프레임워크에서 `OSIV` 패턴 적용 여부에 대한 기본 값은 `true`이다.
- `spring.jpa.open-in-view` 값을 `false`으로 지정하여 `OSIV` 패턴 적용을 하지 않겠다.

```yml
server:
  port: 8080
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
    open-in-view: false
  h2:
    console:
      path: /h2-console
      enabled: true
```

### 2.2. TeamController 클래스

- `/team` 경로로 `POST` 요청에서 다음과 같은 작업이 이뤄진다.
  - 신규 `Team` 정보를 생성한다.
  - 모든 팀들의 정보를 조회하여 모델에 담는다.
  - JSP 파일명인 `"Team"` 문자열을 반환한다.

```java
package blog.in.action.controller;

import blog.in.action.domain.Member;
import blog.in.action.domain.MemberService;
import blog.in.action.domain.Team;
import blog.in.action.domain.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@Controller
@RequestMapping("/team")
public class TeamController {

    private final TeamService teamService;
    private final MemberService memberService;

    @GetMapping
    public String team(Model model) {
        model.addAttribute("teamList", teamService.findAll());
        return "Team";
    }

    @PostMapping
    public String registerTeam(Model model, @ModelAttribute TeamDto teamDto) {
        Team team = new Team();
        team.setTeamName(teamDto.getTeamName());
        teamService.registerTeam(team);
        model.addAttribute("teamList", teamService.findAll());
        return "Team";
    }

    @GetMapping("/detail/{id}")
    public String teamDetail(Model model, @PathVariable long id) {
        Team team = teamService.findById(id);
        model.addAttribute("team", team);
        return "TeamDetail";
    }

    @PostMapping("/detail/{id}")
    public String registerTeamMembers(Model model, @ModelAttribute MemberDto memberDto, @PathVariable long id) {
        Member member = memberDto.toEntity();
        member.setTeam(new Team(id));
        memberService.registerMember(member);
        Team team = teamService.findById(id);
        model.addAttribute("team", team);
        return "TeamDetail";
    }
}
```

### 2.3. TeamService 클래스

- `registerTeam` 메서드를 통해 사용자 정보를 등록한다.
- `@Transactional` 애너테이션으로 트랜잭션 범위를 지정한다.

```java
package blog.in.action.domain;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TeamService {

    private final TeamRepository teamRepository;

    public TeamService(TeamRepository teamRepository) {
        this.teamRepository = teamRepository;
    }

    @Transactional
    public Team registerTeam(Team team) {
        return teamRepository.save(team);
    }

    public Team findById(long id) {
        return teamRepository.findById(id).orElseThrow();
    }

    public List<Team> findAll() {
        return teamRepository.findAll();
    }
}
```

### 2.4. Team.jsp

- 팀에 속한 멤버들의 수를 보여준다.
  - `${team.members.size()}`를 호출하면 지연 로딩이 실행된다.

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
        function moveTeamDetail(id) {
            const element = document.createElement('a')
            element.href = "http://localhost:8080/team/detail/" + id
            element.click()
        }
    </script>
    <meta charset="UTF-8">
    <title>팀 등록</title>
</head>

<body>
<div class="form">
    <form action="/team" method="post">
        <div class="form__input">
            <div>
                <span>팀 이름</span>
                <input type="text" name="teamName"/>
            </div>
        </div>
        <input class="form__button" type="submit" value="전송"/>
    </form>
</div>
`
<div class="container">
    <div class="container__cards">
        <c:forEach items="${teamList}" var="team">
            <div class="container__card" onclick="moveTeamDetail(${team.id})">
                <div>
                    <span>팀 이름</span>
                    <span>${team.teamName}</span>
                </div>
                <div>
                    <span>팀 멤버 수</span>
                    <span>${team.members.size()}</span>
                </div>
            </div>
        </c:forEach>
    </div>
</div>
</body>
</html>
```

##### LazyInitializationException 발생

<div align="left">
  <img src="{{ site.image_url_2022 }}/open-session-in-view-02.gif" width="65%" class="image__border">
</div>

### 2.5. 발생 원인 찾아보기

OSIV 패턴을 적용하지 않았기 때문에 `@Transactional` 애너테이션을 이용하여 세션을 열고, 트랜잭션을 시작한다. `registerTeam` 메서드를 호출하면 세션을 열고, 트랜잭션을 시작한다. `registerTeam` 메서드가 종료될 때 트랜잭션을 커밋하고, 세션을 닫는다.

세션이 닫히면 영속성 컨텍스트가 함께 정리되면서 엔티티들은 준영속(Detached) 상태가 된다. JSP 파일을 렌더링하면서 `team` 엔티티의 `members` 필드에 접근할 때 지연 로딩을 시도하지만, `team` 엔티티는 이미 준영속 상태가 되었기 때문에 지연 로딩을 수행할 수 없다는 에러가 발생한 것이다.

##### 실행 흐름과 세션, 트랜잭션 범위

- `JpaRepository` 빈(bean)은 기본적으로 `@Transactional` 애너테이션이 붙어있다.
- `@Transactional` 애너테이션의 기본 전파 타입인 `REQUIRED` 정책에 의해 이전에 시작한 트랜잭션이 이어진다.
- `registerTeam` 메서드 호출 시 흐름을 기준으로 이미지를 표현하였다.

<div align="center">
  <img src="{{ site.image_url_2022 }}/open-session-in-view-03.png" width="100%" class="image__border">
</div>

## 3. Open Session In View Pattern

뷰를 렌더링하는 시점에 영속성 컨텍스트가 존재하지 않아 준영속 상태가 된 객체의 프록시를 초기화할 수 없는 문제를 해결하기 위해 만든 패턴이다. 초기의 OSIV 패턴을 살펴보고, 스프링 프레임워크의 OSIV 패턴에 대해서 정리해보겠다.

### 2.1. Traditional OSIV Pattern

전통적인 OSIV 패턴은 필터에서 세션과 트랜잭션을 시작하고 종료하는 방법을 사용하였다고 한다.

#### 2.1.1. HibernateSessionRequestFilter 클래스

- 필터에서 데이터베이스 트랜잭션을 시작한다.
- 다음 필터를 호출한다.
- 모든 처리가 완료되면 트랜잭션을 커밋한다.
- 예외가 발생했다면 롤백을 수행한다.

```java
public class HibernateSessionRequestFilter implements Filter {

    private SessionFactory sessionFactory;

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        try {
            // 데이터베이스 트랜잭션 시작
            sessionFactory.getCurrentSession().beginTransaction();
            // 다음 필터 호출(요청 처리 계속 진행)
            chain.doFilter(request, response);
            // 데이터베이스 트랜잭션 커밋
            sessionFactory.getCurrentSession().getTransaction().commit();
        } catch (Throwable ex) {
            // 무조건 롤백
            try {
                if (sessionFactory.getCurrentSession().getTransaction().isActive()) {
                    sessionFactory.getCurrentSession().getTransaction().rollback();
                }
            } catch (Throwable rbEx) {
                rbEx.printStackTrace();
            }
            // 다른 처리를 한다.
            throw new ServletException(ex);
        }
    }

    public void init(FilterConfig filterConfig) throws ServletException {
        sessionFactory = HibernateUtil.getSessionFactory();
    }

    public void destroy() {
    }
}
```

#### 2.1.2. 전통적인 OSIV 패턴의 문제점

전통적인 OSIV 패턴은 서블릿 필터에서 세션을 열고, 트랜잭션을 시작한다. 트랜잭션을 시작할 때 JDBC 커넥션을 획득하게 되는데, 필터에서 커넥션을 획득하고 반환하기 때문에 커넥션의 보유 시간이 증가한다. 또한, 필터까지 트랜잭션이 이어지기 때문에 트랜잭션의 경계가 모호해진다. 뷰나 컨트롤러에서 발생한 혹시 모를 엔티티 필드 변경이 필터에서 커밋하는 시점에 플러시되어 데이터베이스에 반영될 수 있다.

##### 실행 흐름과 세션, 트랜잭션 범위

<div align="center">
  <img src="{{ site.image_url_2022 }}/open-session-in-view-04.png" width="100%" class="image__border">
</div>

### 2.2. OSIV Pattern in Spring

스프링에서는 전통적인 OSIV 패턴의 문제점을 보완한 방법을 제공했다고 한다.

- OpenSessionInViewFilter
- OpenSessionInViewInterceptor

두 방법 모두 매커니즘은 같지만, 호출하는 시점이 다르다. 필터는 서블릿 디스패처 전에 실행하고, 인터셉터는 서블릿 디스패처 이후에 실행한다.

전통적인 OSIV 패턴은 필터를 기준으로 설명하였으니, 이번엔 인터셉터를 기준으로 진행하겠다. 전통적인 OSIV 패턴과 다르게 처음엔 세션만 오픈한다. 세션을 열 때 플러시 모드를 매뉴얼(manual)로 변경하여, 명시적인 `flush` 메서드 호출이 없으면 데이터베이스로 변경이 반영되지 않도록 한다.

이후 트랜잭션을 시작하는 시점은 `@Transactional` 애너테이션이 붙은 메서드를 호출하는 시점이다. 이 시점에 데이터베이스 커넥션을 획득하면서 플러시 모드를 자동(auto)으로 변경한다. `@Transactional` 애너테이션이 붙은 메서드 호출이 종료되면, 트랜잭션을 커밋(혹은 롤백)하면서 엔티티들의 변경 사항들을 데이터베이스에 반영한다. 이 시점에 커넥션을 반환하면서 플러시 모드를 다시 매뉴얼로 변경한다.

마지막으로 뷰를 렌더링하는 시점엔 세션이 열려있으니 영속성 컨텍스트가 존재하고, 영속성 컨텍스트 내의 엔티티들은 여전히 영속 상태로 남아 있다. 준영속 상태가 아니므로, `team` 엔티티의 `members` 필드를 사용할 때 발생하는 지연 로딩이 정상적으로 동작한다. 참고 자료에선 커넥션을 반환하였음에도 정상적으로 지연 로딩이 가능한 이유는 하이버네이트가 `"트랜잭션 미적용 데이터 접근"`을 허용하기 때문이라고 한다.

##### 트랜잭션 미적용 데이터 접근

- 자동 커밋 모드를 사용해서 데이터에 접근하는 하이버네이트 내부 메커니즘
- 대화형 콘솔에서 SQL 문을 편하게 실행하듯이 트랜잭션 범위를 지정하지 않고 개별 DML 문을 짧은 트랜잭션 내에서 실행할 수 있도록 해주는 모드

#### 2.2.1. OpenSessionInViewInterceptor 클래스

- 비즈니스 로직 `@Controller` 클래스의 메서드를 호출하기 전에 실행하는 `preHandle` 메서드에서는 세션을 열기만 한다.
  - 세션을 열면서 플러시 모드를 매뉴얼(manual)로 변경한다.
  - 플러시 모드가 매뉴얼이므로 명시적으로 `flush` 메서드를 호출하지 않는다면 엔티티의 변경이 데이터베이스에 반영되지 않는다.
- 비즈니스 로직 `@Controller` 클래스의 메서드 호출 후 실행하는 `postHandle` 메서드에서는 아무 일도 하지 않는다.
- 뷰 렌더링 이후 호출되는 `afterCompletion` 메서드에서 세션을 닫는다.

```java
package org.springframework.orm.hibernate5.support;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.hibernate.FlushMode;
import org.hibernate.HibernateException;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.lang.Nullable;
import org.springframework.orm.hibernate5.SessionFactoryUtils;
import org.springframework.orm.hibernate5.SessionHolder;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.ui.ModelMap;
import org.springframework.util.Assert;
import org.springframework.web.context.request.AsyncWebRequestInterceptor;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.context.request.async.CallableProcessingInterceptor;
import org.springframework.web.context.request.async.WebAsyncManager;
import org.springframework.web.context.request.async.WebAsyncUtils;

public class OpenSessionInViewInterceptor implements AsyncWebRequestInterceptor {

    public static final String PARTICIPATE_SUFFIX = ".PARTICIPATE";

    protected final Log logger = LogFactory.getLog(this.getClass());

    @Nullable
    private SessionFactory sessionFactory;

    public OpenSessionInViewInterceptor() {
    }

    public void setSessionFactory(@Nullable SessionFactory sessionFactory) {
        this.sessionFactory = sessionFactory;
    }

    @Nullable
    public SessionFactory getSessionFactory() {
        return this.sessionFactory;
    }

    private SessionFactory obtainSessionFactory() {
        SessionFactory sf = this.getSessionFactory();
        Assert.state(sf != null, "No SessionFactory set");
        return sf;
    }

    public void preHandle(WebRequest request) throws DataAccessException {
        String key = this.getParticipateAttributeName();
        WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);
        if (!asyncManager.hasConcurrentResult() || !this.applySessionBindingInterceptor(asyncManager, key)) {
            if (TransactionSynchronizationManager.hasResource(this.obtainSessionFactory())) {
                Integer count = (Integer)request.getAttribute(key, 0);
                int newCount = count != null ? count + 1 : 1;
                request.setAttribute(this.getParticipateAttributeName(), newCount, 0);
            } else {
                this.logger.debug("Opening Hibernate Session in OpenSessionInViewInterceptor");
                Session session = this.openSession();
                SessionHolder sessionHolder = new SessionHolder(session);
                TransactionSynchronizationManager.bindResource(this.obtainSessionFactory(), sessionHolder);
                AsyncRequestInterceptor asyncRequestInterceptor = new AsyncRequestInterceptor(this.obtainSessionFactory(), sessionHolder);
                asyncManager.registerCallableInterceptor(key, asyncRequestInterceptor);
                asyncManager.registerDeferredResultInterceptor(key, asyncRequestInterceptor);
            }

        }
    }

    public void postHandle(WebRequest request, @Nullable ModelMap model) {
    }

    public void afterCompletion(WebRequest request, @Nullable Exception ex) throws DataAccessException {
        if (!this.decrementParticipateCount(request)) {
            SessionHolder sessionHolder = (SessionHolder)TransactionSynchronizationManager.unbindResource(this.obtainSessionFactory());
            this.logger.debug("Closing Hibernate Session in OpenSessionInViewInterceptor");
            SessionFactoryUtils.closeSession(sessionHolder.getSession());
        }

    }

    private boolean decrementParticipateCount(WebRequest request) {
        String participateAttributeName = this.getParticipateAttributeName();
        Integer count = (Integer)request.getAttribute(participateAttributeName, 0);
        if (count == null) {
            return false;
        } else {
            if (count > 1) {
                request.setAttribute(participateAttributeName, count - 1, 0);
            } else {
                request.removeAttribute(participateAttributeName, 0);
            }

            return true;
        }
    }

    public void afterConcurrentHandlingStarted(WebRequest request) {
        if (!this.decrementParticipateCount(request)) {
            TransactionSynchronizationManager.unbindResource(this.obtainSessionFactory());
        }

    }

    protected Session openSession() throws DataAccessResourceFailureException {
        try {
            Session session = this.obtainSessionFactory().openSession();
            session.setFlushMode(FlushMode.MANUAL);
            return session;
        } catch (HibernateException var2) {
            throw new DataAccessResourceFailureException("Could not open Hibernate Session", var2);
        }
    }

    protected String getParticipateAttributeName() {
        return this.obtainSessionFactory().toString() + ".PARTICIPATE";
    }

    private boolean applySessionBindingInterceptor(WebAsyncManager asyncManager, String key) {
        CallableProcessingInterceptor cpi = asyncManager.getCallableInterceptor(key);
        if (cpi == null) {
            return false;
        } else {
            ((AsyncRequestInterceptor)cpi).bindSession();
            return true;
        }
    }
}
```

##### 실행 흐름과 세션, 트랜잭션 범위

- 아래 그림은 `OpenSessionInViewInterceptor`를 기준으로 작성하였다.

<div align="center">
  <img src="{{ site.image_url_2022 }}/open-session-in-view-05.png" width="100%" class="image__border">
</div>

### 2.3. OSIV Pattern in Spring with JPA

여태까지 참고 자료의 OSIV 패턴에 대해 정리해보았다. 상당히 잘 정리되어 있지만, 2011년도 글이다 보니 상당히 많은 변화가 있을 것으로 생각되어 직접 디버깅해보았다. 무엇보다 `"트랜잭션 미적용 데이터 접근"`이라는 개념이 쉽게 이해되진 않았다.

> 어떻게 데이터베이스 커넥션이 없이 SQL을 실행하지?<br/>
> 지연 로딩이 발생할 때마다 커넥션 풀에서 놀고 있는 커넥션을 사용하나?

직접 디버깅한 결과를 차근차근 정리해보겠다. `spring-boot-starter-data-jpa` 의존성을 사용하였고, 스프링 버전은 다음과 같다.

```xml
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.2.5.RELEASE</version>
        <relativePath/>
    </parent>
```

#### 2.3.1. OpenEntityManagerInViewInterceptor 클래스

- 실제 `spring.jpa.open-in-view` 설정으로 제어되는 클래스는 `OpenEntityManagerInViewInterceptor`이다.
- 대부분 로직이 `OpenSessionInViewInterceptor` 클래스와 유사하다.

```java
package org.springframework.orm.jpa.support;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.PersistenceException;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.lang.Nullable;
import org.springframework.orm.jpa.EntityManagerFactoryAccessor;
import org.springframework.orm.jpa.EntityManagerFactoryUtils;
import org.springframework.orm.jpa.EntityManagerHolder;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.ui.ModelMap;
import org.springframework.web.context.request.AsyncWebRequestInterceptor;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.context.request.async.CallableProcessingInterceptor;
import org.springframework.web.context.request.async.WebAsyncManager;
import org.springframework.web.context.request.async.WebAsyncUtils;

public class OpenEntityManagerInViewInterceptor extends EntityManagerFactoryAccessor implements AsyncWebRequestInterceptor {

    public static final String PARTICIPATE_SUFFIX = ".PARTICIPATE";

    public OpenEntityManagerInViewInterceptor() {
    }

    public void preHandle(WebRequest request) throws DataAccessException {
        String key = this.getParticipateAttributeName();
        WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);
        if (!asyncManager.hasConcurrentResult() || !this.applyEntityManagerBindingInterceptor(asyncManager, key)) {
            EntityManagerFactory emf = this.obtainEntityManagerFactory();
            if (TransactionSynchronizationManager.hasResource(emf)) {
                Integer count = (Integer)request.getAttribute(key, 0);
                int newCount = count != null ? count + 1 : 1;
                request.setAttribute(this.getParticipateAttributeName(), newCount, 0);
            } else {
                this.logger.debug("Opening JPA EntityManager in OpenEntityManagerInViewInterceptor");

                try {
                    EntityManager em = this.createEntityManager();
                    EntityManagerHolder emHolder = new EntityManagerHolder(em);
                    TransactionSynchronizationManager.bindResource(emf, emHolder);
                    AsyncRequestInterceptor interceptor = new AsyncRequestInterceptor(emf, emHolder);
                    asyncManager.registerCallableInterceptor(key, interceptor);
                    asyncManager.registerDeferredResultInterceptor(key, interceptor);
                } catch (PersistenceException var8) {
                    throw new DataAccessResourceFailureException("Could not create JPA EntityManager", var8);
                }
            }

        }
    }

    public void postHandle(WebRequest request, @Nullable ModelMap model) {
    }

    public void afterCompletion(WebRequest request, @Nullable Exception ex) throws DataAccessException {
        if (!this.decrementParticipateCount(request)) {
            EntityManagerHolder emHolder = (EntityManagerHolder)TransactionSynchronizationManager.unbindResource(this.obtainEntityManagerFactory());
            this.logger.debug("Closing JPA EntityManager in OpenEntityManagerInViewInterceptor");
            EntityManagerFactoryUtils.closeEntityManager(emHolder.getEntityManager());
        }

    }

    private boolean decrementParticipateCount(WebRequest request) {
        String participateAttributeName = this.getParticipateAttributeName();
        Integer count = (Integer)request.getAttribute(participateAttributeName, 0);
        if (count == null) {
            return false;
        } else {
            if (count > 1) {
                request.setAttribute(participateAttributeName, count - 1, 0);
            } else {
                request.removeAttribute(participateAttributeName, 0);
            }

            return true;
        }
    }

    public void afterConcurrentHandlingStarted(WebRequest request) {
        if (!this.decrementParticipateCount(request)) {
            TransactionSynchronizationManager.unbindResource(this.obtainEntityManagerFactory());
        }

    }

    protected String getParticipateAttributeName() {
        return this.obtainEntityManagerFactory().toString() + ".PARTICIPATE";
    }

    private boolean applyEntityManagerBindingInterceptor(WebAsyncManager asyncManager, String key) {
        CallableProcessingInterceptor cpi = asyncManager.getCallableInterceptor(key);
        if (cpi == null) {
            return false;
        } else {
            ((AsyncRequestInterceptor)cpi).bindEntityManager();
            return true;
        }
    }
}
```

#### 2.3.2. JDBC 커넥션 획득과 반환

##### JDBC 커넥션 획득 콜 스택(call stack)

- JDBC 커넥션 획득은 참고 자료와 마찬가지로 `@Transactional` 애너테이션이 붙은 메서드를 호출하는 시점이다.

<div align="left">
  <img src="{{ site.image_url_2022 }}/open-session-in-view-06.png" width="75%" class="image__border">
</div>

##### JDBC 커넥션 반환 콜 스택(call stack)

- JDBC 커넥션 반환은 `OpenEntityManagerInViewInterceptor` 클래스의 `afterCompletion` 메서드에서 실행한다.

<div align="left">
  <img src="{{ site.image_url_2022 }}/open-session-in-view-07.png" width="75%" class="image__border">
</div>

##### `spring.jpa.open-in-view` 설정 값이 `false`인 경우 JDBC 커넥션 반환

- `spring.jpa.open-in-view` 설정이 `false`이면, `@Transactional` 애너테이션이 붙은 메서드 종료 시점에 커넥션을 반환한다.
- `AOP` 마지막 `doCleanupAfterCompletion` 메서드에서 완료 후 트랜잭션을 정리하는 시점에 커넥션을 반납한다.

<div align="left">
  <img src="{{ site.image_url_2022 }}/open-session-in-view-08.png" width="75%" class="image__border">
</div>

##### `spring.jpa.open-in-view` 설정 값에 따른 분기 지점

- `spring.jpa.open-in-view` 설정 값에 따라 커넥션 정리 여부는 AOP `doCleanupAfterCompletion` 메서드에서 분기한다.
- `spring.jpa.open-in-view` 설정 값이 `false`인 경우에는 위의 파란색 블록을 수행하여 커넥션을 정리한다.
- `spring.jpa.open-in-view` 설정 값이 `true`인 경우에는 아래 초록색 블록을 수행하여 커넥션 정리를 이후로 미룬다.

<div align="left">
  <img src="{{ site.image_url_2022 }}/open-session-in-view-09.png" width="75%" class="image__border">
</div>

#### 2.3.3. Session 플러시 모드

- 세션은 생성되는 시점부터 플러시 모드가 `AUTO`이다.
- `OpenEntityManagerInViewInterceptor` 클래스의 `preHandler` 메서드에서 생성된 세션의 플러시 모드는 `AUTO`이다.

<div align="center">
  <img src="{{ site.image_url_2022 }}/open-session-in-view-10.png" width="100%" class="image__border">
</div>

##### 직접 확인한 실행 흐름과 세션, 트랜잭션, 커넥션 범위

<div align="center">
  <img src="{{ site.image_url_2022 }}/open-session-in-view-11.png" width="100%" class="image__border">
</div>

## 3. Lazy loading in JSP

`application.yml` 파일의 `spring.jpa.open-in-view` 설정을 `true`로 변경하고 화면을 조회하면 정상적으로 동작한다.

##### application.yml

```yml
server:
  port: 8080
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
    open-in-view: true
  h2:
    console:
      path: /h2-console
      enabled: true
```

##### 정상 처리 화면

<div align="left">
  <img src="{{ site.image_url_2022 }}/open-session-in-view-12.gif" width="65%" class="image__border">
</div>

## CLOSING

> `DTO(Data Transfer Object)`를 사용하면 문제가 해결되는 거 아니야?

`OSIV` 패턴은 엔티티를 뷰까지 전달하여 사용하는 것을 허용하기 때문에 의도치 않은 위험을 유발할 수 있다고 생각했다. 트랜잭션 범위 내에서 `DTO`를 만들어 반환하면 OSIV 패턴도 필요 없지 않을까 궁금하였다.

참고한 자료를 보면 다음과 같은 설명이 되어 있다.

> 이러한 문제를 방지하기 위해 도메인 객체 대신 DTO 를 사용하자는 주장도 있으나
> 이것은 앞에서 살펴 본 POJO FACADE 패턴처럼 뷰에 대한 관심사가 애플리케이션 레이어와 도메인 레이어로 누수되는 문제를 안고 있다.
> 뷰에 도메인 객체를 전달하는 것이 캡슐화의 원칙을 위반한다는 견해도 있으나
> 도메인 객체가 전달된다고 해서 반드시 캡슐화 위반이라고 볼 수 없으며 DTO를 전달한다고 해서 반드시 캡슐화의 원칙이 지켜진다고 볼 수도 없다.
> 아키텍처적인 관점에서 뷰가 도메인 객체에 접근하는 것 역시 "완화된 아키텍처 시스템"의 일종일 뿐이다.

`"레이어 별 관심사의 분리"`라는 심오한 주제를 이야기하시는 것을 보고 어떤 분인지 상당히 궁금해졌는데, 찾아보니 [객체지향의 사실과 오해][oop-book-link]와 [오브젝트][object-book-link]라는 책을 집필하신 분이었다. 이 분께서 생각하는 객체지향에 대한 철학과 원칙에 대해 너무 궁금해서 당일에 구매하였다. 올해 내에 블로그에 독후감을 남기는 것을 목표로 열심히 읽어야겠다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-04-20-open-session-in-view>

#### REFERENCE

- <http://aeternum.egloos.com/2798098>
- <http://pds19.egloos.com/pds/201106/28/18/Open_Session_In_View_Pattern.pdf>
- <https://julingks.wordpress.com/2010/09/15/hibernate-persistence-lifecycle/>
- [Java Persistence with Hibernate][hibernate-book-link]

[jpa-persistence-context-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-persistence-context/
[persistence-context-advantages-link]: https://junhyunny.github.io/spring-boot/jpa/junit/persistence-context-advantages/
[jpa-flush-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-flush/
[transactional-propagation-type-link]: https://junhyunny.github.io/spring-boot/jpa/junit/transactional-propagation-type/
[filter-interceptor-and-aop-link]: https://junhyunny.github.io/spring-boot/filter-interceptor-and-aop/

[hibernate-book-link]: https://hoclaptrinhdanang.com/downloads/pdf/spring/Java%20Persistence%20with%20Hibernate.pdf
[oop-book-link]: https://www.kyobobook.co.kr/product/detailViewKor.laf?mallGb=KOR&ejkGb=KOR&barcode=9788998139766
[object-book-link]: https://www.kyobobook.co.kr/product/detailViewKor.laf?ejkGb=KOR&mallGb=KOR&barcode=9791158391409&orderClick=LEa&Kc=
