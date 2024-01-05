---
title: "Join Multiple Times with Same Entity in QueryDSL"
search: false
category:
  - java
  - jpa
  - query-dsl
last_modified_at: 2022-12-28T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [@PersistenceContext 애너테이션][entity-manager-with-persistence-context-annotation-link]
* [CRUD with JPAQueryFactory][crud-with-jpa-query-factory-link]

## 0. 들어가면서

엔티티(entity)는 여러 가지 역할을 할 수 있습니다. 
그에 따라 하나의 쿼리(query)에서 여러 번 조인(join)이 필요할 수 있습니다. 
이런 케이스를 `QueryDSL`를 통해 조인 쿼리로 작성하면 정상적인 결과를 얻지 못할 수 있습니다. 
실제 프로젝트의 비즈니스 케이스를 다룰 수는 없으니 간단한 예시를 통해 문제 현상과 해결 방법을 알아보겠습니다. 

## 1. Context

다음과 같은 상황을 구상해봤습니다.

* 회사 간의 거래(trade)를 중개하는 시스템이 있습니다. 
* 회사는 거래에서 제공자(provider)이거나 소비자(consumer)일 수 있습니다.
* 시스템은 회사를 구분하는 방법으로 사업자 번호 이 외에 제공자 ID, 소비자 ID를 별도로 만들어 관리합니다. 
* 시스템을 통해 거래 정보를 조회할 때 관련된 회사 정보를 함께 보고자 합니다. 

## 2. 문제 현상

문제가 되는 코드를 살펴보고 실행되는 쿼리를 살펴보겠습니다.

### 2.1. 문제 코드

* 거래 정보를 조회합니다.
* 제공자 ID, 소비자 ID를 이용해 거래와 제공자, 소비자 사이의 `LEFT OUTER JOIN`을 수행합니다.
* 회사 엔티티에서 필요한 정보를 함께 조회합니다.

```java
package action.in.blog.join;

import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import org.springframework.stereotype.Repository;

import javax.persistence.EntityManager;
import java.util.List;

@Repository
public class TradeStore {

    private final JPAQueryFactory jpaQueryFactory;

    public TradeStore(EntityManager entityManager) {
        this.jpaQueryFactory = new JPAQueryFactory(entityManager);
    }

    public List<TradeVO> getTradeInformation() {
        QTradeEntity trade = QTradeEntity.tradeEntity;
        QCompanyEntity provider = QCompanyEntity.companyEntity;
        QCompanyEntity consumer = QCompanyEntity.companyEntity;
        return jpaQueryFactory
                .select(
                        Projections.fields(
                                TradeVO.class,
                                trade.id,
                                trade.providerId,
                                provider.name.as("providerName"),
                                trade.consumerId,
                                consumer.name.as("consumerName"),
                                trade.basedPrice,
                                trade.contractSize
                        )
                )
                .from(trade)
                .leftJoin(provider).on(trade.providerId.eq(provider.providerId))
                .leftJoin(consumer).on(trade.consumerId.eq(consumer.consumerId))
                .fetch();
    }
}
```

##### 실행 결과

* 제공자에 대한 `LEFT OUTER JOIN`은 실행되었습니다.
* 소비자에 대한 `LEFT OUTER JOIN`은 실행되지 않았습니다.

```sql
select tradeentit0_.id            as col_0_0_,
       tradeentit0_.provider_id   as col_1_0_,
       companyent1_.name          as col_2_0_,
       tradeentit0_.consumer_id   as col_3_0_,
       companyent1_.name          as col_4_0_,
       tradeentit0_.based_price   as col_5_0_,
       tradeentit0_.contract_size as col_6_0_
from trade_entity tradeentit0_
         left outer join company_entity companyent1_ on (tradeentit0_.provider_id = companyent1_.provider_id)
```

## 3. 문제 해결

같은 엔티티를 하나의 질의문에서 여러 번 조인하는 경우 각 엔티티를 다른 객체로 구분해줘야 합니다. 
기본 엔티티를 같이 사용하는 경우 동일한 객체로 판단되어 정상적인 쿼리가 수행되지 않습니다. 

### 3.1. 문제 해결 코드

