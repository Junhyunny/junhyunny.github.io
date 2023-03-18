---
title: "Using Google CheckStyle in Maven Lifecycle"
search: false
category:
  - information
  - maven
last_modified_at: 2021-08-28T02:30:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Maven Lifecycle and Plugins for Test][maven-lifecycle-and-surfire-failsafe-plugins-link]

## 0. 들어가면서

여러 명이 함께 일할 때 코드 스타일은 중요합니다. 
중간에 엉뚱한 스타일로 작성된 코드는 개발자의 가독성을 떨어뜨립니다. 
이번엔 프로젝트 내 같은 코드 컨벤션(convention)을 가지도록 돕는 도구와 메이븐(maven) 플러그인을 통해 코드 확인을 자동화하는 방법에 대해 정리하였습니다. 

## 1. Google CheckStyle

구글은 코드 스타일을 통일할 수 있도록 컨벤션에 대한 내용을 담은 XML 파일을 제공합니다. 
XML 파일에 정의된 규칙대로 코드 스타일을 강제할 수 있습니다. 
아래 링크에서 해당 파일을 다운로드 받습니다. 

* <https://github.com/checkstyle/checkstyle/blob/master/src/main/resources/google_checks.xml>

다운로드 받은 `google_checks.xml` 파일은 프로젝트 루트(root) 경로에 위치시킵니다. 
파일 경로는 상관 없고, 프로젝트 코드들과 함께 관리되도록 위치시킵니다. 

<p align="left">
    <img src="/images/maven-checkstyle-1.JPG" width="45%" class="image__border">
</p>

## 2. Customize Code Style

코드 스타일 일부를 변경합니다. 

##### google_checkstyle.xml

* `JavaDoc` 관련된 컨벤션은 주석 처리하여 제거합니다.
* 들여쓰기를 4칸으로 지정합니다.

```xml
<!--        <module name="NonEmptyAtclauseDescription"/>-->
<!--        <module name="InvalidJavadocPosition"/>-->
<!--        <module name="JavadocTagContinuationIndentation"/>-->
<!--        <module name="SummaryJavadoc">-->
<!--            <property name="forbiddenSummaryFragments"-->
<!--                      value="^@return the *|^This method returns |^A [{]@code [a-zA-Z0-9]+[}]( is a )"/>-->
<!--        </module>-->
<!--        <module name="JavadocParagraph"/>-->
<!--        <module name="RequireEmptyLineBeforeBlockTagGroup"/>-->
<!--        <module name="AtclauseOrder">-->
<!--            <property name="tagOrder" value="@param, @return, @throws, @deprecated"/>-->
<!--            <property name="target"-->
<!--                      value="CLASS_DEF, INTERFACE_DEF, ENUM_DEF, METHOD_DEF, CTOR_DEF, VARIABLE_DEF"/>-->
<!--        </module>-->
<!--        <module name="JavadocMethod">-->
<!--            <property name="accessModifiers" value="public"/>-->
<!--            <property name="allowMissingParamTags" value="true"/>-->
<!--            <property name="allowMissingReturnTag" value="true"/>-->
<!--            <property name="allowedAnnotations" value="Override, Test"/>-->
<!--            <property name="tokens" value="METHOD_DEF, CTOR_DEF, ANNOTATION_FIELD_DEF, COMPACT_CTOR_DEF"/>-->
<!--        </module>-->
<!--        <module name="MissingJavadocMethod">-->
<!--            <property name="scope" value="public"/>-->
<!--            <property name="minLineCount" value="2"/>-->
<!--            <property name="allowedAnnotations" value="Override, Test"/>-->
<!--            <property name="tokens" value="METHOD_DEF, CTOR_DEF, ANNOTATION_FIELD_DEF,-->
<!--                                   COMPACT_CTOR_DEF"/>-->
<!--        </module>-->
<!--        <module name="MissingJavadocType">-->
<!--            <property name="scope" value="protected"/>-->
<!--            <property name="tokens"-->
<!--                      value="CLASS_DEF, INTERFACE_DEF, ENUM_DEF,-->
<!--                      RECORD_DEF, ANNOTATION_DEF"/>-->
<!--            <property name="excludeScope" value="nothing"/>-->
<!--        </module>-->

    <module name="MissingJavadocType">
        <property name="scope" value="protected"/>
        <property name="tokens"
                  value=""/>
        <property name="excludeScope" value="nothing"/>
    </module>
```

