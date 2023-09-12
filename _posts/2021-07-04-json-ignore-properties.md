---
title: "StackOverFlowError and @JsonIgnoreProperties Annotation"
search: false
category:
  - spring-boot
  - junit
last_modified_at: 2021-09-04T13:00:00
---

<br/>

<!-- ## 1. Problem Context

## 2. Problem Analysis

## 3. Solve the problem -->

## 1. Circular Reference

Jackson 라이브러리를 통해 직렬화(Serialize) 된 Json 응답을 받는 경우 종종 StackOverFlowError가 발생합니다. 
이런 경우 대부분 객체 사이의 순환 참조가 문제 발생의 원인입니다. 

### 1.1. 순환 참조 예시

- A 인스턴스가 B 인스턴스를 참조합니다.
- B 인스턴스가 A 인스턴스를 참조합니다.
- A 인스턴스를 직렬화하는 경우 참조하는 B 인스턴스가 함께 직렬화됩니다.
- B 인스턴스를 직렬화하는 경우 참조하는 A 인스턴스가 함게 직렬화됩니다.
- 이를 계속 반복 수행하다 StackOverFlow 에러가 발생합니다.

<p align="center"><img src="/images/json-ignore-properties-1.jpg" width="65%"></p>

직렬화 시점에 둘 사이의 순환 참조를 끊어주기 위한 방법으로 `@JsonIgnoreProperties` 애너테이션을 사용합니다. 
`@JsonIgnoreProperties` 애너테이션을 살펴보면 다양한 위치에서 사용할 수 있음을 확인할 수 있습니다.

- ElementType.ANNOTATION_TYPE - 애너테이션
- ElementType.TYPE - 클래스, 인터페이스, enum
- ElementType.METHOD - 메소드
- ElementType.CONSTRUCTOR - 생성자
- ElementType.FIELD - 필드(멤버변수, enum 상수)

```java
@Target({ElementType.ANNOTATION_TYPE, ElementType.TYPE, ElementType.METHOD, ElementType.CONSTRUCTOR, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@JacksonAnnotation
public @interface JsonIgnoreProperties {

    /**
     * Names of properties to ignore.
     */
    public String[] value() default { };

    // ...
}
```

저의 경우 주로 필드에 사용하며 다음과 같은 동작이 수행되도록 클래스를 구성합니다. 

### 1.2. 순환 참조 방지 예시
- A 인스턴스가 B 인스턴스를 참조합니다.
- B 인스턴스가 A 인스턴스를 참조합니다.
- A 인스턴스를 직렬화하는 경우 참조하는 B 인스턴스가 함께 직렬화됩니다.
- B 인스턴스를 직렬화하는 경우 @JsonIgnoreProperties 애너테이션을 통해 지정한 항목을 제외하고 직렬화를 수행합니다.

<p align="center"><img src="/images/json-ignore-properties-2.jpg" width="75%"></p>

## 2. 테스트 코드

간단한 테스트 코드를 통해 만날 수 있는 에러 상황과 해결 방법에 대해 알아보도록 하겠습니다. 

### 2.1. Dto 클래스

- ADto, BDto, CDto 클래스를 작성합니다.
- ADto 클래스와 BDto 클래스는 서로 순환 참조합니다.
- ADto 클래스와 CDto 클래스는 서로 순환 참조합니다.
- ADto 인스턴스를 직렬화할 때 CDto 인스턴스의 "adto" 필드는 제외하고 직렬화를 수행합니다.

```java
@Getter
@Setter
@NoArgsConstructor
class ADto {

    public ADto(BDto bdto) {
        this.bdto = bdto;
    }

    public ADto(CDto cdto) {
        this.cdto = cdto;
    }

    private BDto bdto;

    @JsonIgnoreProperties(value = {"adto"})
    private CDto cdto;
}

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
class BDto {

    private ADto adto;
}

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
class CDto {

    private String name = "CDto";

    private ADto adto;
}
```

### 2.2. ErrorController 클래스
- error 메소드는 ADto 인스턴스와 BDto 인스턴스의 순환 참조를 만들어 반환합니다.
- ok 메소드는 ADto 인스턴스와 CDto 인스턴스의 순환 참조를 만들어 반환합니다.

```java
@RestController
class ErrorController {

    @GetMapping("/error")
    public ADto error() {
        ADto aDto = new ADto(new BDto());
        aDto.getBdto().setAdto(aDto);
        return aDto;
    }

    @GetMapping("/ok")
    public ADto ok() {
        ADto aDto = new ADto(new CDto());
        aDto.getCdto().setAdto(aDto);
        return aDto;
    }
}
```

### 2.3. test_withoutJsonIgnoreProperties_throwStackOverFlowException 메소드
- `@JsonIgnoreProperties` 애너테이션이 적용되지 않은 `/error` 경로로 API 요청을 수행합니다.
- 서블릿(Servlet) 영역에서 직렬화 수행 중에 에러가 발생하기 때문에 NestedServletException을 예상할 수 있습니다.

