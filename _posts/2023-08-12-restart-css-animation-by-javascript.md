---
title: "Restart CSS Animation by JavaScript"
search: false
category:
  - html
  - css
  - javascript
last_modified_at: 2023-08-12T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [DOM(Document Object Model)][document-object-model-link]
* [Sprite Animation in CSS][sprite-animation-in-css-link]

## 1. Problem Context

서비스를 개발하다보면 다양한 이유로 애니메이션을 다시 실행할 필요가 생깁니다. 
하지만 CSS @keyframes 기능으로 애니메이션을 구현한 경우 해당 애니메이션을 다시 실행하는 것은 생각보다 쉽지 않습니다. 
일반적으로 HTML 엘리먼트(element)에서 한번 애니메이션이 실행되면 다른 애니메이션이 동작하지 않습니다. 
먼저 문제 상황과 코드를 살펴보겠습니다. 

* 클릭 이벤트로 버튼 내부 하트 이미지의 색상 온/오프(on/off)
* 하트의 색상 변경은 스프라이트 애니메이션(sprite animation)으로 적용
    * 아래와 같은 이미지를 사용하였습니다.

<p align="center">
    <img src="/images/restart-css-animation-by-javascript-1.JPG" width="100%" class="image__border">
</p>

### 1.1. HTML Code

다음과 같은 엘리먼트 구조를 가집니다.

* 버튼을 클릭한 경우 restart() 이벤트를 통해 애니메이션을 재실행합니다.
* like-animation 클래스를 가진 엘리먼트는 스프라이트 애니메이션이 적용되어 있습니다. 

```html
<div class="app">
  <div class="button" onclick="restart()">
    <div class="wrapper">
      <div class="like-animation" />
    </div>
  </div>
</div>
```

### 1.2. CSS Code

가독성을 위해 설명 코드에 주석으로 추가하였습니다. 

```css
.app {
  width: 200px;
  height: 125px;
  background-color: navy;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.button {
  width: 55px;
  height: 30px;
  border-radius: 15px;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.wrapper {
  width: 13px;
  height: 12px;
}

/* 애니메이션이 적용된 하트 영역의 공통적인 속성 */
.like-animation {
  width: 100%;
  height: 100%;
  background-image: url("https://junhyunny.github.io/images/restart-css-animation-by-javascript-1.JPG");
  background-size: 325px 12px;
}

/* 기본 방향으로 애니메이션이 적용됩니다. */
.like-animation.like-normal-direction {
  animation: like 1s 1 steps(24) forwards normal;
}

/* 반대 방향으로 애니메이션이 적용됩니다. */
.like-animation.like-reverse-direction {
  animation: like 1s 1 steps(24) forwards reverse;
}

@keyframes like {
  to {
    background-position: -312px;
  }
}
```

### 1.3. JavaScript Code

각 함수 별로 다음과 같은 동작을 수행합니다.

* restart 함수
    * 애니메이션을 다시 실행합니다.
    * 기본 방향 애니메이션 클래스를 가진 경우 반대 방향으로 애니메이션을 트리거(trigger)합니다.
    * 기본 방향 애니메이션 클래스가 없는 경우 기본 방향으로 애니메이션을 트리거합니다.
* forwardTrigger 함수
    * 반대 방향 애니메이션 클래스를 제거합니다.
    * 정상 방향 애니메이션 클래스를 추가합니다.
* reverseTrigger 함수
    * 정상 방향 애니메이션 클래스를 제거합니다.
    * 반대 방향 애니메이션 클래스를 추가합니다.

```javascript
function reverseTrigger(element) {
  element.classList.remove("like-normal-direction");
  element.classList.add("like-reverse-direction");
}

function forwardTrigger(element) {
  element.classList.remove("like-reverse-direction");
  element.classList.add("like-normal-direction");
}

function restart() {
  const element = document.querySelector(".like-animation");
  if (!element || element.classList.length === 0) {
    return;
  }
  if (element.classList.contains("like-normal-direction")) {
    reverseTrigger(element);
  } else {
    forwardTrigger(element);
  }
}
```

##### Wrong Button Animation

해당 코드를 실행하면 다음과 같이 동작합니다.

* 애니메이션이 엘리먼트에 처음으로 추가되는 첫번째 클릭에서만 애니메이션이 동작합니다.
* 다음 클릭 이벤트들에선 애니메이션이 동작하지 않습니다.  

<p align="left">
    <img src="/images/restart-css-animation-by-javascript-2.gif" width="50%" class="image__border image__padding">
</p>

## 2. Solve the problem

