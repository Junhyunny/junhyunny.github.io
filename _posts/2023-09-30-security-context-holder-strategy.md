---
title: "SecurityContextHolderStrategy in Spring Security"
search: false
category:
  - java
  - spring
  - spring-boot
  - spring-security
last_modified_at: 2023-09-30T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Strategy Pattern][strategy-pattern-link]
* [ThreadLocal Class][thread-local-class-in-java-link]

## 1. SecurityContextHolder Class

스프링 시큐리티(spring security)는 인증 프로세스에서 인증이 완료된 사용자 정보를 시큐리티 컨텍스트(security context)에 저장합니다. 
인증 정보가 담긴 시큐리티 컨텍스트는 해당 요청이 처리되는 동안 다른 로직들에서 사용되는데, 이를 운반하는 것이 SecurityContextHolder 클래스입니다. 
컨텍스트 운반 전략은 시스템 설정에 따라 변경되며 스프링 시큐리티는 기본적으로 세 가지 전략을 지원합니다. 

* 시스템 설정에서 `spring.security.strategy` 키로 저장된 값을 사용합니다. 
* 별도로 지정된 값이 없다면 `MODE_THREADLOCAL`를 사용하며 필요한 경우 직접 구현한 전략을 사용할 수 있습니다. 
* 필요한 경우 setStrategyName 메소드를 통해 런타임 중 시큐리티 컨텍스트 보관 전략을 변경할 수 있습니다.
* 각 모드에 따라 다음과 같은 기능을 수행합니다.
    * MODE_THREADLOCAL 모드
        * ThreadLocalSecurityContextHolderStrategy 클래스를 사용합니다.
        * 내부적으로 ThreadLocal 클래스를 사용하여 각 스레드 별로 고유한 시큐리티 컨텍스트 정보를 사용합니다.
    * MODE_INHERITABLETHREADLOCAL 모드
        * InheritableThreadLocalSecurityContextHolderStrategy 클래스를 사용합니다.
        * 내부적으로 InheritableThreadLocal 클래스를 사용하여 각 스레드 별로 고유한 시큐리티 컨텍스트 정보를 사용합니다.
        * 특정 스레드가 자식 스레드를 만드는 경우 자식 스레드는 부모 스레드와 동일한 시큐리티 컨텍스트 정보를 사용합니다.
    * MODE_GLOBAL 모드
        * GlobalSecurityContextHolderStrategy 클래스를 사용합니다.
        * 정적(static) 변수를 사용하여 어플리케이션 전체에서 동일한 컨텍스트를 사용합니다.

```java
public class SecurityContextHolder {

    public static final String MODE_THREADLOCAL = "MODE_THREADLOCAL";

    public static final String MODE_INHERITABLETHREADLOCAL = "MODE_INHERITABLETHREADLOCAL";

    public static final String MODE_GLOBAL = "MODE_GLOBAL";

    private static final String MODE_PRE_INITIALIZED = "MODE_PRE_INITIALIZED";

    public static final String SYSTEM_PROPERTY = "spring.security.strategy";

    private static String strategyName = System.getProperty(SYSTEM_PROPERTY);

    private static SecurityContextHolderStrategy strategy;

    private static int initializeCount = 0;

    static {
        initialize();
    }

    private static void initialize() {
        initializeStrategy();
        initializeCount++;
    }

    private static void initializeStrategy() {
        if (MODE_PRE_INITIALIZED.equals(strategyName)) {
            Assert.state(strategy != null, "When using " + MODE_PRE_INITIALIZED
                    + ", setContextHolderStrategy must be called with the fully constructed strategy");
            return;
        }
        if (!StringUtils.hasText(strategyName)) {
            strategyName = MODE_THREADLOCAL;
        }
        if (strategyName.equals(MODE_THREADLOCAL)) {
            strategy = new ThreadLocalSecurityContextHolderStrategy();
            return;
        }
        if (strategyName.equals(MODE_INHERITABLETHREADLOCAL)) {
            strategy = new InheritableThreadLocalSecurityContextHolderStrategy();
            return;
        }
        if (strategyName.equals(MODE_GLOBAL)) {
            strategy = new GlobalSecurityContextHolderStrategy();
            return;
        }
        try {
            Class<?> clazz = Class.forName(strategyName);
            Constructor<?> customStrategy = clazz.getConstructor();
            strategy = (SecurityContextHolderStrategy) customStrategy.newInstance();
        }
        catch (Exception ex) {
            ReflectionUtils.handleReflectionException(ex);
        }
    }

    public static void setStrategyName(String strategyName) {
        SecurityContextHolder.strategyName = strategyName;
        initialize();
    }

    // other codes
}
```

