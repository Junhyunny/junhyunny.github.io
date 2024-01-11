---
title: "Flyway on Spring Boot"
search: false
category:
  - spring-boot
  - database
  - flyway
last_modified_at: 2023-08-25T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Schema Migration][schema-migration-link]
* [Flyway CLI for Database Migration][flyway-cli-for-database-migration-link]

## 0. 들어가면서

이번 포스트는 스프링 프레임워크(spring framework)에서 `Flyway`를 적용하는 방법에 대해 다룹니다. 
데이터베이스 마이그레이션(migration)이나 `Flyway`에 대한 개념은 아래 포스트들을 통해 확인할 수 있습니다.

* [Schema Migration][schema-migration-link]
* [Flyway CLI for Database Migration][flyway-cli-for-database-migration-link]

## 1. Project Setup

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
    │   │               └── domain
    │   │                   └── UserEntity.java
    │   └── resources
    │       ├── application.yml
    │       └── db
    │           ├── migration
    │           │   └── V1.0.0__create_user.sql
    │           ├── seed
    │           │   └── R__insert_users_repeatable.sql
    │           ├── temp
    │           │   ├── V1.0.1__alerter_user_add_colum_email.sql
    │           │   └── V1.0.3__alerter_user_add_colum_address.sql
    │           └── undo
    │               └── V1.0.2__undo_V1.0.1.sql
    └── test
        └── java
            └── action
                └── in
                    └── blog
                        └── ActionInBlogApplicationTests.java
```

### 1.1. build.gradle

가독성을 위해 주석으로 관련 의존성들을 설명합니다.

```groovy
buildscript {
    dependencies {
        // 그래이들 태스크에서 데이터베이스 접속하기 위한 의존성
        classpath 'org.flywaydb:flyway-mysql:9.21.2'
    }
}

plugins {
    id 'java'
    id 'org.springframework.boot' version '3.1.2'
    id 'io.spring.dependency-management' version '1.1.2'
    // 그래이들 태스크 수행을 위한 Flyway 플러그인
    id "org.flywaydb.flyway" version "9.21.2"
}

group = 'action.in.blog'
version = '0.0.1-SNAPSHOT'

java {
    sourceCompatibility = '17'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.flywaydb:flyway-core'
    implementation 'org.flywaydb:flyway-mysql'
    runtimeOnly 'com.mysql:mysql-connector-j'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}

// 데이터베이스 접속 정보
flyway {
    url = 'jdbc:mysql://localhost:3306/junhyunny-db?allowPublicKeyRetrieval=true&useSSL=false'
    user = 'root'
    password = 'password!1234'
    locations = ['classpath:db/migration', 'classpath:db/seed']
}

flywayMigrate.dependsOn classes
```

### 1.2. application.yml

* JPA ddl-auto 설정을 `validate`로 지정합니다.
    * 어플리케이션 실행시 엔티티와 데이터베이스 스키마가 일치하는지 여부를 확인합니다.
* 데이터베이스 접속 정보를 지정합니다.
* 마이그레이션 스크립트 파일 경로를 지정합니다.
    * db/migration - 스키마 마이그레이션 스크립트
    * db/seed - 데이터 셋업 스크립트

```yml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/junhyunny-db?allowPublicKeyRetrieval=true&useSSL=false
    username: root
    password: password!1234
  flyway:
    locations: classpath:db/migration,classpath:db/seed
```

### 1.3. UserEntity Class

스키마 마이그레이션 작업을 병행할 엔티티 클래스를 하나 준비합니다.

```java
package action.in.blog.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "tb_user")
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String name;
}
```

## 2. Practice

### 2.1. Database Setup

실습을 위한 컨테이너 데이터베이스를 준비합니다. 
도커 컴포즈(docker compose)를 사용합니다. 

```yml
version: "3.8"
services:
  mysql:
    image: mysql:latest
    container_name: mysql-container
    ports:
      - 3306:3306
    environment:
      - MYSQL_ROOT_PASSWORD=password!1234
      - MYSQL_DATABASE=junhyunny-db
```

```
$ docker-compose up -d
[+] Running 1/1
 ✔ Container mysql-container  Started
