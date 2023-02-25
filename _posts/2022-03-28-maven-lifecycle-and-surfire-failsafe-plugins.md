---
title: "Maven Lifecycle and Plugins for Test"
search: false
category:
  - maven
last_modified_at: 2022-03-28T23:55:00
---

<br/>

## 0. 들어가면서

메이븐(maven)은 프로젝트 빌드와 의존성(dependency)을 관리해주는 도구입니다. 
메이븐을 사용하면 프로젝트를 빌드할 때 테스트 코드를 단위 테스트와 결합 테스트로 나눠 실행할 수 있습니다. 
테스트가 나뉘어 실행되는 원리를 알아보기 전에 먼저 메이븐과 관련된 개념들을 몇 가지 정리하고 글을 이어가겠습니다. 
- 라이프 사이클(lifecycle)
- 페이즈(phase)와 플러그인(plugin) 골(goal)
- 메이븐 플러그인으로 테스트 분할 실행하기

## 1. Maven Lifecycle

메이븐 라이프 사이클에 대해 먼저 알아보겠습니다. 
라이프 사이클은 크게 세 가지로 구분됩니다. 
- 클린(clean) 라이프 사이클
    - 3개의 페이즈(phase)로 구성됩니다.
    - 빌드 시 생성되었던 산출물들이 삭제하는 과정을 다룹니다.
- 디폴트(default) 라이프 사이클
    - 21개의 페이즈로 구성됩니다.
    - 프로젝트를 빌드하고 배포(deployment)하는 과정을 다룹니다.
- 사이트(site) 라이프 사이클 
    - 4개의 페이즈로 구성됩니다.
    - 프로젝트의 웹 사이트 생성 과정을 다룹니다.

##### 메이븐 라이프 사이클 순서

<p align="center">
    <img src="/images/maven-lifecycle-and-surfire-failsafe-plugins-1.JPG" width="90%" class="image__border">
</p>
<center>https://medium.com/@yetanothersoftwareengineer/maven-lifecycle-phases-plugins-and-goals-25d8e33fa22</center>

## 2. Phase 

페이즈(phase)는 메이븐 라이프 사이클의 각 단계를 의미합니다. 
이번 포스트에서 알아볼 `surefire`, `failsafe` 플러그인과 관려된 디폴트 라이프 사이클을 조금 자세히 들여다 보겠습니다. 
디폴트 라이프 사이클은 21개의 페이즈로 구성되어 있지만, 중요한 8개의 페이즈만 정리해보겠습니다. 
- `validate` phase
    - 프로젝트의 구조가 올바른지 확인합니다.
    - 예를 들어, 필요한 모든 의존성들이 로컬 레포지토리에 다운로드되어 사용 가능한지 확인합니다. 
- `compile` phase
    - `.java` 파일을 `.class` 파일로 컴파일합니다.
    - `target/classes` 폴더에 컴파일한 클래스 파일들을 저장합니다.
- `test` phase
    - 프로젝트를 위한 단위 테스트들을 실행합니다.
- `package` phase
    - 컴파일한 코드들을 배포 가능한 `.jar`, `.war` 포맷으로 변경합니다.
- `integration-test` phase
    - 프로젝트를 위한 결합 테스트들을 실행합니다.
- `verify` phase
    - 프로젝트가 유효하고 품질을 충족하는지 확인합니다.
- `install` phase
    - 패키징(packaging)한 코드를 로컬 레포지토리에 배포합니다.
- `deploy` phase
    - 패키징한 코드를 원격 레포지토리에 배포합니다.

메이븐 라이프 사이클의 각 페이즈들은 의존 관계가 있기 때문에 특정 페이즈를 실행하기 위해선 이전의 페이즈들이 먼저 실행되어야 합니다. 
예를 들어, `package` 페이즈를 실행하기 위해선 `validate`, `compile`, `test` 페이즈들이 선행되어야 합니다. 

## 3. Maven Plugins Goals 

메이븐이 제공하는 기능은 모두 플러그인을 기반으로 동작합니다. 
`pom.xml` 파일의 `<plugins>...</plugins>` 태그를 보면 필요한 플러그인들이 선언되어 있습니다. 

##### pom.xml

```xml
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
```

##### 메이븐 실행

메이븐에서 사용하는 플러그인을 동작시키는 명령어를 골(goal)이라고 합니다. 
`페이즈`로 실행하는 것과 `플러그인:플러그인-골`을 이용해 실행하는 것은 명백히 다르며, `페이즈`로 실행 시 선행되어야 하는 `플러그인:플러그인-골`을 모두 수행합니다.

- 메이븐 명령어를 터미널에서 다음과 같은 방법으로 실행시킬 수 있습니다. 
- `페이즈`나 `플러그인:플러그인-골`을 입력하여 메이븐 빌드를 실행합니다.

```
$ mvn -help

usage: mvn [options] [<goal(s)>] [<phase(s)>]
```

##### 메이븐 실행 명령어 - 페이즈 사용
- `clean` 페이즈를 실행 후에 `install` 페이즈를 실행합니다.
- 아래 로그를 살펴보면 다음과 같은 `플러그인:플러그인-골`이 실행됩니다.
    - maven-clean-plugin:3.1.0:clean
    - maven-resources-plugin:3.1.0:resources
    - maven-compiler-plugin:3.8.1:compile
    - maven-resources-plugin:3.1.0:testResources
    - maven-compiler-plugin:3.8.1:testCompile
    - maven-surefire-plugin:2.22.2:test
    - maven-jar-plugin:3.1.2:jar
    - spring-boot-maven-plugin:2.2.5.RELEASE:repackage
    - maven-install-plugin:2.5.2:install

