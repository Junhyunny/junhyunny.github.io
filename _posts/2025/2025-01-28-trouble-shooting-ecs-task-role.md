---
title: "Unable to load credentials error in AWS ECS"
search: false
category:
  - aws
  - dynamodb
  - localstack
last_modified_at: 2025-01-25T23:55:00
---

<br/>

## 0. 들어가면서

AWS ECS(elastic container service) 클러스터에 서비스를 배포할 때 발생한 에러와 해결 방법에 대해 정리했다.

## 1. Problem context

DynamoDB를 사용하는 애플리케이션을 ECS 클러스터에 서비스를 배포할 때 다음과 같은 에러를 만났다. 

```
software.amazon.awssdk.core.exception.SdkClientException: Unable to load credentials from any of the providers in the chain AwsCredentialsProviderChain
(credentialsProviders=[SystemPropertyCredentialsProvider(), EnvironmentVariableCredentialsProvider(), WebIdentityTokenCredentialsProvider(), ProfileCredentialsProvider(profileName=default, profileFile=ProfileFile(sections=[])), ContainerCredentialsProvider(), InstanceProfileCredentialsProvider()]) : 
[SystemPropertyCredentialsProvider(): Unable to load credentials from system settings. Access key must be specified either via environment variable (AWS_ACCESS_KEY_ID) or system property (aws.accessKeyId)., 
EnvironmentVariableCredentialsProvider(): Unable to load credentials from system settings. Access key must be specified either via environment variable (AWS_ACCESS_KEY_ID) or system property (aws.accessKeyId)., 
WebIdentityTokenCredentialsProvider(): Either the environment variable AWS_WEB_IDENTITY_TOKEN_FILE or the javaproperty aws.webIdentityTokenFile must be set., 
ProfileCredentialsProvider(profileName=default, profileFile=ProfileFile(sections=[])): Profile file contained no credentials for profile 'default': ProfileFile(sections=[]), 
ContainerCredentialsProvider(): Cannot fetch credentials from container - neither AWS_CONTAINER_CREDENTIALS_FULL_URI or AWS_CONTAINER_CREDENTIALS_RELATIVE_URI environment variables are set., 
InstanceProfileCredentialsProvider(): Failed to load credentials from IMDS.]

...

```

단순히 로그만 봤을 땐 애플리케이션에서 사용하는 DynamoDB 클라이언트 객체에 필요한 자격 증명(credential)이 설정되지 않은 것이 문제로 보인다. 

> Access key must be specified either via environment variable (AWS_ACCESS_KEY_ID) or system property (aws.accessKeyId).

실제 운영 환경에서 사용 중인 DynamoDB 클라이언트 객체에는 별도로 자격 증명을 설정하고 있지 않다. 

```kotlin
package com.example.demo.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.dynamodb.DynamoDbClient

@Configuration
class DynamoDbConfig {

    @Bean
    fun dynamoDbClient(): DynamoDbClient {
        return DynamoDbClient.builder()
            .region(Region.AP_NORTHEAST_1)
            .build()
    }
}
```

## 2. Solve the problem

ECS에 DynamoDB를 사용하는 서비스를 배포해 본 경험이 있기 때문에 코드에 문제가 없을 것이라고 확신했다. 그렇다면 어디에 문제가 있었을까? ECS 클러스터에 서비스를 배포할 때 필요한 태스크 정의(task definition)을 만들 때 권한과 관련이 있다. 태스크 정의를 만들 때 두 개의 권한을 설정할 수 있다.

- Task role
- Task execution role 

<div align="center">
  <img src="/images/posts/2025/trouble-shooting-ecs-task-role-01.png" width="100%" class="image__border">
</div>

<br/>

태스크 롤(task role)은 ECS 태스크가 실행 중 AWS 리소스에 접근하는 경우 필요한 역할이다. 즉, 컨테이너 내부에서 실행되는 우리가 개발한 애플리케이션이 S3, DynamoDB, Secret Manager 같은 AWS 리소스에 접근할 때 필요한 역할이다. 예를 들어, ECS 태스크가 아래와 같은 기능이 필요하다면 태스크 롤 설정이 필요하다.

- S3 버킷에서 파일 읽기/쓰기
- DynamoDB 테이블 접근
- Secrets Manager에서 비밀 정보 가져오기

태스크 실행 롤(task execution role)은 AWS ECS 에이전트(agent)가 태스크를 실행하고 관리하기 할 때 필요한 AWS 리소스에 접근할 때 필요한 역할이다. 에이전트란 Fargate 플랫폼(혹은 ECS 자체)를 의미한다. 예를 들어, ECS 에이전트가 클러스터에 서비스를 배포할 때 필요한 기능들은 다음과 같다.

- ECR(elastic container registry)에서 도커 이미지를 가져오기
- CloudWatch에 로그 전송

위 설명을 보면 살펴보면 애플리케이션에서 발생하는 원인을 예상할 수 있다. 문제가 발생한 이유는 서비스를 배포할 때 사용한 태스크 정의에 태스크 롤 설정이 없기 때문이다. 다음과 같이 적절한 IAM 롤을 만든 후 ECS 태스크 정의를 업데이트한다.

- IAM 역할에 `ecs-task-dynamodb-role`라는 이름으로 롤을 만든 후 이를 설정한다.

<div align="center">
  <img src="/images/posts/2025/trouble-shooting-ecs-task-role-02.png" width="100%" class="image__border">
</div>

<br/>

IAM 역할에 만든 `ecs-task-dynamodb-role`에 DynamoDB 테이블 접근을 위한 `AmazonDynamoDBFullAccess` 권한을 설정한다.

<div align="center">
  <img src="/images/posts/2025/trouble-shooting-ecs-task-role-03.png" width="100%" class="image__border">
</div>

#### REFERENCE

- <https://stackoverflow.com/questions/48999472/difference-between-aws-elastic-container-services-ecs-executionrole-and-taskr>
- <https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html>