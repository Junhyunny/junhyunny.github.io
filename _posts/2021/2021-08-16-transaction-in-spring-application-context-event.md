---
title: "스프링 애플리케이션 컨텍스트 이벤트(Spring Application Context Event)와 트랜잭션(transaction)"
search: false
category:
  - spring-boot
last_modified_at: 2026-05-08T02:40:06+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [@Transactional 애너테이션의 전파 타입(PropagationType)][transactional-propagation-type-link]
- [스프링 애플리케이션 컨텍스트 이벤트(Spring Application Context Event)][spring-application-context-event-link]

## 0. 들어가면서

[스프링 애플리케이션 컨텍스트 이벤트(Spring Application Context Event)를 다룬 글][spring-application-context-event-link]에서 간단한 시나리오와 함께 스프링 프레임워크의 애플리케이션 컨텍스트 이벤트의 개념과 사용 방법을 알아보았다. 이번 글은 이전 글을 작성하면서 생긴 궁금증을 해소하기 위해 작성하였다. 이번 글에서 사용한 예제의 패키지 구조는 다음과 같다.

```
`-- action-in-blog
    |-- README.md
    |-- action-in-blog.iml
    |-- mvnw
    |-- mvnw.cmd
    |-- pom.xml
    `-- src
        |-- main
        |   |-- java
        |   |   `-- blog
        |   |       `-- in
        |   |           `-- action
        |   |               |-- ActionInBlogApplication.java
        |   |               |-- common
        |   |               |   `-- event
        |   |               |       |-- IntentionalExceptionEvent.java
        |   |               |       `-- IntentionalExceptionInRequiresNewTransactionEvent.java
        |   |               |-- delivery
        |   |               |   |-- entity
        |   |               |   |   `-- Delivery.java
        |   |               |   |-- repository
        |   |               |   |   `-- DeliveryRepository.java
        |   |               |   `-- service
        |   |               |       `-- DeliveryService.java
        |   |               `-- order
        |   |                   |-- entity
        |   |                   |   `-- Order.java
        |   |                   |-- listner
        |   |                   |   `-- OrderEventListener.java
        |   |                   |-- repository
        |   |                   |   `-- OrderRepository.java
        |   |                   `-- service
        |   |                       `-- OrderService.java
        |   `-- resources
        |       `-- application.yml
        `-- test
            `-- java
                `-- blog
                    `-- in
                        `-- action
                            `-- TransactionInEventTest.java
```

## 1. 전달한 이벤트까지 트랜잭션이 이어지는가?

전달한 이벤트까지 동일한 트랜잭션으로 처리할 수 있다. 간단한 테스트 코드로 확인해 보겠다. 비즈니스 로직을 담당하는 DeliveryService 클래스를 살펴보자.

1. 전달받은 파라미터인 배달 코드에 해당하는 배달 정보를 조회한다.
2. 배달 완료 여부를 변경한 후 업데이트한다.
3. 배달 정보와 관련된 주문 코드 정보를 `IntentionalExceptionEvent` 이벤트로 묶어서 발행한다.

```java
@Service
@Transactional
public class DeliveryService {

    // ...

    public void updateDeliveryComplete(String deliveryCode) {
        Optional<Delivery> optional = deliveryRepository.findByDeliveryCode(deliveryCode);
        if (optional.isEmpty()) {
            throw new RuntimeException(deliveryCode + " 코드에 해당하는 배송 정보가 없습니다.");
        }
        Delivery delivery = optional.get();
        delivery.setDeliveryEndTp("*");
        deliveryRepository.save(delivery);
        applicationContext.publishEvent(new IntentionalExceptionEvent(delivery.getOrder().getId(), deliveryCode));
    }
}
```

IntentionalExceptionEvent 클래스는 배달과 관련된 주문 정보와 배달 코드 정보를 담고 있다.

```java
package blog.in.action.common.event;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class IntentionalExceptionEvent {

    private long orderId;

    private String deliveryCode;

    public IntentionalExceptionEvent(long orderId, String deliveryCode) {
        this.orderId = orderId;
        this.deliveryCode = deliveryCode;
    }
}
```

이벤트를 수신하는 OrderEventListener 클래스는 다음과 같다. 주문 서비스에서 발생한 의도적인 예외(exception)가 배달 서비스로 전달되지 않도록 try-catch 구문으로 감싼다.

```java
@Log4j2
@Component
public class OrderEventListener {

    // ...

    @EventListener
    public void listenIntentionalExceptionEvent(IntentionalExceptionEvent event) {
        try {
            orderService.updateOrderDeliveryComplete(event.getOrderId(), event.getDeliveryCode());
        } catch (RuntimeException runtimeException) {
            log.warn(runtimeException.getMessage(), runtimeException);
        }
    }
}
```

주문 도메인의 비즈니스 로직을 담당하는 OrderService 클래스를 살펴보자. RuntimeException을 의도적으로 던진다.

```java
@Component
@Transactional
public class OrderService {

    // ...

