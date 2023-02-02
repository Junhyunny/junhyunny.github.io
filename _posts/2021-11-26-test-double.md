---
title: "Test Double"
search: false
category:
  - information
  - test-driven-development
last_modified_at: 2021-11-26T23:55:00
---

<br/>

## 0. 들어가면서
`Kent Beck`의 `XP(Extreme Programming) Explained` 저서에는 이런 문구가 있습니다. 

> 개발의 기본 흐름은 일단 실패하는 테스트를 작성하고, 그 다음으로 그 테스트를 통과하도록 만드는 것이다.<br/>
> ...<br/>
> 해결하고 싶은 스토리들을 목록으로 만들고, 그 스토리들을 표현하는 테스트들을 작성하고, 
> 그런 다음 그 테스트들 통과하도록 만든다. 
> 여러분이 작성해야 할 필요가 있다고 생각하는 테스트들을 목록으로 만들고, 테스트를 하나 작성하고, 
> 그 테스트를 통과하도록 만들고, 다른 테스트를 작성하고, 
> 두 테스트 모두 통과하도록 만들고 하면서 목록이 비워질 때까지 일한다.

`테스트 주도 개발(TDD, Test Driven Development)`은 책이나 글을 읽어서 배울 수 있는게 아니라 실천을 통해 얻는 습관과 경험이라는 느낌을 강하게 받았습니다. 
그렇지만, 개발자는 `TDD`를 실천하기 위한 몇 가지 도구들이 필요하고, 오늘은 그 중 한가지에 대해서 정리해보았습니다.

## 1. Test Double

테스트 더블(Test Double)이라는 단어는 영화 산업에서 위험한 장면을 촬영할 때 배우를 대체할 대역인 스턴트 더블(stunt double)에서 유래했습니다. 
테스트를 진행할 때 실제 클래스를 사용하는 것이 아니라 이와 동일한 형태를 가진 테스트 더블을 사용합니다. 

### 1.1. Why Using Test Double

단위 테스트(unit test)는 시스템이 커질수록 쉽지 않아지기 마련입니다. 
테스트하고 싶은 메소드 내부에 다른 컴포넌트(component)에 의존한 기능들로 인해 결합도(coupling)가 높을수도 있고, 
제어하기 어려운 네트워크나 데이터베이스를 사용하는 기능들이 존재할 수 있습니다. 
이런 여러 가지 제약 사항들 때문에 어려운 테스트를 빠르고 쉽게 진행하기 위해 테스트 더블을 사용합니다.

##### 시스템 컴포넌트 단위 테스트

<p align="center"><img src="/images/test-double-1.JPG" width="50%"></p>
<center>https://www.crocus.co.kr/1555</center>

### 1.2. When Using Test Double 
테스트 더블은 다음과 같은 시기에 사용합니다.
- 예측 불가능한 요소를 통제하여 테스트하기를 원하는 경우
- 느린 테스트를 보다 빠르게 진행하기를 원하는 경우
- 통합 환경 구축의 어려움이 발생하는 경우
- 실제 클래스를 사용하기 어렵고 불편한 경우

## 2. Test Double 소개
테스트 더블의 종류는 모두 5가지 입니다. 
각 테스트 더블이 어떤 특성을 가졌는지 살펴보고, 어떻게 사용되는지 간단한 예제를 통해 알아보겠습니다.

##### Test Double Type

<p align="center">
    <img src="/images/test-double-2.JPG" width="50%" class="image__border">
</p>
<center>http://xunitpatterns.com/Test%20Double.html</center>

### 2.1. 테스트 시나리오
아래와 같은 클래스의 기능을 테스트하고 싶습니다. 
- API 요청 기능이 필요한 클래스이며, 새로 구현한 `saveOrder`, `findOrderById`, `isAdmin` 메소드 기능을 테스트하고 싶습니다. 
- 개발 환경 네트워크 문제로 인해 다른 서비스로 API 요청은 불가능합니다.

##### RemoteProxy 클래스
- `RequestDelegator` 클래스를 이용하여 API 요청을 수행합니다.
- `saveOrder` 메소드는 오직 관리자만 사용 가능합니다.
- `findByOrderId` 메소드는 누구나 사용 가능합니다.

```java
package blog.in.action;

import lombok.extern.log4j.Log4j2;

import static blog.in.action.AUTHORITY.ADMIN;

@Log4j2
public class RemoteProxy implements RemoteSubject {

    private final RequestDelegator requestDelegator;

    public RemoteProxy(RequestDelegator requestDelegator) {
        this.requestDelegator = requestDelegator;
    }

    @Override
    public void saveOrder(Order order, AUTHORITY authority) {
        if (!isAdmin(authority)) {
            throw new RuntimeException("only admin accessible");
        }
        requestDelegator.saveOrder(order);
    }

    @Override
    public Order findByOrderId(long id) {
        return requestDelegator.findByOrderId(id);
    }

    boolean isAdmin(AUTHORITY authority) {
        return ADMIN.accessible(authority);
    }
}
```

