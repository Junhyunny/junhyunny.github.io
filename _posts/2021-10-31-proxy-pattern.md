---
title: "Proxy Pattern"
search: false
category:
  - information
  - design-pattern
last_modified_at: 2021-10-31T23:55:00
---

<br/>

## 1. Proxy Pattern

> 프록시(Proxy) - 대리자, 대리인

패턴 이름에서 알 수 있듯이 실제 객체를 대신하는 대리인 객체가 존재하는 패턴입니다. 

* 프록시 객체는 대리인으로써 외부 요청을 대신 받아줍니다.
* 프록시 객체는 실제 서비스를 수행하는 객체를 내부 멤버로 가지고 있습니다.
* 실제 기능이 수행되기 전이나 후에 필요한 별도 로직을 처리할 수 있습니다.
    * 실제 객체의 기능을 건들지 않고 기능을 확장할 수 있습니다.
    * 프록시 객체의 확장된 기능으로 실제 객체 로직 수행 결과가 바뀌면 안 됩니다.

### 1.1. Structure

프록시 패턴은 다음과 같은 구조를 가집니다. 

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
    <img src="/images/proxy-pattern-1.JPG" width="80%" class="image__border image__padding">
</p>
<center>https://en.wikipedia.org/wiki/Proxy_pattern</center>

### 1.2. Strength and Weakness

다음과 같은 장점들을 가집니다.

* 주체 클래스 객체가 로딩(loading)되기 전에 프록시 객체를 통해 참조 가능합니다. 
* 주체 클래스 기능을 수정하지 않고도 프록시 객체를 사용하 기능을 확장할 수 있습니다. 
* 주체 클래스 객체에 대한 접근 제어 및 보호가 가능합니다.

다음과 같은 단점들을 가집니다. 

* 불필요한 프록시 클래스는 코드의 가독성을 떨어뜨립니다.
* 객체 생성이 한 단계 더 늘어났기 때문에 잦은 객체 생성은 성능을 나쁘게 만듭니다. 

## 2. Types of Proxy Instance

대표적으로 세 가지 프록시 객체가 있습니다. 
프록시 객체가 수행하는 일에 따라 종류가 정해집니다. 

* 가상 프록시(Virtual Proxy)
    * 요청이 있을 때만 고비용 객체를 생성합니다.
    * 필요 시점까지 객체의 생성을 연기하여 해당 객체가 생성된 것처럼 동작하도록 만드는 패턴입니다. 
    * 만드는데 많은 비용이 들어가는 객체에 대한 생성, 접근 시점을 제어합니다. 
* 원격 프로시(Remote Proxy)
    * 다른 시스템에 위치하는 원격 객체의 역할을 대신 수행합니다. 
    * 원격 프록시 객체가 대변하는 원격 시스템에 위치한 객체를 마치 로컬(local)에 있는 것처럼 사용할 수 있습니다. 
* 보호 프록시(Protection Proxy)
    * 주체 클래스에 대한 접근을 제어하기 위해 사용합니다. 
    * 클라이언트 객체가 주체 클래스에 대한 접근시 이를 허용할 것인지 아닌지에 대한 제어를 수행합니다. 
    * 클라이언트 별로 접근 제어 권한이 다를 때 유용하게 사용됩니다. 

## 3. Practice

간단한 예제 코드를 작성해보겠습니다.

### 3.1. Virtual Proxy

요청이 있기 전까지 고비용 객체 생성을 미룹니다. 

#### 3.1.1. VirtualSubject Interface

* 특정 데이터를 출력합니다.

```java
package blog.in.action.virtual;

public interface VirtualSubject {

    void print();
}
```

#### 3.1.2. VirtualRealSubject Class

실제 비즈니스 로직을 수행합니다. 
생성되기까지 1초가 필요한 고비용 객체입니다.

