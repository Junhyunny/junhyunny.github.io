---
title: "Reference counting garbage collecting"
search: false
category:
  - information
  - javascript
last_modified_at: 2024-11-30T23:55:00
---

<br/>

## 0. 들어가면서

현재 프로젝트에서 첫 MVP 릴리즈 이후 클라이언트(브라우저) 애플리케이션에서 OOM(out of memory)가 의심되는 현상이 발견됬다. 사용자가 약 1시간 30분 정도 장시간 동안 애플리케이션을 사용하는 데, 중간에 화면이 멈추는 현상이 있다는 리포트를 받았다. 메모리 릭(memory leak)에 의해 가비지 컬렉팅(gc, garbage collecting)이 자주 일어나면서 프로세스가 멈춘 것처럼 보였을 것 같다고 추측했다. 크롬 개발자 도구를 사용해 의심 가는 코드를 고쳐 메모리 릭 문제는 해결했다. 관련된 내용은 조만간 정리할 예정이다.

이 글은 메모리 릭 문제를 해결할 때 동료와 짧게 이야기를 나눴던 크롬(chrome), 엣지(edge), 노드(node) 같은 자바스크립트 엔진에서 사용하는 가비지 컬렉터 알고리즘에 대해 정리하기 위한 글이다. 알고리즘 종류가 다양해서 별도 글로 작성했다. 

## 1. Reference counting 

참조 카운팅(reference counting)은 각 객체에 대한 참조 횟수를 추적한다. 참조 횟수가 0이 되면, 어떤 객체도 참조하지 않는 객체(더 이상 필요 없는 객체)가 된다. 해당 객체를 아무도 사용하지 않기 때문에 가비지 컬렉팅 대상이 된다. [MDN 예시 코드](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management#reference-counting_garbage_collection)를 살펴보자.

```js
let x = {
  a: {
    b: 2,
  },
};
```

위 코드가 실행되면 두 개의 객체가 만들어진다. 하나는 프로퍼티에 의해 참조되는 객체와 다른 하나는 x 변수에 의해 참조되는 객체다. 

```js
let y = x;
```

y 변수를 사용해 x 변수가 참조하는 객체를 참조한다. 이런 상황에선 x 변수가 참조하는 객체의 레퍼런스 카운트는 "2"가 된다. 

<div align="center">
  <img src="/images/posts/2024/reference-counting-gc-in-javascript-01.png" width="80%" class="image__border">
</div>

<br/>

x 변수에 다른 값을 할당하면 해당 객체의 참조 카운트는 1로 바뀐다.

```js
x = 1;
```

<div align="center">
  <img src="/images/posts/2024/reference-counting-gc-in-javascript-02.png" width="80%" class="image__border">
</div>

<br/>

y 변수가 참조하는 객체의 a 프로퍼티로 참조하는 객체를 z 변수가 참조하도록 만든다. 

```js
let z = y.a;
```

이렇게 되면 처음 만든 객체의 a 프로퍼티가 참조하고 있는 객체의 참조 카운트는 2가 된다.

<div align="center">
  <img src="/images/posts/2024/reference-counting-gc-in-javascript-03.png" width="80%" class="image__border">
</div>

<br/>

y 변수에 다른 값을 할당하면 최초 x 변수가 참조했던 객체는 참조 카운트가 0이 된다. 

```js
y = "mozilla";
```

가비지 컬렉팅 대상이 되어 객체가 삭제되지만, a 프로퍼티가 참조하던 객체는 z 변수에 의해 여전히 참조되므로 가비지 컬렉팅 대상이 되지 않는다.

<div align="center">
  <img src="/images/posts/2024/reference-counting-gc-in-javascript-04.png" width="80%" class="image__border">
</div>

<br/>

z 변수에 다른 값을 할당하면 내부 객체도 참조 카운트가 0이 되면서 가비지 컬렉팅 대상이 된다.

```js
z = null;
```

<div align="center">
  <img src="/images/posts/2024/reference-counting-gc-in-javascript-05.png" width="80%" class="image__border">
</div>

## 2. Disadvantages

MDN 문서를 보면 다음과 같은 주의 사항을 볼 수 있다.

> No modern JavaScript engine uses reference-counting for garbage collection anymore.

모던 자바스크립트 엔진은 참조 카운팅 방식의 가비지 컬렉션을 사용하지 않는다. 구현하기 단순하고, 참조 카운팅이 0이 되는 순간 즉시 메모리를 회수할 수 있는 장점이 있지만, 순환 참조는 감지할 수 없다는 치명적인 단점이 있다. 순환 참조는 [위키피디아](https://en.wikipedia.org/wiki/Reference_counting)에 명시된 주된 3가지 단점들 중 한가지다. 

- 참조 카운팅의 잦은 업데이트는 비효율적이다.
- 순환 참조를 처리할 수 없다.
- 동시성(concurrent) 상황이라면 모든 참조 카운팅 업데이트는 원자적 연산(atomic operation)이어야 한다. 이는 추가적인 비용이 필요하다.

시스템에서 명시적으로 순환 참조를 막거나 추적(tracing) 가비지 컬렉터를 함께 사용하는 방법 등으로 참조 카운트의 순환 참조 문제를 보완한다. 주된 원인으로 뽑히는 순환 참조 상황을 MDN 예제 코드를 통해 살펴보자.

```js
function f() {
  const x = {};
  const y = {};
  x.a = y; // x references y
  y.a = x; // y references x
  return "azerty";
}

f();
```

함수 스코프가 끝나면 스택 메모리의 x, y 변수는 사라지지만, 각 a 프로퍼티를 통해 참조 중이기 때문에 참조 카운팅이 0이 되지 않는다. 가비지 컬레팅 대상이 되지 않아 메모리가 회수되지 않는다.

<div align="center">
  <img src="/images/posts/2024/reference-counting-gc-in-javascript-06.png" width="80%" class="image__border">
</div>

## CLOSING

참조 카운트 가비지 컬렉터는 치명적인 단점이 있기 때문에 모던 브라우저 등 자바스크립트 엔진에서 사용되지 않는다. 주로 사용하는 마크-앤-스윕(mark and sweep) 알고리즘은 다른 글을 통해 소개한다.

#### REFERENCE

- <https://en.wikipedia.org/wiki/Garbage_collection_(computer_science)>
- <https://en.wikipedia.org/wiki/Reference_counting>
- <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management#reference-counting_garbage_collection>
- <https://reactnext-central.xyz/blog/javascript/garbage-collection-in-javascript>