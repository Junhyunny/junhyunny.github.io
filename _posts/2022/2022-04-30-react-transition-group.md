---
title: "React Transition Group"
search: false
category:
  - react
last_modified_at: 2022-04-30T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Slide In/Out Effect][slide-in-out-effect-link]

## 0. 들어가면서

[React Transition Group][react-transition-group-link]이라는 라이브러리를 사용하면 쉽게 애니메이션 효과를 제어할 수 있습니다. 
[Slide In/Out Effect][slide-in-out-effect-link] 포스트에서 만들었던 슬라이드 효과를 예시로 사용 방법에 대해 정리해보았습니다. 

## 1. 리액트 프로젝트

[Slide In/Out Effect][slide-in-out-effect-link] 포스트에서 작성한 코드를 리액트 프로젝트로 옮기면서 변경한 사항들을 먼저 살펴보겠습니다. 

### 1.1. 패키지 구조

```
./
├── README.md
├── package-lock.json
├── package.json
├── public
│   ├── favicon.ico
│   ├── index.html
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
└── src
    ├── App.css
    ├── App.js
    ├── components
    │   ├── Slide.css
    │   └── Slide.js
    ├── index.css
    ├── index.js
    ├── logo.svg
    ├── reportWebVitals.js
    └── setupTests.js

3 directories, 18 files
```

### 1.2. App.js 

- `open` 상태(state)를 이용하여 슬라이드 등장을 제어합니다.
- 슬라이드 부분은 별도 컴포넌트(component)로 만들었습니다.

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


### 1.3. Slider.js

- `count` 상태를 만들고, 슬라이드에서 증가, 감소를 시킵니다.
    - `increase` 함수 - `count` 증가
    - `decrease` 함수 - `count` 감소
- `slideIn` 함수
    - 슬라이드를 등장하는 `on` 클래스를 추가합니다.
    - `useEffect` 함수 내에서 호출합니다.
- `slideOut` 함수
    - 슬라이드를 제거하는 `off` 클래스를 추가합니다.
    - 애니메이션이 끝나는 시간에 맞춰 `on`, `off` 클래스를 제거합니다.
    - 부모 컴포넌트에서 전달받은 `onClose` 함수를 호출합니다.

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

### 1.4. Slider.css

- `on` 클래스가 추가되면 `slideUp` 애니메이션이 동작합니다.
- `off` 클래스가 추가되면 `slideDown` 애니메이션이 동작합니다.

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

CSS 트랜지션(transition) 처리를 쉽게 도와주는 라이브러리입니다. 
`CSSTransition`을 사용하는 간단한 예시 코드를 통해 사용 방법을 알아보겠습니다. 

### 2.1. 설치하기

```
# npm
npm install react-transition-group --save

# yarn
yarn add react-transition-group
```

### 2.2. App.js

- 기존 슬라이드 아래 `CSSTransition` 컴포넌트로 감싼 신규 슬라이드를 추가합니다.
- `CSSTransition` 컴포넌트의 `props`를 살펴보겠습니다.
    - `in` - 이 값을 이용하여 컴포넌트가 보이는 여부를 제어합니다. `boolean` 값이 들어갑니다.
    - `timeout` - 트랜지션에 걸리는 시간을 설정합니다.
    - `classNames` - 트랜지션을 적용할 클래스 이름을 정의합니다.
    - `unmountOnExit` - 자식 컴포넌트를 보여주지 않을 때 `unmount` 시킬 것인지 결정합니다.

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

### 2.3. TransitionSlide.js

- 기존 `Slide.js`에서 불필요한 함수를 제거합니다.
    - `slideIn` 함수 제거
    - `slideOut` 함수 제거

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

### 2.4. Slide.css

> `CSSTransition` 컴포넌트 주석<br/>
> `CSSTransition` applies a pair of class names during the `appear`, `enter` and `exit` states of the transition. 
> The first class is applied and then a second `*-active` class in order to activate the CSS transition. 
> After the transition, matching `*-done` class names are applied to persist the transition state.

- `CSSTransition` 컴포넌트에서 지정한 `classNames`에 접미사를 붙힌 클래스를 정의합니다.
    - `-enter` - 자식 컴포넌트를 마운트(mount)시킬 때 추가되는 클래스
    - `-enter-active` - 자식 컴포넌트의 마운트에 필요한 트랜지션을 활성화하기 위해 2차적으로 붙는 클래스
    - `-exit` - 자식 컴포넌트가 언마운트(unmount)시킬 때 추가되는 클래스
    - `-exit-active` - 자식 컴포넌트의 언마운트에 필요한 트랜지션을 활성화하기 위해 2차적으로 붙는 클래스

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

## 3. 결과

<p align="left">
    <img src="{{ site.image_url_2022 }}/react-transition-group-01.gif" width="65%" class="image__border">
</p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-04-29-react-transition-group>

#### REFERENCE
- <https://junhyunny.github.io/html/css/javascript/slide-in-out-effect/>
- <https://reactcommunity.org/react-transition-group/>

[slide-in-out-effect-link]: https://junhyunny.github.io/html/css/javascript/slide-in-out-effect/
[react-transition-group-link]: https://reactcommunity.org/react-transition-group/