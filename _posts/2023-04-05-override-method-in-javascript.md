---
title: "Override Method in JavaScript"
search: false
category:
  - javascript
last_modified_at: 2023-04-05T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Google Analytics with Google Tag Manager][google-analytics-with-google-tag-manager-link]
* [Using Google Tag Manager][using-google-tag-manager-link]
* [Custom Event in Google Tag Manager][custom-event-in-google-tag-manager-link]

## 1. Requirements and Problem

어플리케이션 사용자를 관찰하기 위한 도구로 구글 애널리틱스(GA, google analytics)와 구글 태그 매니저(GTM, google tag manager)를 연계하였습니다. 
다음과 같은 요구사항들이 있었습니다. 

* 사용자 추적을 위한 UUID 발급
* 모든 사용자 이벤트에 UUID 추가

추적을 위해 발급한 UUID를 커스텀 이벤트(custom event)에 실어서 보내는 것은 어렵지 않았습니다. 
문제는 엘리먼트(element) 클릭 이벤트였습니다. 
클릭 이벤트는 태그 매니저에서 제공하는 라이브러리에 의해 자동으로 호출되기 때문에 UUID를 이벤트에 삽입하는게 까다로웠습니다. 
이를 해결하기 위해 `dataLayer` 객체의 `push` 메소드를 재정의하였습니다. 

## 2. Object.defineProperty Method

메소드를 재정의하기 위한 방법을 Object 객체의 `defineProperty` 메소드를 사용하였습니다. 
`defineProperty` 메소드는 특정 프로퍼티에 대한 게터(getter), 세터(setter)를 정의할 수 있습니다. 
아래와 같은 방식으로 기존 push 메소드를 재정의한 push 메소드로 대체하였습니다. 
코드에 대한 설명은 주석을 참고하시길 바랍니다. 
예제 코드는 브라우저 개발자 도구(F12) 콘솔에서 실행할 수 있습니다. 

```javascript
function getUUID() { 
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 3 | 8);
        return v.toString(16);
    });
}

const dataLayer = [];
const originPush = dataLayer.push.bind(dataLayer);

Object.defineProperty(dataLayer, 'push', {
    get() {
        return this.value ? this.value : originPush;
    },
    set(value) {
        this.value = value
    }
});

const overridePush = (push) => (value) => {
  push({ ...value, txId: getUUID() });
}

const customPush = overridePush(originPush);
dataLayer.push = customPush;

dataLayer.push({ event: 'Hello' });
dataLayer.push({ event: 'World' });

console.log(dataLayer);
```

##### Result

* `push` 메소드에 전달하는 객체는 `event` 밖에 없지만, 실제 저장된 데이터는 `txId` 값을 가지고 있습니다. 
* `txId` 값은 새로 정의한 `push` 메소드에 의해 자동으로 삽입됩니다. 

<p align="left">
    <img src="/images/override-method-in-javascript-1.JPG" width="50%" class="image__border">
</p>

## CLOSING

이번 포스트는 메소드를 오버라이드하는 방법에 대해서만 정리하였습니다. 
다음 포스트에서 사용자 추적을 위해 오버라이드한 메소드를 리액트 어플리케이션에 적용한 내용을 다뤄보겠습니다. 

#### REFERENCE

* <https://ko.javascript.info/property-accessors>

[google-analytics-with-google-tag-manager-link]: https://junhyunny.github.io/information/data-science/google-analytics-with-google-tag-manager/
[using-google-tag-manager-link]: https://junhyunny.github.io/information/data-science/using-google-tag-manager/
[custom-event-in-google-tag-manager-link]: https://junhyunny.github.io/information/data-science/custom-event-in-google-tag-manager/