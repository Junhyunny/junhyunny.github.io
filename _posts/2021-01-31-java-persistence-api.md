---
title: "JPA(Java Persistence API)"
search: false
category:
  - spring-boot
  - jpa
last_modified_at: 2021-08-22T01:00:00
---

<br>

두서없이 JPA를 사용하다가 지금에 와서 보니 제대로 된 정의조차 모르고 있었습니다. 
JPA에 대한 글 작성 전에 우선 JPA에 대한 정의를 찾아보았습니다. 
저는 아래 두 문장이 JPA를 가장 잘 설명한다고 생각합니다. 

> **ORM(Object-Relation Mapping)** 표준 기술<br>
> Java 어플리케이션에서 관계형 데이터베이스를 사용하는 방식을 정의한 **인터페이스**

정의를 적어두고 보니 JPA 기술과 항상 붙어다니는 용어들이 하나같이 익숙하지 않습니다. 
우선 용어에 대해 정리해보도록 하겠습니다. 

## 1. 영속성(Persistence)
**'특정 데이터를 생성한 프로그램이 종료되더라도 해당 데이터는 사라지지 않는다.'**는 데이터 특성을 의미합니다. 
영속성을 지니지 못한 데이터는 메모리에만 존재하기 때문에 프로그램이 종료되면 그 즉시 소멸됩니다. 
반대로 영속성을 지닌 데이터는 어플리케이션이 종료되더라도 삭제되지 않고 남아있습니다. 

**파일 시스템, 데이터베이스 등을 통해 데이터를 영구적으로 저장하는 행위는 `'데이터에 영속성을 부여한다.'` 라고 표현할 수 있습니다.** 

### 1.1. 영속성 계층(Persistence Layer)
어플리케이션에서 데이터에 영속성을 부여해주는 계층을 의미합니다. 
조금 더 풀어 설명하면 데이터베이스에 데이터를 저장할 수 있는 프로그램 영역을 의미합니다. 
개발자는 Persistence 프레임워크를 사용하여 보다 쉽게 데이터에 영속성을 부여할 수 있습니다. 
Persistence 프레임워크는 MyBatis 같은 `SQL Mapper`나 Hibernate 같은 `Object Relation Mapper`가 대표적으로 사용되고 있습니다.

##### 어플리케이션 계층 구조
<p align="center"><img src="/images/java-persistence-api-1.JPG" width="45%"></p>

## 2. ORM(Object-Relation Mapping)

> 어플리케이션의 객체와 관계형 데이터베이스의 테이블을 자동으로 연결하는 행위

Object-Relation Mapping은 어플리케이션 설계와 데이터베이스 설계가 따로 이루어지면서 발생하는 객체 모델과 관계형 모델간의 불일치를 해소하기 위한 방법입니다. 
개발자가 너무 많은 SQL Mapping 작업에서 벗어나서 보다 더 객체 지향적인 프로그래밍(OOP, Object Oriented Programming)을 할 수 있도록 돕기 위한 방법입니다. 
ORM 프레임워크는 객체 간의 관계를 바탕으로 SQL을 자동으로 생성하고 이를 수행합니다. 

##### Object-Relation Mapping을 통한 객체, 테이블 연결
<p align="center"><img src="/images/java-persistence-api-2.JPG" width="70%"></p>

### 2.1. Object-Relation Mapping 장점
Object-Relation Mapping을 사용하는 경우 다음과 같은 장점이 있습니다.
- 객체 지향적 코드로 더 직관적인 프로그래밍이 가능합니다.
- 재사용 및 유지보수, 리팩토링의 편리성이 증가합니다.
- DBMS에 대한 종속성이 줄어듭니다.
- 프로그램 개발에 집중할 수 있습니다.

### 2.2. Object-Relation Mapping 단점
Object-Relation Mapping을 사용하는 경우 다음과 같은 단점이 있습니다.
- 모든 비즈니스를 Object-Relation Mapping만으로 완벽하게 구현하기 힘듭니다.
- 클래스, 애너테이션 등을 이용하여 테이블 설계를 해야하기 때문에 다소 러닝 커브가 존재합니다.
- 잘못된 엔티티 설계는 성능에 직접적인 영향을 미칩니다.

