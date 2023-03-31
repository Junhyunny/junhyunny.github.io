---
title: "Create Object in JavaScript"
search: false
category:
  - javascript
last_modified_at: 2022-05-22T23:55:00
---

<br/>

## 1. 객체 생성하기

`JavaScript`는 두 가지 방법으로 객체를 생성할 수 있습니다. 
두 가지 방법을 살펴보고 어떤 차이점이 있는지 살펴보겠습니다. 
아래 코드들은 크롬 브라우저 개발자 모드(F12) 콘솔 탭에서 실행할 수 있습니다.

### 1.1. 리터럴 객체(Literal Object)

- 직관적이고 쉬운 방법으로 객체를 생성합니다.
- `{}` 안에 객체가 가진 속성(properties)들을 정의합니다.

```javascript
let person = {
    name: 'Junhyunny',
    sayName: function () {
        console.log(`My name is ${this.name}`);
    }
};

person.sayName();

console.dir(person);
```

##### 결과

<p align="left">
    <img src="/images/create-object-in-javascript-1.JPG" width="45%" class="image__border">
</p>

### 1.2. 불합리한 리터럴 방식의 객체 생성
리터럴 방식으로 객체를 생성하는 것은 쉽고 직관적이지만, 하나의 객체만 생성합니다. 
동일한 속성들을 가지는 객체가 여러 개일 경우 불합리적입니다. 

```javascript
let junhyunny = {
    name: 'Junhyunny',
    sayName: function () {
        console.log(`My name is ${this.name}`);
    }
};

let jua = {
    name: 'Jua',
    sayName: function () {
        console.log(`My name is ${this.name}`);
    }
};

junhyunny.sayName();
jua.sayName();
```

### 1.3. 생성자 함수(Constructor Function)

- `JavaScript`는 동일한 모습의 객체를 여러개 만들기 위해 더 효율적인 방법을 제공합니다. 
- 함수로 객체를 만들 수 있으며, `new` 연산자와 함께 함수를 호출하여 객체를 만들기 위한 생성자 함수로서 사용합니다. 
- 파스칼 네이밍 컨벤션(pascal naming convention)을 따라 생성자로 사용할 함수의 맨 앞 글자는 대문자를 사용합니다.

```javascript
function Person(name) {
    this.name = name;
    this.sayName = function () {
        console.log(`My name is ${this.name}`)
    }
};

let junhyunny = new Person('Junhyunny');
let jua = new Person('jua');

junhyunny.sayName();
jua.sayName();

console.dir(junhyunny);
```

##### 결과

<p align="left">
    <img src="/images/create-object-in-javascript-2.JPG" width="45%" class="image__border">
</p>

## 2. 생성자 함수 살펴보기

### 2.1. 생성자 함수 실행 과정

`new` 연산자와 함께 함수를 호출하면 다음과 같은 과정이 일어납니다.

1. 처음 함수를 호출하면 인스턴스(instance)가 생성되며, `this` 키워드에 바인딩됩니다.
1. `this` 키워드에 바인딩 된 객체의 속성들을 초기화합니다.
1. `return` 키워드가 없는 경우 암묵적으로 `this` 키워드에 바인딩 된 객체가 반환됩니다.

```javascript
function Person(name) {
    // 인스턴스(instance)가 생성되며, this 키워드에 바인딩됩니다.
    console.log(this);

    this.name = name;
    this.sayName = function () {
        console.log(`My name is ${this.name}`)
    }

    // 암묵적으로 this 키워드를 반환합니다.
};

new Person('Junhyunny');
```

### 2.2. new 연산자 없이 생성자 함수 호출

`new` 연산자 없이 생성자 함수를 호출하면 어떤 현상이 있는지 코드와 결과를 통해 확인해보겠습니다. 

##### 코드

```javascript
function Person(name) {
    this.name = name;
    this.sayName = function () {
        console.log(`My name is ${this.name}`)
    }
};

let junhyunny = Person('Junhyunny');

console.log('junhyunny - ', junhyunny);
console.log('window.name - ', window.name);

window.sayName();
```

##### 결과

<p align="left">
    <img src="/images/create-object-in-javascript-3.JPG" width="45%" class="image__border">
</p>

##### 원인

- `new` 연산자 없이 생성자 함수를 호출하는 것은 일반적인 함수를 호출하는 것과 동일합니다. 
- 별도 반환 값이 없기 때문에 코드의 `junhyunny` 객체는 `undefined` 입니다. 
- `Person` 함수 호출 시 내부 `this` 키워드에 바인딩되는 객체는 해당 함수를 호출한 객체입니다. 
- `Person` 함수는 전역 객체가 호출하였기 때문에 `this` 키워드에는 `window` 객체가 바인딩됩니다.
- `this` 키워드에 바인딩 된 `window` 객체의 `name` 속성과 `sayName()` 메소드가 만들어집니다. 

### 2.3. 생성자 함수 반환 값에 따른 동작

`new` 연산자와 함께 호출하는 생성자 함수는 별도로 반환하는 값이 없지만, 암묵적으로 `this` 키워드에 바인딩 된 객체를 반환합니다. 
생성자 함수가 특정 값을 반환하는 경우 어떤 현상이 있는지 확인해보겠습니다.

