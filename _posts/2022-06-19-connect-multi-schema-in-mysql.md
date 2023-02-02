---
title: "MySQL 환경 JPA 다중 스키마 사용하기"
search: false
category:
  - spring-boot
  - jpa
  - database
last_modified_at: 2022-06-19T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Database Schema and Catalog][database-schema-and-catalog-link]

## 0. 들어가면서

프로젝트 중간에 다른 스키마(schema)에 존재하는 테이블에 연결해야하는 상황이 발생했습니다. 
어플리케이션의 책임을 줄이기 위해 한 개의 스키마를 사용하면 좋겠지만, 규정 등의 사유로 다른 스키마를 바라봐야 하는 상황이었습니다. 
JPA(Java Persistence API) `@Table` 애너테이션의 `schema` 속성 값 부여만으로 쉽게 해결될 줄 알았지만, 문제가 해소되진 않았습니다. 
이번 포스트에선 관련된 문제 해결 과정을 정리하였습니다. 

##### 테스트 환경

- 이번 포스트의 예제 코드를 실행시키기 위해선 다음과 같은 DDL 쿼리가 필요합니다.
- `hello` 데이터베이스를 생성합니다.
    - `hello` 데이터베이스에 `tb_member` 테이블을 생성합니다.
- `world` 데이터베이스를 생성합니다.
    - `world` 데이터베이스에 `tb_friend` 테이블을 생성합니다.

```sql
create database hello;
create table hello.tb_member
(
    id        varchar(255) not null,
    nick_name varchar(255),
    primary key (id)
) engine = InnoDB;

create database world;
create table world.tb_friend
(
    id        varchar(255) not null,
    nick_name varchar(255),
    primary key (id)
) engine = InnoDB;
```

## 1. 문제 현상

문제 현상에 대한 이해를 돕기 위한 코드이므로 실제와 다르게 일부 각색하였습니다.

### 1.1. application.yml 설정

- 로컬 호스트 MySQL 데이터베이스 서버의 `hello` 스키마에 접속합니다.

```yml
server:
  port: 8080
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/hello?characterEncoding=UTF-8&serverTimezone=UTC
    username: root
    password: 1234
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    properties:
      hibernate:
        show_sql: true
        format_sql: true
    show-sql: true
    database-platform: org.hibernate.dialect.MySQL5InnoDBDialect
    hibernate:
      ddl-auto: none
```

### 1.2. 신규 엔티티 추가 및 테스트 코드

#### 1.2.1. Friend 클래스

- `world` 스키마에 존재하는 `TB_FRIEND` 테이블을 사용하기 위한 엔티티를 생성합니다.
- 별도 스키마 정보 없이 `@Table` 애너테이션을 통해 테이블 이름만 지정합니다.

```java
package blog.in.action.world;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "TB_FRIEND")
public class Friend {

    @Id
    private String id;
    private String nickName;
}
```

#### 1.2.3. FriendRepository 인터페이스

```java
package blog.in.action.world;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FriendRepository extends JpaRepository<Friend, String> {
}
```

#### 1.2.2. MultiSchemaTests 클래스

- `@AutoConfigureTestDatabase` 애너테이션
    - AutoConfigureTestDatabase.Replace.NONE 설정 - H2 메모리 데이터베이스가 아닌 실제 MySQL 데이터베이스를 사용합니다.
- `FriendRepository` 인스턴스로 `TB_FRIEND` 테이블에 `count` 쿼리를 수행합니다.

```java
package blog.in.action;

import blog.in.action.world.FriendRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class MultiSchemaTests {

    @Autowired
    FriendRepository friendRepository;

    @Test
    void countFromFriendTable() {
        assertThat(friendRepository.count(), greaterThanOrEqualTo(0L));
    }
}
```

#### 1.2.3. 테스트 수행

##### 테스트 수행 결과 - 실패

