---
title: "Use TestContainer on Runtime in Spring Boot"
search: false
category:
  - spring-boot
last_modified_at: 2023-08-30T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [테스트 컨테이너와 스프링 애플리케이션 MySQL 결합 테스트][test-container-for-database-link]
* [JPA Entity Serialize Exception with Redis Session][jpa-entity-serialize-exception-with-redis-session-link] 

## 1. Improved Testcontainers Support in Spring Boot 3.1

최근 릴리즈 된 스프링 부트(spring boot) 3.1 버전에서 테스트 컨테이너(TestContainer)에 대한 지원이 향상되었습니다. 
테스트 컨테이너는 어플리케이션에서 경량화 된 도커 컨테이너를 띄워서 사용할 수 있는 오픈 소스 프레임워크입니다. 

> Testcontainers is an open source framework for providing throwaway, lightweight instances of databases, message brokers, web browsers, or just about anything that can run in a Docker container.

테스트 컨테이너를 지원하는 기능에서 크게 바뀐 부분은 다음과 같습니다. 
자세한 내용들을 살펴보겠습니다. 

* 결합 테스트(integration test)에서 컨테이너 접속 정보 자동 설정
* 로컬 런타임 환경에서 테스트 컨테이너 활용

### 1.1. @ServiceConnection Annotation

결합 테스트에서 테스트 컨테이너를 사용하면 어플리케이션이 실행 중인 컨테이너에 접근하기 위한 정보가 필요합니다. 
3.1 버전 이전에는 접근 정보를 설정하기 위한 별도 코드가 필요했습니다. 

* @DynamicPropertySource 애너테이션과 DynamicPropertyRegistry 클래스를 사용합니다.

```java
@SpringBootTest
@Testcontainers
class MyIntegrationTests {

    @Container
    static Neo4jContainer<?> neo4j = new Neo4jContainer<>("neo4j:5");

    @Test
    void myTest() {
        // ...
    }

    @DynamicPropertySource
    static void neo4jProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.neo4j.uri", neo4j::getBoltUrl);
    }

}
```

* 코틀린(kotlin)의 경우 init 메소드와 시스템 프로퍼티 설정 코드를 사용할 수도 있습니다. 

```kotlin
@Testcontainers
@AutoConfigureMockMvc
@SpringBootTest(
    properties = [
        "spring.datasource.url=jdbc:h2:mem:test",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa"
    ]
)
class RestControllerIT {

    private final val redis = GenericContainer("redis:5.0.3-alpine")
        .withExposedPorts(6379)

    init {
        redis.start()
        System.setProperty("spring.data.redis.host", redis.host)
        System.setProperty("spring.data.redis.port", redis.getMappedPort(6379).toString())
    }

    @Autowired
    lateinit var userRepository: UserRepository

    @Autowired
    lateinit var sut: MockMvc

    @BeforeEach
    fun setup() {
        userRepository.save(
            UserEntity(
                name = "Junhyunny",
                favoritePosts = mutableListOf(1L, 2L)
            )
        )
    }

    @Test
    fun saveUserEntityInSession() {

        sut.perform(get("/users/1"))
            .andExpect(status().isOk)
    }
}
```

#### 1.1.1. Get Connection Details

스프링 부트 3.1 버전부터 제공하는 @ServiceConnection 애너테이션을 사용하면 컨테이너 접근 정보를 획득하기 위한 코드가 필요 없습니다. 
스프링 팀은 컨테이너 설정 초기화 문제를 다음과 같이 해결하였습니다. 

1. @ServiceConnection 애너테이션을 붙이면 컨테이너 객체가 생성되는 시점에 컨테이너 커넥션 정보를 관리하는 ConnectionDetails 인터페이스를 구현 객체가 생성됩니다. 
1. ConnectionDetails 구현체는 내부에서 해당 컨테이너 객체를 참조하고 있습니다.
    * ConnectionDetails 구현체는 아래 이미지에서 JdbcContainerConnectionDetails 인스턴스입니다.
    * 컨테이너 객체는 아래 이미지에서 JdbcDatabaseContainer 인스턴스입니다.
