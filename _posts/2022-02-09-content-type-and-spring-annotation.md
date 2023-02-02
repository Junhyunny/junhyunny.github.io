---
title: "Content-Type and Spring Boot annotation" 
search: false
category:
  - information
  - spring-boot
  - javascript
last_modified_at: 2022-02-09T23:55:00
---

<br/>

## 0. 들어가면서

Spring 프레임워크를 사용하는 프로젝트에서 신규 API 기능을 추가하다보면 종종 아래와 같은 에러를 만납니다. 
경험상 대부분 프론트엔드에서 지정한 `Content-Type`과 백엔드에서 받고자하는 데이터 타입이 어긋나서 발생했던 것 같습니다. 

##### HttpMessageNotReadableException: Required request body is missing

```
08:19:18.788 [main] WARN org.springframework.web.servlet.mvc.support.DefaultHandlerExceptionResolver 
 - Resolved [org.springframework.http.converter.HttpMessageNotReadableException: Required request body is missing: public java.lang.String action.in.blog.controller.ContentTypeController.requestBody(action.in.blog.dto.ContentTypeDto)]
```

##### HttpMediaTypeNotSupportedException: Content type 'text/plain;charset=UTF-8' not supported

```
2022-02-09 15:07:11.585  WARN 74211 --- [nio-8080-exec-8] .w.s.m.s.DefaultHandlerExceptionResolver
 : Resolved [org.springframework.web.HttpMediaTypeNotSupportedException: Content type 'text/plain;charset=UTF-8' not supported]
```

## 1. Content-Type

우선 `Content-Type`에 대해 알아보고, `Content-Type` 종류에 따른 데이터 수신 방식을 알아보겠습니다. 

> The Content-Type representation header is used to indicate the original media type of the resource 
> (prior to any content encoding applied for sending).

`Content-Type`은 HTTP 헤더에 담겨 송수신됩니다. 
메세지 바디(body)에 담긴 데이터가 어떤 타입인지 알려주는 역할로 사용됩니다. 
`Content-Type`이 없으면 수신받는 측에서 메세지를 단순한 텍스트로 판단합니다. 
보통 `Content-Type`의 값으로 `MIME(Multipurpose Internet Mail Extensions)` 타입을 사용합니다.

##### Content-Type 일반적인 구조
- `Content-Type`의 값인 `MIME` 타입은 `타입/서브타입` 형태의 데이터 구조를 가집니다.
- `Content-Type`의 기본값은 `text/plain` 입니다.

```
Content-Type: type/subtype
```

### 1.1. Content-Type 필요성

#### 1.1.1. GET 요청 방식

클라이언트가 서버로 `GET` 방식 HTTP 요청을 보낼 때 필요한 파라미터는 URL 뒤에 붙습니다. 
이 경우 서버는 클라이언트가 `Content-Type`을 굳이 보내지 않더라도 URL에 포함된 `key=value`를 추출하여 메세지를 알아낼 수 있습니다. 

##### GET 요청 메세지 전달 방식

```
http://localhost:8080?key1=value1&key2=value2
```

#### 1.1.2. POST / PUT 요청 방식

`POST`나 `PUT` 방식처럼 메세지 바디에 다양한 종류의 데이터를 담을 수 있는 요청은 `Content-Type`이 필요합니다. 
상황에 따라 `key=value`, `json`이나 `이진 값` 같은 데이터가 들어가기 때문입니다.

##### POST 요청 메세지 전달 방식

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

##### Content-Type 사용 시나리오

<p align="center">
    <img src="/images/content-type-and-spring-annotation-1.JPG" width="100%" class="image__border">
</p>

### 1.2. MIME, Multipurpose Internet Mail Extensions

MIME(Multipurpose Internet Mail Extensions)에 대해 알아보겠습니다. 

> Multipurpose Internet Mail Extensions - 다용도 인터넷 메일 확장자<br/>
> MIME(영어: Multipurpose Internet Mail Extensions)는 전자 우편을 위한 인터넷 표준 포맷이다. 
> 전자우편은 7비트 ASCII 문자를 사용하여 전송되기 때문에, 8비트 이상의 코드를 사용하는 문자나 이진 파일들은 MIME 포맷으로 변환되어 SMTP로 전송된다. 
> 실질적으로 SMTP로 전송되는 대부분의 전자 우편은 MIME 형식이다.

`Content-Type`과 `MIME` 타입은 전자 우편을 위해 정의되었지만, HTTP, SIP 같은 인터넷 프로토콜에서 전송 데이터를 표현하기 위해 사용되고 있습니다. 
위에서 설명했듯이 `MIME` 타입의 구조는 `타입/서브타입` 형태를 가집니다. 
간단히 어떤 종류가 있는지 알아보겠습니다. 

##### MIME 타입
- 아래 표에는 없지만, `application/json` 타입이 있습니다. 
- 이 외에도 멀티파트(multipart) 타입이 있습니다.
    - 하나의 메세지 바디에 서로 다른 타입들이 들어가는 경우 사용합니다.
    - multipart/form-data
    - multipart/byreranges