```
$ mvn clean install
[INFO] Scanning for projects...
[INFO] 
[INFO] -------------------< blog.in.action:action-in-blog >--------------------
[INFO] Building action-in-blog 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-clean-plugin:3.1.0:clean (default-clean) @ action-in-blog ---
[INFO] Deleting /Users/junhyunk/Desktop/workspace/blog-in-action/2021-08-15-spring-application-context-event/action-in-blog-back/target
[INFO] 
[INFO] --- maven-resources-plugin:3.1.0:resources (default-resources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Copying 1 resource
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.8.1:compile (default-compile) @ action-in-blog ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 9 source files to /Users/junhyunk/Desktop/workspace/blog-in-action/2021-08-15-spring-application-context-event/action-in-blog-back/target/classes
[INFO] 
[INFO] --- maven-resources-plugin:3.1.0:testResources (default-testResources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] skip non existing resourceDirectory /Users/junhyunk/Desktop/workspace/blog-in-action/2021-08-15-spring-application-context-event/action-in-blog-back/src/test/resources
[INFO] 
[INFO] --- maven-compiler-plugin:3.8.1:testCompile (default-testCompile) @ action-in-blog ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 1 source file to /Users/junhyunk/Desktop/workspace/blog-in-action/2021-08-15-spring-application-context-event/action-in-blog-back/target/test-classes
[INFO] 
[INFO] --- maven-surefire-plugin:2.22.2:test (default-test) @ action-in-blog ---
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 0, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] 
[INFO] --- maven-jar-plugin:3.1.2:jar (default-jar) @ action-in-blog ---
[INFO] Building jar: /Users/junhyunk/Desktop/workspace/blog-in-action/2021-08-15-spring-application-context-event/action-in-blog-back/target/action-in-blog-0.0.1-SNAPSHOT.jar
[INFO] 
[INFO] --- spring-boot-maven-plugin:2.2.5.RELEASE:repackage (repackage) @ action-in-blog ---
[INFO] Replacing main artifact with repackaged archive
[INFO] 
[INFO] --- maven-install-plugin:2.5.2:install (default-install) @ action-in-blog ---
[INFO] Installing /Users/junhyunk/Desktop/workspace/blog-in-action/2021-08-15-spring-application-context-event/action-in-blog-back/target/action-in-blog-0.0.1-SNAPSHOT.jar to /Users/junhyunk/.m2/repository/blog/in/action/action-in-blog/0.0.1-SNAPSHOT/action-in-blog-0.0.1-SNAPSHOT.jar
[INFO] Installing /Users/junhyunk/Desktop/workspace/blog-in-action/2021-08-15-spring-application-context-event/action-in-blog-back/pom.xml to /Users/junhyunk/.m2/repository/blog/in/action/action-in-blog/0.0.1-SNAPSHOT/action-in-blog-0.0.1-SNAPSHOT.pom
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  4.750 s
[INFO] Finished at: 2022-03-29T02:36:30+09:00
[INFO] ------------------------------------------------------------------------
```

##### 메이븐 실행 명령어 - 플러그인:플러그인-골 사용
- 명령어에 전달한 `플러그인:플러그인-골`만 실행됩니다.
- 아래 로그를 살펴보면 다음과 같은 `플러그인:플러그인-골`이 실행됩니다.
    - maven-clean-plugin:3.1.0:clean
    - maven-jar-plugin:3.1.2:jar
    - maven-install-plugin:2.5.2:install

```
$ mvn clean:clean jar:jar install:install

[INFO] Scanning for projects...
[INFO] 
[INFO] -------------------< blog.in.action:action-in-blog >--------------------
[INFO] Building action-in-blog 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-clean-plugin:3.1.0:clean (default-cli) @ action-in-blog ---
[INFO] Deleting /Users/junhyunk/Desktop/workspace/blog-in-action/2021-08-15-spring-application-context-event/action-in-blog-back/target
[INFO] 
[INFO] --- maven-jar-plugin:3.1.2:jar (default-cli) @ action-in-blog ---
[WARNING] JAR will be empty - no content was marked for inclusion!
[INFO] Building jar: /Users/junhyunk/Desktop/workspace/blog-in-action/2021-08-15-spring-application-context-event/action-in-blog-back/target/action-in-blog-0.0.1-SNAPSHOT.jar
[INFO] 
[INFO] --- maven-install-plugin:2.5.2:install (default-cli) @ action-in-blog ---
[INFO] Installing /Users/junhyunk/Desktop/workspace/blog-in-action/2021-08-15-spring-application-context-event/action-in-blog-back/target/action-in-blog-0.0.1-SNAPSHOT.jar to /Users/junhyunk/.m2/repository/blog/in/action/action-in-blog/0.0.1-SNAPSHOT/action-in-blog-0.0.1-SNAPSHOT.jar
[INFO] Installing /Users/junhyunk/Desktop/workspace/blog-in-action/2021-08-15-spring-application-context-event/action-in-blog-back/pom.xml to /Users/junhyunk/.m2/repository/blog/in/action/action-in-blog/0.0.1-SNAPSHOT/action-in-blog-0.0.1-SNAPSHOT.pom
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  0.953 s
[INFO] Finished at: 2022-03-29T02:31:31+09:00
[INFO] ------------------------------------------------------------------------
```

### 3.1. 페이즈와 플러그인:플러그인-골

기본적으로 각 `페이즈` 별로 연결되는 `플러그인:플러그인-골`이 있습니다. 
`페이즈`로 명령어를 실행하면 연결되는 `플러그인:플러그인-골`까지 모든 `플러그인:플러그인-골`들을 실행합니다.

##### .jar 패키징 시 연결되는 페이즈와 플러그인:플러그인-골

<p align="center">
    <img src="/images/maven-lifecycle-and-surfire-failsafe-plugins-2.JPG" width="80%" class="image__border">
</p>
<center>https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html</center>

### 3.2. spring-boot-maven-plugin 살펴보기

`IntelliJ` IDE 도구를 이용해 만든 스프링 프로젝트에 기본적으로 포함되는 `spring-boot-maven-plugin` 플러그인 정보를 따라 올라가면 다음과 같은 플러그인들을 확인할 수 있습니다.

##### spring-boot-dependencies pom
- `spring-boot-maven-plugin` > `spring-boot-tools` > `spring-boot-parent` > `spring-boot-dependencies`
- `spring-boot-dependencies` pom 파일에서 아래와 같은 플러그인들을 확인할 수 있습니다.

```xml
        <plugin>
          <artifactId>maven-clean-plugin</artifactId>
          <version>${maven-clean-plugin.version}</version>
        </plugin>
        <plugin>
          <artifactId>maven-compiler-plugin</artifactId>
          <version>${maven-compiler-plugin.version}</version>
        </plugin>
        <plugin>
          <artifactId>maven-deploy-plugin</artifactId>
          <version>${maven-deploy-plugin.version}</version>
        </plugin>
        <plugin>
          <artifactId>maven-dependency-plugin</artifactId>
          <version>${maven-dependency-plugin.version}</version>
        </plugin>
        <plugin>
          <artifactId>maven-enforcer-plugin</artifactId>
          <version>${maven-enforcer-plugin.version}</version>
        </plugin>
        <plugin>
          <artifactId>maven-failsafe-plugin</artifactId>
          <version>${maven-failsafe-plugin.version}</version>
        </plugin>
        <plugin>
          <artifactId>maven-install-plugin</artifactId>
          <version>${maven-install-plugin.version}</version>
        </plugin>
        <plugin>
          <artifactId>maven-invoker-plugin</artifactId>
          <version>${maven-invoker-plugin.version}</version>
        </plugin>
        <plugin>
          <artifactId>maven-help-plugin</artifactId>
          <version>${maven-help-plugin.version}</version>
        </plugin>
        <plugin>
          <artifactId>maven-jar-plugin</artifactId>
          <version>${maven-jar-plugin.version}</version>
        </plugin>
        <plugin>
          <artifactId>maven-javadoc-plugin</artifactId>
          <version>${maven-javadoc-plugin.version}</version>
        </plugin>
        <plugin>
          <artifactId>maven-resources-plugin</artifactId>
          <version>${maven-resources-plugin.version}</version>
        </plugin>
```

## 4. surefire, failsafe 플러그인

두 메이븐 플러그인 모두 테스트를 위해 사용하지만, 다음과 같은 차이점이 있습니다.
- `maven-surefire-plugin` 플러그인
    - 단위 테스트(unit test)를 위해 만들어졌습니다.
    - 테스트가 실패할 경우 빌드를 즉시 실패시킵니다.
