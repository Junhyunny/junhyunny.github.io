---
title: "Querying within Specific Element in Testing Library"
search: false
category:
  - javascript
  - jest
  - testing-library
  - test-driven-development
last_modified_at: 2022-10-31T23:55:00
---

<br/>

## 1. 문제 현상

프론트엔드 테스트 코드를 작성하다보면 이런 경우를 마주치게 됩니다. 

* 화면에 33이라는 동일한 데이터가 존재해서 문제가 발생합니다.
* 동일한 데이터가 있으니 `*AllBy*`가 붙은 쿼리를 사용하라는 안내 문구를 볼 수 있습니다.

```
Found multiple elements with the text: 33

Here are the matching elements:

Ignored nodes: comments, script, style
<td>
  33
</td>

Ignored nodes: comments, script, style
<td>
  33
</td>

(If this is intentional, then use the `*AllBy*` variant of the query (like `queryAllByText`, `getAllByText`, or `findAllByText`)).

...

```

### 1.1. 테스트 코드

해당 문제가 발생하는 테스트 코드를 살펴보겠습니다.

* 스텁(stub)이 반환하는 데이터를 보면 중복되는 데이터를 볼 수 있습니다.
    * 나이, 성별
* 해당 데이터가 화면에 있는지 여부를 검증(assert)하는 과정에서 에러가 발생합니다.
* 동일한 데이터가 여러 개인 경우 원하는 데이터가 화면에 존재하는지 확인하는 검증에 대한 유효성이 부족합니다.

```tsx
import React from 'react';
import {render, screen} from '@testing-library/react';
import App from './App';

import * as UserRepository from './repository/UserRepository'

describe('App Tests', () => {

    test('사용자 테이블에서 사용자 정보를 볼 수 있다.', async () => {

        jest.spyOn(UserRepository, 'getUsers').mockResolvedValue([
            {name: "Junhyunny", age: 33, sex: "Male", phoneNumber: "010-1234-1234"},
            {name: "Ingang", age: 33, sex: "Female", phoneNumber: "010-1234-4321"},
            {name: "Jua", age: 12, sex: "Female", phoneNumber: "010-1234-1234"}
        ])

        render(<App/>);

        expect(await screen.findByText("Junhyunny")).toBeInTheDocument()
        expect(screen.getByText("33")).toBeInTheDocument()
        expect(screen.getByText("Male")).toBeInTheDocument()
        expect(screen.getByText("010-1234-1234")).toBeInTheDocument()

        expect(screen.getByText("Ingang")).toBeInTheDocument()
        expect(screen.getByText("33")).toBeInTheDocument()
        expect(screen.getByText("Female")).toBeInTheDocument()
        expect(screen.getByText("010-1234-1234")).toBeInTheDocument()

        expect(screen.getByText("Jua")).toBeInTheDocument()
        expect(screen.getByText("12")).toBeInTheDocument()
        expect(screen.getByText("Female")).toBeInTheDocument()
        expect(screen.getByText("010-1234-0987")).toBeInTheDocument()
    });
})
```

### 1.2. App.tsx 

실제 구현 코드를 살펴보겠습니다. 

* 테이블 구조로 되어 있습니다.
* 한 행(row) 안에서 나이, 성별 같은 데이터는 유일하게 존재합니다.

```tsx
import React, {useEffect, useState} from 'react';
import {getUsers, User} from "./repository/UserRepository";

import './App.css'

function App() {

    const [users, setUsers] = useState<User[]>([])

    useEffect(() => {
        getUsers().then((userList) => {
            setUsers(userList)
        })
    }, [])

    return (
        <div>
            <h3>사용자 테이블</h3>
            <table>
                <thead>
                <tr>
                    <th>이름</th>
                    <th>나이</th>
                    <th>성별</th>
                    <th>휴대폰번호</th>
                </tr>
                </thead>
                <tbody>
                {
                    users.map(user => (
                        <tr key={user.name}>
                            <td>{user.name}</td>
                            <td>{user.age}</td>
                            <td>{user.sex}</td>
                            <td>{user.phoneNumber}</td>
                        </tr>
                    ))
                }
                </tbody>
            </table>
        </div>
    );
}

export default App;
```

