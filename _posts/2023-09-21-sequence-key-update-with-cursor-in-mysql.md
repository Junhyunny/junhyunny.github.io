---
title: "Update Sequence Key with Cursor in MySQL"
search: false
category:
  - database
  - mysql
last_modified_at: 2023-09-21T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

## 1. Problem Context

테이블 스키마 모습이 적절하지 않아 변경 작업이 필요했습니다. 

* 비정형 문자열을 저장하는 두 개의 컬럼을 기본 키(PK, Primary Key)로 설정하고 있었습니다. 

```
+----------------+--------------+------+-----+---------+-------+
| Field          | Type         | Null | Key | Default | Extra |
+----------------+--------------+------+-----+---------+-------+
| JOURNAL_NAME   | varchar(100) | NO   | PRI | NULL    |       |
| PUBLISHER_NAME | varchar(100) | NO   | PRI | NULL    |       |
| JOURNAL_ID     | bigint       | YES  |     | NULL    |       |
| PUBLISHER_ID   | bigint       | YES  |     | NULL    |       |
+----------------+--------------+------+-----+---------+-------+
```

저널, 출판사 이름을 기본 키로 설정하는 경우 이름이 같은 경우가 발생한다면 문제가 발생할 수 있습니다. 
전 세계 저널과 출판사를 대상으로 하기 때문에 가능성이 없는 것은 아니었습니다. 
위 테이블을 다음과 같이 변경하고자 했습니다. 

* 기존 기본 키 삭제 및 NOT NULL 제약 조건 제거
* 새로운 ID 기본 키 추가
* 기본 키 자동 증가(auto increment) 설정 
* 저널 ID와 출판사 ID을 조합한 새로운 유니크 생성

```
+----------------+--------------+------+-----+---------+----------------+
| Field          | Type         | Null | Key | Default | Extra          |
+----------------+--------------+------+-----+---------+----------------+
| JOURNAL_NAME   | varchar(100) | YES  |     | NULL    |                |
| PUBLISHER_NAME | varchar(100) | YES  |     | NULL    |                |
| JOURNAL_ID     | bigint       | NO   | MUL | NULL    |                |
| PUBLISHER_ID   | bigint       | NO   |     | NULL    |                |
| ID             | bigint       | NO   | PRI | NULL    | auto_increment |
+----------------+--------------+------+-----+---------+----------------+
```

## 2. Solve the problem

실제 데이터는 약 40000건 이상 존재했지만, 이번 포스트에선 간단하게 10000건 임의 데이터를 만들어 정리하였습니다. 
원하는 작업을 수행하기 위해 일회성 어플리케이션을 만드는 일보다 SQL 스크립트 작성이 더 쉬운 길이라 판단했습니다. 
먼저 테이블에 ID 컬럼을 생성합니다. 

```
mysql> alter table JOURNAL_PUBLISHER_MAPPING add column ID bigint not null;
Query OK, 10000 rows affected (0.11 sec)
Records: 10000  Duplicates: 0  Warnings: 0
```

ID 컬럼을 기본 키로 변경하기 위해 데이터 업데이트 작업이 필요했습니다. 
이 문제는 간단한 프로시저(procedure)를 작성하여 처리하였습니다. 

### 2.1. Procedure

프로시저 개념에 대해 살펴보겠습니다. 
프로시저는 데이터베이스 관리 시스템(DBMS, Database Management System)에서 실행할 수 있는 하나 이상의 SQL 문장을 그룹으로 만들어 사용하는 데이터베이스 객체입니다. 
프로시저는 일련의 작업을 수행할 수 있으며, SQL 코드 블록을 만들어 재사용할 수 있습니다. 
다음과 같이 만들고, 호출할 수 있습니다. 

* CREATE 명령어를 통해 프로시저를 정의합니다.
    * 프로시저에 대한 파리미터가 추가될 수 있습니다.
* BEGIN, END 사이에 필요한 SQL 구문들을 작성합니다.
* CALL 명령어를 통해 생성한 프로시저를 실행합니다.

```sql
DELIMITER $$
CREATE PROCEDURE procedure_name (parameter1 data_type, parameter2 data_type, ...)
BEGIN
    -- SQL statements to be executed
END $$
DELIMITER ;

CALL procedure_name();
```

### 2.2. Cursor

데이터를 조회한 후 조작을 수행하기 때문에 프로시저 내부에서 커서(cursor)를 사용했습니다. 
데이터베이스 커서는 조회 결과 집합을 탐색하고 조작하기 위해 사용합니다. 
커서를 사용하면 일련의 데이터에 순차적으로 접근할 수 있습니다. 

다음과 같은 일련의 과정을 통해 커서를 사용합니다. 

1. DECLARE 
    * select 쿼리를 수행하여 조회한 결과를 사용하는 커서를 선언합니다.
1. OPEN 
    * 선언한 커서를 사용하기 위해 엽니다. 
1. FETCH 
    * 커서를 다음 행(row)으로 옮기는 작업을 수행합니다. 
    * INTO 키워드를 통해 커서가 가리키는 행의 데이터를 변수에 주입합니다. 
1. CLOSE
    * 커서 사용이 종료되면 닫습니다.

```sql
DECLARE cursor_name CURSOR FOR select_query;
OPEN cursor_name;

FETCH cursor_name INTO variables;

-- script to modify data

CLOSE cursor_name;
```

### 2.3. Update PK Procedure SQL

