---
title: "CRUD with JPAQueryFactory"
search: false
category:
  - java
  - jpa
  - query-dsl
last_modified_at: 2022-12-27T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [@PersistenceContext 애너테이션][entity-manager-with-persistence-context-annotation-link]

## 0. 들어가면서

`QueryDSL`은 `Java` 코드로 질의문(query)를 작성할 수 있게 해주는 라이브러리입니다. 
`Java` 코드로 질의문을 작성하면 다음과 같은 이점들을 얻을 수 있습니다. 

* IDE(integrated development environment)의 코드 자동 완성 기능의 도움을 받을 수 있습니다.
* 문법적으로 잘못된 쿼리는 컴파일 시점에 찾아줍니다.
* 도메인 객체의 필드(field)들을 사용하기 때문에 도메인 객체 변경에 따른 에러 가능성을 빌드(build) 시점에 찾을 수 있습니다. 

`XML`, 문자열 기반 쿼리는 단순한 에러를 런타임까지 발견하지 못할 가능성이 `QueryDSL`보다 높습니다. 
`QueryDSL`을 사용하면 에러를 런타임 이전에 미리 발견할 수 있게 됨으로써 더 안정적인 시스템을 구축할 수 있습니다. 
예전 기술 도입을 위해 간단한 예제 코드를 작성해 본 경험만 있을 뿐 비즈니스 코드에 적극적으로 사용해 본 적은 없었습니다. 
이번 프로젝트에선 강력한 동적 쿼리 기능이 필요하여 `QueryDSL`을 도입했고, 익숙해지기까지 다소 시간이 걸렸습니다. 
이번 포스트에선 `QueryDSL` 설정 방법과 간단한 CRUD(create, read, update, delete) 코드를 살펴보겠습니다. 

## 1. QueryDSL Settings

다음과 같은 환경에서 구축하였습니다. 

* macOS Ventura with Intel Core
* IntelliJ IDEA 2022.3 (Ultimate Edition)
* 메이븐(maven) 프로젝트
* spring-boot-starter-parent 2.7.7 version

### 1.1. pom.xml 파일

다음과 같은 의존성과 플러그인을 추가합니다.

```xml
    <dependencies>
        <!-- ... -->
        <dependency>
            <groupId>com.querydsl</groupId>
            <artifactId>querydsl-apt</artifactId>
            <version>${querydsl.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>com.querydsl</groupId>
            <artifactId>querydsl-jpa</artifactId>
            <version>${querydsl.version}</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <!-- ... -->
            <plugin>
                <groupId>com.mysema.maven</groupId>
                <artifactId>apt-maven-plugin</artifactId>
                <version>1.1.3</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>process</goal>
                        </goals>
                        <configuration>
                            <outputDirectory>target/generated-sources/annotations</outputDirectory>
                            <processor>com.querydsl.apt.jpa.JPAAnnotationProcessor</processor>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
```

### 1.2. IntelliJ 환경 및 프로젝트 설정

`QueryDSL`은 애너테이션 프로세서(annotation processor)를 통해 엔티티(entity)들을 `Q`가 붙은 클래스로 컴파일하여 사용합니다. 
IDE에서 컴파일된 `Q-Type` 클래스들을 사용하려면 컴파일 위치를 잡아줘야 합니다. 
이 과정이 없으면 컴파일 된 `Q-Type` 클래스를 찾지 못하거나 빌드 과정에서 에러가 발생합니다. 

#### 1.2.1. 환결 설정

* 환경 설정(command + ',')에서 `Annotation Processors` 관련 설정을 찾습니다.
* 해당 프로젝트의 `production sources directory`를 pom.xml 파일의 플러그인에 정의한 `outputDirectory`와 일치시킵니다. 

<p align="center">
    <img src="/images/crud-with-jpa-query-factory-1.JPG" width="100%" class="image__border">
</p>

#### 1.2.2. 프로젝트 모듈 설정

* 프로젝트 설정(command + ';')에서 모듈 관련 설정을 찾습니다.
* 코드 에디터에서 컴파일 된 `Q-Type` 클래스를 임포트(import)할 수 있도록 모듈의 소스 경로로 설정합니다.

<p align="center">
    <img src="/images/crud-with-jpa-query-factory-2.JPG" width="100%" class="image__border">
</p>

## 2. Types of Query Class in QueryDSL

`QueryDSL`에서 쿼리 작성을 지원하는 클래스는 5가지 있습니다. 
각 클래스마다 다른 특징을 가지며 이번에 포스트에서 사용한 클래스는 `JPAQueryFactory` 입니다. 

