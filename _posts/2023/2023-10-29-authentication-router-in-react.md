---
title: "React 인증 라우터 구현하기"
search: false
category:
  - react
last_modified_at: 2026-01-27T00:00:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Outlet Component in React Router][outlet-component-in-react-router-link]
- [JWT(Json Web Token)][json-web-token-link]

## 0. 들어가면서

로그인했거나 특정 권한이 있는 사용자만 지정된 페이지에 접근할 수 있도록 제어하기 위한 인증 라우터(authentication router)를 만드는 방법에 대해 정리하였다. 이 글에서 정리한 인증 라우터 기능을 이해하려면 몇 가지 사전 지식이 필요하다.

## 1. Outlet Component

인증 라우터 개발을 위해 리액트 라우터 v6의 Outlet 컴포넌트의 기능을 사용했다. Outlet 컴포넌트에 대한 이해가 필요하기 때문에 관련된 내용을 살펴보겠다. 공식 홈페이지에는 다음과 같이 소개되어 있다.

> An <Outlet> should be used in parent route elements to render their child route elements. This allows nested UI to show up when child routes are rendered. If the parent route matched exactly, it will render a child index route or nothing if there is no index route.

Oultet 컴포넌트는 중첩된 라우터를 구성하였을 때 부모 라우터에 지정된 컴포넌트(component)에서 자식 라우터에 지정된 컴포넌트를 렌더링할 때 사용된다. 보통 헤더(header)나 푸터(footer) 같은 공통 부분을 재사용하기 위해 사용한다. 부모 라우터에 지정된 컴포넌트 내부에 Outlet 컴포넌트 영역은 자식 라우터들에게 지정된 엘리먼트가 렌더링되는 영역이다. 간단한 예시 코드를 통해 개념을 확인하고 싶다면 [Outlet Component in React Router][outlet-component-in-react-router-link] 포스트를 참고하길 바란다.

<div align="center">
  <img src="/images/posts/2023/authentication-router-in-react-01.png" width="100%" class="image__border">
</div>

## 2. JWT(Json Web Token)

인증 라우터를 구현하려면 다음과 같은 정보가 필요하다.

- 로그인 여부
- 사용자 권한 

사용자 권한은 서버로부터 받아오기 때문에 비동기 요청이 수행된다. 인증 라우터는 렌더링되는 시점에 브라우저 메모리에 사용자 정보가 준비되어 있어야하기 때문에 사용자 정보를 서버로부터 얻은 후 처리하는 방법은 어려웠다. 새로고침 등으로 페이지를 다시 로딩하면서 상태(state)가 초기화되는 문제도 있었다.

필자는 `JWT`로 사용자 인증 프로세스를 구현한 애플리케이션을 개발하고 있었기 때문에 이를 활용하였다. `JWT`는 Json 형식의 데이터를 이용한 클레임(claim) 기반의 토큰이다. 클레임 기반 토큰은 토큰 내부에 사용자 정보나 데이터 속성을 가지고 있다. 쉽게 말하면 Json 형식의 사용자 정보를 토큰으로 만든 것이다. 세 가지 영역으로 구분된다.

- 헤더(header)
- 페이로드(payload)
- 서명(verify signature)

사용자 정보는 페이로드 영역에 위치한다. 해당 예제에서는 다음과 같은 페이로드 형식을 가지는 `JWT`를 사용하였다.

- sub - 사용자 아이디
- roles - 사용자 권한 리스트

<div align="center">
  <img src="/images/posts/2023/authentication-router-in-react-02.png" width="100%" class="image__border">
</div>

## 3. Practice

구현 코드를 살펴보겠다. 인증 라우터를 구성하는데 필요한 컴포넌트들만 정리하였다. 전체 코드가 필요한 분들은 글 하단 테스트 코드 링크를 참조하시길 바란다. 

### 3.1. UserRepository

액세스 토큰을 저장하고, 토큰으로부터 사용자 정보를 추출하는 모듈이다. 로컬 스토리지(local storage)에 토큰 정보를 저장 후 사용한다.

- hasToken 함수
  - 토큰이 존재하는지 확인한다.
- getUserInfo 함수
  - JWT 페이로드에서 사용자 정보를 추출한다. 

```tsx
import { User } from "../type/User";

const X_USER_TOKEN = "X-USER-TOKEN";

export const setAccessToken = (accessToken: string) => {
  localStorage.setItem(X_USER_TOKEN, accessToken);
};

export const getAccessToken = () => {
  return localStorage.getItem(X_USER_TOKEN);
};

export const hasToken = () => {
  return getAccessToken() !== null;
};

export const getUserInfo = (): User | null => {
  const token = getAccessToken();
  if (token) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    const parsedJson = JSON.parse(jsonPayload);
    return {
      id: parsedJson.sub,
      name: parsedJson.name,
      roles: parsedJson.roles,
    };
  }
  return null;
};
```

