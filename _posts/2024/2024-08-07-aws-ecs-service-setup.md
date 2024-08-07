---
title: "AWS ECS(Elastic Container Service) Setup"
search: false
category:
  - aws
last_modified_at: 2024-08-07T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [AWS ALB(Application Load Balancer) and Target Group Setup][aws-alb-and-target-group-setup-link]
- [AWS ECR(Elastic Container Registry) Setup][aws-ecr-setup-link]

## 0. 들어가면서

이 글에선 AWS ECS(Elastic Container Service) 클러스터를 구축하는 방법에 대해 정리한다. ECS 클러스터를 구축하기 전에 [애플리케이션 로드 밸런서(ALB, Application Load Balancer)][aws-alb-and-target-group-setup-link]와 [ECR(Elastic Container Registry)][aws-ecr-setup-link]에 프라이빗 레포지토리가 미리 준비되어 있어야 한다.

## 1. AWS ECS(Elastic Container Service)

AWS ECS(Elastic Container Service)는 컨테이너화 된 애플리케이션을 배포 및 관리하고 규모를 조정할 수 있는 서비스를 제공한다. ECS 서비스의 구성 요소들을 살펴보자.

- 클러스터(Cluster)
  - 작업 또는 서비스의 논리적 그룹이다.
  - 네임스페이스(namespace)라는 개념이 존재하며 이는 서비스 연결과 서비스 간 통신에 이용된다.
- 서비스(Service)
  - 클러스터에 지정된 수의 태스크를 동시에 실행하고 관리할 수 있게 해주는 컴포넌트이다.
  - 오토 스케일링(auto scaling)과 로드 밸런싱(load balancing)을 관리한다.
  - 배포 유형(e.g. 롤링, 블루/그린)을 지정할 수 있다.
  - 태스크가 배포될 네트워크(VPC, 서브넷, 보안 그룹)을 지정할 수 있다.
- 태스크 정의(Task Definition)
  - JavaScript Object Notation(JSON) 템플릿을 통해 태스크를 정의할 수 있다.
  - 실행할 컨테이너의 도커 레포지토리 및 이미지를 설정할 수 있다.
  - 메모리 및 CPU 요구 사항을 지정할 수 있다.
  - 작업의 컨테이너에 사용할 공유 데이터 볼륨을 설정할 수 있다.
  - 태스크 정의 파일을 사용하면 애플리케이션 사양의 버전을 관리할 수도 있다.
- 태스크(Task)
  - 태스크 정의에서 정의된 설정으로 인스턴스화 된 것을 의미한다.
  - 클러스터에 속한 컨테이너 인스턴스(EC2 인스턴스)나 Fargate에 배포한다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-01.png" width="80%" class="image__border">
</div>
<center>https://tech.cloud.nongshim.co.kr/2021/08/30/%EC%86%8C%EA%B0%9C-amazon-ecs%EB%9E%80/</center>

## 2. Create ECS Cluster

클러스터를 먼저 구축한다. `ECS 대시보드`에서 클러스터 화면으로 이동한다.

- `Create cluster` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-02.png" width="80%" class="image__border">
</div>

<br/>

클러스터를 구축한다.

- 클러스터 이름은 `demo-ecs-cluster`를 사용한다.
- 인프라스트럭처는 `Fargate`를 사용한다.
  - `Fargate`는 컨테이너요 서버리스(serverless) 컴퓨팅 엔진이다. 서버 확장, OS 업데이트, 보안 패치 같은 운영이 필요 없다. AWS에서 항상 최신으로 관리한다. 가격은 EC2 인스턴스보다 비싸다.
  - EC2 인스턴스를 사용하면 필요한 사양에 따라 CPU, 메모리, 스토리지를 변경할 수 있다. 자원 할당, OS 업데이트, 보안 패치, 서버 모니터링 같은 운영 비용이 필요하다.
- `Create` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-03.png" width="80%" class="image__border">
</div>

<br/>

클러스터 구축에는 다소 시간이 소요된다. 클러스터 구축이 완료되면 다음과 같은 화면을 볼 수 있다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-04.png" width="80%" class="image__border">
</div>

## 3. Create ECS Task Definition

ECS 클러스터에서 실행할 태스크 정의를 만든다. `ECS 대시보드`의 태스크 정의 화면으로 이동한다.

- `Create task definition` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-05.png" width="80%" class="image__border">
</div>

<br/>

태스크 이름과 인프라스트럭처 타입 등을 정의한다.

- 태스크 이름은 `demo-ecs-task`이다.
- 런치 타입은 클러스터 타입과 동일하게 `Fargate`로 지정한다.
- 컨테이너 아키텍처는 `Linux/ARM64`으로 지정한다.
  - 컨테이너 이미지는 필자의 M1 맥북에서 빌드했기 때문에 아키텍처 타입이 `Linux/ARM64`이다. 
- 태스크 스펙을 정의한다.
  - 1CPU
  - 3GB Memory
