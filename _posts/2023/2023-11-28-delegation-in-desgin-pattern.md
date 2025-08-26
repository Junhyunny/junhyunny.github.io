---
title: "Delegation in Design Pattern"
search: false
category:
  - java
  - spring-boot
  - design-pattern
last_modified_at: 2023-11-28T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [프록시 패턴(proxy pattern)][proxy-pattern-link]
- [Strategy Pattern][strategy-pattern-link]
- [Template Method Pattern][template-method-pattern-link]

## 1. Delegation

요즘 스프링 시큐리티(spring security)를 주제로 책을 집필하면서 프레임워크 내부를 탐구하고 있습니다. 스프링 프레임워크 내부에는 `Delegating-`이라는 키워드가 붙은 클래스들이 많다는 사실을 알았습니다. 이름에서 알 수 있듯 이런 클래스들의 인스턴스는 자신이 처리해야하는 요청을 다른 인스턴스에게 위임(delegation)합니다. 스프링 프레임워크가 위임을 많이 사용하는 이유가 궁금하여 관련된 내용을 정리해봤습니다. 

### 1.1. Delegation Pattern

위키피디아(wikipedia)에선 위임 패턴은 객체 합성을 사용해 상속처럼 코드를 재사용할 수 있다고 소개합니다. 

> In software engineering, the delegation pattern is an object-oriented design pattern that allows object composition to achieve the same code reuse as inheritance. 