```

### 2.2. Initialize

다음 마이그레이션 스크립트를 적용합니다.

* V1.0.0__create_user
    * 사용자 테이블을 생성합니다.

```sql
CREATE TABLE IF NOT EXISTS `junhyunny-db`.`tb_user`
(
    `id`   BIGINT       NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
```

* R__insert_users_repeatable
    * 사용자 정보를 추가합니다.

```sql
insert into `junhyunny-db`.`tb_user` (name) values ('junhyunny');
insert into `junhyunny-db`.`tb_user` (name) values ('jua');
```

어플리케이션을 실행하면 다음과 같은 로그를 확인할 수 있습니다.

* Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
    * 마이그레이션 작업을 수행하는 데이터베이스 정보입니다.
* Successfully validated 2 migrations
    * 두 마이그레이션 작업에 대한 유효성 검사가 성공합니다.
* Migrating schema `junhyunny-db` to version "1.0.0 - create user"
    * 테이블 생성 스키마 마이그레이션 작업을 수행합니다.
* Migrating schema `junhyunny-db` with repeatable migration "insert users repeatable"
    * 사용자 정보를 추가하는 마이그레이션 작업을 수행합니다.
* Successfully applied 2 migrations to schema `junhyunny-db`, now at version v1.0.0
    * 두 마이그레이션 작업들이 성공하였고 버전은 1.0.0 입니다.

```
...
2023-08-25T11:37:20.526+09:00  INFO 16939 --- [           main] o.f.c.internal.license.VersionPrinter    : Flyway Community Edition 9.16.3 by Redgate
2023-08-25T11:37:20.526+09:00  INFO 16939 --- [           main] o.f.c.internal.license.VersionPrinter    : See release notes here: https://rd.gt/416ObMi
2023-08-25T11:37:20.526+09:00  INFO 16939 --- [           main] o.f.c.internal.license.VersionPrinter    : 
2023-08-25T11:37:20.535+09:00  INFO 16939 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
2023-08-25T11:37:20.700+09:00  INFO 16939 --- [           main] com.zaxxer.hikari.pool.HikariPool        : HikariPool-1 - Added connection com.mysql.cj.jdbc.ConnectionImpl@6be6931f
2023-08-25T11:37:20.702+09:00  INFO 16939 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
2023-08-25T11:37:20.728+09:00  INFO 16939 --- [           main] o.f.c.i.database.base.BaseDatabaseType   : Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
2023-08-25T11:37:20.764+09:00  WARN 16939 --- [           main] o.f.c.internal.database.base.Database    : Flyway upgrade recommended: MySQL 8.1 is newer than this version of Flyway and support has not been tested. The latest supported version of MySQL is 8.0.
2023-08-25T11:37:20.793+09:00  INFO 16939 --- [           main] o.f.c.i.s.JdbcTableSchemaHistory         : Schema history table `junhyunny-db`.`flyway_schema_history` does not exist yet
2023-08-25T11:37:20.797+09:00  INFO 16939 --- [           main] o.f.core.internal.command.DbValidate     : Successfully validated 2 migrations (execution time 00:00.023s)
2023-08-25T11:37:20.825+09:00  INFO 16939 --- [           main] o.f.c.i.s.JdbcTableSchemaHistory         : Creating Schema History table `junhyunny-db`.`flyway_schema_history` ...
2023-08-25T11:37:20.915+09:00  INFO 16939 --- [           main] o.f.core.internal.command.DbMigrate      : Current version of schema `junhyunny-db`: << Empty Schema >>
2023-08-25T11:37:20.926+09:00  INFO 16939 --- [           main] o.f.core.internal.command.DbMigrate      : Migrating schema `junhyunny-db` to version "1.0.0 - create user"
2023-08-25T11:37:21.005+09:00  INFO 16939 --- [           main] o.f.core.internal.command.DbMigrate      : Migrating schema `junhyunny-db` with repeatable migration "insert users repeatable"
2023-08-25T11:37:21.048+09:00  INFO 16939 --- [           main] o.f.core.internal.command.DbMigrate      : Successfully applied 2 migrations to schema `junhyunny-db`, now at version v1.0.0 (execution time 00:00.144s)
...
```

데이터베이스 정보를 확인합니다.

* 두 개의 테이블이 생성됩니다.
    * flyway_schema_history 테이블 
        * 마이그레이션 이력 테이블입니다.
    * tb_user 테이블
        * 마이그레이션 작업을 통해 생성된 테이블입니다.
* 마이그레이션 이력 테이블에 마이그레이션 작업 이력이 저장됩니다.
    * 마이그레이션에 사용된 스크립트에 대한 정보가 체크섬으로 저장됩니다.
* 사용자 테이블에 사용자 정보가 저장됩니다.
    * R__insert_users_repeatable 파일에 작성한 스크립트에 의해 데이터가 저장됩니다.
    * 반복 수행 스크립트는 한번만 적용되지만, 파일에 변경이 발생하여 체크섬이 바뀌면 다시 실행됩니다.

```
mysql> select * from flyway_schema_history;
+----------------+---------+-------------------------+------+--------------------------------+------------+--------------+---------------------+----------------+---------+
| installed_rank | version | description             | type | script                         | checksum   | installed_by | installed_on        | execution_time | success |
+----------------+---------+-------------------------+------+--------------------------------+------------+--------------+---------------------+----------------+---------+
|              1 | 1.0.0   | create user             | SQL  | V1.0.0__create_user.sql        | 1435369412 | root         | 2023-08-25 02:37:20 |             28 |       1 |
|              2 | NULL    | insert users repeatable | SQL  | R__insert_users_repeatable.sql | -392104774 | root         | 2023-08-25 02:37:21 |             13 |       1 |
+----------------+---------+-------------------------+------+--------------------------------+------------+--------------+---------------------+----------------+---------+
2 rows in set (0.00 sec)

mysql> select * from tb_user;
+----+-----------+
| id | name      |
+----+-----------+
|  1 | junhyunny |
|  2 | jua       |
+----+-----------+
2 rows in set (0.00 sec)
```

### 2.3. Fail and Repair

엔티티 클래스를 변경합니다.

```java
package action.in.blog.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "tb_user")
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String name;
    private String email;
    private String address;
}
```

엔티티 변경에 맞춰 다음과 같은 스키마 변경 작업 파일을 추가합니다.

* V1.0.1__alerter_user_add_colum_email

```sql
ALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN email VARCHAR(50) NOT NULL; 
```

* V1.0.3__alerter_user_add_colum_address
    * 일부러 오타로 작성하여 마이그레이션을 실패를 유도합니다.

```sql
AALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN address VARCHAR(50) NOT NULL; 
```

어플리케이션을 실행하면 다음과 같은 에러가 발생합니다.

* Migration of schema `junhyunny-db` to version "1.0.3 - alerter user add colum address" failed
    * 마이그레이션이 실패합니다.
* 에러 원인과 에러 코드가 출력됩니다.

```
...
2023-08-25T13:34:20.461+09:00  INFO 24162 --- [           main] o.f.c.internal.license.VersionPrinter    : Flyway Community Edition 9.16.3 by Redgate
2023-08-25T13:34:20.461+09:00  INFO 24162 --- [           main] o.f.c.internal.license.VersionPrinter    : See release notes here: https://rd.gt/416ObMi
2023-08-25T13:34:20.461+09:00  INFO 24162 --- [           main] o.f.c.internal.license.VersionPrinter    : 
2023-08-25T13:34:20.468+09:00  INFO 24162 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
2023-08-25T13:34:20.581+09:00  INFO 24162 --- [           main] com.zaxxer.hikari.pool.HikariPool        : HikariPool-1 - Added connection com.mysql.cj.jdbc.ConnectionImpl@b791a81
2023-08-25T13:34:20.583+09:00  INFO 24162 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
2023-08-25T13:34:20.606+09:00  INFO 24162 --- [           main] o.f.c.i.database.base.BaseDatabaseType   : Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
2023-08-25T13:34:20.630+09:00  WARN 24162 --- [           main] o.f.c.internal.database.base.Database    : Flyway upgrade recommended: MySQL 8.1 is newer than this version of Flyway and support has not been tested. The latest supported version of MySQL is 8.0.
2023-08-25T13:34:20.661+09:00  INFO 24162 --- [           main] o.f.core.internal.command.DbValidate     : Successfully validated 4 migrations (execution time 00:00.024s)
2023-08-25T13:34:20.681+09:00  INFO 24162 --- [           main] o.f.core.internal.command.DbMigrate      : Current version of schema `junhyunny-db`: 1.0.0
2023-08-25T13:34:20.691+09:00  INFO 24162 --- [           main] o.f.core.internal.command.DbMigrate      : Migrating schema `junhyunny-db` to version "1.0.1 - alerter user add colum email"
2023-08-25T13:34:20.742+09:00  INFO 24162 --- [           main] o.f.core.internal.command.DbMigrate      : Migrating schema `junhyunny-db` to version "1.0.3 - alerter user add colum address"
2023-08-25T13:34:20.757+09:00 ERROR 24162 --- [           main] o.f.core.internal.command.DbMigrate      : Migration of schema `junhyunny-db` to version "1.0.3 - alerter user add colum address" failed! Please restore backups and roll back database and code!
2023-08-25T13:34:20.782+09:00  WARN 24162 --- [           main] ConfigServletWebServerApplicationContext : Exception encountered during context initialization - cancelling refresh attempt: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'flywayInitializer' defined in class path resource [org/springframework/boot/autoconfigure/flyway/FlywayAutoConfiguration$FlywayConfiguration.class]: Migration V1.0.3__alerter_user_add_colum_address.sql failed
-----------------------------------------------------------
SQL State  : 42000
Error Code : 1064
Message    : You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'AALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN address VARCHAR(50) NOT NULL' at line 1
Location   : db/migration/V1.0.3__alerter_user_add_colum_address.sql (/Users/junhyunk/Desktop/workspace/blog/blog-in-action/2023-08-25-flyway-on-spring-boot/action-in-blog/build/resources/main/db/migration/V1.0.3__alerter_user_add_colum_address.sql)
Line       : 1
Statement  : AALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN address VARCHAR(50) NOT NULL

