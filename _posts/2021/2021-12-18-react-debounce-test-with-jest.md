---
title: "React debounce test with Jest"
search: false
category:
  - information
  - react
  - jest
last_modified_at: 2021-12-18T23:55:00
---

<br/>

👉 이어서 읽기를 추천합니다.
- [Throttle test wit h Jest][throttle-test-link]

## 1. 디바운스, Debounce

이벤트들을 그룹화하여 특정 시간이 지난 후 맨 마지막 이벤트만 발생하도록 처리하는 방법입니다. 
순차적 호출을 하나의 그룹으로 만들고, 맨 마지막 함수(혹은 맨 처음)만 호출합니다. 
잦은 이벤트로 인한 부하로 성능 문제를 일으킬 수 있는 경우 사용합니다. 

예를 들어, 사용자가 검색창에 키워드를 입력할 때 변경 내용마다 서버로 API 요청을 하는 것은 서버와 브라우저 모두에게 부하를 일으킵니다. 
이런 경우에 디바운스를 이용하는데, 사용자 입력이 멈춘 후 일정 시간이 지난 후에 사용자가 입력한 내용을 모아 한 번만 요청합니다. 

대표적으로 디바운스를 이용하여 이벤트 발생을 제어하는 기능은 다음과 같습니다.
- 화면 확대, 축소
- 검색어 입력시 자동 완성 혹은 연관 검색어 노출
- 스크롤링(scrolling)으로 발생하는 과도한 이벤트 처리 

##### 디바운스 처리 방법

<p align="center">
    <img src="/images/react-debounce-test-with-jest-1.JPG" width="75%" class="image__border">
</p>
<center>https://codepen.io/jaehee/pen/XoKeRW</center>

## 2. 디바운스 처리 구현

### 2.1. 테스트 코드

#### 2.1.1. element rendering 테스트
- 컴포넌트 렌더링 후 화면에 element들이 존재하는지 확인합니다.

```jsx
    describe('test rendering elements', () => {

        it('exists input box for search and message when rendered', () => {

            // setup, act
            render(<App/>);

            // assert
            expect(screen.getByPlaceholderText('검색어')).toBeInTheDocument()
            expect(screen.getByText('현재 API 호출 횟수 = 0')).toBeInTheDocument();
        });
    });
```

#### 2.1.2. 사용자 조작 테스트
- 입력창에 검색 키워드 입력 후 적절한 파라미터와 함께 `axios` 호출이 1회 있었는지 확인합니다.
- 화면에 보이는 문구가 변경되었는지 확인합니다.

```jsx
    describe('test user interaction', () => {

        it('call axios get method one time when typed some keyword', () => {

            // setup
            jest.useFakeTimers();
            const spyAxios = jest.spyOn(axios, 'get').mockResolvedValue({data: {}});

            // act
            render(<App/>);
            userEvent.type(screen.getByPlaceholderText('검색어'), 'Junhyunny');
            act(() => {
                jest.advanceTimersByTime(500);
            });

            // assert
            expect(spyAxios).toHaveBeenNthCalledWith(1, 'http://localhost:8080/search', {
                params: {
                    keyword: 'Junhyunny'
                }
            });
            expect(screen.getByText('현재 API 호출 횟수 = 1')).toBeInTheDocument();
        });
    });
```

### 2.2. App.js

#### 2.2.1. Debounce 처리

```jsx
    const debounce = (func, timeout) => {
        let timer;
        return (...args) => {
            const context = this;
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(() => {
                func.apply(context, args);
            }, timeout);
        };
    };
```

### 2.2.2. 전체 코드

```jsx
import {useCallback, useState} from "react";
import axios from "axios";
import classes from './App.module.css';

function App() {

    const [apiCallCount, setApiCallCount] = useState(0);
    const [keyword, setKeyword] = useState('');

    const debounce = (func, timeout) => {
        let timer;
        return (...args) => {
            let context = this;
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(() => {
                func.apply(context, args);
            }, timeout);
        };
    };

    const searchKeyword = (params) => {
        setApiCallCount(prevState => prevState + 1);
        axios.get('http://localhost:8080/search', {
            params
        });
    };

    const deboundHandler = useCallback(debounce(searchKeyword, 500), []);

    const keywordChangeHandler = ({target: {value}}) => {
        setKeyword(value);
        deboundHandler({keyword: value});
    };

    return (
        <div className={classes.App}>
            <input placeholder="검색어" value={keyword} onChange={keywordChangeHandler}/>
            <p>현재 API 호출 횟수 = {apiCallCount}</p>
        </div>
    );
}

export default App;
```

## 3. 테스트 결과
디바운스 처리를 하지 않았을 때와 했을 때 어떻게 다른지 비교해보았습니다. 
또, `useCallback` 훅(hook)을 사용하지 않으면 어떤 현상이 발생하는지 확인해았습니다. 

### 3.1. 디바운스 처리하지 않았을 때 현상
- 키보드 입력이 발생할 때마다 API 요청 횟수가 증가합니다.
- 이는 클라이언트와 서버에 모두 부하를 발생시킬 수 있습니다.

<p align="center">
    <img src="/images/react-debounce-test-with-jest-2.gif" class="image__border">
</p>

### 3.2. useCallback 훅을 사용하지 않았을 때 현상
- useCallback 훅을 사용하지 않으면 예상대로 테스트 결과가 나오지 않습니다. 
- 컴포넌트가 다시 렌더링되면 함수가 새로 생성되기 때문에 이전 타이머가 클리어되지 않고 새로운 타이머가 계속 생겨나게 됩니다. 
- 디바운스 코드로 약간의 딜레이가 있지만, 디바운스 처리를 하지 않은 것과 동일한 결과를 얻게 됩니다. 
- useCallback 훅을 통해 해당 컴포넌트에서 최초 1번만 생성되도록 구현합니다. 

```jsx

    // const deboundHandler = useCallback(debounce(searchKeyword, 500), []);
    const deboundHandler = debounce(searchKeyword, 500);

    const keywordChangeHandler = ({target: {value}}) => {
        setKeyword(value);
        deboundHandler({keyword: value});
    };
```

<p align="center">
    <img src="/images/react-debounce-test-with-jest-3.gif" class="image__border">
</p>

### 3.3. 디바운스 처리된 결과
- 사용자 이벤트가 일정 시간 없을 경우 API 요청을 수행합니다.

<p align="center">
    <img src="/images/react-debounce-test-with-jest-4.gif" class="image__border">
</p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-12-18-react-debounce-test-with-jest>

#### REFERENCE
- <https://webclub.tistory.com/607>
- <https://codepen.io/jaehee/pen/XoKeRW>

[throttle-test-link]: https://junhyunny.github.io/information/react/jest/throttle-test-with-jest/