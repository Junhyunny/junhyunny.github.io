---
title: "Dynamic Proxy in Java"
search: false
category:
  - java
last_modified_at: 2023-09-16T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Proxy Pattern][proxy-pattern-link]

## 1. Proxy Pattern

프록시 패턴(proxy pattern)을 사용하면 특정 구현 클래스를 직접 변경하지 않고도 기능을 확장할 수 있습니다. 

* 특정 객체의 대리인 역할을 수행하며 외부 요청을 대신 받아줍니다.
* 특정 객체의 실제 기능이 수행되기 전이나 후에 필요한 로직을 추가적으로 처리할 수 있습니다.
    * 특정 클래스의 메소드를 직접 변경하지 않고 기능을 확장할 수 있습니다.
    * 프록시 객체의 확장된 기능으로 실제 객체 로직 수행 결과가 바뀌면 안 됩니다.

다음과 같은 구조를 가집니다. 

* 클라이언트(Client)
    * Subject 인터페이스의 구현체가 제공하는 기능을 사용하는 객체입니다.
* 주체(Subject)
    * 제공해야하는 어떤 기능들을 명시해놓은 인터페이스입니다.
    * Proxy 객체나 RealSubject 객체는 주체 인터페이스를 확장합니다.
* 프록시(Proxy)
    * Client 객체의 요청을 대신 받아주는 객체입니다.
    * 전달받은 요청을 RealSubject 객체에게 전달합니다.
    * RealSubject 객체가 일을 수행하기 전이나 후에 필요한 로직을 처리합니다.
* 실제 주체(RealSubject)
    * 인터페이스에서 명시한 기능을 실제로 처리하는 객체입니다.

<p align="center">
    <img src="/images/dynamic-proxy-in-java-1.JPG" width="80%" class="image__border image__padding">
</p>
<center>https://en.wikipedia.org/wiki/Proxy_pattern</center>

## 2. Dynamic Proxy in Java

Java는 어플리케이션 런타임에 필요한 프록시 객체를 동적으로 생성할 수 있는 API를 `리플렉트(reflect)` 패키지를 통해 제공합니다. 
개발자는 프록시 객체가 필요한 경우 클래스를 직접 작성할 필요가 없습니다. 
프록시 기능이 필요한 인터페이스마다 모두 프록시 클래스를 구현해야하는 정적인 방법보다 프로젝트의 복잡도를 낮출 수 있습니다. 

### 2.1. newProxyInstance method in Proxy Class

JDK 리플렉트 패키지의 Proxy 클래스 안에 newProxyInstance 메소드를 사용하면 동적 프록시 객체를 생성할 수 있습니다. 

* 다음과 같은 파라미터들이 필요합니다.
    * 프록시 객체를 정의하기 위한 클래스 로더(class loader)
    * 프록시 클래스가 구현할 인터페이스 리스트
    * invoke 메소드 호출 앞, 뒤에 필요한 로직을 추가할 수 있는 핸들러
* 반환되는 프록시 객체는 다음과 같은 특징을 가집니다.
    * 전달받은 인터페이스를 구현한 객체
    * 외부에서 프록시 메소드를 호출했을 때 이를 내부에서 처리하거나 확장할 수 있는 핸들러 존재

```java
public class Proxy implements java.io.Serializable {

    @CallerSensitive
    public static Object newProxyInstance(ClassLoader loader,
                                          Class<?>[] interfaces,
                                          InvocationHandler h) {
        Objects.requireNonNull(h);

        @SuppressWarnings("removal")
        final Class<?> caller = System.getSecurityManager() == null
                                    ? null
                                    : Reflection.getCallerClass();

        /*
         * Look up or generate the designated proxy class and its constructor.
         */
        Constructor<?> cons = getProxyConstructor(caller, loader, interfaces);

        return newProxyInstance(caller, cons, h);
    }
}
```

### 2.2. How does it flow?

프록시 객체를 생성한 후 해당 객체의 메소드를 호출하면 다음과 같은 실행 흐름을 가집니다. 
동적 프록시를 통해 getPosts 메소드를 가진 인터페이스 기능을 확장했다고 가정하였습니다.

1. 클라이언트(client)가 프록시 객체의 getPosts 메소드를 호출합니다. 
1. InvocationHandler 객체의 invoke 메소드가 실행됩니다.
1. invoke 메소드 내부에서 필요한 기능들을 실행한 후 타겟(target) 객체에게 요청을 전달합니다. 
1. 타겟 객체는 전달받은 요청을 수행합니다.

<p align="center">
    <img src="/images/dynamic-proxy-in-java-2.JPG" width="80%" class="image__border">
</p>

### 2.3. Limitation

JDK 동적 프록시 기능은 다음과 같은 한계점을 가집니다. 

* JDK 리플렉션 기능을 사용하기 때문에 속도가 느립니다.
* 인터페이스를 대상으로만 동적 프록시 객체를 생성할 수 있으며 클래스를 사용하는 경우 에러가 발생합니다.
    * 스프링 프레임워크에선 동적 프록시를 통해 AOP 등을 지원합니다.
    * 클래스를 직접 빈(bean) 객체로 만드는 경우를 지원하기 위해 `CGLib` 라이브러리를 기본적으로 사용합니다. 

## 3. Practice

Java 동적 프록시 기능을 사용한 간단한 예제를 살펴보겠습니다. 

### 3.1. PostService Interface

간단한 기능을 제공하는 포함된 인터페이스를 정의합니다.

```java
package action.in.blog.service;

import action.in.blog.domain.Post;

import java.util.List;

public interface PostService {

    List<Post> getPosts();

    void createPost(Post post);
}
```

