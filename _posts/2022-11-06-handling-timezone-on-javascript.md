---
title: "Handling Timezone on JavaScript"
search: false
category:
  - javascript
last_modified_at: 2022-11-06T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [GMT and UTC][gmt-and-utc-link]

## 0. 들어가면서

공부하다보니 `JavaScript`의 타임존(timezone) 지원은 다른 언어에 비해 미흡하다는 글을 읽었습니다. 
타임존 관련된 비즈니스 로직 구현이 아직 본격적으로 시작되지 않은 현재 시점에 미리 관련된 이슈들을 조사해보길 잘했다는 생각이 들었습니다. 
관련된 내용들을 공부할 겸 블로그에 정리하고 나중에 팀원들에게 공유해야겠습니다. 
이번 포스트에선 `JavaScript`에서 타임존을 다루는 방법에 대해 정리하였습니다. 

## 1. Timezone on JavaScript

`JavaScript`는 운영체제에 설정된 타임존을 따르게 되어 있습니다. 
명시적으로 타임존을 변경할 수 있는 방법이 없고, 브라우저마다 구현이 달라 타임존 연산이 다르게 동작할 수 있습니다. 
API 기능을 잘못 이해하고 사용하면 비즈니스에 영향을 주기 때문에 `JavaScript`에서 지원하는 시간 관련된 기능에 대한 탐구가 먼저 필요합니다. 

## 2. Date Object in JavaScript

`JavaScript`가 기본적으로 제공하는 시간 관련 기능인 `Date` 객체에 대해 알아보겠습니다. 
`JavaScript`에서 날짜나 시간과 관련된 작업은 대부분 `Date` 객체를 사용합니다. 
`ECMAScript`에 정의된 네이티브(native) 객체이며 `MDN` 문서를 보면 다음과 같은 설명을 볼 수 있습니다. 

> JavaScript Date objects represent a single moment in time in a platform-independent format. 
> Date objects contain a Number that represents milliseconds since 1 January 1970 UTC. 

`Date` 객체는 플랫폼에 독립적으로 동작할 수 있도록 특정 순간의 시간을 숫자로 저장하고 있습니다. 
`UTC` 기준 1970년 1월 1일부터 흐른 시간을 밀리 초 단위로 지니고 있습니다. 
이를 `유닉스 시간(UNIX epoch)`이라고 합니다. 

내부적으로 유닉스 시간이라는 절대값으로 시간 데이터를 관리하지만, `constructor`, `parse`, `getHour`, `setHour` 같은 함수는 클라이언트의 로컬 타임존에 영향을 받습니다. 
사용자가 입력한 데이터를 그대로 사용해 `Date` 객체를 생성하면 클라이언트의 로컬 타임존을 그대로 반영하게 됩니다. 

### 2.1. Create Time with Date Object

생성자를 통해 시간 객체를 만드는 몇 개의 예시들을 살펴보겠습니다. 
크롬 브라우저에서 테스트를 진행하였습니다. 
만들 시간은 현재 글을 쓰는 시점인 `2022년 11월 6일 22:00:00(UTC+09:00)`입니다. 
유닉스 시간으로 `1667739600000`입니다. 

생성된 시간을 확인하는 방법으로 다음 메소드들을 사용하였습니다. 

* toString 함수 - `Date`를 나타내는 시간 문자열을 반환합니다.
* toLocaleString 함수 - `Date`를 나타내는 문자열을 현재 지역의 형식으로 반환합니다.
* toISOString 함수 - `Date`를 나타내는 문자열을 `ISO 8601` 확장 형식에 맞춰 반환합니다.
* toUTCString 함수 - `Date`를 나타내는 문자열을 UTC 기준으로 반환합니다.

#### 2.1.1. 년, 월, 일, 시, 분, 초 사용

* `Date` 객체는 월(month)이 0부터 시작하기 때문에 숫자 10은 11월에 해당합니다.
* 다음 함수들은 `KST(Korea Standard Time)` 타임존 기준으로 시간이 출력됩니다.
    * toString
    * toLocaleString
* 다음 함수들은 `UTC` 기준으로 시간이 출력됩니다.
    * toISOString
    * toUTCString
* `KST` 시간은 입력 받은 시간인 2022년 11월 6일 22시입니다.
* `UTC` 시간은 한국 시간보다 9시간 느린 2022년 11월 6일 13시입니다.

```javascript
var date = new Date(2022, 10, 6, 22, 00, 00)

console.log(date) // Sun Nov 06 2022 22:00:00 GMT+0900 (한국 표준시)
console.log(date.toString()) // Sun Nov 06 2022 22:00:00 GMT+0900 (한국 표준시)
console.log(date.toLocaleString()) // 2022. 11. 6. 오후 10:00:00
console.log(date.toISOString()) // 2022-11-06T13:00:00.000Z
console.log(date.toUTCString()) // Sun, 06 Nov 2022 13:00:00 GMT
```

#### 2.1.2. 유닉스 시간 사용

