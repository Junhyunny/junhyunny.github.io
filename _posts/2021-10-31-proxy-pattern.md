---
title: "Proxy Pattern"
search: false
category:
  - information
  - design-pattern
last_modified_at: 2021-10-31T23:55:00
---

<br/>

## 1. 프록시 패턴(Proxy Pattern)

> 프록시(Proxy) - 대리자, 대리인

패턴 이름처럼 대리인이 존재하여 일을 대신 수행해주는 패턴입니다. 
프록시 객체는 실제 서비스를 수행하는 객체를 멤버로 지니고 있으며, 외부의 요청을 대신 받습니다. 
실제 기능을 제공하는 객체에 대한 접근을 제어할 수 있습니다. 
일단 구조는 어떻게 되어 있는지 확인하고, 어떤 장단점이 존재하는지 알아보겠습니다. 

### 1.1. 구조
- 클라이언트 클래스(Client) - Subject 인터페이스가 제공하는 기능을 사용하는 클래스
- 주체 인터페이스(Subject) - Proxy, RealSubject 클래스가 제공해야하는 기능이나 서비스를 명시한 인터페이스
- 프록시 클래스(Proxy) - Client 클래스의 요청을 대신 받아서 RealSubject 클래스에게 전달하는 클래스
- 주체 클래스(RealSubject) - 실제 제공하는 기능이나 서비스를 구현한 클래스

<p align="center"><img src="/images/proxy-pattern-1.JPG" width="75%"></p>
<center>hthttps://en.wikipedia.org/wiki/Proxy_pattern</center>

### 1.2. 장점
- 주체 클래스가 로딩(loading)되기 전에 프록시 클래스를 통해 참조 가능합니다. 
- 주체 클래스를 수정하지 않고 프록시 클래스를 통해 요청과 기능 수행 사이의 필요한 로직(logic)을 추가할 수 있습니다.
- 주체 클래스에 대한 접근 제어 및 보호가 가능합니다.

### 1.3. 단점
- 불필요하게 생성된 프록시 클래스는 코드의 가독성을 떨어뜨릴 수 있습니다.
- 객체 생성이 한 단계 더 늘어났기 때문에 잦은 객체 생성은 성능을 나쁘게 만듭니다. 

## 2. 프록시 패턴 종류

많은 종류의 프록시 패턴이 있지만, 대표적인 세 가지만 정리해보았습니다. 

- 가상 프록시(Virtual Proxy)
    - 요청이 있을 때에만 필요한 고비용 객체를 생성합니다.
    - 필요 시점까지 객체의 생성을 연기하면서 해당 객체가 생성된 것처럼 동작하도록 만드는 패턴입니다. 
    - 만드는데 많은 비용이 들어가는 객체에 대한 생성, 접근 시점을 제어합니다. 
- 원격 프로시(Remote Proxy)
    - 다른 시스템에 위치하는 원격 객체의 역할을 대신 수행합니다. 
    - 원격 프록시 객체가 대변하는 원격 시스템에 위치한 객체를 마치 로컬(local)에 있는 것처럼 사용할 수 있습니다. 
- 보호 프록시(Protection Proxy)
    - 주체 클래스에 대한 접근을 제어하기 위해 사용합니다. 
    - 클라이언트 객체가 주체 클래스에 대한 접근시 이를 허용할 것인지 아닌지에 대한 제어를 수행합니다. 
    - 클라이언트 별로 접근 제어 권한이 다를 때 유용하게 사용됩니다. 

## 3. 프록시 패턴 예시

### 3.1. 가상 프록시(Virtual Proxy)
요청이 있을 때까지 고비용 객체 생성을 미루는 프록시 패턴입니다. 
하지만, 이번 테스트 코드에서 색다르게 변형하였습니다. 
생성은 쉽지만 사용하기 위해 준비되기까지 많은 비용이 소모되는 시나리오로 구성하였습니다.

#### 3.1.1. VirtualSubject 인터페이스

