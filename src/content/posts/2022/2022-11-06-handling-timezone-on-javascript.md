---
title: "자바스크립트에서 타임존 다루기"
publishedAt: "2022-11-06"
updatedAt: "2026-11-12T16:17:09+09:00"
canonicalPath: "/javascript/handling-timezone-on-javascript/"
categories:
  - "javascript"
summary: "자바스크립트 Date 객체로 시간을 생성하는 방법을 살펴보고, getTimezoneOffset 함수와 Moment Timezone 라이브러리로 타임존을 적용하는 방법을 정리했다."
recommendedPosts:
  - title: "GMT and UTC"
    href: "https://junhyunny.github.io/information/gmt-and-utc/"
---

## 0. 들어가면서

공부하다가 `JavaScript`의 타임존(timezone) 지원이 다른 언어에 비해 미흡하다는 글을 읽었다. 타임존 관련 비즈니스 로직 구현이 아직 본격적으로 시작되지 않은 지금 미리 관련 이슈를 조사해 보길 잘했다는 생각이 들었다. 관련 내용을 공부할 겸 블로그에 정리하고 나중에 팀원들에게 공유하려 한다. 이번 글에선 `JavaScript`에서 타임존을 다루는 방법을 정리했다.

## 1. Timezone on JavaScript

`JavaScript`는 운영체제에 설정된 타임존을 따르게 되어 있다. 명시적으로 타임존을 변경할 방법이 없고, 브라우저마다 구현이 달라 타임존 연산이 다르게 동작할 수 있다. API 기능을 잘못 이해하고 사용하면 비즈니스에 영향을 주기 때문에 `JavaScript`에서 지원하는 시간 관련 기능을 먼저 살펴볼 필요가 있다.

## 2. Date Object in JavaScript

`JavaScript`가 기본으로 제공하는 시간 관련 기능인 `Date` 객체를 알아보자. `JavaScript`에서 날짜나 시간과 관련된 작업은 대부분 `Date` 객체를 사용한다. `ECMAScript`에 정의된 네이티브(native) 객체이며, `MDN` 문서에는 다음과 같은 설명이 있다.

> JavaScript Date objects represent a single moment in time in a platform-independent format.
> Date objects contain a Number that represents milliseconds since 1 January 1970 UTC.

`Date` 객체는 플랫폼에 독립적으로 동작할 수 있도록 특정 순간의 시간을 숫자로 저장한다. `UTC` 기준 1970년 1월 1일부터 흐른 시간을 밀리초 단위로 가지고 있으며, 이를 `유닉스 시간(UNIX epoch)`이라고 한다.

내부적으로는 유닉스 시간이라는 절댓값으로 시간 데이터를 관리하지만, `constructor`, `parse`, `getHours`, `setHours` 같은 함수는 클라이언트의 로컬 타임존에 영향을 받는다. 사용자가 입력한 데이터를 그대로 사용해 `Date` 객체를 생성하면 클라이언트의 로컬 타임존이 그대로 반영된다.

### 2.1. Create Time with Date Object

생성자로 시간 객체를 만드는 몇 가지 예시를 살펴보자. 테스트는 크롬 브라우저에서 진행했다. 만들 시간은 글을 쓰는 시점인 `2022년 11월 6일 22:00:00(UTC+09:00)`이며, 유닉스 시간으로는 `1667739600000`이다. 생성된 시간을 확인하는 데는 다음 메서드들을 사용했다.

- toString 함수 - `Date`를 나타내는 시간 문자열을 반환한다.
- toLocaleString 함수 - `Date`를 나타내는 문자열을 현재 지역의 형식으로 반환한다.
- toISOString 함수 - `Date`를 나타내는 문자열을 `ISO 8601` 확장 형식에 맞춰 반환한다.
- toUTCString 함수 - `Date`를 나타내는 문자열을 UTC 기준으로 반환한다.

#### 2.1.1. 연, 월, 일, 시, 분, 초 사용

`Date` 객체는 월(month)이 0부터 시작하기 때문에 숫자 10은 11월에 해당한다. `toString`, `toLocaleString` 함수는 `KST(Korea Standard Time)` 타임존 기준으로 시간을 출력하고, `toISOString`, `toUTCString` 함수는 `UTC` 기준으로 시간을 출력한다. `KST` 시간은 입력한 시간인 2022년 11월 6일 22시이고, `UTC` 시간은 한국 시간보다 9시간 느린 2022년 11월 6일 13시다.

