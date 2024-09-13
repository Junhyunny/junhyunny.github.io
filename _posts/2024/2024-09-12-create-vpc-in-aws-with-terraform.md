---
title: "Create VPC in AWS with Terraform"
search: false
category:
  - terraform
last_modified_at: 2024-09-12T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Introduction Terraform][introduction-terraform-link]

## 0. 들어가면서

현재 프로젝트는 인프라 관리를 위해 테라폼(terraform)으로 하고 있다. 간단한 실습만 해봤지 실제 프로덕트 개발과 함께 사용해 본 것은 이번이 처음이다. VPC 구성부터 하나씩 작업했던 내용을 블로그에 정리해본다. 

## 1. Expected VPC in AWS

테라폼을 사용해 구성할 VPC는 다음과 같다.

- VPC CIDR 블록은 10.0.0.0/16 이다.
- VPC 내부 서브넷은 3개 존재한다.
  - 퍼블릭(public) 2개
  - 프라이빗(private) 1개
- 게이트웨이를 구성한다.
  - 외부 인터넷에서 VPC에 접근하기 위한 인터넷 게이트웨이
  - 프라이빗 서브넷에서 외부 인터넷에 접근하기 위한 NAT 게이트웨이

<div align="center">
  <img src="/images/posts/2024/create-vpc-in-aws-with-terraform-01.png" width="100%" class="image__border">
</div>

## 2. Project structure

프로젝트 구조는 다음과 같다.

```
.
├── gateway.tf
├── provider.tf
├── route-table.tf
├── subnet.tf
├── terraform.tfvars
├── variable.tf
└── vpc.tf
```

## 3. Initialize for cloud provider

클라우드 제공자(cloud provider) 정보를 `provider.tf` 파일에 정의한다.

```tf
provider "aws" {
  region = "us-east-1"
}
```

테라폼 init 명령어로 해당 클라우드 제공자를 위한 플러그인을 설치한다.

```
$ terraform init

Initializing the backend...
Initializing provider plugins...
- Finding latest version of hashicorp/aws...
- Installing hashicorp/aws v5.66.0...
- Installed hashicorp/aws v5.66.0 (signed by HashiCorp)
Terraform has created a lock file .terraform.lock.hcl to record the provider
selections it made above. Include this file in your version control repository
so that Terraform can guarantee to make the same selections by default when
you run "terraform init" in the future.

Terraform has been successfully initialized!

You may now begin working with Terraform. Try running "terraform plan" to see
any changes that are required for your infrastructure. All Terraform commands
should now work.

If you ever set or change modules or backend configuration for Terraform,
rerun this command to reinitialize your working directory. If you forget, other
commands will detect it and remind you to do so if necessary.
```

## 4. Variables

이번 테라폼 인프라 구성에서 자주 사용하는 값을 변수로 지정한다. `variables.tf` 파일에 변수 타입과 기본 값을 정의한다. 사용하는 변수는 다음과 같다.

```tf
variable "region" {
  default = "us-east-1"
  type    = string
}

variable "vpc_name" {
  default = "project-vpc"
  type    = string
}

variable "project_name" {
  default = "project"
  type    = string
}
```

`terraform.tfvars` 파일에 실제로 사용할 변수 값을 지정한다.

```tf
region   = "us-east-1"
vpc_name = "junhyunny-vpc"
project_name = "junhyunny-demo"
```

## 5. VPC

기본적인 VPC 구성을 `vpc.tf` 파일에 정의한다.

- VPC
  - CIDR 블록은 10.0.0.0/16 으로 지정한다.
  - VPC 이름은 지정한 변수를 사용한다.

```tf
resource "aws_vpc" "jun_vpc" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = var.vpc_name
  }
}
```

## 6. Subnets

다음과 같은 3개의 서브넷을 `subnet.tf` 파일에 정의한다. AZ(Availability Zone)과 서브넷 이름을 지정할 때 변수를 사용한다. 서브넷이 속할 VPC는 위에서 정의한 VPC 자원의 ID를 사용해 지정한다.

