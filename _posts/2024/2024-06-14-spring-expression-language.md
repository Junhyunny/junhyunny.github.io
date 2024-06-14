---
title: "Spring Expression Language"
search: false
category:
  - spring
last_modified_at: 2024-06-14T23:55:00
---

<br/>

## 1. Spring Expression Language

스프링 프레임워크를 사용하다 보면 스프링 표현식 언어(SpEL, Spring Expression Language)를 자주 만나게 된다. 다음 애너테이션들을 한 번쯤은 본 적이 있을 것이다.

- @Value
- @RequestMapping
- @PreAuthorize, @PostAuthorize

SpEL는 런타임에 객체 그래프를 쿼리(query)하거나 조작(manipulating)할 수 있는 강력한 표현 언어다. JSP(Java Server Page)에서 사용하는 `Unified EL`과 비슷하지만, 더 강력하고 유연한 기능을 제공한다. 공식 문서를 보면 다음과 같은 기능들을 제공한다고 되어 있다.

- 리터럴 표현식
- 불리언과 관계형 오퍼레이터
- 정규 표현식
- 클래스 표현식
- 프로퍼티, 배열, 리스트, 맵에 대한 접근
- 메소드 호출
- 관계형 오퍼레이터
- 할당
- 생성자 호출
- 스프링 빈(bean) 참조
- 배열 생성
- 인라인 리스트
- 삼항 연산자 
- 변수 
- 사용자 정의 함수
- 컬렉션 프로젝션(projection)
- 컬렉션 선택
- 템플릿 표현식

이 글에서 모든 기능을 살펴 볼 순 없다. SpEL 사용 방법에 대한 이해를 돕기 위해 몇 가지 예제들을 살펴보자.

## 2. Literal Expression

`Hello World`라는 문자열 표현식을 사용한다. 단순 문자열도 표현식으로 동작한다.

1. "Hello World" 문자열을 표현식으로 지정한다.
2. 결과 값을 얻는다.
3. 결과는 "Hello World" 문자열과 동일하다.

```java
class LiteralExpressionTests {

    @Test
    void literal() {
        ExpressionParser parser = new SpelExpressionParser();
        Expression sut = parser.parseExpression("'Hello World'"); // 1


        String result = sut.getValue(String.class); // 2


        assertEquals("Hello World", result); // 3
    }
}
```

위 예제만 봤을 때 '문자열 값을 어렵게도 얻는다.'라는 인상을 받을 수 있지만, SpEL의 강력함은 표현식에서 사용되는 객체의 메소드를 호출할 수 있다는 점에 있다. 

1. "Hello World" 문자열의 concat 메소드를 사용해 "!"를 추가하는 표현식을 지정한다.
2. 결과 값을 얻는다.
3. 결과는 "Hello World!" 문자열과 동일하다.

```java
class LiteralExpressionTests {

    @Test
    void useMethod() {
        ExpressionParser parser = new SpelExpressionParser();
        Expression sut = parser.parseExpression("'Hello World'.concat('!')"); // 1


        String result = sut.getValue(String.class); // 2


        assertEquals("Hello World!", result); // 3
    }
}
```

객체 프로퍼티에 접근할 수도 있다. 

1. "Hello World" 문자열의 바이트 배열을 표현식으로 지정한다.
2. 결과 값을 얻는다.
3. 결과는 "Hello World" 문자열의 바이트 배열과 동일하다.

```java
class LiteralExpressionTests {

    @Test
    void accessProperty() {
        ExpressionParser parser = new SpelExpressionParser();
        Expression sut = parser.parseExpression("'Hello World'.bytes"); // 1


        byte[] result = sut.getValue(byte[].class); // 2


        assertArrayEquals("Hello World".getBytes(), result); // 3
    }
}
```

프로퍼티의 프로퍼티에도 접근할 수 있다. 

1. "Hello World" 문자열의 바이트 배열의 길이를 표현식으로 지정한다.
2. 결과 값을 얻는다.
3. 결과는 "Hello World" 문자열의 바이트 배열 길이와 동일하다.

```java
class LiteralExpressionTests {

    @Test
    void accessNestedProperty() {
        ExpressionParser parser = new SpelExpressionParser();
        Expression sut = parser.parseExpression("'Hello World'.bytes.length"); // 1


        int result = sut.getValue(Integer.class); // 2


        assertEquals(11, result); // 3
    }
}
```

다음과 같이 생성자를 표현식으로 사용할 수 있다.

1. "hello world" 문자열의 바이트 배열의 길이를 표현식으로 지정한다.
2. 결과 값을 얻는다.
3. 결과는 "HELLO WORLD" 문자열의 바이트 배열 길이와 동일하다.