```javascript
var date = new Date(2022, 10, 6, 22, 00, 00)

console.log(date) // Sun Nov 06 2022 22:00:00 GMT+0900 (한국 표준시)
console.log(date.toString()) // Sun Nov 06 2022 22:00:00 GMT+0900 (한국 표준시)
console.log(date.toLocaleString()) // 2022. 11. 6. 오후 10:00:00
console.log(date.toISOString()) // 2022-11-06T13:00:00.000Z
console.log(date.toUTCString()) // Sun, 06 Nov 2022 13:00:00 GMT
```

#### 2.1.2. 유닉스 시간 사용

유닉스 시간을 생성자에 전달해 객체를 생성한다. 일반적으로 사용자가 유닉스 시간을 입력할 일은 없지만, 서버로부터 전달받았다고 가정한다. `KST` 시간은 2022년 11월 6일 22시이고, `UTC` 시간은 한국 시간보다 9시간 느린 2022년 11월 6일 13시다.

```javascript
var date = new Date(1667739600000)

console.log(date) // Sun Nov 06 2022 22:00:00 GMT+0900 (한국 표준시)
console.log(date.toString()) // Sun Nov 06 2022 22:00:00 GMT+0900 (한국 표준시)
console.log(date.toLocaleString()) // 2022. 11. 6. 오후 10:00:00
console.log(date.toISOString()) // 2022-11-06T13:00:00.000Z
console.log(date.toUTCString()) // Sun, 06 Nov 2022 13:00:00 GMT
```

#### 2.1.3. yyyy-mm-dd hh:MM:ss 포맷 문자열 사용

자주 사용하는 `yyyy-mm-dd hh:MM:ss` 포맷의 문자열로 시간 객체를 생성한다. `KST` 시간은 입력한 시간인 2022년 11월 6일 22시이고, `UTC` 시간은 한국 시간보다 9시간 느린 2022년 11월 6일 13시다.

```javascript
var date = new Date('2022-11-06 22:00:00')

console.log(date) // Sun Nov 06 2022 22:00:00 GMT+0900 (한국 표준시)
console.log(date.toString()) // Sun Nov 06 2022 22:00:00 GMT+0900 (한국 표준시)
console.log(date.toLocaleString()) // 2022. 11. 6. 오후 10:00:00
console.log(date.toISOString()) // 2022-11-06T13:00:00.000Z
console.log(date.toUTCString()) // Sun, 06 Nov 2022 13:00:00 GMT
```

#### 2.1.4. ISO 8601 포맷 문자열 사용

가운데 `T`, 마지막에 `Z`가 붙은 문자열로 시간 객체를 생성한다. 마지막에 `Z` 문자가 붙지 않으면 `ISO 8601` 포맷으로 인식하지 않으므로 로컬 시간을 입력한 것과 같다. `ISO 8601` 포맷으로 날짜를 입력하면 UTC 시간으로 객체가 생성된다. 그래서 `UTC` 시간은 입력한 시간인 2022년 11월 6일 22시이고, `KST` 시간은 UTC 시간보다 9시간 빠른 2022년 11월 7일 7시다.

```javascript
var date = new Date('2022-11-06T22:00:00Z')

console.log(date) // Mon Nov 07 2022 07:00:00 GMT+0900 (한국 표준시)
console.log(date.toString()) // Mon Nov 07 2022 07:00:00 GMT+0900 (한국 표준시)
console.log(date.toLocaleString()) // 2022. 11. 7. 오전 7:00:00
console.log(date.toISOString()) // 2022-11-06T22:00:00.000Z
console.log(date.toUTCString()) // Sun, 06 Nov 2022 22:00:00 GMT
```

## 3. Apply Timezone

글로벌 서비스에서 타임존을 다루는 가장 쉬운 아이디어는 타임존을 고려하는 코드 영역을 최대한 제한하는 것이라고 생각한다. 예를 들어 다음과 같이 서비스를 구성하면 타임존을 고려하는 코드 영역을 최소화할 수 있다.

- 데이터베이스와 백엔드 서비스에선 시간을 `UTC` 기준으로 다룬다.
  - 시간 포맷이 아닌 유닉스 시간(밀리초)으로 데이터를 저장하고 사용한다.
