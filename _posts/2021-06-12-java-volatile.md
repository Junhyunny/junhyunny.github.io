---
title: "Java volatile"
search: false
category:
  - information
  - java
last_modified_at: 2021-06-12T03:00:00
---

<br>

[Java Atomic][java-atomic-link] 포스트에서 언급한 volatile 키워드에 대해 정리해보도록 하겠습니다. 

## volatile 키워드

> The Java volatile keyword guarantees visibility of changes to variables across threads. 

Java volatile 키워드는 스레드 간의 변수 값 변경에 대한 가시성(visibility)을 보장합니다. 
가시성이라는 단어로 인해 내용이 어렵게 느껴집니다. 

##### CPU 캐시 사용(Multi CPU 환경)
<p align="center"><img src="/images/java-volatile-1.JPG" width="50%"></p>
<center>이미지 출처, http://tutorials.jenkov.com/java-concurrency/volatile.html</center><br>

## volatile 키워드에 대한 오해
Java multi-thread 환경 프로그래밍에 대한 대표적인 키워드를 꼽으면 `synchronized, Atomic class, volatile` 입니다. 

## OPINION
작성 중 입니다.

#### REFERENCE
- <http://tutorials.jenkov.com/java-concurrency/volatile.html>

[java-atomic-link]: https://junhyunny.github.io/information/java/java-atomic/