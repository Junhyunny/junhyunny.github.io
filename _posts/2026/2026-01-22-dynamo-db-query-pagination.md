---
title: "DynamoDB 페이지 처리(pagination)"
search: false
category:
  - test
  - test-container
  - aws
  - dynamodb
  - localstack
last_modified_at: 2026-01-22T10:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [타입스크립트 애플리케이션에서 LocalStack 테스트 컨테이너 사용하기][testcontainer-with-localstack-in-typescript-link]

## 0. 들어가면서

DynamoDB는 조회할 때 1MB 사이즈 제한이 있다. 그 이상 데이터를 조회하고 싶은 경우 페이지 처리(pagination)가 필요하다. 이 글은 DynamoDB에서 조회 시 데이터 사이즈 제한이 걸린 경우 페이지 처리를 하는 방법에 대해 정리했다. 

## 1. Offset is not supported

RDB(relational database)와 다르게 DynamoDB는 오프셋(offset)을 지원하지 않는다. 오프셋은 일반적으로 특정 지점까지 모든 레코드를 순차적으로 읽은 뒤, 앞 부분을 버리는 방식이다. 오프셋 100만을 요청하면 데이터베이스는 실제로 100만 개를 읽어야 하므로 뒤로 갈수록 응답 속도가 기하급수적으로 느려진다.

DynamoDB는 데이터 규모에 상관없이 10ms 미만의 일관된 레이턴시(consistent low latency)를 보장하는 것이 설계 목표이다. 데이터의 사이즈에 따라 응답 속도가 달라지는 오프셋은 실제로 이 설계 목표에 위배된다. DynamoDB는 수많은 물리적 서버(partition)으로 나눠 데이터를 저장한다. 오프셋을 계산하려면 모든 파티션으로부터 앞에 몇 개의 데이터가 있는지 계산해봐야 한다. 이런 비효율성 때문인지 DynamoDB는 오프셋을 지원하지 않고, 커서(cursor) 방식의 페이지 처리를 지원한다.

## 2. Cursor based pagination

커서 기반 페이지네이션(cursor-based pagination)은 데이터 집합 내의 특정 항목을 가리키는 고유한 식별자(커서, cursor)를 기준으로 다음 페이지의 데이터를 가져오는 방식이다. 커서 기반 페이지 처리는 특정 페이지로 바로 이동하는 방식보단 첫 페이지부터 한 페이지씩 조회하는 방식에 적합하다. 예를 들어, 무한 스크롤(infinite scroll) 같은 기능에 적합하다.

DynamoDB는 커서 기반 페이지 처리를 위해 아이템 조회 결과에 `LastEvaluatedKey` 요소를 포함시켰다. LastEvaluteKey 존재 여부에 따라 다음 페이지가 존재하는지 아닌지 알 수 있다. 

- 결과에 LastEvaluteKey 요소를 포함하고 null 이 아닌 경우 이를 기반으로 다음 페이지를 조회할 수 있다.
- 결과에 LastEvaluteKey 요소가 없는 경우 더 이상 가져올 항목이 없다.

LastEvaluteKey 요소가 존재하는 경우 LastEvaluteKey 요소를 다음 쿼리의 `ExclusiveStartKey` 요소로 사용하면 해당 지점부터 데이터를 조회할 수 있다. 

## 3. Example codes