* SQLQuery 클래스
    * 생성자로 매번 만들어 사용
    * Native Query 실행
    * DataSource 객체 사용
* SQLQueryFactory 클래스
    * 스레드 안전하므로 싱글톤 객체로 만들어 사용 가능
    * Native Query 실행
    * DataSource 객체 사용
* JPAQuery 클래스
    * 생성자로 매번 만들어 사용
    * JPQL(Java Persistence Query Langauge) 문법을 사용한 질의문 작성 및 실행
    * 엔티티 매니저 사용
* JPAQueryFactory 클래스
    * 스레드 안전하므로 싱글톤 객체로 만들어 사용 가능
    * JPQL 문법을 사용한 질의문 작성 및 실행
    * 엔티티 매니저 사용
* JPASQLQuery 클래스
    * 생성자로 매번 만들어 사용
    * Native Query 실행
    * 엔티티 매니저를 사용하지만, 1차 캐싱 기능은 사용 불가능

## 3. Example

간단하게 엔티티를 만들고 CRUD 기능을 실행시켜보겠습니다. 

### 2.1. DslEntity 클래스

```java
package action.in.blog.dsl;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class DslEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private long id;
    private String someValue;
    
    public DslEntity(String someValue) {
        this.someValue = someValue;
    }
}
```

### 2.2. DslStore 클래스

* 엔티티 매니저(EntityManager)를 생성자 주입(constructor injection)을 통해 전달 받습니다.
    * `@PersistenceContext`를 사용하는 것을 권장하지만, 특정 버전 이상부터는 동일한 프록시 객체를 주입하므로 동일합니다.
    * 참고 - [@PersistenceContext 애너테이션][entity-manager-with-persistence-context-annotation-link]
* 생성자를 통해 엔티티 매니저를 전달 받으면 `@DataJpaTest` 애너테이션을 사용한 테스트를 쉽게 풀어낼 수 있습니다. 
* 각 메소드들은 가장 단순한 CRUD 기능을 수행합니다.

```java
package action.in.blog.dsl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import java.util.List;

import static action.in.blog.dsl.QDslEntity.dslEntity;

@Repository
public class DslStore {

    private final EntityManager entityManager;
    private final JPAQueryFactory jpaQueryFactory;

    public DslStore(EntityManager entityManager) {
        this.entityManager = entityManager;
        this.jpaQueryFactory = new JPAQueryFactory(entityManager);
    }

    @Transactional
    public void createEntity(DslEntity entity) {
        entityManager.persist(entity);
    }

    public List<DslEntity> getEntityByContains(String value) {
        return jpaQueryFactory
                .selectFrom(dslEntity)
                .where(dslEntity.someValue.containsIgnoreCase(value))
                .fetch();
    }

    @Transactional
    public void updateEntity(DslEntity entity) {
        jpaQueryFactory
                .update(dslEntity)
                .set(dslEntity.someValue, entity.getSomeValue())
                .where(dslEntity.id.eq(entity.getId()))
                .execute();
    }

    @Transactional
    public void deleteEntity(long id) {
        jpaQueryFactory
                .delete(dslEntity)
                .where(dslEntity.id.eq(id))
                .execute();
    }
}
```

## 4. Tests

### 4.1. @DataJpaTest 애너테이션

테스트 코드 전에 `@DataJpaTest` 애너테이션을 먼저 살펴보겠습니다. 

* `@Transactional` 애너테이션이 함께 선언되어 있습니다.
    * 테스트가 종료되면 작업한 내용들에 대해 자동으로 롤백(rollback) 처리합니다.
* 기저에 깔린 `@Transactional` 애너테이션은 다음과 같은 관점에서 테스트를 어렵게 만듭니다.
    * 스토어(store) 객체를 `@Autowired` 애너테이션을 통해 빈으로 주입 받아 테스트 하는 경우라면 테스트에서 이미 시작된 트랜잭션이 스토어 객체까지 전파되어 외부 트랜잭션에서 확인할 수 있는 방법이 없습니다. 그렇기 때문에 검증(assert)하려면 스토어 객체를 사용해야 합니다.
    * 테스트 메소드에서 `@Transactional` 애너테이션의 전파 타입을 `NOT_SUPPORTED` 같은 것으로 오버라이딩(overriding)하면 테스트 전역에 쓰레기 데이터가 남기 때문에 다른 테스트의 정합성이 떨어집니다.
    * 엔티티 매니저의 1차 캐싱 기능 때문에 검증 또한 정확하지 않을 수 있습니다. 영속성 컨텍스트 캐시에 준비된 데이터가 나오는 경우엔 정확하게 쿼리가 수행되었는지 검증할 수 없습니다.

