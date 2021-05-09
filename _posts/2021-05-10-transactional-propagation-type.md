---
title: "Spring @Transactional And Propagtaion Type"
search: false
category:
  - spring-boot
  - jpa
  - junit
last_modified_at: 2021-05-10T00:00:00
---

<br>

기본적으로 트랜잭션은 [ACID 특징][transaction-acid-link]을 만족해야합니다. 
> 트랜잭션 ACID 특징 중 원자성(Atomic)<br>
> 트랜잭션의 작업이 부분적으로 실행되거나 중단되지 않는 것을 보장합니다.<br>
> All or Noting의 개념으로서 작업 단위의 일부분만 실행하지 않는다는 것을 의미합니다.

Spring Boot 프레임워크은 어플리케이션이 트랜잭션 원자성을 만족시킬 수 있도록 **`@Transactional`** 애너테이션을 제공합니다. 
**`@Transactional`** 애너테이션이 제공하는 기능과 트랜잭션 전파 타입(propagation type)에 대해 정리해보았습니다.  

## @Transactional 애너테이션
Spring 프레임워크는 AOP(Aspect Oriented Programming) 기능을 지원합니다. 
AOP 기능이란 특정 시점의 동작을 가로채어 해당하는 동작의 앞, 뒤로 필요한 기능을 수행하는 프로그래밍 방식입니다. 
Spring 프레임워크는 개발자가 트랜잭션에 대한 제어를 쉽게 처리할 수 있도록 AOP 기능과 애너테이션을 이용합니다. 

##### AOP 기능을 이용한 트랜잭션 처리 개념도
<p align="center"><img src="/images/transactional-propagation-type-1.JPG" width="80%"></p>

##### @Transactional 애너테이션 적용 메소드 호출 시 Call Stack
- 디버그를 통해 확인
<p align="center"><img src="/images/transactional-propagation-type-2.JPG" width="80%"></p>

주의할 사항으로 AOP 기능은 Spring 프레임워크에서 관리하는 빈(Bean)에게만 적용할 수 있습니다. 
new 키워드를 이용해 만든 객체의 메소드에 @Transactional 애너테이션이 붙어 있더라도 정상적으로 동작하지 않습니다. 
가능한 방법이 있는 듯 하지만 이번 포스트에서는 다루지 않겠습니다. 

##### 빈(Bean)이 아닌 객체 @Transactional 애너테이션 적용 시 
<p align="center"><img src="/images/transactional-propagation-type-3.JPG" width="80%"></p>

##### 빈(Bean)이 아닌 객체 @Transactional 애너테이션 적용 메소드 호출 시 Call Stack
- 디버그를 통해 확인
<p align="center"><img src="/images/transactional-propagation-type-4.JPG" width="80%"></p>

### @Transactional 애너테이션 적용 가능 위치
@Transactional 애너테이션을 살펴보면 @Target이 TYPE, METHOD 임을 확인할 수 있습니다. 
각 타입 별 적용 가능 범위입니다.
- ElementType.TYPE - Class, interface (including annotation type), or enum declaration
- ElementType.METHOD - Method declaration

메소드에 @Transactional 애너테이션을 적용하는 경우는 명확합니다. 
클래스에 적용하는 경우 모든 public 메소드에 적용되며, private, protected 메소드에는 적용되지 않습니다. 

> StackOverflow<br>
> Spring applies the class-level annotation to all public methods of this class that we did not annotate with @Transactional. 
> However, if we put the annotation on a private or protected method, Spring will ignore it without an error.

##### @Transactional 애너테이션 코드
```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface Transactional {
  ...
}
```

## 트랜잭션 전파 타입(Propagation Type)
트랜잭션의 전파 타입은 어떤 메소드에서 다른 메소드 호출 시 트랜잭션을 이어나갈 것인지에 대한 설정입니다. 
총 7개 존재하며 각 타입 별로 기능에 대해 정리하였습니다. 
- REQUIRED
  - Support a current transaction, create a new one if none exists.
  - 현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 새로 만듭니다.
- SUPPORTS
  - Support a current transaction, execute non-transactionally if none exists.
  - 현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 트랜잭션을 만들지 않습니다. 
