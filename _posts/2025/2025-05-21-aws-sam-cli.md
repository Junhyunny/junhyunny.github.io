---
title: "AWS SAM(Serverless Application Model) 개념과 CLI 예제"
search: false
category:
  - aws
  - aws-sam-cli
  - api-gateway
  - lambda
last_modified_at: 2025-05-21T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [테라폼(Terraform) 소개][introduction-terraform-link]
- [AWS CDK(Cloud Development Kit) 개념과 예제][aws-cloud-development-kit-link]

## 1. AWS SAM(Serverless Application Model)

> AWS Serverless Application Model (AWS SAM)는 코드형 인프라(IaC)를 사용하여 서버리스 애플리케이션을 구축하기 위한 오픈 소스 프레임워크입니다.

[테라폼(Terraform)][introduction-terraform-link], [CDK(Cloud Development Kit)][aws-cloud-development-kit-link]과 같은 코드형 인프라 프레임워크다. AWS SAM을 사용하면 YAML이나 JSON 형식으로 선언된 리소스들을 AWS CloudFormation 리소스를 통해 AWS 클라우드 배포할 수 있다. 템플릿 형식은 기호에 따라서 선택하면 된다.

SAM을 사용하면 AWS에서 제공하는 람다(lambda), DynamoDB 같은 서버리스(serverless) 리소스들을 연계 및 관리하기 쉽다. 로컬 환경에서도 람다 같은 서버리스 애플리케이션을 실행하고 테스트 할 수 있다.

## 2. Install AWS SAM CLI

CLI 명령어 도구를 설치해 간단한 AWS SAM 프로젝트를 만들고 로컬 환경과 클라우드 환경에 배포해보자. 우선 CLI 명령어 도구를 설치한다. 홈브루는 공식 저장소(homebrew/core)에서 패키지를 설치한다. AWS에서 제공하는 패키지를 설치하기 위해 홈브루(homebrew) 탭(tap)을 등록한다.

- `aws/tap` 탭을 등록한다.

```
$ brew tap aws/tap
```

AWS SAM CLI 도구를 설치한다.

```
$ brew install aws-sam-cli
```

## 3. Create AWS SAM project

이번엔 AWS SAM 프로젝트를 만든다. `sam init` 명령어를 통해 프로젝트를 초기화한다. 간단한 예제이므로 AWS에서 제공하는 템플릿을 활용한다.

- `AWS Quick Start Templates`을 선택한다.
- `Hello World Example with Powertools for AWS Lambda` 선택한다.
- `python3.13` 런타임 선택한다.
- 기타 설정은 기본 값 사용한다.
- 프로젝트 이름은 `action-in-blog`으로 지정한다.

```
$ sam init

You can preselect a particular runtime or package type when using the `sam init` experience.
Call `sam init --help` to learn more.

Which template source would you like to use?
	1 - AWS Quick Start Templates
	2 - Custom Template Location
Choice: 1

Choose an AWS Quick Start application template
	1 - Hello World Example
	2 - Data processing
	3 - Hello World Example with Powertools for AWS Lambda
	4 - Multi-step workflow
	5 - Scheduled task
	6 - Standalone function
	7 - Serverless API
	8 - Infrastructure event management
	9 - Lambda Response Streaming
	10 - GraphQLApi Hello World Example
	11 - Full Stack
	12 - Lambda EFS example
	13 - Serverless Connector Hello World Example
	14 - Multi-step workflow with Connectors
	15 - DynamoDB Example
	16 - Machine Learning
Template: 3

Which runtime would you like to use?
	1 - dotnet8
	2 - dotnet6
	3 - java17
	4 - java11
	5 - java8.al2
	6 - nodejs22.x
	7 - nodejs20.x
	8 - nodejs18.x
	9 - python3.9
	10 - python3.13
	11 - python3.12
	12 - python3.11
	13 - python3.10
Runtime: 10

Based on your selections, the only Package type available is Zip.
We will proceed to selecting the Package type as Zip.

Based on your selections, the only dependency manager available is pip.
We will proceed copying the template using pip.

Would you like to enable X-Ray tracing on the function(s) in your application?  [y/N]:

Would you like to enable monitoring using CloudWatch Application Insights?
For more info, please view https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch-application-insights.html [y/N]:

Would you like to set Structured Logging in JSON format on your Lambda functions?  [y/N]:

Project name [sam-app]: action-in-blog

    -----------------------
    Generating application:
    -----------------------
    Name: action-in-blog
    Runtime: python3.13
    Architectures: x86_64
    Dependency Manager: pip
    Application Template: hello-world-powertools-python
    Output Directory: .
    Configuration file: action-in-blog/samconfig.toml

    Next steps can be found in the README file at action-in-blog/README.md


Commands you can use next
=========================
[*] Create pipeline: cd action-in-blog && sam pipeline init --bootstrap
[*] Validate SAM template: cd action-in-blog && sam validate
[*] Test Function in the Cloud: cd action-in-blog && sam sync --stack-name {stack-name} --watch
```

