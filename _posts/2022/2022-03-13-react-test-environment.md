---
title: "Setup React test environment in Vite"
search: false
category:
  - react
  - vite
  - jest
last_modified_at: 2022-03-13T23:55:00
---

<br/>

## 0. 들어가면서

CRA(Create React App)를 사용하면 테스트 환경까지 구성해준다. Vite 번들러를 사용하면 리액트 프로젝트를 만들면 테스트 코드를 위한 환경이 구성되어 있지 않다. 이번 글은 Vite 번들러에서 테스트 환경을 구축하는 방법에 대해 정리했다. 이 글을 참조할 때는 다음 내용을 주의하길 바란다.

- 이 글은 리액트 17버전을 사용한다. 
- 현 시점 Vite 최신 버전을 사용하면 리액트 18 버전이 설치된다. 
- 리액트 18 버전을 사용하면 이 글에서 소개하는 환경 구축이 잘 되지 않을 수 있다.

이 글에서 사용한 패키지 정보는 다음과 같다.

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

## 1. Create React App with Vite

터미널에서 명령어로 프로젝트를 쉽게 생성할 수 있다.

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

프로젝트 구조는 다음과 같다. 

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

## 2. Setup test environment

필요한 라이브러리를 설치한다. 

- @babel/preset-env 
  - 타겟 환경에 필요한 구문 변환, 브라우저 폴리필(polyfill)을 제공한다.
- @babel/preset-react 
  - `JSX`로 작성된 코드들을 `createElement` 함수를 이용한 코드로 변환한다.
- @babel/plugin-transform-runtime 
  - 바벨이 트랜스파일링하는 과정에서 폴리필이 필요한 부분을 내부 헬퍼 함수로 치환한다.
- @testing-library/jest-dom 
  - `Jest`를 위한 DOM 요소 매쳐(matcher)들을 제공한다.
- @testing-library/react 
  - 리액트를 위한 테스트 라이브러리다.
- @testing-library/user-event 
  - 사용자의 이벤트를 발생시킬 수 있는 라이브러리다.
- identity-obj-proxy 
  - 임포트(import)한 CSS 모듈 등을 목(mock) 데이터로 사용할 수 있게 도와주는 라이브러리다.
- jest 
  - 테스트 라이브러리다.

``` 
$ npm install -D @babel/preset-env\
  @babel/preset-react\
  @babel/plugin-transform-runtime\
  @testing-library/jest-dom\
  @testing-library/react\
  @testing-library/user-event\
  identity-obj-proxy\
  jest
npm WARN deprecated source-map-resolve@0.6.0: See https://github.com/lydell/source-map-resolve#deprecated

added 610 packages, and audited 611 packages in 13s

33 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

### 2.1. .babelrc

바벨(babel) 설정이 필요하다.

- presets
  - 목적에 맞게 여러 개의 플러그인들을 모아 놓은 프리셋들을 추가한다.
- plugins
  - 실제 변환 작업을 처리하는 플러그인들을 추가한다.

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

### 2.2. jest.config.js

테스트 라이브러리 Jest를 위한 설정이 필요하다. 아래에서 언급하지 않는 속성은 이 [링크](https://jestjs.io/docs/configuration)를 참고하길 바란다.

- `testEnvironment`
  - 테스트 환경을 지정한다. 
  - 기본 값은 `"node"`이다.
- `moduleNameMapper`
  - 이미지, 스타일 같은 리소스들에 대한 스터빙(stubbing)을 처리할 모듈을 지정한다.
- `setupFilesAfterEnv`
  - 테스트 코드가 실행되기 전에 테스팅 프레임워크 설정을 위한 코드를 수행시킬 모듈의 경로를 지정한다.
- `testMatch`
  - 테스트 대상 파일들의 경로들을 지정한다.
- `transformIgnorePatterns`
  - 변환 대상이 아닌 경로들을 지정한다.

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

이미지 리소스 스터빙을 위해 사용하는 `fileMock.js` 파일은 직접 선언해야 한다. `/__mocks__` 경로에 fileMock.js 파일을 만들고 다음 코드를 추가한다.

```js
module.exports = 'test-file-stub'
```

### 2.4. jest.setup.js

테스트 코드가 실행되기 전에 동작하는 `jest.setup.js` 파일에 아래 임포트(import) 구문을 추가한다.

```js
import '@testing-library/jest-dom'
```

### 3. Run Test Code

테스트 코드 App.test.jsx 파일을 만들고 다음과 같은 테스트 코드를 작성한다. 기본으로 작성된 코드를 대상으로 테스트 코드를 작성한다.

```jsx
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import userEvent from "@testing-library/user-event";

