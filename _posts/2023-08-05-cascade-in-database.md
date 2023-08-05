---
title: "Cascade in Database"
search: false
category:
  - information
  - database
last_modified_at: 2023-08-05T23:55:00
---

<br/>

## 1. Referential Integrity in Database

관계형 데이터베이스(RDB, Relational Database)는 참조 무결성(referential integrity)이라는 개념이 존재합니다.

> Referential integrity is a property of data stating that all its references are valid. In the context of relational databases, it requires that if a value of one attribute (column) of a relation (table) references a value of another attribute (either in the same or a different relation), then the referenced value must exist.

참조 무결성이란 기본 키(primary key)와 외래 키(foreign key)로 연결된 테이블들의 데이터 관계(혹은 상태)를 일관성 있게 유지하려는 데이터베이스의 규칙입니다. 
참조 무결성 제약 조건(constraint)은 불법적인 연결이나 무효한 값이 삽입되는 것을 방지함으로써 데이터 무결성, 일관성을 보장합니다.

* 데이터 무결성
    * 외래 키가 참조하는 기본 키의 값은 항상 유효해야 합니다.
    * 자식 테이블의 외래 키 값에 해당하는 기본 키가 부모 테이블에 존재해야합니다. 
* 데이터 일관성
    * 데이터베이스 내의 관련된 테이블들이 항상 일관성 있게 유지됩니다.
    * 포스트(post) 테이블과 댓글(reply) 테이블 사이의 관계에서, 특정 댓글은 반드시 데이터베이스에 존재하는 포스트와 연결되어야 합니다. 

### 1.1. Practice

간단한 예시를 살펴보겠습니다. 
다음과 같은 테이블과 데이터를 준비합니다.

```sql
CREATE TABLE TB_POST (
    id int not null auto_increment,
    title varchar(255),
    content varchar(255),
    PRIMARY KEY (id)
);

CREATE TABLE TB_POST_REPLY (
    id int not null auto_increment,
    post_id int ,
    content varchar(255),
    PRIMARY KEY (id),
    FOREIGN KEY (post_id) REFERENCES TB_POST(id)
);

insert into TB_POST (title, content)
values 
    ('hello world', 'this is content for hello world'),
    ('referential integrity', 'this is content for referential integrity');

insert into TB_POST_REPLY (post_id, content)
values
    (1, 'this is 1st reply for hello world'),
    (1, 'this is 2nd reply for hello world'),
    (2, 'this is 1st reply for referential integrity');
```

#### 1.1.1. Delete Record from Parent Table

TB_POST 테이블에서 아이디가 1인 레코드(record)를 삭제하려면 다음과 같은 에러를 만납니다. 

* TB_POST_REPLY 테이블에 걸려있는 외래 키 제약 조건에 의해 부모 테이블의 레코드를 업데이트 혹은 삭제하지 못 합니다. 
    * 관련된 제약 조건은 `TB_POST_REPLY_ibfk_1`의 외래 키 `post_id` 입니다.
* 삭제하려는 레코드를 참조하는 자식 테이블의 레코드가 존재하기 때문에 발생하는 에러입니다. 
    * 자식 테이블의 레코드가 참조하는 부모 테이블의 레코드가 없는 것은 부자연스러운 모습입니다.

```sql
delete from TB_POST where id = 1;
ERROR 1451 (23000): Cannot delete or update a parent row: a foreign key constraint fails (`test`.`TB_POST_REPLY`, CONSTRAINT `TB_POST_REPLY_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `TB_POST` (`id`))
```

#### 1.1.2. Delete Record from Child Table

삭제 순서를 바꿔 자식 테이블 TB_POST_REPLY의 레코드를 삭제하고 부모 테이블 TB_POST의 레코드를 삭제하면 정상적으로 성공합니다.

* 참조 당하지 않는 자식 테이블의 레코드를 모두 삭제합니다.
* 부모 테이블의 레코드를 삭제합니다. 

```sql
delete from TB_POST_REPLY where post_id = 1;
Query OK, 2 rows affected (0.01 sec)

delete from TB_POST where id = 1;
Query OK, 1 row affected (0.00 sec)
```

## 2. Cascade in Database

`Cascade`는 참조 무결성에 관련된 옵션들 중 하나로 외래 키 제약 조건에 추가합니다. 
관계형 데이터베이스는 참조 관계를 맺은 테이블들의 상태를 신뢰성 있게 유지하기 위해 Cascade 옵션을 사용합니다. 
외래 키와 기본 키 사이의 관계를 유지하면서 특정 작업(업데이트 혹은 삭제)을 수행합니다. 
예를 들어 부모 테이블의 레코드를 삭제하는 경우 해당 변경을 적용할 때 영향을 받는 자식 테이블에 레코드도 자동으로 삭제하는 기능을 의미합니다. 

MySQL의 경우 외래 키 제약 조건에 다음과 같은 조건들을 추가할 수 있습니다. 

* RESTRICT
    * 부모 테이블의 레코드가 삭제되거나 업데이트되는 것을 금지합니다.
* Cascade
    * 부모 테이블의 레코드가 삭제되거나 업데이트 시 자식 테이블에 매칭되는 레코드를 삭제하거나 업데이트합니다. 
* SET NULL
    * 부모 테이블의 레코드가 삭제되거나 업데이트 시 자식 테이블에 매칭되는 레코드의 외래 키를 NULL로 변경합니다.
* NO ACTION
    * InnoDB의 경우 RESTRICT 설정과 동일합니다.
    * NDB의 경우 지연 검사를 지원하므로 NO ACTION은 지연 검사를 지정합니다.
        * 제한 조건 검사는 커밋 시간까지 수행되지 않습니다.
* SET DEFAULT
    * MySQL 파서(parser)에 의해 정의됩니다.
    * InnoDB와 NDB 모두 SET DEFAULT 절을 허용하지 않습니다. 

```
[CONSTRAINT [symbol]] FOREIGN KEY
    [index_name] (col_name, ...)
    REFERENCES tbl_name (col_name,...)
    [ON DELETE reference_option]
    [ON UPDATE reference_option]

