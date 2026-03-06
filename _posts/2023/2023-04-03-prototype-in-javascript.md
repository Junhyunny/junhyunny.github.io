---
title: 자바스크립트 프로토타입 (JavaScript Prototype)
search: false
category:
  - javascript
last_modified_at: 2026-03-06T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Create Object in JavaScript][create-object-in-javascript-link]

## 0. 들어가면서

이번 글은 자바스크립트(JavaScript)의 프로토타입(prototype)에 관련된 내용을 다룬다. 주제 특성상 객체라는 말을 많이 사용한다. 자바스크립트에선 함수도 객체이기 때문에 글의 내용이 다소 헷갈릴 수 있다. 이를 구분 짓기 위해 생성자 함수를 통해 만들어진 객체는 인스턴스(instance)라고 명명한다.

## 1. Prototype in JavaScript

자바스크립트는 프로토타입 기반(prototype-based)의 객체지향(object-oriented) 프로그래밍 언어이다. `Java` 같은 클래스 기반 프로그래밍 언어처럼 클래스를 활용한 상속이나 캡슐화는 없지만, 프로토타입으로 객체지향적 메커니즘(mechanism)을 지원한다. `ES6(ECMAScript6)`부터 클래스를 지원하지만, 클래스도 사실 함수이며 프로토타입 기반의 인스턴스를 생성한다.

상속(inheritance)은 객체지향 프로그래밍에서 핵심적인 개념이다. 상속을 통해 특정 객체의 프로퍼티(property)나 메서드(method)를 재사용할 수 있다. 자바스크립트에선 상위 프로토타입 객체로부터 메서드와 속성을 상속 받아 재사용한다. 정확히 말하면 상위 프로토타입 객체를 참조하여 자신에게 없는 상태와 기능을 확장하여 사용한다. 프로토타입 객체도 상위 프로토타입을 가지며 `프로토타입 체인(prototype chain)`을 통해 접근할 수 있다. 

간단한 예제 코드를 통해 상속에 대해 알아보자. 예제 코드는 브라우저 개발자 도구(F12) 콘솔에서 실행시킬 수 있다. 아래는 상속이 없는 예제 코드다. 

- 첫번째 생성한 인스턴스의 `getArea` 메서드는 두번째 생성한 인스턴스의 `getArea` 메서드와 다르다.
- 같은 기능을 수행하지만, 인스턴스를 생성할 때마다 매번 새로 생성한다.

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

프로토타입을 사용하면 함수를 재사용 할 수 있다. 이를 통해 상속과 같은 효과를 얻을 수 있다.

- 첫번째 생성한 인스턴스의 `getArea` 메서드는 두번째 생성한 인스턴스의 `getArea` 메서드가 같다.
- 같은 기능을 수행하는 메서드를 프로토타입 객체에 정의하고 재사용한다.

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

`Circle` 함수는 생성자로써 사용했다. 자바스크립트에서 모든 함수는 생성자로써 사용할 수 있다. 함수와 생성자는 단지 구분해서 사용할 뿐이다. 일반 함수 호출과 다르게 생성자는 `new` 키워드를 함께 사용한다. 생성자 함수의 이름 맨 앞 글자가 대문자인 이유는 일반 함수와 용도를 나누기 위한 이름 규칙(naming convention)이다.

프로토타입 객체는 함수가 선언될 때 항상 쌍(pair)으로 함께 생성된다. 생성자 함수는 `prototype`, 프로토타입 객체는 `constructor`라는 프로퍼티를 사용해 서로를 참조한다. 생성자 함수로 인스턴스를 생성하는 경우 생성된 인스턴스는 `내부 링크`를 통해 프로토타입 객체를 참조한다. 각 함수 객체의 구조를 살펴보기 위해 아래와 같은 코드를 실행해보자.

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

위 코드를 실행하면 다음과 같은 결과를 볼 수 있다.

- 동일한 색상의 박스는 동일한 객체 정보를 의미한다.

<div align="left">
  <img src="/images/posts/2023/prototype-in-javascript-01.png" width="60%" class="image__border">