디자인 패턴으로 유명한 [Gangs of Four (GoF) Design Patterns](https://product.kyobobook.co.kr/detail/S000000676784) 책에는 위임 패턴이 별도로 존재하지 않습니다. 위임은 패턴이 아닌 패턴을 위한 하나의 방법으로 소개합니다.  

> 위임(delegation)은 합성을 상속만큼 강력하게 만드는 방법입니다. 위임에서는 두 객체가 하나의 요청을 처리합니다. 수신 객체가 연산의 처리를 위임자(delegate)에게 보냅니다. 이는 서브 클래스가 부모 클래스에게 요청을 전달하는 것과 유사한 방식입니다. 

책에서처럼 위임은 디자인 패턴이라기보단 중복 코드 문제를 해결하는 디자인 패턴들이 사용하는 하나의 프로그래밍 구현 테크닉입니다. 한 객체가 모든 것을 담당하는 것이 아니라 다른 대상에게 책임을 넘기는 행위입니다. 대표적으로 프록시 패턴(proxy pattern)이나 전략 패턴(strategy pattern)은 위임을 사용하는 디자인 패턴입니다. 

## 2. Inheritance and Composition

[Gangs of Four (GoF) Design Patterns](https://product.kyobobook.co.kr/detail/S000000676784) 책에선 객체 지향 시스템에서 코드 재사용을 위한 대표적인 기법으로 상속(inheritance)와 객체 합성(object composition)을 소개합니다. 위임은 객체 합성을 위해 사용되는 테크닉입니다. 위임을 통한 객체 합성이 어떤 장점을 갖는지 상속과 비교해보겠습니다.

### 2.1. Inheritance

상속은 `Is-a 관계`로 부모 클래스에 정의된 코드를 서브 클래스(sub class)가 재사용하는 방법입니다. 이런 방식을 화이트 박스 재사용(white box reuse)이라고도 합니다. 상속을 받으면 부모 클래스의 내부가 서브 클래스에게 공개되기 때문입니다. 상속은 다음과 같은 특징을 가집니다. 

- 컴파일 시점에 정적으로 정의됩니다.
- 프로그래밍 언어가 직접 지원하기 때문에 그대로 사용할 수 있습니다. 
- 상속 받은 부모 클래스의 구현을 런타임에 변경할 수 없습니다. 
- 부모 클래스의 구현이 서브 클래스에 모두 공개되기 때문에 캡슐화를 파괴합니다.
- 부모 클래스 구현에 변경이 생기면 서브 클래스도 변경이 필요합니다.

부모 클래스는 서브 클래스를 재사용할 때 방해가 될 수 있습니다. 상속한 구현이 새로운 문제에 맞지 않을 때 부모 클래스를 재작성해야하거나 다른 것으로 대체하는 일이 생길 수 있습니다. 상속으로 인해 발생하는 강한 결합도는 코드의 유연성과 재사용성을 떨어뜨립니다. 추상 클래스를 사용하면 종속성 문제를 어느 정도 완화할 수 있습니다. 간단한 예제 코드로 상속 구조의 유연성이 떨어지는 상황을 살펴보겠습니다.

#### 2.1.1. Window Class

창문을 추상화한 클래스입니다. 

- 영역의 넓이를 반환하는 getArea 메소드를 제공합니다.
- 영역 넓이를 출력하는 printArea 메소드를 제공합니다.

```java
package inheritance;

import java.math.BigDecimal;

public abstract class Window {

    private final int width;
    private final int height;

    public Window(int width, int height) {
        this.width = width;
        this.height = height;
    }

    protected BigDecimal getArea() {
        return BigDecimal.valueOf((long) width * height);
    }

    public abstract void printArea();
}
```

#### 2.1.2. SquareWindow Class

정사각형 창문 객체입니다. 

- 생성자에 전달된 값은 부모 클래스에 너비, 높이 값으로 전달합니다. 
- 부모 클래스에 정의된 getArea 메소드를 재사용합니다. 

```java
package inheritance;

public class SquareWindow extends Window {

    public SquareWindow(int side) {
        super(side, side);
    }

    @Override
    public void printArea() {
        System.out.printf("Square window area is %s\n", getArea());
    }
}
```

#### 2.1.3. RectangleWindow Class

사각형 창문 객체입니다. 

- 생성자에 전달된 값은 부모 클래스에 너비, 높이 값으로 전달합니다. 
- 부모 클래스에 정의된 getArea 메소드를 재사용합니다.

```java
package inheritance;

public class RectangleWindow extends Window {

    public RectangleWindow(int width, int height) {
        super(width, height);
    }

    @Override
    public void printArea() {
        System.out.printf("Rectangle window area is %s\n", getArea());
    }
}
```

#### 2.1.4. Problem Adding Other Shape Window

정사각형, 직사각형 창문만 존재하던 시스템에 원형 창문이 포함될 예정입니다. 시스템 구성상 원형 창문도 반드시 Window 클래스를 상속해야만 합니다. 하지만 Window 클래스에 정의된 미리 정의된 getArea 메소드는 원형 창문에 적합하지 않습니다. 어쩔 수 없이 상속하지만, 코드는 자연스럽게 지저분해집니다. 예제는 아주 작은 코드 조각이지만, 큰 시스템일수록 불필요한 상속은 코드의 복잡성을 높일 확률이 큽니다. 

- width, height 필드는 부모 클래스에 캡슐화되어 있으므로 radius 필드를 새로 정의해야 합니다.
    - 불필요한 필드 사용 
- 넓이를 구하는 방식이 다르기 때문에 getArea 메소드를 재정의합니다.
    - 불필요한 메소드 재정의

```java
package inheritance;

import java.math.BigDecimal;

public class CircleWindow extends Window {

    private final int radius;

    public CircleWindow(int radius) {
        super(radius, radius);
        this.radius = radius;
    }

    @Override
    public BigDecimal getArea() {
        var pi = new BigDecimal(String.valueOf(Math.PI));
        return pi.multiply(
                BigDecimal.valueOf((long) radius * radius)
        );
    }

    @Override
    public void printArea() {
        System.out.printf("Circle window area is %s\n", getArea());
    }
}
```

#### 2.1.5. Main Class

각 윈도우의 넓이를 출력합니다.

```java
import inheritance.CircleWindow;
import inheritance.RectangleWindow;
import inheritance.SquareWindow;
import inheritance.Window;

public class Main {

    public static void main(String[] args) {

        Window rectangleWindow = new RectangleWindow(10, 5);
        Window squareWindow = new SquareWindow(5);
        Window circleWindow = new CircleWindow(10);

        rectangleWindow.printArea();
        squareWindow.printArea();
        circleWindow.printArea();
    }
}
```

##### Result

```
Rectangle window area is 50
Square window area is 25
Circle window area is 314.159265358979300
```

### 2.2. Composition

객체 합성은 `Has-a 관계`로 다른 객체를 여러 개 붙여서 새로운 기능 혹은 객체를 구성하는 방법입니다. 객체를 합성하기 위해 객체들의 인터페이스를 명확히 정의하는 것이 중요합니다. 이런 방식을 블랙 박스 재사용(black box reuse)이라고도 합니다. 객체의 내부가 공개되지 않고 인터페이스만을 통해 재사용되기 때문입니다. 객체 합성은 다음과 같은 특징을 가집니다.

- 인터페이스로 추상화 된 변수를 사용하면 런타임 시점에 동적으로 정의할 수 있습니다.
    - 팩토리 패턴을 사용하거나 프레임워크의 도움을 통해 런타임 시점에 정의 가능합니다.
- 객체들은 인터페이스에서만 접근하므로 캡슐화를 유지할 수 있습니다.

객체 합성은 위임을 통해 이뤄집니다. 위임과 인터페이스를 통한 객체 합성이 상속과 동일한 문제 상황을 어떻게 유연하게 대처하는지 살펴보겠습니다.

#### 2.2.1. Boundary Interface

다음과 같은 책임을 가집니다.

- 이름 제공
- 영역 넓이 제공

```java
package composition;

import java.math.BigDecimal;

public interface Boundary {

    String getName();

    BigDecimal getArea();
}
```

#### 2.2.2. RectangleBoundary Class

자신의 넓이와 이름을 제공합니다.

```java
package composition;

import java.math.BigDecimal;

public class RectangleBoundary implements Boundary {

    private final int width;
    private final int height;

    public RectangleBoundary(int width, int height) {
        this.width = width;
        this.height = height;
    }

    @Override
    public String getName() {
        return "Rectangle";
    }

    @Override
    public BigDecimal getArea() {
        return BigDecimal.valueOf((long) width * height);
    }
}
```

#### 2.2.3. SquareBoundary Class

자신의 넓이와 이름을 제공합니다.

```java
package composition;

import java.math.BigDecimal;

public class SquareBoundary implements Boundary {
    
    private final int side;

    public SquareBoundary(int side) {
        this.side = side;
    }

    @Override
    public String getName() {
        return "Square";
    }

    @Override
    public BigDecimal getArea() {
        return BigDecimal.valueOf((long) side * side);
    }
}
```

#### 2.2.4. CircleBoundary Class

인터페이스에 정의된 책임을 자신에게 맞도록 재구현합니다. 이 과정에서 상속과 다르게 불필요한 필드나 메소드 구현이 추가되지 않습니다. 

```java
package composition;

import java.math.BigDecimal;

public class CircleBoundary implements Boundary {

    private final int radius;

    public CircleBoundary(int radius) {
        this.radius = radius;
    }

    @Override
    public String getName() {
        return "Circle";
    }

    @Override
    public BigDecimal getArea() {
        var pi = new BigDecimal(String.valueOf(Math.PI));
        return pi.multiply(
                BigDecimal.valueOf((long) radius * radius)
        );
    }
}
```

#### 2.2.5. Window Class

클라이언트의 요청을 다른 인스턴스에게 위임합니다. 

- 팩토리 메소드를 통해 필요한 인스턴스를 명시적으로 생성합니다. 
    - private 생성자로 정의하여 Window 인스턴스 생성을 캡슐화합니다.
    - 어떤 모양 창문인지 명시적으로 선언할 수 있습니다.
- printArea 메소드
    - 윈도우 이름과 영역 넓이 값은 boundary 인스턴스에게 위임합니다. 
    - 창문 형태가 Boundary 인터페이스로 추상화되어 있기 때문에 적합한 인스턴스를 주입 받으면 코드 변경이 발생하지 않습니다.

```java
package composition;

public class Window {

    private final Boundary windowBoundary;

    private Window(Boundary windowBoundary) {
        this.windowBoundary = windowBoundary;
    }

    public static Window createCircle(int radius) {
        return new Window(new CircleBoundary(radius));
    }

    public static Window createRectangle(int width, int height) {
        return new Window(new RectangleBoundary(width, height));
    }

    public static Window createSquare(int side) {
        return new Window(new SquareBoundary(side));
    }

    public void printArea() {
        System.out.printf("%s window area is %s\n", windowBoundary.getName(), windowBoundary.getArea());
    }
}
```

#### 2.2.6. Main Class

각 윈도우의 넓이를 출력합니다.

```java
import composition.Window;

public class Main {

    public static void main(String[] args) {

        Window rectangleWindow = Window.createRectangle(5, 10);
        Window squareWindow = Window.createSquare(5);
        Window circleWindow = Window.createCircle(10);

        rectangleWindow.printArea();
        squareWindow.printArea();
        circleWindow.printArea();
    }
}
```

##### Result

```
Rectangle window area is 50
Square window area is 25
Circle window area is 314.159265358979300
```

## 3. Summary

객체 합성 방법에서는 getArea 메소드를 재사용하지 못 하지만, printArea 메소드를 재사용할 수 있습니다. 인터페이스를 통해 인스턴스들을 참조하기 때문에 실제 구현체가 무엇인지 판단한 필요 없이 비즈니스 로직을 구성할 수 있습니다. 앞으로 새로운 기능이 추가되더라도 Boundary 인터페이스를 상속 받은 클래스가 추가될 뿐 Window 클래스의 비즈니스 로직은 변경되지 않습니다. 수정에는 닫혀 있고, 확장에는 열린 구조를 가집니다. 

간단한 요약으로 이번 글을 마무리하겠습니다. 

- 위임은 객체 합성에 사용되는 프로그래밍 테크닉입니다.
- 객체 합성은 상속에 비해 기능 확장에 용이합니다.
    - 상속은 컴파일 시점에 코드가 이미 굳어지기 때문에 확장이 필요한 비즈니스에 유연하게 대응하기 어렵습니다.

스프링 프레임워크가 위임을 많이 사용하는 이유는 프레임워크로써 확장성을 고려한 설계를 해야되기 때문이라고 생각됩니다. 물론 스프링 프레임워크는 상속도 많이 사용합니다. 주로 발견되는 템플릿 메소드 패턴(template method pattern)은 상속을 사용하는 대표적인 예입니다.  

## CLOSING

iOS 진영은 컴포넌트 사이의 통신을 위해 콜백 함수를 사용합니다. 이때 위임을 사용하는데 이런 방식이 하나의 패턴으로 굳어져 위임 패턴으로 불리는 것 같습니다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-11-28-delegation-in-desgin-pattern>

#### REFERENCE

- [Gangs of Four (GoF) Design Patterns](https://product.kyobobook.co.kr/detail/S000000676784)
- <https://en.wikipedia.org/wiki/Delegation_pattern>
- <https://june0122.github.io/2021/08/21/design-pattern-delegate/>
- <https://mangkyu.tistory.com/199>
- <https://readystory.tistory.com/202>
- <https://architecture101.blog/2009/02/18/misconception_of_gof_dp/>
- <https://stackoverflow.com/questions/1224830/difference-between-strategy-pattern-and-delegation-pattern>
- <https://minosaekki.tistory.com/64>

[proxy-pattern-link]: https://junhyunny.github.io/information/design-pattern/proxy-pattern/
[strategy-pattern-link]: https://junhyunny.github.io/information/design-pattern/strategy-pattern/
[template-method-pattern-link]: https://junhyunny.github.io/java/design-pattern/template-method-pattern/