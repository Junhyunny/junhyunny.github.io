---
title: "Java String Pool"
search: false
category:
  - java
last_modified_at: 2022-08-21T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [JVM(Java Virtual Machine)][what-is-jvm-link]

## 0. 들어가면서

경험한 레거시 시스템들을 돌이켜보면 문자열 비교를 위해 동등 연산자(==)를 사용한 코드들을 종종 보곤 했습니다. 
초보 개발자의 실수인지 엄청난 고수의 설계인지는 모르겠지만, 시스템은 정상적으로 동작했습니다. 
당시엔 왜 정상적으로 동작했는지 찾아보지 않았는데, 나중에 `Java`의 문자열 풀(String Pool) 개념을 알게 되면서 해당 현상을 이해하게 되었습니다. 
이번 포스트는 문자열 풀에 대해 정리해보았습니다. 

## 1. 문자열 풀(String Pool)

문자열은 `Java` 애플리케이션에서 정말 많이 사용하는 자료형입니다. 
`JVM(Java Virtual Machine)`은 메모리를 효율적으로 운영하기 위해 문자열 풀을 사용합니다. 

문자열 풀은 문자열을 저장하는 `JVM`의 특이한 메모리 영역입니다. 
같은 값을 가지는 문자열이 문자열 풀에 존재하는지 확인하고, 만약 존재한다면 해당 문자열을 참조하여 사용합니다. 

아래 테스트 코드를 통해 정말 같은 주소의 객체를 참조하는지 확인할 수 있습니다. 

* `first` 객체와 `second` 객체는 같은 문자열 값을 가집니다. 
* System 클래스 identityHashCode 메소드를 사용하여 `first`와 `second` 변수가 참조하는 객체의 주소가 같음을 확인합니다.
* 동등 연산자를 사용해 `first`와 `second` 변수가 참조하는 객체가 같음을 확인합니다. 

```java
    @Test
    void first_and_second_string_refer_to_same_address() {
        String first = "Junhyuuny";
        String second = "Junhyuuny";

        assertThat(System.identityHashCode(first), equalTo(System.identityHashCode(second)));
        assertThat(first == second, equalTo(true));
        assertThat(first, sameInstance(second));
    }
```

### 1.1. 문자열 풀 위치

문자열 풀의 위치는 JDK 7 버전부터 변경되었습니다. 

* JDK 6 버전까지 `Permanent Generation` 메모리 영역 사용
    * `PermGen` 영역이라고도 불리며 메인 힙(heap) 메모리 영역과 분리된 특별한 힙 영역입니다.
    * 로딩된 클래스들의 메타 데이터(metadata)들을 저장합니다.
    * `PermGen` 영역은 사이즈가 고정되어 런타임 시 확장이 불가능하고, GC(Garbage Collection) 대상이 아니었습니다. 
    * 과도한 문자열 풀 사용시 `OOM(OutOfMemory)` 에러가 발생할 위험이 높았습니다.
    * 추가적으로 `PermGen` 영역은 JDK 8 버전에 사라지고 `Metaspace`로 대체되었습니다.
* JDK 7 버전부터 `Heap` 메모리 영역 사용
    * `PermGen` 영역을 사용할 때 문제점을 해결하기 위해 문자열 풀을 힙 영역으로 이동합니다.
    * GC 수행이 가능하기 때문에 OOM 에러의 위험을 많이 줄이게 되었습니다. 

## 2. 문자열 풀에 저장되는 대상

문자열 객체라고 모두 문자열 풀에 저장되는 대상은 아닙니다. 
리터럴(literal) 문자열은 문자열 풀의 저장 대상이지만, `String` 클래스 생성자를 통해 만들어진 문자열은 저장 대상이 아닙니다. 
리터럴 문자열은 쌍 따옴표("")를 이용해 선언한 문자열입니다. 

아래 테스트 코드를 통해 확인해보겠습니다. 

