---
title: "자바스크립트 스코프 체인(Scope Chain in JavaScript)"
publishedAt: "2022-08-17"
updatedAt: "2026-11-12T16:18:37+09:00"
canonicalPath: "/javascript/javascript-scope-chain/"
categories:
  - "javascript"
summary: "중첩된 스코프에서 식별자를 탐색하는 스코프 체인을 정리하고, 크롬 브라우저 console.dir 함수로 스코프 체인을 확인하며 발견한 의문점을 기록했다."
recommendedPosts:
  - title: "Scope in JavaScript"
    href: "https://junhyunny.github.io/javascript/javascript-scope/"
---

## 1. 스코프 체인(Scope Chain)

> [모던 자바스크립트 Deep Dive 자바스크립트의 기본 개념과 동작 원리][modern-javascript-book-link]<br/>
> 스코프(scope)는 식별자가 유효한 범위를 말한다.

모든 식별자(변수 이름, 함수 이름, 클래스 이름 등)는 자신이 선언된 위치에 따라 유효한 범위가 결정된다. ES6(ECMAScript6) 이후로 함수나 블록(block) 영역을 기준으로 스코프를 만들 수 있다.

`JavaScript`에서는 if-else, try-catch 구문 등으로 생기는 블록은 물론이고, 함수 내부에 새로운 함수를 선언하면서 스코프가 중첩된다. 스코프가 중첩되면 같은 이름의 식별자가 상위 스코프에도 존재할 때 어떤 식별자를 선택할지 모호해지는데, `JavaScript`는 이를 스코프 체인으로 해결한다. 또, 현재 스코프에서 찾을 수 없는 식별자를 상위 스코프에서 찾을 때도 스코프 체인을 사용한다.

### 1.1. 스코프 중첩

아래 코드의 if 블록 스코프 내부에서 `console.log(x)`를 수행하면 변수 `x`를 참조한다. 스코프가 중첩되어 있으므로 참조할 수 있는 변수 `x`의 후보는 여러 개다. 이때 `x` 변수를 참조하는 if 블록 스코프 안에서 선언된 `x` 변수를 찾을 수 있으므로, `JavaScript` 엔진은 이 변수를 참조해 `'if block scope'` 문장을 출력한다.

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

        // if 블록 지역 스코프
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

스코프 체인을 통한 식별자 탐색 과정은 다음과 같이 일어난다.

- 최상위 스코프는 전역 스코프다.
- 하위 스코프에서 상위 스코프로 스코프 체인을 따라 단방향 탐색만 수행된다.
  - 단방향 탐색이기 때문에 상위 스코프에서 하위 스코프의 식별자를 찾을 수 없다.
- 식별자를 참조할 때 `JavaScript` 엔진은 다음과 같은 과정을 수행한다.
  - 식별자 탐색은 식별자를 참조하는 코드의 스코프에서 시작한다.
  - 현재 스코프에 참조하려는 식별자가 없다면 상위 스코프를 탐색한다.
  - 참조하는 식별자를 찾은 경우엔 탐색을 중지한다.
  - 참조하는 식별자를 전역 스코프에서도 찾지 못하는 경우엔 `ReferenceError`가 발생한다.

<div class="block-break" align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/javascript-scope-chain-01.png" width="50%" class="image__border">
</div>

앞의 예시 코드를 다시 살펴보면서 식별자 탐색 과정을 정리해 보자.

- `console.log(y)` 실행은 다음과 같이 수행된다.
  - 변수 `y`가 if 블록 스코프에 존재하지 않으므로 상위 inner 함수 스코프를 탐색한다.
  - 변수 `y`가 inner 함수 지역 스코프에 존재하지 않으므로 상위 outer 함수 스코프를 탐색한다.
  - 변수 `y`를 outer 함수 스코프에서 찾을 수 있다.
  - `'outer y'` 값을 출력한다.
- `console.log(z)` 실행은 다음과 같이 수행된다.
  - 변수 `z`가 if 블록 스코프에 존재하지 않으므로 상위 inner 함수 스코프를 탐색한다.
  - 변수 `z`가 inner 함수 지역 스코프에 존재하지 않으므로 상위 outer 함수 스코프를 탐색한다.
  - 변수 `z`가 outer 함수 지역 스코프에 존재하지 않으므로 상위 전역 스코프를 탐색한다.
  - 변수 `z`가 전역 스코프에 존재하지 않으므로 `ReferenceError`가 발생한다.

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

        // if 블록 지역 스코프
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

스코프 체인은 크롬 브라우저 개발자 도구(F12) 콘솔 탭에서 `console.dir` 함수를 호출해 확인할 수 있다.

다음 예시 코드는 `baz` 함수 스코프 안에서 `console.dir(baz)` 함수를 실행한다.

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

크롬 브라우저 콘솔 로그에서 `[[Scopes]]` 속성을 열어 보면 5개의 스코프를 확인할 수 있다. 각 스코프와 그 스코프에서 선언한 식별자, 값이 보인다. 인덱스가 작을수록 식별자 탐색을 먼저 수행할 상위 스코프다. `global` 키워드로 맨 마지막 스코프가 전역 스코프임을 확인할 수 있다.

<div align="left">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/javascript-scope-chain-02.png" width="65%" class="image__border">
</div>

## CLOSING

식별자 참조 여부에 따라 스코프 체인의 결과가 달라지는 현상을 발견했다. 관련 레퍼런스(reference)를 찾을 수 없어서 `StackOverflow`에 문의를 남겼다.

- [Different result of JavaScript scope chain in the Chrome browser][stack-overflow-link]

예시 코드를 변경해 이 현상을 간략하게 살펴보자. `baz` 함수 내부에서 다른 변수를 참조하는 코드를 모두 주석 처리한다.

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

이 코드를 실행했을 때 만들어지는 스코프 체인을 보고 다음과 같은 원인이 있지 않을까 추정해 봤다.

- 스코프 체인은 해당 함수에 반드시 필요한 스코프들로만 이뤄진다고 가정했다.
- 함수 `baz` 선언은 변수 `B`에 영향을 받기 때문에 `Block(foo)` 스코프가 필요하다.
- 변수 `B`는 함수 `foo`에 선언되어 있기 때문에 `Closure(foo)` 스코프가 필요하다.
- 글로벌 스코프는 필수다.

스코프 체인 생성 결과는 다음과 같다.

<div align="left">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/javascript-scope-chain-03.png" width="65%" class="image__border">
</div>

#### REFERENCE

- [모던 자바스크립트 Deep Dive 자바스크립트의 기본 개념과 동작 원리][modern-javascript-book-link]
- [인사이드 자바스크립트 Inside JavaScript 핵심 개념과 원리를 정확하게.][inside-javascript-book-link]

[modern-javascript-book-link]: http://www.yes24.com/product/goods/92742567
[inside-javascript-book-link]: http://www.yes24.com/product/goods/37157296

[stack-overflow-link]: https://stackoverflow.com/questions/73397612/different-result-of-javascript-scope-chain-in-the-chrome-browser
