---
title: "Custom Hook for Intersection Observer"
search: false
category:
  - typescript
  - jest
  - testing-library
  - test-driven-development
last_modified_at: 2022-11-10T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [How to Test Intersection Observer][how-to-test-intersection-observer-link]

## 0. 들어가면서

`IntersectionObserver` 기능을 재사용하기 위해 커스텀 훅(custom hook)을 만들어보았습니다. 
프로젝트에서 필요한 최소한의 기능만 구현하였고, 예전에 사용해봤던 [react-intersection-observer][react-intersection-observer-link] 라이브러리의 인터페이스와 유사한 모습으로 기능을 구현했습니다. 
해당 라이브러리를 사용해도 되지만, 최대한 외부 의존성을 줄이고 공부할 겸 직접 구현해봤습니다. 

커스텀 훅을 만들 때 어떤 함수 인자들을 받을지, 어떤 기능을 제공할지 많이 고민 했는데 다음과 같은 관점에서 [react-intersection-observer][react-intersection-observer-link] 라이브러리를 참고하였습니다. 

* 적절한 관심사의 분리
    * 라이브러리를 사용하는 클라이언트 컴포넌트의 기능과 관련된 함수 인자를 받지 않습니다.
    * 뷰 포트(view port)가 누군지, 타겟(target)이 누군지만 확인합니다.
* 필요한 기능, 유연한 사용성을 제공
    * 타겟을 변경할 수 있도록 레퍼런스 객체를 반환합니다.
    * 타겟이 뷰 포트 내부로 진입했는지 여부만 알려줍니다.

훅을 사용하는 클라이언트는 타겟이 뷰 포트 내부에 진입했는지 여부를 확인하고 적절한 콜백 함수를 호출합니다. 

## 1. Before Applying Custom Hook

[How to Test Intersection Observer][how-to-test-intersection-observer-link] 포스트에서 사용한 코드를 먼저 살펴보겠습니다. 
다음과 같은 부분들이 개선이 필요해보입니다. 

* 전역 변수로 선언된 `interscetionObjserver`, `offset` 변수
* 쿼리 셀렉터(query selector)를 사용해 클래스 명으로 리스트 마지막 엘리먼트(element)를 탐색
* 쿼리 셀렉터를 사용해 `ID`로 뷰 포트 엘리먼트를 탐색
* 조회한 리스트 마지막 객체에 불필요한 플래그 설정
* 코드의 많은 부분을 차지하는 `IntetsectionObserver` 관련 로직

```javascript
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

## 2. Make Custom Hook of Intersection Observer

`IntersectionObserver` 클래스에 관련된 코드를 재사용할 수 있도록 다음과 같이 커스텀 훅으로 만들었습니다. 

* 설명은 가독성을 위해 코드에 주석으로 표시하였습니다.

```typescript
import {useEffect, useMemo, useState} from 'react'

// 테스트 코드에서 사용하는 viewPort 입니다.
let testViewPort: HTMLElement | null

// 테스트 용 viewPort를 반환할 때 존재하지 않으면 body 를 반환합니다.
export const getTestViewPort = () => {
    return testViewPort ? testViewPort : document.body
}

export default () => {

    // 클라이언트가 사용하는 viewPort, targetRef, isInView 는 스테이트(state)로 관리합니다.
    const [viewPort, setViewPort] = useState<any>(null)
    const [targetRef, setTargetRef] = useState<any>(null)
    const [isInView, setInView] = useState<boolean>(false)

    // InterSection Observer 객체를 생성합니다.
    // useMemo 훅을 사용하여 재사용하며 viewPort가 바뀌었을 때만 재정의합니다.
    const intersectionObserver = useMemo<IntersectionObserver>(() => new IntersectionObserver((entries, observer) => {
        // 반복문을 사용해 관찰 대상자들의 상태를 확인합니다.
        entries.forEach((entry, index) => {
            // 관찰 대상자가 view port 내부에 진입했을 때
            if (entry.isIntersecting) {
                // 관찰 대상자가 view port 내부에 진입했음을 상태를 변경하여 알려줍니다.
                setInView(true)
                // 관찰 대상자를 제거합니다.
                observer.unobserve(entry.target)
            }
        })
    }, {
        // 외부에서 지정해준 view port를 사용하지만, 별도로 지정해주지 않았다면 document body를 사용합니다.
        root: viewPort ? viewPort : document.body,
    }), [viewPort])

    // view port 가 변경되면 테스트 용 view port도 변경합니다.
    useEffect(() => {
        testViewPort = viewPort
    }, [viewPort])

    // view 포트가 변경될 때마다 이전에 사용하는 InterSection Observer 객체를 정리합니다.
    useEffect(() => {
        return () => {
            intersectionObserver?.disconnect()
        }
    }, [viewPort])

    // 관찰 대상이 변경될 때마다 실행합니다.
    useEffect(() => {
        // 관찰 대상자가 새롭게 지정되었다면
        if (targetRef) {
            // 새로운 관찰 대상자가 view port 내부에 존재하지 않음을 상태를 변경해서 알려줍니다.
            setInView(false)
            // 새로운 관찰 대상자를 등록합니다.
            intersectionObserver.observe(targetRef)
        }
    }, [targetRef])

    // 클라이언트가 view port, target reference 를 지정할 수 있도록 setter 함수를 제공합니다.
    // 클라이언트가 관찰 대상자의 상태를 확인할 수 있도록 isInView 상태를 제공합니다.
    return {
        viewPort: setViewPort,
        targetRef: setTargetRef,
        isInView,
    }
}
```

## 3. Apply Custom Hook

작성한 커스텀 훅을 이전 코드에 적용하면 코드가 어떻게 변경되는지 살펴보겠습니다. 

* 설명은 가독성을 위해 코드에 주석으로 표시하였습니다.

```typescript
import React, {useCallback, useEffect, useState} from 'react'
import classes from './App.module.css'
import useInViewPort from './hooks/useInViewPort'
import axios from 'axios'

