---
title: "ThreadLocal Class"
search: false
category:
  - java
last_modified_at: 2023-04-20T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Proccess and Thread][process-vs-thread-link]
* [Principal Class for Authenticated User][setup-temporal-principal-link]
* [Layered Architecture][layered-architecture-link]

## 1. ThreadLocal Class

JDK 1.2부터 지원된 기능입니다. 
스레드(thread) 단위로 값을 저장할 수 있는 메모리 공간입니다. 
ThreadLocal 클래스에 대해 알아보기 전에 `Java` 메모리 중 스택(stack)을 간단하게 살펴보겠습니다. 

### 1.1. Stack Memory for Thread in Java

`Java`는 각 스레드에게 스택이라는 고유한 메모리 공간을 부여합니다. 
각 스레드 별로 가지는 저장 공간이며 다른 스레드들과 공유하지 않습니다. 
스레드는 자신이 만드는 실행 흐름에서 메소드를 호출할 때마다 스택에 필요한 컨텍스트(context)를 만들고 제거하기를 반복합니다. 

##### Stack Memory for Thread

* 스레드가 메소드를 실행하면 스택에 필요한 컨텍스트를 생성합니다.
* 메소드 내부에서 선언한 로컬 변수는 스택 공간을 차지합니다.
* 메소드 내부에서 생성한 객체는 힙(heap) 공간을 차지합니다.
* 로컬 변수엔 힙에 생성된 객체를 참조할 수 있도록 객체의 주소가 저장됩니다. 
* 힙에 생성된 객체는 스택의 로컬 변수를 통해서만 접근 가능하기 때문에 다른 스레드에서 접근할 수 없습니다. 

<p align="center">
    <img src="/images/thread-local-class-in-java-1.JPG" width="80%" class="image__border">
</p>

### 1.2. Inside ThreadLocal Class

ThreadLocal 클래스는 어떤 구조를 통해 스레드 단위에 데이터 저장이 가능한지 구조를 살펴보겠습니다. 
중요한 메소드를 기준으로 살펴보겠습니다. 

* withInitial 메소드
    * 람다식(lambda expression)을 통해 ThreadLocal 객체의 초기 값을 지정합니다.
* get 메소드
    * ThreadLocal 객체에 저장된 값을 찾아 반환합니다.
    * 현재 스레드를 기준으로 ThreadLocalMap 객체를 찾습니다.
    * ThreadLocalMap 객체에 저장된 값을 찾습니다.
    * 값을 찾을 수 없다면 초기 값을 설정하고 이를 반환합니다.
* set 메소드
    * ThreadLocal 객체에 값을 저장합니다.
    * 현재 스레드를 기준으로 ThreadLocalMap 객체를 찾습니다.
    * ThreadLocalMap 객체를 찾았다면 해당 맵에 값을 저장합니다.
    * ThreadLocalMap 객체를 찾지 못하면 새로운 맵을 생성하고 값을 저장합니다.
* remove 메소드 
    * 스레드를 기준으로 ThreadLocalMap 객체를 찾습니다.
    * ThreadLocalMap 객체를 찾았다면 해당 맵에서 값을 비웁니다.
* getMap 메소드 
    * 현재 스레드 객체로부터 ThreadLocalMap 객체를 전달 받습니다. 

```java
public class ThreadLocal<T> {

    // ...

    public static <S> ThreadLocal<S> withInitial(Supplier<? extends S> supplier) {
        return new SuppliedThreadLocal(supplier);
    }

    public T get() {
        Thread t = Thread.currentThread();
        ThreadLocalMap map = this.getMap(t);
        if (map != null) {
            ThreadLocalMap.Entry e = map.getEntry(this);
            if (e != null) {
                T result = e.value;
                return result;
            }
        }
        return this.setInitialValue();
    }

    public void set(T value) {
        Thread t = Thread.currentThread();
        ThreadLocalMap map = this.getMap(t);
        if (map != null) {
            map.set(this, value);
        } else {
            this.createMap(t, value);
        }
    }

    public void remove() {
        ThreadLocalMap m = this.getMap(Thread.currentThread());
        if (m != null) {
            m.remove(this);
        }
    }

    ThreadLocalMap getMap(Thread t) {
        return t.threadLocals;
    }
}
```

### 1.3. Inside ThreadLocalMap Class

ThreadLocalMap 클래스는 ThreadLocal 클래스 내부에 존재합니다. 
ThreadLocalMap 객체는 엔트리(entry)를 배열(array)로 관리하고 있으며, 특정 엔트리를 찾을 때 ThreadLocal 객체의 해시 코드를 인덱스로 사용합니다. 
주요하게 살펴볼 메소드는 다음과 같습니다. 

