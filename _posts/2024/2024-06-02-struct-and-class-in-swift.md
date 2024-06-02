---
title: "Struct and Class in Swift"
search: false
category:
  - swift
last_modified_at: 2024-06-02T23:55:00
---

<br/>

## 0. 들어가면서

최근 프로젝트에서 iOS 애플리케이션을 개발 중이기 때문에 Swift 언어를 사용하지만, 필자는 Swift 언어에 대한 개념이 부족하다. Swift 개발자들에겐 기초 개념이겠지만, 구조체(struct)와 클래스(class)의 차이를 모른 채 리팩토링 한 코드에서 에러가 발생했다. 이 에러를 해결하는 과정에서 배운 내용들을 정리헀다.

## 1. Value Type

구조체와 클래스로 생성된 객체들은 서로 타입이 다르다. 먼저 구조체를 살펴보자. 구조체로 생성한 객체는 값 타입(value type)이다. 값 타입은 다음과 같은 특징을 갖는다.

- 변수에 값 타입 인스턴스를 저장하면 인스턴스 자체를 저장된다.
- 다른 변수에 값 타입 인스턴스를 할당하면 새로운 인스턴스로 복사된다.
- 값 타입 인스턴스는 스택(stack)에 저장된다.
- struct, enum 키워드로 정의된 타입의 인스턴스는 값 타입이다.
- Int, Float, Double, Bool, String, Array, Dictionary, Set, Tuple 등은 구조체로 정의되어 있기 때문에 값 타입 인스턴스다.

필자가 겪었던 문제는 구조체로 선언한 값 타입 인스턴스의 복사가 일어나면서 실제 원본 인스턴스의 값이 설정되지 않아서 발생했다. 간단한 예제 코드를 통해 살펴보자. 다음과 같은 구조체가 있다.

- 브랜드, 색상, 이름, 옵션 등의 정보를 갖고 있다.

```swift
struct CarStruct {
    var brand: String
    var color: String
    var name: String
    var options: [String]
}
```

아래 코드를 통해 값 타입 인스턴스를 다른 변수에 저장할 때 복사가 일어나는지 살펴보자. 

1. CarStruct 구조체 인스턴스를 생성한다.
2. 인스턴스를 다른 변수에 복사한다.
3. 색상, 이름, 옵션을 변경한다.
4. 객체 상태를 출력한다.

```swift
var structCar = CarStruct(brand: "hyunDai", color: "red", name:"grandeur", options: ["loop", "cooling seat"]) // 1
var copiedStructCar = structCar // 2
copiedStructCar.color = "green" // 3
copiedStructCar.name = "sonata"
copiedStructCar.options = []

print("original car: ", structCar) // 4
print("copied car: ", copiedStructCar)
```

다음과 같은 결과를 얻는다.

- structCar 인스턴스의 상태는 변경되지 않는다.
- copiedStructCar 인스턴스의 상태는 변경된다.

```
"original car:  CarStruct(brand: "hyunDai", color: "red", name: "grandeur", options: ["loop", "cooling seat"])\n"
"copied car:  CarStruct(brand: "hyunDai", color: "green", name: "sonata", options: [])\n"
```

각 변수가 서로 다른 인스턴스를 저장한다. 각 인스턴스의 변화는 서로에게 영향을 주지 않는다. 즉, 기존 객체의 불변성(immutability)가 보장된다.

<div align="center">
  <img src="/images/posts/2024/struct-and-class-in-swift-01.png" width="80%" class="image__border">
</div>

## 2. Reference Type
 
클래스로 생성한 객체는 참조 타입(reference type)이다. 참조 타입은 다음과 같은 특징을 갖는다.

- 변수에 참조 타입을 저장하면 인스턴스의 주소가 저장된다.
- 다른 변수에 참조 타입 인스턴스를 할당하면 해당 인스턴스의 주소가 복사된다.
- 참조 타입 인스턴스는 힙(heap)에 저장된다.
- class 키워드로 정의된 타입의 인스턴스는 참조 타입이다.
- 함수(function)이나 클로저(closure)는 참조 타입처럼 참조(주소)만 복사한다.

