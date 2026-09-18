---
title: "옵저버 패턴(Observer Pattern)"
search: false
category:
  - information
  - design-pattern
last_modified_at: 2026-09-19T01:29:54+09:00
---

<br/>

#### RECOMMEND NEXT POSTS

- [스프링 애플리케이션 컨텍스트 이벤트(Spring Application Context Event)][spring-application-context-event-link]

## 1. 옵저버 패턴(Observer Pattern)

> 객체 사이에 일 대 다의 의존 관계를 정의해 두어, 어떤 객체의 상태가 변할 때 그 객체에 의존성을 가진 다른 객체들이 그 변화를 통지받고 자동으로 갱신될 수 있게 만듭니다.

`GoF 디자인 패턴` 책에는 어렵게 설명되어 있지만, 많은 개발자에게 친숙한 발행(publish)과 구독(subscribe) 모델을 생각하면 이해하기 쉽다.

- 옵저버(observer)들은 자신이 관심 있는 정보를 구독하기 위해 자신을 정보 관리하는 곳에 등록한다.
- 옵저버들은 상태 변경에 대한 알림을 받는다.

옵저버 패턴의 클래스 다이어그램을 살펴보자. 옵저버 패턴은 다음과 같은 요소로 구성된다.

- 서브젝트(Subject)
  - 옵저버들을 알고 있는 클래스이다.
  - 다수의 옵저버가 서브젝트 객체를 관찰한다.
- 상세 서브젝트(Concrete Subject)
  - 옵저버 객체에 알려야 하는 상태를 저장하는 클래스이다.
  - 상태가 변경되면 옵저버들에게 이를 알려야 한다.
- 옵저버(Observer)
  - 서브젝트의 상태 변화를 통지받는 객체의 인터페이스이다.
- 상세 옵저버(Concrete Observer)
  - 옵저버 인터페이스를 구현한 클래스이다(implement).
  - 서브젝트 클래스의 상태가 변할 때 전달되는 알림을 통해 자신의 상태를 업데이트한다.

<div align="center">
  <img src="{{ site.image_url_2022 }}/observer-pattern-01.png" width="80%" class="image__border">
</div>
<center>https://croute.me/316</center>

## 2. Observer pattern in Spring

옵저버 패턴과 관련된 글에는 좋은 예시 코드가 많고 특별한 시나리오가 떠오르지 않아 이번에는 별도로 구현하지 않았다. 스프링 프레임워크(Spring Framework)에 옵저버 패턴이 적용된 사례를 살펴보겠다.

### 2.1. ApplicationEventMulticaster 인터페이스

서브젝트 클래스가 수행할 기능을 추상화한 인터페이스이다.

```java
package org.springframework.context.event;

import org.springframework.context.ApplicationEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.ResolvableType;
import org.springframework.lang.Nullable;

public interface ApplicationEventMulticaster {
    
    void addApplicationListener(ApplicationListener<?> var1);

    void addApplicationListenerBean(String var1);

    void removeApplicationListener(ApplicationListener<?> var1);

    void removeApplicationListenerBean(String var1);

    void removeAllListeners();

    void multicastEvent(ApplicationEvent var1);

    void multicastEvent(ApplicationEvent var1, @Nullable ResolvableType var2);
}
```

### 2.2. AbstractApplicationEventMulticaster 클래스

`AbstractApplicationEventMulticaster` 클래스는 옵저버 패턴에서 서브젝트 클래스에 해당한다. 추상 클래스이므로 이를 상속받은 클래스가 존재한다.

- 리스너(listener)들을 추가하고 제거하는 역할을 수행한다.
  - `addApplicationListener` 메서드
  - `addApplicationListenerBean` 메서드
  - `removeApplicationListener` 메서드
  - `removeApplicationListenerBean` 메서드
  - `removeAllListeners` 메서드

