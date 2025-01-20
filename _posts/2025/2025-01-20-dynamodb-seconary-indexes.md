---
title: "DynamoDB Secondary Indexes"
search: false
category:
  - aws
  - dynamodb
last_modified_at: 2025-01-20T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [DynamoDB basics][dynamodb-basics-link]

## 1. Secondary Indexes

[지난 글][dynamodb-basics-link]에서 DynamoDB의 기본 컨셉이나 특징에 대해 정리했다. 이전 글에서 언급했듯이 DynamoDB의 쿼리(query)는 제한적이다. 쿼리를 통해 데이터를 조회하려면 파티션 키(partition key)와 정렬 키(sort key)만 조회 조건(데이터 접근 패턴, data access pattern)으로 사용할 수 있다. 파티션 키는 필수(required)고 정렬 키는 옵셔널(optional)이다. 기본 키가 아닌 속성(attribute)로 데이터를 사용해서 데이터를 조회할 수 없다.

<div align="center">
  <img src="/images/posts/2025/dynamodb-seconary-indexes-01.png" width="80%" class="image__border">
</div>
<center>https://www.youtube.com/watch?v=I7zcRxHbo98</center>

<br/>

DynamoDB가 유연한 설계가 어려운 이유는 쿼리 조회 조건을 만들 때 파티션 키와 정렬 키만 사용할 수 있기 때문이다. 다른 조건을 만들어 데이터를 조회하기 위해선 `보조 인덱스(secondary index)`라는 새로운 메커니즘이 필요하다. 보조 인덱스를 사용하지 않아도 스캔(scan) 연산을 사용하면 기본 키가 아닌 속성들로 데이터를 조회할 수 있지만, 비용이나 퍼포먼스 측면에서 권장되지 않는 방법이다. 이는 `FilterExpressions` 처리는 읽기 용량에 영향을 주지 않기 때문이다. 기본적으로 새로운 데이터 접근 패턴을 정의할 땐 보조 인덱스를 고려하는 것이 좋다. DynamoDB의 보조 인덱스 개념을 아래와 같이 쉽게 설명할 수 있다.

> 다른 방식의 데이터 접근 패턴을 위해 정렬 키 혹은 파티션 키와 정렬 키를 재정의한다.

DynamoDB의 보조 인덱스는 두 가지 타입이 있다. 각 타입에 대한 개념을 정리하고 간단한 예시 쿼리를 만들어보자.

- 로컬 보조 인덱스(local secondary index)
- 글로벌 보조 인덱스(global secondary index)

## 2. Local Secondary Index

로컬 보조 인덱스는 테이블과 동일한 파티션 키를 사용하지만, 정렬 키를 다른 값으로 지정하는 방식이다. 로컬 보조 인덱스는 다음과 같은 제약 사항이 있다.

- 테이블 하나당 최대 5개의 로컬 보조 인덱스를 만들 수 있다.
- DynamoDB 테이블을 생성할 때 함께 생성해야 한다. 테이블이 삭제되는 경우 해당 테이블의 로컬 보조 인덱스도 삭제된다.
- 키가 아닌 하나의 속성을 로컬 보조 인덱스의 정렬 키로 지정한다. 선택한 속성은 String, Number, Binary 유형이어야 한다. 
- 로컬 보조 인덱스가 있는 테이블의 경우 파티션 키 값당 10GB 크기 한도가 제한된다.

로컬 보조 인덱스는 테이블의 쓰기 용량 단위(WCU, write capacity unit), 읽기 용량 단위(RCU, read capacity unit)을 함께 사용한다. 로컬 보조 인덱스는 글로벌 보조 인덱스와 다르게 제약 사항이 더 많고 정렬 키만 재정의 할 수 있기 때문에 사용하는 메리트(merit)가 떨어지지만, 강한 일관성 읽기(strong consistent read)를 반드시 지원해야 한다면 로컬 보조 인덱스를 사용한다.

### 2.1. Create table with local secondary index

간단한 예시를 살펴보자. 다음과 같은 명령어를 통해 로컬 인덱스가 포함된 DynamoDB 테이블을 만들 수 있다. 

