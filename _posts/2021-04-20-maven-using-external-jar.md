---
title: "Maven - external jar 사용하기"
search: false
category:
  - information
  - maven
last_modified_at: 2021-08-28T01:00:00
---

<br/>

## 1. external jar - dependency 추가하기
다음과 같은 규칙으로 dependency를 추가하면 됩니다. 
- External dependencies (library jar location) can be configured in pom.xml in same way as other dependencies.
- Specify groupId same as the name of the library.
- Specify artifactId same as the name of the library.
- Specify scope as system.
- Specify system path relative to the project location.

규칙대로 필요한 라이브러리를 **`/src/libs`** 폴더에 옮겨 놓고 pom.xml 파일에 아래와 같이 의존성을 추가합니다.

##### /src/libs 폴더
<p align="left"><img src="/images/maven-using-external-jar-1.JPG" width="75%"></p>

##### pom.xml 파일
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