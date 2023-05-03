---
title: "JPA(Java Persistence API)"
search: false
category:
  - spring-boot
  - jpa
last_modified_at: 2021-08-22T01:00:00
---

<br/>

## 1. Java Persistence API

`JPA` 정의를 먼저 살펴보겠습니다.

> Java 어플리케이션에서 관계형 데이터베이스를 사용하는 방식을 정의한 인터페이스

정의를 살펴봤지만, 어떤 역할을 수행하는지 구체적이지 않습니다. 
`JPA`를 정의에서 사용한 단어들을 살펴보면서 추상적인 개념들을 구체화시켜보겠습니다. 

## 2. 영속성(Persistence)

> 특정 데이터를 생성한 프로그램이 종료되더라도 해당 데이터는 사라지지 않는다.

데이터가 영구적으로 보존될 수 있다는 특성입니다. 
영속성을 지니지 못하는 데이터는 프로그램이 종료되면 함께 삭제되는 휘발성을 가집니다. 
영속성을 지닌 데이터는 프로그램이 종료되더라도 다른 곳에 저장되어 다시 조회할 수 있습니다. 
파일 시스템이나 데이터베이스를 사용해 데이터를 저장하는 행위를 `"데이터에 영속성을 부여한다."` 라고 표현합니다. 

### 2.1. 영속성 계층(Persistence Layer)

어떤 어플리케이션의 구조를 살펴봤을 때 데이터에 영속성을 부여해주는 기능들이 모여있는 계층을 의미합니다. 
물리적으론 데이터베이스에 데이터를 저장하는 프로그램 코드들이 모여있는 패키지(package)입니다. 

일반적으로 영속성 계층의 코드는 영속성 프레임워크(persistence framework)를 사용합니다. 
영속성 프레임워크가 제공하는 간단한 코드를 사용하면 쉽게 데이터에 영속성을 부여할 수 있습니다. 
`MyBatis`, `Hibernate`가 대표적인 영속성 프레임워크입니다. 

##### 어플리케이션 계층 구조

<p align="center">
    <img src="/images/java-persistence-api-1.JPG" width="45%" class="image__border">
</p>

## 3. Object-Relation Mapping

> 어플리케이션의 객체와 관계형 데이터베이스의 테이블을 자동으로 연결하는 행위

`ORM(Object-Relation Mapping)`은 어플리케이션 설계와 데이터베이스 설계가 따로 이루어지면서 발생하는 객체 모델과 관계형 모델간의 불일치를 해소하기 위한 방법입니다. 

다음과 같은 개념으로 객체 모델과 관계형 모델을 연결합니다. 

* 객체지향 언어의 클래스 - 관계형 데이터베이스의 테이블
* 객체지향 언어의 객체 - 관계형 데이터베이스의 데이터
* 객체지향 언어의 객체 사이의 의존 관계 - 관계형 데이터베이스의 테이블 사이의 연관 관계

객체의 동작을 프레임워크에서 감지하고 SQL 질의(query)로 만들어 수행합니다. 
`ORM`은 객체의 모습 그대로 데이터로 저장할 수 있게 만듦으로써 객체지향적인 설계가 데이터베이스 모델링에 의해 흐트러지지 않도록 도와줍니다. 

##### ORM 클래스와 테이블 연결

<p align="center">
    <img src="/images/java-persistence-api-2.JPG" width="70%" class="image__border">
</p>

### 3.1. ORM 프레임워크 장점과 단점

ORM 프레임워크를 사용하면서 느낀 장점과 단점을 정리하였습니다. 
다음과 같은 장점이 있습니다.

* 객체지향적인 코드를 작성할 수 있으며 더 직관적인 개발이 가능합니다. 
* 클래스 설계를 데이터베이스에 그대로 반영하여 사용할 수 있으므로 초반 개발 속도가 빠릅니다. 
* 다음과 같은 이유로 질의문 작성이 많지 않습니다.
    * 객체의 상태 변경이 자동으로 데이터베이스에 반영됩니다.
    * 객체의 동작이 읽기 질의문 변경되어 동작합니다.
