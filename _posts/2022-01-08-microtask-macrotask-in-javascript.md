---
title: "Microtask & Macrotask in Javascript"
search: false
category:
  - information
  - javascript
last_modified_at: 2022-01-08T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Asynchronous Task In JavaScript][how-to-work-javascript-async-link]

👉 이어서 읽기를 추천합니다.
- [Recursive setTimeout test with Jest (feat. advanceTimersByTime 열어보기)][recursive-set-timeout-test-link]

## 0. 들어가면서

최근 `setTimeout(callback, timeout)` 함수의 재귀적 호출을 `Jest`의 `advanceTimersByTime` 함수를 이용하여 테스트 시 발생한 문제 상황에 대한 글을 썼습니다. 
글을 처음 작성했을 때는 설명을 정말 잘 써놨다는 생각을 했습니다. 
하지만, 다음날 팀원들에게 작성한 글을 보여주면서 이야기를 나눌땐 느낌이 이상했습니다. 

> '지금 내가 뭘 설명하고 있는거지?'<br/>
> '나도 지금 내가 이야기하고자 하는게 정리가 안된다!'

의논이 잘 되지 않는 이유는 저한테 있었는데, 이야기를 하면서도 스스로 마이크로태스크(microtask)와 매크로태스크(macrotask)에 대한 이해도가 엄청 낮다라는 걸 깨달았습니다. 
오늘은 알고 있었다고 생각했지만, 잘 몰랐던 마이크로태스크와 매크로태스크에 대한 정리하였습니다. 

## 1. 매크로태스크(Macrotask)와 마이크로태스크(Microtask)

[Asynchronous Task In JavaScript][how-to-work-javascript-async-link] 포스트에서 설명했듯이 `Web API` 기능이 종료되면 콜백(callback) 함수가 콜백 큐(callback queue)에 순서대로 담깁니다. 
이 때 콜백 함수가 담기는 큐는 두 가지 종류가 있습니다. 
- 매크로태스크 큐 (macrotask queue) - 우선순위가 높습니다.
- 마이크로태스크 큐 (microtask queue) - 우선순위가 낮습니다.

매크로태스크와 마이크로태스크는 우선순위가 다르기 때문에 실행되는 순서도 다릅니다. 
당연히 우선순위가 높은 마이크로태스크가 먼저 수행되고, 다음으로 매크로태스크가 수행됩니다. 
이벤트 루프(event loop)는 마이크로태스크 큐에 담긴 모든 마이크로태스크를 처리한 후에 매크로태스크를 소비합니다.

##### 매크로태스크와 마이크로태스크 실행 순서

<p align="center">
    <img src="/images/microtask-macrotask-in-javascript-1.gif" width="100%" class="image__border">
</p>
<center>https://dev.to/lydiahallie/javascript-visualized-promises-async-await-5gke</center>

##### 용어 정리
`ECMAScript` 진영은 다른 용어를 사용하는데, 간략한 표로 정리하겠습니다.

| ECAM | V8 엔진 | 
|:---:|:---:|:---|
| Message Queue | Macrotask Queue (혹은 Task Queue) |
| PromiseJobs | Microtask Queue |

## 2. 매크로태스크와 마이크로태스크 생성

매크로태스크와 마이크로태스크 대상은 어느 영역인지, 언제 매크로태스크와 마이크로태스크가 생성되는지 알아보겠습니다. 

### 2.1. 매크로태스크 생성

매크로태스크는 다음과 같은 함수를 실행할 때 생성됩니다. 
- setTimeout(callback, timeout) 
    - 매크로태스크 대상은 callback 함수입니다.
    - `timeout` 시간이 지난 후 callback 함수가 큐로 이동합니다. 
    - 한 번만 실행합니다.
- setInterval(callback, timeout)
    - 매크로태스크 대상은 callback 함수입니다.
    - `timeout` 시간이 지난 후 callback 함수가 큐로 이동합니다. 
    - 지속적으로 실행합니다.
- setImmediate(callback)
    - 매크로태스크 대상은 callback 함수입니다.
    - Internet Explorer 10 버전에서만 지원 ([Window.setImmediate()][immediate-link])
- requestAnimationFrame(callback)
    - 매크로태스크 대상은 callback 함수입니다.

