---
title: "Test Double"
search: false
category:
  - information
  - test-driven-development
last_modified_at: 2021-11-26T23:55:00
---

<br/>

## 1. Test Double

테스트 더블은 영화 산업에서 위험한 장면을 촬용할 떄 배우의 대역인 스턴트 더블(stunt double)에서 유래했다. 한국에선 흔히 이를 스턴트 맨이라고 부른다. 테스트 대상 시스템(system under test)의 단위 기능을 검증할 때 외부 컴포넌트(혹은 객체)의 기능을 대체하는 용도로 사용한다. 

<div align="center">
    <img src="/images/posts/2024/test-double-01.png" width="50%" class="image__border">
</div>
<center>https://www.crocus.co.kr/1555</center>

<br/>

하나의 소프트웨어는 여러 객체들의 협업을 퉁해 동작하기 때문에 작은 단위 기능을 테스트하기 위해 여러 객체들의 도움이 필요하다. 이는 테스트를 어렵게 만든다. 예를 들어보자. 다음과 같은 구현 코드가 있다.

- UserService 객체는 JpaUserRepository 객체는 통해 사용자 정보를 조회한다.
- JpaUserRepository 객체는 DB에서 데이터를 조회한다.

<div align="center">
    <img src="/images/posts/2024/test-double-02.png" width="80%" class="image__border">
</div>

<br/>

위 기능은 다음과 같은 관점에서 테스트가 어렵다. 

- 데이터베이스를 사용하기 때문에 테스트 결과가 데이터 상황의 영향을 받는다. 테이터의 변경이 발생하면 테스트가 실패한다.

단위 테스트는 어느 상황에서도 성공해야 하지만, findById 메소드가 데이터베이스에 의존하고 있기 떄문에 항상 같은 결과를 반환한다는 보장이 없다. 이를 어떻게 해결할 수 있을까? 이런 상황에선 JpaUserRepository 객체를 항상 같은 결과를 반환하는 테스트 더블 객체로 대체한다. 테스트 더블은 항상 고정된 값을 응답하기 때문에 테스트 코드는 항상 성공한다. 

<div align="center">
    <img src="/images/posts/2024/test-double-03.png" width="80%" class="image__border">
</div>

<br/>

이는 데이터베이스 같이 네트워크를 통해 연결된 외부 시스템이 있을 때만 발생하는 문제가 아니다. 랜덤한 값을 생성하는 객체나 매번 변경되는 시간 등도 테스트를 어렵게 만든다. 항상 고정된 결과를 반환하는 응답으로 테스트를 한다는 사실이 어색할 수 있지만, 중요한 것은 테스트 대상 메소드는 UserService 객체의 userMe 메소드라는 점이다. userMe 메소드는 다음과 같은 기능을 수행한다고 가정한다.

- 엔티티 객체를 모델 객체로 변환 
- 사용자 정보가 없는 경우 적절한 예외 처리

단위 테스트는 위 userMe 메소드가 맡은 책임에 대한 기능을 검증하는 것에 초점을 맞춘다. 반환한 데이터에 어떤 값들이 있는지는 중요하지 않다. 위 두 가지 책임을 잘 수행하는지 확인하기 위한 테스트 코드를 작성하고, 테스트 더블의 응답을 각 단위 테스트마다 적절하게 설정한다. 

테스트 더블을 효과적으로 사용하기 위해선 UserService 객체는 실행 환경에 따라 적절한 구현체 객체와 협력할 수 있도록 인터페이스 같은 추상화 된 인터페이스를 의존해야 한다. 이를 통해 UserService 객체 입장에선 동일한 모습을 한 객체에게 일을 맡기는 것이 가능하다. 영화를 보는 관객이 스턴트 맨의 액션을 실제 배우의 액션으로 착각하고 보는 것과 동일하다는 생각이 들지 않는가? 

테스트 더블은 다음과 같은 용도로 사용한다.

