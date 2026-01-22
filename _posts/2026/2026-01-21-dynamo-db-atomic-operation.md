---
title: "동시성(concurrency) 문제와 DynamoDB 원자적(atomic) 업데이트"
search: false
category:
  - test
  - test-container
  - aws
  - dynamodb
  - localstack
last_modified_at: 2026-01-13T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [데이터베이스 락(Database Lock)][lock-mechanism-link]
- [DynamoDB single table design][dynamodb-single-table-design-link]
- [타입스크립트 애플리케이션에서 LocalStack 테스트 컨테이너 사용하기][testcontainer-with-localstack-in-typescript-link]

## 0. 들어가면서

서버 애플리케이션에서 데이터베이스에 접근할 때 조회-변경-업데이트(read-modify-write) 패턴이 있는 경우 동시성 문제가 발생한다. RDB(relational database)인 경우 이를 해결할 수 있는 방법은 몇 가지 있다. 

- [비관적 잠금 (Pessimistic Locking)](https://junhyunny.github.io/spring-boot/jpa/junit/jpa-pessimitic-lock/)
  - 데이터를 읽는 시점에 즉시 해당 로우(Row)에 Lock을 걸어 다른 트랜잭션이 접근하지 못하게 차단하는 방식이다.
- [낙관적 잠금 (Optimistic Locking)](https://junhyunny.github.io/spring-boot/jpa/junit/jpa-optimistic-lock/)
  - 데이터에 수정을 시도할 때, 내가 읽었던 시점의 데이터 버전이 맞는지 확인하고 업데이트하는 방식이다. 애플리케이션 레벨에서 관리된다.
- 원자적 업데이트 (Atomic Update)
  - 애플리케이션에서 계산된 값을 덮어쓰는 대신, DB 엔진 자체에서 연산을 수행하도록 쿼리를 작성하는 방식이다.

최근 개발에 참여했던 서비스는 AWS DynamoDB를 사용하고 있었다. 특정 기능(feature)에서 동시성 문제를 고려할 필요가 있었고, 위 세 가지 방법 중 원자적 업데이트 방식을 채택하여 구현했다. 이번 글은 DynamoDB를 사용하는 애플리케이션에서 원자적 업데이트를 수행하는 방법에 대해 정리했다.

## 1. Problem context

사용자 별로 특정 리소스에 '즐겨찾기'하는 기능을 개발 중이었다. RDB 였다면 즐겨찾기 테이블을 별도로 만들어 관리했겠지만, 이 팀은 DynamoDB를 사용하면서 [단일 테이블 디자인(single table design)][dynamodb-single-table-design-link]을 채택 중이었다. 테이블 디자인을 어떻게 가져갈지 페어(pair)와 상담해보고 가장 적합한 디자인은 결정했다. 현재 상황에서 코드의 복잡도를 높이지 않고, 기능을 구현할 수 있는 모델링이라 생각했다.

- 아이템의 특정 컬럼에 '즐겨찾기'를 누른 사람들의 아이디를 저장한다.

<div align="center">
  <img src="/images/posts/2026/dynamo-db-atomic-operation-01.png" width="100%" class="image__border">
</div>

<br />

이렇게 테이블을 디자인하면 사용자가 특정 리소스에 대해 즐겨찾기를 할 때 조회-변경-업데이트(read-modify-write) 로직이 필요하다.

1. 애플리케이션 레이어에서 현재 리소스 상태를 조회한다.
2. favoritePeople 컬렉션을 변경(추가/삭제)한다.
3. 애플리케이션 레이어에서 변경한 리소스를 업데이트 한다.

이 구현은 필연적으로 동시성 문제를 일으킨다. 비슷한 시간에 들어온 요청은 모두 빈 리스트를 조회한다. 자신의 아이디를 리스트에 추가 후 업데이트한다. 최종적으로 트랜잭션이 늦게 끝난 사용자2의 변경 사항이 데이터베이스에 남는다.

<div align="center">
  <img src="/images/posts/2026/dynamo-db-atomic-operation-02.png" width="100%" class="image__border">
</div>

## 2. DynamoDB atomic operation

DynamoDB는 원자적 업데이트를 지원한다. 애플리케이션에 현재 값을 읽어오지 않고, DynamoDB 엔진이 직접 값을 수정하도록 하는 방식이다. RDB에서 제공하는 쿼리와 동일한 원리다.

```sql
UPDATE table SET col = col + 1
```

수치형 데이터뿐만 아니라 리스트(List)나 셋(Set) 형태의 자료구조에 요소를 추가하거나 삭제하는 작업도 원자적으로 수행할 수 있다. 리스트의 경우 list_append 연산을 지원한다. 기존 리스트 끝에 새 요소를 원자적으로 추가한다.

```
SET my_list = list_append(my_list, :new_element)
```

셋인 경우에는 ADD/DELETE 연산을 지원한다. 두 연산은 셋 자료구조에만 사용할 수 있으며 집합에서 특정 요소를 원자적으로 추가/제거하는 기능이다.

```
ADD my_set :new_element

DELETE my_set :new_element
```

우리는 즐겨찾기 등록/해제 기능이 필요하고, 사용자의 더블 클릭이나 느린 네트워크로 인해 아이디가 중복으로 추가되는 일을 방지하기 위해 자료구조 셋과 ADD/DELETE 연산이 요구사항에 적합했다.

## 3. Test atomic operation with test container

테스트 컨테이너(test container)를 사용한 테스트 코드를 통해 동시성 문제가 발생하지 않는지 확인해보자. 테스트 컨테이너 셋업, 의존성 설치, 타입스크립트 설정 등은 [이전 글][testcontainer-with-localstack-in-typescript-link]을 참고하길 바란다. 전체 예제 코드는 [이 링크](https://github.com/Junhyunny/blog-in-action/tree/master/2026-01-21-dynamo-db-atomic-operation)를 참고하길 바란다.

우선 동시성 문제가 발생하는 조회-변경-업데이트 패턴의 코드는 다음과 같다.

1. GetCommand 연산으로 타겟 아이템을 조회한다.
2. 아이템의 myList 리스트 객체에 새로운 항목을 추가한다.
3. UpdateCommand 연산으로 타겟 아이템을 업데이트한다.

```ts
const unsafeUpdate = async (newItem: string) => { 
  const { Item } = await testDynamoDBClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: "pk", sk: "sk" },
    }),
  );

  if (!Item) {
    return;
  }

  const newList = [...Item.myList, newItem];

  const command = new UpdateCommand({
    TableName: tableName,
    Key: { pk: "pk", sk: "sk" },
    UpdateExpression: "SET myList = :newList",
    ExpressionAttributeValues: {
      ":newList": newList,
    },
  });
  await testDynamoDBClient.send(command);
};
```

다음 셋의 ADD 연산을 통해 원자적 업데이트를 수행하는 코드는 다음과 같다.

- 타겟 아이템의 mySet 객체에 ADD 연산을 통해 새로운 항목을 추가한다.
- 신규 항목을 추가할 때 자바스크립트(JavaScript) Set 객체를 사용한다.

```ts
const atomicUpdate = async (newItem: string) => {
  const command = new UpdateCommand({
    TableName: tableName,
    Key: { pk: "pk", sk: "sk" },
    UpdateExpression: "ADD mySet :newItem",
    ExpressionAttributeValues: {
      ":newItem": new Set([newItem]),
    },
  });
  await testDynamoDBClient.send(command);
};
```

두 메소드를 비동기적으로 수행했을 때 동시성 문제가 발생하는지 확인해보자.

1. 테스트에 필요한 데이터를 준비한다.
2. 비동기 처리로 unsafeUpdate, atomicUpdate 함수를 100회 수행한다. 비동기 처리가 종료되는 것을 기다리기 위해 Promise 객체들은 배열에 담는다.
3. Promise.all() 메소드를 사용해 모든 비동기 처리가 끝나는 것을 기다린다.
4. 업데이트 결과를 확인하기 위해 타겟 아이템을 조회한다.
5. 동시성 문제가 발생하는 함수와 원자적 연산을 수행한 함수의 결과를 로그로 확인한다.

```ts
it("atomic operation test", async () => {
  // 1
  await testDynamoDBClient.send(
    new PutCommand({
      TableName: tableName,
      Item: { pk: "pk", sk: "sk", myList: [] },
    }),
  );
  const unsafeUpdatePromise = [];
  const atomicUpdatePromise = [];

  // 2
  for (let index = 0; index < 100; index++) {
    unsafeUpdatePromise.push(unsafeUpdate(`item-${index}`));
    atomicUpdatePromise.push(atomicUpdate(`item-${index}`));
  }

  // 3
  await Promise.all([...unsafeUpdatePromise, ...atomicUpdatePromise]);

  // 4
  const { Item } = await testDynamoDBClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: "pk", sk: "sk" },
    }),
  );
  // 5
  console.log("unsafe update result:", Item?.myList.length);
  console.log("atomic update result:", Item?.mySet.size);
});
```

동시성 문제가 없다면 총 100개의 데이터가 컬렉션에 담긴다. 만약, 동시성 문제가 발생했다면 100개보다 적은 수의 데이터가 컬렉션에 담겨 있을 것이다. 테스트 실행 결과는 다음과 같다.

- 동시성 문제가 발생하는 unsafeUpdate 함수는 리스트에 1개의 데이터만 저장된다.
- 동시성 문제가 발생하지 않는 atomicUpdate 함수는 셋에 100개의 데이터가 모두 저장된다.

```
unsafe update result: 1
atomic update result: 100
```

unsafeUpdate 함수도 await 키워드를 통해 연산이 끝나는 것을 기다리는 경우 정상적으로 아이템이 추가된다. 하지만, 서버는 여러 요청을 동시에 처리하기 때문에 이전 연산이 끝나는 것을 기다리지 않는다는 사실을 기억하자.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-01-21-dynamo-db-atomic-operation>

#### REFERENCE

- <https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.UpdateExpressions.html>

[lock-mechanism-link]: https://junhyunny.github.io/information/database/database-lock/lock-mechanism/
[dynamodb-single-table-design-link]: https://junhyunny.github.io/aws/dynamodb/dynamodb-single-table-design/
[testcontainer-with-localstack-in-typescript-link]: https://junhyunny.github.io/typescript/test-container/localstack/aws/s3/dynamodb/testcontainer-with-localstack-in-typescript/