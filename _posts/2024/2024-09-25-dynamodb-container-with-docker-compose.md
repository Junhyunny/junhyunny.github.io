---
title: "Run DynamoDB local container with docker compose"
search: false
category:
  - docker
  - aws
  - dynamo-db
last_modified_at: 2024-09-25T23:55:00
---

<br/>

## 0. 들어가면서

이번 프로젝트에서 가장 어려운 부분은 DynamoDB라는 새로운 기술 셋을 사용해야만 한다는 것이다. 패러다임이 완전히 다르기 때문에 데이터베이스 설계나 사용하는 부분에서 애를 먹고 있다. 시작한지 두 달이 넘어가는 중이지만, 여전히 여러가지 것들을 시도해보고 있다. 일단 이번 글은 로컬 환경에 DynamoDB를 준비하는 과정에 대해 정리했다. 

## 1. Local environment support of DynamoDB

DyanmoDB는 완전 관리형 데이터베이스다. AWS에서 모두 관리하기 때문에 서버를 프로비저닝(provisioning)하거나 소프트웨어 패치, 관리, 설치, 유지 보수, 운영할 필요가 없다. 그렇다면 소프트웨어를 개발하기 위해선 반드시 AWS 클라우드에 리소스를 준비하고 연결해야 할까? 그렇진 않다. AWS는 로컬 환경에서 DynamoDB를 실행할 수 있는 환경을 제공한다. 다음과 같은 3가지 방식을 지원한다.

- DynamoDBLocal jar 패키지 
- 도커 컨테이너
- Apache Maven 종속성

도커 컨테이너를 사용한 방법이 여러모로 편리하기 때문에 이를 선택했다. 공식 홈페이지를 도커 컴포즈를 사용한 보면 자세하게 나와있지만, 거기에 데이터베이스 초기화 스크립트를 실행하는 방법까지 함께 정리했다.

## 2. Project structure

프로젝트 구조는 다음과 같다. 

- docker-compose YAML 파일
- init 디렉토리
  - 초기화 스크립트와 데이터가 포함된다.

```
.
├── docker-compose.yml
└── init
    ├── create-table.sh
    ├── data
    │   └── todo.json
    └── migration-data.sh
```

## 3. Initialize shell script

초기화 스크립트를 살펴보자. 먼저 테이블 생성을 위한 스크립트다.

- 테이블 이름은 TodoTable_20240925 이다.
- dynamoDB 테이블 스키마를 지정한다.
  - 파티션 키(partition key) 이름을 PK로 지정한다.
  - 정렬 키(sort key) 이름을 SK로 지정한다.
- 엔드포인트 URL의 호스트 주소는 DynamoDB 컨테이너로 지정한다.

```
aws dynamodb create-table\
  --table-name TodoTable_20240925\
  --attribute-definitions '[{"AttributeName":"PK","AttributeType":"S"}, {"AttributeName":"SK","AttributeType":"S"}]'\
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE\
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1\
  --endpoint-url http://dynamodb-local:8000
```

데이터 마이그레이션 스크립트는 다음과 같다.

- 대상 테이블 이름은 TodoTable_20240925 이다.
- 미리 준비한 todo.json 파일을 아이템으로 사용한다.

```
aws dynamodb put-item\
  --table-name TodoTable_20240925\
  --item file://./init/data/todo.json\
  --endpoint-url http://dynamodb-local:8000
```

todo.json 파일엔 DynamoDB 데이터 형식에 맞춘 데이터가 준비되어 있다.

```json
{
  "PK": {
    "S": "TODO"
  },
  "SK": {
    "S": "ID#20240925120000-1234567-abcd-efgh-1234-abcde12345"
  },
  "title": {
    "S": "Hello World"
  },
  "content": {
    "S": "This is dynamo db migration data"
  }
}
```

## 4. Docker compose file

`docker-compose.yml` 파일을 준비한다. 가독성을 위해 설명은 인라인 주석으로 작성한다.

```yml
services:
  dynamodb-local: # DynamoDB 컨테이너
    image: amazon/dynamodb-local # DynamoDB 이미지
    container_name: dynamodb-local
    ports:
      - "8000:8000" # port mapping
    healthcheck: # health check, 초기화 스크립트를 실행하기 전 DynamoDB 준비가 완료되었는지 확인하기 위한 ping 커맨드
      test: [ "CMD-SHELL", '[ "$(curl -s -o /dev/null -I -w ''%{http_code}'' http://localhost:8000)" == "400" ]' ]
      interval: 2s
      timeout: 2s
      retries: 10
    command: "-jar DynamoDBLocal.jar -inMemory -sharedDb" # DynamoDB 실행 커맨드, 내부적으로 DynamoDBLocal.jar 를 실행한다.

  setup-dynamo: # 데이터베이스 초기화 컨테이너
    image: amazon/aws-cli # CLI 이미지
    depends_on:
      dynamodb-local:
        condition: service_healthy # dynamodb-local 컨테이너 실행 후 실행한다. health check 를 통해 준비가 완료될 때까지 기다린다.
    environment: # 환경 변수, CLI 실행에 필요한 환경 변수를 준비한다.
      - AWS_ACCESS_KEY_ID=dummy
      - AWS_SECRET_ACCESS_KEY=dummy
      - AWS_DEFAULT_REGION=ap-northeast-1
    entrypoint: ["/bin/sh","-c"] # sh 쉘 사용
    volumes: # 초기화 스크립트 위치를 볼륨으로 공유한다.
      - ./init:/aws/init
    command: # 초기화 스크립트를 실행한다.
      - |
        sh ./init/create-table.sh
        sh ./init/migration-data.sh
```

