---
title: "Observer Pattern"
search: false
category:
  - information
  - design-pattern
last_modified_at: 2022-03-14T23:55:00
---

<br/>

👉 이어서 읽기를 추천합니다.
- [Spring Application Context Event][spring-application-context-event-link] 

## 1. 옵저버 패턴(Observer Pattern)

> 객체 사이에 일 대 다의 의존 관계를 정의해 두어, 
> 어떤 객체의 상태가 변할 때 그 객체에 의존성을 가진 다른 객체들이 그 변화를 통지받고 자동으로 갱신될 수 있게 만듭니다.

`GoF 디자인 패턴` 책을 보면 어렵게 설명되어 있지만, 많은 개발자 분들께 친숙한 발행(publish)과 구독(subscribe) 모델을 생각하면 이해가 쉽습니다.
- 옵저버(observer)들은 자신이 관심있는 정보를 구독하기 위해 자신을 정보 관리하는 곳에 등록합니다.
- 옵저버들은 상태 변경에 대한 알림을 받습니다.

##### 옵저버 패턴 클래스 다이어그램
- 옵저버 패턴을 이해하기 위해선 패턴을 이루는 몇 가지 요소들에 대해 이해할 필요가 있습니다.
- 서브젝트(Subject)
    - 옵저버들을 알고 있는 클래스입니다.
    - 임의의 다수 옵저버들은 서브젝트 객체를 관찰합니다.
- 상세 서브젝트(Concrete Subject)
    - 옵저버 객체에게 알려줘야하는 상태를 저장하고 있는 클래스입니다. 
    - 상태가 변경되면 감시자들에게 이를 알려야합니다.
- 옵저버(Observer)
    - 서브젝트에 관심이 있는 인터페이스입니다. 
- 상세 옵저버(Concrete Observer)
    - 옵저버 인터페이스를 구현한 클래스입니다.(implement)
    - 서브젝트 클래스에서 상태 변화가 발생했을 때 주는 알림을 통해 자신의 상태를 업데이트합니다.

<p align="center">
    <img src="/images/observer-pattern-1.JPG" width="80%" class="image__border">
</p>
<center>https://croute.me/316</center>

## 2. Observer pattern in Spring 

옵저버 패턴과 관련된 포스트들을 보면 좋은 예시 코드들이 많고, 특별한 시나리오가 떠오르지 않아서 이번엔 별도로 구현하진 않았습니다. 
`Spring` 프레임워크에서 옵저버 패턴이 적용된 케이스를 찾아보겠습니다. 

### 2.1. ApplicationEventMulticaster 인터페이스
- 서브젝트 클래스가 수행할 일들을 추상화시킨 인터페이스입니다.

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
- `AbstractApplicationEventMulticaster` 클래스는 옵저버 패턴에서 서브젝트 클래스에 해당합니다.
- 추상 클래스이므로 이를 상속받은 클래스가 존재합니다.
- 리스너(listener)들을 추가하고, 제거하는 역할을 수행합니다.
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
- `SimpleApplicationEventMulticaster` 클래스는 옵저버 패턴에서 서브젝트 클래스에 해당합니다.
- 추상 클래스인 `AbstractApplicationEventMulticaster`의 기능을 확장합니다.
- 자신이 관리하는 리스너들에게 이벤트를 전달하는 역할을 수행합니다.
    - `multicastEvent` 메서드

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
- `ApplicationListener` 인터페이스는 옵저버 패턴에서 옵저버 인터페이스에 해당합니다.
- 옵저버들이 자신의 상태를 업데이트 할 수 있는 메서드를 제공합니다.
    - `onApplicationEvent` 메서드

```java
package org.springframework.context;

import java.util.EventListener;

@FunctionalInterface
public interface ApplicationListener<E extends ApplicationEvent> extends EventListener {
    void onApplicationEvent(E var1);
}
```

### 2.5. OrderEventListener 클래스
- `OrderEventListener` 클래스는 옵저버 패턴에서 상세 옵저버 클래스에 해당합니다.
- 서브젝크 클래스로부터 업데이트 알림을 받아 자신의 상태를 변경합니다.
    - `listenOrderDeliveryCompleteEvent` 메서드

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

`GoF 디자인 패턴` 책에서 옵저버 패턴을 구현할 때 몇 가지 고민할 사항들을 알려주고 있습니다. 
몇 가지 공감되는 내용들을 가져와봤습니다.  

### 3.1. 값을 갱신시키는 주체는 누구?

상태 값들을 변경했다면 이를 옵저버들에게 알려주기 위한 `notify` 호출은 누가할지 결정해야합니다. 
값을 갱신시키는 방법을 크게 두 가지로 보고 있습니다. 

##### 서브젝트 클래스가 수행

상태 값의 변경이 일어나면 자신이 관리하는 옵저버들에게 이를 알립니다. 
이 방법의 장점은 사용자가 상태를 변경하면 다른 옵저버들에게 알림이 가기 때문에 편하다는 점입니다. 
단점은 상태 변경이 많다면 잦은 업데이트가 일어난다는 점입니다.
간단하게 코드를 보고 이해하면 다음과 같습니다.

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

##### 사용자가 직접 수행

사용자가 적시에 서브젝트 클래스의 `notify` 메서드를 호출합니다. 
장점은 상태 변경이 된 최종 모습만 보고 싶은 사용자라면 자신이 보고 싶을 때까지 상태 갱신을 미룰 수 있습니다. 
중간에 불필요한 수정이 일어나지 않습니다. 
단점은 사용자가 추가적인 코드를 작성해야 한다는 것입니다. 
이럴 경우 사용자가 호출을 하지 않는 경우 값이 갱신되지 않는 버그가 발생할 수 있습니다.
간단하게 코드를 보고 이해하면 다음과 같습니다. 

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