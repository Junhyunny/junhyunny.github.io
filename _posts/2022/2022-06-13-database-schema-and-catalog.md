---
title: "데이터베이스 스키마(schema)와 카탈로그(catalog)"
search: false
category:
  - database
last_modified_at: 2022-06-13T23:55:00
---

<br/>

## 0. 들어가면서

프로젝트 막바지에 레거시 시스템에서 사용 중인 MySQL 데이터베이스의 테이블을 사용하게 되면서 새로운 스키마(schema) 연결이 필요했다. JPA(Java Persistence API) `@Table` 애너테이션의 `schema` 속성을 사용했는데, 생각과 다르게 해당 스키마에서 테이블들을 찾을 수 없었다. 결국 `catalog` 속성에 스키마 정보를 설정하여 문제를 해결했는데, 문제 해결 과정을 글로 정리하기 전에 스키마와 카탈로그에 개념에 대해 먼저 정리가 필요하다고 생각해서 이번 글로 정리했다.

## 1. Database Schema

먼저 데이터베이스 스키마의 개념을 찾아봤다.

> Wikipedia<br/>
> 데이터베이스 스키마(database schema)는 데이터베이스에서 자료의 구조, 자료의 표현 방법, 자료 간의 관계를 형식 언어로 정의한 구조이다. 

데이터베이스 스키마에는 다음과 같은 내용들에 대해 정의되어 있다.

- 데이터베이스를 구성하는 테이블 정보(이름, 필드, 데이터 타입 등)와 테이블 간 관계(relationship) 같은 정보
- 데이터 조작 시 데이터 값들이 갖는 논리적인 제약 조건(constraints)
  - NOT NULL, UNIQUE, PRIMARY KEY, FOREIGN KEY, DEFAULT, INDEX 등

데이터베이스 스키마는 3계층 구조로 이뤄진다.

- 외부 스키마(External Schema) = 사용자 뷰(view)
- 개념 스키마(Conceptual Schema) = 전체적인 뷰(view)
- 내부 스키마(Internal Schema) = 물리적 저장 장치 수준과 연관된 데이터베이스 구조

각 스키마 개념들을 좀 더 자세히 다뤄보자. 외부 스키마는 각 사용자 혹은 어플리케이션 별로 필요하는 데이터베이스 논리적 구조를 의미한다. 전체 스키마 정보 중에서 일부분만 볼 수 있기 때문에 서브 스키마(sub schema)라고도 한다. 하나의 데이터베이스 시스템에는 여러 개의 외부 스키마가 존재할 수 있다. 시스템을 운영하면 사용자 별로 권한을 나눠 접근할 수 있는 테이블들을 제한하는데, 이를 의미하는 것 같다. 일반 사용자와 어플리케이션은 SQL 질의를 통해 데이터베이스에서 원하는 결과를 얻는다.

개념 스키마는 데이터베이스에 하나만 존재하며, 전체적인 논리 구조로서 모든 어플리케이션이나 사용자들이 필요로 하는 정보들을 의미한다. 테이블을 구성하는 정보(이름, 필드, 데이터 타입 등)들과 테이블 간의 관계, 제약 조건 등에 관한 내용을 정한다. 이 뿐만 아니라 접근 권한, 보안 및 무결성 규칙에 관련된 명세를 정한다. 일반적으로 말하는 `스키마`는 개념 스키마를 의미한다. 데이터베이스 관리자(DBA)에 의해 구성된다.

내부 스키마는 물리적 저장 장치 수준과 연관된 데이터베이스 구조다. 실제로 저장되는 레코드(record)의 물리적인 구조를 정의하고, 저장 데이터 항목의 표현 방법, 내부 레코드의 물리적 순서 등을 나타낸다. 데이터베이스의 스키마 계층 구조는 다음과 같이 표현할 수 있다.

<div align="center">
  <img src="/images/posts/2022/database-schema-and-catalog-01.png" width="80%" class="image__border">
</div>
<center>https://techvu.dev/131</center>

## 2. Database Catalog