```java
package blog.in.action.virtual;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class VirtualRealSubject implements VirtualSubject {

    public VirtualRealSubject() {
        try {
            log.info("wait for loading...");
            Thread.sleep(1000);
            log.info("finish");
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void print() {
        log.info("print something");
    }
}
```

#### 3.1.3. VirtualProxy Class

가상 프록시 객체입니다. 
실제 주체 클래스의 생성을 최대한 미룬 후 클라이언트가 print 메소드를 호출하는 시점에 생성합니다. 

```java
package blog.in.action.virtual;

public class VirtualProxy implements VirtualSubject {

    private VirtualRealSubject realSubject;

    @Override
    public void print() {
        if (realSubject == null) {
            this.realSubject = new VirtualRealSubject();
        }
        realSubject.print();
    }
}
```

#### 3.1.4. VirtualClient Class

VirtualSubject 구현 객체에 의존하는 클라이언트 클래스입니다. 

* 클라이언트 객체를 만들기 위해선 VirtualSubject 구현체가 필요합니다. 
* print 메소드에서 특정 결과에 따라 VirtualSubject 구현체의 print 메소드를 사용할 수도 있고 아닐 수도 있습니다. 

다음과 같은 경우의 수를 나눠 생각해보면 가상 프록시 객체를 만드는 것이 이득입니다.

* VirtualSubject 구현체의 print 메소드가 호출되지 않는 경우
    * VirtualRealSubject 객체를 생성해서 주입한다면 불필요하게 1초를 사용한 것입니다.
    * VirtualProxy 객체를 생성해서 주입한다면 추가적인 기다림이 없습니다.
* VirtualSubject 구현체의 print 메소드가 호출되는 경우
    * VirtualRealSubject 객체를 1초에 걸쳐 생성한 후 주입하였기 때문에 즉시 사용할 수 있습니다. 
    * VirtualProxy 객체를 생성해서 주입한 후 실제 print 메소드가 호출될 때 1초에 걸쳐 VirtualRealSubject 객체를 생성 후 사용합니다.

```java
package blog.in.action.virtual;

import lombok.extern.log4j.Log4j2;

import java.util.concurrent.ThreadLocalRandom;

@Log4j2
public class VirtualClient {

    private final VirtualSubject virtualSubject;

    public VirtualClient(VirtualSubject virtualSubject) {
        this.virtualSubject = virtualSubject;
    }

    public void print() {
        log.info("business logic inside");
        var result = ThreadLocalRandom.current().nextBoolean();
        if (result) {
            virtualSubject.print();
        }
    }
}
```

#### 3.1.5. Test

```java
package blog.in.action.virtual;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;

@Slf4j
class VirtualClientTest {

    @Test
    void printByVirtualProxy() {

        var start = System.currentTimeMillis();
        VirtualClient client = new VirtualClient(new VirtualProxy());
        client.print();
        var end = System.currentTimeMillis();


        log.info("{} milli seconds", end - start);
    }

    @Test
    void printByVirtualRealSubject() {

        var start = System.currentTimeMillis();
        VirtualClient client = new VirtualClient(new VirtualRealSubject());
        client.print();
        var end = System.currentTimeMillis();

        log.info("{} milli seconds", end - start);
    }
}
```

##### printByVirtualProxy method 

가상 프록시를 사용한 코드입니다. 

* print 메소드 내부에서 VirtualSubject 구현체가 사용되지 않은 경우 1ms 소요됩니다.

```
22:47:22.874 [main] INFO blog.in.action.virtual.VirtualRealSubject -- wait for loading...
22:47:23.880 [main] INFO blog.in.action.virtual.VirtualRealSubject -- finish
22:47:23.881 [main] INFO blog.in.action.virtual.VirtualClient -- business logic inside
22:47:23.881 [main] INFO blog.in.action.virtual.VirtualClientTest -- 1057 milli seconds
```

##### printByVirtualRealSubject method

