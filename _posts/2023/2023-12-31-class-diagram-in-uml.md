---
title: "Class Diagram in UML"
search: false
category:
  - information
last_modified_at: 2023-12-31T23:55:00
---

<br/>

## 0. 들어가면서

클래스 다이어그램(class diagram)이라는 말을 들으면 주니어 시절 프로젝트 설계 문서에 클래스 다이어그램을 그리면서 "다시 읽지도 않을 문서에 그림 그리기를 너무 열심히 하고 있네" 라고 불평했던 기억이 종종 떠오른다. 프로젝트 경험이 쌓이다보니 다른 개발자들이나 가끔씩은 PM들과 의사소통할 떄 이만한 도구가 없었던 것 같다. "이렇게 저렇게"라고 말로만 표현하는 것은 내 머리 속에만 있을 뿐 아무도 이해하지 못 한다. 

- 프로젝트 중 도메인 설계에 대한 고민을 논리적으로 시각화할 수 있었다.
- 레거시 시스템에 대한 클래스 다이어그램이 있다면 소스 코드만 있을 때보다 더 빠르게 분석할 수 있었다.

최근 책을 쓰면서 클래스 다이어그램들이 그리는 데 관계가 들쭉 날쭉했다. 매번 검색하면서 그리다보니 일관성 없이 표현한 것 같다. 책은 독자들과 실시간 피드백이 되지 않기 때문에 프로젝트처럼 대충 그리고 말로 때우는 식은 안 된다고 생각한다. 독자에게 정확하고 일관성 있는 의사 전달을 하기 위해 클래스 다이어그램에 대해 다시 공부하고 글로 정리했다. 

## 1. Unified Modeling Language 

클래스 다이어그램은 통합 모델링 언어(Unified Modeling Language, UML)의 한 종류다. 통합 모델링 언어가 무엇인지 살펴보자.

> 통합 모델링 언어(Unified Modeling Language, UML)는 소프트웨어 공학에서 사용되는 표준화 된 범용 모델링 언어이다.

모델링은 직접 만들기 전에 비용을 적게 들여 무언가를 표현하는 것이다. 예를 들어 건물은 실제로 지으면 비용이 많이 들기 때문에 3D 모델링을 통해 적은 비용으로 이해 관계자들이 건물의 구조, 크기 등을 이해할 수 있도록 돕는다. 소프트웨어도 마찬가지로 구현하는데 시간과 비용이 들기 때문에 모델링이라는 시각적 표현으로 의사소통을 수행한다.

통합 모델링 언어는 객체 관리 그룹(Object Management Group, OMG)라는 비영리 단체에 의해 1997년 표준으로 체택되었다. 통합 모델링 언어는 여러가지 다이어그램을 통해 소프트웨어를 표현한다. 크게 두 종류로 구분된다. 

- 구조 다이어그램(structure diagram)
  - 추상화 및 구현 수준에서 시스템과 각 부품의 정적 구조와 연관 관계를 보여준다.
  - 클래스 다이어그램은 구조 다이어그램에 속한다.
- 행동 다이어그램(behavior diagram)
  - 시간 경과에 따른 시스템 내 변화나 내부 객체들의 동작, 클라이언트와 시스템들 사이의 통신 과정을 보여준다.
  - 유스 케이스(use case) 다이어그램과 시퀀스(sequence) 다이어그램이 행동 다이어그램에 속한다.

<p align="center">
  <img src="/images/class-diagram-in-uml-01.png" width="80%" class="image__border image__padding">
</p>
<center>https://www.nextree.co.kr/p6753/</center>

## 2. Class Diagram

위 내용을 요약해보자.

- 클래스 다이어그램은 UML 다이어그램의 구조 다이어그램 중 하나다.
- 구조 다이어그램은 시스템을 구성하는 각 부품의 정적 구조와 연관 관계를 보여주기 위한 시각적 표현이다. 

자바(java) 애플리케이션을 구성하는 부품은 클래스(class)다. 애플리케이션을 구성하는 클래스들의 정적 구조와 연관 관계를 클래스 다이어그램을 통해 표현할 수 있다. 클래스 다이어그램은 객체 지향 언어를 대상으로 발전해왔기 때문인지 모든 언어에 적합하진 않은 것 같다. 