- `maven-failsafe-plugin` 플러그인
    - 결합 테스트(integration test)를 위해 만들어졌습니다.
    - 만약, 결합 테스트 수행 중에 테스트가 실패하더라도 빌드 중단을 차단합니다.

두 플러그인이 각자 어떤 테스트를 지원하는지는 알았는데, 이번엔 단위 테스트와 결합 테스트에 대한 정리가 필요해보입니다. 
- 단위 테스트
    - 테스트가 가능한 가장 작은 단위를 실행하여 예상대로 동작하는지 확인하는 테스트입니다.
    - 일반적으로 클래스 또는 메소드 수준으로 테스트합니다.
    - `Java` 진영에서는 주로 `Junit` 프레임워크를 사용합니다. 
- 결합 테스트
    - 시스템을 이루는 여러 모듈들을 모아 이들이 의도대로 협력하는지 확인하는 테스트입니다.
    - 개발자가 검증할 수 없는 외부 라이브러리, 데이터베이스 등 다양한 환경과 연결되어 제대로 동작하는지 확인합니다.
    - 저희 팀은 프레임워크의 필요한 기능을 모두 사용하는 테스트를 결합 테스트로 간주하고 있습니다.
    - 예를 들어, 스프링을 사용하는 경우 `@SpringBootTest` 애너테이션이 붙은 테스트를 결합 테스트로 간주합니다.

결합 테스트의 경우 개발자가 작성한 코드 이 외의 의존성(dependency)들도 함께 테스트하기 때문에 테스트가 깨지기 쉬울 것 같은데, 그런 취지에서 `maven-failsafe-plugin` 플러그인이 만들어졌는지 알아봐야겠습니다. 

## 5. surefire, failsafe 플러그인 적용하기

### 5.1. pom.xml

- `maven-surefire-plugin` 플러그인을 추가합니다.
    - 기본적으로 테스트 스킵(skip) 여부는 `false` 입니다.
    - `-Dskip.unit.tests=true` 명령어 옵션으로 단위 테스트를 생략할 수 있는 설정을 추가합니다.
- `maven-failsafe-plugin` 플러그인을 추가합니다.
    - 적용 `플러그인-골`은 `integration-test`, `verify` 입니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.6.5</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>

    <groupId>action.in.blog</groupId>
    <artifactId>action-in-blog</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>action-in-blog</name>
    <description>action-in-blog</description>

    <properties>
        <java.version>11</java.version>
        <skip.unit.tests>false</skip.unit.tests>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <configuration>
                    <skipTests>${skip.unit.tests}</skipTests>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-failsafe-plugin</artifactId>
                <executions>
                    <execution>
                        <goals>
                            <goal>integration-test</goal>
                            <goal>verify</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>

</project>
```

### 5.2. 프로젝트 구조 및 테스트 코드

#### 5.2.1. 프로젝트 구조

- 두 개의 테스트 코드를 만듭니다.
    - ActionInBlogApplicationIT - 결합 테스트를 위한 테스트 코드
    - ActionInBlogApplicationTests - 단위 테스트를 위한 테스트 코드

```
./
├── HELP.md
├── action-in-blog.iml
├── mvnw
├── mvnw.cmd
├── pom.xml
└── src
    ├── main
    │   ├── java
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               └── ActionInBlogApplication.java
    │   └── resources
    │       ├── application.properties
    │       ├── static
    │       └── templates
    └── test
        └── java
            └── action
                └── in
                    └── blog
                        ├── ActionInBlogApplicationIT.java
                        └── ActionInBlogApplicationTests.java
```

#### 5.2.2. ActionInBlogApplicationIT 클래스

- 결합 테스트이므로 `@SpringBootTest` 애너테이션을 추가합니다.

```java
package action.in.blog;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ActionInBlogApplicationIT {

    @Test
    void contextLoads() {
    }

}
```

#### 5.2.3. ActionInBlogApplicationTests 클래스

```java
package action.in.blog;

import org.junit.jupiter.api.Test;

class ActionInBlogApplicationTests {

