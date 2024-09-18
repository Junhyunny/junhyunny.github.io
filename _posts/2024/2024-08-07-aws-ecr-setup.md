---
title: "AWS ECR(Elastic Container Registry) Setup"
search: false
category:
  - aws
last_modified_at: 2024-08-07T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [AWS ALB(Application Load Balancer) and Target Group Setup][aws-alb-and-target-group-setup-link]

## 0. 들어가면서

ECS(Elastic Container Service) 클러스터를 구축하려면 컨테이너 이미지가 필요하다. 컨테이너 이미지는 도커 허브(docker hub) 같은 이미지 레포지토리가 필요하다. AWS 클라우드에서 제공하는 이미지 저장소인 ECR(Elastic Container Registry) 컴포넌트를 제공한다. 이번 글에선 AWS ECR 레포지토리를 생성하고 이미지를 푸시(push)하는 방법에 대해 정리한다. 

## 1. AWS ECR(Elastic Container Registry)

ECR는 컨테이너 이미지를 저장할 수 있는 AWS 클라우드 서비스이다. ECS 서비스는 IAM(Identity and Access Management)을 통해 인가 처리가 가능한 프라이빗 레포지토리(private repository)를 제공한다. 프라이빗 레포지토리인만큼 지정된 사용자 또는 EC2 인스턴스가 ECR 레포지토리 및 이미지에 접근할 수 있다. ECR 서비스는 퍼블릭 레포지토리(public repository)도 지원한다.

## 2. Create ECR Private Repository

이제 프라이빗 레포지토리를 만들어보자. `ECR 대시보드`에서 프라이빗 레지스트리의 레포지토리 화면으로 이동한다. 

<div align="left">
  <img src="/images/posts/2024/aws-ecr-setup-01.png" class="image__border">
</div>

<br/>

해당 화면에서 기존에 운영 중인 레포지토리 정보를 확인할 수 있다. 이 화면에서 레포지토리를 생성할 수 있다.

- `Create repository` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/aws-ecr-setup-02.png" width="100%" class="image__border">
</div>

<br/>

레포지토리 생성 화면에서 레포지토리를 생성한다.

- 레포지토리 가시성 세팅은 `Private`을 선택한다.
- 레포지토리 이름은 `demo-service`으로 정한다.
- `Create repository` 버튼을 누른다.

<div align="center">
  <div>
    <img src="/images/posts/2024/aws-ecr-setup-03.png" width="100%" class="image__border">
  </div>
  <div>
    <img src="/images/posts/2024/aws-ecr-setup-04.png" width="100%" class="image__border">
  </div>
</div>

## 3. Push Container Image

레포지토리가 생성되면 이미지를 업로드 할 수 있다. 이미지를 업로드하는 명령어는 레포지토리 화면 상단 `View push commands` 버튼을 누르면 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2024/aws-ecr-setup-05.png" width="100%" class="image__border">
</div>

<br/>

프라이빗 레포지토리에 이미지를 푸시하기 위해선 인증 과정이 필요하다. 터미널에서 도커 명령어로 해당 프라이빗 레포지토리에 로그인 한 이후 이미지를 푸시해야 한다.

1. ECR 프라이빗 레포지토리 로그인
2. 이미지 생성
3. 태그 이름 변경
4. 이미지 푸시

<div align="center">
  <img src="/images/posts/2024/aws-ecr-setup-06.png" width="100%" class="image__border">
</div>

<br/>

필자는 파워 유저(power user)이기 때문에 클라이언트 액세스(access)를 위해 임시로 획득한 환경 변수를 터미널 세션에 준비한다.

```
$ export AWS_ACCESS_KEY_ID=ABCDEFGHIJKLEMNOPQRSTUVWXYZ
$ export AWS_SECRET_ACCESS_KEY=ABCDEFGHIJKLEMNOPQRSTUVWXYZ/1234567890/BCDE
$ export AWS_SESSION_TOKEN=ABCDEFG ... 1234567890
```

환경 변수를 추가하고 로그인을 수행하면 다음과 같이 성공했다는 로그를 볼 수 있다.

```
$ aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 1234567890.dkr.ecr.ap-northeast-2.amazonaws.com

Login Succeeded
```

해당 실습을 진행하려면 애플리케이션 이미지가 필요하다. 필자는 간단한 TODO LIST 애플리케이션 이미지를 만들어 실습을 진행했다. 예제 코드는 이 [레포지토리](https://github.com/Junhyunny/blog-in-action/tree/master/2024-08-07-aws-ecr-setup/action-in-blog)에서 확인할 수 있다. 해당 프로젝트 루트 경로에서 도커 이미지를 생성할 수 있다.

```
$ docker build -t demo-service .
 [+] Building 24.5s (29/29) FINISHED                                                                       docker:desktop-linux
  => [internal] load build definition from Dockerfile                                                                      0.0s
  => => transferring dockerfile: 795B                                                                                      0.0s

...

  => exporting to image                                                                                                    0.1s
  => => exporting layers                                                                                                   0.1s
  => => writing image sha256:a72f69ef8f4edd26a3ee9aad9ca870eedac4e6107d74b504a35534ca8d25c5a7                              0.0s
  => => naming to docker.io/library/demo-service                                                                           0.0s
 
 View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/g5p5wdsantsghhh8gsvd622u9
 
 What's next:
     View a summary of image vulnerabilities and recommendations → docker scout quickview 
```

이미지 빌드가 완료되면 다음 명령어를 사용해 이미지를 업로드한다.

- ECR 레포지토리를 위한 태그 이름을 갖는 이미지를 만든다.
- 해당 이미지를 푸시한다.

```
$ docker tag demo-service:latest 1234567890.dkr.ecr.ap-northeast-2.amazonaws.com/demo-service:latest

$ docker push 1234567890.dkr.ecr.ap-northeast-2.amazonaws.com/demo-service:latest
The push refers to repository [1234567890.dkr.ecr.ap-northeast-2.amazonaws.com/demo-service]
a0251f32f17d: Pushed 
1344044c94da: Pushed 
c82e5bf37b8a: Pushed 
2f263e87cb11: Pushed 
f941f90e71a8: Pushed 
latest: digest: sha256:4c4690abd7fee0279c58aa7227cfd66143cf74283d33f555844eff9271be7a65 size: 1371
```

이미지가 업로드 되면 AWS 웹 콘솔에서 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2024/aws-ecr-setup-07.png" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-08-07-aws-ecr-setup/action-in-blog>

#### RECOMMEND NEXT POSTS

- [AWS ECS(Elastic Container Service) Setup][aws-ecs-service-setup-link]

#### REFERENCE

- <https://docs.aws.amazon.com/ko_kr/AmazonECR/latest/userguide/what-is-ecr.html>

[aws-alb-and-target-group-setup-link]: https://junhyunny.github.io/aws/aws-alb-and-target-group-setup/
[aws-ecs-service-setup-link]: https://junhyunny.github.io/aws/aws-ecs-service-setup/