```java
class LiteralExpressionTests {

    @Test
    void useConstructor() {
        ExpressionParser parser = new SpelExpressionParser();
        Expression sut = parser.parseExpression("new String('hello world').toUpperCase()");


        String result = sut.getValue(String.class);


        assertEquals("HELLO WORLD", result);
    }
}
```

## 3. Method invocation

SpEL 표현식을 통해 객체의 메소드를 호출할 수 있다. 이미 위 예제를 통해 짐작할 수 있었겠지만, 커스텀 클래스에도 적용 가능하다. 다음과 같은 레코드 클래스가 있다.

- info 메소드
  - 이름, 나이 정보를 특정 포맷으로 반환한다.

```java
package com.example.demo.model;

public record Person(String name, int age) {
    public String info() {
        return "[name: " + name + ", age: " + age + "]";
    }
}
```

SpEL 표현식으로 Person 객체의 info 메소드를 호출해보자.

1. info 메소드를 호출하는 표현식을 지정한다.
2. person 객체 정보를 바탕으로 표현식 결과를 얻는다.
3. 결과는 "[name: junhyunny, age: 35]" 문자열과 동일하다.

```java
public class MethodInvocationTests {

    @Test
    void methodInvocation() {
        Person person = new Person("junhyunny", 35);
        ExpressionParser parser = new SpelExpressionParser();
        Expression sut = parser.parseExpression("info()"); // 1


        String result = sut.getValue(person, String.class); // 2


        assertEquals("[name: junhyunny, age: 35]", result); // 3
    }
}
```

## 4. Operations

SpEL 표현식에 연산자를 사용할 수 있다. 

| type | operators |
|:-:|:-:|
| 산술 연산자 | +, -, *, /, %, ^, div, mod, ... |
| 관계 연산자 | <, >, ==, !=, <=, >=, lt, gt, eq, ne, le, ge, instanceof, matches ... |
| 논리 연산자 | and, or, not, &&, ... |

위에서 정의한 연산자를 표현식에서 사용해보자.

1. 산술 연산자를 사용한 표현식 예시들이다.
2. 관계 연산자를 사용한 표현식 예시들이다.
3. 논리 연산자를 사용한 표현식 예시들이다.

```java
public class OperatorsTests {

    @Test
    void operators() {
        ExpressionParser parser = new SpelExpressionParser();


        assertEquals(15, parser.parseExpression("10 + 5").getValue(Integer.class)); // 1
        assertEquals(5, parser.parseExpression("10 - 5").getValue(Integer.class));
        assertEquals(5, parser.parseExpression("1 * 5").getValue(Integer.class));
        assertEquals(1, parser.parseExpression("5 % 4").getValue(Integer.class));

        assertTrue(parser.parseExpression("'junhyunny' == 'junhyunny'").getValue(Boolean.class)); // 2
        assertTrue(parser.parseExpression("35 > 30").getValue(Boolean.class));
        assertFalse(parser.parseExpression("'xyz' instanceof T(int)").getValue(Boolean.class));
        assertFalse(parser.parseExpression("'5.0067' matches '^-?\\d+(\\.\\d{2})?$'").getValue(Boolean.class));

        assertTrue(parser.parseExpression("true || false").getValue(Boolean.class)); // 3
        assertTrue(parser.parseExpression("true or false").getValue(Boolean.class));
        assertFalse(parser.parseExpression("true && false").getValue(Boolean.class));
        assertFalse(parser.parseExpression("true and false").getValue(Boolean.class));
    }
}
```

 연산자는 객체의 프로퍼티와 함께 사용할 수 있다.

1. 객체 프로퍼티 값을 연산자로 비교하는 표현식을 지정한다.
  - 이름을 확인한다.
  - 나이 범위를 확인한다.
2. person 객체 정보를 바탕으로 표현식 결과를 얻는다.
3. 결과를 확인한다.

```java
public class OperatorsTests {

    @Test
    void operatorsWithInstance() {
        Person person = new Person("junhyunny", 35);
        ExpressionParser parser = new SpelExpressionParser();
        Expression sutName = parser.parseExpression("name == 'junhyunny'"); // 1
        Expression sutAge = parser.parseExpression("age > 40");


        boolean resultName = sutName.getValue(person, Boolean.class); // 2
        boolean resultAge = sutAge.getValue(person, Boolean.class);


        assertTrue(resultName); // 3
        assertFalse(resultAge);
    }
}
```

## 5. Collections Query

컬렉션 쿼리 기능도 굉장히 강력하다. 먼저 단순하게 컬렉션 리스트에 담긴 아이템을 꺼내보자.

1. 루트 객체의 첫번째 아이템을 얻는 표현식을 지정한다.
2. people 객체 정보를 바탕으로 표현식 결과를 얻는다.
3. 결과를 확인한다.

