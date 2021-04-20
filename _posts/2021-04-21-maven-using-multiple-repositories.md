---
title: "Maven - multiple remote repository 사용하기"
search: false
category:
  - information
  - maven
last_modified_at: 2021-04-21T00:00:00
---

<br>

최근 공공 기관 레거시 시스템의 기술 부채를 덜어내는 프로젝트를 맡게 되었습니다. 
컴파일도 되지 않는 기존 레거시 시스템 코드를 전달받았을 땐 어찌나 답답하던지...😭 
기존 시스템 운영자도 인수인계 받은 뒤에 한번도 빌드해 본 적이 없다는 말에 할 말을 잃었습니다. 

일단 빌드시키기 위해 코드 옮기는 작업과 정말 불가피하게 필요한 라이브러리들만 옮기는 작업을 수행하였습니다. 
컴파일 에러가 나는 클래스들의 의존성(dependency)을 찾아서 pom.xml에 추가하는 중에 이상한 문제가 발생했습니다. 

##### Could not find artifact *** in central (https://repo.maven.apache.org/maven2)
<p align="left"><img src="/images/maven-using-external-jar-1.JPG" width="80%"></p>

[MVN Repository][mvn-repository-link]에는 버젓이 제공하는 것처럼 올려두고 실제로는 없다구요?😡 
일단 작업이 급하니 이런 에러가 나는 의존성들은 모두 레거시 시스템에서 그대로 들고 왔습니다. 

## Maven - Multi Remote Repository 사용하기
생각보다 작업이 빠르게 진행되어 여유가 생겼습니다. 
아까 central repository에서 못 찾은 의존성과 관련되어 여기 저기 찾아보니 이런 링크를 발견할 수 있었습니다.(등잔 밑이 어두웠습니다.) 

##### OneHippo Repository 발견
<p align="left"><img src="/images/maven-using-external-jar-2.JPG" width="80%"></p>

**`'기본 central repository가 아니라 다른 remote repository에 존재하는구나!'`** 
삽질로 또 한가지 깨달음을 얻었습니다. 
이제 다른 저장소에 있다는 사실을 알았으니 다른 저장소에서 해당 의존성을 가져오기 위한 설정을 추가할 차례입니다. 

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
<p align="left"><img src="/images/maven-using-external-jar-3.JPG" width="80%"></p>

## OPINION
이틀 동안 작업해서 기존 레거시 시스템에서 사용하던 오래된 프레임워크 의존성들은 일부 덜어냈습니다. 
서비스 기동과 간단하게 데이터를 조회하는 테스트까지도 성공하였습니다. 
기존 시스템의 문제점을 한번에 처리할 수는 없지만 이제부터 코드 리팩토링을 진행하면서 불필요한 부분들은 섬세하게 발라내야 할 것 같습니다. 

#### REFERENCE
- <https://maven.apache.org/guides/mini/guide-multiple-repositories.html>

[mvn-repository-link]: https://mvnrepository.com/artifact/nl.captcha/simplecaptcha/1.2.1