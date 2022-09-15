---
title: "Statement And PreparedStatement"
search: false
category:
  - spring-boot
  - java
last_modified_at: 2022-09-15T23:55:00
---

<br>

## 0. 들어가면서

[개발자가 반드시 알아야 할 자바 성능 튜닝 이야기][java-performance-tuning-book-link] 책의 내용 중 Java 어플리케이션에서 데이터베이스를 사용할 때 조금이나마 성능을 올릴 수 있는 방법에 대한 설명을 읽었습니다. 
읽다보니 예전에 성능 분석 팀에서 SQL을 인라인(inline) 방식으로 작성하지 말라는 가이드를 받았던 기억이 떠올랐습니다. 
호기심에 이유를 여쭤봤었는데 정확하게 이해하지 못 했었습니다. 
글을 읽고 떠오른 기억을 계기로 관련된 내용을 정리해보았습니다. 

## 1. Java 어플리케이션 SQL 실행 과정

책에 나온 설명이나 여러 레퍼런스들을 보면 Java 어플리케이션에서 SQL 문을 다음과 같은 과정을 통해 실행합니다.

1. 쿼리 문장 분석
1. 컴파일
1. 실행 

SQL을 실행하는 시점에 Statement 인터페이스, PreparedStatement 인터페이스 구현체의 동작 차이가 발생합니다. 
데이터베이스 벤더 별로 Statement 인터페이스, PreparedStatement 인터페이스의 구현체를 제공하기 때문에 동작은 각기 다르지만, Statement 인터페이스는 별다른 캐싱 없이 매번 세 과정을 반복합니다. 
반면에 PreparedStatement 인터페이스의 구현체 같은 경우에는 분석과 컴파일 과정을 마친 쿼리를 내부 메모리에 캐싱(caching)해두고 재사용합니다. 

### 1.1. H2 데이터베이스 SQL 쿼리 컴파일과 캐싱 과정

데이터베이스 별로 실제 SQL 쿼리를 컴파일하는 동작과 과정이 다르기 때문에 쿼리 문장 분석과 컴파일 과정을 합쳐 컴파일로 칭하고 설명을 이어나가겠습니다. 
`MySQL`, `PostgreSQL` 데이터베이스에서 제공하는 구현체 코드들도 전반적인 흐름이 같기 때문에 H2 데이터베이스를 대표로 살펴보겠습니다. 

#### 1.1.1. org.h2.jdbc.JdbcConnection 클래스

* `JdbcPreparedStatement` 객체를 만들기 전에 `translateSQL` 메소드를 통해 SQL 문장의 특수 문자들을 이스케이핑(escaping) 처리합니다.

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

#### 1.1.2. org.h2.engine.SessionLocal 클래스

* prepareLocal 메소드에서 캐싱을 위한 객체를 만듭니다. 
    * 캐시로 사용되는 `SmallLRUCache` 클래스는 LinkedHashMap 클래스를 상속받았습니다.
* 전달받은 SQL 문자열을 캐시의 키로 사용합니다.
* `Parser` 객체를 통해 쿼리를 수행할 수 있는 `Command` 객체를 생성합니다.
* `Command` 객체를 캐시에 값으로 사용합니다.  

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

## 2. Statement 인터페이스와 PreparedStatement 인터페이스의 성능

컴파일 된 쿼리를 캐싱하여 재사용하는 PreparedStatement 구현체가 성능이 좋다는 의견들이 많아 테스트를 작성하고 속도를 측정해보았습니다. 
대상 데이터베이스는 다음과 같습니다.

* H2
* MySQL
* PostgreSQL

PC 사양에 따라 다르겠지만, 결과를 우선 살펴보면 3개의 데이터베이스 모두 Statement 구현체와 PreparedStatement 구현체의 쿼리 실행 속도가 확연하게 차이나진 않았습니다. 
데이터베이스 별로 성능 차이가 나는 경우도 있고, 아닌 경우도 있다는 의견과 오라클(Oracle) 데이터베이스를 사용할 때 가장 효과적이라는 의견이 있었습니다.  