</div>

생성자 함수와 프로토타입 객체의 관계는 다음과 같다.

- `생성자 함수` 객체는 `prototype` 프로퍼티로 `생성자 함수 프로토타입` 객체를 참조한다.
- `생성자 함수 프로토타입` 객체는 `constructor` 프로퍼티로 `생성자 함수` 객체를 참조한다.

<div align="center">
  <img src="/images/posts/2023/prototype-in-javascript-02.png" width="80%" class="image__border">
</div>

<br />

위에서 소개한 상속이 없는 예제 코드에서 객체들은 다음과 같은 연결 고리를 갖는다.

- Circle 생성자 함수를 통해 두 개의 인스턴스를 만든다.
  - `radius` 프로퍼티는 생성자 함수 내부에 정의되어 있다.
  - `getArea` 메서드는 생성자 함수 내부에 정의되어 있다.
- 생성자 함수 내부에 정의된 프로퍼티와 메서드는 인스턴스가 만들어질 때 내부에 함께 생성된다.

<div align="center">
  <img src="/images/posts/2023/prototype-in-javascript-03.png" width="80%" class="image__border">
</div>

<br />

프로토타입 객체를 통한 상속 예제 코드에서 객체들은 다음과 같은 연결 고리를 갖는다.

- Circle 생성자 함수를 통해 두 개의 인스턴스를 만든다.
  - `radius` 프로퍼티는 생성자 함수 내부에 정의되어 있다.
- Circle 생성자 함수의 프로토타입 객체에 `getArea` 메서드를 정의한다.
- 생성자 함수 내부에 정의된 프로퍼티는 인스턴스를 만들 때 인스턴스 내부에 함께 생성된다.
- 프로토타입 객체에 정의한 메서드는 생성된 인스턴스에는 존재하지 않는다.
  - 인스턴스 내부 링크를 통해 참조하는 프로토타입 객체의 기능을 재사용한다.

<div align="center">
  <img src="/images/posts/2023/prototype-in-javascript-04.png" width="80%" class="image__border">
</div>

## 2. `__proto__` Accessor Property

`console.dir` 함수로 객체 정보를 출력하면 `[[Prototype]]`이란 이름의 내부 슬롯을 볼 수 있다. `[[Prototype]]`은 해당 객체가 참조하는 상위 프로토타입 객체를 의미하지만, 직접 접근할 수 없다.

```javascript
console.dir(circle.[[Prototype]]); // Uncaught SyntaxError: Unexpected token '['
```

함수 객체는 `prototype`이라는 프로퍼티를 통해 프로토타입 객체를 참조하듯이 JavaScript 세상 속 인스턴스들은 `__proto__` 접근자 프로퍼티를 통해 프로토타입 객체를 참조한다. 함수 객체와 인스턴스는 서로 다른 프로퍼티를 통해 같은 객체를 바라보고 있다.

```javascript
function Circle(radius) {
    this.radius = radius;
}

const circle = new Circle(1);

console.dir(circle);
console.dir(circle.__proto__ === Circle.prototype);
```

위 코드를 실행하면 다음과 같은 로그를 볼 수 있다.

<div align="left">
  <img src="/images/posts/2023/prototype-in-javascript-05.png" width="60%" class="image__border">
</div>

## 3. Summary

위의 내용들을 다시 정리해보자. 요약한 내용을 따라 객체들의 참조 모습을 직접 그려보면 이해하는데 큰 도움이 된다.

- `함수A`가 존재한다.
  - `함수A`를 선언하면 `함수A`가 생성자로 사용될 때 필요한 프로토타입 객체가 함께 생성된다.
  - `함수A`는 `prototype` 프로퍼티를 통해 자신의 프로토타입 객체를 참조한다.
  - `함수A`의 프로토타입 객체는 `constructor` 프로퍼티를 통해 `함수A`를 참조한다.
