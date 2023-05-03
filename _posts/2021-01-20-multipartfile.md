---
title: "MultipartFile Interface and File Upload"
search: false
category:
  - spring-boot
  - vue.js
last_modified_at: 2021-08-22T00:30:00
---

<br/>

#### 다음 사항을 주의하세요.

* `{ { someValue } }`으로 표기된 코드는 띄어쓰기를 붙여야지 정상적으로 동작합니다.

## 1. MultipartFile 인터페이스

> A representation of an uploaded file received in a multipart request.

Spring 프레임워크는 요청으로 함께 전달되는 파일들을 쉽게 다룰 수 있도록 `MultipartFile` 인터페이스를 제공합니다. 
파일의 이름, 바이트 정보를 얻을 수 있고, I/O(input output)를 위한 기능들도 함께 제공합니다. 
`MultipartFile` 인터페이스의 사용 방법을 간단한 프론트엔드, 백엔드 서비스를 구성하여 확인해보겠습니다. 

##### MultipartFile 인터페이스 주요 메소드

* getOriginalFilename 메소드 - 클라이언트 파일 시스템에서 사용했던 파일 이름을 반환합니다.
* getBytes 메소드 - 파일의 이진 바이트 값을 반환합니다.
* getInputStream 메소드 - 파일을 읽기 위한 입력 스트립(stream)을 반환합니다.
* transferTo 메소드 - 파일 정보를 새로운 파일 인스턴스로 복사합니다. 

## 2. 프론트엔드 서비스

Vue.js 프레임워크를 사용한 프론트엔드 서비스입니다. 
파일을 업로드하는 컴포넌트 코드를 먼저 살펴보겠습니다. 

### 2.1. FileUpload vue

* axios 모듈을 사용하여 API 요청을 수행합니다.
* `fetchFiles` 메소드
    * 백엔드 서비스의 `/files` 경로로 파일 리스트를 요청합니다.
* `selectFile` 메소드
    * 사용자가 파일 선택 완료시 호출되는 콜백 함수입니다.
    * `FormData` 인스턴스에 `files` 이름으로 선택한 파일들을 추가합니다.
    * 백엔드 서비스의 `/files` 경로로 파일 업로드를 요청합니다.
    * 파일 업로드에 성공하면 이미지 리스트를 갱신합니다.
    * 파일 업로드에 실패하면 에러 메세지를 보여줍니다.

```vue
<template>
  <div class="information">
    <p>이미지를 업로드하세요.</p>
    <button @click="$refs.fileRef.click">선택</button>
    <input type="file" @change="selectFile" multiple accept="image/*" ref="fileRef" hidden/>
  </div>
  <div class="images" v-if="files.length > 0">
    <div v-for="fileName in files" :key="fileName" class="image">
      <img :src="`${backendUrl}/image/${fileName}`" alt="이미지">
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      files: []
    }
  },
  computed: {
    backendUrl() {
      return process.env.VUE_APP_BACKEND_URL
    }
  },
  mounted() {
    this.fetchFiles()
  },
  methods: {
    async fetchFiles() {
      const response = await axios.get(`${this.backendUrl}/files`)
      this.files = response.data;
    },
    selectFile(event) {
      const formData = new FormData()
      for (const file of event.target.files) {
        formData.append('files', file)
      }
      axios.post(`${this.backendUrl}/files`, formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      }).then(() => {
        this.fetchFiles()
      }).catch(error => {
        alert(error.message)
      })
    },
  }
}
</script>

<style scoped>
/* styles */
</style>
```

## 3. 백엔드 서비스

Spring Boot 프레임워크를 사용한 백엔드 서비스입니다. 

### 3.1. FileController 클래스

파일 업로드 처리와 이미지 리소스를 제공하는 컨트롤러 클래스입니다. 

* `FileController` 생성자
    * 파일 저장을 위한 디렉토리를 생성합니다.
* `image` 메소드
    * 요청 파라미터로 전달받은 이름을 가진 파일을 반환합니다. 
* `getFileNames` 메소드
    * 이미지 파일 경로에 위치한 파일들의 이름을 리스트로 반환합니다.
* `uploadFiles` 메소드
    * 프론트엔드 서비스에서 `FormData` 인스턴스에 파일 정보를 담을 때 사용한 `files`라는 이름으로 파일들을 전달받습니다. 
    * 파일을 저장할 경로를 결정합니다.
    * 출력 스트림을 통해 업로드 된 파일의 바이트 정보를 출력합니다. 
    * 업로드 한 파일들은 서버의 파일 시스템에 저장됩니다.