#### 2.3.1. 리터럴 객체 반환

- 리터럴 객체를 반환하는 경우 생성자를 통해 만들어진 객체 대신 반환하는 리터럴 객체가 그대로 반환됩니다.

```javascript
function Person(name) {
    this.name = name;
    this.sayName = function () {
        console.log(`My name is ${this.name}`)
    }
    return {
        name: 'Jua',
        sayHello: function () {
            console.log('Hello');
        }
    };
};

let junhyunny = new Person('Junhyunny');
junhyunny.sayHello();

console.dir(junhyunny);
```

##### 결과

<p align="left">
    <img src="/images/create-object-in-javascript-4.JPG" width="45%" class="image__border">
</p>

#### 2.3.2. 원시 타입(primitive type) 값 반환

- 원시 값을 반환하는 경우 `new` 연산자를 통해 함수를 만드는 것과 동일하게 동작합니다.
- 반환된 원시 타입의 값은 무시됩니다.
- `JavaScript`에서 취급하는 원시 타입은 다음과 같습니다.
    - Boolean 타입
    - Null 타입
    - Undefined 타입
    - Number 타입
    - BigInt 타입
    - String 타입
    - Symbol 타입
- 생성자 함수 내부에서 명시적으로 다른 값을 반환하는 코드는 생성자 함수의 기본 동작을 훼손하기 때문에 지양합니다.

```javascript
function Person(name) {
    this.name = name;
    this.sayName = function () {
        console.log(`My name is ${this.name}`)
    }
    return 'Person';
};

let junhyunny = new Person('Junhyunny');
junhyunny.sayName();

console.dir(junhyunny);
```

##### 결과

<p align="left">
    <img src="/images/create-object-in-javascript-5.JPG" width="45%" class="image__border">
</p>

## 3. 객체 생성 방법에 따른 차이점

리터럴 방식으로 만들어진 객체와 생성자를 통해 만들어진 객체는 어떤 차이점이 있는지 살펴보겠습니다. 
- 리터럴 방식으로 생성한 객체의 `[[Prototype]]` 객체는 `Object(Object.prototype)` 입니다.
- 생성자 방식으로 생성한 객체의 `[[Prototype]]` 객체는 `Person(Person.prototype)` 입니다.
    - `constructor` 속성에 `Person` 함수가 지정되어 있습니다.
    - 한 단계 더 아래 `[[Prototype]]` 객체는 `Object(Object.prototype)` 입니다.
- 생성자 함수를 통해 객체를 생성하는 경우 프로토타입(prototype) 객체가 지정됩니다.

<p align="center">
    <img src="/images/create-object-in-javascript-6.JPG" width="100%" class="image__border">
</p>

## 4. 강제 인스턴스 생성 패턴

생성자 함수는 일반 함수처럼 사용할 수 있기 때문에 맨 앞 글자가 대문자더라도 개발자의 실수로 `new` 연산자 없이 사용될 수 있습니다. 
이런 실수를 보완하기 위해 생성자 함수를 `new` 연산자 없이 호출하였음에도 인스턴스를 생성할 수 있도록 구현할 수 있습니다.  

### 4.1. new.target 키워드 사용

- `ES6`부터 지원합니다.
    - 생성자 함수로서 호출하면 `new.target`은 함수 자신을 가리킵니다.
    - 일반 함수로서 호출하면 `new.target`은 `undefined` 값을 가집니다.
- 함수 내부에서 `new.target` 키워드를 사용하여 `new` 연산자와 함께 호출되었는지 확인합니다.
- 아닌 경우 내부에서 생성자 함수를 `new` 연산자와 함께 호출하여 그 결과를 반환합니다.

```javascript
function Person(name) {

    if (!new.target) {
        return new Person(name);
    }

    this.name = name;
    this.sayName = function () {
        console.log(`My name is ${this.name}`)
    }
    return 'Person';
};

let junhyunny = Person('Junhyunny');
junhyunny.sayName();

console.dir(junhyunny);
```

### 4.2. instanceof 키워드 사용

- `new.target` 키워드는 `ES6`에서 도입된 최신 문법이며, IE(Internet Explorer)에선 지원하지 않습니다. 
- `instanceof` 키워드로 대체하여 구현할 수 있습니다.

```javascript
function Person(name) {

    if (!(this instanceof Person)) {
        return new Person(name);
    }

    this.name = name;
    this.sayName = function () {
        console.log(`My name is ${this.name}`)
    }
    return 'Person';
};

let junhyunny = Person('Junhyunny');
junhyunny.sayName();

console.dir(junhyunny);
```

#### REFERENCE

- [모던 자바스크립트 Deep Dive 자바스크립트의 기본 개념과 동작 원리][modern-javascript-book-link]
- [인사이드 자바스크립트 Inside JavaScript 핵심 개념과 원리를 정확하게.][inside-javascript-book-link]
- <https://developer.mozilla.org/ko/docs/Web/JavaScript/Data_structures>
- <https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/new.target>

[modern-javascript-book-link]: http://www.yes24.com/product/goods/92742567
[inside-javascript-book-link]: http://www.yes24.com/product/goods/37157296