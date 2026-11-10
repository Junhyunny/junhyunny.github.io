---
title: "SQL Statement/PreparedStatement 비교"
publishedAt: "2022-09-15"
updatedAt: "2026-03-24T08:03:14+09:00"
canonicalPath: "/spring-boot/java/statement-and-prepared-statement/"
categories:
  - "spring-boot"
  - "java"
---

## 0. 들어가면서

[개발자가 반드시 알아야 할 자바 성능 튜닝 이야기][java-performance-tuning-book-link] 책의 내용 중 자바(Java) 애플리케이션에서 데이터베이스를 사용할 때 조금이나마 성능을 올릴 수 있는 방법에 대한 설명을 읽었다. 이에 관련된 내용을 블로그에 기록해보려 한다.

## 1. 자바 애플리케이션 SQL 실행 과정

책에 나온 설명이나 여러 레퍼런스들을 보면 자바 애플리케이션에서 SQL 문을 다음과 같은 과정을 통해 실행한다.

1. 쿼리 문장 분석
2. 컴파일
3. 실행

이때 쿼리 실행을 위해 추상화 된 `Statement`, `PreparedStatement` 두 개의 인터페이스가 있다. 두 인터페이스의 구현체들은 위 과정에서 동작 차이가 있다. 데이터베이스 종류 별로  구현 클래스를 제공하기 때문에 동작은 각기 다르지만, 전반적인 내용은 같다.

`Statement` 인터페이스 구현 클래스는 다음과 같이 실행한다.

- 쿼리를 실행하는 `execute`, `executeQuery` 메서드 호출 시 3단계 과정을 모두 실행한다.

`PreparedStatement` 인터페이스 구현 클래스는 다음과 같이 실행한다.

- `PreparedStatement` 객체를 생성하는 시점에 쿼리 문장 분석과 컴파일을 처리하고 쿼리 혹은 커맨드 객체를 만든다.
- SQL 문자열을 키, 쿼리 객체를 값으로 내부 메모리 캐시(cache)에 저장한다.
- 쿼리를 실행하는 `execute`, `executeQuery` 메서드 호출 시 캐시에 저장된 쿼리 객체를 꺼내 사용한다.

설명의 간편함을 위해 쿼리 문장 분석과 컴파일 과정을 합쳐 컴파일로 칭하고 설명을 이어나가겠다. `MySQL`, `PostgreSQL` 데이터베이스에서 제공하는 구현 클래스들의 코드들도 살펴봤지만, 전반적인 실행 흐름이 같았기 때문에 H2 인-메모리 데이터베이스가 제공하는 구현 클래스들을 대표로 살펴보겠다. H2 데이터베이스의 `org.h2.jdbc.JdbcPreparedStatement` 클래스 객체를 생성하면 아래 클래스들을 통해 컴파일과 캐싱이 수행된다.

- `JdbcPreparedStatement` 객체를 만들기 전에 `translateSQL` 메서드를 통해 SQL 문장의 특수 문자들을 이스케이핑(escaping) 처리한다.

