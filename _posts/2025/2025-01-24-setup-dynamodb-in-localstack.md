---
title: "Setup DynamoDB with LocalStack"
search: false
category:
  - aws
  - dynamodb
  - localstack
last_modified_at: 2025-01-24T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Run DynamoDB local container with docker compose][dynamodb-container-with-docker-compose-link]

## 0. 들어가면서

로컬 환경에서 개발, 테스트를 위해 DynamoDB 로컬 컨테이너를 사용하고 있다. 팀원이 `LocalStack`을 사용해보자는 의견을 내서 사용하기 전에 LocalStack 컨셉과 이를 사용해 어떻게 DynamoDB를 셋업하는지 정리했다.

## 1. What is LocalStack?

LocalStack은 AWS 리소스들을 로컬 환경에서 간단하게 실행할 수 있는 에뮬레이터(emulator)다. LocalStack을 사용하면 내부 환경에 애플리케이션 개발에 필요한 AWS 리소스(e.g. DynamoDB, Lambda, S3, Kinesis, SQS 등)를 손쉽게 모두 준비할 수 있다. AWS 클라우드 리소스를 대체하기 위해 사용하는 다른 서비스들을 LocalStack 하나로 모두 커버할 수 있다. 

예를 들어 다음과 같은 스택을 사용했다.

- S3 대체 서비스 - MinIO 컨테이너
- DynamoDB 대체 서비스 - DynamoDB Local 컨테이너
- ElastiCache 대체 서비스 - Redis 컨테이너

LocalStack은 위 AWS 리소스들을 하나의 컨테이너를 통해 제공할 수 있다. 무료로 사용할 수 있지만, 특정 기능들은 유료이기 때문에 결제가 필요할 수도 있다. `One for All`이기 때문에 엄청 편리할 것 같지만, 내가 개발하는 애플리케이션들이 필요한 AWS 리소스들을 로컬 환경에 구축할 때 사용하는 도커 컴포즈(docker compose) YAML 파일의 복잡도가 낮아지는 장점 외에 특별한 점을 느끼긴 어려웠다.

## 2. Setup DynamoDB table on LocalStack container

이제 LocalStack 컨테이너를 실행한 후 내부 DynamoDB에 개발에 필요한 테이블을 준비해보자. 커맨드로 LocalStack 컨테이너를 쉽게 실행할 수 있지만, 이 글에선 도커 컴포즈를 사용한다. 다음과 같은 도커 컴포즈 YAML 파일을 작성한다.

```yml
version: "3.8"
services:
  localstack:
    image: localstack/localstack
    ports:
      - "127.0.0.1:4566:4566" # LocalStack 내부 서비스를 외부에서 접근할 떄 사용하는 포트, LocalStack Gateway
      - "127.0.0.1:4510-4559:4510-4559" # 외부 서비스들의 포트 범위
    environment:
      - DYNAMODB_SHARE_DB=1 # DynamoDB를 단일 데이터베이스로 사용
    volumes:
      - "./init:/etc/localstack/init/ready.d" # 초기화 훅(hook) 스크립트
      - "./volume:/var/lib/localstack"
      - "${DOCKER_SOCK:-/var/run/docker.sock}:/var/run/docker.sock" # 로컬 호스트 도커 연결
```

`DYNAMODB_SHARE_DB` 환경 변수를 1로 설정하여 DynamoDB가 지역마다 별도 데이터베이스를 사용하지 않도록 한다. 단일 데이터베이스로 사용하지 않는 경우 각 지역마다 다른 데이터베이스를 사용하기 때문에 지역(region) 설정이 불가능한 NoSQL워크벤치에선 DynamoDB에 생성된 테이블을 확인할 수 없다. DynamoDB에 생성한 테이블을 NoSQL워크벤치(workbench) 같은 도구를 통해 확인하기 위해선 이 설정이 필요하다. 

나는 LocalStack 컨테이너를 실행함과 동시에 DyanmoDB에 테이블을 준비하고 싶었다. LocalStack 컨테이너의 초기화 훅을 사용하면 테이블 초기화가 가능하다. LocalStack 컨테이너는 다음과 같은 라이프사이클을 갖는다.

- BOOT - the container is running but the LocalStack runtime has not been started
- START - the Python process is running and the LocalStack runtime is starting
- READY - LocalStack is ready to serve requests
- SHUTDOWN - LocalStack is shutting down

