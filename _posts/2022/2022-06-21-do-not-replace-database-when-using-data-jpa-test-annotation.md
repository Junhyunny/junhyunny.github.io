---
title: "Do Not Replace Database with @DataJpaTest"
search: false
category:
  - spring-boot
  - jpa
  - test-driven-development
last_modified_at: 2022-06-21T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Not found schemas at H2 database][not-found-schemas-at-h2-database-link]

## 1. 문제 현상

[Not found schemas at H2 database][not-found-schemas-at-h2-database-link] 포스트에서 정리했듯이 H2 데이터베이스는 스키마 초기화를 `spring.datasource.url` 설정 뒷 부분에 추가해야 합니다. 
스키마 초기화 설정을 통해 서비스는 정상적으로 동작했지만, `@DataJpaTest` 애너테이션을 사용한 테스트들은 깨졌습니다. 
이번 포스트에선 문제 현상과 원인, 해결 방법에 대해 다뤘습니다. 

### 1.1. Member 클래스

- `hello` 스키마에 접근하기 위한 정보를 추가하였습니다.

```java
package blog.in.action.hello;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "TB_MEMBER", catalog = "hello")
public class Member {

    @Id
    private String id;
    private String nickName;
}
```

### 1.2. application-local.yml

- `spring.datasource.url` 값에 스키마 초기화와 관련된 설정을 추가합니다.
    - HELLO, WORLD 스키마가 없는 경우 이를 생성합니다.

```yml
spring:
  datasource:
    url: jdbc:h2:mem:test;INIT=CREATE SCHEMA IF NOT EXISTS HELLO\;CREATE SCHEMA IF NOT EXISTS WORLD
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    properties:
      hibernate:
        show_sql: true
        format_sql: true
    hibernate:
      ddl-auto: create
```

### 1.3. DatabaseReplaceTests 클래스

- `@ActiveProfiles` 애너테이션으로 `local` 설정을 사용하도록 지정합니다.
- 간단한 `count` 쿼리를 실행합니다.

```java
package blog.in.action;

import blog.in.action.hello.MemberRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@DataJpaTest
@ActiveProfiles("local")
public class DatabaseReplaceTests {

    @Autowired
    MemberRepository repository;

    @Test
    void test() {
        assertThat(repository.count(), greaterThanOrEqualTo(0L));
    }
}
```

##### 테스트 결과 - 실패

- `HELLO` 스키마를 찾을 수 없다는 에러 메시지가 확인됩니다.
    - Schema "HELLO" not found

<p align="center">
    <img src="/images/do-not-replace-database-when-using-data-jpa-test-annotation-1.JPG" width="100%" class="image__border">
</p>

## 2. 문제 원인

서비스 실행 로그를 살펴보고 원인을 파악할 수 있었습니다. 

### 2.1. 로그 확인

- 서비스 실행 로그를 보면 H2 데이터베이스에 접속하려는 시도를 확인할 수 있습니다.
- 로그의 H2 데이터베이스 접속 정보를 보면 `application-local.yml` 설정에 정의된 값과 다른 것을 확인할 수 있습니다.
    - 로그 - jdbc:h2:mem:ed441a3f-8a54-475e-ade7-34490ee1a39f;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=false
    - 설정 - jdbc:h2:mem:test;INIT=CREATE SCHEMA IF NOT EXISTS HELLO\;CREATE SCHEMA IF NOT EXISTS WORLD

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v2.6.2)

