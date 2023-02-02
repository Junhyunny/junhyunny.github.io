---
title: "Using Module in JavaScript"
search: false
category:
  - javascript
last_modified_at: 2022-10-14T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Webpack][webpack-link]
* [Babel][babel-link]

## 0. 들어가면서

`JavaScript`는 여러 가지 방법으로 모듈(module)을 정의하고 사용합니다. 
문법에 따라 다양한 모듈 시스템이 생기게 되었는데, 이번 포스트에선 문법 별로 모듈을 정의하고 사용하는 방법에 대해 정리하였습니다. 

## 1. CommonJS

> javascript: not just for browsers any more!

`JavaScript`가 브라우저뿐만 아니라 서버, 데스트톱(desktop) 어플리케이션 같은 곳에서도 사용될 수 있도록 API 기능을 제공합니다. 
`Common`이라는 단어는 브라우저에 얽매이지 않고, `모든 곳에서 사용하자`라는 의미를 담고 있는 것 같습니다. 
`CommonJS`는 다음과 같은 곳에서 사용됩니다. 

* Server-side JavaScript applications
* Command line tools
* Desktop GUI-based applications
* Hybrid applications (Titanium, Adobe AIR)

`CommonJS`는 `Node.js` 같은 서버 어플리케이션을 개발할 수 있는 소프트웨어 플랫폼에서 주로 사용됩니다. 
표준 문법인 `ECMAScript`는 ES6(ECMAScript2015)가 배포되기 전에 모듈이라는 개념이 없었고, `AMD`나 `CommonJS`에서 모듈 개념을 먼저 만들어 사용하고 있었습니다. 
ES6 모듈 시스템은 점점 널리 사용되는 추세이지만, 모든 곳에서 사용할 수 있지 않으므로 `CommonJS`의 모듈 사용 방법은 익힐 필요가 있습니다. 

### 1.1. CommonJS Module 내보내기

#### 1.1.1. exports 키워드

여러 개의 객체를 내보내는 경우 사용합니다. 

##### common-math-first.js 파일

다음과 같은 코드를 통해 함수 객체 여러 개를 모듈로 내보냅니다. 

```javascript
function sum(first, second) {
    return first + second;
}

function substract(first, second) {
    return first - second;
}

exports.sum = sum;
exports.substract = substract;
```

#### 1.1.2. module.exports 키워드

딱 하나의 객체를 내보내는 경우 사용합니다. 

##### common-math-second.js 파일

다음과 같은 코드를 통해 단 하나의 객체를 모듈로 내보냅니다. 

```javascript
module.exports = {
    multiply: function (first, second) {
        return first * second;
    },
    divide: function (dividend, divisor) {
        return dividend / divisor;
    },
};
```

### 1.2. CommonJS Module 사용하기

`require` 함수를 통해 모듈을 사용할 수 있습니다. 

```javascript
const customMathFirst = require("./common-math-first");

console.log(`5 + 3 = ${customMathFirst.sum(5, 3)}`);
console.log(`5 - 3 = ${customMathFirst.substract(5, 3)}`);

const customMathSecond = require("./common-math-second");

console.log(`5 * 3 = ${customMathSecond.multiply(5, 3)}`);
console.log(`5 / 3 = ${customMathSecond.divide(5, 3)}`);
```

##### 모듈 사용 코드 실행 결과

`Node.js`를 사용하여 해당 코드를 실행하면 다음과 같은 결과를 얻을 수 있습니다. 

```
$ node commonjs/test-module.js

5 + 3 = 8
5 - 3 = 2
5 * 3 = 15
5 / 3 = 1.6666666666666667
```

## 2. ECMAScript

표준 문법인 `ECMAScript`도 ES6(ECMAScript2015)부터 모듈을 지원하기 시작했습니다. 
`import` 같은 키워드를 통해 모듈 사용 코드의 가독성을 높였습니다. 
`CommonJS`와 다른 점은 모듈을 내보낼 때 이름을 지정할 수 있습니다. 

### 2.1. ECMAScript Module 내보내기

