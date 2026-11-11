---
title: "JavaScript 메서드 오버라이드"
publishedAt: "2023-04-05"
updatedAt: "2026-11-12T01:02:52+09:00"
canonicalPath: "/javascript/override-method-in-javascript/"
categories:
  - "javascript"
summary: "GTM 클릭 이벤트에 사용자 추적용 UUID를 넣기 위해 Object.defineProperty 메서드로 dataLayer 객체의 push 메서드를 재정의하는 방법을 정리했다."
---

## 1. Requirements and Problem

애플리케이션 사용자를 관찰하기 위한 도구로 구글 애널리틱스(GA, google analytics)와 구글 태그 매니저(GTM, google tag manager)를 연계했다. 요구 사항은 다음과 같았다.

- 사용자 추적을 위한 UUID 발급
- 모든 사용자 이벤트에 UUID 추가

추적을 위해 발급한 UUID를 커스텀 이벤트(custom event)에 실어서 보내는 것은 어렵지 않았다. 문제는 엘리먼트(element) 클릭 이벤트였다. 클릭 이벤트는 태그 매니저에서 제공하는 라이브러리에 의해 자동으로 호출되기 때문에 UUID를 이벤트에 삽입하는 게 까다로웠다. 이를 해결하기 위해 `dataLayer` 객체의 `push` 메서드를 재정의했다.

## 2. Object.defineProperty 메서드

메서드를 재정의하기 위해 Object 객체의 `defineProperty` 메서드를 사용했다. `defineProperty` 메서드를 사용하면 특정 프로퍼티의 게터(getter)와 세터(setter)를 정의할 수 있다. 아래 코드처럼 기존 `push` 메서드를 새로 정의한 `push` 메서드로 대체했다. 코드에 대한 설명은 주석을 참고하길 바란다. 예제 코드는 브라우저 개발자 도구(F12) 콘솔에서 실행할 수 있다.

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

실행하면 다음과 같이 `push` 메서드에는 `event` 값만 전달했지만, 실제로 저장된 데이터에는 `txId` 값이 들어 있다. `txId` 값은 새로 정의한 `push` 메서드가 자동으로 삽입한 것이다.

<div align="left">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2023/main/override-method-in-javascript-01.png" width="60%" class="image__border">
</div>

## CLOSING

이번 글에서는 메서드를 오버라이드하는 방법만 정리했다. 사용자 추적을 위해 오버라이드한 메서드를 리액트 애플리케이션에 적용한 내용은 다음 글에서 다룬다.

#### REFERENCE

- <https://ko.javascript.info/property-accessors>
