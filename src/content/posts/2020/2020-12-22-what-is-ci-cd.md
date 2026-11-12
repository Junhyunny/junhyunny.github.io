---
title: "CI/CD 파이프라인"
publishedAt: "2020-12-22"
updatedAt: "2026-11-12T16:26:00+09:00"
canonicalPath: "/information/what-is-ci-cd/"
categories:
  - "information"
summary: "애플리케이션 개발 단계를 자동화하는 CI/CD의 개념을 지속적인 통합, 지속적인 전달, 지속적인 배포로 나누어 각각의 장점과 도구를 정리했다."
recommendedPosts:
  - title: "젠킨스(Jenkins) 설치"
    href: "https://junhyunny.github.io/information/jenkins/jenkins-install/"
  - title: "젠킨스(Jenkins) GitHub Webhooks 연동"
    href: "https://junhyunny.github.io/information/jenkins/github/jenkins-github-webhook/"
  - title: "EC2 인스턴스에 도커 레지스트리(Docker registry) 설치"
    href: "https://junhyunny.github.io/information/docker/install-docker-registry-on-ec2/"
  - title: "비공개 도커 레지스트리(Private docker registry) 만들기"
    href: "https://junhyunny.github.io/information/docker/make-private-docker-registry-on-ec2/"
  - title: "젠킨스(Jenkins) 파이프라인을 통해 EC2 인스턴스에 서비스 배포"
    href: "https://junhyunny.github.io/information/jenkins/jenkins-deploy-ec2-using-docker/"
  - title: "젠킨스(Jenkins) 슬랙(Slack) 알림 메시지 전송"
    href: "https://junhyunny.github.io/information/jenkins/jenkins-slack-notification/"
---

## 0. 들어가면서

> CI/CD는 애플리케이션 개발 단계를 자동화하여 좋은 품질의 애플리케이션을 보다 짧은 주기로 고객에게 제공하는 방법이다.

처음 이 용어의 정의를 접했을 땐 추상적인 개념이라는 생각이 들었다. 여러 프로젝트를 경험하면서 이 개념을 자연스럽게 이해하게 됐다. CI/CD는 크게 다음 3단계로 나뉜다.

- 지속적인 통합(Continuous Integration)
- 지속적인 전달(Continuous Delivery)
- 지속적인 배포(Continuous Deployment)

<div align="center">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2020/main/what-is-ci-cd-01.png" width="100%" class="image__border">
</div>
<center>https://www.redhat.com/ko/topics/devops/what-is-ci-cd</center>

## 1. Continuous Integration

지속적인 통합은 코드를 지속적으로 통합하면서 코드의 품질을 유지하는 방법이다. 이 과정에서 이뤄지는 주된 작업은 `빌드`, `테스트`, `병합`이다. 시스템 개발은 여러 개발자의 협업으로 진행되기 때문에 특정 시점에 개발된 코드를 모두 병합하고 테스트하는 일은 쉽지 않다.

CI는 이런 문제를 해결하는 방법이다. 빌드, 테스트, 병합을 수행하는 자동화된 프로세스를 이용해 최대한 자주 코드를 통합한다. 개발 과정에서 쌓이는 코드는 자동화된 프로세스를 통해 쉽게 테스트된다. 이를 통해 시스템의 품질을 높이고 버그를 최소화할 수 있다.

CI의 장점은 다음과 같다.

- 빌드와 테스트가 자동화되어 개발자는 개발에 집중할 수 있다.
- 변경된 내용이 자동으로 함께 빌드되고 테스트된다.
- 자동화된 프로세스를 통해 코드가 자주 통합되므로 시스템 전체에서 발생하는 문제를 빠르게 찾을 수 있다.

대표적인 CI 도구로는 허드슨(Hudson), 뱀부(Bamboo), 젠킨스(Jenkins)가 있다.

## 2. Continuous Delivery

지속적인 전달에서는 개발된 내용이 자동화된 프로세스를 통해 빌드, 테스트, 병합 과정을 거친 후 원격 레포지토리에 자동으로 업로드(upload)된다. 컨테이너 이미지 레지스트리(container image registry)가 원격 레포지토리의 한 예다. 지속적인 전달을 효과적으로 수행하려면 지속적인 통합부터 지속적인 전달까지 파이프라인(pipeline)이 연결되어 있어야 한다. 파이프라인은 CI 도구를 이용해 연결할 수 있다.

## 3. Continuous Deployment

지속적인 배포는 지속적인 전달의 확장된 형태로, 애플리케이션을 프로덕션(production) 환경에 배포하는 작업까지 자동화한 것이다. 레포지토리의 코드 변경이 감지되면 변경된 내용을 고객이 사용할 수 있는 프로덕션 환경까지 릴리즈(release)할 준비가 자동으로 이뤄진다. 해당 서비스의 실제 배포 여부는 비즈니스적인 결정을 거쳐 관리자가 정한다.

#### REFERENCE

- <https://www.redhat.com/ko/topics/devops/what-is-ci-cd>
