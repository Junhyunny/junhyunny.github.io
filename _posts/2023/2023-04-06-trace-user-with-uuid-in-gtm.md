---
title: "Trace User with UUID in Google Tag Manager"
search: false
category:
  - information
  - data-science
  - javascript
last_modified_at: 2023-04-06T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Google Analytics with Google Tag Manager][google-analytics-with-google-tag-manager-link]
* [Using Google Tag Manager][using-google-tag-manager-link]
* [Custom Event in Google Tag Manager][custom-event-in-google-tag-manager-link]
* [Override Method in JavaScript][override-method-in-javascript-link]
* [LocalStorage in Browser][local-storage-link]

## 0. 들어가면서

아래와 같은 구현 요건을 만족시키기 위해 [Override Method in JavaScript][override-method-in-javascript-link] 포스트에서 객체의 특정 메소드를 재정의하는 방법에 대해 정리하였습니다. 

* 사용자 추적을 위한 UUID 발급한다. 
* 모든 사용자 이벤트에 UUID 추가가 필요하다.
* 커스텀 이벤트는 UUID 삽입이 쉽게 가능하다.
* 엘리먼트(element) 클릭 이벤트는 구글 태그 매니저(GTA, google tag manager)에 의해 자동으로 동작되기 때문에 UUID 삽입이 어렵다.

## 1. In React Application

위에서 살펴본 패인 포인트(pain point)를 해결하기 위해 어플리케이션이 시작할 때 `dataLayer` 객체의 push 메소드를 재정의하였습니다. 
리액트 어플리케이션의 중요한 코드들만 살펴보겠습니다.

### 1.1. uuid.ts

* getUUID 메소드
    * 특정 사용자를 위한 UUID를 발급합니다.
* getUserTransactionId 메소드
    * 사용자 별로 UUID를 관리하기 위해 로컬 스토리지(local stoage)에 저장합니다.
    * 저장된 UUID가 존재한다면 재사용하고, 없다면 새로 생성 후 저장하고 이를 반환합니다.

```ts
export const getUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 3) | 8;
    return v.toString(16);
  });
};

export const getUserTransactionId = () => {
  let txId = localStorage.getItem("TX_ID");
  if (txId === null) {
    txId = getUUID();
    localStorage.setItem("TX_ID", txId);
  }
  return txId;
};
```

### 1.2. global.d.ts

* 타입스크립트(typescript)는 `dataLayer` 객체 타입을 찾지 못해 컴파일 에러가 발생합니다.
* 컴파일 에러를 해결하기 위해 전역 타입으로 지정합니다.

```ts
declare global {
  interface Window {
    dataLayer: {
      push: (data: any) => void;
    };
  }
}

export {};
```

### 1.3. gtm.ts

* GTM 인스톨이 정상적이지 않은 경우 에러를 막기 위해 디폴트 객체를 지정합니다.
* `dataLayer` 객체의 원본 push 메소드를 별도 변수로 참조합니다.
* Object.defineProperty 메소드를 사용해 push 메소드를 재정의합니다.
    * push 메소드 재정의가 정상적이지 않은 경우 원본 push 메소드를 반환합니다.
* overrideDataLayer 함수
    * 파라미터로 전달받은 push 메소드를 실행할 때 `txId`를 추가로 삽입하도록 변경합니다.
    * 변경한 push 메소드를 `dataLayer` 객체에 추가합니다.
    * 어플리케이션 실행 커스텀 이벤트(custom event)를 발행합니다.
* 커스텀 이벤트 발행은 부가적으로 넣은 것이 아닙니다.
    * 함수 재정의 이후 리액트 라이프사이클을 타기 전 최초 1회 실행해야 오버라이드한 기능이 정상적으로 동작합니다.

```ts
window.dataLayer = window.dataLayer
  ? window.dataLayer
  : {
      push: (data) => {},
    };

const originPush = window.dataLayer.push.bind(window.dataLayer);
Object.defineProperty(window.dataLayer, "push", {
  get() {
    return this.value ? this.value : originPush;
  },
  set(value) {
    this.value = value;
  },
});

export const overrideDataLayer = (txId: string) => {
  const overridePush = (push: (data: any) => void) => (value: any) => {
    push({ ...value, txId });
  };
  window.dataLayer.push = overridePush(originPush);
  window.dataLayer.push({ event: "app_start" });
};
```

### 1.4. App.tsx

* App 컴포넌트가 호출되면 `overrideDataLayer` 메소드를 통해 push 메소드를 재정의합니다.
* clickEventHandler 이벤트
    * `CLICK` 이라는 알람이 발생합니다.
* customEventHandler 이벤트
    * `CUSTOM EVENT` 이라는 알람이 발생합니다.
    * 별도로 지정한 커스텀 이벤트를 발생시킵니다.

