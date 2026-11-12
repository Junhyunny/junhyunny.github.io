---
title: "GMT와 UTC"
publishedAt: "2022-11-05"
updatedAt: "2026-11-12T16:15:57+09:00"
canonicalPath: "/information/gmt-and-utc/"
categories:
  - "information"
summary: "글로벌 서비스 개발을 계기로 GMT와 UTC의 차이, 오프셋과 타임존의 관계, IANA 타임존 데이터베이스를 정리했다."
recommendedPosts:
  - title: "Handling Timezone on JavaScript"
    href: "https://junhyunny.github.io/javascript/handling-timezone-on-javascript/"
---

## 0. 들어가면서

지금까지 경험한 프로젝트들은 모두 타임존(timezone)과 관련된 이슈나 고민거리가 없었다. 이번에 글로벌 서비스 개발에 참여하면서 시간 도메인에 대한 관심이 크게 높아졌다. 타임존 관련 이슈 글을 찾아보거나 사용할 데이터베이스의 타임존 설정, 애플리케이션에서 타임존을 다루는 방법 등을 공부하면서 배운 지식을 하나씩 정리하려 한다. 첫 글은 `GMT`, `UTC`에 관한 내용이다.

## 1. GMT(Greenwich Mean Time)

`GMT(Greenwich Mean Time)`는 영국 런던 그리니치 천문대를 기점, 뉴질랜드 웰링턴을 종점으로 설정한 기준 시간대다. 1925년 2월 5일부터 사용했고, 1972년 1월 1일까지 세계 표준시로 사용되었다. 각 나라의 지역 시간(local time)은 `GMT`를 기준으로 표현할 수 있다. 그리니치 천문대의 경도 `0.00`을 기준으로 삼아 경도가 15도 차이 날 때마다 1시간씩 더하거나 빼는 식으로 시간을 계산한다. `GMT`를 기준으로 각 지역 시간을 계산하는 방법을 먼저 살펴보자.

### 1.1. GMT 기준 타임존 계산 방법

세계 각국의 지역 시간은 해당 지역의 경도 값을 사용해 계산한다. 하루 24시간과 지구의 경도 360도를 기준으로 그리니치 천문대와 경도가 얼마나 차이 나는지 계산한다. 실제 서울 시간을 이렇게 계산하진 않지만, 경도를 기준으로 계산해 보자. 경도가 `126°`인 서울의 시간을 GMT 시간으로 환산하면 다음과 같다.

- 126 X 24 / 360 = 8.4
  - `GMT`를 기준으로 8.4시간 빠르다는 의미다.
- `GMT+8.4` = 서울 시간
  - `GMT` 시간에 8.4시간을 더하면 서울 시간이다.
- 영국 런던이 11월 5일 오전 1시라면 서울은 11월 5일 오전 9시 24분이다.

### 1.2. GMT 기준 세계 지역별 시간대

각 지역은 `GMT`를 기준으로 아래 표와 같은 시차를 가진다. 예를 들어 `GMT` 시간이 `2022-11-05 00:00:00`이라면 알래스카 시간은 9시간 느린 `2022-11-04 15:00:00`이고, 서울 시간은 9시간 빠른 `2022-11-05 09:00:00`이다.

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

`UTC`는 협정 세계시 또는 협정 세계표준시라고 한다. `GMT`는 지구의 일정하지 않은 자전 주기에 영향을 받기 때문에 이를 대체하려고 1972년 1월 1일부터 시행한 국제 표준시다. 이 표준시의 이름을 정할 때 미국은 `Coordinated Universal Time`, 프랑스는 `Temps Universel Coordonné`를 사용하길 원했고, 둘 모두에 포함된 C, T, U를 사용해 `UTC`라는 이름으로 정했다고 한다.

`UTC`는 정확한 시간 측정을 위해 원자시계를 사용한다. 세슘 원자의 진동수를 기준으로 초를 측정하고, `GMT`와 생기는 시간 차이는 윤초로 보정한다. `UTC`는 좀 더 정확한 시간을 제공하지만, 본질적인 기준 시간은 `GMT`와 같다. 일상에서 두 단어를 같은 의미로 사용해도 무관하지만, 기술적인 표기에는 `UTC`가 더 정확한 표현이다.

### 2.1. UTC 기준 세계 지역별 시간대

`UTC`의 기준 시간은 `GMT`와 같으므로 시간대도 같다. `UTC`를 기준으로 다음과 같은 시차를 가진다.

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

