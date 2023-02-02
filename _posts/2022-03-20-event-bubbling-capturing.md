---
title: "이벤트 버블링과 캡처링"
search: false
category:
  - information
  - javascript
last_modified_at: 2022-03-20T23:55:00
---

<br/>

## 0. 들어가면서

프론트엔드 개발자로 커리어를 시작하신 분들에게는 기본적이고 익숙한 개념입니다. 
최근 들어 프론트엔드 기술들을 자세히 공부하면서 배운 내용들 중에 `이벤트 버블링과 캡처링`은 직접 정리하고 싶은 주제이였기에 포스트로 작성하였습니다. 

## 1. 이벤트 페이즈(Event Phase)

표준 DOM 이벤트 흐름은 3가지 단계가 있습니다. 
- 캡처링 단계 - 이벤트가 하위 요소(element)로 전파되는 단계
- 타겟 단계 - 이벤트가 실제 타겟 요소에 전달되는 단계
- 버블링 단계 - 이벤트가 상위 요소로 전파되는 단계

<p align="center">
    <img src="/images/event-bubbling-capturing-1.JPG" width="80%" class="image__border">
</p>
<center>https://www.w3.org/TR/DOM-Level-3-Events/</center>

## 2. 이벤트 버블링(Event Bubbling) 

일반적인 방법으로 이벤트를 등록하면 이벤트 버블링 페이즈에 해당합니다. 
이벤트가 발생한 제일 깊은 요소에서 시작하여 부모 요소까지 거슬러 올라갑니다.
- 한 요소에서 이벤트가 발생하면, 이 요소에 할당된 이벤트 핸들러가 동작합니다.
- 이어서 부모 요소의 핸들러가 동작합니다.
- 가장 최상단의 요소를 만날 때까지 이 과정이 반복됩니다.

간단한 예시를 통해 이를 확인해보겠습니다. 
- `a link` 블럭을 클릭하면 이벤트 버블링에 의해 `a link` > `paragraph` > `div` 순으로 등록된 클릭 이벤트 핸들러가 동작됩니다.
- `paragraph` 블럭을 클릭하면 이벤트 버블링에 의해 `paragraph` > `div` 순으로 등록된 클릭 이벤트 핸들러가 동작됩니다.

{% include codepen.html hash="BaJKgKM" tab="html,result" title="Test" %}

### 2.1. event.target과 event.currentTarget

부모 요소의 이벤트 핸들러는 이벤트가 어디서 발생했는지 알 수 있습니다. 
이벤트를 시작한 요소를 타겟(target)이라고 부르며 `event.target`을 사용하여 접근할 수 있습니다. 
비슷하지만, 다른 개념으로 `event.currentTarget`이 존재합니다. 
`event.currentTarget`은 현재 이벤트를 핸들링하고 있는 요소입니다. 
정리하면 다음과 같습니다. 
- `event.target`은 이벤트가 발생한 요소입니다.
- `event.currentTarget`은 현재 이벤트를 핸들링하고 있는 요소입니다.
- `event.currentTarget`은 `this` 키워드와 동일합니다.
- 예를 들어 자식 요소에서 이벤트가 발생하고 이벤트 버블링에 의해 부모 요소에게 이벤트가 전달되었다고 가정하겠습니다.
    - `event.currentTarget`은 부모 요소입니다.
    - `event.target`은 처음 이벤트가 발생한 요소이므로 자식 요소입니다.

{% include codepen.html hash="bGapPPV" tab="js,result" title="Test" %}

### 2.2. 버블링 중단하기

`event.stopPropagation()` 함수를 사용하면 버블링에 의해 이벤트가 부모에게 전달되는 것을 막을 수 있습니다. 
- `paragraph` 요소의 클릭 이벤트 핸들러에서 `event.stopPropagation()` 함수를 호출합니다.
- `a link` 요소에서 발생한 클릭 이벤트가 `div` 요소까지 전달되지 않습니다. 

{% include codepen.html hash="jOYqgLw" tab="html,result" title="Test" %}

##### 버블링 차단 시 주의사항 
- 프론트 개발 시 이벤트 버블링은 유용하게 사용된다고 합니다. 
- 꼭 멈춰야하는 상황이 아닌 경우엔 버블링을 차단하지 않는 것을 권장합니다. 
- `event.stopPropagation()` 함수에 의해 이벤트 버블링이 중단된 구역은 죽은 영역(dead zone)이 되어버립니다.

## 3. 이벤트 캡처링(Event Capturing)

이벤트 버블링과 반대로 부모에서부터 이벤트가 발상한 타겟까지 탐색해가는 방식입니다. 
일반적인 방법과 조금 다르게 이벤트를 등록합니다. 

##### 클릭 이벤트 핸들러 추가

```js
// 객체에 capture 옵션을 true로 설정
element.addEventListener('click', eventHandler, {capture: true})

// 단순히 true 전달
element.addEventListener('click', eventHandler, true)
```

##### 이벤트 캡처링 페이즈 테스트
- 자식 요소를 클릭했음에도 부모 요소의 이벤트 핸들러부터 실행됩니다.
- `a link` 블럭을 클릭하면 이벤트 캡처링에 의해 `div` > `paragraph` > `a link` 순으로 등록된 클릭 이벤트 핸들러가 동작됩니다.
- `paragraph` 블럭을 클릭하면 이벤트 캡처링에 의해 `div` > `paragraph` 순으로 등록된 클릭 이벤트 핸들러가 동작됩니다.

{% include codepen.html hash="MWryNrV" tab="js,result" title="Test" %}

#### REFERENCE
- <https://www.w3.org/TR/DOM-Level-3-Events/>
- <https://ko.javascript.info/bubbling-and-capturing>
- <https://joshua1988.github.io/web-development/javascript/event-propagation-delegation/>