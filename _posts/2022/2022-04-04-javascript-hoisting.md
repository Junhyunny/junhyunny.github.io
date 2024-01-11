---
title: "Hoisting in JavaScript"
search: false
category:
  - javascript
last_modified_at: 2022-04-04T23:55:00
---

<br/>

## 0. 들어가면서

`JavaScript`의 실행 컨텍스트(exectuion context)를 공부하는데 생각보다 어려웠습니다. 
기본적으로 친숙하지 않은 용어들이 많아서 이해도가 떨어진다는 생각이 들었습니다. 
실행 컨텍스트를 탐구하기 위한 기본적인 지식들을 차근 차근 정리해보겠습니다. 
이번 포스트의 주제는 호이스팅(hoisting)입니다.

## 1. 호이스팅(Hoisting)

> MDN - 호이스팅<br/>
> 인터프리터가 변수와 함수의 메모리 공간을 선언 전에 미리 할당하는 것을 의미합니다. 

다소 말이 어려웠는데, 조금 더 풀어서 정리를 하면 다음과 같습니다. 
- 호이스팅(hoisting)은 `JavaScript` 엔진이 코드를 실행하기 전 선언한 변수나 함수를 실행 컨텍스트에 저장하는 것을 의미합니다.
    - `var`, `let`, `const`, `class`, `function` 등
- 호이스팅을 변수나 함수 선언을 스코프 최상단으로 끌어올리는 일이라고 알려져 있지만, 실제로 변수 선언이나 함수 선언이 스코프 최상단으로 끌어올려지는 것은 아닙니다. 
- 실행 컨텍스트는 코드가 실행되기 위해 필요한 환경이며, `JavaScript` 엔진이 코드를 실행하기 위해 필요한 여러 가지 정보를 가지고 있습니다. 
- 실행 컨텍스트를 만드는 과정에서 선언한 변수나 함수가 모두 등록되기 때문에 선언부보다 먼저 참조나 호출이 가능합니다.
- `let`이나 `const` 키워드로 선언한 변수가 호이스팅이 일어나지 않는 것처럼 보이는 이유는 `TDZ(Temporal Dead Zone)` 때문입니다.

### 1.1. var 키워드 변수

간단한 예제 코드를 이용해 이해를 도와보겠습니다. 

#### 1.1.1. 예시 1

`var` 키워드로 선언한 변수는 선언 위치에 관계 없이 참조나 호출은 가능합니다.

##### 작성한 코드
- `undefined` 값이 출력됩니다.
- 변수 `foo`를 선언하기 전에 `print` 함수에서 사용합니다.
- `foo`라는 이름의 변수가 선언되었음을 인지한 `JavaScript` 엔진은 `undefined` 값을 출력합니다.

{% include codepen.html hash="LYeeLQj" tab="js,result" title="var keyword before hoisting" %}

##### 동작한 코드 모습
- 호이스팅이 일어나면 아래 작성한 코드처럼 동작됩니다.
    - 변수 `foo`가 코드 상단에 선언한 것처럼 동작합니다. 
    - 선언 시 별도 값을 지정하지 않았으므로 `undefined` 값으로 초기화합니다.

{% include codepen.html hash="YzYYQva" tab="js,result" title="var keyword after hoisting" %}

#### 1.1.2. 예시 2

함수를 선언한 경우 함수를 호출하는 코드가 선언한 위치보다 먼저 실행되어도 에러 없이 동작합니다. 
`var` 키워드로 선언한 변수의 호이스팅이 발생하는 유효 범위는 함수 내부입니다.

##### 작성한 코드
- `"hello"` 문자열이 출력됩니다.
- `ReferenceError: bar is not defined` 에러 메시지가 출력됩니다.
- 전역 코드 동작
    - 함수 `foo`를 선언하기 전에 `foo()`로 함수를 호출합니다.
    - 함수 선언이 나중에 되었음에도 함수 호출에 에러가 발생하지 않습니다.
    - `JavaScript` 엔진은 `foo`라는 이름의 함수를 인지하고 있습니다.
