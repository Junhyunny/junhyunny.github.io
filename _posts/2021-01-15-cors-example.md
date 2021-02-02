---
title: "CORS(Cross Origin Resource Sharing) 서버 구현"
search: false
category:
  - spring web
  - vue.js
last_modified_at: 2021-01-30T00:00:00
---

# CORS(Cross Origin Resource Sharing) 서버 구현<br>

Vue.js 프레임워크를 사용한 웹 어플리케이션과 Spring boot 프레임워크 서버를 통해 CORS에 대한 테스트를 진행해보겠습니다. 
front-end 프로젝트는 새롭게 만들었고, back-end 프로젝트는 지난 [HandlerMethodArgumentResolver 인터페이스][resolver-blogLink] 글에서 사용한 프로젝트를 확장하여 사용하였습니다. 
새로 추가되거나 변경된 클래스가 아닌 경우에는 따로 설명을 추가하지 않았습니다. 
CORS(Cross Origin Resource Sharing) 개념에 대해서는 [CORS(Cross Origin Resource Sharing)][cors-blogLink] 글을 통해 확인해보시길 바랍니다.

## front-end 프로젝트 패키지 구조

<p align="left"><img src="/images/cors-example-1.JPG"></p>

## CorsReuqest.vue
2가지 API PATH를 통해 테스트를 진행하였습니다. 
각 버튼에 자신이 요청하는 프로토콜, 호스트, 포트, 경로에 대한 정보가 적혀있습니다.<br>
버튼 아래 응답에 대한 정보를 출력합니다.

```vue
<template>
  <div>
    <h1>Cross Origin Resource Sharing Test</h1>
    <div>
      <button @click="request1()">http://localhost:8081/api/cors/health</button>
      <button @click="request2()">http://localhost:8081/api/cors/health-cors-annotaion</button>
      <div>{{this.response}}</div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'CorsReuqest',
  data() {
    return {
      response: ''
    }
  },
  methods: {
    request1() {
      // 호스트명 URL 변경
      axios.get('http://localhost:8081/api/cors/health').then((res) => {
          this.response = res.data
      }).catch((error) => {
          this.response = error.message
          console.log('error message: ', error)
      })
    },
    request2() {
      // 호스트명 URL 변경
      axios.get('http://localhost:8081/api/cors/health-cors-annotaion').then((res) => {
          this.response = res.data
      }).catch((error) => {
          this.response = error.message
          console.log('error message: ', error)
      })
    }
  }
}
</script>
```

## back-end 프로젝트 패키지 구조

<p align="left"><img src="/images/cors-example-2.JPG" wdith="150"></p>

## application.yml
포트 정보를 추가하였습니다.

```yml
server:
  port: 8081
spring:
  h2:
    console:
      enabled: true
      path: /h2-console
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password: 123
```

## ResourceServer 클래스 변경
CORS 테스트 용 API인 경우 권한에 대한 체크가 불필요하여 인증 없이 요청할 수 있도록 허용해두었습니다.

```java
package blog.in.action.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableResourceServer;
import org.springframework.security.oauth2.config.annotation.web.configuration.ResourceServerConfigurerAdapter;
import org.springframework.security.oauth2.provider.error.OAuth2AccessDeniedHandler;

@Configuration
@EnableResourceServer
public class ResourceServer extends ResourceServerConfigurerAdapter {

    @Override
    public void configure(HttpSecurity http) throws Exception {
        http.cors().and() //
                .authorizeRequests() //
                .antMatchers("/api/cors/**").permitAll() // cors 테스트를 위해 해당 path 모든 요청 허용
                .antMatchers("/api/member/sign-up").permitAll() // sign-up API는 모든 요청 허용
                .antMatchers("/api/member/user-info").hasAnyAuthority("ADMIN")// user-info API는 ADMIN 권한을 가지는 유저만 요청 허용
                .anyRequest().authenticated().and() //
                .exceptionHandling().accessDeniedHandler(new OAuth2AccessDeniedHandler());
    }
}
```

## CorsController 클래스 구현
2개의 API PATH를 만들었습니다.
- **/api/cors/health** 경로는 일반 GET 요청
- **/api/cors/health-cors-annotaion** 경로는 GET 요청에 @CrossOrigin 애너테이션을 추가

```java
package blog.in.action.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/cors")
public class CorsController {

    @GetMapping("/health")
    public String health() {
        return "health";
    }

    @CrossOrigin(origins = "http://localhost:8080")
    @GetMapping("/health-cors-annotaion")
    public String healthCorsAnnotation() {
        return "health-cors-annotaion";
    }
}
```

## Spring-Boot Framework CORS 동작 원리
테스트 전에 Spring-Boot Framework 에서 CORS 가 동작하는 원리에 대해 알아보도록 하겠습니다. 

### CorsFilter 객체 생성
다음과 같은 순서로 CorsFilter 객체를 생성합니다.
1. CorsConfigurationSource @Bean이 있는지 확인
1. 존재하는 경우 CorsConfigurationSource @Bean을 CorsFilter 객체의 configSource 로 사용하여 CorsFilter 객체 생성
1. 없는 경우 HandlerMappingIntrospector @Bean을 생성
	1. HandlerMappingIntrospector @Bean을 생성하는 과정에서 API endpoint 별로 CorsConfiguration을 생성