<p align="center">
    <img src="/images/content-type-and-spring-annotation-2.JPG" width="85%">
</p>
<center>https://developer.mozilla.org/ko/docs/Web/HTTP/Basics_of_HTTP/MIME_types</center>

### 1.3. MIME Type in Front End Service

프론트엔드 서비스를 개발하면서 자주 만나는 데이터 요청 방식들이 어떤 `MIME` 타입인지 정리해보겠습니다. 

#### 1.3.1. <form></form> 태그
`<form></form>` 태그로 POST 요청 시 기본적으로 `application/x-www-form-urlencoded` 타입이 사용됩니다. 
`application/x-www-form-urlencoded` 타입은 메세지가 `key=value` 형태로 전달됩니다.

##### <form></form> 태그 POST 요청
- `submit` 타입을 가지는 버튼을 폼(form) 내부에 만들어줍니다. 
- 버튼을 누르면 폼 내부에 데이터가 서버로 전달됩니다.

```html
<form action="http://localhost:8080/nothing" method="post">
    <input type="text" name="item" placeholder="item"/>
    <button type="submit">submit</button>
</form>
```

##### <form></form> 태그 POST 요청 결과

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

##### <form></form> 태그 Content-Type 변경
- 파일을 서버로 전송하는 경우 `multipart/form-data` 타입을 사용해야 합니다.
- `enctype` 속성을 통해 `multipart/form-data`으로 `MIME` 타입을 변경합니다.

```html
<form action="http://localhost:8080/file" method="post" enctype="multipart/form-data">
    <input type="file" name="file">
    <button type="submit">submit</button>
</form>
```

##### <form></form> 태그 Content-Type 변경 후 POST 요청 결과
- "Hello World" 문자열과 JPEG 이미지 파일을 전송하였습니다.

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

#### 1.3.2. fetch 함수 사용

브라우저에서 제공하는 `Web API`인 `fetch` 함수는 기본 `Content-Type`이 `text/plain`입니다. 

##### fetch 함수 POST 요청

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

##### fetch 함수 POST 요청 결과

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

#### 1.3.3. axios 모듈 사용

프론트엔드 서비스를 개발 시 많은 곳에서 사랑받는 `axios` 모듈은 기본적으로 `application/json` 타입이 사용됩니다. 

##### axios 모듈 POST 요청

```javascript
    axios.post(`http://localhost:8080${path}`, {item})
        .then(({data}) => console.log(data))
        .catch(error => console.log(error));
```

##### axios 모듈 POST 요청 결과

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

## 3. 각 Content-Type 별 처리 가능 애너테이션 in Spring Boot

### 3.1. RequestMappingHandlerAdapter 클래스

Spring 프레임워크 기반의 서비스는 처음 부팅되는 시점에 `Resolver` 클래스들이 `RequestMappingHandlerAdapter` 클래스에 의해 등록됩니다. 
(Spring 3.0.X 버전까진 `AnnotationMethodHandlerAdapter` 클래스가 사용된 것으로 확인됩니다.) 
이후 클라이언트(혹은 브라우저)로부터 요청을 받으면 다음과 같은 과정을 통해 메세지에 담긴 데이터를 엔드-포인트(end-point) 메소드의 파라미터로 변경합니다.
1. 해당 요청을 처리할 엔드 포인트 메소드를 찾습니다.
1. 해당 메소드의 파라미터 앞에 붙은 애너테이션을 지원하는 `Resolver` 클래스를 찾습니다.
1. 이후 `Resolver` 클래스의 `resolveArgument` 메소드를 통해 메세지에 담긴 데이터를 엔드-포인트 메소드의 파라미터로 변경합니다.

### 3.2. Content-Type 별 처리 가능 애너테이션 정리

자주 사용하는 `Content-Type`과 이를 처리하는 애너테이션을 정리하였습니다. 
간단한 테스트 코드를 통해 확인하였으며, 데이터를 받을 때 사용하는 DTO(Data Transfer Object)는 다음과 같습니다.

##### ContentTypeDto 클래스

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

#### 3.2.1. application/x-www-form-urlencoded 타입

`application/x-www-form-urlencoded` 타입은 `key=value` 형식으로 메세지를 전달합니다. 

##### No Annotation
- `ServletModelAttributeMethodProcessor` 클래스 `resolveArgument` 메소드에 의해 처리됩니다.
- 애너테이션이 없는 경우 `@ModelAttribute` 애너테이션과 동일합니다.
- 키(key)와 동일한 이름을 가지는 클래스 필드(field)에 값이 매칭됩니다.

```java
    @PostMapping("/nothing")
    public String nothing(ContentTypeDto contentTypeDto) {
        System.out.println(contentTypeDto);
        return "Data what server get via /nothing path: " + contentTypeDto;
    }
