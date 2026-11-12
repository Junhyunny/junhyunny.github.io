---
title: "팩토리 메서드 패턴(Factory Method Pattern)"
publishedAt: "2022-08-02"
updatedAt: "2026-11-12T16:18:37+09:00"
canonicalPath: "/information/design-pattern/factory-method-pattern/"
categories:
  - "information"
  - "design-pattern"
summary: "팩토리 메서드 패턴의 구조와 장단점을 운송 수단 예약 시스템 예제로 연습하고, 패턴 적용으로 개선되는 SOLID 원칙을 정리했다."
---

## 1. 팩토리 메서드 패턴(Factory Method Pattern)

> [Design Patterns: Elements of Reusable Object Oriented Software][design-pattern-book-link]<br/>
> 객체를 생성하기 위해 인터페이스를 정의하지만, 어떤 클래스의 인스턴스를 생성할지에 대한 결정은 서브 클래스가 내리도록 합니다.

인터넷에서 팩토리 메서드 패턴과 관련된 글을 읽어 보면 팩토리 클래스를 만들고 이를 사용하는 예시가 많다. 하지만 [Design Patterns: Elements of Reusable Object Oriented Software][design-pattern-book-link]의 저자가 팩토리 메서드 패턴의 활용성을 설명한 내용을 보면 팩토리 클래스보다는 메서드를 사용하는 클래스 관점에서 이 패턴을 정리했다는 느낌이 들었다. 같은 시각에서 이해해 보려고 노력하면서 글을 작성했다.

> 팩토리 메서드 패턴 활용성 - [Design Patterns: Elements of Reusable Object Oriented Software][design-pattern-book-link]<br/>
> 팩토리 메서드는 다음과 같은 상황에 사용합니다.<br/>
> * 어떤 클래스가 자신이 생성해야 하는 객체의 클래스를 예측할 수 없을 때
> * 생성할 객체를 기술하는 책임을 자신의 서브 클래스가 지정했으면 할 때
> * 객체 생성의 책임을 몇 개의 보조 서브 클래스 가운데 하나에게 위임하고, 어떤 서브 클래스가 위임자인지에 대한 정보를 국소화하고 싶을 때

### 1.1. 팩토리 메서드 패턴 구조

팩토리 메서드 패턴에 참여하는 클래스들은 다음과 같다.

- Product - 팩토리 메서드가 생성하는 객체의 인터페이스를 정의한다.
- ConcreteProduct - Product 인터페이스를 실제로 구현한 클래스다.
- Creator - Product 타입의 객체를 반환하는 팩토리 메서드를 선언한 클래스(혹은 인터페이스)다.
- ConcreteCreator - Creator 클래스를 상속받아, 팩토리 메서드를 재구현하는 클래스다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/factory-method-pattern-01.png" width="100%" class="image__border">
</div>
<center>https://dev-youngjun.tistory.com/195</center>

### 1.2. 팩토리 메서드 패턴 장단점

다음과 같은 장단점이 존재한다.

- 장점
  - Creator 클래스를 변경하지 않고, Creator 클래스의 구현체 클래스를 새롭게 정의함으로써 시스템을 확장할 수 있다.
- 단점
  - 간단한 코드임에도 클래스가 많아질 수 있다.

## 2. 팩토리 메서드 패턴 연습하기

팩토리 메서드 패턴을 더 잘 이해하고자 간단한 예시 코드를 작성해 봤다. 물류 운송 시스템을 운영 중인 개발자 A의 상황은 다음과 같다.

- 운송 수단을 예약하는 `TransportManager` 클래스를 관리하고 있다.
- 최근 사업 확장으로 운송 수단의 종류가 다양해지면서 다른 팀으로부터 신규 운송 수단의 예약 기능을 추가해 달라는 요구가 빈번하다.
- 개발자 A는 기존 시스템에 최대한 영향을 주고 싶지 않다.
- 개발자 A는 앞으로 예약 기능이 아닌 운송 수단 추가 때문에 `TransportManager` 클래스를 변경하고 싶지 않다.

### 2.1. 기존 코드

기존 코드를 먼저 살펴보자. `Transport` 추상 클래스는 운송 수단의 예약 여부와 예약 메서드를 정의한다.

```java
package action.in.blog.domain.transport;

public abstract class Transport {

    protected boolean reserved;

    public boolean isReserved() {
        return reserved;
    }

    public abstract void reserve();
}
```

`Transport` 클래스를 구현한 일반 트럭과 비행기 클래스가 있다.

