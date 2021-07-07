---
title: "CORS(Cross Origin Resource Sharing) 서버 구현"
search: false
category:
  - spring-boot
  - vue.js
last_modified_at: 2021-01-30T09:00:00
---

<br>

⚠️ 해당 포스트는 2021년 7월 7일에 재작성되었습니다.(spring-security dependency로 인한 설명 오류)

Vue.js 프레임워크를 사용한 웹 어플리케이션과 Spring boot 프레임워크 서버를 통해 CORS에 대한 테스트를 진행해보겠습니다. 
CORS(Cross Origin Resource Sharing) 개념은 [CORS(Cross Origin Resource Sharing)][cors-blogLink] 포스트를 통해 확인해보시길 바랍니다.

## front-end 프로젝트 패키지 구조

```
.
|-- README.md
|-- babel.config.js
|-- package-lock.json
|-- package.json
|-- public
|   |-- favicon.ico
|   `-- index.html
`-- src
    |-- App.vue
    |-- assets
    |   `-- logo.png
    |-- components
    |   `-- CorsReuqest.vue
    `-- main.js
```

## CorsReuqest.vue
2가지 API PATH를 통해 테스트를 진행하였습니다. 
각 버튼에 자신이 요청하는 프로토콜, 호스트, 포트, 경로에 대한 정보가 적혀있습니다. 
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
            axios.get('http://localhost:8081/api/cors/health').then((res) => {
                this.response = res.data
            }).catch((error) => {
                this.response = error.message
                console.log('error message: ', error)
            })
        },
        request2() {
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

```
.
|-- action-in-blog.iml
|-- mvnw
|-- mvnw.cmd
|-- pom.xml
`-- src
    |-- main
    |   |-- java
    |   |   `-- blog
    |   |       `-- in
    |   |           `-- action
    |   |               |-- ActionInBlogApplication.java
    |   |               `-- controller
    |   |                   `-- CorsController.java
    |   `-- resources
    |       `-- application.yml
    `-- test
        `-- java
            `-- blog
                `-- in
                    `-- action
                        `-- ActionInBlogApplicationTests.java
```

## application.yml
포트 정보를 추가하였습니다.

```yml
server:
  port: 8081
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

## Spring-Boot CORS 동작 원리
테스트 전에 Spring-Boot CORS 동작 원리에 대해 알아보도록 하겠습니다. 

### DefaultCorsProcessor 클래스 생성
Spring-Boot의 AbstractHandlerMapping 객체 생성 시 DefaultCorsProcessor 객체가 생성됩니다. 

<p align="center"><img src="/images/cors-example-1.JPG"></p>

작성 중 입니다.

## OPINION
이전 블로그에서 이 주제를 다룰때는 단순히 문제를 해결하기 위한 글을 썼다면 이번 글은 CORS가 내부에서 어떻게 동작하는지에 대해 초첨을 맞춰서 작성하였습니다. 
2020년 1월에 작성한 글인데 1년만에 조금은 성장한 듯 합니다. 

해당 포스트는 2021년 01월 30일에 작성되었으며 2021년 07월 07일에 재작성되었습니다.

##### 2021-07-07 POST 내용 변경
- CorsConfigurationSource 빈(Bean) 사용 코드 제거
- spring-security 종속성(dependency) 제거

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action>

#### REFERENCE
- <https://junhyunny.blogspot.com/2020/01/cors-cross-origin-resource-sharing.html>

[cors-blogLink]: https://junhyunny.github.io/information/cors/
[resolver-blogLink]: https://junhyunny.github.io/spring-boot/handler-method-argument-resolver/