### 2.2. Dummy
개발자는 `isAdmin` 메소드 기능을 테스트하고 싶습니다. 
메소드 내부에서 `RequestDelegator` 클래스 기능을 사용하고 있진 않습니다. 
`isAdmin` 메소드 기능 테스트를 위해 `RequestDelegator` 클래스는 필요하지 않습니다. 
하지만, 아이러니하게도 `RequestDelegator` 클래스 없이는 테스트할 수 없습니다. 
`RequestDelegator` 클래스가 생성자에 포함되어 있기 때문입니다. 
이런 경우에 테스트 더블 `Dummy`를 사용합니다. 
**실제 기능을 사용하진 않지만, 생성자 파라미터로 전달될 인스턴스는 필요합니다.**

##### Dummy Delegator 클래스
- `RequestDelegator` 인터페이스를 구현(implement)합니다. 
- 오버라이딩 메소드의 내부 기능을 채울 필요는 없습니다.

```java
package blog.in.action.testdouble;

import blog.in.action.Order;
import blog.in.action.RequestDelegator;

public class DummyDelegator implements RequestDelegator {

    @Override
    public void saveOrder(Order order) {
        
    }

    @Override
    public Order findByOrderId(long id) {
        return null;
    }
}
```

##### isAdmin 메소드 테스트
- `RemoteProxy` 클래스 생성자에 DummyDelegator 인스턴스를 전달합니다.

```java
package blog.in.action;

import blog.in.action.testdouble.DummyDelegator;
import lombok.extern.log4j.Log4j2;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

import static blog.in.action.AUTHORITY.NORMAL;
import static org.assertj.core.api.Assertions.assertThat;

@Log4j2
public class TestDoubleTest {

    @Test
    public void when_giveNormal_then_false() {
        RemoteProxy remoteProxy = new RemoteProxy(new DummyDelegator());
        assertThat(remoteProxy.isAdmin(NORMAL)).isFalse();
    }
}
```

### 2.3. Spy
개발자는 `saveOrder` 메소드에 대한 테스트를 수행하고 싶습니다. 
`ADMIN` 권한으로 `saveOrder` 메소드를 호출하였을 때 실제 API 호출이 수행되었는지 확인하고 싶습니다. 
이런 경우에 테스트 더블 `Spy`를 사용합니다. 
**`Spy`는 테스트에 사용되는 객체, 메소드의 사용 여부 및 정상 호출 여부를 기록하고 요청 시 알려줍니다.** 

##### SpyDelegator 클래스

```java
package blog.in.action.testdouble;

import blog.in.action.Order;
import blog.in.action.RequestDelegator;

import java.util.ArrayList;
import java.util.List;

public class SpyDelegator implements RequestDelegator {

    private int saveOrderCallCnt = 0;

    @Override
    public void saveOrder(Order order) {
        saveOrderCallCnt++;
    }

    @Override
    public Order findByOrderId(long id) {
        return null;
    }

    public int getSaveOrderCallCnt() {
        return saveOrderCallCnt;
    }
}
```

##### saveOrder 메소드 테스트
- `RemoteProxy` 클래스 생성자에 SpyDelegator 인스턴스를 전달합니다.
- `ADMIN` 권한으로 saveOrder 메소드를 호출합니다.
- 내부에서 `SpyDelegator` 인스턴스의 saveOrder 메소드가 호출되었는지 검증합니다.

```java
package blog.in.action;

import blog.in.action.testdouble.DummyDelegator;
import lombok.extern.log4j.Log4j2;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

import static blog.in.action.AUTHORITY.NORMAL;
import static org.assertj.core.api.Assertions.assertThat;

@Log4j2
public class TestDoubleTest {

    @Test
    public void when_giveAdmin_then_saveOrderCallCntIsOne() {
        SpyDelegator spy = new SpyDelegator();
        RemoteProxy remoteProxy = new RemoteProxy(spy);
        remoteProxy.saveOrder(new Order(0, "order"), ADMIN);
        assertThat(spy.getSaveOrderCallCnt()).isEqualTo(1);
    }
}
```

### 2.4. Stub
개발자는 `findByOrderId` 메소드를 테스트하고 싶습니다. 
`findByOrderId` 메소드를 호출하였을 때 전달한 ID를 가진 Order 인스턴스를 반환받기를 기대합니다. 
이런 경우에 테스트 더블 `Stub`를 사용합니다. 
**`Stub`는 테스트 호출 요청에 대해 미리 준비해둔 결과를 반환합니다.**