다음과 같은 클래스가 있다. 구조체와 동일하다.

- 브랜드, 색상, 이름, 옵션 등의 정보를 갖고 있다.

```swift
class CarClass: CustomStringConvertible {
    var brand: String = ""
    var color: String = ""
    var name: String = ""
    var options: [String] = []
    
    init(brand: String, color: String, name: String, options: [String]) {
        self.brand = brand
        self.color = color
        self.name = name
        self.options = options
    }
    
    var description: String {
        return "CarClass(" +
        "brand: \(brand), " +
        "color: \(color), " +
        "name: \(name), " +
        "options: \(options))"
    }
}
```

값 타입 인스턴스와 동일한 방식으로 참조 타입 인스턴스를 다른 변수에 저장 후 변경해보자.

1. CarClass 클래스 인스턴스를 생성한다.
2. 인스턴스를 다른 변수에 복사한다.
3. 색상, 이름, 옵션을 변경한다.
4. 객체 상태를 출력한다.

```swift
var classCar = CarClass(brand: "hyunDai", color: "red", name:"grandeur", options: ["loop", "cooling seat"])
var copiedClassCar = classCar
copiedClassCar.color = "green"
copiedClassCar.name = "sonata"
copiedClassCar.options = []

print("original car: ", classCar)
print("copied car: ", copiedClassCar)
```

다음과 같은 결과를 얻는다.

- copiedClassCar 인스턴스의 상태 변화가 classCar 인스턴스에 반영된다.

```
"original car:  CarClass(brand: hyunDai, color: green, name: sonata, options: [])\n"
"copied car:  CarClass(brand: hyunDai, color: green, name: sonata, options: [])\n"
```

각 변수들은 서로 같은 인스턴스를 가르킨다. 즉, 여러 개의 변수들을 통해 하나의 인스턴스 상태를 변경할 수 있다. 기존 객체의 불변성이 보장되지 않는다. 

<div align="center">
  <img src="/images/posts/2024/struct-and-class-in-swift-02.png" width="80%" class="image__border">
</div>

## 3. Choosing Between Structures and Classes

애플 개발 문서의 [Choosing Between Structures and Classes](https://developer.apple.com/documentation/swift/choosing-between-structures-and-classes) 글을 보면 구조체와 클래스 중 어떤 것을 선택해야 하는지 가이드 라인을 제공한다. 개요에 핵심 내용이 잘 정리되어 있다. 

- Use structures by default.
- Use classes when you need Objective-C interoperability.
- Use classes when you need to control the identity of the data you’re modeling.
- Use structures along with protocols to adopt behavior by sharing implementations.

글의 내용을 요약하자면 기본적으로 구조체를 사용한다. Objective-C 상호 운용성이나 개발자가 모델링한 데이터 인스턴스의 동일함을 보장하고 제어하기 위해선 클래스를 사용한다. 프로토콜은 구조체, 클래스가 모두 상속 받을 수 있으므로 최초 상속 모델링은 프로토콜을 사용하는 것이 좋다. 프로토콜과 구조체를 사용해서 상속 모델링을 구현한다.

## CLOSING

필자의 경우 특정 인스턴스의 상태 변경을 애플리케이션 전역에서 사용할 수 있어야 했다. 구조체 인스턴스를 클래스 인스턴스로 변경해 문제를 해결했다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-06-02-struct-and-class-in-swift/action-in-blog>

#### REFERENCE

- <https://developer.apple.com/documentation/swift/choosing-between-structures-and-classes>
- <https://showcove.medium.com/swift-struct-vs-class-1-68cf9cbf87ca>
- <https://80000coding.oopy.io/036ecdfa-fe1a-4018-9418-2e127423e7b0>
- <https://didu-story.tistory.com/255>
- <https://velog.io/@eddy_song/Swift-Value-Reference>
- <https://stackoverflow.com/questions/36587104/swift-equivalent-of-java-tostring>