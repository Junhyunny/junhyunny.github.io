---
title: "this Binding in JavaScript"
search: false
category:
  - javascript
last_modified_at: 2022-08-20T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Create Object in JavaScript][create-object-in-javascript-link]
* [Scope in JavaScript][javascript-scope-link]
* [Scope Chain in JavaScript][javascript-scope-chain-link]

## 0. 들어가면서

`JavaScript`의 `this` 키워드는 묘합니다. 
어떤 때는 의도한대로 동작하고, 다른 때는 `this` 객체의 필요한 프로퍼티(property)가 `undefined`이기도 합니다. 
`this` 키워드가 바인딩 되는 규칙을 정확히 알기 위해 이번 포스트를 정리하였습니다. 

## 1. 스코프 결정 방법

`this` 키워드 바인딩 규칙에 대해 알아보기 전에 `JavaScript`의 스코프 결정 방법을 다시 정리해보겠습니다. 

### 1.1. 렉시컬 스코프(Lexical Scope)

> [Programming Languages Lecture 9 - Lexical Scope, Closures][zach-tatlock-pdf-link]<br/>
> Lexical scope: use environment where function [and variable] is defined

`Java`, `JavaScript`는 모두 렉시컬 스코프 방식을 사용합니다. 
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

### 1.2. 다이나믹 스코프(Dynamic Scope)

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

## 2. function 함수 호출 시 this 바인딩

`function` 키워드로 정의된 함수 호출 시 `this` 바인딩은 다이나믹 스코프 방식처럼 함수를 호출하는 시점에 결정됩니다. 
몇 가지 예시 코드들을 확인해보겠습니다. 
아래 코드들을 브라우저 개발자 도구(F12) 콘솔에서 실행하고, 결과를 얻습니다. 

### 2.1. 일반 함수 호출

* 모든 콘솔 로그가 로컬 스코프에 동일한 이름을 가진 변수에 저장된 값이 아닌 `global`로 출력됩니다. 
* `this` 키워드에 `window`가 바인딩됩니다. 
* 호출하는 시점에 해당 함수를 누가 호출했는지에 따라 `this` 키워드 바인딩이 결정됩니다. 
    * `foo` 함수를 호출하는 주체가 별도로 없으므로 `window` 객체가 바인딩됩니다. 
    * `bar` 함수를 호출하는 주체가 별도로 없으므로 `window` 객체가 바인딩됩니다. 
    * `baz` 함수를 호출하는 주체가 별도로 없으므로 `window` 객체가 바인딩됩니다. 

```javascript
var x = 'global'

function foo() {

    var x = 'local foo'
    console.log(this.x) // global

    function bar() {
    
        var x = 'local bar'
        console.log(this.x) // global 
        
        function baz() {
    
            var x = 'local baz'
            console.log(this.x) // global
        }
        
        baz()
    }
    
    bar()
}

console.log(window.x) // global

foo()
```

### 2.2. 리터럴 객체 메서드 호출

* `bar` 메서드 내부 콘솔 로그에선 `foo variable`이 출력됩니다.
    * `bar` 메서드를 호출한 주체는 `foo` 객체입니다.
    * `this` 키워드에 `foo` 객체가 바인딩되고, `foo` 객체의 `x` 프로퍼티 값이 출력됩니다.
* `baz` 중첩 함수 내부 콘솔 로그에선 `global`이 출력됩니다.
    * `bar` 메서드 내부에서 호출되었지만, `baz` 함수를 호출한 주체가 별도로 없으므로 `this` 키워드에 `window` 객체가 바인딩됩니다.

```javascript
var x = 'global'

const foo = {
    x: 'foo variable',
    bar() {
        console.log(this.x) // foo variable

        // 메서드 내 중첩 함수
        function baz() {
            console.log(this.x) // global
        }

        baz()
    }
}

foo.bar()
```

### 2.3. 콜백(Callback) 함수 호출

* bar 함수 내부 콘솔 로그에선 `foo variable`이 출력됩니다.
    * `bar` 함수를 호출한 주체는 `foo` 객체입니다.
    * `this` 키워드에 `foo` 객체가 바인딩되고, `foo` 객체의 `x` 프로퍼티 값이 출력됩니다.
