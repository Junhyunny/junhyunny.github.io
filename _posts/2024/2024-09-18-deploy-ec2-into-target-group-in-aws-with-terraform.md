---
title: "Deploy EC2 into Target Group in AWS with Terraform"
search: false
category:
  - terraform
last_modified_at: 2024-09-18T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Create ALB and TargetGroup in AWS with Terraform][create-alb-and-target-group-in-aws-with-terraform-link]

## 0. 들어가면서

[이전 글][create-alb-and-target-group-in-aws-with-terraform-link]에서 테라폼을 사용해 ALB, 타겟 그룹(target group)을 구성하는 방법에 대해 정리했다. 이번 글은 해당 타겟 그룹에 EC2 컨테이너를 배포하는 방법에 대해 정리했다. 

## 1. Expected Infra in AWS

테라폼을 사용해 배포할 EC2 컨테이너의 모습은 다음과 같다. 데이터베이스는 RDS가 아니라 EC2 컨테이너를 사용해 직접 배포했다.

- 웹 애플리케이션 EC2 컨테이너는 퍼블릭 서브넷(public subnet)에 배포한다.
- 데이터베이스 EC2 컨테이너는 프라이빗 서브넷(private subnet)에 배포한다.

<div align="center">
  <img src="/images/posts/2024/deploy-ec2-into-target-group-in-aws-with-terraform-01.png" width="100%" class="image__border">
</div>

## 2. Project structure

프로젝트 구성은 다음과 같다. 이전 글을 기준으로 다음 자원이 추가된다.

- ec2.tf