- 예측 불가능한 요소를 테스트 코드에서 통제하는 용도
- 느린 테스트를 보다 빠르게 만들어 테스트로부터 빠른 피드백을 얻기 위한 용도
- 통합 테스트 환경을 구축하기 어려운 경우

## 2. Dependency Inversion Principle

의존성 역전 원칙(Dependency Inversion Principle, DIP)은 객체 지향 프로그래밍에서 SOLID 원칙 중 하나로 구현이 아닌 추상화 에 의존하도록 설계하라는 원칙이다. 고수준 모듈(High-Level Module)과 저수준 모듈(Log-Level Module) 간의 의존성을 뒤집어, 고수준 모듈이 저수준 모듈에 의존하지 직접 의존하지 않도록 하는 것이다. 이를 통해 시스템의 유연성과 확장성을 향상시킬 수 있다.

- 고수준 모듈인 UserService 객체가 저수준 모듈인 JpaUserRepository 객체를 직접 의존하지 않고, 추상화 된 UserRepository 인터페이스에 의존한다.
- 저수준 모듈인 JpaUserRepository, StubUserRepository 객체는 추상화 된 UserRepository 인터페이스를 의존한다. 
- 고수준 모듈이 저수준 모듈에 직접 의존하는 관계를 뒤집어 고수준, 저수준 모듈 모두 추상화 계층을 의존하도록 설계하는 것을 의존성의 방향을 역전했다고 표현한다. 

<div align="center">
    <img src="/images/posts/2024/test-double-04.png" width="80%" class="image__border">
</div>

## 2. Type of test double 

테스트 더블은 수행하는 역할에 따라 종류가 다르다. 테스트 더블의 종류는 5가지이다.

- 더미(dummy)
- 스텁(stub)
- 스파이(spy)
- 페이크(fake)
- 목(mock)

<div align="center">
    <img src="/images/posts/2024/test-double-05.png" width="50%" class="image__border">
</div>
<center>http://xunitpatterns.com/Test%20Double.html</center>

<br/>

간단한 예제 코드를 통해 각 테스트 더블의 개념을 정리한다. 다음과 같은 주문 결제 기능이 있다. OrderService 객체는 추상화 된 OrderRepository 인터페이스를 의존하고 있다.

```java
package blog.in.action.service;

import blog.in.action.domain.Order;
import blog.in.action.domain.User;
import blog.in.action.repository.OrderRepository;

import java.util.UUID;

public class OrderService {
    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public UUID placeOrder(User user, Order order) {
        if (!user.isAdmin()) {
            throw new RuntimeException("only admins can place orders");
        }
        return orderRepository.placeOrder(order);
    }

    public Order findById(UUID id) {
        var order = orderRepository.findById(id);
        if (order == null) {
            throw new RuntimeException("Order not found");
        }
        return order;
    }
}
```

처음 살펴볼 테스트 더블은 더미이다. 더미는 아무런 동작을 하지 않고, 컴파일 에러 등의 문제를 해결하기 위해 자리를 채우는 용도로 사용된다. 메소드 시그니처(signature)를 맞추기 위해 의미 없는 객체를 전달하는 것이다. 아래 단위 테스트는 관리자가 아닌 경우 예외가 발생하는지 확인한다. 테스트에서 검증하는 기능에 OrderRepository 인스턴스나 Order 객체는 필요하지 않지만, 없는 경우 컴파일 에러가 발생하기 때문에 인자로 전달한다.

```java
class DummyOrderRepository implements OrderRepository {
    
    @Override
    public UUID placeOrder(Order order) {
        return null;
    }

    @Override
    public Order findById(UUID id) {
        return null;
    }
}

public class DummyCaseTest {

    @Test
    void givenNotAdmin_whenPlaceOrder_thenThrowException() {
        OrderService sut = new OrderService(new DummyOrderRepository());


        assertThrows(RuntimeException.class, () -> {
            sut.placeOrder(
                    new User("junhyunny", "ROLE_USER"),
                    new Order()
            );
        });
    }
}
```

