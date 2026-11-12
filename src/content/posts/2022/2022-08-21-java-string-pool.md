---
title: "자바 문자열 풀(Java String Pool)"
publishedAt: "2022-08-21"
updatedAt: "2026-11-12T16:18:37+09:00"
canonicalPath: "/java/java-string-pool/"
categories:
  - "java"
summary: "자바 문자열 풀의 위치와 저장 대상, String Interning과 intern 메서드로 문자열이 풀에 저장되는 시점을 정리했다."
recommendedPosts:
  - title: "JVM(Java Virtual Machine)"
    href: "https://junhyunny.github.io/information/java/what-is-jvm/"
---

## 0. 들어가면서

경험한 레거시 시스템들을 돌이켜 보면 문자열을 비교할 때 동등 연산자(==)를 사용한 코드를 종종 봤다. 초보 개발자의 실수인지 엄청난 고수의 설계인지는 모르겠지만, 시스템은 정상적으로 동작했다. 당시엔 왜 정상적으로 동작했는지 찾아보지 않았는데, 나중에 `Java`의 문자열 풀(String Pool) 개념을 알게 되면서 이 현상을 이해하게 됐다. 이번 글에서는 문자열 풀을 정리했다.

## 1. 문자열 풀(String Pool)

문자열은 `Java` 애플리케이션에서 정말 많이 사용하는 자료형이다. `JVM(Java Virtual Machine)`은 메모리를 효율적으로 운영하기 위해 문자열 풀을 사용한다.

문자열 풀은 문자열을 저장하는 `JVM`의 특이한 메모리 영역이다. 같은 값을 가지는 문자열이 문자열 풀에 존재하는지 확인하고, 존재한다면 해당 문자열을 참조해 사용한다.

아래 테스트 코드로 정말 같은 주소의 객체를 참조하는지 확인할 수 있다. `first` 객체와 `second` 객체는 같은 문자열 값을 가진다. `System` 클래스의 `identityHashCode` 메서드로 `first`와 `second` 변수가 참조하는 객체의 주소가 같음을 확인하고, 동등 연산자로 두 변수가 참조하는 객체가 같음을 확인한다.

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

문자열 풀의 위치는 JDK 7 버전부터 변경되었다.

- JDK 6 버전까지 `Permanent Generation` 메모리 영역 사용
  - `PermGen` 영역이라고도 불리며 메인 힙(heap) 메모리 영역과 분리된 특별한 힙 영역이다.
  - 로딩된 클래스들의 메타데이터(metadata)를 저장한다.
  - `PermGen` 영역은 사이즈가 고정되어 런타임 시 확장이 불가능하고, GC(Garbage Collection) 대상이 아니었다.
  - 문자열 풀을 과도하게 사용하면 `OOM(OutOfMemory)` 에러가 발생할 위험이 높았다.
  - 참고로 `PermGen` 영역은 JDK 8 버전에 사라지고 `Metaspace`로 대체되었다.
- JDK 7 버전부터 `Heap` 메모리 영역 사용
  - `PermGen` 영역을 사용할 때의 문제점을 해결하기 위해 문자열 풀을 힙 영역으로 옮겼다.
  - GC를 수행할 수 있기 때문에 OOM 에러의 위험을 많이 줄였다.

## 2. 문자열 풀에 저장되는 대상

문자열 객체라고 모두 문자열 풀에 저장되는 대상은 아니다. 리터럴(literal) 문자열은 문자열 풀의 저장 대상이지만, `String` 클래스 생성자로 만든 문자열은 저장 대상이 아니다. 리터럴 문자열은 큰따옴표("")를 이용해 선언한 문자열이다.

아래 테스트 코드로 확인해 보자. `literal` 객체와 `stringObject` 객체는 같은 문자열 값을 가진다. `System` 클래스의 `identityHashCode` 메서드로 `literal`과 `stringObject` 변수가 참조하는 객체의 주소가 다름을 확인하고, 동등 연산자로 두 변수가 참조하는 객체가 다름을 확인한다.

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

