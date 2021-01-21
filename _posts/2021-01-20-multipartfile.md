---
title: "MultipartFile 활용 대용량 파일 업로드 예제"
search: false
category: 
  - side project
  - spring web
  - vue.js
last_modified_at: 2021-01-20T00:00:00
---

# MultipartFile 활용 대용량 파일 업로드 예제<br>

> A representation of an uploaded file received in a multipart request.

모바일/웹 어플리케이션 대부분의 경우 파일 업로드 기능이 사용됩니다. 
사용자의 프로필 사진 변경과 같은 간단한 기능도 파일 업로드가 필요합니다.
Spring 프레임워크에서 파일 업로드 기능으로 사용되는 MultipartFile 인터페이스를 이용하여 기능 구현을 하였습니다.

back-end 프로젝트는 이전 [CROS(Cross Origin Resource Sharing) 서버 구현][cors-blogLink] 글에서 사용했던 프로젝트를 확장하여 구현하였습니다. 
변경된 파일에 대한 설명만 추가되었습니다. 
파일 업로드를 위한 front-end 프로젝트는 Vue.js 프레임워크를 사용하였습니다. 

## front-end 프로젝트 패키지 구조

<p align="left"><img src="/images/multipartfile-1.JPG" wdith="150"></p>

## FileUpload.vue
파일을 업로드하기 위한 페이지입니다. 
selectUploadFile() 함수에서 이미지 업로드를 위한 element를 만들고 이를 클릭 처리합니다.
선택된 이미지를 FormData 객체에 담아 POST 요청시 서버로 전달합니다.
- 요청에 대한 정상적인 응답 처리, **then()** 수행
- 요청에 대한 비정상적인 응답 처리, **catch()** 수행

```vue
<template>
  <div>
    <h3>파일 업로드 결과: {{this.response === '' ? 'waiting' : this.response}}</h3>
    <div>
      <button @click="selectUploadFile()">이미지 선택</button>
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
    selectUploadFile() {
      var vue = this
      let elem = document.createElement('input')
      // 이미지 파일 업로드 / 동시에 여러 파일 업로드
      elem.id = 'image'
      elem.type = 'file'
      elem.accept = 'image/*'
      elem.multiple = true
      // 클릭
      elem.click();
      // 이벤트 감지
      elem.onchange = function() {
        const formData = new FormData()
        for (var index = 0; index < this.files.length; index++) {
          formData.append('fileList', this.files[index])
        }
        axios.post('http://localhost:8081/api/member/upload/profile-img', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(response => {
          vue.response = response.data
        }).catch(error => {
          vue.response = error.message
        })
      }
    }
  }
}
</script>
```

## back-end 프로젝트 패키지 구조

<p align="left"><img src="/images/multipartfile-2.JPG" wdith="150"></p>

## ResourceServer 클래스 변경
파일 업로드를 위한 **/api/member/upload/profile-img** 경로는 인증없이 사용할 수 있도록 모든 요청에 대해 허용하였습니다.

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
        .antMatchers("/api/member/upload/profile-img").permitAll() // file upload API는 모든 요청 허용
        .antMatchers("/api/member/user-info").hasAnyAuthority("ADMIN")// user-info API는 ADMIN 권한을 가지는 유저만 요청 허용
        .anyRequest().authenticated().and() //
        .exceptionHandling().accessDeniedHandler(new OAuth2AccessDeniedHandler());
  }
}
```

## MemberController 클래스 변경
파일 업로드를 위한 **/api/member/upload/profile-img** 요청 경로를 만들었습니다. 
FileOutputStream 클래스를 이용하여 전송된 파일을 **./images** 폴더에 저장합니다. 
정상적인 경우 "upload success" 메세지를 응답하고 Exception이 발생한 경우 "upload fail" 메세지를 응답합니다.

```java
package blog.in.action.controller;

import java.io.FileOutputStream;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import blog.in.action.annotation.TokenMember;
import blog.in.action.entity.Member;
import blog.in.action.service.MemberService;