```java
package blog.in.action.proxy.virtual;

public interface VirtualSubject {

    void print() throws InterruptedException;
}
```

#### 3.1.2. VirtualRealSubject 클래스
- 주체 클래스이며, 출력(print)하기 위해선 2개의 아이템이 필요합니다.
- 각 아이템이 준비되는데 걸리는 시간은 첫번째 아이템이 1초, 두번째 아이템이 3초입니다. 
- 주체 클래스에 대한 객체가 생성될 때 스레드를 이용해 각 아이템들을 준비합니다.
- 준비되지 않은 상태에서 주체 클래스의 `print()` 메소드 호출시 예외(exception)가 발생합니다.

```java
package blog.in.action.proxy.virtual;

import java.util.concurrent.CompletableFuture;
import lombok.extern.log4j.Log4j2;

@Log4j2
public class VirtualRealSubject implements VirtualSubject {

    private boolean firstItemLoadedFlag;

    private boolean secondItemLoadedFlag;

    private void loadFirstItem() {
        try {
            Thread.sleep(1000);
            firstItemLoadedFlag = true;
            log.info("first item is loaded.");
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    private void loadSecondItem() {
        try {
            Thread.sleep(3000);
            secondItemLoadedFlag = true;
            log.info("second item is loaded.");
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public VirtualRealSubject() {
        CompletableFuture.runAsync(this::loadFirstItem);
        CompletableFuture.runAsync(this::loadSecondItem);
    }

    public boolean isReady() {
        return firstItemLoadedFlag && secondItemLoadedFlag;
    }

    @Override
    public void print() {
        if (!isReady()) {
            throw new RuntimeException("not ready to print");
        }
        log.info("print something");
    }
}
```

#### 3.1.3. VirtualProxy 클래스
- 클라이언트 객체가 사용하는 가상 프록시 클래스입니다. 
- `print()` 메소드 호출시 주체 클래스 객체가 준비되지 않았다면 계속 대기합니다.

```java
package blog.in.action.proxy.virtual;

import lombok.extern.log4j.Log4j2;

@Log4j2
public class VirtualProxy implements VirtualSubject {

    private VirtualRealSubject realSubject;

    public VirtualProxy() {
        realSubject = new VirtualRealSubject();
    }

    @Override
    public void print() throws InterruptedException {
        while (!realSubject.isReady()) {
            Thread.sleep(500);
            log.info("waiting");
        }
        realSubject.print();
    }
}
```

#### 3.1.4. Client 클래스
- printByVirtualProxy 메소드
    - 가상 프록시 객체를 생성 후 즉각 출력을 수행합니다.
- printByVirtualProxyAfterCountFive 메소드 
    - 가상 프록시 객체를 생성합니다.
    - 5초동안 숫자를 세는 일을 수행합니다.
    - 숫자 세는 일을 마치고 출력을 수행합니다.
    - 숫자를 세는 일은 예시이므로 클라이언트 객체가 필요한 로직을 수행하였다고 가정합니다.

```java
package blog.in.action.proxy;

// ...

@Log4j2
@Getter
@Setter
public class Client {

    // ...

    public void printByVirtualProxy() throws InterruptedException {
        VirtualSubject subject = new VirtualProxy();
        subject.print();
    }

    public void printByVirtualProxyAfterCountFive() throws InterruptedException {
        VirtualSubject subject = new VirtualProxy();
        for (int index = 1; index <= 5; index++) {
            Thread.sleep(1000);
            log.info(index);
        }
        subject.print();
    }
}
```

#### 3.1.5. 가상 프록시 테스트

```java
package blog.in.action.proxy;

// ...

@Log4j2
public class ProxyPatternTest {

    private Client client;

    @BeforeEach
    public void beforeEach() {
        client = new Client();
    }

    // ...

    @Test
    public void when_printByVirtualProxy_then_printFewSecondsLater() throws InterruptedException {
        client.printByVirtualProxy();
    }

    @Test
    public void when_printByVirtualProxyAfterCountFive_then_printRightAfterCount() throws InterruptedException {
        client.printByVirtualProxyAfterCountFive();
    }
}
```