- `foo` 함수 내부 동작
    - 변수 `bar`를 `if` 블럭 내부에서 선언하고, `print` 함수에서 사용합니다.
    - 변수 `bar`는 함수 내부에선 사용이 가능하지만, 변수를 선언한 함수 외부에선 사용이 불가능합니다.
    - `print` 함수를 호출하는 시점에 `JavaScript` 엔진은 `if` 블럭 내부에 선언한 `bar` 변수를 인지하고 있습니다.
- 전역에 위치한 `print(bar)` 코드가 실행되면 `ReferenceError: bar is not defined` 에러 메시지를 출력합니다.
- 이 시점에 `JavaScript` 엔진은 `bar`라는 이름의 변수를 인지하지 못하고 있습니다.

{% include codepen.html hash="NWXXgQK" tab="js,result" title="var keyword before hoisting - 2" %}

##### 동작한 코드 모습
- 함수 `foo`의 선언부는 코드 최상단에 위치합니다.
- 변수 `bar`의 호이스팅은 함수 `foo` 내부에서만 동작합니다.
    - `var` 키워드로 선언한 변수의 호이스팅이 발생하는 유효 범위는 함수 블럭 내부입니다.

{% include codepen.html hash="OJzzjbL" tab="js,result" title="var keyword after hoisting - 2" %}

#### 1.1.3. 예시 3

변수와 함수의 호이스팅 적용 우선 순위는 누가 높은지 확인해보겠습니다. 

> StackOverflow<br/>
> Functions are hoisted first, then variable declarations<br/>
> ECMAScript 5, section 10.5 - <https://262.ecma-international.org/5.1/#sec-10.5>

스택 오버플로우를 살펴보면 함수가 먼저 호이스팅 되고, 그 다음 변수가 호이스팅이 발생한다고 합니다. 
다음과 같은 테스트 코드를 통해 확인할 수 있습니다.

##### 작성한 코드
- `function foo() {}`, `function bar() {}`가 출력됩니다.
- `foo` 케이스
    - `var` 키워드로 변수 `foo`를 선언합니다.
    - `foo` 이름의 함수를 선언합니다.
- `bar` 케이스
    - `bar` 이름의 함수를 선언합니다.
    - `var` 키워드로 변수 `bar`를 선언합니다.

{% include codepen.html hash="BaJJdZy" tab="js,result" title="var keyword before hoisting - 3" %}

##### 동작한 코드 모습
- 우선 함수 선언부가 먼저 호이스팅 됩니다. 
    - `foo`, `bar` 이름의 함수가 먼저 코드 위 부분에 선언됩니다.
- `var` 키워드로 선언한 변수가 호이스팅 됩니다.
    - `foo`, `bar` 변수가 코드 최상단에 선언됩니다.
    - 먼저 호이스팅 된 함수보다 위로 올라갑니다.
- 코드의 흐름에 따라 `function foo() {}`, `function bar() {}`가 출력됩니다.

{% include codepen.html hash="eYyyELV" tab="js,result" title="var keyword after hoisting - 3" %}

#### 1.1.4. 예시 4

함수를 선언하는 방식에 따라 호이스팅 결과가 다르게 나타날 수 있습니다. 
`JavaScript`에서 함수를 선언하는 방법은 두 가지 있으며, 이를 먼저 정리하고 예시를 살펴보겠습니다.

##### 함수 선언문
- 일반적인 함수 선언 방식입니다.

```js
function foo() {
    // ...
}
```

##### 함수 표현식
- `JavaScript`에선 함수도 객체이므로 변수에 할당하여 사용할 수 있습니다.
- 익명 함수 표현식 - 함수에 식별자가 주어지지 않습니다.
- 기명 함수 표현식 - 함수의 식별자가 존재합니다.

```js
// (익명) 함수 표현식
var foo = function () {
    // ...
}

// 기명 함수 표현식
var bar = function bar () {
    // ...
}
```

##### 작성한 모습
- `function foo() {}`, `undefined`가 출력됩니다.
- 기명 함수 표현식의 경우 변수를 사용하는 것과 동일한 호이스팅 결과를 가집니다.

