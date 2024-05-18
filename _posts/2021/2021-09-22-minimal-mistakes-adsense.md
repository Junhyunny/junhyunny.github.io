---
title: "How to connect to Google Adsense for GitHub Blog"
search: false
category:
  - information
last_modified_at: 2021-09-22T23:55:00
---

<br/>

## 0. 들어가면서

올해 초 시작했던 블로그에 유입되는 사용자 수가 꽤 많이 증가했다. 공부하는 내용을 정리할 겸 시작한 블로그였지만, 사용자 유입량이 늘어나니 광고를 통한 부수입 생각이 문득 들었다. `GitHub` 플랫폼을 이용하는 블로그에 광고를 연결하는 자세한 글들이 없는 것 같아 정리했다. 필자는 `minimal-mistakes` 테마를 사용하고 있으며, 같은 테마를 사용하는 분들에게 도움이 되길 바란다.

## 1. Join Google Adsense 

### 1.1. Start Google Adsense

- <https://www.google.com/intl/ko_kr/adsense/start/> 사이트로 이동한다.
- `시작하기` 버튼을 클릭한다.

<div align="center">
  <img src="/images/posts/2021/minimal-mistakes-adsense-1.png" width="100%" class="image__border">
</div>

### 1.2. Google Adsense 가입 정보 입력

- `웹사이트` 항목에 본인이 운영 중인 블로그 주소를 추가한다.
  - 중복되는 URL은 입력할 수 없어서 예시 URL으로 GitHub 주소를 사용했다.
- `이메일 주소`에는 사용 중인 구글 이메일 주소를 입력한다.
- `애드센스 정보 수신`은 직접 선택한다.
- `저장하고 계속하기` 버튼을 누른 후 기타 부가적인 정보들을 입력한다.
  - 필자는 이미 가입되어 있기 때문에 다른 화면으로 리다이렉트(redirect)됬다.

<div align="center">
  <img src="/images/posts/2021/minimal-mistakes-adsense-2.png" width="100%" class="image__border">
</div>

## 2. Add Adsense code in HTML head

### 2.1. Copy Adsense code

- 가입에 성공하면 다음과 같은 화면을 볼 수 있다.
- `애드센스 코드` 영역의 태그를 복사한다.

<div align="center">
  <img src="/images/posts/2021/minimal-mistakes-adsense-3.png" width="100%" class="image__border">
</div>

### 2.2. Paste Adsense code in /_includes/head/custom.html 

- `minimal-mistakes` 테마 블로그에 존재하는 `/_includes/head/custom.html` 파일에 복사한 태크를 추가한다.

##### custom.html

- 구글 애드센스에서 발급 받은 스크립트를 추가한다.

```html
<!-- start custom head snippets -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234123412341234" crossorigin="anonymous"></script>

<!-- insert favicons. use https://realfavicongenerator.net/ -->

<!-- end custom head snippets -->
```

### 2.3. How to find Adsense code in the site

실수로 `애드센스 코드`를 복사하지 않고 지나간 경우 이를 다시 찾아야 한다.

- `광고 > 개요 > 코드 가져오기` 링크를 누르면 다음 창이 뜨면서 다시 애드센스 코드를 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2021/minimal-mistakes-adsense-4.png" width="100%" class="image__border">
</div>

### 2.4. Change AdSense code form in case of continuous approval failure

필자는 블로그의 글들이 많았고 컨텐츠도 충분히 퀄러티가 있다고 생각했지만, 계속 승인이 거부됬다. 다음과 같은 두 작업을 추가적으로 수행하니 성공했다.

- 참조한 글에는 `/_layouts/default.html` 파일에 애드센스 코드를 추가했다고 설명되어 있어서 이를 따라했다.
  - 하지만 해당 영역은 HTML 파일의 바디(body)이므로 구글 애드센스에서 요구하는 헤드(head) 영역은 아니다.
- 애드센스 스크립트 코드를 아래와 같이 변경하여 `/_includes/head/custom.html` 파일에 추가했다.

##### custom.html 

- 구글 애드센스 객체에 필자의 클라이언트 아이디를 추가하는 스크립트로 변경 후 추가한다.

```html
<!-- start custom head snippets -->
<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({
          google_ad_client: "ca-pub-1234123412341234",
          enable_page_level_ads: true
     });
</script>

<!-- insert favicons. use https://realfavicongenerator.net/ -->

<!-- end custom head snippets -->
```

## 3. Waiting and Approval

결과가 승인되는데 1주 정도 시간이 소요된다.

- 대기 중인 사이트는 `준비 중...` 이라고 표시된다.
- 승인된 사이트는 `준비됨` 이라고 표시된다.

<div align="center">
  <img src="/images/posts/2021/minimal-mistakes-adsense-5.png" width="100%" class="image__border">
</div>

#### RECOMMEND NEXT POSTS

- [Customize Google Ads location for Github Blog][adsense-position-setting-link]

#### REFERENCE

- <https://shryu8902.github.io/jekyll/adsense/>
- <https://seungwubaek.github.io/blog/google_adsense/>
- <https://theorydb.github.io/envops/2020/04/20/envops-blog-how-to-register-google-adsense/>

[adsense-position-setting-link]: https://junhyunny.github.io/information/adsense-position-setting-minimal-mistakes/