##### when_printByVirtualProxy_then_printFewSecondsLater 테스트 결과
- 가상 프록시 객체를 생성 후 즉각 출력을 수행하면 준비되기까지 대기합니다.
- 클라이언트 객체 입장에선 사용하고 싶은 객체가 즉각 반환되어 사용할 수 있는 것처럼 보입니다.
- 클라이언트 객체는 주체 클래스 객체가 준비되는 과정을 확인할 수 있습니다.

```
02:43:34.974 [main] INFO blog.in.action.proxy.virtual.VirtualProxy - waiting
02:43:35.475 [main] INFO blog.in.action.proxy.virtual.VirtualProxy - waiting
02:43:35.475 [ForkJoinPool.commonPool-worker-19] INFO blog.in.action.proxy.virtual.VirtualRealSubject - first item is loaded.
02:43:35.977 [main] INFO blog.in.action.proxy.virtual.VirtualProxy - waiting
02:43:36.479 [main] INFO blog.in.action.proxy.virtual.VirtualProxy - waiting
02:43:36.982 [main] INFO blog.in.action.proxy.virtual.VirtualProxy - waiting
02:43:37.485 [main] INFO blog.in.action.proxy.virtual.VirtualProxy - waiting
02:43:37.485 [main] INFO blog.in.action.proxy.virtual.VirtualRealSubject - print something
02:43:37.485 [ForkJoinPool.commonPool-worker-5] INFO blog.in.action.proxy.virtual.VirtualRealSubject - second item is loaded.
```

##### when_printByVirtualProxyAfterCountFive_then_printRightAfterCount 테스트 결과
- 클라이언트 객체는 필요한 가상 프록시 객체를 생성합니다.
- 다음 자신이 선처리해야하는 로직(logic)을 수행합니다.
- 선처리 로직을 마치고 가상 프록시 객체를 이용해 출력을 수행하면 즉각 수행됩니다.
- 클라이언트 객체는 비용이 큰 객체를 미리 준비시킨 후 필요한 곳에서 사용할 수 있습니다.

```
02:47:06.728 [ForkJoinPool.commonPool-worker-19] INFO blog.in.action.proxy.virtual.VirtualRealSubject - first item is loaded.
02:47:06.728 [main] INFO blog.in.action.proxy.Client - 1
02:47:07.750 [main] INFO blog.in.action.proxy.Client - 2
02:47:08.723 [ForkJoinPool.commonPool-worker-5] INFO blog.in.action.proxy.virtual.VirtualRealSubject - second item is loaded.
02:47:08.755 [main] INFO blog.in.action.proxy.Client - 3
02:47:09.760 [main] INFO blog.in.action.proxy.Client - 4
02:47:10.765 [main] INFO blog.in.action.proxy.Client - 5
02:47:10.765 [main] INFO blog.in.action.proxy.virtual.VirtualRealSubject - print something
```

### 3.2. 원격 프록시(Remote Proxy)
타 시스템에 있는 객체를 로컬에 위치한 객체처럼 사용하기 위한 프록시 패턴입니다. 
구글 서버에서 메인 화면을 제공하는 컨트롤러(controller) 객체을 호출하는 원격 프록시 클래스를 만들어보겠습니다.

#### 3.2.1. RemoteSubject 인터페이스

```java
package blog.in.action.proxy.remote;

public interface RemoteSubject {

    void printGoogleMainPage();
}
```

#### 3.2.2. RemoteProxy 클래스
- 구글 메인 화면을 출력하는 기능을 클라이언트 객체에게 제공하는 원격 프록시 클래스입니다.
- 내부에서는 API 요청을 이용해 전달받은 데이터를 출력하는 기능이 구현되어 있습니다.
- 외부에서는 원격 프록시 객체가 구글 메인 화면을 출력하는 것으로 보입니다.