프로시저와 커서의 개념을 간단히 봤습니다. 
데이터 조작을 위한 UPDATE_JOURNAL_PUBLISHER_MAPPING 프로시저를 다음과 같습니다. 
프로시저 스크립트에 대한 설명은 가독성을 위해 주석으로 작성하였습니다.

```sql
delimiter $$
drop procedure if exists UPDATE_JOURNAL_PUBLISHER_MAPPING;
create procedure UPDATE_JOURNAL_PUBLISHER_MAPPING()
begin

    -- 프로시저에서 사용하는 변수들을 선언합니다.
    declare v_finished int default 0;
    declare v_count int default 0;
    declare v_journal_name varchar(100);
    declare v_publisher_name varchar(100);

    -- 커서를 선언합니다.
    declare mapping_cursor cursor for
        select JOURNAL_NAME, PUBLISHER_NAME 
          from JOURNAL_PUBLISHER_MAPPING 
          order by PUBLISHER_ID, JOURNAL_ID;
    
    -- 커서가 다음 데이터를 찾지 못하는 경우 이를 처리하기 위한 핸들러를 선언합니다.
    declare continue handler for not found set v_finished = 1;

    -- 커서를 오픈합니다.
    open mapping_cursor;
    -- 반복문을 수행합니다.
    update_loop:
    LOOP
        -- 다음 데이터를 fetch 하고, 해당 row 데이터를 각 변수에 주입합니다.
        fetch mapping_cursor into v_journal_name, v_publisher_name;
        
        -- 커서가 다음 데이터를 찾지 못하는 경우 반복문을 탈출합니다.
        if v_finished = 1 then 
            leave update_loop;
        end if;

        -- 카운트 변수 값을 1 증가시킵니다.
        set v_count = v_count + 1;
        
        -- 테이블을 업데이트합니다.
        update JOURNAL_PUBLISHER_MAPPING
        set ID = v_count
        where JOURNAL_NAME = v_journal_name
          and PUBLISHER_NAME = v_publisher_name;
    
    end LOOP update_loop;

    -- 반복문 작업이 종료되면 커서를 닫습니다.
    close mapping_cursor;

end $$
delimiter ;
```

선언한 프로시저를 수행합니다. 

```
mysql> call UPDATE_JOURNAL_PUBLISHER_MAPPING();
```

### 2.4. Modify Table Schema

남은 작업들을 수행합니다. 
이전 기본 키는 삭제하고 ID 컬럼을 새로운 기본 키로 선언합니다. 
저널 이름과 출판사 이름에 걸린 NOT NULL 제약 조건은 제거합니다.

```
mysql> ALTER TABLE JOURNAL_PUBLISHER_MAPPING DROP PRIMARY KEY, ADD PRIMARY KEY (`ID`);
Query OK, 10000 rows affected (0.08 sec)
Records: 10000  Duplicates: 0  Warnings: 0

mysql> ALTER TABLE JOURNAL_PUBLISHER_MAPPING MODIFY COLUMN JOURNAL_NAME VARCHAR(100);
Query OK, 10000 rows affected (0.09 sec)
Records: 10000  Duplicates: 0  Warnings: 0

mysql> ALTER TABLE JOURNAL_PUBLISHER_MAPPING MODIFY COLUMN PUBLISHER_NAME VARCHAR(100);
Query OK, 10000 rows affected (0.08 sec)
Records: 10000  Duplicates: 0  Warnings: 0
```

기본 키 ID 컬럼에 자동 증가 속성을 추가하고 초기 값을 지정합니다.

```
mysql> ALTER TABLE JOURNAL_PUBLISHER_MAPPING MODIFY COLUMN ID BIGINT NOT NULL AUTO_INCREMENT;
Query OK, 10000 rows affected (0.06 sec)
Records: 10000  Duplicates: 0  Warnings: 0

mysql> ALTER TABLE JOURNAL_PUBLISHER_MAPPING AUTO_INCREMENT = 20000;
Query OK, 10000 rows affected (0.06 sec)
Records: 10000  Duplicates: 0  Warnings: 0
```

저널 이름, 출판사 이름에 걸린 제약사항은 정리합니다. 저널 ID, 출판사 ID를 조합하여 유니크 키를 생성합니다. 

```
mysql> ALTER TABLE JOURNAL_PUBLISHER_MAPPING MODIFY COLUMN JOURNAL_ID BIGINT NOT NULL;
Query OK, 10000 rows affected (0.06 sec)
Records: 10000  Duplicates: 0  Warnings: 0

mysql> ALTER TABLE JOURNAL_PUBLISHER_MAPPING MODIFY COLUMN PUBLISHER_ID BIGINT NOT NULL;
Query OK, 10000 rows affected (0.05 sec)
Records: 10000  Duplicates: 0  Warnings: 0

mysql> ALTER TABLE JOURNAL_PUBLISHER_MAPPING ADD UNIQUE KEY JOURNAL_PUBLISHER_MAPPING_UK (JOURNAL_ID, PUBLISHER_ID);
Query OK, 10000 rows affected (0.07 sec)
Records: 10000  Duplicates: 0  Warnings: 0
```

#### REFERENCE

* [데이터베이스 커서](https://www.google.com/search?client=firefox-b-d&q=%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4+%EC%BB%A4%EC%84%9C)
* <https://www.geeksforgeeks.org/what-is-stored-procedures-in-sql/>
* <https://blog.duveen.me/19>
* <https://blog.duveen.me/20>
* <https://stackoverflow.com/questions/2169080/alter-a-mysql-column-to-be-auto-increment>