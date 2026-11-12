---
title: "자바(Java) ThreadLocal 클래스"
publishedAt: "2023-04-20"
updatedAt: "2026-11-12T16:19:33+09:00"
canonicalPath: "/java/thread-local-class-in-java/"
categories:
  - "java"
summary: "스레드별 저장 공간을 제공하는 ThreadLocal 클래스의 내부 구조와 동작 원리를 살펴보고, 필터에서 인증 사용자 정보를 보관해 계층 간에 전달하는 예제를 정리했다."
recommendedPosts:
  - title: "프로세스(process)와 스레드(thread)"
    href: "https://junhyunny.github.io/information/operating-system/process-vs-thread/"
  - title: "Principal Class for Authenticated User"
    href: "https://junhyunny.github.io/tomcat/spring-boot/setup-temporal-principal/"
  - title: "레이어 아키텍처(Layered Architecture)"
    href: "https://junhyunny.github.io/architecture/pattern/layered-architecture/"
  - title: "ThreadLocal 클래스 사용 시 주의점"
    href: "https://junhyunny.github.io/java/precaution-of-thread-local/"
---

## 1. ThreadLocal 클래스

ThreadLocal 클래스는 JDK 1.2부터 지원된 기능으로, 스레드(thread) 단위로 값을 저장할 수 있는 메모리 공간이다. ThreadLocal 클래스를 알아보기 전에 `Java` 메모리 중 스택(stack)을 간단하게 살펴보자.

### 1.1. Stack Memory for Thread in Java

`Java`는 각 스레드에게 스택이라는 고유한 메모리 공간을 부여한다. 스택은 스레드마다 가지는 저장 공간이며 다른 스레드와 공유하지 않는다. 스레드는 자신이 만드는 실행 흐름에서 메서드를 호출할 때마다 스택에 필요한 컨텍스트(context)를 만들고 제거하기를 반복한다.

스레드가 메서드를 실행하면 스택에 필요한 컨텍스트를 생성한다. 메서드 내부에서 선언한 로컬 변수는 스택 공간을, 메서드 내부에서 생성한 객체는 힙(heap) 공간을 차지한다. 로컬 변수에는 힙에 생성된 객체를 참조할 수 있도록 객체의 주소가 저장된다. 힙에 생성된 객체는 스택의 로컬 변수를 통해서만 접근할 수 있기 때문에 다른 스레드에서 접근할 수 없다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/thread-local-class-in-java-01.png" width="100%" class="image__border">
</div>

### 1.2. Inside ThreadLocal Class

ThreadLocal 클래스가 어떤 구조를 통해 스레드 단위로 데이터를 저장하는지 중요한 메서드를 기준으로 살펴보자.

- withInitial 메서드는 람다식(lambda expression)으로 ThreadLocal 객체의 초깃값을 지정한다.
- get 메서드는 ThreadLocal 객체에 저장된 값을 찾아 반환한다. 현재 스레드를 기준으로 ThreadLocalMap 객체를 찾고, 그 객체에 저장된 값을 찾는다. 값을 찾을 수 없다면 초깃값을 설정하고 이를 반환한다.
- set 메서드는 ThreadLocal 객체에 값을 저장한다. 현재 스레드를 기준으로 ThreadLocalMap 객체를 찾아 해당 맵에 값을 저장한다. ThreadLocalMap 객체를 찾지 못하면 새로운 맵을 생성하고 값을 저장한다.
- remove 메서드는 현재 스레드를 기준으로 ThreadLocalMap 객체를 찾고, 찾았다면 해당 맵에서 값을 비운다.
- getMap 메서드는 현재 스레드 객체로부터 ThreadLocalMap 객체를 전달받는다.

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

ThreadLocalMap 클래스는 ThreadLocal 클래스 내부에 존재한다. ThreadLocalMap 객체는 엔트리(entry)를 배열(array)로 관리하며, 특정 엔트리를 찾을 때 ThreadLocal 객체의 해시 코드를 인덱스로 사용한다. 주요하게 살펴볼 메서드는 다음과 같다.

- getEntry 메서드는 ThreadLocalMap 객체가 관리하는 엔트리 중 해당 ThreadLocal 객체에 매칭된 엔트리를 반환한다. ThreadLocal 객체의 해시 코드를 기준으로 맵에 저장된 엔트리를 찾는다.
- set 메서드는 ThreadLocal 객체의 해시 코드를 사용해 엔트리에 접근한다. 엔트리를 찾으면 값을 저장하고, 찾지 못하면 새로운 엔트리 객체를 만들어 값을 담은 뒤 배열에 저장한다.

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

Java에서 스레드는 객체라는 점을 고려하면 ThreadLocal 클래스의 기능을 다음과 같이 요약할 수 있다. 추상화한 그림과 함께 살펴보자.

