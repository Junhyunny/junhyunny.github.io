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

## 2. Dependency Injection

`IoC` 원칙이 스프링의 의존성 주입(dependency injection)과 함께 언급되는 이유에 대해 알아보기 전에 우선 의존성(dependency)이 무엇인지 알아보겠습니다.

### 2.1. What is Dependency?

의존성이란 기능이 정상적으로 동작하기에 필요한 요소를 의미합니다.  

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
    <img src="/images/spring-ioc-di-1.JPG" width="45%" class="image__border">
</p>

### 2.2. Dependency Injection and Inversion of Control

의존성 주입이란 어떤 `객체A`가 정상적인 기능을 하기 위해  필요한 의존성을 주입해주는 것을 의미합니다. 
다만 개발자가 직접 생성한 객체를 넣어주는 것이 아닌 프레임워크에 의해 생성되고, 관리되는 객체를 주입 받습니다. 
결국 의존성 주입은 `IoC` 원칙을 따른 프레임워크의 개발 패턴(pattern)을 의미합니다. 

## 3. Practice

스프링 프레임워크는 `IoC` 원칙을 따르는 의존성 주입 패턴을 위해 다음과 같은 구조를 가집니다. 

* 스프링 프레임워크에서 관리하는 객체들은 빈(bean)이라고 합니다.
* 스프링 프레임워크는 다음과 같은 역할을 수행하는 `IoC` 컨테이너를 가지고 있습니다.
    * 스프링에서 관리하는 빈 객체들을 생성, 등록, 조회, 반환하는 등의 관리를 수행합니다. 
    * 의존성 주입(dependency injection)과 관련된 기능을 수행합니다.
* `BeanFactory`는 스프링 프레임워크의 핵심 `IoC` 컨테이너입니다.
* `ApplicationContext`는 `BeanFactory`를 확장한 `IoC` 컨테이너입니다.
* `IoC` 컨테이너는 의존성 주입을 수행하기 때문에 `DI` 컨테이너라고 합니다. 

### 3.1. Why do we need IoC principle?

`IoC` 원칙을 따르면 여러 장점들을 얻을 수 있다고 이야기하지만, 저는 다음 내용들이 가장 공감되었습니다.

* 객체 사이의 결합도(coupling)을 낮춘다.
* 코드 유지 보수하기 쉬워진다.

간단한 상황을 만들어 `IoC` 원칙이 어떤 문제점을 해결해주는지에 대해 이야기해보겠습니다. 

#### 3.1.1. DefaultDeliveryService 클래스

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

#### 3.1.2. Make Loose Coupling

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

#### 3.1.3. We need IoC Container

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
    <img src="/images/spring-ioc-di-2.JPG" width="100%" class="image__border">
</p>

### 3.2. Type of Dependency Injection

스프링 프레임워크는 다음과 같은 방법으로 의존성 주입 기능을 제공합니다.
특정 클래스의 객체가 빈으로써 관리되는 경우에만 적용되는 제약 사항이 있습니다. 

#### 3.2.1. Cosntructor Injection

* 생성자를 통해 의존성을 주입 받을 수 있습니다.
* 다른 의존성 주입 방법보다 안정적인 방법입니다.

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

#### 3.2.2. Setter Injection

* 세터(setter) 메소드를 통해 의존성을 주입 받을 수 있습니다.
* 세터 메소드 위에 `@Autowired` 애너테이션으로 추가합니다.

```java
package action.in.blog.service;

import action.in.blog.domain.Delivery;
import action.in.blog.store.DeliveryStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DefaultDeliveryService {

    private DeliveryStore deliveryStore;

    @Autowired
    public void setDeliveryService(DeliveryStore deliveryStore) {
        this.deliveryStore = deliveryStore;
    }

    public List<Delivery> getAllDeliveriesOrderByStartTime() {
        return deliveryStore.getAllDeliveriesOrderByStartTime();
    }
}
```

#### 3.2.3. Annotation Injection

* `@Autowired` 애너테이션을 필드 위에 추가합니다.

```java
package action.in.blog.service;

import action.in.blog.domain.Delivery;
import action.in.blog.store.DeliveryStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DefaultDeliveryService {

    @Autowired
    private DeliveryStore deliveryStore;

    public List<Delivery> getAllDeliveriesOrderByStartTime() {
        return deliveryStore.getAllDeliveriesOrderByStartTime();
    }
}
```

## CLOSING

해당 내용에 대해 공부하다보니 프레임워크에 대한 내용이라기보다는 소프트웨어 공학과 관련된 내용이라는 사실을 알게 되었습니다. 
포스트를 작성하면서 Spring 프레임워크보다는 소프트웨어 공학, 디자인 패턴에 대해 공부를 더 많이하였습니다. 
간단하다고 생각했던 개념이 엄청나게 많은 내용들을 품고 있어서 많이 당황했습니다. 
정리하고 싶은 내용들은 많았지만 글이 주제와 다르게 전개되거나 중간에 끊길까봐 내용을 줄여서 작성하였습니다. 
[제어의 역전(Inversion of Control, IoC) 이란?][IoC-link] 포스트에는 구체적인 예제 코드와 의존성 주입과 관련된 개념을 설명이 있어서 추천드립니다.

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-02-28-spring-ioc-di>

#### RECOMMEND NEXT POSTS 

* [생성자 주입(Constructor Injection) 방식을 권장하는 이유][reson-of-recommendation-to-use-constructor-injection-link]

#### REFERENCE

* <https://jongmin92.github.io/2018/02/11/Spring/spring-ioc-di/>
* <https://dotnettutorials.net/lesson/introduction-to-inversion-of-control/>
* <https://justhackem.wordpress.com/2016/05/13/dependency-inversion-terms/>
* [의존성이란?][dependency-link]
* [제어의 역전(Inversion of Control, IoC) 이란?][ioc-link]

[ioc-link]: https://develogs.tistory.com/19
[dependency-link]: https://velog.io/@huttels/%EC%9D%98%EC%A1%B4%EC%84%B1%EC%9D%B4%EB%9E%80
[reson-of-recommendation-to-use-constructor-injection-link]: https://junhyunny.github.io/spring-boot/junit/reson-of-recommendation-to-use-constructor-injection/