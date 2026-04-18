---
title: "싱글톤 패턴(Singleton Pattern)"
search: false
category:
  - information
  - design-pattern
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

## 0. 들어가면서

흔하게 접하는 디자인 패턴이다. 너무 친숙한 나머지 싱글톤 패턴(Singleton Pattern)에 대해서 잘 알고 있다고 착각하고 있었다. 관련된 글을 찾아보면서 몰랐던 이야기들도 많다는 사실에 놀랐다. 정리하지 않으면 머릿속에 남지 않으니 글을 쓰면서 싱글톤 패턴의 개념을 정리하였다.

## 1. Singleton Pattern

> Wiki<br/>
> In software engineering, the singleton pattern is a software design pattern that restricts the instantiation of a class to one "single" instance.

이름에서 추측이 가능한 디자인 패턴이다. 애플리케이션 내에서 하나의 인스턴스만 존재하도록 강제하는 패턴이다. 여러 곳에서 싱글톤 객체를 공유해서 사용한다. 싱글톤 패턴이 적용된 인스턴스는 전역적인 접근이 가능해야 한다. 싱글톤 패턴의 클래스 다이어그램을 그리면 다음과 같이 그릴 수 있다.

- 클래스 내부에 싱글톤 객체를 참조할 수 있는 정적 프라이빗(static private) 변수가 있다.
- 어디에서든 싱글톤 객체를 참조할 수 있도록 정적 퍼블릿(static public) 함수가 정의되어 있다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/singleton-pattern-01.png" width="30%" class="image__border">
</div>
<center>https://en.wikipedia.org/wiki/singleton-pattern-1.JPG</center>

<br/>

싱글톤 패턴을 사용하면 아래와 같은 이점을 얻을 수 있다.

- 객체 로딩 시간이 줄어든다.
- 전역적으로 사용되므로 다른 인스턴스들이 데이터를 공유하기 쉽다.
- 하나의 인스턴스만 만들어 사용하기 때문에 메모리 낭비를 방지할 수 있다.

<br/>

싱글톤 패턴을 사용하면 아래와 같은 내용들을 주의해야 한다.

- 멀티 스레드 환경에서 인스턴스가 1개를 초과하여 생성될 수 있다.
- 객체가 하나뿐이니 동시성(concurrency) 문제를 고려해서 설계해야 한다.
- 싱글톤 객체가 너무 많은 일을 하거나 많은 데이터를 공유하는 경우 인스턴스들 간의 결합도가 높아진다.

## 2. Implemet Singleton Pattern

즉시 초기화 방식(eager initialization)은 static 키워드를 사용하여 클래스 로더가 초기화하는 시점에 정적으로 바인딩되도록 구현한다.

- 생성자를 외부에서 호출하지 못하도록 접근 제어자를 `private`으로 지정한다.
- 해당 방법은 클래스가 최초 로딩될 때 객체가 생성되기 때문에 thread-safe하다.

```java
public class Singleton {
    // Eager Initialization
    private static Singleton uniqueInstance = new Singleton();

    private Singleton() {
    }

    public static Singleton getInstance() {
        return uniqueInstance;
    }
}
```

이에 반해 지연 초기화 방식(lazy initialization)은 사용하지 않는 객체를 미리 만들지 않는다. 지연 초기화를 통해 필요한 시점에 객체를 생성한다.

- 호출된 적이 없는 경우에는 자기 참조 변수가 `null` 상태로 존재한다.
- 호출되면 해당 객체를 만들어 반환하고, 자기 참조 변수로 해당 객체를 참조한다.
- 그 이후엔 만들어진 객체를 반환한다.

```java
public class Singleton {

    private static Singleton uniqueInstance;

    private Singleton() {
    }

    // Lazy Initailization
    public static Singleton getInstance() {
        if (uniqueInstance == null) {
            uniqueInstance = new Singleton();
        }
        return uniqueInstance;
    }
}
```

