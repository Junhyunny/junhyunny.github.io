---
title: "Thread Pool in Java"
search: false
category:
  - java
last_modified_at: 2023-04-26T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

## 1. Thread Pool

스레드 풀(thread pool)은 프로그램의 동시성 실행을 지원하는 디자인 패턴입니다. 
복제된 작업자(replicated workers) 또는 작업자-크루(worker-crew) 모델이라고 불리기도 합니다. 
스레드 풀은 여러 개의 스레드들을 유지 관리하고, 풀 내의 스레드들은 작업(task)이 할당되기를 기다립니다. 

<p align="center">
    <img src="/images/thread-pool-in-java-1.JPG" width="80%" class="image__border">
</p>
<center>https://en.wikipedia.org/wiki/Thread_pool</center>

### 1.1. Considerations of Thread Pool Usage

스레드 풀은 다음과 같은 문제를 해결하기 위해 사용하는 디자인 패턴입니다. 

* 짧은 작업을 위해 스레드를 생성, 수거하는데 드는 비용을 줄일 수 있습니다.
    * 스레드 생성과 수거는 운영체제 자원을 사용하기 때문에 비용이 큽니다.
* 미리 생성해 둔 스레드에 작업을 할당하기 때문에 실행 지연을 줄일 수 있습니다.

스레드 풀을 사용하면 다음과 같은 것들을 고려해야 합니다.

* 처리할 작업에 비해 너무 많은 스레드가 생성되어 있다면 메모리가 낭비됩니다. 

## 2. Types of Thread Pool in Java

JDK 1.5버전부터 java.util.concurrent 패키지를 통해 동시성에 관련 기능들을 제공하였습니다.  
Java에서 스레드 풀 기능을 제공하는 주요 클래스와 인터페이스를 살펴본 후 각 스레드 풀의 특징을 살펴보겠습니다.

* Executors 클래스
    * 정적 팩토리 메소드 패턴을 통해 스레드 풀 구현체 인스턴스를 생성합니다.
    * 이번 포스트에서 살펴볼 정적 팩토리 메소드들은 다음과 같습니다.
        * newCachedThreadPool
        * newFixedThreadPool
        * newScheduledThreadPool
* ExecutorService 인터페이스
    * 스레드 풀 기능을 제공하는 클래스들은 ExecutorService 인터페이스를 구현합니다.
    * 스레드 풀로써 제공해야 하는 API 기능들을 정의하고 있습니다.
    * ExecutorService 인터페이스로 추상화 된 메소드들을 통해 스레드 풀 기능들을 활용할 수 있습니다. 
* ThreadPoolExecutor 클래스
    * ExecutorService 인터페이스 구현체 클래스입니다.
    * 포스트의 이해도를 높이고자 생성자 함수의 파라미터들을 살펴보겠습니다.
    * `corePoolSize` - 스레드 풀에 반드시 유지되어야 하는 스레드 수입니다.
    * `maximumPoolSize` - 스레드 풀에 저장할 수 있는 최대 스레드 개수입니다.
    * `keepAliveTime` - 스레드 수가 코어 수보다 많은 경우, 쉬는 스레드가 종료되기 전에 새 작업을 기다리는 최대 시간입니다. 
    * `unit` - `keepAliveTime` 파라미터에 적용되는 시간 단위입니다.
    * `workQueue` - 처리되어야하는 작업들이 저장되는 큐입니다.
    * `threadFactory` - 새로운 스레드를 만들 때 사용하는 팩토리 객체입니다.
    * `handler` - 큐 용량이 초과되어 작업 실행이 블락되는 경우 사용되는 핸들러 객체입니다. 

```java
public class ThreadPoolExecutor extends AbstractExecutorService {

    // ...

    public ThreadPoolExecutor(int corePoolSize,
                              int maximumPoolSize,
                              long keepAliveTime,
                              TimeUnit unit,
                              BlockingQueue<Runnable> workQueue,
                              ThreadFactory threadFactory,
                              RejectedExecutionHandler handler) {
        if (corePoolSize < 0 ||
            maximumPoolSize <= 0 ||
            maximumPoolSize < corePoolSize ||
            keepAliveTime < 0)
            throw new IllegalArgumentException();
        if (workQueue == null || threadFactory == null || handler == null)
            throw new NullPointerException();
        this.corePoolSize = corePoolSize;
        this.maximumPoolSize = maximumPoolSize;
        this.workQueue = workQueue;
        this.keepAliveTime = unit.toNanos(keepAliveTime);
        this.threadFactory = threadFactory;
        this.handler = handler;
    }
}
```

