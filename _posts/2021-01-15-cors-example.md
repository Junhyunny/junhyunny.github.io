---
title: "CORS(Cross Origin Resource Sharing) with Spring Boot"
search: false
category:
  - spring-boot
  - vue.js
last_modified_at: 2021-08-21T23:50:00
---

<br/>

#### 다음 사항을 주의하세요.

* `{ { someValue } }`으로 표기된 코드는 띄어쓰기를 붙여야지 정상적으로 동작합니다.

#### RECOMMEND POSTS BEFORE THIS

* [CORS(Cross Origin Resource Sharing)][cors-link] 

## 0. 들어가면서

[CORS(Cross Origin Resource Sharing)][cors-link] 포스트 마지막에 CORS 정책 위반 에러를 방지할 수 있는 방법을 두 가지 소개했습니다. 

* 프론트엔드 서비스의 프록시 기능을 사용하여 교차 호출이 발생하지 않도록 우회
* 백엔드 서비스에서 CORS 허용 헤더를 응답

이번 포스트는 `Spring Boot` 프레임워크로 구현한 백엔드 서비스에서 `CORS`를 다루는 예제입니다. 
간단한 프론트엔드 서비스를 함께 구성하여 CORS 에러를 살펴보겠습니다. 

## 1. 프론트엔드 서비스

각 버튼 별로 어떤 동작을 하는지 간단히 살펴보겠습니다.

* Error 버튼 
    * `http://localhost:8080/health` 경로 요청을 보냅니다. 
    * `CORS` 응답 헤더를 반환하지 않으므로 에러가 발생합니다.
* Annotation 버튼
    * `http://localhost:8080/cors-health` 경로 요청을 보냅니다. 
    * 해당 경로는 `@CrossOrigin` 애너테이션 적용으로 정상 작동합니다. 
* Configure 버튼
    * `http://localhost:8081/health` 경로 요청을 보냅니다. 
    * 해당 서비스는 전역 CORS 설정 적용으로 정상 작동합니다.
* Filter 버튼
    * `http://localhost:8082/health` 경로로 요청을 보냅니다.
    * 해당 서비스는 CORS 처리를 위한 필터 적용으로 정상 작동합니다.

<p align="center">
    <img src="/images/cors-example-1.JPG" width="100%" class="image__border">
</p>

### 1.1. Request vue

코드는 간단하게 살펴보겠습니다. 

* `axios` 모듈을 사용하여 API 요청을 수행합니다.
* 상대 경로(path)를 입력하면 프론트엔드 서비스로 요청이 전달되므로 주의합니다.

```vue
<template>
  <div class="wrapper">
    <h1>Check CORS(Cross Origin Resource Sharing)</h1>
    <div class="message flex-center" :class="{error: isError}">
      <p>{ { response } }</p>
    </div>
    <div class="button-group flex-center">
      <div class="buttons flex-center">
        <button @click="requestError()">Error</button>
        <button @click="requestAnnotation()">Annotation</button>
      </div>
      <div class="buttons flex-center">
        <button @click="requestConfigure()">Configure</button>
        <button @click="requestFilter()">Filter</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      response: 'Waiting',
      isError: false
    }
  },
  methods: {
    requestError() {
      this.requestApi('http://localhost:8080/health')
    },
    requestAnnotation() {
      this.requestApi('http://localhost:8080/cors-health')
    },
    requestConfigure() {
      this.requestApi('http://localhost:8081/health')
    },
    requestFilter() {
      this.requestApi('http://localhost:8082/health')
    },
    requestApi(url) {
      axios.get(url)
          .then((res) => {
            this.response = res.data
            this.isError = false
          })
          .catch((error) => {
            this.response = error.message
            this.isError = true
          })
    }
  }
}
</script>

<style scoped>
/* some styles */
</style>
```

## 2. 백엔드 서비스 

백엔드 서비스는 총 3개 존재합니다. 
서비스 별로 CORS 정책을 다루기 위해 각기 다른 방법을 사용하였습니다. 