프로젝트가 생성되면 다음과 같은 구조를 갖는 프로젝트가 생성된다. 

```
$ cd action-in-blog

$ tree .
.
├── __init__.py
├── events
│   └── hello.json
├── hello_world
│   ├── __init__.py
│   ├── app.py
│   └── requirements.txt
├── README.md
├── samconfig.toml
├── template.yaml
└── tests
    ├── __init__.py
    ├── requirements.txt
    └── unit
        ├── __init__.py
        └── test_handler.py
```

파이썬 코드는 AWS SAM 배포와 관련해서 크게 중요하지 않다. AWS 배포를 위해 살펴볼 파일들은 다음 두 가지다. 

- samconfig.toml
  - `sam deploy --guided` 등을 실행할 때 사용자가 입력한 값을 자동 저장하는 설정 파일이다. 이후 `sam deploy`만으로도 동일 설정을 반복 실행할 수 있도록 한다.
- template.yaml
  - AWS 리소스(Lambda, API Gateway, DynamoDB 등)를 정의하는 인프라 코드다. AWS CloudFormation을 기반으로 작성되며, SAM이 이 템플릿을 해석해 인프라를 생성한다.

리소스를 정의하는 `template.yaml` 템플릿 코드를 보면 다음과 같은 섹션들로 나뉜 구조를 갖는다. 

- Transform
  - SAM 템플릿임을 CloudFormation에 알리는 선언이다. 이 줄이 있어야 CloudFormation이 SAM 템플릿 문법을 해석할 수 있다.
- Globals
  - SAM 템플릿에서 반복되는 설정을 공통(global)으로 지정할 수 있다. 
  - AWS::Serverless::Function, AWS::Serverless::Api, AWS::Serverless::SimpleTable 리소스들에 대한 공통 속성을 지정할 수 있다.
- Description
  - 템플릿 또는 스택에 대한 간단한 설명이다.
- Parameters
  - 템플릿에 전달할 외부 입력 값을 정의한다. 재사용 가능한 템플릿을 만들거나, 배포 시 값을 동적으로 변경하고자 할 때 사용한다.
- Mappings
  - 키-값 쌍을 미리 정의해 두고 조건적으로 값을 참조할 수 있게 한다. 예를 들어 리전에 따라 다른 AMI ID를 사용할 수 있도록 맵 객체를 정의한다. 
- Conditions
  - 리소스 생성 여부를 조건으로 제어할 수 있게 한다. 보통 Parameters와 함께 사용한다.
- Resources
  - 실제 AWS 리소스(Lambda, API Gateway, S3 등)를 정의하는 섹션이다.
- Outputs
  - 스택 생성 후 외부로 출력하고 싶은 값을 정의한다. 예를 들어 Lambda 함수 ARN, API Gateway URL 등이 있다.

```yml
Transform: AWS::Serverless-2016-10-31

Globals:
  set of globals

Description:
  String

Metadata:
  template metadata

Parameters:
  set of parameters

Mappings:
  set of mappings

Conditions:
  set of conditions

Resources:
  set of resources

Outputs:
  set of outputs
```

이제 AWS에서 제공하는 템플릿 코드를 살펴보자. 위 템플릿 구조를 대입해보면 AWS 람다를 하나 배포한다는 것을 유추할 수 있다. 배포가 완료되면 API Gateway 주소와 AWS 람다 ARN(Amazon Resource Name)을 출력한다.