작은 비즈니스 기능에도 참여하는 클래스들이 굉장히 많을 수 있다. 클래스 다이어그램은 모델링 언어이기 때문에 모든 것을 상세하게 표현하기 위한 수단이 아니다. 전달하고 싶은 내용을 효과적으로 표현하는데 집중하는 것이 중요하다. 클래스 다이어그램에 클래스가 너무 많다면 다이어그램을 통해 전달하고 싶은 메세지를 다시 고민해봐야 한다.

### 2.1. Class Diagram Element

클래스 다이어그램을 구성하는 엘리먼트(element)들을 먼저 알아본다. 자바 애플리케이션을 기준으로 설명한다. UML에는 속성(attribute)와 기능(operation)로 표현하지만, 이 글에선 필드(field)와 메소드(method)로 표현했다. 언어에 따라 특성이 다르기 때문에 설명이 맞지 않을 수 있다. 만약 다른 언어가 주 무기라면 그에 맞는 표현 방법을 공부해보길 바란다. 

#### 2.1.1. Access Modifier

접근 제어자를 표시하는 방법이다. 접근 제어자는 필드, 메소드, 클래스 앞에 추가된다. 클래스 다이어그램을 보면 보통 필드나 메소드 이름 앞에 붙는다. 표를 통해 각 의미와 표기법을 정리한다. 

| 접근 제어자 | 표시 | 
|:-:|:-:|
| public | + |
| private | - |
| protected | # |
| package | ~ |

#### 2.1.2. Class

객체를 생성을 위한 클래스를 먼저 살펴본다. 다음과 같은 User 클래스가 있다.

```java
public class User {

    private String givenName;
    private String familyName;

    public String fullName() {
        return String.format("%s %s", givenName, familyName);
    }
}
```

클래스 이름, 속성, 메소드로 세 영역으로 구분하여 작성한다. 속성엔 변수 이름과 해당 타입을 표시한다. 메소드에는 전달받은 파라미터, 반환 타입을 정의한다. 각 속성과 메소드 앞에 접근 제어자를 표현하는 기호를 추가한다. 비즈니스 규칙, 책임, 예외 등을 표현하고 싶다면 새 영역을 추가로 만들 수 있다.

<p align="center">
  <img src="/images/class-diagram-in-uml-02.png" width="50%" class="image__border">
</p>

#### 2.1.3. Abstract Class and Method

다음과 같은 추상 클래스를 클래스 다이어그램으로 표시해보자.

```java
public abstract class Computer {

    protected abstract void boot();

    public void typing(String value) {
        System.out.println(value);
    }
}
```

추상 클래스나 메소드를 표시할 때 클래스, 메소드 이름에 이탤릭(italic)체를 적용한다. 

<p align="center">
  <img src="/images/class-diagram-in-uml-03.png" width="50%" class="image__border">
</p>

#### 2.1.4. Stereotype

클래스 외에도 인터페이스(interface), 이넘(enum) 같은 요소들도 애플리케이션을 함께 구성한다. 이런 요소들은 스테레오타입(stereotype)을 통해 추가 정보를 제공한다. 스테레오타입은 길러멧(guillemet)이라는 쌍꺽쇠 기호 사이에 타입을 명시한 표현 방법이다. 인터페이스를 예로 들어 본다.

```java
public interface AuthenticationManager {
    Authentication authenticate(Authentication authentication) throws AuthenticationException;
}
```

위 인터페이스를 클래스 다이어그램 요소로 표기하면 다음과 같다. 

<p align="center">
  <img src="/images/class-diagram-in-uml-04.png" width="50%" class="image__border">
</p>

#### 2.1.5. static and final properties

정적(static), 상수(final)에 대한 내용은 어떻게 표현할까? 

```java
public class Math {

    public static final double PI = 3.14;
}
```

정적 필드는 밑줄을 표기, 상수 같은 경우엔 옆에 `readonly`를 표기한다. 클래스 다이어그램으로 표기하면 다음과 같다.

<p align="center">
  <img src="/images/class-diagram-in-uml-05.png" width="50%" class="image__border">
</p>

### 2.2. Class Diagram Relation

클래스 다이어그램을 구성하는 요소들 사이의 관계 표현을 살펴본다. 

