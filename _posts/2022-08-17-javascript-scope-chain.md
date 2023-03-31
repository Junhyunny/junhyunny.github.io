---
title: "Scope Chain in JavaScript"
search: false
category:
  - javascript
last_modified_at: 2022-08-17T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Scope in JavaScript][javascript-scope-link]

## 1. 스코프 체인(Scope Chain)

> [모던 자바스크립트 Deep Dive 자바스크립트의 기본 개념과 동작 원리][modern-javascript-book-link]<br/>
> 스코프(scope)는 식별자가 유효한 범위를 말한다.

모든 식별자(변수 이름, 함수 이름, 클래스 이름 등)들은 자신이 선언된 위치에 따라 유효한 범위가 결정됩니다. 
ES6(ECMAScript6) 이후로 함수나 블럭(block) 영역을 기준으로 스코프를 만들 수 있습니다. 

`JavaScript`는 if-else, try-catch 구문 등으로 생기는 블럭은 물론이고, 함수 내부에 새로운 함수를 선언함으로써 스코프의 중첩이 발생합니다. 
`JavaScript`는 스코프가 중첩되면서 동일한 이름을 가진 식별자가 상위 스코프에 존재할 때 발생하는 식별자 선택의 모호함을 스코프 체인을 통해 해결합니다. 
또, 현재 스코프에서 찾을 수 없는 식별자를 상위 스코프에서 찾을 때도 스코프 체인을 사용합니다. 

### 1.1. 스코프 중첩

* if 블럭 스코프 내부에서 `console.log(x)`를 수행하면 변수 `x`에 대한 참조가 발생합니다.
* 스코프가 중첩되어 있으므로 참조할 수 있는 변수 `x`의 후보들은 여러 개 존재합니다. 
* `x` 변수를 참조하는 if 블럭 스코프 내에서 선언된 `x` 변수를 찾을 수 있습니다.
* `JavaScript` 엔진은 if 블럭 스코프 내에서 선언된 변수 `x`를 참조하여 `'if block scope'` 문장을 출력합니다.

```javascript
// 전역 스코프
var x = 'global x'

// outer 함수 지역 스코프
function outer() {
    var x = 'outer x'
    var y = 'outer y'

    // inner 함수 지역 스코프
    function inner() {
        var x = 'inner x'
        
        // if 블럭 지역 스코프
        if (x) {
            const x = 'if block scope'
            console.log(x) // if block scope
            console.log(y) // outer y
            console.log(z) // Uncaught ReferenceError: z is not defined
        }
    }

    inner()
}

outer()
```

### 1.2. 스코프 체인을 통한 식별자 탐색

스코프 체인을 통한 식별자 탐색 과정은 다음과 같이 일어납니다.

* 최상위 스코프는 전역 스코프입니다.
* 하위 스코프에서 상위 스코프로 스코프 체인을 따라 단방향 탐색만 수행됩니다.
    * 단방향 탐색이기 때문에 상위 스코프에서 하위 스코프의 식별자를 찾을 수 없습니다. 
* 식별자를 참조할 때 `JavaScript` 엔진은 다음과 같은 과정을 수행합니다.
    * 식별자 탐색은 식별자를 참조하는 코드의 스코프에서 시작합니다.
    * 현재 스코프에 참조하려는 식별자가 없다면 상위 스코프를 탐색합니다.
    * 참조하는 식별자를 찾은 경우엔 탐색을 중지합니다.
    * 참조하는 식별자를 전역 스코프에서도 찾지 못하는 경우엔 `ReferenceError`가 발생합니다.

<p align="center">
    <img src="/images/javascript-scope-chain-1.JPG" width="50%" class="image__border">
</p>

#### 1.2.1. 식별자 탐색 과정 예시

위 예시 코드를 다시 살펴보면서 식별자 탐색 과정을 정리해보겠습니다. 

* 위 예시 코드에서 `console.log(y)` 실행은 다음과 같이 수행됩니다.
    * 변수 `y`가 if 블럭 스코프에 존재하지 않으므로 상위 inner 함수 스코프를 탐색합니다.
    * 변수 `y`가 inner 함수 지역 스코프에 존재하지 않으므로 상위 outer 함수 스코프를 탐색합니다.
    * 변수 `y`를 outer 함수 스코프에서 찾을 수 있습니다. 
    * `'outer y'` 값을 출력합니다.
