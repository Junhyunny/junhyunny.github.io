---
title: "waitFor() 함수와 UserEvent type() 함수 사용 주의사항"
search: false
category:
  - react
  - jest
  - test-driven-development
last_modified_at: 2026-09-17T22:45:54+09:00
---

<br/>

## 1. 문제 현상

실제 구현된 기능은 정상적으로 동작하지만, 테스트 코드가 실패하는 문제가 있었다. 문제가 발생한 원인을 조사해봤다. 문제 현상을 살펴보기 전에 우선 테스트 시나리오를 살펴보자.

1. API 요청을 통해 서버로부터 필요한 데이터를 가져온다.
2. 필요한 데이터만 필터링하기 위해 입력 창에 검색 키워드를 입력한다.
3. 필터링된 데이터만 화면에 보인다.

문제가 발생한 테스트 코드를 살펴보자. 코드를 하나씩 뜯어서 살펴보면 테스트 코드에 별다른 문제는 없어 보인다.

1. `axios` 모듈의 `get` 함수 응답을 스터빙(stubbing)한다.
2. 화면을 렌더링한다.
3. 스터빙한 데이터가 화면에 보이길 기다린다.
4. 텍스트 박스에 'hello' 문자열을 입력한다.
5. 원하는 문자열만 화면에 보인다.

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

구현 코드는 아래와 같다.

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

테스트 코드를 실행할 때 출력되는 에러 로그를 통해 텍스트 박스에 입력 문장의 맨 마지막 문자만 할당됨을 확인하였다. 현상의 원인을 확인하기 위해 많은 시간을 들였지만, 뚜렷한 이유를 찾지는 못했다. 에러 로그를 보면 텍스트 박스의 `value` 값에 "o"만 할당되어 있다.

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
    ...
```

디버깅을 위해 로그를 출력해보았다.

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

테스트 로그와 서비스 동작 로그의 차이점을 보고 문제 원인을 재정의할 수 있었다. 테스트를 실행하면 다음과 같은 로그를 볼 수 있다.

- 타이핑 이벤트에 한 글자씩 값이 들어온다.
- 내부에서 상태가 변경되었음에도 리-렌더링이 발생하지 않는다.

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

실제 구현체를 브라우저에서 실행하면 다음과 같은 로그를 볼 수 있다.

- 타이핑 이벤트가 있을 때마다 리-렌더링이 발생한다.
- 타이핑 이벤트 값을 보면 이전에 입력한 값 뒤에 새로운 값이 추가되어 입력됨을 알 수 있다.

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

위 로그를 바탕으로 테스트가 실패한 원인을 다음과 같이 정의했다.

- 테스트 코드에선 타이핑할 때마다 상태가 변경되었음에도 리-렌더링이 동작하지 않았다.
- 리-렌더링이 되지 않았기 때문에 텍스트 박스 `value` 속성에 타이핑한 값이 제대로 할당되지 않았다.
- 이전에 입력된 문장에 현재 입력한 문자가 추가(append)되지 않아서 맨 마지막 문자만 텍스트 박스에 할당되었다.

## 2. 문제 원인

타이핑 이벤트가 발생할 때 리-렌더링이 되지 않은 것이 문제였다. 어떤 코드가 이런 현상을 일으키는지 디버깅해보았다. 결과만 보면 `waitFor` 함수의 콜백 함수 내에서 타이핑 이벤트를 수행하였기 때문에 문제가 발생했다.

디버깅 모드로 콜 스택을 살펴보면 `waitFor` 함수와 `userEvent.type` 함수 내부에서 모두 react-dom.development.js 모듈의 `batchedUpdates` 함수를 호출한다. `batchedUpdates` 함수 내부 `try-finally` 구문의 `finally` 블록에서 리-렌더링을 수행하기 위한 함수를 호출하는데, 현재 실행 중인 컨텍스트가 `NoContext`여야 리-렌더링을 수행한다.

- `executionContext`는 `react-dom.development` 모듈의 전역 변수이다.
- 임시 변수에 담아 두었던 `executionContext`가 `NoContext`여야 리-렌더링을 수행한다.

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

디버그 모드를 통해 콜 스택을 살펴봤다. 다음과 같은 이유로 리-렌더링이 1회만 수행된다.

1. `waitFor` 콜 스택에서 `batchedUpdates` 함수를 호출한다.
  - 이 시점에 `react-dom.development` 모듈의 `executionContext` 값이 `BatchedContext` 상태로 변경된다.
2. `userEvent.type` 콜 스택에서 `batchedUpdates` 함수를 호출한다.
  - 이 시점에 `react-dom.development` 모듈의 `executionContext` 값은 이미 `BatchedContext` 상태이다.
  - 자신이 수행할 콜백 함수를 실행한 후 `finally` 블록에서 `executionContext === NoContext` 조건을 만족하지 못한다.
  - 타이핑 이벤트에 대한 리-렌더링 작업이 수행되지 않는다.
3. 타이핑이 모두 완료된 후 `waitFor` 콜 스택 `batchedUpdates` 함수의 `finally` 블록에서 `executionContext === NoContext` 조건이 만족된다.

<div align="left">
  <img src="{{ site.image_url_2022 }}/warn-using-user-event-type-in-wait-for-01.png" width="80%" class="image__border">
</div>

## 3. 해결 방법

문제의 원인을 알게 된 후 몇 가지 해결 방법이 떠올랐다.

### 3.1. 렌더링 대기하기

애초에 타이핑 이벤트를 waitFor 함수로 묶은 이유는 API 응답이 완료된 이후에 필터링이 필요하기 때문이다. `axios` 모듈에 스터빙(stubbing)한 데이터가 화면에 렌더링되었는지 확인 후 타이핑 이벤트를 처리하면 문제가 해결된다. 이 방법은 문제를 해결할 수는 있지만, 중간에 `expect` 함수를 호출하기 때문에 의미가 모호해진다. 테스트 코드를 통해 확인하고 싶은 내용은 `"사용자가 입력한 값으로 필터링된 데이터만 화면에 출력되는가?"`임에도 중간에 확인하는 로직이 필요하다.

1. `axios` 모듈에 스터빙한 값이 화면에 보이는지 확인한다.
2. 타이핑 이벤트를 처리한다.
3. 필터링된 값만 보이는지 확인한다.

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

`find-` 구문으로 시작하는 함수를 사용하면 비동기적인 동작이 끝나기를 기다린다.

- `findByPlaceholderText` 함수를 사용한다. await 키워드가 한 번 존재하기 때문에 검증을 다음 틱으로 넘길 수 있다.
- 다음 틱에서 타이핑을 수행하기 때문에 API 요청이 끝나고 데이터가 화면에 그려진 이후에 필터링이 가능하다.

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

최초 에러가 발생한 테스트와 새로 만든 두 개 테스트의 실행 결과이다.

<div align="left">
  <img src="{{ site.image_url_2022 }}/warn-using-user-event-type-in-wait-for-02.png" width="80%" class="image__border">
</div>

## CLOSING

리-렌더링을 유발하는 이벤트를 `waitFor` 함수 내부에서 수행할 경우 예상하지 못한 결과를 얻을 수 있다. 디버깅을 하면서 몇 가지 새로운 개념을 배울 수 있었기에 유익한 삽질이었다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-03-19-warn-using-user-event-type-in-wait-for>