```java
package blog.in.action.controller;

import lombok.extern.log4j.Log4j2;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Log4j2
@RestController
public class FileController {

    private final static String imageDirectory = Paths.get("").toAbsolutePath() + "/images/";

    public FileController() {
        File file = new File(imageDirectory);
        if (!file.exists()) {
            file.mkdirs();
        }
    }

    private String getExtension(MultipartFile multipartFile) {
        String fileName = multipartFile.getOriginalFilename();
        int index = fileName.indexOf(".");
        if (index > -1) {
            return fileName.substring(index);
        }
        return "";
    }

    @GetMapping("/image/{fileName}")
    public ResponseEntity<Resource> image(@PathVariable String fileName) throws FileNotFoundException {
        String filePath = imageDirectory + fileName;
        InputStreamResource inputStreamResource = new InputStreamResource(new FileInputStream(filePath));
        return ResponseEntity
                .ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(inputStreamResource);
    }

    @GetMapping("/files")
    public List<String> getFileNames() {
        return Stream.of(new File(imageDirectory).listFiles())
                .filter(file -> !file.isDirectory())
                .map(File::getName)
                .collect(Collectors.toList());
    }

    @PostMapping(value = "/files")
    public void uploadFiles(@RequestParam("files") List<MultipartFile> files) {
        for (MultipartFile multipartFile : files) {
            String filePath = imageDirectory + UUID.randomUUID() + getExtension(multipartFile);
            try (FileOutputStream writer = new FileOutputStream(filePath)) {
                writer.write(multipartFile.getBytes());
            } catch (Exception e) {
                log.error(e.getMessage(), e);
                throw new RuntimeException("Fail to upload files.");
            }
        }
    }
}
```

## 4. 테스트

도커 컴포즈(docker compose)를 통해 프론트엔드 서비스와 백엔드 서비스를 동시에 실행시켜 테스트하였습니다. 
도커 컴포즈를 사용하지 않는 분들은 IDE(Integrated Development Environment) 도구를 통해 서비스 실행 후 테스트가 가능합니다.

### 4.1. 서비스 실행

* `docker-compose up` 명령어를 사용합니다.

```
$ docker-compose up -d

Building frontend
[+] Building 19.5s (15/15) FINISHED
 => [internal] load build definition from Dockerfile                                                                                         0.0s
 => => transferring dockerfile: 37B                                                                                                          0.0s
 => [internal] load .dockerignore                                                                                                            0.0s
 => => transferring context: 2B                                                                                                              0.0s
 => [internal] load metadata for docker.io/library/nginx:latest                                                                              1.0s
 => [internal] load metadata for docker.io/library/node:16-buster-slim                                                                       0.8s
 => [builder 1/6] FROM docker.io/library/node:16-buster-slim@sha256:b1c919a0df558951c358a3cd68df1698eec365000b188528cc86628bdf07056b         0.0s
 => [internal] load build context                                                                                                            5.2s
 => => transferring context: 119.14MB                                                                                                        5.2s
 => [stage-1 1/3] FROM docker.io/library/nginx@sha256:b95a99feebf7797479e0c5eb5ec0bdfa5d9f504bc94da550c2f58e839ea6914f                       0.0s
 => CACHED [builder 2/6] WORKDIR /app                                                                                                        0.0s
 => CACHED [builder 3/6] COPY package.json .                                                                                                 0.0s
 => CACHED [builder 4/6] RUN npm install --silent                                                                                            0.0s
 => [builder 5/6] COPY . .                                                                                                                   3.9s
 => [builder 6/6] RUN npm run build                                                                                                          8.7s
 => CACHED [stage-1 2/3] COPY conf/nginx.conf /etc/nginx/conf.d/default.conf                                                                 0.0s 
 => CACHED [stage-1 3/3] COPY --from=builder /app/dist /usr/share/nginx/html                                                                 0.0s 
 => exporting to image                                                                                                                       0.0s 
 => => exporting layers                                                                                                                      0.0s 
 => => writing image sha256:da208601850bc424c6880a9ba3b559a3f16fec3e09f21afaa7c649a7e5b8cad6                                                 0.0s 
 => => naming to docker.io/library/2021-01-20-multipartfile_frontend                                                                         0.0s
WARNING: Image for service frontend was built because it did not already exist. To rebuild this image you must use `docker-compose build` or `docker-compose up --build`.
Building backend
[+] Building 1.1s (15/15) FINISHED
 => [internal] load build definition from Dockerfile                                                                                         0.0s
 => => transferring dockerfile: 37B                                                                                                          0.0s
 => [internal] load .dockerignore                                                                                                            0.0s
 => => transferring context: 2B                                                                                                              0.0s
 => [internal] load metadata for docker.io/library/openjdk:11-jdk-slim-buster                                                                1.0s
 => [internal] load metadata for docker.io/library/maven:3.8.6-jdk-11                                                                        1.0s
 => [maven_build 1/6] FROM docker.io/library/maven:3.8.6-jdk-11@sha256:805f366910aea2a91ed263654d23df58bd239f218b2f9562ff51305be81fa215      0.0s
 => [stage-1 1/3] FROM docker.io/library/openjdk:11-jdk-slim-buster@sha256:863ce6f3c27a0a50b458227f23beadda1e7178cda0971fa42b50b05d9a5dcf55  0.0s
 => [internal] load build context                                                                                                            0.0s
 => => transferring context: 806B                                                                                                            0.0s
 => CACHED [stage-1 2/3] WORKDIR /app                                                                                                        0.0s
 => CACHED [maven_build 2/6] WORKDIR /build                                                                                                  0.0s
 => CACHED [maven_build 3/6] COPY pom.xml .                                                                                                  0.0s
 => CACHED [maven_build 4/6] RUN mvn dependency:go-offline                                                                                   0.0s
 => CACHED [maven_build 5/6] COPY src ./src                                                                                                  0.0s
 => CACHED [maven_build 6/6] RUN mvn package -Dmaven.test.skip=true                                                                          0.0s
 => CACHED [stage-1 3/3] COPY --from=MAVEN_BUILD /build/target/*.jar ./app.jar                                                               0.0s
 => exporting to image                                                                                                                       0.0s
 => => exporting layers                                                                                                                      0.0s
 => => writing image sha256:380f1df775b96982c1526a0d979b0198772cae31fc4fa219495cf76032f485e8                                                 0.0s
 => => naming to docker.io/library/2021-01-20-multipartfile_backend                                                                          0.0s
WARNING: Image for service backend was built because it did not already exist. To rebuild this image you must use `docker-compose build` or `docker-compose up --build`.
Creating 2021-01-20-multipartfile_frontend_1 ... done
Creating 2021-01-20-multipartfile_backend_1  ... done
```