1. HandlerMappingIntrospector @Bean을 CorsFilter 객체의 configSource 로 사용하여 CorsFilter 객체 생성

<p align="center"><img src="/images/cors-example-3.JPG"></p>

- CorsFilter 생성 관련 로직, CorsConfigurer 클래스 getCorsFilter 메소드
	- CorsConfigurationSource @Bean 이 존재하는 경우 CorsFilter 객체 생성 (2. step)
	- CorsConfigurationSource @Bean 이 존재하지 않는 경우 MvcCorsFilter 클래스를 통해 CorsFilter 객체 생성 (3. step)

<p align="center"><img src="/images/cors-example-4.JPG"></p>

- HandlerMappingIntrospector @Bean을 생성 중 API endpoint 별 CorsConfiguration 생성 로직 (3-1. step)
	- CrossOrigin 애너테이션이 존재하는지 확인 
	- 존재하는 경우 메소드 별로 CorsConfiguration 객체 생성

<p align="center"><img src="/images/cors-example-5.JPG"></p>

### CorsFilter 객체 동작
다음과 같은 순서로 CorsFilter 객체는 동작합니다.
1. ApplicationFilterChain에 속하는 Filter들이 순서대로 동작
1. ApplicationFilterChain에 속하는 DelegatingFilterProxyRegistrationBean 객체의 doFilter 메소드 호출
	1. FilterChainProxy에 속하는 추가적인 Filter들이 순서대로 동작
	1. FilterChainProxy에 속하는 CorsFilter 객체의 doFilter 메소드 호출
	1. 해당 요청이 허가된 응답인지 CorsConfiguration 객체를 통해 확인 및 헤더 값 SETTING
	1. 필요한 CorsConfiguration 객체는 필터 생성시 SETTING 된 CorsConfigurationSource 객체를 통해 GET

<p align="center"><img src="/images/cors-example-6.JPG"></p>

- DelegatingFilterProxyRegistrationBean 객체의 doFilter 내부 로직 (2. step)
	- originalChain 객체는 ApplicationFilterChain을 의미
	- additionalFilter 객체는 FilterChainProxy에 속하는 Filer 리스트

<p align="center"><img src="/images/cors-example-7.JPG"></p>

- CorsFilter 객체 내부에서 CORS Access 가능 여부 확인 및 헤더 값 SETTING 로직

<p align="center"><img src="/images/cors-example-8.JPG"></p>

## @CrossOrigin 애너테이션을 통한 CORS 테스트

- **/api/cors/health** 경로 요청시 CorsConfiguration 객체 NULL

<p align="center"><img src="/images/cors-example-9.JPG"></p>

- **/api/cors/health** 경로 요청 결과, 실패

<p align="center"><img src="/images/cors-example-10.JPG"></p>

- **/api/cors/health** 경로 요청시 CorsConfiguration 객체 존재
	- 내부 allowedOrigins 정보 확인시 http://localhost:8080 존재

<p align="center"><img src="/images/cors-example-11.JPG"></p>

- **/api/cors/health-cors-annotaion** 경로 요청 결과, 성공

<p align="center"><img src="/images/cors-example-12.JPG"></p>

## CorsConfigurationSource @Bean을 통한 CORS
Config.java 파일에 CorsConfigurationSource @Bean 생성 로직을 추가합니다. 
**CorsConfigurationSource @Bean이 추가되면 CorsFilter 객체 생성시 CorsConfigurationSource @Bean을 우선적으로 사용하여 만들기 때문에 @CrossOrigin 애너테이션 기능은 정상 동작하지 않습니다.**

```java
package blog.in.action.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class Config {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.addAllowedOrigin("http://localhost:8080");
        corsConfiguration.addAllowedHeader("*");
        corsConfiguration.addAllowedMethod("*");
        corsConfiguration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);
        return source;
    }
}
```

- **/api/cors/health** 경로 요청 결과, 성공

<p align="center"><img src="/images/cors-example-13.JPG"></p>

- **/api/cors/health-cors-annotaion** 경로 요청 결과, 성공

<p align="center"><img src="/images/cors-example-14.JPG"></p>

## OPINION
이전 블로그에서 이 주제를 다룰때는 단순히 문제를 해결하기 위한 글을 썼다면 이번 글은 CORS가 내부에서 어떻게 동작하는지에 대해 초첨을 맞춰서 작성하였습니다. 
2020년 1월에 작성한 글인데 1년만에 조금은 성장한 듯 합니다. 
프로젝트 코드들을 확인하시려면 아래 링크를 눌러주시길 바립니다.<br>
[FRONT-END PROJECT][front-gitLink] / [BACK-END PROJECT][back-gitLink]

#### 참조글
- <https://junhyunny.blogspot.com/2020/01/cors-cross-origin-resource-sharing.html>

[cors-blogLink]: https://junhyunny.github.io/information/cors/
[resolver-blogLink]: https://junhyunny.github.io/spring%20web/handler-method-argument-resolver/
[front-gitLink]: https://github.com/Junhyunny/action-in-blog-front/tree/d87e3d024d4909c203390f58c2633c9db61c4269
[back-gitLink]: https://github.com/Junhyunny/action-in-blog/tree/ab53d585cdd265c49a1b4585dfeec92c4c1918cc