---
title: "GMT and UTC"
search: false
category:
  - information
last_modified_at: 2022-11-05T23:55:00
---

<br/>

## 0. 들어가면서

여태 경험했던 프로젝트들은 모두 타임존(timezone)과 관련된 이슈나 고민 거리가 없었습니다. 
이번에 글로벌 서비스 개발에 참여하면서 시간 도메인에 대한 관심이 크게 높아졌습니다. 
타임존 관련된 이슈 글들을 찾아보거나 사용할 데이터베이스의 타임존 설정, 애플리케이션에서 타임존을 다루는 방법 등을 공부하면서 배운 지식들을 하나씩 정리해보려 합니다. 
첫 포스트는 `GMT`, `UTC` 관련된 내용입니다.

## 1. GMT(Greenwich Mean Time)

`GMT(Greenwich Mean Time)`은 영국 런던 그리니치 천문대를 기점, 뉴질랜드 웰링톤을 종점으로 설정한 기준 시간대입니다. 
1925년 2월 5일부터 사용했고, 1972년 1월 1일까지 세계 표준 시간으로 사용되었습니다. 
각 나라의 지역 시간(local time)은 `GMT`를 기준으로 표현할 수 있습니다. 
그리니치 천문대 경도를 `0.00`으로 기준 삼아서 경도가 15도 차이날 때마다 1시간 씩 더하거나 빼는 식으로 시간을 계산합니다. 
`GMT`을 기준으로 각 지역 시간을 계산하는 방법을 먼저 살펴보겠습니다.

### 1.1. GMT 기준 타임존 계산 방법

세계 각국의 타임존인 로컬 시간은 해당 지역의 경도 값을 사용하여 계산합니다. 
하루는 24시간, 지구의 경도는 360도를 기준으로 그리니치 천문대와 경도가 차이나는 정도를 계산합니다. 
실제 서울 시간을 이렇게 계산하진 않지만, 경도를 기준으로 계산해보겠습니다. 

경도가 `126°` 서울 시간을 GMT 시간으로 환산하면 계산하면 다음과 같습니다.

* 126 X 24 / 360 = 8.4
    * `GMT`를 기준으로 8.4시간 빠르다는 의미입니다. 
* `GMT+8.4` = 서울 시간
    * `GMT` 시간을 기준으로 8.4시간을 더하면 서울 시간입니다.
* 영국 런던이 11월 5일 오전 1시라면 서울은 11월 5일 오전 9시 24분입니다. 

### 1.2. GMT 기준 세계 지역별 시간대

`GMT`를 기준으로 다음과 같은 시차를 가집니다. 

* `GMT` 시간이 `2022-11-05 00:00:00`이라고 가정합니다. 
* 알래스카 시간은 9시간 느린 `2022-11-04 15:00:00`입니다.
* 서울 시간은 9시간 빠른 `2022-11-05 09:00:00`입니다.

| Name of Time | Zone | Time |
|:---:|:---:|:---:|
| Dateline Standard Time | (GMT-12:00) | International Date Line West |
| Alaskan Standard Time | (GMT-09:00) | Alaska |
| Central Standard Time | (GMT-06:00) | Central Time (US and Canada) |
| Greenland Standard Time | (GMT-03:00) | Greenland |
| GMT Standard Time | (GMT) | Greenwich Mean Time: Dublin, Edinburgh, Lisbon, London |
| Russian Standard Time | (GMT+03:00) | Moscow, St. Petersburg, Volgograd |
| Sri Lanka Standard Time | (GMT+06:00) | Sri Jayawardenepura |
| Korea Standard Time | (GMT+09:00) | Seoul |
| New Zealand Standard Time | (GMT+12:00) | Auckland, Wellington |

## 2. UTC(Coordinated Universal Time)

협정 세계시 또는 협정 세계표준시라고 합니다. 
`GMT`는 지구의 일정하지 않은 자전 주기에 영향을 받기 때문에 이를 대체하기 위해 1972년 1월 1일부터 시행된 국제 표준 시간입니다. 
해당 표준시의 이름을 정할 때 미국은 `Coordinated Universal Time`, 프랑스는 `Temps Universel Coordoé`을 사용하길 원했고, 둘 모두에 포함된 C, T, U 를 사용해 `UTC`라는 이름으로 지정했다고 합니다. 

`UTC`는 정확한 시간 측정을 위해 원자 시계를 사용합니다. 
세슘 원자의 진동 수를 기준으로 초를 측정합니다. 
`GMT`와 발생하는 시간 차이는 윤초를 통해 보정합니다. 
`UTC`는 좀 더 정확한 시간을 제공하지만, 본질적인 기준 시간은 `GMT`와 동일합니다. 
일상에서 두 단어를 같은 의미로 사용해도 무관하지만, 기술적인 표기에는 `UTC`가 더 정확한 표현입니다. 

### 2.1. UTC 기준 세계 지역별 시간대

`UTC`의 기준 시간은 `GMT`와 동일하므로 시간대도 같습니다. 
`UTC`를 기준으로 다음과 같은 시차를 가집니다. 

| Display Name of Time Zone Option | ID of Time Zone |
|:---:|:---:|
| (UTC-12:00) International Date Line West | Etc/GMT+12 |
| (UTC-09:00) Alaska | America/Anchorage |
| (UTC-06:00) Central Time (US and Canada) | America/Chicago |
| (UTC-03:00) Greenland | America/Godthab |
| (UTC-03:00) Cayenne, Fortaleza | America/Cayenne |
| (UTC-03:00) Buenos Aires | America/Argentina/Buenos_Aires |
| (UTC-03:00) Montevideo | America/Montevideo |
| (UTC+00:00) Coordinated Universal Time | Etc/GMT |
| (UTC+03:00) Baghdad | Asia/Baghdad |
| (UTC+06:00) Astana | Asia/Almaty |
| (UTC+09:00) Seoul | Asia/Seoul |
| (UTC+12:00) Coordinated Universal Time+12 | Etc/GMT-12 |

