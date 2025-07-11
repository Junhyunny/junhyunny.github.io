---
title: "JPA Sequence Key 생성 전략"
search: false
category:
  - spring-boot
  - jpa
last_modified_at: 2022-06-18T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [EntityManager 특징과 영속성 컨텍스트 장점][persistence-context-advantages-link]

## 0. 들어가면서

비즈니스에 따라 기본 키(PK, Primary Key) 값을 어플리케이션에서 직접 지정하는 것이 아니라, 키 값이 자동으로 생성되도록 만들고 이를 사용하는 경우가 있습니다. 
`JPA`는 기본 키 자동 발급을 위한 기능과 몇 가지 전략을 제공하는데, 이번 포스트에선 전략 별로 어떤 차이점이 있는지 정리해보았습니다. 

## 1. GenerationType.IDENTITY 전략

> 기본 키 생성을 데이터베이스에 위임합니다.

### 1.1. 테이블 생성

기본 키 생성을 데이터베이스에 위임했기 때문에 테이블을 생성하는 DDL(database define language) 쿼리에 자동 키 발급에 대한 내용이 필요합니다. 
데이터베이스 벤더에 따라 다르게 작성합니다. 

##### H2 데이터베이스 테이블 생성
- `generated by default as identity` 키워드 - H2 데이터베이스에서 기본 키 자동 발급을 위해 추가됩니다. 

```sql
create table identity_entity (
    id bigint generated by default as identity,
    primary key (id)
)
```

### 1.2. JPA 지연 쓰기 불가

`IDENTITY` 전략은 영속성 컨텍스트(persistence context)의 장점 중 하나인 `지연 쓰기`가 불가능합니다. 
`IDENTITY` 전략은 사용하면 기본 키 값은 실제 데이터베이스에 데이터를 저장한 이후에 확인할 수 있습니다. 
영속성 컨텍스트는 엔티티(entity)를 1차 캐싱에 저장하기 위해서 기본 키 필드(`@Id` 애너테이션이 붙은 필드)에 값이 필요하기 때문에 `save` 메소드 수행 시 `insert` 쿼리를 매번 `flush`합니다. 

### 1.3. 예시 코드

#### 1.3.1. IdentityEntity 클래스

- `@GeneratedValue` 애너테이션의 생성 전략을 `GenerationType.IDENTITY`으로 지정합니다.

```java
package blog.in.action.identity;

import lombok.Getter;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Getter
@Entity
public class IdentityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
}
```

#### 1.3.2. IdentityTests 클래스

- 반복문을 통해 데이터를 추가를 3회 수행합니다.
- 데이터를 조회하여 발급된 기본 키 값을 확인합니다.

```java
package blog.in.action.identity;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

@Log4j2
@DataJpaTest
public class IdentityTests {

    @Autowired
    IdentityRepository repository;

    @Test
    void test() {

        log.info("추가");
        for (int index = 0; index < 3; index++) {
            log.info("before save");
            repository.save(new IdentityEntity());
            log.info("after save");
        }

        log.info("조회");
        List<IdentityEntity> entities = repository.findAll();
        for (IdentityEntity entity : entities) {
            log.info(entity.getId());
        }
    }
}
```

### 1.4. 테스트 결과 로그 확인

테스트 수행 로그를 통해 동작 과정을 살펴보겠습니다.
- `JpaRepository`의 `save` 메소드 수행 시 매번 `insert` 쿼리가 수행됩니다.
- `insert` 쿼리 수행 시 `id`에 `null` 값을 삽입하지만, 조회 시 값이 있음을 확인할 수 있습니다.