## 3. Maven Plugin

메이븐 플러그인을 통해 메이븐 골(goal)을 만들고, 실행할 수 있습니다. 

### 3.1. Dependency for plugin

`maven-checkstyle-plugin` 플러그인을 추가합니다. 
플러그인에 적합한 버전의 `checkstyle` 의존성을 함께 정의합니다. 
`LITERAL_SWITCH` 토큰을 지원하지 않는다는 에러 메세지를 만나면 버전 `10.9.0` 이상을 사용합니다.

```
Token "LITERAL_SWITCH" was not found in Acceptable tokens list in check com.puppycrawl.tools.checkstyle.checks.blocks.RightCurlyCheck
```

### 3.2. pom.xml

* 골 이름을 `check`로 지정합니다.
* violationSeverity
    * 컨벤션 위반 심각성 레벨을 `warning`으로 지정합니다.
    * `warning`이 발생하는 경우 빌드가 실패합니다.
* failsOnError
    * 에러가 있는 경우 빌드를 실패시킵니다.

```xml

    <properties>
        <java.version>17</java.version>
        <project.build.sourceDirectories>${basedir}/src</project.build.sourceDirectories>
        <checkstyle.config.location>${basedir}/google_checkstyle.xml</checkstyle.config.location>
    </properties>

    ...

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-checkstyle-plugin</artifactId>
                <version>3.2.1</version>
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
                        <version>10.9.1</version>
                    </dependency>
                </dependencies>
                <configuration>
                    <violationSeverity>warning</violationSeverity>
                    <failsOnError>true</failsOnError>
                    <consoleOutput>true</consoleOutput>
                    <configLocation>${checkstyle.config.location}</configLocation>
                    <sourceDirectories>${project.build.sourceDirectories}</sourceDirectories>
                    <propertyExpansion>suppressionFile=${basedir}/google_checkstyle.xml</propertyExpansion>
                </configuration>
            </plugin>
        </plugins>
    </build>
```

##### Run Package Phase with Checkstyle Goal

