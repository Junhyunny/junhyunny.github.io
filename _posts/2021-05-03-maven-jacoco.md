---
title: "Maven JaCoCo 적용하기"
search: false
category:
  - information
  - maven
last_modified_at: 2021-05-03T09:00:00
---

<br>

좋은 서비스 개발에 대한 객관적인 지표를 얻기 위해 코드 커버리지 측정을 수행하자고 팀원들에게 제시하였고 이를 적용하기로 하였습니다. 
현재 팀이 JAVA 언어를 사용하고 있기 때문에 JaCoCo 플러그인을 적용하고 특정 테스트 커버리지를 만족하지 못하면 빌드를 실패시키기로 하였습니다. 
JaCoCo 플러그인을 적용하는 과정을 정리하고 팀원들에게 이를 공유하기로 하였습니다.  
JaCoCo가 무엇인지 공식 레퍼런스의 소개하는 글을 가져왔습니다. 

> JaCoCo(Java Code Coverage)<br>
> JaCoCo is a free code coverage library for Java, which has been created by the EclEmma team based on the lessons learned from using and integration existing libraries for many years. 

해당 플러그인을 적용하면 얻을 수 있는 이점에 대해 생각해보았습니다. 
- 안정적인 시스템을 구축할 수 있습니다.
- 개발자가 생각하지 못한 버그를 개발 단계에서 잡아낼 수 있습니다. 
- 테스트 코드를 적용하면서 필요한 리팩토링을 수행하면서 좋은 코드 작성할 수 있다.

이제 본격적으로 JaCoCo 플러그인을 적용해보도록 하겠습니다.

## pom.xml - JaCoCo 플러그인 추가
우선 JaCoCo 플러그인을 pom.xml 파일에 추가합니다. 
추가한 내용을 바탕으로 각 설정에 대해 정리해보겠습니다. 

```xml
    <plugin>
        <groupId>org.jacoco</groupId>
        <artifactId>jacoco-maven-plugin</artifactId>
        <version>0.8.6</version>
        <configuration>
            <excludes>
                <!-- Exclude class from test coverage -->
                <exclude>**/*com/geneuin/spring/*Application.class</exclude>
            </excludes>
        </configuration>
        <executions>
            <execution>
                <id>jacoco-prepare-agent</id>
                <goals>
                    <goal>prepare-agent</goal>
                </goals>
            </execution>
            <execution>
                <id>jacoco-report</id>
                <goals>
                    <goal>report</goal>
                </goals>
            </execution>
            <execution>
                <id>jacoco-check</id>
                <goals>
                    <goal>check</goal>
                </goals>
                <configuration>
                    <rules>
                        <rule>
                            <element>BUNDLE</element>
                            <limits>
                                <limit>
                                    <counter>INSTRUCTION</counter>
                                    <value>COVEREDRATIO</value>
                                    <minimum>0.80</minimum>
                                </limit>
                            </limits>
                            <element>METHOD</element>
                            <limits>
                                <limit>
                                    <counter>LINE</counter>
                                    <value>TOTALCOUNT</value>
                                    <maximum>30</maximum>
                                </limit>
                            </limits>
                        </rule>
                    </rules>
                </configuration>
            </execution>
        </executions>
    </plugin>
```

`<plugin>...</plugin>` 태그를 이용해 JaCoCo 플러그인을 추가합니다. 
`<executions>...</executions>` 태그 내부를 살펴보면 플러그인 실행에 대한 내용을 정리하고 있는 것으로 보입니다. 
JaCoCo 플러그인을 적용할 때 알아야하는 goal, rule 등에 대해 정리해보겠습니다. 

### JaCoCo Execution Goal
- help - jacoco-maven-plugin의 도움말을 보여주는 명령입니다.
- prepare-agent - 테스트 중인 어플리케이션에서 인수를 전달하는 JaCoCo Runtime Agent에 대한 property를 준비하는 명령입니다.
- prepare-agent-integration - prepare-agent와 같은 기능을 하지만 integration test에 대해서 기본 설정 값들을 제공하는 명령입니다.
- merge - 여러 개의 실행 데이터 파일들을 하나의 파일들로 통합하는 명령입니다.
- report - 하나의 프로젝트의 테스트에 대한 code coverage 리포트를 생성하는 명령입니다.
- report-integration - report와 같은 기능을 하지만 integration test에 대해서 기본 설정 값들을 제공하는 명령입니다.
- aggregate - reacter 안에 있는 여러 프로젝트로부터 code coverage 리포트를 생성하는 명령입니다.
- check - code coverage metric이 충돌하는지 확인하는 명령입니다.
- dump - TCP 서버 모드에서 실행중인 JaCoCo Agent로부터 TCP/IP 덤프(dump)를 요청하는 명령입니다.
- instrument - 오프라인 측정을 수행하는 명령입니다. 테스트 실행 후에, ‘restore-instrumented-classes’ 명령으로 원본 클래스 파일들을 저장해야 합니다. 
- restore-instrumented-class - 오프라인 측정 이전에 원본 파일들을 저장하는 명령입니다. 

