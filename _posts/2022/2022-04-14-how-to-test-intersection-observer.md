---
title: "How to Test Intersection Observer"
search: false
category:
  - javascript
  - jest
  - testing-library
  - test-driven-development
last_modified_at: 2022-04-14T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Asynchronous Task In JavaScript][how-to-work-javascript-async-link]

## 0. 들어가면서

무한 스크롤(infinite scroll) 기능을 테스트하기 위한 코드를 작성하면서 만난 에러와 해결하는 과정을 정리하였습니다. 

## 1. Intersection Observer API

`Intersection Observer`는 타겟 엘리먼트(target element)가 관찰하고 있는 화면에 보여지는지 확인하는 Web API 기능입니다. 
이번 포스트는 `Intersection Observer`를 테스트하는 방법을 정리하였기 때문에 간단한 설명과 용어만 정리하고 글을 이어나가겠습니다. 

아래 용어들과 기능에 이해가 필요합니다. 
- 뷰 포트(View Port)는 관찰하고 있는 영역입니다. 
- 타겟 엘리먼트(Target Element)는 관심 대상입니다.
- `Intersection Observer`는 타겟 엘리먼트와 뷰 포트 사이의 교차(cross)를 관찰합니다.
- `Web API` 기능이므로 메인 스레드에 영향을 주지 않고 비동기적인 콜백 함수 호출로 관찰이 가능합니다.

<p align="center">
    <img src="/images/how-to-test-intersection-observer-1.JPG" width="75%" class="image__border">
</p>
<center>https://cross-code.github.io/posts/IntersectionObserver/</center>

## 2. 코드 살펴보기

이해를 돕기 위해 구현 코드, 테스트 코드 순서로 기능을 살펴보겠습니다. 
발생한 에러를 확인하고, 이를 보완하기 위한 방법을 정리하였습니다.

### 2.1. 구현 코드

- `componentDidMount` 시점에 다음과 같은 동작을 수행합니다.
    - 포켓몬 API를 사용한 데이터 조회합니다.
    - `IntersectionObserver` 객체를 생성하고 뷰 포트를 등록합니다.
    - `IntersectionObserver` 콜백 함수
        - 현재 타겟을 관찰 대상에서 제거합니다.
        - 데이터를 조회합니다.
- `componentDidUpdate` 시점에 다음과 같은 동작을 수행합니다.
    - `pokemos` 상태가 변경될 때마다 수행합니다.
    - 관찰하고 싶은 신규 타겟을 등록합니다.
- `componentWillUnmount` 시점에 다음과 같은 동작을 수행합니다.
    - 사용한 `IntersectionObserver`을 정리합니다.

```jsx
import { useCallback, useEffect, useState } from 'react'
import classes from './InfiniteScroll.module.css'
import axios from 'axios'

let intersectionObserver
let offset = 0

export default () => {
    const [pokemons, setPokemons] = useState([])

    const fetchesData = useCallback(async () => {
        const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/?offset=${offset}&limit=20`)
        const results = data.results
        if (results.length) {
            results[results.length - 1].isLastItem = true
        }
        offset++
        setPokemons((prevState) => {
            if (prevState.length) {
                prevState[prevState.length - 1].isLastItem = false
            }
            return [].concat(prevState).concat(results)
        })
    }, [])

    useEffect(async () => {
        await fetchesData()
    }, [])

    useEffect(() => {
        intersectionObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(async (entry) => {
                    if (!entry.isIntersecting) {
                        return
                    }
                    observer.unobserve(entry.target)
                    await fetchesData()
                })
            },
            {
                root: document.querySelector('#viewPort'),
            }
        )
        return () => {
            intersectionObserver.disconnect()
        }
    }, [])

    useEffect(() => {
        const lastItem = document.querySelector('.last-pokemon')
        if (lastItem) {
            intersectionObserver.observe(lastItem)
        }
    }, [pokemons])

    return (
        <div id={'viewPort'} className={classes.viewPort}>
            {pokemons.map((pokemon, index) => (
                <div key={index} className={`${classes.box} ${pokemon.isLastItem ? 'last-pokemon' : ''}`}>
                    {pokemon.name}
                </div>
            ))}
        </div>
    )
}
```

### 2.2. 테스트 코드

- `axis` 모듈의 `get` 함수를 스터빙(stubbing)합니다.
    - 1회 호출 시 이름이 1에서 10까지 숫자를 가지는 객체 리스트 반환합니다.
    - 2회 호출 시 이름이 11, 12인 객체 리스트를 반환합니다.
- 화면을 렌더링합니다.
- `fireEvent`를 이용해 뷰 포트 영역을 스크롤합니다.
- 다음과 같은 내용들을 확인합니다.
    - 화면에 11이 보이는지 확인합니다.
    - `axios` 스파이가 2회 호출되었는지 확인합니다.
    - `axios` 스파이가 1번째 호출되었을 때 파라미터를 확인합니다.
    - `axios` 스파이가 2번째 호출되었을 때 파라미터를 확인합니다.

```jsx
import {fireEvent, render, screen, waitFor} from '@testing-library/react'