```
2022-06-19 05:36:29.148  INFO 32296 --- [           main] o.s.t.c.transaction.TransactionContext   : Began transaction (1) for test context [DefaultTestContext@2a640157 testClass = IdentityTests, testInstance = blog.in.action.identity.IdentityTests@5f9678e1, testMethod = test@IdentityTests, testException = [null], mergedContextConfiguration = [MergedContextConfiguration@52851b44 testClass = IdentityTests, locations = '{}', classes = '{class blog.in.action.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTestContextBootstrapper=true}', contextCustomizers = set[[ImportsContextCustomizer@584f54e6 key = [org.springframework.boot.autoconfigure.cache.CacheAutoConfiguration, org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration, org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration, org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration, org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration, org.springframework.boot.autoconfigure.sql.init.SqlInitializationAutoConfiguration, org.springframework.boot.autoconfigure.transaction.TransactionAutoConfiguration, org.springframework.boot.test.autoconfigure.jdbc.TestDatabaseAutoConfiguration, org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManagerAutoConfiguration]], org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@74a6f9c1, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@63611043, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.autoconfigure.OverrideAutoConfigurationContextCustomizerFactory$DisableAutoConfigurationContextCustomizer@51549490, org.springframework.boot.test.autoconfigure.actuate.metrics.MetricsExportContextCustomizerFactory$DisableMetricExportContextCustomizer@7daa0fbd, org.springframework.boot.test.autoconfigure.filter.TypeExcludeFiltersContextCustomizer@351584c0, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@92765d80, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@2796aeae, org.springframework.boot.test.context.SpringBootTestArgs@1, org.springframework.boot.test.context.SpringBootTestWebEnvironment@0], contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map['org.springframework.test.context.event.ApplicationEventsTestExecutionListener.recordApplicationEvents' -> false]]; transaction manager [org.springframework.orm.jpa.JpaTransactionManager@76dc36e5]; rollback [true]
2022-06-19 05:36:29.236  INFO 32296 --- [           main] blog.in.action.identity.IdentityTests    : 추가
2022-06-19 05:36:29.237  INFO 32296 --- [           main] blog.in.action.identity.IdentityTests    : before save
Hibernate: 
    insert 
    into
        identity_entity
        (id) 
    values
        (null)
2022-06-19 05:36:29.266  INFO 32296 --- [           main] blog.in.action.identity.IdentityTests    : after save
2022-06-19 05:36:29.266  INFO 32296 --- [           main] blog.in.action.identity.IdentityTests    : before save
Hibernate: 
    insert 
    into
        identity_entity
        (id) 
    values
        (null)
2022-06-19 05:36:29.266  INFO 32296 --- [           main] blog.in.action.identity.IdentityTests    : after save
2022-06-19 05:36:29.267  INFO 32296 --- [           main] blog.in.action.identity.IdentityTests    : before save
Hibernate: 
    insert 
    into
        identity_entity
        (id) 
    values
        (null)
2022-06-19 05:36:29.267  INFO 32296 --- [           main] blog.in.action.identity.IdentityTests    : after save
2022-06-19 05:36:29.267  INFO 32296 --- [           main] blog.in.action.identity.IdentityTests    : 조회
Hibernate: 
    select
        identityen0_.id as id1_0_ 
    from
        identity_entity identityen0_
2022-06-19 05:36:29.396  INFO 32296 --- [           main] blog.in.action.identity.IdentityTests    : 1
2022-06-19 05:36:29.396  INFO 32296 --- [           main] blog.in.action.identity.IdentityTests    : 2
2022-06-19 05:36:29.396  INFO 32296 --- [           main] blog.in.action.identity.IdentityTests    : 3
2022-06-19 05:36:29.402  INFO 32296 --- [           main] o.s.t.c.transaction.TransactionContext   : Rolled back transaction for test: [DefaultTestContext@2a640157 testClass = IdentityTests, testInstance = blog.in.action.identity.IdentityTests@5f9678e1, testMethod = test@IdentityTests, testException = [null], mergedContextConfiguration = [MergedContextConfiguration@52851b44 testClass = IdentityTests, locations = '{}', classes = '{class blog.in.action.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTestContextBootstrapper=true}', contextCustomizers = set[[ImportsContextCustomizer@584f54e6 key = [org.springframework.boot.autoconfigure.cache.CacheAutoConfiguration, org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration, org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration, org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration, org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration, org.springframework.boot.autoconfigure.sql.init.SqlInitializationAutoConfiguration, org.springframework.boot.autoconfigure.transaction.TransactionAutoConfiguration, org.springframework.boot.test.autoconfigure.jdbc.TestDatabaseAutoConfiguration, org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManagerAutoConfiguration]], org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@74a6f9c1, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@63611043, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.autoconfigure.OverrideAutoConfigurationContextCustomizerFactory$DisableAutoConfigurationContextCustomizer@51549490, org.springframework.boot.test.autoconfigure.actuate.metrics.MetricsExportContextCustomizerFactory$DisableMetricExportContextCustomizer@7daa0fbd, org.springframework.boot.test.autoconfigure.filter.TypeExcludeFiltersContextCustomizer@351584c0, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@92765d80, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@2796aeae, org.springframework.boot.test.context.SpringBootTestArgs@1, org.springframework.boot.test.context.SpringBootTestWebEnvironment@0], contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map['org.springframework.test.context.event.ApplicationEventsTestExecutionListener.recordApplicationEvents' -> false]]
```