reference_option:
    RESTRICT | CASCADE | SET NULL | NO ACTION | SET DEFAULT
```

### 2.1. Practice

다음과 같은 테이블과 데이터를 준비합니다.

* 답글 테이블에 만드는 외래 키에 Cascade 옵션을 추가합니다.
    * 업데이트와 삭제에 대해 Cascade 작업을 수행합니다. 

```sql
CREATE TABLE TB_POST (
    id int not null auto_increment,
    title varchar(255),
    content varchar(255),
    PRIMARY KEY (id)
);

CREATE TABLE TB_POST_REPLY (
    id int not null auto_increment,
    post_id int ,
    content varchar(255),
    PRIMARY KEY (id),
    FOREIGN KEY (post_id) 
        REFERENCES TB_POST(id) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE
);

insert into TB_POST (title, content)
values 
    ('hello world', 'this is content for hello world'),
    ('referential integrity', 'this is content for referential integrity');

insert into TB_POST_REPLY (post_id, content)
values
    (1, 'this is 1st reply for hello world'),
    (1, 'this is 2nd reply for hello world'),
    (2, 'this is 1st reply for referential integrity');
```

### 2.1.1. Delete Record from Parent Table

* 부모 테이블 레코드를 삭제하는 경우 자식 테이블의 연관된 레코드들도 함께 삭제됩니다.

```sql
delete from TB_POST where id = 1;
Query OK, 1 row affected (0.00 sec)

select * from TB_POST;
+----+-----------------------+-------------------------------------------+
| id | title                 | content                                   |
+----+-----------------------+-------------------------------------------+
|  2 | referential integrity | this is content for referential integrity |
+----+-----------------------+-------------------------------------------+
1 row in set (0.00 sec)

select * from TB_POST_REPLY;
+----+---------+---------------------------------------------+
| id | post_id | content                                     |
+----+---------+---------------------------------------------+
|  3 |       2 | this is 1st reply for referential integrity |
+----+---------+---------------------------------------------+
1 row in set (0.00 sec)
```

### 2.1.2. Update Record from Parent Table

* 부모 테이블의 레코드의 id를 변경합니다.
* 자식 테이블의 관련된 레코드들의 외래 키 값이 함께 변경됩니다.

```sql
update TB_POST set id = 1 where id = 2;
Query OK, 1 row affected (0.01 sec)
Rows matched: 1  Changed: 1  Warnings: 0

select * from TB_POST;
+----+-----------------------+-------------------------------------------+
| id | title                 | content                                   |
+----+-----------------------+-------------------------------------------+
|  1 | referential integrity | this is content for referential integrity |
+----+-----------------------+-------------------------------------------+
1 row in set (0.00 sec)

select * from TB_POST_REPLY;
+----+---------+---------------------------------------------+
| id | post_id | content                                     |
+----+---------+---------------------------------------------+
|  3 |       1 | this is 1st reply for referential integrity |
+----+---------+---------------------------------------------+
1 row in set (0.00 sec)
```

## 2.2. Cascade Pros and Cons

Cascade 옵션 설정은 편리하지만, 주의해서 사용해야합니다. 
다음과 같은 장점이 있습니다. 

* 외래 키와 기본 키 사이의 관계가 유지됨으로써 데이터 무결성이 보장됩니다.
    * 부모 테이블의 레코드가 삭제되거나 갱신될 때 자동으로 자식 테이블의 레코드들도 변경되므로 일관성이 유지됩니다.
* 데이터를 관리에 관련된 작업이 간소해질 수 있습니다.
    * 관련된 데이터를 일일이 삭제할 필요가 없습니다.
    * 부모 테이블의 레코드를 삭제할 때 자식 테이블의 관련 레코드들도 함께 자동으로 삭제됩니다.

다음과 같은 단점이 있습니다.

* 데이터 손실의 위험성이 있습니다.
    * 부모 테이블의 레코드를 삭제하면 연결된 자식 테이블이 레코드들도 자동으로 삭제됩니다.
    * 실수로 데이터를 삭제하거나 잘못된 레코드를 삭제하는 경우 영향을 받는 다른 테이블들의 데이터도 함께 삭제됩니다.
* Cascade 설정을 사용하면 데이터베이스의 관계가 복잡해집니다. 
* Cascade 설정에 의해 수행되는 작업은 여러 테이블에 영향을 미치지 때문에 대량의 데이터가 있는 경우 성능에 영향을 줄 수 있습니다. 

#### RECOMMEND NEXT 

* [CascadeType in JPA][jpa-cascade-type-link]

#### REFERENCE

* <https://en.wikipedia.org/wiki/Referential_integrity>
* <https://joel-dev.site/90>
* <https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html>
* <https://chat.openai.com>

[jpa-cascade-type-link]: https://junhyunny.github.io/spring-boot/jpa/junit/jpa-cascade-type/