```java
package org.h2.jdbc;

// ...

public class JdbcConnection extends TraceObject implements Connection, JdbcConnectionBackwardsCompat, CastDataProvider {

    // ...

    public PreparedStatement prepareStatement(String var1) throws SQLException {
        try {
            int var2 = getNextId(3);
            if (this.isDebugEnabled()) {
                this.debugCodeAssign("PreparedStatement", 3, var2, "prepareStatement(" + quote(var1) + ')');
            }
            this.checkClosed();
            // 특수문자 이스케이핑 처리
            var1 = translateSQL(var1);
            return new JdbcPreparedStatement(this, var1, var2, 1003, 1007, (Object)null);
        } catch (Exception var3) {
            throw this.logAndConvert(var3);
        }
    }

    private static String translateSQL(String var0) {
        return translateSQL(var0, true);
    }

    static String translateSQL(String var0, boolean var1) {
        if (var0 == null) {
            throw DbException.getInvalidValueException("SQL", (Object)null);
        } else {
            return var1 && var0.indexOf(123) >= 0 ? translateSQLImpl(var0) : var0;
        }
    }

    private static String translateSQLImpl(String var0) {
        int var1 = var0.length();
        char[] var2 = null;
        int var3 = 0;

        label131:
        for(int var4 = 0; var4 < var1; ++var4) {
            char var5 = var0.charAt(var4);
            switch (var5) {
                case '"':
                case '\'':
                case '-':
                case '/':
                    var4 = translateGetEnd(var0, var4, var5);
                    break;
                case '$':
                    var4 = translateGetEnd(var0, var4, var5);
                    break;
                case '{':
                    ++var3;
                    if (var2 == null) {
                        var2 = var0.toCharArray();
                    }
                // ... other escaping
            }
        }

        if (var3 != 0) {
            throw DbException.getSyntaxError(var0, var0.length() - 1);
        } else {
            if (var2 != null) {
                var0 = new String(var2);
            }
            return var0;
        }
    }
}
```

자바 애플리케이션이 데이터베이스와 연결할 때 사용하는 org.h2.engine.SessionLocal 클래스의 코드를 살펴보자. SessionLocal 클래스의 prepareLocal 메서드 내부에서 캐싱 작업이 이뤄진다.

- prepareLocal 메서드에서 캐싱을 위한 SmallLRUCache 객체를 만든다. 캐시로 사용되는 `SmallLRUCache` 클래스는 LinkedHashMap 클래스를 상속받았다.
- LinkedHashMap 클래스를 상속 받았기 때문에 키-밸류 형태로 객체를 저장한다.
  - 전달 받은 SQL 문자열을 캐시의 키로 사용한다. 문자열을 키로 사용하기 때문에 SQL 문을 인라인 방식으로 만드는 경우 값이 바뀔 때마다 키 값이 매번 바뀌므로 캐싱의 이점을 살리지 못한다.
  - `Parser` 객체를 통해 쿼리를 수행할 수 있는 `Command` 객체를 생성한다. `Command` 객체를 캐시의 값으로 사용한다.

```java
package org.h2.engine;

// ...

public final class SessionLocal extends Session implements TransactionStore.RollbackListener {

    // ...

    public Command prepareLocal(String var1) {
        if (this.isClosed()) {
            throw DbException.get(90067, "session closed");
        } else {
            Command var2;
            if (this.queryCacheSize > 0) {
                if (this.queryCache == null) {
                    this.queryCache = SmallLRUCache.newInstance(this.queryCacheSize);
                    this.modificationMetaID = this.database.getModificationMetaId();
                } else {
                    long var3 = this.database.getModificationMetaId();
                    if (var3 != this.modificationMetaID) {
                        this.queryCache.clear();
                        this.modificationMetaID = var3;
                    }

                    // 캐싱된 쿼리가 있다면 이를 반환
                    var2 = (Command)this.queryCache.get(var1);
                    if (var2 != null && var2.canReuse()) {
                        var2.reuse();
                        return var2;
                    }
                }
            }

            Parser var8 = new Parser(this);
            try {
                // 쿼리를 실행할 수 있는 Command 객체 생성
                var2 = var8.prepareCommand(var1);
            } finally {
                this.derivedTableIndexCache = null;
            }

            if (this.queryCache != null && var2.isCacheable()) {
                // 쿼리 문자열과 Command 객체를 캐싱
                this.queryCache.put(var1, var2);
            }

            return var2;
        }
    }
}
```

## 2. Statement, PreparedStatement 구현 클래스 성능 비교

컴파일된 쿼리를 캐싱하여 재사용하는 `PreparedStatement` 구현체가 성능이 좋다는 의견이 많아 테스트를 작성하고 속도를 측정해보았다. 대상 데이터베이스는 다음과 같다.

- H2
- MySQL
- PostgreSQL

각 데이터베이스마다 테스트 데이터와 방법은 동일하다.