    @Test
    void contextLoads() {
    }

}
```

### 5.3. 단위 테스트 실행

- 다음과 같은 명령어를 통해 단위 테스트를 실행합니다.
    - `mvn test`
- 실행되는 테스트는 `ActionInBlogApplicationTests` 클래스 1개입니다.
- `maven-surefire-plugin` 플러그인은 기본적으로 아래와 같은 이름을 가진 클래스들의 테스트를 지원합니다. 
    - "**/Test*.java" - includes all of its subdirectories and all Java filenames that start with "Test".
    - "**/*Test.java" - includes all of its subdirectories and all Java filenames that end with "Test".
    - "**/*Tests.java" - includes all of its subdirectories and all Java filenames that end with "Tests".
    - "**/*TestCase.java" - includes all of its subdirectories and all Java filenames that end with "TestCase".
- 필요한 경우 `<configuration>...</configuration>` 태그 안에 설정을 통해 포함, 제거할 클래스 이름을 지정할 수 있습니다.

```
$ mvn test                                   
[INFO] Scanning for projects...
[INFO] 
[INFO] -------------------< action.in.blog:action-in-blog >--------------------
[INFO] Building action-in-blog 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:resources (default-resources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] Copying 1 resource
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.8.1:compile (default-compile) @ action-in-blog ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:testResources (default-testResources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] skip non existing resourceDirectory /Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins/src/test/resources
[INFO] 
[INFO] --- maven-compiler-plugin:3.8.1:testCompile (default-testCompile) @ action-in-blog ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 2 source files to /Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins/target/test-classes
[INFO] 
[INFO] --- maven-surefire-plugin:2.22.2:test (default-test) @ action-in-blog ---
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running action.in.blog.ActionInBlogApplicationTests
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.018 s - in action.in.blog.ActionInBlogApplicationTests
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  2.273 s
[INFO] Finished at: 2022-03-29T04:15:27+09:00
[INFO] ------------------------------------------------------------------------
```

### 5.4. 결합 테스트 실행

- 다음과 같은 명령어를 통해 결합 테스트를 실행합니다.
    - `mvn -Dskip.unit.tests=true integration-test`
    - `integration-test` 페이즈 이전에 실행되어야 하는 `test` 페이즈는 `-Dskip.unit.tests=true` 옵션으로 생략합니다.
- 실행되는 테스트는 `ActionInBlogApplicationIT` 클래스 1개입니다.
- `maven-failsafe-plugin` 플러그인은 기본적으로 아래와 같은 이름을 가진 클래스들의 테스트를 지원합니다. 
    - "**/IT*.java" - includes all of its subdirectories and all Java filenames that start with "IT".
    - "**/*IT.java" - includes all of its subdirectories and all Java filenames that end with "IT".
    - "**/*ITCase.java" - includes all of its subdirectories and all Java filenames that end with "ITCase".
- 필요한 경우 `<configuration>...</configuration>` 태그 안에 설정을 통해 포함, 제거할 클래스 이름을 지정할 수 있습니다.

```
mvn -Dskip.unit.tests=true integration-test
[INFO] Scanning for projects...
[INFO] 
[INFO] -------------------< action.in.blog:action-in-blog >--------------------
[INFO] Building action-in-blog 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:resources (default-resources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] Copying 1 resource
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.8.1:compile (default-compile) @ action-in-blog ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:testResources (default-testResources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] skip non existing resourceDirectory /Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins/src/test/resources
[INFO] 
[INFO] --- maven-compiler-plugin:3.8.1:testCompile (default-testCompile) @ action-in-blog ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 2 source files to /Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins/target/test-classes
[INFO] 
[INFO] --- maven-surefire-plugin:2.22.2:test (default-test) @ action-in-blog ---
[INFO] Tests are skipped.
[INFO] 
[INFO] --- maven-jar-plugin:3.2.2:jar (default-jar) @ action-in-blog ---
[INFO] 
[INFO] --- spring-boot-maven-plugin:2.6.5:repackage (repackage) @ action-in-blog ---
[INFO] Replacing main artifact with repackaged archive
[INFO] 
[INFO] --- maven-failsafe-plugin:2.22.2:integration-test (default) @ action-in-blog ---
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running action.in.blog.ActionInBlogApplicationIT
04:19:11.203 [main] DEBUG org.springframework.test.context.BootstrapUtils - Instantiating CacheAwareContextLoaderDelegate from class [org.springframework.test.context.cache.DefaultCacheAwareContextLoaderDelegate]
04:19:11.209 [main] DEBUG org.springframework.test.context.BootstrapUtils - Instantiating BootstrapContext using constructor [public org.springframework.test.context.support.DefaultBootstrapContext(java.lang.Class,org.springframework.test.context.CacheAwareContextLoaderDelegate)]
04:19:11.235 [main] DEBUG org.springframework.test.context.BootstrapUtils - Instantiating TestContextBootstrapper for test class [action.in.blog.ActionInBlogApplicationIT] from class [org.springframework.boot.test.context.SpringBootTestContextBootstrapper]
04:19:11.243 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Neither @ContextConfiguration nor @ContextHierarchy found for test class [action.in.blog.ActionInBlogApplicationIT], using SpringBootContextLoader
04:19:11.245 [main] DEBUG org.springframework.test.context.support.AbstractContextLoader - Did not detect default resource location for test class [action.in.blog.ActionInBlogApplicationIT]: class path resource [action/in/blog/ActionInBlogApplicationIT-context.xml] does not exist
04:19:11.245 [main] DEBUG org.springframework.test.context.support.AbstractContextLoader - Did not detect default resource location for test class [action.in.blog.ActionInBlogApplicationIT]: class path resource [action/in/blog/ActionInBlogApplicationITContext.groovy] does not exist
04:19:11.245 [main] INFO org.springframework.test.context.support.AbstractContextLoader - Could not detect default resource locations for test class [action.in.blog.ActionInBlogApplicationIT]: no resource found for suffixes {-context.xml, Context.groovy}.
04:19:11.245 [main] INFO org.springframework.test.context.support.AnnotationConfigContextLoaderUtils - Could not detect default configuration classes for test class [action.in.blog.ActionInBlogApplicationIT]: ActionInBlogApplicationIT does not declare any static, non-private, non-final, nested classes annotated with @Configuration.
04:19:11.278 [main] DEBUG org.springframework.test.context.support.ActiveProfilesUtils - Could not find an 'annotation declaring class' for annotation type [org.springframework.test.context.ActiveProfiles] and class [action.in.blog.ActionInBlogApplicationIT]
04:19:11.315 [main] DEBUG org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider - Identified candidate component class: file [/Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins/target/classes/action/in/blog/ActionInBlogApplication.class]
04:19:11.316 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Found @SpringBootConfiguration action.in.blog.ActionInBlogApplication for test class action.in.blog.ActionInBlogApplicationIT
04:19:11.368 [main] DEBUG org.springframework.boot.test.context.SpringBootTestContextBootstrapper - @TestExecutionListeners is not present for class [action.in.blog.ActionInBlogApplicationIT]: using defaults.
04:19:11.369 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Loaded default TestExecutionListener class names from location [META-INF/spring.factories]: [org.springframework.boot.test.mock.mockito.MockitoTestExecutionListener, org.springframework.boot.test.mock.mockito.ResetMocksTestExecutionListener, org.springframework.boot.test.autoconfigure.restdocs.RestDocsTestExecutionListener, org.springframework.boot.test.autoconfigure.web.client.MockRestServiceServerResetTestExecutionListener, org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrintOnlyOnFailureTestExecutionListener, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverTestExecutionListener, org.springframework.boot.test.autoconfigure.webservices.client.MockWebServiceServerTestExecutionListener, org.springframework.test.context.web.ServletTestExecutionListener, org.springframework.test.context.support.DirtiesContextBeforeModesTestExecutionListener, org.springframework.test.context.event.ApplicationEventsTestExecutionListener, org.springframework.test.context.support.DependencyInjectionTestExecutionListener, org.springframework.test.context.support.DirtiesContextTestExecutionListener, org.springframework.test.context.transaction.TransactionalTestExecutionListener, org.springframework.test.context.jdbc.SqlScriptsTestExecutionListener, org.springframework.test.context.event.EventPublishingTestExecutionListener]
04:19:11.375 [main] DEBUG org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Skipping candidate TestExecutionListener [org.springframework.test.context.transaction.TransactionalTestExecutionListener] due to a missing dependency. Specify custom listener classes or make the default listener classes and their required dependencies available. Offending class: [org/springframework/transaction/interceptor/TransactionAttributeSource]
04:19:11.375 [main] DEBUG org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Skipping candidate TestExecutionListener [org.springframework.test.context.jdbc.SqlScriptsTestExecutionListener] due to a missing dependency. Specify custom listener classes or make the default listener classes and their required dependencies available. Offending class: [org/springframework/transaction/interceptor/TransactionAttribute]
04:19:11.375 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Using TestExecutionListeners: [org.springframework.test.context.web.ServletTestExecutionListener@2b72cb8a, org.springframework.test.context.support.DirtiesContextBeforeModesTestExecutionListener@7f8a9499, org.springframework.test.context.event.ApplicationEventsTestExecutionListener@5d43661b, org.springframework.boot.test.mock.mockito.MockitoTestExecutionListener@12299890, org.springframework.boot.test.autoconfigure.SpringBootDependencyInjectionTestExecutionListener@2fba3fc4, org.springframework.test.context.support.DirtiesContextTestExecutionListener@4bf48f6, org.springframework.test.context.event.EventPublishingTestExecutionListener@420a85c4, org.springframework.boot.test.mock.mockito.ResetMocksTestExecutionListener@1c39680d, org.springframework.boot.test.autoconfigure.restdocs.RestDocsTestExecutionListener@62833051, org.springframework.boot.test.autoconfigure.web.client.MockRestServiceServerResetTestExecutionListener@1c852c0f, org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrintOnlyOnFailureTestExecutionListener@a37aefe, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverTestExecutionListener@5d99c6b5, org.springframework.boot.test.autoconfigure.webservices.client.MockWebServiceServerTestExecutionListener@266374ef]
04:19:11.378 [main] DEBUG org.springframework.test.context.support.AbstractDirtiesContextTestExecutionListener - Before test class: context [DefaultTestContext@6b58b9e9 testClass = ActionInBlogApplicationIT, testInstance = [null], testMethod = [null], testException = [null], mergedContextConfiguration = [WebMergedContextConfiguration@f14a7d4 testClass = ActionInBlogApplicationIT, locations = '{}', classes = '{class action.in.blog.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.context.SpringBootTestContextBootstrapper=true}', contextCustomizers = set[org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@4c39bec8, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@1f59a598, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.web.client.TestRestTemplateContextCustomizer@6f45df59, org.springframework.boot.test.autoconfigure.actuate.metrics.MetricsExportContextCustomizerFactory$DisableMetricExportContextCustomizer@6db9f5a4, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@0, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@32910148, org.springframework.boot.test.context.SpringBootTestArgs@1, org.springframework.boot.test.context.SpringBootTestWebEnvironment@3f49dace], resourceBasePath = 'src/main/webapp', contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map['org.springframework.test.context.web.ServletTestExecutionListener.activateListener' -> true]], class annotated with @DirtiesContext [false] with mode [null].

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v2.6.5)