## 2. SecurityContextHolderStrategy Classes

지금부터 각 전략 클래스들에 대해 살펴보겠습니다. 

### 2.1. ThreadLocalSecurityContextHolderStrategy Class

ThreadLocalSecurityContextHolderStrategy 클래스를 이해하려면 ThreadLocal 클래스에 대한 이해가 필요합니다. 
이번 포스트 주제에서 벗어나는 이야기이므로 간략한 개념만 살펴보겠습니다. 
자세한 내용은 [ThreadLocal Class][thread-local-class-in-java-link] 포스트를 참고하시길 바랍니다. 

> ThreadLocal 클래스는 JDK 1.2부터 지원된 기능입니다. ThreadLocal 클래스를 사용하면 각 스레드(thread)마다 특정 메모리 공간에 필요한 데이터를 저장하고 꺼내 사용할 수 있습니다. 스레드 별로 고유한 영역에 데이터를 보관하기 때문에 스레드 사이에 정보가 공유되는 일이 없습니다. 

ThreadLocalSecurityContextHolderStrategy 클래스는 ThreadLocal 클래스를 사용해 시큐리티 컨텍스트 정보를 보관합니다. 
스프링 시큐리티는 주로 서버 환경에서 사용되므로 요청을 처리하는 각 스레드 별로 고유한 컨텍스트 정보를 사용할 수 있도록 돕습니다. 

```java
final class ThreadLocalSecurityContextHolderStrategy implements SecurityContextHolderStrategy {

    private static final ThreadLocal<Supplier<SecurityContext>> contextHolder = new ThreadLocal<>();

    @Override
    public void clearContext() {
        contextHolder.remove();
    }

    @Override
    public SecurityContext getContext() {
        return getDeferredContext().get();
    }

    @Override
    public Supplier<SecurityContext> getDeferredContext() {
        Supplier<SecurityContext> result = contextHolder.get();
        if (result == null) {
            SecurityContext context = createEmptyContext();
            result = () -> context;
            contextHolder.set(result);
        }
        return result;
    }

    @Override
    public void setContext(SecurityContext context) {
        Assert.notNull(context, "Only non-null SecurityContext instances are permitted");
        contextHolder.set(() -> context);
    }

    @Override
    public void setDeferredContext(Supplier<SecurityContext> deferredContext) {
        Assert.notNull(deferredContext, "Only non-null Supplier instances are permitted");
        Supplier<SecurityContext> notNullDeferredContext = () -> {
            SecurityContext result = deferredContext.get();
            Assert.notNull(result, "A Supplier<SecurityContext> returned null and is not allowed.");
            return result;
        };
        contextHolder.set(notNullDeferredContext);
    }

    @Override
    public SecurityContext createEmptyContext() {
        return new SecurityContextImpl();
    }

}
```

요청 처리 실행 흐름에 따라 스레드가 시큐리티 컨텍스트를 사용하는 모습은 다음과 같습니다. 

* A 스레드, B 스레드, C 스레드는 자신만의 시큐리티 컨텍스트를 사용합니다.
* A 스레드가 요청 처리 중간에 별도 스레드를 만듭니다.
* A 스레드의 자식 A' 스레드는 A 스레드의 시큐리티 컨텍스트 정보를 알 수 없습니다.

<p align="center">
    <img src="/images/security-context-holder-strategy-1.JPG" width="80%" class="image__border">
</p>

#### 2.1.1. Test

