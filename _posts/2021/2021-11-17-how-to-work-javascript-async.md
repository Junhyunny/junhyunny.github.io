---
title: "JavaScript 비동기 처리 동작 원리"
search: false
category:
  - information
  - javascript
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS
- [비동기 논블로킹(Asynchronous Non-Blocking) 처리][asynchronous-non-blocking-link]

#### RECOMMEND NEXT POSTS
- [자바스크립트(JavaScript) 마이크로태스크(Microtask)와 매크로태스크(Macrotask)][microtask-macrotask-in-javascript-link]

## 0. 들어가면서

> 논-블로킹이나 비동기 처리에 대해서 아시나요?

어설프게 아는 지식을 주절주절 말했더니, 다음 질문이 이어왔다.

> 싱글 스레드 환경에서 비동기적인 처리를 수행할 방법이 있을까요?

비동기 처리는 멀티 스레드 환경에서나 가능하다고 생각했던 얕은 지식 수준에 발목을 잡혀버리고 말았다. 실제로 `Node.js` 환경의 JavaScript 엔진은 싱글 스레드임에도 비동기적인 처리가 가능하다. 어떤 매커니즘을 통해 싱글 스레드 환경에서 비동기적인 처리가 가능한지 확인해보겠다.

## 1. JavaScript Runtime

우선 JavaScript 런타임(Runtime)에 대해 알아둘 필요가 있다. JavaScript 런타임은 이름 그대로 JavaScript가 동작하는 환경을 의미한다. 크롬(chrome), 파이어폭스(firefox), 엣지(edge) 같은 브라우저와 `Node.js`가 대표적인 JavaScript 런타임이다.

### 1.1. JavaScript Runtime 구조

대표적인 구글 브라우저인 크롬(chrome)을 기준으로 JavaScript 런타임 구조를 알아보겠다. JavaScript 런타임은 크게 4개로 구성되어 있다. 전체적인 구조를 살펴보고 각 구성 요소에 대해 자세히 알아보겠다.

- JavaScript Engine
- Web APIs
- Callback Queue
- Event Loop

##### JavaScript Runtime 구조

<div align="center">
  <img src="{{ site.image_url_2021 }}/how-to-work-javascript-async-01.png" width="75%" class="image__border">
</div>
<center>https://blog.sessionstack.com/how-does-javascript-actually-work-part-1-b0bacc073cf</center>

### 1.2. JavaScript Engine

대표적인 JavaScript 엔진(engine)인 Google의 V8 엔진의 간략화 된 구조를 살펴보겠다. V8 엔진은 크롬과 Node.js에서 사용 중이며, 메모리 힙(memory heap), 콜 스택(call stack) 두 개의 컴포넌트로 구성된다.

- 메모리 힙(Memory Heap) - 변수 및 객체들에게 할당된 메모리가 위치한 공간
- 콜 스택(Call Stack) - 함수 호출을 스택(stack)으로 관리하는 공간

JavaScript 엔진의 인터프리터(interpreter)는 코드를 분석하고, 실행 가능한 명령으로 변환한다. 코드에 맞춰 메모리를 할당하고, 호출한 함수는 콜 스택에 추가(push)한다. 최상위 스택에 위치한 함수를 실행하고, 완료되면 콜 스택에서 제거(pop)한다. JavaScript 엔진은 하나의 콜 스택을 가지고 있기 때문에 싱글 스레드의 동기식 방식으로 실행된다. 최상위 스택에 위치한 함수가 실행되는 동안 하위 스택은 실행되지 않는다.

##### V8 JavaScript Engine 구조

<div align="center">
  <img src="{{ site.image_url_2021 }}/how-to-work-javascript-async-02.png" width="40%" class="image__border">
</div>
<center>https://blog.sessionstack.com/how-does-javascript-actually-work-part-1-b0bacc073cf</center>

### 1.3. Web APIs

멀티 스레드로 실행되며, 브라우저가 제공하는 기능이다. 브라우저마다 제공하는 기능이 다르지만 공통적으로 제공해주는 기능들을 살펴보면 다음과 같다.

- Manipulate documents(DOM API) - 개발자가 HTML, CSS을 조작할 수 있는 기능
- Draw and manipulate graphics(Canvas, WebGL API) - `<canvas>`에 포함된 픽셀(pixel) 데이터를 변경할 수 있는 기능
- Fetch data from a server - 네트워크를 통해 서버로부터 리소스를 가져오는 기능

### 1.4. Callback Queue

Web API 기능이 종료되면서 보내지는 콜백 함수(callback function)들이 순서대로 저장된다. 콜백 큐(callback queue)에 담긴 콜백 함수들은 JavaScript 엔진의 콜 스택이 비워지기를 기다리다가 이벤트 루프(event loop)에 의해 이동된다. 큐의 특성상 먼저 들어온 콜백 함수가 먼저 콜 스택으로 빠져나간다. (FIFO, First In First Out)

JavaScript 런타임에는 여러 가지 큐가 존재한다. 동일한 큐 내에선 먼저 들어온 콜백 함수가 먼저 나가지만, 큐 사이에는 우선순위가 존재한다.

- Micro Task Queue
  - 콜 스택이 비워지면 최우선적으로 처리되는 큐이다.
  - Promise, process.nextTick, Object.observe, MutationObserver 등이 속한다.
