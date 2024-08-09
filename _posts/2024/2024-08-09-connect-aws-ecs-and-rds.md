---
title: "Connect AWS ECS and RDS"
search: false
category:
  - aws
last_modified_at: 2024-08-09T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [AWS ECS(Elastic Container Service) Setup][aws-ecs-service-setup-link]

## 0. 들어가면서

[이전 글][aws-ecs-service-setup-link]에서 구축한 ECS 클러스터에서 실행되는 태스크(task)는 H2 데이터베이스를 사용했기 때문에 데이터베이스와 관련된 내용을 다루지 않았다. 이번엔 ECS 태스크 인스턴스와 AWS RDS(Relational Database Service) 데이터베이스를 연결하는 방법에 대해 정리했다. 데이터베이스를 연결하기 전 구축된 ECS 클러스터의 모습은 다음과 같다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-01.png" width="100%" class="image__border">
</div>

## 1. Create Aurora PostgreSQL

`RDS 대시보드`에서 데이터베이스를 생성할 수 있다.

- 테스트 용도이기 때문에 모니터링 기능은 비활성화한다.
- `Create database` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-02.png" width="100%" class="image__border">
</div>

<br/>

데이터베이스는 `Aurora PostgreSQL`을 사용한다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-03.png" width="100%" class="image__border">
</div>

<br/>

데이터베이스 이름과 데이터베이스 접속 정보를 관리하는 방법을 결정한다.

- `demo-rds-aurora-postgres`를 이름으로 사용한다.
- `Managed in AWS Secrets Manager` 옵션을 사용한다.
  - 데이터베이스 접속 정보는 AWS 시크릿 매니저(secrets manager)에서 관리한다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-04.png" width="100%" class="image__border">
</div>

<br/>

연결 테스트 용도이기 때문에 데이터베이스 명세(specification)은 가장 작은 타입을 사용한다. 

- `db.rg5.large` 타입을 사용한다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-05.png" width="100%" class="image__border">
</div>

<br/>

데이터베이스가 실행될 네트워크 환경을 정의한다.

- VPC는 사전에 만든 `demo-service-vpc`를 사용한다.
- 데이터베이스 서브넷 그룹은 자동으로 만들어진다.
- 공개 접근(public access)는 불가능하게 막는다.
- 이름이 `demo-rds-sg` 새로운 VPC 시큐리티 그룹을 만든다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-06.png" width="100%" class="image__border">
</div>

<br/>

한달 예상 가격을 확인하고 데이터베이스를 생성한다.

- `Create database` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-07.png" width="100%" class="image__border">
</div>

<br/>

데이터베이스를 생성하면 다소 긴 시간이 걸린다. 데이터베이스 생성이 완료되면 다음과 같은 화면을 볼 수 있다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-08.png" width="100%" class="image__border">
</div>

## 2. Add inbound rule in Security Group for Database

데이터베이스를 생성할 때 함께 만들어진 시큐리티 그룹의 `인바운드 규칙(inbound rule)`을 변경해야 한다. 데이터베이스로 접속하는 ECS 태스크들은 전부 VPC 네트워크 내부에 위치하기 때문에 인바운드 규칙을 결정할 때 VPC IP 대역을 사용한다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-09.png" width="100%" class="image__border">
</div>

## 3. ECS Task Definition Update

데이터베이스 생성이 완료되면 ECS 클러스터에 배포할 태스크 정의를 변경해야 한다. 변경을 시작하기 전에 컨테이너의 스프링 애플리케이션에서 사용하는 YAML 파일을 살펴보자. 환경 변수(environment variable)를 통해 필요한 값을 주입 받는다.

- DATABASE_URL 
  - 데이터베이스 URL 정보를 주입 받고, 없는 경우 H2 데이터베이스를 사용한다.
- DATABASE_DRIVER_CLASS
  - 데이터베이스 드라이버 정보를 주입 받고, 없는 경우 H2 드라이버 클래스를 사용한다.
- DATABASE_USERNAME
  - 데이터베이스 사용자 이름 정보를 주입 받고, 없는 경우 "sa" 값을 사용한다.
- DATABASE_PASSWORD
  - 데이터베이스 비밀번호를 주입 받고, 없는 경우 빈 문자열을 사용한다.

```yml
spring:
  datasource:
    url: ${DATABASE_URL:jdbc:h2:mem:test}
    driver-class-name: ${DATABASE_DRIVER_CLASS:org.h2.Driver}
    username: ${DATABASE_USERNAME:sa}
    password: ${DATABASE_PASSWORD:}
  jpa:
    show-sql: true
    hibernate:
      ddl-auto: create
```

위 설정 파일을 통해 애플리케이션이 필요한 값을 주입 받아 사용할 수 있는 준비가 완료 되었다. 위 설정은 데이터베이스의 테이블들을 초기화 하는 `spring.jpa.hibernate.ddl-auto` 속성이 `create`인 것에 주의하길 바란다. 필자는 AWS ECS, RDS 연결을 위한 예제를 작성하는 중이기 때문에 첫 배포시 에러가 발생하지 않도록 `create` 값을 사용했다.