### 3.2. DefaultPostService Class

* getPosts 메소드
    * 포스트 정보를 반환합니다.
* createPost 메소드
    * 포스트 정보를 생성합니다.

```java
package action.in.blog.service;

import action.in.blog.domain.Post;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Slf4j
public class DefaultPostService implements PostService {

    @Override
    public List<Post> getPosts() {
        return List.of(
                new Post(1L, "Hello World", "This is content."),
                new Post(2L, "Junhyunny's Devlog", "This is blog.")
        );
    }

    @Override
    public void createPost(Post post) {
        log.info("create new post {}", post);
    }
}
```

### 3.3. PostInvocationHandler Class

* getPosts 메소드 수행시 소요되는 시간을 측정합니다.
* 다른 메소드들은 지원하지 않는다는 메세지와 함께 예외를 던집니다. 

```java
package action.in.blog.handler;

import lombok.extern.slf4j.Slf4j;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;

@Slf4j
public class PostInvocationHandler implements InvocationHandler {

    private final Object target;

    public PostInvocationHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        if (method.getName().equals("getPosts")) {
            var start = System.nanoTime();
            var result = method.invoke(target, args);
            log.info("getPosts method takes {} ns", System.nanoTime() - start);
            return result;
        }
        throw new RuntimeException(
                String.format("%s is not supported method", method.getName())
        );
    }
}
```

### 3.4. Test

간단한 테스트 코드를 통해 프록시 객체를 생성하고 사용합니다. 

* invoke_getPosts 메소드
    * 정상적으로 결과를 얻으며 소요 시간을 측정하는 로그가 함께 출력됩니다.
* invoke_createPost 메소드
    * getPosts 메소드 이 외에 다른 메소드는 지원하지 않으므로 예외가 발생할 것을 예상합니다.
* usingClass_throwException 메소드
    * 인터페이스가 아닌 클래스를 전달하는 경우 예외가 발생할 것을 예상합니다.

```java
package action.in.blog;

import action.in.blog.domain.Post;
import action.in.blog.handler.PostInvocationHandler;
import action.in.blog.service.DefaultPostService;
import action.in.blog.service.PostService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@Slf4j
class ActionInBlogTests {

    PostService proxy;

    @BeforeEach
    void setUp() {
        proxy = (PostService) Proxy.newProxyInstance(
                this.getClass().getClassLoader(),
                new Class[]{PostService.class},
                new PostInvocationHandler(new DefaultPostService())
        );
    }

    @Test
    void invoke_getPosts() {

        var result = proxy.getPosts();
        var firstPost = result.get(0);
        var secondPost = result.get(1);


        assertEquals(2, result.size());
        assertEquals("Hello World", firstPost.title());
        assertEquals("This is content.", firstPost.content());
        assertEquals("Junhyunny's Devlog", secondPost.title());
        assertEquals("This is blog.", secondPost.content());
    }

    @Test
    void invoke_createPost() {

        var throwable = assertThrows(
                RuntimeException.class,
                () -> proxy.createPost(
                        new Post(1L, "Hello World", "This is content,")
                )
        );


        log.error(throwable.getMessage());
        assertEquals("createPost is not supported method", throwable.getMessage());
    }

    @Test
    void usingClass_throwException() {

        var throwable = assertThrows(RuntimeException.class, () -> {
            Proxy.newProxyInstance(
                    this.getClass().getClassLoader(),
                    new Class[]{DefaultPostService.class},
                    new PostInvocationHandler(new DefaultPostService())
            );
        });


        log.error(throwable.getMessage());
        assertEquals("action.in.blog.service.DefaultPostService is not an interface", throwable.getMessage());
    }
}
```

#### Result - invoke_getPosts method

* 핸들러에 정의한 로그 시간 측정 로그가 출력됩니다.

```
22:43:34.732 [Test worker] INFO action.in.blog.handler.PostInvocationHandler -- getPosts method takes 30486 ns
```

#### Result - invoke_createPost method

* 핸들러에서 전달한 에외 메세지를 확인할 수 있습니다.

```
22:48:07.321 [Test worker] ERROR action.in.blog.ActionInBlogTests -- createPost is not supported method
```

#### Result - usingClass_throwException method

* 인터페이스가 아닌 경우 예외가 발생하며 다음과 같은 메세지를 확인할 수 있습니다.

```
22:48:49.054 [Test worker] ERROR action.in.blog.ActionInBlogTests -- action.in.blog.service.DefaultPostService is not an interface
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-09-16-dynamic-proxy-in-java>

#### RECOMMEND NEXT POSTS

* [CGLib(Code Generation Library)][cglib-link]

#### REFERENCE

* <https://www.baeldung.com/java-dynamic-proxies>
* <https://docs.oracle.com/javase/8/docs/technotes/guides/reflection/proxy.html>
* <https://gong-story.tistory.com/22>
* [누구나 쉽게 배우는 Dynamic Proxy 다루기](https://inpa.tistory.com/entry/JAVA-%E2%98%95-%EB%88%84%EA%B5%AC%EB%82%98-%EC%89%BD%EA%B2%8C-%EB%B0%B0%EC%9A%B0%EB%8A%94-Dynamic-Proxy-%EB%8B%A4%EB%A3%A8%EA%B8%B0)
* <https://github.com/cglib/cglib>

[proxy-pattern-link]: https://junhyunny.github.io/information/design-pattern/proxy-pattern/
[cglib-link]: https://junhyunny.github.io/java/spring/spring-boot/cglib/