하지만 이 방법은 멀티 스레드 환경에서 스레드 안전하지 않다. 스레드 안전하게 만드려면 getInstance 메서드 호출 시 `synchronized` 키워드를 사용하여 임계 영역을 만든다. 해당 방법은 스레드 안전하지만, getInstance 메서드 호출이 잦은 경우 동기화로 인한 성능 감소가 발생한다.

```java
public class Singleton {

    private static Singleton uniqueInstance;

    private Singleton() {
    }

    // Lazy Initailization
    public static synchronized Singleton getInstance() {
        if (uniqueInstance == null) {
            uniqueInstance = new Singleton();
        }
        return uniqueInstance;
    }
}
```

동기화로 인한 성능 문제는 싱글톤 객체를 생성할 때 두번 확인하는 방식으로 해결할 수 있다.

- 생성된 인스턴스가 없는 경우에만 동기화 블록이 실행된다.

```java
public class Singleton {

    private volatile static Singleton uniqueInstance;

    private Singleton() {
    }

    // Lazy Initialization. DCL
    public static Singleton getInstance() {
        if (uniqueInstance == null) {
            synchronized (Singleton.class) {
                if (uniqueInstance == null) {
                    uniqueInstance = new Singleton();
                }
            }
        }
        return uniqueInstance;
    }
}
```

위 에제 코드에서 [volatile 키워드][volatile-reference-link]를 사용하는 이유는 멀티 스레드 환경에서 스레드 안전성을 보장하기 위함이다. 애플리케이션에서는 작업을 수행하는 동안 성능 향상을 위해 메인 메모리(MM, main memory)에서 읽은 값을 CPU 캐시(cache)에 저장한다. 멀티 스레드 환경에서 스레드가 변수의 값을 읽어올 때 CPU 캐시에 저장된 값을 읽는 경우 스레드마다 값이 다를 수 있다. `volatile` 키워드가 붙은 변수는 메인 메모리에 값을 저장하고 읽기 때문에 캐시로 인한 값 불일치 문제를 해결한다.

지연 홀더(lazy holder)를 통한 지연 초기화 방법도 있다. 내부 `static` 클래스를 사용해 싱글톤 객체를 만드는 방법이다. 스레드 안정성과 성능에 모두 좋은 지연 객체 생성 방법이다.

- `InnerInstanceClazz` 클래스는 static 멤버 클래스이다.
- `Singleton` 클래스 내부에 `InnerInstanceClazz` 객체를 참조하는 변수가 없으므로 getInstance 메서드를 호출할 때 클래스 로더(class loader)에 의해 초기화된다.

```java
public class Singleton {

    private Singleton() {
        System.out.println("When am I called?");
    }

    /**
     * static member class
     * 내부클래스에서 static변수를 선언해야하는 경우 static 내부 클래스를 선언해야만 한다.
     * static 멤버, 특히 static 메서드에서 사용될 목적으로 선언
     */
    private static class InnerInstanceClazz {
        // 클래스 로딩 시점에서 생성
        private static final Singleton uniqueInstance = new Singleton();
    }

    public static Singleton getInstance() {
        return InnerInstanceClazz.uniqueInstance;
    }

    public static void main(String[] args) {
        System.out.println("before getInstance");
        Singleton.getInstance();
        System.out.println("after getInstance");
    }
}
```

`이넘(enum)`을 사용하면 스레드 안정성과 성능 문제를 해결할 수 있다.

- 이넘 객체 생성은 스레드 안전성을 보장한다. 이넘 객체를 사용하면 복잡한 직렬화 상황이나, 리플렉션 공격에도 제 2의 인스턴스가 생성되는 것을 방지할 수 있다.
- `volatile`, `synchronized` 키워드 없이도 동시성 문제를 해결하기 때문에 성능이 뛰어나다.

## 3. Singleton Pattern as Anti Pattern

싱글톤 패턴은 사실 안티(anti) 패턴이라고 한다. 안티라는 단어는 좋은 뉘앙스는 아니다.

> 안티 패턴(anti-pattern)<br/>
> 소프트웨어 공학 분야 용어이며, 실제 많이 사용되는 패턴이지만 비효율적이거나 비생산적인 패턴을 의미한다.

