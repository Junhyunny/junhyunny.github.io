---
title: "Maven - external jar 사용하기"
search: false
category:
  - information
  - maven
last_modified_at: 2021-04-20T09:00:00
---

<br>

오래된 레거시 시스템의 기술 부채를 해결하는 프로젝트를 하나 맡아서 진행하고 있습니다. 
현재 유지보수하고 있다는 코드와 개발 환경을 클라우드로 전달받았는데 눈 앞이 캄캄해졌습니다. 
**`'이거.. 기술 부채 수준이 아닌데?'`**🥶 
사용하는 IDE가 Eclipse Kepler(since 2013), JDK1.7, Tomcat 6 그리고 당시 해당 프로젝트를 맡았던 솔루션 업체의 자체 라이브러리로 코드가 범벅이 되어 있었습니다.

클라이언트의 요구사항은 다음과 같습니다. 
1. 최신 기술 스택으로 변경
1. 로그인 시 세션에 문제가 있는데 이를 해결
1. 기술 지원이 안되는 솔루션 업체의 라이브러리 제거
1. 위 3개의 사항을 5월 말까지 보완 완료하기

눈 앞이 캄캄해집니다. 
**'일단 모르겠고 4월 말까지는 내 로컬에 서비스를 띄워보자.'**라는 생각으로 작업에 착수하였습니다.
코드를 모두 옮겨 놓고 필요한 의존성들을 pom.xml 파일에 추가하니 컴파일 에러는 많이 줄었습니다. 
마지막으로 일부 central repository에 없는 라이브러리들과 솔루션 회사의 라이브러리들을 추가하는 작업을 진행하려고 보니 
Maven도 external jar를 사용하는 방법이 있을 것 같다는 생각이 들었습니다. 
찾아보니 역시나 방법이 존재하였고 해당 내용을 정리하였습니다.

## external jar - dependency 추가하기
다음과 같은 규칙으로 dependency를 추가하면 됩니다. 
- External dependencies (library jar location) can be configured in pom.xml in same way as other dependencies.
- Specify groupId same as the name of the library.
- Specify artifactId same as the name of the library.
- Specify scope as system.
- Specify system path relative to the project location.

규칙대로 필요한 라이브러리를 **`/src/libs`** 폴더에 옮겨 놓고 pom.xml 파일에 아래와 같이 의존성을 추가하였습니다.

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

## OPINION
분명 주석을 보면 2017년에 개발한 코드인데 사용하고 있는 기술 스택이 대체...? 
최신 프레임워크에는 deprecated 된 클래스들을 사용하고 있고 하드 코딩된 코드들이 많았습니다. 
테이블도 수 백개가 넘는데 사용하는건 30개 안팍인 것 같고, 국가 사업은 SI 업체들이 돌아가면서 작업하다보니 엉망이라 했었는데 사실이었습니다. 
엉터리로 작업된 코드들을 보고 있자니 빨리 서비스 기업으로 이직하고 싶은 마음이 더 굴뚝 같아졌습니다. 
오늘도 화이팅!

#### REFERENCE
- <https://www.tutorialspoint.com/maven/maven_external_dependencies.htm>