#### 2.2.1. Generalization

일반화(generalization) 관계는 클래스 상속(inheritance)을 의미한다. `extends` 키워드를 사용하는 케이스라고 봐도 무방하다. 다음과 같은 케이스들은 모두 일반화로 표현한다. 

- 추상 클래스를 추상 클래스가 상속
- 추상 클래스를 일반 클래스가 상속
- 일반 클래스를 일반 클래스가 상속
- 인터페이스가 인터페이스를 확장

일반화 관계는 실선과 삼각형으로 표현한다. 자식이 부모를 참조하는 방향으로 화살표를 그린다.

<p align="center">
  <img src="/images/class-diagram-in-uml-06.png" width="80%" class="image__border">
</p>

#### 2.2.2. Realization

실체화(realization) 관계는 인터페이스 구현(implement)을 의미한다. `implements` 키워드를 사용하는 케이스다. 다음과 같은 상황들은 모두 실체화로 표현한다.

- 인터페이스를 추상 클래스가 구현하는 경우
- 인터페이스를 일반 클래스가 구현하는 경우

실체화 관계는 점선과 삼각형으로 표현한다. 일반화와 마찬가지로 자식이 부모를 참조하는 방향으로 화살표를 그린다.

<p align="center">
  <img src="/images/class-diagram-in-uml-07.png" width="80%" class="image__border">
</p>

#### 2.2.3. Dependency

의존(dependency) 관계는 어떤 클래스 객체가 다른 클래스 객체를 참조하는 경우를 의미한다. 다음과 같은 방식으로 객체를 참조한다면 의존 관계다.

- 메소드 파라미터로 객체를 전달받아 사용
- 메소드 내부에서 객체를 생성해 사용
- 메소드 내부에서 객체를 생성해 반환

```java
public class Employee {

    public void write(Document document) {
        // ...
    }

    public Document submit() {
        Document document = new Document();
        // ...
        return document;
    }
}
```

의존 관계는 점선과 화살표로 표현한다. Employee 객체가 Document 객체를 참조하기 때문에 화살표 방향은 Employee에서 Document로 향한다. 필요하다면 스테레오타입을 선 위에 표현해 의존 목적을 명확하게 명시할 수도 있다.  

<p align="center">
  <img src="/images/class-diagram-in-uml-08.png" width="50%" class="image__border">
</p>

#### 2.2.4. Association

연관(association) 관계는 의존 관계와 비슷하지만, 참조 형태가 다르다. 필드로 정의한 멤버 변수로 다른 클래스 객체를 참조한다. 연관 관계는 방향 외에도 다중성, 역할명, 연관 이름 등을 표현하기도 한다. 먼저 다중성은 클래스 사이의 관계가 일-대-일, 일-대-다, 다-대-다 여부를 표시하는 것이다.

| 다중성 표기 | 의미 | 
|:-|:-|
| 1 | 엄밀하게 1 |
| * 혹은 0..* | 0 또는 그 이상 |
| 1..* | 1 또는 그 이상 |
| 1, 2, 6 | 1 또는 2 또는 6 | 

역할명은 다른 클래스 객체를 참조할 때 사용하는 필드 이름을 사용하는 것이 편하다. 연관 이름은 관계의 모호함을 명확하게 표현하기 위해 추가한다. 관계가 명확하다면 표시하지 않아도 된다. 예를 들어 다음과 같은 클래스들이 있다고 가정한다. 

```java
public class Employee {
    private Company company;
    private List<Contact> contacts;
}

public class Company {
}

public class Contact {
    private Employee employee;
    private String type;
    private String value;
}
```

연관 관계는 점선과 화살표로 표현한다. 위의 클래스들의 관계를 클래스 다이어그램으로 그려보자.

- Employee 객체는 Company, Contact 객체와 연관 관계를 가진다.
- Employee, Company 객체 사이 연관 관계
  - Employee 객체는 Company 객체를 알지만, Company 객체는 Employee 객체를 모른다. 화살표 방향은 Employee에서 Company로 이어진다.
  - 관계를 명확하게 정의하기 위해 `Working`이라는 연관 이름을 지정한다.
  - 역할명은 `company`로 표기한다.
