---
title: "Orval MSW(Mock Service Worker) 핸들러 생성과 React Query 테스트"
search: false
category:
  - react
  - react-query
  - msw
  - orval
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [리액트(React) 앱에서 Vitest 설정하기][setup-vitest-for-react-application-link]
- [목 서비스 워커 (Mock Service Worker)][mock-service-worker-link]
- [OpenAPI 명세서를 사용한 Orval 클라이언트 코드 자동 생성하기][open-api-spec-with-orval-link]

## 0. 들어가면서

[이전 글][open-api-spec-with-orval-link]에 정리한 것처럼 Orval은 OpenAPI 명세서를 기반으로 RESTful 클라이언트 코드를 생성해주는 CLI 도구다. 앵귤라(angular), 리액트(react), 뷰(vue) 같은 주요 프론트엔드 프레임워크를 모두 지원하고, 다양한 클라이언트 라이브러리를 지원한다. 이전 글은 Orval을 통해 코드 자동 생성에만 초점을 맞췄다. 이번에는 Orval을 통해 [MSW(mock service worker)][mock-service-worker-link] 핸들러를 만들고, 이를 사용해 간단한 테스트 코드를 작성해볼 생각이다. 목 서비스 워커에 대한 개념이 부족하다면 [이전 글][mock-service-worker-link]을 참고하길 바란다. 

## 1. Generate MSW handlers and React Query hooks

이번 예제에서 사용할 OpenAPI 명세서는 [이 링크](https://github.com/Junhyunny/blog-in-action/blob/master/2026-02-11-using-mock-service-worker-with-orval/action-in-blog/api/openapi-specification.yaml)를 참고하길 바란다. 명세서가 길기 때문에 필요한 내용만 부분적으로 살펴본다. 우선 Orval을 통해 코드를 생성해보자. 다음과 같이 Orval 설정 파일(orval.config.js)을 작성한다.

- mock 속성을 'true'로 설정하면 MWS 목킹을 위한 핸들러 함수들을 생성한다.
- client 속성을 'react-query'로 설정하면 리액트 쿼리(react query) 커스텀 훅을 생성한다.

```js
import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "../api/openapi-specification.yaml",
    output: {
      mode: "split",
      target: "src/apis",
      schemas: "src/model",
      client: "react-query",
      httpClient: "axios",
      mock: true,
    },
  },
});
```

코드를 자동 생성하기 위해 'package.json'에 다음과 같은 스크립트를 추가한다.

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    ...
    "generate": "orval --config ./orval.config.js",
    ...
  },
  ...
}
```

터미널에서 아래 명령어를 실행하면 코드가 자동 생성된다.

```
$ npm run generate

> frontend@0.0.0 generate
> orval --config ./orval.config.js

🍻 orval v8.0.3 - A swagger client generator for typescript
🎉 api - Your OpenAPI spec has been converted into ready to use orval!
```

생성된 코드를 살펴보자. OpenAPI 명세서에 다음과 같은 API 명세가 작성되어 있다.

- /todos 경로에서 모든 할 일 목록을 조회한다.

```yaml
paths:
  /todos:
    get:
      summary: 모든 할 일 목록 조회
      responses:
        '200':
          description: 성공적인 조회
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Todo'
...
```

자동 생성된 리액트 쿼리 훅(hook)은 다음과 같다.

- getTodos 함수
  - axios를 사용한 쿼리 함수
- getGetTodosQueryKey 함수
  - URL 경로를 쿼리 키(query key)로 반환
- getGetTodosQueryOptions 함수
  - useQuery 훅에 필요한 쿼리 함수, 키, 기타 옵션들을 반환
- useGetTodos 함수
  - useQuery 훅을 비즈니스 케이스에 따라 래핑(wrapping)한 함수 

```ts
export const getTodos = (
  options?: AxiosRequestConfig,
): Promise<AxiosResponse<Todo[]>> => {
  return axios.default.get(`/todos`, options);
};

