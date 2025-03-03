---
title: "AWS CDK(Cloud Development Kit) 개념과 예제"
search: false
category:
  - aws
  - cloud-development-kit
last_modified_at: 2025-02-22T23:55:00
---

<br/>

## 0. 들어가면서

테라폼(terraform)이 겨우 익숙해지는 와중에 새로운 IaC(Infrastructure as Code)를 접하게 됐다. 잠시 다른 프로젝트를 돕기 위해 참여했는데, 여기는 테라폼 대신 AWS CDK(cloud development kit)을 사용하고 있었다. 기본적인 컨셉과 동작을 이해하기 위해 개념과 예시 코드를 글로 정리했다.

## 1. AWS CDK(Cloud Development Kit)

> AWS Cloud Development Kit (AWS CDK)는 코드에서 클라우드 인프라를 정의하고 AWS CloudFormation을 통해 프로비저닝하기 위한 오픈 소스 소프트웨어 개발 프레임워크입니다.

테라폼과 동일하게 반복되는 인프라 작업을 코드로 정의하여 재사용하고, 사람이 수작업을 하면서 발생하는 실수를 줄이기 위해 등장했다. 공식 문서에 따르면 두 가지 부분으로 구성된다.

- AWS CDK Constructor 라이브러리 - 인프라를 빠르게 개발하기 위해 미리 작성된 모듈 및 재사용 가능한 코드의 컬렉션.
- AWS CDK CLI(Command Line Interface) - CDK 앱과 상호 작용하기 위한 명령어 도구.

IaC 도구이기 때문에 코딩을 통해 인프라를 구축할 수 있다. 테라폼은 고유한 언어가 사용하지만, AWS CDK는 아래와 같이 다양한 언어를 지원한다.

- TypeScript
- JavaScript
- Python
- Java
- C#/.Net
- Go

투입된 프로젝트는 타입스크립트(typescript)를 사용했다. 타입스크립트는 어느 정도 익숙하기 때문에 현재 인프라를 이해하거나 코드를 작성하는 것은 크게 어려지 않았다. 다만, AWS CloudFormation과 통합되어 실행되기 때문에 결국 AWS CloudFormation에 대한 이해도를 높일 필요가 있다는 생각이 들었다. 이제부터 CDK를 사용해보자.

## 2. Install AWS CDK

다음 명령어를 통해 AWS CDK CLI를 설치할 수 있다.

```
$ npm install -g aws-cdk

changed 1 package in 798ms
```

설치가 정상적으로 완료되었는지 아래 명령어를 통해 확인할 수 있다.

```
$ cdk --version

2.1000.2 (build bc82193)
```

`cdk init` 명령어로 프로젝트를 초기화 할 수 있다.

```
$ cdk init app --language typescript

Applying project template app for typescript
# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

Initializing a new git repository...
Executing npm install...
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
✅ All done!
```

AWS CDK CLI는 다음과 같은 명령어를 제공한다.

- cdk synth - CloudFormation 템플릿 생성
- cdk bootstrap - CDK를 사용할 수 있도록 AWS 환경을 설정
- cdk deploy - AWS에 배포
- cdk destroy - 배포된 스택 삭제
- cdk diff - 변경 사항 비교

다음과 같은 초기 프로젝트가 구성된다.

- bin - CDK 앱의 진입점(엔트리 포인트)
- lib - CDK 스택 및 AWS 리소스 정의
- test - CDK 애플리케이션 테스트 코드
- cdk.json - CDK 설정 파일
- package.json - 프로젝트 의존성 및 스크립트 관리
- tsconfig.json - TypeScript 설정 파일

```
.
├── README.md
├── bin
│   └── action-in-blog.ts
├── cdk.json
├── jest.config.js
├── lib
│   └── action-in-blog-stack.ts
├── package-lock.json
├── package.json
├── test
│   └── action-in-blog.test.ts
└── tsconfig.json
```

## 3. AWS CDK structure

CDK는 다음 요소들을 조합하여 인프라를 구축한다.

