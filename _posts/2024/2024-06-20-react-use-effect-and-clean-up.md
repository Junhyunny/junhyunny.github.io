---
title: "React useEffect hook and clean-up function"
search: false
category:
  - javascript
  - react
  - jest
last_modified_at: 2024-06-20T23:55:00
---

<br/>

## 0. 들어가면서

이 글은 예전에 작성한 [리액트(react) useEffect 훅(hook)의 클린-업(clean-up) 함수를 테스트하는 방법][how-to-test-clean-up-link]에 대해 정리한 글을 다시 다듬는 과정에서 별도 주제로 다시 작성한 것이다. 예시 코드는 2022년 6월 기준이므로 리액트 버전이 매우 낮다. 

## 1. What is the useEffect hook

useEffect 훅에 대해 먼저 살펴보자.

> React docs - Using the Effect Hook<br/>
> 이펙트 훅을 사용하면 사용하면 함수 컴포넌트에서 사이드 이펙트(side effect)를 수행할 수 있다.

여기서 말하는 사이드 이펙트는 부수적인 효과를 의미하며 다음과 같은 기능들을 예로 들 수 있다. 

- API 요청을 통한 데이터 가져오기
- 구독(subscription) 설정
- 수동으로 React 컴포넌트 DOM 수정

필자는 함수형 리액트를 먼저 접했기 때문에 기존 클래스 기반 리액트의 컴포넌트 라이프사이클(lifecycle)과 친하지 않다. useEffect 훅의 라이프사이클과 레거시 리액트의 컴포넌트 라이프사이클의 연관 관계를 정리해봤다.

- 클래스 기반 리액트 컴포넌트 라이프사이클

<div align="center">
  <img src="/images/posts/2024/how-to-test-clean-up-01.png" width="80%" class="image__border">
</div>
<center>https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/</center>

### 1.1. Component did mount

componentDidMount 함수는 컴포넌트를 처음 렌더링 한 후 실행된다. 최초로 렌더링 되는 시점에만 단 한번 실행된다. useEffect 훅으로 동일하게 구현하려면 다음과 같이 구성한다.

- 두번째 인자를 빈 배열로 전달한다.

```jsx
  useEffect(() => {
    console.log('componentDidMount')
  }, [])
```

### 1.2. Component did update

클래스 기반 리액트 컴포넌트의 라이프사이클을 보면 componentDidUpdate 함수는 다음과 같은 상황에 실행된다.

- `props`가 바뀌는 시점
- `state`가 바뀌는 시점
- 부모 컴포넌트가 리-렌더링되는 시점
- `forceUpdate` 함수를 통해 강제로 렌더링되는 시점

useEffect 훅으로 구현하면 다음과 같다.

- 두번째 인자를 전달하지 않는다.

```jsx
  useEffect(() => {
    console.log('componentDidUpdate')
  })
```

위처럼 useEffect 훅을 사용하면 등록된 콜백이 매우 빈번히 변경된다. 다음과 같이 코드를 작성하면 관심 있는 의존성들의 변경이 있을 때만 useEffect 훅을 실행할 수 있다.

```jsx
  useEffect(() => {
    console.log('componentDidUpdate')
  }, [dependency1, dependency2])
```

### 1.3. Component will unmount

리액트 컴포넌트가 돔-트리(dom-tree)에서 제거될 때 실행된다. 메모리 누수가 발생하지 않도록 할당한 메모리를 해제해주는 작업을 이 함수에서 수행하는 것이 좋다. useEffect 훅을 사용하면 다음과 같이 구현할 수 있다.

- useEffect 훅의 등록한 함수의 결과 값으로 콜백 함수를 반환한다.

```jsx
  useEffect(() => {
    console.log('componentDidMount')
    return function componentWillUnmount() {
      console.log('componentWillUnmount')
    }
  }, [])
```

## 2. useEffect Hook's clean-up function

useEffect 훅이 반환한 콜백 함수가 componentWillUnmount 라이프사이클 함수에 해당한다. 이를 `클린-업 함수`라고 한다. 일반적으로 다음 기능들을 클린-업 함수에서 사용하지 않는 것이 좋다. 

- API 요청을 통한 데이터 가져오기
- React 컴포넌트 DOM 조작
- 로깅(logging)

반면 window 객체에 이벤트를 등록한 경우에는 메모리 누수가 발생하지 않도록 등록한 이벤트 함수를 제거하는 것이 좋다. 간단한 예시를 살펴보자. 