- Employee, Contact 객체 사이 연관 관계
  - Employee, Contact 객체는 서로를 참조한다. 화살표 방향 표시는 생략한다.
  - Employee 객체는 Contact 객체를 1개 이상 가질 수 있기 때문에 일-대-다로 표기한다.

<p align="center">
  <img src="/images/class-diagram-in-uml-09.png" width="80%" class="image__border">
</p>

#### 2.2.5. Aggregation and Composition

클래스 다이어그램은 일반화, 실체화, 의존, 연관 관계만으로도 충분히 그릴 수 있다. 추가로 애그리게이션(aggregation 혹은 shared aggreation)과 컴포지션(composition 혹은 composite aggregation) 관계라는 개념이 존재한다. 애그리게이션과 컴포지션은 연관 관계를 좀 더 확장한 개념이다. 특수한 경우를 설명하기 위해 사용한다. 기본적으로 연관 관계이기 때문에 필드를 통해 객체를 참조한다는 사실은 동일하다.

- 애그리게이션과 컴포지션은 연관 관계에서 전체(whole)와 부분(part) 관계를 나타내기 위해 사용한다.
- 애그리게이션은 약한 소유를 의미한다.
- 컴포지션은 강한 소유를 의미한다.

전체 객체와 부분 객체 사이의 소유에 대한 강약 여부는 객체 라이프사이클(lifecycle)이 동일한지를 의미한다. 약한 소유인 애그리게이션은 전체를 담당하는 객체가 제거되더라도 부분을 담당하는 객체가 사라지지 않는다. 부분을 담당하는 객체를 참조하는 다른 객체가 존재하기 때문에 가비지 컬렉션(garbage collection) 대상이 되지 않는다. 반대로 강한 소유인 컴포지션은 전체를 담당하는 객체가 사라지면 부분을 담당하는 객체가 함께 제거된다. 공유되고 있지 않기 때문에 객체 참조를 잃으면서 함께 가비지 컬렉션 대상이 된다.  

애그리게이션과 컴포지션은 다이아몬드가 포함된 선으로 표현한다. 전체 엘리먼트 쪽으로 다이아몬드가 표시된다. 

- 애그리게이션은 빈 다이아몬드를 사용한다.
- 컴포지션은 채워진 다이아몬드를 사용한다.

<p align="center">
  <img src="/images/class-diagram-in-uml-10.png" width="100%" class="image__border">
</p>

## CLOSING

한국어로 표기하면 애그리게이션은 집합, 컴포지션은 합성이다. 집합과 합성은 비슷한 느낌을 주기 때문에 필자도 글을 다시 읽어보면서 헷갈렸다. 가독성을 위해 영어 발음을 그대로 작성했다. 애그리게이션(shared aggregation)은 개발자, 분석가, 모델러들 사이에 해석이 달라 객체 관리 그룹(OMG)의 UML 문서에도 자세한 설명이 없다고 한다. 다이어그램 해석에 오해를 일으킬 수 있으니 애그리게이션이나 컴포지션은 사용하지 않는 것이 좋을 것 같다.

<p align="center">
  <img src="/images/class-diagram-in-uml-11.png" width="80%" class="image__border">
</p>
<center>https://www.omg.org/spec/UML/2.4.1/Superstructure/PDF</center>

#### REFERENCE

- [통합 모델링 언어](https://ko.wikipedia.org/wiki/%ED%86%B5%ED%95%A9_%EB%AA%A8%EB%8D%B8%EB%A7%81_%EC%96%B8%EC%96%B4)
- [객체 관리 그룹](https://ko.wikipedia.org/wiki/%EA%B0%9D%EC%B2%B4_%EA%B4%80%EB%A6%AC_%EA%B7%B8%EB%A3%B9)
- <https://www.omg.org/spec/UML/2.4.1/Superstructure/PDF>
- <https://www.nextree.co.kr/p6753/>
- <https://wikidocs.net/212037>
- <https://www.youtube.com/watch?v=eBylHYAlzZk>
- <https://www.youtube.com/watch?v=HG0dwNnTsII>
- <https://stackoverflow.com/questions/47588511/uml-diagram-how-to-show-final>
- <https://stackoverflow.com/questions/2695006/what-does-an-interface-extends-interface-relationship-look-like-in-uml>
