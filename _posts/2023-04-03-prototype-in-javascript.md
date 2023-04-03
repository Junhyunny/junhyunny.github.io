---
title: Prototype in JavaScript
search: false
category:
  - javascript
last_modified_at: 2023-04-03T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Create Object in JavaScript][create-object-in-javascript-link]

## 0. 들어가면서

이번 포스트는 `JavaScript`의 프로토타입(prototype)에 관련된 내용을 다룹니다. 
주제 특성상 객체라는 말을 많이 사용합니다. 
`JavaScript`에선 함수도 객체이기 떄문에 글의 내용이 다소 헷갈릴 수 있습니다. 
이를 구분짓기 위해 생성자 함수를 통해 만들어진 객체는 인스턴스(instance)라고 명명하겠습니다.

## 1. Prototype in JavaScript

`JavaScript`는 프로토타입 기반(prototype-based)의 객체지향(object-oriented) 프로그래밍 언어입니다. 
`Java` 같은 클래스 기반 프로그래밍 언어처럼 클래스를 활용한 상속이나 캡슐화는 없지만, 프로토타입으로 객체지향적 메커니즘(mechanism)을 지원합니다. 
`ES6(ECMAScript6)`부터 클래스를 지원하지만, 클래스도 사실 함수이며 프로토타입 기반의 인스턴스를 생성합니다. 

### 1.1. Inheritance in JavaScript

상속(inheritance)은 객체지향 프로그래밍에서 핵심적인 개념입니다. 
상속을 통해 특정 객체의 프로퍼티(property)나 메소드(method)를 재사용할 수 있습니다. 

`JavaScript`에선 상위 프로토타입 객체로부터 메소드와 속성을 상속 받아 재사용합니다. 
정확히 말하면 상위 프로토타입 객체를 참조하여 자신에게 없는 상태와 기능을 확장하여 사용합니다. 
프로토타입 객체도 상위 프로토타입을 가지며 `프로토타입 체인(prototype chain)`을 통해 접근할 수 있습니다. 
간단한 예제 코드를 통해 상속에 대해 알아보겠습니다. 
예제 코드는 브라우저 개발자 도구(F12) 콘솔에서 실행시킬 수 있습니다. 

#### 1.1.1. Without Inheritance

* 첫번째 생성한 인스턴스의 `getArea` 메소드는 두번째 생성한 인스턴스의 `getArea` 메소드와 다릅니다.
* 같은 기능을 수행하지만, 인스턴스를 생성할 때마다 매번 새로 생성합니다.

```javascript
function Circle(radius) {
    this.radius = radius;
    this.getArea = function () {
        return Math.PI * this.radius ** 2;
    }
}

const firstCircle = new Circle(1);
const secondCircle = new Circle(2);

console.log(firstCircle.getArea === secondCircle.getArea); // false
console.log(firstCircle.getArea()); // 3.141592653589793
console.log(secondCircle.getArea()); // 12.566370614359172
```

#### 1.1.2. With Inheritance by Prototype

* 첫번째 생성한 인스턴스의 `getArea` 메소드는 두번째 생성한 인스턴스의 `getArea` 메소드가 같습니다.
* 같은 기능 수행하는 메소드를 프로토타입 객체에 정의하고 재사용합니다. 

```javascript
function Circle(radius) {
    this.radius = radius;
}

Circle.prototype.getArea = function () {
    return Math.PI * this.radius ** 2;
}

const firstCircle = new Circle(1);
const secondCircle = new Circle(2);

console.log(firstCircle.getArea === secondCircle.getArea); // true
console.log(firstCircle.getArea()); // 3.141592653589793
console.log(secondCircle.getArea()); // 12.566370614359172
```

### 1.2. Function and Protype

`Circle` 함수는 생성자로써 사용하였습니다. 
`JavaScript`에서 모든 함수는 생성자로써 사용할 수 있습니다. 
함수와 생성자는 단지 구분해서 사용할 뿐입니다. 

* 일반 함수 호출과 다르게 생성자는 `new` 키워드를 함께 사용합니다.
* 생성자 함수의 이름 맨 앞 글자가 대문자인 이유는 일반 함수와 용도를 나누기 위한 이름 규칙(naming convention)입니다. 

프로토타입 객체는 함수가 선언될 때 항상 쌍(pair)으로 함께 생성됩니다. 
생성자 함수는 `prototype`, 프로토타입 객체는 `constructor`라는 프로퍼티 사용해 서로를 참조합니다. 
생성자 함수로 인스턴스를 생성하는 경우 생성된 인스턴스는 `내부 링크`를 통해 프로토타입 객체를 참조합니다. 

