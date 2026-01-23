---
title: "DOM(Document Object Model)"
search: false
category:
  - information
last_modified_at: 2021-12-12T15:55:00
---

<br/>

## 1. DOM(Document Object Model)

> MDN Web Docs<br/>
> The Document Object Model (DOM) is a programming interface for web documents. 
> It represents the page so that programs can change the document structure, style, and content. 
> The DOM represents the document as nodes and objects; that way, programming languages can interact with the page.

DOM(Document Object Model)은 HTML, XML 같은 웹 문서를 위한 프로그래밍 인터페이스입니다. 
`JavaScript` 같은 프로그래밍 언어는 DOM을 이용하여 문서의 구조, 스타일, 내용을 변경할 수 있습니다. 
프로그래밍 언어는 인터페이스인 DOM의 내부 구현은 알 필요가 없습니다. 
단순한 DOM의 메서드를 호출하여 문서의 내용을 조작하면 됩니다. 

`DOM`과 `DOM API` 개념에 대해 다시 정리하면 다음과 같습니다. 
- 정적인 HTML 문서를 동적으로 제어하기 위해선 JavaScript 같은 프로그래밍 언어로 DOM을 조작해야합니다.
- 브라우저는 HTML을 분석한 후 메모리에 트리 형태의 모델을 로드(load)하며, 이를 DOM(Document Object Model)이라고 합니다. 
- DOM은 HTML 요소를 찾고 조작할 수 있도록 속성(property)과 메서드(method)들을 제공합니다. 
- DOM에 접근하고 변경하는 기능들의 집합을 `DOM API`라고 합니다.

##### JavaScript 언어로 HTML 문서 조작하기 By Using DOM API
- 문서에서 `id` 값이 "container"인 요소(element)를 찾습니다.
- 찾은 객체의 내부 HTML 값을 "New Content!" 로 변경합니다.

```html
<script>
    var container = document.getElementById("container");
    container.innerHTML = "New Content!";
</script>
```

##### Document - DOM - JavaScript 관계

<p align="center">
    <img src="/images/document-object-model-1.JPG" width="85%" class="image__border">
</p>
<center>https://velog.io/@lucylou/DOM</center>

## 2. DOM 트리(Tree)

> Wiki<br/>
> The Document Object Model (DOM) is a cross-platform and language-independent interface 
> that treats an XML or HTML document as a tree structure 
> wherein each node is an object representing a part of the document. 
> The DOM represents a document with a logical tree.

DOM은 XML, HTML 같은 문서를 논리적인 트리 구조로 표현합니다. 
트리의 각 노드(node)는 문서의 일부분을 표현하는 객체입니다. 

##### DOM 트리 표현

<p align="center">
    <img src="/images/document-object-model-2.JPG" width="85%" class="image__border">
</p>
<center>https://velog.io/@lucylou/DOM</center>

### 2.1. DOM 트리 생성

DOM 트리는 브라우저가 HTML 문서를 해석하면서 만들어집니다. 
HTML 파서(parser)가 HTML 문서에 적힌 HTML 코드를 파싱하여 메모리 상에 DOM 트리를 생성합니다. 
DOM 트리는 HTML 문서의 각 요소(element)들을 트리 형태로 표현한 것 입니다. 
DOM API는 스크립트 언어가 문서의 렌더링(rendering) 되는 모습을 쉽게 조작할 수 있는 기능을 제공합니다. 
`JavaScript`는 `DOM API`를 이용해 동적으로 DOM을 조작할 수 있으며, 변경된 DOM은 다시 렌더링에 반영됩니다.

##### Webkit 엔진 HTML 문서 렌더링 과정

<p align="center">
    <img src="/images/document-object-model-3.JPG" width="65%" class="image__border">
</p>
<center>https://it-eldorado.tistory.com/87</center>

### 2.2. DOM 트리 구성 요소