### 2.1. 애너테이션 사용 서비스

포트 번호 8080를 가진 서비스입니다. 
우선 스프링 프레임워크에서 제공하는 `@CrossOrigin` 애너테이션을 먼저 살펴보겠습니다. 

#### 2.1.1. @CrossOrigin 애너테이션

* 해당 애너테이션의 적용 대상은 클래스와 메소드입니다.
    * ElementType.TYPE - 클래스, 인터페이스, 열거 타입에 사용 가능
    * ElementType.METHOD - 메소드에 사용 가능
* CORS 헤더 설정에 필요한 값들을 지정할 수 있습니다.

```java
package org.springframework.web.bind.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.core.annotation.AliasFor;

@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface CrossOrigin {
    /** @deprecated */
    @Deprecated
    String[] DEFAULT_ORIGINS = new String[]{"*"};
    /** @deprecated */
    @Deprecated
    String[] DEFAULT_ALLOWED_HEADERS = new String[]{"*"};
    /** @deprecated */
    @Deprecated
    boolean DEFAULT_ALLOW_CREDENTIALS = false;
    /** @deprecated */
    @Deprecated
    long DEFAULT_MAX_AGE = 1800L;

    @AliasFor("origins")
    String[] value() default {};

    @AliasFor("value")
    String[] origins() default {};

    String[] originPatterns() default {};

    String[] allowedHeaders() default {};

    String[] exposedHeaders() default {};

    RequestMethod[] methods() default {};

    String allowCredentials() default "";

    long maxAge() default -1L;
}
```

#### 2.1.2. CorsController 클래스

* `/health` 경로는 별다른 처리 없이 노출하였습니다.
    * "It occurs CORS policy error." 응답 메세지를 반환합니다.
* `/cors-health` 경로는 `@CrossOrigin` 애너테이션을 적용하였습니다.
    * 출처(origin)가 `http://localhost`인 경우 응답 헤더를 전달합니다.
    * "It's okay because of @CrossOrigin annotation." 응답 메세지를 반환합니다.

```java
package blog.in.action.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CorsController {

    @GetMapping("/health")
    public String health() {
        return "It occurs CORS policy error.";
    }

    @CrossOrigin(origins = "http://localhost")
    @GetMapping("/cors-health")
    public String healthCorsAnnotation() {
        return "It's okay because of @CrossOrigin annotation.";
    }
}
```

### 2.2. Glboal CORS Configuration 사용 서비스

포트 번호 8081를 가진 서비스입니다. 
전역 CORS 설정을 통해 해당 서비스로 오는 요청에 대한 CORS 응답 헤더 생성을 제어합니다.

#### 2.2.1. WebConfig 클래스

* `@EnableWebMvc` 애너테이션을 통해 WebMVC 기능을 위한 설정 파일임을 알립니다.
* `WebMvcConfigurer` 인터페이스를 구현하여 필요한 기능을 확장합니다.
* `addCorsMappings` 메소드를 재구현합니다.
    * `/health` 경로에 적용합니다.
    * `GET` 메소드로 오는 요청은 CORS 헤더 생성을 허용합니다.
    * `http://localhost` 출처에서 오는 요청은 CORS 헤더 생성을 허용합니다,
    * 클라이언트에서 프리플라이트(preflight) 요청 결과를 저장하는 시간을 3초로 지정합니다.

```java
package blog.in.action.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/health")
                .allowedMethods("GET")
                .allowedOrigins("http://localhost")
                .maxAge(3000);
    }
}
```

#### 2.3.2. CorsController 클래스

* `/health` 경로에 별다른 처리가 없습니다.
    * "It's okay because of global CORS configuration." 응답 메세지를 반환합니다.

```java
package blog.in.action.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CorsController {

    @GetMapping("/health")
    public String health() {
        return "It's okay because of global CORS configuration.";
    }
}
```

