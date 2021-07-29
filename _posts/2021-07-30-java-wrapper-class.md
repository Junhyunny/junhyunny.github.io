---
title: "Java Wrapper 클래스"
search: false
category:
  - java
last_modified_at: 2021-07-30T03:00:00
---

<br>

> Java primitive type 변수가 존재하는데 wrapper 클래스가 생긴 이유가 무엇일까요?<br>

어려운 질문이었습니다. 
이 포스트에서 위 질문에 대한 답변을 정리하기 이전에 우선 wrapper 클래스가 무엇인지 알아보겠습니다. 

## Wrapper 클래스
Java에는 기본형(primitive type) 데이터가 존재합니다. 
프로그램 언어를 처음 접할 때 주로 사용하는 자료형으로 int, char, byre, short, long, float, double, boolean 등이 이에 속합니다. 
이런 기본형 데이터를 감싸서(wrapping) 만든 것이 바로 Wrapper 클래스입니다. 
각 기본형 데이터에 대응하는 Wrapper 클래스가 존재합니다.

##### 기본형 데이터와 Wrapper 클래스 대응 

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

##### Wrapper 클래스 상속 관계도
- Boolean, Character 클래스를 제외하고 Number 클래스를 상속받습니다.

<p align="center"><img src="/images/java-wrapper-class-1.JPG" width="70%"></p>
<center>이미지 출처, https://codepumpkin.com/interview-questions-wrapper-classes/</center>

### Wrapper 클래스 내부 구조
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

### Boxing / Unboxing
Wrapper 클래스에 대해 이야기하면 빠지지 않는 내용이 있습니다. 
`Boxing / Unboxing` 입니다. 
`Boxing`은 기본형 데이터를 Wrapper 클래스의 인스턴스로 변환하는 과정을 의미합니다. 
반대로 `Unboxing`은 Wrapper 클래스의 인스턴스를 기본형 데이터로 변환하는 과정을 의미합니다. 

<p align="center"><img src="/images/java-wrapper-class-2.JPG" width="45%"></p>
<center>이미지 출처, http://tcpschool.com/java/java_api_wrapper</center><br>

JDK 1.5 버전부터 `Boxing, Unboxing`이 필요하면 컴파일러에 의해 자동으로 수행되었습니다. 
이를 `Auto Boxing, Auto Unboxing`이라고 합니다. 

#### 예시 코드
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

## Wrapper 클래스는 왜 필요한가?
이유를 찾기 위해 관련된 내용들을 찾아보고 고민도 해보았습니다. 
아래와 같은 몇 가지 이유로 추려지는 것 같습니다. 
- List, Map 같은 Collection은 객체만 담을 수 있습니다. 
- 멀티 스레드 환경에서 동시성(concurrency)를 위한 코드 작성 시 동기화(synchronized) 기능은 객체만 지원됩니다. 
- Java Generics 기능을 사용하려면 클래스를 명시해야 합니다.

## OPINION
예전 블로그에 작성한 포스트를 현재 운영 중인 블로그에 재작성하였습니다. 
Wrapper 클래스는 무엇이고 왜 사용하게 되었는지 질문을 받았는데 시원하게 대답하지 못했던 것이 마음에 걸려 다시 정리해보았습니다. 
이번 포스트를 다시 정리하면서 과도한 Auto Boxing 수행이 성능에 미치는 영향에 대한 내용을 읽었습니다. 
이를 꼭 직접 테스트해보고 모니터링한 결과를 확인하고 싶은 마음이 들었습니다.😄 
조만간 JVM 성능 모니터링 툴 사용 방법과 과도한 Auto Boxing 수행 시 발생하는 현상을 모니터링하고 글로 작성해야겠습니다.

#### REFERENCE
- <http://tcpschool.com/java/java_api_wrapper>
- <https://junhyunny.blogspot.com/2019/03/wrapper.html>
- <https://junhyunny.blogspot.com/2019/03/wrapper-boxing-unboxing.html>
- <https://www.theserverside.com/blog/Coffee-Talk-Java-News-Stories-and-Opinions/Performance-cost-of-Java-autoboxing-and-unboxing-of-primitive-types>