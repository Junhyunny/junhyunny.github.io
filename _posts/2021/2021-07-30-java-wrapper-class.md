---
title: "자바 래퍼 클래스(Java Wrapper Class)"
search: false
category:
  - java
last_modified_at: 2026-05-07T21:45:56+09:00
---

<br/>

#### RECOMMEND NEXT POSTS

- [자바 래퍼 클래스(Java Wrapper Class) 오토 박싱(auto boxing)과 성능 이슈][auto-boxing-performance-link]

## 0. 들어가면서

면접에서 이런 질문을 받았다.

> 자바(Java) primitive type 변수가 존재하는데 래퍼(wrapper) 클래스가 생긴 이유가 무엇일까요?<br/>

선뜻 대답이 나오지 않는 어려운 질문이었다. 이 글에서는 래퍼 클래스가 무엇인지 알아보고, 마지막으로 위 질문에 대한 답변을 정리해 보았다.

## 1. Wrapper class

자바에는 기본형(primitive type) 데이터가 존재한다. 프로그래밍 언어를 처음 접할 때 주로 사용하는 자료형으로 int, char, byte, short, long, float, double, boolean 등이 이에 속한다. 이런 기본 타입의 값은 JVM 내의 스택(stack) 메모리에 저장된다. 이런 기본형 데이터를 감싸서(wrapping) 만든 것이 바로 래퍼(wrapper) 클래스이다. 각 기본형 데이터에 대응하는 래퍼 클래스가 존재한다. 참조 타입인 래퍼 클래스 객체는 JVM 내의 힙(heap) 메모리에 저장된다.

| 기본형 타입(primitive type) | 래퍼 클래스 |
|:---:|:---:|
| boolean | Boolean |
| char | Character |
| byte | Byte |
| short | Short |
| int | Integer |
| long | Long |
| float | Float |
| double | Double |

래퍼 클래스의 상속 관계를 보면 Boolean, Character 클래스를 제외하고 Number 클래스를 상속받는다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/java-wrapper-class-01.png" width="70%">
</div>
<center>https://codepumpkin.com/interview-questions-wrapper-classes/</center>

<br/>

간단하게 Integer 래퍼 클래스의 내부 구조를 들여다보자. 다른 래퍼 클래스도 비슷하게 구성되어 있다.

- 기본형 데이터 변수를 멤버로 두고, 관련된 연산을 메서드로 정의해두고 있다.
- 타입 정보, 최댓값, 최솟값 등 부가적인 기능을 위한 값을 별도로 저장하고 있다.
- 객체가 생성될 때 지정되는 값은 변경되지 않는다.

```java
public final class Integer extends Number implements Comparable<Integer> {

    @Native public static final int   MIN_VALUE = 0x80000000;

    @Native public static final int   MAX_VALUE = 0x7fffffff;

    @SuppressWarnings("unchecked")
    public static final Class<Integer>  TYPE = (Class<Integer>) Class.getPrimitiveClass("int");

    static final char[] digits = {
        '0' , '1' , '2' , '3' , '4' , '5' ,
        '6' , '7' , '8' , '9' , 'a' , 'b' ,
        'c' , 'd' , 'e' , 'f' , 'g' , 'h' ,
        'i' , 'j' , 'k' , 'l' , 'm' , 'n' ,
        'o' , 'p' , 'q' , 'r' , 's' , 't' ,
        'u' , 'v' , 'w' , 'x' , 'y' , 'z'
    };

    @HotSpotIntrinsicCandidate
    public static Integer valueOf(int i) {
        if (i >= IntegerCache.low && i <= IntegerCache.high)
            return IntegerCache.cache[i + (-IntegerCache.low)];
        return new Integer(i);
    }

    private final int value;

    static void formatUnsignedInt(int val, int shift, char[] buf, int offset, int len) {
        int charPos = offset + len;
        int radix = 1 << shift;
        int mask = radix - 1;
        do {
            buf[--charPos] = Integer.digits[val & mask];
            val >>>= shift;
        } while (charPos > offset);
    }

    // ...
}
```

## 2. Boxing / Unboxing

래퍼 클래스를 이야기할 때 빠지지 않는 내용이 있다. `박싱(Boxing)`과 `언박싱(Unboxing)`이다. `박싱`은 기본형 데이터를 래퍼 클래스의 인스턴스로 변환하는 과정을 의미한다. 반대로 `언박싱`은 래퍼 클래스의 인스턴스를 기본형 데이터로 변환하는 과정을 의미한다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/java-wrapper-class-02.png" width="45%">
</div>
<center>http://tcpschool.com/java/java_api_wrapper</center>

<br/>

JDK 1.5 버전부터 박싱과 언박싱이 필요하면 컴파일러가 자동으로 수행한다. 이를 `오토 박싱(auto boxing)`, `오토 언박싱(auto unboxing)`이라고 한다. 간단한 예제 코드를 살펴보자. 아래 코드는 박싱과 언박싱을 코드에서 직접 수행하는 방식이다.

```java
    Integer num = new Integer(17); // boxing, Deprecated since JDK1.9
    int n = num.intValue(); // unboxing
    Character ch = 'X'; // Character ch = new Character('X'); : autoboxing
    char c = ch; // char c = ch.charValue(); : autounboxing
```

JDK 1.5 이전에는 박싱 처리를 직접 수행한 후 컬렉션에 데이터를 추가했다.