2023-08-25T13:34:20.783+09:00  INFO 24162 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Shutdown initiated...
2023-08-25T13:34:20.794+09:00  INFO 24162 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Shutdown completed.
2023-08-25T13:34:20.796+09:00  INFO 24162 --- [           main] o.apache.catalina.core.StandardService   : Stopping service [Tomcat]
2023-08-25T13:34:20.805+09:00  INFO 24162 --- [           main] .s.b.a.l.ConditionEvaluationReportLogger : 

Error starting ApplicationContext. To display the condition evaluation report re-run your application with 'debug' enabled.
2023-08-25T13:34:20.817+09:00 ERROR 24162 --- [           main] o.s.boot.SpringApplication               : Application run failed

org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'flywayInitializer' defined in class path resource [org/springframework/boot/autoconfigure/flyway/FlywayAutoConfiguration$FlywayConfiguration.class]: Migration V1.0.3__alerter_user_add_colum_address.sql failed
-----------------------------------------------------------
SQL State  : 42000
Error Code : 1064
Message    : You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'AALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN address VARCHAR(50) NOT NULL' at line 1
Location   : db/migration/V1.0.3__alerter_user_add_colum_address.sql (/Users/junhyunk/Desktop/workspace/blog/blog-in-action/2023-08-25-flyway-on-spring-boot/action-in-blog/build/resources/main/db/migration/V1.0.3__alerter_user_add_colum_address.sql)
Line       : 1
Statement  : AALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN address VARCHAR(50) NOT NULL

    at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.initializeBean(AbstractAutowireCapableBeanFactory.java:1770) ~[spring-beans-6.0.11.jar:6.0.11]
    at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.doCreateBean(AbstractAutowireCapableBeanFactory.java:598) ~[spring-beans-6.0.11.jar:6.0.11]
    at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.createBean(AbstractAutowireCapableBeanFactory.java:520) ~[spring-beans-6.0.11.jar:6.0.11]
    at org.springframework.beans.factory.support.AbstractBeanFactory.lambda$doGetBean$0(AbstractBeanFactory.java:326) ~[spring-beans-6.0.11.jar:6.0.11]
    at org.springframework.beans.factory.support.DefaultSingletonBeanRegistry.getSingleton(DefaultSingletonBeanRegistry.java:234) ~[spring-beans-6.0.11.jar:6.0.11]
    ...