- MANDATORY
  - Support a current transaction, throw an exception if none exists.
  - 현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 exception을 던집니다.
- REQUIRES_NEW
  - Create a new transaction, and suspend the current transaction if one exists.
  - 새로운 트랜잭션을 만듭니다. 진행 중인 트랜잭션이 있다면 이를 일시 중단합니다.
- NOT_SUPPORTED
  - Execute non-transactionally, suspend the current transaction if one exists.
  - 트랜잭션 없이 수행합니다. 진행 중인 트랜잭션이 있다면 이를 일시 중단합니다.
- NEVER
  - Execute non-transactionally, throw an exception if a transaction exists.
  - 트랜잭션 없이 수행합니다. 진행 중인 트랜잭션이 있다면 exception을 던집니다.
- NESTED
  - Execute within a nested transaction if a current transaction exists, behave like {@code REQUIRED} otherwise.
  - 현재 트랜잭션이 있으면 중첩 트랜잭션 내에서 실행하고, 그렇지 않으면 REQUIRED 처럼 동작합니다.

역시 글로만 정리하면 이해가 어렵습니다. 
각 전파 타입 별로 간단한 테스트 코드와 이미지를 이용해 이해도를 높혀보겠습니다. 
설명의 편이성을 위해 메소드 A 에서 메소드 B를 호출하는 경우 A 메소드를 부모, B 메소드를 자식으로 표현하였습니다. 
JpaRepository 인터페이스를 이용하여 테스트를 진행하였으며 다음과 같은 배경 지식이 필요합니다. 
- JpaRepository 인터페이스에서 제공하는 메소드는 @Transactional 애너테이션이 붙은채로 동작합니다.
- 부모 메소드에서 트랜잭션을 시작하지 않는 경우 바로 commit 됩니다. 

### REQUIRED
현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 새로 만듭니다. 
@Transactional 애너테이션 전파 타입의 디폴트 값입니다. 
부모 메소드에서 트랜잭션을 시작하였더라도 자식 메소드에서 exception이 발생한다면 전체 트랜잭션이 롤백됩니다. 
이는 동일한 트랜잭션으로 묶이기 때문입니다. 

<p align="center"><img src="/images/transactional-propagation-type-6.JPG" width="80%"></p>
<center>이미지 출처, https://www.nextree.co.kr/p3180/</center><br>

#### 부모 메소드 REQUIRED - 자식 메소드 REQUIRED
- 부모 메소드에서 데이터 INSERT
- 자식 메소드 호출 및 데이터 INSERT
- 자식 메소드 exception throw
- 롤백 여부 확인


#### 부모 메소드 X - 자식 메소드 REQUIRED
- 부모 메소드에서 데이터 INSERT
- 자식 메소드 호출 및 데이터 INSERT
- 자식 메소드 exception throw
- 롤백 여부 확인

### SUPPORTS
현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 트랜잭션을 만들지 않습니다. 
부모 메소드에서 트랜잭션을 시작하였다면 트랜잭션이 이어지지만 없다면 트랜잭션 없이 진행됩니다. 
자식 메소드에서 exception이 발생한다면 부모 메소드에서 실행한 트랜잭션이 있는지 여부에 따라 롤백 여부가 결정됩니다. 

<p align="center"><img src="/images/transactional-propagation-type-6.JPG" width="80%"></p>
<center>이미지 출처, https://www.nextree.co.kr/p3180/</center><br>

#### 부모 REQUIRED - 자식 SUPPORTS
- 부모 메소드에서 데이터 INSERT
- 자식 메소드 호출 및 데이터 INSERT
- 자식 메소드 exception throw
- 롤백 여부 확인


#### 부모 X - 자식 SUPPORTS
- 부모 메소드에서 데이터 INSERT
- 자식 메소드 호출 및 데이터 INSERT
- 자식 메소드 exception throw
- 롤백 여부 확인


### MANDATORY
현재 트랜잭션을 유지하고, 진행 중인 트랜잭션이 없으면 exception을 던집니다. 
부모 메소드에서 트랜잭션을 시작하였다면 트랜잭션이 이어지지만 없다면 exception을 전달합니다. 

