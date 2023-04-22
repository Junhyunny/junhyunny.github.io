---
title: "Precaution of ThreadLocal Class Usage"
search: false
category:
  - java
last_modified_at: 2023-04-22T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [ThreadLocal Class][thread-local-class-in-java-link]

## 0. 들어가면서

[ThreadLocal Class][thread-local-class-in-java-link] 포스트에서 ThreadLocal 클래스에 대한 전반적인 개념을 다뤘습니다. 
이번 포스트는 ThreadLocal 클래스를 사용할 때 주의할 사항에 대해 정리하였습니다. 

## 1. Thread Pool

ThreadLocal 클래스를 사용시 주의사항에 대해 이야기하려면 먼저 스레드 풀(thread pool)에 대한 개념을 알아야 합니다. 
Java 스레드(thread)는 운영체제 리소스를 사용합니다. 
그렇기 때문에 스레드를 생성하고 제거하는데 비용이 적지 않으므로 스레드 풀 패턴을 통해 스레드의 효율적인 사용을 도모합니다. 

스레드 풀은 여러 개의 스레드를 만들어두고 이를 재사용하는 방식입니다. 
어떤 작업을 위해 스레드가 필요하면 새롭게 생성하지 않고 스레드 풀에서 꺼내 사용하고 이를 반납합니다. 
이를 통해 스레드 자원을 생성, 제거할 때 발생하는 비용을 절약할 수 있습니다. 

* 특정 작업들을 작업 큐(task queue)에 담아 처리를 요청합니다.
* 스레드 풀에 속한 스레드들이 큐에 담긴 작업들을 하나씩 꺼내 처리합니다.
* 작업을 마친 스레드들은 큐가 빈 상태가 될 때까지 작업을 꺼내 처리하는 것을 반복 수행합니다.

<p align="center">
    <img src="/images/precaution-of-thread-local-1.JPG" width="80%" class="image__border">
</p>
<center>https://www.baeldung.com/thread-pool-java-and-guava</center>

## 2. Cause and Solution of Problem

### 2.1. Cause of Problem

ThreadLocal 클래스는 스레드 풀 환경에서 사용할 때 문제가 발생합니다. 
[ThreadLocal Class][thread-local-class-in-java-link] 포스트 내용을 바탕으로 원인을 다음과 같이 정리할 수 있습니다. 

* ThreadLocal 객체는 스레드 객체의 멤버 변수인 ThreadLocalMap 객체에 데이터를 저장됩니다.
* ThreadLocal 객체는 현재 실행 흐름을 수행하는 스레드에 저장한 데이터에 접근하기 위한 수단입니다.
* 스레드 풀은 미리 여러 개의 스레드들을 만들고 이를 재활용하는 구조입니다.
* 스레드 풀의 스레드는 제거되지 않으므로 이전 요청 처리시 ThreadLocal 객체를 통해 생성된 데이터는 그대로 남아있습니다. 
* 다음 작업을 위해 스레드가 재사용되는 경우 남아 있는 데이터로 인해 비정상적인 동작이 발생할 수 있습니다.

<p align="center">
    <img src="/images/precaution-of-thread-local-2.JPG" width="80%" class="image__border">
</p>

### 2.2. Solution of Problem

스프링 프레임워크를 사용하는 경우 기본적으로 내장 톰캣(embedded tomcat)을 사용합니다. 
톰캣은 기본적으로 요청을 처리하기 위한 스레드들을 스레드 풀에 담아 관리합니다. 
즉, 스프링 프레임워크 기반의 어플리케이션에서 ThreadLocal 클래스를 사용한다면 위에서 언급한 문제점을 주의해야합니다. 

문제 해결은 단순합니다. 
remove 메소드를 통해 스레드에 저장된 데이터를 삭제하면 문제가 해결됩니다. 
[ThreadLocal Class][thread-local-class-in-java-link] 포스트 예제처럼 필터에서 요청이 마무리되면 예외가 발생 여부와 상관없이 remove 메소드를 통해 데이터를 정리해야 합니다. 