```java
    int x = 10;
    ArrayList<E> list = new ArrayList();
    Integer wrapper = Integer.valueOf(x);
    list.add(wrapper);
```

JDK 1.5 이후부터 박싱 처리가 자동으로 수행되기 때문에 기본형 값을 추가해도 오토 박싱 후 리스트에 추가된다.

```java
    int x = 10;
    ArrayList<E> list = new ArrayList();
    list.add(10); // This is primitive type autoboxing in Java
```

## 3. 래퍼 클래스 사용 시 주의사항

박싱과 언박싱 기능이 자동으로 수행되면서 컴파일 에러는 나지 않지만, 개발자가 의도하지 않은 버그를 만들기도 한다. 아래 예시 코드와 테스트 코드로 살펴보자. 크기 비교 연산자는 정상적으로 동작하지만, 동일성 판단 연산자는 비정상적으로 동작한다.

- 크기 비교 연산자는 오토 언박싱(auto unboxing)되면서 정상적으로 수행된다.
- == 연산자를 이용하여 동일 여부를 판단할 때는 정상적인 비교가 수행되지 않는다. == 연산자는 객체의 주소를 비교하기 때문이다.
- 객체에 담긴 값으로 동일 여부를 판단하려면 equals 메서드를 이용해야 한다.

```java
    @Test
    public void test_comparisonOperatorTrue_equalOperatorFalse_equalsMethodTrue() {
        Integer a = new Integer(1);
        Integer b = 2;
        Integer c = new Integer(1);
        assertThat(a < b).isTrue();
        assertThat(a == c).isFalse();
        assertThat(a.equals(c)).isTrue();
    }
```

valueOf 메서드를 사용하여 만든 래퍼 객체는 `==` 연산자가 정상적으로 동작한다. 왜 그럴까? valueOf 메서드를 사용하면 내부 캐시(cache) 처리에 의해 이전에 생성된 숫자 객체가 있을 때 이를 재사용하기 때문이다. JVM 애플리케이션의 성능을 향상하기 위한 작업으로 보인다. valueOf 메서드 사용을 권장하기 위함인지, Integer 래퍼 클래스의 생성자는 JDK 9 버전부터 사용이 권장되지 않는다.

```java
    @Test
    public void test_comparisonOperatorTrue_equalOperatorTrueWithValueOf() {
        Integer a = Integer.valueOf(1);
        Integer b = Integer.valueOf(1);
        log.info(System.identityHashCode(a));
        log.info(System.identityHashCode(b));
        assertThat(a == b).isTrue();
    }
```

위 테스트 코드를 수행한 로그를 살펴보면 valueOf 메서드로 얻은 두 객체가 동일한 주소임을 알 수 있다.

```
2021-08-03 01:15:56.001  INFO 6300 --- [           main] blog.in.action.wrapper.WrapperClassTest  : 1486944091
2021-08-03 01:15:56.001  INFO 6300 --- [           main] blog.in.action.wrapper.WrapperClassTest  : 1486944091
```

`==` 연산자가 정상적으로 동작하는 것처럼 보이더라도 기본적으로 equals 메서드 사용을 권장한다. valueOf 메서드 내부를 들여다보면 특정 범위 내 값에 한해서 캐시 처리를 수행하는 것을 볼 수 있다. 필요한 경우 새로운 객체를 만들기 때문에 주소가 다른 객체가 생성될 수 있다.

```java
    @HotSpotIntrinsicCandidate
    public static Integer valueOf(int i) {
        if (i >= IntegerCache.low && i <= IntegerCache.high)
            return IntegerCache.cache[i + (-IntegerCache.low)];
        return new Integer(i);
    }
```

null 값을 가지는 래퍼 클래스 객체와 기본형(primitive type) 값을 `==` 연산의 피연산자로 사용하는 경우 NullPointerException 에러가 발생한다. 이는 피연산자에 기본형 int 값이 존재하여 래퍼 클래스 객체를 오토 언박싱(auto unboxing)하는 중에 발생하는 에러이다.

```java
    @Test
    public void test_throwNullPointException() {
        Integer a = null;
        assertThrows(NullPointerException.class, () -> {
            if (a == 1) {
                log.info("do something");
            }
        });
    }
```

## 4. 래퍼 클래스는 왜 필요한가?

이유를 찾기 위해 관련된 내용을 찾아보고 고민도 해 보았다. 아래와 같은 몇 가지 이유로 추려진다.

- List, Map 같은 Collection은 객체만 담을 수 있다.
- 자바 제네릭스(Generics) 기능을 사용하려면 클래스를 명시해야 한다.
- 멀티 스레드 환경에서 동시성(concurrency)을 위한 코드를 작성할 때 동기화(synchronized) 기능은 객체만 지원된다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-07-30-java-wrapper-class>

#### REFERENCE

- <http://tcpschool.com/java/java_api_wrapper>
- <https://junhyunny.blogspot.com/2019/03/wrapper.html>
- <https://junhyunny.blogspot.com/2019/03/wrapper-boxing-unboxing.html>
- <https://www.theserverside.com/blog/Coffee-Talk-Java-News-Stories-and-Opinions/Performance-cost-of-Java-autoboxing-and-unboxing-of-primitive-types>
- <https://jaehun2841.github.io/2019/03/01/effective-jave-item61/#%EA%B8%B0%EB%B3%B8-%ED%83%80%EC%9E%85-primitive-type>

[auto-boxing-performance-link]: https://junhyunny.github.io/java/auto-boxing-performance-test/
