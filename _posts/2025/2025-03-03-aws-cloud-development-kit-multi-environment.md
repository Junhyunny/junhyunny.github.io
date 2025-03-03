---
title: "AWS CDK 다중 환경(multi environment) 배포"
search: false
category:
  - aws
last_modified_at: 2025-03-03T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [AWS CDK(Cloud Development Kit) 개념과 예제][aws-cloud-development-kit-link]

## 0. 들어가면서

[지난 글][aws-cloud-development-kit-link]에서 AWS CDK를 사용해 인프라를 구축하는 방법에 대해 정리했다. 인프라는 보통 개발과 운영 환경을 분리하여 구축하기 때문에 이번 글에선 CDK에서 환경 별로 인프라를 다르게 구축하는 방법에 대해 작성했다. 이 글에선 구체적인 유즈케이스(use case)를 다루진 않지만, 예제를 본다면 구축 요령에 대한 감을 잡을 수 있을 것이다.


## 1. AWS CDK context

다중 환경 구축에 대한 것들을 찾아보면 CDK 컨텍스트(context)를 사용하라는 글들을 볼 수 있다. CDK 컨텍스트는 무엇일까?

> 컨텍스트 값은 앱(app), 스택(stack) 또는 구성(construct)과 연결할 수 있는 키-값 페어입니다. 파일(일반적으로 프로젝트 디렉터리의 cdk.json 또는 cdk.context.json) 또는 명령줄에서 앱에 제공될 수 있습니다.

조금 더 쉽게 설명하면 CDK로 인프라를 구축할 때 사용되는 키-값 페어 정보다. 정보는 cdk.json 또는 cdk.context.json 파일에 저장된다. CLI를 통해 필요한 값을 주입할 수도 있다. AWS 공식 문서에서 말하는 cdk.json와 cdk.context.json 둘은 서로 각각 용도가 다르다. 우선 cdk.json에 대해 알아보자.

- CDK 프로젝트가 생성될 때 자동으로 생성된다.
- CDK 애플리케이션의 설정 파일로 CDK 프로젝트의 전반적인 설정을 정의한다. 
- 리전(region), 환경 등을 정의한다.
- `cdk deploy`, `cdk synth` 같은 명령어가 실행될 때 읽어서 사용한다.

파일엔 다음과 같은 데이터가 저장된다.

```json
{
  "context": {
    "envs": {
      "dev": {
        "account": "111111111111",
        "region": "us-east-1",
        "instanceType": "t3.micro"
      },
      "prod": {
        "account": "222222222222",
        "region": "us-west-2",
        "instanceType": "m5.large"
      }
    }
  }
}
```

cdk.context.json의 용도는 다음과 같다.

- `cdk synth`, `cdk deploy`, `cdk bootstrap` 등의 명령어를 실행할 때 생성된다.
- CDK를 통해 구축한 인프라 정보가 내부에 저장되어, 캐시 용도로 사용한다.
- AWS 인프라의 비결정적(non-deterministic) 리소스 문제를 해결하고 결정적(deterministic) 배포를 하기 위해 사용한다.

파일엔 다음과 같은 데이터가 저장된다.

```json
{
  "availability-zones:account=123456789012:region=us-east-1": [
    "us-east-1a",
    "us-east-1b",
    "us-east-1c"
  ],
  "vpc-provider:account=123456789012:region=us-east-1:vpcId=vpc-0abcd1234": {
    "vpcId": "vpc-0abcd1234",
    "subnetGroups": [
      {
        "name": "Public",
        "subnets": [
          { "subnetId": "subnet-0a1b2c3d", "availabilityZone": "us-east-1a" },
          { "subnetId": "subnet-0e4f5g6h", "availabilityZone": "us-east-1b" }
        ]
      }
    ]
  }
}
```

이번 글의 주제와 크게 상관은 없지만, 나처럼 궁금한 사람을 위해 cdk.context.json를 사용한 결정적 배포에 대해 잠깐 짚고 넘어가보자. AWS 비결정적 리소스란 실행할 때마다 다른 결과를 생성하는 가능성이 있는 리소스를 의미한다. 동일한 CDK 코드를 실행하더라도 다른 결과를 나오기 때문에 문제가 된다. 예를 들어 최신 AMI 사용하는 다음과 같은 CDK 코드가 있다.

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class MyStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 최신 Amazon Linux 2 AMI 자동 검색 (비결정적 동작)
    const ami = ec2.MachineImage.latestAmazonLinux();

    new ec2.Instance(this, 'MyInstance', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ami
    });
  }
}
```

지금 이 코드를 실행하면 오늘의 최신 EC2 이미지를 사용하지만, 몇 주 뒤라도 새로운 이미지가 나온다면 그 이후 실행되는 결과는 다르게 된다. 이런 문제를 해결하기 위해 AMI를 하드코딩해서 문제를 해결할 수도 있지만, 정보가 캐싱된 cdk.context.json을 사용할 수도 있다. lookup 함수를 사용하면 cdk.context.json에 캐싱된 값을 사용한다. 값이 없다면 조회 후 이를 캐싱하여 사용한다.

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class MyStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // lookup을 통한 검색 후 검색된 결과를 cdk.context.json에 저장 후 계속 사용
    const cacheAmi = cdk.aws_ec2.MachineImage.lookup({
      name: "al2023-ami-*-x86_64",
      owners: ["amazon"],
    });

    new ec2.Instance(this, 'MyInstance', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: cacheAmi
    });
  }
}
```

