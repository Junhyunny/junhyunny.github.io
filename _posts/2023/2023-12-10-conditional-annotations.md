---
title: "@ConditionalOn- Annotations"
search: false
category:
  - java
  - spring-boot
last_modified_at: 2023-12-10T23:55:00
---

<br/>

## 1. @ConditionalOn- Annotations

스프링 빈(spring bean)을 선택적으로 주입 받기 위해 @Qualifier, @Primary, @Autowired 애너테이션들을 사용합니다. 이는 스프링 컨텍스트에 이미 생성된 스프링 빈들을 대상으로 어떤 빈을 주입 받을지 결정하는 방법입니다. 반대로 `@ConditionalOn-` 애너테이션을 사용하면 스프링 빈을 선택적으로 생성해 스프링 컨텍스트에 등록할 수 있습니다. @ConditionalOn- 애너테이션이 선언된 경우 해당 조건이 만족되야지 스프링 빈으로 등록됩니다.

스프링 프레임워크(spring framework)의 코드를 살펴보면 @ConditionalOn- 애너테이션들이 많이 사용됩니다. 일반적인 애플리케이션을 개발한다면 사용할 일이 별로 없지만, 프레임워크 기능을 확장한다거나 라이브러리를 만들 때 주로 사용합니다. 다음과 같은 용도로 사용됩니다.

- 특정 상황 혹은 설정 값이 만족했을 때 필요한 빈을 생성
- 프레임워크에 필요한 스프링 빈이 별도로 선언되지 않았을 때 디폴트(default) 빈을 생성

@ConditionalOn- 애너테이션 종류는 매우 많으므로 모두 정리하는 것은 사실 무의미합니다. 선택적인 스프링 빈 생성이 필요한 상황일 때 적절한 조건을 만들 수 있는 애너테이션이 있는지 찾아보는 것이 좋습니다. 

## 2. Annotaiton Targets

@ConditionalOn- 애너테이션을 적용할 수 있는 대상들을 하나씩 알아보겠습니다. 먼저 자주 사용되는 @ConditionalOnProperty 애너테이션을 예시로 살펴보겠습니다.

### 2.1. Bean Method

빈을 생성하는 메소드를 대상으로 적용할 수 있습니다. application.yml 파일에 지정된 설정 값을 기준으로 동작합니다.

- property.foo 설정 값이 `enabled`인 경우 
    - 이름이 "foo.enabled"인 FooService 객체가 빈으로 등록됩니다.
- property.foo 설정 값이 `disabled`인 경우 
    - 이름이 "foo.disabled"인 FooService 객체가 빈으로 등록됩니다.
    - 매칭되는 설정이 없는 경우 해당 객체가 스프링 빈으로 등록됩니다.

```java
package action.in.blog.config;

import action.in.blog.service.FooService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration
public class FooConfig {

    @ConditionalOnProperty(
            prefix = "property",
            value = "foo",
            havingValue = "enabled"
    )
    @Bean
    public FooService fooService() {
        return new FooService("foo.enabled");
    }

    @ConditionalOnProperty(
            prefix = "property",
            value = "foo",
            havingValue = "disabled",
            matchIfMissing = true
    )
    @Bean
    public FooService disabledFooService() {
        return new FooService("foo.disabled");
    }
}
```

### 2.2. Configuration Class

스프링 빈을 선언하는 @Configuration 객체에도 적용할 수 있습니다. 조건 만족 여부에 따라 해당 클래스에 선언된 모든 스프링 빈들이 선택적으로 스프링 컨텍스트에 등록됩니다.

- property.ba-components 설정 값이 `enabled`인 경우
    - BarService, BazService 객체가 스프링 빈으로 등록됩니다.

```java
package action.in.blog.config;

import action.in.blog.service.BarService;
import action.in.blog.service.BazService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@ConditionalOnProperty(prefix = "property", name = "ba-components", havingValue = "enabled")
@Configuration
public class BaConfig {

    @Bean
    public BarService barService() {
        return new BarService();
    }

    @Bean
    public BazService bazService() {
        return new BazService();
    }
}
```

### 2.3. Stereo Type Bean

@Component, @Controller, @RestController, @Service, @Repository 같은 애너테이션이 붙은 스테레오 타입 스프링 빈에도 적용할 수 있습니다. 이번엔 @ConditionalOnBean, @ConditionalOnMissingBean 애너테이션을 사용한 예제를 살펴보겠습니다.

- @ConditionalOnBean 애너테이션을 사용해 BarService 스프링 빈이 등록된 경우 함께 등록합니다.

```java
package action.in.blog.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;

@ConditionalOnBean(value = {BarService.class})
@Service
public class FooBarService {
}
```

- @ConditionalOnMissingBean 애너테이션을 사용해 BarService 스프링 빈이 없는 경우에만 등록합니다.

```java
package action.in.blog.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;

@ConditionalOnMissingBean(value = {BarService.class})
@Service
public class BarFooService {
}
```

