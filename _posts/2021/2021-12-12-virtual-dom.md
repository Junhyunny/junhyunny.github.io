---
title: "가상 DOM(Virtual DOM)"
search: false
category:
  - information
last_modified_at: 2026-06-07T00:58:53+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [DOM(Document Object Model)][dom-link]

## 0. 들어가면서

VueJS, React 같은 프레임워크(혹은 라이브러리)는 모두 `가상 DOM(Virtual DOM)`을 사용한다. 가상 DOM은 메모리에서 필요한 연산을 먼저 처리하고 실제 DOM에 동기화하기 때문에 속도가 빠르다는 내용을 읽은 기억이 있다. 당시에는 DOM 개념을 잘 몰랐기 때문에 그런 줄 알았지만, DOM(Document Object Model)에 대해 정리해 보니 의문점이 생겼다.

> `DOM`도 마찬가지로 메모리에 생성되고, 메모리상에서 조작하는데 가상 DOM은 왜 필요하지?

이 글은 위 질문에 대해 스스로 정리해 보기 위해 작성했다.

## 1. HTML document rendering process

가상 DOM을 사용하는 이유에 대해 설명하려면 실제 HTML 문서를 브라우저 화면에 보여주기까지의 과정을 이해할 필요가 있다. 크롬이나 사파리에서 사용하는 HTML, CSS 웹 브라우저 렌더링 엔진인 웹킷(WebKit)을 기준으로 브라우저 화면의 렌더링 과정을 간단하게 정리했다. 아래 이미지는 웹킷 엔진을 사용할 때 HTML 문서가 렌더링되는 과정이다. 이 과정을 상세히 들여다보자.

<div align="center">
  <img src="{{ site.image_url_2021 }}/virtual-dom-01.png" width="80%" class="image__border">
</div>
<center>https://it-eldorado.tistory.com/87</center>

<br/>

먼저 DOM 트리 생성 과정을 살펴보자. HTML 파서는 HTML 파일을 파싱하여 DOM(Document Object Model) 트리를 생성한다. `"바이트 > 문자 > 토큰 > 노드 > 객체 모델"` 과정을 거쳐 DOM 트리를 생성한다. 예를 들어, 다음과 같은 HTML 코드가 있다.

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

위 코드를 파싱하면 다음과 같은 DOM 트리가 생성된다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/virtual-dom-02.png" width="100%" class="image__border">
</div>
<center>https://developers.google.com/web/fundamentals/performance/critical-rendering-path/constructing-the-object-model?hl=ko</center>

<br/>

HTML과 마찬가지로 CSS 규칙을 통해 CSS 파일을 브라우저가 이해하고 처리할 수 있는 형태로 변환한다. CSS 파서는 CSS 파일을 파싱하여 CSSOM(CSS Object Model) 트리를 생성한다. 예를 들어, 다음과 같은 CSS 코드가 있다.

```css
body { font-size: 16px }
p { font-weight: bold }
span { color: red }
p span { display: none }
img { float: right }
```

위 코드를 파싱하면 다음과 같은 CSSOM 트리가 생성된다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/virtual-dom-03.png" width="100%" class="image__border">
</div>
<div align="center">
  <img src="{{ site.image_url_2021 }}/virtual-dom-04.png" width="100%" class="image__border">
</div>
<center>https://developers.google.com/web/fundamentals/performance/critical-rendering-path/constructing-the-object-model?hl=ko</center>

<br/>

DOM 및 CSSOM 트리를 결합하여 렌더 트리(render tree)를 형성한다. 렌더 트리에는 페이지를 렌더링하는 데 필요한 노드만 포함된다. 일부 노드는 CSS를 통해 숨겨지며 렌더 트리에서 생략될 수 있다. 렌더 트리의 노드들은 화면에 최종적으로 출력하기 위한 정보를 각자 지니고 있다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/virtual-dom-05.png" width="100%" class="image__border">
</div>
<center>https://developers.google.com/web/fundamentals/performance/critical-rendering-path/constructing-the-object-model?hl=ko</center>

<br/>

