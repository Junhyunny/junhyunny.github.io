---
title: "Java effectively final"
search: false
category:
  - java
last_modified_at: 2022-08-25T23:55:00
---

<br/>

## 0. 들어가면서

`Java`에서 람다식(lambda expression)을 사용할 때 이런 에러를 모두 한번씩은 봤을 것입니다. 

> Variable used in lambda expression should be final or effectively final

람다식 내부에서 사용하는 지역 변수는 `final`이거나 `effectively final`이어야 합니다. 
값을 변경할 수 없도록 제약하는 `final` 키워드는 익숙한데, `effectively final`은 조금 생소할 수 있습니다. 
이번 포스트를 통해 어떤 개념인지 알아보겠습니다. 

## 1. effectively final

> 실질적으로 `final`

컴파일러(compiler)는 메서드에 선언된 지역 변수가 람다식 내부에서 사용될 때 값이 변경되길 바라지 않습니다. 
그렇기 때문에 지역 변수는 앞에 `final` 키워드를 붙혀서 변경되지 않음을 개발자가 보장하던지, `final` 키워드가 붙은 변수처럼 초기화 이후에 읽기만 가능하도록 컴파일러가 제어합니다. 

##### 컴파일 에러 코드

* `localVariable` 변수 값을 변경하는 코드 때문에 컴파일 에러가 발생합니다. 

```java
    @Test
    void compile_error_when_change_local_variable_in_stream_foreach() {

        int localVariable = 0;

        List<Integer> numbers = Arrays.asList(1, 2, 3);
        numbers.stream().forEach(number -> {
            localVariable += number; // compile error: Variable used in lambda expression should be final or effectively final
        });
    }
```

##### 정상적인 코드

* `localVariable` 변수를 읽기만 합니다. 

```java
    @Test
    void compiled_when_read_only_in_stream_foreach() {

        int localVariable = 0;

        List<Integer> numbers = Arrays.asList(1, 2, 3);
        numbers.stream().forEach(number -> {
            System.out.println(localVariable + number);
        });
    }
```

## 2. 메모리 가시성(Visibility)과 스레드 안정성(Thread Safety)

람다식은 `Java`가 함수형 프로그램을 지원하기 위해 등장했습니다. 
맵(map), 리스트(list) 같은 컬렉션(collection)의 스트림(stream)과 함께 사용될 때는 가독성을 높여줍니다. 
병렬 처리를 수행하는 코드에도 람다식이 많이 사용됩니다. 

##### 람다식 병렬 처리 예시

* Thread 클래스를 사용한 병렬 처리
* CompletableFuture 클래스를 사용한 병렬 처리
* 컬렉션의 병렬 스트림(parallelStream)을 사용한 병렬 처리

```java
    @Test
    void parallel_task_with_lambda() {

        int localVariable = 0;

        Runnable runnable = () -> System.out.println(localVariable);

        // Thread 클래스 사용
        Thread thread = new Thread(runnable);
        thread.start();

        // CompletableFuture 클래스 사용
        CompletableFuture.runAsync(runnable);

        // parallel stream 사용
        List<Integer> numbers = Arrays.asList(1, 2, 3);
        numbers.parallelStream().forEach((number) -> System.out.println(localVariable + number));
    }
```

### 2.1. Capturing Lambdas

병렬 처리에 람다식이 사용되면서 몇 가지 문제가 발생합니다. 

* 스레드 별로 생성되는 스택(stack) 메모리에 대한 가시성(visibility) 문제
* 스레드 안정성(thread safety) 문제

각 스레드는 고유한 스택 메모리를 할당 받습니다. 
스택 메모리는 스레드 사이에서 공유되지 않습니다. 
다른 스레드가 사용 중인 스택에 어떤 변수가 있는지, 어떤 값을 가지는지 서로 알 수 없습니다. 
메서드 호출 시 스택에 올라간 지역 변수는 메서드 호출이 종료되면 함께 삭제되기도 합니다. 

이런 문제를 해결하기 위해 람다 캡처링(혹은 캡쳐링 람다)이라는 개념이 사용됩니다. 
다른 스레드에 의해 제어될 수 있는 람다식은 상위 스코프의 지역 변수를 사용할 때 자신의 스코프에 값을 그대로 복사하여 사용합니다. 
컴파일러는 람다식으로 인해 생성되는 익명 인스턴스(anonymous intsance)를 만들 때 자동으로 만들어지는 생성자를 통해 값을 복사합니다. 
이를 "변수를 캡처했다.(capture variables)" 라고 표현합니다. 

##### 스레드 스택 영역과 변수 캡처링

