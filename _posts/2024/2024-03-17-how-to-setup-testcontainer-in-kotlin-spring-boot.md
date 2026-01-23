---
title: "How to setup TestContainer in Kotlin Spring Boot"
search: false
category:
  - kotlin
  - spring-boot
  - test-container
last_modified_at: 2023-03-17T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [@DataJpaTest 애너테이션과 임베디드 데이터베이스 문제][do-not-replace-database-link]
- [테스트 컨테이너와 스프링 애플리케이션 MySQL 결합 테스트][test-container-for-database-link]
- [Use TestContainer on Runtime in Spring Boot][use-test-container-on-runtime-in-spring-boot-link]

## 0. 들어가면서

테스트 컨테이너(TestContainer)를 처음 사용했을 때가 23년 3월쯤인 것 같다. 당시엔 지금처럼 스프링에서 정식으로 지원하지 않았기 때문에 사용할 부가적인 작업들이 필요했다. 최근 프로젝트에서 테스트 컨테이너를 다시 적용하면서 다음 같은 사항들 때문에 생각보다 어려움을 겪었다.

- 이전엔 자바(java)를 사용했었지만, 이번엔 코틀린(kotlin)을 사용했다.
- 스프링이 공식적으로 지원하면서 사용 방법이 일부 변경됐다.

처음엔 예전 방식처럼 테스트 컨테이너를 적용했고, 프로젝트 후반에 스프링 부트 3.1 버전 이후 방식으로 다시 변경했다. [Use TestContainer on Runtime in Spring Boot][use-test-container-on-runtime-in-spring-boot-link] 글에서 테스트 컨테이너 관련 변경 사항들을 정리해둔 것들이 많은 도움이 됐다. 이 예제를 위해 필요한 의존성들은 다음과 같다.

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'com.fasterxml.jackson.module:jackson-module-kotlin'
    implementation 'org.jetbrains.kotlin:kotlin-reflect'
    runtimeOnly 'org.postgresql:postgresql'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.boot:spring-boot-testcontainers'
    testImplementation 'org.testcontainers:junit-jupiter'
    testImplementation 'org.testcontainers:postgresql'
}
```

## 1. Setup TestContainer in the first time 

처음엔 테스트 컨테이너를 예전 방식처럼 설정했다. 

- @AutoConfigureTestDatabase 애너테이션을 사용해 테스트에서 사용할 데이터베이스를 변경하지 않도록 설정한다.
  - @DataJpaTest 애너테이션은 기본적으로 H2 임베디드 데이터베이스를 사용한다.
  - [@DataJpaTest 애너테이션과 임베디드 데이터베이스 문제][do-not-replace-database-link] 글을 참고하길 바란다.
- 테스트 클래스에 @Testcontainers 애너테이션을 추가한다.
- 컨테이너 인스턴스에 @Container 애너테이션을 추가한다.
- @DynamicPropertySource 애너테이션과 DynamicPropertyRegistry 객체를 사용해 테스트 컨테이너를 테스트에 연결한다.
  - 코틀린의 경우 init 블록을 사용할 수 있다.
  - [Use TestContainer on Runtime in Spring Boot][use-test-container-on-runtime-in-spring-boot-link] 글을 참고하길 바란다.

```kotlin
package blog.`in`.action

import blog.`in`.action.domain.TodoEntity
import blog.`in`.action.repository.TodoRepository
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers

@DataJpaTest(
    properties = [
        "spring.jpa.hibernate.ddl-auto=create",
        "spring.jpa.show-sql=true"
    ]
)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class FirstSetupTests {

    companion object {

        @Container
        val postgresContainer = PostgreSQLContainer<Nothing>("postgres:16")

        @JvmStatic
        @DynamicPropertySource
        fun setPostgresProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgresContainer::getJdbcUrl)
            registry.add("spring.datasource.username", postgresContainer::getUsername)
            registry.add("spring.datasource.password", postgresContainer::getPassword)
        }
    }

    @PersistenceContext
    lateinit var entityManager: EntityManager

    @Autowired
    lateinit var sut: TodoRepository

    @Test
    fun findByContentContainsIgnoreCase() {
        val entity = TodoEntity(content = "Hello World")
        entityManager.persist(entity)
        entityManager.flush()
        entityManager.clear()


        val result = sut.findByContentContainsIgnoreCase("Hello World")


        assertEquals(1, result.size)
        assertEquals("Hello World", result[0].content)
    }
}
```

## 2. Change TestContainer setup

스프링 부트 3.1 버전 이상부터 제공하는 @ServiceConnection 애너테이션 덕분에 @DynamicPropertySource 애너테이션과 DynamicPropertyRegistry 클래스를 사용하지 않아도 된다.

- 테스트 컨테이너 필드 위에 @ServiceConnection 애너테이션을 추가한다.
- setPostgresProperties 메서드를 제거한다.

```kotlin
package blog.`in`.action

import blog.`in`.action.domain.TodoEntity
import blog.`in`.action.repository.TodoRepository
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers

@DataJpaTest(
    properties = [
        "spring.jpa.hibernate.ddl-auto=create",
        "spring.jpa.show-sql=true"
    ]
)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class SecondSetupTests {

    companion object {
        @Container
        @ServiceConnection
        val postgresContainer = PostgreSQLContainer<Nothing>("postgres:16")
    }

    @PersistenceContext
    lateinit var entityManager: EntityManager

    @Autowired
    lateinit var sut: TodoRepository

    @Test
    fun findByContentContainsIgnoreCase() {
        val entity = TodoEntity(content = "Hello World")
        entityManager.persist(entity)
        entityManager.flush()
        entityManager.clear()


        val result = sut.findByContentContainsIgnoreCase("Hello World")


        assertEquals(1, result.size)
        assertEquals("Hello World", result[0].content)
    }
}
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-03-17-how-to-setup-testcontainer-in-kotlin-spring-boot>

[do-not-replace-database-link]: https://junhyunny.github.io/spring-boot/jpa/test-driven-development/do-not-replace-database-when-using-data-jpa-test-annotation/
[test-container-for-database-link]: https://junhyunny.github.io/spring-boot/test-container/mysql/test-container-for-database/
[use-test-container-on-runtime-in-spring-boot-link]: https://junhyunny.github.io/spring-boot/use-test-container-on-runtime-in-spring-boot/