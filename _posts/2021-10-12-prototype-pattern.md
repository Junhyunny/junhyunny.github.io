---
title: "Prototype Pattern"
search: false
category:
  - information
  - design-pattern
last_modified_at: 2021-10-12T23:55:00
---

<br/>

## 1. 프로토타입 패턴(Prototype Pattern)

> 프로토타입(prototype)은 원래의 형태 또는 전형적인 예, 기초 또는 표준이다.

"프로토타입"이라는 이름처럼 원본을 두고 복사하여 사용하는 방법입니다. 
이미 생성된 인스턴스로 자신을 닮은 새로운 인스턴스를 복사해내어 사용합니다. 
새로운 객체를 일반적인 방법(생성자)으로 생성할 때 비용이 큰 경우 이용할 수 있는 디자인 패턴입니다. 

##### 프로토타입 패턴 클래스 다이어그램
- Prototype - 자신을 복제하는데 필요한 기능을 명세한 인터페이스
- ConcretePrototype - 인터페이스에 명세한 기능을 구현한 클래스
- Client - 원형(prototype)에게 자기 복사를 요청하는 클래스

<p align="center"><img src="/images/prototype-pattern-1.JPG" width="60%"></p>
<center>https://www.java2novice.com/java-design-patterns/prototype-pattern/</center>

### 1.1. 프로토타입 패턴 활용
다음과 같은 상황에 프로토타입 패턴을 활용할 수 있습니다. 
- 인스턴스 생산 비용이 높은 경우 사용할 수 있습니다.
- 종류가 많아서 클래스로 정리할 수 없는 경우 사용할 수 있습니다.
- 클래스로부터 인스턴스 생성이 어려운 경우 사용할 수 있습니다.

### 1.2. 프로토타입 패턴 사용시 주의점
clone() 메소드가 핵심이며, 메소드 구현에 주의해야합니다. 
- 순환 참조(circular reference)가 있는 경우 구현이 어렵습니다.
- 얕은 복사(shallow copy)와 깊은 복사(deep copy) 문제에 주의해야합니다.
- 생성자처럼 객체를 초기화하여 사용할 수 없습니다.

## 2. 프로토타입 패턴 예제 코드 
생각해내기 어려운 `클래스로부터 인스턴스 생성이 어려운 경우`를 제외하고 간단하게 테스트 코드를 작성하였습니다. 
프로토타입 패턴의 Prototype 인터페이스 역할로 Java에서 제공하는 Cloneable 인터페이스를 사용하였습니다. 

### 2.1. 인스턴스 생산 비용이 높은 경우
데이터베이스에서 데이터를 매번 조회하여 사용하는 것은 큰 비용이 필요합니다. 
조회(read-only) 성격의 데이터로만 사용한다면 프로토타입 패턴을 사용하는 것도 좋은 방법입니다. 
변치 않는 특정 정보를 서버에게 요청하는 경우를 간단한 예로 들어보겠습니다. 
- 프로토타입 패턴을 사용하는 경우 최초에 조회하여 메모리에 올려둔 데이터를 복사해서 전달합니다. 
- 프로토타입 패턴을 사용하지 않는 경우 매번 데이터베이스에서 조회 후 데이터를 전달합니다.

#### 2.2.1. 프로토타입 패턴을 사용하는 경우
- 사용자 요청이 10000회 들어왔다는 가정하에 성능을 테스트합니다.
- 처음 조회하여 생성한 데이터 객체를 clone() 메소드로 10000회 복사합니다.

```java
@SpringBootTest
public class CaseFirstTest {

    // ...

    @Test
    public void test_speed_whenUsingClone() throws CloneNotSupportedException {
        long start = System.currentTimeMillis();
        Optional<Item> optional = itemRepository.findFirstByName("TEST_ITEM");
        if (optional.isEmpty()) {
            return;
        }
        Item item = optional.get();
        List<Item> list = new ArrayList<>();
        for (int index = 0; index < 10000; index++) {
            list.add(item.clone());
        }
        System.out.println(System.currentTimeMillis() - start);
    }
}

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "TB_ITEM")
class Item implements Cloneable {

    public Item(String name) {
        this.name = name;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name = "NAME")
    private String name;

    @Override
    protected Item clone() throws CloneNotSupportedException {
        return (Item) super.clone();
    }
}

interface ItemRepository extends JpaRepository<Item, Long> {

    Optional<Item> findFirstByName(String name);
}
```

