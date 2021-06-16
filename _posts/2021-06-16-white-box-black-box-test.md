---
title: "White Box, Black Box Test"
search: false
category:
  - information
last_modified_at: 2021-06-16T00:00:00
---

<br>

테스트에도 종류가 있다는걸 아셨나요?😃 
테스트 종류에 관련된 이야기를 들었으나 명확하게 정리가 되지 않았습니다. 
이번 기회에 포스트로 정리해보았습니다.

## White Box Test

> Wiki<br>
> White-box testing (also known as clear box testing, glass box testing, transparent box testing, and structural testing) 
> is a method of software testing that tests internal structures or workings of an application

내부 구조나 어플리케이션 동작 방식에 대해 테스트를 수행하는 방식입니다. 
모듈의 정상적인 작동을 코드 레벨에서 확인하는 테스트 방법입니다. 
컴파일 된 원시 코드의 모든 문장을 한 번 이상 수행하면서 진행되는 검사입니다. 
코드의 논리적인 수행 경로를 테스트합니다. 
흔히 말하는 코드 테스트 커버러지 퍼센트(%)를 측정하는 일이 여기에 속하는 것으로 보입니다. 

### White Box Test 종류
- 기초 경로 검사(Base Path Testing), 대표적인 white box testing
- 제어 구조 검사(Control Structure Testing)
    - 조건 검사(Condition Testing), 모듈 내에 있는 논리적 조건을 테스트하는 테스트 케이스 설계 방법
    - 루프 검사(Loop Testing), 프로그램 반복 구조에 초점을 맞추어 실시하는 테스트 케이스 설계 방법
    - 데이터 흐름 검사(Data Flow Testing), 변수의 정의와 변수 사용의 위치에 초첨을 맞춰 실시하는 테스트 케이스 설계 기법

## Black Box Test

> Wiki<br>
> Black-box testing is a method of software testing that examines the functionality of an application 
> without peering into its internal structures or workings. 

내부 구조나 동작 방식에 대해 확인하지 않고 어플리케이션의 기능을 테스트합니다. 
흔히 알고 있는 Black Box에 대한 개념이 적용된 테스트 방법으로 보입니다. 
요구사항 명세서를 보면서 구현된 기능을 테스트합니다. 
테스트를 진행하는 사람은 모듈 내부에서 어떤 동작이 있었는지 신경쓰지 않습니다. 

<p align="center"><img src="/images/white-box-black-box-test-2.JPG" width="65%"></p>
<center>이미지 출처, http://www.splex.co.kr/black-white-box-test</center><br>

### White Box Test 종류
- 기초 경로 검사(Base Path Testing)
    - 대표적인 White Box Testing
    - 
- 제어 구조 검사(Control Structure Testing)
    - 조건 검사(Condition Testing), 모듈 내에 있는 논리적 조건을 테스트하는 테스트 케이스 설계 방법
    - 루프 검사(Loop Testing), 프로그램 반복 구조에 초점을 맞추어 실시하는 테스트 케이스 설계 방법
    - 데이터 흐름 검사(Data Flow Testing), 변수의 정의와 변수 사용의 위치에 초첨을 맞춰 실시하는 테스트 케이스 설계 기법

## White/Black Box Test 차이점

## OPINION
작성 중 입니다.

#### REFERENCE
- [[D-9] Chapter5. 소프트웨어 검사][naver-software-test-link]
- <https://en.wikipedia.org/wiki/White-box_testing>
- <https://en.wikipedia.org/wiki/Black-box_testing>
- <http://www.splex.co.kr/black-white-box-test>
- <https://ko.myservername.com/white-box-testing-complete-guide-with-techniques>

[naver-software-test-link]: https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=brad903&logNo=221214795151