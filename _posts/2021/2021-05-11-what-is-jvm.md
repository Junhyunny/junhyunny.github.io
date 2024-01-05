---
title: "JVM(Java Virtual Machine)"
search: false
category:
  - information
  - java
last_modified_at: 2021-09-24T16:00:00
---

<br/>

## 0. 들어가면서

> JVM 메모리 구조에 대해서 설명해주세요.<br/>
> JVM GC 동작 방법에 대해서 설명해주세요.<br/>
> JVM GC 옵션에 대해서 설명해주세요

Java를 사용하면 면접에서 반드시 마주치는 질문입니다. 
Java 가상머신(JVM, Java Virtual Machine)에 대한 정리는 자주 시도했었지만, 매번 끝까지 작성하진 못 했습니다. 
관련된 내용들을 읽다보면 방대한 자료와 어려운 내용에 압도 당해 중도에 포기하곤 했습니다. 
큰 내용들을 쪼개고 쪼개어 `JVM`에 대한 넓고 얇은 지식들을 차곡차곡 정리해보겠습니다. 

## 1. JVM(Java Virtual Machine)

Java 가상 머신이라고 불리는 소프트웨어로 Java 어플리케이션이 동작할 수 있는 환경을 제공합니다. 
JVM은 어플리케이션과 운영체제(OS, Operating System) 사이에서 중재자 역할을 수행합니다. 
JVM 덕분에 Java는 어느 운영체제 환경에서도 실행될 수 있고, **`‘write once and run anywhere’`**이라는 별명을 얻게 되었습니다. 

## 2. JVM 구성 요소

JVM 구상 요소는 크게 네 가지로 분류할 수 있습니다. 
아래 구성 요소에 대해서 조금 더 자세히 다뤄보겠습니다. 

* Class Loader
* Execution Engine
* Runtime Data Area
* Garbage Collector

##### Structure of JVM

<p align="center">
    <img src="/images/what-is-jvm-1.jpg" width="80%" class="image__border">
</p>
<center>https://jeong-pro.tistory.com/148</center>

### 2.1. 클래스 로더(Class Loader)

`.java` 확장자 파일들은 Java 컴파일러(JAVAC)에 의해 `.class` 확장자 파일로 변환됩니다. 
`.class` 파일은 바이트 코드(byte code)로 작성되어 있습니다. 
클래스 로더는 생성된 클래스 파일들을 JVM 메모리 영역인 `Runtime Data Area`으로 적재하는 역할을 수행합니다. 

### 2.2. 실행 엔진(Execution Engine)

실행 엔진은 메모리에 적재된 클래스(바이트 코드)들을 기계어로 변경하여 명령어(instruction) 단위로 실행합니다. 
바이트 코드를 운영체제에 맞게 해석해주는 역할을 수행합니다. 
실행 엔진이 바이트 코드를 명령어 단위로 읽어서 수행하는데 크게 두 가지 방식이 사용됩니다. 

* 인터프리터(Interpreter) - 한 줄씩 해석하고 실행
* JIT(Just In Time) - 바이트 코드를 운영체제에 맞는 기계어로 변경 후 실행

### 2.3. 실행 데이터 영역(Runtime Data Area)

운영체제로부터 할당 받은 메모리 영역입니다. 
JVM은 이 영역에 어플리케이션에서 사용하는 데이터들을 적재합니다. 
실행 데이터 영역은 크게 5개의 영역으로 나눌 수 있습니다.

* 메소드 영역(Method Area 혹은 Static Area)
    * 클래스 멤버 변수의 이름, 데이터 타입, 접근 제어자 정보 같은 필드 정보 저장
    * 메소드 이름, 리턴 타입, 파라미터, 접근 제어자 정보 같은 메소드 정보 저장
    * Type(인터페이스, 클래스) 정보, 상수, static 변수, final class 변수 정보 저장
    * 모든 스레드가 공유 가능
* 힙 영역(Heap Area)
    * 런타임 시 동적으로 할당하여 사용하는 객체(new), 배열 저장
    * 메소드 영역에 로드된 클래스만 생성이 가능
    * 가비지 컬렉터가 관리하는 메모리 영역
    * 모든 스레드가 공유 가능
