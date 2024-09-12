---
title: "Problem of sharing ApplicationContext with TestContainer"
search: false
category:
  - kotlin
  - spring-boot
  - test-container
last_modified_at: 2024-03-19T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Problem of using embedded database in @DataJpaTest][do-not-replace-database-link]
- [How to setup TestContainer in Kotlin Spring Boot][testcontainer-in-kotlin-spring-boot-link]

## 0. 들어가면서

[How to setup TestContainer in Kotlin Spring Boot][testcontainer-in-kotlin-spring-boot-link]에서 테스트 컨테이너를 사용하는 방법에 대해 정리했다. 이번 글은 테스트 컨테이너(TestConatiner)를 설정하는 코드를 상위 클래스에 옮기는 리팩토링을 수행했을 때 발생하는 문제에 대해 정리했다. 예제 코드는 문제가 발생했던 상황을 일부 각색했다.

## 1. Problem Context

다음과 같이 테스트 컨테이너를 사용하는 테스트 코드가 있다. 어떤 메소드를 테스트하는지 중요하지 않으므로 설명은 생략한다.

```kotlin
@Testcontainers
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TodoRepositoryTest {

    companion object {
        @Container
        @ServiceConnection
        val postgresContainer = PostgreSQLContainer("postgres:16")
    }

    @PersistenceContext
    lateinit var entityManager: EntityManager

    @Autowired
    lateinit var sut: TodoRepository

    fun flushAndClear() {
        this.entityManager.flush()
        this.entityManager.clear()
    }

    @Test
    fun findByContentContains() {
        val todoEntity = TodoEntity(content = "This is new hello world")
        entityManager.persist(todoEntity)
        flushAndClear()


        val result = sut.findByContentContains("hello world")


        assertEquals(1, result.size)
        assertEquals("This is new hello world", result[0].content)
    }
}
```

보통 데이터베이스와 연결된 결합 테스트는 한, 두개가 아니다. 모든 테스트에 테스트 컨테이너를 연결하는 코드를 추가하는 것은 너무 불합리하다. 테스트 컨테이너를 연결하는 코드를 부모 클래스로 올리고 싶은 충동이 생길 것이다. 필자는 다음과 같은 리팩토링을 수행했다. 

- 테스트 컨테이너를 연결하는 설정 코드를 TestContainerDatabase 추상 클래스로 옮긴다.
- 데이터베이스 결합 테스트와 관련된 코드를 TestStoreConfig 추상 클래스로 옮긴다.
- 테스트 컨테이너를 연결하는 설정 클래스와 데이터베이스 결합 테스트 관련 클래스를 나눈 이유는 데이터베이스와 관련 없는 결합 테스트(@SpringBootTest)에서도 데이터베이스 연결이 필요하기 때문이다.

<p align="center">
  <img src="/images/posts/2024/problem-of-sharing-application-context-with-test-container-01.png" width="80%" class="image__border">
</p>

### 1.1. TestContainerDatabase Class

테스트 컨테이너를 만들고 연결하는 추상 클래스는 다음과 같다. TestContainerDatabase 추상 클래스를 상속한 테스트 클래스는 Postgres 데이터베이스를 컨테이너로 만들고 테스트 환경과 연결한다.

```kotlin
package blog.`in`.action

import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers

@Testcontainers
abstract class TestContainerDatabase {

    companion object {

        @Container
        @ServiceConnection
        val postgresContainer = PostgreSQLContainer("postgres:16")
    }
}
```

### 1.2. TestStoreConfig Class

데이터베이스 결합 테스트를 위한 @DataJpaTest 애너테이션, @AutoConfigureTestDatabase 애너테이션을 클래스 위에 명시한다. 테스트 대상 시스템을 도와줄 엔티티 매니저(EntityManager) 인스턴스와 메소드를 함께 정의한다.

```kotlin
package blog.`in`.action

import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
abstract class TestStoreConfig : TestContainerDatabase() {

    @PersistenceContext
    lateinit var entityManager: EntityManager

    fun flushAndClear() {
        this.entityManager.flush()
        this.entityManager.clear()
    }
}
```

