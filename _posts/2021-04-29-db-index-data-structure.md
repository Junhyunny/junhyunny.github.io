---
title: "Database Index and Data Structure"
search: false
category:
  - information
  - data-structure
last_modified_at: 2021-08-28T02:00:00
---

<br/>

## 0. 들어가면서

데이터베이스(database) 성능을 향상시키는 방법으로 항상 인덱스(index)에 대한 이야기가 나옵니다. 
어플리케이션 팀원으로 일할 때 성능 팀과 인덱스, 힌트(hint) 설정에 관련된 메일을 자주 주고 받았었지만, 단순히 `조회 쿼리를 빠르게 만들기 위해 인덱스를 생성하고, 특정 힌트를 걸어준다.` 정도로만 알고 지냈습니다. 
정확한 개념을 알고 싶어 관련된 자료나 책을 읽어보니 상당히 내용이 많았습니다. 
포스트가 너무 길어질 것 같기에 이번엔 인덱스에 대한 전반적인 개념들만 정리하였습니다. 

## 1. Database Index

> 데이터베이스 테이블의 검색 속도를 향상시키기 위한 자료구조

인덱스는 책 뒷편에 위치한 색인(index)으로 비유를 많이 합니다. 
책의 색인은 낱말, 구절 또는 관련된 지시자를 찾아보기 쉽도록 키워드와 페이지 쌍(pair)을 정렬된 순서로 나열한 목록을 의미합니다. 
독자들은 색인을 통해 특정 정보가 책 어느 페이지에 있는지 쉽게 찾을 수 있습니다. 

데이터베이스의 인덱스도 같은 형태입니다. 
다만, 여기서 키워드는 데이터베이스 특정 컬럼(column)의 데이터, 페이지는 데이터가 저장된 주소(address)가 됩니다. 
쿼리 속도를 개선한다는 것은 불필요한 디스크 I/O 횟수를 줄이는 것 입니다. 
인덱스를 사용하면 최소한의 횟수로 꼭 필요한 데이터만 읽도록 쿼리를 개선할 수 있습니다.

<p align="center">
    <img src="/images/db-index-data-structure-1.JPG" width="60%" class="image__border">
</p>
<center>https://mangkyu.tistory.com/96</center>

### 1.1. How to create index?

일반적으로 인덱스를 선언하는 방법은 다음과 같습니다.

* 특정 테이블에 인덱스를 추가합니다.
* 테이블에 존재하는 특정 컬럼을 기준으로 인덱스를 설정합니다.

```sql
ALTER TABLE table_name ADD INDEX index_name(column_name)
```

복수 개의 컬럼을 기준으로 인덱스를 설정하려면 다음과 같습니다.

* 테이블에 존재하는 특정 컬럼들을 쉼표로 구분하여 인덱스로 설정합니다.

```sql
ALTER TABLE table_name ADD INDEX index_name(column_name_1, column_name_2)
```

### 1.2. Is index a silver bullet?

> 인덱스를 사용하는 것이 항상 이로울까?

인덱스가 검색 속도를 빠르게 해주는 이유는 정렬된 데이터를 기준으로 탐색을 수행하기 때문입니다. 
인덱스로 지정한 컬럼들의 값을 기준으로 항상 정렬되어 있고, 정렬된 상태를 계속 유지해야 합니다. 
정렬하면서 데이터를 변경하기 때문에 INSERT, UPDATE, DELETE 같은 연산은 속도가 느립니다. 
결론적으로 DBMS(database managment system)에서 인덱스는 데이터 변경(INSERT, UPDATE, DELETE) 성능을 희생하고, 데이터의 읽기 속도를 높이는 기능입니다. 

적절한 인덱스를 만드는 것도 중요합니다. 
WHERE 조건절에 사용되는 컬럼이라고 해서 모두 인덱스로 생성하는 것은 비효율적입니다. 
인덱스도 별도의 저장 공간을 차지하기 때문에 무턱대고 인덱스를 만드는 행위는 공간을 낭비합니다. 
관리를 위한 추가 작업이 필요합니다. 

## 2. Consideration for Good Index

좋은 인덱스를 만들기 위해선 적절한 통계성 데이터가 필요합니다. 
기준이 될 수 있는 몇 가지 요소(factor)들을 살펴보겠습니다. 

### 2.1. Cardinality

기수성(cardinality)은 값의 균형을 나타내는 개념이며, 선택도(selectivity)와 거의 같은 의미로 사용합니다. 
특정 데이터 집합의 유니크(unique)한 값의 수를 의미합니다. 

* cardinality = select count(distinct (column)) from table