* 스택 영역(Stack Area)
    * 메소드 호출 시 생성되는 스레드 수행 정보(frame) 저장
    * 메소드 정보, 지역 변수, 매개 변수, 연산 중 발생하는 임시 데이터 저장
    * **`{}`** 로 사용할 수 있는 영역을 지정
    * 각 스레드 별로 소유
* PC register
    * 현재 실행 중인 JVM 주소 정보를 저장
    * 수행해야하는 CPU 명령어(instruction) 위치 정보를 저장
    * 각 스레드 별로 소유
* Native Method Stack
    * Java 외 언어로 작성된 네이티브 코드를 위한 메모리
    * C/C++ 등의 코드를 수행하기 위한 스택(Stack)
    * 네이티브 메소드(native method)의 매개변수, 지역변수 등을 바이트 코드로 저장
    * 각 스레드 별로 소유

가비지 컬렉터(gc, garbage collector)의 동작 방식을 정확하게 이해하려면 힙 메모리 영역의 구조를 알아야 합니다. 
힙 영역은 데이터 생성 시간에 따라 메모리를 관리할 수 있도록 5개의 영역으로 구분되어 있습니다. 

* Eden 
    * new 키워드를 통해 객체가 생성되는 최초의 영역
    * Young Generation
    * Minor GC 수행
* Survivor1, Survivor2 
    * Eden 영역에서 GC 대상이 아닌 객체들을 전달받아 저장하는 영역
    * Young Generation
    * Minor GC 수행 영역
* Old 
    * Young Generation 영역에서 GC 대상이 아니라 살아남은 객체들이 이동하는 영역
    * Major GC 수행 영역
* Permanent 
    * 클래스 로더에 의해 적재된 클래스들의 정보를 저장 
    * JDK1.8부터는 Metaspace

##### Structure of Runtime Data Area

<p align="center">
    <img src="/images/what-is-jvm-2.jpg" width="80%" class="image__border">
</p>
<center>자바와 JVM 메모리 구조</center>

### 2.4. 가비지 컬렉터(Garbage Collector)

힙 메모리 영역에 생성된 객체들 중에 참조되지 않은 객체들을 탐색 후 제거하는 역할을 수행합니다. 
가비지 컬렉터 동작 시 JVM 어플리케이션 실행이 멈추게 되는데 이를 `STOP-THE-WORLD` 라고 표현합니다. 
시스템 동작이 멈추는 작업이기 때문에 굉장히 비용이 큰 작업입니다. 
개발자는 `STOP-THE-WORLD` 시간을 줄이기 위해 가비지 컬렉션의 동작 방식과 알고리즘에 관련한 공부가 필요합니다. 

#### 2.4.1. 가비지 컬렉션 방식

* Major Garbage Collection 
    * Old, Perm 메모리 영역에서 발생하는 GC
* Minor Garbage Collection 
    * Young 메모리 영역에서 발생하는 GC
* Full Garbage Collection 
    * 메모리 전체를 대상으로 수행하는 GC

#### 2.4.2. 가비지 컬렉터 종류

* Serial Garbage Collector
* Parallel Garbage Collector
* CMS Garbage Collector
* G1 Garbage Collector(JDK7)
* Epsilon Garbage Collector(JDK11)
* Z garbage collector(JDK11)
* Shenandoah Garbage Collector(JDK12)

#### RECOMMEND NEXT POSTS

* [JVM 실행 엔진(Execution Engine)][jvm-execution-engine-link]

#### REFERENCE

* [JVM 이란?][jvm-blog-link]
* [자바와 JVM 메모리 구조][jvm-memory-blog-link]
* <https://d2.naver.com/helloworld/1230>
* <https://d2.naver.com/helloworld/1329>
* <https://en.wikipedia.org/wiki/Java_virtual_machine>
* <https://jeong-pro.tistory.com/148>
* <https://asfirstalways.tistory.com/158>

[jvm-blog-link]: https://medium.com/@lazysoul/jvm-%EC%9D%B4%EB%9E%80-c142b01571f2
[jvm-memory-blog-link]: https://velog.io/@agugu95/%EC%9E%90%EB%B0%94%EC%99%80-JVM-%EA%B7%B8%EB%A6%AC%EA%B3%A0-%EB%A9%94%EB%AA%A8%EB%A6%AC-%EA%B5%AC%EC%A1%B0
[jvm-execution-engine-link]: https://junhyunny.github.io/information/java/jvm-execution-engine/