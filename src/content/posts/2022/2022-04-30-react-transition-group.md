---
title: "리액트 트랜지션 그룹(React Transition Group)"
publishedAt: "2022-04-30"
updatedAt: "2026-11-12T16:19:45+09:00"
canonicalPath: "/react/react-transition-group/"
categories:
  - "react"
summary: "슬라이드 인/아웃 효과를 리액트 프로젝트로 옮기고, React Transition Group 라이브러리의 CSSTransition으로 애니메이션을 제어하는 방법을 정리했다."
recommendedPosts:
  - title: "Slide In/Out Effect"
    href: "https://junhyunny.github.io/html/css/javascript/slide-in-out-effect/"
---

## 0. 들어가면서

[React Transition Group][react-transition-group-link] 라이브러리를 사용하면 애니메이션 효과를 쉽게 제어할 수 있다. [Slide In/Out Effect][slide-in-out-effect-link] 글에서 만들었던 슬라이드 효과를 예시로 사용 방법을 정리했다.

## 1. 리액트 프로젝트

[Slide In/Out Effect][slide-in-out-effect-link] 글에서 작성한 코드를 리액트 프로젝트로 옮기면서 변경한 사항을 먼저 살펴보자. 패키지 구조는 다음과 같다.

```
./
├── README.md
├── package-lock.json
├── package.json
├── public
│   ├── favicon.ico
│   ├── index.html
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
└── src
    ├── App.css
    ├── App.js
    ├── components
    │   ├── Slide.css
    │   └── Slide.js
    ├── index.css
    ├── index.js
    ├── logo.svg
    ├── reportWebVitals.js
    └── setupTests.js

3 directories, 18 files
```

`App.js` 파일에선 `open` 상태(state)를 이용해 슬라이드 등장을 제어한다. 슬라이드 부분은 별도 컴포넌트(component)로 만들었다.

```jsx
import './App.css'
import Slide from './components/Slide'
import { useState } from 'react'

function App() {
    const [open, setOpen] = useState(false)

    return (
        <div className="wrapper">
            <div className="container">
                <div className="container__content">
                    <p>Container</p>
                </div>
                <button onClick={() => setOpen(true)}>slide</button>
            </div>
            {open && <Slide onClose={() => setOpen(false)} />}
        </div>
    )
}

export default App
```

`Slide.js` 파일의 `Slide` 컴포넌트는 다음과 같다.

- `count` 상태를 만들고, 슬라이드에서 증가, 감소시킨다.
  - `increase` 함수 - `count` 증가
  - `decrease` 함수 - `count` 감소
- `slideIn` 함수
  - 슬라이드를 등장시키는 `on` 클래스를 추가한다.
  - `useEffect` 함수 안에서 호출한다.
- `slideOut` 함수
  - 슬라이드를 제거하는 `off` 클래스를 추가한다.
  - 애니메이션이 끝나는 시간에 맞춰 `on`, `off` 클래스를 제거한다.
  - 부모 컴포넌트에서 전달받은 `onClose` 함수를 호출한다.

```jsx
import { useEffect, useState } from 'react'

import './Slide.css'

const Slide = ({ onClose }) => {
    const [count, setCount] = useState(0)

    const increase = () => {
        setCount(count + 1)
    }

    const decrease = () => {
        setCount(count - 1)
    }

    const slideIn = () => {
        const slide = document.querySelector('.slide')
        slide.classList.add('on')
    }

    const slideOut = () => {
        const slide = document.querySelector('.slide')
        slide.classList.add('off')
        setTimeout(() => {
            slide.classList.remove('on')
            slide.classList.remove('off')
            onClose()
        }, 950)
    }

    useEffect(() => {
        slideIn()
    }, [])

    return (
        <div className="slide orange">
            <div className="slide__close">
                <button onClick={slideOut}>X</button>
            </div>
            <div className="slide__content">
                <p>{count}</p>
            </div>
            <div className="slide__buttons">
                <button onClick={increase}>+</button>
                <button onClick={decrease}>-</button>
            </div>
        </div>
    )
}

export default Slide
```

`Slide.css` 파일에선 `on` 클래스가 추가되면 `slideUp` 애니메이션이, `off` 클래스가 추가되면 `slideDown` 애니메이션이 동작한다.

```css

/* ... 이 외 스타일 */

.slide.on {
    animation: slideUp 1s;
}

.slide.off {
    animation: slideDown 1s;
}

@keyframes slideUp {
    from {
        transform: translateY(120px);
    }
    to {
        transform: translateY(0);
    }
}

@keyframes slideDown {
    from {
        transform: translateY(0);
    }
    to {
        transform: translateY(120px);
    }
}
```

