---
title: "DevOps, Development and Operations"
search: false
category:
  - information
last_modified_at: 2021-08-21T16:00:00
---

<br>

## 0. Intro

> It is culture and methodology 
> that combines development and system operation into a single organization to solve the problems 
> that arise when the development and system operation are seperated.

I wrote this post based on my experience after reading reference to [조대협님의 블로그::개발과 운영의 조화][blog-link] that I can relate to, among the articles related to `DevOps`. 

I joined as a junior for a project for new system, and now the project has been completed. 
The development team was converted into the system operation team and I have been used to operate MES(Manufacture Execution System).

In the early stage of the development project, the system operation team for the legacy and the development team where I was in didn't have communication with each other. 
We collaborated together to narrow the gap between the legacy and the new system based on the business know-how of the operation team in the middle stage of the project. 
At the end of the project, we had made good results for the long journey which is for two-year and six-month  that we had performed the pre-operational testing, the operation and stabilization system. 
I could relate to `DevOps` that I did not empathize with before at the end of the project.

> Engineers write codes, build, deploy and run services on the system by themselves.<br>
> And it is the process and culture to improve services while constantly interacting with users.

프로젝트 중간 단계로 접어들면서 운영팀과 함께 협업하는 시점에 저는 오만한 생각을 하고 있었습니다. 
신규 아키텍처, 새로운 기술들에 익숙해진 저는 기술 수준이 이전 시스템에 머물러 있는 운영 요원들의 능력이 수준 낮다고 생각했었습니다. 
**프로젝트 가동과 동시에 저의 생각이 멍청했다는 것이 밝혀졌습니다.** 
신규 시스템은 가동 시점에 크게 불안정하였습니다. 
기존 시스템의 기능이 새로운 시스템에서 정상적으로 동작하지 않자 현장에서의 불평과 불만은 끊이지 않았습니다. 
이때 운영팀의 운영 노하우, 비즈니스 전문성이 빛을 발했습니다. 
**현장에서 원하는 건 IT 지식이 뛰어난 사람이 아닌 비즈니스적인 대화가 통하는 사람이었습니다.** 

**익숙하지 않은 현장 용어<br>**
**현장에서 발생되는 현상에 대해서만 설명하는 사용자<br>**
**다른 시스템과의 인터페이스를 통한 업무 수행시 찾기 힘든 문제의 원인**

이런 것들이 저를 괴롭히는 동안 운영 요원들은 현장 사람들과 대화하고 현상에 대한 분석을 통해 문제를 일으키는 시스템 모듈을 하나, 둘씩 고쳐나갔습니다. 
고객과의 비즈니스적 의사소통을 통해 프로그램을 개선해나가는 과정의 중요성을 새삼 깨닫게 되는 경험이었습니다. 

## 1. DevOps 특징
- **Cross Functional Team** 
    - 하나의 팀에 각각 다른 역할을 할 수 있는 팀원들로 모아 전체 END TO END 서비스를 운용할 수 있도록 합니다. 
    - 뛰어난 개발자이자 비즈니스 전문성까지 갖추고 있는 인원들만 있다면 좋겠지만 현실은 그렇지 않습니다. 

- **Widely Shared Metris**
    - 팀 전체가 기준으로 삼을 수 있는 서비스에 대한 공통적인 지표(Metric)가 필요합니다.

- **Automating Repetitive Tasks**
    - 반복적인 작업을 Tool을 이용해서 자동화 합니다. 
    - CI/CD Tool을 통해 빌드, 테스트에서 배포까지의 과정을 자동화하여 관리하는 것을 의미합니다. 

- **Post Mortems**
    - 사후 검증. 장애나 이슈가 있을때 처리 후에 그 내용을 전체 팀과 공유해야 합니다.

- **Regular Release**
    - 정기적인 배포. 시스템 릴리즈는 많은 협업이 필요한 작업입니다. 
    - 개발, 테스트, 배포 과정을 거쳐야 하고, 릴리즈가 끝나면 다음 릴리즈를 위한 기능 정의 등의 과정을 거쳐야 합니다.

## 2. Devops 팀의 개발 싸이클
1. 사용자의 NEEDS 분석. VOC 수집
1. 사용자 스토리 작성 (요구 사항 작성)
1. 사용자 스토리에 대한 SCOPE 정의 및 우선순위 지정
1. Stakeholder에 대한 리포팅 및 관리 (내부 영업, 보고 등)
1. 다른 프로젝트와 연관성(DEPENDENCY) 관리
1. 필요의 경우 솔루션 (오픈소스 또는 상용) 평가 및 도입
1. 개발
1. TESTING
1. RELEASE
1. Security 관리, Compliance 관리 (개인 정보 보호, 국가별 법적 사항 확인 등)
1. 서비스 운영, 모니터링
1. 고객 지원 (Customer Support)

## 3. Devops 팀 개발자의 필요 역량
- **코딩 능력은 필수**
    - Devops 엔지니어는 기본적으로 개발자이기 때문에, **개발을 위한 기본적인 코딩 능력을 요구합니다.** 
    - 만약 운영이나 시스템 쪽에 치우친 엔지니어라면 자동화를 만들 수 있는 스크립트 작성 능력 등은 필수입니다.

- **다른 사람과 잘 협업하고 커뮤니케이션할 수 있는 능력**
    - **Devops는 큰 틀에서 협업 문화입니다.** 시작 자체가 개발과 운영간의 소통 문제를 해결하고자 한 것이기 때문입니다. 
    - 다른 팀원의 의견을 존중하고 문제를 함께 해결해나갈 수 있는 오픈 마인드 기반의 커뮤니케이션 능력이 매우 중요합니다.

- **프로세스를 이해하고 때로는 그 프로세스를 재정의할 수 있는 능력**
    - Devops는 언뜻 보기에는 정형화된 프로세스가 없어 보일 수 있지만, **테스트 자동화, 배포, 그리고 요구 사항에 대한 수집 및 정의 등은 모두 프로세스입니다.**
    - 해당 팀의 모델이나 서비스의 성격에 따라서 만들어 나가야 합니다. 그래서 프로세스를 이해하고 준수하며, 같이 만들어 나갈 수 있는 능력을 가져야 합니다.

#### REFERENCE
- <https://bcho.tistory.com/817>

[blog-link]: https://bcho.tistory.com/817