- 퍼블릭 서브넷 1(public_subnet_1)
  - CIDR 블록은 10.0.0.0/20 이다.
  - AZ 은 us-east-1a 이다.
- 프라이빗 서브넷 1(private_subnet_1)
  - CIDR 블록은 10.0.16.0/20 이다.
  - AZ 은 us-east-1a 이다.
  - 해당 서브넷에 인스턴스 배포시 퍼블릭 IP 부여를 비활성화 한다.
- 퍼블릭 서브넷 2(public_subnet_2)
  - CIDR 블록은 10.0.32.0/20 이다.
  - AZ 은 us-east-1b 이다.

```tf
resource "aws_subnet" "public_subnet_1" {
  vpc_id            = aws_vpc.junhyunny_vpc.id
  cidr_block        = "10.0.0.0/20"
  availability_zone = "${var.region}a"
  tags = {
    Name = "${var.vpc_name}-public-subnet-1"
  }
}

resource "aws_subnet" "private_subnet_1" {
  vpc_id                  = aws_vpc.junhyunny_vpc.id
  cidr_block              = "10.0.16.0/20"
  availability_zone       = "${var.region}a"
  map_public_ip_on_launch = false
  tags = {
    Name = "${var.vpc_name}-private-subnet-1"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id            = aws_vpc.junhyunny_vpc.id
  cidr_block        = "10.0.32.0/20"
  availability_zone = "${var.region}b"
  tags = {
    Name = "${var.vpc_name}-public-subnet-2"
  }
}
```

## 7. Gateways

게이트웨이는 인터넷 게이트웨이와 NAT 게이트웨이를 준비한다. 게이트웨이 설정은 `gateway.tf` 파일에 정의한다.

- 인터넷 게이트웨이
  - VPC를 지정할 때 위에서 정의한 VPC 리소스의 ID를 사용한다.
- EIP(Elastic IP)
  - NAT 게이트웨이 접근을 위해 필요한 EIP를 정의한다.
- NAT 게이트웨이
  - NAT 게이트웨이가 속할 서브넷은 위에서 정의한 퍼블릭 서브넷 중 하나로 지정한다. 
  - 퍼블릭 네트워크에 위치해야 외부 인터넷과 연결이 가능하다.

```tf
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.junhyunny_vpc.id
  tags = {
    Name = "${var.project_name}-igw"
  }
}

resource "aws_eip" "nat" {}

resource "aws_nat_gateway" "nat_gateway" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_subnet_1.id
  tags = {
    Name = "${var.project_name}-nat-gateway"
  }
}
```

## 8. Route Tables

`route-table.tf` 파일에 라우트 테이블을 구성한다. 

- 퍼블릭 서브넷 라우팅 테이블(rtb_public)
  - VPC CIDR 블록에 속한 목적지인 경우 로컬 게이트웨이를 사용한다.
  - 매칭되는 목적지가 없는 경우 인터넷 게이트웨이를 사용한다.
- 프라이빗 서브넷 라우팅 테이블(rtb_private)
  - VPC CIDR 블록에 속한 목적지인 경우 로컬 게이트웨이를 사용한다.
  - 매칭되는 목적지가 없는 경우 NAT 게이트웨이를 사용한다.

```tf
resource "aws_route_table" "rtb_public" {
  vpc_id = aws_vpc.junhyunny_vpc.id
  route {
    cidr_block = "10.0.0.0/16"
    gateway_id = "local"
  }
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = {
    Name = "${var.project_name}-rtb-public-1"
  }
}

resource "aws_route_table" "rtb_private" {
  vpc_id = aws_vpc.junhyunny_vpc.id
  route {
    cidr_block = "10.0.0.0/16"
    gateway_id = "local"
  }
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gateway.id
  }
  tags = {
    Name = "${var.project_name}-rtb-private-1"
  }
}
```

