---
title: "Inversion of Control and Dependency Injection in Spring"
search: false
category:
  - spring-boot
  - design-pattern
last_modified_at: 2021-08-22T17:00:00
---

<br>

## 0. 들어가면서

스프링(spring)을 사용하거나 공부하면 반드시 만나는 개념이 있습니다. 

* 제어의 역전(Inversion of Control)
* 의존성 주입(Dependency Injection)

이 두 개념이 무엇인지 정리하고, 어떤 연관성이 있는지 정리해보았습니다. 

## 1. Inversion of Control 

> Inversion of Control is a principle in software engineering which transfers the control of objects or portions of a program to a container or framework.

객체(object) 생성, 사용, 제거 등의 제어를 개발자가 직접하는 것이 아니라 컨테이너(container) 혹은 프레임워크(framework)에서 수행하자는 소프트웨어 공학의 원칙(principle)입니다. 
스프링 프레임워크는 `IoC` 원칙을 지킬 수 있도록 설계되어 있습니다. 
라이브러리처럼 개발자가 작성한 코드에서 호출하여 사용하는 방식이 아닙니다. 
프레임워크에서 개발자가 작성한 코드를 실행시켜줌으로써 시스템 흐름 제어의 주도권을 프레임워크가 가져갑니다. 

다음과 같은 구조를 가집니다. 

* 스프링 프레임워크에서 관리하는 객체들은 빈(bean)이라고 합니다.
* 스프링 프레임워크는 다음과 같은 역할을 수행하는 `IoC` 컨테이너를 가지고 있습니다.
    * 스프링에서 관리하는 빈 객체들을 생성, 등록, 조회, 반환하는 등의 관리를 수행합니다. 
    * 의존성 주입(dependency injection)과 관련된 기능을 수행합니다.
* `BeanFactory`는 스프링 프레임워크의 핵심 IoC 컨테이너입니다.
* `ApplicationContext`는 `BeanFactory`를 확장한 IoC 컨테이너입니다.
* `IoC` 컨테이너는 의존성 주입을 수행하기 때문에 `DI` 컨테이너라고 합니다. 

### 1.1. Why do we need IoC?

제어의 역전 원칙을 따랐을 때 여러 가지 장점을에 대해 이야기하지만, 다음 내용들이 가장 공감되었습니다.

* 객체 사이의 결합도(coupling)을 낮춘다.
* 코드 유지 보수하기 쉬워진다.

간단한 상황을 만들어 `IoC` 원칙이 어떤 문제점을 해결해주는지에 대해 이야기해보겠습니다. 

#### 1.1.1. DefaultDeliveryService 클래스

아래 코드는 다음과 같은 문제점을 가집니다. 

* 현재 `MyBatisDeliveryStore` 객체는 내부에서 `MyBatis` 프레임워크를 사용해 데이터를 조회하고 있습니다. 
* 만약 시간이 지나 `JPA`, `QueryDSL` 같은 기술 스택을 사용하게 된다면 `MyBatis`는 사용하지 못 합니다.
    * `MyBatisDeliveryStore` 객체 대신 `JpaDeliveryStore` 객체로 대체되어야 합니다. 
* 이는 필연적으로 `DefaultDeliveryService` 클래스의 변경을 발생시킵니다.
* `DefaultDeliveryService` 객체는 `MyBatisDeliveryStore` 객체와 강하게 결합되어 있습니다.
* `MyBatisDeliveryStore` 객체를 다른 곳에서도 사용한다면 모두 변경이 발생합니다. 

```java
package action.in.blog.service;

import action.in.blog.domain.Delivery;
import action.in.blog.store.MyBatisDeliveryStore;

import java.util.List;

public class DefaultDeliveryService {

    private final MyBatisDeliveryStore deliveryStore;

    public DefaultDeliveryService() {
        this.deliveryStore = new MyBatisDeliveryStore();
    }

    public List<Delivery> getAllDeliveriesOrderByStartTime() {
        return deliveryStore.getAllDeliveriesOrderByStartTime();
    }
}
```

#### 1.1.2. Make Loose Coupling

`DeliveryStore` 인터페이스를 만들어 `MyBatisDeliveryStore`, `DefaultDeliveryService` 둘 사이의 결합도를 낮춰줍니다. 

```java
package action.in.blog.store;

import action.in.blog.domain.Delivery;

import java.util.List;

public interface DeliveryStore {
    List<Delivery> getAllDeliveriesOrderByStartTime();
}
```

