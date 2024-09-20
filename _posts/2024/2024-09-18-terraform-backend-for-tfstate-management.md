---
title: "Terraform Backend for tfstate management"
search: false
category:
  - terraform
last_modified_at: 2024-09-18T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Deploy EC2 into Target Group in AWS with Terraform][deploy-ec2-into-target-group-in-aws-with-terraform-link]

## 0. 들어가면서

[이전 글][deploy-ec2-into-target-group-in-aws-with-terraform-link]에서 테라폼을 사용해 EC2 컨테이너를 구성하고 ALB 타겟 그룹(target group)에 연결하는 방법에 대해 정리했다. 이번 글에선 테라폼 상태 파일(tfstate file)을 관리하기 위한 백엔드(backend)라는 메커니즘에 대해 알아본다.

## 1. Problems of state file management

테라폼은 관리 중인 인프라와 설정에 대한 상태를 저장한다. 기본적으로 인프라 상태는 "terraform.tfstate"라는 이름의 파일에 저장되고 테라폼 프로젝트에 생성된다. 테라폼 상태 파일의 주요 목적은 원격 시스템의 객체와 구성에서 선언된 리소스 인스턴스 간의 바인딩(binding)을 저장하는 것이다. 변경 사항을 반영하기 전에 실제 인프라 상태와 비교하여 어떤 변경이 있을지 판단하기 위해 terraform.tfstate 파일을 사용한다. 

이 테라폼 상태 파일을 관리하는 것은 다음과 같은 이유 때문에 까다롭다. 

- 테라폼 상태 파일에 민감한 시크릿(secret)이 포함되기 때문에 깃(git) 같은 형상 관리하는 것은 권장되지 않는다.
- 테라폼을 사용해 인프라를 변경할 때 반드시 최신화 된 테라폼 상태 파일을 사용해야 한다.
- 여러 명이 동시에 인프라를 변경한다면 서로 다른 테라폼 상태가 만들어질 수 있다.

## 2. Terraform Backend in AWS

이런 문제를 해결하기 위해 테라폼은 백엔드(backend)라는 컴포넌트를 제공한다. 클라우드 제공자(cloud provider)마다 백엔드 구성 방법이 다르지만, 이 글에선 AWS를 기준으로 설명한다. 백엔드를 사용하면 테라폼 상태 파일을 원격에 저장하고 가져올 수 있다. 이를 통해 여러 개발자들이 동일한 상태 파일을 사용하는 것이 가능하다. 

여러 명이 동시에 상태 파일을 사용할 때 인프라 구성 충돌에 대한 문제는 락(lock)을 사용한다. AWS는 DynamoDB를 사용해 상태 파일에 대한 접근을 제한한다. 특정 아이템에 먼저 락을 점유한 사용자만 인프라 변경 사항을 반영할 수 있다.

1. 개발자A가 `terraform apply` 명령어를 실행한다.
    - DynamoDB 특정 아이템에 락킹을 수행한다.
    - 인프라 변경 사항을 AWS 클라우드에 반영한다.
    - 변경된 내용에 대한 tfstate 파일이 S3에 저장된다.
    - DynamoDB 특정 아이템에 락킹을 해제한다.
2. 개발자B가 `terraform apply` 명령어를 동시에 실행한다.
    - DynamoDB 특정 아이템에 락킹을 수행한다.
    - 해당 아이템에 락이 걸려 있기 때문에 인프라 변경에 실패한다.

<div align="center">
  <img src="/images/posts/2024/terraform-backend-for-tfstate-management-01.png" width="80%" class="image__border">
</div>

## 3. Project structure

프로젝트 구성은 다음과 같다. 이전 글을 기준으로 다음 자원이 추가된다.

- backend.tf

```
.
├── backend.tf
├── ec2.tf
├── gateway.tf
├── load-balancer.tf
├── provider.tf
├── route-table.tf
├── security-group.tf
├── subnet.tf
├── terraform.tfvars
├── variable.tf
└── vpc.tf
```

## 4. Create Backend

테라폼 백엔드를 구성하기 전에 `backend.tf` 파일에 S3 버킷과 DynamoDB를 먼저 구성한다. 상태 파일에 대한 암호화(encryption)도 가능하지만, 이번 글에서 다루지 않는다.

- tfstate 파일을 저장할 S3 버킷을 생성한다.
- 파일 버전 관리를 수행한다.

```tf
resource "aws_s3_bucket" "state" {
  bucket = "${var.project_name}-tfstate-bucket"
}

resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.state.id

  versioning_configuration {
    status = "Enabled"
  }
}
```

DynamoDB를 생성한다. 

- LockID 이름을 갖는 파티션 키(partition key)를 하나 생성한다.

```tf
resource "aws_dynamodb_table" "terraform_state_lock" {
  name         = "${var.project_name}-terraform-lock"
  hash_key     = "LockID"
  billing_mode = "PAY_PER_REQUEST"

  attribute {
    name = "LockID"
    type = "S"
  }
}
```

테라폼 백엔드를 위해 구성한 리소스를 먼저 생성한다.

```
$ terraform apply

Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

...


Apply complete! Resources: 24 added, 0 changed, 0 destroyed.

Outputs:

alb-dns = "tf-lb-20240918153002055100000004-925426991.us-east-1.elb.amazonaws.com"
```

