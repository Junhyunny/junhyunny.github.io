---
title: "Module Import Error on Jest"
search: false
category:
  - react
  - jest
last_modified_at: 2022-10-15T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Babel][babel-link]
* [Using Module in JavaScript][using-module-in-javascript-link]

## 1. 문제 현상

리액트 상태 관리 라이브러리에 관련된 내용을 정리하고자 CRA(create-react-app) 프로젝트를 만들었습니다. 
간단한 기능을 구현하면서 단위 테스트를 실행하는 과정에 다음과 같은 에러를 만났습니다. 

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

에러 로그를 보면 다음과 같은 몇 가지 힌트들을 얻을 수 있습니다. 

* `App.js` 파일에서 `axios` 모듈을 사용합니다.
    * `axios` 모듈은 외부 의존성이므로 프로젝트 `node_modules` 디렉토리 하위에서 찾을 수 있습니다.
* Cannot use import statement outside a module
    * 외부 모듈인 `axios`에서 `import` 키워드를 사용하여 에러가 발생합니다.

## 2. 문제 원인

별다른 설정 없이도 테스트 코드가 정상적으로 동작했던 기억을 바탕으로 이전에 사용했던 코드와 어느 부분이 다른지 비교해보았습니다. 

### 2.1. 의존성 버전 비교

테스트가 정상적으로 동작한 프로젝트는 다음과 같은 버전을 사용했습니다. 

* node - v16.13.0
* @testing-library/jest-dom - ^5.16.1
* @testing-library/react - ^12.1.2
* @testing-library/user-event - ^13.5.0
* axios - ^0.25.0
* react - ^17.0.2
* react-dom - ^17.0.2

이번에 만든 CRA 프로젝트는 다음과 같은 버전을 사용했습니다. 

* node - v16.13.0
* @testing-library/jest-dom - ^5.16.5
* @testing-library/react - ^13.4.0
* @testing-library/user-event - ^13.5.0
* axios - ^1.1.2
* react - ^18.2.0
* react-dom - ^18.2.0

### 2.2. axios 모듈 index.js 파일

버전이 가장 크게 바뀐 `axios`의 `index.js` 파일을 열어보면 다음과 같이 변경되었음을 확인할 수 있습니다. 

##### axios - ^0.25.0 version

* `CommonJS` 문법을 따라 모듈을 사용합니다.

```javascript
module.exports = require('./lib/axios');
```

##### axios - ^1.1.2 version

* `ECMAScript` 문법을 따라 모듈을 사용합니다.

```javascript
import axios from './lib/axios.js';
export default axios;
```

### 2.3. Jest transformIgnorePatterns 설정

`Jest`는 `Node.js` 환경에서 동작하기 때문에 `CommonJS` 문법을 따라 모듈을 사용합니다. 
`ECMAScript` 문법으로 작성된 모듈을 사용하려면 경우 바벨(babel) 같은 트랜스파일러(transpiler)를 통해 변경이 필요합니다. 

기본적으로 `Jest`는 `node_modules` 하위 디렉토리의 코드들은 변경 대상에서 제외합니다. 
`transformIgnorePatterns` 설정 값을 통해 변경 제외 대상을 지정하는데, 디폴트(default) 제외 대상으로 `node_modules` 디렉토리가 포함되어 있습니다. 

<p align="center">
    <img src="/images/module-import-error-on-jest-1.JPG" width="60%" class="image__border">
</p>
<center>https://jestjs.io/docs/27.x/configuration#transformignorepatterns-arraystring</center>

### 2.4. 문제 원인 정리

문제를 일으키는 몇 가지 원인들을 살펴봤는데, 다음과 같이 정리할 수 있습니다. 

* `axios` 버전이 올라가면서 `CommonJS`이 아닌 `ECMAScript` 문법을 따르는 모듈로 코드가 변경되었습니다. 
* `Jest`는 `Node.js` 환경에서 동작하기 때문에 `CommonJS` 방식으로 모듈을 사용합니다.
* `Jest`는 바벨 같은 트랜스파일러를 통해 `ECMAScript` 모듈을 `CommponJS` 문법에 맞도록 변경 후 사용해야 합니다. 
* `Jest`는 `node_modules` 폴더는 기본적으로 변경 대상에서 제외합니다.
* `axios`의 모듈 사용 방식이 변경되었고, `Jest`의 코드 변경 대상에서 제외되면서 테스트 에러가 발생하였습니다. 

## 3. 문제 해결 방법

원인을 파악했으니 문제 해결 방법을 찾아보았습니다. 
`react-scripts` 명령어가 내부적으로 많은 일을 해주는 CRA 프로젝트라 그런지 아래 방법들은 실패하였습니다. 

* package.json 파일 설정 추가
    * `"type": "module"`
* jest.config.js 설정 파일 사용
    * 바벨 변경 대상 지정
* babel.config.js(혹은 .babelrc) 설정 파일 사용
    * 바벨 프리셋(preset) 지정

### 3.1. package.json 파일

저의 경우 `packaga.json` 파일에 `transformIgnorePatterns` 설정을 추가하여 해결하였습니다. 
다음과 같은 정규식을 통해 `axios` 모듈 경로만 코드 변경 대상 디렉토리로 지정하였습니다.

* `X(?!Y)`
    * negative lookahead 정규식 패턴입니다.
    * X if not followed by Y.
    * Y 문자열이 뒤에 붙지 않는 X 문자열과 매칭됩니다. 

실제로 설정에 추가한 정규식을 풀어 설명하면 다음과 같습니다.

* `node_modules\/(?!axios)`
    * `axios` 문자열이 붙은 `node_modules/axios` 경로는 해당 정규식을 만족하지 못 합니다.
    * 해당 정규식 조건을 만족하지 못 하므로 코드 변경 제외 대상이 아닙니다.
    * 즉, `axios` 하위 경로는 코드 변경 대상이므로 `ECMAScript` 모듈이 `CommonJS` 문법에 맞게 변경됩니다. 
    * 그 결과 `Jest` 테스트에서 에러가 발생하지 않습니다.

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

`StackOverflow`를 탐색하는 과정에서 저와 같은 문제를 겪고 있는 사람의 질문을 발견하였습니다. 
`Vue.js` 프레임워크를 사용한 프로젝트였지만, 테스트 결과 같은 방법으로 문제를 해결할 수 있었기에 기쁜 마음으로 관련 정보를 공유했습니다. 
`Vue.js` 프레임워크에서 비슷한 문제를 겪는 분들은 아래 답변을 참조하시길 바랍니다. 

<p align="center">
    <img src="/images/module-import-error-on-jest-2.JPG" width="80%" class="image__border">
</p>
<center>https://stackoverflow.com/questions/73958968/cannot-use-import-statement-outside-a-module-with-axios/74079349</center>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-10-15-module-import-error-on-jest>

#### REFERENCE

* <https://jestjs.io/docs/27.x/configuration#transformignorepatterns-arraystring>
* <https://github.com/facebook/create-react-app/issues/9938>
* <https://stackoverflow.com/questions/59878153/how-to-use-jest-config-js-with-create-react-app>
* <https://regexper.com/#node_modules%5C%2F%28%3F!axios%29>

[babel-link]: https://junhyunny.github.io/information/babel/
[using-module-in-javascript-link]: https://junhyunny.github.io/javascript/using-module-in-javascript/