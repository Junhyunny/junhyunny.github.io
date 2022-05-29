---
title: "Annotation based AOP(Aspect Oriented Programming)"
search: false
category:
  - spring-boot
  - spring-cloud
last_modified_at: 2022-05-29T23:55:00
---

<br>

👉 해당 포스트를 읽는데 도움을 줍니다.
[Spring Cloud Openfeign][openfeign-blog-link] 

## 0. 들어가면서

백엔드 서비스에서 다른 서비스로 API 요청할 때 이력을 남겨야하는 요구 사항이 있었습니다. 
API 요청을 수행하는 코드들을 모두 찾아가며 필요한 로직을 추가하는 것보단 AOP(Aspect Oriented Programming)를 사용하면 좋겠다는 생각이 들었습니다. 
API 요청을 위해 사용했던 `@FeignClient`와 커스텀 애너테이션을 기반으로 AOP 기능을 활용하는 방법에 대해 정리하였습니다. 

## 1. API 요청 이력 정보 도메인

API 요청, 응답 정보를 저장하는 엔티티(entity), 레포지토리(repository) 그리고 컨버터(converter)에 대해 정리하였습니다.

### 1.1. InterfaceHistory 클래스

- 요청 정보를 저장하는 엔티티이며 다음과 같은 정보들을 저장합니다.
    - id - 아이디
    - serviceId - 서비스 아이디
    - path - 요청 경로
    - explainText - 요청에 대한 설명
    - requestTime - 요청 시간
    - responseTime - 응답 시간

```java
package blog.in.action.repository;

import blog.in.action.converter.StringArrayConverter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.sql.Timestamp;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class InterfaceHistory {

    @Id
    @GeneratedValue
    private long id;
    private String serviceId;
    @Convert(converter = StringArrayConverter.class)
    private String[] path;
    private String explainText;
    private Timestamp requestTime;
    private Timestamp responseTime;
}
```

### 1.2. InterfaceHistoryRepository 인터페이스

- `JpaRepository` 인터페이스를 상속받아 JPA 기능을 사용합니다.

```java
package blog.in.action.repository;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InterfaceHistoryRepository extends JpaRepository<InterfaceHistory, Long> {
}
```

### 1.3. StringArrayConverter 클래스

- 데이터베이스에는 문자열 배열을 저장할 수 없기 때문에 이를 변경해주는 클래스입니다.
- 엔티티의 문자열 배열을 데이터베이스에 문자열로 저장합니다.
- 데이터베이스에 저장된 문자열을 엔티티의 문자열 배열에 담습니다.
- 적절한 구분자를 사용합니다.

```java
package blog.in.action.converter;

import javax.persistence.AttributeConverter;
import javax.persistence.Converter;

@Converter
public class StringArrayConverter implements AttributeConverter<String[], String> {

    private static final String SPLIT_CHAR = ";";

    @Override
    public String convertToDatabaseColumn(String[] attribute) {
        return attribute == null ? null : String.join(SPLIT_CHAR, attribute);
    }

    @Override
    public String[] convertToEntityAttribute(String dbData) {
        return dbData == null ? new String[]{} : dbData.split(SPLIT_CHAR);
    }
}
```

## 2. 애너테이션 기반 AOP 구현 

필요한 커스텀 애너테이션과 AOP 기능을 구현하였습니다.

### 2.1. InterfaceMeta 커스텀 애너테이션

- API 요청에 대한 메타 정보를 담기 위해 사용하는 애너테이션입니다.
    - `@Target(ElementType.METHOD)` - 해당 애너테이션은 메소드에 사용 가능합니다.
    - `@Retention(RetentionPolicy.RUNTIME)` - 해당 애너테이션은 런타임에 사용할 수 있습니다.
- 다음과 같은 속성 값을 가지고 있습니다.
    - `explainText()` - 어떤 API 요청인지 설명을 추가합니다.
    - `serviceId()` - 해당 API가 어떤 요청인지 비즈니스 적인 코드를 작성합니다.

```java
package blog.in.action.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface InterfaceMeta {

    String explainText();
    String serviceId();
}
```