```

마이그레이션 상태를 확인합니다.

* 1.0.1 버전 마이그레이션은 성공입니다.
* 1.0.3 버전 마이그레이션은 실패 상태입니다.

```
$ gradle flywayInfo


> Task :flywayInfo
Flyway upgrade recommended: MySQL 8.1 is newer than this version of Flyway and support has not been tested. The latest supported version of MySQL is 8.0.
Schema version: 1.0.3
+------------+---------+--------------------------------+------+---------------------+---------+----------+
| Category   | Version | Description                    | Type | Installed On        | State   | Undoable |
+------------+---------+--------------------------------+------+---------------------+---------+----------+
| Versioned  | 1.0.0   | create user                    | SQL  | 2023-08-25 02:37:20 | Success | No       |
| Repeatable |         | insert users repeatable        | SQL  | 2023-08-25 02:37:21 | Success |          |
| Versioned  | 1.0.1   | alerter user add colum email   | SQL  | 2023-08-25 04:34:20 | Success | No       |
| Versioned  | 1.0.3   | alerter user add colum address | SQL  | 2023-08-25 04:34:20 | Failed  | No       |
+------------+---------+--------------------------------+------+---------------------+---------+----------+


Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.3/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.

BUILD SUCCESSFUL in 1s
```

마이그레이션 이력 테이블 데이터를 살펴보면 다음과 같습니다.

* 두 개의 마이그레이션 스크립트에 대한 체크섬 정보 모두 데이터베이스에 저장됩니다. 
    * 1.0.1 버전 마이그레이션은 성공입니다.
    * 1.0.3 버전 마이그레이션은 실패 상태입니다.

```
mysql> select * from flyway_schema_history;
+----------------+---------+--------------------------------+------+--------------------------------------------+-------------+--------------+---------------------+----------------+---------+
| installed_rank | version | description                    | type | script                                     | checksum    | installed_by | installed_on        | execution_time | success |
+----------------+---------+--------------------------------+------+--------------------------------------------+-------------+--------------+---------------------+----------------+---------+
|              1 | 1.0.0   | create user                    | SQL  | V1.0.0__create_user.sql                    |  1435369412 | root         | 2023-08-25 02:37:20 |             28 |       1 |
|              2 | NULL    | insert users repeatable        | SQL  | R__insert_users_repeatable.sql             |  -392104774 | root         | 2023-08-25 02:37:21 |             13 |       1 |
|              3 | 1.0.1   | alerter user add colum email   | SQL  | V1.0.1__alerter_user_add_colum_email.sql   |   276748304 | root         | 2023-08-25 04:34:20 |             21 |       1 |
|              4 | 1.0.3   | alerter user add colum address | SQL  | V1.0.3__alerter_user_add_colum_address.sql | -1170658976 | root         | 2023-08-25 04:34:20 |             19 |       0 |
+----------------+---------+--------------------------------+------+--------------------------------------------+-------------+--------------+---------------------+----------------+---------+
4 rows in set (0.00 sec)
```

1.0.3 버전 마이그레이션 스크립트를 정상적으로 수정하고 어플리케이션을 실행하면 다음과 같은 에러가 발생합니다. 

* Validate failed: Migrations have failed validation
    * 유효성 검사에서 실패합니다.
* Detected failed migration to version 1.0.3 (alerter user add colum address).
    * 1.0.3 버전 마이그레이션 작업이 실패했던 이력을 감지합니다.
    * 이전에 실패한 이력 때문에 마이그레이션을 진행하지 않습니다.

```
...
2023-08-25T13:46:21.722+09:00  INFO 25750 --- [           main] o.f.c.internal.license.VersionPrinter    : Flyway Community Edition 9.16.3 by Redgate
2023-08-25T13:46:21.723+09:00  INFO 25750 --- [           main] o.f.c.internal.license.VersionPrinter    : See release notes here: https://rd.gt/416ObMi
2023-08-25T13:46:21.723+09:00  INFO 25750 --- [           main] o.f.c.internal.license.VersionPrinter    : 
2023-08-25T13:46:21.735+09:00  INFO 25750 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
2023-08-25T13:46:21.851+09:00  INFO 25750 --- [           main] com.zaxxer.hikari.pool.HikariPool        : HikariPool-1 - Added connection com.mysql.cj.jdbc.ConnectionImpl@b791a81
2023-08-25T13:46:21.852+09:00  INFO 25750 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
2023-08-25T13:46:21.876+09:00  INFO 25750 --- [           main] o.f.c.i.database.base.BaseDatabaseType   : Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
2023-08-25T13:46:21.896+09:00  WARN 25750 --- [           main] o.f.c.internal.database.base.Database    : Flyway upgrade recommended: MySQL 8.1 is newer than this version of Flyway and support has not been tested. The latest supported version of MySQL is 8.0.
2023-08-25T13:46:21.937+09:00  WARN 25750 --- [           main] ConfigServletWebServerApplicationContext : Exception encountered during context initialization - cancelling refresh attempt: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'flywayInitializer' defined in class path resource [org/springframework/boot/autoconfigure/flyway/FlywayAutoConfiguration$FlywayConfiguration.class]: Validate failed: Migrations have failed validation
Detected failed migration to version 1.0.3 (alerter user add colum address).
Please remove any half-completed changes then run repair to fix the schema history.
Need more flexibility with validation rules? Learn more: https://rd.gt/3AbJUZE
...
```

flywayRepair 명령어를 수행합니다.

* flywayRepair 명령어를 통해 실패한 이력을 대기 상태로 변경합니다.

```
$ gradle flywayRepair


