---
title: "Jest userEvent.type 사용 시 주의사항 in waitFor"
search: false
category:
  - react
  - jest
  - test-driven-development
last_modified_at: 2022-03-19T23:55:00
---

<br/>

## 1. 문제 현상

실제 구현된 기능은 정상적으로 동작하지만, 테스트 코드가 실패하는 것이 문제였습니다. 
문제가 발생한 원인을 탐색해보았습니다. 

### 1.1. 테스트 시나리오

문제 현상을 살펴보기 전에 우선 테스트 시나리오를 살펴보겠습니다. 
다음과 같은 시나리오로 테스트 코드를 작성하였습니다. 
- useEffect 훅을 통해 화면 렌더링 시 필요한 데이터를 가져옵니다.
- 받은 데이터를 이용해 상태(state)를 변경하면 화면이 리-렌더링됩니다.
- 사용자 타이핑 이벤트를 통해 검색 문자열을 입력받습니다.
- 리-렌더링 된 화면에서 사용자가 타이핑한 문자열을 포함하는 데이터만 화면에 보여집니다. 

### 1.2. 문제 발생 코드

#### 1.2.1. 테스트 코드

```jsx
import axios from 'axios'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'
import userEvent from '@testing-library/user-event'

describe('App', () => {
    it('renders filtered items', async () => {
        jest.spyOn(axios, 'get').mockResolvedValue({
            data: [
                { id: 1, name: 'hello' },
                { id: 2, name: 'hello world' },
                { id: 3, name: "junhyunny's devlog" },
            ],
        })
        render(<App />)

        await waitFor(() => {
            userEvent.type(screen.getByPlaceholderText('search'), 'hello')
        })

        await waitFor(() => {
            expect(screen.getByText('hello')).toBeInTheDocument()
            expect(screen.getByText('hello world')).toBeInTheDocument()
            expect(screen.queryByText("junhyunny's devlog")).not.toBeInTheDocument()
        })
    })
})
```

#### 1.2.2. 구현 코드

```jsx
import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
    const [items, setItems] = useState([])
    const [searchKey, setSearchKey] = useState('')

    useEffect(() => {
        axios.get('/api/items').then(({ data }) => {
            setItems(data)
        })
    }, [])

    const searchKeyHandler = ({ target: { value } }) => {
        setSearchKey(value)
    }

    return (
        <div>
            <div>
                <input type="text" placeholder="search" value={searchKey} onChange={searchKeyHandler} />
            </div>
            {items
                .filter((item) => !searchKey || item.name.includes(searchKey))
                .map((item) => (
                    <div key={item.id}>{item.name}</div>
                ))}
        </div>
    )
}

export default App
```

### 1.3. 최초 발견된 문제

제 논리로 보면 테스트 코드에 문제는 없어 보였습니다. 
1. `axios` 모듈의 `get` 함수 응답을 스터빙(stubbing)한다.
1. 화면을 렌더링한다.
1. 스터빙한 데이터가 화면에 보여지길 기다린다.
1. 텍스트 박스에 'hello' 문자열을 입력한다.
1. 내가 원하는 문자열만 화면에 보여진다.

테스트 코드를 동작 시 출력되는 에러 로그를 통해 텍스트 박스에 입력 문장의 맨 마지믹 문자만 할당됨을 확인하였습니다. 
현상의 원인을 확인하기 위해 많은 시간을 소요했지만, 뚜렷한 이유를 찾지는 못 했습니다. 

##### 에러 로그
- 텍스트 박스에 `value` 값을 보면 "o"만 할당되어 있습니다.

```
Error: expect(element).not.toBeInTheDocument()

expected document not to contain element, found <div>junhyunny's devlog</div> instead

Ignored nodes: comments, <script />, <style />
<html>
  <head />
  <body>
    <div>
      <div>
        <div>
          <input
            placeholder="search"
            type="text"
            value="o"
          />
        </div>
        <div>
          hello
        </div>
        <div>
          hello world
        </div>
        <div>
          junhyunny's devlog
        </div>
      </div>
    </div>
  </body>
</html>

    at /Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-19-warn-using-user-event-type-in-wait-for/action-in-blog-front/src/App.test.jsx:24:66
    at runWithExpensiveErrorDiagnosticsDisabled (/Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-19-warn-using-user-event-type-in-wait-for/action-in-blog-front/node_modules/@testing-library/dom/dist/config.js:50:12)
    at checkCallback (/Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-19-warn-using-user-event-type-in-wait-for/action-in-blog-front/node_modules/@testing-library/dom/dist/wait-for.js:141:77)
    at checkRealTimersCallback (/Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-19-warn-using-user-event-type-in-wait-for/action-in-blog-front/node_modules/@testing-library/dom/dist/wait-for.js:133:16)
    at Timeout.task [as _onTimeout] (/Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-19-warn-using-user-event-type-in-wait-for/action-in-blog-front/node_modules/jsdom/lib/jsdom/browser/Window.js:516:19)
    at listOnTimeout (node:internal/timers:557:17)
    at processTimers (node:internal/timers:500:7)
```

