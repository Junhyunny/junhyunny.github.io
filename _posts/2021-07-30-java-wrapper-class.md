---
title: "Java Wrapper 클래스"
search: false
category:
  - java
last_modified_at: 2021-09-24T15:30:00
---

<br/>

👉 이어서 읽기를 추천합니다.
- [Wrapper 클래스 Auto Boxing 그리고 성능 이슈][auto-boxing-performance-link]

## 0. 들어가면서

> Java primitive type 변수가 존재하는데 wrapper 클래스가 생긴 이유가 무엇일까요?<br/>

선뜻 대답이 나오지 않는 어려운 질문이었습니다. 
이 포스트에서 위 질문에 대한 답변을 정리해보겠습니다. 

## 1. Wrapper 클래스
Java에는 기본형(primitive type) 데이터가 존재합니다. 
프로그램 언어를 처음 접할 때 주로 사용하는 자료형으로 int, char, byre, short, long, float, double, boolean 등이 이에 속합니다. 
이런 기본 타입의 값들은 JVM 내의 스택(stack) 메모리에 저장됩니다.

이런 기본형 데이터를 감싸서(wrapping) 만든 것이 바로 Wrapper 클래스입니다. 
각 기본형 데이터에 대응하는 Wrapper 클래스가 존재합니다. 
참조 타입인 wrapper 클래스 객체는 JVM 내의 힙(heap) 메모리에 저장됩니다.

### 1.1. 기본형 데이터와 Wrapper 클래스 대응 

| 기본형 타입(primitive type) | Wrapper 클래스 |
|:---:|:---:|
| boolean | Boolean |
| char | Character |
| byte | Byte |
| short | Short |
| int | Integer |
| long | Long |
| float | Float |
| double | Double |

### 1.2. Wrapper 클래스 상속 관계도
- Boolean, Character 클래스를 제외하고 Number 클래스를 상속받습니다.

<p align="center"><img src="/images/java-wrapper-class-1.JPG" width="70%"></p>
<center>https://codepumpkin.com/interview-questions-wrapper-classes/</center>

### 1.3. Wrapper 클래스 내부 구조
- 기본형 데이터 변수를 멤버로 두고, 관련된 연산을 메소드로 정의해두고 있습니다.
- 타입 정보, 최대 값, 최소 값 등 부가적인 기능을 위한 값을 별도로 저장하고 있습니다. 
- 객체가 생성될 때 지정되는 값은 변경되지 않습니다. 

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
Wrapper 클래스에 대해 이야기하면 빠지지 않는 내용이 있습니다. 
`Boxing / Unboxing` 입니다. 
`Boxing`은 기본형 데이터를 Wrapper 클래스의 인스턴스로 변환하는 과정을 의미합니다. 
반대로 `Unboxing`은 Wrapper 클래스의 인스턴스를 기본형 데이터로 변환하는 과정을 의미합니다. 

<p align="center"><img src="/images/java-wrapper-class-2.JPG" width="45%"></p>
<center>http://tcpschool.com/java/java_api_wrapper</center>

JDK 1.5 버전부터 `Boxing, Unboxing`이 필요하면 컴파일러에 의해 자동으로 수행되었습니다. 
이를 `Auto Boxing, Auto Unboxing`이라고 합니다. 

### 2.1. 예시 코드
```java
    Integer num = new Integer(17); // boxing, Deprecated since JDK1.9
    int n = num.intValue(); // unboxing
    Character ch = 'X'; // Character ch = new Character('X'); : autoboxing
    char c = ch; // char c = ch.charValue(); : autounboxing
```

#### JDK 1.5 이전 Boxing 처리
```java
    int x = 10;
    ArrayList<E> list = new ArrayList();
    // list.add(10); Pre JDK 1.5 autoboxing would not work
    Integer wrapper = Integer.valueOf(x);
    list.add(wrapper);
```

#### JDK 1.5 이후 Auto Boxing 처리
```java
    int x = 10;
    ArrayList<E> list = new ArrayList();
    list.add(10); // This is primitive type autoboxing in Java 
    //Integer wrapper = Integer.valueOf(x);
    //list.add(wrapper);
```