* `literal` 객체와 `stringObject` 객체는 같은 문자열 값을 가집니다. 
* System 클래스 identityHashCode 메소드를 사용하여 `literal`와 `stringObject` 변수가 참조하는 객체의 주소가 다름을 확인합니다.
* 동등 연산자를 사용해 `literal`와 `stringObject` 변수가 참조하는 객체가 다름을 확인합니다. 

```java
    @Test
    void literal_string_has_different_address_with_string_object() {
        String literal = "Junhyunny";
        String stringObject = new String("Junhyunny");

        assertThat(System.identityHashCode(literal), not(equalTo(System.identityHashCode(stringObject))));
        assertThat(literal != stringObject, equalTo(true));
        assertThat(literal, not(sameInstance(stringObject)));
    }
```

##### 힙 메모리에 저장되는 문자열 위치

* 리터럴로 생성한 문자열은 힙 영역 내 문자열 풀에 저장됩니다. 
* `String` 클래스 생성자를 통해 만들어진 객체는 문자열 풀을 제외한 힙 영역에 저장됩니다.
    * `String` 생성자를 이용해 문자열 객체를 만드는 방식은 문자열 풀을 이용하지 못하는 방식이므로 지양합니다.

<p align="center">
    <img src="/images/java-string-pool-1.JPG" width="80%" class="image__border">
</p>
<center>https://www.javatpoint.com/string-pool-in-java</center>

## 3. 문자열 풀에 저장되는 시점

문자열들이 풀에 저장되는 시점들을 찾아봤습니다. 

### 3.1. String Interning

모든 리터럴 문자열들을 대상으로 오직 하나의 카피만 저장하고, 이를 재사용합니다. 
이 프로세스를 `String Interning`이라고 하며, 컴파일 시점에 자동으로 이뤄집니다. 
위의 테스트 코드를 다시 살펴보겠습니다. 

* `first` 변수가 참조하는 "Junhyunny" 문자열은 컴파일 시점에 풀에 새롭게 저장됩니다.
* `second` 변수가 참조하는 "Junhyuuny" 문자열은 풀에 저장되어 있으므로 재사용합니다.
* `first` 변수와 `second` 변수는 결국 같은 객체를 참조합니다.

```java
    @Test
    void first_and_second_string_refer_to_same_address() {
        String first = "Junhyuuny";
        String second = "Junhyuuny";

        assertThat(System.identityHashCode(first), equalTo(System.identityHashCode(second)));
        assertThat(first == second, equalTo(true));
        assertThat(first, sameInstance(second));
    }
```

### 3.2. 명시적인 intern 메소드 호출

`String` 클래스를 보면 intern 메소드를 통해 명시적으로 문자열을 풀에 저장합니다. 

##### String 클래스 intern 메소드

* 해당 문자열과 동일한 값을 가지는 문자열을 풀에서 반환합니다.
* 동일한 값을 가지는 문자열이 이미 풀에 있는 경우 풀에 저장된 문자열이 반환합니다.
* 해당 값을 가지는 문자열이 풀에 없는 경우 풀에 해당 값을 가지는 문자열을 저장하고 참조를 반환합니다.

```java
    /**
     * Returns a canonical representation for the string object.
     * <p>
     * A pool of strings, initially empty, is maintained privately by the
     * class {@code String}.
     * <p>
     * When the intern method is invoked, if the pool already contains a
     * string equal to this {@code String} object as determined by
     * the {@link #equals(Object)} method, then the string from the pool is
     * returned. Otherwise, this {@code String} object is added to the
     * pool and a reference to this {@code String} object is returned.
     * <p>
     * It follows that for any two strings {@code s} and {@code t},
     * {@code s.intern() == t.intern()} is {@code true}
     * if and only if {@code s.equals(t)} is {@code true}.
     * <p>
     * All literal strings and string-valued constant expressions are
     * interned. String literals are defined in section 3.10.5 of the
     * <cite>The Java&trade; Language Specification</cite>.
     *
     * @return  a string that has the same contents as this string, but is
     *          guaranteed to be from a pool of unique strings.
     * @jls 3.10.5 String Literals
     */
    public native String intern();
```