##### Thread Pool in Java

* Executors 클래스를 통해 생성되는 스레드 풀은 ExecutorService 인터페이스를 구현한 인스턴스들입니다.
* 스레드 풀 내부에는 작업을 담는 블록킹 큐, 작업자 스레드들이 담긴 해시 세트(hash set)이 존재합니다.
* 블록킹 큐에서 작업을 꺼내어 작업자 스레드에게 전달합니다.
    * 블록킹 큐에서 작업을 꺼낼 땐 타임아웃 여부에 따라 poll 혹은 take 메소드를 사용합니다.

<p align="center">
    <img src="/images/thread-pool-in-java-2.JPG" width="80%" class="image__border">
</p>

### 2.1. Cached Thread Pool

`newCachedThreadPool` 팩토리 메소드를 통해 생성합니다. 
해당 스레드 풀은 다음과 같은 특징을 가집니다. 

* ThreadPoolExecutor 인스턴스를 사용합니다.
* 스레드 풀에서 반드시 유지되어야 하는 코어 스레드 수는 0 입니다.
* 스레드 풀에 담을 수 있는 최대 스레드 수는 Integer.MAX_VALUE 입니다.
* 60초 동안 작업을 할당 받지 못하는 경우 스레드가 종료됩니다.
    * 작업자 스레드(worker thread)가 지정한 시간 동안 작업을 큐에서 꺼내지 못하면 작업이 큐에서 제거됩니다.
* SynchronousQueue 인스턴스에 작업을 담습니다.
    * 타임아웃(timeout)이 존재하므로 내부에서 poll 메소드가 수행됩니다.

```java
public class Executors {

    // ...

    public static ExecutorService newCachedThreadPool() {
        return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                      60L, TimeUnit.SECONDS,
                                      new SynchronousQueue<Runnable>());
    }
}
```

#### 2.1.1. Practice

* 10개의 작업을 전달한 후 스레드 풀 사이즈를 확인합니다.
* 60초 대기 후 스레드 풀 사이즈를 확인합니다.

```java
package action.in.blog;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadPoolExecutor;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.core.IsEqual.equalTo;

@Slf4j
class CachedThreadPoolTests {

    void waitFor(long milliseconds) {
        try {
            Thread.sleep(milliseconds);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    void submitTasks(int taskCount, ExecutorService executorService, Runnable runnable) {
        for (int index = 0; index < taskCount; index++) {
            executorService.submit(runnable);
        }
    }

    @Test
    void thread_is_removed() {
        int taskCount = 10;
        ExecutorService executorService = Executors.newCachedThreadPool();
        submitTasks(taskCount, executorService, () -> {
            log.info("Hello World");
        });


        int poolSize = ((ThreadPoolExecutor) executorService).getPoolSize();
        assertThat(poolSize, equalTo(10));

        waitFor(60010);

        int poolSizeAfterWait = ((ThreadPoolExecutor) executorService).getPoolSize();
        assertThat(poolSizeAfterWait, equalTo(0));
    }
}
```

##### Result of Practice

* 테스트 로그
    * 각 작업이 들어올 때마다 풀에서 사용되는 스레드가 모두 다른 것을 확인할 수 있습니다.
* 테스트 코드 통과
    * 작업을 전달한 직후 스레드 풀 사이즈가 10 입니다.
    * 60초 뒤에 스레드 풀 사이즈가 0 입니다.

