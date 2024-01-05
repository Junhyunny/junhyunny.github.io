---
title: "Korean KeyboardEvent Error in React"
search: false
category:
  - react
  - typescript
last_modified_at: 2022-12-26T23:55:00
---

<br/>

## 0. 들어가면서

리액트(react) 프로젝트에서 한글을 입력할 때 마지막 문자가 중복으로 입력되는 현상을 발견하였습니다. 
한글 입력 시 발생하는 문제점과 원인, 해결 방법에 대해 정리하였습니다. 

## 1. 문제 현상

### 1.1. 문제 코드

아래 코드를 크롬 브라우저에서 실행하면 한글을 입력할 때 문제가 발생합니다.

* 텍스트 박스(text box)에 한글을 입력하고 엔터(enter)를 누릅니다.
* 입력된 값을 저장하고 텍스트 박스의 값은 초기화합니다.
* 입력된 값의 마지막 문자가 추가로 저장됩니다.

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

##### 실행 결과

<p align="center">
    <img src="/images/korean-keyboard-event-error-1.gif" width="100%" class="image__border">
</p>

## 2. IME(Input Method Editor)

[Error on v-model with Korean in Vue][vue-js-korean-length-link] 포스트에서 다뤘던 개념입니다. 
이 문제는 IME(Input Method Editor) 과정에서 `KeyDown` 이벤트가 발생할 때 운영체제와 브라우저가 해당 이벤트를 중복 처리하기 때문에 발생합니다. 
위키피디아(wikipedia)에선 IME를 다음과 같이 정의합니다.

> IME(Input Method Editor)<br/>
> An input method (or input method editor, commonly abbreviated IME) is an operating system component or program that enables users to generate characters not natively available on their input devices by using sequences of characters (or mouse operations) that are natively available on their input devices. Using an input method is usually necessary for languages that have more graphemes than there are keys on the keyboard.

`IME`는 한글 같은 조합이 필요한 문자의 입력을 지원하기 위한 운영체제(operating system)의 컴포넌트(component) 혹은 프로그램입니다. 
이 기능을 통해 사용자는 입력 기기를 사용해 직접 입력할 수 없는 문자들을 조합하여 작성할 수 있습니다. 
예를 들면 사용자는 라틴(latin) 계열 키보드로 중국어, 일본어, 한국어 등을 입력할 수 있습니다. 
한글처럼 IME 기능이 필요한 언어를 브라우저에서 입력할 땐 정상적인 처리가 안 될 수 있습니다. 
문제 양상은 운영체제, 브라우저 종류마다 다를 수 있습니다. 

## 3. 문제 해결

### 3.1. CompositionEvent

해결 방법은 `Web API`에서 제공하는 `CompositionEvent`와 관련 있습니다. 
`CompositionEvent`는 키보드에서 사용할 수 없는 문자를 입력 받기 위한 보조적인 방법을 제공합니다. 

* US 키보드엔 존재하지 않지만, 문자에 강조(accent)를 줄 때 사용
* 아시아 언어의 기본 컴포넌트인 로고그램(logogram)들을 빌드-업(build-up)할 때 사용

문자를 합성하는 컴포지션 세션(composition session)은 `compositionstart`, `compositionupdate`, `compositionend` 이벤트로 구성됩니다. 
`compositionupdate` 이벤트는 여러 번 발생할 수 있습니다. 
각 세션 동안 이벤트 체인 각 단계 사이의 값들은 지속되며 `data` 속성에 유지됩니다. 
브라우저는 컴포지션 세션을 통해 IME 기능을 제공합니다.

### 3.2. isComposing Property

키보드 이벤트를 살펴보면 `isComposing`라는 속성이 존재합니다. 

> KeyboardEvent.isComposing<br/>
> The KeyboardEvent.isComposing read-only property returns a boolean value indicating if the event is fired within a composition session, i.e. after compositionstart and before compositionend. 

`isComposing` 속성은 컴포지션 세션이 시작될 때 `true`, 세션이 종료될 때 `false` 상태가 됩니다. 
컴포지션 세션의 상태를 확인해 키보드 이벤트를 제어하면 한글 입력 문제를 방지할 수 있습니다. 

### 3.3. 문제 해결 코드

* 리액트 라이브러리 `KeyboardEvent` 이벤트 내부 `nativeEvent` 객체의 `isComposing` 속성을 사용합니다.
    * 바닐라 자바스크립트가 아니기 때문에 이벤트 객체 내부엔 `isComposing` 속성이 존재하지 않습니다. 
* `isComposing` 상태가 `true`인 경우에 키보드 이벤트를 막습니다.

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

##### 실행 결과

<p align="center">
    <img src="/images/korean-keyboard-event-error-2.gif" width="100%" class="image__border">
</p>

## CLOSING

`onKeyDown` 이벤트를 `onKeyPress` 이벤트로 변경하면 해당 문제가 해결되지만, 다음과 같은 문제점들이 존재합니다.

* 리액트에서 `onKeyPress` 이벤트는 더 이상 지원하지 않습니다.(deplicated)
* `onKeyPress` 이벤트는 한/영, Shift, Backsapce 등의 키를 인식하지 못 합니다.

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-12-26-korean-keyboard-event-error>

#### REFERENCE

* <https://en.wikipedia.org/wiki/Input_method>
* <https://developer.mozilla.org/en-US/docs/Web/API/CompositionEvent>
* <https://www.w3.org/TR/uievents/#keys-IME>
* <https://stackoverflow.com/questions/51226598/what-is-javascripts-compositionevent-please-give-examples>
* <https://ntalbs.github.io/2015/editor-ime/>
* [[JS] keydown/keyup에서 한글 입력 시 함수가 두 번 실행되는 경우][error-handling-1st-blog-link]
* [React, 한글 입력시 keydown 이벤트 중복 발생 현상][error-handling-2nd-blog-link]

[error-handling-1st-blog-link]: https://velog.io/@corinthionia/JS-keydown%EC%97%90%EC%84%9C-%ED%95%9C%EA%B8%80-%EC%9E%85%EB%A0%A5-%EC%8B%9C-%EB%A7%88%EC%A7%80%EB%A7%89-%EC%9D%8C%EC%A0%88%EC%9D%B4-%EC%A4%91%EB%B3%B5-%EC%9E%85%EB%A0%A5%EB%90%98%EB%8A%94-%EA%B2%BD%EC%9A%B0-%ED%95%A8%EC%88%98%EA%B0%80-%EB%91%90-%EB%B2%88-%EC%8B%A4%ED%96%89%EB%90%98%EB%8A%94-%EA%B2%BD%EC%9A%B0
[error-handling-2nd-blog-link]: https://velog.io/@dosomething/React-%ED%95%9C%EA%B8%80-%EC%9E%85%EB%A0%A5%EC%8B%9C-keydown-%EC%9D%B4%EB%B2%A4%ED%8A%B8-%EC%A4%91%EB%B3%B5-%EB%B0%9C%EC%83%9D-%ED%98%84%EC%83%81

[vue-js-korean-length-link]: https://junhyunny.github.io/vue.js/vue-js-korean-length/