```

##### @ModelAttribute Annotation
- `ServletModelAttributeMethodProcessor` 클래스 `resolveArgument` 메소드에 의해 처리됩니다.
- 키(key)와 동일한 이름을 가지는 클래스 필드(field)에 값이 매칭됩니다.

```java
    @PostMapping("/model-attribute")
    public String modelAttribute(@ModelAttribute ContentTypeDto contentTypeDto) {
        System.out.println(contentTypeDto);
        return "Data what server get via /model-attribute path: " + contentTypeDto;
    }
```

##### @RequestParam Annotation
- `RequestParamMethodArgumentResolver` 클래스를 이용하지만, `resolveArgument` 메소드가 오버라이딩되어 있지 않습니다.
- 부모인 `AbstractNamedValueMethodArgumentResolver` 클래스의 `resolveArgument` 메소드에 의해 처리됩니다.
- `key=value` 형식이므로 `@RequestParam` 애너테이션을 통해 데이터를 받을 수 있습니다.

```java
    @PostMapping("/request-param")
    public String requestParam(@RequestParam("item") String item, @RequestParam(value = "file", required = false) MultipartFile multipartFile) {
        System.out.println(item);
        System.out.println(multipartFile);
        return "Data what server get via /request-param path: " + item + ", file: " + multipartFile;
    }
```

##### @RequestBody Annotaion and MultiValueMap class
- `RequestResponseBodyMethodProcessor` 클래스 `resolveArgument` 메소드에 의해 처리됩니다.
- `@RequestBody` 애너테이션은 주로 `application/json` 타입을 처리할 때 사용하지만, `MultiValueMap` 클래스와 함께 사용하면 `application/x-www-form-urlencoded` 타입 처리가 가능합니다.

```java
    @PostMapping("/request-body-with-multi-value-map")
    public String requestBody(@RequestBody MultiValueMap<String, Object> multiValueMap) {
        System.out.println(multiValueMap);
        return "Data what server get via /request-body-with-multi-value-map path: " + multiValueMap;
    }
```

#### 3.2.2. multipart/form-data 타입

파일 전달은 `multipart/form-data` 타입을 사용합니다. 
어떤 애너테이션을 통해 해결되는지 확인해보겠습니다.

##### No Annotation
- `ServletModelAttributeMethodProcessor` 클래스 `resolveArgument` 메소드에 의해 처리됩니다.
- 애너테이션이 없는 경우 `@ModelAttribute` 애너테이션과 동일합니다.
- 키(key)와 동일한 이름을 가지는 클래스 필드(field)에 값이 매칭됩니다.

```java
    @PostMapping("/nothing")
    public String nothing(ContentTypeDto contentTypeDto) {
        System.out.println(contentTypeDto);
        return "Data what server get via /nothing path: " + contentTypeDto;
    }
```

##### @ModelAttribute Annotation
- `ServletModelAttributeMethodProcessor` 클래스 `resolveArgument` 메소드에 의해 처리됩니다.
- 키(key)와 동일한 이름인 Dto 클래스의 필드(field)에 데이터가 매칭됩니다.

```java
    @PostMapping("/model-attribute")
    public String modelAttribute(@ModelAttribute ContentTypeDto contentTypeDto) {
        System.out.println(contentTypeDto);
        return "Data what server get via /model-attribute path: " + contentTypeDto;
    }
```

##### @RequestParam Annotation
- `RequestParamMethodArgumentResolver` 클래스를 이용하지만, `resolveArgument` 메소드가 오버라이딩되어 있지 않습니다.
- 부모인 `AbstractNamedValueMethodArgumentResolver` 클래스의 `resolveArgument` 메소드에 의해 처리됩니다.
- `key=value` 형식이므로 `@RequestParam` 애너테이션을 통해 데이터를 받을 수 있습니다.

```java
    @PostMapping("/request-param")
    public String requestParam(@RequestParam("item") String item, @RequestParam(value = "file", required = false) MultipartFile multipartFile) {
        System.out.println(item);
        System.out.println(multipartFile);
        return "Data what server get via /request-param path: " + item + ", file: " + multipartFile;
    }
```

#### 3.2.3. application/json 타입

REST API 요청 시 주로 사용하는 `application/json` 타입은 어떤 애너테이션을 통해 처리되는지 확인해보겠습니다. 

##### @RequestBody Annotaion
- `RequestResponseBodyMethodProcessor` 클래스 `resolveArgument` 메소드에 의해 처리됩니다.
- json 객체의 키와 동일한 이름인 Dto 클래스의 필드에 데이터가 매칭됩니다.
- `@RequestBody` 애너테이션과 `MultiValueMap` 클래스를 함께 사용하는 경우 `application/json` 타입 처리가 불가능합니다.

```java
    @PostMapping("/request-body")
    public String requestBody(@RequestBody ContentTypeDto contentTypeDto) {
        System.out.println(contentTypeDto);
        return "Data what server get via /request-body path: " + contentTypeDto;
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