```
22:35:57.445 [pool-1-thread-7] INFO action.in.blog.CachedThreadPoolTests -- Hello World
22:35:57.445 [pool-1-thread-6] INFO action.in.blog.CachedThreadPoolTests -- Hello World
22:35:57.445 [pool-1-thread-10] INFO action.in.blog.CachedThreadPoolTests -- Hello World
22:35:57.445 [pool-1-thread-2] INFO action.in.blog.CachedThreadPoolTests -- Hello World
22:35:57.445 [pool-1-thread-1] INFO action.in.blog.CachedThreadPoolTests -- Hello World
22:35:57.445 [pool-1-thread-9] INFO action.in.blog.CachedThreadPoolTests -- Hello World
22:35:57.445 [pool-1-thread-4] INFO action.in.blog.CachedThreadPoolTests -- Hello World
22:35:57.445 [pool-1-thread-8] INFO action.in.blog.CachedThreadPoolTests -- Hello World
22:35:57.445 [pool-1-thread-5] INFO action.in.blog.CachedThreadPoolTests -- Hello World
22:35:57.445 [pool-1-thread-3] INFO action.in.blog.CachedThreadPoolTests -- Hello World
```

### 2.2. Fixed Thread Pool

`newFixedThreadPool` 팩토리 메소드를 통해 생성합니다. 
해당 스레드 풀은 다음과 같은 특징을 가집니다.

* ThreadPoolExecutor 인스턴스를 사용합니다.
* 스레드 풀에서 반드시 유지되어야 하는 코어 스레드 수는 파라미터로 전달 받은 nThreads 값입니다.
* 스레드 풀에 담을 수 있는 최대 스레드 수는 파라미터로 전달 받은 nThreads 값입니다.
* 0초 동안 작업을 할당 받지 못하는 경우 스레드가 종료됩니다.
    * 작업이 없다면 얻을 때까지 대기하므로 실제 스레드의 개수는 줄어들지 않습니다. 
* LinkedBlockingQueue 인스턴스에 작업을 담습니다.
    * 타임아웃(timeout)이 없으므로 내부에서 take 메소드를 통해 작업을 얻습니다. 

```java
public class Executors {

    // ... 

    public static ExecutorService newFixedThreadPool(int nThreads) {
        return new ThreadPoolExecutor(nThreads, nThreads,
                                      0L, TimeUnit.MILLISECONDS,
                                      new LinkedBlockingQueue<Runnable>());
    }
}
```

#### 2.2.1. Practice

* 10개의 작업을 전달한 후 스레드 풀 사이즈를 확인합니다.
* 5초 대기 후 스레드 풀 사이즈를 확인합니다.

```java
package action.in.blog;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadPoolExecutor;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.core.IsEqual.equalTo;

@Slf4j
class FixedThreadPoolTests {

    void waitFor(long milliseconds) {
        try {
            Thread.sleep(milliseconds);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    void submitTasks(int taskCount, ExecutorService executorService, Runnable runnable) {
        for (int index = 0; index < taskCount; index++) {
            executorService.submit(runnable);
        }
    }

    @Test
    void thread_pool_size_is_not_changed() {
        int taskCount = 10;
        ExecutorService executorService = Executors.newFixedThreadPool(5);
        submitTasks(taskCount, executorService, () -> {
            log.info("Hello World");
        });


        int poolSize = ((ThreadPoolExecutor) executorService).getPoolSize();
        assertThat(poolSize, equalTo(5));

        waitFor(5000);

        int poolSizeAfterWait = ((ThreadPoolExecutor) executorService).getPoolSize();
        assertThat(poolSizeAfterWait, equalTo(5));
    }
}
```

##### Result of Practice

* 테스트 로그
    * 10개의 작업을 5개의 스레드가 나눠서 수행하는 것을 확인할 수 있습니다.
* 테스트 코드 통과
    * 작업을 전달한 직후 스레드 풀 사이즈가 5 입니다.
    * 5초 뒤에 스레드 풀 사이즈가 5 입니다.

