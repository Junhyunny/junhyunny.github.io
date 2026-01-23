---
title: "테스트 컨테이너와 스프링 애플리케이션 MySQL 결합 테스트"
search: false
category:
  - spring-boot
  - test-container
  - mysql
last_modified_at: 2024-04-12T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [@DataJpaTest 애너테이션과 임베디드 데이터베이스 문제][do-not-replace-database-when-using-data-jpa-test-annotation-link]

## 0. 들어가면서

스프링 애플리케이션과 데이터베이스의 결합 테스트(integration test)를 위해 사용할 수 있는 `테스트 컨테이너(TestContainer)`에 대해 정리했다. 

## 1. Pain Point of in-memory database in test

나는 데이터베이스가 필요한 비즈니스 로직을 테스트하기 위해 주로 인-메모리(in-memory) 데이터베이스를 사용했다. 인-메모리 데이터베이스는 다음과 같은 장점이 있다.

- 메모리 데이터베이스를 사용하기 때문에 실행 속도가 빠르다.
- 테스트마다 메모리에 데이터베이스를 구성하고, 테스트가 종료될 때 삭제하므로 멱등성(idempotent)이 보장된다. 멱등성이란 여러번 실행하더라도 결과가 바뀌지 않는 성질을 의미한다.
- 로컬 환경에서 테스트를 실행할 때 별도의 데이터베이스 연결이 필요하지 않다. 

아쉽게도 메모리 데이터베이스는 만능이 아니다. 장점도 많지만, 실제 사용하는 데이터베이스와 다르기 때문에 문제가 발생한다.

- 데이터베이스 엔진이 다르게 동작하기 때문에 실제 운영 데이터베이스와 다른 결과를 반환할 수 있다.
- 데이터베이스마다 다른 문법을 사용하기 때문에 대체 가능한 SQL 문법을 찾아야 한다. 예를 들어, ANSI SQL처럼 표준 문법만으로 비즈니스 기능을 모두 커버하기 어려울 수 있다. JPQL(Java Persistence Query Lanager)처럼 추상화 된 문법을 사용하더라도 해결하기 어려울 수 있다.
- 데이터베이스 전용 내장 함수를 사용한다면 대체 가능한 함수를 찾아야 한다. 

빠른 개발을 위해 메모리 데이터베이스를 사용하고 있었다면, 운영에 진입하기 전엔 운영 환경과 동일한 테스트 환경을 구축하는 편이 더 안정적인 것 같다. 개발/운영 데이터베이스를 사용하는 테스트는 데이터를 오염시킬 위험이 있기 때문에 이를 제외하고 다음과 같은 옵션들이 있다.

- 개발자 로컬 데이터베이스
  - 개발자 PC에 로컬 데이터베이스를 설치하고 이를 통해 테스트를 수행한다.
  - 테스트가 끝난 후에 데이터가 남게되면 다음 실행 시 동일한 결과가 얻지 못할 수 있으므로 멱등성 관리가 어렵다.
  - 개발자마다 로컬 데이터베이스에 관련된 설정이 다를 수 있기 때문에 통일된 설정 파일을 통해 관리하기 어렵다.
  - CI/CD 파이프라인에서 사용할 수 없다.
- 도커 컴포즈(docker compose)
  - YAML 파일에 필요한 이미지들을 명세하여 하나의 네트워크로 묶인 컨테이너(container) 그룹을 실행시킨다.
  - 실제 데이터베이스와 동일한 이미지를 기반으로 데이터베이스 컨테이너를 실행시킬 수 있다.
  - 데이터베이스 컨테이너에 연결하여 테스트를 수행하고, 테스트가 종료되면 컨테이너를 정리한다.
  - 매 테스트마다 초기화 된 데이터베이스에서 테스트를 진행하므로 멱등성 관리가 쉽다.
  - CI/CD 파이프라인에서 사용 가능하다.

## 2. TestContainer

도커 컴포즈는 최적의 선택지처럼 보이지만, 더 간편하게 개선된 테스트 방법도 존재한다. `테스트 컨테이너(TestContainer)`는 도커 컴포즈처럼 테스트를 위해 컨테이너를 실행시킨는 원리는 동일하지만, 프로젝트 설정과 코드만으로 테스트를 위한 컨테이너를 실행시킬 수 있다. 

> Testcontainers for Java is a Java library that supports JUnit tests, providing lightweight, throwaway instances of common databases, Selenium web browsers, or anything else that can run in a Docker container.

