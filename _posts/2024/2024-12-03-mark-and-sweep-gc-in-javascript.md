---
title: "Mark-and-sweep algorithm for garbage collect"
search: false
category:
  - information
  - javascript
last_modified_at: 2024-12-03T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Reference counting algorithm for garbage collect][reference-counting-gc-in-javascript-link]

## 0. 들어가면서

[참조 카운팅 알고리즘][reference-counting-gc-in-javascript-link]에서 정리한 것처럼 치명적인 단점으로 인해 모던 브라우저의 가비지 컬렉팅(garbage collecting)의 메인 알고리즘으로 사용되지 않는다. 보조적인 역할 정도로 사용되는 것 같다. 이번 글은 메인 알고리즘으로 사용되는 마크-앤-스윕(mark-and-sweep) 알고리즘에 대해 정리한다.

## 1. Mark-and-sweep algorithm

`도달할 수 없는 객체`를 제거하는 알고리즘이다. 이 알고리즘에션 루트(root)라는 컨셉의 객체를 사용한다. 자바스크립트에서 루트는 전역 객체(global object)다. 주기적으로 실행되는 가비지 컬렉팅은 루트 객체로부터 시작해서 참조되는 모든 객체들을 찾는다. 이 과정에서 접근할 수 있는 모든 객체들(reachable objects)과 접근할 수 없는 모든 객체들(non-reachable objects) 모두 찾아낸다. 이 과정을 마킹(marking)이라고 한다.

<div align="center">
  <img src="/images/posts/2024/mark-and-sweep-gc-in-javascript-01.gif" width="80%" class="image__border">
</div>
<center>https://v8.dev/blog/concurrent-marking</center>

<br/>

[MDN 문서](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management#mark-and-sweep_algorithm)에 따르면 모든 모던 브라우저들은 마크-앤-스윕 가비지 컬레터를 기본적으로 제공한다고 한다. 자바스크립트의 가비지 컬렉션은 이 알고리즘의 구현 방식을 개선한 것이지 알고르짐 자체에 대한 근본적인 변화는 없었다고 한다. 마크-앤-스윕 알고리즘이 가비지 컬렉터의 주요 알고리즘으로 자리 잡을 수 있었던 이유는 순환 참조(cycle reference)에 대한 문제를 해결할 수 있기 때문이다.

순환 참조는 서로를 참조하고 있기 때문에 [참조 카운팅 알고리즘][reference-counting-gc-in-javascript-link]으론 사용되지 않는지 여부를 판단하기 어렵다. 이렇게 객체들이 서로 연결되어 섬 같은 구조를 만드는데, 이를 `도달할 수 없는 섬`이라고 표현한다. 마크-앤-스윕 알고리즘을 사용하면 이렇게 도달할 수 없는 섬 전부를 메모리에서 삭제할 수 있다.

1. 가비지 컬렉터는 루트 정보를 수집하고 이를 마킹한다.
2. 루트가 참조하고 있는 모든 객체를 방문하면서 이들을 마킹한다.
3. 마킹된 모든 객체에 방문하고 그 객체들이 참조하는 객체들도 마킹한다. 한번 방문한 객체는 마킹하기 때문에 같은 객체에 다시 방문하진 않는다.
4. 루트에 도달 가능한 모든 객체를 방문할 때까지 위 과정을 반복한다.
5. 마킹 되지 않은 모든 객체들은 메모리에서 삭제(sweep)한다.

<div align="center">
  <img src="/images/posts/2024/mark-and-sweep-gc-in-javascript-02.gif" width="80%" class="image__border">
</div>
<center>https://ko.javascript.info/garbage-collection</center>

## 2. Mark-sweep-compact algorithm

V8 엔진(크롬)은 가비지 컬렉션으로 인해 발생하는 성능 저하를 개선하기 위해 메인 스레드에서 이뤄지는 가비지 컬렉션을 병렬, 동시적으로 수행하는 등의 많은 변화를 만들었다. 그 중 한가지로 메모리를 정리하는 컴팩트(compact) 과정을 마크-앤-스윕 알고리즘에 추가했다. 오래된 PC의 하드 디스크 조각 모음과 같은 압축 기능이다. 

V8 엔진의 가비지 컬렉션은 JVM과 유사하게 동작한다. 힙 메모리 내부를 젊은 세대(young generation)과 오래된 세대(old generation)로 나누고, 마이너 GC(minor GC)와 메이저 GC(major GC)를 수행한다. 

<div align="center">
  <img src="/images/posts/2024/mark-and-sweep-gc-in-javascript-03.png" width="80%" class="image__border">
</div>
<center>https://deepu.tech/memory-management-in-v8/</center>

<br/>

- 젊은 세대에 대한 가비지 컬렉션을 마이너 GC(혹은 scavenger)라고 한다.
- 모든 힙 영역에 대한 가비지 컬렉션을 메이저 GC라고 한다.

젊은 세대 영역에서 이뤄지는 마이너 GC 사이클이 지속되면 오래된 세대 영역의 공간은 계속 채워진다. 지속해서 생존한 객체들은 오래된 세대 영역으로 이동하기 때문이다. V8 엔진은 오래된 세대 영역의 공간이 충분하지 않다고 판단하면 메이저 GC를 수행한다. 이때 회수된 객체들이 차지하고 있던 파편화 된 메모리 조각들을 하나로 모으기 위해 생존한 객체들을 한 곳으로 모은다. 이를 마크-스윕-컴팩트 알고리즘이라 한다.

<div align="center">
  <img src="/images/posts/2024/mark-and-sweep-gc-in-javascript-04.gif" width="80%" class="image__border">
</div>
<center>https://deepu.tech/memory-management-in-v8/</center>

#### REFERENCE

- <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management>
- <https://ko.javascript.info/garbage-collection>
- <https://deepu.tech/memory-management-in-v8/>
- <https://ui.toast.com/weekly-pick/ko_20200228>
- <https://v8.dev/blog/trash-talk>
- <https://v8.dev/blog/orinoco-parallel-scavenger>

[reference-counting-gc-in-javascript-link]: https://junhyunny.github.io/information/javascript/reference-counting-gc-in-javascript/