- Task Queue
  - Micro Task Queue가 완전히 비어지면 Event Loop에 의해 처리된다.
  - 스크립트 실행, fetch, Ajax, DOM 등이 속한다.
- Animation frames
  - Micro Task Queue가 완전히 비어지면 Event Loop에 의해 처리된다.

### 1.5. Event Loop

싱글 스레드로 실행되며, 이벤트 루프는 콜백 큐에 담긴 콜백 함수들을 콜 스택으로 전달한다. 다음과 같은 조건을 만족할 때 콜백 함수를 콜 스택으로 전달한다.

- 콜 스택에 실행 중인 함수가 없어야 한다.
- 큐에 실행시킬 콜백 함수가 존재해야 한다.
- 큐의 우선순위를 고려하여 가장 우선순위가 높은 함수를 콜 스택으로 이동시킨다.

## 2. JavaScript 런타임 동작 과정

<http://latentflip.com/loupe> 사이트에서 직접 작성한 JavaScript 코드가 JavaScript 런타임에서 동작하는 모습을 확인할 수 있다.

### 2.1. JavaScript 코드

```javascript
$.on('button', 'click', function onClick() {
    setTimeout(function timer() {
        console.log('You clicked the button!');
    }, 1000);
});

console.log("Hi!");

setTimeout(function timeout() {
    console.log("Click the button!");
}, 2000);

console.log("Welcome to loupe.");
```

### 2.2. HTML 코드

클릭 이벤트를 처리할 수 있는 버튼을 하나 추가한다.

```html
<button>Click me!</button>
```

### 2.3. 테스트 수행 결과

코드 동작을 간단하게 설명해보겠다.

1. `$.on('button', 'click', function onClick() {...});` 함수가 콜 스택에서 실행된다.
1. `function onClick() {...}` 함수가 버튼에 대한 클릭 이벤트가 `Web Apis` 영역에 추가된다.
1. `console.log("Hi!");` 함수가 콜 스택에서 실행된다.
1. `setTimeout(function timeout() {...})` 함수가 콜 스택에서 실행된다.
1. 아래 기능은 동시에 동작한다.
  - `Web Apis` 영역에서 2초 이후에 `timeout()` 함수를 콜백 큐로 이동시킨다.
  - `console.log("Welcome to loupe.");` 함수가 콜 스택에서 실행된다.
1. 콜 스택이 비워지면 이벤트 루프는 `timeout()` 함수를 콜 스택으로 이동시킨다.
1. `console.log("Click the button!");` 함수가 콜 스택에서 실행된다.
1. 사용자가 하단 "Click me!" 버튼을 누른다.
1. Web APIs 영역에 등록된 `onClick()` 함수가 콜 스택에서 실행된다.
1. `onClick()` 함수 내부에 `setTimeout(function timer() {...})` 함수가 콜 스택에서 실행된다.
1. `Web Apis` 영역에서 1초 이후에 `timer()` 함수를 콜백 큐로 이동시킨다.
1. 콜 스택이 비워지면 이벤트 루프는 `timer()` 함수를 콜 스택으로 이동시킨다.
1. `console.log("You clicked the button!");` 함수가 콜 스택에서 실행된다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/how-to-work-javascript-async-03.gif" width="100%" class="image__border">
</div>
<center>https://blog.sessionstack.com/how-does-javascript-actually-work-part-1-b0bacc073cf</center>

## CLOSING

이해한 내용들을 나중에 쉽게 알아보기 위해 요약, 정리해보았다.

- 사용자에게 보여지는 브라우저의 기능은 JavaScript 엔진에 위치한 콜 스택에서 실행되는 함수들이 동작하는 모습이다.
- JavaScript 엔진은 싱글 스레드로 동작함에도 불구하고 여러 가지 기능을 동시에 처리하는 것처럼 비동기적인 모습을 보인다.
- **JavaScript 엔진의 비동기적인 처리는 JavaScript 런타임의 Web API를 이용한 논-블로킹(non-blocking) 처리를 통해 이뤄진다.**
- JavaScript 엔진은 Web API 기능 사용시 일을 맡긴 후 바로 다음 일을 수행한다.
- Web API는 자신이 수행할 일을 마치고, 콜 스택으로부터 전달받은 콜백 함수를 콜백 큐에 이동시킨다.
- 이벤트 루프는 우선순위에 따라 콜백 큐에 담긴 콜백 함수들을 JavaScript 엔진의 콜 스택으로 이동시킨다.
- 콜백 함수가 콜 스택에 추가되면 JavaScript 엔진은 이를 수행한다.

#### REFERENCE

- <https://ingg.dev/js-work/>
- <http://jaynewho.com/post/25>
- <https://dkje.github.io/2020/09/20/AsyncAndEventLoop/>
- <https://medium.com/@gemma.stiles/understanding-the-javascript-runtime-environment-4dd8f52f6fca>
- <http://latentflip.com/loupe>

[asynchronous-non-blocking-link]: https://junhyunny.github.io/information/java/asynchronous-and-non-blocking-process/

[microtask-macrotask-in-javascript-link]: https://junhyunny.github.io/information/javascript/microtask-macrotask-in-javascript/
