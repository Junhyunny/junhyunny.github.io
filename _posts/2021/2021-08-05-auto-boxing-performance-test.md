---
title: "Wrapper 클래스 Auto Boxing 그리고 성능 이슈"
search: false
category:
  - java
last_modified_at: 2021-09-04T03:30:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Java Wrapper 클래스][wrapper-class-link]

## 0. 들어가면서

성능 분석을 위해 사용한 모니터링 툴(tool)은 [VisualVM][visualvm-link]을 사용하였습니다. 
`VisualVM`에 `Visual GC` 플러그인(plugin)을 설치하여 가비지 컬렉션(Garvage Collection, GC)도 확인해보았습니다.

## 1. Auto Boxing 테스트 코드
### 1.1. SnoopInt 클래스
- 기본형 타입의 멤버 변수를 지닌 클래스입니다.

```java
package blog.in.action.autoboxing;

public final class SnoopInt {

    final int id;

    SnoopInt(int id) {
        this.id = id;
    }

    int getId() {
        return id;
    }
}
```

### 1.2. MikeTyson 클래스
- 8개 데몬 스레드를 생성하여 수행시킵니다.
- 스레드는 각자 지닌 MikeTyson 객체의 map 객체로부터 특정 키가 존재하는지 확인합니다.
- 확인 후 yieldCounter 변수 값을 증가시킵니다.
- yield 메소드를 수행하여 자신의 수행 시간을 다른 스레드에게 넘깁니다.
- containsKey 메소드 부분에서 auto boxing 기능이 수행됩니다.

```java
package blog.in.action.autoboxing;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

public final class MikeTyson implements Runnable {

    private final Map<Integer, SnoopInt> map = new HashMap<>();

    public MikeTyson() {
        for (int i = 0; i < 1_000_000; i++) {
            map.put(i, new SnoopInt(i));
        }
    }

    public void run() {
        long yieldCounter = 0;
        while (true) {
            Collection<SnoopInt> copyOfValues = map.values();
            for (SnoopInt snoopIntCopy : copyOfValues) {
                if (!map.containsKey(snoopIntCopy.getId())) {
                    System.out.println("Now this is strange!");
                }
                if (++yieldCounter % 1000 == 0) {
                    System.out.println("Boxing and unboxing");
                }
                Thread.yield();
            }
        }
    }

    public static void main(String[] args) throws java.io.IOException {
        ThreadGroup threadGroup = new ThreadGroup("Workers");
        Thread[] threads = new Thread[8];
        for (int i = 0; i < threads.length; i++) {
            threads[i] = new Thread(threadGroup, new MikeTyson(), "Allocator Thread " + i);
            threads[i].setDaemon(true);
            threads[i].start();
        }
        System.out.print("Press to quit!");
        System.out.flush();
        System.in.read();
    }
}
```

### 1.3. VisualVM 모니터링 결과
약 11분 동안 모니터링하였습니다.

#### 1.3.1. CPU / Heap 메모리 사용률
- CPU 사용률은 크게 특이사항이 없습니다.
- Heap 메모리 사용률을 보면 3300MB의 75% 수준인 2500MB까지 사용률이 높아졌다가 떨어지는 것이 반복됩니다.
- Heap 사용률이 떨어지는 것으로 GC(Garbage Collection, 가비지 컬렉션)가 동작하였다는 것을 예상할 수 있습니다. 

<p align="center"><img src="/images/auto-boxing-performance-test-1.JPG" width="85%"></p>

#### 1.3.2. Visual GC
- 객체가 처음 생성되면 위치하는 Eden 영역의 메모리가 높아졌다 떨어지는 것이 자주 반복됩니다.
- Eden 영역의 메모리가 떨어지는 시점에 `GC Time`이 올라가는 것을 보아 가비지 컬렉션이 동작하였음을 확인할 수 있습니다.

<p align="center"><img src="/images/auto-boxing-performance-test-2.JPG" width="85%"></p>

## 2. 성능 최적화 테스트 코드
SnoopInt 클래스의 멤버 변수를 wrapper 클래스로 변경하여 auto boxing이 동작하지 않도록 변경하였습니다.

### 2.1. SnoopInt 클래스
- Wrapper 클래스 타입의 멤버 변수를 지닌 클래스입니다.

```java
package blog.in.action.autoboxing;

public final class OptimizationSnoopInt {

    final Integer id;

    OptimizationSnoopInt(Integer id) {
        this.id = id;
    }

    Integer getId() {
        return id;
    }
}
```