{% include codepen.html hash="poppONE" tab="js,result" title="var keyword before hoisting - 4" %}

##### 동작한 코드 모습
- `var` 키워드로 선언한 변수 `bar`는 상단으로 배치되지만 함수 할당은 아래에서 이루어지므로 `undefined`가 출력됩니다.

{% include codepen.html hash="LYeeJxr" tab="js,result" title="var keyword after hoisting - 4" %}

## 2. TDZ(Temporal Dead Zone)

`TDZ`을 알기 전에 우선 변수의 라이프 사이클을 살펴보겠습니다. 

##### 변수 라이프 사이클
- 선언 단계(declaration phase)
    - 변수를 실행 컨텍스트의 변수 객체에 등록합니다.
    - 코드가 실행되기 전 컴파일되는 시점에 실행 컨텍스트에 저장됩니다.
- 초기화 단계(initialization phase)
    - 실행 컨텍스트에 존재하는 변수 객체에 선언 단계의 변수를 위한 메모리를 만듭니다.
    - 값을 `undefined`로 초기화합니다.
- 할당 단계(assignment phase)
    - 사용자가 `undefined`로 초기화된 메모리에 다른 값을 할당합니다.

<p align="center">
    <img src="/images/javascript-hoisting-1.JPG" width="45%" class="image__border">
</p>
<center>https://noogoonaa.tistory.com/78</center>

##### TDZ, Temporal Dead Zone
- 선언 단계와 초기화 단계 사이의 단계를 `TDZ`라고 부릅니다.
- 이 사이에 위치한 변수는 메모리 초기화가 이뤄지지 않았기 때문에 사용 시 에러가 발생합니다.

<p align="center">
    <img src="/images/javascript-hoisting-2.JPG" width="45%" class="image__border">
</p>
<center>https://blog.naver.com/PostView.nhn?blogId=dlaxodud2388&logNo=222284235839</center>

### 2.1. var 키워드 변수의 선언, 초기화 그리고 할당

다음과 같이 `var` 키워드로 선언된 변수 `foo`를 살펴보겠습니다.

##### 테스트 코드

```js
console.log(foo);

var foo;

console.log(foo === undefined);

foo = "value";

console.log(foo === "value");
```

##### 테스트 코드 로그

```
undefined pen.js:44:9
true pen.js:48:9
true pen.js:52:9
```

##### var 변수의 라이프 사이클
- 코드가 실행되기 전 컴파일 과정에서 실행 컨텍스트에 변수 `foo`를 등록합니다.
- 이 때, `var` 키워드로 선언된 변수는 초기화 작업이 함께 이뤄집니다.
    - `foo` 변수에 `undefined` 값이 할당됩니다.
- 실행 컨텍스트에 변수를 저장할 때 선언 단계와 초기화 단계가 한번에 이뤄집니다.
- `var` 키워드로 선언된 변수는 `TDZ`가 존재하지 않습니다.

<p align="center">
    <img src="/images/javascript-hoisting-3.JPG" width="70%" class="image__border">
</p>
<center>https://noogoonaa.tistory.com/78</center>

### 2.2. let 키워드 변수의 선언, 초기화 그리고 할당

다음과 같이 `let` 키워드로 선언된 변수 `bar`를 살펴보겠습니다.

##### 테스트 코드

```js
console.log(bar);

let bar;

console.log(bar === undefined);

bar = "value";

console.log(bar === "value");
```

##### 테스트 코드 로그
- `bar` 변수를 초기화하기 전에 접근할 수 없다는 에러가 발생합니다.
- `JavaScript` 엔진은 변수 `bar`에 존재를 알고는 있지만, 초기화시키지 않고 사용하여 에러를 발생시킵니다.

```
Uncaught ReferenceError: can't access lexical declaration 'bar' before initialization
    <anonymous> pen.js:44
poppxwV:44:1
```

