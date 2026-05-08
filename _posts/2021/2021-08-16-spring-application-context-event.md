---
title: "스프링 애플리케이션 컨텍스트 이벤트(Spring Application Context Event)"
search: false
category:
  - spring-boot
last_modified_at: 2026-05-08T01:57:40+09:00
---

<br/>

## 0. 들어가면서

새로운 비즈니스 기능을 추가하면서 문제가 발생했다.

- 현재 비즈니스 영역(capability)별로 패키지(package)가 구분되어 있다.
- A 비즈니스 도메인의 특정 동작이 끝나면 B 비즈니스 동작을 연달아 실행해야 한다.
- 단순하게 B 비즈니스 도메인의 기능을 연결하면 A 비즈니스 도메인에 B 비즈니스 의존성(dependency)이 발생한다.

다른 비즈니스 도메인의 의존성이 침투하면 서로 결합도(coupling)가 강해지기 시작한다. 깨진 창문 효과에 따라 한 번 침투하기 시작한 의존성은 시간이 지날수록 두 도메인 사이의 결합도를 높일 것이다. 시스템이 커져 비즈니스별로 서비스를 분리해야 하는 시점이 오면 빠른 변화를 만들기 힘들게 된다. 두 비즈니스 사이에 의존성을 만들지 않는 방법이 필요했다.

## 1. Spring Application Context Event

스프링에서 기본으로 제공하는 기능이다. 커스텀 이벤트(custom event)를 정의하고, 이를 발행(publish), 구독(subscribe)할 수 있다. 애플리케이션 컨텍스트(application context)를 사용해 다른 빈(bean) 사이의 정보를 교환할 수 있다. 이벤트 처리는 두 컴포넌트(component) 사이의 결합도를 낮출 수 있다. 여기서 말하는 컴포넌트는 모듈(module)이나 다른 서비스(서버) 등이 될 수 있다. 모듈 사이의 이벤트 처리를 시각화하면 다음과 같다.

- 하나의 서비스 내에서 분리된 모듈 사이의 정보 교환이 이뤄진다.
- 동일 서비스이므로 애플리케이션 컨텍스트로 이벤트를 처리한다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/spring-application-context-event-01.png" width="65%" class="image__border">
</div>

<br/>

서비스 사이의 이벤트 처리를 시각화하면 다음과 같다.

- 서로 다른 서비스 사이의 정보 교환이 이뤄진다.
- 이벤트 처리를 위한 카프카(kafka) 같은 큐(queue) 시스템이 필요하다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/spring-application-context-event-02.png" width="80%" class="image__border">
</div>

<br/>

이번 글에서는 커스텀 이벤트를 발행하고 수신하는 예시를 다룰 예정이지만, 먼저 기본적으로 어떤 이벤트가 있는지 살펴보겠다. 기본 이벤트를 사용하면 개발자는 자신의 기능을 애플리케이션의 라이프사이클(lifecycle)에 연결할 수 있다.

- ContextRefreshedEvent
  - 애플리케이션 컨텍스트를 초기화하거나 리프레시(refresh)할 때 발행된다.
- ContextStartedEvent
  - 전형적으로 명시적인 정지 이후 빈을 재실행할 때 발행된다.
- ContextStoppedEvent
  - 애플리케이션 컨텍스트가 멈출 때 발행된다.
- ContextClosedEvent
  - 애플리케이션 컨텍스트가 닫힐 때 발행된다.

## 2. Examples

두 모듈 사이의 정보를 커스텀 이벤트로 주고받는 간단한 예시 코드를 살펴보자. 배달이나 주문과 관련된 비즈니스 도메인에 대해서는 잘 모르지만, 간단한 프로세스를 예시로 다뤄 보았다.

1. 배달 정보가 "배달 완료" 상태로 업데이트된다.
2. 배달 모듈에서 "배달 완료" 이벤트를 발행한다.
3. 주문 모듈에서 "배달 완료" 이벤트를 전달받는다.
4. 주문 모듈은 해당 주문 상태를 "배달 완료" 상태로 변경한다.

먼저 패키지 구조를 살펴보자.

- base 패키지
  - `DeliveryCompleteEvent`는 정보를 주고받을 때 사용하는 이벤트 객체이다.
- delivery 패키지
  - DeliveryService 객체를 통해 배달 정보를 변경한다.
  - DeliveryEventProxy 구현체를 통해 order 패키지와 정보를 주고받는다.
