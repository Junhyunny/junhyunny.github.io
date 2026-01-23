---
title: "JaCoCo Maven Plugin"
search: false
category:
  - information
  - maven
last_modified_at: 2021-08-28T03:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Maven Lifecycle and Plugins for Test][maven-lifecycle-and-surfire-failsafe-plugins-link]

## 1. JaCoCo(Java Code Coverage)

`Java` 기반의 애플리케이션 테스트에 적용할 수 있는 리포트(report) 도구입니다. 
코드 커버리지(code coverage)는 테스트 코드가 구현체 코드 전체 중 얼만큼 실행시켰는지에 대한 지표입니다. 
`JaCoCo`는 코드 커버리지에 대한 리포트를 만들어 주는 것이 주된 목적입니다. 

> JaCoCo is a free code coverage library for Java, which has been created by the EclEmma team based on the lessons learned from using and integration existing libraries for many years. 

## 2. Maven Plugin JaCoCo

메이븐 플러그인으로 `JaCoCo`를 추가한 후 골(goal)을 등록할 수 있습니다. 
메이븐 골로 등록하면 CLI(command line interface)를 통해 동작을 자동화시킬 수 있습니다. 

### 2.1. pom.xml

설정 파일의 전체 모습을 보고, 각 설정 별로 자세하게 살펴보겠습니다. 

```xml
    <plugin>
        <groupId>org.jacoco</groupId>
        <artifactId>jacoco-maven-plugin</artifactId>
        <version>0.8.8</version>
        <configuration>
            <excludes>
                <exclude>**/action/in/blog/*Application.class</exclude>
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
                    </rules>
                </configuration>
            </execution>
        </executions>
    </plugin>
```

### 2.2. Exclude Code

특정 코드를 테스트 커버리지 측정에서 제외할 수 있습니다. 
해당 포스트에선 `main` 메서드가 포함된 ActionInBlogApplication 클래스는 제외하였습니다. 

```xml
    <configuration>
        <excludes>
            <exclude>**/action/in/blog/*Application.class</exclude>
        </excludes>
    </configuration>
```

### 2.3. Goals

`JaCoCo` 플러그인을 사용하면 다음과 같은 골들을 설정할 수 있습니다.

* help
    * `jacoco-maven-plugin` 사용을 위한 도움말을 볼 수 있습니다. 
* prepare-agent
    * `JaCoCo` 런타임 에이전트에게 테스트 커버리지 측정을 위한 JVM 실행 인수들을 전달합니다.
    * 해당 골을 정의해야지 테스트 커버리지를 측정할 수 있습니다.
    * `maven-surefire-plugin`와 함께 사용할 수 있습니다.
* prepare-agent-integration
    * `prepare-agent`와 동일하지만, 결합 테스트(integration test)에 적합합니다.
* merge
    * 실행 데이터 파일 집합을 단일 파일로 병합합니다.
* report
    * 단일 프로젝트에서 테스트에 대한 코드 커버리지 리포트를 다양한 형식으로 만들어냅니다.
    * HTML, XML, CSV
* report-integration
    * `report`와 동일하지만, 결합 테스트에 적합합니다.
* report-aggregate
    * 다중 프로젝트에서 테스트에 대한 코드 커버리지 리포트를 다양한 형식으로 만들어냅니다.
    * HTML, XML, CSV
* check
    * 코드 커버리지 메트릭(metric)이 충족되는지 확인합니다.
    * 쉽게 설명하면 코드 커버리지에 대한 기준을 정의합니다.
* dump
    * TCP 서버 모드에서 실행 중인 `JaCoCo` 에이전트로부터 덤프(dump)를 요청합니다.
* instrument
    * 오프라인(offline) 측정을 수행하는 명령입니다.
* restore-instrumented-classes
    * 오프라인 측정 이전에 원본 파일들을 저장합니다. 

### 2.4. Rules