<p align="center">
    <img src="/images/connect-multi-schema-in-mysql-1.JPG" width="100%" class="image__border">
</p>

##### 테스트 수행 로그

- Table 'hello.tb_friend' doesn't exist 에러 로그
    - `hello` 스키마에 `tb_friend` 테이블을 찾지 못 합니다.

```
2022-06-19 23:51:19.542  INFO 11801 --- [           main] o.s.t.c.transaction.TransactionContext   : Began transaction (1) for test context [DefaultTestContext@19e4fcac testClass = MultiSchemaTests, testInstance = blog.in.action.MultiSchemaTests@2a62b5bc, testMethod = countFriendTable@MultiSchemaTests, testException = [null], mergedContextConfiguration = [MergedContextConfiguration@52c3cb31 testClass = MultiSchemaTests, locations = '{}', classes = '{class blog.in.action.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTestContextBootstrapper=true}', contextCustomizers = set[[ImportsContextCustomizer@4b79ac84 key = [org.springframework.boot.autoconfigure.cache.CacheAutoConfiguration, org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration, org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration, org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration, org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration, org.springframework.boot.autoconfigure.transaction.TransactionAutoConfiguration, org.springframework.boot.test.autoconfigure.jdbc.TestDatabaseAutoConfiguration, org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManagerAutoConfiguration]], org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@3224a577, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@3e44f2a5, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.autoconfigure.OverrideAutoConfigurationContextCustomizerFactory$DisableAutoConfigurationContextCustomizer@4ef782af, org.springframework.boot.test.autoconfigure.actuate.metrics.MetricsExportContextCustomizerFactory$DisableMetricExportContextCustomizer@7f8a9499, org.springframework.boot.test.autoconfigure.filter.TypeExcludeFiltersContextCustomizer@351584c0, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@e7bdd664, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@3fc79729, org.springframework.boot.test.context.SpringBootTestArgs@1, org.springframework.boot.test.context.SpringBootTestWebEnvironment@0], contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map[[empty]]]; transaction manager [org.springframework.orm.jpa.JpaTransactionManager@350342e0]; rollback [true]
Hibernate: 
    select
        count(*) as col_0_0_ 
    from
        tb_friend friend0_
2022-06-19 23:51:19.771  WARN 11801 --- [           main] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Error: 1146, SQLState: 42S02
2022-06-19 23:51:19.771 ERROR 11801 --- [           main] o.h.engine.jdbc.spi.SqlExceptionHelper   : Table 'hello.tb_friend' doesn't exist
2022-06-19 23:51:19.786  INFO 11801 --- [           main] o.s.t.c.transaction.TransactionContext   : Rolled back transaction for test: [DefaultTestContext@19e4fcac testClass = MultiSchemaTests, testInstance = blog.in.action.MultiSchemaTests@2a62b5bc, testMethod = countFriendTable@MultiSchemaTests, testException = org.springframework.dao.InvalidDataAccessResourceUsageException: could not extract ResultSet; SQL [n/a]; nested exception is org.hibernate.exception.SQLGrammarException: could not extract ResultSet, mergedContextConfiguration = [MergedContextConfiguration@52c3cb31 testClass = MultiSchemaTests, locations = '{}', classes = '{class blog.in.action.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTestContextBootstrapper=true}', contextCustomizers = set[[ImportsContextCustomizer@4b79ac84 key = [org.springframework.boot.autoconfigure.cache.CacheAutoConfiguration, org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration, org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration, org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration, org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration, org.springframework.boot.autoconfigure.transaction.TransactionAutoConfiguration, org.springframework.boot.test.autoconfigure.jdbc.TestDatabaseAutoConfiguration, org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManagerAutoConfiguration]], org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@3224a577, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@3e44f2a5, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.autoconfigure.OverrideAutoConfigurationContextCustomizerFactory$DisableAutoConfigurationContextCustomizer@4ef782af, org.springframework.boot.test.autoconfigure.actuate.metrics.MetricsExportContextCustomizerFactory$DisableMetricExportContextCustomizer@7f8a9499, org.springframework.boot.test.autoconfigure.filter.TypeExcludeFiltersContextCustomizer@351584c0, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@e7bdd664, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@3fc79729, org.springframework.boot.test.context.SpringBootTestArgs@1, org.springframework.boot.test.context.SpringBootTestWebEnvironment@0], contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map[[empty]]]

org.springframework.dao.InvalidDataAccessResourceUsageException: could not extract ResultSet; SQL [n/a]; nested exception is org.hibernate.exception.SQLGrammarException: could not extract ResultSet

	at org.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(HibernateJpaDialect.java:259)
	at org.springframework.orm.jpa.vendor.HibernateJpaDialect.translateExceptionIfPossible(HibernateJpaDialect.java:233)
	at org.springframework.orm.jpa.AbstractEntityManagerFactoryBean.translateExceptionIfPossible(AbstractEntityManagerFactoryBean.java:551)
	at org.springframework.dao.support.ChainedPersistenceExceptionTranslator.translateExceptionIfPossible(ChainedPersistenceExceptionTranslator.java:61)
	at org.springframework.dao.support.DataAccessUtils.translateIfNecessary(DataAccessUtils.java:242)
	at org.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:152)
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
	at org.springframework.data.jpa.repository.support.CrudMethodMetadataPostProcessor$CrudMethodMetadataPopulatingMethodInterceptor.invoke(CrudMethodMetadataPostProcessor.java:174)
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
	at org.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
	at org.springframework.aop.framework.JdkDynamicAopProxy.invoke(JdkDynamicAopProxy.java:215)
	at com.sun.proxy.$Proxy81.count(Unknown Source)
	at blog.in.action.MultiSchemaTests.countFriendTable(MultiSchemaTests.java:25)
    ...
```

