---
title: "Problem to find images in spring boot application"
search: false
category:
  - spring-boot
last_modified_at: 2021-09-04T16:30:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Reading resources error when running jar file applicaiton][when-run-jar-then-fail-to-read-resource-link]

## 0. 들어가면서

이 글의 내용은 24년 6월에 다시 정리했다. 이전에 작성된 내용은 명확한 원인 분석과 해결 방법에 대해 제대로 정리되어 있지 않았다.

## 1. Problem Context

다음과 같은 문제가 발생했다.

1. 클라이언트(브라우저)가 특정 문자열에 해당하는 바코드를 생성을 요청한다.
2. 서버는 특정 문자열을 받아 이미지를 파일 시스템에 생성 후 이미지 파일 경로를 클라이언트에게 응답한다.
3. 클라이언트가 해당 이미지 경로로 요청을 보내면 해당 이미지 파일을 찾을 수 없다.

새로운 이미지 파일은 클래스패스에 위치한 /static/images 폴더에 생성하도록 구현했다. 다음과 같이 현상을 요약할 수 있다.

- IDE(Integrated Development Environment) 환경에서 실행하면 정상적으로 동작하지만, 애플리케이션을 서버 머신에 배포하면 정상적으로 동작하지 않는다.
- 새로 업로드 한 이미지가 아닌 /static/images 경로에 이미 저장된 이미지들은 서버에서도 정상적으로 찾을 수 있다. 

## 2. Cause of the problem

서버 로그를 보면 다음과 같은 에러를 볼 수 있다.

```
java.io.FileNotFoundException: file:/Users/junhyunkang/Desktop/workspace/blog/blog-in-action/2021-08-06-cannot-find-static-resource/action-in-blog/target/action-in-blog-0.0.1-SNAPSHOT.jar!/BOOT-INF/classes!/static/images/cc83bd14-995c-4944-9d69-44b30ec65b7d.png (No such file or directory)
        at java.base/java.io.FileOutputStream.open0(Native Method) ~[na:na]
        at java.base/java.io.FileOutputStream.open(FileOutputStream.java:293) ~[na:na]
        at java.base/java.io.FileOutputStream.<init>(FileOutputStream.java:235) ~[na:na]
        at java.base/java.io.FileOutputStream.<init>(FileOutputStream.java:184) ~[na:na]
        at blog.in.action.util.BarcodeUtil.createBarcodeImage(BarcodeUtil.java:22) ~[classes!/:0.0.1-SNAPSHOT]
        at blog.in.action.controller.BlogController.barcodeInStaticFolder(BlogController.java:59) ~[classes!/:0.0.1-SNAPSHOT]
        at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[na:na]
        at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77) ~[na:na]
...
```

위 에러가 발생한 문제 원인은 다음과 같다. 

- 스프링 부트 프레임워크는 애플리케이션을 실행 가능한 jar 파일로 빌드한다.
- 클래스패스의 /static/images 경로는 패키징 된 jar 파일 내부에 위치하므로 새로운 이미지 파일을 패키지 내부에 생성할 수 없다.

jar 파일은 zip 파일처럼 압축된 파일이기 때문에 내부에 새로운 파일을 직접 만들 수 없다. IDE 환경에서 실행한 애플리케이션이 정상적으로 동작하는 이유는 빌드한 결과물이 jar 파일로 패키징 되어 있지 않고 target 폴더에 풀어져 있기 때문이다. 

- IDE 환경에서 애플리케이션 실행시 target 폴더 하위 클래스패스 /static/images 경로에 이미지가 정상적으로 업로드 된다.

<div align="left">
  <img src="/images/posts/2021/cannot-find-static-resource-01.png" width="50%" class="image__border">
</div>

<br/>

같은 원리로 war 파일로 패키징한 애플리케이션을 톰캣(tomcat) 서블릿 컨테이너의 wepapp 폴더에 배포하는 방식이라면 에러가 발생하지 않는다. 톰캣 서버는 war 패키징 파일을 폴더 형태로 파일 시스템에 풀어서 서빙(serving)하기 때문이다. 

## 3. Solve the problem

