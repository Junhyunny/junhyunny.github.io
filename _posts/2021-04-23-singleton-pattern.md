---
title: "Singleton Pattern"
search: false
category:
  - information
  - design-pattern
last_modified_at: 2021-04-23T00:00:00
---

<br>

가장 흔하게 접하는 디자인 패턴입니다. 
너무 친숙한 나머지 저는 싱글톤 패턴(Singleton Pattern)에 대해서 잘 알고 있다고 착각하고 있었습니다. 
관련된 글을 찾아보면서 제가 몰랐던 이야기들도 있었고, 
공부하지 않으면 머리 속에서 정리되지 않으니 관련된 내용을 이번 포스트에서 정리해보도록 하겠습니다.

## 싱글톤 패턴(Singleton Pattern)

> Wiki<br>
> In software engineering, the singleton pattern is a software design pattern that restricts the instantiation of a class to one "single" instance.

이름에서부터 추측이 가능한 디자인 패턴입니다. 
어플리케이션 내에서 하나의 인스턴스만 존재하도록 강제하는 패턴입니다. 
어플리케이션 내에 한 개의 객체만 존재해야하고, 여러 곳에서 해당 객체를 공유해야 하는 경우에 사용합니다.
그렇기 때문에 싱글톤 패턴이 적용된 인스턴스에 대한 전역적인 접근점을 제공해야 합니다. 

##### 싱글톤 패턴 클래스 다이어그램
<p align="center"><img src="/images/singleton-pattern-1.JPG" width="50%"></p>
<center>이미지 출처, https://en.wikipedia.org/wiki/singleton-pattern-1.JPG</center><br>

### 싱글톤 패턴 사용 시 이점
싱글톤 패턴을 사용하는 경우 아래와 같은 이점을 얻을 수 있습니다.
- 객체 로딩 시간이 줄어듭니다.
- 전역적으로 사용되므로 다른 인스턴스들이 데이터를 공유하기 쉽습니다.
- 하나의 인스턴스만 만들어 사용하기 때문에 메모리 낭비를 방지할 수 있습니다.

### 싱글톤 패턴 사용 시 주의점
싱글톤 패턴을 사용하는 경우 아래와 같은 주의사항이 있습니다.
- 멀티 스레드 환경에서 인스턴스가 1개를 초과하여 생성될 수 있습니다.
- 객체가 하나뿐이니 동시성(Concurrency) 문제를 고려해서 설계해야 합니다.
- 싱글톤 객체가 너무 많은 일을 하거나 많은 데이터를 공유하는 경우 인스턴스들 간의 결합도가 높아집니다.

## 싱글톤 패턴 구현 방법
### 'GoF 디자인 패턴'의 싱글톤 패턴 구현

### Eager Initialization
- static 키워드를 사용하여 클래스 로더가 초기화하는 시점에 정적 바인딩되도록 구현합니다.
- 해당 방법은 클래스가 최초 로딩될 때 객체가 생성되기 때문에 thread-safe 합니다.
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

### Lazy Initialization
- 객체를 사용하지 않는데 미리 만들 필요는 없습니다.
- 호출된 적이 없는 경우에는 자기 참조 코드가 null로 존재하다가 호출되었을 때 해당 객체를 만들어 반합니다.
- 그 이후에는 만들어진 객체를 반환합니다.
- 다만 아래와 같은 방법은 멀티 스레드 환경에서 thread-safe 하지 않습니다.
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

### Lazy Initialization, synchronized
- getInstance 메소드 호출 시 synchronized 키워드를 사용하여 임계영역을 만들어줍니다.
- 해당 방법은 thread-safe 하지만 getInstance() 메소드를 호출이 잦은 경우 성능이 느려질 수 있습니다.
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


### Lazy Initialization, Double Checking Locking
- Lazy Initialization, synchronized 방식을 이용할 때 성능 지연 문제를 해결합니다.
- 생성된 인스턴스가 없는 경우에만 동기화 블럭이 실행됩니다.
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

#### volatile 키워드를 사용하는 이유
volatile 키워드를 사용하는 이유는 멀티 스레드 환경에서 thread-safe 함을 보장하기 위함입니다. 
멀티 스레드 어플리케이션에서는 작업을 수행하는 동안 성능 향상을 위해 MM(Main Memory)에서 읽은 값을 CPU Cache에 저장합니다. 
멀티 스레드 환경에서 스레드가 변수 값을 읽어올 때 CPU Cache에 저장된 값을 읽는 경우 스레드마다 값이 다른 불일치 현상이 발생할 수 있습니다.  
volatile 키워드를 붙힌 경우 MM에 값을 저장하고 읽기 때문에 변수 값 불일치 문제를 해결합니다.([자바 volatile 키워드][volatile-reference-link])

### Lazy Initialization, LazyHolder
<p align="center"><img src="/images/singleton-pattern-2.JPG" width="80%"></p>
<center>이미지 출처, https://en.wikipedia.org/wiki/singleton-pattern-2.JPG</center><br>

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

##### getIntance에 따른 객체 생성자 호출 시기 확인 로그


## 싱글톤 패턴은 사실 안티 패턴
싱글톤 패턴은 사실 안티 패턴이라고 합니다. 
안티라는 단어만 들어도 좋지 느낌을 주지는 않습니다. 

> 안티 패턴(anti-pattern)<br>
> 소프트웨어 공학 분야 용어이며, 실제 많이 사용되는 패턴이지만 비효율적이거나 비생산적인 패턴을 의미한다.

### Singleton in Spring 

## OPINION
작성 중 입니다.

#### REFERENCE
- [싱글턴 패턴(Singleton Pattern)][singleton-pattern-post-link]
- [안티패턴][anti-pattern-link]
- <https://ssoco.tistory.com/65>
- <https://sabarada.tistory.com/25>
- <https://jeong-pro.tistory.com/86>
- <https://en.wikipedia.org/wiki/Singleton_pattern>

[singleton-pattern-post-link]: https://webdevtechblog.com/%EC%8B%B1%EA%B8%80%ED%84%B4-%ED%8C%A8%ED%84%B4-singleton-pattern-db75ed29c36
[volatile-reference-link]: https://parkcheolu.tistory.com/16
[anti-pattern-link]: https://ko.wikipedia.org/wiki/%EC%95%88%ED%8B%B0%ED%8C%A8%ED%84%B4