---
title: "Module Import Error on Jest"
search: false
category:
  - react
  - jest
last_modified_at: 2022-10-15T23:55:00
---

<br>

#### RECOMMEND POSTS BEFORE THIS

* [Babel][babel-link]
* [Using Module in JavaScript][using-module-in-javascript-link]

## 1. 문제 현상

리액트의 상태 관리 라이브러리에 관련된 내용을 정리하고자 CRA(create-react-app)로 새로운 프로젝트를 만들었습니다. 
데이터를 조회하고 상태 관리 모듈에 저장하는 간단한 기능을 구현하고, 단위 테스트를 실행할 때 다음과 같은 에러를 만났습니다. 
상세 에러 로그를 보면 다음과 같은 몇 가지 힌트들을 얻을 수 있습니다. 

* `App.js` 파일에서 `axios` 모듈을 사용합니다.
    * `axios` 모듈은 외부 의존성이므로 프로젝트 `node_modules` 경로 하위에서 찾을 수 있습니다.
* Cannot use import statement outside a module 메세지 
    * 외부 모듈인 `axios`에서 `import` 키워드를 사용하여 에러가 발생합니다.

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

## 2. 문제 원인

이전 프로젝트에선 별다른 설정 없이도 테스트 코드가 정상적으로 동작했던 기억을 바탕으로 다른 부분을 비교해봤습니다. 

### 2.1. 의존성 버전 비교

이전 프로젝트는 다음과 같은 버전을 사용했습니다. 

* axios - "^0.25.0"
* react - "^17.0.2"
* react-dom - "^17.0.2"
* @testing-library/jest-dom - "^5.16.1"
* @testing-library/react - "^12.1.2"
* @testing-library/user-event - "^13.5.0"

테스트 프로젝트는 다음과 같은 버전을 사용했습니다. 

* @testing-library/jest-dom - "^5.16.5",
* @testing-library/react - "^13.4.0",
* @testing-library/user-event - "^13.5.0",
* axios - "^1.1.2",
* react - "^18.2.0",
* react-dom - "^18.2.0",

### 2.2. axios 모듈 비교

버전이 가장 크게 변한 `axios` 모듈의 `index.js` 파일을 열어보면 다음과 같이 변경되었음을 확인할 수 있습니다. 

##### ^0.25.0 버전 axios 모듈 index.js 파일

* `CommonJS` 방식으로 모듈을 사용하고, 노출합니다.

```javascript
module.exports = require('./lib/axios');
```

##### ^1.1.2 버전 axios 모듈 index.js 파일

* `ECMAScript` 방식으로 모듈을 사용하고, 노출합니다.

```javascript
import axios from './lib/axios.js';
export default axios;
```

### 2.3. Jest transformIgnorePatterns 설정

`jest`는 `Node.js` 환경에서 동작하기 때문에 `CommonJS` 모듈 방식을 사용합니다. 
`ECMAScript` 모듈 방식을 사용하는 경우 바벨(babel) 같은 트랜스파일러(transpiler)를 통해 변경이 필요합니다. 

기본적으로 `jest`는 `node_modules` 하위 경로의 코드는 변경하지 않고 사용합니다. 
`transformIgnorePatterns` 설정 값으로 변경하지 않는 파일들의 경로를 지정하는데, 디폴트 값으로 `node_modules` 하위 경로가 지정되어 있습니다. 

* transformIgnorePatterns 형식 - [array<string>]
* 디폴트 값 - ["/node_modules/", "\\.pnp\\.[^\\\/]+$"]

### 2.4. 문제 원인 요약하기

다음과 같이 현상을 요약할 수 있을 것 같습니다. 

* `axios` 버전이 올라가면서 `CommonJS`이 아닌 `ECMAScript` 방식으로 모듈을 정의하고 사용합니다.
* `jest`는 `Node.js` 환경에서 동작하기 때문에 `CommonJS` 방식으로 모듈을 사용합니다.
* `jest`는 바벨 같은 트랜스파일러를 통해 `ECMAScript` 모듈을 `CommponJS` 모듈 방식으로 변경 후 사용해야 합니다. 
* `jest`는 `node_modules` 폴더는 기본적으로 변경 대상에서 제외합니다.
* `axios`의 변경된 모듈 사용 방식으로 인해 `jest` 테스트 에러가 발생합니다. 

## 3. 문제 해결 방법

원인을 파악했으니 문제 해결 방법을 찾아보았습니다. 
`react-scripts` 명령어가 내부적으로 많은 일을 수행하는 CRA 프로젝트라 그런지 다음과 같은 해결 방법들은 도움이 되지 않았습니다.

* package.json 파일 설정
    * `"type": "module"` 설정 추가
* jest.config.js 파일 설정
* babel.config.js(혹은 .babelrc) 파일 설정

### 3.1. package.json 파일

저의 경우 `packaga.json` 파일에서 `jest`의 `transformIgnorePatterns` 설정을 재정의하여 해결하였습니다. 
다음과 같은 정규식을 통해 `axios` 모듈 경로만 변경 대상 디렉토리로 지정하였습니다.

* `X(?!Y)`
    * negative lookahead 정규식 패턴입니다.
    * X if not followed by Y.
    * Y 문자열이 뒤에 붙지 않는 X 문자열과 매칭됩니다. 
* `node_modules\/(?!axios)`
    * `node_modules` 하위 경로 중 `axios`라는 이름이 포함된 경로는 변경 제외 대상이 아닙니다.
    * `axios`라는 이름이 포함된 경로를 제외하고 모두 변경 제외 대상입니다.
    * `axios` 경로는 제외 대상이 아니므로 `ECMAScript` 모듈 방식이 `CommonJS` 모듈 방식으로 변경되어 사용됩니다.

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

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-10-15-module-import-error-on-jest>

#### REFERENCE

* <https://jestjs.io/docs/27.x/configuration#transformignorepatterns-arraystring>
* <https://github.com/facebook/create-react-app/issues/9938>
* <https://stackoverflow.com/questions/59878153/how-to-use-jest-config-js-with-create-react-app>
* <https://regexper.com/#node_modules%5C%2F%28%3F!%40shotgunjed%29%5C%2F>

[babel-link]: https://junhyunny.github.io/information/babel/
[using-module-in-javascript-link]: https://junhyunny.github.io/javascript/using-module-in-javascript/