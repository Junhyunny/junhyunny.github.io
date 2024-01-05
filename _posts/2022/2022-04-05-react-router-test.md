---
title: "React Router Test"
search: false
category:
  - javascript
  - react
  - jest
last_modified_at: 2022-04-05T23:55:00
---

<br/>

## 0. 들어가면서

화면이 정상적으로 바뀌었는지 확인할 수 있는 테스트 방법을 몇 가지 정리해보았습니다. 
상황에 맞고, 팀원들 혹은 페어(pair)가 동의하는 방법으로 테스트를 작성하면 좋을 것 같습니다. 
테스트 코드를 읽고 이해하는데 도움을 주는 구현체 코드를 우선 확인해보겠습니다. 

##### 실제 구현 코드
- `React Router V6`를 사용하였습니다.
- 간단하게 버튼을 눌러 다음 화면으로 넘어가는 기능이 존재합니다.

```jsx
import './App.css'

import { useNavigate } from 'react-router-dom'

function App() {
    const navigate = useNavigate()

    const routeHandler = () => {
        navigate('/first')
    }

    return (
        <div>
            <button onClick={routeHandler}>submit</button>
        </div>
    )
}

export default App
```

## 1. 개발된 화면 컴포넌트 사용

이미 개발된 화면이 있다면 이를 사용합니다. 
개발된 화면을 특정 지을 수 있는 문구가 화면에 존재하는지 확인합니다. 

다음과 같은 특징이 있습니다. 
- 테스트를 위한 `MemoryRouter`가 필요합니다.
    - 에러 발생 - `Error: useNavigate() may be used only in the context of a <Router> component.`
- `FirstPage` 화면 컴포넌트에 문구가 변경된다면 해당 테스트가 깨집니다.
- 실제 구현된 화면 컴포넌트가 없다면 테스트가 불가능합니다. 

##### 테스트 코드

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MemoryRouter, Route, Routes } from 'react-router-dom'
import App from './App'
import FirstPage from './FirstPage'

it('route FirstPage', () => {
    render(
        <MemoryRouter>
            <Routes>
                <Route path={'/'} element={<App />}></Route>
                <Route path={'/first'} element={<FirstPage />}></Route>
            </Routes>
        </MemoryRouter>
    )

    userEvent.click(screen.getByText('submit'))

    expect(screen.getByText('This is First Page')).toBeInTheDocument()
})
```

## 2. 화면 컴포넌트 스텁 사용

개발된 화면이 없다면 테스트를 위한 화면 컴포넌트를 스터빙(stubbing)합니다. 

다음과 같은 특징이 있습니다.
- 테스트를 위한 `MemoryRouter`가 필요합니다.
    - 에러 발생 - `Error: useNavigate() may be used only in the context of a <Router> component.`
- 아직 개발되지 않은 화면 컴포넌트 테스트에 유용합니다.

##### 테스트 코드

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MemoryRouter, Route, Routes } from 'react-router-dom'
import App from './App'

it('route FirstPage - 2', () => {
    const StubPage = jest.fn().mockImplementation(() => <div>This is stubbing page</div>)
    render(
        <MemoryRouter>
            <Routes>
                <Route path={'/'} element={<App />} />
                <Route path={'/first'} element={<StubPage />} />
            </Routes>
        </MemoryRouter>
    )

    userEvent.click(screen.getByText('submit'))

    expect(screen.getByText('This is stubbing page')).toBeInTheDocument()
})
```

## 3. navigate 스파이 사용

`react-router-dom` 모듈의 기능을 재정의합니다. 
다른 기능들은 모두 실제 기능을 사용하고, `useNavigate` 훅(hook)만 재정의합니다. 
- `useNavigate` 훅을 통해 반환되는 `navigate` 함수를 `jest`가 만들어준 스파이로 변경합니다. 
- 화면 전환 이벤트가 발생했을 때 적절한 횟수, 경로로 `navigate` 스파이를 호출했는지 확인합니다.

다음과 같은 특징이 있습니다.
- `useNavigate` 훅을 오버라이딩하였기 때문에 `MemoryRouter`가 불필요합니다.
- 아직 개발되지 않은 화면 컴포넌트 테스트에 유용합니다.

##### 테스트 코드

```jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import App from './App'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}))

it('route FirstPage - 3', () => {
    render(<App />)

    userEvent.click(screen.getByText('submit'))

    expect(mockNavigate).toHaveBeenNthCalledWith(1, '/first')
})
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-04-05-react-router-test>