- 컨스트럭트(construct) - 인프라의 구성 요소이다. 하나 이상의 AWS 리소스를 나타낸다. 여러 개의 컨스트럭트를 조합해서 복잡한 스택을 구성할 수 있다. S3 버킷(bucket), 람다(lambda), VPC 등을 예로 들 수 있다.
- 스택(stack) - CDK 애플리케이션의 배포 단위이다. 하나 이상의 스택을 생성하고, 각 스택에는 여러 개의 AWS 리소스가 포함된다.
- 앱(app) - CDK 애플리케이션 전체를 의미한다. 여러 개의 스택이 포함된다.

위 요소들은 계층 구조를 갖는다. 최상위는 앱으로 내부에 여러 개의 스택을 갖을 수 있다. 스택은 AWS CloudFormation의 스택과 1:1로 매핑된다. 하나의 스택에 여러 개의 컨스트럭트가 포함된다. 컨스트럭트는 AWS 리소스와 매핑된다. CDK 라이브러리로 작성한 코드는 아래 과정을 통해 AWS 클라우드에 실제 리소스로 배포된다.

1. CDK 라이브러리를 사용해 코드를 작성한다.
2. 앱, 스택, 컨스트럭트의 계층 구조는 `cdk synth` 명령어를 통해 CloudFormation 템플릿으로 변환된다. CDK 코드가 CloudFormation에서 사용하는 yaml(혹은 json) 형식의 파일로 변환되는 것을 의미한다. CloudFormation 템플릿은 cdk.out 디렉토리에 저장된다. 
3. 생성된 템플릿을 CloudFormation에 배포하면 필요한 AWS 리소스들이 생성된다.

<div align="center">
  <img src="/images/posts/2025/aws-cloud-development-kit-01.png" width="80%" class="image__border">
</div>
<center>https://docs.aws.amazon.com/cdk/v2/guide/home.html</center>

<br/>

CDK 컨스트럭트도 추상화 수준에 따라 세 가지 레벨로 구분된다. 

- L1 컨스트럭트(Cfn 리소스) - CFN 리소스라고 부르기도 한다. AWS CloudFormation의 리소스를 직접 다룰 때 사용한다. AWS CloudFormation에 익숙하고 AWS 리소스 속성 정의를 완벽하게 제어할 때 사용하기 편하다.
- L2 컨스트럭트(큐레이팅) - 큐레이팅 컨스트럭트라고 부르기도 한다. AWS 리소스를 객체지향적으로 쉽게 다룰 수 있도록 추상화 한 상위 API 이다. L1 컨스트럭트와 마찬가지로 단일 AWS CloudFormation 리소스에 직접 매핑된다. 
- L3 컨스트럭트(패턴) - 패턴이라고 부르기도 한다. 자주 사용하는 아키텍처 패턴을 포함하는 고수준의 블록을 의미한다. 모범 사례 패턴을 기반으로 만들어지긴 하지만, 요구사항에 딱 맞는 케이스를 찾기 어려울 수 있다.

## 4. Examples

위 설명이 이해되지 않을 수 있으니 지금부터 예제 코드를 작성하면서 다시 살펴보자. 다음과 같은 인프라를 구축해본다.

- VPC
- Application Load Balancer(ALB)
- Listener and Target Group
- Security Groups
- EC2

<div align="center">
  <img src="/images/posts/2025/aws-cloud-development-kit-02.png" width="100%" class="image__border">
</div>

### 4.1. ActionInBlogStack

우선 CDK가 실행되는 시작점인 `bin/action-in-blog.ts` 파일을 살펴본다. 

1. 앱을 생성한다.
2. 스택을 생성한다.
  - 스택을 생성할 때 앱 객체를 스코프로 전달한다.
  - 스택 이름은 `action-in-blog-dev`으로 지정한다. 
  - 계정(account)은 로그인한 사용자의 12자리 숫자로 구성된 아이디이다. 
  - 지역(region)은 인프라를 구축할 지역이다.

