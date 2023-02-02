---
title: "Thymeleaf - cannot find images"
search: false
category:
  - spring-boot
last_modified_at: 2021-09-04T16:30:00
---

<br/>

## 1. 문제 해결 실마리

클라이언트가 요청한 특정 문자열에 해당하는 바코드 이미지를 생성한 후 페이지에 담아 반환하는 기능을 구현하는 중에 이미지를 찾지 못하는 문제가 발생하였습니다. 
문제 현상에 대해 요약하여 설명하면 다음과 같습니다. 
- `static/images/` 폴더에 기존에 저장되어 있던 이미지는 잘 찾는다.
- 클라이언트 요청으로 `static/images/` 폴더에 새롭게 생성한 이미지는 찾지 못한다.

<p align="center"><img src="/images/cannot-find-static-resource-1.JPG" width="45%"></p>
<center>https://post.naver.com/viewer/postView.nhn?volumeNo=17690733&memberNo=32787874</center>

동일 폴더에서 기존에 있던 이미지는 잘 찾아오는데, 신규 이미지는 찾지 못하는 이상한 현상이 발생했습니다. 
처음엔 서버의 정적 자원(static resource)이 캐싱(caching)되어 발생하는 문제로 예상하여 관련된 설정을 확인해보았지만 해결책을 찾지 못했습니다. 
동적으로 생성되는 이미지 자원을 서비스하지 못한다는 내용의 에러를 찾아보는 중 `StackOverFlow`에서 해결의 실마리를 찾았습니다. 

<p align="center"><img src="/images/cannot-find-static-resource-2.JPG" width="60%"></p>
<center>https://stackoverflow.com/questions/45651119/spring-boot-images-uploading-and-serving</center>

요약하자면 다음과 같습니다.
- 보통 `static/images/` 폴더를 이미지 저장에 사용한다.
- `Thymeleaf`는 `static/images` 폴더에 렌더링(rendering)에 필요한 정적인 이미지들이 있다고 예상한다. 
- `static/images/` 폴더에 업로드한(동적인) 컨텐츠를 올리는 것은 좋지 않은 방식이다.

해당 힌트를 바탕으로 문제를 해결하였고, 관련된 코드를 정리하여 공유하겠습니다.

## 2. 예제 코드

### 2.1. 패키지 구조
```
./
|-- README.md
|-- action-in-blog.iml
|-- images
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
        |               |-- config
        |               |   `-- WebMvcConfiguration.java
        |               |-- controller
        |               |   `-- BlogController.java
        |               `-- dto
        |                   `-- Barcode.java
        `-- resources
            |-- application.yml
            |-- static
            |   `-- images
            |       `-- TEST.png
            `-- templates
                `-- image.html
