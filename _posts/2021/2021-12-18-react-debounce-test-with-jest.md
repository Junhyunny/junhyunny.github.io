---
title: "Debounce test with Jest"
search: false
category:
  - information
  - react
  - jest
last_modified_at: 2021-12-18T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Throttle test with Jest][throttle-test-link]

## 1. Debounce

다음과 같은 방식으로 처리하는 것을 디바운스(debounce)라고 한다.

1. 동일한 이벤트들을 그룹화한다.
2. 특정 시간이 지난 후 맨 마지막 이벤트만 발생하도록 처리한다.

잦은 이벤트로 인해 부하가 발생하는 경우 디바운스 처리를 수행한다. 예를 들면 사용자가 검색창에 키워드를 입력하는 모든 이벤트가 서버로 요청을 보내는 것은 불합리하다. 사용자 입력이 멈춘 후 마지막 입력 값만으로 쿼리를 수행하는 것이 효율적이다. 검색 쿼리는 검색 키워드에 정보를 추가하면서 결과 범위를 줄이는 과정이기 때문이다. 

대표적으로 디바운스를 이용하는 경우는 다음과 같다.

- 화면 확대와 축소
- 검색어 입력시 자동 완성 혹은 연관 검색어 노출
- 스크롤링(scrolling)으로 발생하는 과도한 이벤트 처리 

디바운스 처리를 시각화하면 다음처럼 표현할 수 있다.

- 여러번의 동일한 이벤트 중 마지막 이벤트만 처리한다.

<p align="center">
  <img src="/images/posts/2021/react-debounce-test-with-jest-01.png" width="80%" class="image__border">
</p>
<center>https://codepen.io/jaehee/pen/XoKeRW</center>

## 2. Implement debounce

이번 글은 디바운스 기능을 테스트하는 방법에 대해 정리한 것이다. 먼저 디바운스 처리를 위한 구현체 코드를 살펴보자. 

1. debounce 함수 스코프 내부에 timer 변수를 만든다.
  - timer 변수는 타임아웃 객체를 참조한다.
  - 반환된 함수는 클로저(closure)이므로 timer 변수가 참조하는 객체는 동일하게 유지된다.
2. 기존 타임아웃 타이머가 있는 경우 이를 제거한다.
3. 지정한 타임아웃 시간 이후에 파라미터로 전달 받은 함수를 실행한다.

```js
export const debounce = (func, timeout) => {
  let timer; // 1
  return (...args) => { // 2
    const context = this;
    if (timer) { // 3
      clearTimeout(timer);
    }
    timer = setTimeout(() => { // 4
      func.apply(context, args);
    }, timeout);
  };
};
```

디바운스 함수를 애플리케이션에서 다음과 같이 사용한다.

1. 키워드로 검색하는 searchKeyword 함수를 만든다.
2. searchKeyword 함수를 debounce 함수로 감싸 디바운스 처리가 되도록 만든다.
  - 리-렌더링(re-rendering)할 때 함수가 매번 생성되지 않도록 useCallback 훅(hook)을 사용한다.
3. input 태그의 onChange 이벤트에서 디바운드 처리한 검색 함수를 사용한다.

```jsx
import { useCallback, useState } from 'react';
import { getItems } from './respository/ItemRepository';
import { debounce } from './util/debounce';
import classes from './App.module.css';

function App() {
  const [keyword, setKeyword] = useState('');
  const [apiCallCount, setApiCallCount] = useState(0);

  const searchKeyword = (keyword) => { // 1
    setApiCallCount((prevState) => prevState + 1);
    getItems({ keyword }).then(console.log);
  };

  const debounceSearch = useCallback(debounce(searchKeyword, 500), []); // 2

  const keywordChangeHandler = ({ target: { value } }) => { // 3
    setKeyword(value);
    debounceSearch(value);
  };

  return (
    <div className={classes.App}>
      <input placeholder="검색어" value={keyword} onChange={keywordChangeHandler} />
      <p>현재 API 호출 횟수 = {apiCallCount}</p>
    </div>
  );
}

export default App;
```

## 3. Test code

다음과 같이 테스트 코드를 작성한다. 타임아웃 처리 때문에 페이크 타이머(fake timer)를 사용해야 한다.

1. Given
  - API 요청 모듈을 테스트 더블로 만든다.
  - 컴포넌트를 렌더링한다.
2. When
  - 페이크 타이머를 활성화한다.
  - 검색어를 타이핑(typing)한다.
  - 타이머 시간을 501ms 뒤로 보낸다.
3. Then
  - 테스트 더블의 호출 횟수가 1회인지 확인한다.
  - 검색 키워드가 입력 마지막 상태인지 확인한다.
  - 화면에 보이는 결과를 확인한다.

```jsx
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as ItemRepository from './respository/ItemRepository';

import App from './App';

test('when search keyword then request one time after 500ms', () => {
  const spyItemRepository = jest.spyOn(ItemRepository, 'getItems').mockResolvedValue([]); // 1
  render(<App />);

  jest.useFakeTimers(); // 2
  userEvent.type(screen.getByPlaceholderText('검색어'), 'Junhyunny');
  act(() => {
    jest.advanceTimersByTime(501);
  });

  expect(spyItemRepository).toHaveBeenCalledTimes(1); // 3
  expect(spyItemRepository).toHaveBeenNthCalledWith(1, {
    keyword: 'Junhyunny',
  });
  expect(screen.getByText('현재 API 호출 횟수 = 1')).toBeInTheDocument();
});
```

## 4. Run application

애플리케이션을 실행하면 다음과 같이 처리되는 것을 확인할 수 있다.

- 타이핑 완료되면 짧은 딜레이 이후 요청이 처리 된다.

<p align="center">
  <img src="/images/posts/2021/react-debounce-test-with-jest-02.gif" width="100%" class="image__border">
</p>

## CLOSING

useCallback 훅을 사용하지 않는 경우 리-렌더링할 때마다 매번 새로운 함수가 생성되기 때문에 제대로 된 디바운스 처리가 수행되지 않는다.

<p align="center">
  <img src="/images/posts/2021/react-debounce-test-with-jest-03.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-12-18-react-debounce-test-with-jest>

#### REFERENCE

- <https://webclub.tistory.com/607>
- <https://codepen.io/jaehee/pen/XoKeRW>

[throttle-test-link]: https://junhyunny.github.io/information/react/jest/throttle-test-with-jest/