##### 테스트 결과
- 108 ms 소요

```
2021-10-13 03:10:54.959  INFO 6272 --- [           main] o.s.s.concurrent.ThreadPoolTaskExecutor  : Initializing ExecutorService 'applicationTaskExecutor'
2021-10-13 03:10:55.178  INFO 6272 --- [           main] blog.in.action.CaseFirstTest               : Started CaseFirstTest in 3.339 seconds (JVM running for 4.144)
108
2021-10-13 03:10:55.430  INFO 6272 --- [extShutdownHook] o.s.s.concurrent.ThreadPoolTaskExecutor  : Shutting down ExecutorService 'applicationTaskExecutor'
2021-10-13 03:10:55.431  INFO 6272 --- [extShutdownHook] j.LocalContainerEntityManagerFactoryBean : Closing JPA EntityManagerFactory for persistence unit 'default'
```

#### 2.2.2. 프로토타입 패턴을 사용하지 않는 경우
- 사용자 요청이 10000회 들어왔다는 가정하에 성능을 테스트합니다.
- 조회 쿼리를 10000회 수행합니다.

```java
@SpringBootTest
public class CaseFirstTest {

    // ...

    @Test
    public void test_speed_whenUsingSelectManyTimes() {
        long start = System.currentTimeMillis();
        List<Item> list = new ArrayList<>();
        for (int index = 0; index < 10000; index++) {
            Optional<Item> optional = itemRepository.findFirstByName("TEST_ITEM");
            if (optional.isEmpty()) {
                return;
            }
            list.add(optional.get());
        }
        System.out.println(System.currentTimeMillis() - start);
    }
}

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "TB_ITEM")
class Item implements Cloneable {

    public Item(String name) {
        this.name = name;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name = "NAME")
    private String name;

    @Override
    protected Item clone() throws CloneNotSupportedException {
        return (Item) super.clone();
    }
}

interface ItemRepository extends JpaRepository<Item, Long> {

    Optional<Item> findFirstByName(String name);
}
```

##### 테스트 결과
- 2423 ms 소요

```
2021-10-13 03:11:31.684  INFO 13472 --- [           main] o.s.s.concurrent.ThreadPoolTaskExecutor  : Initializing ExecutorService 'applicationTaskExecutor'
2021-10-13 03:11:31.906  INFO 13472 --- [           main] blog.in.action.CaseFirstTest               : Started CaseFirstTest in 3.415 seconds (JVM running for 4.272)
2423
2021-10-13 03:11:34.476  INFO 13472 --- [extShutdownHook] o.s.s.concurrent.ThreadPoolTaskExecutor  : Shutting down ExecutorService 'applicationTaskExecutor'
2021-10-13 03:11:34.476  INFO 13472 --- [extShutdownHook] j.LocalContainerEntityManagerFactoryBean : Closing JPA EntityManagerFactory for persistence unit 'default'
```

### 2.2. 클래스로부터 인스턴스 생성이 어려운 경우
사용자가 그림판 같은 툴(tool)을 통해 특정 모양을 그렸는데, 이를 복사하여 다른 도형으로 사용하는 경우를 예로 들 수 있습니다. 
다음과 같은 시나리오를 구상해보았습니다. 
- 그림판 같은 툴(tool)에서 사용자 임의대로 도형을 그립니다.
- 사용자가 처음 임의대로 그린 도형은 `originShape` 객체입니다.
- 사용자가 그린 도형을 선택하여 복사하면 새로운 도형이 생성됩니다.
- clone() 메소드를 이용해 `clonedShape` 객체를 생성합니다.

사용자가 도형을 임의로 그렸기 때문에 `originShape` 객체에 포함된 정보를 이용해 일반적인 방법으로 도형 객체를 만드는 것은 큰 어려움이 있습니다.
추가적으로 두 도형은 서로 다른 객체이고 각자의 변경이 서로에게 영향이 없도록 복사되어야 합니다.

#### 2.2.1. Point 클래스
- Point 클래스는 x, y 좌표로 구성됩니다.
- clone() 메소드에서 새로운 Point 객체를 만들어 반환합니다.