```ts
#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ActionInBlogStack } from "../lib/action-in-blog-stack";
import * as dotenv from "dotenv";

dotenv.config();

const app = new cdk.App(); // 1

new ActionInBlogStack(app, "ActionInBlogStack", { // 2
  stackName: "action-in-blog-dev",
  env: {
    account: process.env.ACCOUNT,
    region: process.env.REGION,
  },
});
```

### 4.2. ActionInBlogStack

이제 본격적으로 필요한 인프라 구축을 정의한 스택 코드를 살펴본다. 여기서 사용된 대부분의 AWS 리소스 클래스의 생성자가 L2 수준의 추상화 된 API이다. 아래 예제 코드에서 CfnOutput 생성자만 L1 수준의 추상화 API이다. 우선 스택의 생성자 햠수를 살펴본다.

1. 각 리소스의 접두사(prefix)로 사용하기 위해 스택 이름을 변수에 담는다.
2. VPC를 구성한다.  
  - AZ 사이즈는 2개를 사용한다.
  - 기타 설정들은 모두 기본 값을 사용한다.
3. 시큐리티 그룹을 생성한다.
  - ALB를 위한 시큐리티 그룹과 EC2를 위한 시큐리티 그룹을 생성한다.
4. EC2 컨테이너를 생성한다.
5. ALB와 리스너를 생성한다.
6. 리스너 타겟 그룹에 EC2 컨테이너를 추가한다.
7. 작업 마지막에 ALB 리소스의 DNS 주소를 출력한다.

```ts
import * as cdk from "aws-cdk-lib";
import { CfnOutput, Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Peer, Port } from "aws-cdk-lib/aws-ec2";
import { ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { InstanceIdTarget } from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";
import { readFileSync } from "node:fs";

export class ActionInBlogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stackName = Stack.of(this).stackName; // 1

    const vpc = new cdk.aws_ec2.Vpc(this, `${stackName}-vpc`, { // 2
      vpcName: `${stackName}-vpc`,
      maxAzs: 2,
    });

    const { albSecurityGroup, ec2SecurityGroup } = this.createSecurityGroup( // 3
      stackName,
      vpc,
    );

    const ec2 = this.createEc2Instance(stackName, vpc, ec2SecurityGroup); // 4

    const { alb, listener } = this.createLoadBalancerAndListener( // 5
      stackName,
      vpc,
      albSecurityGroup,
    );

    listener.addTargets(`${stackName}-listener-tg`, { // 6
      targetGroupName: `${stackName}-listener-tg`,
      port: 80,
      targets: [new InstanceIdTarget(ec2.instanceId, 80)],
    });

    new CfnOutput(this, "output-alb-dns-name", { // 7
      value: alb.loadBalancerDnsName,
    });
  }

  ...
}
```

이제 각 함수를 자세히 들여다본다. 우선 시큐리티 그룹을 생성하는 함수를 살펴본다.

1. ALB를 위한 시큐리티 그룹을 생성한다.
  - 특정 IP 주소에서 80 포트로 접근하는 트래픽을 허용한다.
2. EC2 컨테이너를 위한 시큐리티 그룹을 생성한다.
  - VPC 내부에서 접근하는 모든 트래픽을 허용한다.

```ts
export class ActionInBlogStack extends cdk.Stack {

  ...

  createSecurityGroup(stackName: string, vpc: cdk.aws_ec2.Vpc) {
    const albSecurityGroup = new cdk.aws_ec2.SecurityGroup( // 1
      this,
      `${stackName}-alb-sg`,
      {
        vpc,
        securityGroupName: `${stackName}-alb-sg`,
        description: "Allow HTTP traffic to ALB",
      },
    );
    albSecurityGroup.addIngressRule(
      Peer.ipv4("1.12.123.456/32"),
      Port.tcp(80),
      "Allow HTTP traffic to ALB",
    );
    const ec2SecurityGroup = new cdk.aws_ec2.SecurityGroup( // 2
      this,
      `${stackName}-ec2-sg`,
      {
        vpc: vpc,
        securityGroupName: `${stackName}-ec2-sg`,
        description: "Allow all traffic in VPC to EC2",
      },
    );
    ec2SecurityGroup.addIngressRule(
      Peer.ipv4(vpc.vpcCidrBlock),
      Port.allTraffic(),
      "Allow all traffic in VPC to EC2",
    );
    return { albSecurityGroup, ec2SecurityGroup };
  }

  ...
}
```

