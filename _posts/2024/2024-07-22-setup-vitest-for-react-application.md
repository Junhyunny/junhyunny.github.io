---
title: "Setup Vitest for React App"
search: false
category:
  - vite
  - react
last_modified_at: 2024-07-22T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Setup React test environment in Vite][react-test-environment-link]

## 0. 들어가면서

[22년 글][react-test-environment-link]에서 Vite 번들러를 사용할 때 테스트 환경을 구축하는 방법에 대해 정리했었다. 그 쯤부터 모든 프로젝트에서 Vite를 사용하긴 했다. 문제가 있다면 필자는 항상 프로젝트 중간에 들어가거나 프론트엔드 프로젝트를 다른 분이 셋업해줬다는 사실이다. 그 이후에 많은 것들이 바뀐 것 같다. 그 중 하나는 Vite 번들러를 사용할 때 Jest를 대신해 Vitest를 주요 테스트 라이브러리로 사용한다는 점이다. Vite는 여전히 테스트 환경을 기본으로 제공하지 않기 때문에 이 글을 통해 정리했다. 

## 1. Create React App with Vite

터미널에서 간단한 명령어를 통해 리액트 앱을 만들 수 있다. [공식 홈페이지](https://ko.vitejs.dev/guide/#scaffolding-your-first-vite-project)에 잘 정리되어 있으므로 이를 참고하길 바란다.

```
$ npm create vite@latest action-in-blog -- --template react-ts

> npx
> create-vite action-in-blog --template react-ts


Scaffolding project in /Users/junhyunkang/Desktop/action-in-blog...

Done. Now run:

  cd action-in-blog
  npm install
  npm run dev
```

## 2. Install depenencies

이제 필요한 의존성들을 설치해보자. 

### 2.1. Vitest

제일 먼저 Vitest를 설치한다.

```
$ npm install -D vitest
```

Vitest를 설치하면 아래 간단한 테스트 정도의 검증 코드 작성이 가능하다. Vitest는 예상되는 결과를 검증할 때 사용한다.

```ts
import { expect, test } from "vitest";

test("adds 1 + 2 to equal 3", () => {
  expect(1 + 2).toBe(3);
});
```

package.json 파일에 CLI(Command Line Interface)에서 테스트를 실행하기 위한 스크립트 명령어를 추가한다. 

```json
{ 
  ...
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest", // this line
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  ...
}
```

### 2.2. jsdom library

`jsdom`은 순수 자바스크립트(JavaScript)를 사용해 다양한 WHATWG DOM, HTML 같은 웹 표준을 구현한 것이다. jsom 라이브러리의 용도는 실제 웹 애플리케이션을 스크래핑(scraping)하거나 테스트할 수 있도록 웹 브라우저의 서브셋(subset) 에뮬레이트(emulate)하는 것이다. 이 라이브러리 덕분에 실제 웹 브라우저 DOM을 대상으로 테스트하는 것이 가능하다.

아래 명령어로 jsdom 라이브러리를 설치한다. 

```
$ npm install -D jsdom
```

`vite.config.ts` 설정을 변경한다. 테스트 환경을 `jsdom`으로 지정한다. 

1. 파일 상단에 레퍼런스 타입을 `vitest`로 지정한다.
2. test.environment 설정을 `jsdom`으로 지정한다.

```ts
/// <reference types="vitest" /> // 1
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom", // 2
  },
});
```

파일 상단에 레퍼런스 타입을 작성하지 않는다면 타입스크립트 프로젝트에서 다음과 같은 에러를 만날 수 있다.

```
TS2769: No overload matches this call.
The last overload gave the following error.
Object literal may only specify known properties, and test does not exist in type UserConfigExport index.d.ts(3194, 18): The last overload is declared here.
```

<div align="center">
  <img src="/images/posts/2024/setup-vitest-for-react-application-01.png" width="100%" class="image__border">
</div>

### 2.3. React Testing Library

리액트 애플리케이션을 테스트를 위해 RTL(React Testing Library) 라이브러리를 설치한다. 리액트 컴포넌트를 렌더(render)하거나 screen 객체를 통해 테스트 코드로 그린 컴포넌트 화면에서 DOM 객체를 찾을 수 있다. 다음과 같은 라이브러리들을 설치한다.

- @testing-library/react
  - RTL 코어 라이브러리이다.
- @testing-library/react
  - RTL 코어 라이브러리이다.
- @testing-library/jest-dom
  - Jest에서 제공하지만, Vitest에서 제공하지 않는 매처(matcher)를 확장하기 위해 사용한다. 
- @testing-library/user-event
  - 사용자 인터렉션(interaction)을 재현한다.
- @types/react, @types/react-dom
  - 타입스크립트 사용시 추가적으로 필요한 라이브러리들이다.

```
$ npm install -D @testing-library/react\
  @testing-library/dom\
  @testing-library/jest-dom\
  @testing-library/user-event\
  @types/react\
  @types/react-dom
```

설치가 완료되면 추가적으로 테스트 셋업(setup) 파일이 필요하다. 프로젝트 루트 경로에 `vitest-setup.ts` 파일을 만들고 다음 설정을 추가한다.

1. jest-dom 라이브러리를 사용해 Jest에서 사용하는 매처를 확장한다.
  - 해당 라이브러리를 임포트함으로써 toHaveValue, toBeInTheDoument 매처를 사용할 수 있다.
2. Vitest는 테스트가 끝나면 메모리에 그려진 화면이 지워지지 않기 때문에 매 테스트가 끝날 때마다 초기화(cleanup)가 필요하다.
  - 초기화 코드가 없는 경우 테스트 코드마다 렌더링 한 컴포넌트가 화면에 계속 중복되어 추가된다.

```ts
import "@testing-library/jest-dom/vitest"; // 1
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup(); // 2
});
```

`vite.config.ts` 파일에 테스트 관련 설정을 변경한다.

1. 위에서 만든 `vitest-setup.ts` 파일을 셋업 파일로 지정한다.

```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./vitest-setup.ts", // 1
  },
});
```

타입스크립트(typescript) 코드가 컴파일할 때 Jest 매처를 찾을 수 있도록 `vitest-setup.ts` 파일을 `tsconfig.app.json` 설정에 추가한다.

```json
{
  "compilerOptions": {
    ...
  },
  "include": ["src", "vitest-setup.ts"] // here
}
```

## 3. Make Test Code

테스트 환경 구축이 완료됬다. 다음과 같은 구현체 코드를 테스트해보자.

1. 화면에 "username" 플레이스홀더 값을 갖는 input 태그가 있다.
2. reset 버튼을 누르면 input 태그의 값이 초기화된다.

```tsx
import { useRef } from "react";

function App() {
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <>
      <input type="text" ref={inputRef} placeholder="username" />
      <button onClick={reset}>reset</button>
    </>
  );
}

export default App;
```

다음과 같은 테스트 코드를 작성한다. `jest-dom` 라이브러리 설정이 제대로 셋업되어 있지 않은 경우 toBeInTheDocument, toHaveValue 매처를 사용할 때 컴파일 에러가 발생할 수 있다.

1. App 컴포넌트를 렌더링 후 필요한 DOM 객체가 있는지 확인한다. 
2. App 컴포넌트를 렌더링 후 input 태그에 값을 입력하면 정상적으로 입력되는지 확인한다.
3. App 컴포넌트 input 태그에 값을 입력 후 reset 버튼을 누르면 정상적으로 초기화 되는지 확인한다.

```tsx
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App.tsx";

test("adds 1 + 2 to equal 3", () => {
  expect(1 + 2).toBe(3);
});

describe("App Tests", () => {
  test("render App Component", () => { // 1
    render(<App />);

    expect(screen.getByPlaceholderText("username")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "reset" })).toBeInTheDocument();
  });

  test("write username", async () => { // 2
    render(<App />);
    const input = screen.getByPlaceholderText("username");

    await userEvent.type(input, "junhyunny");

    expect(input).toHaveValue("junhyunny");
  });

  test("username is written when click reset then clear input field", async () => { // 3
    render(<App />);
    const input = screen.getByPlaceholderText("username");
    const button = screen.getByRole("button", { name: "reset" });
    await userEvent.type(input, "junhyunny");

    await userEvent.click(button);

    expect(input).not.toHaveValue();
  });
});
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-07-22-setup-vitest-for-react-application>

#### REFERENCE

- <https://ko.vitejs.dev/guide/#scaffolding-your-first-vite-project>
- <https://vitest.dev/guide/>
- <https://github.com/jsdom/jsdom>
- <https://testing-library.com/docs/react-testing-library/intro/>
- <https://medium.com/@kimtai.developer/react-typescript-vite-testing-with-vitest-react-testing-library-rtl-and-mock-service-worker-6f5790eedf84>
- <https://github.com/testing-library/jest-dom/issues/567#issuecomment-1948738289>

[react-test-environment-link]: https://junhyunny.github.io/react/vite/jest/react-test-environment/
