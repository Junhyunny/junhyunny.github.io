---
title: "Content-Type 헤더와 스프링 부트 애너테이션" 
search: false
category:
  - information
  - spring-boot
  - javascript
last_modified_at: 2025-12-30T23:55:00
---

<br/>

## 0. 들어가면서

스프링 프레임워크에서 API 엔드포인트를 추가하다 보면 종종 아래와 같은 에러를 만난다. 대부분 프론트엔드에서 지정한 Content-Type 헤더의 값과 백엔드에서 받고자 하는 데이터 타입이 어긋나서 발생했던 것 같다. 

- HttpMessageNotReadableException: Required request body is missing

```
08:19:18.788 [main] WARN org.springframework.web.servlet.mvc.support.DefaultHandlerExceptionResolver 
 - Resolved [org.springframework.http.converter.HttpMessageNotReadableException: Required request body is missing: public java.lang.String action.in.blog.controller.ContentTypeController.requestBody(action.in.blog.dto.ContentTypeDto)]
```

- HttpMediaTypeNotSupportedException: Content type 'text/plain;charset=UTF-8' not supported

```
2022-02-09 15:07:11.585  WARN 74211 --- [nio-8080-exec-8] .w.s.m.s.DefaultHandlerExceptionResolver
 : Resolved [org.springframework.web.HttpMediaTypeNotSupportedException: Content type 'text/plain;charset=UTF-8' not supported]
```

## 1. HTTP Content-Type header

HTTP의 Content-Type 헤더에 대해 알아보고, 종류에 따른 데이터 수신 방식을 알아보자. 

> The Content-Type representation header is used to indicate the original media type of the resource 
> (prior to any content encoding applied for sending).

Content-Type 헤더는 메시지에 담긴 데이터가 어떤 타입인지 알려주는 역할로 사용된다. Content-Type 헤더가 없으면 수신받는 측에서 메시지를 단순한 텍스트로 판단한다. 보통 Content-Type 헤더의 값으로 `MIME(Multipurpose Internet Mail Extensions)` 타입을 사용한다.

- Content-Type 헤더의 값인 `MIME` 타입은 `타입/서브타입` 형태의 데이터 구조를 가진다.
- Content-Type 헤더의 기본값은 `text/plain`이다.

```
Content-Type: type/subtype
```

Content-Type 헤더는 왜 필요할까? 클라이언트가 서버로 GET 방식 HTTP 요청을 보낼 때 필요한 파라미터는 URL 뒤에 붙는다. 이 경우 서버는 클라이언트가 Content-Type 헤더를 굳이 보내지 않더라도 URL에 포함된 `key=value`를 추출하여 메시지를 알아낼 수 있다. 

```
http://localhost:8080?key1=value1&key2=value2
```

클라이언트가 POST/PUT 방식처럼 메시지 바디에 다양한 종류의 데이터를 담을 수 있는 요청은 Content-Type 헤더가 필요하다. 상황에 따라 `key=value`, `json`이나 `이진 값` 같은 데이터가 들어가기 때문이다.

```
POST /oauth/token HTTP/1.1
Host: localhost:8080
User-Agent: insomnia/2021.3.0
Content-Type: application/x-www-form-urlencoded
Authorization: Basic Q0xJRU5UX0lEOkNMSUVOVF9TRUNSRVQ=
Accept: */*
Content-Length: 51

username=junhyunny&password=123&grant_type=password
```

아래 이미지는 메시지와 이미지를 함께 서버로 전송할 때 Content-Type 헤더의 쓰임새를 나타낸다.

<div align="center">
  <img src="/images/posts/2022/content-type-and-spring-annotation-01.png" width="100%" class="image__border">
</div>

## 2. MIME(Multipurpose Internet Mail Extensions)

Content-Type 헤더에 사용되는 MIME(Multipurpose Internet Mail Extensions)은 무엇일까?

> Multipurpose Internet Mail Extensions - 다용도 인터넷 메일 확장자<br/>
> MIME(영어: Multipurpose Internet Mail Extensions)는 전자 우편을 위한 인터넷 표준 포맷이다. 
> 전자우편은 7비트 ASCII 문자를 사용하여 전송되기 때문에, 8비트 이상의 코드를 사용하는 문자나 이진 파일들은 MIME 포맷으로 변환되어 SMTP로 전송된다. 
> 실질적으로 SMTP로 전송되는 대부분의 전자 우편은 MIME 형식이다.

Content-Type 헤더와 MIME 타입은 전자 우편을 위해 정의되었지만, HTTP, SIP 같은 인터넷 프로토콜에서 전송 데이터를 표현하기 위해 사용되고 있다. 위에서 설명했듯이 MIME 타입의 구조는 `타입/서브타입` 형태를 가진다. 간단히 어떤 종류가 있는지 알아보겠다. 

