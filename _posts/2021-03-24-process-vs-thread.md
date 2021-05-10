---
title: "프로세스(Process)와 스레드(Thread)의 차이점"
search: false
category:
  - information
  - operating-system
last_modified_at: 2021-03-24T09:00:00
---

<br>

## 프로그램(Program)

> 실행 가능한 명령어의 집합, 운영체제로부터 메모리를 할당받지 못한 정적인 상태

## 프로세스(Process)

> 프로세스(Process)는 운영체제로부터 자원을 할당받는 작업의 단위<br>
> 메모리에 적재되어 실행되고 있는 프로그램

프로세스는 실행될 때 운영체제로부터 프로세서, 필요한 주소 공간, 메모리(code, data, stack, heap) 등의 자원을 할당 받습니다. 
프로세스는 서로 메모리 공간을 독자적으로 갖습니다. 
다른 프로세스의 메모리에 접근하려면 IPC(InterProcess Communication)과 같은 방식이 필요합니다. 
프로세스는 하나 이상의 스레드를 포함합니다.

> 프로세스는 프로그램의 인스턴스(instance)

하나의 프로그램에서 여러 개의 프로세스가 실행 가능합니다. 
예를 들어 Windows **'메모장'** 이라는 프로그램을 여러 번 동작시키면 여러 개의 **'메모장(프로세스)'**이 실행됩니다. 
추가적으로 프로세스들은 서로 메모리 공간을 독자적으로 갖는다고 하였는데 예외 사항으로 code 영역은 같은 프로그램의 프로세스들끼리 공유합니다. 

### 프로세스 메모리 구조
- code(text) 영역 - 실행할 프로그램의 코드
- data 영역 - 전역 변수, 정적 변수가 담기는 영역
- stack 영역 - 지역 변수, 매개 변수같은 임시적인 데이터들이 담기는 영역
- heap 영역 - 런타임시 동적으로 메모리를 할당받는 영역

<p align="center"><img src="/images/process-vs-thread-1.JPG" width="30%"></p>
<center>이미지 출처, Operating System Concepts 9th</center><br>

## 스레드(Thread)

> 스레드는 프로세스가 할당받은 자원을 이용하는 실행의 단위

스레드는 프로세스 내에서 동작되는 여러 개의 실행 흐름입니다. 
프로세스 내의 주소 공간이나 자원들을 프로세스 내 스레드들끼리 공유하여 사용합니다.(전역 변수 등) 
메모리를 공유하기 때문에 동기화, 교착 상태(dead lock) 등의 문제가 발생할 수 있습니다. 
각 스레드는 독자적인 스택(stack) 메모리를 가집니다. 

### 스레드 메모리 구조

<p align="center"><img src="/images/process-vs-thread-2.JPG" width="55%"></p>
<center>이미지 출처, Operating System Concepts 9th</center><br>

### 스레드 사용 시 장점
- 프로세스 간 통신에 비해 스레드 간 통신은 간단하다.
  - 서로 공유하는 변수만으로 쉽게 데이터를 주고 받을 수 있다.
- 시스템 자원 소모가 줄어든다.
  - 기존 프로세스의 자원을 스레드들이 공유하기 때문에 자원을 새로 할당하지 않아도 된다.
  - 자원을 할당하기 위한 시스템 콜 횟수가 줄어듭니다.

### 스레드 사용 시 단점
- 멀티 스레드를 사용하는 프로그램을 작성하는 경우 공유되는 메모리에 대한 설계가 필요한다.

##### 프로세스와 스레드 차이점 요약

| 차이 | 프로세스 | 스레드 |
|:---:|:---|:---|
| 자원 할당 여부 | 실행 시마다 새로운 자원을 할당 | 자신을 실행한 프로세스의 자원을 공유 |
| 자원 공유 여부 | 자원을 공유하지 않는다. 같은 프로그램의 프로세스일 경우 코드를 공유하기는 한다. | 같은 프로세스 내 스레드들은 스택을 제외한 나머지 세 영역을 공유한다. | 
| 독립성 여부 |	일반적으로 독립적 | 일반적으로 프로세스의 하위 집합 |
| 주소 소유 여부 | 별개의 주소 공간을 갖는다. | 주소 공간을 공유한다.
| 통신 여부 | 오직 시스템이 제공하는 IPC 방법으로만 통신 | 공유 변수 수정 등 자유롭게 다른 스레드와 소통 |
| Context Switch | 일반적으로 프로세스보다 스레드의 Context Switching이 더 빠를 수 있다. | 하지만 상황에 따라 그렇지 않을 수도 있다. |

## OPINION

> 프로세스와 스레드에 대해서 설명해주세요.<br>
> 익숙한 질문입니다. 신입 개발자 면접 질문 목록에서 빠지지 않고 등장하는 질문인데요.

네, 신입 개발자 면접 질문 목록에서 빠지지 않는 질문이라고 합니다. 
그런데 저는 대답을 못했네요.😰 
자만스럽게도 저는 스스로를 나름 실력 있는 개발자라고 생각하고 있었나봅니다. 
준비가 부족한 사람은 기회가 왔을 때 잡아내지 못한다는 사실을 잘 알면서도 준비하지 않은 제 자신에게 화가 납니다. 
가고 싶은 회사였기 때문에 면접에 아쉬움이 남습니다. 
오늘 대답하지 못한 내용들을 다시 정리해보면서 다음 기회를 노려보도록 하겠습니다. 

#### REFERENCE
- [Operating System Concepts 9th][operating-system-link]
- [프로세스와-스레드의-차이][difference-of-process-thread-link]
- <https://gbsb.tistory.com/312>
- <https://juyoung-1008.tistory.com/47>
- <https://shoark7.github.io/programming/knowledge/difference-between-process-and-thread>

[operating-system-link]: http://www.kyobobook.co.kr/product/detailViewKor.laf?mallGb=KOR&ejkGb=KOR&barcode=9788998886813
[difference-of-process-thread-link]: https://velog.io/@raejoonee/%ED%94%84%EB%A1%9C%EC%84%B8%EC%8A%A4%EC%99%80-%EC%8A%A4%EB%A0%88%EB%93%9C%EC%9D%98-%EC%B0%A8%EC%9D%B4
