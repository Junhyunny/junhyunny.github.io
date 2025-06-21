---
title: "How to test remove event listener in useEffect hook's clean-up"
search: false
category:
  - javascript
  - react
  - jest
last_modified_at: 2022-03-27T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [React useEffect hook and clean-up function][react-use-effect-and-clean-up-link]
- [테스트 더블(Test Double)][test-double-link]

## 0. 들어가면서

이 글은 리액트(react) useEffect 훅(hook)의 클린-업(clean-up) 함수에서 등록된 이벤트 리스너(event listener) 제거를 테스트하는 방법에 대해 정리했다. 

## 1. Problem Context

[React useEffect hook and clean-up function][react-use-effect-and-clean-up-link] 글에서 다룬 예제를 다시 사용한다. 예시 코드에 대한 설명이 필요하다면 이전 글을 참고하길 바란다. 필자는 useEffect 훅에서 등록한 새로운 이벤트를 잘 해제했는지 확인할 수 있는 단위 테스트를 만들고 싶었다. 클린-업 함수에서 등록한 이벤트를 해제하지 않는 경우 메모리 누수가 발생할 수 있기 때문이다.

1. 클릭 이벤트를 등록한다.
2. 클릭 이벤트를 해제한다.

```jsx
import { useEffect, useState } from "react";

function CustomButton(props) {
  const clickHandler = () => {
    console.log(`this click handler is added when count is ${props.count}`);
  };

  useEffect(() => {
    window.addEventListener("click", clickHandler); // 1
    return () => {
      window.removeEventListener("click", clickHandler); // 2
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

새로운 이벤트 리스너를 등록하고 제거하는 일은 `window` 객체의 책임이다. 단위 테스트에서 `window` 객체를 테스트 더블(test double)로 대체하고 싶지만, 어려움이 있다. 어떻게 처리하면 좋을까? 

## 2. Solve the problem

테스트 코드를 작성할 때 테스트를 어렵게 만드는 객체(혹은 모듈)은 내가 다룰 수 있는 객체로 바꾸면 된다. 자바(java)에서 테스트를 어렵게 만드는 요소 중 하나인 시간을 스텁(stub)으로 만들기 위한 제공자(provider) 객체를 만드는 것을 하나의 예로 들 수 있다. 필자는 이벤트 등록과 제거를 위한 `event-listeners` 모듈을 만들고 이를 테스트 더블로 사용했다. `event-listeners` 모듈은 다음과 같다. 

```js
export const addClickEvent = (eventListener) => {
  window.addEventListener("click", eventListener);
};

export const removeClickEvent = (eventListener) => {
  window.removeEventListener("click", eventListener);
};
```

CustomButton 컴포넌트를 별도로 분리한 후 테스트를 수행한다. 테스트 코드는 다음과 같다.

1. `event-listeners` 모듈에서 제공하는 이벤트 리스너 등록, 삭제 함수들을 테스트 더블로 만든다.
2. 컴포넌트를 언마운트(unmount) 한다.
3. 다음과 같은 내용을 확인한다.
  - 각 테스트 더블이 예상되는 파라미터로 호출되었는지 확인한다.
  - 두 테스트 더블에 전달된 인자가 동일한 함수 객체인지 확인한다. 이벤트 리스너를 추가하고 삭제할 때 동일한 함수 객체가 아닌 경우 삭제가 제대로 되지 않으므로 이를 확인할 필요가 있다.

```jsx
import { render } from "@testing-library/react";

import * as eventListeners from "../utils/event-listeners";
import CustomButton from "./CustomButton";

describe("CustomButton", () => {
  it("when unmount custom button then remove event listener call", () => {
    const spyAddClickEvent = jest.spyOn(eventListeners, "addClickEvent"); // 1
    const spyRemoveClickEvent = jest.spyOn(eventListeners, "removeClickEvent");
    const { unmount } = render(<CustomButton />);

    unmount(); // 2

    expect(spyAddClickEvent).toHaveBeenNthCalledWith(1, expect.any(Function)); // 3
    expect(spyRemoveClickEvent).toHaveBeenCalledTimes(1, expect.any(Function));
    const addClickEventArg = spyAddClickEvent.mock.calls[0][0];
    const removeClickEventArg = spyRemoveClickEvent.mock.calls[0][0];
    expect(addClickEventArg).toEqual(removeClickEventArg);
  });
});
```

CustomButton 컴포넌트를 다음과 같이 변경한다.

- `event-listeners` 모듈을 통해 클릭 이벤트 리스너를 등록, 삭제한다.

```jsx
import { useEffect } from "react";
import { addClickEvent, removeClickEvent } from "../utils/event-listeners";

function CustomButton(props) {
  const clickHandler = () => {
    console.log(`this click handler is added when count is ${props.count}`);
  };

  useEffect(() => {
    addClickEvent(clickHandler);
    return () => {
      removeClickEvent(clickHandler);
    };
  }, []);

  return <button onClick={props.onClick}>Custom Click me</button>;
}

export default CustomButton;
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-03-27-how-to-test-clean-up>

#### REFERENCE

- <https://testing-library.com/docs/react-testing-library/api/#unmount>
- <https://jestjs.io/docs/mock-functions#mock-property>
- <https://stackoverflow.com/questions/41939511/how-can-i-get-the-arguments-called-in-jest-mock-function>
- <https://stackoverflow.com/questions/52337116/loose-match-one-value-in-jest-tohavebeencalledwith>

[react-use-effect-and-clean-up-link]: https://junhyunny.github.io/javascript/react/jest/react-use-effect-and-clean-up/
[test-double-link]: https://junhyunny.github.io/test/test-driven-development/test-double/