```java
package blog.in.action.proxy.remote;

import lombok.extern.log4j.Log4j2;
import org.springframework.web.client.RestTemplate;

@Log4j2
public class RemoteProxy implements RemoteSubject {

    private RestTemplate restTemplate;

    public RemoteProxy() {
        restTemplate = new RestTemplate();
    }

    @Override
    public void printGoogleMainPage() {
        log.info(restTemplate.getForEntity("https://www.google.com", String.class));
    }
}
```

#### 3.2.3. Client 클래스
- 원격 프록시 객체를 만들어 구글 메인 화면을 출력합니다.

```java
package blog.in.action.proxy;

// ...

@Log4j2
@Getter
@Setter
public class Client {

    // ...

    public void printGoogleByRemoteProxy() {
        RemoteSubject subject = new RemoteProxy();
        subject.printGoogleMainPage();
    }
}
```

#### 3.2.4. 원격 프록시 테스트

```java
package blog.in.action.proxy;

// ...

@Log4j2
public class ProxyPatternTest {

    private Client client;

    @BeforeEach
    public void beforeEach() {
        client = new Client();
    }

    // ...

    @Test
    public void when_printGoogleByRemoteProxy_then_printHTML() {
        client.printGoogleByRemoteProxy();
    }
}
```

##### when_printGoogleByRemoteProxy_then_printHTML 테스트 결과
- 원격 프록시 객체 내부에서 구글 서버로 페이지 요청 성공 후 내용을 출력합니다.

```
02:58:54.436 [main] DEBUG org.springframework.web.client.RestTemplate - HTTP GET https://www.google.com
02:58:54.443 [main] DEBUG org.springframework.web.client.RestTemplate - Accept=[text/plain, application/json, application/*+json, */*]
02:58:54.790 [main] DEBUG org.springframework.web.client.RestTemplate - Response 200 OK
02:58:54.806 [main] DEBUG org.springframework.web.client.RestTemplate - Reading to [java.lang.String] as "text/html;charset=ISO-8859-1"
02:58:54.837 [main] INFO blog.in.action.proxy.remote.RemoteProxy - <200,<!doctype html><html itemscope="" itemtype="http://schema.org/WebPage" lang="ko"><head><meta content="text/html; charset=UTF-8" http-equiv="Content-Type"><meta content="/images/branding/googleg/1x/googleg_standard_color_128dp.png" itemprop="image">
...
```

### 3.3. 보호 프록시(Protection Proxy)

주체 클래스에 대한 접근, 사용을 제어하기 위한 프록시 패턴입니다. 
권한이 있는 경우에만 출력이 가능한 보호 프록시 클래스를 만들어보겠습니다. 

#### 3.3.1. AUTHORITY enum
- 두 개의 권한이 존재합니다. 
    - ADMIN - 관리자
    - NORMAL - 일반
- `accessLevel` 값이 낮을수록 권한이 높습니다.

```java
package blog.in.action.proxy.protection;

public enum AUTHORITY {

    ADMIN(0),
    NORMAL(1);

    private int accessLevel;

    AUTHORITY(int accessLevel) {
        this.accessLevel = accessLevel;
    }

    public boolean accessible(AUTHORITY authority) {
        return (this.accessLevel - authority.accessLevel) >= 0;
    }
}
```

#### 3.3.2. ProtectionSubject 인터페이스
- printNormalThing 메소드 - 일반 권한의 문서를 출력합니다.
- printAdminThing 메소드 - 관리자 권한의 문서를 출력합니다.

```java
package blog.in.action.proxy.protection;

import blog.in.action.proxy.Client;

public interface ProtectionSubject {

    void printNormalThing(Client client);

    void printAdminThing(Client client);
}
```

#### 3.3.3. ProtectionRealSubject 클래스
- 주체 클래스이며, 이름과 권한을 함께 출력하도록 구현되어 있습니다.