스텁은 고정된 결과를 반환하도록 미리 설정된 객체다. 스텁을 활용하면 개발자는 테스트 코드에서 원하는 조건이나 결과를 제어할 수 있다.

```java
class StubOrderRepository implements OrderRepository {

    UUID returnOrderId;

    public void setReturnOrderId(UUID returnOrderId) {
        this.returnOrderId = returnOrderId;
    }

    @Override
    public UUID placeOrder(Order order) {
        return returnOrderId;
    }

    @Override
    public Order findById(UUID id) {
        return null;
    }
}

public class StubCaseTest {

    @Test
    void givenAdmin_whenPlaceOrder_thenReturnOderId() {
        StubOrderRepository stub = new StubOrderRepository();
        stub.setReturnOrderId(UUID.fromString("a1b3360b-687e-4491-a6ca-f8f2d1474b6b"));
        OrderService sut = new OrderService(stub);


        var result = sut.placeOrder(
                new User("junhyunny", "ROLE_ADMIN"),
                new Order()
        );


        assertEquals(
                UUID.fromString("a1b3360b-687e-4491-a6ca-f8f2d1474b6b"),
                result
        );
    }
}
```

스파이는 특정 메소드의 동작 여부를 감시할 수 있는 객체이다. 단위 기능 내부에서 특정 메소드가 어떤 인수로 호출되었는지 확인할 수 있다. 단위 기능의 일부 동작을 검증할 때 사용한다.

```java
class SpyOrderRepository implements OrderRepository {

    int placeOrderCalledTimes;
    Order argumentPlaceOrder;

    @Override
    public UUID placeOrder(Order order) {
        placeOrderCalledTimes++;
        argumentPlaceOrder = order;
        return UUID.randomUUID();
    }

    @Override
    public Order findById(UUID id) {
        return null;
    }
}

public class SpyCaseTest {

    @Test
    void givenAdmin_whenPlaceOrder_thenCallPlaceOrderOfRepository() {
        SpyOrderRepository spy = new SpyOrderRepository();
        OrderService sut = new OrderService(spy);


        sut.placeOrder(
                new User("junhyunny", "ROLE_ADMIN"),
                new Order(1000)
        );


        assertEquals(
                1,
                spy.placeOrderCalledTimes
        );
        assertEquals(
                new Order(1000),
                spy.argumentPlaceOrder
        );
    }
}
```

목은 스파이와 스텁의 역할을 동시에 수행하는 객체를 의미한다. 스파이처럼 특정 행위에 대한 검증과 스텁처럼 준비된 응답을 반환하는 스펙트럼이 넓은 테스트 더블이다. 아래 예제 코드는 Mockito 라이브러리를 사용해 목 객체를 만들었다.

```java

public class MockCaseTest {

    @Test
    void givenAdmin_whenPlaceOrder_thenReturnOderId() {
        OrderRepository mock = Mockito.mock(OrderRepository.class);
        Mockito.when(
                mock.placeOrder(any())
        ).thenReturn(
                UUID.fromString("a1b3360b-687e-4491-a6ca-f8f2d1474b6b")
        );
        OrderService sut = new OrderService(mock);


        var result = sut.placeOrder(
                new User("junhyunny", "ROLE_ADMIN"),
                new Order()
        );


        assertEquals(
                UUID.fromString("a1b3360b-687e-4491-a6ca-f8f2d1474b6b"),
                result
        );
    }

    @Test
    void givenAdmin_whenPlaceOrder_thenCallPlaceOrderOfRepository() {
        OrderRepository mock = Mockito.mock(OrderRepository.class);
        OrderService sut = new OrderService(mock);


        sut.placeOrder(
                new User("junhyunny", "ROLE_ADMIN"),
                new Order(1000)
        );


        verify(mock, times(1))
                .placeOrder(new Order(1000));
    }
}
```