어째서 유명한 싱글톤 패턴이 안티 패턴으로 불리는지 찾아보았다. 싱글톤 패턴이 안티 패턴이 된 이유는 다음과 같다.

- 객체 지향적 설계를 적용할 수 없다.
  - 하나의 객체만 만들기 위해 `private` 생성자를 사용한다.
  - 이는 상속이 불가능하고 다형성 또한 제공할 수 없다는 의미이다.
- 테스트하기 힘들다.
  - 만들어지는 방식이 제한적이기 때문에 테스트 더블(test double)로 대체하기 어렵다.
- 서버 환경에서는 1개의 인스턴스(instance)를 보장하지 못한다.
  - 서버에서 클래스 로더를 어떻게 구성하고 있느냐에 따라 하나 이상의 인스턴스가 만들어질 수 있다.
- 전역 상태를 만들 수 있기 때문에 바람직하지 못하다.
  - 싱글톤 패턴이 적용된 객체는 어디에서든지 누구나 접근할 수 있다.
  - 이는 어떤 객체든 싱글톤 객체를 자유롭게 수정하고 데이터를 공유할 수 있다는 의미이다.
  - 객체 지향 프로그래밍에서는 권장되지 않는 프로그래밍 모델이다.

### 3.1. Singleton in Spring

> 싱글톤 패턴은 안티 패턴이지만, 스프링(spring)에서 해당 패턴을 많이 사용하지 않는가?

스프링은 사실 싱글톤 패턴을 사용하는 것이 아니다. 싱글톤 패턴은 애플리케이션 내에서 객체가 1개만 존재하도록 보장하기 위한 클래스를 정의하는 패턴이다. 실제 스프링은 객체가 1개만 만들어지도록 클래스를 제한하지 않는다. 일반적인 객체를 만들고, 이를 1개만 만들어 등록하고 재사용한다. 이를 싱글톤 레지스트리(singleton registry) 방식이라고 한다.

## CLOSING

싱글톤 패턴에 대해 정리하다 보니 `GoF 디자인 패턴`에서 설명하는 싱글톤 패턴은 일부 다른 점이 있어서 함께 정리하였다. GoF 디자인 패턴에서 싱글톤 패턴은 생성자의 접근 제어자를 `protected`로 지정하고, 싱글톤 패턴이 적용된 클래스의 상속을 보장한다.

```java
class Singleton {
    public:
        static Singleton* Instance();
    protected:
        Singleton();
    private:
        static Singletone* _instance;
}

Singleton* Singleton::_instance = 0;
Singleton* Singleton::Instance () {
    if (_instance == 0) {
        _instance = new Singleton;
    }
    return _instance;
}
```

#### RECOMMEND NEXT POSTS

- [스프링 프레임워크의 제어의 역전(IoC)과 의존성 주입(DI)][spring-ioc-di-link]
- [테스트 더블(Test Double)][test-double-link]

#### REFERENCE

- [싱글톤 패턴(Singleton Pattern)][singleton-pattern-post-link]
- [안티패턴][anti-pattern-link]
- <https://ssoco.tistory.com/65>
- <https://sabarada.tistory.com/25>
- <https://jeong-pro.tistory.com/86>
- <https://en.wikipedia.org/wiki/Singleton_pattern>

[singleton-pattern-post-link]: https://webdevtechblog.com/%EC%8B%B1%EA%B8%80%ED%84%B4-%ED%8C%A8%ED%84%B4-singleton-pattern-db75ed29c36
[volatile-reference-link]: https://parkcheolu.tistory.com/16
[anti-pattern-link]: https://ko.wikipedia.org/wiki/%EC%95%88%ED%8B%B0%ED%8C%A8%ED%84%B4
[spring-ioc-di-link]: https://junhyunny.github.io/spring-boot/design-pattern/spring-ioc-di/
[test-double-link]: https://junhyunny.github.io/test/test-driven-development/test-double/