```yml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: >
  action-in-blog
  Powertools example

Globals: # https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification-template-anatomy-globals.html
  Function:
    Timeout: 5
    MemorySize: 128
    Runtime: python3.13

Resources:
  HelloWorldFunction:
    Type: AWS::Serverless::Function # More info about Function Resource: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-resource-function.html
    Properties:
      Handler: app.lambda_handler
      CodeUri: hello_world
      Description: Hello World function
      Architectures:
        - x86_64
      Tracing: Active
      Events:
        HelloPath:
          Type: Api # More info about API Event Source: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-property-function-api.html
          Properties:
            Path: /hello
            Method: GET
      # Powertools env vars: https://awslabs.github.io/aws-lambda-powertools-python/#environment-variables
      Environment:
        Variables:
          POWERTOOLS_SERVICE_NAME: PowertoolsHelloWorld
          POWERTOOLS_METRICS_NAMESPACE: Powertools
          LOG_LEVEL: INFO
      Tags:
        LambdaPowertools: python

Outputs:
  HelloWorldApi:
    Description: "API Gateway endpoint URL for Prod environment for Hello World Function"
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/hello"

  HelloWorldFunction:
    Description: "Hello World Lambda Function ARN"
    Value: !GetAtt HelloWorldFunction.Arn
```

## 4. Build AWS SAM project

`sam build` 명령어로 빌드를 수행한다. 빌드 결과는 프로젝트 `.aws-sam` 경로에 생성된다.

```
$ sam build

Starting Build use cache
Manifest file is changed (new hash: 9b9825447f25c5574b2a1972c68ffd78) or dependency folder
(.aws-sam/deps/7f6601c6-2300-4df7-aa78-38d9441f3dcf) is missing for (HelloWorldFunction), downloading dependencies and
copying/building source
Building codeuri: /Users/junhyunny/Desktop/workspace/action-in-blog/hello_world runtime: python3.13 architecture: x86_64
functions: HelloWorldFunction
 Running PythonPipBuilder:CleanUp
 Running PythonPipBuilder:ResolveDependencies
 Running PythonPipBuilder:CopySource
 Running PythonPipBuilder:CopySource

Build Succeeded

Built Artifacts  : .aws-sam/build
Built Template   : .aws-sam/build/template.yaml

Commands you can use next
=========================
[*] Validate SAM template: sam validate
[*] Invoke Function: sam local invoke
[*] Test Function in the Cloud: sam sync --stack-name {{stack-name}} --watch
[*] Deploy: sam deploy --guided
```

## 4. Run AWS SAM project in local environment

AWS SAM CLI를 사용하면 서버리스 애플리케이션을 로컬에서 테스트할 수 있다. 몇 가지 명령어가 있지만, 이번 포스트에선 로컬에서 HTTP 서버를 사용해서 AWS 람다 함수를 실행하는 `sam local start-api` 명령어를 사용한다.

- `sam local start-api` 명령어로 람다를 실행한다.
- 8080 포트 번호로 변경한다.

```
$ sam local start-api -p 8080

No current session found, using default AWS::AccountId
Initializing the lambda functions containers.
Local image is up-to-date
Using local image: public.ecr.aws/lambda/python:3.13-rapid-x86_64.

Mounting /Users/junhyunny/Desktop/workspace/action-in-blog/.aws-sam/build/HelloWorldFunction as /var/task:ro,delegated,
inside runtime container
Containers Initialization is done.
Mounting HelloWorldFunction at http://127.0.0.1:8080/hello [GET]
You can now browse to the above endpoints to invoke your functions. You do not need to restart/reload SAM CLI while working
on your functions, changes will be reflected instantly/automatically. If you used sam build before running local commands,
you will need to re-run sam build for the changes to be picked up. You only need to restart SAM CLI if you update your AWS
SAM template
2025-05-21 23:18:32 WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
 * Running on http://127.0.0.1:8080
2025-05-21 23:18:32 Press CTRL+C to quit
```

cURL 명령어로 로컬 환경에 배포된 엔드포인트를 호출하면 AWS 람다 함수가 실행된다.