테스트 코드를 통해 동작 결과를 확인해보겠습니다. 

* 테스트를 위한 인증 토큰 정보를 생성합니다.
* 토큰을 시큐리티 컨텍스트에 저장합니다.
* 자식 스레드를 만들고 실행합니다.
    * 자식 스레드는 SecurityContextHolder 클래스에 담긴 시큐리티 컨텍스트 정보를 획득합니다.
* CompletableFuture 클래스를 사용해 이미 생성되어 있는 스레드 풀(fork-join pool)을 사용합니다.
    * 해당 스레드는 SecurityContextHolder 클래스에 담긴 시큐리티 컨텍스트 정보를 획득합니다.
* 각 스레드에서 추출한 시큐리티 컨텍스트에 인증 정보가 담겨 있는지 확인합니다.

```java
package action.in.blog;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ThreadLocalModeTest {

    @Test
    void threadLocalMode() throws InterruptedException {

        var testingToken = new TestingAuthenticationToken("Junhyunny", "12345", "ROLE_USER");
        var securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(testingToken);
        SecurityContextHolder.setContext(securityContext);


        var contextArray = new SecurityContext[2];
        var thread = new Thread(() -> {
            var context = SecurityContextHolder.getContext();
            contextArray[0] = context;
        });
        thread.start();
        thread.join();

        var future = CompletableFuture.runAsync(() -> {
            var context = SecurityContextHolder.getContext();
            contextArray[1] = context;
        });
        future.join();


        var result = SecurityContextHolder.getContext();
        assertEquals(testingToken, result.getAuthentication());
        assertNull(contextArray[0].getAuthentication());
        assertNull(contextArray[1].getAuthentication());
        System.out.println("Fin");
    }
}
```

##### Result 

* 테스트 메인 스레드에서 획득한 시큐리티 컨텍스트에는 정상적으로 테스트 토큰이 담겨 있습니다.
* 자식 스레드에서 획득한 시큐리티 컨텍스트에는 토큰 정보가 담겨있지 않습니다.
* 스레드 풀의 스레드에서 획득한 시큐리티 컨텍스트에는 토큰 정보가 담겨있지 않습니다.

```
Fin
```

### 2.2. InheritableThreadLocalSecurityContextHolderStrategy Class

InheritableThreadLocalSecurityContextHolderStrategy 클래스는 InheritableThreadLocal 클래스를 사용해 시큐리티 컨텍스트 정보를 보관합니다. 
InheritableThreadLocal 클래스는 ThreadLocal 클래스와 다르게 자식 스레드까지 저장된 정보를 이어줍니다. 

```java
final class InheritableThreadLocalSecurityContextHolderStrategy implements SecurityContextHolderStrategy {

    private static final ThreadLocal<Supplier<SecurityContext>> contextHolder = new InheritableThreadLocal<>();

    @Override
    public void clearContext() {
        contextHolder.remove();
    }

    @Override
    public SecurityContext getContext() {
        return getDeferredContext().get();
    }

    @Override
    public Supplier<SecurityContext> getDeferredContext() {
        Supplier<SecurityContext> result = contextHolder.get();
        if (result == null) {
            SecurityContext context = createEmptyContext();
            result = () -> context;
            contextHolder.set(result);
        }
        return result;
    }

    @Override
    public void setContext(SecurityContext context) {
        Assert.notNull(context, "Only non-null SecurityContext instances are permitted");
        contextHolder.set(() -> context);
    }

    @Override
    public void setDeferredContext(Supplier<SecurityContext> deferredContext) {
        Assert.notNull(deferredContext, "Only non-null Supplier instances are permitted");
        Supplier<SecurityContext> notNullDeferredContext = () -> {
            SecurityContext result = deferredContext.get();
            Assert.notNull(result, "A Supplier<SecurityContext> returned null and is not allowed.");
            return result;
        };
        contextHolder.set(notNullDeferredContext);
    }

    @Override
    public SecurityContext createEmptyContext() {
        return new SecurityContextImpl();
    }
}
```

