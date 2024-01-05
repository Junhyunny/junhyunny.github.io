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

👉 이어서 읽기를 추천합니다.
- [React debounce test with Jest][react-debounce-test-link]

## 1. 스로틀, Throttle
 
여러 차례 발생하는 이벤트를 일정 시간 간격으로마다 한번씩 실행하도록 제어하는 기술입니다. 
특정 이벤트가 발생한 시점에 처음으로 실행되고, 시간 간격이 만족되지 않으면 실행되지 않습니다. 
지정된 시간이 지나서 이벤트가 발생하면 재실행됩니다. 

예를 들어, 사용자가 스크롤을 아래로 내리는 행위는 매우 많은 이벤트를 발생시킵니다. 
스크롤 다운시 발생하는 매 이벤트마다 다음 표시할 아이템들을 서버에게 요청하는 일은 많은 부하를 유발합니다. 
이런 경우 사용자 경험을 해치지 않는 선에서 서버에게 부하를 주지 않고 데이터를 가져오기 위해 스로틀 방식 사용합니다. 

대표적으로 스로틀을 이용하여 이벤트 발생을 제어하는 기능은 다음과 같습니다.
- 화면 확대, 축소
- 검색어 입력시 자동 완성 혹은 연관 검색어 노출
- 스크롤링(scrolling)으로 발생하는 과도한 이벤트 처리

##### 스로틀 처리 방법
- 해당 출처에 있는 디바운스 코드를 스로틀 코드로 변경 후 테스트하여 이미지를 만들었습니다.
- 위의 이벤트가 발생하는 동안 실제로 함수가 실행되는 일은 설정한 시간 간격만큼 주기적임을 알 수 있습니다.  

<p align="center"><img src="/images/throttle-test-with-jest-1.JPG" width="75%"></p>
<center>https://codepen.io/jaehee/pen/XoKeRW</center>

## 2. 스로틀 처리 구현

### 2.1. 테스트 코드
- 100ms 시간 간격으로 함수를 실행할 수 있는 `throttle` 함수를 생성합니다.
- 5ms 시간 간격으로 함수 호출을 100회 실행합니다.
- 100ms 시간 간격으로 실행하기 때문에 5회만 호출되었는지 스파이(spy)를 통해 확인합니다.

```jsx
import throttle from "./throttle";

describe('throttle test', () => {

    it('call 5 times when throttle time sleep 100ms during 500ms', () => {

        // setup
        jest.useFakeTimers();
        const funcSpy = jest.fn();
        const throttledFunc = throttle(funcSpy, 100);

        // act
        for (let index = 0; index < 100; index++) {
            throttledFunc();
            jest.advanceTimersByTime(5);
        }

        // assert
        expect(funcSpy).toHaveBeenCalledTimes(5);
    });
});
```

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

## 3. 스로틀 테스트

### 3.1. App.js
- 일반 스크롤 이벤트와 스로틀 이벤트를 두 개 생성합니다.
- `normalEvent`는 일반적인 스크롤 이벤트를 실행합니다.
- `throttledEvent`는 100ms 주기로 이벤트를 실행합니다.
- 생성한 두 개의 스크롤 이벤트를 등록합니다.

```jsx
import {useCallback, useEffect, useState} from "react";
import classes from './App.module.css';
import throttle from "./utils/throttle";

function App() {

    const [normalWidth, setNormalWidth] = useState(300);
    const [throttledWidth, setThrottledWidth] = useState(300);

    const increaseWidth = (prevState) => {
        return prevState + 10 > 1000 ? 1000 : prevState + 10;
    };

    const decreaseWidth = (prevState) => {
        return prevState - 10 < 300 ? 300 : prevState - 10;
    };

    const scrollEventHandler = (element) => {
        let lastScrollTop = 0;
        return () => {
            let scrollTop = document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop) {
                if (element === 'normal') {
                    setNormalWidth(increaseWidth);
                } else {
                    setThrottledWidth(increaseWidth);
                }
            } else {
                if (element === 'normal') {
                    setNormalWidth(decreaseWidth);
                } else {
                    setThrottledWidth(decreaseWidth);
                }
            }
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        };
    };

    const normalEvent = useCallback(scrollEventHandler('normal'), []);
    const throttledEvent = useCallback(throttle(scrollEventHandler('throttled'), 100), []);

    useEffect(() => {
        window.addEventListener('scroll', normalEvent);
        window.addEventListener('scroll', throttledEvent);
        return () => {
            window.removeEventListener('scroll', normalEvent);
            window.removeEventListener('scroll', throttledEvent);
        };
    }, []);

    return (
        <div className={classes.App}>
            <div className={classes.normalDiv} style={ { width: `${normalWidth}px` } } >
                div block normal scroll event
            </div>
            <div className={classes.throttledDiv} style={ { width: `${throttledWidth}px` } } >
                div block throttled scroll event
            </div>
        </div>
    );
}

export default App;
```

### 3.2. 스로틀 테스트 결과
- 스크롤 이벤트 발생 횟수에 따라 화면 블럭의 폭을 변경합니다.
- 상단 블럭은 스로틀 처리하지 않은 스크롤 이벤트 발생시 폭이 변경됩니다.
- 하단 블럭은 스로틀 처리한 스크롤 이벤트 발생시 폭이 변경됩니다.

<p align="center"><img src="/images/throttle-test-with-jest-2.gif"></p>

## CLOSING

리액트 컴포넌트에서 스로틀 테스트를 진행하고 싶었지만, 생각보다 좋은 아이디어가 나오지 않았습니다. 
좋은 아이디어가 나온다면 [React debounce test with Jest][react-debounce-test-link] 포스트처럼 실제 적용에 대한 테스트 코드를 업로드하겠습니다. 

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-01-02-throttle-test-with-jest>

#### REFERENCE
- <https://webclub.tistory.com/607>
- <https://codepen.io/jaehee/pen/XoKeRW>

[react-debounce-test-link]: https://junhyunny.github.io/information/react/jest/react-debounce-test-with-jest/