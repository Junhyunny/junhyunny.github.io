---
title: "POST/PUT methods in REST API"
search: false
category:
  - information
last_modified_at: 2023-01-02T23:55:00
---

<br/>

## 0. 들어가면서

`REST` API는 HTTP 메소드(method)를 통해 동작 방식을 정한다. 

- GET - 조회
- POST - 생성
- PUT - 업데이트
- DELETE - 삭제

이전 면접 경험을 돌이켜보면 GET, POST 메소드의 차이점에 대한 질문을 많이 받았던 것 같다. URL 쿼리(query)에 데이터 노출로 인해 보안 문제가 발생할 수 있다는 등의 이야기를 했던 것 같다. 최근 POST, PUT 메소드 차이점에 대한 글을 접했는데, 많은 공부가 됐다. 이번 글은 RFC(Reuqest for Comments) 표준 문서의 PUT 메소드의 정의를 살펴보고, 데이터 생성 관점에서 POST 메소드와의 차이점을 정리했다. 

## 1. PUT Method

RFC 문서에는 다음과 같이 정의되어 있다.

> The PUT method requests that the enclosed entity be stored under the supplied Request-URI. If the Request-URI refers to an already existing resource, the enclosed entity SHOULD be considered as a modified version of the one residing on the origin server. 

PUT 메소드는 함께 전달한 엔티티(entity)를 요청 URI 아래 저장하길 기대한다. 다만, 요청 URI 하위에 리소스(resource) 존재 여부에 따라 다르게 동작한다.

- 요청 URI에 이미 리소스가 존재한다면 함께 전달한 엔티티로 기존의 리소스 데이터를 수정합니다.
    - 존재하는 리소스를 변경했다면 200(ok) 또는 204(not content) 코드를 응답합니다.
- 요청 URI에 리소스가 존재하지 않는다면 함께 전달한 엔티티는 신규 리소스 데이터로 새로 저장됩니다.
    - 신규 데이터가 생성되었다면 201(created) 코드를 응답합니다.
- 리소스를 생성하거나 수정할 수 없다면, 해당 문제를 반영하는 적절한 오류 응답을 제공해야 한다.

데이터를 수정한다는 인식이 강한 PUT 메소드는 리소스 존재 유무에 따라 데이터를 생성하거나 수정한다. PUT 요청은 URI에 식별자 정보가 포함된다. 해당 식별자에 매칭되는 리소스의 존재 유무에 따라 응답이 달라진다.

- 서버는 리소스가 없으면 신규로 생성하고 201 응답 코드를 반환한다.
- 서버는 리소스가 있으면 리소스를 변경하고 200 혹은 204 응답 코드를 반환한다.

```
PUT /forums/{id} HTTP/2.0
Host: yourwebsite.com
{
    title: "Hello World",
    contents: "some contents"
}
```

## 2. POST Method

데이터를 생성할 때 사용하는 POST 메소드를 살펴보자. POST 메소드는 함께 전달한 엔티티를 요청 URI 하위에 저장할 신규 리소스로 식별한다. POST 메소드는 반드시 URI로 식별될 수 있는 리소스를 생성하는 것은 아니다. 이런 경우 200 (OK) 또는 204 (No Content) 응답 상태 코드가 적절하며, 응답에 요청의 결과를 설명하는 엔터티가 포함되었는지 여부에 따라 선택하면 된다.

서버에 리소스가 생성되었다면 응답은 201 (Created) 상태 코드를 반환하고 요청의 상태를 설명하는 엔티티와 새 리소스를 참조하는 Location 헤더를 포함하는 것이 좋다.

```
POST /forums HTTP/2.0
Host: yourwebsite.com
{
    title: "Hello World",
    contents: "some contents"
}

201 created
Location: /forums/1
{
    id: 1,
    title: "Hello World",
    contents: "some contents"
}
```

## 3. Differences between POST and PUT

POST 메소드와 PUT 메소드의 근본적인 차이는 요청 URI에 있다. 

- POST 요청에서 URI는 요청에 포함된 엔티티를 `처리할 리소스`를 의미한다.
- PUT 요청에서 URI는 요청에 `포함된 엔티티`를 의미한다.

PUT 요청의 URI는 요청에 포함된 엔티티를 지정하는 것이기 때문에 사용자 에이전트(user agent, e.g. 브라우저)는 의도된 URI를 알고 있어야 한다. 서버는 이를 다른 리소스에 적용하려 시도해서는 안된다. 이는 멱등성(idempotence)의 차이를 만든다.

> Idempotence (UK: /ˌɪdɛmˈpoʊtəns/,[1] US: /ˈaɪdəm-/)[2] is the property of certain operations in mathematics and computer science whereby they can be applied multiple times without changing the result beyond the initial application.

멱등성은 연산을 여러 번 적용하더라도 결과가 달라지지 않는 성질을 의미한다. 

- POST 메소드는 멱등성을 지키지 못 한다.
    - 매 요청 시마다 신규 리소스가 생성된다.
    - 리소스의 다른 프로퍼티(property) 값들은 동일하더라도 리소스 식별자(identifier)가 매 요청마다 변경된다.
- PUT 메소드는 멱등성을 지킨다.
    - 리소스 유무에 따라 신규 리소스를 만들긴 하지만, 모든 요청은 항상 같은 리소스를 참조한다. 
    - 리소스의 다른 프로퍼티 값이 변경될 수 있지만, 리소스를 식별자는 매 요청마다 변경되지 않는다.

#### REFERENCE

- <https://www.youtube.com/watch?v=RP_f5dMoHFc>
- <https://www.rfc-editor.org/rfc/rfc2616#section-9.6>
- <https://www.rfc-editor.org/rfc/rfc2616#section-9.5>
- <https://restfulapi.net/rest-put-vs-post/>
- <https://www.keycdn.com/support/put-vs-post>
- <https://en.wikipedia.org/wiki/Idempotence>