### 1.3. TodoRepositoryTest Class

실제 테스트 코드는 다음과 같이 변경한다. TestStoreConfig 추상 클래스를 상속 받는 것으로 테스트에 필요한 모든 환경이 준비된다. 테스트 대상 시스템을 제외한 코드가 모두 정리된다.

```kotlin
package blog.`in`.action.repository

import blog.`in`.action.TestStoreConfig
import blog.`in`.action.domain.TodoEntity
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

class TodoRepositoryTest : TestStoreConfig() {

    @Autowired
    lateinit var sut: TodoRepository

    @Test
    fun findByContentContains() {
        val entity = TodoEntity(content = "This is new hello world")
        entityManager.persist(entity)
        flushAndClear()


        val result = sut.findByContentContains("hello world")


        assertEquals(1, result.size)
        assertEquals("This is new hello world", result[0].content)
    }
}
```

### 1.4. Failed running tests

모든 리팩토링은 끝났다. 이제 테스트를 실행해보자. 각 클래스 별로 테스트를 실행하면 문제가 없지만, 모든 테스트를 한번에 실행하면 문제가 발생한다. 

<p align="center">
  <img src="/images/posts/2024/problem-of-sharing-application-context-with-test-container-02.png" width="100%" class="image__border">
</p>

## 2. Solve the problem

문제의 원인을 먼저 살펴보자.

### 2.1. Cause of the problem

스프링 결합 테스트들은 컨텍스트를 캐싱하고 공유한다. 스프링 공식 홈페이지를 살펴보면 다음과 같은 설명을 볼 수 있다.

> The Spring TestContext Framework provides consistent loading of Spring ApplicationContext instances and WebApplicationContext instances as well as caching of those contexts. Support for the caching of loaded contexts is important, because startup time can become an issue — not because of the overhead of Spring itself, but because the objects instantiated by the Spring container take time to instantiate. <br/>
> ... <br/>
> By default, once loaded, the configured ApplicationContext is reused for each test. Thus, the setup cost is incurred only once per test suite, and subsequent test execution is much faster. 

결합 테스트는 스프링 애플리케이션 컨텍스트(application context)를 준비하는데 비용이 크기 때문에 테스트 속도 향상을 위해 한번 로드한 애플리케이션 컨텍스트를 캐싱(caching)하고 재사용한다. 애플리케이션 컨텍스트 캐싱과 테스트 컨테이너의 기능이 충돌하면서 문제가 발생한다. 자세한 설명을 이어가기 전에 테스트 코드의 로그를 먼저 살펴보자. 성공한 테스트의 로그 일부분이다. 

- jdbc:postgresql://localhost:54671/test 주소를 갖는 데이터베이스 테스트 컨테이너가 실행된다. 

```
Creating container for image: testcontainers/ryuk:0.6.0
Container testcontainers/ryuk:0.6.0 is starting: bb11b7fc31aa45195048284d0cdba045f01fb642dd716812330de545a842c644
Container testcontainers/ryuk:0.6.0 started in PT0.903013S
Ryuk started - will monitor and terminate Testcontainers containers on JVM exit
Checking the system...
✔︎ Docker server version should be at least 1.6.0
Creating container for image: postgres:16
Container postgres:16 is starting: d2d6326e3614ffe06404644e68cee759813a118bcf2faed994709456e6b208b0
Container postgres:16 started in PT1.446312S
Container is started (JDBC URL: jdbc:postgresql://localhost:54671/test?loggerLevel=OFF)
```

- jdbc:postgresql://localhost:54710/test 주소를 갖는 데이터베이스 테스트 컨테이너가 실행된다. 
- PgConnection 인스턴스가 데이터베이스 연결을 시도하지만 실패한다. 이전 테스트에서 사용했던 데이터베이스에 연결을 시도한다.

