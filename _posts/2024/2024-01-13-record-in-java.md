---
title: "Record Keyword in Java"
search: false
category:
  - java
last_modified_at: 2024-01-13T23:55:00
---

<br/>

## 0. 들어가면서

스프링 부트 3.X 버전은 JDK17를 사용하기 때문에 기존에 보지 못 했던 새로운 문법들을 종종 보게 된다. 레코드(record) 키워드가 그 중 하나이다. 이번 포스트에서 레코드에 등장 배경과 사용 방법을 정리했다.

## 1. Record

[JEP 359](https://openjdk.org/jeps/359)를 보면 레코드 등장 배경을 확인할 수 있다.

> Enhance the Java programming language with records. Records provide a compact syntax for declaring classes which are transparent holders for shallowly immutable data. This is a preview language feature in JDK 14.

JDK14에 처음 등장해 JDK16에 정식으로 추가됐다. 핵심은 `compact syntax`와 `immutable data`이다. 어떤 식으로 간결한 문법과 불변 데이터를 지원하는지 살펴보자. 

## 2. Goals and Non-Goals

[JEP 395](https://openjdk.org/jeps/395)를 보면 레코드가 지향하는 목표를 다음과 같이 설명한다.

- 단순한 값의 집합을 표현하는 객체 지향 구조를 고안한다. 
- 개발자가 불변 데이터 객체를 모델링하는 데 집중할 수 있다.
- equals 메소드나 게터(getter) 같은 데이터 기반 방식을 자동으로 구현해준다.
- 명목형 타이핑(nominal typing) 같은 오랜 자바(java) 원칙을 유지한다.

다음 같은 것들을 지양한다.

- 데이터 운반 클래스를 쉽게 선언하는 것을 도와준다. 
  - 자바빈즈(JavaBeans)의 명명 규칙을 사용하는 클래스들의 보일러 플레이트 코드와의 전쟁을 선언한 것은 아니다.
- `Plain Old Java Object` 클래스 선언을 간소화하기 위해 제안되는 애너테이션 기반의 코드 생성 같은 기능을 만드는 것이 아니다. 
  - 애너테이션 기반 코드 생성 기능은 롬복(lombok) 같은 라이브러리를 의미한다.

## 3. Record Class

일반적으로 데이터 전달을 위해 사용하는 불변 클래스는 다음과 같이 선언한다. 

- final 키워드로 필드를 선언한다.
- 접근 메소드가 제공한다.
- equals, hashCode, toString 메소드가 제공한다.

```java
class Point {
    private final int x;
    private final int y;

    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    int x() { return x; }
    int y() { return y; }

    public boolean equals(Object o) {
        if (!(o instanceof Point)) return false;
        Point other = (Point) o;
        return other.x == x && other.y == y;
    }

    public int hashCode() {
        return Objects.hash(x, y);
    }

    public String toString() {
        return String.format("Point[x=%d, y=%d]", x, y);
    }
}
```

데이터 운반 클래스를 만들 때 생성자, 접근자, equals, hashCode, toString 메소드 때문에 코드가 길어진다. IDE(Integrated Devleopment Environment) 도구의 도움을 받아 자동으로 생성할 수 있으며 만약 코드가 길어지는 것이 싫다면 애너테이션 기반으로 코드를 생성하는 롬복(lombok) 같은 라이브러리를 사용할 수도 있다. 개발자들에게 지루하고 실수가 생길 수도 있는 작업을 레코드 클래스로 해결할 수 있다.

레코드 클래스를 사용하면 불필요한 의존성을 추가하거나 IDE의 도움을 받아 클래스를 작성할 필요가 없다. 

- 레코드 클래스 시그니처(signature)는 생성자와 동일하다.
- 필드 이름과 동일한 데이터 접근자 메소드가 제공된다.
- equals, hashCode, toString 메소드가 자동으로 생성된다.

```java
record Point(int x, int y) { }
```

위 레코드 클래스를 컴파일하면 다음과 같은 모습을 가진다. 컴파일 된 클래스에선 필드나 equals, hashCode, toString 메소드들을 찾아볼 수 없지만, 바이트 코드에선 확인할 수 있다.

```java
record Point(int x, int y) {

    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    public int x() {
        return this.x;
    }

    public int y() {
        return this.y;
    }
}
```

## 4. Rules

레코드 클래스를 사용하기 위한 몇 가지 규칙들이 있다. 레코드 클래스는 java.lang.Record 추상 클래스를 암묵적으로 상속 받는다. 일반 클래스가 java.lang.Object 클래스를 상속 받는 것과 동일하다. Record 추상 클래스는 아래와 같이 생겼다.

```java
 abstract class Record {

    protected Record() {}

    @Override
    public abstract boolean equals(Object obj);

    @Override
    public abstract int hashCode();

    @Override
    public abstract String toString();
}
```

레코드 클래스는 암묵적으로 final 클래스이므로 이를 상속할 수 없다. 다른 클래스를 확장하는 것도 불가능하다.

```java
class Mammal {}

record Person(String name) extends Mammal { // compile error
}

class Student extends Person { // compile error

    Student(String name) {
        super(name);
    }
}
```

반면 인터페이스를 구현하는 것은 가능하다.

```java
interface Contactable {
    void contact();
}

record Person(String name) implements Contactable {
    
    @Override
    public void contact() {
      // ...
    }
}
```

레코드 클래스에 정의된 필드들은 final 키워드가 붙어 불변 정책이 적용된다.

```java
record Person(String name)  {

    void setName(String name) {
        this.name = name; // compile error
    }
}
```

레코드 클래스 내부에 인스턴스 필드를 정의할 수 없다. 필드는 레코드 헤더에서만 선언할 수 있다.

```java
record Person(String name)  { // only here

    String contact; // compile error
}
```

반면 정적(static) 필드, 인스턴스 메소드, 정적 메소드는 정의할 수 있다.

```java
record Person(String name, String contact) {

    static long id = 1L;

    static Person of(String name) {
        return new Person(name, null);
    }

    public boolean isContactable() {
        return contact != null;
    }
}
```

제네릭을 사용할 수 있다.

```java
record Point<T>(T x, T y) {
}

public class Main {

    public static void main(String[] args) {
        var point = new Point<Integer>(1, 1);
    }
}
```

다른 시그니처를 가지는 생성자를 선언할 수 있다.

```java
record Person(String name, String contact) {

    public Person(String name) {
        this(name, null);
    }
}

public class Main {

    public static void main(String[] args) {
        var junhyunny = new Person("junhyunny", "junhyunny@naver.com");
        var jua = new Person("jua");
    }
}
```

동일한 시그니처를 갖는 생성자는 내부에 초기화 로직을 선언해야 한다. 그렇지 않으면 컴파일 에러가 발생한다.

```java
record Person(String name, String contact) {

    public Person(String name, String contact) {
        this.name = name;
        this.contact = contact;
    }
}
```

컴팩트 생성자(compact constructor)를 사용하면 비공개 필드를 초기하는 것 이상의 작업을 수행할 수 있다. 컴팩트 생성자는 매개 변수를 받는 부분이 없는 형태다. 주로 유효성 확인(validation)이나 간단한 초기화 작업을 수행한다.  

```java
record Person(String name, String contact) {

    public Person {
        Objects.requireNonNull(name);
        Objects.requireNonNull(contact);
    }
}
```

컴팩트 생성자와 레코드 헤더와 동일한 시그니처를 갖는 생성자는 같이 사용할 수 없다. 

```java
record Person(String name, String contact) {

    public Person { // compile error
        Objects.requireNonNull(name);
        Objects.requireNonNull(contact);
    }

    public Person(String name, String contact) { // compile error
        this.name = name;
        this.contact = contact;
    }
}
```

추가적으로 다음과 같은 규칙들이 있다.

- 레코드 클래스는 접근자, equals, hashCode 메소드가 자동으로 생성되기 때문에 명시적 구현은 주의해야 한다.
- 레코드 클래스에 네이티브(native) 메소드를 선언할 수 없다.

#### REFERENCE

- <https://www.baeldung.com/java-record-keyword>
- <https://openjdk.org/jeps/359>
- <https://openjdk.org/jeps/395>
- <https://ko.wikipedia.org/wiki/%EB%AA%85%EB%AA%A9%EC%A0%81_%EC%9E%90%EB%A3%8C%ED%98%95_%EC%B2%B4%EA%B3%84>
- <https://blog.hexabrain.net/399>