- Actor 속성이 테이블 파티션 키이다.
- Movie 속성이 테이블 정렬 키이다.
- Year 속성이 로컬 보조 인덱스의 정렬 키이다.
- 로컬 보조 인덱스 이름은 "ActorYearIndex"이다.

```
$ aws dynamodb create-table \
    --table-name ActorsTable \
    --attribute-definitions AttributeName=Actor,AttributeType=S \
        AttributeName=Movie,AttributeType=S \
        AttributeName=Year,AttributeType=N \
    --key-schema AttributeName=Actor,KeyType=HASH AttributeName=Movie,KeyType=RANGE \
    --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
    --local-secondary-indexes \
        "[{\"IndexName\": \"ActorYearIndex\",
        \"KeySchema\":[{\"AttributeName\":\"Actor\",\"KeyType\":\"HASH\"}, {\"AttributeName\":\"Year\",\"KeyType\":\"RANGE\"}],
        \"Projection\":{\"ProjectionType\":\"ALL\"}}]"
```

필요한 테이블이 생성되었으면 다음과 같은 데이터를 준비한다. 

<div align="center">
  <img src="/images/posts/2025/dynamodb-seconary-indexes-02.png" width="80%" class="image__border">
</div>

### 2.2. Query with local secondary index

로컬 보조 인덱스를 사용해 쿼리를 만들어보자. "Tom Hanks" 배우의 영화 중 1990년에서 1999년까지 작품을 조회한다. "ActorYearIndex" 로컬 보조 인덱스를 사용한다. "Year" 속성을 정렬 키로 사용한다.

- `--index-name` - 로컬 보조 인덱스 이름을 지정한다.
- `--key-condition-expression` - 조회 조건 표현식을 만든다.
- `--expression-attribute-names` - 조회 조건 표현식에서 사용할 키 이름을 지정한다.
- `--expression-attribute-values` - 조회 조건 표현식에서 사용할 값을 지정한다.

```
$ aws dynamodb query \
    --table-name ActorsTable \
    --index-name ActorYearIndex \
    --key-condition-expression "#act = :actor AND #yr BETWEEN :startYear AND :endYear" \
    --expression-attribute-names '{"#yr": "Year", "#act": "Actor"}' \
    --expression-attribute-values \
    "{
        \":actor\": {\"S\": \"Tom Hanks\"},
        \":startYear\": {\"N\": \"1990\"},
        \":endYear\": {\"N\": \"1999\"}
    }"
```

다음 두 개의 아이템이 조회된다.

<div align="center">
  <img src="/images/posts/2025/dynamodb-seconary-indexes-03.png" width="80%" class="image__border">
</div>

<br/>

로컬 보조 인덱스를 사용해야만 "Year" 속성을 정렬 키로 사용할 수 있다. `--index-name` 옵션 없이 동일한 쿼리를 던지면 키 조건이 맞지 않아 에러가 발생한다.

```
$ aws dynamodb query \
    --table-name ActorsTable \
    --key-condition-expression "#act = :actor AND #yr BETWEEN :startYear AND :endYear" \
    --expression-attribute-names '{"#yr": "Year", "#act": "Actor"}' \
    --expression-attribute-values \
    "{
        \":actor\": {\"S\": \"Tom Hanks\"},
        \":startYear\": {\"N\": \"1990\"},
        \":endYear\": {\"N\": \"1999\"}
    }"

An error occurred (ValidationException) when calling the Query operation: Query condition missed key schema element: Movie
```

## 3. Global Secondary Index

글로벌 보조 인덱스는 쿼리를 위해 파티션 키와 정렬 키를 새롭게 정의하는 방식이다. 파티션 키는 필수로 지정해야하지만, 정렬 키는 선택 사항이다. 로컬 보조 인덱스랑 비교했을 때 어떤 점들이 다른지 살펴보면 글로벌 보조 인덱스에 대해 이해하기 쉽다.

