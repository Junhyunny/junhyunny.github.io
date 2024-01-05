---
title: "Test Environment in React by using Vite"
search: false
category:
  - react
  - vite
  - jest
last_modified_at: 2022-03-13T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Babel][babel-link]

## 0. 들어가면서

`CRA(Create React App)`을 사용하면 테스트 코드를 작성할 수 있는 환경을 함께 만들어줍니다. 
[Native ESM(ECMAScript Module)][esm-link]을 사용하여 빌드가 빠르다는 `Vite`로 리액트 프로젝트를 만들면 기본적인 테스트 코드를 위한 환경이 잡혀있지 않습니다. 
토이 프로젝트를 `Vite`로 시작해보려고 했는데, 테스트 코드를 위한 환경부터 만들어야 했습니다. 
나중에 참고할 겸 간단하게 블로그에 정리하였습니다. 

##### 주의사항

- 해당 포스트를 작성하는 시점에는 리액트 17버전을 사용했습니다. 
- 최근 Vite 버전으로 실행하는 경우 리액트 18 버전으로 설치되면서 아래 방법대로 환경 구축이 되지 않을 수 있습니다.
- 리액트 17 버전에서 사용한 패키지들은 아래와 같습니다.

```json
{
  "name": "web-crawler",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest"
  },
  "dependencies": {
    "@reduxjs/toolkit": "^1.8.0",
    "axios": "^0.26.1",
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "react-redux": "^7.2.6"
  },
  "devDependencies": {
    "@babel/plugin-transform-runtime": "^7.17.0",
    "@babel/preset-env": "^7.16.11",
    "@babel/preset-react": "^7.16.7",
    "@testing-library/jest-dom": "^5.16.2",
    "@testing-library/react": "^12.1.4",
    "@testing-library/user-event": "^13.5.0",
    "@vitejs/plugin-react": "^1.0.7",
    "identity-obj-proxy": "^3.0.0",
    "jest": "^27.5.1",
    "vite": "^2.8.0"
  }
}
```

## 1. 리액트 프로젝트 만들기

##### 프로젝트 생성
- 터미널에서 간단한 명령어를 통해 프로젝트를 생성할 수 있습니다.

```
$ npm create vite@latest web-crawler
✔ Select a framework: › react
✔ Select a variant: › react

Scaffolding project in /Users/junhyunk/Desktop/workspace/toy-projects/web-crawler...

Done. Now run:

  cd web-crawler
  npm install
  npm run dev
```

##### 패키지 구조
- 프로젝트가 생성되면 기본적으로 생기는 패키지 구조입니다.

```
./
├── index.html
├── package-lock.json
├── package.json
├── src
│   ├── App.css
│   ├── App.jsx
│   ├── favicon.svg
│   ├── index.css
│   ├── logo.svg
│   └── main.jsx
└── vite.config.js
```

## 2. 테스트 환경 만들기

### 2.1. 필요한 라이브러리 설치
- 다음과 같은 라이브러리를 설치합니다.
    - @babel/preset-env 
        - 타겟 환경에 필요한 구문 변환, 브라우저 폴리필(polyfill)을 제공합니다.
    - @babel/preset-react 
        - `JSX`로 작성된 코드들을 `createElement` 함수를 이용한 코드로 변환합니다.
    - @babel/plugin-transform-runtime 
        - 바벨이 트랜스파일링하는 과정에서 폴리필이 필요한 부분을 내부 헬퍼 함수로 치환해줍니다.
    - @testing-library/jest-dom 
        - `Jest`를 위한 DOM 요소 매쳐(matcher)들을 제공합니다.
    - @testing-library/react 
        - 리액트를 위한 테스트 라이브러리입니다.
    - @testing-library/user-event 
        - 사용자의 이벤트를 발생시킬 수 있는 라이브러리입니다.
    - identity-obj-proxy 
        - 임포트(import)한 CSS 모듈 등을 목(mock) 데이터로 사용할 수 있게 도와주는 라이브러리입니다.
    - jest 
        - 테스트 프레임워크입니다.

