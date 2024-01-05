---
title: "Custom Event in Google Tag Manager"
search: false
category:
  - information
  - data-science
last_modified_at: 2023-03-30T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Google Analytics with Google Tag Manager][google-analytics-with-google-tag-manager-link]
* [Using Google Tag Manager][using-google-tag-manager-link]

## 0. 들어가면서

구글 태그 매니저(GTM, google tag manager)는 어플리케이션에서 발생하는 사용자의 움직임을 태그로 정의하여 감지할 수 있습니다. 
기본으로 제공하는 기능을 사용할 수도 있지만, 서비스 요건에 맞춘 이벤트를 정의할 수 있습니다. 
이번 포스트는 구글 태그 매니저에서 사용자 정의 변수(variable)와 맞춤 이벤트(custom event)를 만들고 적용하는 방법에 대해 정리하였습니다. 

## 1. Create Custom Variable

* 사용자 정의 변수를 생성합니다.
* 새로 만들기 버튼을 클릭합니다.

<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-1.JPG" width="100%" class="image__border">
</p>

* 변수 유형은 `데이터 영역 변수`를 사용합니다.
* 데이터 영역 변수 이름은 `customData`입니다.
    * 어플리케이션에서 `customData`라는 키(key)에 데이터를 매칭하여 전달합니다.
* 데이터 영역 버전은 `버전 2`를 선택합니다. 
* 저장 버튼을 클릭합니다.

<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-2.JPG" width="100%" class="image__border">
</p>

* 사용자 정의 변수에 `Custom Data`라는 변수가 생성됩니다.

<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-3.JPG" width="100%" class="image__border">
</p>

## 2. Create Custom Event Trigger

* 사용자 정의 트리거를 생성합니다.
* 새로 만들기 버튼을 클릭합니다.

<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-4.JPG" width="100%" class="image__border">
</p>

* 트리거 구성에서 `맞춤 이벤트`를 선택합니다.

<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-5.JPG" width="100%" class="image__border">
</p>

* 이벤트 이름을 `custom_event`으로 지정합니다.
    * 어플리케이션에서 `custom_event`으로 이벤트를 발행하는 코드가 필요합니다.

<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-6.JPG" width="100%" class="image__border">
</p>

* `Custom Event` 트리거가 생성됩니다.

<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-7.JPG" width="100%" class="image__border">
</p>

## 3. Create Tag

* 신규 태그를 생성합니다.
* 새로 만들기 버튼을 클릭합니다.

<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-8.JPG" width="100%" class="image__border">
</p>

* 태그 구성을 클릭합니다.
* GA4 이벤트를 선택합니다.

<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-9.JPG" width="100%" class="image__border">
</p>

* 측정 ID는 구글 애널리틱스 생성 시 발급받은 `G-`로 시작하는 코드를 입력합니다.
* 이벤트 이름을 `custom_click`으로 지정합니다.
    * 지정한 이벤트 이름으로 구글 애널리틱스에서 확인 가능합니다.
* 이벤트 매개변수를 추가합니다.
* 키(key)는 `custom_data`로 정의합니다.
    * 지정한 이름으로 구글 애널리틱스에서 확인 가능합니다.
* 깂(value)는 변수에서 선택하기 위해 오른쪽 버튼을 클릭합니다.

<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-10.JPG" width="100%" class="image__border">
</p>

* 이전 단계에서 생성한 `Custom Data` 변수를 선택합니다.

<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-11.JPG" width="100%" class="image__border">
</p>

* 트리거를 선택합니다.

<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-12.JPG" width="100%" class="image__border">
</p>

* 이전 단계에서 생성한 `Custom Event` 트리거를 선택합니다.

<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-13.JPG" width="100%" class="image__border">
</p>

* 최종적인 태그 모습입니다.
* 저장을 클릭합니다.

<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-14.JPG" width="100%" class="image__border">
</p>

## 4. Publish Tag

* 제출 버튼을 클릭합니다.

<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-15.JPG" width="100%" class="image__border">
</p>

* 게시 버튼을 클릭하여 변경사항을 반영합니다.

<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-16.JPG" width="100%" class="image__border">
</p>

## 5. React Application

리액트 어플리케이션 코드를 살펴보겠습니다. 
커스텀 이벤트는 일반 이벤트와 다르게 개발자와 협업이 더 많이 필요합니다. 
특정 이벤트에 대한 비즈니스적인 정의가 이뤄지면 이를 적절한 위치에서 호출해야합니다. 
커스텀 이벤트를 어플리케이션에서 호출하는 방법에 대해 알아보겠습니다. 
구글 태그 매니저를 설치하는 과정은 [Google Analytics with Google Tag Manager][google-analytics-with-google-tag-manager-link] 포스트를 참고하시길 바랍니다. 

### 5.1. global.d.ts

* 타입스크립트(typescript)를 사용하는 경우엔 전역 변수로 지정이 필요합니다.
* 전역에서 `dataLayer` 객체를 사용할 수 있도록 `global.d.ts` 파일에 타입을 정의합니다. 

```ts
declare global {
    interface Window {
        dataLayer: {
            push: (data: any) => void
        }
    }
}

export {}
```

### 5.2. App.tsx

* 특정 클릭 이벤트가 발생했을 때 `dataLayer` 객체를 사용해 이벤트를 발행합니다.
    * 이벤트 종류는 `custom_event`로 지정합니다.
    * 변수로 지정되어 추적하는 `customData` 키에 랜덤한 값을 매칭하여 전달합니다.

```tsx
import React from 'react';
import './App.css';

function App() {
    const eventHandler = () => {
        alert('CLICK!')
        window.dataLayer.push({event: 'custom_event', customData: `custom_event_data_${Math.random()}`})
    }

    return (
        <div className="App">
            <button className="square" onClick={eventHandler}>
                Send Custom Event
            </button>
        </div>
    );
}

export default App;
```

## 5. In Google Analytics

해당 리액트 어플리케이션을 서버에 배포한 후 구글 애널리틱스에서 발생하는 이벤트들을 살펴보겠습니다.

* 버튼을 클릭함에 따라 `custom_event`가 감지되는 것을 확인할 수 있습니다.
* `custom_event` 이벤트에서 `custom_data`가 수집됨을 확인할 수 있습니다. 
 
<p align="center">
    <img src="/images/custom-event-in-google-tag-manager-17.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-03-30-custom-event-in-google-tag-manager>

[google-analytics-with-google-tag-manager-link]: https://junhyunny.github.io/information/data-science/google-analytics-with-google-tag-manager/
[using-google-tag-manager-link]: https://junhyunny.github.io/information/data-science/using-google-tag-manager/