| 기능 | 글로벌 보조 인덱스 | 로컬 보조 인덱스 |
|:-:|:-:|:-:|
| 키 스키마 | 글로벌 보조 인덱스의 기본 키는 단순 기본 키(파티션 키)이거나 복합 기본 키(파티션 키 및 정렬 키)일 수 있다. | 로컬 보조 인덱스의 기본 키는 반드시 복합 기본 키(파티션 키 및 정렬 키)여야 한다. |
| 키 속성 | 인덱스 파티션 키 및 정렬 키(있을 경우)는 문자열, 숫자 또는 이진수 형식의 기본 테이블 속성일 수 있다. | 인덱스의 파티션 키는 기본 테이블의 파티션 키와 동일한 속성을 사용한다. 정렬 키는 문자열, 숫자 또는 이진수 형식의 기본 테이블 속성일 수 있다. |
| 파티션 키 값당 크기 제한 | 글로벌 보조 인덱스에는 크기 제한이 없다. | 파티션 키 값마다 인덱싱된 모든 항목의 전체 크기가 10GB 이하여야 한다. |
| 온라인 인덱스 작업 | 글로벌 보조 인덱스는 테이블을 생성할 때 동시에 생성될 수 있다. 새 글로벌 보조 인덱스를 기존 테이블에 추가하거나 삭제할 수 있다. | 로컬 보조 인덱스는 테이블을 생성할 때 동시에 생성된다. 기존 테이블에 로컬 보조 인덱스를 추가하거나 삭제할 수 없다. |
| 쿼리 및 파티션 | 글로벌 보조 인덱스를 사용하면 모든 파티션에서 전체 테이블을 쿼리할 수 있다. | 로컬 보조 인덱스를 사용하면 쿼리에서 파티션 키 값으로 지정하는 단일 파티션을 쿼리할 수 있다. |
| 읽기 일관성 | 글로벌 보조 인덱스의 쿼리는 최종 일관성만 지원한다. | 로컬 보조 인덱스를 쿼리할 때는 최종 일관성 또는 강력한 일관성을 선택할 수 있다. |
| 프로비저닝된 처리량 소비 | 글로벌 보조 인덱스마다 읽기 및 쓰기 활동에 대한 고유한 프로비저닝 된 처리량 설정이 있다. 글로벌 보조 인덱스의 쿼리 및 스캔은 인덱스의 용량 단위를 소비한다. 테이블 쓰기로 인한 글로벌 보조 인덱스 업데이트 역시 인덱스의 용량 단위를 소비한다. 글로벌 테이블과 연결된 글로벌 보조 인덱스는 쓰기 용량 단위를 소비한다. | 로컬 보조 인덱스의 쿼리 또는 스캔은 기본 테이블의 읽기 용량 단위를 소비한다. 테이블에 쓰기 시 해당 로컬 보조 인덱스 업데이트는 기본 테이블의 쓰기 용량 단위를 소비한다. 글로벌 테이블과 연결된 로컬 보조 인덱스는 복제된 쓰기 용량 단위를 소비한다. |
| 프로젝션 속성 | 글로벌 보조 인덱스 쿼리 또는 스캔에서는 인덱스로 프로젝션 된 속성만 요청할 수 있다. DynamoDB는 테이블의 속성을 가져오지 않는다. | 로컬 보조 인덱스를 쿼리 또는 스캔하는 경우, 인덱스로 프로젝션되지 않은 속성만 요청할 수 있다. |

글로벌 보조 인덱스는 테이블과 별개의 프로비저닝 된 처리량(WCU, RCU)을 사용한다. 테이블의 항목을 추가, 업데이트 또는 삭제하고 이로 인해 글로벌 보조 인덱스가 영향을 받을 경우 글로벌 보조 인덱스 변경 작업을 위해 인덱스 WCU를 소비한다. 즉, 기본 테이블 쓰기 작업을 위해 테이블 WCU를 소비하고 글로벌 보조 인덱스를 변경하기 위해 인덱스 WCU를 소비한다. 테이블 쓰기에 성공하기 위해선 테이블 및 모든 글로벌 보조 인덱스의 프로비저닝 된 처리량 설정이 충분해야 한다.