* getEntry 메소드
    * ThreadLocalMap 객체에서 관리하는 엔트리들 중에 해당 ThreadLocal 객체에 매칭된 엔트리를 반환합니다.
    * ThreadLocal 객체의 해시 코드를 기준으로 해당 맵에 저장된 엔트리를 찾습니다. 
* set 메소드
    * ThreadLocal 객체의 해시 코드를 사용해 엔트리에 접근합니다.
    * 엔트리를 찾으면 값을 저장합니다. 
    * 엔트리를 찾지 못하면 새로운 엔트리 객체를 만들어 내부에 값을 저장하고, 엔트리를 배열에 저장합니다. 

```java
public class ThreadLocal<T> {

    // ...

    static class ThreadLocalMap {

        private Entry getEntry(ThreadLocal<?> key) {
            int i = key.threadLocalHashCode & (table.length - 1);
            Entry e = table[i];
            if (e != null && e.refersTo(key))
                return e;
            else
                return getEntryAfterMiss(key, i, e);
        }

        private void set(ThreadLocal<?> key, Object value) {

            Entry[] tab = table;
            int len = tab.length;
            int i = key.threadLocalHashCode & (len-1);

            for (Entry e = tab[i];
                 e != null;
                 e = tab[i = nextIndex(i, len)]) {
                if (e.refersTo(key)) {
                    e.value = value;
                    return;
                }

                if (e.refersTo(null)) {
                    replaceStaleEntry(key, value, i);
                    return;
                }
            }

            tab[i] = new Entry(key, value);
            int sz = ++size;
            if (!cleanSomeSlots(i, sz) && sz >= threshold)
                rehash();
        }
    }
}
```

### 1.4. Summary for ThreadLocal Class Mechanism

Java에서 스레드는 객체라는 점을 고려하여 ThreadLocal 클래스의 기능을 다음과 같이 요약할 수 있습니다. 
추상화된 이미지를 통해 ThreadLocal 클래스의 기능을 살펴보겠습니다. 

* 각 스레드 객체는 자신이 관리하는 ThreadLocalMap 객체가 존재합니다.
* ThreadLocalMap 객체는 ThreadLocalMap.Entry 객체를 배열로 관리합니다.
* 클라이언트(client)는 다음과 같은 내부 메커니즘(mechanism)을 통해 ThreadLocal 객체로부터 값을 꺼내거나 저장할 수 있습니다. 
    * ThreadLocal 객체는 내부에서 현재 스레드 객체가 관리하는 ThreadLocalMap 객체를 반환받습니다.
    * ThreadLocalMap 객체는 데이터를 저장한 엔티트들을 배열로 관리합니다.
    * 특정 엔트리에 접근하기 위해 ThreadLocal 객체의 해시 코드 값을 사용합니다.
    * 이를 통해 ThreadLocal 객체에 매칭된 특정 엔트리를 ThreadLocalMap 객체로부터 찾을 수 있습니다.
    * ThreadLocal 객체는 각 스레드마다 존재하는 ThreadLocalMap 객체에 특정 엔트리를 차지합니다. 
* 요약하면 ThreadLocal 객체는 현재 스레드 객체에서 관리하는 ThreadLocalMap 객체에 값을 저장하고, 꺼내기 위한 통로입니다.

<p align="center">
    <img src="/images/thread-local-class-in-java-2.JPG" width="80%" class="image__border">
</p>

## 2. Why do we need ThreadLocal?

ThredLocal 클래스는 이름처럼 스레드 단위로 로컬 변수를 선언한 것처럼 사용할 수 있습니다. 
실제 로컬 변수와 차이점은 다음과 같습니다. 

* 메소드 내부에서 선언하여 사용하는 것이 아니라 static 키워드를 통해 어플리케이션 전역에서 사용합니다.
* 동일한 스레드라면 어플리케이션 코드 어디에서든 값을 저장하고 사용할 수 있습니다.

ThreadLocal 클래스는 무슨 문제점을 해결하기 위해 등장했는지 알아보겠습니다. 
다음과 같은 상황을 가정하겠습니다. 

* 스프링 프레임워크 기반의 어플리케이션을 개발
* 서블릿(servlet) 필터에서 인증된 사용자 정보를 획득
* 영속성 레이어(persistence layer)에서 인증된 사용자 정보를 활용