- 태스크 실행 역할을 `ecsTaskExecutionRole`으로 선택한다.
  - 이 역할엔 `AmazonECSTaskExecutionRolePolicy` 정책이 지정되어 있다.
  - CloudWatch 로그 쓰기와 ECR 접근 읽기가 허용된다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-06.png" width="80%" class="image__border">
</div>

<br/>

태스크에서 실행될 컨테이너를 설정한다.

- 컨테이너 이름을 `demo-service-container`로 정한다.
- ECR 레포지토리에 저장된 이미지 URI를 지정한다.
- 포트는 8080으로 지정한다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-07.png" width="80%" class="image__border">
</div>

<br/>

아래 로그 수집 관련 설정을 하면 컨테이너에서 수집되는 로그는 CloudWatch에서 볼 수 있다. `Create` 버튼을 눌러 태스크 정의를 저장한다.

<div align="center">
  <div>
    <img src="/images/posts/2024/aws-ecs-service-setup-08.png" width="80%" class="image__border">
  </div>
  <div>
    <img src="/images/posts/2024/aws-ecs-service-setup-09.png" width="80%" class="image__border">
  </div>
</div>

<br/>

생성된 태스크 정보는 다음과 같다. 

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-10.png" width="80%" class="image__border">
</div>

## 4. Create ECS Service

서비스를 만들 수 있는 경로는 여러가지 있다. 다음 화면에서 생성할 수 있다. 

- ECS 클러스터
- ECS 태스크 정의

필자는 ECS 태스크 정의 화면에서 서비스를 배포했다. 

- `Create service` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-11.png" width="80%" class="image__border">
</div>

<br/>

서비스를 배포할 클러스터와 플랫폼 버전을 정한다.

- `demo-ecs-cluster` 클러스터를 선택한다.
- 플랫폼은 최신 버전을 사용한다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-12.png" width="80%" class="image__border">
</div>

<br/>

서비스 이름과 내부에서 실행되는 태스크 개수를 정한다.

- 서비스 이름은 `demo-ecs-service`으로 정한다.
- 원하는 태스크 개수는 1개로 정한다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-13.png" width="80%" class="image__border">
</div>

<br/>

네트워크 관련 설정을 수행한다. 

- 사전에 만든 `demo-service-vpc`를 선택한다. 
- 서비스 배포 영역은 프라이빗 서브넷으로 지정한다.
- 새로운 시큐리티 그룹을 생성한다.
  - 시큐리티 그룹 이름은 `demo-ecs-service-sg`으로 지정한다.
  - 인바운드(inbound) 규칙에 VPC 네트워크 대역인 10.0.0.0/16 IP 주소에서 8080 포트를 통해 접근하는 요청들은 허용하도록 설정한다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-14.png" width="80%" class="image__border">
</div>

<br/>

로드 밸런싱 관련 설정을 수행한다.

- 로드 밸런서 타입은 `Application Load Balancer`를 사용한다.
- 트래픽을 라우팅 할 컨테이너는 태스크 정의에서 만든 `demo-service-container`를 사용한다.
- 사전에 만든 `public-ecs-service-alb` 로드 밸런서를 사용한다.
- 사전에 만든 리스너를 사용한다.
- 사전에 만든 `demo-ecs-alb-target-group` 타겟 그룹을 사용한다.
  - 생성된 서비스는 해당 타겟 그룹에 자동으로 매칭된다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-15.png" width="80%" class="image__border">
</div>

## 5. Trouble shooting

위에서 생성한 서비스는 배포는 실패한다. ECS 서비스 화면의 `Deployment` 탭의 이벤트 섹션의 태스크 아이디를 누르면 확인할 수 있다. 에러가 발생한 이유를 확인하고 하나씩 해결해보자.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-16.png" width="80%" class="image__border">
</div>

### 5.1. ECR Connection

다음과 같은 에러를 확인할 수 있다.

> Task stopped at: 2024-08-07T14:25:38.466Z<br/>
> ResourceInitializationError: unable to pull secrets or registry auth: The task cannot pull registry auth from Amazon ECR: There is a connection issue between the task and Amazon ECR. Check your task network configuration. RequestError: send request failed caused by: Post "https://api.ecr.ap-northeast-2.amazonaws.com/": dial tcp 54.180.184.245:443: i/o timeout

ECR 레포지토리에서 이미지를 가져올 때 에러가 발생한다. 권한이 충분함에도 접근이 불가능한 이유는 서비스가 프라이빗 서브넷에 배포되기 때문이다. 퍼블릭 서브넷에 배포하는 경우 해당 에러가 발생하지 않는다. 이 경우 프라이빗 서브넷에서 ECR 레포지토리에 접근할 수 있도록 엔드포인트(endpoint)를 만들면 해결할 수 있다.

엔드포인트는 `VPC 대시보드` 화면에서 찾을 수 있다. 엔드포인트 생성 화면을 통해 ECR 레포지토리를 위한 네트워크 인터페이스를 만든다.

