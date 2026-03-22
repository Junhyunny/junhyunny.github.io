---
title: "OpenAPI 명세서 기반 AWS API 게이트웨이(gateway)와 람다(lambda) 배포"
search: false
category:
  - infra
  - aws
  - openapi
  - api-gateway
  - terraform
last_modified_at: 2026-03-11T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [AWS SAM(Serverless Application Model) 개념과 CLI 예제][aws-sam-cli-link]
- [OpenAPI 명세서를 사용한 Orval 클라이언트 코드 자동 생성하기][open-api-spec-with-orval-link]

## 0. 들어가면서

[이전 글][open-api-spec-with-orval-link]에서 이야기한 것처럼 최근 합류한 팀은 OpenAPI 명세서를 단일 진실 공급원(single source of truth)으로 사용하고 있다. 클라이언트 애플리케이션과 인프라를 배포할 때 OpenAPI 명세 YAML 파일을 적극 활용하고 있다. 이번 글은 OpenAPI 명세서를 사용해서 AWS API 게이트웨이(gateway)와 람다(lambda) 함수를 배포하는 방법에 대해 정리했다.

## 1. OpenAPI specification

[이전][open-api-spec-with-orval-link]에 동일한 내용을 정리했지만, 다시 한번 정리한다. OpenAPI 사양(OpenAPI Specification, OAS)은 HTTP API를 정의하기 위한 표준화된 명세 언어(specification language)다. 주로 YAML이나 JSON 형식으로 작성되며, API의 수명 주기(Lifecycle) 전반에 걸쳐 정보를 일관되게 전달하는 역할을 한다. 주로 다음과 같은 특징을 갖는다.

- 언어 독립성 (Language Agnostic): OAS는 특정 프로그래밍 언어에 종속되지 않는다. 따라서 API 소비자는 서비스가 어떤 언어(Lisp, Haskell 등)로 구현되었는지 알 필요 없이, OAS 문서만으로 API의 기능과 사용법을 명확하게 이해할 수 있다.
- 표준화된 소통: API 제공자와 소비자(동료, 파트너사 등) 간의 지식 전달을 명확하고 효율적으로 만든다. 이는 API 경제에서 비즈니스를 수행하는 데 필수적이다.
- 단일 진실 공급원 (Single Version of the Truth): 설계 단계에서 생성된 OAS 문서는 개발, 테스트, 배포 등 이후 모든 단계에서 기준이 되어 관리 비용을 줄이고 일관성을 보장한다.

API 개발 라이프사이클(lifecycle)에서 다음과 같이 활용한다.

1. 요구사항 및 설계 (Requirements & Design): 요구사항을 기술적으로 구체화하고 이해관계자와 빠르게 공유하는 데 사용된다. 설계 과정에서 버전 관리가 가능한 구체적인 산출물을 제공하여 개발 단계의 명확한 입력값이 된다.
2. 개발 (Development): 'API 우선(API-first)' 접근 방식에서 OAS 문서를 먼저 작성한 뒤, 이를 통해 **클라이언트, 서버 코드를 자동으로 생성하여 구현과 설계의 일치성을 높인다.**
3. 인프라 구성 (Infrastructure Configuration): API 게이트웨이나 보안 시스템 설정 시 OAS를 입력값으로 사용하여 경로 유효성 검사, 파라미터 검증 등을 버튼 클릭 한 번으로 자동화할 수 있다.
4. 개발자 경험 제공 (Developer Experience): API 문서를 자동으로 생성하거나, 사용자가 API를 직접 테스트해 볼 수 있는 대화형 환경('Try it out') 및 다양한 언어의 클라이언트 SDK를 제공하는 데 활용된다.
5. 테스트 (Testing): 설계(OAS)와 실제 구현이 일치하는지 확인하는 계약 테스트(contract tests)나, 보안 취약점을 점검하는 보안 도구의 기준으로 사용되어 품질을 보증한다.

요약하자면, OpenAPI는 단순한 문서화 도구를 넘어 API의 설계, 구현, 운영, 테스트를 아우르는 전체 과정을 효율적으로 연결하고 자동화하는 핵심 표준이다. OpenAPI는 API의 '공용 설계도'를 잘 만들기 위한 규칙이라 생각하면 된다. 규칙을 따라 API 설계도를 잘 만들어두면 문서도 생기고, 코드도 생기고, 테스트도 쉬워진다. 

