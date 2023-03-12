---
title: "Using External Jar in Maven"
search: false
category:
  - information
  - maven
last_modified_at: 2021-08-28T01:00:00
---

<br/>

## 1. Add External Jar as Dependency

다음과 같은 규칙을 따라 `pom.xml` 파일에 의존성을 추가합니다. 

* External dependencies (library jar location) can be configured in pom.xml in same way as other dependencies.
* Specify groupId same as the name of the library.
* Specify artifactId same as the name of the library.
* Specify scope as system.
* Specify system path relative to the project location.

##### Library Directory

* 필요한 의존성들을 프로젝트 특정 폴더에 옮겨 놓습니다. 
    * 예시에선 `/src/libs` 폴더를 사용하였습니다.

<p align="center">
    <img src="/images/maven-using-external-jar-1.JPG" width="80%" class="image__border">
</p>

##### pom.xml

* `pom.xml`에 프로젝트 디렉토리를 상대 경로로 의존성을 추가합니다.

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

* <https://www.tutorialspoint.com/maven/maven_external_dependencies.htm>