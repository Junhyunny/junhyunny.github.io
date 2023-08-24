---
title: "Flyway CLI for Database Migration"
search: false
category:
  - database
  - flyway
last_modified_at: 2023-08-23T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Schema Migration][schema-migration-link]

## 1. Flyway

[Schema Migration][schema-migration-link]에서 이야기했듯이 스키마 마이그레이션 작업은 도구를 사용하는 것이 좋습니다. 
`Flyway`는 `Liquibase`와 같은 대표적인 오픈 소스 데이터베이스 마이그레이션 도구입니다. 
데이터베이스의 변경 사항을 추적하고 스키마 변경이나 롤백을 쉽게 도와줍니다. 
깃(git)이 코드 형상 관리 도구라면 Flyway는 데이터베이스 변경에 대한 형상 관리를 지원합니다. 

다음과 같은 환경에서 사용할 수 있는 API를 제공합니다. 

* Command Line
* Docker
* Maven
* Gradle

CLI 환경에서 Flyway를 사용하는 방법에 대해 정리하였습니다. 

### 1.1. Commands

주로 사용하는 명령어들은 다음과 같습니다. 

* baseline
    * 현재 데이터베이스 스키마 상태를 시작점으로 새로운 버전 이력을 쌓습니다.
    * 새로운 기준점 이전의 마이그레이션은 모두 무시합니다.
    * 마이그레이션 이력 테이블을 생성합니다.

<p align="center">
    <img src="/images/flyway-cli-for-database-migration-1.JPG" width="100%" class="image__border image__padding">
</p>
<center>https://documentation.red-gate.com/fd/baseline-184127456.html</center>

* info
    * 현재까지의 마이그레이션 작업 이력에 대한 정보를 보여줍니다.
    * 로컬에 저장된 적용되지 않은 마이그레이션 스크립트 파일에 대한 정보를 보여줍니다.

<p align="center">
    <img src="/images/flyway-cli-for-database-migration-2.JPG" width="100%" class="image__border image__padding">
</p>
<center>https://documentation.red-gate.com/fd/info-184127459.html</center>

* migrate
    * 가장 큰 버전을 가진 스크립트까지 스키마 마이그레이션 작업을 수행합니다.
    * 변경 작업에 대한 내용을 마이그레이션 이력 테이블에 저장합니다.

<p align="center">
    <img src="/images/flyway-cli-for-database-migration-3.JPG" width="100%" class="image__border image__padding">
</p>
<center>https://documentation.red-gate.com/fd/migrate-184127460.html</center>

* repair
    * 실패한 마이그레이션 이력을 대기(pending) 상태로 변경합니다.
    * 이전에 수행된 마이그레이션 스크립트가 없어진 경우 이력 테이블의 해당 마이그레이션 상태를 삭제(delete)로 변경합니다.
    * 이전에 수행된 마이그레이션 스크립트가 변경된 경우 이력 테이블의 해당 체크섬(checksum)을 업데이트합니다. 

<p align="center">
    <img src="/images/flyway-cli-for-database-migration-4.JPG" width="100%" class="image__border image__padding">
</p>
<center>https://documentation.red-gate.com/fd/repair-184127461.html</center>

* validate
    * 마이그레이션 이력 테이블 상태와 로컬에 저장된 마이그레이션 스크립트 상태를 비교합니다.

<p align="center">
    <img src="/images/flyway-cli-for-database-migration-5.JPG" width="100%" class="image__border image__padding">
</p>
<center>https://documentation.red-gate.com/fd/validate-184127464.html</center>

* undo
    * Teams(유료 버전)부터 사용 가능합니다.
    * 이전 상태로 롤백합니다.

<p align="center">
    <img src="/images/flyway-cli-for-database-migration-6.JPG" width="100%" class="image__border image__padding">
</p>
<center>https://documentation.red-gate.com/fd/undo-184127463.html</center>

* clean
    * 마이그레이션 이력 테이블과 함께 데이터베이스의 모든 테이블을 드랍(drop)합니다.
    * 운영 환경에서 사용되지 않도록 주의가 필요합니다.

