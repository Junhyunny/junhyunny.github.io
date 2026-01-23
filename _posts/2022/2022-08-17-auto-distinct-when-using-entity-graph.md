---
title: "Auto distinct when using @EntityGraph"
search: false
category:
  - javascript
last_modified_at: 2022-08-17T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [SQL JOIN][sql-join-link]
* [JPA N+1 Problem][jpa-one-plus-n-problem-link]

## 0. 들어가면서

[JPA N+1 Problem][jpa-one-plus-n-problem-link]와 관련된 포스트를 작성할 때 `@EntityGraph` 애너테이션을 사용하면 추가적인 처리 없이도 자동적으로 중복된 엔티티(entity)들이 제거되는 현상을 발견했습니다. 
당시에 이 현상에 대해 궁금하여 `GitHub`와 `StackOverflow`에 문의를 남겼었는데, 최근 `StackOverflow`를 통해 얻은 답변을 이번 포스트를 통해 공유하겠습니다. 

##### GitHub 이슈

* [Why does not @EntityGraph annotation in JPA need to use "distinct" keyword or "Set" data structure?][github-issue-link]

##### StackOverflow 질문

* [Why does not @EntityGraph annotation in JPA need to use "distinct" keyword or "Set" data structure?][stack-overflow-question-link]

## 1. 중복 제거 현상

`StackOverflow`의 답변을 보기 전에 `@EntityGraph` 애너테이션 사용 시 중복이 제거되는 현상에 대해 자세히 짚고 넘어가겠습니다. 

### 1.1. 1-N 관계 시 데이터 중복 현상

다음과 같은 데이터가 존재한다고 가정하겠습니다. 

##### Post 테이블

| post.id | post.content | post.title |
|---|---|---|
| 1 | this is the first post. | first post |

##### Reply 테이블

| reply.id | reply.content | reply.post_id |
|---|---|---|
| 1 | first-reply-1 | 1 |
| 2 | first-reply-2 | 1 |
| 3 | first-reply-3 | 1 |
| 4 | first-reply-4 | 1 |
| 5 | first-reply-5 | 1 |
| 6 | first-reply-6 | 1 |
| 7 | first-reply-7 | 1 |
| 8 | first-reply-8 | 1 |
| 9 | first-reply-9 | 1 |
| 10 | first-reply-10 | 1 |

#### 1.1.1. 쿼리 수행 결과

Post 테이블과 Reply 테이블은 1-N 관계이며 아래의 쿼리를 수행하면 다음과 같은 결과를 얻을 수 있습니다.

##### Inner Join 쿼리와 수행 결과

* Post 테이블을 기준으로 Reply 테이블을 조인(join)하여 쿼리를 수행합니다.
* Reply 테이블로부터 얻은 데이터는 모두 다르지만, Post 테이블로부터 얻는 데이터는 모두 중복됩니다. 
* Post 테이블의 아이디가 `1`인 데이터를 기준으로 10건의 데이터가 조회됩니다. 

```sql
select *
from test.post inner join test.reply on test.post.id = test.reply.post_id;
```

| post.id | post.content | post.title | reply.id | reply.content | reply.post_id |
|---|---|---|---|---|---|
| 1 | this is the first post. | first post | 1 | first-reply-1 | 1 |
| 1 | this is the first post. | first post | 2 | first-reply-2 | 1 |
| 1 | this is the first post. | first post | 3 | first-reply-3 | 1 |
| 1 | this is the first post. | first post | 4 | first-reply-4 | 1 |
| 1 | this is the first post. | first post | 5 | first-reply-5 | 1 |
| 1 | this is the first post. | first post | 6 | first-reply-6 | 1 |
| 1 | this is the first post. | first post | 7 | first-reply-7 | 1 |
| 1 | this is the first post. | first post | 8 | first-reply-8 | 1 |
| 1 | this is the first post. | first post | 9 | first-reply-9 | 1 |
| 1 | this is the first post. | first post | 10 | first-reply-10 | 1 |

### 1.2. JPA JOIN FETCH 쿼리

이런 현상은 `JPA`를 사용하더라도 똑같이 발생합니다. 
`JPA`에서 발생하는 N+1 문제를 해결하기 위해 사용하는 `JOIN FETCH` 쿼리를 수행하면 다음과 같은 결과를 얻습니다. 

#### 1.2.1. FETCH JOIN 코드 수행 시 SQL 로그

다음 코드를 수행하면, 코드 아래와 같은 쿼리가 수행됩니다. 

