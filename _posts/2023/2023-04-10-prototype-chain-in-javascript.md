---
title: "Prototype Chain in JavaScript"
search: false
category:
  - javascript
last_modified_at: 2023-04-10T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Prototype in JavaScript][prototype-in-javascript-link]

## 0. 들어가면서

이번 포스트에선 프로토타입 체인을 통한 객체 탐색과 프로퍼티 오버라이딩(overriding), 쉐도잉(shadowing)에 대한 개념을 정리하였습니다. 

## 1. Prototype Chain

[Prototype in JavaScript][prototype-in-javascript-link] 포스트에서 정리했듯이 `JavaScript`는 프로토타입을 통해 상속을 지원합니다. 
프로토타입은 생성자 함수를 통해 만들어진 인스턴스의 부모 객체입니다. 
생성자 함수는 `prototype`이라는 프로퍼티(property)를 사용해 접근합니다. 
인스턴스는 `__proto__`이라는 접근자 프로퍼티를 사용해 접근합니다. 

프로토타입 체인은 인스턴스가 `__proto__` 접근자 프로퍼티를 사용해 상위 부모 프로토타입 객체를 탐색하는 행위입니다. 
부모 프로토타입 객체도 해당 프로퍼티가 없다면 자신의 상위 프로토타입 객체를 탐색합니다. 
순차적으로 부모 역할을 하는 프로토타입들의 프로퍼티를 검색합니다. 
프로토타입 체인은 `JavaScript`에서 객체지향 프로그래밍의 상속 구현과 프로퍼티 탐색을 위한 메커니즘입니다. 

* `firstCircle` 인스턴스 정보를 살펴봅니다.
* `firstCircle.__proto__` 객체 정보를 살펴봅니다.
    * `Circle.prototype` 객체와 동일한 것을 확인할 수 있습니다.
* `firstCircle.__proto__.__proto__` 객체 정보를 살펴봅니다.
    * `Object.prototype` 객체와 동일한 것을 확인할 수 있습니다.
* `firstCircle.__proto__.__proto__.__proto__` 객체 정보를 살펴봅니다.
    * `null`임을 확인할 수 있습니다.

```javascript
function Circle(radius) {
    this.radius = radius;
}

Circle.prototype.getArea = function () {
    return Math.PI * this.radius ** 2;
}

const firstCircle = new Circle(1);

console.dir(firstCircle);
console.dir(firstCircle.__proto__);
console.dir(firstCircle.__proto__.__proto__);
console.dir(firstCircle.__proto__.__proto__.__proto__); // null

console.dir(Circle);
console.dir(Circle.__proto__);

console.dir(Function.prototype === Circle.__proto__); // true
console.dir(Function.prototype === Function.__proto__); // true
console.dir(Circle.prototype === firstCircle.__proto__); // true
console.dir(Object.prototype === firstCircle.__proto__.__proto__); // true
```

* 프로토타입 체인의 최상위에 위치하는 객체는 항상 `Object.prototype`입니다.
    * `Object.prototype`을 프로토타입 체인의 종점입니다.
* 모든 객체 혹은 인스턴스는 `Object.prototype`를 상속받습니다. 
* `Object.prototype` 객체의 `[[Prototype]]` 내부 슬롯 값은 `null`입니다. 

<p align="left">
    <img src="/images/prototype-chain-in-javascript-1.JPG" width="60%" class="image__border">
</p>

##### Prototype Chain of Example

* firstCircle 인스턴스의 프로토타입 체인은 Circle 프로토타입과 Object 프로토타입 객체로 연결됩니다.

<p align="center">
    <img src="/images/prototype-chain-in-javascript-2.JPG" width="80%" class="image__border">
</p>

## 2. Property Overriding and Shadowing

부모 프로토타입 객체와 인스턴스는 동일한 프로퍼티를 가질 수 있습니다. 
여기서 두가지 개념이 등장합니다.

* 오버라이딩(overriding)
    * 상위 프로토타입 객체에 위치한 프로퍼티를 하위 인스턴스가 재정의한 것을 의미합니다.
* 쉐도잉(shadowing)
    * 하위 인스턴스에서 재정의하였기 때문에 상위 프로토타입 객체에 위치한 프로퍼티가 가려지는 현상입니다.

간단한 코드를 통해 오버라이딩과 쉐도잉에 대해 알아보겠습니다.

* person 인스턴스의 sayHello 메소드를 호출합니다.
    * `Hi! Instance person's name is Junhyunny` 로그가 출력됩니다.
* sayHello 메소드를 인스턴스에서 제거합니다.
    * delete 키워드를 사용합니다.
* person 인스턴스의 sayHello 메소드를 호출합니다.
    * `Hi! Prototype person's name is Junhyunny` 로그가 출력됩니다.
    * 프로토타입 체인을 통해 상위 객체의 메소드를 사용합니다.
* sayHello 메소드를 프로토타입 객체에서 제거합니다.
    * delete 키워드를 사용합니다.
* person 인스턴스의 sayHello 메소드를 호출합니다.
    * `Uncaught TypeError`가 발생합니다.
    * 인스턴스와 프로토타입 객체에서 삭제하였으므로 해당 프로퍼티를 프로토타입 체인 내에서 찾을 수 없습니다.

```javascript
function Person(name) {
    this.name = name;
    this.sayHello = function() {
        console.log(`Hi! Instance person's name is ${this.name}`)
    }
}

Person.prototype.sayHello = function() {
    console.log(`Hi! Prototype person's name is ${this.name}`)
}

const person = new Person('Junhyunny');

person.sayHello(); // Hi! Instance person's name is Junhyunny

delete person.sayHello;

person.sayHello(); // Hi! Prototype person's name is Junhyunny

delete Person.prototype.sayHello;

person.sayHello(); // Uncaught TypeError: person.sayHello is not a function
```

<p align="center">
    <img src="/images/prototype-chain-in-javascript-3.JPG" width="80%" class="image__border">
</p>

#### REFERENCE

* [모던 자바스크립트 Deep Dive 자바스크립트의 기본 개념과 동작 원리][modern-javascript-book-link]
* [인사이드 자바스크립트 Inside JavaScript 핵심 개념과 원리를 정확하게.][inside-javascript-book-link]

[modern-javascript-book-link]: http://www.yes24.com/product/goods/92742567
[inside-javascript-book-link]: http://www.yes24.com/product/goods/37157296
[prototype-in-javascript-link]: https://junhyunny.github.io/javascript/prototype-in-javascript/