---
title: "@Import, @ImportAutoConfiguration 애너테이션"
publishedAt: "2022-07-10"
updatedAt: "2026-11-12T16:18:19+09:00"
canonicalPath: "/spring-boot/import-auto-configuration-annotation/"
categories:
  - "spring-boot"
summary: "@Import 애너테이션과 @ImportAutoConfiguration 애너테이션으로 빈이 주입되는 방식을 @AutoConfigureDataJpa와 spring.factories 파일 예제로 정리했다."
---

## 0. 들어가면서

Spring 프레임워크에서는 특정 애너테이션만으로 많은 기능이 빈(bean)으로 주입된다. 무엇을 기준으로 필요한 빈이 주입되는지 궁금했는데, 최근 `@DataJpaTest` 애너테이션과 관련된 글을 쓰면서 스프링 애너테이션을 조금 더 알게 됐다. 이번 글에서는 알게 된 내용을 정리했다.

## 1. @Import 애너테이션

> Indicates one or more component classes to import<br/>

`@Import` 애너테이션은 임포트(import)할 클래스를 명시적으로 표시한다. 임포트된 클래스는 빈 객체로 추가된다. 공식 문서에 따르면 다음 조건을 만족하는 대상을 `@Import` 애너테이션에 추가해 사용한다.

- `@Configuration` 애너테이션이 추가된 클래스
  - 해당 클래스에서 `@Bean` 애너테이션으로 정의한 빈도 모두 사용할 수 있다.
- `@Component`, `@Service` 애너테이션이 붙은 클래스

### 1.1. @Import 활용 예제

간단한 테스트 코드로 빈이 정상적으로 주입되는지 확인해 보자. 먼저 `CustomConfiguration` 클래스는 `@Configuration` 애너테이션을 붙여 빈 객체를 정의한 설정 클래스다. `FirstBean`, `SecondBean` 클래스를 빈으로 정의한다.

```java
package blog.in.action.config;

import blog.in.action.beans.FirstBean;
import blog.in.action.beans.SecondBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CustomConfiguration {

    @Bean
    public FirstBean firstBean() {
        return new FirstBean();
    }

    @Bean
    public SecondBean secondBean() {
        return new SecondBean();
    }
}
```

`FirstBean`, `SecondBean` 클래스는 별도 기능이 없는 순수한 자바 클래스(POJO)다.

```java
package blog.in.action.beans;

public class FirstBean {

}
```

```java
package blog.in.action.beans;

public class SecondBean {

}
```

`ThirdBean` 클래스는 `@Component` 애너테이션이 붙은 클래스로, 빈 역할을 한다.

```java
package blog.in.action.beans;

import org.springframework.stereotype.Component;

@Component
public class ThirdBean {
}
```

`ImportTests` 클래스에서는 `@Import` 애너테이션에 빈으로 필요한 클래스를 명시적으로 추가하고, `@Autowired` 애너테이션으로 빈 객체가 주입되는지 테스트한다.

```java
package action.in.blog;

import blog.in.action.beans.FirstBean;
import blog.in.action.beans.SecondBean;
import blog.in.action.beans.ThirdBean;
import blog.in.action.config.CustomConfiguration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.notNullValue;

@Import(value = {
        CustomConfiguration.class,
        ThirdBean.class
})
@ExtendWith({SpringExtension.class})
public class ImportTests {

    @Autowired
    FirstBean firstBean;

    @Autowired
    SecondBean secondBean;

    @Autowired
    ThirdBean thirdBean;

    @Test
    public void whenRunTestWithSpringExtension_thenAllBeansNotNull() {

        assertThat(firstBean, notNullValue());
        assertThat(secondBean, notNullValue());
        assertThat(thirdBean, notNullValue());
    }
}
```

테스트 결과는 다음과 같다.

<div align="left">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/import-auto-configuration-annotation-01.png" width="100%" class="image__border">
</div>

## 2. @ImportAutoConfiguration 애너테이션

> Import and apply the specified auto-configuration classes.
> Applies the same ordering rules as @EnableAutoConfiguration but restricts the auto-configuration classes to the specified set, rather than consulting ImportCandidates.

`@ImportAutoConfiguration` 애너테이션은 지정된 `auto-configuration` 클래스를 가져와 적용한다. `@Import` 애너테이션과 비슷하지만, 대상 클래스를 따로 지정하지 않으면 `META-INF` 폴더의 `spring.factories` 파일에서 대상 클래스를 가져온다.