1. 어플리케이션이 커넥션 정보를 ConnectionDetails 구현체에게 요청합니다.
1. ConnectionDetails 구현체는 내부적으로 참조하고 있는 컨테이너 객체에게 접근 정보를 요청합니다.

<p align="center">
    <img src="/images/use-test-container-on-runtime-in-spring-boot-1.JPG" width="100%" class="image__border">
</p>

#### 1.1.2. Usage @ServiceConnection Annotation

@ServiceConnection 애너테이션을 사용하면 다음과 같이 코드를 변경할 수 있습니다. 

* @DynamicPropertySource 애너테이션이 붙은 메소드가 필요하지 않습니다. 

```java
@SpringBootTest
@Testcontainers
class MyIntegrationTests {

    @Container
    @ServiceConnection
    static Neo4jContainer<?> neo4j = new Neo4jContainer<>("neo4j:5");

    @Test
    void myTest() {
        // ...
    }
}
```

코틀린 코드도 다음과 같이 변경할 수 있습니다. 

* 컨테이너 객체를 static 변수로 변경하고 @ServiceConnection 애너테이션을 추가합니다.
* init 메소드를 제거합니다.

```kotlin
@Testcontainers
@AutoConfigureMockMvc
@SpringBootTest(
    properties = [
        "spring.datasource.url=jdbc:h2:mem:test",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa"
    ]
)
class RestControllerIT {

    companion object {
        @Container
        @ServiceConnection
        private val redis = GenericContainer("redis:5.0.3-alpine")
            .withExposedPorts(6379)
    }

    @Autowired
    lateinit var userRepository: UserRepository

    @Autowired
    lateinit var sut: MockMvc

    @BeforeEach
    fun setup() {
        userRepository.save(
            UserEntity(
                name = "Junhyunny",
                favoritePosts = mutableListOf(1L, 2L)
            )
        )
    }

    @Test
    fun saveUserEntityInSession() {

        sut.perform(get("/users/1"))
            .andExpect(status().isOk)
    }
}
```

### 1.2. TestContainers at development time

로컬 개발 환경에서 테스트 컨테이너를 어플리케이션과 함께 실행할 수 있습니다. 
로컬 개발 환경에서 겪는 다음과 같은 불편함들을 해소해줄 수 있는 좋은 기능이라고 생각됩니다. 

* 로컬 환경에서만 사용하는 임베디드 데이터베이스 
    * 필요한 데이터베이스를 로컬 환경에 설치하는 작업은 번거롭기 때문에 H2 같은 임베디드 데이터베이스를 사용한다.
    * 실제 프로덕션에서 사용하는 데이터베이스와 H2 데이터베이스의 초기화 SQL이나 마이그레이션 SQL 스크립트 문법이 다르다.
    * 어플리케이션 코드는 JPA 같은 추상화 된 계층 덕분에 코드의 변경이 크게 없겠지만 실제로 실행되는 동작이 다를 수 있으므로 주의가 필요하다. 
    * 데이터베이스를 컨테이너를 통해 구축하더라도 컴퓨터를 재부팅하면 매번 재실행해야 한다.
* 세션이나 캐시를 위해 사용하는 레디스 스토리지
    * 임베디드 레디스를 사용한다면 이를 위한 설정들과 프로파일이 필요하다. 
    * 로컬 환경에 레디스 서버를 구축한다면 설치하는 작업이 불편하다. 
    * 스토리지를 컨테이너를 통해 구축하더라도 컴퓨터를 재부팅하면 매번 재실행해야 한다.

프로젝트 테스트 컨텍스트에 다음과 같은 main 메소드를 작성하고 실행시키면 테스트 컨테이너들이 연결된 환경으로 어플리케이션을 실행할 수 있습니다. 

* ActionInBlogApplication 클래스의 main 메소드를 실행합니다.
* TestActionInBlogApplication 클래스의 빈(bean)들을 함께 사용합니다.
    * @TestConfiguration 애너테이션이 붙은 설정 빈입니다. 
    * 내부에 테스트 컨테이너를 빈으로 생성하는 코드가 필요합니다. 
    * 어플리케이션이 실행하면서 테스트 컨테이너의 접속 정보를 얻을 수 있도록 @ServiceConnection 애너테이션이 필요합니다. 