## 3. Test

@ConditionalOn- 애너테이션을 적용할 수 있는 케이스들을 예제 코드를 통해 살펴보면서 5개의 스프링 빈들을 함께 준비하였습니다.

- BarFooService
- BarService
- BazService
- FooBarService
- FooService

각 객체들이 조건에 맞게 스프링 빈으로 생성되는지 살펴보겠습니다. 스프링 빈이 조건에 따라 선택적으로 생성되기 때문에 @Autowired 애너테이션의 필수 속성은 false 값으로 지정합니다.

### 3.1. DefaultProfileActiveTests Class

- property.ba-components 설정 값이 없습니다.
    - barService 객체가 스프링 빈으로 등록되지 않습니다.
    - bazService 객체가 스프링 빈으로 등록되지 않습니다.
- barService 객체가 스프링 빈으로 등록되지 않았습니다.
    - barFooService 객체는 스프링 빈으로 등록됩니다.
    - foobarService 객체가 스프링 빈으로 등록되지 않습니다.
- property.foo 설정 값이 없습니다.
    - fooService 객체가 스프링 빈으로 등록됩니다.
    - 이름은 "foo.disabled" 입니다.

```java
package action.in.blog;

import action.in.blog.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class DefaultProfileActiveTests {

    @Autowired(required = false)
    BarFooService barFooService;

    @Autowired(required = false)
    BarService barService;

    @Autowired(required = false)
    BazService bazService;

    @Autowired(required = false)
    FooBarService foobarService;

    @Autowired(required = false)
    FooService fooService;

    @Test
    void contextLoads() {

        assertNotNull(barFooService);
        assertNull(barService);
        assertNull(bazService);
        assertNull(foobarService);
        assertNotNull(fooService);
        assertEquals("foo.disabled", fooService.getName());
    }
}
```

### 3.2. BaProfileActiveTests Class

- property.ba-components 설정 값이 `enabled`입니다.
    - barService 객체가 스프링 빈으로 등록됩니다.
    - bazService 객체가 스프링 빈으로 등록됩니다.
- barService 객체가 스프링 빈으로 등록되었습니다.
    - barFooService 객체는 스프링 빈으로 등록되지 않습니다.
    - foobarService 객체가 스프링 빈으로 등록됩니다.
- property.foo 설정 값이 없습니다.
    - fooService 객체가 스프링 빈으로 등록됩니다.
    - 이름은 "foo.disabled" 입니다.

```java
package action.in.blog;

import action.in.blog.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(
        properties = "property.ba-components=enabled"
)
class BaProfileActiveTests {

    @Autowired(required = false)
    BarFooService barFooService;

    @Autowired(required = false)
    BarService barService;

    @Autowired(required = false)
    BazService bazService;

    @Autowired(required = false)
    FooBarService foobarService;

    @Autowired(required = false)
    FooService fooService;

    @Test
    void contextLoads() {

        assertNull(barFooService);
        assertNotNull(barService);
        assertNotNull(bazService);
        assertNotNull(foobarService);
        assertNotNull(fooService);
        assertEquals("foo.disabled", fooService.getName());
    }
}
```

### 3.3. FooProfileActiveTests Class

- property.ba-components 설정 값이 없습니다.
    - barService 객체가 스프링 빈으로 등록되지 않습니다.
    - bazService 객체가 스프링 빈으로 등록되지 않습니다.
- barService 객체가 스프링 빈으로 등록되지 않았습니다.
    - barFooService 객체는 스프링 빈으로 등록됩니다.
    - foobarService 객체가 스프링 빈으로 등록되지 않습니다.
- property.foo 설정 값이 `enabled`입니다.
    - fooService 객체가 스프링 빈으로 등록됩니다.
    - 이름은 "foo.enabled" 입니다.

```java
package action.in.blog;

import action.in.blog.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(
        properties = "property.foo=enabled"
)
class FooProfileActiveTests {


    @Autowired(required = false)
    BarFooService barFooService;

    @Autowired(required = false)
    BarService barService;

    @Autowired(required = false)
    BazService bazService;

    @Autowired(required = false)
    FooBarService foobarService;

    @Autowired(required = false)
    FooService fooService;

    @Test
    void contextLoads() {

        assertNotNull(barFooService);
        assertNull(barService);
        assertNull(bazService);
        assertNull(foobarService);
        assertNotNull(fooService);
        assertEquals("foo.enabled", fooService.getName());
    }
}
```

## CLOSING

책 집필을 위해 스프링 시큐리티 프레임워크 내부를 탐구하면서 적용된 디자인 패턴이나 평소 사용하지 않던 프레임워크 기능들을 마주치면서 정말 많은 공부가 되는 것 같습니다. 

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-12-10-conditional-annotations>

#### REFERENCE

- <https://reflectoring.io/spring-boot-conditionals/>
- <https://oingdaddy.tistory.com/476>