- 각 스레드 객체에는 자신이 관리하는 ThreadLocalMap 객체가 있다.
- ThreadLocalMap 객체는 ThreadLocalMap.Entry 객체를 배열로 관리한다.
- 클라이언트(client)는 다음과 같은 내부 메커니즘(mechanism)으로 ThreadLocal 객체에서 값을 꺼내거나 저장할 수 있다.
  - ThreadLocal 객체는 내부에서 현재 스레드 객체가 관리하는 ThreadLocalMap 객체를 반환받는다.
  - ThreadLocalMap 객체는 데이터를 저장한 엔트리들을 배열로 관리한다.
  - 특정 엔트리에 접근할 때 ThreadLocal 객체의 해시 코드 값을 사용한다. 이를 통해 ThreadLocal 객체에 매칭된 엔트리를 ThreadLocalMap 객체에서 찾을 수 있다.
  - ThreadLocal 객체는 스레드마다 존재하는 ThreadLocalMap 객체에서 특정 엔트리를 차지한다.
- 요약하면 ThreadLocal 객체는 현재 스레드 객체가 관리하는 ThreadLocalMap 객체에 값을 저장하고 꺼내기 위한 통로다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/thread-local-class-in-java-02.png" width="100%" class="image__border">
</div>

## 2. Why do we need ThreadLocal?

ThreadLocal 클래스는 이름처럼 스레드 단위로 로컬 변수를 선언한 것처럼 사용할 수 있다. 실제 로컬 변수와 차이점은 다음과 같다.

- 메서드 내부에서 선언해 사용하는 것이 아니라 static 키워드로 선언해 애플리케이션 전역에서 사용한다.
- 동일한 스레드라면 애플리케이션 코드 어디에서든 값을 저장하고 사용할 수 있다.

ThreadLocal 클래스가 어떤 문제를 해결하기 위해 등장했는지 알아보자. 다음과 같은 상황을 가정한다.

- 스프링 프레임워크 기반의 애플리케이션을 개발
- 서블릿(servlet) 필터에서 인증된 사용자 정보를 획득
- 영속성 레이어(persistence layer)에서 인증된 사용자 정보를 활용

톰캣(tomcat) 미들웨어 기반의 스프링 애플리케이션은 아래 그림의 보라색 선을 따라 흐름이 진행된다. 앞에서 가정한 것처럼 인증된 사용자 정보를 서블릿 필터에서부터 영속성 레이어인 레포지토리(repository)까지 전달하려면 많은 코드를 지나야 한다. 스레드-안전(thread-safe)하게 인증된 사용자 객체를 사용하려면 메서드 파라미터로 계속 들고 다녀야 한다.

<div class="block-break">
  <div align="center">
    <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/thread-local-class-in-java-03.png" width="100%" class="image__border">
  </div>
  <center>https://gowoonsori.com/blog/spring/architecture/</center>
</div>

서블릿 필터에서 영속성 레이어까지 인증된 사용자 객체를 전달하는 과정을 코드로 살펴보자. 먼저 서블릿 필터인 FooFilter 클래스다. 인증된 사용자 정보는 세션이나 외부 서비스 혹은 데이터베이스에서 획득했다고 가정한다. 인증된 사용자 정보는 HttpServletRequestWrapper 클래스를 상속한 객체에 담아 다음 필터로 전달한다.

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

API 엔드포인트(end-point) 역할을 수행하는 FooController 클래스는 메서드 파라미터로 인증된 사용자 정보를 전달받고, 이를 서비스 객체에 전달한다.

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

비즈니스 로직의 흐름을 제어하는 FooService 클래스도 메서드 파라미터로 인증된 사용자 정보를 전달받고, 이를 스토어 객체에 전달한다.

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

영속성 레이어에 해당하는 FooStore 클래스에서 비로소 파라미터로 전달받은 인증된 사용자 정보를 사용한다.

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

ThreadLocal 클래스를 사용하면 복잡한 코드를 단순하게 만들 수 있다.

먼저 인증된 사용자 정보를 저장하기 위한 AuthenticatedUserHolder 클래스를 만든다. ThreadLocal 객체는 전역(static)으로 선언하더라도 스레드마다 고유한 값을 저장하고 사용할 수 있다. 또 전역으로 선언했기 때문에 동일한 스레드라면 애플리케이션 코드 어디에서든 사용할 수 있다.

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

BarFilter 클래스는 인증된 사용자 정보를 홀더 클래스에 담은 후 필터 체인을 계속 진행한다. 요청 처리와 마무리 작업은 `try-finally` 블록으로 감싸고, finally 블록에서 홀더 클래스에 담긴 정보를 삭제한다.

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

컨트롤러와 서비스 객체는 크게 살펴볼 필요가 없으니 스토어 객체를 살펴보자. 영속성 레이어에 해당하는 BarStore 객체에서 인증된 사용자 정보를 홀더에서 꺼내 사용한다.

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

ThreadLocal 클래스는 스레드 객체에 저장된 데이터를 참조하는 특성으로 인해 스레드 풀(thread pool) 구조에 취약하다. 스레드 풀 환경에서 의도치 않은 버그를 방지하려면 ThreadLocal 객체를 remove 메서드를 사용해 정리해야 한다. 관련 내용은 다음 글에서 다룰 예정이다.

테스트에서 필터별로 요청 처리를 나누기 위해 별도 설정 빈(configuration bean)을 사용했다. 필터가 동작하려면 다음과 같은 WebMvcConfiguration 클래스가 필요하다.

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

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-04-20-thread-local-class-in-java>

#### REFERENCE

- <https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/ThreadLocal.html>
- <https://jaehoney.tistory.com/302>
- <https://pamyferret.tistory.com/53>
- <https://gowoonsori.com/blog/spring/architecture/>