페이크는 실제 동작하는 구현 코드를 가지고 있어 실제 구현과 유사한 동작을 수행하는 테스트 더블이다. 하지만 실제 환경에서 사용할 수 없다. 아래 예시는 데이터베이스와 유사하게 동작하도록 HashMap 객체로 구현한 페이크이다. H2 인-메모리 데이터베이스도 대표적인 페이크다.

```java
class FakeOrderRepository implements OrderRepository {
    HashMap<UUID, Order> orders = new HashMap<>();

    @Override
    public UUID placeOrder(Order order) {
        return null;
    }

    @Override
    public Order findById(UUID id) {
        return orders.get(id);
    }
}

public class FakeCaseTest {

    @Test
    void givenOrderIsExisted_whenPlaceOrder_thenReturnOrder() {
        var orderId = UUID.fromString("a1b3360b-687e-4491-a6ca-f8f2d1474b6b");
        FakeOrderRepository fake = new FakeOrderRepository();
        fake.orders.put(
                orderId,
                new Order(orderId, 1000)
        );
        OrderService sut = new OrderService(fake);


        var result = sut.findById(orderId);


        assertEquals(
                new Order(orderId, 1000),
                result
        );
    }

    @Test
    void givenOrderIsNotExisted_whenPlaceOrder_thenThrowException() {
        var orderId = UUID.fromString("a1b3360b-687e-4491-a6ca-f8f2d1474b6b");
        FakeOrderRepository fake = new FakeOrderRepository();
        OrderService sut = new OrderService(fake);


        assertThrows(RuntimeException.class, () -> {
            sut.findById(orderId);
        });
    }
}
```

## CLOSING

테스트 더블에 관련된 글을 찾아보면 상태 기반 테스트(state base test)와 행위 기반 테스트(behavior base test)에 대한 이야기를 접한다. 두 테스트는 다음과 같은 차이점이 있다.

- 상태 기반 테스트(state base test) 
    - 시스템의 특정 작업이나 입력 후에 내부 상태가 예상대로 변경되었는지 확인한다.
- 행위 기반 테스트(behavior base test) 
    - 객체가 특정 동작을 수행했는지 확인한다.

스파이, 목은 행위 기반 테스트를 돕는다. 상태 기반 테스트는 시스템의 최종 상태를 검증하는 것이므로 목, 스텁, 페이크 등이 활용된다. 테스트 더블은 이론상 구분하지만, 여러 테스트 라이브러리의 활용 모습을 보면 그 경계가 모호하다. 실제로 마이크로소프트에선 다음과 같이 이야기한다.

> Although these types seem distinct in theory, the differences become more blurred in practice. For that reason, I think it makes sense to think of test doubles as inhabiting a continuum, as illustrated in Figure 2.
> 이러한 유형들은 이론적으로는 명확하게 구분되지만, 실제에서는 그 차이가 모호해지는 경우가 많습니다. 그래서 테스트 더블을 연속선 상에 존재하는 것으로 생각하는 것이 합리적이라고 봅니다. 이는 그림 2에서 설명하고 있습니다.

<div align="center">
    <img src="/images/posts/2024/test-double-06.png" width="50%" class="image__border">
</div>
<center>https://learn.microsoft.com/en-us/archive/msdn-magazine/2007/september/unit-testing-exploring-the-continuum-of-test-doubles</center>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-11-26-test-double>

#### REFERENCE

- <http://xunitpatterns.com/Test%20Double.html>
- <https://martinfowler.com/articles/mocksArentStubs.html>
- <https://www.crocus.co.kr/1555>
- <https://velog.io/@leeyoungwoozz/Test-Doubles>
- <https://kimkoungho.github.io/testing/test-double/>

[martinfowler-link]: https://martinfowler.com/articles/mocksArentStubs.html
