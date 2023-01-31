---
title: "생성자 주입(Constructor Injection) 방식을 권장하는 이유"
search: false
category:
  - spring-boot
  - junit
last_modified_at: 2021-08-24T02:00:00
---

<br>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Inversion of Control and Dependency Injection in Spring][ioc-di-link]

## 0. 들어가면서

Setter Injection, Constructor Injection, Method Injection 총 3개의 Inejection 방식이 존재하는데 Spring Doc에서는 아래와 같은 이유로 Constructor Injection 방식을 권장한다고 합니다. 

> **Spring Doc**<br>
> The Spring team generally advocates constructor injection as it enables one to implement application components as immutable objects 
> and to ensure that required dependencies are not null. 
> Furthermore constructor-injected components are always returned to client (calling) code in a fully initialized state. 
> As a side note, a large number of constructor arguments is a bad code smell, 
> implying that the class likely has too many responsibilities and should be refactored to better address proper separation of concerns.

간단하게 정리해보면 이런 내용입니다.
- 어플리케이션 컴포넌트를 immutable 객체로 사용 가능
- 객체가 null이 아님을 보장
- 초기화된 상태로 사용 가능
- 특정 클래스에 과도한 책임이 주어질 가능성이 높은 구린내 나는(?) 코드에 대한 리팩토링 여지를 제공

## 1. 필드 주입(Field Injection)
- 간단히 @Autowired 애너테이션을 통해 빈(bean)을 주입받는 방식입니다. 

```java
@Service
public class PostService {

    @Autowired
    private PostRepository repo;

}
```

## 2. 생성자 주입(Constructor Injection)
- 생성자를 통해 빈(bean)을 주입받습니다.

```java
@Service
public class PostService {

    private final PostRepository repo;

    public PostService(PostRepository repo) {
        this.repo = repo;
    }

}
```

## 3. 생성자 주입(Constructor Injection) 방식으로부터 얻는 이점

### 3.1. 불변성(Immutability)
**`'어플리케이션 컴포넌트를 immutable 객체로 사용 가능'`** 이라는 설명과 동일합니다. 
생성자 주입 방식을 통해서만 final 키워드가 붙은 멤버 변수를 이용해 빈(bean) 객체를 사용할 수 있습니다. 
Setter, Method, Field Injection 방식들의 경우 final 키워드 사용 시 모두 컴파일 에러가 발생합니다. 
final 키워드를 사용하면 클래스 내부에서 참조에 대한 변경이 이루어질 수 없기 때문에 참조 변경으로 인해 발생될 수 있는 에러들을 사전에 잡아낼 수 있습니다.

### 3.2. NullPointException 방지
**`'객체가 null이 아님을 보장'`** 이라는 설명과 동일합니다. 
final 키워드가 붙은 변수는 중간에 다른 객체를 참조할 수 없으므로 생성자를 통해 주입받는 객체가 null이 아님이 보장된다면 NullPointException 에러가 발생되지 않습니다. 

```java
@Component
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    public void method() {
        // 불가능 컴파일 에러
        // this.postService = null;
        this.postService.findById(1L);
    }
}
```

### 3.3. 클래스에 대한 과도한 책임 방지

> [생성자 주입을 @Autowired를 사용하는 필드 주입보다 권장하는 하는 이유][kim-taeng-blog-link]<br>
> 생성자 주입을 사용하게 되는 경우 생성자의 인자가 많아짐에 따라 복잡한 코드가 됨을 쉽게 알 수 있고 
> 리팩토링하여 역할을 분리하는 등과 같은 코드의 품질을 높이는 활동의 필요성을 더 쉽게 알 수 있다.

아래 클래스를 보면 생성자 주입 방식으로 인해 복잡해진 코드가 하나의 컴포넌트가 과도한 책임을 가졌다는 것을 알 수 있도록 만듭니다. 
이는 개발자로 하여금 리팩토링의 필요성을 느끼도록 할 수 있습니다. 