기수성이 높은 필드는 모든 레코드(record)에 다른 값이 들어가 있습니다. 
유니크 키(unique key) 필드는 기수성이 높습니다. 
예를 들어 사용자 정보를 저장한 테이블에서 주민번호는 기수성이 높습니다. 
100명의 데이터가 있다면 100명 모두 다르기 때문에 기수성은 100입니다.

반대로 모든 레코드에 같은 값이 들어있다면 기수성이 낮습니다. 
예를 들어 성별 같은 필드의 데이터는 남, 여뿐이므로 중복이 매우 높습니다. 
100명의 데이터가 있다면 고유한 값은 남과 여뿐이기 때문에 기수성은 2입니다.

> 높은 기수성(선택도)을 가진 컬럼은 좋은 인덱스 후보입니다.

### 2.2. Selectivity Rate

선택률(selectivity rate)는 한 번의 조회 쿼리로 이에 해당되는 레코드가 얼만큼 존재하는지를 나타내는 개념입니다. 
기수성이 높으면 자연스럽게 선택률은 낮아집니다. 
간단한 예를 들어 보겠습니다. 

* 100명의 사용자 데이터가 존재합니다. 
* 주민번호로 사용자를 조회합니다. 
    * 주민번호는 사용자마다 고유하기 때문에 1명이 조회됩니다.
    * 선택률은 1%(=1/100*100)입니다.
* 남자라는 성별로 사용자를 조회합니다.
    * 남자인 사용자는 56명이 조회됩니다.
    * 선택률은 56%(=56/100*100)입니다.

당연히 특정 조건을 만족하는 데이터 후보들 중에서 탐색하는 것이 데이터베이스를 풀 스캔(full scan)하는 것에 비해 속도가 빠릅니다. 
선택률이 낮다는 것은 검색 대상이 줄어들었다는 이야기이므로 그만큼 빠르게 처리됩니다.
구체적인 역치는 DBMS 또는 저장소 성능마다 다르지만, 낮은 선택률은 5~10% 이하를 기준으로 합니다. 
10% 이상이라면 데이터 풀 스캔이 빠를 가능성이 높아집니다. 

> 선택률이 낮을수록 좋은 인덱스 후보입니다.

### 2.3. Other Factors

기수성과 선택률만으로 좋은 인덱스를 결정하기 쉽지 않습니다. 
추가적으로 다음과 같은 요소들을 고려해볼 수 있습니다. 

* 활용도
    * 인덱스 후보로 지정할 컬럼이 얼마나 자주 WHERE 조건절에 포함되는지 판단합니다.
    * 여러 곳에서 조회 조건으로 사용되는 컬럼이라면 좋은 인덱스 후보입니다.
* 수정 빈도
    * 인덱스도 테이블로 관리되기 때문에 자주 바뀌면 이를 갱신하는데 비용이 듭니다. 
    * 해당 컬럼의 데이터가 자주 바뀌지 않을수록 좋은 인덱스 후보입니다.

## 3. Index Data Structure

인덱스를 위한 대표적인 데이터 구조 `B-Tree`에 대해 살펴보겠습니다.

### 3.1. B-Tree as Data Structure

데이터베이스에서 말하는 인덱스는 보통 `B-Tree`를 의미합니다. 

* 가장 상단에 위치한 루트 노드(root node) 
* 중간에 위치한 브랜치 노드(branch node)
* 마지막에 위치한 리프 노드(leaf node)

`B-Tree`의 B는 이진(binary)가 아닌 균형(balance)입니다. 
루트 노드에서 모든 리프 노드까지의 거리를 균일하게 조정합니다. 
`B-Tree`는 차수에 따라 자식 노드 수가 결정됩니다. 
예를 들어 2차 `B-Tree`는 자식 노드가 2개, 3차인 경우 3개입니다. 

<p align="center">
    <img src="/images/db-index-data-structure-2.JPG" width="80%" class="image__border">
</p>
<center>https://velog.io/@evelyn82ny/B-Tree-index-feat-difference-from-B-plus-Tree</center>

### 3.2. B-Tree in Database as Index

데이터베이스의 `B-Tree`는 노드를 구분하는 기준이 페이지(page) 단위입니다. 
지금부터 트리의 노드를 페이지라고 표현하겠습니다. 
데이터베이스의 `B-Tree`의 페이지 수는 가변적인데, 이는 페이지 크기와 인덱스 키 값의 크기에 따라 결정됩니다. 

* InnoDB 스토리 엔진의 기본적인 페이지 사이즈는 16KB 입니다.
* 인덱스 키의 사이즈가 16바이트, 값의 사이즈가 12바이트라고 가정하겠습니다.
    * 키는 인덱스로 지정한 컬럼의 값입니다.
    * 값은 자식 노드의 주소입니다.