* `MyBatisDeliveryStore` 클래스가 `DeliveryStore` 인터페이스 기능을 구현하는 모습으로 변경합니다.

```java
package action.in.blog.store;

import action.in.blog.domain.Delivery;

import java.util.Collections;
import java.util.List;

public class MyBatisDeliveryStore implements DeliveryStore {

    @Override
    public List<Delivery> getAllDeliveriesOrderByStartTime() {
        // some queries here
        return Collections.emptyList();
    }
}
```

* 멤버 변수 타입을 `DeliveryStore` 인터페이스 타입으로 대체합니다.
* `MyBatisDeliveryStore` 객체를 직접 생성하는 코드를 생성자를 통해 외부에서 전달받는 방식으로 변경합니다.
* 이로써 데이터를 조회하는 프레임워크나 방법이 어떻게 바뀌더라도 `DefaultDeliveryService` 클래스의 변경은 발생하지 않습니다.

```java
package action.in.blog.service;

import action.in.blog.domain.Delivery;
import action.in.blog.store.DeliveryStore;

import java.util.List;

public class DefaultDeliveryService {

    private final DeliveryStore deliveryStore;

    public DefaultDeliveryService(DeliveryStore deliveryStore) {
        this.deliveryStore = deliveryStore;
    }

    public List<Delivery> getAllDeliveriesOrderByStartTime() {
        return deliveryStore.getAllDeliveriesOrderByStartTime();
    }
}
```

#### 1.1.3. We need IoC Container

시스템에서 `DefaultDeliveryService` 객체를 사용하는 곳의 코드를 다음과 같이 변경해줘야 합니다.

* `DefaultDeliveryService` 객체를 시스템 곳곳에서 사용하고 있다면 코드 변경이 여러 군데서 발생합니다.
* `MyBatisDeliveryStore` 객체를 대체하는 작업이 시스템 여러 곳의 코드 변경을 일으키고, 영향을 줍니다. 

```java
    public static void main(String[] args) {

        // DefaultDeliveryService deliveryService = new DefaultDeliveryService(new MyBatisDeliveryStore());
        DefaultDeliveryService deliveryService = new DefaultDeliveryService(new JpaDeliveryStore());
        deliveryService.getAllDeliveriesOrderByStartTime();

        // ... some business logic
    }
```

이 문제점을 `IoC` 컨테이너를 통해 해결할 수 있습니다. 
`DefaultDeliveryService`, `JpaDeliveryStore` 클래스를 다음과 같이 변경합니다. 

* `DefaultDeliveryService` 클래스에 `@Service` 애너테이션을 추가합니다.
* `JpaDeliveryStore` 클래스에 `@Repository` 애너테이션을 추가합니다.
* `@Service`, `@Repository` 애너테이션을 붙히면 각 클래스의 객체들이 빈으로써 `IoC` 컨테이너에서 관리됩니다.
* 각 빈 객체들은 `IoC` 컨테이너에 의해 필요한 곳으로 주입됩니다. 
    * `DefaultDeliveryService` 객체를 사용하는 곳도 빈으로 주입 받을 수 있도록 변경합니다.
* 기술이나 로직(logic)이 바뀜에 따라 `DeliveryService` 구현체 클래스가 변경되더라도 시스템 다른 곳의 코드는 크게 바뀌지 않습니다.

```java
package action.in.blog.service;

import action.in.blog.domain.Delivery;
import action.in.blog.store.DeliveryStore;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DefaultDeliveryService {

    private final DeliveryStore deliveryStore;

    public DefaultDeliveryService(DeliveryStore deliveryStore) {
        this.deliveryStore = deliveryStore;
    }

    public List<Delivery> getAllDeliveriesOrderByStartTime() {
        return deliveryStore.getAllDeliveriesOrderByStartTime();
    }
}
```

```java
package action.in.blog.store;

import action.in.blog.domain.Delivery;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.List;

@Repository
public class JpaDeliveryStore implements DeliveryStore {

    @Override
    public List<Delivery> getAllDeliveriesOrderByStartTime() {
        // some queries here
        return Collections.emptyList();
    }
}
```

##### Dependency Injection by IoC Container

* `IoC` 컨테이너는 자신이 관리하고 있는 빈들의 의존 관계를 따라 필요한 곳에 빈 객체들을 주입합니다.
* 만들어진 빈 객체가 없다면 새로 만들어 주입합니다.
* 빈 객체를 만들기 위한 후보 클래스가 없다면 에러가 발생합니다.

<p align="center">
    <img src="/images/spring-ioc-di-1.JPG" width="100%" class="image__border">
