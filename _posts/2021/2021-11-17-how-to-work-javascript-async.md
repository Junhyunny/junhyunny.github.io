---
title: "자바스크립트(JavaScript) 비동기 처리(asynchronous task) 동작 원리"
search: false
category:
  - information
  - javascript
last_modified_at: 2026-04-27T09:00:00+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [비동기 논블로킹(Asynchronous Non-Blocking) 처리][asynchronous-non-blocking-link]

## 0. 들어가면서

면접에서 이런 질문을 받았다.

> 논-블로킹이나 비동기 처리에 대해서 아시나요?

어설프게 아는 지식을 주절주절 말했더니 다음 질문이 이어졌다.

> 싱글 스레드 환경에서 비동기적인 처리를 수행할 방법이 있을까요?

비동기 처리는 멀티 스레드 환경에서나 가능하다고 생각했던 얕은 지식 수준에 발목을 잡혀버리고 말았다. 실제로 자바스크립트(JavaScript) 엔진인 `Node.js` 환경은 싱글 스레드임에도 비동기적인 처리가 가능하다. 어떤 메커니즘을 통해 싱글 스레드 환경에서 비동기적인 처리가 가능한지 확인해보자.

## 1. JavaScript Runtime

우선 자바스크립트 런타임(Runtime)에 대해 알아둘 필요가 있다. 자바스크립트 런타임은 이름 그대로 자바스크립트가 동작하는 환경을 의미한다. 크롬(chrome), 파이어폭스(firefox), 엣지(edge) 같은 브라우저와 `Node.js`가 대표적인 자바스크립트 런타임이다. 구글 브라우저인 크롬(chrome)을 기준으로 런타임 구조를 살펴보자. 자바스크립트 런타임은 크게 4개로 구성되어 있다.

- 자바스크립트 엔진(engine)
- 웹 API(web API)
- 콜백 큐(callback queue)
- 이벤트 루프(event loop)

<div align="center">
  <img src="{{ site.image_url_2021 }}/how-to-work-javascript-async-01.png" width="75%" class="image__border">
</div>
<center>https://blog.sessionstack.com/how-does-javascript-actually-work-part-1-b0bacc073cf</center>

<br/>

대표적인 `자바스크립트 엔진인 크롬 V8 엔진`의 구조를 간략하게 살펴보자. V8 엔진은 크롬과 Node.js에서 사용 중이며, 메모리 힙(memory heap), 콜 스택(call stack) 두 개의 컴포넌트로 구성된다.

- 메모리 힙(Memory Heap) - 변수 및 객체들에게 할당된 메모리가 위치한 공간
- 콜 스택(Call Stack) - 함수 호출을 스택(stack)으로 관리하는 공간

<div align="center">
  <img src="{{ site.image_url_2021 }}/how-to-work-javascript-async-02.png" width="40%" class="image__border">
</div>
<center>https://blog.sessionstack.com/how-does-javascript-actually-work-part-1-b0bacc073cf</center>

<br/>

V8 엔진의 인터프리터(interpreter)는 코드를 분석하고, 실행 가능한 명령으로 변환한다. 코드에 맞춰 메모리를 할당하고, 호출한 함수는 콜 스택에 추가(push)한다. 최상위 스택에 위치한 함수를 실행하고, 완료되면 콜 스택에서 제거(pop)한다. V8 엔진은 하나의 콜 스택을 가지고 있기 때문에 싱글 스레드의 동기식 방식으로 실행된다. 최상위 스택에 위치한 함수가 실행되는 동안 하위 스택은 실행되지 않는다.

`웹 API`는 멀티 스레드로 실행되며, 브라우저가 제공하는 기능이다. 브라우저마다 제공하는 기능이 다르지만 공통적으로 제공해주는 기능들을 살펴보면 다음과 같다.

- Manipulate documents(DOM API) - 개발자가 HTML, CSS를 조작할 수 있는 기능
- Draw and manipulate graphics(Canvas, WebGL API) - `<canvas>`에 포함된 픽셀(pixel) 데이터를 변경할 수 있는 기능
- Fetch data from a server - 네트워크를 통해 서버로부터 리소스를 가져오는 기능

`콜백 큐`에는 웹 API 기능이 종료되면서 보내지는 콜백 함수(callback function)들이 순서대로 저장된다. 콜백 큐에 담긴 콜백 함수들은 자바스크립트 엔진의 콜 스택이 비워지기를 기다리다가 `이벤트 루프(event loop)`에 의해 콜 스택으로 이동된다. 큐의 FIFO(First In First Out) 특성상 먼저 들어온 콜백 함수가 먼저 콜 스택으로 들어간다.