```
$ curl http://127.0.0.1:8080/hello

{"message":"hello world"}%
```

## 5. Deploy AWS SAM project

이번엔 AWS SAM 프로젝트를 클라우드 환경에 배포한다. AWS 클라우드에 배포하기 위한 키, 시크릿, 토큰 정보를 터미널 세션에 준비한다.

```
export AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"
export AWS_SESSION_TOKEN="YOUR_AWS_SESSION_TOKEN"
```

`sam build --guided` 명령어로 빌드 결과를 클라우드에 배포한다.

```
$ sam deploy --guided

Configuring SAM deploy
======================

	Looking for config file [samconfig.toml] :  Found
	Reading default arguments  :  Success

	Setting default arguments for 'sam deploy'
	=========================================
	Stack Name [action-in-blog]:
	AWS Region [us-east-1]: ap-northeast-1
	#Shows you resources changes to be deployed and require a 'Y' to initiate deploy
	Confirm changes before deploy [Y/n]:
	#SAM needs permission to be able to create roles to connect to the resources in your template
	Allow SAM CLI IAM role creation [Y/n]:
	#Preserves the state of previously provisioned resources when an operation fails
	Disable rollback [y/N]:
	HelloWorldFunction has no authentication. Is this okay? [y/N]: y
	Save arguments to configuration file [Y/n]:
	SAM configuration file [samconfig.toml]:
	SAM configuration environment [default]:

	Looking for resources needed for deployment:
	Creating the required resources...
	Successfully created!

	Managed S3 bucket: aws-sam-cli-managed-default-samclisourcebucket-12341234123
	A different default S3 bucket can be set in samconfig.toml and auto resolution of buckets turned off by setting resolve_s3=False

        Parameter "stack_name=action-in-blog" in [default.deploy.parameters] is defined as a global parameter
[default.global.parameters].
        This parameter will be only saved under [default.global.parameters] in
/Users/junhyunny/Desktop/workspace/action-in-blog/samconfig.toml.

	Saved arguments to config file
	Running 'sam deploy' for future deployments will use the parameters saved above.
	The above parameters can be changed by modifying samconfig.toml
	Learn more about samconfig.toml syntax at
	https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-config.html

	Uploading to action-in-blog/12341234123123412341234  15431260 / 15431260  (100.00%)

	Deploying with following values
	===============================
	Stack name                   : action-in-blog
	Region                       : ap-northeast-1
	Confirm changeset            : True
	Disable rollback             : False
	Deployment s3 bucket         : aws-sam-cli-managed-default-samclisourcebucket-12341234123
	Capabilities                 : ["CAPABILITY_IAM"]
	Parameter overrides          : {}
	Signing Profiles             : {}

Initiating deployment
=====================

	Uploading to action-in-blog/12341234123123412341234.template  1309 / 1309  (100.00%)


Waiting for changeset to be created..

CloudFormation stack changeset
---------------------------------------------------------------------------------------------------------------------
Operation                     LogicalResourceId             ResourceType                  Replacement
---------------------------------------------------------------------------------------------------------------------
+ Add                         HelloWorldFunctionHelloPath   AWS::Lambda::Permission       N/A
                              PermissionProd
+ Add                         HelloWorldFunctionRole        AWS::IAM::Role                N/A
+ Add                         HelloWorldFunction            AWS::Lambda::Function         N/A
+ Add                         ServerlessRestApiDeployment   AWS::ApiGateway::Deployment   N/A
                              1234123412
+ Add                         ServerlessRestApiProdStage    AWS::ApiGateway::Stage        N/A
+ Add                         ServerlessRestApi             AWS::ApiGateway::RestApi      N/A
---------------------------------------------------------------------------------------------------------------------


Changeset created successfully. arn:aws:cloudformation:ap-northeast-1:1234123412312:changeSet/samcli-deploy1234123412/123412341-1234-1234-1234-12341234


Previewing CloudFormation changeset before deployment
======================================================
Deploy this changeset? [y/N]:  y

2025-05-21 23:28:11 - Waiting for stack create/update to complete

CloudFormation events from stack operations (refresh every 5.0 seconds)
---------------------------------------------------------------------------------------------------------------------
ResourceStatus                ResourceType                  LogicalResourceId             ResourceStatusReason
---------------------------------------------------------------------------------------------------------------------
CREATE_IN_PROGRESS            AWS::CloudFormation::Stack    action-in-blog                User Initiated
CREATE_IN_PROGRESS            AWS::IAM::Role                HelloWorldFunctionRole        -
CREATE_IN_PROGRESS            AWS::IAM::Role                HelloWorldFunctionRole        Resource creation Initiated
CREATE_COMPLETE               AWS::IAM::Role                HelloWorldFunctionRole        -
CREATE_IN_PROGRESS            AWS::Lambda::Function         HelloWorldFunction            -
CREATE_IN_PROGRESS            AWS::Lambda::Function         HelloWorldFunction            Resource creation Initiated
CREATE_IN_PROGRESS -          AWS::Lambda::Function         HelloWorldFunction            Eventual consistency check
CONFIGURATION_COMPLETE                                                                    initiated
CREATE_IN_PROGRESS            AWS::ApiGateway::RestApi      ServerlessRestApi             -
CREATE_IN_PROGRESS            AWS::ApiGateway::RestApi      ServerlessRestApi             Resource creation Initiated
CREATE_COMPLETE               AWS::ApiGateway::RestApi      ServerlessRestApi             -
CREATE_IN_PROGRESS            AWS::ApiGateway::Deployment   ServerlessRestApiDeployment   -
                                                            1234123412
CREATE_IN_PROGRESS            AWS::Lambda::Permission       HelloWorldFunctionHelloPath   -
                                                            PermissionProd
CREATE_IN_PROGRESS            AWS::Lambda::Permission       HelloWorldFunctionHelloPath   Resource creation Initiated
                                                            PermissionProd
CREATE_COMPLETE               AWS::Lambda::Function         HelloWorldFunction            -
CREATE_COMPLETE               AWS::Lambda::Permission       HelloWorldFunctionHelloPath   -
                                                            PermissionProd
CREATE_IN_PROGRESS            AWS::ApiGateway::Deployment   ServerlessRestApiDeployment   Resource creation Initiated
                                                            1234123412
CREATE_COMPLETE               AWS::ApiGateway::Deployment   ServerlessRestApiDeployment   -
                                                            1234123412
CREATE_IN_PROGRESS            AWS::ApiGateway::Stage        ServerlessRestApiProdStage    -
CREATE_IN_PROGRESS            AWS::ApiGateway::Stage        ServerlessRestApiProdStage    Resource creation Initiated
CREATE_COMPLETE               AWS::ApiGateway::Stage        ServerlessRestApiProdStage    -
CREATE_COMPLETE               AWS::CloudFormation::Stack    action-in-blog                -
---------------------------------------------------------------------------------------------------------------------

CloudFormation outputs from deployed stack
------------------------------------------------------------------------------------------------------------------------
Outputs
------------------------------------------------------------------------------------------------------------------------
Key                 HelloWorldApi
Description         API Gateway endpoint URL for Prod environment for Hello World Function
Value               https://1234123412.execute-api.ap-northeast-1.amazonaws.com/Prod/hello

Key                 HelloWorldFunction
Description         Hello World Lambda Function ARN
Value               arn:aws:lambda:ap-northeast-1:1234123412312:function:action-in-blog-HelloWorldFunction-1234123412
------------------------------------------------------------------------------------------------------------------------


Successfully created/updated stack - action-in-blog in ap-northeast-1
```