캐싱처럼 우선 컨텍스트에 저장된 값을 사용하지만, 없다면 AWS 클라우드에 필요한 정보를 조회 후 컨텍스트에 저장하여 사용한다.

<div align="center">
  <img src="/images/posts/2025/aws-cloud-development-kit-multi-environment-01.png" width="80%" class="image__border">
</div>
<center>https://quicktechbytes.com/aws-cdk-context-cache-feature-flags-and-configuration-20378d1641ad</center>

<br/>

cdk.context.json 파일은 CDK CLI를 통해 자동으로 변경되기 때문에 개발자가 직접 수정하는 것은 위험하다. 그렇기 때문에 다중 환경을 제어하기 위해선 cdk.json 파일을 사용한다. 프로젝트 설정과 CDK 결정적 동작을 위해 cdk.json, cdk.context.json 파일 모두 코드 저장소에 커밋(commit)하여 관리해야 한다. 코드 저장소에서 관리하기 때문에 민감한 정보나 환경 변수는 `SSM Parameter Store`를 사용한다.

## 2. Example

두 파일의 서로 다른 용도에 대해 살펴봤다. 다중 환경으로 분리하기 위해선 `cdk.context.json` 보단 `cdk.json` 파일이 적합하다는 사실을 알았다. 이제 cdk.json 파일에 다중 환경 정보를 구성해보자. 코드는 [이전 글][aws-cloud-development-kit-link]을 일부 변경한다.

- 환경마다 다르게 가져갈 값들을 지정한다. 나는 각 리소스 타입을 먼저 구분하고 개발과 운영 환경에 필요한 값들을 지정했다. 가독성이 편한대로 구성하길 바란다.
- 환경 정보, 스택 이름, EC2 인스턴스 타입을 다르게 지정한다.

```json
{
  ...

  "context": {
    "environments": {
      "dev": {
        "account": "123456789012",
        "region": "ap-northeast-1"
      },
      "prod": {
        "account": "987654321098",
        "region": "ap-northeast-1"
      }
    },
    "stackNames": {
      "dev": "action-in-blog-dev",
      "prod": "action-in-blog-prod"
    },
    "ec2Instances": {
      "dev": {
        "instanceType": "t2.micro"
      },
      "prod": {
        "instanceType": "t2.small"
      }
    },

    ...
  
  }
}
```

다중 환경 정보를 구성했으니 코드를 변경한다. 우선 CDK 진입점인 `bin/action-in-blog.ts`를 다음과 같이 작성한다. 설명은 주석을 참고하길 바란다. 

```ts
#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ActionInBlogStack } from "../lib/action-in-blog-stack";

const app = new cdk.App();

// cdk.json 파일에 위치한 환경 정보, 스택 이름 정보 객체를 조회한다.
const environments = app.node.tryGetContext("environments");
const stackNames = app.node.tryGetContext("stackNames");

// CLI 명령어를 통해 주입받은 컨텍스트 값을 사용한다.
const selectedEnv = app.node.tryGetContext("env") || "dev";

// 선택한 환경 설정을 사용한다.
const selectedEnvConfig = environments[selectedEnv];

new ActionInBlogStack(app, "ActionInBlogStack", {
  stackName: stackNames[selectedEnv],
  env: {
    account: selectedEnvConfig["account"],
    region: selectedEnvConfig["region"],
  },
});
```

