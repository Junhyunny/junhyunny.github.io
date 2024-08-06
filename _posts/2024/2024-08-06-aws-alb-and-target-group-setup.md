---
title: "AWS ALB(Application Load Balancer) and Target Group Setup"
search: false
category:
  - aws
last_modified_at: 2024-08-06T23:55:00
---

<br/>

## 0. 들어가면서

필자는 AWS 전문가가 아니고 인프라는 보통 다른 팀에서 구축해주기 때문에 이해도가 낮은 편이다. 그러다 최근 신규 팀원들에 대한 온보딩(onboarding)을 맡으면서 AWS 클라우드에 구축된 인프라 관련 내용을 설명할 일이 생겼다. 이를 기회 삼아 AWS 클라우드 공부를 시작했다. 자세한 내용까지 모두 학습하진 못 했지만, 일단 학습한 내용들을 하나씩 블로그에 정리해보려 한다. 

이 글은 ECS(Elastic Container Service) Fargate 클러스터를 위한 애플리케이션 로드 밸런서(ALB, Application Load Balancer)와 타겟 그룹(target group)을 만들고 둘을 연결하는 방법에 대해 다룬다. VPC(Virtual Private Cloud)는 이미 구축된 상태에서 진행한다. VPC 구성은 다음과 같다.

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-01.png" width="100%" class="image__border">
</div>

## 1. Create Target Group

타겟 그룹은 애플리케이션 로드 밸런서가 트래픽을 분산시키는 대상 그룹을 의미한다. 지정한 프로토콜과 포트 번호를 사용해 EC2 인스턴스 같은 개별 등록된 대상으로 요청을 라우팅한다. 하나의 타겟 그룹에 하나 이상의 인스턴스를 등록할 수 있다. 타겟 그룹은 로드 밸런서를 생성할 때 함께 만들 수 있지만, 새로운 탭 화면으로 이동되기 때문에 설명을 읽을 때 헷갈릴 수 있다. 설명의 흐름이 끊키지 않도록 타겟 그룹부터 만든다. 타겟 그룹은 `EC2 대시보드` 왼쪽 하단 `Load Balancing` 항목에서 찾을 수 있다. 

<div align="left">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-02.png" class="image__border">
</div>

<br/>

타겟 그룹 대시보드로 진입하면 타겟 그룹 리스트 화면이 보인다. 이 곳에서 새로운 타겟 그룹을 생성한다.

- `Create target group` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-03.png" width="100%" class="image__border">
</div>

<br/>

타겟 그룹 관련된 설정을 선택한다. 다시 한번 이야기하지만, 이 글은 ECS Fargate 클러스터 환경을 위해 타겟 그룹과 로드 밸런서를 구축하는 과정이다. EC2 인스턴스 같은 단순 컴퓨팅 리소스에 연결할 타겟 그룹이 아니기 때문에 주의하길 바란다.

- ECS 서비스의 타겟 그룹은 `IP 주소` 타입을 사용한다.
- 이름을 지정한다.
- 프로토콜과 포트 번호를 지정한다.
  - HTTP(HyperText Transfer Protoco)과 8080 포트를 사용한다. 
  - 로드 밸런서로부터 라우팅 되는 요청들은 HTTP 기반으로 8080 포트 서비스로 전달된다.

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-04.png" width="100%" class="image__border">
</div>

<br/>

타겟 그룹으로 요청을 라우팅 할 로드 밸런서가 호스팅 될 VPC를 지정한다. 해당 VPC에 등록된 서비스만 타겟으로 지정될 수 있기 때문에 추후 ECS 서비스도 이 VPC를 사용할 예정이다.

- 사전에 생성되어 있던 `demo-service-vpc`를 사용한다.
- 프로토콜 버전은 기본으로 설정된 HTTP 1을 사용한다.

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-05.png" width="100%" class="image__border">
</div>

<br/>