- order 패키지
  - OrderEventListener 객체를 통해 delivery 패키지와 정보를 주고받는다.
  - OrderService 객체를 통해 주문 정보를 변경한다.

```
./
├── mvnw
├── mvnw.cmd
├── pom.xml
└── src
    ├── main
    │   ├── java
    │   │   └── blog
    │   │       └── in
    │   │           └── action
    │   │               ├── ActionInBlogApplication.java
    │   │               ├── base
    │   │               │   └── DeliveryCompleteEvent.java
    │   │               ├── delivery
    │   │               │   ├── domain
    │   │               │   │   ├── Delivery.java
    │   │               │   │   └── DeliveryState.java
    │   │               │   ├── proxy
    │   │               │   │   ├── ApplicationContextDeliveryEventProxy.java
    │   │               │   │   └── DeliveryEventProxy.java
    │   │               │   ├── repository
    │   │               │   │   └── DeliveryRepository.java
    │   │               │   └── service
    │   │               │       └── DeliveryService.java
    │   │               └── order
    │   │                   ├── domain
    │   │                   │   ├── Order.java
    │   │                   │   └── OrderState.java
    │   │                   ├── listner
    │   │                   │   └── OrderEventListener.java
    │   │                   ├── repository
    │   │                   │   └── OrderRepository.java
    │   │                   └── service
    │   │                       └── OrderService.java
    │   └── resources
    │       └── application.yml
    └── test
        └── java
            └── blog
                └── in
                    └── action
                        └── delivery
                            └── service
                                └── DeliveryServiceTest.java
```

도메인 엔티티 객체 역할을 하는 Delivery 클래스를 먼저 살펴보자.

- finishDelivery 메서드를 통해 객체의 배달 상태를 완료로 변경한다.

```java
package blog.in.action.delivery.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "TB_DELIVERY")
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private long id;
    private long orderId;
    @Enumerated(value = EnumType.STRING)
    private DeliveryState deliveryState;

    public void finishDelivery() {
        deliveryState = DeliveryState.FINISH;
    }
}
```

다음으로 비즈니스 로직을 담당하는 DeliveryService 클래스를 살펴보자.

- 배달 정보를 조회한 후 배달 완료 상태로 변경한다.
- 프록시(proxy) 객체를 통해 배달 완료 이벤트를 발행한다. `DeliveryEventProxy` 인터페이스를 통해 구현 세부 사항을 차단한다.

```java
package blog.in.action.delivery.service;

import blog.in.action.base.DeliveryCompleteEvent;
import blog.in.action.delivery.domain.Delivery;
import blog.in.action.delivery.proxy.ApplicationContextDeliveryEventProxy;
import blog.in.action.delivery.proxy.DeliveryEventProxy;
import blog.in.action.delivery.repository.DeliveryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class DeliveryService {


    private final DeliveryRepository deliveryRepository;
    private final DeliveryEventProxy deliveryEventProxy;

    public DeliveryService(DeliveryRepository deliveryRepository, ApplicationContextDeliveryEventProxy deliveryEventProxy) {
        this.deliveryRepository = deliveryRepository;
        this.deliveryEventProxy = deliveryEventProxy;
    }

    public void finishDelivery(long deliveryId) {
        Optional<Delivery> optional = deliveryRepository.findById(deliveryId);
        Delivery delivery = optional.orElseThrow(() -> new RuntimeException(String.format("[%s]에 해당하는 배송 정보가 없습니다.", deliveryId)));
        delivery.finishDelivery();
        deliveryEventProxy.publishDeliveryCompleteEvent(new DeliveryCompleteEvent(deliveryId));
    }
}
```

ApplicationContextDeliveryEventProxy 클래스는 앞서 살펴본 DeliveryEventProxy 인터페이스를 구현한다. 클라이언트에게 배달 완료 이벤트 발행 기능을 제공하지만, 실제 구현은 숨긴다. 현재는 스프링 애플리케이션 컨텍스트를 사용하지만, 나중에는 다른 기술로 이벤트를 발행할 수 있다.

- publishDeliveryCompleteEvent 메서드에서 배달 완료 이벤트를 발행한다.

```java
package blog.in.action.delivery.proxy;

import blog.in.action.base.DeliveryCompleteEvent;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class ApplicationContextDeliveryEventProxy implements DeliveryEventProxy {

    private final ApplicationContext applicationContext;

    public ApplicationContextDeliveryEventProxy(ApplicationContext applicationContext) {
        this.applicationContext = applicationContext;
    }

    @Override
    public void publishDeliveryCompleteEvent(DeliveryCompleteEvent deliveryCompleteEvent) {
        applicationContext.publishEvent(deliveryCompleteEvent);
    }
}
```