## 5. Run docker compose and check

도커 컴포즈를 실행한다. 로그 확인을 위해 -d 옵션은 생략한다. DynamoDB 컨테이너 실행 후 초기화 스크립트 실행 결과가 출력된다.

```
$ docker compose up    

[+] Running 3/0
 ✔ Network action-in-blog_default           Created                                            0.0s 
 ✔ Container dynamodb-local                 Created                                            0.0s 
 ✔ Container action-in-blog-setup-dynamo-1  Created                                            0.0s 
Attaching to setup-dynamo-1, dynamodb-local
dynamodb-local  | Initializing DynamoDB Local with the following configuration:
dynamodb-local  | Port: 8000
dynamodb-local  | InMemory:     true
dynamodb-local  | Version:      2.5.2
dynamodb-local  | DbPath:       null
dynamodb-local  | SharedDb:     true
dynamodb-local  | shouldDelayTransientStatuses: false
dynamodb-local  | CorsParams:   null
dynamodb-local  | 
setup-dynamo-1  | {
setup-dynamo-1  |     "TableDescription": {
setup-dynamo-1  |         "AttributeDefinitions": [
setup-dynamo-1  |             {
setup-dynamo-1  |                 "AttributeName": "PK",
setup-dynamo-1  |                 "AttributeType": "S"
setup-dynamo-1  |             },
setup-dynamo-1  |             {
setup-dynamo-1  |                 "AttributeName": "SK",
setup-dynamo-1  |                 "AttributeType": "S"
setup-dynamo-1  |             }
setup-dynamo-1  |         ],
setup-dynamo-1  |         "TableName": "TodoTable_20240925",
setup-dynamo-1  |         "KeySchema": [
setup-dynamo-1  |             {
setup-dynamo-1  |                 "AttributeName": "PK",
setup-dynamo-1  |                 "KeyType": "HASH"
setup-dynamo-1  |             },
setup-dynamo-1  |             {
setup-dynamo-1  |                 "AttributeName": "SK",
setup-dynamo-1  |                 "KeyType": "RANGE"
setup-dynamo-1  |             }
setup-dynamo-1  |         ],
setup-dynamo-1  |         "TableStatus": "ACTIVE",
setup-dynamo-1  |         "CreationDateTime": "2024-09-25T22:17:09.249000+00:00",
setup-dynamo-1  |         "ProvisionedThroughput": {
setup-dynamo-1  |             "LastIncreaseDateTime": "1970-01-01T00:00:00+00:00",
setup-dynamo-1  |             "LastDecreaseDateTime": "1970-01-01T00:00:00+00:00",
setup-dynamo-1  |             "NumberOfDecreasesToday": 0,
setup-dynamo-1  |             "ReadCapacityUnits": 1,
setup-dynamo-1  |             "WriteCapacityUnits": 1
setup-dynamo-1  |         },
setup-dynamo-1  |         "TableSizeBytes": 0,
setup-dynamo-1  |         "ItemCount": 0,
setup-dynamo-1  |         "TableArn": "arn:aws:dynamodb:ddblocal:000000000000:table/TodoTable_20240925",
setup-dynamo-1  |         "DeletionProtectionEnabled": false
setup-dynamo-1  |     }
setup-dynamo-1  | }
setup-dynamo-1 exited with code 0
```

도커 컴포즈를 다시 detach 모드로 실행하거나 다른 터미널 세션을 열어서 테이블과 데이터가 정상적으로 준비되었는지 확인한다. 호스트 컴퓨터에 AWS CLI가 설치되어 있어야 확인이 가능하다. 먼저 동일한 환경 변수를 터미널 세션에 준비한다.

```
export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy
export AWS_DEFAULT_REGION=ap-northeast-1
```

scan 명령어를 통해 생성한 테이블에 데이터가 존재하는지 확인한다.

```
$ aws dynamodb scan\
  --table-name TodoTable_20240925\
  --endpoint-url http://localhost:8000

{
    "Items": [
        {
            "SK": {
                "S": "ID#20240925120000-1234567-abcd-efgh-1234-abcde12345"
            },
            "PK": {
                "S": "TODO"
            },
            "title": {
                "S": "Hello World"
            },
            "content": {
                "S": "This is dynamo db migration data"
            }
        }
    ],
    "Count": 1,
    "ScannedCount": 1,
    "ConsumedCapacity": null
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-09-25-dynamodb-container-with-docker-compose>

#### RECOMMEND NEXT POSTS

- [DynamoDB CRUD example with spring boot][dynamodb-crud-example-with-spring-boot-link]

#### REFERENCE

- <https://docs.aws.amazon.com/ko_kr/amazondynamodb/latest/developerguide/Introduction.html>
- <https://docs.aws.amazon.com/ko_kr/amazondynamodb/latest/developerguide/DynamoDBLocal.html>
- <https://docs.aws.amazon.com/ko_kr/amazondynamodb/latest/developerguide/DynamoDBLocal.UsageNotes.html>
- <https://medium.com/@danielarrais.dev/how-to-create-and-initialize-tables-in-a-local-dynamodb-with-docker-compose-notion-af22c3b603cb>
- <https://medium.com/rate-labs/%EC%95%84-%ED%95%B4%EB%B4%90-dynamodb-%EB%93%A4%EC%96%B4%EA%B0%84%EB%8B%A4-f8da282bc625>
- <https://stackoverflow.com/a/65584498/14859847>

[dynamodb-crud-example-with-spring-boot-link]: https://junhyunny.github.io/spring-boot/aws/dynamo-db/dynamodb-crud-example-with-spring-boot/