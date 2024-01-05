---
title: "Spring Application Context Event with Transaction"
search: false
category:
  - spring-boot
last_modified_at: 2021-08-16T03:00:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Propagation in @Transactional Annotation][transactional-propagation-type-link]
- [Spring Application Context Event][spring-application-context-event-link]

## 0. 들어가면서

[Spring Application Context Event][spring-application-context-event-link] 포스트에서 간단한 시나리오와 함께 `Spring Application Context Event` 사용 방법에 대해 알아보았습니다. 
이전 포스트를 작성하면서 생겼던 궁금증을 해소하기 위해 작성하였습니다. 

## 1. 패키지 구조

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

## 2. `'전달한 이벤트까지 트랜잭션이 이어지는가?'` 테스트 코드
전달한 이벤트까지 동일한 트랜잭션으로 처리가 가능합니다. 
간단한 테스트 코드를 통해 확인해보겠습니다. 

### 2.1. DeliveryService 클래스
- 전달받은 파라미터인 배달 코드에 해당하는 배달 정보를 조회합니다.
- 배달 완료 여부를 변경한 후 업데이트합니다.
- 배달 정보와 관련된 주문 코드 정보를 `IntentionalExceptionEvent` 이벤트로 묶어서 발행합니다.

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

### 2.2. IntentionalExceptionEvent 클래스
- 배달과 관련된 주문 정보와 배달 코드 정보를 담고 있습니다.

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

### 2.3. OrderEventListener 클래스
- 주문 서비스에서 발생한 의도적인 예외(exception)가 배달 서비스로 전달되지 않도록 try-catch 구문으로 감쌉니다.

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

### 2.4. OrderService 클래스
- RuntimeException을 의도적으로 던집니다.

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

### 2.5. 테스트 코드
- 배달 서비스를 이용해 특정 배달 코드에 해당하는 배달 정보를 완료 처리합니다.
- 내부에서 rollback 처리가 수행되므로 배달 완료 여부가 `NULL` 일 것으로 예상합니다.

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

##### 테스트 결과 - Junit

<p align="left"><img src="/images/transaction-in-spring-application-context-event-1.JPG" width="45%"></p>

##### 테스트 결과 - SQL

```sql
SELECT *
FROM tb_order o
INNER JOIN tb_delivery d ON o.id = d.order_id;
```

<p align="left"><img src="/images/transaction-in-spring-application-context-event-2.JPG" width="65%"></p>

#### 2.5.1. UnexpectedRollbackException 발생 이유
이벤트 리스너(event listener)에서 주문 서비스의 예외를 try-catch 구문으로 묶었음에도 불구하고 테스트 코드에서 UnexpectedRollbackException 예외가 발생합니다. 
해당 이유는 다음과 같습니다. 
1. updateOrderDeliveryComplete 메소드까지 배달 서비스의 트랜잭션이 연결됩니다.
1. updateOrderDeliveryComplete 메소드에서 exception이 발생하면서 해당 트랜잭션에 대한 롤백(rollback)이 결정됩니다.
1. listenIntentionalExceptionEvent 메소드에서 try-catch 구문으로 묶어 주문 서비스에서 발생한 예외가 배달 서비스로 전파되지는 않습니다.
1. updateDeliveryComplete 메소드는 정상적인 트랜잭션 처리에 실패합니다.
    - 주문 서비스에서 발생한 예외에 의해 해당 트랜잭션의 롤백 처리가 예정되어 있기 때문입니다.
1. UnexpectedRollbackException 예외가 발생합니다.

## 3. `'전달한 이벤트를 별도의 다른 트랜잭션으로 처리가 가능한가?'` 테스트 코드
전달한 이벤트를 별도의 트랜잭션으로 처리가 가능합니다. 
해당 주제도 간단한 테스트 코드를 통해 확인해보겠습니다. 