##### 예시 코드 - setTimeout(callback, timeout)

```javascript
const foo = () => console.log("First");
const bar = () => setTimeout(() => console.log("Second"), 500);
const baz = () => console.log("Third");

bar();
foo();
baz();
```

##### 코드 동작 과정
- 이미지에서 보이는 큐가 매크로태스크 큐입니다.

<p align="center">
    <img src="/images/microtask-macrotask-in-javascript-2.gif" width="100%" class="image__border">
</p>
<center>https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif</center>

### 2.2. 마이크로태스크 생성

제가 이해도가 많이 떨어졌던 부분입니다. 
특히 `async / await`를 사용하면 어느 시점에 어느 부분이 마이크로태스크가 되는지 이해도가 많이 부족했습니다. 
조금 자세히 다뤄보겠습니다.

### 1.2.1. Promise

`Promise`를 사용할 때 마이크로태스크는 다음과 같은 함수를 실행할 때 생성됩니다. 
- Promise.reslove(value).then((value) => { ... });
    - `reslove(value)` 함수 호출 시 마이크로태스크가 생성되어 큐에 추가됩니다.
    - 마이크로태스크 대상은 `(value) => { ... }` 함수입니다.
- Promise.reject(error).catch((error) => { ... });
    - `reject(error)` 함수 호출 시 마이크로태스크가 생성되어 큐에 추가됩니다.
    - 마이크로태스크 대상은 `(error) => { ... }` 함수입니다.

### 1.2.2. async / await

`async / await`는 간단한 예제 코드와 동작 과정을 통해 확인해보겠습니다. 

##### 예시 코드
- 다음과 같은 코드를 실행하면 다음과 같은 로그가 순서대로 출력됩니다.
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

##### 예시 코드 동작 과정
- `aync` 키워드가 붙은 함수도 호출하면 일단 실행이 됩니다.
- `await` 키워드를 만나면 마이크로태스크가 생성됩니다.
- 이때, 주의할 사항으로 `await` 키워드 뒤에 오는 함수는 실행되고, 결과가 반환되는 시점에 마이크로태스크가 생성됩니다.
- `await` 키워드 하위 코드가 모두 마이크로태스크 대상입니다.
- 예시 코드의 마이크로태스크 대상 영역

```javascript
    const result = 'One!';
    console.log(res);
```

<p align="center">
    <img src="/images/microtask-macrotask-in-javascript-3.gif" width="100%" class="image__border">
</p>
<center>https://dev.to/lydiahallie/javascript-visualized-promises-async-await-5gke</center>

## 3. 태스크 실행 순서 맞추기

모든 내용을 이해했다면 아래 코드를 통해 동작 순서를 예상해보겠습니다. 
아래 코드팬(codepen)을 통해 자신이 생각한 동작 과정과 일치하는지 확인해보시길 바랍니다. 
정답은 `Rerun` 버튼을 누른 후 3초 뒤에 출력됩니다.

### 3.1. 1번 문제

{% include codepen.html hash="QWqBOPJ" tab="js,result" title="Test" %}

### 3.2. 2번 문제

{% include codepen.html hash="yLzxyxy" tab="js,result" title="Test" %}

### 3.3. 3번 문제

{% include codepen.html hash="poWOvQv" tab="js,result" title="Test" %}

### 3.4. 4번 문제

{% include codepen.html hash="YzrOPdL" tab="js,result" title="Test" %}

### 3.5. 5번 문제

{% include codepen.html hash="ZEXMYwW" tab="js,result" title="Test" %}

#### REFERENCE
- <https://dev.to/lydiahallie/javascript-visualized-promises-async-await-5gke>
- <https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif>
- <https://javascript.info/event-loop#macrotasks-and-microtasks>
- <https://meetup.toast.com/posts/89>
- <https://codingsalon.tistory.com/59>

[immediate-link]: https://developer.mozilla.org/en-US/docs/Web/API/Window/setImmediate

[how-to-work-javascript-async-link]: https://junhyunny.github.io/information/javascript/how-to-work-javascript-async/

[recursive-set-timeout-test-link]: https://junhyunny.github.io/react/jest/exception/recursive-set-timeout-test/