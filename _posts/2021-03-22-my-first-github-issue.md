---
title: "My First Github Issue"
search: false
category:
  - spring-boot
  - spring-cloud
  - github
last_modified_at: 2021-08-24T01:00:00
---

<br/>

## 1. Motivation

친애하는 동료이자 친구인 [@jskim1991][jskim1991-github-link]이 spring-cloud-openfeign 프로젝트에 PR(Pull Request)을 넣었다는 이야기를 듣고 Github 이슈를 찾기 시작했습니다. 
한동안 퇴근하면 스프링(spring)에 등록된 이슈들을 읽어보면서 호시탐탐 PR을 노렸습니다. 
해결할만한 버그나 이슈가 있는지 찾아보면서 지냈습니다. 

## 2. Pick the issue

해결할만한 이슈를 하나 찾았습니다. 
버그 내용을 보아하니 라이브러리 내부에서 배열(array)을 `toString` 메소드를 통해 그대로 문자열로 변경한 것 같습니다. 

<p align="center">
    <img src="/images/my-first-github-issue-1.JPG" width="100%" class="image__border">
</p>
<center>https://github.com/spring-cloud/spring-cloud-openfeign/issues/256</center>

## 3. Suggestion solution for issue

API 호출 로직 내부를 디버깅해서 문제가 발생하는 코드 위치와 이를 해결할 방법을 제시하였습니다.

* 특정 클래스에서 `Iterable` 상속 여부만 체크하기 때문에 발생한 문제입니다. 
    * 배열 객체는 `Iterable`을 상속하지 않습니다.
* 배열을 별도로 처리하는 로직이 추가되면 큰 영향 없이 사용할 수 있을 것이라 생각했습니다.

<p align="center">
    <img src="/images/my-first-github-issue-2.JPG" width="100%" class="image__border">
</p>
<center>https://github.com/spring-cloud/spring-cloud-openfeign/issues/256</center>

##### Answer from @spencergibb

* `Openfeign`으로 이슈를 옮기라는 스펜서

<p align="center">
    <img src="/images/my-first-github-issue-3.JPG" width="100%" class="image__border">
</p>
<center>https://github.com/spring-cloud/spring-cloud-openfeign/issues/256</center>

##### Report issue in Openfeign project

* `Openfeign` 프로젝트에 이슈를 등록하였습니다.

<p align="center">
    <img src="/images/my-first-github-issue-4.JPG" width="100%" class="image__border">
</p>
<center>https://github.com/OpenFeign/feign/issues/1170</center>

##### Answer from `@kdavisk6`

* 해당 이슈는 버그로 등록되고, 직접 해결하겠다는 답변을 받았습니다.

<p align="center">
    <img src="/images/my-first-github-issue-5.JPG" width="100%" class="image__border">
</p>
<center>https://github.com/OpenFeign/feign/issues/1170</center>

## CLOSING

당시 몇 시간 버그와 해결 방법까지 찾아 제시했지만, 아쉽게 PR을 따내진 못 했습니다. 
해당 이슈를 분석하기 위해 디버깅해보면서 많은 공부가 되었지만, 아쉬움이 남았습니다. 

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/openfeign-test>

#### REFERENCE

* <https://github.com/spring-cloud/spring-cloud-openfeign/issues/256>
* <https://github.com/OpenFeign/feign/issues/1170>

[jskim1991-github-link]: https://github.com/jskim1991
[issue-link]: https://github.com/spring-cloud/spring-cloud-openfeign/issues/256