``` 
$ npm install -D @babel/preset-env @babel/preset-react @babel/plugin-transform-runtime @testing-library/jest-dom @testing-library/react @testing-library/user-event identity-obj-proxy jest 
npm WARN deprecated source-map-resolve@0.6.0: See https://github.com/lydell/source-map-resolve#deprecated

added 610 packages, and audited 611 packages in 13s

33 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

### 2.2. .babelrc 파일
- 다음과 같은 설정을 추가합니다.
- presets - 목적에 맞게 여러 개의 플러그인들을 모아놓은 프리셋들을 추가합니다.
- plugins - 실제 변환 작업을 처리하는 플러그인들을 추가합니다.

```json
{
  "env": {
    "test": {
      "presets": [
        "@babel/preset-env",
        [
          "@babel/preset-react",
          {
            "runtime": "automatic"
          }
        ]
      ],
      "plugins": [
        "@babel/plugin-transform-runtime"
      ]
    }
  }
}
```

### 2.3. jest.config.js 파일
- 다른 속성들은 <https://jestjs.io/docs/configuration> 링크를 참조바랍니다. 
- `testEnvironment`
    - 테스트 환경을 지정합니다. 기본 값은 `"node"` 입니다.
- `moduleNameMapper`
    - 이미지, 스타일 같은 리소스들에 대한 스터빙(stubbing)을 처리할 모듈을 지정합니다.
- `setupFilesAfterEnv`
    - 테스트 코드가 실행되기 전에 테스팅 프레임워크 설정을 위한 코드를 수행시킬 모듈의 경로를 지정합니다.
- `testMatch`
    - 테스트 대상 파일들의 경로들을 지정합니다.
- `transformIgnorePatterns`
    - 변환 대상이 아닌 경로들을 지정합니다.

```js
module.exports = {
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '\\.(png|pdf|svg|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|styl|less|sass|scss|svg)$': 'identity-obj-proxy',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testMatch: ['<rootDir>/**/*.test.(js|jsx|ts|tsx)'],
    transformIgnorePatterns: ['<rootDir>/node_modules/', 'dist', 'build'],
}
```

### 2.4. jest.setup.js 파일

```js
import '@testing-library/jest-dom'
```

### 2.5. fileMock.js 파일

```js
module.exports = 'test-file-stub'
```

### 3. 테스트 코드 실행

##### 테스트 코드
- `/src/App.test.jsx` 경로에 테스트 파일을 추가합니다.

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'
import userEvent from '@testing-library/user-event'

describe('App', () => {
    it('renders App', () => {
        render(<App />)

        expect(screen.getByText('Hello Vite + React!')).toBeInTheDocument()
    })

    it('click count button', async () => {
        render(<App />)

        userEvent.click(screen.getByText(/count is: /i))

        await waitFor(() => {
            expect(screen.getByText('count is: 1')).toBeInTheDocument()
        })
    })
})
```

##### 테스트 결과

<p align="left">
    <img src="/images/react-test-environment-1.JPG" width="50%" class="image__border">
</p>

## 4. 테스트 환경 구축 시 마주치는 에러

### 4.1. SyntaxError: Cannot use import statement outside a module

```
  ● Test suite failed to run

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

    By default "node_modules" folder is ignored by transformers.

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option.

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/configuration
    For information about custom transformations, see:
    https://jestjs.io/docs/code-transformation

    Details:

    /Users/junhyunk/Desktop/workspace/toy-projects/web-crawler-test/jest.setup.js:1
    ({"Object.<anonymous>":function(module,exports,require,__dirname,__filename,jest){import '@testing-library/jest-dom';
                                                                                      ^^^^^^

    SyntaxError: Cannot use import statement outside a module

      at Runtime.createScriptFromCode (node_modules/jest-runtime/build/index.js:1728:14)
      at TestScheduler.scheduleTests (node_modules/@jest/core/build/TestScheduler.js:333:13)
```

##### 해결 방법
- `.babelrc` 파일에 `presets` 설정에 `"@babel/preset-env"`을 추가합니다.

```json
{
  "env": {
    "test": {
      "presets": [
        "@babel/preset-env",
        [
          "@babel/preset-react",
          {
            "runtime": "automatic"
          }
        ]
      ],
      "plugins": [
        "@babel/plugin-transform-runtime"
      ]
    }
  }
}
```

### 4.2. SyntaxError: Unexpected token '<'

