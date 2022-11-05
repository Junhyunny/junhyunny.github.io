---
title: "GMT and UTC"
search: false
category:
  - information
last_modified_at: 2022-11-05T23:55:00
---

<br>

## 0. 들어가면서

여태 경험했던 프로젝트들은 모두 국내 서비스였기 때문에 타임존(timezone)과 관련된 이슈나 고민 거리가 없었습니다. 
이번에 글로벌 서비스 개발에 참여하면서 타타임에 대한 관심이 크게 높아졌습니다. 
타임존 관련된 이슈 글들을 찾아보거나 사용할 데이터베이스 타임존 설정, 어플리케이션에서 타임존을 다루는 방법 등을 공부하면서 배운 지식들을 하나씩 정리해보려 합니다. 
이번 포스트는 `GMT`, `UTC` 관련된 내용을 정리하였습니다. 

## 1. GMT(Greenwich Mean Time)

`GMT(Greenwich Mean Time)`은 영국 런던 그리니치 천문대를 기점으로 뉴질랜드 웰링톤을 종점으로 설정한 기준 시간대입니다. 
1925sus 2월 5일부터 사용하기 시작했고, 1972년 1월 1일까지 세계 표준 시간으로 사용되었습니다. 

각 나라의 지역 시간(local time)은 `GMT`를 기준으로 표현할 수 있습니다. 
그리니치 천문대 경도를 `0.00`으로 기준 삼아서 경도가 15도 차이날 때마다 1시간 씩 더하거나 빼는 식으로 시간을 계산합니다. 
`GMT`을 기준으로 세계 타임존 계산 방법에 대해 먼저 알아보겠습니다.

### 1.1. GMT 타임존 계산 방법

세계 각국의 타임존인 로컬 시간은 해당 지역의 경도 값을 사용하여 계산합니다. 
하루는 24시간, 지구의 경도는 360도를 기준으로 그리니치 천문대와 경도가 차이나는 정도를 계산합니다. 

실제 서울 시간을 이렇게 계산하진 않지만, 경도를 기준으로 계산하는 예시를 간단히 알아보겠습니다. 
경도가 `126°` 서울 시간을 GMT 시간으로 환산하면 계산하면 다음과 같습니다.

* 126 X 24 / 360 = 8.4
    * `GMT`를 기준으로 8.4시간 빠르다는 의미입니다. 
* `GMT` + 8.4 = 서울 시간
    * `GMT` 시간을 기준으로 8.4시간을 더하면 서울 시간입니다.
* 영국 런던이 11월 5일 오전 1시라면 서울은 11월 5일 오전 9시 24분입니다. 

### 1.2. GMT 세계 시간대

`GMT`를 기준으로 다음과 같은 시차를 가집니다. 

* `GMT` 시간이 `2022-11-05 00:00:00`이라고 가정합니다. 
* 알래스카 시간은 `2022-11-04 15:00:00`입니다.
* 서울 시간은 `2022-11-05 09:00:00`입니다.

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
`GMT`는 지구의 일정하지 않은 자전 주기에 영향을 받기 때문에 1972년 1월 1일부터 시행된 국제 표준시간입니다. 
해당 표준시의 이름을 정할 때 미국은 `Coordinated Universal Time`, 프랑스는 `Temps Universel Coordoé`을 사용하길 원했고, 둘 모두에 포함된 C, T, U 를 사용해 `UTC`라는 이름으로 지정했다고 합니다. 

`UTC`는 정확한 시간 측정을 위해 원자 시계를 사용합니다. 
세슘 원자의 진동 수를 기준으로 초를 측정합니다. 
`GMT`와 발생하는 시간 차이는 윤초를 통해 보정합니다. 
`UTC`는 좀 더 정확한 시간을 제공 뿐 본질적인 기준 시간은 `GMT`와 동일합니다. 
일상에서 두 단어를 같은 의미로 사용해도 무관하지만, 기술적인 표기에는 `UTC`가 더 정확한 표현이라고 합니다. 

### 2.1. UTC 세계 시간대

`UTC`의 기준 시간은 `GMT`와 동일하므로 시간대도 같습니다. 
`UTC`를 기준으로 다음과 같은 시차를 가집니다. 
계산 방법은 위 `GMT`와 동일하므로 생략하였습니다. 

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

#### REFERENCE

* <https://ko.wikipedia.org/wiki/%EA%B7%B8%EB%A6%AC%EB%8B%88%EC%B9%98_%ED%8F%89%EA%B7%A0%EC%8B%9C>
* <https://meetup.toast.com/posts/125>
* <https://bobbohee.github.io/2021-01-29/what-is-utc-and-gmt>
* <https://www.fusioo.com/guide/using-timezones>
* <https://jp.cybozu.help/general/en/admin/list_systemadmin/list_localization/timezone.html>