</p>

## 2. Dependency Injection

위에선 스프링 프레임워크는 `IoC` 컨테이너를 통해 객체들을 생성하고 적절한 위치에 주입해주는 것에 대해 다뤘습니다. 
여기서 말하는 `"적절한 위치"`는 어디일까요. 
객체를 주입 받는 적절한 위치에 대해 이야기 전에 의존성(dependency)에 대해 알아보겠습니다. 

### 2.1. What is Dependency?

* 어떤 `클래스A`가 다른 `클래스B` 또는 `인터페이스B`를 이용할 때 `클래스A`가 `클래스(인터페이스)B`에 의존한다고 합니다.
* `클래스A`는 `클래스(인터페이스)B`에 의존적(dependent)이고, `클래스(인터페이스)B`는 `클래스A`의 의존성(dependency)입니다.
* `클래스A`는 `클래스(인터페이스)B` 없이 작동할 수 없습니다.
* `클래스(인터페이스)B`에 변화에 `클래스A`는 영향을 받지만, `클래스A`의 변화에 `클래스(인터페이스)B`는 영향을 받지 않는다.

##### Example Code

다음과 같은 코드로 표현할 수 있습니다.

* `클래스A`는 `클래스B`에 의존적입니다. 
* `클래스B`는 `클래스A`의 의존성입니다.

```java
class A {
    
    private B b;

    public A () {
        this.b = new B();
    }
}
```

##### Class Diagram

<p align="center">
    <img src="/images/spring-ioc-di-2.JPG" width="65%" class="image__border">
</p>

### 2.2. Dependency Injection

의존성 객체를 주입 받는 적절한 위치는 개발자에 의해 정의됩니다. 

스프링 프레임워크에서 의존성 주입

<!-- ## 2. Dependency Injection


### 2.1. 의존성 주입(DI, Dependency Injection)

> IoC를 구현한 **디자인 패턴**으로 객체 간의 의존성이 외부에 의해 선택되는 방식을 의미<br>
> Dependency injection is a pattern we can use to implement IoC, where the control being inverted is setting an object's dependencies.

의존성 주입이란 **`'클래스 A에서 사용할 클래스(인터페이스) B를 외부로부터 전달받는다.'`** 라고 정리할 수 있겠습니다. 
이는 클래스 A에서 사용할 클래스(인터페이스) B를 개발자가 생성하여 직접 이어주지 않는다는 의미인데 이를 코드로 작성해보면 더 직관적인 이해가 가능합니다.

##### 의존성 주입이 아닌 코드

```java
class A {
    
    private B b;

    // 필요한 객체 B 객체를 직접 만들어 사용
    public A () {
        this.b = new B();
    }
}
```

##### 의존성 주입인 코드

```java
class A {
    
    private B b;

    // 외부에서 A 객체에게 B 객체를 전달
    public A (B b) {
        this.b = b;
    }
}
```

## 3. 제어의 역전, 의존성 주입 그리고 프레임워크

- 제어의 역전(IoC)은 소프트웨어 공학의 원칙(principle)으로써 하나의 컨셉 혹은 가이드 라인입니다.
- 의존성 주입(DI)은 IoC 원칙를 구현한 디자인 패턴으로써 외부의 제어를 통해 의존성을 주입받는 프로그래밍 방식입니다. 
- IoC Containers는 IoC 개념이 적용된 프로그램(혹은 객체)으로써 프레임워크에서 이를 사용합니다.

<p align="center"><img src="/images/spring-ioc-di-1.JPG" width="550"></p>
<center>https://dotnettutorials.net/lesson/introduction-to-inversion-of-control/</center>

## 4. Spring 프레임워크와 IoC 원칙
전통적인 프로그래밍은 개발자가 작성한 코드에서 라이브러리를 호출하는 방식이었습니다. 
또한 `main`이라는 큰 흐름에서 개발자가 필요한 객체들을 생성하고, 이들을 서로 연결해주는 방식으로 프로그래밍이 전개되었습니다. 
**반대로 IoC 원칙이 적용된 프레임워크에선 개발자가 구현한 코드가 프레임워크에 의해 흐름 제어를 받습니다.** 

그렇다면 Spring 프레임워크에서는 프로그래머가 작성한 코드를 어떻게 프레임워크에게 전달할 수 있을까요? 
1. 프레임워크에서 제공하는 특정 인터페이스, 추상 클래스를 구현한다.
1. 개발자가 작성한 클래스가 필요한 곳에서 주입받아 사용될 수 있도록 IoC 컨테이너에 빈(bean)으로 등록한다.

