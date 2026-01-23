---
title: "Cloud Container"
search: false
category:
  - information
last_modified_at: 2021-11-30T23:55:00
---

<br/>

## 0. 들어가면서

새로운 회사의 온보딩 과정에서 많은 내용들을 배우면서 지내고 있습니다. 
팀원과 대화 중 도커 관련된 내용이 나왔었는데, 아직도 모르는게 많다는 점을 다시 느꼈습니다. 
개념은 얼추 알고 있지만 업무에서 직접적으로 사용해보진 않아서 깊은 부분까진 몰랐습니다. 
회사의 주요 솔루션들 대부분이 클라우드 컨테이너를 다루는데, 곰곰히 생각해보면 저는 컨테이너에 대한 정확한 개념을 잘 모르는 것 같습니다. 
소속한 팀과 맡은 역할은 컨테이너 솔루션과 다소 거리가 있지만, 컨테이너에 대한 기본적인 개념은 알아두면 좋을 것이라 생각이 됩니다.

이번 포스트는 컨테이너에 대한 개념을 정리하였습니다. 
컨테이너에 대한 내용들을 읽어보면 흔히 가상 머신(Virtual Machine)과 비교를 합니다. 
가상 머신을 사용할 때 어떤 문제점들이 있었고, 왜 컨테이너가 클라우드 시장에서 우위를 선점하게 되었는지 이야기해 보겠습니다.

## 1. 가상 머신(Virtual Machine)

> 물리적 컴퓨터와 동일한 기능을 제공하는 소프트웨어 컴퓨터입니다. 

가상 머신은 물리적인 컴퓨터에서 실행되는 소프트웨어입니다. 
이 소프트웨어는 컴퓨터 환경을 에뮬레이팅(emulating)합니다. 
가상 머신은 자신이 물리적 컴퓨터처럼 동작하며, 컴퓨터를 관리하는 운영체제(예를 들어, Windows, Linux, MacOS)와 애플리케이션을 실행합니다. 
가상 머신 내부에 소프트웨어는 호스트 컴퓨터를 변조할 수 없기 때문에 바이러스에 감염된 데이터에 액세스하거나 운영체제를 테스트하는 것처럼 위험한 작업을 수행하기 위해 사용합니다. 
서버 가상화 등의 목적으로도 사용됩니다. 

## 1.1. 가상 머신 실행 환경
- 물리적인 기계(hardware)와 이를 관리하는 호스트 운영체제(Host OS)가 존재합니다. 
- 가상 머신이 동작할 수 있는 환경을 만들어주는 하이퍼바이저(hypervisor) 플랫폼이 호스트 운영체제에서 동작합니다.
- 가상 머신 에뮬레이터가 하이퍼바이저 플랫폼에서 동작합니다.
- 가상 머신 내부에서 운영체제(Guest OS)와 실행 파일, 라이브러리, 애플리케이션이 동작합니다.
- 가상 머신들끼리는 독립적(independent)으로 구성되며 서로의 존재를 알 수 없습니다. 

<p align="center"><img src="/images/cloud-container-1.gif" width="40%"></p>

## 1.2. 가상 머신 장점
다음과 같은 장점을 가지고 있습니다.
- 하나의 물리적 컴퓨터에서 여러 운영체제 환경을 실행할 수 있습니다.
- 호스트에서 진행하기 위험한 작업을 수행할 수 있습니다.

## 1.2. 가상 머신 한계
다음과 같은 한계점을 가지고 있습니다. 
- 하나의 물리적 시스템에서 여러 가상 머신을 사용하는 경우 성능이 불안정해질 수 있습니다.
- 가상 머신은 물리적 컴퓨터보다 효율성이 떨어지고 실행 속도가 느립니다.
- Guest OS 인스턴스가 필요하기 때문에 더 많은 자원(resource)을 필요로 합니다.

## 2. 컨테이너(Container)

> 컨테이너는 데스크탑, 기존의 IT 또는 클라우드 등 어디서나 실행될 수 있도록 애플리케이션 코드가 
> 해당 라이브러리 및 종속 항목과 함께 패키징되어 있는 소프트웨어 실행 유닛입니다.

소프트웨어는 운영체제와 라이브러리에 대해 의존성을 가집니다. 
간단히 말해 운영체제 종류나 라이브러리 버전에 영향을 받습니다. 
컨테이너 기술은 애플리케이션이 운영체제나 라이브러리 버전에 영향을 받지 않도록 실행 환경을 독립적으로 구성해줍니다. 
다른 실행 환경과의 간섭을 막고 실행의 독립성을 확보해주는 운영체제 수준의 격리 기술을 의미합니다. 
애플리케이션과 관련된 라이브러리, 실행 파일, 설정 등 필요한 모든 것들을 패키지(package)로 묶어 서비스 실행을 위한 격리된 환경을 제공합니다. 
실행할 수 있도록 함께 묶은 패키지 파일을 `이미지`라고 합니다.