실제 객체를 사용한 코드입니다. 
print 메소드 내부에서 VirtualSubject 구현체가 사용되든 되지 않든 항상 1초 이상이 소요됩니다.

* print 메소드 내부에서 VirtualSubject 구현체가 사용되지 않았지만 1057ms 소요됩니다.

```
22:47:22.874 [main] INFO blog.in.action.virtual.VirtualRealSubject -- wait for loading...
22:47:23.880 [main] INFO blog.in.action.virtual.VirtualRealSubject -- finish
22:47:23.881 [main] INFO blog.in.action.virtual.VirtualClient -- business logic inside
22:47:23.881 [main] INFO blog.in.action.virtual.VirtualClientTest -- 1057 milli seconds
```

### 3.2. Remote Proxy

타 시스템에 있는 객체를 로컬에 위치한 객체처럼 사용하기 위한 프록시 패턴입니다. 
자바(Java)에서는 RMI(Remote Method Invocation)이라는 API 기능을 제공합니다. 
RMI 서버와 클라이언트 개발이 필요하기 때문에 이번 포스트에선 간단하게 개념만 살펴보겠습니다. 

* 원격 프록시
    * 원격 객체에 대한 로컬 대변자 역할을 수행합니다.
    * 프록시 메소드를 호출하면 네트워크를 통해 명령이 전달됩니다.
    * 원격 객체의 메소드가 호출됩니다.
    * 결과는 다시 네트워크를 타고 반환되어 클라이언트에게 전달됩니다.
    * 스텁(stub)이라고 부르기도 합니다.
* 원격 객체
    * 다른 JVM 힙(heap) 메모리에서 존재하는 객체입니다.
    * 일반적으로 다른 주소 공간에 존재하는 원격 객체입니다.
    * 프록시로부터 전달된 명령을 이해하고 적합한 메소드를 호출하는 스켈레톤(skeleton)에 의해 실행됩니다.

<p align="center">
    <img src="/images/proxy-pattern-2.JPG" width="100%" class="image__border">
</p>
<center>https://gre-eny.tistory.com/253</center>


### 3.3. Protection Proxy

주체 클래스에 대한 접근, 사용을 제어하기 위한 프록시 패턴입니다. 
권한이 있는 경우에만 출력이 가능한 보호 프록시 객체를 만들어보겠습니다. 

#### 3.3.1. AUTHORITY enum

* 두 개의 권한이 존재합니다. 
    * ADMIN(관리자)
    * NORMAL(일반)
* `accessLevel` 값이 낮을수록 권한이 높습니다.

```java
package blog.in.action.protection;

public enum Authority {

    ADMIN(0),
    NORMAL(1);

    private final int accessLevel;

    Authority(int accessLevel) {
        this.accessLevel = accessLevel;
    }

    public boolean accessible(Authority authority) {
        return (this.accessLevel - authority.accessLevel) >= 0;
    }
}
```

#### 3.3.2. ProtectionSubject Interface

* printForNormal 메소드 
    * 일반 권한이 필요한 문서를 출력합니다.
* printForAdmin 메소드 
    * 관리자 권한 필요한 문서를 출력합니다.

```java
package blog.in.action.protection;

public interface ProtectionSubject {

    void printForNormal(User authority);

    void printForAdmin(User authority);
}
```

#### 3.3.3. ProtectionRealSubject Class

실제 구현 클래스입니다. 
전달받은 권한 객체를 사용해 비즈니스 로직을 수행합니다. 

* 전달받은 권한 객체의 정보를 로그로 출력합니다.

```java
package blog.in.action.protection;

import lombok.extern.log4j.Log4j2;

@Log4j2
public class ProtectionRealSubject implements ProtectionSubject {

    @Override
    public void printForNormal(User user) {
        log.info("something to print for {}", user);
    }

    @Override
    public void printForAdmin(User user) {
        log.info("something to print for {}", user);
    }
}
```

#### 3.3.4. ProtectionProxy Class