2022-06-21 20:59:34.967  INFO 55902 --- [           main] blog.in.action.DatabaseReplaceTests      : Starting DatabaseReplaceTests using Java 11.0.13 on junhyunk-a01.vmware.com with PID 55902 (started by junhyunk in /Users/junhyunk/Desktop/workspace/blog-in-action/2022-06-21-do-not-replace-database-when-using-data-jpa-test-annotation/action-in-blog)
2022-06-21 20:59:34.967  INFO 55902 --- [           main] blog.in.action.DatabaseReplaceTests      : The following profiles are active: local
2022-06-21 20:59:35.243  INFO 55902 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Bootstrapping Spring Data JPA repositories in DEFAULT mode.
2022-06-21 20:59:35.280  INFO 55902 --- [           main] .s.d.r.c.RepositoryConfigurationDelegate : Finished Spring Data repository scanning in 30 ms. Found 2 JPA repository interfaces.
2022-06-21 20:59:35.323  INFO 55902 --- [           main] beddedDataSourceBeanFactoryPostProcessor : Replacing 'dataSource' DataSource bean with embedded version
2022-06-21 20:59:35.469  INFO 55902 --- [           main] o.s.j.d.e.EmbeddedDatabaseFactory        : Starting embedded database: url='jdbc:h2:mem:ed441a3f-8a54-475e-ade7-34490ee1a39f;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=false', username='sa'
2022-06-21 20:59:35.763  INFO 55902 --- [           main] o.hibernate.jpa.internal.util.LogHelper  : HHH000204: Processing PersistenceUnitInfo [name: default]
2022-06-21 20:59:35.804  INFO 55902 --- [           main] org.hibernate.Version                    : HHH000412: Hibernate ORM core version 5.6.3.Final
2022-06-21 20:59:35.944  INFO 55902 --- [           main] o.hibernate.annotations.common.Version   : HCANN000001: Hibernate Commons Annotations {5.1.2.Final}
2022-06-21 20:59:36.040  INFO 55902 --- [           main] org.hibernate.dialect.Dialect            : HHH000400: Using dialect: org.hibernate.dialect.H2Dialect
...
```

### 2.2. @DataJpaTest 애너테이션 살펴보기

`application-local.yml` 파일에서 설정한 데이터베이스가 아닌 엉뚱한 데이터베이스를 사용하는 이유는 `@DataJpaTest` 애너테이션이 구성해주는 테스트 환경 때문입니다. 
`@DataJpaTest` 애너테이션은 다음과 같은 애너테이션들과 함께 테스트 환경을 구성합니다. 
- `@AutoConfigureTestDatabase` - 별도 데이터베이스 설정이 없어도 테스트를 위한 내장 데이터베이스 사용
- `@Transactional` - 매 테스트마다 자동으로 롤백 처리
- `@AutoConfigureDataJpa` - `JpaRepository` 테스트를 위한 관련 컨텍스트 구성

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@BootstrapWith(DataJpaTestContextBootstrapper.class)
@ExtendWith({SpringExtension.class})
@OverrideAutoConfiguration(
    enabled = false
)
@TypeExcludeFilters({DataJpaTypeExcludeFilter.class})
@Transactional
@AutoConfigureCache
@AutoConfigureDataJpa
@AutoConfigureTestDatabase
@AutoConfigureTestEntityManager
@ImportAutoConfiguration
public @interface DataJpaTest {
    String[] properties() default {};

    @PropertyMapping("spring.jpa.show-sql")
    boolean showSql() default true;

    @PropertyMapping("spring.data.jpa.repositories.bootstrap-mode")
    BootstrapMode bootstrapMode() default BootstrapMode.DEFAULT;

    boolean useDefaultFilters() default true;

    ComponentScan.Filter[] includeFilters() default {};

    ComponentScan.Filter[] excludeFilters() default {};

    @AliasFor(
        annotation = ImportAutoConfiguration.class,
        attribute = "exclude"
    )
    Class<?>[] excludeAutoConfiguration() default {};
}
```

### 2.3. @AutoConfigureTestDatabase 애너테이션 살펴보기

`@AutoConfigureTestDatabase` 애너테이션을 통해 데이터베이스가 변경되는 것 같습니다. 
해당 애너테이션과 관련된 코드들을 더 살펴보겠습니다. 

#### 2.3.1. @AutoConfigureTestDatabase 애너테이션 

- 해당 애너테이션의 속성 값들은 `spring.test.database` 속성 값을 접두어(prefix)로 가집니다.
- `replace` 속성의 기본 값은 `ANY` 입니다.

```java
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@ImportAutoConfiguration
@PropertyMapping("spring.test.database")
public @interface AutoConfigureTestDatabase {
    @PropertyMapping(
        skip = SkipPropertyMapping.ON_DEFAULT_VALUE
    )
    Replace replace() default AutoConfigureTestDatabase.Replace.ANY;

    EmbeddedDatabaseConnection connection() default EmbeddedDatabaseConnection.NONE;

    public static enum Replace {
        ANY,
        AUTO_CONFIGURED,
        NONE;

        private Replace() {
        }
    }
}
```