```java
    @Test
    public void test_withoutJsonIgnoreProperties_throwNestedServletException() {
        assertThrows(NestedServletException.class, () -> {
            try {
                mockMvc.perform(get("/error"));
            } catch (Exception e) {
                log.error(e);
                throw e;
            }
        });
    }
```

##### test_withoutJsonIgnoreProperties_throwStackOverFlowException 메소드 수행 결과
- NestedServletException이 발생하여 테스트를 통과합니다.
- 아래와 같은 로그를 확인할 수 있습니다.

```
org.springframework.web.util.NestedServletException: Request processing failed; nested exception is org.springframework.http.converter.HttpMessageConversionException: JSON mapping problem: blog.in.action.jackson.ADto["bdto"]->blog.in.action.jackson.BDto["adto"]-> ...
    at org.springframework.web.servlet.FrameworkServlet.processRequest(FrameworkServlet.java:1014) ~[spring-webmvc-5.2.4.RELEASE.jar:5.2.4.RELEASE]
    at org.springframework.web.servlet.FrameworkServlet.doGet(FrameworkServlet.java:898) ~[spring-webmvc-5.2.4.RELEASE.jar:5.2.4.RELEASE]
    at javax.servlet.http.HttpServlet.service(HttpServlet.java:634) ~[tomcat-embed-core-9.0.31.jar:9.0.31]
...

Caused by: org.springframework.http.converter.HttpMessageConversionException: JSON mapping problem: blog.in.action.jackson.ADto["bdto"]->blog.in.action.jackson.BDto["adto"]->blog.in.action.jackson.ADto["bdto"]->blog.in.action.jackson.BDto["adto"]->...
    at org.springframework.http.converter.json.AbstractJackson2HttpMessageConverter.writeInternal(AbstractJackson2HttpMessageConverter.java:306) ~[spring-web-5.2.4.RELEASE.jar:5.2.4.RELEASE]
    at org.springframework.http.converter.AbstractGenericHttpMessageConverter.write(AbstractGenericHttpMessageConverter.java:104) ~[spring-web-5.2.4.RELEASE.jar:5.2.4.RELEASE]
    at org.springframework.web.servlet.mvc.method.annotation.AbstractMessageConverterMethodProcessor.writeWithMessageConverters(AbstractMessageConverterMethodProcessor.java:287) ~[spring-webmvc-5.2.4.RELEASE.jar:5.2.4.RELEASE]
...

Caused by: com.fasterxml.jackson.databind.JsonMappingException: Infinite recursion (StackOverflowError) (through reference chain: blog.in.action.jackson.ADto["bdto"]->blog.in.action.jackson.BDto["adto"]->blog.in.action.jackson.ADto["bdto"]->...
    at com.fasterxml.jackson.databind.ser.std.BeanSerializerBase.serializeFields(BeanSerializerBase.java:737) ~[jackson-databind-2.10.2.jar:2.10.2]
    at com.fasterxml.jackson.databind.ser.BeanSerializer.serialize(BeanSerializer.java:166) ~[jackson-databind-2.10.2.jar:2.10.2]
    at com.fasterxml.jackson.databind.ser.BeanPropertyWriter.serializeAsField(BeanPropertyWriter.java:727) ~[jackson-databind-2.10.2.jar:2.10.2]
    at com.fasterxml.jackson.databind.ser.std.BeanSerializerBase.serializeFields(BeanSerializerBase.java:722) ~[jackson-databind-2.10.2.jar:2.10.2]
```

### 2.4. test_withJsonIgnoreProperties_isOk 메소드
- `@JsonIgnoreProperties` 애너테이션이 적용된 `/ok` 경로로 API 요청을 수행합니다.

```java
    @Test
    public void test_withJsonIgnoreProperties_isOk() throws Exception {
        mockMvc.perform(get("/ok"))
            .andExpect(status().isOk())
            .andDo(print());
    }
```

##### test_withJsonIgnoreProperties_isOk 메소드 수행 결과
- 에러 없이 테스트가 통과합니다.
- `{"bdto":null,"cdto":{"name":"CDto"}}` 응답을 받았음을 로그를 통해 확인이 가능합니다. 

```
MockHttpServletRequest:
      HTTP Method = GET
      Request URI = /ok
       Parameters = {}
          Headers = []
             Body = <no character encoding set>
    Session Attrs = {}

Handler:
             Type = blog.in.action.jackson.ErrorController
           Method = blog.in.action.jackson.ErrorController#ok()

Async:
    Async started = false
     Async result = null

Resolved Exception:
             Type = null

ModelAndView:
        View name = null
             View = null
            Model = null

FlashMap:
       Attributes = null

MockHttpServletResponse:
           Status = 200
    Error message = null
          Headers = [Content-Type:"application/json"]
     Content type = application/json
             Body = {"bdto":null,"cdto":{"name":"CDto"}}
    Forwarded URL = null
   Redirected URL = null
          Cookies = []
```

## CLOSING
개발 초기에 이런 에러를 많이 만났었습니다. 
양방향 참조가 되도록 JPA 엔티티(Entity) 설계를 해놓은 모습이 컨트롤러 영역까지 그대로 반영되는 경우 주로 발생하였습니다. 

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-07-04-json-ignore-properties>