각 라이프사이클에 동작하는 훅 스크립트는 아래 디렉토리들에 존재한다.

```
/etc
└── localstack
    └── init
        ├── boot.d           <-- executed in the container before localstack starts
        ├── ready.d          <-- executed when localstack becomes ready
        ├── shutdown.d       <-- executed when localstack shuts down
        └── start.d          <-- executed when localstack starts up
```

`/etc/localstack/init/ready.d` 경로에 가져다 놓은 쉘 스크립트는 LocalStack 컨테이너 준비가 완료된 후 실행된다. 이 곳에 DynamoDB 테이블을 생성할 수 있는 쉘 스크립트를 볼륨으로 공유한다. 볼륨으로 공유한 프로젝트의 `./init` 경로에 아래 쉘 스크립트를 준비한다.

```
#!/bin/bash
awslocal dynamodb create-table \
    --table-name TodoTable \
    --key-schema AttributeName=PK,KeyType=HASH \
    --attribute-definitions AttributeName=PK,AttributeType=S \
    --billing-mode PAY_PER_REQUEST \
    --region ap-northeast-1;
```

도커 컴포즈를 실행하면 컨테이너 실행과 동시에 DynamoDB에 TodoTable 테이블이 생성되는 로그를 확인할 수 있다.

```
$ docker compose up

...

localstack-1  | 2025-01-24T17:24:24.030  INFO --- [et.reactor-0] localstack.utils.bootstrap : Execution of "require" took 2801.54ms
localstack-1  | 2025-01-24T17:24:24.444  INFO --- [et.reactor-0] localstack.request.aws     : AWS dynamodb.CreateTable => 200
localstack-1  | {
localstack-1  |     "TableDescription": {
localstack-1  |         "AttributeDefinitions": [
localstack-1  |             {
localstack-1  |                 "AttributeName": "PK",
localstack-1  |                 "AttributeType": "S"
localstack-1  |             }
localstack-1  |         ],
localstack-1  |         "TableName": "TodoTable",
localstack-1  |         "KeySchema": [
localstack-1  |             {
localstack-1  |                 "AttributeName": "PK",
localstack-1  |                 "KeyType": "HASH"
localstack-1  |             }
localstack-1  |         ],
localstack-1  |         "TableStatus": "ACTIVE",
localstack-1  |         "CreationDateTime": 1737739464.222,
localstack-1  |         "ProvisionedThroughput": {
localstack-1  |             "LastIncreaseDateTime": 0.0,
localstack-1  |             "LastDecreaseDateTime": 0.0,
localstack-1  |             "NumberOfDecreasesToday": 0,
localstack-1  |             "ReadCapacityUnits": 0,
localstack-1  |             "WriteCapacityUnits": 0
localstack-1  |         },
localstack-1  |         "TableSizeBytes": 0,
localstack-1  |         "ItemCount": 0,
localstack-1  |         "TableArn": "arn:aws:dynamodb:ap-northeast-1:000000000000:table/TodoTable",
localstack-1  |         "TableId": "4f87df05-3ab0-48e2-95cf-5ab3b9348cb3",
localstack-1  |         "BillingModeSummary": {
localstack-1  |             "BillingMode": "PAY_PER_REQUEST",
localstack-1  |             "LastUpdateToPayPerRequestDateTime": 1737739464.222
localstack-1  |         },
localstack-1  |         "DeletionProtectionEnabled": false
localstack-1  |     }
localstack-1  | }
localstack-1  | Ready.
```

이제 NoSQL워크벤치에서 LocalStack 컨테이너로 연결하면 해당 테이블 정보를 확인할 수 있다. NoSQL워크벤치에서 4566 포트번호를 사용해 연결을 만든다.

<div align="center">
  <img src="/images/posts/2025/setup-dynamodb-in-localstack-01.png" width="100%" class="image__border">
</div>

<br/>

"TodoTable" 이름을 갖는 테이블 정보를 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2025/setup-dynamodb-in-localstack-02.png" width="100%" class="image__border">
</div>

<br/>

## 3. Trouble shooting

다음과 같은 에러들이 있었다.

### 3.1. M4 Apple chip issue

나는 M4 맥북(macbook)을 사용 중이다. M4 맥북을 사용하는 경우 localstack/localstack:latest 이미지를 사용하면 에러가 발생한다. M3 맥북에선 문제가 없는 것을 확인헀다.