- 프론트엔드 서비스는 백엔드로부터 유닉스 시간을 전달받아 사용자의 타임존으로 변환해 사용한다.
- 프론트엔드 서비스는 사용자가 입력한 값을 사용자의 타임존 기준 시간으로 생성한다.
- 프론트엔드 서비스는 시간 객체를 유닉스 시간으로 변환해 백엔드 서비스로 전달한다.

비즈니스가 단순하다면 이 정도로 정리되겠지만, 사용자가 입력한 값을 다른 타임존 기준으로 생성해야 한다면 복잡해지기 시작한다. 서울에 있는 사용자가 입력한 시간을 뉴욕 기준으로 생성하고 싶은 경우를 예로 들어 보자.

- 뉴욕과 서울의 시간 차이는 13시간이다.
  - 뉴욕의 시간 오프셋은 서머 타임(DST, Daylight Saving Time) 적용으로 인해 `-04:00`이다.
  - 서울의 시간 오프셋은 `+09:00`이다.
- 사용자는 `2022-11-05 07:45:00`이라는 문자열을 입력해 뉴욕 시간으로 2022년 11월 5일 7시 45분을 만들고 싶다.
  - `UTC` 기준으로 2022년 11월 5일 11시 45분이다.
  - `KST` 기준으로 2022년 11월 5일 20시 45분이다.
  - 유닉스 시간으로 `1667648700000`이다.

### 3.1. getTimezoneOffset 함수 사용

`Date` 객체는 타임존을 설정해 시간을 만들 수 없으므로 오프셋을 이용해 계산해야 한다. 계산 과정은 다음과 같다.

1. `getTimezoneOffset` 함수로 현재 지역의 시간 오프셋을 구한다.
  - 서울의 타임존 오프셋은 `-540`이다.
  - 단위는 분(minute)이며, 현재 시간에서 540분을 빼면 `UTC` 시간이 된다.
  - 밀리초로 계산하면 `-32400000`이다.
2. `2022-11-05 07:45:00`을 한국 시간으로 생성한 뒤 해당 시간의 유닉스 시간을 구한다.
3. 먼저 한국의 오프셋인 9시간만큼 시간을 빠르게 만든다.
4. 다음으로 뉴욕의 오프셋인 4시간만큼 시간을 빠르게 만든다.
5. 한국 시간 `2022-11-05 07:45:00`을 13시간 빠르게 만들었으므로 `2022-11-05 20:45:00`이 된다. 이는 `UTC` 시간으로 `2022-11-05 11:45:00`, 뉴욕 시간으로 `2022-11-05 07:45:00`이다.

```javascript
var newYorkOffset = 4
var hourInMilliSeconds = 60 * 60 * 1000
var minuteInMilliSeconds = 60 * 1000
var currentTimezoneOffset = new Date().getTimezoneOffset() * minuteInMilliSeconds // -32400000

var newYorkTimeInUnix = new Date('2022-11-05 07:45:00').getTime() - currentTimezoneOffset + (newYorkOffset * hourInMilliSeconds)
var koreaTime = new Date(newYorkTimeInUnix)

console.log(newYorkTimeInUnixTime) // 1667648700000
console.log(koreaTime) // Sat Nov 05 2022 20:45:00 GMT+0900 (한국 표준시)
console.log(koreaTime.toString()) // Sat Nov 05 2022 20:45:00 GMT+0900 (한국 표준시)
console.log(koreaTime.toLocaleString()) // 2022. 11. 5. 오후 8:45:00
console.log(koreaTime.toISOString()) // 2022-11-05T11:45:00.000Z
console.log(koreaTime.toUTCString()) // Sat, 05 Nov 2022 11:45:00 GMT
```

오프셋을 구해 시간을 계산하는 방법에는 다음과 같은 어려움이 있다.

- 뉴욕의 시간 오프셋을 미리 알고 있어야 계산할 수 있다.
  - 시간을 다루는 지역이 여러 곳이라면 각 지역의 시간 오프셋 정보를 모두 알아야 한다.
- 서머 타임 같은 예외 상황을 개발자가 직접 고려해야 한다.
  - 2022년 뉴욕의 서머 타임 해제는 11월 6일 2시부터 적용된다.
  - 2022년 11월 6일 2시부터는 오프셋을 `-05:00`으로 계산해야 한다.

### 3.2. Moment Timezone 라이브러리 사용

