---
title: "Virtual DOM"
search: false
category:
  - information
last_modified_at: 2021-12-12T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [DOM(Document Object Model)][dom-link]

## 0. 들어가면서

`Vue.js` 프레임워크, `React` 라이브러리 모두 가상 DOM(Virtual DOM)을 사용합니다. 
가상 DOM은 메모리에서 필요한 연산을 먼저 처리하고 실제 DOM에 동기화하기 때문에 속도가 빠르다는 내용을 읽은 기억이 있습니다. 
당시에는 DOM 개념을 잘 몰랐기 때문에 그런줄 알았지만, DOM(Document Object Model)에 대해 정리해보니 의문점이 생겼습니다. 

> `DOM`도 마찬가지로 메모리에 생성되고, 메모리 상에서 조작하는데 가상 DOM은 왜 필요하지?

## 1. HTML Document Rendering Process

가상 DOM을 사용하는 이유에 대해 설명하려면 실제 HTML 문서를 브라우저 화면에 보여주기까지 과정을 이해할 필요가 있습니다. 
크롬이나 사파리에서 사용하는 HTML, CSS 웹 브라우저 렌더링 엔진인 Webkit을 기준으로 브라우저 화면 렌더링 과정을 간단하게 정리하였습니다. 

##### Webkit 엔진 HTML 문서 렌더링 과정

<p align="center">
    <img src="/images/virtual-dom-1.JPG" width="75%" class="image__border">
</p>
<center>https://it-eldorado.tistory.com/87</center>

### 1.1. DOM 트리 생성

HTML 파서는 HTML 파일을 파싱하여 DOM(Document Object Model) 트리를 생성합니다. 
`"바이트 > 문자 > 토큰 > 노드 > 객체 모델"` 과정을 거쳐서 DOM 트리를 생성합니다. 

##### HTML 문서 예시

```html
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link href="style.css" rel="stylesheet">
    <title>Critical Path</title>
  </head>
  <body>
    <p>Hello <span>web performance</span> students!</p>
    <div><img src="awesome-photo.jpg"></div>
  </body>
</html> 
```

##### 생성된 DOM 트리

<p align="center">
    <img src="/images/virtual-dom-2.JPG" width="75%" class="image__border">
</p>
<center>https://developers.google.com/web/fundamentals/performance/critical-rendering-path/constructing-the-object-model?hl=ko</center>

### 1.2. 스타일 규칙 생성

HTML과 마찬가지로 CSS 규칙을 통해 CSS 파일을 브라우저가 이해하고 처리할 수 있는 형태로 변환시킵니다. 
CSS 파서는 CSS 파일을 파싱하여 CSSOM(CSS Object Model) 트리를 생성합니다. 

##### CSS 문서 예시

```css
body { font-size: 16px }
p { font-weight: bold }
span { color: red }
p span { display: none }
img { float: right } 
```

##### 생성된 CSSOM 트리

<p align="center">
    <img src="/images/virtual-dom-3.JPG" width="75%" class="image__border">
</p>
<p align="center">
    <img src="/images/virtual-dom-4.JPG" width="75%" class="image__border">
</p>
<center>https://developers.google.com/web/fundamentals/performance/critical-rendering-path/constructing-the-object-model?hl=ko</center>

### 1.3. 렌더 트리 생성

DOM 및 CSSOM 트리를 결합하여 렌더 트리를 형성합니다. 
렌더 트리에는 페이지를 렌더링하는데 필요한 노드만 포함됩니다. 
일부 노드는 CSS를 통해 숨겨지며 렌더 트리에서 생략될 수 있습니다. 
렌더 트리의 노드들은 화면에 최종적으로 출력하기 위한 정보들을 각자 지니고 있습니다. 

<p align="center">
    <img src="/images/virtual-dom-5.JPG" width="75%" class="image__border">
</p>
<center>https://developers.google.com/web/fundamentals/performance/critical-rendering-path/constructing-the-object-model?hl=ko</center>

### 1.4. 레이아웃(layout)

렌더 트리가 생성되었으면 레이아웃을 수행할 수 있습니다. 
렌더 트리는 스타일 정보를 가지고 있지만, 기기의 뷰포트(viewport) 내에서 정확한 위치와 크기가 계산되어 있지 않습니다. 
레이아웃 프로세스에서는 각 요소들의 상대적인 측정 값들은 절대적인 픽셀(pixel)로 변환됩니다. 

<p align="center">
    <img src="/images/virtual-dom-6.JPG" width="75%" class="image__border">
</p>
<center>TOSS - 성능 최적화</center>

### 1.5. 페인트(paint)

레이아웃 프로세스를 통해서 각 노드들의 계산된 스타일, 기하학적 형태에 대해 파악이 끝났으면, 페인트 단계에서 각 노드를 화면의 실제 픽셀로 변환합니다. 
이 시점에 위치같은 정보와 관계없는 CSS 속성(색상, 투명도 등)을 적용합니다. 