## 2. GenerationType.SEQUENCE 전략

> 데이터베이스의 시퀀스 객체(sequence object)를 이용하여 유일한 값을 순서대로 생성합니다.

### 2.1. 시퀀스 객체와 테이블 생성

`GenerationType.SEQUENCE` 전략은 데이터베이스에 미리 만들어진 시퀀스 객체를 사용합니다. 
시퀀스 객체를 만드는 방법과 사용하는 방법은 데이터베이스 벤더마다 다릅니다. 

##### H2 데이터베이스 시퀀스 객체 생성

- `my_seq`라는 이름의 시퀀스 객체를 생성합니다.
- 최초 값은 1에서 시작하고, 사용할 때마다 1씩 증가합니다.

```sql
create sequence my_seq start with 1 increment by 1
```

### 2.2. 예시 코드

#### 2.2.1. SequenceEntity 클래스

- `@GeneratedValue` 애너테이션
    - 생성 전략을 `GenerationType.SEQUENCE`으로 지정합니다.
    - 기본 키 생성자를 `SEQ_GENERATOR`으로 지정합니다.
- `@SequenceGenerator` 애너테이션
    - name - 기본 키 생성자 이름은 `SEQ_GENERATOR`입니다.
    - sequenceName - `SEQ_GENERATOR`가 사용할 데이터베이스의 시퀀스 객체는 `MY_SEQ`입니다. 
    - allocationSize - 시퀀스 객체 호출 시 증가하는 값은 1로 지정합니다.

```java
package blog.in.action.sequence;

import lombok.Getter;

import javax.persistence.*;

@Getter
@SequenceGenerator(
        name = "SEQ_GENERATOR",
        sequenceName = "MY_SEQ",
        allocationSize = 1
)
@Entity
public class SequenceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_GENERATOR")
    private Long id;
}
```

#### 2.2.2. SequenceTests 클래스

- 반복문을 통해 데이터를 추가를 3회 수행합니다.
- 데이터를 조회하여 발급된 기본 키 값을 확인합니다.

```java
package blog.in.action.sequence;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

@Log4j2
@DataJpaTest
public class SequenceTests {

    @Autowired
    SequenceRepository repository;

    @Test
    void test() {

        log.info("추가");
        for (int index = 0; index < 3; index++) {
            log.info("before save");
            repository.save(new SequenceEntity());
            log.info("after save");
        }

        log.info("조회");
        List<SequenceEntity> entities = repository.findAll();
        for (SequenceEntity entity : entities) {
            log.info(entity.getId());
        }
    }
}
```

### 2.3. 테스트 결과 로그 확인

테스트 수행 로그를 통해 동작 과정을 살펴보겠습니다.
- `JpaRepository`의 `save` 메소드 수행 시 매번 시퀀스 값을 발급받습니다.
    - `call next value for my_seq` - H2 데이터베이스에서 시퀀스 키를 발급받는 방법입니다.
- 데이터를 조회하는 `select` 쿼리 수행 전에 JPA `지연 쓰기`를 수행하기 때문에 `insert` 쿼리가 3회 수행됩니다.
    - `insert` 쿼리 수행 시 `id`에 발급받은 시퀀스 값을 사용합니다.

