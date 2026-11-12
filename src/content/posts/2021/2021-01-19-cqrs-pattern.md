---
title: "CQRS(Command Query Responsibility Segregation) 패턴"
publishedAt: "2021-01-19"
updatedAt: "2026-11-12T16:26:00+09:00"
canonicalPath: "/information/design-pattern/cqrs-pattern/"
categories:
  - "information"
  - "design-pattern"
summary: "마틴 파울러의 글을 바탕으로 명령과 조회의 책임을 분리하는 CQRS 패턴의 필요성과 코드, 서비스, 데이터베이스 수준의 구현 방식, 적용 시점을 정리했다."
---

## 0. 들어가면서

마틴 파울러의 [CQRS(Command Query Responsibility Segregation)에 관한 글][martin-fowler-cqrs-link]을 읽고 든 생각을 정리했다. 패턴(pattern)의 원칙 자체는 어렵지 않지만, 구현할 때 시스템의 복잡성이 커지고 다른 패턴이나 방법론이 함께 쓰이면서 이해하기 어려워진다. 이번 글은 순수하게 CQRS 패턴만 다룬다.

## 1. CQRS(Command Query Responsibility Segregation) Pattern

> CQRS(Command and Query Responsibility Segregation) - 명령과 조회의 책임 분리

CQRS 패턴은 시스템의 상태를 바꾸는 커맨드(command) 기능과 시스템의 상태를 확인하는 쿼리(query) 기능을 나눠 개발하자는 원칙을 가진 패턴이다. 커맨드와 쿼리를 분리하는 개념은 `Bertrand Meyer`의 [Object Oriented Software Construction][bertrand-meyer-book-link]에서 `CQS(Command Query Separation)`라는 용어로 소개됐다. CQS는 커맨드와 쿼리를 다음과 같이 정의한다.

- 커맨드 - 상태를 바꾸고 값을 반환하지 않는다.
- 쿼리 - 상태 변경 없이 조회만 수행한다.

이 설명은 객체의 행동(method)에 대한 정의이지만, 이 개념을 아키텍처까지 확장하면 `CQRS` 패턴이 된다.

## 2. CQRS 패턴은 왜 사용하는가?

처음 설계한 도메인 모델은 시간이 지나면서 "데이터가 저장되는 모습"과 "보고 싶어 하는 데이터의 모습"이 달라진다. 그 이유는 다양하지만, 대표적으로 시간이 지나면서 비즈니스 요건이 정교해진다. 예를 들어 통계성 데이터를 추가하고 싶을 수도 있고, 여러 모델의 데이터를 조합해서 보고 싶을 수도 있다. UX(user experience) 측면에서도 보고 싶은 데이터의 모습은 복잡해지기 마련이다. 즉, 쿼리가 점점 어려워진다.

보통 모델은 도메인의 모습을 따라가고, 영속성 데이터 저장소도 이를 따라 도메인의 모습을 반영한다. 정교해지는 비즈니스 요건은 쿼리를 복잡하게 만들고, 불필요한 항목이 추가되면서 처음 설계한 모델을 무너뜨릴 수 있다. 다양한 표현을 하나의 개념적인 모델로 나타내기가 점점 어려워진다.

이런 문제를 미리 막기 위해 시스템의 상태를 변경하는 커맨드 책임과 상태를 반환하는 쿼리 책임을 구분 짓는다. 커맨드는 데이터의 생성(create), 변경(update), 삭제(delete)를 수행한다. 쿼리는 데이터를 조회(read)하는 책임을 맡는다.

## 3. 어떻게 구현하는가?

커맨드와 쿼리를 반드시 서비스 수준으로 구분하거나 데이터베이스를 나눌 필요는 없다. 정답은 없으니 각자 상황에 맞게 이점을 최대한 얻을 수 있는 아키텍처를 선택한다.

### 3.1. 코드 수준 분리

한 애플리케이션 안에서 커맨드 모델과 쿼리 모델을 분리해 책임을 코드 수준에서 나눈다. 특징은 다음과 같다.

- 비즈니스 요건 변경에 맞춘 변경을 각 모델에서 수행한다. 화면의 변경 사항 때문에 엔티티를 변경하지 않아도 된다.
- 서로 다른 모델을 사용하기 때문에 변경의 영향도가 줄어든다.
- 단순하지만 확장성이 떨어지고, 최적화에 한계가 있다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2021/main/cqrs-pattern-01.png" width="50%" class="image__border">
</div>