<p align="center">
    <img src="/images/flyway-cli-for-database-migration-7.JPG" width="100%" class="image__border image__padding">
</p>
<center>https://documentation.red-gate.com/fd/clean-184127458.html</center>

### 1.2. Migration Script Naming Rule

마이그레이션 스크립트 이름은 다음과 같은 규칙을 따라 작성합니다. 

* 스크립트 종류를 접두어(prefix)로 구분합니다.
    * V - 버전 마이그레이션 파일
    * U - 롤백 마이그레이션 파일
    * R - 반복 수행 마이그레이션 파일
* 접두어 뒤에 버전 정보를 추가합니다.
    * V, U 마이그레이션 파일에만 추가합니다.
    * 1, 1.0, 1.0.1, 20230823(날짜) 등의 포맷을 자유롭게 사용 가능하지만, 반드시 순서를 지정할 수 있어야합니다.
* 구분자는 __(언더바 2개)를 사용합니다.
    * 구분자는 접두어 혹은 버전과 설명(description) 사이를 구분합니다. 
    * _(언더바 1개)는 단어를 띄어쓰는 용도로 사용합니다.
* 마이그레이션 스크립트가 어떤 동작을 수행하는지 간략한 설명(description)을 작성합니다.
* 접미어는 .sql 확장자를 사용합니다.

<p align="center">
    <img src="/images/flyway-cli-for-database-migration-8.JPG" width="100%" class="image__border">
</p>

## 2. Practice

맥북(mac book)에서 실습을 진행하였습니다. 
프로젝트 구조는 다음과 같습니다. 

```
./
├── docker-compose.yml
├── flyway.conf
├── migration
│   └── V1.0.0__create_user.sql
├── report.html
├── report.json
├── seed
│   └── R__insert_users_repeatable.sql
├── temp
│   ├── V1.0.1__alerter_user_add_colum_email.sql
│   └── V1.0.3__alerter_user_add_colum_address.sql
└── undo
    └── V1.0.2__undo_V1.0.1.sql
```

### 2.1. Install

홈브루(homebrew)를 통해 쉽게 설치가 가능합니다.

```
$ brew install flyway

$ flyway -v
Flyway Community Edition 9.21.1 by Redgate

Plugin Name           | Version         | Licensed
--------------------- | --------------- | --------
SqlFluffRulesEngine   | not installed   | Licensed
```

### 2.2. Setup Database

테스트를 위한 컨테이너 데이터베이스를 준비합니다. 
도커 컴포즈를 사용하였습니다. 

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
[+] Running 1/0
 ✔ Container mysql-container  Running