### 2.3. Filter 사용 서비스

포트 번호 8082를 가진 서비스입니다. 
CORS 처리를 위한 필터를 생성하여 해당 서비스로 오는 요청에 대한 CORS 응답 헤더 생성을 제어합니다.

#### 2.3.1. WebConfig 클래스

* `corsFilter` 빈(bean)을 생성합니다. 
* `CORS` 설정을 위한 `CorsConfiguration` 객체를 생성합니다. 
    * `GET` 메소드로 오는 요청은 CORS 헤더 생성을 허용합니다.
    * `http://localhost` 출처에서 오는 요청은 CORS 헤더 생성을 허용합니다.
* `UrlBasedCorsConfigurationSource` 객체를 생성합니다.
    * `/health` 경로에 위에서 `CORS` 설정을 적용합니다.

```java
package blog.in.action.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class WebConfig {

    @Bean
    public FilterRegistrationBean corsFilter() {

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(false);
        config.addAllowedOrigin("http://localhost");
        config.addAllowedHeader("*");
        config.addAllowedMethod("GET");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/health", config);

        FilterRegistrationBean bean = new FilterRegistrationBean(new CorsFilter(source));
        bean.setOrder(0);
        return bean;
    }
}
```

#### 2.3.2. CorsController 클래스

* `/health` 경로에 별다른 처리가 없습니다.
    * "It's okay because of CORS filter." 응답 메세지를 반환합니다.

```java
package blog.in.action.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CorsController {

    @GetMapping("/health")
    public String health() {
        return "It's okay because of CORS filter.";
    }
}
```

## 3. 테스트

도커 컴포즈(docker compose)를 통해 총 4개의 서비스를 실행시킨 후 테스트를 진행하였습니다. 
도커 컴포즈를 사용하지 않는 분들은 IDE(Integrated Development Environment) 도구를 통해 서비스 실행 후 테스트가 가능합니다.

### 3.1. 서비스 실행

* `docker-compose up` 명령어를 사용합니다.

```
$ docker-compose up -d
Creating network "2021-01-15-cors-example_default" with the default driver
Building frontend
[+] Building 2.7s (15/15) FINISHED
 => [internal] load build definition from Dockerfile                                                                                          0.0s
 => => transferring dockerfile: 37B                                                                                                           0.0s
 => [internal] load .dockerignore                                                                                                             0.0s
 => => transferring context: 2B                                                                                                               0.0s
 => [internal] load metadata for docker.io/library/nginx:latest                                                                               1.2s

...

Creating 2021-01-15-cors-example_backend_1           ... done
Creating 2021-01-15-cors-example_backend-filter_1    ... done
Creating 2021-01-15-cors-example_frontend_1          ... done
Creating 2021-01-15-cors-example_backend-configure_1 ... done
```

### 3.2. 테스트 결과 확인

<http://localhost>에 접속하여 각 버튼을 눌러보면서 응답 헤더 값을 확인합니다.

<p align="center">
    <img src="/images/cors-example-2.gif" width="100%" class="image__border">
</p>

## CLOSING

테스트 코드 저장소에 예시에서 사용한 서비스들의 코드가 작성되어 있습니다. 

* `frontend` 폴더는 프론트엔드 서비스 코드입니다.
* `backend` 폴더는 포트번호 8080 서비스 코드입니다.
* `backend-configure` 폴더는 포트번호 8081 서비스 코드입니다.
* `backend-filter` 폴더는 포트번호 8082 서비스 코드입니다.

#### RECOMMEND NEXT POSTS

* [React 개발 서버 CORS 해결하기 with Proxy][react-proxy-link]

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-01-15-cors-example>

#### REFERENCE

* <https://spring.io/blog/2015/06/08/cors-support-in-spring-framework>
* <https://www.baeldung.com/spring-cors>

[cors-link]: https://junhyunny.github.io/information/cors/
[react-proxy-link]: https://junhyunny.github.io/information/react/react-proxy/