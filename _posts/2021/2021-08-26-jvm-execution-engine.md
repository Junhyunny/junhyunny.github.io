---
title: "JVM 실행 엔진(Execution Engine)"
search: false
category:
  - information
  - java
last_modified_at: 2026-05-08T04:03:37+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [JVM(Java Virtual Machine)][jvm-link]

## 0. 들어가면서

최근 이전에 작성했던 글들을 다시 정리하면서 [JVM(Java Virtual Machine)에 대한 넓고 얕은 지식이라는 주제로 작성한 글][jvm-link]을 다시 읽어 봤다. 전반적인 JVM 구조에 대한 글이었는데, 오늘은 `실행 엔진(Execution Engine)`에 대한 내용을 정리하면 좋을 것 같다는 생각에 이 글을 작성했다.

> 실행 엔진(Execution Engine)은 메모리에 적재된 클래스(바이트 코드)들을 기계어로 변경하여 명령어(instruction) 단위로 실행한다. 바이트 코드를 운영체제에 맞게 해석해주는 역할을 수행한다. 실행 엔진이 바이트 코드를 명령어 단위로 읽어서 수행하는데 크게 두 가지 방식이 사용된다고 한다.
> - 인터프리터(Interpreter)
> - JIT(Just In Time)

## 1. 사전 개념 정리

실행 엔진(execution engine)을 자세히 알아보기 전에 필요한 개념도 함께 정리했다. 개발자는 이클립스(eclipse) 혹은 인텔리제이(IntelliJ) 같은 IDE(Integrated Development Environment)에서 `.java` 확장자를 가진 파일에 소스 코드를 작성한다. 소스 코드는 사람이 알아보기 쉽게 영어로 작성되어 있지만 기계는 이를 해석하지 못한다. 자바(Java) 언어의 경우 JVM에 의해 프로그램이 동작하므로 JVM이 해석할 수 있는 내용으로 소스 코드를 변경해야 한다. 이 과정을 컴파일(compile)이라고 한다. JDK(Java Development Kit)를 설치하면 `/bin` 폴더에 있는 `javac` 프로그램으로 수행된다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/jvm-execution-engine-01.png" width="80%" class="image__border">
</div>
<center>https://math.hws.edu/javanotes/c1/s3.html</center>

<br/>

컴파일이 완료되면 JVM이 해석할 수 있는 `바이트 코드(Byte Code)`로 작성된 `.class` 확장자의 클래스 파일이 생성된다. 클래스 파일은 애플리케이션이 동작할 때 메모리에 적재되어 JVM 실행 엔진에 의해 수행된다. 예를 들어, 다음과 같은 자바 코드가 있다.

```java
package blog.in.action;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ActionInBlogApplication {

    public static void main(String[] args) {
        SpringApplication.run(ActionInBlogApplication.class, args);
    }

}
```

JDK의 `javap` 명령어를 사용하면 `.class` 파일에 담긴 바이트 코드를 확인할 수 있다.

```
$ javap.exe -l ActionInBlogApplication.class
```

위 소스 코드를 컴파일해서 바이트 코드로 변경하면 아래와 같은 코드로 변경된다.

```
Compiled from "ActionInBlogApplication.java"
public class blog.in.action.ActionInBlogApplication {
  public blog.in.action.ActionInBlogApplication();
    LineNumberTable:
      line 7: 0
    LocalVariableTable:
      Start  Length  Slot  Name   Signature
          0       5     0  this   Lblog/in/action/ActionInBlogApplication;

  public static void main(java.lang.String[]);
    LineNumberTable:
      line 10: 0
      line 11: 7
    LocalVariableTable:
      Start  Length  Slot  Name   Signature
          0       8     0  args   [Ljava/lang/String;
}
```

자바 애플리케이션을 실행할 때, 컴파일된 클래스 파일(.class)들이 클래스 로더(class loader)에 의해 JVM에 적재된다. 클래스 로더에 의해 적재되는 과정은 다른 글을 통해 정리할 생각이다. 클래스 적재 과정을 시각화하면 다음과 같다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/jvm-execution-engine-02.png" width="80%" class="image__border">
</div>
<center>https://www.tcpschool.com/java/java_intro_programming</center>

<br/>

JVM 메모리 구조를 봤을 때 클래스 로더에 의해 JVM에 적재되는 클래스들은 메서드 영역에 보관된다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/jvm-execution-engine-03.png" width="80%" class="image__border image__padding">
</div>
<center>https://www.geeksforgeeks.org/how-to-increase-heap-size-in-java-virtual-machine/</center>