## 3. 그래서 JPA(Java Persistence API)란?
JPA(Java Persistence API)에 대해 설명하기 위해 관련된 여러 용어들을 정리해보았습니다. 
이 포스트가 JPA를 설명하는 글인지 혼동이 오기 시작합니다. 
여기에서 다시 위에 작성한 내용들을 바탕으로 JPA가 무엇인지 정리하고 글을 이어가겠습니다.
- JPA(Java Persistence API)
  - Object-Relation Mapping을 쉽게하기 위하여 Java에서 사용하는 인터페이스입니다.
  - 인테페이스이므로 구현체가 필요한데 대표적으로 사용되는 구현체는 Hibernate, OpenJPA 가 있습니다.
  - Hibernate는 Persistence 프레임워크이며, Persistence란 데이터를 영구히 저장한다는 특징을 의미합니다.
  - **객체 지향적인 프로그래밍을 통해 데이터를 영구적으로 보관, 관리할 수 있도록 만드는 Java 인터페이스 모음**

### 3.1. Spring Data Jpa
**<br>JPA, Hibernate까지 알겠는데 Spring Data Jpa는 뭐지?**
**Spring Data Jpa는 JPA를 사용하기 편하게 만들어 놓은 모듈입니다.** 
개발자는 이를 이용하여 JPA를 더 쉽고 편하게 사용할 수 있습니다. 
Spring Data Jpa 모듈은 JPA를 한 단계 추상화시킨 `Repository`라는 인터페이스를 제공합니다. 
개발자는 이를 확장(extends)한 인터페이스를 만들고 Naming 규칙에 맞도록 메소드를 선언하기만 하면 됩니다. 
Spring Data Jpa 모듈은 개발자가 만든 인터페이스를 @Bean으로 등록하고 해당 인터페이스의 메소드가 호출될 때 이를 SQL로 변환하여 수행합니다.

셋의 관계를 직관적으로 이해할 수 있도록 돕는 이미지를 [정다혜님 블로그][Dahye Jeong BlogLink]에서 가져왔습니다.

##### JPA / Hibernate / Spring Data Jpa 구조도

<p align="center"><img src="/images/java-persistence-api-3.JPG" width="45%"></p>
<center>이미지 출처, https://dahye-jeong.gitbook.io/spring/spring/2020-04-11-jpa-basic</center><br>

## CLOSING
글을 정리하다 보니 JPA를 처음 접했을 때 신선한 충격이 떠올랐습니다. 
쿼리를 작성하지 않고 Naming 규칙에 맞는 메소드 선언만으로 손쉽게 데이터를 가져오고, 클래스를 생성하여 테이블을 만들 수 있다는 점이 너무 놀라웠습니다. 

이후 프로젝트 진행상 급작스럽게 MyBatis로 변경하게 되면서 JPA가 얼마나 프로그래밍을 쉽게 만들어주는지 새삼 깨닫기도 했습니다. 
사이드 프로젝트를 진행했을 때 JPA가 제공하는 간단한 페이징 처리를 이용하여 쉽게 개발했던 일도 생각납니다. 
JPA는 언뜻 개발 과정을 쉽게 만들어주기 때문에 기능이 단순해보이지만 내부 기능을 세심하게 사용하기 위해선 많은 공부가 필요하다고 느끼고 있습니다.

#### REFERENCE
- <https://dahye-jeong.gitbook.io/spring/spring/2020-04-11-jpa-basic>
- <https://suhwan.dev/2019/02/24/jpa-vs-hibernate-vs-spring-data-jpa/>
- <https://gmlwjd9405.github.io/2019/08/03/reason-why-use-jpa.html>

[Dahye Jeong BlogLink]: https://dahye-jeong.gitbook.io/spring/spring/2020-04-11-jpa-basic