```java
package action.in.blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
public class TestActionInBlogApplication {

    public static void main(String[] args) {
        SpringApplication
                .from(ActionInBlogApplication::main)
                .with(TestActionInBlogApplication.class)
                .run(args);
    }

    @Bean
    @ServiceConnection
    PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>(DockerImageName.parse("postgres:latest"));
    }
}
```

## 2. Practice

간단하게 로컬 개발 환경을 구축해보겠습니다. 
프로젝트 구조는 다음과 같습니다.

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
    │   │               ├── controller
    │   │               │   └── UserController.java
    │   │               ├── domain
    │   │               │   └── User.java
    │   │               └── repository
    │   │                   └── UserRepository.java
    │   └── resources
    │       └── application.yml
    └── test
        ├── java
        │   └── action
        │       └── in
        │           └── blog
        │               ├── ActionInBlogApplicationTests.java
        │               └── TestActionInBlogApplication.java
        └── resources
            ├── application.yml
            └── data.sql
```

### 2.1. application.yml

테스트 패키지에 위치한 설정 파일입니다. 
어플리케이션 실행을 위한 main 메소드의 클래스가 테스트 패키지에 위치하기 때문에 해당 위치의 리소스를 사용합니다. 

* 프로파일 설정을 `test`로 지정합니다.
* data.sql 파일을 사용해 스키마, 데이터를 초기화합니다. 

```yml
spring:
  profiles:
    active: test
---
spring:
  config:
    activate:
      on-profile: test
  sql:
    init:
      mode: always
      data-locations: classpath:data.sql
  jpa:
    defer-datasource-initialization: true
```

### 2.2. data.sql

해당 스키마, 데이터 초기화 SQL 스크립트도 테스트 패키지에 위치합니다.

```sql
create table if not exists tb_user (
    id serial primary key,
    name varchar(50)
);

insert into tb_user (name) values ('Junhyunny');
insert into tb_user (name) values ('Jua');
```

### 2.3. UserController Class

기능을 제공하는 코드는 메인 패키지에 위치합니다. 

* 사용자 정보를 조회 후 반환합니다.

```java
package action.in.blog.controller;

import action.in.blog.domain.User;
import action.in.blog.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/users")
    public List<User> getUsers() {
        return userRepository.findAll();
    }
}
```

### 2.4. TestActionInBlogApplication Class

테스트 패키지에 위치한 TestActionInBlogApplication 클래스의 main 메소드를 실행합니다.

* main 메소드
    * 어플리케이션 실행을 위해 ActionInBlogApplication 클래스의 main 메소드를 사용합니다.
    * TestActionInBlogApplication 클래스 자신을 설정 빈으로 사용합니다.
    * 내부에 정의된 빈들을 컨텍스트에 포함하여 실행합니다.
* postgresContainer 메소드
    * @Bean 애너테이션을 붙혀 반환하는 객체를 빈으로 관리됩니다.
    * @ServiceConnection 애너테이션을 붙혀 어플리케이션이 접속하기 위해 필요한 정보를 제공합니다.

```java
package action.in.blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
public class TestActionInBlogApplication {

    public static void main(String[] args) {
        SpringApplication
                .from(ActionInBlogApplication::main)
                .with(TestActionInBlogApplication.class)
                .run(args);
    }

    @Bean
    @ServiceConnection
    PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>(DockerImageName.parse("postgres:latest"));
    }
}
```

##### Run Application with TestContainers

TestActionInBlogApplication 클래스의 main 메소드를 실행합니다. 

* 테스트 컨테이너와 함께 어플리케이션이 실행됩니다.

```
> Task :TestActionInBlogApplication.main()

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.1.3)