<p align="center"><img src="/images/transactional-propagation-type-6.JPG" width="80%"></p>
<center>이미지 출처, https://www.nextree.co.kr/p3180/</center><br>

#### 부모 REQUIRED - 자식 MANDATORY
- 부모 메소드에서 데이터 INSERT
- 자식 메소드 호출 및 데이터 INSERT
- 자식 메소드 exception throw
- 롤백 여부 확인


#### 부모 X - 자식 MANDATORY
- 부모 메소드에서 데이터 INSERT
- 자식 메소드 호출 시 exception 발생 여부 확인
- 롤백 여부 확인


### REQUIRES_NEW
새로운 트랜잭션을 만듭니다. 진행 중인 트랜잭션이 있다면 이를 일시 중단합니다. 
부모 메소드에서 트랜잭션을 시작했더라도 자식 메소드는 별도의 트랜잭션으로 분리합니다. 
자식 메소드에서 발생하는 트랜잭션 롤백은 부모 메소드에서 시작한 트랜잭션과 상관이 없습니다. 

<p align="center"><img src="/images/transactional-propagation-type-6.JPG" width="80%"></p>
<center>이미지 출처, https://www.nextree.co.kr/p3180/</center><br>

#### 부모 REQUIRED - 자식 REQUIRES_NEW
- 부모 메소드에서 데이터 INSERT
- 자식 메소드 호출 및 데이터 
- 부모 메소드에서 수행한 내용이 보이는지 확인
- 자식 메소드 exception throw
- 롤백 여부 확인


### NOT_SUPPORTED
트랜잭션 없이 수행합니다. 진행 중인 트랜잭션이 있다면 이를 일시 중단합니다. 
부모 메소드에서 트랜잭션을 시작했더라도 자식 메소드에서는 트랜잭션 처리를 수행하지 않습니다. 

<p align="center"><img src="/images/transactional-propagation-type-6.JPG" width="80%"></p>
<center>이미지 출처, https://www.nextree.co.kr/p3180/</center><br>

#### 부모 REQUIRED - 자식 NOT_SUPPORTED
- 부모 메소드에서 데이터 INSERT
- 자식 메소드 호출 및 데이터 INSERT
- 자식 메소드 exception throw
- 롤백 여부 확인


### NEVER
부모 메소드에서 트랜잭션 시작했다면 자식 메소드에서 excepton이 발생합니다. 

<p align="center"><img src="/images/transactional-propagation-type-6.JPG" width="80%"></p>
<center>이미지 출처, https://www.nextree.co.kr/p3180/</center><br>

#### 부모 REQUIRED - 자식 NEVER
- 부모 메소드에서 데이터 INSERT
- 자식 메소드 호출 시 exception 발생 여부 확인
- 롤백 여부 확인

### NESTED
현재 트랜잭션이 있으면 중첩 트랜잭션 내에서 실행하고, 그렇지 않으면 REQUIRED 처럼 동작합니다. 
중첩된 트랜잭션을 지원하는 WAS에서만 사용이 가능합니다. 
부모 메소드에서 시작한 트랜잭션이 있으면, 자식 메소드에서 중첩된 트랜잭션을 실행합니다. 
자식 메소드에서 commit 되기 전까지 부모 메소드에서는 자식 메소드에서 처리하는 내용이 보이지 않습니다. 
자식 메소드의 트랜잭션은 자체적으로 commit, rollback이 가능합니다. 

<p align="center"><img src="/images/transactional-propagation-type-6.JPG" width="80%"></p>
<center>이미지 출처, https://www.nextree.co.kr/p3180/</center><br>

#### 부모 REQUIRED - 자식 NESTED
- 부모 메소드에서 데이터 INSERT
- 자식 메소드 호출 및 데이터 INSERT
- 부모 메소드에서 수행한 내용이 보이는지 확인
- 자식 메소드 exception throw
- 롤백 여부 확인

## OPINION
작성 중 입니다.

#### REFERENCE
- <https://www.nextree.co.kr/p3180/>
- <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/Propagation.html>
- <https://stackoverflow.com/questions/23132822/what-is-the-difference-between-defining-transactional-on-class-vs-method>

[transaction-acid-link]: https://junhyunny.github.io/information/transcation-acid/