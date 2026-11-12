---
title: "Jest에서 모듈 임포트 에러"
publishedAt: "2022-10-15"
updatedAt: "2026-11-12T16:13:43+09:00"
canonicalPath: "/react/jest/module-import-error-on-jest/"
categories:
  - "react"
  - "jest"
summary: "CRA 프로젝트에서 axios 버전을 올린 뒤 Jest 테스트에서 발생한 모듈 임포트 에러의 원인을 분석하고, package.json 설정으로 해결한 과정을 정리했다."
recommendedPosts:
  - title: "Babel"
    href: "https://junhyunny.github.io/information/babel/"
  - title: "Using Module in JavaScript"
    href: "https://junhyunny.github.io/javascript/using-module-in-javascript/"
---

## 1. 문제 현상

리액트 상태 관리 라이브러리에 관한 내용을 정리하려고 CRA(create-react-app) 프로젝트를 만들었다. 간단한 기능을 구현하고 단위 테스트를 실행하는 과정에서 다음과 같은 에러를 만났다.

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

    /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2022-10-15-module-import-error-on-jest/frontend/node_modules/axios/index.js:1
    ({"Object.<anonymous>":function(module,exports,require,__dirname,__filename,jest){import axios from './lib/axios.js';
                                                                                      ^^^^^^

    SyntaxError: Cannot use import statement outside a module

      4 | import {useEffect} from "react";
      5 |
    > 6 | import axios from "axios";
        | ^
      7 |
      8 | function App() {
      9 |

      at Runtime.createScriptFromCode (node_modules/jest-runtime/build/index.js:1728:14)
      at Object.<anonymous> (src/App.js:6:1)
      at Object.<anonymous> (src/App.test.js:2:1)
      at TestScheduler.scheduleTests (node_modules/@jest/core/build/TestScheduler.js:333:13)
      at runJest (node_modules/@jest/core/build/runJest.js:404:19)
      at _run10000 (node_modules/@jest/core/build/cli/index.js:320:7)
      at runCLI (node_modules/@jest/core/build/cli/index.js:173:3)
```

에러 로그에서 다음과 같은 몇 가지 힌트를 얻을 수 있다.

- `App.js` 파일에서 `axios` 모듈을 사용한다.
  - `axios` 모듈은 외부 의존성이므로 프로젝트의 `node_modules` 디렉터리 아래에서 찾을 수 있다.
- Cannot use import statement outside a module
  - 외부 모듈인 `axios`에서 `import` 키워드를 사용해 에러가 발생한다.

## 2. 문제 원인

별다른 설정 없이도 테스트 코드가 정상적으로 동작했던 기억을 바탕으로 이전에 사용한 코드와 어느 부분이 다른지 비교해 봤다.

### 2.1. 의존성 버전 비교

테스트가 정상적으로 동작한 프로젝트는 다음과 같은 버전을 사용했다.

- node - v16.13.0
- @testing-library/jest-dom - ^5.16.1
- @testing-library/react - ^12.1.2
- @testing-library/user-event - ^13.5.0
- axios - ^0.25.0
- react - ^17.0.2
- react-dom - ^17.0.2

이번에 만든 CRA 프로젝트는 다음과 같은 버전을 사용했다.

- node - v16.13.0
- @testing-library/jest-dom - ^5.16.5
- @testing-library/react - ^13.4.0
- @testing-library/user-event - ^13.5.0
- axios - ^1.1.2
- react - ^18.2.0
- react-dom - ^18.2.0

### 2.2. axios 모듈 index.js 파일

버전이 가장 크게 바뀐 `axios`의 `index.js` 파일을 열어 보면 모듈 문법이 바뀐 것을 확인할 수 있다. `axios` ^0.25.0 버전은 `CommonJS` 문법을 따라 모듈을 사용한다.

```javascript
module.exports = require('./lib/axios');
```

반면 `axios` ^1.1.2 버전은 `ECMAScript` 문법을 따라 모듈을 사용한다.

```javascript
import axios from './lib/axios.js';
export default axios;
```

### 2.3. Jest transformIgnorePatterns 설정

`Jest`는 `Node.js` 환경에서 동작하기 때문에 `CommonJS` 문법을 따라 모듈을 사용한다. `ECMAScript` 문법으로 작성된 모듈을 사용하려면 바벨(babel) 같은 트랜스파일러(transpiler)로 코드를 변환해야 한다.

기본적으로 `Jest`는 `node_modules` 하위 디렉터리의 코드를 변환 대상에서 제외한다. `transformIgnorePatterns` 설정 값으로 변환 제외 대상을 지정하는데, 기본(default) 제외 대상에 `node_modules` 디렉터리가 포함되어 있다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/module-import-error-on-jest-01.png" width="60%" class="image__border">
</div>
<center>https://jestjs.io/docs/27.x/configuration#transformignorepatterns-arraystring</center>

### 2.4. 문제 원인 정리

문제를 일으키는 몇 가지 원인을 살펴봤는데, 다음과 같이 정리할 수 있다.

- `axios` 버전이 올라가면서 `CommonJS`가 아닌 `ECMAScript` 문법을 따르는 모듈로 코드가 변경되었다.
- `Jest`는 `Node.js` 환경에서 동작하기 때문에 `CommonJS` 방식으로 모듈을 사용한다.
- `Jest`에서 `ECMAScript` 모듈을 사용하려면 바벨 같은 트랜스파일러로 `CommonJS` 문법에 맞게 변환해야 한다.
- `Jest`는 기본적으로 `node_modules` 폴더를 변환 대상에서 제외한다.
- `axios`의 모듈 사용 방식이 바뀌었는데 `Jest`의 코드 변환 대상에서는 제외되어 테스트 에러가 발생했다.

## 3. 문제 해결 방법

원인을 파악했으니 해결 방법을 찾아봤다. `react-scripts` 명령어가 내부적으로 많은 일을 해 주는 CRA 프로젝트라 그런지 다음 방법들은 실패했다.

- package.json 파일 설정 추가
  - `"type": "module"`
- jest.config.js 설정 파일 사용
  - 바벨 변환 대상 지정
- babel.config.js(혹은 .babelrc) 설정 파일 사용
  - 바벨 프리셋(preset) 지정

결국 `package.json` 파일에 `transformIgnorePatterns` 설정을 추가해 해결했다. 정규식으로 `axios` 모듈 경로만 코드 변환 대상 디렉터리로 지정했다. 여기서 사용한 `X(?!Y)`는 부정형 전방 탐색(negative lookahead) 정규식 패턴이다. "X if not followed by Y", 즉 뒤에 Y 문자열이 붙지 않는 X 문자열과 매칭된다.

실제로 설정에 추가한 `node_modules\/(?!axios)` 정규식을 풀어 설명하면 다음과 같다.

- `axios` 문자열이 붙은 `node_modules/axios` 경로는 이 정규식을 만족하지 못한다.
- 정규식 조건을 만족하지 못하므로 코드 변환 제외 대상이 아니다.
- 즉, `axios` 하위 경로는 코드 변환 대상이므로 `ECMAScript` 모듈이 `CommonJS` 문법에 맞게 변환된다.
- 그 결과 `Jest` 테스트에서 에러가 발생하지 않는다.

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.1.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  ...
  "jest": {
    "transformIgnorePatterns": [
      "node_modules\/(?!axios)"
    ]
  }
}
```

## CLOSING

`StackOverflow`를 찾아보던 중 나와 같은 문제를 겪는 사람의 질문을 발견했다. `Vue.js` 프레임워크를 사용한 프로젝트였지만, 테스트해 보니 같은 방법으로 문제를 해결할 수 있었기에 기쁜 마음으로 관련 정보를 공유했다. `Vue.js` 프레임워크에서 비슷한 문제를 겪는 분들은 아래 답변을 참고하기 바란다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/module-import-error-on-jest-02.png" width="100%" class="image__border">
</div>
<center>https://stackoverflow.com/questions/73958968/cannot-use-import-statement-outside-a-module-with-axios/74079349</center>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-10-15-module-import-error-on-jest>

#### REFERENCE

- <https://jestjs.io/docs/27.x/configuration#transformignorepatterns-arraystring>
- <https://github.com/facebook/create-react-app/issues/9938>
- <https://stackoverflow.com/questions/59878153/how-to-use-jest-config-js-with-create-react-app>
- <https://regexper.com/#node_modules%5C%2F%28%3F!axios%29>