2023-08-30T23:20:41.314+09:00  INFO 65213 --- [           main] action.in.blog.ActionInBlogApplication   : Starting ActionInBlogApplication using Java 17.0.8.1 with PID 65213 (/Users/junhyunk/Desktop/action-in-blog/build/classes/java/main started by junhyunk in /Users/junhyunk/Desktop/action-in-blog)
2023-08-30T23:20:41.319+09:00  INFO 65213 --- [           main] action.in.blog.ActionInBlogApplication   : The following 1 profile is active: "test"
2023-08-30T23:20:42.763+09:00  INFO 65213 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Bootstrapping Spring Data JPA repositories in DEFAULT mode.
2023-08-30T23:20:42.909+09:00  INFO 65213 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Finished Spring Data repository scanning in 125 ms. Found 1 JPA repository interfaces.
2023-08-30T23:20:44.272+09:00  INFO 65213 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat initialized with port(s): 8080 (http)
2023-08-30T23:20:44.295+09:00  INFO 65213 --- [           main] o.apache.catalina.core.StandardService   : Starting service [Tomcat]
2023-08-30T23:20:44.295+09:00  INFO 65213 --- [           main] o.apache.catalina.core.StandardEngine    : Starting Servlet engine: [Apache Tomcat/10.1.12]
2023-08-30T23:20:44.524+09:00  INFO 65213 --- [           main] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring embedded WebApplicationContext
2023-08-30T23:20:44.526+09:00  INFO 65213 --- [           main] w.s.c.ServletWebServerApplicationContext : Root WebApplicationContext: initialization completed in 3094 ms
2023-08-30T23:20:44.708+09:00  INFO 65213 --- [           main] o.t.utility.ImageNameSubstitutor         : Image name substitution will be performed by: DefaultImageNameSubstitutor (composite of 'ConfigurationFileImageNameSubstitutor' and 'PrefixingImageNameSubstitutor')
2023-08-30T23:20:45.158+09:00  INFO 65213 --- [           main] o.t.d.DockerClientProviderStrategy       : Loaded org.testcontainers.dockerclient.UnixSocketClientProviderStrategy from ~/.testcontainers.properties, will try it first
2023-08-30T23:20:45.754+09:00  INFO 65213 --- [           main] o.t.d.DockerClientProviderStrategy       : Found Docker environment with local Unix socket (unix:///var/run/docker.sock)
2023-08-30T23:20:45.757+09:00  INFO 65213 --- [           main] org.testcontainers.DockerClientFactory   : Docker host IP address is localhost
2023-08-30T23:20:45.806+09:00  INFO 65213 --- [           main] org.testcontainers.DockerClientFactory   : Connected to docker: 
  Server Version: 24.0.5
  API Version: 1.43
  Operating System: Docker Desktop
  Total Memory: 7958 MB
2023-08-30T23:20:45.865+09:00  INFO 65213 --- [           main] tc.testcontainers/ryuk:0.5.1             : Creating container for image: testcontainers/ryuk:0.5.1
2023-08-30T23:20:47.147+09:00  INFO 65213 --- [           main] tc.testcontainers/ryuk:0.5.1             : Container testcontainers/ryuk:0.5.1 is starting: 3d818ab82cdc8ebca9e366996268914d15df82c20c14b9dde30f792f0123bd86
2023-08-30T23:20:47.911+09:00  INFO 65213 --- [           main] tc.testcontainers/ryuk:0.5.1             : Container testcontainers/ryuk:0.5.1 started in PT2.087009S
2023-08-30T23:20:47.939+09:00  INFO 65213 --- [           main] o.t.utility.RyukResourceReaper           : Ryuk started - will monitor and terminate Testcontainers containers on JVM exit
2023-08-30T23:20:47.939+09:00  INFO 65213 --- [           main] org.testcontainers.DockerClientFactory   : Checking the system...
2023-08-30T23:20:47.940+09:00  INFO 65213 --- [           main] org.testcontainers.DockerClientFactory   : ✔︎ Docker server version should be at least 1.6.0
2023-08-30T23:20:47.942+09:00  INFO 65213 --- [           main] tc.postgres:latest                       : Creating container for image: postgres:latest
2023-08-30T23:20:48.045+09:00  INFO 65213 --- [           main] tc.postgres:latest                       : Container postgres:latest is starting: bc969ada5ef373384f522ebc05cd552b33c516c13ed3b1c147f11482f715ef99
2023-08-30T23:20:50.908+09:00  INFO 65213 --- [           main] tc.postgres:latest                       : Container postgres:latest started in PT2.967174S
2023-08-30T23:20:50.910+09:00  INFO 65213 --- [           main] tc.postgres:latest                       : Container is started (JDBC URL: jdbc:postgresql://localhost:54940/test?loggerLevel=OFF)
2023-08-30T23:20:51.055+09:00  INFO 65213 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
2023-08-30T23:20:51.388+09:00  INFO 65213 --- [           main] com.zaxxer.hikari.pool.HikariPool        : HikariPool-1 - Added connection org.postgresql.jdbc.PgConnection@2cd3fc29
2023-08-30T23:20:51.391+09:00  INFO 65213 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
2023-08-30T23:20:51.481+09:00  INFO 65213 --- [           main] o.hibernate.jpa.internal.util.LogHelper  : HHH000204: Processing PersistenceUnitInfo [name: default]
2023-08-30T23:20:51.606+09:00  INFO 65213 --- [           main] org.hibernate.Version                    : HHH000412: Hibernate ORM core version 6.2.7.Final
2023-08-30T23:20:51.610+09:00  INFO 65213 --- [           main] org.hibernate.cfg.Environment            : HHH000406: Using bytecode reflection optimizer
2023-08-30T23:20:51.916+09:00  INFO 65213 --- [           main] o.h.b.i.BytecodeProviderInitiator        : HHH000021: Bytecode provider name : bytebuddy
2023-08-30T23:20:52.225+09:00  INFO 65213 --- [           main] o.s.o.j.p.SpringPersistenceUnitInfo      : No LoadTimeWeaver setup: ignoring JPA class transformer
2023-08-30T23:20:52.690+09:00  INFO 65213 --- [           main] o.h.b.i.BytecodeProviderInitiator        : HHH000021: Bytecode provider name : bytebuddy
2023-08-30T23:20:53.791+09:00  INFO 65213 --- [           main] o.h.e.t.j.p.i.JtaPlatformInitiator       : HHH000490: Using JtaPlatform implementation: [org.hibernate.engine.transaction.jta.platform.internal.NoJtaPlatform]
2023-08-30T23:20:53.797+09:00  INFO 65213 --- [           main] j.LocalContainerEntityManagerFactoryBean : Initialized JPA EntityManagerFactory for persistence unit 'default'
2023-08-30T23:20:54.303+09:00  WARN 65213 --- [           main] JpaBaseConfiguration$JpaWebConfiguration : spring.jpa.open-in-view is enabled by default. Therefore, database queries may be performed during view rendering. Explicitly configure spring.jpa.open-in-view to disable this warning
2023-08-30T23:20:55.011+09:00  INFO 65213 --- [           main] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8080 (http) with context path ''
2023-08-30T23:20:55.028+09:00  INFO 65213 --- [           main] action.in.blog.ActionInBlogApplication   : Started ActionInBlogApplication in 14.655 seconds (process running for 15.75)
```

##### Test Result

* 테스트 패키지에 위치한 어플리케이션을 실행했지만, 메인 패키지에 위치한 UserController 클래스의 기능이 정상적으로 수행됩니다. 
* Postgres 테스트 컨테이너 데이터베이스에 초기화 된 데이터들이 정상적으로 조회됩니다.

```
$ curl http://localhost:8080/users | jq .                           
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    51    0    51    0     0    144      0 --:--:-- --:--:-- --:--:--   147
[
  {
    "id": 1,
    "name": "Junhyunny"
  },
  {
    "id": 2,
    "name": "Jua"
  }
]
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-08-30-use-test-container-on-runtime-in-spring-boot>

#### REFERENCE

* <https://www.youtube.com/watch?v=FvDSL3pSKNQ>
* <https://spring.io/blog/2023/06/23/improved-testcontainers-support-in-spring-boot-3-1/>
* <https://spring.io/blog/2023/06/19/spring-boot-31-connectiondetails-abstraction>

[test-container-for-database-link]: https://junhyunny.github.io/spring-boot/test-container/mysql/test-container-for-database/
[jpa-entity-serialize-exception-with-redis-session-link]: https://junhyunny.github.io/kotlin/spring-boot/jpa/jpa-entity-serialize-exception-with-redis-session/