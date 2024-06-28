---
title: "Throttle test with Jest"
search: false
category:
  - information
  - react
  - jest
last_modified_at: 2021-12-18T23:55:00
---

<br/>

## 0. 들어가면서

[디바운스(debounce)][react-debounce-test-link]처럼 쓰로틀(throttle)이라는 이벤트 처리를 최적화하는 방법이 있다. 이번 글은 쓰로틀의 개념과 테스트하는 방법에 대해 정리했다.

## 1. Throttle
 
다음과 같은 방식으로 처리하는 것을 쓰로틀이라고 한다. 

1. 동일한 이벤트가 짧은 시간 동안 여러번 발생한다.
2. 지정된 시간 간격 이내에 발생한 이벤트들은 무시한다.
3. 지정된 시간 간격 이후에 발생한 이벤트를 처리한다.

쓰로틀 역시 디바운스와 마찬가지로 부하가 발생하는 작업을 처리할 때 사용한다. 예를 들어, 사용자가 스크롤을 아래로 내리는 행위는 매우 많은 이벤트를 발생시킵니다. 브라우저 화면 스크롤은 작은 움직임에도 굉장히 많은 이벤트가 발생한다. 모든 이벤트를 처리하는 것은 비효율적이다. 지정한 시간 간격 이내에 발생하는 동일 이벤트들은 무시하는 것이 합리적이다. 

대표적으로 스로틀을 이용하는 경우는 다음과 같다.

- 화면 확대와 축소
- 검색어 입력시 자동 완성 혹은 연관 검색어 노출
- 스크롤링(scrolling)으로 발생하는 과도한 이벤트 처리 

스로틀 처리를 시각화하면 다음처럼 표현할 수 있다.

- 최초 이벤트가 실행된다.  
- 이후 여러번의 동일한 이벤트가 발생하지만, 설정한 시간 간격 이내에 발생한 이벤트는 무시한다.

<p align="center">
  <img src="/images/posts/2021/throttle-test-with-jest-01.png" width="80%">
</p>
<center>https://codepen.io/jaehee/pen/XoKeRW</center>

## 2. Implement throttle

이번 글은 쓰로틀 기능을 테스트하는 방법에 대해 정리한 것이다. 먼저 쓰로틀 처리를 위한 구현체 코드를 살펴보자. 

1. throttle 함수 스코프 내부에 wait 변수를 만든다.
  - wait 변수는 콜백 함수가 실행됐는지 확인하는 플래그(flag)다. 
  - 반환된 함수는 클로저(closure)이므로 wait 변수의 값은 동일하게 유지된다.
2. wait 플래그가 false 값으로 변경되지 않은 경우 함수를 종료한다.
3. wait 플래그가 false 값인 경우 콜백 함수를 실행한다.
  - 콜백 함수를 실행하기 전에 wait 플래그를 true 값으로 변경한다.
  - wait 플래그를 false 값으로 만드는 타이머를 설정한다.

```js
export const throttle = (func, timeout) => {
  let wait = false; // 1
  return (...args) => {
    if (wait) { // 2
      return;
    }
    setTimeout(() => { // 3
      wait = false;
    }, timeout);
    wait = true;
    func(args);
  };
};
```

쓰로틀 함수를 애플리케이션에서 다음과 같이 사용한다. 이번 글은 화면의 스크롤 이벤트가 발생했을 때 돔 엘리먼트(dom element)를 다시 그리는 작업을 수행한다.

1. increaseWidth 함수는 엘리먼트 폭을 증가 시킨다.
2. decreaseWidth 함수는 엘리먼트 폭을 감소 시킨다.
3. scrollEventHandler 함수는 스크롤 방향에 따라 엘리먼트 폭을 증가, 감소 시키는 함수를 호출한다.
4. 두 개의 이벤트 함수를 만든다.
  - normalEvent 이벤트 함수는 일반 함수로 제어할 돔 엘리먼트 아이디는 `normal`이다.
  - throttledEvent 이벤트 함수는 스로틀 처리된 함수로 제어할 돔 엘리먼트 아이디는 `throttled`이다.
5. useEffect 훅에서 이벤트 리스너를 등록, 삭제한다.

