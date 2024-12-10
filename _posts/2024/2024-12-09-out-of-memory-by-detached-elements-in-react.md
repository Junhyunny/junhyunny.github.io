---
title: "Memory leak by detached DOM elements in React"
search: false
category:
  - javascript
  - react
last_modified_at: 2024-12-09T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Reference counting algorithm for garbage collect][reference-counting-gc-in-javascript-link]
- [Mark-and-sweep algorithm for garbage collect][mark-and-sweep-gc-in-javascript-link]

## 0. 들어가면서

사용자가 애플리케이션을 장시간 사용하면 화면이 멈춘다는 리포트를 받았다. 크롬(chrome) 개발자 도구의 메모리 탭을 사용해 메모리 누수가 발생하는 코드를 찾아 고치는 과정을 정리했다.

## 1. Problem Context

사용자가 애플리케이션에서 특정 행위를 반복하니 점점 애플리케이션이 느려진다는 리포트를 받았다. 메모리 누수를 의심했고, 어느 부분에서 메모리 누수가 발생하는지 찾기 위해 크롬 메모리 탭을 확인했다. 문제가 되는 인터랙션(interaction)을 수행하기 전 힙 메모리 스냅샷(snapshot)과 수행 후 인터랙션의 스냅샷을 비교해보면 2.6MB 바이트 정도의 차이가 난다.

인터랙션을 수행하기 전 힙 메모리는 8MB다.

<div align="center">
  <img src="/images/posts/2024/out-of-memory-by-detached-elements-in-react-01.png" width="100%" class="image__border">
</div>

<br/>

설명을 이어가기 전에 위 힙 메모리 스냅샷에 보이는 항목의 의미를 가볍게 정리하면 다음과 같다.

- Distance
  - 특정 객체가 루트(root)에서 얼마나 떨어져 있는지를 나타낸다.
  - 루트와의 거리가 짦을수록 오래 생존할 가능성이 높다.
- Shallow Size
  - 해당 객체 자체가 차지하는 메모리의 크기다.
  - 개별 객체가 얼마나 많은 메모미를 소비하는지 확인할 수 있다.
- Retained Size
  - 해당 객체가 해제될 경우 가비지 컬렉션으로 회수될 총 메모리 크기를 나타낸다. 
  - 해당 객체와 그 객체가 직접 또는 간접적으로 참조하는 모든 객체의 크기를 합산한다.

인터랙션을 수행한 후 두번쨰 스냅샷을 만든다. Comparison 옵션을 사용하면 이전 스냅샷과 어떤 차이가 있는지 쉽게 확인할 수 있다. 

<div align="center">
  <img src="/images/posts/2024/out-of-memory-by-detached-elements-in-react-02.png" width="100%" class="image__border">
</div>

<br/>

이전 스냅샷과 비교했을 때 `Detached <div>` 객체가 6355개 새로 생성되었다. 할당된 사이즈는 약 1.5MB 수준으로 엄청 크진 않았지만, 가장 의심스러웠다. 몇 차례 인터랙션을 더하면 10MB가 훌쩍 넘어가도록 가비지 컬렉터 대상이 되지 않았다. 

<div align="center">
  <img src="/images/posts/2024/out-of-memory-by-detached-elements-in-react-03.png" width="100%" class="image__border">
</div>

## 2. Analysis

메모리 누수의 원인을 살펴보기 전에 Detached DOM 개념을 알아보자. Detached DOM 객체는 리-렌더링 시 DOM 트리에서 제거된 객체를 의미한다. Detached DOM 객체에 의해 발생하는 메모리 릭(leak)은 DOM 트리에서 제거되었지만, 여전히 JavaScript 코드에서 참조 중인 DOM 객체들에 의해 발생한다. 정리하자면 JavaScript 코드에 의해 참조 중인 Detached DOM 객체들은 가비지 컬렉터에 의해 회수되지 못 하면서 메모리 누수가 발생한다.

코드 어디서 Detached DOM 누수가 발생했을까? 문제가 발생한 실제 코드를 블로그엔 올릴 수 없으니 조금 재구성했다. DOM 트리 구조는 다음과 같다.

- Sheets 컴포넌트 하단에 3개의 카테고리 컴포넌트가 존재한다. 