## 2. within 함수 

`Testing Library`의 `within` 함수는 이런 문제를 해결하는데 도움을 줄 수 있습니다. 
`getQueriesForElement` 함수의 다른 이름입니다. 
특정 DOM 엘리먼트(element)를 컨텍스트로 삼고, 엘리먼트 내부 트리에 대해서만 쿼리(query)를 수행할 수 있습니다. 

간단하게 테이블 이미지를 통해 알아보겠습니다. 

* 33, Female 이라는 정보는 `App` 컴포넌트 전체를 기준으로 삼으면 여러 개 존재합니다.
    * `screen` 객체를 통해 쿼리를 수행하는 것은 `App` 컴포넌트를 전체를 기준으로 탐색하는 것과 동일합니다.
* 테이블 내 하나의 행을 기준으로 삼으면 유일한 데이터입니다.
    * `within` 함수를 이용해 테이블 행에 해당하는 DOM 엘리먼트를 획득합니다.
    * `screen`이 아닌 테이블 행 DOM 엘리먼트를 기준으로 텍스트를 탐색합니다.

<p align="left">
    <img src="/images/querying-within-specific-element-1.JPG" width="50%" class="image__border">
</p>

### 2.2. 수정된 테스트 코드

다음과 같이 테스트 코드를 수정할 수 있습니다.

* `ESLint`에 감지되어 `parentElement`에 직접 접근하지 않고, 디스트럭쳐링(destructuring)하였습니다.
    * `screen.getByText("Junhyunny").parentElement` 처럼 직접 접근도 가능합니다.
* 각 행에 사용자 이름을 기준으로 부모 엘리먼트를 구합니다.
* `within` 함수를 이용해 부모 엘리먼트를 기준으로 쿼리를 수행할 수 있는 객체를 만듭니다.
* 테이블 각 행을 기준으로 쿼리를 수행합니다.

```tsx
import React from 'react';
import {render, screen, within} from '@testing-library/react';
import App from './App';

import * as UserRepository from './repository/UserRepository'

describe('App Tests', () => {

    test('사용자 테이블에서 사용자 정보를 볼 수 있다.', async () => {

        jest.spyOn(UserRepository, 'getUsers').mockResolvedValue([
            {name: "Junhyunny", age: 33, sex: "Male", phoneNumber: "010-1234-1234"},
            {name: "Ingang", age: 33, sex: "Female", phoneNumber: "010-1234-4321"},
            {name: "Jua", age: 12, sex: "Female", phoneNumber: "010-1234-1234"}
        ])

        render(<App/>);

        expect(await screen.findByText("Junhyunny")).toBeInTheDocument()
        const {parentElement: firstRowElement} = screen.getByText("Junhyunny");
        const firstRow = within(firstRowElement!)
        expect(firstRow.getByText("33")).toBeInTheDocument()
        expect(firstRow.getByText("Male")).toBeInTheDocument()
        expect(firstRow.getByText("010-1234-1234")).toBeInTheDocument()

        expect(screen.getByText("Ingang")).toBeInTheDocument()
        const {parentElement: secondRowElement} = screen.getByText("Ingang");
        const secondRow = within(secondRowElement!)
        expect(secondRow.getByText("33")).toBeInTheDocument()
        expect(secondRow.getByText("Female")).toBeInTheDocument()
        expect(secondRow.getByText("010-1234-4321")).toBeInTheDocument()

        expect(screen.getByText("Jua")).toBeInTheDocument()
        const {parentElement: thirdRowElement} = screen.getByText("Jua");
        const thirdRow = within(thirdRowElement!)
        expect(thirdRow.getByText("12")).toBeInTheDocument()
        expect(thirdRow.getByText("Female")).toBeInTheDocument()
        expect(thirdRow.getByText("010-1234-1234")).toBeInTheDocument()
    });
})
```

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-10-31-querying-within-specific-element>

#### REFERENCE

* <https://testing-library.com/docs/dom-testing-library/api-within>
* <https://stackoverflow.com/questions/64669436/how-to-make-queries-in-jest-test-within-context-of-particular-element>