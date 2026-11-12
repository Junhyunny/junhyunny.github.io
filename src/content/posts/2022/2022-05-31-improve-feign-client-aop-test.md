---
title: "FeignClient AOP 단위 테스트 개선"
publishedAt: "2022-05-31"
updatedAt: "2026-11-12T16:18:19+09:00"
canonicalPath: "/spring-boot/test-driven-development/improve-feign-client-aop-test/"
categories:
  - "spring-boot"
  - "test-driven-development"
summary: "무거운 결합 테스트에 의존하던 FeignClient AOP 테스트를 단계적으로 개선하고, AspectJProxyFactory 클래스로 빈 없이 AOP 기능을 단위 테스트한 과정을 정리했다."
---

## 0. 들어가면서

[애너테이션 기반 AOP(관점 지향 프로그래밍)][annotation-based-aop-link] 글을 쓸 당시에는 적절한 테스트 코드를 작성했다고 생각했다. 다음 날 출근해서 글에 정리한 내용을 바탕으로 테스트와 클래스를 구현하다 보니 허점이 많았다. 이번 글에서는 부족했던 부분을 어떻게 개선했는지 정리했다.

## 1. 첫 테스트 코드와 구현 클래스

먼저 처음 작성한 테스트 코드의 내용과 작성 의도를 살펴보자. AOP 기능을 테스트해야 하기 때문에 `@SpringBootTest` 애너테이션을 사용했다. 테스트에서는 `SimpleClient` 빈(bean)을 주입받아 호출하고, 이 빈의 메서드를 호출할 때마다 AOP 로직이 이력 성격의 데이터를 추가한다. `InterfaceHistoryRepository` 빈을 주입받아 AOP 로직이 데이터베이스에 추가한 데이터가 있는지 확인한다. `@Transactional` 애너테이션으로 테스트가 끝나면 데이터베이스를 롤백한다.

```java
package blog.in.action.openfeign.simple;

import blog.in.action.client.SimpleClient;
import blog.in.action.repository.InterfaceHistoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.greaterThan;

@SpringBootTest
public class SimpleClientIT {

    @Autowired
    private SimpleClient simpleClient;

    @Autowired
    private InterfaceHistoryRepository repository;

    @Test
    @Transactional
    public void whenCallHomeMethod_thenExistsHistoryData() {

        simpleClient.home();

        assertThat(repository.count(), greaterThan(0L));
    }

    @Test
    @Transactional
    public void whenCallAboutMethod_thenExistsHistoryData() {

        simpleClient.about();

        assertThat(repository.count(), greaterThan(0L));
    }
}
```

`SimpleClient` 인터페이스에는 `FeignClient` 구현체가 주입된다. `home()` 메서드는 `Junhyunny` 블로그 홈 정보를, `about()` 메서드는 블로그 주인의 자기소개 페이지를 요청한다.

```java
package blog.in.action.client;

import blog.in.action.annotation.InterfaceMeta;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "simple-client", url = "https://junhyunny.github.io")
public interface SimpleClient {

    @InterfaceMeta(explainText = "블로그 홈", serviceId = "0001")
    @GetMapping(path = "/")
    String home();

    @InterfaceMeta(explainText = "자기소개", serviceId = "0002")
    @GetMapping(path = "/about/")
    String about();
}
```

`InterfaceHistoryInterceptor` 클래스는 AOP 기능으로 특정 기능의 호출 시점을 가로채 실행된다. `@InterfaceMeta` 애너테이션이 붙은 메서드를 호출하면 `aroundCallFeignClient` 메서드가 실행되고, 필요한 정보를 추출해 이력성 테이블에 추가한다.