```java
package action.in.blog.domain.transport;

public class Truck extends Transport {

    @Override
    public void reserve() {
        System.out.println("do something to reserve truck");
        reserved = true;
    }
}

public class AirPlane extends Transport {

    @Override
    public void reserve() {
        System.out.println("do something to reserve airplane");
        reserved = true;
    }
}
```

기존 시스템의 `TransportManager` 클래스는 일반 트럭과 비행기만 예약 기능을 제공했다. 운송 수단을 예약하고, 이를 반환한다.

```java
package action.in.blog.domain;

import action.in.blog.domain.transport.AirPlane;
import action.in.blog.domain.transport.Transport;
import action.in.blog.domain.transport.Truck;

public class TransportManager {

    public Transport reserveTransport(String transportType) {
        Transport transport = getTransport(transportType);
        transport.reserve();
        return transport;
    }

    private Transport getTransport(String transportType) {
        switch (transportType) {
            case "Truck":
                return new Truck();
            case "AirPlane":
                return new AirPlane();
            default:
                throw new RuntimeException("Not Supported Transport Type: " + transportType);
        }
    }
}
```

### 2.2. 시스템 변경

추가될 운송 수단은 다음과 같다.

- 지상 운송 - 트레일러 차량
- 해상 운송 - 벌크 선박, 컨테이너 선박

먼저 트레일러 차량, 벌크 선박, 컨테이너 선박 클래스를 추가한다.

```java
package action.in.blog.domain.transport;

public class Trailer extends Transport {

    @Override
    public void reserve() {
        System.out.println("do something to reserve trailer");
        reserved = true;
    }
}

public class BulkShip extends Transport {

    @Override
    public void reserve() {
        System.out.println("do something to reserve bulk ship");
        reserved = true;
    }
}

public class ContainerShip extends Transport {

    @Override
    public void reserve() {
        System.out.println("do something to reserve container ship");
        reserved = true;
    }
}
```

하위 클래스들이 `getTransport` 메서드를 재정의할 수 있도록 `TransportManager` 클래스의 `getTransport` 메서드 접근 제어자를 `protected`로 변경한다.

```java
package action.in.blog.domain;

import action.in.blog.domain.transport.AirPlane;
import action.in.blog.domain.transport.Transport;
import action.in.blog.domain.transport.Truck;

public class TransportManager {

    public Transport reserveTransport(String transportType) {
        Transport transport = getTransport(transportType);
        transport.reserve();
        return transport;
    }

    protected Transport getTransport(String transportType) {
        switch (transportType) {
            case "Truck":
                return new Truck();
            case "AirPlane":
                return new AirPlane();
            default:
                throw new RuntimeException("Not Supported Transport Type: " + transportType);
        }
    }
}
```

`RoadTransportManager` 클래스는 지상 운송과 관련된 운송 수단 객체들을 만든다.

```java
package action.in.blog.domain;

import action.in.blog.domain.transport.Trailer;
import action.in.blog.domain.transport.Transport;
import action.in.blog.domain.transport.Truck;

public class RoadTransportManager extends TransportManager {

    @Override
    protected Transport getTransport(String transportType) {
        switch (transportType) {
            case "Truck":
                return new Truck();
            case "Trailer":
                return new Trailer();
            default:
                throw new RuntimeException("Not Supported Transport Type: " + transportType);
        }
    }
}
```

`ShipTransportManager` 클래스는 해상 운송과 관련된 운송 수단 객체들을 만든다.

```java
package action.in.blog.domain;

import action.in.blog.domain.transport.BulkShip;
import action.in.blog.domain.transport.ContainerShip;
import action.in.blog.domain.transport.Transport;

public class ShipTransportManager extends TransportManager {

    @Override
    public Transport getTransport(String transportType) {
        switch (transportType) {
            case "BulkShip":
                return new BulkShip();
            case "ContainerShip":
                return new ContainerShip();
            default:
                throw new RuntimeException("Not Supported Transport Type: " + transportType);
        }
    }
}
```

`AirTransportManager` 클래스는 항공 운송과 관련된 운송 수단 객체를 만든다.

```java
package action.in.blog.domain;

import action.in.blog.domain.transport.AirPlane;
import action.in.blog.domain.transport.Transport;

public class AirTransportManager extends TransportManager {

    @Override
    public Transport getTransport(String transportType) {
        switch (transportType) {
            case "AirPlane":
                return new AirPlane();
            default:
                throw new RuntimeException("Not Supported Transport Type: " + transportType);
        }
    }
}
```

변경한 시스템을 테스트 코드로 확인해 보자. 테스트 코드는 다음 내용을 확인한다.

