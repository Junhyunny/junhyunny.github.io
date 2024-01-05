---
title: "White/Black Box Test"
search: false
category:
  - information
last_modified_at: 2021-06-16T00:00:00
---

<br/>

## 1. White Box Test

> Wiki<br/>
> White-box testing (also known as clear box testing, glass box testing, transparent box testing, and structural testing) is a method of software testing that tests internal structures or workings of an application

화이트 박스 테스트(white box test)는 내부 구조나 어플리케이션 동작 방식에 대해 테스트를 수행합니다. 
다음과 같이 정리할 수 있습니다. 

* 모듈의 정상적인 작동을 코드 레벨에서 확인합니다. 
    * 컴파일 된 원시 코드의 문장을 여러번 수행합니다.
    * 코드의 논리적인 수행 경로를 확인하기 때문에 테스트 커버리지(coverage) 측정이 가능합니다. 
* 테스트를 수행하기 위해 내부적으로 소프트웨어와 코드가 어떻게 동작하는지 이해하고 있어야 합니다. 

화이트 박스 테스트에는 다음과 같은 종류가 있습니다. 

* 기초 경로 검사(구조 검사, Basic Path Testing)
    * 수행 가능한 모든 경로 검사합니다.
* 루프 검사(반복문 검사, Loop Testing)
    * 프로그램의 반복 구조에 초점을 맞추어 검사합니다.
* 데이터 흐름 검사(Data Flolw Testing)
    * 프로그램에서 변수의 정의와 변수 사용 위치에 초점을 맞추어 검사합니다.
* 조건 검사(Condition Testing)
    * 프로그램의 조건문에 초점을 맞추어 검사합니다.

<p align="center">
    <img src="/images/white-box-black-box-test-1.JPG" width="45%" class="image__border">
</p>
<center>http://www.splex.co.kr/black-white-box-test</center>

## 2. Black Box Test

> Wiki<br/>
> Black-box testing is a method of software testing that examines the functionality of an application without peering into its internal structures or workings. 

블랙 박스 테스트(black box test)는 내부 구조나 동작 방식에 대해 확인하지 않고 어플리케이션의 기능을 테스트합니다. 
다음과 같이 정리할 수 있습니다. 

* 요구사항 명세서를 보면서 구현된 기능을 테스트합니다. 
    * 테스트를 진행하는 사람은 모듈 내부에서 어떤 동작이 있었는지 신경쓰지 않습니다. 
    * 입력은 적절한지, 출력은 정확한지 확인할 수 있습니다. 
* 제품의 각 기능이 정상적으로 작동하는지 입증하는 검사입니다. 

블랙 박스 테스트에는 다음과 같은 종류가 있습니다. 

* 균등 분할(동등 분할, Equivalence Partitioning)
    * 프로그램의 입력 데이터를 여러 분류로 나누어 검사합니다.
* 한계값 분석(경계값 분석, Boundary Value analysis)
    * 입력값의 경계값을 중심으로 예외 발생 검사합니다. 
* 원인-결과 그래프(Cause-effect Graphing)
    * 입력 데이터 간의 관계, 출력에 미치는 영향의 분석 그래프 이용합니다. 
* 오류 예측(Error Guessing)
    * 테스터의 감각이나 경험, 지식을 통해 에러 케이스를 예측합니다. 
* 비교 검사(Comparison Testing)
    * 테스트 대상과 비교 대상 프로그램에 같은 입력값을 넣어 데이터를 비교합니다.

<p align="center">
    <img src="/images/white-box-black-box-test-2.JPG" width="45%" class="image__border">
</p>
<center>http://www.splex.co.kr/black-white-box-test</center>

## 3. Difference Summary

두 종류의 테스트에 대한 내용을 다음과 같이 요약할 수 있습니다. 

<p align="center">
    <img src="/images/white-box-black-box-test-3.JPG" width="50%">
</p>
<center>출처, 블랙박스 테스트와 화이트박스 테스트 비교</center>

#### REFERENCE

* <https://en.wikipedia.org/wiki/White-box_testing>
* <https://en.wikipedia.org/wiki/Black-box_testing>
* <http://www.splex.co.kr/black-white-box-test>
* <https://ko.myservername.com/white-box-testing-complete-guide-with-techniques>
* [[D-9] Chapter5. 소프트웨어 검사][naver-software-test-link]
* [화이트박스 테스트][white-box-test-link]
* [블랙박스 테스트][black-box-test-link]
* [블랙박스 테스트와 화이트박스 테스트 비교][difference-blog-link]

[naver-software-test-link]: https://m.blog.naver.com/PostView.naver?isHttpsRedirect=true&blogId=brad903&logNo=221214795151
[white-box-test-link]: https://itwiki.kr/w/%ED%99%94%EC%9D%B4%ED%8A%B8%EB%B0%95%EC%8A%A4_%ED%85%8C%EC%8A%A4%ED%8A%B8
[black-box-test-link]: https://itwiki.kr/w/%EB%B8%94%EB%9E%99%EB%B0%95%EC%8A%A4_%ED%85%8C%EC%8A%A4%ED%8A%B8
[difference-blog-link]: http://blog.skby.net/%EB%B8%94%EB%9E%99%EB%B0%95%EC%8A%A4-%ED%85%8C%EC%8A%A4%ED%8A%B8%EC%99%80-%ED%99%94%EC%9D%B4%ED%8A%B8%EB%B0%95%EC%8A%A4-%ED%85%8C%EC%8A%A4%ED%8A%B8-%EB%B9%84%EA%B5%90/