```java
package blog.in.action.aop;

import blog.in.action.annotation.InterfaceMeta;
import blog.in.action.repository.InterfaceHistory;
import blog.in.action.repository.InterfaceHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.sql.Timestamp;
import java.time.LocalDateTime;

@Aspect
@Component
@RequiredArgsConstructor
public class InterfaceHistoryInterceptor {

    private final InterfaceHistoryRepository repository;

    private String[] getPath(Annotation[] annotations) {
        for (Annotation annotation : annotations) {
            if (annotation instanceof GetMapping) {
                return ((GetMapping) annotation).path();
            } else if (annotation instanceof PostMapping) {
                return ((PostMapping) annotation).path();
            } else if (annotation instanceof PutMapping) {
                return ((PutMapping) annotation).path();
            } else if (annotation instanceof DeleteMapping) {
                return ((DeleteMapping) annotation).path();
            } else if (annotation instanceof RequestMapping) {
                return ((RequestMapping) annotation).path();
            }
        }
        return null;
    }

    @Around("@annotation(blog.in.action.annotation.InterfaceMeta)")
    public Object aroundCallFeignClient(ProceedingJoinPoint pjp) throws Throwable {
        Timestamp requestTime = Timestamp.valueOf(LocalDateTime.now());

        Object result = pjp.proceed();

        try {
            Timestamp responseTime = Timestamp.valueOf(LocalDateTime.now());
            MethodSignature signature = (MethodSignature) pjp.getSignature();
            Method method = signature.getMethod();
            InterfaceMeta interfaceMeta = method.getAnnotation(InterfaceMeta.class);
            Annotation[] annotations = method.getDeclaredAnnotations();

            InterfaceHistory interfaceHistory = InterfaceHistory
                    .builder()
                    .serviceId(interfaceMeta.serviceId())
                    .explainText(interfaceMeta.explainText())
                    .path(getPath(annotations))
                    .response(String.valueOf(result))
                    .requestTime(requestTime)
                    .responseTime(responseTime)
                    .build();

            repository.save(interfaceHistory);

        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
        return result;
    }
}
```

## 2. 첫 테스트 코드의 문제점과 개선

### 2.1. 첫 테스트 코드의 문제점

첫 번째 테스트 코드를 작성하고 구현체를 만들면서 다음과 같은 문제점을 느꼈다.

1. 결합 테스트라 실제 빈(bean) 객체가 필요하기 때문에 테스트가 무겁다.
2. `FeignClient` 객체가 실제로 API 요청을 수행하기 때문에 네트워크에 의존한다.

테스트는 빠르고 독립적이어야 하며, 어떤 환경에서 다시 실행해도 같은 결과를 얻을 수 있어야 한다. 극단적으로는 네트워크가 없는 폐쇄망에서도 동작할 수 있어야 한다. 그런 관점에서 보면 처음 작성한 테스트 코드는 네트워크 상황에 따라 결과가 달라질 수 있었고, 실제 데이터베이스에 삽입되는 데이터 값도 검증하지 않았다. 일단 몇 가지 문제점을 개선했다.

### 2.2. 1차 테스트 코드 개선

테스트용 빈을 만들어 실제 네트워크 동작을 수행하지 않도록 했고, 실제 데이터베이스에 추가된 데이터 값을 검증했다.