DOM 트리를 구성하는 노드들은 크게 4가지로 구분됩니다. 
- 문서 노드(Document Node)
    - 트리의 최상위에 존재하며 각각 요소, 속성, 텍스트 노드에 접근하려면 문서 노드를 통해야 합니다. 
    - DOM tree에 접근하기 위한 시작점(entry point)입니다.
- 요소 노드(Element Node)
    - 요소 노드는 HTML 요소를 표현합니다. 
    - HTML 요소는 중첩에 의해 부자 관계를 가지며 이 부자 관계를 통해 정보를 구조화합니다. 
    - 속성, 텍스트 노드에 접근하려면 먼저 요소 노드를 찾아 접근해야 합니다. 
    - 모든 요소 노드는 요소별 특성을 표현하기 위해 `HTMLElement` 객체를 상속한 객체로 구성됩니다.
- 속성 노드(Attribute Node)
    - HTML 요소의 속성을 의미합니다. 
    - 속성 노드는 HTML 요소의 자식이 아니라 일부분으로 표현됩니다.
    - 특정 HTML 요소를 찾아서 접근하면, 해당 요소의 속성을 참조, 수정할 수 있습니다.
- 텍스트 노드(Text Node)
    - HTML 요소의 텍스트를 표현합니다.
    - 자식 노드드를 가질 수 없으므로 DOM 트리의 잎 노드(leaf node)입니다.

##### DOM 트리 구성 요소

<p align="center">
    <img src="/images/document-object-model-4.JPG" width="65%" class="image__border">
</p>
<center>https://poiemaweb.com/js-dom</center>

##### DOM 트리 내 구성 요소별 위치 

<p align="center">
    <img src="/images/document-object-model-5.JPG" width="65%" class="image__border">
</p>
<center>https://poiemaweb.com/js-dom</center>

## CLOSING
최근 리액트를 공부하면서 관련된 내용을 정리하려다보니 DOM에 대한 포스트를 작성하게 되었습니다. 
다음과 같은 의식의 흐름이 여기까지 이어졌습니다. 
1. 리액트 `useEffect` 훅(hook)에 대해서 정리하려고보니 라이프 사이클에 대한 내용을 잘 모르겠다.
1. 라이프 사이클에 대한 내용을 정라히려고보니 리액트 컴포넌트에 대한 내용을 잘 모르겠다.
1. 리액트 컴포넌트에 대한 내용을 정리하려고 보니 가상 DOM(Virtual DOM)에 대한 내용을 잘 모르겠다.
1. 가상 DOM에 대한 내용을 정리하려고 보니 DOM이 무엇인지 잘 모르겠다.

빠르게 나가야하는 상황에서 본질적인 부분들까지 정리하다보니 시간이 많이 소모되는 것 같습니다. 
지금 시간을 투자하여 정리해놓는 것들이 나중에 많은 도움이 되기를 바라며 꾸준히 정리해나가야겠습니다. 
또, DOM에 대해 정리하면서 잘못 이해하고 있는 부분들을 발견했습니다. 
저는 DOM이 HTML 문서에 존재하는 요소(element)같은 것으로 착각하고 있었는데, 
마무리 글로 잘못 이해한 내용들을 정리하면서 이번 포스트를 마무리하겠습니다. 

##### 잘못 이해했던 내용 정리
- DOM은 HTML 문서를 원본으로 브라우저에 의해 실행되는 순간 생성되지만 둘은 서로 다릅니다.
- 유효하지 않은 HTML 문서가 브라우저에 의해 자동으로 교정되면서 생성된 DOM은 원본과 달라질 수 있습니다.
- JavaScript 언어로 작성된 사용자 이벤트 등에 의해 변경됩니다.

#### REFERENCE
- <https://en.wikipedia.org/wiki/Document_Object_Model>
- <https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction>
- <https://developer.mozilla.org/ko/docs/Web/API/Document_Object_Model/Introduction>
- <https://velog.io/@lucylou/DOM>
- <https://it-eldorado.tistory.com/87>
- <https://poiemaweb.com/js-dom>