* 위 예시 코드에서 `console.log(z)` 실행은 다음과 같이 수행됩니다.
    * 변수 `z`가 if 블럭 스코프에 존재하지 않으므로 상위 inner 함수 스코프를 탐색합니다.
    * 변수 `z`가 inner 함수 지역 스코프에 존재하지 않으므로 상위 outer 함수 스코프를 탐색합니다.
    * 변수 `z`가 outer 함수 지역 스코프에 존재하지 않으므로 상위 전역 스코프를 탐색합니다.
    * 변수 `z`가 전역 스코프에 존재하지 않으므로 `ReferenceError`가 발생합니다.

```javascript
// 전역 스코프
var x = 'global x'

// outer 함수 지역 스코프
function outer() {
    var x = 'outer x'
    var y = 'outer y'

    // inner 함수 지역 스코프
    function inner() {
        var x = 'inner x'
        
        // if 블럭 지역 스코프
        if (x) {
            const x = 'if block scope'
            console.log(x) // if block scope
            console.log(y) // outer y
            console.log(z) // Uncaught ReferenceError: z is not defined
        }
    }

    inner()
}

outer()
```

## 2. 스코프 체인 확인

스코프 체인은 크롬 브라우저 개발자 모드(F12) 콘솔 탭에서 `console.dir` 함수 호출을 통해 확인할 수 있습니다. 

##### 예시 코드

* baz 함수 스코프 내에서 `console.dir(baz)` 함수를 실행합니다.

```javascript
var A = 'Hello'

function foo() {
    var B = 'World'
    function bar() {
        var A = 'Junhyunny'
        if (A) {
            const C = 'JavaScript'
            if (B) {
                const D = 'Post'
                function baz() {
                    console.log(A)
                    console.log(B)
                    console.log(C)
                    console.log(D)
                    console.dir(baz)
                }
            }
        }
        baz()
    }
    bar()
}

foo()
```

##### 크롬 브라우저 콘솔 로그

* `[[Scopes]]` 속성을 열어보면 5개의 스코프들을 확인할 수 있습니다.
* 각 스코프와 스코프에서 선언한 식별자들과 값들이 보입니다.
* 인덱스가 작을수록 식별자 탐색을 먼저 수행할 상위 스코프입니다. 
* `global` 키워드를 통해 맨 마지막 스코프가 전역 스코프임을 확인할 수 있습니다.  

<p align="left">
    <img src="/images/javascript-scope-chain-2.JPG" width="65%" class="image__border">
</p>

## CLOSING
 
식별자 참조 여부에 따라 스코프 체인의 결과가 달라지는 현상을 발견했습니다. 
관련된 레퍼런스(reference)를 찾을 수가 없어서 `StackOverflow`에 문의를 남겼습니다. 

* [Different result of JavaScript scope chain in the Chrome browser][stack-overflow-link]

예시 코드를 변경하여 간략하게 해당 현상에 대해 설명해보겠습니다. 

##### 예시 코드 변경

* `baz` 함수 내부에 다른 변수를 참조하는 코드를 모두 주석합니다. 

```javascript
var A = 'Hello'

function foo() {
    var B = 'World'
    function bar() {
        var A = 'Junhyunny'
        if (A) {
            const C = 'JavaScript'
            if (B) {
                const D = 'Post'
                function baz() {
                    // console.log(A)
                    // console.log(B)
                    // console.log(C)
                    // console.log(D)
                    console.dir(baz)
                }
            }
        }
        baz()
    }
    bar()
}

foo()
```

##### 스코프 체인 생성 결과

다음과 같은 원인이 있지 않을까 추정해봤습니다.

* 스코프 체인은 해당 함수가 반드시 필요한 스코프들로만 이뤄진다고 가정하였습니다.
* 함수 `baz` 선언은 변수 `B`에 영향을 받기 때문에 `Block(foo)` 스코프가 필요합니다.
* 변수 `B`는 함수 `foo`에 선언되어 있기 때문에 `Closure(foo)` 스코프가 필요합니다.
* 글로벌 스코프는 필수입니다.

<p align="left">
    <img src="/images/javascript-scope-chain-3.JPG" width="65%" class="image__border">
</p>

#### REFERENCE

* [모던 자바스크립트 Deep Dive 자바스크립트의 기본 개념과 동작 원리][modern-javascript-book-link]
* [인사이드 자바스크립트 Inside JavaScript 핵심 개념과 원리를 정확하게.][inside-javascript-book-link]

[modern-javascript-book-link]: http://www.yes24.com/product/goods/92742567
[inside-javascript-book-link]: http://www.yes24.com/product/goods/37157296

[javascript-scope-link]: https://junhyunny.github.io/javascript/javascript-scope/

[stack-overflow-link]: https://stackoverflow.com/questions/73397612/different-result-of-javascript-scope-chain-in-the-chrome-browser