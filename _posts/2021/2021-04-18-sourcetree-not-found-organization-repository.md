---
title: "Sourcetree-Github 조직 저장소 연결 문제 해결하기"
search: false
category:
  - information
  - github
last_modified_at: 2026-01-12T09:00:00
---

<br/>

## 1. Problem

소스트리(Sourcetree)를 설치 후 깃허브(Github)의 저장소들을 클론(clone)할 때 문제가 발생했다. 

- 유효한 소스 경로 URL이 아닙니다.

<div align="center">
  <img src="/images/posts/2021/grant-sourcetree-app-01.png" width="80%" class="image__border">
</div>

<br />

분명히 존재하는 저장소인데 해당 URL을 찾지 못하는 것이 이상했다. 개인(private) 저장소들은 정상적으로 탐색되었기 때문에 조직(organization) 저장소라는 점이 수상했다. 문제 원인은 소스트리 애플리케이션이 조직에 대한 접근 승인이 되지 않았던 것이다. 

## 2. Solve the problem

다음과 같은 과정을 통해 문제를 해결할 수 있다. 우선 `Settings > Applications > Authorized OAuth Apps` 경로로 접근하여 소스트리 애플리케이션을 선택한다.

<div align="center">
  <img src="/images/posts/2021/grant-sourcetree-app-02.png" width="80%" class="image__border">
</div>

<br />

SourcetreeForWindows 이미지 아래 빨간 네모 칸에 `grant` 버튼을 눌러 해당 애플리케이션 접근을 승인한다.

<div align="center">
  <img src="/images/posts/2021/grant-sourcetree-app-03.png" width="80%" class="image__border">
</div>

<br />

애플리케이션에 대한 접근을 허가하면 소스트리에서 정상적으로 해당 레포지토리가 조회된다.

<div align="center">
  <img src="/images/posts/2021/grant-sourcetree-app-04.png" width="80%" class="image__border">
</div>

#### RECOMMEND NEXT POSTS

- [SourcetreeForMac public data only problem on GitHub][source-tree-for-mac-read-only-authentication-problem-link]

[source-tree-for-mac-read-only-authentication-problem-link]: https://junhyunny.github.io/information/source-tree-for-mac-read-only-authentication-problem/