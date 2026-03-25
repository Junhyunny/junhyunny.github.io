---
title: "스프링(spring) 프레임워크에서 생성자 주입을 권장하는 이유"
search: false
category:
  - spring-boot
  - junit
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [스프링 프레임워크의 제어의 역전(IoC)과 의존성 주입(DI)][ioc-di-link]

## 1. Recommend of Constructor Injection in Spring

스프링(spring) 프레임워크에서 의존성을 주입받는 방법은 3가지가 있다.

- 세터 주입(Setter Injection)
- 생성자 주입(Constructor Injection)
- 메서드 주입(Method Injection)

스프링 공식 문서에는 아래와 같은 이유로 생성자 주입을 권장한다고 한다.

> **Spring Doc**<br/>
> The Spring team generally advocates constructor injection as it enables one to implement application components as immutable objects and to ensure that required dependencies are not null.
> Furthermore constructor-injected components are always returned to client (calling) code in a fully initialized state.
> As a side note, a large number of constructor arguments is a bad code smell, implying that the class likely has too many responsibilities and should be refactored to better address proper separation of concerns.

간단하게 정리해보면 이런 내용이다.

- 애플리케이션 컴포넌트를 불변(immutable) 객체로 사용 가능
- 객체가 널(null)이 아님을 보장
- 초기화 된 상태로 사용 가능
- 특정 클래스에 과도한 책임이 주어질 가능성이 높은 구린내 나는 코드에 대한 리팩토링 여지를 제공

이번 글에선 간단한 예시를 통해 생성자 주입을 사용하면 좋은 이유에 대해 살펴보겠다.

## 2. Field Injection and Constructor Injection

우선 두 가지 주입 방법을 비교해보겠다. 먼저 필드 인젝션(field injection) 방식을 살펴보자. 필드 주입은 `@Autowired` 애너테이션을 통해 빈(bean)을 주입받는 방식이다.

```java
@Service
public class PostService {

    @Autowired
    private PostRepository repo;

}
```

다음 생성자 주입(constructor injection) 방법을 살펴보자. 생성자 주입은 생성자를 통해 빈을 주입받는다. 해당 컴포넌트가 빈이고 생성자에 다른 의존성을 주입받기 위한 코드가 작성되어 있어야 한다.  애플리케이션 컨텍스트를 준비하는 과정에서 필요한 의존성들을 추적해나가면서 빈 객체들을 생성한다.

```java
@Service
public class PostService {

    private final PostRepository repo;

    public PostService(PostRepository repo) {
        this.repo = repo;
    }
}
```

## 3. Benefits of Constructor Injection

생성자 주입 방식을 사용하면 애플리케이션 컴포넌트를 불변(immutable) 객체로 사용 가능하다. 생성자 주입 방식을 통해서만 `final` 키워드가 붙은 멤버 변수를 통해 빈 객체를 주입받을 수 있다. 

다른 의존성 주입 방법들을 사용할 때 `final` 키워드가 붙은 멤버 변수를 사용하면 컴파일 에러가 발생한다. `final` 키워드가 붙은 필드는 다른 객체로 참조를 변경하는 것이 불가능하다. 이로 인해 발생할 수 있는 에러들이 사전에 방지된다.

아래 코드는 컴파일 에러가 발생한다.

```java
@Service
public class PostService {

    @Autowired
    private final PostRepository repo;

}
```

다음 장점으로 객체가 널(null)이 아님을 보장할 수 있다. `final` 키워드가 붙은 필드는 다른 객체를 참조할 수 없다. 생성자를 통해 주입받는 객체가 널(null)이 아닌 경우 `NullPointException`이 발생하지 않는다. 스프링 프레임워크는 필요한 빈 객체를 만들지 못하는 경우 서비스가 실행되지 않으므로 주입받는 객체가 널(null)이 아닌 것이 보장된다.

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