```java
package blog.in.action.openfeign.simple;

import blog.in.action.annotation.InterfaceMeta;
import blog.in.action.client.SimpleClient;
import blog.in.action.repository.InterfaceHistory;
import blog.in.action.repository.InterfaceHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;

import java.sql.Timestamp;
import java.time.LocalDateTime;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@SpringBootTest
public class SimpleClientIT {

    @Autowired
    @Qualifier("testClient")
    SimpleClient simpleClient;

    @Autowired
    InterfaceHistoryRepository repository;

    LocalDateTime requestTime;
    LocalDateTime responseTime;

    @BeforeEach
    void setUp() {
        requestTime = LocalDateTime.now();
        responseTime = requestTime.plusSeconds(1);
    }

    @Test
    @Transactional
    void whenCallHomeMethod_thenExistsHistoryData() {
        MockedStatic<LocalDateTime> mockedStatic = Mockito.mockStatic(LocalDateTime.class);
        Mockito.when(LocalDateTime.now())
                .thenReturn(requestTime, responseTime)
                .thenCallRealMethod();


        simpleClient.home();


        mockedStatic.close();
        InterfaceHistory entity = repository.findAll().get(0);
        assertThat(entity.getServiceId(), equalTo("0001"));
        assertThat(entity.getPath(), equalTo(new String[]{"/"}));
        assertThat(entity.getExplainText(), equalTo("블로그 홈"));
        assertThat(entity.getResponse(), equalTo("home"));
        assertThat(entity.getRequestTime(), equalTo(Timestamp.valueOf(requestTime)));
        assertThat(entity.getResponseTime(), equalTo(Timestamp.valueOf(responseTime)));
    }

    @Test
    @Transactional
    void whenCallAboutMethod_thenExistsHistoryData() {
        MockedStatic<LocalDateTime> mockedStatic = Mockito.mockStatic(LocalDateTime.class);
        Mockito.when(LocalDateTime.now())
                .thenReturn(requestTime, responseTime)
                .thenCallRealMethod();


        simpleClient.about();


        mockedStatic.close();
        InterfaceHistory entity = repository.findAll().get(0);
        assertThat(entity.getServiceId(), equalTo("0002"));
        assertThat(entity.getPath(), equalTo(new String[]{"/about/"}));
        assertThat(entity.getExplainText(), equalTo("자기소개"));
        assertThat(entity.getResponse(), equalTo("about"));
        assertThat(entity.getRequestTime(), equalTo(Timestamp.valueOf(requestTime)));
        assertThat(entity.getResponseTime(), equalTo(Timestamp.valueOf(responseTime)));
    }
}

@Configuration
class TestConfig {

    @Bean(name = "testClient")
    public SimpleClient testClient() {
        return new SimpleClient() {

            @InterfaceMeta(explainText = "블로그 홈", serviceId = "0001")
            @GetMapping(path = "/")
            @Override
            public String home() {
                return "home";
            }

            @InterfaceMeta(explainText = "자기소개", serviceId = "0002")
            @GetMapping(path = "/about/")
            @Override
            public String about() {
                return "about";
            }
        };
    }
}
```

## 3. 1차 테스트 코드 개선의 문제점

테스트 코드가 일부 개선됐지만, 여전히 다음과 같은 불합리한 부분이 보였다.

1. 여전히 결합 테스트로 동작하기 때문에 무겁다.
2. 테스트를 위한 `FeignClient`가 별도로 존재한다.

실제 네트워크 호출에 대한 의존성을 제거한 것으로 타협하고 남은 테스트를 작성했지만, 참을 수 없는 문제점을 하나 발견했다. 메서드 위에서 요청 방법을 결정하는 애너테이션은 요청 경로 값을 넣는 방법에 따라 값을 다른 속성에 저장한다.

예를 들어 다음 코드에서는 "/" 경로 정보가 `@GetMapping` 애너테이션의 `path` 속성에 저장된다.

```java
    @GetMapping(path = "/")
    public String home() {
        return "home";
    }
```

반면 다음 코드에서는 "/" 경로 정보가 `@GetMapping` 애너테이션의 `value` 속성에 저장된다.

```java
    @GetMapping("/")
    public String home() {
        return "home";
    }
```

구현한 사람마다 경로를 넣는 방법이 달랐고, 그러다 보니 어떤 경우에는 테스트가 실패했다. 테스트를 통과시키려면 경로 지정 방법을 바꾸기만 하면 되지만, 그것은 테스트를 위해 만든 빈을 고칠 뿐 실제로 사용하는 클라이언트를 수정하는 것이 아니었다. 작성한 테스트 코드는 실제로 사용하는 클라이언트를 검증하지 못했다.

## 4. 2차 테스트 코드 개선

빈을 사용하지 않고 AOP 기능을 테스트하는 방법을 찾다가 좋은 예시를 발견해 적용했다. `AspectJProxyFactory` 클래스를 사용하면 빈을 만들지 않아도 AOP 기능을 제공하는 프록시 객체를 만들 수 있다. 이를 통해 다음 내용을 개선했다.

- 빈을 주입받지 않고 `SimpleClient` 객체를 mock 객체로 생성했다.
  - 실제 API 요청 없이 필요한 응답 값을 확인할 수 있도록 스터빙(stubbing)할 수 있다.
- 빈을 주입받지 않고 `InterfaceHistoryRepository` 객체를 mock 객체로 생성했다.
  - 데이터베이스를 직접 조회하지 않고 `save(entity)` 메서드에 전달된 엔티티 객체의 속성 값을 확인할 수 있다.