### 2.1. @ImportAutoConfiguration 애너테이션 사용 예시

이전에 살펴본 `@AutoConfigureDataJpa` 애너테이션으로 사용 예시를 살펴보자. `@AutoConfigureDataJpa` 애너테이션 위에는 `@ImportAutoConfiguration` 애너테이션이 추가되어 있다.

```java
package org.springframework.boot.test.autoconfigure.orm.jpa;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@ImportAutoConfiguration
public @interface AutoConfigureDataJpa {
}
```

`@AutoConfigureDataJpa` 애너테이션이 포함된 `spring-boot-test-autoconfigure.jar` 파일을 확인해 봤다. `/META-INF/spring.factories` 파일에 `AutoConfigureDataJpa` 애너테이션으로 임포트되는 클래스가 정의되어 있다.

<div class="block-break" align="left">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/import-auto-configuration-annotation-02.png" width="50%" class="image__border">
</div>

```
...

# AutoConfigureDataJpa auto-configuration imports
org.springframework.boot.test.autoconfigure.orm.jpa.AutoConfigureDataJpa=\
org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration,\
org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration,\
org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,\
org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration,\
org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration,\
org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration,\
org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,\
org.springframework.boot.autoconfigure.transaction.TransactionAutoConfiguration
```

### 2.2. @ImportAutoConfiguration 애너테이션 활용 예제

간단한 커스텀 애너테이션을 만들어 테스트해 보자. 패키지 구조는 다음과 같다. `/resources/META-INF` 폴더에 `spring.factories` 파일을 생성한다.

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
    │   │               ├── annotation
    │   │               │   └── CustomAutoConfiguration.java
    │   │               ├── beans
    │   │               │   ├── FirstBean.java
    │   │               │   ├── SecondBean.java
    │   │               │   └── ThirdBean.java
    │   │               └── config
    │   │                   └── CustomConfiguration.java
    │   └── resources
    │       ├── META-INF
    │       │   └── spring.factories
    │       ├── application.yml
    │       └── static
    └── test
        └── java
            └── action
                └── in
                    └── blog
                        ├── ImportAutoConfigurationTests.java
                        └── ImportTests.java
```

`@CustomAutoConfiguration` 애너테이션 위에는 `@ImportAutoConfiguration` 애너테이션을 추가한다.

```java
package blog.in.action.annotation;

import org.springframework.boot.autoconfigure.ImportAutoConfiguration;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@ImportAutoConfiguration
public @interface CustomAutoConfiguration {
}
```

`spring.factories` 파일에는 `@CustomAutoConfiguration` 애너테이션으로 임포트되는 클래스를 정의한다. 앞선 테스트에서 사용한 `CustomConfiguration`, `ThirdBean` 클래스를 명시했다.

```
blog.in.action.annotation.CustomAutoConfiguration=\
blog.in.action.config.CustomConfiguration,\
blog.in.action.beans.ThirdBean
```

`ImportAutoConfigurationTests` 클래스 상단에는 이번 글에서 만든 `@CustomAutoConfiguration` 애너테이션을 추가하고, `@Autowired` 애너테이션으로 빈 객체가 주입되는지 테스트한다.

```java
package action.in.blog;

import blog.in.action.annotation.CustomAutoConfiguration;
import blog.in.action.beans.FirstBean;
import blog.in.action.beans.SecondBean;
import blog.in.action.beans.ThirdBean;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.notNullValue;

@CustomAutoConfiguration
@ExtendWith({SpringExtension.class})
public class ImportAutoConfigurationTests {

    @Autowired
    FirstBean firstBean;

    @Autowired
    SecondBean secondBean;

    @Autowired
    ThirdBean thirdBean;

    @Test
    public void whenRunTestWithSpringExtension_thenAllBeansNotNull() {

        assertThat(firstBean, notNullValue());
        assertThat(secondBean, notNullValue());
        assertThat(thirdBean, notNullValue());
    }
}
```

테스트 결과는 다음과 같다.

<div align="left">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/import-auto-configuration-annotation-03.png" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-07-10-import-auto-configuration-annotation>

#### REFERENCE

- <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Import.html>
- <https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/autoconfigure/ImportAutoConfiguration.html>
- <https://stackoverflow.com/questions/59444679/when-to-use-importautoconfiguration-vs-import>