`check` 골 하위에 코드 커버리지에 대한 기준을 정의할 수 있습니다. 
다음과 같은 기준들이 존재합니다.

* Element type 
    * 코드 커버리지를 체크하는 기준이며 다음과 같은 기준들이 존재합니다.
    * BUNDLE(default)
    * PACKAGE
    * CLASS
    * SOURCEFILE
    * METHOD
* Counter 
    * 코드 커버리지를 측정할 때 사용하는 지표이며 다음과 같은 지표들이 존재합니다.
    * LINE
    * BRANCH
    * CLASS
    * METHOD
    * INSTRUCTION(default)
    * COMPLEXITY 
* Value 
    * 코드 커버리지에 대한 결과를 표시하는 방법입니다. 
    * TOTALCOUNT
    * MISSEDCOUNT
    * COVEREDCOUNT
    * MISSEDRATIO
    * COVEREDRATIO(default)

##### Example of Rules

* 1번 기준
    * 패키지 번들 단위로 확인합니다.
    * 코드 커버리지 비율이 `Java` 바이트 코드 명령어 개수를 기준으로 80%가 넘지 못하면 실패입니다.
* 2번 기준
    * 메서드 단위로 확인합니다.
    * 메서드의 코드 라인이 총 30줄이 넘어가면 실패입니다.

```xml
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
            </rules>
        </configuration>
    </execution>
```

## 3. Practice

`JaCoCo`가 정상적으로 동작하는지 확인해보겠습니다. 

### 3.1. System Under Test and Test Codes

간단한 테스트 대상 클래스와 테스트 코드를 준비합니다. 

#### 3.1.1. Calculator Class

```java
package action.in.blog.util;

public class Calculator {

    public int sum(int num1, int num2) {
        return num1 + num2;
    }

    public int subtract(int num1, int num2) {
        return num1 - num2;
    }

    public boolean isNull(Object obj) {
        return obj == null;
    }
}
```

#### 3.1.2. CalculatorTests Class

```java
package action.in.blog.util;

import org.junit.jupiter.api.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

public class CalculatorTests {

    @Test
    void sum() {
        Calculator sut = new Calculator();
        assertThat(sut.sum(1, 2), equalTo(3));
    }

    @Test
    void subtract() {
        Calculator sut = new Calculator();
        assertThat(sut.subtract(1, 2), equalTo(-1));
    }

    @Test
    void isNull() {
        Calculator sut = new Calculator();
        assertThat(sut.isNull(new Object()), equalTo(false));
        assertThat(sut.isNull(null), equalTo(true));
    }
}
```

## 3.2. Run Maven Phase

테스트에 대한 코드 커버리지 측정은 테스트 페이즈(phase)를 실행하는 페이즈들부터 가능합니다. 

* test
* package
* integration-test
* verify
* install
* deploy

##### Run Install Phase

* 실행 중간에 `jacoco-maven-plugin`에 정의한 골들이 실행되면서 코드 커버리지 리포트를 생성합니다.
* `initialize` 페이즈에서 `report` 골이 실행됩니다.
* `test` 페이즈에서 `report` 골이 실행됩니다.
* `verify` 페이즈에서 `check` 골이 실행됩니다.

