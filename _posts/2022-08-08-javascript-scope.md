---
title: "JavaScript Scope"
search: false
category:
  - javascript
last_modified_at: 2022-08-08T23:55:00
---

<br/>

## 0. 들어가면서

스코프(scope)는 모든 프로그래밍 언어에서 중요한 개념입니다. 
스코프에 대한 개념을 이해하지 못하면 새로운 코드를 작성하거나 이미 작성된 코드를 읽는데 어려움을 겪습니다. 
`JavaScript` 스코프는 다른 언어들과 다른 특징들이 있습니다. 
다소 헷갈리는 부분과 어려운 개념들을 이번 포스트에서 함께 정리하였습니다. 

## 1. 스코프(Scope)

> [모던 자바스크립트 Deep Dive 자바스크립트의 기본 개념과 동작 원리][modern-javascript-book-link]<br/>
> 스코프는 식별자가 유효한 범위를 말한다.

`JavaScript`에서 모든 식별자(변수 이름, 함수 이름, 클래스 이름 등)들은 자신이 선언된 위치에 따라 유효한 범위가 결정됩니다. 
유효한 범위란 선언된 식별자를 다른 코드가 참조할 수 있는지에 대한 여부를 의미합니다. 

### 1.1. 유효한 스코프란?

간단한 코드를 통해 확인할 수 있습니다. 
아래 코드를 브라우저 개발자 도구(F12) 콘솔에서 실행하면 다음과 같은 결과를 얻습니다.

* foo 변수는 전역 스코프(global scope)에 선언합니다.
* bar 변수는 baz 함수 내 지역 스코프(local scope)에 선언합니다.
* 전역에서 `console.log(...)` 함수를 실행합니다.
    * foo 변수는 정상적으로 "Hello" 문자열이 출력됩니다.
    * bar 변수는 `ReferenceError`가 발생합니다.
* foo 변수는 전역에서 유효합니다.
* bar 변수는 전역에서 유효하지 않습니다. 

```javascript
var foo = "Hello";

function baz() {
    var bar = "World";
}

console.log(foo); // Hello
console.log(bar); // Uncaught ReferenceError: bar is not defined
```

### 1.2. 스코프가 필요한 이유

스코프 개념은 식별자의 이름인 변수를 만드는데 중요한 역할을 합니다. 
`ES6(ECMAScript6)` 모듈이 등장하기 전 `JavaScript`는 파일이 분리되어 있더라도 하나의 전역 스코프를 공유하기 때문에 네임스페이스(namespace) 오염이 발생하는 것이 가장 큰 문제였습니다. 
스코프 개념이 없었다면 함수 내 동일한 이름을 가지는 식별자들까지 충돌이 발생하고, 이로 인해 의도치 않은 동작이 일어날 수도 있습니다. 

아래는 동일한 이름을 가진 식별자를 다루는 예시 코드입니다. 
`JavaScript` 엔진은 식별자 결정(identifier resolution)을 통해 같은 이름의 변수들 중에 어떤 변수를 참조할지 결정합니다. 

* foo 변수를 전역 스코프에 선언합니다.
* foo 변수를 bar 함수 내 지역 스코프에 선언합니다.
* bar 함수 실행 시 foo 변수는 "World" 입니다.
* 전역에서 foo 변수는 "Hello" 입니다.

```javascript
var foo = "Hello";

function bar() {
    var foo = "World";
    console.log(foo); // World
}

bar();

console.log(foo); // Hello
```

## 2. 스코프 종류

`JavaScript` 스코프는 전역(global)과 지역(local)로 나눌 수 있습니다. 
예제 코드와 함께 각 스코프의 특징을 살펴보겠습니다.

* 변수 `x` - 전역 스코프
    * 전역은 코드 가장 바깥 영역입니다. 
    * 전역은 전역 스코프를 만듭니다. 
    * 전역 스코프에 변수를 선언하면 전역 변수가 되며 어디서든 참조할 수 있습니다.
    * 브라우저에서 코드를 실행하면 전역 변수들은 `window` 객체를 통해 참조할 수 있습니다.
* 변수 `y`, `x` - 지역 스코프
    * 지역은 함수 몸체 내부 영역입니다.
    * 지역은 지역 스코프를 만듭니다.
    * 지역 스코프에 변수를 선언하면 지역 변수가 됩니다.
    * 지역 변수는 자신이 선언된 지역과 하위 지역에서만 참조할 수 있습니다.
        * 지역 변수 `y`는 자신이 선언된 하위 영역인 bar 함수 내부에서 참조할 수 있습니다.
        * 지역 변수 `y`를 전역에서 참조하는 경우 `ReferenceError`가 발생합니다.

```javascript
var x = "global";

function foo() {
    var y = "local in foo";

    console.log("foo", x); // foo global
    console.log("foo", y); // foo local in foo

    function bar() {
        var x = "local in bar";

        console.log("bar", x); // bar local in bar
        console.log("bar", y); // bar local in foo
    }

    bar();
}

foo();

console.log("global", x); // global global
console.log("global", window.x); // global global
console.log("global", y); // Uncaught ReferenceError: y is not defined
```

## 3. 지역 스코프 레벨