##### intern 메소드 테스트

간단한 테스트 코드를 통해 동작을 확인할 수 있습니다.

* `first` 변수가 참조하는 "Junhyunny" 문자열은 컴파일 시점에 풀에 새롭게 저장됩니다.
* `new String("Junhyunny")` 객체의 `intern` 메소드를 호출합니다.
* "Junhyunny" 문자열은 이미 풀에 저장되어 있으므로 `first` 변수가 참조하는 객체와 동일한 참조 값이 반환됩니다.

```java
    @Test
    void literal_string_has_same_address_with_interned_string() {
        String literal = "Junhyunny";
        String internedString = new String("Junhyunny").intern();

        assertThat(System.identityHashCode(literal), equalTo(System.identityHashCode(internedString)));
        assertThat(literal == internedString, equalTo(true));
        assertThat(literal, sameInstance(internedString));
    }
```

## CLOSING

이 포스트를 작성하면서 읽은 레퍼런스들이나 포스트들을 보면 런타임 상수 풀(Runtime Constant Pool)과 문자열 풀에 대한 개념이 혼동되어 사용되는데, 두 개념 사이의 정확한 관계를 정의내리지 못 했습니다. 
둘 사이에 관련된 공식 문서나 레퍼런스들을 발견하진 못 했지만, 이를 추정할 수 있는 몇 가지 내용들을 다음 포스트로 정리해 볼 생각입니다. 

이번 포스트를 정리하는 차원에서 간단한 문제를 남기고 글을 마무리하겠습니다. 
아래 내용을 상기하여 문제를 풀어보시면 좋을 것 같습니다.

* 리터럴 문자열들은 `String Interning` 처리로 컴파일 시점에 자동으로 문자열 풀에 등록, 재사용된다. 
* `Java`의 문자열은 불변(immutable)하기 때문에 덧셈 연산으로 생성되는 문자열은 같은 값을 가지지만, 새로운 객체이다.
* `intern` 메소드를 사용하면 문자열 풀에 새로운 문자열을 저장하거나, 존재하는 문자열을 참조하여 사용할 수 있다.

```java
    @Test
    void guess_results() {
        String first = "Hello";
        String second = "World";
        String third = "HelloWorld";
        String fourth = first + second;

        System.out.println((first + second) == third);
        System.out.println((first + second) == fourth);
        System.out.println((first + second).intern() == third);
        System.out.println(fourth == third);
        System.out.println(fourth == third.intern());
        System.out.println(fourth.intern() == third);
    }
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-08-21-java-string-pool>

#### REFERENCE

* <https://www.baeldung.com/java-string-pool>
* <https://www.baeldung.com/java-string-constant-pool-heap-stack>
* <https://www.baeldung.com/java-permgen-metaspace>
* <https://javajee.com/string-interning-in-java-with-examples>
* <https://docs.oracle.com/javase/specs/jvms/se11/html/jvms-2.html#jvms-2.5.4>
* <https://docs.oracle.com/javase/specs/jvms/se11/html/jvms-2.html#jvms-2.5.5>
* <https://docs.oracle.com/javase/specs/jvms/se6/html/Overview.doc.html#22972>
* <https://stackoverflow.com/questions/57414169/string-pool-do-string-always-exist-in-constant-pool>
* <https://stackoverflow.com/questions/23252767/string-pool-vs-constant-pool/23253122#23253122>
* <https://stackoverflow.com/questions/64630087/in-java-literal-strings-only-stored-in-the-string-constant-pool?noredirect=1&lq=1>

[what-is-jvm-link]: https://junhyunny.github.io/information/java/what-is-jvm/