## 2. 문제 해결 과정

### 2.1. @Table 애너테이션 schema 속성 사용

`TB_FRIEND` 테이블은 `world` 스키마에 존재하므로 `@Table` 애너테이션에 해당 스키마 정보를 추가합니다.

#### 2.1.1. Friend 클래스

- `schema` 속성을 이용하여 해당 엔티티가 어느 스키마에 해당하는지 표시합니다.

```java
package blog.in.action.world;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "TB_FRIEND", schema = "world")
public class Friend {

    @Id
    private String id;
    private String nickName;
}
```

#### 2.1.2. 테스트 수행

##### 테스트 수행 로그

- 위와 동일한 테스트를 수행합니다. 
- 이전 테스트와 마찬가지로 해당되는 테이블을 찾지 못하며, 여전히 `hello` 스키마에서 테이블을 탐색합니다.
- Table 'hello.tb_friend' doesn't exist 에러 로그
    - `hello` 스키마에 `tb_friend` 테이블을 찾지 못 합니다.

```
2022-06-20 00:22:46.796  INFO 20622 --- [           main] o.s.t.c.transaction.TransactionContext   : Began transaction (1) for test context [DefaultTestContext@2f16c6b3 testClass = MultiSchemaTests, testInstance = blog.in.action.MultiSchemaTests@5e4bd84a, testMethod = countFriendTable@MultiSchemaTests, testException = [null], mergedContextConfiguration = [MergedContextConfiguration@34158c08 testClass = MultiSchemaTests, locations = '{}', classes = '{class blog.in.action.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTestContextBootstrapper=true}', contextCustomizers = set[[ImportsContextCustomizer@19e4fcac key = [org.springframework.boot.autoconfigure.cache.CacheAutoConfiguration, org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration, org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration, org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration, org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration, org.springframework.boot.autoconfigure.transaction.TransactionAutoConfiguration, org.springframework.boot.test.autoconfigure.jdbc.TestDatabaseAutoConfiguration, org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManagerAutoConfiguration]], org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@4e928fbf, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@2e32ccc5, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.autoconfigure.OverrideAutoConfigurationContextCustomizerFactory$DisableAutoConfigurationContextCustomizer@7354b8c5, org.springframework.boot.test.autoconfigure.actuate.metrics.MetricsExportContextCustomizerFactory$DisableMetricExportContextCustomizer@59e2d8e3, org.springframework.boot.test.autoconfigure.filter.TypeExcludeFiltersContextCustomizer@351584c0, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@e7bdd664, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@59d4cd39, org.springframework.boot.test.context.SpringBootTestArgs@1, org.springframework.boot.test.context.SpringBootTestWebEnvironment@0], contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map[[empty]]]; transaction manager [org.springframework.orm.jpa.JpaTransactionManager@2619cb76]; rollback [true]
Hibernate: 
    select
        count(*) as col_0_0_ 
    from
        tb_friend friend0_
2022-06-20 00:22:47.023  WARN 20622 --- [           main] o.h.engine.jdbc.spi.SqlExceptionHelper   : SQL Error: 1146, SQLState: 42S02
2022-06-20 00:22:47.023 ERROR 20622 --- [           main] o.h.engine.jdbc.spi.SqlExceptionHelper   : Table 'hello.tb_friend' doesn't exist
2022-06-20 00:22:47.041  INFO 20622 --- [           main] o.s.t.c.transaction.TransactionContext   : Rolled back transaction for test: [DefaultTestContext@2f16c6b3 testClass = MultiSchemaTests, testInstance = blog.in.action.MultiSchemaTests@5e4bd84a, testMethod = countFriendTable@MultiSchemaTests, testException = org.springframework.dao.InvalidDataAccessResourceUsageException: could not extract ResultSet; SQL [n/a]; nested exception is org.hibernate.exception.SQLGrammarException: could not extract ResultSet, mergedContextConfiguration = [MergedContextConfiguration@34158c08 testClass = MultiSchemaTests, locations = '{}', classes = '{class blog.in.action.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTestContextBootstrapper=true}', contextCustomizers = set[[ImportsContextCustomizer@19e4fcac key = [org.springframework.boot.autoconfigure.cache.CacheAutoConfiguration, org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration, org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration, org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration, org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration, org.springframework.boot.autoconfigure.transaction.TransactionAutoConfiguration, org.springframework.boot.test.autoconfigure.jdbc.TestDatabaseAutoConfiguration, org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManagerAutoConfiguration]], org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@4e928fbf, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@2e32ccc5, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.autoconfigure.OverrideAutoConfigurationContextCustomizerFactory$DisableAutoConfigurationContextCustomizer@7354b8c5, org.springframework.boot.test.autoconfigure.actuate.metrics.MetricsExportContextCustomizerFactory$DisableMetricExportContextCustomizer@59e2d8e3, org.springframework.boot.test.autoconfigure.filter.TypeExcludeFiltersContextCustomizer@351584c0, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@e7bdd664, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@59d4cd39, org.springframework.boot.test.context.SpringBootTestArgs@1, org.springframework.boot.test.context.SpringBootTestWebEnvironment@0], contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map[[empty]]]

org.springframework.dao.InvalidDataAccessResourceUsageException: could not extract ResultSet; SQL [n/a]; nested exception is org.hibernate.exception.SQLGrammarException: could not extract ResultSet

	at org.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(HibernateJpaDialect.java:259)
	at org.springframework.orm.jpa.vendor.HibernateJpaDialect.translateExceptionIfPossible(HibernateJpaDialect.java:233)
	at org.springframework.orm.jpa.AbstractEntityManagerFactoryBean.translateExceptionIfPossible(AbstractEntityManagerFactoryBean.java:551)
	at org.springframework.dao.support.ChainedPersistenceExceptionTranslator.translateExceptionIfPossible(ChainedPersistenceExceptionTranslator.java:61)
	at org.springframework.dao.support.DataAccessUtils.translateIfNecessary(DataAccessUtils.java:242)
	at org.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:152)
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
	at org.springframework.data.jpa.repository.support.CrudMethodMetadataPostProcessor$CrudMethodMetadataPopulatingMethodInterceptor.invoke(CrudMethodMetadataPostProcessor.java:174)
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
	at org.springframework.aop.interceptor.ExposeInvocationInterceptor.invoke(ExposeInvocationInterceptor.java:97)
	at org.springframework.aop.framework.ReflectiveMethodInvocation.proceed(ReflectiveMethodInvocation.java:186)
	at org.springframework.aop.framework.JdkDynamicAopProxy.invoke(JdkDynamicAopProxy.java:215)
	at com.sun.proxy.$Proxy81.count(Unknown Source)
	at blog.in.action.MultiSchemaTests.countFriendTable(MultiSchemaTests.java:21)
    ...
```

