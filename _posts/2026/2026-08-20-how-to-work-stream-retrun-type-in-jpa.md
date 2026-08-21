---
title: "JPA Stream 리턴 타입은 어떻게 동작하는가?"
search: false
category:
  - spring
  - spring-data-jpa
  - postgres
  - database
  - stream
last_modified_at: 2026-08-21T01:04:53+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [대용량 CSV 다운로드 스트리밍(streaming) 처리를 통해 개선하기][csv-download-with-streaming-link]

## 0. 들어가면서

[이전 글][csv-download-with-streaming-link]을 정리할 때 JPA의 Stream 리턴 타입이 어떻게 동작하는지 잘 이해되지 않았다. JPA 인터페이스 내부에 어떤 로직이 숨어 있는지 정리해 봤다. PostgreSQL 데이터베이스를 사용했다. JDBC 구현체가 다르기 때문에 다른 데이터베이스는 이 글에서 설명하는 것과 다르게 동작할 수 있다.

## 1. Stream 리턴 타입

다음과 같이 Stream 타입을 반환하는 메서드를 JPA 리포지토리에 선언할 수 있다.

```java
public interface TodoRepository extends JpaRepository<TodoEntity, Long> {

    @Query("SELECT todo FROM TodoEntity todo")
    @QueryHints(
            value = @QueryHint(name = HibernateHints.HINT_FETCH_SIZE, value = "10")
    )
    Stream<TodoEntity> streamAll();
}
```

JPA `Stream<T>` 반환 타입 메서드는 대량 조회 결과를 한 번에 `List`로 메모리에 적재하지 않고 순차적으로 처리하고 싶을 때 사용한다. 간단한 사용 예시를 살펴보자.

```java
List<TodoEntity> todos = query.getResultList();
```

위 메서드는 데이터베이스에서 100만 건을 읽으면 애플리케이션 메모리에 100만 건의 데이터를 모두 올려야 한다. 그만큼 한 번에 많은 메모리를 사용하게 된다. Stream 반환 타입을 사용하면 스트리밍(streaming) 기능을 이용해 결과를 점진적으로 처리할 수 있다. 예를 들어 아래 코드처럼 조회한 Stream 객체의 `forEach` 메서드를 통해 필요한 순간에 데이터를 한 건씩 소비할 수 있다. `forEach` 메서드 내부의 소비자(consumer) 함수가 실행될 때 미리 적재된 데이터가 있으면 이를 소비하고, 없으면 지정한 `fetch_size`만큼 데이터를 조회해 메모리에 적재한다.

```java
try (Stream<TodoEntity> todos = todoRepository.streamAll()) {
    todos.forEach(todo -> System.out.println(todo.getTitle()));
}
```

위 코드는 아래 SQL 구문을 자바 애플리케이션에 맞게 추상화한 로직이라고 볼 수 있다.

```sql
DECLARE todo_cursor CURSOR FOR
SELECT *
FROM todo;

FETCH FORWARD 10 FROM todo_cursor;

-- consume...

FETCH FORWARD 10 FROM todo_cursor;

-- consume...

FETCH FORWARD 10 FROM todo_cursor;

-- consume...

CLOSE todo_cursor;
```