그룹에 포함될 타겟은 ECS에 의해 자동으로 등록되므로 별다른 설정이 필요 없다.

- `Create target group` 버튼을 누른다.

<div align="center">
  <div>
    <img src="/images/posts/2024/aws-alb-and-target-group-setup-06-01.png" width="100%" class="image__border">
  </div>
  <div>
    <img src="/images/posts/2024/aws-alb-and-target-group-setup-06-02.png" width="100%" class="image__border">
  </div>
</div>

<br/>

타겟 그룹이 정상적으로 생성되면 다음과 같은 화면을 볼 수 있다.

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-07.png" width="100%" class="image__border">
</div>

## 2. Create Application Load Balancer

이제 애플리케이션 로드 밸런서를 생성한다. 생성하기 전에  애플리케이션 로드 밸런서는 엘라스틱 로드 밸런싱(ELB, Elastic Load Balancing) 컴포넌트의 종류 중 하나이다. 엘라스틱 로드 밸런싱 컴포넌트는 다음과 같은 로드 밸런서를 지원하고 필요에 따라 적합한 로드 밸런서를 선택한다.

- Application Load Balancer
- Network Load Balancer
- Gateway Load Balancer
- Class Load Balancer

필자는 외부에서 보내는 HTTP, HTTPS 요청을 처리할 로드 밸런서가 필요하기 때문에 애플리케이션 로드 밸런서를 사용했다. 로드 밸런서는 브라우저 같은 클라이언트(client)에 대한 단일 접점 역할을 수행하며 가용 영역에 위치한 EC2 인스턴스 같은 수신 애플리케이션을 호스팅하는 컨테이너로 트래픽을 분산한다. 애플리케이션 로드 밸런서는 다음과 같은 구성 요소를 갖는다.

- 리스너(listener)
  - 프로토콜 및 포트를 사용하여 클라이언트 연결 요청을 확인한다.
  - 리스너에 정의한 규칙과 일치하는 요청은 타겟 그룹으로 연결된다. 
  - 하나의 리스너에 여러 개의 타겟 그룹을 연결할 수 있으며 
- 타겟 그룹(target group)
  - 타겟 그룹에는 EC2 인스턴스 같은 수신 애플리케이션을 호스팅하는 서비스 컨테이너가 하나 이상 등록된다.
  - 프로토콜과 포트 번호를 사용해 타겟 그룹에 속한 컨테이너에게 요청을 라우팅한다.
  - 헬스 체크(health check)을 통해 대상 그룹에 속한 컨테이너들의 상태를 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-08.png" width="80%" class="image__border">
</div>
<center>https://docs.aws.amazon.com/ko_kr/elasticloadbalancing/latest/application/introduction.html</center>

<br/>

이제 본격적으로 애플리케이션 로드 밸런서를 생성해보자. 타겟 그룹은 이전 단계에서 만든 것을 사용한다. 타겟 그룹과 동일하게 로드 밸런서도 `EC2 대시보드` 왼쪽 하단 `Load Balancing` 항목에서 찾을 수 있다. 

- `Create load balancer` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-09.png" width="100%" class="image__border">
</div>

<br/>

위에서도 언급했듯이 외부에서 접근하기 위해 필요한 로드 밸런서는 Application Load Balancer 타입이다. 이를 선택한다.

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-10.png" width="100%" class="image__border">
</div>

<br/>

기본 설정에서 이름, 스킴(scheme) 그리고 주소 타입을 결정한다.

- 이름은 `public-ecs-service-alb`로 지정한다.
- 스킴은 `internet-facing`을 사용한다.
  - 인터넷과 연결이 필요하므로 반드시 퍼블릭 서브넷을 사용해야 한다.
- 주소 타입은 `IPv4`를 사용한다.

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-11.png" width="100%" class="image__border">
</div>

<br/>

VPC를 지정한다. 위에서도 언급했듯이 반드시 퍼블릭 서브넷을 사용한다. 