위에서 생성한 라우트 테이블을 각 서브넷에 연결한다. 동일한 파일 하단에 정의한다.

- 퍼블릭 서브넷 연결
  - 퍼블릭 서브넷 라우팅 테이블(rtb_public)에 퍼블릭 서브넷 두 개를 연결한다.
- 프라이빗 서브넷 연결
  - 프라이빗 서브넷 라우팅 테이블(rtb_private)에 프라이빗 서브넷 한 개를 연결한다.

```tf
resource "aws_route_table_association" "demo-routing-public" {
  count          = 2
  subnet_id = element([aws_subnet.public_subnet_1.id, aws_subnet.public_subnet_2.id], count.index)
  route_table_id = aws_route_table.rtb_public.id
}

resource "aws_route_table_association" "demo-routing-private-1" {
  subnet_id      = aws_subnet.private_subnet_1.id
  route_table_id = aws_route_table.rtb_private.id
}
```

## 9. Apply Terraform

위에서 코드로 정의한 인프라를 테라폼으로 적용한다. 필자는 파워 유저이기 때문에 웹 콘솔에서 획득한 클라이언트 정보를 터미널 세션에 준비해야 한다.

```
$ export AWS_ACCESS_KEY_ID=ABCDEFGHIJKLEMNOPQRSTUVWXYZ
$ export AWS_SECRET_ACCESS_KEY=ABCDEFGHIJKLEMNOPQRSTUVWXYZ/1234567890/BCDE
$ export AWS_SESSION_TOKEN=ABCDEFG ... 1234567890
```

`terraform apply` 명령어를 사용해 AWS 클라우드에 인프라 변경 사항을 적용한다.

```
$ terraform apply

Terraform used the selected providers to generate the following execution plan. Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # aws_eip.nat will be created
  + resource "aws_eip" "nat" {
      + allocation_id        = (known after apply)
      + arn                  = (known after apply)
      + association_id       = (known after apply)
      ...
    }

  ... 

  + resource "aws_vpc" "junhyunny_vpc" {
      + arn                                  = (known after apply)
      + cidr_block                           = "10.0.0.0/16"
      + default_network_acl_id               = (known after apply)
      + default_route_table_id               = (known after apply)
      ...
      + tags                                 = {
          + "Name" = "junhyunny-vpc"
        }
      + tags_all                             = {
          + "Name" = "junhyunny-vpc"
        }
    }

Plan: 12 to add, 0 to change, 0 to destroy.

Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes
```

테라폼 작업이 완료되면 웹 콘솔 VPC 리소스 맵에서 다음과 같은 VPC, 서브넷, 게이트웨이 그리고 라우트 테이블을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2024/create-vpc-in-aws-with-terraform-02.png" width="100%" class="image__border">
</div>

## CLOSING

다음은 테라폼을 통해 ALB(Application LoadBalancer), 타겟 그룹(target group)을 구성하는 방법에 대해 알아본다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-09-12-create-vpc-in-aws-with-terraform>

#### RECOMMEND NEXT POSTS

- [Create ALB and TargetGroup in AWS with Terraform][create-alb-and-target-group-in-aws-with-terraform-link]

#### REFERENCE

- <https://stackoverflow.com/a/56099677/14859847>
- <https://serverfault.com/a/854551>
- <https://inpa.tistory.com/entry/AWS-%F0%9F%93%9A-%ED%83%84%EB%A0%A5%EC%A0%81-IP-Elastic-IP-EIP-%EB%9E%80-%EB%AC%B4%EC%97%87%EC%9D%B8%EA%B0%80>

[introduction-terraform-link]: https://junhyunny.github.io/information/infrastructure/dev-ops/introduction-terraform/
[create-alb-and-target-group-in-aws-with-terraform-link]: https://junhyunny.github.io/terraform/create-alb-and-target-group-in-aws-with-terraform/