##### @ImportAutoConfiguration 애너테이션을 통한 관련 빈(bean) 주입

- `@ImportAutoConfiguration` 애너테이션을 통해 자동적으로 특정 빈들이 주입됩니다. 
- `@AutoConfigureTestDatabase` 애너테이션으로 인해 자동으로 주입되는 빈들을 확인하면 다음과 같습니다.
    - `TestDatabaseAutoConfiguration` 빈을 통해 테스트를 위한 내장 데이터베이스가 구성됩니다.

```
# AutoConfigureTestDatabase auto-configuration imports
org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase=\
org.springframework.boot.test.autoconfigure.jdbc.TestDatabaseAutoConfiguration,\
org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
```

#### 2.3.2. TestDatabaseAutoConfiguration 클래스

- `spring.test.database.replace` 기본 값은 `ANY` 이므로 `embeddedDataSourceBeanFactoryPostProcessor` 빈이 등록됩니다.
- `embeddedDataSourceBeanFactoryPostProcessor` 빈에 의해 `EmbeddedDataSourceFactoryBean` 빈이 등록됩니다.
- `EmbeddedDataSourceFactoryBean` 빈의 `afterPropertiesSet` 메소드 수행 시점에 테스트를 위한 내장 데이터베이스 객체가 생성됩니다.
- `EmbeddedDataSourceFactory` 클래스의 `getEmbeddedDatabase` 메소드를 통해 커넥션(connection) 객체와 내장 데이터베이스 객체를 생성합니다.

```java
@Configuration(
    proxyBeanMethods = false
)
@AutoConfigureBefore({DataSourceAutoConfiguration.class})
public class TestDatabaseAutoConfiguration {

    // ...

    @Bean
    @Role(2)
    @ConditionalOnProperty(
        prefix = "spring.test.database",
        name = {"replace"},
        havingValue = "ANY",
        matchIfMissing = true
    )
    static EmbeddedDataSourceBeanFactoryPostProcessor embeddedDataSourceBeanFactoryPostProcessor() {
        return new EmbeddedDataSourceBeanFactoryPostProcessor();
    }

    static class EmbeddedDataSourceFactory {

        // ...

        EmbeddedDatabase getEmbeddedDatabase() {
            EmbeddedDatabaseConnection connection = (EmbeddedDatabaseConnection)this.environment.getProperty("spring.test.database.connection", EmbeddedDatabaseConnection.class, EmbeddedDatabaseConnection.NONE);
            if (EmbeddedDatabaseConnection.NONE.equals(connection)) {
                connection = EmbeddedDatabaseConnection.get(this.getClass().getClassLoader());
            }

            Assert.state(connection != EmbeddedDatabaseConnection.NONE, "Failed to replace DataSource with an embedded database for tests. If you want an embedded database please put a supported one on the classpath or tune the replace attribute of @AutoConfigureTestDatabase.");
            return (new EmbeddedDatabaseBuilder()).generateUniqueName(true).setType(connection.getType()).build();
        }
    }

    static class EmbeddedDataSourceFactoryBean implements FactoryBean<DataSource>, EnvironmentAware, InitializingBean {

        private EmbeddedDataSourceFactory factory;
        private EmbeddedDatabase embeddedDatabase;

        public void afterPropertiesSet() throws Exception {
            this.embeddedDatabase = this.factory.getEmbeddedDatabase();
        }

        // ...
    }

    // ...
}
```

#### 2.3.3. EmbeddedDatabaseConnection enum

- 위의 설명처럼 `EmbeddedDataSourceFactory` 클래스의 `getEmbeddedDatabase` 메소드를 통해 내장 데이터베이스 객체가 만들어집니다. 
- 코드를 살펴보면 데이터베이스 커넥션 정보는 `EmbeddedDatabaseConnection` 이넘(enum)의 `get` 메소드를 통해 획득합니다. 
- `get` 메소드 - 드라이버 클래스가 클래스 로더(class loader)에 존재하는지 확인 후 존재하면 이를 사용합니다.