요청 처리 실행 흐름에 따라 스레드가 시큐리티 컨텍스트를 사용하는 모습은 다음과 같습니다. 

* A 스레드, B 스레드, C 스레드는 자신만의 시큐리티 컨텍스트를 사용합니다.
* A 스레드가 요청 처리 중간에 별도 스레드를 만듭니다.
* A 스레드의 자식 A' 스레드도 A 스레드의 시큐리티 컨텍스트 정보를 함께 사용합니다.

<p align="center">
    <img src="/images/security-context-holder-strategy-2.JPG" width="80%" class="image__border">
</p>

#### 2.2.1. Test

테스트 코드를 통해 동작 결과를 확인해보겠습니다. 

* SecurityContextHolder 클래스의 시큐리티 컨텍스트 보관 전략을 `MODE_INHERITABLETHREADLOCAL`로 변경합니다.
* 테스트를 위한 인증 토큰 정보를 생성합니다.
* 토큰을 시큐리티 컨텍스트에 저장합니다.
* 자식 스레드를 만들고 실행합니다.
    * 자식 스레드는 SecurityContextHolder 클래스에 담긴 시큐리티 컨텍스트 정보를 획득합니다.
* CompletableFuture 클래스를 사용해 이미 생성되어 있는 스레드 풀을 사용합니다.
    * 해당 스레드는 SecurityContextHolder 클래스에 담긴 시큐리티 컨텍스트 정보를 획득합니다.
* 각 스레드에서 추출한 시큐리티 컨텍스트에 인증 정보가 담겨 있는지 확인합니다.

```java
package action.in.blog;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

public class InheritableThreadLocalModeTest {

    @Test
    void inheritableThreadLocalMode() throws InterruptedException {

        SecurityContextHolder.setStrategyName(SecurityContextHolder.MODE_INHERITABLETHREADLOCAL);
        var testingToken = new TestingAuthenticationToken("Junhyunny", "12345", "ROLE_USER");
        var securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(testingToken);
        SecurityContextHolder.setContext(securityContext);


        var contextArray = new SecurityContext[2];
        var thread = new Thread(() -> {
            var context = SecurityContextHolder.getContext();
            contextArray[0] = context;
        });
        thread.start();
        thread.join();

        var future = CompletableFuture.runAsync(() -> {
            var context = SecurityContextHolder.getContext();
            contextArray[1] = context;
        });
        future.join();


        var result = SecurityContextHolder.getContext();
        assertEquals(testingToken, result.getAuthentication());
        assertEquals(testingToken, contextArray[0].getAuthentication());
        assertNull(contextArray[1].getAuthentication());
        System.out.println("Fin");
    }

}
```

##### Result

* 테스트 메인 스레드에서 획득한 시큐리티 컨텍스트에는 정상적으로 테스트 토큰이 담겨 있습니다.
* 자식 스레드에서 획득한 시큐리티 컨텍스트에는 정상적으로 테스트 토큰이 담겨 있습니다.
    * 자식 스레드에서 획득한 인증 토근은 메인 스레드에서 생성한 토큰과 동일합니다.
* 스레드 풀의 스레드에서 획득한 시큐리티 컨텍스트에는 토큰 정보가 담겨있지 않습니다.
    * CompletableFuture 클래스는 이미 만들어져있는 스레드 풀을 사용하기 때문에 자식 스레드가 아닙니다.

```
Fin
```

### 2.3. GlobalSecurityContextHolderStrategy Class

클래스 정적 변수를 사용해 시큐리티 컨텍스트를 보관합니다. 
이를 통해 어플리케이션 영역 어디에서든 동일한 시큐리티 컨텍스트를 획득할 수 있습니다. 
서버처럼 다중 스레드가 사용되는 환경에서는 동시성 문제를 일으키기 때문에 사용할 수 없습니다. 
Java 스윙(swing)처럼 동일한 스레드를 사용하는 클라이언트 환경에서 사용합니다.