* `setTimeout`의 콜백 함수 내부 콘솔 로그에선 `global`이 출력됩니다.
    * WebAPI 기능의 콜백 함수로 호출되어 `this` 키워드에 `window` 객체가 바인딩됩니다.
* `fetch`의 콜백 함수 내부 콘솔 로그에선 `global`이 출력됩니다.
    * WebAPI 기능의 콜백 함수로 호출되어 `this` 키워드에 `window` 객체가 바인딩됩니다.

```javascript
var x = 'global'

const foo = {
    x: 'foo variable',
    bar() {
        console.log(this.x) // foo variable
        
        setTimeout(function() {
            console.log(this.x) // global
        }, 1000)

        fetch('https://www.naver.com/', {
            method: 'GET'
        }).then(function(response) {
            console.log('success - ', this.x) // success - global
        }).catch(function(error) {
            console.log('error - ', this.x) // error - global
        })
    }
}

foo.bar()
```

### 2.4. 객체 변경 후 메서드 호출

* console.log(foo.getVariable()) 호출 시 `foo variable` 값이 출력됩니다.
    * `foo variable` 값이 출력됩니다.
    * `getVariable` 메서드를 호출한 주체가 `foo`이므로 `this` 키워드에 `foo` 객체가 바인딩됩니다.
* console.log(bar.getVariable()) 호출 시 `bar variable` 값이 출력됩니다.
    * `bar variable` 값이 출력됩니다.
    * `getVariable` 메서드를 호출한 주체가 `bar`이므로 `this` 키워드에 `bar` 객체가 바인딩됩니다.
* console.log(getVariable()) 호출 시 `global` 값이 출력됩니다.
    * `global` 값이 출력됩니다.
    * `getVariable` 메서드를 호출하는 주체가 별도로 없으므로 `window` 객체가 바인딩됩니다. 

```javascript
var x = 'global'

const foo = {
    x: 'foo variable',
    getVariable() {
        return this.x
    }
}

console.log(foo.getVariable()) // foo variable

const bar = {
    x: 'bar variable'
}

bar.getVariable = foo.getVariable

console.log(bar.getVariable()) // bar variable

const getVariable = foo.getVariable

console.log(getVariable()) // global
```

### 2.5. 생성자 함수

* 생성자 함수의 `this` 키워드는 생성자 함수를 통해 만들어지는 객체에 바인딩됩니다.
    * `new` 키워드와 함께 사용해야지 생성자 함수로써 동작합니다.
    * `new` 키워드 없이 호출하는 경우 일반 함수와 동일하게 동작합니다.
* `Foo` 함수를 호출하는 경우 내부 `this` 키워드에 `window` 객체가 바인딩되어 전역 변수 `x`의 값이 변경됩니다.

```javascript
var x = 'global'

function Foo(x) {
    this.x = x;
    this.getVariable = function() {
        return this.x
    };
}

const foo = new Foo('foo variable')

console.log(foo.getVariable()) // foo variable

Foo('change global variable')

console.log(x) // change global variable
console.log(window.getVariable()) // change global variable
```

## 3. 화살표 함수 호출 시 this 바인딩

화살표 함수(arrow function)은 `function` 키워드로 정의한 함수와 다른 방식으로 `this` 키워드를 바인딩합니다. 
함수 자체에 `this` 바인딩을 갖지 않습니다. 
화살표 함수 내부에서 `this`를 참조하면 상위 스코프의 `this`를 그대로 참조합니다.  
`렉시컬 this`(lexical this)라고도 부르며 렉시컬 스코프와 마찬가지로 선언된 위치에 따라 `this` 키워드에 바인딩되는 값이 결정됩니다. 

몇 가지 예제 코드를 통해 확인해보도록 하겠습니다.

### 3.1. 일반 함수 호출

* 화살표 함수가 전역 함수라면 화살표 함수의 `this` 키워드는 상위 스코프의 `this(= window)`를 참조합니다.

```javascript
var x = 'global'

const foo = () => {
    console.log(this.x) // global
}

foo()
```

### 3.2. 리터럴 객체 메서드 호출