> Task :flywayRepair
Flyway upgrade recommended: MySQL 8.1 is newer than this version of Flyway and support has not been tested. The latest supported version of MySQL is 8.0.

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.3/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.

$ gradle flywayInfo

> Task :flywayInfo
Flyway upgrade recommended: MySQL 8.1 is newer than this version of Flyway and support has not been tested. The latest supported version of MySQL is 8.0.
Schema version: 1.0.1
+------------+---------+--------------------------------+------+---------------------+---------+----------+
| Category   | Version | Description                    | Type | Installed On        | State   | Undoable |
+------------+---------+--------------------------------+------+---------------------+---------+----------+
| Versioned  | 1.0.0   | create user                    | SQL  | 2023-08-25 02:37:20 | Success | No       |
| Repeatable |         | insert users repeatable        | SQL  | 2023-08-25 02:37:21 | Success |          |
| Versioned  | 1.0.1   | alerter user add colum email   | SQL  | 2023-08-25 04:34:20 | Success | No       |
| Versioned  | 1.0.3   | alerter user add colum address | SQL  |                     | Pending | No       |
+------------+---------+--------------------------------+------+---------------------+---------+----------+


Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.3/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.
```

어플리케이션을 실행하면 정상적으로 마이그레이션 작업이 수행됩니다.

* Successfully validated 4 migrations (execution time 00:00.024s)
    * 이전에 수행한 작업까지 포함하여 마이그레이션 스크립트에 대한 유효성 검증을 수행하고 모두 성공합니다.
* Successfully applied 1 migration to schema `junhyunny-db`, now at version v1.0.3 (execution time 00:00.068s)
    * 마이그레이션 작업에 성공합니다.

```
...
2023-08-25T13:48:36.164+09:00  INFO 26044 --- [           main] o.f.c.internal.license.VersionPrinter    : Flyway Community Edition 9.16.3 by Redgate
2023-08-25T13:48:36.164+09:00  INFO 26044 --- [           main] o.f.c.internal.license.VersionPrinter    : See release notes here: https://rd.gt/416ObMi
2023-08-25T13:48:36.164+09:00  INFO 26044 --- [           main] o.f.c.internal.license.VersionPrinter    : 
2023-08-25T13:48:36.171+09:00  INFO 26044 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
2023-08-25T13:48:36.284+09:00  INFO 26044 --- [           main] com.zaxxer.hikari.pool.HikariPool        : HikariPool-1 - Added connection com.mysql.cj.jdbc.ConnectionImpl@1983b48a
2023-08-25T13:48:36.286+09:00  INFO 26044 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
2023-08-25T13:48:36.310+09:00  INFO 26044 --- [           main] o.f.c.i.database.base.BaseDatabaseType   : Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
2023-08-25T13:48:36.330+09:00  WARN 26044 --- [           main] o.f.c.internal.database.base.Database    : Flyway upgrade recommended: MySQL 8.1 is newer than this version of Flyway and support has not been tested. The latest supported version of MySQL is 8.0.
2023-08-25T13:48:36.361+09:00  INFO 26044 --- [           main] o.f.core.internal.command.DbValidate     : Successfully validated 4 migrations (execution time 00:00.024s)
2023-08-25T13:48:36.380+09:00  INFO 26044 --- [           main] o.f.core.internal.command.DbMigrate      : Current version of schema `junhyunny-db`: 1.0.1
2023-08-25T13:48:36.391+09:00  INFO 26044 --- [           main] o.f.core.internal.command.DbMigrate      : Migrating schema `junhyunny-db` to version "1.0.3 - alerter user add colum address"
2023-08-25T13:48:36.441+09:00  INFO 26044 --- [           main] o.f.core.internal.command.DbMigrate      : Successfully applied 1 migration to schema `junhyunny-db`, now at version v1.0.3 (execution time 00:00.068s)
...
```

### 2.4. Using Lower Version Script

버전이 낮은 마이그레이션 스크립트를 작성합니다.

* V1.0.2__undo_V1.0.1

```sql
ALTER TABLE `junhyunny-db`.`tb_user` DROP COLUMN email; 
```

어플리케이션을 수행하면 다음과 같은 에러가 발생합니다.

* Validate failed: Migrations have failed validation
    * 유효성 검사에서 실패합니다.
* Detected resolved migration not applied to database: 1.0.2.
    * 적용된 가장 높은 버전보다 낮은 버전의 마이그레이션 스크립트가 존재해 에러가 발생합니다.

```
...
2023-08-25T14:09:50.971+09:00  INFO 28618 --- [           main] o.f.c.internal.license.VersionPrinter    : Flyway Community Edition 9.16.3 by Redgate
2023-08-25T14:09:50.972+09:00  INFO 28618 --- [           main] o.f.c.internal.license.VersionPrinter    : See release notes here: https://rd.gt/416ObMi
2023-08-25T14:09:50.972+09:00  INFO 28618 --- [           main] o.f.c.internal.license.VersionPrinter    : 
2023-08-25T14:09:50.983+09:00  INFO 28618 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
2023-08-25T14:09:51.090+09:00  INFO 28618 --- [           main] com.zaxxer.hikari.pool.HikariPool        : HikariPool-1 - Added connection com.mysql.cj.jdbc.ConnectionImpl@1983b48a
2023-08-25T14:09:51.091+09:00  INFO 28618 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
2023-08-25T14:09:51.115+09:00  INFO 28618 --- [           main] o.f.c.i.database.base.BaseDatabaseType   : Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
2023-08-25T14:09:51.136+09:00  WARN 28618 --- [           main] o.f.c.internal.database.base.Database    : Flyway upgrade recommended: MySQL 8.1 is newer than this version of Flyway and support has not been tested. The latest supported version of MySQL is 8.0.
2023-08-25T14:09:51.177+09:00  WARN 28618 --- [           main] ConfigServletWebServerApplicationContext : Exception encountered during context initialization - cancelling refresh attempt: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'flywayInitializer' defined in class path resource [org/springframework/boot/autoconfigure/flyway/FlywayAutoConfiguration$FlywayConfiguration.class]: Validate failed: Migrations have failed validation
Detected resolved migration not applied to database: 1.0.2.
To ignore this migration, set -ignoreMigrationPatterns='*:ignored'. To allow executing this migration, set -outOfOrder=true.
Need more flexibility with validation rules? Learn more: https://rd.gt/3AbJUZE
2023-08-25T14:09:51.178+09:00  INFO 28618 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Shutdown initiated...
2023-08-25T14:09:51.183+09:00  INFO 28618 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Shutdown completed.
2023-08-25T14:09:51.185+09:00  INFO 28618 --- [           main] o.apache.catalina.core.StandardService   : Stopping service [Tomcat]
2023-08-25T14:09:51.194+09:00  INFO 28618 --- [           main] .s.b.a.l.ConditionEvaluationReportLogger : 