- AZ(Availability Zones)을 선택하고 해당 존의 퍼블릭 서브넷을 선택한다.

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-12.png" width="100%" class="image__border">
</div>

<br/>

만일 프라이빗 서브넷을 선택한 경우 다음과 같은 경고 메시지를 볼 수 있다. 

- 프라이빗 서브넷은 인터넷 게이트웨이로부터 라우팅이 되지 않는다.
- 이 설정으로 로드 밸런서는 인터넷으로부터 트래픽을 받지 못한다.

> The selected subnet does not have a route to an internet gateway. This means that your load balancer will not receive internet traffic. You can proceed with this selection; however, for internet traffic to reach your load balancer, you must update the subnet’s route table in the VPC console.

다음은 시큐리티 그룹이다. 여기서 만드는 애플리케이션 로드 밸런서는 80 포트에 대한 접근이 허용되어 있어야 한다. 사전에 만들어 둔 시큐리티 그룹이 없다면 `create a new security group` 링크로 이동하여 시큐리티 그룹을 만들면 된다. 시큐리티 그룹 생성 방법은 [아래](#3-create-security-group)에 정리되어 있다.

- 사전에 만들어 둔 `public-ecs-service-alb-sg` 시큐리티 그룹을 선택한다.

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-13.png" width="100%" class="image__border">
</div>

<br/>

다음 리스너와 라우팅 규칙을 지정한다. 리스너는 여러 개 만들 수 있으며, 이 글은 간단한 실습이기 때문에 HTTP 방식만 사용한다.

- 프로토콜은 HTTP, 포트는 80을 사용한다.
- 타겟 그룹은 이전 단계에서 만든 `demo-ecs-alb-target-group`을 선택한다.

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-14.png" width="100%" class="image__border">
</div>

<br/>

준비가 모두 끝났다. 화면 맨 아래로 이동하면 다음과 같은 요약 정보를 확인할 수 있다. 요약 정보에 이상이 없다면 로드 밸런서를 생성한다.

- `Create load balancer` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-15.png" width="100%" class="image__border">
</div>

<br/>

생성이 완료되면 다음과 같은 화면을 확인할 수 있다.

- DNS 이름에 보이는 주소로 접근하면 해당 로드 밸런서로 연결된다.

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-16.png" width="100%" class="image__border">
</div>

## 3. Create Security Group

위 로드 밸런서를 위한 시큐리티 그룹을 생성한다. 시큐리티 그룹은 `EC2 대시보드`에서 찾을 수 있다. 이전 단계에서 생성한 로드 밸런서로 접근하기 위해선 80 포트 대한 접근이 허용되도록 인바운드(inbound) 규칙이 설정되어야 한다. IP 주소 대역은 상황에 맞게 설정한다. 글 작성을 위한 실습이므로 필자의 IP에서만 접근할 수 있도록 설정했다.

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-17.png" width="100%" class="image__border">
</div>

<br/>

모든 트래픽을 허용하도록 아웃바운드(outbound) 규칙을 설정한다.

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-18.png" width="100%" class="image__border">
</div>

## CLOSING

ECS 클러스터에서 사용할 로드 밸런서 준비가 끝났다. 다음과 같은 모습을 갖는다. 

- 퍼블릭 서브넷에 애플리케이션 로드 밸런서가 위치한다.
- 애플리케이션 로드 밸런서의 시큐리티 그룹은 80 포트에 대한 접근이 허용되어 있어야 한다.
- 해당 VPC 전역에 위치한 모든 리소스는 모두 타겟 그룹은 대상이 된다.  

<div align="center">
  <img src="/images/posts/2024/aws-alb-and-target-group-setup-19.png" width="100%" class="image__border">
</div>

#### REFERENCE

- <https://docs.aws.amazon.com/ko_kr/elasticloadbalancing/latest/application/load-balancer-target-groups.html>
- <https://docs.aws.amazon.com/ko_kr/elasticloadbalancing/latest/application/introduction.html>