##### Constructor Injection 방식
```java
    @Component
    public class BadSmelledComponent {

        private final FirstComponent firstComponent;
        private final SecondComponent secondComponent;
        private final ThirdComponent thirdComponent;
        private final FourthComponent fourthComponent;
        private final FifthComponent fifthComponent;

        public BadSmelledComponent(FirstComponent firstComponent, 
                SecondComponent secondComponent,
                ThirdComponent thirdComponent,
                FourthComponent fourthComponent,
                FifthComponent fifthComponent) {

            this.firstComponent = firstComponent;
            this.secondComponent = secondComponent;
            this.thirdComponent = thirdComponent;
            this.fourthComponent = fourthComponent;
            this.fifthComponent = fifthComponent;
        }
    }
```

### 3.4. 순환 참조 방지
순환 참조 문제는 생성자 주입을 이용할 때 감지할 수 있습니다. 
순환 참조가 있는 객체 설계는 잘못된 설계이므로 생성자 주입을 통해 사전에 이를 방지하는 것이 좋습니다. 
아래 테스트 코드를 통해 확인해 보겠습니다. 

#### 3.4.1. 필드 주입 사용 시 순환 참조로 인한 StackOverflow 에러 발생 테스트
- 필드 주입을 사용하였습니다.
- AComponent 빈(bean)과 BComponent 빈(bean)은 서로를 참조하고 있습니다. 
- 서비스 기동은 정상적으로 수행됩니다.
- 테스트 코드에서 AComponent 객체가 doThing() 메소드를 호출합니다.
- 내부에서 BComponent 객체의 doThing() 메소드를 호출합니다.
- 서로 참조하는 두 객체가 서로의 메소드를 지속적으로 호출하니 StackOverflow 에러가 발생합니다.

```java
package blog.in.action.di.recycle;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.stereotype.Component;

@SpringBootTest
public class RecycleErrorTest {

    @Autowired
    AComponent aComponent;

    @Test
    public void test() {
        aComponent.doThing();
    }
}

@Component
class AComponent {

    @Autowired
    BComponent bComponent;

    void doThing() {
        bComponent.doThing();
    }
}

@Component
class BComponent {

    @Autowired
    AComponent aComponent;

    void doThing() {
        aComponent.doThing();
    }
}
```

##### StackOverflow 에러 발생 로그

```
java.lang.StackOverflowError
    at blog.in.action.di.recycle.BComponent.doThing(RecycleErrorTest.java:38)
    at blog.in.action.di.recycle.AComponent.doThing(RecycleErrorTest.java:27)
    at blog.in.action.di.recycle.BComponent.doThing(RecycleErrorTest.java:38)
    at blog.in.action.di.recycle.AComponent.doThing(RecycleErrorTest.java:27)
    at blog.in.action.di.recycle.BComponent.doThing(RecycleErrorTest.java:38)
    at blog.in.action.di.recycle.AComponent.doThing(RecycleErrorTest.java:27)
    at blog.in.action.di.recycle.BComponent.doThing(RecycleErrorTest.java:38)
    at blog.in.action.di.recycle.AComponent.doThing(RecycleErrorTest.java:27)
    at blog.in.action.di.recycle.BComponent.doThing(RecycleErrorTest.java:38)
    at blog.in.action.di.recycle.AComponent.doThing(RecycleErrorTest.java:27)
    at blog.in.action.di.recycle.BComponent.doThing(RecycleErrorTest.java:38)
    ...
```

#### 3.4.2. 생성자 주입 사용 시 순환 참조 에러 확인 테스트
- 생성자 주입을 사용하였습니다.
- 서비스가 기동되면서 객체를 생성하는 시점에 순환 참조가 감지되어 서비스가 종료됩니다.

```java
package blog.in.action.di.recycle;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.stereotype.Component;

@SpringBootTest
public class RecycleCatchTest {

    @Autowired
    CComponent cComponent;

    @Test
    public void test() {
        cComponent.doThing();
    }
}

@Component
class CComponent {

    final DComponent dComponent;

    public CComponent(DComponent dComponent) {
        this.dComponent = dComponent;
    }

    void doThing() {
        dComponent.doThing();
    }
}

@Component
class DComponent {

    final CComponent cComponent;

    public DComponent(CComponent cComponent) {
        this.cComponent = cComponent;
    }

    void doThing() {
        cComponent.doThing();
    }
}
```