<div align="center">
  <img src="/images/posts/2024/out-of-memory-by-detached-elements-in-react-04.png" width="80%" class="image__border">
</div>

<br/>

메모리 누수 여부를 확인하기 위해 메모리가 큰 BigDom 컴포넌트를 Category 컴포넌트 하단에 그린다. BigDom 컴포넌트는 다음과 같다. 

- 10000개의 div DOM 객체를 그린다. 

```tsx
import { useEffect } from "react";

const BigDom = () => {
  useEffect(() => {
    const bigDom = document.querySelector(".big-dom");
    for (let index = 0; index < 10000; index++) { 
      const div = document.createElement("div");
      div.append(
        "x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x x ",
      );
      bigDom!.appendChild(div);
    }
  }, []);

  return <div className="big-dom"></div>;
};

export default BigDom;
```

문제가 발생한 Sheets 컴포넌트는 다음과 같다. 

1. Category 함수형 컴포넌트를 함수형 컴포넌트로 한번 감싼다.
2. 해당 컴포넌트들을 값으로 갖는 객체를 만든다. 
3. 탭을 통해 각 카테고리 컴포넌트를 선택할 수 있다.
4. 선택된 컴포넌트를 렌더링한다.  

```tsx
import { ReactNode, useState } from "react";
import BigDom from "./BigDom.tsx";

const Category = ({ name }: { name: string }) => {
  const [state, setState] = useState<boolean>(false);
  return (
    <div className="Category">
      <div className="NameAndState">
        {name}: {`${state}`}
      </div>
      <button
        className="ToggleButton"
        onClick={() => setState((prevState) => !prevState)}
      >
        Toggle
      </button>
      <div className="BigString">
        <BigDom />
      </div>
    </div>
  );
};

const Sheets = () => {
  const [currentTab, setCurrentTab] = useState<"A" | "B" | "C">("A");

  const { AComponent, BComponent, CComponent } = { // 1
    AComponent: () => <Category name={"AComponent"} />,
    BComponent: () => <Category name={"BComponent"} />,
    CComponent: () => <Category name={"CComponent"} />,
  };
  const mapTap: { [key in "A" | "B" | "C"]: ReactNode } = { // 2
    A: <AComponent />,
    B: <BComponent />,
    C: <CComponent />,
  };

  return (
    <div className="Sheets">
      <div className="CategoryTabs">
        {/* 3 */}
        <div onClick={() => setCurrentTab("A")}>A Tab</div>
        <div onClick={() => setCurrentTab("B")}>B Tab</div>
        <div onClick={() => setCurrentTab("C")}>C Tab</div>
      </div>
      {/* 4 */}
      <div className="Tab">{mapTap[currentTab]}</div>
    </div>
  );
};

export default Sheets;
```

코드를 보면 큰 문제가 없어 보인다. 함수형 컴포넌트 내부에 선언한 변수들은 스택 메모리에 존재하기 때문에 리-렌더링 할 때 이전 객체들에 대한 참조가 사라지고 자연스레 가비지 컬렉팅이 될 것으로 예상되지만, 실제로 Category 컴포넌트는 메모리 해제가 되지 않는다. 힙 스냅샷을 확인해보면 각 탭을 변경할 때마다 4MB씩 힙 메모리가 증가한다. 마지막 스냅샷과 첫번째 스냅샷을 비교해보면 `Detached <div>`, `Detached Text`가 약 24MB 정도 증가했다.

<div align="center">
  <img src="/images/posts/2024/out-of-memory-by-detached-elements-in-react-05.png" width="100%" class="image__border">
</div>

<br/>

메모리 탭의 `Detached Elements` 옵션으로 JavaScript 레퍼런스에 의해 참조가 살아있는 Detached DOM 객체를 확인할 수 있다. BigDom 객체에서 10000 개의 자식 DOM 객체를 만드는 경우 너무 크기 때문에 스냅샷을 만드는 데 시간이 오래 걸린다. 100개로 숫자를 줄여서 확인해보면 스냅샷을 남길 때마다 Detached DOM 객체들이 쌓이는 것을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2024/out-of-memory-by-detached-elements-in-react-06.gif" width="100%" class="image__border">
</div>

<br/>