import axios from 'axios'

import App from '../App'

describe('Intersection Observer', () => {
    it('when scroll down then fetch data', async () => {
        const spyAxios = jest.spyOn(axios, 'get').mockResolvedValueOnce({
            data: {
                results: [
                    { name: '1' },
                    { name: '2' },
                    { name: '3' },
                    { name: '4' },
                    { name: '5' },
                    { name: '6' },
                    { name: '7' },
                    { name: '8' },
                    { name: '9' },
                    { name: '10' },
                ],
            },
        })
        jest.spyOn(axios, 'get').mockResolvedValueOnce({
            data: {
                results: [{ name: '11' }, { name: '12' }],
            },
        })
        await waitFor(() => {
            return render(<App />)
        })

        fireEvent.scroll(document.querySelector('#viewPort'), { target: { scrollY: 500 } })

        expect(await screen.findByText('11')).toBeInTheDocument()
        expect(spyAxios).toHaveBeenCalledTimes(2)
        expect(spyAxios).toHaveBeenNthCalledWith(1, 'https://pokeapi.co/api/v2/pokemon/?offset=0&limit=20')
        expect(spyAxios).toHaveBeenNthCalledWith(2, 'https://pokeapi.co/api/v2/pokemon/?offset=1&limit=20')
    })
})
```

##### 에러 발생과 원인

- 위의 테스트 코드를 실행시키면 다음과 같은 에러가 발생합니다.
    - `IntersectionObserver is not defined`
- `IntersectionObserver`는 `Web API` 기능이므로 `@testing-library/react` 모듈에서 찾을 수 없습니다.

```
IntersectionObserver is not defined
ReferenceError: IntersectionObserver is not defined
    at /Users/junhyunk/Desktop/workspace/blog-in-action/2022-04-13-how-to-test-intersection-observer/intersection-observer-test/src/intersection-observer/InfiniteScroll.js:31:9
    at invokePassiveEffectCreate (/Users/junhyunk/Desktop/workspace/blog-in-action/2022-04-13-how-to-test-intersection-observer/intersection-observer-test/node_modules/react-dom/cjs/react-dom.development.js:23487:20)
    at HTMLUnknownElement.callCallback (/Users/junhyunk/Desktop/workspace/blog-in-action/2022-04-13-how-to-test-intersection-observer/intersection-observer-test/node_modules/react-dom/cjs/react-dom.development.js:3945:14)
    at HTMLUnknownElement.callTheUserObjectsOperation (/Users/junhyunk/Desktop/workspace/blog-in-action/2022-04-13-how-to-test-intersection-observer/intersection-observer-test/node_modules/jsdom/lib/jsdom/living/generated/EventListener.js:26:30)
    ...
```

### 2.3. 테스트 코드 보완하기

이 에러를 해결하려면 가짜 `IntersectionObserver` 클래스를 만들어 제공해야합니다. 

##### 예시 코드
- 스택 오버플로우를 탐색해보니 보통 다음과 같이 가짜 클래스를 만들어 사용하는 것으로 보입니다.
    - <https://stackoverflow.com/questions/57008341/jest-testing-react-component-with-react-intersection-observer>

```js
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}

  observe() {
    return null;
  }

  disconnect() {
    return null;
  };

  unobserve() {
    return null;
  }
};
```

#### 2.3.1 Mock IntersectionObserver 구현

- 가짜 `IntersectionObserver` 클래스를 구현합니다.
- `constructor` 생성자
    - 콜백 함수와 옵션을 전달받습니다.
    - `viewPort`를 구현 코드에서 전달한 `root`로 지정합니다.
    - `viewPort`에 스크롤 이벤트를 추가합니다.
    - 관찰 중인 타겟이 `viewPort`에 존재하는지 판단합니다.
    - 콜백 함수를 실행합니다.
- `isInViewPort` 함수
    - `jsdom`을 사용하는 경우 `getBoundingClientRect` 기능을 지원하지 않아 의미있는 테스트를 구현하진 못하였습니다.
    - <https://github.com/jsdom/jsdom/issues/1590>
    - <https://testing-library.com/docs/example-drag/>
- `observe` 함수
    - 새로운 타겟을 등록합니다.
- `unobserve` 함수
    - 해당 타겟을 제거합니다.
- `disconnect` 함수
    - 관심 타겟들을 초기화합니다.

```jsx
const mockIntersectionObserver = class {
    constructor(callback, options) {
        this.viewPort = options.root
        this.entries = []
        this.viewPort.addEventListener('scroll', () => {
            this.entries.map((entry) => {
                entry.isIntersecting = this.isInViewPort(entry.target)
            })
            callback(this.entries, this)
        })
    }

    isInViewPort(target) {
        // const rect = target.getBoundingClientRect()
        // const viewPortRect = this.viewPort.getBoundingClientRect()
        // return (
        //     rect.left >= viewPortRect.x &&
        //     rect.top >= viewPortRect.y &&
        //     rect.right <= viewPortRect.right &&
        //     rect.bottom <= viewPortRect.bottom
        // )
        return true
    }

    observe(target) {
        this.entries.push({ isIntersecting: false, target })
    }

    unobserve(target) {
        this.entries = this.entries.filter((ob) => ob.target !== target)
    }

    disconnect() {
        this.entries = []
    }
}
```

#### 2.3.2. 전체 테스트 코드

- 구현한 가짜 `IntersectionObserver` 클래스를 윈도우에 등록합니다.
    - `window.IntersectionObserver = mockIntersectionObserver`

```jsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import axios from 'axios'