### 2.2. @Table 애너테이션 catalog 속성 사용

카탈로그(catalog)는 스키마보다 상위 개념으로 데이터베이스 시스템 내의 모든 객체에 대한 정의와 명세를 저장하고 있습니다. 
데이터베이스 종류에 따라 다른 구조를 가지며, 데이터베이스 관리 시스템(DBMS, database management system)에 의해 스스로 생성되고 유지됩니다. 
카탈로그는 보통 데이터베이스와 동의어로 사용됩니다.

#### 2.2.1. Friend 클래스

- `catalog` 속성을 이용하여 해당 엔티티가 어느 데이터베이스에 해당하는지 표시합니다.

```java
package blog.in.action.world;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "TB_FRIEND", catalog = "world")
public class Friend {

    @Id
    private String id;
    private String nickName;
}
```

#### 2.2.2. 테스트 수행

##### 테스트 수행 결과 - 성공

<p align="center">
    <img src="/images/connect-multi-schema-in-mysql-2.JPG" width="100%" class="image__border">
</p>

##### 테스트 수행 로그

- 수행 쿼리를 보면 `world` 스키마에서 `tb_friend` 테이블을 탐색합니다.

```
2022-06-20 00:39:01.456  INFO 24157 --- [           main] o.s.t.c.transaction.TransactionContext   : Began transaction (1) for test context [DefaultTestContext@2f16c6b3 testClass = MultiSchemaTests, testInstance = blog.in.action.MultiSchemaTests@5e4bd84a, testMethod = countFriendTable@MultiSchemaTests, testException = [null], mergedContextConfiguration = [MergedContextConfiguration@34158c08 testClass = MultiSchemaTests, locations = '{}', classes = '{class blog.in.action.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTestContextBootstrapper=true}', contextCustomizers = set[[ImportsContextCustomizer@19e4fcac key = [org.springframework.boot.autoconfigure.cache.CacheAutoConfiguration, org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration, org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration, org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration, org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration, org.springframework.boot.autoconfigure.transaction.TransactionAutoConfiguration, org.springframework.boot.test.autoconfigure.jdbc.TestDatabaseAutoConfiguration, org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManagerAutoConfiguration]], org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@4e928fbf, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@2e32ccc5, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.autoconfigure.OverrideAutoConfigurationContextCustomizerFactory$DisableAutoConfigurationContextCustomizer@7354b8c5, org.springframework.boot.test.autoconfigure.actuate.metrics.MetricsExportContextCustomizerFactory$DisableMetricExportContextCustomizer@59e2d8e3, org.springframework.boot.test.autoconfigure.filter.TypeExcludeFiltersContextCustomizer@351584c0, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@e7bdd664, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@59d4cd39, org.springframework.boot.test.context.SpringBootTestArgs@1, org.springframework.boot.test.context.SpringBootTestWebEnvironment@0], contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map[[empty]]]; transaction manager [org.springframework.orm.jpa.JpaTransactionManager@6a543e09]; rollback [true]
Hibernate: 
    select
        count(*) as col_0_0_ 
    from
        world.tb_friend friend0_
2022-06-20 00:39:01.683  INFO 24157 --- [           main] o.s.t.c.transaction.TransactionContext   : Rolled back transaction for test: [DefaultTestContext@2f16c6b3 testClass = MultiSchemaTests, testInstance = blog.in.action.MultiSchemaTests@5e4bd84a, testMethod = countFriendTable@MultiSchemaTests, testException = [null], mergedContextConfiguration = [MergedContextConfiguration@34158c08 testClass = MultiSchemaTests, locations = '{}', classes = '{class blog.in.action.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTestContextBootstrapper=true}', contextCustomizers = set[[ImportsContextCustomizer@19e4fcac key = [org.springframework.boot.autoconfigure.cache.CacheAutoConfiguration, org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration, org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration, org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration, org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration, org.springframework.boot.autoconfigure.transaction.TransactionAutoConfiguration, org.springframework.boot.test.autoconfigure.jdbc.TestDatabaseAutoConfiguration, org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManagerAutoConfiguration]], org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@4e928fbf, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@2e32ccc5, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.autoconfigure.OverrideAutoConfigurationContextCustomizerFactory$DisableAutoConfigurationContextCustomizer@7354b8c5, org.springframework.boot.test.autoconfigure.actuate.metrics.MetricsExportContextCustomizerFactory$DisableMetricExportContextCustomizer@59e2d8e3, org.springframework.boot.test.autoconfigure.filter.TypeExcludeFiltersContextCustomizer@351584c0, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@e7bdd664, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@59d4cd39, org.springframework.boot.test.context.SpringBootTestArgs@1, org.springframework.boot.test.context.SpringBootTestWebEnvironment@0], contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map[[empty]]]
```