* Post 엔티티를 기준으로 `FETCH JOIN` 쿼리를 수행합니다.

```java
    @Query(value = "SELECT p FROM Post p JOIN FETCH p.replies WHERE p.title = :title")
    List<Post> findByTitleFetchJoinWithoutDistinct(String title);
```

* Post 테이블을 기준으로 `INNER JOIN` 쿼리를 수행합니다.

```sql
select post0_.id         as id1_0_0_,
       replies1_.id      as id1_1_1_,
       post0_.content    as content2_0_0_,
       post0_.title      as title3_0_0_,
       replies1_.content as content2_1_1_,
       replies1_.post_id as post_id3_1_1_,
       replies1_.post_id as post_id3_1_0__,
       replies1_.id      as id1_1_0__
from post post0_
         inner join reply replies1_ on post0_.id = replies1_.post_id
where post0_.title = ?
```

#### 1.2.2. 디버깅 화면

위 메서드를 수행하여 얻은 결과를 디버깅 모드로 살펴보면 다음과 같습니다. 

* Post 테이블과 Reply 테이블이 조인하면서 동일한 Post 엔티티 객체가 리스트에 10개 저장됩니다.

<p align="left">
    <img src="/images/auto-distinct-when-using-entity-graph-1.JPG" width="80%" class="image__border">
</p>

#### 1.2.3. 해결 방법

위와 같은 현상을 방지하기 위한 두 가지 방법이 있습니다.

##### DISTINCT 키워드 사용

* JPQL(Java Persistence Query Language) 쿼리에 DISTINCT 키워드 추가하여 중복된 결과를 제거합니다.

```java
    @Query(value = "SELECT DISTINCT p FROM Post p JOIN FETCH p.replies WHERE p.title = :title")
    List<Post> findDistinctByTitleFetchJoin(String title);
```

##### Set 자료구조 사용

* 중복되는 객체가 담기지 않도록 결과 값에 `Set` 자료구조를 사용합니다.

```java
    @Query(value = "SELECT p FROM Post p JOIN FETCH p.replies WHERE p.title = :title")
    Set<Post> findByTitleFetchJoin(String title);
```

### 1.3. JPA @EntityGraph 애너테이션

이번엔 N+1 문제의 또 다른 해결책인 `@EntityGraph` 애너테이션을 살펴보겠습니다. 

#### 1.3.1. @EntityGraph 애너테이션 코드 수행 시 SQL 로그

다음 코드를 수행하면, 코드 아래와 같은 쿼리가 수행됩니다. 

* `@EntityGraph` 애너테이션의 `attributePaths` 속성을 통해 Post 엔티티와 함께 조회할 필드를 지정합니다.

```java
    @EntityGraph(attributePaths = {"replies"})
    @Query(value = "SELECT p FROM Post p WHERE p.title = :title")
    List<Post> findByTitleEntityGraphWithoutDistinct(String title);
```

* Post 테이블을 기준으로 `LEFT OUTER JOIN` 쿼리를 수행합니다.

```sql
select post0_.id         as id1_0_0_,
       replies1_.id      as id1_1_1_,
       post0_.content    as content2_0_0_,
       post0_.title      as title3_0_0_,
       replies1_.content as content2_1_1_,
       replies1_.post_id as post_id3_1_1_,
       replies1_.post_id as post_id3_1_0__,
       replies1_.id      as id1_1_0__
from post post0_
         left outer join reply replies1_ on post0_.id = replies1_.post_id
where post0_.title = ?
```

#### 1.2.2. 디버깅 화면

위 메서드를 수행하여 얻은 결과를 디버깅 모드로 살펴보면 다음과 같습니다. 

* `LEFT OUTER JOIN`을 수행하였고, 별도의 중복 처리를 하지 않았음에도 Post 엔티티 객체가 리스트에 1개 저장됩니다.
    * 중복 제거를 위한 `DISTINCT` 키워드 혹은 `Set` 자료구조 미사용

<p align="left">
    <img src="/images/auto-distinct-when-using-entity-graph-2.JPG" width="80%" class="image__border">
</p>

## 2. StackOverflow 답변

`@EntityGraph` 사용 시 중복 객체들이 제거되는 현상의 원인이 궁금하여 `StackOverflow`에 질문을 올리고 약 7개월만에 답변을 얻었습니다. 
영원히 묻힐뻔한 질문이었지만, 저와 동일한 의문을 가진 사용자가 대신 바운티(bounty)를 걸어주셨습니다. 
바운티가 걸리니 2일만에 답변을 달렸습니다. 

#### 2.1. 답변 살펴보기