### 3.2. UserProvider

사용자 정보를 전역에서 사용할 수 있도록 컨텍스트(context)를 준비한다.

- 로컬 스토리지에 저장된 토큰 존재 유무로 로그인 여부를 판단한다.
  - 토큰 존재 유무로만 로그인 여부를 판단하는 것은 정확하지 않다.
  - 토큰이 유효한지 서버로부터 확인 받은 후 로그인 유무를 판단하는 로직이 추가적으로 필요하다.
- 로컬 스토리지에 저장된 토큰을 기반으로 초기 사용자 정보를 생성한다.
  - 새로고침 등으로 상태가 초기화되는 문제를 방지한다.
  - 사용자 정보를 비동기로 조회하면 렌더링 시점에 필요한 정보를 사용하지 못한다는 문제점을 해결한다.

```tsx
import { createContext, ReactNode, useState } from "react";
import { User } from "../type/User";
import { getUserInfo, hasToken } from "../repository/UserRepository";

type UserContextType = {
  isLoggedIn: boolean;
  user: User | null;
};

type Props = {
  children: ReactNode;
};

export const UserContext = createContext<UserContextType | null>(null);

const UserProvider = ({ children }: Props) => {
  const [isLoggedIn, setLoggedIn] = useState<boolean>(hasToken());
  const [user, setUser] = useState<User | null>(getUserInfo());
  return (
    <UserContext.Provider
      value={ {
        isLoggedIn,
        user,
      } }
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
```

### 3.3. Page Components

각 화면 컴포넌트들을 살펴보자. 먼저 홈 화면은 "Home"이라는 텍스트를 렌더링한다. 링크를 눌러 로그인한 사용자만 접근할 수 있는 경로로 이동한다. 

```tsx
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="home">
      <div>Home</div>
      <Link to="/user">move to user page</Link>
    </div>
  );
};

export default Home;
```

다음 사용자 화면은 "User Page"라는 텍스트를 렌더링한다. 링크를 눌러 관리자만 접근할 수 있는 경로로 이동한다.

```tsx
import { Link } from "react-router-dom";

const UserPage = () => {
  return (
    <div className="user">
      <div>User Page</div>
      <Link to="/admin">move to admin page</Link>
    </div>
  );
};

export default UserPage;
```

마지막으로 관리자 화면은 "Admin Page"라는 텍스트를 렌더링한다.

```tsx
const AdminPage = () => {
  return (
    <div className="admin">
      <div>Admin Page</div>
    </div>
  );
};

export default AdminPage;
```

### 3.4. AuthRouter

인증 라우터는 로그인 유무와 관리자 여부를 판단 후 적합하지 않은 사용자인 경우 홈 화면으로 리다이렉트시킬 수 있도록 `Navigate` 컴포넌트를 반환한다. 로그인 유무와 사용자 정보는 UserProvider 컴포넌트로부터 전달받는다.

- 로그인 유무를 판단한다. 로그인하지 않은 사용자인 경우 홈 화면으로 이동하는 Navigate 컴포넌트를 반환한다.
- 관리자만 접근할 수 있는 페이지가 아니라면 Outlet 컴포넌트를 반환한다.
- 관리자만 접근할 수 있는 페이지라면 사용자 권한을 확인한다.

```tsx
import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { UserContext } from "../provider/UserProvider";

type Props = {
  isAdminOnly?: boolean;
};

const AuthRouter = ({ isAdminOnly }: Props = { isAdminOnly: false }) => {
  const { isLoggedIn, user } = useContext(UserContext)!;
  if (!isLoggedIn) {
    return <Navigate replace to="/home" />;
  }
  if (!isAdminOnly) {
    return <Outlet />;
  }
  return user?.roles.includes("ADMIN") ? (
    <Outlet />
  ) : (
    <Navigate replace to="/home" />
  );
};

export default AuthRouter;
```

### 3.5. App

애플리케이션 메인 컴포넌트이다. 접근 제어가 필요한 경로는 AuthRouter 컴포넌트가 지정된 루트의 하위 루트로 지정한다.

- UserPage 컴포넌트는 인증된 사용자만 접근할 수 있도록 제어한다.
- AdminPage 컴포넌트는 관리자만 접근할 수 있도록 제어한다.

