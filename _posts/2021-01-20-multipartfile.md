---
title: "MultipartFile 활용 대용량 파일 업로드 예제"
search: false
category:
  - spring-boot
  - vue.js
last_modified_at: 2021-08-22T00:30:00
---

<br>

⚠️ 다음 사항을 주의하세요.
- 해당 포스트는 2021년 7월 28일에 재작성되었습니다.
- Vue.js 코드에서 `{ { } }`으로 표기된 코드는 띄어쓰기를 붙여야지 정상적으로 동작합니다.(github blog theme 예약어로 인한 표기 에러)

👉 이어서 읽기를 추천합니다.
- [DTO 클래스, MultipartFile 활용 파일 업로드 (feat. @ModelAttribute)][multipartfile-in-dto-link]

## 0. 들어가면서

> A representation of an uploaded file received in a multipart request.

모바일/웹 어플리케이션 대부분의 경우 파일 업로드 기능이 사용됩니다. 
사용자의 프로필 사진 변경과 같은 간단한 기능도 파일 업로드가 필요합니다.
Spring 프레임워크에서 쉽게 파일 업로드할 수 있는 MultipartFile 인터페이스를 사용한 내용을 정리해보았습니다.
파일 업로드를 위한 front-end 프로젝트는 Vue.js 프레임워크를 사용하였습니다. 

## 1. 예제 코드

### 1.1. front-end 프로젝트 패키지 구조

```
./
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
    |   `-- FileUpload.vue
    `-- main.js
```

### 1.2. FileUpload.vue
파일을 업로드하기 위한 페이지입니다. 
selectUploadFile() 함수에서 이미지 업로드를 위한 element를 만들고 이를 클릭 처리합니다.
선택된 이미지를 FormData 객체에 담아 POST 요청으로 서버로 전달합니다. 
요청에 대한 정상적인 응답 처리시 **then()** 함수가 수행됩니다. 
반대로 요청에 대한 비정상적인 응답 처리시 **catch()** 함수가 수행 수행됩니다.

```vue
<template>
    <div>
        <h3>파일 업로드 결과: { { this.response === '' ? 'waiting' : this.response } }</h3>
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
                axios.post('http://localhost:8081/api/file/upload/profile-img', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(response => {
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

### 1.3. back-end 프로젝트 패키지 구조

```
./
|-- action-in-blog.iml
|-- images
|   |-- a.jpg
|   `-- b.JPG
|-- mvnw
|-- mvnw.cmd
|-- pom.xml
`-- src
    `-- main
        |-- java
        |   `-- blog
        |       `-- in
        |           `-- action
        |               |-- ActionInBlogApplication.java
        |               `-- controller
        |                   `-- FileController.java
        `-- resources
            `-- application.yml
```

### 1.4. FileController 클래스
파일 업로드를 위한 **/api/file/upload/profile-img** 요청 경로를 만들었습니다. 
FileOutputStream 클래스를 이용하여 전송된 파일을 **./images** 폴더에 저장합니다. 
정상적인 경우 "upload success" 메세지를 응답하고 Exception이 발생한 경우 "upload fail" 메세지를 응답합니다. 
CORS 문제 해결을 위해 `@CORS` 애너테이션을 추가합니다.

```java
package blog.in.action.controller;

import java.io.FileOutputStream;
import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping(value = "/api/file")
public class FileController {

