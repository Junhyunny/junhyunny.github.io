---
title: "Microtask & Macrotask in Javascript"
search: false
category:
  - information
  - javascript
last_modified_at: 2022-01-08T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Asynchronous Task In JavaScript][how-to-work-javascript-async-link]

## 0. 들어가면서

최근 Jest의 advanceTimersByTime 함수를 사용한 테스트 코드에서 발생한 문제 상황을 글로 정리했다. 글로 정리한 내용을 팀원들에게 소개하는 시간이 있었는 데 생각보다 논리적으로 설명하지 못 했다. 제대로 설명하지 못 한 이유를 곰곰히 생각해보니 마이크로태스크(microtask)나 매크로태스크(macrotask)에 대한 이해도가 낮기 때문이었다. 이번 글에선 마이크로태스크와 매크로태스크에 대해 정리했다. 

## 1. Macrotask and Microtask

[Asynchronous Task In JavaScript][how-to-work-javascript-async-link]에서 설명했듯 브라우저 웹 API 호출이 완료되면 콜백 함수가 큐에 순서대로 담긴다. 콜백 함수가 담기는 큐는 두 가지 종류가 있다.

- 매크로태스크 큐(macrotask queue)
  - 우선 순위가 낮다.
- 마이크로태스크 큐(microtask queue)
  - 우선 순위가 높다.

우선 순위에 따라 실행되는 순서가 다르다. 물론 우선 순위가 높은 마이크로태스크 큐에 담긴 콜백 함수들이 먼저 실행된다. 마이크로태스크 큐가 모두 소진되면 다음 매크로태스크 큐에 담긴 콜백 함수들이 실행된다.

<div align="center">
  <img src="/images/posts/2022/microtask-macrotask-in-javascript-01.gif" width="100%" class="image__border">
</div>
<center>https://dev.to/lydiahallie/javascript-visualized-promises-async-await-5gke</center>

<br/>

매크로태스크나 마이크로태스크라는 용어는 자바스크립트 플랫폼에 따라 서로 다르게 표현한다.

| ECMAScript | V8 엔진 | 
|:---:|:---:|:---|
| Message Queue | Macrotask Queue (혹은 Task Queue) |
| PromiseJobs | Microtask Queue |

## 2. What is the Macrotask and Microtask?

매크로태스크와 마이크로태스크가 어떻게 생성되는지 살펴보자.

### 2.1. Macrotask

다음과 같은 함수에 의해 등록된 콜백 함수들이 매크로태스크 큐에 담긴 후 실행된다.

- setTimeout(callback, timeout) 
  - `timeout` 시간이 지난 후 callback 함수가 매크로태스크 큐로 이동한다. 
- setInterval(callback, timeout)
  - `timeout` 시간이 지난 후 callback 함수가 매크로태스크 큐로 이동한다. 
- setImmediate(callback)
  - 즉시 callback 함수가 매크로태스크 큐로 이동한다.
  - 매크로태스크는 다음 틱(tick)에서 바로 실행된다.
  - [Internet Explorer 10][[immediate-link]]에서만 지원한다.

간단하게 setTimeout 함수 사용 예시를 살펴보자.

1. 3개의 함수를 정의한다.
2. 3개의 함수를 bar, foo, baz 순서로 호출한다.

```javascript
const foo = () => console.log("First"); // 1
const bar = () => setTimeout(() => console.log("Second"), 500);
const baz = () => console.log("Third");

bar(); // 2
foo();
baz();
```

위 코드는 다음과 같은 실행 흐름을 갖는다.

1. bar 함수가 실행되면 Second 문자열을 출력하는 콜백 함수가 등록된 타이머가 웹 API에서 실행된다.
2. foo 함수가 실행되면 First 문자열이 즉시 출력된다.
3. baz 함수가 실행되면 Third 문자열이 즉시 출력된다.
4. 타이머에 등록된 시간 이후에 콜백 함수가 매크로태스크 큐로 이동한다.
5. 다음 틱에서 매크로태스크 큐에 담긴 콜백 함수가 실행된다.