##### StubDelegator 클래스

```java
package blog.in.action.testdouble;

import blog.in.action.Order;
import blog.in.action.RequestDelegator;

public class StubDelegator implements RequestDelegator {

    @Override
    public void saveOrder(Order order) {

    }

    @Override
    public Order findByOrderId(long id) {
        return new Order(id, null);
    }
}
```

##### findByOrderId 메소드 테스트
- `RemoteProxy` 클래스 생성자에 StubDelegator 인스턴스를 전달합니다.
- ID가 1인 Order 정보를 조회하였을 때, 반환되는 Order 인스턴스의 ID도 1이기를 기대합니다.

```java
package blog.in.action;

import blog.in.action.testdouble.DummyDelegator;
import blog.in.action.testdouble.SpyDelegator;
import blog.in.action.testdouble.StubDelegator;
import lombok.extern.log4j.Log4j2;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

import static blog.in.action.AUTHORITY.ADMIN;
import static blog.in.action.AUTHORITY.NORMAL;
import static org.assertj.core.api.Assertions.assertThat;

@Log4j2
public class TestDoubleTest {

    @Test
    public void when_giveId_then_returnTargetOrder() {
        long id = 1;
        RemoteProxy remoteProxy = new RemoteProxy(new StubDelegator());
        assertThat(remoteProxy.findByOrderId(id).getId()).isEqualTo(id);
    }
}
```

### 2.5. Fake
개발자는 이번엔 복합적인 테스트를 진행하고 싶습니다. 
`saveOrder` 메소드로 저장한 Order 정보가 `findByOrderId` 메소드로 조회되기를 원합니다. 
이런 경우에 테스트 더블 `Fake`를 사용합니다. 
**`Stub`보다는 조금 더 실제 인스턴스와 비슷하게 동작하지만, 미리 준비한 결과를 전달하는 것이 아니라 실제 인스턴스처럼 동작하도록 비즈니스 로직이 추가됩니다.**

##### FakeDelegator 클래스
- 데이터를 저장할 수 있는 Map 인스턴스를 멤버로 가지고 있습니다. 
- `saveOrder` 메소드는 Order 정보의 ID를 기준으로 데이터를 저장합니다.
- `findByOrderId` 메소드는 전달받은 ID를 기준으로 데이터를 조회합니다.

```java
package blog.in.action.testdouble;

import blog.in.action.Order;
import blog.in.action.RequestDelegator;

import java.util.HashMap;
import java.util.Map;

public class FakeDelegator implements RequestDelegator {

    private Map<Long, Order> inMemoryDB = new HashMap<>();

    @Override
    public void saveOrder(Order order) {
        inMemoryDB.put(order.getId(), order);
    }

    @Override
    public Order findByOrderId(long id) {
        return inMemoryDB.get(id);
    }
}
```

##### 데이터 저장 및 조회 테스트
- `RemoteProxy` 클래스 생성자에 FakeDelegator 인스턴스를 전달합니다.
- ID가 1인 Order 정보를 ADMIN 권한으로 저장합니다. 
- ID가 1인 Order 정보를 조회하였을 때, 반환되는 Order 인스턴스의 ID도 1이기를 기대합니다.

```java
package blog.in.action;

import blog.in.action.testdouble.DummyDelegator;
import blog.in.action.testdouble.FakeDelegator;
import blog.in.action.testdouble.SpyDelegator;
import blog.in.action.testdouble.StubDelegator;
import lombok.extern.log4j.Log4j2;
import org.aspectj.weaver.ast.Or;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

import static blog.in.action.AUTHORITY.ADMIN;
import static blog.in.action.AUTHORITY.NORMAL;
import static org.assertj.core.api.Assertions.assertThat;

@Log4j2
public class TestDoubleTest {

    @Test
    public void when_giveIdAfterSaveOrderAsAdmin_then_returnTargetOrder() {
        long id = 1;
        RemoteProxy remoteProxy = new RemoteProxy(new FakeDelegator());
        remoteProxy.saveOrder(new Order(id, null), ADMIN);
        assertThat(remoteProxy.findByOrderId(id).getId()).isEqualTo(id);
    }
}
```

### 2.6. Mock
`Mock`에 대한 이야기를 하기 전에 먼저 짚고 넘어갈게 있습니다. 
상태 기반 테스트(state base test)와 행위 기반 테스트(behavior base test)에 대한 개념입니다. 

##### 상태 기반 테스트(state base test)와 행위 기반 테스트(behavior base test) 차이점
- 상태 기반 테스트(state base test) - 객체의 상태가 변했는지 확인
- 행위 기반 테스트(behavior base test) - 객체가 특정 동작을 수행했는지 확인