```
$ mvn install

[INFO] Scanning for projects...
[INFO] 
[INFO] -------------------< action.in.blog:action-in-blog >--------------------
[INFO] Building action-in-blog 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- jacoco-maven-plugin:0.8.8:prepare-agent (jacoco-prepare-agent) @ action-in-blog ---
[INFO] argLine set to -javaagent:/Users/junhyunk/.m2/repository/org/jacoco/org.jacoco.agent/0.8.8/org.jacoco.agent-0.8.8-runtime.jar=destfile=/Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-05-03-maven-jacoco/action-in-blog/target/jacoco.exec,excludes=**/action/in/blog/*Application.class
[INFO] 
[INFO] --- maven-resources-plugin:3.3.0:resources (default-resources) @ action-in-blog ---
[INFO] Copying 1 resource
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.10.1:compile (default-compile) @ action-in-blog ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-resources-plugin:3.3.0:testResources (default-testResources) @ action-in-blog ---
[INFO] skip non existing resourceDirectory /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-05-03-maven-jacoco/action-in-blog/src/test/resources
[INFO] 
[INFO] --- maven-compiler-plugin:3.10.1:testCompile (default-testCompile) @ action-in-blog ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 1 source file to /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-05-03-maven-jacoco/action-in-blog/target/test-classes
[INFO] 
[INFO] --- maven-surefire-plugin:2.22.2:test (default-test) @ action-in-blog ---
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running action.in.blog.util.CalculatorTests
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.034 s - in action.in.blog.util.CalculatorTests
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] 
[INFO] --- maven-jar-plugin:3.3.0:jar (default-jar) @ action-in-blog ---
[INFO] Building jar: /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-05-03-maven-jacoco/action-in-blog/target/action-in-blog-0.0.1-SNAPSHOT.jar
[INFO] 
[INFO] --- spring-boot-maven-plugin:3.0.4:repackage (repackage) @ action-in-blog ---
[INFO] Replacing main artifact with repackaged archive
[INFO] 
[INFO] --- jacoco-maven-plugin:0.8.8:report (jacoco-report) @ action-in-blog ---
[INFO] Loading execution data file /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-05-03-maven-jacoco/action-in-blog/target/jacoco.exec
[INFO] Analyzed bundle 'action-in-blog' with 1 classes
[INFO] 
[INFO] --- jacoco-maven-plugin:0.8.8:check (jacoco-check) @ action-in-blog ---
[INFO] Loading execution data file /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-05-03-maven-jacoco/action-in-blog/target/jacoco.exec
[INFO] Analyzed bundle 'action-in-blog' with 1 classes
[INFO] All coverage checks have been met.
[INFO] 
[INFO] --- maven-install-plugin:3.0.1:install (default-install) @ action-in-blog ---
[INFO] Installing /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-05-03-maven-jacoco/action-in-blog/pom.xml to /Users/junhyunk/.m2/repository/action/in/blog/action-in-blog/0.0.1-SNAPSHOT/action-in-blog-0.0.1-SNAPSHOT.pom
[INFO] Installing /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-05-03-maven-jacoco/action-in-blog/target/action-in-blog-0.0.1-SNAPSHOT.jar to /Users/junhyunk/.m2/repository/action/in/blog/action-in-blog/0.0.1-SNAPSHOT/action-in-blog-0.0.1-SNAPSHOT.jar
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  3.442 s
[INFO] Finished at: 2023-03-18T22:37:34+09:00
[INFO] ------------------------------------------------------------------------
```

##### Code Coverage Report

프로젝트 `/target/site/jacoco` 경로에 `index.html` 파일로 리포트가 생성된 것을 확인할 수 있습니다. 

<p align="left">
    <img src="/images/maven-jacoco-1.JPG" width="30%" class="image__border">
</p>

##### Result of Code Coverage

<p align="left">
    <img src="/images/maven-jacoco-2.JPG" width="80%" class="image__border">
</p>

## CLOSING

코드 커버리지에 대한 기준을 변경하거나 테스트를 일부 제거하면 빌드가 실패하는 것을 확인할 수 있습니다.