## 3. 기존 hello 스키마의 엔티티 정상 동작 여부 확인

### 3.1. Member 클래스

- 기존 `hello` 스키마의 `TB_MEMBER` 테이블과 연결된 `Member` 엔티티는 별도 변경 없이 사용합니다.

```java
package blog.in.action.hello;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "TB_MEMBER")
public class Member {

    @Id
    private String id;
    private String nickName;
}
```

### 3.2. MultiSchemaTests 클래스

- `MemberRepository` 인스턴스로 `TB_MEMBER` 테이블에 `count` 쿼리를 수행하는 테스트를 추가합니다. 

```java
package blog.in.action;

import blog.in.action.hello.MemberRepository;
import blog.in.action.world.FriendRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class MultiSchemaTests {

    @Autowired
    FriendRepository friendRepository;

    @Autowired
    MemberRepository memberRepository;

    @Test
    void countFromFriendTable() {
        assertThat(friendRepository.count(), greaterThanOrEqualTo(0L));
    }

    @Test
    void countFromMemberTable() {
        assertThat(memberRepository.count(), greaterThanOrEqualTo(0L));
    }
}
```

### 3.3. 테스트 수행

##### 테스트 수행 결과 - 성공

<p align="center">
    <img src="/images/connect-multi-schema-in-mysql-3.JPG" width="100%" class="image__border">
