---
title: "Maven CheckStyle 적용하기"
search: false
category:
  - information
  - maven
last_modified_at: 2021-08-28T02:30:00
---

<br/>

👉 이어서 읽기를 추천합니다.
- [IntelliJ Google CodeStyle 적용하기][google-codestyle-link]

## 0. 들어가면서

현재 작은 팀으로 일하고 있지만 많은 부분들을 정립해나가는 중 입니다. 
서로 코드를 작성하는 방식이 다르다보니 각자 작업하는 방식이 아니면 코드를 확인하는데 어려움이 있었습니다. 
그리고 서로가 작업한 코드에 대해 자기 주관적으로 지적하는 것도 민망할 뿐입니다.

저희 팀은 이런 상황을 개선하기 위해 maven plugin codestyle을 적용하기로 결정하였습니다. 
코드 품질에 대해 객관적인 판단 요소가 될 수 있고, 하나의 포맷으로 코드를 관리하기 때문에 누가 작성한 코드라도 가독성이 좋을 것으로 기대됩니다. 
무엇보다 빌드가 되지 않도록 막아둘 것이기 때문에 공식적인 지적질(?)을 할 수 있습니다. 
적용기에 대해 하나씩 작성해보겠습니다. 

## 1. google_checks.xml 다운로드
- 아래 링크로 접속하여 google_checks.xml 파일을 다운받아 프로젝트 root path에 위치시킵니다.
- 해당 파일은 구글에서 사용하는 코드 스타일 체크 규칙입니다.
- <https://github.com/checkstyle/checkstyle/blob/master/src/main/resources/google_checks.xml>

### 1.1. google_checks.xml 파일 디렉토리 위치
- 해당 파일 위치는 어디든 상관없습니다. 
- 프로젝트와 함께 관리될 수 있도록 프로젝트 폴더에 위치시켰습니다.

<p align="left"><img src="/images/maven-checkstyle-1.JPG" width="30%"></p>

## 2. 코드 스타일 커스터마이징(customizing)

### 2.1. 코드 스타일 변경
- 구글 코드 스타일의 들여쓰기(indentation) 크기는 2이므로 이를 4로 조절하였습니다.

```xml
    <module name="Indentation">
        <property name="basicOffset" value="4"/>
        <property name="braceAdjustment" value="0"/>
        <property name="caseIndent" value="4"/>
        <property name="throwsIndent" value="8"/>
        <property name="lineWrappingIndentation" value="8"/>
        <property name="arrayInitIndent" value="4"/>
    </module>
```

## 3. pom.xml 파일 plugin 추가 및 빌드

```xml

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.build.sourceDirectories>${basedir}/src</project.build.sourceDirectories>
        <checkstyle.config.location>${basedir}/google_checks.xml</checkstyle.config.location>
    </properties>

    ...

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-checkstyle-plugin</artifactId>
                <version>3.1.2</version>
                <configuration>
                    <consoleOutput>true</consoleOutput>
                    <configLocation>${checkstyle.config.location}</configLocation>
                    <sourceDirectories>${project.build.sourceDirectories}</sourceDirectories>
                    <propertyExpansion>suppressionFile=${basedir}/google_checks.xml</propertyExpansion>
                </configuration>
            </plugin>
        </plugins>
    </build>
```

터미널을 열어 다음과 같은 명령어를 작성합니다.
```
  mvn clean checkstyle:checkstyle
```

## 4. 스타일 적용 시 에러 발생

어김없이 에러가 발생하하였습니다. 
역시 한번에 되는 일은 없습니다. 

### 4.1. 발생 에러, checkstyle failed, given name COMPACT_CTOR_DEF

<p align="center"><img src="/images/maven-checkstyle-2.JPG" width="50%"></p>

#### 4.1.1. StackOverflow 답변
관련된 내용을 찾아보니 maven-checkstyle-plugin에서 checkstyle에 해당하는 특정 버전을 찾지 못한다는 내용이 있습니다. 
필요한 checkstyle 관련 dependency를 추가하면 해결된다고 합니다. 

<p align="center"><img src="/images/maven-checkstyle-3.JPG" width="70%"></p>

### 4.1.2. 변경 pom.xml

```xml
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-checkstyle-plugin</artifactId>
                <version>3.1.2</version>
                <dependencies>
                    <dependency>
                        <groupId>com.puppycrawl.tools</groupId>
                        <artifactId>checkstyle</artifactId>
                        <version>8.36</version>
                    </dependency>
                </dependencies>
                <configuration>
                    <consoleOutput>true</consoleOutput>
                    <configLocation>${checkstyle.config.location}</configLocation>
                    <sourceDirectories>${project.build.sourceDirectories}</sourceDirectories>
                    <propertyExpansion>suppressionFile=${basedir}/google_checks.xml</propertyExpansion>
                </configuration>
            </plugin>
        </plugins>
    </build>
```

