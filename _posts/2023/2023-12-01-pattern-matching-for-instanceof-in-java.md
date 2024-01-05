---
title: "Pattern Matching for instanceof in Java"
search: false
category:
  - java
last_modified_at: 2023-12-01T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Static / Dynamic Typed Language][type-of-language-link]

## 1. Traditional instanceof Operator

레거시 시스템에서 컬렉션을 사용한 코드나 서블릿 컨테이너의 코드를 보면 Object 타입을 사용하는 경우를 종종 볼 수 있습니다. Object 타입인 경우 객체의 타입을 모르기 때문에 형 변환(type casting)을 수행하는데 이때 ClassCastException 예외가 발생하기도 합니다. 이런 예외를 피하기 위해 instanceof 명령어를 사용합니다. 

사용하기 전에 타입을 확인하기 위해 instanceof 명령어를 사용하면 인스턴스를 캐스팅(casting)하는 코드가 자연스럽게 따라옵니다. 타입이 지정되지 않은 맵(map)에서 객체를 꺼내는 간단한 예제 코드를 살펴보겠습니다.  

- 꺼낸 객체의 타입을 instanceof 명령어로 확인합니다. 
- 타입이 일치하는 경우 인스턴스를 캐스팅한 후 비즈니스 로직을 수행합니다. 

```java
import java.util.HashMap;
import java.util.Map;

class Cat {
    void meow() {
        System.out.println("meow");
    }
}

class Dog {
    void bowwow() {
        System.out.println("bowwow");
    }
}

public class Main {

    static Map contextMap = new HashMap();

    static {
        contextMap.put("animal", new Cat());
    }

    public static void main(String[] args) {
        Object animal = contextMap.get("animal");
        if (animal instanceof Cat) {
            Cat cat = (Cat) animal;
            cat.meow();
        } else if (animal instanceof Dog) {
            Dog dog = (Dog) animal;
            dog.bowwow();
        }
    }
}
```

## 2. Pattern Matching for instanceof

기존 instanceof 문법은 다음과 같은 문제점들이 있습니다. 

- if-else 블럭마다 캐스팅하는 코드가 함께 추가됩니다.
- 불필요한 캐스팅 작업들이 포함되면서 가독성을 낮춥니다.

자바(java)는 현대적인 문법을 지원하기 위해 계속 노력하고 있는데, JDK 14에 미리 보기(preview)로 instanceof 문법에 패턴 매칭이 적용된 기능이 추가되었습니다. 이후 JDK 16에 정식으로 포함됩니다. 

- [JEP 305](https://openjdk.org/jeps/305)
- [JEP 375](https://openjdk.org/jeps/375)
- [JEP 394](https://openjdk.org/jeps/394)

패턴 매칭이 적용된 instanceof 명령어는 타입 확인과 변수 선언이 동시에 이뤄집니다. 선언된 변수는 해당 컨텍스트가 유효한 스코프 안에서만 사용할 수 있습니다. 

```java
    public static void main(String[] args) {
        Object animal = contextMap.get("animal");
        if (animal instanceof Cat cat) {
            cat.meow();
        } else if (animal instanceof Dog dog) {
            dog.bowwow();
        }
    }
```

컨텍스트가 유효하지 않은 외부 스코프에서 호출하는 경우 컴파일 에러가 발생합니다. 예를 들면 다음과 같은 코드는 컴파일 에러가 발생합니다. 

- if 블럭 외부에서 cat 변수를 사용하면 변수를 찾을 수 없다는 컴파일 에러가 발생합니다.

```java
    public static void main(String[] args) {
        Object animal = contextMap.get("animal");
        if (animal instanceof Cat cat) {
            cat.meow();
        } else if (animal instanceof Dog dog) {
            dog.bowwow();
        }
        cat.meow(); // compile error
    }
```

## CLOSING

자바는 정적 타입 언어이기 때문에 변수를 선언할 때 타입을 명시적으로 작성해야 했습니다. 명시적인 타입 선언은 코드가 길어지기 때문에 읽거나 작성할 때 불편함이 있었습니다. 이런 불편함을 덜고자 JDK 10부터 var 키워드와 지역 변수 타입 추론 기능을 추가했습니다. 자바 진영은 오래된 언어임에도 불구하고 현대적인 코드 문법을 유지하기 위해 부단히 노력하는 것 같습니다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-12-01-pattern-matching-for-instanceof-in-java>

#### REFERENCE

- <https://www.baeldung.com/java-pattern-matching-instanceof>
- <https://openjdk.org/jeps/305>
- <https://openjdk.org/jeps/375>
- <https://openjdk.org/jeps/394>
- <https://openjdk.org/jeps/286>

[type-of-language-link]: https://junhyunny.github.io/information/type-of-language/