다른 도메인 엔티티 객체인 Order 클래스를 살펴보자.

- startDelivery 메서드
  - 주문의 배달 상태를 시작으로 변경한다.
- finishDelivery 메서드
  - 주문의 배달 상태를 완료로 변경한다.

```java
package blog.in.action.order.domain;

import lombok.*;

import javax.persistence.*;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "TB_ORDER")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private long id;
    private long deliveryId;
    @Enumerated(value = EnumType.STRING)
    private OrderState orderState;

    public void finishDelivery() {
        orderState = OrderState.DELIVERY_FINISHED;
    }

    public void startDelivery(long deliveryId) {
        this.deliveryId = deliveryId;
        this.orderState = OrderState.DELIVERED;
    }
}
```

이벤트를 수신하는 OrderEventListener 클래스를 살펴보자.

- listenOrderDeliveryCompleteEvent 메서드를 통해 이벤트를 수신하면 주문 서비스(orderService)에 배달 정보를 전달한다.

```java
package blog.in.action.order.listner;

import blog.in.action.base.DeliveryCompleteEvent;
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
    public void listenOrderDeliveryCompleteEvent(DeliveryCompleteEvent deliveryCompleteEvent) {
        orderService.finishDelivery(deliveryCompleteEvent.getDeliveryId());
    }
}
```

비즈니스 로직을 수행하는 OrderService 클래스를 살펴보자.

- 수신한 배달 정보에 해당하는 주문 정보를 조회한다.
- 주문 정보를 배달 완료로 변경한다.

```java
package blog.in.action.order.service;

import blog.in.action.order.domain.Order;
import blog.in.action.order.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public void finishDelivery(long deliveryId) {
        Optional<Order> optional = orderRepository.findByDeliveryId(deliveryId);
        Order order = optional.orElseThrow(() -> new RuntimeException("[%s] 배송 아이디에 해당하는 주문 정보가 없습니다."));
        order.finishDelivery();
    }
}
```

## 3. Test

테스트 코드를 통해 위에서 살펴본 코드가 정상적으로 동작하는지 살펴보자.

- Given 단계
  - 신규 주문 정보를 생성한다. 해당 주문의 배달 상태는 "시작"이다.
  - 신규 배달 정보를 생성한다. 배달 상태는 "시작"이다.
- When 단계
  - 해당 배달의 상태를 "완료"로 변경한다.
- Then 단계
  - 해당 배달과 연관된 주문 정보를 조회한 후 주문의 배달 상태가 "배달 완료"인지 확인한다.

```java
package blog.in.action.delivery.service;

import blog.in.action.delivery.domain.Delivery;
import blog.in.action.delivery.domain.DeliveryState;
import blog.in.action.delivery.repository.DeliveryRepository;
import blog.in.action.order.domain.Order;
import blog.in.action.order.domain.OrderState;
import blog.in.action.order.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@SpringBootTest
public class DeliveryServiceTest {

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DeliveryService sut;

    @Test
    @Transactional
    public void delivery_is_finished_then_order_state_is_changed() {
        Order order = Order.builder()
                .build();
        orderRepository.save(order);
        Delivery delivery = Delivery.builder()
                .orderId(order.getId())
                .deliveryState(DeliveryState.START)
                .build();
        deliveryRepository.save(delivery);
        order.startDelivery(delivery.getId());
        orderRepository.flush();


        sut.finishDelivery(delivery.getId());


        Optional<Order> optional = orderRepository.findByDeliveryId(delivery.getId());
        Order result = optional.get();
        assertThat(result.getOrderState(), equalTo(OrderState.DELIVERY_FINISHED));
    }
}
```

테스트 코드를 실행하면 다음과 같은 로그를 확인할 수 있다.

