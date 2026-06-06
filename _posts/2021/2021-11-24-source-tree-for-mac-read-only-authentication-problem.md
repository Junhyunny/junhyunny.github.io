---
title: "맥(Mac) Sourcetree GitHub 비공개(private) 레포지토리 접근 불가능 문제"
search: false
category:
  - information
last_modified_at: 2026-06-06T23:06:02+09:00
---

<br/>

## 1. Problem Context

새로운 회사에서 받은 맥북으로 개발 환경을 만드는 과정에서 문제가 발생했다. 난생처음 사용하는 맥북에 익숙하지 않은 탓도 컸지만, 다른 원인이 있어 보였다. 형상 관리 툴(tool)로 사용하는 소스트리(Sourcetree)가 정상적으로 동작하지 않았는데, 윈도우즈에서 발생했던 문제와는 또 달랐다. 문제 상황을 정리해 보면 다음과 같다.

- GitHub와 연동은 되었으나 공개(public) 레포지토리에만 접근할 수 있다.
- 접근 가능한 레포지토리도 클론(clone)만 가능하고, 푸시(push)에 실패한다.

맥북에서 소스트리와 GitHub 연동 시 권한이 충분히 부여되지 않는 문제가 있는 것으로 보인다. 맥북의 보안상 문제인지 원인은 확인할 수 없었다.

- `Public Data Only` 문구 확인

<div align="center">
  <img src="{{ site.image_url_2021 }}/source-tree-for-mac-read-only-authentication-problem-01.png" width="50%" class="image__border">
</div>

SourcetreeForMac 애플리케이션의 설정 및 권한 상태를 확인해보자. 설정 페이지로 이동한다.

- `오른쪽 상단 사용자 이미지 > Settings > Applications > Authorized OAuth Apps > SourcetreeForMac` 선택

<div align="left">
  <img src="{{ site.image_url_2021 }}/source-tree-for-mac-read-only-authentication-problem-02.png" width="25%" class="image__border">
</div>

<br/>

해당 애플리케이션의 권한을 확인하면 `Access public information (read-only)`라는 문구를 확인할 수 있다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/source-tree-for-mac-read-only-authentication-problem-03.png" width="100%" class="image__border">
</div>

## 2. 문제 해결

해당 문제는 GitHub 토큰(token)을 발급받아 사용하면 해결할 수 있다. 다음 과정을 통해 토큰을 발급받을 수 있다.

1. 오른쪽 상단 사용자 이미지 > Settings > Developer settings > Personal access tokens > Generate new token 선택
2. Note - 토큰 이름 지정
3. Expiration - `no expiration` 선택
4. `repo` 체크박스 선택

<div align="center">
  <img src="{{ site.image_url_2021 }}/source-tree-for-mac-read-only-authentication-problem-04.png" width="100%" class="image__border">
</div>

<br/>

발급받은 토큰을 사용해 보자. 먼저 토큰을 복사한다. 소스트리 애플리케이션의 계정 설정 화면으로 이동한 후 복사한 토큰을 암호로 사용한다.

- Sourcetree > 설정 > 계정 > 추가(혹은 편집) 선택
- 인증 방식 - 베이직(Basic)
- 사용자 이름 - GitHub User Name
- 암호 - 복사한 토큰

<div align="center">
  <img src="{{ site.image_url_2021 }}/source-tree-for-mac-read-only-authentication-problem-05.png" width="50%" class="image__border">
</div>

#### REFERENCE

- <https://community.atlassian.com/t5/Sourcetree-questions/Sourcetree-for-Mac-GitHub-account-permissions/qaq-p/961120?lightbox-message-images-961120=40149i1DE67E42DD58B647>