```java
package blog.in.action.proxy.protection;

import blog.in.action.proxy.Client;
import lombok.extern.log4j.Log4j2;

@Log4j2
public class ProtectionRealSubject implements ProtectionSubject {

    @Override
    public void printNormalThing(Client client) {
        log.info(client.getName() + "님이 출력하였습니다. 접근권한: " + client.getAuthority());
    }

    @Override
    public void printAdminThing(Client client) {
        log.info(client.getName() + "님이 출력하였습니다. 접근권한: " + client.getAuthority());
    }
}
```

#### 3.3.4. ProtectionProxy 클래스
- 각 프린트 메소드 별로 접근할 수 있는 권한을 확인하는 보호 프록시 클래스입니다.
- 권한이 없는 경우 예외를 던집니다.

```java
package blog.in.action.proxy.protection;

import static blog.in.action.proxy.protection.AUTHORITY.ADMIN;
import static blog.in.action.proxy.protection.AUTHORITY.NORMAL;
import blog.in.action.proxy.Client;

public class ProtectionProxy implements ProtectionSubject {

    private ProtectionRealSubject realSubject;

    public ProtectionProxy() {
        realSubject = new ProtectionRealSubject();
    }

    @Override
    public void printNormalThing(Client client) {
        if (!NORMAL.accessible(client.getAuthority())) {
            throw new RuntimeException("일반 등급 이상만 접근할 수 있습니다.");
        }
        realSubject.printNormalThing(client);
    }

    @Override
    public void printAdminThing(Client client) {
        if (!ADMIN.accessible(client.getAuthority())) {
            throw new RuntimeException("관리자 등급 이상만 접근할 수 있습니다.");
        }
        realSubject.printAdminThing(client);
    }
}
```

#### 3.3.5. Client 클래스
- 보호 프록시 객체를 호출하는 클라이언트 클래스입니다.
- 해당 클라이언트 객체의 이름은 이름이 `Junhyunny`입니다.
- 권한은 `NORMAL`입니다.

```java
package blog.in.action.proxy;

// ...

@Log4j2
@Getter
@Setter
public class Client {

    private final String name = "Junhyunny";

    private final AUTHORITY authority = NORMAL;

    public void printNormalThingByProtectionProxy() {
        ProtectionSubject subject = new ProtectionProxy();
        subject.printNormalThing(this);
    }

    public void printAdminThingByProtectionProxy() {
        ProtectionSubject subject = new ProtectionProxy();
        subject.printAdminThing(this);
    }
    
    // ...
}
```

#### 3.3.6. 보호 프록시 테스트

```java
package blog.in.action.proxy;

// ...

@Log4j2
public class ProxyPatternTest {

    private Client client;

    @BeforeEach
    public void beforeEach() {
        client = new Client();
    }

    @Test
    public void when_hasAccessibleAuthorization_then_print() {
        client.printNormalThingByProtectionProxy();
    }

    @Test
    public void when_hasNotAccessibleAuthorization_then_occurException() {
        Throwable throwable = Assertions.assertThrows(RuntimeException.class, () -> {
            client.printAdminThingByProtectionProxy();
        });
        log.info(throwable.getMessage());
    }

    // ...
}
```

##### when_hasAccessibleAuthorization_then_print 테스트 결과

```
03:19:23.415 [main] INFO blog.in.action.proxy.protection.ProtectionRealSubject - Junhyunny님이 출력하였습니다. 접근권한: NORMAL
```

##### when_hasNotAccessibleAuthorization_then_occurException 테스트 결과

```
03:22:06.217 [main] INFO blog.in.action.proxy.ProxyPatternTest - 관리자 등급 이상만 접근할 수 있습니다.
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-10-31-proxy-pattern>

#### REFERENCE
- Design Patterns: Elements of Reusable Object-Oriented Software 
- <https://coding-factory.tistory.com/711>
- <https://developside.tistory.com/80>
- <https://dailyheumsi.tistory.com/201>