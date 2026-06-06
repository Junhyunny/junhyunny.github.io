---
title: "DOM(Document Object Model)"
search: false
category:
  - information
last_modified_at: 2026-06-07T00:21:31+09:00
---

<br/>

## 1. DOM(Document Object Model)

브라우저는 HTML을 분석한 후 메모리에 트리 형태의 모델을 로드(load)하며, 이를 `DOM(Document Object Model)`이라고 한다. DOM은 HTML, XML 같은 웹 문서를 위한 프로그래밍 인터페이스이다. 정적인 HTML 문서를 동적으로 제어하기 위해서는 자바스크립트(JavaScript) 같은 프로그래밍 언어를 통해 DOM 객체를 조작한다. DOM은 HTML 문서의 구조, 스타일, 내용을 변경할 수 있는 API(속성과 메서드)를 제공한다. 개발자는 DOM API를 통해 손쉽게 브라우저에 보이는 화면을 제어할 수 있다. 간단한 예제 코드를 살펴보자.

1. 문서에서 `id` 값이 "container"인 요소(element)를 찾는다.
2. 찾은 객체의 내부 HTML 값을 "New Content!"로 변경한다.

```html
<script>
    var container = document.getElementById("container");
    container.innerHTML = "New Content!";
</script>
```

`문서(Document)-DOM-자바스크립트` 사이의 관계는 아래 이미지를 통해 설명할 수 있다. 요약하자면 DOM은 HTML과 자바스크립트 사이를 연결해 주는 중간 구조라고 볼 수 있다.

- HTML은 웹 페이지의 원본 구조를 담은 문서다.
- 브라우저는 HTML 태그를 해석해 DOM이라는 트리 형태의 객체 구조로 변환한다.
- 자바스크립트는 DOM API를 사용해 특정 요소를 찾고, 내용을 읽거나 수정한다.
- 자바스크립트가 DOM을 바꾸면 사용자가 보는 웹 페이지 화면도 함께 바뀐다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/document-object-model-01.png" width="100%" class="image__border">
</div>
<center>https://velog.io/@lucylou/DOM</center>

## 2. DOM 트리(Tree)

DOM은 XML, HTML 같은 문서를 논리적인 트리 구조로 표현한다. HTML 문서의 각 요소(element)를 트리 형태로 표현하는데, 이를 `DOM 트리(tree)`라고 한다. 트리의 각 노드(node)는 문서의 일부분을 표현하는 객체다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/document-object-model-02.png" width="100%" class="image__border">
</div>
<center>https://velog.io/@lucylou/DOM</center>

<br/>

DOM 트리는 브라우저가 HTML 문서를 해석하면서 만들어진다. HTML 파서(parser)가 HTML 문서에 적힌 HTML 코드를 파싱하여 메모리상에 DOM 트리를 생성한다. DOM API는 스크립트 언어가 문서의 렌더링(rendering)되는 모습을 쉽게 조작할 수 있는 기능을 제공한다. 자바스크립트는 `DOM API`를 이용해 동적으로 DOM을 조작할 수 있으며, 변경된 DOM은 다시 렌더링에 반영된다. 아래 이미지는 웹킷(Webkit) 엔진을 사용할 때 HTML 문서가 렌더링되는 과정이다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/document-object-model-03.png" width="80%" class="image__border">
</div>
<center>https://it-eldorado.tistory.com/87</center>

<br/>

DOM 트리를 구성하는 노드들은 크게 4가지로 구분된다.

- 문서 노드(Document Node)
  - 트리의 최상위에 존재하며 각각 요소, 속성, 텍스트 노드에 접근하려면 문서 노드를 통해야 한다.
  - DOM 트리에 접근하기 위한 시작점(entry point)이다.
- 요소 노드(Element Node)
  - 요소 노드는 HTML 요소를 표현한다.
  - HTML 요소는 중첩에 의해 부모-자식 관계를 가지며, 이 관계를 통해 정보를 구조화한다.
  - 속성, 텍스트 노드에 접근하려면 먼저 요소 노드를 찾아 접근해야 한다.
  - 모든 요소 노드는 요소별 특성을 표현하기 위해 `HTMLElement` 객체를 상속한 객체로 구성된다.
- 속성 노드(Attribute Node)
  - HTML 요소의 속성을 의미한다.
  - 속성 노드는 HTML 요소의 자식이 아니라 일부분으로 표현된다.
  - 특정 HTML 요소를 찾아서 접근하면, 해당 요소의 속성을 참조, 수정할 수 있다.
- 텍스트 노드(Text Node)
  - HTML 요소의 텍스트를 표현한다.
  - 자식 노드를 가질 수 없으므로 DOM 트리의 잎 노드(leaf node)이다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/document-object-model-04.png" width="80%" class="image__border">
</div>
<center>https://poiemaweb.com/js-dom</center>

<br/>

위에서 언급한 구성 요소 노드는 DOM 트리에서 다음과 같이 위치한다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/document-object-model-05.png" width="80%" class="image__border">
</div>
<center>https://poiemaweb.com/js-dom</center>

## CLOSING

최근 리액트를 공부하면서 궁금한 내용을 정리하려다 보니 DOM에 대한 글을 작성하게 되었다. 다음과 같은 의식의 흐름이 여기까지 이어졌다.

1. 리액트 `useEffect` 훅(hook)에 대해서 정리하려고 보니 라이프 사이클에 대한 내용을 잘 모르겠다.
2. 라이프 사이클에 대한 내용을 정리하려고 보니 리액트 컴포넌트에 대한 내용을 잘 모르겠다.
3. 리액트 컴포넌트에 대한 내용을 정리하려고 보니 가상 DOM(Virtual DOM)에 대한 내용을 잘 모르겠다.
4. 가상 DOM에 대한 내용을 정리하려고 보니 DOM이 무엇인지 잘 모르겠다.

프로젝트에서 빠르게 나가야 하는 상황인데, 이런 본질적인 부분까지 정리하다 보니 시간이 많이 소모된다. 지금 시간을 투자하여 정리해 놓는 것들이 나중에 많은 도움이 되기를 바라는 마음으로 꾸준히 정리해 나가고 있다.

#### REFERENCE

- <https://en.wikipedia.org/wiki/Document_Object_Model>
- <https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction>
- <https://developer.mozilla.org/ko/docs/Web/API/Document_Object_Model/Introduction>
- <https://velog.io/@lucylou/DOM>
- <https://it-eldorado.tistory.com/87>
- <https://poiemaweb.com/js-dom>