```
  ● Test suite failed to run

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

    By default "node_modules" folder is ignored by transformers.

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option.

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/configuration
    For information about custom transformations, see:
    https://jestjs.io/docs/code-transformation

    Details:

    /Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/src/logo.svg:1
    ({"Object.<anonymous>":function(module,exports,require,__dirname,__filename,jest){<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 841.9 595.3">
                                                                                      ^

    SyntaxError: Unexpected token '<'

      1 | import { useState } from 'react'
    > 2 | import logo from './logo.svg'
        | ^
      3 | import './App.css'
      4 |
      5 | function App() {

      at Runtime.createScriptFromCode (node_modules/jest-runtime/build/index.js:1728:14)
      at Object.<anonymous> (src/App.jsx:2:1)
```

##### 해결 방법
- `jest.config.js` 파일 변경합니다.
- `moduleNameMapper` 속성에 `'\\.(css|styl|less|sass|scss|svg)$': 'identity-obj-proxy'` 설정 추가합니다.

```js
module.exports = {
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '\\.(png|pdf|svg|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|styl|less|sass|scss|svg)$': 'identity-obj-proxy', // 해당 설정
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testMatch: ['<rootDir>/**/*.test.(js|jsx|ts|tsx)'],
    transformIgnorePatterns: ['<rootDir>/node_modules/', 'dist', 'build'],
}
```

### 4.3. TypeError: symbol is not a function

```
  console.error
    The above error occurred in the <img> component:
    
        at img
        at header
        at div
        at App (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/src/App.jsx:6:31)
    
    Consider adding an error boundary to your tree to customize error handling behavior.
    Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.

      at logCapturedError (node_modules/react-dom/cjs/react-dom.development.js:20085:23)
      at update.callback (node_modules/react-dom/cjs/react-dom.development.js:20118:5)
      at callCallback (node_modules/react-dom/cjs/react-dom.development.js:12318:12)
      at commitUpdateQueue (node_modules/react-dom/cjs/react-dom.development.js:12339:9)
      at commitLifeCycles (node_modules/react-dom/cjs/react-dom.development.js:20736:11)
      at commitLayoutEffects (node_modules/react-dom/cjs/react-dom.development.js:23426:7)
      at HTMLUnknownElement.callCallback (node_modules/react-dom/cjs/react-dom.development.js:3945:14)


symbol is not a function
TypeError: symbol is not a function
    at setValueForProperty (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/node_modules/react-dom/cjs/react-dom.development.js:672:29)
    at setInitialDOMProperties (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/node_modules/react-dom/cjs/react-dom.development.js:8931:7)
    at setInitialProperties (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/node_modules/react-dom/cjs/react-dom.development.js:9135:3)
```

##### 해결 방법
- `/__mocks__/fileMock.js` 경로에 파일을 생성합니다.

```js
module.exports = 'test-file-stub'
```

- `jest.config.js` 파일 설정 변경합니다.
- `moduleNameMapper` 속성에 `'\\.(png|pdf|svg|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js'` 설정 추가합니다.

```js
module.exports = {
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '\\.(png|pdf|svg|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js', // 해당 설정
        '\\.(css|styl|less|sass|scss|svg)$': 'identity-obj-proxy',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testMatch: ['<rootDir>/**/*.test.(js|jsx|ts|tsx)'],
    transformIgnorePatterns: ['<rootDir>/node_modules/', 'dist', 'build'],
}
```

### 4.3. toBeInTheDocument is not a function 

```
expect(...).toBeInTheDocument is not a function
TypeError: expect(...).toBeInTheDocument is not a function
    at Object.<anonymous> (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/src/App.test.jsx:9:57)
    at Promise.then.completed (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/node_modules/jest-circus/build/utils.js:391:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/node_modules/jest-circus/build/utils.js:316:10)
    ...
```

##### 해결 방법
- `jest.config.js` 파일에 프레임워크 구성과 설정을 위해 필요한 모듈 경로를 지정합니다.
- `setupFilesAfterEnv: ['<rootDir>/jest.setup.js']` 추가

```js
module.exports = {
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '\\.(png|pdf|svg|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|styl|less|sass|scss|svg)$': 'identity-obj-proxy',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // 해당 설정
    testMatch: ['<rootDir>/**/*.test.(js|jsx|ts|tsx)'],
    transformIgnorePatterns: ['<rootDir>/node_modules/', 'dist', 'build'],
}
```