Error starting ApplicationContext. To display the condition evaluation report re-run your application with 'debug' enabled.
2023-08-25T14:09:51.205+09:00 ERROR 28618 --- [           main] o.s.boot.SpringApplication               : Application run failed

org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'flywayInitializer' defined in class path resource [org/springframework/boot/autoconfigure/flyway/FlywayAutoConfiguration$FlywayConfiguration.class]: Validate failed: Migrations have failed validation
Detected resolved migration not applied to database: 1.0.2.
To ignore this migration, set -ignoreMigrationPatterns='*:ignored'. To allow executing this migration, set -outOfOrder=true.
Need more flexibility with validation rules? Learn more: https://rd.gt/3AbJUZE
    at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.initializeBean(AbstractAutowireCapableBeanFactory.java:1770) ~[spring-beans-6.0.11.jar:6.0.11]
    at org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.doCreateBean(AbstractAutowireCapableBeanFactory.java:598) ~[spring-beans-6.0.11.jar:6.0.11]
    ...
```

### 2.5. Change Migrated Script

사용자 엔티티 클래스를 다음과 같이 변경합니다. 

```java
package action.in.blog.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "tb_user")
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String name;
    private String address;
}
```

1.0.2 버전 스크립트 파일을 1.0.4 버전으로 변경 후 작업을 수행합니다. 
마이그레이션을 진행하기 전에 이전에 적용된 마이그레이션 스크립트의 내용을 변경합니다. 

* V1.0.1__alerter_user_add_colum_email
    * NOT NULL 키워드를 제거합니다.

```sql
ALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN email VARCHAR(50); 
```

어플리케이션을 실행하면 다음과 같은 에러가 발생합니다.

* Migration checksum mismatch for migration version 1.0.1
    * Flyway는 이미 적용된 스크립트 파일까지 관리합니다. 
    * 마이그레이션 이력 테이블의 체크섬과 비교하여 스크립트 파일의 변경을 감지합니다. 

```
...
2023-08-25T13:54:57.965+09:00  INFO 26996 --- [           main] o.f.c.internal.license.VersionPrinter    : Flyway Community Edition 9.16.3 by Redgate
2023-08-25T13:54:57.965+09:00  INFO 26996 --- [           main] o.f.c.internal.license.VersionPrinter    : See release notes here: https://rd.gt/416ObMi
2023-08-25T13:54:57.965+09:00  INFO 26996 --- [           main] o.f.c.internal.license.VersionPrinter    : 
2023-08-25T13:54:57.972+09:00  INFO 26996 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
2023-08-25T13:54:58.089+09:00  INFO 26996 --- [           main] com.zaxxer.hikari.pool.HikariPool        : HikariPool-1 - Added connection com.mysql.cj.jdbc.ConnectionImpl@2921199d
2023-08-25T13:54:58.091+09:00  INFO 26996 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
2023-08-25T13:54:58.114+09:00  INFO 26996 --- [           main] o.f.c.i.database.base.BaseDatabaseType   : Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
2023-08-25T13:54:58.136+09:00  WARN 26996 --- [           main] o.f.c.internal.database.base.Database    : Flyway upgrade recommended: MySQL 8.1 is newer than this version of Flyway and support has not been tested. The latest supported version of MySQL is 8.0.
2023-08-25T13:54:58.178+09:00  WARN 26996 --- [           main] ConfigServletWebServerApplicationContext : Exception encountered during context initialization - cancelling refresh attempt: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'flywayInitializer' defined in class path resource [org/springframework/boot/autoconfigure/flyway/FlywayAutoConfiguration$FlywayConfiguration.class]: Validate failed: Migrations have failed validation
Migration checksum mismatch for migration version 1.0.1
-> Applied to database : 276748304
-> Resolved locally    : 2104739103
Either revert the changes to the migration, or run repair to update the schema history.
Need more flexibility with validation rules? Learn more: https://rd.gt/3AbJUZE
...
```

flywayRepair 작업을 수행합니다.

* flywayRepair 명령어를 통해 마이그레이션 이력 테이블의 체크섬을 최신화합니다.

```
$ gradle flywayRepair