```java
final class GlobalSecurityContextHolderStrategy implements SecurityContextHolderStrategy {

    private static SecurityContext contextHolder;

    @Override
    public void clearContext() {
        contextHolder = null;
    }

    @Override
    public SecurityContext getContext() {
        if (contextHolder == null) {
            contextHolder = new SecurityContextImpl();
        }
        return contextHolder;
    }

    @Override
    public void setContext(SecurityContext context) {
        Assert.notNull(context, "Only non-null SecurityContext instances are permitted");
        contextHolder = context;
    }

    @Override
    public SecurityContext createEmptyContext() {
        return new SecurityContextImpl();
    }

}
```

요청 처리 실행 흐름에 따라 스레드가 시큐리티 컨텍스트를 사용하는 모습은 다음과 같습니다. 

* A 스레드, B 스레드, C 스레드 모두 동일한 시큐리티 컨텍스트를 사용합니다. 
* A 스레드가 요청 처리 중간에 별도 스레드를 만듭니다.
* A 스레드의 자식 A' 스레드도 전역으로 사용되는 시큐리티 컨텍스트를 공유합니다.

<p align="center">
    <img src="/images/security-context-holder-strategy-3.JPG" width="80%" class="image__border">
</p>

#### 2.3.1. Test

* SecurityContextHolder 클래스의 시큐리티 컨텍스트 보관 전략을 `MODE_GLOBAL`로 변경합니다.
* 테스트를 위한 인증 토큰 정보를 생성합니다.
* 토큰을 시큐리티 컨텍스트에 저장합니다.
* 자식 스레드를 만들고 실행합니다.
    * 자식 스레드는 SecurityContextHolder 클래스에 담긴 시큐리티 컨텍스트 정보를 획득합니다.
* CompletableFuture 클래스를 사용해 이미 생성되어 있는 스레드 풀을 사용합니다.
    * 해당 스레드는 SecurityContextHolder 클래스에 담긴 시큐리티 컨텍스트 정보를 획득합니다.
* 각 스레드에서 추출한 시큐리티 컨텍스트에 인증 정보가 담겨 있는지 확인합니다.

```java
package action.in.blog;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class GlobalThreadLocalModeTest {

    @Test
    void globalMode() throws InterruptedException {

        SecurityContextHolder.setStrategyName(SecurityContextHolder.MODE_GLOBAL);
        var testingToken = new TestingAuthenticationToken("Junhyunny", "12345", "ROLE_USER");
        var securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(testingToken);
        SecurityContextHolder.setContext(securityContext);


        var contextArray = new SecurityContext[2];
        var thread = new Thread(() -> {
            var context = SecurityContextHolder.getContext();
            contextArray[0] = context;
        });
        thread.start();
        thread.join();

        var future = CompletableFuture.runAsync(() -> {
            var context = SecurityContextHolder.getContext();
            contextArray[1] = context;
        });
        future.join();


        var result = SecurityContextHolder.getContext();
        assertEquals(testingToken, result.getAuthentication());
        assertEquals(testingToken, contextArray[0].getAuthentication());
        assertEquals(testingToken, contextArray[1].getAuthentication());
        System.out.println("Fin");
    }
}
```

##### Result

* 테스트 메인 스레드에서 획득한 시큐리티 컨텍스트에는 정상적으로 테스트 토큰이 담겨 있습니다.
* 자식 스레드에서 획득한 시큐리티 컨텍스트에는 정상적으로 테스트 토큰이 담겨 있습니다.
    * 자식 스레드에서 획득한 인증 토근은 메인 스레드에서 생성한 토큰과 동일합니다.
* 스레드 풀의 스레드에서 획득한 시큐리티 컨텍스트에는 정상적으로 테스트 토큰이 담겨 있습니다.
    * 자식 스레드에서 획득한 인증 토근은 메인 스레드에서 생성한 토큰과 동일합니다.

```
Fin
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-09-30-security-context-holder-strategy>

[strategy-pattern-link]: https://junhyunny.github.io/information/design-pattern/strategy-pattern/
[thread-local-class-in-java-link]: https://junhyunny.github.io/java/thread-local-class-in-java/