1. 테스트를 위한 10000건의 데이터를 추가한다.
2. `name` 컬럼을 이용한 조회 쿼리를 각자 10000회씩 수행한다.
3. 조회 쿼리 시작과 종료 시점에 시간 차이를 확인한다.
4. 테스트가 종료되면 데이터를 롤백한다.

H2 데이터베이스를 사용했을 떄 테스트 결과를 살펴보자.

- Statement 구현체 클래스
  - 6048ms 소요
- PreparedStatement 구현체 클래스
  - 5676ms 소요

```java
package action.in.blog;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.sql.*;

@Log4j2
@SpringBootTest(properties = {
        "spring.sql.init.mode=embedded",
        "spring.sql.init.schema-locations=classpath:db/schema.sql",
        "spring.datasource.url=jdbc:h2:mem:test",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password="
})
public class MemoryDatabaseTests {

    Connection getConnection() {
        String url = "jdbc:h2:mem:test";
        String id = "sa";
        String pw = "";
        try {
            Class.forName("org.h2.Driver");
            Connection connection = DriverManager.getConnection(url, id, pw);
            connection.setAutoCommit(false);
            return connection;
        } catch (Exception e) {
            log.error(e);
        }
        return null;
    }

    void insertSamples(Connection connection) {
        try (PreparedStatement preparedStatement = connection.prepareStatement("insert into country (name) values (?)")) {
            for (int index = 0; index < 10000; index++) {
                preparedStatement.setString(1, "countryName-" + index);
                preparedStatement.execute();
            }
        } catch (Exception e) {
            log.error(e);
        }
    }

    @Test
    void select_10000_times_with_statement() {
        try (Connection connection = getConnection(); Statement statement = connection.createStatement()) {
            insertSamples(connection);

            long startTime = System.currentTimeMillis();

            for (int index = 0; index < 10000; index++) {
                statement.execute("select name from country where name = 'countryName-" + index + "'");
            }

            long endTime = System.currentTimeMillis();
            log.info("{} milli seconds", (endTime - startTime));

            connection.rollback();
        } catch (Exception e) {
            log.error(e);
        }
    }

    @Test
    void select_10000_times_with_prepared_statement() {
        try (Connection connection = getConnection(); PreparedStatement preparedStatement = connection.prepareStatement("select name from country where name = ?")) {
            insertSamples(connection);

            long startTime = System.currentTimeMillis();

            for (int index = 0; index < 10000; index++) {
                preparedStatement.setString(1, "countryName-" + index);
                preparedStatement.execute();
            }

            long endTime = System.currentTimeMillis();
            log.info("{} milli seconds", (endTime - startTime));

            connection.rollback();
        } catch (Exception e) {
            log.error(e);
        }
    }

    // ...
}
```

MySQL 데이터베이스 테스트 결과를 살펴보자. 데이터베이스는 도커 컨테이너를 사용했다. 프로젝트 경로에 `mysql-server.sh` 파일을 실행하면 MySQL 컨테이너가 실행된다.

- Statement 구현체 클래스 
  - 37607ms 소요
- PreparedStatement 구현체 클래스
  - 36853ms 소요

