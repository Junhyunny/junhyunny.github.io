---
title: "Static/Dynamic Typed Language"
search: false
category:
  - information
last_modified_at: 2021-08-25T00:00:00
---

<br/>

## 1. Static Typed Language

> 정적 타입 언어<br/>
> 컴파일 시점에 변수의 타입이 결정되는 언어

팀 내의 엔지니어 수준 차이가 크거나 팀이 자주 바뀌는 경우 코드의 품질을 일정 수준 이상 유지시키기 위해 사용합니다. 
대표적인 정적 타입 언어는 C, C++, C#, Java 등이 있습니다. 
정적 타입 언어는 다음과 같은 장점을 가집니다. 

* 컴파일 시점에 에러를 찾을 수 있기 때문에 쉽고 빠르게 에러 확인이 가능합니다.
* 런타임 시 타입 충돌로 인한 에러를 사전에 방지할 수 있습니다. 

다음과 같은 단점을 가집니다.

* 타입 지정으로 코드가 길어지는 경향이 많습니다.

## 2. Dynamic Typed Languages

> 동적 타입 언어<br/>
> 런타임 시점에 변수의 타입이 결졍되는 언어

타입 확인이 필요 없기 때문에 빠르게 프로토타입(prototype)을 개발하고 피드백을 받아 수정할 수 있습니다. 
대표적인 동적 타입 언어는 JavaScript, Objective-C, PHP, Python, Ruby 등이 있습니다. 
동적 타입 언어는 다음과 같은 장점을 가집니다. 

* 타입을 지정할 필요가 없으니 그만큼 코드의 양이 줄어듭니다.
* 러닝 커브(learning curve)가 낮습니다. 

다음과 같은 단점을 가집니다.

* 런타임 시 타입 충돌로 인한 에러가 발생할 수 있다. 

#### REFERENCE

* <https://negabaro.github.io/archive/statically_type_lang__dynamically_type_lang>