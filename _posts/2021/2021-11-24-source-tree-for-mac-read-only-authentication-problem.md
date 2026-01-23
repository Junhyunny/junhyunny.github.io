---
title: "SourcetreeForMac public data only problem on GitHub"
search: false
category:
  - information
last_modified_at: 2021-11-24T23:55:00
---

<br/>

## 1. 문제 상황
새로운 회사에서 받은 맥북으로 개발 환경을 만드는 과정에서 문제가 발생했습니다. 
난생 처음 사용하는 맥북에 익숙하지 않은 탓도 컸지만, 다른 원인이 있어 보였습니다. 
형상 관리 툴(tool)로 사용하는 소스트리(Sourcetree)가 정상적으로 동작하지 않았는데, 윈도우즈에서 발생했던 문제와는 또 달랐습니다. 

문제 상황을 정리해보면 다음과 같았습니다. 
- Github와 연동은 되었으나 Public 레포지토리만 접근이 가능하다.
- 접근 가능한 레포지토리도 클론(clone)만 가능하고, 푸시(push)에 실패한다.

맥북에서 소스트리와 GitHub 연동시 권한을 충분히 부여하지 못하는 문제가 있는 것으로 보여집니다. 
맥북의 보안상의 문제인지 원인은 확인할 수 없었습니다.

##### Authorize SourcetreeForMac
- `Public Data Only` 문구 확인

<p align="center">
    <img src="/images/source-tree-for-mac-read-only-authentication-problem-1.JPG" width="50%" class="image__border">
</p>

##### Permissions - Access public information (read-only)
- `오른쪽 상단 사용자 이미지 > Settings > Applications > Authorized OAuth Apps > SourcetreeForMac` 선택

<p align="left">
    <img src="/images/source-tree-for-mac-read-only-authentication-problem-2.JPG" width="25%" class="image__border">
</p>

- 해당 애플리케이션의 권한을 확인하면 `Access public information (read-only)` 문구 확인

<p align="center">
    <img src="/images/source-tree-for-mac-read-only-authentication-problem-3.JPG" width="100%" class="image__border">
</p>

## 2. 문제 해결
해당 문제는 GitHub 토큰(token)을 발급받아 사용하면 해결할 수 있습니다.

### 2.1. 토큰 발급
- 오른쪽 상단 사용자 이미지 > Settings > Developer settings > Personal access tokens > Generate new token 선택
- Note - 토큰 이름 지정
- Expiration - `no expiration` 선택
- `repo` 체크박스 선택

<p align="center">
    <img src="/images/source-tree-for-mac-read-only-authentication-problem-4.JPG" width="100%" class="image__border">
</p>

## 2.2. 토큰 사용
- 발급받은 토큰을 복사합니다. 
- 소스트리 애플리케이션에서 Sourcetree > 설정 > 계정 > 추가(훅은 편집) 선택
- 인증 방식 - 베이직(Basic)
- 사용자 이름 - GitHub User Name
- 암호 - 복사한 토큰

<p align="center">
    <img src="/images/source-tree-for-mac-read-only-authentication-problem-5.JPG" width="50%" class="image__border">
</p>

#### REFERENCE
- <https://community.atlassian.com/t5/Sourcetree-questions/Sourcetree-for-Mac-GitHub-account-permissions/qaq-p/961120?lightbox-message-images-961120=40149i1DE67E42DD58B647>