이번엔 EC2 컨테이너를 생성하는 함수를 살펴본다.

1. EC2 컨테이너를 생성한다. 
  - 인스턴스 타입은 t2.micro를 사용한다.
  - 머신 이미지는 AWS 리눅스 2023 세대를 사용한다.
  - 위에서 생성한 시큐리티 그룹을 설정한다.
  - 해당 EC2는 프라이빗 서브넷에 배포한다.
2. EC2 컨테이너가 실행된 후 초기화를 위한 스크립트를 설정한다.

```ts
export class ActionInBlogStack extends cdk.Stack {

  ...

  createEc2Instance(
    stackName: string,
    vpc: cdk.aws_ec2.Vpc,
    securityGroup: cdk.aws_ec2.SecurityGroup,
  ) {
    const ec2 = new cdk.aws_ec2.Instance(this, `${stackName}-ec2`, { // 1
      vpc,
      instanceName: `${stackName}-ec2`,
      instanceType: new cdk.aws_ec2.InstanceType("t2.micro"), 
      machineImage: new cdk.aws_ec2.AmazonLinuxImage({
        generation: cdk.aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
      }),
      securityGroup: securityGroup,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
    });
    const userDataScript = readFileSync("./script/user-data.sh", "utf8"); // 2
    ec2.addUserData(userDataScript);
    return ec2;
  }

  ...
}
```

초기화 쉘 스크립트는 EC2 접근 가능 여부를 확인하기 위해 `httpd` 명령어를 준비하는 코드를 작성한다. 정상적으로 EC2 컨테이너가 실행되면 httpd 웹 서버가 실행된다. 트래픽이 정상적으로 EC2 컨테이너까지 전달되면 화면에서 `Welcome to Apache` 문장을 확인할 수 있다.

```sh
#!/bin/sh

sudo yum -y upgrade
sudo yum install -y httpd

sudo systemctl start httpd
sudo systemctl enable httpd

sudo echo "<h1>Welcome to Apache</h1>" > index.html
sudo mv index.html /var/www/html
```

마지막으로 ALB와 리스너를 생성하는 함수를 살펴보자. 

1. ALB를 생성한다.
  - 위에서 생성한 VPC, 시큐리티 그룹을 설정한다.
  - 인터넷에서 접근할 수 있도록 `internetFacing`을 `true`로 설정한다.
2. 리스너를 생성한다.
  - 80 포트에 대한 트래픽을 처리한다.

```ts
export class ActionInBlogStack extends cdk.Stack {

  ...

  createLoadBalancerAndListener(
    stackName: string,
    vpc: cdk.aws_ec2.Vpc,
    securityGroup: cdk.aws_ec2.SecurityGroup,
  ) {
    const alb = new ApplicationLoadBalancer(this, `${stackName}-alb`, {  // 1
      vpc,
      loadBalancerName: `${stackName}-alb`,
      internetFacing: true,
      securityGroup: securityGroup,
    });
    const listener = alb.addListener(`${stackName}-alb-listener`, { // 2
      port: 80,
      open: true,
    });
    return { alb, listener };
  }
}
```

## 5. Construct infrastructure

이제 CDK CLI를 통해 인프라를 구축한다. CDK CLI를 실행하기 위해선 AWS 자격 증명이 필요하다. 아래 커맨드를 통해 사용자 자격 증명을 터미널 세션에 준비한다.

```
$ export AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY_ID"
$ export AWS_SECRET_ACCESS_KEY="YOUR_SECRET_ACCESS_KEY"
$ export AWS_SESSION_TOKEN="YOUR_SESSION_TOKEN"
```

