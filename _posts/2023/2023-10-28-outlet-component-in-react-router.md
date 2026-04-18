---
title: "React Router의 Outlet 컴포넌트"
search: false
category:
  - react
  - react-router-dom
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

## 0. 들어가면서

최근 인증 라우터를 만들 때 리액트 라우터 v6 Outlet 컴포넌트를 사용했는데 이에 관련된 내용을 정리하였다.

## 1. Outlet Component

공식 홈페이지에는 다음과 같이 소개되어 있다.

> An <Outlet> should be used in parent route elements to render their child route elements. This allows nested UI to show up when child routes are rendered. If the parent route matched exactly, it will render a child index route or nothing if there is no index route.

Outlet 컴포넌트는 중첩된 라우터를 구성하였을 때 부모 라우터에 지정된 컴포넌트에서 자식 라우터에 지정된 컴포넌트를 렌더링할 때 사용된다. 헤더(header)나 푸터(footer) 같은 공통 부분을 재사용하기 위해 사용한다. 간단한 예제 코드를 통해 동작 모습을 확인해보겠다.

## 2. Components

화면을 구성할 컴포넌트들을 살펴보겠다.

### 2.1. MainContainer Component

헤더와 푸터 영역을 정의한다. 자식 라우터의 컴포넌트가 렌더링될 위치에 Outlet 컴포넌트를 추가한다.

```tsx
import React from "react";
import { Outlet } from "react-router-dom";

const MainContainer = () => {
  return (
    <div className="main-container">
      <header>Header</header>
      <div>
        <Outlet />
      </div>
      <footer>Footer</footer>
    </div>
  );
};

export default MainContainer;
```

### 2.2. Home Component

다음과 같은 항목들을 렌더링한다.

- "Home" 텍스트
- 사용자 페이지로 이동할 수 있는 링크

```tsx
import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="home">
      <div>Home</div>
      <Link to="/user">사용자 페이지</Link>
    </div>
  );
};

export default Home;
```

### 2.3. UserInformation Component

다음과 같은 항목들을 렌더링한다.

- "UserInformation" 텍스트
- 사용자 페이지로 이동할 수 있는 링크

```tsx
import React from "react";
import { Link } from "react-router-dom";

const UserInformation = () => {
  return (
    <div className="user">
      <div>UserInformation</div>
      <Link to="/home">홈 페이지</Link>
    </div>
  );
};

export default UserInformation;
```

## 3. App

App 컴포넌트에서 다음과 같이 루트를 정의한다.

- 인덱스로 접근하는 경우 `/home` 경로로 리다이렉트한다.

```tsx
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import MainContainer from "./container/MainContainer";
import Home from "./page/Home";
import UserInformation from "./page/UserInformation";

import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainContainer />}>
        <Route path="home" element={<Home />} />
        <Route path="user" element={<UserInformation />} />
      </Route>
      <Route index={true} element={<Navigate replace to={"/home"} />} />
    </Routes>
  );
}

export default App;
```

## 4. Result

다음과 같은 결과를 확인할 수 있다.

- 인덱스로 접근하면 `/home` 경로로 리다이렉트된다.
- MainContainer 컴포넌트와 내부 Outlet 컴포넌트 영역에 Home 컴포넌트가 렌더링된다.
- 링크를 눌러 `/user` 경로로 이동한다.
- MainContainer 컴포넌트와 내부 Outlet 컴포넌트 영역에 UserInformation 컴포넌트가 렌더링된다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/outlet-component-in-react-router-01.gif" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-10-28-outlet-component-in-react-router>

#### RECOMMEND NEXT POSTS

- [React 인증 라우터 구현하기][authentication-router-in-react-link]

#### REFERENCE

- <https://reactrouter.com/en/main/components/outlet>

[authentication-router-in-react-link]: https://junhyunny.github.io/react/authentication-router-in-react/