* 프린트 메소드 별로 사용자 객체의 권한을 확인합니다. 
* 권한이 없는 경우 예외를 던집니다.

```java
package blog.in.action.protection;

import static blog.in.action.protection.Authority.ADMIN;
import static blog.in.action.protection.Authority.NORMAL;

public class ProtectionProxy implements ProtectionSubject {

    private final ProtectionSubject subject;

    public ProtectionProxy() {
        this.subject = new ProtectionRealSubject();
    }

    @Override
    public void printForNormal(User user) {
        if (!NORMAL.accessible(user.authority())) {
            throw new RuntimeException("일반 등급 이상만 접근할 수 있습니다.");
        }
        subject.printForNormal(user);
    }

    @Override
    public void printForAdmin(User user) {
        if (!ADMIN.accessible(user.authority())) {
            throw new RuntimeException("관리자 등급 이상만 접근할 수 있습니다.");
        }
        subject.printForAdmin(user);
    }
}
```

#### 3.3.5. ProtectionClient Class

ProtectionSubject 객체를 사용해 프린트를 수행합니다. 

```java
package blog.in.action.protection;

public class ProtectionClient {

    private final ProtectionSubject subject;

    public ProtectionClient(ProtectionSubject subject) {
        this.subject = subject;
    }

    public void printForAdmin(User user) {
        subject.printForAdmin(user);
    }

    public void printForNormal(User user) {
        subject.printForNormal(user);
    }
}
```

#### 3.3.6. Test

```java
package blog.in.action.protection;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProtectionClientTest {

    @Test
    void user_is_admin_when_print() {

        var user = new User("Junhyunny", Authority.ADMIN);
        var sut = new ProtectionClient(new ProtectionProxy());


        sut.printForNormal(user);
        sut.printForAdmin(user);
    }

    @Test
    void user_is_normal_when_print() {

        var user = new User("Junhyunny", Authority.NORMAL);
        var sut = new ProtectionClient(new ProtectionProxy());


        sut.printForNormal(user);
        var throwable = assertThrows(RuntimeException.class, () -> sut.printForAdmin(user));
        assertEquals("관리자 등급 이상만 접근할 수 있습니다.", throwable.getMessage());
    }
}
```

##### client_is_admin_when_print 테스트 결과

* 사용자가 ADMIN 권한을 가졌으므로 모든 출력에 성공합니다.

```
11:57:24.509 [main] INFO blog.in.action.protection.ProtectionRealSubject -- something to print for User[name=Junhyunny, authority=ADMIN]
11:57:24.512 [main] INFO blog.in.action.protection.ProtectionRealSubject -- something to print for User[name=Junhyunny, authority=ADMIN]
```

##### client_is_normal_when_print 테스트 결과

* 사용자가 NORMAL 권한을 가졌으므로 일반 사용자를 위한 출력만 성공합니다.

```
11:57:24.522 [main] INFO blog.in.action.protection.ProtectionRealSubject -- something to print for User[name=Junhyunny, authority=NORMAL]
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-10-31-proxy-pattern>

#### REFERENCE

* Design Patterns: Elements of Reusable Object-Oriented Software 
* <https://coding-factory.tistory.com/711>
* <https://developside.tistory.com/80>
* <https://dailyheumsi.tistory.com/201>
* <https://gre-eny.tistory.com/253>
* [프록시(Proxy) 패턴 - 완벽 마스터하기](https://inpa.tistory.com/entry/GOF-%F0%9F%92%A0-%ED%94%84%EB%A1%9D%EC%8B%9CProxy-%ED%8C%A8%ED%84%B4-%EC%A0%9C%EB%8C%80%EB%A1%9C-%EB%B0%B0%EC%9B%8C%EB%B3%B4%EC%9E%90#%EC%9B%90%EA%B2%A9_%ED%94%84%EB%A1%9D%EC%8B%9C_remote_proxy)