### 3.1. RDS Database URL endpoint

RDS에서 생성한 데이터베이스의 엔드포인트는 해당 데이터베이스 화면에서 확인할 수 있다.

- 필자는 `Writer` 타입의 데이터베이스 엔드포인트를 사용한다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-10.png" width="100%" class="image__border">
</div>

### 3.2. Secrets Manager RDS Connection

데이터베이스를 생성할 때 `Managed in AWS Secrets Manager` 옵션을 사용하면 `Secrets Manager 대시보드`에 시크릿 정보가 자동으로 새로 생성된다. 

- `rds!cluster-{UUID}`

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-11.png" width="100%" class="image__border">
</div>

<br/>

해당 시크릿 매니저를 눌러보면 데이터베이스의 접속 정보인 사용자 이름과 비밀번호를 확인할 수 있다.

- 사용자 이름은 "username"이다.
- 비밀번호는 "password"이다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-12.png" width="100%" class="image__border">
</div>

### 3.3. Add Environment Variable in ECS Task Definition 

애플리케이션이 실행될 때 필요한 새로운 환경 변수 값을 추가한다. 이 과정에서 ECS 태스크 정의의 버전이 업데이드 된다. 

- 최신 버전의 태스크를 선택한다.
- `태스크 정의 대시보드` 화면 우측 상단에 `Create new revision` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-13.png" width="100%" class="image__border">
</div>

<br/>

직접 입력한 값을 사용하는지 시크릿 매니저로부터 값을 구하는지에 따라서 밸류 타입이 달라진다.

- Value
  - 개발자가 직접 입력한 값들을 사용한다.
- ValueFrom
  - 태스크 컨테이너가 실행될 때 시크릿 매니저로부터 필요한 값들을 조회하여 사용한다.
  - 입력 필드에 `{AWS_SECRETS_MANAGER_ARN}:{SECRET_VALUE_KEY}::` 같은 포맷으로 값을 작성한다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-14.png" width="100%" class="image__border">
</div>

<br/>

태스크 정의에 새로운 환경 변수를 추가하였으니 이를 생성한다. 새로운 리비전(revision)으로 태스크 정의가 추가된다.

- `Create` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-15.png" width="100%" class="image__border">
</div>

### 3.4. Update ECS Service

태스크가 변경되었으니 ECS 서비스를 업데이트한다. 태스크 정의 화면에서 서비스를 업데이트한다.

- `Deploy > Update service` 버튼을 선택한다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-16.png" width="100%" class="image__border">
</div>

<br/>

해당 태스크 인스턴스를 실행할 클러스터와 서비스를 선택한다.

- `demo-ecs-cluster` 클러스터를 선택한다.
- `demo-ecs-service` 서비스를 선택한다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-17.png" width="100%" class="image__border">
</div>

<br/>

새로 만든 태스크 정의에 맞게 서비스가 관리하는 태스크 인스턴스들을 교체한다.

- `Force new deployment` 체크 박스를 선택한다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-18.png" width="100%" class="image__border">
</div>

<br/>

기타 옵션은 별다른 변경이 없다.

- `Update` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-19.png" width="100%" class="image__border">
</div>

## 4. Trouble shooting

### 4.1. Secrets Manager Connection

다음과 같은 에러를 확인할 수 있다.

> Task stopped at: 2024-08-09T17:24:32.638Z<br/>
> ResourceInitializationError: unable to pull secrets or registry auth: unable to retrieve secret from asm: There is a connection issue between the task and AWS Secrets Manager. Check your task network configuration. failed to fetch secret arn:aws:secretsmanager:ap-northeast-2:1234567890:secret:rds!cluster-12345667890-abcd-erfg-hijk-lmnopqrstu-VWXYZ from secrets manager: RequestCanceled: request context canceled caused by: context deadline exceeded

[이전 글][aws-ecs-service-setup-link]에서 마주친 문제와 동일하다. VPC 프라이빗 서브넷에 배포할 때 서브넷 외부에 위치한 시크릿 매니저에 접근하지 못하기 때문에 문제가 발생한다. 동일하게 엔드포인트(endpoint)를 만들어준다. `VPC 대시보드`의 엔드포인트 화면에서 생성할 수 있다.

- `Create endpoint` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-20.png" width="100%" class="image__border">
</div>

<br/>

엔드포인트 이름과 AWS 서비스를 지정한다.

- 이름은 `demo-ecs-secrets-manager-eni`으로 지정한다.
- 시크릿 매니저에 접근하기 위해 필요한 서비스 이름은 `com.amazonaws.ap-northeast-2.secretsmanager`이다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-21.png" width="100%" class="image__border">
</div>

<br/>

엔드포인트가 위치할 VPC와 서브넷을 선택하고, 시큐리티 그룹을 지정한다.