describe("App", () => {
  it("renders App", () => {
    render(<App />);

    expect(screen.getByText("Hello Vite + React!")).toBeInTheDocument();
  });

  it("click count button", async () => {
    render(<App />);

    userEvent.click(screen.getByText(/count is: /i));

    await waitFor(() => {
      expect(screen.getByText("count is: 1")).toBeInTheDocument();
    });
  });
});
```

테스트 코드를 실행하면 정상적으로 통과한다.

<div align="left">
  <img src="/images/posts/2022/react-test-environment-01.png" width="70%" class="image__border">
</div>

## 4. Errors when setup test environment

테스트 코드를 실행할 때 만난 에러들에 대해 정리했다.

### 4.1. SyntaxError - Cannot use import statement outside a module

다음과 같은 에러를 만난다. 

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

jest.setup.js 파일에서 `import` 구문을 정상적으로 인식하지 못하는 케이스다. .babelrc 파일 presets 설정에 `@babel/preset-env`을 추가하면 해당 에러가 해결된다.

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

### 4.2. SyntaxError - Unexpected token '<'

logo.svg 파일의 `<` 문자를 정상적으로 인식하지 못하는 에러가 발생한다.

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

jest.config.js 파일의 moduleNameMapper 속성에 스타일, svg 리소스 관련 설정을 추가한다. 

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

### 4.3. TypeError - symbol is not a function

`<img>` 태그를 함수로 인식하지 못하는 문제가 발생한다. 

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

jest.config.js 파일의 moduleNameMapper 속성에 이미지 리소스 관련 속성에 위에서 만든 목(mock) 파일 경로를 지정해준다.

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

fileMock.js 파일 내용은 다음과 같다.

```js
module.exports = 'test-file-stub'
```

### 4.3. toBeInTheDocument is not a function 

Jest에서 제공하는 toBeInTheDocument 함수를 인식하지 못한다. 

```
expect(...).toBeInTheDocument is not a function
TypeError: expect(...).toBeInTheDocument is not a function
    at Object.<anonymous> (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/src/App.test.jsx:9:57)
    at Promise.then.completed (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/node_modules/jest-circus/build/utils.js:391:28)
    at new Promise (<anonymous>)
    at callAsyncCircusFn (/Users/junhyunk/Desktop/workspace/toy-projects/web-crawler/node_modules/jest-circus/build/utils.js:316:10)
    ...
```

`jest.config.js` 파일에 테스트 실행을 위한 설정 코드가 작성된 jest.setup.js 파일의 경로를 지정한다. 

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

### 4.4. ReferenceError - document is not defined

테스트 환경의 HTML 문서에서 돔(dom) 정보를 파싱하지 못하는 에러가 발생한다.

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

jest.config.js 파일에 `testEnvironment` 속성을 `jsdom`으로 지정한다.

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

### 4.5. ReferenceError - React is not defined

`React` 모듈을 찾지 못한다.

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

.babelrc 파일에 추가한 `@babel/preset-react` 런타임 설정을 `automatic`으로 변경한다.

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

### 4.6. ReferenceError - regeneratorRuntime is not defined

이 문제는 `async/await` 문법을 해석하기 위한 `regenerator`가 제공되지 않아 발생한다.

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

.babelrc 파일에 `@babel/plugin-transform-runtime`을 플러그인에 추가한다. 

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

[esm-link]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
[react-test-environment-link]: https://marshallku.com/web/tips/react-%ED%85%8C%EC%8A%A4%ED%8A%B8-%ED%99%98%EA%B2%BD-%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0
[regenerator-runtime-error-link]: https://velog.io/@haebin/React-regeneratorRuntime-is-not-defined-%EC%97%90%EB%9F%AC-%ED%95%B4%EA%B2%B0