* 동일한 색상의 박스는 동일한 객체 정보를 의미합니다.

```javascript
function foo() {}
function Circle() {}

console.dir(foo)
console.dir(Circle)

console.log(foo.prototype)
console.log(Circle.prototype)

console.log(foo.prototype.constructor === foo)
console.log(Circle.prototype.constructor === Circle)
```

<p align="left">
    <img src="/images/prototype-in-javascript-1.JPG" width="60%" class="image__border">
</p>

##### Constructor and Prototype

* `생성자 함수` 객체는 `prototype` 프로퍼티로 `생성자 함수 프로토타입` 객체를 참조합니다.
* `생성자 함수 프로토타입` 객체는 `constructor` 프로퍼티로 `생성자 함수` 객체를 참조합니다.

<p align="center">
    <img src="/images/prototype-in-javascript-2.JPG" width="80%" class="image__border">
</p>

#### 1.2.1. Without Inheritance

상속하지 않은 예제 코드에서 객체들은 다음과 같은 모습을 가집니다. 

* Circle 생성자 함수를 통해 두 개의 인스턴스를 만듭니다.
    * `radius` 프로퍼티는 생성자 함수 내부에 정의되어 있습니다.
    * `getArea` 메소드는 생성자 함수 내부에 정의되어 있습니다.
* 생성자 함수 내부에 정의된 프로퍼티와 메소드는 인스턴스가 만들어질 때 내부에 함께 생성됩니다.

<p align="center">
    <img src="/images/prototype-in-javascript-3.JPG" width="80%" class="image__border">
</p>

#### 1.2.2. With Inheritance by Prototype

상속 예제 코드에서 객체들은 다음과 같은 모습을 가집니다. 

* Circle 생성자 함수를 통해 두 개의 인스턴스를 만듭니다.
    * `radius` 프로퍼티는 생성자 함수 내부에 정의되어 있습니다.
* Circle 생성자 함수의 프로토타입 객체에 `getArea` 메소드를 정의합니다.
* 생성자 함수 내부에 정의된 프로퍼티는 인스턴스를 만들 때 인스턴스 내부에 함께 생성됩니다.
* 프로토타입 객체에 정의한 메소드는 생성된 인스턴스에는 존재하지 않습니다.
    * 인스턴스 내부 링크를 통해 참조하는 프로토타입 객체의 기능을 재사용합니다. 

<p align="center">
    <img src="/images/prototype-in-javascript-4.JPG" width="80%" class="image__border">
</p>

## 2. `__proto__` Accessor Property

`console.dir` 함수로 객체 정보를 출력하면 `[[Prototype]]`이란 이름의 내부 슬롯을 볼 수 있습니다. 
`[[Prototype]]`은 해당 객체가 참조하는 상위 프로토타입 객체를 의미하지만, 직접 접근할 수 없습니다. 

```javascript
console.dir(circle.[[Prototype]]); // Uncaught SyntaxError: Unexpected token '['
```

함수 객체는 `prototype`이라는 프로퍼티를 통해 프로토타입 객체를 참조하듯이 `JavaScript` 세상 속 인스턴스들은 `__proto__` 접근자 프로퍼티를 통해 프로토타입 객체를 참조합니다. 
함수 객체와 인스턴스는 서로 다른 프로퍼티를 통해 같은 객체를 바라보고 있습니다. 

```javascript
function Circle(radius) {
    this.radius = radius;
}

const circle = new Circle(1);

console.dir(circle);
console.dir(circle.__proto__ === Circle.prototype);
```

<p align="left">
    <img src="/images/prototype-in-javascript-5.JPG" width="60%" class="image__border">
</p>

## 3. Summary

위의 내용들을 다시 정리해보겠습니다. 
요약한 내용을 따라 객체들의 참조 모습을 직접 그려보면 이해하는데 큰 도움이 됩니다. 

* `함수A`가 존재합니다.
    * `함수A`를 선언하면 `함수A`가 생성자로 사용될 때 필요한 프로토타입 객체가 함께 생성됩니다.
    * `함수A`는 `prototype` 프로퍼티를 통해 자신의 프로토타입 객체를 참조합니다.
    * `함수A`의 프로토타입 객체는 `constructor` 프로퍼티를 통해 `함수A`를 참조합니다.