테스트 컨테이너는 이번 글에서 다루는 데이터베이스만 지원하지 않는다. 사실상 컨테이너 이미지로 제공되는 거의 모든 것들은 결합 테스트를 위해 사용할 수 있다. 

## 3. Practice

간단한 실습을 통해 사용 방법을 알아보자. 패키지 구조는 다음과 같다.

```
./
├── HELP.md
├── build.gradle
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
├── settings.gradle
└── src
    ├── main
    │   ├── java
    │   │   └── action
    │   │       └── in
    │   │           └── blog
    │   │               ├── ActionInBlogApplication.java
    │   │               └── post
    │   │                   ├── Post.java
    │   │                   └── PostRepository.java
    │   └── resources
    │       ├── application.properties
    │       ├── static
    │       └── templates
    └── test
        ├── java
        │   └── action
        │       └── in
        │           └── blog
        │               └── ApplicationIT.java
        └── resources
            ├── application-test.yml
            └── logback-test.xml
```

다음과 같은 의존성을 사용한다.

- `TestContainer` 관련된 의존성을 추가한다.
  - org.testcontainers:mysql:1.18.0
  - org.testcontainers:junit-jupiter:1.18.0
- 테스트에 사용할 데이터베이스는 MySQL이므로 관련된 의존성을 추가한다.
  - mysql:mysql-connector-java:8.0.32

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.0.5'
    id 'io.spring.dependency-management' version '1.1.0'
}

group = 'action.in.blog'
version = '0.0.1-SNAPSHOT'
sourceCompatibility = '17'

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation group: 'mysql', name: 'mysql-connector-java', version: '8.0.32'
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'

    testCompileOnly 'org.projectlombok:lombok'
    testAnnotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.testcontainers:mysql:1.18.0'
    testImplementation group: 'org.testcontainers', name: 'junit-jupiter', version: '1.18.0'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

테스트 컨텍스트에서 사용하는 `application-test.yml` 파일에 다음과 같은 설정을 추가한다. 프로파일(profile)을 `test`로 설정 후 사용하는 설정 파일이다.

- 컨테이너 URL정보를 입력한다.
  - jdbc:tc:mysql:8.0.32:///{database_name}
- 테스트 컨테이너에 접근할 때 사용하는 드라이버를 지정한다.
  - `ContainerDatabaseDriver`를 사용하지만, 내부에서 MySQL 드라이버를 사용하기 때문에 커넥터 의존성이 필요하다.
- 간편한 테스트를 위해 스키마를 자동으로 생성하도록 설정한다.
  - spring.jpa.hibernate.ddl-auto: create-drop
  - 운영 환경과 동일한 초기화 스크립트(script)를 사용하는 것도 좋은 방법이다.
- 기타 다른 데이터베이스 연결 정보는 아래 링크에서 확인할 수 있다.
  - <https://www.testcontainers.org/modules/databases/jdbc/>

```yml
spring:
  datasource:
    url: jdbc:tc:mysql:8.0.32:///test
    driver-class-name: org.testcontainers.jdbc.ContainerDatabaseDriver
  jpa:
    hibernate:
      ddl-auto: create-drop
```

다음과 같은 구현 코드를 작성한다. JpaRepository 인스턴스를 통해 간단한 조회 쿼리 기능을 제공한다.

- 네이티브(native) 쿼리를 실행하는 메서드를 선언한다.

```java
package action.in.blog.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Query(value = "select - from post p where p.title like trim(:title)", nativeQuery = true)
    List<Post> findByTitleContainsWithTrim(@Param("title") String title);
}
```

결합 테스트를 위한 코드는 다음과 같다. 애너테이션이 여러개 사용된다. 각 애너테이션이 어떤 기능을 제공하는지 확인하길 바란다.

- @ActiveProfiles 애너테이션
  - 실행 시 프로파일을 `test`로 지정한다.
- @AutoConfigureTestDatabase 애너테이션
  - @DataJpaTest 애너테이션을 사용한 테스트 시 데이터베이스가 바뀌지 않는 현상이 있다.
  - 설정한 데이터베이스를 사용할 수 있도록 설정한다. 관련된 컨텍스트는 [@DataJpaTest 애너테이션과 임베디드 데이터베이스 문제][do-not-replace-database-when-using-data-jpa-test-annotation-link] 글을 참고하기 바란다.