### 1.4. 문제 원인 재정의

코드를 변경해봐도 테스트가 통과되지 않아 로그를 출력해보았습니다. 
테스트 로그와 서비스 동작 로그의 차이점을 보고 문제 원인을 재정의할 수 있었습니다. 
테스트가 실패한 원인은 다음과 같습니다. 
- 테스트 코드에선 타이핑할 때마다 상태가 변경되었음에도 리-렌더링이 동작하지 않았습니다.
- 리-렌더링이 되지 않았기 때문에 텍스트 박스 `value` 속성에 타입핑하는 값들이 제대로 할당되지 않았습니다.
- 이전에 입력된 문장에 현재 입력한 문자가 추가(append)되지 않아서 맨 마지막 문자만 텍스트 박스에 할당되었습니다. 

##### 콘솔 로그 추가

```jsx
function App() {
    
    // ...

    const searchKeyHandler = ({ target: { value } }) => {
        console.log(`======== value: ${value}`)
        setSearchKey(value)
    }

    console.log('======== rendering')

    return (
        // ...
    )
}

export default App
```

##### 테스트 로그
- 타이핑 이벤트에 한 글자씩 값이 들어옵니다.
- 내부에서 상태가 변경되었음에도 리-렌더링이 발생하지 않습니다.

```
  console.log
    ======== rendering

      at App (src/App.jsx:19:13)

  console.log
    ======== value: h

      at searchKeyHandler (src/App.jsx:15:17)

  console.log
    ======== value: e

      at searchKeyHandler (src/App.jsx:15:17)

  console.log
    ======== value: l

      at searchKeyHandler (src/App.jsx:15:17)

  console.log
    ======== value: l

      at searchKeyHandler (src/App.jsx:15:17)

  console.log
    ======== value: o

      at searchKeyHandler (src/App.jsx:15:17)

  console.log
    ======== rendering

      at App (src/App.jsx:19:13)

  console.log
    ======== rendering

      at App (src/App.jsx:19:13)
```

##### 서비스 동작 로그
- 타이핑 이벤트가 있을 때마다 리-렌더링이 발생합니다.
- 타이핑 이벤트 값을 보면 이전에 입력한 값들 뒤에 새로운 값이 추가되어 입력됨을 알 수 있습니다.

```
======== rendering App.jsx:23:12
======== value: h App.jsx:19:16
======== rendering App.jsx:23:12
======== value: he App.jsx:19:16
======== rendering App.jsx:23:12
======== value: hel App.jsx:19:16
======== rendering App.jsx:23:12
======== value: hell App.jsx:19:16
======== rendering App.jsx:23:12
======== value: hello App.jsx:19:16
======== rendering App.jsx:23:12
======== value: hellor App.jsx:19:16
======== rendering App.jsx:23:12
```

## 2. 문제 원인

문제는 타이핑 이벤트에서 리-렌더링이 되지 않았기 때문입니다. 
어떤 코드가 이런 현상을 일으키는지 디버깅해보았습니다. 
결과만 보면 `waitFor` 함수의 콜백 함수 내에서 타이핑 이벤트를 수행하였기 때문에 문제가 발생했습니다. 

디버깅 모드로 콜 스택을 살펴보면 `waitFor` 함수와 `userEvent.type` 함수 내부에서 모두 `batchedUpdates` 함수를 호출합니다. 
`batchedUpdates` 함수 내부 `try-finally` 구문의 `finally` 블럭에서 리-렌더링을 수행하기 위한 함수를 호출하는데, 현재 실행 중인 컨텍스트가 `NoContext` 이어야 리-렌더링을 수행합니다. 
함수 내부와 콜 스택을 살펴보겠습니다.

##### react-dom.development.js 파일 batchedUpdates 함수
- `executionContext`는 `react-dom.development` 모듈의 전역 변수입니다.
- 임시 변수에 담아 두었던 `executionContext`가 `NoContext` 이어야 리-렌더링을 수행합니다.

```js
var executionContext = NoContext; // The root we're working on

function batchedUpdates$1(fn, a) {
  var prevExecutionContext = executionContext;
  executionContext |= BatchedContext;

  try {
    return fn(a);
  } finally {
    executionContext = prevExecutionContext;

    if (executionContext === NoContext) {
      // Flush the immediate callbacks that were scheduled during this batch
      resetRenderTimer();
      flushSyncCallbackQueue(); // 이 함수 내부에서 리-렌더링이 수행됩니다.
    }
  }
}
```