### 3.1. DeliveryService 클래스
- 전달받은 파라미터인 배달 코드에 해당하는 배달 정보를 조회합니다.
- 배달 완료 여부를 변경한 후 업데이트합니다.
- 배달 정보와 관련된 주문 코드 정보를 `IntentionalExceptionInRequiresNewTransactionEvent` 이벤트로 묶어서 발행합니다.

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

### 3.2. IntentionalExceptionInRequiresNewTransactionEvent 클래스
- 배달과 관련된 주문 정보와 배달 코드 정보를 담고 있습니다.

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

### 3.3. OrderEventListener 클래스
- 주문 서비스에서 발생한 의도적인 예외(exception)가 배달 서비스로 전달되지 않도록 try-catch 구문으로 감쌉니다.

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

### 3.4. OrderService 클래스
- 메소드 위에 @Transactional 애너테이션을 추가하여 전파(propagtion) 타입을 변경합니다.
    - `Propagation.REQUIRES_NEW` - 새로운 트랜잭션을 만듭니다. 진행 중인 트랜잭션이 있다면 이를 일시 중단합니다.
- RuntimeException을 의도적으로 던집니다.

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

### 3.5. 테스트 코드
- 배달 서비스를 이용해 특정 배달 코드에 해당하는 배달 정보를 완료 처리합니다.
- 주문 서비스에서 별도 트랜잭션을 생성하여 예외(exception)를 던졌기 때문에 배달 정보는 롤백되지 않습니다.
- 배달 정보의 완료 여부가 `*` 표시되어 있을 것으로 예상합니다.

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

##### 테스트 결과 - Junit

<p align="left"><img src="/images/transaction-in-spring-application-context-event-3.JPG" width="45%"></p>

##### 테스트 결과 - SQL

```sql
SELECT *
FROM tb_order o
INNER JOIN tb_delivery d ON o.id = d.order_id;
```

<p align="left"><img src="/images/transaction-in-spring-application-context-event-4.JPG" width="65%"></p>

#### 3.5.1. UnexpectedRollbackException 발생하지 않은 이유
동일 트랜잭션으로 묶어서 처리하는 것과 다르게 UnexpectedRollbackException 예외가 발생하지 않았습니다. 
해당 이유는 다음과 같습니다. 
1. updateOrderDeliveryCompleteInRequiresNewTransaction 메소드에서 신규 트랜잭션을 생성하여 배달 서비스의 트랜잭션을 잠시 중단합니다.
1. updateOrderDeliveryCompleteInRequiresNewTransaction 메소드에서 예외가 발생하여 신규 트랜잭션에 대한 롤백(rollback)이 결정됩니다.
1. listenIntentionalExceptionInRequiresNewEvent 메소드에서 try-catch 에 의해 주문 서비스에서 발생한 예외가 배달 서비스로 전파되지 않습니다.
1. 주문 서비스에서 발생한 예외는 새로 생성된 트랜잭션에만 영향을 미치기 때문에 updateDeliveryComplete 메소드는 정상적으로 처리됩니다.

## CLOSING
이벤트 발생과 더불어 트랜잭션 처리까지 함께 정리해보는 시간이었습니다. 
관련된 포스트를 연달아 작성하다보니 벌써 새벽 4시가 되었습니다. 
자고 일어나서 비동기 이벤트 처리 방법에 대해서 정리해봐야겠습니다.

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-08-16-transaction-in-spring-application-context-event>

#### REFERENCE
- <https://junhyunny.blogspot.com/2020/02/spring-applicationcontext-event.html>
- <https://junhyunny.github.io/spring-boot/jpa/junit/transactional-propagation-type/>
- <https://junhyunny.github.io/spring-boot/spring-application-context-event/>

[spring-application-context-event-link]: https://junhyunny.github.io/spring-boot/spring-application-context-event/
[transactional-propagation-type-link]: https://junhyunny.github.io/spring-boot/jpa/junit/transactional-propagation-type/