```
2022-06-19 06:46:54.910  INFO 54837 --- [           main] o.s.t.c.transaction.TransactionContext   : Began transaction (1) for test context [DefaultTestContext@2dca0d64 testClass = SequenceTests, testInstance = blog.in.action.sequence.SequenceTests@112f364d, testMethod = test@SequenceTests, testException = [null], mergedContextConfiguration = [MergedContextConfiguration@f80945f testClass = SequenceTests, locations = '{}', classes = '{class blog.in.action.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTestContextBootstrapper=true}', contextCustomizers = set[[ImportsContextCustomizer@ff684e1 key = [org.springframework.boot.autoconfigure.cache.CacheAutoConfiguration, org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration, org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration, org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration, org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration, org.springframework.boot.autoconfigure.sql.init.SqlInitializationAutoConfiguration, org.springframework.boot.autoconfigure.transaction.TransactionAutoConfiguration, org.springframework.boot.test.autoconfigure.jdbc.TestDatabaseAutoConfiguration, org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManagerAutoConfiguration]], org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@74a6f9c1, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@63611043, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.autoconfigure.OverrideAutoConfigurationContextCustomizerFactory$DisableAutoConfigurationContextCustomizer@51549490, org.springframework.boot.test.autoconfigure.actuate.metrics.MetricsExportContextCustomizerFactory$DisableMetricExportContextCustomizer@7daa0fbd, org.springframework.boot.test.autoconfigure.filter.TypeExcludeFiltersContextCustomizer@351584c0, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@92765d80, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@2796aeae, org.springframework.boot.test.context.SpringBootTestArgs@1, org.springframework.boot.test.context.SpringBootTestWebEnvironment@0], contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map['org.springframework.test.context.event.ApplicationEventsTestExecutionListener.recordApplicationEvents' -> false]]; transaction manager [org.springframework.orm.jpa.JpaTransactionManager@3ee258]; rollback [true]
2022-06-19 06:46:54.990  INFO 54837 --- [           main] blog.in.action.sequence.SequenceTests    : 추가
2022-06-19 06:46:54.990  INFO 54837 --- [           main] blog.in.action.sequence.SequenceTests    : before save
Hibernate: 
    call next value for my_seq
2022-06-19 06:46:55.018  INFO 54837 --- [           main] blog.in.action.sequence.SequenceTests    : after save
2022-06-19 06:46:55.019  INFO 54837 --- [           main] blog.in.action.sequence.SequenceTests    : before save
Hibernate: 
    call next value for my_seq
2022-06-19 06:46:55.019  INFO 54837 --- [           main] blog.in.action.sequence.SequenceTests    : after save
2022-06-19 06:46:55.019  INFO 54837 --- [           main] blog.in.action.sequence.SequenceTests    : before save
Hibernate: 
    call next value for my_seq
2022-06-19 06:46:55.020  INFO 54837 --- [           main] blog.in.action.sequence.SequenceTests    : after save
2022-06-19 06:46:55.020  INFO 54837 --- [           main] blog.in.action.sequence.SequenceTests    : 조회
Hibernate: 
    insert 
    into
        sequence_entity
        (id) 
    values
        (?)
Hibernate: 
    insert 
    into
        sequence_entity
        (id) 
    values
        (?)
Hibernate: 
    insert 
    into
        sequence_entity
        (id) 
    values
        (?)
Hibernate: 
    select
        sequenceen0_.id as id1_1_ 
    from
        sequence_entity sequenceen0_
2022-06-19 06:46:55.135  INFO 54837 --- [           main] blog.in.action.sequence.SequenceTests    : 1
2022-06-19 06:46:55.136  INFO 54837 --- [           main] blog.in.action.sequence.SequenceTests    : 2
2022-06-19 06:46:55.136  INFO 54837 --- [           main] blog.in.action.sequence.SequenceTests    : 3
2022-06-19 06:46:55.143  INFO 54837 --- [           main] o.s.t.c.transaction.TransactionContext   : Rolled back transaction for test: [DefaultTestContext@2dca0d64 testClass = SequenceTests, testInstance = blog.in.action.sequence.SequenceTests@112f364d, testMethod = test@SequenceTests, testException = [null], mergedContextConfiguration = [MergedContextConfiguration@f80945f testClass = SequenceTests, locations = '{}', classes = '{class blog.in.action.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTestContextBootstrapper=true}', contextCustomizers = set[[ImportsContextCustomizer@ff684e1 key = [org.springframework.boot.autoconfigure.cache.CacheAutoConfiguration, org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration, org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration, org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration, org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration, org.springframework.boot.autoconfigure.sql.init.SqlInitializationAutoConfiguration, org.springframework.boot.autoconfigure.transaction.TransactionAutoConfiguration, org.springframework.boot.test.autoconfigure.jdbc.TestDatabaseAutoConfiguration, org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManagerAutoConfiguration]], org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@74a6f9c1, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@63611043, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.autoconfigure.OverrideAutoConfigurationContextCustomizerFactory$DisableAutoConfigurationContextCustomizer@51549490, org.springframework.boot.test.autoconfigure.actuate.metrics.MetricsExportContextCustomizerFactory$DisableMetricExportContextCustomizer@7daa0fbd, org.springframework.boot.test.autoconfigure.filter.TypeExcludeFiltersContextCustomizer@351584c0, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@92765d80, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@2796aeae, org.springframework.boot.test.context.SpringBootTestArgs@1, org.springframework.boot.test.context.SpringBootTestWebEnvironment@0], contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map['org.springframework.test.context.event.ApplicationEventsTestExecutionListener.recordApplicationEvents' -> false]]
```

