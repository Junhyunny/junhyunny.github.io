---
title: "Maven CheckStyle 적용"
search: false
category:
  - information
  - maven
last_modified_at: 2021-04-28T00:00:00+09:00
---

<br>

현재 작은 팀으로 일하고 있지만 많은 부분들을 정립해나가는 중 입니다. 
서로 코드를 작성하는 방식이 다르다보니 각자 작업하는 방식이 아니면 코드를 확인하는데 어려움이 있었습니다. 
그리고 서로가 작업한 코드에 대해 자기 주관적으로 지적하는 것도 민망할 뿐입니다.

저희 팀은 이런 상황을 개선하기 위해 maven plugin codestyle을 적용하기로 결정하였습니다. 
코드 품질에 대해 객관적인 판단 요소가 될 수 있고, 하나의 포맷으로 코드를 관리하기 때문에 누가 작성한 코드라도 가독성이 좋을 것으로 기대됩니다. 
무엇보다 빌드가 되지 않도록 막아둘 것이기 때문에 공식적인 지적질(?)을 할 수 있습니다.😃 
적용기에 대해 하나씩 작성해보겠습니다. 

##### google_checks.xml 다운로드
- 아래 링크로 접속하여 google_checks.xml 파일을 다운받아 프로젝트 root path에 위치시킵니다.
- 해당 파일은 구글에서 사용하는 코드 스타일 체크 규칙입니다.
- <https://github.com/checkstyle/checkstyle/blob/master/src/main/resources/google_checks.xml>

##### google_checks.xml 파일 디렉토리 위치
<p align="left"><img src="/images/maven-checkstyle-1.JPG" width="35%"></p>

##### 코드 스타일 변경
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

##### pom.xml 파일 plugin 추가

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

어김없이 발생하는 에러. 
역시 한번에 되는 일은 없습니다. 
즐기면서 가보도록 하겠습니다. 

##### 발생 에러, checkstyle failed, given name COMPACT_CTOR_DEF
<p align="center"><img src="/images/maven-checkstyle-2.JPG" width="50%"></p>

관련된 내용을 찾아보니 maven-checkstyle-plugin에서 checkstyle에 해당하는 특정 버전을 찾지 못한다는 내용이 있습니다. 
필요한 checkstyle 관련 dependency를 추가하면 해결된다고 합니다. 

##### StackOverflow 답변
<p align="center"><img src="/images/maven-checkstyle-3.JPG" width="70%"></p>

##### 변경 pom.xml

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

관련된 dependency를 추가하니 또 다른 에러가 발생합니다. 
RecordComponentName 클래스를 찾지 못한다고 합니다. 
하... 즐기면서 가보도록 하겠습니다...😂 

##### RecordComponentName class not found error
<p align="center"><img src="/images/maven-checkstyle-4.JPG" width="70%"></p>

검색해보니 `com.puppycrawl.tools.checkstyle` 라이브러리에서 특정 버전부터 제공해주는 기능으로 확인됬습니다. 
API 문서를 확인해보니 해당 내용을 찾을 수 있었습니다. 
확인 후 관련된 버전을 올렸습니다. 

##### Codestyle API Docs
<p align="center"><img src="/images/maven-checkstyle-5.JPG" width="70%"></p>
<center>이미지 출처, https://checkstyle.sourceforge.io/config_naming.html</center><br>

##### 변경 pom.xml

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

이후 빌드를 하니 정상적으로는 동작하는데 이상합니다. 
분명히 일부러 잘못된 코드 스타일로 작성하여 warning은 발생하는데 빌드가 성공합니다. 
아씨... 즐기면서...🤬 

##### Warning 그리고 빌드 성공
<p align="center"><img src="/images/maven-checkstyle-6.JPG" width="70%"></p>

##### 잘못된 코드 스타일
- 들여쓰기와 중괄호 `{}` 위치를 어긋나게 작성해두었습니다. 

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

이에 대해 확인해보니 위반에 대한 심각성을 어느 레벨에서 측정할 것인지 설정으로 추가해줘야지 warning에서도 빌드를 실패시킬 수 있다고 합니다. 
관련된 설정을 추가하였습니다. 
**이제 마지막이길 바랍니다. 잘 시간이 한참 지났습니다.**

##### Stackoverflow 답변
<p align="center"><img src="/images/maven-checkstyle-7.JPG" width="60%"></p>
<center>이미지 출처, https://stackoverflow.com/questions/50681818/run-maven-checkstyle-and-fail-on-errors</center><br>

##### 최종 pom.xml

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

성공적으로 빌드를 실패시켰습니다. 
자기 전까지 코드 정리 후 빌드 에러가 나지 않도록 작업하고 올려야겠습니다. 
글 정리는 언제할지 막막해지는 순간입니다.

##### 잘못된 스타일 감지 및 빌드 에러
<p align="center"><img src="/images/maven-checkstyle-8.JPG" width="70%"></p>

## OPINION
해당 포스트는 제 개인 블로그에 작성하였지만 팀 블로그에도 같은 내용으로 작성 후 공유해야겠습니다. 
제가 얼마나 고생했는지 팀원들에게 생색을 내기 위해서입니다.🤣 
코드 스타일이 반영된 프로젝트는 [Geneuin/spring-backend-template][github-repo-link]에서 확인 가능합니다. 

#### REFERENCE
- <https://sg-choi.tistory.com/101>
- <https://checkstyle.sourceforge.io/config_naming.html>
- <https://stackoverflow.com/questions/50681818/run-maven-checkstyle-and-fail-on-errors>
- <https://stackoverflow.com/questions/63852780/creating-a-customized-version-of-the-google-java-checkstyle-xml-file/64694410#64694410>

[github-repo-link]: https://github.com/Geneuin/spring-backend-template