---
title: "퍼사드 패턴(Facade Pattern)"
publishedAt: "2022-07-03"
updatedAt: "2026-11-12T16:18:19+09:00"
canonicalPath: "/information/design-pattern/facade-pattern/"
categories:
  - "information"
  - "design-pattern"
summary: "퍼사드 패턴의 구조와 사용 이유를 살펴보고, barcode4j 라이브러리 사례를 바탕으로 BarcodeImageFacade 인터페이스를 만들어 적용했다."
---

## 0. 들어가면서

최근 읽은 책들에 퍼사드 패턴(Facade Pattern)을 사용한 예시나 사례가 상당히 많았다. 그러다 Spring 프레임워크로 개발한 애플리케이션을 디버깅할 때 콜 스택(call stack) 저 아래에서 `Facade`라는 이름을 가진 클래스를 종종 봤던 것이 떠올랐다. 이번 글에서는 퍼사드 패턴이 무엇인지, 왜 사용하는지 알아보고 실제 사례를 정리했다.

## 1. 퍼사드 패턴(Facade Pattern)

> [Design Patterns: Elements of Reusable Object Oriented Software][design-pattern-book-link]<br/>
> 한 서브시스템(subsystem) 내의 인터페이스 집합에 대한 획일화 된 하나의 인터페이스를 제공하는 패턴으로,
> 서브시스템을 사용하기 쉽도록 상위 수준의 인터페이스를 정의합니다.

`GoF 디자인 패턴` 책은 언제 읽어도 어렵다. 이해하기 쉽게 정리해 보려 한다.

퍼사드(facade)는 프랑스어 `Façade`에서 유래한 단어로 건물의 외관이라는 뜻이다. 건물을 밖에서 보면 외관만 보이고 내부의 숨은 구조나 복잡함은 보이지 않는다. 퍼사드 패턴은 서브시스템의 복잡함이나 클래스들을 단순한 기능만 제공하는 인터페이스로 가린다. 덕분에 사용자(혹은 클라이언트)는 서브시스템의 기능을 고민 없이 쉽게 사용할 수 있다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/facade-pattern-01.png" width="70%" class="image__border">
</div>
<center>https://refactoring.guru/design-patterns/facade</center>

### 1.1. 퍼사드 패턴 구조

퍼사드 패턴은 복잡한 서브시스템을 대신하는 단순하고 일관된 인터페이스를 제공한다. 사용자는 서브시스템의 클래스를 직접 사용하지 않고, 단순한 형태로 통합된 메서드를 호출한다.

아래 비디오 포맷을 변경하는 라이브러리를 예로 들 수 있다. 비디오를 변환하려면 `AudioMixer`, `VideoFile`, `BitrateReader`, `CodecFactory` 등 많은 클래스가 필요하지만, `VideoConverter` 클래스는 외부에 `convertVideo` 메서드만 제공한다. 사용자(개발자)의 코드는 라이브러리의 복잡한 내부 구조를 신경 쓰지 않고 `convertVideo` 메서드만 호출한다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/facade-pattern-02.png" width="50%" class="image__border">
</div>
<center>https://refactoring.guru/design-patterns/facade</center>

### 1.2. 퍼사드 패턴을 사용하는 이유

퍼사드 패턴을 사용하는 이유는 다음과 같다.

- 사용자가 다뤄야 할 객체 수가 줄어 서브시스템을 쉽게 사용할 수 있다.
- 사용자의 코드와 서브시스템 사이의 결합도를 낮출 수 있다.
  - 사용자의 코드와 서브시스템의 코드는 서로를 알 필요가 없다.
  - 서브시스템 내부가 바뀌더라도 사용자의 코드는 바뀌지 않는다.

## 2. 퍼사드 패턴 사용 케이스 찾아보기

퍼사드 패턴과 관련된 글을 찾아보면 전자레인지, 컴퓨터 등 여러 부품의 동작을 하나의 기능으로 추상화한 예시 코드를 볼 수 있다. 책에서나 볼 법한 예시 코드보다 실제로 사용되는 사례에는 어떤 것이 있는지 궁금했다.

### 2.1. 이름만 "Facade"인 클래스

Spring 프레임워크에서 이름에 `Facade`가 붙은 클래스를 찾아봤지만, 단순한 래퍼(wrapper) 클래스뿐이었다. 디버깅할 때 자주 보이는 `RequestFacade`, `ResponseFacade` 모두 null 여부를 확인하는 로직만 추가된 래퍼 클래스다.

`RequestFacade` 클래스는 `org.apache.catalina.connector` 패키지에 있으며, Request 클래스를 감싼 채 null 여부 확인만 추가로 수행한다.

