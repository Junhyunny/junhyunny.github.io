---
title: "Maven 여러 원격 저장소 사용하기"
search: false
category:
  - information
  - maven
last_modified_at: 2026-01-12T01:00:00
---

<br/>

## 1. Problem Context

공공 기관 레거시 시스템 기능 확장 프로젝트를 진행하게 되었는데 레거시 코드를 보자마자 당혹스러웠다. 형상 관리가 잘 되고 있지 않아서 컴파일이 되지 않는 상태였다. 라이브러리들을 프로젝트 폴더에 직접 관리하고 있었는데, 프로젝트와 함께 관리되지 않는 의존성(dependency)들도 있었다. 프로젝트 빌드 툴(tool)을 메이븐(maven)으로 변경하고, 필요한 의존성들을 원격에서 받기로 결정하였다. 다음과 같은 에러가 발생했다.

- 원격 저장소에 해당 의존성이 존재하지 않는다는 에러이다. 

```
Could not find artifact *** in central (https://repo.maven.apache.org/maven2)
```

<div align="left">
  <img src="/images/posts/2021/maven-using-multiple-repositories-01.png" width="80%" class="image__border">
</div>

## 2. Solve the problem

[메이븐 저장소][simplecaptcha-link]를 가면 해당 라이브러리를 제공하는 것처럼 보이지만, 실제론 다른 저장소에 의존성이 존재한다. 실제 저장소의 URL을 확인하고, 이를 `pom.xml` 파일에 명시하면 문제를 해결할 수 있다.

- 실제 저장소는 오른쪽의 `Repository` 버튼을 통해 확인한다. 

<div align="center">
  <img src="/images/posts/2021/maven-using-multiple-repositories-02.png" width="80%" class="image__border">
</div>

<br />

`pom.xml` 파일에 명시적으로 의존성 레포지토리 url 주소를 명시한다. 

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

- <https://maven.apache.org/guides/mini/guide-multiple-repositories.html>
- <https://mvnrepository.com/artifact/nl.captcha/simplecaptcha/1.2.1>

[simplecaptcha-link]: https://mvnrepository.com/artifact/nl.captcha/simplecaptcha/1.2.1