---
title: "Event Capture and Bubbling"
search: false
category:
  - information
  - javascript
last_modified_at: 2022-03-20T23:55:00
---

<br/>

## 0. 들어가면서

프론트엔드로 커리어를 시작한 개발자들에겐 기본적인 개념이다. 최근 웹 프론트엔드 관련 공부를 하면서 배운 이벤트 캡처(capture)와 버블링(bubbling)에 대해 정리했다.

## 1. Event Phase

표준 DOM 이벤트 흐름은 3가지 단계를 통해 이뤄진다.

1. 캡처 단계(capture phase)
  - 이벤트가 하위 엘리먼트(element)로 전파되는 단계
1. 타겟 단계(target phase) 
  - 이벤트가 실제 타겟 엘리먼트에 전달되는 단계
1. 버블링 단계(bubbling phase)
  - 이벤트가 상위 엘리먼트로 전파되는 단계

<p align="center">
  <img src="/images/posts/2022/event-bubbling-capturing-01.png" width="80%" class="image__border">
</p>
<center>https://www.w3.org/TR/DOM-Level-3-Events/</center>

## 2. Event Bubbling

일반적으로 등록된 이벤트는 이벤트 버블링 단계에 실행된다. 버블링은 이벤트가 발생한 제일 하단 엘리먼트(element)에서 시작해서 부모 엘리먼트를 거슬러 올라간다. 최상단 `window` 객체를 만날 때까지 이 과정이 반복된다. 

- 어떤 엘리먼트에서 이벤트가 발생한다.
  - 캡처 단계를 통해 이벤트가 발생한 엘리먼트까지 탐색한다.  
  - 이벤트가 발생한 엘리먼트에 등록된 핸들러(handler)가 동작한다.
- 이어서 부모 엘리먼트의 핸들러가 동작한다.
- 가장 최상단의 엘리먼트를 만날 때까지 이 과정이 반복된다.

간단한 예시를 통해 이를 확인해보자. 

- `a` 블록을 클릭한다.
  - `a` > `paragraph` > `div` 순으로 클릭 이벤트 핸들러가 동작한다.
- `paragraph` 블록을 클릭한다. 
  - `paragraph` > `div` 순으로 클릭 이벤트 핸들러가 동작한다.

{% include codepen.html hash="BaJKgKM" tab="html,result" title="Event Bubbling" %}

### 2.1. event.target and event.currentTarget instance

이벤트 버블링이 발생할 때 부모 엘리먼트의 이벤트 핸들러는 `event` 객체를 통해 해당 이벤트가 어디서 발생했는지 알 수 있다. 이벤트를 시작한 엘리먼트는 타겟(target)이다. `event.target` 참조를 통해 사용할 수 있다. 현재 이벤트를 핸들링하는 엘리먼트는 `event.currentTarget` 참조를 통해 사용할 수 있다. 다음과 같이 정리할 수 있다. 

- `event.target`는 이벤트가 발생한 엘리먼트다.
- `event.currentTarget`는 현재 이벤트를 핸들링하고 있는 엘리먼트다.
  - `event.currentTarget`은 이벤트 핸들러 안에서 `this` 키워드와 동일하다.

간단한 이벤트 핸들러를 통해 확인해보자.

- `div` 엘리먼트에 이벤트를 등록한다.
- 각 엘리먼트들을 선택한다.
- 알럿(alert) 창을 통해 target 객체와 currentTarget 객체를 확인할 수 있다.

{% include codepen.html hash="bGapPPV" tab="js,result" title="target and currentTarget" %}

### 2.2. stopPropagation function

`stopPropagation` 함수를 사용하면 버블링에 의해 이벤트가 부모 엘리먼트에게 전달되는 것을 막을 수 있다. 현재 단계에서 이벤트 버블링을 중단하는 것과 동일하다. 버블링 차단은 유용하지만, 다음과 같은 사항들을 주의해야 한다.

- 반드시 멈춰야하는 상황이 아닌 경우엔 버블링을 차단하지 않는 것을 권장한다. 
- `stopPropagation` 함수에 의해 이벤트 버블링이 중단된 구역은 죽은 영역(dead zone)이 된다.

간단한 예시 코드로 stopPropagation 함수 동작을 살펴보자.

- `paragraph` 엘리먼트의 클릭 이벤트 핸들러에서 `stopPropagation` 함수를 호출한다.
- `a` 엘리먼트에서 발생한 클릭 이벤트가 `div` 엘리먼트까지 전달되지 않는다. 

{% include codepen.html hash="jOYqgLw" tab="html,result" title="stopPropagation function" %}

## 3. Event Capturing

캡처 단계는 이벤트 버블링과 반대로 부모에서부터 이벤트가 발상한 타겟까지 탐색해가는 방식이다. 별도 인자와 함께 이벤트를 등록해야 한다. 

```js
// capture 옵션을 true로 설정
element.addEventListener('click', eventHandler, {capture: true})

// 단순 true 전달
element.addEventListener('click', eventHandler, true)
```

예시 코드를 통해 부모 엘리먼트에서 자식 엘리먼트까지 이벤트가 전파되는 과정을 살펴보자.

- 자식 엘리먼트를 클릭하면 부모 엘리먼트의 이벤트 핸들러부터 실행됩니다.
  - `a` 엘리먼트를 클릭하면 `div` > `paragraph` > `a` 순으로 클릭 이벤트 핸들러가 동작됩니다.
  - `paragraph` 엘리먼트를 클릭하면 `div` > `paragraph` 순으로 클릭 이벤트 핸들러가 동작됩니다.

{% include codepen.html hash="MWryNrV" tab="js,result" title="Event Capturing" %}

#### REFERENCE

- <https://www.w3.org/TR/DOM-Level-3-Events/>
- <https://ko.javascript.info/bubbling-and-capturing>
- <https://joshua1988.github.io/web-development/javascript/event-propagation-delegation/>