```
2023-01-09 23:03:25.189  INFO 68748 --- [           main] o.s.t.c.transaction.TransactionContext   : Began transaction (1) for test context [DefaultTestContext@62727399 testClass = DeliveryServiceTest, testInstance = blog.in.action.delivery.service.DeliveryServiceTest@7698a3d9, testMethod = delivery_is_finished_then_order_state_is_changed@DeliveryServiceTest, testException = [null], mergedContextConfiguration = [WebMergedContextConfiguration@4d9ac0b4 testClass = DeliveryServiceTest, locations = '{}', classes = '{class blog.in.action.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.context.SpringBootTestContextBootstrapper=true}', contextCustomizers = set[org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@66982506, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@4bdeaabb, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.web.client.TestRestTemplateContextCustomizer@6f204a1a, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@0, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@7e990ed7], resourceBasePath = 'src/main/webapp', contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map['org.springframework.test.context.web.ServletTestExecutionListener.activateListener' -> true, 'org.springframework.test.context.web.ServletTestExecutionListener.populatedRequestContextHolder' -> true, 'org.springframework.test.context.web.ServletTestExecutionListener.resetRequestContextHolder' -> true]]; transaction manager [org.springframework.orm.jpa.JpaTransactionManager@2ee1b017]; rollback [true]
Hibernate: call next value for hibernate_sequence
Hibernate: call next value for hibernate_sequence
Hibernate: insert into tb_order (delivery_id, order_state, id) values (?, ?, ?)
Hibernate: insert into tb_delivery (delivery_state, order_id, id) values (?, ?, ?)
Hibernate: update tb_order set delivery_id=?, order_state=? where id=?
Hibernate: select order0_.id as id1_1_, order0_.delivery_id as delivery2_1_, order0_.order_state as order_st3_1_ from tb_order order0_ where order0_.delivery_id=?
Hibernate: update tb_order set delivery_id=?, order_state=? where id=?
Hibernate: update tb_delivery set delivery_state=?, order_id=? where id=?
Hibernate: select order0_.id as id1_1_, order0_.delivery_id as delivery2_1_, order0_.order_state as order_st3_1_ from tb_order order0_ where order0_.delivery_id=?
2023-01-09 23:03:25.453  INFO 68748 --- [           main] o.s.t.c.transaction.TransactionContext   : Rolled back transaction for test: [DefaultTestContext@62727399 testClass = DeliveryServiceTest, testInstance = blog.in.action.delivery.service.DeliveryServiceTest@7698a3d9, testMethod = delivery_is_finished_then_order_state_is_changed@DeliveryServiceTest, testException = [null], mergedContextConfiguration = [WebMergedContextConfiguration@4d9ac0b4 testClass = DeliveryServiceTest, locations = '{}', classes = '{class blog.in.action.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.context.SpringBootTestContextBootstrapper=true}', contextCustomizers = set[org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@66982506, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@4bdeaabb, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.web.client.TestRestTemplateContextCustomizer@6f204a1a, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@0, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@7e990ed7], resourceBasePath = 'src/main/webapp', contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map['org.springframework.test.context.web.ServletTestExecutionListener.activateListener' -> true, 'org.springframework.test.context.web.ServletTestExecutionListener.populatedRequestContextHolder' -> true, 'org.springframework.test.context.web.ServletTestExecutionListener.resetRequestContextHolder' -> true]]
```

## CLOSING

주문과 배달 관련 도메인을 직접 경험해 보지는 않아서 테스트 시나리오가 좋지 않을 수 있다. 이 글을 작성하면서 생긴 궁금한 주제는 다음 글로 정리할 생각이다.

- 비동기(async) 방식의 이벤트 처리는 어떻게 수행하는가?
- 전달한 이벤트까지 트랜잭션이 이어지는가?
- 전달한 이벤트를 별도의 다른 트랜잭션으로 처리할 수 있는가?

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-08-15-spring-application-context-event>

#### RECOMMEND NEXT POSTS

- [프록시 패턴(proxy pattern)][proxy-pattern-link]
- [스프링 애플리케이션 컨텍스트 이벤트(Spring Application Context Event)와 트랜잭션(transaction)][transaction-in-spring-application-context-event-link]
- [스프링 애플리케이션 컨텍스트 비동기 이벤트(Spring Application Context Async Event)][async-in-spring-application-context-event-link]

#### REFERENCE

- <https://www.baeldung.com/spring-context-events>
- <https://junhyunny.blogspot.com/2020/02/spring-applicationcontext-event.html>

[transaction-in-spring-application-context-event-link]: https://junhyunny.github.io/spring-boot/transaction-in-spring-application-context-event/
[async-in-spring-application-context-event-link]: https://junhyunny.github.io/spring-boot/async-in-spring-application-context-event/
[proxy-pattern-link]: https://junhyunny.github.io/information/design-pattern/proxy-pattern/
