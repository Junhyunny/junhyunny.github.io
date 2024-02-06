---
title: "High Order Component Pattern"
search: false
category:
  - react
  - design-pattern
last_modified_at: 2023-12-30T23:55:00
---

<br/>

## 0. 들어가면서

애플리케이션 개발은 반복되는 코드와의 싸움이다. 반복되는 패턴이 보이면 리팩토링을 통해 불필요한 코드를 줄이는 것이 가장 빠르게 가는 길이다. 실용주의 프로그래머라는 책에선 이를 DRY(Don't Repeat Yourself) 원칙이라는 이름으로 소개한다. 리액트(react)에는 코드 반복을 줄일 수 있는 고차 컴포넌트(High Order Component, HOC)라는 패턴이 존재한다. 이 글은 고차 컴포넌트 패턴을 통해 반복 코드를 리팩토링한 내용에 대해 정리했다. 

## 1. Problem

현재 텍스트 박스(text box)를 통해 사용자에게 다양한 정보를 입력 받고 있다. 입력 받는 데이터 중 형식(format)을 확인해야하는 경우가 있다. 잘못된 포맷으로 입력된 데이터는 시스템이 동작하는 중간에 런타임 예외(runtime exception)을 발생시킬 확률이 높기 때문이다. 현재 다음과 같은 데이터에 대한 포맷을 확인하고 있다.

- IP 주소
- 이메일
- 전화번호
- 날짜

이에 따라 다양한 컴포넌트가 만들어졌다. 

- IpInput
- EmailInput
- PhoneContactInput
- DateInput

위 4개의 컴포넌트 모습은 일부분만 제외하고 완전히 똑같다. IpInput 컴포넌트와 DateInput 컴포넌트를 비교해보자. 코드가 다른 부분은 다음과 같다.

- 사용자가 텍스트 박스에서 포커스 아웃(focus out)하면 각자 포맷이 맞는지 검사를 수행한다.
- 각자 다른 에러 메시지를 사용자에게 피드백한다.

<p align="center">
  <img src="/images/with-validation-by-hoc-01.png" width="100%" class="image__border">
</p>

## 2. High Order Component Pattern

애플리케이션이 커짐에 따라 다른 정보를 추가로 입력 받게 되면 비슷한 컴포넌트들이 늘어나게 된다. 위 상황처럼 input 태그만 사용한다면 유효성 확인을 위한 콜백 함수와 에러 메시지를 프롭스(props)로 받는 컴포넌트를 만드는 것만으로 문제를 해결할 수 있다. 하지만, textarea 태그, date, time, checkbox 타입을 가진 input 태그, 외부 라이브러리 컴포넌트를 사용한다면 이에 대한 포맷 유효성 검사 코드 중복을 어떻게 줄일 수 있을까? 

고차 컴포넌트 패턴을 사용하면 이 문제를 어느 정도 해결할 수 있다. 리액트 공식 홈페이지에선 다음과 같이 설명하고 있다. 

> 고차 컴포넌트(HOC, Higher Order Component)는 컴포넌트 로직을 재사용하기 위한 React의 고급 기술입니다. 고차 컴포넌트(HOC)는 React API의 일부가 아니며, React의 구성적 특성에서 나오는 패턴입니다. 구체적으로, 고차 컴포넌트는 컴포넌트를 가져와 새 컴포넌트를 반환하는 함수입니다.

고차 컴포넌트 패턴은 컴포넌트를 파라미터(parameter)로 받아 새로운 컴포넌트를 반환하는 함수라는 내용이 핵심이다. 또 하나 중요한 컨셉은 횡단 관심사(cross-cutting concenrs)다. 서로 다른 비즈니스 로직들을 처리할 때 매번 반복되는 전, 후처리 작업을 횡단 관심사라고 한다. 횡단 관심사를 별도 모듈로 분리하여 비즈니스 로직이 수행되기 전, 후에 호출되도록 구성한다. 예를 들어 스프링 프레임워크는 애너테이션만 추가하면 프레임워크에 의해 횡단 관심사 모듈이 호출되지만, 리액트는 손수 횡단 관심사를 처리하기 위한 함수를 만들어야 한다. 

- 예를 들어 로깅, 인증, 인가, 트랜잭션 처리 등은 대부분의 비즈니스 로직에서 필요한 횡단 관심사다.
- 공통적인 횡단 관심사 코드 비즈니스 로직마다 작성하지 않는다. 별도 모듈로 구성하고, 비즈니스 로직이 수행될 때 자동으로 호출되도록 구현한다.

<p align="center">
  <img src="/images/with-validation-by-hoc-02.png" width="100%" class="image__border">
</p>

### 2.1. Implement High Order Component

위 문제 상황에서 횡단 관심사는 `데이터 포멧에 대한 유효성 확인`과 `에러 메시지 출력`이다. 고차 컴포넌트 패턴 정의에 따라 컴포넌트를 파라미터로 받아 새로운 컴포넌트를 반환하는 함수를 정의한다. 예전에는 클래스 타입 컴포넌트를 사용했지만, 현재는 함수형 컴포넌트를 사용하기 때문에 이를 기준으로 설명한다. 

- WrappedComponent 파라미터는 JSX.Element 타입을 반환하는 함수형 컴포넌트다.
- 새로운 함수형 컴포넌트를 반환한다.
  - 포커스 아웃했을 때 유효성 검사하는 함수와 에러 여부 값을 기존 프롭스에 추가해 WrappedComponent 컴포넌트에게 전달한다.
  - 프롭스로 전달 받은 에러 메시지를 WrappedComponent 컴포넌트 하단에 표시한다.

```tsx
import { JSX, useCallback, useState } from "react";

export type Props = {
  value: any;
  onValueChange: (value: any) => void;
  isValidate: (value: any) => boolean;
  errorMessage: string;
  ariaLabel?: string;
  placeholder?: string;
};

export const withValidation =
  (WrappedComponent: (props: any) => JSX.Element) => (props: Props) => {
    const [isError, setError] = useState<boolean>(false);

    const focusoutHandler = useCallback(() => {
      setError(!props.isValidate(props.value));
    }, [props]);

    const newProps = {
      ...props,
      isError,
      focusoutHandler,
    };

    return (
      <div className="validate-component">
        <WrappedComponent {...newProps} />
        {isError && <div className="error">{props.errorMessage}</div>}
      </div>
    );
  };
```

### 2.2. TextInput Component

고차 컴포넌트 패턴 함수를 통해 새로운 컴포넌트를 만들기 위한 TextInput 컴포넌트를 정의한다. 단순하게 전달 받은 프롭스를 input 태그에 그대로 매핑한다.

```tsx
type Props = {
  value: string;
  onValueChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  isError?: boolean;
  focusoutHandler?: () => void;
};

const TextInput = ({
  ariaLabel,
  value,
  onValueChange,
  placeholder,
  isError,
  focusoutHandler,
}: Props) => (
  <input
    className={isError ? "error" : ""}
    type="text"
    aria-label={ariaLabel}
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    onBlur={focusoutHandler}
    placeholder={placeholder}
  />
);

export default TextInput;
```

### 2.3. ValidateTextInput Component

고차 컴포넌트 패턴을 적용한 컴포넌트를 만든다. TextInput 컴포넌트를 withValidation 함수의 파라미터로 전달한다. 반환된 ValidationTextInput 함수가 고차 컴포넌트 패턴이 적용된 새로운 컴포넌트다.

```tsx
import { withValidation } from "../enhancer/withValidation";
import TextInput from "./TextInput";

export const ValidationTextInput = withValidation(TextInput);
```

## 3. Solve the problem

### 3.1. Refactoring Components

기존 컴포넌트들에서 반복되는 코드를 없앤다. 큰 코드 변경이 있었지만, 기존 컴포넌트에 대한 테스트 코드가 있다면 문제될 것이 없다. 테스트 코드를 이 글에 포함시키지 않았지만, 예제 코드에 모두 포함되어 있으니 궁금하다면 글 아래 코드 저장소를 참고하길 바란다. 유효성 확인 함수와 에러 메시지만 다르기 때문에 IpInput 컴포넌트만 대표로 살펴본다.

- 유효성 확인을 위한 함수와 에러 메시지를 프롭스로 전달받는 ValidationTextInput 컴포넌트를 반환한다.

```tsx
import { isIpAddress } from "../util/validate";
import { ValidationTextInput } from "./ValidationComponents";

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
};

const IpInput = ({ ariaLabel, value, onValueChange, placeholder }: Props) => {
  return (
    <ValidationTextInput
      value={value}
      onValueChange={onValueChange}
      ariaLabel={ariaLabel}
      placeholder={placeholder}
      isValidate={isIpAddress}
      errorMessage="유효한 IP가 아닙니다."
    />
  );
};

export default IpInput;
```

### 3.2. Apply Other Component

고차 컴포넌트 패턴은 반복되는 코드를 줄여주는 것 뿐만이 아니다. 뛰어난 확장성이 또 하나의 장점이다. 위에서 말했듯 TextInput 컴포넌트에만 적용한다면 고차 컴포넌트 패턴을 굳이 적용하지 않아도 된다. 다음과 같은 TextArea 컴포넌트가 있다고 가정한다.

```tsx
type Props = {
  value: string;
  onValueChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  isError?: boolean;
  focusoutHandler?: () => void;
};

const TextArea = ({
  ariaLabel,
  value,
  onValueChange,
  placeholder,
  isError,
  focusoutHandler,
}: Props) => (
  <textarea
    className={isError ? "error" : ""}
    aria-label={ariaLabel}
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    onBlur={focusoutHandler}
    placeholder={placeholder}
  />
);

export default TextArea;
```

위 TextArea 컴포넌트를 withValidation 함수로 래핑(wrapping)한다. 앞으로 유효성 확인이 필요한 컴포넌트들을 withValidation 함수로 한번 감싸기만 하면 된다. 

```tsx
import { withValidation } from "../enhancer/withValidation";
import TextInput from "./TextInput";
import TextArea from "./TextArea";

export const ValidationTextInput = withValidation(TextInput);
export const ValidationTextArea = withValidation(TextArea);
```

withValidation 함수를 통과한 컴포넌트들은 유효성 검사와 에러 메시지 출력이 자동으로 이뤄진다. 

<p align="center">
  <img src="/images/with-validation-by-hoc-03.png" width="80%" class="image__border">
</p>

## CLOSING

고차 컴포넌트는 유효성 확인에만 적용할 수 있는 패턴이 아니다. 위에서 설명했듯 비즈니스 로직 곳곳에서 호출되는 횡단 관심사에 모두 적용할 수 있다. 프론트엔드 애플리케이션에서 필요한 로딩(loading)과 서스펜스(suspense) 처리, 인증과 인가 처리 같은 것도 모두 횡단 관심사가 될 수 있다. 자주 사용되는 횡단 관심사 코드들을 렌더링 대상 컴포넌트가 다르다는 이유로 함수나 믹스인(mixin)으로 만들어 사용하고 있다면 고차 컴포넌트 패턴 적용을 연구해봐도 좋을 것이다.

<p align="center">
  <img src="/images/with-validation-by-hoc-04.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-12-30-high-order-component-pattern>

#### REFERENCE

- <https://ko.legacy.reactjs.org/docs/higher-order-components.html>