1. App 컴포넌트에서 버튼을 클릭할 때마다 숫자가 증가한다.
2. 카운트가 짝수인 경우 일반 버튼을 렌더링한다.
3. 카운트가 홀수인 경우 커스텀 버튼을 렌더링한다.
  - 커스텀 버튼이 렌더링 될 때 clickHandler 함수가 새로운 클릭 이벤트로 등록된다.

```jsx
import { useEffect, useState } from "react";

function CustomButton(props) {
  const clickHandler = () => {
    console.log(`this click handler is added when count is ${props.count}`);
  };

  useEffect(() => {
    window.addEventListener("click", clickHandler);
  }, []);

  return <button onClick={props.onClick}>Custom Click me</button>;
}

function App() {
  const [count, setCount] = useState(0);

  const increaseCount = () => {
    setCount(count + 1);
  };

  return (
    <div>
      <p>You clicked {count} times</p>
      {count % 2 === 0 && <button onClick={increaseCount}>Click me</button>}
      {count % 2 === 1 && (
        <CustomButton onClick={increaseCount} count={count} />
      )}
    </div>
  );
}

export default App;
```

애플리케이션이 실행 후 버튼을 여러 번 클릭해보면서 콘솔 로그를 살펴보자.

- 커스텀 버튼이 클릭될 때마다 새로운 이벤트가 등록된다. 
- 이전에 등록된 이벤트는 해제되지 않고 함께 호출된다.

<div align="center">
  <img src="/images/posts/2024/how-to-test-clean-up-02.gif" width="100%" class="image__border">
</div>

<br/>

결과를 보면 알 수 있듯이 등록한 콜백 함수가 해제되지 않는다. 이는 메모리 누수로 이어진다. 클린-업 함수를 사용해 등록한 함수를 제거해보자.

1. 클린-업 함수에서 등록된 콜백 함수를 제거한다.

```jsx
import { useEffect, useState } from "react";

function CustomButton(props) {
  const clickHandler = () => {
    console.log(`this click handler is added when count is ${props.count}`);
  };

  useEffect(() => {
    window.addEventListener("click", clickHandler);
    return () => {
      window.removeEventListener("click", clickHandler); // 1
    };
  }, []);

  return <button onClick={props.onClick}>Custom Click me</button>;
}

function App() {
  const [count, setCount] = useState(0);

  const increaseCount = () => {
    setCount(count + 1);
  };

  return (
    <div>
      <p>You clicked {count} times</p>
      {count % 2 === 0 && <button onClick={increaseCount}>Click me</button>}
      {count % 2 === 1 && (
        <CustomButton onClick={increaseCount} count={count} />
      )}
    </div>
  );
}

export default App;
```

애플리케이션을 재실행 후 버튼을 여러 번 클릭해보면서 콘솔 로그를 살펴보자.

- 커스텀 버튼이 클릭될 때마다 새로운 이벤트가 등록된다. 
- 이전에 등록된 이벤트는 해제되었기 때문에 새로 등록된 이벤트의 로그만 출력된다.

<div align="center">
  <img src="/images/posts/2024/how-to-test-clean-up-03.gif" width="100%" class="image__border">
</div>

## CLOSING

예전 글들을 볼 때마다 느끼지만, 전달하고 싶은 메시지에 집중하지 못 하거나 불필요한 내용이 포함된 경우가 많다. 내가 쓴 글들이지만, 엉망진창에 부끄러운 글들 있다. 써놓은 글들을 모두 고치고 싶지만, 시간이 부족하다. 오늘도 어디 내놓기 부끄러운 글을 하나 다시 정리했다. 

#### RECOMMEND NEXT POSTS

- [How to test useEffect hook's clean-up function][how-to-test-clean-up-link]

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-06-20-react-use-effect-and-clean-up>

#### REFERENCE

- [리액트 라이프사이클의 이해][react-lifecycle-link]
- <https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/>
- <https://ko.reactjs.org/docs/hooks-effect.html>
- <https://simsimjae.tistory.com/401>
- <https://intrepidgeeks.com/tutorial/learn-more-about-the-effect-of-user-setup-effect>
- <https://stackoverflow.com/questions/58194024/how-to-unit-test-useeffect-cleanup-return-function-using-jest-and-enzyme>

[react-lifecycle-link]: https://kyun2da.dev/react/%EB%A6%AC%EC%95%A1%ED%8A%B8-%EB%9D%BC%EC%9D%B4%ED%94%84%EC%82%AC%EC%9D%B4%ED%81%B4%EC%9D%98-%EC%9D%B4%ED%95%B4/
[how-to-test-clean-up-link]: https://junhyunny.github.io/javascript/react/jest/how-to-test-clean-up/