---
title: "useEffect 훅(hook) 클린-업 함수 테스트"
search: false
category:
  - javascript
  - react
  - jest
last_modified_at: 2022-03-27T23:55:00
---

<br/>

## 0. 들어가면서

문득 리액트의 `useEffect` 훅(hook)을 사용할 때 이벤트 정리 등을 위한 클린-업(clean-up) 함수를 테스트하는 방법이 있는지 궁금했습니다. 
간단하게 `useEffect` 훅과 클린-업 함수에 대해 알아보고, 테스트 방법에 대해 정리해보았습니다. 

## 1. useEffect Hook

> React docs - Using the Effect Hook<br/>
> Effect Hook을 사용하면 함수 컴포넌트에서 side effect를 수행할 수 있습니다.

여기서 말하는 사이드 이펙트(side effect)는 부수적인 효과를 의미합니다. 
다음과 같은 기능들을 의미하며, 이런 기능들을 `useEffect` 내에서 처리합니다.
- API 요청을 통한 데이터 가져오기
- 구독(subscription) 설정하기
- 수동으로 React 컴포넌트 DOM 수정하기

클래스 기반 리액트에 익숙한 프론트 엔드 개발자분들은 기존 라이프 사이클 메소드를 잘 알고 계실 것 입니다. 
저의 경우 함수형 리액트를 먼저 접했기 때문에 기존 라이프 사이클 메소드와 연관 관계를 정리해보았습니다. 

##### 리액트 컴포넌트 라이프 사이클

<p align="center">
    <img src="/images/how-to-test-clean-up-1.JPG" width="90%" class="image__border">
</p>
<center>https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/</center>

### 1.1. componentDidMount 메소드

`componentDidMount` 메소드는 컴포넌트를 처음 렌더링한 후에 실행됩니다. 
최초로 렌더링되는 시점에만 단 한번 실행됩니다. 
`useEffect` 함수를 사용하면 다음과 같이 구현할 수 있습니다. 

##### componentDidMount 메소드 useEffect 훅으로 구현
- 두번째 파라미터로 빈 배열을 전달합니다. 

```jsx
    useEffect(() => {
        console.log('componentDidMount')
    }, [])
```

### 1.2. componentDidUpdate 메소드