톰캣(tomcat) 미들웨어 기반의 스프링 어플리케이션은 아래 그림의 보라색 선을 따라 흐름이 진행됩니다. 
위에서 가정한 것처럼 인증된 사용자 정보를 서블릿 필터에서부터 영속성 레이어인 레포지토리(repository)까지 전달하려면 많은 코드를 지나야합니다. 
스레드-안전(thread-safe)하게 인증된 사용자 객체를 사용하려면 메소드의 파라미터를 통해 계속 들고 다녀야합니다. 

<p align="center">
    <img src="/images/thread-local-class-in-java-3.JPG" width="80%" class="image__border">
</p>
<center>https://gowoonsori.com/spring/architecture/</center>

### 2.1. FooFilter Class

서블릿 필터에서 영속성 레이어까지 인증된 사용자 객체를 전달하는 과정을 코드로 살펴보겠습니다. 
서블릿 필터 코드부터 살펴보겠습니다. 

* 인증된 사용자 정보는 세션이나 외부 서비스 혹은 데이터베이스에서 획득했다고 가정하겠습니다.
* 인증된 사용자 정보를 HttpServletRequestWrapper 클래스를 상속한 객체를 통해 다음 필터로 전달합니다.

```java
package action.in.blog.filter;

import action.in.blog.domain.AuthenticatedUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.Principal;
import java.util.Arrays;

@Slf4j
public class FooFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        AuthenticatedUser authenticatedUser = AuthenticatedUser.builder()
                .id("0001")
                .name(Thread.currentThread().getName())
                .roles(Arrays.asList("ADMIN", "USER", "MANAGER"))
                .build();
        log.info("{} in foo filter", authenticatedUser);
        filterChain.doFilter(new UserPrincipalHttpServletRequest(request, authenticatedUser), response);
    }
}

class UserPrincipalHttpServletRequest extends HttpServletRequestWrapper {

    private Principal principal;

    public UserPrincipalHttpServletRequest(HttpServletRequest request) {
        super(request);
    }

    public UserPrincipalHttpServletRequest(HttpServletRequest request, Principal principal) {
        this(request);
        this.principal = principal;
    }

    @Override
    public Principal getUserPrincipal() {
        return principal;
    }
}
```

### 2.2. FooController Class

* API 엔드-포인트(end-point) 역할을 수행하는 컨트롤러에서 메소드 파라미터로 인증된 사용자 정보를 전달받습니다.
* 인증된 사용자를 서비스 객체에게 전달합니다.

```java
package action.in.blog.controller;

import action.in.blog.domain.AuthenticatedUser;
import action.in.blog.service.FooService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FooController {

    private final FooService fooService;

    public FooController(FooService fooService) {
        this.fooService = fooService;
    }

    @PostMapping("/foo")
    public void createFoo(AuthenticatedUser user) {
        fooService.createFoo(user);
    }
}
```

### 2.3. FooService Class

* 비즈니스 로직의 흐름을 제어하는 서비스에서 메소드 파라미터로 인증된 사용자 정보를 전달받습니다.
* 인증된 사용자를 스토어 객체에게 전달합니다.

```java
package action.in.blog.service;

import action.in.blog.domain.AuthenticatedUser;
import action.in.blog.store.FooStore;
import org.springframework.stereotype.Service;

@Service
public class FooService {

    private final FooStore fooStore;

    public FooService(FooStore fooStore) {
        this.fooStore = fooStore;
    }

    public void createFoo(AuthenticatedUser user) {
        fooStore.createFoo(user);
    }
}
```

### 2.4. FooStore Class

* 영속성 레이어에 해당하는 FooStore 객체에서 파라미터로 인증된 사용자 정보를 전달받습니다.
* 인증된 사용자 정보를 사용합니다.

```java
package action.in.blog.store;

import action.in.blog.domain.AuthenticatedUser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

@Slf4j
@Repository
public class FooStore {

    public void createFoo(AuthenticatedUser user) {
        log.info("using {} for creating foo", user);
    }
}
```

## 3. Practice

ThreadLocal 클래스를 사용하면 복잡한 코드를 단순하게 만들 수 있습니다. 

### 3.1. AuthenticatedUserHolder Class

* 인증된 사용자 정보를 저장하기 위한 홀더(holder) 클래스를 생성합니다.
* ThreadLocal 객체를 전역(static)으로 선언합니다.
    * 전역으로 선언하더라도 각 스레드마다 고유한 값을 저장, 사용할 수 있습니다. 