- 기존 `TransportManager` 클래스가 신규 운송 수단은 지원하지 않는지 확인한다.
- `TransportManager` 클래스를 상속한 신규 매니저들이 적절한 운송 수단만 지원하는지 확인한다.

```java
package action.in.blog.domain;

import action.in.blog.domain.transport.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.instanceOf;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class TransportManagerTests {

    private static Stream<Arguments> getTransportTypes() {
        return Stream.of(
                Arguments.of("Truck", Truck.class),
                Arguments.of("AirPlane", AirPlane.class)
        );
    }

    @ParameterizedTest
    @MethodSource("getTransportTypes")
    void reserve_supported_transport(String transportType, Class clz) {

        TransportManager sut = new TransportManager();
        Transport reservedTransport = sut.reserveTransport(transportType);

        assertThat(reservedTransport, instanceOf(clz));
        assertThat(reservedTransport.isReserved(), equalTo(true));
    }

    private static Stream<Arguments> getNotSupportedTransportTypes() {
        return Stream.of(
                Arguments.of("BulkShip", "Not Supported Transport Type: BulkShip"),
                Arguments.of("ContainerShip", "Not Supported Transport Type: ContainerShip"),
                Arguments.of("Trailer", "Not Supported Transport Type: Trailer")
        );
    }

    @ParameterizedTest
    @MethodSource("getNotSupportedTransportTypes")
    void throw_not_support_exception_from_transport_manager(String transportType, String errorMessage) {

        Throwable throwable = assertThrows(RuntimeException.class, () -> new TransportManager().reserveTransport(transportType));
        assertThat(throwable.getMessage(), equalTo(errorMessage));
    }

    private static Stream<Arguments> getRoadTransportType() {
        return Stream.of(
                Arguments.of("Truck", Truck.class),
                Arguments.of("Trailer", Trailer.class)
        );
    }

    @ParameterizedTest
    @MethodSource("getRoadTransportType")
    void reserve_transport_via_road_transport_manager(String transportType, Class clz) {

        TransportManager sut = new RoadTransportManager();
        Transport reservedTransport = sut.reserveTransport(transportType);

        assertThat(reservedTransport, instanceOf(clz));
        assertThat(reservedTransport.isReserved(), equalTo(true));
    }

    private static Stream<Arguments> getNotSupportedRoadTransportTypes() {
        return Stream.of(
                Arguments.of("BulkShip", "Not Supported Transport Type: BulkShip"),
                Arguments.of("ContainerShip", "Not Supported Transport Type: ContainerShip"),
                Arguments.of("AirPlane", "Not Supported Transport Type: AirPlane")
        );
    }

    @ParameterizedTest
    @MethodSource("getNotSupportedRoadTransportTypes")
    void throw_not_support_exception_from_road_transport_manager(String transportType, String errorMessage) {

        Throwable throwable = assertThrows(RuntimeException.class, () -> new RoadTransportManager().reserveTransport(transportType));
        assertThat(throwable.getMessage(), equalTo(errorMessage));
    }

    private static Stream<Arguments> getShipTransportType() {
        return Stream.of(
                Arguments.of("BulkShip", BulkShip.class),
                Arguments.of("ContainerShip", ContainerShip.class)
        );
    }

    @ParameterizedTest
    @MethodSource("getShipTransportType")
    void reserve_transport_via_ship_transport_manager(String transportType, Class clz) {

        TransportManager sut = new ShipTransportManager();
        Transport reservedTransport = sut.reserveTransport(transportType);

        assertThat(reservedTransport, instanceOf(clz));
        assertThat(reservedTransport.isReserved(), equalTo(true));
    }

    private static Stream<Arguments> getNotSupportedShipTransportTypes() {
        return Stream.of(
                Arguments.of("AirPlane", "Not Supported Transport Type: AirPlane"),
                Arguments.of("Truck", "Not Supported Transport Type: Truck"),
                Arguments.of("Trailer", "Not Supported Transport Type: Trailer")
        );
    }

    @ParameterizedTest
    @MethodSource("getNotSupportedShipTransportTypes")
    void throw_not_support_exception_from_ship_transport_manager(String transportType, String errorMessage) {

        Throwable throwable = assertThrows(RuntimeException.class, () -> new ShipTransportManager().reserveTransport(transportType));
        assertThat(throwable.getMessage(), equalTo(errorMessage));
    }

    @Test
    void reserve_transport_via_air_transport_manager() {

        TransportManager sut = new AirTransportManager();
        Transport reservedTransport = sut.reserveTransport("AirPlane");

        assertThat(reservedTransport, instanceOf(AirPlane.class));
        assertThat(reservedTransport.isReserved(), equalTo(true));
    }

    private static Stream<Arguments> getNotSupportedAirTransportTypes() {
        return Stream.of(
                Arguments.of("Truck", "Not Supported Transport Type: Truck"),
                Arguments.of("Trailer", "Not Supported Transport Type: Trailer"),
                Arguments.of("BulkShip", "Not Supported Transport Type: BulkShip"),
                Arguments.of("ContainerShip", "Not Supported Transport Type: ContainerShip")
        );
    }

    @ParameterizedTest
    @MethodSource("getNotSupportedAirTransportTypes")
    void throw_not_support_exception_from_air_transport_manager(String transportType, String errorMessage) {

        Throwable throwable = assertThrows(RuntimeException.class, () -> new AirTransportManager().reserveTransport(transportType));
        assertThat(throwable.getMessage(), equalTo(errorMessage));
    }
}
```