### 3.2. 서비스 수준 분리

커맨드 책임과 쿼리 책임을 서비스 수준으로 분리한다. 특징은 다음과 같다.

- 서비스별로 스케일(scale)을 바꿀 수 있다. 보통 쿼리 기능에 부하가 집중되는데, 쿼리 서비스만 스케일 아웃해 부하를 분산할 수 있다.
- 서비스 사이의 커플링(coupling)이 느슨해진다.
- 단순히 모델을 분리하는 것에 비해 복잡성이 커진다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2021/main/cqrs-pattern-02.png" width="50%" class="image__border">
</div>

### 3.3. 데이터베이스 분리

각 서비스에 맞는 데이터베이스를 사용할 수 있도록 데이터베이스를 분리한다. 특징은 다음과 같다.

- 폴리글랏(polyglot) 저장소를 사용할 수 있다. 서비스의 강점을 살릴 수 있는 데이터베이스를 선택할 수 있다.
- 데이터베이스 사이의 동기화 방법을 고려해야 한다.
  - 브로커를 이용한 메시지 처리
  - 데이터베이스 CDC(Change Data Capture)
- 데이터 유실과 트랜잭션 범위를 고민해야 한다.
- 데이터 동기화 때문에 생기는 최종적 일관성(eventual consistency)을 고민해야 한다.
- 시스템의 복잡성이 크게 증가한다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2021/main/cqrs-pattern-03.png" width="50%" class="image__border">
</div>

## 4. When to use CQRS and not to use?

마틴 파울러는 CQRS 패턴을 적용할 수 있는 경우를 다음과 같이 제시했다.

- 전체 시스템이 아닌 DDD 원칙의 바운디드 컨텍스트(bounded context)로 구분되는 시스템의 일부 영역
- 소수의 복잡한 비즈니스 도메인
- 고성능 애플리케이션 개발

마틴 파울러의 글을 읽으면서 받은 느낌은 "좋은 방법이긴 하지만, 고민 많이 해 보고 결정해."였다.

> [CQRS][martin-fowler-cqrs-link]<br/>
> Like any pattern, CQRS is useful in some places, but not in others. 
> Many systems do fit a CRUD mental model, and so should be done in that style. 
> CQRS is a significant mental leap for all concerned, so shouldn't be tackled unless the benefit is worth the jump. 
> While I have come across successful uses of CQRS, 
> so far the majority of cases I've run into have not been so good, 
> with CQRS seen as a significant force for getting a software system into serious difficulties.<br/>
> ...
> Despite these benefits, you should be very cautious about using CQRS. 
> Many information systems fit well with the notion of an information base that is updated in the same way that it's read, 
> adding CQRS to such a system can add significant complexity. 
> I've certainly seen cases where it's made a significant drag on productivity, 
> adding an unwarranted amount of risk to the project, even in the hands of a capable team. 
> So while CQRS is a pattern that's good to have in the toolbox, 
> beware that it is difficult to use well and you can easily chop off important bits if you mishandle it.

CQRS 패턴을 맞지 않는 도메인에 적용하면 시스템 복잡성과 프로젝트의 리스크는 커지고 생산성은 줄어든다. 단순히 몇 가지 기준으로 CQRS 패턴의 적용 여부를 결정하는 것은 리스크가 커 보인다. 프로젝트를 진행하는 팀원들과 충분히 대화해서 패턴의 적용 여부를 결정하면 좋을 것 같다.

#### REFERENCE

- <https://martinfowler.com/bliki/CommandQuerySeparation.html>
- <https://martinfowler.com/bliki/CQRS.html>
- <https://www.popit.kr/cqrs-eventsourcing/>
- <https://auconsil.blogspot.com/2013/08/cqrs-command-query-responsibility.html>
- <https://freedeveloper.tistory.com/400>
- <https://www.youtube.com/watch?v=BnS6343GTkY>

[martin-fowler-cqrs-link]: https://martinfowler.com/bliki/CQRS.html
[bertrand-meyer-book-link]: https://en.wikipedia.org/wiki/Object-Oriented_Software_Construction