##### 서비스 기동시 에러 로그

```
Error starting ApplicationContext. To display the conditions report re-run your application with 'debug' enabled.
2021-08-24 01:51:55.105 ERROR 984 --- [           main] o.s.b.d.LoggingFailureAnalysisReporter   : 

***************************
APPLICATION FAILED TO START
***************************

Description:

The dependencies of some of the beans in the application context form a cycle:

┌─────┐
|  CComponent defined in file [D:\workspace\blog\blog-in-action\2021-03-28-reson-of-recommendation-to-use-constructor-injection\action-in-blog\target\test-classes\blog\in\action\di\recycle\CComponent.class]
↑     ↓
|  DComponent defined in file [D:\workspace\blog\blog-in-action\2021-03-28-reson-of-recommendation-to-use-constructor-injection\action-in-blog\target\test-classes\blog\in\action\di\recycle\DComponent.class]
└─────┘


2021-08-24 01:51:55.109 ERROR 984 --- [           main] o.s.test.context.TestContextManager      : Caught exception while allowing TestExecutionListener [org.springframework.test.context.web.ServletTestExecutionListener@db57326] to prepare test instance [blog.in.action.di.recycle.RecycleCatchTest@17b6d426]

java.lang.IllegalStateException: Failed to load ApplicationContext
    at org.springframework.test.context.cache.DefaultCacheAwareContextLoaderDelegate.loadContext(DefaultCacheAwareContextLoaderDelegate.java:132) ~[spring-test-5.2.6.RELEASE.jar:5.2.6.RELEASE]
    at org.springframework.test.context.support.DefaultTestContext.getApplicationContext(DefaultTestContext.java:123) ~[spring-test-5.2.6.RELEASE.jar:5.2.6.RELEASE]
    at org.springframework.test.context.web.ServletTestExecutionListener.setUpRequestContextIfNecessary(ServletTestExecutionListener.java:190) ~[spring-test-5.2.6.RELEASE.jar:5.2.6.RELEASE]
```

#### 3.4.3. 생성자 주입의 경우 순환 참조가 감지되는 이유

> [생성자 주입을 @Autowired를 사용하는 필드 주입보다 권장하는 하는 이유][kim-taeng-blog-link]<br>
> 생성자 주입 방법은 필드 주입이나 수정자 주입과는 빈(bean)을 주입하는 순서가 다르다.<br>

KimTaeng 님 블로그의 글을 읽어보면 생성자 주입은 빈(bean)을 주입하는 순서가 달라서 순환 참조가 감지된다는 점을 정리해놓은 부분이 있습니다. 
제 스스로 이해하기 쉽도록 이 부분을 다시 정리해보았습니다. 

##### 수정자 주입(Setter Injection), 필드 주입(Field Injection) 방식
1. 모든 빈(bean)을 우선 만들고 BeanFactory에 등록합니다.
1. 빈(bean)을 주입 받아야 하는 A 객체에 필요한 빈(bean)들을 주입합니다.

##### 생성자 주입(Constructor Injection) 방식
1. 클래스 A 빈(bean) 생성시 생성자를 이용하며 이때 필요한 빈(bean)인 B 객체를 주입하려고 시도합니다.
1. 필요한 B 객체는 존재하지 않으므로 이를 생성자로 만들려고 시도합니다.
1. B 객체도 생성하는 시점에 A 객체가 필요합니다.
1. 순환 참조가 감지됩니다.

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-03-28-reson-of-recommendation-to-use-constructor-injection>

#### REFERENCE
- <https://docs.spring.io/spring-framework/docs/4.2.x/spring-framework-reference/html/beans.html>
- <https://yaboong.github.io/spring/2019/08/29/why-field-injection-is-bad/>
- <https://madplay.github.io/post/why-constructor-injection-is-better-than-field-injection>

[ioc-di-link]: https://junhyunny.github.io/spring-boot/design-pattern/spring-ioc-di/
[kim-taeng-blog-link]: https://madplay.github.io/post/why-constructor-injection-is-better-than-field-injection