* 유닉스 시간을 생성자에 전달하여 객체를 생성합니다.
    * 일반적으로 사용자가 유닉스 시간을 입력할 일은 없지만, 서버로부터 전달받았다고 가정하겠습니다.
* `KST` 시간은 입력 받은 시간인 2022년 11월 6일 22시입니다.
* `UTC` 시간은 한국 시간보다 9시간 느린 2022년 11월 6일 13시입니다.

```javascript
var date = new Date(1667739600000)

console.log(date) // Sun Nov 06 2022 22:00:00 GMT+0900 (한국 표준시)
console.log(date.toString()) // Sun Nov 06 2022 22:00:00 GMT+0900 (한국 표준시)
console.log(date.toLocaleString()) // 2022. 11. 6. 오후 10:00:00
console.log(date.toISOString()) // 2022-11-06T13:00:00.000Z
console.log(date.toUTCString()) // Sun, 06 Nov 2022 13:00:00 GMT
```

#### 2.1.3. yyyy-mm-dd hh:MM:ss 포맷 문자열 사용

* 자주 사용하는 `yyyy-mm-dd hh:MM:ss` 포맷을 가진 문자열을 사용해 시간 객체를 생성합니다. 
* `KST` 시간은 입력 받은 시간인 2022년 11월 6일 22시입니다.
* `UTC` 시간은 한국 시간보다 9시간 느린 2022년 11월 6일 13시입니다.

```javascript
var date = new Date('2022-11-06 22:00:00')

console.log(date) // Sun Nov 06 2022 22:00:00 GMT+0900 (한국 표준시)
console.log(date.toString()) // Sun Nov 06 2022 22:00:00 GMT+0900 (한국 표준시)
console.log(date.toLocaleString()) // 2022. 11. 6. 오후 10:00:00
console.log(date.toISOString()) // 2022-11-06T13:00:00.000Z
console.log(date.toUTCString()) // Sun, 06 Nov 2022 13:00:00 GMT
```

#### 2.1.4. ISO 8601 포맷 문자열 사용

* 가운데 `T`와 마지막에 `Z` 붙는 문자열을 추가 후 시간 객체를 생성합니다.
    * 마지막에 `Z` 문자가 붙지 않으면 `ISO 8601` 포맷으로 인식하지 않으므로 로컬 시간을 입력한 것과 동일합니다. 
* `UTC` 시간은 입력 받은 시간인 2022년 11월 6일 22시입니다.
* `KST` 시간은 UTC 시간보다 9시간 빠른 2022년 11월 7일 7시입니다.
* `ISO 8601` 포맷으로 날짜를 입력하면 UTC 시간으로 객체가 생성됩니다.

```javascript
var date = new Date('2022-11-06T22:00:00Z')

console.log(date) // Mon Nov 07 2022 07:00:00 GMT+0900 (한국 표준시)
console.log(date.toString()) // Mon Nov 07 2022 07:00:00 GMT+0900 (한국 표준시)
console.log(date.toLocaleString()) // 2022. 11. 7. 오전 7:00:00
console.log(date.toISOString()) // 2022-11-06T22:00:00.000Z
console.log(date.toUTCString()) // Sun, 06 Nov 2022 22:00:00 GMT
```

## 3. Apply Timezone

글로벌 서비스에서 타임존을 다루는 가장 쉬운 아이디어는 타임존을 고려하는 코드 영역을 최대한 제한하는 것이라 생각됩니다. 
예를 들어 다음과 같이 서비스를 구성하면 타임존을 고려하는 코드 영역을 최소화할 수 있습니다.

* 데이터베이스와 백엔드 서비스에선 시간을 `UTC` 기준으로 다룹니다.
    * 시간 포맷이 아닌 유닉스 시간(밀리 초)으로 데이터를 저장하고 사용합니다.
* 프론트엔드 서비스는 백엔드로부터 유닉스 시간을 전달 받아 사용자의 타임존으로 변경하여 사용합니다.
* 프론트엔드 서비스는 사용자가 입력힌 값을 사용자의 타임존 기준 시간으로 생성합니다. 
* 프론트엔드 서비스는 시간 객체를 유닉스 시간으로 변경하여 백엔드 서비스로 전달합니다. 

비즈니스가 단순하다면 위와 같은 정도로 정리가 되겠지만, 사용자가 입력한 값을 다른 타임존 기준으로 시간 생성해야 한다면 복잡해지기 시작합니다. 
서울에 위치한 사용자가 입력한 시간을 뉴욕 기준으로 생성하고 싶은 경우를 예로 들어 보겠습니다. 

* 뉴욕과 서울의 시간 차이는 13시간입니다.
    * 뉴욕의 시간 오프셋은 서머 타임(DST, Daylight Saving Time) 적용으로 인해 `-04:00`입니다.
    * 서울의 시간 오프셋은 `+09:00`입니다.