- @DataJpaTest 애너테이션
  - JPA 테스트를 위한 최소한의 컨텍스트를 준비한다.
- @Testcontainers 애너테이션
  - @Container 애너테이션이 붙은 인스턴스들과 연결된 컨테이너들의 라이프사이클을 관리한다.  
- @Container 애너테이션
  - 테스트 컨테이너를 생성하기 위해 사용한다.
  - 해당 애너테이션이 붙은 필드가 있는 경우 생성될 인스턴스를 통해 컨테이너 생성에 필요한 정보를 파악한다.
  - @TestContainers 애너테이션에 의해 생성, 소멸 라이프사이클이 관리된다.
- @Container 애너테이션이 붙은 필드에 따라 라이프사이클이 다르게 관리된다.
  - `static` 필드는 테스트들 사이에서 공유할 수 있는 컨테이너가 생성되며 한 번만 컨테이너를 실행하고, 마지막 테스트가 종료되면 컨테이너를 소멸시킨다.
  - `static` 키워드가 붙지 않은 `instance` 필드는 모든 테스트마다 컨테이너를 실행하고 소멸시킨다.

```java
package action.in.blog;

import action.in.blog.post.Post;
import action.in.blog.post.PostRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.core.IsEqual.equalTo;

@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DataJpaTest
@Testcontainers
class ApplicationIT {

    @Container
    static MySQLContainer<?> mysqlContainer = new MySQLContainer<>("mysql:8.0.32").withDatabaseName("test");

    @Autowired
    PostRepository sut;

    @Test
    void find_posts_by_title_containing_with_trim() {
        sut.save(
                Post.builder()
                        .title("Hello World")
                        .content("This is sample content")
                        .build()
        );


        List<Post> result = sut.findByTitleContainsWithTrim("       Hello World       ");


        Post firstPost = result.get(0);
        assertThat(result.size(), equalTo(1));
        assertThat(firstPost.getTitle(), equalTo("Hello World"));
        assertThat(firstPost.getContent(), equalTo("This is sample content"));
    }
}
```

위 테스트 코드가 실행되면 아래와 같이 쿼리가 실행되는 코드를 확인할 수 있다.

```
Hibernate: select next_val as id_val from post_seq for update
Hibernate: update post_seq set next_val= ? where next_val=?
Hibernate: insert into post (content, title, id) values (?, ?, ?)
Hibernate: select - from post p where p.title like trim(?)
```

## 4. Logging problem

테스트 컨테이너를 사용할 때 로그가 과도하게 출력된다. 이를 방지하기 위해 다음과 같은 로그 설정을 추가한다.

- 로그백(logback) 설정을 통해 로그를 제한한다.

```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger - %msg%n</pattern>
        </encoder>
    </appender>

    <root level="info">
        <appender-ref ref="STDOUT"/>
    </root>

    <logger name="org.testcontainers" level="INFO"/>
    <!-- The following logger can be used for containers logs since 1.18.0 -->
    <logger name="tc" level="INFO"/>
    <logger name="com.github.dockerjava" level="WARN"/>
    <logger name="com.github.dockerjava.zerodep.shaded.org.apache.hc.client5.http.wire" level="OFF"/>
</configuration>
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-04-12-test-container-for-database>

#### REFERENCE

- <https://www.testcontainers.org/>
- <https://www.testcontainers.org/modules/databases/jdbc/>
- <https://www.testcontainers.org/supported_docker_environment/logging_config/>
- <https://javadoc.io/doc/org.testcontainers/junit-jupiter/latest/org/testcontainers/junit/jupiter/Testcontainers.html>
- <https://javadoc.io/static/org.testcontainers/junit-jupiter/1.18.0/org/testcontainers/junit/jupiter/Container.html>
- [TestContainer 로 멱등성있는 integration test 환경 구축하기](https://medium.com/riiid-teamblog-kr/testcontainer-%EB%A1%9C-%EB%A9%B1%EB%93%B1%EC%84%B1%EC%9E%88%EB%8A%94-integration-test-%ED%99%98%EA%B2%BD-%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0-4a6287551a31)
- <https://elsboo.tistory.com/24>

[do-not-replace-database-when-using-data-jpa-test-annotation-link]: https://junhyunny.github.io/spring-boot/jpa/test-driven-development/do-not-replace-database-when-using-data-jpa-test-annotation/