위의 [리액트 컴포넌트 라이프 사이클](#리액트-컴포넌트-라이프-사이클) 이미지를 보면 업데이트는 다음과 같은 상황에 발생합니다. 
- `props`가 바뀌는 시점
- `state`가 바뀌는 시점
- 부모 컴포넌트가 리-렌더링되는 시점
- `forceUpdate` 함수를 통해 강제로 렌더링되는 시점

컴포넌트를 최초로 렌더링한 후에 위에서 언급한 상황들이 발생하면 실행됩니다. 
`useEffect` 함수를 사용하면 다음과 같이 구현할 수 있습니다.

##### componentDidUpdate 메소드 useEffect 훅으로 구현
- 두번째 파라미터로 아무 값도 전달하지 않습니다.
- 위에서 언급한 상황이 발생하면 `useEffect` 훅에 전달한 콜백(callback) 함수가 실행됩니다. 

```jsx
    useEffect(() => {
        console.log('componentDidUpdate')
    })
```

### 1.3. componentWillUnmount 메소드

리액트 컴포넌트가 `DOM`에서 제거될 때 실행됩니다. 
`componentDidMount` 메소드에서 등록한 이벤트가 있다면 여기서 제거하는 작업을 수행해야합니다. 
`useEffect` 함수를 사용하면 다음과 같이 구현할 수 있습니다.

##### componentWillUnmount 메소드 useEffect 훅으로 구현
- `useEffect` 훅에 전달한 콜백 함수가 반환하는 함수가 `componentWillUnmount` 메소드로 동작합니다.

```jsx
    useEffect(() => {
        console.log('componentDidMount')
        return function componentWillUnmount() {
            console.log('componentWillUnmount')
        }
    }, [])
```

## 2. useEffect 클린-업 함수

`useEffect` 훅의 콜백 함수가 반환한 `componentWillUnmount` 함수가 `useEffect` 훅의 클린-업 함수입니다. 
반환하는 함수의 이름은 중요하지 않기 때문에 `화살표 함수(() => {})`를 반환해도 상관 없습니다. 
일반적으로 다음 기능들은 클린-업 기능이 필요하지 않습니다. 
- API 요청을 통한 데이터 가져오기
- 수동으로 React 컴포넌트 DOM 조작하기
- 로깅(logging)

반면, 이벤트를 등록한 경우에는 메모리 누수가 발생하지 않도록 이를 정리하는 것이 중요합니다. 
`useEffect` 클린-업 함수에 등록한 이벤트를 해제하기 위한 작업을 작성해줍니다.

### 2.1. useEffect 클린-업 함수 실행 순서

`useEffect` 훅의 두번째 파라미터로 빈 배열이 들어갔기 때문에 리액트 컴포넌트가 제거되는 시점에 클린-업 함수가 실행됩니다. 
명확하게 `componentWillUnmount` 메소드가 호출되는 동일한 시점에 클린-업 함수가 실행됩니다. 

반면에 `useEffect` 훅의 두번째 파라미터에 아무 값도 넣어주지 않으면 다음과 같은 순서로 실행됩니다. 
1. props/state 업데이트 
1. 컴포넌트 리-렌더링
1. **이전 이펙트의 클린-업 함수**
1. 새로운 이펙트 실행 

##### 예시 코드

```jsx
function App() {

    const [count, setCount] = useState(0)

    useEffect(() => {
        console.log('componentDidUpdate count: ' + count)
        return function cleanup() {
            console.log('cleanup count: ' + count)
        }
    })

    const increaseCount = () => {
        setCount(count + 1)
    }

    return (
        <div>
            <p>You clicked {count} times</p>
            {count % 2 === 1 && <CustomButton increaseCount={increaseCount}/>}
            {count % 2 === 0 &&
                <button onClick={increaseCount}>
                    Click me
                </button>
            }
        </div>
    );
}
```

##### 동작 콘솔 로그

<p align="left">
    <img src="/images/how-to-test-clean-up-2.gif" width="45%" class="image__border">
</p>

## 3. useEffect 클린-업 함수 테스트

`useEffect` 훅의 클린-업 함수를 테스트하는 방법을 소개하려고 했지만, 공부할 겸 관련된 개념을 함께 정리하다보니 글이 길어졌습니다. 
처음 이 글을 작성할 때 궁금했던 내용은 `'등록한 이벤트가 componentWillUnmount 메소드 수행 시점에 잘 해제되었는가?'` 였습니다. 

### 3.1. EventAPI.js 파일
- 이벤트를 등록하고, 해제하는 별도의 모듈을 하나 만듭니다. 
- 다음과 같은 이유로 별도 모듈로 만들었습니다.
    - 많은 곳에서 사용되는 `window` 객체를 직접 모킹(mocking)하는 것은 테스트가 어렵습니다. 
    - 이벤트를 삭제하기 위해선 이벤트 타입과 등록 시 사용했던 함수와 동일한 참조 값을 가진 함수를 넣어야 합니다.

```jsx
const clickHandler = () => {
    console.log('clickHandler')
}

export const addClickEvent = () => {
    window.addEventListener('click', clickHandler)
}

export const removeClickEvent = () => {
    window.removeEventListener('click', clickHandler)
}
```

### 3.2. App.js 파일 
- `CustomButton` 컴포넌트의 생명 주기에 따라 클릭 이벤트를 등록합니다.
- 이벤트 등록 모듈에 정의한 클릭 이벤트를 `componentDidMount` 메소드 호출 시점에 등록합니다.
- `componentWillUnmount` 메소드 호출 시점에 등록했던 이벤트를 제거합니다.

```jsx
import {useEffect, useState} from "react";
import {addClickEvent, removeClickEvent} from "./EventAPI";

function CustomButton(props) {

    useEffect(() => {
        addClickEvent()
        return function cleanup() {
            removeClickEvent()
        }
    }, [])

    return (
        <button onClick={props.increaseCount}>
            Custom Click me
        </button>
    );
}

function App() {

    const [count, setCount] = useState(0)

    const increaseCount = () => {
        setCount(count + 1)
    }

    return (
        <div>
            <p>You clicked {count} times</p>
            {count % 2 === 1 && <CustomButton increaseCount={increaseCount}/>}
            {count % 2 === 0 &&
                <button onClick={increaseCount}>
                    Click me
                </button>
            }
        </div>
    );
}

export default App;
```

### 3.3. 테스트 코드
- 이벤트를 등록하고 해제할 수 있는 `EventAPI` 모듈의 `addClickEvent`, `removeClickEvent` 함수를 스파이로 만듭니다. 
- 리액트 컴포넌트를 렌더링한 결과 값에서 `unmount` 함수를 디스트럭쳐링(destructuring)합니다.
- 화면의 버튼을 한번 클릭하여 `CustomButton` 컴포넌트를 렌더링합니다.
- `unmount` 함수를 호출하여 `App` 컴포넌트를 `DOM`에서 제거합니다.
- 스파이 객체가 호출됐는지 확인합니다.

```jsx
import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";
import * as EventAPI from "./EventAPI";

describe('App js', () => {

    it('remove click event when componentWillUnmount method', () => {

        const spyAddClickEvent = jest.spyOn(EventAPI, 'addClickEvent')
        const spyRemoveClickEvent = jest.spyOn(EventAPI, 'removeClickEvent')
        const {unmount} = render(<App/>)
        userEvent.click(screen.getByText('Click me'))

        unmount()

        expect(spyAddClickEvent).toHaveBeenCalledTimes(1)
        expect(spyRemoveClickEvent).toHaveBeenCalledTimes(1)
    })
})
```

## CLOSING

간단하게 테스트 코드만 정리하려고 보니 `useEffect` 훅과 리액트 컴포넌트의 라이프 사이클과 관련된 글을 작성한 적이 없어서 함께 정리하였습니다. 
`useEffect` 훅의 클린-업 함수을 테스트하는 방법의 핵심은 `unmount` 함수를 호출인 것 같습니다. 
다른 테스트는 이를 응용하면 가능할 것으로 보입니다.

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-03-27-how-to-test-clean-up>

#### REFERENCE
- [리액트 라이프사이클의 이해][react-lifecycle-link]
- <https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/>
- <https://ko.reactjs.org/docs/hooks-effect.html>
- <https://simsimjae.tistory.com/401>
- <https://intrepidgeeks.com/tutorial/learn-more-about-the-effect-of-user-setup-effect>
- <https://stackoverflow.com/questions/58194024/how-to-unit-test-useeffect-cleanup-return-function-using-jest-and-enzyme>

[react-lifecycle-link]: https://kyun2da.dev/react/%EB%A6%AC%EC%95%A1%ED%8A%B8-%EB%9D%BC%EC%9D%B4%ED%94%84%EC%82%AC%EC%9D%B4%ED%81%B4%EC%9D%98-%EC%9D%B4%ED%95%B4/