## 2. React Transition Group

CSS 트랜지션(transition) 처리를 쉽게 도와주는 라이브러리다. `CSSTransition`을 사용하는 간단한 예시 코드로 사용 방법을 알아보자. 먼저 다음 명령어로 라이브러리를 설치한다.

```
# npm
npm install react-transition-group --save

# yarn
yarn add react-transition-group
```

`App.js` 파일에서 기존 슬라이드 아래에 `CSSTransition` 컴포넌트로 감싼 신규 슬라이드를 추가한다. `CSSTransition` 컴포넌트의 `props`는 다음과 같다.

- `in` - 이 값으로 컴포넌트를 보일지 제어한다. `boolean` 값이 들어간다.
- `timeout` - 트랜지션에 걸리는 시간을 설정한다.
- `classNames` - 트랜지션을 적용할 클래스 이름을 정의한다.
- `unmountOnExit` - 자식 컴포넌트를 보여 주지 않을 때 `unmount`할지 결정한다.

```jsx
import './App.css'
import { useState } from 'react'
import { CSSTransition } from 'react-transition-group'

import Slide from './components/Slide'
import TransitionSlide from './components/TransitionSlide'

function App() {
    const [open, setOpen] = useState(false)
    const [transitionOpen, setTransitionOpen] = useState(false)

    return (
        <div className="wrapper">
            <div className="container">
                <div className="container__content">
                    <p>Container</p>
                </div>
                <button onClick={() => setOpen(true)}>slide</button>
                <button onClick={() => setTransitionOpen(true)}>transition slide</button>
            </div>
            {open && <Slide onClose={() => setOpen(false)} />}
            <CSSTransition in={transitionOpen} timeout={1000} classNames="slide" unmountOnExit>
                <TransitionSlide onClose={() => setTransitionOpen(false)} />
            </CSSTransition>
        </div>
    )
}

export default App
```

`TransitionSlide.js` 파일은 기존 `Slide.js` 파일에서 불필요해진 `slideIn` 함수와 `slideOut` 함수를 제거했다.

```jsx
import { useState } from 'react'

const TransitionSlide = ({ onClose }) => {
    const [count, setCount] = useState(0)

    const increase = () => {
        setCount(count + 1)
    }

    const decrease = () => {
        setCount(count - 1)
    }

    return (
        <div className="slide skyblue">
            <div className="slide__close">
                <button onClick={onClose}>X</button>
            </div>
            <div className="slide__content">
                <p>{count}</p>
            </div>
            <div className="slide__buttons">
                <button onClick={increase}>+</button>
                <button onClick={decrease}>-</button>
            </div>
        </div>
    )
}

export default TransitionSlide
```

`Slide.css` 파일에는 트랜지션 클래스를 추가한다. `CSSTransition` 컴포넌트의 주석을 보면 다음과 같다.

> `CSSTransition` 컴포넌트 주석<br/>
> `CSSTransition` applies a pair of class names during the `appear`, `enter` and `exit` states of the transition.
> The first class is applied and then a second `*-active` class in order to activate the CSS transition.
> After the transition, matching `*-done` class names are applied to persist the transition state.

`CSSTransition` 컴포넌트에서 지정한 `classNames`에 다음 접미사를 붙인 클래스를 정의한다.

- `-enter` - 자식 컴포넌트를 마운트(mount)할 때 추가되는 클래스
- `-enter-active` - 자식 컴포넌트의 마운트에 필요한 트랜지션을 활성화하기 위해 이어서 붙는 클래스
- `-exit` - 자식 컴포넌트를 언마운트(unmount)할 때 추가되는 클래스
- `-exit-active` - 자식 컴포넌트의 언마운트에 필요한 트랜지션을 활성화하기 위해 이어서 붙는 클래스

```css

/* ... 이전 설명과 동일 */

/* 신규 추가 클래스 */
.slide-enter {
    transform: translateY(120px);
}

.slide-enter-active {
    transform: translateY(0);
    transition: transform 1s;
}

.slide-exit {
    transform: translateY(0);
}

.slide-exit-active {
    transform: translateY(120px);
    transition: transform 1s;
}
```

결과는 다음과 같다.

<div align="left">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/react-transition-group-01.gif" width="65%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-04-29-react-transition-group>

#### REFERENCE

- <https://junhyunny.github.io/html/css/javascript/slide-in-out-effect/>
- <https://reactcommunity.org/react-transition-group/>

[slide-in-out-effect-link]: https://junhyunny.github.io/html/css/javascript/slide-in-out-effect/
[react-transition-group-link]: https://reactcommunity.org/react-transition-group/
