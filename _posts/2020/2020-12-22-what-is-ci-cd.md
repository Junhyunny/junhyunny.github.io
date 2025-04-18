---
title: "CI/CD 파이프라인"
search: false
category:
  - information
last_modified_at: 2021-08-21T16:00:00
---

<br/>

## 0. 들어가면서

> CI/CD는 어플리케이션 개발 단계를 자동화하여 좋은 품질의 어플리케이션을 보다 짧은 주기로 고객에게 제공하는 방법이다.

처음 용어에 대한 정의를 접하였을 땐 추상적인 개념이라는 생각이 들었다. 여러 프로젝트들을 경험하면서 이 개념을 자연스럽게 이해하게 됐다. CI/CD는 크게 3단계로 나뉘진다. 

- 지속적인 통합(Continuous Integration)
- 지속적인 전달(Continuous Delivery)
- 지속적인 배포(Continuous Deployment)

<div align="center">
  <img src="/images/posts/2020/what-is-ci-cd-01.png" width="80%" class="image__border"/>
</div>
<center>https://www.redhat.com/ko/topics/devops/what-is-ci-cd</center>

## 1. Continuous Integration

지속적으로 코드들의 통합을 진행하면서 코드의 품질을 유지하기 위한 방법이다. 이 과정에서 이루어지는 주된 작업은 `빌드, 테스트 그리고 병합`이다. 시스템 개발이 여러 개발자들의 협업에 의해 진행되기 때문에 특정 시점에 개발된 코드들을 모두 병합하고 이를 테스트하는 일은 쉽지 않다. 

CI는 이런 문제를 해결하기 위한 방법이다. 빌드, 테스트 그리고 병합하는 자동화된 프로세스를 이용하여 최대한 자주 코드를 통합한다. 개발 과정에서 쌓이는 코드들은 자동화된 프로세스를 통해 쉽게 테스트된다. 이를 통해 시스템의 품질 향상을 도모하고 버그를 최소화할 수 있다. 

### 1.1. Benefits

- 빌드와 테스트가 자동화되어 개발자는 개발에 집중할 수 있다.
- 변경된 내용들이 자동으로 함께 빌드되며 이를 테스트할 수 있다.
- 자동화된 프로세스를 통해 자주 코드들이 통합되면서 시스템 전체에서 발생하는 문제점을 빠르게 찾을 수 있다.

### 1.2. Continuous Integration Tools

- 허드슨(Hudson)
- 뱀부(Bamboo)
- 젠킨스(Jenkins)

## 2. Continuous Delivery

개발된 내용들이 자동화 된 프로세스를 통해 빌드, 테스트, 병합 과정을 거친 후 원격 레포지토리에 자동으로 업로드(upload)된다. 원격 레포지토리는 컨테이너 이미지 레지스트리(container image registry)를 예로 들 수 있다. 효과적으로 지속적인 전달을 수행하기 위해선 지속적인 통합에서 지속적인 전달까지 파이프라인(pipeline)이 연결되어 있어야 한다. 파이프라인은 CI 도구를 이용해 연결 가능하다. 

## 3. Continuous Deployment

지속적인 제공의 확장된 형태로 어플리케이션을 프로덕션(production) 환경으로 배포하는 작업을 자동화한 것이다. 레퍼지토리 코드의 변경이 감지되면, 변경된 내용들은 고객이 사용 가능한 프로덕션 환경까지 릴리즈(release)할 수 있는 준비가 자동으로 이뤄진다. 해당 서비스의 실제 배포 여부는 비즈니스적인 결정 후 관리자에 의해 진행된다. 

#### RECOMMEND NEXT POSTS

- [Install Jenkins][jenkins-install-link]
- [젠킨스(Jenkins) GitHub Webhooks 연동][jenkins-github-webhook-link]
- [도커 레지스트리(Docker registry) 설치 on EC2 인스턴스][install-docker-registry-on-ec2-link]
- [비공개 도커 레지스트리(Private docker registry) 만들기][make-private-docker-registry-on-ec2-link]
- [젠킨스(Jenkins) 파이프라인 서비스 배포 on EC2 인스턴스][jenkins-deploy-ec2-using-docker-link]
- [젠킨스(Jenkins) 슬랙(Slack) 알림 메시지 전송][jenkins-slack-notification-link]

#### REFERENCE

- <https://www.redhat.com/ko/topics/devops/what-is-ci-cd>

[jenkins-install-link]: https://junhyunny.github.io/information/jenkins/jenkins-install/
[jenkins-github-webhook-link]: https://junhyunny.github.io/information/jenkins/github/jenkins-github-webhook/
[install-docker-registry-on-ec2-link]: https://junhyunny.github.io/information/docker/install-docker-registry-on-ec2/
[make-private-docker-registry-on-ec2-link]: https://junhyunny.github.io/information/docker/make-private-docker-registry-on-ec2/
[jenkins-deploy-ec2-using-docker-link]: https://junhyunny.github.io/information/jenkins/jenkins-deploy-ec2-using-docker/
[jenkins-slack-notification-link]: https://junhyunny.github.io/information/jenkins/jenkins-slack-notification/