2022-03-29 04:19:11.709  INFO 75409 --- [           main] a.in.blog.ActionInBlogApplicationIT      : Starting ActionInBlogApplicationIT using Java 17.0.1 on junhyunk-a01.vmware.com with PID 75409 (started by junhyunk in /Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins)
2022-03-29 04:19:11.710  INFO 75409 --- [           main] a.in.blog.ActionInBlogApplicationIT      : No active profile set, falling back to 1 default profile: "default"
2022-03-29 04:19:12.594  INFO 75409 --- [           main] a.in.blog.ActionInBlogApplicationIT      : Started ActionInBlogApplicationIT in 1.192 seconds (JVM running for 1.79)
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.706 s - in action.in.blog.ActionInBlogApplicationIT
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  4.468 s
[INFO] Finished at: 2022-03-29T04:19:13+09:00
[INFO] ------------------------------------------------------------------------
```

### 5.5. maven-failsafe-plugin 테스트 실패 시 빌드 실패 방지

아래와 같이 테스트를 일부러 실패시키는 코드를 추가하고 테스트를 다시 실행해보겠습니다.

##### ActionInBlogApplicationTests 클래스

```java
package action.in.blog;

import org.junit.jupiter.api.Test;

class ActionInBlogApplicationTests {

    @Test
    void contextLoads() {
        if(true) {
            throw new RuntimeException();
        }
    }

}
```

##### ActionInBlogApplicationTests

```java
package action.in.blog;

import org.junit.jupiter.api.Test;

class ActionInBlogApplicationTests {

    @Test
    void contextLoads() {
        if(true) {
            throw new RuntimeException();
        }
    }

}
```

#### 5.5.1. 단위 테스트

- 테스트가 실패하면서 빌드가 실패합니다.
    - `BUILD FAILURE` 로그 출력

```
$ mvn test            
[INFO] Scanning for projects...
[INFO] 
[INFO] -------------------< action.in.blog:action-in-blog >--------------------
[INFO] Building action-in-blog 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:resources (default-resources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] Copying 1 resource
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.8.1:compile (default-compile) @ action-in-blog ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:testResources (default-testResources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] skip non existing resourceDirectory /Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins/src/test/resources
[INFO] 
[INFO] --- maven-compiler-plugin:3.8.1:testCompile (default-testCompile) @ action-in-blog ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 2 source files to /Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins/target/test-classes
[INFO] 
[INFO] --- maven-surefire-plugin:2.22.2:test (default-test) @ action-in-blog ---
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running action.in.blog.ActionInBlogApplicationTests
[ERROR] Tests run: 1, Failures: 0, Errors: 1, Skipped: 0, Time elapsed: 0.023 s <<< FAILURE! - in action.in.blog.ActionInBlogApplicationTests
[ERROR] contextLoads  Time elapsed: 0.016 s  <<< ERROR!
java.lang.RuntimeException
        at action.in.blog.ActionInBlogApplicationTests.contextLoads(ActionInBlogApplicationTests.java:10)