* SQL을 직접 작성하지 않으므로 데이터베이스 종속성이 저하됩니다.

다음과 같은 단점이 있습니다. 

* 객체지향적인 설계가 성능의 이슈를 발생시킵니다.
    * 과도한 연결 관계로 인한 조인 쿼리 발생
    * 지연 로딩(lazy loading)으로 인한 1+N 문제 발생
* 화면에 복잡한 표현 때문에 많은 객체를 조회하는 경우 성능 문제가 발생합니다. 
* 잘못된 설정으로 인해 데이터베이스에 저장된 스키마나 데이터를 잃을 수 있습니다. 
* 직관적인 SQL 질의문을 작성하는 것이 아니라 애너테이션 같은 메타성 코드를 사용하기 때문에 러닝 커브가 있습니다.

## 4. Summary

위 내용들을 다시 요약하면 다음과 같습니다.

* 어플리케이션은 필요에 따라 데이터에 영속성을 부여할 필요가 있습니다.
    * 데이터에 영속성을 부여한다는 것은 데이터를 영구적으로 저장하겠다는 의미입니다.
* 영속성 프레임워크는 데이터를 쉽게 저장할 수 있는 기능을 제공합니다. 
* `JPA`는 `ORM` 영속성 프레임워크를 쉽게 사용하기 위한 `Java` 인터페이스입니다. 
    * `ORM`은 객체지향적인 설계를 관계형 데이터베이스의 모델링에 반영하기 위한 메커니즘(mechanism)입니다.

## 5. Spring Data JPA

> Spring 프레임워크에서 JPA를 쉽게 사용하기 위해 만든 컴포넌트

`Spring Data JPA`는 `JPA`를 한 단계 더 추상화시킨 `Repository` 인터페이스를 제공합니다. 
개발자는 이를 확장하여 사용할 수 있습니다. 
간단한 이름 규칙에 맞는 메소드를 작성함으로써 쉽게 영속성 프레임워크 기능을 사용할 수 있습니다. 

##### Spring Data JPA - JPA - Hibernate 추상화 구조

<p align="center">
    <img src="/images/java-persistence-api-3.JPG" width="45%" class="image__border">
</p>
<center>https://dahye-jeong.gitbook.io/spring/spring/2020-04-11-jpa-basic</center>

#### RECOMMEND NEXT POSTS

* [PersistenceContext and Entity Lifecycle][jpa-persistence-context-link]
* [Features of EntityManager][persistence-context-advantages-link]
* [JPA Flush][jpa-flush-link]
* [JPA Clear][jpa-clear-link]
* [JPA N+1 Problem][jpa-one-plus-n-problem-link]
* [JPA Fetch 조인(join)과 페이징(paging) 처리][jpa-fetch-join-paging-problem-link]

#### REFERENCE

* <https://dahye-jeong.gitbook.io/spring/spring/2020-04-11-jpa-basic>
* <https://suhwan.dev/2019/02/24/jpa-vs-hibernate-vs-spring-data-jpa/>
* <https://gmlwjd9405.github.io/2019/08/03/reason-why-use-jpa.html>

[dahye-jeong-blog-link]: https://dahye-jeong.gitbook.io/spring/spring/2020-04-11-jpa-basic

[jpa-persistence-context-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-persistence-context/
[persistence-context-advantages-link]: https://junhyunny.github.io/spring-boot/jpa/junit/persistence-context-advantages/
[jpa-flush-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-flush/
[jpa-clear-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-clear/
[jpa-one-plus-n-problem-link]: https://junhyunny.github.io/spring-boot/jpa/jpa-one-plus-n-problem/
[jpa-fetch-join-paging-problem-link]: https://junhyunny.github.io/spring-boot/jpa/jpa-fetch-join-paging-problem/