### 2.1. H2 데이터베이스 테스트

* 테스트를 위한 10000건의 데이터를 추가합니다.
* `name` 컬럼을 이용한 조회 쿼리를 각자 10000회씩 수행합니다. 
* 조회 쿼리 시작과 종료 시점에 시간 차이를 확인합니다. 
    * `Statement` 구현체 - 6048ms
    * `PreparedStatement` 구현체 - 5676ms
* 테스트가 종료되면 데이터를 롤백합니다.

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

### 2.2. MySQL 데이터베이스 테스트

* 데이터베이스는 도커 컨테이너를 사용하였습니다.
* 프로젝트 경로에 `mysql-server.sh` 파일을 실행하면 MySQL 컨테이너가 실행됩니다.
* 테스트를 위한 10000건의 데이터를 추가합니다.
* `name` 컬럼을 이용한 조회 쿼리를 각자 10000회씩 수행합니다. 
* 조회 쿼리 시작과 종료 시점에 시간 차이를 확인합니다. 
    * `Statement` 구현체 - 37607ms
    * `PreparedStatement` 구현체 - 36853ms
* 테스트가 종료되면 데이터를 롤백합니다.

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

### 2.3. PostgreSQL 데이터베이스 테스트

* 데이터베이스는 도커 컨테이너를 사용하였습니다.
* 프로젝트 경로에 `postgre-server.sh` 파일을 실행하면 PostgreSQL 컨테이너가 실행됩니다.
* 테스트를 위한 10000건의 데이터를 추가합니다.
* `name` 컬럼을 이용한 조회 쿼리를 각자 10000회씩 수행합니다. 
* 조회 쿼리 시작과 종료 시점에 시간 차이를 확인합니다. 
    * `Statement` 구현체 - 16041ms
    * `PreparedStatement` 구현체 - 14633ms
* 테스트가 종료되면 데이터를 롤백합니다.

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

SQL 삽입(SQL injection) 외부 사용자가 전달한 검증되지 않은 값을 시스템이 쿼리에 그대로 삽입하여 사용함으로써 문제가 발생되는 공격입니다. 
두 인터페이스는 SQL 삽입 공격 취약성 여부가 다릅니다. 

* `Statement` 인터페이스는 SQL 삽입 공격에 취약합니다.
* `PreparedStatement` 인터페이스는 SQL 삽입 공격에 강합니다. 

해당 테스트는 조회 성능 테스트와 마찬가지로 3개의 데이터베이스들을 모두 확인해봤지만, 결과가 다르지 않으므로 H2 데이터베이스 코드만 살펴보겠습니다.  

### 3.1. H2 데이터베이스 SQL 삽입 공격 테스트

* 외부 사용자가 전달한 검증되지 않은 파라미터는 다음과 같습니다.
    * `''); delete from country; --`
    * 파라미터가 삽입되는 위치 앞에 쿼리는 종료시킵니다.
    * `country` 테이블을 데이터를 모두 삭제합니다.
    * 뒤에 오는 쿼리는 `--` 키워드를 통해 주석으로 만들어버립니다.
* 10000건의 데이터를 삽입합니다.
* 쿼리를 실행하기 전 `country` 테이블에 저장된 데이터 카운트를 확인합니다.
* 데이터를 추가하는 `insert` 쿼리를 수행합니다.
* 쿼리가 종료된 후 `country` 테이블에 저장된 데이터 카운트를 확인합니다.
* `Statement` 구현체는 쿼리 실행 전에 10000건, 실행 후 0건인지 확인합니다.
* `PreparedStatement` 구현체는 쿼리 실행 전에 10000건, 실행 후 10001건인지 확인합니다.

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

<!-- ## CLOSING -->

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-09-15-statement-and-prepared-statement>

#### REFERENCE

* [개발자가 반드시 알아야 할 자바 성능 튜닝 이야기][java-performance-tuning-book-link]

[java-performance-tuning-book-link]: https://www.kyobobook.co.kr/product/detailViewKor.laf?ejkGb=KOR&mallGb=KOR&barcode=9788966260928&orderClick=LAG&Kc=>