##### 디버깅 콜 스택
- `waitFor` 콜 스택에서 `batchedUpdates` 함수를 호출합니다.
    - 이 시점에 `react-dom.development` 모듈의 `executionContext` 값이 `BatchedContext` 상태로 변경됩니다.
- `userEvent.type` 콜 스택에서 `batchedUpdates` 함수를 호출합니다.
    - 이 시점에 `react-dom.development` 모듈의 `executionContext` 값은 이미 `BatchedContext` 상태입니다.
    - 자신이 수행할 콜 백 함수를 실행한 후 `finally` 블럭에서 `executionContext === NoContext` 조건을 만족하지 못 합니다.
    - 타이핑 이벤트에 대한 리-렌더링 작업들이 수행되지 않습니다.
- `waitFor` 콜 스택 `batchedUpdates` 함수의 `finally` 블럭에서 `executionContext === NoContext` 조건이 만족됩니다.
- 리-렌더링을 1회 수행합니다.

<p align="left">
    <img src="/images/warn-using-user-event-type-in-wait-for-1.JPG" width="50%" class="image__border">
</p>

## 3. 해결 방법

문제의 원인을 알고나니 해결할 방법이 바로 떠올랐습니다.

### 3.1. 렌더링 대기하기

`axios` 모듈에 스터빙한 데이터가 화면에 렌더링 되었는지 확인 후 타이핑 이벤트를 처리합니다. 
이 방법은 문제를 해결할 수는 있지만, 저는 좋지 않은 방법이라고 생각하였습니다. 
테스트 코드를 통해 확인하고 싶은 내용은 `"사용자가 입력한 값으로 필터링 된 데이터만 화면에 출력되는가?"`인데, 
중간에 `expect` 함수를 호출하기 때문에 의미가 모호해집니다.

##### 테스트 코드
- `axios` 모듈에 스터빙한 값이 화면에 보이는지 확인합니다.
- 타이핑 이벤트를 처리합니다.
- 필터링 된 값들만 보이는지 확인합니다. 
- `expect` 구문이 두 개가 되면서 `setup > act > verfiy` 구분이 모호해집니다.

```jsx
    it('renders filtered items - expect two times', async () => {
        jest.spyOn(axios, 'get').mockResolvedValue({
            data: [
                { id: 1, name: 'hello' },
                { id: 2, name: 'hello world' },
                { id: 3, name: "junhyunny's devlog" },
            ],
        })
        render(<App />)

        await waitFor(() => {
            expect(screen.getByText('hello')).toBeInTheDocument()
        })
        expect(screen.getByText('hello world')).toBeInTheDocument()
        expect(screen.getByText("junhyunny's devlog")).toBeInTheDocument()

        userEvent.type(screen.getByPlaceholderText('search'), 'hello')

        await waitFor(() => {
            expect(screen.getByText('hello')).toBeInTheDocument()
        })
        expect(screen.getByText('hello world')).toBeInTheDocument()
        expect(screen.queryByText("junhyunny's devlog")).not.toBeInTheDocument()
    })
```

### 3.2. find- 쿼리 함수 사용

제가 생각하는 BP(best practice)입니다. 
`find-` 구문으로 시작하는 함수를 사용하면 비동기 적인 동작을 대기합니다. 

##### 테스트 코드
- `findByPlaceholderText` 함수를 사용합니다.
    - 원하는 엘리먼트(element)을 찾을 때까지 대기합니다.
- `expect` 구문이 한 개이므로 `setup > act > verfiy` 구분이 명확해집니다.

```jsx
    it('renders filtered items - using findByPlaceholderText function', async () => {
        jest.spyOn(axios, 'get').mockResolvedValue({
            data: [
                { id: 1, name: 'hello' },
                { id: 2, name: 'hello world' },
                { id: 3, name: "junhyunny's devlog" },
            ],
        })
        render(<App />)

        userEvent.type(await screen.findByPlaceholderText('search'), 'hello')

        await waitFor(() => {
            expect(screen.getByText('hello')).toBeInTheDocument()
        })
        expect(screen.getByText('hello world')).toBeInTheDocument()
        expect(screen.queryByText("junhyunny's devlog")).not.toBeInTheDocument()
    })
```

### 3.3. 테스트 결과
- 최초 에러가 발생한 테스트와 새로 만든 두 개의 테스트의 실행 결과입니다.

<p align="left">
    <img src="/images/warn-using-user-event-type-in-wait-for-2.JPG" width="45%" class="image__border">
</p>

## CLOSING

리-렌더링을 유발하는 이벤트를 `waitFor` 함수 내부에서 수행할 경우 예상하지 못한 결과를 얻을 것 같습니다. 
디버깅을 하면서 몇 가지 새로운 개념에 대해 배울 수 있었기에 유익한 삽질이었다고 생각됩니다.

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-03-19-warn-using-user-event-type-in-wait-for>