### JaCoCo Rule
- JaCoCo 코드 커버리지 기준을 설정할 때 다음과 같은 속성들이 있습니다.
- Element type - 코드 커버리지 체크 기준
  - BUNDLE (default) - 패키지 번들
  - PACKAGE - 패키지
  - CLASS - 클래스
  - SOURCEFILE - 소스파일
  - METHOD - 메소드
- Counter - 코드 커버리지를 측정할 때 사용하는 지표
  - LINE - 빈 줄을 제외한 실제 코드의 라인 수
  - BRANCH - 조건문 등의 분기 수
  - CLASS - 클래스 수
  - METHOD - 메소드 수
  - INSTRUCTION (default) - Java 바이트 코드 명령 수. Java bytecode instruction listings
  - COMPLEXITY - 복잡도. 자세한 복잡도 계산은 Coverage Counters - JaCoCo docs 참고
- Value - 커버한 정도를 나타내는 지표
  - TOTALCOUNT - 전체 개수
  - MISSEDCOUNT - 커버되지 않은 개수
  - COVEREDCOUNT - 커버된 개수
  - MISSEDRATIO - 커버되지 않은 비율. 0부터 1 사이의 숫자로, 1이 100%입니다.
  - COVEREDRATIO (default) - 커버된 비율. 0부터 1 사이의 숫자로, 1이 100%입니다.

### 설정한 내용 정리
#### 특정 클래스 테스트 커버리지 측정 제외
- 서비스 Run을 수행하는 main 메소드가 있는 *Application.class는 테스트 커버리지 측정에서 제거

```xml
    <configuration>
        <excludes>
            <!-- Exclude class from test coverage -->
            <exclude>**/*com/geneuin/spring/*Application.class</exclude>
        </excludes>
    </configuration>
```

#### 측정 기준
- 패키지 번들 단위로 바이트 코드 명령 수에 80% 미만 수행 시 에러
- 메소드의 라인 수가 30이 초과되는 경우 에러
```xml
    <rule>
        <element>BUNDLE</element>
        <limits>
            <limit>
                <counter>INSTRUCTION</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.80</minimum>
            </limit>
        </limits>
    </rule>
    <rule>
        <element>METHOD</element>
        <limits>
            <limit>
                <counter>LINE</counter>
                <value>TOTALCOUNT</value>
                <maximum>30</maximum>
            </limit>
        </limits>
    </rule>
```

## 테스트 커버리지 측정
JaCoCo 플러그인이 정상적으로 적용되었는지 확인하기 위해 테스트 코드를 작성해보았습니다. 
다음과 같은 테스트 코드를 작성 후 maven 명령어를 수행하여 빌드가 정상적으로 수행되는지 확인하였습니다. 
**빌드 실패를 확인하시려면 JacocoTest 클래스의 테스트 코드를 일부 주석하거나 METHOD 제약사항의 maximum 값을 2로 조정해보시면 됩니다.**

### Jacoco 클래스
```java
package com.geneuin.spring.jacoco;

/**
 * Jacoco Class
 */
public class Jacoco {

    /**
     * sum num1, num2
     *
     * @param num1 num1
     * @param num2 num2
     * @return result
     */
    int sum(int num1, int num2) {
        return num1 + num2;
    }

    /**
     * subtract num2 from num1 .
     *
     * @param num1 num1
     * @param num2 num2
     * @return result
     */
    int subtract(int num1, int num2) {
        return num1 - num2;
    }

    /**
     * null check
     *
     * @param obj obj
     * @return result
     */
    boolean isNull(Object obj) {
        if (obj == null) {
            return true;
        }
        return false;
    }
}
```

### JacocoTest 클래스
```java
package com.geneuin.spring.jacoco;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Jacoco Class method test
 */
@SpringBootTest
public class JacocoTest {

    /**
     * sumTest
     */
    @Test
    public void sumTest() {
        Assertions.assertThat(new Jacoco().sum(1, 2)).isEqualTo(3);
    }

    /**
     * subtractTest
     */
    @Test
    public void subtractTest() {
        Assertions.assertThat(new Jacoco().subtract(1, 2)).isEqualTo(-1);
    }

    /**
     * iNullTest
     */
    @Test
    public void isNullTest() {
        Assertions.assertThat(new Jacoco().isNull(null)).isTrue();
        Assertions.assertThat(new Jacoco().isNull(new Object())).isFalse();
    }
}
```