```
$ mvn checkstyle:checkstyle package 
[INFO] Scanning for projects...
[INFO] 
[INFO] -------------------< action.in.blog:action-in-blog >--------------------
[INFO] Building action-in-blog 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-checkstyle-plugin:3.2.1:checkstyle (default-cli) @ action-in-blog ---
[INFO] Rendering content with org.apache.maven.skins:maven-default-skin:jar:1.3 skin.
[INFO] Starting audit...
[WARN] /Users/junhyunk/Desktop/action-in-blog/src/main/java/action/in/blog/ActionInBlogApplication.java:6:1: Missing a Javadoc comment. [MissingJavadocType]
Audit done.
[WARNING] Unable to locate Source XRef to link to - DISABLED
[WARNING] Unable to locate Test Source XRef to link to - DISABLED
[INFO] 
[INFO] --- maven-resources-plugin:3.3.0:resources (default-resources) @ action-in-blog ---
[INFO] Copying 1 resource
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.10.1:compile (default-compile) @ action-in-blog ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 1 source file to /Users/junhyunk/Desktop/action-in-blog/target/classes
[INFO] 
[INFO] --- maven-resources-plugin:3.3.0:testResources (default-testResources) @ action-in-blog ---
[INFO] skip non existing resourceDirectory /Users/junhyunk/Desktop/action-in-blog/src/test/resources
[INFO] 
[INFO] --- maven-compiler-plugin:3.10.1:testCompile (default-testCompile) @ action-in-blog ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 1 source file to /Users/junhyunk/Desktop/action-in-blog/target/test-classes
[INFO] 
[INFO] --- maven-surefire-plugin:2.22.2:test (default-test) @ action-in-blog ---
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running action.in.blog.ActionInBlogApplicationTests
16:41:15.855 [main] DEBUG org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Neither @ContextConfiguration nor @ContextHierarchy found for test class [ActionInBlogApplicationTests]: using SpringBootContextLoader
16:41:15.859 [main] DEBUG org.springframework.test.context.support.AbstractContextLoader - Could not detect default resource locations for test class [action.in.blog.ActionInBlogApplicationTests]: no resource found for suffixes {-context.xml, Context.groovy}.
16:41:15.859 [main] INFO org.springframework.test.context.support.AnnotationConfigContextLoaderUtils - Could not detect default configuration classes for test class [action.in.blog.ActionInBlogApplicationTests]: ActionInBlogApplicationTests does not declare any static, non-private, non-final, nested classes annotated with @Configuration.
16:41:15.878 [main] DEBUG org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Using ContextCustomizers for test class [ActionInBlogApplicationTests]: [ExcludeFilterContextCustomizer, DuplicateJsonObjectContextCustomizer, MockitoContextCustomizer, TestRestTemplateContextCustomizer, DisableObservabilityContextCustomizer, PropertyMappingContextCustomizer, Customizer]
16:41:15.929 [main] DEBUG org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider - Identified candidate component class: file [/Users/junhyunk/Desktop/action-in-blog/target/classes/action/in/blog/ActionInBlogApplication.class]
16:41:15.930 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Found @SpringBootConfiguration action.in.blog.ActionInBlogApplication for test class action.in.blog.ActionInBlogApplicationTests
16:41:15.992 [main] DEBUG org.springframework.test.context.util.TestContextSpringFactoriesUtils - Skipping candidate TestExecutionListener [org.springframework.test.context.transaction.TransactionalTestExecutionListener] due to a missing dependency. Specify custom TestExecutionListener classes or make the default TestExecutionListener classes and their required dependencies available. Offending class: [org/springframework/transaction/interceptor/TransactionAttributeSource]
16:41:15.993 [main] DEBUG org.springframework.test.context.util.TestContextSpringFactoriesUtils - Skipping candidate TestExecutionListener [org.springframework.test.context.jdbc.SqlScriptsTestExecutionListener] due to a missing dependency. Specify custom TestExecutionListener classes or make the default TestExecutionListener classes and their required dependencies available. Offending class: [org/springframework/transaction/interceptor/TransactionAttribute]
16:41:15.995 [main] DEBUG org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Using TestExecutionListeners for test class [ActionInBlogApplicationTests]: [ServletTestExecutionListener, DirtiesContextBeforeModesTestExecutionListener, ApplicationEventsTestExecutionListener, MockitoTestExecutionListener, DependencyInjectionTestExecutionListener, DirtiesContextTestExecutionListener, EventPublishingTestExecutionListener, ResetMocksTestExecutionListener, RestDocsTestExecutionListener, MockRestServiceServerResetTestExecutionListener, MockMvcPrintOnlyOnFailureTestExecutionListener, WebDriverTestExecutionListener, MockWebServiceServerTestExecutionListener]
16:41:15.996 [main] DEBUG org.springframework.test.context.support.AbstractDirtiesContextTestExecutionListener - Before test class: class [ActionInBlogApplicationTests], class annotated with @DirtiesContext [false] with mode [null]

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.0.4)

2023-03-18T16:41:16.191+09:00  INFO 48332 --- [           main] a.in.blog.ActionInBlogApplicationTests   : Starting ActionInBlogApplicationTests using Java 17.0.1 with PID 48332 (started by junhyunk in /Users/junhyunk/Desktop/action-in-blog)
2023-03-18T16:41:16.192+09:00  INFO 48332 --- [           main] a.in.blog.ActionInBlogApplicationTests   : No active profile set, falling back to 1 default profile: "default"
2023-03-18T16:41:16.911+09:00  INFO 48332 --- [           main] a.in.blog.ActionInBlogApplicationTests   : Started ActionInBlogApplicationTests in 0.887 seconds (process running for 1.518)
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.517 s - in action.in.blog.ActionInBlogApplicationTests
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] 
[INFO] --- maven-jar-plugin:3.3.0:jar (default-jar) @ action-in-blog ---
[INFO] Building jar: /Users/junhyunk/Desktop/action-in-blog/target/action-in-blog-0.0.1-SNAPSHOT.jar
[INFO] 
[INFO] --- spring-boot-maven-plugin:3.0.4:repackage (repackage) @ action-in-blog ---
[INFO] Replacing main artifact with repackaged archive
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  5.877 s
[INFO] Finished at: 2023-03-18T16:41:18+09:00
[INFO] ------------------------------------------------------------------------
```

