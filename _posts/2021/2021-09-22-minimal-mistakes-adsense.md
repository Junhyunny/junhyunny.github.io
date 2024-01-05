---
title: "GitHub 블로그 애드센스 연결 (feat. minimal-mistakes theme)"
search: false
category:
  - information
last_modified_at: 2021-09-22T23:55:00
---

<br/>

👉 이어서 읽기를 추천합니다.
- [GitHub 블로그 애드센스 광고 위치 설정 (feat. minimal-mistakes theme)][adsense-position-setting-link]

## 0. 들어가면서
올해 초 시작했던 이 블로그에 유입되는 사용자 수가 꽤 많이 증가했습니다. 
공부하는 내용을 정리할 겸 시작한 블로그였는데 사용자 유입량이 늘어나니 광고를 통해 부가적인 수입도 얻어볼 생각이 문득 들었습니다. 
`GitHub` 플랫폼을 이용한 블로그를 운영 중인데, 이를 위한 자세한 포스팅이 없는 것 같아서 정리하였습니다. 
저는 `minimal-mistakes` 테마를 사용하고 있으며, 같은 테마를 사용하시는 분들께 도움이 되길 바랍니다.

## 1. Google Adsense 가입하기

### 1.1. Google Adsense 시작하기
- <https://www.google.com/intl/ko_kr/adsense/start/> 사이트로 이동합니다.
- `시작하기` 버튼을 클릭합니다.

<p align="center"><img src="/images/minimal-mistakes-adsense-1.JPG" width="95%"></p>

### 1.2. Google Adsense 가입 정보 입력
- `웹사이트` 항목에 본인이 운영 중인 블로그 주소를 추가합니다.
    - 중복되는 URL은 입력할 수 없어서 예시 URL으로 GitHub 주소를 사용하였습니다.
- `이메일 주소`에는 사용 중인 구글 이메일 주소를 입력합니다.
- `애드센스 정보 수신`은 직접 선택하시길 바랍니다.
- `저장하고 계속하기` 버튼을 누른 후 기타 부가적인 정보들을 입력합니다.
    - 저의 경우 이미 가입되어 있기 때문에 다른 화면으로 리다이렉트(redirect)됩니다.

<p align="center"><img src="/images/minimal-mistakes-adsense-2.JPG" width="95%"></p>

## 2. HTML 헤드(head) 영역에 애드센스 코드 추가하기

### 2.1. 애드센스 코드 복사
- 가입에 성공하였다면 다음과 같은 화면을 볼 수 있습니다.
- `애드센스 코드` 영역의 태그를 복사합니다.

<p align="center"><img src="/images/minimal-mistakes-adsense-3.JPG" width="95%"></p>

### 2.2. /_includes/head/custom.html 파일에 애드센스 코드 붙여넣기
- `minimal-mistakes` 테마 블로그에 존재하는 `/_includes/head/custom.html` 파일에 복사한 태크를 추가합니다.

##### /_includes/head/custom.html 파일

```html
<!-- start custom head snippets -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234123412341234"
     crossorigin="anonymous"></script>

<!-- insert favicons. use https://realfavicongenerator.net/ -->

<!-- end custom head snippets -->
```

### 2.3. 사이트 애드센스 코드 다시 찾기
- 실수로 `애드센스 코드`를 복사하지 않고 지나간 경우 이를 다시 찾아야 합니다.
- `광고 > 개요 > 코드 가져오기` 링크를 누르면 다음 창이 뜨면서 다시 애드센스 코드를 확인할 수 있습니다.

<p align="center"><img src="/images/minimal-mistakes-adsense-4.JPG" width="95%"></p>

### 2.4. 지속적인 승인 실패시 애드센스 코드 양식 변경
저의 경우 블로그 포스트 양도 충분하고, 컨텐츠에도 문제가 없다고 생각했으나 지속적으로 탈락하였습니다. 
두 가지를 변경하였더니 성공하였습니다. 

- 참조한 글에는 `/_layouts/default.html` 파일에 애드센스 코드를 추가했다고 설명되어 있어서 이를 따라하였습니다.
- 하지만, 해당 영역은 HTML 파일의 바디(body)이므로 구글 애드센스에서 요구하는 헤드(head) 영역이 아닙니다.
- 애드센스 코드 양식을 아래와 같이 변경하여 `/_includes/head/custom.html` 파일에 추가하였습니다.

##### /_includes/head/custom.html 파일

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

## 3. 결과 대기와 승인
- 결과가 승인되는데 시간은 1주정도 소요됩니다.
- 대기 중인 사이트는 `준비 중...` 이라고 표시됩니다.
- 승인된 사이트는 `준비됨` 이라고 표시됩니다.

<p align="center"><img src="/images/minimal-mistakes-adsense-5.JPG" width="95%"></p>

#### REFERENCE
- <https://shryu8902.github.io/jekyll/adsense/>
- <https://seungwubaek.github.io/blog/google_adsense/>
- <https://theorydb.github.io/envops/2020/04/20/envops-blog-how-to-register-google-adsense/>

[adsense-position-setting-link]: https://junhyunny.github.io/information/adsense-position-setting-minimal-mistakes/