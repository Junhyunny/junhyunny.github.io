---
title: "JavaScript Hoisting"
search: false
category:
  - javascript
last_modified_at: 2022-04-04T23:55:00
---

<br>

## 0. 들어가면서

`JavaScript`와 친해지기 위해 실행 컨텍스트(exectuion context) 개념을 살펴보았는데, 생각보다 어려웠습니다. 
기본적으로 친숙하지 않은 용어들이 많아서 이해도가 떨어진다는 생각이 들었습니다. 
실행 컨텍스트를 탐구하기 위한 기본적인 지식들을 차근 차근 정리해보겠습니다.

## 1. 호이스팅(Hoisting)

> MDN - 호이스팅<br>
> 인터프리터가 변수와 함수의 메모리 공간을 선언 전에 미리 할당하는 것을 의미합니다. 

다소 말이 어려웠는데, 조금 더 풀어서 정리를 하면 다음과 같습니다. 
- 실제로 변수 선언이나 함수 선언이 스코프 최상단으로 끌어올려지는 것은 아닙니다. 
- 실행 컨텍스트는 코드가 실행되기 위해 필요한 환경이며, `JavaScript` 엔진이 코드를 실행하기 위해 필요한 여러가지 정보를 가지고 있습니다. 
- 호이스팅(hoisting)은 `JavaScript` 엔진이 코드를 실행하기 전 선언한 변수나 함수를 실행 컨텍스트에 저장하는 것을 의미합니다.
    - `var`, `let`, `const`, `class`, `function` 등
- 실행 컨텍스트를 만드는 과정에서 선언한 변수나 함수가 모두 등록되기 때문에 선언부보다 먼저 참조나 호출이 가능합니다.
- `let`이나 `const` 키워드로 선언한 변수가 호이스팅이 일어나지 않는 것처럼 보이는 이유는 `TDZ(Temporal Dead Zone)` 때문입니다.

### 1.1. var 키워드 변수

간단한 예제 코드를 이용해 이해를 도와보겠습니다. 

#### 1.1.1. 예시 1

`var` 키워드로 선언한 변수는 선언 위치에 관계 없이 참조나 호출은 가능합니다.

##### 작성한 코드
- `undefined` 값이 출력됩니다.
- 변수 `foo`를 선언하기 전에 `console.log` 함수에서 사용합니다.
- `foo`라는 이름의 변수가 선언되었음을 인지한 `JavaScript` 엔진은 `undefined` 값을 출력합니다.
    - 변수 선언이 안 되어 있으면 발생하는 에러 메세지 - `ReferenceError: foo is not defined` 

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
- `ReferenceError: bar is not defined` 에러 메세지가 출력됩니다.
- 전역 코드 동작
    - 함수 `foo`를 선언하기 전에 `foo()`로 함수를 호출합니다.
    - 함수 선언이 나중에 되었음에도 함수 호출에 에러가 발생하지 않습니다.
    - `JavaScript` 엔진은 `foo`라는 이름의 함수를 인지하고 있습니다.
- `foo` 함수 내부 동작
    - 변수 `bar`를 `if` 블럭 내부에서 선언하고, `console.log` 함수에서 사용합니다.
    - 변수 `bar`는 `if` 블럭 내부에서만 사용 가능하지 않지만, 변수를 선언한 함수 외부에선 사용이 불가능합니다. (함수 내부에서만 유효)
    - `JavaScript` 엔진은 `bar`라는 이름의 변수를 인지하고 있습니다.
- 전역에 위치한 `console.log(bar)` 코드를 실행시키면 `ReferenceError: bar is not defined` 에러 메세지를 출력합니다.
- 이 시점에 `JavaScript` 엔진은 `bar`라는 이름의 변수를 인지하지 못하고 있습니다.

{% include codepen.html hash="NWXXgQK" tab="js,result" title="var keyword before hoisting - 2" %}

##### 동작한 코드 모습
- 함수 `foo`의 선언부는 코드 최상단에 위치합니다.
- 변수 `bar`의 호이스팅은 함수 `foo` 내부에서만 동작합니다.
    - `var` 키워드로 선언한 변수의 호이스팅이 발생하는 유효 범위는 함수 블럭 내부입니다.

{% include codepen.html hash="NWXXgQK" tab="js,result" title="var keyword after hoisting - 2" %}

#### 1.1.3. 예시 3

변수와 함수의 호이스팅 적용 우선 순위는 누가 높은지 확인해보겠습니다. 

> Stack Overflow<br>
> Functions are hoisted first, then variable declarations<br>
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
    - `foo`, `bar` 이름의 함수가 먼저 선언됩니다.
- `var` 키워드로 선언한 변수가 호이스팅 됩니다.
    - `foo`, `bar` 변수가 코드 최상단에 선언됩니다.
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

### 2.1. var 키워드 변수의 선언, 초기화 그리고 할당

### 2.2. let 키워드 변수의 선언, 초기화 그리고 할당

## CLOSING

#### REFERENCE
- <https://developer.mozilla.org/ko/docs/Glossary/Hoisting>
- <https://262.ecma-international.org/5.1/#sec-10.5>
- <https://stackoverflow.com/questions/28246589/order-of-hoisting-in-javascript>
- <https://tecoble.techcourse.co.kr/post/2021-04-25-hoisting/>
- <https://gmlwjd9405.github.io/2019/04/22/javascript-hoisting.html>
- <https://hanamon.kr/javascript-%ED%98%B8%EC%9D%B4%EC%8A%A4%ED%8C%85%EC%9D%B4%EB%9E%80-hoisting/>
- <https://meetup.toast.com/posts/86>
- <https://velog.io/@yogongman/TDZ-Temporal-Dead-Zone>
- <https://ui.toast.com/weekly-pick/ko_20191014?fbclid=IwAR3fiR4wiv8kszL6Fz2KqwHpv-bTL8tNHElRN0q0ky5kpOP5BMqMS0wc-9k>