간단한 예시 코드들을 살펴보자. 테스트 컨테이너(test container)를 사용한 테스트 코드를 통해 예제 코드를 검증한다. 테스트 컨테이너 셋업, 의존성 설치, 타입스크립트 설정 등은 [이전 글][testcontainer-with-localstack-in-typescript-link]을 참고하길 바란다. 전체 예제 코드는 [이 링크](https://github.com/Junhyunny/blog-in-action/tree/master/2026-01-22-dynamo-db-query-pagination)를 참고하길 바란다.

먼저 사이즈 제한에 의해 데이터를 추가적으로 조회해야 하는 경우를 살펴보자. 큰 사이즈의 데이터를 준비한다. 다만, DynamoDB는 쓰기 연산에도 400KB 사이즈 제한이 있다. 이 사이즈를 넘지 않는 데이터를 사용한다.

1. 데이터베이스에 395KB 크기 이상의 데이터를 4개 준비한다.
2. 모든 아이템을 조회한다.
3. 모든 아이템들이 조회되길 기대한다.

```ts
it("given data size over 1MB when getAllItems then return get all items included next page", async () => {
  // 1 - 395KB size item
  const item = Array.from({ length: 395 * 1024 }, (_, __) => "0").join("");
  for (let index = 0; index < 4; index++) {
    await dynamoDBClient.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          pk: "pk",
          sk: `sk-${index}`,
          item,
        },
      }),
    );
  }

  // 2
  const result = await getAllItems();

  // 3
  expect(result.length).toEqual(4);
  expect(result).toEqual([
    { pk: "pk", sk: "sk-0", item },
    { pk: "pk", sk: "sk-1", item },
    { pk: "pk", sk: "sk-2", item },
    { pk: "pk", sk: "sk-3", item },
  ]);
});
```

페이지 처리가 없다면 데이터는 3개 밖에 조회되지 않는다. 3개까진 1MB를 미만이지만, 4개부터 조회할 데이터 사이즈가 1MB를 초과한다. 아래와 같이 단순 쿼리 로직을 수행하면 테스트가 실패한다.

```ts
const getAllItems = async (): Promise<Item[]> => {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "pk = :pk and begins_with(sk, :sk)",
    ExpressionAttributeValues: {
      ":pk": "pk",
      ":sk": "sk",
    },
  });
  const output = await dynamoDBClient.send(command);
  return output.Items as Item[];
};
```

테스트 실패 이유는 예상한 것처럼 3개만 조회되기 때문이다.

```
AssertionError: expected 3 to deeply equal 4
Expected :4
Actual   :3
```

do-while 루프를 사용해 페이지 처리를 수행한다. 다음과 같이 코드를 변경하면 테스트가 정상적으로 통과한다.

- 우선 쿼리를 수행한다.
- 쿼리 결과의 LastEvaluatedKey 속성을 exclusiveStartKey 변수에 저장한다. 조회할 데이터(Items)는 result 배열에 담는다.
- exclusiveStartKey 변수가 undefiend, null이 아니라면 다시 쿼리를 수행한다. 
- 이를 exclusiveStartKey 변수가 없을 때까지 반복한다.

```ts
const getAllItems = async (): Promise<Item[]> => {
  // biome-ignore lint/suspicious/noExplicitAny: unknown key
  let exclusiveStartKey: Record<string, any> | undefined;
  const result: Item[] = [];
  do {
    const command = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk and begins_with(sk, :sk)",
      ExpressionAttributeValues: {
        ":pk": "pk",
        ":sk": "sk",
      },
      ExclusiveStartKey: exclusiveStartKey,
    });
    const output = await dynamoDBClient.send(command);
    result.push(...(output.Items as Item[]));
    exclusiveStartKey = output.LastEvaluatedKey;
  } while (exclusiveStartKey);
  return result;
};
```

다음은 실제 페이지 처리처럼 사이즈 제한을 두고 조회하는 방식을 재현한다. 테스트 코드를 통해 페이징 처리를 수행해보자.

1. 5개의 데이터를 준비한다.
2. 필요한 사이즈만큼 데이터를 조회한다. 사이즈는 '2', '3', '1'으로 3회 조회한다. 결과에는 다음 페이지를 조회할 때 기준으로 삼을 next 속성이 포함되어 있다. next 속성을 사용해 다음 페이지를 조회한다. 
3. 3회 조회한 결과들을 확인한다. next 속성은 LastEvaluatedKey 속성을 그대로 반환한 것이므로 현재 페이지의 마지막 아이템의 키가 포함된다.

```ts
it("getItems with page size", async () => {
  // 1
  for (let index = 0; index < 5; index++) {
    await dynamoDBClient.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          pk: "pk",
          sk: `sk-${index}`,
          item: `item-${index}`,
        },
      }),
    );
  }

  // 2
  const firstResult = await getItems(2);
  const secondResult = await getItems(3, firstResult.next);
  const thirdResult = await getItems(1, secondResult.next);

  // 3
  expect(firstResult.next).toEqual({ pk: "pk", sk: "sk-1" });
  expect(firstResult.items.length).toEqual(2);
  expect(firstResult.items).toEqual([
    { pk: "pk", sk: "sk-0", item: "item-0" },
    { pk: "pk", sk: "sk-1", item: "item-1" },
  ]);
  expect(secondResult.next).toEqual({ pk: "pk", sk: "sk-4" });
  expect(secondResult.items.length).toEqual(3);
  expect(secondResult.items).toEqual([
    { pk: "pk", sk: "sk-2", item: "item-2" },
    { pk: "pk", sk: "sk-3", item: "item-3" },
    { pk: "pk", sk: "sk-4", item: "item-4" },
  ]);
  expect(thirdResult.next).toBeUndefined();
  expect(thirdResult.items.length).toEqual(0);
  expect(thirdResult.items).toEqual([]);
});
```

다음과 같이 구현한다. 조회한 결과의 Items, LastEvaluatedKey 요소를 반환한다.

```ts
// biome-ignore lint/suspicious/noExplicitAny: unknown key
type PageItems = { items: Item[]; next: Record<string, any> | undefined };

const getItems = async (
  size: number,
  // biome-ignore lint/suspicious/noExplicitAny: unknown key
  next?: Record<string, any>,
): Promise<PageItems> => {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "pk = :pk and begins_with(sk, :sk)",
    ExpressionAttributeValues: {
      ":pk": "pk",
      ":sk": "sk",
    },
    ExclusiveStartKey: next,
    Limit: size,
  });
  const output = await dynamoDBClient.send(command);
  return { items: output.Items as Item[], next: output.LastEvaluatedKey };
};
```

## CLOSING

커서 역할을 하는 next 속성은 LastEvaluatedKey 객체를 그대로 사용했지만, 클라이언트(e.g. 브라우저)까지 전달해야 하는 경우 직렬화(serialization) 후 암호화(encryption)하는 편이 좋다. 서버와 데이터베이스의 구현 세부 사항(e.g. 스키마 구조 등)을 클라이언트 애플리케이션까지 있는 그대로 노출하는 것은 잠재적인 보안 리스크가 될 수 있다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-01-22-dynamo-db-query-pagination>

#### REFERENCE

- <https://docs.aws.amazon.com/ko_kr/amazondynamodb/latest/developerguide/Query.Pagination.html>
- <https://dulki.tistory.com/126>

[testcontainer-with-localstack-in-typescript-link]: https://junhyunny.github.io/typescript/test-container/localstack/aws/s3/dynamodb/testcontainer-with-localstack-in-typescript/