- DynamoDBLocal.jar 파일을 계속 재시작한다. 무한 루프처럼 재시작이 빠르게 반복된다.

```
...

localstack-1  | 2025-01-24T17:18:57.063  INFO --- [-functhread5] localstack.utils.run       : Restarting process (received exit code -6): ['java', '-Xmx256m', '-javaagent:/usr/lib/localstack/dynamodb-local/2/ddb-local-loader-0.1.jar', '-Djava.library.path=/usr/lib/localstack/dynamodb-local/2/DynamoDBLocal_lib', '-jar', '/usr/lib/localstack/dynamodb-local/2/DynamoDBLocal.jar', '-port', '40083', '-dbPath', '/tmp/localstack/state/dynamodb', '-sharedDb']
localstack-1  | 2025-01-24T17:18:57.080  INFO --- [-functhread5] localstack.utils.run       : Restarting process (received exit code -6): ['java', '-Xmx256m', '-javaagent:/usr/lib/localstack/dynamodb-local/2/ddb-local-loader-0.1.jar', '-Djava.library.path=/usr/lib/localstack/dynamodb-local/2/DynamoDBLocal_lib', '-jar', '/usr/lib/localstack/dynamodb-local/2/DynamoDBLocal.jar', '-port', '40083', '-dbPath', '/tmp/localstack/state/dynamodb', '-sharedDb']
localstack-1  | 2025-01-24T17:18:57.098  INFO --- [-functhread5] localstack.utils.run       : Restarting process (received exit code -6): ['java', '-Xmx256m', '-javaagent:/usr/lib/localstack/dynamodb-local/2/ddb-local-loader-0.1.jar', '-Djava.library.path=/usr/lib/localstack/dynamodb-local/2/DynamoDBLocal_lib', '-jar', '/usr/lib/localstack/dynamodb-local/2/DynamoDBLocal.jar', '-port', '40083', '-dbPath', '/tmp/localstack/state/dynamodb', '-sharedDb']

...
```

M4 칩에선 `localstack/localstack:latest-amd64` 이미지를 사용하면 호스트 플랫폼과 맞지 않는다는 경고 메시지와 함께 DynamoDB에 정상적으로 테이블이 생성되는 것을 확인할 수 있다.

```
$ docker compose up

WARN[0000] /Users/junhyunny/Desktop/todoApp/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
[+] Running 3/0
 ✔ Network todoapp_default                                                                                                                                   Created                                                                                                  0.0s 
 ✔ Container todoapp-localstack-1                                                                                                                            Created                                                                                                  0.1s 
 ! localstack The requested image's platform (linux/amd64) does not match the detected host platform (linux/arm64/v8) and no specific platform was requested                                                                                                          0.0s 
Attaching to localstack-1
localstack-1  | 
localstack-1  | LocalStack version: 4.0.4.dev117
localstack-1  | LocalStack build date: 2025-01-22
localstack-1  | LocalStack build git hash: b4b0ab9f9
localstack-1  | 
localstack-1  | 2025-01-24T17:24:24.030  INFO --- [et.reactor-0] localstack.utils.bootstrap : Execution of "require" took 2801.54ms
localstack-1  | 2025-01-24T17:24:24.444  INFO --- [et.reactor-0] localstack.request.aws     : AWS dynamodb.CreateTable => 200
localstack-1  | {
localstack-1  |     "TableDescription": {
localstack-1  |         "AttributeDefinitions": [
localstack-1  |             {
localstack-1  |                 "AttributeName": "PK",
localstack-1  |                 "AttributeType": "S"
localstack-1  |             }
localstack-1  |         ],
localstack-1  |         "TableName": "TodoTable",
localstack-1  |         "KeySchema": [
localstack-1  |             {
localstack-1  |                 "AttributeName": "PK",
localstack-1  |                 "KeyType": "HASH"
localstack-1  |             }
localstack-1  |         ],
localstack-1  |         "TableStatus": "ACTIVE",
localstack-1  |         "CreationDateTime": 1737739464.222,
localstack-1  |         "ProvisionedThroughput": {
localstack-1  |             "LastIncreaseDateTime": 0.0,
localstack-1  |             "LastDecreaseDateTime": 0.0,
localstack-1  |             "NumberOfDecreasesToday": 0,
localstack-1  |             "ReadCapacityUnits": 0,
localstack-1  |             "WriteCapacityUnits": 0
localstack-1  |         },
localstack-1  |         "TableSizeBytes": 0,
localstack-1  |         "ItemCount": 0,
localstack-1  |         "TableArn": "arn:aws:dynamodb:ap-northeast-1:000000000000:table/TodoTable",
localstack-1  |         "TableId": "4f87df05-3ab0-48e2-95cf-5ab3b9348cb3",
localstack-1  |         "BillingModeSummary": {
localstack-1  |             "BillingMode": "PAY_PER_REQUEST",
localstack-1  |             "LastUpdateToPayPerRequestDateTime": 1737739464.222
localstack-1  |         },
localstack-1  |         "DeletionProtectionEnabled": false
localstack-1  |     }
localstack-1  | }
localstack-1  | Ready.
```

