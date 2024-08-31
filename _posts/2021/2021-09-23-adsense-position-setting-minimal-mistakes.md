---
title: "Customize Google Ads location for Github Blog"
search: false
category:
  - information
last_modified_at: 2021-09-22T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [How to connect to Google Adsense for GitHub Blog][adsense-minimal-mistakes-link]

## 0. 들어가면서

`구글 애드센스(Google Adsense)`는 승인도 어렵지만, GitHub 블로그에 광고를 등록하는 일도 쉽지 않았다. 애드센스의 `자동 광고` 설정에 대한 설명을 보면 구글에서 포스트를 분석하여 적절한 위치에 광고를 넣는다고 이야기 한다. 실제 적용하면 글의 가독성이나 몰입도를 떨어뜨리는 광고가 많았다. 필자는 글의 가독성을 깨뜨리는 위치에 광고가 삽입되는 것은 원치 않았다. 광고는 부가적인 요소라 생각하기 때문에 부수적인 요소들이 포스트의 내용을 망치는 것은 좋지 않다고 판단했다. 때문에 `자동 광고` 설정 없이 광고를 만들고 포스트에 추가하는 작업을 진행했다.

## 1. Create Ads

먼저 포스트에 추가할 광고를 만들어야 한다. 다음과 같은 순서로 광고를 생성한다.

### 1.1. Select Ads Type

1. `광고 > 개요 > 광고 단위 기준`을 선택한다.
2. `신규 광고 단위 만들기` 항목 중 원하는 광고 종류를 선택한다.
  - 디스플레이 광고
  - 인피드 광고
  - 콘텐츠 내 자동 삽입 광고
  - 검색 엔진

<div align="center">
  <img src="/images/posts/2021/adsense-position-setting-minimal-mistakes-01.png" width="100%" class="image__border">
</div>

### 1.2. Set Ads Name

1. 예시로 `디스플레이 광고`를 선택한다.
1. 사각형, 수평형, 수직형인지 종류를 선택한다.
1. 이름을 작성 후 `만들기` 버튼을 누른다. 

<div align="center">
  <img src="/images/posts/2021/adsense-position-setting-minimal-mistakes-02.png" width="100%" class="image__border">
</div>

### 1.3. Check Ads Code

1. 애드센스 연결시와 동일하게 광고 코드를 받는다.
1. 받은 광고 코드를 포스트 적절한 위치에 삽입한다.

<div align="center">
  <img src="/images/posts/2021/adsense-position-setting-minimal-mistakes-03.png" width="100%" class="image__border">
</div>

### 1.4. How to find Ads code

받은 코드를 복사하지 않고 `완료` 버튼을 누르는 경우 다음과 같은 방법으로 광고 코드를 재확인할 수 있다.

- `광고 > 개요 > 광고 단위 기준` 화면에 `기존 광고 단위` 테이블에서 생성한 광고를 확인할 수 있다.
- 생성한 광고 오른쪽에 `<>` 모양의 `코드 가져오기` 버튼을 클릭한다. 

<div align="center">
  <img src="/images/posts/2021/adsense-position-setting-minimal-mistakes-04.png" width="100%" class="image__border">
</div>

## 2. Locate Ads 

`minimal-mistakes` 테마를 기준으로 포스트를 작성했다. 필자는 다음과 같은 기준으로 광고를 포스트 최상단과 최하단에 삽입했다.

- 독자의 몰입을 깨지 않도록 글 중간에 광고를 넣지 않는다.
- Home, About, Posts, Category 화면에는 광고가 나오지 않도록 한다.

내가 사용하는 테마의 포스트들은 모두 `/_layouts/single.html` 파일에 지정된 레이아웃을 따른다. 때문에 해당 HTML 파일의 메인(main) 영역 위, 아래에 광고를 넣으면 위의 두 조건을 모두 만족할 수 있었다.

##### single.html

- 글 메인 영역 위, 아래 새로 받은 광고 스크립트를 추가한다.

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

##### After re-locate Ads

- 글 위 아래 광고가 추가된다.
- 글 중간에 광고가 삽입되지 않는다..

<div align="center">
  <img src="/images/posts/2021/adsense-position-setting-minimal-mistakes-05.gif" width="100%" class="image__border">
</div>

[adsense-minimal-mistakes-link]: https://junhyunny.github.io/information/minimal-mistakes-adsense/