    @CrossOrigin("*")
    @PostMapping(value = "/upload/profile-img")
    public @ResponseBody
    String requestUploadFile(@RequestParam("fileList") List<MultipartFile> fileList) {
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

## 2. 테스트 결과
파일 업로드 테스트 결과를 확인해보겠습니다. 

### 2.1. 이미지 선택
<p align="center"><img src="/images/multipartfile-1.JPG"></p>

### 2.2. 화면 응답 메세지 확인
<p align="center"><img src="/images/multipartfile-2.JPG"></p>

### 2.3. 저장된 파일 확인
<p align="center"><img src="/images/multipartfile-3.JPG"></p>

### 2.4. 용량이 큰 이미지 업로드
<p align="center"><img src="/images/multipartfile-4.JPG"></p>

### 2.5. 용량이 큰 이미지 업로드 시 화면 응답 메세지
<p align="center"><img src="/images/multipartfile-5.JPG"></p>

## 3. FileSizeLimitExceededException 발생
위의 테스트 결과에서 확인할 수 있듯이 용량이 큰 이미지 파일 업로드하면 에러가 발생합니다. 
서버 로그를 확인해보면 다음과 같은 에러 메세지를 볼 수 있습니다. 

> The field fileList exceeds its maximum permitted size of 1048576 bytes.

용량이 높은 파일을 업로드할 때 발생하는 에러입니다. 
에러 로그를 보면 용량 제한이 되어있다는 힌트를 확인할 수 있습니다. 
해결을 위한 설정을 추가하도록 하겠습니다. 

```
2021-07-28 12:11:38.102 ERROR 16988 --- [nio-8081-exec-1] o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed; nested exception is org.springframework.web.multipart.MaxUploadSizeExceededException: Maximum upload size exceeded; nested exception is java.lang.IllegalStateException: org.apache.tomcat.util.http.fileupload.impl.FileSizeLimitExceededException: The field fileList exceeds its maximum permitted size of 1048576 bytes.] with root cause

org.apache.tomcat.util.http.fileupload.impl.FileSizeLimitExceededException: The field fileList exceeds its maximum permitted size of 1048576 bytes.
    at org.apache.tomcat.util.http.fileupload.impl.FileItemStreamImpl$1.raiseError(FileItemStreamImpl.java:114) ~[tomcat-embed-core-9.0.41.jar:9.0.41]
    at org.apache.tomcat.util.http.fileupload.util.LimitedInputStream.checkLimit(LimitedInputStream.java:76) ~[tomcat-embed-core-9.0.41.jar:9.0.41]
    at org.apache.tomcat.util.http.fileupload.util.LimitedInputStream.read(LimitedInputStream.java:135) ~[tomcat-embed-core-9.0.41.jar:9.0.41]
    at java.base/java.io.FilterInputStream.read(FilterInputStream.java:107) ~[na:na]
    at org.apache.tomcat.util.http.fileupload.util.Streams.copy(Streams.java:98) ~[tomcat-embed-core-9.0.41.jar:9.0.41]
    at org.apache.tomcat.util.http.fileupload.FileUploadBase.parseRequest(FileUploadBase.java:291) ~[tomcat-embed-core-9.0.41.jar:9.0.41]
    at org.apache.catalina.connector.Request.parseParts(Request.java:2895) ~[tomcat-embed-core-9.0.41.jar:9.0.41]
    at org.apache.catalina.connector.Request.getParts(Request.java:2797) ~[tomcat-embed-core-9.0.41.jar:9.0.41]
    at org.apache.catalina.connector.RequestFacade.getParts(RequestFacade.java:1098) ~[tomcat-embed-core-9.0.41.jar:9.0.41]
    at org.springframework.web.multipart.support.StandardMultipartHttpServletRequest.parseRequest(StandardMultipartHttpServletRequest.java:95) ~[spring-web-5.3.2.jar:5.3.2]
    at org.springframework.web.multipart.support.StandardMultipartHttpServletRequest.<init>(StandardMultipartHttpServletRequest.java:88) ~[spring-web-5.3.2.jar:5.3.2]
    at org.springframework.web.multipart.support.StandardServletMultipartResolver.resolveMultipart(StandardServletMultipartResolver.java:87) ~[spring-web-5.3.2.jar:5.3.2]
...

2021-07-28 12:11:39.091 ERROR 16988 --- [nio-8081-exec-2] o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed; nested exception is org.springframework.web.multipart.MaxUploadSizeExceededException: Maximum upload size exceeded; nested exception is java.lang.IllegalStateException: org.apache.tomcat.util.http.fileupload.impl.FileSizeLimitExceededException: The field fileList exceeds its maximum permitted size of 1048576 bytes.] with root cause

org.apache.tomcat.util.http.fileupload.impl.FileSizeLimitExceededException: The field fileList exceeds its maximum permitted size of 1048576 bytes.
    at org.apache.tomcat.util.http.fileupload.impl.FileItemStreamImpl$1.raiseError(FileItemStreamImpl.java:114) ~[tomcat-embed-core-9.0.41.jar:9.0.41]
    at org.apache.tomcat.util.http.fileupload.util.LimitedInputStream.checkLimit(LimitedInputStream.java:76) ~[tomcat-embed-core-9.0.41.jar:9.0.41]
    at org.apache.tomcat.util.http.fileupload.util.LimitedInputStream.read(LimitedInputStream.java:135) ~[tomcat-embed-core-9.0.41.jar:9.0.41]
    at java.base/java.io.FilterInputStream.read(FilterInputStream.java:107) ~[na:na]
    at org.apache.tomcat.util.http.fileupload.util.Streams.copy(Streams.java:98) ~[tomcat-embed-core-9.0.41.jar:9.0.41]
    at org.apache.tomcat.util.http.fileupload.FileUploadBase.parseRequest(FileUploadBase.java:291) ~[tomcat-embed-core-9.0.41.jar:9.0.41]
    at org.apache.catalina.connector.Request.parseParts(Request.java:2895) ~[tomcat-embed-core-9.0.41.jar:9.0.41]
    at org.apache.catalina.connector.Request.getParts(Request.java:2797) ~[tomcat-embed-core-9.0.41.jar:9.0.41]
    at org.apache.catalina.connector.RequestFacade.getParts(RequestFacade.java:1098) ~[tomcat-embed-core-9.0.41.jar:9.0.41]
    at org.springframework.web.multipart.support.StandardMultipartHttpServletRequest.parseRequest(StandardMultipartHttpServletRequest.java:95) ~[spring-web-5.3.2.jar:5.3.2]
    at org.springframework.web.multipart.support.StandardMultipartHttpServletRequest.<init>(StandardMultipartHttpServletRequest.java:88) ~[spring-web-5.3.2.jar:5.3.2]
    at org.springframework.web.multipart.support.StandardServletMultipartResolver.resolveMultipart(StandardServletMultipartResolver.java:87) ~[spring-web-5.3.2.jar:5.3.2]
...
```

### 3.1. application.yml 설정 추가
다음과 같은 설정을 추가합니다. 
- spring.servlet.multipart.max-file-size, meaning total file size cannot exceed option byte.
- spring.servlet.multipart.max-request-size, meaning total request size for a multipart/form-data cannot exceed option byte.

```yml
server:
  port: 8081
spring:
  servlet:
    multipart:
      max-file-size: 20MB
      max-request-size: 20MB
```

### 3.2. 설정 추가 후 테스트 결과
설정을 추가한 후 위와 동일한 방법으로 이미지를 업로드합니다. 
파일이 저장되는 폴더에 용량이 큰 파일이 업로드되었는지 확인함으로써 정상적으로 수행되었음을 확인할 수 있습니다. 

<p align="center"><img src="/images/multipartfile-6.JPG"></p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-01-20-multipartfile>

#### REFERENCE
- <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/multipart/MultipartFile.html>
- <https://spring.io/guides/gs/uploading-files/>

[multipartfile-in-dto-link]: https://junhyunny.github.io/spring-boot/vue.js/multipartfile-in-dto/