```java
package org.springframework.boot.test.autoconfigure.orm.jpa;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.test.autoconfigure.OverrideAutoConfiguration;
import org.springframework.boot.test.autoconfigure.core.AutoConfigureCache;
import org.springframework.boot.test.autoconfigure.filter.TypeExcludeFilters;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.properties.PropertyMapping;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.core.annotation.AliasFor;
import org.springframework.data.repository.config.BootstrapMode;
import org.springframework.test.context.BootstrapWith;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.transaction.annotation.Transactional;

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

### 4.2. 테스트 코드

위에서 설명한 문제점 때문에 엔티티 매니저의 동작을 테스트에서 제어할 필요가 있습니다. 

* 테스트 코드에서 트랜잭션의 시작, 롤백 등을 제어합니다. 
* 적절한 위치에서 플러시(flush)와 클리어(clear)를 호출하여 쿼리를 실행하고 영속성 컨텍스트 내부 캐시를 비웁니다. 

```java
package action.in.blog.dsl;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.EntityTransaction;
import javax.persistence.PersistenceUnit;
import java.util.List;
import java.util.function.Consumer;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@DataJpaTest
public class DslStoreIT {

    @PersistenceUnit
    EntityManagerFactory factory;

    void transaction(Consumer<EntityManager> consumer) {
        EntityManager em = factory.createEntityManager();
        EntityTransaction transaction = em.getTransaction();
        transaction.begin();
        try {
            consumer.accept(em);
        } catch (Exception ex) {
            throw ex;
        } finally {
            transaction.rollback();
            em.close();
        }
    }

    void flushAndClear(EntityManager em) {
        em.flush();
        em.clear();
    }

    @Test
    void createEntity() {
        transaction((em) -> {
            DslEntity dslEntity = new DslEntity("Hello World");


            DslStore sut = new DslStore(em);
            sut.createEntity(dslEntity);


            flushAndClear(em);
            DslEntity result = em.find(DslEntity.class, dslEntity.getId());
            assertThat(result.getSomeValue(), equalTo("Hello World"));
        });
    }

    @Test
    void getEntityByContains() {
        transaction((em) -> {
            DslEntity dslEntity = new DslEntity("Hello World");
            em.persist(dslEntity);
            flushAndClear(em);


            DslStore sut = new DslStore(em);
            List<DslEntity> result = sut.getEntityByContains("llo Wor");


            DslEntity firstItem = result.get(0);
            assertThat(result.size(), equalTo(1));
            assertThat(firstItem.getSomeValue(), equalTo("Hello World"));
        });
    }

    @Test
    void updateEntity() {
        transaction((em) -> {
            DslEntity dslEntity = new DslEntity("Hello World");
            em.persist(dslEntity);
            flushAndClear(em);


            DslStore sut = new DslStore(em);
            sut.updateEntity(new DslEntity(dslEntity.getId(), "Hello QueryDSL World"));


            flushAndClear(em);
            DslEntity result = em.find(DslEntity.class, dslEntity.getId());
            assertThat(result.getSomeValue(), equalTo("Hello QueryDSL World"));
        });
    }

    @Test
    void deleteEntity() {
        transaction((em) -> {
            DslEntity dslEntity = new DslEntity("Hello World");
            em.persist(dslEntity);
            flushAndClear(em);


            DslStore sut = new DslStore(em);
            sut.deleteEntity(dslEntity.getId());


            flushAndClear(em);
            DslEntity result = em.find(DslEntity.class, dslEntity.getId());
            assertThat(result == null, equalTo(true));
        });
    }
}
```

## CLOSING

`JPAQueryFactory` 클래스는 `insert` 쿼리를 지원하지 않습니다. 
`insert` 코드를 작성할 순 있지만, 테스트 코드를 실행하면 다음과 같은 에러를 만나게 됩니다. 
`insert` 기능을 사용하기 위해 다음과 같은 옵션이 있습니다.

* 간단한 방법으로 엔티티 매니저의 `persist` 메소드를 사용
* 동일한 문법 체계를 사용하고자 한다면 `SQLQueryFactory` 클래스를 사용

```
2022-12-27 21:56:55.341 ERROR 81152 --- [           main] o.h.hql.internal.ast.ErrorTracker        : line 2:1: unexpected token: dslEntity
2022-12-27 21:56:55.345 ERROR 81152 --- [           main] o.h.hql.internal.ast.ErrorTracker        : line 2:1: unexpected token: dslEntity