알 수 없는 현상으로 Category 컴포넌트 내부의 `state`를 변경하지 않고 탭만 변경하는 경우 최초 탭 변경을 제외하고 Detached DOM 객체가 생성되지 않는다.

<div align="center">
  <img src="/images/posts/2024/out-of-memory-by-detached-elements-in-react-07.gif" width="100%" class="image__border">
</div>

## 3. Solve the problem

아쉽게도 문제의 원인에 대해 확실히 파악하지 못 했다. 정확한 원인은 모르지만, 힙 메모리 분석을 통해 문제 발생하는 코드의 위치와 여러 실험을 통해 Detached DOM 메모리 누수가 발생하지 않는 해결 방법은 찾아냈다. 다음과 같이 코드를 변경하면 메모리 누수가 발생하지 않는다. 

1. 함수형 컴포넌트로 Category 컴포넌트를 한번 더 감싸지 않고 직접 사용한다.

```tsx
import { ReactNode, useState } from "react";
import BigDom from "./BigDom.tsx";

const Category = ({ name }: { name: string }) => {
  const [state, setState] = useState<boolean>(false);
  return (
    <div className="Category">
      <div className="NameAndState">
        {name}: {`${state}`}
      </div>
      <button
        className="ToggleButton"
        onClick={() => setState((prevState) => !prevState)}
      >
        Toggle
      </button>
      <div className="BigString">
        <BigDom />
      </div>
    </div>
  );
};

const Sheets = () => {
  const [currentTab, setCurrentTab] = useState<"A" | "B" | "C">("A");

  // 1
  const mapTap: { [key in "A" | "B" | "C"]: ReactNode } = {
    A: <Category name={"A Component"} />,
    B: <Category name={"B Component"} />,
    C: <Category name={"C Component"} />,
  };

  return (
    <div className="Sheets">
      <div className="CategoryTabs">
        <div onClick={() => setCurrentTab("A")}>A Tab</div>
        <div onClick={() => setCurrentTab("B")}>B Tab</div>
        <div onClick={() => setCurrentTab("C")}>C Tab</div>
      </div>
      <div className="Tab">{mapTap[currentTab]}</div>
    </div>
  );
};

export default Sheets;
```

함수형 컴포넌트로 Category 컴포넌트를 한번 더 감싼 형태에서 Category 컴포넌트만 리-렌더링 하면 리액트 내부적으로 메모리 해제가 되지 않는 구조가 있는 것인지 모르겠다. 컴포넌트를 직접 사용하면 더 이상 문제는 발생하지 않는다. 힙 스냅샷을 비교해보면 용량을 크게 차지하는 `Detached <div>`, `Detached Text`가 보이지 않는다.

<div align="center">
  <img src="/images/posts/2024/out-of-memory-by-detached-elements-in-react-08.png" width="100%" class="image__border">
</div>

<br/>

메모리 탭의 `Detached Elements` 옵션으로 스냅샷을 확인해보면 Detached DOM 객체가 생성되지 않는 것을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2024/out-of-memory-by-detached-elements-in-react-09.gif" width="100%" class="image__border">
</div>

## CLOSING

문제는 해결했지만, 정확한 원인은 알 수 없다. 리액트 레포지토리의 이슈와 스택오버플로우에 해당 상태에 대한 내용을 정리해서 질문을 올릴 예정이다. 질문을 통해 정확한 원인을 알 수 있으면 좋겠다. 질문을 정리해 올리면 관련된 링크는 블로그에 업데이트 할 예정이다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-12-09-out-of-memory-by-detached-elements-in-react>

#### REFERENCE

- <https://yceffort.kr/2020/09/javascript-memory-leaks-by-window-detached>
- <https://yceffort.kr/2020/07/memory-leaks-in-javascript>
- <https://blog.eunsukim.me/posts/debugging-javascript-memory-leak-with-chrome-devtools>
- <https://github.com/facebook/react/issues/23214>
- <https://stackoverflow.com/questions/60197254/detached-dom-node-memory-leak-in-react>

[reference-counting-gc-in-javascript-link]: https://junhyunny.github.io/information/javascript/reference-counting-gc-in-javascript/
[mark-and-sweep-gc-in-javascript-link]: https://junhyunny.github.io/information/javascript/mark-and-sweep-gc-in-javascript/