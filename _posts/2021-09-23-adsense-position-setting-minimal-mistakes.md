---
title: "GitHub 블로그 애드센스 광고 위치 설정 (feat. minimal-mistakes theme)"
search: false
category:
  - information
last_modified_at: 2021-09-22T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [GitHub 블로그 애드센스 연결 (feat. minimal-mistakes theme)][adsense-minimal-mistakes-link]

## 0. 들어가면서
`구글 애드센스(Google Adsense)` 승인도 어려웠지만, GitHub 커스텀 블로그에 광고를 등록하는 일도 쉽지 않았습니다. 
애드센스의 `자동 광고` 설정에 대한 설명을 보면 구글에서 포스트를 분석하여 적절한 위치에 광고를 삽입한다고 합니다. 
하지만, 실제 적용하면 글의 가독성이나 몰입도를 떨어뜨리는 광고가 많았습니다. 
애드센스가 승인된 이전에 운영하던 블로그를 들어가 보면 `자동 광고` 설정 때문에 다음과 같은 불편사항이 있었습니다. 

- 글 중간에 광고가 나와서 글의 몰입도와 가독성을 떨어뜨린다.

글의 가독성을 깨뜨리는 위치에 광고가 삽입되는 것은 원치 않았습니다. 
광고는 부가적인 요소라 생각하기 때문에 부수적인 요소들이 포스트의 내용을 망치는 것은 좋지 않다고 판단하였습니다. 
그렇기 때문에 `자동 광고` 설정 없이 광고를 만들고 포스트에 추가하는 작업을 진행하였습니다. 

## 1. 광고 만들기
포스트에 추가할 광고를 만들어야합니다. 
다음과 같은 순서로 광고를 생성합니다.

### 1.1. 광고 종류 선택

1. `광고 > 개요 > 광고 단위 기준`을 선택합니다.
1. `신규 광고 단위 만들기` 항목 중 원하는 광고 종류를 선택합니다.
     - 디스플레이 광고
     - 인피드 광고
     - 콘텐츠 내 자동 삽입 광고
     - 검색 엔진

<p align="center"><img src="/images/adsense-position-setting-minimal-mistakes-1.JPG" width="95%"></p>

### 1.2. 광고 이름 지정

1. 예시로 `디스플레이 광고`를 선택하였습니다.
1. 사각형, 수평형, 수직형인지 종류를 선택합니다.
1. 이름을 작성 후 `만들기` 버튼을 누릅니다. 

<p align="center"><img src="/images/adsense-position-setting-minimal-mistakes-2.JPG" width="95%"></p>

### 1.3. 광고 코드 확인

1. 애드센스 연결시와 동일하게 광고 코드를 부여받습니다.
1. 부여받은 광고 코드를 포스트 적절한 위치에 삽입합니다.

<p align="center"><img src="/images/adsense-position-setting-minimal-mistakes-3.JPG" width="95%"></p>

### 1.4. 광고 코드 재확인
- 부여받은 코드를 복사하지 않고 `완료` 버튼을 누르는 경우 광고 코드를 재확인할 수 있습니다.
- `광고 > 개요 > 광고 단위 기준` 화면에 `기존 광고 단위` 테이블에서 생성한 광고를 확인할 수 있습니다.
- 생성한 광고 오른쪽에 `<>` 모양의 `코드 가져오기` 버튼을 클릭합니다. 

<p align="center"><img src="/images/adsense-position-setting-minimal-mistakes-4.JPG" width="95%"></p>

## 2. 광고 위치 잡기
`minimal-mistakes` 테마를 기준으로 포스트를 작성하였으며, 같은 테마를 사용하시는 분들만 참조하시면 됩니다. 

이제 생성한 광고를 포스트 내 적절한 위치에 삽입하면 됩니다. 
저는 다음과 같은 기준으로 광고를 포스트 최상단과 최하단에 삽입하였습니다.

- 독자의 몰입을 깨지 않도록 글 중간에 광고를 넣지 않는다.
- Home, About, Posts, Category 화면에는 광고가 나오지 않도록 한다.

저의 경우 작성하는 포스트들은 모두 `/_layouts/single.html` 파일 형태를 따릅니다. 
그렇기 때문에 해당 HTML 파일의 메인(main) 영역 위, 아래에 광고를 넣으면 위의 두 조건을 모두 만족할 수 있었습니다.

##### /_layouts/single.html 파일

```html
---
layout: default
---

...

<div style="text-align: center;">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234123412341234"
  crossorigin="anonymous"></script>
  <ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-1234123412341234"
      data-ad-slot="1592931158"
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>
  <script>
      (adsbygoogle = window.adsbygoogle || []).push({});
  </script>
</div>

<!-- 글 메인 영역 -->
<div id="main" role="main">
  
  ...

</div>

<div style="text-align: center;">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234123412341234"
  crossorigin="anonymous"></script>
  <ins class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-1234123412341234"
      data-ad-slot="1592931158"
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>
  <script>
      (adsbygoogle = window.adsbygoogle || []).push({});
  </script>
</div>
```

##### 실제 애드센스 광고 삽입 결과

<p align="center"><img src="/images/adsense-position-setting-minimal-mistakes-5.gif" width="95%"></p>

[adsense-minimal-mistakes-link]: https://junhyunny.github.io/information/minimal-mistakes-adsense/