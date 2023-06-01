---
title: "JavaScript for-of Loop"
search: false
category:
  - javascript
last_modified_at: 2023-05-31T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Prototype in JavaScript][prototype-in-javascript-link]
* [Prototype Chain in JavaScript][prototype-chain-in-javascript-link]

## 0. 들어가면서

JavaScript로 for 반복문을 작성하다보면 헷갈리는 문법이 있습니다. 

* `for-of`
* `for-in`

매번 찾아보거나 테스트 코드를 통해 미리 실행해보는 식으로 작업했습니다. 
간략하게라도 정리하면 한동안 사용 기준을 잊지 않을 것 같아서 간단하게 포스트로 작성하였습니다. 
먼저 `for-of` 반복문에 대해 살펴보겠습니다.

## 1. for-of Loop

> The for...of statement executes a loop that operates on a sequence of values sourced from an iterable object.

반복 가능 객체(iterable object)로부터 순차적으로 값을 사용하는 방식입니다. 
먼저 반복 가능 객체에 대해 살펴보겠습니다.

* 반복 가능 객체는 `ES2015`에서 도입되었으며 객체 속성 중 `Symbol.iterator`이라는 특별한 함수가 존재합니다.
* `Symbol.iterator` 함수를 가진 객체는 `이터러블 프로토콜(iterable protocol)`을 만족한다고 표현합니다.
    * 프로토타입(prototype) 객체를 통해 상속받는 포함됩니다.
* 다시 말해 `이터러블 프로토콜`을 만족하는 객체를 `반복 가능 객체`라고 표현합니다.
* 대표적으로 다음과 같은 객체들이 존재합니다.
    * Array, String, TypedArray, Map, Set, NodeList

<p align="left">
    <img src="/images/javascript-for-of-loop-1.JPG" width="60%" class="image__border">
</p>

## 2. Examples

간단한 코드를 통해 동작을 살펴보겠습니다.

* `array` 배열 객체 순환
    * 배열에 담긴 문자열이 순차적으로 출력됩니다.
* `map` 맵 객체 순환
    * 맵에 담긴 엔트리(entry)가 순차적으로 출력됩니다.
    * 출력된 엔트리는 배열 객체입니다.
* `object` 객체 순환
    * `Uncaught TypeError` 에러가 발생합니다.
    * `object is not iterable` 에러 메세지가 출력됩니다.
    * 일반 객체는 `이터러블 프로토콜`을 만족하지 못하기 때문에 에러가 발생합니다.

```js
const array = ['1', '2', 'Hello World'];

for(const item of array) {
    console.log(item); // 1, 2, Hello World
}

const map = new Map();
map.set('foo', 'foo hello world');
map.set('bar', 'bar hello world');

for(const item of map) {
    console.log(item); // ['foo', 'foo hello world'], ['bar', 'bar hello world']
}

const object = {
    foo: 'foo hello world',
    bar: 'bar hello world',
};

for(const item of object) {
    console.log(item); // Uncaught TypeError: object is not iterable
}
```

## 3. Make Iterable Object

`이터러블 프로토콜`을 만족하는 객체는 반복 가능 객체입니다. 
마찬가지로 일반 객체라도 `이터러블 프로토콜`을 만족하게 만든다면 반복 가능 객체로 만들 수 있습니다. 
아래 코드처럼 반복 불가능한 객체라 에러가 발생한 상황을 변경해보겠습니다. 

```js
const object = {
    0: 'W',
    1: 'o',
    2: 'r',
    3: 'l',
    4: 'd',
    5: '!'
};

for(const item of object) {
    console.log(item); // Uncaught TypeError: object is not iterable
}
```

### 3.1. Iterator Protocol

`Symbol.iterator` 함수는 `이터레이터(iterator) 객체`를 반환합니다. 
`이터레이터 객체`는 다음과 같은 조건을 만족하는 객체입니다. 

* `next` 메소드를 갖습니다.
* `next` 메소드는 다음 두 속성을 갖는 객체를 반환합니다.
    * done 속성 - 반복 완료 여부
    * value 속성 - 현재 순서의 값
* 이런 조건을 `이터레이터 프로토콜(iterator protocol)`을 만족했다고 표현합니다.

### 3.2. Define Symbol.iterator Function

이터레이터 객체를 반환하는 `Symbol.iterator` 함수를 선언하고 코드를 실행해보겠습니다. 

* `Symbol.iterator` 함수는 객체를 반환합니다.
    * position 속성 - 현재 가르키는 값의 위치 정보
    * end 속성 - 마지막 위치 정보
    * next 함수 - 이터레이터 객체를 반환하는 함수
* `next` 함수는 다음과 같은 동작을 수행합니다.
    * 현재 위치가 마지막 위치 이하인 경우
        * done 속성 - 미완료 상태
        * value 속성 - 현재 포지션의 값
        * `this.position++` 코드를 통해 현재 포지션을 다음 포지션으로 이동
    * 현재 위치가 마지막 위치를 초과하는 경우
        * done 속성 - 완료 상태
        * value 속성 - 마지막 포지션의 값

```js
const object = {
    0: 'W',
    1: 'o',
    2: 'r',
    3: 'l',
    4: 'd',
    5: '!',
    from: 0,
    to: 5
};

object[Symbol.iterator] = function () {
    return {
        position: object.from,
        end: object.to,
        next() {
            if(this.position <= this.end) {
                return {done: false, value: object[this.position++]};
            }
            return {done: true, value: object[this.position]};
        }
    };
};

for(const item of object) {
    console.log(item); // W, o, r, l, d, !
}
```

#### REFERENCE

* <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of>
* <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#built-in_iterables>
* <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol>
* <https://helloworldjavascript.net/pages/260-iteration.html>
* <https://ko.javascript.info/iterable>

[prototype-in-javascript-link]: https://junhyunny.github.io/javascript/prototype-in-javascript/
[prototype-chain-in-javascript-link]: https://junhyunny.github.io/javascript/prototype-chain-in-javascript/