```java
public class RequestFacade implements HttpServletRequest {

    protected Request request = null;

    protected static final StringManager sm = StringManager.getManager(RequestFacade.class);

    public RequestFacade(Request request) {
        this.request = request;
    }

    public void clear() {
        this.request = null;
    }

    protected Object clone() throws CloneNotSupportedException {
        throw new CloneNotSupportedException();
    }

    public Object getAttribute(String name) {
        if (this.request == null) {
            throw new IllegalStateException(sm.getString("requestFacade.nullRequest"));
        } else {
            return this.request.getAttribute(name);
        }
    }

    public Enumeration<String> getAttributeNames() {
        if (this.request == null) {
            throw new IllegalStateException(sm.getString("requestFacade.nullRequest"));
        } else {
            return Globals.IS_SECURITY_ENABLED ? (Enumeration)AccessController.doPrivileged(new GetAttributePrivilegedAction()) : this.request.getAttributeNames();
        }
    }

    // ...
}
```

### 2.2. barcode4j 라이브러리

Spring 프레임워크에서는 마음에 드는 예시 클래스를 찾지 못했다. 적절한 사례를 찾던 중 위의 `VideoConverter` 클래스 사례를 보고 이전에 사용했던 `barcode4j` 라이브러리가 생각났다. [스프링 부트 애플리케이션이 이미지 에셋(asset)을 못 찾는 문제][cannot-find-static-resource-link] 글에서 소개했던 라이브러리로, 문자열을 이용해 바코드 이미지를 생성한다.

#### 2.2.1. 사용 코드 예시

다음은 [스프링 부트 애플리케이션이 이미지 에셋(asset)을 못 찾는 문제][cannot-find-static-resource-link] 글의 예제다. `Code128Bean` 클래스로 바코드를 생성한다. `Code128Bean` 클래스는 `BitmapCanvasProvider` 클래스에 의존해 바코드를 이미지로 만들고, `BitmapCanvasProvider` 클래스는 전달받은 `OutputStream`으로 생성한 이미지를 출력한다.

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

#### 2.2.2. barcode4j 라이브러리 구조

`Code128Bean` 클래스의 상속 구조를 보면 최상위 인터페이스는 `BarcodeGenerator`이다. 사용자는 바코드 이미지를 그리는 클래스들을 알 필요 없이 `BarcodeGenerator` 인터페이스의 구현체를 사용하면 쉽게 바코드 이미지를 생성할 수 있다. `BarcodeGenerator` 인터페이스는 다음과 같다.

```java
package org.krysalis.barcode4j;

import org.krysalis.barcode4j.output.CanvasProvider;

public interface BarcodeGenerator {

    void generateBarcode(CanvasProvider var1, String var2);

    BarcodeDimension calcDimensions(String var1);
}
```

`BarcodeGenerator` 인터페이스의 의존 관계를 따라가며 `barcode4j` 라이브러리가 어떤 구조인지 클래스 다이어그램으로 확인해 보자. 라이브러리 전체가 아니라 예시 코드에서 사용한 클래스와 연관된 부분만 확인했다. 다이어그램에는 `BarcodeGenerator` 인터페이스를 상속한 클래스와 이미지를 생성하는 데 사용하는 클래스가 있다. 각 요소의 역할은 다음과 같다.

- 왼쪽의 `Code128Encoder` 인터페이스는 바코드로 만들 문자열을 숫자 배열로 인코딩(encoding)한다.
- 가운데 `ClassicBarcodeLogicHandler` 인터페이스는 인코딩된 숫자에 해당하는 바(bar)를 생성한다.
- 오른쪽의 `Canvas` 클래스는 바 이미지를 그린다.

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/facade-pattern-03.png" width="100%" class="image__border">
</div>

## 3. BarcodeImageFacade 인터페이스 만들기

`BarcodeGenerator` 인터페이스도 훌륭하게 추상화된 메서드를 제공하지만, 다소 아쉬운 부분이 있었다. 사용자가 바코드를 생성하려면 `CanvasProvider` 인터페이스도 함께 알아야 한다는 점을 보완하고 싶었다. [스프링 부트 애플리케이션이 이미지 에셋(asset)을 못 찾는 문제][cannot-find-static-resource-link] 예제를 일부 변경해 바코드 이미지를 만드는 인터페이스와 간단한 화면을 만들었다.

`BarcodeImageFacade` 인터페이스에는 `OutputStream` 객체와 바코드로 만들고 싶은 문자열을 전달한다. `BarcodeImageFacade` 객체는 전달받은 `OutputStream` 객체로 바코드 이미지를 출력한다. `FileOutputStream` 객체를 이용하면 파일 형태로, `ServletOutputStream` 객체를 이용하면 HTTP 응답으로 이미지를 출력한다.

```java
package blog.in.action.barcode;

import java.io.OutputStream;

public interface BarcodeImageFacade {

    void generateBarcodeImage(OutputStream outputStream, String value);
}
```