오프셋(offset)은 `UTC-03:00`이나 `UTC+09:00`에서 `-03:00`, `+09:00`으로 표현한 `UTC`와의 시간 차이를 의미한다. 국가나 지역은 자신들이 사용하는 지역 시간에 고유한 이름을 붙여 사용하는데 이를 타임존이라고 한다. 예를 들어 대한민국의 타임존은 KST(Korea Standard Time), 일본의 타임존은 JST(Japan Standard Time)라는 이름을 사용한다.

오프셋과 타임존은 일대다(1:N) 관계다. 예를 들어 `+09:00` 오프셋에 해당하는 타임존들은 다음과 같다.

- South Korea - Korea Standard Time
- North Korea - Time in North Korea
- Japan - Japan Standard Time
- Russia – Yakutsk Time

지역별로 타임존을 두지 않고 오프셋으로 표현하는 것이 단순해 보이지만, 특정 타임존에 오프셋을 쉽게 지정할 수는 없다. 다음과 같은 예외 사항이 있기 때문이다.

- 서머 타임(DST, Daylight Saving Time)
  - 해외 여러 국가에서 사용하는 시간 개념이다.
  - 하절기에 표준시를 원래 시간보다 한 시간 앞당긴 시간을 사용한다.
  - 서머 타임 적용에는 보편적인 규칙이 없고, 국가나 지역의 법에 따라 다르게 적용된다.
- 타임존은 변한다.
  - 각 지역이 어떤 타임존을 사용할지 지역 혹은 국가가 법으로 결정하기 때문에 정치적, 경제적 이유로 바뀔 수 있다.

예를 들어 뉴욕 타임존의 오프셋은 서머 타임에 따라 바뀐다. 2022년 뉴욕은 다음 날짜를 기준으로 시간 오프셋이 바뀐다.

- 3월 13일 2시를 기준으로 EDT(Eastern Daylight Time)를 따라 오프셋이 `-04:00`으로 바뀐다.
- 11월 6일 2시를 기준으로 EST(Eastern Standard Time)를 따라 오프셋이 `-05:00`으로 바뀐다.

2022년 뉴욕의 서머 타임 적용 시점을 다른 연도와 비교해 보면 서로 다르다는 것을 알 수 있다.

<div align="left">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/gmt-and-utc-01.png" width="100%" class="image__border">
</div>
<center>https://www.timeanddate.com/time/zone/usa/new-york?year=2022</center>

## 4. IANA Timezone Database

정확한 지역 시간을 계산하려면 타임존의 들쭉날쭉한 시간 오프셋을 모두 알아야 한다. 이런 타임존 변경 내역을 모두 저장한 표준 데이터베이스가 몇 가지 있지만, 가장 신뢰도가 높은 데이터베이스는 [IANA Time Zone Database][iana-time-zones-link]다. `tz database (혹은 tzdata)`라고 불리며, 전 세계 모든 지역의 표준시와 DST 변경 내역을 담고 있다. 역사적으로 확인할 수 있는 모든 데이터가 들어 있으며, UNIX 시간(1970.01.01 00:00:00) 이후 데이터의 정확도를 보장한다.

데이터베이스에서 타임존 이름은 지역(area)/위치(location) 규칙을 사용한다. 지역은 Asia, America, Pacific 같은 대륙명이나 대양명을 지정하며, 위치는 주로 국가명보다는 Seoul, Newyork 같은 큰 도시 위주로 지정한다. 대한민국의 타임존은 Asia/Seoul, 일본은 Asia/Tokyo인데 두 지역 모두 `UTC+09:00`을 표준시로 사용한다. 하지만 역사적인 변경 내역이 다르고 현재 다른 국가이기 때문에 타임존을 따로 관리한다.

`tzdata`는 많은 개발자와 역사학자 커뮤니티가 관리한다. 역사적 발견이 추가되거나 정부 정책이 바뀌면 바로 갱신되기 때문에 신뢰도가 높다. 리눅스, MacOS 같은 유닉스 기반 운영체제나 Java, PHP 같은 유명 프로그래밍 언어들이 이미 내부적으로 사용하고 있다.

#### REFERENCE

- [Wikipedia - 그리니치 평균시](https://ko.wikipedia.org/wiki/%EA%B7%B8%EB%A6%AC%EB%8B%88%EC%B9%98_%ED%8F%89%EA%B7%A0%EC%8B%9C)
- <https://en.wikipedia.org/wiki/UTC%2B09:00>
- <https://meetup.toast.com/posts/125>
- <https://www.iana.org/time-zones>
- <https://www.fusioo.com/guide/using-timezones>
- <https://jp.cybozu.help/general/en/admin/list_systemadmin/list_localization/timezone.html>
- <https://bobbohee.github.io/2021-01-29/what-is-utc-and-gmt>

[iana-time-zones-link]: https://www.iana.org/time-zones