## 2. Example

이제 본격적으로 예제 코드를 살펴보자. 전체 코드는 [이 레포지토리](https://github.com/Junhyunny/blog-in-action/tree/master/2026-03-11-deploy-aws-api-gateway-with-openapi-spec)에서 확인할 수 있다. 이 예제에선 테라폼(terraform)을 사용해 필요한 리소스들을 배포한다. [AWS API 게이트웨이는 OpenAPI 명세서를 사용해 REST API 개발하는 것을 지원](https://docs.aws.amazon.com/ko_kr/apigateway/latest/developerguide/http-api-open-api.html)한다. `x-amazon-apigateway-integration` 객체를 사용하면 HTTP 엔드포인트를 특정 람다 함수로 연결하는 것이 가능하다. 

다음과 같은 예제 명세서를 작성한다. 전체 코드가 아니라 일부분만 살펴본다. 아래 코드는 GET 요청의 `/todos` 엔드포인트를 위해 `x-amazon-apigateway-integration` 객체를 생성한 예제다.

- **type**
  - AWS 람다 함수와 통합 시 타입은 항상 `aws_proxy`다.
- **httpMethod**
  - 통합 요청에서 사용된 HTTP 메서드다. 
  - 람다 함수 호출의 경우 값은 `POST`여야 한다.
- **uri**
  - 백엔드의 엔드포인트 URI이다. 
  - aws 유형 통합의 경우 ARN(Amazon Resource Name)이 사용된다.
  - 이번 예제에선 AWS 람다의 ARN을 사용한다.
  - `${invoke_arn_get_todos}` 변수는 테라폼에서 리소스를 생성할 때 외부에서 주입된다.
- **passthroughBehavior**
  - 매핑되지 않은 콘텐츠 형식의 요청 페이로드를 수정 없이 통합 요청을 통해 전달하는 방식을 지정한다. 
  - 지원되는 값은 `when_no_templates`, `when_no_match` 및 `never`가 있다.

```yaml
openapi: 3.0.1
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
      # /todos 엔드포인트를 람다 함수로 연결하는 객체
      x-amazon-apigateway-integration:
        type: aws_proxy
        httpMethod: POST
        uri: "${invoke_arn_get_todos}"
        passthroughBehavior: when_no_match
      responses:
        '200':
          description: 성공적인 조회
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Todo'
...
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
...
```

[OpenAPI v2.0](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md) 및 [OpenAPI v3.0](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.1.md) 정의 파일을 지원한다. OpenAPI v3.1.0 명세서에 객체를 선언하는 경우 인텔리제이에서 `Schema validation: Property is not allowed`라는 경고문을 보여준다. 실제로 테라폼을 통해 배포(apply)하면 에러가 발생한다. 이 예제에서는 `v3.0.1` 명세서를 사용한다. 

```
│ Error: creating API Gateway REST API (ix03opvzzj) specification: operation error API Gateway: PutRestApi, https response error StatusCode: 400, RequestID: 05072fdf-776f-4a29-afe0-c5189a42bebc, BadRequestException: Invalid OpenAPI input.
```

각 엔드포인트마다 x-amazon-apigateway-integration 객체를 만들었다면, 이제 본격적으로 테라폼 코드를 살펴보자. 테라폼은 환경 별로 코드를 재사용하기 위해 모듈(module)을 사용한다. 다음과 같은 디렉토리 구조를 갖는다. 

```
.
├── env
│   ├── main.tf
│   ├── provider.tf
│   └── variables.tf
└── modules
    ├── apigw
    │   ├── main.tf
    │   └── variables.tf
    ├── dynamodb
    │   ├── main.tf
    │   ├── outputs.tf
    │   └── variables.tf
    ├── iam
    │   ├── main.tf
    │   ├── outputs.tf
    │   ├── policy
    │   │   └── dynamodb_policy.json
    │   └── variables.tf
    └── lambda
        ├── main.tf
        ├── outputs.tf
        └── variables.tf
```

필요한 모듈이 선언된 env/main.tf 파일을 먼저 살펴보자. 이번 예제를 위해서 다음과 같은 모듈들이 필요하다. 각 모듈들은 의존 관계가 있기 때문에 만들어지는 순서가 필요하다. 모듈 간 의존 관계는 `depends_on` 속성을 통해 연결한다. 각 모듈의 배포 결과물(output)은 다음 모듈의 변수(variables)로 들어간다.

- dynamodb 모듈 - 데이터베이스
- iam 모듈 - 롤(role)과 정책(policy) 관리
- lambda 모듈 - 특정 엔드포인트에 대한 처리를 위한 람다 핸들러(handler)
- api_gw 모듈 - 엔드포인트 경로에 따라 트래픽을 람다 핸들러로 전달하는 AWS API 게이트웨이

```tf
module "dynamodb" {
  source      = "../modules/dynamodb"
  environment = var.environment
}

module "iam" {
  source             = "../modules/iam"
  environment        = var.environment
  dynamodb_table_arn = module.dynamodb.table_arn
  depends_on         = [module.dynamodb]
}

module "lambda" {
  source           = "../modules/lambda"
  environment      = var.environment
  region           = var.region
  lambda_functions = var.lambda_functions
  lambda_roles     = module.iam.lambda_role
  depends_on       = [module.iam]
}

module "api_gw" {
  source             = "../modules/apigw"
  environment        = var.environment
  lambda_invoke_arns = module.lambda.invoke_arns
  depends_on         = [module.lambda]
}
```

dynamodb, iam 모듈에 대한 내용은 이번 글의 주제에서 벗어나기 때문에 lambda, api_gw 모듈을 중점적으로 살펴본다. lambda 모듈의 코드를 살펴보기 전에 람다 프로젝트의 디렉토리 구조를 먼저 살펴보자. 

- 코드는 main/{handler-name}/app.ts 경로에 위치한다.
- 빌드 결과는 .aws-sam/build/{handler-name}/app.js 경로에 위치한다. 코드는 SAM CLI를 통해 빌드한다. SAM CLI를 통해 빌드하는 방법은 [이 글][aws-sam-cli-link]을 참고하길 바란다.

```
.
├── .aws-sam
│   ├── build
│   │   ├── DeleteTodoFunction
│   │   │   ├── app.js
│   │   │   └── app.js.map
│   │   ├── GetTodoByIdFunction
│   │   │   ├── app.js
│   │   │   └── app.js.map
│   │   ├── GetTodosFunction
│   │   │   ├── app.js
│   │   │   └── app.js.map
│   │   ├── PostTodoFunction
│   │   │   ├── app.js
│   │   │   └── app.js.map
│   │   ├── PutTodoFunction
│   │   │   ├── app.js
│   │   │   └── app.js.map
│   │   └── template.yaml
├── .gitignore
├── .npmignore
├── biome.json
├── jest.config.ts
├── main
│   ├── common
│   │   └── dynamodb-client.ts
│   ├── delete-todo
│   │   └── app.ts
│   ├── get-todo-by-id
│   │   └── app.ts
│   ├── get-todos
│   │   └── app.ts
│   ├── post-todo
│   │   └── app.ts
│   └── put-todo
│       └── app.ts
├── package-lock.json
├── package.json
├── samconfig.toml
├── template.yaml
└── tsconfig.json
```

위 람다 함수의 결과물을 zip 파일로 만들고, 해당 zip 파일을 기준으로 람다 함수들을 생성한다. 

- locals 블록 
  - 외부에서 전달 받은 변수로 로컬 변수 lambda_function_keys 를 만든다. 
  - for_each 구문을 통해 여러 개의 람다 함수를 반복문을 통해 배포하기 위함이다. 
  - 위에서 살펴본 람다 함수의 빌드 디렉토리 이름 리스트가 외부 변수로 주입된다.
- data archive_file.lambda 블록 
  - 람다 함수의 빌드 결과물을 갖고 zip 파일을 생성한다.
- resource aws_lambda_function.functions 블록 
  - 람다 함수에 필요한 리소스를 정의한다. 
  - 타임아웃 시간, 메모리 사이즈, 롤, 환경변수, 동시 실행 한도 등을 설정한다.

```tf
locals {
  lambda_function_keys = { for fname in var.lambda_functions : fname => fname }
}

data "archive_file" "lambda" {
  for_each    = local.lambda_function_keys
  type        = "zip"
  source_file = "${path.module}/../../../lambda/.aws-sam/build/${each.key}/app.js"
  output_path = "${path.module}/dist/${each.key}.zip"
}

resource "aws_lambda_function" "functions" {
  for_each = local.lambda_function_keys

  function_name                  = "${var.environment}-${each.key}"
  runtime                        = "nodejs22.x"
  handler                        = "app.lambdaHandler"
  timeout                        = 60
  memory_size                    = 256
  role                           = lookup(var.lambda_roles, each.key, "")
  filename                       = data.archive_file.lambda[each.key].output_path
  source_code_hash               = data.archive_file.lambda[each.key].output_base64sha256
  reserved_concurrent_executions = 10

  environment {
    variables = {
      REGION     = var.region
      TABLE_NAME = "${var.environment}-todos-table"
    }
  }
}
```

위에서 생성한 람다 함수를 API 게이트웨이에서 사용할 수 있도록 다음과 같은 outputs.tf 파일을 정의한다.

```tf
output "invoke_arns" {
  description = "Lambda 함수별 invoke ARN 맵 (key: 함수명, value: invoke_arn)"
  value = {
    for k, fn in aws_lambda_function.functions : k => fn.invoke_arn
  }
}
```

람다 모듈에 관련된 주요 코드를 봤으니, 다음으로 API 게이트웨이 모듈 코드를 살펴본다. 필요한 리소스가 많으므로 코드를 작게 나눠서 살펴본다. 지금부터 살펴볼 코드는 모두 modules/apigw/main.tf 파일에 정의된 내용이다.

프로젝트에서 관리 중인 OpenAPI 명세 YAML 파일을 읽어 사용한다. 필요한 ARN 값들을 주입하기 위해 templatefile 함수를 사용한다. 명세 YAML 파일 내용은 openapi_spec 로컬 변수에 저장한다.

```tf
locals {
  openapi_spec_path = "${path.module}/../../../api/openapi-specification.yaml"

  openapi_spec = templatefile(local.openapi_spec_path, {
    invoke_arn_get_todos   = lookup(var.lambda_invoke_arns, "GetTodosFunction", "")
    invoke_arn_post_todo   = lookup(var.lambda_invoke_arns, "PostTodoFunction", "")
    invoke_arn_get_by_id   = lookup(var.lambda_invoke_arns, "GetTodoByIdFunction", "")
    invoke_arn_put_todo    = lookup(var.lambda_invoke_arns, "PutTodoFunction", "")
    invoke_arn_delete_todo = lookup(var.lambda_invoke_arns, "DeleteTodoFunction", "")
  })
}
```

AWS API 게이트웨이 REST API 리소스를 정의한다. 위에서 읽은 YAML 명세서 내용을 body 프로퍼티에 설정한다.

```tf
resource "aws_api_gateway_rest_api" "this" {
  name        = "${var.environment}-todo-api"
  description = "Todo API backed by Lambda"

  body = local.openapi_spec

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}
```

API 게이트웨이에서 람다 핸들러를 호출할 수 있도록 접근 허가 권한을 설정한다. source_arn 프로퍼티를 통해 호출 권한 범위를 지정한다. 아래 예제는 모든 범위에 대한 접근 여부를 허용한 상태다. `*/*`는 모든 스테이지(stage)에서 모든 메소드, 모든 경로에 대해 허용한다는 의미다. 

```tf
resource "aws_lambda_permission" "api_gateway" {
  for_each      = var.lambda_invoke_arns
  statement_id  = "AllowAPIGatewayInvoke${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = "${var.environment}-${each.key}"
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}
```

aws_api_gateway_deployment 리소스는 REST API를 특정 스테이지에 배포하기 위해 사용한다. rest_api_id 프로퍼티에 배포 대상인 API 게이트웨이 리소스의 ID를 지정한다. 

triggers 프로퍼티를 통해 재배포 조건을 명시한다. aws_api_gateway_rest_api 리소스의 body 프로퍼티 내용이 변경되면 게이트웨이를 재배포 하도록 정의한다. 즉, OpenAPI 명세 내용이 변경되면 게이트웨이를 재배포한다.

```tf
resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  triggers = {
    redeployment = sha1(aws_api_gateway_rest_api.this.body)
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

aws_api_gateway_stage 리소스는 위에서 정의한 aws_api_gateway_deployment 리소스를 통해 배포하기 위한 스테이지 정보를 정의한다. 

- rest_api_id 프로퍼티를 통해 위에서 정의한 REST API 게이트웨이 리소스를 매핑한다. 
- deployment_id 프로퍼티를 통해 위에서 정의한 게이트웨이 디플로이(deploy) 리소스를 매핑한다. 
- 스테이지 이름을 지정하고 cloudwatch 로그 그룹 리소스를 연결한다.

```tf
resource "aws_api_gateway_stage" "this" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  deployment_id = aws_api_gateway_deployment.this.id
  stage_name    = var.environment

  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.apigw.arn

    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      protocol                = "$context.protocol"
      httpMethod              = "$context.httpMethod"
      resourcePath            = "$context.resourcePath"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
    })
  }
}
```

마지막으로 스테이지에서 사용할 cloudwatch 로그 그룹 리소스를 생성한다.

```tf
resource "aws_cloudwatch_log_group" "apigw" {
  name              = "/aws/apigateway/${var.environment}-todo-api"
  retention_in_days = 7
}
```

필요한 코드는 모두 살펴봤다. 이제 리소스를 배포해보자. terraform/env 디렉토리로 이동한다.

```
$ cd terraform/env 
```

아래와 같은 명령어를 통해 테라폼 프로젝트를 초기화한다.

```
$ terraform init
Initializing the backend...
Initializing modules...
Initializing provider plugins...
- Reusing previous version of hashicorp/aws from the dependency lock file
- Reusing previous version of hashicorp/archive from the dependency lock file
- Using previously-installed hashicorp/aws v6.35.1
- Using previously-installed hashicorp/archive v2.7.1

