---
title: "스프링 MultipartFile 인터페이스와 파일 업로드"
search: false
category:
  - spring-boot
  - vue.js
last_modified_at: 2021-08-22T00:30:00
---

<br/>

## 0. 들어가면서

Jekyll 문법과 충돌이 있기 때문에 `{ { someValue } }`으로 표기된 코드는 띄어쓰기를 붙여야지 정상적으로 동작한다.

## 1. MultipartFile 인터페이스

> A representation of an uploaded file received in a multipart request.

스프링(spring) 프레임워크는 요청에 함께 전달되는 파일들을 쉽게 다룰 수 있도록 `MultipartFile` 인터페이스를 제공한다. 파일의 이름, 바이트 정보를 얻을 수 있고, I/O(input output)를 위한 기능들도 함께 제공한다. 이 글에선 MultipartFile 인터페이스를 사용해 파일을 업로드하는 예제를 다룬다.

MultipartFile 인터페이스의 주요 책임을 살펴보자.

- getOriginalFilename 메서드
  - 클라이언트 파일 시스템에서 사용했던 파일 이름을 반환한다.
- getBytes 메서드
  - 파일의 이진 바이트 값을 반환한다.
- getInputStream 메서드
  - 파일을 읽기 위한 입력 스트립(stream)을 반환한다.
- transferTo 메서드
  - 파일 정보를 새로운 파일 인스턴스로 복사한다.

```java
public interface MultipartFile extends InputStreamSource {
    String getName();

    @Nullable
    String getOriginalFilename();

    @Nullable
    String getContentType();

    boolean isEmpty();

    long getSize();

    byte[] getBytes() throws IOException;

    InputStream getInputStream() throws IOException;

    default Resource getResource() {
        return new MultipartFileResource(this);
    }

    void transferTo(File var1) throws IOException, IllegalStateException;

    default void transferTo(Path dest) throws IOException, IllegalStateException {
        FileCopyUtils.copy(this.getInputStream(), Files.newOutputStream(dest));
    }
}
```

## 2. Frontend application

VueJS로 프론트엔드 애플리케이션을 구현했다. 파일을 업로드하는 컴포넌트 코드를 먼저 살펴본다. 파일 업로드에 관련된 FileUpload 컴포넌트 코드를 먼저 살펴보자. axios 모듈을 사용하여 API 요청을 수행한다.

- fetchFiles 함수
  - 백엔드 서비스의 `/files` 경로로 파일 리스트를 요청한다.
- selectFile 함수
  - 사용자가 파일 선택 완료시 호출되는 콜백 함수입니다.
  - `FormData` 인스턴스에 `files` 이름으로 선택한 파일들을 추가한다.
  - 백엔드 서비스의 `/files` 경로로 파일 업로드를 요청한다.
  - 파일 업로드에 성공하면 이미지 리스트를 갱신한다.
  - 파일 업로드에 실패하면 에러 메시지를 보여준다.

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

## 3. Backend application

스프링 프레임워크로 개발한 백엔드 서버 애플리케이션을 살펴보자. 예시를 위해 생성자에서 파일 저장을 위한 디렉토리를 생성한다. 다음과 같은 엔드포인트를 만든다. 

- image 메서드
  - 요청 파라미터로 전달받은 이름을 가진 파일을 반환한다. 
- getFileNames 메서드
  - 이미지 파일 경로에 위치한 파일들의 이름을 리스트로 반환한다.
- uploadFiles 메서드
  - 프론트엔드 서비스에서 `FormData` 인스턴스에 파일 정보를 담을 때 사용한 `files`라는 이름으로 파일들을 전달받는다. 
  - 파일을 저장할 경로를 결정한다.
  - 출력 스트림을 통해 업로드 된 파일의 바이트 정보를 출력한다. 
  - 업로드 한 파일들은 서버의 파일 시스템에 저장된다.

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

## 4. Verify

정상적으로 동작하는지 확인해보자. 두 개의 애플리케이션을 동시에 실행해야하기 때문에 도커 컴포즈(docker compose)를 사용한다. 

```
$ docker-compose up -d

Building frontend
[+] Building 19.5s (15/15) FINISHED
 => [internal] load build definition from Dockerfile                                                                                         0.0s
 => => transferring dockerfile: 37B                                                                                                          0.0s
 
 ...

 => => exporting layers                                                                                                                      0.0s
 => => writing image sha256:380f1df775b96982c1526a0d979b0198772cae31fc4fa219495cf76032f485e8                                                 0.0s
 => => naming to docker.io/library/2021-01-20-multipartfile_backend                                                                          0.0s
WARNING: Image for service backend was built because it did not already exist. To rebuild this image you must use `docker-compose build` or `docker-compose up --build`.
Creating 2021-01-20-multipartfile_frontend_1 ... done
Creating 2021-01-20-multipartfile_backend_1  ... done
```

애플리케이션이 모두 실행되면 브라우저에서 파일을 업로드해보자.

- 파일을 선택하여 업로드를 요청한다. 
- 파일을 업로드에 성공하면 화면에 이미지 정보들이 갱신된다.

<div align="center">
  <img src="/images/posts/2021/multipartfile-01.gif" width="100%" class="image__border">
</div>

## 5. FileSizeLimitExceededException handling

별도 설정 없다면 높은 용량의 파일을 업로드할 때 다음과 같은 에러를 만난다.

- 톰캣(tomcat) 패키지의 LimitedInputStream 클래스에서 파일 업로드 용량 제한을 확인한다.
- 너무 큰 파일이 업로드 되는 경우 `FileSizeLimitExceededException` 예외를 던진다.

```
org.apache.tomcat.util.http.fileupload.impl.FileSizeLimitExceededException: The field files exceeds its maximum permitted size of 1048576 bytes.
        at org.apache.tomcat.util.http.fileupload.impl.FileItemStreamImpl$1.raiseError(FileItemStreamImpl.java:114) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
        at org.apache.tomcat.util.http.fileupload.util.LimitedInputStream.checkLimit(LimitedInputStream.java:76) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
        at org.apache.tomcat.util.http.fileupload.util.LimitedInputStream.read(LimitedInputStream.java:135) ~[tomcat-embed-core-9.0.41.jar!/:9.0.41]
        at java.base/java.io.FilterInputStream.read(FilterInputStream.java:107) ~[na:na]
...
```

application.yml 파일에 용량을 늘리기 위한 설정을 추가한다.

- spring.servlet.multipart.max-file-size
  - meaning total file size cannot exceed option byte.
- spring.servlet.multipart.max-request-size
  - meaning total request size for a multipart/form-data cannot exceed option byte.

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

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-01-20-multipartfile>

#### RECOMMEND NEXT POSTS

- [스프링 DTO(Data Transfer Object) 객체와 파일 업로드][multipartfile-in-dto-link]

#### REFERENCE

- <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/multipart/MultipartFile.html>
- <https://spring.io/guides/gs/uploading-files/>

[multipartfile-in-dto-link]: https://junhyunny.github.io/spring-boot/vue.js/multipartfile-in-dto/