    public void updateOrderDeliveryComplete(long orderId, String deliveryCode) {
        Optional<Order> optional = orderRepository.findById(orderId);
        if (optional.isPresent()) {
            throw new RuntimeException(deliveryCode + " 배송 코드에 해당하는 주문 정보가 존재합니다.");
        }
    }
}
```

OrderService 객체에서 발생한 의도적인 런타임 예외로 인해 트랜잭션 처리가 어떻게 되는지 테스트 코드로 알아보자.

- 배달 서비스를 이용해 특정 배달 코드에 해당하는 배달 정보를 완료 처리한다.
- 내부에서 rollback 처리가 수행되므로 배달 완료 여부가 `NULL`일 것으로 예상한다.

```java
@SpringBootTest
public class TransactionInEventTest {

    // ...

    @Test
    public void test_updateDeliveryComplete_rollbackDeliveryEndTp() {
        assertThrows(UnexpectedRollbackException.class, () -> deliveryService.updateDeliveryComplete(DELIVERY_CODE));
        Optional<Delivery> deliveryOptional = deliveryRepository.findByDeliveryCode(DELIVERY_CODE);
        assertThat(deliveryOptional).isNotEmpty();
        assertThat(deliveryOptional.get().getDeliveryEndTp()).isNull();
    }
}
```

위 테스트 코드는 정상적으로 통과한다.

<div align="left">
  <img src="{{ site.image_url_2021 }}/transaction-in-spring-application-context-event-01.png" width="50%">
</div>

<br/>

실제로 데이터베이스가 롤백(rollback)되었는지 SQL을 통해 확인할 수 있다.

```sql
SELECT *
FROM tb_order o
INNER JOIN tb_delivery d ON o.id = d.order_id;
```

트랜잭션 내에서 발생한 모든 작업이 롤백되어 배달 완료 여부가 아직 `NULL` 값임을 확인할 수 있다.

<div align="left">
  <img src="{{ site.image_url_2021 }}/transaction-in-spring-application-context-event-02.png" width="70%">
</div>

이벤트 리스너(event listener)에서 주문 서비스의 예외를 try-catch 구문으로 묶었음에도 테스트 코드에서 UnexpectedRollbackException 예외가 발생한다. 이유는 다음과 같다.

1. updateOrderDeliveryComplete 메서드까지 배달 서비스의 트랜잭션이 연결된다.
2. updateOrderDeliveryComplete 메서드에서 예외(exception)가 발생하면서 해당 트랜잭션에 대한 롤백(rollback)이 결정된다.
3. listenIntentionalExceptionEvent 메서드에서 try-catch 구문으로 묶어 주문 서비스에서 발생한 예외가 배달 서비스로 전파되지는 않는다.
4. updateDeliveryComplete 메서드에서 정상적인 트랜잭션 처리가 실패한다. 주문 서비스에서 발생한 예외에 의해 해당 트랜잭션의 롤백 처리가 예정되어 있기 때문이다. UnexpectedRollbackException 예외가 발생한다.

## 2. 전달한 이벤트를 별도 트랜잭션으로 처리할 수 있는가?

전달한 이벤트를 별도의 트랜잭션으로 처리할 수 있다. 해당 주제도 간단한 테스트 코드로 확인해 보자.

1. 전달받은 파라미터인 배달 코드에 해당하는 배달 정보를 조회한다.
2. 배달 완료 여부를 변경한 후 업데이트한다.
3. 배달 정보와 관련된 주문 코드 정보를 `IntentionalExceptionInRequiresNewTransactionEvent` 이벤트로 묶어서 발행한다.

```java
@Service
@Transactional
public class DeliveryService {

    // ...

    public void updateDeliveryCompleteInRequiresNewTransaction(String deliveryCode) {
        Optional<Delivery> optional = deliveryRepository.findByDeliveryCode(deliveryCode);
        if (optional.isEmpty()) {
            throw new RuntimeException(deliveryCode + " 코드에 해당하는 배송 정보가 없습니다.");
        }
        Delivery delivery = optional.get();
        delivery.setDeliveryEndTp("*");
        deliveryRepository.save(delivery);
        applicationContext.publishEvent(new IntentionalExceptionInRequiresNewTransactionEvent(delivery.getOrder().getId(), deliveryCode));
    }
}
```

IntentionalExceptionInRequiresNewTransactionEvent 클래스를 살펴보자. 이전 예제의 이벤트 리스너가 아닌 다른 이벤트 리스너에서 이벤트를 수신하도록 새로운 객체 타입을 정의했다. 이전과 동일하게 배달과 관련된 주문 정보와 배달 코드 정보를 담고 있다.

```java
package blog.in.action.common.event;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class IntentionalExceptionInRequiresNewTransactionEvent {

    private long orderId;

    private String deliveryCode;

    public IntentionalExceptionInRequiresNewTransactionEvent(long orderId, String deliveryCode) {
        this.orderId = orderId;
        this.deliveryCode = deliveryCode;
    }
}
```

OrderEventListener 클래스를 살펴보자. 새로운 이벤트 리스너를 정의한다. 이전과 동일하게 주문 서비스에서 발생한 의도적인 예외가 배달 서비스로 전달되지 않도록 try-catch 구문으로 감싼다.

```java
@Log4j2
@Component
public class OrderEventListener {