## 3. SOLID 원칙과 팩토리 메서드 패턴

팩토리 메서드 패턴을 적용하면서 SOLID 원칙 중 어떤 원칙들이 개선되는지 고민해 봤다. SOLID 원칙은 다음과 같다.

- 단일 책임 원칙(SRP, Single Responsibility Principle)
  - 한 클래스는 하나의 책임만 가져야 한다.
  - 해당 클래스를 변경하기 위한 이유는 한 가지만 존재해야 한다.
- 개방-폐쇄 원칙(OCP, Open-Close Principle)
  - 확장에는 열려 있으나 수정에는 닫혀 있어야 한다.
- 리스코프 치환 원칙(LSP, Liskov Substitution Principle)
  - 프로그램의 객체는 프로그램의 정확성을 깨뜨리지 않으면서 하위 타입의 인스턴스로 바꿀 수 있어야 한다.
- 인터페이스 분리 원칙 (ISP, Interface Segregation Principle)
  - 특정 클라이언트를 위한 인터페이스 여러 개가 범용 인터페이스 하나보다 낫다.
- 의존관계 역전 원칙 (DIP, Dependency Inversion Principle)
  - 추상화에 의존해야지, 구체화에 의존하면 안 된다.

### 3.1. TransportManager 클래스와 RoadTransportManager 클래스

`TransportManager` 클래스와 하위 타입 중 `RoadTransportManager` 클래스를 대표로 들어 정리했다.

- 단일 책임 원칙
  - `TransportManager` 클래스는 운송 수단 예약과 관련된 로직이 바뀔 때를 제외하곤 코드가 변경될 일이 없다.
  - `RoadTransportManager` 클래스는 지상 운송 수단이 추가되는 것을 제외하곤 코드가 변경될 일이 없다.
- 개방-폐쇄 원칙
  - 운송 수단이 늘어남에 따라 `TransportManager` 클래스의 변경 없이 새로운 하위 타입 클래스를 만들어 기능을 확장할 수 있다.
- 리스코프 치환 원칙
  - 기존 `TransportManager` 클래스를 사용 중이던 코드를 적절한 하위 타입 클래스로 변경할 수 있다.
  - 기존 코드를 모두 적절한 하위 타입 클래스로 변경하면, `getTransport` 메서드를 추상 메서드, `TransportManager` 클래스를 추상 클래스로 변경할 수 있다.

```java
public class TransportManager {

    public Transport reserveTransport(String transportType) {
        Transport transport = getTransport(transportType);
        transport.reserve();
        return transport;
    }

    protected Transport getTransport(String transportType) {
        switch (transportType) {
            case "Truck":
                return new Truck();
            case "AirPlane":
                return new AirPlane();
            default:
                throw new RuntimeException("Not Supported Transport Type: " + transportType);
        }
    }
}

public class RoadTransportManager extends TransportManager {

    @Override
    protected Transport getTransport(String transportType) {
        switch (transportType) {
            case "Truck":
                return new Truck();
            case "Trailer":
                return new Trailer();
            default:
                throw new RuntimeException("Not Supported Transport Type: " + transportType);
        }
    }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-08-02-factory-method-pattern>

#### REFERENCE

- [Design Patterns: Elements of Reusable Object Oriented Software][design-pattern-book-link]
- <https://en.wikipedia.org/wiki/Factory_method_pattern>
- <https://refactoring.guru/design-patterns/factory-method>
- <https://refactoring.guru/design-patterns/factory-method/java/example>
- <https://dev-youngjun.tistory.com/195>

[design-pattern-book-link]: https://www.kyobobook.co.kr/product/detailViewKor.laf?mallGb=KOR&ejkGb=KOR&barcode=9791195444953
