---
title: "PUT and POST in REST API"
search: false
category:
  - information
last_modified_at: 2023-01-02T23:55:00
---

<br/>

## 0. 들어가면서

`REST API`에서는 HTTP 메소드(method)를 통해 동작 방식을 일차적으로 정하게 됩니다. 

* GET - 조회
* POST - 생성
* PUT - 업데이트
* DELETE - 삭제

제 기억에는 GET, POST 차이점에 대한 이야기를 많이 했던 것 같습니다. 
당시엔 `RESTful` 관점에서 생각하지 못하고 URL 쿼리(query)에 데이터 노출 여부에 따른 보안 문제에 대한 이야기만 했던 것 같습니다. 
조회마저 POST 메소드를 사용하는 시스템들은 많이 봤지만, PUT, DELETE 메소드를 잘 사용하는 시스템은 많이 보지 못 했습니다. 

PUT 메소드는 데이터 변경을 위한 용도로 사용한다는 정도만 알고 있었는데, 공부해보니 생각보다 단순하진 않았습니다. 
RFC(Reuqest for Comments) 표준 문서의 PUT 메소드의 정의를 살펴보고, 데이터 생성 관점에서 POST 메소드와의 차이점을 정리하였습니다. 

## 1. PUT Method

PUT 메소드는 함께 전달한 엔티티(entity)를 요청 URI 아래 저장하도록 요청합니다. 
요청 URI 하위에 리소스(resource) 존재 여부에 따라 다르게 동작합니다. 

* 요청 URI에 이미 리소스가 존재한다면 함께 전달한 엔티티로 기존의 리소스 데이터를 수정합니다.
    * 존재하는 리소스를 변경했다면 200(ok) 또는 204(not content) 코드를 응답합니다.
* 요청 URI에 리소스가 존재하지 않는다면 함께 전달한 엔티티는 신규 리소스 데이터로 새로 저장됩니다.
    * 신규 데이터가 생성되었다면 201(created) 코드를 응답합니다.

간단히 말해서 데이터를 수정하는 용도로만 사용한다고 알려진 PUT 메소드는 리소스 존재 유무에 따라 데이터를 생성하거나 수정합니다. 
동작 결과에 따라 코드를 구분하여 응답합니다. 

##### Request for PUT Method

다음과 같은 방식으로 요청과 응답이 일어납니다.

* 요청 URI에 `id` 같은 식별자 정보가 포함됩니다.
* 해당 식별자에 매칭되는 리소스의 존재 유무는 중요하지 않습니다.
    * 서버는 리소스가 없으면 신규로 생성하고 201 응답 코드를 반환합니다.
    * 서버는 리소스가 있으면 리소스를 변경하고 200 혹은 204 응답 코드를 반환합니다.

```
PUT /forums/{id} HTTP/2.0
Host: yourwebsite.com
{
    title: "Hello World",
    contents: "some contents"
}
```

## 2. POST Method

데이터를 생성할 때 사용하는 POST 메소드를 살펴보겠습니다. 
POST 메소드는 함께 전달한 엔티티를 요청 URI 하위에 저장할 신규 리소스로 식별합니다. 
POST 요청 수행 결과에 따라 다음과 같은 응답 코드를 반환합니다.

* URI로 식별할 수 있는 리소스가 생성되지 않은 경우
    * 응답에 엔티티가 포함되는지 여부에 따라 200(ok) 또는 204(no content) 코드를 반환합니다.
* URI로 식별할 수 있는 리소스가 생성된 경우
    * 응답 코드로 201(created)를 반환합니다.
    * 응답에 새로운 리소스를 참조하는 엔티티를 함께 반환합니다.
    * 응답에 위치 헤더 정보를 함께 반환합니다.

다시 정리하면 데이터를 신규 생성하는 POST 메소드 요청 같은 경우에는 리소스 생성이 되지 않더라도 200 혹은 204 코드를 반환합니다. 
리소스가 생성되는 경우 201 코드와 함께 새로 생긴 리소스 정보, 새로 생긴 리소스의 URI 정보를 함께 응답합니다.

##### Request for POST Method

다음과 같은 방식으로 요청과 응답이 일어납니다.

* 요청 URI에 `id` 같은 식별자 정보가 포함되지 않습니다.
* 정상적으로 리소스가 생성되면 다음과 같은 응답을 받습니다.
    * 서버는 리소스를 신규로 생성하고 201 응답 코드를 반환합니다.
    * 새로운 리소스를 참조할 수 있는 `Location` 정보를 반환합니다.
    * 신규 리소스 엔티티 정보를 결과로 반환합니다.

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

## 3. Idempotence

멱등성(idempotence)이라는 개념으로 POST, PUT 메소드의 차이점을 보충할 수 있습니다. 

> Wikipedia<br/>
> Idempotence (UK: /ˌɪdɛmˈpoʊtəns/,[1] US: /ˈaɪdəm-/)[2] is the property of certain operations in mathematics and computer science whereby they can be applied multiple times without changing the result beyond the initial application.

연산을 여러 번 적용하더라도 결과가 달라지지 않는 성질입니다. 
멱등성과 POST, PUT 메소드의 관계는 다음과 같습니다.

* POST 메소드는 멱등성을 지키지 못 합니다.
    * 매 요청 시마다 신규 리소스가 생성됩니다.
    * 리소스의 다른 프로퍼티(property) 값들은 동일하더라도 리소스 식별자(identifier)가 매 요청마다 변경됩니다.
* PUT 메소드는 멱등성을 지킵니다.
    * 리소스 유무에 따라 신규 리소스를 만들긴 하지만, 모든 요청은 항상 같은 리소스를 참조합니다. 
    * 리소스의 다른 프로퍼티 값이 변경될 수 있지만, 리소스를 식별자는 매 요청마다 변경되지 않습니다.

## CLOSING

서버를 구현할 때 이런 표준을 따라야 클라이언트는 서버를 믿고 요청과 응답 기능을 개발합니다. 
GET 메소드는 리소스를 변경하지 않는 항상 안전해야만 하는 요청인데, 뜬금없이 자원이 변경된다면 클라이언트는 서버를 신뢰할 수 없습니다. 
POST, PUT 메소드의 차이점을 정리해 본 이유도 표준에 따른 개발을 지향하기 위함입니다. 

#### REFERENCE

* <https://www.youtube.com/watch?v=RP_f5dMoHFc>
* <https://www.rfc-editor.org/rfc/rfc2616#section-9.6>
* <https://www.rfc-editor.org/rfc/rfc2616#section-9.5>
* <https://restfulapi.net/rest-put-vs-post/>
* <https://www.keycdn.com/support/put-vs-post>
* <https://en.wikipedia.org/wiki/Idempotence>