다음으로 카탈로그 개념을 찾아봤다.

> Wikipedia<br/>
> 데이터베이스 카탈로그는 데이터베이스의 개체들에 대한 정의를 담고 있는 메타-데이터(meta-data)들로 구성된 데이터베이스 내의 인스턴스이다. 
> 기본 테이블, 뷰 테이블, 동의어(synonym)들, 값 범위들, 인덱스들, 사용자들, 사용자 그룹 등과 같은 데이터베이스의 개체들이 저장된다. 

카탈로그는 데이터베이스 시스템 내의 모든 객체에 대한 정의와 명세다. 데이터 사전(data-dictionary)라고 불리기도 하며, 카탈로그에 저장된 내용을 메타-데이터라고 한다. DDL(data definition language) 실행 결과로 생성되는 기본 테이블, 뷰 테이블, 동의어, 값 범위, 인덱스, 사용자, 사용자 그룹, 스키마 정보 등이 저장된다. 데이터베이스 종류에 따라 다른 구조를 가지며, 데이터베이스 관리 시스템(DBMS, database management system)에 의해 스스로 생성되고 유지된다. 

시스템 카탈로그는 시스템 테이블로 구성되어 있기 때문에 일반 사용자도 SQL 질의를 통해 내용을 검색할 수 있다. 하지만 INSERT, DELETE, UPDATE 등의 쿼리로 카탈로그 정보를 직접 변경하는 것은 불가능하다. 사용자가 DDL을 통해 테이블 뷰, 인덱스 등에 변화를 주면 시스템에 의해 자동으로 갱신된다. 

스키마와 카탈로그의 차이점은 뭘까? 스키마도 테이블 정보(이름, 필드, 데이터 타입 등), 테이블 간 관계(relationship)와 제약 조건 등이 저장되는데, 카탈로그와 무슨 차이가 존재하는지 궁금헀다. 스택 오버플로우에서 관련된 답변을 찾을 수 있었다. 

- 카탈로그는 모든 종류의 스키마와 관련된 연결 고리들을 지닌 공간이다.
- 카탈로그는 시스템에 관심이 있는 다양한 개체들에 대한 자세한 정보들을 포함하고 있다.
- 카탈로그는 SQL 환경의 스키마들에 대한 묶음이다.
- 카탈로그는 한 개 이상의 스키마를 가질 수 있으며 `INFORMATION_SCHEMA`라는 이름의 스키마는 항상 가지고 있다. 
- 카탈로그는 보통 데이터베이스의 동의어로 사용된다.

<div align="center">
  <img src="/images/posts/2022/database-schema-and-catalog-02.png" width="80%" class="image__border">
</div>
<center>https://techvu.dev/131</center>

## 3. Why is schema attribute failed?

카탈로그가 스키마보다 상위 개념이라는 점은 파악했지만, @Table 애너테이션의 `schema` 속성은 `MySQL`에서 정상적으로 동작하지 않는지 이해가 안됐다. 여전히 @Table 애너테이션의 schema 속성이 아니라 `catalog` 속성 값에 의해 정상 동작하는 이유가 궁금했다. 명확한 이유를 찾진 못 했지만, 추측할 수 있는 몇 가지 근거들을 찾아 정리했다. 

MySQL 구조를 먼저 살펴보자. 일반적인 데이터베이스는 계층 구조를 가지는데, `MySQL` 데이터베이스는 일반적인 데이터베이스의 계층 구조와 차이점이 있다. 아래 그림을 통해 차이점을 살펴보자. 우선 4계층 데이터베이스 구조는 다음과 같다.

- ANSI(American National Standards Institute) 표준 구조다.
- `인스턴스`는 DBMS 서비스를 의미한다. 서버 혹은 서버 프로세스를 의미한다.
- `데이터베이스`는 `인스턴스`에서 영속성 관리를 위해 필요한 모든 파일을 의미한다.
- 오라클의 경우 4계층 형태이지만, 한 개의 인스턴스에 한 개의 데이터베이스만 만들 수 있기 때문에 3계층이라 소개하는 글들도 있다.

