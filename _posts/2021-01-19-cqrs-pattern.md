---
title: "CQRS(Command Query Responsibility Segregation) Pattern"
search: false
category: 
  - main project
  - infomation
last_modified_at: 2021-01-20T00:00:00
---

# CQRS(Command Query Responsibility Segregation) Pattern<br>

> CQRS(Command and Query Responsibility Segregation) - 명령과 조회의 책임 분리

마이크로 서비스 아키텍처를 도입하여 시스템 개발을 진행하는 초기에 아키텍처 팀에서 사용할지 고민했던 아키텍처 패턴입니다. 
데이터 정합성, 촉박한 일정과 시스템 구현의 복잡도 증가 등의 이유로 최종적으로 채택되진 못했습니다. 
실제로 구현해보지는 못했지만 해당 아키텍처에 대한 개념은 알고 있으면 좋을 듯하여 글로 정리해보았습니다.

## CQRS 패턴을 사용하게 된 원인

### 기존 아키텍처 패턴
<p align="center"><img src="/images/cqrs-pattern-1.JPG"></p>
<center>이미지 출처, https://martinfowler.com/bliki/CQRS.html</center><br>

기존 시스템에서 사용하는 아키택처 패턴은 다음과 같은 문제점들을 가지고 있습니다.
- 비즈니스 요건 사항이 변경되는 속도를 시스템의 비즈니스 모델 변경이 따라가질 못한다.
- 시스템 규모가 커짐에 따라 리소스 교착 상태가 심각해진다.
- 일반적으로 데이터 변경이 이루어지는 CUD 기능보다 데이터 조회를 위한 R 기능에 대한 사용량이 많으며 
  기존 아키택처 패턴을 가지는 서비스의 스케일 아웃(scale out)은 비효율적인 운영 방식이다. 

## CQRS 패턴의 이점/약점

### CQRS 아키택처 패턴
<p align="center"><img src="/images/cqrs-pattern-2.JPG"></p>
<center>이미지 출처, https://martinfowler.com/bliki/CQRS.html</center><br>

이를 해결하기 위한 방법으로 CUD 기능과 R 기능을 분할한 CQRS 패턴 고안되었습니다. 
시스템에서 쓰기/조회 기능을 분리하고, 나아가서 물리적으로 저장소를 따로 준비하게 된다면 조회 대기 시간을 줄이는 등의 이점을 얻을 수 있습니다. 
구체적으로 어떤 이점을 얻을 수 있는지 알아보았습니다.
- CQRS를 통해 읽기/쓰기 워크로드를 독립적으로 확장할 수 있습니다.
- 더 적은 수의 LOCK 경합이 발생할 수 있습니다.
- 읽기 쪽에서는 쿼리에 최적화된 스키마를 사용하는 반면 쓰기 쪽에서는 업데이트에 최적화된 스키마를 사용할 수 있습니다.
- 올바른 도메인 엔터티만 데이터에서 쓰기를 수행할 수 있는지 쉽게 확인할 수 있습니다.
- 읽기 데이터베이스에 구체화된 뷰를 저장하여 쿼리할 때 애플리케이션은 복잡한 조인을 사용하지 않을 수 있습니다.
- 읽기 및 쓰기 쪽을 구분하면 유지 가능하고 유연한 모델을 생성할 수 있습니다. 
  대부분의 복잡한 비즈니스 논리는 쓰기 모델로 이동합니다. 읽기 모델은 상대적으로 간단할 수 있습니다.

<br>
CQRS 단점에 대해 알아보도록 하겠습니다.
- CQRS의 기본 개념은 간단합니다. 하지만 이벤트 소싱 패턴을 포함하는 경우에는 애플리케이션 디자인이 특히 더 복잡해질 수 있습니다.
- 명령을 처리하고 업데이트 이벤트를 게시하는데 공통적으로 메시징을 사용합니다. 이 경우에 애플리케이션은 메시지 오류 또는 중복 메시지를 처리해야 합니다.
- 읽기 및 쓰기 데이터베이스를 구분하는 경우 읽기 데이터는 기한이 경과되었을 수 있습니다. (신뢰성 떨어지는 읽기 데이터)

## CQRS 패턴과 이벤트 소싱(Event sourcing)
CQRS 패턴에 대해 이야기할 때 이벤트 소싱에 대한 언급이 항상 빠지지 않기에 간단히 정리해보았습니다. 
이벤트 소싱에 대한 자세한 내용은 추후에 다뤄보겠습니다. 

> 어플리케이션이 모든 상태 변화를 순서에 따라 이벤트로 보관한다. - 마틴 파울러

**CQRS 패턴에 이벤트 소싱은 필수가 아니지만 이벤트 소싱에 CQRS 패턴은 필수입니다.** 
이벤트 소싱의 경우 어플리케이션의 발생한 모든 이벤트를 DB에 저장하고 데이터를 조회할 때 발생한 이벤트들을 모두 재실행하여 나온 결과를 반환합니다. 
이벤트 수가 적은 경우에는 문제가 되지 않지만 쌓인 이벤트가 많아지면 성능에 큰 문제가 발생합니다. 
이런 성능 문제를 snapshot 개념과 CQRS 패턴을 적용하여 해소합니다. (snapshot 기능은 추후 이벤트 소싱에 대해 다루는 글에서 설명)

### CQRS 아키택처 패턴과 이벤트 소싱
<p align="center"><img src="/images/cqrs-pattern-3.JPG"></p>
<center>이미지 출처, https://github.com/jaceshim/springcamp2017/blob/master/springcamp2017_implementing_es_cqrs.pdf</center><br>

## OPINION
이 글에서 CQRS 패턴과 항상 같이 언급되는 이벤트 소싱에 대한 내용도 함께 정리해보았습니다. 
실제로 이 패턴을 적용해보지는 않아 이해도가 높지는 않습니다. 
시스템에 적용하였을 때 얻을 수 있는 이점이나 발생되는 장애, 어려움과 같은 이야기를 함께 적으면 더 좋은 글이 되었을거라 생각하니 아쉽습니다. 
후에 이벤트 소싱에 대한 개념을 더 자세히 다뤄보고 이를 구현해보도록 하겠습니다.

#### 참조글
- <https://martinfowler.com/bliki/CQRS.html>
- <https://docs.microsoft.com/ko-kr/azure/architecture/patterns/cqrs>
- <https://www.popit.kr/cqrs-eventsourcing/>
- <https://engineering-skcc.github.io/microservice%20outer%20achitecture/inner-architecture-cqrs/>
- <https://github.com/jaceshim/springcamp2017/blob/master/springcamp2017_implementing_es_cqrs.pdf>