## 2. 실행 엔진(Execution Engine)

클래스 파일을 실행시키는 방법에 따라 크게 두 가지로 분류된다.

- 인터프리터(Interpreter)
- JIT(Just In Time) 컴파일러

인터프리터(Interpreter)는 말 그대로 `통역사`다. 자바의 특징을 나타내는 대표적인 표현 중에 `Write Once Run Anywhere`라는 문구가 있다. 자바가 플랫폼에 독립적이고 이식성이 높은 언어인 이유는 인터프리터 덕분이다. 각 플랫폼에 맞는 인터프리터가 바이트 코드를 실행하기 때문에 Windows, Linux, Mac 어디에서든 실행될 수 있다. 인터프리터는 바이트 코드를 읽고(read), 운영체제가 실행할 수 있도록 기계어로 변경하는 역할을 수행한다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/jvm-execution-engine-04.png" width="80%">
</div>
<center>https://www.javatpoint.com/java-interpreter</center>

<br/>

JVM 인터프리터는 런타임(runtime) 중에 바이트 코드를 한 라인씩 읽고 실행한다. 여기에서 속도 문제가 발생한다. 바이트 코드 역시 기계어로 변환되어야 하기 때문에 C, C++처럼 미리 컴파일을 통해 기계어로 변경되는 언어에 비해 속도가 느려진다. 반복문 같은 경우 컴파일 언어와 다르게 인터프리터는 코드 각 줄을 매번 읽고, 번역해야 한다.

JIT(Just In Time) 컴파일러는 인터프리터의 속도 문제를 해결하기 위해 설계된 기능이다. **자주 실행되는 바이트 코드 영역을 런타임 중에 기계어로 컴파일하기 위한 기능이다.** 기계어는 바이트 코드에 비해 실행 속도가 빠르기 때문에 애플리케이션의 실행 속도가 개선된다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/jvm-execution-engine-06.gif" width="80%" class="image__border image__padding">
</div>

<br/>

JIT 컴파일러가 기계어로 컴파일하기 위해서는 **얼마나 자주 실행되었는지에 대한 기준**이 필요하다. 이를 **컴파일 임계치(compile threshold)**라고 한다. 컴파일 임계치를 만족하는 코드는 JIT 컴파일러에 의해 컴파일된다. 컴파일 임계치는 두 가지 횟수를 합친 것을 의미한다.

- method entry counter
  - JVM 내에 있는 메서드가 호출된 횟수
- back-edge loop counter
  - 메서드가 루프를 빠져나오기까지 회전한 횟수

컴파일 임계치가 일정 횟수에 도달한 코드는 컴파일하기에 충분한 정보가 쌓였다고 판단된다. 대상 코드는 특정 큐에 들어가 컴파일 스레드에 의해 컴파일되기를 기다린다. 애플리케이션 실행 시 JVM 옵션을 이용하여 컴파일 임계치와 관련된 값을 조절할 수 있다. `method entry counter` 값에 해당하는 임계치는 `CompileThreshold`이고, `back-edge loop counter` 값에 대한 임계치는 계산된 값이 매칭된다. `back-edge loop counter` 값에 대한 임계치 계산식은 아래와 같다.

> back-edge loop counter 값을 위한 임계치 = CompileThreashold * OnStackReplacePercentage / 100

`CompileThreshold` 항목은 옵션에 따라 클라이언트(-client, C1), 서버(-server, C2)로 구분된다. 클라이언트 컴파일은 1500, 서버 컴파일은 10000 값이 기본값(default)이다. VM 옵션 지정 방법은 다음과 같다.

```
-XX:CompileThreshold=N
-XX:OnStackReplacePercentage=N
```

애플리케이션 수행 시 VM 옵션을 지정하는 예제를 살펴보자. **아래 설명은 이해하기 쉬운 예시이므로 실제로 동작하는 방법과 다를 수 있다. 관련된 레퍼런스는 확인 중이다.**

- CompileThreshold 값은 100으로 지정한다.
  - method entry counter 임계치가 100으로 지정된다.
  - 특정 메서드가 100번 호출될 때 해당 임계치를 만족하게 된다.
- OnStackReplacePercentage 값은 33 퍼센트로 지정한다.
  - back-edge loop counter 임계치 값은 계산식에 의해 33으로 지정된다.
  - 특정 메서드 내 반복문이 33회 회전하면 해당 임계치를 만족하게 된다.

```
$ java -XX:CompileThreshold=100 -XX:OnStackReplacePercentage=33 src/test/java/blog/in/action/JitCompilerTest.java
```