<div align="center">
  <img src="/images/posts/2022/database-schema-and-catalog-03.png" width="80%" class="image__border">
</div>
<center>https://hue9010.github.io/db/mysql_schema/</center>

<br/>

다음 3계층 데이터베이스 구조를 살펴보자.

- `인스턴스`는 DBMS 서비스를 의미한다. 서버 혹은 서버 프로세스를 의미한다.
- 데이터베이스가 존재하지 않고, 바로 스키마가 위치한다. 이 구조의 경우 데이터베이스와 스키마를 동의어로 사용한다.
- `MySQL` 데이터베이스를 대표적인 예로 들 수 있으며, 이런 경우에는 데이터베이스와 스키마를 혼동하여 사용하는 경우가 발생한다.

<div align="center">
  <img src="/images/posts/2022/database-schema-and-catalog-04.png" width="80%" class="image__border">
</div>
<center>https://hue9010.github.io/db/mysql_schema/</center>

<br/>

예를 들어 PostgreSQL 데이터베이스는 4계층 구조다.

- ANSI 표준에 맞는 4계층 구조의 데이터베이스다.
- 클러스터는 DBMS 서비스(인스턴스)를 의미한다.(port 5432)
- 카탈로그는 데이터베이스를 의미한다.
- 스키마는 네임스페이스(namespace)를 의미하며, 특정 스키마에 접근하는 경우 해당 스키마에 지정된 테이블들만 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2022/database-schema-and-catalog-05.png" width="80%" class="image__border">
</div>
<center>https://stackoverflow.com/questions/7022755/whats-the-difference-between-a-catalog-and-a-schema-in-a-relational-database</center>

<br/>

반면, `MySQL` 데이터베이스 구조는 어떨까? 3계층 구조로 **데이터베이스와 스키마가 동일한 의미**로 사용된다. `MySQL`에선 데이터베이스 생성과 스키마 생성은 동일한 결과를 보여준다. 아래 예시 SQL을 통해 자세히 결과를 살펴보자. 먼저 스키마를 생성 후 테이블 생성해본다.

- TEST_SCHEMA 스키마를 생성한다.
- TEST_SCHEMA 스키마에 `tb_test` 테이블을 생성한다.

```sql
create schema TEST_SCHEMA;

create table TEST_SCHEMA.`tb_test` (
    `ID` int(11) NOT NULL,
    PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

스키마 생성 후 테이블 생성 결과를 보면 다음과 같다.

- MySQL 인스턴스 아래 스키마 정보가 생긴 것을 확인할 수 있다.
- TEST_SCHEMA 스키마에서 방금 생성한 `tb_test` 테이블을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2022/database-schema-and-catalog-06.gif" width="100%" class="image__border">
</div>

<br/>

이번엔 데이터베이스를 생성 후 테이블 생성하는 쿼리를 실행해보자.

- TEST_SCHEMA 이름의 데이터베이스를 생성한다.
- TEST_SCHEMA 데이터베이스에 `tb_test` 테이블을 생성한다.

```sql
create database TEST_SCHEMA;