<div align="center">
  <img src="/images/posts/2022/microtask-macrotask-in-javascript-02.gif" width="100%" class="image__border">
</div>
<center>https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif</center>

### 2.2. Microtask

마이크로태스크는 Promise, async/await 블록에 의해 생성된다. 각 기능 별로 어떤 부분이 마이크로태스크로 구분되는지 살펴보자.

### 2.2.1. Promise

Promise를 사용할 때 resolve, reject 함수를 사용한다. 

- Promise.resolve 함수를 호출하면 마이크로태스크가 생성된다. 
- callback 함수가 마이크로태스크 큐로 옮겨진다.

```javascript
function callback(value) {
  ...
}

Promise
  .reslove(value)
  .then(callback);
```

- Promise.reject 함수를 호출하면 마이크로태스크가 생성된다.
- callback 함수가 마이크로태스크 큐로 옮겨진다.

```javascript
function fallback(error) {
  ...
}

Promise
  .reject(error)
  .then(fallback);
```

### 2.2.2. async/await block

간단한 예시 코드로 async/await 블록의 구조를 뜯어보자. 다음 코드를 실행하면 아래 보이는 순서대로 로그가 출력된다.

- `Before function!` > `In function!` > `After function!` > `One!`

```javascript
const one = () => Promise.resolve('One!');

async function myFunc () {
  console.log('In function!');
  const result = await one();
  console.log(res);
}

console.log('Before function!');
myFunc();
console.log('After function!');
```

왜 이런 순서로 코드가 실행될까? 코드의 실행 흐름을 살펴보자.

1. "Before function!" 로그가 출력된다.
2. myFunc 함수가 호출된다.
  - "In function!" 로그가 출력된다.
  - one 함수가 호출된다.
  - 결과 값이 `await` 키워드를 만나면 그 이후 동작이 마이크로태스크 큐에 이동된다.
3. "After function!" 로그가 출력된다.
4. 마이크로태스크 큐에 이동된 콜백 함수가 실행된다.

위 코드에서 마이크로태스크 큐에 이동된 코드 부분은 다음과 같다.

- "One!" 문자열은 one 함수의 결과 값이다.
- await 키워드를 통해 Promise 객체에 담긴 값을 얻을 수 있다.

```javascript
  const result = 'One!';
  console.log(res);
```

<div align="center">
  <img src="/images/posts/2022/microtask-macrotask-in-javascript-03.gif" width="100%" class="image__border">
</div>
<center>https://dev.to/lydiahallie/javascript-visualized-promises-async-await-5gke</center>

## 3. Quizzes

위 내용을 이해헀다면 다음 퀴즈들을 풀어보자. 매크로태스크와 마이크로태스크를 절묘하게 섞었다. 언뜻 보면 비슷하지만, 코드 일부분이 다르다. 코드를 읽고 출력되는 로그 순서를 예상해보자. `Show` 버튼을 누르면 정답을 볼 수 있다.

### 3.1. 1st Quiz

{% include codepen.html hash="QWqBOPJ" tab="js,result" title="1st Quiz" %}

### 3.2. 2nd Quiz

{% include codepen.html hash="yLzxyxy" tab="js,result" title="2nd Quiz" %}

### 3.3. 3rd Quiz

{% include codepen.html hash="poWOvQv" tab="js,result" title="3rd Quiz" %}

### 3.4. 4th Quiz

{% include codepen.html hash="YzrOPdL" tab="js,result" title="4th Quiz" %}

### 3.5. 5th Quiz

{% include codepen.html hash="ZEXMYwW" tab="js,result" title="5th Quiz" %}

#### REFERENCE

- <https://dev.to/lydiahallie/javascript-visualized-promises-async-await-5gke>
- <https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif>
- <https://javascript.info/event-loop#macrotasks-and-microtasks>
- <https://meetup.toast.com/posts/89>
- <https://codingsalon.tistory.com/59>

[immediate-link]: https://developer.mozilla.org/en-US/docs/Web/API/Window/setImmediate
[how-to-work-javascript-async-link]: https://junhyunny.github.io/information/javascript/how-to-work-javascript-async/