* 제공자 객체와 소비자 객체에 대한 식별자를 각자 지정해주어 구분합니다.
* 제공자, 소비자 객체를 사용해 조인 쿼리를 수행합니다.

```java
package action.in.blog.join;

import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import org.springframework.stereotype.Repository;

import javax.persistence.EntityManager;
import java.util.List;

@Repository
public class TradeStore {

    private final JPAQueryFactory jpaQueryFactory;

    public TradeStore(EntityManager entityManager) {
        this.jpaQueryFactory = new JPAQueryFactory(entityManager);
    }

    public List<TradeVO> getTradeInformation() {
        QTradeEntity trade = QTradeEntity.tradeEntity;
        QCompanyEntity provider = new QCompanyEntity("provider");
        QCompanyEntity consumer = new QCompanyEntity("consumer");
        return jpaQueryFactory
                .select(
                        Projections.fields(
                                TradeVO.class,
                                trade.id,
                                trade.providerId,
                                provider.name.as("providerName"),
                                trade.consumerId,
                                consumer.name.as("consumerName"),
                                trade.basedPrice,
                                trade.contractSize
                        )
                )
                .from(trade)
                .leftJoin(provider).on(trade.providerId.eq(provider.providerId))
                .leftJoin(consumer).on(trade.consumerId.eq(consumer.consumerId))
                .fetch();
    }
}
```

##### 실행 결과

* 제공자와 소비자에 대한 `LEFT OUTER JOIN`이 각각 실행되었습니다.

```sql
select tradeentit0_.id            as col_0_0_,
       tradeentit0_.provider_id   as col_1_0_,
       companyent1_.name          as col_2_0_,
       tradeentit0_.consumer_id   as col_3_0_,
       companyent2_.name          as col_4_0_,
       tradeentit0_.based_price   as col_5_0_,
       tradeentit0_.contract_size as col_6_0_
from trade_entity tradeentit0_
         left outer join company_entity companyent1_ on (tradeentit0_.provider_id = companyent1_.provider_id)
         left outer join company_entity companyent2_ on (tradeentit0_.consumer_id = companyent2_.consumer_id)
```

### 3.2. 테스트 코드

```java
package action.in.blog.join;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.EntityTransaction;
import javax.persistence.PersistenceUnit;
import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@DataJpaTest
public class TradeStoreIT {

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
    void getTradeInformation() {
        transaction(em -> {
            em.persist(
                    CompanyEntity.builder()
                            .bizRegistrationNumber(UUID.randomUUID().toString())
                            .name("(주) Alpha Company")
                            .providerId("0001")
                            .consumerId("5001")
                            .build()
            );
            em.persist(
                    CompanyEntity.builder()
                            .bizRegistrationNumber(UUID.randomUUID().toString())
                            .name("(주) Beta Company")
                            .providerId("0002")
                            .consumerId("5002")
                            .build()
            );
            em.persist(
                    TradeEntity.builder()
                            .providerId("0001")
                            .consumerId("5002")
                            .basedPrice(2500)
                            .contractSize(5)
                            .build()
            );
            flushAndClear(em);


            TradeStore sut = new TradeStore(em);
            List<TradeVO> result = sut.getTradeInformation();


            assertThat(result.size(), equalTo(1));
            TradeVO firstTrade = result.get(0);
            assertThat(firstTrade.getProviderId(), equalTo("0001"));
            assertThat(firstTrade.getProviderName(), equalTo("(주) Alpha Company"));
            assertThat(firstTrade.getConsumerId(), equalTo("5002"));
            assertThat(firstTrade.getConsumerName(), equalTo("(주) Beta Company"));
            assertThat(firstTrade.getBasedPrice(), equalTo(2500));
            assertThat(firstTrade.getContractSize(), equalTo(5));
        });
    }
}
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-12-28-join-multiple-times-with-same-entity-in-query-dsl>

#### REFERENCE

* <https://stackoverflow.com/questions/28331489/querydsl-join-on-same-table-multiple-times>

[entity-manager-with-persistence-context-annotation-link]: https://junhyunny.github.io/spring-boot/jpa/entity-manager-with-persistence-context-annotation/
[crud-with-jpa-query-factory-link]: https://junhyunny.github.io/java/jpa/query-dsl/crud-with-jpa-query-factory/