import App from '../App'

const mockIntersectionObserver = class {
    constructor(callback, options) {
        this.viewPort = options.root
        this.entries = []
        this.viewPort.addEventListener('scroll', () => {
            this.entries.map((entry) => {
                entry.isIntersecting = this.isInViewPort(entry.target)
            })
            callback(this.entries, this)
        })
    }

    isInViewPort(target) {
        return true
    }

    observe(target) {
        this.entries.push({ isIntersecting: false, target })
    }

    unobserve(target) {
        this.entries = this.entries.filter((ob) => ob.target !== target)
    }

    disconnect() {
        this.entries = []
    }
}

window.IntersectionObserver = mockIntersectionObserver

describe('Intersection Observer', () => {
    it('when scroll down then fetch data', async () => {
        const spyAxios = jest.spyOn(axios, 'get').mockResolvedValueOnce({
            data: {
                results: [
                    { name: '1' },
                    { name: '2' },
                    { name: '3' },
                    { name: '4' },
                    { name: '5' },
                    { name: '6' },
                    { name: '7' },
                    { name: '8' },
                    { name: '9' },
                    { name: '10' },
                ],
            },
        })
        jest.spyOn(axios, 'get').mockResolvedValueOnce({
            data: {
                results: [{ name: '11' }, { name: '12' }],
            },
        })
        await waitFor(() => {
            return render(<App />)
        })

        fireEvent.scroll(document.querySelector('#viewPort'), { target: { scrollY: 500 } })

        expect(await screen.findByText('11')).toBeInTheDocument()
        expect(spyAxios).toHaveBeenCalledTimes(2)
        expect(spyAxios).toHaveBeenNthCalledWith(1, 'https://pokeapi.co/api/v2/pokemon/?offset=0&limit=20')
        expect(spyAxios).toHaveBeenNthCalledWith(2, 'https://pokeapi.co/api/v2/pokemon/?offset=1&limit=20')
    })
})
```

##### 테스트 성공

<p align="left">
    <img src="/images/how-to-test-intersection-observer-2.JPG" width="45%" class="image__border">
</p>

##### 구현 화면

<p align="center">
    <img src="/images/how-to-test-intersection-observer-3.gif" width="100%" class="image__border">
</p>

## CLOSING

사실 `IntersectionObserver`를 리액트에서 쉽게 사용하고 테스트할 수 있는 라이브러리가 있습니다. 

- [react-intersection-observer][react-intersection-observer-link]

사용하는 방법과 테스트 코드를 작성하는 포스트는 다음 포스트 주제로 남기겠습니다.

#### RECOMMEND NEXT POSTS

* [Custom Hook for Intersection Observer][make-custom-hook-for-intersection-observer-link]

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-04-14-how-to-test-intersection-observer>

#### REFERENCE

- <https://developer.mozilla.org/ko/docs/Web/API/Intersection_Observer_API>
- <https://heropy.blog/2019/10/27/intersection-observer/>
- <https://cross-code.github.io/posts/IntersectionObserver/>
- <https://stackoverflow.com/questions/57008341/jest-testing-react-component-with-react-intersection-observer>
- <https://github.com/jsdom/jsdom/issues/1590>
- <https://www.npmjs.com/package/react-intersection-observer>

[how-to-work-javascript-async-link]: https://junhyunny.github.io/information/javascript/how-to-work-javascript-async/

[react-intersection-observer-link]: https://www.npmjs.com/package/react-intersection-observer

[make-custom-hook-for-intersection-observer-link]: https://junhyunny.github.io/typescript/jest/testing-library/test-driven-development/make-custom-hook-for-intersection-observer/