다음으로 하나의 클래스에 너무 많은 책임이 몰려있지 않은지 확인할 수 있다. ['생성자 주입을 @Autowired를 사용하는 필드 주입보다 권장하는 하는 이유' 글][kim-taeng-blog-link]을 참고하자면 생성자 주입을 사용하게 되는 경우 생성자의 인자가 많아짐에 따라 복잡한 코드가 됨을 쉽게 알 수 있고 리팩토링하여 역할을 분리하는 등과 같은 코드의 품질을 높이는 활동의 필요성을 더 쉽게 알 수 있다고 한다.

하나의 컴포넌트가 과도한 책임을 가질 경우 개발자는 생성자 주입을 통해 이를 체감할 수 있다. 아래 클래스를 보면 5개의 의존성이 필요한데, 이를 생성자를 통해 주입받으려하니 코드가 복잡해짐을 감지할 수 있다. 개발자는 이를 보고 리팩토링의 필요성을 느끼게 된다.

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

마지막으로 순환 참조(circular reference) 문제는 생성자 주입을 통해서만 감지할 수 있다. 순환 참조가 있는 객체 설계는 잘못된 설계일 확률이 높다. 생성자 주입을 통해 사전에 이를 방지하는 것이 좋다. 간단한 예시를 통해 확인해 보자.

아래 코드는 @Autowired 애너테이션을 사용해 필드 주입을 했다. AComponent 빈과 BComponent 빈은 서로를 참조하고 있다. 서비스 기동은 정상적으로 수행된다.

테스트 코드에서 AComponent 객체가 doThing 메서드를 호출한다. 내부에서 BComponent 객체의 doThing 메서드를 호출한다. 순환 참조로 인해 두 객체가 서로의 메서드를 지속적으로 호출하게 되면서 `StackOverflow` 예외가 발생한다.

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

다음과 같이 순환 참조로 인해 스택 오버플로우 에러가 발생한 것을 확인할 수 있다.

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

생성자 주입을 하면 서비스를 실행할 때 필요한 빈 객체들이 생성되는 시점에 순환 참조가 감지된다. 서비스는 실행되지 않고 종료된다.

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

위 코드를 실행하면 아래처럼 순환 참조로 인해 서비스 실행이 실패한다는 로그를 확인할 수 있다.

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

[참고한 글][kim-taeng-blog-link]의 내용에 따르자면 생성자 주입 방법은 필드 주입이나 세터 주입과 빈 객체를 주입하는 순서가 다르다고 한다. 생성자 주입이 순환 참조를 감지할 수 있는 이유가 정리되어 있다. 요약하자면 빈을 주입하는 시점이 다르기 때문인데, 스스로 이해할 수 있도록 이 부분을 다시 정리하였다.

필드 주입이나 세터 주입은 다음과 같은 순서를 따른다.

1. 모든 빈 객체들을 우선 만들고, `BeanFactory`에 등록한다.
2. A 객체에 필요한 빈(bean)들을 주입한다.

생성자 주입은 다음과 같은 순서를 따른다.

1. 클래스 A 객체 생성 시 생성자를 이용해 빈을 주입받는다. 이때 필요한 B 객체를 주입하려고 시도한다.
2. 필요한 B 객체는 존재하지 않으므로 이를 생성자로 만들려고 시도한다.
3. B 객체도 생성하는 시점에 A 객체가 필요하다.
4. 이 시점에 순환 참조가 감지된다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-03-28-reson-of-recommendation-to-use-constructor-injection>

#### REFERENCE

- <https://docs.spring.io/spring-framework/docs/4.2.x/spring-framework-reference/html/beans.html>
- <https://yaboong.github.io/spring/2019/08/29/why-field-injection-is-bad/>
- <https://madplay.github.io/post/why-constructor-injection-is-better-than-field-injection>

[ioc-di-link]: https://junhyunny.github.io/spring-boot/design-pattern/spring-ioc-di/
[kim-taeng-blog-link]: https://madplay.github.io/post/why-constructor-injection-is-better-than-field-injection
