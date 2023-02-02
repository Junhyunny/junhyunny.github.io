---
title: "Maven - multiple remote repository 사용하기"
search: false
category:
  - information
  - maven
last_modified_at: 2021-08-28T01:00:00
---

<br/>

## 1. 문제 상황

최근 공공 기관 레거시 시스템의 기능 확장 프로젝트를 맡게 되었습니다. 
형상 관리가 잘 되고 있지 않아서 컴파일이 되지 않는 기존 레거시 시스템 코드를 전달받았을 땐 굉장히 당황스러웠습니다. 
기존 시스템 운영자도 인수인계 받은 뒤에 한번도 빌드해 본 적이 없다는 말에 할 말을 잃었습니다. 
컴파일 에러가 나는 클래스들의 의존성(dependency)을 찾아서 pom.xml에 추가하는 중에 이상한 문제가 발생했습니다. 

##### Could not find artifact *** in central (https://repo.maven.apache.org/maven2)
<p align="left"><img src="/images/maven-using-multiple-repositories-1.JPG" width="75%"></p>

실제 [MVN Repository][mvn-repository-link]를 보면 해당 라이브러리를 제공하는 것처럼 보입니다. 
메이븐(maven)은 해당 라이브러리를 찾지 못 했는데, 그 이유는 `https://repo.maven.apache.org/maven2` 저장소에는 없기 때문입니다. 

## 2. Maven - Multi Remote Repository 사용하기
실제로 해당 라이브러리는 `https://maven.onehippo.com/maven2/` 저장소에서 관리되고 있습니다. 
해당 라이브러리 버전 오른편을 보면 다음과 같은 링크를 발견할 수 있었습니다. 

##### OneHippo Repository
<p align="center"><img src="/images/maven-using-multiple-repositories-2.JPG" width="80%"></p>

> **`'기본 central repository가 아니라 다른 remote repository에 존재하는구나!'`** 

삽질을 통해 또 한가지 배움을 얻었습니다. 
다른 저장소에 있다는 사실을 알았으니 다른 저장소에서 해당 의존성을 가져오기 위한 설정을 추가할 차례입니다. 

##### pom.xml - 다른 원격 저장소 추가하기
```xml
    <repositories>
        <repository>
            <id>onehippo-repository</id>
            <name>Onehippo Repository for Maven</name>
            <url>https://maven.onehippo.com/maven2/</url>
        </repository>
    </repositories>
```

##### 정상적인 의존성 추가 확인
<p align="left"><img src="/images/maven-using-multiple-repositories-3.JPG" width="50%"></p>

#### REFERENCE
- <https://maven.apache.org/guides/mini/guide-multiple-repositories.html>

[mvn-repository-link]: https://mvnrepository.com/artifact/nl.captcha/simplecaptcha/1.2.1