### 4.1. Spring IoC Container
IoC 컨테이너는 Spring 프레임워크에서 사용하는 객체입니다. 
IoC 라는 용어는 매우 느슨하기 정의되어 폭 넓게 사용되기 때문에 Spring 프레임워크의 기능을 명확하게 설명하지는 못합니다. 
이에 의도를 명확히 드러내고자 Spring 프레임워크에서 제공하는 IoC 방식의 핵심인 `의존성 주입(DI, Dependency Injection)`의 영문 약자를 사용하여 DI 컨테이너라고 부르기도 합니다. 

Spring 프레임워크에서 사용하는 IoC 컨테이너는 다음과 같습니다. 
- BeanFactory
  - Spring 프레임워크의 핵심 IoC Container
  - 빈(bean) 객체를 생성, 등록, 조회, 반환하는 등의 관리를 수행합니다.
  - 의존성 주입과 관련된 기능을 수행합니다.

- ApplicationContext
  - BeanFactory를 확장한 IoC Container
  - BeanFactory 인터페이스를 상속받아 BeanFactory의 기능을 제공합니다.
  - 추가적으로 다른 기능들도 함께 제공합니다.

#### 4.1.1. 디버깅을 통해 발견한 몇 가지 사실
IoC 컨테이너인 두 객체의 차이점을 확인하기 위해 간단히 디버깅해보았으며 아래와 같은 사실들을 확인하였습니다.
- 별도의 설정 없이 만들어진 ApplicationContext의 구현체는 GenericWebApplicationContext 클래스
- ApplicationContext 내부 BeanFactory 객체의 주소와 주입 받은 BeanFactory 객체의 주소가 동일
- ApplicationContext 인터페이스는 BeanFactory 인터페이스를 상속 받았기 때문에 ApplicationContext의 구현체는 BeanFactory의 기능들을 모두 제공
- GenericWebApplicationContext 클래스는 BeanFactory 인터페이스의 기능을 멤버 변수인 BeanFactory 객체에게 모두 위임(delegate)

<p align="left"><img src="/images/spring-ioc-di-2.JPG" width="450"></p>

<p align="left"><img src="/images/spring-ioc-di-3.JPG" width="450"></p>

### 4.2. IoC 컨테이너에 빈(bean) 등록하기
IoC 컨테이너에 대해 알아봤으니 이번엔 빈(bean)에 대해 알아보도록 하겠습니다. 
**IoC 컨테이너가 관리하는 객체를 빈(bean) 이라고 합니다.** 
개발자가 작성한 클래스가 빈(bean)으로 등록되면 IoC 컨테이너에 의해 관리되고 필요한 곳에서 사용되어집니다. 

개발자가 작성한 클래스를 빈(bean)으로 등록하는 방법은 다음과 같습니다. (Spring Boot 기준)
- @Component, @Repository, @Service, @Controller, @Configuration 애너테이션 사용
  - 클래스에 @Component 애너테이션이 붙은 경우 빈(bean)으로 등록됩니다.
  - @Repository, @service, @Controller는 역할 구분을 위해 @Component를 재정의한 것입니다.
  - @Repository, @Service, @Controller, @Configuration 애너테이션들 상단에는 @Component 애너테이션이 붙어있습니다.

#### 4.2.1. @Repository 애너테이션

```java
/*
 * ...
 */

package org.springframework.stereotype;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.core.annotation.AliasFor;

/**
 * ...
 */
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component
public @interface Repository {

    /**
     * ...
     */
    @AliasFor(annotation = Component.class)
    String value() default "";

}
```

#### 4.2.2. @Configruation, @Bean 애너테이션 사용 예제 코드
- @Configruation, @Bean 애너테이션 사용
  - @Configuration 애너테이션이 붙은 클래스 내부에 @Bean 애너테이션을 붙힌 메소드들을 선언해줍니다.
  - 메소드에서 반환하는 객체가 메소드의 이름을 가진 빈(bean)으로 등록됩니다.

```java
package blog.in.action.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class Config {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.addAllowedOrigin("http://localhost:8080");
        corsConfiguration.addAllowedHeader("*");
        corsConfiguration.addAllowedMethod("*");
        corsConfiguration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);
        return source;
    }
}
```

### 4.3. IoC 컨테이너로부터 의존성 주입받기

IoC 컨테이너에 빈(bean)으로 등록된 객체들을 의존성 주입을 통해 전달받는 방법에 대해 알아보도록 하겠습니다. 
Spring Boot 프레임워크를 기준으로 작성하였습니다. 

