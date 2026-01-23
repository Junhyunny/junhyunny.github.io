---
title: "프록시 패턴(proxy pattern)"
search: false
category:
  - information
  - design-pattern
last_modified_at: 2025-08-26T22:00:00
---

<br/>

## 1. Proxy Pattern

> 프록시(Proxy) - 대리자, 대리인

패턴 이름에서 알 수 있듯이 실제 객체를 대신하는 대리인 객체가 존재하는 패턴이다.

- 프록시 객체는 대리인으로써 외부 요청을 대신 받아준다.
- 프록시 객체는 실제 서비스를 수행하는 객체를 내부 멤버로 가지고 있다.
- 특정 객체의 실제 기능이 수행되기 전이나 후에 필요한 로직을 추가적으로 처리할 수 있다.
  - 특정 클래스의 메서드를 직접 변경하지 않고 기능을 확장할 수 있다.
  - 프록시 객체의 확장된 기능으로 실제 객체 로직 수행 결과가 바뀌면 안 된다.

프록시 패턴은 다음과 같은 구조를 가진다. 

- 클라이언트(Client)  
  - Subject 인터페이스의 구현체가 제공하는 기능을 사용하는 객체이다.
- 주체(Subject)  
  - 제공해야 하는 어떤 기능들을 명시한 인터페이스이다.
  - Proxy 객체나 RealSubject 객체는 주체 인터페이스를 확장한다.
- 프록시(Proxy)  
  - Client 객체의 요청을 대신 받아주는 객체이다.
  - 전달받은 요청을 RealSubject 객체에게 전달한다.
  - RealSubject 객체가 일을 수행하기 전이나 후에 필요한 로직을 처리한다.
- 실제 주체(RealSubject)  
  - 인터페이스에서 명시한 기능을 실제로 처리하는 객체이다.

<div align="center">
  <img src="/images/posts/2021/proxy-pattern-01.png" width="80%" class="image__border image__padding">
</div>
<center>https://en.wikipedia.org/wiki/Proxy_pattern</center>

<br/>

다음과 같은 장점들을 가진다.

- 주체 클래스 객체가 로딩(loading)되기 전에 프록시 객체를 통해 참조 가능하다. 
- 주체 클래스 기능을 수정하지 않고도 프록시 객체를 사용해 기능을 확장할 수 있다. 
- 주체 클래스 객체에 대한 접근 제어 및 보호가 가능하다.

다음과 같은 단점들을 가진다. 

- 불필요한 프록시 클래스는 코드의 가독성을 떨어뜨린다.
- 객체 생성이 한 단계 더 늘어났기 때문에 잦은 객체 생성은 성능을 나쁘게 만든다. 

## 2. Types of Proxy Instance

대표적으로 세 가지 프록시 객체가 있다. 프록시 객체가 수행하는 일에 따라 종류가 정해진다. 

1. 가상 프록시(Virtual Proxy)  
  - 요청이 있을 때만 고비용 객체를 생성한다.
  - 필요 시점까지 객체의 생성을 연기하여 해당 객체가 생성된 것처럼 동작하도록 만드는 패턴이다. 
  - 만드는데 많은 비용이 들어가는 객체에 대한 생성, 접근 시점을 제어한다. 
2. 원격 프록시(Remote Proxy)  
  - 다른 시스템에 위치하는 원격 객체의 역할을 대신 수행한다.
  - 원격 프록시 객체가 대변하는 원격 시스템에 위치한 객체를 마치 로컬(local)에 있는 것처럼 사용할 수 있다. 
3. 보호 프록시(Protection Proxy)  
  - 주체 클래스에 대한 접근을 제어하기 위해 사용한다.
  - 클라이언트 객체가 주체 클래스에 대한 접근 시 이를 허용할 것인지 아닌지에 대한 제어를 수행한다.
  - 클라이언트 별로 접근 제어 권한이 다를 때 유용하게 사용된다. 

## 3. Practice

위에서 정리한 프록시 객체들에 대한 예제 코드들을 살펴보자.

### 3.1. Virtual Proxy

가상 프록시는 요청이 있기 전까지 고비용 객체 생성을 미룬다. 먼저 VirtualSubject 인터페이스를 정의힌다. 다음과 같은 책임을 갖는다.

- 특정 데이터를 출력한다.

```java
package blog.in.action.virtual;

public interface VirtualSubject {

    void print();
}
```

