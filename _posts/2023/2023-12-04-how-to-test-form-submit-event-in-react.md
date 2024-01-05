---
title: "How to test form submit event in React"
search: false
category:
  - react
  - jest
last_modified_at: 2023-12-04T23:55:00
---

<br/>

## 0. 들어가면서

프론트엔드 애플리케이션에서 로그인 기능을 구현할 때 페이지 리다이렉트를 위해 HTML 폼(form) 태그를 사용했는데 테스트 코드를 작성하는게 어려웠습니다. 이번 글은 HTML 폼의 제출 기능을 테스트하는 방법에 대해 정리하였습니다. 

## 1. Implementation

구현 코드는 다음과 같습니다. 

- 폼을 하나 정의합니다.
- 폼 내부에 사용자 이름과 비밀번호를 입력할 수 있는 텍스트 박스들을 추가합니다. 
- 폼 내부에 제출 버튼을 만듭니다.  

```tsx
import React from "react";

function App() {
  return (
    <form action="/login" method="post" aria-label="form">
      <label>
        username
        <input type="text" name="username" placeholder="username" />
      </label>
      <label>
        password
        <input type="password" name="password" placeholder="password" />
      </label>
      <button type="submit">login</button>
    </form>
  );
}

export default App;
```

## 2. Test Code

HTML 폼의 제출(submit)은 브라우저가 기본으로 제공하기 때문에 스파이(spy)를 사용한 API 호출과 파라미터 검증이 어려웠습니다. 브라우저의 기본 기능에 대한 검증은 어렵기 때문에 폼 제출 기능을 이해하고 다음과 같은 개념을 적용한 테스트 코드를 작성했습니다. 

- 폼의 메소드(method)나 액션(action) 값이 잘 설정되었는지 확인합니다.
    - 제출 이벤트가 발생하면 폼에 설정된 메소드와 액션을 따라 요청이 수행됩니다.
    - 메소드는 HTTP 요청 메소드입니다.
    - 액션은 HTTP 요청 경로입니다.
- 폼을 제출하기 전 필요한 값들이 모두 잘 입력되었는지 확인합니다.
    - 폼 내부 텍스트 박스의 `name` 속성(attribute)에 따라 요청 메세지가 변경됩니다.
    - 요청 메세지를 만들 때 `name` 속성이 필요한 값으로 잘 설정되었는지 검증합니다.
- 폼 내부에 버튼을 눌렀을 때 제출 이벤트가 잘 실행되었는지 확인합니다.
    - 폼 외부에 버튼이 위치한 경우 클릭 했을 때 제출 이벤트가 호출되지 않습니다.

코드에 대한 설명은 가독성을 위해 주석으로 작성했습니다.

```tsx
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "./App";

test("renders learn react link", () => {
  render(<App />);
  const form = loginForm();
  form.onsubmit = jest.fn(); // 폼의 제출 이벤트를 스파이로 변경

  // 폼 내부 텍스트 박스를 입력 후 제출 이벤트 수행
  userEvent.type(nameInput(), "junhyunny");
  userEvent.type(passwordInput(), "12345");
  fireEvent.submit(loginButton());

  // 폼에 설정된 값들을 검증
  expect(form).toHaveAttribute("method", "post");
  expect(form).toHaveAttribute("action", "/login");
  // 폼에 입력된 값들을 검증
  expect(form).toHaveFormValues({
    username: "junhyunny",
    password: "12345",
  });
  // 폼의 제출 이벤트가 호출되었는지 확인
  expect(form.onsubmit).toHaveBeenCalled();
});

const loginForm = () =>
  screen.getByRole("form", {
    name: "form",
  });

const nameInput = () => screen.getByPlaceholderText("username");

const passwordInput = () => screen.getByPlaceholderText("password");

const loginButton = () =>
  screen.getByRole("button", {
    name: "login",
  });
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-12-04-how-to-test-form-submit-event-in-react>

#### REFERENCE

- <https://stackoverflow.com/questions/66110028/how-to-test-button-that-call-submit-form-using-jest-and-react-testing-library>