## 4. Build Fail when Violation Conventions

코드 컨벤션을 고의로 망가트린 후 빌드가 실패하는지 확인합니다.

##### ActionInBlogApplication Class

* 코드 블럭에 줄내림을 만들어 컨벤션을 위반합니다.

```java
package action.in.blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ActionInBlogApplication {

    public static void main(String[] args)
    {
        SpringApplication.run(ActionInBlogApplication.class, args);
    }

}
```

##### Run Package Phase with Checkstyle Goal

* 코드 블럭에 관련된 경고 메세지와 함께 골 실행이 실패하는 것을 볼 수 있습니다.

```
$ mvn checkstyle:check package
[INFO] Scanning for projects...
[INFO] 
[INFO] -------------------< action.in.blog:action-in-blog >--------------------
[INFO] Building action-in-blog 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-checkstyle-plugin:3.2.1:check (default-cli) @ action-in-blog ---
[INFO] Starting audit...
[WARN] /Users/junhyunk/Desktop/action-in-blog/src/main/java/action/in/blog/ActionInBlogApplication.java:10:5: '{' at column 5 should be on the previous line. [LeftCurly]
Audit done.
[WARNING] src/main/java/action/in/blog/ActionInBlogApplication.java:[10,5] (blocks) LeftCurly: '{' at column 5 should be on the previous line.
[INFO] ------------------------------------------------------------------------
[INFO] BUILD FAILURE
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  1.668 s
[INFO] Finished at: 2023-03-18T17:02:05+09:00
[INFO] ------------------------------------------------------------------------
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-checkstyle-plugin:3.2.1:check (default-cli) on project action-in-blog: You have 1 Checkstyle violation. -> [Help 1]
[ERROR] 
[ERROR] To see the full stack trace of the errors, re-run Maven with the -e switch.
[ERROR] Re-run Maven using the -X switch to enable full debug logging.
[ERROR] 
[ERROR] For more information about the errors and possible solutions, please read the following articles:
[ERROR] [Help 1] http://cwiki.apache.org/confluence/display/MAVEN/MojoFailureException
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-04-29-maven-checkstyle>

#### RECOMMEND NEXT POSTS

* [Apply Google CodeStyle in IntelliJ][google-codestyle-link]

#### REFERENCE

* <https://sg-choi.tistory.com/101>
* <https://checkstyle.sourceforge.io/config_naming.html>
* <https://stackoverflow.com/questions/50681818/run-maven-checkstyle-and-fail-on-errors>
* <https://stackoverflow.com/questions/63852780/creating-a-customized-version-of-the-google-java-checkstyle-xml-file/64694410#64694410>
* <https://mvnrepository.com/artifact/com.puppycrawl.tools/checkstyle/10.9.1>
* <https://checkstyle.org/releasenotes.html#Release_10.9.0>

[maven-lifecycle-and-surfire-failsafe-plugins-link]: https://junhyunny.github.io/maven/maven-lifecycle-and-surfire-failsafe-plugins/
[google-codestyle-link]: https://junhyunny.github.io/information/intellij-google-codestyle/