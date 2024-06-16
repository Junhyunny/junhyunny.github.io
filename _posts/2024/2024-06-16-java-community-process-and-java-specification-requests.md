---
title: "JCP(Java Community Process)/JSRs(Java Specification Requests)"
search: false
category:
  - java
last_modified_at: 2024-06-16T23:55:00
---

<br/>

## 0. 들어가면서

스프링 공식 문서를 보면 `JSR-XXX`에 관련된 내용을 종종 눈에 띈다. 이번 글은 스프링 프레임워크 공식 문서에 등장하는 `JSR`에 대해 정리했다. 

- [Using JSR 330 Standard Annotations](https://docs.spring.io/spring-framework/reference/core/beans/standard-annotations.html)
- [Using JSR-160 Connectors](https://docs.spring.io/spring-framework/reference/integration/jmx/jsr160.html#jmx-jsr160-protocols)
- [JSR-305 meta-annotations](https://docs.spring.io/spring-framework/reference/core/null-safety.html#jsr-305-meta-annotations)
- [Authorizing Method Invocation with JSR-250 Annotations](https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html#use-jsr250)

## 1. Java Community Process

`JSRs` 개념을 정확히 이해하려면 먼저 자바 커뮤니티 프로세스(JCP, Java Community Process) 프로그램을 알아야 한다. JCP 프로그램은 이해 당사자들이 자바에 대한 표준 기술 사양을 개발할 수 있도록 1998년 설립된 공식적인 프로세스다. 오라클(oracle)과 자바 커뮤니티가 자바 플랫폼, SE(standard edition), Jakarta EE(enterprise edtition) 및 관련 기술을 개발하고 발전시키기 위해 공동으로 협력한다. JCP 집행 위원회는 자바 플랫폼의 새로운 기능을 제안한 내용인 JSRs(Java Specification Requests)을 승인하거나 새로운 JSRs을 만들기도 한다. 

자바는 강력한 오픈소스 프로젝트이므로 많은 곳에서 사용하고 있다. 그렇기 떄문에 새로운 기능을 도입하려면 관련 전문가들 사이의 많은 논의와 승인이 필요하다. 전 세계에 500개 이상의 자바 사용자 그룹이 있으며 이 [링크](https://dev.java/community/jugs/)에서 확인할 수 있다. JCP 프로그램은 다음 같은 책임을 갖는다.

- 표준화(standardization)
  - 자바 플랫폼을 개발하고 발전시키기기 위한 표준화 된 프로세스를 제공한다.
  - 다양한 구현 및 플랫폼에서 일관되고 상호 운용 가능하도록 보장한다.
- 커뮤니티(community)
  - 자바 플랫폼 개발에 참여할 수 있는 방법을 제공한다.
  - 누구나 JCP에 가입해 새로운 기능과 기술 개발에 기여할 수 있다.
- 혁신(innovation)
  - 새로운 기능과 기술을 제안하고 개발하기 위한 프레임워크를 제공한다.
  - 자바가 관련성 있고 업계 최신 트렌드와 기술을 최신 상태로 유지하도록 돕는다.
- 호환성(compatibility)
  - 기술을 개발하고 테스트하기 위한 엄격한 프로세스를 제공한다.
  - 서로 다른 자바 구현과 플랫폼에 대한 호환성과 안정성을 보장한다.

## 2. Java Specification Requests

자바 요청 명세서(JSR, Java Specification Requests)는 새로운 자바 사양을 개발하거나 기존 자바 사양을 업데이트하기 위한 제안이다. 각 JSR 리뷰 결과나 릴리즈 관련된 정보는 [JCP 사이트](https://jcp.org/en/home/index)에서 확인할 수 있다.

자바 요청 명세서 제안부터 릴리즈까지 작업은 다음과 같은 타임라인(timeline)을 따라 진행된다.

1. Initiation (14일 소요)
  - JSR: Request to develop new spec/revise existing spec via html template. Submission of JSR
  - JSR Review & JSR Approval Ballot by EC
2. Early Draft (30-90일 소요)
  - Formation of expert group
  - Write first draft
  - Early Draft Review
  - Updates to the draft (optional)
3. Complete the Specification, Public Draft/Final Release
  - Public Review (30-90일 소요)
  - Drafts updates (optional)
  - Draft Specification approval ballot by EC (마지막 7일 소요)
  - Proposed final draft
  - Completion of RI and TCK
  - Final draft Submission
  - Final approval ballot by EC (14일 소요)
  - Final release
4. Maintenance
  - Maintenance updates
  - Maintenance reviews (30일 소요)
  - EC item exception vote (마지막 7일 소요)

타임라인의 이벤트마다 참여자가 다르다. 참여자는 대중(public), 전문가(스펙 리드 혹은 전문가 그룹), 멤버로 나뉜다. 각 타임라인 참여자에 대한 자세한 내용을 확인하고 싶다면 [JSR 타임라인](https://jcp.org/en/introduction/timeline#detailed) 링크를 참조하길 바란다.

#### REFERENCE

- <https://jcp.org/en/home/index>
- <https://jcp.org/en/introduction/timeline>
- <https://en.wikipedia.org/wiki/Java_Community_Process>
- <https://bell-sw.com/blog/java-community-process-jcp-shaping-the-future-of-java/>
- <https://soujava.org.br/2023/04/27/what-is-the-java-community-process-jcp/>
- <https://docs.spring.io/spring-framework/reference/core/beans/standard-annotations.html>
- <https://docs.spring.io/spring-framework/reference/integration/jmx/jsr160.html#jmx-jsr160-protocols>
- <https://docs.spring.io/spring-framework/reference/core/null-safety.html#jsr-305-meta-annotations>
- <https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html#use-jsr250>