두 문자열은 힙 메모리의 서로 다른 위치에 저장된다. 리터럴로 생성한 문자열은 힙 영역 안의 문자열 풀에 저장되고, `String` 클래스 생성자로 만든 객체는 문자열 풀을 제외한 힙 영역에 저장된다. `String` 생성자로 문자열 객체를 만드는 방식은 문자열 풀을 이용하지 못하므로 지양한다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/java-string-pool-01.png" width="100%" class="image__border">
</div>
<center>https://www.javatpoint.com/string-pool-in-java</center>

## 3. 문자열 풀에 저장되는 시점

문자열이 풀에 저장되는 시점을 찾아봤다.

### 3.1. String Interning

모든 리터럴 문자열은 값마다 오직 하나의 사본만 저장하고, 이를 재사용한다. 이 프로세스를 `String Interning`이라고 하며, 컴파일 시점에 자동으로 이뤄진다. 앞의 테스트 코드를 다시 살펴보자.

- `first` 변수가 참조하는 "Junhyuuny" 문자열은 컴파일 시점에 풀에 새롭게 저장된다.
- `second` 변수가 참조하는 "Junhyuuny" 문자열은 풀에 저장되어 있으므로 재사용한다.
- `first` 변수와 `second` 변수는 결국 같은 객체를 참조한다.

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

### 3.2. 명시적인 intern 메서드 호출

`String` 클래스의 `intern` 메서드를 호출하면 명시적으로 문자열을 풀에 저장할 수 있다. `intern` 메서드는 해당 문자열과 같은 값을 가지는 문자열을 풀에서 반환한다. 같은 값의 문자열이 이미 풀에 있으면 풀에 저장된 문자열을 반환하고, 없으면 풀에 그 문자열을 저장한 뒤 참조를 반환한다.

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

간단한 테스트 코드로 동작을 확인할 수 있다. `literal` 변수가 참조하는 "Junhyunny" 문자열은 컴파일 시점에 풀에 새로 저장된다. 이후 `new String("Junhyunny")` 객체의 `intern` 메서드를 호출하면 "Junhyunny" 문자열이 이미 풀에 저장되어 있으므로 `literal` 변수가 참조하는 객체와 같은 참조 값이 반환된다.

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

이 글을 작성하면서 읽은 레퍼런스나 글을 보면 런타임 상수 풀(Runtime Constant Pool)과 문자열 풀의 개념이 혼용되는데, 두 개념 사이의 정확한 관계를 정의하지 못했다. 둘의 관계를 다룬 공식 문서나 레퍼런스는 찾지 못했지만, 이를 추정할 수 있는 몇 가지 내용을 다음 글로 정리해 볼 생각이다.

이번 글을 정리하는 차원에서 간단한 문제를 남기고 글을 마무리한다. 아래 내용을 떠올리며 문제를 풀어 보면 좋을 것 같다.

- 리터럴 문자열들은 `String Interning` 처리로 컴파일 시점에 자동으로 문자열 풀에 등록, 재사용된다.
- `Java`의 문자열은 불변(immutable)하기 때문에 덧셈 연산으로 생성되는 문자열은 같은 값을 가지더라도 새로운 객체다.
- `intern` 메서드를 사용하면 문자열 풀에 새로운 문자열을 저장하거나, 이미 있는 문자열을 참조해 사용할 수 있다.

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

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-08-21-java-string-pool>

#### REFERENCE

- <https://www.baeldung.com/java-string-pool>
- <https://www.baeldung.com/java-string-constant-pool-heap-stack>
- <https://www.baeldung.com/java-permgen-metaspace>
- <https://javajee.com/string-interning-in-java-with-examples>
- <https://docs.oracle.com/javase/specs/jvms/se11/html/jvms-2.html#jvms-2.5.4>
- <https://docs.oracle.com/javase/specs/jvms/se11/html/jvms-2.html#jvms-2.5.5>
- <https://docs.oracle.com/javase/specs/jvms/se6/html/Overview.doc.html#22972>
- <https://stackoverflow.com/questions/57414169/string-pool-do-string-always-exist-in-constant-pool>
- <https://stackoverflow.com/questions/23252767/string-pool-vs-constant-pool/23253122#23253122>
- <https://stackoverflow.com/questions/64630087/in-java-literal-strings-only-stored-in-the-string-constant-pool?noredirect=1&lq=1>
