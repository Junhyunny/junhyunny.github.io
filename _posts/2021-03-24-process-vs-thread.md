---
title: "Proccess and Thread"
search: false
category:
  - information
  - operating-system
last_modified_at: 2021-08-24T01:30:00
---

<br/>

## 1. Program

> 프로그램(Program)<br/>
> 실행 가능한 명령어의 집합, 운영체제로부터 메모리를 할당받지 못한 정적인 상태

## 2. Process

> 프로세스(Process)는 운영체제로부터 자원을 할당받는 작업의 단위<br/>
> 메모리에 적재되어 실행되고 있는 프로그램

프로세스는 실행될 때 운영체제로부터 프로세서, 필요한 주소 공간, 메모리(code, data, stack, heap) 등의 자원을 할당 받습니다. 
프로세스는 서로 메모리 공간을 독자적으로 갖습니다. 
다른 프로세스의 메모리에 접근하려면 IPC(InterProcess Communication)과 같은 방식이 필요합니다. 
프로세스는 하나 이상의 스레드를 포함합니다.

> 프로세스는 프로그램의 인스턴스(instance)

하나의 프로그램에서 여러 개의 프로세스가 실행 가능합니다. 
예를 들어 Windows `메모장` 이라는 프로그램을 여러 번 동작시키면 여러 개의 `메모장(프로세스)`이 실행됩니다. 
추가적으로 프로세스들은 서로 메모리 공간을 독자적으로 갖는다고 하였는데 예외 사항으로 코드(code) 영역은 같은 프로그램의 프로세스들끼리 공유합니다. 

### 2.1. Structure of Process Memory

* 코드(code or text) 영역 - 실행할 프로그램의 코드
* 데이터(data) 영역 - 전역 변수, 정적 변수가 담기는 영역
* 스택(stack) 영역 - 지역 변수, 매개 변수같은 임시적인 데이터들이 담기는 영역
* 힙(heap) 영역 - 런타임시 동적으로 메모리를 할당받는 영역

<p align="center">
    <img src="/images/process-vs-thread-1.JPG" width="30%" class="image__border">
</p>
<center>Operating System Concepts 9th</center>

## 3. Thread

> 스레드(Thread)는 프로세스가 할당받은 자원을 이용하는 실행의 단위

스레드는 프로세스 내에서 동작되는 여러 개의 실행 흐름입니다. 
프로세스 내의 주소 공간이나 자원들을 프로세스 내 스레드들끼리 공유하여 사용합니다.(전역 변수 등) 
메모리를 공유하기 때문에 동기화, 교착 상태(dead lock) 등의 문제가 발생할 수 있습니다. 
각 스레드는 독자적인 스택(stack) 메모리를 가집니다. 

### 3.1. Structure of Thread Memory

* 각 스레드 별로 레지스터와 스택을 가집니다.
* 코드, 데이터, 파일은 공유합니다.

<p align="center">
    <img src="/images/process-vs-thread-2.JPG" width="60%" class="image__border">
</p>
<center>Operating System Concepts 9th</center>

### 3.2. Advantage of Thread

* 프로세스 간 통신에 비해 스레드 간 통신은 간단합니다.
    * 서로 공유하는 변수만으로 쉽게 데이터를 주고 받을 수 있습니다.
* 시스템 자원 소모가 줄어듭니다.
    * 기존 프로세스의 자원을 스레드들이 공유하기 때문에 자원을 새로 할당하지 않아도 됩니다.
    * 자원을 할당하기 위한 시스템 콜(system call) 횟수가 줄어듭니다.

### 3.3. Disadvantage of Thread

* 멀티 스레드를 사용하는 프로그램을 작성하는 경우 공유되는 메모리 사용을 주의해야 합니다.

##### Summary Process and Thread

| 차이 | 프로세스 | 스레드 |
|:---:|:---|:---|
| 자원 할당 여부 | 실행 시마다 새로운 자원을 할당 | 자신을 실행한 프로세스의 자원을 공유 |
| 자원 공유 여부 | 자원을 공유하지 않는다. 같은 프로그램의 프로세스일 경우 코드를 공유하기는 한다. | 같은 프로세스 내 스레드들은 스택을 제외한 나머지 세 영역을 공유한다. | 
| 독립성 여부 |    일반적으로 독립적 | 일반적으로 프로세스의 하위 집합 |
| 주소 소유 여부 | 별개의 주소 공간을 갖는다. | 주소 공간을 공유한다.
| 통신 여부 | 오직 시스템이 제공하는 IPC 방법으로만 통신 | 공유 변수 수정 등 자유롭게 다른 스레드와 소통 |
| Context Switch | 일반적으로 프로세스보다 스레드의 Context Switching이 더 빠를 수 있다. | 하지만 상황에 따라 그렇지 않을 수도 있다. |

#### RECOMMEND NEXT POSTS

* [PCB(Process Control Block) and Context Switching][process-control-block-and-context-switching-link]

#### REFERENCE

* [Operating System Concepts 9th][operating-system-link]
* [프로세스와-스레드의-차이][difference-of-process-thread-link]
* <https://gbsb.tistory.com/312>
* <https://juyoung-1008.tistory.com/47>
* <https://shoark7.github.io/programming/knowledge/difference-between-process-and-thread>

[operating-system-link]: http://www.kyobobook.co.kr/product/detailViewKor.laf?mallGb=KOR&ejkGb=KOR&barcode=9788998886813
[difference-of-process-thread-link]: https://velog.io/@raejoonee/%ED%94%84%EB%A1%9C%EC%84%B8%EC%8A%A4%EC%99%80-%EC%8A%A4%EB%A0%88%EB%93%9C%EC%9D%98-%EC%B0%A8%EC%9D%B4

[process-control-block-and-context-switching-link]: https://junhyunny.github.io/information/operating-system/process-control-block-and-context-switching/