- 아래 표에는 없지만, `application/json` 타입이 있다.
- 이 외에도 멀티파트(multipart) 타입이 있다. 하나의 메시지 바디에 서로 다른 타입들이 들어가는 경우 사용한다.
  - multipart/form-data
  - multipart/byreranges

<div align="center">
  <img src="/images/posts/2022/content-type-and-spring-annotation-02.png" width="85%">
</div>
<center>https://developer.mozilla.org/ko/docs/Web/HTTP/Basics_of_HTTP/MIME_types</center>

## 3. MIME type in frontend application

프론트엔드 애플리케이션을 개발하면 자주 만나는 MIME 타입들을 정리해보자. 먼저 form 태그는 기본적으로 `application/x-www-form-urlencoded` 타입이 사용된다. `application/x-www-form-urlencoded` 타입은 메시지가 `key=value` 형태로 전달된다.

- submit 타입을 가지는 버튼을 폼(form) 내부에 만든다.
- 버튼을 누르면 폼 내부에 데이터가 서버로 전달된다.

```html
<form action="http://localhost:8080/nothing" method="post">
    <input type="text" name="item" placeholder="item"/>
    <button type="submit">submit</button>
</form>
```

위 form 내부 버튼을 누르면 다음과 같은 POST 요청이 전송된다.

```
POST /nothing HTTP/1.1
Host: localhost:8080
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:96.0) Gecko/20100101 Firefox/96.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Content-Type: application/x-www-form-urlencoded
Content-Length: 16
Origin: http://localhost:3000
Connection: keep-alive
Referer: http://localhost:3000/

item=Hello+World
```

form 태그를 사용할 때 Content-Type 헤더를 변경할 수 있다. 파일을 서버로 전송하는 경우 `multipart/form-data` 타입을 사용해야 한다. 이 경우 `enctype` 속성을 통해 `multipart/form-data`으로 `MIME` 타입을 변경한다.

```html
<form action="http://localhost:8080/file" method="post" enctype="multipart/form-data">
    <input type="file" name="file">
    <button type="submit">submit</button>
</form>
```

form 태그의 Content-Type 헤더를 변경했을 때 전송되는 POST 요청은 다음과 같다.

- "Hello World" 문자열과 JPEG 이미지 파일을 전송하였다.

```
POST /nothing HTTP/1.1
Host: localhost:8080
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:96.0) Gecko/20100101 Firefox/96.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Content-Type: multipart/form-data; boundary=---------------------------718646188872411308296037004
Content-Length: 88701
Origin: http://localhost:3000
Connection: keep-alive
Referer: http://localhost:3000/

-----------------------------718646188872411308296037004
Content-Disposition: form-data; name="item"

Hello World
-----------------------------718646188872411308296037004
Content-Disposition: form-data; name="file"; filename="content-type-and-spring-annotation-2.JPG"
Content-Type: image/jpeg

PNG

... encoding value like ahjk1298fvn923bnhvbjxnjvai891284r

<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="XMP Core 6.0.0">
   <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <rdf:Description rdf:about=""
            xmlns:exif="http://ns.adobe.com/exif/1.0/">
         <exif:PixelYDimension>623</exif:PixelYDimension>
         <exif:PixelXDimension>911</exif:PixelXDimension>
         <exif:UserComment>Screenshot</exif:UserComment>
      </rdf:Description>
   </rdf:RDF>
</x:xmpmeta>

... encoding value like jdwqjkoc9802ntu81981273hidaskjascnj

-----------------------------718646188872411308296037004--
```

AJAX(Asynchronous JavaScript And XML) 요청을 위해 브라우저에서 기본으로 제공하는 Web API `fetch` 함수는 기본 Content-Type 헤더가 `text/plain`이다. 

```javascript
    fetch(`http://localhost:8080${path}`, {
        method: "POST",
        body: {
            item
        }
    })
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.log(error));
```

위 fetch 함수를 통해 POST 요청을 보내면 다음과 같은 정보가 전송된다.

```
POST /nothing HTTP/1.1
Host: localhost:8080
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:96.0) Gecko/20100101 Firefox/96.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://localhost:3000/
Content-Type: text/plain;charset=UTF-8
Origin: http://localhost:3000
Content-Length: 15
Connection: keep-alive

[object Object]
```

fetch API 함수 대신 가장 많이 사용되는 `axios` 모듈은 어떨까? `axios`는 기본적으로 `application/json` 타입이 사용된다. 

```javascript
    axios.post(`http://localhost:8080${path}`, {item})
        .then(({data}) => console.log(data))
        .catch(error => console.log(error));
```

위 axios 모듈의 POST 요청을 보내면 다음과 같은 정보가 전송된다.

```
POST /request-body HTTP/1.1
Host: localhost:8080
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:96.0) Gecko/20100101 Firefox/96.0
Accept: application/json, text/plain, */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Content-Type: application/json
Content-Length: 17
Origin: http://localhost:3000
Connection: keep-alive
Referer: http://localhost:3000/