Terraform has been successfully initialized!

You may now begin working with Terraform. Try running "terraform plan" to see
any changes that are required for your infrastructure. All Terraform commands
should now work.

If you ever set or change modules or backend configuration for Terraform,
rerun this command to reinitialize your working directory. If you forget, other
commands will detect it and remind you to do so if necessary.
```

테라폼 프로젝트에 정의된 리소스들을 배포한다.

```
$ terraform apply

...

Apply complete! Resources: 19 added, 0 changed, 0 destroyed.           
```

정상적으로 배포가 완료되면 다음과 같이 AWS 웹 콘솔에서 API 게이트웨이 배포 결과를 확인할 수 있다.

- OpenAPI 명세 YAML 파일에 정의된 규칙에 맞게 API 엔드포인트가 생성된 것을 확인할 수 있다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/deploy-aws-api-gateway-with-openapi-spec-01.png" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-03-11-deploy-aws-api-gateway-with-openapi-spec>

#### REFERENCE

- <https://docs.aws.amazon.com/ko_kr/apigateway/latest/developerguide/welcome.html>
- <https://docs.aws.amazon.com/ko_kr/apigateway/latest/developerguide/http-api-open-api.html>
- <https://docs.aws.amazon.com/ko_kr/apigateway/latest/developerguide/import-api-aws-variables.html>
- <https://docs.aws.amazon.com/ko_kr/apigateway/latest/developerguide/api-gateway-import-api.html>
- <https://docs.aws.amazon.com/ko_kr/apigateway/latest/developerguide/api-gateway-swagger-extensions.html>
- <https://docs.aws.amazon.com/ko_kr/apigateway/latest/developerguide/api-gateway-swagger-extensions-integration.html>
- <https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.0.1.md>

[open-api-spec-with-orval-link]: https://junhyunny.github.io/openapi/orval/auto-generate-code/react-query/msw/open-api-spec-with-orval/
[aws-sam-cli-link]: https://junhyunny.github.io/aws/aws-sam-cli/api-gateway/lambda/aws-sam-cli/