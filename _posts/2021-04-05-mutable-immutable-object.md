---
title: "MUTABLE, IMMUTABLE 객체 차이점"
search: false
category:
  - information
  - java
last_modified_at: 2021-04-06T09:00:00
---

<br/>

## 1. MUTABLE 객체

> liable to change. '변경될 수 있습니다.'

MUTABLE 이라는 단어를 사전에서 찾아보면 `'변경될 수 있다.'`는 의미를 가지고 있습니다. 
이는 객체 생성 이후에도 객체의 속성이 변할 수 있음을 의미합니다. 
아래 테스트 코드를 통해 MUTABLE 객체에 대한 설명을 진행하겠습니다. 

### 1.1. MUTABLE 객체 테스트 코드

```java
package blog.in.action;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import lombok.extern.log4j.Log4j2;

@Log4j2
@SpringBootTest
public class MutableTest {

    class MutableObject {

        private int value;

        public MutableObject(int value) {
            this.value = value;
        }

        public int getValue() {
            return value;
        }

        public void setValue(int value) {
            this.value = value;
        }
    }

    @Test
    public void test() {
        MutableObject mutableObject = new MutableObject(0);
        log.info("값 변경 전 객체 주소: " + System.identityHashCode(mutableObject) + ", 객체 value 값: " + mutableObject.getValue());
        mutableObject.setValue(1);
        log.info("값 변경 후 객체 주소: " + System.identityHashCode(mutableObject) + ", 객체 value 값: " + mutableObject.getValue());
    }
}
```

##### 결과 로그
- mutableObject 변수에 새로운 객체를 하나 할당합니다.
- mutableObject이 가리키는 객체의 멤버 변수 value를 변경합니다.
- 로그를 통해 객체의 주소 값은 변경이 없지만 객체 내부의 value 값은 변경되었음을 확인할 수 있습니다.

```
2021-04-05 21:52:03.364  INFO 12388 --- [           main] blog.in.action.java.MutableTest          : 값 변경 전 객체 주소: 1200189587, 객체 value 값: 0
2021-04-05 21:52:03.364  INFO 12388 --- [           main] blog.in.action.java.MutableTest          : 값 변경 후 객체 주소: 1200189587, 객체 value 값: 1
```

##### MUTABLE 객체 값 변경 이미지
<p align="center"><img src="/images/mutable-immutable-object-1.gif" width="65%"></p>

### 1.2. MUTABLE 객체 사용시 주의점
Java에선 객체가 참조를 통해 공유되기 때문에 어떤 스레드에서 객체의 값을 변경할지 모릅니다. 
그렇기 때문에 MUTABLE 객체는 자연스럽게 **'thread-not-safe'** 하게 됩니다. 

## 2. IMMUTABLE 객체

> unchanging over time or unable to be changed.

IMMUTABLE 이라는 단어를 사전에서 찾아보면 `'변경될 수 없다.'`는 의미를 가지고 있습니다. 
MUTABLE 객체와 반대로 객체 생성 이후에 객체의 속성이 변할 수 없음을 의미합니다. 
대표적인 IMMUTABLE 객체인 String 클래스를 이용한 테스트를 통해 IMMUTABLE 객체의 특징을 알아보겠습니다. 

### 2.1. IMMUTABLE 객체 테스트 코드
```java
package blog.in.action;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import lombok.extern.log4j.Log4j2;

@Log4j2
@SpringBootTest
public class ImmutableTest {

    // ...

    @Test
    public void test() {
        String str = "A";
        log.info("값 변경 전 객체 주소: " + System.identityHashCode(str) + ", 객체 value 값: " + str);
        // str = str + "B";
        str = str.concat("B");
        log.info("값 변경 후 객체 주소: " + System.identityHashCode(str) + ", 객체 value 값: " + str);
    }
}

```

##### 결과 로그
- str 변수에 새로운 객체를 하나 할당합니다.
- str 변수가 가리키는 객체의 concat 메소드를 이용하여 문자열을 추가합니다.
- 로그를 통해 str 변수가 객체가 가르키는 객체의 주소와 값이 변경되었음을 확인할 수 있습니다.

```
2021-04-05 21:57:13.500  INFO 9516 --- [           main] blog.in.action.java.ImmutableTest        : 값 변경 전 객체 주소: 1080882047, 객체 value 값: A
2021-04-05 21:57:13.501  INFO 9516 --- [           main] blog.in.action.java.ImmutableTest        : 값 변경 후 객체 주소: 541434985, 객체 value 값: AB
```

##### IMMUTABLE 객체 값 변경 이미지
<p align="center"><img src="/images/mutable-immutable-object-2.gif" width="65%"></p>

### 2.2. 대표적인 Java IMMUTABLE 객체
- String, Boolean, Integer, Float, Long, Double

### 2.3. IMMUTABLE 객체를 사용하여 얻는 장단점
##### 장점
- 생성자, 접근 메소드에 대한 방어 복사가 필요없습니다.
- 멀티 스레드 환경에서 동기화 처리없이 객체를 공유할 수 있습니다. (thread-safe) 
- 불변이기 때문에 객체가 안전합니다.

##### 단점
- 객체가 가지는 값마다 새로운 객체가 필요하므로 메모리 누수의 위험이 존재합니다.
- 객체를 계속 생성해야하기 때문에 성능 저하를 발생시킬 수 있습니다.

### 2.4. IMMUTABLE 객체 만드는 방법
- 멤버 변수를 final로 선언합니다.
- 접근 메소드를 제공하지 않습니다. 

```java
class ImmutableObject {

    private final int value;

    public ImmutableObject(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }
}
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-04-05-mutable-immutable-object>

#### REFERENCE
- <https://limkydev.tistory.com/68>