{"item":"Hello World"}
```

## 4. Spring boot endpoint with Content-Type 

스프링 프레임워크에서 엔드포인트를 담당하는 컨트롤러(controller) 객체의 메소드에 매핑되는 파라미터는 HandlerMethodArgumentResolver 인스턴스들에 의해 처리된다. 스프링 애플리케이션은 서비스가 실행될 때 필요한 HandlerMethodArgumentResolver 인스턴스들이 스프링 컨텍스트에 등록된다.

1. 해당 요청을 처리할 엔드포인트 메소드를 찾는다.
2. 해당 메소드의 파라미터 앞에 붙은 애너테이션을 지원하는 `Resolver` 클래스를 찾는다.
3. 이후 `Resolver` 클래스의 `resolveArgument` 메소드를 통해 메시지에 담긴 데이터를 엔드포인트 메소드의 파라미터로 변경한다.

이번 글에선 자주 사용하는 Content-Type 헤더와 이를 처리하는 애너테이션을 정리했다. 간단한 테스트 코드를 통해 확인하였으며, 데이터를 받을 때 사용하는 DTO(Data Transfer Object)는 다음과 같다.

```java
package action.in.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContentTypeDto {

    private String item;
    private MultipartFile file;
}
```

Content-Type 헤더가 `application/x-www-form-urlencoded`이나 `multipart/form-data` 타입의 메시지는 `key=value` 형식으로 메시지를 전달한다. 애너테이션은 별도로 필요 없다. 애너테이션이 없는 경우 @ModelAttribute 애너테이션을 사용하는 것과 동일하다. `ServletModelAttributeMethodProcessor` 객체에 의해 처리된다. 키(key)와 동일한 이름을 가지는 클래스 필드(field)에 값이 매칭된다.

```java
    @PostMapping("/nothing")
    public String nothing(ContentTypeDto contentTypeDto) {
        System.out.println(contentTypeDto);
        return "Data what server get via /nothing path: " + contentTypeDto;
    }
```

@ModelAttribute 애너테이션을 사용하는 것도 좋다. 위와 동일하게 ServletModelAttributeMethodProcessor 객체에 의해 처리된다. 키와 동일한 이름을 가지는 클래스 필드에 값이 매칭된다.

```java
    @PostMapping("/model-attribute")
    public String modelAttribute(@ModelAttribute ContentTypeDto contentTypeDto) {
        System.out.println(contentTypeDto);
        return "Data what server get via /model-attribute path: " + contentTypeDto;
    }
```

`application/x-www-form-urlencoded`이나 `multipart/form-data` 타입은 메시지가 `key=value` 형식이므로 @RequestParam 애너테이션을 통해 데이터를 받을 수 있다. RequestParamMethodArgumentResolver 객체에 의해 처리되지만, RequestParamMethodArgumentResolver 객체는 resolveArgument 메소드를 재정의하지 않는다. 실제론 부모 클래스인 AbstractNamedValueMethodArgumentResolver 클래스의 resolveArgument 메소드에 의해 처리된다.

```java
    @PostMapping("/request-param")
    public String requestParam(@RequestParam("item") String item, @RequestParam(value = "file", required = false) MultipartFile multipartFile) {
        System.out.println(item);
        System.out.println(multipartFile);
        return "Data what server get via /request-param path: " + item + ", file: " + multipartFile;
    }
```

Content-Type 헤더가 `application/json` 타입의 메시지는 @RequestBody 애너테이션을 사용한다. @RequestBody 애너테이션에 매칭된 메소드 파라미터는 RequestResponseBodyMethodProcessor 객체에 의해 처리된다. JSON 객체의 키와 동일한 이름인 Dto 객체의 필드에 데이터가 매칭된다.

```java
    @PostMapping("/request-body")
    public String requestBody(@RequestBody ContentTypeDto contentTypeDto) {
        System.out.println(contentTypeDto);
        return "Data what server get via /request-body path: " + contentTypeDto;
    }
```

@RequestBody 애너테이션은 `application/json` 타입을 처리할 때 사용하지만, MultiValueMap 객체와 함께 사용하면 `application/x-www-form-urlencoded` 타입도 처리가 가능하다. 단, 이 경우 `application/json` 타입은 처리가 불가능하다.

```java
    @PostMapping("/request-body-with-multi-value-map")
    public String requestBody(@RequestBody MultiValueMap<String, Object> multiValueMap) {
        System.out.println(multiValueMap);
        return "Data what server get via /request-body-with-multi-value-map path: " + multiValueMap;
    }
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-02-09-content-type-and-spring-annotation>

#### REFERENCE

- <https://developer.mozilla.org/ko/docs/Web/HTTP/Basics_of_HTTP/MIME_types>
- <https://ko.wikipedia.org/wiki/MIME#Content-Type>
- <https://dololak.tistory.com/130>
- <https://webstone.tistory.com/66>
- <https://blog.naver.com/writer0713/221853596497>
- <https://springsource.tistory.com/90>