## 3. GenerationType.TABLE 전략

> 키 생성 전용 테이블을 하나 만들고 여기에 이름과 값으로 사용할 컬럼을 만들어 데이터베이스 시퀀스를 흉내내는 전략입니다.

### 3.1. 테이블 생성

시퀀스 값을 발급하기 위한 테이블을 별도로 만들었기 때문에 데이터베이스 벤더에 의존적이지 않습니다. 
모든 데이터베이스 벤더에서 동일하게 사용할 수 있지만, 시퀀스 테이블 생성 및 초기화 작업이 반드시 선행되어야 합니다. 

##### H2 데이터베이스 시퀀스 테이블 생성 및 초기화

- 시퀀스 이름(sequence_name)과 시퀀스 값(next_val)을 가지는 테이블을 만듭니다.
    - 시퀀스 이름은 별도로 지정하지 않는 경우 디폴트 값으로 엔티티 이름을 사용합니다.
- 테이블을 만든 후에 사용할 시퀀스 이름과 초기 값을 `insert`합니다.

```sql
create table seq_table (
   sequence_name varchar(255) not null,
    next_val bigint,
    primary key (sequence_name)
)

insert into seq_table(sequence_name, next_val) values ('table_entity', 0)
```

### 3.2. 예시 코드

#### 3.2.1. TableEntity 클래스

- `@GeneratedValue` 애너테이션
    - 생성 전략을 `GenerationType.SEQUENCE`으로 지정합니다.
    - 기본 키 생성자를 `TABLE_SEQ_GENERATOR`으로 지정합니다.
- `@TableGenerator` 애너테이션
    - name - 기본 키 생성자 이름은 `TABLE_SEQ_GENERATOR`입니다.
    - table - `TABLE_SEQ_GENERATOR`가 사용할 데이터베이스의 테이블은 `SEQ_TABLE`입니다. 
    - allocationSize - 시퀀스 테이블 사용 시 증가하는 값은 1로 지정합니다.

```java
package blog.in.action.table;

import lombok.Getter;

import javax.persistence.*;

@Getter
@TableGenerator(
        name = "TABLE_SEQ_GENERATOR",
        table = "SEQ_TABLE",
        allocationSize = 1
)
@Entity
public class TableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.TABLE, generator = "TABLE_SEQ_GENERATOR")
    private Long id;
}
```

#### 3.2.2. TableTests 클래스

- 반복문을 통해 데이터를 추가를 3회 수행합니다.
- 데이터를 조회하여 발급된 기본 키 값을 확인합니다.

```java
package blog.in.action.table;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

@Log4j2
@DataJpaTest
public class TableTests {

    @Autowired
    TableRepository repository;

    @Test
    void test() {

        log.info("추가");
        for (int index = 0; index < 3; index++) {
            log.info("before save");
            repository.save(new TableEntity());
            log.info("after save");
        }

        log.info("조회");
        List<TableEntity> entities = repository.findAll();
        for (TableEntity entity : entities) {
            log.info(entity.getId());
        }
    }
}
```

### 3.3. 테스트 결과 로그 확인

테스트 수행 로그를 통해 동작 과정을 살펴보겠습니다.
- `JpaRepository`의 `save` 메소드 수행 시 매번 시퀀스 값을 발급받습니다.
    - 시퀀스 값 발급을 위해 `select`, `update` 2회 쿼리가 수행됩니다.
    - `select` 쿼리 - `seq_table` 테이블로부터 엔티티에 해당되는 시퀀스 값을 조회합니다. `for update` 키워드로 해당 시퀀스 데이터를 조회하면서 데이터 락(lock)을 수행합니다.
    - `update` 쿼리 - `seq_table` 테이블에 해당 엔티티가 다음으로 사용할 시퀀스 값을 `update`합니다.