#### 4.3.1. Setter Injection

- 의존 관계의 객체를 전달 받을 수 있는 setter 메소드를 만듭니다.
- setter 메소드 위에 @Autowired 애너테이션을 명시합니다.

```java
package blog.in.action.di;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.stereotype.Component;

import blog.in.action.domain.member.MemberService;
import lombok.extern.log4j.Log4j2;

@SpringBootTest
public class SetterDependencyInjectionTest {

    @Autowired
    private SetterInjectionClass setterInjectionClass;

    @Test
    public void test() {
        assertTrue(setterInjectionClass != null);
        assertTrue(setterInjectionClass.getMemberService() != null);
    }
}

@Log4j2
@Component
class SetterInjectionClass {

    private MemberService memberService;

    public MemberService getMemberService() {
        return memberService;
    }

    @Autowired
    public void setMemberService(MemberService memberService) {
        log.info("setter dependency injection");
        this.memberService = memberService;
    }
}
```

#### 4.3.2. Constructor Injection

- 권장되는 방식의 의존성 주입 방법입니다. 
- 의존 관계의 객체를 전달 받을 수 있는 생성자를 만듭니다.

```java
package blog.in.action.di;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.stereotype.Component;

import blog.in.action.domain.member.MemberService;
import lombok.extern.log4j.Log4j2;

@SpringBootTest
public class ConstructorDependencyInjectionTest {

    @Autowired
    private ConstructorInjectionClass constructorInjectionClass;

    @Test
    public void test() {
        assertTrue(constructorInjectionClass != null);
        assertTrue(constructorInjectionClass.getMemberService() != null);
    }
}

@Log4j2
@Component
class ConstructorInjectionClass {

    private final MemberService memberService;

    public ConstructorInjectionClass(MemberService memberService) {
        log.info("constructor dependency injection");
        this.memberService = memberService;
    }

    public MemberService getMemberService() {
        return memberService;
    }
}
```

#### 4.3.3. Method Injection

- 의존 관계의 객체를 전달 받을 수 있는 일반 메소드를 만듭니다.
- 일반 메소드 위에 @Autowired 애너테이션을 명시합니다.

```java
package blog.in.action.di;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.stereotype.Component;

import blog.in.action.domain.member.MemberService;
import lombok.extern.log4j.Log4j2;

@SpringBootTest
public class MethodDependencyInjectionTest {

    @Autowired
    private MethodInjectionClass methodInjectionClass;

    @Test
    public void test() {
        assertTrue(methodInjectionClass != null);
        assertTrue(methodInjectionClass.getMemberService() != null);
    }
}

@Log4j2
@Component
class MethodInjectionClass {

    private MemberService memberService;

    public MemberService getMemberService() {
        return memberService;
    }

    @Autowired
    private void method(MemberService memberService) {
        log.info("method dependency injection");
        this.memberService = memberService;
    }
}
``` -->

<!-- ## CLOSING

해당 내용에 대해 공부하다보니 프레임워크에 대한 내용이라기보다는 소프트웨어 공학과 관련된 내용이라는 사실을 알게 되었습니다. 
포스트를 작성하면서 Spring 프레임워크보다는 소프트웨어 공학, 디자인 패턴에 대해 공부를 더 많이하였습니다. 
간단하다고 생각했던 개념이 엄청나게 많은 내용들을 품고 있어서 많이 당황했습니다. 
정리하고 싶은 내용들은 많았지만 글이 주제와 다르게 전개되거나 중간에 끊길까봐 내용을 줄여서 작성하였습니다. 
[제어의 역전(Inversion of Control, IoC) 이란?][IoC-link] 포스트에는 구체적인 예제 코드와 의존성 주입과 관련된 개념을 설명이 있어서 추천드립니다.  -->

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-02-28-spring-ioc-di>

<!-- #### RECOMMEND NEXT POSTS -->

#### REFERENCE

* <https://jongmin92.github.io/2018/02/11/Spring/spring-ioc-di/>
* <https://dotnettutorials.net/lesson/introduction-to-inversion-of-control/>
* <https://justhackem.wordpress.com/2016/05/13/dependency-inversion-terms/>
* [의존성이란?][dependency-link]
* [제어의 역전(Inversion of Control, IoC) 이란?][ioc-link]

[ioc-link]: https://develogs.tistory.com/19
[dependency-link]: https://velog.io/@huttels/%EC%9D%98%EC%A1%B4%EC%84%B1%EC%9D%B4%EB%9E%80