```java
package org.springframework.context.event;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.aop.framework.AopProxyUtils;
import org.springframework.beans.factory.BeanClassLoaderAware;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.beans.factory.BeanFactoryAware;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.ConfigurableBeanFactory;
import org.springframework.context.ApplicationEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.ResolvableType;
import org.springframework.core.annotation.AnnotationAwareOrderComparator;
import org.springframework.lang.Nullable;
import org.springframework.util.Assert;
import org.springframework.util.ClassUtils;
import org.springframework.util.ObjectUtils;

public abstract class AbstractApplicationEventMulticaster implements ApplicationEventMulticaster, BeanClassLoaderAware, BeanFactoryAware {
    
    private final AbstractApplicationEventMulticaster.ListenerRetriever defaultRetriever = new AbstractApplicationEventMulticaster.ListenerRetriever(false);

    final Map<AbstractApplicationEventMulticaster.ListenerCacheKey, AbstractApplicationEventMulticaster.ListenerRetriever> retrieverCache = new ConcurrentHashMap(64);

    public void addApplicationListener(ApplicationListener<?> listener) {
        synchronized(this.retrievalMutex) {
            Object singletonTarget = AopProxyUtils.getSingletonTarget(listener);
            if (singletonTarget instanceof ApplicationListener) {
                this.defaultRetriever.applicationListeners.remove(singletonTarget);
            }
            this.defaultRetriever.applicationListeners.add(listener);
            this.retrieverCache.clear();
        }
    }

    public void addApplicationListenerBean(String listenerBeanName) {
        synchronized(this.retrievalMutex) {
            this.defaultRetriever.applicationListenerBeans.add(listenerBeanName);
            this.retrieverCache.clear();
        }
    }

    public void removeApplicationListener(ApplicationListener<?> listener) {
        synchronized(this.retrievalMutex) {
            this.defaultRetriever.applicationListeners.remove(listener);
            this.retrieverCache.clear();
        }
    }

    public void removeApplicationListenerBean(String listenerBeanName) {
        synchronized(this.retrievalMutex) {
            this.defaultRetriever.applicationListenerBeans.remove(listenerBeanName);
            this.retrieverCache.clear();
        }
    }

    public void removeAllListeners() {
        synchronized(this.retrievalMutex) {
            this.defaultRetriever.applicationListeners.clear();
            this.defaultRetriever.applicationListenerBeans.clear();
            this.retrieverCache.clear();
        }
    }
    
    // ...
}
```

### 2.3. SimpleApplicationEventMulticaster 클래스

`SimpleApplicationEventMulticaster` 클래스는 옵저버 패턴에서 서브젝트 클래스에 해당한다.

- 추상 클래스인 `AbstractApplicationEventMulticaster`의 기능을 확장한다.
- `multicastEvent` 메서드: 자신이 관리하는 리스너들에게 이벤트를 전달하는 역할을 수행한다.

```java
package org.springframework.context.event;

import java.util.Iterator;
import java.util.concurrent.Executor;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.context.ApplicationEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.ResolvableType;
import org.springframework.lang.Nullable;
import org.springframework.util.ErrorHandler;

public class SimpleApplicationEventMulticaster extends AbstractApplicationEventMulticaster {

    @Nullable
    private Executor taskExecutor;

    @Nullable
    private ErrorHandler errorHandler;

    public SimpleApplicationEventMulticaster() {
    }

    public SimpleApplicationEventMulticaster(BeanFactory beanFactory) {
        this.setBeanFactory(beanFactory);
    }

    public void setTaskExecutor(@Nullable Executor taskExecutor) {
        this.taskExecutor = taskExecutor;
    }

    @Nullable
    protected Executor getTaskExecutor() {
        return this.taskExecutor;
    }

    public void setErrorHandler(@Nullable ErrorHandler errorHandler) {
        this.errorHandler = errorHandler;
    }

    @Nullable
    protected ErrorHandler getErrorHandler() {
        return this.errorHandler;
    }

    public void multicastEvent(ApplicationEvent event) {
        this.multicastEvent(event, this.resolveDefaultEventType(event));
    }

    public void multicastEvent(ApplicationEvent event, @Nullable ResolvableType eventType) {
        ResolvableType type = eventType != null ? eventType : this.resolveDefaultEventType(event);
        Executor executor = this.getTaskExecutor();
        Iterator var5 = this.getApplicationListeners(event, type).iterator();
        while(var5.hasNext()) {
            ApplicationListener<?> listener = (ApplicationListener)var5.next();
            if (executor != null) {
                executor.execute(() -> {
                    this.invokeListener(listener, event);
                });
            } else {
                this.invokeListener(listener, event);
            }
        }

    }

    private ResolvableType resolveDefaultEventType(ApplicationEvent event) {
        return ResolvableType.forInstance(event);
    }

    protected void invokeListener(ApplicationListener<?> listener, ApplicationEvent event) {
        ErrorHandler errorHandler = this.getErrorHandler();
        if (errorHandler != null) {
            try {
                this.doInvokeListener(listener, event);
            } catch (Throwable var5) {
                errorHandler.handleError(var5);
            }
        } else {
            this.doInvokeListener(listener, event);
        }
    }

    private void doInvokeListener(ApplicationListener listener, ApplicationEvent event) {
        try {
            listener.onApplicationEvent(event);
        } catch (ClassCastException var6) {
            String msg = var6.getMessage();
            if (msg != null && !this.matchesClassCastMessage(msg, event.getClass())) {
                throw var6;
            }
            Log logger = LogFactory.getLog(this.getClass());
            if (logger.isTraceEnabled()) {
                logger.trace("Non-matching event type for listener: " + listener, var6);
            }
        }
    }

    private boolean matchesClassCastMessage(String classCastMessage, Class<?> eventClass) {
        if (classCastMessage.startsWith(eventClass.getName())) {
            return true;
        } else if (classCastMessage.startsWith(eventClass.toString())) {
            return true;
        } else {
            int moduleSeparatorIndex = classCastMessage.indexOf(47);
            return moduleSeparatorIndex != -1 && classCastMessage.startsWith(eventClass.getName(), moduleSeparatorIndex + 1);
        }
    }
}
```

