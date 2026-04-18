---
title: "자바스크립트 for-in 반복문"
search: false
category:
  - javascript
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [자바스크립트 프로토타입 (JavaScript Prototype)][prototype-in-javascript-link]
- [자바스크립트 프로토타입 체이닝 (JavaScript Prototype Chain)][prototype-chain-in-javascript-link]
- [JavaScript for-of Loop][javascript-for-of-loop-link]

## 0. 들어가면서

[JavaScript for-of Loop][javascript-for-of-loop-link] 포스트 도입부에서 언급했듯이 헷갈리는 for 반복문 문법에 대한 이야기이다. 이번 포스트에선 `for-in` 반복문에 대해 살펴보겠다.

## 1. What is Enumerable String Properties?

> The for...in statement iterates over all enumerable string properties of an object (ignoring properties keyed by symbols), including inherited enumerable properties.

`for-in` 루프(loop)는 객체의 모든 열거 가능한 문자열 속성들(enumerable string properties)을 사용해 반복을 수행한다. 프로토타입(prototype)을 통해 상속받은 속성들도 함께 포함된다. 정확히 이해하기 위해선 먼저 JavaScript 객체 속성의 특징에 대해 알아야 한다. 지금부터 정리하는 속성의 특징은 속성 키(key)의 특징이라고 생각하면 더 이해하기 쉽다.

- JavaScript 객체의 모든 속성(property)은 3가지 기준을 통해 구분할 수 있다.
  - 속성은 열거 가능(enumerable)하거나 열거 불가능(non-enumerable)하다.
  - 속성은 문자열(string)이거나 심볼(symbol)이다.
  - 속성은 직접 소유(owned)하거나 프로토타입 체인에 의해 상속(inherited)받는다.
- 객체 속성들은 각 기준 별로 반드시 한 가지 성격을 가지고 있다.

### 1.1. Example of Defining Property

이해를 돕기 위해 간단한 객체를 만들고 해당 객체에 속성 키와 값을 부여하겠다.

- `1`은 숫자로 선언하였지만, `문자열 타입, 열거 가능, 직접 소유한 속성 키`이다.
  - 해당 속성의 값은 문자열 '1 value'이다.
- `foo`은 `문자열 타입, 열거 가능, 직접 소유한 속성 키`이다.
  - 해당 속성의 값은 문자열 'foo value'이다.
- `say`은 `문자열 타입, 열거 가능, 직접 소유한 속성 키`이다.
  - 해당 속성의 값은 함수이다.
- `bar`은 `심볼 타입, 열거 불가능, 직접 소유한 속성 키`이다.
  - 해당 속성의 값은 문자열 'bar symbol value'이다.
- `baz`은 `심볼 타입, 열거 불가능, 직접 소유한 속성 키`이다.
  - 해당 속성의 값은 문자열 'baz symbol value'이다.
- `hasOwnProperty` / `isPrototypeOf`은 `문자열 타입, 열거 불가능, 상속받은 속성 키`이다.

```js
const bar = Symbol('bar');
const baz = Symbol('baz');
const object = {
    1: '1 value',
    foo: 'foo value',
    [bar]: 'bar symbol value',
    say() {
        console.log('Hello World');
    }
};

object[baz] = 'baz symbol value';

console.log(Object.getOwnPropertyNames(object)); // ['1', 'foo', 'say']
console.log(Object.getOwnPropertySymbols(object)); // [Symbol(bar), Symbol(baz)]
console.log(object.hasOwnProperty); // ƒ hasOwnProperty() { [native code] }
console.log(object.isPrototypeOf); // ƒ isPrototypeOf() { [native code] }

console.log(object.propertyIsEnumerable('1')); // true
console.log(object.propertyIsEnumerable('foo')); // true
console.log(object.propertyIsEnumerable('bar')); // false
console.log(object.propertyIsEnumerable('baz')); // false
console.log(object.propertyIsEnumerable('say')); // true

console.log(Object.prototype.propertyIsEnumerable('hasOwnProperty')); // false
console.log(Object.prototype.propertyIsEnumerable('isPrototypeOf')); // false

console.dir(object);
```