```tsx
import React from "react";
import "./App.css";
import { getUserTransactionId } from "./uuid";
import { overrideDataLayer } from "./gtm";

function App() {
  overrideDataLayer(getUserTransactionId());

  const clickEventHandler = () => {
    alert("CLICK");
  };

  const customEventHandler = () => {
    alert("CUSTOM EVENT");
    window.dataLayer.push({
      event: "custom_event",
      customData: `custom_event_data_${Math.random()}`,
    });
  };

  return (
    <div className="App">
      <div id="normal-click" className="square" onClick={clickEventHandler}>
        Click Event
      </div>
      <button className="square" onClick={customEventHandler}>
        Send Custom Event
      </button>
    </div>
  );
}

export default App;
```

## 2. In Google Tag Manager

아래 포스트들에서 일반 이벤트나 커스텀 이벤트를 만드는 방법에 대해서 정리하였습니다. 

* [Using Google Tag Manager][using-google-tag-manager-link]
* [Custom Event in Google Tag Manager][custom-event-in-google-tag-manager-link]

이번 포스트에선 자세하게 태그(tag), 트리거(trigger), 변수(variable)을 만드는 방법에 대해서 다루지 않습니다. 
이전 글을 참조해주시길 바랍니다.

### 2.1. Create Variable 

* 사용자를 추적하기 위한 UUID를 이벤트에서 추출하기 위한 변수를 정의합니다.
* 이름은 `Transaction ID`입니다.
* 변수 유형은 `데이터 영역 변수`입니다.
* 변수 영역 내 변수 이름은 `txId`입니다.
    * 리액트 어플리케이션에서 이벤트를 발행할 때 데이터에 실어보내는 키(key)입니다.

<p align="center">
    <img src="/images/trace-user-with-uuid-in-gtm-1.JPG" width="100%" class="image__border">
</p>

### 2.2. Create Trigger for Custom Event

* 신규 커스텀 이벤트를 위한 트리거를 생성합니다.
* 트리거 이름은 `App Start`입니다.
* 트리거 유형은 `맞춤 이벤트`입니다.
* 이벤트 이름은 `app_start`입니다.
    * 리액트 어플리케이션에서 이벤트를 발행할 때 이벤트 객체에 정의하는 값(value)입니다.

<p align="center">
    <img src="/images/trace-user-with-uuid-in-gtm-2.JPG" width="100%" class="image__border">
</p>

### 2.3. Create New Tag for Custom Event 

* 신규 커스텀 이벤트를 구글 애널리틱스와 연결하기 위해 태그를 생성합니다.
* 태그 이름은 `App Start`입니다.
* 측정 ID는 구글 애널리틱스 생성 시 발급받은 `G-`로 시작하는 코드를 입력합니다.
* 이벤트 이름은 `app_start`입니다.
    * 구글 애널리틱스에서 보여지는 이벤트 이름입니다.
* 이벤트 매개변수에 사용자 ID를 추출할 수 있는 내용을 삽입합니다.
    * 매개변수 이름인 `tx_id`는 구글 애널리틱스에서 보여지는 이름입니다.
    * 매개변수 값은 변수에서 정의한 `Transaction ID`를 사용합니다.
* 위 단계에서 정의한 `App Start` 트리거를 사용합니다.

<p align="center">
    <img src="/images/trace-user-with-uuid-in-gtm-3.JPG" width="100%" class="image__border">
</p>

### 2.4. Modify Tags

* 일반 클릭 이벤트 매개변수 정보를 변경합니다.
    * 매개변수 이름인 `tx_id`는 구글 애널리틱스에서 보여지는 이름입니다.
    * 매개변수 값은 변수에서 정의한 `Transaction ID`를 사용합니다.

<p align="center">
    <img src="/images/trace-user-with-uuid-in-gtm-4.JPG" width="100%" class="image__border">
</p>

* 커스텀 클릭 이벤트 매개변수 정보를 변경합니다.
    * 매개변수 이름인 `tx_id`는 구글 애널리틱스에서 보여지는 이름입니다.
    * 매개변수 값은 변수에서 정의한 `Transaction ID`를 사용합니다.

<p align="center">
    <img src="/images/trace-user-with-uuid-in-gtm-5.JPG" width="100%" class="image__border">
</p>

## 3. In Google Analytics

* 사용자 이벤트와 추적 UUID가 함께 수집됩니다.

<p align="center">
    <img src="/images/trace-user-with-uuid-in-gtm-6.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-04-06-trace-user-with-uuid-in-gtm>

#### REFERENCE

[google-analytics-with-google-tag-manager-link]: https://junhyunny.github.io/information/data-science/google-analytics-with-google-tag-manager/
[using-google-tag-manager-link]: https://junhyunny.github.io/information/data-science/using-google-tag-manager/
[custom-event-in-google-tag-manager-link]: https://junhyunny.github.io/information/data-science/custom-event-in-google-tag-manager/
[override-method-in-javascript-link]: https://junhyunny.github.io/javascript/override-method-in-javascript/
[local-storage-link]: https://junhyunny.github.io/information/local-storage/