`ES5`까지 `JavaScript`의 지역 스코프는 함수 레벨에서만 유효했습니다. 
`ES6`부터 등장한 변수 선언 키워드인 `let`, `const`를 사용하면 블록 레벨 스코프가 가능합니다. 

### 3.1. 함수 레벨 스코프

예시 코드를 통해 함수 레벨 스코프를 살펴보겠습니다. 

* `var` 키워드로 선언한 변수는 함수 코드 블럭 내에서만 지역 스코프에 포함됩니다.
* if 구문 블럭에서 선언한 foo 변수는 지역 스코프로써 유효하지 않으므로 전역 변수로 취급되며 전역에서 정상적으로 출력됩니다.

```javascript
var empty = "";

if (!empty) {
    var foo = "Hello";
}

console.log(foo); // Hello
```

### 3.2. 블럭 레벨 스코프

다음 예시 코드를 통해 `let`, `const` 키워드로 선언한 변수가 블록 레벨 스코프에서 유효한지 확인 가능합니다.

* `let`, `const` 키워드로 선언한 변수는 코드 블럭 내에 있다면 지역 스코프로 포함됩니다.
* if 구문, for 반복문, while 구문, try-catch 구문 모두 동일하게 적용됩니다.

```javascript
var empty = "";

if (!empty) {
    let foo = "Hello";
}

console.log(foo); // Uncaught ReferenceError: foo is not defined
```

```javascript
try {
    const foo = "Hello";
} catch (e) {
    console.log(e);
}

console.log(foo); // Uncaught ReferenceError: foo is not defined
```

```javascript
for(let index = 0; index < 5; index++) {
    console.log(index); // 0, 1, 2, 3, 4
}

console.log(index); // Uncaught ReferenceError: index is not defined
```

## 4. 스코프 결정 방법 

`JavaScript`를 공부하면서 처음 접한 렉시컬(lexical)이라는 용어를 쫒아가다보니 프로그래밍 언어마다 스코프를 정의하는 방법이 다르다는 사실을 알게 되었습니다. 
간단하게 관련된 내용을 정리하였습니다. 

### 4.1. 렉시컬 스코프(Lexical Scope)

> [Programming Languages Lecture 9 - Lexical Scope, Closures][zach-tatlock-pdf-link]<br/>
> Lexical scope: use environment where function [and variable] is defined

`Java`와 `JavaScript`는 모두 렉시컬 스코프 방식을 사용합니다. 
렉시컬 스코프 방식은 함수가 선언된 위치의 컨텍스트를 사용하여 스코프를 정의합니다. 

아래 예시 코드를 통해 확인해보겠습니다. 

* baz 함수가 선언된 위치는 전역입니다.
* baz 함수 내부에서 사용한 foo 변수는 전역 스코프를 참조합니다.
* bar 함수 내부에서 baz 함수가 호출되면 전역 스코프의 foo 변수 값인 "Hello"가 출력됩니다.
* 만약, 다이나믹 스코프 방식을 따른다면 bar 함수 내에서 baz 함수가 실행되므로 "World"가 출력되어야 합니다.

```javascript
var foo = "Hello";

function baz() {
    console.log(foo); // Hello
}

function bar() {
    var foo = "World";
    baz();
}

bar();
```

### 4.2. 다이나믹 스코프(Dynamic Scope)

> [Programming Languages Lecture 9 - Lexical Scope, Closures][zach-tatlock-pdf-link]<br/>
> Dynamic scope: use environment where function [and variable] is called

`Perl`, `Bash Shell` 같은 오래된 언어들이 사용하는 방식입니다. 
다이나믹 스코프 방식은 함수가 실행된 위치의 컨텍스트를 사용하여 스코프를 정의합니다. 

다음과 같은 쉘(shell) 스크립트를 작성하여 확인해보았습니다. 

* baz 함수가 선언된 위치는 전역입니다.
* bar 함수 내부에서 baz 함수가 실행되면 baz 함수 내부의 foo 변수는 지역 스코프를 참조합니다.
* "World"가 출력됩니다.

```sh
foo="Hello"

baz() {
     echo "$foo" # World
}

bar() {
    foo="World"
    baz # baz call
}

bar # bar call
```

#### RECOMMEND NEXT POSTS

* [JavaScript Scope Chain][javascript-scope-chain-link]

#### REFERENCE

* [모던 자바스크립트 Deep Dive 자바스크립트의 기본 개념과 동작 원리][modern-javascript-book-link]
* [인사이드 자바스크립트 Inside JavaScript 핵심 개념과 원리를 정확하게.][inside-javascript-book-link]
* <https://lsy0581.tistory.com/47>
* <https://ko.javascript.info/bind>
* <https://chati.tistory.com/158>
* <https://bestalign.github.io/dev/lexical-scope-and-dynamic-scope/>
* <https://riptutorial.com/bash/example/8094/dynamic-scoping-in-action>

[modern-javascript-book-link]: http://www.yes24.com/product/goods/92742567
[inside-javascript-book-link]: http://www.yes24.com/product/goods/37157296

[javascript-scope-chain-link]: https://junhyunny.github.io/javascript/javascript-scope-chain/

[zach-tatlock-pdf-link]: https://courses.cs.washington.edu/courses/cse341/14sp/slides/lec09.pdf