export const getGetTodosQueryKey = () => {
  return [`/todos`] as const;
};

export const getGetTodosQueryOptions = <
  TData = Awaited<ReturnType<typeof getTodos>>,
  TError = AxiosError<unknown>,
>(options?: {
  query?: Partial<
    UseQueryOptions<Awaited<ReturnType<typeof getTodos>>, TError, TData>
  >;
  axios?: AxiosRequestConfig;
}) => {
  const { query: queryOptions, axios: axiosOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getGetTodosQueryKey();

  const queryFn: QueryFunction<Awaited<ReturnType<typeof getTodos>>> = ({
    signal,
  }) => getTodos({ signal, ...axiosOptions });

  return { queryKey, queryFn, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getTodos>>,
    TError,
    TData
  > & { queryKey: DataTag<QueryKey, TData, TError> };
};

export function useGetTodos<
  TData = Awaited<ReturnType<typeof getTodos>>,
  TError = AxiosError<unknown>,
>(
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof getTodos>>, TError, TData>
    >;
    axios?: AxiosRequestConfig;
  },
  queryClient?: QueryClient,
): UseQueryResult<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
} {
  const queryOptions = getGetTodosQueryOptions(options);

  const query = useQuery(queryOptions, queryClient) as UseQueryResult<
    TData,
    TError
  > & { queryKey: DataTag<QueryKey, TData, TError> };

  return { ...query, queryKey: queryOptions.queryKey };
}
```

자동 생성된 코드는 리액트 쿼리 사용법이 익숙하다면 크게 어려움을 느끼지 않을 것이다. 다음은 자동 생성된 스키마를 살펴보자. OpenAPI 명세서에 정의된 스키마 정보는 다음과 같다.

```yaml
components:
  schemas:
    Todo:
      type: object
      properties:
        id:
          type: integer
          example: 1
        title:
          type: string
          example: "OpenAPI 공부하기"
        completed:
          type: boolean
          example: false
        createdAt:
          type: string
          format: date-time
...
```

자동 생성된 스키마는 다음과 같다. OpenAPI 명세서에서 required가 아닌 속성들은 옵셔널로 정의된다.

```ts
export interface Todo {
  id?: number;
  title?: string;
  completed?: boolean;
  createdAt?: string;
}
```

마지막으로 MSW 모의 응답을 만들어주는 핸들러를 살펴보자.

- getGetTodosResponseMock 함수
  - faker 라이브러리를 통해 랜덤한 Todo 배열 응답을 만든다.
- getGetTodosMockHandler 함수
  - */todos 경로로 오는 요청에 대한 응답을 스터빙한다.
  - 응답은 파라미터를 통해 오버라이드(override)할 수 있다.
- getTodoAPIMock 함수
  - 생성된 목 핸들러 함수들을 반환한다.

```ts
export const getGetTodosResponseMock = (): Todo[] =>
  Array.from(
    { length: faker.number.int({ min: 1, max: 10 }) },
    (_, i) => i + 1,
  ).map(() => ({
    id: faker.helpers.arrayElement([
      faker.number.int({ min: undefined, max: undefined }),
      undefined,
    ]),
    title: faker.helpers.arrayElement([
      faker.string.alpha({ length: { min: 10, max: 20 } }),
      undefined,
    ]),
    completed: faker.helpers.arrayElement([
      faker.datatype.boolean(),
      undefined,
    ]),
    createdAt: faker.helpers.arrayElement([
      `${faker.date.past().toISOString().slice(0, 19)}Z`,
      undefined,
    ]),
  }));