```java
package action.in.blog;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.sql.*;

@Log4j2
@SpringBootTest(properties = {
        "spring.sql.init.mode=always",
        "spring.sql.init.schema-locations=classpath:db/schema-mysql.sql",
        "spring.datasource.url=jdbc:mysql://localhost:3306/mysql",
        "spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver",
        "spring.datasource.username=root",
        "spring.datasource.password=123"
})
public class MySqlDatabaseTests {

    // please run mysql-server.sh before testing

    Connection getConnection() {
        String url = "jdbc:mysql://localhost:3306/mysql";
        String id = "root";
        String pw = "123";
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection connection = DriverManager.getConnection(url, id, pw);
            connection.setAutoCommit(false);
            return connection;
        } catch (Exception e) {
            log.error(e);
        }
        return null;
    }

    void insertSamples(Connection connection) {
        try (PreparedStatement preparedStatement = connection.prepareStatement("insert into country (name) values (?)")) {
            for (int index = 0; index < 10000; index++) {
                preparedStatement.setString(1, "countryName-" + index);
                preparedStatement.execute();
            }
        } catch (Exception e) {
            log.error(e);
        }
    }

    @Test
    void select_10000_times_with_statement() {
        try (Connection connection = getConnection(); Statement statement = connection.createStatement()) {
            insertSamples(connection);

            long startTime = System.currentTimeMillis();

            for (int index = 0; index < 10000; index++) {
                statement.execute("select name from country where name = 'countryName-" + index + "'");
            }

            long endTime = System.currentTimeMillis();
            log.info("{} milli seconds", (endTime - startTime));

            connection.rollback();
        } catch (Exception e) {
            log.error(e);
        }
    }

    @Test
    void select_10000_times_with_prepared_statement() {
        try (Connection connection = getConnection(); PreparedStatement preparedStatement = connection.prepareStatement("select name from country where name = ?")) {
            insertSamples(connection);

            long startTime = System.currentTimeMillis();

            for (int index = 0; index < 10000; index++) {
                preparedStatement.setString(1, "countryName-" + index);
                preparedStatement.execute();
            }

            long endTime = System.currentTimeMillis();
            log.info("{} milli seconds", (endTime - startTime));

            connection.rollback();
        } catch (Exception e) {
            log.error(e);
        }
    }

    // ...
}
```

마지막으로 PostgreSQL 데이터베이스 테스트 결과를 살펴보자. MySQL과 마찬가지로 도커 컨테이너를 사용했다. 프로젝트 경로에 `postgre-server.sh` 파일을 실행하면 PostgreSQL 컨테이너가 실행된다.

- Statement 구현체 클래스
  - 16041ms 소요
- PreparedStatement 구현체 클래스
  - 14633ms 소요

```java
package action.in.blog;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.sql.*;

@Log4j2
@SpringBootTest(properties = {
        "spring.sql.init.mode=always",
        "spring.sql.init.schema-locations=classpath:db/schema-postgres.sql",
        "spring.datasource.url=jdbc:postgresql://localhost:5432/postgres",
        "spring.datasource.driver-class-name=org.postgresql.Driver",
        "spring.datasource.username=postgres",
        "spring.datasource.password=123"
})
public class PostgreSqlDatabaseTests {

    // please run postgres-server.sh before testing

    Connection getConnection() {
        String url = "jdbc:postgresql://localhost:5432/postgres";
        String id = "postgres";
        String pw = "123";
        try {
            Class.forName("org.postgresql.Driver");
            Connection connection = DriverManager.getConnection(url, id, pw);
            connection.setAutoCommit(false);
            return connection;
        } catch (Exception e) {
            log.error(e);
        }
        return null;
    }

    void insertSamples(Connection connection) {
        try (PreparedStatement preparedStatement = connection.prepareStatement("insert into country (name) values (?)")) {
            for (int index = 0; index < 10000; index++) {
                preparedStatement.setString(1, "countryName-" + index);
                preparedStatement.execute();
            }
        } catch (Exception e) {
            log.error(e);
        }
    }

    @Test
    void select_10000_times_with_statement() {
        try (Connection connection = getConnection(); Statement statement = connection.createStatement()) {
            insertSamples(connection);

            long startTime = System.currentTimeMillis();

            for (int index = 0; index < 10000; index++) {
                statement.execute("select name from country where name = 'countryName-" + index + "'");
            }

            long endTime = System.currentTimeMillis();
            log.info("{} milli seconds", (endTime - startTime));

            connection.rollback();
        } catch (Exception e) {
            log.error(e);
        }
    }

    @Test
    void select_10000_times_with_prepared_statement() {
        try (Connection connection = getConnection(); PreparedStatement preparedStatement = connection.prepareStatement("select name from country where name = ?")) {
            insertSamples(connection);

            long startTime = System.currentTimeMillis();

            for (int index = 0; index < 10000; index++) {
                preparedStatement.setString(1, "countryName-" + index);
                preparedStatement.execute();
            }

            long endTime = System.currentTimeMillis();
            log.info("{} milli seconds", (endTime - startTime));

            connection.rollback();
        } catch (Exception e) {
            log.error(e);
        }
    }

    // ...
}
```