create table TEST_SCHEMA.`tb_test` (
    `ID` int(11) NOT NULL,
    PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

데이터베이스 생성 후 테이블 생성 결과를 보면 다음과 같다.

- MySQL 인스턴스 아래 스키마 정보가 생긴 것을 확인할 수 있다.
- TEST_SCHEMA 데이터베이스에서 방금 생성한 `tb_test` 테이블을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2022/database-schema-and-catalog-07.gif" width="100%" class="image__border">
</div>

<br/>

결론적으로 MySQL에서 데이터베이스를 생성하는 것과 스키마를 생성하는 것은 동일한 결과를 갖게된다.

## 4. Characteristic of MySQL 

[MySQL 문서](https://dev.mysql.com/doc/connector-odbc/en/connector-odbc-usagenotes-functionality-catalog-schema.html)를 읽어보면 다음과 같은 내용을 찾을 수 있다.

> 8.1.3 Configuring Catalog and Schema Support<br/>
> Generally, catalogs are collections of schemas, so the fully qualified name would look like catalog.schema.table.column. 
> Historically with MySQL ODBC Driver, CATALOG and DATABASE were two names used for the same thing. 
> At the same time SCHEMA was often used as a synonym for MySQL Database. 
> This would suggest that CATALOG equals a SCHEMA, which is incorrect, but in MySQL Server context they would be the same thing.<br/>
> ...<br/>
> The Connector/ODBC driver does not allow using catalog and schema functionality at the same time because it would cause unsupported naming.

요약하자면 일반적으로 `카탈로그`와 `스키마`는 같은 개념이 아니지만, `MySQL`에서는 동일한 개념으로 사용한다. MySQL에선 시스템 구조상 `스키마`와 `데이터베이스`는 동의어로 사용된다. 결과적으로 `MySQL`에서 `카탈로그 = 데이터베이스 = 스키마`라는 의미가 된다. 

MySQL ODBC(Open Database Connectivity) 드라이버는 카탈로그와 데이터베이스를 동일한 것으로 취급한다. 동시에 스키마와 데이터베이스는 동의어이므로 MySQL 서버 컨텍스트에선 카탈로그와 스키마가 동일한 것으로 취급된다. ODBC 드라이버에서 스키마와 카탈로그는 데이터베이스 객체들을 테이블로서 참조하기 위해 사용되기 때문에 두 컨셉을 동시에 사용하지 못하도록 아래와 같은 설정이 존 한다. 

- NO_CATALOG, NO_SCHEMA 설정에 따라 드라이버에서 카탈로그와 스키마를 사용할지 여부를 선택한다.

<div align="center">
  <img src="/images/posts/2022/database-schema-and-catalog-08.png" width="80%" class="image__border">
</div>
<center>https://dev.mysql.com/doc/connector-odbc/en/connector-odbc-usagenotes-functionality-catalog-schema.html</center>

<br/>

결론을 정리하자면 `MySQL`에선 시스템 구조상 `카탈로그 = 스키마 = 데이터베이스`이므로 `MySQL`의 `ODBC` 드라이버는 카탈로그와 스키마를 같은 의미로 취급한다. 동시에 사용할 순 없어서 둘 중 하나를 사용하는데 `NO_CATALOG`, `NO_SCHEMA` 옵션을 통해 이를 설정한다. 디폴트 설정이 어떤 것인지는 확인하진 못 했지만, 옵션 설정에 따라 카탈로그를 사용한 것이라 예상된다.

#### REFERENCE

- [데이터베이스 스키마][wiki-database-schema-link]
- [데이터베이스 카탈로그][wiki-database-catalog-link]
- <https://www.ibm.com/cloud/learn/database-schema>
- <https://beginnersbook.com/2018/11/dbms-three-level-architecture/>
- <https://coding-factory.tistory.com/216>
- <https://coding-factory.tistory.com/225>
- <https://techvu.dev/131>
- <https://hue9010.github.io/db/mysql_schema/>
- <https://stackoverflow.com/questions/7022755/whats-the-difference-between-a-catalog-and-a-schema-in-a-relational-database>
- <https://stackoverflow.com/questions/11184025/what-are-the-jpa-table-annotation-catalog-and-schema-variables-used-for>
- <https://stackoverflow.com/questions/7942520/relationship-between-catalog-schema-user-and-database-instance>
- <https://dev.mysql.com/doc/connector-odbc/en/connector-odbc-usagenotes-functionality-catalog-schema.html>

[wiki-database-schema-link]: https://ko.wikipedia.org/wiki/%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4_%EC%8A%A4%ED%82%A4%EB%A7%88
[wiki-database-catalog-link]: https://ko.wikipedia.org/wiki/%EB%8D%B0%EC%9D%B4%ED%84%B0%EB%B2%A0%EC%9D%B4%EC%8A%A4_%EC%B9%B4%ED%83%88%EB%A1%9C%EA%B7%B8