실제 비즈니스 로직을 수행하는 VirtualRealSubject 클래스를 정의한다. 생성 비용이 비싼 객체다. 생성이 완료될 때까지 1초 정도 소요되는 고비용 객체이다.

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

가상 프록시 객체를 만들기 위한 VirtualProxy 클래스다. 실제 주체 클래스의 생성을 최대한 미룬 후 클라이언트가 print 메서드를 호출하는 시점에 생성한다. 

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

### 3.2. Remote Proxy

타 시스템에 있는 객체를 로컬에 위치한 객체처럼 사용하기 위한 프록시 패턴이다. 자바(Java)에서는 RMI(Remote Method Invocation)이라는 API 기능을 제공한다. RMI 서버와 클라이언트 개발이 필요하기 때문에 이번 포스트에선 간단하게 개념만 살펴본다. 

- 원격 프록시  
  - 원격 객체에 대한 로컬 대변자 역할을 수행한다.
  - 프록시 메서드를 호출하면 네트워크를 통해 명령이 전달된다.
  - 원격 객체의 메서드가 호출된다.
  - 결과는 다시 네트워크를 타고 반환되어 클라이언트에게 전달된다.
  - 스텁(stub)이라고 부르기도 한다.
- 원격 객체  
  - 다른 JVM 힙(heap) 메모리에서 존재하는 객체이다.
  - 일반적으로 다른 주소 공간에 존재하는 원격 객체이다.
  - 프록시로부터 전달된 명령을 이해하고 적합한 메서드를 호출하는 스켈레톤(skeleton)에 의해 실행된다.

<div align="center">
  <img src="/images/posts/2021/proxy-pattern-02.png" width="100%" class="image__border">
</div>
<center>https://gre-eny.tistory.com/253</center>

### 3.3. Protection Proxy

주체 클래스에 대한 접근, 사용을 제어하기 위한 프록시 패턴이다.권한이 있는 경우에만 출력이 가능한 보호 프록시 객체를 만들어보자. 권한이 정의된 AUTHORITY 이넘 클래스를 만든다.

- 두 개의 권한이 존재한다.  
  - ADMIN(관리자)  
  - NORMAL(일반)
- accessLevel 값이 낮을수록 권한이 높다.

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

프록시 패턴을 위한 ProtectionSubject 인터페이스를 만든다. 다음과 같은 책임을 갖고 있다.

- printForNormal 메서드  
  - 일반 권한이 필요한 문서를 출력한다.
- printForAdmin 메서드  
  - 관리자 권한이 필요한 문서를 출력한다.

```java
package blog.in.action.protection;

public interface ProtectionSubject {

    void printForNormal(User authority);

    void printForAdmin(User authority);
}
```

실제 구현체인 ProtectionRealSubject 클래스다. 전달받은 권한 객체를 사용해 비즈니스 로직을 수행한다. 예제이므로 로그만 출력한다.

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

프록시 객체 역할을 수행하는 ProtectionProxy 클래스를 살펴보자. 다음과 같은 역할을 수행한다.

- 프린트 메서드 별로 사용자 객체의 권한을 확인한다.
- 권한이 없는 경우 예외를 던진다.

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

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-10-31-proxy-pattern>

#### RECOMMEND NEXT POSTS

- [Dynamic Proxy in Java][dynamic-proxy-in-java-link]
- [CGLib(Code Generation Library)][cglib-link]

#### REFERENCE

- Design Patterns: Elements of Reusable Object-Oriented Software 
- <https://coding-factory.tistory.com/711>
- <https://developside.tistory.com/80>
- <https://dailyheumsi.tistory.com/201>
- <https://gre-eny.tistory.com/253>
- [프록시(Proxy) 패턴 - 완벽 마스터하기](https://inpa.tistory.com/entry/GOF-%F0%9F%92%A0-%ED%94%84%EB%A1%9D%EC%8B%9CProxy-%ED%8C%A8%ED%84%B4-%EC%A0%9C%EB%8C%80%EB%A1%9C-%EB%B0%B0%EC%9B%8C%EB%B3%B4%EC%9E%90#%EC%9B%90%EA%B2%A9_%ED%94%84%EB%A1%9D%EC%8B%9C_remote_proxy)

[dynamic-proxy-in-java-link]: https://junhyunny.github.io/java/dynamic-proxy-in-java/
[cglib-link]: https://junhyunny.github.io/java/spring/spring-boot/cglib/