- 엔드포인트 태그 이름을 설정한다.
- 서비스 카테고리는 `AWS services`로 설정한다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-17.png" width="80%" class="image__border">
</div>

<br/>

필요한 서비스는 두 가지다. 하나의 서비스만 선택할 수 있다. 즉, 두 개의 엔드포인트를 만들어야 한다는 이야기이다.

- com.amazonaws.ap-northeast-2.ecr.api
- com.amazonaws.ap-northeast-2.ecr.dkr

ECS 서비스와 동일한 VPC의 프라이빗 서브넷을 선택한다. 

<div align="center">
  <div>
    <img src="/images/posts/2024/aws-ecs-service-setup-18.png" width="80%" class="image__border">
  </div>
  <div>
    <img src="/images/posts/2024/aws-ecs-service-setup-19.png" width="80%" class="image__border">
  </div>
</div>

<br/>

시큐리티 그룹을 선택한다. ECS 서비스를 생성할 때 만든 시큐리티 그룹과 동일한 것을 사용한다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-20.png" width="80%" class="image__border">
</div>

<br/>

ECR 레포지토리와 HTTPS 통신을 수행한다. 선택한 시큐리티 그룹에 새로운 인바운드 규칙을 추가한다.

- 인바운드 규칙에 VPC 네트워크 대역인 10.0.0.0/16 IP 주소에서 443 포트를 통해 접근하는 요청들은 허용하도록 설정한다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-21.png" width="80%" class="image__border">
</div>

### 5.2. CloudWatch Connection

위 엔드포인트가 생성된 후 ECS 서비스를 다시 배포하면 다음과 같은 에러를 만난다.

> Task is stopping<br/>
> ResourceInitializationError: failed to validate logger args: The task cannot find the Amazon CloudWatch log group defined in the task definition. There is a connection issue between the task and Amazon CloudWatch. Check your network configuration. : signal: killed

위와 마찬가지로 프라이비 서브넷에서 CloudWatch 서비스에 접근할 수 없기 때문에 에러가 발생한다. 다음 서비스를 위한 엔드포인트를 생성한다. VPC, 서브넷, 시큐리티 그룹 설정은 ECR 엔드포인트 설정과 동일하게 수행한다.

- com.amazonaws.ap-northeast-2.logs 서비스를 생성한다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-22.png" width="80%" class="image__border">
</div>

## 6. Check the result

서비스가 정상적으로 배포되면 다음과 같이 서비스에서 실행 중인 태스크 정보를 볼 수 있다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-23.png" width="80%" class="image__border">
</div>

<br/>

실행 중인 태스크까지 트래픽이 잘 연결되었다면 브라우저에서 서비스 화면을 볼 수 있다. 접근 주소는 [AWS ALB(Application Load Balancer) and Target Group Setup][aws-alb-and-target-group-setup-link] 글에서 만든 로드 밸런서의 DNS 주소를 사용한다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-24.png" width="80%" class="image__border">
</div>

<br/>

최종적으로 AWS 인프라 구조는 다음과 같은 모습을 갖는다.

- 외부 요청은 인터넷으로부터 퍼블릭 서브넷에 위치한 애플리케이션 로드 밸런서를 통해 들어온다.
  - 허용된 인바운드 시큐리티 그룹 규칙은 필자의 퍼블릭 IP 주소와 80 포트이다.
- 로드 밸런서는 리스너 규칙에 따라 타겟 그룹으로 트래픽을 라우트한다.
  - 타겟 그룹은 VPC 전역이 대상이지만, 타겟 그룹에 매칭된 서비스는 모두 프라이빗 서브넷에 위치한다.
- 트래픽은 타겟 그룹에 속한 ECS 태스크로 전달된다.
  - 허용된 인바운드 시큐리티 그룹 VPC 네트워크 대역인 10.0.0.0/16과 8080 포트이다.
- 서비스를 배포하고, 실행 후 로그를 출력할 때 프라이빗 서브넷에 생성된 엔드포인트를 사용한다.
  - 이미지를 다운로드 받을 때 ECR 엔드포인트를 사용한다.
  - 로그를 출력할 때 CloudWatch 엔드포인트를 사용한다.
  - 허용된 인바운드 시큐리티 그룹 VPC 네트워크 대역인 10.0.0.0/16과 443 포트이다.

<div align="center">
  <img src="/images/posts/2024/aws-ecs-service-setup-25.png" width="80%" class="image__border">
</div>

#### REFERENCE

- <https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/vpc-endpoints.html>
- <https://velog.io/@hbjs97/AWS-ECS-%EC%9D%B8%ED%94%84%EB%9D%BC-%EA%B5%AC%EC%B6%95>

[aws-alb-and-target-group-setup-link]: https://junhyunny.github.io/aws/aws-alb-and-target-group-setup/
[aws-ecr-setup-link]: https://junhyunny.github.io/aws/aws-ecr-setup/