    // ...

    @EventListener
    public void listenIntentionalExceptionInRequiresNewEvent(IntentionalExceptionInRequiresNewTransactionEvent event) {
        try {
            orderService.updateOrderDeliveryCompleteInRequiresNewTransaction(event.getOrderId(), event.getDeliveryCode());
        } catch (RuntimeException runtimeException) {
            log.warn(runtimeException.getMessage(), runtimeException);
        }
    }
}
```

마지막으로 비즈니스 로직을 수행하는 OrderService 클래스 코드를 살펴보자. 이전과 마찬가지로 RuntimeException을 의도적으로 던지지만, 해당 메서드에 @Transactional 애너테이션을 추가하여 트랜잭션 전파(propagation) 타입을 변경한다.

- `Propagation.REQUIRES_NEW` 트랜잭션 전파 타입을 사용한다. 이 전파 타입은 새로운 트랜잭션을 만들고, 진행 중인 트랜잭션이 있다면 이를 일시 중단한다.

```java
@Component
@Transactional
public class OrderService {

    // ...

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateOrderDeliveryCompleteInRequiresNewTransaction(long orderId, String deliveryCode) {
        Optional<Order> optional = orderRepository.findById(orderId);
        if (optional.isPresent()) {
            throw new RuntimeException(deliveryCode + " 배송 코드에 해당하는 주문 정보가 존재합니다.");
        }
    }
}
```

이전과 마찬가지로 OrderService 객체에서 발생한 의도적인 런타임 예외로 인해 트랜잭션 처리가 어떻게 되는지 테스트 코드로 알아보자.

- 배달 서비스를 이용해 특정 배달 코드에 해당하는 배달 정보를 완료 처리한다.
- 주문 서비스에서 별도 트랜잭션을 생성하여 예외(exception)를 던졌기 때문에 배달 정보는 롤백되지 않는다. 배달 정보의 완료 여부가 `*`로 표시될 것으로 예상한다.

```java
@SpringBootTest
public class TransactionInEventTest {

    // ...

    @Test
    public void test_updateDeliveryComplete_doNotRollbackDeliveryEndTp() {
        deliveryService.updateDeliveryCompleteInRequiresNewTransaction(DELIVERY_CODE);
        Optional<Delivery> deliveryOptional = deliveryRepository.findByDeliveryCode(DELIVERY_CODE);
        assertThat(deliveryOptional).isNotEmpty();
        assertThat(deliveryOptional.get().getDeliveryEndTp()).isEqualTo("*");
    }
}
```

위 테스트 코드는 정상적으로 통과한다.

<div align="left">
  <img src="{{ site.image_url_2021 }}/transaction-in-spring-application-context-event-03.png" width="50%">
</div>

<br/>

실제로 데이터베이스가 롤백되지 않고 저장되었는지 SQL을 통해 확인할 수 있다.

```sql
SELECT *
FROM tb_order o
INNER JOIN tb_delivery d ON o.id = d.order_id;
```

새로 만들어진 트랜잭션 내에서 발생한 작업만 롤백되었기 때문에 배달 완료 여부가 `*` 값임을 확인할 수 있다.

<div align="left">
  <img src="{{ site.image_url_2021 }}/transaction-in-spring-application-context-event-04.png" width="70%">
</div>

<br/>

동일 트랜잭션으로 묶어서 처리할 때와 다르게 UnexpectedRollbackException 예외가 발생하지 않았다. 이유는 다음과 같다.

1. updateOrderDeliveryCompleteInRequiresNewTransaction 메서드에서 신규 트랜잭션을 생성하여 배달 서비스의 트랜잭션을 잠시 중단한다.
2. updateOrderDeliveryCompleteInRequiresNewTransaction 메서드에서 예외가 발생하여 신규 트랜잭션에 대한 롤백이 결정된다.
3. listenIntentionalExceptionInRequiresNewEvent 메서드에서 try-catch 구문에 의해 주문 서비스에서 발생한 예외가 배달 서비스로 전파되지 않는다.
4. 주문 서비스에서 발생한 예외는 새로 생성된 트랜잭션에만 영향을 미치기 때문에 updateDeliveryComplete 메서드는 정상적으로 처리된다.

## CLOSING

이벤트 발생과 더불어 트랜잭션 처리까지 함께 정리해 보는 시간이었다. 관련된 내용을 글로 정리하다 보니 벌써 새벽 4시가 되었다. 자고 일어나서 비동기 이벤트 처리 방법을 정리해야겠다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-08-16-transaction-in-spring-application-context-event>

#### REFERENCE

- <https://junhyunny.blogspot.com/2020/02/spring-applicationcontext-event.html>
- <https://junhyunny.github.io/spring-boot/jpa/junit/transactional-propagation-type/>
- <https://junhyunny.github.io/spring-boot/spring-application-context-event/>

[spring-application-context-event-link]: https://junhyunny.github.io/spring-boot/spring-application-context-event/
[transactional-propagation-type-link]: https://junhyunny.github.io/spring-boot/jpa/junit/transactional-propagation-type/
