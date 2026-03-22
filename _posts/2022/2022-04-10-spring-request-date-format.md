---
title: "Spring Request Date Format"
search: false
category:
  - spring-boot
last_modified_at: 2022-04-10T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Content-Type and Spring Boot Annotation][content-type-and-spring-annotation-link]

## 0. 들어가면서

스프링 프레임워크를 사용하는 레거시 시스템들을 돌이켜 보면 날짜 포맷을 문자열으로 넘겨 받는 경우가 종종 있었습니다. 
전달 받은 문자열을 `SimpleDateFormat` 클래스를 이용해 `Date` 객체로 변경하거나 문자열 그대로 데이터베이스에 저장하는 시스템도 있었습니다. 
이번 포스트에선 스프링 프레임워크를 이용할 때 API 엔드 포인트(end point)에서 시간 문자열 포맷을 쉽게 시간 관련 클래스로 변경하는 방법을 정리하였습니다. 

## 1. @JsonFormat 애너테이션 사용

스프링 프레임워크는 `application/json` 타입의 요청, 응답 메시지를 만들기 위해 기본적으로 `jackson` 라이브러리를 사용합니다. 
`@JsonFormat` 애너테이션은 `jackson` 라이브러리 기능이며, 해당 애너테이션을 사용하면 날짜 데이터를 특정 포맷으로 변경할 수 있습니다. 

다음과 같은 상황에 적용할 수 있습니다. 
- `Content-type`이 `application/json`이며 요청 메시지 클래스 앞에 `@RequestBody` 애너테이션이 붙은 경우
- `@RestController` 애너테이션이 붙은 컨트롤러의 응답을 처리하는 경우

##### Spring Framework Json Formatting
- 스프링 프레임워크은 기본적으로 `json` 타입 처리를 위해 `AbstractJackson2HttpMessageConverter` 클래스를 사용합니다.
- `AbstractJackson2HttpMessageConverter` 클래스 내부에서 다음과 같은 기능을 수행합니다.
    - `readJavaType` 메서드 - `json` 문자열을 `ObjectMapper` 객체를 이용하여 특정 클래스로 변경
    - `writeInternal` 메서드 - 특정 클래스를 `ObjectMapper` 객체를 이용하여 `json` 문자열로 변경

<p align="center">
  <img src="{{ site.image_url_2022 }}/spring-request-date-format-01.png" width="85%" class="image__border">
</p>

### 1.1. 구현 코드

- `JacksonRequest` 클래스
    - `@RequestBody` 애너테이션이 붙어서 요청 메시지를 해당 클래스를 통해 전달받습니다. 
    - `"yyyy-MM-dd HH:mm:ss.SSS"` 문자열 날짜 포맷을 `java.util.Date` 클래스로 전달받습니다.
    - `"yyyy-MM-dd HH:mm:ss.SSS"` 문자열 날짜 포맷을 `java.sql.Timestamp` 클래스로 전달받습니다.
    - `"yyyy-MM-dd HH:mm:ss.SSS"` 문자열 날짜 포맷을 `java.time.LocalDateTime` 클래스로 전달받습니다.
- `JacksonResponse` 클래스
    - `@RestController` 애너테이션이 붙은 컨트롤러 클래스의 리턴 값이므로 `json` 형태로 응답합니다.
    - `java.util.Date` 객체를 `"yyyy-MM-dd HH:mm:ss.SSS"` 문자열 날짜 포맷으로 응답합니다.
        - 미지정 시 `long`
    - `java.sql.Timestamp` 객체를 `"yyyy-MM-dd HH:mm:ss.SSS"` 문자열 날짜 포맷으로 응답합니다.
        - 미지정 시 `long`
    - `java.time.LocalDateTime` 객체를 `"yyyy-MM-dd HH:mm:ss.SSS"` 문자열 날짜 포맷으로 응답합니다.
        - 미지정 시 `"yyyy-MM-dd'T'HH:mm:ss.SSS"`

```java
package action.in.blog.controller;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Date;

@RestController
public class JacksonController {

    private static final String datePattern = "yyyy-MM-dd HH:mm:ss.SSS";

    @Getter
    @Setter
    @NoArgsConstructor
    public static class JacksonRequest {
        @JsonFormat(pattern = datePattern)
        private Date date;
        @JsonFormat(pattern = datePattern)
        private Timestamp timestamp;
        @JsonFormat(pattern = datePattern)
        private LocalDateTime localDateTime;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JacksonResponse {
        @JsonFormat(pattern = datePattern)
        private Date date;
        @JsonFormat(pattern = datePattern)
        private Timestamp timestamp;
        @JsonFormat(pattern = datePattern)
        private LocalDateTime localDateTime;
    }

    @PostMapping("/jackson")
    public JacksonResponse getJacksonDto(@RequestBody JacksonRequest request) {
        return JacksonResponse.builder()
                .date(request.getDate())
                .timestamp(request.getTimestamp())
                .localDateTime(request.getLocalDateTime())
                .build();
    }
}
```

