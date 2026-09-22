---
title: "리액트(React) 한글 키보드 이벤트 오류"
search: false
category:
  - react
  - typescript
last_modified_at: 2026-09-22T23:28:32+09:00
---

<br/>

## 0. 들어가면서

리액트(React) 프로젝트에서 한글을 입력할 때 마지막 문자가 중복으로 입력되는 현상을 발견하였다. 문제의 원인과 해결 방법을 정리하였다.

## 1. 문제 현상

아래 코드를 크롬 브라우저에서 실행하면 한글을 입력할 때 문제가 발생한다.

- 텍스트 박스(text box)에 한글을 입력하고 엔터(Enter)를 누른다.
- 입력된 값을 저장하고 텍스트 박스의 값을 초기화한다.
- 입력된 값의 마지막 문자가 한 번 더 저장된다.

```tsx
import React, { ChangeEvent, KeyboardEvent, useState } from "react";
import "./App.css";

function App() {
  const [todo, setTodo] = useState<string>("");
  const [todoList, addTodoList] = useState<string[]>([]);

  const onChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    setTodo(event.target.value);
  };

  const onKeyboardEvent = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      addTodoList((prevState) => {
        return [...prevState, todo];
      });
      setTodo("");
    }
  };

  return (
    <div className="App">
      <input
        type="text"
        value={todo}
        onChange={onChangeHandler}
        onKeyDown={onKeyboardEvent}
      />
      <div>
        {todoList.map((todo, index) => (
          <div key={index} className="todo">
            {todo}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
```

실행 결과를 살펴보자. 마지막 글자인 "요"가 한 번 더 입력된다.

<div align="center">
  <img src="{{ site.image_url_2022 }}/korean-keyboard-event-error-01.gif" width="100%" class="image__border">
</div>

## 2. IME(Input Method Editor) and CompositionEvent

[VueJS 한글 입력 시 v-model 오류][vue-js-korean-length-link] 글에서 다뤘던 개념이다. 이 문제는 IME(Input Method Editor) 과정에서 `KeyDown` 이벤트가 발생할 때 운영체제와 브라우저가 해당 이벤트를 중복 처리하기 때문에 발생한다. 위키피디아(Wikipedia)에서는 IME를 다음과 같이 정의한다.

> IME(Input Method Editor)<br/>
> An input method (or input method editor, commonly abbreviated IME) is an operating system component or program that enables users to generate characters not natively available on their input devices by using sequences of characters (or mouse operations) that are natively available on their input devices. Using an input method is usually necessary for languages that have more graphemes than there are keys on the keyboard.

`IME`는 한글처럼 조합이 필요한 문자의 입력을 지원하는 운영체제(operating system) 컴포넌트(component) 또는 프로그램이다. 이 기능을 통해 사용자는 입력 기기로 직접 입력할 수 없는 문자를 조합해 작성할 수 있다. 예를 들어 사용자는 라틴(Latin) 계열 키보드로 중국어, 일본어, 한국어 등을 입력할 수 있다. 한글처럼 IME 기능이 필요한 언어를 브라우저에서 입력할 때는 정상적으로 처리되지 않을 수 있다. 문제 양상은 운영체제와 브라우저 종류에 따라 다를 수 있다.

이해를 돕기 위해 웹(Web) API인 `CompositionEvent`를 살펴보자. `CompositionEvent`는 IME를 사용해 문자를 조합하는 과정에서 발생하는 이벤트다. 한글과 같은 IME 입력은 일반 키 입력과 달리 여러 키 입력을 조합해 하나의 문자를 만든다. 예를 들어 `각`이라는 문자를 입력할 때 다음과 같은 과정이 일어난다.

```
ㄱ
가
각
```

문자가 완성될 때까지 조합 상태가 계속 바뀌는데, 이 과정을 `CompositionEvent`로 감지할 수 있다. 브라우저는 이 과정을 컴포지션 세션(composition session)으로 관리하며 `compositionstart`, `compositionupdate`, `compositionend` 이벤트를 발생시킨다.

## 3. 문제 해결

`KeyboardEvent`에는 현재 키 이벤트가 컴포지션 세션 도중에 발생했는지를 알려주는 `isComposing` 속성이 있다. 따라서 Enter 키를 처리할 때 `isComposing` 속성을 확인하면 한글 조합 중에 발생하는 엔터(Enter) 입력을 무시할 수 있다.

