---
title: "Precautions Moment Timezone API"
search: false
category:
  - typescript
last_modified_at: 2022-01-01T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [GMT and UTC][gmt-and-utc-link]
* [Handling Timezone on JavaScript][handling-timezone-on-javascript-link]

## 0. 들어가면서

타임존(timezone) 비즈니스를 다루기 위해 `moment-timezone` 라이브러리를 사용하면서 겪은 경험들을 정리하였습니다. 
API가 익숙치 않은 탓에 의도치 않은 동작들이 어플리케이션 곳곳에 숨어 있었습니다. 
실제 구현체 코드 없이 간단한 테스트 코드들을 통해 관련된 내용을 정리하였습니다.

## 1. Use now method of Date Class in Moment

이 테스트는 실패해야하지만, 정상적으로 통과합니다.

* 테스트 코드 중간에서 일부러 반복문 코드를 수행합니다.
    * 시간 차이가 있음에도 불구하고 테스트가 통과합니다.
* 테스트가 통과하는 이유는 다음과 같습니다.
    * `beforeEach`에서 `Date.now()` 함수를 목(mock) 객체로 감쌉니다.
    * `moment.now()` 함수 내부에서 `Date.now()` 함수를 사용합니다.
    * 테스트에서 `moment.now()` 결과는 항상 같은 값을 반환합니다.

```ts
import moment from "moment-timezone";

describe("moment timezone tests", () => {
  beforeEach(() => {
    const now = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(now);
  });

  it("mock now method in Date class", () => {
    const firstValue = moment.now();

    for (let index = 0; index < 10000000; index++) {}

    const secondValue = moment.now();
    expect(firstValue).toEqual(secondValue);
  });
});
```

### 1.1. Pain Points

이런 유형은 다음과 같은 관점에서 좋지 않았습니다. 

* 실패하는 테스트 코드를 먼저 작성하였지만, 정상적으로 통과하였습니다. 
    * 실패하는 테스트 코드를 먼저 작성하는 이유는 해당 테스트가 검증력이 있는 여부를 확인하기 위함입니다. 
    * 이미 통과하는 테스트 코드를 작성했다면 구현체 코드의 비즈니스를 잘 검증하고 있는지 다시 확인해야 합니다.
* 테스트 스위트(test suite) 최상단 `beforeEach`에서 `Date.now()`를 오버라이딩(overriding)합니다.
    * 연관 없어 보이는 `Date.now()` 함수가 테스트에 영향을 줍니다.
    * 테스트 수가 많다면 `beforeEach`에서 `Date.now()`를 오버라이딩하는 것을 놓칠 가능성이 높습니다.
    * 테스트에서 사용할 목과 스텁(stub)은 테스트 코드에 함께 위치하여 한 눈에 파악하기 쉬워야 한다고 생각됩니다.
* 구현체 코드에 문제가 있음에도 통과하는 테스트 코드는 거짓 음성을 야기합니다.

## 2. Formatted String Date to Timestamp

문자열로 된 시간을 타임스탬프(timestamp)로 변경하고, 타임스탬프를 다시 문자열 값으로 변환하여 비교하는 단순한 테스트이지만, 수행 결과는 실패입니다. 

* `2023-01-01 11:45:00`을 런던을 타임존 기준으로 고려했을 때 타임스탬프 값을 구합니다. 
* 해당 타임스탬프 값을 그대로 다시 `YYYY-MM-DD HH:mm:ss` 형태의 시간 문자열로 변경합니다.
* 원래 값과 변경한 값을 비교합니다.

```ts
import moment from "moment-timezone";

it("formatted string date test - wrong usage", () => {
  const dateTime = "2023-01-01 11:45:00";
  const timestamp = moment(dateTime).tz("Europe/London").valueOf();

  const result = moment(timestamp)
    .tz("Europe/London")
    .format("YYYY-MM-DD HH:mm:ss");

  expect(result).toEqual(dateTime);
});
```

### 2.1. Local PC Test Result

* `moment`는 내부에서 시스템 타임존을 고려한 계산이 수행합니다. 
* 테스트를 수행한 컴퓨터 운영체제의 타임존은 현재 `Asia/Seoul`입니다.
    * `Asia/Seoul`을 기준으로 시간 오프셋이 계산됩니다. 
* `2023-01-01 11:45:00`을 `Asia/Seoul` 기준으로 먼저 판단합니다.
    * `2023-01-01 11:45:00`은 오프셋 차이가 9시간 나는 `2023-01-01 11:45:00 GMT+09:00`입니다.