antlr.NoViableAltException: unexpected token: dslEntity
    at org.hibernate.hql.internal.antlr.HqlBaseParser.selectFrom(HqlBaseParser.java:1163) ~[hibernate-core-5.6.14.Final.jar:5.6.14.Final]
    at org.hibernate.hql.internal.antlr.HqlBaseParser.queryRule(HqlBaseParser.java:825) ~[hibernate-core-5.6.14.Final.jar:5.6.14.Final]
    at org.hibernate.hql.internal.antlr.HqlBaseParser.selectStatement(HqlBaseParser.java:336) ~[hibernate-core-5.6.14.Final.jar:5.6.14.Final]
    at org.hibernate.hql.internal.antlr.HqlBaseParser.insertStatement(HqlBaseParser.java:373) ~[hibernate-core-5.6.14.Final.jar:5.6.14.Final]
    at org.hibernate.hql.internal.antlr.HqlBaseParser.statement(HqlBaseParser.java:206) ~[hibernate-core-5.6.14.Final.jar:5.6.14.Final]
    at org.hibernate.hql.internal.ast.QueryTranslatorImpl.parse(QueryTranslatorImpl.java:294) ~[hibernate-core-5.6.14.Final.jar:5.6.14.Final]
    at org.hibernate.hql.internal.ast.QueryTranslatorImpl.doCompile(QueryTranslatorImpl.java:189) ~[hibernate-core-5.6.14.Final.jar:5.6.14.Final]
    at org.hibernate.hql.internal.ast.QueryTranslatorImpl.compile(QueryTranslatorImpl.java:144) ~[hibernate-core-5.6.14.Final.jar:5.6.14.Final]
    at org.hibernate.engine.query.spi.HQLQueryPlan.<init>(HQLQueryPlan.java:113) ~[hibernate-core-5.6.14.Final.jar:5.6.14.Final]
    at org.hibernate.engine.query.spi.HQLQueryPlan.<init>(HQLQueryPlan.java:73) ~[hibernate-core-5.6.14.Final.jar:5.6.14.Final]
    at org.hibernate.engine.query.spi.QueryPlanCache.getHQLQueryPlan(QueryPlanCache.java:162) ~[hibernate-core-5.6.14.Final.jar:5.6.14.Final]
    at org.hibernate.internal.AbstractSharedSessionContract.getQueryPlan(AbstractSharedSessionContract.java:636) ~[hibernate-core-5.6.14.Final.jar:5.6.14.Final]
    at org.hibernate.internal.AbstractSharedSessionContract.createQuery(AbstractSharedSessionContract.java:748) ~[hibernate-core-5.6.14.Final.jar:5.6.14.Final]
    at org.hibernate.internal.AbstractSharedSessionContract.createQuery(AbstractSharedSessionContract.java:114) ~[hibernate-core-5.6.14.Final.jar:5.6.14.Final]
    at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[na:na]
    at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62) ~[na:na]
    at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43) ~[na:na]
    at java.base/java.lang.reflect.Method.invoke(Method.java:566) ~[na:na]
    at org.springframework.orm.jpa.ExtendedEntityManagerCreator$ExtendedEntityManagerInvocationHandler.invoke(ExtendedEntityManagerCreator.java:362) ~[spring-orm-5.3.24.jar:5.3.24]
    at com.sun.proxy.$Proxy104.createQuery(Unknown Source) ~[na:na]
    at com.querydsl.jpa.impl.JPAInsertClause.execute(JPAInsertClause.java:79) ~[querydsl-jpa-5.0.0.jar:na]
    at action.in.blog.dsl.DslStore.createEntity(DslStore.java:29) ~[classes/:na]
    at action.in.blog.dsl.DslStoreIT.lambda$createEntity$0(DslStoreIT.java:48) ~[test-classes/:na]
    at action.in.blog.dsl.DslStoreIT.transaction(DslStoreIT.java:27) ~[test-classes/:na]
    at action.in.blog.dsl.DslStoreIT.createEntity(DslStoreIT.java:43) ~[test-classes/:na]
    ...
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-12-27-crud-with-jpa-query-factory>

#### REFERENCE

* <https://www.baeldung.com/intro-to-querydsl>
* <https://fordeveloper2.tistory.com/9310>
* <https://github.com/querydsl/querydsl/issues/3027>
* [서브쿼리 insert에 대한 처리][inflearn-query-dsl-insert-link]

[entity-manager-with-persistence-context-annotation-link]: https://junhyunny.github.io/spring-boot/jpa/entity-manager-with-persistence-context-annotation/

[inflearn-query-dsl-insert-link]: https://www.inflearn.com/questions/34751/%EC%84%9C%EB%B8%8C%EC%BF%BC%EB%A6%AC-insert%EC%97%90-%EB%8C%80%ED%95%9C-%EC%B2%98%EB%A6%AC