자바스크립트 런타임에는 여러 가지 큐가 존재한다. 동일한 큐 내에선 먼저 들어온 콜백 함수가 먼저 나가지만, 큐 사이에는 우선순위가 존재한다.

- Micro Task Queue
  - 콜 스택이 비워지면 최우선적으로 처리되는 큐이다.
  - Promise, process.nextTick, Object.observe, MutationObserver 등이 속한다.
- Task Queue
  - Micro Task Queue가 완전히 비워지면 이벤트 루프에 의해 처리된다.
  - 스크립트 실행, fetch, Ajax, DOM 등이 속한다.
- Animation frames
  - Micro Task Queue가 완전히 비워지면 이벤트 루프에 의해 처리된다.

이벤트 루프는 싱글 스레드로 실행된다. 이벤트 루프는 콜백 큐에 담긴 콜백 함수들을 콜 스택으로 전달한다. 다음과 같은 조건을 만족할 때 콜백 함수를 콜 스택으로 전달한다.

- 콜 스택에 실행 중인 함수가 없어야 한다.
- 큐에 실행시킬 콜백 함수가 존재해야 한다.
- 큐의 우선순위를 고려하여 가장 우선순위가 높은 함수를 콜 스택으로 이동시킨다.

## 2. 자바스크립트 런타임 동작 과정

[이 사이트](http://latentflip.com/loupe)에서 직접 작성한 코드가 자바스크립트 런타임에서 어떻게 동작하는지 확인할 수 있다. 다음과 같은 코드를 작성했다.

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

HTML 코드에는 클릭 이벤트를 처리할 수 있는 버튼을 하나 추가한다.

```html
<button>Click me!</button>
```

버튼을 눌렀을 때 코드 동작을 살펴보자. 왼쪽 화면에서 빛나는 영역이 실행되는 코드 영역이다. 이벤트 루프에 의해 가운데 콜 스택으로 콜백 함수가 올라오면 실행되는 것을 확인할 수 있다. 비동기 I/O 요청이나 timeout 같이 웹 API 기능이 필요한 코드는 오른쪽 영역으로 이동되어 실행되는 것을 확인할 수 있다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/how-to-work-javascript-async-03.gif" width="100%" class="image__border">
</div>
<center>https://blog.sessionstack.com/how-does-javascript-actually-work-part-1-b0bacc073cf</center>

## CLOSING

이해한 내용들을 나중에 쉽게 알아보기 위해 요약해보았다.

- 사용자에게 보이는 브라우저의 기능은 자바스크립트 엔진에 위치한 콜 스택에서 실행되는 함수들이 동작하는 모습이다.
- 자바스크립트 엔진은 싱글 스레드로 동작함에도 불구하고 여러 가지 기능을 동시에 처리하는 것처럼 비동기적인 모습을 보인다.
- **자바스크립트 엔진의 비동기적인 처리는 자바스크립트 런타임의 웹 API를 이용한 논-블로킹(non-blocking) 처리를 통해 이뤄진다.**
- 자바스크립트 엔진은 웹 API 기능 사용 시 일을 맡긴 후 바로 다음 일을 수행한다.
- 웹 API는 자신이 수행할 일을 마치고, 콜 스택으로부터 전달받은 콜백 함수를 콜백 큐에 이동시킨다.
- 이벤트 루프는 우선순위에 따라 콜백 큐에 담긴 콜백 함수들을 자바스크립트 엔진의 콜 스택으로 이동시킨다.
- 콜백 함수가 콜 스택에 추가되면 자바스크립트 엔진은 이를 수행한다.

#### RECOMMEND NEXT POSTS

- [자바스크립트(JavaScript) 마이크로태스크(Microtask)와 매크로태스크(Macrotask)][microtask-macrotask-in-javascript-link]

#### REFERENCE

- <https://ingg.dev/js-work/>
- <http://jaynewho.com/post/25>
- <https://dkje.github.io/2020/09/20/AsyncAndEventLoop/>
- <https://medium.com/@gemma.stiles/understanding-the-javascript-runtime-environment-4dd8f52f6fca>
- <http://latentflip.com/loupe>

[asynchronous-non-blocking-link]: https://junhyunny.github.io/information/java/asynchronous-and-non-blocking-process/
[microtask-macrotask-in-javascript-link]: https://junhyunny.github.io/information/javascript/microtask-macrotask-in-javascript/