* ThreadLocal 객체를 전역으로 선언하고 사용하기 때문에 동일한 스레드라면 어플리케이션 코드 내 어디에서든 사용할 수 있습니다.

```java
package action.in.blog.util;

import action.in.blog.domain.AuthenticatedUser;

public class AuthenticatedUserHolder {

    private static final ThreadLocal<AuthenticatedUser> holder = new ThreadLocal<>();

    public static AuthenticatedUser get() {
        return holder.get();
    }

    public static void setUser(AuthenticatedUser authenticatedUser) {
        holder.set(authenticatedUser);
    }

    public static void remove() {
        holder.remove();
    }
}
```

### 3.2. BarFilter Class

* 인증된 사용자 정보를 홀더 클래스에 담습니다.
* 다음 필터 체인을 진행합니다.
* 요청을 처리와 마무리 작업을 `try-finally` 블럭을 통해 수행합니다.
    * finally 블럭에서 홀더 클래스에 담긴 정보를 삭제합니다.

```java
package action.in.blog.filter;

import action.in.blog.domain.AuthenticatedUser;
import action.in.blog.util.AuthenticatedUserHolder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Slf4j
public class BarFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        try {
            AuthenticatedUser authenticatedUser = AuthenticatedUser.builder()
                    .id("0001")
                    .name(Thread.currentThread().getName())
                    .roles(Arrays.asList("ADMIN", "USER", "MANAGER"))
                    .build();
            AuthenticatedUserHolder.setUser(authenticatedUser);
            log.info("{} in bar filter", authenticatedUser);
            filterChain.doFilter(request, response);
        } finally {
            AuthenticatedUserHolder.remove();
        }
    }
}
```

### 3.3. BarStore Class

컨트롤러, 서비스 객체는 크게 살펴볼 필요가 없기 때문에 스토어 객체를 살펴보겠습니다.

* 영속성 레이어에 해당하는 BarStore 객체에서 인증된 사용자 정보를 홀더에서 꺼내 사용합니다.

```java
package action.in.blog.store;

import action.in.blog.util.AuthenticatedUserHolder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

@Slf4j
@Repository
public class BarStore {

    public void createBar() {
        log.info("using {} for creating bar", AuthenticatedUserHolder.get());
    }
}
```

## CLOSING

ThreadLocal 클래스는 스레드 객체에 저장된 데이터를 참조하는 특성으로 인해 스레드 풀(thread pool) 구조에 취약합니다. 
스레드 풀 환경에서 의도치 않은 버그를 방지하려면 ThreadLocal 객체를 remove 메소드를 사용해 정리해야 합니다. 
관련된 내용은 다음 포스트로 다뤄볼 예정입니다. 

테스트를 위해 각 필터 별로 요청 처리를 나누기 위해 별도 설정 빈(configuration bean)을 사용하였습니다. 
필터가 동작하기 위해선 다음과 같은 설정이 필요합니다.

##### WebMvcConfiguration Class

```java
package action.in.blog.config;

import action.in.blog.filter.BarFilter;
import action.in.blog.filter.FooFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfiguration implements WebMvcConfigurer {

    @Bean
    public FilterRegistrationBean<FooFilter> fooFilterRegistrationBean() {
        FilterRegistrationBean<FooFilter> registrationBean = new FilterRegistrationBean<>(new FooFilter());
        registrationBean.addUrlPatterns("/foo");
        return registrationBean;
    }

    @Bean
    public FilterRegistrationBean<BarFilter> barFilterRegistrationBean() {
        FilterRegistrationBean<BarFilter> registrationBean = new FilterRegistrationBean<>(new BarFilter());
        registrationBean.addUrlPatterns("/bar");
        return registrationBean;
    }
}
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-04-20-thread-local-class-in-java>

#### RECOMMEND NEXT POSTS

* [Precaution of ThreadLocal Class Usage][precaution-of-thread-local-link]

#### REFERENCE

* <https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/ThreadLocal.html>
* <https://jaehoney.tistory.com/302>
* <https://pamyferret.tistory.com/53>
* <https://gowoonsori.com/spring/architecture/>

[process-vs-thread-link]: https://junhyunny.github.io/information/operating-system/process-vs-thread/
[setup-temporal-principal-link]: https://junhyunny.github.io/tomcat/spring-boot/setup-temporal-principal/
[layered-architecture-link]: https://junhyunny.github.io/architecture/pattern/layered-architecture/

[precaution-of-thread-local-link]: https://junhyunny.github.io/java/precaution-of-thread-local/