```java
@Getter
@Setter
class Point implements Cloneable {

    private int x;
    private int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    protected Point clone() throws CloneNotSupportedException {
        return new Point(x, y);
    }

    @Override
    public String toString() {
        return "[x: " + x + ", y: " + y + "]";
    }
}
```

#### 2.2.2. Line 클래스
- Line 클래스는 2 개의 Point 클래스로 구성됩니다.
- clone() 메소드에서 새로운 Line 객체를 만들어 반환합니다. 
- Point 객체를 복사하여 새로운 객체로 할당합니다.(깊은 복사 수행)

```java
class Line implements Cloneable {

    private Point point1;
    private Point point2;

    public Line(Point point1, Point point2) {
        this.point1 = point1;
        this.point2 = point2;
    }

    public Point getFirstPoint() {
        return point1;
    }

    public Point getSecondPoint() {
        return point2;
    }

    @Override
    protected Line clone() throws CloneNotSupportedException {
        return new Line(point1.clone(), point2.clone());
    }

    @Override
    public String toString() {
        return "[point1: " + point1 + ", point2: " + point2 + "]";
    }
}
```

#### 2.2.3. Shape 클래스
- Shape 클래스는 여러 개의 Line 클래스로 구성됩니다. 
- clone() 메소드에서 새로운 Shape 객체를 만들어 반환합니다. 
- 새로운 리스트 객체를 만들고 Line 객체를 복사하여 담습니다.(깊은 복사 수행)

```java
class Shape implements Cloneable {

    private List<Line> lines;

    public Shape() {
        this.lines = new ArrayList<>();
    }

    public Shape(List<Line> lines) {
        this.lines = lines;
    }

    public void addLine(Line line) {
        this.lines.add(line);
    }

    public Line getLineAtIndex(int index) {
        return this.lines.get(index);
    }

    @Override
    protected Shape clone() throws CloneNotSupportedException {
        List<Line> lineList = new ArrayList<>();
        for (Line line : this.lines) {
            lineList.add(line.clone());
        }
        return new Shape(lineList);
    }


    @Override
    public String toString() {
        return lines.toString();
    }
}
```

#### 2.2.4. 테스트 수행
- 사용자가 임의로 그렸다고 가정하는 `originShape` 객체를 만듭니다.
- clone() 메소드를 이용해  `originShape` 객체를 복사합니다.
- `clonedShape` 객체의 정보를 변경합니다.
- 두 도형의 데이터가 서로 다른지 로그를 통해 확인합니다.

```java
public class CaseSecondTest {

    public static void main(String[] args) throws CloneNotSupportedException {

        Shape originShape = new Shape();
        originShape.addLine(new Line(new Point(0, 0), new Point(0, 1)));
        originShape.addLine(new Line(new Point(0, 1), new Point(1, 1)));
        originShape.addLine(new Line(new Point(1, 1), new Point(1, 0)));
        originShape.addLine(new Line(new Point(1, 0), new Point(0, 0)));

        Shape clonedShape = originShape.clone();
        Line line = clonedShape.getLineAtIndex(0);
        Point secondPoint = line.getSecondPoint();
        secondPoint.setX(-1);
        secondPoint.setY(-1);

        System.out.println("origin shape: " + originShape);
        System.out.println("cloned shape: " + clonedShape);
    }
}
```

##### 테스트 결과
- 복사한 도형의 첫번째 라인의 두번째 점의 좌표를 변경합니다.
- 두 도형의 값이 다름을 확인할 수 있습니다.

```
origin shape: [[point1: [x: 0, y: 0], point2: [x: 0, y: 1]], [point1: [x: 0, y: 1], point2: [x: 1, y: 1]], [point1: [x: 1, y: 1], point2: [x: 1, y: 0]], [point1: [x: 1, y: 0], point2: [x: 0, y: 0]]]
cloned shape: [[point1: [x: 0, y: 0], point2: [x: -1, y: -1]], [point1: [x: 0, y: 1], point2: [x: 1, y: 1]], [point1: [x: 1, y: 1], point2: [x: 1, y: 0]], [point1: [x: 1, y: 0], point2: [x: 0, y: 0]]]
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-10-12-prototype-pattern>

#### REFERENCE
- <https://www.java2novice.com/java-design-patterns/prototype-pattern/>
- <https://en.wikipedia.org/wiki/Prototype_pattern>
- <https://lee1535.tistory.com/76>
- <https://readystory.tistory.com/122>