### Maven Lifecycle
- validate > compile > test > package > install > deploy
- `test` phase 이후에 JaCoCo 플러그인에 의해 테스트 커버리지 측정이 가능하므로 `package` 이상부터 가능합니다.

```
$ mvn clean install
```

##### 테스트 커버리지 측정 내용
<p align="center"><img src="/images/maven-jacoco-1.JPG" width="75%"></p>

##### 빌드 실패 시 에러 로그
- 일부 테스트 코드 주석 후 테스트 커버리지 불만족

```java
    /**
     * iNullTest
     */
    @Test
    public void isNullTest() {
        // Assertions.assertThat(new Jacoco().isNull(null)).isTrue();
        // Assertions.assertThat(new Jacoco().isNull(new Object())).isFalse();
    }
```

<p align="center"><img src="/images/maven-jacoco-2.JPG" width="75%"></p>
<p align="center"><img src="/images/maven-jacoco-3.JPG" width="75%"></p>

- pom.xml 파일 변경 후 코드 라인 수 제약사항 불만족

```xml
    <rule>
        <element>METHOD</element>
        <limits>
            <limit>
                <counter>LINE</counter>
                <value>TOTALCOUNT</value>
                <maximum>30</maximum>
            </limit>
        </limits>
    </rule>
```

<p align="center"><img src="/images/maven-jacoco-4.JPG" width="75%"></p>

## OPINION
2020년 초반 시작한 회사가 최근에 좋은 입소문을 탔는지 1년만에 억 단위의 큰 프로젝트들을 수주하기 시작하면서 프리랜서 도입이 필요한 시점이 왔습니다. 
물론 프리랜서 말고 함께할 팀원을 구하고 싶지만 작은 팀 규모의 사업체이다 보니 좋은 사람을 구하기가 쉽지 않습니다. 
프리랜서들과 일하면서 책임감 없고 주도적으로 일하지 않는 모습을 많이 봐았기 때문에 함께 일하기도 꺼려지는 것은 사실입니다. 
만약 대충 일을 때우는 분들과 함께 작업한다면 프로젝트 코드의 품질, 안정적인 프로젝트 진행 그리고 책임 회피를 방지하기 위한 코드 스타일 적용과 코드 커버리지 체크는 필수라고 생각됩니다. 

작년에 개발을 진행했던 시스템이나 서비스 플랫폼들, 유지보수하고 있는 서비스에 JaCoCo 플러그인 적용 후 테스트 커버리지를 높이는 작업을 수행할 예정입니다. 
테스트 코드를 작성하면서 수행하는 리팩토링 작업들이 앞으로 저희 팀의 탄탄한 서비스 플랫폼을 구축을 위한 좋은 연습이 될 것 같습니다. 

#### REFERENCE
- [코드 분석 도구 적용기 - 1편, 코드 커버리지(Code Coverage)가 뭔가요?][code-coverage-link-1]
- [코드 분석 도구 적용기 - 2편, JaCoCo 적용하기][code-coverage-link-2]
- <https://www.jacoco.org/jacoco/>
- <https://kchanguk.tistory.com/53>
- <https://bottom-to-top.tistory.com/36>
- <https://mkyong.com/maven/jacoco-java-code-coverage-maven-example/>
- <https://woowabros.github.io/experience/2020/02/02/jacoco-config-on-gradle-project.html>
- <https://automationrhapsody.com/automated-code-coverage-of-unit-tests-with-jacoco-and-maven/>

[code-coverage-link-1]: https://velog.io/@lxxjn0/%EC%BD%94%EB%93%9C-%EB%B6%84%EC%84%9D-%EB%8F%84%EA%B5%AC-%EC%A0%81%EC%9A%A9%EA%B8%B0-1%ED%8E%B8-%EC%BD%94%EB%93%9C-%EC%BB%A4%EB%B2%84%EB%A6%AC%EC%A7%80Code-Coverage%EA%B0%80-%EB%AD%94%EA%B0%80%EC%9A%94
[code-coverage-link-2]: https://velog.io/@lxxjn0/%EC%BD%94%EB%93%9C-%EB%B6%84%EC%84%9D-%EB%8F%84%EA%B5%AC-%EC%A0%81%EC%9A%A9%EA%B8%B0-2%ED%8E%B8-JaCoCo-%EC%A0%81%EC%9A%A9%ED%95%98%EA%B8%B0