export const getGetTodosMockHandler = (
  overrideResponse?:
    | Todo[]
    | ((
        info: Parameters<Parameters<typeof http.get>[1]>[0],
      ) => Promise<Todo[]> | Todo[]),
  options?: RequestHandlerOptions,
) => {
  return http.get(
    "*/todos",
    async (info) => {
      return new HttpResponse(
        JSON.stringify(
          overrideResponse !== undefined
            ? typeof overrideResponse === "function"
              ? await overrideResponse(info)
              : overrideResponse
            : getGetTodosResponseMock(),
        ),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    },
    options,
  );
};

export const getTodoAPIMock = () => [
  getGetTodosMockHandler(),
  getPostTodosMockHandler(),
  getGetTodosIdMockHandler(),
  getPutTodosIdMockHandler(),
  getDeleteTodosIdMockHandler(),
];
```

## 2. Using generated hooks

자동 생성된 코드로 테스트 코드와 구현 코드를 작성해보자. 먼저 위에서 생성한 핸들러 코드를 MSW 목 서버에 등록한다. 테스트 환경은 `vitest`, `react-testing-library`를 사용했다. Vite에서 테스트 환경을 구축하는 방법은 [이 글][setup-vitest-for-react-application-link]을 참고하길 바란다. vitest 설정 파일에 다음과 같은 준비 코드를 작성한다.

- setupServer 함수에 Orval을 통해 자동 생성된 목 핸들러 함수들을 등록한다.
- beforeAll 훅에서 목 서버를 실행한다.
- afterEach 훅에서 목 서버의 핸들러를 초기화한다.
- afterAll 훅에서 목 서버를 종료한다.

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";
import { getTodoAPIMock } from "./src/apis/todoAPI.msw.ts";

export const server = setupServer(...getTodoAPIMock());

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
```

간단한 TODO 애플리케이션을 기준으로 테스트 코드와 구현 코드를 작성한다. 다음과 같은 기능을 제공한다.

- 이전에 작성한 TODO 항목들이 보인다.
- 새로운 TODO 항목을 추가할 수 있다.

이전에 작성한 TODO 항목들이 보이는 기능에 대한 테스트 코드는 다음과 같다. 

1. 목 서버의 응답을 재정의한다. 자동 생성된 getGetTodosMockHandler 핸들러를 사용한다.
2. App 화면을 랜더링한다.
3. 목 서버로부터 받은 응답을 기반으로 화면이 표시되는지 확인한다.

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event/dist/cjs/setup/index.js";
import type { DefaultBodyType } from "msw";
import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { server } from "../vitest-setup.ts";
import App from "./App.tsx";
import {
  getGetTodosMockHandler,
  getPostTodosMockHandler,
} from "./apis/todoAPI.msw.ts";
import type { Todo, TodoCreate } from "./model";

const withQueryProvider = (ui: ReactElement) => {
  return (
    <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>
  );
};

describe("App", () => {
  test("화면을 보면 이전에 작성된 해야할 일(todo) 항목들이 보인다.", async () => {
    // [1]
    server.use(
      getGetTodosMockHandler([
        { id: 1, title: "테스트 작성하기", completed: true },
        { id: 2, title: "구현 코드 작성하기", completed: false },
      ]),
    );

    // [2]
    render(withQueryProvider(<App />));

    // [3]
    const firstTodo = await screen.findByText("테스트 작성하기");
    expect(firstTodo).toBeInTheDocument();
    expect(
      // biome-ignore lint/style/noNonNullAssertion: test code
      within(firstTodo.parentElement!).getByRole("checkbox"),
    ).toBeChecked();
    const secondTodo = await screen.findByText("구현 코드 작성하기");
    expect(secondTodo).toBeInTheDocument();
    expect(
      // biome-ignore lint/style/noNonNullAssertion: test code
      within(secondTodo.parentElement!).getByRole("checkbox"),
    ).not.toBeChecked();
  });

  ...

});
```

다음은 새로운 TODO 항목을 추가하는 기능에 대한 테스트 코드다.

1. 마찬가지로 목 서버의 응답을 재정의한다. 자동 생성된 getPostTodosMockHandler, getGetTodosMockHandler 핸들러를 사용한다. 응답을 단순히 재정의하는 것이 아니라 구현을 재정의한다.
2. TODO 항목을 입력 후 등록 버튼을 클릭한다.
3. 다음 내용들을 확인한다.
  - 새롭게 등록한 TODO 항목이 화면에 표시된다.
  - 등록 버튼을 클릭했을 때 input 값이 비워진다.
  - 등록 버튼을 클릭했을 때 서버가 받은 요청을 확인한다. 

```tsx
describe("App", () => {

  ...

  test("화면에 새로운 해야할 일(todo)를 등록할 수 있다.", async () => {
    // [1]
    const expectedRequest: DefaultBodyType[] = [];
    server.use(
      getPostTodosMockHandler(async (info) => {
        const body = (await info.request.json()) as TodoCreate;
        expectedRequest.push(body);
        return { ...body, id: 1, createdAt: "2022-01-01T00:00:00.000Z" };
      }),
    );
    server.use(
      getGetTodosMockHandler(async () => {
        return expectedRequest.map((item, index) => {
          return {
            ...(item as Todo),
            id: index + 1,
            createdAt: "2022-01-01T00:00:00.000Z",
          };
        });
      }),
    );
    render(withQueryProvider(<App />));

    // [2]
    await userEvent.type(
      screen.getByPlaceholderText("해야할 일"),
      "블로그 쓰기",
    );
    await userEvent.click(screen.getByRole("button", { name: "등록" }));

    // [3]
    const firstTodo = await screen.findByText("블로그 쓰기");
    expect(firstTodo).toBeInTheDocument();
    expect(
      // biome-ignore lint/style/noNonNullAssertion: test code
      within(firstTodo.parentElement!).getByRole("checkbox"),
    ).not.toBeChecked();
    expect(expectedRequest).toEqual([
      { title: "블로그 쓰기", completed: false },
    ]);
  });
});
```


위 테스트 코드를 통과할 수 있는 구현 코드를 작성한다. Orval을 통해 자동 생성된 리액트 쿼리 훅을 사용한다.

- useGetTodos 훅으로 서버로부터 TODO 리스트 응답을 가져온다.
- usePostTodos 훅으로 서버에 신규 TODO 항목을 등록한다. mutation 성공 시 서버에서 반환된 데이터를 처리하고, 관련된 쿼리를 새로고침하여 캐시를 업데이트한다.

```tsx
import "./App.css";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getGetTodosQueryKey,
  useGetTodos,
  usePostTodos,
} from "./apis/todoAPI.ts";