jar 패키지 파일로 서버 애플리케이션을 실행한다면 새로 업로드하는 이미지 파일들의 생성 경로를 파일 시스템으로 설정해야 한다. HTTP 요청 경로를 파일 시스템 경로로 매칭시키려면 WebMvcConfigurer 인터페이스를 확장해 리소스 핸들러를 추가해야 한다.

1. 애플리케이션 현재 경로를 찾는다.
2. 애플리케이션 현재 경로에 images 디렉토리를 생성한다.
3. HTTP 요청 시 /images 경로 하위 리소스들은 이미지 폴더에서 탐색할 수 있도록 이를 매핑한다.

```java
package blog.in.action.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Path;

@Slf4j
@Configuration
public class WebMvcConfiguration implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(final ResourceHandlerRegistry registry) {
        String currentAppPath = Path.of("./").toString(); // 1
        String imagePath = currentAppPath + "/images/";
        File imagesDirectory = new File(imagePath);
        if (!imagesDirectory.exists()) { // 2
            log.info("create {} - {}", imagePath, imagesDirectory.mkdirs());
        }
        registry.addResourceHandler("/images/**").addResourceLocations("file:" + imagePath); // 3
    }
}
```

## 4. Example Code

이해를 돕기 위해 간단한 예시 코드를 만들어봤다.

### 4.1. application YAML

application.yml 파일 설정은 다음과 같다.

1. 정적 이미지 경로의 접미사를 `/static`으로 지정한다.
  - 해당 설정을 통해 HTTP 요청 경로가 `/static`으로 시작하는 경우 클래스 패스의 /static 디렉토리를 탐색한다.
2. 타임리프(thymeleaf) 템플릿 파일 경로를 지정한다.

```yml
spring:
  mvc:
    static-path-pattern: /static/** # 1
  thymeleaf:
    prefix: classpath:templates/ # 2
    check-template-location: true
    suffix: .html
    mode: HTML5
    cache: false
```

### 4.2. image HTML

1. 클래스패스 /static/images 경로에 미리 저장된 이미지를 조회를 요청한다. 
2. 특정 문자열에 대한 바코드 이미지 생성을 요청한다.
  - 클래스패스 /static/images 디렉토리에 이미지를 저장한다.
3. 특정 문자열에 대한 바코드 이미지 생성을 요청한다.
  - 프로젝트 루트 /images 디렉토리에 이미지를 저장한다.
4. 서버로부터 전달 받은 이미지 경로를 img 태그에 설정한다.

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="ko">
<head>
    <meta charset="UTF-8">
    <title>Barcode Image 생성</title>
    <style type="text/css">
      /* ... */
    </style>
</head>
<body>
<div class="container">
    <form th:action="@{/static}" method="post"> <!-- 1 -->
        <p>기존 이미지<br>(/static/images 경로)</p>
        <button type="submit">enter</button>
    </form>
    <form th:action="@{/static/barcode}" th:object="${staticBarcode}" method="post"> <!-- 2 -->
        <p>바코드 문자열<br>(/static/images 경로)</p>
        <label>
            <input type="text" th:field="*{value}" placeholder="바코드 생성 문자열"/>
        </label>
        <button type="submit">enter</button>
    </form>
    <form th:action="@{/extra/barcode}" th:object="${dynamicBarcode}" method="post"> <!-- 3 -->
        <p>바코드 문자열<br>(별도 images 경로)</p>
        <label>
            <input type="text" th:field="*{value}" placeholder="바코드 생성 문자열"/>
        </label>
        <button type="submit">입력</button>
    </form>
</div>
<div class="image-wrap">
    <div class="image">
        <p th:if="${imagePath != null}">바코드 이미지</p>
        <img th:src="${imagePath}" alt="barcode-image"/> <!-- 4 -->
    </div>