## 3. SQL Injection Attack

성능에서도 차이가 있지만, 보안 관점에서 봐도 두 클래스는 서로 다르게 동작한다. SQL 삽입(SQL injection) 공격을 예로 들어보자. 외부 사용자가 전달한 검증되지 않은 값을 시스템이 쿼리에 그대로 삽입하여 사용함으로써 문제가 발생되는 공격이다. 두 인터페이스는 SQL 삽입 공격 취약성 여부가 다르다.

- `Statement` 인스턴스는 SQL 삽입 공격에 취약하다.
- `PreparedStatement` 인스턴스는 SQL 삽입 공격에 대한 방어가 가능하다.

해당 테스트는 조회 성능 테스트와 마찬가지로 3개의 데이터베이스들에 대해 진행하였고 결과는 다음과 같다.

- H2 - `Statement` 인터페이스 SQL 삽입 공격 성공
- MySQL - 쿼리 실행 중 `SQLSyntaxErrorException` 예외 발생
- PostgreSQL - `Statement` 인터페이스 SQL 삽입 공격 성공

테스트 코드가 크게 다르지 않으므로 H2 데이터베이스에 대한 테스트만 확인해보자. 외부 사용자가 전달한 값을 검증하지 않고 SQL 추가해서 사용할 때 문제가 발생한다. `''); delete from country; --` 같은 검증되지 않은 값을 사용자가 전달했다고 가정한다. 이 입력 값이 SQL 중간에 삽입되면 다음과 같은 문제를 일으킨다.

- 파라미터가 삽입되는 위치 앞에 쿼리는 종료시킨다.
- `country` 테이블의 데이터를 모두 삭제한다.
- 뒤에 오는 쿼리는 `--` 키워드를 통해 주석 처리한다.


- 테스트를 위한 10000건의 데이터를 추가한다.
- 쿼리를 실행하기 전 `country` 테이블에 저장된 데이터 카운트를 확인한다.
- `insert` 쿼리를 통해 데이터를 1건 추가한다.
- 쿼리가 종료된 후 `country` 테이블에 저장된 데이터 카운트를 다시 확인한다.
- `Statement` 구현체는 쿼리 실행 전에 10000건, 실행 후 0건일 것으로 예상한다.
  - SQL 삽입 공격에 의해 테이블에 모든 데이터가 삭제된다.
- `PreparedStatement` 구현체는 쿼리 실행 전에 10000건, 실행 후 10001건일 것으로 예상한다.
  - SQL 삽입 공격이 실패하므로 데이터가 1건 추가된다.