```

### 2.2. application.yml
- Thymeleaf 관련 설정입니다.

```yml
spring:
  mvc:
    static-path-pattern: /static/**
  thymeleaf:
    prefix: classpath:templates/
    check-template-location: true
    suffix: .html
    mode: HTML5
    cache: false
```

### 2.3. image.html
- 기존 이미지(/static/images 경로) - resources 폴더 내 /static/images 경로에 존재하는 기존 이미지가 담긴 페이지를 반환합니다.
- 바코드 문자열(/static/images 경로) - resources 폴더 내 /static/images 경로에 신규 이미지 생성 후 페이지를 반환합니다.
- 바코드 문자열(별도 images 경로) - 서버 ROOT 폴더 내 /images 경로에 신규 이미지 생성 후 페이지를 반환합니다.

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="ko">
<head>
    <meta charset="UTF-8">
    <title>Barcode Image 생성</title>
    <style type="text/css">
        * {
            margin: 0;
            padding: 0;
        }

        #container {
            height: 100%;
            width: 100%;
            font-size: 0;
        }

        #left, #middle, #right {
            display: inline-block;
            *display: inline;
            zoom: 1;
            vertical-align: top;
            font-size: 12px;
        }

        #left {
            width: 33%;
        }

        #middle {
            width: 33%;
        }

        #right {
            width: 33%;
        }
    </style>
</head>
<body>
<div id="container">
    <div id="left">
        <form th:action="@{/static}" method="post">
            <table border=1>
                <tr>
                    <td>기존 이미지<br/>(/static/images 경로)</td>
                </tr>
            </table>
            <br/>
            <button type="submit">enter</button>
        </form>
    </div>
    <div id="middle">
        <form th:action="@{/static/barcode}" th:object="${staticBarcode}" method="post">
            <table border=1>
                <tr>
                    <td>바코드 문자열<br/>(/static/images 경로)</td>
                    <td>
                        <input type="text" th:field="*{value}" placeholder="바코드 생성 문자열">
                    </td>
                </tr>
            </table>
            <br/>
            <button type="submit">enter</button>
        </form>
    </div>
    <div id="right">
        <form th:action="@{/extra/barcode}" th:object="${dynamicBarcode}" method="post">
            <table border=1>
                <tr>
                    <td>바코드 문자열<br/>(별도 images 경로)</td>
                    <td>
                        <input type="text" th:field="*{value}" placeholder="바코드 생성 문자열">
                    </td>
                </tr>
            </table>
            <br/>
            <button type="submit">입력</button>
        </form>
    </div>
</div>
<p th:if="${imagePath != null}">바코드 이미지</p>
<img th:src="${imagePath}"/>
</body>
</html>
```

### 2.4. Barcode 클래스
- 페이지로부터 데이터를 전달받기 위한 Dto 클래스입니다.

```java
package blog.in.action.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Barcode {

    private String value;
}
```

### 2.5. WebMvcConfiguration 클래스
- resource 자원 조회를 위한 URL 경로와 파일 위치를 지정합니다. 
- `/images/**` 경로 요청 시 자원(resource) 위치는 파일 시스템 `images/` 위치를 사용합니다.

```java
package blog.in.action.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfiguration implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(final ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/images/**").addResourceLocations("file:images/");
    }
}
```

### 2.6. BarcodeUtil 클래스
- 바코드 이미지를 생성하는 클래스입니다.
- createBarcodeImage 메소드 - 이미지 생성 후 파일의 이름을 반환합니다.

```java
@Log4j2
class BarcodeUtil {

    private final static int dpi = 100;

    public static String createBarcodeImage(String filePath, String value) {
        String filName = UUID.randomUUID() + ".png";
        Code128Bean bean = new Code128Bean();
        bean.setModuleWidth(UnitConv.in2mm(3.0f / dpi));
        bean.doQuietZone(false);
        File folder = new File(filePath);
        if (!folder.exists()) {
            folder.mkdir();
        }
        String filePathAndName = filePath + "/" + filName;
        File outputFile = new File(filePathAndName);
        try (OutputStream out = new FileOutputStream(outputFile)) {
            BitmapCanvasProvider canvas = new BitmapCanvasProvider(out, "image/x-png", dpi, BufferedImage.TYPE_BYTE_BINARY, false, 0);
            bean.generateBarcode(canvas, value);
            canvas.finish();
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
        return filName;
    }
}
```

### 2.7. BlogController 클래스
- `/static` 경로 - resources 폴더 내 `/static/images` 경로에 있는 `TEST.png` 이미지를 페이지에 담아서 반환합니다.
- `/static/barcode` 경로 - resources 폴더 내 `/static/images` 경로에 신규 이미지를 생성 후 해당 이미지 경로를 페이지에 담아서 반환합니다.
- `/extra/barcode` 경로 - 서버 ROOT 폴더 내 `/images` 경로에 신규 이미지를 생성 후 해당 이미지 경로를 페이지에 담아서 반환합니다.

```java
package blog.in.action.controller;

import static blog.in.action.controller.BarcodeUtil.createBarcodeImage;
import blog.in.action.dto.Barcode;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.UUID;
import javax.servlet.http.HttpServletRequest;
import lombok.extern.log4j.Log4j2;
import org.krysalis.barcode4j.impl.code128.Code128Bean;
import org.krysalis.barcode4j.output.bitmap.BitmapCanvasProvider;
import org.krysalis.barcode4j.tools.UnitConv;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

@Log4j2
@Controller
public class BlogController {

    private String getServerUrl(HttpServletRequest request) {
        return new StringBuffer("http://").append(request.getServerName()).append(":").append(request.getServerPort()).toString();
    }

    @GetMapping(value = {"", "/"})
    public String index(Model model) {
        model.addAttribute("imagePath", null);
        model.addAttribute("staticBarcode", new Barcode());
        model.addAttribute("dynamicBarcode", new Barcode());
        return "image";
    }

    @PostMapping(value = {"/static"})
    public String staticFolder(HttpServletRequest request, Model model) {
        String serverUrl = getServerUrl(request);
        String filePath = "/static/images";
        model.addAttribute("imagePath", serverUrl + filePath + "/TEST.png");
        model.addAttribute("staticBarcode", new Barcode());
        model.addAttribute("dynamicBarcode", new Barcode());
        return "image";
    }

    @PostMapping(value = {"/static/barcode"})
    public String barcodeInStaticFolder(HttpServletRequest request, Model model, @ModelAttribute Barcode barcode) {
        String serverUrl = getServerUrl(request);
        String filePath = "/static/images";
        String fileName = createBarcodeImage("./src/main/resources" + filePath, barcode.getValue());
        model.addAttribute("staticBarcode", new Barcode());
        model.addAttribute("dynamicBarcode", new Barcode());
        model.addAttribute("imagePath", serverUrl + filePath + "/" + fileName);
        return "image";
    }

    @PostMapping(value = "/extra/barcode")
    public String barcodeInExtraFolder(HttpServletRequest request, Model model, @ModelAttribute Barcode barcode) {
        String serverUrl = getServerUrl(request);
        String filePath = "/images";
        String fileName = createBarcodeImage("." + filePath, barcode.getValue());
        model.addAttribute("staticBarcode", new Barcode());
        model.addAttribute("dynamicBarcode", new Barcode());
        model.addAttribute("imagePath", serverUrl + filePath + "/" + fileName);
        return "image";
    }
}
```

##### 테스트 결과
- 맨 왼쪽 버튼을 누르면 `/resources/static/images` 폴더에 저장되어 있던 이미지를 페이지에 담아 반환한다.
    - 이미지가 정상적으로 보인다.
- 가운데 버튼을 누르면 `/resources/static/images` 폴더에 이미지를 생성하고 페이지에 담아 반환한다.
    - 이미지가 정상적으로 보이지 않는다.
- 맨 오른쪽 버튼을 누르면 `/images` 폴더에 이미지를 생성하고 페이지에 담아 반환한다.
    - 이미지가 정상적으로 보인다.

<p align="center"><img src="/images/cannot-find-static-resource-3.gif" width="100%"></p>

## CLOSING
정적 자원을 관리하는 경로 내 자원 변화에 대한 감지가 불가능하다는 레퍼런스(reference)는 확인하지 못하였습니다. 
추후에라도 정확한 원인이 확인된다면 해당 포스트에 추가하도록 하겠습니다.

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-08-06-cannot-find-static-resource>

#### REFERENCE
- <https://stackoverflow.com/questions/45651119/spring-boot-images-uploading-and-serving>
- <https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.developing-web-applications.spring-mvc.static-content>