```

### 2.3. Flyway Configuration

Flyway는 다음과 같은 경로에 작성된 설정 파일을 사용합니다. 

* installDir/conf/flyway.conf
    * Flyway 설치 경로
* userhome/flyway.conf
    * 사용자 홈 경로
* workingDir/flyway.conf
    * 프로젝트 경로

이번 실습은 프로젝트 경로의 `flyway.conf` 파일을 사용하였습니다. 
설정 파일에 다음과 같은 정보를 작성합니다.

* 데이터베이스 접속 정보
* 마이그레이션 파일 경로

```conf
flyway.url=jdbc:mysql://localhost:3306/junhyunny-db?allowPublicKeyRetrieval=true&useSSL=false
flyway.user=root
flyway.password=password!1234
flyway.locations=filesystem:migration,filesystem:seed
```

### 2.4. Init 

다음과 같은 마이그레이션 스크립트들을 먼저 적용합니다. 

* V1.0.0__create_user

```sql
CREATE TABLE IF NOT EXISTS `junhyunny-db`.`tb_user`(
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;
```

* R__insert_users_repeatable

```sql
insert into `junhyunny-db`.`tb_user` (name) values ('junhyunny');
insert into `junhyunny-db`.`tb_user` (name) values ('jua');
```

빈 데이터베이스 상태에서 info 명령어를 수행합니다.

* 설정 파일에서 지정한 migration, seed 경로에 저장된 스크립트만 적용 대상입니다. 
* 각 파일의 종류, 버전, 설명이 표시되며 두 파일 모두 현재 대기 상태입니다.

```
$ flyway info

Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
Schema history table `junhyunny-db`.`flyway_schema_history` does not exist yet
Schema version: << Empty Schema >>

+------------+---------+-------------------------+------+--------------+---------+----------+
| Category   | Version | Description             | Type | Installed On | State   | Undoable |
+------------+---------+-------------------------+------+--------------+---------+----------+
| Versioned  | 1.0.0   | create user             | SQL  |              | Pending | No       |
| Repeatable |         | insert users repeatable | SQL  |              | Pending |          |
+------------+---------+-------------------------+------+--------------+---------+----------+

A Flyway report has been generated here: /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2023-08-23-flyway-cli-for-database-migration/action-in-blog/report.html
```

migrate 명령어를 수행합니다.

* 설정 파일에서 지정한 데이터베이스에 마이그레이션을 수행합니다.

```
$ flyway migrate

Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
Schema history table `junhyunny-db`.`flyway_schema_history` does not exist yet
Successfully validated 2 migrations (execution time 00:00.019s)
Creating Schema History table `junhyunny-db`.`flyway_schema_history` ...
Current version of schema `junhyunny-db`: << Empty Schema >>
Migrating schema `junhyunny-db` to version "1.0.0 - create user"
Migrating schema `junhyunny-db` with repeatable migration "insert users repeatable"
Successfully applied 2 migrations to schema `junhyunny-db`, now at version v1.0.0 (execution time 00:00.037s)
A Flyway report has been generated here: /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2023-08-23-flyway-cli-for-database-migration/action-in-blog/report.html
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
mysql> show tables;
+------------------------+
| Tables_in_junhyunny-db |
+------------------------+
| flyway_schema_history  |
| tb_user                |
+------------------------+
2 rows in set (0.01 sec)

mysql> select * from flyway_schema_history;
+----------------+---------+-------------------------+------+--------------------------------+------------+--------------+---------------------+----------------+---------+
| installed_rank | version | description             | type | script                         | checksum   | installed_by | installed_on        | execution_time | success |
+----------------+---------+-------------------------+------+--------------------------------+------------+--------------+---------------------+----------------+---------+
|              1 | 1.0.0   | create user             | SQL  | V1.0.0__create_user.sql        |  777397927 | root         | 2023-08-23 19:52:11 |             26 |       1 |
|              2 | NULL    | insert users repeatable | SQL  | R__insert_users_repeatable.sql | -392104774 | root         | 2023-08-23 19:52:11 |             11 |       1 |
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

### 2.5. Fail and Repair

다음과 같은 스키마 변경 작업 파일을 추가합니다.

* V1.0.1__alerter_user_add_colum_email

```sql
ALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN email VARCHAR(50) NOT NULL; 
```

* V1.0.3__alerter_user_add_colum_address
    * 일부러 오타로 작성하여 마이그레이션을 실패를 유도합니다.

```sql
AALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN address VARCHAR(50) NOT NULL; 
```

마이그레이션을 진행합니다.

* 1.0.3 버전의 마이그레이션이 실패합니다.

```
$ flyway migrate

Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
Successfully validated 4 migrations (execution time 00:00.028s)
Current version of schema `junhyunny-db`: 1.0.0
Migrating schema `junhyunny-db` to version "1.0.1 - alerter user add colum email"
Migrating schema `junhyunny-db` to version "1.0.3 - alerter user add colum address"
ERROR: Migration of schema `junhyunny-db` to version "1.0.3 - alerter user add colum address" failed! Please restore backups and roll back database and code!
A Flyway report has been generated here: /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2023-08-23-flyway-cli-for-database-migration/action-in-blog/report.html
ERROR: Migration V1.0.3__alerter_user_add_colum_address.sql failed
-----------------------------------------------------------
SQL State  : 42000
Error Code : 1064
Message    : (conn=155) You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'AALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN address VARCHAR(50) NOT NULL' at line 1
Location   : migration/V1.0.3__alerter_user_add_colum_address.sql (/Users/junhyunk/Desktop/workspace/blog/blog-in-action/2023-08-23-flyway-cli-for-database-migration/action-in-blog/migration/V1.0.3__alerter_user_add_colum_address.sql)
Line       : 1
Statement  : AALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN address VARCHAR(50) NOT NULL

Caused by: Migration V1.0.3__alerter_user_add_colum_address.sql failed
-----------------------------------------------------------
SQL State  : 42000
Error Code : 1064
Message    : (conn=155) You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'AALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN address VARCHAR(50) NOT NULL' at line 1
Location   : migration/V1.0.3__alerter_user_add_colum_address.sql (/Users/junhyunk/Desktop/workspace/blog/blog-in-action/2023-08-23-flyway-cli-for-database-migration/action-in-blog/migration/V1.0.3__alerter_user_add_colum_address.sql)
Line       : 1
Statement  : AALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN address VARCHAR(50) NOT NULL

Caused by: java.sql.SQLSyntaxErrorException: (conn=155) You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'AALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN address VARCHAR(50) NOT NULL' at line 1
Caused by: org.mariadb.jdbc.internal.util.exceptions.MariaDbSqlException: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'AALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN address VARCHAR(50) NOT NULL' at line 1
Caused by: java.sql.SQLException: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'AALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN address VARCHAR(50) NOT NULL' at line 1
```

현재까지 진행된 마이그레이션 상태를 확인합니다.

* 1.0.1 버전 마이그레이션은 성공입니다.
* 1.0.3 버전 마이그레이션은 실패 상태입니다.

```
$ flyway info   

Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
Schema version: 1.0.3

+------------+---------+--------------------------------+------+---------------------+---------+----------+
| Category   | Version | Description                    | Type | Installed On        | State   | Undoable |
+------------+---------+--------------------------------+------+---------------------+---------+----------+
| Versioned  | 1.0.0   | create user                    | SQL  | 2023-08-23 19:52:11 | Success | No       |
| Repeatable |         | insert users repeatable        | SQL  | 2023-08-23 19:52:11 | Success |          |
| Versioned  | 1.0.1   | alerter user add colum email   | SQL  | 2023-08-23 20:04:21 | Success | No       |
| Versioned  | 1.0.3   | alerter user add colum address | SQL  | 2023-08-23 20:04:21 | Failed  | No       |
+------------+---------+--------------------------------+------+---------------------+---------+----------+

A Flyway report has been generated here: /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2023-08-23-flyway-cli-for-database-migration/action-in-blog/report.html
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
|              1 | 1.0.0   | create user                    | SQL  | V1.0.0__create_user.sql                    |   777397927 | root         | 2023-08-23 19:52:11 |             26 |       1 |
|              2 | NULL    | insert users repeatable        | SQL  | R__insert_users_repeatable.sql             |  -392104774 | root         | 2023-08-23 19:52:11 |             11 |       1 |
|              3 | 1.0.1   | alerter user add colum email   | SQL  | V1.0.1__alerter_user_add_colum_email.sql   |  2058811609 | root         | 2023-08-23 20:04:21 |             24 |       1 |
|              4 | 1.0.3   | alerter user add colum address | SQL  | V1.0.3__alerter_user_add_colum_address.sql | -1536911564 | root         | 2023-08-23 20:04:21 |             13 |       0 |
+----------------+---------+--------------------------------+------+--------------------------------------------+-------------+--------------+---------------------+----------------+---------+
4 rows in set (0.00 sec)
```

1.0.3 버전 마이그레이션 스크립트를 정상적으로 수정하고 migrate 명령어를 수행하면 다음과 같은 에러가 발생합니다. 
repair 명령어를 수행하고 마이그레이션을 재수행합니다.

* 이전에 실패한 이력 때문에 마이그레이션을 진행하지 않습니다.
* repair 명령어를 통해 실패한 이력을 대기 상태로 변경합니다.

```
$ flyway migrate

Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
ERROR: Validate failed: Migrations have failed validation
Detected failed migration to version 1.0.3 (alerter user add colum address).
Please remove any half-completed changes then run repair to fix the schema history.
Need more flexibility with validation rules? Learn more: https://rd.gt/3AbJUZE

$ flyway repair 

Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
Successfully repaired schema history table `junhyunny-db`.`flyway_schema_history` (execution time 00:00.039s).
Manual cleanup of the remaining effects of the failed migration may still be required.

$ flyway migrate

Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
Successfully validated 4 migrations (execution time 00:00.028s)
Current version of schema `junhyunny-db`: 1.0.1
Migrating schema `junhyunny-db` to version "1.0.3 - alerter user add colum address"
Successfully applied 1 migration to schema `junhyunny-db`, now at version v1.0.3 (execution time 00:00.024s)
A Flyway report has been generated here: /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2023-08-23-flyway-cli-for-database-migration/action-in-blog/report.html
```

### 2.6. Using Lower Version Script

버전이 낮은 마이그레이션 스크립트를 작성합니다.

* V1.0.2__undo_V1.0.1

```sql
ALTER TABLE `junhyunny-db`.`tb_user` DROP COLUMN email; 
```

info 명령어를 통해 상태를 확인합니다.

* 새로 추가된 1.0.2 버전의 스크립트 파일은 무시(ignored)됩니다.
* 마지막으로 버전보다 높은 버전의 스크립트만 적용됩니다.

```
$ flyway info   

Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
Schema version: 1.0.3

+------------+---------+--------------------------------+------+---------------------+---------+----------+
| Category   | Version | Description                    | Type | Installed On        | State   | Undoable |
+------------+---------+--------------------------------+------+---------------------+---------+----------+
| Versioned  | 1.0.0   | create user                    | SQL  | 2023-08-23 19:52:11 | Success | No       |
| Repeatable |         | insert users repeatable        | SQL  | 2023-08-23 19:52:11 | Success |          |
| Versioned  | 1.0.1   | alerter user add colum email   | SQL  | 2023-08-23 20:04:21 | Success | No       |
| Versioned  | 1.0.3   | alerter user add colum address | SQL  | 2023-08-23 20:12:34 | Success | No       |
| Versioned  | 1.0.2   | undo V1.0.1                    | SQL  |                     | Ignored | No       |
+------------+---------+--------------------------------+------+---------------------+---------+----------+

A Flyway report has been generated here: /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2023-08-23-flyway-cli-for-database-migration/action-in-blog/report.html
```

### 2.7. Change Migrated Script

1.0.2 버전 스크립트 파일을 1.0.4 버전으로 변경 후 작업을 수행합니다. 
마이그레이션을 진행하기 전에 이전에 사용한 마이그레이션 스크립트를 변경합니다. 

* V1.0.1__alerter_user_add_colum_email
    * NOT NULL 키워드를 제거합니다.

```sql
ALTER TABLE `junhyunny-db`.`tb_user` ADD COLUMN email VARCHAR(50); 
```

migrate 명령어 수행이 실패합니다. 

* Flyway는 이미 적용된 스크립트 파일을 관리합니다. 
* 마이그레이션 이력 테이블의 체크섬과 비교하여 스크립트 파일의 변경을 감지합니다. 

```
$ flyway migrate

Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
ERROR: Validate failed: Migrations have failed validation
Migration checksum mismatch for migration version 1.0.1
-> Applied to database : 2058811609
-> Resolved locally    : 1679405429
Either revert the changes to the migration, or run repair to update the schema history.
Need more flexibility with validation rules? Learn more: https://rd.gt/3AbJUZE
```

프로젝트 상황에 맞게 해당 에러를 수정합니다.

* 스크립트 파일을 이전 상태로 복구합니다.
* repair 명령어를 통해 마이그레이션 이력 테이블의 체크섬을 최신화합니다.

```
$ flyway repair 

Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
Repair of failed migration in Schema History table `junhyunny-db`.`flyway_schema_history` not necessary. No failed migration detected.
Repairing Schema History table for version 1.0.1 (Description: alerter user add colum email, Type: SQL, Checksum: 1679405429)  ...
Successfully repaired schema history table `junhyunny-db`.`flyway_schema_history` (execution time 00:00.039s).

$ flyway migrate

Database: jdbc:mysql://localhost:3306/junhyunny-db (MySQL 8.1)
Successfully validated 5 migrations (execution time 00:00.027s)
Current version of schema `junhyunny-db`: 1.0.3
Migrating schema `junhyunny-db` to version "1.0.4 - undo V1.0.1"
Successfully applied 1 migration to schema `junhyunny-db`, now at version v1.0.4 (execution time 00:00.024s)
A Flyway report has been generated here: /Users/junhyunk/Desktop/workspace/blog/blog-in-action/2023-08-23-flyway-cli-for-database-migration/action-in-blog/report.html
```

데이터베이스 정보를 확인합니다.

* 마이그레이션 이력 테이블에 undo 이력이 추가됩니다.
* 데이터베이스 컬럼이 삭제됩니다. 

```
mysql> select * from flyway_schema_history;
+----------------+---------+--------------------------------+------+--------------------------------------------+-------------+--------------+---------------------+----------------+---------+
| installed_rank | version | description                    | type | script                                     | checksum    | installed_by | installed_on        | execution_time | success |
+----------------+---------+--------------------------------+------+--------------------------------------------+-------------+--------------+---------------------+----------------+---------+
|              1 | 1.0.0   | create user                    | SQL  | V1.0.0__create_user.sql                    |   777397927 | root         | 2023-08-23 19:52:11 |             26 |       1 |
|              2 | NULL    | insert users repeatable        | SQL  | R__insert_users_repeatable.sql             |  -392104774 | root         | 2023-08-23 19:52:11 |             11 |       1 |
|              3 | 1.0.1   | alerter user add colum email   | SQL  | V1.0.1__alerter_user_add_colum_email.sql   |  1679405429 | root         | 2023-08-23 20:04:21 |             24 |       1 |
|              4 | 1.0.3   | alerter user add colum address | SQL  | V1.0.3__alerter_user_add_colum_address.sql |  1950309165 | root         | 2023-08-23 20:12:34 |             24 |       1 |
|              5 | 1.0.4   | undo V1.0.1                    | SQL  | V1.0.4__undo_V1.0.1.sql                    | -1021114786 | root         | 2023-08-23 20:24:06 |             24 |       1 |
+----------------+---------+--------------------------------+------+--------------------------------------------+-------------+--------------+---------------------+----------------+---------+
5 rows in set (0.00 sec)

mysql> select * from tb_user;;
+----+-----------+---------+
| id | name      | address |
+----+-----------+---------+
|  1 | junhyunny |         |
|  2 | jua       |         |
+----+-----------+---------+
2 rows in set (0.01 sec)
```

## CLOSING

커뮤니티 버전은 롤백 기능이 제공되지 않습니다. 
커뮤니티 버전에서 문제가 발생했을 때 대처를 위한 롤백 전략이 필요해 보입니다. 

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-08-23-flyway-cli-for-database-migration>

<!-- #### RECOMMEND NEXT POSTS

* [Flyway on Spring Boot][] -->

#### REFERENCE

* <https://documentation.red-gate.com/fd/why-database-migrations-184127574.html>
* <https://documentation.red-gate.com/fd/quickstart-how-flyway-works-184127223.html>
* <https://documentation.red-gate.com/fd/commands-184127446.html>
* <https://documentation.red-gate.com/fd/configuration-files-184127472.html>
* <https://www.red-gate.com/blog/database-devops/flyway-naming-patterns-matter>

[schema-migration-link]: https://junhyunny.github.io/information/database/schema-migration/