</p>

## 4. @Table 애너테이션 schema 속성 현상

해당 문제의 원인을 찾고자 [Database Schema and Catalog][database-schema-and-catalog-link] 포스트에서 스키마와 카탈로그의 차이점을 정리했습니다. 
정확한 원인은 찾지 못했지만, 추측할 수 있는 몇 가지 근거들을 찾아 정리하였습니다. 

### 4.1. MySQL 데이터베이스 3계층 구조

- `인스턴스`는 DBMS 서비스를 의미합니다. 서버 혹은 서버 프로세스를 의미합니다.
- 데이터베이스가 존재하지 않고, 바로 스키마가 위치합니다. 
- 이 구조의 경우 데이터베이스와 스키마를 동의어로 사용합니다.
- `MySQL` 데이터베이스를 대표적인 예로 들 수 있으며, 이런 경우에는 데이터베이스와 스키마를 혼동하여 사용하는 경우가 발생합니다.

<p align="center">
    <img src="/images/connect-multi-schema-in-mysql-4.JPG" width="80%" class="image__border">
</p>
<center>https://hue9010.github.io/db/mysql_schema/</center>

### 4.2. MySQL 데이터베이스 특징

MySQL Document를 살펴보면 다음과 같은 정보를 얻을 수 있습니다. 

