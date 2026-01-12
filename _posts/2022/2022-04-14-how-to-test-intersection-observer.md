---
title: "IntersectionObserver 단위 테스트하기"
search: false
category:
  - javascript
  - jest
  - testing-library
  - test-driven-development
last_modified_at: 2026-01-12T00:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Asynchronous Task In JavaScript][how-to-work-javascript-async-link]

## 0. 들어가면서

무한 스크롤(infinite scroll) 기능을 테스트하기 위한 코드를 작성하면서 만난 에러와 해결하는 과정을 정리했다. 

## 1. Intersection Observer API

`인터셉터 옵저버(Intersection Observer)`는 타겟 엘리먼트(target element)가 관찰하고 있는 화면에 보여지는지 확인하는 Web API 기능이다. 이 글은 인터셉터 옵저버 API를 테스트하는 방법에 대해 정리했기 때문에 간단한 설명만 한다. 아래 용어들에 이해가 필요하다.

- 뷰 포트(View Port)는 관찰하고 있는 영역이다.
- 타겟 엘리먼트(Target Element)는 관심 대상이다.

인터셉터 옵저버는 다음과 같이 동작한다.

- 인터셉터 옵저버는 타겟 엘리먼트와 뷰 포트 사이의 교차(cross)를 관찰한다.
- Web API 기능이므로 메인 스레드에 영향을 주지 않고 비동기적인 콜백 함수 호출로 관찰이 가능하다.

<div align="center">
  <img src="/images/posts/2022/how-to-test-intersection-observer-01.png" width="80%" class="image__border">
</div>
<center>https://cross-code.github.io/posts/IntersectionObserver/</center>

## 2. Example codes

구현 코드, 테스트 코드 순서로 기능을 살펴보겠다. 발생한 에러를 확인하고, 이를 보완하기 위한 방법을 정리헀다.

- `componentDidMount` 시점에 다음과 같은 동작을 수행한다.
  - 포켓몬 API를 사용한 데이터 조회한다.
  - 인터셉터 옵저버 객체를 생성하고 뷰 포트를 등록한다. 인터셉터 옵저버 객체의 콜백 함수에서 현재 타겟을 관찰 대상에서 제거하고, 데이터를 조회한다.
- `componentDidUpdate` 시점에 다음과 같은 동작을 수행한다.
  - `pokemos` 상태가 변경될 때마다 관찰하고 싶은 신규 타겟을 등록한다.
- `componentWillUnmount` 시점에 다음과 같은 동작을 수행한다.
  - 사용한 인터셉터 옵저버 객체를 정리한다.

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

구현 코드를 살펴봤으니 테스트 코드를 작성해보자.

- `axis` 모듈의 `get` 함수를 스터빙(stubbing)한다.
  - 1회 호출 시 이름이 1에서 10까지 숫자를 가지는 객체 리스트 반환한다.
  - 2회 호출 시 이름이 11, 12인 객체 리스트를 반환한다.
- 화면을 렌더링한다.
- `fireEvent`를 이용해 뷰 포트 영역을 스크롤한다.
- 다음과 같은 내용들을 확인한다.
  - 화면에 11이 보이는지 확인한다.
  - `axios` 스파이가 2회 호출되었는지 확인한다.
  - `axios` 스파이가 1번째 호출되었을 때 파라미터를 확인한다.
  - `axios` 스파이가 2번째 호출되었을 때 파라미터를 확인한다.

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

위의 테스트 코드를 실행시키면 다음과 같은 에러가 발생한다. Web API 기능인 IntersectionObserver 생성자를 jsdom 환경에서 찾을 수 없기 때문에 문제가 발생한다.

```
IntersectionObserver is not defined
ReferenceError: IntersectionObserver is not defined
    at /Users/junhyunk/Desktop/workspace/blog-in-action/2022-04-13-how-to-test-intersection-observer/intersection-observer-test/src/intersection-observer/InfiniteScroll.js:31:9
    at invokePassiveEffectCreate (/Users/junhyunk/Desktop/workspace/blog-in-action/2022-04-13-how-to-test-intersection-observer/intersection-observer-test/node_modules/react-dom/cjs/react-dom.development.js:23487:20)
    at HTMLUnknownElement.callCallback (/Users/junhyunk/Desktop/workspace/blog-in-action/2022-04-13-how-to-test-intersection-observer/intersection-observer-test/node_modules/react-dom/cjs/react-dom.development.js:3945:14)
    at HTMLUnknownElement.callTheUserObjectsOperation (/Users/junhyunk/Desktop/workspace/blog-in-action/2022-04-13-how-to-test-intersection-observer/intersection-observer-test/node_modules/jsdom/lib/jsdom/living/generated/EventListener.js:26:30)
    ...
```

이 에러를 해결하려면 가짜 `IntersectionObserver` 클래스를 만들어 제공한다. [스택 오버플로우](https://stackoverflow.com/questions/57008341/jest-testing-react-component-with-react-intersection-observer)를 탐색해보니 보통 다음과 같이 가짜 클래스를 만들어 사용하는 것으로 보인다.

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

목(mock) IntersectionObserver 클래스를 구현한다. 테스트 코드를 위한 구현이므로 최소한의 작업만 수행한다.

- `constructor` 생성자
  - 콜백 함수와 옵션을 전달받는다.
  - `viewPort`를 구현 코드에서 전달한 `root`로 지정한다.
  - `viewPort`에 스크롤 이벤트를 추가한다.
  - 관찰 중인 타겟이 `viewPort`에 존재하는지 판단한다.
  - 콜백 함수를 실행한다.
- `isInViewPort` 함수
  - `jsdom`은 `getBoundingClientRect` 기능을 지원하지 않으므로 실제 브라우저 환경과 동일한 기능을 구현하지 못 한다. ([출처](https://github.com/jsdom/jsdom/issues/1590))
- `observe` 함수
  - 새로운 타겟을 등록한다.
- `unobserve` 함수
  - 해당 타겟을 제거한다.
- `disconnect` 함수
  - 관심 타겟들을 초기화한다.

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

위에서 구현한 목 `IntersectionObserver` 클래스를 윈도우에 등록 후 테스트를 실행한다.

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

위에서 실패했던 단위 테스트는 정상적으로 통과한다.

<div align="left">
  <img src="/images/posts/2022/how-to-test-intersection-observer-02.png" width="45%" class="image__border">
</div>

<br />

구현된 코드가 브라우저에서 정상적으로 동작한다.

<div align="center">
  <img src="/images/posts/2022/how-to-test-intersection-observer-03.gif" width="100%" class="image__border">
</div>

## CLOSING

IntersectionObserver API를 리액트에서 쉽게 사용하고 테스트할 수 있는 라이브러리가 있다. 사용하는 방법과 테스트 코드를 작성하는 포스트는 다음 글의 주제로 작성해 볼 생각이다.

- [react-intersection-observer][react-intersection-observer-link]

Web API 기능이 포함된 비즈니스 로직을 단위 테스트로 검증하는 것은 좋은 방법은 아닌 것 같다. 테스트에 구현이 일부 포함되기 때문에 정확한 검증이 아닐 가능성이 높아진다. 이런 경우 E2E(end-to-end) 테스트를 통해 실제 동작을 테스트하는 것이 신뢰할 수 있는 테스트라는 생각이 들었다.

#### RECOMMEND NEXT POSTS

- [Custom Hook for Intersection Observer][make-custom-hook-for-intersection-observer-link]

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