우선 `cdk bootstrap` 명령어를 실행한다. AWS CDK를 처음 사용할 때 필요한 인프라(S3, IAM, ECR 등)를 자동으로 생성하는 명령어다. CDK는 AWS 리소스를 배포할 때 CloudFormation을 사용한다. CloudFormation가 인프라를 구축하기 위해선 애셋(코드, 컨테이너 이미지 등)을 저장할 공간과 실행 권한이 필요하다. 이 명령어는 CDK가 정상적으로 동작할 수 있도록 사전 준비 작업을 수행한다.

```
$ cdk bootstrap

 ⏳  Bootstrapping environment aws://123412341234/ap-northeast-1...
Trusted accounts for deployment: (none)
Trusted accounts for lookup: (none)
Using default execution policy of 'arn:aws:iam::aws:policy/AdministratorAccess'. Pass '--cloudformation-execution-policies' to customize.
 ✅  Environment aws://123412341234/ap-northeast-1 bootstrapped (no changes).
```

최초 부트스트래핑을 수행하면 CloudFormation에 `CDKToolkit`이라는 스택이 생성된다. 부트스트래핑을 수행할 때 파워 유저(power user)는 권한이 충분하지 않지만, 이미 만들어진 CDKToolKit 스택이 있다면 파워 유저도 애플리케이션을 배포하기 위한 인프라 스택을 구축할 수 있다.

<div align="center">
  <img src="/images/posts/2025/aws-cloud-development-kit-03.png" width="100%" class="image__border">
</div>

<br/>

부트스트래핑이 완료되면 `cdk diff` 명령어를 통해 현재 인프라와 차이를 확인할 수 있다. 