> 8.1.3 Configuring Catalog and Schema Support<br/>
> Generally, catalogs are collections of schemas, so the fully qualified name would look like catalog.schema.table.column. 
> Historically with MySQL ODBC Driver, CATALOG and DATABASE were two names used for the same thing. 
> At the same time SCHEMA was often used as a synonym for MySQL Database. 
> This would suggest that CATALOG equals a SCHEMA, which is incorrect, but in MySQL Server context they would be the same thing.<br/>
> ...<br/>
> The Connector/ODBC driver does not allow using catalog and schema functionality at the same time because it would cause unsupported naming.

내용을 살펴보면 일반적으로 `카탈로그`와 `스키마`는 같은 개념이 아니지만, `MySQL`에서는 동일한 개념으로 사용합니다. 
`MySQL`에선 시스템 구조상 `스키마`와 `데이터베이스`는 동의어로 사용됩니다. 
결과적으로 `MySQL`에서 `카탈로그 = 데이터베이스 = 스키마`라는 결과를 얻을 수 있습니다. 

`MySQL` ODBC(Open Database Connectivity) 드라이버는 전통적으로 `CATALOG`와 `DATABASE`를 동일한 것으로 사용합니다. 
동시에 `MySQL`에선 `SCHEMA`도 데이터베이스의 동의어이므로 `MySQL` 서버 컨텍스트에선 `CATALOG`와 `SCHEMA`가 동일한 것으로 사용됩니다. 
ODBC 드라이버에서 스키마와 카탈로그는 데이터베이스 객체들을 테이블로서 참조하기 위해 사용되기 때문에 두 컨셉을 동시에 사용하지 못하도록 아래와 같은 설정이 존재합니다. 

##### NO_CATALOG, NO_SCHEMA 설정
- NO_CATALOG, NO_SCHEMA 설정에 따라 드라이버에서 카탈로그와 스키마를 사용할지 여부를 선택합니다.

<p align="center">
    <img src="/images/connect-multi-schema-in-mysql-5.JPG" width="80%" class="image__border">
</p>
<center>https://dev.mysql.com/doc/connector-odbc/en/connector-odbc-usagenotes-functionality-catalog-schema.html</center>

### 4.3. 결론

`MySQL`에선 시스템 구조상 `카탈로그 = 스키마 = 데이터베이스`이므로 `MySQL`의 `ODBC` 드라이버는 카탈로그와 스키마를 같은 의미로 사용하게 됩니다. 
동시에 사용할 순 없어서 둘 중 하나를 `NO_CATALOG`, `NO_SCHEMA` 옵션으로 설정하여 사용합니다. 
디폴트 설정이 어떤 것인지는 확인하진 못 했지만, 옵션 설정에 따라 카탈로그를 사용한 것이라 예상됩니다.

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-06-19-connect-multi-schema-in-mysql>

#### REFERENCE
- <https://dev.mysql.com/doc/connector-odbc/en/connector-odbc-usagenotes-functionality-catalog-schema.html>
- <https://stackoverflow.com/questions/11184025/what-are-the-jpa-table-annotation-catalog-and-schema-variables-used-for>

[database-schema-and-catalog-link]: https://junhyunny.github.io/database/database-schema-and-catalog/