`DefaultBarcodeImageFacade` 클래스는 기본적으로 `Code128` 형태의 바코드를 비트맵 이미지로 만든다.

```java
package blog.in.action.barcode;

import lombok.extern.log4j.Log4j2;
import org.krysalis.barcode4j.impl.code128.Code128Bean;
import org.krysalis.barcode4j.output.bitmap.BitmapCanvasProvider;
import org.krysalis.barcode4j.tools.UnitConv;
import org.springframework.stereotype.Component;

import java.awt.image.BufferedImage;
import java.io.OutputStream;

@Log4j2
@Component
public class DefaultBarcodeImageFacade implements BarcodeImageFacade {

    private final static int dpi = 100;

    @Override
    public void generateBarcodeImage(OutputStream outputStream, String value) {
        Code128Bean bean = new Code128Bean();
        bean.setModuleWidth(UnitConv.in2mm(3.0f / dpi));
        bean.doQuietZone(false);
        try (OutputStream out = outputStream) {
            BitmapCanvasProvider canvas = new BitmapCanvasProvider(out, "image/x-png", dpi, BufferedImage.TYPE_BYTE_BINARY, false, 0);
            bean.generateBarcode(canvas, value);
            canvas.finish();
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
    }
}
```

`BlogController` 클래스는 퍼사드 패턴이 제공하는 인터페이스를 사용하는 클래스다. 바코드와 관련된 의존성은 `BarcodeImageFacade` 인터페이스뿐이며, `/barcode` 경로로 오는 요청에 대한 응답으로 바코드 이미지를 전달한다.

```java
package blog.in.action.controller;

import blog.in.action.barcode.BarcodeImageFacade;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import javax.servlet.ServletResponse;
import java.io.IOException;
import java.util.Optional;

@Log4j2
@Controller
public class BlogController {

    private final BarcodeImageFacade imageFacade;

    public BlogController(BarcodeImageFacade imageFacade) {
        this.imageFacade = imageFacade;
    }

    @GetMapping(value = {"", "/"})
    public String index() {
        return "image";
    }

    @GetMapping(value = {"/barcode", "/barcode/{value}"})
    public void barcodeInStaticFolder(ServletResponse response, @PathVariable Optional<String> value) throws IOException {
        imageFacade.generateBarcodeImage(response.getOutputStream(), value.orElse("DEFAULT"));
    }
}
```

`image.html` 화면은 처음에 `DEFAULT` 문자열에 해당하는 바코드 이미지를 출력한다. 텍스트 박스의 문장이 바뀔 때마다 `img` 태그의 `src` 값을 변경해 이미지를 갱신한다.

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" lang="ko">
<head>
    <meta charset="UTF-8">
    <title>Barcode Image 생성</title>
    <style>
        * {
            margin: 0;
            padding: 0;
        }

        #container {
            width: 100%;
        }

        .image__wrap {
            width: 50%;
            min-width: 16rem;
            max-width: 20rem;

            margin: 1rem;
            padding: 1rem;
            border: 1px solid #AAA;
            border-radius: 5px;

            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .image__wrap img {
            border: 1px solid;
            width: 100%;
            height: 7.5rem;
            min-width: 18rem;
            max-width: 18rem;
        }

        .text__wrap {
            margin: 0.5rem;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: 1rem;
        }
    </style>
</head>
<body>
<div id="container">
    <div class="image__wrap">
        <img id="barcodeImage" src="/barcode" alt="이미지">
        <div class="text__wrap">
            <input id="barcodeValue" type="text" placeholder="바코드 생성 문자열" onkeypress="pressEnter()">
            <button onclick="createBarcode()">생성</button>
        </div>
    </div>
</div>
</body>
<script type="text/javascript">
    const input = document.querySelector("#barcodeValue");
    input.addEventListener("keyup", function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            createBarcode();
        }
    });

    function createBarcode() {
        const input = document.querySelector("#barcodeValue");
        const image = document.querySelector("#barcodeImage");
        image.src = "/barcode/" + input.value;
    }
</script>
</html>
```

실행하면 다음처럼 텍스트 박스에 입력한 문자열에 맞춰 바코드 이미지가 만들어진다.

<div align="left">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/facade-pattern-04.gif" width="50%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-07-03-facade-pattern>

#### REFERENCE

- [Design Patterns: Elements of Reusable Object Oriented Software][design-pattern-book-link]
- <https://refactoring.guru/design-patterns/facade>
- <https://imasoftwareengineer.tistory.com/29>
- <https://www.yworks.com/yed-live/>

[cannot-find-static-resource-link]: https://junhyunny.github.io/spring-boot/cannot-find-static-resource/
[design-pattern-book-link]: https://www.kyobobook.co.kr/product/detailViewKor.laf?mallGb=KOR&ejkGb=KOR&barcode=9791195444953