* 변수에 저장된 값을 캡처합니다.
    * 원시형(primitive) 변수는 저장된 값이 캡처됩니다.
    * 객체 변수는 참조하고 있는 객체의 주소 값이 캡처됩니다.
* `Thread1`의 foo 메서드 호출이 종료되면 함께 삭제되는 지역 변수들의 값을 `Thread2`에서 계속 사용할 수 있습니다. 
* `Thread1`이 foo 메서드를 수행하면서 지역 변수의 값을 바꿈으로써, `Thread2` 실행 시 개발자가 의도치 않은 수행 결과가 나오는 것을 방지합니다.

<p align="center">
    <img src="/images/java-effectively-final-1.JPG" width="80%" class="image__border">
</p>

## 3. Why must local variable be effectively final or final in Lambda Expressions?

> 왜 람다식에서 사용하는 지역 변수는 `final`이거나 `effectively final`이어야 하나? 

`'값을 복사하여 사용하기 때문에 변경되어도 상관없지 않을까?'`라는 생각이 들었습니다. 
공식적인 문서에선 찾지 못 했지만, `StackOverflow`, `Baeldung` 그리고 블로그 등에서 참고하였을 때 람다식에서 사용하는 값이 최신임을 보장하기 위함이라는 의견이 많았습니다. 

* `CompletableFuture` 클래스의 `runAsync` 메서드에 람다식을 전달하여 병렬 처리를 수행합니다. 
* `localVariableMultiThreading` 메서드를 실행 중인 스레드와 람다식을 수행하는 스레드는 서로 다릅니다. 
* 서로 다른 스레드이므로 각자 스택 메모리를 사용하고, 각 스택 영역에 존재하는 변수들의 값은 다른 스레드에선 확인이 불가능합니다.
* 람다식으로 생성된 익명 인스턴스의 실행 시점은 알 수 없는데, 외부 스코프에서 지역 변수 값을 변경하면 람다식에서 복사한 값은 최신 값이 아니게 됩니다.

```java
    void localVariableMultiThreading() {
        boolean run = true;
        CompletableFuture.runAsync(() -> {
            // compile error
            while (run) { // Variable used in lambda expression should be final or effectively final
                // do operation
            }
        });
        run = false;
    }
```

## 4. Non-Capturing Variables

지역 변수는 스레드별로 사용되는 스택 메모리를 서로 참조할 수 없다는 특성상 값을 복사하여 사용하였습니다. 
이와는 다르게 인스턴스 변수는 힙(heap) 영역에 할당되고, 스태틱(static) 변수는 메서드(method) 영역에 선언되므로 값 복사가 불필요합니다. 
캡처링이 발생하지 않기 때문에 최신 값임을 보장할 필요가 없어서 `final`이거나 `effectively final`이지 않아도 됩니다. 

##### 정상적으로 컴파일되는 코드

```java
public class EffectivelyFinalTests {

    int instanceVariable = 0;
    static int staticVariable = 0;

    @Test
    void compiled_when_use_instance_and_static_variable_in_lambda() {
        this.instanceVariable = 10;
        EffectivelyFinalTests.staticVariable = 10;
        Runnable runnable = () -> {
            this.instanceVariable++;
            EffectivelyFinalTests.staticVariable++;
        };

        Thread thread = new Thread(runnable);
        thread.start();
    }
}
```

##### 스레드의 인스턴스 변수, 스태틱 변수 참조

* 인스턴스 변수는 `this` 키워드를 사용하여 접근 가능합니다.
    * 람다식 내부에서 인스턴스 변수를 사용하지 않으면 `this` 키워드는 유효하지 않습니다. 
* 스태틱 변수는 클래스 이름을 사용하여 접근 가능합니다.

<p align="center">
    <img src="/images/java-effectively-final-2.JPG" width="80%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-08-24-java-effectively-final>

#### REFERENCE

* <https://docs.oracle.com/javase/tutorial/java/javaOO/localclasses.html>
* <https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html>
* <https://www.baeldung.com/java-effectively-final>
* <https://www.baeldung.com/java-lambda-effectively-final-local-variables>
* <https://stackoverflow.com/questions/39889003/effectively-final-inner-classes-access>
* <https://stackoverflow.com/questions/67065119/why-dont-instance-fields-need-to-be-final-or-effectively-final-to-be-used-in-la>
* <https://stackoverflow.com/questions/4732544/why-are-only-final-variables-accessible-in-anonymous-class/4732617#4732617>
* <https://www.lambdafaq.org/what-are-the-reasons-for-the-restriction-to-effective-immutability/>
* <https://madplay.github.io/post/effectively-final-in-java>