function App() {
  const queryClient = useQueryClient();
  const { data: todos = { data: [] } } = useGetTodos();
  const { mutate: createTodo } = usePostTodos({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getGetTodosQueryKey(),
        });
      },
    },
  });

  const [item, setItem] = useState("");
  const handleSubmit = async () => {
    createTodo({ data: { title: item, completed: false } });
    setItem("");
  };

  return (
    <div style={ { display: "flex", flexDirection: "column", gap: "1rem" } }>
      <div style={ { display: "flex", gap: "1rem" } }>
        <input
          type="text"
          placeholder="해야할 일"
          onChange={(e) => setItem(e.target.value)}
          value={item}
        />
        <button type="button" onClick={handleSubmit}>
          등록
        </button>
      </div>
      <div>
        {todos.data.map((todo) => (
          <div key={todo.id}>
            <div
              style={ {
                display: "flex",
                gap: "0.5rem",
                justifyContent: "flex-start",
              } }
            >
              <input type="checkbox" checked={todo.completed} readOnly />
              <span>{todo.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-02-11-using-mock-service-worker-with-orval>

#### REFERENCE

- <https://orval.dev/docs/guides/msw>
- <https://v1.mswjs.io/>

[setup-vitest-for-react-application-link]: https://junhyunny.github.io/vite/react/setup-vitest-for-react-application/
[mock-service-worker-link]: https://junhyunny.github.io/information/react/test-driven-development/mock-service-worker/
[open-api-spec-with-orval-link]: https://junhyunny.github.io/openapi/orval/auto-generate-code/react-query/msw/open-api-spec-with-orval/