해당 에러는 이미 논-이슈(known-issue)이지만, 아직 해결되진 않은 것 같다.

- <https://github.com/localstack/localstack/issues/12054>

### 3.2. Permission denied to run initialization shell

초기화 훅 폴더에 담긴 쉘 스크립트의 실행 권한이 없는 경우 다음과 같은 에러를 만난다.

```
$ ls -la init/dynamodb.sh
-rw-r--r--@ 1 junhyunny  staff  251 Jan 23 14:28 init/dynamodb.sh

$ docker compose up

...

localstack-1  | 2025-01-24T17:34:43.063 ERROR --- [ady_monitor)] localstack.runtime.init    : Error while running script Script(path='/etc/localstack/init/ready.d/dynamodb.sh', stage=READY, state=ERROR): [Errno 13] Permission denied: '/etc/localstack/init/ready.d/dynamodb.sh'
```

초기화 스크립트에 실행 가능 여부를 설정하면 해결된다.

```
$ chmod +x init/dynamodb.sh

$ ls -la init/dynamodb.sh  
-rwxr-xr-x@ 1 junhyunny  staff  251 Jan 23 14:28 init/dynamodb.sh
```

### 3.3 Exec format error

초기화 스크립트를 실행할 때 스크립트 위에 쉘(shell)에 대한 힌트가 없는 경우 에러가 발생한다. 예를 들어 아래 스크립트를 사용하면 초기화가 실패한다.

```
awslocal dynamodb create-table \
    --table-name TodoTable \
    --key-schema AttributeName=PK,KeyType=HASH \
    --attribute-definitions AttributeName=PK,AttributeType=S \
    --billing-mode PAY_PER_REQUEST \
    --region ap-northeast-1;
```

다음과 같은 에러를 확인할 수 있다.

```
$ docker compose up

...

localstack-1  | 2025-01-24T17:37:23.369 ERROR --- [ady_monitor)] localstack.runtime.init    : Error while running script Script(path='/etc/localstack/init/ready.d/dynamodb.sh', stage=READY, state=ERROR): [Errno 8] Exec format error: '/etc/localstack/init/ready.d/dynamodb.sh'
```

반면, 초기화 쉘 스크립트 파일 최상단에 어떤 쉘을 사용할 것인지 힌트를 작성해주면 문제 없이 실행된다.

```
#!/bin/bash
awslocal dynamodb create-table \
    --table-name TodoTable \
    --key-schema AttributeName=PK,KeyType=HASH \
    --attribute-definitions AttributeName=PK,AttributeType=S \
    --billing-mode PAY_PER_REQUEST \
    --region ap-northeast-1;
```

#### REFERENCE

- <https://www.localstack.cloud/>
- <https://hub.docker.com/r/localstack/localstack>
- <https://docs.localstack.cloud/references/init-hooks/>
- <https://docs.localstack.cloud/user-guide/aws/dynamodb/>
- <https://docs.localstack.cloud/references/configuration/>
- <https://stackoverflow.com/questions/69406956/dynamodb-table-created-by-terraform-in-localstack-not-visible-in-nosql-workbench>
- <https://stackoverflow.com/questions/76659848/permission-denied-error-on-executing-localstack-init-script-file>
- <https://stackoverflow.com/questions/78194798/localstack-errno-8-exec-format-error-etc-localstack-init-ready-d-setup-sh>

[dynamodb-container-with-docker-compose-link]: https://junhyunny.github.io/docker/aws/dynamo-db/dynamodb-container-with-docker-compose/