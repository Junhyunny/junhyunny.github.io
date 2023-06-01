---
title: "JavaScript for-in Loop"
search: false
category:
  - javascript
last_modified_at: 2023-06-01T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Prototype in JavaScript][prototype-in-javascript-link]
* [Prototype Chain in JavaScript][prototype-chain-in-javascript-link]
* [JavaScript for-of Loop][javascript-for-of-loop-link]

## 0. 들어가면서

[JavaScript for-of Loop][javascript-for-of-loop-link] 포스트 도입부에서 언급했듯이 헷갈리는 for 반복문 문법에 대한 이야기입니다. 

* for-of
* for-in

이번 포스트에선 `for-in` 반복문에 대해 살펴보겠습니다.

## 1. What is Enumerable String Properties?

> The for...in statement iterates over all enumerable string properties of an object (ignoring properties keyed by symbols), including inherited enumerable properties.

`for-in` 루프(loop)는 객체의 모든 열거 가능한 문자열 속성들(enumerable string properties)를 사용해 반복을 수행합니다. 
프로토타입(prototype)을 통해 상속 받은 속성들도 함께 포함됩니다. 
이제 열거 가능한 문자열 속성이 무엇인지 알아야합니다. 
JavaScript 속성의 특징에 대해 알아야하는데 특징에 대해 알아보겠습니다. 

* JavaScript 객체의 모든 속성(property)은 3가지 기준을 통해 구분할 수 있습니다.
    * 속성은 열거 가능(enumerable)하거나 열거 불가능(non-enumerable)합니다.
    * 속성은 문자열이거나 심볼입니다.
    * 속성은 직접 소유(own)하거나 프로토타입 체인에 의해 상속(inherited)받습니다.
* 객체 속성들은 각 기준 별로 반드시 한가지 성격을 가지고 있습니다. 

이해를 돕기 위해 간단한 객체를 만들고 해당 객체의 속성들에 대한 정보를 살펴보겠습니다.

* `1`은 숫자로 선언하였지만, `문자열 타입, 열거 가능, 직접 소유한 속성`입니다.
    * 해당 속성의 값은 문자열 '1 value' 입니다.
* `foo`은 `문자열 타입, 열거 가능, 직접 소유한 속성`입니다.
    * 해당 속성의 값은 문자열 'foo value' 입니다.
* `say`은 `문자열 타입, 열거 가능, 직접 소유한 속성`입니다.
    * 해당 속성의 값은 함수입니다.
* `bar`은 `심볼 타입, 열거 불가능, 직접 소유한 속성`입니다.
    * 해당 속성의 값은 문자열 'bar symbol value' 입니다.
* `baz`은 `심볼 타입, 열거 불가능, 직접 소유한 속성`입니다.
    * 해당 속성의 값은 문자열 'baz symbol value' 입니다.
* `hasOwnProperty` / `isPrototypeOf`은 `문자열 타입, 열거 불가능, 상속받은 속성`입니다.

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

* 파란색 박스는 해당 객체가 직접 소유한 속성들입니다.
* 빨간색 박스는 프로토타입 체이닝을 통해 상속받은 속성들입니다.

<p align="left">
    <img src="/images/javascript-for-in-loop-1.JPG" width="60%" class="image__border">
</p>

## 2. for-in Loop Example

위 예시 코드를 통해 심볼로 궂이 선언하지 않는다면 속성은 문자열 타입의 열거 가능하게 만들어진다는 사실을 알았습니다. 
이번엔 열거 불가능한 속성이 추가된 프로토타입 객체와 이를 상속받은 객체를 만들어 `for-in` 반복문을 수행해보겠습니다. 

* Circle 함수를 선언합니다.
* Circle 함수의 프로토타입 객체에 getArea 메소드를 선언합니다.
* Circle 함수의 프로토타입 객체에 `color` 속성을 추가합니다.
    * `Object.defineProperty` 함수를 이용합니다.
    * 함께 전달하는 옵션을 통해 `열거 가능 여부(enumerable)`를 `false`로 지정합니다.
* circle 인스턴스를 Circle 생성자를 통해 생성합니다.
* `for-in` 반복문을 통해 해당 객체의 정보를 출력합니다.

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

* radius, x, y은 열거 가능한 문자열 타입 속성이므로 정상적으로 출력됩니다.
* getArea 함수는 프로토타입 체이닝에 의해 상속된 속성이며 열거 가능한 문자열 타입이므로 정상적으로 출력됩니다.
* `Object.defineProperty` 메소드를 통해 color 속성을 선언합니다.
    * `열거 가능 여부`가 `false`로 지정되었기 때문에 `for-in` 반복문 대상에서 제외됩니다.
    * 상속을 받았으므로 직접 사용은 가능합니다.

<p align="left">
    <img src="/images/javascript-for-in-loop-2.JPG" width="60%" class="image__border">
</p>

## 3. Summary of for-in Loop

`for-in` 반복문과 열거 가능한 속성에 대한 요약을 다음과 같이 할 수 있습니다.

* `for-in` 반복문은 객체의 속성을 탐색하기 위한 반복문입니다.
    * 객체의 모든 속성이 대상이 아닌 `열거 가능한 문자열 타입`의 속성만 가능합니다.
* 일반적인 방법으로 선언하는 속성은 `열거 가능한 문자열 타입` 속성입니다.
    * `Object.defineProperty` 메소드를 통해 열거 불가능한 속성을 선언할 수 있습니다.
* 심볼 타입으로 속성을 만들 수 있지만, 해당 속성은 `for-in` 반복문 대상이 아닙니다.
* 프로토타입 체이닝을 통해 상속 받은 속성도 `열거 가능한 문자열 타입`인 경우엔 `for-in` 반복문 대상입니다.

#### REFERENCE

* <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in>
* <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties>
* <https://ko.javascript.info/symbol>
* <https://stackoverflow.com/questions/68647965/what-is-the-difference-between-iterable-and-enumerable-in-js-i-am-going-through>
* <https://stackoverflow.com/questions/13296340/how-to-define-method-in-javascript-on-array-prototype-and-object-prototype-so-th>
* <https://stackoverflow.com/questions/37529168/in-javascript-why-doesnt-for-in-return-the-contents-of-object-prototype>
* <https://poiemaweb.com/es6-symbol>

[prototype-in-javascript-link]: https://junhyunny.github.io/javascript/prototype-in-javascript/
[prototype-chain-in-javascript-link]: https://junhyunny.github.io/javascript/prototype-chain-in-javascript/
[javascript-for-of-loop-link]: https://junhyunny.github.io/javascript/javascript-for-of-loop/