배포 결과를 보면 API 게이트웨이 경로와 AWS 람다 ARN 값을 확인할 수 있다. API 게이트웨이 경로로 호출하면 로컬 환경에서 테스트한 것과 동일한 응답을 받는다.

변경 사항이 있다면 재빌드 후 배포한다. 이후 배포에는 `--guided` 옵션 없이 명령어를 수행한다. 최초 명령어를 수행할 때 지정한 값들은 `samconfig.toml` 파일에 저장되어 재사용된다. 

배포 시 아래처럼 어떤 부분들이 변경되는지 확인 후 배포할 수 있다. 아래 예시는 /hello 경로를 /hello-world 경로로 변경하는 작업이었다. 

- AWS::ApiGateway::Deployment 리소스는 기존 리소스가 삭제되고 신규 리소스가 생성된다. 
- 이 외 AWS::Lambda::Function, AWS::Lambda::Permission, AWS::ApiGateway::Stage 리소스 등은 변경이 일어난다.

```
$ sam build

Starting Build use cache
Manifest is not changed for (HelloWorldFunction), running incremental build
Building codeuri: /Users/junhyunny/Desktop/workspace/action-in-blog/hello_world runtime: python3.13 architecture: x86_64 functions: HelloWorldFunction
 Running PythonPipBuilder:CopySource
 Running PythonPipBuilder:CopySource

Build Succeeded

Built Artifacts  : .aws-sam/build
Built Template   : .aws-sam/build/template.yaml

Commands you can use next
=========================
[*] Validate SAM template: sam validate
[*] Invoke Function: sam local invoke
[*] Test Function in the Cloud: sam sync --stack-name {{stack-name}} --watch
[*] Deploy: sam deploy --guided

$ sam deploy

		Managed S3 bucket: aws-sam-cli-managed-default-samclisourcebucket-12341234123
		A different default S3 bucket can be set in samconfig.toml
		Or by specifying --s3-bucket explicitly.
	Uploading to action-in-blog/123412341212341234123412341234123  15431263 / 15431263  (100.00%)

	Deploying with following values
	===============================
	Stack name                   : action-in-blog
	Region                       : ap-northeast-1
	Confirm changeset            : True
	Disable rollback             : False
	Deployment s3 bucket         : aws-sam-cli-managed-default-samclisourcebucket-12341234123
	Capabilities                 : ["CAPABILITY_IAM"]
	Parameter overrides          : {}
	Signing Profiles             : {}

Initiating deployment
=====================

	Uploading to action-in-blog/fadd3b0147cdc33e311438f3a862f6e4.template  1321 / 1321  (100.00%)


Waiting for changeset to be created..

CloudFormation stack changeset
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Operation                                                     LogicalResourceId                                             ResourceType                                                  Replacement
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
+ Add                                                         ServerlessRestApiDeployment0f1a98176d                         AWS::ApiGateway::Deployment                                   N/A
* Modify                                                      HelloWorldFunctionHelloPathPermissionProd                     AWS::Lambda::Permission                                       True
* Modify                                                      HelloWorldFunction                                            AWS::Lambda::Function                                         False
* Modify                                                      ServerlessRestApiProdStage                                    AWS::ApiGateway::Stage                                        False
* Modify                                                      ServerlessRestApi                                             AWS::ApiGateway::RestApi                                      False
- Delete                                                      ServerlessRestApiDeployment1234123412                         AWS::ApiGateway::Deployment                                   N/A
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Changeset created successfully. arn:aws:cloudformation:ap-northeast-1:1234123412312:changeSet/samcli-deploy12341234121/123412341-1234-1234-1234123412341234


Previewing CloudFormation changeset before deployment
======================================================
Deploy this changeset? [y/N]: y

2025-05-21 23:36:08 - Waiting for stack create/update to complete

CloudFormation events from stack operations (refresh every 5.0 seconds)
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
ResourceStatus                                                ResourceType                                                  LogicalResourceId                                             ResourceStatusReason
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
UPDATE_IN_PROGRESS                                            AWS::CloudFormation::Stack                                    action-in-blog                                                User Initiated
UPDATE_IN_PROGRESS                                            AWS::Lambda::Function                                         HelloWorldFunction                                            -
UPDATE_COMPLETE                                               AWS::Lambda::Function                                         HelloWorldFunction                                            -
UPDATE_IN_PROGRESS                                            AWS::ApiGateway::RestApi                                      ServerlessRestApi                                             -
UPDATE_COMPLETE                                               AWS::ApiGateway::RestApi                                      ServerlessRestApi                                             -
CREATE_IN_PROGRESS                                            AWS::ApiGateway::Deployment                                   ServerlessRestApiDeployment0f1a98176d                         -
UPDATE_IN_PROGRESS                                            AWS::Lambda::Permission                                       HelloWorldFunctionHelloPathPermissionProd                     Requested update requires the creation of a new physical
                                                                                                                                                                                          resource; hence creating one.
CREATE_IN_PROGRESS                                            AWS::ApiGateway::Deployment                                   ServerlessRestApiDeployment0f1a98176d                         Resource creation Initiated
UPDATE_IN_PROGRESS                                            AWS::Lambda::Permission                                       HelloWorldFunctionHelloPathPermissionProd                     Resource creation Initiated
CREATE_COMPLETE                                               AWS::ApiGateway::Deployment                                   ServerlessRestApiDeployment0f1a98176d                         -
UPDATE_COMPLETE                                               AWS::Lambda::Permission                                       HelloWorldFunctionHelloPathPermissionProd                     -
UPDATE_IN_PROGRESS                                            AWS::ApiGateway::Stage                                        ServerlessRestApiProdStage                                    -
UPDATE_COMPLETE                                               AWS::ApiGateway::Stage                                        ServerlessRestApiProdStage                                    -
UPDATE_COMPLETE_CLEANUP_IN_PROGRESS                           AWS::CloudFormation::Stack                                    action-in-blog                                                -
DELETE_IN_PROGRESS                                            AWS::ApiGateway::Deployment                                   ServerlessRestApiDeployment1234123412                         -
DELETE_IN_PROGRESS                                            AWS::Lambda::Permission                                       HelloWorldFunctionHelloPathPermissionProd                     -
DELETE_COMPLETE                                               AWS::ApiGateway::Deployment                                   ServerlessRestApiDeployment1234123412                         -
DELETE_COMPLETE                                               AWS::Lambda::Permission                                       HelloWorldFunctionHelloPathPermissionProd                     -
UPDATE_COMPLETE                                               AWS::CloudFormation::Stack                                    action-in-blog                                                -
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

CloudFormation outputs from deployed stack
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Outputs
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Key                 HelloWorldApi
Description         API Gateway endpoint URL for Prod environment for Hello World Function
Value               https://1234123412.execute-api.ap-northeast-1.amazonaws.com/Prod/hello-world

Key                 HelloWorldFunction
Description         Hello World Lambda Function ARN
Value               arn:aws:lambda:ap-northeast-1:1234123412312:function:action-in-blog-HelloWorldFunction-1234123412
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Successfully created/updated stack - action-in-blog in ap-northeast-1
```

