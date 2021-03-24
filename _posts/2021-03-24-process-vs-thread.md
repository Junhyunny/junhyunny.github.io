---
title: "프로세스(Process)와 스레드(Thread)의 차이점"
search: false
category:
  - information
  - operating-system
last_modified_at: 2021-03-24T00:00:00
---

<br>

## 프로세스(Process)

> 프로세스(Process)는 운영체제로부터 자원을 할당받는 작업의 단위

프로세스는 실행될 때 운영체제로부터 프로세서, 필요한 주소 공간, 메모리(code, data, stack, heap) 등의 자원을 할당 받습니다. 
프로세스는 서로 메모리 공간을 독자적으로 갖기 때문에 프로세스 간 메모리 공간을 공유하지 못합니다. 
다른 프로세스의 메모리에 접근하려면 IPC(InterProcess Communication)과 같은 방식이 필요합니다. 
프로세스는 하나 이상의 스레드를 포함합니다.

### 프로세스 메모리 구조
- code(text) 영역, 실행할 프로그램의 코드
- data 영역, 전역 변수, 정적 변수가 담기는 영역
- stack 영역, 지역 변수, 매개 변수같은 임시적인 데이터들이 담기는 영역
- heap 영역, 런타임시 동적으로 메모리를 할당받는 영역

<p align="center"><img src="/images/process-vs-thread-1.JPG" width="25%"></p>
<center>이미지 출처, Operating System Concepts 9th</center><br>

## 스레드(Thread)

> 스레드는 프로세스가 할당받은 자원을 이용하는 실행의 단위

스레드는 프로세스 내에서 동작되는 여러 실행의 흐름입니다. 
여러 개의 스레드가 모여 하나의 프로세스를 이루게 됩니다. 
프로세스 내의 주소 공간이나 자원들을 프로세스 내 스레드들끼리 공유하여 사용합니다. 
메모리를 공유하기 때문에 동기화, 데드락 등의 문제가 발생할 수 있습니다. 
각 스레드는 독자적인 스택(stack) 메모리를 가집니다. 

### 프로세스가 멀티 스레드를 사용하는 이유

> 운영체제의 시스템 자원을 효율적으로 관리하기 위해 스레드를 사용합니다. 

프로세스는 운영체제로부터 시스템 콜(call)을 통해 자원을 할당받습니다. 
여러 개의 프로세스를 생성하는 일은 부담이 생깁니다. 
또한 프로세스 간의 IPC 통신 방식은 복잡합니다. 

이와 다르게 프로세스가 멀티 스레드를 사용한다면 시스템 콜을 한번만 해도 되기 때문에 효율적입니다. 
스레드 간 통신은 덜 복잡하고 시스템 자원 사용이 적으므로 통신의 부담도 줄일 수 있습니다. 
스레드 간 동기화 문제가 생겨서 개발자가 신경써야 하는 단점이 있지만 작업(Task)의 비용을 줄인다는 장점이 있습니다.   

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
- <https://brunch.co.kr/@kd4/3>
- <https://gbsb.tistory.com/312>
- <https://juyoung-1008.tistory.com/47>
- [Operating System Concepts 9th][operating-system-link]
- [프로세스와-스레드의-차이][difference-of-process-thread-link]

[operating-system-link]: http://www.kyobobook.co.kr/product/detailViewKor.laf?mallGb=KOR&ejkGb=KOR&barcode=9788998886813
[difference-of-process-thread-link]: https://velog.io/@raejoonee/%ED%94%84%EB%A1%9C%EC%84%B8%EC%8A%A4%EC%99%80-%EC%8A%A4%EB%A0%88%EB%93%9C%EC%9D%98-%EC%B0%A8%EC%9D%B4