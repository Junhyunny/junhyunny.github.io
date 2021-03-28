---
title: "@Bean, @Component 애너테이션의 차이"
search: false
category:
  - information
  - spring-boot
last_modified_at: 2021-03-27T00:00:00
---

<br>

최근 진행했던 면접 중에 이런 질문을 받았습니다. 

> @Bean 애너테이션과 @Component 애너테이션의 차이점은?

정확히는 기억나지 않지만 참 멍청하게 대답했던 것으로 기억납니다.

> 두 애너테이션 모두 빈(bean)을 만드는 애너테이션인데 
> @Bean 애너테이션은 @Configuration 애너테이션이 붙은 클래스의 메소드 위에 붙혀서 사용하고 
> @Component 애너테이션은 개발자가 만든 클래스 위에 붙혀서 사용합니다. 

면접이 끝나고 생각해보니 정리되지 않은 멍청한 답변이었습니다. 
면접관은 이런 식의 대답을 원하지 않았을 것 같습니다.😭 
두 애너테이션 사이의 차이점을 논리 정연하게 대답할 수 있도록 이번 포스트에서 정리해보도록 하겠습니다.

## @Bean 애너테이션

> 개발자가 제어하지 못하는 외부 라이브러리의 클래스를 빈(bean)으로 만들 때 사용합니다.<br>
> 다른 기능들이 추가한 빈(bean)을 만들 때 사용합니다.

##### @Bean 애너테이션 사용 예제
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

org.springframework.web.client 패키지 내부에 RestTemplate 클래스에 직접 @Component 애너테이션을 붙혀서 빈(bean)을 만들 수는 없습니다. 
이를 빈(bean)처럼 사용하려면 @Configuration 애너테이션이 붙은 클래스 내부에서 @Bean 애너테이션을 사용해야 합니다. 
**@Bean 애너테이션은 메소드에 사용 가능하다.**

## @Component 애너테이션

> 개발자가 직접 제어 가능한 클래스를 빈(bean)으로 만들 때 사용합니다.

##### @Component 애너테이션 사용 예제
```java
@Component
public class MyClass {}
```

### 개발자가 작성한 클래스 위에 @Bean 애너테이션 사용 가능?

> 불가능합니다.

위에서도 언급했듯이 @Bean 애너테이션은 메소드에 사용 가능합니다. 
@Target 애너테이션을 보면 ElementType.METHOD, ElementType.ANNOTATION_TYPE 만 가능하도록 되어 있습니다. 
그렇기 때문에 클래스 위에 선언하는 경우 컴파일 에러가 발생합니다.

##### @Bean 애너테이션 Target
```java
@Target({ElementType.METHOD, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Bean {
    ...
}
```

## OPINION
공부하지 않고 프로젝트를 위해 Spring Boot 프레임워크를 사용해서 그런지 근본이 없습니다. 
프레임워크와 관련된 서적이나 글을 읽어봤다면 무리없이 대답할 수 있는 질문이어서 아쉽습니다. 

#### REFERENCE
- <https://goodgid.github.io/Spring-Component-vs-Bean/>