```jsx
import { useCallback, useEffect } from "react";
import { throttle } from "./utils/throttle";
import classes from "./App.module.css";

function App() {
  const increaseWidth = (element) => { // 1
    let prevState = element.offsetWidth;
    element.style.width = `${prevState + 10 > 1000 ? 1000 : prevState + 10}px`;
  };

  const decreaseWidth = (element) => { // 2
    let prevState = element.offsetWidth;
    element.style.width = `${prevState - 10 < 300 ? 300 : prevState - 10}px`;
  };

  const scrollEventHandler = (elementId) => { // 3
    let lastScrollTop = 0;
    return () => {
      let scrollTop = document.documentElement.scrollTop;
      const element = document.getElementById(elementId);
      if (scrollTop > lastScrollTop) {
        increaseWidth(element);
      } else {
        decreaseWidth(element);
      }
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    };
  };

  const normalEvent = useCallback(scrollEventHandler("normal"), []); // 4
  const throttledEvent = useCallback(
    throttle(scrollEventHandler("throttled"), 100),
    [],
  );

  useEffect(() => { // 5
    window.addEventListener("scroll", normalEvent);
    window.addEventListener("scroll", throttledEvent);
    return () => {
      window.removeEventListener("scroll", normalEvent);
      window.removeEventListener("scroll", throttledEvent);
    };
  }, []);

  return (
    <div className={classes.App}>
      <div id="normal" className={classes.normalDiv}>
        div block normal scroll event
      </div>
      <div id="throttled" className={classes.throttledDiv}>
        div block throttled scroll event
      </div>
    </div>
  );
}

export default App;
```

## 3. Test code

다음과 같이 테스트 코드를 작성한다. 타임아웃 처리 때문에 페이크 타이머(fake timer)를 사용해야 한다. 테스트 코드는 노드(node) 환경에서 가상 돔 엘리먼트를 사용하기 때문애 엘리먼트의 폭이나 높이를 직접 확인하는 것은 어렵다. throttle 함수를 별도로 만든 후 이를 사용하면 쓰로틀 처리가 잘 수행되는지 확인하는 것이 좋다.

1. Given
  - 특정 함수를 스파이 테스트 더블로 만든다.
  - 테스트 더블을 쓰로틀 함수로 감싼다.
2. When
  - 페이크 타이머를 활성화한다.
  - 5ms 간격으로 함수 호출을 100회 실행한다.
3. Then
  - 테스트 더블의 호출 횟수가 5회인지 확인한다.

```jsx
import { throttle } from "./throttle";

test("when occur 100 times event with throttle in 500ms then invoke 5 times", () => {
  const spy = jest.fn(); // 1
  const sut = throttle(spy, 100);

  jest.useFakeTimers(); // 2
  for (let index = 0; index < 100; index++) {
    sut();
    jest.advanceTimersByTime(5);
  }

  expect(spy).toHaveBeenCalledTimes(5); // 3
});
```

쓰로틀 처리 없이 테스트 더블을 직접 호출하면 100회 호출된다.

```js
test("when occur 100 times event with throttle in 500ms then invoke 100 times", () => {
  const spy = jest.fn(); // 1

  jest.useFakeTimers(); // 2
  for (let index = 0; index < 100; index++) {
    spy();
    jest.advanceTimersByTime(5);
  }

  expect(spy).toHaveBeenCalledTimes(100); // 3
});
```

## 4. Run application

애플리케이션을 실행하면 다음과 같이 처리되는 것을 확인할 수 있다.

- 스크롤 이벤트 발생 횟수에 따라 화면 두 블록의 폭이 변경된다.
  - 상단 블럭은 스로틀 처리하지 않은 상태이기 때문에 더 많은 변화가 발생한다.
  - 하단 블럭은 스로틀 처리된 상태이기 때문에 비교적 변화가 적다.

<p align="center">
  <img src="/images/posts/2021/throttle-test-with-jest-02.gif" width="100%">
</p>

#### 2.2. throttle 모듈

```jsx
export default (func, timeout) => {
    let wait = false;
    return (...args) => {
        if (wait) {
            return;
        }
        setTimeout(() => {
            wait = false;
        }, timeout);
        wait = true;
        func(args);
    };
};
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-01-02-throttle-test-with-jest>

#### RECOMMEND NEXT POSTS

- [React debounce test with Jest][react-debounce-test-link]

#### REFERENCE

- <https://webclub.tistory.com/607>
- <https://codepen.io/jaehee/pen/XoKeRW>

[react-debounce-test-link]: https://junhyunny.github.io/information/react/jest/react-debounce-test-with-jest/