### 2.2. SimpleClient 클래스

- `home()` - `Junhyunny` 블로그 홈 정보를 요청합니다.
- `about()` - 블로그 주인의 자기 소개 페이지를 요청합니다.

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

### 2.3. InterfaceHistoryInterceptor 클래스

- `aroundCallFeignClient(ProceedingJoinPoint pjp)` 메소드
    - `@Around` 애너테이션을 추가하여 타겟 메소드 실행 전, 후 시점에 필요한 기능을 삽입할 것이라 표시합니다.
        - `@within(Annotaion)` - `@Annotaion` 애너테이션 붙은 클래스 안에 정의된 코드와 연관된 조인 포인트(join point)
        - `@annotation(Annotaion)` - `@Annotaion` 애너테이션이 대상과 연관된 조인 포인트
    - `ProceedingJoinPoint` 객체의 `proceed` 메소드 실행 전, 후 시점에 필요한 기능을 삽입합니다.
    - 이력 성격의 데이터를 추가하면서 발생하는 예외가 비즈니스 로직에 영향을 주지 않도록 `try-catch` 구문으로 감쌉니다.
- `getPath(Annotation[] annotations)` 메소드
    - 해당 메소드에서 요청하는 경로(`path`) 값을 반환합니다.

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
import java.util.Date;

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

    @Around("@within(org.springframework.cloud.openfeign.FeignClient) && @annotation(blog.in.action.annotation.InterfaceMeta)")
    public Object aroundCallFeignClient(ProceedingJoinPoint pjp) throws Throwable {
        Timestamp requestTime = new Timestamp(new Date().getTime());

        Object result = pjp.proceed();

        try {
            Timestamp responseTime = new Timestamp(new Date().getTime());
            MethodSignature signature = (MethodSignature) pjp.getSignature();
            Method method = signature.getMethod();
            InterfaceMeta interfaceMeta = method.getAnnotation(InterfaceMeta.class);
            Annotation[] annotations = method.getDeclaredAnnotations();

            InterfaceHistory interfaceHistory = InterfaceHistory
                    .builder()
                    .serviceId(interfaceMeta.serviceId())
                    .explainText(interfaceMeta.explainText())
                    .path(getPath(annotations))
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

## 3. 테스트 코드

### 3.1. 테스트 용 application.yml

- 테스트에서만 사용할 설정 파일을 추가합니다.
    - 경로 - `/src/test/resources/application.yml`

```yml
spring:
  datasource:
    driver-class-name: org.h2.Driver
    url: jdbc:h2:~/test
    username: sa
    password:
  jpa:
    show-sql: true
    hibernate:
      ddl-auto: create-drop
    open-in-view: false
  h2:
    console:
      path: /h2-console
      enabled: true
```

### 3.2. SimpleClientIT 클래스

- 스프링 컨텍스트의 기능을 사용하기 때문에 결합 테스트로 작성합니다.
- `home()` 메소드 테스트
    - `home()` 메소드 호출 후 데이터베이스에 데이터가 존재하는지 확인합니다.
    - `@Transactional` 애너테이션을 붙혀 테스트 이후 저장한 데이터는 다음 테스트에 영향이 없도록 롤백합니다.
- `about()` 메소드 테스트
    - `about()` 메소드 호출 후 데이터베이스에 데이터가 존재하는지 확인합니다.
    - `@Transactional` 애너테이션을 붙혀 테스트 이후 저장한 데이터는 다음 테스트에 영향이 없도록 롤백합니다.

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

        assertThat(repository.count(), equalTo(1L));
    }

    @Test
    @Transactional
    public void whenCallAboutMethod_thenExistsHistoryData() {

        simpleClient.about();

        assertThat(repository.count(), equalTo(1L));
    }
}
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-05-28-annotation-based-aop>

#### REFERENCE

- <https://ecogeo.tistory.com/332>
- <https://stackoverflow.com/questions/21275819/how-to-get-a-methods-annotation-value-from-a-proceedingjoinpoint>

[openfeign-blog-link]: https://junhyunny.github.io/spring-boot/spring-cloud/spring-cloud-openfeign/