- 사전에 만든 `demo-service-vpc`를 사용한다.
- 각 AZ(Availability Zone)의 프라이빗 서브넷을 선택한다.
- `demo-ecs-service-sq` 시큐리티 그룹을 사용한다.
  - 시크릿 매니저는 HTTPS 통신을 사용하기 때문에 443 포트에 대한 인바운드 규칙이 필요하다.
  - 해딩 인바운드 규칙은 [이전 글][aws-ecs-service-setup-link]에서 추가하였다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-22.png" width="100%" class="image__border">
</div>

### 4.2. Insufficient policies

위 에러가 통과하면 다음과 같은 에러를 만난다.

> Task stopped at: 2024-08-09T17:41:56.527Z<br/>
> ResourceInitializationError: unable to pull secrets or registry auth: execution resource retrieval failed: unable to retrieve secret from asm: service call has been retried 1 time(s): failed to fetch secret arn:aws:secretsmanager:ap-northeast-2:1234567890:secret:rds!cluster-12345667890-abcd-erfg-hijk-lmnopqrstu-VWXYZ from secrets manager: AccessDeniedException: User: arn:aws:sts::1234567890:assumed-role/ecsTaskExecutionRole/365abd05e5e64b4db9025dbeee553342 is not authorized to perform: secretsmanager:GetSecretValue on resource: arn:aws:secretsmanager:ap-northeast-2:1234567890:secret:rds!cluster-12345667890-abcd-erfg-hijk-lmnopqrstu-VWXYZ because no identity-based policy allows the secretsmanager:GetSecretValue action status code: 400, request id: 9ce8d0e9-9057-4743-a3f2-afdc519fcebe

`AccessDeniedException` 에러가 발생한다. 지정된 역할에 권한이 불충분하기 때문에 발생한다. 사용 중인 `ecsTaskExecutionRole` 역할에 시크릿 매니저에 접근할 수 있는 정책을 추가한다. 역할에 대한 정책 변경은 `IAM 대시보드`의 `Roles` 화면에서 가능하다. ecsTaskExecutionRole 역할을 찾아 권한을 부여한다.

- `Add permissions > Attach policies` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-23.png" width="100%" class="image__border">
</div>

<br/>

시크릿 매니저에 접근하여 정보를 조회하기 위한 적합한 정책을 찾아 선택한다.

- `SecretsManagerReadWrite` 정책을 찾아 선택한다.
- `Add permissions` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-24.png" width="100%" class="image__border">
</div>

<br/>

ecsTaskExecutionRole 역할은 최종적으로 다음과 같은 정책들을 갖는다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-25.png" width="100%" class="image__border">
</div>

## 5. Check the result

애플리케이션에 변경이 없기 때문에 CloudWatch 로그를 통해 정상적으로 배포되었는지 확인한다. 

- 히카리 풀(hikari pool)에서 `PgConnection` 객체를 사용한다.

```	
...

2024-08-09T17:54:00.296Z INFO 1 --- [ main] o.s.o.j.p.SpringPersistenceUnitInfo : No LoadTimeWeaver setup: ignoring JPA class transformer	
2024-08-09T17:54:00.360Z INFO 1 --- [ main] com.zaxxer.hikari.HikariDataSource : HikariPool-1 - Starting...	
2024-08-09T17:54:01.269Z INFO 1 --- [ main] com.zaxxer.hikari.pool.HikariPool : HikariPool-1 - Added connection org.postgresql.jdbc.PgConnection@55b45ea1	
2024-08-09T17:54:01.271Z INFO 1 --- [ main] com.zaxxer.hikari.HikariDataSource : HikariPool-1 - Start completed.	
2024-08-09T17:54:03.657Z INFO 1 --- [ main] o.h.e.t.j.p.i.JtaPlatformInitiator : HHH000489: No JTA platform available (set 'hibernate.transaction.jta.platform' to enable JTA platform integration)

...
```

최종적으로 변경된 AWS 인프라 구조는 다음과 같은 모습을 갖는다.

- 프라이빗 서브넷에서 시크릿 매니저에 접근하기 위해선 엔드포인트가 필요하다.
  - 허용된 인바운드 시큐리티 그룹 규칙은 VPC 네트워크 대역인 10.0.0.0/16과 443 포트이다.
- 시크릿 매니저에서 값을 읽기 때 SecretsManagerReadWrite 정책이 필요하다.
- 프라이빗 서브넷에 위치한 태스크 인스턴스와 RDS 데이터베이스가 연결된다.
  - 허용된 인바운드 시큐리티 그룹 규칙은 VPC 네트워크 대역인 10.0.0.0/16과 5432 포트이다.

<div align="center">
  <img src="/images/posts/2024/connect-aws-ecs-and-rds-26.png" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-08-08-connect-aws-ecs-service-and-rds/action-in-blog>

[aws-ecs-service-setup-link]: https://junhyunny.github.io/aws/aws-ecs-service-setup/