---
title: "Using Multiple Remote Repositories in Maven"
search: false
category:
  - information
  - maven
last_modified_at: 2021-08-28T01:00:00
---

<br/>

## 1. Context of the problem

공공 기관 레거시 시스템 기능 확장 프로젝트를 진행하게 되었는데 레거시 코드를 보자마자 당혹스러웠습니다. 
형상 관리가 잘 되고 있지 않아서 컴파일이 되지 않는 상태였습니다. 
라이브러리들을 프로젝트 폴더에 직접 관리하고 있었는데, 없는 의존성(dependency)들이 있었습니다. 
프로젝트 빌드 툴(tool)을 메이븐(maven)으로 변경하고, 필요한 의존성들을 원격에서 받기로 결정하였습니다.  

##### Error when build

다음과 같은 에러가 발생했습니다.

* 원격 저장소에 해당 의존성이 존재하지 않는다는 에러입니다. 

```
Could not find artifact *** in central (https://repo.maven.apache.org/maven2)
```

<p align="left">
    <img src="/images/maven-using-multiple-repositories-1.JPG" width="80%" class="image__border">
</p>

## 2. Solving the problem

[메이븐 저장소][simplecaptcha-link]를 가면 해당 라이브러리를 제공하는 것처럼 보이지만, 실제론 다른 저장소에 의존성이 존재합니다. 
실제 저장소의 URL을 확인하고, 이를 `pom.xml` 파일에 명시해주면 문제를 해결할 수 있습니다. 

##### Check Repository

* 실제 저장소는 오른쪽의 `Repository` 버튼을 통해 확인합니다. 

<p align="center">
    <img src="/images/maven-using-multiple-repositories-2.JPG" width="80%" class="image__border">
</p>

##### Declare Real Repository URL

* `pom.xml` 파일에 `url` 정보를 명시합니다. 

```xml
    <repositories>
        <repository>
            <id>onehippo-repository</id>
            <name>Onehippo Repository for Maven</name>
            <url>https://maven.onehippo.com/maven2/</url>
        </repository>
    </repositories>
```

#### REFERENCE

* <https://maven.apache.org/guides/mini/guide-multiple-repositories.html>
* <https://mvnrepository.com/artifact/nl.captcha/simplecaptcha/1.2.1>

[simplecaptcha-link]: https://mvnrepository.com/artifact/nl.captcha/simplecaptcha/1.2.1