---
title: "Google Tag Manager 활용하기"
search: false
category:
  - information
  - data-science
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Google Analytics with Google Tag Manager][google-analytics-with-google-tag-manager-link]

## 0. 들어가면서

[Google Analytics with Google Tag Manager][google-analytics-with-google-tag-manager-link] 포스트에선 애널리틱스와 태그 매니저를 연결하는 방법에 대해 정리하였다. 이번 포스트에선 태그 매니저를 탐구한 내용에 대해 정리하였다.

## 1. Google Tag Manager

구글 태그 매니저(GTM, google tag manager)는 구글 애널리틱스(GA, google analytics) 같은 데이터 수집 도구에서 사용자 행동이나 패턴을 구체적으로 분석할 수 있도록 맞춤형 이벤트를 정의하는 도구이다. 태그 매니저를 사용하면 간편하게 맞춤형 사용자 이벤트를 만들 수 있다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-01.png" width="100%" class="image__border">
</div>
<center>https://www.joptimisemonsite.fr/google-tag-manager/</center>

### 1.1. Components of Google Tag Manager

태그 매니저는 태그(tag), 트리거(trigger), 변수(variable)들로 구성되어 있다. 해당 요소들의 기능을 이해하고 있어야 태그 매니저를 잘 활용할 수 있다.

- 태그
  - 화면 이벤트로 발생한 데이터를 추적하여 구글 애널리틱스 같은 도구로 전송하기 위한 연결 고리 역할을 수행한다.
  - 화면 이벤트가 발생할 때 조건이 충족된 트리거에 의해 실행된다.
  - 1개 이상의 트리거를 참조해야 한다.
  - 변수에 정의된 값을 추출하여 전달할 수 있다.
  - 태그는 트리거에 의해 실행되고, 변수를 통해 수집하고 싶은 데이터를 지정할 수 있다.
- 트리거
  - 버튼 클릭, 페이지 뷰 같은 사용자 이벤트들을 설정한다.
  - 트리거를 설정할 때 지정한 조건이 있다면 이를 만족시키는 경우에만 동작한다.
  - 조건이 충족되면 해당 트리거를 참조하는 태그를 실행시킨다.
- 변수
  - 변하는 값을 추적할 때 사용한다.
  - 기본으로 제공되는 변수들이 존재한다.
  - 기본 변수 이외에도 사용자 정의 변수를 생성해 사용할 수 있다.
- 태그는 트리거와 변수를 사용하고, 트리거는 변수를 사용한다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-02.png" width="50%" class="image__border">
</div>
<center>https://finedata.tistory.com/44</center>

## 2. Practice

간단한 실습을 통해 어떤 엘리먼트(element)를 클릭했는지 태그를 만들어 확인해보겠다. 다음과 같은 환경에서 실습하였다.

- AWS EC2 컨테이너
- 리액트 애플리케이션
  - GTM 설치 과정은 이번 포스트에서 생략한다.
  - GTM 설치 과정이나 애널리틱스, 태그 매니저 연결 방법은 [Google Analytics with Google Tag Manager][google-analytics-with-google-tag-manager-link] 포스트를 참고하길 바란다.

### 2.1. Simple Code by React

우선 리액트 애플리케이션 코드를 살펴보겠다.

- 엘리먼트 3개를 화면에 만든다.
  - 각 엘리먼트들은 고유한 `id`를 가지고 있다.
  - `element_div`, `element_link`, `element_button`
- 엘리먼트를 클릭할 때마다 알람 창이 화면에 열린다.

```jsx
import React from 'react';
import './App.css';

function App() {
    const eventHandler = (event: React.MouseEvent) => {
        event.preventDefault()
        alert(`click ${event.target}`)
    }

    return (
        <div className="App">
            <div id="element_div" className="square" onClick={eventHandler}>
                Div Element
            </div>
            <a id="element_link" href="https://google.com" className="square" onClick={eventHandler}>
                Google Link
            </a>
            <button id="element_button" className="square" onClick={eventHandler}>
                Button Element
            </button>
        </div>
    );
}

export default App;
```

### 2.2. Use Variable

- 사용할 변수를 추가한다.
- 기본 제공 변수의 구성 버튼을 클릭한다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-03.png" width="100%" class="image__border">
</div>

<br/>