```
$ cdk diff

Stack ActionInBlogStack (action-in-blog-dev)
IAM Statement Changes
┌───┬───────────────────────────────────────────────────────────────────────────────────────────────────────┬────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────────┬───────────┐
│   │ Resource                                                                                              │ Effect │ Action                                                                                                                       │ Principal                                                      │ Condition │
├───┼───────────────────────────────────────────────────────────────────────────────────────────────────────┼────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────┼───────────┤
│ + │ ${Custom::VpcRestrictDefaultSGCustomResourceProvider/Role.Arn}                                        │ Allow  │ sts:AssumeRole                                                                                                               │ Service:lambda.amazonaws.com                                   │           │
├───┼───────────────────────────────────────────────────────────────────────────────────────────────────────┼────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────┼───────────┤
│ + │ ${action-in-blog-dev-ec2/InstanceRole.Arn}                                                            │ Allow  │ sts:AssumeRole                                                                                                               │ Service:ec2.amazonaws.com                                      │           │
├───┼───────────────────────────────────────────────────────────────────────────────────────────────────────┼────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────┼───────────┤
│ + │ arn:aws:ec2:ap-northeast-1:123412341234:security-group/${action-in-blog-dev-vpc.DefaultSecurityGroup} │ Allow  │ ec2:AuthorizeSecurityGroupEgress                                                                                             │ AWS:${Custom::VpcRestrictDefaultSGCustomResourceProvider/Role} │           │
│   │                                                                                                       │        │ ec2:AuthorizeSecurityGroupIngress                                                                                            │                                                                │           │
│   │                                                                                                       │        │ ec2:RevokeSecurityGroupEgress                                                                                                │                                                                │           │
│   │                                                                                                       │        │ ec2:RevokeSecurityGroupIngress                                                                                               │                                                                │           │
└───┴───────────────────────────────────────────────────────────────────────────────────────────────────────┴────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────────────┴───────────┘
IAM Policy Changes
┌───┬────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────┐
│   │ Resource                                                   │ Managed Policy ARN                                                                           │
├───┼────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${Custom::VpcRestrictDefaultSGCustomResourceProvider/Role} │ {"Fn::Sub":"arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"} │
└───┴────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────┘
Security Group Changes
┌───┬──────────────────────────────────────┬─────┬────────────┬─────────────────────────────────────┐
│   │ Group                                │ Dir │ Protocol   │ Peer                                │
├───┼──────────────────────────────────────┼─────┼────────────┼─────────────────────────────────────┤
│ + │ ${action-in-blog-dev-alb-sg.GroupId} │ In  │ TCP 80     │ 1.12.123.456/32                    │
│ + │ ${action-in-blog-dev-alb-sg.GroupId} │ In  │ TCP 80     │ Everyone (IPv4)                     │
│ + │ ${action-in-blog-dev-alb-sg.GroupId} │ Out │ Everything │ Everyone (IPv4)                     │
├───┼──────────────────────────────────────┼─────┼────────────┼─────────────────────────────────────┤
│ + │ ${action-in-blog-dev-ec2-sg.GroupId} │ In  │ Everything │ ${action-in-blog-dev-vpc.CidrBlock} │
│ + │ ${action-in-blog-dev-ec2-sg.GroupId} │ Out │ Everything │ Everyone (IPv4)                     │
└───┴──────────────────────────────────────┴─────┴────────────┴─────────────────────────────────────┘
(NOTE: There may be security-related changes not in this list. See https://github.com/aws/aws-cdk/issues/1299)

Parameters
[+] Parameter SsmParameterValue:--aws--service--ami-amazon-linux-latest--al2023-ami-kernel-6.1-x86_64:C96584B6-F00A-464E-AD19-53AFF4B05118.Parameter SsmParameterValueawsserviceamiamazonlinuxlatestal2023amikernel61x8664C96584B6F00A464EAD1953AFF4B05118Parameter: {"Type":"AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>","Default":"/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"}
[+] Parameter BootstrapVersion BootstrapVersion: {"Type":"AWS::SSM::Parameter::Value<String>","Default":"/cdk-bootstrap/hnb659fds/version","Description":"Version of the CDK Bootstrap resources in this environment, automatically retrieved from SSM Parameter Store. [cdk:skip]"}

Resources
[+] AWS::EC2::VPC action-in-blog-dev-vpc actioninblogdevvpcE8884537
[+] AWS::EC2::Subnet action-in-blog-dev-vpc/PublicSubnet1/Subnet actioninblogdevvpcPublicSubnet1Subnet99D02C1D

... 

[+] AWS::ElasticLoadBalancingV2::TargetGroup action-in-blog-dev-alb/action-in-blog-dev-alb-listener/action-in-blog-dev-listener-tgGroup actioninblogdevalbactioninblogdevalblisteneractioninblogdevlistenertgGroup0832AA79

Outputs
[+] Output output-alb-dns-name outputalbdnsname: {"Value":{"Fn::GetAtt":["actioninblogdevalb6654A447","DNSName"]}}


✨  Number of stacks with differences: 1
```

`cdk deploy` 명령어를 통해 인프라를 구축한다.