* `Europe/London` 기준으로 시간을 변경하면 `2023-01-01 02:45:00 GMT+00:00`이 됩니다.
* 타임스탬프를 문자열로 변경하면 `2023-01-01 02:45:00`이 됩니다.

```
$ npm test --coverage

> action-in-blog@1.0.0 test
> jest

 FAIL  ./formatted-string-date.test.ts
  ● formatted string date test - wrong usage

    expect(received).toEqual(expected) // deep equality

    Expected: "2023-01-01 11:45:00"
    Received: "2023-01-01 02:45:00"

       9 |     .format("YYYY-MM-DD HH:mm:ss");
      10 |
    > 11 |   expect(result).toEqual(dateTime);
         |                  ^
      12 | });
      13 |

      at Object.toEqual (formatted-string-date.test.ts:11:18)

 PASS  ./mock-date.test.ts

Test Suites: 1 failed, 1 passed, 2 total
Tests:       1 failed, 1 passed, 2 total
Snapshots:   0 total
Time:        0.894 s, estimated 1 s
```

### 2.2. Docker Container Test Result

* 동일한 테스트를 도커 컨테이너에서 실행하면 성공합니다.
* 도커 컨테이너의 기본 타임존은 UTC 입니다.
* UTC는 `Europe/London`이 기준이기 때문에 `2023-01-01 11:45:00`를 `Europe/London`으로 변경하는 과정에서 시간 왜곡이 발생하지 않습니다. 

```
$ docker run --name timezone timezone

> action-in-blog@1.0.0 test
> jest

PASS ./mock-date.test.ts
PASS ./formatted-string-date.test.ts

Test Suites: 2 passed, 2 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        1.674 s
Ran all test suites.
```

### 2.3. Good and Bad Things

이 문제를 해결하면서 다음과 같은 좋았던 부분과 좋지 못한 부분들 있습니다. 

* 도커 컨테이너에서 테스트를 수행함으로써 해당 현상을 미리 발견했습니다. 
    * 배포 환경과 유사하게 테스트를 할수록 실제 구현체에서 발생할 수 있는 버그를 찾는데 도움이 됩니다.
* 처음 사용하는 API는 공식 문서를 꼭 읽어보고, 간단한 코드를 통해 사용 방법을 정확히 파악하고 사용해야겠습니다. 
* 타임존을 변경하는 코드가 곳곳에 사용되고 있어서 이를 찾아 고치는 데 시간이 오래 걸렸습니다.
    * 같은 패턴의 코드들은 적절한 추상화와 리팩토링을 통해 함수를 만들어 코드 반복과 에러 포인트를 줄일 필요가 있습니다.

### 2.4. How to Fix This Error

이 문제를 해결하려면 문자열을 변경하는 타임스탬프로 변경하는 함수에 파라미터를 하나 더 전달합니다.

* `keepLocalTime` 파라미터를 전달합니다.
    * 다른 지역의 현지 시간을 보여주기 위한 플래그입니다.
    * 해당 플래그가 `true`인 경우 전달받은 시간을 지정한 타임존의 시간으로 판단합니다. 

```ts
it("formatted string date test - correct usage", () => {
  const dateTime = "2023-01-01 11:45:00";
  const timestamp = moment(dateTime).tz("Europe/London", true).valueOf();

  const result = moment(timestamp)
    .tz("Europe/London")
    .format("YYYY-MM-DD HH:mm:ss");

  expect(result).toEqual(dateTime);
});
```

## CLOSING

이 타임존 문제에 빠져서 3~4시간을 허비했습니다. 
처음 급한 마음에 정리가 되지 않은 혼란한 코드에서 버그를 찾다보니 시간이 오래 걸렸습니다. 
이 후에 하나씩 코드를 정리해나가면서 문제 원인을 좁혀나가니 빠르게 문제가 되는 부분들을 정리해나갈 수 있었습니다. 

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-01-01-precautions-moment-timezone-api>

#### REFERENCE

* <https://momentjs.com/timezone/docs/#/using-timezones/converting-to-zone/>
* <https://stackoverflow.com/questions/57236840/how-to-change-timezone-without-changing-date-value>
* <https://stackoverflow.com/questions/72365402/issue-converting-luxon-date-to-a-selected-time-zone-from-user-cookie>

[gmt-and-utc-link]: https://junhyunny.github.io/information/gmt-and-utc/
[handling-timezone-on-javascript-link]: https://junhyunny.github.io/javascript/handling-timezone-on-javascript/