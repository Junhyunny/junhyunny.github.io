---
title: "@Import, @ImportAutoConfiguration 애너테이션"
search: false
category:
  - spring-boot
last_modified_at: 2022-07-10T23:55:00
---

<br/>

## 0. 들어가면서

Spring 프레임워크에서 특정 애너테이션만으로 많은 기능들이 빈(bean)을 통해 주입됩니다. 
무엇을 기준으로 필요한 빈들이 주입되는지 궁금했는데, 최근 `@DataJpaTest` 애너테이션과 관련된 포스트를 작성하면서 스프링 애너테이션에 대해 조금 더 알게 되었습니다. 
이번 포스트에선 제가 알게된 내용들을 정리하였습니다. 

## 1. @Import 애너테이션

> Indicates one or more component classes to import<br/>

`@Import` 애너테이션은 임포트(import)하기 위한 클래스들을 명시적으로 표시합니다. 
임포트 된 클래스들은 빈 객체로 추가됩니다. 
공식 문서를 보면 다음과 같은 조건을 가진 대상을 `@Import` 애너테이션에 추가하여 사용하라고 되어 있습니다. 

* `@Configuration` 애너테이션이 추가된 클래스
    * 해당 클래스에서 `@Bean` 애너테이션으로 정의된 빈들도 모두 사용 가능합니다.
* `@Component`, `@Service` 애너테이션이 붙은 클래스

### 1.1. @Import 활용 예제

간단한 테스트 코드를 통해 빈들이 정상적으로 주입되는지 확인해보겠습니다. 

#### 1.1.1. CustomConfiguration 클래스

* `@Configuration` 애너테이션을 붙혀서 빈(bean) 객체들을 정의한 설정 클래스입니다.
* `FirstBean`, `SecondBean` 클래스를 빈으로 정의합니다.

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

#### 1.1.2. POJO 클래스

* 순수한 자바 클래스이며 별도로 기능은 없습니다.

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

#### 1.1.3. ThirdBean 클래스

* `@Component` 애너테이션이 붙은 클래스이며 빈 역할을 수행합니다.

```java
package blog.in.action.beans;

import org.springframework.stereotype.Component;

@Component
public class ThirdBean {
}
```

#### 1.1.4. ImportTests 클래스

* `@Import` 애너테이션에 빈으로써 필요한 클래스들을 명시적으로 추가합니다.
* `@Autowired` 애너테이션에 의해 빈 객체들이 주입 받는지 테스트를 통해 확인합니다.

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

##### 테스트 결과

<p align="left">
    <img src="/images/import-auto-configuration-annotation-1.JPG" width="80%" class="image__border">
</p>

## 2. @ImportAutoConfiguration 애너테이션

> Import and apply the specified auto-configuration classes. 
> Applies the same ordering rules as @EnableAutoConfiguration but restricts the auto-configuration classes to the specified set, rather than consulting ImportCandidates. 

지정된 `auto-configuration` 클래스들을 가져와서 적용합니다. 
`@Import` 애너테이션과 유사하지만, `@ImportAutoConfiguration` 애너테이션은 별도로 대상 클래스들을 지정하지 않으면 `META-INF` 폴더의 `spring.factories` 파일에서 대상 클래스들을 가져옵니다. 

### 2.1. @ImportAutoConfiguration 애너테이션 사용 예시

간단하게 이전에 살펴봤던 `@AutoConfigureDataJpa` 애너테이션을 기준으로 사용 예시를 살펴보겠습니다. 

### 2.1.1. @AutoConfigureDataJpa 애너테이션 

* `@AutoConfigureDataJpa` 애너테이션 위에 `@ImportAutoConfiguration` 애너테이션이 추가되어 있습니다.

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

#### 2.1.2. spring.factories 파일 살펴보기

* `@AutoConfigureDataJpa` 애너테이션이 포함된 `spring-boot-test-autoconfigure.jar` 파일을 확인해보았습니다. 
* `/META-INF/spring.factories` 파일에는 `AutoConfigureDataJpa` 애너테이션에 의해 임포트 되는 클래스들이 정의되어 있습니다.

<p align="left">
    <img src="/images/import-auto-configuration-annotation-2.JPG" width="50%" class="image__border">
</p>

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

간단하게 커스텀 애너테이션을 만들어 테스트해보겠습니다.

#### 2.2.1. 패키지 구조

* `/resources/META-INF` 폴더에 `spring.factories` 파일을 생성합니다.

```
./
├── mvnw
├── mvnw.cmd
├── pom.xml
└── src
    ├── main
    │   ├── java
    │   │   └── blog
    │   │       └── in
    │   │           └── action
    │   │               ├── ActionInBlogApplication.java
    │   │               ├── annotation
    │   │               │   └── CustomAutoConfiguration.java
    │   │               ├── beans
    │   │               │   ├── FirstBean.java
    │   │               │   ├── SecondBean.java
    │   │               │   └── ThirdBean.java
    │   │               └── config
    │   │                   └── CustomConfiguration.java
    │   └── resources
    │       ├── META-INF
    │       │   └── spring.factories
    │       ├── application.yml
    │       └── static
    └── test
        └── java
            └── action
                └── in
                    └── blog
                        ├── ImportAutoConfigurationTests.java
                        └── ImportTests.java
```

#### 2.2.2. @CustomAutoConfiguration 애너테이션

* `@ImportAutoConfiguration` 애너테이션을 위에 추가합니다.

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

#### 2.2.3. spring.factories 파일

* `@CustomAutoConfiguration` 애너테이션을 통해 임포트 되는 클래스들을 정의합니다.
    * 상위에서 테스트에서 사용한 `CustomConfiguration`, `ThirdBean` 클래스를 명시하였습니다.

```
blog.in.action.annotation.CustomAutoConfiguration=\
blog.in.action.config.CustomConfiguration,\
blog.in.action.beans.ThirdBean
```

#### 2.2.4. ImportAutoConfigurationTests 클래스

* 이번 포스트에서 만든 `@CustomAutoConfiguration` 애너테이션을 클래스 상단에 추가합니다.
* `@Autowired` 애너테이션에 의해 빈 객체들이 주입 받는지 테스트를 통해 확인합니다.

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

##### 테스트 결과

<p align="left">
    <img src="/images/import-auto-configuration-annotation-3.JPG" width="80%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-07-10-import-auto-configuration-annotation>

#### REFERENCE

* <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Import.html>
* <https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/autoconfigure/ImportAutoConfiguration.html>
* <https://stackoverflow.com/questions/59444679/when-to-use-importautoconfiguration-vs-import>