### 2.4. ApplicationListener 인터페이스

`ApplicationListener` 인터페이스는 옵저버 패턴에서 옵저버 인터페이스에 해당한다.

- `onApplicationEvent` 메서드: 옵저버들이 자신의 상태를 업데이트할 수 있는 메서드를 제공한다.

```java
package org.springframework.context;

import java.util.EventListener;

@FunctionalInterface
public interface ApplicationListener<E extends ApplicationEvent> extends EventListener {
    void onApplicationEvent(E var1);
}
```

### 2.5. OrderEventListener 클래스

`OrderEventListener` 클래스는 옵저버 패턴에서 상세 옵저버 클래스에 해당한다.

- `listenOrderDeliveryCompleteEvent` 메서드: 서브젝트 클래스로부터 업데이트 알림을 받아 자신의 상태를 변경한다.

```java
package blog.in.action.order.listner;

import blog.in.action.common.event.OrderDeliveryCompleteEvent;
import blog.in.action.order.service.OrderService;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class OrderEventListener {

    private final OrderService orderService;

    public OrderEventListener(OrderService orderService) {
        this.orderService = orderService;
    }

    @EventListener
    public void listenOrderDeliveryCompleteEvent(OrderDeliveryCompleteEvent orderDeliveryCompleteEvent) {
        orderService.updateOrderDeliveryComplete(orderDeliveryCompleteEvent.getOrderId(), orderDeliveryCompleteEvent.getDeliveryCode());
    }
}
```

## 3. 구현 시 고려 사항

`GoF 디자인 패턴` 책에서는 옵저버 패턴을 구현할 때 고려할 사항을 소개한다. 그중 공감한 내용을 정리했다.

### 3.1. 값을 갱신시키는 주체는 누구?

상태 값을 변경했다면 이를 옵저버들에게 알리는 `notify` 메서드를 누가 호출할지 결정해야 한다. 값을 갱신하는 방법은 크게 두 가지로 나눌 수 있다.

- 서브젝트 클래스가 수행한다.
- 사용자가 직접 수행한다.

서브젝트 클래스가 수행하는 방식을 먼저 살펴보자. 상태가 변경되면 자신이 관리하는 옵저버들에게 이를 알린다. 이 방법은 사용자가 상태를 변경할 때 다른 옵저버들에게 자동으로 알림을 보내므로 편리하다. 반면 상태가 자주 변경되면 불필요한 업데이트가 반복될 수 있다.

코드로 살펴보면 다음과 같다.

```java
class Subject {

    // ...

    public void chageState(State state) {
        this.state = state;
        this.notify();
    }

    public void notify() {
        for (Observer observer : observers) {
            observer.update();
        }
    }
}
```

사용자가 직접 수행하는 방식은 어떨까? 사용자가 적절한 시점에 서브젝트 클래스의 `notify` 메서드를 호출한다. 이 방식은 원하는 시점까지 알림을 미뤄 최종 상태만 전달할 수 있으므로 중간 상태 변경으로 인한 불필요한 업데이트가 발생하지 않는다. 단점은 사용자가 추가 코드를 작성해야 한다는 것이다. 사용자가 `notify` 메서드 호출을 누락하면 값이 갱신되지 않는 버그가 발생할 수 있다.

코드로 살펴보면 다음과 같다.

```java
class Client {

    private Subject subject;

    // ...

    public void doingSomething() {

        // ... doing something

        this.subject.notify();
    }
}
```

#### REFERENCE

- [Design Patterns: Elements of Reusable Object Oriented Software][design-pattern-book-link]
- [Vanilla Javascript로 상태관리 시스템 만들기][make-state-management-system-link]
- <https://k0102575.github.io/articles/2020-04/observer-pattern>
- <https://junhyunny.github.io/spring-boot/spring-application-context-event/>

[spring-application-context-event-link]: https://junhyunny.github.io/spring-boot/spring-application-context-event/
[design-pattern-book-link]: https://www.kyobobook.co.kr/product/detailViewKor.laf?mallGb=KOR&ejkGb=KOR&barcode=9791195444953
[make-state-management-system-link]: https://junilhwang.github.io/TIL/Javascript/Design/Vanilla-JS-Store/#_1-%E1%84%8B%E1%85%B5%E1%86%AF%E1%84%83%E1%85%A1%E1%86%AB-%E1%84%80%E1%85%AE%E1%84%92%E1%85%A7%E1%86%AB%E1%84%92%E1%85%A2%E1%84%87%E1%85%A9%E1%84%80%E1%85%B5