S3 버킷과 DynamoDB 테이블을 모두 생성했다면 동일한 `backend.tf` 파일에 테라폼 백엔드를 구성한다.

- 버킷
  - 위에서 생성한 버킷을 지정한다.
- DynamoDB 테이블
  - 위에서 생성한 DynamoDB 테이블을 지정한다.
- 키
  - 테라폼 상태 파일 이름을 지정한다.
- 지역
  - us-east-1 지역을 선택한다.

```tf
terraform {
  backend "s3" {
    bucket         = "junhyunny-demo-tfstate-bucket"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "junhyunny-demo-terraform-lock"
  }
}
```

백엔드 구성에 대한 내용을 작성했다면 다시 초기화(terraform init)가 필요하다. 초기화 없이 명령어를 사용하면 다음과 같은 에러를 만난다.

```
$ terraform apply
╷
│ Error: Backend initialization required, please run "terraform init"
│ 
│ Reason: Initial configuration of the requested backend "s3"
│ 
│ The "backend" is the interface that Terraform uses to store state,
│ perform operations, etc. If this message is showing up, it means that the
│ Terraform configuration you're using is using a custom configuration for
│ the Terraform backend.
│ 
│ Changes to backend configurations require reinitialization. This allows
│ Terraform to set up the new configuration, copy existing state, etc. Please run
│ "terraform init" with either the "-reconfigure" or "-migrate-state" flags to
│ use the current configuration.
│ 
│ If the change reason above is incorrect, please verify your configuration
│ hasn't changed and try again. At this point, no changes to your existing
│ configuration or state have been made.
╵
```

테라폼 초기화를 수행한다. 

```
$ terraform init
Initializing the backend...
Do you want to copy existing state to the new backend?
  Pre-existing state was found while migrating the previous "local" backend to the
  newly configured "s3" backend. No existing state was found in the newly
  configured "s3" backend. Do you want to copy this state to the new "s3"
  backend? Enter "yes" to copy and "no" to start with an empty state.

  Enter a value: yes


Successfully configured the backend "s3"! Terraform will automatically
use this backend unless the backend configuration changes.
Initializing provider plugins...
- Reusing previous version of hashicorp/aws from the dependency lock file
- Using previously-installed hashicorp/aws v5.66.0

Terraform has been successfully initialized!

You may now begin working with Terraform. Try running "terraform plan" to see
any changes that are required for your infrastructure. All Terraform commands
should now work.

If you ever set or change modules or backend configuration for Terraform,
rerun this command to reinitialize your working directory. If you forget, other
commands will detect it and remind you to do so if necessary.
```

백엔드가 구성되었다면 버킷에 업로드 된 파일을 확인할 수 있다. 

<div align="center">
  <img src="/images/posts/2024/terraform-backend-for-tfstate-management-02.png" width="100%" class="image__border">
</div>

<br/>

백엔드 구성이 완료되었다면 프로젝트 경로에 테라폼 상태 파일이 필요 없으니 삭제한다. terraform apply 명령어를 수행하면 상태 파일에 대한 락, 언락(unlock)을 수행한다는 로그를 확인할 수 있다. 

```
$ terraform apply
Acquiring state lock. This may take a few moments...

...

Releasing state lock. This may take a few moments...
```

터미널 세션을 두 개 열고 각 터미널에서 terraform apply 명령어를 수행하면 늦게 실행한 터미널에서 아래와 같은 에러 메시지를 볼 수 있다.

```
$ terraform apply

Acquiring state lock. This may take a few moments...
╷
│ Error: Error acquiring the state lock
│ 
│ Error message: operation error DynamoDB: PutItem, https response error StatusCode: 400, RequestID: FQLJIU8SHUE4E1DO3PIPTT18UNVV4KQNSO5AEMVJF66Q9ASUAAJG, ConditionalCheckFailedException: The
│ conditional request failed
│ Lock Info:
│   ID:        7c6b45bd-2239-aebb-cae1-eb8f9e1777be
│   Path:      junhyunny-demo-tfstate-bucket/terraform.tfstate
│   Operation: OperationTypeApply
│   Who:       junhyunkang@1234567890
│   Version:   1.9.5
│   Created:   2024-09-18 15:43:23.049912 +0000 UTC
│   Info:      
│ 
│ 
│ Terraform acquires a state lock to protect the state from being written
│ by multiple users at the same time. Please resolve the issue above and try
│ again. For most commands, you can disable locking with the "-lock=false"
│ flag, but this is not recommended.
╵
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-09-18-terraform-backend-for-tfstate-management>

#### REFERENCE

- <https://developer.hashicorp.com/terraform/language/state>
- <https://blog.outsider.ne.kr/1290>
- <https://terraform101.inflearn.devopsart.dev/advanced/backend/>
- <https://creboring.net/blog/terraform-how-dynamodb-lock-state-file/>
- <https://dev.classmethod.jp/articles/s3-remotely-manage-terraform-tfstate-files-using-dynamodb/>

[deploy-ec2-into-target-group-in-aws-with-terraform-link]: https://junhyunny.github.io/terraform/deploy-ec2-into-target-group-in-aws-with-terraform/