[INFO] 
[INFO] Results:
[INFO] 
[ERROR] Errors: 
[ERROR]   ActionInBlogApplicationTests.contextLoads:10 Runtime
[INFO] 
[ERROR] Tests run: 1, Failures: 0, Errors: 1, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD FAILURE
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  2.314 s
[INFO] Finished at: 2022-03-29T04:38:43+09:00
[INFO] ------------------------------------------------------------------------
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-surefire-plugin:2.22.2:test (default-test) on project action-in-blog: There are test failures.
[ERROR] 
[ERROR] Please refer to /Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins/target/surefire-reports for the individual test results.
[ERROR] Please refer to dump files (if any exist) [date].dump, [date]-jvmRun[N].dump and [date].dumpstream.
[ERROR] -> [Help 1]
[ERROR] 
[ERROR] To see the full stack trace of the errors, re-run Maven with the -e switch.
[ERROR] Re-run Maven using the -X switch to enable full debug logging.
[ERROR] 
[ERROR] For more information about the errors and possible solutions, please read the following articles:
[ERROR] [Help 1] http://cwiki.apache.org/confluence/display/MAVEN/MojoFailureException
```

#### 5.5.2. 결합 테스트

- 테스트가 실패하더라도 빌드는 성공합니다.
    - `BUILD SUCCESS` 로그 출력

```
$ mvn -Dskip.unit.tests=true integration-test
[INFO] Scanning for projects...
[INFO] 
[INFO] -------------------< action.in.blog:action-in-blog >--------------------
[INFO] Building action-in-blog 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:resources (default-resources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] Copying 1 resource
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.8.1:compile (default-compile) @ action-in-blog ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:testResources (default-testResources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] skip non existing resourceDirectory /Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins/src/test/resources
[INFO] 
[INFO] --- maven-compiler-plugin:3.8.1:testCompile (default-testCompile) @ action-in-blog ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-surefire-plugin:2.22.2:test (default-test) @ action-in-blog ---
[INFO] Tests are skipped.
[INFO] 
[INFO] --- maven-jar-plugin:3.2.2:jar (default-jar) @ action-in-blog ---
[INFO] 
[INFO] --- spring-boot-maven-plugin:2.6.5:repackage (repackage) @ action-in-blog ---
[INFO] Replacing main artifact with repackaged archive
[INFO] 
[INFO] --- maven-failsafe-plugin:2.22.2:integration-test (default) @ action-in-blog ---
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running action.in.blog.ActionInBlogApplicationIT
04:39:19.672 [main] DEBUG org.springframework.test.context.BootstrapUtils - Instantiating CacheAwareContextLoaderDelegate from class [org.springframework.test.context.cache.DefaultCacheAwareContextLoaderDelegate]
04:39:19.677 [main] DEBUG org.springframework.test.context.BootstrapUtils - Instantiating BootstrapContext using constructor [public org.springframework.test.context.support.DefaultBootstrapContext(java.lang.Class,org.springframework.test.context.CacheAwareContextLoaderDelegate)]
04:39:19.703 [main] DEBUG org.springframework.test.context.BootstrapUtils - Instantiating TestContextBootstrapper for test class [action.in.blog.ActionInBlogApplicationIT] from class [org.springframework.boot.test.context.SpringBootTestContextBootstrapper]
04:39:19.711 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Neither @ContextConfiguration nor @ContextHierarchy found for test class [action.in.blog.ActionInBlogApplicationIT], using SpringBootContextLoader
04:39:19.713 [main] DEBUG org.springframework.test.context.support.AbstractContextLoader - Did not detect default resource location for test class [action.in.blog.ActionInBlogApplicationIT]: class path resource [action/in/blog/ActionInBlogApplicationIT-context.xml] does not exist
04:39:19.713 [main] DEBUG org.springframework.test.context.support.AbstractContextLoader - Did not detect default resource location for test class [action.in.blog.ActionInBlogApplicationIT]: class path resource [action/in/blog/ActionInBlogApplicationITContext.groovy] does not exist
04:39:19.714 [main] INFO org.springframework.test.context.support.AbstractContextLoader - Could not detect default resource locations for test class [action.in.blog.ActionInBlogApplicationIT]: no resource found for suffixes {-context.xml, Context.groovy}.
04:39:19.714 [main] INFO org.springframework.test.context.support.AnnotationConfigContextLoaderUtils - Could not detect default configuration classes for test class [action.in.blog.ActionInBlogApplicationIT]: ActionInBlogApplicationIT does not declare any static, non-private, non-final, nested classes annotated with @Configuration.
04:39:19.743 [main] DEBUG org.springframework.test.context.support.ActiveProfilesUtils - Could not find an 'annotation declaring class' for annotation type [org.springframework.test.context.ActiveProfiles] and class [action.in.blog.ActionInBlogApplicationIT]
04:39:19.781 [main] DEBUG org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider - Identified candidate component class: file [/Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins/target/classes/action/in/blog/ActionInBlogApplication.class]
04:39:19.782 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Found @SpringBootConfiguration action.in.blog.ActionInBlogApplication for test class action.in.blog.ActionInBlogApplicationIT
04:39:19.835 [main] DEBUG org.springframework.boot.test.context.SpringBootTestContextBootstrapper - @TestExecutionListeners is not present for class [action.in.blog.ActionInBlogApplicationIT]: using defaults.
04:39:19.835 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Loaded default TestExecutionListener class names from location [META-INF/spring.factories]: [org.springframework.boot.test.mock.mockito.MockitoTestExecutionListener, org.springframework.boot.test.mock.mockito.ResetMocksTestExecutionListener, org.springframework.boot.test.autoconfigure.restdocs.RestDocsTestExecutionListener, org.springframework.boot.test.autoconfigure.web.client.MockRestServiceServerResetTestExecutionListener, org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrintOnlyOnFailureTestExecutionListener, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverTestExecutionListener, org.springframework.boot.test.autoconfigure.webservices.client.MockWebServiceServerTestExecutionListener, org.springframework.test.context.web.ServletTestExecutionListener, org.springframework.test.context.support.DirtiesContextBeforeModesTestExecutionListener, org.springframework.test.context.event.ApplicationEventsTestExecutionListener, org.springframework.test.context.support.DependencyInjectionTestExecutionListener, org.springframework.test.context.support.DirtiesContextTestExecutionListener, org.springframework.test.context.transaction.TransactionalTestExecutionListener, org.springframework.test.context.jdbc.SqlScriptsTestExecutionListener, org.springframework.test.context.event.EventPublishingTestExecutionListener]
04:39:19.841 [main] DEBUG org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Skipping candidate TestExecutionListener [org.springframework.test.context.transaction.TransactionalTestExecutionListener] due to a missing dependency. Specify custom listener classes or make the default listener classes and their required dependencies available. Offending class: [org/springframework/transaction/interceptor/TransactionAttributeSource]
04:39:19.841 [main] DEBUG org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Skipping candidate TestExecutionListener [org.springframework.test.context.jdbc.SqlScriptsTestExecutionListener] due to a missing dependency. Specify custom listener classes or make the default listener classes and their required dependencies available. Offending class: [org/springframework/transaction/interceptor/TransactionAttribute]
04:39:19.841 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Using TestExecutionListeners: [org.springframework.test.context.web.ServletTestExecutionListener@2b72cb8a, org.springframework.test.context.support.DirtiesContextBeforeModesTestExecutionListener@7f8a9499, org.springframework.test.context.event.ApplicationEventsTestExecutionListener@5d43661b, org.springframework.boot.test.mock.mockito.MockitoTestExecutionListener@12299890, org.springframework.boot.test.autoconfigure.SpringBootDependencyInjectionTestExecutionListener@2fba3fc4, org.springframework.test.context.support.DirtiesContextTestExecutionListener@4bf48f6, org.springframework.test.context.event.EventPublishingTestExecutionListener@420a85c4, org.springframework.boot.test.mock.mockito.ResetMocksTestExecutionListener@1c39680d, org.springframework.boot.test.autoconfigure.restdocs.RestDocsTestExecutionListener@62833051, org.springframework.boot.test.autoconfigure.web.client.MockRestServiceServerResetTestExecutionListener@1c852c0f, org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrintOnlyOnFailureTestExecutionListener@a37aefe, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverTestExecutionListener@5d99c6b5, org.springframework.boot.test.autoconfigure.webservices.client.MockWebServiceServerTestExecutionListener@266374ef]
04:39:19.843 [main] DEBUG org.springframework.test.context.support.AbstractDirtiesContextTestExecutionListener - Before test class: context [DefaultTestContext@6b58b9e9 testClass = ActionInBlogApplicationIT, testInstance = [null], testMethod = [null], testException = [null], mergedContextConfiguration = [WebMergedContextConfiguration@f14a7d4 testClass = ActionInBlogApplicationIT, locations = '{}', classes = '{class action.in.blog.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.context.SpringBootTestContextBootstrapper=true}', contextCustomizers = set[org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@4c39bec8, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@1f59a598, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.web.client.TestRestTemplateContextCustomizer@6f45df59, org.springframework.boot.test.autoconfigure.actuate.metrics.MetricsExportContextCustomizerFactory$DisableMetricExportContextCustomizer@6db9f5a4, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@0, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@32910148, org.springframework.boot.test.context.SpringBootTestArgs@1, org.springframework.boot.test.context.SpringBootTestWebEnvironment@3f49dace], resourceBasePath = 'src/main/webapp', contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map['org.springframework.test.context.web.ServletTestExecutionListener.activateListener' -> true]], class annotated with @DirtiesContext [false] with mode [null].

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v2.6.5)