상태 기반 테스트는 `Fake`를 이용한 테스트 방식을 예로 들수 있습니다. 
특정 데이터를 저장하고, 해당 데이터가 존재하는지 변경된 상태를 확인합니다. 
행위 기반 테스트는 `Spy`를 이용한 테스트 방식을 예로 들수 있습니다. 
권한이 `ADMIN`인지 `NORMAL`인지에 따라 `saveOrder` 메소드가 수행되었는지 여부를 확인할 수 있습니다. 
**여기서 행위 기반 테스트는 시나리오를 점검한다는 것이 매우 중요한 점입니다.** 

마틴 파울러(Martin Fowler)는 [Mocks Aren't Stubs][martinfowler-link] 포스트에서 다음과 같이 이야기하고 있습니다. 

> Mocks Aren't Stubs -  The Difference Between Mocks and Stubs<br/>
> In order to use state verification on the stub, 
> I need to make some extra methods on the stub to help with verification. 
> As a result the stub implements MailService but adds extra test methods.<br/>
> Mock objects always use behavior verification, a stub can go either way. 
> Meszaros refers to stubs that use behavior verification as a Test Spy. 
> The difference is in how exactly the double runs and verifies and I'll leave that for you to explore on your own.

글을 읽어보면 `Mock`은 행위 기반 테스트가 목적이고, `Stub`는 상태 기반 테스트가 목적이라고 정의내리고 있습니다. 
물론 `Mock`은 상태에 대한 검증도 가능하지만, 사용하는 주 목적은 행위 기반 테스트라고 정리하면 좋을 것 같습니다. 

##### MockDelegator 클래스

```java
package blog.in.action.testdouble;

import blog.in.action.Order;
import blog.in.action.RequestDelegator;

import java.util.HashMap;
import java.util.Map;

public class MockDelegator implements RequestDelegator {

    private int saveOrderCallCnt = 0;

    private Map<Long, Order> inMemoryDB = new HashMap<>();

    @Override
    public void saveOrder(Order order) {
        saveOrderCallCnt++;
        inMemoryDB.put(order.getId(), order);
    }

    @Override
    public Order findByOrderId(long id) {
        return inMemoryDB.get(id);
    }

    public int getSaveOrderCallCnt() {
        return saveOrderCallCnt;
    }
}
```

##### 데이터 저장 및 조회 테스트
- `RemoteProxy` 클래스 생성자에 FakeDelegator 인스턴스를 전달합니다.
- ID가 1인 Order 정보를 NORMAL 권한으로 저장합니다. 
- 권한이 부족하므로 `RuntimeException`이 발생할 것으로 예상합니다.
- ID가 1인 Order 정보를 조회하였을 때, 반환되는 Order 인스턴스는 `null`이기를 기대합니다.
- `saveOrder` 메소드 호출 횟수는 0이기를 기대합니다.

```java
package blog.in.action;

import blog.in.action.testdouble.*;
import lombok.extern.log4j.Log4j2;
import org.aspectj.weaver.ast.Or;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

import static blog.in.action.AUTHORITY.ADMIN;
import static blog.in.action.AUTHORITY.NORMAL;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@Log4j2
public class TestDoubleTest {

    @Test
    public void when_giveIdAfterSaveOrderAsNormal_then_returnNullAndSaveCallCntZero() {
        long id = 1;
        MockDelegator mock = new MockDelegator();
        RemoteProxy remoteProxy = new RemoteProxy(mock);
        assertThrows(RuntimeException.class, () -> remoteProxy.saveOrder(new Order(id, null), NORMAL));
        assertThat(remoteProxy.findByOrderId(id)).isNull();
        assertThat(mock.getSaveOrderCallCnt()).isZero();
    }
}
```

## CLOSING
테스트 더블을 지원하는 많은 프레임워크들이 존재하는데, 몇 가지 소개하고 포스트를 마치도록 하겠습니다. 

##### Java 테스트 더블 지원 프레임워크
- spockframework - <https://spockframework.org/>
- mockito - <https://site.mockito.org/>

##### JavaScript 테스트 더블 지원 프레임워크
- sinonjs - <https://sinonjs.org/>
- jest - <https://jestjs.io/>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-11-26-test-double>

#### REFERENCE
- <http://xunitpatterns.com/Test%20Double.html>
- <https://martinfowler.com/articles/mocksArentStubs.html>
- <https://www.crocus.co.kr/1555>
- <https://velog.io/@leeyoungwoozz/Test-Doubles>
- <https://kimkoungho.github.io/testing/test-double/>

[martinfowler-link]: https://martinfowler.com/articles/mocksArentStubs.html