#### 2.1.1. Named Export

`export` 키워드로 여러 개의 객체를 모듈로 내보낼 수 있습니다. 
내보낼 때 이름을 그대로 사용할 수 있으므로 `Named Export`라고 합니다. 

##### es-math-first.js 파일

다음과 같은 코드를 통해 함수 객체 여러 개에 이름을 지정하여 모듈로 내보냅니다. 

```javascript
export function sum(first, second) {
    return first + second;
}

export function substract(first, second) {
    return first - second;
}
```

#### 2.1.2. Default Export

`export default` 키워드로 하나의 `JavaScript` 모듈 파일에서 기본 객체 한 개를 모듈로 내보낼 수 있습니다. 
하나의 파일에서 한번만 사용할 수 있으며 별도로 이름을 지정하지 않습니다. 

##### es-math-second.js 파일

다음과 같은 코드를 통해 모듈 파일의 기본 객체를 모듈로 내보냅니다. 

```javascript
export default {
    multiply: function (first, second) {
        return first * second;
    },
    divide: function (dividend, divisor) {
        return dividend / divisor;
    },
};
```

### 2.2. ECMAScript Module 사용하기

`import` 키워드를 통해 위에서 지정한 모듈들을 사용할 수 있습니다. 

* `Named Export` 방식을 사용한 `es-math-first.js` 모듈을 사용하는 코드를 자세히 살펴보겠습니다. 
    * 노출한 이름으로 디스트럭처링(destructuring)하여 필요한 객체만 선택적으로 사용 가능합니다.
    * 파일 내 모든 모듈 객체를 `as` 키워드를 통해 다른 이름으로 변경하여 하나의 객체처럼 사용합니다.
* `Node.js` 환경에서 ECMAScript 문법을 사용할 수 있도록 `.js` 확장자를 추가하였습니다.
    * 브라우저 환경에서 실행하는 경우 `.js` 확장자 정보는 필요 없습니다.

```javascript
import { sum, substract } from "./es-math-first.js";
import * as customMathFirst from "./es-math-first.js";

import customMathSecond from "./es-math-second.js";

console.log(`5 + 3 = ${sum(5, 3)}`);
console.log(`5 - 3 = ${substract(5, 3)}`);

console.log(`5 + 3 = ${customMathFirst.sum(5, 3)}`);
console.log(`5 - 3 = ${customMathFirst.substract(5, 3)}`);

console.log(`5 * 3 = ${customMathSecond.multiply(5, 3)}`);
console.log(`5 / 3 = ${customMathSecond.divide(5, 3)}`);
```

##### package.json 파일

브라우저 환경이 아닌 `Node.js` 환경에서 테스트하였으므로 `package.json` 파일에 다음과 같은 추가 설정이 필요합니다. 

```json
{
    "type": "module"
}
```

##### 모듈 사용 코드 실행 결과

`Node.js`를 사용하여 해당 코드를 실행하면 다음과 같은 결과를 얻을 수 있습니다. 

```
$ node ecmascript/test-module.js

5 + 3 = 8
5 - 3 = 2
5 + 3 = 8
5 - 3 = 2
5 * 3 = 15
5 / 3 = 1.6666666666666667
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-10-14-using-module-in-javascript>

#### REFERENCE

* <https://www.commonjs.org/>
* <https://d2.naver.com/helloworld/12864>
* <https://ui.toast.com/weekly-pick/ko_20190418>
* <https://www.daleseo.com/js-module-require/>
* <https://www.daleseo.com/js-module-import/>
* [require vs import 문법 비교 (CommonJS vs ES6)][require-vs-import-link]

[webpack-link]: https://junhyunny.github.io/information/webpack/
[babel-link]: https://junhyunny.github.io/information/babel/

[require-vs-import-link]: https://inpa.tistory.com/entry/NODE-%F0%9F%93%9A-require-%E2%9A%94%EF%B8%8F-import-CommonJs%EC%99%80-ES6-%EC%B0%A8%EC%9D%B4-1