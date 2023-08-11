---
title: "Not Found Organization Repository in Sourcetree"
search: false
category:
  - information
  - github
last_modified_at: 2021-04-18T09:00:00
---

<br/>

## 0. 들어가면서

소스트리(Sourcetree)를 설치 후 깃허브(Github)의 저장소들을 클론(clone)할 때 문제가 발생하였습니다. 

##### Warning Message

> 유효한 소스 경로 URL이 아닙니다.

<p align="center">
  <img src="/images/grant-sourcetree-app-1.JPG" width="80%" class="image__border">
</p>

## 1. Problem

분명히 존재하는 저장소인데 해당 URL을 찾지 못하는 것이 이상했습니다. 
개인(private) 저장소들은 정상적으로 탐색되었기 때문에 조직(organization) 저장소라는 점이 수상했습니다. 
문제 원인은 소스트리 어플리케이션이 조직에 대한 접근 승인이 되지 않았던 것이었습니다. 

## 2. Solve the problem

다음과 같은 과정을 통해 문제를 해결할 수 있습니다. 

##### Settings > Applications > Authorized OAuth Apps

* 해당 경로로 접근하여 소스트리 어플리케이션을 선택합니다.

<p align="center">
    <img src="/images/grant-sourcetree-app-2.JPG" width="80%" class="image__border">
</p>

##### SourcetreeForWindows

* 이미지 아래 빨간 네모 칸에 `grant` 버튼을 눌러 해당 어플리케이션 접근을 승인합니다.

<p align="center">
    <img src="/images/grant-sourcetree-app-3.JPG" width="80%" class="image__border">
</p>

##### Resolve the Problem

<p align="center">
    <img src="/images/grant-sourcetree-app-4.JPG" width="80%" class="image__border">
</p>

#### RECOMMEND NEXT POSTS

* [SourcetreeForMac public data only problem on GitHub][source-tree-for-mac-read-only-authentication-problem-link]

[source-tree-for-mac-read-only-authentication-problem-link]: https://junhyunny.github.io/information/source-tree-for-mac-read-only-authentication-problem/