### 4.2. 테스트 결과 확인

* 파일을 선택하여 업로드를 요청합니다. 
* 파일을 업로드에 성공하면 화면에 이미지 정보들이 갱신됩니다.

<p align="center">
    <img src="/images/multipartfile-1.gif" width="100%" class="image__border">
</p>

## 5. FileSizeLimitExceededException 예외 처리

별도 설정 없이 높은 용량의 파일을 업로드하면 다음과 같은 에러를 볼 수 있습니다.

* tomcat 패키지의 LimitedInputStream 클래스에서 파일 업로드 용량 제한을 확인합니다.
* 너무 큰 파일이 업로드 되는 경우 `FileSizeLimitExceededException` 예외를 던집니다.

```
org.apache.tomcat.util.http.fileupload.impl.FileSizeLimitExceededException: The field files exceeds its maximum permitted size of 1048576 bytes.
        at org.apache.tomcat.util.http.fileupload.impl.FileItemStreamImpl$1.raiseError(FileItemStreamImpl.java:114) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
        at org.apache.tomcat.util.http.fileupload.util.LimitedInputStream.checkLimit(LimitedInputStream.java:76) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
        at org.apache.tomcat.util.http.fileupload.util.LimitedInputStream.read(LimitedInputStream.java:135) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
        at java.base/java.io.FilterInputStream.read(FilterInputStream.java:107) ~[na:na]
...
```

### 5.1. application.yml 추가 설정

`Spring` 프레임워크 설정을 통해 파일 업로드 용량 제한을 늘릴 수 있습니다. 
아래와 같은 설정을 추가합니다.

* spring.servlet.multipart.max-file-size
    * meaning total file size cannot exceed option byte.
* spring.servlet.multipart.max-request-size
    * meaning total request size for a multipart/form-data cannot exceed option byte.

```yml
server:
  port: 8080
spring:
  servlet:
    multipart:
      max-file-size: 20MB
      max-request-size: 20MB
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-01-20-multipartfile>

#### RECOMMEND NEXT POSTS

* [DTO 클래스, MultipartFile 활용 파일 업로드 (feat. @ModelAttribute)][multipartfile-in-dto-link]

#### REFERENCE

* <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/multipart/MultipartFile.html>
* <https://spring.io/guides/gs/uploading-files/>

[multipartfile-in-dto-link]: https://junhyunny.github.io/spring-boot/vue.js/multipartfile-in-dto/