2022-03-29 04:39:20.187  INFO 81652 --- [           main] a.in.blog.ActionInBlogApplicationIT      : Starting ActionInBlogApplicationIT using Java 17.0.1 on junhyunk-a01.vmware.com with PID 81652 (started by junhyunk in /Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins)
2022-03-29 04:39:20.188  INFO 81652 --- [           main] a.in.blog.ActionInBlogApplicationIT      : No active profile set, falling back to 1 default profile: "default"
2022-03-29 04:39:21.128  INFO 81652 --- [           main] a.in.blog.ActionInBlogApplicationIT      : Started ActionInBlogApplicationIT in 1.262 seconds (JVM running for 1.868)
[ERROR] Tests run: 1, Failures: 0, Errors: 1, Skipped: 0, Time elapsed: 1.779 s <<< FAILURE! - in action.in.blog.ActionInBlogApplicationIT
[ERROR] contextLoads  Time elapsed: 0.256 s  <<< ERROR!
java.lang.RuntimeException
        at action.in.blog.ActionInBlogApplicationIT.contextLoads(ActionInBlogApplicationIT.java:12)

[INFO] 
[INFO] Results:
[INFO] 
[ERROR] Errors: 
[ERROR]   ActionInBlogApplicationIT.contextLoads:12 Runtime
[INFO] 
[ERROR] Tests run: 1, Failures: 0, Errors: 1, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  3.972 s
[INFO] Finished at: 2022-03-29T04:39:21+09:00
[INFO] ------------------------------------------------------------------------
```

#### 5.5.3. verify 페이즈 실행

- `verify` 페이즈는 `integration-test` 페이즈의 통과 여부를 확인합니다.
- `integration-test` 페이즈에서 테스트가 실패하면 `install` 페이즈로 넘어가지 않습니다. 
    - `BUILD FAILURE` 로그 출력

```
mvn -Dskip.unit.tests=true verify          
[INFO] Scanning for projects...
[INFO] 
[INFO] -------------------< action.in.blog:action-in-blog >--------------------
[INFO] Building action-in-blog 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:resources (default-resources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] Copying 1 resource
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.8.1:compile (default-compile) @ action-in-blog ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-resources-plugin:3.2.0:testResources (default-testResources) @ action-in-blog ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Using 'UTF-8' encoding to copy filtered properties files.
[INFO] skip non existing resourceDirectory /Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins/src/test/resources
[INFO] 
[INFO] --- maven-compiler-plugin:3.8.1:testCompile (default-testCompile) @ action-in-blog ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-surefire-plugin:2.22.2:test (default-test) @ action-in-blog ---
[INFO] Tests are skipped.
[INFO] 
[INFO] --- maven-jar-plugin:3.2.2:jar (default-jar) @ action-in-blog ---
[INFO] 
[INFO] --- spring-boot-maven-plugin:2.6.5:repackage (repackage) @ action-in-blog ---
[INFO] Replacing main artifact with repackaged archive
[INFO] 
[INFO] --- maven-failsafe-plugin:2.22.2:integration-test (default) @ action-in-blog ---
[INFO] 
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running action.in.blog.ActionInBlogApplicationIT
04:40:11.621 [main] DEBUG org.springframework.test.context.BootstrapUtils - Instantiating CacheAwareContextLoaderDelegate from class [org.springframework.test.context.cache.DefaultCacheAwareContextLoaderDelegate]
04:40:11.627 [main] DEBUG org.springframework.test.context.BootstrapUtils - Instantiating BootstrapContext using constructor [public org.springframework.test.context.support.DefaultBootstrapContext(java.lang.Class,org.springframework.test.context.CacheAwareContextLoaderDelegate)]
04:40:11.653 [main] DEBUG org.springframework.test.context.BootstrapUtils - Instantiating TestContextBootstrapper for test class [action.in.blog.ActionInBlogApplicationIT] from class [org.springframework.boot.test.context.SpringBootTestContextBootstrapper]
04:40:11.660 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Neither @ContextConfiguration nor @ContextHierarchy found for test class [action.in.blog.ActionInBlogApplicationIT], using SpringBootContextLoader
04:40:11.662 [main] DEBUG org.springframework.test.context.support.AbstractContextLoader - Did not detect default resource location for test class [action.in.blog.ActionInBlogApplicationIT]: class path resource [action/in/blog/ActionInBlogApplicationIT-context.xml] does not exist
04:40:11.662 [main] DEBUG org.springframework.test.context.support.AbstractContextLoader - Did not detect default resource location for test class [action.in.blog.ActionInBlogApplicationIT]: class path resource [action/in/blog/ActionInBlogApplicationITContext.groovy] does not exist
04:40:11.663 [main] INFO org.springframework.test.context.support.AbstractContextLoader - Could not detect default resource locations for test class [action.in.blog.ActionInBlogApplicationIT]: no resource found for suffixes {-context.xml, Context.groovy}.
04:40:11.663 [main] INFO org.springframework.test.context.support.AnnotationConfigContextLoaderUtils - Could not detect default configuration classes for test class [action.in.blog.ActionInBlogApplicationIT]: ActionInBlogApplicationIT does not declare any static, non-private, non-final, nested classes annotated with @Configuration.
04:40:11.692 [main] DEBUG org.springframework.test.context.support.ActiveProfilesUtils - Could not find an 'annotation declaring class' for annotation type [org.springframework.test.context.ActiveProfiles] and class [action.in.blog.ActionInBlogApplicationIT]
04:40:11.731 [main] DEBUG org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider - Identified candidate component class: file [/Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins/target/classes/action/in/blog/ActionInBlogApplication.class]
04:40:11.731 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Found @SpringBootConfiguration action.in.blog.ActionInBlogApplication for test class action.in.blog.ActionInBlogApplicationIT
04:40:11.788 [main] DEBUG org.springframework.boot.test.context.SpringBootTestContextBootstrapper - @TestExecutionListeners is not present for class [action.in.blog.ActionInBlogApplicationIT]: using defaults.
04:40:11.789 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Loaded default TestExecutionListener class names from location [META-INF/spring.factories]: [org.springframework.boot.test.mock.mockito.MockitoTestExecutionListener, org.springframework.boot.test.mock.mockito.ResetMocksTestExecutionListener, org.springframework.boot.test.autoconfigure.restdocs.RestDocsTestExecutionListener, org.springframework.boot.test.autoconfigure.web.client.MockRestServiceServerResetTestExecutionListener, org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrintOnlyOnFailureTestExecutionListener, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverTestExecutionListener, org.springframework.boot.test.autoconfigure.webservices.client.MockWebServiceServerTestExecutionListener, org.springframework.test.context.web.ServletTestExecutionListener, org.springframework.test.context.support.DirtiesContextBeforeModesTestExecutionListener, org.springframework.test.context.event.ApplicationEventsTestExecutionListener, org.springframework.test.context.support.DependencyInjectionTestExecutionListener, org.springframework.test.context.support.DirtiesContextTestExecutionListener, org.springframework.test.context.transaction.TransactionalTestExecutionListener, org.springframework.test.context.jdbc.SqlScriptsTestExecutionListener, org.springframework.test.context.event.EventPublishingTestExecutionListener]
04:40:11.794 [main] DEBUG org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Skipping candidate TestExecutionListener [org.springframework.test.context.transaction.TransactionalTestExecutionListener] due to a missing dependency. Specify custom listener classes or make the default listener classes and their required dependencies available. Offending class: [org/springframework/transaction/interceptor/TransactionAttributeSource]
04:40:11.795 [main] DEBUG org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Skipping candidate TestExecutionListener [org.springframework.test.context.jdbc.SqlScriptsTestExecutionListener] due to a missing dependency. Specify custom listener classes or make the default listener classes and their required dependencies available. Offending class: [org/springframework/transaction/interceptor/TransactionAttribute]
04:40:11.795 [main] INFO org.springframework.boot.test.context.SpringBootTestContextBootstrapper - Using TestExecutionListeners: [org.springframework.test.context.web.ServletTestExecutionListener@2b72cb8a, org.springframework.test.context.support.DirtiesContextBeforeModesTestExecutionListener@7f8a9499, org.springframework.test.context.event.ApplicationEventsTestExecutionListener@5d43661b, org.springframework.boot.test.mock.mockito.MockitoTestExecutionListener@12299890, org.springframework.boot.test.autoconfigure.SpringBootDependencyInjectionTestExecutionListener@2fba3fc4, org.springframework.test.context.support.DirtiesContextTestExecutionListener@4bf48f6, org.springframework.test.context.event.EventPublishingTestExecutionListener@420a85c4, org.springframework.boot.test.mock.mockito.ResetMocksTestExecutionListener@1c39680d, org.springframework.boot.test.autoconfigure.restdocs.RestDocsTestExecutionListener@62833051, org.springframework.boot.test.autoconfigure.web.client.MockRestServiceServerResetTestExecutionListener@1c852c0f, org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrintOnlyOnFailureTestExecutionListener@a37aefe, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverTestExecutionListener@5d99c6b5, org.springframework.boot.test.autoconfigure.webservices.client.MockWebServiceServerTestExecutionListener@266374ef]
04:40:11.798 [main] DEBUG org.springframework.test.context.support.AbstractDirtiesContextTestExecutionListener - Before test class: context [DefaultTestContext@6b58b9e9 testClass = ActionInBlogApplicationIT, testInstance = [null], testMethod = [null], testException = [null], mergedContextConfiguration = [WebMergedContextConfiguration@f14a7d4 testClass = ActionInBlogApplicationIT, locations = '{}', classes = '{class action.in.blog.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.context.SpringBootTestContextBootstrapper=true}', contextCustomizers = set[org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@4c39bec8, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@1f59a598, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.web.client.TestRestTemplateContextCustomizer@6f45df59, org.springframework.boot.test.autoconfigure.actuate.metrics.MetricsExportContextCustomizerFactory$DisableMetricExportContextCustomizer@6db9f5a4, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@0, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@32910148, org.springframework.boot.test.context.SpringBootTestArgs@1, org.springframework.boot.test.context.SpringBootTestWebEnvironment@3f49dace], resourceBasePath = 'src/main/webapp', contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map['org.springframework.test.context.web.ServletTestExecutionListener.activateListener' -> true]], class annotated with @DirtiesContext [false] with mode [null].

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v2.6.5)

