---
title: "스프링 애플리케이션 컨텍스트 비동기 이벤트 (Application Context Async Event)"
search: false
category:
  - spring-boot
last_modified_at: 2026-02-11T12:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Spring Application Context Event][spring-application-context-event-link]
- [Spring Application Context Event with Transaction][transaction-in-spring-application-context-event-link]

## 0. 들어가면서

[Spring Application Context Event][spring-application-context-event-link] 글을 작성하면서 생긴 궁금증을 주제로 글을 작성했다. 이번 글은 비동기 처리 방법에 대해서 정리했다. 아래 두 가지를 확인해보기 위한 예제 코드를 작성했다.

- 비동기 처리 구현 방법
- 비동기 처리 시 트랜잭션 연결

## 1. 구현 방법

구현은 두 개의 애너테이션을 통해 손쉽게 구현 가능하다. 아래 예제 코드에서 확인 가능하다.

- @EnableAsync - 애플리케이션을 실행시키는 클래스 위에 선언
- @Async - 이벤트를 수신하는 메서드 위에 선언

## 2. 비동기 처리 시 트랜잭션 연결

비동기 이벤트 처리 시 트랜잭션이 어떻게 연결되는지 궁금하였다. [Spring Application Context Event with Transaction][transaction-in-spring-application-context-event-link]에서 확인할 수 있듯이 일반적인 이벤트 발행은 트랜잭션이 연결된다. 비동기 이벤트 처리에서 만약 일반적인 이벤트 발행처럼 트랜잭션이 연결된다면 아래와 같은 이상한 상황이 벌어질 수 있다.

1. 이벤트를 처리하는 다른 스레드의 수행 결과에 따라 트랜잭션의 커밋(commit), 롤백(rollback) 여부가 결정된다.
2. 이벤트를 발행한 메인 스레드는 자신의 일을 모두 끝냈지만 이벤트의 처리 결과를 기다려야 한다.
3. 이벤트 처리 결과에 따라 대기 중인 메인 스레드의 커밋(commit), 롤백(rollback)이 결정된다.

당연히 트랜잭션이 나뉘어질 것이라고 예상되지만 정확한 결과는 테스트를 통해 확인해보도록 하자. 예제 시나리오는 [Spring Application Context Event with Transaction][transaction-in-spring-application-context-event-link]글의 내용과 동일하다.

ActionInBlogApplication 클래스에 @EnableAsync 애너테이션을 추가한다.

```java
package blog.in.action;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class ActionInBlogApplication {

    public static void main(String[] args) {
        SpringApplication.run(ActionInBlogApplication.class, args);
    }
}
```

DeliveryService 클래스에서 배달 완료 여부를 업데이트한다. 주문에 대한 업데이트 요청을 비동기 이벤트로 실시한다. 비동기 여부를 확인하기 위해 AsyncEvent 이벤트 발행 전, 후 로그를 출력한다.

```java
package blog.in.action.delivery.service;

import blog.in.action.common.event.AsyncEvent;
import blog.in.action.delivery.entity.Delivery;
import blog.in.action.delivery.repository.DeliveryRepository;
import java.util.Optional;
import lombok.extern.log4j.Log4j2;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Log4j2
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
        log.info("비동기 이벤트 발행 전");
        applicationContext.publishEvent(new AsyncEvent(delivery.getOrder().getId(), deliveryCode));
        log.info("비동기 이벤트 발행 후");
    }
}
```

OrderEventListener 클래스의 listenAsyncEvent 메서드에 @Async 애너테이션을 추가한다. 비동기 처리이기 때문에 다른 스레드의 콜 스택에서 동작하고, try-catch 구문으로 묶지 않아도 주문 서비스에서 발생시킨 예외가 배달 서비스로 이어지지 않는 것으로 예상한다.

```java
package blog.in.action.order.listner;

import blog.in.action.common.event.AsyncEvent;
import blog.in.action.order.service.OrderService;
import lombok.extern.log4j.Log4j2;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Log4j2
@Component
public class OrderEventListener {

    private final OrderService orderService;

    public OrderEventListener(OrderService orderService) {
        this.orderService = orderService;
    }

    @Async
    @EventListener
    public void listenAsyncEvent(AsyncEvent event) {
        log.info("비동기 이벤트 수신");
        orderService.updateOrderDeliveryComplete(event.getOrderId(), event.getDeliveryCode());
    }
}
```

OrderService 클래스에선 이전 포스트와 마찬가지로 조회 후 의도적인 예외를 발생시킨다.

```java
package blog.in.action.order.service;

import blog.in.action.order.entity.Order;
import blog.in.action.order.repository.OrderRepository;
import java.util.Optional;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Log4j2
@Component
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public void updateOrderDeliveryComplete(long orderId, String deliveryCode) {
        Optional<Order> optional = orderRepository.findById(orderId);
        if (optional.isPresent()) {
            throw new RuntimeException(deliveryCode + " 배송 코드에 해당하는 주문 정보가 존재합니다.");
        }
    }
}
```

## 3. 테스트 코드

