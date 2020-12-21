---
title:  "CI/CD란 무엇인가?"
search: false
category: 
  - portfolio
last_modified_at: 2020-12-22T00:00:00
---

# CI/CD란 무엇인가?

> CI/CD는 애플리케이션 개발 단계를 자동화하여 애플리케이션을 보다 짧은 주기로 고객에게 제공하는 방법입니다.

크게 지속적인 통합(Continuous Integration), 지속적인 전달(Continuous Delivery), 지속적인 배포(Continuous Deployment)를 의미하며 
각 단계에서 구체적으로 무슨 일을 하는지에 대해 알아봤습니다.

![what-is-ci-cd-1](/images/what-is-ci-cd-1.PNG)
- 이미지 출처: <https://www.redhat.com/ko/topics/devops/what-is-ci-cd>

## CI, Continuous Integration 이란?
지속적으로 코드들의 통합을 진행하면서 코드의 품질을 유지하기 위한 방법입니다. **이 과정에서 이루어지는 주된 작업은 빌드와 테스트입니다.**
시스템 개발이 여러 개발자들이 협업에 의해 진행되면서 특정 시점에 개발된 코드들을 병합하고 테스트하는 일은 쉽지 않을 것입니다.
이런 문제점을 지속적인 코드 동기화(pull), 개발(development), 병합(merge)해 나가면서 해결하기 위한 방법론입니다.

주니어 개발자로 일하면서 제일 아쉬웠던 부분은 바쁜 일정을 핑계로 테스트 코드에 대한 작성에 소홀했다는 점입니다.
빌드의 경우에는 실패한다면 프로그램이 실행조차 되지 않으니 문제될 것이 없는데, 실제 배포가 되었을 때 테스트 미흡으로 인해 배포한 서비스들을 다시 rollback 하는 일이 빈번히 겪기도 했습니다.
단위 테스트, 통합 테스트에 대한 코드들이 개발 초반부터 차곡차곡 쌓여있었다면 
자동화 프로세스에 의해 코드들이 병합되는 과정에서 개발자의 놓친 실수들이 정리되고, 개발자는 테스트보다는 개발에 초점을 맞춰서 작업할 수 있지 않았을까 합니다.

## CD, Continuous Delivery 란?

## CD, Continuous Deployment 란?

## CI/CD의 장점

## 고증

<br>
- 참조글
  - <https://www.redhat.com/ko/topics/devops/what-is-ci-cd>