### 4.4. ReferenceError: document is not defined

```
document is not defined
ReferenceError: document is not defined
    at render (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/node_modules/@testing-library/react/dist/pure.js:83:5)
    at Object.<anonymous> (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/src/App.test.jsx:7:9)
    at Promise.then.completed (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/node_modules/jest-circus/build/utils.js:391:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/node_modules/jest-circus/build/utils.js:316:10)
    ...
```

##### 해결 방법
- `jest.config.js` 파일에 테스트 환경을 `jsdom`으로 설정합니다.
- `testEnvironment: 'jsdom'` 추가합니다.

```js
module.exports = {
    testEnvironment: 'jsdom', // 해당 설정
    moduleNameMapper: {
        '\\.(png|pdf|svg|jpg|jpeg)$': '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|styl|less|sass|scss|svg)$': 'identity-obj-proxy',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testMatch: ['<rootDir>/**/*.test.(js|jsx|ts|tsx)'],
    transformIgnorePatterns: ['<rootDir>/node_modules/', 'dist', 'build'],
}
```

### 4.5. ReferenceError: React is not defined

```
React is not defined
ReferenceError: React is not defined
    at Object.<anonymous> (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/src/App.test.jsx:6:16)
    at Promise.then.completed (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/node_modules/jest-circus/build/utils.js:391:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/node_modules/jest-circus/build/utils.js:316:10)
    at _callCircusTest (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/node_modules/jest-circus/build/run.js:218:40)
    ...
```

##### 해결 방법
- `.babelrc` 파일에 `"@babel/preset-react"`의 런타임 설정을 `automatic`으로 변경합니다.

```json
{
  "env": {
    "test": {
      "presets": [
        "@babel/preset-env",
        [
          "@babel/preset-react",
          {
            "runtime": "automatic"
          }
        ]
      ],
      "plugins": [
        "@babel/plugin-transform-runtime"
      ]
    }
  }
}
```

### 4.6. ReferenceError: regeneratorRuntime is not defined

```
  ● Test suite failed to run

    ReferenceError: regeneratorRuntime is not defined

      10 |     })
      11 |
    > 12 |     it('click count button', async () => {
         |       ^
      13 |         render(<App />)
      14 |
      15 |         userEvent.click(screen.getByText(/count is: /i))

      at src/App.test.jsx:12:7
      at Object.<anonymous> (src/App.test.jsx:5:1)
      at TestScheduler.scheduleTests (node_modules/@jest/core/build/TestScheduler.js:333:13)
      at runJest (node_modules/@jest/core/build/runJest.js:404:19)
      at _run10000 (node_modules/@jest/core/build/cli/index.js:320:7)
      at runCLI (node_modules/@jest/core/build/cli/index.js:173:3)
```

##### 해결 방법
- `async/await` 문법을 해석하기 위한 `regenerator`를 제공하지 않아서 발생합니다.
- `.babelrc` 파일에 `@babel/plugin-transform-runtime`을 플러그인에 추가합니다. 

```json
{
  "env": {
    "test": {
      "presets": [
        "@babel/preset-env",
        [
          "@babel/preset-react",
          {
            "runtime": "automatic"
          }
        ]
      ],
      "plugins": [
        "@babel/plugin-transform-runtime"
      ]
    }
  }
}
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-03-13-react-test-environment>

#### REFERENCE
- [Native ESM(ECMAScript Module)][esm-link]
- [React 테스트 환경 구축하기][react-test-environment-link]
- [React regeneratorRuntime is not defined 에러 해결][regenerator-runtime-error-link]
- <https://stackoverflow.com/questions/50726141/symbol-is-not-a-function-react-enzyme-i18n-error>
- <https://jestjs.io/docs/webpack>
- <https://jestjs.io/docs/configuration>
- <https://github.com/facebook/jest/issues/9395>

[babel-link]: https://junhyunny.github.io/information/babel/

[esm-link]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
[react-test-environment-link]: https://marshallku.com/web/tips/react-%ED%85%8C%EC%8A%A4%ED%8A%B8-%ED%99%98%EA%B2%BD-%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0
[regenerator-runtime-error-link]: https://velog.io/@haebin/React-regeneratorRuntime-is-not-defined-%EC%97%90%EB%9F%AC-%ED%95%B4%EA%B2%B0