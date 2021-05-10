---
title: "JVM, Java Virtual Machine"
search: false
category:
  - information
  - java
last_modified_at: 2021-05-11T00:00:00
---

<br>

> JVM 메모리 구조에 대해서 설명해주세요.<br>
> JVM GC 동작 방법에 대해서 설명해주세요.<br>
> JVM GC 옵션에 대해서 설명해주세요

Java 언어를 사용하면 면접에서 필연적으로 마주치는 질문입니다. 
질문을 멈춰주세요.😭 

<p align="center"><img src="/images/what-is-jvm-1.jpg" width="80%"></p>
<center>이미지 출처, One Piece 126화</center><br>

정리를 시도했다가도 매번 끝까지 작성하지 못하는 주제입니다. 
JVM과 관련된 내용을 읽다보면 방대한 자료와 어려운 내용에 압도 당하여 다음에 써야지라는 생각이 들어 중도에 작성을 포기합니다. 
그렇다보니 항상 받는 질문이지만 시원하게 대답하지 못 했습니다. 
더 이상은 물러나지 않겠습니다. 
조금 타협하여 관련된 내용을 쪼개고 쪼개어, JVM에 대한 넓고 얇은 지식들을 계속 쌓아보겠습니다. 

## JVM(Java Virtual Machine)

자바 가상 머신이라고 불리는 소프트웨어로 자바 어플리케이션이 동작할 수 있는 환경을 제공합니다. 
자바 어플리케이션과 운영체제(OS, Operating System) 사이에서 중재자 역할을 수행합니다. 
자바는 JVM을 통해 어느 운영체제 환경에서도 수행될 수 있습니다. 
JVM 덕분에 **`‘write once and run anywhere’`**이라는 별명을 얻을 수 있었습니다. 

##### JVM 구조
<p align="center"><img src="/images/what-is-jvm-2.jpg" width="80%"></p>
<center>이미지 출처, https://jeong-pro.tistory.com/148</center><br>

### JVM 구성 요소
JVM 구상 요소는 크게 네 가지로 분류할 수 있습니다. 

#### Class Loader

#### Execution Engine

#### Garbage Collector

#### Runtime Data Area

## OPINION
작성 중 입니다.

#### REFERENCE
- <https://en.wikipedia.org/wiki/Java_virtual_machine>
- <https://jeong-pro.tistory.com/148>
- <https://asfirstalways.tistory.com/158>