</div>
</body>
</html>
```

### 4.3. BlogController Class

1. /static 경로
  - 클래스패스 /static/images 디렉토리에 미리 저장된 sample.png 이미지의 경로를 응답한다.
2. /static/barcode 경로
  - 새로운 이미지 파일을 클래스패스 /static/images 디렉토리에 생성한다.
  - 새로 생성한 이미지 파일의 경로를 응답한다.
3. /extra/barcode 경로
  - 새로운 이미지 파일을 프로젝트 루트 /images 디렉토리에 생성한다.
  - 새로 생성한 이미지 파일의 경로를 응답한다.

```java
package blog.in.action.controller;

import blog.in.action.model.Barcode;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

import javax.servlet.http.HttpServletRequest;
import java.nio.file.Path;
import java.util.Objects;

import static blog.in.action.util.BarcodeUtil.createBarcodeImage;

@Log4j2
@Controller
public class BlogController {

    private final static ClassLoader classLoader = BlogController.class.getClassLoader();
    private final static String STATIC_IMAGE_PATH = "/static/images";
    private final static String STATIC_IMAGE_DIR = Objects.requireNonNull(classLoader.getResource("")).getPath() + STATIC_IMAGE_PATH;
    private final static String IMAGE_PATH = "/images";
    private final static String IMAGE_DIR = Path.of("./") + IMAGE_PATH;

    private String getServerUrl(HttpServletRequest request) {
        return "http://" +
                request.getServerName() +
                ":" +
                request.getServerPort();
    }

    private void createEmptyBarcode(Model model) {
        model.addAttribute("staticBarcode", new Barcode());
        model.addAttribute("dynamicBarcode", new Barcode());
    }

    @GetMapping(value = {"", "/"})
    public String index(Model model) {
        model.addAttribute("imagePath", null);
        createEmptyBarcode(model);
        return "image";
    }

    @PostMapping("/static") // 1
    public String staticFolder(HttpServletRequest request, Model model) {
        model.addAttribute("imagePath", getServerUrl(request) + STATIC_IMAGE_PATH + "/sample.png");
        createEmptyBarcode(model);
        return "image";
    }

    @PostMapping("/static/barcode") // 2
    public String barcodeInStaticFolder(
            HttpServletRequest request,
            Model model,
            @ModelAttribute Barcode barcode
    ) {
        String fileName = createBarcodeImage(STATIC_IMAGE_DIR, barcode.getValue());
        model.addAttribute("imagePath", getServerUrl(request) + STATIC_IMAGE_PATH + "/" + fileName);
        createEmptyBarcode(model);
        return "image";
    }

    @PostMapping("/extra/barcode") // 3
    public String barcodeInExtraFolder(
            HttpServletRequest request,
            Model model,
            @ModelAttribute Barcode barcode
    ) {
        String fileName = createBarcodeImage(IMAGE_DIR, barcode.getValue());
        model.addAttribute("imagePath", getServerUrl(request) + IMAGE_PATH + "/" + fileName);
        createEmptyBarcode(model);
        return "image";
    }
}
```

### 4.4. Run application

애플리케이션을 실행해보자. 먼저 IDE 환경에서 실행해보자.

- 클래스패스 /static/images 경로에 미리 저장된 이미지를 조회할 수 있다.
- 클래스패스 /static/images 경로에 업로드 된 이미지를 조회할 수 있다.
- 프로젝트 루트 /images 경로에 업로드 된 이미지를 조회할 수 있다.

<div align="center">
  <img src="/images/posts/2021/cannot-find-static-resource-02.gif" width="100%" class="image__border">
</div>

다음 jar 파일로 애플리케이션을 실행해보자.

- 클래스패스 /static/images 경로에 미리 저장된 이미지를 조회할 수 있다.
- 클래스패스 /static/images 경로에 이미지 업로드가 실패한다.
- 프로젝트 루트 /images 경로에 업로드 된 이미지를 조회할 수 있다.

<div align="center">
  <img src="/images/posts/2021/cannot-find-static-resource-03.gif" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-08-06-cannot-find-static-resource>

#### REFERENCE

- <https://stackoverflow.com/questions/45651119/spring-boot-images-uploading-and-serving>
- <https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.developing-web-applications.spring-mvc.static-content>

[when-run-jar-then-fail-to-read-resource-link]: https://junhyunny.github.io/java/spring-boot/when-run-jar-then-fail-to-read-resource/