```
07:29:30.819 [pool-1-thread-4] INFO action.in.blog.FixedThreadPoolTests -- Hello World
07:29:30.819 [pool-1-thread-2] INFO action.in.blog.FixedThreadPoolTests -- Hello World
07:29:30.819 [pool-1-thread-1] INFO action.in.blog.FixedThreadPoolTests -- Hello World
07:29:30.819 [pool-1-thread-3] INFO action.in.blog.FixedThreadPoolTests -- Hello World
07:29:30.819 [pool-1-thread-5] INFO action.in.blog.FixedThreadPoolTests -- Hello World
07:29:30.823 [pool-1-thread-4] INFO action.in.blog.FixedThreadPoolTests -- Hello World
07:29:30.823 [pool-1-thread-2] INFO action.in.blog.FixedThreadPoolTests -- Hello World
07:29:30.824 [pool-1-thread-1] INFO action.in.blog.FixedThreadPoolTests -- Hello World
07:29:30.824 [pool-1-thread-3] INFO action.in.blog.FixedThreadPoolTests -- Hello World
07:29:30.824 [pool-1-thread-5] INFO action.in.blog.FixedThreadPoolTests -- Hello World
```

### 2.3. Scheduled Thread Pool

`newScheduledThreadPool` 팩토리 메소드를 통해 생성합니다. 
해당 스레드 풀은 다음과 같은 특징을 가집니다.

* ScheduledThreadPoolExecutor 인스턴스를 사용합니다.
    * ScheduledThreadPoolExecutor는 ThreadPoolExecutor 클래스를 확장한 클래스입니다.
* ScheduledExecutorService 인터페이스를 반환합니다.
    * ScheduledExecutorService는 ExecutorService 인터페이스를 확장한 인터페이스입니다.
* 스레드 풀에서 반드시 유지되어야 하는 코어 스레드 수는 파라미터로 전달 받은 `corePoolSize` 값입니다.
* 스레드 풀에 담을 수 있는 최대 스레드 수는 파라미터로 전달 받은 `Integer.MAX_VALUE` 값입니다.
* 10ms 동안 작업을 할당 받지 못하는 경우 스레드가 종료됩니다.
    * 코어 풀 사이즈가 0인 경우 작업을 10ms 동안 획득하지 못하면 스레드가 풀에서 제거됩니다.
    * 코어 풀 사이즈가 1 이상인 경우 작업을 획득하지 못하더라도 스레드 풀에서 제거되지 않습니다.
* DelayedWorkQueue 인스턴스에 작업을 담습니다.
    * 코어 풀 사이즈가 0인 경우 내부에서 poll 메소드를 통해 작업을 얻습니다.
    * 코어 풀 사이즈가 1 이상인 경우 내부에서 take 메소드를 통해 작업을 얻습니다.

```java
public class Executors {

    // ...

    public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize) {
        return new ScheduledThreadPoolExecutor(corePoolSize);
    }
}

public class ScheduledThreadPoolExecutor extends ThreadPoolExecutor implements ScheduledExecutorService {

    // ...

    public ScheduledThreadPoolExecutor(int corePoolSize) {
        super(corePoolSize, Integer.MAX_VALUE,
              DEFAULT_KEEPALIVE_MILLIS, MILLISECONDS,
              new DelayedWorkQueue());
    }
}
```

#### 2.3.1. Practice

* 두 개의 테스트를 통해 동작을 살펴보겠습니다.
* run_scheduled_task 메소드
    * 코어 사이즈를 5로 지정합니다.
    * 10개의 작업을 전달합니다.
    * 1개의 작업은 1초 뒤에 실행되도록 스케줄링합니다. 
    * 스레드 풀 사이즈를 확인합니다.
    * 5초 대기 후 스레드 풀 사이즈를 확인합니다.
* remove_thread_when_core_size_zero 메소드
    * 코어 사이즈를 0으로 지정합니다.
    * 10개의 작업을 전달합니다.
    * 스레드 풀 사이즈를 확인합니다.
    * 50ms 대기 후 스레드 풀 사이즈를 확인합니다.