- 클릭과 관련된 체크 박스들을 선택한다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-04.png" width="100%" class="image__border">
</div>

<br/>

- `Click ID` 변수를 누르면 다음과 같은 정보를 볼 수 있다.
- 데이터 영역 변수 이름이 `gtm.elementId`임을 확인한다.
  - `미리보기` 기능에서 해당되는 데이터를 찾을 수 있다.
  - `dataLayer` 객체가 수집하는 데이터를 보면 `gtm.elementId` 변수를 찾을 수 있다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-05.png" width="100%" class="image__border">
</div>

### 2.3. Create Trigger

- [Google Analytics with Google Tag Manager][google-analytics-with-google-tag-manager-link] 포스트에서 만든 트리거를 그대로 사용한다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-06.png" width="100%" class="image__border">
</div>

<br/>

- 모든 클릭을 감지한다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-07.png" width="100%" class="image__border">
</div>

### 2.4. Create Tag

- [Google Analytics with Google Tag Manager][google-analytics-with-google-tag-manager-link] 포스트에서 만든 태그를 일부 변경한다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-08.png" width="100%" class="image__border">
</div>

<br/>

- 이벤트 매개변수를 추가한다.
- 키(key)는 `element_id`으로 정의한다.
  - 지정한 이름으로 구글 애널리틱스에서 확인 가능하다.
- 값(value)은 변수에서 선택하기 위해 오른쪽 버튼을 클릭한다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-09.png" width="100%" class="image__border">
</div>

<br/>

- `Click ID` 변수를 선택한다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-10.png" width="100%" class="image__border">
</div>

<br/>

- 다음과 같은 모습을 볼 수 있다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-11.png" width="100%" class="image__border">
</div>

### 2.5. Publish

- 제출 버튼을 눌러 변경사항을 반영한다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-12.png" width="100%" class="image__border">
</div>

### 2.6. Preview

- 적용된 태그가 잘 동작하는지 확인할 수 있다.
- 미리보기 버튼을 클릭한다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-13.png" width="100%" class="image__border">
</div>

<br/>

- 서비스 도메인을 입력한다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-14.png" width="100%" class="image__border">
</div>

<br/>

- 디버깅 중인 애플리케이션 화면에서 클릭 등의 이벤트를 발생시키면 미리보기 화면에서 아래와 같이 감지된다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-15.png" width="100%" class="image__border">
</div>

<br/>

- `Variables` 탭을 클릭한다.
- `Click Element`라는 변수에 페이지에 어떤 엘리먼트를 클릭했는지 확인할 수 있다.
- `Click ID`라는 변수에 `element_div`라는 값이 매칭된 것을 볼 수 있다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-16.png" width="100%" class="image__border">
</div>

<br/>

- `DataLayer` 탭을 클릭한다.
- `dataLayer` 객체가 수집한 데이터를 볼 수 있다.
- `gtm` 객체 안에 `elementId`라는 값이 포함되어 있다.
- `Click ID`라는 변수는 `gtm` 객체 안에 `elementId` 값을 추적하는 것을 확인할 수 있다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-17.png" width="100%" class="image__border">
</div>

### 3. In Google Analytics

해당 리액트 애플리케이션을 서버에 배포한 후 구글 애널리틱스에서 발생하는 이벤트들을 살펴보겠다.

- 애플리케이션 화면에서 `click` 이벤트를 3번 발생시킨다.
  - 약 1분 뒤에 `click` 이벤트 3개를 확인할 수 있다.
- `click` 이벤트에서 `element_id`가 수집됨을 확인할 수 있다.

<div align="center">
  <img src="{{ site.image_url_2023 }}/using-google-tag-manager-18.gif" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2023-03-29-using-google-tag-manager>

#### RECOMMEND NEXT POSTS

- [Custom Event in Google Tag Manager][custom-event-in-google-tag-manager-link]

#### REFERENCE

- <https://finedata.tistory.com/44>
- <https://www.joptimisemonsite.fr/google-tag-manager/>

[google-analytics-with-google-tag-manager-link]: https://junhyunny.github.io/information/data-science/google-analytics-with-google-tag-manager/
[custom-event-in-google-tag-manager-link]: https://junhyunny.github.io/information/data-science/custom-event-in-google-tag-manager/