```
.
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

## 3. Security Groups

`security-group.tf`에 새로운 시큐리티 그룹을 생성한다. 애플리케이션 로드 밸런서에서 웹 애플리케이션으로 진행하는 인그레스(ingress) 트래픽에 대한 규칙이 필요하다. 다음과 같은 트래픽을 허용한다.

- TCP 프로토콜
- 8080 포트 
- VPC IP 대역

```tf
resource "aws_security_group" "junhyunny_alb_web_sg" {
  vpc_id      = aws_vpc.junhyunny_vpc.id
  name        = "${var.project_name}-alb-web-sg"
  description = "SG for ${var.project_name} from ALB to WEB EC2 Container"
  ingress {
    from_port = 8080
    to_port   = 8080
    protocol  = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
  egress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

웹 애플리케이션에서 데이터베이스로 진행하는 인그레스 트래픽에 대한 규칙도 지정한다. 

- TCP 프로토콜
- 5432 포트 
- VPC IP 대역

```tf
resource "aws_security_group" "junhyunny_web_database_sg" {
  vpc_id      = aws_vpc.junhyunny_vpc.id
  name        = "${var.project_name}-web-database-sg"
  description = "SG for ${var.project_name} from WEB EC2 Container to database"
  ingress {
    from_port = 5432
    to_port   = 5432
    protocol  = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
  egress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

## 4. EC2 Containers

`ec2.tf`에 웹 애플리케이션과 데이터베이스 배포를 위한 EC2 리소스를 정의한다. 먼저 웹 애플리케이션 컨테이너를 알아보자.

- AMI(Amazon Machine Images)
  - 아마존 리눅스 ami-066784287e358dad1 이미지를 사용한다.
  - 지역(region)마다 다르기 때문에 확인이 필요하다.
- 서브넷
  - 웹 애플리케이션 컨테이너는 퍼블릭 서브넷 1에 배포한다.
- 시큐리티 그룹
  - 위에서 생성한 ALB에서 웹 애플리케이션 EC2 컨테이너 사이 트래픽을 위한 시큐리티 그룹을 사용한다.
- 유저 데이터
  - EC2 컨테이너 인스턴스 구성이 완료되면 웹 애플리케이션 도커 컨테이너를 실행시키는 스크립트를 작성한다.
- 의존성
  - 데이터베이스 EC2 컨테이너의 구성이 완료된 후에 배포를 시작한다. 
  - 유저 데이터 스크립트 블럭에서 데이터베이스 EC2 컨테이너의 프라이빗 IP를 사용해 데이터베이스 URL을 지정한다.

```tf
resource "aws_instance" "web" {
  ami                         = "ami-066784287e358dad1"
  instance_type               = "t2.micro"
  subnet_id                   = aws_subnet.public_subnet_1.id
  associate_public_ip_address = true
  vpc_security_group_ids = [aws_security_group.junhyunny_alb_web_sg.id]
  depends_on = [aws_instance.database]
  user_data                   = <<-EOF
    #!/bin/bash
    set -ex
    sudo yum update -y
    sudo yum install docker -y
    sudo service docker start
    sudo usermod -a -G docker ec2-user
    docker run -p 8080:8080 -d\
      -e ACTIVE_PROFILE=aws\
      -e DATABASE_URL=jdbc:postgresql://${aws_instance.database.private_ip}:5432/postgres\
      -e DATABASE_DRIVER_CLASS=org.postgresql.Driver\
      -e DATABASE_USERNAME=postgres\
      -e DATABASE_PASSWORD=12345\
      --restart unless-stopped\
      opop3966/todo-list
  EOF
  tags = {
    Name = "${var.project_name}-web-application"
  }
}
```

이번엔 데이터베이스를 호스팅하는 EC2 컨테이너를 살펴보자.

- AMI
  - 위와 동일하게 아마존 리눅스 ami-066784287e358dad1 이미지를 사용한다.
- 서브넷
  - 웹 애플리케이션 컨테이너는 프라이빗 서브넷 1에 배포한다.
- 시큐리티 그룹
  - 위에서 생성한 웹 애플리케이션 EC2 컨테이너와 데이터베이스 EC2 컨테이너 사이 트래픽을 위한 시큐리티 그룹을 사용한다.
- 유저 데이터
  - EC2 컨테이너 인스턴스 구성이 완료되면 PostgreSQL 도커 컨테이너를 실행시키는 스크립트를 작성한다.

```tf
resource "aws_instance" "database" {
  ami           = "ami-066784287e358dad1"
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.private_subnet_1.id
  vpc_security_group_ids = [aws_security_group.junhyunny_web_database_sg.id]
  user_data     = <<-EOF
    #!/bin/bash
    set -ex
    sudo yum update -y
    sudo yum install docker -y
    sudo service docker start
    sudo usermod -a -G docker ec2-user
    docker run -p 5432:5432 -d -e POSTGRES_PASSWORD=12345 postgres
  EOF
  tags = {
    Name = "${var.project_name}-database"
  }
}
```

## 5. Target Group Attachment

웹 애플리케이션 EC2 컨테이너를 타겟 그룹에 추가한다. `load-balancer.tf`에 `aws_lb_target_group_attachment` 리소스를 추가한다.

- 타겟 그룹
  - 타겟 그룹의 ARN을 사용한다.
- 인스턴스
  - 타겟 그룹에 포함시킬 EC2 컨테이너 ID를 사용해 지정한다.
- 의존성
  - ALB 리스너 규칙이 생성된 후 구성을 수행한다.

```tf
resource "aws_lb_target_group_attachment" "target-group-web-attach-resource" {
  target_group_arn = aws_alb_target_group.junhyunny_alb_target_group.arn
  target_id        = aws_instance.web.id
  port             = 8080
  depends_on = [aws_lb_listener.junhyunny_alb_listener]
}
```

## 6. Apply Terraform

위에서 코드로 정의한 인프라를 테라폼으로 적용한다. 필자는 파워 유저(power user)이기 때문에 클라이언트 액세스(access)를 위해 임시로 획득한 환경 변수를 터미널 세션에 준비한다.

```
$ export AWS_ACCESS_KEY_ID=ABCDEFGHIJKLEMNOPQRSTUVWXYZ
$ export AWS_SECRET_ACCESS_KEY=ABCDEFGHIJKLEMNOPQRSTUVWXYZ/1234567890/BCDE
$ export AWS_SESSION_TOKEN=ABCDEFG ... 1234567890
```

`terraform apply` 명령어를 사용해 AWS 클라우드에 인프라 변경 사항을 적용한다.

```
$ terraform apply

aws_vpc.junhyunny_vpc: Refreshing state... [id=vpc-01d8fd8343cc4a2a0]

...

Outputs:

alb-dns = "tf-lb-20240918073020750800000004-1501208815.us-east-1.elb.amazonaws.com"
```

ALB DNS 주소로 접근하면 애플리케이션 화면을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2024/deploy-ec2-into-target-group-in-aws-with-terraform-02.png" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-09-18-deploy-ec2-into-target-group-in-aws-with-terraform>

#### RECOMMEND NEXT POSTS

- [Terraform Backend for tfstate management][terraform-backend-for-tfstate-management-link]

[create-alb-and-target-group-in-aws-with-terraform-link]: https://junhyunny.github.io/terraform/create-alb-and-target-group-in-aws-with-terraform/
[terraform-backend-for-tfstate-management-link]: https://junhyunny.github.io/terraform/terraform-backend-for-tfstate-management/