```java
package action.in.blog;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;

import java.util.concurrent.*;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.core.IsEqual.equalTo;

@Slf4j
class ScheduledThreadPoolTests {

    void waitFor(long milliseconds) {
        try {
            Thread.sleep(milliseconds);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    void submitTasks(int taskCount, ExecutorService executorService, Runnable runnable) {
        for (int index = 0; index < taskCount; index++) {
            executorService.submit(runnable);
        }
    }

    @Test
    void run_scheduled_task() throws InterruptedException {
        int taskCount = 10;
        ScheduledExecutorService executorService = Executors.newScheduledThreadPool(5);
        executorService.schedule(() -> {
            log.info("Run at last");
        }, 1000, TimeUnit.MILLISECONDS);
        submitTasks(taskCount, executorService, () -> {
            log.info("Hello World");
        });


        int poolSize = ((ThreadPoolExecutor) executorService).getPoolSize();
        assertThat(poolSize, equalTo(5));

        waitFor(5000);

        int poolSizeAfterWait = ((ThreadPoolExecutor) executorService).getPoolSize();
        assertThat(poolSizeAfterWait, equalTo(5));
    }

    @Test
    void remove_thread_when_core_size_zero() throws InterruptedException {
        int taskCount = 10;
        ScheduledExecutorService executorService = Executors.newScheduledThreadPool(0);
        submitTasks(taskCount, executorService, () -> {
            log.info("Hello World");
        });

        int poolSize = ((ThreadPoolExecutor) executorService).getPoolSize();
        assertThat(poolSize, equalTo(1));

        waitFor(50);

        int poolSizeAfterWait = ((ThreadPoolExecutor) executorService).getPoolSize();
        assertThat(poolSizeAfterWait, equalTo(0));
    }
}
```

##### Result of Practice

* run_scheduled_task 메소드 수행 결과
* 테스트 로그
    * 10개의 작업을 5개의 스레드가 나눠서 수행하는 것을 확인할 수 있습니다.
    * 첫 작업 1초 뒤에 `Run at last` 로그가 출력된 것을 확인할 수 있습니다.
* 테스트 코드 통과
    * 작업을 전달한 직후 스레드 풀 사이즈가 5 입니다.
    * 5초 뒤에 스레드 풀 사이즈가 5 입니다.

```
07:04:37.632 [pool-1-thread-3] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:04:37.632 [pool-1-thread-5] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:04:37.635 [pool-1-thread-3] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:04:37.632 [pool-1-thread-4] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:04:37.632 [pool-1-thread-1] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:04:37.632 [pool-1-thread-2] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:04:37.635 [pool-1-thread-5] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:04:37.636 [pool-1-thread-3] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:04:37.636 [pool-1-thread-4] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:04:37.636 [pool-1-thread-1] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:04:38.632 [pool-1-thread-2] INFO action.in.blog.ScheduledThreadPoolTests -- Run at last
```

* remove_thread_when_core_size_zero 메소드 수행 결과
* 테스트 로그
    * 10개의 작업을 1개의 스레드가 수행하는 것을 확인할 수 있습니다.
* 테스트 코드 통과
    * 작업을 수행하는 동안 스레드 풀 사이즈가 1 입니다.
    * 50ms 뒤에 스레드 풀 사이즈가 0 입니다.

```
07:51:01.347 [pool-1-thread-1] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:51:01.351 [pool-1-thread-1] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:51:01.351 [pool-1-thread-1] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:51:01.351 [pool-1-thread-1] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:51:01.351 [pool-1-thread-1] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:51:01.351 [pool-1-thread-1] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:51:01.351 [pool-1-thread-1] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:51:01.352 [pool-1-thread-1] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:51:01.352 [pool-1-thread-1] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
07:51:01.352 [pool-1-thread-1] INFO action.in.blog.ScheduledThreadPoolTests -- Hello World
```

## CLOSING

Executors 클래스를 통해 ForkJoinPool 인스턴스를 생성할 수 있습니다. 
ForkJoinPool 클래스도 스레드 풀의 종류 중 하나이지만, 나중에 추가되어 개선된 사항들이 많아 보입니다. 
한 포스트에 정리하기엔 내용이 많아 별도 포스트로 정리할 예정입니다.

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-04-26-thread-pool-in-java>

#### REFERENCE

* <https://en.wikipedia.org/wiki/Thread_pool>
* <https://www.baeldung.com/thread-pool-java-and-guava>
* <https://hamait.tistory.com/612>
* <https://tecoble.techcourse.co.kr/post/2021-09-18-java-thread-pool/>
* <https://docs.oracle.com/javase/7/docs/api/java/util/concurrent/Executors.html>