* 사용자는 `2022-11-05 07:45:00`라는 문자열을 입력해 뉴욕 시간으로 2022년 11월 5일 7시 45분을 만들고 싶습니다. 
    * `UTC` 기준으로 2022년 11월 5일 11시 45분입니다.
    * `KST` 기준으로 2022년 11월 5일 20시 45분입니다.
    * 유닉스 시간으로 `1667648700000` 입니다.

### 3.1. getTimezoneOffset 함수 사용

`Date` 객체는 타임존을 설정하여 시간을 만들 수 없으므로 오프셋을 이용한 계산이 필요합니다.

* `getTimezoneOffset` 함수를 통해 해당 지역의 시간 오프셋을 구합니다.
    * 서울의 타임존 오프셋은 `-540`입니다.
    * 단위는 분(minute)으로 540분을 현재 시간에서 빼면 `UTC` 시간이 됩니다. 
    * 밀리 초로 계산하면 `-32400000`입니다.
* `2022-11-05 07:45:00`을 한국 시간으로 생성 후 해당 시간의 유닉스 시간을 획득합니다.
* 우선 한국의 오프셋인 9시간만큼 시간을 빠르게 만듭니다. 
* 다음 뉴욕의 오프셋인 4시간만큼 시간을 빠르게 만듭니다.
* 한국 시간 `2022-11-05 07:45:00`을 13시간 빠르게 만들었으므로 `2022-11-05 20:45:00`이 됩니다. 
* `UTC` 시간으로 `2022-11-05 11:45:00`이 됩니다.
* 뉴욕 시간으로 `2022-11-05 07:45:00`이 됩니다.

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

##### Pain Points of Using Offset 

오프셋을 획득하여 시간을 계산하는 방법은 다음과 같은 어려움이 있습니다.

* 뉴욕의 시간 오프셋을 미리 알고 있어야 계산이 가능합니다.
    * 시간을 다루는 지역이 여러 곳이라면 각 지역의 시간 오프셋 정보를 모두 알아야 합니다.
* 서머 타임 적용 같은 예외 케이스를 개발자가 직접 고려해야하는 어려움이 발생합니다. 
    * 2022년 뉴욕의 서머 타임 해지는 11월 6일 2시부터 적용됩니다. 
    * 2022년 11월 6일 2시부터 오프셋이 `-05:00`으로 계산되어야 합니다.

### 3.2. Moment Timezone 라이브러리 사용

지역 시간 별로 시간 오프셋을 모두 알고 있더라도 서머 타임 같은 예외 상황들을 모두 고려하여 시간을 계산하긴 너무 어렵습니다. 
정확한 시간 계산을 위해선 [IANA timezone Database][iana-timezone-link] 같은 타임존 변경 내역을 모두 담고 있는 데이터베이스가 필요합니다. 
[IANA timezone Database][iana-timezone-link]은 `tz database (혹은 tzdata)`라고 부르기도 합니다. 
이 `tz database`를 내장해 실제 오프셋을 정확히 계산해주는 `JavaScript` 라이브러리들이 몇 가지 존재합니다. 

* [Moment Timezone](https://momentjs.com/timezone/)
* [luxon](https://moment.github.io/luxon/#/)
* [JS-Joda](https://js-joda.github.io/js-joda/)

각 라이브러리에 대한 내용은 이번 포스트에선 다루지 않습니다. 
이번 포스트에선 `Moment Timezone`을 사용해 타임존에 맞는 시간을 생성하는 방법을 알아보겠습니다. 

* moment, moment-timezone 라이브러리를 CDN(Content Delivery Network) 서버에서 다운로드 받습니다.
* 타임존 데이터베이스인 `moment-timezone-with-data-1970-2030` 스크립트를 추가합니다.
* `2022-11-05 07:45:00` 문자열을 뉴욕 타임존 기준으로 시간으로 변경합니다.
* 뉴욕 시간을 `UTC`, `KST` 기준으로 시간을 변경합니다.
* 다음과 같은 방법으로 결과를 확인합니다.
    * `valueOf` 함수를 이용해 유닉스 시간을 출력합니다. 
    * 각 시간을 `YYYY-MM-DD hh:mm:ss` 포맷 문자열로 출력합니다.

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

##### 결과

* 유닉스 시간으로 `1667648700000` 밀리 초가 출력됩니다.
* 서머 타임 시행 중인 11월 5일은 뉴욕 오프셋을 4시간으로 계산하였습니다.
* 서머 타임이 종료된 11월 6일은 뉴욕 오프셋을 5시간으로 계산하였습니다.

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

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-11-06-handling-timezone-on-javascript>

#### REFERENCE

* <https://meetup.toast.com/posts/125>
* <https://meetup.toast.com/posts/130>
* <https://ko.wikipedia.org/wiki/ISO_8601>
* <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date>
* <https://bobbyhadz.com/blog/javascript-initialize-date-with-timezone>
* <https://www.iana.org/time-zones>

[gmt-and-utc-link]: https://junhyunny.github.io/information/gmt-and-utc/
[iana-timezone-link]: https://www.iana.org/time-zones