- `함수A`를 생성자로 사용해 만든 `인스턴스A`가 존재한다.
  - `인스턴스A`는 `[[Prototype]]`이라는 내부 슬롯을 통해 자신의 프로토타입 객체를 참조한다.
  - `[[Prototype]]`를 직접 사용할 수 없으므로 `__proto__` 접근자 프로퍼티를 사용한다.
  - `인스턴스A`는 `함수A`를 통해 만들어졌으므로 `인스턴스A.__proto__`가 가르키는 객체는 `함수A.prototype`과 동일하다.

<div align="center">
  <img src="/images/posts/2023/prototype-in-javascript-06.png" width="80%" class="image__border">
</div>

<br />

자바스크립트에선 함수도 객체이다. `function` 키워드를 통해 함수를 정의하는 행위는 Function 생성자를 통해 함수 객체를 만드는 것과 동일하다. 아래 예제 코드를 살펴보자. `sum`은 함수이기도 하기 때문에 `prototype` 프로퍼티를 가지고 있다. 크롬에서 Function 생성자를 통해 함수를 생성하면 에러가 발생한다. 이에 관련된 내용은 [깃허브(github) 이슈](https://github.com/w3c/trusted-types/wiki/Trusted-Types-for-function-constructor)를 참고 바란다. 

Function 생성자를 사용한 예제는 [이 사이트](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Function)를 참고하길 바란다.

```javascript
const sum = function (a, b) {
    return a + b;
} 

console.dir(sum);
console.dir(sum.__proto__);
console.dir(sum.__proto__ === Function.prototype);
console.dir(sum.__proto__.constructor === Function);
```

위 코드를 실행하면 다음과 같은 로그를 볼 수 있다.

<div align="left">
  <img src="/images/posts/2023/prototype-in-javascript-07.png" width="60%" class="image__border">
</div>

<br />

생성자로 만든 인스턴스를 살펴보자. 인스턴스이므로 `prototype` 프로퍼티가 없다.

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

위 코드를 실행하면 다음과 같은 로그를 볼 수 있다.

<div align="left">
  <img src="/images/posts/2023/prototype-in-javascript-08.png" width="60%" class="image__border">
</div>

<br />

마지막으로 리터럴 방식으로 만든 인스턴스를 살펴보자. 객체이므로 `prototype` 프로퍼티가 없다.

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

위 코드를 실행하면 다음과 같은 로그를 볼 수 있다.

<div align="left">
  <img src="/images/posts/2023/prototype-in-javascript-09.png" width="60%" class="image__border">
</div>

## CLOSING

`__proto__`는 지원이 중단되었다.

> This feature is no longer recommended. Though some browsers might still support it, it may have already been removed from the relevant web standards, may be in the process of being dropped, or may only be kept for compatibility purposes. Avoid using it, and update existing code if possible; see the compatibility table at the bottom of this page to guide your decision. Be aware that this feature may cease to work at any time.

객체의 `[[Prototype]]`을 변경하는 것은 모든 브라우저 및 자바스크립트 엔진에서 매우 느린 작업이라고 한다. 오늘날 대부분의 브라우저에서 호환성을 보장하기 위해 지원되지만 더 나은 기능으로 `Object.getPrototypeof()` 메서드 사용이 권장된다.

#### REFERENCE

- [모던 자바스크립트 Deep Dive 자바스크립트의 기본 개념과 동작 원리][modern-javascript-book-link]
- [인사이드 자바스크립트 Inside JavaScript 핵심 개념과 원리를 정확하게.][inside-javascript-book-link]
- <https://developer.mozilla.org/ko/docs/Learn/JavaScript/Objects/Object_prototypes>
- <http://insanehong.kr/post/javascript-prototype/>
- <https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object/proto>
- <https://www.inflearn.com/questions/361135/proto-%EA%B0%80-deprecated%EB%90%9C-%EC%9D%B4%EC%9C%A0>

[modern-javascript-book-link]: http://www.yes24.com/product/goods/92742567
[inside-javascript-book-link]: http://www.yes24.com/product/goods/37157296
[create-object-in-javascript-link]: https://junhyunny.github.io/javascript/create-object-in-javascript/