**OSR(On-Stack Replacement)은 컴파일이 완료된 코드로 변경하는 작업을 의미한다.** 대상 코드의 컴파일이 완료되었음에도 최적화되지 않은 코드가 수행되고 있는 것이 발견되는 경우 이를 수행한다. 인터프리터에 의해 수행되는 중에 오랫동안 루프가 지속되는 경우 사용된다. 루프가 끝나지 않고 지속적으로 수행되는 경우에 도움을 준다. 아래 이미지는 이해를 돕기 위해 임의로 그렸다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/jvm-execution-engine-05.png" width="80%" class="image__border image__padding">
</div>

<br/>

간단한 예제 코드로 JIT 컴파일러 실행 여부를 확인해 보자. 반복문을 수행하는 코드를 작성하고 실행한다.

```java
package blog.in.action;

public class JitCompilerTest {

    public static void main(String[] args) {
        int a = 0;
        for (int index = 0; index < 500; index++) {
            long startTime = System.nanoTime();
            for (int subIndex = 0; subIndex < 1000; subIndex++) {
                a++;
            }
            System.out.println("loop count: " + index + ", execution time: " + (System.nanoTime() - startTime));
        }
    }
}
```

위 애플리케이션을 실행하면 다음과 같은 로그를 볼 수 있다.

- 반복 수행 초반부에는 종종 수행 시간이 유독 오래 걸리는 구간이 있다.
- 109회 반복 수행 이후 시간이 1차로 감소한다.
- 336회 반복 수행 이후 시간이 2차로 감소한다.

```
loop count: 0, execution time: 8300
loop count: 1, execution time: 9000
loop count: 2, execution time: 8300
...
loop count: 51, execution time: 8100
loop count: 52, execution time: 890200
loop count: 53, execution time: 8500
...
loop count: 109, execution time: 231500
loop count: 110, execution time: 7700
loop count: 112, execution time: 1600
...
loop count: 335, execution time: 36000
loop count: 336, execution time: 3000
loop count: 337, execution time: 0
...
```

VM 옵션을 변경해서 다시 위 코드를 실행해 보자.

- -XX:CompileThreshold=1(1 미만 불가)
- -XX:OnStackReplacePercentage=33(33 미만 불가)

```
$ java -XX:CompileThreshold=1 -XX:OnStackReplacePercentage=33 src/test/java/blog/in/action/JitCompilerTest.java
```

위 애플리케이션을 실행하면 다음과 같은 로그를 볼 수 있다.

- 75회 반복 수행 이후 시간이 1차로 감소한다.
- 117회 반복 수행 이후 시간이 2차로 감소한다.

```
loop count: 0, execution time: 8300
loop count: 1, execution time: 10100
loop count: 2, execution time: 10100
...
loop count: 74, execution time: 9700
loop count: 75, execution time: 10700
loop count: 76, execution time: 1600
...
loop count: 115, execution time: 2800
loop count: 116, execution time: 58000
loop count: 117, execution time: 8000
loop count: 118, execution time: 0
loop count: 119, execution time: 0
...
```

VM 옵션 변경을 통해 시간이 감소하는 반복 횟수 시점이 앞당겨진 것을 확인할 수 있다.

- 1차 속도 감소 시점 - 109회 > 75회
- 2차 속도 감소 시점 - 336회 > 117회

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-08-26-jvm-execution-engine>

#### REFERENCE

- <https://junhyunny.github.io/information/java/what-is-jvm/>
- [자바 JIT 컴파일러][jit-link]
- <https://beststar-1.tistory.com/3>
- <https://d2.naver.com/helloworld/1230>
- <https://colinch4.github.io/2020-07-30/t-16/>
- <https://www.javatpoint.com/java-interpreter>
- <https://www.tcpschool.com/java/java_intro_programming>
- <https://www.geeksforgeeks.org/how-to-increase-heap-size-in-java-virtual-machine/>
- <https://www.slipp.net/wiki/display/SLS/%231+Java+Compiler>
- <https://www.slipp.net/wiki/pages/viewpage.action?pageId=30770279>

[jvm-link]: https://junhyunny.github.io/information/java/what-is-jvm/
[jit-link]: https://velog.io/@youngerjesus/%EC%9E%90%EB%B0%94-JIT-%EC%BB%B4%ED%8C%8C%EC%9D%BC%EB%9F%AC#4-%EC%9E%90%EB%B0%94%EC%99%80-jit-%EC%BB%B4%ED%8C%8C%EC%9D%BC%EB%9F%AC-%EB%B2%84%EC%A0%84