### 1.2. 테스트 코드

- `Content-Type`을 `application/json`.
- 요청 메시지 데이터를 `ObjectMapper` 객체를 이용해 `json` 문자열 값으로 변경합니다.
    - 날짜, 시간을 `"yyyy-MM-dd HH:mm:ss.SSS"` 형태의 문자열로 전달합니다.
- 응답 메시지에 `"yyyy-MM-dd HH:mm:ss.SSS"` 형태의 문자열로 전달했던 데이터가 그대로 반환되었는지 확인합니다.

```java
package action.in.blog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.equalTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

public class JacksonControllerTests {

    @Test
    void givenStringDateFormat_whenGetJacksonDto_thenReturnJacksonResponse() throws Exception {

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("date", "2022-04-10 10:25:00.000");
        requestBody.put("timestamp", "2022-04-10 10:25:00.000");
        requestBody.put("localDateTime", "2022-04-10 10:25:00.000");

        ObjectMapper objectMapper = new ObjectMapper();

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new JacksonController()).build();

        mockMvc.perform(
                        post("/jackson")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(requestBody))
                )
                .andExpect(jsonPath("$.date", equalTo("2022-04-10 10:25:00.000")))
                .andExpect(jsonPath("$.timestamp", equalTo("2022-04-10 10:25:00.000")))
                .andExpect(jsonPath("$.localDateTime", equalTo("2022-04-10 10:25:00.000")));
    }
}
```

### 1.3. 응답 결과

```
% curl -X POST --header "Content-type: application/json" --header "X-USER-HEADER: NORMAL" --data "{\"date\": \"2022-04-10 10:25:00.000\", \"timestamp\": \"2022-04-10 10:25:00.000\", \"localDateTime\": \"2022-04-10 10:25:00.000\"}" http://localhost:8080/jackson | jq .

  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   233    0   114  100   119   9186   9589 --:--:-- --:--:-- --:--:--  113k
{
  "date": "2022-04-10 10:25:00.000",
  "timestamp": "2022-04-10 10:25:00.000",
  "localDateTime": "2022-04-10 10:25:00.000"
}
```

## 2. @DateTimeFormat 애너테이션 사용

`@DateTimeFormat` 애너테이션은 스프링 프레임워크에서 제공하고, 해당 애너테이션을 사용하면 날짜, 시간 형태를 쉽게 변경할 수 있습니다. 

다음과 같은 상황에 적용할 수 있습니다. 
- URL 뒤에 붙는 질의(query)에 날짜 형태의 문자열을 전달받는 경우
- 요청 메시지 클래스에 `@ModelAttribute` 애너테이션이 붙은 경우
    - 컨트롤러에서 별도 애너테이션 없이 클래스로 요청 메시지를 받는 경우 `@ModelAttribute` 애너테이션이 붙은 것과 동일합니다.
    - `Content-Type: application/x-www-form-urlencoded`인 경우 요청 메시지에 `@ModelAttribute` 애너테이션을 붙여 처리합니다.

##### Spring Framework DateTimeFormat 
- `URL`에 붙는 key-value 형태의 질의는 `AbstractNamedValueMethodArgumentResolver` 클래스 `resolveArgument` 메서드에 의해 처리됩니다.
- `@ModelAttribute` 애너테이션이 붙은 요청 메시지인 경우 `ModelAttributeMethodProcessor` 클래스 `resolveArgument` 메서드에 의해 처리됩니다.

<p align="center">
  <img src="{{ site.image_url_2022 }}/spring-request-date-format-02.png" width="85%" class="image__border">
</p>

### 2.1. 구현 코드

- `@DateTimeFormat` 애너테이션은 문자열을 `java.sql.Timestamp` 타입으로 변환 시 에러가 발생합니다.
- `requestParam` 메서드
    - URL 뒤에 붙은 key-value 형태의 질의를 통해 전달받는 데이터를 처리합니다.
- `modelAttribute` 메서드
    - URL 뒤에 붙은 key-value 형태의 질의를 통해 전달받는 데이터를 처리합니다.
    - `form` 태그를 통해 전달받는 요청 메시지를 처리합니다. 