지역별 시간 오프셋을 모두 알고 있더라도 서머 타임 같은 예외 상황을 모두 고려해 시간을 계산하기는 너무 어렵다. 정확하게 시간을 계산하려면 [IANA timezone Database][iana-timezone-link]처럼 타임존 변경 내역을 모두 담고 있는 데이터베이스가 필요하다. [IANA timezone Database][iana-timezone-link]는 `tz database (혹은 tzdata)`라고 부르기도 한다. 이 `tz database`를 내장해 실제 오프셋을 정확히 계산해 주는 `JavaScript` 라이브러리가 몇 가지 있다.

- [Moment Timezone](https://momentjs.com/timezone/)
- [luxon](https://moment.github.io/luxon/#/)
- [JS-Joda](https://js-joda.github.io/js-joda/)

각 라이브러리에 관한 내용은 이번 글에선 다루지 않는다. 여기선 `Moment Timezone`을 사용해 타임존에 맞는 시간을 생성하는 방법을 알아보자. 코드는 다음 순서로 동작한다.

1. moment, moment-timezone 라이브러리를 CDN(Content Delivery Network) 서버에서 내려받는다.
2. 타임존 데이터베이스인 `moment-timezone-with-data-1970-2030` 스크립트를 추가한다.
3. `2022-11-05 07:45:00` 문자열을 뉴욕 타임존 기준 시간으로 변환한다.
4. 뉴욕 시간을 `UTC`, `KST` 기준 시간으로 변환한다.
5. 다음과 같은 방법으로 결과를 확인한다.
  - `valueOf` 함수를 이용해 유닉스 시간을 출력한다.
  - 각 시간을 `YYYY-MM-DD hh:mm:ss` 포맷 문자열로 출력한다.

```html
<!DOCTYPE html>
<html>

<head>
    <meta charset='utf-8'>
    <title>Page Title</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/moment-timezone/0.5.38/moment-timezone.min.js"></script>
    <script src="moment-timezone-with-data-1970-2030.js"></script>
</head>

<body>
    <script type="text/javascript">
        (function () {
            console.log('==================== Eastern Standard Time ====================')

            var newYorkTime = moment.tz('2022-11-05 07:45:00', 'America/New_York')
            var utcTime = newYorkTime.clone().tz('UTC')
            var seoulTime = newYorkTime.clone().tz('Asia/Seoul')

            console.log('UNIX time - ', newYorkTime.valueOf())
            console.log('NewYork - ', newYorkTime.format('YYYY-MM-DD hh:mm:ss'))
            console.log('UTC - ', utcTime.format('YYYY-MM-DD hh:mm:ss'))
            console.log('Seoul - ', seoulTime.format('YYYY-MM-DD hh:mm:ss'))

            console.log('==================== Eastern Daylight Time ====================')

            newYorkTime = moment.tz('2022-11-06 07:45:00', 'America/New_York')
            utcTime = newYorkTime.clone().tz('UTC')
            seoulTime = newYorkTime.clone().tz('Asia/Seoul')

            console.log('UNIX time - ', newYorkTime.valueOf())
            console.log('NewYork - ', newYorkTime.format('YYYY-MM-DD hh:mm:ss'))
            console.log('UTC - ', utcTime.format('YYYY-MM-DD hh:mm:ss'))
            console.log('Seoul - ', seoulTime.format('YYYY-MM-DD hh:mm:ss'))
        })();
    </script>
</body>

</html>
```

실행 결과는 다음과 같다. 11월 5일 시간은 유닉스 시간으로 `1667648700000` 밀리초가 출력된다. 서머 타임 시행 중인 11월 5일은 뉴욕 오프셋을 4시간으로, 서머 타임이 끝난 11월 6일은 5시간으로 계산했다.

```
==================== Eastern Standard Time ====================
UNIX time -  1667648700000
NewYork -  2022-11-05 07:45:00
UTC -  2022-11-05 11:45:00
Seoul -  2022-11-05 08:45:00
==================== Eastern Daylight Time ====================
UNIX time -  1667738700000
NewYork -  2022-11-06 07:45:00
UTC -  2022-11-06 12:45:00
Seoul -  2022-11-06 09:45:00
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-11-06-handling-timezone-on-javascript>

#### REFERENCE

- <https://meetup.toast.com/posts/125>
- <https://meetup.toast.com/posts/130>
- <https://ko.wikipedia.org/wiki/ISO_8601>
- <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date>
- <https://bobbyhadz.com/blog/javascript-initialize-date-with-timezone>
- <https://www.iana.org/time-zones>

[iana-timezone-link]: https://www.iana.org/time-zones
