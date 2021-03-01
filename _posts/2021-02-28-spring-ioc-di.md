---
title: "Spring IoC(Inversion of Control), DI(Dependency Injection)"
search: false
category:
  - spring boot
  - framework
  - design-pattern
  - software-engineering
last_modified_at: 2021-03-01T00:00:00
---

<br>

Spring 프레임워크에 대한 공부를 시작하면 IoC(Inversion of Control)과 DI(Dependency Injection)이라는 용어를 가장 먼저 접하게 됩니다. 
해당 내용을 포스트하기 위해 대해 공부하다보니 사실 Spring 프레임워크가 아니라 소프트웨어 공학에 대한 개념이라는 사실을 알게되었습니다. 
이번 포스트를 통해 IoC(Inversion of Control)과 DI(Dependency Injection)에 대한 개념을 정리하고, Spring 프레임워크와 어떤 연관성이 있는지 알아보겠습니다.

## 제어의 역전(IoC, Inversion of Control)

> 객체 제어에 대한 주체를 프로그래머에서 컨테이너나 프레임워크로 변경한 소프트웨어 공학의 원리<br>
> Inversion of Control is a principle in software engineering which transfers the control of objects or portions of a program to a container or framework.

제어의 역전(IoC, Inversion of Control)이라는 개념은 Spring에서 처음 언급된 것은 아닙니다. 
IoC는 소프트웨어 공학의 원리 중 하나이고 Spring 프레임워크에서 이를 채택하여 사용한 것입니다. 

## 의존성 주입(DI, Dependency Injection)

> IoC를 구현한 **디자인 패턴**으로 객체 간의 의존성이 외부에 의해 선택되는 방식을 의미<br>
> Dependency injection is a pattern we can use to implement IoC, where the control being inverted is setting an object's dependencies.

의존성 주입은 소프트웨어 공학에서 사용되는 디자인 패턴으로 정의됩니다. 
주입이라는 단어를 통해 외부로부터 전달받는다는 느낌을 얻을 수 있지만 우선 의존성(depndency)이라는 단어에 대한 정의가 필요해보입니다.

### 의존성(Dependency)이란?
- 어떤 클래스 A가 다른 클래스 또는 인터페이스 B를 이용할 때 A가 B에 의존한다고 합니다.
- A는 B 없이 작동할 수 없고 B를 재사용하지 않으면 A 또한 재사용할 수 없습니다.
- 이런 상황에서 클래스 A를 `dependant`라 하고 클래스(인터페이스) B를 `dependency`라고 한다.
- B에 변화에 A는 영향을 받지만, A의 변화에 B는 영향을 받지 않는다.

의존성 주입이란 **`클래스 A에서 사용할 클래스(인터페이스) B를 외부로부터 전달받는다.`** 라고 다시 정리할 수 있겠습니다. 

##### 제어의 역전(IoC, Inversion of Control), 의존성 주입(DI, Dependency Injection) 그리고 프레임워크와의 관계
- 제어의 역전(IoC)은 소프트웨어 공학의 원리(principle)로써 하나의 컨셉 혹은 가이드라인입니다.
- 의존성 주입(DI)은 IoC 원리를 구현한 디자인 패턴으로써 외부에 제어를 통해 의존성을 주입받는 프로그래밍 방식입니다. 
- IoC Containers는 IoC 개념이 적용된 프로그램으로써 프레임워크에서 이를 사용합니다.
<p align="center"><img src="/images/spring-ioc-di-1.JPG" width="800"></p>
<center>이미지 출처, https://dotnettutorials.net/lesson/introduction-to-inversion-of-control/</center><br>

## Spring 프레임워크의 제어의 역전(IoC) 적용
전통적인 프로그래밍은 개발자가 작성한 코드에서 라이브러리를 호출하는 방식이었습니다. 
**반대로 IoC 원리가 적용된 프레임워크에선 개발자가 구현한 코드가 프레임워크에 의해 흐름 제어를 받는 방식입니다.** 
그렇다면 프로그래머가 작성한 코드를 어떻게 프레임워크에게 전달할 수 있을까요? 
Spring Boot 프레임워크를 중심으로 알아보도록 하겠습니다. 

### Sprigng Boot IoC Container
- BeanFactory
- ApplicationContext

### Spring Boot @Bean 등록 방법
작성 중입니다.

### Spring Boot 의존성 주입 방법
- Setter Injection
  - 의존성을 입력 받을 수 있는 setter 메서드를 만들고 이를 통해 의존성을 주입받습니다.
  - memberService 객체는 IoC container를 통해 주입됩니다.

```java
```

- Constructor Injection
  - 권장되는 방식의 의존성 주입 방법입니다. 
  - 의존성을 입력 받을 수 있는 생성자를 만들고 이를 통해 의존성을 주입받습니다.
  - memberService 객체는 IoC container를 통해 주입됩니다.

```java
```

- Method Injection
  - 의존성을 입력 받을 수 있는 일반 메서드를 만들고 이를 통해 의존성을 주입받습니다.
  - memberService 객체는 IoC container를 통해 주입됩니다.

```java
```

## OPINION
글을 정리하다보니 Spring 프레임워크보다는 소프트웨어 공학, 디자인 패턴에 대해 공부가 되었습니다. 
아래 추천하는 [제어의 역전(Inversion of Control, IoC) 이란?][IoC-blogLink] 글을 보시면 구체적인 예제 코드를 통해 의존성 주입과 관련된 개념을 설명해주고 있습니다. 
앞으로도 꾸준히 공부해서 추천 글과 같은 좋은 포스트를 작성할 수 있는 날이 왔으면 좋겠습니다. 

#### 참조글
- <https://dotnettutorials.net/lesson/introduction-to-inversion-of-control/>
- [제어의 역전(Inversion of Control, IoC) 이란?][IoC-blogLink] **(추천)**
- <https://madplay.github.io/post/why-constructor-injection-is-better-than-field-injection>
- [의존성이란?][dependency-blogLink]

[IoC-blogLink]: https://develogs.tistory.com/19
[dependency-blogLink]: https://velog.io/@huttels/%EC%9D%98%EC%A1%B4%EC%84%B1%EC%9D%B4%EB%9E%80