- 데이터를 조회하는 `select` 쿼리 수행 전에 JPA `지연 쓰기`를 수행하기 때문에 `insert` 쿼리가 3회 수행됩니다.
    - `insert` 쿼리 수행 시 `id`에 발급받은 시퀀스 값을 사용합니다.

```
2022-06-19 07:17:43.340  INFO 64356 --- [           main] o.s.t.c.transaction.TransactionContext   : Began transaction (1) for test context [DefaultTestContext@74bada02 testClass = TableTests, testInstance = blog.in.action.table.TableTests@31d0e481, testMethod = test@TableTests, testException = [null], mergedContextConfiguration = [MergedContextConfiguration@525575 testClass = TableTests, locations = '{}', classes = '{class blog.in.action.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTestContextBootstrapper=true}', contextCustomizers = set[[ImportsContextCustomizer@46dffdc3 key = [org.springframework.boot.autoconfigure.cache.CacheAutoConfiguration, org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration, org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration, org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration, org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration, org.springframework.boot.autoconfigure.sql.init.SqlInitializationAutoConfiguration, org.springframework.boot.autoconfigure.transaction.TransactionAutoConfiguration, org.springframework.boot.test.autoconfigure.jdbc.TestDatabaseAutoConfiguration, org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManagerAutoConfiguration]], org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@135606db, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@4f74980d, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.autoconfigure.OverrideAutoConfigurationContextCustomizerFactory$DisableAutoConfigurationContextCustomizer@616ac46a, org.springframework.boot.test.autoconfigure.actuate.metrics.MetricsExportContextCustomizerFactory$DisableMetricExportContextCustomizer@6337c201, org.springframework.boot.test.autoconfigure.filter.TypeExcludeFiltersContextCustomizer@351584c0, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@92765d80, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@2ce6c6ec, org.springframework.boot.test.context.SpringBootTestArgs@1, org.springframework.boot.test.context.SpringBootTestWebEnvironment@0], contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map['org.springframework.test.context.event.ApplicationEventsTestExecutionListener.recordApplicationEvents' -> false]]; transaction manager [org.springframework.orm.jpa.JpaTransactionManager@29699283]; rollback [true]
2022-06-19 07:17:43.427  INFO 64356 --- [           main] blog.in.action.table.TableTests          : 추가
2022-06-19 07:17:43.428  INFO 64356 --- [           main] blog.in.action.table.TableTests          : before save
Hibernate: 
    select
        tbl.next_val 
    from
        seq_table tbl 
    where
        tbl.sequence_name=? for update
            
Hibernate: 
    update
        seq_table 
    set
        next_val=?  
    where
        next_val=? 
        and sequence_name=?
2022-06-19 07:17:43.461  INFO 64356 --- [           main] blog.in.action.table.TableTests          : after save
2022-06-19 07:17:43.461  INFO 64356 --- [           main] blog.in.action.table.TableTests          : before save
Hibernate: 
    select
        tbl.next_val 
    from
        seq_table tbl 
    where
        tbl.sequence_name=? for update
            
Hibernate: 
    update
        seq_table 
    set
        next_val=?  
    where
        next_val=? 
        and sequence_name=?
2022-06-19 07:17:43.463  INFO 64356 --- [           main] blog.in.action.table.TableTests          : after save
2022-06-19 07:17:43.463  INFO 64356 --- [           main] blog.in.action.table.TableTests          : before save
Hibernate: 
    select
        tbl.next_val 
    from
        seq_table tbl 
    where
        tbl.sequence_name=? for update
            
Hibernate: 
    update
        seq_table 
    set
        next_val=?  
    where
        next_val=? 
        and sequence_name=?
2022-06-19 07:17:43.465  INFO 64356 --- [           main] blog.in.action.table.TableTests          : after save
2022-06-19 07:17:43.465  INFO 64356 --- [           main] blog.in.action.table.TableTests          : 조회
Hibernate: 
    insert 
    into
        table_entity
        (id) 
    values
        (?)
Hibernate: 
    insert 
    into
        table_entity
        (id) 
    values
        (?)
Hibernate: 
    insert 
    into
        table_entity
        (id) 
    values
        (?)
Hibernate: 
    select
        tableentit0_.id as id1_2_ 
    from
        table_entity tableentit0_
2022-06-19 07:17:43.589  INFO 64356 --- [           main] blog.in.action.table.TableTests          : 1
2022-06-19 07:17:43.589  INFO 64356 --- [           main] blog.in.action.table.TableTests          : 2
2022-06-19 07:17:43.589  INFO 64356 --- [           main] blog.in.action.table.TableTests          : 3
2022-06-19 07:17:43.597  INFO 64356 --- [           main] o.s.t.c.transaction.TransactionContext   : Rolled back transaction for test: [DefaultTestContext@74bada02 testClass = TableTests, testInstance = blog.in.action.table.TableTests@31d0e481, testMethod = test@TableTests, testException = [null], mergedContextConfiguration = [MergedContextConfiguration@525575 testClass = TableTests, locations = '{}', classes = '{class blog.in.action.ActionInBlogApplication}', contextInitializerClasses = '[]', activeProfiles = '{}', propertySourceLocations = '{}', propertySourceProperties = '{org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTestContextBootstrapper=true}', contextCustomizers = set[[ImportsContextCustomizer@46dffdc3 key = [org.springframework.boot.autoconfigure.cache.CacheAutoConfiguration, org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration, org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration, org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration, org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration, org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration, org.springframework.boot.autoconfigure.sql.init.SqlInitializationAutoConfiguration, org.springframework.boot.autoconfigure.transaction.TransactionAutoConfiguration, org.springframework.boot.test.autoconfigure.jdbc.TestDatabaseAutoConfiguration, org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManagerAutoConfiguration]], org.springframework.boot.test.context.filter.ExcludeFilterContextCustomizer@135606db, org.springframework.boot.test.json.DuplicateJsonObjectContextCustomizerFactory$DuplicateJsonObjectContextCustomizer@4f74980d, org.springframework.boot.test.mock.mockito.MockitoContextCustomizer@0, org.springframework.boot.test.autoconfigure.OverrideAutoConfigurationContextCustomizerFactory$DisableAutoConfigurationContextCustomizer@616ac46a, org.springframework.boot.test.autoconfigure.actuate.metrics.MetricsExportContextCustomizerFactory$DisableMetricExportContextCustomizer@6337c201, org.springframework.boot.test.autoconfigure.filter.TypeExcludeFiltersContextCustomizer@351584c0, org.springframework.boot.test.autoconfigure.properties.PropertyMappingContextCustomizer@92765d80, org.springframework.boot.test.autoconfigure.web.servlet.WebDriverContextCustomizerFactory$Customizer@2ce6c6ec, org.springframework.boot.test.context.SpringBootTestArgs@1, org.springframework.boot.test.context.SpringBootTestWebEnvironment@0], contextLoader = 'org.springframework.boot.test.context.SpringBootContextLoader', parent = [null]], attributes = map['org.springframework.test.context.event.ApplicationEventsTestExecutionListener.recordApplicationEvents' -> false]]
```

## 4. GenerationType.AUTO 전략

> 데이터베이스에 따라 INDENTITY, SEQUENCE, TABLE 전략 중 하나를 자동으로 선택합니다.

키 생성 전략이 정해지지 않은 개발 초기 단계나 프로토타입 개발 시 편리하게 사용할 수 있습니다. 
데이터베이스 벤더마다 다른 전략을 선택하기 때문에 `SEQUENCE`, `TABLE` 전략이 선택된다면 미리 선행 작업이 필요할 수 있습니다. 

##### H2 데이터베이스 AUTO 전략 사용 시 시퀀스 객체 생성

- H2 데이터베이스는 `SEQUENCE` 전략을 사용합니다.

```sql
create sequence hibernate_sequence start with 1 increment by 1
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-06-18-jpa-sequence-key-generate-strategy>

#### REFERENCE
- <https://xzio.tistory.com/1446>
- <https://newwisdom.tistory.com/90>

[persistence-context-advantages-link]: https://junhyunny.github.io/spring-boot/jpa/junit/persistence-context-advantages/