* 엔티티 그래프는 하이버네이트(hibernate) 프레임워크 내부에서 기본적으로 중복 처리를 수행합니다.
* 5.2.10 version [HHH-11569][hibernate-release-link]에서 추가되었습니다.
* HQL(Hibernate Query Language)나 JPQL 사용 시 `PASS_DISTINCT_THROUGH` 힌트를 사용하면 동일한 효과를 얻을 수 있습니다.

<p align="center">
    <img src="/images/auto-distinct-when-using-entity-graph-3.JPG" width="80%" class="image__border">
</p>

#### 2.2. 코드 살펴보기

실제 코드를 살펴봤습니다.

* `QueryTranslatorImpl` 클래스의 `list` 메서드에서 엔티티 중복이 제거됩니다.
* `getEntityGraphQueryHint` 메서드 수행 시 결과가 `null`이 아닌 경우 중복을 제거합니다.
    * `hasLimit` 값이나 `query.getSelectClause().isDistinct()` 메서드 수행 결과와 상관 없이 중복이 제거됩니다. 
* `IdentitySet` 클래스를 통해 중복을 제거합니다.

```java
package org.hibernate.hql.internal.ast;

// ... import dependencies

public class QueryTranslatorImpl implements FilterTranslator {

    // ...

    public List list(SharedSessionContractImplementor session, QueryParameters queryParameters) throws HibernateException {
            
        // ...

        final boolean needsDistincting = (
                query.getSelectClause().isDistinct() ||
                getEntityGraphQueryHint() != null ||  //In case query has Entity Graph HINT applies distincting of result records
                hasLimit )
        && containsCollectionFetches();
        
        // ...
            
        List results = queryLoader.list( session, queryParametersToUse );

        if ( needsDistincting ) {
            int includedCount = -1;
            // NOTE : firstRow is zero-based
            int first = !hasLimit || queryParameters.getRowSelection().getFirstRow() == null
                        ? 0
                        : queryParameters.getRowSelection().getFirstRow();
            int max = !hasLimit || queryParameters.getRowSelection().getMaxRows() == null
                        ? -1
                        : queryParameters.getRowSelection().getMaxRows();
            List tmp = new ArrayList();
            IdentitySet distinction = new IdentitySet();
            for ( final Object result : results ) {
                if ( !distinction.add( result ) ) {
                    continue;
                }
                includedCount++;
                if ( includedCount < first ) {
                    continue;
                }
                tmp.add( result );
                // NOTE : ( max - 1 ) because first is zero-based while max is not...
                if ( max >= 0 && ( includedCount - first ) >= ( max - 1 ) ) {
                    break;
                }
            }
            results = tmp;
        }

        return results;
    }
}
```

##### 디버깅 모드

해당 코드 위치를 디버깅 모드로 살펴보았습니다. 

* 아래 그림은 `getEntityGraphQueryHint` 메서드 수행 결과입니다.
* `@EntityGraph` 애너테이션을 사용하면 `"javax.persistence.fetchgraph"`라는 힌트가 적용되면서 `EntityGraphQueryHint` 객체를 생성합니다.
    * 디버깅 추적을 통해 확인한 힌트 생성과 연관된 클래스들은 다음과 같습니다. 
    * org.hibernate.query.internal.AbstractProducedQuery
    * org.hibernate.engine.query.spi.EntityGraphQueryHint
    * org.hibernate.hql.internal.ast.QueryTranslatorImpl

<p align="left">
    <img src="/images/auto-distinct-when-using-entity-graph-4.JPG" width="50%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-01-15-jpa-one-plus-n-problem>

#### REFERENCE

* <https://stackoverflow.com/questions/70988649/why-does-not-entitygraph-annotation-in-jpa-need-to-use-distinct-keyword-or-s/73348400#73348400>
* <https://vladmihalcea.com/jpql-distinct-jpa-hibernate/>

[sql-join-link]: https://junhyunny.github.io/information/sql-join/
[jpa-one-plus-n-problem-link]: https://junhyunny.github.io/spring-boot/jpa/jpa-one-plus-n-problem/

[github-issue-link]: https://github.com/spring-projects/spring-data-jpa/issues/2430
[stack-overflow-question-link]: https://stackoverflow.com/questions/70988649/why-does-not-entitygraph-annotation-in-jpa-need-to-use-distinct-keyword-or-s
[hibernate-release-link]: https://hibernate.atlassian.net/browse/HHH-11569?page=com.atlassian.jira.plugin.system.issuetabpanels%3Aworklog-tabpanel