### 2.2. MikeTyson 클래스
- snoopIntCopy 객체에서 getId 메소드를 통해 꺼내는 값이 wrapper 클래스의 객체입니다.
- containsKey 메소드 수행 시 auto boxing 기능이 동작하지 않습니다.
- 기타 나머지 동작은 동일합니다.

``` java
package blog.in.action.autoboxing;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

public final class MikeTyson implements Runnable {

    private final Map<Integer, OptimizationSnoopInt> map = new HashMap<>();

    public MikeTyson() {
        for (int i = 0; i < 1_000_000; i++) {
            map.put(Integer.valueOf(i), new OptimizationSnoopInt(Integer.valueOf(i)));
        }
    }

    public void run() {
        long yieldCounter = 0;
        while (true) {
            Collection<OptimizationSnoopInt> copyOfValues = map.values();
            for (OptimizationSnoopInt snoopIntCopy : copyOfValues) {
                if (!map.containsKey(snoopIntCopy.getId())) {
                    System.out.println("Now this is strange!");
                }
                if (++yieldCounter % 1000 == 0) {
                    System.out.println("Boxing and unboxing");
                }
                Thread.yield();
            }
        }
    }

    public static void main(String[] args) throws java.io.IOException {
        ThreadGroup threadGroup = new ThreadGroup("Workers");
        Thread[] threads = new Thread[8];
        for (int i = 0; i < threads.length; i++) {
            threads[i] = new Thread(threadGroup, new MikeTyson(), "Allocator Thread " + i);
            threads[i].setDaemon(true);
            threads[i].start();
        }
        System.out.print("Press to quit!");
        System.out.flush();
        System.in.read();
    }
}
```

### 2.3. VisualVM 모니터링 결과
Auto Boxing 테스트와 동일한 시간 모니터링하였습니다.

#### 2.3.1. CPU / Heap 메모리 사용률
- CPU 사용률이 크게 감소하는 지점이 있었습니다.(원인 불명)
- Heap 메모리 사용률을 보면 3700MB의 33% 수준인 1250MB까지 사용률이 높아졌다 감소합니다.
- Auto Boxing 테스트에 비해 가비지 컬렉션 수행 빈도 수가 현저히 적습니다.

<p align="center"><img src="/images/auto-boxing-performance-test-3.JPG" width="85%"></p>

#### 2.3.2. Visual GC
- Eden 영역의 메모리가 높아졌다 떨어지는 주기가 매우 깁니다.
- Auto Boxing 테스트에 비해 가비지 컬렉션 수행 빈도 수가 매우 적습니다.

<p align="center"><img src="/images/auto-boxing-performance-test-4.JPG" width="85%"></p>

## CLOSING
인상 깊게 읽었던 포스트 중에 이런 내용이 있어서 공유하고 글을 마무리 짓겠습니다.

> [Naver - Java Garbage Collection][garbage-collection-link]<br/>
> GC에 대해서 알아보기 전에 알아야 할 용어가 있다. 
> 바로 'stop-the-world'이다. stop-the-world란, GC을 실행하기 위해 JVM이 어플리케이션 실행을 멈추는 것이다. 
> stop-the-world가 발생하면 GC를 실행하는 쓰레드를 제외한 나머지 쓰레드는 모두 작업을 멈춘다. 
> GC 작업을 완료한 이후에야 중단했던 작업을 다시 시작한다. 
> 어떤 GC 알고리즘을 사용하더라도 stop-the-world는 발생한다. 
> 대개의 경우 GC 튜닝이란 이 stop-the-world 시간을 줄이는 것이다.<br/>
> Java는 프로그램 코드에서 메모리를 명시적으로 지정하여 해제하지 않는다. 
> 가끔 명시적으로 해제하려고 해당 객체를 null로 지정하거나 System.gc() 메서드를 호출하는 개발자가 있다. 
> null로 지정하는 것은 큰 문제가 안 되지만, System.gc() 메서드를 호출하는 것은 시스템의 성능에 매우 큰 영향을 끼치므로 System.gc() 메서드는 절대로 사용하면 안 된다. 

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-08-05-auto-boxing-performance-test>

#### REFERENCE
- <https://www.theserverside.com/blog/Coffee-Talk-Java-News-Stories-and-Opinions/Performance-cost-of-Java-autoboxing-and-unboxing-of-primitive-types>
- <https://d2.naver.com/helloworld/6043>
- <https://d2.naver.com/helloworld/1329>

[wrapper-class-link]: https://junhyunny.github.io/java/java-wrapper-class/
[visualvm-link]: https://visualvm.github.io/
[garbage-collection-link]: https://d2.naver.com/helloworld/1329