```java
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

## 3. Practice

스레드 풀을 사용하면 데이터가 지워지지 않는 현상이 발생하는지 테스트 코드를 통해 살펴보겠습니다. 

* 두 가지 상황에 대한 테스트 작성하였습니다. 
    * ThreadLocal 객체에 데이터를 저장 후 지우지 않는 케이스
    * ThreadLocal 객체에 데이터를 저장 후 작업이 끝나기 전에 지우는 케이스
* 로그를 통해 결과를 확인합니다.

```java
package action.in.blog;

import org.junit.jupiter.api.Test;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ApplicationTests {

    void submitTasks(int taskCount, ExecutorService executorService, Runnable runnable) {
        for (int index = 0; index < taskCount; index++) {
            executorService.submit(runnable);
        }
    }

    @Test
    void dirty_context_problem_when_using_thread_local_with_thread_pool() {

        int taskCount = 10;
        ExecutorService executorService = Executors.newFixedThreadPool(3);
        CountDownLatch latch = new CountDownLatch(taskCount);

        submitTasks(taskCount, executorService, () -> {
            String value = ContextHolder.get();
            if (value != null) {
                System.out.printf("Value is not null. Existed value is %s.%n", value);
            } else {
                System.out.println("Value is null. Set current thread name into holder.");
                ContextHolder.set(Thread.currentThread().getName());
            }
            latch.countDown();
        });
    }

    @Test
    void solving_the_problem_when_using_thread_local_with_thread_pool() {

        int taskCount = 10;
        ExecutorService executorService = Executors.newFixedThreadPool(3);
        CountDownLatch latch = new CountDownLatch(taskCount);

        submitTasks(taskCount, executorService, () -> {
            String value = ContextHolder.get();
            if (value != null) {
                System.out.printf("Value is not null. Existed value is %s.%n", value);
            } else {
                System.out.println("Value is null. Set current thread name into holder.");
                ContextHolder.set(Thread.currentThread().getName());
            }
            ContextHolder.remove();
            latch.countDown();
        });
    }
}

class ContextHolder {
    private static final ThreadLocal<String> threadLocal = new ThreadLocal<>();

    public static String get() {
        return threadLocal.get();
    }

    public static void set(String value) {
        threadLocal.set(value);
    }

    public static void remove() {
        threadLocal.remove();
    }
}
```

##### Result of Tests

* ThreadLocal 객체에 데이터를 저장 후 지우지 않는 케이스 테스트 결과

```
Value is null. Set current thread name into holder.
Value is null. Set current thread name into holder.
Value is null. Set current thread name into holder.
Value is not null. Existed value is pool-2-thread-2.
Value is not null. Existed value is pool-2-thread-1.
Value is not null. Existed value is pool-2-thread-2.
Value is not null. Existed value is pool-2-thread-3.
Value is not null. Existed value is pool-2-thread-1.
Value is not null. Existed value is pool-2-thread-2.
Value is not null. Existed value is pool-2-thread-3.
```

* ThreadLocal 객체에 데이터를 저장 후 작업이 끝나기 전에 지우는 케이스 테스트 결과

```
Value is null. Set current thread name into holder.
Value is null. Set current thread name into holder.
Value is null. Set current thread name into holder.
Value is null. Set current thread name into holder.
Value is null. Set current thread name into holder.
Value is null. Set current thread name into holder.
Value is null. Set current thread name into holder.
Value is null. Set current thread name into holder.
Value is null. Set current thread name into holder.
Value is null. Set current thread name into holder.
```

## CLOSING

ThreadLocal 클래스는 

#### TEST CODE REPOSITORY

* <>

#### RECOMMEND NEXT POSTS

#### REFERENCE

* <https://www.baeldung.com/thread-pool-java-and-guava>
* <https://hudi.blog/java-thread-pool/>
* <https://madplay.github.io/post/java-threadlocal>
* <https://blog.naver.com/writer0713/222949116507>

[thread-local-class-in-java-link]: https://junhyunny.github.io/java/thread-local-class-in-java/