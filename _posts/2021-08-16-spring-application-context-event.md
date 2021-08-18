---
title: "Spring Application Context Event"
search: false
category:
  - spring-boot
last_modified_at: 2021-08-16T12:45:00
---

<br>

새로운 기능 추가를 해야하는데 문제가 생겼습니다. 
공통 비즈니스 로직(business logic) 패키지(package)에서 다른 비즈니스 로직 패키지에 위치한 기능이 필요한 상황이 발생하였습니다. 

<p align="center"><img src="/images/spring-application-context-event-1.JPG" width="30%"></p>
<center>이미지 출처, https://giphy.com/gifs/lego-lego-reactions-l4FGzF4Z2lKktzjHi</center><br>

비즈니스적으로 독립적인 기능들을 패키지 단위로 나눈 설계를 생각하면 개발자를 매우 피곤하게 만드는 기능이 아닐 수 없습니다. 
패키지를 넘나들며 시스템 모듈 간에 결합도를 높이는 기능은 추후에 시스템 규모가 커짐에 따른 MSA(마이크로 서비스 아키텍처) 전환 작업에 어려움을 줄 수도 있습니다. 
독립적인 비즈니스 단위로 설계된 패키지 구조에서 다른 패키지의 기능을 사용할 방법을 궁리하다가 `Spring Application Context Event` 기능을 사용하기로 결정하였습니다. 

다음과 같은 이유로 `Spring Application Context Event` 기능을 사용하였습니다. 
- Spring 프레임워크에서 손쉽게 사용할 수 있도록 기능 제공 
- 패키지 단위로 독립적으로 수행 가능
- 혹시 모르는 MSA 전환에서 API Call, Message Queue 등 다른 기술 스택으로 대체 가능(아래 이미지 참조)

<p align="center"><img src="/images/spring-application-context-event-2.JPG" width="100%"></p>

## 예제 코드

간단한 예제 코드를 통해 `Spring Application Context Event` 기능을 정리해보겠습니다. 
테스트 시나리오는 다음과 같습니다.
- 배달(delivery) 서비스에서 특정 배달 정보들 완료시킵니다.
- 주문-배달 완료 이벤트를 발행합니다. 
- 주문-배달 완료 이벤트를 구독한 후 주문(order) 서비스를 통해 해당 주문 상태를 배달 완료 상태로 변경합니다.

### 패키지 구조

```
./
`-- action-in-blog-back
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
        |   |               |       `-- OrderDeliveryCompleteEvent.java
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
                            `-- delivery
                                `-- service
                                    `-- DeliveryServiceTest.java
```

### application.yml
- 테스트를 위한 로컬 데이터베이스를 사용합니다.

```yml
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/test?characterEncoding=UTF-8&serverTimezone=UTC
    username: root
    password: 1234
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    show-sql: true
    database-platform: org.hibernate.dialect.MySQL5InnoDBDialect
    hibernate:
      ddl-auto: update
```

### DeliveryService 클래스
- 특정 배달 코드에 해당하는 배달 정보를 완료 처리합니다.
- 해당 배달과 연관된 주문(Order) ID와 배달 코드를 담은 주문-배달 완료 이벤트(OrderDeliveryCompleteEvent)를 발행합니다.

```java
package blog.in.action.delivery.service;

import blog.in.action.common.event.OrderDeliveryCompleteEvent;
import blog.in.action.delivery.entity.Delivery;
import blog.in.action.delivery.repository.DeliveryRepository;
import java.util.Optional;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DeliveryService {

    private final ApplicationContext applicationContext;

    private final DeliveryRepository deliveryRepository;

    public DeliveryService(ApplicationContext applicationContext, DeliveryRepository deliveryRepository) {
        this.applicationContext = applicationContext;
        this.deliveryRepository = deliveryRepository;
    }

    public void updateDeliveryComplete(String deliveryCode) {
        Optional<Delivery> optional = deliveryRepository.findByDeliveryCode(deliveryCode);
        if (optional.isEmpty()) {
            throw new RuntimeException(deliveryCode + " 코드에 해당하는 배송 정보가 없습니다.");
        }
        Delivery delivery = optional.get();
        delivery.setDeliveryEndTp("*");
        deliveryRepository.save(delivery);
        applicationContext.publishEvent(new OrderDeliveryCompleteEvent(delivery.getOrder().getId(), deliveryCode));
    }
}
```

### OrderDeliveryCompleteEvent 클래스
- 주문 정보와 배달 정보를 담은 주문-배달 완료 이벤트입니다.

```java
package blog.in.action.common.event;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class OrderDeliveryCompleteEvent {

    private long orderId;

    private String deliveryCode;

    public OrderDeliveryCompleteEvent(long orderId, String deliveryCode) {
        this.orderId = orderId;
        this.deliveryCode = deliveryCode;
    }
}
```

### OrderEventListener 클래스
- 주문-배달 완료 이벤트를 수신한 후 관련된 정보를 주문 서비스에게 전달합니다.

```java
package blog.in.action.order.listner;