2022-03-29 04:40:11.991  INFO 81772 --- [           main] a.in.blog.ActionInBlogApplicationIT      : Starting ActionInBlogApplicationIT using Java 17.0.1 on junhyunk-a01.vmware.com with PID 81772 (started by junhyunk in /Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins)
2022-03-29 04:40:11.992  INFO 81772 --- [           main] a.in.blog.ActionInBlogApplicationIT      : No active profile set, falling back to 1 default profile: "default"
2022-03-29 04:40:12.926  INFO 81772 --- [           main] a.in.blog.ActionInBlogApplicationIT      : Started ActionInBlogApplicationIT in 1.102 seconds (JVM running for 1.7)
[ERROR] Tests run: 1, Failures: 0, Errors: 1, Skipped: 0, Time elapsed: 1.647 s <<< FAILURE! - in action.in.blog.ActionInBlogApplicationIT
[ERROR] contextLoads  Time elapsed: 0.276 s  <<< ERROR!
java.lang.RuntimeException
        at action.in.blog.ActionInBlogApplicationIT.contextLoads(ActionInBlogApplicationIT.java:12)

[INFO] 
[INFO] Results:
[INFO] 
[ERROR] Errors: 
[ERROR]   ActionInBlogApplicationIT.contextLoads:12 Runtime
[INFO] 
[ERROR] Tests run: 1, Failures: 0, Errors: 1, Skipped: 0
[INFO] 
[INFO] 
[INFO] --- maven-failsafe-plugin:2.22.2:verify (default) @ action-in-blog ---
[INFO] ------------------------------------------------------------------------
[INFO] BUILD FAILURE
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  3.891 s
[INFO] Finished at: 2022-03-29T04:40:13+09:00
[INFO] ------------------------------------------------------------------------
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-failsafe-plugin:2.22.2:verify (default) on project action-in-blog: There are test failures.
[ERROR] 
[ERROR] Please refer to /Users/junhyunk/Desktop/workspace/blog-in-action/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins/target/failsafe-reports for the individual test results.
[ERROR] Please refer to dump files (if any exist) [date].dump, [date]-jvmRun[N].dump and [date].dumpstream.
[ERROR] -> [Help 1]
[ERROR] 
[ERROR] To see the full stack trace of the errors, re-run Maven with the -e switch.
[ERROR] Re-run Maven using the -X switch to enable full debug logging.
[ERROR] 
[ERROR] For more information about the errors and possible solutions, please read the following articles:
[ERROR] [Help 1] http://cwiki.apache.org/confluence/display/MAVEN/MojoFailureException
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-03-28-maven-lifecycle-and-surfire-failsafe-plugins>

#### REFERENCE
- <https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html>
- <https://www.geeksforgeeks.org/maven-lifecycle-and-basic-maven-commands/>
- <http://wiki.gurubee.net/display/SWDEV/Maven+Lifecycle>
- <https://medium.com/@yetanothersoftwareengineer/maven-lifecycle-phases-plugins-and-goals-25d8e33fa22>
- <https://maven.apache.org/surefire/maven-surefire-plugin/faq.html#surefire-v-failsafe>
- <https://tecoble.techcourse.co.kr/post/2021-05-25-unit-test-vs-integration-test-vs-acceptance-test/>
- <https://maven.apache.org/surefire/maven-surefire-plugin/examples/inclusion-exclusion.html>
- <https://maven.apache.org/surefire/maven-failsafe-plugin/examples/inclusion-exclusion.html>
- <https://stackoverflow.com/questions/6308162/maven-the-packaging-for-this-project-did-not-assign-a-file-to-the-build-artifac>
- <https://stackoverflow.com/questions/28986005/what-is-the-difference-between-the-maven-surefire-and-maven-failsafe-plugins>
