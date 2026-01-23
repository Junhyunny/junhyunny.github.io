---
title: "Override Method in JavaScript"
search: false
category:
  - javascript
last_modified_at: 2023-04-05T23:55:00
---

<br/>

## 1. Requirements and Problem

애플리케이션 사용자를 관찰하기 위한 도구로 구글 애널리틱스(GA, google analytics)와 구글 태그 매니저(GTM, google tag manager)를 연계하였습니다. 
다음과 같은 요구사항들이 있었습니다. 

* 사용자 추적을 위한 UUID 발급
* 모든 사용자 이벤트에 UUID 추가

추적을 위해 발급한 UUID를 커스텀 이벤트(custom event)에 실어서 보내는 것은 어렵지 않았습니다. 
문제는 엘리먼트(element) 클릭 이벤트였습니다. 
클릭 이벤트는 태그 매니저에서 제공하는 라이브러리에 의해 자동으로 호출되기 때문에 UUID를 이벤트에 삽입하는게 까다로웠습니다. 
이를 해결하기 위해 `dataLayer` 객체의 `push` 메서드를 재정의하였습니다. 

## 2. Object.defineProperty Method

메서드를 재정의하기 위한 방법을 Object 객체의 `defineProperty` 메서드를 사용하였습니다. 
`defineProperty` 메서드는 특정 프로퍼티에 대한 게터(getter), 세터(setter)를 정의할 수 있습니다. 
아래와 같은 방식으로 기존 push 메서드를 재정의한 push 메서드로 대체하였습니다. 
코드에 대한 설명은 주석을 참고하시길 바랍니다. 
예제 코드는 브라우저 개발자 도구(F12) 콘솔에서 실행할 수 있습니다. 

```javascript
// UUID를 생성합니다.
function getUUID() { 
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 3 | 8);
        return v.toString(16);
    });
}

// dataLayer 객체가 없는 경우 에러를 방지하기 위해 디폴트 배열을 지정합니다.
const dataLayer = [];
// dataLayer 객체의 원본 push 메서드를 별도 변수로 참조합니다.
const originPush = dataLayer.push.bind(dataLayer);

// Object.defineProperty 메서드를 사용해 push 메서드를 재정의합니다.
Object.defineProperty(dataLayer, 'push', {
    get() {
        // push 메서드 재정의가 정상적이지 않은 경우 원본 push 메서드를 반환합니다.
        return this.value ? this.value : originPush;
    },
    set(value) {
        this.value = value
    }
});

// 파라미터로 전달받은 push 메서드를 실행할 때 txId를 추가로 삽입하도록 변경합니다.
const overridePush = (push) => (value) => {
  push({ ...value, txId: getUUID() });
}

// 변경한 push 메서드를 dataLayer 객체에 추가합니다.
const customPush = overridePush(originPush);
dataLayer.push = customPush;

// 애플리케이션 실행 커스텀 이벤트(custom event)를 발행합니다.
dataLayer.push({ event: 'Hello' });
dataLayer.push({ event: 'World' });

console.log(dataLayer);
```

##### Result

* `push` 메서드에 전달하는 객체는 `event` 밖에 없지만, 실제 저장된 데이터는 `txId` 값을 가지고 있습니다. 
* `txId` 값은 새로 정의한 `push` 메서드에 의해 자동으로 삽입됩니다. 

<p align="left">
    <img src="/images/override-method-in-javascript-1.JPG" width="60%" class="image__border">
</p>

## CLOSING

이번 포스트는 메서드를 오버라이드하는 방법에 대해서만 정리하였습니다. 
다음 포스트에서 사용자 추적을 위해 오버라이드한 메서드를 리액트 애플리케이션에 적용한 내용을 다뤄보겠습니다. 

#### REFERENCE

* <https://ko.javascript.info/property-accessors>