## 3. Offset and Timezone

오프셋(offset)은 `UTC-03:00`나 `UTC+09:00`에서 `-03:00`, `+09:00`으로 표현한 `UTC`와의 시간 차이를 의미합니다. 
국가나 지역들은 자신들이 사용하는 지역 시간에 고유한 이름을 붙혀 사용하는데 이를 타임존이라고 합니다. 
예를 들어 대한민국의 타임존은 KST(Korea Standard Time), 일본의 타임존은 JST(Japan Standard Time)이라는 이름을 사용합니다. 

오프셋과 타임존의 관계는 일대다(1:N) 관계입니다. 
예를 들어 `+09:00` 오프셋 시간에 해당하는 타임존들은 다음과 같습니다. 

* South Korea - Korea Standard Time
* North Korea - Time in North Korea
* Japan - Japan Standard Time
* Russia – Yakutsk Time

각 지역 별로 타임존을 두지 않고 오프셋으로 표현하는 것이 단순해보이지만, 특정 타임존에 오프셋을 쉽게 지정할 순 없습니다. 
다음과 같은 예외 케이스들이 존재합니다. 

* 서머 타임(DST, Daylight Saving Time)
    * 해외 여러 국가에서 사용하는 시간 개념입니다.
    * 하절시에 표준시를 원래 시간보다 한 시간 앞당긴 시간을 사용합니다.
    * 서머 타임 적용은 보편적인 규칙이 있지 않고, 국가나 지역의 법에 따라 다르게 적용됩니다.
* 타임존은 변합니다. 
    * 각 지역이 어떤 타임존을 사용할 것인지 지역 혹은 국가가 법으로 결정하기 때문에 정치적, 경제적 이유로 변경될 수 있습니다.

##### 서머 타임에 따른 뉴욕 타임존 오프셋 변경

* 2022년 뉴욕은 다음과 같은 특정일을 기준으로 시간 오프셋이 변경됩니다.
    * 3월 13일 2시를 기준으로 EDT(Eastern Daylight Time)을 따라 오프셋이 `-04:00`로 변경됩니다.
    * 11월 6일 2시를 기준으로 EST(Eastern Standard Time)을 따라 오프셋이 `-05:00`로 변경됩니다.
* 2022년의 뉴욕 서머 타임 적용 시점을 다른 년도와 비교해보면 서로 다름을 알 수 있습니다.

<p align="left">
    <img src="/images/gmt-and-utc-1.JPG" width="100%" class="image__border">
</p>
<center>https://www.timeanddate.com/time/zone/usa/new-york?year=2022</center>

## 4. IANA Timezone Database

정확한 지역 시간을 계산하려면 타임존의 들쭉 날쭉한 시간 오프셋을 모두 알아야 합니다. 
이런 타임존 변경 내역을 모두 저장하고 있는 표준 데이터베이스들이 몇 가지 있지만, 가장 신뢰도가 높은 데이터베이스는 [IANA Time Zone Database][iana-time-zones-link]입니다. 
`tz database (혹은 tzdata)`라고 불리며, 전 세계 모든 지역의 표준시와 DST 변경 내역을 담고 있습니다. 
현재 역사적으로 확인할 수 있는 모든 데이터가 들어가 있으며 UNIX 시간(1970.01.01 00:00:00) 이후의 데이터에 대한 정확도를 보장합니다. 

데이터베이스에서 타임존 이름은 지역(area)/위치(location) 규칙을 사용합니다. 
지역은 Asia, America, Pacific 같은 대양명을 지정하며, 위치는 주로 국가명보다는 Seoul, Newyork 같은 큰 도시 위주로 지정됩니다. 
대한민국의 타임존은 Asia/Seoul, 일본의 경우 Asia/Tokyo 인데 두 지역 모두 `UTC+09:00`을 표준시로 사용합니다. 
하지만 역사적인 변경 내역이 다르고 현재 다른 국가이기 때문에 별도로 타임존이 관리됩니다. 

`tzdata`는 많은 개발자들과 역사학자들의 커뮤니티들에 의해 관리되고 있습니다. 
역사적 발견이 추가되거나 정부 정책이 바뀌는 경우 바로 갱신되기 때문에 신뢰도가 높습니다. 
리눅스, MacOS 같은 유닉스 기반의 운영체제나 Java, PHP 같은 유명 프로그래밍 언어들이 이미 내부적으로 사용하고 있습니다. 

#### RECOMMEND NEXT POSTS

* [Handling Timezone on JavaScript][handling-timezone-on-javascript-link]

#### REFERENCE

* [Wikipedia - 그리니치 평균시](https://ko.wikipedia.org/wiki/%EA%B7%B8%EB%A6%AC%EB%8B%88%EC%B9%98_%ED%8F%89%EA%B7%A0%EC%8B%9C)
* <https://en.wikipedia.org/wiki/UTC%2B09:00>
* <https://meetup.toast.com/posts/125>
* <https://www.iana.org/time-zones>
* <https://www.fusioo.com/guide/using-timezones>
* <https://jp.cybozu.help/general/en/admin/list_systemadmin/list_localization/timezone.html>
* <https://bobbohee.github.io/2021-01-29/what-is-utc-and-gmt>

[iana-time-zones-link]: https://www.iana.org/time-zones
[handling-timezone-on-javascript-link]: https://junhyunny.github.io/javascript/handling-timezone-on-javascript/