```tsx
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import UserProvider from "./provider/UserProvider";
import AuthRouter from "./component/AuthRouter";

import Home from "./page/Home";
import UserPage from "./page/UserPage";
import AdminPage from "./page/AdminPage";

import "./App.css";

function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<AuthRouter />}>
          <Route path="user" element={<UserPage />} />
        </Route>
        <Route path="/" element={<AuthRouter isAdminOnly={true} />}>
          <Route path="admin" element={<AdminPage />} />
        </Route>
        <Route index={true} element={<Navigate replace to={"/home"} />} />
      </Routes>
    </UserProvider>
  );
}

export default App;
```

## 4. Unit Test

AuthRouter 컴포넌트의 기능에 대한 단위 테스트이다. 다음과 같은 네 가지 상황에 따라 AuthRouter 컴포넌트를 렌더링 했을 때 예상되는 결과를 확인한다.

- 일반 인증
  - 로그인하지 않은 사용자인 경우 `/home` 경로로 리다이렉트하는 Navigate 컴포넌트가 렌더링된다.
  - 로그인한 사용자인 경우 Outlet 컴포넌트가 렌더링된다.
- 인증 및 관리자 권한 확인
  - 일반 사용자인 경우 `/home` 경로로 리다이렉트하는 Navigate 컴포넌트가 렌더링된다.
  - 관리자인 경우 Outlet 컴포넌트가 렌더링된다.

```tsx
import { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

import UserProvider from "../provider/UserProvider";
import AuthRouter from "./AuthRouter";
import { setAccessToken } from "../repository/UserRepository";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Outlet: () => <div data-testid="Outlet" />,
  Navigate: (props: any) => <div data-testid="Navigate">{props.to}</div>,
}));

const stubToken =
  "header.eyJzdWIiOiJqdW5oeXVubnkiLCJyb2xlcyI6WyJVU0VSIl0sImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNjk4NTAwMDUxfQ.signature";

const stubAdminToken =
  "header.eyJzdWIiOiJqdW5oeXVubnkiLCJyb2xlcyI6WyJBRE1JTiJdLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTY5ODUwMDA1MX0.signature";

describe("AuthRouter Tests", () => {
  test("given user is not login when render AuthRouter then return Navigate with home path", () => {
    render(withContext(<AuthRouter />));

    expect(screen.getByTestId("Navigate")).toBeInTheDocument();
    expect(screen.getByText("/home")).toBeInTheDocument();
  });

  test("given user is login when render AuthRouter then return Outlet", () => {
    setAccessToken(stubToken);

    render(withContext(<AuthRouter />));

    expect(screen.getByTestId("Outlet")).toBeInTheDocument();
  });

  test("given user is login but not admin when render AuthRouter when isOnlyAdmin is true then Navigate with home path", () => {
    setAccessToken(stubToken);

    render(withContext(<AuthRouter isAdminOnly={true} />));

    expect(screen.getByTestId("Navigate")).toBeInTheDocument();
    expect(screen.getByText("/home")).toBeInTheDocument();
  });

  test("given admin is login when render AuthRouter when isOnlyAdmin is true then Outlet", () => {
    setAccessToken(stubAdminToken);

    render(withContext(<AuthRouter isAdminOnly={true} />));

    expect(screen.getByTestId("Outlet")).toBeInTheDocument();
  });
});

const withContext = (component: ReactNode) => {
  return <UserProvider>{component}</UserProvider>;
};
```

## 5. Result

애플리케이션을 실행하면 다음과 같이 동작하는 화면을 볼 수 있다.

- 토큰이 없는 경우 로그인되지 않은 사용자로 판단한다.
  - 로그인 된 사용자만 접근할 수 있는 화면으로 접근 불가능하다.
- 토큰이 있는 경우 로그인 된 사용자로 판단한다.
  - 로그인 된 사용자만 접근할 수 있는 화면으로 접근 가능하다.
  - 관리자만 접근할 수 있는 화면으로 접근 불가능하다.
- 토큰 페이로드에 "ADMIN"이라는 권한을 가진 사용자 정보가 저장된 경우 관리자로 판단한다.
  - 관리자만 접근할 수 있는 화면까지 접근 가능하다.

<div align="center">
  <img src="/images/posts/2023/authentication-router-in-react-03.gif" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-10-29-authentication-router-in-react>

#### REFERENCE

- <https://reactrouter.com/en/main/components/outlet>
- <https://stackoverflow.com/questions/38552003/how-to-decode-jwt-token-in-javascript-without-using-a-library>
- <https://velog.io/@inwoo920/Private-Route%EC%99%80-Outlet>

[outlet-component-in-react-router-link]: https://junhyunny.github.io/react/react-router-dom/outlet-component-in-react-router/
[json-web-token-link]: https://junhyunny.github.io/information/json-web-token/