##### Inside object instance

- 파란색 박스는 해당 객체가 직접 소유한 속성들이다.
- 빨간색 박스는 프로토타입 체이닝을 통해 상속받은 속성들이다.

<div align="left">
  <img src="{{ site.image_url_2023 }}/javascript-for-in-loop-01.png" width="60%" class="image__border">
</div>

## 2. for-in Loop Example

위 예시 코드처럼 속성 키를 심볼로 선언하지 않는다면 속성 키는 `문자열 타입의 열거 가능`하게 만들어진다. 이번엔 열거 불가능한 속성이 추가된 프로토타입 객체와 이를 상속받은 객체를 만들어 `for-in` 반복문을 수행해보겠다.

- Circle 함수를 선언한다.
- Circle 함수의 프로토타입 객체에 getArea 메서드를 선언한다.
- Circle 함수의 프로토타입 객체에 color 속성을 추가한다.
  - Object.defineProperty 메서드를 사용한다.
  - 함께 전달하는 옵션을 통해 `열거 가능 여부(enumerable)`를 `false`로 지정한다.
- circle 인스턴스를 Circle 생성자를 통해 생성한다.
- `for-in` 반복문을 통해 해당 객체의 정보를 출력한다.

```js
function Circle(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
}

Circle.prototype.getArea = function () {
    return Math.PI * this.radius ** 2;
}

Object.defineProperty(Circle.prototype, 'color', {
    value: 'yellow',
    enumerable: false
});

const circle = new Circle(10, 15, 5);

for(const propertyKey in circle) {
    console.log(`${propertyKey}: ${circle[propertyKey]}`);
}
console.log(`color: ${circle.color}`)

console.dir(circle);
```

##### Result of Example

- radius, x, y은 열거 가능한 문자열 타입 속성이므로 정상적으로 출력된다.
- getArea 함수는 프로토타입 체이닝에 의해 상속된 속성이며 열거 가능한 문자열 타입이므로 정상적으로 출력된다.
- Object.defineProperty 메서드를 통해 color 속성을 선언한다.
  - `열거 가능 여부`가 `false`로 지정되었기 때문에 `for-in` 반복문 대상에서 제외된다.
  - 상속을 받았으므로 직접 사용은 가능하다.

<div align="left">
  <img src="{{ site.image_url_2023 }}/javascript-for-in-loop-02.png" width="60%" class="image__border">
</div>

## 3. Summary of for-in Loop

`for-in` 반복문과 열거 가능한 속성에 대한 요약을 다음과 같이 할 수 있다.

- `for-in` 반복문은 객체의 속성을 탐색하기 위한 반복문이다.
  - 일반적인 방법으로 선언하는 속성은 `열거 가능한 문자열 타입`이다.
  - Object.defineProperty 메서드를 통해 열거 불가능한 속성을 선언할 수 있다.
- 프로토타입 체이닝을 통해 상속받은 속성도 `열거 가능한 문자열 타입`이라면 `for-in` 반복문 대상이다.
- 심볼 타입으로 속성을 만들 수 있지만, 해당 속성은 `for-in` 반복문 대상이 아니다.

#### REFERENCE

- <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in>
- <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties>
- <https://ko.javascript.info/symbol>
- <https://helloworldjavascript.net/pages/240-object-in-depth.html>
- <https://stackoverflow.com/questions/68647965/what-is-the-difference-between-iterable-and-enumerable-in-js-i-am-going-through>
- <https://stackoverflow.com/questions/13296340/how-to-define-method-in-javascript-on-array-prototype-and-object-prototype-so-th>
- <https://stackoverflow.com/questions/37529168/in-javascript-why-doesnt-for-in-return-the-contents-of-object-prototype>
- <https://poiemaweb.com/es6-symbol>

[prototype-in-javascript-link]: https://junhyunny.github.io/javascript/prototype-in-javascript/
[prototype-chain-in-javascript-link]: https://junhyunny.github.io/javascript/prototype-chain-in-javascript/
[javascript-for-of-loop-link]: https://junhyunny.github.io/javascript/javascript-for-of-loop/