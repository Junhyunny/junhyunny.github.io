---
title: Prototype in JavaScript"
search: false
category:
  - javascript
last_modified_at: 2023-04-03T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Create Object in JavaScript][create-object-in-javascript-link]

## 1. Prototype in JavaScript

`JavaScript`는 프로토타입 기반(prototype-based)의 객체지향(object-oriented) 프로그래밍 언어입니다. 
`Java` 같은 클래스 기반 프로그래밍 언어처럼 클래스를 활용한 상속이나 캡슐화는 없지만, 프로토타입으로 객체지향적 메커니즘(mechanism)을 지원합니다. 
`ES6(ECMAScript6)`부터 클래스를 지원하지만, 클래스도 사실 함수이며 프로토타입 기반의 인스턴스를 생성합니다. 

### 1.1. Inheritance in JavaScript

상속(inheritance)는 객체지향 프로그래밍에서 핵심 개념입니다. 
상속이라는 개념을 통해 특정 객체의 프로퍼티(property)나 메소드(method)를 재사용할 수 있습니다. 
간단한 예제 코드를 살펴보겠습니다. 
예제 코드는 브라우저 개발자 도구(F12) 콘솔에서 실행시킬 수 있습니다. 

##### Without Inheritance

* 첫번째 생성한 객체의 `getArea` 메소드는 두번째 생성한 객체의 `getArea` 메소드와 다릅니다.
* 같은 기능을 수행하지만, 객체를 생성할 때마다 매번 새로 생성합니다.

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

##### With Inheritance by Prototype

* 첫번째 생성한 객체의 `getArea` 메소드는 두번째 생성한 객체의 `getArea` 메소드가 같습니다.
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

### 1.2. Protype and Object in JavaScript

[Create Object in JavaScript][create-object-in-javascript-link] 포스트에서 다뤘듯이 위 예시에서 `Circle`이라는 함수는 생성자로써 사용되었습니다. 
`JavaScript`에서 모든 함수는 생성자로써 사용될 수 있습니다. 
함수 이름의 맨 앞글자를 대문자로 작성하는 이유는 일반 함수와 구분짓기 위한 이름 규칙(naming convention)일 뿐입니다. 

프로토타입 객체(이하 프로토타입)는 함수가 선언될 때 함께 생성됩니다. 
생성자 함수는 `prototype`, 프로토타입 객체는 `constructor`라는 프로퍼티 사용해 서로를 참조합니다. 
`new` 키워드와 함께 생성자 함수로 객체를 생성하는 경우 자신이 참조하는 프로토타입 객체를 기반으로 객체를 생성합니다.

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
    <img src="/images/prototype-in-javascript-1.JPG" width="50%" class="image__border">
</p>

##### References Each Other

* `생성자 함수` 객체는 `prototype` 프로퍼티로 `생성자 함수 프로토타입` 객체를 참조합니다.
* `생성자 함수 프로토타입` 객체는 `constructor` 프로퍼티로 `생성자 함수` 객체를 참조합니다.

<p align="center">
    <img src="/images/prototype-in-javascript-2.JPG" width="80%" class="image__border">
</p>

##### Without Inheritance

<p align="center">
    <img src="/images/prototype-in-javascript-3.JPG" width="80%" class="image__border">
</p>

##### With Inheritance by Prototype

<p align="center">
    <img src="/images/prototype-in-javascript-4.JPG" width="80%" class="image__border">
</p>

## 2. __proto__ Accessor Property

생성자 함수에서 `prototype` 프로퍼티를 사용하면 프로토타입 객체를 참조할 수 있습니다. 
이와 유사하게 생성자를 통해 만들어진 객체는 `__proto__` 접근자 프로퍼티를 가집니다. 

`console.dir` 함수로 객체 정보를 출력하면 `[[Prototype]]`이란 이름의 내부 슬롯을 볼 수 있습니다. 
`[[Prototype]]` 내부 슬롯은 해당 객체의 프로토타입 객체를 참조합니다. 
다만 내부 슬롯은 `JavaScript` 엔진에서 동작하지만 개발자가 직접 접근할 수 없기 때문에 `__proto__` 접근자 프로퍼티를 사용합니다. 