* `foo` 객체
    * `foo` 객체의 `bar` 메서드를 화살표 함수로 선언합니다.
    * 상위 스코프의 `this`를 참조하므로 `window` 객체가 바인딩됩니다.
    * 중첩 함수인 `baz` 함수를 화살표 함수로 선언합니다.
    * 상위 스코프의 `this`를 참조하므로 `window` 객체가 바인딩됩니다.
* `foobar` 객체
    * `foobar` 객체의 `bar` 함수를 일반 함수로 선언합니다.
    * `bar` 메서드를 호출한 주체인 `foobar` 객체에 `this`가 바인딩됩니다.
    * 중첩 함수인 `baz` 함수를 화살표 함수로 선언합니다.
    * 상위 스코프의 `this`를 참조하므로 `foobar` 객체가 바인딩됩니다.
* 객체의 메서드를 화살표 함수로 바인딩하는 경우 의도치 않게 동작할 수 있으니 주의합니다.

```javascript
var x = 'global'

const foo = {
    x: 'foo variable',
    bar: () => {
        console.log(this.x) // global

        const baz = () => {
            console.log(this.x) // global
        }

        baz()
    }
}

foo.bar()

const foobar = {
    x: 'foobar variable',
    bar() {
        console.log(this.x) // foobar variable

        const baz = () => {
            console.log(this.x) // foobar variable
        }

        baz()
    }
}

foobar.bar()
```

### 3.3. 콜백(Callback) 함수 호출

화살표 함수는 ES6(ECMAScript6) 이전 콜백 함수 내에서 `this` 키워드를 바인딩하지 못하는 문제를 쉽게 해결해줬습니다. 

#### 3.3.1. 화살표 함수 이전 this 바인딩 문제 해결 방법

* 임시 변수 `that`을 만들고 콜백 함수 내부에서 참조하도록 합니다.
* `bind` 함수를 사용하여 `this` 객체를 명시적으로 바인딩해줍니다.

```javascript
const foo = {
    x: 'foo variable',
    bar() {
        var that = this
        
        setTimeout(function() {
            console.log(that.x) // foo variable
        }, 1000)

        setTimeout(function() {
            console.log(this.x) // foo variable
        }.bind(this), 1000)
    }
}

foo.bar()
```

#### 3.3.2. 화살표 함수 사용

* 콜백 함수를 화살표 함수로 선언합니다.
* 상위 스코프의 `this`를 참조하므로 `foo` 객체가 바인딩됩니다.  

```javascript
const foo = {
    x: 'foo variable',
    bar() {
        setTimeout(() => {
            console.log(this.x) // foo variable
        }, 1000)
    }
}

foo.bar()
```

## CLOSING

관련된 내용들을 정리해보니 다음과 같이 정리하면 명확할 것 같습니다. 

* function 키워드로 정의한 함수나 객체의 메서드
    * 호출하는 시점에 누구에 의해 호출되었는지에 따라 `this` 키워드가 바인딩됩니다.
    * 해당 함수를 호출한 주체(객체)가 없다면 전역 객체가 바인딩됩니다.
* 화살표 함수
    * 해당 함수가 선언되는 시점에 상위 스코프의 `this` 객체를 참조합니다.

#### REFERENCE

* [모던 자바스크립트 Deep Dive 자바스크립트의 기본 개념과 동작 원리][modern-javascript-book-link]
* [인사이드 자바스크립트 Inside JavaScript 핵심 개념과 원리를 정확하게.][inside-javascript-book-link]
* [JavaScript this binding 정리](https://medium.com/sjk5766/javascript-this-binding-%EC%A0%95%EB%A6%AC-ae84e2499962)

[modern-javascript-book-link]: http://www.yes24.com/product/goods/92742567
[inside-javascript-book-link]: http://www.yes24.com/product/goods/37157296

[create-object-in-javascript-link]: https://junhyunny.github.io/javascript/create-object-in-javascript/
[javascript-scope-link]: https://junhyunny.github.io/javascript/javascript-scope/
[javascript-scope-chain-link]: https://junhyunny.github.io/javascript/javascript-scope-chain/

[zach-tatlock-pdf-link]: https://courses.cs.washington.edu/courses/cse341/14sp/slides/lec09.pdf