- 빈 주입이 필요 없기 때문에 결합 테스트를 단위 테스트로 바꿨다.

```java
package blog.in.action.openfeign.simple;

import blog.in.action.aop.InterfaceHistoryInterceptor;
import blog.in.action.client.SimpleClient;
import blog.in.action.repository.InterfaceHistory;
import blog.in.action.repository.InterfaceHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.aop.aspectj.annotation.AspectJProxyFactory;

import java.sql.Timestamp;
import java.time.LocalDateTime;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

public class SimpleClientTests {

    AspectJProxyFactory factory;

    SimpleClient mockClient;
    InterfaceHistoryRepository mockRepository;
    InterfaceHistoryInterceptor interceptor;

    LocalDateTime requestTime;
    LocalDateTime responseTime;

    @BeforeEach
    void setUp() {
        mockClient = Mockito.mock(SimpleClient.class);
        mockRepository = Mockito.mock(InterfaceHistoryRepository.class);

        interceptor = new InterfaceHistoryInterceptor(mockRepository);
        factory = new AspectJProxyFactory(mockClient);
        factory.addAspect(interceptor);

        requestTime = LocalDateTime.now();
        responseTime = requestTime.plusSeconds(1);
    }

    @Test
    void whenCallHomeMethod_thenExistsHistoryData() {
        MockedStatic<LocalDateTime> mockedStatic = Mockito.mockStatic(LocalDateTime.class);
        when(LocalDateTime.now())
                .thenReturn(requestTime, responseTime)
                .thenCallRealMethod();
        when(mockClient.home()).thenReturn("home");


        SimpleClient proxy = factory.getProxy();
        proxy.home();


        ArgumentCaptor<InterfaceHistory> argumentCaptor = ArgumentCaptor.forClass(InterfaceHistory.class);
        verify(mockRepository).save(argumentCaptor.capture());

        InterfaceHistory entity = argumentCaptor.getValue();
        assertThat(entity.getServiceId(), equalTo("0001"));
        assertThat(entity.getPath(), equalTo(new String[]{"/"}));
        assertThat(entity.getExplainText(), equalTo("블로그 홈"));
        assertThat(entity.getResponse(), equalTo("home"));
        assertThat(entity.getRequestTime(), equalTo(Timestamp.valueOf(requestTime)));
        assertThat(entity.getResponseTime(), equalTo(Timestamp.valueOf(responseTime)));

        mockedStatic.close();
    }

    @Test
    void whenCallAboutMethod_thenExistsHistoryData() {
        MockedStatic<LocalDateTime> mockedStatic = Mockito.mockStatic(LocalDateTime.class);
        when(LocalDateTime.now())
                .thenReturn(requestTime, responseTime)
                .thenCallRealMethod();
        when(mockClient.about()).thenReturn("about");


        SimpleClient proxy = factory.getProxy();
        proxy.about();


        ArgumentCaptor<InterfaceHistory> argumentCaptor = ArgumentCaptor.forClass(InterfaceHistory.class);
        verify(mockRepository).save(argumentCaptor.capture());

        InterfaceHistory entity = argumentCaptor.getValue();
        assertThat(entity.getServiceId(), equalTo("0002"));
        assertThat(entity.getPath(), equalTo(new String[]{"/about/"}));
        assertThat(entity.getExplainText(), equalTo("자기소개"));
        assertThat(entity.getResponse(), equalTo("about"));
        assertThat(entity.getRequestTime(), equalTo(Timestamp.valueOf(requestTime)));
        assertThat(entity.getResponseTime(), equalTo(Timestamp.valueOf(responseTime)));

        mockedStatic.close();
    }
}
```

## CLOSING

좋지 않은 테스트 코드를 보완하는 데 많은 시간이 들었지만, 새로운 테스트 방법을 찾은 것만으로 크게 만족했다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-05-31-improve-feign-client-aop-test>

[annotation-based-aop-link]: https://junhyunny.github.io/spring-boot/spring-cloud/annotation-based-aop/
