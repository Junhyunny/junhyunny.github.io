---
title: "리액트 쿼리(react query) 낙관적 업데이트(optimistic update)"
search: false
category:
  - react
  - react-query
  - optimistic-update
last_modified_at: 2026-02-13T00:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [OpenAPI 명세서를 사용한 Orval 클라이언트 코드 자동 생성하기][open-api-spec-with-orval-link]
- [Orval MSW(Mock Service Worker) 핸들러 생성과 React Query 테스트][using-mock-service-worker-with-orval-link]

## 0. 들어가면서

AWS 람다(lambda)를 활용한 서버리스(serverless) 아키텍처를 채택하는 경우 [콜드 스타트(cold start)](https://aws.amazon.com/ko/blogs/compute/understanding-and-remediating-cold-starts-an-aws-lambda-perspective/) 문제가 발생한다. 람다는 항상 활성화되어 있지 않으므로 사용자 요청이 들어왔을 때 실행하기 위한 부수적인 준비가 필요하고 이로 인해 대략 수초 정도 지연이 발생한다. 사용자는 좋지 않은 경험을 하게 된다.

리액트 쿼리(react query)는 내부적으로 캐시(cache)를 사용한다. 서버 데이터를 클라이언트 메모리에서 보관하고 관리하기 위한 자바스크립트(JavaScript) 객체 스토리지다. 단순히 데이터를 쌓아두는 것이 아니라 데이터의 '신선도'에 따라 자동으로 최신화를 시도하는 메커니즘을 가지고 있다.

리액트 쿼리의 캐시 영역을 사용하면 낙관적 업데이트(optimistic update)를 수행할 수 있다. 낙관적 업데이트는 서버의 업데이트가 완료되기 전에 클라이언트에서 관리하는 상태를 미리 업데이트하는 방식이다. 서버에서 에러가 발생하면 클라이언트에서 관리하는 상태를 이전 데이터로 롤백한다. 낙관적 업데이트를 통해 사용자 경험을 개선할 수 있다.

## 1. Optimistic update in React Query

리액트 쿼리는 낙관적 업데이트로 두 가지 방법을 제공한다.

- UI를 통한 방법
- 캐시를 통한 방법

UI를 통한 방법은 캐시를 직접 조작하지 않는 방법이다. useMutation 훅의 `variables`와 `isPending` 상태를 이용한다. 뮤테이션이 진행 중일 때 variables에 담긴 데이터를 UI 목록에 임시로 표시한다. 에러가 발생해도 variables는 초기화되지 않는다. 이를 해결하려면 화면에서 에러 상태를 표시하거나 재시도 버튼을 만들어야 한다. 뮤테이션과 쿼리가 다른 컴포넌트에 있는 경우 useMutationState 훅과 mutationKey를 사용해서 다른 곳에서도 업데이트 진행 중인 변수에 접근할 수 있다.

캐시를 통한 방법은 직접 캐시 데이터를 수정하는 방식이다. 실패 시 롤백 로직이 필요하다. useMutation 훅의 실행 순서를 먼저 이해해야 한다. 다음과 같은 순서로 실행된다.

1. onMutate 콜백 함수 - 비동기 API 요청 전에 실행
2. mutationFn 콜백 함수 - 비동기 API 요청을 수행
3. 결과에 따른 분기 실행
  - 요청이 성공하면 onSuccess 콜백 함수
  - 요청이 실패하면 onError 콜백 함수
4. onSettled 콜백 함수 - 성공/실패 여부와 상관없이 항상 마지막에 실행

비동기 API 요청을 수행하기 전에 onMutation 콜백 함수에서 다음과 같은 작업이 필요하다.

1. cancelQueries 함수를 호출해서 진행 중인 재요청(refetch)에 의해 결과가 덮어써지지 않도록 한다.
2. getQueryData 함수로 현재 데이터 스냅샷을 임시 변수에 저장한다.
3. setQueryData 함수로 캐시를 새로운 값으로 즉시 업데이트한다.
4. 임시 변수에 저장한 스냅샷 데이터를 반환한다.

에러가 발생하는 경우를 위해 onError 콜백 함수에서 롤백 처리를 수행한다. onMutation 콜백 함수에서 반환한 스냅샷 데이터가 파라미터로 전달되므로 이를 이용해 캐시를 원래 상태로 되돌린다. API 요청이 완료되면 성공, 실패 여부와 상관없이 onSettled 콜백 함수에서 invalidateQueries 함수를 호출하여 서버의 최신 데이터를 다시 가져와 동기화한다.

## 2. Optimistic update via cache

예제 코드는 [이전 글][using-mock-service-worker-with-orval-link]에서 사용한 예제에 낙관적 업데이트에 관련된 코드를 추가했다. 낙관적 업데이트 테스트를 위해 MSW 모의 서버의 응답을 지연시키려면 약간의 스킬이 필요하다. 먼저 캐시를 사용한 낙관적 업데이트를 해보자.

1. MSW 모의 서버의 응답을 스터빙한다. TODO 생성 요청에서 Promise 객체를 반환한다. Promise 객체의 resolve 함수는 로컬 변수에 저장한다. resolve 함수가 호출되기 전까지는 모의 서버의 응답이 지연된다. TODO 리스트 조회에 대한 응답으로 생성 요청의 바디 메시지를 활용한다. 
2. 해야 할 일을 등록한다.
3. 낙관적 업데이트로 인해 서버 요청이 완료되지 않았음에도 새로운 항목이 화면에 보이는지 확인한다.
4. TODO 생성 요청에서 가로챈 resolve 함수를 호출해서 대기 중인 응답을 풀어준다.
5. 리액트 쿼리의 캐시를 무효화시켜 TODO 리스트를 재조회했을 때 예상되는 항목이 보이는지 확인한다.

```tsx
describe("optimistic update via cache", () => {
  test("업데이트 요청이 완료되지 않은 상태인 경우에도, 화면에 새로운 해야 할 일(todo)가 등록된 것처럼 보인다.", async () => {
    // [1]
    let requestBody: TodoCreate | null = null;
    let resolvePromise: (todo: Todo) => void = () => {};
    server.use(
      getGetTodosMockHandler(() =>
        requestBody ? [{ ...requestBody, id: 1 }] : [],
      ),
    );
    server.use(
      getPostTodosMockHandler(async (info) => {
        requestBody = (await info.request.json()) as TodoCreate;
        return new Promise((resolve) => {
          resolvePromise = resolve;
        });
      }),
    );
    render(withQueryProvider(<AppViaCache />));

    // [2]
    await userEvent.type(
      screen.getByPlaceholderText("해야할 일"),
      "블로그 쓰기",
    );
    await userEvent.click(screen.getByRole("button", { name: "등록" }));

    // [3]
    const optimisticTodo = await screen.findByText("블로그 쓰기");
    expect(optimisticTodo).toBeInTheDocument();
    expect(
      // biome-ignore lint/style/noNonNullAssertion: test code
      within(optimisticTodo.parentElement!).getByRole("checkbox"),
    ).not.toBeChecked();

    // [4]
    resolvePromise({} as unknown as Todo);

    // [5]
    const firstTodo = await screen.findByText("블로그 쓰기");
    expect(firstTodo).toBeInTheDocument();
    expect(
      // biome-ignore lint/style/noNonNullAssertion: test code
      within(firstTodo.parentElement!).getByRole("checkbox"),
    ).not.toBeChecked();
  });

  ...

});
```

구현 코드는 아래와 같다. 요청을 취소하고, 캐시에 저장된 데이터를 메모리상에서 변경하는 코드가 필요하다.

- onMutate 콜백 함수
  1. cancelQueries 함수를 호출해서 진행 중인 재요청에 의해 결과가 덮어써지지 않도록 한다.
  2. getQueryData 함수로 현재 데이터를 임시 변수에 저장한다.
  3. setQueryData 함수로 캐시를 새로운 값으로 즉시 업데이트한다.
  4. 임시 변수에 저장된 이전 상태 데이터를 반환한다.
- onError 콜백 함수
  - 에러가 발생한 경우 onMutate 콜백 함수에서 반환한 이전 상태 객체로 캐시를 롤백한다. onMutate 콜백 함수에서 반환한 이전 상태는 onMutateResult 객체에 담겨 있다.
- onSettled 콜백 함수
  - TODO 생성 요청이 완료되면 특정 쿼리 키에 해당하는 캐시를 무효화하여 재요청을 수행하여 서버와 동기화한다.

```tsx
import "./App.css";
import type { AxiosResponse } from "axios";
import { useState } from "react";
import {
  getGetTodosQueryKey,
  useGetTodos,
  usePostTodos,
} from "./apis/todoAPI.ts";
import type { Todo } from "./model";

const TodoItem = ({ todo }: { todo: Todo }) => {
  ...
};

function App() {
  const getTodoQueryKey = getGetTodosQueryKey();
  const { data: todos = { data: [] } } = useGetTodos();
  const { mutate: createTodo } = usePostTodos({
    mutation: {
      onMutate: async (newTodo, context) => {
        // [1]
        await context.client.cancelQueries({ queryKey: getTodoQueryKey });
        // [2]
        const previousState = context.client.getQueryData(getTodoQueryKey);
        // [3]
        context.client.setQueryData(
          getTodoQueryKey,
          (prev: AxiosResponse<Todo[]>) => ({
            ...prev,
            data: [{ ...newTodo.data, id: Math.random() * -1 }, ...prev.data],
          }),
        );
        // [4]
        return { previousState };
      },
      onError: (_err, _newTodo, onMutateResult, context) => {
        if (onMutateResult?.previousState) {
          context.client.setQueryData(
            getTodoQueryKey,
            onMutateResult.previousState,
          );
        }
      },
      onSettled: async (
        _data,
        _error,
        _variables,
        _onMutateResult,
        context,
      ) => {
        await context.client.invalidateQueries({ queryKey: getTodoQueryKey });
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
            <TodoItem todo={todo} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
```

TODO 생성 요청이 실패했을 때 테스트를 살펴보자. 원리는 위와 동일하지만, 서버 응답에서 resolve 함수가 아니라 reject 함수를 가로채서 사용하면 된다. 위 구현 코드에서 롤백 케이스 테스트도 정상적으로 통과한다.

1. MSW 모의 서버의 응답을 스터빙한다. TODO 생성 요청에서 Promise 객체를 반환한다. Promise 객체의 reject 함수는 로컬 변수에 저장한다. reject 함수가 호출되기 전까지는 모의 서버의 응답이 지연된다. TODO 리스트 조회에 대한 응답으로 생성 요청의 바디 메시지를 활용한다. 
2. 해야 할 일을 등록한다.
3. 낙관적 업데이트로 인해 서버 요청이 완료되지 않았음에도 새로운 항목이 화면에 보이는지 확인한다.
4. TODO 생성 요청에서 가로챈 reject 함수를 호출해서 대기 중인 응답을 풀어준다.
5. 새로운 TODO 항목이 화면에 보이지 않는지 확인한다.

```tsx
describe("optimistic update via cache", () => {
  
  ... 

  test("업데이트 요청이 실패한 경우 화면이 이전 상태로 돌아간다.", async () => {
    // [1]
    let rejectPromise: (error: Error) => void = () => {};
    server.use(getGetTodosMockHandler([]));
    server.use(
      getPostTodosMockHandler(async () => {
        return new Promise((_resolve, reject) => {
          rejectPromise = reject;
        });
      }),
    );
    render(withQueryProvider(<AppViaCache />));

    // [2]
    await userEvent.type(
      screen.getByPlaceholderText("해야할 일"),
      "블로그 쓰기",
    );
    await userEvent.click(screen.getByRole("button", { name: "등록" }));

    // [3]
    const optimisticTodo = await screen.findByText("블로그 쓰기");
    expect(optimisticTodo).toBeInTheDocument();
    expect(
      // biome-ignore lint/style/noNonNullAssertion: test code
      within(optimisticTodo.parentElement!).getByRole("checkbox"),
    ).not.toBeChecked();

    // [4]
    rejectPromise(new Error("internal server error"));

    // [5]
    await waitFor(() => {
      expect(screen.queryByText("블로그 쓰기")).not.toBeInTheDocument();
    });
  });
});
```

## 3. Optimistic update via UI

다음 useMutation 훅의 variables 값과 isPending 플래그를 사용하는 방법을 살펴보자. variables 값은 최초에 `undefined`이다. mutate 함수를 호출하면 전달된 파라미터가 variables 값으로 지정되고, isPending 플래그는 true 값을 갖는다. 요청이 완료되면 isPending 플래그는 false 값이 되지만, variables 값은 여전히 이전 mutate 함수 호출의 파라미터 값으로 유지된다.

1. MSW 모의 서버의 응답을 스터빙한다. TODO 생성 요청에서 Promise 객체를 반환한다. Promise 객체의 resolve 함수는 로컬 변수에 저장한다. resolve 함수가 호출되기 전까지는 모의 서버의 응답이 지연된다. TODO 리스트 조회에 대한 응답으로 생성 요청의 바디 메시지를 활용한다. 
2. 해야 할 일을 등록한다.
3. 낙관적 업데이트로 인해 서버 요청이 완료되지 않았음에도 새로운 항목이 화면에 보이는지 확인한다.
4. TODO 생성 요청에서 가로챈 resolve 함수를 호출해서 대기 중인 응답을 풀어준다.
5. 낙관적 업데이트 항목이 보이지 않는지 확인한다.

```tsx
describe("optimistic update via UI", () => {
  test("업데이트 요청이 완료되지 않은 상태인 경우에도, 화면에 새로운 해야할 일(todo)가 등록된 것처럼 보인다.", async () => {
    // [1]
    let requestBody: TodoCreate | null = null;
    let resolvePromise: (todo: Todo) => void = () => {};
    server.use(
      getGetTodosMockHandler(() =>
        requestBody ? [{ ...requestBody, id: 1 }] : [],
      ),
    );
    server.use(
      getPostTodosMockHandler(async (info) => {
        requestBody = (await info.request.json()) as TodoCreate;
        return new Promise((resolve) => {
          resolvePromise = resolve;
        });
      }),
    );
    render(withQueryProvider(<AppViaUI />));

    // [2]
    await userEvent.type(
      screen.getByPlaceholderText("해야할 일"),
      "블로그 쓰기",
    );
    await userEvent.click(screen.getByRole("button", { name: "등록" }));

    // [3]
    const optimisticTodo = await screen.findByTestId("optimistic-todo-item");
    expect(optimisticTodo).toBeInTheDocument();
    expect(within(optimisticTodo).getByText("블로그 쓰기")).toBeInTheDocument();
    expect(
      // biome-ignore lint/style/noNonNullAssertion: test code
      within(optimisticTodo.parentElement!).getByRole("checkbox"),
    ).not.toBeChecked();

    // [4]
    resolvePromise({} as unknown as Todo);

    // [5]
    await waitFor(() => {
      expect(
        screen.queryByTestId("optimistic-todo-item"),
      ).not.toBeInTheDocument();
      const firstTodo = screen.getByText("블로그 쓰기");
      expect(firstTodo).toBeInTheDocument();
      expect(
        // biome-ignore lint/style/noNonNullAssertion: test code
        within(firstTodo.parentElement!).getByRole("checkbox"),
      ).not.toBeChecked();
    });
  });
});
```

구현은 캐시를 직접 핸들링 하는 방법에 비해 간단하다. isPending 상태인 경우에만 variables 항목을 보여준다.

```tsx
import "./App.css";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getGetTodosQueryKey,
  useGetTodos,
  usePostTodos,
} from "./apis/todoAPI.ts";
import type { Todo } from "./model";

const TodoItem = ({ todo }: { todo: Todo }) => {
  ...
};

function App() {
  const queryClient = useQueryClient();
  const { data: todos = { data: [] } } = useGetTodos();
  const {
    mutate: createTodo,
    variables,
    isPending,
  } = usePostTodos({
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
        {isPending && (
          <div data-testid="optimistic-todo-item">
            <TodoItem todo={variables?.data} />
          </div>
        )}
        {todos.data.map((todo) => (
          <div key={todo.id}>
            <TodoItem todo={todo} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
```

서버에서 에러가 발생한 경우에는 reject 함수를 가로채서 지연 응답과 서버 에러를 재현하면 된다. 테스트 원리는 캐시를 사용했을 때와 동일하다.

## CLOSING

예제 코드 서버는 AWS 람다로 구성했다. 람다 핸들러에서 새로운 TODO 항목을 추가할 때 아래처럼 스레드를 3초 멈추는 코드가 있지만, 화면에선 낙관적 업데이트를 통해 먼저 반영되는 것을 볼 수 있다.

```ts
const command = new PutCommand({
  TableName: TABLE_NAME,
  Item: newTodo,
});

await sleep(3000); // 3초 대기

await docClient.send(command);
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-02-13-react-query-optimistic-update>

#### REFERENCE

- <https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates>
- <https://tanstack.com/query/latest/docs/framework/react/guides/mutations>
- <https://aws.amazon.com/ko/blogs/compute/understanding-and-remediating-cold-starts-an-aws-lambda-perspective/>

[open-api-spec-with-orval-link]: https://junhyunny.github.io/openapi/orval/auto-generate-code/react-query/msw/open-api-spec-with-orval/
[using-mock-service-worker-with-orval-link]: https://junhyunny.github.io/react/react-query/msw/orval/using-mock-service-worker-with-orval/