위 비교 테이블을 보면 알 수 있듯이 글로벌 보조 인덱스는 로컬 보조 인덱스에 비해 제약 사항이 덜하다. 반드시 강한 일관성 읽기를 지원해야하는 경우를 제외하곤 글로벌 보조 인덱스를 사용하는 것을 권장한다.

### 3.1. Add global secondary index

위에서 생성한 DynamoDB 테이블에 새로운 글로벌 보조 인덱스를 추가해보자. 글로벌 보조 인덱스를 생성할 때 새로운 파티션 키와 정렬 키를 등록한다. 

- Genre 속성이 글로벌 보조 인덱스의 파티션 키이다.
- Year 속성이 글로벌 보조 인덱스의 정렬 키이다.
- 글로벌 보조 인덱스 이름은 "GenreYearIndex"이다.
- 쓰기 용량 단위와 읽기 용량 단위는 각 1로 지정한다.

```
$ aws dynamodb update-table \
    --table-name ActorsTable \
    --attribute-definitions \
        AttributeName=Genre,AttributeType=S \
        AttributeName=Year,AttributeType=N \
    --global-secondary-index-updates \
        "[{
            \"Create\": {
                \"IndexName\": \"GenreYearIndex\",
                \"KeySchema\": [
                    {\"AttributeName\": \"Genre\", \"KeyType\": \"HASH\"},
                    {\"AttributeName\": \"Year\", \"KeyType\": \"RANGE\"}
                ],
                \"Projection\": {
                    \"ProjectionType\": \"ALL\"
                },
                \"ProvisionedThroughput\": {
                    \"ReadCapacityUnits\": 1,
                    \"WriteCapacityUnits\": 1
                }
            }
        }]"
```

"ActorsTable" 테이블에 다음과 같은 파티션 키, 정렬 키를 사용하는 글로벌 보조 인덱스가 생성된다.

<div align="center">
  <img src="/images/posts/2025/dynamodb-seconary-indexes-04.png" width="80%" class="image__border">
</div>

### 3.2. Query with global secondary index

글로벌 보조 인덱스를 사용해 쿼리를 만들어보자. 장르가 "Drama"인 영화 중 1990년에서 1999년까지 작품을 조회한다. "GenreYearIndex" 글로벌 보조 인덱스를 사용한다.

- `--index-name` - 글로벌 보조 인덱스 이름을 지정한다.
- `--key-condition-expression` - 조회 조건 표현식을 만든다.
- `--expression-attribute-names` - 조회 조건 표현식에서 사용할 키 이름을 지정한다.
- `--expression-attribute-values` - 조회 조건 표현식에서 사용할 값을 지정한다.

```
$ aws dynamodb query \
    --table-name ActorsTable \
    --index-name GenreYearIndex \
    --key-condition-expression "#genre = :genre AND #yr BETWEEN :startYear AND :endYear" \
    --expression-attribute-names '{"#genre": "Genre", "#yr": "Year"}' \
    --expression-attribute-values '{":genre": {"S": "Drama"}, ":startYear": {"N": "1990"}, ":endYear": {"N": "1999"}}' 
```

다음 한 개의 데이터가 조회된다.

<div align="center">
  <img src="/images/posts/2025/dynamodb-seconary-indexes-05.png" width="80%" class="image__border">
</div>

#### REFERENCE

- <https://docs.aws.amazon.com/ko_kr/amazondynamodb/latest/developerguide/SecondaryIndexes.html>
- <https://docs.aws.amazon.com/ko_kr/amazondynamodb/latest/developerguide/LSI.html>
- <https://docs.aws.amazon.com/ko_kr/amazondynamodb/latest/developerguide/GSI.html>
- <https://docs.aws.amazon.com/ko_kr/amazondynamodb/latest/developerguide/GSI.OnlineOps.html>
- <https://dynobase.dev/dynamodb-scan-vs-query/>

[dynamodb-basics-link]: https://junhyunny.github.io/aws/dynamodb/dynamodb-basics/