> KeyboardEvent.isComposing<br/>
> The KeyboardEvent.isComposing read-only property returns a boolean value indicating if the event is fired within a composition session, i.e. after compositionstart and before compositionend.

`isComposing` 속성은 컴포지션 세션이 시작되면 `true`, 종료되면 `false`가 된다. 컴포지션 세션의 상태를 확인해 키보드 이벤트를 제어하면 한글 입력 문제를 방지할 수 있다. 다음과 같이 입력 로직을 구현하면 이 현상이 재현되지 않는다.

- 리액트의 `KeyboardEvent` 객체 내부에 있는 `nativeEvent.isComposing` 속성을 사용한다. 바닐라 자바스크립트가 아니므로 리액트 이벤트 객체에는 `isComposing` 속성이 직접 존재하지 않는다.
- `isComposing` 상태가 `true`이면 키보드 이벤트 처리를 중단한다.

```tsx
import React, { ChangeEvent, KeyboardEvent, useState } from "react";
import "./App.css";

function App() {
  const [todo, setTodo] = useState<string>("");
  const [todoList, addTodoList] = useState<string[]>([]);

  const onChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
    setTodo(event.target.value);
  };

  const onKeyboardEvent = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) {
      return;
    }
    if (event.key === "Enter") {
      addTodoList((prevState) => {
        return [...prevState, todo];
      });
      setTodo("");
    }
  };

  return (
    <div className="App">
      <input
        type="text"
        value={todo}
        onChange={onChangeHandler}
        onKeyDown={onKeyboardEvent}
      />
      <div>
        {todoList.map((todo, index) => (
          <div key={index} className="todo">
            {todo}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
```

실행 결과를 보면 정상적으로 한글이 입력된다.

<div align="center">
  <img src="{{ site.image_url_2022 }}/korean-keyboard-event-error-02.gif" width="100%" class="image__border">
</div>

## CLOSING

`onKeyDown` 이벤트를 `onKeyPress` 이벤트로 변경하면 문제가 해결되지만, 다음과 같은 한계가 있다.

- 리액트에서 `onKeyPress` 이벤트는 더 이상 권장되지 않는다(deprecated).
- `onKeyPress` 이벤트는 한/영, Shift, Backspace 등의 키를 인식하지 못한다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-12-26-korean-keyboard-event-error>

#### REFERENCE

- <https://en.wikipedia.org/wiki/Input_method>
- <https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent>
- <https://www.w3.org/TR/uievents/#keys-IME>
- <https://stackoverflow.com/questions/51226598/what-is-javascripts-compositionevent-please-give-examples>
- <https://ntalbs.github.io/2015/editor-ime/>
- [[JS] keydown/keyup에서 한글 입력 시 함수가 두 번 실행되는 경우][error-handling-1st-blog-link]
- [React, 한글 입력시 keydown 이벤트 중복 발생 현상][error-handling-2nd-blog-link]

[error-handling-1st-blog-link]: https://velog.io/@corinthionia/JS-keydown%EC%97%90%EC%84%9C-%ED%95%9C%EA%B8%80-%EC%9E%85%EB%A0%A5-%EC%8B%9C-%EB%A7%88%EC%A7%80%EB%A7%89-%EC%9D%8C%EC%A0%88%EC%9D%B4-%EC%A4%91%EB%B3%B5-%EC%9E%85%EB%A0%A5%EB%90%98%EB%8A%94-%EA%B2%BD%EC%9A%B0-%ED%95%A8%EC%88%98%EA%B0%80-%EB%91%90-%EB%B2%88-%EC%8B%A4%ED%96%89%EB%90%98%EB%8A%94-%EA%B2%BD%EC%9A%B0
[error-handling-2nd-blog-link]: https://velog.io/@dosomething/React-%ED%95%9C%EA%B8%80-%EC%9E%85%EB%A0%A5%EC%8B%9C-keydown-%EC%9D%B4%EB%B2%A4%ED%8A%B8-%EC%A4%91%EB%B3%B5-%EB%B0%9C%EC%83%9D-%ED%98%84%EC%83%81

[vue-js-korean-length-link]: https://junhyunny.github.io/vue.js/vue-js-korean-length/