##### let 변수의 라이프 사이클 
- 코드가 실행되기 전 컴파일 과정에서 실행 컨텍스트에 변수 `bar`를 등록합니다.
- 이 때, `let` 키워드로 선언된 변수는 초기화 작업이 함께 이뤄지지 않습니다.
- 코드 실행 중 `let bar;` 코드를 만나면 초기화가 이뤄집니다.
- 실행 컨텍스트에 변수를 저장할 때 변수의 선언 단계만 진행됩니다.

<p align="center">
    <img src="/images/javascript-hoisting-4.JPG" width="70%" class="image__border">
</p>
<center>https://noogoonaa.tistory.com/78</center>

### 2.3. TDZ 영향을 받는 구문

#### 2.3.1. let, const 변수

`let`, `const` 키워드로 선언된 변수는 초기화 전에 사용하면 에러가 발생합니다.

```js
// Does not work!
pi; // throws `ReferenceError`
const pi = 3.14;
```

#### 2.3.2. class 구문

클래스는 선언 전에는 사용할 수 없습니다.

```js
// Does not work!
const myNissan = new Car('red'); // throws `ReferenceError`

class Car {
  constructor(color) {
    this.color = color;
  }
}
```

```js
// 동작하는 코드
class Car {
  constructor(color) {
    this.color = color;
  }
}

// Works!
const myNissan = new Car('red');
myNissan.color; // => 'red'
```

#### 2.3.3. constructor 내부 super()

부모 클래스를 상속받았다면, 생성자 안에서 `super()`를 호출하기 전까지 `this` 바인딩은 `TDZ`에 존재합니다.

```js
class MuscleCar extends Car {
  constructor(color, power) {
    this.power = power;
    super(color);
  }
}

// Does not work!
const myCar = new MuscleCar(‘blue’, ‘300HP’); // `ReferenceError`
```

```js
class MuscleCar extends Car {
  constructor(color, power) {
    super(color);
    this.power = power;
  }
}

// Works!
const myCar = new MuscleCar('blue', '300HP');
myCar.power; // => '300HP'
```

#### 2.4. TDZ 영향을 받지 않는 구문 

다음과 같은 경우 `TDZ` 영향을 받지 않습니다.

#### 2.4.1. var 변수

```js
// Works, but don't do this!
value; // => undefined
var value;
```

#### 2.4.2. function 함수 선언

```js
// Works!
greet('World'); // => 'Hello, World!'
function greet(who) {
  return `Hello, ${who}!`;
}

// Works!
greet('Earth'); // => 'Hello, Earth!'
```

#### 2.4.3. import 구문

```js
// Works!
myFunction();
import { myFunction } from './myModule';
```

## CLOSING

마지막으로 함수의 라이프사이클을 확인하고 포스트를 마치도록 하겠습니다. 

##### 함수의 라이프 사이클
- 3 단계의 변수 라이프 사이클을 모두 동시에 수행합니다.

<p align="center">
    <img src="/images/javascript-hoisting-5.JPG" width="70%" class="image__border">
</p>
<center>https://noogoonaa.tistory.com/78</center>

#### REFERENCE
- <https://developer.mozilla.org/ko/docs/Glossary/Hoisting>
- <https://262.ecma-international.org/5.1/#sec-10.5>
- <https://stackoverflow.com/questions/28246589/order-of-hoisting-in-javascript>
- <https://tecoble.techcourse.co.kr/post/2021-04-25-hoisting/>
- <https://gmlwjd9405.github.io/2019/04/22/javascript-hoisting.html>
- <https://hanamon.kr/javascript-%ED%98%B8%EC%9D%B4%EC%8A%A4%ED%8C%85%EC%9D%B4%EB%9E%80-hoisting/>
- <https://meetup.toast.com/posts/86>
- <https://noogoonaa.tistory.com/78>
- <https://blog.naver.com/PostView.nhn?blogId=dlaxodud2388&logNo=222284235839>
- <https://velog.io/@yogongman/TDZ-Temporal-Dead-Zone>
- <https://ui.toast.com/weekly-pick/ko_20191014?fbclid=IwAR3fiR4wiv8kszL6Fz2KqwHpv-bTL8tNHElRN0q0ky5kpOP5BMqMS0wc-9k>