```
$ cdk deploy 

✨  Synthesis time: 1.93s

action-in-blog-dev: start: Building cae8f4eb340d78970557ab9fa02671949560c6fbd0c60177a44002ebd9e5029c:123412341234-ap-northeast-1
action-in-blog-dev: success: Built cae8f4eb340d78970557ab9fa02671949560c6fbd0c60177a44002ebd9e5029c:123412341234-ap-northeast-1
action-in-blog-dev: start: Publishing cae8f4eb340d78970557ab9fa02671949560c6fbd0c60177a44002ebd9e5029c:123412341234-ap-northeast-1
action-in-blog-dev: success: Published cae8f4eb340d78970557ab9fa02671949560c6fbd0c60177a44002ebd9e5029c:123412341234-ap-northeast-1
Stack undefined
This deployment will make potentially sensitive changes according to your current security approval level (--require-approval broadening).
Please confirm you intend to make the following modifications:

IAM Statement Changes
┌───┬───────────────────────────────────────────────────────────────────────────────────────────────────────┬────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────────┬───────────┐
│   │ Resource                                                                                              │ Effect │ Action                                                                                                                       │ Principal                                                      │ Condition │
├───┼───────────────────────────────────────────────────────────────────────────────────────────────────────┼────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────┼───────────┤
│ + │ ${Custom::VpcRestrictDefaultSGCustomResourceProvider/Role.Arn}                                        │ Allow  │ sts:AssumeRole                                                                                                               │ Service:lambda.amazonaws.com                                   │           │
├───┼───────────────────────────────────────────────────────────────────────────────────────────────────────┼────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────┼───────────┤
│ + │ ${action-in-blog-dev-ec2/InstanceRole.Arn}                                                            │ Allow  │ sts:AssumeRole                                                                                                               │ Service:ec2.amazonaws.com                                      │           │
├───┼───────────────────────────────────────────────────────────────────────────────────────────────────────┼────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────┼───────────┤
│ + │ arn:aws:ec2:ap-northeast-1:123412341234:security-group/${action-in-blog-dev-vpc.DefaultSecurityGroup} │ Allow  │ ec2:AuthorizeSecurityGroupEgress                                                                                             │ AWS:${Custom::VpcRestrictDefaultSGCustomResourceProvider/Role} │           │
│   │                                                                                                       │        │ ec2:AuthorizeSecurityGroupIngress                                                                                            │                                                                │           │
│   │                                                                                                       │        │ ec2:RevokeSecurityGroupEgress                                                                                                │                                                                │           │
│   │                                                                                                       │        │ ec2:RevokeSecurityGroupIngress                                                                                               │                                                                │           │
└───┴───────────────────────────────────────────────────────────────────────────────────────────────────────┴────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────────────┴───────────┘
IAM Policy Changes
┌───┬────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────┐
│   │ Resource                                                   │ Managed Policy ARN                                                                           │
├───┼────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${Custom::VpcRestrictDefaultSGCustomResourceProvider/Role} │ {"Fn::Sub":"arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"} │
└───┴────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────┘
Security Group Changes
┌───┬──────────────────────────────────────┬─────┬────────────┬─────────────────────────────────────┐
│   │ Group                                │ Dir │ Protocol   │ Peer                                │
├───┼──────────────────────────────────────┼─────┼────────────┼─────────────────────────────────────┤
│ + │ ${action-in-blog-dev-alb-sg.GroupId} │ In  │ TCP 80     │ 1.12.123.456/32                    │
│ + │ ${action-in-blog-dev-alb-sg.GroupId} │ In  │ TCP 80     │ Everyone (IPv4)                     │
│ + │ ${action-in-blog-dev-alb-sg.GroupId} │ Out │ Everything │ Everyone (IPv4)                     │
├───┼──────────────────────────────────────┼─────┼────────────┼─────────────────────────────────────┤
│ + │ ${action-in-blog-dev-ec2-sg.GroupId} │ In  │ Everything │ ${action-in-blog-dev-vpc.CidrBlock} │
│ + │ ${action-in-blog-dev-ec2-sg.GroupId} │ Out │ Everything │ Everyone (IPv4)                     │
└───┴──────────────────────────────────────┴─────┴────────────┴─────────────────────────────────────┘
(NOTE: There may be security-related changes not in this list. See https://github.com/aws/aws-cdk/issues/1299)

Do you wish to deploy these changes (y/n)? y
ActionInBlogStack (action-in-blog-dev): deploying... [1/1]
action-in-blog-dev: creating CloudFormation changeset...
action-in-blog-dev |  0/36 | 5:38:24 PM | REVIEW_IN_PROGRESS   | AWS::CloudFormation::Stack                | action-in-blog-dev User Initiated
action-in-blog-dev |  0/36 | 5:38:30 PM | CREATE_IN_PROGRESS   | AWS::CloudFormation::Stack                | action-in-blog-dev User Initiated

...

action-in-blog-dev | 35/36 | 5:42:13 PM | CREATE_COMPLETE      | AWS::ElasticLoadBalancingV2::Listener     | ActionInBlogStack/action-in-blog-dev-alb/action-in-blog-dev-alb-listener (actioninblogdevalbactioninblogdevalblistener805737F9) 
action-in-blog-dev | 36/36 | 5:42:15 PM | CREATE_COMPLETE      | AWS::CloudFormation::Stack                | action-in-blog-dev 

 ✅  ActionInBlogStack (action-in-blog-dev)

✨  Deployment time: 232.61s

Outputs:
ActionInBlogStack.outputalbdnsname = action-in-blog-dev-alb-1104337092.ap-northeast-1.elb.amazonaws.com
Stack ARN:
arn:aws:cloudformation:ap-northeast-1:123412341234:stack/action-in-blog-dev/6121b790-f0f8-11ef-be51-0e62c09ef109

✨  Total time: 234.54s
```

