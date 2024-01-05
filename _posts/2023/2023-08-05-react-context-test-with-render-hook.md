---
title: "React Context Test using renderHook"
search: false
category:
  - react
last_modified_at: 2023-08-05T23:55:00
---

<br/>

## 1. renderHook

`renderHook` 함수는 리액트의 커스텀 훅(custom hook)을 테스트할 때 사용합니다. 
커스텀 훅의 기능을 테스트하는 방법은 크게 두 가지로 나눌 수 있습니다. 

* 실제 컴포넌트를 활용한 간접적인 테스트
* renderHook 함수를 통한 직접적인 테스트

리액트 컨텍스트(react context) 테스트도 마찬가지로 실제 컴포넌트를 사용해 간접적인 테스트를 수행하거나 renderHook 함수를 사용해 직접적인 테스트가 가능합니다. 
renderHook 함수를 사용하는 것은 실제 컴포넌트를 사용해 컨텍스트의 기능 테스트가 분산되거나 테스트를 위한 컴포넌트를 별도로 만들어야 하는 경우 유용합니다. 
간단한 예시를 살펴보겠습니다. 

## 2. React Context Test

다음과 같은 사용자 컨텍스트가 존재합니다. 

```tsx
import { createContext, ReactNode, useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: number;
  name: string;
  email: string;
}

const initialState: User = {
  id: 0,
  name: "",
  email: "",
};

export const UserContext = createContext<User | null>(null);

const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(initialState);

  useEffect(() => {
    axios
      .get("/users", {
        headers: {
          Authorization: "some-token",
        },
      })
      .then((response) => {
        const { data } = response;
        setUser(data);
      });
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export default UserContextProvider;
```

### 2.1. Using Real Component

실제 컨텍스트를 사용하는 컴포넌트를 통해 간접적으로 테스트를 수행합니다. 

#### 2.1.1. Header Compnent

* 헤더 컴포넌트는 사용자 컨텍스트로부터 사용자 정보를 얻습니다.
* 사용자 정보를 화면에 표시합니다.

```tsx
import { useContext } from "react";
import { UserContext } from "../context/UserContextProvider";

const Header = () => {
  const user = useContext(UserContext)!;
  return (
    <div>
      <div>{user.name}</div>
      <div>{user.email}</div>
    </div>
  );
};

export default Header;
```

#### 2.1.2. Header Component Test

* 헤더 컴포넌트와 사용자 컨텍스트를 함께 렌더(render)합니다.
* 사용자 정보가 화면에 표시되는지 확인합니다.

```tsx
import { render, screen } from "@testing-library/react";

import UserContextProvider from "../context/UserContextProvider";
import Header from "./Header";
import axios from "axios";

it("사용자는 자신의 이름과 이메일 정보를 헤더에서 확인할 수 있다.", async () => {
  jest.spyOn(axios, "get").mockResolvedValue({
    data: {
      id: 1,
      name: "Junhyunny",
      email: "kang3966@naver.com",
    },
  });

  render(
    <UserContextProvider>
      <Header />
    </UserContextProvider>
  );

  expect(await screen.findByText("Junhyunny")).toBeInTheDocument();
  expect(screen.getByText("kang3966@naver.com")).toBeInTheDocument();
});
```

### 2.2. Using renderHook

컴포넌트와 함께 결합하여 테스트하는 방식은 다음과 같은 제한점이 있습니다. 

* 컨텍스트를 사용하는 컴포넌트와 함께 테스트해야하므로 컨텍스트의 기능 테스트가 분산됩니다.
* 컨텍스트의 기능을 한 곳에서 테스트하기 위해선 테스트용 컴포넌트를 만들어야합니다. 

renderHook 함수를 사용하면 이런 문제점을 해결할 수 있습니다. 
컨텍스트 기능을 한 곳에서 테스트할 수 있고 필요하다면 프로퍼티를 변경하여 다시 렌더할 수 있습니다. 

#### 2.2.1. UserContextProvicer Test

* renderHook 함수에 UserContextProvicer 컴포넌트를 래퍼(wrapper) 객체로 제공합니다. 
* renderHook의 콜백 함수에서 useContext 훅을 수행합니다.
    * 필요한 경우 useContext 훅이 포함된 커스텀 훅을 실행할 수 있습니다.
* renderHook 실행 결과로 원하는 값이 나오는지 확인합니다. 

```tsx
import { useContext } from "react";
import { renderHook, waitFor } from "@testing-library/react";

import UserContextProvider, { UserContext } from "./UserContextProvider";
import axios from "axios";

it("사용자 컨텍스트는 사용자 정보를 제공한다.", async () => {
  jest.spyOn(axios, "get").mockResolvedValue({
    data: {
      id: 1,
      name: "Junhyunny",
      email: "kang3966@naver.com",
    },
  });
  const wrapper = (props: any) => (
    <UserContextProvider>{props.children}</UserContextProvider>
  );

  const { result } = renderHook(() => useContext(UserContext), {
    wrapper
  });

  await waitFor(() => {
    expect(result.current?.id).toEqual(1);
    expect(result.current?.name).toEqual("Junhyunny");
    expect(result.current?.email).toEqual("kang3966@naver.com");
  });
});
```

## CLOSING

[advanced-hooks](https://react-hooks-testing-library.com/usage/advanced-hooks) 글을 보면 useContext 훅을 사용하는 커스텀 훅을 테스트합니다. 
컨텍스트 프로바이더(context provider)를 통해 전달되는 값을 확인할 수 있습니다. 
초기 상태를 지정할 수 있으며 필요한 경우 프로퍼티를 변환하면서 리-렌더링할 수 있습니다. 

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-08-05-react-context-test-with-render-hook>

#### REFERENCE

* <https://react-hooks-testing-library.com/usage/advanced-hooks>
* <https://www.daleseo.com/react-hooks-testing-library/>