```javascript
function Circle(radius) {
    this.radius = radius;
}

const circle = new Circle(1);

console.dir(circle);
console.dir(circle.__proto__ === Circle.prototype);

console.dir(circle.[[Prototype]]); // Uncaught SyntaxError: Unexpected token '['
```

<p align="left">
    <img src="/images/prototype-in-javascript-5.JPG" width="50%" class="image__border">
</p>

## 3. Summary

위의 내용들을 정리한 후 몇 가지 상황들을 예시 코드로 살펴보겠습니다. 
아래 요약을 따라 객체들의 참조 모습을 직접 그려보면 이해에 큰 도움이 됩니다.  
우선 다음과 같이 요약할 수 있습니다. 

* `함수A`가 존재합니다.
    * `함수A`를 선언하면 `함수A`가 생성자로 사용될 때 필요한 프로토타입 객체가 함께 생성됩니다.
    * `함수A`는 `prototype` 프로퍼티를 통해 자신의 프로토타입 객체를 참조합니다.
    * `함수A`의 프로토타입 객체는 `constructor` 프로퍼티를 통해 `함수A`를 참조합니다.
* `함수A`를 생성자로 사용해 만든 `객체A`가 존재합니다.
    * `객체A`는 `[[Prototype]]`이라는 내부 슬롯을 통해 자신의 프로토타입 객체를 참조합니다. 
    * `[[Prototype]]`를 직접 사용할 수 없으므로 `__proto__` 접근자 프로퍼티를 사용합니다.
    * `객체A`는 `함수A`를 통해 만들어졌으므로 `객체A.__proto__`가 가르키는 객체는 `함수A.prototype`과 동일합니다.

<p align="center">
    <img src="/images/prototype-in-javascript-6.JPG" width="80%" class="image__border">
</p>

### 3.1. Create Function

`JavaScript`에선 함수도 객체입니다. 
`function` 키워드를 통해 함수를 정의하는 행위는 Function 생성자를 통해 함수 객체를 만드는 것과 동일합니다. 
다만 크롬에서 Function 생성자를 통해 함수를 선언하면 보안상의 문제로 에러를 던집니다. 
이에 대한 해결 방법은 깃허브(github) 이슈에 등록되어 있습니다.

* <https://github.com/w3c/trusted-types/wiki/Trusted-Types-for-function-constructor>

Function 생성자를 사용해보려면 아래 사이트를 이용하시길 바랍니다. 

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
    <img src="/images/prototype-in-javascript-7.JPG" width="50%" class="image__border">
</p>

### 3.2. Create Object by Constructor

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
    <img src="/images/prototype-in-javascript-8.JPG" width="50%" class="image__border">
</p>

### 3.3. Create Literal Object

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
    <img src="/images/prototype-in-javascript-9.JPG" width="50%" class="image__border">
</p>

## CLOSING

향후 정리할 `프로토타입 체인`은 상속과 프로퍼티 검색을 위한 메커니즘을 제공합니다. 
상속을 통한 코드 재사용에 관련된 내용은 해당 포스트에서 알아보겠습니다. 

#### REFERENCE

* [모던 자바스크립트 Deep Dive 자바스크립트의 기본 개념과 동작 원리][modern-javascript-book-link]
* [인사이드 자바스크립트 Inside JavaScript 핵심 개념과 원리를 정확하게.][inside-javascript-book-link]
* <https://developer.mozilla.org/ko/docs/Learn/JavaScript/Objects/Object_prototypes>

[modern-javascript-book-link]: http://www.yes24.com/product/goods/92742567
[inside-javascript-book-link]: http://www.yes24.com/product/goods/37157296
[create-object-in-javascript-link]: https://junhyunny.github.io/javascript/create-object-in-javascript/