### 4.2. RecordComponentName class not found error
관련된 dependency를 추가하니 또 다른 에러가 발생합니다. 
RecordComponentName 클래스를 찾지 못한다고 합니다. 

<p align="center"><img src="/images/maven-checkstyle-4.JPG" width="70%"></p>

#### 4.2.1. Codestyle API Docs
검색해보니 `com.puppycrawl.tools.checkstyle` 라이브러리에서 특정 버전부터 제공해주는 기능으로 확인됬습니다. 
API 문서를 확인해보니 해당 내용을 찾을 수 있었습니다. 
확인 후 관련된 버전을 올렸습니다. 

<p align="center"><img src="/images/maven-checkstyle-5.JPG" width="70%"></p>
<center>https://checkstyle.sourceforge.io/config_naming.html</center>

#### 4.2.2. 변경 pom.xml

```xml
      <plugin>
          <groupId>org.apache.maven.plugins</groupId>
          <artifactId>maven-checkstyle-plugin</artifactId>
          <version>3.1.2</version>
          <executions>
              <execution>
                  <goals>
                      <goal>check</goal>
                  </goals>
              </execution>
          </executions>
          <dependencies>
              <dependency>
                  <groupId>com.puppycrawl.tools</groupId>
                  <artifactId>checkstyle</artifactId>
                  <version>8.42</version>
              </dependency>
          </dependencies>
          <configuration>
              <failsOnError>true</failsOnError>
              <consoleOutput>true</consoleOutput>
              <configLocation>${checkstyle.config.location}</configLocation>
              <sourceDirectories>${project.build.sourceDirectories}</sourceDirectories>
              <propertyExpansion>suppressionFile=${basedir}/google_checks.xml</propertyExpansion>
          </configuration>
      </plugin>
```

### 4.3. Error 아닌 Warning 처리
이후 빌드를 하니 정상적으로는 동작하는데 이상합니다. 
빌드 실패 여부를 확인하려고 분명히 일부러 잘못된 코드 스타일로 작성했는데 Warning 후 빌드가 성공하였습니다.

#### 4.3.1. 잘못된 코드 스타일
- 들여쓰기와 중괄호 `{}` 위치를 일부러 어긋나게 작성해두었습니다. 
- 빌드가 실패되기를 기대하고 작성하였습니다. 

```java
package com.geneuin.spring;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GeneuineTemplateApplication {

    public static void main(String[] args)
    {
            SpringApplication.run(GeneuineTemplateApplication.class, args);
    }
}
```

##### Warning 그리고 빌드 성공
<p align="center"><img src="/images/maven-checkstyle-6.JPG" width="70%"></p>

#### 4.3.2. Stackoverflow 답변
이에 대해 확인해보니 위반에 대한 심각성을 어느 레벨에서 측정할 것인지 설정으로 추가해줘야지 warning에서도 빌드를 실패시킬 수 있다고 합니다. 
관련된 설정을 추가하였습니다. 

<p align="center"><img src="/images/maven-checkstyle-7.JPG" width="60%"></p>
<center>https://stackoverflow.com/questions/50681818/run-maven-checkstyle-and-fail-on-errors</center>

#### 4.3.4. 최종 pom.xml 적용

```xml
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-checkstyle-plugin</artifactId>
                <version>3.1.2</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>check</goal>
                        </goals>
                    </execution>
                </executions>
                <dependencies>
                    <dependency>
                        <groupId>com.puppycrawl.tools</groupId>
                        <artifactId>checkstyle</artifactId>
                        <version>8.42</version>
                    </dependency>
                </dependencies>
                <configuration>
                    <violationSeverity>warning</violationSeverity>
                    <failsOnError>true</failsOnError>
                    <consoleOutput>true</consoleOutput>
                    <configLocation>${checkstyle.config.location}</configLocation>
                    <sourceDirectories>${project.build.sourceDirectories}</sourceDirectories>
                    <propertyExpansion>suppressionFile=${basedir}/google_checks.xml</propertyExpansion>
                </configuration>
            </plugin>
        </plugins>
    </build>
```

##### 잘못된 스타일 감지 및 빌드 에러
- 성공적으로 빌드가 실패하였습니다. 

<p align="center"><img src="/images/maven-checkstyle-8.JPG" width="70%"></p>

#### REFERENCE
- <https://sg-choi.tistory.com/101>
- <https://checkstyle.sourceforge.io/config_naming.html>
- <https://stackoverflow.com/questions/50681818/run-maven-checkstyle-and-fail-on-errors>
- <https://stackoverflow.com/questions/63852780/creating-a-customized-version-of-the-google-java-checkstyle-xml-file/64694410#64694410>

[google-codestyle-link]: https://junhyunny.github.io/information/intellij-google-codestyle/