> Task :flywayRepair
Flyway upgrade recommended: MySQL 8.1 is newer than this version of Flyway and support has not been tested. The latest supported version of MySQL is 8.0.

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.3/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.
```

어플리케이션을 실행합니다.

* Current version of schema `junhyunny-db`: 1.0.3
    * 현재 적용된 버전은 1.0.3 입니다.
* Migrating schema `junhyunny-db` to version "1.0.4 - undo V1.0.1"
    * 1.0.4 버전의 마이그레이션 스크립트를 적용합니다.
* Successfully applied 1 migration to schema `junhyunny-db`, now at version v1.0.4 (execution time 00:00.069s)
    * 마이그레이션 작업이 정상적으로 수행됩니다.

```
...
2023-08-25T14:13:59.241+09:00  INFO 29405 --- [           main] o.f.c.internal.license.VersionPrinter    : Flyway Community Edition 9.16.3 by Redgate
2023-08-25T14:13:59.242+09:00  INFO 29405 --- [           main] o.f.c.internal.license.VersionPrinter    : See release notes here: https://rd.gt/416ObMi
2023-08-25T14:13:59.242+09:00  INFO 29405 --- [           main] o.f.c.internal.license.VersionPrinter    : 
2023-08-25T14:13:59.253+09:00  INFO 29405 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
2023-08-25T14:13:59.371+09:00  INFO 29405 --- [           main] com.zaxxer.hikari.pool.HikariPool        : HikariPool-1 - Added connection com.mysql.cj.jdbc.ConnectionImpl@1983b48a
2023-08-25T14:13:59.372+09:00  INFO 29405 --- [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
2023-08-25T14:13:59.396+09:00  INFO 29405 --- [           main] o.f.c.i.database.base.BaseDatabaseType   : Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
2023-08-25T14:13:59.415+09:00  WARN 29405 --- [           main] o.f.c.internal.database.base.Database    : Flyway upgrade recommended: MySQL 8.1 is newer than this version of Flyway and support has not been tested. The latest supported version of MySQL is 8.0.
2023-08-25T14:13:59.445+09:00  INFO 29405 --- [           main] o.f.core.internal.command.DbValidate     : Successfully validated 5 migrations (execution time 00:00.023s)
2023-08-25T14:13:59.464+09:00  INFO 29405 --- [           main] o.f.core.internal.command.DbMigrate      : Current version of schema `junhyunny-db`: 1.0.3
2023-08-25T14:13:59.475+09:00  INFO 29405 --- [           main] o.f.core.internal.command.DbMigrate      : Migrating schema `junhyunny-db` to version "1.0.4 - undo V1.0.1"
2023-08-25T14:13:59.525+09:00  INFO 29405 --- [           main] o.f.core.internal.command.DbMigrate      : Successfully applied 1 migration to schema `junhyunny-db`, now at version v1.0.4 (execution time 00:00.069s)
...
```

데이터베이스 정보를 확인합니다.

* 마이그레이션 이력 테이블에 undo 이력이 추가됩니다.
* 데이터베이스 컬럼이 삭제됩니다. 

```
mysql> select * from flyway_schema_history;
+----------------+---------+--------------------------------+------+--------------------------------------------+-------------+--------------+---------------------+----------------+---------+
| installed_rank | version | description                    | type | script                                     | checksum    | installed_by | installed_on        | execution_time | success |
+----------------+---------+--------------------------------+------+--------------------------------------------+-------------+--------------+---------------------+----------------+---------+
|              1 | 1.0.0   | create user                    | SQL  | V1.0.0__create_user.sql                    |  1435369412 | root         | 2023-08-25 02:37:20 |             28 |       1 |
|              2 | NULL    | insert users repeatable        | SQL  | R__insert_users_repeatable.sql             |  -392104774 | root         | 2023-08-25 02:37:21 |             13 |       1 |
|              3 | 1.0.1   | alerter user add colum email   | SQL  | V1.0.1__alerter_user_add_colum_email.sql   |  2104739103 | root         | 2023-08-25 04:34:20 |             21 |       1 |
|              4 | 1.0.3   | alerter user add colum address | SQL  | V1.0.3__alerter_user_add_colum_address.sql | -2115778683 | root         | 2023-08-25 04:48:36 |             23 |       1 |
|              5 | 1.0.4   | undo V1.0.1                    | SQL  | V1.0.4__undo_V1.0.1.sql                    | -1021114786 | root         | 2023-08-25 05:13:59 |             23 |       1 |
+----------------+---------+--------------------------------+------+--------------------------------------------+-------------+--------------+---------------------+----------------+---------+
5 rows in set (0.00 sec)
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-08-25-flyway-on-spring-boot>

#### REFERENCE

* <https://documentation.red-gate.com/fd/quickstart-gradle-184127577.html>
* <https://documentation.red-gate.com/fd/gradle-task-184127407.html>

[schema-migration-link]: https://junhyunny.github.io/information/database/schema-migration/
[flyway-cli-for-database-migration-link]: https://junhyunny.github.io/database/flyway/flyway-cli-for-database-migration/