```java
public class CollectionTests {

    @Test
    void firstItem() {
        List<Person> people = Arrays.asList(new Person("John", 25), new Person("Jane", 30));
        ExpressionParser parser = new SpelExpressionParser();
        Expression sut = parser.parseExpression("#root[0]"); // 1


        Person result = sut.getValue(people, Person.class); // 2


        assertEquals("John", result.name()); // 3
        assertEquals(25, result.age());
    }
}
```

아래처럼 특정 조건에 맞는지 리스트를 필터링 할 수 있다.

1. 루트 리스트 객체의 아이템 중 나이가 25보다 큰 객체들만 얻는다.
2. people 객체 정보를 바탕으로 표현식 결과를 얻는다.
3. 결과를 확인한다.
  - 나이가 25 이상인 Jane, Junhyunny만 담긴 리스트를 얻는다.

```java
public class CollectionTests {

    @Test
    void filter() {
        List<Person> people = Arrays.asList(new Person("John", 25), new Person("Jane", 30), new Person("Junhyunny", 35));
        ExpressionParser parser = new SpelExpressionParser();
        Expression sut = parser.parseExpression("#root.?[age > 25]"); // 1


        List<Person> result = sut.getValue(people, List.class); // 2


        assertEquals("Jane", result.get(0).name()); // 3
        assertEquals(30, result.get(0).age());
        assertEquals("Junhyunny", result.get(1).name());
        assertEquals(35, result.get(1).age());
    }
}
```

## 6. Instance Manipulating

객체 상태를 변경할 수 있다. 다음과 같은 Car 클래스가 있다.

- 값을 변경할 수 있도록 세터(setter) 메소드가 있다.

```java
package com.example.demo.model;

public class Car {
    private String brand;

    public Car(String brand) {
        this.brand = brand;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }
}
```

다음과 같은 방법으로 객체의 상태를 변경한다.

1. brand 프로퍼티를 표현식으로 지정한다.
2. car 객체의 brand 프로퍼티를 "BMW" 문자열로 변경한다.
3. 객체의 brand 프로퍼티가 변경되었는지 확인한다.

```java
public class ManipulatingTests {

    @Test
    void singleInstance() {
        Car car = new Car("Hyundai");
        ExpressionParser parser = new SpelExpressionParser();
        Expression sut = parser.parseExpression("brand"); // 1


        sut.setValue(car, "BMW");


        assertEquals("BMW", car.getBrand());
    }
}
```

컬렉션 객체도 변경할 수 있다. 

1. 루트 리스트 객체의 add 메소드로 새로운 객체를 추가하는 표현식을 정의한다.
2. 표현식을 실행한다.
3. people 리스트 객체에 새로운 Person 객체가 포함되었는지 확인한다.

```java
public class ManipulatingTests {

    @Test
    void collectionInstance() {
        List<Person> people = new ArrayList<>(Collections.singleton(new Person("John", 25)));
        ExpressionParser parser = new SpelExpressionParser();
        Expression sut = parser.parseExpression("#root.add(new com.example.demo.model.Person('Jane', 30))"); // 1


        sut.getValue(people, List.class); // 2


        assertEquals("John", people.get(0).name()); // 3
        assertEquals(25, people.get(0).age());
        assertEquals("Jane", people.get(1).name());
        assertEquals(30, people.get(1).age());
    }
}
```

## 7. EvaluationContext Interface

위 예제들을 살펴보면 알 수 있듯이 표현식으로부터 값을 꺼낼 때 루트 객체를 전달하면 루트 객체의 프로퍼티와 메소드를 사용할 수 있다.

```java
    Person person = new Person("junhyunny", 35);
    Expression sutName = parser.parseExpression("name == 'junhyunny'");
    boolean resultName = sutName.getValue(person, Boolean.class);
```

루트 객체를 직접 사용하지 않고 EvaluationContext 인스턴스를 사용하는 방법도 있다. EvaluationContext 인스턴스는 표현식을 평가하기 위해 사용한다. EvaluationContext 인스턴스는 다음과 같은 정보를 저장할 수 있다.

- 루트 객체
  - 표현식에서 사용하는 프로퍼티나 메소드를 소유한 객체
- 변수 
  - 표현식에서 접근할 수 있는 이름을 갖는 값
- 함수
  - 표현식에서 호출할 수 있는 함수
- 빈 리졸버(bean resolver)
  - 표현식에서 스프링 빈 객체를 참조할 수 있는 리졸버

평가 컨텍스트는 루트 객체를 포함한 더 다양한 정보를 제공한다고 볼 수 있다. 간단한 예시를 살펴보자. 평가 컨텍스트에 저장한 루트 객체의 프로퍼티를 조회해보자.