interface Pokemon {
    name: string
}

function App() {

    const [offset, setOffset] = useState<number>(0)
    const [pokemons, setPokemons] = useState<Pokemon[]>([])

    // 커스텀 훅은 클라이언트가 지정할 수 있는 viewPort, targetRef, isInView 상태를 반환합니다.
    const {viewPort, targetRef, isInView} = useInViewPort()

    // offset 이 변경될 때마다 함수를 재정의합니다.
    const fetchData = useCallback(() => {
        axios.get(`https://pokeapi.co/api/v2/pokemon/?offset=${offset}&limit=10`)
            .then(({data: {results}}) => {
                setPokemons((prev) => prev.slice().concat(results))
            })
    }, [offset])

    // 마운트 되는 시점에 데이터를 조회합니다.
    useEffect(() => {
        fetchData()
    }, [])

    // offset 이 변경될 때마다 데이터를 재조회합니다.
    useEffect(() => {
        // offset이 0보다 크면 조회합니다.
        if (offset > 0) {
            fetchData()
        }
    }, [offset])

    // 타겟이 view port 내부로 진입, 새로운 타겟 지정 등으로 isInView 상태가 바뀔 때마다 오프셋을 늘려줍니다.
    useEffect(() => {
        if (isInView) {
            setOffset(prev => prev + 1)
        }
    }, [isInView])

    return (
        // 가장 외부 div 를 view port 로 지정합니다.
        <div ref={viewPort} className={classes.viewPort}>
            {pokemons.map((pokemon, index) => (
                // 리스트를 렌더링할 때 마지막 인덱스에 해당하는 div 를 타겟으로 지정합니다.
                <div key={index} className={classes.box} ref={pokemons.length - 1 === index ? targetRef : null}>
                    {pokemon.name}
                </div>
            ))}
        </div>
    )
}

export default App
```

## 4. Apply to Test Code

### 4.1. setupTests.js

* 테스트가 실행되기 전에 필요한 로직을 추가하는 스크립트 파일입니다.
* `IntersectionObserver` 클래스는 브라우저가 제공하는 Web API 이기 때문에 테스트에 필요한 가짜 클래스를 만들어 등록합니다.
* 자세한 내용은 [How to Test Intersection Observer][how-to-test-intersection-observer-link] 포스트를 참고 바랍니다.

```javascript
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

global.IntersectionObserver = class IntersectionObserver {
    constructor(callback, options) {
        this.viewPort = options.root
        this.entries = []
        this.viewPort?.addEventListener('scroll', () => {
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
        this.entries.push({isIntersecting: true, target})
    }

    unobserve(target) {
        this.entries = this.entries.filter((ob) => ob.target !== target)
    }

    disconnect() {
        this.entries = []
    }
}
```

### 4.2. App.test.tsx

* 커스텀 훅에서 관리하는 테스트 전용 `viewPort`를 사용합니다.
* 쿼리 셀렉터를 사용하지 않아도 테스트가 가능합니다.

```typescript
import React from 'react'
import {fireEvent, render, screen} from '@testing-library/react'
import App from './App'
import axios from "axios";
import {getTestViewPort} from "./hooks/useInViewPort";

test('스크롤 다운 이벤트를 수행하면 다음 리스트를 볼 수 있다.', async () => {
    const spyAxios = jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
            results: [
                {name: '1'},
                {name: '2'},
                {name: '3'},
                {name: '4'},
                {name: '5'},
                {name: '6'},
                {name: '7'},
                {name: '8'},
                {name: '9'},
                {name: '10'},
            ],
        },
    })
    jest.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
            results: [{name: '11'}, {name: '12'}],
        },
    })
    render(<App/>)
    expect(await screen.findByText('10')).toBeInTheDocument()

    fireEvent.scroll(getTestViewPort(), {target: {scrollY: 500}})

    expect(await screen.findByText('11')).toBeInTheDocument()
    expect(spyAxios).toHaveBeenCalledTimes(2)
    expect(spyAxios).toHaveBeenNthCalledWith(1, 'https://pokeapi.co/api/v2/pokemon/?offset=0&limit=10')
    expect(spyAxios).toHaveBeenNthCalledWith(2, 'https://pokeapi.co/api/v2/pokemon/?offset=1&limit=10')
})
```

## CLOSING

이번에 만든 커스텀 훅은 더 개선할 수 있는 여지가 있어 보입니다. 

* `IntersectionObserver` 클래스의 세부적인 옵션을 사용
* 타겟 엘리먼트 별로 뷰 포트에 진입한 여부를 별도로 관리

지금 필요한 기능은 이 정도 구현 수준으로 커버가 가능하기 때문에 기능을 더 추가하진 않았습니다. 
`IntersectionObserver` 클래스의 기능을 커스텀 훅으로 만들 때 이런 방법도 있다는 것을 참고하셔서 더 좋은 코드로 발전시키길 바랍니다. 

##### Infinite Scroll Example

<p align="center">
    <img src="/images/make-custom-hook-for-intersection-observer-1.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-11-10-make-custom-hook-for-intersection-observer>

#### REFERENCE

* <https://junhyunny.github.io/javascript/jest/testing-library/test-driven-development/how-to-test-intersection-observer/>

[how-to-test-intersection-observer-link]: https://junhyunny.github.io/javascript/jest/testing-library/test-driven-development/how-to-test-intersection-observer/

[react-intersection-observer-link]: https://www.npmjs.com/package/react-intersection-observer