* 하나의 인덱스 페이지에는 키-값 쌍(pair)를 585개(=16*1024/(16+12)) 저장할 수 있습니다.
* 한 페이지 당 최대 585개의 자식 페이지를 가질 수 있는 `B-Tree`가 됩니다. 
    * 한 페이지 내 키-값 쌍은 키를 기준으로 정렬되어 있습니다.
* 키-값 사이즈가 커지면 자식 페이지 수가 줄어들게 되며, 대신 트리의 깊이(depth)가 높아집니다. 
* 트리의 깊이는 디스크 I/O가 발생하는 횟수와 직결되므로 성능에 큰 영향을 미칩니다. 
    * 만약, 키 값의 크기가 32바이트로 늘어나면 최대 자식 페이지를 372개(=16*1024/(32+12)) 저장할 수 있습니다.
    * 500개의 데이터를 인덱스로 관리하는 경우 `B-Tree`는 깊이가 2단계가 됩니다.
    * 500개의 데이터를 조회할 때 디스크 I/O가 최소 2번 이상 발생하게 됩니다.
* 대용량 데이터베이스라도 `B-Tree`의 깊이는 5단계 이상까지 깊어지지 않는다고 합니다.

<p align="center">
    <img src="/images/db-index-data-structure-3.JPG" width="80%" class="image__border">
</p>
<center>https://velog.io/@evelyn82ny/B-Tree-index-feat-difference-from-B-plus-Tree</center>

## 4. Not Applied Case

인덱스를 만들었더라도 적용되지 않는 케이스가 존재합니다. 
이는 일반적인 인덱스 구조인 `B-Tree`의 특성으로 발생한다고 합니다. 
데이터베이스마다 일부 다른 부분들도 있지만, 공부한 내용을 바탕으로 정리하였습니다. 

* 중간 일치, 후방 일치 LIKE 연산을 수행한 경우
    * `%VALUE%`, `%VALUE`처럼 앞 부분이 와일드 카드

```sql
... WHERE column LIKE '%VALUE%'
... WHERE column LIKE '%VALUE'
```

* 부정형 비교를 수행한 경우
    * `<>`, `!=`, `NOT IN`, `NOT BETWEEN`, `IS NOT NULL` 같은 연산

```sql
... WHERE column <> 'N'
... WHERE column != 100
... WHERE column NOT IN (10, 11, 12) 
```

* IS NULL 비교를 수행한 경우
    * NULL 값은 인덱스에 저장되지 않기 때문에 인덱스가 적용되지 않습니다.
    * `MySQL`에서는 NULL 값도 인덱스에 저장하기 때문에 IS NULL 비교에 인덱스가 적용됩니다.

```sql
... WHERE column IS NULL
```

* 인덱스 필드로 연산을 수행한 경우

```sql
... WHERE column * 1.1 > 10
```

* 인덱스 필드에 함수를 사용한 경우
    * SUBSTRING, LENGTH 같은 데이터베이스 함수를 컬럼에 사용

```sql
... WHERE LENGTH(column) = 10
... WHERE SUBSTRING(column, 1, 1) = 'X'
```

* 데이터 타입이 서로 다른 비교를 수행한 경우

```sql
... WHERE char_column = 10
```

* 문자열 데이터 타입의 콜레이션(collation)이 다른 경우

```sql
... WHERE utf8_bin_char_column = euckr_bin_char_column
```

## CLOSING

`B-Tree`의 확장판인 `B+Tree` 구조를 인덱스로 많이 사용한다고 합니다. 
큰 차이점은 리프 노드들을 연결 리스트(linked list)로 이어놨다는 점입니다. 
여러 자료들을 살펴보면 `B+Tree`를 따로 구분하지 않았기에 저도 별도로 관련된 내용들은 정리하지 않았습니다. 
`B-Tree` 자료 구조를 시뮬레이션 해주는 사이트가 있습니다. 
해당 사이트에서 트리 차수 별로 노드를 하나씩 추가할 때마다 어떻게 변경이 일어나는지 살펴볼 수 있습니다. 

<p align="center">
    <img src="/images/db-index-data-structure-4.gif" width="100%" class="image__border">
</p>
<center>https://www.cs.usfca.edu/~galles/visualization/BTree.html</center>

#### REFERENCE

* [SQL 레벨업][sql-level-up-book-link]
* [Real MySQL 8.0 (1권)][real-my-sql-book-link]
* <https://ko.wikipedia.org/wiki/%EC%83%89%EC%9D%B8>
* <https://coding-factory.tistory.com/746>
* <https://velog.io/@evelyn82ny/B-Tree-index-feat-difference-from-B-plus-Tree>

[sql-level-up-book-link]: http://www.yes24.com/product/goods/24089836
[real-my-sql-book-link]: http://www.yes24.com/product/goods/103415767