##### 브라우저 로딩 과정
- 전체적인 브라우저 로딩 과정을 나타냅니다.
- 아래 이미지에서 `STYLE 과정`은 렌더 트리 생성과 동일한 과정입니다. 

<p align="center">
    <img src="/images/virtual-dom-7.JPG" width="75%" class="image__border">
</p>
<center>TOSS - 성능 최적화</center>

### 1.6. 레이아웃(layout) 혹은 리플로우(reflow)와 리페인트(repaint)

브라우저 로딩 과정에서 `렌더 트리 생성 > 레이아웃 > 페인트` 과정을 렌더링(rendering)이라고 합니다. 
렌더 트리는 DOM 트리, CSSOM 트리가 변경될 때 다시 재구성됩니다. 

##### 레이아웃(layout) 혹은 리플로우(reflow) 작업
- DOM이 추가, 삭제되거나 요소의 기하적인 영향을 주는 CSS 값이 변경되는 경우 레이아웃부터 이후 과정을 다시 수행해야합니다. 
- 이를 `레이아웃(layout) 혹은 리플로우(reflow)`라고 합니다. 

<p align="center">
    <img src="/images/virtual-dom-8.JPG" width="55%" class="image__border">
</p>
<center>TOSS - 성능 최적화</center>

##### 리페인트(repaint) 작업
- 반대로 기하적인 변경이 없는 경우에는 레이아웃 과정을 건너뛰고, 페인트부터 수행하므로 이를 `리페인트(repaint)`라고 합니다.

<p align="center">
    <img src="/images/virtual-dom-9.JPG" width="55%" class="image__border">
</p>
<center>TOSS - 성능 최적화</center>

## 2. Virtual DOM

실제 DOM을 조작하는 것은 느리지 않습니다. 
하지만, DOM을 조작하여 발생하는 리플로우, 리페인트 작업에서 발생하는 비용이 굉장히 높습니다. 
브라우저의 연산이 많이 필요하기 때문입니다. 
특히, 리플로우는 전체 픽셀을 다시 계산해야하기 때문에 리페인트보다 더 많은 부하가 발생합니다. 

가상 DOM은 리플로우, 리페인트 작업을 최소화하기 위해 등장했습니다. 
JavaScript 같은 프로그래밍 언어로 인해 뷰(view)에 변화가 생겼을 때 이전 DOM과 새로운 DOM을 비교하고, 변경된 내용들을 모아서 실제 DOM에 적용합니다. 
변화 사항이 실제 DOM까지 바로 이어지는 것이 아니라 중간 버퍼(buffer)가 생겼다고 볼 수 있습니다.
발생하는 변화 사항들을 가상 DOM에서 처리하고, 한 번만 실제 DOM에 반영하기 때문에 변화의 규모는 커지게 됩니다.
하지만, 리플로우, 리페인트 횟수를 줄여서 성능상 이득을 얻을 수 있습니다. 

##### 가상 DOM에 의한 렌더링

<p align="center">
    <img src="/images/virtual-dom-10.JPG" width="75%" class="image__border">
</p>
<center>https://www.oreilly.com/library/view/learning-react-native/9781491929049/ch02.html</center>

## CLOSING

프론트엔드에 관련된 기술 스택을 잘 모르는 편인데, 이번 글을 정리하면서 조금 더 친해질 수 있었습니다. 
최근에 들었던 SSR(Server Side Rendering)과 관련된 글도 곁다리로 함께 읽어볼 수 있었고, 프론트엔드 진영의 기술력에 감탄하기도 했습니다. 
참조한 포스트 중에 [Vanilla Javascript로 가상돔(VirtualDOM) 만들기][vanilla-javascript-virtual-dom-link]에선 순수 JavaScript로 컴포넌트 구현, 가상 DOM 구현, 리액트 훅스(hooks) 구현과 관련된 코드를 읽어볼 수 있었는데 덕분에 많은 공부가 되었습니다. 
누군가는 프레임워크나 라이브러리의 본질을 파고들기 위한 공부를 하고 있다는 것에 큰 자극을 느꼈습니다. 

#### REFERENCE
- <https://velopert.com/3236>
- <https://it-eldorado.tistory.com/87>
- <https://doodreamcode.tistory.com/187>
- <https://d2.naver.com/helloworld/59361>
- <https://www.oreilly.com/library/view/learning-react-native/9781491929049/ch02.html>
- <https://developers.google.com/web/fundamentals/performance/critical-rendering-path/constructing-the-object-model?hl=ko>
- [성능 최적화][rendering-performance-link]
- [Vanilla Javascript로 가상돔(VirtualDOM) 만들기][vanilla-javascript-virtual-dom-link]

[dom-link]: https://junhyunny.github.io/information/document-object-model/
[vanilla-javascript-virtual-dom-link]: https://junilhwang.github.io/TIL/Javascript/Design/Vanilla-JS-Virtual-DOM/
[rendering-performance-link]: https://ui.toast.com/fe-guide/ko_PERFORMANCE#%EC%84%B1%EB%8A%A5-%EC%B5%9C%EC%A0%81%ED%99%94