```
Creating container for image: postgres:16
Container postgres:16 is starting: 3c085ed6f72833ed0d3372f9fb123a18d29480ab7ee81c1686fe88e7191f2ebb
Container postgres:16 started in PT1.349677S
Container is started (JDBC URL: jdbc:postgresql://localhost:54710/test?loggerLevel=OFF)
Could not detect default configuration classes for test class [blog.in.action.repository.TodoRepositoryTest]: TodoRepositoryTest does not declare any static, non-private, non-final, nested classes annotated with @Configuration.
Found @SpringBootConfiguration blog.in.action.ActionInBlogApplication for test class blog.in.action.repository.TodoRepositoryTest
HikariPool-1 - Failed to validate connection org.postgresql.jdbc.PgConnection@718ad3a6 (This connection has been closed.). Possibly consider using a shorter maxLifetime value.
HikariPool-1 - Failed to validate connection org.postgresql.jdbc.PgConnection@40bac624 (This connection has been closed.). Possibly consider using a shorter maxLifetime value.
HikariPool-1 - Failed to validate connection org.postgresql.jdbc.PgConnection@1bc80978 (This connection has been closed.). Possibly consider using a shorter maxLifetime value.
HikariPool-1 - Failed to validate connection org.postgresql.jdbc.PgConnection@1c8746a0 (This connection has been closed.). Possibly consider using a shorter maxLifetime value.
HikariPool-1 - Failed to validate connection org.postgresql.jdbc.PgConnection@613d42ab (This connection has been closed.). Possibly consider using a shorter maxLifetime value.
HikariPool-1 - Failed to validate connection org.postgresql.jdbc.PgConnection@7720334e (This connection has been closed.). Possibly consider using a shorter maxLifetime value.
HikariPool-1 - Failed to validate connection org.postgresql.jdbc.PgConnection@77035caa (This connection has been closed.). Possibly consider using a shorter maxLifetime value.
HikariPool-1 - Failed to validate connection org.postgresql.jdbc.PgConnection@18ac2dfe (This connection has been closed.). Possibly consider using a shorter maxLifetime value.
HikariPool-1 - Failed to validate connection org.postgresql.jdbc.PgConnection@761d679f (This connection has been closed.). Possibly consider using a shorter maxLifetime value.
HikariPool-1 - Failed to validate connection org.postgresql.jdbc.PgConnection@a824f87 (This connection has been closed.). Possibly consider using a shorter maxLifetime value.
SQL Error: 0, SQLState: 08001
HikariPool-1 - Connection is not available, request timed out after 30005ms.
Connection to localhost:54671 refused. Check that the hostname and port are correct and that the postmaster is accepting TCP/IP connections.
Caught exception while invoking 'beforeTestMethod' callback on TestExecutionListener [org.springframework.test.context.transaction.TransactionalTestExecutionListener] for test method [public void blog.in.action.repository.TodoRepositoryTest.findByContentContains()] and test instance [blog.in.action.repository.TodoRepositoryTest@1fcef7]
```

두 로그로부터 얻은 정보와 디버그 포인트를 만들어 확인한 테스트 컨테이너의 라이프사이클을 종합하면 다음과 같이 정리할 수 있다.

1. 54671 포트 번호를 갖는 데이터베이스 테스트 컨테이너가 준비된다. `A 데이터베이스`라고 명칭한다.
2. A 데이터베이스에 접속하기 위한 애플리케이션 컨텍스트가 생성된다.
3. TodoRepositoryTest 클래스 테스트가 실행된다. **테스트가 종료되면 테스트 컨테이너 A 데이터베이스가 함께 삭제된다.**
4. 54710 포트 번호를 갖는 데이터베이스 테스트 컨테이너가 준비된다. `B 데이터베이스`라고 명칭한다.
5. ReplyRepositoryTest 클래스 테스트가 실행된다. 이전 테스트에서 만든 컨텍스트를 재사용한다. 
6. ReplyRepositoryTest 테스트는 현재 생성된 B 데이터베이스가 아닌 이전 테스트가 종료되면서 함께 삭제된 A 데이터베이스에 연결을 시도한다. 

<p align="center">
  <img src="/images/posts/2024/problem-of-sharing-application-context-with-test-container-03.png" width="80%" class="image__border">
</p>

### 2.2. Using @DirtiesContext Annotation