## CLOSING

아래 명령어를 통해 AWS SAM CLI로 생성된 리소스들을 정리할 수 있다.

```
$ sam delete

	Are you sure you want to delete the stack action-in-blog in the region ap-northeast-1 ? [y/N]: y
	Are you sure you want to delete the folder action-in-blog in S3 which contains the artifacts? [y/N]: y
        - Deleting S3 object with key action-in-blog/123412341212341234123412341234123
        - Deleting S3 object with key action-in-blog/12341234123123412341234
        - Deleting S3 object with key action-in-blog/12341234123123412341234.template
        - Deleting S3 object with key action-in-blog/fadd3b0147cdc33e311438f3a862f6e4.template
	- Deleting Cloudformation stack action-in-blog

Deleted successfully
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-05-21-aws-sam-cli>

#### REFERENCE

- <https://docs.aws.amazon.com/ko_kr/serverless-application-model/latest/developerguide/what-is-sam.html>
- <https://docs.aws.amazon.com/ko_kr/AWSCloudFormation/latest/UserGuide/template-formats.html>
- <https://aws.amazon.com/ko/cloudformation/>
- <https://github.com/aws/homebrew-tap>
- <https://docs.aws.amazon.com/ko_kr/serverless-application-model/latest/developerguide/sam-specification-template-anatomy.html>
- <https://docs.aws.amazon.com/ko_kr/serverless-application-model/latest/developerguide/using-sam-cli-local.html>
- <https://docs.aws.amazon.com/ko_kr/serverless-application-model/latest/developerguide/using-sam-cli-local-start-api.html>

[introduction-terraform-link]: https://junhyunny.github.io/information/infrastructure/dev-ops/introduction-terraform/
[aws-cloud-development-kit-link]: https://junhyunny.github.io/aws/cloud-development-kit/aws-cloud-development-kit/