타이머를 사용해 클래스를 삭제/추가하도록 작성한 코드도 기능은 동작하지만, 애니메이션에 끊기는 현상이 있었습니다. 
자연스럽게 애니메이션을 재실행하려면 리플로우(reflow)를 사용한 트릭(trick)이 필요합니다. 
먼저 리플로우 개념에 대해 알아보겠습니다. 

### 2.1. Rendering Process in Browser

브라우저는 렌더링을 진행할 때 다음과 같은 과정을 수행합니다. 

1. DOM 트리 생성
    * HTML 문서를 파싱하여 DOM 트리를 생성합니다.
1. 스타일 규칙 생성
    * CSS 문서를 파싱하여 CSSOM(CSS Object Model) 트리를 생성합니다.
    * CSSOM 트리는 각 DOM 요소들의 스타일을 결정합니다.
1. 렌더링 트리 생성
    * DOM 트리와 CSSOM 트리를 결합하여 렌더링 트리(render tree)를 생성합니다.
    * 렌더링 트리는 웹 페이지 구조와 스타일, 레이아웃 규칙 등을 나타냅니다.
1. 리플로우(혹은 레이아웃)
    * 렌더링 트리에 속하는 각 엘리먼트들의 위치, 사이즈, 차원 등을 결정합니다.
1. 페인트(혹은 리페인트)
    * 렌더링 트리에 속하는 각 엘리먼트들의 레이아웃 정보를 화면에 픽셀로 표현합니다.
    * 배경, 테두리, 텍스트 및 기타 시각적인 요소들을 렌더링합니다.

<p align="center">
    <img src="/images/restart-css-animation-by-javascript-3.JPG" width="80%" class="image__border">
</p>
<center>https://it-eldorado.tistory.com/87</center>

### 2.2. Batching Reflows and Repaints

브라우저 입장에서 리플로우와 리페인트는 비싼 작업입니다. 
따라서 브라우저는 리플로우나 리페인트 작업을 최소한으로 수행하려고 합니다. 
브라우저는 DOM 트리나 CSS가 변경되었을 때 여러 번 적용하기보단 여러 변경들을 축적하여 한 번에 모든 변화를 적용합니다. 

* 단순히 클래스를 제거하고 추가하는 코드만으로 화면을 다시 그리지 않습니다.
* 브라우저는 함수가 끝났을 때 계산을 통해 화면을 다시 그릴지 여부를 결정합니다.
    * 애니메이션의 방향만 바뀌었으므로 재실행하지 않습니다. 
* 브라우저가 화면을 다시 그려야한다고 판달할 수 있도록 추가 코드가 필요합니다.

### 2.3. JavaSript Code

리플로우를 실행시키는 코드를 추가합니다. 

* 클래스를 제거하고 엘리먼트의 offsetWidth 속성을 참조합니다.
    * DOM 엘리먼트에 대한 정보 제공을 요청한 것입니다. 
    * 브라우저는 변경 사항 일괄 처리를 하기 위한 계획을 취소하고 바로 페이지를 리플로우합니다.
    * 리플로우가 발생하는 시점에 애니메이션 클래스에 대한 정보가 없습니다.
* offsetWidth 속성 접근 이후에 애니메이션 클래스를 추가합니다.
    * 새로운 애니메이션 정보가 추가되었으므로 애니메이션이 동작합니다.

```javascript
function reverseTrigger(element) {
  element.classList.remove("like-normal-direction");
  element.offsetWidth; // This line triggers reflow
  element.classList.add("like-reverse-direction");
}

function forwardTrigger(element) {
  element.classList.remove("like-reverse-direction");
  element.offsetWidth; // This line triggers reflow
  element.classList.add("like-normal-direction");
}

function restart() {
  const element = document.querySelector(".like-animation");
  if (!element || element.classList.length === 0) {
    return;
  }
  if (element.classList.contains("like-normal-direction")) {
    reverseTrigger(element);
  } else {
    forwardTrigger(element);
  }
}
```

### 2.3. Result

버튼을 클릭하면 애니메이션이 동작하는 것을 확인할 수 있습니다.

{% include codepen.html hash="eYQwBgZ" tab="css,result" title="Resatrt CSS Animation by JavaScript" %}

#### REFERENCE

* <https://css-tricks.com/restart-css-animation/>
* <https://stackoverflow.com/questions/60686489/what-purpose-does-void-element-offsetwidth-serve>

[document-object-model-link]: https://junhyunny.github.io/information/document-object-model/
[sprite-animation-in-css-link]: https://junhyunny.github.io/html/css/javascript/sprite-animation-in-css/