## 3. Wrapper 클래스 사용 시 주의사항
Boxing, Unboxing 기능이 자동으로 수행되면서 컴파일 에러는 나지 않지만, 개발자의 의도치 않은 버그를 만들어내기도 합니다. 
아래 테스트 코드를 통해 예시를 들어보겠습니다. 

### 3.1. 크기 비교 연산자 정상, 동일 판단 연산자는 비정상
- 크기 비교 연산자의 경우 auto unboxing 되면서 크기 비교가 정상적으로 수행됩니다.
- == 연산자를 이용하여 동일 여부 판단 시에는 정상적인 비교가 수행되지 않습니다. == 연산자는 객체의 주소를 비교하기 때문입니다.
- 객체 담긴 값을 이용한 동일 판단은 equals 메소드를 이용해야 합니다.

##### 테스트 코드
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

### 3.2. valueOf 메소드를 사용하여 만든 객체는 `==` 연산자가 정상적으로 동작하는가? 
- Integer 생성자는 JDk 9 버전부터 사용을 권장하지 않습니다.(@Deprecated(since="9"))
- Integer.valueOf 메소드를 사용하여 만든 객체를 `==` 연산자의 피연산자로 사용하는 경우 동일 여부 판단이 성공합니다.
- 이는 valueOf 메소드 내부 캐시(cache) 처리에 의해 그렇게 보이는 것일 뿐 마찬가지로 equals 메소드를 사용하는 것이 좋습니다.

##### 테스트 코드
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

##### 결과
- valueOf 메소드를 통해 얻은 두 객체가 동일한 주소임을 알 수 있습니다. 

```
2021-08-03 01:15:56.001  INFO 6300 --- [           main] blog.in.action.wrapper.WrapperClassTest  : 1486944091
2021-08-03 01:15:56.001  INFO 6300 --- [           main] blog.in.action.wrapper.WrapperClassTest  : 1486944091
```

#### 3.3. valueOf 메소드
- valueOf 메소드를 보면 특정 범위 내 값들에 한해서 캐시 처리를 수행합니다.
- 필요한 경우 새로운 객체를 만들기 때문에 주소가 다른 객체가 생성될 수 있습니다.

```java
    @HotSpotIntrinsicCandidate
    public static Integer valueOf(int i) {
        if (i >= IntegerCache.low && i <= IntegerCache.high)
            return IntegerCache.cache[i + (-IntegerCache.low)];
        return new Integer(i);
    }
```

### 3.4. NullPointException
- null 값을 가지는 wrapper 클래스 객체와 기본형(primitive type) 값을 `==` 연산의 피연산자로 사용하는 경우 NullPointException이 발생합니다.
- 이는 피연산자에 기본형 int 값이 존재하여 wrapper 클래스 객체를 auto unboxing 하는 중에 발생하는 에러입니다.

##### 테스트 코드
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

## 4. Wrapper 클래스는 왜 필요한가?
이유를 찾기 위해 관련된 내용들을 찾아보고 고민도 해보았습니다. 
아래와 같은 몇 가지 이유로 추려지는 것 같습니다. 
- List, Map 같은 Collection은 객체만 담을 수 있습니다. 
- Java Generics 기능을 사용하려면 클래스를 명시해야 합니다.
- 멀티 스레드 환경에서 동시성(concurrency)를 위한 코드 작성 시 동기화(synchronized) 기능은 객체만 지원됩니다. 

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-07-30-java-wrapper-class>

#### REFERENCE
- <http://tcpschool.com/java/java_api_wrapper>
- <https://junhyunny.blogspot.com/2019/03/wrapper.html>
- <https://junhyunny.blogspot.com/2019/03/wrapper-boxing-unboxing.html>
- <https://www.theserverside.com/blog/Coffee-Talk-Java-News-Stories-and-Opinions/Performance-cost-of-Java-autoboxing-and-unboxing-of-primitive-types>
- <https://jaehun2841.github.io/2019/03/01/effective-jave-item61/#%EA%B8%B0%EB%B3%B8-%ED%83%80%EC%9E%85-primitive-type>

[auto-boxing-performance-link]: https://junhyunny.github.io/java/auto-boxing-performance-test/