```java
package action.in.blog;

import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.sql.*;

@Log4j2
@SpringBootTest(properties = {
        "spring.sql.init.mode=embedded",
        "spring.sql.init.schema-locations=classpath:db/schema.sql",
        "spring.datasource.url=jdbc:h2:mem:test",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password="
})
public class MemoryDatabaseTests {

    Connection getConnection() {
        String url = "jdbc:h2:mem:test";
        String id = "sa";
        String pw = "";
        try {
            Class.forName("org.h2.Driver");
            Connection connection = DriverManager.getConnection(url, id, pw);
            connection.setAutoCommit(false);
            return connection;
        } catch (Exception e) {
            log.error(e);
        }
        return null;
    }

    // ....

    int getCountOfRows(Connection connection) {
        try (PreparedStatement statement = connection.prepareStatement("select count(*) as cnt from country")) {
            ResultSet resultSet = statement.executeQuery();
            if (resultSet.next()) {
                return resultSet.getInt("cnt");
            }
            return 0;
        } catch (Exception e) {
            log.error(e);
        }
        return -1;
    }

    @Test
    void sql_injection_when_using_statement() {
        String parameter = "''); delete from country; --";
        try (Connection connection = getConnection(); Statement statement = connection.createStatement()) {
            insertSamples(connection);
            int beforeCount = getCountOfRows(connection);

            statement.execute("insert into country (name) values (" + parameter + ")");

            int afterCount = getCountOfRows(connection);

            assertThat(beforeCount, equalTo(10000));
            assertThat(afterCount, equalTo(0));

            connection.rollback();
        } catch (Exception e) {
            log.error(e);
        }
    }

    @Test
    void defend_sql_injection_when_using_prepared_statement() {
        String parameter = "''); delete from country; --";
        try (Connection connection = getConnection(); PreparedStatement preparedStatement = connection.prepareStatement("insert into country (name) values (?)")) {
            insertSamples(connection);
            int beforeCount = getCountOfRows(connection);

            preparedStatement.setString(1, parameter);
            preparedStatement.execute();

            int afterCount = getCountOfRows(connection);

            assertThat(beforeCount, equalTo(10000));
            assertThat(afterCount, equalTo(10001));

            connection.rollback();
        } catch (Exception e) {
            log.error(e);
        }
    }
}
```

##### 테스트 결과

<div align="left">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/statement-and-prepared-statement-01.png" width="50%" class="image__border">
</div>



PC 사양에 따라 다르겠지만, 결과를 우선 이야기하자면 3개의 데이터베이스 모두 `Statement`와 `PreparedStatement` 구현체의 쿼리 실행 속도가 확연하게 차이나진 않았다. 찾아보니 데이터베이스 별로 `Statement`와 `PreparedStatement` 구현체 사이의 성능 차이가 다르며 오라클(Oracle) 데이터베이스를 사용할 때 가장 효과적이라는 의견이 있었다.

## CLOSING

포스트 내용을 요약하면서 마무리하겠다.

- `Statement`, `PreparedStatement` 인터페이스의 구현체는 데이터베이스 별로 다른 방식으로 제공한다.
- SQL은 구문 분석, 컴파일, 실행 과정을 통해 실행된다.
- `Statement` 구현체는 모든 과정을 매번 실행한다.
- `PreparedStatement` 구현체는 구문 분석과 컴파일을 마친 쿼리를 캐시에 담아 반복 실행되는 경우 재사용한다.
- `PreparedStatement` 구현체는 캐시를 사용하기 때문에 성능이 좋아질 것을 예상하지만, 데이터베이스 별로 효과가 다르다.
- SQL 삽입 공격 관점에서 `Statement` 구현체는 취약하고, `PreparedStatement` 구현체는 방어가 가능하다.

확인해보진 않았지만, `MyBatis`나 `JPA` 같은 경우에도 내부적으로 데이터베이스 별로 제공하는 커넥션(connection) 클래스, `Statement`, `PreparedStatement` 인터페이스의 구현 클래스들을 사용할 것으로 예상되기 때문에 관련된 개념을 정리해두는 것은 도움이 될 것 같다. 관련된 내용을 확인하게 된다면 추후 포스트로 정리할 생각이다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-09-15-statement-and-prepared-statement>

#### REFERENCE

- [개발자가 반드시 알아야 할 자바 성능 튜닝 이야기][java-performance-tuning-book-link]
- <https://docs.oracle.com/javase/6/docs/api/java/sql/Statement.html>
- <https://docs.oracle.com/javase/6/docs/api/java/sql/PreparedStatement.html>
- <https://devbox.tistory.com/entry/Comporison>
- <https://stackoverflow.com/questions/687550/preparedstatements-and-performance>

[java-performance-tuning-book-link]: https://www.kyobobook.co.kr/product/detailViewKor.laf?ejkGb=KOR&mallGb=KOR&barcode=9788966260928&orderClick=LAG&Kc=