```
$ mvn clean install

[INFO] Scanning for projects...
[INFO] 
[INFO] -------------------< action.in.blog:action-in-blog >--------------------
[INFO] Building action-in-blog 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-clean-plugin:3.2.0:clean (default-clean) @ action-in-blog ---
[INFO] Deleting /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-05-03-maven-jacoco/action-in-blog/target
[INFO] 
[INFO] --- jacoco-maven-plugin:0.8.8:prepare-agent (jacoco-prepare-agent) @ action-in-blog ---
[INFO] argLine set to -javaagent:/Users/junhyunk/.m2/repository/org/jacoco/org.jacoco.agent/0.8.8/org.jacoco.agent-0.8.8-runtime.jar=destfile=/Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-05-03-maven-jacoco/action-in-blog/target/jacoco.exec,excludes=**/action/in/blog/*Application.class
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:resources (default-resources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] Copying 1 resource
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.10.1:compile (default-compile) @ action-in-blog ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 2 source files to /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-05-03-maven-jacoco/action-in-blog/target/classes
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:testResources (default-testResources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] skip non existing resourceDirectory /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-05-03-maven-jacoco/action-in-blog/src/test/resources
[INFO] 
[INFO] --- maven-compiler-plugin:3.10.1:testCompile (default-testCompile) @ action-in-blog ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 1 source file to /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-05-03-maven-jacoco/action-in-blog/target/test-classes
[INFO] 
[INFO] --- maven-surefire-plugin:2.22.2:test (default-test) @ action-in-blog ---
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running action.in.blog.util.CalculatorTests
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.031 s - in action.in.blog.util.CalculatorTests
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] 
[INFO] --- maven-jar-plugin:3.2.2:jar (default-jar) @ action-in-blog ---
[INFO] Building jar: /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-05-03-maven-jacoco/action-in-blog/target/action-in-blog-0.0.1-SNAPSHOT.jar
[INFO] 
[INFO] --- spring-boot-maven-plugin:2.7.8:repackage (repackage) @ action-in-blog ---
[INFO] Replacing main artifact with repackaged archive
[INFO] 
[INFO] --- jacoco-maven-plugin:0.8.8:report (jacoco-report) @ action-in-blog ---
[INFO] Loading execution data file /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-05-03-maven-jacoco/action-in-blog/target/jacoco.exec
[INFO] Analyzed bundle 'action-in-blog' with 1 classes
[INFO] 
[INFO] --- jacoco-maven-plugin:0.8.8:check (jacoco-check) @ action-in-blog ---
[INFO] Loading execution data file /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2021-05-03-maven-jacoco/action-in-blog/target/jacoco.exec
[INFO] Analyzed bundle 'action-in-blog' with 1 classes
[WARNING] Rule violated for bundle action-in-blog: instructions covered ratio is 0.52, but expected minimum is 0.80
[INFO] ------------------------------------------------------------------------
[INFO] BUILD FAILURE
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  3.801 s
[INFO] Finished at: 2023-03-18T23:13:34+09:00
[INFO] ------------------------------------------------------------------------
[ERROR] Failed to execute goal org.jacoco:jacoco-maven-plugin:0.8.8:check (jacoco-check) on project action-in-blog: Coverage checks have not been met. See log for details. -> [Help 1]
[ERROR] 
[ERROR] To see the full stack trace of the errors, re-run Maven with the -e switch.
[ERROR] Re-run Maven using the -X switch to enable full debug logging.
[ERROR] 
[ERROR] For more information about the errors and possible solutions, please read the following articles:
[ERROR] [Help 1] http://cwiki.apache.org/confluence/display/MAVEN/MojoExecutionException
```

<p align="left">
    <img src="/images/maven-jacoco-3.JPG" width="80%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-05-03-maven-jacoco>

#### REFERENCE

* <https://www.jacoco.org/jacoco/>
* <https://www.eclemma.org/jacoco/trunk/doc/maven.html>
* <https://woowabros.github.io/experience/2020/02/02/jacoco-config-on-gradle-project.html>
* <https://mkyong.com/maven/jacoco-java-code-coverage-maven-example/>
* <https://automationrhapsody.com/automated-code-coverage-of-unit-tests-with-jacoco-and-maven/>

[maven-lifecycle-and-surfire-failsafe-plugins-link]: https://junhyunny.github.io/maven/maven-lifecycle-and-surfire-failsafe-plugins/