```java
package action.in.blog.controller;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Date;

@RestController
public class DateTimeFormatController {

    private static final String datePattern = "yyyy-MM-dd HH:mm:ss.SSS";

    @Getter
    @Setter
    public static class ModelAttributeDto {
        @DateTimeFormat(pattern = datePattern)
        private Date date;
        @DateTimeFormat(pattern = datePattern)
        private LocalDateTime localDateTime;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JacksonResponse {
        @JsonFormat(pattern = datePattern, timezone = "Asia/Seoul")
        private Date date;
        @JsonFormat(pattern = datePattern, timezone = "Asia/Seoul")
        private LocalDateTime localDateTime;
    }

    @GetMapping("/request-param")
    public JacksonResponse requestParam(
            @DateTimeFormat(pattern = datePattern)
            @RequestParam("date") Date date,
            @DateTimeFormat(pattern = datePattern)
            @RequestParam("localDateTime") LocalDateTime localDateTime) {
        return JacksonResponse.builder()
                .date(date)
                .localDateTime(localDateTime)
                .build();
    }

    @PostMapping("/model-attribute")
    public JacksonResponse modelAttribute(@ModelAttribute ModelAttributeDto modelAttributeDto) {
        return JacksonResponse.builder()
                .date(modelAttributeDto.getDate())
                .localDateTime(modelAttributeDto.getLocalDateTime())
                .build();
    }
}
```

### 2.2. 테스트 코드

- `requestParam` 메서드 테스트
    - 날짜 형태 문자열을 요청 파라미터로 추가합니다.
    - 전달한 날짜를 그대로 응답으로 전달해주는지 확인합니다. 
- `modelAttribute` 메서드 테스트
    - `Content-type`을 `application/x-www-form-urlencoded`으로 지정합니다.
    - 날짜 형태 문자열을 요청 파라미터로 추가합니다.
    - 전달한 날짜를 그대로 응답으로 전달해주는지 확인합니다.

```java
package action.in.blog.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.equalTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

public class DateTimeFormatControllerTests {

    @Test
    void givenStringDateFormat_whenRequestParam_thenReturnJacksonResponse() throws Exception {

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new DateTimeFormatController()).build();

        mockMvc.perform(
                        get("/request-param")
                                .param("date", "2022-04-10 10:25:00.000")
                                .param("localDateTime", "2022-04-10 10:25:00.000")
                )
                .andExpect(jsonPath("$.date", equalTo("2022-04-10 10:25:00.000")))
                .andExpect(jsonPath("$.localDateTime", equalTo("2022-04-10 10:25:00.000")));
    }

    @Test
    void givenStringDateFormat_whenModelAttribute_thenReturnJacksonResponse() throws Exception {

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new DateTimeFormatController()).build();

        mockMvc.perform(
                        post("/model-attribute")
                                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                                .param("date", "2022-04-10 10:25:00.000")
                                .param("localDateTime", "2022-04-10 10:25:00.000")
                )
                .andExpect(jsonPath("$.date", equalTo("2022-04-10 10:25:00.000")))
                .andExpect(jsonPath("$.localDateTime", equalTo("2022-04-10 10:25:00.000")));
    }
}
```

### 2.3. 응답 결과

- `/request-param` 경로로 요청을 보냅니다. 
- URL 뒤에 요청 파라미터를 전달합니다.

```
% curl "http://localhost:8080/request-param?date=2020-04-10%2010:25:00.000&localDateTime=2020-04-10%2010:25:00.000" | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    76    0    76    0     0   5713      0 --:--:-- --:--:-- --:--:-- 38000
{
  "date": "2020-04-10 10:25:00.000",
  "localDateTime": "2020-04-10 10:25:00.000"
}
```

- `/model-attribute` 경로로 요청을 보냅니다. 
- URL 뒤에 요청 파라미터를 전달합니다.

```
curl -X POST "http://localhost:8080/model-attribute?date=2020-04-10%2010:25:00.000&localDateTime=2020-04-10%2010:25:00.000" | jq . 
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    76    0    76    0     0   5748      0 --:--:-- --:--:-- --:--:-- 38000
{
  "date": "2020-04-10 10:25:00.000",
  "localDateTime": "2020-04-10 10:25:00.000"
}
```

- `/model-attribute` 경로로 요청을 보냅니다. 
- `Content-type: x-www-form-urlencoded`으로 지정합니다.
- 요청 메시지를 key-value 형태로 전달합니다.

```
curl -X POST -H "Content-type: application/x-www-form-urlencoded" -d "date=2022-04-10+10:25:00.000&localDateTime=2022-04-10+10:25:00.000"  "http://localhost:8080/model-attribute" | jq .
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   142    0    76  100    66   5937   5156 --:--:-- --:--:-- --:--:-- 71000
{
  "date": "2022-04-10 10:25:00.000",
  "localDateTime": "2022-04-10 10:25:00.000"
}
```


#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-04-10-spring-request-data-format>

#### REFERENCE
- <https://jojoldu.tistory.com/361>
- <https://stackoverflow.com/questions/37871033/spring-datetimeformat-configuration-for-java-time>

[content-type-and-spring-annotation-link]: https://junhyunny.github.io/information/spring-boot/javascript/content-type-and-spring-annotation/