자바 8의 Stream 인터페이스에 맞춰 JPA 2.2부터 `Stream getResultStream()` 메서드가 표준 API로 추가됐다. 이에 맞춰 Spring Data JPA도 리포지토리에서 Stream 반환 타입을 지원하게 됐다. [공식 문서](https://docs.spring.io/spring-data/data-jpa/reference/4.0/repositories/query-methods-details.html#repositories.query-streaming)에는 Stream 객체가 내부적으로 특정 데이터 저장소의 리소스를 감싸고 있을 수 있으므로 사용 후 반드시 닫아야 한다는 주의 사항이 명시되어 있다. `close()` 메서드를 직접 호출해 Stream 객체를 닫을 수도 있지만, try-with-resources 구문을 사용하면 스트림을 자동으로 닫을 수 있다.

## 2. Stream 리턴 타입 동작 과정

처음 Stream 반환 타입 메서드를 봤을 때 SELECT 쿼리를 10개씩 여러 번 실행할 것이라고 예상했다. SQL 구문으로 표현하면 다음과 같이 동작할 것이라고 생각했다.

```sql
SELECT * FROM todo LIMIT 10 OFFSET 0;
SELECT * FROM todo LIMIT 10 OFFSET 10;
SELECT * FROM todo LIMIT 10 OFFSET 20;
...
```

실제로는 위 SQL 구문처럼 동작하지 않는다. 앞서 살펴봤듯이 Stream 방식은 내부적으로 커서(cursor)를 사용해 데이터를 조회(fetch)하는 방식과 같다. 하이버네이트(Hibernate)와 JDBC 드라이버를 통해 위에서 살펴본 SQL 구문처럼 커서로 데이터를 가져오는 과정을 추상화한 것이다. 일반적인 조회 방법과 다르기 때문에 트랜잭션, JDBC Connection, ResultSet, 영속성 컨텍스트 같은 개념까지 함께 이해하고 사용해야 한다.

이해하기 쉽게 앞서 살펴본 SQL 구문을 다시 가져와 보자. 다음과 같은 과정을 수행한다.

1. 트랜잭션을 시작한다.
2. 커서를 만든다.
3. 커서를 사용해 필요한 데이터를 가져온다(fetch).
4. 모두 사용한 커서는 닫는다(close).
5. 트랜잭션을 종료한다.

```sql
BEGIN;

DECLARE todo_cursor CURSOR FOR
SELECT *
FROM todo;

FETCH FORWARD 10 FROM todo_cursor;
FETCH FORWARD 10 FROM todo_cursor;
FETCH FORWARD 10 FROM todo_cursor;

CLOSE todo_cursor;

COMMIT;
```

하나씩 뜯어서 살펴보자. 먼저 트랜잭션을 시작하는 부분이 있다.

```sql
BEGIN;

...

COMMIT;
```

이 부분을 자바 애플리케이션에서 추상화한 코드가 `@Transactional` 애너테이션이다.

```java
@Transactional(readOnly = true)
void streamAllReturnsEveryTodo() {
  ...
}
```

Stream 객체를 만들고 소비하는 전 과정이 트랜잭션 경계 내부에 있어야 한다. 데이터를 조회할 수 있는 Stream 객체를 먼저 만들어 두고 나중에 소비(lazy consuming)하기 때문이다. `List` 같은 일반적인 컬렉션을 사용하는 경우에는 DB 조회가 끝나면 결과가 이미 메모리에 로딩되어 있다.

```
Transaction
 ├─ SQL 실행
 ├─ ResultSet 읽기
 ├─ User 객체 생성
 └─ List 반환
Transaction 종료

이후 List 사용
```

반면 Stream 방식은 데이터를 조회할 수 있는 Stream 객체를 먼저 만들어 두고, 나중에 데이터를 소비하다가 필요하면 추가로 조회(fetch)한다. 아래 코드의 `forEach` 메서드는 미리 불러온 `TodoEntity` 객체를 콜백 함수의 매개변수로 전달한다. 불러온 데이터를 모두 소비하면 내부적으로 다음 데이터를 조회해 같은 방식으로 전달한다.

```java
try (Stream<TodoEntity> todos = todoRepository.streamAll()) {
    todos.forEach(todo -> System.out.println(todo.getTitle()));
}
```

Stream 객체를 사용하는 동안 내부적으로 JDBC ResultSet, Statement, Connection, JPA EntityManager, Hibernate Session 객체가 모두 살아 있어야 한다.

- Stream 객체 내부에 담긴 Entity 객체는 영속성 컨텍스트(persistence context)에 연결되어 있다. Stream 객체가 소비되는 동안 영속성 컨텍스트가 유지되어야 한다.
- Entity 객체에 지연 로딩(lazy loading)이 필요한 멤버 필드가 있다면 하이버네이트가 추가 SQL을 실행해야 한다.

그렇기 때문에 일반적으로 Stream 소비 구간 전체를 트랜잭션으로 감싸야 한다.

```java
@Transactional(readOnly = true)
void streamAllReturnsEveryTodo() {
    try (Stream<TodoEntity> todos = todoRepository.streamAll()) {
        todos.forEach(todo -> System.out.println(todo.getTitle()));
    }
}
```

Stream 객체가 트랜잭션 경계 내부에서 사용되지 않는다면 다음과 같은 오류 메시지를 만나게 된다.

```
org.springframework.dao.InvalidDataAccessApiUsageException: You're trying to execute a streaming query method without a surrounding transaction that keeps the connection open so that the Stream can actually be consumed; Make sure the code consuming the stream uses @Transactional or any other way of declaring a (read-only) transaction
	at org.springframework.data.jpa.repository.query.JpaQueryExecution$StreamExecution.doExecute(JpaQueryExecution.java:521) ~[spring-data-jpa-4.1.0.jar:4.1.0]
	at org.springframework.data.jpa.repository.query.JpaQueryExecution.execute(JpaQueryExecution.java:100) ~[spring-data-jpa-4.1.0.jar:4.1.0]
	at org.springframework.data.jpa.repository.query.AbstractJpaQuery.doExecute(AbstractJpaQuery.java:166) ~[spring-data-jpa-4.1.0.jar:4.1.0]
	at org.springframework.data.jpa.repository.query.AbstractJpaQuery.execute(AbstractJpaQuery.java:156) ~[spring-data-jpa-4.1.0.jar:4.1.0]
	at org.springframework.data.repository.core.support.RepositoryMethodInvoker.doInvoke(RepositoryMethodInvoker.java:169) ~[spring-data-commons-4.1.0.jar:4.1.0]
	at org.springframework.data.repository.core.support.RepositoryMethodInvoker.invoke(RepositoryMethodInvoker.java:158) ~[spring-data-commons-4.1.0.jar:4.1.0]
	at org.springframework.data.repository.core.support.QueryExecutorMethodInterceptor.doInvoke(QueryExecutorMethodInterceptor.java:167) ~[spring-data-commons-4.1.0.jar:4.1.0]
...
```

다음은 커서를 만들고 닫는 과정을 살펴보자.

```sql
DECLARE todo_cursor CURSOR FOR
SELECT *
FROM todo;

-- ...

CLOSE todo_cursor;
```

커서를 만드는 과정은 자바 애플리케이션에서 Stream 객체를 만드는 과정에 대응한다.

```java
Stream<TodoEntity> todos = todoRepository.streamAll()
```

이렇게 생성한 Stream 객체는 SQL 커서처럼 모두 사용한 후 정리해야 한다. 앞서 설명한 것처럼 Stream 객체는 특정 저장소의 리소스를 감싸고 있기 때문에 사용 후 반드시 닫아야 한다. `close()` 메서드를 직접 호출할 수도 있지만, try-with-resources 구문을 사용하면 해당 코드 블록이 닫힐 때 스트림을 자동으로 정리하므로 `close()` 메서드 호출이 누락되는 것을 막을 수 있다.

```java
try (Stream<TodoEntity> todos = todoRepository.streamAll()) {
    // Stream 객체 소비
}
```

마지막으로 필요한 시점에 지정한 `fetch_size`만큼 데이터를 조회하는 로직이 필요하다. Stream 객체의 `forEach` 메서드로 데이터를 소비할 때 메모리에 적재된 데이터를 모두 사용한 뒤 어떻게 데이터를 다시 조회하는지 궁금했다.

```sql
FETCH FORWARD 10 FROM todo_cursor;
FETCH FORWARD 10 FROM todo_cursor;
FETCH FORWARD 10 FROM todo_cursor;
```

이를 이해하려면 Stream 객체를 만드는 과정부터 살펴봐야 한다. Stream 객체는 내부적으로 데이터를 공급하는 Iterator 인스턴스에 의존한다. Iterator 인스턴스의 `hasNext()` 메서드는 다음에 소비할 객체가 있는지 확인하고, `next()` 메서드는 필요한 데이터를 가져와 소비한다.

```java
package java.util;

import java.util.function.Consumer;

public interface Iterator<E> {

    default void forEachRemaining(Consumer<? super E> action) {
        Objects.requireNonNull(action);
        while (hasNext())
            action.accept(next());
    }
}
```

JPA 리포지토리가 반환하는 Stream 객체가 의존하는 Iterator 인스턴스는 ScrollableResultsIterator 객체이다. JPA 구현체인 하이버네이트는 SqmQueryImpl 객체의 `getResultStream()` 메서드를 통해 ScrollableResultsIterator 객체가 주입된 Stream 객체를 만든다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/how-to-work-stream-retrun-type-in-jpa-01.png" width="100%" class="image__border">
</div>

<br/>

ScrollableResultsIterator 객체는 ScrollableResultsImpl 객체에 의존하고, ScrollableResultsImpl 객체는 RowProcessingStateStandardImpl 객체에 의존한다. 이 의존 관계 체인을 따라 계속 들어가다 보면 JDBC 레벨까지 도달한다. 스레드 호출 스택을 보면 java.util 패키지에서 org.postgresql.jdbc 패키지까지 도달하게 된다.

- PgResultSet 객체 (PostgreSQL 패키지)
- HikariProxyResultSet 객체 (Hikari 패키지)
- JdbcValuesResultSetImpl 객체 (Hibernate 패키지)
- RowProcessingStateStandardImpl 객체 (Hibernate 패키지)
- ScrollableResultsIterator 객체 (Hibernate 패키지)

<div align="left">
  <img src="{{ site.image_url_2026 }}/how-to-work-stream-retrun-type-in-jpa-02.png" width="75%" class="image__border">
</div>

<br/>

Iterator 인스턴스가 `hasNext()` 메서드를 통해 다음 아이템이 있는지 확인하는 과정에서 PgResultSet 객체의 `next()` 메서드가 호출된다. `next()` 메서드 내부에서 다음에 사용할 데이터의 위치가 미리 조회해 놓은 데이터 리스트의 크기를 넘으면 QueryExecutorImpl 객체의 `fetch` 메서드를 호출한다. 이 시점에 지정한 `fetch_size`만큼 데이터를 다시 조회한다.

PgResultSet 객체의 `next()` 메서드에서 중요한 부분만 살펴보자. 코드에 대한 설명은 가독성을 위해 주석으로 적어 두었다.

```java
package org.postgresql.jdbc;

public class PgResultSet implements ResultSet, PGRefCursorResultSet {

  @Override
  public boolean next() throws SQLException {
    
    // 1. 다음 읽을 데이터의 위치가 현재 메모리에 적재된 데이터 리스트(rows)의 사이즈가 큰 경우
    if (currentRow + 1 >= rows.size()) {
      ResultCursor cursor = this.cursor;
      ...
      // 2. offset 재조정
      rowOffset += rows.size();
      // 3. fetchSize 지정
      int fetchRows = fetchSize;
      ... 
      // 4. fetch 메서드를 통해 재조회
      connection.getQueryExecutor().fetch(cursor, new CursorResultHandler(), fetchRows, adaptiveFetch);
      // 5. 커서 종료
      closeRefCursor();
      ...
    } else {
      currentRow++;
    }
    ...
    return true;
  }
}
```

앞서 설명한 것처럼 Stream 객체를 소비하면 ScrollableResultsIterator에서 JDBC 레이어까지 호출이 이어진다. JDBC 레이어에서는 PgResultSet과 QueryExecutorImpl이 협력해 필요한 시점마다 지정한 크기만큼 데이터를 조회한다. 이 과정을 시퀀스 다이어그램으로 살펴보면 이해하기 쉽다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/how-to-work-stream-retrun-type-in-jpa-03.png" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-08-21-how-to-work-stream-retrun-type-in-jpa>

#### REFERENCE

- <https://docs.spring.io/spring-data/jpa/reference/repositories/query-return-types-reference.html#repository-query-return-types-stream>
- <https://docs.spring.io/spring-data/data-jpa/reference/4.0/repositories/query-methods-details.html#repositories.query-streaming>
- <https://jakarta.ee/specifications/platform/10/apidocs/jakarta/persistence/query#getResultStream()>
- <https://docs.hibernate.org/orm/current/userguide/html_single/#jpql-query-execution>
- <https://www.postgresql.org/docs/current/protocol-overview.html#PROTOCOL-OVERVIEW-EXT-QUERY>
- <https://jakarta.ee/specifications/persistence/2.2/apidocs/javax/persistence/query>

[csv-download-with-streaming-link]: https://junhyunny.github.io/spring/spring-data-jpa/async-response/performance/csv-download-with-streaming/