* `함수A`를 생성자로 사용해 만든 `인스턴스A`가 존재합니다.
    * `인스턴스A`는 `[[Prototype]]`이라는 내부 슬롯을 통해 자신의 프로토타입 객체를 참조합니다. 
    * `[[Prototype]]`를 직접 사용할 수 없으므로 `__proto__` 접근자 프로퍼티를 사용합니다.
    * `인스턴스A`는 `함수A`를 통해 만들어졌으므로 `인스턴스A.__proto__`가 가르키는 객체는 `함수A.prototype`과 동일합니다.

<p align="center">
    <img src="/images/prototype-in-javascript-6.JPG" width="80%" class="image__border">
</p>

### 3.1. Create Function

`JavaScript`에선 함수도 객체입니다. 
`function` 키워드를 통해 함수를 정의하는 행위는 Function 생성자를 통해 함수 객체를 만드는 것과 동일합니다. 
`sum`은 함수이기도 하기 때문에 `prototype` 프로퍼티를 가지고 있습니다. 

크롬에서 Function 생성자를 통해 함수를 생성하면 에러를 만납니다. 
이에 관련된 내용은 깃허브(github) 이슈를 참고바랍니다. 

* <https://github.com/w3c/trusted-types/wiki/Trusted-Types-for-function-constructor>

Function 생성자를 사용한 예제는 아래 사이트를 이용하시길 바랍니다. 

* <https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Function>

```javascript
const sum = function (a, b) {
    return a + b;
} 

console.dir(sum);
console.dir(sum.__proto__);
console.dir(sum.__proto__ === Function.prototype);
console.dir(sum.__proto__.constructor === Function);
```

<p align="left">
    <img src="/images/prototype-in-javascript-7.JPG" width="60%" class="image__border">
</p>

### 3.2. Create Object by Constructor

생성자로 만든 인스턴스를 살펴보겠습니다. 
인스턴스이므로 `prototype` 프로퍼티가 없습니다. 

```javascript
function Circle(radius) {
    this.radius = radius;
}

const circle = new Circle(1);

console.dir(circle);
console.dir(circle.__proto__);
console.dir(circle.__proto__ === Circle.prototype);
console.dir(circle.__proto__.constructor === Circle);
```

<p align="left">
    <img src="/images/prototype-in-javascript-8.JPG" width="60%" class="image__border">
</p>

### 3.3. Create Literal Object

리터럴 방식으로 만든 인스턴스를 살펴보겠습니다. 
객체이므로 `prototype` 프로퍼티가 없습니다. 

```javascript
const foo = {
    value: 'Hello World'
};
// const foo = new Object();
// foo.value = 'Hello World';

console.dir(foo);
console.dir(foo.__proto__);
console.dir(foo.__proto__ === Object.prototype);
console.dir(foo.__proto__.constructor === Object);
```

<p align="left">
    <img src="/images/prototype-in-javascript-9.JPG" width="60%" class="image__border">
</p>

## CLOSING

`__proto__`는 지원이 중단되었습니다. 

> This feature is no longer recommended. Though some browsers might still support it, it may have already been removed from the relevant web standards, may be in the process of being dropped, or may only be kept for compatibility purposes. Avoid using it, and update existing code if possible; see the compatibility table at the bottom of this page to guide your decision. Be aware that this feature may cease to work at any time.

객체의 `[[Prototype]]`을 변경하는 것은 모든 브라우저 및 `JavaScript` 엔진에서 매우 느린 작업이라고 합니다. 
오늘날 대부분의 브라우저에서 호환성을 보장하기 위해 지원되지만 더 나은 기능으로 `Object.getPrototypeof()` 메소드를 사용이 권장됩니다. 

#### REFERENCE

* [모던 자바스크립트 Deep Dive 자바스크립트의 기본 개념과 동작 원리][modern-javascript-book-link]
* [인사이드 자바스크립트 Inside JavaScript 핵심 개념과 원리를 정확하게.][inside-javascript-book-link]
* <https://developer.mozilla.org/ko/docs/Learn/JavaScript/Objects/Object_prototypes>
* <http://insanehong.kr/post/javascript-prototype/>
* <https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object/proto>
* <https://www.inflearn.com/questions/361135/proto-%EA%B0%80-deprecated%EB%90%9C-%EC%9D%B4%EC%9C%A0>

[modern-javascript-book-link]: http://www.yes24.com/product/goods/92742567
[inside-javascript-book-link]: http://www.yes24.com/product/goods/37157296
[create-object-in-javascript-link]: https://junhyunny.github.io/javascript/create-object-in-javascript/