배포가 완료되면 CloudFormation에 현재 생성한 스택을 확인할 수 있다. 

<div align="center">
  <img src="/images/posts/2025/aws-cloud-development-kit-04.png" width="100%" class="image__border">
</div>

<br/>

브라우저에서 위 배포 결과에 출력된 ALB DNS 주소록 접속하면 `Welcome to Apache`라는 헤더를 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2025/aws-cloud-development-kit-05.png" width="100%" class="image__border">
</div>

<br/>

`cdk destroy` 명령어를 통해 배포한 리소스를 제거한다.

```
$ cdk destroy

Are you sure you want to delete: ActionInBlogStack (y/n)? y
ActionInBlogStack (action-in-blog-dev): destroying... [1/1]
action-in-blog-dev |   0 | 5:44:21 PM | DELETE_IN_PROGRESS   | AWS::CloudFormation::Stack                | action-in-blog-dev User Initiated
action-in-blog-dev |   0 | 5:44:23 PM | DELETE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation     | ActionInBlogStack/action-in-blog-dev-vpc/PrivateSubnet2/RouteTableAssociation (actioninblogdevvpcPrivateSubnet2RouteTableAssociationF5DBBDAF) 

...

action-in-blog-dev |  34 | 5:45:54 PM | DELETE_COMPLETE      | AWS::EC2::Subnet                          | ActionInBlogStack/action-in-blog-dev-vpc/PublicSubnet2/Subnet (actioninblogdevvpcPublicSubnet2Subnet166B4208) 
action-in-blog-dev |  34 | 5:45:54 PM | DELETE_IN_PROGRESS   | AWS::EC2::VPC                             | ActionInBlogStack/action-in-blog-dev-vpc (actioninblogdevvpcE8884537) 

 ✅  ActionInBlogStack (action-in-blog-dev): destroyed
```

## CLOSING

처음 사용해보면서 느낀 장점은 다음과 같다. 테라폼을 처음 접했을 때와 느낀 점과 크게 다르진 않은 것 같다.

- 타입스크립트로 구성되어 있어서 코드를 읽는 것만으로 현재 인프라 상황을 어느 정도 이해할 수 있었다. 구성 자체를 직관적으로 파악하기 쉬웠다.
- IDE(integrated development kit)의 이점을 얻을 수 있다. 라이브러리 함수를 열어보고 어떤 값들을 필요한지 사용할 수 있는지 확인할 수 있다. 함수 자동 완성 기능이 제안하는 후보들 중에 사용할 만한 함수가 있는지 확인하기 쉬웠다.

느낀 단점은 다음과 같다.

- AWS CloudFormation에 대한 이해도가 필요하다. 특히 코드로 리소스를 변경할 때 동일한 논리 ID(logical id)로 인해 발생하는 에러를 해결하기 위해 많은 시간이 걸렸다.
- 테라폼에 비해 작업이 완료되는데 걸리는 시간이 길다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-02-22-aws-cloud-development-kit>

#### REFERENCE

- <https://docs.aws.amazon.com/ko_kr/cdk/v2/guide/home.html>
- <https://devocean.sk.com/blog/techBoardDetail.do?ID=165749&boardType=techBlog>
- <https://www.daleseo.com/aws-cdk/>
- <https://docs.aws.amazon.com/cdk/v2/guide/environments.html>
- <https://stackoverflow.com/questions/71493397/let-ec2-which-is-made-cdk-exec-start-script-like-dockerfile>