EC2 인스턴스 타입을 환경마다 다르게 변경하기 위해 `lib/action-in-blog-stack.ts` 코드를 아래와 같이 작성한다.

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

    const stackName = Stack.of(this).stackName;

    ...

    const ec2 = this.createEc2Instance(stackName, vpc, ec2SecurityGroup);

    ...
  }

  createSecurityGroup(stackName: string, vpc: cdk.aws_ec2.Vpc) {
    ...
  }

  createEc2Instance(
    stackName: string,
    vpc: cdk.aws_ec2.Vpc,
    securityGroup: cdk.aws_ec2.SecurityGroup,
  ) {
    // cdk.json 파일에 위치한 환경 정보, 스택 이름 정보 객체를 조회한다.
    const ec2Configs = this.node.tryGetContext("ec2Instances");

    // CLI 명령어를 통해 주입받은 컨텍스트 값을 사용한다.
    const selectedEnv = this.node.tryGetContext("env") || "dev";

    // 선택한 EC2 인스턴스 설정을 사용한다.
    const selectedEc2Config = ec2Configs[selectedEnv];

    const cacheAmi = cdk.aws_ec2.MachineImage.lookup({
      name: "al2023-ami-*-x86_64",
      owners: ["amazon"],
    });
    const ec2 = new cdk.aws_ec2.Instance(this, `${stackName}-ec2`, {
      vpc,
      instanceName: `${stackName}-ec2`,
      instanceType: new cdk.aws_ec2.InstanceType(selectedEc2Config["instanceType"]),
      machineImage: cacheAmi,
      securityGroup: securityGroup,
      vpcSubnets: {
        subnets: vpc.privateSubnets,
      },
    });
    const userDataScript = readFileSync("./script/user-data.sh", "utf8");
    ec2.addUserData(userDataScript);
    return ec2;
  }

  createLoadBalancerAndListener(
    stackName: string,
    vpc: cdk.aws_ec2.Vpc,
    securityGroup: cdk.aws_ec2.SecurityGroup,
  ) {
    ...
  }
}
```

코드를 모두 변경했으면 인프라를 배포해보자. CLI로 `cdk deploy` 명령어를 실행할 때 컨텍스트 정보를 함께 전달한다. 명령어를 통해 전달한 컨텍스트 정보는 위 코드에서 봤듯이 `app.node.tryGetContext("env")` 라인을 통해 얻을 수 있다. 개발 환경에 배포할 땐 다음과 같은 명령어를 실행한다.

```
$ cdk deploy --context env=dev
```

운영 환경에선 다음과 같은 명령어를 실행한다.

```
$ cdk deploy --context env=prod
```

배포가 완료되면 다음과 같이 각 환경 별로 CloudFormation에 스택이 생성된 것을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2025/aws-cloud-development-kit-multi-environment-02.png" width="100%" class="image__border">
</div>

<br/>

EC2 대시보드를 보면 각 환경의 인스턴스 타입이 다르게 배포된 것을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2025/aws-cloud-development-kit-multi-environment-03.png" width="80%" class="image__border">
</div>

## 3. Considerations

CDK를 사용하면 개발, 운영 환경마다 서로 다른 계정(account)을 사용하는 편이 안정적으로 보인다. cdk.context.json 파일에 인프라 정보를 캐싱할 때 계정과 지역(region) 정보를 조합하기 때문이다. 즉, 개발과 운영 환경에서 동일한 계정을 사용하면 cdk.context.json 파일에 캐싱된 동일한 정보가 사용될 가능성이 있어 보인다. 의도치 않은 문제를 일으키진 않을지 걱정스럽다.

개발 환경과 운영 환경의 모습이 스펙뿐만 아니라 구성 자체가 완전히 다르다면 어떨까? 인프라 구성 자체가 다르기 때문에 위 상황처럼 동일한 CDK 코드 베이스에 스펙 값만 변경하는 방식이 코드를 복잡하게 만들 수 있다. 그런 경우라면 개발 스택과 운영 스택을 애초에 구분하여 배포하는 편이 더 쉬울 것 같다.

```ts
const app = new cdk.App();
const env = app.node.tryGetContext('env');

if (env === 'dev') {
  new MyDevStack(app, 'DevStack', { env: envDev });
} else if (env === 'prod') {
  new MyProdStack(app, 'ProdStack', { env: envProd });
}
```

## CLOSING

CDK 인프라 구축에 관련된 [모범 사례(best practice)](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html#best-practices-apps)를 보면 도움이 많이 된다. 위 예제는 매우 단순하기 때문에 모범 사례라고 제시하는 다음과 같은 것들을 고려하지 않았다.

- 한 애플리케이션을 단일 스택이 아닌 용도를 구분하여 여러 개의 작은 스택들로 구성한다.
- 스택 간의 종속성을 최소화하기 위해 SSM Parameter Store 같은 저장소를 사용한다.
- 다중 환경 배포 자동화를 위한 CodePipeline을 활용한다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-03-02-aws-cdk-multi-environment>

#### REFERENCE

- <https://docs.aws.amazon.com/cdk/v2/guide/context.html>
- <https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html#best-practices-apps>
- <https://blog.serverlessadvocate.com/serverless-aws-cdk-pipeline-best-practices-patterns-part-1-ab80962f109d>
- <https://quicktechbytes.com/aws-cdk-context-cache-feature-flags-and-configuration-20378d1641ad>
- <https://devocean.sk.com/blog/techBoardDetail.do?ID=165749&boardType=techBlog>

[aws-cloud-development-kit-link]: https://junhyunny.github.io/aws/cloud-development-kit/aws-cloud-development-kit/