import blog.in.action.common.event.OrderDeliveryCompleteEvent;
import blog.in.action.order.service.OrderService;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class OrderEventListener {

    private final OrderService orderService;

    public OrderEventListener(OrderService orderService) {
        this.orderService = orderService;
    }

    @EventListener
    public void listenOrderDeliveryCompleteEvent(OrderDeliveryCompleteEvent orderDeliveryCompleteEvent) {
        orderService.updateOrderDeliveryComplete(orderDeliveryCompleteEvent.getOrderId(), orderDeliveryCompleteEvent.getDeliveryCode());
    }
}
```

### OrderService 클래스
- 주문 정보를 조회하여 주문 상태를 `DELIVERY_COMPLETE`로 변경합니다.

```java
package blog.in.action.order.service;

import blog.in.action.order.entity.Order;
import blog.in.action.order.repository.OrderRepository;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public void updateOrderDeliveryComplete(long orderId, String deliveryCode) {
        Optional<Order> optional = orderRepository.findById(orderId);
        if (optional.isEmpty()) {
            throw new RuntimeException(deliveryCode + " 배송 코드에 해당하는 주문 정보가 없습니다.");
        }
        Order order = optional.get();
        order.setOrderState("DELIVERY_COMPLETE");
        orderRepository.save(order);
    }
}
```

### 테스트 코드
- `DELIVERY_CODE` 코드를 가진 배달 정보를 배달 완료 상태로 업데이트합니다.
- `ORDER_CODE` 코드를 가진 주문 정보가 `배달 완료(DELIVERY_COMPLETE)` 상태가 되었는지 확인합니다.

```java
package blog.in.action.delivery.service;

import static org.assertj.core.api.Assertions.assertThat;
import blog.in.action.delivery.entity.Delivery;
import blog.in.action.delivery.repository.DeliveryRepository;
import blog.in.action.order.entity.Order;
import blog.in.action.order.repository.OrderRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class DeliveryServiceTest {

    private static String DELIVERY_CODE = "DELIVERY_CODE";

    private static String ORDER_CODE = "ORDER_CODE";

    private static String DELIVERY_COMPLETE = "DELIVERY_COMPLETE";

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DeliveryService deliveryService;

    @BeforeEach
    public void beforeEach() {
        deliveryRepository.deleteAll();
        orderRepository.deleteAll();
        Order order = new Order(ORDER_CODE);
        orderRepository.save(order);
        Delivery delivery = new Delivery(DELIVERY_CODE, order);
        deliveryRepository.save(delivery);
    }

    @Test
    public void test_updateDeliveryComplete_changeOrderState() {
        deliveryService.updateDeliveryComplete(DELIVERY_CODE);
        Optional<Order> optional = orderRepository.findByOrderCode(ORDER_CODE);
        assertThat(optional).isNotEmpty();
        assertThat(optional.get().getOrderState()).isEqualTo(DELIVERY_COMPLETE);
    }
}
```

### 테스트 결과 - Junit

<p align="left"><img src="/images/spring-application-context-event-3.JPG" width="45%"></p>

### 테스트 결과 - SQL

```sql
SELECT *
FROM tb_order o
INNER JOIN tb_delivery d ON o.id = d.order_id;
```

<p align="left"><img src="/images/spring-application-context-event-4.JPG" width="65%"></p>

## OPINION
주문, 배달 관련된 도메인을 직접 경험해보지는 않아서 테스트 시나리오가 좋지 않을 수 있습니다.(양해 부탁드립니다.😓) 
기능을 정리하다보니 몇 가지 궁금한 사항들이 생겼습니다. 
- 비동기(async) 방식의 이벤트 처리는 어떻게 수행하는가?
- 전달한 이벤트까지 트랜잭션이 이어지는가?
- 전달한 이벤트를 별도의 다른 트랜잭션으로 처리가 가능한가?

다음 포스트 주제로 궁금한 사항과 관련된 내용들을 확인해보고 정리해야겠습니다.

👉 관련된 내용을 정리했어요.
- [Spring Application Context Event - 트랜잭션 처리][transaction-in-spring-application-context-event-link]
- [Spring Application Context Event - 비동기 처리][async-in-spring-application-context-event-link]

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action>

#### REFERENCE
- <https://junhyunny.blogspot.com/2020/02/spring-applicationcontext-event.html>


[transaction-in-spring-application-context-event-link]: https://junhyunny.github.io/spring-boot/transaction-in-spring-application-context-event/
[async-in-spring-application-context-event-link]: https://junhyunny.github.io/spring-boot/async-in-spring-application-context-event/