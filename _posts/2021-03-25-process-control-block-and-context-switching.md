---
title: "PCB(Process Control Block)와 문맥 교환(Context Switching)"
search: false
category:
  - information
  - operating-system
last_modified_at: 2021-08-24T01:30:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Proccess and Thread][process-vs-thread-link]

## 1. PCB(Process Control Block)

PCB(Process Control Block) 혹은 TCB(Task Control Block)는 특정 프로세스에 대한 정보를 담고 있는 자료구조입니다. 
운영체제는 PCB에 담긴 프로세스 정보를 이용하여 프로세스를 관리/제어합니다. 
프로세스가 생성될 때마다 고유의 PCB가 생성되고 프로세스가 완료되면 제거됩니다. 
PCB는 프로세스의 중요한 정보를 포함하고 있으므로 일반 사용자가 접근하지 못하는 보호된 메모리 영역에 존재합니다. 

### 1.1. PCB에 담기는 프로세스 정보
- Process id - 프로세스 ID
- Process state - 프로세스의 상태(new ready waiting, running, terminated)
- Program counter - 다음 명령의 주소를 가리키고 있는 계수기
- CPU register - CPU 레지스터
- CPU-scheduling information - 프로세스의 우선순위, 최종 실행 시간, 스케줄링 큐를 가리키는 포인터 등
- Memory-management information - register, 페이지 테이블, 세그먼트 테이블의 base, limit 값에 대한 정보
- Accounting information - CPU 사용 시간, 실제 사용된 시간, 시간 제한 등
- I/O status information - 프로세스에 할당된 I/O 기기에 해당하는 정보

<p align="center"><img src="/images/process-control-block-and-context-switching-1.JPG" width="45%"></p>
<center>Operating System Concepts 9th</center>

## 2. 문맥 교환(Context Switching)

문맥 교환을 한다고 하는데 우선 문맥(Context)가 무엇인지 먼저 정의해보겠습니다. 

> **문맥(Context)**<br/>
> 현재 CPU가 실행하고 있는 프로세스의 정보

현재 CPU가 현재 실행하고 있는 프로세스의 정보를 문맥이라고 하니 이를 교환하는 행위를 문맥 교환(Context Switching)이라고 정의 내릴 수 있겠습니다. 
현재 실행 중인 프로세스의 정보를 담고 있는 CPU 레지스터의 내용이 다음 실행할 프로세스의 정보로 변경되는 것을 의미합니다. 
즉, 프로세스A를 실행 중이던 CPU가 프로세스B를 실행하기 위해 프로세스A의 정보를 **`'어딘가'`**에 저장하고 프로세스B의 정보를 **`'어딘가'`**로부터 꺼내오는 것을 의미합니다. 
**여기서 말하는 `'어딘가'`가 바로 PCB(Process Control Block)입니다.**

### 2.1. 문맥 교환 시나리오
1. P0 프로세스가 인터럽트되면서 PCB0에 P0 프로세스의 상태 정보를 저장합니다.
1. 다음 수행할 P1 프로세스의 PCB1에서 P1 프로세스의 상태 정보가 CPU에 재로딩됩니다.
1. P1 프로세스를 일정 시간 수행합니다.
1. P1 프로세스가 인터럽트되면서 PCB1에 P1 프로세스의 상태 정보를 저장합니다.
1. 다음 수행할 P0 프로세스의 PCB0에서 P0 프로세스의 상태 정보가 CPU에 재로딩됩니다.
1. P0 프로세스를 일정 시간 수행합니다.

<p align="center"><img src="/images/process-control-block-and-context-switching-2.JPG" width="65%"></p>
<center>Operating System Concepts 9th</center>

#### REFERENCE
- [Operating System Concepts 9th][operating-system-link]
- <https://shoark7.github.io/programming/knowledge/difference-between-process-and-thread>

[operating-system-link]: http://www.kyobobook.co.kr/product/detailViewKor.laf?mallGb=KOR&ejkGb=KOR&barcode=9788998886813

[process-vs-thread-link]: https://junhyunny.github.io/information/operating-system/process-vs-thread/