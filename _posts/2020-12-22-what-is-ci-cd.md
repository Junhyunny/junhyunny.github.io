---
title:  "CI/CD란 무엇인가?"
search: false
category: 
  - portfolio
last_modified_at: 2020-12-22T00:00:00
---

# CI/CD란 무엇인가?

> CI/CD는 애플리케이션 개발 단계를 자동화하여 애플리케이션을 보다 짧은 주기로 고객에게 제공하는 방법입니다.

CI/CD은 크게 **지속적인 통합(Continuous Integration), 지속적인 전달(Continuous Delivery), 지속적인 배포(Continuous Deployment)**로 구분되며 각 단계에서 구체적으로 무슨 일을 하는지에 대해 정리해보았습니다.<br>

![what-is-ci-cd-1](/images/what-is-ci-cd-1.PNG)
<center>이미지 출처, https://www.redhat.com/ko/topics/devops/what-is-ci-cd</center> 

## CI, Continuous Integration 이란?
지속적으로 코드들의 통합을 진행하면서 코드의 품질을 유지하기 위한 방법입니다. 이 과정에서 이루어지는 주된 작업은 **빌드와 테스트**입니다.<br>
시스템 개발이 여러 개발자들의 협업에 의해 진행되면서 특정 시점에 개발된 코드들을 병합하고 테스트하는 일은 쉽지 않습니다. 
이런 문제점을 지속적인 코드 동기화(pull), 개발(development), 병합(merge)을 통해 해결하기 위한 방법론입니다. 
이 단계에서 테스트 자동화에 의해 테스트도 함께 진행됩니다. 개발 과정에서 쌓이는 테스트 코드들을 통해 시스템의 품질 향상을 도모하고 버그를 최소화할 수 있습니다. 

## CD, Continuous Delivery 란?
작성 중입니다.

## CD, Continuous Deployment 란?
작성 중입니다.

## CI/CD의 장점
작성 중입니다.

## OPINION
주니어 개발자로 일하면서 제일 아쉬웠던 부분은 바쁜 일정을 핑계로 테스트 코드에 대한 작성에 소홀했다는 점입니다.<br>
프로그램이 변경되었을 때 빌드 실패는 프로그램이 실행조차 되지 않으니 문제가 크지 않지만, **미흡한 테스트는 실제 프로그램이 배포가 되었을 때 시스템의 장애를 유발합니다.** 
개발 초반부터 지속적으로 모인 단위/통합 테스트 코드들은 자동화 프로세스에 의해 코드가 병합/테스트되는 과정에서 변경된 프로그램의 문제점들을 빠르게 찾는데 도움을 줄 것입니다. 

#### 참조글
- <https://www.redhat.com/ko/topics/devops/what-is-ci-cd>