```java
public enum EmbeddedDatabaseConnection {
    NONE((EmbeddedDatabaseType)null, (String)null, (String)null, (url) -> {
        return false;
    }),
    H2(EmbeddedDatabaseType.H2, DatabaseDriver.H2.getDriverClassName(), "jdbc:h2:mem:%s;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE", (url) -> {
        return url.contains(":h2:mem");
    }),
    DERBY(EmbeddedDatabaseType.DERBY, DatabaseDriver.DERBY.getDriverClassName(), "jdbc:derby:memory:%s;create=true", (url) -> {
        return true;
    }),
    HSQLDB(EmbeddedDatabaseType.HSQL, DatabaseDriver.HSQLDB.getDriverClassName(), "org.hsqldb.jdbcDriver", "jdbc:hsqldb:mem:%s", (url) -> {
        return url.contains(":hsqldb:mem:");
    });

    private final EmbeddedDatabaseType type;
    private final String driverClass;
    private final String alternativeDriverClass;
    private final String url;
    private final Predicate<String> embeddedUrl;

    private EmbeddedDatabaseConnection(EmbeddedDatabaseType type, String driverClass, String url, Predicate embeddedUrl) {
        this(type, driverClass, (String)null, url, embeddedUrl);
    }

    private EmbeddedDatabaseConnection(EmbeddedDatabaseType type, String driverClass, String fallbackDriverClass, String url, Predicate embeddedUrl) {
        this.type = type;
        this.driverClass = driverClass;
        this.alternativeDriverClass = fallbackDriverClass;
        this.url = url;
        this.embeddedUrl = embeddedUrl;
    }

    // ...

    public static EmbeddedDatabaseConnection get(ClassLoader classLoader) {
        EmbeddedDatabaseConnection[] var1 = values();
        int var2 = var1.length;

        for(int var3 = 0; var3 < var2; ++var3) {
            EmbeddedDatabaseConnection candidate = var1[var3];
            if (candidate != NONE && ClassUtils.isPresent(candidate.getDriverClassName(), classLoader)) {
                return candidate;
            }
        }

        return NONE;
    }

    // ...

}
```

#### 2.4. 그래서 결론은?

구구절절 관련된 내용들을 딥-다이브(deep dive)해서 작성했지만, 결론이 명확하지 않으니 이를 짚고 해결 방법으로 넘어가겠습니다. 
1. `@DataJpaTest` 애너테이션으로 `JPA` 테스트를 수행하면 `application.yml` 파일에 정의된 데이터베이스 설정을 사용하지 못 합니다.
1. 원인은 `@DataJpaTest` 애너테이션과 함께 사용되는 `@AutoConfigureTestDatabase` 애너테이션 때문입니다. 
1. `@AutoConfigureTestDatabase` 애너테이션의 `replace` 속성의 기본 값이 `ANY`이므로 내장 데이터베이스 객체를 생성하는 로직이 별도로 수행됩니다.
1. 내장 데이터베이스 객체를 만들 때 필요한 커넥션 객체는 `EmbeddedDatabaseConnection` 이넘을 통해 획득합니다.
1. 클래스 로더에 드라이버 클래스가 존재한다면 `H2 > DERBY > HSQLDB` 순으로 먼저 사용합니다. 

## 3. 해결 방법

이를 해결하는 방법은 단순합니다. 
테스트에 `@AutoConfigureTestDatabase` 애너테이션의 `replace` 속성을 `NONE`으로 오버라이드합니다.

### 3.1. DatabaseReplaceTests 클래스

```java
package blog.in.action;

import blog.in.action.hello.MemberRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("local")
public class DatabaseReplaceTests {

    @Autowired
    MemberRepository repository;

    @Test
    void test() {
        assertThat(repository.count(), greaterThanOrEqualTo(0L));
    }
}
```

##### 테스트 결과

<p align="center">
    <img src="/images/do-not-replace-database-when-using-data-jpa-test-annotation-2.JPG" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-06-21-do-not-replace-database-when-using-data-jpa-test-annotation>

#### REFERENCE
- <https://velog.io/@jwkim/spring-boot-datajpatest-springboottest>
- <https://howtodoinjava.com/spring-boot2/testing/datajpatest-annotation/>
- <https://kangwoojin.github.io/programing/auto-configure-test-database/>

[not-found-schemas-at-h2-database-link]: https://junhyunny.github.io/spring-boot/jpa/database/not-found-schemas-at-h2-database/