### 2.1. 컨테이너 실행 환경
- 물리적인 기계(hardware)와 이를 관리하는 운영체제가 존재합니다. 
- 컨테이너 이미지를 실행할 수 있는 환경인 컨테이너 런타임(예를 들어, Docker)이 운영체제에서 동작합니다. 
- 컨테이너 런타임에서 컨테이너 이미지들을 실행합니다. 
- 컨테이너 런타임에서 실행되는 프로세스들은 호스트 머신(host machine)의 커널(kernel)을 공유합니다.

<p align="center"><img src="/images/cloud-container-2.gif" width="40%"></p>

### 2.2. 프로세스 격리 기능

컨테이너로 묶여 실행되는 프로세스들은 커널을 공유하지만, 리눅스의 네임스페이스(namespace), 컨트롤 그룹(control group) 기능을 통해 격리되어 실행됩니다. 
이런 기능을 통해 호스트 머신 입장에서는 단순 프로세스들이지만, 각 프로세스 관점에서는 독립적인 실행 환경으로 보이게 됩니다. 
관련된 내용을 깊게 공부하여 정리하고 싶었지만, 이해하기 어려운 부분이 있어서 얕은 수준으로 정리하였습니다. 
운영체제(OS)에 대한 깊은 이해도를 가지고, 커널 프로그래밍을 다뤄봤다면 포스트하기 좋은 주제일 것 같습니다.

#### 2.2.1. 네임스페이스(namespace)

> Wiki<br/>
> Namespaces are a feature of the Linux kernel that partitions kernel resources such that 
> one set of processes sees one set of resources 
> while another set of processes sees a different set of resources.

프로세스 집합 별로 허용된 자원들만 확인할 수 있도록 커널 자원을 분할하는 기능입니다. 
프로세스 집합을 격리시키는 기능이며, 각 프로세스 집합 별로 독립된 사용 환경을 제공합니다. 

다음과 같은 네임스페이스 기능들이 존재합니다.
- UTS namespace - hostname 을 변경하고 분할
- IPC namespace - Inter-process communication. 프로세스간 통신 격리
- PID namespace - PID (Process ID)를 분할 관리
- NS namepsace - file system 의 mount 지점을 분할하여 격리
- NET namespace - Network interface, iptables 등 network 리소스와 관련된 정보를 분할
- USER namespace - user와 group ID를 분할 격리

##### PID namespace 분리
- `PID namespace` 분리 시 특정 네임스페이스 영역의 프로세스는 다른 네임스페이스 영역의 프로세스를 알 수 없습니다. 
    - `NS namepsace` 분리까지 이뤄진 경우 정확하게 동작합니다.

<p align="center"><img src="/images/cloud-container-3.JPG" width="50%"></p>
<center>https://iamabhishek-dubey.medium.com/linux-namespaces-part-1-b565f3d404af</center>

#### 2.2.2. 컨트롤 그룹(cgroup)

> Wiki<br/>
> cgroups (abbreviated from control groups) is a Linux kernel feature that 
> limits, accounts for, and isolates the resource usage (CPU, memory, disk I/O, network, etc.) of 
> a collection of processes. 

하드웨어 자원(CPU, memory, disk I/O, network, etc.)을 프로세스 집합에게 할당하고 제한하는 기능입니다. 

<p align="center"><img src="/images/cloud-container-4.JPG" width="50%"></p>
<center>https://stackoverflow.com/questions/54937542/how-to-enable-cgroups-in-linux</center>

### 2.3. Why using container?
최근 클라우드 시장을 가상 머신이 아닌 컨테이너가 점유하게 되었는지, 컨테이너의 장점을 정리하면서 알아보겠습니다. 

##### 이식성이 좋다.
컨테이너 런타임만 존재한다면 어디서든 실행 가능합니다. 
개발자는 자신이 개발한 애플리케이션을 컨테이너로 만들면 컨테이너 런타임이 지원되는 어느 환경에서도 실행 가능합니다.

##### 가볍다.
가상화를 위한 에뮬레이터, 게스트 운영체제(guest OS)가 필요 없습니다. 
컨테이너들은 시스템 OS 커널을 공유합니다. 
작아진 크기로 신속한 수평 확장(scale-out) 가능합니다.

##### 배포가 쉽다.
애플리케이션 종속 항목들을 하나의 패키지로 묶어 이미지로 만들었기 때문에 쉽게 복제가 가능합니다. 
또한, 이미지의 크기가 작기 때문에 컨테이너가 동작하기까지 걸리는 시간이 짧습니다. 

#### REFERENCE
- <https://www.ibm.com/kr-ko/cloud/learn/containers>
- <https://www.ibm.com/cloud/blog/containers-vs-vms>
- <https://www.vmware.com/kr/topics/glossary/content/virtual-machine.html>
- <https://en.wikipedia.org/wiki/Linux_namespaces>
- <https://en.wikipedia.org/wiki/Cgroups>
- <https://bluese05.tistory.com/11>
- <https://nearhome.tistory.com/83>
- <https://www.44bits.io/ko/keyword/linux-container>
- <https://iamabhishek-dubey.medium.com/linux-namespaces-part-1-b565f3d404af>
- <https://stackoverflow.com/questions/54937542/how-to-enable-cgroups-in-linux>