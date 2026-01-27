---
title: "OpenAPI 명세서를 사용한 Orval 클라이언트 코드 자동 생성하기"
search: false
category:
  - openapi
  - orval
  - auto-generate-code
  - react-query
  - msw
last_modified_at: 2026-01-27T10:55:00
---

<br/>

## 0. 들어가면서

최근 참여한 프로젝트는 [OpenAPI](https://www.openapis.org/) 사양을 Rest API의 단일 진실 공급원(single source of truth)으로 사용하려는 노력이 엿보인다. 

- OpenAPI 사양을 기준으로 Orval을 통해 프론트엔드 클라이언트 코드 생성
- OpenAPI 사양을 기준으로 테라폼(terraform)을 통해 AWS API Gateway 엔드포인트 생성

이번 글은 OpenAPI 사양을 기준으로 Orval을 통해 프론트엔드 클라이언트 코드 생성하는 방법에 대해 정리했다.

## 1. OpenAPI specification

OpenAPI 사양(OpenAPI specification, OAS)은 HTTP API를 정의하기 위한 표준화된 사양(specification language)이다. 주로 YAML이나 JSON 형식으로 작성되며, API의 수명 주기(Lifecycle) 전반에 걸쳐 정보를 일관되게 전달하는 역할을 한다. 주로 다음과 같은 특징을 갖는다.

- 언어 독립성 (Language Agnostic): OAS는 특정 프로그래밍 언어에 종속되지 않는다. 따라서 API 소비자는 서비스가 어떤 언어(Lisp, Haskell 등)로 구현되었는지 알 필요 없이, OAS 문서만으로 API의 기능과 사용법을 명확하게 이해할 수 있다.
- 표준화된 소통: API 제공자와 소비자(동료, 파트너사 등) 간의 지식 전달을 명확하고 효율적으로 만든다. 이는 API 경제에서 비즈니스를 수행하는 데 필수적이다.
- 단일 진실 공급원 (Single Version of the Truth): 설계 단계에서 생성된 OAS 문서는 개발, 테스트, 배포 등 이후 모든 단계에서 기준이 되어 관리 비용을 줄이고 일관성을 보장한다.

API 개발 라이프사이클(lifecycle)에서 다음과 같이 활용한다.

1. 요구사항 및 설계 (Requirements & Design): 요구사항을 기술적으로 구체화하고 이해관계자와 빠르게 공유하는 데 사용된다. 설계 과정에서 버전 관리가 가능한 구체적인 산출물을 제공하여 개발 단계의 명확한 입력값이 된다.
2. 개발 (Development): 'API 우선(API-first)' 접근 방식에서 OAS 문서를 먼저 작성한 뒤, 이를 통해 **클라이언트, 서버 코드를 자동으로 생성하여 구현과 설계의 일치성을 높인다.**
3. 인프라 구성 (Infrastructure Configuration): API 게이트웨이나 보안 시스템 설정 시 OAS를 입력값으로 사용하여 경로 유효성 검사, 파라미터 검증 등을 버튼 클릭 한 번으로 자동화할 수 있다.
4. 개발자 경험 제공 (Developer Experience): API 문서를 자동으로 생성하거나, 사용자가 API를 직접 테스트해 볼 수 있는 대화형 환경('Try it out') 및 다양한 언어의 클라이언트 SDK를 제공하는 데 활용된다.
5. 테스트 (Testing): 설계(OAS)와 실제 구현이 일치하는지 확인하는 계약 테스트(contract tests)나, 보안 취약점을 점검하는 보안 도구의 기준으로 사용되어 품질을 보증한다. 요약하자면, OpenAPI는 단순한 문서화 도구를 넘어 API의 설계, 구현, 운영, 테스트를 아우르는 전체 과정을 효율적으로 연결하고 자동화하는 핵심 표준이다.

OpenAPI는 API의 '공용 설계도'를 잘 만들기 위한 규칙이라 생각하면 된다. 규칙을 따라 API 설계도를 잘 만들어두면 문서도 생기고, 코드도 생기고, 테스트도 쉬워진다. 

## 2. Orval

Orval은 Restful 클라이언트 코드 생성 라이브러리다. Orval을 사용하면 OpenAPI v3 혹은 Swagger v2 사양을 기반으로 타입-안전한 자바스크립트 클라이언트 코드를 생성한다. 주로 다음과 같은 작업을 수행한다.

- 타입스크립트 모델을 만든다.
- HTTP 요청 함수를 만든다.
- [MSW(mock service worker)][mock-service-worker-link]를 사용해 목(mock)을 만든다.

기본적으로 axios를 사용해서 클라이언트 코드를 생성한다. 주로 앵귤라(angular), 리액트(react), 뷰(vue)를 지원한다. 다음 명령어를 통해 설치할 수 있다.

```
$ npm i orval -D
```

명령어와 옵션을 통해 사용할 수 있지만, 다양한 옵션이 필요한 경우 명령어가 복잡해질 수 있으므로 설정 파일을 사용하는 편이 낫다. orval.config.js 파일을 만들고 다음과 같은 설정을 추가한다.

- OpenAPI 사양 yaml 파일을 입력으로 지정한다.
- 출력 결과는 목, 구현, 스키마 코드를 분리(split)하는 방식을 지정한다.
- 자동 생성된 코드는 src/apis 경로에 저장한다.
- 자동 생성된 스키마는 src/model 경로에 저장한다.
- 클라이언트는 리액트 쿼리(react-query)를 사용한다.
- HTTP 클라이언트는 [v8부터 기본적으로 fetch API를 사용](https://orval.dev/docs#supported-clients)한다. axios 같은 다른 HTTP 클라이언트도 지원한다.
- MSW 핸들러 함수 생성을 활성화한다.

```js
import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "../api/openapi-specification.yaml",
    output: {
      mode: "split",
      target: "src/apis",
      schemas: "src/model",
      client: "react-query",
      httpClient: "axios",
      mock: true,
    },
  },
});
```

## 3. Generate codes

설정이 완료되었으면 Orval을 통해 코드를 생성해보자. 해당 예제에서 사용한 OpenAPI 명세서는 다음과 같다. YAML 파일에 OpenAPI 버전, API 설명, 요청 정보, 응답 정보, 필요한 스키마 같은 정보들이 명세되어 있다. 설명이 없더라도 읽고 이해하기 어렵지 않다.

```yaml
openapi: 3.1.0
info:
  title: Todo API
  description: 할 일 목록을 관리하기 위한 간단한 연습용 API입니다.
  version: 1.0.0

servers:
  - url: https://api.example.com/v1
    description: 메인 프로덕션 서버

paths:
  /todos:
    get:
      summary: 모든 할 일 목록 조회
      responses:
        '200':
          description: 성공적인 조회
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Todo'
    post:
      summary: 새로운 할 일 추가
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TodoCreate'
      responses:
        '201':
          description: 생성 성공
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Todo'

  /todos/{id}:
    parameters:
      - name: id
        in: path
        required: true
        description: 할 일의 고유 식별자 (ID)
        schema:
          type: integer
    get:
      summary: 특정 할 일 상세 조회
      responses:
        '200':
          description: 상세 정보 반환
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Todo'
        '404':
          description: 해당 ID를 찾을 수 없음
    put:
      summary: 기존 할 일 수정
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TodoCreate'
      responses:
        '200':
          description: 수정 완료
    delete:
      summary: 할 일 삭제
      responses:
        '204':
          description: 삭제 성공 (반환 데이터 없음)

components:
  schemas:
    Todo:
      type: object
      properties:
        id:
          type: integer
          example: 1
        title:
          type: string
          example: "OpenAPI 공부하기"
        completed:
          type: boolean
          example: false
        createdAt:
          type: string
          format: date-time
    TodoCreate:
      type: object
      required:
        - title
      properties:
        title:
          type: string
          example: "우유 사러 가기"
        completed:
          type: boolean
          default: false
```

package.json 파일에 다음과 같은 스크립트를 추가한다. 위에서 생성한 설정 파일을 기준으로 코드를 생성한다.

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    ...
    "generate": "orval --config ./orval.config.js",
    ...
  },
  ...
}
```

터미널에서 아래 명령어를 실행하면 코드가 자동 생성된다.

```
$ npm run generate

> frontend@0.0.0 generate
> orval --config ./orval.config.js

🍻 orval v8.0.3 - A swagger client generator for typescript
🎉 api - Your OpenAPI spec has been converted into ready to use orval!
```

설정 파일에 지정된 경로에 API, 목 API, 스키마 코드 파일이 분리되어 저장된다.

<div align="left">
  <img src="/images/posts/2026/open-api-spec-with-orval-01.png" width="50%" class="image__border">
</div>

#### TEST CODE REPOSTORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-01-27-open-api-spec-with-orval>

#### REFERENCE

- <https://www.openapis.org/>
- <https://www.openapis.org/what-is-openapi>
- <https://learn.openapis.org/specification/tags.html>
- <https://orval.dev/>
- <https://orval.dev/docs/quick-start>
- <https://orval.dev/docs#supported-clients>
- <https://orval.dev/docs/reference/configuration/output#mode>

[mock-service-worker-link]: https://junhyunny.github.io/information/react/test-driven-development/mock-service-worker/