다음과 같은 테스트 코드를 작성한다. 별도 트랜잭션으로 관리되어 배달 정보에 대한 업데이트가 롤백되지 않는 것을 기ㅏ대한다.

1. 배달 정보를 완료 처리 후 비동기 처리가 끝날 때까지 잠시 메인 스레드를 멈춘다.
2. 주문 서비스에서 예외가 발생하지만 별도 트랜잭션이 나눠지므로 배달 정보는 완료 처리된다.

```java
package blog.in.action;

import static org.assertj.core.api.Assertions.assertThat;
import blog.in.action.delivery.entity.Delivery;
import blog.in.action.delivery.repository.DeliveryRepository;
import blog.in.action.delivery.service.DeliveryService;
import blog.in.action.order.entity.Order;
import blog.in.action.order.repository.OrderRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class TransactionInEventTest {

    private static String DELIVERY_CODE = "DELIVERY_CODE";

    private static String ORDER_CODE = "ORDER_CODE";

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
    public void test_updateDeliveryComplete_doNotRollback() throws InterruptedException {
        // [1]
        deliveryService.updateDeliveryComplete(DELIVERY_CODE);
        Thread.sleep(1000);
        
        // [2]
        Optional<Delivery> deliveryOptional = deliveryRepository.findByDeliveryCode(DELIVERY_CODE);
        assertThat(deliveryOptional).isNotEmpty();
        assertThat(deliveryOptional.get().getDeliveryEndTp()).isEqualTo("*");
    }
}
```

테스트는 정상적으로 통과한다. 이를 통해 메인 스레드에서 처리한 배달 정보는 롤백이 되지 않았음을 확인할 수 있다. 테스트 수행 로그를 살펴보자.

- 비동기 이벤트 발행 전 > 비동기 이벤트 발행 후 > 비동기 이벤트 수신 순으로 로그가 출력되었다.
- 이벤트를 발행한 메인 스레드는 계속 진행되고 별도의 스레드가 이벤트 처리를 수행하였음을 알 수 있다.

```
2021-08-17 01:11:31.105  INFO 5628 --- [           main] b.i.a.delivery.service.DeliveryService   : 비동기 이벤트 발행 전
2021-08-17 01:11:31.105  INFO 5628 --- [           main] b.i.a.delivery.service.DeliveryService   : 비동기 이벤트 발행 후
Hibernate: update tb_delivery set delivery_code=?, delivery_end_tp=?, order_id=? where id=?
2021-08-17 01:11:31.105  INFO 5628 --- [         task-1] b.i.a.order.listner.OrderEventListener   : 비동기 이벤트 수신
Hibernate: select order0_.id as id1_1_0_, order0_.order_code as order_co2_1_0_, order0_.order_state as order_st3_1_0_ from tb_order order0_ where order0_.id=?
2021-08-17 01:11:31.121 ERROR 5628 --- [         task-1] .a.i.SimpleAsyncUncaughtExceptionHandler : Unexpected exception occurred invoking async method: public void blog.in.action.order.listner.OrderEventListener.listenAsyncEvent(blog.in.action.common.event.AsyncEvent)

java.lang.RuntimeException: DELIVERY_CODE 배송 코드에 해당하는 주문 정보가 존재합니다.
    at blog.in.action.order.service.OrderService.updateOrderDeliveryComplete(OrderService.java:24) ~[classes/:na]
    at blog.in.action.order.service.OrderService$$FastClassBySpringCGLIB$$793adfdb.invoke(<generated>) ~[classes/:na]
    at org.springframework.cglib.proxy.MethodProxy.invoke(MethodProxy.java:218) ~[spring-core-5.2.4.RELEASE.jar:5.2.4.RELEASE]
    at org.springframework.aop.framework.CglibAopProxy$CglibMethodInvocation.invokeJoinpoint(CglibAopProxy.java:769) ~[spring-aop-5.2.4.RELEASE.jar:5.2.4.RELEASE]
    at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:163) ~[spring-aop-5.2.4.RELEASE.jar:5.2.4.RELEASE]
    ...
```

실제로 테스트 코드의 트랜잭션이 모두 마무리 된 후 데이터베이스에서 배달 완료 여부가 롤백되지 않은 것을 확인할 수 있다

```sql
SELECT *
FROM tb_order o
INNER JOIN tb_delivery d ON o.id = d.order_id;
```

<div align="center">
  <img src="/images/posts/2021/async-spring-application-context-event-01.png" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-08-17-async-in-spring-application-context-event>

#### REFERENCE

- <https://www.baeldung.com/spring-events>
- <https://junhyunny.github.io/spring-boot/jpa/junit/transactional-propagation-type/>
- <https://junhyunny.github.io/spring-boot/spring-application-context-event/>
- <https://junhyunny.github.io/spring-boot/transaction-in-spring-application-context-event/>

[spring-application-context-event-link]: https://junhyunny.github.io/spring-boot/spring-application-context-event/
[transaction-in-spring-application-context-event-link]: https://junhyunny.github.io/spring-boot/transaction-in-spring-application-context-event/