@RestController
@RequestMapping(value = "/api/member")
public class MemberController {

  @Autowired
  private MemberService memberService;

  @PostMapping("/sign-up")
  @Transactional(propagation = Propagation.REQUIRED)
  public void requestSignUp(@RequestBody Member member) {
    memberService.registMember(member);
  }

  @GetMapping("/user-info")
  public Member requestUserInfo(@RequestParam("id") String id) {
    return memberService.findById(id);
  }

  @GetMapping("/user-info-using-token")
  public Member requestUserInfoUsingToken(@TokenMember Member member) {
    return memberService.findById(member.getId());
  }

  @PostMapping(value = "/upload/profile-img")
  public @ResponseBody String requestUploadFile(@RequestParam("fileList") List<MultipartFile> fileList) {
    try {
      for (MultipartFile multipartFile : fileList) {
        FileOutputStream writer = new FileOutputStream("./images/" + multipartFile.getOriginalFilename());
        writer.write(multipartFile.getBytes());
        writer.close();
      }
    } catch (Exception e) {
      return "upload fail";
    }
    return "upload success";
  }
}
```

## 테스트 결과
파일 업로드 테스트 결과를 확인해보겠습니다. 

### 이미지 선택

<p align="center"><img src="/images/multipartfile-3.JPG"></p>

### 화면 응답 메세지 확인

<p align="center"><img src="/images/multipartfile-4.JPG"></p>

### 저장된 파일 확인

<p align="center"><img src="/images/multipartfile-5.JPG"></p>

### 용량이 큰 이미지 업로드

<p align="center"><img src="/images/multipartfile-6.JPG"></p>

### 용량이 큰 이미지 업로드시 화면 응답 메세지

<p align="center"><img src="/images/multipartfile-7.JPG"></p>

### FileSizeLimitExceededException 발생

<p align="center"><img src="/images/multipartfile-8.JPG"></p>

용량이 높은 파일을 업로드할 때 발생하는 에러입니다. 

> The field fileList exceeds its maximum permitted size of 1048576 bytes.

Exception에서 위와 같은 힌트가 나와있습니다. 해결하기 위한 설정을 추가하도록 하겠습니다. 

### application.yml 설정 추가
다음과 같은 설정을 추가합니다. 
- spring.servlet.multipart.max-file-size, meaning total file size cannot exceed option byte.
- spring.servlet.multipart.max-request-size, meaning total request size for a multipart/form-data cannot exceed option byte.

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
  servlet:
    multipart:
      max-file-size: 20MB
      max-request-size: 20MB
```

### 설정 추가 후 테스트 결과
설정을 추가한 후 위와 동일한 방법으로 이미지를 업로드합니다. 
정상적으로 수행되었음을 확인할 수 있습니다. 
파일이 저장되는 폴더에 용량이 큰 파일이 업로드되었는지 확인해보겠습니다. 

<p align="center"><img src="/images/multipartfile-9.JPG"></p>

## OPINION
간단하게 파일 업로드 기능을 구현하고 발생하는 Exception의 해결 방법에 대해서 정리해보았습니다. 
프로젝트 코드를 확인하고 싶으신 분은 아래 링크를 눌러주시길 바랍니다.

[FRONT-END PROJECT][front-gitLink] / [BACK-END PROJECT][back-gitLink]

#### 참조글
- <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/multipart/MultipartFile.html>
- <https://spring.io/guides/gs/uploading-files/>

[cors-blogLink]: https://junhyunny.github.io/main%20project/side%20project/spring%20web/vue.js/cors-example/
[front-gitLink]: https://github.com/Junhyunny/action-in-blog-front/tree/d87e3d024d4909c203390f58c2633c9db61c4269
[back-gitLink]: https://github.com/Junhyunny/action-in-blog/tree/ab53d585cdd265c49a1b4585dfeec92c4c1918cc