---
title: "Mutable/Immutable Object"
search: false
category:
  - information
  - java
last_modified_at: 2021-04-06T09:00:00
---

<br/>

## 1. Mutable Object

> 변경될 수 있는 객체

생성된 후 상태(state)가 변경될 수 객체를 의미합니다. 
`상태가 변경된다는 의미`는 객체 내 상태를 바꿀 수 있는 수단(method)이 외부에 노출되었다는 의미입니다. 

### 1.1. Example of Mutable Object

간단한 코드를 통해 변경 가능한 객체란 무엇인지 살펴보겠습니다. 

* change_state_single_thread 메서드
    * 객체를 생성 후 내부 멤버 변수인 value 값을 변경합니다.
    * 결과 값이 1임을 확인합니다.
* change_state_with_multi_thread 메서드
    * 객체를 생성합니다.
    * 스레드 10개를 담긴 스레드 풀(thread pool)을 생성합니다.
    * 객체의 value 값을 변경하는 작업을 여러 스레드를 통해 수행합니다.
        * 100개의 작업을 전달하고, 10개의 스레드가 작업들을 나눠서 수행합니다.
        * 루프 인덱스(index) 값으로 객체 상태를 변경합니다.
    * 모든 스레드가 작업을 마치길 기다린 후 상태를 로그로 확인합니다.

```java
package blog.in.action;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static java.lang.Thread.MAX_PRIORITY;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

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

@Slf4j
public class MutableTest {

    @Test
    void change_state_single_thread() {

        final MutableObject mutableObject = new MutableObject(0);


        mutableObject.setValue(1);


        assertThat(mutableObject.getValue(), equalTo(1));
    }

    @Test
    void change_state_with_multi_thread() throws InterruptedException {

        final MutableObject mutableObject = new MutableObject(0);


        ExecutorService executorService = Executors.newFixedThreadPool(10);
        for (int index = 0; index < 100; index++) {
            final int value = index;
            executorService.submit(() -> {
                mutableObject.setValue(value);
            });
        }
        executorService.shutdown();
        executorService.awaitTermination(MAX_PRIORITY, TimeUnit.HOURS);


        log.info("result - {}", mutableObject.getValue());
    }
}
```

##### Test Result

`change_state_single_thread` 메서드는 정상적으로 테스트가 통과하므로 살펴보지 않겠습니다. 
아래 로그는 `change_state_with_multi_thread` 메서드 수행 결과입니다. 

* 최종 값이 98입니다.
* 다중 스레드에 의해 처리되면서 매번 결과가 달라집니다. 

```
23:32:15.953 [main] INFO blog.in.action.MutableTest - result - 98
```

### 1.2. Conclusion

상태가 변경될 수 있다는 의미는 변수가 가르키는 객체가 바뀌는 것이 아닙니다. 
`final` 키워드가 붙은 변수로 객체를 참조한다고 해당 객체가 불변이 되는 것은 아닙니다. 
특정 객체가 자신의 상태를 변경시킬 수 있는 기능을 외부로 노출했다면 `변경 가능한(mutable) 객체`라고 판단할 수 있습니다. 
변경 가능한 객체는 외부 흐름(혹은 제어)에 의해 상태가 변경되면서 의도치 않은 결과가 발생할 수 있습니다. 
이를 `스레드 안전하지 않다(not thread safe)`고 표현합니다.

<p align="center">
    <img src="/images/mutable-immutable-object-1.gif" width="80%">
</p>

## 2. Immutable Object

> 변경될 수 없는 객체

생성된 이후에 상태가 변경되지 않는 객체를 의미합니다. 
불변 객체라고 표현합니다.

### 2.1. Example of Immutable Object

불변 객체의 특징을 테스트 코드를 통해 살펴보겠습니다.

* change_state_single_thread 메서드
    * 문자열 객체의 concat 메서드를 사용해 `Kang`을 추가합니다.
    * concat 메서드를 통해 변경되는 값은 `Junhyunny Kang` 입니다.
    * immutableObject 변수가 참조하는 객체의 값은 `Junhyunny`로 변함이 없습니다.
* change_state_with_multi_thread 메서드
    * 문자열 객체를 생성합니다.
    * 스레드 10개를 담긴 스레드 풀(thread pool)을 생성합니다.
    * 객체의 value 값을 변경하는 작업을 여러 스레드를 통해 수행합니다.
        * concat 메서드를 사용해 ` Kang`을 추가합니다.
        * 100개의 작업을 전달합니다.
        * 100개의 작업을 10개의 스레드가 나눠 수행합니다.
    * 모든 스레드가 작업을 마치길 기다립니다.
    * immutableObject 변수가 참조하는 객체의 값은 `Junhyunny`로 변함이 없습니다.

```java
package blog.in.action;

import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static java.lang.Thread.MAX_PRIORITY;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@Slf4j
public class ImmutableTest {

    @Test
    public void change_state_single_thread() {

        final String immutableObject = "Junhyunny";


        assertThat(immutableObject.concat(" Kang"), equalTo("Junhyunny Kang"));
        assertThat(immutableObject, equalTo("Junhyunny"));
    }

    @Test
    public void change_state_with_multi_thread() throws InterruptedException {

        final String immutableObject = "Junhyunny";


        ExecutorService executorService = Executors.newFixedThreadPool(10);
        for (int index = 0; index < 100; index++) {
            final int value = index;
            executorService.submit(() -> {
                immutableObject.concat(" Kang");
            });
        }
        executorService.shutdown();
        executorService.awaitTermination(MAX_PRIORITY, TimeUnit.HOURS);


        assertThat(immutableObject, equalTo("Junhyunny"));
    }
}
```

### 2.2. Conclusion

예시에서 보듯이 `Java`에서 문자열은 변경이 불가능합니다. 
변경이 발생하는 연산은 내부 상태를 바꾸는 것이 아니라 새로운 객체를 만들어 반환합니다. 
내부 상태가 변경되지 않기 때문에 여러 스레드에 의해 공유되어도 문제가 없습니다. 
이를 `스레드 안전하다(thread safe)`고 표현합니다. 

`Java`의 대표적인 불변 객체는 String, Boolean, Integer, Float, Long, Double 등이 있습니다. 
불변 객체를 사용하면 다음과 같은 장점이 있습니다. 

* 생성자, 접근 메서드에 대한 방어 복사가 필요하지 않습니다.
* 멀티 스레드 환경에서 동기화 처리 없이 객체를 공유할 수 있습니다.

다음과 같은 단점이 있습니다. 

* 객체의 상태가 변경될 때마다 새로 생성해야하기 때문에 성능 저하나 메모리 누수의 위험이 존재합니다.

<p align="center">
    <img src="/images/mutable-immutable-object-2.gif" width="80%">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-04-05-mutable-immutable-object>

#### REFERENCE

* <https://limkydev.tistory.com/68>