1. 평가 컨텍스트에 Person 객체를 루트 객체로 지정한다.
2. 프로퍼티 이름 name, age을 표현식으로 지정한다.
3. 평가 컨텍스트를 바탕으로 값을 조회한다.
4. 값을 확인한다.

```java
@SpringBootTest
public class EvaluationContextTests {

    @Test
    void rootObject() {
        Person person = new Person("junhyunny", 35);
        StandardEvaluationContext context = new StandardEvaluationContext(person); // 1
        ExpressionParser parser = new SpelExpressionParser();
        Expression sutName = parser.parseExpression("name"); // 2
        Expression sutAge = parser.parseExpression("age");


        String resultName = sutName.getValue(context, String.class); // 3
        int resultAge = sutAge.getValue(context, Integer.class);


        assertEquals("junhyunny", resultName); // 4
        assertEquals(35, resultAge);
    }
}
```

평가 컨텍스트에 변수를 등록해 사용할 수 있다.

1. 평가 컨텍스트에 변수를 등록한다.
  - 이름은 greeting, 값은 "Hello World" 문자열이다.
2. 변수 이름을 표현식으로 지정한다. 
  - `#` 문자를 변수 이름 앞에 추가한다.
3. 평가 컨텍스트를 바탕으로 값을 조회한다.
4. 값을 확인한다.

```java
@SpringBootTest
public class EvaluationContextTests {

    @Test
    void variable() {
        StandardEvaluationContext context = new StandardEvaluationContext();
        context.setVariable("greeting", "Hello World"); // 1
        ExpressionParser parser = new SpelExpressionParser();
        Expression sut = parser.parseExpression("#greeting"); // 2


        String result = sut.getValue(context, String.class); // 3


        assertEquals("Hello World", result); // 4
    }
}
```

평가 컨텍스트에 직접 만든 함수를 등록할 수 있다. 

1. 평가 컨텍스트에 함수를 등록한다.
  - reverse라는 이름으로 EvaluationContextTests 클래스의 reverse 정적 메소드를 등록한다.
2. reverse 함수 호출을 표현식으로 지정한다. 
  - `#` 문자를 함수 이름 앞에 추가한다.
3. 평가 컨텍스트를 바탕으로 값을 조회한다.
4. 값을 확인한다.

```java
@SpringBootTest
public class EvaluationContextTests {

    static String reverse(String in) {
        return new StringBuffer(in).reverse().toString();
    }

    @Test
    void function() throws NoSuchMethodException {
        Method reverseMethod = EvaluationContextTests.class.getDeclaredMethod("reverse", String.class);
        StandardEvaluationContext context = new StandardEvaluationContext();
        context.registerFunction("reverse", reverseMethod); // 1
        ExpressionParser parser = new SpelExpressionParser();
        Expression sut = parser.parseExpression("#reverse('Hello World')"); // 2


        String result = sut.getValue(context, String.class); // 3


        assertEquals("dlroW olleH", result); // 4
    }
}
```

스프링 빈 객체를 참조해 사용할 수 있다. 다음과 같은 스프링 빈이 존재한다.

- get 메소드를 호출하면 "Hello Foo Service" 문자열을 반환한다.

```java
package com.example.demo.service;

import org.springframework.stereotype.Service;

@Service
class FooService {
    public String get() {
        return "Hello Foo Service";
    }
}
```

표현식에서 스프링 빈 객체에 접근해보자.

1. 빈 리졸버를 평가 컨텍스트에 추가한다.
  - 빈 리졸버 객체에 애플리케이션 컨텍스트를 지정한다.
1. fooService 스프링 빈 객체의 get 메소드 호출을 표현식으로 지정한다. 
  - `@` 문자를 스프링 빈 이름 앞에 추가한다.
2. 평가 컨텍스트를 바탕으로 값을 조회한다.
3. 값을 확인한다.

```java
@SpringBootTest
public class EvaluationContextTests {

    @Autowired
    ApplicationContext applicationContext;

    @Test
    void springBean() {
        StandardEvaluationContext context = new StandardEvaluationContext();
        context.setBeanResolver(new BeanFactoryResolver(applicationContext)); // 1
        ExpressionParser parser = new SpelExpressionParser();
        Expression sut = parser.parseExpression("@fooService.get()"); // 2


        String result = sut.getValue(context, String.class); // 3


        assertEquals("Hello Foo Service", result); // 4
    }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-06-14-spring-expression-language>

#### REFERENCE

- <https://docs.spring.io/spring-framework/docs/3.0.x/reference/expressions.html>
- <https://docs.spring.io/spring-framework/reference/core/expressions.html>