두 가지 기능이 충돌하면서 문제를 일으켰다. 두 기능 중 한가지를 막으면 문제가 해결된다. 먼저 애플리케이션 컨텍스트를 공유하지 않도록 막는 방법을 알아보자. @DirtiesContext 애너테이션을 사용하면 애플리케이션 컨텍스트를 매번 새로 만들어 테스트를 격리한다. 

- 테스트 컨테이너를 사용하는 모든 테스트 클래스에 적용될 수 있도록 TestContainerDatabase 추상 클래스 위에 @DirtiesContext 애너테이션을 추가한다.

```kotlin
package blog.`in`.action

import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.test.annotation.DirtiesContext
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers

@DirtiesContext
@Testcontainers
abstract class TestContainerDatabase {

    companion object {

        @Container
        @ServiceConnection
        val postgresContainer = PostgreSQLContainer("postgres:16")
    }
}
```

매 테스트마다 테스트 컨테이너와 애플리케이션 컨텍스트를 매번 새로 만들어 테스트들을 완벽히 격리한다. 테스트를 격리할 수 있다는 장점이 있지만, 매 테스트마다 컨텍스트 로딩이 수행하는 비효율성을 감수해야 한다.

<p align="center">
  <img src="/images/posts/2024/problem-of-sharing-application-context-with-test-container-04.png" width="80%" class="image__border">
</p>

### 2.3. Using same database test container

애플리케이션 컨텍스트를 재사용하고 싶다면 테스트 컨테이너를 한번만 만든다. 다음과 같이 코드를 작성하면 테스트 컨테이너를 한번만 생성한 후 모든 테스트에서 재사용한다. 

- @Testcontainers, @Container, @ServiceConnection 애너테이션을 제거해 테스트 컨테이너의 라이프 사이클을 프레임워크가 제어하지 않도록 만든다.
- @DynamicPropertySource 애너테이션, DynamicPropertyRegistry 클래스를 사용해 테스트 실행 환경과 테스트 컨테이너를 연결한다.
- 초기화 init 블록에서 테스트 컨테이너를 실행시킨다.

```kotlin
package blog.`in`.action

import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.PostgreSQLContainer

abstract class TestContainerDatabase {

    companion object {

        val postgresContainer = PostgreSQLContainer("postgres:16")

        init {
            postgresContainer.start()
        }

        @JvmStatic
        @DynamicPropertySource
        fun setPostgresProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgresContainer::getJdbcUrl)
            registry.add("spring.datasource.username", postgresContainer::getUsername)
            registry.add("spring.datasource.password", postgresContainer::getPassword)
        }
    }
}
```

정적(static) 영역 필드가 준비되는 시점에 테스트 컨테이너가 한번만 실행된다. 애플리케이션 컨텍스트를 재사용하고 컨테이너를 생성하는 비용을 줄일 수 있지만, 데이터베이스를 모든 테스트에서 공유하기 때문에 테스트가 격리되지 않는다. 이는 각 테스트들이 서로 다른 테스트에 영향을 주지 않도록 코드 수준에서 고려할 것들이 생기게 된다.

<p align="center">
  <img src="/images/posts/2024/problem-of-sharing-application-context-with-test-container-05.png" width="80%" class="image__border">
</p>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-03-21-problem-of-sharing-application-context-with-test-container>

#### REFERENCE

- <https://docs.spring.io/spring-framework/reference/testing/integration.html#testing-ctx-management>
- <https://docs.spring.io/spring-framework/reference/testing/annotations/integration-spring/annotation-dirtiescontext.html>
- <https://incheol-jung.gitbook.io/docs/study/tobys-spring/undefined-1/2020-03-10-spring2-chap6>

[do-not-replace-database-link]: https://junhyunny.github.io/spring-boot/jpa/test-driven-development/do-not-replace-database-when-using-data-jpa-test-annotation/
[testcontainer-in-kotlin-spring-boot-link]: https://junhyunny.github.io/kotlin/spring-boot/test-container/how-to-setup-testcontainer-in-kotlin-spring-boot/