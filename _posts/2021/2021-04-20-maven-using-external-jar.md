---
title: "Mave 외부(external) JAR 사용하기"
search: false
category:
  - information
  - maven
last_modified_at: 2026-01-12T12:00:00
---

<br/>

## 1. Add external JAR as dependency

메이븐(maven)은 다음과 같은 규칙을 따라 `pom.xml` 파일에 의존성을 추가해야 라이브러리를 사용할 수 있다.

- External dependencies (library jar location) can be configured in pom.xml in same way as other dependencies.
- Specify groupId same as the name of the library.
- Specify artifactId same as the name of the library.
- Specify scope as system.
- Specify system path relative to the project location.

메이븐 레포지토리에서 관리하는 의존성이 아닌 서드-파티(3rd party) 라이브러리를 사용할 때 파일 이름과 디렉토리 이름을 위 규칙을 따라 준비한다. 필요한 의존성들을 프로젝트 특정 폴더에 옮겨 놓는다. 예시에선 `/src/libs` 폴더를 사용하였다.

<div align="center">
  <img src="/images/posts/2021/maven-using-external-jar-01.png" width="80%" class="image__border">
</div>

<br />

`pom.xml`에 프로젝트 디렉토리를 상대 경로로 위 외부 JAR 파일들을 의존성으로 추가한다.

```xml
    <dependency>
        <groupId>commons-httpclient</groupId>
        <artifactId>commons-httpclient</artifactId>
        <scope>system</scope>
        <version>3.0.1</version>
        <systemPath>${basedir}/src/libs/commons-httpclient-3.0.1.jar</systemPath>
    </dependency>
    <dependency>
        <groupId>commons-httpclient-contrib</groupId>
        <artifactId>commons-httpclient-contrib</artifactId>
        <scope>system</scope>
        <version>3.1</version>
        <systemPath>${basedir}/src/libs/commons-httpclient-contrib-3.1.jar</systemPath>
    </dependency>
```

#### REFERENCE

- <https://www.tutorialspoint.com/maven/maven_external_dependencies.htm>