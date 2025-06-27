---
title: "JPA(Java Persistence API)"
search: false
category:
  - spring-boot
  - jpa
last_modified_at: 2025-06-25T20:00:00
---

<br/>

## 1. Java Persistence API

`JPA(Java Persistence API)` 정의를 먼저 살펴보자. 

> Java 애플리케이션에서 관계형 데이터베이스를 사용하는 방식을 정의한 인터페이스

정의를 살펴봐도 어떤 역할을 수행하는지 구체적이지 않다. `JPA`를 정의에서 사용한 단어들을 살펴보면서 추상적인 개념들을 구체화시켜 보자. 영속성(persistence)이란 특정 데이터를 생성한 프로그램이 종료되더라도 해당 데이터는 사라지지 않는 성질을 의미한다. 데이터가 영구적으로 보존된다는 의미이다. 영속성을 지니지 못하는 데이터는 프로그램이 종료되면 함께 삭제되는 휘발성을 가진다. 영속성을 지닌 데이터는 프로그램이 종료되더라도 다른 곳에 저장되어 다시 조회할 수 있다. 파일 시스템이나 데이터베이스를 사용해 데이터를 저장하는 행위를 `"데이터에 영속성을 부여한다."`라고 표현한다.

애플리케이션의 구조를 살펴봤을 때 데이터에 영속성을 부여해주는 기능들이 모여있는 계층을 영속성 계층(persistence layer)이라 한다. 물리적으론 데이터베이스에 데이터를 저장하는 프로그램 코드들이 모여있는 패키지(package)이다. 영속성 계층을 적용하기 위해 영속성 프레임워크(persistence framework)를 사용한다. 영속성 프레임워크가 제공하는 API 기능들을 사용하면 손쉽게 데이터에 영속성을 부여할 수 있다. `MyBatis`, `하이버네이트(Hibernate)`가 대표적인 영속성 프레임워크이다.

영속성 계층이 적용된 애플리케이션의 계층 구조는 다음과 같다.

<div align="center">
  <img src="/images/posts/2021/java-persistence-api-01.png" width="65%" class="image__border">
</div>

<br/>

JPA는 영속성 프레임워크의 기능을 사용하기 위한 인터페이스(API, application programming interface)다. JPA가 제공하는 기능을 사용하면 내부적으론 하이버네이트 프레임워크가 실행된다. 하이버네이트는 `ORM(Object-Relation Mapping)` 프레임워크다. 여기서 ORM(Object-Relation Mapping)이란 무엇일까?

> 애플리케이션의 객체와 관계형 데이터베이스의 테이블을 자동으로 연결하는 행위이다.

애플리케이션은 객체지향적으로 설계된다. 클래스와 객체 중심으로 설계된다. 데이터베이스는 테이블, 행, 열 구조로 구성되고, 각 테이블들 사이의 관계로 이뤄진 관계형 모델이다. 시스템을 구성하는 두 요소는 구조적으로 다르기 때문에 직접 연결할 떄 불일치가 발생한다. ORM 프레임워크는 객체 모델과 관계형 모델 간의 불일치를 해소하기 위한 기술이다. 다음과 같은 개념으로 객체 모델과 관계형 모델을 연결한다.

- 객체지향 언어의 클래스 - 관계형 데이터베이스의 테이블
- 객체지향 언어의 객체 - 관계형 데이터베이스의 데이터
- 객체지향 언어의 객체 사이의 의존 관계 - 관계형 데이터베이스의 테이블 사이의 연관 관계

객체의 동작을 프레임워크에서 감지하고 SQL 질의(query)로 만들어 수행한다. `ORM`은 객체의 모습 그대로 데이터로 저장할 수 있게 만듦으로써 객체지향적인 설계가 데이터베이스 모델링에 의해 흐트러지지 않도록 도와준다.

<div align="center">
  <img src="/images/posts/2021/java-persistence-api-02.png" width="80%" class="image__border">
</div>

<br/>

ORM 프레임워크는 다음과 같은 장점을 갖는다.

- 객체지향적인 코드를 작성할 수 있으며 더 직관적인 개발이 가능하다.
- 클래스 설계를 데이터베이스에 그대로 반영하여 사용할 수 있으므로 초반 개발 속도가 빠르다.
- 다음과 같은 이유로 질의문 작성이 많지 않다.
  - 객체의 상태 변경이 자동으로 데이터베이스에 반영된다.
  - 객체의 동작이 읽기 질의문으로 변경되어 동작한다.
- SQL을 직접 작성하지 않으므로 데이터베이스 종속성이 저하된다.

다음과 같은 단점이 있다.

- 객체지향적인 설계가 성능의 이슈를 발생시킨다.
  - 과도한 연결 관계로 인한 조인 쿼리 발생
  - 일-대-다 관계로 인한 1+N 문제 발생
- 화면에 복잡한 표현 때문에 많은 객체를 조회하는 경우 성능 문제가 발생한다.
- 잘못된 설정으로 인해 데이터베이스에 저장된 스키마나 데이터를 잃을 수 있다.
- 직관적인 SQL 질의문을 작성하는 것이 아니라 애너테이션 같은 메타성 코드를 사용하기 때문에 러닝 커브가 있다.

## 2. Spring Data JPA

Spring 프레임워크에서 JPA를 쉽게 사용하기 위해 만든 라이브러리다. `Spring Data JPA`는 `JPA`를 한 단계 더 추상화시킨 `Repository` 인터페이스를 제공한다. 개발자는 이를 확장하여 사용할 수 있다. 간단한 이름 규칙에 맞는 메소드를 작성함으로써 쉽게 영속성 프레임워크 기능을 사용할 수 있다. 실제 추상화 된 구조를 살펴보면 다음과 같다.

<div align="center">
  <img src="/images/posts/2021/java-persistence-api-03.png" width="50%" class="image__border">
</div>
<center>https://dahye-jeong.gitbook.io/spring/spring/2020-04-11-jpa-basic</center>

#### RECOMMEND NEXT POSTS

- [영속성 컨텍스트(persistent context)와 엔티티(entity) 생명주기][jpa-persistence-context-link]
- [EntityManager 특징과 영속성 컨텍스트 장점][persistence-context-advantages-link]
- [JPA 플러쉬(flush)][jpa-flush-link]
- [JPA 클리어(clear)][jpa-clear-link]
- [CascadeType in JPA][jpa-cascade-type-link]
- [JPA N+1 Problem][jpa-one-plus-n-problem-link]
- [JPA Fetch 조인(join)과 페이징(paging) 처리][jpa-fetch-join-paging-problem-link]

#### REFERENCE

- <https://dahye-jeong.gitbook.io/spring/spring/2020-04-11-jpa-basic>
- <https://suhwan.dev/2019/02/24/jpa-vs-hibernate-vs-spring-data-jpa/>
- <https://gmlwjd9405.github.io/2019/08/03/reason-why-use-jpa.html>

[dahye-jeong-blog-link]: https://dahye-jeong.gitbook.io/spring/spring/2020-04-11-jpa-basic

[jpa-persistence-context-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-persistence-context/
[persistence-context-advantages-link]: https://junhyunny.github.io/spring-boot/jpa/junit/persistence-context-advantages/
[jpa-flush-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-flush/
[jpa-clear-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-clear/
[jpa-cascade-type-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-cascade-type/
[jpa-one-plus-n-problem-link]: https://junhyunny.github.io/spring-boot/jpa/jpa-one-plus-n-problem/
[jpa-fetch-join-paging-problem-link]: https://junhyunny.github.io/spring-boot/jpa/jpa-fetch-join-paging-problem/