렌더 트리가 생성되었으면 레이아웃(layout) 작업을 수행할 수 있다. 렌더 트리는 스타일 정보를 가지고 있지만, 기기의 뷰포트(viewport) 내에서 정확한 위치와 크기가 계산되어 있지 않다. 레이아웃 프로세스에서는 각 요소의 상대적인 측정값이 절대적인 픽셀(pixel)로 변환된다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/virtual-dom-06.png" width="100%" class="image__border">
</div>
<center>TOSS - 성능 최적화</center>

<br/>

레이아웃 작업을 통해 각 노드의 계산된 스타일과 기하학적 형태에 대한 파악이 끝났으면, 페인트 단계에서 각 노드를 화면의 실제 픽셀로 변환한다. 이 시점에 위치 같은 정보와 관계없는 CSS 속성(색상, 투명도 등)을 적용한다. `렌더 트리 생성 > 레이아웃 > 페인트` 과정을 거쳐 브라우저 화면을 그리는 과정을 렌더링(rendering)이라고 한다. 아래 이미지는 전체적인 브라우저 로딩 과정을 나타낸다. `STYLE 과정`은 렌더 트리 생성과 동일한 과정이다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/virtual-dom-07.png" width="75%" class="image__border">
</div>
<center>TOSS - 성능 최적화</center>

<br/>

DOM 트리나 CSSOM 트리가 변경되면 렌더 트리가 다시 구성된다. DOM 객체가 추가 혹은 삭제되거나 요소의 기하학적 형태에 영향을 주는 CSS 값이 변경되는 경우 레이아웃부터 이후 과정을 다시 수행해야 한다. 이를 `레이아웃(layout) 혹은 리플로우(reflow)`라고 한다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/virtual-dom-08.png" width="55%" class="image__border">
</div>
<center>TOSS - 성능 최적화</center>

<br/>

반대로 기하적인 변경이 없는 경우에는 레이아웃 과정을 건너뛰고, 페인트부터 수행하므로 이를 `리페인트(repaint)`라고 한다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/virtual-dom-09.png" width="55%" class="image__border">
</div>
<center>TOSS - 성능 최적화</center>

## 2. Virtual DOM

실제 DOM을 조작하는 것은 느리지 않다. 하지만 DOM을 조작하여 발생하는 리플로우, 리페인트 작업의 비용이 굉장히 높다. 브라우저의 연산이 많이 필요하기 때문이다. 특히 리플로우는 전체 픽셀을 다시 계산해야 하기 때문에 리페인트보다 더 많은 부하가 발생한다.

`가상 DOM은 리플로우, 리페인트 작업을 최소화하기 위해 등장했다.` 자바스크립트(JavaScript) 같은 프로그래밍 언어로 인해 뷰(view)에 변화가 생겼을 때 이전 DOM과 새로운 DOM을 비교하고, 변경된 내용을 모아서 실제 DOM에 적용한다. 변화 사항이 실제 DOM까지 바로 이어지는 것이 아니라 중간 버퍼(buffer)가 생긴 것이다. 발생하는 변화 사항을 가상 DOM에서 처리하고 한 번만 실제 DOM에 반영하기 때문에 변화의 규모는 커지게 된다. 하지만 리플로우, 리페인트 횟수를 줄여 성능상 이득을 얻을 수 있다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/virtual-dom-10.png" width="100%" class="image__border">
</div>
<center>https://www.oreilly.com/library/view/learning-react-native/9781491929049/ch02.html</center>

## CLOSING

프론트엔드와 관련된 기술 스택을 잘 모르는 편인데, 이번 글을 정리하면서 조금 더 친해졌다. 최근에 들었던 SSR(Server Side Rendering)과 관련된 글도 곁다리로 함께 읽어볼 수 있었고, 프론트엔드 진영의 기술력에 감탄하기도 했다. 참고한 글들 중 [Vanilla Javascript로 가상돔(VirtualDOM) 만들기][vanilla-javascript-virtual-dom-link]라는 글은 순수 자바스크립토로 컴포넌트, 가상 DOM, 리액트 훅스(hooks)를 구현한 코드를 읽어볼 수 있었는데 덕분에 많은 공부가 되었다. 누군가는 프레임워크나 라이브러리의 본질을 파고들기 위한 공부를 하고 있다는 것에 큰 자극을 느꼈다.

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
