---
title: "@Bean 애너테이션과 @Component 애너테이션의 차이"
search: false
category:
  - spring-boot
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

## 1. @Bean Annotation

@Bean 애너테이션은 개발자가 제어하지 못하는 외부 클래스를 빈(bean) 객체로 만들 때 사용한다. `org.springframework.web.client` 패키지 내부에 존재하는 `RestTemplate` 클래스를 예시로 살펴보자.

- 클래스 형태로 제공되므로 개발자가 직접 코드를 수정할 수 없다.
  - `RestTemplate` 클래스 위에 `@Component` 애너테이션을 붙여서 빈 객체로 만들 수 없다.
- `RestTemplate` 객체를 빈으로 사용하려면 `@Bean` 애너테이션이 붙은 메서드를 사용한다.
  - 스프링(spring) 프레임워크가 해당 빈을 만들 수 있도록 `@Configuration` 애너테이션이 붙은 클래스 내부에 메서드를 선언한다.

```java
import org.springframework.web.client.RestTemplate;

@Configuration
public class Config {
    @Bean
    public RestTemplate restTemplate(){
        return new RestTemplate();
    }
}
```

`@Bean` 애너테이션은 클래스 위에 사용하지 못한다.

- 적용 타겟은 메서드, 애너테이션 타입에만 적용 가능하다.
- 클래스 위에 선언하는 경우 컴파일 에러가 발생한다.

```java
package org.springframework.context.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.beans.factory.annotation.Autowire;
import org.springframework.core.annotation.AliasFor;

@Target({ElementType.METHOD, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Bean {
    @AliasFor("name")
    String[] value() default {};

    @AliasFor("value")
    String[] name() default {};

    /** @deprecated */
    @Deprecated
    Autowire autowire() default Autowire.NO;

    boolean autowireCandidate() default true;

    String initMethod() default "";

    String destroyMethod() default "(inferred)";
}
```

## 2. @Component Annotaion

@Component 애너테이션은 개발자가 직접 제어 가능한 클래스를 빈 객체로 만들 때 사용한다.

- 개발자가 제어할 수 있는 클래스 코드 위에 붙여서 사용한다.
- 스프링 프레임워크가 필요한 컨텍스트를 준비할 때 해당 클래스 객체를 빈으로 생성한다.

```java
@Component
public class MyClass {}
```

개발자가 정의한 클래스를 빈 객체로 만들 때 `@Component` 애너테이션으로만 사용 가능한 것은 아니다. 객체 성격에 따라 사용하는 애너테이션이 다르며, 다음과 같은 애너테이션들을 통해 빈을 생성할 수 있다.

- @Controller
- @RestController
- @Service
- @Repository
- @Configuration

애너테이션 별로 특징이 있으며, 만들어진 빈 객체에 따라 동작이 일부 다를 수 있다. 해당 애너테이션들의 내부를 살펴보면 `@Component` 애너테이션이 함께 정의된 것을 볼 수 있다. 예를 들어, @Configuration 애너테이션을 살펴보자.

```java
package org.springframework.context.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.core.annotation.AliasFor;
import org.springframework.stereotype.Component;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component
public @interface Configuration {
    @AliasFor(
        annotation = Component.class
    )
    String value() default "";

    boolean proxyBeanMethods() default true;
}
```

#### REFERENCE

- <https://goodgid.github.io/Spring-Component-vs-Bean/>
