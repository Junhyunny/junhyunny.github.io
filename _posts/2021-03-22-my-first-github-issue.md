---
title: "My First GitHub Issue"
search: false
category:
  - spring-boot
  - spring-cloud
  - github
last_modified_at: 2021-08-24T01:00:00
---

<br/>

## 0. 들어가면서

처음 github 이슈에 의견을 달고 해결 방안까지 제시했던 경험을 포스트로 작성해보았습니다. 

## 1. MOTIVATION
저의 친애하는 동료이자 친구인 [@jskim1991][jskim1991-github-link]이 
spring-cloud-openfeign 프로젝트에 PR(Pull Request) 했다는 이야기를 듣고 저도 github에서 이슈를 찾아보기 시작하였습니다. 
한동안 회사에서 퇴근하면 Spring 프로젝트에 등록된 이슈들을 뒤져보면서 호시탐탐 PR을 노리는 하이에나로 살았습니다. 

> '나도 해결할 수 있는 이슈가 있을까?'<br/>
> 'open source 프로젝트에 contributor가 되고 싶어!'

## 2. 이슈 해결 과정

### 2.1. 이슈 발견

<p align="left"><img src="/images/my-first-github-issue-1.JPG" width="92.5%"></p>
<center>https://github.com/spring-cloud/spring-cloud-openfeign/issues/256</center>

해결할만한 이슈를 하나 찾았습니다. 
String 객체의 주소가 찍힌 것을 보니 배열을 그대로 toString 한 것으로 예상됩니다. 
몇 시간 디버깅해서 해당 문제를 일으키는 코드 위치와 해결 방법을 제시하였습니다. 

### 2.2. 해결 방안 제시
나름대로 분석한 내용과 해결책을 제시하여 답변을 달았습니다. 
특정 클래스에서 Iterable 상속 여부만 체크하기 때문에 발생한 문제입니다. 
배열(array)에 대한 확인 코드를 추가하면 큰 영향없이 사용할 수 있을 것이라 생각하였습니다. 

<p align="left"><img src="/images/my-first-github-issue-2.JPG" width="92.5%"></p>
<center>https://github.com/spring-cloud/spring-cloud-openfeign/issues/256</center>

### 2.3. **`@spencergibb`** 님의 한마디

> "응, 우리 이슈 아니네. 저리로 가세요~" 

<p align="left"><img src="/images/my-first-github-issue-3.JPG" width="92.5%"></p>
<center>https://github.com/spring-cloud/spring-cloud-openfeign/issues/256</center>

### 2.4. Openfeign 프로젝트 이슈 등록

눈물을 머금고 Openfeign 프로젝트 쪽에 이슈를 등록하였습니다.

<p align="left"><img src="/images/my-first-github-issue-4.JPG" width="92.5%"></p>
<center>https://github.com/OpenFeign/feign/issues/1170</center>

등록한 이슈를 매일같이 들어가보며 답변을 기다렸지만 묵묵부답입니다.

> [@jskim1991][jskim1991-github-link] said<br/>
> 걔네 엄청 게을러, 답변을 안해줘

### 2.5.  **`@kdavisk6`** 님에게 전달받은 답변

한참을 지나 올린 이슈가 잊혀질 때 쯤 **`@kdavisk6`** 님이 답장을 달아주셨습니다. 

>  "오 그럴싸하네, 이제부턴 우리가 할께."

<p align="left"><img src="/images/my-first-github-issue-5.JPG" width="92.5%"></p>
<center>https://github.com/OpenFeign/feign/issues/1170</center>

😢😭😰😥 몇 시간 고생했는데 결국 PR을 받아내진 못했습니다. 
결국 이슈를 해결하기 위해 얻은 경험을 위안으로 삼고 다음 이슈를 찾아 떠났습니다. 

## CLOSING
이슈를 해결하기 위해 프로젝트를 fork 해보고 해당 클래스를 IDE에서 변경해보면서 많은 공부가 되었습니다. 
이후에도 해결할 수 있는 이슈들을 찾아봤지만 당시 실력으로는 만만치 않았습니다. 
마지막으로 항상 긍정적인 자극을 주는 [@jskim1991][jskim1991-github-link]에게 감사한 마음을 전달합니다.

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/openfeign-test>

#### REFERENCE
- <https://github.com/spring-cloud/spring-cloud-openfeign/issues/256>
- <https://github.com/OpenFeign/feign/issues/1170>

[jskim1991-github-link]: https://github.com/jskim1991
[issue-link]: https://github.com/spring-cloud/spring-cloud-openfeign/issues/256